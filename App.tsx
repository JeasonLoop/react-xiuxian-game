import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  TribulationState,
  TribulationResult,
  GameSettings,
  RealmType,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import LoadingScreen from './components/LoadingScreen';

import {
  SaveData,
} from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameEffects } from './hooks/useGameEffects';
import {
  useGameStore,
  usePlayer,
  useSettings,
  useLogs,
  useGameStarted,
  useUIStore,
  useModals,
} from './store';
import { useShallow } from 'zustand/react/shallow';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useAutoGrottoHarvest } from './hooks/useAutoGrottoHarvest';
import { STORAGE_KEYS } from './constants/storageKeys';
import { useItemActionLog } from './hooks/useItemActionLog';
import {
  useKeyboardShortcuts,
} from './hooks/useKeyboardShortcuts';

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
  // 直接从 zustand store 获取游戏状态
  const hasSave = useGameStore((state) => state.hasSave);
  const setHasSave = useGameStore((state) => state.setHasSave);
  const gameStarted = useGameStarted();
  const setGameStarted = useGameStore((state) => state.setGameStarted);
  const player = usePlayer();
  const setPlayer = useGameStore((state) => state.setPlayer);
  const settings = useSettings();
  const logs = useLogs();
  const setLogs = useGameStore((state) => state.setLogs);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const startNewGame = useGameStore((state) => state.startNewGame);

  // 兼容原有的 handleStartGame 接口
  const handleStartGame = (
    playerName: string,
    talentId: string,
    difficulty: GameSettings['difficulty']
  ) => {
    startNewGame(playerName, talentId, difficulty);
  };

  // 游戏启动时自动加载存档
  useEffect(() => {
    if (hasSave && !player) {
      loadGame();
    }
    // loadGame 是 zustand store 的稳定函数引用，但为了明确依赖关系，仍然包含它
  }, [hasSave, player, loadGame]);

  // 欢迎界面状态 - 总是显示欢迎界面，让用户选择继续或开始
  const [showWelcome, setShowWelcome] = useState(true);

  // 修仙法门弹窗状态
  const [showCultivationIntro, setShowCultivationIntro] = useState(false);

  // 使用自定义hooks管理游戏效果
  const { visualEffects, createAddLog, triggerVisual } = useGameEffects();
  // createAddLog 和 setLogs 都是稳定的函数引用，addLog 也是稳定的
  const addLog = useMemo(() => createAddLog(setLogs), [createAddLog, setLogs]);

  // 直接从 zustand UI store 获取状态
  const modals = useModals();

  // 优化：批量选择 UI Store 状态和 setters，减少订阅数量
  // Modal setters - 批量选择所有 setter 函数（函数引用稳定，不会导致重渲染）
  const modalSetters = useUIStore(
    useShallow((state) => ({
      setIsInventoryOpen: state.setIsInventoryOpen,
      setIsCultivationOpen: state.setIsCultivationOpen,
      setIsAlchemyOpen: state.setIsAlchemyOpen,
      setIsUpgradeOpen: state.setIsUpgradeOpen,
      setIsSectOpen: state.setIsSectOpen,
      setIsRealmOpen: state.setIsRealmOpen,
      setIsCharacterOpen: state.setIsCharacterOpen,
      setIsAchievementOpen: state.setIsAchievementOpen,
      setIsPetOpen: state.setIsPetOpen,
      setIsLotteryOpen: state.setIsLotteryOpen,
      setIsSettingsOpen: state.setIsSettingsOpen,
      setIsDailyQuestOpen: state.setIsDailyQuestOpen,
      setIsShopOpen: state.setIsShopOpen,
      setIsGrottoOpen: state.setIsGrottoOpen,
      setIsDebugOpen: state.setIsDebugOpen,
      setIsBattleModalOpen: state.setIsBattleModalOpen,
      setIsTurnBasedBattleOpen: state.setIsTurnBasedBattleOpen,
      setIsMobileSidebarOpen: state.setIsMobileSidebarOpen,
      setIsMobileStatsOpen: state.setIsMobileStatsOpen,
      setIsDebugModeEnabled: state.setIsDebugModeEnabled,
      setIsReputationEventOpen: state.setIsReputationEventOpen,
      setIsTreasureVaultOpen: state.setIsTreasureVaultOpen,
      setIsAutoAdventureConfigOpen: (state as typeof state & { setIsAutoAdventureConfigOpen: (open: boolean) => void }).setIsAutoAdventureConfigOpen,
    }))
  );
  // 解构以便使用（保持向后兼容）
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
  } = modalSetters;

  // 直接从 useUIStore 获取 setIsAutoAdventureConfigOpen，避免类型推断问题
  const setIsAutoAdventureConfigOpen = useUIStore((state) => (state as any).setIsAutoAdventureConfigOpen) as (open: boolean) => void;

  // 全局状态和 setters - 批量选择
  const { loading, cooldown, setLoading, setCooldown } = useUIStore(
    useShallow((state) => ({
      loading: state.loading,
      cooldown: state.cooldown,
      setLoading: state.setLoading,
      setCooldown: state.setCooldown,
    }))
  );

  // Shop, upgrade, notifications - 批量选择状态和 setters
  const {
    purchaseSuccess,
    lotteryRewards,
    setCurrentShop,
    setItemToUpgrade,
    setLotteryRewards,
  } = useUIStore(
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

  // Battle - 批量选择状态和 setters
  const {
    lastBattleReplay,
    setBattleReplay,
    setRevealedBattleRounds,
  } = useUIStore(
    useShallow((state) => ({
      battleReplay: state.battleReplay,
      revealedBattleRounds: state.revealedBattleRounds,
      lastBattleReplay: state.lastBattleReplay,
      setBattleReplay: state.setBattleReplay,
      setRevealedBattleRounds: state.setRevealedBattleRounds,
      setLastBattleReplay: state.setLastBattleReplay,
    }))
  );

  // Turn based battle, item action log, reputation event - 批量选择
  const {
    setTurnBasedBattleParams,
    itemActionLogValue,
    setItemActionLogRaw,
    setReputationEvent,
  } = useUIStore(
    useShallow((state) => ({
      setTurnBasedBattleParams: state.setTurnBasedBattleParams,
      itemActionLogValue: state.itemActionLog,
      setItemActionLogRaw: state.setItemActionLog,
      setReputationEvent: state.setReputationEvent,
    }))
  );

  // Auto features - 批量选择状态和 setters
  const {
    autoMeditate,
    autoAdventure,
    pausedByShop,
    pausedByBattle,
    pausedByReputationEvent,
    pausedByHeavenEarthSoul,
    setAutoMeditate,
    setAutoAdventure,
    setPausedByShop,
    setPausedByBattle,
    setPausedByReputationEvent,
    setPausedByHeavenEarthSoul,
  } = useUIStore(
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

  // Actions - 批量选择
  const { closeCurrentModal, openTurnBasedBattle } = useUIStore(
    useShallow((state) => ({
      closeCurrentModal: state.closeCurrentModal,
      openTurnBasedBattle: state.openTurnBasedBattle,
    }))
  );

  // 兼容旧接口的别名（保留以兼容现有代码）
  const handleCloseCurrentModal = closeCurrentModal;
  const handleOpenTurnBasedBattle = openTurnBasedBattle;

  // 解构 modals 状态以便使用
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
    isReputationEventOpen,
    isTreasureVaultOpen,
    isDebugModeEnabled,
  } = modals;

  // Auto adventure config state
  const [autoAdventureConfig, setAutoAdventureConfig] = useState<{
    skipBattle: boolean;
    fleeOnBattle: boolean;
    skipShop: boolean;
    skipReputationEvent: boolean;
    minHpThreshold: number;
  }>({
    skipBattle: true,
    fleeOnBattle: false,
    skipShop: true,
    skipReputationEvent: true,
    minHpThreshold: 20,
  });

  // 检查调试模式是否启用
  useEffect(() => {
    const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
    setIsDebugModeEnabled(debugMode);
  }, []);

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

  // loading, cooldown 已在上面定义

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

  // 使用统一的 App Handlers Hook（直接使用 zustand stores，无需兼容层）
  const appHandlers = useAppHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
    settings,
    gameStarted,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    pausedByReputationEvent,
    setPausedByShop,
    setPausedByReputationEvent,
    loading,
    cooldown,
    setLoading,
    setCooldown,
    setDeathReason,
    setItemActionLog,
    handleOpenTurnBasedBattle,
    autoAdventureConfig,
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

  // 使用 ref 存储最新的 handleBreakthrough，避免 useEffect 依赖导致循环
  const handleBreakthroughRef = useRef(breakthroughHandlers.handleBreakthrough);
  useEffect(() => {
    handleBreakthroughRef.current = breakthroughHandlers.handleBreakthrough;
  }, [breakthroughHandlers.handleBreakthrough]);

  // 使用等级提升与天劫处理 hook
  const { isTribulationTriggeredRef } = useLevelUp({
    player,
    setPlayer,
    tribulationState,
    setTribulationState,
    handleBreakthrough: (...args: Parameters<typeof breakthroughHandlers.handleBreakthrough>) => {
      handleBreakthroughRef.current(...args);
    },
    addLog,
    autoAdventure, // 传递自动历练状态，自动历练时不触发突破
  });

  // 处理天劫完成
  const handleTribulationComplete = (result: TribulationResult) => {
    // 不在这里重置标志位，让境界变化时的 useEffect 来重置
    if (result.success) {
      // 渡劫成功，执行突破（跳过成功率检查）
      // 将天劫产生的扣血传递给突破处理器，确保在同一次状态更新中处理
      handleBreakthroughRef.current(true, result.hpLoss || 0);

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
                             player.realm === RealmType.QiRefining &&
                             player.realmLevel === 1;

      if (isNewPlayer && isInitialState) {
        // 新游戏开始时，确保自动历练状态被重置
        setAutoAdventure(false);
        setPausedByBattle(false);
        setPausedByShop(false);
        setPausedByReputationEvent(false);
        setPausedByHeavenEarthSoul(false);
      }

      prevPlayerNameRef.current = player.name;
    } else if (!gameStarted || !player) {
      // 游戏未开始或玩家为null时，重置ref
      prevPlayerNameRef.current = null;
    }
    // 使用 player 对象作为依赖，在 effect 内部访问属性，避免可选链依赖
  }, [gameStarted, player]);


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
    setItemActionLog,
  });

  // 战斗结束后，如果玩家还活着且之前是自动历练模式，继续自动历练
  useEffect(() => {
    if (
      pausedByBattle &&
      player &&
      player.hp > 0 &&
      !isDead &&
      !loading
    ) {
      // 延迟一小段时间后恢复自动历练，确保状态更新完成
      const timer = setTimeout(() => {
        setAutoAdventure(true);
        setPausedByBattle(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    // setAutoAdventure 和 setPausedByBattle 是 zustand 的稳定函数引用，但为了明确依赖关系，仍然包含它们
  }, [pausedByBattle, player, isDead, loading]);

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
    isAlertOpen: alertState?.isOpen ?? false, // 确认弹窗是否打开（包括天地之魄确认弹窗）
    pausedByShop,
    pausedByBattle,
    pausedByReputationEvent,
    pausedByHeavenEarthSoul,
    setPausedByShop,
    setPausedByBattle,
    setPausedByReputationEvent,
    setPausedByHeavenEarthSoul,
    handleMeditate,
    handleAdventure,
    setCooldown,
    autoAdventureConfig, // 传递自动历练配置
    setAutoAdventure, // 传递设置自动历练状态的函数
    addLog, // 传递日志函数
  });

  // 等级提升逻辑已由 useLevelUp hook 处理，这里不再重复

  // 监听突破成功，更新任务进度
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  const dailyQuestHandlersRef = useRef(dailyQuestHandlers);
  useEffect(() => {
    dailyQuestHandlersRef.current = dailyQuestHandlers;
  }, [dailyQuestHandlers]);

  useEffect(() => {
    if (player && prevRealmRef.current) {
      const prevRealm = prevRealmRef.current.realm;
      const prevLevel = prevRealmRef.current.level;
      if (player.realm !== prevRealm || player.realmLevel !== prevLevel) {
        // 境界或等级变化，说明突破成功
        dailyQuestHandlersRef.current.updateQuestProgress('breakthrough', 1);
        // 重置天劫触发标志
        isTribulationTriggeredRef.current = false;
      }
    }
    if (player) {
      prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
    }
    // 使用 player 对象作为依赖，在 effect 内部访问属性，避免可选链依赖
  }, [player]);


  // Sect handlers、Achievement、Pet、Lottery、Settings handlers 已全部移到对应模块

  // 检查成就（境界变化、统计变化时）
  const checkAchievementsRef = useRef(checkAchievements);
  useEffect(() => {
    checkAchievementsRef.current = checkAchievements;
  }, [checkAchievements]);

  useEffect(() => {
    if (player) {
      checkAchievementsRef.current();
    }
    // 使用 player 对象作为依赖，在 effect 内部访问属性，避免可选链依赖
    // checkAchievements 通过 ref 访问最新值，避免循环依赖
  }, [
    player,
    // 使用这些值来触发检查，但通过 player 对象访问
    player?.realm,
    player?.realmLevel,
    player?.statistics,
    player?.inventory?.length,
    player?.pets?.length,
    player?.cultivationArts?.length,
    player?.unlockedRecipes?.length,
    player?.lotteryCount,
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
    setPausedByShop,
    setPausedByBattle,
    setPausedByReputationEvent,
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
    setIsAutoAdventureConfigOpen,
  } as any);

  // 使用键盘快捷键
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  const coreHandlers = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  // 宗门相关 handlers（较少变化）
  const sectHandlers = useMemo(
    () => ({
      handleJoinSect,
      handleLeaveSect,
      handleSafeLeaveSect,
      handleSectTask,
      handleSectPromote,
      handleSectBuy,
      handleChallengeLeader,
    }),
    [
      handleJoinSect,
      handleLeaveSect,
      handleSafeLeaveSect,
      handleSectTask,
      handleSectPromote,
      handleSectBuy,
      handleChallengeLeader,
    ]
  );

  // 角色相关 handlers（较少变化）
  const characterHandlers = useMemo(
    () => ({
      handleSelectTalent,
      handleSelectTitle,
      handleAllocateAttribute,
      handleAllocateAllAttributes,
      handleUseInheritance,
    }),
    [
      handleSelectTalent,
      handleSelectTitle,
      handleAllocateAttribute,
      handleAllocateAllAttributes,
      handleUseInheritance,
    ]
  );

  // 灵宠相关 handlers（较少变化）
  const petHandlers = useMemo(
    () => ({
      handleActivatePet,
      handleDeactivatePet,
      handleFeedPet,
      handleBatchFeedItems,
      handleBatchFeedHp,
      handleEvolvePet,
      handleReleasePet,
      handleBatchReleasePets,
    }),
    [
      handleActivatePet,
      handleDeactivatePet,
      handleFeedPet,
      handleBatchFeedItems,
      handleBatchFeedHp,
      handleEvolvePet,
      handleReleasePet,
      handleBatchReleasePets,
    ]
  );

  // 洞府相关 handlers
  const grottoHandlers = useMemo(
    () => ({
      handleUpgradeGrotto,
      handlePlantHerb,
      handleHarvestHerb,
      handleHarvestAll,
      handleEnhanceSpiritArray,
      handleToggleAutoHarvest,
      handleSpeedupHerb,
    }),
    [
      handleUpgradeGrotto,
      handlePlantHerb,
      handleHarvestHerb,
      handleHarvestAll,
      handleEnhanceSpiritArray,
      handleToggleAutoHarvest,
      handleSpeedupHerb,
    ]
  );

  // 商店和战斗相关 handlers（较少变化）
  const shopAndBattleHandlers = useMemo(
    () => ({
      handleBuyItem,
      handleSellItem,
      handleRefreshShop,
      handleReputationEventChoice,
      handleTakeTreasureVaultItem,
      handleUpdateVault,
      handleBattleResult,
      handleSkipBattleLogs,
      handleCloseBattleModal,
      handleDraw,
      handleUpdateSettings,
      handleRebirth,
      handleClaimQuestReward: claimQuestReward,
    }),
    [
      handleBuyItem,
      handleSellItem,
      handleRefreshShop,
      handleReputationEventChoice,
      handleTakeTreasureVaultItem,
      handleUpdateVault,
      handleBattleResult,
      handleSkipBattleLogs,
      handleCloseBattleModal,
      handleDraw,
      handleUpdateSettings,
      handleRebirth,
      claimQuestReward,
    ]
  );

  // Modal setters（稳定引用，很少变化）
  const modalSettersGroup = useMemo(
    () => ({
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
      setIsAutoAdventureConfigOpen,
    }),
    [
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
      setIsAutoAdventureConfigOpen,
    ]
  );

  // 其他 setters 和状态（可能经常变化）
  const otherSettersAndState = useMemo(
    () => ({
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
      pausedByShop,
      pausedByBattle,
      pausedByReputationEvent,
      pausedByHeavenEarthSoul,
      setAutoMeditate,
      setAutoAdventure,
      setPausedByShop,
      setPausedByBattle,
      setPausedByReputationEvent,
      setPausedByHeavenEarthSoul,
    }),
    [
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
      pausedByShop,
      pausedByBattle,
      pausedByReputationEvent,
      pausedByHeavenEarthSoul,
      setAutoMeditate,
      setAutoAdventure,
      setPausedByShop,
      setPausedByBattle,
      setPausedByReputationEvent,
      setPausedByHeavenEarthSoul,
    ]
  );

  // 合并所有 handlers 参数（仅在需要时重新创建）
  const commonHandlersParams = useMemo(
    () => ({
      ...coreHandlers,
      ...sectHandlers,
      ...characterHandlers,
      ...petHandlers,
      ...grottoHandlers,
      ...shopAndBattleHandlers,
      ...modalSettersGroup,
      ...otherSettersAndState,
    }),
    [
      coreHandlers,
      sectHandlers,
      characterHandlers,
      petHandlers,
      grottoHandlers,
      shopAndBattleHandlers,
      modalSettersGroup,
      otherSettersAndState,
    ]
  );

  // 使用统一的 View Handlers Hook
  const gameViewHandlers = useGameViewHandlers(commonHandlersParams);

  const modalsHandlers = useModalsHandlers(commonHandlersParams);

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

  // 如果有存档但 player 还在加载中，显示加载状态
  if (hasSave && !player && gameStarted) {
    return <LoadingScreen />;
  }

  // 显示开始界面（取名界面）- 只有在没有存档且游戏未开始时才显示
  if (!hasSave && (!gameStarted || !player)) {
    return <StartScreen onStart={handleStartGame} />;
  }

  if (!player) {
    return null;
  }

  return (
    <AppContent
      {...({
        player,
        logs,
        setLogs,
        visualEffects,
        loading,
        cooldown,
        settings,
        isDead,
        setIsDead,
        deathBattleData,
        setDeathBattleData,
        deathReason,
        setDeathReason,
        tribulationState,
        showCultivationIntro,
        setShowCultivationIntro,
        isSaveManagerOpen,
        setIsSaveManagerOpen,
        isSaveCompareOpen,
        setIsSaveCompareOpen,
        compareSave1,
        compareSave2,
        setCompareSave1,
        setCompareSave2,
        isAnyModalOpen,
        isDebugModeEnabled,
        isDebugOpen,
        setIsDebugOpen,
        purchaseSuccess,
        lotteryRewards,
        setLotteryRewards,
        itemActionLogValue,
        setItemActionLog,
        autoAdventure,
        modals,
        setPlayer,
        setReputationEvent,
        setIsReputationEventOpen,
        setIsAutoAdventureConfigOpen,
        autoAdventureConfig,
        setAutoAdventureConfig,
        handleTribulationComplete,
        handleRebirth,
        closeAlert,
        alertState,
        gameViewHandlers,
        modalsHandlers,
        adventureHandlers,
      } as any)}
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
