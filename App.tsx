import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  TribulationState,
  GameSettings,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import LoadingScreen from './components/LoadingScreen';

import { SaveData } from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameEffects } from './hooks/useGameEffects';
import {
  useGameStore,
  usePlayer,
  useSettings,
  useLogs,
  useGameStarted,
} from './store';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useAutoGrottoHarvest } from './hooks/useAutoGrottoHarvest';
import { STORAGE_KEYS } from './constants/storageKeys';
import { AUTO_ADVENTURE_CONSTANTS } from './constants/appConstants';
import { useItemActionLog } from './hooks/useItemActionLog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePlayTime } from './hooks/usePlayTime';
import { useGameInitialization } from './hooks/useGameInitialization';
import { useLevelUp } from './hooks/useLevelUp';
import { useGlobalAlert } from './hooks/useGlobalAlert';
import { useRebirth } from './hooks/useRebirth';

// 导入拆分后的 hooks
import { useAppHandlers } from './hooks/useAppHandlers';
import { useAppKeyboardShortcuts } from './hooks/useAppKeyboardShortcuts';
import { useGameViewHandlers, useModalsHandlers } from './hooks/useAppViewHandlers';
import { AppContent } from './components/AppContent';
import {
  useAppUIState,
  useIsAnyModalOpen,
} from './hooks/useAppUIState';
import {
  useNewGameDetection,
  useCultivationIntro,
  useBattleResume,
  useRealmChangeDetection,
  useAchievementCheck,
  useDebugModeInit,
  useTribulationComplete,
} from './hooks/useAppLifecycle';
import { useHandlerGroups } from './hooks/useHandlerGroups';

