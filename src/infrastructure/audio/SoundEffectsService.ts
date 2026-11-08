/**
 * Synthesizes subtle, pleasant UI sound effects using the browser's native Web Audio API.
 * Works 100% offline in both Web and Android APK without external audio assets (HU-17.4).
 */
export class SoundEffectsService {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public static playCalculateSuccess(enabled: boolean): void {
    if (!enabled) return;
    this.playToneSequence([
      { freq: 523.25, duration: 0.08, delay: 0 },     // C5
      { freq: 659.25, duration: 0.1, delay: 0.07 },   // E5
      { freq: 783.99, duration: 0.14, delay: 0.15 },  // G5
    ]);
  }

  public static playWarningAlert(enabled: boolean): void {
    if (!enabled) return;
    this.playToneSequence([
      { freq: 349.23, duration: 0.12, delay: 0 },     // F4
      { freq: 311.13, duration: 0.18, delay: 0.12 },  // D#4
    ]);
  }

  public static playPdfGenerated(enabled: boolean): void {
    if (!enabled) return;
    this.playToneSequence([
      { freq: 587.33, duration: 0.07, delay: 0 },     // D5
      { freq: 739.99, duration: 0.08, delay: 0.06 },  // F#5
      { freq: 880.0, duration: 0.16, delay: 0.13 },   // A5
    ]);
  }

  public static playTap(enabled: boolean): void {
    if (!enabled) return;
    this.playToneSequence([{ freq: 600, duration: 0.04, delay: 0 }]);
  }

  private static playToneSequence(notes: { freq: number; duration: number; delay: number }[]): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        gain.gain.setValueAtTime(0.001, now + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.08, now + note.delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.delay + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration + 0.02);
      }
    } catch {
      // Ignore audio errors when autoplay is blocked
    }
  }
}

