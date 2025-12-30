/**
 * 物品系统相关常量
 */

import { Item, ItemType, Recipe, ItemRarity, EquipmentSlot } from '../types';

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  普通: 1,
  稀有: 1.5,
  传说: 2.5,
  仙品: 6.0,
};

// 初始化物品
export const INITIAL_ITEMS: Item[] = [
  {
    id: 'refining-stone',
    name: '炼器石',
    type: ItemType.Material,
    description: '经过特殊处理的炼器石，质地坚硬，蕴含着微弱的灵气，是强化法宝的基础材料，能够提升法宝的强度和威力。',
    quantity: 10,
    rarity: '普通',
  },
  {
    id: 'healing-herb',
    name: '止血草',
    type: ItemType.Herb,
    description: '常见的止血草药，叶片翠绿，散发着淡淡的药香，能够快速止血并恢复轻微的外伤，是修士们常备的疗伤草药。',
    quantity: 2,
    rarity: '普通',
    effect: { hp: 20 },
  },
  {
    id: 'spirit-gathering-grass',
    name: '聚灵草',
    type: ItemType.Herb,
    description: '能够吸收天地灵气的珍贵草药，叶片上闪烁着淡淡的灵光，是炼制聚气丹的主要材料，蕴含着浓郁的灵气。',
    quantity: 5,
    rarity: '普通',
  },
  {
    id: 'iron-sword',
    name: '凡铁剑',
    type: ItemType.Weapon,
    description: '普通的铁制长剑，虽然材质普通，但经过精心锻造，剑身锋利，剑柄握感舒适，是初入修炼之路的修士常用的武器。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    equipmentSlot: 'weapon' as any,
    effect: { attack: 15 },
  },
  {
    id: 'cloth-robe',
    name: '粗布道袍',
    type: ItemType.Armor,
    description: '云灵宗外门弟子制式道袍，虽然材质普通，但经过特殊处理，具有一定的防护能力，是初入宗门的弟子常用的护身衣物。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Chest,
    effect: { defense: 3, hp: 10 },
  },
];

