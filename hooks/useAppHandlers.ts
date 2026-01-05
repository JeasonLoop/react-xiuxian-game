/**
 * App Handlers Hook
 * 统一管理所有 handlers 的初始化和包装逻辑
 *
 * 这个 hook 从 App.tsx 中提取了所有 handlers 相关的逻辑，
 * 使 App.tsx 更加简洁和易于维护。
 */
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Dispatch, SetStateAction } from 'react';
import {
  Item,
  ShopItem,
  ShopType,
  PlayerStats,
  SecretRealm,
} from '../types';
import { BattleReplay } from '../services/battleService';
import { compareItemEffects } from '../utils/objectUtils';
import { getPlayerTotalStats } from '../utils/statUtils';
import { withQuestProgress } from '../utils/questProgressDecorator';
import { logger } from '../utils/logger';
import { useBattleResultHandler } from './useBattleResultHandler';
import { useUIStore } from '../store/uiStore';
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
 *
 * 这个 hook 负责：
 * 1. 初始化所有模块化的 handlers
 * 2. 包装 handlers 以添加任务进度更新等功能
 * 3. 组合 handlers 供组件使用
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
    loading,
    cooldown,
    setLoading,
    setCooldown,
    setItemActionLog,
    handleOpenTurnBasedBattle,
    autoAdventureConfig,
  } = props;

  // 直接从 zustand store 获取状态，使用 useShallow 批量选择以减少重渲染
  const {
    modals,
    currentShop,
    setCurrentShop,
    setItemToUpgrade,
    setPurchaseSuccess,
    setLotteryRewards,
    battleReplay,
    setBattleReplay,
    revealedBattleRounds,
    setRevealedBattleRounds,
    setLastBattleReplay,
    reputationEvent: reputationEventValue,
    setReputationEvent,
    pausedByShop,
    pausedByBattle,
    setPausedByBattle,
  } = useUIStore(
    useShallow((state) => ({
      modals: state.modals,
      currentShop: state.currentShop,
      setCurrentShop: state.setCurrentShop,
      setItemToUpgrade: state.setItemToUpgrade,
      setPurchaseSuccess: state.setPurchaseSuccess,
      setLotteryRewards: state.setLotteryRewards,
      battleReplay: state.battleReplay,
      setBattleReplay: state.setBattleReplay,
      revealedBattleRounds: state.revealedBattleRounds,
      setRevealedBattleRounds: state.setRevealedBattleRounds,
      setLastBattleReplay: state.setLastBattleReplay,
      reputationEvent: state.reputationEvent,
      setReputationEvent: state.setReputationEvent,
      pausedByShop: state.pausedByShop,
      pausedByBattle: state.pausedByBattle,
      setPausedByBattle: state.setPausedByBattle,
    }))
  );

  // Modal setters - 使用 useMemo 缓存，避免每次渲染创建新对象
  // Zustand 的函数引用是稳定的，所以依赖项为空数组
  const setters = useMemo(() => {
    const store = useUIStore.getState();
    return {
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
    };
  }, []);

  // 初始化所有模块化的 handlers
  // 注意：所有 hooks 必须无条件调用，以遵守 React Hooks 规则
  // 各个 hooks 内部会处理 player 为 null 的情况
  const battleHandlers = useBattleHandlers({
    battleReplay,
    setBattleReplay,
    isBattleModalOpen: modals.isBattleModalOpen,
    setIsBattleModalOpen: setters.setIsBattleModalOpen,
    revealedBattleRounds,
    setRevealedBattleRounds,
    animationSpeed: settings.animationSpeed,
  });

  // 日常任务相关逻辑（需要在其他 handlers 之前初始化，因为其他 handlers 会使用它）
  const dailyQuestHandlers = useDailyQuestHandlers({
    player,
    setPlayer,
    addLog,
  });

  // 使用战斗结果处理 hook
  const { handleBattleResult } = useBattleResultHandler({
    player,
    setPlayer,
    addLog,
    setLoading,
    updateQuestProgress: (type: string, amount: number = 1) => {
      // 类型安全转换：string -> DailyQuestType，运行时验证
      if (dailyQuestHandlers && 'updateQuestProgress' in dailyQuestHandlers) {
        (dailyQuestHandlers as any).updateQuestProgress(type, amount);
      }
    },
  });

  // meditationHandlers 现在直接从 zustand store 获取状态，无需传入 props
  const meditationHandlers = useMeditationHandlers();

  const breakthroughHandlers = useBreakthroughHandlers({
    player,
    setPlayer,
    addLog,
    setLoading,
    loading,
  });

  // Items 和 Equipment handlers 现在直接从 zustand store 获取状态
  // 不再需要传入 props（向后兼容，仍支持传入 props）
  const itemHandlers = useItemHandlers();

  const equipmentHandlers = useEquipmentHandlers();

  // cultivationHandlers 现在直接从 zustand store 获取状态，无需传入 props
  const cultivationHandlers = useCultivationHandlers();

  // alchemyHandlers 现在直接从 zustand store 获取状态，triggerVisual 仍从 props 传入（来自 useGameEffects）
  const alchemyHandlers = useAlchemyHandlers({
    triggerVisual,
  });

  // characterHandlers 现在直接从 zustand store 获取状态，无需传入 props
  const characterHandlers = useCharacterHandlers();

  // shopHandlers 现在直接从 zustand store 获取状态，无需传入 props
  const shopHandlers = useShopHandlers();

  const settingsHandlers = useSettingsHandlers({
    setSettings: () => {}, // TODO: 需要传入实际的 setSettings
  });

  // petHandlers 现在直接从 zustand store 获取状态，无需传入 props
  const petHandlers = usePetHandlers();

  // lotteryHandlers 现在直接从 zustand store 获取状态，无需传入 props
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

  // 现在可以使用 executeAdventure 初始化 realmHandlers
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

  // 从 handlers 中提取函数
  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;

  // 包装 handlers，添加任务进度更新等功能
  // 注意：当 player 为 null 时，这些 handlers 可能返回空函数或抛出错误
  // 但 hooks 必须始终被调用以遵守 React Hooks 规则
  const handleUseInheritance = breakthroughHandlers?.handleUseInheritance || (() => {});

  const handleUseItem = itemHandlers.handleUseItem;
  const handleOrganizeInventory = itemHandlers.handleOrganizeInventory;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
  const handleRefineAdvancedItem = itemHandlers.handleRefineAdvancedItem;
  const handleBatchUse = useCallback((itemIds: string[]) => {
    itemHandlers.handleBatchUseItems(itemIds);
  }, [itemHandlers]);

  const handleBatchDiscard = useCallback((itemIds: string[]) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const itemIdsSet = new Set(itemIds);
      const newInv = prev.inventory.filter((i) => !itemIdsSet.has(i.id));
      addLog(`你批量丢弃了 ${itemIds.length} 件物品。`, 'normal');
      return { ...prev, inventory: newInv };
    });
  }, [addLog, setPlayer]);

  const handleTakeTreasureVaultItem = useCallback((item: Item) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const newInv = [...prev.inventory];
      const isEquipment = item.isEquippable || false;

      if (!isEquipment) {
        const existingIndex = newInv.findIndex(
          i => i.name === item.name &&
          i.type === item.type &&
          i.rarity === item.rarity &&
          compareItemEffects(i.effect, item.effect, i.permanentEffect, item.permanentEffect)
        );

        if (existingIndex >= 0) {
          newInv[existingIndex].quantity += item.quantity;
        } else {
          newInv.push(item);
        }
      } else {
        newInv.push(item);
      }

      const currentVault = prev.sectTreasureVault || { items: [], takenItemIds: [] };
      const takenIdsSet = new Set(currentVault.takenItemIds || []);
      if (!takenIdsSet.has(item.id)) {
        takenIdsSet.add(item.id);
      }
      const newTakenIds = Array.from(takenIdsSet);

      addLog(`✨ 你从宗门宝库中获得了【${item.name}】！`, 'special');
      return {
        ...prev,
        inventory: newInv,
        sectTreasureVault: {
          ...currentVault,
          takenItemIds: newTakenIds,
        },
      };
    });
  }, [addLog, setPlayer]);

  const handleUpdateVault = useCallback((vault: { items: Item[]; takenItemIds: string[] }) => {
    setPlayer((prev) => ({
      ...prev,
      sectTreasureVault: vault,
    }));
  }, [setPlayer]);

  // 包装 handleEquipItem，添加任务进度更新
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

  const handleRefreshShop = useCallback((newItems: ShopItem[]) => {
    if (!currentShop || !player) return;
    const refreshCost = currentShop.refreshCost || 100;
    if (player.spiritStones < refreshCost) {
      addLog(`灵石不足，无法刷新商店。需要${refreshCost}灵石。`, 'danger');
      return;
    }
    setCurrentShop({
      ...currentShop,
      items: newItems,
    });
    setPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        spiritStones: prev.spiritStones - refreshCost,
      };
    });
    addLog('商店物品已刷新！', 'special');
  }, [currentShop, player, addLog, setCurrentShop, setPlayer]);

  const handleReputationEventChoice = useCallback((choiceIndex: number) => {
    if (!reputationEventValue || !player) return;

    const choice = reputationEventValue.choices[choiceIndex];
    if (!choice) return;

    setPlayer((prev) => {
      if (!prev) return prev;
      const newReputation = Math.max(
        0,
        (prev.reputation || 0) + choice.reputationChange
      );
      let newHp = prev.hp;
      let newExp = prev.exp;
      let newSpiritStones = prev.spiritStones;

      if (choice.hpChange !== undefined) {
        const totalStats = getPlayerTotalStats(prev);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.max(0, Math.min(actualMaxHp, prev.hp + choice.hpChange));
      }
      if (choice.expChange !== undefined) {
        newExp = Math.max(0, prev.exp + choice.expChange);
      }
      if (choice.spiritStonesChange !== undefined) {
        newSpiritStones = Math.max(
          0,
          prev.spiritStones + choice.spiritStonesChange
        );
      }

      if (choice.reputationChange > 0) {
        addLog(
          `✨ 你的声望增加了 ${choice.reputationChange} 点！当前声望：${newReputation}`,
          'gain'
        );
      } else if (choice.reputationChange < 0) {
        addLog(
          `⚠️ 你的声望减少了 ${Math.abs(choice.reputationChange)} 点！当前声望：${newReputation}`,
          'danger'
        );
      }

      if (choice.description) {
        addLog(
          choice.description,
          choice.reputationChange > 0
            ? 'gain'
            : choice.reputationChange < 0
              ? 'danger'
              : 'normal'
        );
      }

      return {
        ...prev,
        reputation: newReputation,
        hp: newHp,
        exp: newExp,
        spiritStones: newSpiritStones,
      };
    });

    setters.setIsReputationEventOpen(false);
    setReputationEvent(null);

    if (pausedByReputationEvent) {
      setPausedByReputationEvent(false);
      setAutoAdventure(true);
    }
  }, [
    reputationEventValue,
    player,
    addLog,
    setPlayer,
    setters.setIsReputationEventOpen,
    setReputationEvent,
    pausedByReputationEvent,
    setPausedByReputationEvent,
    setAutoAdventure,
  ]);

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

  // 使用 useCallback 稳定函数引用，避免 useAutoFeatures 无限循环
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
    upgradeStones: number = 0
  ): Promise<'success' | 'failure' | 'error'> => {
    const result = await equipmentHandlers.handleUpgradeItem(
      item,
      costStones,
      costMats,
      upgradeStones
    );
    return result || 'success';
  };

  // 返回所有 handlers
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
    handleBatchDiscard,
    handleTakeTreasureVaultItem,
    handleUpdateVault,

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

    // 炼丹相关
    handleCraft,

    // 角色相关
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,

    // 商店相关
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,

    // 声望事件
    handleReputationEventChoice,

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

