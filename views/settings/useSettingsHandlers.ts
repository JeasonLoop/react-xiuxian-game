import React from 'react';
import { GameSettings } from '../../types';

interface UseSettingsHandlersProps {
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

/**
 * 设置处理函数
 * 包含更新设置
 * @param setSettings 设置游戏设置
 * @returns handleUpdateSettings 更新设置
 */

export function useSettingsHandlers({ setSettings }: UseSettingsHandlersProps) {
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    handleUpdateSettings,
  };
}
