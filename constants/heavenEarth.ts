/**
 * 天地之魄系统相关常量
 * 包含天地之魄BOSS、合道期挑战配置等
 */

import { HeavenEarthSoulBoss, RealmType } from '../types';

// ==================== 合道期挑战系统 ====================

// 天地之魄BOSS数据
export const HEAVEN_EARTH_SOUL_BOSSES: Record<string, HeavenEarthSoulBoss> = {
  'boss_001': {
    id: 'boss_001',
    name: '天罡之魄',
    description: '天地间最纯粹的阳气凝聚而成的强大存在',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 50000,
      defense: 30000,
      hp: 300000,
      spirit: 25000,
      physique: 20000,
      speed: 800
    },
    difficulty: 'easy',
    strengthMultiplier: 1.2,
    specialSkills: [
      {
        id: 'skill_001',
        name: '天罡正气',
        description: '释放纯阳正气，对敌人造成巨大伤害',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_001',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.3
          }
        ],
        cost: { mana: 1000 },
        cooldown: 0,
        maxCooldown: 3,
        target: 'enemy',
        damage: {
          base: 5000,
          multiplier: 2.0,
          type: 'magical',
          critChance: 0.2,
          critMultiplier: 1.8
        }
      }
    ],
    rewards: {
      exp: 500000,
      spiritStones: 100000,
      items: ['item_001', 'item_002'],
      daoCombiningUnlocked: true
    }
  },
  'boss_002': {
    id: 'boss_002',
    name: '地煞之魄',
    description: '大地深处阴煞之气凝聚而成的强大存在',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 60000,
      defense: 35000,
      hp: 400000,
      spirit: 30000,
      physique: 25000,
      speed: 700
    },
    difficulty: 'normal',
    strengthMultiplier: 1.5,
    specialSkills: [
      {
        id: 'skill_002',
        name: '地煞阴风',
        description: '召唤阴风侵蚀敌人，造成持续伤害',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_002',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.2
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.1,
            duration: 3,
            debuffId: 'poison'
          }
        ],
        cost: { mana: 1200 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 4000,
          multiplier: 1.8,
          type: 'magical',
          critChance: 0.15,
          critMultiplier: 2.0
        }
      }
    ],
    rewards: {
      exp: 800000,
      spiritStones: 150000,
      items: ['item_003', 'item_004'],
      daoCombiningUnlocked: true
    }
  },
  'boss_003': {
    id: 'boss_003',
    name: '阴阳之魄',
    description: '阴阳调和，天地平衡的完美化身',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 80000,
      defense: 45000,
      hp: 600000,
      spirit: 40000,
      physique: 35000,
      speed: 900
    },
    difficulty: 'hard',
    strengthMultiplier: 2.0,
    specialSkills: [
      {
        id: 'skill_003',
        name: '阴阳轮回',
        description: '阴阳交替，对敌人造成双重伤害',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_003',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.4
          },
          {
            type: 'buff',
            target: 'self',
            value: 0.2,
            duration: 2,
            buffId: 'attack_boost'
          }
        ],
        cost: { mana: 1500 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 7000,
          multiplier: 2.2,
          type: 'magical',
          critChance: 0.25,
          critMultiplier: 2.2
        }
      }
    ],
    rewards: {
      exp: 1200000,
      spiritStones: 250000,
      items: ['item_005', 'item_006'],
      daoCombiningUnlocked: true
    }
  },
  'boss_004': {
    id: 'boss_004',
    name: '混沌之魄',
    description: '混沌初开时的原始力量凝聚而成',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 100000,
      defense: 60000,
      hp: 800000,
      spirit: 50000,
      physique: 45000,
      speed: 1000
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.0,
    specialSkills: [
      {
        id: 'skill_004',
        name: '混沌爆发',
        description: '释放混沌之力，造成毁灭性伤害',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_004',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.6
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.3,
            duration: 2,
            debuffId: 'defense_down'
          }
        ],
        cost: { mana: 2000 },
        cooldown: 0,
        maxCooldown: 6,
        target: 'enemy',
        damage: {
          base: 10000,
          multiplier: 2.5,
          type: 'magical',
          critChance: 0.3,
          critMultiplier: 2.5
        }
      }
    ],
    rewards: {
      exp: 2000000,
      spiritStones: 500000,
      items: ['item_007', 'item_008'],
      daoCombiningUnlocked: true
    }
  },
  'boss_005': {
    id: 'boss_005',
    name: '星辰之魄',
    description: '九天星辰之力凝聚而成的强大存在，掌控星宿运转',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 120000,
      defense: 70000,
      hp: 1000000,
      spirit: 60000,
      physique: 50000,
      speed: 1100
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.5,
    specialSkills: [
      {
        id: 'skill_005',
        name: '星宿轮转',
        description: '引动星辰之力，对敌人造成持续伤害并降低其速度',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_005',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.5
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.25,
            duration: 3,
            debuffId: 'speed_down'
          }
        ],
        cost: { mana: 2500 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 12000,
          multiplier: 2.8,
          type: 'magical',
          critChance: 0.35,
          critMultiplier: 2.8
        }
      }
    ],
    rewards: {
      exp: 2500000,
      spiritStones: 600000,
      items: ['item_009', 'item_010'],
      daoCombiningUnlocked: true
    }
  },
  'boss_006': {
    id: 'boss_006',
    name: '雷电之魄',
    description: '九天雷霆之力凝聚而成的强大存在，掌控雷电法则',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 90000,
      defense: 55000,
      hp: 700000,
      spirit: 45000,
      physique: 40000,
      speed: 1200
    },
    difficulty: 'hard',
    strengthMultiplier: 2.5,
    specialSkills: [
      {
        id: 'skill_006',
        name: '九天雷劫',
        description: '召唤九天雷劫，对敌人造成巨大伤害并有概率麻痹',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_006',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.55
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.15,
            duration: 2,
            debuffId: 'stun'
          }
        ],
        cost: { mana: 1800 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 9000,
          multiplier: 2.4,
          type: 'magical',
          critChance: 0.3,
          critMultiplier: 2.6
        }
      }
    ],
    rewards: {
      exp: 1500000,
      spiritStones: 350000,
      items: ['item_011', 'item_012'],
      daoCombiningUnlocked: true
    }
  },
  'boss_007': {
    id: 'boss_007',
    name: '冰霜之魄',
    description: '极地寒冰之力凝聚而成的强大存在，掌控冰雪法则',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 85000,
      defense: 65000,
      hp: 900000,
      spirit: 48000,
      physique: 42000,
      speed: 750
    },
    difficulty: 'hard',
    strengthMultiplier: 2.6,
    specialSkills: [
      {
        id: 'skill_007',
        name: '冰封万里',
        description: '释放极寒之力，对敌人造成伤害并大幅降低其行动速度',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_007',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.4
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.4,
            duration: 4,
            debuffId: 'speed_down'
          }
        ],
        cost: { mana: 1600 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 8000,
          multiplier: 2.2,
          type: 'magical',
          critChance: 0.25,
          critMultiplier: 2.4
        }
      }
    ],
    rewards: {
      exp: 1800000,
      spiritStones: 400000,
      items: ['item_013', 'item_014'],
      daoCombiningUnlocked: true
    }
  },
  'boss_008': {
    id: 'boss_008',
    name: '烈焰之魄',
    description: '地心熔岩之力凝聚而成的强大存在，掌控火焰法则',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 110000,
      defense: 50000,
      hp: 750000,
      spirit: 55000,
      physique: 48000,
      speed: 950
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.2,
    specialSkills: [
      {
        id: 'skill_008',
        name: '熔岩爆发',
        description: '引动地心熔岩，对敌人造成毁灭性火焰伤害',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_008',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.65
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.2,
            duration: 3,
            debuffId: 'burn'
          }
        ],
        cost: { mana: 2200 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 11000,
          multiplier: 2.7,
          type: 'magical',
          critChance: 0.32,
          critMultiplier: 2.7
        }
      }
    ],
    rewards: {
      exp: 2200000,
      spiritStones: 550000,
      items: ['item_015', 'item_016'],
      daoCombiningUnlocked: true
    }
  },
  'boss_009': {
    id: 'boss_009',
    name: '风暴之魄',
    description: '天地风暴之力凝聚而成的强大存在，掌控狂风法则',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 95000,
      defense: 58000,
      hp: 850000,
      spirit: 52000,
      physique: 46000,
      speed: 1300
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.1,
    specialSkills: [
      {
        id: 'skill_009',
        name: '狂风怒号',
        description: '召唤天地风暴，对敌人造成连续伤害并提升自身速度',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_009',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.5
          },
          {
            type: 'buff',
            target: 'self',
            value: 0.3,
            duration: 3,
            buffId: 'speed_boost'
          }
        ],
        cost: { mana: 2000 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 9500,
          multiplier: 2.5,
          type: 'magical',
          critChance: 0.28,
          critMultiplier: 2.6
        }
      }
    ],
    rewards: {
      exp: 2100000,
      spiritStones: 520000,
      items: ['item_017', 'item_018'],
      daoCombiningUnlocked: true
    }
  }
};

