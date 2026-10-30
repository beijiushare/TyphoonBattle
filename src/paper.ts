import { Texture } from 'pixi.js';

interface Grain {
  freq: number;
  oct: number;
  slope: number;
  intercept: number;
  opacity: number;
}

const SIZE = 512;

function svgUrl({ freq, oct, slope, intercept, opacity }: Grain): string {
  const transfer =
    slope > 1
      ? `<feComponentTransfer><feFuncA type='linear' slope='${slope}' intercept='${intercept}'/></feComponentTransfer>`
      : '';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${SIZE}' height='${SIZE}'>` +
    `<filter id='f'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/>${transfer}</filter>` +
    `<rect width='${SIZE}' height='${SIZE}' filter='url(#f)' opacity='${opacity}'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('paper texture load failed'));
    img.src = url;
  });
}

export async function makePaperTexture(): Promise<Texture> {
  const low = await loadImage(
    svgUrl({ freq: 0.014, oct: 2, slope: 0, intercept: 0, opacity: 0.16 }),
  );
  const high = await loadImage(
    svgUrl({ freq: 0.46, oct: 4, slope: 1.3, intercept: -0.18, opacity: 0.32 }),
  );

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  ctx.fillStyle = '#c9a878';
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(low, 0, 0);

  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(high, 0, 0);

  ctx.globalCompositeOperation = 'source-over';
  return Texture.from(canvas);
}
