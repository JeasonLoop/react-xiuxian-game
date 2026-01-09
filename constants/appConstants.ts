/**
 * App组件性能优化常量
 * 提取硬编码的数值和配置，便于维护和性能优化
 */

// 延迟和定时器常量
export const DELAY_CONSTANTS = {
  // 组件加载延迟
  CULTIVATION_INTRO_DELAY: 500,
  AUTO_ADVENTURE_RESUME_DELAY: 300,
  
  // 动画和效果延迟
  ITEM_ACTION_LOG_CLEAR_DELAY: 3000,
  VISUAL_EFFECT_DURATION: 1000,
  
  // 自动功能间隔
  AUTO_MEDITATE_INTERVAL: 1000,
  AUTO_ADVENTURE_INTERVAL: 2000,
  PASSIVE_REGENERATION_INTERVAL: 5000,
} as const;

// 游戏状态阈值常量
export const THRESHOLD_CONSTANTS = {
  // 血量阈值
  MIN_HP_THRESHOLD: 20,
  DEATH_HP_THRESHOLD: 0,
  CRITICAL_HP_THRESHOLD: 10,
  
  // 自动功能暂停条件
  AUTO_PAUSE_BY_BATTLE: true,
  AUTO_PAUSE_BY_SHOP: true,
  AUTO_PAUSE_BY_REPUTATION_EVENT: true,
  
  // 新游戏检测条件
  NEW_GAME_EXP_THRESHOLD: 0,
  NEW_GAME_REALM_LEVEL_THRESHOLD: 1,
} as const;

// 存储键常量
export const STORAGE_CONSTANTS = {
  // 调试模式
  DEBUG_MODE_KEY: 'debugMode',
  
  // 引导和教程
  CULTIVATION_INTRO_SHOWN_KEY: 'cultivationIntroShown',
  
  // 游戏设置
  GAME_SETTINGS_KEY: 'gameSettings',
  PLAYER_DATA_KEY: 'playerData',
  
  // 自动功能状态
  AUTO_MEDITATE_KEY: 'autoMeditate',
  AUTO_ADVENTURE_KEY: 'autoAdventure',
} as const;

// 模态框配置常量
export const MODAL_CONSTANTS = {
  // 模态框类型
  MODAL_TYPES: {
    INVENTORY: 'inventory',
    CULTIVATION: 'cultivation',
    ALCHEMY: 'alchemy',
    UPGRADE: 'upgrade',
    SECT: 'sect',
    REALM: 'realm',
    CHARACTER: 'character',
    ACHIEVEMENT: 'achievement',
    PET: 'pet',
    LOTTERY: 'lottery',
    SETTINGS: 'settings',
    DAILY_QUEST: 'dailyQuest',
    SHOP: 'shop',
    GROTTO: 'grotto',
    DEBUG: 'debug',
    BATTLE_MODAL: 'battleModal',
    TURN_BASED_BATTLE: 'turnBasedBattle',
    REPUTATION_EVENT: 'reputationEvent',
    TREASURE_VAULT: 'treasureVault',
  } as const,
  
  // 模态框默认状态
  DEFAULT_MODAL_STATES: {
    isInventoryOpen: false,
    isCultivationOpen: false,
    isAlchemyOpen: false,
    isUpgradeOpen: false,
    isSectOpen: false,
    isRealmOpen: false,
    isCharacterOpen: false,
    isAchievementOpen: false,
    isPetOpen: false,
    isLotteryOpen: false,
    isSettingsOpen: false,
    isDailyQuestOpen: false,
    isShopOpen: false,
    isGrottoOpen: false,
    isDebugOpen: false,
    isBattleModalOpen: false,
    isTurnBasedBattleOpen: false,
    isReputationEventOpen: false,
    isTreasureVaultOpen: false,
    isDebugModeEnabled: false,
  } as const,
} as const;

// 自动历练配置常量
export const AUTO_ADVENTURE_CONSTANTS = {
  // 默认配置
  DEFAULT_CONFIG: {
    skipBattle: true,
    fleeOnBattle: false,
    skipShop: true,
    skipReputationEvent: true,
    minHpThreshold: 20,
  } as const,
  
  // 配置选项
  CONFIG_OPTIONS: {
    SKIP_BATTLE: 'skipBattle',
    FLEE_ON_BATTLE: 'fleeOnBattle',
    SKIP_SHOP: 'skipShop',
    SKIP_REPUTATION_EVENT: 'skipReputationEvent',
    MIN_HP_THRESHOLD: 'minHpThreshold',
  } as const,
} as const;

// 游戏效果常量
export const VISUAL_EFFECT_CONSTANTS = {
  // 效果类型
  EFFECT_TYPES: {
    GAIN: 'gain',
    LOSS: 'loss',
    NORMAL: 'normal',
    CRITICAL: 'critical',
    SPECIAL: 'special',
  } as const,
  
  // 效果持续时间
  DURATION: {
    SHORT: 1000,
    MEDIUM: 2000,
    LONG: 3000,
  } as const,
} as const;

// 性能优化常量
export const PERFORMANCE_CONSTANTS = {
  // 批量更新阈值
  BATCH_UPDATE_THRESHOLD: 10,
  
  // 防抖延迟
  DEBOUNCE_DELAY: 300,
  
  // 节流间隔
  THROTTLE_INTERVAL: 100,
  
  // 最大重渲染次数
  MAX_RERENDER_COUNT: 3,
} as const;

// 错误处理常量
export const ERROR_CONSTANTS = {
  // 错误类型
  ERROR_TYPES: {
    LOAD_FAILED: 'loadFailed',
    SAVE_FAILED: 'saveFailed',
    BATTLE_ERROR: 'battleError',
    CULTIVATION_ERROR: 'cultivationError',
    ITEM_ERROR: 'itemError',
  } as const,
  
  // 错误消息
  ERROR_MESSAGES: {
    LOAD_FAILED: '游戏加载失败，请检查存储空间',
    SAVE_FAILED: '游戏保存失败，请检查存储空间',
    BATTLE_ERROR: '战斗处理异常',
    CULTIVATION_ERROR: '修炼过程异常',
    ITEM_ERROR: '物品操作异常',
  } as const,
} as const;

// 导出所有常量
export default {
  DELAY_CONSTANTS,
  THRESHOLD_CONSTANTS,
  STORAGE_CONSTANTS,
  MODAL_CONSTANTS,
  AUTO_ADVENTURE_CONSTANTS,
  VISUAL_EFFECT_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  ERROR_CONSTANTS,
};