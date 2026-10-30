import type { Effect, FloatText } from '../types';

export function spawnEffect(
  effects: Effect[],
  kind: 'ring' | 'house',
  x: number,
  y: number,
  from: number,
  to: number,
  dur: number,
): void {
  for (const f of effects) {
    if (f.alive || f.kind !== kind) continue;
    f.alive = true;
    f.x = x;
    f.y = y;
    f.age = 0;
    f.dur = dur;
    f.from = from;
    f.to = to;
    f.spr.visible = true;
    f.spr.alpha = 1;
    f.spr.x = x;
    f.spr.y = y;
    f.spr.scale.set(from);
    f.spr.tint = 0xb5721c;
    return;
  }
}

export function updateEffects(effects: Effect[], dt: number): void {
  for (const f of effects) {
    if (!f.alive) continue;
    f.age += dt;
    const p = Math.min(1, f.age / f.dur);
    if (f.kind === 'ring') {
      const ease = 1 - Math.pow(1 - p, 2.2);
      f.spr.scale.set(f.from + (f.to - f.from) * ease);
      f.spr.alpha = 1 - p;
    } else {
      const fall = Math.min(1, f.age / 0.24);
      f.spr.scale.set(f.from + (f.to - f.from) * fall * fall);
      f.spr.y = f.y - (1 - fall) * 220;
      f.spr.alpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
    }
    if (f.age >= f.dur) {
      f.alive = false;
      f.spr.visible = false;
    }
  }
}

export function spawnFloat(
  texts: FloatText[],
  x: number,
  y: number,
  text: string,
  color: number,
): void {
  for (const f of texts) {
    if (f.alive) continue;
    f.alive = true;
    f.x = x;
    f.y = y;
    f.age = 0;
    f.dur = 0.9;
    f.spr.text = text;
    f.spr.style.fill = color;
    f.spr.visible = true;
    f.spr.alpha = 1;
    f.spr.x = x;
    f.spr.y = y;
    return;
  }
}
