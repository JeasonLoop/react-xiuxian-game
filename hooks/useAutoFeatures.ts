/**
 * 自动功能 Hook
 * 处理自动打坐、自动历练等自动功能逻辑
 */

import { useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { AutoAdventureConfig } from '../components/AutoAdventureConfigModal';
import { getPlayerTotalStats } from '../utils/statUtils';

interface UseAutoFeaturesParams {
  autoMeditate: boolean;
  autoAdventure: boolean;
  player: PlayerStats | null;
  loading: boolean;
  cooldown: number;
  isShopOpen: boolean;
  isReputationEventOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  isAlertOpen: boolean; // 确认弹窗是否打开（包括天地之魄确认弹窗）
  pausedByShop: boolean;
  pausedByBattle: boolean;
  pausedByReputationEvent: boolean;
  pausedByHeavenEarthSoul: boolean;
  setPausedByShop: (paused: boolean) => void;
  setPausedByBattle: (paused: boolean) => void;
  setPausedByReputationEvent: (paused: boolean) => void;
  setPausedByHeavenEarthSoul: (paused: boolean) => void;
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
  isAlertOpen,
  pausedByShop,
  pausedByBattle,
  pausedByReputationEvent,
  pausedByHeavenEarthSoul,
  handleMeditate,
  handleAdventure,
  setCooldown,
  autoAdventureConfig,
  setAutoAdventure,
  addLog,
}: UseAutoFeaturesParams) {
  // 使用 ref 跟踪函数和状态，避免闭包问题
  const handleMeditateRef = useRef(handleMeditate);
  const handleAdventureRef = useRef(handleAdventure);
  const setCooldownRef = useRef(setCooldown);
  const playerRef = useRef(player);

  // 使用 ref 跟踪是否正在执行自动功能，避免重复触发
  const isExecutingMeditateRef = useRef(false);
  const isExecutingAdventureRef = useRef(false);

  // 跟踪所有活动的 timeout，用于清理
  const meditateTimeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const adventureTimeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  // 使用 ref 跟踪所有状态，避免闭包问题
  const stateRefs = useRef({
    autoMeditate,
    autoAdventure,
    loading,
    cooldown,
    player,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    isAlertOpen,
    pausedByShop,
    pausedByBattle,
    pausedByReputationEvent,
    pausedByHeavenEarthSoul,
  });

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
      pausedByShop ||
      pausedByBattle ||
      pausedByReputationEvent ||
      pausedByHeavenEarthSoul ||
      autoMeditate
    )
      return;

    const timer = setTimeout(() => {
      const currentPlayer = playerRef.current;
      // 再次检查条件，防止状态在延迟期间发生变化
      if (autoAdventure && !loading && cooldown === 0 && currentPlayer && !autoMeditate && !isReputationEventOpen && !isTurnBasedBattleOpen && !pausedByShop && !pausedByBattle && !pausedByReputationEvent && !pausedByHeavenEarthSoul) {
        // 检查血量阈值
        if (autoAdventureConfig && autoAdventureConfig.minHpThreshold > 0) {
          const currentHp = currentPlayer.hp || 0;
          // 获取实际最大血量（包含功法加成等）
          const totalStats = getPlayerTotalStats(currentPlayer);
          const actualMaxHp = totalStats.maxHp;
          // 计算阈值血量：最大血量 * 阈值百分比
          const thresholdHp = actualMaxHp * (autoAdventureConfig.minHpThreshold / 100);
          if (currentHp <= thresholdHp) {
            // 血量低于阈值，自动停止历练
            if (setAutoAdventure) {
              setAutoAdventure(false);
            }
            if (addLog) {
              addLog(`血量低于阈值 ${autoAdventureConfig.minHpThreshold}%（${Math.floor(thresholdHp)}/${Math.floor(actualMaxHp)}），自动停止历练。`, 'warning');
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
    player,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    isAlertOpen,
    pausedByShop,
    pausedByBattle,
    pausedByReputationEvent,
    pausedByHeavenEarthSoul,
    handleAdventure,
    autoAdventureConfig,
    setAutoAdventure,
    addLog,
  ]);

  // 统一更新所有 refs
  useEffect(() => {
    handleMeditateRef.current = handleMeditate;
    handleAdventureRef.current = handleAdventure;
    setCooldownRef.current = setCooldown;
    stateRefs.current = {
      autoMeditate,
      autoAdventure,
      loading,
      cooldown,
      player,
      isShopOpen,
      isReputationEventOpen,
      isTurnBasedBattleOpen,
      isAlertOpen,
      pausedByShop,
      pausedByBattle,
      pausedByReputationEvent,
      pausedByHeavenEarthSoul,
    };
    playerRef.current = player;
  }, [
    autoMeditate,
    autoAdventure,
    loading,
    cooldown,
    player,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    isAlertOpen,
    pausedByShop,
    pausedByBattle,
    pausedByReputationEvent,
    pausedByHeavenEarthSoul,
    handleMeditate,
    handleAdventure,
    setCooldown,
  ]);

  /**
   * 检查自动历练是否应该暂停
   * 统一所有需要暂停自动历练的情况
   */
  const shouldPauseAdventure = (): boolean => {
    const state = stateRefs.current;
    return (
      !state.autoAdventure ||
      !state.player ||
      state.loading ||
      state.cooldown > 0 ||
      state.isShopOpen ||
      state.isReputationEventOpen ||
      state.isTurnBasedBattleOpen ||
      state.isAlertOpen || // 确认弹窗打开时暂停（包括天地之魄确认弹窗）
      state.pausedByShop ||
      state.pausedByBattle ||
      state.pausedByReputationEvent ||
      state.pausedByHeavenEarthSoul ||
      state.autoMeditate || // 自动打坐时暂停自动历练
      isExecutingAdventureRef.current
    );
  };

  // 自动打坐逻辑 - 使用 setInterval 定期检查
  useEffect(() => {
    if (!autoMeditate) {
      // 当自动打坐关闭时，重置执行标志
      isExecutingMeditateRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      const state = stateRefs.current;

      // 检查所有条件
      if (
        !state.autoMeditate ||
        !state.player ||
        state.loading ||
        state.cooldown > 0 ||
        state.autoAdventure ||
        state.isShopOpen ||
        state.isReputationEventOpen ||
        state.isTurnBasedBattleOpen ||
        state.isAlertOpen ||
        isExecutingMeditateRef.current
      ) {
        return;
      }

      // 执行打坐
      isExecutingMeditateRef.current = true;
      try {
        handleMeditateRef.current();
        setCooldownRef.current(1);
      } catch (error) {
        console.error('自动打坐出错:', error);
      } finally {
        // 在下一个事件循环中重置标志
        const timeoutId = setTimeout(() => {
          isExecutingMeditateRef.current = false;
          // 从数组中移除已完成的 timeout
          meditateTimeoutIdsRef.current = meditateTimeoutIdsRef.current.filter(
            (id) => id !== timeoutId
          );
        }, 100);
        meditateTimeoutIdsRef.current.push(timeoutId);
      }
    }, 200); // 每 200ms 检查一次

    return () => {
      clearInterval(interval);
      // 清理所有未完成的 setTimeout
      meditateTimeoutIdsRef.current.forEach((id) => clearTimeout(id));
      meditateTimeoutIdsRef.current = [];
    };
  }, [autoMeditate]);

  // 自动历练逻辑 - 使用 setInterval 定期检查
  useEffect(() => {
    if (!autoAdventure) {
      // 当自动历练关闭时，重置执行标志
      isExecutingAdventureRef.current = false;
      return;
    }

    const interval = setInterval(async () => {
      // 使用统一的暂停检查函数
      if (shouldPauseAdventure()) {
        // 如果应该暂停，确保执行标志被重置（防止卡住）
        if (isExecutingAdventureRef.current) {
          isExecutingAdventureRef.current = false;
        }
        return;
      }

      // 如果正在执行，跳过本次检查
      if (isExecutingAdventureRef.current) {
        return;
      }

      // 执行历练
      isExecutingAdventureRef.current = true;
      try {
        // 等待历练完成，避免并发执行
        await handleAdventureRef.current();
      } catch (error) {
        console.error('自动历练出错:', error);
      } finally {
        // 在历练完成后，检查是否应该继续（可能战斗弹窗已打开）
        // 如果应该暂停，不要立即重置标志，等待暂停状态解除
        if (!shouldPauseAdventure()) {
          // 在下一个事件循环中重置标志
          const timeoutId = setTimeout(() => {
            isExecutingAdventureRef.current = false;
            // 从数组中移除已完成的 timeout
            adventureTimeoutIdsRef.current = adventureTimeoutIdsRef.current.filter(
              (id) => id !== timeoutId
            );
          }, 100);
          adventureTimeoutIdsRef.current.push(timeoutId);
        } else {
          // 如果应该暂停，立即重置标志，让暂停逻辑接管
          isExecutingAdventureRef.current = false;
        }
      }
    }, 500); // 每 500ms 检查一次

    return () => {
      clearInterval(interval);
      // 清理所有未完成的 setTimeout
      adventureTimeoutIdsRef.current.forEach((id) => clearTimeout(id));
      adventureTimeoutIdsRef.current = [];
    };
  }, [autoAdventure]);
}

