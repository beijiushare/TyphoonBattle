import type { Container, TilingSprite } from 'pixi.js';
import { VIEW_H } from '../config';

/** 摄像机：主角恒定在屏幕正中，纸纹按视口大小平铺并跟随。 */
export class Camera {
  scale = 1;
  private sw = 1280;
  private sh = 720;

  setViewport(w: number, h: number): void {
    this.sw = w;
    this.sh = h;
    this.scale = h / VIEW_H;
  }

  half(): { w: number; h: number } {
    return { w: this.sw / (2 * this.scale), h: this.sh / (2 * this.scale) };
  }

  resizePaper(paper: TilingSprite): void {
    const half = this.half();
    paper.width = half.w * 2 + 8;
    paper.height = half.h * 2 + 8;
  }

  apply(world: Container, paper: TilingSprite, px: number, py: number): void {
    world.scale.set(this.scale);
    world.position.set(this.sw / 2 - px * this.scale, this.sh / 2 - py * this.scale);

    const half = this.half();
    const left = px - half.w - 4;
    const top = py - half.h - 4;
    paper.x = left;
    paper.y = top;
    paper.tilePosition.set(left, top);
  }
}
