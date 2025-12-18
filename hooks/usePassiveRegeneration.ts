/**
 * 被动回血和冷却管理 Hook
 * 处理玩家被动回血和冷却时间递减
 */

import React from 'react';
import { useEffect, useRef } from 'react';
import { PlayerStats } from '../types';

interface UsePassiveRegenerationParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  cooldown: number;
  setCooldown: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 被动回血和冷却管理
 * 优化：使用 useRef 存储 player 引用，避免因 player 对象变化而频繁重建 interval
 */
export function usePassiveRegeneration({
  player,
  setPlayer,
  setCooldown,
}: UsePassiveRegenerationParams) {
  // 使用 ref 存储最新的 player，避免依赖整个 player 对象
  const playerRef = useRef<PlayerStats | null>(player);

  // 更新 ref 当 player 变化时
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    // 如果 player 不存在，不创建 interval
    if (!player) return;

    const timer = setInterval(() => {
      // 使用 ref 获取最新的 player，避免闭包问题
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;

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
    // 只依赖 player 是否存在，而不是整个 player 对象
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!player, setPlayer, setCooldown]);
}

