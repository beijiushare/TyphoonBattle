import type { HudState } from '../types';
import { el, fmtTime, pct } from './dom';

export class Hud {
  private hpFill = el<HTMLDivElement>('hpfill');
  private hpGhost = el<HTMLDivElement>('hpghost');
  private hpNum = el<HTMLDivElement>('hpnum');
  private goldEl = el<HTMLDivElement>('gold');
  private timeEl = el<HTMLDivElement>('time');
  private nextEl = el<HTMLDivElement>('nextcard');
  private rateEl = el<HTMLDivElement>('rate');
  private weaponsEl = el<HTMLDivElement>('weapons');
  private houseEl = el<HTMLButtonElement>('house');
  private houseCdEl = el<HTMLSpanElement>('house-cd');

  private cache = {
    hp: -1,
    energy: -1,
    time: '',
    next: '',
    rate: '',
    weapons: '',
    house: '',
  };

  update(s: HudState): void {
    const hpPct = Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100));
    if (Math.abs(hpPct - this.cache.hp) > 0.2) {
      this.cache.hp = hpPct;
      this.hpFill.style.width = `${hpPct}%`;
      this.hpGhost.style.width = `${hpPct}%`;
      this.hpNum.textContent = `${Math.ceil(s.hp)} / ${Math.round(s.maxHp)}`;
    }
    if (s.energy !== this.cache.energy) {
      this.cache.energy = s.energy;
      this.goldEl.textContent = `能量 ${s.energy}`;
    }
    const tm = fmtTime(s.time);
    if (tm !== this.cache.time) {
      this.cache.time = tm;
      this.timeEl.textContent = tm;
    }
    const nx = `下次采购 ${Math.ceil(s.nextShop)}s`;
    if (nx !== this.cache.next) {
      this.cache.next = nx;
      this.nextEl.textContent = nx;
    }
    const rate = `击杀率 ${pct(s.lastRate)}${s.windowRate !== null ? ` / 本窗 ${pct(s.windowRate)}` : ''}`;
    if (rate !== this.cache.rate) {
      this.cache.rate = rate;
      this.rateEl.textContent = rate;
    }

    const wp =
      `伞 x${s.umbrella}` +
      '|' +
      `靴 x${s.boots}` +
      '|' +
      `房 ${s.houseCd > 0 ? s.houseCd.toFixed(0) + 's' : '就绪'}`;
    if (wp !== this.cache.weapons) {
      this.cache.weapons = wp;
      const [a, b, c] = wp.split('|');
      this.weaponsEl.innerHTML = `<div class="wchip">${a}</div><div class="wchip">${b}</div><div class="wchip">${c}</div>`;
    }

    const houseState = s.houseCd > 0 ? `cooling:${Math.ceil(s.houseCd)}` : 'ready';
    if (houseState !== this.cache.house) {
      this.cache.house = houseState;
      if (s.houseCd > 0) {
        this.houseEl.classList.add('cooling');
        this.houseEl.classList.remove('ready');
      } else {
        this.houseEl.classList.remove('cooling');
        this.houseEl.classList.add('ready');
      }
    }
    if (s.houseCd > 0) this.houseCdEl.textContent = `${s.houseCd.toFixed(1)}s`;
    else this.houseCdEl.textContent = 'READY';
  }
}
