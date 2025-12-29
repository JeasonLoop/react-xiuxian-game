/**
 * 灵根系统相关常量
 */

import { CultivationArt, RealmType } from '../types';

export type SpiritualRootType = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

// 灵根名称映射
export const SPIRITUAL_ROOT_NAMES: Record<SpiritualRootType, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

// 灵根对修炼速度的影响（每个灵根点增加0.1%的修炼速度）
export const SPIRITUAL_ROOT_EXP_MULTIPLIER = 0.001; // 每个灵根点增加0.1%修炼速度

// 灵根对突破成功率的影响（每个灵根点增加0.05%的突破成功率）
export const SPIRITUAL_ROOT_BREAKTHROUGH_BONUS = 0.0005; // 每个灵根点增加0.05%突破成功率

// 灵根对属性的影响（每个灵根点增加对应属性的0.1%）
export const SPIRITUAL_ROOT_ATTRIBUTE_MULTIPLIER = 0.001; // 每个灵根点增加0.1%属性

// 灵根属性加成映射（不同灵根影响不同属性）
export const SPIRITUAL_ROOT_ATTRIBUTE_MAP: Record<
  SpiritualRootType,
  {
    attack?: number; // 攻击力加成比例
    defense?: number; // 防御力加成比例
    spirit?: number; // 神识加成比例
    physique?: number; // 体魄加成比例
    speed?: number; // 速度加成比例
    maxHp?: number; // 气血上限加成比例（木灵根使用）
  }
> = {
  metal: { attack: 0.002, defense: 0.001 }, // 金灵根：攻击+0.2%/点，防御+0.1%/点
  wood: { maxHp: 0.002, physique: 0.001 }, // 木灵根：气血+0.2%/点，体魄+0.1%/点（通过maxHp实现）
  water: { spirit: 0.002, defense: 0.001 }, // 水灵根：神识+0.2%/点，防御+0.1%/点
  fire: { attack: 0.002, speed: 0.001 }, // 火灵根：攻击+0.2%/点，速度+0.1%/点
  earth: { defense: 0.002, physique: 0.001 }, // 土灵根：防御+0.2%/点，体魄+0.1%/点
};

// 计算灵根总等级
export const calculateTotalSpiritualRootLevel = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  return (
    spiritualRoots.metal +
    spiritualRoots.wood +
    spiritualRoots.water +
    spiritualRoots.fire +
    spiritualRoots.earth
  );
};

// 计算灵根对修炼速度的加成
export const calculateSpiritualRootExpBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return 1 + totalLevel * SPIRITUAL_ROOT_EXP_MULTIPLIER;
};

// 计算灵根对突破成功率的加成
export const calculateSpiritualRootBreakthroughBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return totalLevel * SPIRITUAL_ROOT_BREAKTHROUGH_BONUS;
};

// 计算灵根对功法的加成倍数（每个灵根点增加0.5%的效果）
export const calculateSpiritualRootArtBonus = (
  art: CultivationArt,
  spiritualRoots: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  }
): number => {
  if (!art.spiritualRoot) return 1.0; // 没有对应灵根的功法不加成

  const rootLevel = spiritualRoots[art.spiritualRoot] || 0;
  // 每个灵根点增加0.5%的效果，最高50%加成（100点灵根）
  return 1.0 + (rootLevel * 0.005);
};
