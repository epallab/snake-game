export class Vector2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2 {
    const m = this.mag();
    if (m === 0) return new Vector2(0, 0);
    return new Vector2(this.x / m, this.y / m);
  }

  distance(v: Vector2): number {
    return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
  }

  lerp(v: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  equals(v: Vector2): boolean {
    return this.x === v.x && this.y === v.y;
  }
  
  clone(): Vector2 {
      return new Vector2(this.x, this.y);
  }
}
