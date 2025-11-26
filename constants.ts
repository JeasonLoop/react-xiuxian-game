
import { RealmType, Item, ItemType, CultivationArt, ItemRarity, SectRank, SecretRealm, Recipe } from './types';

export const REALM_ORDER = [
  RealmType.QiRefining,
  RealmType.Foundation,
  RealmType.GoldenCore,
  RealmType.NascentSoul,
  RealmType.SpiritSevering,
  RealmType.VoidRefining,
  RealmType.ImmortalAscension
];

export const REALM_DATA: Record<RealmType, { baseMaxHp: number; baseAttack: number; baseDefense: number; maxExpBase: number }> = {
  [RealmType.QiRefining]: { baseMaxHp: 100, baseAttack: 10, baseDefense: 5, maxExpBase: 100 },
  [RealmType.Foundation]: { baseMaxHp: 500, baseAttack: 50, baseDefense: 25, maxExpBase: 1000 },
  [RealmType.GoldenCore]: { baseMaxHp: 2500, baseAttack: 200, baseDefense: 100, maxExpBase: 5000 },
  [RealmType.NascentSoul]: { baseMaxHp: 10000, baseAttack: 1000, baseDefense: 500, maxExpBase: 25000 },
  [RealmType.SpiritSevering]: { baseMaxHp: 50000, baseAttack: 5000, baseDefense: 2500, maxExpBase: 100000 },
  [RealmType.VoidRefining]: { baseMaxHp: 200000, baseAttack: 20000, baseDefense: 10000, maxExpBase: 500000 },
  [RealmType.ImmortalAscension]: { baseMaxHp: 1000000, baseAttack: 100000, baseDefense: 50000, maxExpBase: 9999999 },
};

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  '普通': 1,
  '稀有': 1.5,
  '传说': 2.5,
  '仙品': 5.0
};

export const CULTIVATION_ARTS: CultivationArt[] = [
  {
    id: 'art-basic-breath',
    name: '吐纳法',
    type: 'mental',
    description: '基础的呼吸吐纳之术，微弱提升修炼速度。',
    realmRequirement: RealmType.QiRefining,
    cost: 0,
    effects: { expRate: 0.1 }
  },
  {
    id: 'art-iron-skin',
    name: '铁皮功',
    type: 'body',
    description: '锤炼皮肉，使其坚如凡铁。永久提升防御。',
    realmRequirement: RealmType.QiRefining,
    cost: 50,
    effects: { defense: 5, hp: 20 }
  },
  {
    id: 'art-spirit-cloud',
    name: '云灵诀',
    type: 'mental',
    description: '云灵宗入门心法，吸纳灵气如云雾缭绕。',
    realmRequirement: RealmType.QiRefining,
    cost: 100,
    effects: { expRate: 0.25, attack: 5 }
  },
  {
    id: 'art-fiery-fist',
    name: '烈火拳',
    type: 'body',
    description: '将灵气转化为烈火附着于双拳。大幅提升攻击力。',
    realmRequirement: RealmType.Foundation,
    cost: 300,
    effects: { attack: 30 }
  },
  {
    id: 'art-jade-bone',
    name: '玉骨功',
    type: 'body',
    description: '锻骨如玉，百毒不侵。大幅提升气血与防御。',
    realmRequirement: RealmType.Foundation,
    cost: 500,
    effects: { defense: 20, hp: 100 }
  },
  {
    id: 'art-pure-yang',
    name: '纯阳无极功',
    type: 'mental',
    description: '至刚至阳的高深心法，修炼速度极快。',
    realmRequirement: RealmType.GoldenCore,
    cost: 2000,
    effects: { expRate: 0.5, attack: 50 }
  },
  {
    id: 'art-thunder-sword',
    name: '天雷剑诀',
    type: 'body',
    description: '引九天神雷入剑，威力绝伦，若是肉身不够强横恐遭反噬。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3000,
    effects: { attack: 150 }
  },
  {
    id: 'art-immortal-life',
    name: '长生诀',
    type: 'mental',
    description: '上古木系神功，生生不息，气血悠长。',
    realmRequirement: RealmType.NascentSoul,
    cost: 8000,
    effects: { expRate: 0.6, hp: 2000 }
  },
  {
    id: 'art-void-body',
    name: '虚空霸体',
    type: 'body',
    description: '炼化虚空之力入体，肉身成圣。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 20000,
    effects: { defense: 500, attack: 500, hp: 5000 }
  }
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'spirit-stone-shard',
    name: '灵石碎片',
    type: ItemType.Material,
    description: '含有少量灵气的碎裂灵石。',
    quantity: 5,
    rarity: '普通'
  },
  {
    id: 'refining-stone',
    name: '炼器石',
    type: ItemType.Material,
    description: '用于强化法宝的基础材料。',
    quantity: 10,
    rarity: '普通'
  },
  {
    id: 'healing-herb',
    name: '止血草',
    type: ItemType.Herb,
    description: '常见的草药，用于治疗轻微外伤。',
    quantity: 2,
    rarity: '普通',
    effect: { hp: 20 }
  },
  {
    id: 'spirit-gathering-grass',
    name: '聚灵草',
    type: ItemType.Herb,
    description: '吸收天地灵气的草药，炼制聚气丹的主材。',
    quantity: 5,
    rarity: '普通'
  },
  {
    id: 'iron-sword',
    name: '凡铁剑',
    type: ItemType.Artifact,
    description: '普通的铁剑，聊胜于无。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    effect: { attack: 5 }
  },
  {
    id: 'cloth-robe',
    name: '粗布道袍',
    type: ItemType.Artifact,
    description: '云灵宗外门弟子制式道袍。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    effect: { defense: 3, hp: 10 }
  },
  {
    id: 'azure-frost-sword',
    name: '青霜剑',
    type: ItemType.Artifact,
    description: '剑身泛着寒光，削铁如泥。',
    quantity: 0,
    rarity: '稀有',
    level: 0,
    isEquippable: true,
    effect: { attack: 15 }
  }
];

