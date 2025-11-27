import React from 'react';
import { X, Heart, Zap, Shield, Swords } from 'lucide-react';
import { PlayerStats, Pet } from '../types';
import { PET_TEMPLATES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onActivatePet: (petId: string) => void;
  onFeedPet: (petId: string) => void;
  onEvolvePet: (petId: string) => void;
}

const PetModal: React.FC<Props> = ({ isOpen, onClose, player, onActivatePet, onFeedPet, onEvolvePet }) => {
  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '普通': return 'text-gray-400';
      case '稀有': return 'text-blue-400';
      case '传说': return 'text-purple-400';
      case '仙品': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const activePet = player.pets.find(p => p.id === player.activePetId);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">灵宠系统</h2>
          <button onClick={onClose} className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 当前激活的灵宠 */}
          {activePet && (
            <div className="bg-stone-900 rounded p-4 border-2 border-yellow-600">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-yellow-400">{activePet.name}</span>
                <span className="text-xs text-stone-500">({activePet.species})</span>
                <span className="ml-auto text-xs bg-yellow-600 text-black px-2 py-1 rounded">已激活</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="text-red-400" size={16} />
                  <span className="text-sm">攻击: {activePet.stats.attack}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-400" size={16} />
                  <span className="text-sm">防御: {activePet.stats.defense}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="text-green-400" size={16} />
                  <span className="text-sm">气血: {activePet.stats.hp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-400" size={16} />
                  <span className="text-sm">速度: {activePet.stats.speed}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>等级: {activePet.level}</span>
                  <span>经验: {activePet.exp} / {activePet.maxExp}</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(activePet.exp / activePet.maxExp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>亲密度</span>
                  <span>{activePet.affection} / 100</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${activePet.affection}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onFeedPet(activePet.id)}
                  className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-sm"
                >
                  喂养 (+10经验)
                </button>
                {activePet.evolutionStage < 2 && (
                  <button
                    onClick={() => onEvolvePet(activePet.id)}
                    className="flex-1 px-4 py-2 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 text-sm"
                  >
                    进化
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 所有灵宠列表 */}
          <div>
            <h3 className="text-lg font-bold mb-3">我的灵宠 ({player.pets.length})</h3>
            {player.pets.length === 0 ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center text-stone-500">
                还没有灵宠，快去抽奖或探索获得吧！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.pets.map(pet => (
                  <div
                    key={pet.id}
                    className={`bg-stone-900 rounded p-4 border ${
                      pet.id === player.activePetId ? 'border-yellow-600' : 'border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className={`font-bold ${getRarityColor(pet.rarity)}`}>
                          {pet.name}
                        </span>
                        <span className="text-xs text-stone-500 ml-2">Lv.{pet.level}</span>
                      </div>
                      {pet.id === player.activePetId ? (
                        <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">激活中</span>
                      ) : (
                        <button
                          onClick={() => onActivatePet(pet.id)}
                          className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded"
                        >
                          激活
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-stone-400 mb-2">{pet.species}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>攻击: {pet.stats.attack}</div>
                      <div>防御: {pet.stats.defense}</div>
                      <div>气血: {pet.stats.hp}</div>
                      <div>速度: {pet.stats.speed}</div>
                    </div>
                    <div className="text-xs text-stone-500 mb-2">
                      经验: {pet.exp} / {pet.maxExp}
                    </div>
                    <div className="w-full bg-stone-700 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(pet.exp / pet.maxExp) * 100}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onFeedPet(pet.id)}
                      className="w-full px-3 py-1.5 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-xs"
                    >
                      喂养
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetModal;

