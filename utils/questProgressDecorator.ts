import { DailyQuestType } from '../types';

/**
 * 任务进度更新器接口
 */
export interface QuestProgressUpdater {
  updateQuestProgress: (type: DailyQuestType, amount?: number) => void;
}

/**
 * 任务进度装饰器函数
 * 创建一个包装函数，在原始 handler 执行后自动更新任务进度
 *
 * 注意：这个函数返回一个包装函数，需要在 useCallback 中使用
 *
 * @param handler 原始 handler 函数
 * @param questType 任务类型
 * @param questUpdater 任务进度更新器
 * @returns 包装后的 handler 函数
 *
 * @example
 * ```typescript
 * const handleEquipItem = useCallback(
 *   withQuestProgress(
 *     equipmentHandlers.handleEquipItem,
 *     'equip',
 *     dailyQuestHandlers
 *   ),
 *   [equipmentHandlers.handleEquipItem, dailyQuestHandlers]
 * );
 * ```
 */
export function withQuestProgress<T extends (...args: any[]) => any>(
  handler: T,
  questType: DailyQuestType,
  questUpdater: QuestProgressUpdater
): T {
  return ((...args: Parameters<T>) => {
    const result = handler(...args);
    questUpdater.updateQuestProgress(questType, 1);
    return result;
  }) as T;
}

