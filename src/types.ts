import type { AnimatedSprite, Sprite, Text } from 'pixi.js';
import type { TierDef } from './config';

export type EnemyKind = 'wind' | 'rain';

export interface Enemy {
  alive: boolean;
  kind: EnemyKind;
  def: TierDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  r: number;
  wobble: number;
  growT: number;
  winIdx: number;
  hitReady: number;
  shootT: number;
  flash: number;
  spr: AnimatedSprite;
  barBg: Sprite;
  barFill: Sprite;
}

export interface Bullet {
  alive: boolean;
  kind: 'umbrella' | 'boot';
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmgWind: number;
  dmgWater: number;
  speed: number;
  range: number;
  traveled: number;
  r: number;
  pierce: number;
  spin: number;
  hits: Set<Enemy>;
  spr: Sprite;
}

export interface EnemyShot {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  spr: Sprite;
}

export interface Orb {
  alive: boolean;
  kind: 'energy' | 'heal';
  x: number;
  y: number;
  life: number;
  bob: number;
  flying: boolean;
  vx: number;
  vy: number;
  spr: Sprite;
}

export interface Effect {
  alive: boolean;
  kind: 'ring' | 'house';
  x: number;
  y: number;
  age: number;
  dur: number;
  from: number;
  to: number;
  spr: Sprite;
}

export interface ShopItemView {
  id: string;
  name: string;
  desc: string;
  tip: string;
  price: number;
  soldOut: boolean;
}

export interface ShopView {
  energy: number;
  items: ShopItemView[];
}

export interface HudState {
  hp: number;
  maxHp: number;
  energy: number;
  time: number;
  nextShop: number;
  windowRate: number | null;
  lastRate: number | null;
  umbrella: number;
  boots: number;
  houseCd: number;
  houseLv: number;
}

export interface RunResult {
  time: number;
  kills: number;
  spawned: number;
  rate: number;
  score: number;
}
export interface FloatText {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  dur: number;
  spr: Text;
}