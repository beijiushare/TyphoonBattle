export const W = 1280;
export const H = 720;
export const DT = 1 / 60;

export const PAL = {
  bg: 0x111820,
  ground: 0x1b2430,
  fog: 0x2b3a4a,
  warn: 0xffc940,
  wind: 0x0d6675,
  water: 0x2f6ea8,
  danger: 0xff4d5e,
  ink: 0xe8eef4,
  shadow: 0x000000,
};

export const PLAYER = {
  maxHp: 100,
  hpCap: 300,
  speed: 220,
  r: 14,
  invuln: 0.5,
  knock: 30,
};

export const WIND_DEF = {
  hp: 24,
  speed: 150,
  dmg: 8,
  r: 20,
  coin: 10,
  pullR: 140,
  pull: 40,
  wobbleSpeed: 2.4,
  wobbleAmp: 0.22,
};

export const WATER_DEF = {
  hp: 50,
  driftSpeed: 90,
  driftTime: 0.6,
  dmg: 5,
  r: 60,
  rMax: 120,
  growEvery: 3,
  growBy: 8,
  coin: 15,
  slow: 0.6,
  life: 45,
};

export const UMBRELLA = {
  orbit: 80,
  spin: (180 * Math.PI) / 180,
  cd: 0.45,
  speed: 420,
  range: 260,
  rangeMax: 400,
  dmgWind: 14,
  dmgWater: 6,
  r: 26,
};

export const BOOT = {
  orbit: 40,
  cd: 0.22,
  speed: 620,
  range: 320,
  rangeMax: 420,
  dmgWind: 5,
  dmgWater: 12,
  r: 13,
  spread: (3 * Math.PI) / 180,
};

export const HOUSE = {
  cd: 25,
  radius: 320,
  dmgWind: 40,
  dmgWater: 15,
  lvMax: 5,
  radiusPerLv: 40,
  dmgPerLv: 8,
};

export const SLOT_COST: Record<'umbrella' | 'boots', number[]> = {
  umbrella: [0, 0, 70, 160],
  boots: [0, 0, 90, 220],
};

export const UPGRADE_COST = [60, 100, 160, 250, 400, 620, 950];
export const HOUSE_COST = [300, 600, 1100, 1800];
export const LV_MAX = 8;

export const ECON = {
  upgradeShare: 0.7,
  regenShare: 0.3,
  regenDelay: 3,
  regenRate: 2,
  regenCap: 0.5,
  buyTick: 0.5,
};

export const SPAWN = {
  base: 2.2,
  min: 0.24,
  ramp: 170,
  cap: 220,
  hpPerSec: 1 / 60,
  windRatioEarly: 0.7,
  windRatioLate: 0.5,
  lateAt: 60,
  margin: 60,
};

export const SCORE = {
  window: 10,
  minSpawn: 5,
  edgeCarry: 2,
};

export const CARD_EVERY = 60;

export const MAX_ENEMIES = 260;
export const MAX_BULLETS = 420;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

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

export const TIERS: TierDef[] = [
  { key: 'rain1', kind: 'rain', tier: 1, hp: 4, speed: 58, dmg: 5, r: 46, visual: 112, drop: 1, unlock: 0, weight: 9 },
  { key: 'wind1', kind: 'wind', tier: 1, hp: 4, speed: 128, dmg: 6, r: 24, visual: 74, drop: 1, unlock: 0, weight: 10 },
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

export const ORB = {
  healChance: 1 / 20,
  healAmount: 10,
  life: 18,
  pickupR: 30,
  radius: 7,
};

export type ShopId =
  | 'choco'
  | 'tea'
  | 'kit'
  | 'blanket'
  | 'torch'
  | 'rib'
  | 'sole'
  | 'arms'
  | 'umbSlot'
  | 'bootSlot';

export interface ShopDef {
  id: ShopId;
  name: string;
  desc: string;
  tip: string;
  price: number;
  limit?: number;
}

export const SHOP: ShopDef[] = [
  {
    id: 'choco',
    name: '巧克力',
    desc: '血量 +5',
    tip: '极端情况下，巧克力是快速补充体力的优秀食物。',
    price: 8,
  },
  {
    id: 'tea',
    name: '热姜茶',
    desc: '血量 +15',
    tip: '淋雨后喝热饮有助于恢复体温，但别靠喝酒取暖。',
    price: 12,
  },
  {
    id: 'kit',
    name: '急救包',
    desc: '血量回满',
    tip: '内涝中的伤口容易感染，及时处理比硬扛安全。',
    price: 26,
  },
  {
    id: 'blanket',
    name: '保温毯',
    desc: '生命上限 +20 并回复 20',
    tip: '台风天失温比淋湿更危险，先保住核心体温。',
    price: 24,
    limit: 4,
  },
  {
    id: 'torch',
    name: '手电筒',
    desc: '所有武器射程 +30',
    tip: '停电时别用明火照明，LED 手电更安全。',
    price: 18,
    limit: 3,
  },
  {
    id: 'rib',
    name: '伞骨加固',
    desc: '雨伞伤害 +20%',
    tip: '台风里硬撑伞会被吹翻，顺风收伞更省力。',
    price: 22,
    limit: 4,
  },
  {
    id: 'sole',
    name: '鞋底加厚',
    desc: '雨靴伤害 +20%',
    tip: '涉水要穿包脚鞋，避免被水下杂物划伤。',
    price: 22,
    limit: 4,
  },
  {
    id: 'arms',
    name: '伞阵扩展',
    desc: '雨伞股数 +1（最多 4 股）',
    tip: '开阔地带打伞容易被雷击，尽量走建筑背风侧。',
    price: 30,
    limit: 3,
  },
  {
    id: 'umbSlot',
    name: '备用雨伞',
    desc: '雨伞槽位 +1（最多 3）',
    tip: '台风天多备一把伞，坏了还有得换。',
    price: 34,
    limit: 2,
  },
  {
    id: 'bootSlot',
    name: '备用雨靴',
    desc: '雨靴槽位 +1（最多 3）',
    tip: '湿鞋不换容易得足癣，备一双是常识。',
    price: 34,
    limit: 2,
  },
];
