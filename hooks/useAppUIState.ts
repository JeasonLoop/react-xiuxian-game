/**
 * App UI State Hook
 * 统一管理 App 组件中所有 UI Store 状态的订阅
 *
 * 从 App.tsx 中提取，减少主组件的状态管理代码
 */
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore, useModals } from '../store/uiStore';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Modal Setters 类型
 */
export interface ModalSetters {
  setIsInventoryOpen: (open: boolean) => void;
  setIsCultivationOpen: (open: boolean) => void;
  setIsAlchemyOpen: (open: boolean) => void;
  setIsUpgradeOpen: (open: boolean) => void;
  setIsSectOpen: (open: boolean) => void;
  setIsRealmOpen: (open: boolean) => void;
  setIsCharacterOpen: (open: boolean) => void;
  setIsAchievementOpen: (open: boolean) => void;
  setIsPetOpen: (open: boolean) => void;
  setIsLotteryOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsDailyQuestOpen: (open: boolean) => void;
  setIsShopOpen: (open: boolean) => void;
  setIsGrottoOpen: (open: boolean) => void;
  setIsDebugOpen: (open: boolean) => void;
  setIsBattleModalOpen: (open: boolean) => void;
  setIsTurnBasedBattleOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsMobileStatsOpen: (open: boolean) => void;
  setIsDebugModeEnabled: (enabled: boolean) => void;
  setIsReputationEventOpen: (open: boolean) => void;
  setIsTreasureVaultOpen: (open: boolean) => void;
  setIsAutoAdventureConfigOpen: (open: boolean) => void;
}

/**
 * 获取所有 Modal Setters
 * 使用 useMemo 确保 Setter 引用稳定，避免无限重渲染循环
 */
export function useModalSetters(): ModalSetters {
  const setModal = useUIStore((state) => state.setModal);

  return useMemo(
    () => ({
      setIsInventoryOpen: (open) => setModal('isInventoryOpen', open),
      setIsCultivationOpen: (open) => setModal('isCultivationOpen', open),
      setIsAlchemyOpen: (open) => setModal('isAlchemyOpen', open),
      setIsUpgradeOpen: (open) => setModal('isUpgradeOpen', open),
      setIsSectOpen: (open) => setModal('isSectOpen', open),
      setIsRealmOpen: (open) => setModal('isRealmOpen', open),
      setIsCharacterOpen: (open) => setModal('isCharacterOpen', open),
      setIsAchievementOpen: (open) => setModal('isAchievementOpen', open),
      setIsPetOpen: (open) => setModal('isPetOpen', open),
      setIsLotteryOpen: (open) => setModal('isLotteryOpen', open),
      setIsSettingsOpen: (open) => setModal('isSettingsOpen', open),
      setIsDailyQuestOpen: (open) => setModal('isDailyQuestOpen', open),
      setIsShopOpen: (open) => setModal('isShopOpen', open),
      setIsGrottoOpen: (open) => setModal('isGrottoOpen', open),
      setIsDebugOpen: (open) => setModal('isDebugOpen', open),
      setIsBattleModalOpen: (open) => setModal('isBattleModalOpen', open),
      setIsTurnBasedBattleOpen: (open) => setModal('isTurnBasedBattleOpen', open),
      setIsMobileSidebarOpen: (open) => setModal('isMobileSidebarOpen', open),
      setIsMobileStatsOpen: (open) => setModal('isMobileStatsOpen', open),
      setIsDebugModeEnabled: (enabled) => setModal('isDebugModeEnabled', enabled),
      setIsReputationEventOpen: (open) => setModal('isReputationEventOpen', open),
      setIsTreasureVaultOpen: (open) => setModal('isTreasureVaultOpen', open),
      setIsAutoAdventureConfigOpen: (open) => setModal('isAutoAdventureConfigOpen', open),
    }),
    [setModal]
  );
}

/**
 * 全局加载和冷却状态
 */
export function useGlobalState() {
  return useUIStore(
    useShallow((state) => ({
      loading: state.loading,
      cooldown: state.cooldown,
      setLoading: state.setLoading,
      setCooldown: state.setCooldown,
    }))
  );
}

/**
 * 商店、升级、通知相关状态
 */
export function useShopAndNotifications() {
  return useUIStore(
    useShallow((state) => ({
      currentShop: state.currentShop,
      itemToUpgrade: state.itemToUpgrade,
      purchaseSuccess: state.purchaseSuccess,
      lotteryRewards: state.lotteryRewards,
      setCurrentShop: state.setCurrentShop,
      setItemToUpgrade: state.setItemToUpgrade,
      setPurchaseSuccess: state.setPurchaseSuccess,
      setLotteryRewards: state.setLotteryRewards,
    }))
  );
}

/**
 * 战斗相关状态
 */
