import * as C from '../config';
import type { GameAssets, FrameSet } from '../assets';

export function pickTier(t: number): C.TierDef {
  const pool = C.TIERS.filter((d) => d.unlock <= t);
  let total = 0;
  for (const d of pool) total += d.weight;
  let r = Math.random() * total;
  for (const d of pool) {
    r -= d.weight;
    if (r <= 0) return d;
  }
  return pool[pool.length - 1];
}

/** 在视野外一圈的环上取点，保证新怪从屏幕边缘涌进来 */
export function ringPosition(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
): { x: number; y: number } {
  const radius = Math.max(halfW, halfH) + 80 + C.rand(0, 160);
  const ang = C.rand(0, Math.PI * 2);
  return {
    x: C.clamp(px + Math.cos(ang) * radius, 20, C.WORLD_W - 20),
    y: C.clamp(py + Math.sin(ang) * radius, 20, C.WORLD_H - 20),
  };
}

export function frameSetFor(assets: GameAssets, def: C.TierDef): FrameSet {
  switch (def.key) {
    case 'wind1':
      return assets.wind1;
    case 'wind2':
      return assets.wind2;
    case 'wind3':
      return assets.wind3;
    case 'rain1':
      return assets.rain1;
    default:
      return assets.rain2;
  }
}
