import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { PlayerStats, Achievement, ItemRarity } from '../types';
import { ACHIEVEMENTS } from '../constants/index';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
}

const AchievementModal: React.FC<Props> = ({ isOpen, onClose, player }) => {
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
    if (
      achievement.requirement.type === 'realm' &&
      achievement.requirement.target
    ) {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="成就系统"
      titleIcon={<Trophy className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />}
      size="3xl"
      height="lg"
    >
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
                className={`bg-stone-900 rounded p-4 border-2 ${getRarityBorder(achievement.rarity as ItemRarity)}`}
              >
                <div className="flex items-start gap-3">
                  <Trophy
                    className="text-yellow-400 shrink-0 mt-1"
                    size={20}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{achievement.name}</span>
                      <span
                        className={`text-xs ${getRarityTextColor(achievement.rarity as ItemRarity)}`}
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
                    className="text-stone-500 shrink-0 mt-1"
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
    </Modal>
  );
};

export default AchievementModal;
