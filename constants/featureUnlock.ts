/**
 * 功能开关系统
 * 当前版本默认全开放；保留 API 给导航和旧存档调用。
 */

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

  // 交易行
  TRADE_MARKET: 'trade_market',
} as const;

export type FeatureIdType = (typeof FeatureId)[keyof typeof FeatureId];

interface FeatureUnlockDef {
  featureId: FeatureIdType;
  name: string; // 显示名称
  description: string; // 解锁时的提示文案
}

// 功能定义
export const FEATURE_UNLOCK_DEFS: FeatureUnlockDef[] = [
  // ===== 炼气期 — 核心玩法 =====
  {
    featureId: FeatureId.MEDITATE,
    name: '修炼打坐',
    description: '打坐修炼，积累修为，踏上仙途',
  },
  {
    featureId: FeatureId.ADVENTURE,
    name: '外出历练',
    description: '闯荡修仙界，获取机缘与宝物',
  },
  {
    featureId: FeatureId.INVENTORY,
    name: '储物袋',
    description: '管理你的物品与装备',
  },
  {
    featureId: FeatureId.CHARACTER,
    name: '角色面板',
    description: '查看修为、属性与灵根',
  },
  {
    featureId: FeatureId.SHOP,
    name: '坊市',
    description: '买卖物品，互通有无',
  },
  {
    featureId: FeatureId.SETTINGS,
    name: '设置',
    description: '调整游戏参数',
  },

  // ===== 炼气期 — 功法 =====
  {
    featureId: FeatureId.CULTIVATION_ARTS,
    name: '功法修炼',
    description: '学习与修炼高深功法，提升实力',
  },
  {
    featureId: FeatureId.SECT,
    name: '加入宗门',
    description: '拜入仙门，获得宗门资源与庇护',
  },
  {
    featureId: FeatureId.PET,
    name: '灵宠系统',
    description: '收服灵宠，培养战斗伙伴',
  },
  {
    featureId: FeatureId.LOTTERY,
    name: '仙缘抽奖',
    description: '消耗抽奖券，博取天材地宝',
  },
  {
    featureId: FeatureId.ACHIEVEMENT,
    name: '成就系统',
    description: '记录修仙路上的伟业与里程碑',
  },

  // ===== 金丹期 — 深度系统 =====
  {
    featureId: FeatureId.SECRET_REALM,
    name: '秘境探索',
    description: '深入秘境，挑战强敌，夺取稀世珍宝',
  },
  {
    featureId: FeatureId.ALCHEMY,
    name: '炼丹术',
    description: '炼制灵丹妙药，辅助修炼',
  },
  {
    featureId: FeatureId.GROTTO,
    name: '洞府',
    description: '开辟洞府，种植灵草，建造聚灵阵',
  },
  {
    featureId: FeatureId.DAILY_QUEST,
    name: '日常任务',
    description: '完成每日任务，获取稳定资源',
  },
  {
    featureId: FeatureId.EQUIPMENT_UPGRADE,
    name: '装备强化',
    description: '强化法宝装备，百炼成仙',
  },

  // ===== 元婴期 — 高级能力 =====
  {
    featureId: FeatureId.NATAL_ARTIFACT,
    name: '本命法宝',
    description: '炼制本命法宝，人宝合一',
  },

  // ===== 化神期 — 终局内容 =====
  {
    featureId: FeatureId.TREASURE_VAULT,
    name: '宗门宝库',
    description: '开启宗门宝库，获取镇派之宝',
  },
  {
    featureId: FeatureId.INHERITANCE,
    name: '传承之力',
    description: '觉醒前世传承，突破境界桎梏',
  },
  {
    featureId: FeatureId.TRADE_MARKET,
    name: '交易行',
    description: '浏览各路修士寄售的奇珍异宝',
  },
];

/**
 * 检查指定功能是否已解锁
 */
export function isFeatureUnlocked(
  _featureId: FeatureIdType,
  _realm: unknown
): boolean {
  return true;
}

/**
 * 获取某个境界新解锁的功能列表（用于升级通知）
 */
export function getNewlyUnlockedFeatures(
  _oldRealm: unknown,
  _newRealm: unknown
): FeatureUnlockDef[] {
  return [];
}

/**
 * 获取指定境界及以下所有已解锁功能
 */
export function getUnlockedFeatures(_realm: unknown): FeatureUnlockDef[] {
  return FEATURE_UNLOCK_DEFS;
}

/**
 * 获取指定境界下某个功能的最低境界要求文本
 */
export function getFeatureRequirementText(
  _featureId: FeatureIdType
): string {
  return '';
}
