/**
 * App 状态管理 Hook - 兼容层
 * 此 hook 现在从 zustand uiStore 读取状态，保持原有接口兼容
 * 后续可以逐步在组件中直接使用 useUIStore
 */

import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import {
  Item,
  Shop,
  AdventureType,
  RealmType,
  AdventureResult,
} from '../types';
import { BattleReplay } from '../services/battleService';
import { AutoAdventureConfig } from '../components/AutoAdventureConfigModal';

export interface AppModalState {
  isInventoryOpen: boolean;
  isCultivationOpen: boolean;
  isAlchemyOpen: boolean;
  isUpgradeOpen: boolean;
  isSectOpen: boolean;
  isRealmOpen: boolean;
  isCharacterOpen: boolean;
  isAchievementOpen: boolean;
  isPetOpen: boolean;
  isLotteryOpen: boolean;
  isSettingsOpen: boolean;
  isDailyQuestOpen: boolean;
  isShopOpen: boolean;
  isGrottoOpen: boolean;
  isDebugOpen: boolean;
  isBattleModalOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  isMobileSidebarOpen: boolean;
  isMobileStatsOpen: boolean;
  isDebugModeEnabled: boolean;
  isReputationEventOpen: boolean;
  isTreasureVaultOpen: boolean;
  isAutoAdventureConfigOpen: boolean;
}

