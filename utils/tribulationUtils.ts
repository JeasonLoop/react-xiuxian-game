import { PlayerStats, TribulationState, TribulationResult } from '../types';
import {
  TRIBULATION_CONFIG,
  calculateTribulationDeathProbability,
  calculateEquipmentQualityScore,
  REALM_ORDER,
} from '../constants';
import { getPlayerTotalStats } from './statUtils';

/**
 * 检查是否触发天劫
 * @param player 玩家数据
 * @returns 是否需要触发天劫
 */
export const shouldTriggerTribulation = (player: PlayerStats): boolean => {
  // 检查经验是否已满
  if (player.exp < player.maxExp) {
    return false;
  }

  // 只有境界升级（realmLevel >= 9）时才可能需要渡劫
  // 层数升级（realmLevel < 9）不需要渡劫
  if (player.realmLevel < 9) {
    return false;
  }

  // 境界升级时，计算目标境界
  const currentIndex = REALM_ORDER.indexOf(player.realm);
  if (currentIndex >= REALM_ORDER.length - 1) {
    // 已经是最高境界，无法再突破
    return false;
  }

  const targetRealm = REALM_ORDER[currentIndex + 1];

  // 检查目标境界是否需要渡劫
  const config = TRIBULATION_CONFIG[targetRealm];
  return config.requiresTribulation;
};

/**
 * 创建天劫状态
 * @param player 玩家数据
 * @param targetRealm 目标境界
 * @returns 天劫状态
 */
export const createTribulationState = (
  player: PlayerStats,
  targetRealm: typeof player.realm
): TribulationState => {
  const config = TRIBULATION_CONFIG[targetRealm];

  // 获取玩家综合属性
  const totalStats = getPlayerTotalStats(player);

  // 计算装备品质评分
  const equipmentQualityScore = calculateEquipmentQualityScore(
    player.equippedItems,
    player.inventory
  );

  // 检查是否有本命法宝
  const hasNatalArtifact = player.natalArtifactId !== null &&
    Object.values(player.equippedItems).includes(player.natalArtifactId);

  // 计算死亡概率
  const deathProbability = calculateTribulationDeathProbability(
    targetRealm,
    totalStats,
    equipmentQualityScore,
    hasNatalArtifact
  );

  // 计算属性修正值（综合属性对死亡概率的降低量）
  const attributeBonus = Math.min(
    (totalStats.attack + totalStats.defense + totalStats.spirit +
     totalStats.physique + totalStats.speed + totalStats.maxHp / 10) / 6 / 500 * 0.01,
    0.20
  );

  return {
    isOpen: true,
    targetRealm,
    tribulationLevel: config.tribulationLevel!,
    stage: '准备中',
    deathProbability,
    attributeBonus,
    equipmentBonus: equipmentQualityScore,
    totalStats,
    equipmentQualityScore,
    isCleared: false,
  };
};

/**
 * 执行渡劫
 * @param tribulationState 天劫状态
 * @returns 渡劫结果
 */
export const executeTribulation = (
  tribulationState: TribulationState
): TribulationResult => {
  const { deathProbability } = tribulationState;
  const roll = Math.random();
  const success = roll > deathProbability;

  let description = '';
  let hpLoss = 0;

  if (success) {
    // 渡劫成功
    const hpLossPercent = Math.random() * 0.3 + 0.1; // 损失10%-40%气血
    hpLoss = Math.floor(tribulationState.totalStats.maxHp * hpLossPercent);

    if (deathProbability < 0.2) {
      description = '天劫对你来说如同儿戏，你轻松度过三道雷劫，毫发无损！';
    } else if (deathProbability < 0.4) {
      description = '你咬牙坚持，虽然身负重伤，但成功度过天劫！';
    } else if (deathProbability < 0.6) {
      description = '天劫凶险，你险象环生，最终险渡难关！';
    } else {
      description = '你在生死边缘徘徊，凭着绝世运气躲过致命雷击！';
    }
  } else {
    // 渡劫失败
    if (deathProbability < 0.3) {
      description = '天劫太强，你虽全力抵抗，仍被雷霆击中，魂飞魄散...';
    } else if (deathProbability < 0.5) {
      description = '雷劫太过凶猛，你肉身被毁，元神亦被打散...';
    } else if (deathProbability < 0.7) {
      description = '天地之威不可挡，你在天劫下化为尘埃...';
    } else {
      description = '绝世凶劫降临，你毫无还手之力，当场陨落...';
    }
  }

  return {
    success,
    deathProbability,
    roll,
    hpLoss,
    description,
  };
};

/**
 * 获取天劫描述文本
 * @param tribulationLevel 天劫等级
 * @param deathProbability 死亡概率
 * @returns 描述文本
 */
export const getTribulationDescription = (
  tribulationLevel: string,
  deathProbability: number
): string => {
  let riskLevel = '';
  if (deathProbability < 0.2) {
    riskLevel = '风险较低';
  } else if (deathProbability < 0.4) {
    riskLevel = '风险中等';
  } else if (deathProbability < 0.6) {
    riskLevel = '风险较高';
  } else if (deathProbability < 0.8) {
    riskLevel = '风险极高';
  } else {
    riskLevel = '九死一生';
  }

  return `即将迎来${tribulationLevel}，${riskLevel}。死亡概率：${(deathProbability * 100).toFixed(1)}%`;
};

/**
 * 格式化属性修正显示
 * @param attributeBonus 属性修正值
 * @returns 格式化后的字符串
 */
export const formatAttributeBonus = (attributeBonus: number): string => {
  return `-${(attributeBonus * 100).toFixed(1)}%`;
};

/**
 * 格式化装备修正显示
 * @param equipmentBonus 装备修正值
 * @returns 格式化后的字符串
 */
export const formatEquipmentBonus = (equipmentBonus: number): string => {
  return `-${(equipmentBonus * 100).toFixed(1)}%`;
};
