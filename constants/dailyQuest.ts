/**
 * 日常任务系统相关常量
 */

import { DailyQuestType, ItemRarity, RealmType, Recipe } from '../types';
import { RARITY_MULTIPLIERS } from './items';
import { REALM_ORDER } from './realms';

// 日常任务类型配置
export interface DailyQuestConfig {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number }; // 目标数量范围
  rewardMultiplier: number; // 奖励倍率（根据目标数量调整）
}

// 日常任务配置（根据类型，只包含基础类型）
export const DAILY_QUEST_CONFIGS: Partial<Record<DailyQuestType, Omit<DailyQuestConfig, 'targetRange'>>> = {
  meditate: {
    type: 'meditate',
    name: '打坐修炼',
    description: '完成指定次数的打坐修炼',
    rewardMultiplier: 1.0,
  },
  adventure: {
    type: 'adventure',
    name: '历练冒险',
    description: '完成指定次数的历练',
    rewardMultiplier: 1.2,
  },
  breakthrough: {
    type: 'breakthrough',
    name: '境界突破',
    description: '完成指定次数的境界突破',
    rewardMultiplier: 2.0,
  },
  alchemy: {
    type: 'alchemy',
    name: '炼制丹药',
    description: '炼制指定数量的丹药',
    rewardMultiplier: 1.5,
  },
  equip: {
    type: 'equip',
    name: '装备强化',
    description: '强化指定次数的装备',
    rewardMultiplier: 1.3,
  },
  pet: {
    type: 'pet',
    name: '灵宠培养',
    description: '喂养或进化灵宠指定次数',
    rewardMultiplier: 1.4,
  },
  sect: {
    type: 'sect',
    name: '宗门任务',
    description: '完成指定次数的宗门任务',
    rewardMultiplier: 1.6,
  },
  realm: {
    type: 'realm',
    name: '秘境探索',
    description: '探索指定次数的秘境',
    rewardMultiplier: 1.8,
  },
};

// 任务目标数量范围（根据类型）
export const DAILY_QUEST_TARGET_RANGES: Record<DailyQuestType, { min: number; max: number }> = {
  meditate: { min: 3, max: 8 }, // 打坐：3-8次，比较轻松
  adventure: { min: 3, max: 10 }, // 历练：3-10次，适中
  breakthrough: { min: 0, max: 1 }, // 境界突破：0-1次（0表示不出现，1表示最多1次），因为突破需要积累修为
  alchemy: { min: 2, max: 6 }, // 炼丹：2-6次，适中
  equip: { min: 1, max: 3 }, // 装备强化：1-3次，适中
  pet: { min: 1, max: 3 }, // 灵宠培养：1-3次，适中
  sect: { min: 2, max: 5 }, // 宗门任务：2-5次，适中
  realm: { min: 1, max: 3 }, // 秘境探索：1-3次，适中
  kill: { min: 5, max: 20 }, // 击败敌人：5-20次（AI生成）
  collect: { min: 3, max: 10 }, // 收集物品：3-10次（AI生成）
  learn: { min: 1, max: 3 }, // 学习功法：1-3次（AI生成）
  other: { min: 1, max: 5 }, // 其他任务：1-5次（AI生成）
};

/**
 * 根据境界计算奖励倍数
 * @param realm 境界类型
 * @param realmLevel 境界等级（1-9）
 * @returns 奖励倍数
 */
const calculateRealmMultiplier = (realm: RealmType, realmLevel: number): number => {
  const realmIndex = REALM_ORDER.indexOf(realm);
  if (realmIndex === -1) return 1; // 未知境界，返回1倍

  // 验证境界等级范围（1-9）
  const validLevel = Math.max(1, Math.min(9, realmLevel));

  // 基础倍数：每个境界增加 0.5 倍
  // 炼气期(0) = 1.0，筑基期(1) = 1.5，金丹期(2) = 2.0，元婴期(3) = 2.5，化神期(4) = 3.0，合道期(5) = 3.5，长生期(6) = 4.0
  const baseMultiplier = 1 + realmIndex * 0.5;

  // 境界等级加成：每级增加 0.15 倍
  // 1级 = 1.0，2级 = 1.15，3级 = 1.3，...，9级 = 2.2
  const levelMultiplier = 1 + (validLevel - 1) * 0.15;

  return baseMultiplier * levelMultiplier;
};

