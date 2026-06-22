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
  Home,
  Users,
  CloudUpload,
  Lock,
} from 'lucide-react';
import { PlayerStats } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { ACHIEVEMENTS } from '../constants';
import { isFeatureUnlocked, FeatureId, getFeatureRequirementText } from '../constants/featureUnlock';
import { REALM_ORDER } from '../constants/index';
import { useParty } from '../hooks/useParty';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { showSuccess, showError } from '../utils/toastUtils';
import { isDebugFeatureAvailable } from '../utils/debugMode';

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
  onOpenGrotto?: () => void;
  onOpenLeaderboard?: () => void;
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
  onOpenGrotto,
  onOpenLeaderboard,
  onOpenDebug,
  isDebugModeEnabled = false,
}: GameHeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appVersion = import.meta.env.VITE_APP_VERSION || '-';
  const canUseDebugFeature = isDebugFeatureAvailable();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleSaveToCloud = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (saving) return;
    const state = useGameStore.getState();
    if (!state.player) {
      showError('没有找到存档数据！请先开始游戏。');
      return;
    }
    setSaving(true);
    try {
      await cloudSaveService.pushSave({
        player: state.player,
        logs: state.logs,
        timestamp: Date.now(),
      });
      showSuccess('云端存档保存成功！');
    } catch (err) {
      showError(err instanceof Error ? err.message : '云端存档保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 使用PartyKit连接获取在线人数
  const { onlineCount } = useParty('global');

  const newAchievements = useMemo(
    () =>
      Array.isArray(player.achievements) &&
      Array.isArray(player.viewedAchievements)
        ? player.achievements.filter(
            (a) => !player.viewedAchievements.includes(a)
          )
        : [],
    [player.achievements, player.viewedAchievements]
  );

  const newAchievementsCount = useMemo(
    () => newAchievements.length,
    [newAchievements.length]
  );

  const petsCount = useMemo(
    () => (Array.isArray(player.pets) ? player.pets.length : 0),
    [player.pets]
  );

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  // 境界解锁辅助：生成锁定按钮的样式和属性
  const lockedBtnClass =
    'opacity-40 cursor-not-allowed bg-stone-900 border-stone-800';

  const LockedFeatureBtn = ({
    locked,
    requirement,
    onClick,
    className,
    children,
  }: {
    locked: boolean;
    requirement: string;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
  }) => {
    if (locked) {
      return (
        <div
          className={`flex items-center gap-1 px-3 py-2 rounded border text-sm min-w-[44px] min-h-[44px] justify-center relative group ${lockedBtnClass} ${className || ''}`}
          title={requirement}
        >
          <Lock size={12} className="absolute top-0.5 right-0.5 text-stone-600" />
          {children}
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-stone-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {requirement}
          </span>
        </div>
      );
    }
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center ${className || ''}`}
      >
        {children}
      </button>
    );
  };

  const dailyQuestCompletedCount = useMemo(
    () => (player.dailyQuests || []).filter((q) => q.completed).length,
    [player.dailyQuests]
  );

  // 处理游戏名称点击
  const handleTitleClick = () => {
    if (!canUseDebugFeature) return;

    // 清除之前的超时
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 如果达到5次，启用调试模式
    if (newCount >= 5) {
      localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, 'true');
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
    <header className="bg-paper-800 p-2 md:p-4 border-b border-stone-700 flex justify-between items-center shadow-lg z-50 fixed top-0 left-0 right-0 safe-area-header md:static md:w-auto">
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
        <div className="flex items-center gap-2">
          <span
            className="text-xs md:text-sm text-stone-400 font-mono px-2 py-1 bg-stone-800 rounded border border-stone-700"
            title="当前版本"
          >
            v{appVersion}
          </span>
          {/* 当前目标提示 */}
          {(() => {
            const idx = REALM_ORDER.indexOf(player.realm);
            if (idx < REALM_ORDER.length - 1) {
              const next = REALM_ORDER[idx + 1];
              return <span className="hidden md:inline text-[10px] text-stone-600 bg-stone-800/50 px-2 py-1 rounded">下一境界：{next}</span>;
            }
            return null;
          })()}
          {onlineCount > 0 && (
            <span
              className="text-xs md:text-sm text-green-400 font-mono px-2 py-1 bg-green-900/30 rounded border border-green-700 flex items-center gap-1"
              title="当前在线人数"
            >
              <Users size={12} />
              {onlineCount}
            </span>
          )}
        </div>
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
        <LockedFeatureBtn
          locked={!isFeatureUnlocked(FeatureId.CULTIVATION_ARTS, player.realm)}
          requirement={getFeatureRequirementText(FeatureId.CULTIVATION_ARTS)}
          onClick={onOpenCultivation}
        >
          <BookOpen size={18} />
          <span>功法</span>
        </LockedFeatureBtn>
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
        <LockedFeatureBtn
          locked={!isFeatureUnlocked(FeatureId.ACHIEVEMENT, player.realm)}
          requirement={getFeatureRequirementText(FeatureId.ACHIEVEMENT)}
          onClick={onOpenAchievement}
          className="relative"
        >
          <Trophy size={18} />
          <span>成就</span>
          {!isFeatureUnlocked(FeatureId.ACHIEVEMENT, player.realm) ? null : (
            <>
              {ACHIEVEMENTS.length > 0 && (
                <span className="text-xs text-stone-500 ml-0.5">
                  {player.achievements.length}/{ACHIEVEMENTS.length}
                </span>
              )}
              {newAchievementsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {newAchievementsCount}
                </span>
              )}
            </>
          )}
        </LockedFeatureBtn>
        <LockedFeatureBtn
          locked={!isFeatureUnlocked(FeatureId.PET, player.realm)}
          requirement={getFeatureRequirementText(FeatureId.PET)}
          onClick={onOpenPet}
        >
          <Sparkles size={18} />
          <span>灵宠</span>
          {isFeatureUnlocked(FeatureId.PET, player.realm) && petsCount > 0 && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
              {petsCount}
            </span>
          )}
        </LockedFeatureBtn>
        <LockedFeatureBtn
          locked={!isFeatureUnlocked(FeatureId.LOTTERY, player.realm)}
          requirement={getFeatureRequirementText(FeatureId.LOTTERY)}
          onClick={onOpenLottery}
        >
          <Gift size={18} />
          <span>抽奖</span>
          {isFeatureUnlocked(FeatureId.LOTTERY, player.realm) && lotteryTickets > 0 && (
            <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">
              {lotteryTickets}
            </span>
          )}
        </LockedFeatureBtn>
        {onOpenDailyQuest && (
          <LockedFeatureBtn
            locked={!isFeatureUnlocked(FeatureId.DAILY_QUEST, player.realm)}
            requirement={getFeatureRequirementText(FeatureId.DAILY_QUEST)}
            onClick={onOpenDailyQuest}
            className="relative"
          >
            <Calendar size={18} />
            <span>日常</span>
            {isFeatureUnlocked(FeatureId.DAILY_QUEST, player.realm) && (player.dailyQuests || []).length > 0 && (
              <span
                className={`absolute -top-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                  dailyQuestCompletedCount === (player.dailyQuests || []).length
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-600 text-stone-300'
                }`}
              >
                {dailyQuestCompletedCount}/{(player.dailyQuests || []).length}
              </span>
            )}
          </LockedFeatureBtn>
        )}
        {onOpenGrotto && (
          <LockedFeatureBtn
            locked={!isFeatureUnlocked(FeatureId.GROTTO, player.realm)}
            requirement={getFeatureRequirementText(FeatureId.GROTTO)}
            onClick={onOpenGrotto}
          >
            <Home size={18} />
            <span>洞府</span>
            {isFeatureUnlocked(FeatureId.GROTTO, player.realm) && player.grotto && player.grotto.level > 0 && (
              <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                Lv.{player.grotto.level}
              </span>
            )}
          </LockedFeatureBtn>
        )}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-green-800 hover:bg-green-700 rounded border border-green-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center disabled:opacity-50"
            title="保存到云端"
          >
            <CloudUpload size={18} />
            <span>{saving ? '保存中…' : '保存'}</span>
          </button>
        )}
        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-yellow-600/50 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            title="排行榜"
          >
            <Trophy size={18} className="text-yellow-400" />
            <span>排行</span>
          </button>
        )}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-npc-relations'))}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
          title="人物志"
        >
          <Users size={18} />
          <span>人物</span>
          {player.socialRelations?.length > 0 && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
              {player.socialRelations.length}
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
        {canUseDebugFeature && isDebugModeEnabled && onOpenDebug && (
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
