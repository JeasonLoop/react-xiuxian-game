/**
 * 类型守卫工具函数
 * 用于运行时类型检查和类型安全转换
 */

import { DailyQuestType } from '../types';

/**
 * 类型守卫：检查字符串是否为有效的 DailyQuestType
 */
export function isValidDailyQuestType(type: string): type is DailyQuestType {
  const validTypes: DailyQuestType[] = [
    'meditate',
    'adventure',
    'breakthrough',
    'alchemy',
    'equip',
    'pet',
    'sect',
    'realm',
    'kill',
    'collect',
    'learn',
    'other',
  ];
  return validTypes.includes(type as DailyQuestType);
}

