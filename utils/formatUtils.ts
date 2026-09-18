/**
 * 数值格式化工具库
 * 用于统一处理游戏中的数值显示，提高可读性
 */

/**
 * 格式化大数值，添加千分位分隔符
 * @param num 要格式化的数字
 * @returns 格式化后的字符串（如：1,234,567）
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(100) // "100"
 */
export const formatNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('zh-CN');
};

/**
 * 格式化数值对比（显示前后值和差值）
 * @param oldValue 旧值
 * @param newValue 新值
 * @param showDiff 是否显示差值（默认true）
 * @returns 格式化后的对比字符串
 * @example
 * formatValueChange(100, 115) // "100 → 115 (+15)"
 * formatValueChange(200, 150) // "200 → 150 (-50)"
 */
export const formatValueChange = (oldValue: number, newValue: number, showDiff: boolean = true): string => {
  if (typeof oldValue !== 'number' || typeof newValue !== 'number') return 'N/A';

  const diff = newValue - oldValue;
  const sign = diff > 0 ? '+' : '';

  const result = `${formatNumber(oldValue)} → ${formatNumber(newValue)}`;

  if (showDiff) {
    return `${result} (${sign}${formatNumber(diff)})`;
  }

  return result;
};

/**
 * 格式化毫秒为游戏时间显示（用于洞府、种植等场景）
 * @param milliseconds 毫秒数
 * @returns 格式化后的时间字符串
 * @example
 * formatGrottoTime(0) // "已完成"
 * formatGrottoTime(30000) // "1分钟"
 * formatGrottoTime(3600000) // "1小时"
 * formatGrottoTime(3660000) // "1小时1分钟"
 */
export const formatGrottoTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '已完成';

  const totalMinutes = Math.ceil(milliseconds / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${minutes}分钟`;
};
