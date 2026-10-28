import { Platform, Vibration } from 'react-native';
import { ORDER_RING_BASE64 } from './orderRingBase64';

class OrderRingtoneService {
  constructor() {
    this.audioElement = null;
    this.audioContext = null;
    this.ringInterval = null;
    this.isPlaying = false;
    this.isUnlocked = false;

    // Auto-unlock audio on user's first interaction on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const unlock = () => {
        this.unlock();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  unlock() {
    if (this.isUnlocked) return;
    this.isUnlocked = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Unlock HTML5 Audio
        if (!this.audioElement) {
          this.audioElement = new window.Audio(ORDER_RING_BASE64);
          this.audioElement.preload = 'auto';
          this.audioElement.volume = 1.0;
        }

        // Unlock Web Audio Context
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass && !this.audioContext) {
          this.audioContext = new AudioCtxClass();
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  playSynthesizedChime() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtxClass();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Note 1: High crisp order bell (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880.0, now);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Note 2: Higher harmonic chime (1318.5 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.18);
      gain2.gain.setValueAtTime(0.8, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.7);
    } catch (err) {
      // Ignore
    }
  }

  startRingtone() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.unlock();

    // 1. Mobile Vibration (Pattern: 0ms delay, 700ms vibrate, 300ms pause, repeat)
    try {
      Vibration.vibrate([0, 700, 300, 700, 300, 700], true);
    } catch (e) {
      // Ignore
    }

    // 2. Play Audio via HTML5 Audio element
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (!this.audioElement) {
          this.audioElement = new window.Audio(ORDER_RING_BASE64);
        }
        this.audioElement.currentTime = 0;
        this.audioElement.loop = true;
        this.audioElement.volume = 1.0;

        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If browser autoplay policy blocked Audio element, use Web Audio synthesizer loop
            this.playSynthesizedChime();
            this.ringInterval = setInterval(() => {
              if (this.isPlaying) this.playSynthesizedChime();
            }, 1200);
          });
        }
      } catch (err) {
        // Fallback to Web Audio synthesizer
        this.playSynthesizedChime();
        this.ringInterval = setInterval(() => {
          if (this.isPlaying) this.playSynthesizedChime();
        }, 1200);
      }
    }
  }

  stopRingtone() {
    this.isPlaying = false;

    // Stop HTML5 Audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }

    // Stop interval synthesizer
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }

    // Stop vibration
    try {
      Vibration.cancel();
    } catch (e) {}
  }

  testRing() {
    this.startRingtone();
    setTimeout(() => {
      this.stopRingtone();
    }, 4500); // Ring for 4.5 seconds for test
  }

  isActive() {
    return this.isPlaying;
  }
}

export const orderRingtone = new OrderRingtoneService();
