import { Monster } from './monster.js';
import { AudioManager } from './audio.js';

export class BattleSystem {
    constructor(player, onBattleEnd) {
        this.player = player;
        this.audio = new AudioManager();
        this.onBattleEnd = onBattleEnd;
        this.isActive = false;

        this.enemy = null;
        this.playerMon = null;

        this.log = []; // Battle log messages
        this.turn = 0; // 0 = Player, 1 = Enemy

        this.visualXp = 0; // For animation
        this.targetXp = 0;

        this.playerVisualHp = 0;
        this.enemyVisualHp = 0;

        this.playerFlashTime = 0;
        this.enemyFlashTime = 0;

        this.initUI();
    }

    triggerDamageAnim(isPlayer) {
        if (isPlayer) {
            this.playerFlashTime = 20; // Flash for 20 frames
        } else {
            this.enemyFlashTime = 20;
        }
    }

    update(deltaTime) {
        if (!this.playerMon) return;

        // Animate XP
        if (Math.abs(this.visualXp - this.targetXp) > 0.1) {
            const diff = this.targetXp - this.visualXp;
            this.visualXp += diff * 0.05;
        } else {
            this.visualXp = this.targetXp;
        }

        // Animate Player HP
        if (Math.abs(this.playerVisualHp - this.playerMon.currentHp) > 0.1) {
            const diff = this.playerMon.currentHp - this.playerVisualHp;
            this.playerVisualHp += diff * 0.1; // Slightly faster than XP
        } else {
            this.playerVisualHp = this.playerMon.currentHp;
        }

        // Animate Enemy HP
        if (this.enemy) {
            if (Math.abs(this.enemyVisualHp - this.enemy.currentHp) > 0.1) {
                const diff = this.enemy.currentHp - this.enemyVisualHp;
                this.enemyVisualHp += diff * 0.1;
            } else {
                this.enemyVisualHp = this.enemy.currentHp;
            }
        }

        // Update HTML HUD
        this.updateBattleHUD();
    }

    updateBattleHUD() {
        if (!this.playerMon || !this.enemy) return;

        // Enemy
        document.getElementById('enemy-name').innerText = this.enemy.name;
        document.getElementById('enemy-lvl').innerText = `Lv${this.enemy.level}`;
        document.getElementById('enemy-hp-text').innerText = `${Math.round(this.enemyVisualHp)}/${this.enemy.maxHp}`;
        this.updateBar('enemy-hp-bar', this.enemyVisualHp, this.enemy.maxHp, true);

        // Player
        document.getElementById('player-name').innerText = this.playerMon.name;
        document.getElementById('player-lvl').innerText = `Lv${this.playerMon.level}`;
        document.getElementById('player-hp-text').innerText = `${Math.round(this.playerVisualHp)}/${this.playerMon.maxHp}`;

        this.updateBar('player-hp-bar', this.playerVisualHp, this.playerMon.maxHp, true);
        this.updateBar('player-xp-bar', this.visualXp, this.playerMon.maxXp, false);
    }

