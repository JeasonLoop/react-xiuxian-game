/**
 * 万宝仙炉 · 装备洗炼系统配置
 */
import { ItemRarity } from '../types';

export type ReforgeAffixType =
  | 'attackPercent'
  | 'defensePercent'
  | 'hpPercent'
  | 'critRate'
  | 'critDamage'
  | 'dodgeRate'
  | 'lifeLeech';

export interface ReforgeAffixDefinition {
  type: ReforgeAffixType;
  name: string;
  unit: string;
  isPercent: boolean;
  color: string;
  desc: string;
}

export const REFORGE_AFFIX_DEFINITIONS: Record<ReforgeAffixType, ReforgeAffixDefinition> = {
  attackPercent: {
    type: 'attackPercent',
    name: '锋芒',
    unit: '%',
    isPercent: true,
    color: 'text-red-400',
    desc: '提升总攻击力百分比',
  },
  defensePercent: {
    type: 'defensePercent',
    name: '玄甲',
    unit: '%',
    isPercent: true,
    color: 'text-blue-400',
    desc: '提升总防御力百分比',
  },
  hpPercent: {
    type: 'hpPercent',
    name: '长生',
    unit: '%',
    isPercent: true,
    color: 'text-emerald-400',
    desc: '提升总气血上限百分比',
  },
  critRate: {
    type: 'critRate',
    name: '天煞',
    unit: '%',
    isPercent: true,
    color: 'text-amber-400',
    desc: '提升会心一击几率',
  },
  critDamage: {
    type: 'critDamage',
    name: '裂魄',
    unit: '%',
    isPercent: true,
    color: 'text-orange-400',
    desc: '提升会心一击伤害倍率',
  },
  dodgeRate: {
    type: 'dodgeRate',
    name: '幻影',
    unit: '%',
    isPercent: true,
    color: 'text-purple-400',
    desc: '提升身法闪避几率',
  },
  lifeLeech: {
    type: 'lifeLeech',
    name: '噬灵',
    unit: '%',
    isPercent: true,
    color: 'text-rose-400',
    desc: '造成的伤害按比例吸取气血',
  },
};

export const REFORGE_AFFIX_TYPES: ReforgeAffixType[] = [
  'attackPercent',
  'defensePercent',
  'hpPercent',
  'critRate',
  'critDamage',
  'dodgeRate',
  'lifeLeech',
];

export interface ReforgeRarityConfig {
  minAffixes: number;
  maxAffixes: number;
  minValue: number; // 如 0.02
  maxValue: number; // 如 0.06
}

export const REFORGE_RARITY_CONFIGS: Record<ItemRarity, ReforgeRarityConfig> = {
  '普通': {
    minAffixes: 1,
    maxAffixes: 1,
    minValue: 0.02,
    maxValue: 0.05,
  },
  '稀有': {
    minAffixes: 1,
    maxAffixes: 2,
    minValue: 0.05,
    maxValue: 0.10,
  },
  '传说': {
    minAffixes: 2,
    maxAffixes: 3,
    minValue: 0.08,
    maxValue: 0.15,
  },
  '仙品': {
    minAffixes: 3,
    maxAffixes: 3,
    minValue: 0.12,
    maxValue: 0.22,
  },
};

/** 计算装备单次洗炼的消耗 */
export function getReforgeCost(reforgeCount = 0): {
  stones: number;
  spiritStones: number;
} {
  const stones = 1 + Math.floor(reforgeCount / 5);
  const spiritStones = 500 + Math.min(10000, reforgeCount * 250);
  return { stones, spiritStones };
}