// 根据稀有度和境界计算奖励
export const calculateDailyQuestReward = (
  type: DailyQuestType,
  target: number,
  rarity: ItemRarity,
  realm?: RealmType,
  realmLevel?: number
): {
  exp?: number;
  spiritStones?: number;
  lotteryTickets?: number;
} => {
  const config = DAILY_QUEST_CONFIGS[type];
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

  // 计算境界倍数（如果提供了境界信息）
  const realmMultiplier = realm && realmLevel
    ? calculateRealmMultiplier(realm, realmLevel)
    : 1;

  const baseReward = target * config.rewardMultiplier * rarityMultiplier * realmMultiplier;

  // 根据任务类型分配奖励
  switch (type) {
    case 'meditate':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
    case 'adventure':
      return {
        exp: Math.floor(baseReward * 30),
        spiritStones: Math.floor(baseReward * 15),
        lotteryTickets: rarity === '仙品' ? 1 : 0,
      };
    case 'breakthrough':
      return {
        exp: Math.floor(baseReward * 100),
        spiritStones: Math.floor(baseReward * 50),
        lotteryTickets: rarity === '传说' || rarity === '仙品' ? 1 : 0,
      };
    case 'alchemy':
      return {
        exp: Math.floor(baseReward * 25),
        spiritStones: Math.floor(baseReward * 20),
      };
    case 'equip':
      return {
        exp: Math.floor(baseReward * 15),
        spiritStones: Math.floor(baseReward * 30),
      };
    case 'pet':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 15),
      };
    case 'sect':
      return {
        exp: Math.floor(baseReward * 40),
        spiritStones: Math.floor(baseReward * 25),
        lotteryTickets: rarity === '仙品' ? 1 : 0,
      };
    case 'realm':
      return {
        exp: Math.floor(baseReward * 50),
        spiritStones: Math.floor(baseReward * 40),
        lotteryTickets: rarity === '传说' || rarity === '仙品' ? 1 : 0,
      };
    default:
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
  }
};

// 生成日常任务稀有度（概率分布）
export const generateDailyQuestRarity = (): ItemRarity => {
  const rand = Math.random();
  if (rand < 0.5) return '普通';
  if (rand < 0.8) return '稀有';
  if (rand < 0.95) return '传说';
  return '仙品';
};

// 30个预定义的日常任务模板
export interface PredefinedDailyQuest {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number };
  rarity: ItemRarity; // 固定稀有度
}