export const PILL_RECIPES: Recipe[] = [
  {
    name: '聚气丹',
    cost: 10,
    ingredients: [{ name: '聚灵草', qty: 3 }],
    result: {
      name: '聚气丹',
      type: ItemType.Pill,
      description: '短时间内大幅提升修炼速度（瞬间获得修为）。',
      rarity: '普通',
      effect: { exp: 50 }
    }
  },
  {
    name: '回春丹',
    cost: 20,
    ingredients: [{ name: '止血草', qty: 3 }, { name: '聚灵草', qty: 1 }],
    result: {
      name: '回春丹',
      type: ItemType.Pill,
      description: '疗伤圣药，大幅恢复气血。',
      rarity: '稀有',
      effect: { hp: 200 }
    }
  },
  {
    name: '洗髓丹',
    cost: 100,
    ingredients: [{ name: '紫猴花', qty: 2 }, { name: '天灵果', qty: 1 }],
    result: {
      name: '洗髓丹',
      type: ItemType.Pill,
      description: '易筋洗髓，脱胎换骨。永久增加少量最大生命值。',
      rarity: '稀有',
      effect: { hp: 50 } // Treated as permanent in App logic special case or simple maxHp boost
    }
  },
  {
    name: '筑基丹',
    cost: 500,
    ingredients: [{ name: '千年人参', qty: 2 }, { name: '妖兽内丹', qty: 1 }],
    result: {
      name: '筑基丹',
      type: ItemType.Pill,
      description: '增加突破到筑基期的几率。服用后获得海量修为。',
      rarity: '传说',
      effect: { exp: 500 }
    }
  },
  {
    name: '龙血丹',
    cost: 2000,
    ingredients: [{ name: '龙鳞果', qty: 3 }, { name: '高阶妖丹', qty: 2 }],
    result: {
      name: '龙血丹',
      type: ItemType.Pill,
      description: '蕴含一丝真龙之血，服用后气血如龙。大幅增加气血上限。',
      rarity: '传说',
      effect: { hp: 500 }
    }
  },
  {
    name: '九转金丹',
    cost: 5000,
    ingredients: [{ name: '万年灵乳', qty: 1 }, { name: '九叶芝草', qty: 1 }],
    result: {
      name: '九转金丹',
      type: ItemType.Pill,
      description: '传说中的仙丹，服用后甚至能让凡人立地飞升。',
      rarity: '仙品',
      effect: { exp: 5000, attack: 10, defense: 10 }
    }
  }
];

