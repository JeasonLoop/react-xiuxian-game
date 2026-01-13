/**
 * App Handlers Hook
 * 统一管理所有 handlers 的初始化和包装逻辑
 *
 * 这个 hook 从 App.tsx 中提取了所有 handlers 相关的逻辑，
 * 使 App.tsx 更加简洁和易于维护。
 *
 * 重构说明：
 * - 内联函数已提取到独立的 hooks 中
 * - 使用 useInventoryActions、useReputationEventHandler、useShopActions 等
 */
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Dispatch, SetStateAction } from 'react';
import {
  Item,
  ShopType,
  PlayerStats,
  SecretRealm,
} from '../types';
import { BattleReplay } from '../services/battleService';
import { withQuestProgress } from '../utils/questProgressDecorator';
import { logger } from '../utils/logger';
import { useBattleResultHandler } from './useBattleResultHandler';
import { useUIStore } from '../store/uiStore';
import { useInventoryActions } from './useInventoryActions';
import { useReputationEventHandler } from './useReputationEventHandler';
import { useShopActions } from './useShopActions';
import {
  useMeditationHandlers,
  useBreakthroughHandlers,
  useBattleHandlers,
  useItemHandlers,
  useEquipmentHandlers,
  useCultivationHandlers,
  useAlchemyHandlers,
  useCharacterHandlers,
  useShopHandlers,
  useSettingsHandlers,
  useRealmHandlers,
  usePetHandlers,
  useLotteryHandlers,
  useSectHandlers,
  useAchievementHandlers,
  useAdventureHandlers,
  useDailyQuestHandlers,
  useGrottoHandlers,
} from '../views';

interface UseAppHandlersProps {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  settings: any;
  gameStarted: boolean;
  autoMeditate: boolean;
  autoAdventure: boolean;
  setAutoMeditate: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void;
  pausedByReputationEvent: boolean;
  setPausedByShop: (value: boolean) => void;
  setPausedByReputationEvent: (value: boolean) => void;
  setPausedByHeavenEarthSoul: (value: boolean) => void;
  loading: boolean;
  cooldown: number;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  setDeathReason: (reason: string) => void;
  setItemActionLog: (log: { text: string; type: string } | null) => void;
  handleOpenTurnBasedBattle: (params: {
    adventureType: any;
    riskLevel?: '低' | '中' | '高' | '极度危险';
    realmMinRealm?: any;
    bossId?: string;
  }) => void;
  autoAdventureConfig?: {
    skipBattle: boolean;
    fleeOnBattle: boolean;
    skipShop: boolean;
    skipReputationEvent: boolean;
    minHpThreshold: number;
  };
}

/**
 * 统一管理所有 App 的 handlers
 */