export const PREDEFINED_DAILY_QUESTS: PredefinedDailyQuest[] = [
  // 打坐修炼类 (5个)
  { type: 'meditate', name: '晨光吐纳', description: '在清晨完成打坐修炼，吸收天地灵气', targetRange: { min: 3, max: 6 }, rarity: '普通' },
  { type: 'meditate', name: '静心修炼', description: '静心打坐，提升修为', targetRange: { min: 4, max: 8 }, rarity: '普通' },
  { type: 'meditate', name: '月夜冥想', description: '在月夜下进行深度冥想', targetRange: { min: 5, max: 8 }, rarity: '稀有' },
  { type: 'meditate', name: '九转金丹', description: '通过打坐修炼，凝练金丹', targetRange: { min: 6, max: 10 }, rarity: '传说' },
  { type: 'meditate', name: '大道归一', description: '参悟大道，达到天人合一', targetRange: { min: 8, max: 12 }, rarity: '仙品' },

  // 历练冒险类 (5个)
  { type: 'adventure', name: '除魔卫道', description: '外出历练，斩妖除魔', targetRange: { min: 3, max: 7 }, rarity: '普通' },
  { type: 'adventure', name: '探索未知', description: '探索未知区域，寻找机缘', targetRange: { min: 4, max: 8 }, rarity: '普通' },
  { type: 'adventure', name: '历练红尘', description: '在红尘中历练，提升心境', targetRange: { min: 5, max: 10 }, rarity: '稀有' },
  { type: 'adventure', name: '除魔大业', description: '完成除魔大业，维护正道', targetRange: { min: 6, max: 12 }, rarity: '传说' },
  { type: 'adventure', name: '仙路争锋', description: '在仙路上争锋，证明实力', targetRange: { min: 8, max: 15 }, rarity: '仙品' },

  // 境界突破类 (3个)
  { type: 'breakthrough', name: '突破瓶颈', description: '突破当前境界的瓶颈', targetRange: { min: 1, max: 1 }, rarity: '稀有' },
  { type: 'breakthrough', name: '境界飞升', description: '完成境界的飞升突破', targetRange: { min: 1, max: 1 }, rarity: '传说' },
  { type: 'breakthrough', name: '破境成仙', description: '破境成仙，踏上仙路', targetRange: { min: 1, max:  1 }, rarity: '仙品' },

  // 炼制丹药类 (4个)
  { type: 'alchemy', name: '丹道初学', description: '炼制基础丹药，学习丹道', targetRange: { min: 2, max: 5 }, rarity: '普通' },
  { type: 'alchemy', name: '炼制灵丹', description: '炼制灵丹妙药，提升修为', targetRange: { min: 3, max: 6 }, rarity: '稀有' },
  { type: 'alchemy', name: '丹道大师', description: '炼制高级丹药，展现丹道造诣', targetRange: { min: 4, max: 8 }, rarity: '传说' },
  { type: 'alchemy', name: '仙丹炼制', description: '炼制传说中的仙丹', targetRange: { min: 5, max: 10 }, rarity: '仙品' },

  // 装备强化类 (3个)
  { type: 'equip', name: '强化装备', description: '强化装备，提升实力', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'equip', name: '精炼法宝', description: '精炼法宝，增强威力', targetRange: { min: 2, max: 4 }, rarity: '稀有' },
  { type: 'equip', name: '祭炼神兵', description: '祭炼神兵利器，打造至宝', targetRange: { min: 3, max: 5 }, rarity: '传说' },

  // 灵宠培养类 (3个)
  { type: 'pet', name: '喂养灵宠', description: '喂养灵宠，提升其修为', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'pet', name: '灵宠进化', description: '帮助灵宠完成进化', targetRange: { min: 1, max: 2 }, rarity: '稀有' },
  { type: 'pet', name: '仙兽培养', description: '培养仙兽，培养强大伙伴', targetRange: { min: 2, max: 4 }, rarity: '传说' },

  // 宗门任务类 (3个)
  { type: 'sect', name: '宗门任务', description: '完成宗门分配的任务', targetRange: { min: 2, max: 5 }, rarity: '普通' },
  { type: 'sect', name: '宗门贡献', description: '为宗门做出贡献，提升地位', targetRange: { min: 3, max: 6 }, rarity: '稀有' },
  { type: 'sect', name: '宗门试炼', description: '完成宗门试炼，证明实力', targetRange: { min: 4, max: 8 }, rarity: '传说' },

  // 秘境探索类 (4个)
  { type: 'realm', name: '探索秘境', description: '探索神秘秘境，寻找机缘', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'realm', name: '秘境寻宝', description: '在秘境中寻找珍贵宝物', targetRange: { min: 2, max: 4 }, rarity: '稀有' },
  { type: 'realm', name: '古墓探秘', description: '探索古墓，寻找传承', targetRange: { min: 3, max: 5 }, rarity: '传说' },
  { type: 'realm', name: '仙府探索', description: '探索仙府遗迹，获得仙缘', targetRange: { min: 4, max: 6 }, rarity: '仙品' },
];
