export type ShopId =
  | 'tree'
  | 'window'
  | 'kit'
  | 'puddle'
  | 'billboard'
  | 'radio'
  | 'torch'
  | 'rib'
  | 'sole'
  | 'pair'
  | 'umbSlot'
  | 'bootSlot';

export type ShopKind = 'hp' | 'buff';

export interface ShopDef {
  id: ShopId;
  name: string;
  desc: string;
  tip: string;
  /** 基础价，实际价格 = price × ORB.value */
  price: number;
  kind: ShopKind;
}

/** 台风自救措施：标题是做法，下面是百分比加成与一条常识 */
export const SHOP: ShopDef[] = [
  {
    id: 'tree',
    name: '避开大树',
    desc: '生命上限 +15%',
    tip: '台风伤亡里倒树占比最高，别在树下躲雨。',
    price: 24,
    kind: 'hp',
  },
  {
    id: 'window',
    name: '加固门窗',
    desc: '回复 25% 最大生命',
    tip: '玻璃飞溅是室内受伤主因，贴胶带并不能防碎。',
    price: 12,
    kind: 'hp',
  },
  {
    id: 'kit',
    name: '备好应急包',
    desc: '回复 50% 最大生命',
    tip: '断水断电时，急救包比外卖可靠得多。',
    price: 20,
    kind: 'hp',
  },
  {
    id: 'puddle',
    name: '积水慢行',
    desc: '移动速度 +8%',
    tip: '水下可能有暗坑和漏电，慢走才看得清。',
    price: 18,
    kind: 'buff',
  },
  {
    id: 'billboard',
    name: '远离广告牌',
    desc: '受到伤害 -10%',
    tip: '高空坠物比风雨本身更致命。',
    price: 22,
    kind: 'buff',
  },
  {
    id: 'radio',
    name: '收听预警',
    desc: '能量拾取范围 +25%',
    tip: '提前半小时知道台风路径，比什么都强。',
    price: 16,
    kind: 'buff',
  },
  {
    id: 'torch',
    name: '手电筒',
    desc: '武器射程 +15%',
    tip: '停电时别用明火照明，LED 手电更安全。',
    price: 18,
    kind: 'buff',
  },
  {
    id: 'rib',
    name: '绑紧伞骨',
    desc: '雨伞伤害 +20%',
    tip: '风大时硬撑伞会被吹翻，顺风收伞更省力。',
    price: 22,
    kind: 'buff',
  },
  {
    id: 'sole',
    name: '防滑雨靴',
    desc: '雨靴伤害 +20%',
    tip: '涉水要穿包脚鞋，避免被水下杂物划伤。',
    price: 22,
    kind: 'buff',
  },
  {
    id: 'pair',
    name: '结伴同行',
    desc: '雨伞股数 +1（最多 4）',
    tip: '台风天别单独行动，互相能拉一把。',
    price: 30,
    kind: 'buff',
  },
  {
    id: 'umbSlot',
    name: '备用雨伞',
    desc: '雨伞槽位 +1（最多 3）',
    tip: '台风天多备一把伞，坏了还有得换。',
    price: 34,
    kind: 'buff',
  },
  {
    id: 'bootSlot',
    name: '备用雨靴',
    desc: '雨靴槽位 +1（最多 3）',
    tip: '湿鞋不换容易得足癣，备一双是常识。',
    price: 34,
    kind: 'buff',
  },
];
