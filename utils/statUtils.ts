import { PlayerStats, CultivationArt, ArtGrade } from '../types';
import { CULTIVATION_ARTS, INHERITANCE_SKILLS, calculateSpiritualRootArtBonus } from '../constants';

/**
 * 获取玩家激活的心法（包括普通功法和传承功法）
 */
export function getActiveMentalArt(player: PlayerStats): CultivationArt | null {
  if (!player.activeArtId) return null;

  // 1. 在普通功法中查找
  const art = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
  if (art) return art;

  // 2. 在传承技能中查找
  const skill = INHERITANCE_SKILLS.find((s) => s.id === player.activeArtId);
  if (skill) {
    // 将传承技能转换为 CultivationArt 格式
    return {
      id: skill.id,
      name: skill.name,
      type: (skill.effects.expRate ? 'mental' : 'body') as 'mental' | 'body',
      description: skill.description,
      grade: '天' as ArtGrade,
      realmRequirement: player.realm, // 传承技能通常无境界要求
      cost: 0,
      effects: {
        ...skill.effects,
      },
    } as CultivationArt;
  }

  return null;
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

  return stats;
}

