import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { checkBreakthroughConditions } from './utils/cultivationUtils';
import {
  Item,
  Shop,
  ShopItem,
  ShopType,
  EquipmentSlot,
  TribulationState,
  TribulationResult,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import DeathModal from './components/DeathModal';
import DebugModal from './components/DebugModal';
import SaveManagerModal from './components/SaveManagerModal';
import SaveCompareModal from './components/SaveCompareModal';
import TribulationModal from './components/TribulationModal';
import CultivationIntroModal from './components/CultivationIntroModal';
import AutoAdventureConfigModal from './components/AutoAdventureConfigModal';
import {
  SaveData,
  ensurePlayerStatsCompatibility,
} from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { useUI } from './context/UIContext';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useAutoGrottoHarvest } from './hooks/useAutoGrottoHarvest';
import { useBattleResultHandler } from './hooks/useBattleResultHandler';
import { STORAGE_KEYS } from './constants/storageKeys';
import {  showConfirm } from './utils/toastUtils';
import AlertModal from './components/AlertModal';
import { useItemActionLog } from './hooks/useItemActionLog';
import { REALM_ORDER, TRIBULATION_CONFIG } from './constants/index';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from './hooks/useKeyboardShortcuts';
import {
  getShortcutConfig,
  configToShortcut,
} from './utils/shortcutUtils';
import { compareItemEffects } from './utils/objectUtils';
import { shouldTriggerTribulation, createTribulationState } from './utils/tribulationUtils';
import { getPlayerTotalStats } from './utils/statUtils';
import { isValidDailyQuestType } from './utils/typeGuards';

import { useIndexedDB } from './hooks/useIndexedDB';
import { usePlayTime } from './hooks/usePlayTime';
import { useGameInitialization } from './hooks/useGameInitialization';
import { useLevelUp } from './hooks/useLevelUp';
import { useGlobalAlert } from './hooks/useGlobalAlert';
import { useRebirth } from './hooks/useRebirth';
import { logger } from './utils/logger';
import { CultivationArt, Recipe, SecretRealm, BattleResult, AdventureResult } from './types';
import { RandomSectTask } from './services/randomService';

// 导入模块化的 handlers
import {
  useMeditationHandlers, // 打坐
  useBreakthroughHandlers, // 突破
  useBattleHandlers, // 战斗
  useItemHandlers, // 物品
  useEquipmentHandlers, // 装备
  useCultivationHandlers, // 功法
  useAlchemyHandlers, // 炼丹
  useCharacterHandlers, // 角色
  useShopHandlers, // 商店
  useSettingsHandlers, // 设置
  useRealmHandlers, // 秘境
  usePetHandlers, // 灵宠
  useLotteryHandlers, // 抽奖
  useSectHandlers, // 宗门
  useAchievementHandlers, // 成就
  useAdventureHandlers, // 历练
  useDailyQuestHandlers, // 日常任务
  useGrottoHandlers, // 洞府
  GameView, // 游戏视图
  ModalsContainer, // 弹窗容器
} from './views';