export function useAppHandlers(props: UseAppHandlersProps) {
  const {
    player,
    setPlayer,
    addLog,
    triggerVisual,
    settings,
    autoMeditate,
    autoAdventure,
    setAutoAdventure,
    pausedByReputationEvent,
    setPausedByShop,
    setPausedByReputationEvent,
    setPausedByHeavenEarthSoul,
    loading,
    cooldown,
    setLoading,
    setCooldown,
    setItemActionLog,
    handleOpenTurnBasedBattle,
    autoAdventureConfig,
  } = props;

  // 从 zustand store 获取状态
  const {
    modals,
    currentShop,
    setCurrentShop,
    setItemToUpgrade,
    setPurchaseSuccess,
    battleReplay,
    setBattleReplay,
    revealedBattleRounds,
    setRevealedBattleRounds,
    setLastBattleReplay,
    reputationEvent: reputationEventValue,
    setReputationEvent,
  } = useUIStore(
    useShallow((state) => ({
      modals: state.modals,
      currentShop: state.currentShop,
      setCurrentShop: state.setCurrentShop,
      setItemToUpgrade: state.setItemToUpgrade,
      setPurchaseSuccess: state.setPurchaseSuccess,
      battleReplay: state.battleReplay,
      setBattleReplay: state.setBattleReplay,
      revealedBattleRounds: state.revealedBattleRounds,
      setRevealedBattleRounds: state.setRevealedBattleRounds,
      setLastBattleReplay: state.setLastBattleReplay,
      reputationEvent: state.reputationEvent,
      setReputationEvent: state.setReputationEvent,
    }))
  );

  // Modal setters - 使用 useMemo 缓存
  const setters = useMemo(() => {
    const { setModal } = useUIStore.getState();
    return {
      setIsInventoryOpen: (open: boolean) => setModal('isInventoryOpen', open),
      setIsCultivationOpen: (open: boolean) => setModal('isCultivationOpen', open),
      setIsAlchemyOpen: (open: boolean) => setModal('isAlchemyOpen', open),
      setIsUpgradeOpen: (open: boolean) => setModal('isUpgradeOpen', open),
      setIsSectOpen: (open: boolean) => setModal('isSectOpen', open),
      setIsRealmOpen: (open: boolean) => setModal('isRealmOpen', open),
      setIsCharacterOpen: (open: boolean) => setModal('isCharacterOpen', open),
      setIsAchievementOpen: (open: boolean) => setModal('isAchievementOpen', open),
      setIsPetOpen: (open: boolean) => setModal('isPetOpen', open),
      setIsLotteryOpen: (open: boolean) => setModal('isLotteryOpen', open),
      setIsSettingsOpen: (open: boolean) => setModal('isSettingsOpen', open),
      setIsDailyQuestOpen: (open: boolean) => setModal('isDailyQuestOpen', open),
      setIsShopOpen: (open: boolean) => setModal('isShopOpen', open),
      setIsGrottoOpen: (open: boolean) => setModal('isGrottoOpen', open),
      setIsDebugOpen: (open: boolean) => setModal('isDebugOpen', open),
      setIsBattleModalOpen: (open: boolean) => setModal('isBattleModalOpen', open),
      setIsTurnBasedBattleOpen: (open: boolean) => setModal('isTurnBasedBattleOpen', open),
      setIsMobileSidebarOpen: (open: boolean) => setModal('isMobileSidebarOpen', open),
      setIsMobileStatsOpen: (open: boolean) => setModal('isMobileStatsOpen', open),
      setIsDebugModeEnabled: (enabled: boolean) => setModal('isDebugModeEnabled', enabled),
      setIsReputationEventOpen: (open: boolean) => setModal('isReputationEventOpen', open),
      setIsTreasureVaultOpen: (open: boolean) => setModal('isTreasureVaultOpen', open),
    };
  }, []);

  // ========== 初始化模块化 handlers ==========

  const battleHandlers = useBattleHandlers({
    battleReplay,
    setBattleReplay,
    isBattleModalOpen: modals.isBattleModalOpen,
    setIsBattleModalOpen: setters.setIsBattleModalOpen,
    revealedBattleRounds,
    setRevealedBattleRounds,
    animationSpeed: settings.animationSpeed,
  });

  const dailyQuestHandlers = useDailyQuestHandlers({
    player,
    setPlayer,
    addLog,
  });

  const { handleBattleResult } = useBattleResultHandler({
    player,
    setPlayer,
    addLog,
    setLoading,
    updateQuestProgress: (type: string, amount: number = 1) => {
      if (dailyQuestHandlers && 'updateQuestProgress' in dailyQuestHandlers) {
        (dailyQuestHandlers as any).updateQuestProgress(type, amount);
      }
    },
  });

  const meditationHandlers = useMeditationHandlers();

  const breakthroughHandlers = useBreakthroughHandlers({
    player,
    setPlayer,
    addLog,
    setLoading,
    loading,
  });

  const itemHandlers = useItemHandlers({ setItemActionLog });
  const equipmentHandlers = useEquipmentHandlers({ setItemActionLog });
  const cultivationHandlers = useCultivationHandlers();
  const alchemyHandlers = useAlchemyHandlers({ triggerVisual });
  const characterHandlers = useCharacterHandlers({ setItemActionLog });
  const shopHandlers = useShopHandlers();
  const settingsHandlers = useSettingsHandlers({ setSettings: () => {} });
  const petHandlers = usePetHandlers({ setItemActionLog });
  const lotteryHandlers = useLotteryHandlers();

  const grottoHandlers = useGrottoHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  // 冒险相关逻辑
  const adventureHandlers = useAdventureHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    onOpenShop: (shopType: ShopType) => {
      if (autoAdventure) {
        setPausedByShop(true);
        setAutoAdventure(false);
      }
      shopHandlers.handleOpenShop(shopType);
    },
    onOpenBattleModal: (replay: BattleReplay) => {
      setLastBattleReplay(replay);
      battleHandlers.openBattleModal(replay);
    },
    onReputationEvent: (event) => {
      logger.debug('【声望事件回调触发】', {
        event,
        hasChoices: !!event?.choices,
        choicesCount: event?.choices?.length || 0,
        autoAdventure,
      });

      if (autoAdventure) {
        setPausedByReputationEvent(true);
        setAutoAdventure(false);
      }
      setReputationEvent(event);
      setters.setIsReputationEventOpen(true);
    },
    onOpenTurnBasedBattle: handleOpenTurnBasedBattle,
    skipBattle: autoAdventureConfig?.skipBattle || false,
    fleeOnBattle: autoAdventureConfig?.fleeOnBattle || false,
    skipShop: autoAdventureConfig?.skipShop || false,
    skipReputationEvent: autoAdventureConfig?.skipReputationEvent || false,
    useTurnBasedBattle: true,
    autoAdventure,
    setAutoAdventure,
    setAutoAdventurePausedByHeavenEarthSoul: setPausedByHeavenEarthSoul,
  });

  const sectHandlers = useSectHandlers({
    player,
    setPlayer,
    addLog,
    setIsSectOpen: setters.setIsSectOpen,
    setPurchaseSuccess,
    setItemActionLog,
    onChallengeLeader: handleOpenTurnBasedBattle,
  });

  const achievementHandlers = useAchievementHandlers({
    player,
    setPlayer,
    addLog,
  });

  const { executeAdventure } = adventureHandlers;
  const realmHandlers = useRealmHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    setIsRealmOpen: setters.setIsRealmOpen,
    executeAdventure,
  });

  // ========== 使用提取的 hooks ==========

  const inventoryActions = useInventoryActions({ setPlayer, addLog });

  const reputationEventHandler = useReputationEventHandler({
    player,
    setPlayer,
    addLog,
    reputationEvent: reputationEventValue,
    setReputationEvent,
    setIsReputationEventOpen: setters.setIsReputationEventOpen,
    pausedByReputationEvent,
    setPausedByReputationEvent,
    setAutoAdventure,
  });

  const shopActions = useShopActions({
    player,
    setPlayer,
    addLog,
    currentShop,
    setCurrentShop,
  });

  // ========== 包装 handlers ==========

  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;
  const handleUseInheritance = breakthroughHandlers?.handleUseInheritance || (() => {});
  const handleUseItem = itemHandlers.handleUseItem;
  const handleOrganizeInventory = itemHandlers.handleOrganizeInventory;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
  const handleRefineAdvancedItem = itemHandlers.handleRefineAdvancedItem;

  const handleBatchUse = useCallback((itemIds: string[]) => {
    itemHandlers.handleBatchUseItems(itemIds);
  }, [itemHandlers]);

  const handleEquipItem = useCallback(
    withQuestProgress(equipmentHandlers.handleEquipItem, 'equip', dailyQuestHandlers),
    [equipmentHandlers.handleEquipItem, dailyQuestHandlers]
  );

  const handleUnequipItem = equipmentHandlers.handleUnequipItem;

  const handleRefineNatalArtifact = useCallback(
    withQuestProgress(equipmentHandlers.handleRefineNatalArtifact, 'equip', dailyQuestHandlers),
    [equipmentHandlers.handleRefineNatalArtifact, dailyQuestHandlers]
  );

  const handleUnrefineNatalArtifact = equipmentHandlers.handleUnrefineNatalArtifact;

  const handleLearnArt = useCallback(
    withQuestProgress(cultivationHandlers.handleLearnArt, 'learn', dailyQuestHandlers),
    [cultivationHandlers.handleLearnArt, dailyQuestHandlers]
  );

  const handleActivateArt = cultivationHandlers.handleActivateArt;

  const handleCraft = useCallback(
    withQuestProgress(alchemyHandlers.handleCraft, 'alchemy', dailyQuestHandlers),
    [alchemyHandlers.handleCraft, dailyQuestHandlers]
  );

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;
  const handleAllocateAllAttributes = characterHandlers.handleAllocateAllAttributes;
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;
  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleDeactivatePet = petHandlers.handleDeactivatePet;

  const handleFeedPet = useCallback(
    withQuestProgress(petHandlers.handleFeedPet, 'pet', dailyQuestHandlers),
    [petHandlers.handleFeedPet, dailyQuestHandlers]
  );

  const handleBatchFeedItems = petHandlers.handleBatchFeedItems;
  const handleBatchFeedHp = petHandlers.handleBatchFeedHp;

  const handleEvolvePet = useCallback(
    withQuestProgress(petHandlers.handleEvolvePet, 'pet', dailyQuestHandlers),
    [petHandlers.handleEvolvePet, dailyQuestHandlers]
  );

  const handleReleasePet = petHandlers.handleReleasePet;
  const handleBatchReleasePets = petHandlers.handleBatchReleasePets;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;

  const handleSectTask = useCallback(
    withQuestProgress(sectHandlers.handleSectTask, 'sect', dailyQuestHandlers),
    [sectHandlers.handleSectTask, dailyQuestHandlers]
  );

  const handleSectPromote = sectHandlers.handleSectPromote;
  const handleSectBuy = sectHandlers.handleSectBuy;
  const checkAchievements = achievementHandlers.checkAchievements;

  const { handleAdventure: originalHandleAdventure } = adventureHandlers;

  // 使用 ref 存储 handlers，避免依赖项变化导致无限循环
  const meditationHandlersRef = useRef(meditationHandlers);
  const dailyQuestHandlersRef = useRef(dailyQuestHandlers);
  const originalHandleAdventureRef = useRef(originalHandleAdventure);

  useEffect(() => {
    meditationHandlersRef.current = meditationHandlers;
  }, [meditationHandlers]);

  useEffect(() => {
    dailyQuestHandlersRef.current = dailyQuestHandlers;
  }, [dailyQuestHandlers]);

  useEffect(() => {
    originalHandleAdventureRef.current = originalHandleAdventure;
  }, [originalHandleAdventure]);

  const handleAdventure = useCallback(async () => {
    if (autoMeditate) {
      addLog('正在打坐中，无法历练。请先停止自动打坐。', 'danger');
      return;
    }
    await originalHandleAdventureRef.current();
    dailyQuestHandlersRef.current.updateQuestProgress('adventure', 1);
  }, [autoMeditate, addLog]);

  const handleMeditate = useCallback(() => {
    if (loading || cooldown > 0 || !player) return;
    if (autoAdventure) {
      addLog('正在历练中，无法打坐。请先停止自动历练。', 'danger');
      return;
    }
    meditationHandlersRef.current.handleMeditate();
    dailyQuestHandlersRef.current.updateQuestProgress('meditate', 1);
    setCooldown(1);
  }, [loading, cooldown, player, autoAdventure, addLog, setCooldown]);

  const handleEnterRealm = useCallback(
    async (realm: SecretRealm) => {
      await realmHandlers.handleEnterRealm(realm);
      dailyQuestHandlers.updateQuestProgress('realm', 1);
    },
    [realmHandlers.handleEnterRealm, dailyQuestHandlers]
  );

  const handleOpenUpgrade = (item: Item) => {
    setItemToUpgrade(item);
    setters.setIsUpgradeOpen(true);
  };

  const handleUpgradeItem = async (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number = 0,
    failurePenalty: number = 0
  ): Promise<'success' | 'failure' | 'error'> => {
    const result = await equipmentHandlers.handleUpgradeItem(
      item,
      costStones,
      costMats,
      upgradeStones,
      failurePenalty
    );
    return result || 'success';
  };

  // ========== 返回所有 handlers ==========
  return {
    // 基础操作
    handleMeditate,
    handleAdventure,
    handleEnterRealm,

    // 物品相关
    handleUseItem,
    handleOrganizeInventory,
    handleDiscardItem,
    handleRefineAdvancedItem,
    handleBatchUse,
    handleBatchDiscard: inventoryActions.handleBatchDiscard,
    handleTakeTreasureVaultItem: inventoryActions.handleTakeTreasureVaultItem,
    handleUpdateVault: inventoryActions.handleUpdateVault,

    // 装备相关
    handleEquipItem,
    handleUnequipItem,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleOpenUpgrade,
    handleUpgradeItem,

    // 功法相关
    handleLearnArt,
    handleActivateArt,

    // 炼丹炼器相关
    handleCraft,
    handleCraftArtifact: alchemyHandlers.handleCraftArtifact,
    handleFuseArtifact: alchemyHandlers.handleFuseArtifact,

    // 角色相关
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,

    // 商店相关
    handleBuyItem,
    handleSellItem,
    handleRefreshShop: shopActions.handleRefreshShop,

    // 声望事件
    handleReputationEventChoice: reputationEventHandler.handleReputationEventChoice,

    // 设置
    handleUpdateSettings,

    // 灵宠相关
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,

    // 抽奖
    handleDraw,

    // 宗门相关
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleSectLearnArt: sectHandlers.handleLearnArt,
    handleChallengeLeader: sectHandlers.handleChallengeLeader,

    // 成就
    checkAchievements,

    // 战斗相关
    handleSkipBattleLogs,
    handleCloseBattleModal,
    handleBattleResult,

    // 洞府相关
    handleUpgradeGrotto: grottoHandlers.handleUpgradeGrotto,
    handlePlantHerb: grottoHandlers.handlePlantHerb,
    handleHarvestHerb: grottoHandlers.handleHarvestHerb,
    handleHarvestAll: grottoHandlers.handleHarvestAll,
    handleEnhanceSpiritArray: grottoHandlers.handleEnhanceSpiritArray,
    handleToggleAutoHarvest: grottoHandlers.handleToggleAutoHarvest,
    handleSpeedupHerb: grottoHandlers.handleSpeedupHerb,

    // 日常任务
    claimQuestReward: dailyQuestHandlers.claimQuestReward,

    // 内部 handlers（供其他 hooks 使用）
    breakthroughHandlers,
    adventureHandlers,
    dailyQuestHandlers,
    grottoHandlers,
  };
}
