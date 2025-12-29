/**
 * 渡劫系统相关常量
 * 包含天劫配置、渡劫阶段、死亡概率计算等
 */

import { RealmType, ItemRarity, EquipmentSlot, Item } from '../types';

// ==================== 天劫系统配置 ====================

// 天劫等级配置
export const TRIBULATION_CONFIG: Record<RealmType, {
  requiresTribulation: boolean; // 是否需要渡劫
  tribulationLevel: '金丹天劫' | '元婴天劫' | '化神天劫' | '合道天劫' | '长生天劫' | null; // 天劫等级
  baseDeathProbability: number; // 基础死亡概率（0-1）
  description: string; // 天劫描述
}> = {
  [RealmType.QiRefining]: {
    requiresTribulation: false,
    tribulationLevel: null,
    baseDeathProbability: 0,
    description: '炼气期无需渡劫'
  },
  [RealmType.Foundation]: {
    requiresTribulation: false,
    tribulationLevel: null,
    baseDeathProbability: 0,
    description: '筑基期无需渡劫'
  },
  [RealmType.GoldenCore]: {
    requiresTribulation: true,
    tribulationLevel: '金丹天劫',
    baseDeathProbability: 0.30, // 基础30%死亡概率（从20%提高到30%）
    description: '金丹大成，天劫将至！九九重劫，生死一线！'
  },
  [RealmType.NascentSoul]: {
    requiresTribulation: true,
    tribulationLevel: '元婴天劫',
    baseDeathProbability: 0.45, // 基础45%死亡概率（从30%提高到45%）
    description: '元婴出窍，天劫降临！此劫比金丹之劫更加凶险！'
  },
  [RealmType.SpiritSevering]: {
    requiresTribulation: true,
    tribulationLevel: '化神天劫',
    baseDeathProbability: 0.60, // 基础60%死亡概率（从40%提高到60%）
    description: '化神之劫，天地不容！若无绝世机缘，难逃此劫！'
  },
  [RealmType.DaoCombining]: {
    requiresTribulation: true,
    tribulationLevel: '合道天劫',
    baseDeathProbability: 0.70, // 基础70%死亡概率（从50%提高到70%）
    description: '合道之劫，以身合道！此乃夺取天地之魄的终极考验！'
  },
  [RealmType.LongevityRealm]: {
    requiresTribulation: true,
    tribulationLevel: '长生天劫',
    baseDeathProbability: 0.85, // 基础85%死亡概率，极其困难
    description: '长生之劫，逆天而行！五重考验，九死一生！'
  },
};

// 装备品质倍率（用于天劫计算）
export const TRIBULATION_RARITY_BONUS: Record<ItemRarity, number> = {
  '普通': 0,   // 普通装备不加成
  '稀有': 0.03, // 稀有装备降低3%死亡概率（从5%降低到3%）
  '传说': 0.06, // 传说装备降低6%死亡概率（从10%降低到6%）
  '仙品': 0.12, // 仙品装备降低12%死亡概率（从20%降低到12%）
};

// 本命法宝额外加成
export const NATAL_ARTIFACT_BONUS = 0.03; // 本命法宝额外降低3%死亡概率（从5%降低到3%）

// 天劫阶段配置
export const TRIBULATION_STAGES = [
  { stage: '准备中', description: '你正在调整呼吸，准备迎接天劫...', delay: 1000 },
  { stage: '第一道雷劫', description: '天空乌云密布，第一道雷霆劈下！', delay: 2000 },
  { stage: '第二道雷劫', description: '云层翻涌，第二道雷霆更加猛烈！', delay: 2000 },
  { stage: '第三道雷劫', description: '天地变色，最后一道雷霆带着毁灭气息落下！', delay: 2000 },
  { stage: '渡劫完成', description: '劫云散去，天劫已过！你成功突破！', delay: 0 },
  { stage: '渡劫失败', description: '天劫太强，你被雷霆击中，魂飞魄散...', delay: 0 },
];

// 计算天劫死亡概率
export const calculateTribulationDeathProbability = (
  realm: RealmType,
  totalStats: {
    attack: number;
    defense: number;
    spirit: number;
    physique: number;
    speed: number;
    maxHp: number;
  },
  equipmentQualityScore: number,
  hasNatalArtifact: boolean
): number => {
  // 获取基础死亡概率
  const config = TRIBULATION_CONFIG[realm];
  let deathProbability = config.baseDeathProbability;

  // 计算综合属性值（用于降低死亡概率）
  // 归一化处理：以金丹期属性为基准
  const normalizedStats = (
    (totalStats.attack + totalStats.defense + totalStats.spirit +
     totalStats.physique + totalStats.speed + totalStats.maxHp / 10) / 6
  );

  // 属性加成：每800点综合属性降低1%死亡概率，最多降低15%（难度提高：从500改为800，从20%改为15%）
  const attributeBonus = Math.min(normalizedStats / 800 * 0.01, 0.15);
  deathProbability -= attributeBonus;

  // 装备加成
  deathProbability -= equipmentQualityScore;

  // 本命法宝加成
  if (hasNatalArtifact) {
    deathProbability -= NATAL_ARTIFACT_BONUS;
  }

  // 确保死亡概率在合理范围内（最低死亡概率从5%提高到10%，增加挑战性）
  deathProbability = Math.max(0.10, Math.min(0.95, deathProbability));

  return deathProbability;
};

// 计算装备品质评分（降低死亡概率的数值）
export const calculateEquipmentQualityScore = (
  equippedItems: Partial<Record<EquipmentSlot, string>>,
  inventory: Item[]
): number => {
  let qualityScore = 0;

  Object.values(equippedItems).forEach((itemId) => {
    const item = inventory.find((i) => i.id === itemId);
    if (item && item.rarity) {
      qualityScore += TRIBULATION_RARITY_BONUS[item.rarity] || 0;
    }
  });

  return qualityScore;
};