export const PILL_RECIPES: Recipe[] = [
  {
    name: '聚气丹',
    cost: 10,
    ingredients: [{ name: '聚灵草', qty: 3 }],
    result: {
      name: '聚气丹',
      type: ItemType.Pill,
      description: '能够短时间内大幅提升修炼速度的珍贵丹药，服用后能够瞬间获得大量修为，是修士们快速提升实力的常用丹药。',
      rarity: '普通',
      effect: { exp: 150 },
    },
  },
  {
    name: '回春丹',
    cost: 20,
    ingredients: [
      { name: '止血草', qty: 3 },
      { name: '聚灵草', qty: 1 },
    ],
    result: {
      name: '回春丹',
      type: ItemType.Pill,
      description: '疗伤圣药，由多种珍贵草药炼制而成，服用后能够大幅恢复气血，是修士们在战斗中保命的珍贵丹药。',
      rarity: '稀有',
      effect: { hp: 200 },
    },
  },
  {
    name: '洗髓丹',
    cost: 100,
    ingredients: [
      { name: '紫猴花', qty: 2 },
      { name: '天灵果', qty: 1 },
    ],
    result: {
      name: '洗髓丹',
      type: ItemType.Pill,
      description: '易筋洗髓的珍贵丹药，服用后能够脱胎换骨，改善体质，永久增加最大生命值，是修士们提升根基的珍贵丹药。',
      rarity: '稀有',
      permanentEffect: { maxHp: 50 },
    },
  },
  {
    name: '筑基丹',
    cost: 500,
    ingredients: [
      { name: '千年人参', qty: 2 },
      { name: '妖兽内丹', qty: 1 },
    ],
    result: {
      name: '筑基丹',
      type: ItemType.Pill,
      description: '突破筑基期的珍贵丹药，由千年人参和妖兽内丹炼制而成，服用后能够增加突破几率，获得海量修为，并永久提升基础属性，是修士们突破境界的必备丹药。',
      rarity: '传说',
      effect: { exp: 500 },
      permanentEffect: { spirit: 30, physique: 30, maxHp: 100 },
    },
  },
  {
    name: '龙血丹',
    cost: 2000,
    ingredients: [
      { name: '龙鳞果', qty: 3 },
      { name: '高阶妖丹', qty: 2 },
    ],
    result: {
      name: '龙血丹',
      type: ItemType.Pill,
      description: '蕴含一丝真龙之血，服用后气血如龙。大幅增加气血上限。',
      rarity: '传说',
      permanentEffect: { maxHp: 500, physique: 50 },
    },
  },
  {
    name: '九转金丹',
    cost: 5000,
    ingredients: [
      { name: '万年灵乳', qty: 1 },
      { name: '九叶芝草', qty: 1 },
    ],
    result: {
      name: '九转金丹',
      type: ItemType.Pill,
      description: '传说中的九转金丹，由万年灵乳和九叶芝草炼制而成，服用后甚至能让凡人立地飞升，是修士们梦寐以求的仙丹，能够大幅提升修为和各项属性。',
      rarity: '仙品',
      effect: { exp: 50000 },
      permanentEffect: { maxLifespan: 1000, spirit: 1000, attack: 1000, defense: 1000, physique: 1000, speed: 1000},
    },
  },
  {
    name: '延寿丹',
    cost: 300,
    ingredients: [
      { name: '千年人参', qty: 2 },
      { name: '血参', qty: 3 },
    ],
    result: {
      name: '延寿丹',
      type: ItemType.Pill,
      description: '增加寿命的珍贵丹药，由千年人参和血参炼制而成，服用后能够延长10年寿命，是修士们延长寿元的珍贵丹药。',
      rarity: '稀有',
      effect: { lifespan: 10 },
    },
  },
  {
    name: '长生丹',
    cost: 1500,
    ingredients: [
      { name: '万年仙草', qty: 1 },
      { name: '千年灵芝', qty: 2 },
    ],
    result: {
      name: '长生丹',
      type: ItemType.Pill,
      description: '增加寿命的极品丹药，由万年仙草和千年灵芝炼制而成，服用后能够延长50年寿命并增加最大寿命，是修士们延长寿元的珍贵丹药。',
      rarity: '传说',
      permanentEffect: { maxLifespan: 50 },
    },
  },
  {
    name: '不死仙丹',
    cost: 8000,
    ingredients: [
      { name: '万年灵乳', qty: 2 },
      { name: '九叶芝草', qty: 2 },
      { name: '龙鳞果', qty: 3 },
    ],
    result: {
      name: '不死仙丹',
      type: ItemType.Pill,
      description: '传说中的不死仙丹，由万年灵乳、九叶芝草和龙鳞果炼制而成，服用后能够延长200年寿命并大幅增加最大寿命500年，是修士们梦寐以求的仙丹。',
      rarity: '仙品',
      effect: { lifespan: 200 },
      permanentEffect: { maxLifespan: 500 },
    },
  },
  {
    name: '洗灵丹',
    cost: 400,
    ingredients: [
      { name: '天灵果', qty: 3 },
      { name: '紫猴花', qty: 2 },
    ],
    result: {
      name: '洗灵丹',
      type: ItemType.Pill,
      description: '洗涤灵根的珍贵丹药，由天灵果和紫猴花炼制而成，服用后能够洗涤灵根，所有灵根各提升5点，是修士们改善资质的珍贵丹药。',
      rarity: '稀有',
      permanentEffect: {
        spiritualRoots: {
          metal: 5,
          wood: 5,
          water: 5,
          fire: 5,
          earth: 5,
        },
      },
    },
  },
  {
    name: '五行灵丹',
    cost: 2500,
    ingredients: [
      { name: '千年人参', qty: 3 },
      { name: '天灵果', qty: 3 },
      { name: '高阶妖丹', qty: 2 },
    ],
    result: {
      name: '五行灵丹',
      type: ItemType.Pill,
      description: '平衡五行，所有灵根各提升3点。',
      rarity: '传说',
      permanentEffect: {
        spiritualRoots: {
          metal: 3,
          wood: 3,
          water: 3,
          fire: 3,
          earth: 3,
        },
      },
    },
  },
  {
    name: '天灵根丹',
    cost: 10000,
    ingredients: [
      { name: '万年灵乳', qty: 3 },
      { name: '九叶芝草', qty: 3 },
      { name: '万年仙草', qty: 2 },
    ],
    result: {
      name: '天灵根丹',
      type: ItemType.Pill,
      description: '传说中的仙丹，所有灵根各提升10点。',
      rarity: '仙品',
      permanentEffect: {
        spiritualRoots: {
          metal: 10,
          wood: 10,
          water: 10,
          fire: 10,
          earth: 10,
        },
      },
    },
  },
];

