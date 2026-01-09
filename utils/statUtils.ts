import { PlayerStats, CultivationArt, ArtGrade } from '../types';
import { CULTIVATION_ARTS, TALENTS, TITLES, calculateSpiritualRootArtBonus } from '../constants/index';
import { getGoldenCoreBonusMultiplier } from './cultivationUtils';
import { getItemStats } from './itemUtils';
import { calculateTitleEffects } from './titleUtils';

/**
 * 计算玩家所有的固定数值加成（功法、装备、天赋、称号）
 * 这些加成通常直接反映在 player.attack 等字段的基础值中
 */
export function calculatePlayerBonuses(player: PlayerStats): {
  attack: number;
  defense: number;
  hp: number;
  spirit: number;
  physique: number;
  speed: number;
} {
  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusHp = 0;
  let bonusSpirit = 0;
  let bonusPhysique = 0;
  let bonusSpeed = 0;

  // 1. 功法加成（所有已习得功法的固定加成）
  const spiritualRoots = player.spiritualRoots || {
    metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
  };

  player.cultivationArts.forEach((artId) => {
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (art) {
      const spiritualRootBonus = calculateSpiritualRootArtBonus(art, spiritualRoots);
      bonusAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
      bonusDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
      bonusHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
      bonusSpirit += Math.floor((art.effects.spirit || 0) * spiritualRootBonus);
      bonusPhysique += Math.floor((art.effects.physique || 0) * spiritualRootBonus);
      bonusSpeed += Math.floor((art.effects.speed || 0) * spiritualRootBonus);
    }
  });

  // 2. 装备加成（应用软上限机制）
  const equippedItems = Object.values(player.equippedItems).map(itemId =>
    player.inventory.find((i) => i.id === itemId)
  ).filter(Boolean);

  // 计算基础装备加成
  equippedItems.forEach((equippedItem) => {
    if (equippedItem && equippedItem.effect) {
      const isNatal = equippedItem.id === player.natalArtifactId;
      const itemStats = getItemStats(equippedItem, isNatal);
      bonusAttack += itemStats.attack;
      bonusDefense += itemStats.defense;
      bonusHp += itemStats.hp;
      bonusSpirit += itemStats.spirit;
      bonusPhysique += itemStats.physique;
      bonusSpeed += itemStats.speed;
    }
  });

  // 应用装备属性软上限机制
  const softCapFactor = calculateEquipmentSoftCapFactor(player, equippedItems.length);
  bonusAttack = applyEquipmentSoftCap(bonusAttack, softCapFactor);
  bonusDefense = applyEquipmentSoftCap(bonusDefense, softCapFactor);
  bonusHp = applyEquipmentSoftCap(bonusHp, softCapFactor);
  bonusSpirit = applyEquipmentSoftCap(bonusSpirit, softCapFactor);
  bonusPhysique = applyEquipmentSoftCap(bonusPhysique, softCapFactor);
  bonusSpeed = applyEquipmentSoftCap(bonusSpeed, softCapFactor);

  // 3. 天赋加成
  const talent = TALENTS.find((t) => t.id === player.talentId);
  if (talent) {
    bonusAttack += talent.effects.attack || 0;
    bonusDefense += talent.effects.defense || 0;
    bonusHp += talent.effects.hp || 0;
    bonusSpirit += talent.effects.spirit || 0;
    bonusPhysique += talent.effects.physique || 0;
    bonusSpeed += talent.effects.speed || 0;
  }

  // 4. 称号加成
  const title = TITLES.find((t) => t.id === player.titleId);
  if (title) {
    bonusAttack += title.effects.attack || 0;
    bonusDefense += title.effects.defense || 0;
    bonusHp += title.effects.hp || 0;
    bonusSpirit += title.effects.spirit || 0;
    bonusPhysique += title.effects.physique || 0;
    bonusSpeed += title.effects.speed || 0;
  }

  return {
    attack: bonusAttack,
    defense: bonusDefense,
    hp: bonusHp,
    spirit: bonusSpirit,
    physique: bonusPhysique,
    speed: bonusSpeed,
  };
}

/**
 * 获取玩家激活的心法
 */
export function getActiveMentalArt(player: PlayerStats): CultivationArt | null {
  if (!player.activeArtId) return null;

  // 在功法中查找
  const art = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
  return art || null;
}

/**
 * 计算玩家的总修炼速度加成（功法、天赋、称号、洞府等）
 */
