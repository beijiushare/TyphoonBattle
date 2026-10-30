import * as C from '../config';
import type { Enemy, EnemyShot, FloatText } from '../types';

export interface PlayerRef {
  x: number;
  y: number;
}

export function updateEnemies(
  dt: number,
  t: number,
  player: PlayerRef,
  enemies: Enemy[],
  fireShot: (x: number, y: number, ang: number, speed: number, dmg: number) => void,
): void {
  for (const e of enemies) {
    if (!e.alive) continue;
    e.flash = Math.max(0, e.flash - dt);

    const dx = player.x - e.x;
    const dy = player.y - e.y;

    if (e.kind === 'wind') {
      const ang = Math.atan2(dy, dx) + Math.sin(t * 2.2 + e.wobble) * 0.2;
      e.x += Math.cos(ang) * e.def.speed * dt;
      e.y += Math.sin(ang) * e.def.speed * dt;

      if (e.def.shootCd) {
        e.shootT -= dt;
        if (e.shootT <= 0) {
          e.shootT = e.def.shootCd;
          fireShot(e.x, e.y, Math.atan2(dy, dx), e.def.shootSpeed ?? 240, e.def.shootDmg ?? 5);
        }
      }
    } else {
      const ang = Math.atan2(dy, dx) + Math.sin(t * 1.4 + e.wobble) * 0.14;
      e.x += Math.cos(ang) * e.def.speed * dt;
      e.y += Math.sin(ang) * e.def.speed * dt;
    }
  }
}

export function updateShots(
  dt: number,
  shots: EnemyShot[],
  player: PlayerRef & { invuln: number },
  onHit: (dmg: number) => void,
): void {
  for (const s of shots) {
    if (!s.alive) continue;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    s.spr.x = s.x;
    s.spr.y = s.y;

    if (s.life <= 0 || s.x < -50 || s.x > C.WORLD_W + 50 || s.y < -50 || s.y > C.WORLD_H + 50) {
      s.alive = false;
      s.spr.visible = false;
      continue;
    }

    const dx = s.x - player.x;
    const dy = s.y - player.y;
    if (dx * dx + dy * dy < 22 * 22 && player.invuln <= 0) {
      const dmg = (s as EnemyShot & { dmg: number }).dmg ?? 5;
      s.alive = false;
      s.spr.visible = false;
      onHit(dmg);
    }
  }
}

export function updateTexts(texts: FloatText[], dt: number): void {
  for (const f of texts) {
    if (!f.alive) continue;
    f.age += dt;
    const p = Math.min(1, f.age / f.dur);
    f.spr.y = f.y - 46 * (1 - Math.pow(1 - p, 2));
    f.spr.alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    if (f.age >= f.dur) {
      f.alive = false;
      f.spr.visible = false;
    }
  }
}
