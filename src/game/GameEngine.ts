import { GameLoop } from './GameLoop';
import { Snake } from './Snake';
import { InputManager } from './InputManager';
import { Food, FoodType } from './Food';
import { Vector2 } from './Vector2';
import { AudioManager } from './AudioManager';
import type { IGameMode } from './modes/IGameMode';
import { ClassicMode } from './modes/ClassicMode';
import type { IGameEngine, GameState } from './IGameEngine';

export class GameEngine implements IGameEngine {
    private resizeObserver: ResizeObserver;
    private loop: GameLoop;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private input: InputManager;

    public snake: Snake | null = null;
    public foods: Food[] = [];

    public score: number = 0;
    private isGameOver: boolean = false;
    public isPaused: boolean = false;

    // Config
    public width: number = 0;
    public height: number = 0;

    // Mode
    private currentMode: IGameMode;
    private currentModeName: string = 'Classic';

    // High Scores
    private highScores: Record<string, number> = {
        'Classic': 0,
        'Infinity': 0,
        'Box': 0,
        'Maze': 0
    };

    // Callbacks
    public onStateChange: ((state: GameState) => void) | null = null;

    public get isTouch(): boolean { return this.input.isTouch; }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.input = new InputManager(canvas);
        this.loop = new GameLoop(this.ctx);

        // Load High Scores
        const saved = localStorage.getItem('snakeHighScores');
        if (saved) {
            try {
                this.highScores = { ...this.highScores, ...JSON.parse(saved) };
            } catch (e) { console.error("Score load failed", e); }
        }

        // Default Mode
        this.currentMode = new ClassicMode();
        this.currentModeName = 'Classic';

