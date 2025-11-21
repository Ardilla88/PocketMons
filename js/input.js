export class InputHandler {
    constructor() {
        this.keys = {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
            ACTION: false
        };

        // Keyboard listeners for debugging/desktop
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Touch control binding
        this.bindTouchControls();
    }

    handleKey(e, isPressed) {
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.UP = isPressed;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.DOWN = isPressed;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.LEFT = isPressed;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.RIGHT = isPressed;
                break;
            case 'Space':
            case 'Enter':
                this.keys.ACTION = isPressed;
                break;
        }
    }

    bindTouchControls() {
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        dpadButtons.forEach(btn => {
            const direction = btn.dataset.dir; // up, down, left, right

            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling/selection
                this.setKeyFromDirection(direction, true);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.setKeyFromDirection(direction, false);
            });

            // Mouse events for testing on desktop with clicks
            btn.addEventListener('mousedown', (e) => {
                this.setKeyFromDirection(direction, true);
            });
            btn.addEventListener('mouseup', (e) => {
                this.setKeyFromDirection(direction, false);
            });
            btn.addEventListener('mouseleave', (e) => {
                this.setKeyFromDirection(direction, false);
            });
        });

        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.ACTION = true; });
            actionBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.ACTION = false; });
            actionBtn.addEventListener('mousedown', () => this.keys.ACTION = true);
            actionBtn.addEventListener('mouseup', () => this.keys.ACTION = false);
        }
    }

    setKeyFromDirection(dir, isPressed) {
        if (dir === 'up') this.keys.UP = isPressed;
        if (dir === 'down') this.keys.DOWN = isPressed;
        if (dir === 'left') this.keys.LEFT = isPressed;
        if (dir === 'right') this.keys.RIGHT = isPressed;
    }
}
