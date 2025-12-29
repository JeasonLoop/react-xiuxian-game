/**
 * 对象比较工具函数
 * 用于替代 JSON.stringify 进行对象比较，提高性能
 */

/**
 * 深度比较两个对象是否相等
 * 比 JSON.stringify 更快，且不依赖属性顺序
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;

    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      if (!deepEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

/**
 * 比较两个物品的效果是否相等
 * 专门用于物品效果比较，性能优化版本
 */
export function compareItemEffects(
  effect1: any,
  effect2: any,
  permanentEffect1?: any,
  permanentEffect2?: any
): boolean {
  // 快速路径：如果都是 undefined 或 null
  if (!effect1 && !effect2 && !permanentEffect1 && !permanentEffect2) return true;

  // 比较 effect
  if (!deepEqual(effect1 || {}, effect2 || {})) return false;

  // 比较 permanentEffect
  if (!deepEqual(permanentEffect1 || {}, permanentEffect2 || {})) return false;

  return true;
}

