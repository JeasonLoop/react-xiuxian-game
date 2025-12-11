import React, { useState, useEffect, useCallback } from 'react';
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
import { useDelayedState } from './hooks/useDelayedState';

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
    isShopOpen,
    isDebugOpen,
    isBattleModalOpen,
    isTurnBasedBattleOpen,
    isMobileSidebarOpen,
    isMobileStatsOpen,
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
    setIsShopOpen,
    setIsDebugOpen,
    setIsBattleModalOpen,
    setIsTurnBasedBattleOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
    setIsDebugModeEnabled,
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
  const { purchaseSuccess, setPurchaseSuccess, lotteryRewards, setLotteryRewards } =
    notifications;
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
  const { value: itemActionLogValue, setValue: setItemActionLogRaw } = itemActionLog;

  // 使用 useDelayedState 管理 itemActionLog，自动清理 setTimeout
  const [delayedItemActionLog, setDelayedItemActionLog] = useDelayedState<{
    text: string;
    type: string;
  }>(3000);

  // 同步 delayedItemActionLog 到 itemActionLog
  useEffect(() => {
    setItemActionLogRaw(delayedItemActionLog);
  }, [delayedItemActionLog, setItemActionLogRaw]);

  // 包装 setItemActionLog，使用延迟状态管理
  const setItemActionLog = useCallback(
    (log: { text: string; type: string } | null) => {
      if (log) {
        setDelayedItemActionLog(log);
      } else {
        setItemActionLogRaw(null);
      }
    },
    [setDelayedItemActionLog, setItemActionLogRaw]
  );

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
  const [autoAdventurePausedByShop, setAutoAdventurePausedByShop] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(null);
  const [deathReason, setDeathReason] = useState('');

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

  const sectHandlers = useSectHandlers({
    player,
    setPlayer,
    addLog,
    setIsSectOpen,
    setPurchaseSuccess,
  });

  const achievementHandlers = useAchievementHandlers({
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
      // 只有在非自动模式下才打开战斗弹窗
      if (!autoAdventure) {
        battleHandlers.openBattleModal(replay);
      }
    },
    onOpenTurnBasedBattle: (params) => {
      setTurnBasedBattleParams(params);
      setIsTurnBasedBattleOpen(true);
    },
    skipBattle: autoAdventure, // 自动历练模式下跳过战斗
    useTurnBasedBattle: true, // 使用新的回合制战斗系统
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

  // 涅槃重生功能
  const handleRebirth = () => {
    // 清除存档
    localStorage.removeItem(SAVE_KEY);

    // 重置所有状态
    setIsDead(false);
    setDeathBattleData(null);
    setDeathReason('');
    setLastBattleReplay(null);
    setAutoMeditate(false);
    setAutoAdventure(false);
    setPlayer(null);
    setLogs([]);
    setGameStarted(false);
    setHasSave(false); // 重要：更新 hasSave 状态，避免卡在加载存档页面

    // 触发页面刷新或返回开始页面
    // useGameState 的 handleStartGame 会处理新游戏
  };

  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

  const handleUseItem = itemHandlers.handleUseItem;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
  const handleBatchUse = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    // 获取所有要使用的物品
    const itemsToUse = itemIds
      .map((id) => player.inventory.find((item) => item.id === id))
      .filter(
        (item): item is (typeof player.inventory)[0] => item !== undefined
      );

    // 批量使用：逐个使用物品（使用延迟以避免状态更新冲突）
    for (const item of itemsToUse) {
      if (item.quantity > 0) {
        handleUseItem(item);
        // 添加小延迟以确保状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  };

  const handleBatchDiscard = (itemIds: string[]) => {
    setPlayer((prev) => {
      const newInv = prev.inventory.filter((i) => !itemIds.includes(i.id));
      addLog(`你批量丢弃了 ${itemIds.length} 件物品。`, 'normal');
      return { ...prev, inventory: newInv };
    });
  };

  const handleEquipItem = equipmentHandlers.handleEquipItem;
  const handleUnequipItem = equipmentHandlers.handleUnequipItem;
  const handleRefineNatalArtifact = equipmentHandlers.handleRefineNatalArtifact;
  const handleUnrefineNatalArtifact =
    equipmentHandlers.handleUnrefineNatalArtifact;

  const handleLearnArt = cultivationHandlers.handleLearnArt;
  const handleActivateArt = cultivationHandlers.handleActivateArt;

  const handleCraft = alchemyHandlers.handleCraft;

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;
  const handleAllocateAllAttributes = characterHandlers.handleAllocateAllAttributes;

  // 提取新的模块化 handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;

  const handleRefreshShop = (newItems: ShopItem[]) => {
    if (!currentShop || !player) return;
    if (player.spiritStones < 100) {
      addLog('灵石不足，无法刷新商店。', 'danger');
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
        spiritStones: prev.spiritStones - 100, // 扣除刷新费用
      };
    });
    addLog('商店物品已刷新！', 'special');
  };
  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleDeactivatePet = petHandlers.handleDeactivatePet;
  const handleFeedPet = petHandlers.handleFeedPet;
  const handleBatchFeedItems = petHandlers.handleBatchFeedItems;
  const handleEvolvePet = petHandlers.handleEvolvePet;
  const handleReleasePet = petHandlers.handleReleasePet;
  const handleBatchReleasePets = petHandlers.handleBatchReleasePets;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;
  const handleSectTask = sectHandlers.handleSectTask;
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
  const handleEnterRealm = realmHandlers.handleEnterRealm;
  // 冒险行为由 useAdventureHandlers 提供的 handleAdventure 实现

  // Reactive Level Up Check
  useEffect(() => {
    if (player && player.exp >= player.maxExp) {
      breakthroughHandlers.handleBreakthrough();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.exp, player?.maxExp]);

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
      <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50">
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

      <ModalsContainer
        player={player}
        settings={settings}
        setItemActionLog={setItemActionLog}
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
          isShopOpen,
          isBattleModalOpen: isBattleModalOpen && !isDead, // 死亡时不显示战斗弹窗
          isTurnBasedBattleOpen: isTurnBasedBattleOpen && !isDead,
        }}
        modalState={{
          currentShop,
          itemToUpgrade,
          battleReplay,
          revealedBattleRounds,
          turnBasedBattleParams,
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
          handleEnterRealm,
          handleSelectTalent,
          handleSelectTitle,
          handleAllocateAttribute,
          handleAllocateAllAttributes,
          handleUseInheritance,
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
          handleEvolvePet,
          handleReleasePet,
          handleBatchReleasePets,
          handleDraw,
          handleUpdateSettings,
          handleRestartGame: handleRebirth,
          handleBuyItem,
          handleSellItem,
          handleRefreshShop,
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
          },
        }}
      />
    </>
  );
}

export default App;
