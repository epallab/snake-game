import { Vector2 } from './Vector2';

export const FoodType = {
    Normal: 'normal',
    Golden: 'golden',
    Poison: 'poison',     // Negative Score
    Death: 'death',       // Instant Death
    Shrink: 'shrink'      // Reduces Length
} as const;

export type FoodType = typeof FoodType[keyof typeof FoodType];

export class Food {
    position: Vector2;
    type: FoodType;
    value: number;
    radius: number;
    color: string;
    glowColor: string;
    lifetime: number | null = null; // Seconds until expiration, null if infinite
    age: number = 0; // Seconds since spawn

    constructor(width: number, height: number, type: FoodType = FoodType.Normal) {
        const padding = 50;
        this.position = new Vector2(
            padding + Math.random() * (width - padding * 2),
            padding + Math.random() * (height - padding * 2)
        );

        this.type = type;

        switch (type) {
            case FoodType.Golden:
                this.value = 25;
                this.radius = 12;
                this.color = '#ffd700'; // Gold
                this.glowColor = 'rgba(255, 215, 0, 0.6)';
                this.lifetime = 10; // Golden expires in 10 seconds
                break;
            case FoodType.Poison: // Renamed context: Negative Score
                this.value = -10;
                this.radius = 12;
                this.color = '#ff00ff'; // Magenta (Distinguishable from Gold)
                this.glowColor = 'rgba(255, 0, 255, 0.6)';
                this.lifetime = 10; // Poison expires in 10 seconds
                break;
            case FoodType.Death: // Instant Death
                this.value = 0;
                this.radius = 14;
                this.color = '#ff0000'; // Red
                this.glowColor = 'rgba(255, 0, 0, 0.8)';
                this.lifetime = 5; // Death expires in 5 seconds
                break;
            case FoodType.Shrink: // Shrink Length
                this.value = 50;
                this.radius = 10;
                this.color = '#00ffff'; // Cyan
                this.glowColor = 'rgba(0, 255, 255, 0.6)';
                this.lifetime = 5; // Shrink expires in 5 seconds
                break;
            default: // Normal
                this.value = 5;
                this.radius = 8;
                this.color = '#00ff44'; // Bright Green
                this.glowColor = 'rgba(0, 255, 68, 0.6)';
        }
    }
}
