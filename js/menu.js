export class MenuSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Bind Toggle Button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.toggle(); });
            menuBtn.addEventListener('mousedown', (e) => { e.preventDefault(); this.toggle(); });
        }

        // Bind Menu Options
        document.getElementById('btn-menu-team').addEventListener('click', () => this.showSubMenu('monsters'));
        document.getElementById('btn-menu-bag').addEventListener('click', () => this.showSubMenu('items'));
        document.getElementById('btn-menu-close').addEventListener('click', () => this.toggle());
        document.getElementById('btn-submenu-back').addEventListener('click', () => this.showSubMenu(null));
    }

    toggle() {
        if (this.game.state === 'BATTLE') return;

        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.game.state = 'MENU';
            this.showSubMenu(null); // Reset to main
        } else {
            this.game.state = 'OVERWORLD';
            // Explicitly hide menu elements
            document.getElementById('menu-ui').classList.add('hidden');
            document.getElementById('submenu-ui').classList.add('hidden');
        }
    }

    showSubMenu(type) {
        const menuUI = document.getElementById('menu-ui');
        const submenuUI = document.getElementById('submenu-ui');
        const content = document.getElementById('submenu-content');
        const title = document.getElementById('submenu-title');

        if (type === null) {
            // Show Main Menu
            menuUI.classList.remove('hidden');
            submenuUI.classList.add('hidden');
        } else {
            // Show Sub Menu
            menuUI.classList.add('hidden');
            submenuUI.classList.remove('hidden');
            content.innerHTML = ''; // Clear prev

            if (type === 'monsters') {
                title.innerText = "TEAM";
                this.renderTeam(content);
            } else if (type === 'items') {
                title.innerText = "BAG";
                this.renderItems(content);
            }
        }
    }

    renderTeam(container) {
        const team = this.game.player.team;
        if (team.length === 0) {
            container.innerHTML = '<div class="list-item">No monsters yet.</div>';
            return;
        }
        team.forEach(mon => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div style="color: ${mon.color}; font-weight: bold;">${mon.name} Lv${mon.level}</div>
                <div style="font-size: 14px;">HP: ${mon.currentHp}/${mon.maxHp}</div>
            `;
            container.appendChild(div);
        });
    }

    renderItems(container) {
        const inv = this.game.player.inventory;
        container.innerHTML = `
            <div class="list-item">PokeBalls: ${inv.pokeballs}</div>
            <div class="list-item">Potions: ${inv.potions}</div>
        `;
    }

    updateUI() {
        // Ensure visibility based on internal state
        const menuUI = document.getElementById('menu-ui');
        const submenuUI = document.getElementById('submenu-ui');

        if (!this.isOpen) {
            menuUI.classList.add('hidden');
            submenuUI.classList.add('hidden');
            return;
        }

        // If open, we rely on showSubMenu to set the correct classes.
        // However, if main.js logic was interfering, we might need to enforce it here.
        // But with the fix in main.js, we just need to ensure we aren't hidden by accident.
        // For now, we trust the event-driven showSubMenu logic,
        // but let's re-apply the current state just in case.

        // Ideally we don't do this every frame, but it's cheap DOM manip.
        // Actually, let's not fight the DOM. The state is set by events.
        // We only need to ensure we are hidden if isOpen is false.
    }
}
