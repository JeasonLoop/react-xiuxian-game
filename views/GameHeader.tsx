import React, { useMemo } from 'react';
import {
  BookOpen,
  Backpack,
  Star,
  Trophy,
  Sparkles,
  Gift,
  Settings,
  Menu,
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
}: GameHeaderProps) {
  const newAchievements = useMemo(
    () => player.achievements.filter(
      (a) => !player.viewedAchievements.includes(a)
    ),
    [player.achievements, player.viewedAchievements]
  );

  const newAchievementsCount = useMemo(
    () => newAchievements.length,
    [newAchievements.length]
  );

  const petsCount = useMemo(
    () => player.pets.length,
    [player.pets.length]
  );

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  return (
    <header className="bg-paper-800 p-2 md:p-4 border-b border-stone-700 flex justify-between items-center shadow-lg z-10">
      <h1 className="text-base md:text-xl font-serif text-mystic-gold tracking-widest">
        云灵修仙
      </h1>
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
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <Settings size={18} />
          <span>设置</span>
        </button>
      </div>
    </header>
  );
}

export default React.memo(GameHeader);

