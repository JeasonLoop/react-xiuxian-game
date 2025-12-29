/**
 * 被动回血和冷却管理 Hook
 * 处理玩家被动回血和冷却时间递减
 */

import React from 'react';
import { useEffect, useRef, useMemo } from 'react';
import { PlayerStats } from '../types';
import { getPlayerTotalStats } from '../utils/statUtils';

interface UsePassiveRegenerationParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  cooldown: number;
  setCooldown: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 被动回血和冷却管理
 * 优化：使用 useMemo 缓存 maxHp 计算，避免每秒重复计算
 */
export function usePassiveRegeneration({
  player,
  setPlayer,
  setCooldown,
}: UsePassiveRegenerationParams) {
  // 使用 ref 存储最新的 player，避免依赖整个 player 对象
  const playerRef = useRef<PlayerStats | null>(player);

  // 缓存 maxHp 计算，只在相关属性变化时重新计算
  // 依赖项包括：基础属性、装备、功法、称号、金丹法数等影响 maxHp 的因素
  // 注意：使用 JSON.stringify 对对象/数组进行序列化比较，避免引用变化导致的不必要重新计算
  const equippedItemsKey = useMemo(() =>
    player?.equippedItems ? JSON.stringify(player.equippedItems) : '',
    [player?.equippedItems]
  );
  const inventoryKey = useMemo(() =>
    player?.inventory ? `${player.inventory.length}-${player.inventory.map(i => `${i.id}-${i.level || 0}`).join(',')}` : '',
    [player?.inventory]
  );
  const cultivationArtsKey = useMemo(() =>
    player?.cultivationArts ? player.cultivationArts.join(',') : '',
    [player?.cultivationArts]
  );
  const spiritualRootsKey = useMemo(() =>
    player?.spiritualRoots ? JSON.stringify(player.spiritualRoots) : '',
    [player?.spiritualRoots]
  );

  const cachedMaxHp = useMemo(() => {
    if (!player) return 0;
    const totalStats = getPlayerTotalStats(player);
    return totalStats.maxHp;
  }, [
    player?.maxHp,
    player?.activeArtId,
    player?.goldenCoreMethodCount,
    equippedItemsKey,
    inventoryKey,
    cultivationArtsKey,
    player?.titleId,
    spiritualRootsKey,
  ]);

  // 更新 ref 当 player 变化时
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // 使用 ref 存储缓存的 maxHp，避免闭包问题
  const maxHpRef = useRef(cachedMaxHp);
  useEffect(() => {
    maxHpRef.current = cachedMaxHp;
  }, [cachedMaxHp]);

  useEffect(() => {
    // 如果 player 不存在，不创建 interval
    if (!player) return;

    const timer = setInterval(() => {
      // 使用 ref 获取最新的 player，避免闭包问题
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;

      // 使用缓存的 maxHp，避免重复计算
      const actualMaxHp = maxHpRef.current;

      setPlayer((prev) => {
        if (!prev) return prev;

        // 计算基础回血量（基于实际最大血量）
        const baseRegen = Math.max(1, Math.floor(actualMaxHp * 0.01));

        // 判断是否需要回血（使用实际最大血量）
        if (prev.hp < actualMaxHp) {
          return {
            ...prev,
            hp: Math.min(actualMaxHp, prev.hp + baseRegen),
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

