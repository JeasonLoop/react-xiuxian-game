/**
 * 自创神通业务服务层
 * 负责两门心法功法的道蕴熔炼、神通生成、道法强化与属性加成计算
 */

import { PlayerStats, CultivationArt, CustomSpell } from '../types';
import {
  CUSTOM_SPELL_CONFIG,
  SPELL_PREFIXES,
  SPELL_SUFFIXES,
  ART_GRADE_MULTIPLIER,
  SpellEffectValues,
  getCustomSpellMaxSlots,
  getCustomSpellUpgradeCost,
} from '../constants/customSpell';
import { CULTIVATION_ARTS, REALM_ORDER } from '../constants/index';

/** 随机选取数组元素 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 生成自创神通名称 */
export function generateDefaultCustomSpellName(art1: CultivationArt, art2: CultivationArt): string {
  const prefix = pick(SPELL_PREFIXES);
  const suffix = pick(SPELL_SUFFIXES);

  const name1 = art1.name.slice(0, 2);
  const name2 = art2.name.slice(-2);

  return `${prefix}·${name1}${name2}${suffix}`;
}

/** 根据两门源功法计算自创神通的基础效果池 */
export function calculateFusedSpellEffects(
  art1: CultivationArt,
  art2: CultivationArt
): SpellEffectValues {
  const m1 = ART_GRADE_MULTIPLIER[art1.grade] || 1.0;
  const m2 = ART_GRADE_MULTIPLIER[art2.grade] || 1.0;
  const avgMultiplier = (m1 + m2) / 2;

  const effects: SpellEffectValues = {};

  // 1. 攻击与暴击判定
  const hasAttackTrait = Boolean(art1.effects.attack || art2.effects.attack || art1.effects.attackPercent || art2.effects.attackPercent);
  if (hasAttackTrait) {
    effects.attackPercent = Number((0.08 * avgMultiplier).toFixed(3));
    effects.critRate = Number((0.04 * avgMultiplier).toFixed(3));
  } else {
    effects.attackPercent = Number((0.05 * avgMultiplier).toFixed(3));
  }

  // 2. 防御与气血/体魄判定
  const hasDefenseTrait = Boolean(art1.effects.defense || art2.effects.defense || art1.effects.hp || art2.effects.hp || art1.effects.physique);
  if (hasDefenseTrait) {
    effects.damageReduction = Number((0.05 * avgMultiplier).toFixed(3));
    effects.lifeLeech = Number((0.03 * avgMultiplier).toFixed(3));
  }

  // 3. 敏捷速度判定
  const hasSpeedTrait = Boolean(art1.effects.speed || art2.effects.speed || art1.effects.speedPercent || art2.effects.speedPercent);
  if (hasSpeedTrait) {
    effects.dodgeRate = Number((0.04 * avgMultiplier).toFixed(3));
    effects.speedPercent = Number((0.06 * avgMultiplier).toFixed(3));
  }

  // 4. 暴伤保底加成
  effects.critDamage = Number((0.15 * avgMultiplier).toFixed(3));

  return effects;
}

/** 检查是否满足自创神通熔炼条件 */
export function canFuseCustomSpell(
  player: PlayerStats,
  artId1: string,
  artId2: string
): { canFuse: boolean; reason?: string } {
  const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
  const minRealmIndex = REALM_ORDER.indexOf(CUSTOM_SPELL_CONFIG.minRealm);

  if (playerRealmIndex < minRealmIndex) {
    return { canFuse: false, reason: `境界未达【${CUSTOM_SPELL_CONFIG.minRealm}】，无法参悟天道融合神通！` };
  }

  if (artId1 === artId2) {
    return { canFuse: false, reason: '必须选择两门不同的功法进行道蕴融汇！' };
  }

  const currentSpells = player.customSpells || [];
  const maxSlots = getCustomSpellMaxSlots(player.realm);
  if (currentSpells.length >= maxSlots) {
    return { canFuse: false, reason: `当前境界最多可参悟 ${maxSlots} 门自创神通，道心已满！` };
  }

  const learnedSet = new Set(player.cultivationArts);
  if (!learnedSet.has(artId1) || !learnedSet.has(artId2)) {
    return { canFuse: false, reason: '只能融合已习得的功法！' };
  }

  // 消耗灵石检查
  if (player.spiritStones < CUSTOM_SPELL_CONFIG.baseSpiritStoneCost) {
    return { canFuse: false, reason: `灵石不足，参悟融合需要 ${CUSTOM_SPELL_CONFIG.baseSpiritStoneCost.toLocaleString()} 灵石！` };
  }

  return { canFuse: true };
}

