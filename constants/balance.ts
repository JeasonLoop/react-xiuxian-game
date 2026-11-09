import { AdventureType, DifficultyMode, ItemRarity } from '../types';

type DifficultyBalance = {
  enemyPower: number;
  battleChance: number;
  reward: number;
  skippedBattleReward: number;
};

type AdventureBalance = {
  enemyPower: number;
  battleChance: number;
  reward: number;
};

export const GAME_BALANCE = {
  difficulty: {
    easy: {
      enemyPower: 0.9,
      battleChance: 0.85,
      reward: 0.95,
      skippedBattleReward: 0.75,
    },
    normal: {
      enemyPower: 1,
      battleChance: 1,
      reward: 1,
      skippedBattleReward: 0.65,
    },
    hard: {
      enemyPower: 1.15,
      battleChance: 1.15,
      reward: 1.1,
      skippedBattleReward: 0.5,
    },
  } satisfies Record<DifficultyMode, DifficultyBalance>,

  adventure: {
    normal: { enemyPower: 1, battleChance: 1, reward: 1 },
    lucky: { enemyPower: 0.9, battleChance: 0.9, reward: 1.15 },
    secret_realm: { enemyPower: 1, battleChance: 1.1, reward: 1.2 },
    sect_challenge: { enemyPower: 1.1, battleChance: 1, reward: 1 },
    dao_combining_challenge: { enemyPower: 1.2, battleChance: 1, reward: 1 },
  } satisfies Record<AdventureType, AdventureBalance>,
  equipmentUpgrade: {
    minGrowth: 0.015,
    tierFactor: [
      { maxLevel: 5, factor: 1 },
      { maxLevel: 10, factor: 0.55 },
      { maxLevel: 15, factor: 0.32 },
      { maxLevel: Infinity, factor: 0.18 },
    ],
  },

  meditation: {
    autoIntervalMs: 1500,
    autoStoneMultiplier: 0.4,
    autoEnlightenmentChance: 0.002,
    autoDailyEnlightenmentCap: 3,
    manualEnlightenmentChance: 0.01,
    enlightenmentMin: 3,
    enlightenmentMax: 5,
  },

  hunt: {
    encounterChance: 0.3,
    levelUpHours: 24,
    maxLevel: 3,
    durationDays: 7,
  },
  dailyQuest: {
    countMin: 5,
    countMax: 8,
    coreTypes: ['meditate', 'adventure', 'sect', 'alchemy', 'pet'] as const,
  },

  autoAdventure: {
    settleDelayMs: 0,
    cooldown: 1,
  },
} as const;

export const EQUIPMENT_UPGRADE_BASE_GROWTH: Record<ItemRarity, number> = {
  普通: 0.08,
  稀有: 0.11,
  传说: 0.14,
  仙品: 0.17,
};

export const getDifficultyBalance = (
  difficulty: DifficultyMode = 'normal'
): DifficultyBalance => GAME_BALANCE.difficulty[difficulty] || GAME_BALANCE.difficulty.normal;

export const getAdventureBalance = (
  adventureType: AdventureType = 'normal'
): AdventureBalance => GAME_BALANCE.adventure[adventureType] || GAME_BALANCE.adventure.normal;

export const getEquipmentUpgradeGrowth = (
  rarity: ItemRarity = '普通',
  currentLevel = 0
): number => {
  const baseGrowth = EQUIPMENT_UPGRADE_BASE_GROWTH[rarity] || EQUIPMENT_UPGRADE_BASE_GROWTH.普通;
  const nextLevel = currentLevel + 1;
  const tier = GAME_BALANCE.equipmentUpgrade.tierFactor.find((item) => nextLevel <= item.maxLevel);
  const factor = tier?.factor ?? 1;
  return Math.max(GAME_BALANCE.equipmentUpgrade.minGrowth, baseGrowth * factor);
};

/**
 * 词条总量软上限：攻/防/血百分比词条跨装备累加后，
 * 超出上限的部分收益减半（不截断）：effective = cap + (total - cap) / 2
 */
export const EQUIP_PERCENT_SOFT_CAP = {
  attack: 0.5, // 攻击百分比词条软上限（50%）
  defense: 0.5, // 防御百分比词条软上限（50%）
  hp: 0.5, // 气血百分比词条软上限（50%）
} as const;

/**
 * 转世修炼速度加成：每转世一次 +10%，累计上限 +70%。
 * 与 RebirthModal 展示口径一致：bonus = min(perRebirth × rebirthCount, max)
 */
export const REBIRTH_EXP_BONUS = {
  perRebirth: 0.1, // 每次转世的修炼速度加成
  max: 0.7, // 累计加成上限
} as const;

/**
 * 抽奖重复补偿：补偿灵石 = 基础值 × 境界系数。
 * 境界系数 = 1 + 境界序号 × realmFactorStep（炼气 1× → 长生境 13×），
 * 使后期重复补偿随境界放大，同时避免固定赔率成为主要灵石产出渠道。
 */
export const LOTTERY_DUPLICATE_COMPENSATION = {
  petBase: 8000, // 灵宠重复补偿基础灵石
  petMin: 2000, // 灵宠补偿下限
  artBase: { 天: 12000, 地: 5000, 玄: 2000, 黄: 800 } as Record<string, number>, // 功法重复补偿基础值（按品级）
  artMin: 500, // 功法补偿下限
  realmFactorStep: 2, // 每个大境界序号叠加的放大系数
} as const;

/** 抽奖重复补偿的境界系数：1 + 境界序号 × 2 */
export const getLotteryDuplicateRealmFactor = (realmIndex: number): number =>
  1 + Math.max(0, realmIndex) * LOTTERY_DUPLICATE_COMPENSATION.realmFactorStep;

/**
 * 传承石售价：50000 × 8^境界序号，随当前境界指数放大，
 * 保证金丹期以上使用传承石的成本明显高于正常修炼时间成本。
 */
export const INHERITANCE_STONE_PRICE = {
  base: 50000, // 炼气期（序号 0）基础售价
  realmExponent: 8, // 每个大境界序号乘放的倍数
} as const;

/** 传承石售价（按境界序号指数放大） */
export const getInheritanceStonePrice = (realmIndex: number): number =>
  INHERITANCE_STONE_PRICE.base *
  Math.pow(INHERITANCE_STONE_PRICE.realmExponent, Math.max(0, realmIndex));
