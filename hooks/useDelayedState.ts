/**
 * 延迟状态 Hook
 * 用于在设置值后自动延迟清除，常用于临时消息显示
 *
 * @example
 * const [message, setMessage] = useDelayedState<string>(3000);
 *
 * // 设置消息，3秒后自动清除
 * setMessage('操作成功');
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useDelayedState<T>(
  delay: number = 3000
): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setDelayedValue = useCallback(
    (newValue: T) => {
      setValue(newValue);

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        setValue(null);
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setDelayedValue];
}

