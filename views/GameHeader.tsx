import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Backpack,
  Star,
  Trophy,
  Sparkles,
  Gift,
  Settings,
  Menu,
  Bug,
  Calendar,
} from 'lucide-react';
import { PlayerStats } from '../types';

/**
 * 游戏头部组件
 * 包含游戏标题、菜单按钮、桌面按钮
 * 菜单按钮：打开移动端侧边栏
 * 桌面按钮：包含功法、储物袋、角色、成就、灵宠、抽奖、设置七个按钮
 * 功法按钮：打开功法面板
 * 储物袋按钮：打开储物袋面板
 * 角色按钮：打开角色面板
 * 成就按钮：打开成就面板
 * 灵宠按钮：打开灵宠面板
 * 抽奖按钮：打开抽奖面板
 * 设置按钮：打开设置面板
 */

interface GameHeaderProps {
  player: PlayerStats;
  onOpenMenu: () => void;
  onOpenCultivation: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenAchievement: () => void;
  onOpenPet: () => void;
  onOpenLottery: () => void;
  onOpenSettings: () => void;
  onOpenDailyQuest?: () => void;
  onOpenDebug?: () => void;
  isDebugModeEnabled?: boolean;
}

function GameHeader({
  player,
  onOpenMenu,
  onOpenCultivation,
  onOpenInventory,
  onOpenCharacter,
  onOpenAchievement,
  onOpenPet,
  onOpenLottery,
  onOpenSettings,
  onOpenDailyQuest,
  onOpenDebug,
  isDebugModeEnabled = false,
}: GameHeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appVersion = import.meta.env.VITE_APP_VERSION || '0.1.9';

  const newAchievements = useMemo(
    () =>
      player.achievements.filter((a) => !player.viewedAchievements.includes(a)),
    [player.achievements, player.viewedAchievements]
  );

  const newAchievementsCount = useMemo(
    () => newAchievements.length,
    [newAchievements.length]
  );

  const petsCount = useMemo(() => player.pets.length, [player.pets.length]);

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  const dailyQuestCompletedCount = useMemo(
    () => (player.dailyQuests || []).filter((q) => q.completed).length,
    [player.dailyQuests]
  );

  // 处理游戏名称点击
  const handleTitleClick = () => {
    // 清除之前的超时
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 如果达到5次，启用调试模式
    if (newCount >= 5) {
      const DEBUG_MODE_KEY = 'xiuxian-debug-mode';
      localStorage.setItem(DEBUG_MODE_KEY, 'true');
      setClickCount(0);
      // 触发页面刷新以应用调试模式
      window.location.reload();
    } else {
      // 设置超时，2秒内没有继续点击则重置计数
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  // 清理超时
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="bg-paper-800 p-2 md:p-4 border-b border-stone-700 flex justify-between items-center shadow-lg z-10">
      <div className="flex items-center gap-3">
        <h1
          onClick={handleTitleClick}
          className="text-base md:text-xl font-serif text-mystic-gold tracking-widest cursor-pointer select-none hover:opacity-80 transition-opacity"
          title={
            clickCount > 0 ? `点击 ${5 - clickCount} 次进入调试模式` : undefined
          }
        >
          云灵修仙
        </h1>
        <span
          className="text-xs md:text-sm text-stone-400 font-mono px-2 py-1 bg-stone-800 rounded border border-stone-700"
          title="当前版本"
        >
          v{appVersion}
        </span>
      </div>
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenMenu}
        className="md:hidden flex items-center justify-center w-12 h-12 bg-ink-800 active:bg-stone-700 rounded border border-stone-600 touch-manipulation"
      >
        <Menu size={24} className="text-stone-200" />
      </button>
      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-2 flex-wrap">
        <button
          onClick={onOpenCultivation}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <BookOpen size={18} />
          <span>功法</span>
        </button>
        <button
          onClick={onOpenInventory}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Backpack size={18} />
          <span>储物袋</span>
        </button>
        <button
          onClick={onOpenCharacter}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Star size={18} />
          <span>角色</span>
        </button>
        <button
          onClick={onOpenAchievement}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
        >
          <Trophy size={18} />
          <span>成就</span>
          {newAchievementsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {newAchievementsCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenPet}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Sparkles size={18} />
          <span>灵宠</span>
          {petsCount > 0 && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
              {petsCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenLottery}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Gift size={18} />
          <span>抽奖</span>
          {lotteryTickets > 0 && (
            <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">
              {lotteryTickets}
            </span>
          )}
        </button>
        {onOpenDailyQuest && (
          <button
            onClick={onOpenDailyQuest}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
          >
            <Calendar size={18} />
            <span>日常</span>
            {dailyQuestCompletedCount > 0 && (player.dailyQuests || []).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dailyQuestCompletedCount}/{(player.dailyQuests || []).length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Settings size={18} />
          <span>设置</span>
        </button>
        {isDebugModeEnabled && onOpenDebug && (
          <button
            onClick={onOpenDebug}
            className="flex items-center gap-2 px-3 py-2 bg-red-800 hover:bg-red-700 rounded border border-red-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            title="调试模式"
          >
            <Bug size={18} />
            <span>调试</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default React.memo(GameHeader);
