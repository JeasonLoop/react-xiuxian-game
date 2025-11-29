import React, { useState, useEffect,} from 'react';
import {
  Item,
  Shop,
  ShopType,
} from './types';
import StartScreen from './components/StartScreen';
import {
  BattleReplay,
} from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';

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
    gameStarted, // 游戏是否开始
    player, // 玩家数据
    setPlayer, // 设置玩家数据
    settings, // 游戏设置
    setSettings, // 设置游戏设置
    logs, // 游戏日志
    setLogs, // 设置游戏日志
    handleStartGame, // 开始游戏
  } = useGameState();

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
  });

  const equipmentHandlers = useEquipmentHandlers({
    player,
    setPlayer,
    addLog,
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
      // 复用 shopHandlers 的逻辑
      shopHandlers.handleOpenShop(shopType);
    },
    onOpenBattleModal: (replay: BattleReplay) => {
      battleHandlers.openBattleModal(replay);
    },
  });

  // 从 handlers 中提取函数
  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;

  const handleMeditate = () => {
    if (loading || cooldown > 0 || !player) return;
    meditationHandlers.handleMeditate();
    setCooldown(1);
  };

  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

  const handleUseItem = itemHandlers.handleUseItem;
  const handleDiscardItem = itemHandlers.handleDiscardItem;

  const handleEquipItem = equipmentHandlers.handleEquipItem;
  const handleUnequipItem = equipmentHandlers.handleUnequipItem;
  const handleRefineNatalArtifact = equipmentHandlers.handleRefineNatalArtifact;
  const handleUnrefineNatalArtifact = equipmentHandlers.handleUnrefineNatalArtifact;

  const handleLearnArt = cultivationHandlers.handleLearnArt;
  const handleActivateArt = cultivationHandlers.handleActivateArt;

  const handleCraft = alchemyHandlers.handleCraft;

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;

  // 提取新的模块化 handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;
  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleFeedPet = petHandlers.handleFeedPet;
  const handleEvolvePet = petHandlers.handleEvolvePet;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
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
        if (prev.hp < prev.maxHp) {
          return {
            ...prev,
            hp: Math.min(
              prev.maxHp,
              prev.hp + Math.max(1, Math.floor(prev.maxHp * 0.01))
            ),
          };
        }
        return prev;
      });
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [player]); // 移除 cooldown 依赖，避免频繁重建定时器

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
  const handleUpgradeItem = (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number = 0
  ) => {
    equipmentHandlers.handleUpgradeItem(item, costStones, costMats, upgradeStones);
    // 不关闭弹窗，让用户可以继续强化
    // 弹窗会自动从 player.inventory 中获取最新的物品信息
  };

  // Sect handlers、Achievement、Pet、Lottery、Settings handlers 已全部移到对应模块

  // 检查成就（境界变化时）
  useEffect(() => {
    if (player) {
      checkAchievements();
    }
  }, [player?.realm, player?.realmLevel, checkAchievements]);

  // 显示开始界面
  if (!gameStarted || !player) {
    return <StartScreen onStart={handleStartGame} />;
  }

  return (
    <>
      <GameView
        player={player}
        logs={logs}
        visualEffects={visualEffects}
        loading={loading}
        cooldown={cooldown}
        purchaseSuccess={purchaseSuccess}
        lotteryRewards={lotteryRewards}
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
        }}
      />

      <ModalsContainer
        player={player}
        settings={settings}
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
          isBattleModalOpen,
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
            if (!open) setCurrentShop(null);
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
          handleRefineNatalArtifact,
          handleUnrefineNatalArtifact,
          handleUpgradeItem,
          handleLearnArt,
          handleActivateArt,
          handleCraft,
          handleJoinSect,
          handleLeaveSect,
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
        }}
      />
    </>
  );
}

export default App;
