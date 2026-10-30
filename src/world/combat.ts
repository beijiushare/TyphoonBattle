import * as C from '../config';
import type { Bullet, Enemy, Orb } from '../types';

const CELL = 64;

export function updateBullets(
  dt: number,
  bullets: Bullet[],
  grid: Map<number, Enemy[]>,
  damage: (e: Enemy, dmg: number) => void,
): void {
  for (const b of bullets) {
    if (!b.alive) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.traveled += b.speed * dt;

    if (
      b.traveled > b.range ||
      b.x < -200 ||
      b.x > C.WORLD_W + 200 ||
      b.y < -200 ||
      b.y > C.WORLD_H + 200
    ) {
      b.alive = false;
      b.spr.visible = false;
      continue;
    }

    const gx = Math.floor(b.x / CELL);
    const gy = Math.floor(b.y / CELL);
    for (let ox = -1; ox <= 1 && b.alive; ox++) {
      for (let oy = -1; oy <= 1 && b.alive; oy++) {
        const arr = grid.get((gx + ox + 64) * 512 + (gy + oy + 64));
        if (!arr) continue;
        for (const e of arr) {
          if (!e.alive || b.hits.has(e)) continue;
          const rr = e.r + b.r;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy > rr * rr) continue;
          b.hits.add(e);
          damage(e, e.kind === 'wind' ? b.dmgWind : b.dmgWater);
          if (b.pierce > 0) {
            b.pierce -= 1;
          } else {
            b.alive = false;
            b.spr.visible = false;
          }
          break;
        }
      }
    }

    if (!b.alive) continue;
    if (b.spin) b.spr.rotation += b.spin * dt;
    b.spr.x = b.x;
    b.spr.y = b.y;
    const fade = 1 - Math.pow(b.traveled / b.range, 3);
    b.spr.alpha = Math.max(0.2, fade);
  }
}

export function updateOrbs(
  dt: number,
  orbs: Orb[],
  player: { x: number; y: number },
  onPickup: (kind: 'energy' | 'heal') => void,
): void {
  for (const o of orbs) {
    if (!o.alive) continue;
    o.life -= dt;
    o.bob += dt * 4;
    const dx = player.x - o.x;
    const dy = player.y - o.y;
    const d = Math.hypot(dx, dy);

    if (d < 170) {
      const pull = (1 - d / 170) * 520 * dt;
      o.x += (dx / (d || 1)) * pull;
      o.y += (dy / (d || 1)) * pull;
    }

    if (d < C.ORB.pickupR) {
      o.alive = false;
      o.spr.visible = false;
      onPickup(o.kind);
      continue;
    }

    if (o.life <= 0) {
      o.alive = false;
      o.spr.visible = false;
      continue;
    }
    o.spr.x = o.x;
    o.spr.y = o.y + Math.sin(o.bob) * 2;
    o.spr.alpha = o.life < 3 ? Math.max(0.4, o.life / 3) : 1;
  }
}
