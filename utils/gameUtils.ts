// Unique ID generator
// 改进的 uid 生成函数，使用时间戳+随机数确保唯一性
let uidCounter = 0;
export const uid = () => {
  uidCounter++;
  return `${Date.now()}-${uidCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

// localStorage 键名
export const SAVE_KEY = 'xiuxian-game-save';
export const SETTINGS_KEY = 'xiuxian-game-settings';
