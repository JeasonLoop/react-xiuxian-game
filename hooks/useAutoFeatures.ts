/**
 * 自动功能 Hook
 * 处理自动打坐、自动历练等自动功能逻辑
 */

import { useEffect } from 'react';
import { PlayerStats } from '../types';

interface UseAutoFeaturesParams {
  autoMeditate: boolean;
  autoAdventure: boolean;
  player: PlayerStats | null;
  loading: boolean;
  cooldown: number;
  isShopOpen: boolean;
  isReputationEventOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  autoAdventurePausedByShop: boolean;
  autoAdventurePausedByBattle: boolean;
  autoAdventurePausedByReputationEvent: boolean;
  setAutoAdventurePausedByShop: (paused: boolean) => void;
  handleMeditate: () => void;
  handleAdventure: () => void;
  setCooldown: (cooldown: number) => void;
}

/**
 * 自动功能管理
 */
export function useAutoFeatures({
  autoMeditate,
  autoAdventure,
  player,
  loading,
  cooldown,
  isShopOpen,
  isReputationEventOpen,
  isTurnBasedBattleOpen,
  autoAdventurePausedByShop,
  autoAdventurePausedByBattle,
  autoAdventurePausedByReputationEvent,
  handleMeditate,
  handleAdventure,
  setCooldown,
}: UseAutoFeaturesParams) {
  // 自动打坐逻辑
  useEffect(() => {
    // 提前检查所有条件，避免不必要的 timer 创建
    if (!autoMeditate || !player || loading || cooldown > 0 || autoAdventure) return;

    const timer = setTimeout(() => {
      // 再次检查条件，防止状态在延迟期间发生变化
      if (autoMeditate && !loading && cooldown === 0 && player && !autoAdventure) {
        handleMeditate();
        setCooldown(1);
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMeditate, player, loading, cooldown, autoAdventure]);

  // 自动历练逻辑
  useEffect(() => {
    // 提前检查所有条件，避免不必要的 timer 创建
    if (
      !autoAdventure ||
      !player ||
      loading ||
      cooldown > 0 ||
      isShopOpen ||
      isReputationEventOpen ||
      isTurnBasedBattleOpen ||
      autoAdventurePausedByShop ||
      autoAdventurePausedByBattle ||
      autoAdventurePausedByReputationEvent ||
      autoMeditate
    )
      return;

    const timer = setTimeout(() => {
      // 再次检查条件，防止状态在延迟期间发生变化
      if (autoAdventure && !loading && cooldown === 0 && player && !autoMeditate && !isReputationEventOpen && !isTurnBasedBattleOpen && !autoAdventurePausedByShop && !autoAdventurePausedByBattle && !autoAdventurePausedByReputationEvent) {
        handleAdventure();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdventure, player, loading, cooldown, autoMeditate, isShopOpen, isReputationEventOpen, isTurnBasedBattleOpen, autoAdventurePausedByShop, autoAdventurePausedByBattle, autoAdventurePausedByReputationEvent]);
}

