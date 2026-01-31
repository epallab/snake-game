import type { IGameMode } from './IGameMode';
import type { IGameEngine } from '../IGameEngine';
import { Snake } from '../Snake';
import { Vector2 } from '../Vector2';

export class ClassicMode implements IGameMode {
    name = "Classic";
    description = "Traditional walls. Speed increases over time.";

    init(engine: IGameEngine) {
        // Reset speed
        if (engine.snake) engine.snake.speed = 200;
    }

    update(deltaTime: number, engine: IGameEngine) {
        // Increase difficulty based on score
        if (engine.snake) {
            // Base speed 200, +5 for every 100 points
            const speedBoost = Math.floor(engine.score / 100) * 5;
            engine.snake.speed = 200 + speedBoost;
        }
    }

    draw(ctx: CanvasRenderingContext2D, engine: IGameEngine) {
        // Draw Boundary Walls
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.strokeRect(5, 5, engine.width - 10, engine.height - 10);
    }

    checkCollision(snake: Snake, width: number, height: number): boolean {
        const pad = 10;
        // Wall Collision
        if (snake.head.x < pad || snake.head.x > width - pad ||
            snake.head.y < pad || snake.head.y > height - pad) {
            return true;
        }
        return false;
    }

    isPositionBlocked(pos: Vector2): boolean {
        return false;
    }

    onFoodEaten(engine: IGameEngine) {
        // Classic just grows, logic handled in engine usually or here?
        // Engine handles basic score/growth. Mode handles side effects.
    }

    getSpawnArea(engine: IGameEngine) {
        return { x: 0, y: 0, width: engine.width, height: engine.height };
    }
}
