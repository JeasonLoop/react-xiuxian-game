import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  Item,
  Shop,
  ShopItem,
  ShopType,
  EquipmentSlot,
  AdventureType,
  RealmType,
  ItemType,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import DeathModal from './components/DeathModal';
import DebugModal from './components/DebugModal';
import SaveManagerModal from './components/SaveManagerModal';
import SaveCompareModal from './components/SaveCompareModal';
import { SaveData, clearAllSlots } from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { useAppState } from './hooks/useAppState';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useBattleResultHandler } from './hooks/useBattleResultHandler';
import { SAVE_KEY } from './utils/gameUtils';
import { setGlobalAlertSetter } from './utils/toastUtils';
import AlertModal from './components/AlertModal';
import { AlertType } from './components/AlertModal';
import { useItemActionLog } from './hooks/useItemActionLog';
import { REALM_ORDER } from './constants';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from './hooks/useKeyboardShortcuts';
import {
  getShortcutConfig,
  configToShortcut,
} from './utils/shortcutUtils';

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
  } = useGameState();

  // 欢迎界面状态 - 总是显示欢迎界面，让用户选择继续或开始
  const [showWelcome, setShowWelcome] = useState(true);

  // 使用自定义hooks管理游戏效果
  const { visualEffects, createAddLog, triggerVisual } = useGameEffects();
  const addLog = createAddLog(setLogs);

  // 使用统一的 App 状态管理
  const appState = useAppState();
  const {
    modals,
    setters,
    shop,
    upgrade,
    notifications,
    battle,
    turnBasedBattle,
    itemActionLog,
  } = appState;

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
  } = setters;

  const { isDebugModeEnabled } = modals;

  // 检查调试模式是否启用
  useEffect(() => {
    const DEBUG_MODE_KEY = 'xiuxian-debug-mode';
    const debugMode = localStorage.getItem(DEBUG_MODE_KEY) === 'true';
    setIsDebugModeEnabled(debugMode);
  }, [setIsDebugModeEnabled]);

  const { currentShop, setCurrentShop } = shop;
  const { itemToUpgrade, setItemToUpgrade } = upgrade;
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

  // 加载和冷却状态
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Alert 弹窗状态
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type: AlertType;
    title?: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  } | null>(null);

  // 存档管理器状态
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isSaveCompareOpen, setIsSaveCompareOpen] = useState(false);
  const [compareSave1, setCompareSave1] = useState<SaveData | null>(null);
  const [compareSave2, setCompareSave2] = useState<SaveData | null>(null);

  // 初始化全局 alert
  useEffect(() => {
    setGlobalAlertSetter((alert) => {
      setAlertState(alert);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 自动功能和死亡状态
  const [autoMeditate, setAutoMeditate] = useState(false);
  const [autoAdventure, setAutoAdventure] = useState(false);
  const [autoAdventurePausedByShop, setAutoAdventurePausedByShop] =
    useState(false);
  const [autoAdventurePausedByBattle, setAutoAdventurePausedByBattle] =
    useState(false);
  const [autoAdventurePausedByReputationEvent, setAutoAdventurePausedByReputationEvent] =
    useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(
    null
  );
  const [deathReason, setDeathReason] = useState('');

  // 统一处理回合制战斗打开逻辑
  const handleOpenTurnBasedBattle = useCallback(
    (params: {
      adventureType: AdventureType;
      riskLevel?: '低' | '中' | '高' | '极度危险';
      realmMinRealm?: RealmType;
    }) => {
      // 如果正在自动历练，暂停自动历练但保存状态
      if (autoAdventure) {
        setAutoAdventure(false);
        setAutoAdventurePausedByBattle(true);
      }
      setTurnBasedBattleParams(params);
      setIsTurnBasedBattleOpen(true);
    },
    [
      autoAdventure,
      setAutoAdventure,
      setAutoAdventurePausedByBattle,
      setTurnBasedBattleParams,
      setIsTurnBasedBattleOpen,
    ]
  );

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
      // 类型转换：string -> DailyQuestType，运行时验证
      if (['meditate', 'adventure', 'breakthrough', 'alchemy', 'equip', 'pet', 'sect', 'realm', 'kill', 'collect', 'learn', 'other'].includes(type)) {
        dailyQuestHandlers.updateQuestProgress(type as any, amount);
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

  const itemHandlers = useItemHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
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
      // 如果正在自动历练，暂停自动历练
      if (autoAdventure) {
        setAutoAdventurePausedByShop(true);
        setAutoAdventure(false);
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
      // 如果正在自动历练，暂停自动历练
      if (autoAdventure) {
        setAutoAdventurePausedByReputationEvent(true);
        setAutoAdventure(false);
      }
      // 打开声望事件弹窗
      setReputationEvent(event);
      setIsReputationEventOpen(true);
    },
    onOpenTurnBasedBattle: handleOpenTurnBasedBattle,
    skipBattle: false, // 不再跳过战斗，自动模式下也会弹出战斗弹窗
    useTurnBasedBattle: true, // 使用新的回合制战斗系统
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

  // 涅槃重生功能
  const handleRebirth = () => {
    // 清除所有存档（包括新的多存档槽位系统和旧的存档系统）
    clearAllSlots(); // 清除所有存档槽位和备份
    localStorage.removeItem(SAVE_KEY); // 清除旧存档系统（兼容性）

    // 重置所有状态
    setIsDead(false);
    setDeathBattleData(null);
    setDeathReason('');
    setLastBattleReplay(null);
    setAutoMeditate(false);
    setAutoAdventure(false);
    setAutoAdventurePausedByBattle(false);
    setAutoAdventurePausedByShop(false);
    setAutoAdventurePausedByReputationEvent(false);
    setPlayer(null);
    setLogs([]);
    setGameStarted(false);
    setHasSave(false); // 重要：更新 hasSave 状态，避免卡在加载存档页面

    // 触发页面刷新或返回开始页面
    // useGameState 的 handleStartGame 会处理新游戏
  };

  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

  const handleUseItem = itemHandlers.handleUseItem;
  const handleOrganizeInventory = itemHandlers.handleOrganizeInventory;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
  const handleBatchUse = (itemIds: string[]) => {
    itemHandlers.handleBatchUseItems(itemIds);
  };

  const handleBatchDiscard = (itemIds: string[]) => {
    setPlayer((prev) => {
      const newInv = prev.inventory.filter((i) => !itemIds.includes(i.id));
      addLog(`你批量丢弃了 ${itemIds.length} 件物品。`, 'normal');
      return { ...prev, inventory: newInv };
    });
  };

  // 包装 handleEquipItem，添加任务进度更新
  const handleEquipItem = (item: Item, slot: EquipmentSlot) => {
    equipmentHandlers.handleEquipItem(item, slot);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  };
  const handleUnequipItem = equipmentHandlers.handleUnequipItem;
  // 包装 handleRefineNatalArtifact，添加任务进度更新
  const handleRefineNatalArtifact = (item: Item) => {
    equipmentHandlers.handleRefineNatalArtifact(item);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  };
  const handleUnrefineNatalArtifact =
    equipmentHandlers.handleUnrefineNatalArtifact;

  // 包装 handleLearnArt，添加任务进度更新
  const handleLearnArt = (art: any) => {
    cultivationHandlers.handleLearnArt(art);
    dailyQuestHandlers.updateQuestProgress('learn', 1);
  };
  const handleActivateArt = cultivationHandlers.handleActivateArt;

  // 包装 handleCraft，添加任务进度更新
  const handleCraft = async (recipe: any) => {
    await alchemyHandlers.handleCraft(recipe);
    dailyQuestHandlers.updateQuestProgress('alchemy', 1);
  };

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;
  const handleAllocateAllAttributes =
    characterHandlers.handleAllocateAllAttributes;

  // 提取新的模块化 handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;

  const handleRefreshShop = (newItems: ShopItem[]) => {
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
  };
  // 处理声望事件选择
  const handleReputationEventChoice = (choiceIndex: number) => {
    if (!reputationEvent || !player) return;

    const choice = reputationEvent.choices[choiceIndex];
    if (!choice) return;

    setPlayer((prev) => {
      const newReputation = Math.max(
        0,
        (prev.reputation || 0) + choice.reputationChange
      );
      let newHp = prev.hp;
      let newExp = prev.exp;
      let newSpiritStones = prev.spiritStones;

      // 处理其他变化
      if (choice.hpChange !== undefined) {
        newHp = Math.max(0, Math.min(prev.maxHp, prev.hp + choice.hpChange));
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
    if (autoAdventurePausedByReputationEvent) {
      setAutoAdventurePausedByReputationEvent(false);
      setAutoAdventure(true);
    }
  };

  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleDeactivatePet = petHandlers.handleDeactivatePet;
  // 包装 handleFeedPet，添加任务进度更新
  const handleFeedPet = (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => {
    petHandlers.handleFeedPet(petId, feedType, itemId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  };
  const handleBatchFeedItems = petHandlers.handleBatchFeedItems;
  const handleBatchFeedHp = petHandlers.handleBatchFeedHp;
  // 包装 handleEvolvePet，添加任务进度更新
  const handleEvolvePet = (petId: string) => {
    petHandlers.handleEvolvePet(petId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  };
  const handleReleasePet = petHandlers.handleReleasePet;
  const handleBatchReleasePets = petHandlers.handleBatchReleasePets;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;
  // 包装 handleSectTask，添加任务进度更新
  const handleSectTask = (task: any, encounterResult?: any) => {
    sectHandlers.handleSectTask(task, encounterResult);
    dailyQuestHandlers.updateQuestProgress('sect', 1);
  };
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

  // 使用自动功能 hook
  useAutoFeatures({
    autoMeditate,
    autoAdventure,
    player,
    loading,
    cooldown,
    isShopOpen,
    isReputationEventOpen,
    autoAdventurePausedByShop,
    setAutoAdventurePausedByShop,
    handleMeditate,
    handleAdventure,
    setCooldown,
  });

  // 现在可以使用 executeAdventure 初始化 realmHandlers
  const realmHandlers = useRealmHandlers({
    player,
    setPlayer,
    addLog,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    setIsRealmOpen,
    executeAdventure,
  });
  // 包装 handleEnterRealm，添加任务进度更新
  const handleEnterRealm = async (realm: any) => {
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
      breakthroughHandlers.handleBreakthrough();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.exp, player?.maxExp, player?.realm, player?.realmLevel]);

  // 初始化日常任务（只在游戏开始时执行一次，或日期变化时执行）
  useEffect(() => {
    if (player && gameStarted) {
      // 确保 player 对象已经完整初始化
      try {
        dailyQuestHandlers.initializeDailyQuests();
      } catch (error) {
        console.error('初始化日常任务失败:', error);
      }
    }
    // 只依赖 gameStarted，避免 player 对象变化时重复执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // 监听突破成功，更新任务进度
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  useEffect(() => {
    if (player && prevRealmRef.current) {
      const prevRealm = prevRealmRef.current.realm;
      const prevLevel = prevRealmRef.current.level;
      if (player.realm !== prevRealm || player.realmLevel !== prevLevel) {
        // 境界或等级变化，说明突破成功
        dailyQuestHandlers.updateQuestProgress('breakthrough', 1);
      }
    }
    if (player) {
      prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.realm, player?.realmLevel]);

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

  // 关闭当前打开的弹窗
  const handleCloseCurrentModal = useCallback(() => {
    if (isShopOpen) setIsShopOpen(false);
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
    else if (isUpgradeOpen) setIsUpgradeOpen(false);
    else if (isBattleModalOpen) setIsBattleModalOpen(false);
    else if (isTurnBasedBattleOpen) setIsTurnBasedBattleOpen(false);
    else if (isReputationEventOpen) setIsReputationEventOpen(false);
    else if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
    else if (isMobileStatsOpen) setIsMobileStatsOpen(false);
    else if (isDebugOpen) setIsDebugOpen(false);
  }, [
    isShopOpen,
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
    isDailyQuestOpen,
    isGrottoOpen,
    isUpgradeOpen,
    isBattleModalOpen,
    isTurnBasedBattleOpen,
    isReputationEventOpen,
    isMobileSidebarOpen,
    isMobileStatsOpen,
    isDebugOpen,
    setIsShopOpen,
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
    setIsUpgradeOpen,
    setIsBattleModalOpen,
    setIsTurnBasedBattleOpen,
    setIsReputationEventOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
    setIsDebugOpen,
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
          setAutoMeditate((prev) => {
            const newValue = !prev;
            if (newValue && autoAdventure) {
              setAutoAdventure(false);
              addLog('已关闭自动历练，开启自动打坐。', 'normal');
            }
            return newValue;
          });
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
    shortcuts.push(
      configToShortcut(
        toggleAutoAdventureConfig,
        () => {
          setAutoAdventure((prev) => {
            const newValue = !prev;
            if (newValue && autoMeditate) {
              setAutoMeditate(false);
              addLog('已关闭自动打坐，开启自动历练。', 'normal');
            }
            return newValue;
          });
        },
        '切换自动历练',
        '基础操作'
      )
    );

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
    player,
    gameStarted,
    settings.keyboardShortcuts,
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    addLog,
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
  ]);

  // 使用键盘快捷键
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  // 显示欢迎界面
  if (showWelcome) {
    return (
      <WelcomeScreen
        hasSave={hasSave}
        onStart={() => {
          // 新游戏：清除存档并重置状态
          localStorage.removeItem(SAVE_KEY);
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
        handlers={{
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
            setPlayer((prev) => ({
              ...prev,
              viewedAchievements: [...prev.achievements],
            }));
          },
          onOpenPet: () => setIsPetOpen(true),
          onOpenLottery: () => setIsLotteryOpen(true),
          onOpenDailyQuest: () => setIsDailyQuestOpen(true),
          onOpenGrotto: () => setIsGrottoOpen(true),
          onOpenSettings: () => setIsSettingsOpen(true),
          onOpenDebug: () => setIsDebugOpen(true),
          onOpenStats: () => setIsMobileStatsOpen(true),
          onUpdateViewedAchievements: () => {
            setPlayer((prev) => ({
              ...prev,
              viewedAchievements: [...prev.achievements],
            }));
          },
          autoMeditate,
          autoAdventure,
          onToggleAutoMeditate: () => {
            setAutoMeditate((prev) => {
              const newValue = !prev;
              // 如果开启自动打坐，则关闭自动历练
              if (newValue && autoAdventure) {
                setAutoAdventure(false);
                addLog('已关闭自动历练，开启自动打坐。', 'normal');
              }
              return newValue;
            });
          },
          onToggleAutoAdventure: () => {
            setAutoAdventure((prev) => {
              const newValue = !prev;
              // 如果开启自动历练，则关闭自动打坐
              if (newValue && autoMeditate) {
                setAutoMeditate(false);
                addLog('已关闭自动打坐，开启自动历练。', 'normal');
              }
              return newValue;
            });
          },
        }}
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
        />
      )}

      {/* Alert 提示弹窗 */}
      {alertState && (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={() => setAlertState(null)}
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
            setPlayer(loadedPlayer);
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

      <ModalsContainer
        player={player}
        settings={settings}
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
          isBattleModalOpen: isBattleModalOpen && !isDead, // 死亡时不显示战斗弹窗
          isTurnBasedBattleOpen: isTurnBasedBattleOpen && !isDead,
          isReputationEventOpen,
        }}
        modalState={{
          currentShop,
          itemToUpgrade,
          battleReplay,
          revealedBattleRounds,
          turnBasedBattleParams,
          reputationEvent,
        }}
        handlers={{
          setIsInventoryOpen: (open: boolean) => setIsInventoryOpen(open),
          setIsCultivationOpen: (open: boolean) => setIsCultivationOpen(open),
          setIsAlchemyOpen: (open: boolean) => setIsAlchemyOpen(open),
          setIsUpgradeOpen: (open: boolean) => {
            setIsUpgradeOpen(open);
            if (!open) setItemToUpgrade(null);
          },
          setIsSectOpen: (open: boolean) => setIsSectOpen(open),
          setIsRealmOpen: (open: boolean) => setIsRealmOpen(open),
          setIsCharacterOpen: (open: boolean) => setIsCharacterOpen(open),
          setIsAchievementOpen: (open: boolean) => setIsAchievementOpen(open),
          setIsPetOpen: (open: boolean) => setIsPetOpen(open),
          setIsLotteryOpen: (open: boolean) => setIsLotteryOpen(open),
          setIsSettingsOpen: (open: boolean) => setIsSettingsOpen(open),
          setIsDailyQuestOpen: (open: boolean) => setIsDailyQuestOpen(open),
          setIsGrottoOpen: (open: boolean) => setIsGrottoOpen(open),
          setIsShopOpen: (open: boolean) => {
            setIsShopOpen(open);
            if (!open) {
              setCurrentShop(null);
              // 如果自动历练是因为商店暂停的，恢复自动历练
              if (autoAdventurePausedByShop) {
                setAutoAdventurePausedByShop(false);
                setAutoAdventure(true);
              }
            }
          },
          setIsBattleModalOpen: (open: boolean) => setIsBattleModalOpen(open),
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
            setPlayer((prev) => ({
              ...prev,
              viewedAchievements: [...prev.achievements],
            }));
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
          handleBuyItem,
          handleSellItem,
          handleRefreshShop,
          handleReputationEventChoice,
          setIsReputationEventOpen: (open: boolean) => {
            setIsReputationEventOpen(open);
            if (!open) {
              setReputationEvent(null);
              // 如果自动历练是因为声望事件暂停的，恢复自动历练
              if (autoAdventurePausedByReputationEvent) {
                setAutoAdventurePausedByReputationEvent(false);
                setAutoAdventure(true);
              }
            }
          },
          setIsTurnBasedBattleOpen: (open: boolean) => {
            setIsTurnBasedBattleOpen(open);
            if (!open) {
              setTurnBasedBattleParams(null);
            }
          },
          handleTurnBasedBattleClose: (result, updatedInventory?) => {
            setIsTurnBasedBattleOpen(false);
            setTurnBasedBattleParams(null);
            handleBattleResult(result, updatedInventory);

            // 如果玩家死亡，清除自动历练暂停状态（死亡检测会处理）
            if (result && player) {
              const playerHpAfter = Math.max(
                0,
                player.hp - (result.hpLoss || 0)
              );
              if (playerHpAfter <= 0) {
                setAutoAdventurePausedByBattle(false);
              }
            } else {
              // 如果没有战斗结果或玩家不存在，也清除暂停状态
              setAutoAdventurePausedByBattle(false);
            }
            // 如果玩家还活着，useEffect 会自动恢复自动历练
          },
        }}
      />

      {/* 寿元将尽预警 */}
      {player && !isDead && player.lifespan < Math.max(5, (player.maxLifespan || 100) * 0.1) && (
        <>
          <div className="lifespan-warning" />
          <div className="lifespan-warning-text animate-pulse">
            ⚠️ 寿元将尽 (剩余 {player.lifespan.toFixed(1)} 年)
          </div>
        </>
      )}
    </>
  );
}

export default App;
