/**
 * 自创神通系统相关常量与配置
 */

import { RealmType, ArtGrade } from '../types';

export interface SpellEffectValues {
  attackPercent?: number;
  critRate?: number;
  critDamage?: number;
  damageReduction?: number;
  lifeLeech?: number;
  dodgeRate?: number;
  speedPercent?: number;
}

export const CUSTOM_SPELL_CONFIG = {
  // 解锁自创神通的最低境界：金丹期
  minRealm: '金丹期' as RealmType,
  // 领悟基础消耗灵石
  baseSpiritStoneCost: 50000,
  // 领悟基础消耗太虚悟道卷
  baseScrollCost: 1,
  // 各境界自创神通槽位数量
  maxSlotsByRealm: {
    [RealmType.QiRefining]: 0,
    [RealmType.Foundation]: 0,
    [RealmType.GoldenCore]: 1,
    [RealmType.NascentSoul]: 2,
    [RealmType.SpiritSevering]: 3,
    [RealmType.DaoCombining]: 4,
    [RealmType.LongevityRealm]: 5,
  } as Record<RealmType, number>,
  // 升级最高等级
  maxLevel: 10,
  // 每重参悟基础灵石消耗（实际消耗 = base * 1.5^当前重数）
  upgradeBaseCost: 30000,
};

/** 当前境界可参悟的自创神通槽位（未配置境界按0，避免 0||1 误判） */
export function getCustomSpellMaxSlots(realm: RealmType): number {
  return CUSTOM_SPELL_CONFIG.maxSlotsByRealm[realm] ?? 0;
}

/** 自创神通从当前重数提升一重的灵石消耗 */
export function getCustomSpellUpgradeCost(level: number): number {
  return Math.floor(CUSTOM_SPELL_CONFIG.upgradeBaseCost * Math.pow(1.5, level));
}

// 神通前后缀生成词库
export const SPELL_PREFIXES = [
  '九天', '太虚', '万象', '混沌', '玄天', '诛仙', '造化', '紫霄', '纯阳', '太阴',
  '八荒', '乾坤', '幽冥', '寂灭', '罗睺', '天罡', '地煞', '大衍', '无极', '鸿蒙'
];

export const SPELL_ELEMENT_WORDS: Record<string, string[]> = {
  metal: ['庚金', '白虎', '裂空', '锋芒'],
  wood: ['青木', '长生', '回春', '神木'],
  water: ['玄水', '真武', '寒霜', '沧浪'],
  fire: ['炽阳', '朱雀', '离火', '焚天'],
  earth: ['后土', '玄黄', '不动', '崩山'],
  special: ['星罗', '神念', '幻影', '破魔'],
};

export const SPELL_SUFFIXES = [
  '破界引', '斩道决', '真解', '化极典', '神印', '法象', '灭度光', '玄罡印', '无量法', '洞虚诀'
];

/** 根据功法品级计算基础数值强度系数 */
export const ART_GRADE_MULTIPLIER: Record<ArtGrade, number> = {
  '黄': 1.0,
  '玄': 1.35,
  '地': 1.8,
  '天': 2.4,
};
