/**
 * App 状态管理 Hook
 * 统一管理所有模态框状态、商店状态、通知状态等
 */

import { useState, useCallback } from 'react';
import {
  Item,
  Shop,
  ShopItem,
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
    setPurchaseSuccess: (value: { item: string; quantity: number } | null) => void;
    lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
    setLotteryRewards: (value: Array<{ type: string; name: string; quantity?: number }>) => void;
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
    setParams: (params: {
      adventureType: AdventureType;
      riskLevel?: '低' | '中' | '高' | '极度危险';
      realmMinRealm?: RealmType;
      bossId?: string;
    } | null) => void;
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
 * 统一管理 App 的所有状态
 */
export function useAppState(): AppState {
  // 模态框状态
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCultivationOpen, setIsCultivationOpen] = useState(false);
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSectOpen, setIsSectOpen] = useState(false);
  const [isRealmOpen, setIsRealmOpen] = useState(false);
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isPetOpen, setIsPetOpen] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyQuestOpen, setIsDailyQuestOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGrottoOpen, setIsGrottoOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [isTurnBasedBattleOpen, setIsTurnBasedBattleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [isDebugModeEnabled, setIsDebugModeEnabled] = useState(false);
  const [isReputationEventOpen, setIsReputationEventOpen] = useState(false);
  const [isTreasureVaultOpen, setIsTreasureVaultOpen] = useState(false);
  const [isAutoAdventureConfigOpen, setIsAutoAdventureConfigOpen] = useState(false);

  // 商店状态
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  // 升级状态
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null);

  // 通知状态
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    item: string;
    quantity: number;
  } | null>(null);
  const [lotteryRewards, setLotteryRewards] = useState<
    Array<{ type: string; name: string; quantity?: number }>
  >([]);

  // 战斗状态
  const [battleReplay, setBattleReplay] = useState<BattleReplay | null>(null);
  const [revealedBattleRounds, setRevealedBattleRounds] = useState(0);
  const [lastBattleReplay, setLastBattleReplay] = useState<BattleReplay | null>(null);

  // 回合制战斗状态
  const [turnBasedBattleParams, setTurnBasedBattleParams] = useState<{
    adventureType: AdventureType;
    riskLevel?: '低' | '中' | '高' | '极度危险';
    realmMinRealm?: RealmType;
    bossId?: string;
  } | null>(null);

  // 物品操作日志
  const [itemActionLog, setItemActionLog] = useState<{
    text: string;
    type: string;
  } | null>(null);

  // 声望事件
  const [reputationEvent, setEvent] = useState<AdventureResult['reputationEvent'] | null>(null);

  // 自动功能状态
  const [autoMeditate, setAutoMeditate] = useState(false);
  const [autoAdventure, setAutoAdventure] = useState(false);
  const [autoAdventureConfig, setAutoAdventureConfig] = useState({
    skipBattle: false,
    fleeOnBattle: false,
    skipShop: true, // 默认跳过商店
    skipReputationEvent: false,
    minHpThreshold: 0, // 默认不限制
  });
  const [pausedByShop, setPausedByShop] = useState(false);
  const [pausedByBattle, setPausedByBattle] = useState(false);
  const [pausedByReputationEvent, setPausedByReputationEvent] = useState(false);
  const [pausedByHeavenEarthSoul, setPausedByHeavenEarthSoul] = useState(false);

  // 全局加载和冷却状态
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 关闭当前打开的弹窗
  const closeCurrentModal = useCallback(() => {
    // 在自动历练模式下，不允许通过快捷键关闭回合制战斗弹窗
    if (isTurnBasedBattleOpen && autoAdventure) {
      return;
    }

    if (isShopOpen) {
      setIsShopOpen(false);
      setCurrentShop(null);
    }
    else if (isInventoryOpen) setIsInventoryOpen(false);
    else if (isCultivationOpen) setIsCultivationOpen(false);
    else if (isCharacterOpen) setIsCharacterOpen(false);
    else if (isAchievementOpen) setIsAchievementOpen(false);
    else if (isPetOpen) setIsPetOpen(false);
    else if (isLotteryOpen) setIsLotteryOpen(false);
    else if (isSettingsOpen) setIsSettingsOpen(false);
    else if (isRealmOpen) setIsRealmOpen(false);
    else if (isAlchemyOpen) setIsAlchemyOpen(false);
    else if (isSectOpen) setIsSectOpen(false);
    else if (isDailyQuestOpen) setIsDailyQuestOpen(false);
    else if (isGrottoOpen) setIsGrottoOpen(false);
    else if (isUpgradeOpen) {
      setIsUpgradeOpen(false);
      setItemToUpgrade(null);
    }
    else if (isBattleModalOpen) setIsBattleModalOpen(false);
    else if (isTurnBasedBattleOpen) {
      setIsTurnBasedBattleOpen(false);
      setTurnBasedBattleParams(null);
      if (pausedByBattle) {
        setPausedByBattle(false);
      }
    }
    else if (isReputationEventOpen) setIsReputationEventOpen(false);
    else if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
    else if (isMobileStatsOpen) setIsMobileStatsOpen(false);
    else if (isDebugOpen) setIsDebugOpen(false);
  }, [
    isShopOpen, isInventoryOpen, isCultivationOpen, isCharacterOpen,
    isAchievementOpen, isPetOpen, isLotteryOpen, isSettingsOpen,
    isRealmOpen, isAlchemyOpen, isSectOpen, isDailyQuestOpen,
    isGrottoOpen, isUpgradeOpen, isBattleModalOpen, isTurnBasedBattleOpen,
    isReputationEventOpen, isMobileSidebarOpen, isMobileStatsOpen, isDebugOpen,
    autoAdventure, pausedByBattle
  ]);

  // 统一处理回合制战斗打开逻辑
  const openTurnBasedBattle = useCallback((params: {
    adventureType: AdventureType;
    riskLevel?: '低' | '中' | '高' | '极度危险';
    realmMinRealm?: RealmType;
    bossId?: string;
  }) => {
    // 如果正在自动历练，暂停自动历练但保存状态
    if (autoAdventure) {
      setAutoAdventure(false);
      setPausedByBattle(true);
    }
    setTurnBasedBattleParams(params);
    setIsTurnBasedBattleOpen(true);
  }, [autoAdventure, setAutoAdventure, setPausedByBattle, setTurnBasedBattleParams, setIsTurnBasedBattleOpen]);

  return {
    modals: {
      isInventoryOpen,
      isCultivationOpen,
      isAlchemyOpen,
      isUpgradeOpen,
      isSectOpen,
      isRealmOpen,
      isCharacterOpen,
      isAchievementOpen,
      isPetOpen,
      isLotteryOpen,
      isSettingsOpen,
      isDailyQuestOpen,
      isShopOpen,
      isGrottoOpen,
      isDebugOpen,
      isBattleModalOpen,
      isTurnBasedBattleOpen,
      isMobileSidebarOpen,
      isMobileStatsOpen,
      isDebugModeEnabled,
      isReputationEventOpen,
      isTreasureVaultOpen,
      isAutoAdventureConfigOpen,
    },
    setters: {
      setIsInventoryOpen,
      setIsCultivationOpen,
      setIsAlchemyOpen,
      setIsUpgradeOpen,
      setIsSectOpen,
      setIsRealmOpen,
      setIsCharacterOpen,
      setIsAchievementOpen,
      setIsPetOpen,
      setIsLotteryOpen,
      setIsSettingsOpen,
      setIsDailyQuestOpen,
      setIsShopOpen,
      setIsGrottoOpen,
      setIsDebugOpen,
      setIsBattleModalOpen,
      setIsTurnBasedBattleOpen,
      setIsMobileSidebarOpen,
      setIsMobileStatsOpen,
      setIsDebugModeEnabled,
      setIsReputationEventOpen,
      setIsTreasureVaultOpen,
      setIsAutoAdventureConfigOpen,
    },
    shop: {
      currentShop,
      setCurrentShop,
    },
    upgrade: {
      itemToUpgrade,
      setItemToUpgrade,
    },
    notifications: {
      purchaseSuccess,
      setPurchaseSuccess,
      lotteryRewards,
      setLotteryRewards,
    },
    battle: {
      battleReplay,
      setBattleReplay,
      revealedBattleRounds,
      setRevealedBattleRounds,
      lastBattleReplay,
      setLastBattleReplay,
    },
    turnBasedBattle: {
      params: turnBasedBattleParams,
      setParams: setTurnBasedBattleParams,
    },
    itemActionLog: {
      value: itemActionLog,
      setValue: setItemActionLog,
    },
    reputationEvent: {
      event: reputationEvent,
      setEvent,
    },
    auto: {
      autoMeditate,
      setAutoMeditate,
      autoAdventure,
      setAutoAdventure,
      autoAdventureConfig,
      setAutoAdventureConfig,
      pausedByShop,
      setPausedByShop,
      pausedByBattle,
      setPausedByBattle,
      pausedByReputationEvent,
      setPausedByReputationEvent,
      pausedByHeavenEarthSoul,
      setPausedByHeavenEarthSoul,
    },
    global: {
      loading,
      setLoading,
      cooldown,
      setCooldown,
    },
    actions: {
      closeCurrentModal,
      openTurnBasedBattle,
    },
  };
}

