import type { IGameEngine } from '../IGameEngine';
import { Snake } from '../Snake';
import { Vector2 } from '../Vector2';

export interface IGameMode {
    name: string;
    description: string;
    level?: number;

    // Lifecycle
    init(engine: IGameEngine): void;
    update(deltaTime: number, engine: IGameEngine): void;
    draw(ctx: CanvasRenderingContext2D, engine: IGameEngine): void;

    // Rules
    checkCollision(snake: Snake, width: number, height: number): boolean; // Returns true if dead
    isPositionBlocked(pos: Vector2): boolean; // For obstacles like maze walls
    onFoodEaten(engine: IGameEngine): void;
    getSpawnArea(engine: IGameEngine): { x: number, y: number, width: number, height: number };
}
