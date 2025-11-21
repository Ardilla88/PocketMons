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
        // Sync UI visibility every frame (or could be event based)
        this.updateUIState();

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

                // Check for encounters or interactions
                this.checkInteractions();
            }
        } else if (this.state === 'BATTLE') {
            // Input is now handled by DOM buttons in BattleSystem
            this.battle.update(deltaTime);
        } else if (this.state === 'MENU') {
            // Input is now handled by DOM buttons in MenuSystem
        }
    }

    checkInteractions() {
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
        } else if (tile === TileType.CENTER) {
            this.healAndRefill();
        }
    }

    healAndRefill() {
        // Heal Team
        this.player.team.forEach(mon => mon.currentHp = mon.maxHp);

        // Refill Balls if low
        if (this.player.inventory.pokeballs < 5) {
            this.player.inventory.pokeballs = 5;
        }

        // Refill Potions if low
        if (this.player.inventory.potions < 3) {
            this.player.inventory.potions = 3;
        }

        console.log("Team Healed and Supplies Refilled!");
        alert("Your team was healed and supplies refilled!"); // Simple feedback for user
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
            // Draw overworld behind menu
            this.map.draw(ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
            // Menu is now DOM-based, no canvas draw needed
        }
    }

    updateUIState() {
        const controls = document.getElementById('controls');
        const battleUI = document.getElementById('battle-ui');

        // Hide game controls/battle UI based on state
        if (this.state === 'OVERWORLD') {
            controls.classList.remove('hidden');
            battleUI.classList.add('hidden');
            // Menu handled by MenuSystem
        } else if (this.state === 'BATTLE') {
            controls.classList.add('hidden');
            battleUI.classList.remove('hidden');
        } else if (this.state === 'MENU') {
            controls.classList.add('hidden');
            battleUI.classList.add('hidden');
            this.menu.updateUI();
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
