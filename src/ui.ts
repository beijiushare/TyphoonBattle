import type { HudState, RunResult, ShopView } from './types';
import { el } from './ui/dom';
import { InputController } from './ui/input';
import { Hud } from './ui/hud';
import { ShopPanel } from './ui/shop';
import { Overlays } from './ui/overlay';
import { enterFullscreenIfMobile } from './ui/fullscreen';
import { music } from './audio/music';

export class UI {
  onStart: () => void = () => {};
  onRestart: () => void = () => {};
  onHouse: () => void = () => {};

  private input = new InputController();
  private hud = new Hud();
  private shop = new ShopPanel();
  private overlays = new Overlays();

  constructor() {
    this.input.onHouse = () => this.onHouse();
    this.overlays.onRestart = () => this.onRestart();

    el<HTMLButtonElement>('start').addEventListener('click', () => {
      enterFullscreenIfMobile();
      music.start();
      this.onStart();
    });

    const musicBtn = el<HTMLButtonElement>('music');
    musicBtn.addEventListener('click', () => {
      const on = music.toggle();
      musicBtn.textContent = on ? '音乐 开' : '音乐 关';
      musicBtn.classList.toggle('off', !on);
    });

    const hint = document.createElement('div');
    hint.className = 'rotate-hint show';
    hint.textContent = '请横屏游玩';
    el('ui').appendChild(hint);
  }

  getInput(): { x: number; y: number } {
    return this.input.getInput();
  }

  setPlaying(v: boolean): void {
    this.overlays.setPlaying(v);
  }

  hideTitle(): void {
    this.overlays.hideTitle();
  }

  updateHud(s: HudState): void {
    this.hud.update(s);
  }

  showShop(view: ShopView, onBuy: (id: string) => ShopView, onClose: () => void): void {
    this.shop.show(view, onBuy, onClose);
  }

  showOver(r: RunResult): void {
    this.overlays.showOver(r);
  }

  hideOver(): void {
    this.overlays.hideOver();
  }

  flash(): void {
    this.overlays.flash();
  }
}
