import * as C from '../config';
import { music } from '../audio/music';
import { enterFullscreen, isLandscape, isTouchDevice, lockLandscape } from './fullscreen';
import { el } from './dom';

/** 标题窗口：开始 / 图鉴 / 设置（关于并入设置） */
export class TitleScreen {
  onStart: () => void = () => {};

  private nav = el<HTMLElement>('titleNav');
  private items: HTMLButtonElement[] = [];
  private pages: HTMLElement[] = [];
  private gameMusicBtn = el<HTMLButtonElement>('music');
  private gate = el<HTMLElement>('gate');
  private gateGo = el<HTMLButtonElement>('gateGo');
  private starting = false;

  constructor() {
    this.items = [...this.nav.querySelectorAll<HTMLButtonElement>('.fui-nav-item')];
    this.pages = [...document.querySelectorAll<HTMLElement>('.fui-page')];

    this.items.forEach((btn, i) => btn.addEventListener('click', () => this.select(i)));

    el<HTMLButtonElement>('start').addEventListener('click', () => {
      void this.requestStart();
    });
    this.gateGo.addEventListener('click', () => {
      void this.gateStart();
    });
    window.addEventListener('resize', () => this.syncGate());
    window.addEventListener('orientationchange', () => this.syncGate());

    music.restore();
    this.bindSettings();
    this.renderCodex();
    this.syncMusic();
    this.select(0);
  }

  private select(index: number): void {
    this.items.forEach((btn, i) => btn.classList.toggle('on', i === index));
    this.pages.forEach((page, i) => {
      page.hidden = i !== index;
    });
  }

  /** 点击开始：能直接横屏就横屏全屏进入，否则弹出横屏提示 */
  private async requestStart(): Promise<void> {
    if (this.starting) return;
    music.start();

    if (!isTouchDevice()) {
      this.startNow();
      return;
    }

    this.starting = true;
    await enterFullscreen();
    const locked = await lockLandscape();
    this.starting = false;

    if (locked || isLandscape()) {
      this.startNow();
      return;
    }
    this.showGate();
  }

  private async gateStart(): Promise<void> {
    if (this.starting || !isLandscape()) return;
    this.starting = true;
    await enterFullscreen();
    this.starting = false;
    this.startNow();
  }

  private startNow(): void {
    this.gate.classList.add('hidden');
    this.onStart();
  }

  private showGate(): void {
    this.gate.classList.remove('hidden');
    this.syncGate();
  }

  private syncGate(): void {
    if (this.gate.classList.contains('hidden')) return;
    const ready = isLandscape();
    this.gateGo.disabled = !ready;
    this.gateGo.textContent = ready ? '进入游戏' : '请横屏后点击';
  }

  private bindSettings(): void {
    const box = el<HTMLInputElement>('setMusic');
    box.addEventListener('change', () => {
      if (box.checked !== music.isOn()) music.toggle();
      this.syncMusic();
    });

    const vol = el<HTMLInputElement>('setVolume');
    const volVal = el<HTMLElement>('volVal');
    vol.addEventListener('input', () => {
      music.setVolume(Number(vol.value) / 100);
      volVal.textContent = vol.value;
    });

    this.gameMusicBtn.addEventListener('click', () => {
      music.toggle();
      this.syncMusic();
    });
  }

  private syncMusic(): void {
    const on = music.isOn();
    el<HTMLInputElement>('setMusic').checked = on;
    const vol = el<HTMLInputElement>('setVolume');
    const value = Math.round(music.getVolume() * 100);
    vol.value = String(value);
    el<HTMLElement>('volVal').textContent = String(value);
    this.gameMusicBtn.textContent = on ? '音乐 开' : '音乐 关';
    this.gameMusicBtn.classList.toggle('off', !on);
  }

  private renderCodex(): void {
    const rows: Array<[string, string]> = [
      ['雨伞', `对风 ${C.UMBRELLA.dmgWind} / 对雨 ${C.UMBRELLA.dmgWater}，穿透 3，射程 ${C.UMBRELLA.range}`],
      ['雨靴', `对雨 ${C.BOOT.dmgWater} / 对风 ${C.BOOT.dmgWind}，穿透 2，射程 ${C.BOOT.range}`],
      ['房子', `半径 ${C.HOUSE.radius}，CD ${C.HOUSE.cd}s，对风 ${C.HOUSE.dmgWind}`],
      ['能量点', `面值 ${C.ORB.value}，拾取 ${C.ORB.pickupR}，磁吸 170`],
      ['红色能量点', `回血 +${C.ORB.healAmount}`],
      ['生命', `初始 ${C.PLAYER.maxHp}，上限 ${C.PLAYER.hpCap}`],
      ['移动速度', `${C.PLAYER.speed}`],
    ];
    for (const item of C.SHOP) {
      rows.push([item.name, `${item.desc} — ${item.tip}`]);
    }

    el('codex').innerHTML = rows
      .map(([k, v]) => `<div class="cx"><b>${k}</b><span>${v}</span></div>`)
      .join('');
  }
}
