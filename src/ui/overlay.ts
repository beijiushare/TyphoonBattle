import type { RunResult } from '../types';
import { el, fmtTime } from './dom';

export class Overlays {
  onRestart: () => void = () => {};

  private titleEl = el<HTMLDivElement>('title');
  private overEl = el<HTMLDivElement>('over');
  private flashEl = el<HTMLDivElement>('flash');
  private flashTimer = 0;

  setPlaying(v: boolean): void {
    document.body.classList.toggle('playing', v);
  }

  hideTitle(): void {
    this.titleEl.classList.add('hidden');
  }

  showOver(r: RunResult): void {
    const key = 'typhoon.best';
    let best = 0;
    try {
      best = Number(localStorage.getItem(key) ?? '0') || 0;
    } catch {
      best = 0;
    }
    const isNew = r.score > best;
    if (isNew) {
      try {
        localStorage.setItem(key, String(r.score));
      } catch {
        /* ignore */
      }
    }
    const bestShown = isNew ? r.score : best;

    this.overEl.innerHTML = `
      <div class="score">${r.score.toLocaleString()}</div>
      <div class="stat"><span>存活时间</span><span>${fmtTime(r.time)}</span></div>
      <div class="stat"><span>击杀 / 刷新</span><span>${r.kills} / ${r.spawned}</span></div>
      <div class="stat"><span>加权击杀率</span><span>${(r.rate * 100).toFixed(2)}%</span></div>
      <div class="stat"><span>最高分</span><span>${bestShown.toLocaleString()}</span></div>
      ${isNew ? '<div class="newbest">NEW BEST</div>' : ''}
      <button id="again" type="button">再来一局</button>
    `;
    this.overEl.classList.remove('hidden');
    const again = document.getElementById('again');
    if (again) again.addEventListener('click', () => this.onRestart());
  }

  hideOver(): void {
    this.overEl.classList.add('hidden');
  }

  flash(): void {
    this.flashEl.classList.add('on');
    if (this.flashTimer) window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => {
      this.flashEl.classList.remove('on');
    }, 70);
  }
}
