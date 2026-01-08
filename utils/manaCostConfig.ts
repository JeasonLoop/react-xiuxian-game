/**
 * 灵力消耗配置模块
 * 集中管理所有灵力相关数值,便于平衡性调整
 */

// ==================== 灵力总量计算配置 ====================

export interface ManaCalculationConfig {
  baseMana: number; // 基础灵力值
  realmMultiplier: number; // 每境界的灵力加成
  levelMultiplier: number; // 每境界等级的灵力加成
  spiritMultiplier: number; // 神识转化为灵力的比例
}

/**
 * 灵力总量计算配置
 * 用于计算战斗开始时玩家的最大灵力值
 */
export const MANA_CALCULATION: ManaCalculationConfig = {
  baseMana: 60, // 基础灵力值(原50,提升20%)
  realmMultiplier: 70, // 每境界增加70点(原50,提升40%)
  levelMultiplier: 15, // 每境界等级增加15点(原10,提升50%)
  spiritMultiplier: 0.8, // 神识的80%转化为灵力(原0.5,提升60%)
};

// ==================== 技能消耗配置 ====================

export interface SkillCostConfig {
  baseCost: number; // 基础消耗
  gradeBonus: Record<string, number>; // 品级加成
  typeMultiplier: number; // 类型倍数
}

/**
 * 体术类技能消耗配置
 * 对应功法 type: 'body'
 */
export const BODY_SKILL_COST: SkillCostConfig = {
  baseCost: 15, // 基础消耗
  gradeBonus: {
    '黄': 10,
    '玄': 25,
    '地': 45,
    '天': 75,
  },
  typeMultiplier: 1.0,
};

/**
 * 心法类Buff技能消耗配置
 * 对应功法 type: 'mental' 且有 expRate 加成
 */
export const MENTAL_BUFF_SKILL_COST: SkillCostConfig = {
  baseCost: 20, // 基础消耗
  gradeBonus: {
    '黄': 15,
    '玄': 30,
    '地': 55,
    '天': 90,
  },
  typeMultiplier: 1.0,
};

/**
 * 心法类攻击技能消耗配置
 * 对应功法 type: 'mental' 且无 expRate 加成
 */
export const MENTAL_ATTACK_SKILL_COST: SkillCostConfig = {
  baseCost: 25, // 基础消耗
  gradeBonus: {
    '黄': 20,
    '玄': 40,
    '地': 70,
    '天': 110,
  },
  typeMultiplier: 1.0,
};

// ==================== 威力调整配置 ====================

export interface SkillPowerConfig {
  baseDamageBonus: Record<string, number>; // 品级基础伤害加成
  damageMultiplierBonus: Record<string, number>; // 品级伤害倍率加成
  critChanceBonus: Record<string, number>; // 品级暴击率加成
  critMultiplierBonus: Record<string, number>; // 品级暴击倍率加成
}

/**
 * 技能威力增强配置
 * 用于平衡消耗提升后的技能威力
 */
export const SKILL_POWER_BONUS: SkillPowerConfig = {
  baseDamageBonus: {
    '黄': 5, // 基础伤害+5
    '玄': 10, // 基础伤害+10
    '地': 20, // 基础伤害+20
    '天': 40, // 基础伤害+40
  },
  damageMultiplierBonus: {
    '黄': 0.0, // 倍率不变
    '玄': 0.1, // 倍率+10%
    '地': 0.2, // 倍率+20%
    '天': 0.35, // 倍率+35%
  },
  critChanceBonus: {
    '黄': 0.0,
    '玄': 0.02, // 暴击率+2%
    '地': 0.05, // 暴击率+5%
    '天': 0.08, // 暴击率+8%
  },
  critMultiplierBonus: {
    '黄': 0.0,
    '玄': 0.1, // 暴击倍率+10%
    '地': 0.2, // 暴击倍率+20%
    '天': 0.3, // 暴击倍率+30%
  },
};

// ==================== 计算函数 ====================

/**
 * 计算灵力总量
 * @param realmIndex 境界索引(0=炼气期, 1=筑基期, ...)
 * @param realmLevel 境界等级(1-9)
 * @param spirit 神识值
 * @returns 最大灵力值
 */
