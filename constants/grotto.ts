/**
 * 洞府系统相关常量
 * 包含洞府配置、可种植灵草、聚灵阵增强、药园奖励等
 */

import { GrottoConfig, RealmType, ItemRarity } from '../types'

// 洞府配置
export const GROTTO_CONFIGS: GrottoConfig[] = [
  {
    level: 1,
    name: '简陋洞府',
    cost: 500,
    expRateBonus: 0.05, // 5%修炼速度加成
    autoHarvest: false, // 不支持自动收获
    growthSpeedBonus: 0.0, // 无生长速度加成
    maxHerbSlots: 1, // 1个种植槽位
    description: '一处简陋的洞府，灵气稀薄，但聊胜于无。',
  },
  {
    level: 2,
    name: '普通洞府',
    cost: 2000,
    expRateBonus: 0.10, // 10%修炼速度加成
    autoHarvest: false, // 不支持自动收获
    growthSpeedBonus: 0.05, // 5%生长速度加成（减少5%生长时间）
    maxHerbSlots: 2, // 2个种植槽位
    description: '一处普通的洞府，灵气尚可，适合低阶修士修炼。',
  },
  {
    level: 3,
    name: '精良洞府',
    cost: 8000,
    expRateBonus: 0.15, // 15%修炼速度加成
    autoHarvest: false, // 不支持自动收获
    growthSpeedBonus: 0.10, // 10%生长速度加成
    maxHerbSlots: 3, // 3个种植槽位
    description: '一处精良的洞府，灵气浓郁，修炼事半功倍。',
  },
  {
    level: 4,
    name: '上等洞府',
    cost: 25000,
    expRateBonus: 0.20, // 20%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.15, // 15%生长速度加成
    maxHerbSlots: 4, // 4个种植槽位
    realmRequirement: RealmType.Foundation,
    description: '一处上等的洞府，灵气充沛，聚灵阵效果显著，可自动收获灵草。',
  },
  {
    level: 5,
    name: '优质洞府',
    cost: 70000,
    expRateBonus: 0.25, // 25%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.20, // 20%生长速度加成
    maxHerbSlots: 5, // 5个种植槽位
    realmRequirement: RealmType.GoldenCore,
    description: '一处优质的洞府，灵气如雾，修炼速度大幅提升，灵草生长更快。',
  },
  {
    level: 6,
    name: '极品洞府',
    cost: 200000,
    expRateBonus: 0.30, // 30%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.25, // 25%生长速度加成
    maxHerbSlots: 6, // 6个种植槽位
    realmRequirement: RealmType.NascentSoul,
    description: '一处极品的洞府，灵气化液，是修炼的绝佳场所，灵草生长速度大幅提升。',
  },
  {
    level: 7,
    name: '仙品洞府',
    cost: 600000,
    expRateBonus: 0.35, // 35%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.30, // 30%生长速度加成
    maxHerbSlots: 8, // 8个种植槽位
    realmRequirement: RealmType.SpiritSevering,
    description: '一处仙品洞府，灵气如海，聚灵阵威力惊人，灵草生长极快。',
  },
  {
    level: 8,
    name: '天品洞府',
    cost: 1800000,
    expRateBonus: 0.40, // 40%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.35, // 35%生长速度加成
    maxHerbSlots: 10, // 10个种植槽位
    realmRequirement: RealmType.DaoCombining,
    description: '一处天品洞府，灵气如潮，修炼如鱼得水，灵草生长速度惊人。',
  },
  {
    level: 9,
    name: '圣品洞府',
    cost: 5000000,
    expRateBonus: 0.45, // 45%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.40, // 40%生长速度加成
    maxHerbSlots: 12, // 12个种植槽位
    realmRequirement: RealmType.LongevityRealm,
    description: '一处圣品洞府，灵气如龙，是修仙者的圣地，灵草生长速度达到极致。',
  },
  {
    level: 10,
    name: '神品洞府',
    cost: 15000000,
    expRateBonus: 0.50, // 50%修炼速度加成
    autoHarvest: true, // 支持自动收获
    growthSpeedBonus: 0.50, // 50%生长速度加成（减少一半生长时间）
    maxHerbSlots: 15, // 15个种植槽位
    realmRequirement: RealmType.LongevityRealm,
    description: '一处神品洞府，灵气如天，修炼速度达到极致，灵草生长速度翻倍。',
  },
];

