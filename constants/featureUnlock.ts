/**
 * 境界解锁系统
 * 定义每个功能在哪个境界解锁，控制游戏节奏和玩家引导
 */

import { RealmType } from '../types';

// 功能ID
export const FeatureId = {
  // 核心功能（炼气期即可用）
  MEDITATE: 'meditate',
  ADVENTURE: 'adventure',
  INVENTORY: 'inventory',
  CHARACTER: 'character',
  SHOP: 'shop',
  SETTINGS: 'settings',

  // 筑基期解锁
  CULTIVATION_ARTS: 'cultivation_arts',
  SECT: 'sect',
  PET: 'pet',
  LOTTERY: 'lottery',
  ACHIEVEMENT: 'achievement',

  // 金丹期解锁
  SECRET_REALM: 'secret_realm',
  ALCHEMY: 'alchemy',
  GROTTO: 'grotto',
  DAILY_QUEST: 'daily_quest',
  EQUIPMENT_UPGRADE: 'equipment_upgrade',

  // 元婴期解锁
  NATAL_ARTIFACT: 'natal_artifact',

  // 化神期解锁
  TREASURE_VAULT: 'treasure_vault',
  INHERITANCE: 'inheritance',
} as const;

export type FeatureIdType = (typeof FeatureId)[keyof typeof FeatureId];

interface FeatureUnlockDef {
  featureId: FeatureIdType;
  name: string; // 显示名称
  description: string; // 解锁时的提示文案
  minRealm: RealmType; // 最低境界要求
}

// 境界索引映射
const REALM_INDEX: Record<RealmType, number> = {
  [RealmType.QiRefining]: 0,
  [RealmType.Foundation]: 1,
  [RealmType.GoldenCore]: 2,
  [RealmType.NascentSoul]: 3,
  [RealmType.SpiritSevering]: 4,
  [RealmType.DaoCombining]: 5,
  [RealmType.LongevityRealm]: 6,
};

// 功能解锁定义
export const FEATURE_UNLOCK_DEFS: FeatureUnlockDef[] = [
  // ===== 炼气期 — 核心玩法 =====
  {
    featureId: FeatureId.MEDITATE,
    name: '修炼打坐',
    description: '打坐修炼，积累修为，踏上仙途',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.ADVENTURE,
    name: '外出历练',
    description: '闯荡修仙界，获取机缘与宝物',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.INVENTORY,
    name: '储物袋',
    description: '管理你的物品与装备',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.CHARACTER,
    name: '角色面板',
    description: '查看修为、属性与灵根',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.SHOP,
    name: '坊市',
    description: '买卖物品，互通有无',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.SETTINGS,
    name: '设置',
    description: '调整游戏参数',
    minRealm: RealmType.QiRefining,
  },

  // ===== 炼气期 — 功法 =====
  {
    featureId: FeatureId.CULTIVATION_ARTS,
    name: '功法修炼',
    description: '学习与修炼高深功法，提升实力',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.SECT,
    name: '加入宗门',
    description: '拜入仙门，获得宗门资源与庇护',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.PET,
    name: '灵宠系统',
    description: '收服灵宠，培养战斗伙伴',
    minRealm: RealmType.QiRefining,
  },
  // {
  //   featureId: FeatureId.LOTTERY,
  //   name: '仙缘抽奖',
  //   description: '消耗抽奖券，博取天材地宝',
  //   minRealm: RealmType.QiRefining,
  // },
  {
    featureId: FeatureId.ACHIEVEMENT,
    name: '成就系统',
    description: '记录修仙路上的伟业与里程碑',
    minRealm: RealmType.QiRefining,
  },

  // ===== 金丹期 — 深度系统 =====
  // {
  //   featureId: FeatureId.SECRET_REALM,
  //   name: '秘境探索',
  //   description: '深入秘境，挑战强敌，夺取稀世珍宝',
  //   minRealm: RealmType.QiRefining,
  // },
  // {
  //   featureId: FeatureId.ALCHEMY,
  //   name: '炼丹术',
  //   description: '炼制灵丹妙药，辅助修炼',
  //   minRealm: RealmType.QiRefining,
  // },
  {
    featureId: FeatureId.GROTTO,
    name: '洞府',
    description: '开辟洞府，种植灵草，建造聚灵阵',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.DAILY_QUEST,
    name: '日常任务',
    description: '完成每日任务，获取稳定资源',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.EQUIPMENT_UPGRADE,
    name: '装备强化',
    description: '强化法宝装备，百炼成仙',
    minRealm: RealmType.QiRefining,
  },

  // ===== 元婴期 — 高级能力 =====
  {
    featureId: FeatureId.NATAL_ARTIFACT,
    name: '本命法宝',
    description: '炼制本命法宝，人宝合一',
    minRealm: RealmType.QiRefining,
  },

  // ===== 化神期 — 终局内容 =====
  {
    featureId: FeatureId.TREASURE_VAULT,
    name: '宗门宝库',
    description: '开启宗门宝库，获取镇派之宝',
    minRealm: RealmType.QiRefining,
  },
  {
    featureId: FeatureId.INHERITANCE,
    name: '传承之力',
    description: '觉醒前世传承，突破境界桎梏',
    minRealm: RealmType.QiRefining,
  },
];

/**
 * 检查指定功能是否已解锁
 */
export function isFeatureUnlocked(
  featureId: FeatureIdType,
  realm: RealmType
): boolean {
  const def = FEATURE_UNLOCK_DEFS.find((d) => d.featureId === featureId);
  if (!def) return true; // 未知功能默认解锁
  return REALM_INDEX[realm] >= REALM_INDEX[def.minRealm];
}

/**
 * 获取某个境界新解锁的功能列表（用于升级通知）
 */
export function getNewlyUnlockedFeatures(
  oldRealm: RealmType,
  newRealm: RealmType
): FeatureUnlockDef[] {
  const oldIdx = REALM_INDEX[oldRealm];
  const newIdx = REALM_INDEX[newRealm];
  if (newIdx <= oldIdx) return [];

  return FEATURE_UNLOCK_DEFS.filter((d) => {
    const minIdx = REALM_INDEX[d.minRealm];
    return minIdx > oldIdx && minIdx <= newIdx;
  });
}

/**
 * 获取指定境界及以下所有已解锁功能
 */
export function getUnlockedFeatures(realm: RealmType): FeatureUnlockDef[] {
  const idx = REALM_INDEX[realm];
  return FEATURE_UNLOCK_DEFS.filter(
    (d) => REALM_INDEX[d.minRealm] <= idx
  );
}

/**
 * 获取指定境界下某个功能的最低境界要求文本
 */
export function getFeatureRequirementText(
  featureId: FeatureIdType
): string {
  const def = FEATURE_UNLOCK_DEFS.find((d) => d.featureId === featureId);
  if (!def) return '';
  return `${def.minRealm} 解锁`;
}
