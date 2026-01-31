import { Vector2 } from './Vector2';

export class InputManager {
    pointerPos: Vector2;
    pressing: boolean;
    isTouch: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const rect = canvas.getBoundingClientRect();
        this.pointerPos = new Vector2(rect.width / 2, rect.height / 2);
        this.pressing = false;

        this.initListeners();
    }

    private handleMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerPos.x = e.clientX - rect.left;
        this.pointerPos.y = e.clientY - rect.top;
        this.pressing = true;
        this.isTouch = false;
    };

    private handleTouchMove = (e: TouchEvent) => {
        this.isTouch = true;
        const target = e.target as HTMLElement;
        const isScrollable = target.closest('.menu-card, .guide-content');

        if (!isScrollable) {
            e.preventDefault();
        }

        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.pointerPos.x = e.touches[0].clientX - rect.left;
            this.pointerPos.y = e.touches[0].clientY - rect.top;
            this.pressing = true;
        }
    };

    private handleTouchStart = (e: TouchEvent) => {
        this.isTouch = true;
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.pointerPos.x = e.touches[0].clientX - rect.left;
            this.pointerPos.y = e.touches[0].clientY - rect.top;
            this.pressing = true;
        }
    };

    private handleTouchEnd = () => {
        this.pressing = false;
    };

    private initListeners() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        window.addEventListener('touchstart', this.handleTouchStart);
        window.addEventListener('touchend', this.handleTouchEnd);
    }

    public destroy() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('touchmove', this.handleTouchMove);
        window.removeEventListener('touchstart', this.handleTouchStart);
        window.removeEventListener('touchend', this.handleTouchEnd);
    }
}
