import { useState, useEffect, useRef } from 'react';

/**
 * 防抖 hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 *
 * 优化：
 * - 初始值立即设置，不等待 delay
 * - 如果 delay 为 0，立即更新
 * - 使用 ref 跟踪是否是首次渲染
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 首次渲染时，立即设置值，不等待 delay
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    // 如果 delay 为 0，立即更新
    if (delay === 0) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

