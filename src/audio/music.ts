/**
 * 纯代码 BGM：雨声 + 偶发雷声
 * 雨：左右两路去相关的带限噪声（600Hz~6kHz）+ 一层低频雨身，带缓慢起伏
 * 雷：先一声中频炸裂，再拖长低频轰鸣；首次约 6s，之后 10~22s 随机
 */
export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
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
    master.gain.linearRampToValueAtTime(this.on ? 1 : 0, ctx.currentTime + 2);
    master.connect(ctx.destination);
    this.master = master;

    this.rain(ctx, master);
    this.scheduleThunder(4000);
    this.scheduleDroplets();

    (window as unknown as { __music?: Music }).__music = this;
  }

  toggle(): boolean {
    this.on = !this.on;
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this.on ? 1 : 0, t + 0.4);
    }
    return this.on;
  }

  /** 生成首尾交叉淡化的噪声，循环时不会出现"咔"的接缝 */
  private makeNoise(ctx: AudioContext, seconds = 6): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const fade = Math.floor(ctx.sampleRate * 0.08);
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      data[len - fade + i] = data[len - fade + i] * (1 - t) + data[i] * t;
    }
    return buf;
  }

  private loopNoise(ctx: AudioContext): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(ctx);
    src.loop = true;
    src.start();
    return src;
  }

  private rain(ctx: AudioContext, out: AudioNode): void {
    // 左右两路雨幕：带通限幅，去掉刺耳的超高频和浑浊的低频
    for (const pan of [-0.7, 0.7]) {
      const src = this.loopNoise(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 700;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5200;
      lp.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.value = 0.06;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      src.connect(hp);
      hp.connect(lp);
      lp.connect(gain);
      gain.connect(panner);
      panner.connect(out);
    }

    // 低频雨身 + 缓慢起伏，避免像一条死板的噪声带
    const body = this.loopNoise(ctx);
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = 520;
    bodyLp.Q.value = 0.7;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.11;
    body.connect(bodyLp);
    bodyLp.connect(bodyGain);
    bodyGain.connect(out);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const depth = ctx.createGain();
    depth.gain.value = 0.03;
    lfo.connect(depth);
    depth.connect(bodyGain.gain);
    lfo.start();
  }

  private scheduleDroplets(): void {
    window.setTimeout(() => {
      this.droplet();
      this.scheduleDroplets();
    }, 120 + Math.random() * 280);
  }

  private droplet(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 1800, t);

    const gain = ctx.createGain();
    const peak = 0.012 + Math.random() * 0.012;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0004, t + 0.06 + Math.random() * 0.05);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.random() * 2 - 1;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(out);
    osc.start(t);
    osc.stop(t + 0.16);
  }
  private scheduleThunder(firstMs: number): void {
    const wait = firstMs > 0 ? firstMs : 10000 + Math.random() * 12000;
    window.setTimeout(() => {
      this.thunder();
      this.scheduleThunder(0);
    }, wait);
  }

  private thunder(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // 炸裂：中频短促，手机上也能听见
    const crack = ctx.createBufferSource();
    crack.buffer = this.makeNoise(ctx, 1);
    const crackBp = ctx.createBiquadFilter();
    crackBp.type = 'bandpass';
    crackBp.frequency.value = 750;
    crackBp.Q.value = 0.7;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0, t);
    crackGain.gain.linearRampToValueAtTime(0.8, t + 0.03);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    crack.connect(crackBp);
    crackBp.connect(crackGain);
    crackGain.connect(out);
    crack.start(t);
    crack.stop(t + 0.8);

    // 轰鸣：低频拖尾
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.makeNoise(ctx, 6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 1.1;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.linearRampToValueAtTime(0.85, t + 0.14);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
    rumble.connect(lp);
    lp.connect(rumbleGain);
    rumbleGain.connect(out);
    rumble.start(t);
    rumble.stop(t + 4.6);
  }
}

export const music = new Music();
