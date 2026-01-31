export class AudioManager {
    private static instance: AudioManager;
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private constructor() { }

    public static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    private playSfx(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideTo?: number) {
        if (this.isMuted) return;
        const ctx = this.initCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    // --- Specific Sound Effects ---

    public playEat() {
        // High-pitched "blip"
        this.playSfx(440, 'sine', 0.1, 0.1, 880);
    }

    public playGolden() {
        // Double "bling"
        this.playSfx(880, 'sine', 0.1, 0.15, 1760);
        setTimeout(() => this.playSfx(1100, 'sine', 0.15, 0.15, 2200), 50);
    }

    public playPoison() {
        // Low "fart" sound
        this.playSfx(150, 'sawtooth', 0.2, 0.1, 50);
    }

    public playShrink() {
        // Descending "whistle"
        this.playSfx(660, 'sine', 0.2, 0.1, 220);
    }

    public playGameOver() {
        // Sad melody
        this.playSfx(200, 'square', 0.3, 0.1, 100);
        setTimeout(() => this.playSfx(150, 'square', 0.4, 0.1, 50), 250);
    }

    public playLevelUp() {
        // Upward arpeggio
        this.playSfx(261.63, 'sine', 0.1, 0.1); // C4
        setTimeout(() => this.playSfx(329.63, 'sine', 0.1, 0.1), 100); // E4
        setTimeout(() => this.playSfx(392.00, 'sine', 0.1, 0.1), 200); // G4
        setTimeout(() => this.playSfx(523.25, 'sine', 0.2, 0.1), 300); // C5
    }

    public playClick() {
        this.playSfx(600, 'sine', 0.05, 0.05);
    }
}
