import { PlayerStats, CultivationArt, ArtGrade } from '../types';
import { CULTIVATION_ARTS, TALENTS, TITLES, calculateSpiritualRootArtBonus } from '../constants/index';
import { getGoldenCoreBonusMultiplier } from './cultivationUtils';
import { getItemStats } from './itemUtils';

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

  // 2. 装备加成
  Object.values(player.equippedItems).forEach((itemId) => {
    const equippedItem = player.inventory.find((i) => i.id === itemId);
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
    // 应用属性加成倍数（例如：3.6x 表示属性提升到原来的3.6倍，即+260%）
    stats.attack = Math.floor(stats.attack * bonusMultiplier);
    stats.defense = Math.floor(stats.defense * bonusMultiplier);
    stats.maxHp = Math.floor(stats.maxHp * bonusMultiplier);
    stats.spirit = Math.floor(stats.spirit * bonusMultiplier);
    stats.physique = Math.floor(stats.physique * bonusMultiplier);
    stats.speed = Math.floor(stats.speed * bonusMultiplier);
  }

  return stats;
}

