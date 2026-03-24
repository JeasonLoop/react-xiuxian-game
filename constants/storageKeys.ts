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
  /** 是否已显示打坐/历练操作栏引导 */
  ACTION_BAR_GUIDE_SHOWN: 'xiuxian-action-bar-guide-shown',
  /** 云灵修仙本地存档备份键 */
  SAVE_BACKUP: 'xiuxian-game-save-backup',
} as const;