function App() {
  // ========== Game Store 状态 ==========
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

  // ========== UI Store 状态（使用拆分后的 hook）==========
  const uiState = useAppUIState();
  const {
    modals,
    modalSetters,
    loading,
    cooldown,
    setLoading,
    setCooldown,
    purchaseSuccess,
    lotteryRewards,
    setCurrentShop,
    setItemToUpgrade,
    setLotteryRewards,
    lastBattleReplay,
    setBattleReplay,
    setRevealedBattleRounds,
    setTurnBasedBattleParams,
    itemActionLog: itemActionLogValue,
    setItemActionLog: setItemActionLogRaw,
    setReputationEvent,
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
    closeCurrentModal,
    openTurnBasedBattle,
    resetAutoStates,
  } = uiState;

  const isAnyModalOpen = useIsAnyModalOpen();

  // 解构 modalSetters
  const {
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsRealmOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsDailyQuestOpen,
    setIsDebugOpen,
    setIsBattleModalOpen,
    setIsTurnBasedBattleOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
    setIsDebugModeEnabled,
    setIsReputationEventOpen,
    setIsTreasureVaultOpen,
    setIsAutoAdventureConfigOpen,
  } = modalSetters;

  // ========== 本地状态 ==========
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCultivationIntro, setShowCultivationIntro] = useState(false);
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isSaveCompareOpen, setIsSaveCompareOpen] = useState(false);
  const [compareSave1, setCompareSave1] = useState<SaveData | null>(null);
  const [compareSave2, setCompareSave2] = useState<SaveData | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(null);
  const [deathReason, setDeathReason] = useState('');
  const [tribulationState, setTribulationState] = useState<TribulationState | null>(null);
  const [autoAdventureConfig, setAutoAdventureConfig] = useState(AUTO_ADVENTURE_CONSTANTS.DEFAULT_CONFIG);

  // ========== 游戏效果 ==========
  const { visualEffects, createAddLog, triggerVisual } = useGameEffects();

  const addLog = useCallback((message: string, type?: string) => {
    if (setLogs && createAddLog) {
      const logFunc = createAddLog(setLogs);
      logFunc(message, type);
    }
  }, [createAddLog, setLogs]);

  // ========== 使用公共 hooks ==========
  const { setItemActionLog } = useItemActionLog({
    delay: 3000,
    externalSetter: setItemActionLogRaw,
  });

  useGameInitialization();

  usePlayTime({
    gameStarted,
    player,
    setPlayer,
    saveGame,
    logs,
  });

  const { alertState, closeAlert } = useGlobalAlert();

  // ========== 生命周期 hooks ==========
  useDebugModeInit({ setIsDebugModeEnabled });

  useCultivationIntro({
    gameStarted,
    player,
    setShowCultivationIntro,
  });

  useNewGameDetection({
    gameStarted,
    player,
    resetAutoStates,
  });

  useBattleResume({
    pausedByBattle,
    player,
    isDead,
    loading,
    setAutoAdventure,
    setPausedByBattle,
  });

  // ========== App Handlers ==========
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
    setPausedByHeavenEarthSoul,
    loading,
    cooldown,
    setLoading,
    setCooldown,
    setDeathReason,
    setItemActionLog,
    handleOpenTurnBasedBattle: openTurnBasedBattle,
    autoAdventureConfig,
  });

  const {
    handleMeditate,
    handleAdventure,
    breakthroughHandlers,
    adventureHandlers,
    dailyQuestHandlers,
    checkAchievements,
  } = appHandlers;

  // ========== 日常任务初始化 ==========
  // 游戏启动时，如果日常任务为空，自动刷新
  useEffect(() => {
    if (gameStarted && player && dailyQuestHandlers) {
      dailyQuestHandlers.initializeDailyQuests();
    }
  }, [gameStarted, player, dailyQuestHandlers]);

  // ========== 等级提升与天劫 ==========
  const handleBreakthroughRef = useRef(breakthroughHandlers.handleBreakthrough);
  useEffect(() => {
    handleBreakthroughRef.current = breakthroughHandlers.handleBreakthrough;
  }, [breakthroughHandlers.handleBreakthrough]);

  const { isTribulationTriggeredRef } = useLevelUp({
    player,
    setPlayer,
    tribulationState,
    setTribulationState,
    handleBreakthrough: (...args) => handleBreakthroughRef.current(...args),
    addLog,
    autoAdventure,
  });

  // 天劫完成处理
  const handleTribulationComplete = useTribulationComplete({
    setPlayer,
    setTribulationState,
    setDeathReason,
    addLog,
    handleBreakthroughRef,
  });

  // 境界变化监听
  useRealmChangeDetection({
    player,
    isTribulationTriggeredRef,
    updateQuestProgress: dailyQuestHandlers.updateQuestProgress,
  });

  // 成就检查
  useAchievementCheck({
    player,
    checkAchievements,
  });

  // ========== 涅槃重生 ==========
  const { handleRebirth } = useRebirth({
    setPlayer,
    setLogs,
    setGameStarted,
    setHasSave,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
  });

  // ========== 死亡检测 ==========
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

  // ========== 被动回血和冷却 ==========
  usePassiveRegeneration({
    player,
    setPlayer,
    cooldown,
    setCooldown,
  });

  // ========== 洞府自动收获 ==========
  useAutoGrottoHarvest({
    player,
    setPlayer,
    addLog,
  });

  // ========== 自动功能 ==========
  useAutoFeatures({
    autoMeditate,
    autoAdventure,
    player,
    loading,
    cooldown,
    isShopOpen: modals.isShopOpen,
    isReputationEventOpen: modals.isReputationEventOpen,
    isTurnBasedBattleOpen: modals.isTurnBasedBattleOpen,
    isAlertOpen: alertState?.isOpen ?? false,
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
    autoAdventureConfig,
    setAutoAdventure,
    addLog,
  });

  // ========== 键盘快捷键 ==========
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
    handleCloseCurrentModal: closeCurrentModal,
    setIsAutoAdventureConfigOpen,
  } as any);

  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  // ========== Handler Groups ==========
  const { commonHandlersParams } = useHandlerGroups({
    appHandlers: appHandlers as any,
    handleRebirth,
    modalSetters: {
      ...modalSetters,
      setIsSaveManagerOpen,
    } as any,
    otherSettersAndState: {
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
    },
  });

  const gameViewHandlers = useGameViewHandlers(commonHandlersParams);
  const modalsHandlers = useModalsHandlers(commonHandlersParams);

  // ========== 游戏启动时自动加载存档 ==========
  useEffect(() => {
    if (hasSave && !player) {
      loadGame();
    }
  }, [hasSave, player, loadGame]);

  // ========== 开始新游戏 ==========
  const handleStartGame = useCallback((
    playerName: string,
    talentId: string,
    difficulty: GameSettings['difficulty']
  ) => {
    startNewGame(playerName, talentId, difficulty);
  }, [startNewGame]);

  // ========== 渲染逻辑 ==========

  // 显示欢迎界面
  if (showWelcome) {
    return (
      <WelcomeScreen
        hasSave={hasSave}
        onStart={() => {
          localStorage.removeItem(STORAGE_KEYS.SAVE);
          setHasSave(false);
          setGameStarted(false);
          setPlayer(null);
          setLogs([]);
          setShowWelcome(false);
        }}
        onContinue={() => {
          setShowWelcome(false);
        }}
      />
    );
  }

  // 加载中
  if (hasSave && !player && gameStarted) {
    return <LoadingScreen />;
  }

  // 开始界面
  if (!hasSave && (!gameStarted || !player)) {
    return <StartScreen onStart={handleStartGame} />;
  }

  if (!player) {
    return null;
  }

  // 主游戏界面
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
        isDebugModeEnabled: modals.isDebugModeEnabled,
        isDebugOpen: modals.isDebugOpen,
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
