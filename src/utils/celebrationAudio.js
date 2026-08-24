/**
 * Web Audio API based celebration audio generator.
 * Produces arcade jackpot chimes, coin sound cascades, and triumphal fanfares.
 * 100% self-contained without external audio assets.
 */

class CelebrationAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cloudminex_celebration_muted', this.isMuted ? 'true' : 'false');
    }
  }

  getIsMuted() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('cloudminex_celebration_muted') === 'true';
    }
    return this.isMuted;
  }

  playJackpotSound() {
    if (this.getIsMuted()) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // 1. Rapid Coin Chime cascade (ding-ding-ding-ding)
      const coinFrequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      coinFrequencies.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });

      // 2. Victorious Fanfare Chord burst at the apex (0.6s mark)
      const fanfareApexTime = now + 0.65;
      const fanfareChord = [523.25, 659.25, 783.99, 1046.50]; // C Major triumph
      fanfareChord.forEach((freq) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, fanfareApexTime);

        gain.gain.setValueAtTime(0, fanfareApexTime);
        gain.gain.linearRampToValueAtTime(0.12, fanfareApexTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, fanfareApexTime + 0.9);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(fanfareApexTime);
        osc.stop(fanfareApexTime + 1.0);
      });

      // 3. Shimmering high sparkle overtone
      const sparkleOsc = this.audioCtx.createOscillator();
      const sparkleGain = this.audioCtx.createGain();
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(2637.02, fanfareApexTime + 0.1); // E7 high sparkle
      sparkleGain.gain.setValueAtTime(0.08, fanfareApexTime + 0.1);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, fanfareApexTime + 0.7);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(this.audioCtx.destination);

      sparkleOsc.start(fanfareApexTime + 0.1);
      sparkleOsc.stop(fanfareApexTime + 0.8);

    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e);
    }
  }
}

export const celebrationAudio = new CelebrationAudioEngine();
export default celebrationAudio;
