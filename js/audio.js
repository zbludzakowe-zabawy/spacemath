'use strict';
/* Proste efekty dźwiękowe generowane przez Web Audio API (bez plików). */

const Sound = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone(freq, dur, type = 'sine', vol = 0.15, freqEnd = null, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  noise(dur, vol = 0.2, filterFreq = 1200, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t0);
  },

  key()     { this.tone(700, 0.05, 'sine', 0.05); },
  laser()   { this.tone(1400, 0.18, 'square', 0.05, 180); this.tone(900, 0.15, 'sawtooth', 0.03, 120); },
  boom()    { this.noise(0.6, 0.35, 900); this.tone(140, 0.4, 'sine', 0.25, 40); },
  wrong()   { this.tone(240, 0.12, 'sawtooth', 0.08, 160); this.tone(160, 0.2, 'sawtooth', 0.08, 110, 0.12); },
  escape()  { this.tone(420, 0.45, 'triangle', 0.14, 90); },
  pop()     { this.noise(0.35, 0.18, 2600); this.tone(80 + Math.random() * 60, 0.2, 'sine', 0.12, 40); },
  whistle() { this.tone(500 + Math.random() * 300, 0.6, 'sine', 0.03, 1600); },
  levelUp() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.14, null, i * 0.11));
  },
  victory() {
    [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.15, null, i * 0.16));
  },
};
