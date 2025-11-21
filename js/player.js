import { TILE_SIZE, TileType } from './map.js';

export class Player {
    constructor(startX, startY, map) {
        this.x = startX * TILE_SIZE;
        this.y = startY * TILE_SIZE;
        this.map = map;

        this.speed = 0.15; // pixels per ms
        this.moving = false;
        this.targetX = this.x;
        this.targetY = this.y;

        this.team = [];
        this.inventory = {
            pokeballs: 5,
            potions: 2
        };
    }

    update(deltaTime, input) {
        // Grid based movement logic
        if (!this.moving) {
            let dx = 0;
            let dy = 0;

            if (input.keys.UP) dy = -1;
            else if (input.keys.DOWN) dy = 1;
            else if (input.keys.LEFT) dx = -1;
            else if (input.keys.RIGHT) dx = 1;

            if (dx !== 0 || dy !== 0) {
                const nextGridX = Math.round(this.x / TILE_SIZE) + dx;
                const nextGridY = Math.round(this.y / TILE_SIZE) + dy;

                if (!this.isCollision(nextGridX, nextGridY)) {
                    this.targetX = nextGridX * TILE_SIZE;
                    this.targetY = nextGridY * TILE_SIZE;
                    this.moving = true;
                }
            }
        } else {
            // Move towards target
            const dist = this.speed * deltaTime;

            if (this.x < this.targetX) this.x = Math.min(this.x + dist, this.targetX);
            if (this.x > this.targetX) this.x = Math.max(this.x - dist, this.targetX);
            if (this.y < this.targetY) this.y = Math.min(this.y + dist, this.targetY);
            if (this.y > this.targetY) this.y = Math.max(this.y - dist, this.targetY);

            // Check if arrived
            if (this.x === this.targetX && this.y === this.targetY) {
                this.moving = false;
                // Return true if movement just finished (to trigger events)
                return true;
            }
        }
        return false;
    }

    isCollision(gridX, gridY) {
        const tile = this.map.getTile(gridX, gridY);
        // Wall and Water are solid
        return tile === TileType.WALL || tile === TileType.WATER;
    }
}
