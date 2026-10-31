import type { ShopView } from '../types';
import { el } from './dom';

export class ShopPanel {
  private root = el<HTMLDivElement>('cards');

  show(view: ShopView, onBuy: (id: string) => ShopView, onClose: () => void): void {
    const render = (v: ShopView): void => {
      this.root.innerHTML = '';

      const panel = document.createElement('div');
      panel.className = 'shop';

      const head = document.createElement('div');
      head.className = 'shop-head';
      head.innerHTML = `<span>台风应急采购</span><b>能量 ${v.energy}</b>`;
      panel.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'shop-grid';

      for (const item of v.items) {
        const disabled = item.soldOut || item.price > v.energy;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shop-item' + (disabled ? ' disabled' : '');
        btn.innerHTML = `
          <div class="si-top"><span class="si-name">${item.name}</span><span class="si-price">${item.soldOut ? '已购' : item.price}</span></div>
          <div class="si-desc">${item.desc}</div>
          <div class="si-tip">${item.tip}</div>
        `;
        if (!disabled) {
          btn.addEventListener('click', () => {
            const next = onBuy(item.id);
            render(next);
          });
        }
        grid.appendChild(btn);
      }

      panel.appendChild(grid);

      const foot = document.createElement('div');
      foot.className = 'shop-foot';
      const go = document.createElement('button');
      go.type = 'button';
      go.id = 'shop-go';
      go.textContent = '继续顶着台风走';
      go.addEventListener('click', () => {
        this.root.classList.add('hidden');
        onClose();
      });
      foot.appendChild(go);
      panel.appendChild(foot);

      this.root.appendChild(panel);
      this.root.classList.remove('hidden');
    };

    render(view);
  }
}
