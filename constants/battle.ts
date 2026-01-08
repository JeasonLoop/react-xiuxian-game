/**
 * 战斗系统相关常量
 */

import { BattleSkill, BattlePotion, ItemType } from '../types';

// 法宝战斗技能配置
export const ARTIFACT_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // 星辰盘 - 防御和攻击技能
  'artifact-star-disk': [
    {
      id: 'skill-star-shield',
      name: '星辰护盾',
      description: '星辰盘释放护盾，大幅提升防御力。',
      type: 'defense',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'star-shield',
            name: '星辰护盾',
            type: 'defense',
            value: 0.35, // 防御提升从30%提升至35%
            duration: 2,
            source: 'artifact-star-disk',
            description: '防御力提升35%，持续2回合',
          },
        },
      ],
      cost: { mana: 40 }, // 防御技能消耗从20提升至40
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
    },
    {
      id: 'skill-star-burst',
      name: '星辰爆裂',
      description: '星辰盘释放星辰之力，对敌人造成法术伤害。',
      type: 'attack',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      effects: [],
      cost: { mana: 80 }, // 核心攻击技能消耗从40提升至80
      cooldown: 0,
      maxCooldown: 4,
      target: 'enemy',
      damage: {
        base: 45, // 基础伤害从30提升至45
        multiplier: 1.5, // 伤害倍率从1.2提升至1.5
        type: 'magical',
        critChance: 0.20, // 暴击率从0.15提升至0.20
        critMultiplier: 2.2, // 暴击倍率从2.0提升至2.2
      },
    },
  ],
  // 仙灵宝珠 - 强力技能
  'artifact-immortal-bead': [
    {
      id: 'skill-immortal-blessing',
      name: '仙灵祝福',
      description: '仙灵宝珠释放祝福，全面提升属性。',
      type: 'buff',
      source: 'artifact',
      sourceId: 'artifact-immortal-bead',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-attack',
            name: '仙灵攻击',
            type: 'attack',
            value: 0.30, // 攻击提升从25%提升至30%
            duration: 3,
            source: 'artifact-immortal-bead',
            description: '攻击力提升30%，持续3回合',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-defense',
            name: '仙灵防御',
            type: 'defense',
            value: 0.30, // 防御提升从25%提升至30%
            duration: 3,
            source: 'artifact-immortal-bead',
            description: '防御力提升30%，持续3回合',
          },
        },
      ],
      cost: { mana: 100 }, // 高级法宝消耗从50大幅提升至100
      cooldown: 0,
      maxCooldown: 5,
      target: 'self',
    },
  ],
};

// 武器战斗技能配置
export const WEAPON_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // 仙灵剑 - 剑舞技能
  'weapon-immortal-sword': [
    {
      id: 'skill-sword-dance',
      name: '剑舞',
      description: '剑光如舞，连续攻击敌人，造成多次伤害。',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-immortal-sword',
      effects: [],
      cost: { mana: 50 }, // 武器技能消耗从25提升至50
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: {
        base: 55, // 基础伤害从40提升至55
        multiplier: 1.4, // 伤害倍率从1.3提升至1.4
        type: 'physical',
        critChance: 0.25, // 暴击率从0.2提升至0.25
        critMultiplier: 2.2, // 暴击倍率从2.0提升至2.2
      },
    },
  ],
  // 星辰剑 - 星辰斩
  'weapon-star-sword': [
    {
      id: 'skill-star-slash',
      name: '星辰斩',
      description: '引星辰之力入剑，造成高额物理伤害。',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-star-sword',
      effects: [],
      cost: { mana: 70 }, // 高级武器技能消耗从30提升至70
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: {
        base: 80, // 基础伤害从60提升至80
        multiplier: 1.7, // 伤害倍率从1.5提升至1.7
        type: 'physical',
        critChance: 0.30, // 暴击率从0.25提升至0.30
        critMultiplier: 2.5, // 暴击倍率从2.2提升至2.5
      },
    },
  ],
};

// 战斗可用丹药配置
export const BATTLE_POTIONS: Record<string, BattlePotion> = {
  '回血丹': {
    itemId: 'potion-heal-basic',
    name: '回血丹',
    type: 'heal',
    effect: {
      heal: 50,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  '回春丹': {
    itemId: 'potion-heal-advanced',
    name: '回春丹',
    type: 'heal',
    effect: {
      heal: 200,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  '强体丹': {
    itemId: 'potion-strength',
    name: '强体丹',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'strength-boost',
          name: '强体',
          type: 'attack',
          value: 50, // 攻击力+50
          duration: 3,
          source: '强体丹',
          description: '攻击力提升50点，持续3回合',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
  '凝神丹': {
    itemId: 'potion-spirit',
    name: '凝神丹',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'spirit-boost',
          name: '凝神',
          type: 'custom',
          value: 30, // 神识+30（影响法术伤害）
          duration: 3,
          source: '凝神丹',
          description: '神识提升30点，持续3回合',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
};
