import * as C from '../config';

interface Bucket {
  a: number;
  k: number;
}

/**
 * 10 秒窗口计分：score = Σ(窗口 ms × 该窗口击杀率)
 * 小样本窗口（spawned < minSpawn）并入下一窗口。
 */
export class ScoreTracker {
  score = 0;
  totalSpawned = 0;
  totalKilled = 0;
  lastRate: number | null = null;

  private buckets = new Map<number, Bucket>();
  private carry = { ms: 0, a: 0, k: 0 };
  private closedUpTo = 0;

  reset(): void {
    this.score = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.lastRate = null;
    this.buckets.clear();
    this.carry = { ms: 0, a: 0, k: 0 };
    this.closedUpTo = 0;
  }

  spawnWindow(t: number): number {
    let wi = Math.floor(t / C.SCORE.window);
    if (t - wi * C.SCORE.window > C.SCORE.window - C.SCORE.edgeCarry) wi += 1;
    return wi;
  }

  addSpawn(t: number): number {
    const wi = this.spawnWindow(t);
    const b = this.buckets.get(wi);
    if (b) b.a += 1;
    else this.buckets.set(wi, { a: 1, k: 0 });
    this.totalSpawned++;
    return wi;
  }

  addKill(winIdx: number): void {
    this.totalKilled++;
    const b = this.buckets.get(winIdx);
    if (b) b.k += 1;
    else this.buckets.set(winIdx, { a: 0, k: 1 });
  }

  update(t: number): void {
    const idx = Math.floor(t / C.SCORE.window);
    while (this.closedUpTo < idx) {
      this.closeWindow(this.closedUpTo, C.SCORE.window * 1000);
      this.closedUpTo++;
    }
  }

  liveWindow(t: number): number | null {
    const b = this.buckets.get(Math.floor(t / C.SCORE.window));
    return b && b.a > 0 ? b.k / b.a : null;
  }

  finalize(t: number): { score: number; rate: number } {
    const idx = Math.floor(t / C.SCORE.window);
    const partialMs = (t - idx * C.SCORE.window) * 1000;
    let a = this.carry.a;
    let k = this.carry.k;
    const ms = this.carry.ms + partialMs;
    for (const [key, b] of this.buckets) {
      if (key >= idx) {
        a += b.a;
        k += b.k;
      }
    }
    if (a > 0) this.score += Math.floor((ms * k) / a);
    const rate = this.totalSpawned > 0 ? this.totalKilled / this.totalSpawned : 0;
    return { score: this.score, rate };
  }

  private closeWindow(i: number, ms: number): void {
    const b = this.buckets.get(i) ?? { a: 0, k: 0 };
    this.buckets.delete(i);
    const totalMs = ms + this.carry.ms;
    const a = b.a + this.carry.a;
    const k = b.k + this.carry.k;
    if (a >= C.SCORE.minSpawn) {
      this.score += Math.floor((totalMs * k) / a);
      this.lastRate = k / a;
      this.carry = { ms: 0, a: 0, k: 0 };
    } else {
      this.carry = { ms: totalMs, a, k };
    }
  }
}
