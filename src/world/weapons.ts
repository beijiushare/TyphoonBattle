import * as C from '../config';
import type { Enemy } from '../types';

export interface WeaponsState {
  umbrellaSlots: number;
  umbrellaArms: number;
  umbrellaBonus: number;
  rangeBonus: number;
  rot: number;
  fire: number;
  bootSlots: number;
  bootBonus: number;
  bootFire: number;
}

export interface Shooter {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export type SpawnBullet = (
  kind: 'umbrella' | 'boot',
  x: number,
  y: number,
  ang: number,
  speed: number,
  range: number,
  dmgWind: number,
  dmgWater: number,
  pierce: number,
) => void;

export function createWeapons(): WeaponsState {
  return {
    umbrellaSlots: 1,
    umbrellaArms: 1,
    umbrellaBonus: 0,
    rangeBonus: 0,
    rot: 0,
    fire: 0,
    bootSlots: 1,
    bootBonus: 0,
    bootFire: 0,
  };
}

/**
 * 伞：随旋转角甩出，股数随升级增加，不索敌
 * 靴：单发连射，朝最近敌人（无敌人则朝最后移动方向）
 */
export function updateWeapons(
  dt: number,
  player: Shooter,
  w: WeaponsState,
  nearest: (x: number, y: number) => Enemy | null,
  spawn: SpawnBullet,
): void {
  w.rot += C.UMBRELLA.spin * dt;

  const uRange = Math.min(C.UMBRELLA.rangeMax, C.UMBRELLA.range + w.rangeBonus);
  const uDmgMul = 1 + w.umbrellaBonus;

  w.fire -= dt;
  if (w.fire <= 0) {
    w.fire += C.UMBRELLA.cd / w.umbrellaSlots;
    for (let k = 0; k < w.umbrellaArms; k++) {
      const ang = w.rot + (k * Math.PI * 2) / w.umbrellaArms;
      spawn(
        'umbrella',
        player.x,
        player.y,
        ang,
        C.UMBRELLA.speed,
        uRange,
        C.UMBRELLA.dmgWind * uDmgMul,
        C.UMBRELLA.dmgWater * uDmgMul,
        3,
      );
    }
  }

  const bRange = Math.min(C.BOOT.rangeMax, C.BOOT.range + w.rangeBonus);
  const bDmgMul = 1 + w.bootBonus;
  const bPierce = 2;

  w.bootFire -= dt;
  while (w.bootFire <= 0) {
    w.bootFire += C.BOOT.cd / w.bootSlots;
    const target = nearest(player.x, player.y);
    const baseAng = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : Math.atan2(player.dy, player.dx);
    spawn(
      'boot',
      player.x,
      player.y,
      baseAng + C.rand(-C.BOOT.spread, C.BOOT.spread),
      C.BOOT.speed,
      bRange,
      C.BOOT.dmgWind * bDmgMul,
      C.BOOT.dmgWater * bDmgMul,
      bPierce,
    );
  }
}
