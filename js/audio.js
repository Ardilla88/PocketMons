export class AudioManager {
    constructor() {
        this.volume = 100;
        this.fadeInterval = null;
    }

    playRickRoll() {
        if (window.youtubePlayer && window.youtubePlayer.playVideo) {
            // Stop any pending fade out
            if (this.fadeInterval) clearInterval(this.fadeInterval);

            // Reset volume
            this.volume = 100;
            window.youtubePlayer.setVolume(this.volume);
            window.youtubePlayer.playVideo();
        }
    }

    stopMusic() {
        if (window.youtubePlayer && window.youtubePlayer.stopVideo) {
            window.youtubePlayer.stopVideo();
        }
    }

    fadeOut() {
        if (!window.youtubePlayer || !window.youtubePlayer.setVolume) return;

        if (this.fadeInterval) clearInterval(this.fadeInterval);

        this.fadeInterval = setInterval(() => {
            this.volume -= 10; // Faster fade (1 second)
            if (this.volume <= 0) {
                this.volume = 0;
                window.youtubePlayer.setVolume(0);
                window.youtubePlayer.stopVideo();
                clearInterval(this.fadeInterval);
            } else {
                window.youtubePlayer.setVolume(this.volume);
            }
        }, 100);
    }
}