// 可通过历练获得的额外丹方（这些不会在初始炼丹面板中显示，需要通过使用丹方物品解锁）
export const DISCOVERABLE_RECIPES: Recipe[] = [
  {
    name: '凝神丹',
    cost: 150,
    ingredients: [
      { name: '凝神花', qty: 3 },
      { name: '聚灵草', qty: 2 },
    ],
    result: {
      name: '凝神丹',
      type: ItemType.Pill,
      description: '凝神静气，提升神识。永久增加神识属性。',
      rarity: '稀有',
      permanentEffect: { spirit: 20 },
    },
  },
  {
    name: '强体丹',
    cost: 200,
    ingredients: [
      { name: '血参', qty: 2 },
      { name: '回气草', qty: 3 },
    ],
    result: {
      name: '强体丹',
      type: ItemType.Pill,
      description: '强身健体，提升体魄。永久增加体魄属性。',
      rarity: '稀有',
      permanentEffect: { physique: 20 },
    },
  },
  {
    name: '破境丹',
    cost: 800,
    ingredients: [
      { name: '千年灵芝', qty: 1 },
      { name: '妖兽内丹', qty: 2 },
    ],
    result: {
      name: '破境丹',
      type: ItemType.Pill,
      description: '突破境界的辅助丹药，大幅提升修为并永久增强属性。',
      rarity: '传说',
      effect: { exp: 10000 },
      permanentEffect: { spirit: 50, physique: 50, attack: 30, defense: 30 },
    },
  },
  {
    name: '仙灵丹',
    cost: 3000,
    ingredients: [
      { name: '万年仙草', qty: 1 },
      { name: '高阶妖丹', qty: 3 },
    ],
    result: {
      name: '仙灵丹',
      type: ItemType.Pill,
      description: '仙家灵丹，服用后修为与属性大幅提升。',
      rarity: '传说',
      effect: { exp: 2000, spirit: 50, physique: 50 },
      permanentEffect: { maxLifespan: 300, spirit: 300, attack: 300, defense: 300, physique: 300, speed: 300},
    },
  },
  {
    name: '天元丹',
    cost: 10000,
    ingredients: [
      { name: '万年灵乳', qty: 2 },
      { name: '九叶芝草', qty: 2 },
      { name: '龙鳞果', qty: 5 },
    ],
    result: {
      name: '天元丹',
      type: ItemType.Pill,
      description: '天元级别的仙丹，服用后全属性大幅提升。',
      rarity: '仙品',
      effect: {
        exp: 10000,
      },
      permanentEffect: { maxLifespan: 500, spirit: 500, attack: 500, defense: 500, physique: 500, speed: 500},
    },
  },
  {
    name: '结金丹',
    cost: 3000,
    ingredients: [
      { name: '千年灵芝', qty: 2 },
      { name: '妖兽内丹', qty: 3 },
    ],
    result: {
      name: '结金丹',
      type: ItemType.Pill,
      description: '有助于凝结金丹的珍贵丹药。服用后大幅提升修为，并永久增强神识。',
      rarity: '稀有',
      effect: { exp: 30000, spirit: 20 },
      permanentEffect: { spirit: 50, maxHp: 200 },
    },
  },
  {
    name: '凝魂丹',
    cost: 4000,
    ingredients: [
      { name: '万年仙草', qty: 1 },
      { name: '千年灵芝', qty: 2 },
      { name: '高阶妖丹', qty: 2 },
    ],
    result: {
      name: '凝魂丹',
      type: ItemType.Pill,
      description: '能够凝聚神魂的珍贵丹药。服用后大幅提升修为和神识，并永久增强神魂。',
      rarity: '传说',
      effect: { exp: 10000, spirit: 50, hp: 300 },
      permanentEffect: { spirit: 100, maxHp: 300, attack: 50 },
    },
  },
  {
    name: '凤凰涅槃丹',
    cost: 6000,
    ingredients: [
      { name: '万年灵乳', qty: 1 },
      { name: '九叶芝草', qty: 2 },
      { name: '龙鳞果', qty: 3 },
      { name: '高阶妖丹', qty: 3 },
    ],
    result: {
      name: '凤凰涅槃丹',
      type: ItemType.Pill,
      description: '蕴含凤凰涅槃之力的神丹。服用后获得涅槃重生之力，大幅提升修为和属性。',
      rarity: '传说',
      effect: { hp: 800, exp: 1500, attack: 30 },
      permanentEffect: { maxHp: 400, attack: 100, defense: 100, spirit: 80, physique: 80, speed: 50 },
    },
  },
];

// 统一的丹药池：合并所有丹方中的丹药定义，供其他模块使用
export const ALL_PILL_RECIPES = [...PILL_RECIPES, ...DISCOVERABLE_RECIPES];

// 根据丹药名称获取丹药定义（从所有丹方中查找）
export const getPillDefinition = (pillName: string): Recipe['result'] | null => {
  const recipe = ALL_PILL_RECIPES.find(r => r.result.name === pillName);
  return recipe ? recipe.result : null;
};

