import { InputHandler } from './input.js';
import { GameMap, TILE_SIZE, TileType } from './map.js';
import { Camera } from './view.js';
import { Player } from './player.js';
import { Storage } from './storage.js';
import { Monster } from './monster.js';
import { BattleSystem } from './battle.js';
import { MenuSystem } from './menu.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.map = new GameMap();

        // Resize handling
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera = new Camera(this.canvas.width, this.canvas.height);

        this.player = new Player(12, 12, this.map);

        // Load save if exists
        if (!Storage.load(this.player)) {
            console.log("No save found, starting fresh.");
        }

        this.battle = new BattleSystem(this.player, (win) => {
            this.state = 'OVERWORLD';
            // Autosave after battle
            Storage.save(this.player);
        });

        this.menu = new MenuSystem(this);

        this.state = 'OVERWORLD'; // OVERWORLD, BATTLE, MENU

        this.input = new InputHandler();
        this.lastTime = 0;

        // Start loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        // Fix for mobile browser bars covering the bottom
        const container = document.getElementById('game-container');
        if (container) {
            container.style.height = `${height}px`;
        }

        if (this.camera) {
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }

    update(deltaTime) {
        if (this.state === 'OVERWORLD') {
            const finishedMoving = this.player.update(deltaTime, this.input);
            this.camera.follow(this.player, this.map.width, this.map.height, TILE_SIZE);

            if (finishedMoving) {
                // Autosave
                if (this.player.x !== this.player.lastSavedX || this.player.y !== this.player.lastSavedY) {
                    Storage.save(this.player);
                    this.player.lastSavedX = this.player.x;
                    this.player.lastSavedY = this.player.y;
                }

                // Check for encounters
                this.checkEncounter();
            }
        } else if (this.state === 'BATTLE') {
            // Battle Input Mapping
            // Ideally we'd have on screen buttons for this, but for now we reuse input
            if (this.input.keys.ACTION) {
                // Debounce logic needed? InputHandler handles raw state.
                // For this simple test, we'll just trigger attack on Action
                // But we need a way to select Run or Catch.
                // Let's map D-pad to select action? Too complex for MVP without visual menu cursor.
                // Simplified Controls for MVP:
                // Action (A) = Attack
                // Up = Catch
                // Down = Run
                this.battle.handleAction('ATTACK');
                this.input.keys.ACTION = false; // Prevent spam
            }
            if (this.input.keys.UP) {
                this.battle.handleAction('CATCH');
                this.input.keys.UP = false;
            }
            if (this.input.keys.DOWN) {
                this.battle.handleAction('RUN');
                this.input.keys.DOWN = false;
            }
        } else if (this.state === 'MENU') {
            this.menu.handleInput(this.input);
        }
    }

    checkEncounter() {
        const gridX = Math.round(this.player.x / TILE_SIZE);
        const gridY = Math.round(this.player.y / TILE_SIZE);
        const tile = this.map.getTile(gridX, gridY);

        if (tile === TileType.GRASS) {
            if (Math.random() < 0.15) { // 15% chance
                console.log("Encounter started!");
                const enemy = Monster.generateRandom();
                this.battle.startBattle(enemy);
                this.state = 'BATTLE';
            }
        }
    }

    draw(ctx) {
        if (this.state === 'OVERWORLD') {
            // Clear screen
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw map
            this.map.draw(ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

            // Draw player (relative to camera)
            const screenX = this.player.x - this.camera.x;
            const screenY = this.player.y - this.camera.y;

            ctx.fillStyle = 'red';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else if (this.state === 'BATTLE') {
            this.battle.draw(ctx, this.canvas.width, this.canvas.height);
        } else if (this.state === 'MENU') {
            // Draw overworld behind menu (optional, or just background)
             // Draw map
            this.map.draw(ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

            this.menu.draw(ctx, this.canvas.width, this.canvas.height);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw(this.ctx);

        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    // Expose game instance for debugging
    window.game = game;
});
