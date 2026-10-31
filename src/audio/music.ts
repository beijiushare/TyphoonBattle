/**
 * 纯代码 BGM：只有雨声 + 偶尔的雷声
 * 雨：两层循环白噪声（高频雨幕 + 低频雨身）
 * 雷：随机 15~45s 一次，低频噪声 + 长衰减
 */
export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
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
    this.scheduleThunder();

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
    // 高频雨幕
    const hiss = this.loopNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700;
    bp.Q.value = 0.55;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.05;
    hiss.connect(bp);
    bp.connect(hissGain);
    hissGain.connect(out);

    // 低频雨身，让雨有厚度
    const body = this.loopNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.8;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.035;
    body.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(out);
  }

  private scheduleThunder(): void {
    const wait = 15000 + Math.random() * 30000;
    window.setTimeout(() => {
      this.thunder();
      this.scheduleThunder();
    }, wait);
  }

  private thunder(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 110;
    lp.Q.value = 1.3;

    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28 + Math.random() * 0.12, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.8 + Math.random());

    src.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    src.start(t);
    src.stop(t + 4);
  }
}

export const music = new Music();