// 常用丹药的快速访问（从常量中获取，避免硬编码）
export const COMMON_PILLS = {
  聚气丹: () => getPillDefinition('聚气丹'),
  回春丹: () => getPillDefinition('回春丹'),
  回血丹: () => getPillDefinition('回血丹'), // 注意：回血丹不在丹方中，需要特殊处理
  洗髓丹: () => getPillDefinition('洗髓丹'),
  筑基丹: () => getPillDefinition('筑基丹'),
  龙血丹: () => getPillDefinition('龙血丹'),
  九转金丹: () => getPillDefinition('九转金丹'),
  延寿丹: () => getPillDefinition('延寿丹'),
  长生丹: () => getPillDefinition('长生丹'),
  不死仙丹: () => getPillDefinition('不死仙丹'),
  洗灵丹: () => getPillDefinition('洗灵丹'),
  五行灵丹: () => getPillDefinition('五行灵丹'),
  天灵根丹: () => getPillDefinition('天灵根丹'),
  凝神丹: () => getPillDefinition('凝神丹'),
  强体丹: () => getPillDefinition('强体丹'),
  破境丹: () => getPillDefinition('破境丹'),
  仙灵丹: () => getPillDefinition('仙灵丹'),
  天元丹: () => getPillDefinition('天元丹'),
};

// 灵宠进化材料（添加到物品常量池，使其可以通过冒险掉落获得）
export const PET_EVOLUTION_MATERIALS_ITEMS: Item[] = [
  // 注意：聚灵草已经在 INITIAL_ITEMS 中定义为草药，这里不需要重复添加
  {
    id: 'monster-core',
    name: '妖兽内丹',
    type: ItemType.Material,
    description: '妖兽体内凝聚的内丹，蕴含妖力。',
    quantity: 1,
    rarity: '普通',
  },
  {
    id: 'spirit-beast-blood',
    name: '灵兽精血',
    type: ItemType.Material,
    description: '灵兽的精血，蕴含强大的生命力。',
    quantity: 1,
    rarity: '稀有',
  },
  {
    id: 'moonlight-stone',
    name: '月华石',
    type: ItemType.Material,
    description: '吸收月华之力的灵石，可助灵宠进化。',
    quantity: 1,
    rarity: '稀有',
  },
  {
    id: 'star-fragment',
    name: '星辰碎片',
    type: ItemType.Material,
    description: '来自星辰的碎片，蕴含神秘力量。',
    quantity: 1,
    rarity: '稀有',
  },
  {
    id: 'dragon-scale',
    name: '龙鳞片',
    type: ItemType.Material,
    description: '真龙脱落的鳞片，极其珍贵。',
    quantity: 1,
    rarity: '传说',
  },
  {
    id: 'phoenix-feather',
    name: '凤凰羽',
    type: ItemType.Material,
    description: '凤凰的羽毛，蕴含涅槃之力。',
    quantity: 1,
    rarity: '传说',
  },
  {
    id: 'qilin-horn',
    name: '麒麟角',
    type: ItemType.Material,
    description: '麒麟的角，拥有祥瑞之力。',
    quantity: 1,
    rarity: '传说',
  },
  {
    id: 'fairy-fruit',
    name: '仙灵果',
    type: ItemType.Material,
    description: '仙灵树结出的果实，可大幅提升灵宠实力。',
    quantity: 1,
    rarity: '稀有',
  },
  {
    id: 'heaven-earth-treasure',
    name: '天材地宝',
    type: ItemType.Material,
    description: '天地孕育的至宝，极其罕见。',
    quantity: 1,
    rarity: '传说',
  },
  {
    id: 'divine-beast-essence',
    name: '神兽精魄',
    type: ItemType.Material,
    description: '神兽的精魄，蕴含神兽之力。',
    quantity: 1,
    rarity: '传说',
  },
  {
    id: 'chaos-stone',
    name: '混沌石',
    type: ItemType.Material,
    description: '来自混沌的奇石，蕴含创世之力。',
    quantity: 1,
    rarity: '仙品',
  },
  {
    id: 'dao-fragment',
    name: '大道碎片',
    type: ItemType.Material,
    description: '大道法则的碎片，可助灵宠突破极限。',
    quantity: 1,
    rarity: '仙品',
  },
  {
    id: 'fairy-essence',
    name: '仙灵本源',
    type: ItemType.Material,
    description: '仙灵的本源力量，极其珍贵。',
    quantity: 1,
    rarity: '仙品',
  },
  {
    id: 'creation-liquid',
    name: '造化神液',
    type: ItemType.Material,
    description: '造化之力凝聚的神液，可重塑灵宠。',
    quantity: 1,
    rarity: '仙品',
  },
];

// Upgrade Constants
export const UPGRADE_MATERIAL_NAME = '炼器石';
export const UPGRADE_STONE_NAME = '强化石';
export const BASE_UPGRADE_COST_STONES = 50;
export const BASE_UPGRADE_COST_MATS = 2;
export const UPGRADE_STONE_SUCCESS_BONUS = 0.1; // 每颗强化石提高10%成功率

// Returns percentage increase (0.1 = 10%)
export const getUpgradeMultiplier = (rarity: ItemRarity = '普通') => {
  switch (rarity) {
    case '普通':
      return 0.1;
    case '稀有':
      return 0.15;
    case '传说':
      return 0.2;
    case '仙品':
      return 0.25;
    default:
      return 0.1;
  }
};
