import type { IGameMode } from './IGameMode';
import type { IGameEngine } from '../IGameEngine';
import { Snake } from '../Snake';
import { Vector2 } from '../Vector2';

export class BoxMode implements IGameMode {
    name = "Box";
    description = "Walls shrink over time!";

    private padding: number = 0;
    private shrinkRate: number = 10; // Pixels per second
    private minSize: number = 300;

    private warningTimer: number = 5; // 5 seconds warning
    private isWarning: boolean = false;

    init(engine: IGameEngine) {
        this.padding = 10;
        this.warningTimer = 5;
        this.isWarning = false;

        // Mobile Optimization: Adaptive minSize
        const minDim = Math.min(engine.width, engine.height);
        if (minDim < 600) {
            this.minSize = minDim * 0.6; // 60% of screen
            this.shrinkRate = 6; // Slower shrink for mobile
        } else {
            this.minSize = 300;
            this.shrinkRate = 10;
        }

        if (engine.snake) engine.snake.speed = 200;
    }

    update(deltaTime: number, engine: IGameEngine) {
        // Shrink logic
        const canShrink = engine.width - (this.padding * 2) > this.minSize &&
            engine.height - (this.padding * 2) > this.minSize;

        if (canShrink) {
            this.padding += this.shrinkRate * deltaTime;
        } else {
            // Reached limit
            this.isWarning = true;
            this.warningTimer -= deltaTime;

            if (this.warningTimer <= 0) {
                engine.gameOver();
                return;
            }
        }

        // Check if food touches the walls
        const p = this.padding;
        const innerPad = 20; // Safe zone margin

        engine.foods.forEach(food => {
            if (food.position.x - food.radius < p ||
                food.position.x + food.radius > engine.width - p ||
                food.position.y - food.radius < p ||
                food.position.y + food.radius > engine.height - p) {

                // Respawn inside
                const safeW = engine.width - (p * 2) - (innerPad * 2);
                const safeH = engine.height - (p * 2) - (innerPad * 2);

                const nx = p + innerPad + Math.random() * safeW;
                const ny = p + innerPad + Math.random() * safeH;

                food.position = new Vector2(nx, ny);
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D, engine: IGameEngine) {
        // Draw Shrinking Walls
        const isFlashing = this.isWarning && Math.floor(Date.now() / 250) % 2 === 0;

        ctx.shadowBlur = isFlashing ? 40 : 20;
        ctx.shadowColor = isFlashing ? '#ffffff' : '#ff0055';
        ctx.strokeStyle = isFlashing ? '#ffffff' : '#ff0055';
        ctx.lineWidth = 4;

        const x = this.padding;
        const y = this.padding;
        const w = engine.width - this.padding * 2;
        const h = engine.height - this.padding * 2;

        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        if (this.isWarning) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("BOX LIMIT REACHED!", engine.width / 2, y + 40);

            ctx.font = 'bold 48px Outfit, sans-serif';
            ctx.fillStyle = this.warningTimer < 2 ? '#ff0000' : 'white';
            ctx.fillText(Math.ceil(this.warningTimer).toString(), engine.width / 2, engine.height / 2);
        }
    }

    checkCollision(snake: Snake, width: number, height: number): boolean {
        // Check against Custom Padding
        const p = this.padding;
        if (snake.head.x < p || snake.head.x > width - p ||
            snake.head.y < p || snake.head.y > height - p) {
            return true;
        }
        return false;
    }

    isPositionBlocked(): boolean {
        return false;
    }

    onFoodEaten() {
        // Maybe expand slightly on eat?
        this.padding = Math.max(10, this.padding - 5);
    }

    getSpawnArea(engine: IGameEngine) {
        const p = this.padding;
        return {
            x: p,
            y: p,
            width: engine.width - (p * 2),
            height: engine.height - (p * 2)
        };
    }
}
