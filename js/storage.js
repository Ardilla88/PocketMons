import { TILE_SIZE } from './map.js';

const STORAGE_KEY = 'webmon_save_data_v1';

export class Storage {
    static save(player) {
        const data = {
            x: Math.round(player.x / TILE_SIZE),
            y: Math.round(player.y / TILE_SIZE),
            team: player.team,
            inventory: player.inventory
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log("Game Saved");
            return true;
        } catch (e) {
            console.error("Failed to save game", e);
            return false;
        }
    }

    static load(player) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            player.x = data.x * TILE_SIZE;
            player.y = data.y * TILE_SIZE;
            player.targetX = player.x;
            player.targetY = player.y;
            player.team = data.team || [];
            player.inventory = data.inventory || { pokeballs: 5, potions: 2 };

            console.log("Game Loaded");
            return true;
        } catch (e) {
            console.error("Failed to load game", e);
            return false;
        }
    }
}
