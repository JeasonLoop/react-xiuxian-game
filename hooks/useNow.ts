import { useEffect, useState } from 'react';

/**
 * 订阅式当前时间 Hook
 * 供倒计时等需要秒级刷新的 UI 组件在内部使用，
 * 替代"父组件每秒 setState 导致整棵子树重渲染"的模式。
 *
 * @param intervalMs 刷新间隔（毫秒），默认 1000
 * @param active     是否激活计时（如弹窗关闭时暂停）
 * @returns 当前时间戳（毫秒）
 */
export function useNow(intervalMs = 1000, active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, active]);

  return now;
}
