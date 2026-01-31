import { Snake } from './Snake';
import { Food } from './Food';

export interface GameState {
    score: number;
    isGameOver: boolean;
    isPlaying: boolean;
    isPaused: boolean;
    highScore: number;
    allHighScores?: Record<string, number>;
    level?: number;
}

export interface IGameEngine {
    snake: Snake | null;
    foods: Food[];
    score: number;
    width: number;
    height: number;
    isPaused: boolean;
    gameOver(): void;
    pause(): void;
    resume(): void;
    start(): void;
    stop(): void;
    syncUI(): void;
}
