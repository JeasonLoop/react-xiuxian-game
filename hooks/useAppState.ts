/**
 * App 状态管理 Hook
 * 统一管理所有模态框状态、商店状态、通知状态等
 */

import { useState } from 'react';
import {
  Item,
  Shop,
  ShopItem,
  AdventureType,
  RealmType,
} from '../types';
import { BattleReplay } from '../services/battleService';

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
  isDebugOpen: boolean;
  isBattleModalOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  isMobileSidebarOpen: boolean;
  isMobileStatsOpen: boolean;
  isDebugModeEnabled: boolean;
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
  setIsDebugOpen: (open: boolean) => void;
  setIsBattleModalOpen: (open: boolean) => void;
  setIsTurnBasedBattleOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsMobileStatsOpen: (open: boolean) => void;
  setIsDebugModeEnabled: (enabled: boolean) => void;
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
    } | null;
    setParams: (params: {
      adventureType: AdventureType;
      riskLevel?: '低' | '中' | '高' | '极度危险';
      realmMinRealm?: RealmType;
    } | null) => void;
  };
  itemActionLog: {
    value: { text: string; type: string } | null;
    setValue: (value: { text: string; type: string } | null) => void;
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [isTurnBasedBattleOpen, setIsTurnBasedBattleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [isDebugModeEnabled, setIsDebugModeEnabled] = useState(false);

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
  } | null>(null);

  // 物品操作日志
  const [itemActionLog, setItemActionLog] = useState<{
    text: string;
    type: string;
  } | null>(null);

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
      isDebugOpen,
      isBattleModalOpen,
      isTurnBasedBattleOpen,
      isMobileSidebarOpen,
      isMobileStatsOpen,
      isDebugModeEnabled,
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
      setIsDebugOpen,
      setIsBattleModalOpen,
      setIsTurnBasedBattleOpen,
      setIsMobileSidebarOpen,
      setIsMobileStatsOpen,
      setIsDebugModeEnabled,
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
  };
}

