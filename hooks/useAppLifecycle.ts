/**
 * App Lifecycle Hook
 * 管理游戏生命周期和初始化逻辑
 *
 * 从 App.tsx 中提取，集中管理：
 * - 游戏初始化
 * - 新游戏检测和状态重置
 * - 境界变化监听
 * - 成就检查
 */
import React, { useEffect, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, RealmType, TribulationResult, TribulationState } from '../types';
import { THRESHOLD_CONSTANTS, DELAY_CONSTANTS } from '../constants/appConstants';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface UseNewGameDetectionProps {
  gameStarted: boolean;
  player: PlayerStats | null;
  resetAutoStates: () => void;
}

/**
 * 检测新游戏开始，重置自动历练状态
 */
export function useNewGameDetection({
  gameStarted,
  player,
  resetAutoStates,
}: UseNewGameDetectionProps) {
  const prevPlayerNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (gameStarted && player) {
      // 检测是否是真正的新游戏：玩家名字变化，且玩家是初始状态
      const isNewPlayer =
        prevPlayerNameRef.current !== null &&
        prevPlayerNameRef.current !== player.name;
      const isInitialState =
        player.exp === THRESHOLD_CONSTANTS.NEW_GAME_EXP_THRESHOLD &&
        player.realm === RealmType.QiRefining &&
        player.realmLevel === THRESHOLD_CONSTANTS.NEW_GAME_REALM_LEVEL_THRESHOLD;

      if (isNewPlayer && isInitialState) {
        // 新游戏开始时，确保自动历练状态被重置
        resetAutoStates();
      }

      prevPlayerNameRef.current = player.name;
    } else if (!gameStarted || !player) {
      // 游戏未开始或玩家为null时，重置ref
      prevPlayerNameRef.current = null;
    }
  }, [gameStarted, player, resetAutoStates]);
}

interface UseRealmChangeDetectionProps {
  player: PlayerStats | null;
  isTribulationTriggeredRef: React.MutableRefObject<boolean>;
  updateQuestProgress: (type: string, amount: number) => void;
}

/**
 * 监听境界变化，更新任务进度
 */
export function useRealmChangeDetection({
  player,
  isTribulationTriggeredRef,
  updateQuestProgress,
}: UseRealmChangeDetectionProps) {
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  const updateQuestProgressRef = useRef(updateQuestProgress);

  useEffect(() => {
    updateQuestProgressRef.current = updateQuestProgress;
  }, [updateQuestProgress]);

  useEffect(() => {
    if (player && prevRealmRef.current) {
      const prevRealm = prevRealmRef.current.realm;
      const prevLevel = prevRealmRef.current.level;
      if (player.realm !== prevRealm || player.realmLevel !== prevLevel) {
        // 境界或等级变化，说明突破成功
        updateQuestProgressRef.current('breakthrough', 1);
        // 重置天劫触发标志
        isTribulationTriggeredRef.current = false;
      }
    }
    if (player) {
      prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
    }
  }, [player, isTribulationTriggeredRef]);
}

interface UseAchievementCheckProps {
  player: PlayerStats | null;
  checkAchievements: () => void;
}

/**
 * 检查成就（境界变化、统计变化时）
 */
export function useAchievementCheck({
  player,
  checkAchievements,
}: UseAchievementCheckProps) {
  const checkAchievementsRef = useRef(checkAchievements);

  useEffect(() => {
    checkAchievementsRef.current = checkAchievements;
  }, [checkAchievements]);

  useEffect(() => {
    if (player) {
      checkAchievementsRef.current();
    }
  }, [
    player,
    player?.realm,
    player?.realmLevel,
    player?.statistics,
    player?.inventory?.length,
    player?.pets?.length,
    player?.cultivationArts?.length,
    player?.unlockedRecipes?.length,
    player?.lotteryCount,
  ]);
}

interface UseBattleResumeProps {
  pausedByBattle: boolean;
  player: PlayerStats | null;
  isDead: boolean;
  loading: boolean;
  setAutoAdventure: (value: boolean) => void;
  setPausedByBattle: (value: boolean) => void;
}

/**
 * 战斗结束后恢复自动历练
 */
export function useBattleResume({
  pausedByBattle,
  player,
  isDead,
  loading,
  setAutoAdventure,
  setPausedByBattle,
}: UseBattleResumeProps) {
  useEffect(() => {
    if (
      pausedByBattle &&
      player &&
      player.hp > THRESHOLD_CONSTANTS.DEATH_HP_THRESHOLD &&
      !isDead &&
      !loading
    ) {
      // 延迟一小段时间后恢复自动历练，确保状态更新完成
      const timer = setTimeout(() => {
        setAutoAdventure(true);
        setPausedByBattle(false);
      }, DELAY_CONSTANTS.AUTO_ADVENTURE_RESUME_DELAY);
      return () => clearTimeout(timer);
    }
  }, [pausedByBattle, player, isDead, loading, setAutoAdventure, setPausedByBattle]);
}

