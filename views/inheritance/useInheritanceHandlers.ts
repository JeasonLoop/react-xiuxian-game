import React from 'react';
import { PlayerStats } from '../../types';
import { showConfirm, showError } from '../../utils/toastUtils';

interface UseInheritanceHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 传承处理函数
 * 已删除传承等级和经验修炼功能，仅保留突破境界功能
 * 传承等级只能通过历练获得，不能手动提升
 */
export function useInheritanceHandlers({
  player,
  setPlayer,
  addLog,
}: UseInheritanceHandlersProps) {
  // 传承系统已简化，不再提供手动提升等级的功能
  // 传承等级只能通过历练获得（inheritanceLevelChange）
  // 使用传承突破境界的功能在 useBreakthroughHandlers 中

  return {};
}

