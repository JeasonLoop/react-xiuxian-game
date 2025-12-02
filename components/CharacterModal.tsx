import React, { useState } from 'react';
import { X, Star, Award, Info, RotateCcw } from 'lucide-react';
import { PlayerStats, Talent, Title } from '../types';
import {
  TALENTS,
  TITLES,
  RARITY_MULTIPLIERS,
  ACHIEVEMENTS,
  CULTIVATION_ARTS,
} from '../constants';
import { getItemStats } from '../utils/itemUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onSelectTalent: (talentId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onAllocateAttribute: (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => void;
  onUseInheritance?: () => void;
  onResetAttributes?: () => void;
}

const CharacterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onSelectTalent,
  onSelectTitle,
  onAllocateAttribute,
  onUseInheritance,
  onResetAttributes,
}) => {
  if (!isOpen) return null;

  const [showAttributeDetails, setShowAttributeDetails] = useState(false);
  const currentTalent = TALENTS.find((t) => t.id === player.talentId);
  const currentTitle = TITLES.find((t) => t.id === player.titleId);

  // 计算属性来源
  const calculateAttributeSources = () => {
    const baseStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };

    // 天赋加成
    if (currentTalent) {
      baseStats.attack += currentTalent.effects.attack || 0;
      baseStats.defense += currentTalent.effects.defense || 0;
      baseStats.hp += currentTalent.effects.hp || 0;
      baseStats.spirit += currentTalent.effects.spirit || 0;
      baseStats.physique += currentTalent.effects.physique || 0;
      baseStats.speed += currentTalent.effects.speed || 0;
    }

    // 称号加成
    if (currentTitle) {
      baseStats.attack += currentTitle.effects.attack || 0;
      baseStats.defense += currentTitle.effects.defense || 0;
      baseStats.hp += currentTitle.effects.hp || 0;
      baseStats.spirit += currentTitle.effects.spirit || 0;
      baseStats.physique += currentTitle.effects.physique || 0;
      baseStats.speed += currentTitle.effects.speed || 0;
    }

    // 功法加成
    let artStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    player.cultivationArts.forEach((artId) => {
      const art = CULTIVATION_ARTS.find((a) => a.id === artId);
      if (art) {
        artStats.attack += art.effects.attack || 0;
        artStats.defense += art.effects.defense || 0;
        artStats.hp += art.effects.hp || 0;
        artStats.spirit += art.effects.spirit || 0;
        artStats.physique += art.effects.physique || 0;
        artStats.speed += art.effects.speed || 0;
      }
    });

    // 装备加成
    let equipmentStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    Object.values(player.equippedItems).forEach((itemId) => {
      const equippedItem = player.inventory.find((i) => i.id === itemId);
      if (equippedItem && equippedItem.effect) {
        const isNatal = equippedItem.id === player.natalArtifactId;
        const itemStats = getItemStats(equippedItem, isNatal);
        equipmentStats.attack += itemStats.attack;
        equipmentStats.defense += itemStats.defense;
        equipmentStats.hp += itemStats.hp;
        equipmentStats.spirit += itemStats.spirit;
        equipmentStats.physique += itemStats.physique;
        equipmentStats.speed += itemStats.speed;
      }
    });

    return {
      base: baseStats,
      talent: baseStats,
      title: currentTitle
        ? {
            attack: currentTitle.effects.attack || 0,
            defense: currentTitle.effects.defense || 0,
            hp: currentTitle.effects.hp || 0,
            spirit: currentTitle.effects.spirit || 0,
            physique: currentTitle.effects.physique || 0,
            speed: currentTitle.effects.speed || 0,
          }
        : { attack: 0, defense: 0, hp: 0, spirit: 0, physique: 0, speed: 0 },
      art: artStats,
      equipment: equipmentStats,
    };
  };

  const attributeSources = calculateAttributeSources();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '普通':
        return 'text-gray-400';
      case '稀有':
        return 'text-blue-400';
      case '传说':
        return 'text-purple-400';
      case '仙品':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
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
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">
            角色系统
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
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

          {/* 属性详情面板 */}
          <div className="bg-stone-900 rounded p-4 border border-stone-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Info className="text-blue-400" size={20} />
                角色属性
              </h3>
              <button
                onClick={() => setShowAttributeDetails(!showAttributeDetails)}
                className="text-xs text-stone-400 hover:text-stone-300"
              >
                {showAttributeDetails ? '隐藏详情' : '显示详情'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-stone-400">攻击:</span>{' '}
                <span className="text-red-400 font-bold">{player.attack}</span>
              </div>
              <div>
                <span className="text-stone-400">防御:</span>{' '}
                <span className="text-blue-400 font-bold">{player.defense}</span>
              </div>
              <div>
                <span className="text-stone-400">气血:</span>{' '}
                <span className="text-green-400 font-bold">
                  {player.hp}/{player.maxHp}
                </span>
              </div>
              <div>
                <span className="text-stone-400">神识:</span>{' '}
                <span className="text-purple-400 font-bold">{player.spirit}</span>
              </div>
              <div>
                <span className="text-stone-400">体魄:</span>{' '}
                <span className="text-orange-400 font-bold">
                  {player.physique}
                </span>
              </div>
              <div>
                <span className="text-stone-400">速度:</span>{' '}
                <span className="text-yellow-400 font-bold">{player.speed}</span>
              </div>
            </div>
            {showAttributeDetails && (
              <div className="mt-3 pt-3 border-t border-stone-700 text-xs space-y-1">
                <div className="text-stone-500 mb-2">属性来源分解:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-stone-400">基础:</span> 攻击{' '}
                    {attributeSources.base.attack}, 防御{' '}
                    {attributeSources.base.defense}, 气血{' '}
                    {attributeSources.base.hp}
                  </div>
                  <div>
                    <span className="text-stone-400">天赋:</span> 攻击{' '}
                    {currentTalent?.effects.attack || 0}, 防御{' '}
                    {currentTalent?.effects.defense || 0}, 气血{' '}
                    {currentTalent?.effects.hp || 0}
                  </div>
                  <div>
                    <span className="text-stone-400">称号:</span> 攻击{' '}
                    {attributeSources.title.attack}, 防御{' '}
                    {attributeSources.title.defense}, 气血{' '}
                    {attributeSources.title.hp}
                  </div>
                  <div>
                    <span className="text-stone-400">功法:</span> 攻击{' '}
                    {attributeSources.art.attack}, 防御{' '}
                    {attributeSources.art.defense}, 气血 {attributeSources.art.hp}
                  </div>
                  <div>
                    <span className="text-stone-400">装备:</span> 攻击{' '}
                    {attributeSources.equipment.attack}, 防御{' '}
                    {attributeSources.equipment.defense}, 气血{' '}
                    {attributeSources.equipment.hp}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 属性点分配 */}
          {player.attributePoints > 0 && (
            <div className="bg-stone-900 rounded p-4 border border-stone-700">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Star className="text-yellow-400" size={20} />
                可分配属性点: {player.attributePoints}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => onAllocateAttribute('attack')}
                  className="px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded border border-red-700"
                >
                  攻击 +5
                </button>
                <button
                  onClick={() => onAllocateAttribute('defense')}
                  className="px-3 py-2 text-sm bg-blue-900 hover:bg-blue-800 rounded border border-blue-700"
                >
                  防御 +3
                </button>
                <button
                  onClick={() => onAllocateAttribute('hp')}
                  className="px-3 py-2 text-sm bg-green-900 hover:bg-green-800 rounded border border-green-700"
                >
                  气血 +20
                </button>
                <button
                  onClick={() => onAllocateAttribute('spirit')}
                  className="px-3 py-2 text-sm bg-purple-900 hover:bg-purple-800 rounded border border-purple-700"
                >
                  神识 +3
                </button>
                <button
                  onClick={() => onAllocateAttribute('physique')}
                  className="px-3 py-2 text-sm bg-orange-900 hover:bg-orange-800 rounded border border-orange-700"
                >
                  体魄 +3
                </button>
                <button
                  onClick={() => onAllocateAttribute('speed')}
                  className="px-3 py-2 text-sm bg-yellow-900 hover:bg-yellow-800 rounded border border-yellow-700"
                >
                  速度 +2
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
                      <span
                        className={`font-bold ${getRarityColor(currentTalent.rarity)}`}
                      >
                        {currentTalent.name}
                      </span>
                      <span className="text-xs text-stone-500">
                        ({currentTalent.rarity})
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mb-2">
                      {currentTalent.description}
                    </p>
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
                      <span className="font-bold text-yellow-400">
                        {currentTitle.name}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mb-1">
                      {currentTitle.description}
                    </p>
                    <p className="text-xs text-stone-500">
                      获得条件: {currentTitle.requirement}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 mb-3">
                <p className="text-stone-500">未获得称号</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {TITLES.filter(
                (t) =>
                  t.id !== player.titleId &&
                  player.achievements.some((a) => {
                    const achievement = ACHIEVEMENTS.find(
                      (ach) => ach.id === a
                    );
                    return achievement?.reward?.titleId === t.id;
                  })
              ).map((title) => (
                <button
                  key={title.id}
                  onClick={() => onSelectTitle(title.id)}
                  className="text-left bg-stone-900 hover:bg-stone-700 rounded p-3 border border-stone-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-yellow-400">
                        {title.name}
                      </span>
                      <p className="text-sm text-stone-400 mt-1">
                        {title.description}
                      </p>
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
