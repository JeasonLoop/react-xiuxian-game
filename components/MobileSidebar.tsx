import React, { useMemo, useCallback } from 'react';
import { Menu, X, BookOpen, Backpack, Star, Trophy, Sparkles, Gift, Settings, BarChart3 } from 'lucide-react';

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
  achievementCount?: number;
  petCount?: number;
  lotteryTickets?: number;
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
  onOpenSettings,
  achievementCount = 0,
  petCount = 0,
  lotteryTickets = 0,
}) => {
  const menuItems = useMemo(() => [
    { icon: BarChart3, label: '属性', onClick: onOpenStats, color: 'text-mystic-gold' },
    { icon: BookOpen, label: '功法', onClick: onOpenCultivation, color: 'text-blue-400' },
    { icon: Backpack, label: '储物袋', onClick: onOpenInventory, color: 'text-green-400' },
    { icon: Star, label: '角色', onClick: onOpenCharacter, color: 'text-yellow-400' },
    {
      icon: Trophy,
      label: '成就',
      onClick: onOpenAchievement,
      color: 'text-purple-400',
      badge: achievementCount > 0 ? achievementCount : undefined
    },
    {
      icon: Sparkles,
      label: '灵宠',
      onClick: onOpenPet,
      color: 'text-cyan-400',
      badge: petCount > 0 ? petCount : undefined
    },
    {
      icon: Gift,
      label: '抽奖',
      onClick: onOpenLottery,
      color: 'text-orange-400',
      badge: lotteryTickets > 0 ? lotteryTickets : undefined
    },
    { icon: Settings, label: '设置', onClick: onOpenSettings, color: 'text-stone-400' },
  ], [onOpenStats, onOpenCultivation, onOpenInventory, onOpenCharacter, onOpenAchievement, onOpenPet, onOpenLottery, onOpenSettings, achievementCount, petCount, lotteryTickets]);

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    onClose();
  }, [onClose]);

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
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.onClick)}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-ink-800 hover:bg-ink-700 active:bg-ink-600 rounded border border-stone-700 mb-2 transition-colors touch-manipulation min-h-[56px]"
                >
                  <Icon size={22} className={item.color} />
                  <span className="text-stone-200 font-medium flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
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

