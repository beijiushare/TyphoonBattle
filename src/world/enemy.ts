import * as C from '../config';
import type { GameAssets } from '../assets';
import type { Enemy } from '../types';
import { frameSetFor, pickTier, ringPosition } from './spawn';

export function freeEnemy(enemies: Enemy[]): Enemy | null {
  for (const e of enemies) {
    if (!e.alive) return e;
  }
  return null;
}

/** 把一档怪物写进空闲的对象池槽位；wi 由计分器分配 */
export function spawnInto(
  e: Enemy,
  wi: number,
  assets: GameAssets,
  t: number,
  player: { x: number; y: number },
  half: { w: number; h: number },
): void {
  const def = pickTier(t);
  const { x, y } = ringPosition(player.x, player.y, half.w, half.h);

  const hpMul = def.tier >= 2 ? 1 + t / 150 : 1;
  const grow = def.tier >= 2 ? Math.sqrt(hpMul) : 1;

  e.alive = true;
  e.def = def;
  e.kind = def.kind;
  e.x = x;
  e.y = y;
  e.hp = def.hp * hpMul;
  e.maxHp = e.hp;
  e.r = def.r * grow;
  e.wobble = Math.random() * Math.PI * 2;
  e.winIdx = wi;
  e.hitReady = t + 0.4;
  e.shootT = def.shootCd ? C.rand(0.8, def.shootCd) : 0;
  e.flash = 0;

  const fs = frameSetFor(assets, def);
  e.spr.textures = fs.frames;
  e.spr.animationSpeed = def.tier === 3 ? 0.32 : 0.22;
  e.spr.scale.set((def.visual / fs.w) * grow);
  e.spr.visible = true;
  e.spr.alpha = 1;
  e.spr.x = x;
  e.spr.y = y;
  e.spr.tint = 0xffffff;
  e.spr.gotoAndPlay(Math.floor(Math.random() * fs.frames.length));
}
