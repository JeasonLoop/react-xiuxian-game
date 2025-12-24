// Unique ID generator
// 改进的 uid 生成函数，使用时间戳+随机数确保唯一性
let uidCounter = 0;
export const uid = () => {
  uidCounter++;
  return `${Date.now()}-${uidCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 安全的随机选择函数
 * 从数组中随机选择一个元素，如果数组为空则返回null
 * @param array 要选择的数组
 * @returns 随机选择的元素，如果数组为空则返回null
 */
export function safeRandomPick<T>(array: T[]): T | null {
  if (!array || array.length === 0) {
    return null;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 安全的随机选择函数（带默认值）
 * 从数组中随机选择一个元素，如果数组为空则返回默认值
 * @param array 要选择的数组
 * @param fallback 默认值
 * @returns 随机选择的元素，如果数组为空则返回默认值
 */
export function safeRandomPickWithFallback<T>(
  array: T[],
  fallback: T
): T {
  return safeRandomPick(array) ?? fallback;
}