// Web Audio API emergency siren and sound generator
class AudioService {
  private audioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying = false;
  private sirenInterval: number | null = null;

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play high decibel oscillating emergency siren
  startEmergencySiren() {
    if (this.isSirenPlaying) return;
    try {
      const ctx = this.initContext();
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.3, ctx.currentTime);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc = ctx.createOscillator();
      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(800, ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenOsc.start();

      this.isSirenPlaying = true;

      // Frequency modulation for high-urgency siren pattern (800Hz - 1400Hz)
      let high = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.sirenOsc || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const targetFreq = high ? 1350 : 750;
        this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.35);
        high = !high;
      }, 400);
    } catch (e) {
      console.warn('AudioContext siren failed:', e);
    }
  }

  stopEmergencySiren() {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      if (this.sirenGain && this.audioCtx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        setTimeout(() => {
          this.sirenOsc?.stop();
          this.sirenOsc?.disconnect();
          this.sirenGain?.disconnect();
          this.sirenOsc = null;
          this.sirenGain = null;
        }, 150);
      }
    } catch (e) {
      console.warn('Error stopping siren', e);
    }
    this.isSirenPlaying = false;
  }

  // Discreet double-tap haptic confirmation chirp
  playDiscreetChirp() {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignored
    }
  }

  // 3-second SOS Countdown beeps
  playCountdownBeep(frequency = 900) {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Ignored
    }
  }

  isSirenActive() {
    return this.isSirenPlaying;
  }
}

export const audioService = new AudioService();
