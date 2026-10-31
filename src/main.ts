import { Application } from 'pixi.js';
import { loadAssets } from './assets';
import { makePaperTexture } from './paper';
import { Game } from './game';
import { UI } from './ui';

const host = document.getElementById('game');
if (!host) throw new Error('missing #game');

const app = new Application();
await app.init({
  background: '#c9a878',
  resizeTo: host,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});

host.appendChild(app.canvas);

const ui = new UI();
const [paper, assets] = await Promise.all([makePaperTexture(), loadAssets()]);
const game = new Game(app, paper, assets, () => ui.getInput(), {
  onShop: (view, buy, close) => ui.showShop(view, buy, close),
  onOver: (r) => {
    ui.setPlaying(false);
    ui.showOver(r);
  },
  onHurt: () => ui.flash(),
});

(window as unknown as { __game: Game }).__game = game;

game.layout();
window.addEventListener('resize', () => game.layout());
window.visualViewport?.addEventListener('resize', () => game.layout());
new ResizeObserver(() => game.layout()).observe(app.canvas);

ui.onStart = () => {
  ui.setPlaying(true);
  ui.hideTitle();
  game.start();
};
ui.onRestart = () => {
  ui.setPlaying(true);
  ui.hideOver();
  game.start();
};
ui.onHouse = () => game.useHouse();

let last = performance.now();
let acc = 0;
let hudAcc = 0;

const STEP = 1 / 60;

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;

  let steps = 0;
  while (acc >= STEP && steps < 5) {
    game.update(STEP);
    acc -= STEP;
    steps++;
  }
  if (steps === 5) acc = 0;

  hudAcc += dt;
  if (hudAcc >= 0.08) {
    hudAcc = 0;
    ui.updateHud(game.getHud());
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);