import type { IGameMode } from './IGameMode';
import type { IGameEngine } from '../IGameEngine';
import type { Snake } from '../Snake';
import { Vector2 } from '../Vector2';
import { AudioManager } from '../AudioManager';

export class MazeMode implements IGameMode {
    name = "Maze";
    description = "Procedural maze. Navigate carefully!";

    private grid: boolean[][] = []; // true = wall, false = empty
    public level: number = 1;
    private foodsEatenInLevel: number = 0;
    private foodsPerLevel: number = 5;

    private cellSize: number = 80;
    private cols: number = 0;
    private rows: number = 0;

    init(engine: IGameEngine) {
        this.level = 1;
        this.foodsEatenInLevel = 0;
        this.cellSize = 80;
        this.generateMaze(engine.width, engine.height);
        if (engine.snake) {
            engine.snake.speed = 180;
            // Start in the empty center
            engine.snake.head = new Vector2(engine.width / 2, engine.height / 2);
            engine.snake.path = [];
            for (let i = 0; i < 50; i++) {
                engine.snake.path.push(engine.snake.head.clone());
            }
        }
    }

    private generateMaze(width: number, height: number, snakePos?: Vector2) {
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);

        // Initialize all as walls
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(true));

        // Define Safe areas to clear
        const isSafe = (r: number, c: number) => {
            // 1. Center Void (Safe Area) - Larger center for start
            const centerX = Math.floor(this.cols / 2);
            const centerY = Math.floor(this.rows / 2);
            const startRange = 2;
            if (r >= centerY - startRange && r <= centerY + startRange &&
                c >= centerX - startRange && c <= centerX + startRange) return true;

            // 2. Area around current snake (Prevent spawn kill)
            if (snakePos) {
                const sc = Math.floor(snakePos.x / this.cellSize);
                const sr = Math.floor(snakePos.y / this.cellSize);
                const snakeRange = 1; // 3x3 grid area
                if (r >= sr - snakeRange && r <= sr + snakeRange &&
                    c >= sc - snakeRange && c <= sc + snakeRange) return true;
            }

            return false;
        };

        // Carve out safe areas
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (isSafe(r, c)) {
                    this.grid[r][c] = false;
                }
            }
        }

        // Maze generation (skipping safe areas)
        const stack: [number, number][] = [];
        const start: [number, number] = [1, 1];
        if (this.grid[start[1]][start[0]]) {
            this.grid[start[1]][start[0]] = false;
            stack.push(start);
        } else {
            // Find a valid start point if [1,1] is safe
            outer: for (let r = 1; r < this.rows - 1; r += 2) {
                for (let c = 1; c < this.cols - 1; c += 2) {
                    if (this.grid[r][c]) {
                        this.grid[r][c] = false;
                        stack.push([c, r]);
                        break outer;
                    }
                }
            }
        }

        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const neighbors: [number, number, number, number][] = [];

            for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;

                if (nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1 &&
                    this.grid[ny][nx] && !isSafe(ny, nx)) {
                    neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
                }
            }

            if (neighbors.length > 0) {
                const [nx, ny, wx, wy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.grid[ny][nx] = false;
                this.grid[wy][wx] = false;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }

        // Open up the maze significantly
        // We want a more "sparse" field of lines rather than a dense grid
        for (let r = 1; r < this.rows - 1; r++) {
            for (let c = 1; c < this.cols - 1; c++) {
                if (isSafe(r, c)) continue;

                if (this.grid[r][c]) {
                    // Randomly remove walls to create openness
                    // Retention probability is lower now for a more open feel
                    if (Math.random() > 0.45) {
                        this.grid[r][c] = false;
                    }
                }
            }
        }

        // Final Pass: Symmetry/Connectivity cleanup
        for (let r = 1; r < this.rows - 1; r++) {
            for (let c = 1; c < this.cols - 1; c++) {
                if (this.grid[r][c]) {
                    // 1. Break 2x2 Boxes (The "closed box" the user hates)
                    if (this.grid[r + 1][c] && this.grid[r][c + 1] && this.grid[r + 1][c + 1]) {
                        this.grid[r][c] = false;
                    }

                    // 2. Remove isolated wall points (single dots)
                    const neighborCount =
                        (this.grid[r - 1][c] ? 1 : 0) + (this.grid[r + 1][c] ? 1 : 0) +
                        (this.grid[r][c - 1] ? 1 : 0) + (this.grid[r][c + 1] ? 1 : 0);

                    if (neighborCount === 0) {
                        this.grid[r][c] = false;
                    }
                }
            }
        }
    }

    update(_deltaTime: number, engine: IGameEngine) {
        if (!engine.snake) return;

        // Screen Wrapping Logic (copied from InfinityMode)
        const head = engine.snake.head;
        const w = engine.width;
        const h = engine.height;

        let teleported = false;

        if (head.x < 0) { head.x = w; teleported = true; }
        else if (head.x > w) { head.x = 0; teleported = true; }

        if (head.y < 0) { head.y = h; teleported = true; }
        else if (head.y > h) { head.y = 0; teleported = true; }

        if (teleported) {
            // Path continuity is handled by getSegments
        }
    }

    draw(ctx: CanvasRenderingContext2D, engine: IGameEngine) {
        // Draw open bounds hints (optional but helpful for "Infinity" feel)
        ctx.setLineDash([5, 15]);
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)';
        ctx.strokeRect(5, 5, engine.width - 10, engine.height - 10);
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(0, 255, 157, 0.9)';
        ctx.fillStyle = 'rgba(0, 255, 157, 0.9)';
        ctx.lineWidth = 4; // Thinner lines
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10; // Subtler glow
        ctx.shadowColor = '#00ff9d';

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c]) {
                    const x = c * this.cellSize + this.cellSize / 2;
                    const y = r * this.cellSize + this.cellSize / 2;

                    // Draw connections to connect walls into lines
                    if (c + 1 < this.cols && this.grid[r][c + 1]) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + this.cellSize, y);
                        ctx.stroke();
                    }
                    if (r + 1 < this.rows && this.grid[r + 1][c]) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + this.cellSize);
                        ctx.stroke();
                    }

                    // Draw node point
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.shadowBlur = 0;
    }

    checkCollision(snake: Snake, _width: number, _height: number): boolean {
        const head = snake.head;
        const gridX = Math.floor(head.x / this.cellSize);
        const gridY = Math.floor(head.y / this.cellSize);

        // Edge check removed to allow wrapping
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) return false;

        // If the cell has a wall node
        if (this.grid[gridY][gridX]) {
            const centerX = gridX * this.cellSize + this.cellSize / 2;
            const centerY = gridY * this.cellSize + this.cellSize / 2;

            // Check collision with the node point itself
            if (head.distance(new Vector2(centerX, centerY)) < (2 + 10)) {
                return true;
            }
        }

        // Check collision with connections (horizontal/vertical lines)
        const cellX = head.x % this.cellSize;
        const cellY = head.y % this.cellSize;
        const mid = this.cellSize / 2;
        const threshold = 2 + 8; // Half of lineWidth + margin

        // Vertical lines
        if (Math.abs(cellX - mid) < threshold) {
            // If in upper half, check connection to neighbor above
            if (cellY < mid) {
                if (gridY > 0 && this.grid[gridY][gridX] && this.grid[gridY - 1][gridX]) return true;
            } else {
                // If in lower half, check connection to neighbor below
                if (gridY < this.rows - 1 && this.grid[gridY][gridX] && this.grid[gridY + 1][gridX]) return true;
            }
        }

        // Horizontal lines
        if (Math.abs(cellY - mid) < threshold) {
            // If in left half, check connection to neighbor on the left
            if (cellX < mid) {
                if (gridX > 0 && this.grid[gridY][gridX] && this.grid[gridY][gridX - 1]) return true;
            } else {
                // If in right half, check connection to neighbor on the right
                if (gridX < this.cols - 1 && this.grid[gridY][gridX] && this.grid[gridY][gridX + 1]) return true;
            }
        }

        return false;
    }

    isPositionBlocked(pos: Vector2): boolean {
        const gridX = Math.floor(pos.x / this.cellSize);
        const gridY = Math.floor(pos.y / this.cellSize);
        if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) return true;
        return this.grid[gridY][gridX];
    }

    onFoodEaten(engine: IGameEngine) {
        this.foodsEatenInLevel++;

        if (this.foodsEatenInLevel >= this.foodsPerLevel) {
            this.level++;
            this.foodsEatenInLevel = 0;
            AudioManager.getInstance().playLevelUp();

            // Increase Difficulty - Keep it breathable
            this.cellSize = Math.max(55, this.cellSize - 8);
            if (engine.snake) {
                engine.snake.speed += 20;
            }

            // Regenerate Maze with safety around snake head
            const snakePos = engine.snake ? engine.snake.head : undefined;
            this.generateMaze(engine.width, engine.height, snakePos);
        }
    }

    getSpawnArea(engine: IGameEngine) {
        return { x: 0, y: 0, width: engine.width, height: engine.height };
    }
}
