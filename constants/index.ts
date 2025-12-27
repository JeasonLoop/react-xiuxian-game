/**
 * 常量模块主入口
 * 将所有常量统一导出，方便全局引用
 *
 * 文件组织说明：
 * - 核心系统：境界、功法、灵根
 * - 物品系统：物品、物品模板、装备
 * - 功能模块：宗门、秘境、灵宠、战斗
 * - 进阶系统：进阶物品、天地之魄、渡劫
 * - 游戏功能：抽奖、商店、日常任务、洞府
 * - 工具常量：存储键、表情包
 */

// ==================== 核心系统 ====================

// 境界相关
export * from './realms';

// 功法相关
export * from './cultivation';

// 灵根相关
export * from './spiritualRoots';

// ==================== 物品系统 ====================

// 物品相关（初始物品、丹方、丹药定义等）
export * from './items';

// 物品模板系统（自动生成的装备、丹药、草药、材料模板）
export * from './itemTemplates';

// 装备模板（从物品模板中提取的可装备物品）
export * from './equipment';

// ==================== 功能模块 ====================

// 宗门相关
export * from './sects';

// 秘境相关
export * from './secretRealms';

// 灵宠相关
export * from './pets';

// 战斗相关
export * from './battle';

// 天赋称号相关
export * from './talents';

// ==================== 进阶系统 ====================

// 进阶物品相关（筑基奇物、天地精华、天地之髓、规则之力）
export * from './advanced';

// 天地之魄相关
export * from './heavenEarth';

// 渡劫相关
export * from './tribulation';

// ==================== 游戏功能 ====================

// 抽奖相关
export * from './lottery';

// 商店相关
export * from './shop';

// 日常任务相关
export * from './dailyQuest';

// 洞府相关
export * from './grotto';

// ==================== 工具常量 ====================

// 存储键相关
export * from './storageKeys';

// 表情包相关
export * from './emojis';