export function calculateTotalExpRate(player: PlayerStats): {
  total: number;
  art: number;
  talent: number;
  title: number;
  grotto: number;
  spiritualRootBonus: number;
} {
  let artBonus = 0;
  let talentBonus = 0;
  let titleBonus = 0;
  let grottoBonus = 0;
  let spiritualRootBonus = 1.0;

  // 1. 激活的心法加成
  const activeArt = getActiveMentalArt(player);
  if (activeArt && activeArt.effects.expRate) {
    // 定义品质系数：天(2.0)、地(1.5)、玄(1.2)、黄(1.0)
    // 品质越高，对修炼效率的额外加成越高
    const gradeMultipliers: Record<string, number> = {
      '天': 2.0,
      '地': 1.5,
      '玄': 1.2,
      '黄': 1.0
    };
    const gradeMultiplier = gradeMultipliers[activeArt.grade] || 1.0;

    artBonus = activeArt.effects.expRate * gradeMultiplier;

    // 计算灵根对心法的加成
    const spiritualRoots = player.spiritualRoots || {
      metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
    };
    spiritualRootBonus = calculateSpiritualRootArtBonus(activeArt, spiritualRoots);
  }

  // 2. 天赋加成
  const talent = TALENTS.find((t) => t.id === player.talentId);
  if (talent && talent.effects.expRate) {
    talentBonus = talent.effects.expRate;
  }

  // 3. 称号加成
  const titleEffects = calculateTitleEffects(player.titleId, player.unlockedTitles || []);
  if (titleEffects.expRate > 0) {
    titleBonus = titleEffects.expRate;
  }

  // 4. 洞府加成
  if (player.grotto) {
    grottoBonus = (player.grotto.expRateBonus || 0) + (player.grotto.spiritArrayEnhancement || 0);
  }

  // 总加成 = (1 + 心法 * 灵根) * (1 + 天赋) * (1 + 称号) * (1 + 洞府) - 1
  // 注意：这里的计算逻辑应与 useMeditationHandlers.ts 保持一致
  // 目前 useMeditationHandlers.ts 中的逻辑是连乘，且灵根仅作用于心法的 expRate
  const totalMultiplier = (1 + artBonus * spiritualRootBonus) * (1 + talentBonus) * (1 + titleBonus) * (1 + grottoBonus);

  return {
    total: totalMultiplier - 1,
    art: artBonus,
    talent: talentBonus,
    title: titleBonus,
    grotto: grottoBonus,
    spiritualRootBonus,
  };
}

/**
 * 计算玩家的总属性（基础属性 + 装备 + 功法 + 称号 + 天赋）
 * 注意：目前的实现中，装备、称号、天赋、体术功法已经永久加到了 player.attack 等字段中
 * 这里主要负责加上【激活的心法】带来的属性加成
 */
export const getPlayerTotalStats = (player: PlayerStats): {
  attack: number;
  defense: number;
  maxHp: number;
  spirit: number;
  physique: number;
  speed: number;
} => {
  const stats = {
    attack: player.attack,
    defense: player.defense,
    maxHp: player.maxHp,
    spirit: player.spirit,
    physique: player.physique,
    speed: player.speed,
  };

  // 1. 获取激活的心法
  const activeArt = getActiveMentalArt(player);

  if (activeArt && activeArt.type === 'mental') {
    const effects = activeArt.effects;

    // 计算灵根对心法的加成
    const spiritualRoots = player.spiritualRoots || {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0,
    };
    const spiritualRootBonus = calculateSpiritualRootArtBonus(activeArt, spiritualRoots);

    // 加上固定数值加成（应用灵根加成）
    stats.attack += Math.floor((effects.attack || 0) * spiritualRootBonus);
    stats.defense += Math.floor((effects.defense || 0) * spiritualRootBonus);
    stats.maxHp += Math.floor((effects.hp || 0) * spiritualRootBonus);
    stats.spirit += Math.floor((effects.spirit || 0) * spiritualRootBonus);
    stats.physique += Math.floor((effects.physique || 0) * spiritualRootBonus);
    stats.speed += Math.floor((effects.speed || 0) * spiritualRootBonus);

    // 加上百分比加成（如果有）
    // 注意：百分比加成通常基于当前已有的属性（基础+装备等）
    if (effects.attackPercent) stats.attack = Math.floor(stats.attack * (1 + effects.attackPercent));
    if (effects.defensePercent) stats.defense = Math.floor(stats.defense * (1 + effects.defensePercent));
    if (effects.hpPercent) stats.maxHp = Math.floor(stats.maxHp * (1 + effects.hpPercent));
    if (effects.spiritPercent) stats.spirit = Math.floor(stats.spirit * (1 + effects.spiritPercent));
    if (effects.physiquePercent) stats.physique = Math.floor(stats.physique * (1 + effects.physiquePercent));
    if (effects.speedPercent) stats.speed = Math.floor(stats.speed * (1 + effects.speedPercent));
  }

  // 2. 应用金丹法数属性加成（如果玩家是金丹期及以上且有金丹法数）
  if (player.goldenCoreMethodCount && player.goldenCoreMethodCount > 0) {
    const bonusMultiplier = getGoldenCoreBonusMultiplier(player.goldenCoreMethodCount);

    // 引入属性协同限制机制：防止乘法叠加产生极端数值
    // 计算协同限制系数（基于玩家当前境界）
    const synergyLimitFactor = calculateSynergyLimitFactor(player);

    // 应用经过协同限制的属性加成
    stats.attack = applySynergyLimitedBonus(stats.attack, bonusMultiplier, synergyLimitFactor);
    stats.defense = applySynergyLimitedBonus(stats.defense, bonusMultiplier, synergyLimitFactor);
    stats.maxHp = applySynergyLimitedBonus(stats.maxHp, bonusMultiplier, synergyLimitFactor);
    stats.spirit = applySynergyLimitedBonus(stats.spirit, bonusMultiplier, synergyLimitFactor);
    stats.physique = applySynergyLimitedBonus(stats.physique, bonusMultiplier, synergyLimitFactor);
    stats.speed = applySynergyLimitedBonus(stats.speed, bonusMultiplier, synergyLimitFactor);
  }

  return stats;
}

