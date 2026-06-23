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
