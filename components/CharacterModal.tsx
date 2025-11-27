import React from 'react';
import { X, Star, Award } from 'lucide-react';
import { PlayerStats, Talent, Title } from '../types';
import { TALENTS, TITLES, RARITY_MULTIPLIERS, ACHIEVEMENTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onSelectTalent: (talentId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onAllocateAttribute: (type: 'attack' | 'defense' | 'hp') => void;
  onUseInheritance?: () => void;
}

const CharacterModal: React.FC<Props> = ({ isOpen, onClose, player, onSelectTalent, onSelectTitle, onAllocateAttribute, onUseInheritance }) => {
  if (!isOpen) return null;

  const currentTalent = TALENTS.find(t => t.id === player.talentId);
  const currentTitle = TITLES.find(t => t.id === player.titleId);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '普通': return 'text-gray-400';
      case '稀有': return 'text-blue-400';
      case '传说': return 'text-purple-400';
      case '仙品': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">角色系统</h2>
          <button onClick={onClose} className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 传承系统 */}
          {player.inheritanceLevel > 0 && onUseInheritance && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded p-4 border-2 border-purple-500">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Star className="text-purple-400" size={20} />
                上古传承: {player.inheritanceLevel} 层
              </h3>
              <p className="text-sm text-stone-300 mb-3">
                使用传承可以直接突破境界，每次最多可突破4个境界。
              </p>
              <button
                onClick={onUseInheritance}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded border border-purple-400 font-bold text-white transition-all"
              >
                使用传承突破境界
              </button>
            </div>
          )}

          {/* 属性点分配 */}
          {player.attributePoints > 0 && (
            <div className="bg-stone-900 rounded p-4 border border-stone-700">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Star className="text-yellow-400" size={20} />
                可分配属性点: {player.attributePoints}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onAllocateAttribute('attack')}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700"
                >
                  攻击 +5
                </button>
                <button
                  onClick={() => onAllocateAttribute('defense')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700"
                >
                  防御 +3
                </button>
                <button
                  onClick={() => onAllocateAttribute('hp')}
                  className="px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700"
                >
                  气血 +20
                </button>
              </div>
            </div>
          )}

          {/* 天赋显示（不可修改） */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Star className="text-purple-400" size={20} />
              天赋
            </h3>
            {currentTalent ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${getRarityColor(currentTalent.rarity)}`}>
                        {currentTalent.name}
                      </span>
                      <span className="text-xs text-stone-500">({currentTalent.rarity})</span>
                    </div>
                    <p className="text-sm text-stone-400 mb-2">{currentTalent.description}</p>
                    <div className="text-xs text-stone-500 italic">
                      * 天赋在游戏开始时随机生成，之后不可修改
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-900 rounded p-4 border border-stone-700">
                <p className="text-stone-500">未选择天赋</p>
              </div>
            )}
          </div>

          {/* 称号系统 */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Award className="text-yellow-400" size={20} />
              称号
            </h3>
            {currentTitle ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-yellow-400">{currentTitle.name}</span>
                    </div>
                    <p className="text-sm text-stone-400 mb-1">{currentTitle.description}</p>
                    <p className="text-xs text-stone-500">获得条件: {currentTitle.requirement}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 mb-3">
                <p className="text-stone-500">未获得称号</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {TITLES.filter(t => t.id !== player.titleId && player.achievements.some(a => {
                const achievement = ACHIEVEMENTS.find(ach => ach.id === a);
                return achievement?.reward?.titleId === t.id;
              })).map(title => (
                <button
                  key={title.id}
                  onClick={() => onSelectTitle(title.id)}
                  className="text-left bg-stone-900 hover:bg-stone-700 rounded p-3 border border-stone-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-yellow-400">{title.name}</span>
                      <p className="text-sm text-stone-400 mt-1">{title.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterModal;