// 合道期挑战配置
export const DAO_COMBINING_CHALLENGE_CONFIG = {
  requiredRealm: RealmType.SpiritSevering,
  requiredRealmLevel: 9,
  maxBossAttempts: 3, // 每个BOSS最多挑战次数
  bossStrengthMultiplierRange: [0.9, 1.8], // BOSS战斗力浮动范围（缩小范围避免难度极端）
  unlockCondition: {
    // 解锁条件
    mustHaveHeavenEarthMarrow: true,
    mustBeMaxLevel: true,
    mustHaveHighStats: true
  }
};

// ==================== 数值上限保护配置 ====================
// 防止数值无限增长导致游戏失衡

/**
 * 各境界可分配属性点最大值
 * 防止属性点无限累积导致后期数值爆炸
 */
export const MAX_ATTRIBUTE_POINTS_PER_REALM: Record<RealmType, number> = {
  [RealmType.QiRefining]: 5,      // 炼气期最多5点
  [RealmType.Foundation]: 10,     // 筑基期最多10点
  [RealmType.GoldenCore]: 20,     // 金丹期最多20点
  [RealmType.NascentSoul]: 30,    // 元婴期最多30点
  [RealmType.SpiritSevering]: 40, // 化神期最多40点
  [RealmType.DaoCombining]: 50,   // 合道期最多50点
  [RealmType.LongevityRealm]: 60, // 渡劫期最多60点
};

/**
 * 灵根属性最大值
 * 防止灵根无限提高导致功法加成失控
 */
export const MAX_SPIRITUAL_ROOT_VALUE = 100; // 每个灵根最高100点

/**
 * 装备强化等级最大值
 * 防止装备无限强化导致属性膨胀
 */
export const MAX_EQUIPMENT_LEVEL = 20; // 装备最高强化至20级

/**
 * 物品数量上限
 * 防止背包溢出
 */
export const MAX_ITEM_QUANTITY = 9999; // 单种物品最多9999个

/**
 * 单次战斗回合数上限
 * 防止战斗无限进行
 */
export const MAX_BATTLE_ROUNDS = 100; // 战斗最多100回合

/**
 * 物品出售价格上限
 * 防止极端情况下价格溢出
 */
export const MAX_ITEM_SELL_PRICE = 10000000; // 单件物品最高售价1000万灵石
