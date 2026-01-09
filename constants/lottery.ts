/**
 * 抽奖系统相关常量
 * 包含所有抽奖奖品定义
 */

import { LotteryPrize, ItemType, EquipmentSlot, ItemRarity } from '../types'
import { generateLotteryPrizes } from '../utils/itemGenerator';
import { FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from './advanced';
import { ALL_PILL_RECIPES, COMMON_PILLS } from './items';

// --- 丹药常量池 ---
// 从常量池中获取丹药定义，避免硬编码
const PILL_POOL = {
  '聚气丹': COMMON_PILLS.聚气丹(),
  '回春丹': COMMON_PILLS.回春丹(),
  '洗髓丹': COMMON_PILLS.洗髓丹(),
  '筑基丹': COMMON_PILLS.筑基丹(),
  '龙血丹': COMMON_PILLS.龙血丹(),
  '九转金丹': COMMON_PILLS.九转金丹(),
  '延寿丹': COMMON_PILLS.延寿丹(),
  '长生丹': COMMON_PILLS.长生丹(),
  '不死仙丹': COMMON_PILLS.不死仙丹(),
  '洗灵丹': COMMON_PILLS.洗灵丹(),
  '五行灵丹': COMMON_PILLS.五行灵丹(),
  '天灵根丹': COMMON_PILLS.天灵根丹(),
  '凝神丹': COMMON_PILLS.凝神丹(),
  '强体丹': COMMON_PILLS.强体丹(),
  '破境丹': COMMON_PILLS.破境丹(),
  '仙灵丹': COMMON_PILLS.仙灵丹(),
  '天元丹': COMMON_PILLS.天元丹(),
  '结金丹': COMMON_PILLS.结金丹(),
  '凝魂丹': COMMON_PILLS.凝魂丹(),
  '凤凰涅槃丹': COMMON_PILLS.凤凰涅槃丹(),
};

// --- 抽奖系统 ---
export const LOTTERY_PRIZES: LotteryPrize[] = [
  // 普通奖励 - 灵石
  {
    id: 'lottery-stone-10',
    name: '10灵石',
    type: 'spiritStones',
    rarity: '普通',
    weight: 35,
    value: { spiritStones: 10 },
  },
  {
    id: 'lottery-stone-50',
    name: '50灵石',
    type: 'spiritStones',
    rarity: '普通',
    weight: 25,
    value: { spiritStones: 50 },
  },
  {
    id: 'lottery-stone-100',
    name: '100灵石',
    type: 'spiritStones',
    rarity: '稀有',
    weight: 18,
    value: { spiritStones: 100 },
  },
  {
    id: 'lottery-stone-500',
    name: '500灵石',
    type: 'spiritStones',
    rarity: '稀有',
    weight: 8,
    value: { spiritStones: 500 },
  },
  {
    id: 'lottery-stone-1000',
    name: '1000灵石',
    type: 'spiritStones',
    rarity: '传说',
    weight: 3,
    value: { spiritStones: 1000 },
  },

  // 普通奖励 - 修为
  {
    id: 'lottery-exp-50',
    name: '50修为',
    type: 'exp',
    rarity: '普通',
    weight: 30,
    value: { exp: 50 },
  },
  {
    id: 'lottery-exp-200',
    name: '200修为',
    type: 'exp',
    rarity: '普通',
    weight: 20,
    value: { exp: 200 },
  },
  {
    id: 'lottery-exp-500',
    name: '500修为',
    type: 'exp',
    rarity: '稀有',
    weight: 12,
    value: { exp: 500 },
  },
  {
    id: 'lottery-exp-2000',
    name: '2000修为',
    type: 'exp',
    rarity: '传说',
    weight: 4,
    value: { exp: 2000 },
  },

  // 普通奖励 - 丹药（从常量池引用）
  {
    id: 'lottery-pill-qi',
    name: '聚气丹',
    type: 'item',
    rarity: '普通',
    weight: 18,
    value: {
      item: {
        name: '聚气丹',
        type: ItemType.Pill,
        description: PILL_POOL['聚气丹']?.description || '短时间内大幅提升修炼速度',
        quantity: 1,
        rarity: '普通',
        effect: PILL_POOL['聚气丹']?.effect,
        permanentEffect: PILL_POOL['聚气丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-qi-2',
    name: '聚气丹x3',
    type: 'item',
    rarity: '普通',
    weight: 12,
    value: {
      item: {
        name: '聚气丹',
        type: ItemType.Pill,
        description: PILL_POOL['聚气丹']?.description || '短时间内大幅提升修炼速度',
        quantity: 3,
        rarity: '普通',
        effect: PILL_POOL['聚气丹']?.effect,
        permanentEffect: PILL_POOL['聚气丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-heal',
    name: '回春丹',
    type: 'item',
    rarity: '普通',
    weight: 15,
    value: {
      item: {
        name: '回春丹',
        type: ItemType.Pill,
        description: PILL_POOL['回春丹']?.description || '疗伤圣药，大幅恢复气血',
        quantity: 1,
        rarity: '稀有',
        effect: PILL_POOL['回春丹']?.effect,
        permanentEffect: PILL_POOL['回春丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-marrow',
    name: '洗髓丹',
    type: 'item',
    rarity: '稀有',
    weight: 10,
    value: {
      item: {
        name: '洗髓丹',
        type: ItemType.Pill,
        description: PILL_POOL['洗髓丹']?.description || '易筋洗髓，脱胎换骨',
        quantity: 1,
        rarity: '稀有',
        effect: PILL_POOL['洗髓丹']?.effect,
        permanentEffect: PILL_POOL['洗髓丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-foundation',
    name: '筑基丹',
    type: 'item',
    rarity: '稀有',
    weight: 8,
    value: {
      item: {
        name: '筑基丹',
        type: ItemType.Pill,
        description: PILL_POOL['筑基丹']?.description || '增加突破到筑基期的几率',
        quantity: 1,
        rarity: '传说',
        effect: PILL_POOL['筑基丹']?.effect,
        permanentEffect: PILL_POOL['筑基丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-golden',
    name: '结金丹',
    type: 'item',
    rarity: '传说',
    weight: 6,
    value: {
      item: {
        name: '结金丹',
        type: ItemType.Pill,
        description: PILL_POOL['结金丹']?.description || '有助于凝结金丹的珍贵丹药。服用后大幅提升修为，并永久增强神识。',
        quantity: 1,
        rarity: '稀有',
        effect: PILL_POOL['结金丹']?.effect,
        permanentEffect: PILL_POOL['结金丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-soul',
    name: '凝魂丹',
    type: 'item',
    rarity: '传说',
    weight: 4,
    value: {
      item: {
        name: '凝魂丹',
        type: ItemType.Pill,
        description: PILL_POOL['凝魂丹']?.description || '能够凝聚神魂的珍贵丹药。服用后大幅提升修为和神识，并永久增强神魂。',
        quantity: 1,
        rarity: '传说',
        effect: PILL_POOL['凝魂丹']?.effect,
        permanentEffect: PILL_POOL['凝魂丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-dragon',
    name: '龙血丹',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '龙血丹',
        type: ItemType.Pill,
        description: PILL_POOL['龙血丹']?.description || '蕴含一丝真龙之血，服用后气血如龙。大幅增加气血上限。',
        quantity: 1,
        rarity: '传说',
        effect: PILL_POOL['龙血丹']?.effect,
        permanentEffect: PILL_POOL['龙血丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-phoenix',
    name: '凤凰涅槃丹',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '凤凰涅槃丹',
        type: ItemType.Pill,
        description: PILL_POOL['凤凰涅槃丹']?.description || '蕴含凤凰涅槃之力的神丹。服用后获得涅槃重生之力，大幅提升修为和属性。',
        quantity: 1,
        rarity: '传说',
        effect: PILL_POOL['凤凰涅槃丹']?.effect,
        permanentEffect: PILL_POOL['凤凰涅槃丹']?.permanentEffect,
      },
    },
  },
  {
    id: 'lottery-pill-immortal',
    name: '九转金丹',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '九转金丹',
        type: ItemType.Pill,
        description: PILL_POOL['九转金丹']?.description || '传说中的仙丹，能让凡人立地飞升',
        quantity: 1,
        rarity: '仙品',
        effect: PILL_POOL['九转金丹']?.effect,
        permanentEffect: PILL_POOL['九转金丹']?.permanentEffect,
      },
    },
  },

  // 普通奖励 - 材料
  {
    id: 'lottery-material-refining',
    name: '炼器石',
    type: 'item',
    rarity: '普通',
    weight: 16,
    value: {
      item: {
        name: '炼器石',
        type: ItemType.Material,
        description: '用于强化法宝的基础材料',
        quantity: 5,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-refining-2',
    name: '炼器石x10',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '炼器石',
        type: ItemType.Material,
        description: '用于强化法宝的基础材料',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone',
    name: '强化石',
    type: 'item',
    rarity: '稀有',
    weight: 10,
    value: {
      item: {
        name: '强化石',
        type: ItemType.Material,
        description: '提高装备强化成功率的珍贵材料，每颗可提高10%成功率',
        quantity: 1,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone-3',
    name: '强化石x10',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '强化石',
        type: ItemType.Material,
        description: '提高装备强化成功率的珍贵材料，每颗可提高10%成功率',
        quantity: 10,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-spirit',
    name: '灵石碎片',
    type: 'item',
    rarity: '普通',
    weight: 14,
    value: {
      item: {
        name: '灵石碎片',
        type: ItemType.Material,
        description: '破碎的灵石，可用于炼器',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-iron',
    name: '精铁',
    type: 'item',
    rarity: '普通',
    weight: 12,
    value: {
      item: {
        name: '精铁',
        type: ItemType.Material,
        description: '经过提炼的精铁，是炼器的好材料',
        quantity: 5,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-silver',
    name: '秘银',
    type: 'item',
    rarity: '稀有',
    weight: 7,
    value: {
      item: {
        name: '秘银',
        type: ItemType.Material,
        description: '珍贵的炼器材料，能够提升法宝品质',
        quantity: 3,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-dragon-scale',
    name: '龙鳞',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '龙鳞',
        type: ItemType.Material,
        description: '真龙身上的鳞片，是炼制顶级法宝的材料',
        quantity: 1,
        rarity: '传说',
      },
    },
  },
  {
    id: 'lottery-material-herb',
    name: '聚灵草',
    type: 'item',
    rarity: '普通',
    weight: 15,
    value: {
      item: {
        name: '聚灵草',
        type: ItemType.Herb,
        description: '吸收天地灵气的草药',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-herb-2',
    name: '聚灵草x20',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '聚灵草',
        type: ItemType.Herb,
        description: '吸收天地灵气的草药',
        quantity: 20,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-rare',
    name: '紫猴花',
    type: 'item',
    rarity: '稀有',
    weight: 8,
    value: {
      item: {
        name: '紫猴花',
        type: ItemType.Herb,
        description: '炼制洗髓丹的材料',
        quantity: 3,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-snow-lotus',
    name: '雪莲花',
    type: 'item',
    rarity: '稀有',
    weight: 6,
    value: {
      item: {
        name: '雪莲花',
        type: ItemType.Herb,
        description: '生长在极寒之地的灵花，药效极强',
        quantity: 2,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-legend',
    name: '千年人参',
    type: 'item',
    rarity: '传说',
    weight: 4,
    value: {
      item: {
        name: '千年人参',
        type: ItemType.Herb,
        description: '千年灵药，珍贵无比',
        quantity: 2,
        rarity: '传说',
      },
    },
  },
  {
    id: 'lottery-material-phoenix-feather',
    name: '凤凰羽',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '凤凰羽',
        type: ItemType.Material,
        description: '凤凰身上的羽毛，蕴含涅槃之力',
        quantity: 1,
        rarity: '传说',
      },
    },
  },

  // 普通奖励 - 灵宠（提高权重，增加获得概率）
  {
    id: 'lottery-pet-fox',
    name: '灵狐',
    type: 'pet',
    rarity: '普通',
    weight: 20, // 进一步提高权重，增加获得概率
    value: { petId: 'pet-spirit-fox' },
  },
  {
    id: 'lottery-pet-tiger',
    name: '雷虎',
    type: 'pet',
    rarity: '稀有',
    weight: 15, // 进一步提高权重，增加获得概率
    value: { petId: 'pet-thunder-tiger' },
  },
  {
    id: 'lottery-pet-phoenix',
    name: '凤凰',
    type: 'pet',
    rarity: '仙品',
    weight: 6, // 进一步提高权重，增加获得概率
    value: { petId: 'pet-phoenix' },
  },

  // 普通奖励 - 抽奖券
  {
    id: 'lottery-ticket-1',
    name: '1张抽奖券',
    type: 'ticket',
    rarity: '普通',
    weight: 15,
    value: { tickets: 1 },
  },
  {
    id: 'lottery-ticket-3',
    name: '3张抽奖券',
    type: 'ticket',
    rarity: '稀有',
    weight: 6,
    value: { tickets: 3 },
  },
  {
    id: 'lottery-ticket-5',
    name: '5张抽奖券',
    type: 'ticket',
    rarity: '传说',
    weight: 2,
    value: { tickets: 5 },
  },
  // 进阶物品奖励（极稀有）- 使用具体的进阶物品
  // 筑基奇物
  ...Object.values(FOUNDATION_TREASURES).map((treasure) => ({
    id: `lottery-foundation-treasure-${treasure.id}`,
    name: treasure.name,
    type: 'item' as const,
    rarity: treasure.rarity as ItemRarity,
    weight: treasure.rarity === '仙品' ? 0.5 : treasure.rarity === '传说' ? 1.5 : treasure.rarity === '稀有' ? 2 : 3,
    value: {
      item: {
        name: treasure.name,
        type: ItemType.AdvancedItem,
        description: treasure.description,
        quantity: 1,
        rarity: treasure.rarity as ItemRarity,
        advancedItemType: 'foundationTreasure' as const,
        advancedItemId: treasure.id,
      },
    },
  })),
  // 天地精华
  ...Object.values(HEAVEN_EARTH_ESSENCES).map((essence) => ({
    id: `lottery-heaven-earth-essence-${essence.id}`,
    name: essence.name,
    type: 'item' as const,
    rarity: essence.rarity as ItemRarity,
    weight: essence.rarity === '仙品' ? 0.3 : essence.rarity === '传说' ? 1 : essence.rarity === '稀有' ? 1.5 : 2,
    value: {
      item: {
        name: essence.name,
        type: ItemType.AdvancedItem,
        description: essence.description,
        quantity: 1,
        rarity: essence.rarity as ItemRarity,
        advancedItemType: 'heavenEarthEssence' as const,
        advancedItemId: essence.id,
      },
    },
  })),
  // 天地之髓
  ...Object.values(HEAVEN_EARTH_MARROWS).map((marrow) => ({
    id: `lottery-heaven-earth-marrow-${marrow.id}`,
    name: marrow.name,
    type: 'item' as const,
    rarity: marrow.rarity as ItemRarity,
    weight: marrow.rarity === '仙品' ? 0.2 : marrow.rarity === '传说' ? 0.8 : marrow.rarity === '稀有' ? 1.2 : 1.5,
    value: {
      item: {
        name: marrow.name,
        type: ItemType.AdvancedItem,
        description: marrow.description,
        quantity: 1,
        rarity: marrow.rarity as ItemRarity,
        advancedItemType: 'heavenEarthMarrow' as const,
        advancedItemId: marrow.id,
      },
    },
  })),
  // 规则之力
  ...Object.values(LONGEVITY_RULES).map((rule) => ({
    id: `lottery-longevity-rule-${rule.id}`,
    name: rule.name,
    type: 'item' as const,
    rarity: '仙品' as ItemRarity,
    weight: 0.5,
    value: {
      item: {
        name: rule.name,
        type: ItemType.AdvancedItem,
        description: rule.description,
        quantity: 1,
        rarity: '仙品' as ItemRarity,
        advancedItemType: 'longevityRule' as const,
        advancedItemId: rule.id,
      },
    },
  })),
];

// 生成装备奖品（每个品级10件）
const equipmentTypes: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact];
const equipmentRarities: Array<{ rarity: ItemRarity; label: string }> = [
  { rarity: '普通', label: 'common' },
  { rarity: '稀有', label: 'rare' },
  { rarity: '传说', label: 'legend' },
  { rarity: '仙品', label: 'immortal' },
];

equipmentTypes.forEach(type => {
  equipmentRarities.forEach(({ rarity, label }) => {
    const generatedPrizes = generateLotteryPrizes({ type, rarity: rarity as any });
    LOTTERY_PRIZES.push(...generatedPrizes);
  });
});

// 生成丹药奖品（每个品级10件）
const pillRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 15 },
  { rarity: '稀有', weight: 10 },
  { rarity: '传说', weight: 5 },
  { rarity: '仙品', weight: 2 },
];

pillRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Pill, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// 生成草药奖品（每个品级10件）
const herbRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 15 },
  { rarity: '稀有', weight: 10 },
  { rarity: '传说', weight: 5 },
  { rarity: '仙品', weight: 2 },
];

herbRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Herb, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// 生成材料奖品（每个品级10件）
const materialRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 20 },
  { rarity: '稀有', weight: 12 },
  { rarity: '传说', weight: 6 },
  { rarity: '仙品', weight: 3 },
];

materialRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Material, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});