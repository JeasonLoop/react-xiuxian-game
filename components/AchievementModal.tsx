import React from 'react';
import { X, Trophy, Star } from 'lucide-react';
import { PlayerStats, Achievement } from '../types';
import { ACHIEVEMENTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
}

const AchievementModal: React.FC<Props> = ({ isOpen, onClose, player }) => {
  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '普通':
        return 'text-gray-400 border-gray-600';
      case '稀有':
        return 'text-blue-400 border-blue-600';
      case '传说':
        return 'text-purple-400 border-purple-600';
      case '仙品':
        return 'text-yellow-400 border-yellow-600';
      default:
        return 'text-gray-400 border-gray-600';
    }
  };

  const getRequirementTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      realm: '境界',
      kill: '击杀',
      collect: '收集',
      meditate: '打坐',
      adventure: '历练',
      equip: '装备',
      pet: '灵宠',
      recipe: '丹方',
      art: '功法',
      breakthrough: '突破',
      secret_realm: '秘境',
      lottery: '抽奖',
      custom: '特殊',
    };
    return typeMap[type] || type;
  };

  const getRequirementText = (achievement: Achievement) => {
    const typeText = getRequirementTypeText(achievement.requirement.type);
    if (achievement.requirement.type === 'realm' && achievement.requirement.target) {
      return `达到${achievement.requirement.target}`;
    }
    return `${typeText} ${achievement.requirement.value}${getRequirementUnit(achievement.requirement.type)}`;
  };

  const getRequirementUnit = (type: string) => {
    const unitMap: Record<string, string> = {
      kill: '个敌人',
      collect: '种物品',
      meditate: '次',
      adventure: '次',
      equip: '件',
      pet: '个',
      recipe: '个',
      art: '种',
      breakthrough: '次',
      secret_realm: '次',
      lottery: '次',
    };
    return unitMap[type] || '';
  };

  const completedAchievements = ACHIEVEMENTS.filter((a) =>
    player.achievements.includes(a.id)
  );
  const incompleteAchievements = ACHIEVEMENTS.filter(
    (a) => !player.achievements.includes(a.id)
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="z-50 sticky top-0 bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Trophy className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
            成就系统
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-center">
            <p className="text-stone-400">
              已完成: {completedAchievements.length} / {ACHIEVEMENTS.length}
            </p>
          </div>

          {/* 已完成的成就 */}
          {completedAchievements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 text-green-400">已达成</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`bg-stone-900 rounded p-4 border-2 ${getRarityColor(achievement.rarity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Trophy
                        className="text-yellow-400 flex-shrink-0 mt-1"
                        size={20}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{achievement.name}</span>
                          <span
                            className={`text-xs ${getRarityColor(achievement.rarity).split(' ')[0]}`}
                          >
                            ({achievement.rarity})
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-2">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-green-400">✓ 已完成</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 未完成的成就 */}
          {incompleteAchievements.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-stone-400">进行中</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incompleteAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-stone-900 rounded p-4 border border-stone-700 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <Star
                        className="text-stone-500 flex-shrink-0 mt-1"
                        size={20}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-stone-500">
                            {achievement.name}
                          </span>
                          <span className="text-xs text-stone-600">
                            ({achievement.rarity})
                          </span>
                        </div>
                        <p className="text-sm text-stone-500 mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-stone-600">
                          要求: {getRequirementText(achievement)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementModal;
