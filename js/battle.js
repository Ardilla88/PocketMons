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

        this.initUI();
    }

    initUI() {
        // Bind UI buttons
        document.getElementById('btn-attack').addEventListener('click', () => this.handleAction('ATTACK'));
        document.getElementById('btn-run').addEventListener('click', () => this.handleAction('RUN'));

        // Submenu triggers
        document.getElementById('btn-bag').addEventListener('click', () => this.showBattleMenu('BAG'));
        document.getElementById('btn-pkmn').addEventListener('click', () => this.showBattleMenu('PKMN'));
        document.getElementById('btn-battle-back').addEventListener('click', () => this.closeBattleMenu());
    }

    showBattleMenu(type) {
        const menu = document.getElementById('battle-submenu');
        const content = document.getElementById('battle-submenu-content');
        const title = document.getElementById('battle-submenu-title');

        menu.classList.remove('hidden');
        content.innerHTML = '';

        if (type === 'BAG') {
            title.innerText = "BAG";
            this.renderBag(content);
        } else if (type === 'PKMN') {
            title.innerText = "POKEMON";
            this.renderPokemon(content);
        }
    }

    closeBattleMenu() {
        document.getElementById('battle-submenu').classList.add('hidden');
    }

    renderBag(container) {
        const inv = this.player.inventory;

        // PokeBalls
        const ballBtn = document.createElement('button');
        ballBtn.className = 'ui-btn';
        ballBtn.innerText = `PokeBall (x${inv.pokeballs})`;
        ballBtn.onclick = () => {
            this.handleAction('CATCH');
            this.closeBattleMenu();
        };
        container.appendChild(ballBtn);

        // Potions
        const potionBtn = document.createElement('button');
        potionBtn.className = 'ui-btn btn-blue';
        potionBtn.innerText = `Potion (x${inv.potions})`;
        potionBtn.onclick = () => {
            if (inv.potions > 0) {
                this.handleAction('POTION'); // Heal active
                this.closeBattleMenu();
            }
        };
        container.appendChild(potionBtn);
    }

    renderPokemon(container) {
        this.player.team.forEach((mon, index) => {
            const btn = document.createElement('button');
            btn.className = 'ui-btn';
            btn.style.borderColor = mon.color;
            // Indicate active
            const activePrefix = (mon === this.playerMon) ? "[ACTIVE] " : "";
            btn.innerText = `${activePrefix}${mon.name} (HP: ${mon.currentHp}/${mon.maxHp})`;

            btn.onclick = () => {
                if (mon !== this.playerMon && mon.currentHp > 0) {
                    this.switchPokemon(mon);
                    this.closeBattleMenu();
                }
            };
            container.appendChild(btn);
        });
    }

    switchPokemon(newMon) {
        this.playerMon = newMon;
        this.log.push(`Go! ${newMon.name}!`);
        this.updateLogUI();
        // Switching takes a turn
        this.turn = 1;
        setTimeout(() => this.enemyTurn(), 1000);
    }

    updateLogUI() {
        const logEl = document.getElementById('battle-log');
        if (!logEl) return;
        // Show last 2 messages
        const msgs = this.log.slice(-2);
        logEl.innerHTML = msgs.join('<br>');
    }

    startBattle(enemyMonster) {
        this.isActive = true;
        this.enemy = enemyMonster;
        this.log = [`Wild ${this.enemy.name} appeared!`];
        this.updateLogUI();

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

        // Block further input immediately
        this.turn = -1;

        switch(action) {
            case 'ATTACK':
                this.playerAttack();
                break;
            case 'CATCH':
                this.attemptCatch();
                break;
            case 'POTION':
                this.usePotion();
                break;
            case 'RUN':
                this.runAway();
                return; // End immediately
        }

        // Note: methods above set this.turn = 1 if action continues to enemy turn
        // or call endBattle which clears isActive.

        if (this.isActive && this.turn === 1) {
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    usePotion() {
        if (this.player.inventory.potions <= 0) return;

        this.player.inventory.potions--;
        const healed = 20;
        this.playerMon.currentHp = Math.min(this.playerMon.currentHp + healed, this.playerMon.maxHp);

        this.log.push(`Used Potion on ${this.playerMon.name}!`);
        this.log.push(`Recovered HP.`);
        this.updateLogUI();

        this.turn = 1;
    }

    playerAttack() {
        const dmg = Math.max(1, this.playerMon.attack - 0); // Defense ignored for MVP
        this.enemy.currentHp -= dmg;
        this.log.push(`${this.playerMon.name} dealt ${dmg} dmg!`);
        this.updateLogUI();

        if (this.enemy.currentHp <= 0) {
            this.enemy.currentHp = 0;
            this.log.push(`${this.enemy.name} fainted!`);
            this.log.push(`You won!`);
            this.updateLogUI();
            setTimeout(() => this.endBattle(true), 2000);
        } else {
            this.turn = 1;
        }
    }

    attemptCatch() {
        if (this.player.inventory.pokeballs <= 0) {
            this.log.push("No PokeBalls left!");
            this.updateLogUI();
            return; // Don't consume turn? Or do? Let's just not do anything.
        }

        this.player.inventory.pokeballs--;
        this.log.push("You threw a PokeBall!");
        this.updateLogUI();

        // Simple catch formula: (MaxHP - CurrentHP) / MaxHP
        const hpFactor = (this.enemy.maxHp - this.enemy.currentHp) / this.enemy.maxHp;
        const chance = 0.5 + (hpFactor * 0.5); // 50% base + up to 50% for low health

        if (Math.random() < chance) {
            this.log.push(`Gotcha! ${this.enemy.name} was caught!`);
            this.updateLogUI();
            // Rehydrate monster class if it's just data
            // If we loaded from JSON, we might need to re-instantiate, but here it's fresh.
            // Ensure the enemy is a proper object before saving
            this.player.team.push(this.enemy);
            setTimeout(() => this.endBattle(true), 2000);
        } else {
            this.log.push(`${this.enemy.name} broke free!`);
            this.updateLogUI();
            this.turn = 1;
        }
    }

    runAway() {
        this.log.push("Got away safely!");
        this.updateLogUI();
        setTimeout(() => this.endBattle(false), 1000);
    }

    enemyTurn() {
        if (!this.isActive) return;

        const dmg = Math.max(1, this.enemy.attack - 0);
        this.playerMon.currentHp -= dmg;
        this.log.push(`${this.enemy.name} dealt ${dmg} dmg!`);
        this.updateLogUI();

        if (this.playerMon.currentHp <= 0) {
            this.playerMon.currentHp = 0;
            this.log.push(`${this.playerMon.name} fainted!`);
            this.log.push(`You lost...`); // Simple Game Over handling
            this.updateLogUI();
            setTimeout(() => this.endBattle(false), 2000);
        } else {
            this.turn = 0;
        }
    }

    endBattle(win) {
        // Ensure this only runs once
        if (!this.isActive) return;
        this.isActive = false;

        if (win) {
            // Award XP
            const xpAmount = 20 * this.enemy.level;
            const leveledUp = this.playerMon.gainXp(xpAmount);

            this.log.push(`Gained ${xpAmount} XP!`);
            this.updateLogUI();

            if (leveledUp) {
                 this.log.push(`${this.playerMon.name} grew to Level ${this.playerMon.level}!`);
                 this.updateLogUI();
                 // alert removed to prevent blocking issues
            }
        }

        // Delay slightly to let user read log?
        // Since we can't easily block, we just proceed.
        // The user will see the log flash or we rely on them seeing it in menu later.
        // Or we could set a timeout here before calling onBattleEnd,
        // but that requires managing the "Battle Over" state.
        // For MVP fix, we just close.
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

        // Controls are now DOM based
    }
}
