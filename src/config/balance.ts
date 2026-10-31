// 视图与世界尺寸
export const W = 1280;
export const H = 720;
export const WORLD_W = 2560;
export const WORLD_H = 1600;
export const VIEW_H = 720;

export const PLAYER = {
  maxHp: 100,
  hpCap: 300,
  speed: 220,
  r: 14,
  invuln: 0.5,
  knock: 30,
};

export const UMBRELLA = {
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
  cd: 0.28,
  speed: 520,
  range: 320,
  rangeMax: 420,
  dmgWind: 5,
  dmgWater: 12,
  r: 13,
  spread: (4 * Math.PI) / 180,
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

export const SPAWN = {
  base: 0.22,
  min: 0.05,
  ramp: 1000,
  cap: 380,
};

export const SCORE = {
  window: 10,
  minSpawn: 5,
  edgeCarry: 2,
};

export const ORB = {
  /** 单个能量点的面值：所有掉落与商品价格都乘这个数 */
  value: 99,
  healChance: 1 / 15,
  healAmount: 10,
  life: 18,
  pickupR: 30,
  radius: 7,
};

export const CARD_EVERY = 45;
export const MAX_ENEMIES = 420;
export const MAX_BULLETS = 420;

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