        // Use ResizeObserver for robust layout tracking
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.canvas);

        // Initial call
        this.resize();

        this.loop.onUpdate = this.update;
        this.loop.onDraw = this.draw;
    }

    setMode(mode: IGameMode) {
        this.currentMode = mode;
        this.currentModeName = mode.name;
    }

    resize = () => {
        const dpr = window.devicePixelRatio || 1;
        // Use client dimensions to account for CSS layout (like headers)
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);

        if (this.snake) {
            this.snake.head.x = Math.min(this.snake.head.x, this.width);
            this.snake.head.y = Math.min(this.snake.head.y, this.height);
        }
    }

    start() {
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.snake = new Snake(this.width / 2, this.height / 2);
        this.foods = [];

        this.currentMode.init(this);
        // Spawn initial batch of food
        for (let i = 0; i < 5; i++) {
            this.spawnFood();
        }

        this.loop.start();
        this.notifyState();
    }

    pause() {
        if (!this.loop['isRunning'] || this.isGameOver) return;
        this.isPaused = true;
        this.loop.stop();
        this.notifyState();
    }

    resume() {
        if (!this.isPaused || this.isGameOver) return;
        this.isPaused = false;
        this.loop.start();
        this.notifyState();
    }

    stop() {
        this.loop.stop();
    }

    private spawnFood() {
        // Weighted Random Choice
        const r = Math.random();
        let type: FoodType = FoodType.Normal;

        if (r > 0.98) type = FoodType.Death; // 2% Death (Instant Game Over)
        else if (r > 0.93) type = FoodType.Shrink; // 5% Shrink
        else if (r > 0.80) type = FoodType.Poison; // 13% Poison (Negative Score)
        else if (r > 0.65) type = FoodType.Golden; // 15% Golden

        // Get valid spawn area from Mode (e.g. inside Box)
        const area = this.currentMode.getSpawnArea(this);
        const padding = 20; // Extra internal padding

        // Ensure spawn is within safe bounds and not blocked (e.g. by maze walls)
        let x = 0, y = 0;
        let attempts = 0;

        while (attempts < 50) {
            x = area.x + padding + Math.random() * (Math.max(1, area.width - padding * 2));
            y = area.y + padding + Math.random() * (Math.max(1, area.height - padding * 2));

            if (!this.currentMode.isPositionBlocked(new Vector2(x, y))) {
                break;
            }
            attempts++;
        }

        const food = new Food(this.width, this.height, type);
        food.position = new Vector2(x, y);
        this.foods.push(food);
    }

    private update = (deltaTime: number) => {
        if (this.isGameOver || this.isPaused || !this.snake) return;

        // Mode specific update (shrinking walls etc)
        this.currentMode.update(deltaTime, this);

        // 1. Calculate Target Angle from Input
        const targetVector = this.input.pointerPos.sub(this.snake.head);
        const distance = targetVector.mag();

        // Dynamic Speed: Increase speed based on distance to pointer
        const baseSpeed = 200;
        const targetExtraSpeed = Math.max(0, distance - 100) * 0.8;
        const targetSpeed = Math.min(500, baseSpeed + targetExtraSpeed);

        // LERP Speed for smoothness (prevent sudden jumps)
        const lerpFactor = 5;
        this.snake.speed += (targetSpeed - this.snake.speed) * deltaTime * lerpFactor;

        // Only turn if distance is significant (prevent jitter when pointer is near head)
        let targetAngle = this.snake.angle;
        if (distance > 50) {
            targetAngle = Math.atan2(targetVector.y, targetVector.x);
        }

        // 2. Update Snake
        // Check if near food for animation
        let nearFood = false;
        for (const food of this.foods) {
            if (this.snake.head.distance(food.position) < 100) {
                nearFood = true;
                break;
            }
        }
        this.snake.update(deltaTime, targetAngle, nearFood);

        // 3. Collision: Walls (Delegated to Mode)
        if (this.currentMode.checkCollision(this.snake, this.width, this.height)) {
            this.gameOver();
            return;
        }

        // 4. Update & Check Food (Expiration & Collision)
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];

            // Expiration Logic
            if (food.lifetime !== null) {
                food.age += deltaTime;
                if (food.age >= food.lifetime) {
                    this.foods.splice(i, 1);
                    continue; // Skip collision check for expired food
                }
            }

            // Collision Check
            if (this.snake.head.distance(food.position) < (food.radius + 15)) {
                const audio = AudioManager.getInstance();

                // Effects based on type
                if (food.type === FoodType.Death) {
                    audio.playGameOver();
                    this.gameOver();
                    return;
                }

                if (food.type === FoodType.Shrink) {
                    this.snake.shrink();
                    audio.playShrink();
                } else if (food.type === FoodType.Poison) {
                    audio.playPoison();
                } else if (food.type === FoodType.Golden) {
                    this.snake.grow();
                    audio.playGolden();
                } else {
                    // Normal
                    this.snake.grow();
                    audio.playEat();
                }

                // Update score
                this.score += food.value;
                if (this.score < 0) {
                    audio.playGameOver();
                    this.gameOver();
                    return;
                }

                this.currentMode.onFoodEaten(this);
                this.foods.splice(i, 1);

                this.notifyState();
            }
        }

        // 5. Always maintain at least 5 foods
        while (this.foods.length < 5) {
            this.spawnFood();
        }

        // 6. Collision: Self
        // Check segments after index 20 to avoid head hitting neck
        const segments = this.snake.getSegments(this.width, this.height);
        if (segments.length > 20) {
            for (let i = 20; i < segments.length; i += 2) { // Skip some for perf
                if (this.snake.head.distance(segments[i]) < 10) {
                    this.gameOver();
                    return;
                }
            }
        }
    }

    private draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, this.width, this.height);

        // Mode Background/Walls
        this.currentMode.draw(ctx, this);

        // Draw Food
        this.foods.forEach(food => {
            ctx.shadowBlur = 15;
            ctx.shadowColor = food.glowColor;
            ctx.fillStyle = food.color;
            ctx.beginPath();
            ctx.arc(food.position.x, food.position.y, food.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        if (!this.snake) return;

        // Draw Direction Indicator Line
        if (this.input.pressing || !this.isTouch) {
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 10]);
            ctx.moveTo(this.snake.head.x, this.snake.head.y);
            ctx.lineTo(this.input.pointerPos.x, this.input.pointerPos.y);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            ctx.stroke();

            // Draw Pointer Circle (Outline only)
            ctx.beginPath();
            ctx.arc(this.input.pointerPos.x, this.input.pointerPos.y, 10, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.stroke();

            ctx.restore();
        }

        // Draw Snake Segments
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 157, 0.4)';
        const segments = this.snake.getSegments(this.width, this.height);

        // Reverse draw (tail first) so head is on top
        for (let i = segments.length - 1; i >= 0; i--) {
            const s = segments[i];
            const isHead = i === 0;

            const drawSegmentAt = (x: number, y: number) => {
                ctx.fillStyle = isHead ? '#ffffff' : '#00ff9d';
                if (!isHead) {
                    const k = i / segments.length;
                    ctx.fillStyle = `rgba(0, 255, ${157 + k * 50}, ${1 - k * 0.5})`;
                }

                ctx.beginPath();
                const r = isHead ? 12 : 10 - (i / segments.length) * 4;

                if (isHead) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.snake!.angle);
                    const mouthAngle = 0.2 + (this.snake!.mouthOpenVal * 0.5);
                    ctx.arc(0, 0, r, mouthAngle, -mouthAngle, false);
                    ctx.lineTo(0, 0);
                    ctx.closePath();
                    ctx.fill();

                    const eyeOffset = 6;
                    const eyeSep = 6;
                    ctx.fillStyle = 'black';
                    const blinkScale = this.snake!.eyeOpenVal;
                    ctx.beginPath();
                    ctx.ellipse(eyeOffset, -eyeSep, 3, 3 * blinkScale, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(eyeOffset, eyeSep, 3, 3 * blinkScale, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else {
                    ctx.arc(x, y, Math.max(2, r), 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // Normal Draw
            drawSegmentAt(s.x, s.y);

            // "Clone" Draw for smooth edge transitions
            const r = 20; // Safe margin
            let clones: { x: number, y: number }[] = [];

            if (s.x < r) clones.push({ x: s.x + this.width, y: s.y });
            else if (s.x > this.width - r) clones.push({ x: s.x - this.width, y: s.y });

            if (s.y < r) clones.push({ x: s.x, y: s.y + this.height });
            else if (s.y > this.height - r) clones.push({ x: s.x, y: s.y - this.height });

            clones.forEach(c => drawSegmentAt(c.x, c.y));
        }

        ctx.shadowBlur = 0;
    }

    public gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        AudioManager.getInstance().playGameOver();

        // Save High Score
        if (this.score > (this.highScores[this.currentModeName] || 0)) {
            this.highScores[this.currentModeName] = this.score;
            localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
        }

        this.stop();
        this.notifyState();
    }

    public syncUI() {
        this.notifyState();
    }

    private notifyState() {
        if (this.onStateChange) {
            this.onStateChange({
                score: this.score,
                isGameOver: this.isGameOver,
                isPlaying: this.loop['isRunning'] || this.isPaused,
                isPaused: this.isPaused,
                highScore: this.highScores[this.currentModeName] || 0,
                allHighScores: this.highScores,
                level: this.currentMode.level
            });
        }
    }

    public destroy() {
        this.stop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.input.destroy();
    }
}
