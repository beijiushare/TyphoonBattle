import * as C from '../config';
import type { ShopId } from '../config';
import type { ShopView } from '../types';

/**
 * 每次开店随机抽 5 件，其中必有一件回血/加血上限；
 * 同一次商店里每件只能买一次。
 */
export class ShopModel {
  private roll: ShopId[] = [];
  private bought = new Set<ShopId>();

  reset(): void {
    this.roll = [];
    this.bought.clear();
  }

  /** 开店时调用：抽 1 件 HP 类 + 4 件其他 */
  newVisit(): void {
    this.bought.clear();

    const hp = C.SHOP.filter((d) => d.kind === 'hp');
    const others = C.SHOP.filter((d) => d.kind !== 'hp');

    const pick: ShopId[] = [];
    const hpPick = hp[Math.floor(Math.random() * hp.length)];
    pick.push(hpPick.id);

    const pool = others.slice();
    while (pick.length < 5 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      pick.push(pool.splice(i, 1)[0].id);
    }

    this.roll = pick;
  }

  view(energy: number): ShopView {
    return {
      energy,
      items: this.roll.map((id) => {
        const d = C.SHOP.find((s) => s.id === id)!;
        return {
          id: d.id,
          name: d.name,
          desc: d.desc,
          tip: d.tip,
          price: d.price * C.ORB.value,
          soldOut: this.bought.has(d.id),
        };
      }),
    };
  }

  canBuy(id: ShopId, energy: number): boolean {
    const def = C.SHOP.find((d) => d.id === id);
    if (!def) return false;
    if (!this.roll.includes(id)) return false;
    if (this.bought.has(id)) return false;
    return energy >= def.price * C.ORB.value;
  }

  priceOf(id: ShopId): number {
    return (C.SHOP.find((d) => d.id === id)?.price ?? 0) * C.ORB.value;
  }

  record(id: ShopId): void {
    this.bought.add(id);
  }
}
