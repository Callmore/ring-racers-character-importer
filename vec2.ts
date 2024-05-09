export default class Vec2 {
    public readonly x: number;
    public readonly y: number;

    
    constructor(x: number, y: number);
    constructor(v: number);
    constructor();
    constructor(x?: number, y?: number) {
        if (x == undefined) {
            this.x = 0;
            this.y = 0;
            return;
        } else if (y == undefined) {
            this.x = x;
            this.y = x;
            return;
        }
        this.x = x;
        this.y = y;
    }

    add(v: Vec2 | number) {
        if (typeof v == "number") {
            return new Vec2(this.x + v, this.y + v);
        }
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    sub(v: Vec2 | number) {
        if (typeof v == "number") {
            return new Vec2(this.x - v, this.y - v);
        }
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    mul(v: Vec2 | number) {
        if (typeof v == "number") {
            return new Vec2(this.x * v, this.y * v);
        }
        return new Vec2(this.x * v.x, this.y * v.y);
    }

    div(v: Vec2 | number) {
        if (typeof v == "number") {
            return new Vec2(this.x / v, this.y / v);
        }
        return new Vec2(this.x / v.x, this.y / v.y);
    }

    round() {
        return new Vec2(Math.round(this.x), Math.round(this.y));
    }

    clone() {
        return new Vec2(this.x, this.y);
    }
}