/** 熔炼自创神通 */
export function fuseCustomSpell(
  player: PlayerStats,
  artId1: string,
  artId2: string,
  customName?: string
): { success: boolean; spell?: CustomSpell; updatedPlayer: PlayerStats; message: string } {
  const check = canFuseCustomSpell(player, artId1, artId2);
  if (!check.canFuse) {
    return { success: false, updatedPlayer: player, message: check.reason || '无法融合' };
  }

  const art1 = CULTIVATION_ARTS.find((a) => a.id === artId1);
  const art2 = CULTIVATION_ARTS.find((a) => a.id === artId2);

  if (!art1 || !art2) {
    return { success: false, updatedPlayer: player, message: '选择的功法不存在！' };
  }

  const spellName = (customName && customName.trim()) ? customName.trim() : generateDefaultCustomSpellName(art1, art2);
  const baseEffects = calculateFusedSpellEffects(art1, art2);

  const newSpell: CustomSpell = {
    id: `custom-spell-${Date.now()}`,
    name: spellName,
    description: `由【${art1.name}】与【${art2.name}】万千真意融汇贯通所创之无上神通。`,
    sourceArtIds: [art1.id, art2.id],
    effects: baseEffects,
    level: 1,
    proficiency: 0,
  };

  // 扣除悟道卷（若有则扣，若无则仅扣灵石）
  const newInventory = [...player.inventory];
  const scrollIndex = newInventory.findIndex((i) => i.id === 'taixu-comprehension-scroll' && (i.quantity || 1) >= 1);
  if (scrollIndex >= 0) {
    const item = newInventory[scrollIndex];
    if ((item.quantity || 1) > 1) {
      newInventory[scrollIndex] = { ...item, quantity: (item.quantity || 1) - 1 };
    } else {
      newInventory.splice(scrollIndex, 1);
    }
  }

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: Math.max(0, player.spiritStones - CUSTOM_SPELL_CONFIG.baseSpiritStoneCost),
    inventory: newInventory,
    customSpells: [...(player.customSpells || []), newSpell],
  };

  return {
    success: true,
    spell: newSpell,
    updatedPlayer,
    message: `道法归一，神念通达！你成功自创神通【${newSpell.name}】！`,
  };
}

/** 参悟强化自创神通 */
export function upgradeCustomSpell(
  player: PlayerStats,
  spellId: string
): { success: boolean; updatedPlayer: PlayerStats; message: string } {
  const spells = player.customSpells || [];
  const spellIndex = spells.findIndex((s) => s.id === spellId);

  if (spellIndex < 0) {
    return { success: false, updatedPlayer: player, message: '未找到该自创神通！' };
  }

  const targetSpell = spells[spellIndex];
  if (targetSpell.level >= CUSTOM_SPELL_CONFIG.maxLevel) {
    return { success: false, updatedPlayer: player, message: '该神通已领悟至第十重圆满极境！' };
  }

  const upgradeCost = getCustomSpellUpgradeCost(targetSpell.level);
  if (player.spiritStones < upgradeCost) {
    return {
      success: false,
      updatedPlayer: player,
      message: `灵石不足，提升至第 ${targetSpell.level + 1} 重需要 ${upgradeCost.toLocaleString()} 灵石！`,
    };
  }

  // 扣除材料或直接升级
  const nextLevel = targetSpell.level + 1;

  const updatedEffects: SpellEffectValues = {};
  for (const [key, val] of Object.entries(targetSpell.effects)) {
    if (typeof val === 'number') {
      (updatedEffects as any)[key] = Number((val * (1 + 0.12)).toFixed(3));
    }
  }

  const updatedSpell: CustomSpell = {
    ...targetSpell,
    level: nextLevel,
    effects: updatedEffects,
  };

  const newSpells = [...spells];
  newSpells[spellIndex] = updatedSpell;

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: player.spiritStones - upgradeCost,
    customSpells: newSpells,
  };

  return {
    success: true,
    updatedPlayer,
    message: `神通突破！【${targetSpell.name}】晋升至第 ${nextLevel} 重，威能大幅激增！`,
  };
}

/** 遗忘自创神通（返还部分灵石） */
export function forgetCustomSpell(
  player: PlayerStats,
  spellId: string
): { success: boolean; updatedPlayer: PlayerStats; message: string } {
  const spells = player.customSpells || [];
  const targetSpell = spells.find((s) => s.id === spellId);

  if (!targetSpell) {
    return { success: false, updatedPlayer: player, message: '未找到该自创神通！' };
  }

  const refundStones = Math.floor(CUSTOM_SPELL_CONFIG.baseSpiritStoneCost * 0.4 * targetSpell.level);
  const newSpells = spells.filter((s) => s.id !== spellId);

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: player.spiritStones + refundStones,
    customSpells: newSpells,
  };

  return {
    success: true,
    updatedPlayer,
    message: `你斩断神念因果，遗忘了神通【${targetSpell.name}】，返还散功灵石 ${refundStones.toLocaleString()}！`,
  };
}

/** 计算所有自创神通为角色提供的总属性与战斗增益 */
export function calculateAllCustomSpellBonuses(player: PlayerStats): {
  attackPercent: number;
  critRate: number;
  critDamage: number;
  damageReduction: number;
  lifeLeech: number;
  dodgeRate: number;
  speedPercent: number;
} {
  const result = {
    attackPercent: 0,
    critRate: 0,
    critDamage: 0,
    damageReduction: 0,
    lifeLeech: 0,
    dodgeRate: 0,
    speedPercent: 0,
  };

  const spells = player.customSpells || [];
  for (const s of spells) {
    if (s.effects.attackPercent) result.attackPercent += s.effects.attackPercent;
    if (s.effects.critRate) result.critRate += s.effects.critRate;
    if (s.effects.critDamage) result.critDamage += s.effects.critDamage;
    if (s.effects.damageReduction) result.damageReduction += s.effects.damageReduction;
    if (s.effects.lifeLeech) result.lifeLeech += s.effects.lifeLeech;
    if (s.effects.dodgeRate) result.dodgeRate += s.effects.dodgeRate;
    if (s.effects.speedPercent) result.speedPercent += s.effects.speedPercent;
  }

  return result;
}
