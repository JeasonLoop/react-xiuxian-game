/**
 * 自动功能 Hook
 * 处理自动打坐、自动历练等自动功能逻辑
 */

import { useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { AutoAdventureConfig } from '../components/AutoAdventureConfigModal';

interface UseAutoFeaturesParams {
  autoMeditate: boolean;
  autoAdventure: boolean;
  player: PlayerStats | null;
  loading: boolean;
  cooldown: number;
  isShopOpen: boolean;
  isReputationEventOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  handleMeditate: () => void;
  handleAdventure: () => void;
  setCooldown: (cooldown: number) => void;
  autoAdventureConfig?: AutoAdventureConfig;
  setAutoAdventure?: (value: boolean) => void;
  addLog?: (message: string, type?: string) => void;
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
  handleMeditate,
  handleAdventure,
  setCooldown,
  autoAdventureConfig,
  setAutoAdventure,
  addLog,
}: UseAutoFeaturesParams) {
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // 自动打坐逻辑
  useEffect(() => {
    // 提前检查所有条件
    if (!autoMeditate || !playerRef.current || loading || cooldown > 0 || autoAdventure) return;

    const timer = setTimeout(() => {
      const currentPlayer = playerRef.current;
      // 再次检查条件，防止状态在延迟期间发生变化
      if (autoMeditate && !loading && cooldown === 0 && currentPlayer && !autoAdventure) {
        handleMeditate();
        setCooldown(1);
      }
    }, 100);

    return () => clearTimeout(timer);
    // 移除了 player 依赖，使用 ref 避免频繁触发
  }, [autoMeditate, loading, cooldown, autoAdventure, handleMeditate, setCooldown]);

  // 自动历练逻辑
  useEffect(() => {
    // 提前检查所有条件
    if (
      !autoAdventure ||
      !playerRef.current ||
      loading ||
      cooldown > 0 ||
      isShopOpen ||
      isReputationEventOpen ||
      isTurnBasedBattleOpen ||
      autoMeditate
    )
      return;

    const timer = setTimeout(() => {
      const currentPlayer = playerRef.current;
      // 再次检查条件，防止状态在延迟期间发生变化
      if (autoAdventure && !loading && cooldown === 0 && currentPlayer && !autoMeditate && !isReputationEventOpen && !isTurnBasedBattleOpen) {
        // 检查血量阈值
        if (autoAdventureConfig && autoAdventureConfig.minHpThreshold > 0) {
          const currentHp = currentPlayer.hp || 0;
          if (currentHp <= currentHp * (autoAdventureConfig.minHpThreshold / 100)) {
            // 血量低于阈值，自动停止历练
            if (setAutoAdventure) {
              setAutoAdventure(false);
            }
            if (addLog) {
              addLog(`血量低于阈值 ${autoAdventureConfig.minHpThreshold}%，自动停止历练。`, 'warning');
            }
            return;
          }
        }
        handleAdventure();
      }
    }, 500);

    return () => clearTimeout(timer);
    // 移除了 player 依赖，使用 ref 避免频繁触发
  }, [
    autoAdventure,
    loading,
    cooldown,
    autoMeditate,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    handleAdventure,
    autoAdventureConfig,
    setAutoAdventure,
    addLog,
  ]);
}

