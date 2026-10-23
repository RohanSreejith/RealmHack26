/**
 * Hack-Eye Client-Side Web Audio Synthesizer Siren
 * Generates immediate deterministic acoustic alarms locally with zero network delay.
 */
class LocalAudioSiren {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.warbleInterval = null;
    this.currentPitch = 880;
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  startEmergencySiren() {
    if (this.isMuted || this.isPlaying) return;
    this.initAudioContext();

    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);

    // Initial attack
    this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator.start();
    this.isPlaying = true;

    // Alternating warble (880Hz <-> 440Hz)
    this.warbleInterval = setInterval(() => {
      if (!this.oscillator) return;
      this.currentPitch = this.currentPitch === 880 ? 440 : 880;
      this.oscillator.frequency.setTargetAtTime(this.currentPitch, this.audioCtx.currentTime, 0.05);
    }, 250);
  }

  stopSiren() {
    if (!this.isPlaying) return;
    clearInterval(this.warbleInterval);
    this.warbleInterval = null;

    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      setTimeout(() => {
        if (this.oscillator) {
          try {
            this.oscillator.stop();
            this.oscillator.disconnect();
          } catch (e) {}
          this.oscillator = null;
        }
        this.isPlaying = false;
      }, 120);
    } else {
      this.isPlaying = false;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isPlaying) {
      this.stopSiren();
    }
    return this.isMuted;
  }
}

window.localSiren = new LocalAudioSiren();
