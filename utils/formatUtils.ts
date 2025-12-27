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
 * 格式化大数值，使用K/M/B缩写
 * @param num 要格式化的数字
 * @param decimals 小数位数（默认1位）
 * @returns 格式化后的字符串（如：1.2M）
 * @example
 * formatLargeNumber(1234567) // "1.2M"
 * formatLargeNumber(1500) // "1.5K"
 * formatLargeNumber(999) // "999"
 */
export const formatLargeNumber = (num: number, decimals: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum < 1000) {
    return num.toString();
  } else if (absNum < 1000000) {
    return (num / 1000).toFixed(decimals) + 'K';
  } else if (absNum < 1000000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else {
    return (num / 1000000000).toFixed(decimals) + 'B';
  }
};

/**
 * 格式化百分比
 * @param value 百分比值（0-1之间）
 * @param decimals 小数位数（默认0位）
 * @returns 格式化后的百分比字符串（如：50%）
 * @example
 * formatPercent(0.5) // "50%"
 * formatPercent(0.1234, 2) // "12.34%"
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return (value * 100).toFixed(decimals) + '%';
};

/**
 * 智能格式化百分比（根据数值自动决定小数位数）
 * @param value 百分比值（0-1之间）
 * @returns 格式化后的百分比字符串
 * @example
 * formatSmartPercent(0.0005) // "0.05%"
 * formatSmartPercent(0.123) // "12.3%"
 * formatSmartPercent(0.99) // "99%"
 */
export const formatSmartPercent = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  
  const percent = value * 100;
  
  // 限制在0-100%之间
  if (percent >= 100) return '100%';
  if (percent <= 0) return '0%';
  
  // 根据大小自动决定小数位数
  if (percent < 10) {
    return percent.toFixed(1) + '%';
  } else if (percent < 1) {
    return percent.toFixed(2) + '%';
  } else {
    return percent.toFixed(0) + '%';
  }
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
 * 格式化时间显示（秒 → 天/时/分/秒）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 * @example
 * formatDuration(3661) // "1小时1分1秒"
 * formatDuration(86400) // "1天"
 */
export const formatDuration = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0秒';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  
  if (days > 0) {
    if (days > 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      if (remainingDays > 0) {
        parts.push(`${years}年${remainingDays}天`);
      } else {
        parts.push(`${years}年`);
      }
    } else {
      parts.push(`${days}天`);
    }
  }
  
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes}分`);
  }
  
  if (secs > 0 && hours === 0 && days === 0) {
    parts.push(`${secs}秒`);
  }
  
  return parts.length > 0 ? parts.join('') : '0秒';
};

/**
 * 格式化游戏时间（天数 → 年/天）
 * @param days 游戏天数
 * @returns 格式化后的时间字符串
 * @example
 * formatGameTime(400) // "1年35天"
 * formatGameTime(50) // "50天"
 */
export const formatGameTime = (days: number): string => {
  if (typeof days !== 'number' || isNaN(days) || days < 0) return '0天';
  
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays > 0) {
      return `${years}年${remainingDays}天`;
    } else {
      return `${years}年`;
    }
  }
  
  return `${days}天`;
};

/**
 * 格式化属性增益/减益
 * @param oldValue 旧属性值
 * @param gain 增益值（正数或负数）
 * @returns 格式化后的增益字符串，包含颜色类名建议
 * @example
 * formatStatGain(100, 20) // { text: "100 → 120 (+20)", isPositive: true }
 * formatStatGain(100, -10) // { text: "100 → 90 (-10)", isPositive: false }
 */
export const formatStatGain = (oldValue: number, gain: number): { text: string; isPositive: boolean } => {
  const newValue = oldValue + gain;
  const text = formatValueChange(oldValue, newValue, true);
  return { text, isPositive: gain >= 0 };
};

/**
 * 格式化灵石数量（使用K/M/B缩写）
 * @param amount 灵石数量
 * @returns 格式化后的灵石字符串
 * @example
 * formatSpiritStones(1234567) // "1.2M 灵石"
 * formatSpiritStones(1000) // "1.0K 灵石"
 */
export const formatSpiritStones = (amount: number): string => {
  return formatLargeNumber(amount) + ' 灵石';
};

/**
 * 格式化修为（使用K/M/B缩写）
 * @param exp 修为值
 * @returns 格式化后的修为字符串
 * @example
 * formatExp(1234567) // "1.2M 修为"
 * formatExp(500) // "500 修为"
 */
export const formatExp = (exp: number): string => {
  return formatLargeNumber(exp) + ' 修为';
};

/**
 * 格式化属性点范围
 * @param min 最小值
 * @param max 最大值
 * @returns 格式化后的范围字符串
 * @example
 * formatRange(10, 20) // "10-20"
 * formatRange(100, 100) // "100"
 */
export const formatRange = (min: number, max: number): string => {
  if (typeof min !== 'number' || typeof max !== 'number') return 'N/A';
  
  if (min === max) {
    return formatNumber(min);
  }
  
  return `${formatNumber(min)}-${formatNumber(max)}`;
};

/**
 * 格式化概率范围
 * @param min 最小概率（0-1）
 * @param max 最大概率（0-1）
 * @returns 格式化后的概率范围字符串
 * @example
 * formatProbRange(0.1, 0.2) // "10%-20%"
 * formatProbRange(0.5, 0.5) // "50%"
 */
export const formatProbRange = (min: number, max: number): string => {
  if (typeof min !== 'number' || typeof max !== 'number') return 'N/A';
  
  if (min === max) {
    return formatSmartPercent(min);
  }
  
  return `${formatSmartPercent(min)}-${formatSmartPercent(max)}`;
};

/**
 * 截断文本并添加省略号
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 * @example
 * truncateText("这是一个很长的文本", 5) // "这是一个..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (typeof text !== 'string') return '';

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
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
