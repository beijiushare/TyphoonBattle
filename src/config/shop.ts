export type ShopId =
  | 'choco'
  | 'tea'
  | 'kit'
  | 'blanket'
  | 'torch'
  | 'rib'
  | 'sole'
  | 'arms'
  | 'umbSlot'
  | 'bootSlot';

export interface ShopDef {
  id: ShopId;
  name: string;
  desc: string;
  tip: string;
  price: number;
  limit?: number;
}

/** 台风应急采购：每件商品都带一条生存常识 */
export const SHOP: ShopDef[] = [
  {
    id: 'choco',
    name: '巧克力',
    desc: '血量 +5',
    tip: '极端情况下，巧克力是快速补充体力的优秀食物。',
    price: 8,
  },
  {
    id: 'tea',
    name: '热姜茶',
    desc: '血量 +15',
    tip: '淋雨后喝热饮有助于恢复体温，但别靠喝酒取暖。',
    price: 12,
  },
  {
    id: 'kit',
    name: '急救包',
    desc: '血量回满',
    tip: '内涝中的伤口容易感染，及时处理比硬扛安全。',
    price: 26,
  },
  {
    id: 'blanket',
    name: '保温毯',
    desc: '生命上限 +20 并回复 20',
    tip: '台风天失温比淋湿更危险，先保住核心体温。',
    price: 24,
    limit: 4,
  },
  {
    id: 'torch',
    name: '手电筒',
    desc: '所有武器射程 +30',
    tip: '停电时别用明火照明，LED 手电更安全。',
    price: 18,
    limit: 3,
  },
  {
    id: 'rib',
    name: '伞骨加固',
    desc: '雨伞伤害 +20%',
    tip: '台风里硬撑伞会被吹翻，顺风收伞更省力。',
    price: 22,
    limit: 4,
  },
  {
    id: 'sole',
    name: '鞋底加厚',
    desc: '雨靴伤害 +20%',
    tip: '涉水要穿包脚鞋，避免被水下杂物划伤。',
    price: 22,
    limit: 4,
  },
  {
    id: 'arms',
    name: '伞阵扩展',
    desc: '雨伞股数 +1（最多 4 股）',
    tip: '开阔地带打伞容易被雷击，尽量走建筑背风侧。',
    price: 30,
    limit: 3,
  },
  {
    id: 'umbSlot',
    name: '备用雨伞',
    desc: '雨伞槽位 +1（最多 3）',
    tip: '台风天多备一把伞，坏了还有得换。',
    price: 34,
    limit: 2,
  },
  {
    id: 'bootSlot',
    name: '备用雨靴',
    desc: '雨靴槽位 +1（最多 3）',
    tip: '湿鞋不换容易得足癣，备一双是常识。',
    price: 34,
    limit: 2,
  },
];