function App() {
  // 使用自定义hooks管理游戏状态
  const {
    hasSave, // 是否有存档
    setHasSave, // 设置是否有存档
    gameStarted, // 游戏是否开始
    player, // 玩家数据
    setPlayer, // 设置玩家数据
    settings, // 游戏设置
    setSettings, // 设置游戏设置
    logs, // 游戏日志
    setLogs, // 设置游戏日志
    handleStartGame, // 开始游戏
    setGameStarted, // 设置游戏开始状态（用于涅槃重生）
    saveGame, // 保存存档函数
  } = useGameState();

  // 欢迎界面状态 - 总是显示欢迎界面，让用户选择继续或开始
  const [showWelcome, setShowWelcome] = useState(true);

  // 修仙法门弹窗状态
  const [showCultivationIntro, setShowCultivationIntro] = useState(false);

  // 使用自定义hooks管理游戏效果
  const { visualEffects, createAddLog, triggerVisual } = useGameEffects();
  const addLog = createAddLog(setLogs);

  // 使用统一的 App 状态管理 (通过 Context)
  const appState = useUI();
  const {
    modals,
    setters,
    shop,
    upgrade,
    notifications,
    battle,
    turnBasedBattle,
    itemActionLog,
    auto,
    actions,
  } = appState;

  const {
    autoMeditate,
    setAutoMeditate,
    autoAdventure,
    setAutoAdventure,
    autoAdventureConfig,
    setAutoAdventureConfig,
  } = auto;

  const { closeCurrentModal: handleCloseCurrentModal, openTurnBasedBattle: handleOpenTurnBasedBattle } = actions;

  // 解构状态以便使用
  const {
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
    isReputationEventOpen,
    isTreasureVaultOpen,
  } = modals;

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
  } = setters;

  const { isDebugModeEnabled, isAutoAdventureConfigOpen } = modals;

  // 检查调试模式是否启用
  useEffect(() => {
    const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
    setIsDebugModeEnabled(debugMode);
  }, []);

  const { currentShop, setCurrentShop } = shop;
  const { setItemToUpgrade } = upgrade;
  const {
    purchaseSuccess,
    setPurchaseSuccess,
    lotteryRewards,
    setLotteryRewards,
  } = notifications;
  const { event: reputationEvent, setEvent: setReputationEvent } =
    appState.reputationEvent;
  const {
    battleReplay,
    setBattleReplay,
    revealedBattleRounds,
    setRevealedBattleRounds,
    lastBattleReplay,
    setLastBattleReplay,
  } = battle;
  const { params: turnBasedBattleParams, setParams: setTurnBasedBattleParams } =
    turnBasedBattle;
  const { value: itemActionLogValue, setValue: setItemActionLogRaw } =
    itemActionLog;

  // 使用公共 hook 管理 itemActionLog，自动处理延迟清除
  const { itemActionLog: delayedItemActionLog, setItemActionLog } = useItemActionLog({
    delay: 3000,
    externalSetter: setItemActionLogRaw,
  });

  // 使用自定义 hook 处理游戏初始化
  useGameInitialization();

  // 检查是否需要显示修仙法门弹窗（新游戏时显示，已显示过则不显示）
  useEffect(() => {
    if (gameStarted && player && !localStorage.getItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN)) {
      // 延迟一小段时间显示，确保游戏界面已加载完成
      const timer = setTimeout(() => {
        setShowCultivationIntro(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, player]);

  const { loading, setLoading, cooldown, setCooldown } = appState.global;

  // 使用自定义 hook 处理游戏时长和保存
  usePlayTime({
    gameStarted,
    player,
    setPlayer,
    saveGame,
    logs,
  });

  const { alertState, setAlertState, closeAlert } = useGlobalAlert();

  // 存档管理器状态
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isSaveCompareOpen, setIsSaveCompareOpen] = useState(false);
  const [compareSave1, setCompareSave1] = useState<SaveData | null>(null);
  const [compareSave2, setCompareSave2] = useState<SaveData | null>(null);

  // 天劫弹窗状态
  const [tribulationState, setTribulationState] = useState<TribulationState | null>(null);

  // 初始化所有模块化的 handlers
  const battleHandlers = useBattleHandlers({
    battleReplay,
    setBattleReplay,
    isBattleModalOpen,
    setIsBattleModalOpen,
    revealedBattleRounds,
    setRevealedBattleRounds,
    animationSpeed: settings.animationSpeed,
  });

  // 使用战斗结果处理 hook
  const { handleBattleResult } = useBattleResultHandler({
    player,
    setPlayer,
    addLog,
    setLoading,
    updateQuestProgress: (type: string, amount: number = 1) => {
      // 类型安全转换：string -> DailyQuestType，运行时验证
      if (isValidDailyQuestType(type)) {
        dailyQuestHandlers.updateQuestProgress(type, amount);
      }
    },
  });

  const meditationHandlers = useMeditationHandlers({
    player,
    setPlayer,
    addLog,
    checkLevelUp: () => {}, // 检查升级逻辑在 useEffect 中处理
  });

  const breakthroughHandlers = useBreakthroughHandlers({
    player,
    setPlayer,
    addLog,
    setLoading,
    loading,
  });

  // 使用等级提升与天劫处理 hook
  const { isTribulationTriggeredRef } = useLevelUp({
    player,
    setPlayer,
    tribulationState,
    setTribulationState,
    handleBreakthrough: breakthroughHandlers.handleBreakthrough,
    addLog,
  });

  // 处理天劫完成
  const handleTribulationComplete = (result: TribulationResult) => {
    // 不在这里重置标志位，让境界变化时的 useEffect 来重置
    if (result.success) {
      // 渡劫成功，执行突破（跳过成功率检查）
      // 将天劫产生的扣血传递给突破处理器，确保在同一次状态更新中处理
      breakthroughHandlers.handleBreakthrough(true, result.hpLoss || 0);

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
  };

  // 确保新游戏开始时自动历练状态被重置
  // 当检测到新游戏开始时（玩家从null变为有值，且是初始状态），重置自动历练状态
  const prevPlayerNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameStarted && player) {
      // 检测是否是真正的新游戏：玩家名字变化，且玩家是初始状态（exp为0，境界为初始境界）
      const isNewPlayer = prevPlayerNameRef.current !== null &&
                          prevPlayerNameRef.current !== player.name;
      const isInitialState = player.exp === 0 &&
                             player.realm === 'QiRefining' &&
                             player.realmLevel === 1;

      if (isNewPlayer && isInitialState) {
        // 新游戏开始时，确保自动历练状态被重置
        setAutoAdventure(false);
      }

      prevPlayerNameRef.current = player.name;
    } else if (!gameStarted || !player) {
      // 游戏未开始或玩家为null时，重置ref
      prevPlayerNameRef.current = null;
    }
  }, [gameStarted, player?.name, player?.exp, player?.realm, player?.realmLevel]);

  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(
    null
  );
  const [deathReason, setDeathReason] = useState('');

  // 使用自定义 hook 处理涅槃重生
  const { handleRebirth } = useRebirth({
    setPlayer,
    setLogs,
    setGameStarted,
    setHasSave,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
  });

  const itemHandlers = useItemHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
    onOpenTreasureVault: () => setters.setIsTreasureVaultOpen(true),
  });

  const equipmentHandlers = useEquipmentHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  const cultivationHandlers = useCultivationHandlers({
    player,
    setPlayer,
    addLog,
  });

  const alchemyHandlers = useAlchemyHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
  });

  const characterHandlers = useCharacterHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  // 初始化新的模块化 handlers
  const shopHandlers = useShopHandlers({
    player,
    setPlayer,
    addLog,
    currentShop,
    setCurrentShop,
    setIsShopOpen,
    setPurchaseSuccess,
  });

  const settingsHandlers = useSettingsHandlers({
    setSettings,
  });

  const petHandlers = usePetHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  const lotteryHandlers = useLotteryHandlers({
    player,
    setPlayer,
    addLog,
    setLotteryRewards,
  });

  // 洞府相关逻辑
  const grottoHandlers = useGrottoHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  // 冒险相关逻辑抽离到 useAdventureHandlers
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
      // 如果配置了跳过商店，不打开商店
      if (autoAdventure && autoAdventureConfig.skipShop) {
        return;
      }
      // 复用 shopHandlers 的逻辑
      shopHandlers.handleOpenShop(shopType);
    },
    onOpenBattleModal: (replay: BattleReplay) => {
      // 保存最近的战斗数据，用于死亡统计
      setLastBattleReplay(replay);
      // 打开战斗弹窗（自动模式下也会打开）
      battleHandlers.openBattleModal(replay);
    },
    onReputationEvent: (event) => {
      // 测试环境打印调试信息
      logger.debug('【声望事件回调触发】', {
        event,
        hasChoices: !!event?.choices,
        choicesCount: event?.choices?.length || 0,
        autoAdventure,
      });

      // 如果配置了跳过声望事件，不打开弹窗
      if (autoAdventure && autoAdventureConfig.skipReputationEvent) {
        return;
      }

      // 打开声望事件弹窗
      setReputationEvent(event);
      setIsReputationEventOpen(true);

      // 测试环境确认状态设置
      logger.debug('【声望事件状态设置】', {
        eventSet: !!event,
        shouldOpen: true,
      });
    },
    onOpenTurnBasedBattle: handleOpenTurnBasedBattle,
    skipBattle: autoAdventure && autoAdventureConfig.skipBattle, // 根据配置决定是否跳过战斗
    fleeOnBattle: autoAdventure && autoAdventureConfig.fleeOnBattle, // 根据配置决定是否逃跑
    skipShop: autoAdventure && autoAdventureConfig.skipShop, // 根据配置决定是否跳过商店
    skipReputationEvent: autoAdventure && autoAdventureConfig.skipReputationEvent, // 根据配置决定是否跳过声望事件
    useTurnBasedBattle: true, // 使用新的回合制战斗系统
    autoAdventure, // 传递自动历练状态
    setAutoAdventure, // 传递设置自动历练状态的函数
  });

  const sectHandlers = useSectHandlers({
    player,
    setPlayer,
    addLog,
    setIsSectOpen,
    setPurchaseSuccess,
    setItemActionLog,
    onChallengeLeader: handleOpenTurnBasedBattle,
  });

  const achievementHandlers = useAchievementHandlers({
    player,
    setPlayer,
    addLog,
  });

  // 日常任务相关逻辑
  const dailyQuestHandlers = useDailyQuestHandlers({
    player,
    setPlayer,
    addLog,
  });

  // 从 handlers 中提取函数
  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;

  // 使用死亡检测 hook
  useDeathDetection({
    player,
    setPlayer,
    isDead,
    setIsDead,
    addLog,
    settings,
    lastBattleReplay,
    setDeathBattleData,
    setDeathReason,
    setIsBattleModalOpen,
    setAutoMeditate,
    setAutoAdventure,
  });


  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

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
      // 使用 Set 提高查找性能，特别是当 itemIds 数组较大时
      const itemIdsSet = new Set(itemIds);
      const newInv = prev.inventory.filter((i) => !itemIdsSet.has(i.id));
      addLog(`你批量丢弃了 ${itemIds.length} 件物品。`, 'normal');
      return { ...prev, inventory: newInv };
    });
  }, [addLog, setPlayer]);

  // 处理从宗门宝库拿取物品
  const handleTakeTreasureVaultItem = useCallback((item: Item) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const newInv = [...prev.inventory];
      // 检查背包中是否已有相同物品（装备类物品不叠加）
      const isEquipment = item.isEquippable || false;

      if (!isEquipment) {
        // 非装备类物品尝试叠加
        // 使用优化的深度比较函数替代 JSON.stringify，提高性能
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
        // 装备类物品直接添加（不叠加）
        newInv.push(item);
      }

      // 更新宝库状态：将物品ID添加到已拿取列表（使用 Set 提高性能）
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

  // 处理更新宗门宝库（初始化宝库物品）
  const handleUpdateVault = useCallback((vault: { items: Item[]; takenItemIds: string[] }) => {
    setPlayer((prev) => ({
      ...prev,
      sectTreasureVault: vault,
    }));
  }, [setPlayer]);

  // 包装 handleEquipItem，添加任务进度更新
  const handleEquipItem = useCallback((item: Item, slot: EquipmentSlot) => {
    equipmentHandlers.handleEquipItem(item, slot);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  }, [equipmentHandlers, dailyQuestHandlers]);

  const handleUnequipItem = equipmentHandlers.handleUnequipItem;

  // 包装 handleRefineNatalArtifact，添加任务进度更新
  const handleRefineNatalArtifact = useCallback((item: Item) => {
    equipmentHandlers.handleRefineNatalArtifact(item);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  }, [equipmentHandlers, dailyQuestHandlers]);

  const handleUnrefineNatalArtifact =
    equipmentHandlers.handleUnrefineNatalArtifact;

  // 包装 handleLearnArt，添加任务进度更新
  const handleLearnArt = useCallback((art: CultivationArt) => {
    cultivationHandlers.handleLearnArt(art);
    dailyQuestHandlers.updateQuestProgress('learn', 1);
  }, [cultivationHandlers, dailyQuestHandlers]);

  const handleActivateArt = cultivationHandlers.handleActivateArt;

  // 包装 handleCraft，添加任务进度更新
  const handleCraft = useCallback(async (recipe: Recipe) => {
    await alchemyHandlers.handleCraft(recipe);
    dailyQuestHandlers.updateQuestProgress('alchemy', 1);
  }, [alchemyHandlers, dailyQuestHandlers]);

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;
  const handleAllocateAllAttributes =
    characterHandlers.handleAllocateAllAttributes;

  // 提取新的模块化 handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;

  const handleRefreshShop = useCallback((newItems: ShopItem[]) => {
    if (!currentShop || !player) return;
    const refreshCost = currentShop.refreshCost || 100; // 使用商店的刷新费用，默认100
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
        spiritStones: prev.spiritStones - refreshCost, // 扣除刷新费用
      };
    });
    addLog('商店物品已刷新！', 'special');
  }, [currentShop, player, addLog, setCurrentShop, setPlayer]);

  // 处理声望事件选择
  const handleReputationEventChoice = useCallback((choiceIndex: number) => {
    if (!reputationEvent || !player) return;

    const choice = reputationEvent.choices[choiceIndex];
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

      // 处理其他变化
      if (choice.hpChange !== undefined) {
        // 使用实际最大血量（包含金丹法数加成等）作为上限
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

      // 记录日志
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

    // 关闭弹窗并清除事件
    setIsReputationEventOpen(false);
    setReputationEvent(null);

    // 如果自动历练是因为声望事件暂停的，恢复自动历练
  }, [
    reputationEvent,
    player,
    addLog,
    setPlayer,
    setIsReputationEventOpen,
    setReputationEvent,
    setAutoAdventure,
  ]);

  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleDeactivatePet = petHandlers.handleDeactivatePet;
  // 包装 handleFeedPet，添加任务进度更新
  const handleFeedPet = useCallback((
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => {
    petHandlers.handleFeedPet(petId, feedType, itemId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  }, [petHandlers, dailyQuestHandlers]);

  const handleBatchFeedItems = petHandlers.handleBatchFeedItems;
  const handleBatchFeedHp = petHandlers.handleBatchFeedHp;
  // 包装 handleEvolvePet，添加任务进度更新
  const handleEvolvePet = useCallback((petId: string) => {
    petHandlers.handleEvolvePet(petId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  }, [petHandlers, dailyQuestHandlers]);

  const handleReleasePet = petHandlers.handleReleasePet;
  const handleBatchReleasePets = petHandlers.handleBatchReleasePets;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;
  // 包装 handleSectTask，添加任务进度更新
  const handleSectTask = useCallback((task: RandomSectTask, encounterResult?: AdventureResult) => {
    sectHandlers.handleSectTask(task, encounterResult);
    dailyQuestHandlers.updateQuestProgress('sect', 1);
  }, [sectHandlers, dailyQuestHandlers]);
  const handleSectPromote = sectHandlers.handleSectPromote;
  const handleSectBuy = sectHandlers.handleSectBuy;
  const checkAchievements = achievementHandlers.checkAchievements;

  // 从冒险 handlers 中提取函数
  const { handleAdventure: originalHandleAdventure, executeAdventure } =
    adventureHandlers;

  // 包装 handleAdventure，添加自动打坐检查
  const handleAdventure = async () => {
    // 如果正在自动打坐，则不能手动历练
    if (autoMeditate) {
      addLog('正在打坐中，无法历练。请先停止自动打坐。', 'danger');
      return;
    }
    await originalHandleAdventure();
    // 更新日常任务进度
    dailyQuestHandlers.updateQuestProgress('adventure', 1);
  };

  // 包装 handleMeditate，添加自动打坐检查
  const handleMeditate = () => {
    if (loading || cooldown > 0 || !player) return;
    // 如果正在自动历练，则不能手动打坐
    if (autoAdventure) {
      addLog('正在历练中，无法打坐。请先停止自动历练。', 'danger');
      return;
    }
    meditationHandlers.handleMeditate();
    dailyQuestHandlers.updateQuestProgress('meditate', 1);
    setCooldown(1);
  };

  // 使用被动回血和冷却管理 hook
  usePassiveRegeneration({
    player,
    setPlayer,
    cooldown,
    setCooldown,
  });

  // 使用洞府自动收获 hook
  useAutoGrottoHarvest({
    player,
    setPlayer,
    addLog,
  });

  // 使用自动功能 hook
  useAutoFeatures({
    autoMeditate,
    autoAdventure,
    player,
    loading,
    cooldown,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    handleMeditate,
    handleAdventure,
    setCooldown,
  });

  // 现在可以使用 executeAdventure 初始化 realmHandlers
  const realmHandlers = useRealmHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    setIsRealmOpen,
    executeAdventure,
  });
  // 包装 handleEnterRealm，添加任务进度更新
  const handleEnterRealm = async (realm: SecretRealm) => {
    await realmHandlers.handleEnterRealm(realm);
    dailyQuestHandlers.updateQuestProgress('realm', 1);
  };
  // 冒险行为由 useAdventureHandlers 提供的 handleAdventure 实现

  // Reactive Level Up Check
  useEffect(() => {
    if (player && player.exp >= player.maxExp) {
      // 检查是否达到绝对巅峰
      const realms = REALM_ORDER;
      const isMaxRealm = player.realm === realms[realms.length - 1];
      if (isMaxRealm && player.realmLevel >= 9) {
        // 锁定经验为满值
        if (player.exp > player.maxExp) {
          setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
        }
        return;
      }

      // 检查是否已经触发了天劫（防止重复触发）
      // 如果经验值只是等于 maxExp（可能是取消后锁定的），且标志位为 true，则不触发
      // 只有当经验值真正超过 maxExp 时，才允许触发（此时标志位会在境界变化时重置）
      if (isTribulationTriggeredRef.current && player.exp === player.maxExp) {
        return;
      }

      // 如果经验值超过 maxExp，说明是新的经验值增加，重置标志位允许触发
      if (player.exp > player.maxExp) {
        isTribulationTriggeredRef.current = false;
      }

      // 检查是否需要渡劫
      const isRealmUpgrade = player.realmLevel >= 9;
      let targetRealm = player.realm;
      if (isRealmUpgrade) {
        const currentIndex = REALM_ORDER.indexOf(player.realm);
        if (currentIndex < REALM_ORDER.length - 1) {
          targetRealm = REALM_ORDER[currentIndex + 1];
        }
      }

      // 如果是境界升级，先检查是否满足突破条件
      // 注意：shouldTriggerTribulation 内部也会检查条件，但这里提前检查是为了：
      // 1. 给用户明确的错误提示
      // 2. 锁定经验值避免反复触发
      if (isRealmUpgrade && targetRealm !== player.realm) {
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);
        if (!conditionCheck.canBreakthrough) {
          addLog(conditionCheck.message, 'danger');
          // 锁定经验值，避免反复触发
          setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          return;
        }
      }

      // 检查是否需要渡劫（只有在满足条件后才检查，shouldTriggerTribulation 内部会再次验证条件）
      if (shouldTriggerTribulation(player) && !tribulationState?.isOpen) {
        // 设置标志位，防止重复触发
        isTribulationTriggeredRef.current = true;

        // 获取天劫名称
        const config = TRIBULATION_CONFIG[targetRealm];
        const tribulationName = config?.tribulationLevel || `${targetRealm}天劫`;

        // 显示确认弹窗
        showConfirm(
          `你的${tribulationName}来了，是否现在渡劫？`,
          '确认渡劫',
          () => {
            // 用户确认后，创建天劫状态并触发弹窗
            const newTribulationState = createTribulationState(player, targetRealm);
            setTribulationState(newTribulationState);
          },
          () => {
            // 用户取消，保持标志位为 true（防止立即再次触发）、清除天劫状态并锁定经验值
            // 标志位会在经验值真正变化或境界变化时重置
            setTribulationState(null); // 清除天劫状态
            setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          }
        );
      } else if (!tribulationState?.isOpen) {
        // 不需要渡劫，直接执行突破
        breakthroughHandlers.handleBreakthrough();
      }
    }
  }, [
    player?.exp,
    player?.maxExp,
    player?.realm,
    player?.realmLevel,
    tribulationState?.isOpen,
  ]);

  // 监听突破成功，更新任务进度
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  useEffect(() => {
    if (player && prevRealmRef.current) {
      const prevRealm = prevRealmRef.current.realm;
      const prevLevel = prevRealmRef.current.level;
      if (player.realm !== prevRealm || player.realmLevel !== prevLevel) {
        // 境界或等级变化，说明突破成功
        dailyQuestHandlers.updateQuestProgress('breakthrough', 1);
        // 重置天劫触发标志
        isTribulationTriggeredRef.current = false;
      }
    }
    if (player) {
      prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
    }
  }, [player?.realm, player?.realmLevel, dailyQuestHandlers]);

  // 保留 handleOpenUpgrade 和 handleUpgradeItem，因为它们需要状态管理
  const handleOpenUpgrade = (item: Item) => {
    setItemToUpgrade(item);
    setIsUpgradeOpen(true);
  };

  // handleUpgradeItem 不关闭弹窗，让用户可以继续强化
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
    // 不关闭弹窗，让用户可以继续强化
    // 弹窗会自动从 player.inventory 中获取最新的物品信息
    return result || 'success';
  };

  // Sect handlers、Achievement、Pet、Lottery、Settings handlers 已全部移到对应模块

  // 检查成就（境界变化、统计变化时）
  useEffect(() => {
    if (player) {
      checkAchievements();
    }
  }, [
    player?.realm,
    player?.realmLevel,
    player?.statistics,
    player?.inventory.length,
    player?.pets.length,
    player?.cultivationArts.length,
    player?.unlockedRecipes?.length,
    player?.lotteryCount,
    checkAchievements,
  ]);

  // 定义键盘快捷键（使用保存的配置）
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
    if (!player || !gameStarted) return [];

    const customShortcuts = settings.keyboardShortcuts || {};

    const shortcuts: KeyboardShortcut[] = [];

    // 打坐
    const meditateConfig = getShortcutConfig('meditate', customShortcuts);
    shortcuts.push(
      configToShortcut(meditateConfig, handleMeditate, '打坐', '基础操作')
    );

    // 历练
    const adventureConfig = getShortcutConfig('adventure', customShortcuts);
    shortcuts.push(
      configToShortcut(adventureConfig, handleAdventure, '历练', '基础操作')
    );

    // 切换自动打坐
    const toggleAutoMeditateConfig = getShortcutConfig(
      'toggleAutoMeditate',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        toggleAutoMeditateConfig,
        () => {
          setAutoMeditate(!autoMeditate);
        },
        '切换自动打坐',
        '基础操作'
      )
    );

    // 切换自动历练
    const toggleAutoAdventureConfig = getShortcutConfig(
      'toggleAutoAdventure',
      customShortcuts
    );
    const toggleAutoAdventureAction = () => {
      if (autoAdventure) {
        // 如果正在自动历练，直接关闭
        setAutoAdventure(false);
      } else {
        // 如果未开启，打开配置弹窗
        setIsAutoAdventureConfigOpen(true);
      }
    };
    shortcuts.push(
      configToShortcut(
        toggleAutoAdventureConfig,
        toggleAutoAdventureAction,
        '切换自动历练',
        '基础操作'
      )
    );

    // 空格键切换自动历练（优先级高于配置的快捷键）
    shortcuts.push({
      key: ' ',
      action: toggleAutoAdventureAction,
      description: '切换自动历练',
      category: '基础操作',
    });

    // 打开储物袋
    const openInventoryConfig = getShortcutConfig(
      'openInventory',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openInventoryConfig,
        () => setIsInventoryOpen(true),
        '打开储物袋',
        '打开面板'
      )
    );

    // 打开功法
    const openCultivationConfig = getShortcutConfig(
      'openCultivation',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCultivationConfig,
        () => setIsCultivationOpen(true),
        '打开功法',
        '打开面板'
      )
    );

    // 打开角色
    const openCharacterConfig = getShortcutConfig(
      'openCharacter',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCharacterConfig,
        () => setIsCharacterOpen(true),
        '打开角色',
        '打开面板'
      )
    );

    // 打开成就
    const openAchievementConfig = getShortcutConfig(
      'openAchievement',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openAchievementConfig,
        () => {
          setIsAchievementOpen(true);
          setPlayer((prev) => ({
            ...prev,
            viewedAchievements: [...prev.achievements],
          }));
        },
        '打开成就',
        '打开面板'
      )
    );

    // 打开灵宠
    const openPetConfig = getShortcutConfig('openPet', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openPetConfig,
        () => setIsPetOpen(true),
        '打开灵宠',
        '打开面板'
      )
    );

    // 打开抽奖
    const openLotteryConfig = getShortcutConfig('openLottery', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openLotteryConfig,
        () => setIsLotteryOpen(true),
        '打开抽奖',
        '打开面板'
      )
    );

    // 打开设置
    const openSettingsConfig = getShortcutConfig(
      'openSettings',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openSettingsConfig,
        () => setIsSettingsOpen(true),
        '打开设置',
        '打开面板'
      )
    );

    // 打开秘境
    const openRealmConfig = getShortcutConfig('openRealm', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openRealmConfig,
        () => setIsRealmOpen(true),
        '打开秘境',
        '打开面板'
      )
    );

    // 打开炼丹
    const openAlchemyConfig = getShortcutConfig('openAlchemy', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openAlchemyConfig,
        () => setIsAlchemyOpen(true),
        '打开炼丹',
        '打开面板'
      )
    );

    // 打开宗门
    const openSectConfig = getShortcutConfig('openSect', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openSectConfig,
        () => setIsSectOpen(true),
        '打开宗门',
        '打开面板'
      )
    );

    // 打开日常任务
    const openDailyQuestConfig = getShortcutConfig(
      'openDailyQuest',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openDailyQuestConfig,
        () => setIsDailyQuestOpen(true),
        '打开日常任务',
        '打开面板'
      )
    );

    // 关闭当前弹窗
    const closeModalConfig = getShortcutConfig('closeModal', customShortcuts);
    shortcuts.push(
      configToShortcut(
        closeModalConfig,
        handleCloseCurrentModal,
        '关闭当前弹窗',
        '通用操作'
      )
    );

    return shortcuts;
  }, [
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsDailyQuestOpen,
    handleCloseCurrentModal,
  ]);

  // 使用键盘快捷键
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  // 缓存 GameView 的 handlers
  const gameViewHandlers = useMemo(() => ({
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
      setAutoMeditate(!autoMeditate);
    },
    onToggleAutoAdventure: () => {
      if (autoAdventure) {
        // 如果正在自动历练，直接关闭
        setAutoAdventure(false);
      } else {
        // 如果未开启，打开配置弹窗
        setIsAutoAdventureConfigOpen(true);
      }
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
    autoMeditate,
    autoAdventure,
  ]);

  // 缓存 ModalsContainer 的 handlers
  const modalsHandlers = useMemo(() => ({
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
    handleChallengeLeader: sectHandlers.handleChallengeLeader,
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
    handleClaimQuestReward: dailyQuestHandlers.claimQuestReward,
    handleUpgradeGrotto: grottoHandlers.handleUpgradeGrotto,
    handlePlantHerb: grottoHandlers.handlePlantHerb,
    handleHarvestHerb: grottoHandlers.handleHarvestHerb,
    handleHarvestAll: grottoHandlers.handleHarvestAll,
    handleEnhanceSpiritArray: grottoHandlers.handleEnhanceSpiritArray,
    handleToggleAutoHarvest: grottoHandlers.handleToggleAutoHarvest,
    handleSpeedupHerb: grottoHandlers.handleSpeedupHerb,
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,
    handleReputationEventChoice,
    setIsReputationEventOpen: (open: boolean) => {
      setIsReputationEventOpen(open);
      if (!open) {
        setReputationEvent(null);
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
      // 检查是否是天地之魄战斗
      const isHeavenEarthSoulBattle = turnBasedBattleParams?.bossId !== undefined;

      setIsTurnBasedBattleOpen(false);
      setTurnBasedBattleParams(null);
      handleBattleResult(result, updatedInventory);
      if (!autoAdventure) {
        return;
      }
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
    handleSectPromote, handleSectBuy, sectHandlers.handleChallengeLeader,
    handleEnterRealm, handleSelectTalent, handleSelectTitle, handleAllocateAttribute,
    handleAllocateAllAttributes, handleUseInheritance, setPlayer, addLog,
    handleActivatePet, handleDeactivatePet, handleFeedPet, handleBatchFeedItems,
    handleBatchFeedHp, handleEvolvePet, handleReleasePet, handleBatchReleasePets,
    handleDraw, handleUpdateSettings, handleRebirth, setIsSaveManagerOpen,
    dailyQuestHandlers.claimQuestReward, grottoHandlers.handleUpgradeGrotto,
    grottoHandlers.handlePlantHerb, grottoHandlers.handleHarvestHerb,
    grottoHandlers.handleHarvestAll, grottoHandlers.handleEnhanceSpiritArray,
    grottoHandlers.handleToggleAutoHarvest, grottoHandlers.handleSpeedupHerb,
    handleBuyItem, handleSellItem, handleRefreshShop, handleReputationEventChoice,
    setIsReputationEventOpen, setReputationEvent,
    setAutoAdventure, setIsTreasureVaultOpen, handleTakeTreasureVaultItem,
    handleUpdateVault, setIsTurnBasedBattleOpen, setTurnBasedBattleParams,
    handleBattleResult, autoAdventure, setCurrentShop,
    turnBasedBattleParams
  ]);

  // 检查是否有任何弹窗处于打开状态
  const isAnyModalOpen = useMemo(() => {
    return (
      isInventoryOpen ||
      isCultivationOpen ||
      isAlchemyOpen ||
      isUpgradeOpen ||
      isSectOpen ||
      isRealmOpen ||
      isCharacterOpen ||
      isAchievementOpen ||
      isPetOpen ||
      isLotteryOpen ||
      isSettingsOpen ||
      isDailyQuestOpen ||
      isShopOpen ||
      isGrottoOpen ||
      isBattleModalOpen ||
      isTurnBasedBattleOpen ||
      isReputationEventOpen ||
      isTreasureVaultOpen
    );
  }, [
    isInventoryOpen, isCultivationOpen, isAlchemyOpen, isUpgradeOpen,
    isSectOpen, isRealmOpen, isCharacterOpen, isAchievementOpen,
    isPetOpen, isLotteryOpen, isSettingsOpen, isDailyQuestOpen,
    isShopOpen, isGrottoOpen, isBattleModalOpen, isTurnBasedBattleOpen,
    isReputationEventOpen, isTreasureVaultOpen
  ]);

  // 显示欢迎界面
  if (showWelcome) {
    return (
      <WelcomeScreen
        hasSave={hasSave}
        onStart={() => {
          // 新游戏：清除存档并重置状态
          localStorage.removeItem(STORAGE_KEYS.SAVE);
          setHasSave(false);
          setGameStarted(false);
          setPlayer(null);
          setLogs([]);
          setShowWelcome(false);
        }}
        onContinue={() => {
          // 继续游戏：跳过欢迎界面和取名界面，直接进入游戏（自动加载存档）
          setShowWelcome(false);
        }}
      />
    );
  }

  // 显示开始界面（取名界面）- 只有在没有存档且游戏未开始时才显示
  if (!hasSave && (!gameStarted || !player)) {
    return <StartScreen onStart={handleStartGame} />;
  }

  // 如果有存档但 player 还在加载中，显示加载状态
  if (hasSave && !player) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mystic-gold mx-auto mb-4"></div>
          <p className="text-stone-400 text-lg">加载存档中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 天劫弹窗 */}
      {tribulationState && (
        <TribulationModal
          tribulationState={tribulationState}
          onTribulationComplete={handleTribulationComplete}
          player={player}
        />
      )}

      {/* 死亡弹窗 - 无法关闭 */}
      {isDead && player && (
        <DeathModal
          player={player}
          battleData={deathBattleData}
          deathReason={deathReason}
          difficulty={settings.difficulty || 'normal'}
          onRebirth={handleRebirth}
          onContinue={
            settings.difficulty !== 'hard'
              ? () => {
                  setIsDead(false);
                  setDeathBattleData(null);
                  setDeathReason('');
                }
              : undefined
          }
        />
      )}

      <GameView
        player={player}
        logs={logs}
        setLogs={setLogs}
        visualEffects={visualEffects}
        loading={loading}
        cooldown={cooldown}
        purchaseSuccess={purchaseSuccess}
        lotteryRewards={lotteryRewards}
        onCloseLotteryRewards={() => setLotteryRewards([])}
        itemActionLog={itemActionLogValue}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isMobileStatsOpen={isMobileStatsOpen}
        modals={{
          isInventoryOpen,
          isCultivationOpen,
          isCharacterOpen,
          isAchievementOpen,
          isPetOpen,
          isLotteryOpen,
          isSettingsOpen,
          isRealmOpen,
          isAlchemyOpen,
          isSectOpen,
          setIsMobileSidebarOpen,
          setIsMobileStatsOpen,
          setIsInventoryOpen,
          setIsCultivationOpen,
          setIsCharacterOpen,
          setIsAchievementOpen,
          setIsPetOpen,
          setIsLotteryOpen,
          setIsSettingsOpen,
          setIsRealmOpen,
          setIsAlchemyOpen,
          setIsSectOpen,
        }}
        handlers={gameViewHandlers}
        isDebugModeEnabled={isDebugModeEnabled}
      />

      {/* 调试弹窗 */}
      {player && isDebugModeEnabled && (
        <DebugModal
          isOpen={isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
          player={player}
          onUpdatePlayer={(updates) => {
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, ...updates };
            });
          }}
          onTriggerDeath={() => {
            // 触发死亡：将hp设置为0，死亡检测useEffect会自动处理
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, hp: 0 };
            });
          }}
          onTriggerReputationEvent={(event) => {
            // 设置声望事件并打开弹窗
            setReputationEvent(event);
            setIsReputationEventOpen(true);
          }}
          onChallengeDaoCombining={() => {
            // 挑战天地之魄：使用executeAdventure执行特殊挑战
            if (adventureHandlers) {
              adventureHandlers.executeAdventure('dao_combining_challenge', undefined, '极度危险');
            }
          }}
        />
      )}

      {/* Alert 提示弹窗 */}
      {alertState && (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm}
          showCancel={alertState.showCancel}
          onCancel={alertState.onCancel}
        />
      )}

      {/* 存档管理器 */}
      {player && (
        <SaveManagerModal
          isOpen={isSaveManagerOpen}
          onClose={() => setIsSaveManagerOpen(false)}
          currentPlayer={player}
          currentLogs={logs}
          onLoadSave={(loadedPlayer, loadedLogs) => {
            // 应用兼容性处理，确保旧存档包含新字段
            const compatiblePlayer = ensurePlayerStatsCompatibility(loadedPlayer);
            setPlayer(compatiblePlayer);
            setLogs(loadedLogs);
          }}
          onCompareSaves={(save1, save2) => {
            setCompareSave1(save1);
            setCompareSave2(save2);
            setIsSaveCompareOpen(true);
          }}
        />
      )}

      {/* 存档对比 */}
      {compareSave1 && compareSave2 && (
        <SaveCompareModal
          isOpen={isSaveCompareOpen}
          onClose={() => {
            setIsSaveCompareOpen(false);
            setCompareSave1(null);
            setCompareSave2(null);
          }}
          save1={compareSave1}
          save2={compareSave2}
        />
      )}

      {player && isAnyModalOpen && (
        <ModalsContainer
          player={player}
          settings={settings}
          setItemActionLog={setItemActionLog}
          autoAdventure={autoAdventure}
          handlers={modalsHandlers}
        />
      )}

      {/* 寿元将尽预警 */}
      {player && !isDead && player.lifespan < Math.max(5, (player.maxLifespan || 100) * 0.1) && (
        <>
          <div className="lifespan-warning" />
          <div className="lifespan-warning-text animate-pulse">
            ⚠️ 寿元将尽 (剩余 {player.lifespan.toFixed(1)} 年)
          </div>
        </>
      )}

      {/* 修仙法门弹窗 */}
      {showCultivationIntro && (
        <CultivationIntroModal
          isOpen={showCultivationIntro}
          onClose={() => {
            setShowCultivationIntro(false);
            localStorage.setItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN, 'true');
          }}
        />
      )}

      {/* 自动历练配置弹窗 */}
      <AutoAdventureConfigModal
        isOpen={isAutoAdventureConfigOpen}
        onClose={() => setIsAutoAdventureConfigOpen(false)}
        onConfirm={(config) => {
          setAutoAdventureConfig(config);
          setAutoAdventure(true);
        }}
        currentConfig={autoAdventureConfig}
      />
    </>
  );

}

export default App;
