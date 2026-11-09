/**
 * 稀有度相关的工具函数
 * 统一管理所有稀有度相关的样式和工具函数，避免在多个组件中重复定义
 */

import { ItemRarity } from '../types';

/**
 * 获取稀有度的颜色类名（用于文本）
 * @param commonColor 普通/未知稀有度使用的颜色类名，默认 text-stone-300；
 *                    个别场景（如灵宠放生列表）需要不同的普通色时可通过该参数覆盖
 */
export const getRarityTextColor = (
  rarity: ItemRarity | undefined,
  commonColor: string = 'text-stone-300'
): string => {
  switch (rarity) {
    case '稀有':
      return 'text-blue-400';
    case '传说':
      return 'text-purple-400';
    case '仙品':
      return 'text-yellow-400';
    default:
      return commonColor;
  }
};

/**
 * 获取稀有度的名称样式类名（用于物品名称，包含 hover 效果）
 */
export const getRarityNameClasses = (rarity: ItemRarity | undefined): string => {
  const base = 'font-bold transition-colors duration-300 cursor-default ';
  switch (rarity) {
    case '稀有':
      return base + 'text-stone-300 hover:text-blue-400';
    case '传说':
       return base + 'text-stone-300 hover:text-purple-400';
    case '仙品':
      return (
        base +
        'text-stone-300 hover:text-mystic-gold hover:drop-shadow-[0_0_8px_rgba(203,161,53,0.5)]'
      );
    default:
      return base + 'text-stone-300 hover:text-stone-100';
  }
};

/**
 * 获取稀有度的边框样式类名
 */
export const getRarityBorder = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'border-blue-800';
    case '传说':
      return 'border-purple-800';
    case '仙品':
      return 'border-mystic-gold';
    default:
      return 'border-stone-700';
  }
};

/**
 * 获取稀有度的背景和边框样式类名（用于卡片/面板）
 */
export const getRarityColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'border-blue-600 bg-blue-900/20';
    case '传说':
      return 'border-purple-600 bg-purple-900/20';
    case '仙品':
      return 'border-yellow-600 bg-yellow-900/20';
    default:
      return 'border-stone-600 bg-stone-800';
  }
};

/**
 * 获取稀有度的徽章样式类名（用于标签）
 */
export const getRarityBadge = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'bg-blue-900/40 text-blue-300 border-blue-700';
    case '传说':
      return 'bg-purple-900/40 text-purple-300 border-purple-700';
    case '仙品':
      return 'bg-yellow-900/40 text-yellow-300 border-yellow-700';
    default:
      return 'bg-stone-700 text-stone-400 border-stone-600';
  }
};

/**
 * 获取稀有度的排序权重（用于排序）
 */
export const getRarityOrder = (rarity: ItemRarity | undefined): number => {
  const rarityOrder: Record<ItemRarity, number> = {
    仙品: 5,
    传说: 4,
    稀有: 3,
    普通: 2,
  };
  return rarityOrder[rarity || '普通'];
};

/**
 * 获取稀有度的显示名称
 */
export const getRarityDisplayName = (rarity: ItemRarity | undefined): string => {
  return rarity || '普通';
};

/**
 * 稀有度别名映射（兼容英文和别称）
 */
const rarityAliasMap: Record<string, ItemRarity> = {
  rare: '稀有',
  common: '普通',
  normal: '普通',
  legend: '传说',
  legendary: '传说',
  mythic: '仙品',
  immortal: '仙品',
};

/**
 * 规范化稀有度值（将英文/别称转换为标准中文）
 * 用于统一显示，兼容AI可能返回的英文稀有度
 */
export const normalizeRarityValue = (rarity?: ItemRarity | string): ItemRarity => {
  if (!rarity) return '普通';
  const key = String(rarity).toLowerCase();
  return rarityAliasMap[key] || (rarity as ItemRarity);
};

/**
 * 获取稀有度的文本颜色类名（亮色阶变体）
 * 用于批量分解等列表场景，与 getRarityTextColor 的区别是使用 300 色阶、普通为 stone-400
 */
export const getRarityTextBrightColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'text-blue-300';
    case '传说':
      return 'text-purple-300';
    case '仙品':
      return 'text-yellow-300';
    default:
      return 'text-stone-400';
  }
};

/**
 * 获取稀有度的卡片样式类名（边框+文本+背景）
 * 用于合成/融合列表项的卡片容器
 */
export const getRarityCardStyle = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'border-blue-800/50 text-blue-400 bg-blue-900/10';
    case '传说':
      return 'border-purple-800/50 text-purple-400 bg-purple-900/10';
    case '仙品':
      return 'border-mystic-gold/50 text-mystic-gold bg-mystic-gold/10';
    default:
      return 'border-stone-700/50 text-stone-400 bg-stone-900/20';
  }
};

/**
 * 获取宗门宝库物品卡片的背景和边框样式类名
 */
export const getRarityVaultCardStyle = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '仙品':
      return 'bg-yellow-900/30 border-yellow-400/50';
    case '传说':
      return 'bg-purple-900/30 border-purple-400/50';
    case '稀有':
      return 'bg-blue-900/30 border-blue-400/50';
    default:
      return 'bg-stone-800/30 border-stone-400/50';
  }
};

/**
 * 获取功法品级（天/地/玄/黄）的徽章样式类名（边框+文本+背景）
 * 品级未知时返回中性石色样式
 */
export const getSkillQualityColor = (quality: string | null): string => {
  switch (quality) {
    case '天':
      return 'border-yellow-500 text-yellow-400 bg-yellow-900/20';
    case '地':
      return 'border-purple-500 text-purple-400 bg-purple-900/20';
    case '玄':
      return 'border-blue-500 text-blue-400 bg-blue-900/20';
    case '黄':
      return 'border-green-500 text-green-400 bg-green-900/20';
    default:
      return 'border-stone-600 text-stone-400 bg-stone-900/20';
  }
};
