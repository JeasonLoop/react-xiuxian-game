/**
 * 延迟状态工具函数
 * 用于在非组件环境中安全地设置延迟状态
 * 返回清理函数，需要在适当时机调用
 */

/**
 * 安全地设置延迟状态
 * @param setter 状态设置函数
 * @param value 要设置的值
 * @param delay 延迟时间（毫秒）
 * @returns 清理函数，用于取消延迟设置
 */
export function setDelayedState<T>(
  setter: (value: T | null) => void,
  value: T,
  delay: number = 3000
): () => void {
  setter(value);

  const timeoutId = setTimeout(() => {
    setter(null);
  }, delay);

  // 返回清理函数
  return () => {
    clearTimeout(timeoutId);
  };
}

/**
 * 延迟状态管理器
 * 用于管理多个延迟状态，自动清理
 */
export class DelayedStateManager {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * 设置延迟状态
   * @param key 唯一标识符
   * @param setter 状态设置函数
   * @param value 要设置的值
   * @param delay 延迟时间（毫秒）
   */
  set(key: string, setter: (value: unknown) => void, value: unknown, delay: number = 3000): void {
    // 清除之前的定时器
    this.clear(key);

    // 设置新值
    setter(value);

    // 设置延迟清除
    const timeoutId = setTimeout(() => {
      setter(null);
      this.timeouts.delete(key);
    }, delay);

    this.timeouts.set(key, timeoutId);
  }

  /**
   * 清除指定键的延迟状态
   */
  clear(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * 清除所有延迟状态
   */
  clearAll(): void {
    this.timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();
  }
}

