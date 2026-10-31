export type TierKey = 'wind1' | 'wind2' | 'wind3' | 'rain1' | 'rain2';

export interface TierDef {
  key: TierKey;
  kind: 'wind' | 'rain';
  tier: 1 | 2 | 3;
  hp: number;
  speed: number;
  dmg: number;
  r: number;
  visual: number;
  drop: number;
  unlock: number;
  weight: number;
  shootCd?: number;
  shootDmg?: number;
  shootSpeed?: number;
}

/** 5 档怪：Lv1 一击必杀，Lv2 有血量，Lv3 远程 */
export const TIERS: TierDef[] = [
  { key: 'rain1', kind: 'rain', tier: 1, hp: 4, speed: 58, dmg: 3, r: 46, visual: 112, drop: 1, unlock: 0, weight: 9 },
  { key: 'wind1', kind: 'wind', tier: 1, hp: 4, speed: 128, dmg: 4, r: 24, visual: 74, drop: 1, unlock: 0, weight: 10 },
  { key: 'wind2', kind: 'wind', tier: 2, hp: 45, speed: 148, dmg: 9, r: 32, visual: 100, drop: 3, unlock: 40, weight: 7 },
  { key: 'rain2', kind: 'rain', tier: 2, hp: 80, speed: 42, dmg: 8, r: 66, visual: 165, drop: 4, unlock: 70, weight: 6 },
  {
    key: 'wind3',
    kind: 'wind',
    tier: 3,
    hp: 140,
    speed: 112,
    dmg: 14,
    r: 44,
    visual: 145,
    drop: 6,
    unlock: 110,
    weight: 5,
    shootCd: 2.4,
    shootDmg: 5,
    shootSpeed: 240,
  },
];
