/**
 * 被动回血和冷却管理 Hook
 * 处理玩家被动回血和冷却时间递减
 */

import React from 'react';
import { useEffect } from 'react';
import { PlayerStats } from '../types';

interface UsePassiveRegenerationParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  cooldown: number;
  setCooldown: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 被动回血和冷却管理
 */
export function usePassiveRegeneration({
  player,
  setPlayer,
  setCooldown,
}: UsePassiveRegenerationParams) {
  useEffect(() => {
    if (!player) return;

    const timer = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return prev;

        // 计算基础回血量
        const baseRegen = Math.max(1, Math.floor(prev.maxHp * 0.01));

        if (prev.hp < prev.maxHp) {
          return {
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + baseRegen),
          };
        }

        return prev;
      });
      setCooldown((c: number) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [player, setPlayer, setCooldown]);
}

