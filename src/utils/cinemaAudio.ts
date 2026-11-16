class CinemaScoreEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlaying = false;
  private chordIndex = 0;

  // Warm nostalgic progression (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
  private chords = [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [164.81, 196.0, 246.94, 293.66], // Em7
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
  ];

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    if (this.isPlaying) return;

    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.masterGain!.gain.exponentialRampToValueAtTime(0.14, this.ctx.currentTime + 1.8);

    this.playChord();
    this.intervalId = window.setInterval(() => {
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      this.playChord();
    }, 4800);
  }

  private playChord() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const frequencies = this.chords[this.chordIndex];

    frequencies.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const noteGain = this.ctx.createGain();

      // Mix warm sine & soft triangle waves
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Slight analog tape detune
      osc.detune.setValueAtTime((i - 1.5) * 4, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(680, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.22 / frequencies.length, now + 1.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.2);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now + i * 0.12);
      osc.stop(now + 5.4);
    });
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
  }
}

export const cinemaScore = new CinemaScoreEngine();