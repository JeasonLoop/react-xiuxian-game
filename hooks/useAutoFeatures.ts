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
  autoAdventurePausedByShop: boolean;
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
  handleMeditate,
  handleAdventure,
  setCooldown,
}: UseAutoFeaturesParams) {
  // 自动打坐逻辑
  useEffect(() => {
    if (!autoMeditate || !player || loading || cooldown > 0 || autoAdventure) return;

    const timer = setTimeout(() => {
      if (
        autoMeditate &&
        !loading &&
        cooldown === 0 &&
        player &&
        !autoAdventure
      ) {
        if (loading || cooldown > 0 || !player || autoAdventure) return;
        handleMeditate();
        setCooldown(1);
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMeditate, player, loading, cooldown, autoAdventure]);

  // 自动历练逻辑
  useEffect(() => {
    if (
      !autoAdventure ||
      !player ||
      loading ||
      cooldown > 0 ||
      isShopOpen ||
      autoMeditate
    )
      return;

    const timer = setTimeout(() => {
      if (
        autoAdventure &&
        !loading &&
        cooldown === 0 &&
        player &&
        !autoMeditate
      ) {
        handleAdventure();
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdventure, player, loading, cooldown, autoMeditate, isShopOpen]);
}

