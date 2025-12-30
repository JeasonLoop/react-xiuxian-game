/**
 * App View Handlers Hook
 * 统一管理 GameView 和 ModalsContainer 的 handlers
 */
import React from 'react';
import { useMemo } from 'react';
import { Item, BattleResult, ShopItem } from '../types';
import { PlayerStats } from '../types';

interface UseAppViewHandlersProps {
  // Handlers
  handleMeditate: () => void;
  handleAdventure: () => void;
  handleEnterRealm: (realm: any) => void;
  handleUseItem: (item: Item) => void;
  handleEquipItem: (item: Item, slot: any) => void;
  handleUnequipItem: (slot: any) => void;
  handleOpenUpgrade: (item: Item) => void;
  handleDiscardItem: (item: Item) => void;
  handleBatchDiscard: (itemIds: string[]) => void;
  handleBatchUse: (itemIds: string[]) => void;
  handleOrganizeInventory: () => void;
  handleRefineNatalArtifact: (item: Item) => void;
  handleUnrefineNatalArtifact: (item: Item) => void;
  handleRefineAdvancedItem: (item: Item) => void;
  handleUpgradeItem: (item: Item, costStones: number, costMats: number, upgradeStones?: number) => Promise<'success' | 'failure' | 'error'>;
  handleLearnArt: (art: any) => void;
  handleActivateArt: (art: any) => void;
  handleCraft: (recipe: any) => Promise<void>;
  handleJoinSect: (sectId: string) => void;
  handleLeaveSect: () => void;
  handleSafeLeaveSect: () => void;
  handleSectTask: (task: any, encounterResult?: any) => void;
  handleSectPromote: () => void;
  handleSectBuy: (itemTemplate: Partial<Item>, cost: number, quantity?: number) => void;
  handleChallengeLeader: (params: any) => void;
  handleSelectTalent: (talentId: string) => void;
  handleSelectTitle: (titleId: string) => void;
  handleAllocateAttribute: (attribute: string, amount: number) => void;
  handleAllocateAllAttributes: (type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed') => void;
  handleUseInheritance: () => void;
  handleActivatePet: (petId: string) => void;
  handleDeactivatePet: (petId: string) => void;
  handleFeedPet: (petId: string, feedType: 'hp' | 'item' | 'exp', itemId?: string) => void;
  handleBatchFeedItems: (petId: string, itemIds: string[]) => void;
  handleBatchFeedHp: (petId: string, amount: number) => void;
  handleEvolvePet: (petId: string) => void;
  handleReleasePet: (petId: string) => void;
  handleBatchReleasePets: (petIds: string[]) => void;
  handleDraw: (count: number) => void;
  handleUpdateSettings: (updates: any) => void;
  handleRebirth: () => void;
  handleClaimQuestReward: (questId: string) => void;
  handleUpgradeGrotto: (targetLevel: number) => void;
  handlePlantHerb: (herbId: string, slot: number) => void;
  handleHarvestHerb: (slot: number) => void;
  handleHarvestAll: () => void;
  handleEnhanceSpiritArray: (enhancementId: string) => void;
  handleToggleAutoHarvest: () => void;
  handleSpeedupHerb: (slot: number) => void;
  handleBuyItem: (shopItem: ShopItem, quantity?: number) => void;
  handleSellItem: (item: Item, quantity?: number) => void;
  handleRefreshShop: (newItems: any[]) => void;
  handleReputationEventChoice: (choiceIndex: number) => void;
  handleTakeTreasureVaultItem: (item: Item) => void;
  handleUpdateVault: (vault: any) => void;
  handleBattleResult: (result: BattleResult | null, updatedInventory?: Item[]) => void;
  handleSkipBattleLogs: () => void;
  handleCloseBattleModal: () => void;

  // Setters
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
  setIsDebugOpen: (open: boolean) => void;
  setIsDailyQuestOpen: (open: boolean) => void;
  setIsShopOpen: (open: boolean) => void;
  setIsGrottoOpen: (open: boolean) => void;
  setIsBattleModalOpen: (open: boolean) => void;
  setIsTurnBasedBattleOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsMobileStatsOpen: (open: boolean) => void;
  setIsReputationEventOpen: (open: boolean) => void;
  setIsTreasureVaultOpen: (open: boolean) => void;
  setIsSaveManagerOpen: (open: boolean) => void;
  setItemToUpgrade: (item: Item | null) => void;
  setCurrentShop: (shop: any | null) => void;
  setBattleReplay: (replay: any | null) => void;
  setRevealedBattleRounds: (rounds: number) => void;
  setTurnBasedBattleParams: (params: any | null) => void;
  setReputationEvent: (event: any | null) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;

  // State
  autoMeditate: boolean;
  autoAdventure: boolean;
  autoAdventurePausedByShop: boolean;
  autoAdventurePausedByReputationEvent: boolean;
  setAutoMeditate: (value: boolean | ((prev: boolean) => boolean)) => void;
  setAutoAdventure: (value: boolean | ((prev: boolean) => boolean)) => void;
  setAutoAdventurePausedByShop: (value: boolean) => void;
  setAutoAdventurePausedByBattle: (value: boolean) => void;
  setAutoAdventurePausedByReputationEvent: (value: boolean) => void;
}

/**
 * 生成 GameView 的 handlers
 */
export function useGameViewHandlers(props: UseAppViewHandlersProps) {
  const {
    handleMeditate,
    handleAdventure,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsMobileSidebarOpen,
    setIsCultivationOpen,
    setIsInventoryOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsDailyQuestOpen,
    setIsGrottoOpen,
    setIsSettingsOpen,
    setIsDebugOpen,
    setIsMobileStatsOpen,
    setPlayer,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
  } = props;

  return useMemo(() => ({
    onMeditate: handleMeditate,
    onAdventure: handleAdventure,
    onOpenRealm: () => setIsRealmOpen(true),
    onOpenAlchemy: () => setIsAlchemyOpen(true),
    onOpenSect: () => setIsSectOpen(true),
    onOpenMenu: () => setIsMobileSidebarOpen(true),
    onOpenCultivation: () => setIsCultivationOpen(true),
    onOpenInventory: () => setIsInventoryOpen(true),
    onOpenCharacter: () => setIsCharacterOpen(true),
    onOpenAchievement: () => {
      setIsAchievementOpen(true);
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    onOpenPet: () => setIsPetOpen(true),
    onOpenLottery: () => setIsLotteryOpen(true),
    onOpenDailyQuest: () => setIsDailyQuestOpen(true),
    onOpenGrotto: () => setIsGrottoOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenDebug: () => setIsDebugOpen(true),
    onOpenStats: () => setIsMobileStatsOpen(true),
    onUpdateViewedAchievements: () => {
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    autoMeditate,
    autoAdventure,
    onToggleAutoMeditate: () => {
      setAutoMeditate((prev) => {
        const newValue = !prev;
        return newValue;
      });
    },
    onToggleAutoAdventure: () => {
      setAutoAdventure((prev) => {
        const newValue = !prev;
        if (!newValue) {
          setAutoAdventurePausedByShop(false);
          setAutoAdventurePausedByBattle(false);
          setAutoAdventurePausedByReputationEvent(false);
        }
        return newValue;
      });
    },
  }), [
    handleMeditate,
    handleAdventure,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsMobileSidebarOpen,
    setIsCultivationOpen,
    setIsInventoryOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsDailyQuestOpen,
    setIsGrottoOpen,
    setIsSettingsOpen,
    setIsDebugOpen,
    setIsMobileStatsOpen,
    setPlayer,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
  ]);
}

/**
 * 生成 ModalsContainer 的 handlers
 */
export function useModalsHandlers(props: UseAppViewHandlersProps) {
  const {
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
    setIsGrottoOpen,
    setIsShopOpen,
    setIsBattleModalOpen,
    setItemToUpgrade,
    setCurrentShop,
    setBattleReplay,
    setRevealedBattleRounds,
    handleSkipBattleLogs,
    handleCloseBattleModal,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
    handleOpenUpgrade,
    handleDiscardItem,
    handleBatchDiscard,
    handleBatchUse,
    handleOrganizeInventory,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleRefineAdvancedItem,
    handleUpgradeItem,
    handleLearnArt,
    handleActivateArt,
    handleCraft,
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleChallengeLeader,
    handleEnterRealm,
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
    setPlayer,
    addLog,
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
    handleDraw,
    handleUpdateSettings,
    handleRebirth,
    setIsSaveManagerOpen,
    handleClaimQuestReward,
    handleUpgradeGrotto,
    handlePlantHerb,
    handleHarvestHerb,
    handleHarvestAll,
    handleEnhanceSpiritArray,
    handleToggleAutoHarvest,
    handleSpeedupHerb,
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,
    handleReputationEventChoice,
    setIsReputationEventOpen,
    setReputationEvent,
    autoAdventurePausedByReputationEvent,
    setAutoAdventure,
    setIsTreasureVaultOpen,
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    setIsTurnBasedBattleOpen,
    setTurnBasedBattleParams,
    handleBattleResult,
    autoAdventure,
    autoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByReputationEvent,
  } = props;

  return useMemo(() => ({
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsAlchemyOpen,
    setIsUpgradeOpen: (open: boolean) => {
      setIsUpgradeOpen(open);
      if (!open) setItemToUpgrade(null);
    },
    setIsSectOpen,
    setIsRealmOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsDailyQuestOpen,
    setIsGrottoOpen,
    setIsShopOpen: (open: boolean) => {
      setIsShopOpen(open);
      if (!open) {
        setCurrentShop(null);
        if (autoAdventurePausedByShop) {
          setAutoAdventurePausedByShop(false);
          setAutoAdventure(true);
        }
      }
    },
    setIsBattleModalOpen,
    setItemToUpgrade,
    setCurrentShop,
    setBattleReplay,
    setRevealedBattleRounds,
    handleSkipBattleLogs,
    handleCloseBattleModal,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
    handleOpenUpgrade,
    handleDiscardItem,
    handleBatchDiscard,
    handleBatchUse,
    handleOrganizeInventory,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleRefineAdvancedItem,
    handleUpgradeItem,
    handleLearnArt,
    handleActivateArt,
    handleCraft,
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleChallengeLeader,
    handleEnterRealm,
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
    setPlayer,
    addLog,
    handleUpdateViewedAchievements: () => {
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
    handleDraw,
    handleUpdateSettings,
    handleRestartGame: handleRebirth,
    onOpenSaveManager: () => setIsSaveManagerOpen(true),
    handleClaimQuestReward,
    handleUpgradeGrotto,
    handlePlantHerb,
    handleHarvestHerb,
    handleHarvestAll,
    handleEnhanceSpiritArray,
    handleToggleAutoHarvest,
    handleSpeedupHerb,
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,
    handleReputationEventChoice,
    setIsReputationEventOpen: (open: boolean) => {
      setIsReputationEventOpen(open);
      if (!open) {
        setReputationEvent(null);
        if (autoAdventurePausedByReputationEvent) {
          setAutoAdventurePausedByReputationEvent(false);
          setAutoAdventure(true);
        }
      }
    },
    setIsTreasureVaultOpen: (open: boolean) => setIsTreasureVaultOpen(open),
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    setIsTurnBasedBattleOpen: (open: boolean) => {
      setIsTurnBasedBattleOpen(open);
      if (!open) {
        setTurnBasedBattleParams(null);
      }
    },
    handleTurnBasedBattleClose: (result: BattleResult | null, updatedInventory?: Item[]) => {
      setIsTurnBasedBattleOpen(false);
      setTurnBasedBattleParams(null);
      handleBattleResult(result, updatedInventory);
      if (!autoAdventure) {
        setAutoAdventurePausedByBattle(false);
        return;
      }
      setPlayer((currentPlayer) => {
        if (result && currentPlayer) {
          const playerHpAfter = Math.max(0, currentPlayer.hp - (result.hpLoss || 0));
          if (playerHpAfter <= 0) {
            setAutoAdventurePausedByBattle(false);
          }
        } else {
          setAutoAdventurePausedByBattle(false);
        }
        return currentPlayer;
      });
    },
  }), [
    setIsInventoryOpen, setIsCultivationOpen, setIsAlchemyOpen, setIsUpgradeOpen,
    setIsSectOpen, setIsRealmOpen, setIsCharacterOpen, setIsAchievementOpen,
    setIsPetOpen, setIsLotteryOpen, setIsSettingsOpen, setIsDailyQuestOpen,
    setIsGrottoOpen, setIsShopOpen, setIsBattleModalOpen, setItemToUpgrade,
    setCurrentShop, setBattleReplay, setRevealedBattleRounds, handleSkipBattleLogs,
    handleCloseBattleModal, handleUseItem, handleEquipItem, handleUnequipItem,
    handleOpenUpgrade, handleDiscardItem, handleBatchDiscard, handleBatchUse,
    handleOrganizeInventory, handleRefineNatalArtifact, handleUnrefineNatalArtifact,
    handleRefineAdvancedItem, handleUpgradeItem, handleLearnArt, handleActivateArt,
    handleCraft, handleJoinSect, handleLeaveSect, handleSafeLeaveSect, handleSectTask,
    handleSectPromote, handleSectBuy, handleChallengeLeader,
    handleEnterRealm, handleSelectTalent, handleSelectTitle, handleAllocateAttribute,
    handleAllocateAllAttributes, handleUseInheritance, setPlayer, addLog,
    handleActivatePet, handleDeactivatePet, handleFeedPet, handleBatchFeedItems,
    handleBatchFeedHp, handleEvolvePet, handleReleasePet, handleBatchReleasePets,
    handleDraw, handleUpdateSettings, handleRebirth, setIsSaveManagerOpen,
    handleClaimQuestReward, handleUpgradeGrotto, handlePlantHerb,
    handleHarvestHerb, handleHarvestAll, handleEnhanceSpiritArray,
    handleToggleAutoHarvest, handleSpeedupHerb, handleBuyItem, handleSellItem,
    handleRefreshShop, handleReputationEventChoice, setIsReputationEventOpen,
    setReputationEvent, autoAdventurePausedByReputationEvent, setAutoAdventure,
    setIsTreasureVaultOpen, handleTakeTreasureVaultItem, handleUpdateVault,
    setIsTurnBasedBattleOpen, setTurnBasedBattleParams, handleBattleResult,
    autoAdventure, autoAdventurePausedByShop, setCurrentShop,
    setAutoAdventurePausedByBattle, setAutoAdventurePausedByShop,
    setAutoAdventurePausedByReputationEvent,
  ]);
}

