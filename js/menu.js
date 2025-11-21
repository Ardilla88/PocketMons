export class MenuSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentSubMenu = null; // null = Main Menu, 'items', 'monsters'

        this.init();
    }

    init() {
        // Bind Menu Button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.toggle(); });
            menuBtn.addEventListener('mousedown', (e) => { e.preventDefault(); this.toggle(); });
        }
    }

    toggle() {
        if (this.game.state === 'BATTLE') return; // Disable menu during battle

        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.game.state = 'MENU';
            this.currentSubMenu = null;
        } else {
            this.game.state = 'OVERWORLD';
        }
    }

    handleInput(input) {
        if (!this.isOpen) return;

        // Since we don't have a UI library, we'll use the Action button to cycle
        // through submenus for this MVP, or rely on touch clicks on the rendered menu.
        // Let's try to map Input to simple selection logic.

        if (input.keys.ACTION) {
             // For MVP simplicity, let's just cycle Main -> Monsters -> Items -> Close
             if (this.currentSubMenu === null) {
                 this.currentSubMenu = 'monsters';
             } else if (this.currentSubMenu === 'monsters') {
                 this.currentSubMenu = 'items';
             } else if (this.currentSubMenu === 'items') {
                 this.toggle(); // Close
             }
             input.keys.ACTION = false; // Consume input
        }
    }

    draw(ctx, width, height) {
        if (!this.isOpen) return;

        // Dim background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Draw Menu Box
        const padding = 20;
        const boxWidth = width - (padding * 2);
        const boxHeight = height - (padding * 2);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(padding, padding, boxWidth, boxHeight);

        ctx.font = '24px Courier New';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        if (this.currentSubMenu === null) {
            this.drawMainMenu(ctx, width, height);
        } else if (this.currentSubMenu === 'monsters') {
            this.drawMonsters(ctx, width, height);
        } else if (this.currentSubMenu === 'items') {
            this.drawItems(ctx, width, height);
        }

        // Footer Hint
        ctx.font = '14px Courier New';
        ctx.fillStyle = '#aaa';
        ctx.fillText("Press [A] to Cycle / Close", width / 2, height - 40);
    }

    drawMainMenu(ctx, width, height) {
        ctx.font = '30px Courier New';
        ctx.fillText("PAUSE MENU", width / 2, 100);

        ctx.font = '20px Courier New';
        ctx.fillText("1. Monsters", width / 2, 200);
        ctx.fillText("2. Items", width / 2, 240);
        ctx.fillText("3. Close", width / 2, 280);

        ctx.font = '14px Courier New';
        ctx.fillStyle = '#aaa';
        ctx.fillText("(Game Auto-Saves)", width / 2, 340);
    }

    drawMonsters(ctx, width, height) {
        ctx.font = '30px Courier New';
        ctx.fillText("YOUR TEAM", width / 2, 80);

        const team = this.game.player.team;
        if (team.length === 0) {
            ctx.fillText("(No monsters yet)", width / 2, 200);
        } else {
            team.forEach((mon, index) => {
                const y = 150 + (index * 60);
                ctx.font = '20px Courier New';
                ctx.textAlign = 'left';
                ctx.fillStyle = mon.color;
                ctx.fillText(`${mon.name} Lv${mon.level}`, 60, y);
                ctx.fillStyle = 'white';
                ctx.font = '16px Courier New';
                ctx.fillText(`HP: ${mon.currentHp}/${mon.maxHp}`, 60, y + 25);
            });
        }
        ctx.textAlign = 'center'; // Reset
    }

    drawItems(ctx, width, height) {
        ctx.font = '30px Courier New';
        ctx.fillText("INVENTORY", width / 2, 100);

        const inv = this.game.player.inventory;

        ctx.font = '24px Courier New';
        ctx.fillText(`PokeBalls: ${inv.pokeballs}`, width / 2, 200);
        ctx.fillText(`Potions: ${inv.potions}`, width / 2, 250);
    }
}
