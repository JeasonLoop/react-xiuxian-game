import React, { useMemo } from 'react';
import { PlayerStats, LogEntry, GameSettings } from '../types';
import StatsPanel from '../components/StatsPanel';
import LogPanel from '../components/LogPanel';
import CombatVisuals from '../components/CombatVisuals';
import MobileSidebar from '../components/MobileSidebar';
import GameHeader from './GameHeader';
import ActionBar from './ActionBar';
import { PurchaseSuccessToast, LotteryRewardsToast } from './NotificationToast';

/**
 * 游戏视图组件
 * 包含游戏头部、操作按钮栏、日志面板、属性面板、移动端侧边栏
 * 游戏头部：包含游戏标题、菜单按钮、桌面按钮
 * 操作按钮栏：包含打坐、历练、秘境、炼丹、宗门五个按钮
 * 日志面板：包含游戏日志
 * 属性面板：包含玩家属性
 * 移动端侧边栏：包含功法、储物袋、角色、成就、灵宠、抽奖、设置七个按钮
 * 功法按钮：打开功法面板
 * 储物袋按钮：打开储物袋面板
 * 角色按钮：打开角色面板
 * 成就按钮：打开成就面板
 * 灵宠按钮：打开灵宠面板
 * 抽奖按钮：打开抽奖面板
 * 设置按钮：打开设置面板
 */

interface GameViewProps {
  player: PlayerStats;
  logs: LogEntry[];
  visualEffects: any[];
  loading: boolean;
  cooldown: number;
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
  isMobileSidebarOpen: boolean;
  isMobileStatsOpen: boolean;
  modals: {
    isInventoryOpen: boolean;
    isCultivationOpen: boolean;
    isCharacterOpen: boolean;
    isAchievementOpen: boolean;
    isPetOpen: boolean;
    isLotteryOpen: boolean;
    isSettingsOpen: boolean;
    isRealmOpen: boolean;
    isAlchemyOpen: boolean;
    isSectOpen: boolean;
    setIsMobileSidebarOpen: (open: boolean) => void;
    setIsMobileStatsOpen: (open: boolean) => void;
    setIsInventoryOpen: (open: boolean) => void;
    setIsCultivationOpen: (open: boolean) => void;
    setIsCharacterOpen: (open: boolean) => void;
    setIsAchievementOpen: (open: boolean) => void;
    setIsPetOpen: (open: boolean) => void;
    setIsLotteryOpen: (open: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setIsRealmOpen: (open: boolean) => void;
    setIsAlchemyOpen: (open: boolean) => void;
    setIsSectOpen: (open: boolean) => void;
  };
  handlers: {
    onMeditate: () => void;
    onAdventure: () => void;
    onOpenRealm: () => void;
    onOpenAlchemy: () => void;
    onOpenSect: () => void;
    onOpenMenu: () => void;
    onOpenCultivation: () => void;
    onOpenInventory: () => void;
    onOpenCharacter: () => void;
    onOpenAchievement: () => void;
    onOpenPet: () => void;
    onOpenLottery: () => void;
    onOpenSettings: () => void;
    onOpenStats: () => void;
    onUpdateViewedAchievements: () => void;
  };
}

function GameView({
  player,
  logs,
  visualEffects,
  loading,
  cooldown,
  purchaseSuccess,
  lotteryRewards,
  isMobileSidebarOpen,
  isMobileStatsOpen,
  modals,
  handlers,
}: GameViewProps) {
  // 缓存成就数量计算
  const achievementCount = useMemo(
    () => player.achievements.filter(
      (a) => !player.viewedAchievements.includes(a)
    ).length,
    [player.achievements, player.viewedAchievements]
  );

  const petCount = useMemo(
    () => player.pets.length,
    [player.pets.length]
  );

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-900 text-stone-200 overflow-hidden relative">
      {/* Visual Effects Layer */}
      <CombatVisuals effects={visualEffects} />

      <div className="hidden md:block">
        <StatsPanel player={player} />
      </div>

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <GameHeader
          player={player}
          onOpenMenu={handlers.onOpenMenu}
          onOpenCultivation={handlers.onOpenCultivation}
          onOpenInventory={handlers.onOpenInventory}
          onOpenCharacter={handlers.onOpenCharacter}
          onOpenAchievement={handlers.onOpenAchievement}
          onOpenPet={handlers.onOpenPet}
          onOpenLottery={handlers.onOpenLottery}
          onOpenSettings={handlers.onOpenSettings}
        />

        <LogPanel logs={logs} className="pb-[23rem] md:pb-0" />

        <ActionBar
          loading={loading}
          cooldown={cooldown}
          onMeditate={handlers.onMeditate}
          onAdventure={handlers.onAdventure}
          onOpenRealm={handlers.onOpenRealm}
          onOpenAlchemy={handlers.onOpenAlchemy}
          onOpenSect={handlers.onOpenSect}
        />
      </main>

      {/* Notifications */}
      {purchaseSuccess && (
        <PurchaseSuccessToast
          item={purchaseSuccess.item}
          quantity={purchaseSuccess.quantity}
        />
      )}
      <LotteryRewardsToast rewards={lotteryRewards} />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => modals.setIsMobileSidebarOpen(false)}
        onOpenStats={handlers.onOpenStats}
        onOpenCultivation={handlers.onOpenCultivation}
        onOpenInventory={handlers.onOpenInventory}
        onOpenCharacter={handlers.onOpenCharacter}
        onOpenAchievement={handlers.onOpenAchievement}
        onOpenPet={handlers.onOpenPet}
        onOpenLottery={handlers.onOpenLottery}
        onOpenSettings={handlers.onOpenSettings}
        achievementCount={achievementCount}
        petCount={petCount}
        lotteryTickets={lotteryTickets}
      />

      {isMobileStatsOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-[70] p-0 md:hidden touch-manipulation"
          onClick={() => modals.setIsMobileStatsOpen(false)}
        >
          <div
            className="bg-paper-800 w-full h-[80vh] rounded-t-2xl border border-stone-700 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StatsPanel player={player} />
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(GameView);

