import * as C from '../config';
import type { ShopId } from '../config';
import type { ShopView } from '../types';

export class ShopModel {
  private stock = new Map<string, number>();

  reset(): void {
    this.stock.clear();
  }

  view(energy: number): ShopView {
    return {
      energy,
      items: C.SHOP.map((d) => ({
        id: d.id,
        name: d.name,
        desc: d.desc,
        tip: d.tip,
        price: d.price * C.ORB.value,
        soldOut: d.limit !== undefined && (this.stock.get(d.id) ?? 0) >= d.limit,
      })),
    };
  }

  canBuy(id: ShopId, energy: number): boolean {
    const def = C.SHOP.find((d) => d.id === id);
    if (!def) return false;
    const bought = this.stock.get(def.id) ?? 0;
    if (def.limit !== undefined && bought >= def.limit) return false;
    return energy >= def.price * C.ORB.value;
  }

  priceOf(id: ShopId): number {
    return (C.SHOP.find((d) => d.id === id)?.price ?? 0) * C.ORB.value;
  }

  record(id: ShopId): void {
    this.stock.set(id, (this.stock.get(id) ?? 0) + 1);
  }
}
