import type { IGameMode } from './IGameMode';
import type { IGameEngine } from '../IGameEngine';
import type { Snake } from '../Snake';
import type { Vector2 } from '../Vector2';

export class InfinityMode implements IGameMode {
    name = "Infinity";
    description = "No walls. Go through edges.";

    init(engine: IGameEngine) {
        if (engine.snake) engine.snake.speed = 220; // Slightly faster base
    }

    update(_deltaTime: number, engine: IGameEngine) {
        if (!engine.snake) return;

        const head = engine.snake!.head;
        const w = engine.width;
        const h = engine.height;

        let teleported = false;

        if (head.x < 0) { head.x = w; teleported = true; }
        else if (head.x > w) { head.x = 0; teleported = true; }

        if (head.y < 0) { head.y = h; teleported = true; }
        else if (head.y > h) { head.y = 0; teleported = true; }

        if (teleported) {
            // Path continuity is now handled by Snake.getSegments(w, h)
        }
    }

    draw(ctx: CanvasRenderingContext2D, engine: IGameEngine) {
        // Draw Subtle boundary hints
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, engine.width, engine.height);
        ctx.setLineDash([]);
    }

    checkCollision(_snake: Snake, _width: number, _height: number): boolean {
        // No wall collision
        return false;
    }

    isPositionBlocked(_pos: Vector2): boolean {
        return false;
    }

    onFoodEaten(_engine: IGameEngine) {
        // No specific behavior
    }

    getSpawnArea(engine: IGameEngine) {
        return { x: 0, y: 0, width: engine.width, height: engine.height };
    }

}
