type UpdateCallback = (deltaTime: number) => void;
type DrawCallback = (context: CanvasRenderingContext2D) => void;

export class GameLoop {
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private animationFrameId: number | null = null;
    private context: CanvasRenderingContext2D | null = null;

    public onUpdate: UpdateCallback | null = null;
    public onDraw: DrawCallback | null = null;

    constructor(context?: CanvasRenderingContext2D) {
        if (context) this.context = context;
    }

    setContext(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private loop = () => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Seconds
        this.lastTime = currentTime;

        if (this.onUpdate) {
            this.onUpdate(deltaTime);
        }

        if (this.context && this.onDraw) {
            // Clear canvas handled by game logic usually, or here
            // this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
            this.onDraw(this.context);
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    };
}
