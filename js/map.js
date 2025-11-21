export const TILE_SIZE = 40; // Size of each tile in pixels
export const MAP_WIDTH = 30;  // Width in tiles
export const MAP_HEIGHT = 30; // Height in tiles

export const TileType = {
    GRASS: 0,
    WALL: 1,
    WATER: 2,
    GROUND: 3,
    CENTER: 4
};

// Simple ASCII representation for the map
// W = Wall, G = Grass, . = Ground, ~ = Water, C = Center (Heal)
const MAP_LAYOUT = [
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "W.C..........G...............W",
    "W............G...............W",
    "W...GGGG.....G...............W",
    "W...GGGG.....G...............W",
    "W...GGGG.....................W",
    "W............................W",
    "W~~~~~~...........GGGGGG.....W",
    "W~~~~~~...........GGGGGG.....W",
    "W.................GGGGGG.....W",
    "W............................W",
    "W............................W",
    "W......WWWWWW................W",
    "W......W~~~~W................W",
    "W......W~~~~W................W",
    "W......WWWWWW................W",
    "W............................W",
    "W............................W",
    "W...GGGGGGGG.................W",
    "W...GGGGGGGG.................W",
    "W...GGGGGGGG.................W",
    "W............................W",
    "W............................W",
    "W.....................~~~~~~~W",
    "W.....................~~~~~~~W",
    "W.....................~~~~~~~W",
    "W.......GGGG.................W",
    "W.......GGGG.................W",
    "W.......GGGG.................W",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
];

export class GameMap {
    constructor() {
        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;
        this.tiles = this.generateMap();
    }

    generateMap() {
        const tiles = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            const layoutRow = MAP_LAYOUT[y] || "W".repeat(this.width);

            for (let x = 0; x < this.width; x++) {
                const char = layoutRow[x] || "W";
                switch(char) {
                    case 'W': row.push(TileType.WALL); break;
                    case 'G': row.push(TileType.GRASS); break;
                    case '~': row.push(TileType.WATER); break;
                    default:  row.push(TileType.GROUND); break;
                }
            }
            tiles.push(row);
        }
        return tiles;
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TileType.WALL; // Out of bounds is a wall
        }
        return this.tiles[y][x];
    }

    draw(ctx, cameraX, cameraY, screenWidth, screenHeight) {
        // Calculate visible range
        const startCol = Math.floor(cameraX / TILE_SIZE);
        const endCol = startCol + (screenWidth / TILE_SIZE) + 1;
        const startRow = Math.floor(cameraY / TILE_SIZE);
        const endRow = startRow + (screenHeight / TILE_SIZE) + 1;

        const offsetX = -cameraX + startCol * TILE_SIZE;
        const offsetY = -cameraY + startRow * TILE_SIZE;

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const tile = this.getTile(c, r);
                const x = (c - startCol) * TILE_SIZE + offsetX;
                const y = (r - startRow) * TILE_SIZE + offsetY;

                switch(tile) {
                    case TileType.GRASS:
                        ctx.fillStyle = '#4caf50'; // Green
                        break;
                    case TileType.WALL:
                        ctx.fillStyle = '#5d4037'; // Brown
                        break;
                    case TileType.WATER:
                        ctx.fillStyle = '#2196f3'; // Blue
                        break;
                    case TileType.CENTER:
                        ctx.fillStyle = '#ffd700'; // Gold/Yellow
                        break;
                    case TileType.GROUND:
                    default:
                        ctx.fillStyle = '#8bc34a'; // Light Green/Ground
                        break;
                }

                ctx.fillRect(Math.floor(x), Math.floor(y), TILE_SIZE, TILE_SIZE);

                // Draw "C" on center tiles for clarity
                if (tile === TileType.CENTER) {
                    ctx.fillStyle = '#d32f2f';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText("C", Math.floor(x) + TILE_SIZE/2, Math.floor(y) + TILE_SIZE/2);
                }
            }
        }
    }
}
