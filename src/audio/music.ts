/**
 * 纯代码 BGM：纯风（无雨、无雷）
 * 底层：两路带通噪声（低频呼呼 + 高空细啸）+ 低频风身，慢速扫频
 * 阵风：每 3.5~8s 随机来一阵，扫频/音量/声像都随机
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
    master.gain.linearRampToValueAtTime(this.on ? 2 : 0, ctx.currentTime + 2);

    // 音量较大，用限幅器兜底，避免阵风叠加时爆音
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    this.master = master;

    this.windBed(ctx, master);
    this.scheduleGust();

    (window as unknown as { __music?: Music }).__music = this;
  }

  toggle(): boolean {
    this.on = !this.on;
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this.on ? 2 : 0, t + 0.4);
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

  private windBed(ctx: AudioContext, out: AudioNode): void {
    // 低频呼呼
    const low = this.loopNoise(ctx);
    const lowBp = ctx.createBiquadFilter();
    lowBp.type = 'bandpass';
    lowBp.frequency.value = 380;
    lowBp.Q.value = 4.5;
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.28;
    low.connect(lowBp);
    lowBp.connect(lowGain);
    lowGain.connect(out);

    const lowLfo = ctx.createOscillator();
    lowLfo.frequency.value = 0.06;
    const lowDepth = ctx.createGain();
    lowDepth.gain.value = 220;
    lowLfo.connect(lowDepth);
    lowDepth.connect(lowBp.frequency);
    lowLfo.start();

    // 高空细啸
    const high = this.loopNoise(ctx);
    const highBp = ctx.createBiquadFilter();
    highBp.type = 'bandpass';
    highBp.frequency.value = 1300;
    highBp.Q.value = 12;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.15;
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

    // 更尖的边哨
    const edge = this.loopNoise(ctx);
    const edgeBp = ctx.createBiquadFilter();
    edgeBp.type = 'bandpass';
    edgeBp.frequency.value = 2600;
    edgeBp.Q.value = 14;
    const edgeGain = ctx.createGain();
    edgeGain.gain.value = 0.08;
    const edgeLfo = ctx.createOscillator();
    edgeLfo.frequency.value = 0.05;
    const edgeDepth = ctx.createGain();
    edgeDepth.gain.value = 220;
    edgeLfo.connect(edgeDepth);
    edgeDepth.connect(edgeBp.frequency);
    edgeLfo.start();
    edge.connect(edgeBp);
    edgeBp.connect(edgeGain);
    edgeGain.connect(out);
    // 低频风身
    const body = this.loopNoise(ctx);
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = 320;
    bodyLp.Q.value = 0.8;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.12;
    body.connect(bodyLp);
    bodyLp.connect(bodyGain);
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
    const topFreq = 1100 + Math.random() * 900;

    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(ctx, 4);
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 5 + Math.random() * 4;
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
}

export const music = new Music();
