import React from 'react';
import { useState, useCallback } from 'react';
import { LogEntry } from '../types';
import { uid } from '../utils/gameUtils';

export function useGameEffects() {
  const [visualEffects, setVisualEffects] = useState<
    {
      type: 'damage' | 'heal' | 'slash' | 'alchemy';
      value?: string;
      color?: string;
      id: string;
    }[]
  >([]);

  // Helper to add logs (带去重机制，防止短时间内重复添加相同内容)
  // 限制日志数量，避免内存占用过大
  const MAX_LOGS = 1000;
  const createAddLog = useCallback(
    (setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>) => {
      return (text: string, type: LogEntry['type'] = 'normal') => {
        setLogs((prev) => {
          const now = Date.now();
          // 检查最近1秒内是否有相同内容和类型的日志
          const recentDuplicate = prev
            .slice(-5) // 只检查最近5条日志
            .some(
              (log) =>
                log.text === text &&
                log.type === type &&
                now - log.timestamp < 1000 // 1秒内的重复视为无效
            );

          // 如果有重复，不添加
          if (recentDuplicate) {
            return prev;
          }

          // 限制日志数量，只保留最近的 MAX_LOGS 条
          const newLogs = [...prev, { id: uid(), text, type, timestamp: now }];

          // 如果超过最大数量，只保留最新的
          if (newLogs.length > MAX_LOGS) {
            return newLogs.slice(-MAX_LOGS);
          }

          return newLogs;
        });
      };
    },
    []
  );

  // Helper to trigger visuals
  const triggerVisual = useCallback(
    (type: 'damage' | 'heal' | 'slash' | 'alchemy', value?: string, color?: string) => {
      const id = uid();
      setVisualEffects((prev) => [...prev, { type, value, color, id }]);
      // 炼丹动画持续时间更长
      const duration = type === 'alchemy' ? 2000 : 1000;
      setTimeout(() => {
        setVisualEffects((prev) => prev.filter((v) => v.id !== id));
      }, duration);
    },
    []
  );

  return {
    visualEffects,
    createAddLog,
    triggerVisual,
  };
}