export function calculateMaxMana(
  realmIndex: number,
  realmLevel: number,
  spirit: number
): number {
  const config = MANA_CALCULATION;
  const base = config.baseMana;
  const realmBonus = realmIndex * config.realmMultiplier;
  const levelBonus = Math.max(0, realmLevel - 1) * config.levelMultiplier;
  const spiritBonus = Math.floor(spirit * config.spiritMultiplier);

  return base + realmBonus + levelBonus + spiritBonus;
}

/**
 * 计算体术类技能消耗
 * @param grade 功法品级
 * @returns 灵力消耗
 */
export function calculateBodySkillCost(grade: string): number {
  const config = BODY_SKILL_COST;
  const bonus = config.gradeBonus[grade] || 10;
  return Math.floor(config.baseCost + bonus);
}

/**
 * 计算心法类Buff技能消耗
 * @param grade 功法品级
 * @returns 灵力消耗
 */
export function calculateMentalBuffSkillCost(grade: string): number {
  const config = MENTAL_BUFF_SKILL_COST;
  const bonus = config.gradeBonus[grade] || 15;
  return Math.floor(config.baseCost + bonus);
}

/**
 * 计算心法类攻击技能消耗
 * @param grade 功法品级
 * @returns 灵力消耗
 */
export function calculateMentalAttackSkillCost(grade: string): number {
  const config = MENTAL_ATTACK_SKILL_COST;
  const bonus = config.gradeBonus[grade] || 20;
  return Math.floor(config.baseCost + bonus);
}

/**
 * 计算技能威力加成
 * @param grade 功法品级
 * @param baseDamage 基础伤害
 * @param damageMultiplier 伤害倍率
 * @returns { baseDamage, damageMultiplier, critChance, critMultiplier }
 */
export function calculateSkillPowerBonus(
  grade: string,
  baseDamage: number = 0,
  damageMultiplier: number = 0
): {
  baseDamage: number;
  damageMultiplier: number;
  critChance: number;
  critMultiplier: number;
} {
  const config = SKILL_POWER_BONUS;

  return {
    baseDamage: baseDamage + (config.baseDamageBonus[grade] || 0),
    damageMultiplier: damageMultiplier + (config.damageMultiplierBonus[grade] || 0),
    critChance: config.critChanceBonus[grade] || 0,
    critMultiplier: config.critMultiplierBonus[grade] || 0,
  };
}

/**
 * 根据功法类型和品级计算技能消耗
 * @param artType 功法类型 ('body' | 'mental')
 * @param grade 功法品级
 * @param hasExpRate 是否有修炼速度加成(用于判断心法技能类型)
 * @returns 灵力消耗
 */
export function calculateSkillCost(
  artType: string,
  grade: string,
  hasExpRate: boolean = false
): number {
  if (artType === 'body') {
    return calculateBodySkillCost(grade);
  } else if (artType === 'mental') {
    if (hasExpRate) {
      return calculateMentalBuffSkillCost(grade);
    } else {
      return calculateMentalAttackSkillCost(grade);
    }
  }
  return 20; // 默认值
}

// ==================== 辅助函数 ====================

/**
 * 获取品级倍数(用于兼容旧代码)
 * @param grade 功法品级
 * @returns 品级倍数
 */
export function getGradeMultiplier(grade: string): number {
  const multipliers: Record<string, number> = {
    '黄': 1.0,
    '玄': 1.5,
    '地': 2.5,
    '天': 4.0,
  };
  return multipliers[grade] || 1.0;
}

/**
 * 验证消耗配置是否合理
 * @returns 验证结果和错误信息
 */
export function validateCostConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查消耗是否合理
  const maxCost = Math.max(
    ...Object.values(BODY_SKILL_COST.gradeBonus),
    ...Object.values(MENTAL_BUFF_SKILL_COST.gradeBonus),
    ...Object.values(MENTAL_ATTACK_SKILL_COST.gradeBonus)
  );

  if (maxCost > 200) {
    errors.push('最高技能消耗超过200,可能导致战斗困难');
  }

  // 检查基础值是否合理
  if (MANA_CALCULATION.baseMana < 50) {
    errors.push('基础灵力值过低,可能影响早期游戏体验');
  }

  if (MANA_CALCULATION.baseMana > 100) {
    errors.push('基础灵力值过高,可能影响早期游戏平衡');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
