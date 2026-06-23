import React, { useMemo, useCallback, useState } from 'react';
import {
  Menu,
  X,
  BookOpen,
  Backpack,
  Star,
  Trophy,
  Sparkles,
  Gift,
  Settings,
  BarChart3,
  Bug,
  Home,
  CloudUpload,
  Lock,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { showSuccess, showError } from '../utils/toastUtils';
import { isDebugFeatureAvailable } from '../utils/debugMode';
import { useUIStore } from '../store/uiStore';
import { isFeatureUnlocked, FeatureId, getFeatureRequirementText } from '../constants/featureUnlock';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenStats: () => void;
  onOpenCultivation: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenAchievement: () => void;
  onOpenPet: () => void;
  onOpenLottery: () => void;
  onOpenSettings: () => void;
  onOpenGrotto?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenDebug?: () => void;
  isDebugModeEnabled?: boolean;
  achievementCount?: number;
  petCount?: number;
  lotteryTickets?: number;
  player?: any; // 用于显示洞府等级
}

const MobileSidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenStats,
  onOpenCultivation,
  onOpenInventory,
  onOpenCharacter,
  onOpenAchievement,
  onOpenPet,
  onOpenLottery,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenGrotto,
  onOpenDebug,
  isDebugModeEnabled = false,
  achievementCount = 0,
  petCount = 0,
  lotteryTickets = 0,
  player,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [saving, setSaving] = useState(false);
  const canUseDebugFeature = isDebugFeatureAvailable();

  const handleSaveToCloud = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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
  }, [saving]);

  const menuItems = useMemo(
    () => [
      {
        icon: BarChart3,
        label: '属性',
        onClick: onOpenStats,
        color: 'text-mystic-gold',
      },
      {
        icon: BookOpen,
        label: '功法',
        onClick: onOpenCultivation,
        color: 'text-blue-400',
        locked: !isFeatureUnlocked(FeatureId.CULTIVATION_ARTS, player?.realm),
        requirement: getFeatureRequirementText(FeatureId.CULTIVATION_ARTS),
      },
      {
        icon: Backpack,
        label: '储物袋',
        onClick: onOpenInventory,
        color: 'text-green-400',
      },
      {
        icon: Store,
        label: '交易行',
        onClick: () => {
          useUIStore.getState().setMarketItems([]);
          useUIStore.getState().setModal('isTradeMarketOpen', true);
          window.dispatchEvent(new CustomEvent('open-trade-market'));
        },
        color: 'text-amber-400',
      },
      {
        icon: Star,
        label: '角色',
        onClick: onOpenCharacter,
        color: 'text-yellow-400',
      },
      {
        icon: Trophy,
        label: '成就',
        onClick: onOpenAchievement,
        color: 'text-purple-400',
        badge: achievementCount > 0 ? achievementCount : undefined,
        locked: !isFeatureUnlocked(FeatureId.ACHIEVEMENT, player?.realm),
        requirement: getFeatureRequirementText(FeatureId.ACHIEVEMENT),
      },
      {
        icon: Sparkles,
        label: '灵宠',
        onClick: onOpenPet,
        color: 'text-cyan-400',
        badge: petCount > 0 ? petCount : undefined,
        locked: !isFeatureUnlocked(FeatureId.PET, player?.realm),
        requirement: getFeatureRequirementText(FeatureId.PET),
      },
      {
        icon: Gift,
        label: '抽奖',
        onClick: onOpenLottery,
        color: 'text-orange-400',
        badge: lotteryTickets > 0 ? lotteryTickets : undefined,
        locked: !isFeatureUnlocked(FeatureId.LOTTERY, player?.realm),
        requirement: getFeatureRequirementText(FeatureId.LOTTERY),
      },
      ...(onOpenLeaderboard
        ? [
            {
              icon: Trophy,
              label: '排行',
              onClick: onOpenLeaderboard,
              color: 'text-yellow-400',
            },
          ]
        : []),
      ...(onOpenGrotto
        ? [
            {
              icon: Home,
              label: '洞府',
              onClick: onOpenGrotto,
              color: 'text-purple-400',
              badge: player?.grotto?.level > 0 ? `Lv.${player.grotto.level}` : undefined,
              locked: !isFeatureUnlocked(FeatureId.GROTTO, player?.realm),
              requirement: getFeatureRequirementText(FeatureId.GROTTO),
            },
          ]
        : []),
      ...(isAuthenticated
        ? [
            {
              icon: CloudUpload,
              label: saving ? '保存中…' : '保存',
              onClick: handleSaveToCloud,
              color: 'text-green-400',
              keepOpenOnClick: true,
            },
          ]
        : []),
      {
        icon: Settings,
        label: '设置',
        onClick: onOpenSettings,
        color: 'text-stone-400',
      },
      ...(canUseDebugFeature && isDebugModeEnabled && onOpenDebug
        ? [
            {
              icon: Bug,
              label: '调试',
              onClick: onOpenDebug,
              color: 'text-red-400',
            },
          ]
        : []),
    ],
    [
      onOpenStats,
      onOpenCultivation,
      onOpenInventory,
      onOpenCharacter,
      onOpenAchievement,
      onOpenPet,
      onOpenLottery,
      onOpenLeaderboard,
      onOpenSettings,
      onOpenGrotto,
      onOpenDebug,
      isDebugModeEnabled,
      achievementCount,
      petCount,
      lotteryTickets,
      player,
      isAuthenticated,
      canUseDebugFeature,
      saving,
      handleSaveToCloud,
    ]
  );

  const handleItemClick = useCallback(
    (onClick: () => void, keepOpenOnClick?: boolean) => {
      onClick();
      if (!keepOpenOnClick) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-paper-800 border-l border-stone-700 shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-ink-800">
            <h2 className="text-lg font-serif text-mystic-gold">功能菜单</h2>
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item: any, index: number) => {
              const Icon = item.icon;
              if (item.locked) {
                return (
                  <div
                    key={index}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-stone-900 rounded border border-stone-800 mb-2 min-h-[56px] opacity-40 relative"
                    title={item.requirement}
                  >
                    <Lock size={10} className="absolute top-1 right-2 text-stone-600" />
                    <Icon size={22} className="text-stone-600" />
                    <span className="text-stone-500 font-medium flex-1 text-left">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-stone-600">
                      {item.requirement}
                    </span>
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => handleItemClick(item.onClick, item.keepOpenOnClick)}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-ink-800 hover:bg-ink-700 active:bg-ink-600 rounded border border-stone-700 mb-2 transition-colors touch-manipulation min-h-[56px]"
                >
                  <Icon size={22} className={item.color} />
                  <span className="text-stone-200 font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span className={`text-white text-xs px-2 py-0.5 rounded font-bold ${
                      typeof item.badge === 'string' && item.badge.startsWith('Lv.')
                        ? 'bg-purple-500'
                        : 'bg-red-500 rounded-full w-6 h-6 flex items-center justify-center'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(MobileSidebar);
