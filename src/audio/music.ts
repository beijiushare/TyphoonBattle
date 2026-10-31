/**
 * 纯代码 BGM：台风大风 + 偶发雷声
 * 风：底层呼啸（带通噪声 + 慢速扫频）+ 低频风身；每隔几秒随机刮一阵阵风（带扫频与声像）
 * 雷：15~35s 随机一次
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

    this.windBed(ctx, master);
    this.scheduleGust();
    this.scheduleThunder(8000);

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

  /** 首尾交叉淡化的噪声，循环无接缝 */
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

  /** 底层持续风：窄带呼啸 + 低频风身，带慢速扫频 */
  private windBed(ctx: AudioContext, out: AudioNode): void {
    const whistle = this.loopNoise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 380;
    bp.Q.value = 4.5;
    const whistleGain = ctx.createGain();
    whistleGain.gain.value = 0.28;
    whistle.connect(bp);
    bp.connect(whistleGain);
    whistleGain.connect(out);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const depth = ctx.createGain();
    depth.gain.value = 220;
    lfo.connect(depth);
    depth.connect(bp.frequency);
    lfo.start();

    // 高空细啸：更高更窄的一层，出现"咻——"的感觉
    const high = this.loopNoise(ctx);
    const highBp = ctx.createBiquadFilter();
    highBp.type = 'bandpass';
    highBp.frequency.value = 880;
    highBp.Q.value = 9;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.07;
    const highLfo = ctx.createOscillator();
    highLfo.frequency.value = 0.04;
    const highDepth = ctx.createGain();
    highDepth.gain.value = 140;
    highLfo.connect(highDepth);
    highDepth.connect(highBp.frequency);
    highLfo.start();
    high.connect(highBp);
    highBp.connect(highGain);
    highGain.connect(out);
    const body = this.loopNoise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.8;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.18;
    body.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(out);
  }

  private scheduleGust(): void {
    const wait = 3500 + Math.random() * 4500;
    window.setTimeout(() => {
      this.gust();
      this.scheduleGust();
    }, wait);
  }

  /** 一阵风：噪声过扫频带通，音量先起后落，随机声像 */
  private gust(): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const t = ctx.currentTime;
    const dur = 2.5 + Math.random() * 2.5;
    const peak = 0.14 + Math.random() * 0.1;
    const startFreq = 260 + Math.random() * 180;
    const topFreq = 700 + Math.random() * 600;

    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(ctx, 4);
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3.5 + Math.random() * 3;
    bp.frequency.setValueAtTime(startFreq, t);
    bp.frequency.linearRampToValueAtTime(topFreq, t + dur * 0.35);
    bp.frequency.linearRampToValueAtTime(startFreq * 1.1, t + dur);

    const gain = ctx.createGain();
    const attack = 0.5 + Math.random() * 0.8;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.linearRampToValueAtTime(peak * 0.6, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + dur);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.random() * 1.4 - 0.7;

    src.connect(bp);
    bp.connect(gain);
    gain.connect(panner);
    panner.connect(out);

    src.start(t);
    src.stop(t + dur + 0.1);
  }

  private scheduleThunder(firstMs: number): void {
    const wait = firstMs > 0 ? firstMs : 15000 + Math.random() * 20000;
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

    // 炸裂：中频短促
    const crack = ctx.createBufferSource();
    crack.buffer = this.makeNoise(ctx, 1);
    const crackBp = ctx.createBiquadFilter();
    crackBp.type = 'bandpass';
    crackBp.frequency.value = 750;
    crackBp.Q.value = 0.7;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0, t);
    crackGain.gain.linearRampToValueAtTime(0.7, t + 0.03);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    crack.connect(crackBp);
    crackBp.connect(crackGain);
    crackGain.connect(out);
    crack.start(t);
    crack.stop(t + 1);

    // 轰鸣：低频拖尾
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.makeNoise(ctx, 6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 1.1;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.linearRampToValueAtTime(0.6, t + 0.14);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
    rumble.connect(lp);
    lp.connect(rumbleGain);
    rumbleGain.connect(out);
    rumble.start(t);
    rumble.stop(t + 4.8);
  }
}

export const music = new Music();
