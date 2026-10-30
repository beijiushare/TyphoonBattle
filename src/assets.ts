import { Assets, Rectangle, Texture } from 'pixi.js';

export interface FrameSet {
  frames: Texture[];
  w: number;
  h: number;
}

async function sheet(url: string, count: number): Promise<FrameSet> {
  const tex = await Assets.load<Texture>(url);
  const w = Math.floor(tex.width / count);
  const h = tex.height;
  const frames: Texture[] = [];
  for (let i = 0; i < count; i++) {
    frames.push(new Texture({ source: tex.source, frame: new Rectangle(i * w, 0, w, h) }));
  }
  return { frames, w, h };
}

export interface GameAssets {
  people: FrameSet;
  wind1: FrameSet;
  wind2: FrameSet;
  wind3: FrameSet;
  rain1: FrameSet;
  rain2: FrameSet;
  umbrella: Texture;
  boot: Texture;
}

export async function loadAssets(): Promise<GameAssets> {
  const [people, wind1, wind2, wind3, rain1, rain2, umbrella, boot] = await Promise.all([
    sheet('assets/people.png', 10),
    sheet('assets/wind1.png', 3),
    sheet('assets/wind2.png', 8),
    sheet('assets/wind3.png', 8),
    sheet('assets/rain1.png', 10),
    sheet('assets/rain2.png', 20),
    Assets.load<Texture>('assets/umbrella.png'),
    Assets.load<Texture>('assets/boot.png'),
  ]);
  return { people, wind1, wind2, wind3, rain1, rain2, umbrella, boot };
}
