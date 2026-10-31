import {
  AnimatedSprite,
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import * as C from '../config';
import type { GameAssets } from '../assets';
import type { Textures } from '../textures';
import type { Bullet, Effect, Enemy, EnemyShot, FloatText, Orb } from '../types';

const PLAYER_SCALE = 0.62;

export interface Layers {
  layer: Container;
  top: Container;
  bars: Container;
  fx: Container;
}

export interface Pools {
  barTex: Texture;
  orbTexEnergy: Texture;
  orbTexHeal: Texture;
  shotTex: Texture;
  playerSpr: AnimatedSprite;
  playerShadow: Sprite;
  playerBarBg: Sprite;
  playerBarFill: Sprite;
  enemies: Enemy[];
  bullets: Bullet[];
  shots: EnemyShot[];
  orbs: Orb[];
  effects: Effect[];
  texts: FloatText[];
}

function flatTex(app: Application, w: number, h: number, color: number): Texture {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, Math.min(w, h) / 2).fill(color);
  const t = app.renderer.generateTexture({ target: g, resolution: 2 });
  g.destroy();
  return t;
}

function dotTex(app: Application, radius: number, color: number, outline: number): Texture {
  const g = new Graphics();
  g.circle(radius + 2, radius + 2, radius + 1.5).fill(outline);
  g.circle(radius + 2, radius + 2, radius).fill(color);
  g.circle(radius * 0.6, radius * 0.6, radius * 0.35).fill({ color: 0xffffff, alpha: 0.5 });
  const t = app.renderer.generateTexture({ target: g, resolution: 2 });
  g.destroy();
  return t;
}

export function buildPools(
  app: Application,
  assets: GameAssets,
  tex: Textures,
  layers: Layers,
): Pools {
  const barTex = flatTex(app, 1, 1, 0xffffff);
  const orbTexEnergy = dotTex(app, C.ORB.radius, 0x3b82c4, 0x14161c);
  const orbTexHeal = dotTex(app, C.ORB.radius, 0xd84343, 0x14161c);
  const shotTex = dotTex(app, 7, 0xffffff, 0x1a2430);

  const shadowG = new Graphics();
  shadowG.ellipse(0, 0, 24, 8).fill({ color: 0x3a2b1a, alpha: 0.22 });
  const shadowTex = app.renderer.generateTexture({ target: shadowG, resolution: 2 });
  shadowG.destroy();
  const playerShadow = new Sprite(shadowTex);
  playerShadow.anchor.set(0.5);
  layers.top.addChild(playerShadow);

  const playerSpr = new AnimatedSprite(assets.people.frames);
  playerSpr.anchor.set(0.5, 0.86);
  playerSpr.animationSpeed = 0.2;
  playerSpr.scale.set(PLAYER_SCALE);
  playerSpr.play();
  layers.top.addChild(playerSpr);

  const playerBarBg = new Sprite(barTex);
  playerBarBg.anchor.set(0, 0.5);
  playerBarBg.tint = 0x3a2b1a;
  playerBarBg.alpha = 0.45;
  layers.bars.addChild(playerBarBg);

  const playerBarFill = new Sprite(barTex);
  playerBarFill.anchor.set(0, 0.5);
  playerBarFill.tint = 0x8f3a2e;
  layers.bars.addChild(playerBarFill);

  const enemies: Enemy[] = [];
  for (let i = 0; i < C.MAX_ENEMIES; i++) {
    const spr = new AnimatedSprite(assets.rain1.frames);
    spr.anchor.set(0.5);
    spr.visible = false;
    layers.layer.addChild(spr);

    const barBg = new Sprite(barTex);
    barBg.anchor.set(0, 0.5);
    barBg.tint = 0x3a2b1a;
    barBg.alpha = 0.45;
    barBg.visible = false;
    layers.bars.addChild(barBg);

    const barFill = new Sprite(barTex);
    barFill.anchor.set(0, 0.5);
    barFill.tint = 0x8f3a2e;
    barFill.visible = false;
    layers.bars.addChild(barFill);

    enemies.push({
      alive: false,
      kind: 'wind',
      def: C.TIERS[0],
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 1,
      maxHp: 1,
      r: 20,
      wobble: 0,
      growT: 0,
      winIdx: 0,
      hitReady: -99,
      shootT: 0,
      flash: 0,
      spr,
      barBg,
      barFill,
    });
  }

  const bullets: Bullet[] = [];
  for (let i = 0; i < C.MAX_BULLETS; i++) {
    const spr = new Sprite(assets.umbrella);
    spr.anchor.set(0.5);
    spr.visible = false;
    layers.layer.addChild(spr);
    bullets.push({
      alive: false,
      kind: 'umbrella',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dmgWind: 0,
      dmgWater: 0,
      speed: 0,
      range: 0,
      traveled: 0,
      r: 6,
      pierce: 0,
      spin: 0,
      hits: new Set<Enemy>(),
      spr,
    });
  }

  const shots: EnemyShot[] = [];
  for (let i = 0; i < 120; i++) {
    const spr = new Sprite(shotTex);
    spr.anchor.set(0.5);
    spr.visible = false;
    layers.layer.addChild(spr);
    shots.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, spr });
  }

  const orbs: Orb[] = [];
  for (let i = 0; i < 760; i++) {
    const spr = new Sprite(orbTexEnergy);
    spr.anchor.set(0.5);
    spr.visible = false;
    layers.layer.addChild(spr);
    orbs.push({ alive: false, kind: 'energy', x: 0, y: 0, life: 0, bob: 0, flying: false, vx: 0, vy: 0, spr });
  }

  const effects: Effect[] = [];
  for (let i = 0; i < 8; i++) {
    const spr = new Sprite(tex.ring);
    spr.anchor.set(0.5);
    spr.visible = false;
    spr.blendMode = 'add';
    layers.fx.addChild(spr);
    effects.push({ alive: false, kind: 'ring', x: 0, y: 0, age: 0, dur: 0.5, from: 0.2, to: 3.2, spr });
  }
  for (let i = 0; i < 2; i++) {
    const spr = new Sprite(tex.house);
    spr.anchor.set(0.5);
    spr.visible = false;
    spr.tint = 0xb5721c;
    layers.fx.addChild(spr);
    effects.push({ alive: false, kind: 'house', x: 0, y: 0, age: 0, dur: 0.8, from: 2.4, to: 1, spr });
  }

  const texts: FloatText[] = [];
  for (let i = 0; i < 56; i++) {
    const spr = new Text({
      text: '',
      style: {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 18,
        fontWeight: '700',
        fill: 0x8a5a12,
        stroke: { color: 0xfff6df, width: 4 },
      },
    });
    spr.anchor.set(0.5);
    spr.resolution = 2;
    spr.visible = false;
    layers.fx.addChild(spr);
    texts.push({ alive: false, x: 0, y: 0, age: 0, dur: 0.9, spr });
  }

  return {
    barTex,
    orbTexEnergy,
    orbTexHeal,
    shotTex,
    playerSpr,
    playerShadow,
    playerBarBg,
    playerBarFill,
    enemies,
    bullets,
    shots,
    orbs,
    effects,
    texts,
  };
}

export { PLAYER_SCALE };