interface UseCultivationIntroProps {
  gameStarted: boolean;
  player: PlayerStats | null;
  setShowCultivationIntro: (show: boolean) => void;
}

/**
 * 检查是否需要显示修仙法门弹窗
 */
export function useCultivationIntro({
  gameStarted,
  player,
  setShowCultivationIntro,
}: UseCultivationIntroProps) {
  useEffect(() => {
    if (
      gameStarted &&
      player &&
      !localStorage.getItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN)
    ) {
      // 延迟一小段时间显示，确保游戏界面已加载完成
      const timer = setTimeout(() => {
        setShowCultivationIntro(true);
      }, DELAY_CONSTANTS.CULTIVATION_INTRO_DELAY);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, player, setShowCultivationIntro]);
}

interface UseTribulationCompleteProps {
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  setTribulationState: (state: TribulationState | null) => void;
  setDeathReason: (reason: string) => void;
  addLog: (message: string, type?: string) => void;
  handleBreakthroughRef: React.MutableRefObject<(skipCheck?: boolean, hpLoss?: number) => void>;
}

/**
 * 创建天劫完成处理函数
 */
export function useTribulationComplete({
  setPlayer,
  setTribulationState,
  setDeathReason,
  addLog,
  handleBreakthroughRef,
}: UseTribulationCompleteProps) {
  return useCallback(
    (result: TribulationResult) => {
      if (result.success) {
        // 渡劫成功，执行突破（跳过成功率检查）
        handleBreakthroughRef.current(true, result.hpLoss || 0);

        if (result.hpLoss && result.hpLoss > 0) {
          addLog(`渡劫成功，但损耗了${result.hpLoss}点气血。`, 'normal');
        } else {
          addLog(result.description, 'gain');
        }
        setTribulationState(null);
      } else {
        // 渡劫失败，触发死亡
        setDeathReason(result.description);
        setPlayer((prev) => {
          if (!prev) return prev;
          return { ...prev, hp: 0 };
        });
        setTribulationState(null);
      }
    },
    [setPlayer, setTribulationState, setDeathReason, addLog, handleBreakthroughRef]
  );
}

interface UseDebugModeInitProps {
  setIsDebugModeEnabled: (enabled: boolean) => void;
}

/**
 * 初始化调试模式
 */
export function useDebugModeInit({ setIsDebugModeEnabled }: UseDebugModeInitProps) {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
    if (debugMode) {
      setIsDebugModeEnabled(true);
    }
    isInitializedRef.current = true;
  }, [setIsDebugModeEnabled]);
}

/**
 * 统一的 App 生命周期 Hook
 * 整合所有生命周期相关的逻辑
 */
interface UseAppLifecycleProps {
  gameStarted: boolean;
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  isDead: boolean;
  loading: boolean;
  pausedByBattle: boolean;

  // State setters
  setShowCultivationIntro: (show: boolean) => void;
  setTribulationState: (state: TribulationState | null) => void;
  setDeathReason: (reason: string) => void;
  setAutoAdventure: (value: boolean) => void;
  setPausedByBattle: (value: boolean) => void;
  setIsDebugModeEnabled: (enabled: boolean) => void;

  // Refs and handlers
  isTribulationTriggeredRef: React.MutableRefObject<boolean>;
  handleBreakthroughRef: React.MutableRefObject<(skipCheck?: boolean, hpLoss?: number) => void>;

  // Callbacks
  resetAutoStates: () => void;
  updateQuestProgress: (type: string, amount: number) => void;
  checkAchievements: () => void;
  addLog: (message: string, type?: string) => void;
}

export function useAppLifecycle(props: UseAppLifecycleProps) {
  const {
    gameStarted,
    player,
    setPlayer,
    isDead,
    loading,
    pausedByBattle,
    setShowCultivationIntro,
    setTribulationState,
    setDeathReason,
    setAutoAdventure,
    setPausedByBattle,
    setIsDebugModeEnabled,
    isTribulationTriggeredRef,
    handleBreakthroughRef,
    resetAutoStates,
    updateQuestProgress,
    checkAchievements,
    addLog,
  } = props;

  // 初始化调试模式
  useDebugModeInit({ setIsDebugModeEnabled });

  // 检测新游戏
  useNewGameDetection({
    gameStarted,
    player,
    resetAutoStates,
  });

  // 显示修仙法门弹窗
  useCultivationIntro({
    gameStarted,
    player,
    setShowCultivationIntro,
  });

  // 监听境界变化
  useRealmChangeDetection({
    player,
    isTribulationTriggeredRef,
    updateQuestProgress,
  });

  // 检查成就
  useAchievementCheck({
    player,
    checkAchievements,
  });

  // 战斗结束后恢复自动历练
  useBattleResume({
    pausedByBattle,
    player,
    isDead,
    loading,
    setAutoAdventure,
    setPausedByBattle,
  });

  // 创建天劫完成处理函数
  const handleTribulationComplete = useTribulationComplete({
    setPlayer,
    setTribulationState,
    setDeathReason,
    addLog,
    handleBreakthroughRef,
  });

  return {
    handleTribulationComplete,
  };
}

