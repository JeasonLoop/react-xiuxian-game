/**
 * 优化版本的App组件
 * 使用memo和useCallback减少不必要的重渲染
 */

import React, { memo, useMemo } from 'react';
import App from '../App';
import { useGameStore, useUIStore } from '../store';
import { useShallow } from 'zustand/react/shallow';

/**
 * 优化选择器 - 只选择需要的状态，避免不必要的重渲染
 */
const useOptimizedGameStore = () => {
  return useGameStore(
    useShallow((state) => ({
      hasSave: state.hasSave,
      gameStarted: state.gameStarted,
      player: state.player,
      settings: state.settings,
      logs: state.logs,
    }))
  );
};

/**
 * 优化选择器 - UI状态批量选择
 */
const useOptimizedUIStore = () => {
  return useUIStore(
    useShallow((state) => ({
      loading: state.loading,
      cooldown: state.cooldown,
      modals: state.modals,
      autoMeditate: state.autoMeditate,
      autoAdventure: state.autoAdventure,
      pausedByBattle: state.pausedByBattle,
      pausedByShop: state.pausedByShop,
      pausedByReputationEvent: state.pausedByReputationEvent,
      pausedByHeavenEarthSoul: state.pausedByHeavenEarthSoul,
      lastBattleReplay: state.lastBattleReplay,
    }))
  );
};

/**
 * 优化选择器 - 只选择需要的setter函数
 */
const useOptimizedSetters = () => {
  const gameSetters = useGameStore(
    useShallow((state) => ({
      setHasSave: state.setHasSave,
      setGameStarted: state.setGameStarted,
      setPlayer: state.setPlayer,
      setLogs: state.setLogs,
      saveGame: state.saveGame,
      loadGame: state.loadGame,
      startNewGame: state.startNewGame,
    }))
  );

  const uiSetters = useUIStore(
    useShallow((state) => ({
      setLoading: state.setLoading,
      setCooldown: state.setCooldown,
      setIsInventoryOpen: state.setIsInventoryOpen,
      setIsCultivationOpen: state.setIsCultivationOpen,
      setIsAlchemyOpen: state.setIsAlchemyOpen,
      setIsUpgradeOpen: state.setIsUpgradeOpen,
      setIsSectOpen: state.setIsSectOpen,
      setIsRealmOpen: state.setIsRealmOpen,
      setIsCharacterOpen: state.setIsCharacterOpen,
      setIsAchievementOpen: state.setIsAchievementOpen,
      setIsPetOpen: state.setIsPetOpen,
      setIsLotteryOpen: state.setIsLotteryOpen,
      setIsSettingsOpen: state.setIsSettingsOpen,
      setIsDailyQuestOpen: state.setIsDailyQuestOpen,
      setIsShopOpen: state.setIsShopOpen,
      setIsGrottoOpen: state.setIsGrottoOpen,
      setIsDebugOpen: state.setIsDebugOpen,
      setIsBattleModalOpen: state.setIsBattleModalOpen,
      setIsTurnBasedBattleOpen: state.setIsTurnBasedBattleOpen,
      setIsReputationEventOpen: state.setIsReputationEventOpen,
      setIsTreasureVaultOpen: state.setIsTreasureVaultOpen,
      setIsDebugModeEnabled: state.setIsDebugModeEnabled,
      setAutoMeditate: state.setAutoMeditate,
      setAutoAdventure: state.setAutoAdventure,
      setPausedByBattle: state.setPausedByBattle,
      setPausedByShop: state.setPausedByShop,
      setPausedByReputationEvent: state.setPausedByReputationEvent,
      setPausedByHeavenEarthSoul: state.setPausedByHeavenEarthSoul,
      closeCurrentModal: state.closeCurrentModal,
      openTurnBasedBattle: state.openTurnBasedBattle,
    }))
  );

  return { ...gameSetters, ...uiSetters };
};

/**
 * 优化版本的App组件
 */
const OptimizedApp = memo(() => {
  // 使用优化选择器获取状态
  const gameState = useOptimizedGameStore();
  const uiState = useOptimizedUIStore();
  const setters = useOptimizedSetters();

  // 合并所有props
  const appProps = useMemo(() => ({
    ...gameState,
    ...uiState,
    ...setters,
  }), [gameState, uiState, setters]);

  return <App {...appProps} />;
});

OptimizedApp.displayName = 'OptimizedApp';

export default OptimizedApp;