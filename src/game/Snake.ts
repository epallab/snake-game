import { Vector2 } from './Vector2';

export class Snake {
    head: Vector2;
    velocity: Vector2;
    speed: number = 200; // Pixels per second
    angle: number = 0;
    turnSpeed: number = 5; // Radians per second

    // Path History
    path: Vector2[] = [];
    pathResolution: number = 5; // Distance between recorded points

    // Body
    length: number = 5; // Number of segments
    segmentGap: number = 20; // Distance between segments visually

    // Animation State
    mouthOpenVal: number = 0; // 0 = closed, 1 = open
    eyeOpenVal: number = 1; // 1 = open, 0 = closed (blink)
    blinkTimer: number = 0;

    constructor(startX: number, startY: number) {
        this.head = new Vector2(startX, startY);
        this.velocity = new Vector2(1, 0).scale(this.speed);
        // Initialize path with stationary points
        for (let i = 0; i < 100; i++) {
            this.path.push(new Vector2(startX - i, startY));
        }
    }

    update(deltaTime: number, targetAngle?: number, nearFood: boolean = false) {
        // Animation: Blinking
        this.blinkTimer -= deltaTime;
        if (this.blinkTimer <= 0) {
            // Random next blink
            this.blinkTimer = Math.random() * 3 + 2;
            this.eyeOpenVal = 0; // Close eyes
        }
        // Return expression
        if (this.eyeOpenVal < 1) {
            this.eyeOpenVal += deltaTime * 10; // Open speed
            if (this.eyeOpenVal > 1) this.eyeOpenVal = 1;
        }

        // Animation: Mouth
        const targetMouth = nearFood ? 1 : 0;
        this.mouthOpenVal += (targetMouth - this.mouthOpenVal) * deltaTime * 10;

        // 1. Update Direction
        if (targetAngle !== undefined) {
            // Smooth rotation towards target angle
            let diff = targetAngle - this.angle;
            // Normalize to -PI..PI
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            const turnStep = this.turnSpeed * deltaTime;
            if (Math.abs(diff) < turnStep) {
                this.angle = targetAngle;
            } else {
                this.angle += Math.sign(diff) * turnStep;
            }
        }

        this.velocity = new Vector2(Math.cos(this.angle), Math.sin(this.angle)).scale(this.speed);

        // 2. Move Head
        const moveStep = this.velocity.scale(deltaTime);
        this.head = this.head.add(moveStep);

        // 3. Record Path
        // Only record if we moved enough from the last point
        if (this.path.length > 0) {
            const lastPoint = this.path[0];
            const dist = this.head.distance(lastPoint);

            // If the distance is huge, it's a wrap. 
            // We record it as it is, but getSegments will handle the gap.
            if (dist >= this.pathResolution) {
                this.path.unshift(this.head.clone());
                // Limit path size
                const maxPathPoints = (this.length * this.segmentGap) / this.pathResolution + 50;
                if (this.path.length > maxPathPoints) {
                    this.path.pop();
                }
            }
        } else {
            this.path.push(this.head.clone());
        }
    }

    getSegments(width?: number, height?: number): Vector2[] {
        const segments: Vector2[] = [];
        segments.push(this.head.clone());

        for (let i = 1; i < this.length; i++) {
            const targetDist = i * this.segmentGap;
            let found = false;
            let dAccum = 0;

            const processPair = (pA: Vector2, pB: Vector2) => {
                let d = pA.distance(pB);

                // Handle Wrap Jump
                if (width && height && d > Math.min(width, height) / 2) {
                    // This is a teleport gap. 
                    // Calculate virtual distance as if it didn't wrap
                    let dx = Math.abs(pA.x - pB.x);
                    let dy = Math.abs(pA.y - pB.y);
                    if (dx > width / 2) dx = width - dx;
                    if (dy > height / 2) dy = height - dy;
                    d = Math.sqrt(dx * dx + dy * dy);
                }

                if (dAccum + d >= targetDist) {
                    const t = (targetDist - dAccum) / (d || 1);

                    // Virtual LERP for wrapping
                    let targetPos: Vector2;
                    if (width && height && pA.distance(pB) > Math.min(width, height) / 2) {
                        // Wrapping LERP
                        let x1 = pA.x, y1 = pA.y;
                        let x2 = pB.x, y2 = pB.y;

                        if (Math.abs(x1 - x2) > width / 2) {
                            if (x1 < x2) x1 += width; else x2 += width;
                        }
                        if (Math.abs(y1 - y2) > height / 2) {
                            if (y1 < y2) y1 += height; else y2 += height;
                        }

                        const virtX = x1 + (x2 - x1) * t;
                        const virtY = y1 + (y2 - y1) * t;
                        targetPos = new Vector2(virtX % width, virtY % height);
                        // Ensure positive
                        if (targetPos.x < 0) targetPos.x += width;
                        if (targetPos.y < 0) targetPos.y += height;
                    } else {
                        targetPos = pA.lerp(pB, t);
                    }

                    segments.push(targetPos);
                    return true;
                }
                dAccum += d;
                return false;
            };

            // Distance from Head to Path[0]
            if (this.path.length > 0) {
                if (processPair(this.head, this.path[0])) found = true;
            }

            if (!found) {
                for (let j = 0; j < this.path.length - 1; j++) {
                    if (processPair(this.path[j], this.path[j + 1])) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found && this.path.length > 0) {
                segments.push(this.path[this.path.length - 1].clone());
            }
        }
        return segments;
    }

    grow() {
        this.length++;
    }

    shrink() {
        if (this.length > 2) {
            this.length--;
        }
    }
}
