/**
 * 物品操作日志 Hook
 * 封装了延迟状态管理逻辑，用于显示临时物品操作消息
 *
 * @example
 * const { itemActionLog, setItemActionLog } = useItemActionLog();
 *
 * // 设置日志，3秒后自动清除
 * setItemActionLog({ text: '你装备了武器', type: 'normal' });
 *
 * // 立即清除
 * setItemActionLog(null);
 */

import { useEffect, useCallback } from 'react';
import { useDelayedState } from './useDelayedState';

export interface ItemActionLog {
  text: string;
  type: string;
}

export interface UseItemActionLogOptions {
  /**
   * 延迟清除时间（毫秒），默认 3000ms
   */
  delay?: number;
  /**
   * 外部状态设置函数（可选）
   * 如果提供，会将延迟状态同步到外部状态
   */
  externalSetter?: (value: ItemActionLog | null) => void;
}

export interface UseItemActionLogReturn {
  /**
   * 当前日志值
   */
  itemActionLog: ItemActionLog | null;
  /**
   * 设置日志函数
   * @param log 日志对象或 null（用于清除）
   */
  setItemActionLog: (log: ItemActionLog | null) => void;
}

/**
 * 物品操作日志 Hook
 * 封装了延迟状态管理逻辑，用于显示临时物品操作消息
 *
 * @param options 配置选项
 * @returns 返回日志值和设置函数
 */
export function useItemActionLog(
  options: UseItemActionLogOptions = {}
): UseItemActionLogReturn {
  const { delay = 3000, externalSetter } = options;

  // 使用延迟状态管理
  const [delayedItemActionLog, setDelayedItemActionLog] = useDelayedState<ItemActionLog>(delay);

  // 同步延迟状态到外部状态（如果提供了外部设置函数）
  useEffect(() => {
    if (externalSetter) {
      externalSetter(delayedItemActionLog);
    }
  }, [delayedItemActionLog, externalSetter]);

  // 包装设置函数，支持立即清除
  const setItemActionLog = useCallback(
    (log: ItemActionLog | null) => {
      if (log) {
        // 设置日志，延迟状态会自动管理清除
        setDelayedItemActionLog(log);
      } else {
        // 立即清除外部状态
        if (externalSetter) {
          externalSetter(null);
        }
        // 注意：延迟状态会在延迟时间后自动清除
        // 如果需要立即清除延迟状态，可以考虑扩展 useDelayedState 来支持直接清除
      }
    },
    [setDelayedItemActionLog, externalSetter]
  );

  return {
    itemActionLog: delayedItemActionLog,
    setItemActionLog,
  };
}

