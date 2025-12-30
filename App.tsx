import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { checkBreakthroughConditions } from './utils/cultivationUtils';
import {
  TribulationState,
  TribulationResult,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import {
  SaveData,
} from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { useUI } from './context/UIContext';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useAutoGrottoHarvest } from './hooks/useAutoGrottoHarvest';
import { STORAGE_KEYS } from './constants/storageKeys';
import {  showConfirm } from './utils/toastUtils';
import { useItemActionLog } from './hooks/useItemActionLog';
import { REALM_ORDER, TRIBULATION_CONFIG } from './constants/index';
import {
  useKeyboardShortcuts,
} from './hooks/useKeyboardShortcuts';

import { shouldTriggerTribulation, createTribulationState } from './utils/tribulationUtils';

import { usePlayTime } from './hooks/usePlayTime';
import { useGameInitialization } from './hooks/useGameInitialization';
import { useLevelUp } from './hooks/useLevelUp';
import { useGlobalAlert } from './hooks/useGlobalAlert';
import { useRebirth } from './hooks/useRebirth';

// 导入新的 hooks 和组件
import { useAppHandlers } from './hooks/useAppHandlers';
import { useAppKeyboardShortcuts } from './hooks/useAppKeyboardShortcuts';
import { useGameViewHandlers, useModalsHandlers } from './hooks/useAppViewHandlers';
import { AppContent } from './components/AppContent';

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
    pausedByShop: autoAdventurePausedByShop,
    setPausedByShop: setAutoAdventurePausedByShop,
    pausedByBattle: autoAdventurePausedByBattle,
    setPausedByBattle: setAutoAdventurePausedByBattle,
    pausedByReputationEvent: autoAdventurePausedByReputationEvent,
    setPausedByReputationEvent: setAutoAdventurePausedByReputationEvent,
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
  } = setters;

  const { isDebugModeEnabled } = modals;

  // 检查调试模式是否启用
  useEffect(() => {
    const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
    setIsDebugModeEnabled(debugMode);
  }, []);

  const { setCurrentShop } = shop;
  const { setItemToUpgrade } = upgrade;
  const {
    purchaseSuccess,
    lotteryRewards,
    setLotteryRewards,
  } = notifications;
  const { event: reputationEvent, setEvent: setReputationEvent } =
    appState.reputationEvent;
  const {
    setBattleReplay,
    setRevealedBattleRounds,
    lastBattleReplay,
  } = battle;
  const { setParams: setTurnBasedBattleParams } =
    turnBasedBattle;
  const { value: itemActionLogValue, setValue: setItemActionLogRaw } =
    itemActionLog;

  // 使用公共 hook 管理 itemActionLog，自动处理延迟清除
  const { setItemActionLog } = useItemActionLog({
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

  const { alertState, closeAlert } = useGlobalAlert();

  // 存档管理器状态
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isSaveCompareOpen, setIsSaveCompareOpen] = useState(false);
  const [compareSave1, setCompareSave1] = useState<SaveData | null>(null);
  const [compareSave2, setCompareSave2] = useState<SaveData | null>(null);

  // 死亡和天劫相关状态（需要在 useAppHandlers 之前声明）
  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(null);
  const [deathReason, setDeathReason] = useState('');
  const [tribulationState, setTribulationState] = useState<TribulationState | null>(null);

  // 使用统一的 App Handlers Hook
  const appHandlers = useAppHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
    settings,
    appState,
    gameStarted,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    autoAdventurePausedByShop,
    autoAdventurePausedByBattle,
    autoAdventurePausedByReputationEvent,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
    loading,
    cooldown,
    setLoading,
    setCooldown,
    setDeathReason,
    setItemActionLog,
    handleOpenTurnBasedBattle,
  });

  // 从 appHandlers 中提取需要的 handlers
  const {
    handleMeditate,
    handleAdventure,
    handleEnterRealm,
    handleUseItem,
    handleOrganizeInventory,
    handleDiscardItem,
    handleRefineAdvancedItem,
    handleBatchUse,
    handleBatchDiscard,
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    handleEquipItem,
    handleUnequipItem,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleOpenUpgrade,
    handleUpgradeItem,
    handleLearnArt,
    handleActivateArt,
    handleCraft,
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,
    handleReputationEventChoice,
    handleUpdateSettings,
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
    handleDraw,
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleChallengeLeader,
    checkAchievements,
    handleSkipBattleLogs,
    handleCloseBattleModal,
    handleBattleResult,
    handleUpgradeGrotto,
    handlePlantHerb,
    handleHarvestHerb,
    handleHarvestAll,
    handleEnhanceSpiritArray,
    handleToggleAutoHarvest,
    handleSpeedupHerb,
    claimQuestReward,
    breakthroughHandlers,
    adventureHandlers,
    dailyQuestHandlers,
  } = appHandlers;

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
        setAutoAdventurePausedByBattle(false);
        setAutoAdventurePausedByShop(false);
        setAutoAdventurePausedByReputationEvent(false);
      }

      prevPlayerNameRef.current = player.name;
    } else if (!gameStarted || !player) {
      // 游戏未开始或玩家为null时，重置ref
      prevPlayerNameRef.current = null;
    }
  }, [gameStarted, player?.name, player?.exp, player?.realm, player?.realmLevel]);


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

  // 战斗结束后，如果玩家还活着且之前是自动历练模式，继续自动历练
  useEffect(() => {
    if (
      autoAdventurePausedByBattle &&
      player &&
      player.hp > 0 &&
      !isDead &&
      !loading
    ) {
      // 延迟一小段时间后恢复自动历练，确保状态更新完成
      const timer = setTimeout(() => {
        setAutoAdventure(true);
        setAutoAdventurePausedByBattle(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoAdventurePausedByBattle, player?.hp, isDead, loading]);

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
    autoAdventurePausedByShop,
    autoAdventurePausedByBattle,
    autoAdventurePausedByReputationEvent,
    setAutoAdventurePausedByShop,
    handleMeditate,
    handleAdventure,
    setCooldown,
  });

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

  // 使用统一的键盘快捷键 Hook
  const keyboardShortcuts = useAppKeyboardShortcuts({
    player,
    gameStarted,
    settings,
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
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
    setPlayer,
    handleCloseCurrentModal,
  });

  // 使用键盘快捷键
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  // 使用统一的 View Handlers Hook
  const gameViewHandlers = useGameViewHandlers({
    handleMeditate,
    handleAdventure,
    handleEnterRealm,
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
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
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
    handleClaimQuestReward: claimQuestReward,
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
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    handleBattleResult,
    handleSkipBattleLogs,
    handleCloseBattleModal,
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
    setIsDebugOpen,
    setIsDailyQuestOpen,
    setIsShopOpen,
    setIsGrottoOpen,
    setIsBattleModalOpen,
    setIsTurnBasedBattleOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
    setIsReputationEventOpen,
    setIsTreasureVaultOpen,
    setIsSaveManagerOpen,
    setItemToUpgrade,
    setCurrentShop,
    setBattleReplay,
    setRevealedBattleRounds,
    setTurnBasedBattleParams,
    setReputationEvent,
    setPlayer,
    addLog,
    autoMeditate,
    autoAdventure,
    autoAdventurePausedByShop,
    autoAdventurePausedByReputationEvent,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
  });

  const modalsHandlers = useModalsHandlers({
    handleMeditate,
    handleAdventure,
    handleEnterRealm,
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
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
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
    handleClaimQuestReward: claimQuestReward,
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
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    handleBattleResult,
    handleSkipBattleLogs,
    handleCloseBattleModal,
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
    setIsDebugOpen,
    setIsDailyQuestOpen,
    setIsShopOpen,
    setIsGrottoOpen,
    setIsBattleModalOpen,
    setIsTurnBasedBattleOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
    setIsReputationEventOpen,
    setIsTreasureVaultOpen,
    setIsSaveManagerOpen,
    setItemToUpgrade,
    setCurrentShop,
    setBattleReplay,
    setRevealedBattleRounds,
    setTurnBasedBattleParams,
    setReputationEvent,
    setPlayer,
    addLog,
    autoMeditate,
    autoAdventure,
    autoAdventurePausedByShop,
    autoAdventurePausedByReputationEvent,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
  });

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

  if (!player) {
    return null;
  }

  return (
    <AppContent
      player={player}
      logs={logs}
      setLogs={setLogs}
      visualEffects={visualEffects}
      loading={loading}
      cooldown={cooldown}
      settings={settings}
      isDead={isDead}
      setIsDead={setIsDead}
      deathBattleData={deathBattleData}
      setDeathBattleData={setDeathBattleData}
      deathReason={deathReason}
      setDeathReason={setDeathReason}
      tribulationState={tribulationState}
      showCultivationIntro={showCultivationIntro}
      setShowCultivationIntro={setShowCultivationIntro}
      isSaveManagerOpen={isSaveManagerOpen}
      setIsSaveManagerOpen={setIsSaveManagerOpen}
      isSaveCompareOpen={isSaveCompareOpen}
      setIsSaveCompareOpen={setIsSaveCompareOpen}
      compareSave1={compareSave1}
      compareSave2={compareSave2}
      setCompareSave1={setCompareSave1}
      setCompareSave2={setCompareSave2}
      isAnyModalOpen={isAnyModalOpen}
      isDebugModeEnabled={isDebugModeEnabled}
      isDebugOpen={isDebugOpen}
      setIsDebugOpen={setIsDebugOpen}
      purchaseSuccess={purchaseSuccess}
      lotteryRewards={lotteryRewards}
      setLotteryRewards={setLotteryRewards}
      itemActionLogValue={itemActionLogValue}
      setItemActionLog={setItemActionLog}
      autoAdventure={autoAdventure}
      modals={{
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
        isBattleModalOpen,
        isTurnBasedBattleOpen,
        isMobileSidebarOpen,
        isMobileStatsOpen,
        isReputationEventOpen,
        isTreasureVaultOpen,
      }}
      setPlayer={setPlayer}
      setReputationEvent={setReputationEvent}
      setIsReputationEventOpen={setIsReputationEventOpen}
      handleTribulationComplete={handleTribulationComplete}
      handleRebirth={handleRebirth}
      closeAlert={closeAlert}
      alertState={alertState}
      gameViewHandlers={gameViewHandlers}
      modalsHandlers={modalsHandlers}
      adventureHandlers={adventureHandlers}
      setIsInventoryOpen={setIsInventoryOpen}
      setIsCultivationOpen={setIsCultivationOpen}
      setIsCharacterOpen={setIsCharacterOpen}
      setIsAchievementOpen={setIsAchievementOpen}
      setIsPetOpen={setIsPetOpen}
      setIsLotteryOpen={setIsLotteryOpen}
      setIsSettingsOpen={setIsSettingsOpen}
      setIsRealmOpen={setIsRealmOpen}
      setIsAlchemyOpen={setIsAlchemyOpen}
      setIsSectOpen={setIsSectOpen}
      setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      setIsMobileStatsOpen={setIsMobileStatsOpen}
    />
  );

}

export default App;
