import { el } from './dom';

/** 键盘 + 虚拟摇杆 + 房子按钮 */
export class InputController {
  onHouse: () => void = () => {};

  private keys = new Set<string>();
  private joyVec = { x: 0, y: 0 };
  private joyId: number | null = null;
  private joy = el<HTMLDivElement>('joy');
  private knob = el<HTMLDivElement>('joyknob');

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      this.keys.add(e.code);
      if (e.code === 'Space' && !e.repeat) this.onHouse();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.joy.addEventListener('pointerdown', (e) => {
      if (this.joyId !== null) return;
      this.joyId = e.pointerId;
      this.joy.setPointerCapture(e.pointerId);
      this.joy.classList.add('active');
      this.moveStick(e.clientX, e.clientY);
    });
    this.joy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyId) return;
      this.moveStick(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null;
      this.joyVec = { x: 0, y: 0 };
      this.joy.classList.remove('active');
      this.knob.style.transform = 'translate(0px, 0px)';
    };
    this.joy.addEventListener('pointerup', end);
    this.joy.addEventListener('pointercancel', end);

    el<HTMLButtonElement>('house').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onHouse();
    });
  }

  private moveStick(cx: number, cy: number): void {
    const rect = this.joy.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    const dx = cx - ox;
    const dy = cy - oy;
    const d = Math.hypot(dx, dy);
    const max = rect.width * 0.42;
    const m = Math.min(1, d / max);
    if (d < 1) {
      this.joyVec = { x: 0, y: 0 };
      this.knob.style.transform = 'translate(0px, 0px)';
      return;
    }
    this.joyVec = { x: (dx / d) * m, y: (dy / d) * m };
    const kx = (dx / d) * Math.min(d, max);
    const ky = (dy / d) * Math.min(d, max);
    this.knob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
  }

  getInput(): { x: number; y: number } {
    if (this.joyId !== null) return this.joyVec;
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    return { x, y };
  }
}