    updateBar(elementId, current, max, isHp) {
        const bar = document.getElementById(elementId);
        if (!bar) return;

        const ratio = Math.min(1, Math.max(0, current / max));
        bar.style.width = `${ratio * 100}%`;

        if (isHp) {
            let color = '#4caf50'; // Green
            if (ratio < 0.2) color = '#f44336'; // Red
            else if (ratio < 0.5) color = '#ffeb3b'; // Yellow
            bar.style.backgroundColor = color;
        }
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

    setUIState(state) {
        const logEl = document.getElementById('battle-log');
        const menuEl = document.getElementById('battle-main-menu');

        if (state === 'LOG') {
            logEl.classList.remove('hidden');
            menuEl.classList.add('hidden');
            this.closeBattleMenu(); // Ensure submenus are closed
        } else if (state === 'MENU') {
            logEl.classList.add('hidden');
            menuEl.classList.remove('hidden');
        }
    }

    showBattleMenu(type, hideBack = false) {
        const menu = document.getElementById('battle-submenu');
        const content = document.getElementById('battle-submenu-content');
        const title = document.getElementById('battle-submenu-title');
        const backBtn = document.getElementById('btn-battle-back');
        const mainMenu = document.getElementById('battle-main-menu');

        menu.classList.remove('hidden');
        mainMenu.classList.add('hidden'); // Hide main menu buttons
        content.innerHTML = '';

        if (hideBack) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

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
        // Restore main menu if we are still in MENU state
        // Since closeBattleMenu is usually called by Back button or action selection
        // If action selection, we switch to LOG state anyway which hides main menu.
        // If Back button, we want main menu back.

        // We assume Back button logic here mostly.
        // If action calls this, it immediately calls handleAction which sets UI state to LOG.
        document.getElementById('battle-main-menu').classList.remove('hidden');
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
        const isForced = this.playerMon.currentHp <= 0;
        this.playerMon = newMon;

        // Reset bars for new mon
        this.visualXp = this.playerMon.xp;
        this.targetXp = this.playerMon.xp;
        this.playerVisualHp = this.playerMon.currentHp;

        this.log.push(`Go! ${newMon.name}!`);
        this.updateLogUI();
        this.setUIState('LOG');

        if (isForced) {
            // Free turn if previous mon fainted
            this.turn = 0;
            setTimeout(() => this.setUIState('MENU'), 1500);
        } else {
            // Switching takes a turn
            this.turn = 1;
            setTimeout(() => this.enemyTurn(), 1000);
        }
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

        // Rick Roll Check
        if (this.enemy.name === 'Fernorlax') {
            this.audio.playRickRoll();
        }

        this.log = [`Wild ${this.enemy.name} appeared!`];
        this.updateLogUI();
        this.setUIState('LOG');

        // Select first monster in team, or create a temp one if empty (starter logic not fully implemented yet)
        if (this.player.team.length > 0) {
            this.playerMon = this.player.team[0];
        } else {
            // Fallback starter if team is empty
            this.playerMon = new Monster({ name: 'Partner', color: '#ffd700', hp: 25, attack: 4 }, 1);
        }

        // Init Visuals
        this.visualXp = this.playerMon.xp;
        this.targetXp = this.playerMon.xp;
        this.playerVisualHp = this.playerMon.currentHp;
        this.enemyVisualHp = this.enemy.currentHp;

        this.log.push(`Go! ${this.playerMon.name}!`);
        this.turn = 0; // Player starts
        setTimeout(() => {
            if (this.isActive) this.setUIState('MENU');
        }, 2000);
    }

    handleAction(action) {
        if (!this.isActive) return;
        if (this.turn !== 0) return; // Not player turn

        // Block further input immediately
        this.turn = -1;
        this.setUIState('LOG');

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
            setTimeout(() => this.enemyTurn(), 1500);
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
        this.triggerDamageAnim(false); // Flash enemy

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
        this.audio.fadeOut(); // Start fading immediately
        setTimeout(() => this.endBattle(false), 1000);
    }

    enemyTurn() {
        if (!this.isActive) return;

        const dmg = Math.max(1, this.enemy.attack - 0);
        this.playerMon.currentHp -= dmg;
        this.triggerDamageAnim(true); // Flash player

        this.log.push(`${this.enemy.name} dealt ${dmg} dmg!`);
        this.updateLogUI();

        if (this.playerMon.currentHp <= 0) {
            this.playerMon.currentHp = 0;
            this.log.push(`${this.playerMon.name} fainted!`);
            this.updateLogUI();

            if (this.hasAlivePokemon()) {
                setTimeout(() => this.forceSwitch(), 1500);
            } else {
                this.log.push(`You lost...`);
                this.updateLogUI();
                setTimeout(() => this.endBattle(false), 2000);
            }
        } else {
            this.turn = 0;
            setTimeout(() => {
                if (this.isActive) this.setUIState('MENU');
            }, 1500);
        }
    }

    hasAlivePokemon() {
        return this.player.team.some(mon => mon.currentHp > 0);
    }

    forceSwitch() {
        this.log.push("Choose your next Pokemon!");
        this.updateLogUI();

        // Show PKMN menu but hide Back button
        this.showBattleMenu('PKMN', true);
    }

    endBattle(win) {
        // Ensure this only runs once
        if (!this.isActive) return;
        // Don't set isActive = false yet, keep it drawing so we see the UI

        if (win) {
            // Award XP
            const xpAmount = 20 * this.enemy.level;
            const leveledUp = this.playerMon.gainXp(xpAmount);

            this.targetXp = this.playerMon.xp;

            this.log.push(`Won! Gained ${xpAmount} XP.`);
            if (leveledUp) {
                 this.log.push(`Leveled up to ${this.playerMon.level}!`);
            }
            this.updateLogUI();

            if (this.playerMon.level >= 5 && this.playerMon.shape !== 'PENTAGON') {
                // Start Evolution Sequence instead of showing Continue immediately
                // We'll use a small delay to let the level up message show
                setTimeout(() => this.startEvolutionSequence(), 2000);
            } else {
                // Switch to Continue button
                this.showContinueButton(true);
            }
        } else {
            // Lost or Ran
            this.audio.fadeOut();
            this.isActive = false;
            this.onBattleEnd(win);
        }
    }

    startEvolutionSequence() {
        // Hide Battle UI elements
        document.getElementById('battle-ui').classList.add('hidden');
        const evoScreen = document.getElementById('evolution-screen');
        evoScreen.classList.remove('hidden');

        const evoText = document.getElementById('evolution-text');
        const evoCanvas = document.getElementById('evolution-canvas');
        const btnOk = document.getElementById('btn-evolution-ok');
        const ctx = evoCanvas.getContext('2d');

        evoText.innerText = `What? ${this.playerMon.name} is evolving!`;
        btnOk.classList.add('hidden');

        // Animation Loop
        let frame = 0;
        const maxFrames = 300;
        const centerX = evoCanvas.width / 2;
        const centerY = evoCanvas.height / 2;
        const size = 50;

        const animate = () => {
            ctx.clearRect(0, 0, evoCanvas.width, evoCanvas.height);

            // Interpolate Shape or Flash
            // Simple flash effect: toggling between Rect and Pentagon or color

            ctx.fillStyle = this.playerMon.color;

            if (frame < maxFrames) {
                // Flash
                if (Math.floor(frame / 30) % 2 === 0) {
                    ctx.fillRect(centerX - size/2, centerY - size/2, size, size);
                } else {
                    // Draw Pentagon
                    this.drawPentagon(ctx, centerX, centerY, size, this.playerMon.color);
                }
                frame++;
                requestAnimationFrame(animate);
            } else {
                // Finalize
                this.playerMon.shape = 'PENTAGON';
                this.playerMon.name += "Gon"; // Simple name change
                this.drawPentagon(ctx, centerX, centerY, size, this.playerMon.color);

                evoText.innerText = `Congratulations! Your ${this.playerMon.name.replace("Gon", "")} evolved into ${this.playerMon.name}!`;
                btnOk.classList.remove('hidden');

                btnOk.onclick = () => {
                    evoScreen.classList.add('hidden');
                    document.getElementById('battle-ui').classList.remove('hidden');
                    this.showContinueButton(true);
                };
            }
        };

        animate();
    }

    drawPentagon(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            // -18 to start pointing up? 360/5 = 72.
            // Start at top: -90 degrees.
            const angle = (i * 72 - 90) * Math.PI / 180;
            const px = x + size/1.5 * Math.cos(angle);
            const py = y + size/1.5 * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    showContinueButton(win) {
        const menu = document.getElementById('battle-main-menu');

        // Clear existing buttons
        menu.innerHTML = '';

        // Fade out music if playing
        this.audio.fadeOut();

        const btn = document.createElement('button');
        btn.className = 'ui-btn btn-yellow';
        btn.innerText = "Continue";
        btn.style.height = "60px";
        btn.onclick = () => {
            this.isActive = false;
            this.onBattleEnd(win);
            // Restore buttons for next time (optional, initUI handles it usually but better safe)
            this.restoreUI();
        };

        menu.appendChild(btn);
        // Show the "Menu" (which now contains only the Continue button)
        this.setUIState('MENU');
    }

    restoreUI() {
        const menu = document.getElementById('battle-main-menu');
        menu.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
                <button id="btn-attack" class="ui-btn btn-red">Attack</button>
                <button id="btn-pkmn" class="ui-btn btn-blue">Pkmn</button>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
                <button id="btn-bag" class="ui-btn btn-yellow">Bag</button>
                <button id="btn-run" class="ui-btn">Run</button>
            </div>
        `;
        this.initUI(); // Re-bind listeners
    }

    draw(ctx, width, height) {
        // Background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);

        // Draw Battle Scene (Just sprites now, UI is HTML)

        // Enemy (Top Right)
        const enemyX = width * 0.7;
        const enemyY = height * 0.2;

        if (this.enemyFlashTime > 0) {
            this.enemyFlashTime--;
        }

        // Draw Enemy if not blinking out
        if (this.enemyFlashTime <= 0 || Math.floor(this.enemyFlashTime / 4) % 2 === 0) {
            ctx.fillStyle = this.enemyFlashTime > 0 ? '#ffffff' : this.enemy.color;
            ctx.fillRect(enemyX, enemyY, 60, 60);
        }

        // Player Mon (Bottom Left)
        const playerX = width * 0.2;
        const playerY = height * 0.5;

        if (this.playerFlashTime > 0) {
            this.playerFlashTime--;
        }

        // Draw Player if not blinking out
        if (this.playerFlashTime <= 0 || Math.floor(this.playerFlashTime / 4) % 2 === 0) {
            const color = this.playerFlashTime > 0 ? '#ffffff' : this.playerMon.color;

            if (this.playerMon.shape === 'PENTAGON') {
                 this.drawPentagon(ctx, playerX + 30, playerY + 30, 60, color);
            } else {
                 ctx.fillStyle = color;
                 ctx.fillRect(playerX, playerY, 60, 60);
            }
        }
    }
}
