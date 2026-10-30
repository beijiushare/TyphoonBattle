import type { HudState, RunResult, ShopView } from './types';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
}

const fmtTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const pct = (v: number | null): string => (v === null ? '--' : `${(v * 100).toFixed(1)}%`);

export class UI {
  onStart: () => void = () => {};
  onRestart: () => void = () => {};
  onHouse: () => void = () => {};

  private keys = new Set<string>();
  private joyVec = { x: 0, y: 0 };
  private joyId: number | null = null;

  private joy = el<HTMLDivElement>('joy');
  private knob = el<HTMLDivElement>('joyknob');
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
  private cardsEl = el<HTMLDivElement>('cards');
  private titleEl = el<HTMLDivElement>('title');
  private overEl = el<HTMLDivElement>('over');
  private flashEl = el<HTMLDivElement>('flash');

  private cache = {
    hp: -1,
    energy: -1,
    time: '',
    next: '',
    rate: '',
    weapons: '',
    house: '',
  };
  private flashTimer = 0;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      this.keys.add(e.code);
      if (e.code === 'Space' && !e.repeat) this.onHouse();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.joy.addEventListener('pointerdown', (e) => {
      if (this.joyId !== null) return;
      this.joyId = e.pointerId;
      this.joy.setPointerCapture(e.pointerId);
      this.joy.classList.add('active');
      this.moveStick(e.clientX, e.clientY);
    });
    this.joy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyId) return;
      this.moveStick(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null;
      this.joyVec = { x: 0, y: 0 };
      this.joy.classList.remove('active');
      this.knob.style.transform = 'translate(0px, 0px)';
    };
    this.joy.addEventListener('pointerup', end);
    this.joy.addEventListener('pointercancel', end);

    this.houseEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onHouse();
    });

    el<HTMLButtonElement>('start').addEventListener('click', () => this.onStart());

    const hint = document.createElement('div');
    hint.className = 'rotate-hint show';
    hint.textContent = '请横屏游玩';
    el('ui').appendChild(hint);
  }

  private moveStick(cx: number, cy: number): void {
    const rect = this.joy.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    const dx = cx - ox;
    const dy = cy - oy;
    const d = Math.hypot(dx, dy);
    const max = rect.width * 0.42;
    const m = Math.min(1, d / max);
    if (d < 1) {
      this.joyVec = { x: 0, y: 0 };
      this.knob.style.transform = 'translate(0px, 0px)';
      return;
    }
    this.joyVec = { x: (dx / d) * m, y: (dy / d) * m };
    const kx = (dx / d) * Math.min(d, max);
    const ky = (dy / d) * Math.min(d, max);
    this.knob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
  }

  getInput(): { x: number; y: number } {
    if (this.joyId !== null) return this.joyVec;
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    return { x, y };
  }

  setPlaying(v: boolean): void {
    document.body.classList.toggle('playing', v);
  }

  hideTitle(): void {
    this.titleEl.classList.add('hidden');
  }

  updateHud(s: HudState): void {
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

    const wp = `伞 x${s.umbrella}` + '|' + `靴 x${s.boots}` + '|' + `房 ${s.houseCd > 0 ? s.houseCd.toFixed(0) + 's' : '就绪'}`;
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

  showShop(view: ShopView, onBuy: (id: string) => ShopView, onClose: () => void): void {
    const render = (v: ShopView): void => {
      this.cardsEl.innerHTML = '';

      const panel = document.createElement('div');
      panel.className = 'shop';

      const head = document.createElement('div');
      head.className = 'shop-head';
      head.innerHTML = `<span>台风应急采购</span><b>能量 ${v.energy}</b>`;
      panel.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'shop-grid';

      for (const item of v.items) {
        const disabled = item.soldOut || item.price > v.energy;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shop-item' + (disabled ? ' disabled' : '');
        btn.innerHTML = `
          <div class="si-top"><span class="si-name">${item.name}</span><span class="si-price">${item.soldOut ? '已售罄' : item.price}</span></div>
          <div class="si-desc">${item.desc}</div>
          <div class="si-tip">${item.tip}</div>
        `;
        if (!disabled) {
          btn.addEventListener('click', () => {
            const next = onBuy(item.id);
            render(next);
          });
        }
        grid.appendChild(btn);
      }

      panel.appendChild(grid);

      const foot = document.createElement('div');
      foot.className = 'shop-foot';
      const go = document.createElement('button');
      go.type = 'button';
      go.id = 'shop-go';
      go.textContent = '继续顶着台风走';
      go.addEventListener('click', () => {
        this.cardsEl.classList.add('hidden');
        onClose();
      });
      foot.appendChild(go);
      panel.appendChild(foot);

      this.cardsEl.appendChild(panel);
      this.cardsEl.classList.remove('hidden');
    };

    render(view);
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
