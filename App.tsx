import React, { useState, useEffect } from 'react';
import { Item, Shop, ShopItem, ShopType, EquipmentSlot } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import DeathModal from './components/DeathModal';
import { BattleReplay } from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { SAVE_KEY } from './utils/gameUtils';

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

  const [isInventoryOpen, setIsInventoryOpen] = useState(false); // 背包是否打开
  const [isCultivationOpen, setIsCultivationOpen] = useState(false); // 功法是否打开
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false); // 炼丹是否打开
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false); // 法宝强化是否打开
  const [isSectOpen, setIsSectOpen] = useState(false); // 宗门是否打开
  const [isRealmOpen, setIsRealmOpen] = useState(false); // 秘境是否打开
  const [isCharacterOpen, setIsCharacterOpen] = useState(false); // 角色是否打开
  const [isAchievementOpen, setIsAchievementOpen] = useState(false); // 成就是否打开
  const [isPetOpen, setIsPetOpen] = useState(false); // 灵宠是否打开
  const [isLotteryOpen, setIsLotteryOpen] = useState(false); // 抽奖是否打开
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 设置是否打开
  const [isShopOpen, setIsShopOpen] = useState(false); // 商店是否打开
  const [currentShop, setCurrentShop] = useState<Shop | null>(null); // 当前商店
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null); // 当前升级物品
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    item: string; // 购买物品名称
    quantity: number; // 购买物品数量
  } | null>(null); // 购买成功
  const [lotteryRewards, setLotteryRewards] = useState<
    Array<{ type: string; name: string; quantity?: number }>
  >([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [battleReplay, setBattleReplay] = useState<BattleReplay | null>(null);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [revealedBattleRounds, setRevealedBattleRounds] = useState(0);

  const [loading, setLoading] = useState(false); // 加载状态
  const [cooldown, setCooldown] = useState(0); // 冷却时间
  const [itemActionLog, setItemActionLog] = useState<{
    text: string;
    type: string;
  } | null>(null); // 物品操作轻提示
  const [autoMeditate, setAutoMeditate] = useState(false); // 自动打坐
  const [autoAdventure, setAutoAdventure] = useState(false); // 自动历练
  const [autoAdventurePausedByShop, setAutoAdventurePausedByShop] = useState(false); // 自动历练是否因商店暂停
  const [isDead, setIsDead] = useState(false); // 是否死亡
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(
    null
  ); // 死亡时的战斗数据
  const [deathReason, setDeathReason] = useState(''); // 死亡原因
  const [lastBattleReplay, setLastBattleReplay] = useState<BattleReplay | null>(
    null
  ); // 最近的战斗数据

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
    skipBattle: autoAdventure, // 自动历练模式下跳过战斗
  });

  // 从 handlers 中提取函数
  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;

  // 检测死亡
  useEffect(() => {
    if (!player || isDead) return;

    if (player.hp <= 0) {
      // 检查是否有保命装备
      let reviveItem: Item | null = null;
      let reviveSlot: EquipmentSlot | null = null;

      // 遍历所有装备槽位，查找有保命机会的装备
      for (const [slot, itemId] of Object.entries(player.equippedItems)) {
        if (!itemId) continue;
        const item = player.inventory.find(i => i.id === itemId);
        if (item && item.reviveChances && item.reviveChances > 0) {
          reviveItem = item;
          reviveSlot = slot as EquipmentSlot;
          break;
        }
      }

      if (reviveItem && reviveSlot) {
        // 有保命装备，消耗一次保命机会并复活
        setPlayer((prev) => {
          if (!prev) return prev;

          const newInventory = prev.inventory.map(item => {
            if (item.id === reviveItem!.id) {
              const newChances = (item.reviveChances || 0) - 1;
              addLog(
                `💫 ${item.name}的保命之力被触发！你留下一口气，从死亡边缘被拉了回来。剩余保命机会：${newChances}次`,
                'special'
              );
              return {
                ...item,
                reviveChances: newChances,
              };
            }
            return item;
          });

          // 如果保命机会用完了，从装备栏移除
          const updatedItem = newInventory.find(i => i.id === reviveItem!.id);
          const newEquippedItems = { ...prev.equippedItems };
          if (updatedItem && (!updatedItem.reviveChances || updatedItem.reviveChances <= 0)) {
            delete newEquippedItems[reviveSlot!];
            addLog(`⚠️ ${reviveItem!.name}的保命之力已耗尽，自动卸下。`, 'danger');
          }

          // 复活：恢复10%最大气血
          const reviveHp = Math.max(1, Math.floor(prev.maxHp * 0.1));

          return {
            ...prev,
            inventory: newInventory,
            equippedItems: newEquippedItems,
            hp: reviveHp,
          };
        });
        return; // 不触发死亡
      }

      // 没有保命装备，正常死亡
      setIsDead(true);
      setDeathBattleData(lastBattleReplay);
      localStorage.removeItem(SAVE_KEY);

      // 关闭战斗弹窗（如果打开的话）
      setIsBattleModalOpen(false);

      // 生成死亡原因
      let reason = '';
      if (lastBattleReplay && !lastBattleReplay.victory) {
        reason = `在与${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}的战斗中，你力竭而亡。`;
      } else if (lastBattleReplay) {
        reason = `虽然战胜了${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}，但你伤势过重，最终不治身亡。`;
      } else {
        reason = '你在历练途中遭遇不测，伤势过重，最终不治身亡。';
      }
      setDeathReason(reason);

      // 停止自动功能
      setAutoMeditate(false);
      setAutoAdventure(false);
    }
  }, [player?.hp, isDead, lastBattleReplay, addLog]);

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

    // 触发页面刷新或返回开始页面
    // useGameState 的 handleStartGame 会处理新游戏
  };

  const handleMeditate = () => {
    if (loading || cooldown > 0 || !player) return;
    meditationHandlers.handleMeditate();
    setCooldown(1);
  };

  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

  const handleUseItem = itemHandlers.handleUseItem;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
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

  // 提取新的模块化 handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;

  const handleRefreshShop = (newItems: ShopItem[]) => {
    if (!currentShop) return;
    setCurrentShop({
      ...currentShop,
      items: newItems,
    });
    setPlayer((prev) => ({
      ...prev,
      spiritStones: prev.spiritStones - 100, // 扣除刷新费用
    }));
    addLog('商店物品已刷新！', 'special');
  };
  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleFeedPet = petHandlers.handleFeedPet;
  const handleEvolvePet = petHandlers.handleEvolvePet;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;
  const handleSectTask = sectHandlers.handleSectTask;
  const handleSectPromote = sectHandlers.handleSectPromote;
  const handleSectBuy = sectHandlers.handleSectBuy;
  const checkAchievements = achievementHandlers.checkAchievements;

  // Passive Regeneration logic - 优化：使用 useRef 避免依赖变化导致定时器重建
  useEffect(() => {
    if (!player) return; // 如果 player 为 null，不执行定时器

    const timer = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return prev; // 防止 prev 为 null

        // 计算基础回血量（不再使用打坐加成，因为打坐时已经直接回血了）
        const baseRegen = Math.max(1, Math.floor(prev.maxHp * 0.01));

        if (prev.hp < prev.maxHp) {
          return {
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + baseRegen),
          };
        }

        return prev;
      });
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [player]); // 移除 cooldown 依赖，避免频繁重建定时器

  // 自动打坐逻辑
  useEffect(() => {
    if (!autoMeditate || !player || loading || cooldown > 0) return;

    const timer = setTimeout(() => {
      if (autoMeditate && !loading && cooldown === 0 && player) {
        if (loading || cooldown > 0 || !player) return;
        meditationHandlers.handleMeditate();
        setCooldown(1);
      }
    }, 100); // 短暂延迟，确保状态更新完成

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMeditate, player, loading, cooldown]);

  // 自动历练逻辑
  useEffect(() => {
    if (!autoAdventure || !player || loading || cooldown > 0 || isShopOpen) return;
    // if (player.hp < player.maxHp * 0.2) {
    //   // 如果血量过低，停止自动历练
    //   setAutoAdventure(false);
    //   addLog('你身受重伤，自动历练已停止。请先打坐疗伤。', 'danger');
    //   return;
    // }

    // 生死有命！富贵在天！！！
    const timer = setTimeout(() => {
      if (autoAdventure && !loading && cooldown === 0 && player) {
        handleAdventure();
      }
    }, 100); // 短暂延迟，确保状态更新完成

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdventure, player, loading, cooldown]);

  // 从冒险 handlers 中提取函数
  const { handleAdventure, executeAdventure } = adventureHandlers;

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
        onStart={() => setShowWelcome(false)}
        onContinue={() => {
          // 继续游戏：跳过欢迎界面和取名界面，直接进入游戏
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
          onRebirth={handleRebirth}
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
        itemActionLog={itemActionLog}
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
          onOpenStats: () => setIsMobileStatsOpen(true),
          onUpdateViewedAchievements: () => {
            setPlayer((prev) => ({
              ...prev,
              viewedAchievements: [...prev.achievements],
            }));
          },
          autoMeditate,
          autoAdventure,
          onToggleAutoMeditate: () => setAutoMeditate((prev) => !prev),
          onToggleAutoAdventure: () => setAutoAdventure((prev) => !prev),
        }}
      />

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
        }}
        modalState={{
          currentShop,
          itemToUpgrade,
          battleReplay,
          revealedBattleRounds,
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
          handleUseInheritance,
          handleUpdateViewedAchievements: () => {
            setPlayer((prev) => ({
              ...prev,
              viewedAchievements: [...prev.achievements],
            }));
          },
          handleActivatePet,
          handleFeedPet,
          handleEvolvePet,
          handleDraw,
          handleUpdateSettings,
          handleBuyItem,
          handleSellItem,
          handleRefreshShop,
        }}
      />
    </>
  );
}

export default App;
