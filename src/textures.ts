import { Application, Graphics, Texture } from 'pixi.js';

export interface Textures {
  player: Texture;
  wind: Texture;
  water: Texture;
  umbrella: Texture;
  boot: Texture;
  bulletWind: Texture;
  bulletWater: Texture;
  ring: Texture;
  house: Texture;
}

function make(app: Application, draw: (g: Graphics) => void): Texture {
  const g = new Graphics();
  draw(g);
  const tex = app.renderer.generateTexture({ target: g, resolution: 2 });
  g.destroy();
  return tex;
}

export function buildTextures(app: Application): Textures {
  const player = make(app, (g) => {
    g.ellipse(0, 20, 16, 6).fill({ color: 0x000000, alpha: 0.32 });
    g.roundRect(-9, -2, 18, 21, 6).fill(0x2f6ea8);
    g.roundRect(-9, 8, 18, 6, 3).fill(0x1d2a36);
    g.circle(0, -10, 8).fill(0xe8c39e);
    g.arc(0, -10, 8, Math.PI, Math.PI * 2).fill(0x24313e);
  });

  const wind = make(app, (g) => {
    for (let i = 0; i < 3; i++) {
      const a0 = i * 2.1;
      g.arc(0, 0, 8 + i * 6, a0, a0 + Math.PI * 1.35).stroke({
        width: 4 - i * 0.6,
        color: 0xffffff,
        alpha: 0.95 - i * 0.18,
      });
    }
  });

  const water = make(app, (g) => {
    g.ellipse(0, 0, 60, 48).fill({ color: 0xffffff, alpha: 0.5 });
    g.ellipse(0, 0, 57, 45).stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
    g.ellipse(0, 0, 42, 32).fill({ color: 0xffffff, alpha: 0.3 });
    g.ellipse(-14, -6, 16, 9).fill({ color: 0xffffff, alpha: 0.45 });
  });

  const umbrella = make(app, (g) => {
    g.arc(0, 0, 19, Math.PI, Math.PI * 2).fill(0xffffff);
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (Math.PI / 3) * i;
      g.moveTo(0, 0)
        .lineTo(Math.cos(a) * 19, Math.sin(a) * 19)
        .stroke({ width: 1.2, color: 0x2b3a4a, alpha: 0.85 });
    }
    g.moveTo(0, 0).lineTo(0, 15).stroke({ width: 3, color: 0xffffff });
    g.arc(3, 15, 3, Math.PI, Math.PI * 2).stroke({ width: 2.4, color: 0xffffff });
  });

  const boot = make(app, (g) => {
    g.roundRect(-6, -11, 12, 17, 4).fill(0xffffff);
    g.roundRect(-8, 1, 19, 9, 4).fill(0xffffff);
    g.rect(-8, 9, 19, 2).fill({ color: 0xffffff, alpha: 0.7 });
  });

  const bulletWind = make(app, (g) => {
    g.circle(0, 0, 10).fill({ color: 0xffffff, alpha: 0.18 });
    g.circle(0, 0, 5).fill(0xffffff);
  });

  const bulletWater = make(app, (g) => {
    g.circle(0, 0, 12).fill({ color: 0xffffff, alpha: 0.16 });
    g.circle(0, 0, 6).fill(0xffffff);
  });

  const ring = make(app, (g) => {
    g.circle(0, 0, 100).stroke({ width: 9, color: 0xffffff });
  });

  const house = make(app, (g) => {
    g.poly([-58, 8, 0, -62, 58, 8]).fill(0xffffff);
    g.rect(-44, 8, 88, 62).fill({ color: 0xffffff, alpha: 0.85 });
    g.rect(-11, 38, 22, 32).fill({ color: 0x2b3a4a, alpha: 0.9 });
    g.rect(-34, 20, 16, 16).fill({ color: 0x2b3a4a, alpha: 0.7 });
    g.rect(18, 20, 16, 16).fill({ color: 0x2b3a4a, alpha: 0.7 });
  });

  return { player, wind, water, umbrella, boot, bulletWind, bulletWater, ring, house };
}
