/**
 * 交易行系统常量
 * 定义交易行物品池、定价规则、刷新机制
 * NPC上架物品，玩家直接购买，购买后下架
 */

import { ItemType, EquipmentSlot } from '../types';

/** 交易行物品模板 */
export interface MarketItemTemplate {
  name: string;
  type: ItemType;
  description: string;
  rarity: '稀有' | '传说' | '仙品';
  /** 售价基数（会被境界倍率放大） */
  price: number;
  effect?: Record<string, number>;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot;
  /** 最低出现境界（索引），低于此境界不会刷新到 */
  minRealmIndex?: number;
  /** 上架NPC名称 */
  sellerName: string;
}

/** NPC名字池（随机分配，增加真实感） */
const NPC_NAMES = [
  '散修李明', '云游商人', '天涯客', '百晓生', '药王谷弟子',
  '炼器阁执事', '万宝楼掌柜', '寻宝道人', '隐世老者', '仙盟使者',
  '北域商贾', '南海散修', '西域行商', '东洲富商', '神秘修士',
];

export function getRandomSellerName(): string {
  return NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
}

/** 交易行物品池 */
export const MARKET_ITEM_POOL: MarketItemTemplate[] = [
  // ===== 稀有级 =====
  {
    name: '灵兽精血', type: ItemType.Material,
    description: '灵兽的精血，蕴含强大的生命力，灵宠进化必备材料。',
    rarity: '稀有', price: 3000, minRealmIndex: 0,
    sellerName: '散修李明',
  },
  {
    name: '月华石', type: ItemType.Material,
    description: '吸收月华之力的灵石，可助灵宠进化。',
    rarity: '稀有', price: 2800, minRealmIndex: 0,
    sellerName: '云游商人',
  },
  {
    name: '星辰碎片', type: ItemType.Material,
    description: '来自星辰的碎片，蕴含神秘力量。',
    rarity: '稀有', price: 3500, minRealmIndex: 0,
    sellerName: '寻宝道人',
  },
  {
    name: '仙灵果', type: ItemType.Material,
    description: '仙灵树结出的果实，可大幅提升灵宠实力。',
    rarity: '稀有', price: 4000, minRealmIndex: 0,
    sellerName: '药王谷弟子',
  },
  {
    name: '寒铁', type: ItemType.Material,
    description: '极寒之地的寒铁，铸造高阶法宝的珍稀材料。',
    rarity: '稀有', price: 2500, minRealmIndex: 0,
    sellerName: '炼器阁执事',
  },
  {
    name: '玄天石', type: ItemType.Material,
    description: '蕴含玄天之力的奇石，可用于炼器。',
    rarity: '稀有', price: 3000, minRealmIndex: 0,
    sellerName: '万宝楼掌柜',
  },
  {
    name: '护脉丹', type: ItemType.Pill,
    description: '突破时保护经脉，降低走火入魔风险。',
    rarity: '稀有', price: 5000, minRealmIndex: 0,
    sellerName: '药王谷弟子',
  },
  {
    name: '妖兽内丹', type: ItemType.Material,
    description: '妖兽体内凝聚的内丹，蕴含精纯妖力。',
    rarity: '稀有', price: 2000, minRealmIndex: 0,
    sellerName: '散修李明',
  },

  // ===== 传说级 =====
  {
    name: '龙鳞片', type: ItemType.Material,
    description: '真龙脱落的鳞片，蕴含龙族之力，极其珍贵。',
    rarity: '传说', price: 15000, minRealmIndex: 1,
    sellerName: '隐世老者',
  },
  {
    name: '凤凰羽', type: ItemType.Material,
    description: '凤凰的羽毛，蕴含涅槃重生之力。',
    rarity: '传说', price: 18000, minRealmIndex: 1,
    sellerName: '百晓生',
  },
  {
    name: '麒麟角', type: ItemType.Material,
    description: '麒麟的角，拥有祥瑞之力，可辟万邪。',
    rarity: '传说', price: 20000, minRealmIndex: 1,
    sellerName: '仙盟使者',
  },
  {
    name: '天材地宝', type: ItemType.Material,
    description: '天地孕育的至宝，蕴含大道法则。',
    rarity: '传说', price: 25000, minRealmIndex: 2,
    sellerName: '隐世老者',
  },
  {
    name: '神兽精魄', type: ItemType.Material,
    description: '远古神兽遗留的精魄，蕴含本源之力。',
    rarity: '传说', price: 30000, minRealmIndex: 2,
    sellerName: '北域商贾',
  },
  {
    name: '九转金丹', type: ItemType.Pill,
    description: '历经九次炼制的神丹，可大幅提升修为。',
    rarity: '传说', price: 22000, minRealmIndex: 2,
    sellerName: '药王谷弟子',
  },
  {
    name: '天罡剑', type: ItemType.Weapon,
    description: '以天罡之力锻造的宝剑，削铁如泥。',
    rarity: '传说', price: 35000, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 500 }, minRealmIndex: 2,
    sellerName: '炼器阁执事',
  },
  {
    name: '玄龟甲', type: ItemType.Armor,
    description: '以万年玄龟甲壳制成的护甲，防御力惊人。',
    rarity: '传说', price: 28000, isEquippable: true, equipmentSlot: EquipmentSlot.Chest,
    effect: { defense: 300 }, minRealmIndex: 2,
    sellerName: '万宝楼掌柜',
  },

  // ===== 仙品级 =====
  {
    name: '混沌石', type: ItemType.Material,
    description: '来自混沌的奇石，蕴含创世之力，可重塑灵宠根基。',
    rarity: '仙品', price: 80000, minRealmIndex: 3,
    sellerName: '神秘修士',
  },
  {
    name: '大道碎片', type: ItemType.Material,
    description: '大道法则的碎片，参悟可领悟天地至理。',
    rarity: '仙品', price: 100000, minRealmIndex: 3,
    sellerName: '天涯客',
  },
  {
    name: '仙灵本源', type: ItemType.Material,
    description: '仙灵的本源力量，可大幅提升灵宠品阶。',
    rarity: '仙品', price: 120000, minRealmIndex: 3,
    sellerName: '神秘修士',
  },
  {
    name: '造化神液', type: ItemType.Material,
    description: '造化之力凝聚的神液，可重塑灵宠资质。',
    rarity: '仙品', price: 150000, minRealmIndex: 4,
    sellerName: '隐世老者',
  },
  {
    name: '鸿蒙紫气', type: ItemType.Material,
    description: '天地初开时的鸿蒙之气，蕴含无上大道。',
    rarity: '仙品', price: 200000, minRealmIndex: 4,
    sellerName: '天涯客',
  },
  {
    name: '星辰仙衣', type: ItemType.Armor,
    description: '以星辰之力编织的仙衣，万法不侵。',
    rarity: '仙品', price: 180000, isEquippable: true, equipmentSlot: EquipmentSlot.Chest,
    effect: { defense: 1500, hp: 5000 }, minRealmIndex: 4,
    sellerName: '南疆行商',
  },
  {
    name: '灭世剑', type: ItemType.Weapon,
    description: '传说中可斩断因果的神剑，威力无穷。',
    rarity: '仙品', price: 250000, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 3000 }, minRealmIndex: 5,
    sellerName: '神秘修士',
  },
];

/** 交易行每次刷新的物品数量 */
export const MARKET_ITEMS_PER_BATCH = 8;

/** 刷新冷却时间（毫秒） */
export const MARKET_REFRESH_COOLDOWN = 60_000;

/** 境界对应的交易行价格倍率 */
export const MARKET_REALM_PRICE_MULTIPLIERS = [1.0, 1.2, 1.5, 2.0, 2.8, 4.0, 6.0];
