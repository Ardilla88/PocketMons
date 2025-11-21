import { Monster } from './monster.js';

export class BattleSystem {
    constructor(player, onBattleEnd) {
        this.player = player;
        this.onBattleEnd = onBattleEnd;
        this.isActive = false;

        this.enemy = null;
        this.playerMon = null;

        this.log = []; // Battle log messages
        this.turn = 0; // 0 = Player, 1 = Enemy
    }

    startBattle(enemyMonster) {
        this.isActive = true;
        this.enemy = enemyMonster;
        this.log = [`Wild ${this.enemy.name} appeared!`];

        // Select first monster in team, or create a temp one if empty (starter logic not fully implemented yet)
        if (this.player.team.length > 0) {
            this.playerMon = this.player.team[0];
        } else {
            // Fallback starter if team is empty
            this.playerMon = new Monster({ name: 'Partner', color: '#ffd700', hp: 25, attack: 4 }, 1);
        }

        this.log.push(`Go! ${this.playerMon.name}!`);
        this.turn = 0; // Player starts
    }

    handleAction(action) {
        if (!this.isActive) return;
        if (this.turn !== 0) return; // Not player turn

        switch(action) {
            case 'ATTACK':
                this.playerAttack();
                break;
            case 'CATCH':
                this.attemptCatch();
                break;
            case 'RUN':
                this.runAway();
                return; // End immediately
        }

        if (this.isActive && this.turn === 1) {
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    playerAttack() {
        const dmg = Math.max(1, this.playerMon.attack - 0); // Defense ignored for MVP
        this.enemy.currentHp -= dmg;
        this.log.push(`${this.playerMon.name} dealt ${dmg} dmg!`);

        if (this.enemy.currentHp <= 0) {
            this.enemy.currentHp = 0;
            this.log.push(`${this.enemy.name} fainted!`);
            this.log.push(`You won!`);
            setTimeout(() => this.endBattle(true), 2000);
        } else {
            this.turn = 1;
        }
    }

    attemptCatch() {
        if (this.player.inventory.pokeballs <= 0) {
            this.log.push("No PokeBalls left!");
            return; // Don't consume turn? Or do? Let's just not do anything.
        }

        this.player.inventory.pokeballs--;
        this.log.push("You threw a PokeBall!");

        // Simple catch formula: (MaxHP - CurrentHP) / MaxHP
        const hpFactor = (this.enemy.maxHp - this.enemy.currentHp) / this.enemy.maxHp;
        const chance = 0.5 + (hpFactor * 0.5); // 50% base + up to 50% for low health

        if (Math.random() < chance) {
            this.log.push(`Gotcha! ${this.enemy.name} was caught!`);
            // Rehydrate monster class if it's just data
            // If we loaded from JSON, we might need to re-instantiate, but here it's fresh.
            // Ensure the enemy is a proper object before saving
            this.player.team.push(this.enemy);
            setTimeout(() => this.endBattle(true), 2000);
        } else {
            this.log.push(`${this.enemy.name} broke free!`);
            this.turn = 1;
        }
    }

    runAway() {
        this.log.push("Got away safely!");
        setTimeout(() => this.endBattle(false), 1000);
    }

    enemyTurn() {
        if (!this.isActive) return;

        const dmg = Math.max(1, this.enemy.attack - 0);
        this.playerMon.currentHp -= dmg;
        this.log.push(`${this.enemy.name} dealt ${dmg} dmg!`);

        if (this.playerMon.currentHp <= 0) {
            this.playerMon.currentHp = 0;
            this.log.push(`${this.playerMon.name} fainted!`);
            this.log.push(`You lost...`); // Simple Game Over handling
            setTimeout(() => this.endBattle(false), 2000);
        } else {
            this.turn = 0;
        }
    }

    endBattle(win) {
        this.isActive = false;
        this.onBattleEnd(win);
    }

    draw(ctx, width, height) {
        // Background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);

        // Draw Battle Scene
        // Enemy (Top Right)
        const enemyX = width * 0.7;
        const enemyY = height * 0.2;
        ctx.fillStyle = this.enemy.color;
        ctx.fillRect(enemyX, enemyY, 60, 60);

        // Enemy Stats
        ctx.fillStyle = 'white';
        ctx.font = '16px Courier New';
        ctx.fillText(`${this.enemy.name}`, enemyX - 40, enemyY - 20);
        ctx.fillText(`HP: ${this.enemy.currentHp}/${this.enemy.maxHp}`, enemyX - 40, enemyY - 5);

        // Player Mon (Bottom Left)
        const playerX = width * 0.2;
        const playerY = height * 0.5;
        ctx.fillStyle = this.playerMon.color;
        ctx.fillRect(playerX, playerY, 60, 60);

        // Player Stats
        ctx.fillStyle = 'white';
        ctx.fillText(`${this.playerMon.name}`, playerX + 70, playerY + 20);
        ctx.fillText(`HP: ${this.playerMon.currentHp}/${this.playerMon.maxHp}`, playerX + 70, playerY + 35);

        // Menu / Text Box
        const menuHeight = height * 0.3;
        ctx.fillStyle = '#333';
        ctx.fillRect(0, height - menuHeight, width, menuHeight);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, height - menuHeight + 5, width - 10, menuHeight - 10);

        // Text Log (Last 2 lines)
        ctx.fillStyle = 'white';
        const logStart = Math.max(0, this.log.length - 2);
        if (this.log[logStart]) ctx.fillText(this.log[logStart], 20, height - menuHeight + 30);
        if (this.log[logStart+1]) ctx.fillText(this.log[logStart+1], 20, height - menuHeight + 55);

        // Controls Hint
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#aaa';
        ctx.fillText("[A]ttack  [▲]Catch  [▼]Run", 20, height - 20);
        // Note: We need to map inputs to these actions or show on-screen buttons
    }
}
