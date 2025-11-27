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
      case '普通': return 'text-gray-400 border-gray-600';
      case '稀有': return 'text-blue-400 border-blue-600';
      case '传说': return 'text-purple-400 border-purple-600';
      case '仙品': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const completedAchievements = ACHIEVEMENTS.filter(a => player.achievements.includes(a.id));
  const incompleteAchievements = ACHIEVEMENTS.filter(a => !player.achievements.includes(a.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-stone-800 rounded-lg border border-stone-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Trophy className="text-yellow-400" size={24} />
            成就系统
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
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
                {completedAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`bg-stone-900 rounded p-4 border-2 ${getRarityColor(achievement.rarity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{achievement.name}</span>
                          <span className={`text-xs ${getRarityColor(achievement.rarity).split(' ')[0]}`}>
                            ({achievement.rarity})
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-2">{achievement.description}</p>
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
                {incompleteAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="bg-stone-900 rounded p-4 border border-stone-700 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <Star className="text-stone-500 flex-shrink-0 mt-1" size={20} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-stone-500">{achievement.name}</span>
                          <span className="text-xs text-stone-600">({achievement.rarity})</span>
                        </div>
                        <p className="text-sm text-stone-500 mb-2">{achievement.description}</p>
                        <p className="text-xs text-stone-600">
                          要求: {achievement.requirement.type} - {achievement.requirement.value}
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

