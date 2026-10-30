import type { AnimatedSprite, Sprite } from 'pixi.js';
import type { Enemy } from '../types';
import { PLAYER_SCALE } from '../entities/pools';

export interface PlayerView {
  x: number;
  y: number;
  dx: number;
  hp: number;
  maxHp: number;
  invuln: number;
}

/** 每帧把逻辑状态刷到精灵上：主角翻转/无敌闪烁、双方血条、摄像机 */
export function syncSprites(
  t: number,
  player: PlayerView,
  playerSpr: AnimatedSprite,
  playerShadow: Sprite,
  barBg: Sprite,
  barFill: Sprite,
  enemies: Enemy[],
  camera: () => void,
): void {
  playerSpr.x = player.x;
  playerSpr.y = player.y;
  playerSpr.alpha = player.invuln > 0 ? (Math.sin(t * 45) > 0 ? 0.45 : 1) : 1;
  playerSpr.scale.x = player.dx > 0.02 ? -PLAYER_SCALE : PLAYER_SCALE;
  playerShadow.x = player.x;
  playerShadow.y = player.y + 22;

  const pw = 62;
  const ph = 3;
  barBg.visible = true;
  barBg.x = player.x - pw / 2 - 1;
  barBg.y = player.y - 74;
  barBg.scale.set(pw + 2, ph + 2);
  barFill.visible = true;
  barFill.x = player.x - pw / 2;
  barFill.y = player.y - 74;
  barFill.scale.set(Math.max(0, pw * (player.hp / player.maxHp)), ph);

  for (const e of enemies) {
    if (!e.alive) continue;
    e.spr.x = e.x;
    e.spr.y = e.y;
    e.spr.tint = e.flash > 0 ? 0xffd0d0 : 0xffffff;

    const w = Math.min(96, Math.max(30, e.r * 1.4));
    const h = 2;
    const top = e.y - e.r * 0.95 - 10;
    const ratio = Math.max(0, e.hp / e.maxHp);
    e.barBg.visible = true;
    e.barBg.x = e.x - w / 2 - 1;
    e.barBg.y = top;
    e.barBg.scale.set(w + 2, h + 1);
    e.barFill.visible = true;
    e.barFill.x = e.x - w / 2;
    e.barFill.y = top;
    e.barFill.scale.set(Math.max(0, w * ratio), h);
  }

  camera();
}
