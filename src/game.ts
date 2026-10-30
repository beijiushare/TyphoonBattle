import {
  AnimatedSprite,
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js';
import * as C from './config';
import type { GameAssets, FrameSet } from './assets';
import type { Bullet, Effect, Enemy, EnemyShot, HudState, Orb, RunResult, ShopView } from './types';
import { buildTextures, type Textures } from './textures';

interface Bucket {
  a: number;
  k: number;
}

export interface UiHooks {
  onShop(view: ShopView, buy: (id: string) => ShopView, close: () => void): void;
  onOver(r: RunResult): void;
  onHurt(): void;
}

const CELL = 64;
const PLAYER_SCALE = 0.62;

export class Game {
  readonly app: Application;
  readonly tex: Textures;
  private assets: GameAssets;
  readonly world = new Container();
  private bg = new Container();
  private layer = new Container();
  private top = new Container();
  private bars = new Container();
  private fx = new Container();

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private shots: EnemyShot[] = [];
  private orbs: Orb[] = [];
  private effects: Effect[] = [];

  private playerSpr!: AnimatedSprite;
  private playerShadow!: Sprite;
  private playerBarBg!: Sprite;
  private playerBarFill!: Sprite;
  private barTex!: Texture;
  private orbTexEnergy!: Texture;
  private orbTexHeal!: Texture;
  private shotTex!: Texture;

  state: 'idle' | 'running' | 'paused' | 'over' = 'idle';
  private camScale = 1;
  private paperSprite!: TilingSprite;

  private t = 0;
  private player = {
    x: C.WORLD_W / 2,
    y: C.WORLD_H / 2,
    hp: C.PLAYER.maxHp,
    maxHp: C.PLAYER.maxHp,
    invuln: 0,
    lastHit: -99,
    dx: 0,
    dy: 1,
  };

  private umbrellaSlots = 1;
  private umbrellaArms = 1;
  private umbrellaBonus = 0;
  private umbrellaRangeBonus = 0;
  private umbrellaRot = 0;
  private umbrellaFire = 0;

  private bootSlots = 1;
  private bootBonus = 0;
  private bootFire = 0;

  private houseCd = 0;
  private houseLv = 1;

  private energy = 0;
  private shopStock = new Map<string, number>();

  private score = 0;
  private buckets = new Map<number, Bucket>();
  private carry = { ms: 0, a: 0, k: 0 };
  private closedUpTo = 0;
  private totalSpawned = 0;
  private totalKilled = 0;
  private lastRate: number | null = null;

  private spawnAcc = 0;
  private aliveCount = 0;
  private nextShopAt = C.CARD_EVERY;
  private grid = new Map<number, Enemy[]>();

  constructor(
    app: Application,
    private paper: Texture,
    assets: GameAssets,
    private input: () => { x: number; y: number },
    private ui: UiHooks,
  ) {
    this.app = app;
    this.assets = assets;
    this.tex = buildTextures(app);

    this.world.addChild(this.bg, this.layer, this.top, this.bars, this.fx);
    app.stage.addChild(this.world);

    this.drawBackdrop();
    this.buildPools();
    this.reset();
  }

  layout(): void {
    this.camScale = this.app.screen.height / C.VIEW_H;
    this.world.scale.set(this.camScale);
    const half = this.viewHalf();
    this.paperSprite.width = half.w * 2 + 8;
    this.paperSprite.height = half.h * 2 + 8;
    this.camera();
  }

  private camera(): void {
    this.world.position.set(
      this.app.screen.width / 2 - this.player.x * this.camScale,
      this.app.screen.height / 2 - this.player.y * this.camScale,
    );
    const half = this.viewHalf();
    const left = this.player.x - half.w - 4;
    const top = this.player.y - half.h - 4;
    this.paperSprite.x = left;
    this.paperSprite.y = top;
    this.paperSprite.tilePosition.set(left, top);
  }

  private viewHalf(): { w: number; h: number } {
    return {
      w: this.app.screen.width / (2 * this.camScale),
      h: this.app.screen.height / (2 * this.camScale),
    };
  }

  private drawBackdrop(): void {
    this.paperSprite = new TilingSprite({ texture: this.paper, width: C.W, height: C.H });
    this.bg.addChild(this.paperSprite);

    const g = new Graphics();
    g.rect(0, 0, C.WORLD_W, C.WORLD_H).stroke({ width: 60, color: 0x5c4126, alpha: 0.16 });
    g.rect(0, 0, C.WORLD_W, C.WORLD_H).stroke({ width: 3, color: 0x5c4126, alpha: 0.35 });
    this.bg.addChild(g);
  }

  private flatTex(w: number, h: number, color: number): Texture {
    const g = new Graphics();
    g.roundRect(0, 0, w, h, Math.min(w, h) / 2).fill(color);
    const t = this.app.renderer.generateTexture({ target: g, resolution: 2 });
    g.destroy();
    return t;
  }

  private dotTex(radius: number, color: number, outline: number): Texture {
    const g = new Graphics();
    g.circle(radius + 2, radius + 2, radius + 1.5).fill(outline);
    g.circle(radius + 2, radius + 2, radius).fill(color);
    g.circle(radius * 0.6, radius * 0.6, radius * 0.35).fill({ color: 0xffffff, alpha: 0.5 });
    const t = this.app.renderer.generateTexture({ target: g, resolution: 2 });
    g.destroy();
    return t;
  }

  private buildPools(): void {
    this.barTex = this.flatTex(1, 1, 0xffffff);
    this.orbTexEnergy = this.dotTex(C.ORB.radius, 0x3b82c4, 0x14161c);
    this.orbTexHeal = this.dotTex(C.ORB.radius, 0xd84343, 0x14161c);
    this.shotTex = this.dotTex(7, 0xffffff, 0x1a2430);

    const shadowG = new Graphics();
    shadowG.ellipse(0, 0, 24, 8).fill({ color: 0x3a2b1a, alpha: 0.22 });
    const shadowTex = this.app.renderer.generateTexture({ target: shadowG, resolution: 2 });
    shadowG.destroy();
    this.playerShadow = new Sprite(shadowTex);
    this.playerShadow.anchor.set(0.5);
    this.top.addChild(this.playerShadow);

    const people: FrameSet = this.assets.people;
    this.playerSpr = new AnimatedSprite(people.frames);
    this.playerSpr.anchor.set(0.5, 0.86);
    this.playerSpr.animationSpeed = 0.2;
    this.playerSpr.scale.set(PLAYER_SCALE);
    this.playerSpr.play();
    this.top.addChild(this.playerSpr);

    this.playerBarBg = new Sprite(this.barTex);
    this.playerBarBg.anchor.set(0, 0.5);
    this.playerBarBg.tint = 0x3a2b1a;
    this.playerBarBg.alpha = 0.45;
    this.bars.addChild(this.playerBarBg);

    this.playerBarFill = new Sprite(this.barTex);
    this.playerBarFill.anchor.set(0, 0.5);
    this.playerBarFill.tint = 0x8f3a2e;
    this.bars.addChild(this.playerBarFill);

    for (let i = 0; i < C.MAX_ENEMIES; i++) {
      const spr = new AnimatedSprite(this.assets.rain1.frames);
      spr.anchor.set(0.5);
      spr.visible = false;
      this.layer.addChild(spr);

      const barBg = new Sprite(this.barTex);
      barBg.anchor.set(0, 0.5);
      barBg.tint = 0x3a2b1a;
      barBg.alpha = 0.45;
      barBg.visible = false;
      this.bars.addChild(barBg);

      const barFill = new Sprite(this.barTex);
      barFill.anchor.set(0, 0.5);
      barFill.tint = 0x8f3a2e;
      barFill.visible = false;
      this.bars.addChild(barFill);

      this.enemies.push({
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

    for (let i = 0; i < C.MAX_BULLETS; i++) {
      const spr = new Sprite(this.assets.umbrella);
      spr.anchor.set(0.5);
      spr.visible = false;
      this.layer.addChild(spr);
      this.bullets.push({
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

    for (let i = 0; i < 120; i++) {
      const spr = new Sprite(this.shotTex);
      spr.anchor.set(0.5);
      spr.visible = false;
      this.layer.addChild(spr);
      this.shots.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, spr });
    }

    for (let i = 0; i < 760; i++) {
      const spr = new Sprite(this.orbTexEnergy);
      spr.anchor.set(0.5);
      spr.visible = false;
      this.layer.addChild(spr);
      this.orbs.push({ alive: false, kind: 'energy', x: 0, y: 0, life: 0, bob: 0, spr });
    }

    for (let i = 0; i < 8; i++) {
      const spr = new Sprite(this.tex.ring);
      spr.anchor.set(0.5);
      spr.visible = false;
      spr.blendMode = 'add';
      this.fx.addChild(spr);
      this.effects.push({
        alive: false,
        kind: 'ring',
        x: 0,
        y: 0,
        age: 0,
        dur: 0.5,
        from: 0.2,
        to: 3.2,
        spr,
      });
    }
    for (let i = 0; i < 2; i++) {
      const spr = new Sprite(this.tex.house);
      spr.anchor.set(0.5);
      spr.visible = false;
      spr.tint = 0xb5721c;
      this.fx.addChild(spr);
      this.effects.push({
        alive: false,
        kind: 'house',
        x: 0,
        y: 0,
        age: 0,
        dur: 0.8,
        from: 2.4,
        to: 1,
        spr,
      });
    }
  }

  reset(): void {
    this.t = 0;
    this.state = 'idle';
    this.player.x = C.WORLD_W / 2;
    this.player.y = C.WORLD_H / 2;
    this.player.hp = C.PLAYER.maxHp;
    this.player.maxHp = C.PLAYER.maxHp;
    this.player.invuln = 0;
    this.player.lastHit = -99;
    this.player.dx = 0;
    this.player.dy = 1;

    this.umbrellaSlots = 1;
    this.umbrellaArms = 1;
    this.umbrellaBonus = 0;
    this.umbrellaRangeBonus = 0;
    this.umbrellaRot = 0;
    this.umbrellaFire = 0;
    this.bootSlots = 1;
    this.bootBonus = 0;
    this.bootFire = 0;
    this.houseCd = 0;
    this.houseLv = 1;

    this.energy = 0;
    this.shopStock.clear();

    this.score = 0;
    this.buckets.clear();
    this.carry = { ms: 0, a: 0, k: 0 };
    this.closedUpTo = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.lastRate = null;

    this.spawnAcc = 0;
    this.aliveCount = 0;
    this.nextShopAt = C.CARD_EVERY;

    for (const e of this.enemies) {
      e.alive = false;
      e.spr.visible = false;
      e.barBg.visible = false;
      e.barFill.visible = false;
    }
    for (const b of this.bullets) {
      b.alive = false;
      b.spr.visible = false;
    }
    for (const s of this.shots) {
      s.alive = false;
      s.spr.visible = false;
    }
    for (const o of this.orbs) {
      o.alive = false;
      o.spr.visible = false;
    }
    for (const f of this.effects) {
      f.alive = false;
      f.spr.visible = false;
    }

    this.playerSpr.visible = false;
    this.playerSpr.alpha = 1;
    this.playerSpr.x = this.player.x;
    this.playerSpr.y = this.player.y;
    this.playerBarBg.visible = false;
    this.playerBarFill.visible = false;
  }

  start(): void {
    this.reset();
    this.state = 'running';
    this.playerSpr.visible = true;
    this.playerShadow.visible = true;
    this.playerSpr.gotoAndPlay(0);
    for (let i = 0; i < 14; i++) this.spawnEnemy();
  }

  update(dt: number): void {
    if (this.state !== 'running') return;

    this.t += dt;
    this.player.invuln = Math.max(0, this.player.invuln - dt);
    this.houseCd = Math.max(0, this.houseCd - dt);

    this.movePlayer(dt);
    this.pullByWind(dt);
    this.updateEnemies(dt);
    this.buildGrid();
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updateShots(dt);
    this.contactDamage();
    this.updateOrbs(dt);
    this.updateEffects(dt);
    this.updateScore();
    this.updateSpawn(dt);
    this.syncSprites();
    this.checkShop();
  }

  private movePlayer(dt: number): void {
    let ix = this.input().x;
    let iy = this.input().y;
    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    if (len > 0.001) {
      this.player.dx = ix;
      this.player.dy = iy;
    }

    let slow = 1;
    for (const e of this.enemies) {
      if (e.alive && e.kind === 'rain' && e.def.tier >= 2) {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        if (dx * dx + dy * dy < e.r * e.r) {
          slow = 0.6;
          break;
        }
      }
    }

    const sp = C.PLAYER.speed * slow;
    this.player.x = C.clamp(this.player.x + ix * sp * dt, 26, C.WORLD_W - 26);
    this.player.y = C.clamp(this.player.y + iy * sp * dt, 60, C.WORLD_H - 26);
  }

  private pullByWind(dt: number): void {
    for (const e of this.enemies) {
      if (!e.alive || e.kind !== 'wind') continue;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const d = Math.hypot(dx, dy);
      const pullR = 110 + e.def.tier * 30;
      if (d > 1 && d < pullR) {
        const f = (24 + e.def.tier * 10) * dt * (1 - d / pullR);
        this.player.x = C.clamp(this.player.x + (dx / d) * f, 26, C.WORLD_W - 26);
        this.player.y = C.clamp(this.player.y + (dy / d) * f, 60, C.WORLD_H - 26);
      }
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.flash = Math.max(0, e.flash - dt);

      if (e.kind === 'wind') {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const ang = Math.atan2(dy, dx) + Math.sin(this.t * 2.2 + e.wobble) * 0.2;
        e.x += Math.cos(ang) * e.def.speed * dt;
        e.y += Math.sin(ang) * e.def.speed * dt;

        if (e.def.shootCd) {
          e.shootT -= dt;
          if (e.shootT <= 0) {
            e.shootT = e.def.shootCd;
            const a = Math.atan2(p.y - e.y, p.x - e.x);
            this.spawnEnemyShot(e.x, e.y, a, e.def.shootSpeed ?? 240, e.def.shootDmg ?? 5);
          }
        }
      } else {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const ang = Math.atan2(dy, dx) + Math.sin(this.t * 1.4 + e.wobble) * 0.14;
        e.x += Math.cos(ang) * e.def.speed * dt;
        e.y += Math.sin(ang) * e.def.speed * dt;
      }
    }
  }

  private buildGrid(): void {
    this.grid.clear();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const cx = Math.floor(e.x / CELL);
      const cy = Math.floor(e.y / CELL);
      const key = (cx + 64) * 512 + (cy + 64);
      const arr = this.grid.get(key);
      if (arr) arr.push(e);
      else this.grid.set(key, [e]);
    }
  }

  private updateWeapons(dt: number): void {
    this.umbrellaRot += C.UMBRELLA.spin * dt;
    const p = this.player;
    const uRange = Math.min(
      C.UMBRELLA.rangeMax,
      C.UMBRELLA.range + this.umbrellaRangeBonus,
    );
    const uDmgMul = 1 + this.umbrellaBonus;

    this.umbrellaFire -= dt;
    if (this.umbrellaFire <= 0) {
      this.umbrellaFire += C.UMBRELLA.cd / this.umbrellaSlots;
      for (let k = 0; k < this.umbrellaArms; k++) {
        const ang = this.umbrellaRot + (k * Math.PI * 2) / this.umbrellaArms;
        this.spawnBullet(
          'umbrella',
          p.x,
          p.y,
          ang,
          C.UMBRELLA.speed,
          uRange,
          C.UMBRELLA.dmgWind * uDmgMul,
          C.UMBRELLA.dmgWater * uDmgMul,
          3,
        );
      }
    }

    const bRange = Math.min(C.BOOT.rangeMax, C.BOOT.range + this.umbrellaRangeBonus);
    const bDmgMul = 1 + this.bootBonus;
    const bPierce = 2;

    this.bootFire -= dt;
    while (this.bootFire <= 0) {
      this.bootFire += C.BOOT.cd / this.bootSlots;
      const target = this.nearestEnemy(p.x, p.y);
      const baseAng = target
        ? Math.atan2(target.y - p.y, target.x - p.x)
        : Math.atan2(p.dy, p.dx);
      this.spawnBullet(
        'boot',
        p.x,
        p.y,
        baseAng + C.rand(-C.BOOT.spread, C.BOOT.spread),
        C.BOOT.speed,
        bRange,
        C.BOOT.dmgWind * bDmgMul,
        C.BOOT.dmgWater * bDmgMul,
        bPierce,
      );
    }
  }

  private nearestEnemy(x: number, y: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private spawnBullet(
    kind: 'umbrella' | 'boot',
    x: number,
    y: number,
    ang: number,
    speed: number,
    range: number,
    dmgWind: number,
    dmgWater: number,
    pierce: number,
  ): void {
    let b: Bullet | null = null;
    for (const cand of this.bullets) {
      if (!cand.alive) {
        b = cand;
        break;
      }
    }
    if (!b) return;

    const muzzle = 26;
    const sx = x + Math.cos(ang) * muzzle;
    const sy = y + Math.sin(ang) * muzzle;

    b.alive = true;
    b.kind = kind;
    b.x = sx;
    b.y = sy;
    b.vx = Math.cos(ang) * speed;
    b.vy = Math.sin(ang) * speed;
    b.speed = speed;
    b.range = range;
    b.traveled = 0;
    b.dmgWind = dmgWind;
    b.dmgWater = dmgWater;
    b.pierce = pierce;
    b.spin = kind === 'umbrella' ? 13 : (Math.random() < 0.5 ? -1 : 1) * 9;
    b.r = kind === 'umbrella' ? C.UMBRELLA.r : C.BOOT.r;
    b.hits.clear();
    b.spr.texture = kind === 'umbrella' ? this.assets.umbrella : this.assets.boot;
    b.spr.tint = 0xffffff;
    b.spr.visible = true;
    b.spr.x = sx;
    b.spr.y = sy;
    b.spr.scale.set(kind === 'umbrella' ? 0.16 : 0.11);
    b.spr.rotation = ang;
  }

  private spawnEnemyShot(x: number, y: number, ang: number, speed: number, dmg: number): void {
    for (const s of this.shots) {
      if (s.alive) continue;
      s.alive = true;
      s.x = x;
      s.y = y;
      s.vx = Math.cos(ang) * speed;
      s.vy = Math.sin(ang) * speed;
      s.life = 2.4;
      s.spr.visible = true;
      s.spr.x = x;
      s.spr.y = y;
      (s as EnemyShot & { dmg: number }).dmg = dmg;
      return;
    }
  }

  private updateBullets(dt: number): void {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.traveled += b.speed * dt;

      if (b.traveled > b.range || b.x < -200 || b.x > C.WORLD_W + 200 || b.y < -200 || b.y > C.WORLD_H + 200) {
        this.killBullet(b);
        continue;
      }

      const gx = Math.floor(b.x / CELL);
      const gy = Math.floor(b.y / CELL);
      for (let ox = -1; ox <= 1 && b.alive; ox++) {
        for (let oy = -1; oy <= 1 && b.alive; oy++) {
          const arr = this.grid.get((gx + ox + 64) * 512 + (gy + oy + 64));
          if (!arr) continue;
          for (const e of arr) {
            if (!e.alive || b.hits.has(e)) continue;
            const rr = e.r + b.r;
            const dx = e.x - b.x;
            const dy = e.y - b.y;
            if (dx * dx + dy * dy > rr * rr) continue;
            b.hits.add(e);
            const dmg = e.kind === 'wind' ? b.dmgWind : b.dmgWater;
            this.damageEnemy(e, dmg);
            if (b.pierce > 0) {
              b.pierce -= 1;
            } else {
              this.killBullet(b);
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

  private updateShots(dt: number): void {
    for (const s of this.shots) {
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

      const dx = s.x - this.player.x;
      const dy = s.y - this.player.y;
      if (dx * dx + dy * dy < 22 * 22 && this.player.invuln <= 0) {
        const dmg = (s as EnemyShot & { dmg: number }).dmg ?? 5;
        s.alive = false;
        s.spr.visible = false;
        this.hurtPlayer(dmg, s.x, s.y);
      }
    }
  }

  private killBullet(b: Bullet): void {
    b.alive = false;
    b.spr.visible = false;
  }

  private damageEnemy(e: Enemy, dmg: number): void {
    e.hp -= dmg;
    e.flash = 0.07;
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy): void {
    e.alive = false;
    e.spr.visible = false;
    e.barBg.visible = false;
    e.barFill.visible = false;
    this.aliveCount--;
    this.totalKilled++;

    const b = this.buckets.get(e.winIdx);
    if (b) b.k += 1;
    else this.buckets.set(e.winIdx, { a: 0, k: 1 });

    this.dropOrbs(e.x, e.y, e.def.drop);
  }

  private dropOrbs(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const o = this.orbs.find((cand) => !cand.alive);
      if (!o) return;
      const ang = C.rand(0, Math.PI * 2);
      const dist = C.rand(0, 18);
      o.alive = true;
      o.kind = Math.random() < C.ORB.healChance ? 'heal' : 'energy';
      o.x = C.clamp(x + Math.cos(ang) * dist, 20, C.WORLD_W - 20);
      o.y = C.clamp(y + Math.sin(ang) * dist, 20, C.WORLD_H - 20);
      o.life = C.ORB.life;
      o.bob = C.rand(0, Math.PI * 2);
      o.spr.texture = o.kind === 'heal' ? this.orbTexHeal : this.orbTexEnergy;
      o.spr.visible = true;
      o.spr.alpha = 1;
      o.spr.x = o.x;
      o.spr.y = o.y;
    }
  }

  private updateOrbs(dt: number): void {
    const p = this.player;
    for (const o of this.orbs) {
      if (!o.alive) continue;
      o.life -= dt;
      o.bob += dt * 4;
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const d = Math.hypot(dx, dy);

      if (d < 90) {
        const pull = (1 - d / 90) * 260 * dt;
        o.x += (dx / (d || 1)) * pull;
        o.y += (dy / (d || 1)) * pull;
      }

      if (d < C.ORB.pickupR) {
        o.alive = false;
        o.spr.visible = false;
        if (o.kind === 'heal') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + C.ORB.healAmount);
        } else {
          this.energy += 1;
        }
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

  private hurtPlayer(dmg: number, fromX: number, fromY: number): void {
    const p = this.player;
    p.hp -= dmg;
    p.invuln = C.PLAYER.invuln;
    p.lastHit = this.t;

    const dx = p.x - fromX;
    const dy = p.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    p.x = C.clamp(p.x + (dx / d) * C.PLAYER.knock, 26, C.WORLD_W - 26);
    p.y = C.clamp(p.y + (dy / d) * C.PLAYER.knock, 60, C.WORLD_H - 26);
    this.ui.onHurt();

    if (p.hp <= 0) {
      p.hp = 0;
      this.die();
    }
  }

  private contactDamage(): void {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const rr = e.r + C.PLAYER.r;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      if (dx * dx + dy * dy > rr * rr) continue;
      if (e.hitReady > this.t || p.invuln > 0) continue;
      e.hitReady = this.t + 0.6;
      this.hurtPlayer(e.def.dmg, e.x, e.y);
      return;
    }
  }

  useHouse(): void {
    if (this.state !== 'running' || this.houseCd > 0) return;
    this.houseCd = C.HOUSE.cd;

    const radius = C.HOUSE.radius + (this.houseLv - 1) * C.HOUSE.radiusPerLv;
    const dmgWind = C.HOUSE.dmgWind + (this.houseLv - 1) * C.HOUSE.dmgPerLv;
    const dmgWater = C.HOUSE.dmgWater + (this.houseLv - 1) * C.HOUSE.dmgPerLv * 0.5;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d > radius + e.r) continue;
      const dmg = e.kind === 'wind' ? dmgWind : dmgWater;
      if (d > 0.5) {
        e.x += (dx / d) * 70;
        e.y += (dy / d) * 70;
      }
      this.damageEnemy(e, dmg);
    }

    this.spawnEffect('ring', this.player.x, this.player.y, 0.15, radius / 100, 0.55);
    this.spawnEffect('house', this.player.x, this.player.y, 2.4, 1, 0.8);
  }

  private spawnEffect(
    kind: 'ring' | 'house',
    x: number,
    y: number,
    from: number,
    to: number,
    dur: number,
  ): void {
    for (const f of this.effects) {
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

  private updateEffects(dt: number): void {
    for (const f of this.effects) {
      if (!f.alive) continue;
      f.age += dt;
      const p = Math.min(1, f.age / f.dur);
      if (f.kind === 'ring') {
        const ease = 1 - Math.pow(1 - p, 2.2);
        f.spr.scale.set(C.lerp(f.from, f.to, ease));
        f.spr.alpha = 1 - p;
      } else {
        const fall = Math.min(1, f.age / 0.24);
        f.spr.scale.set(C.lerp(f.from, f.to, fall * fall));
        f.spr.y = f.y - (1 - fall) * 220;
        f.spr.alpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
      }
      if (f.age >= f.dur) {
        f.alive = false;
        f.spr.visible = false;
      }
    }
  }

  private updateScore(): void {
    const idx = Math.floor(this.t / C.SCORE.window);
    while (this.closedUpTo < idx) {
      this.closeWindow(this.closedUpTo, C.SCORE.window * 1000);
      this.closedUpTo++;
    }
  }

  private closeWindow(i: number, ms: number): void {
    const b = this.buckets.get(i) ?? { a: 0, k: 0 };
    this.buckets.delete(i);
    const totalMs = ms + this.carry.ms;
    const a = b.a + this.carry.a;
    const k = b.k + this.carry.k;
    if (a >= C.SCORE.minSpawn) {
      this.score += Math.floor((totalMs * k) / a);
      this.lastRate = k / a;
      this.carry = { ms: 0, a: 0, k: 0 };
    } else {
      this.carry = { ms: totalMs, a, k };
    }
  }

  private updateSpawn(dt: number): void {
    const interval = C.clamp(C.SPAWN.base - this.t / C.SPAWN.ramp, C.SPAWN.min, C.SPAWN.base);
    this.spawnAcc += dt;
    if (this.spawnAcc < interval) return;
    this.spawnAcc -= interval;
    if (this.aliveCount >= C.SPAWN.cap) return;
    this.spawnEnemy();
  }

  private pickTier(): C.TierDef {
    const pool = C.TIERS.filter((d) => d.unlock <= this.t);
    let total = 0;
    for (const d of pool) total += d.weight;
    let r = Math.random() * total;
    for (const d of pool) {
      r -= d.weight;
      if (r <= 0) return d;
    }
    return pool[pool.length - 1];
  }

  private frameSetFor(def: C.TierDef): FrameSet {
    switch (def.key) {
      case 'wind1':
        return this.assets.wind1;
      case 'wind2':
        return this.assets.wind2;
      case 'wind3':
        return this.assets.wind3;
      case 'rain1':
        return this.assets.rain1;
      default:
        return this.assets.rain2;
    }
  }

  private spawnEnemy(): void {
    let e: Enemy | null = null;
    for (const cand of this.enemies) {
      if (!cand.alive) {
        e = cand;
        break;
      }
    }
    if (!e) return;

    const def = this.pickTier();
    const half = this.viewHalf();
    const radius = Math.max(half.w, half.h) + 80 + C.rand(0, 160);
    const ang = C.rand(0, Math.PI * 2);
    const x = C.clamp(this.player.x + Math.cos(ang) * radius, 20, C.WORLD_W - 20);
    const y = C.clamp(this.player.y + Math.sin(ang) * radius, 20, C.WORLD_H - 20);

    let wi = Math.floor(this.t / C.SCORE.window);
    if (this.t - wi * C.SCORE.window > C.SCORE.window - C.SCORE.edgeCarry) wi += 1;
    const b = this.buckets.get(wi);
    if (b) b.a += 1;
    else this.buckets.set(wi, { a: 1, k: 0 });
    this.totalSpawned++;

    const hpMul = def.tier >= 2 ? 1 + this.t / 150 : 1;
    e.alive = true;
    e.def = def;
    e.kind = def.kind;
    e.x = x;
    e.y = y;
    e.hp = def.hp * hpMul;
    e.maxHp = e.hp;
    e.r = def.r * (def.tier >= 2 ? Math.sqrt(hpMul) : 1);
    e.wobble = Math.random() * Math.PI * 2;
    e.winIdx = wi;
    e.hitReady = this.t + 0.4;
    e.shootT = def.shootCd ? C.rand(0.8, def.shootCd) : 0;
    e.flash = 0;
    e.growT = 0;

    const fs = this.frameSetFor(def);
    e.spr.textures = fs.frames;
    e.spr.animationSpeed = def.tier === 3 ? 0.32 : 0.22;
    const scl = def.visual / fs.w * (def.tier >= 2 ? Math.sqrt(hpMul) : 1);
    e.spr.scale.set(scl);
    e.spr.visible = true;
    e.spr.alpha = 1;
    e.spr.x = x;
    e.spr.y = y;
    e.spr.tint = 0xffffff;
    e.spr.gotoAndPlay(Math.floor(Math.random() * fs.frames.length));

    this.aliveCount++;
  }

  private syncSprites(): void {
    const p = this.player;
    this.playerSpr.x = p.x;
    this.playerSpr.y = p.y;
    this.playerSpr.alpha = p.invuln > 0 ? (Math.sin(this.t * 45) > 0 ? 0.45 : 1) : 1;
    this.playerSpr.scale.x = p.dx > 0.02 ? -PLAYER_SCALE : PLAYER_SCALE;

    const pw = 62;
    const ph = 4;
    this.playerBarBg.visible = true;
    this.playerBarBg.x = p.x - pw / 2 - 1;
    this.playerBarBg.y = p.y - 74;
    this.playerBarBg.scale.set(pw + 2, ph + 2);
    this.playerBarFill.visible = true;
    this.playerBarFill.x = p.x - pw / 2;
    this.playerBarFill.y = p.y - 74;
    this.playerBarFill.scale.set(Math.max(0, pw * (p.hp / p.maxHp)), ph);

    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.spr.x = e.x;
      e.spr.y = e.y;
      e.spr.tint = e.flash > 0 ? 0xffd0d0 : 0xffffff;

      const w = Math.min(96, Math.max(30, e.r * 1.4));
      const h = 3;
      const top = e.y - e.r * 0.95 - 10;
      const ratio = Math.max(0, e.hp / e.maxHp);
      e.barBg.visible = true;
      e.barBg.x = e.x - w / 2 - 1;
      e.barBg.y = top;
      e.barBg.scale.set(w + 2, h + 2);
      e.barFill.visible = true;
      e.barFill.x = e.x - w / 2;
      e.barFill.y = top;
      e.barFill.scale.set(Math.max(0, w * ratio), h);
    }

    this.camera();
  }

  private checkShop(): void {
    if (this.t < this.nextShopAt) return;
    this.nextShopAt += C.CARD_EVERY;
    if (this.nextShopAt <= this.t) this.nextShopAt = this.t + C.CARD_EVERY;

    this.state = 'paused';
    this.ui.onShop(
      this.shopView(),
      (id) => this.purchase(id),
      () => {
        this.state = 'running';
      },
    );
  }

  shopView(): ShopView {
    return {
      energy: this.energy,
      items: C.SHOP.map((d) => ({
        id: d.id,
        name: d.name,
        desc: d.desc,
        tip: d.tip,
        price: d.price,
        soldOut: d.limit !== undefined && (this.shopStock.get(d.id) ?? 0) >= d.limit,
      })),
    };
  }

  private purchase(id: string): ShopView {
    const def = C.SHOP.find((d) => d.id === id);
    if (!def) return this.shopView();
    const bought = this.shopStock.get(def.id) ?? 0;
    if (def.limit !== undefined && bought >= def.limit) return this.shopView();
    if (this.energy < def.price) return this.shopView();

    this.energy -= def.price;
    this.shopStock.set(def.id, bought + 1);
    this.applyShop(def.id);
    return this.shopView();
  }

  private applyShop(id: C.ShopId): void {
    const p = this.player;
    switch (id) {
      case 'choco':
        p.hp = Math.min(p.maxHp, p.hp + 5);
        break;
      case 'tea':
        p.hp = Math.min(p.maxHp, p.hp + 15);
        break;
      case 'kit':
        p.hp = p.maxHp;
        break;
      case 'blanket':
        p.maxHp = Math.min(C.PLAYER.hpCap, p.maxHp + 20);
        p.hp = Math.min(p.maxHp, p.hp + 20);
        break;
      case 'torch':
        this.umbrellaRangeBonus += 30;
        break;
      case 'rib':
        this.umbrellaBonus += 0.2;
        break;
      case 'sole':
        this.bootBonus += 0.2;
        break;
      case 'arms':
        this.umbrellaArms = Math.min(4, this.umbrellaArms + 1);
        break;
      case 'umbSlot':
        this.umbrellaSlots = Math.min(3, this.umbrellaSlots + 1);
        break;
      case 'bootSlot':
        this.bootSlots = Math.min(3, this.bootSlots + 1);
        break;
    }
  }

  private die(): void {
    this.state = 'over';

    const idx = Math.floor(this.t / C.SCORE.window);
    const partialMs = (this.t - idx * C.SCORE.window) * 1000;
    let a = this.carry.a;
    let k = this.carry.k;
    const ms = this.carry.ms + partialMs;
    for (const [key, b] of this.buckets) {
      if (key >= idx) {
        a += b.a;
        k += b.k;
      }
    }
    if (a > 0) this.score += Math.floor((ms * k) / a);

    const rate = this.totalSpawned > 0 ? this.totalKilled / this.totalSpawned : 0;
    this.ui.onOver({
      time: this.t,
      kills: this.totalKilled,
      spawned: this.totalSpawned,
      rate,
      score: this.score,
    });
  }

  getHud(): HudState {
    const idx = Math.floor(this.t / C.SCORE.window);
    const b = this.buckets.get(idx);
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      energy: this.energy,
      time: this.t,
      nextShop: Math.max(0, this.nextShopAt - this.t),
      windowRate: b && b.a > 0 ? b.k / b.a : null,
      lastRate: this.lastRate,
      umbrella: this.umbrellaSlots,
      boots: this.bootSlots,
      houseCd: this.houseCd,
      houseLv: this.houseLv,
    };
  }
}
