/**
 * 纯代码 BGM：WebAudio 合成的台风氛围
 * - 雨：循环白噪声 + 带通
 * - 风：低通噪声 + 慢速 LFO 扫频
 * - 和声垫：Am → F → C → G 的低音三角波长音
 * - 点缀：五声音阶随机拨弦 + 偶发低沉雷声
 */
const CHORDS: number[][] = [
  [110.0, 130.81, 164.81], // Am
  [87.31, 110.0, 130.81], // F
  [130.81, 164.81, 196.0], // C
  [98.0, 123.47, 146.83], // G
];

const PENTA = [440, 523.25, 587.33, 659.25, 783.99];

export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private chordIndex = 0;
  private on = true;

  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(this.on ? 0.5 : 0, ctx.currentTime + 2.5);
    master.connect(ctx.destination);
    this.master = master;

    this.noise = this.makeNoise(ctx);
    this.rain(ctx, master);
    this.wind(ctx, master);

    this.playPad();
    window.setInterval(() => this.playPad(), 8000);
    window.setInterval(() => this.playPluck(), 1900);
    window.setInterval(() => this.thunder(), 26000);

    (window as unknown as { __music?: Music }).__music = this;
  }

  toggle(): boolean {
    this.on = !this.on;
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this.on ? 0.5 : 0, t + 0.4);
    }
    return this.on;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private loopNoise(ctx: AudioContext): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.start();
    return src;
  }

  private rain(ctx: AudioContext, out: AudioNode): void {
    const src = this.loopNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(bp);
    bp.connect(gain);
    gain.connect(out);
  }

  private wind(ctx: AudioContext, out: AudioNode): void {
    const src = this.loopNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(lp);
    lp.connect(gain);
    gain.connect(out);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = 90;
    lfo.connect(depth);
    depth.connect(lp.frequency);
    lfo.start();
  }

  private playPad(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const chord = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex += 1;

    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 2.2);
    gain.gain.setValueAtTime(0.045, t + 6);
    gain.gain.linearRampToValueAtTime(0, t + 8.4);
    gain.connect(out);

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 5;
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 8.6);
    });

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = chord[0] / 2;
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.03, t + 2);
    subGain.gain.linearRampToValueAtTime(0, t + 8.4);
    sub.connect(subGain);
    subGain.connect(out);
    sub.start(t);
    sub.stop(t + 8.6);
  }

  private playPluck(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out || Math.random() < 0.35) return;

    const freq = PENTA[Math.floor(Math.random() * PENTA.length)] / 2;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + 1.7);
  }

  private thunder(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 120;
    lp.Q.value = 1.2;

    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    src.start(t);
    src.stop(t + 3.4);
  }
}

export const music = new Music();
