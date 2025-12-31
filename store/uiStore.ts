/**
 * UI Store - Zustand UI 状态管理
 * 管理模态框、商店、战斗、自动功能等 UI 相关状态
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  Item,
  Shop,
  AdventureType,
  RealmType,
  AdventureResult,
} from '../types';
import { BattleReplay } from '../services/battleService';

// Modal 状态接口
interface ModalState {
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
}

// 回合制战斗参数
interface TurnBasedBattleParams {
  adventureType: AdventureType;
  riskLevel?: '低' | '中' | '高' | '极度危险';
  realmMinRealm?: RealmType;
  bossId?: string;
}

// Store 状态接口
interface UIState {
  // Modal 状态
  modals: ModalState;

  // 商店状态
  currentShop: Shop | null;

  // 升级状态
  itemToUpgrade: Item | null;

  // 通知状态
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;

  // 战斗状态
  battleReplay: BattleReplay | null;
  revealedBattleRounds: number;
  lastBattleReplay: BattleReplay | null;

  // 回合制战斗状态
  turnBasedBattleParams: TurnBasedBattleParams | null;

  // 物品操作日志
  itemActionLog: { text: string; type: string } | null;

  // 声望事件
  reputationEvent: AdventureResult['reputationEvent'] | null;

  // 自动功能状态
  autoMeditate: boolean;
  autoAdventure: boolean;
  pausedByShop: boolean;
  pausedByBattle: boolean;
  pausedByReputationEvent: boolean;

  // 全局状态
  loading: boolean;
  cooldown: number;

  // Modal Setters
  setModal: <K extends keyof ModalState>(key: K, value: ModalState[K]) => void;
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

  // 商店 Setters
  setCurrentShop: (shop: Shop | null) => void;

  // 升级 Setters
  setItemToUpgrade: (item: Item | null) => void;

  // 通知 Setters
  setPurchaseSuccess: (
    value: { item: string; quantity: number } | null
  ) => void;
  setLotteryRewards: (
    value: Array<{ type: string; name: string; quantity?: number }>
  ) => void;

  // 战斗 Setters
  setBattleReplay: (replay: BattleReplay | null) => void;
  setRevealedBattleRounds: (rounds: number) => void;
  setLastBattleReplay: (replay: BattleReplay | null) => void;

  // 回合制战斗
  setTurnBasedBattleParams: (params: TurnBasedBattleParams | null) => void;

  // 物品操作日志
  setItemActionLog: (value: { text: string; type: string } | null) => void;

  // 声望事件
  setReputationEvent: (
    event: AdventureResult['reputationEvent'] | null
  ) => void;

  // 自动功能 Setters
  setAutoMeditate: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void;
  setPausedByShop: (value: boolean) => void;
  setPausedByBattle: (value: boolean) => void;
  setPausedByReputationEvent: (value: boolean) => void;

  // 全局 Setters
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;

  // Actions
  closeCurrentModal: () => void;
  openTurnBasedBattle: (params: TurnBasedBattleParams) => void;
  closeAllModals: () => void;
}

// 默认 Modal 状态
const defaultModalState: ModalState = {
  isInventoryOpen: false,
  isCultivationOpen: false,
  isAlchemyOpen: false,
  isUpgradeOpen: false,
  isSectOpen: false,
  isRealmOpen: false,
  isCharacterOpen: false,
  isAchievementOpen: false,
  isPetOpen: false,
  isLotteryOpen: false,
  isSettingsOpen: false,
  isDailyQuestOpen: false,
  isShopOpen: false,
  isGrottoOpen: false,
  isDebugOpen: false,
  isBattleModalOpen: false,
  isTurnBasedBattleOpen: false,
  isMobileSidebarOpen: false,
  isMobileStatsOpen: false,
  isDebugModeEnabled: false,
  isReputationEventOpen: false,
  isTreasureVaultOpen: false,
};

export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态
  modals: { ...defaultModalState },
  currentShop: null,
  itemToUpgrade: null,
  purchaseSuccess: null,
  lotteryRewards: [],
  battleReplay: null,
  revealedBattleRounds: 0,
  lastBattleReplay: null,
  turnBasedBattleParams: null,
  itemActionLog: null,
  reputationEvent: null,
  autoMeditate: false,
  autoAdventure: false,
  pausedByShop: false,
  pausedByBattle: false,
  pausedByReputationEvent: false,
  loading: false,
  cooldown: 0,

  // 通用 Modal setter
  setModal: (key, value) =>
    set((state) => ({
      modals: { ...state.modals, [key]: value },
    })),

  // Modal Setters
  setIsInventoryOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isInventoryOpen: open } })),
  setIsCultivationOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isCultivationOpen: open } })),
  setIsAlchemyOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isAlchemyOpen: open } })),
  setIsUpgradeOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isUpgradeOpen: open } })),
  setIsSectOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isSectOpen: open } })),
  setIsRealmOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isRealmOpen: open } })),
  setIsCharacterOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isCharacterOpen: open } })),
  setIsAchievementOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isAchievementOpen: open } })),
  setIsPetOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isPetOpen: open } })),
  setIsLotteryOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isLotteryOpen: open } })),
  setIsSettingsOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isSettingsOpen: open } })),
  setIsDailyQuestOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isDailyQuestOpen: open } })),
  setIsShopOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isShopOpen: open } })),
  setIsGrottoOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isGrottoOpen: open } })),
  setIsDebugOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isDebugOpen: open } })),
  setIsBattleModalOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isBattleModalOpen: open } })),
  setIsTurnBasedBattleOpen: (open) =>
    set((state) => ({
      modals: { ...state.modals, isTurnBasedBattleOpen: open },
    })),
  setIsMobileSidebarOpen: (open) =>
    set((state) => ({
      modals: { ...state.modals, isMobileSidebarOpen: open },
    })),
  setIsMobileStatsOpen: (open) =>
    set((state) => ({ modals: { ...state.modals, isMobileStatsOpen: open } })),
  setIsDebugModeEnabled: (enabled) =>
    set((state) => ({
      modals: { ...state.modals, isDebugModeEnabled: enabled },
    })),
  setIsReputationEventOpen: (open) =>
    set((state) => ({
      modals: { ...state.modals, isReputationEventOpen: open },
    })),
  setIsTreasureVaultOpen: (open) =>
    set((state) => ({
      modals: { ...state.modals, isTreasureVaultOpen: open },
    })),

  // 商店 Setters
  setCurrentShop: (shop) => set({ currentShop: shop }),

  // 升级 Setters
  setItemToUpgrade: (item) => set({ itemToUpgrade: item }),

  // 通知 Setters
  setPurchaseSuccess: (value) => set({ purchaseSuccess: value }),
  setLotteryRewards: (value) => set({ lotteryRewards: value }),

  // 战斗 Setters
  setBattleReplay: (replay) => set({ battleReplay: replay }),
  setRevealedBattleRounds: (rounds) => set({ revealedBattleRounds: rounds }),
  setLastBattleReplay: (replay) => set({ lastBattleReplay: replay }),

  // 回合制战斗
  setTurnBasedBattleParams: (params) => set({ turnBasedBattleParams: params }),

  // 物品操作日志
  setItemActionLog: (value) => set({ itemActionLog: value }),

  // 声望事件
  setReputationEvent: (event) => set({ reputationEvent: event }),

  // 自动功能 Setters
  setAutoMeditate: (value) => set({ autoMeditate: value }),
  setAutoAdventure: (value) => set({ autoAdventure: value }),
  setPausedByShop: (value) => set({ pausedByShop: value }),
  setPausedByBattle: (value) => set({ pausedByBattle: value }),
  setPausedByReputationEvent: (value) =>
    set({ pausedByReputationEvent: value }),

  // 全局 Setters
  setLoading: (loading) => set({ loading }),
  setCooldown: (cooldown) => set({ cooldown }),

  // 关闭当前打开的弹窗
  closeCurrentModal: () => {
    const state = get();
    const { modals, autoAdventure, pausedByBattle } = state;

    // 在自动历练模式下，不允许通过快捷键关闭回合制战斗弹窗
    if (modals.isTurnBasedBattleOpen && autoAdventure) {
      return;
    }

    if (modals.isShopOpen) {
      set((s) => ({
        modals: { ...s.modals, isShopOpen: false },
        currentShop: null,
      }));
    } else if (modals.isInventoryOpen) {
      set((s) => ({ modals: { ...s.modals, isInventoryOpen: false } }));
    } else if (modals.isCultivationOpen) {
      set((s) => ({ modals: { ...s.modals, isCultivationOpen: false } }));
    } else if (modals.isCharacterOpen) {
      set((s) => ({ modals: { ...s.modals, isCharacterOpen: false } }));
    } else if (modals.isAchievementOpen) {
      set((s) => ({ modals: { ...s.modals, isAchievementOpen: false } }));
    } else if (modals.isPetOpen) {
      set((s) => ({ modals: { ...s.modals, isPetOpen: false } }));
    } else if (modals.isLotteryOpen) {
      set((s) => ({ modals: { ...s.modals, isLotteryOpen: false } }));
    } else if (modals.isSettingsOpen) {
      set((s) => ({ modals: { ...s.modals, isSettingsOpen: false } }));
    } else if (modals.isRealmOpen) {
      set((s) => ({ modals: { ...s.modals, isRealmOpen: false } }));
    } else if (modals.isAlchemyOpen) {
      set((s) => ({ modals: { ...s.modals, isAlchemyOpen: false } }));
    } else if (modals.isSectOpen) {
      set((s) => ({ modals: { ...s.modals, isSectOpen: false } }));
    } else if (modals.isDailyQuestOpen) {
      set((s) => ({ modals: { ...s.modals, isDailyQuestOpen: false } }));
    } else if (modals.isGrottoOpen) {
      set((s) => ({ modals: { ...s.modals, isGrottoOpen: false } }));
    } else if (modals.isUpgradeOpen) {
      set((s) => ({
        modals: { ...s.modals, isUpgradeOpen: false },
        itemToUpgrade: null,
      }));
    } else if (modals.isBattleModalOpen) {
      set((s) => ({ modals: { ...s.modals, isBattleModalOpen: false } }));
    } else if (modals.isTurnBasedBattleOpen) {
      set((s) => ({
        modals: { ...s.modals, isTurnBasedBattleOpen: false },
        turnBasedBattleParams: null,
        pausedByBattle: pausedByBattle ? false : s.pausedByBattle,
      }));
    } else if (modals.isReputationEventOpen) {
      set((s) => ({ modals: { ...s.modals, isReputationEventOpen: false } }));
    } else if (modals.isMobileSidebarOpen) {
      set((s) => ({ modals: { ...s.modals, isMobileSidebarOpen: false } }));
    } else if (modals.isMobileStatsOpen) {
      set((s) => ({ modals: { ...s.modals, isMobileStatsOpen: false } }));
    } else if (modals.isDebugOpen) {
      set((s) => ({ modals: { ...s.modals, isDebugOpen: false } }));
    }
  },

  // 打开回合制战斗
  openTurnBasedBattle: (params) => {
    const state = get();

    // 如果正在自动历练，暂停自动历练但保存状态
    if (state.autoAdventure) {
      set({
        autoAdventure: false,
        pausedByBattle: true,
      });
    }

    set((s) => ({
      turnBasedBattleParams: params,
      modals: { ...s.modals, isTurnBasedBattleOpen: true },
    }));
  },

  // 关闭所有弹窗
  closeAllModals: () => {
    set({
      modals: { ...defaultModalState },
      currentShop: null,
      itemToUpgrade: null,
    });
  },
}));

// 导出便捷 hooks
// 注意：modals 是嵌套对象，zustand 会自动处理，但如果需要优化可以使用 shallow
export const useModals = () => useUIStore((state) => state.modals);
export const useAutoFeatures = () =>
  useUIStore(
    useShallow((state) => ({
      autoMeditate: state.autoMeditate,
      autoAdventure: state.autoAdventure,
      pausedByShop: state.pausedByShop,
      pausedByBattle: state.pausedByBattle,
      pausedByReputationEvent: state.pausedByReputationEvent,
    }))
  );
export const useLoading = () => useUIStore((state) => state.loading);
export const useCooldown = () => useUIStore((state) => state.cooldown);
