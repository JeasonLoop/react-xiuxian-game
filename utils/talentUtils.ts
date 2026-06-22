/**
 * 天赋系统工具函数
 */

import { Talent, TalentCategory, FATE_POINTS_TOTAL } from '../types';
import { TALENTS } from '../constants/index';

/** 按ID查找天赋 */
export function getTalentById(id: string): Talent | undefined {
  return TALENTS.find((t) => t.id === id);
}

/** 按类别筛选天赋 */
export function getTalentsByCategory(category: TalentCategory): Talent[] {
  return TALENTS.filter((t) => t.category === category);
}

/** 按稀有度筛选天赋 */
export function getTalentsByRarity(rarity: string): Talent[] {
  return TALENTS.filter((t) => t.rarity === rarity);
}

/** 计算天赋列表的总命运点消耗 */
export function calculateTotalFateCost(talentIds: string[]): number {
  return talentIds.reduce((total, id) => {
    const talent = getTalentById(id);
    return total + (talent?.fateCost || 0);
  }, 0);
}

/** 计算剩余命运点 */
export function getRemainingFatePoints(talentIds: string[]): number {
  return FATE_POINTS_TOTAL - calculateTotalFateCost(talentIds);
}

/** 检查是否可以负担某个天赋 */
export function canAffordTalent(talentId: string, selectedIds: string[]): boolean {
  const talent = getTalentById(talentId);
  if (!talent) return false;
  const remaining = getRemainingFatePoints(selectedIds);
  return talent.fateCost <= remaining;
}

/** 合并多个天赋的属性效果 */
export function combineTalentEffects(talents: Talent[]) {
  return talents.reduce(
    (acc, talent) => {
      if (talent.effects.attack) acc.attack = (acc.attack || 0) + talent.effects.attack;
      if (talent.effects.defense) acc.defense = (acc.defense || 0) + talent.effects.defense;
      if (talent.effects.hp) acc.hp = (acc.hp || 0) + talent.effects.hp;
      if (talent.effects.spirit) acc.spirit = (acc.spirit || 0) + talent.effects.spirit;
      if (talent.effects.physique) acc.physique = (acc.physique || 0) + talent.effects.physique;
      if (talent.effects.speed) acc.speed = (acc.speed || 0) + talent.effects.speed;
      if (talent.effects.expRate) acc.expRate = (acc.expRate || 0) + talent.effects.expRate;
      if (talent.effects.luck) acc.luck = (acc.luck || 0) + talent.effects.luck;
      return acc;
    },
    {} as {
      attack?: number;
      defense?: number;
      hp?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
      expRate?: number;
      luck?: number;
    }
  );
}

/**
 * 随机分配天赋（在预算内尽量用完点数）
 * 高稀有度天赋概率更低
 */
export function randomizeTalents(budget: number): string[] {
  const selected: string[] = [];
  let remaining = budget;
  const available = [...TALENTS];

  // 按稀有度设置权重：普通高概率，仙品低概率
  const rarityWeights: Record<string, number> = {
    '普通': 40,
    '稀有': 30,
    '传说': 20,
    '仙品': 10,
  };

  const pickRandom = (pool: Talent[]): Talent | null => {
    if (pool.length === 0) return null;

    const totalWeight = pool.reduce((sum, t) => sum + (rarityWeights[t.rarity] || 10), 0);
    let roll = Math.random() * totalWeight;
    for (const talent of pool) {
      roll -= rarityWeights[talent.rarity] || 10;
      if (roll <= 0) return talent;
    }
    return pool[pool.length - 1];
  };

  // 仙品天赋最多只能选一个
  let hasImmortal = false;

  while (remaining > 0 && available.length > 0) {
    const affordable = available.filter((t) => {
      if (t.fateCost > remaining) return false;
      // 仙品天赋限制：如果已有仙品天赋，排除其他仙品天赋
      if (hasImmortal && t.rarity === '仙品') return false;
      return true;
    });
    if (affordable.length === 0) break;

    const chosen = pickRandom(affordable);
    if (!chosen) break;

    selected.push(chosen.id);
    remaining -= chosen.fateCost;

    // 标记是否选了仙品天赋
    if (chosen.rarity === '仙品') {
      hasImmortal = true;
    }

    // 从可用池中移除已选天赋
    const idx = available.findIndex((t) => t.id === chosen.id);
    if (idx >= 0) available.splice(idx, 1);
  }

  return selected;
}

/** 获取玩家已选天赋的专属技能列表 */
export function getPlayerSpecialAbilities(talentIds: string[]) {
  return talentIds
    .map((id) => getTalentById(id))
    .filter((t): t is Talent => !!t && !!t.specialAbility)
    .map((t) => ({
      talent: t,
      ability: t.specialAbility!,
    }));
}

/** 获取属性名称的中文显示 */
export function getStatLabel(stat: string): string {
  const labels: Record<string, string> = {
    attack: '攻击',
    defense: '防御',
    hp: '气血',
    spirit: '神识',
    physique: '体魄',
    speed: '速度',
    expRate: '修炼速度',
    luck: '幸运',
  };
  return labels[stat] || stat;
}

/** 获取属性值格式化显示（expRate显示为百分比） */
export function formatStatValue(stat: string, value: number): string {
  if (stat === 'expRate') {
    const pct = Math.round(value * 100);
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }
  return `${value > 0 ? '+' : ''}${value}`;
}