export interface AppModalSetters {
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

export interface AppState {
  modals: AppModalState;
  setters: AppModalSetters;
  shop: {
    currentShop: Shop | null;
    setCurrentShop: (shop: Shop | null) => void;
  };
  upgrade: {
    itemToUpgrade: Item | null;
    setItemToUpgrade: (item: Item | null) => void;
  };
  notifications: {
    purchaseSuccess: { item: string; quantity: number } | null;
    setPurchaseSuccess: (
      value: { item: string; quantity: number } | null
    ) => void;
    lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
    setLotteryRewards: (
      value: Array<{ type: string; name: string; quantity?: number }>
    ) => void;
  };
  battle: {
    battleReplay: BattleReplay | null;
    setBattleReplay: (replay: BattleReplay | null) => void;
    revealedBattleRounds: number;
    setRevealedBattleRounds: (rounds: number) => void;
    lastBattleReplay: BattleReplay | null;
    setLastBattleReplay: (replay: BattleReplay | null) => void;
  };
  turnBasedBattle: {
    params: {
      adventureType: AdventureType;
      riskLevel?: '低' | '中' | '高' | '极度危险';
      realmMinRealm?: RealmType;
      bossId?: string;
    } | null;
    setParams: (
      params: {
        adventureType: AdventureType;
        riskLevel?: '低' | '中' | '高' | '极度危险';
        realmMinRealm?: RealmType;
        bossId?: string;
      } | null
    ) => void;
  };
  itemActionLog: {
    value: { text: string; type: string } | null;
    setValue: (value: { text: string; type: string } | null) => void;
  };
  reputationEvent: {
    event: AdventureResult['reputationEvent'] | null;
    setEvent: (event: AdventureResult['reputationEvent'] | null) => void;
  };
  auto: {
    autoMeditate: boolean;
    setAutoMeditate: (value: boolean) => void;
    autoAdventure: boolean;
    setAutoAdventure: (value: boolean) => void;
    autoAdventureConfig: AutoAdventureConfig;
    setAutoAdventureConfig: (config: AutoAdventureConfig) => void;
    pausedByShop: boolean;
    setPausedByShop: (value: boolean) => void;
    pausedByBattle: boolean;
    setPausedByBattle: (value: boolean) => void;
    pausedByReputationEvent: boolean;
    setPausedByReputationEvent: (value: boolean) => void;
    pausedByHeavenEarthSoul: boolean;
    setPausedByHeavenEarthSoul: (value: boolean) => void;
  };
  global: {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    cooldown: number;
    setCooldown: (cooldown: number) => void;
  };
  actions: {
    closeCurrentModal: () => void;
    openTurnBasedBattle: (params: {
      adventureType: AdventureType;
      riskLevel?: '低' | '中' | '高' | '极度危险';
      realmMinRealm?: RealmType;
      bossId?: string;
    }) => void;
  };
}

/**
 * 统一管理 App 的所有状态 - 兼容层
 * 从 zustand uiStore 读取状态，保持原有接口兼容
 */
export function useAppState(): AppState {
  // 从 zustand store 获取所有状态和 actions
  const store = useUIStore();

  // autoAdventureConfig 暂时在 App.tsx 中管理，这里提供默认值以保持兼容性
  // TODO: 后续可以将 autoAdventureConfig 迁移到 uiStore
  const [autoAdventureConfig, setAutoAdventureConfig] = useState<AutoAdventureConfig>({
    skipBattle: true,
    fleeOnBattle: false,
    skipShop: true,
    skipReputationEvent: true,
    minHpThreshold: 20,
  });

  return {
    modals: store.modals as AppModalState,
    setters: {
      setIsInventoryOpen: store.setIsInventoryOpen,
      setIsCultivationOpen: store.setIsCultivationOpen,
      setIsAlchemyOpen: store.setIsAlchemyOpen,
      setIsUpgradeOpen: store.setIsUpgradeOpen,
      setIsSectOpen: store.setIsSectOpen,
      setIsRealmOpen: store.setIsRealmOpen,
      setIsCharacterOpen: store.setIsCharacterOpen,
      setIsAchievementOpen: store.setIsAchievementOpen,
      setIsPetOpen: store.setIsPetOpen,
      setIsLotteryOpen: store.setIsLotteryOpen,
      setIsSettingsOpen: store.setIsSettingsOpen,
      setIsDailyQuestOpen: store.setIsDailyQuestOpen,
      setIsShopOpen: store.setIsShopOpen,
      setIsGrottoOpen: store.setIsGrottoOpen,
      setIsDebugOpen: store.setIsDebugOpen,
      setIsBattleModalOpen: store.setIsBattleModalOpen,
      setIsTurnBasedBattleOpen: store.setIsTurnBasedBattleOpen,
      setIsMobileSidebarOpen: store.setIsMobileSidebarOpen,
      setIsMobileStatsOpen: store.setIsMobileStatsOpen,
      setIsDebugModeEnabled: store.setIsDebugModeEnabled,
      setIsReputationEventOpen: store.setIsReputationEventOpen,
      setIsTreasureVaultOpen: store.setIsTreasureVaultOpen,
      setIsAutoAdventureConfigOpen: (store as any).setIsAutoAdventureConfigOpen || (() => {}),
    },
    shop: {
      currentShop: store.currentShop,
      setCurrentShop: store.setCurrentShop,
    },
    upgrade: {
      itemToUpgrade: store.itemToUpgrade,
      setItemToUpgrade: store.setItemToUpgrade,
    },
    notifications: {
      purchaseSuccess: store.purchaseSuccess,
      setPurchaseSuccess: store.setPurchaseSuccess,
      lotteryRewards: store.lotteryRewards,
      setLotteryRewards: store.setLotteryRewards,
    },
    battle: {
      battleReplay: store.battleReplay,
      setBattleReplay: store.setBattleReplay,
      revealedBattleRounds: store.revealedBattleRounds,
      setRevealedBattleRounds: store.setRevealedBattleRounds,
      lastBattleReplay: store.lastBattleReplay,
      setLastBattleReplay: store.setLastBattleReplay,
    },
    turnBasedBattle: {
      params: store.turnBasedBattleParams,
      setParams: store.setTurnBasedBattleParams,
    },
    itemActionLog: {
      value: store.itemActionLog,
      setValue: store.setItemActionLog,
    },
    reputationEvent: {
      event: store.reputationEvent,
      setEvent: store.setReputationEvent,
    },
    auto: {
      autoMeditate: store.autoMeditate,
      setAutoMeditate: store.setAutoMeditate,
      autoAdventure: store.autoAdventure,
      setAutoAdventure: store.setAutoAdventure,
      autoAdventureConfig,
      setAutoAdventureConfig,
      pausedByShop: store.pausedByShop,
      setPausedByShop: store.setPausedByShop,
      pausedByBattle: store.pausedByBattle,
      setPausedByBattle: store.setPausedByBattle,
      pausedByReputationEvent: store.pausedByReputationEvent,
      setPausedByReputationEvent: store.setPausedByReputationEvent,
      pausedByHeavenEarthSoul: store.pausedByHeavenEarthSoul,
      setPausedByHeavenEarthSoul: store.setPausedByHeavenEarthSoul,
    },
    global: {
      loading: store.loading,
      setLoading: store.setLoading,
      cooldown: store.cooldown,
      setCooldown: store.setCooldown,
    },
    actions: {
      closeCurrentModal: store.closeCurrentModal,
      openTurnBasedBattle: store.openTurnBasedBattle,
    },
  };
}