// Upgrade Constants
export const UPGRADE_MATERIAL_NAME = '炼器石';
export const BASE_UPGRADE_COST_STONES = 50;
export const BASE_UPGRADE_COST_MATS = 2;

// Returns percentage increase (0.1 = 10%)
export const getUpgradeMultiplier = (rarity: ItemRarity = '普通') => {
  switch (rarity) {
    case '普通': return 0.10;
    case '稀有': return 0.15;
    case '传说': return 0.20;
    case '仙品': return 0.25;
    default: return 0.10;
  }
};

// --- SECT CONSTANTS ---

export interface SectInfo {
  id: string;
  name: string;
  description: string;
  reqRealm: RealmType;
}

export const SECTS: SectInfo[] = [
  { 
    id: 'sect-cloud', 
    name: '云灵宗', 
    description: '正道大宗，门风清正，适合大部分修士。', 
    reqRealm: RealmType.QiRefining 
  },
  { 
    id: 'sect-fire', 
    name: '烈阳宗', 
    description: '坐落于火山之上，专修火法，行事霸道。', 
    reqRealm: RealmType.Foundation 
  },
  { 
    id: 'sect-sword', 
    name: '万剑门', 
    description: '一剑破万法。门徒皆为剑痴，攻击力极强。', 
    reqRealm: RealmType.Foundation 
  }
];

export const SECT_RANK_REQUIREMENTS: Record<SectRank, { contribution: number; realmIndex: number }> = {
  [SectRank.Outer]: { contribution: 0, realmIndex: 0 },
  [SectRank.Inner]: { contribution: 500, realmIndex: 1 }, // Foundation
  [SectRank.Core]: { contribution: 2000, realmIndex: 2 }, // Golden Core
  [SectRank.Elder]: { contribution: 10000, realmIndex: 3 }, // Nascent Soul
};

export const SECT_SHOP_ITEMS: { name: string; cost: number; item: Omit<Item, 'id'> }[] = [
  { name: '炼器石', cost: 10, item: { name: '炼器石', type: ItemType.Material, description: '用于强化法宝的基础材料。', quantity: 1, rarity: '普通' } },
  { name: '聚气丹', cost: 20, item: { name: '聚气丹', type: ItemType.Pill, description: '短时间内大幅提升修炼速度。', quantity: 1, rarity: '普通', effect: { exp: 50 } } },
  { name: '紫猴花', cost: 50, item: { name: '紫猴花', type: ItemType.Herb, description: '炼制洗髓丹的材料，生长在悬崖峭壁。', quantity: 1, rarity: '稀有' } },
  { name: '洗髓丹', cost: 100, item: { name: '洗髓丹', type: ItemType.Pill, description: '强身健体，略微提升最大气血。', quantity: 1, rarity: '稀有', effect: { hp: 50 } } },
  { name: '筑基丹', cost: 1000, item: { name: '筑基丹', type: ItemType.Pill, description: '增加突破到筑基期的几率。', quantity: 1, rarity: '传说', effect: { exp: 500 } } },
  { name: '高阶妖丹', cost: 500, item: { name: '高阶妖丹', type: ItemType.Material, description: '强大妖兽的内丹，灵气逼人。', quantity: 1, rarity: '稀有' } },
];

// --- SECRET REALMS ---

export const SECRET_REALMS: SecretRealm[] = [
  {
    id: 'realm-beast-mountain',
    name: '万兽山脉',
    description: '外围相对安全，深处盘踞着可怕的妖兽。适合炼气、筑基期修士历练。',
    minRealm: RealmType.QiRefining,
    cost: 50,
    riskLevel: '中',
    drops: ['妖兽材料', '稀有草药', '攻击法器']
  },
  {
    id: 'realm-ancient-tomb',
    name: '上古剑冢',
    description: '传说中上古剑修的埋骨之地，剑气纵横。非筑基期不可入。',
    minRealm: RealmType.Foundation,
    cost: 200,
    riskLevel: '高',
    drops: ['剑修功法', '残破灵宝', '剑意草']
  },
  {
    id: 'realm-thunder-purgatory',
    name: '雷罚炼狱',
    description: '终年雷霆不息，稍有不慎便会灰飞烟灭。',
    minRealm: RealmType.GoldenCore,
    cost: 500,
    riskLevel: '极度危险',
    drops: ['雷属性至宝', '仙品丹药材料', '天阶功法']
  }
];
