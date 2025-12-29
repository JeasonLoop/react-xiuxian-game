/**
 * 存储键名常量
 * 统一管理所有 localStorage 和 sessionStorage 的键名
 */

/**
 * 主要存储键
 */
export const STORAGE_KEYS = {
  /** 游戏存档键 */
  SAVE: 'xiuxian-game-save',
  /** 游戏设置键 */
  SETTINGS: 'xiuxian-game-settings',
  /** 调试模式键 */
  DEBUG_MODE: 'xiuxian-debug-mode',
  /** 是否已显示修仙法门弹窗 */
  CULTIVATION_INTRO_SHOWN: 'xiuxian-cultivation-intro-shown',
} as const;

/**
 * 存档槽位相关键
 */
export const SAVE_SLOT_KEYS = {
  /** 存档槽位前缀 */
  SLOT_PREFIX: 'xiuxian-game-save-slot-',
  /** 存档备份前缀 */
  BACKUP_PREFIX: 'xiuxian-game-save-backup-',
  /** 当前使用的存档槽位键 */
  CURRENT_SLOT: 'xiuxian-game-current-slot',
  /** 最大存档槽位数 */
  MAX_SLOTS: 10,
  /** 每个存档槽位最大备份数 */
  MAX_BACKUPS: 5,
} as const;

/**
 * 获取存档槽位的存储键
 * @param slotId 存档槽位ID
 * @returns 存储键名
 */
export const getSlotKey = (slotId: number): string => {
  return `${SAVE_SLOT_KEYS.SLOT_PREFIX}${slotId}`;
};

/**
 * 获取存档备份的存储键
 * @param slotId 存档槽位ID
 * @param backupIndex 备份索引
 * @returns 存储键名
 */
export const getBackupKey = (slotId: number, backupIndex: number): string => {
  return `${SAVE_SLOT_KEYS.BACKUP_PREFIX}${slotId}-${backupIndex}`;
};