/**
 * 计算属性协同限制系数
 * 基于玩家境界和当前属性水平，限制乘法叠加的效果
 */
function calculateSynergyLimitFactor(player: PlayerStats): number {
  const realm = player.realm;
  const realmLevel = player.realmLevel || 1;

  // 境界基础限制系数
  const realmBaseFactors: Record<string, number> = {
    '炼气期': 0.8,
    '筑基期': 0.85,
    '金丹期': 0.9,
    '元婴期': 0.95,
    '化神期': 1.0,
    '合道期': 1.05,
    '长生境': 1.1,
    '渡劫飞升': 1.2
  };

  const baseFactor = realmBaseFactors[realm] || 1.0;

  // 境界等级加成：每级增加0.5%的协同效果
  const levelBonus = 1 + (realmLevel - 1) * 0.005;

  // 属性水平限制：如果属性过高，协同效果会降低
  const totalAttributes = player.attack + player.defense + player.maxHp / 10 + player.spirit + player.physique + player.speed;
  const attributeLimitFactor = Math.min(1.0, Math.max(0.5, 100000 / (totalAttributes + 10000)));

  return baseFactor * levelBonus * attributeLimitFactor;
}

/**
 * 应用经过协同限制的属性加成
 * 使用对数增长模式，避免极端数值
 */
function applySynergyLimitedBonus(baseValue: number, bonusMultiplier: number, synergyLimitFactor: number): number {
  // 原始加成倍数
  const rawMultiplier = bonusMultiplier;

  // 应用协同限制：使用对数增长模式
  // 当加成倍数较高时，实际效果会逐渐递减
  const effectiveMultiplier = 1 + (rawMultiplier - 1) * synergyLimitFactor;

  // 进一步限制：最大加成不超过基础值的10倍
  const maxMultiplier = Math.min(10, effectiveMultiplier);

  return Math.floor(baseValue * maxMultiplier);
}

/**
 * 计算装备属性软上限系数
 * 基于玩家境界和装备数量，限制装备属性叠加的效果
 */
function calculateEquipmentSoftCapFactor(player: PlayerStats, equippedItemCount: number): number {
  const realm = player.realm;
  const realmLevel = player.realmLevel || 1;

  // 境界基础软上限系数（越高境界，软上限越高）
  const realmBaseFactors: Record<string, number> = {
    '炼气期': 0.6,
    '筑基期': 0.7,
    '金丹期': 0.8,
    '元婴期': 0.9,
    '化神期': 1.0,
    '合道期': 1.1,
    '长生境': 1.2,
    '渡劫飞升': 1.3
  };

  const baseFactor = realmBaseFactors[realm] || 0.8;

  // 境界等级加成：每级增加1%的软上限
  const levelBonus = 1 + (realmLevel - 1) * 0.01;

  // 装备数量限制：装备越多，软上限效果越明显
  const equipmentCountFactor = Math.max(0.5, 1.0 - (equippedItemCount - 8) * 0.05);

  return baseFactor * levelBonus * equipmentCountFactor;
}

/**
 * 应用装备属性软上限
 * 当装备属性加成超过一定阈值时，收益递减
 */
function applyEquipmentSoftCap(equipmentBonus: number, softCapFactor: number): number {
  // 基础软上限阈值（基于玩家境界）
  const baseThreshold = 1000 * softCapFactor;

  if (equipmentBonus <= baseThreshold) {
    return equipmentBonus; // 未超过阈值，全额加成
  }

  // 超过阈值部分应用收益递减
  const overThreshold = equipmentBonus - baseThreshold;
  const diminishedBonus = overThreshold * (0.5 + softCapFactor * 0.3); // 递减系数：50%-80%

  return Math.floor(baseThreshold + diminishedBonus);
}

