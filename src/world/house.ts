import * as C from '../config';
import type { Enemy } from '../types';

export function houseBlast(
  player: { x: number; y: number },
  houseLv: number,
  enemies: Enemy[],
  damage: (e: Enemy, dmg: number) => void,
  effect: (kind: 'ring' | 'house', x: number, y: number, from: number, to: number, dur: number) => void,
): void {
  const radius = C.HOUSE.radius + (houseLv - 1) * C.HOUSE.radiusPerLv;
  const dmgWind = C.HOUSE.dmgWind + (houseLv - 1) * C.HOUSE.dmgPerLv;
  const dmgWater = C.HOUSE.dmgWater + (houseLv - 1) * C.HOUSE.dmgPerLv * 0.5;

  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > radius + e.r) continue;
    if (d > 0.5) {
      e.x += (dx / d) * 70;
      e.y += (dy / d) * 70;
    }
    damage(e, e.kind === 'wind' ? dmgWind : dmgWater);
  }

  effect('ring', player.x, player.y, 0.15, radius / 100, 0.55);
  effect('house', player.x, player.y, 2.4, 1, 0.8);
}