// 可种植的灵草配置
// 根据稀有度设置洞府等级要求：普通->1级，稀有->3级，传说->5级，仙品->6级
export const PLANTABLE_HERBS = [
  // 普通品质 - 需要1级洞府
  { id: 'spirit-grass', name: '聚灵草', growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'healing-herb', name: '止血草', growthTime: 30 * 60 * 1000, harvestQuantity: { min: 3, max: 6 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'qi-restoring-herb', name: '回气草', growthTime: 45 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'green-grass', name: '青草', growthTime: 20 * 60 * 1000, harvestQuantity: { min: 3, max: 7 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'white-flower', name: '白花', growthTime: 25 * 60 * 1000, harvestQuantity: { min: 2, max: 6 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'yellow-essence', name: '黄精', growthTime: 40 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: '普通' as ItemRarity, grottoLevelRequirement: 1 },
  // 稀有品质 - 需要3级洞府
  { id: 'spirit-concentrating-flower', name: '凝神花', growthTime: 2 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'blood-ginseng', name: '血参', growthTime: 2.5 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'purple-monkey-flower', name: '紫猴花', growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'spirit-fruit', name: '天灵果', growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'dragon-scale-fruit', name: '龙鳞果', growthTime: 4 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'millennium-ginseng', name: '千年人参', growthTime: 4 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '稀有' as ItemRarity, grottoLevelRequirement: 3 },
  // 传说品质 - 需要5级洞府
  { id: 'millennium-lingzhi', name: '千年灵芝', growthTime: 6 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '传说' as ItemRarity, grottoLevelRequirement: 5 },
  { id: 'nine-leaf-grass', name: '九叶芝草', growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '传说' as ItemRarity, grottoLevelRequirement: 5 },
  { id: 'ten-thousand-year-spirit-milk', name: '万年灵乳', growthTime: 10 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '传说' as ItemRarity, grottoLevelRequirement: 5 },
  // 仙品品质 - 需要6级洞府
  { id: 'ten-thousand-year-immortal-grass', name: '万年仙草', growthTime: 12 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '仙品' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'nine-returning-soul-grass', name: '九转还魂草', growthTime: 15 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '仙品' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'void-immortal-grass', name: '太虚仙草', growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '仙品' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'chaos-green-lotus', name: '混沌青莲', growthTime: 24 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '仙品' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'creation-immortal-grass', name: '造化仙草', growthTime: 20 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: '仙品' as ItemRarity, grottoLevelRequirement: 6 },
];

// 聚灵阵改造配置
export interface SpiritArrayEnhancementConfig {
  id: string;
  name: string; // 改造名称
  description: string; // 描述
  materials: Array<{ name: string; quantity: number }>; // 所需材料
  expRateBonus: number; // 增加的修炼速度加成（例如0.05表示5%）
  maxLevel?: number; // 最大改造等级（可选，如果存在则可以多次改造）
  grottoLevelRequirement: number; // 需要的洞府等级
}

export const SPIRIT_ARRAY_ENHANCEMENTS: SpiritArrayEnhancementConfig[] = [
  {
    id: 'enhancement-basic',
    name: '基础聚灵阵改造',
    description: '使用普通材料加强聚灵阵，提升修炼速度。',
    materials: [
      { name: '聚灵草', quantity: 10 },
      { name: '炼器石', quantity: 5 },
    ],
    expRateBonus: 0.05, // 5%加成
    grottoLevelRequirement: 1,
  },
  {
    id: 'enhancement-advanced',
    name: '高级聚灵阵改造',
    description: '使用稀有材料强化聚灵阵，大幅提升修炼速度。',
    materials: [
      { name: '紫猴花', quantity: 5 },
      { name: '天灵果', quantity: 3 },
      { name: '炼器石', quantity: 10 },
    ],
    expRateBonus: 0.10, // 10%加成
    grottoLevelRequirement: 3,
  },
  {
    id: 'enhancement-legendary',
    name: '传说聚灵阵改造',
    description: '使用传说材料升级聚灵阵，修炼速度大幅提升。',
    materials: [
      { name: '九叶芝草', quantity: 3 },
      { name: '万年灵乳', quantity: 2 },
      { name: '炼器石', quantity: 20 },
    ],
    expRateBonus: 0.15, // 15%加成
    grottoLevelRequirement: 5,
  },
  {
    id: 'enhancement-immortal',
    name: '仙品聚灵阵改造',
    description: '使用仙品材料完美改造聚灵阵，修炼速度达到极致。',
    materials: [
      { name: '混沌青莲', quantity: 2 },
      { name: '万年仙草', quantity: 2 },
      { name: '炼器石', quantity: 30 },
    ],
    expRateBonus: 0.20, // 20%加成
    grottoLevelRequirement: 6,
  },
];

// 灵草图鉴奖励配置
export interface HerbariumReward {
  herbCount: number; // 收集的灵草种类数量
  reward: {
    exp?: number;
    spiritStones?: number;
    attributePoints?: number;
    title?: string;
  };
}

export const HERBARIUM_REWARDS: HerbariumReward[] = [
  { herbCount: 5, reward: { exp: 1000, spiritStones: 500 } },
  { herbCount: 10, reward: { exp: 5000, spiritStones: 2000, attributePoints: 1 } },
  { herbCount: 15, reward: { exp: 10000, spiritStones: 5000, attributePoints: 2 } },
  { herbCount: 20, reward: { exp: 20000, spiritStones: 10000, attributePoints: 3, title: '灵草收集者' } },
  { herbCount: 25, reward: { exp: 50000, spiritStones: 25000, attributePoints: 5, title: '灵草大师' } },
];

// 灵草变异配置
export const HERB_MUTATION_CONFIG = {
  baseMutationChance: 0.05, // 基础变异概率 5%
  grottoLevelBonus: 0.01, // 每级洞府增加1%变异概率
  maxMutationChance: 0.25, // 最大变异概率 25%
  mutationBonusRange: { min: 1.5, max: 3.0 }, // 变异加成倍数范围
  quantityMultiplier: { min: 1.2, max: 2.0 }, // 变异灵草数量倍数
};

// 时间加速配置
export const SPEEDUP_CONFIG = {
  dailyLimit: 10, // 每日加速次数限制
  costPerMinute: 10, // 每分钟消耗的灵石数量
  minCost: 100, // 最低消耗（即使时间很短）
};