export function useBattleState() {
  return useUIStore(
    useShallow((state) => ({
      battleReplay: state.battleReplay,
      revealedBattleRounds: state.revealedBattleRounds,
      lastBattleReplay: state.lastBattleReplay,
      setBattleReplay: state.setBattleReplay,
      setRevealedBattleRounds: state.setRevealedBattleRounds,
      setLastBattleReplay: state.setLastBattleReplay,
    }))
  );
}

/**
 * 回合制战斗、物品日志、声望事件相关状态
 */
export function useTurnBasedAndEvents() {
  return useUIStore(
    useShallow((state) => ({
      turnBasedBattleParams: state.turnBasedBattleParams,
      itemActionLog: state.itemActionLog,
      reputationEvent: state.reputationEvent,
      setTurnBasedBattleParams: state.setTurnBasedBattleParams,
      setItemActionLog: state.setItemActionLog,
      setReputationEvent: state.setReputationEvent,
    }))
  );
}

/**
 * 自动功能相关状态
 */
export function useAutoFeaturesState() {
  return useUIStore(
    useShallow((state) => ({
      autoMeditate: state.autoMeditate,
      autoAdventure: state.autoAdventure,
      pausedByShop: state.pausedByShop,
      pausedByBattle: state.pausedByBattle,
      pausedByReputationEvent: state.pausedByReputationEvent,
      pausedByHeavenEarthSoul: state.pausedByHeavenEarthSoul,
      setAutoMeditate: state.setAutoMeditate,
      setAutoAdventure: state.setAutoAdventure,
      setPausedByShop: state.setPausedByShop,
      setPausedByBattle: state.setPausedByBattle,
      setPausedByReputationEvent: state.setPausedByReputationEvent,
      setPausedByHeavenEarthSoul: state.setPausedByHeavenEarthSoul,
    }))
  );
}

/**
 * UI Store Actions
 */
export function useUIActions() {
  return useUIStore(
    useShallow((state) => ({
      closeCurrentModal: state.closeCurrentModal,
      openTurnBasedBattle: state.openTurnBasedBattle,
      closeAllModals: state.closeAllModals,
    }))
  );
}

/**
 * 检查是否有任何弹窗打开
 */
export function useIsAnyModalOpen(): boolean {
  const modals = useModals();
  return (
    modals.isInventoryOpen ||
    modals.isCultivationOpen ||
    modals.isAlchemyOpen ||
    modals.isUpgradeOpen ||
    modals.isSectOpen ||
    modals.isRealmOpen ||
    modals.isCharacterOpen ||
    modals.isAchievementOpen ||
    modals.isPetOpen ||
    modals.isLotteryOpen ||
    modals.isSettingsOpen ||
    modals.isDailyQuestOpen ||
    modals.isShopOpen ||
    modals.isGrottoOpen ||
    modals.isBattleModalOpen ||
    modals.isTurnBasedBattleOpen ||
    modals.isReputationEventOpen ||
    modals.isTreasureVaultOpen
  );
}

/**
 * 统一的 App UI State Hook
 * 整合所有 UI 状态订阅，简化 App.tsx 的状态管理
 */
export function useAppUIState() {
  const modals = useModals();
  const modalSetters = useModalSetters();
  const globalState = useGlobalState();
  const shopAndNotifications = useShopAndNotifications();
  const battleState = useBattleState();
  const turnBasedAndEvents = useTurnBasedAndEvents();
  const autoFeaturesState = useAutoFeaturesState();
  const uiActions = useUIActions();
  const isAnyModalOpen = useIsAnyModalOpen();

  // 重置自动状态的回调
  const resetAutoStates = useCallback(() => {
    autoFeaturesState.setAutoAdventure(false);
    autoFeaturesState.setPausedByBattle(false);
    autoFeaturesState.setPausedByShop(false);
    autoFeaturesState.setPausedByReputationEvent(false);
    autoFeaturesState.setPausedByHeavenEarthSoul(false);
  }, [
    autoFeaturesState.setAutoAdventure,
    autoFeaturesState.setPausedByBattle,
    autoFeaturesState.setPausedByShop,
    autoFeaturesState.setPausedByReputationEvent,
    autoFeaturesState.setPausedByHeavenEarthSoul,
  ]);

  return {
    // Modal 状态
    modals,
    modalSetters,
    isAnyModalOpen,

    // 全局状态
    ...globalState,

    // 商店和通知
    ...shopAndNotifications,

    // 战斗状态
    ...battleState,

    // 回合制战斗和事件
    ...turnBasedAndEvents,

    // 自动功能
    ...autoFeaturesState,

    // UI Actions
    ...uiActions,

    // 辅助函数
    resetAutoStates,
  };
}

/**
 * 初始化调试模式
 */
export function useInitDebugMode(setIsDebugModeEnabled: (enabled: boolean) => void) {
  // 在组件挂载时检查调试模式
  const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
  if (debugMode) {
    setIsDebugModeEnabled(true);
  }
}

