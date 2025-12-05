import React, { useState, useMemo } from 'react';
import { X, Trash2, AlertTriangle, Filter } from 'lucide-react';
import { PlayerStats, Pet, ItemRarity } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onReleasePets: (petIds: string[]) => void;
}

type RarityFilter = 'all' | ItemRarity;
type EvolutionFilter = 'all' | '0' | '1' | '2'; // 0=幼年期, 1=成熟期, 2=完全体
type ActiveFilter = 'all' | 'active' | 'inactive';

const BatchReleaseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onReleasePets,
}) => {
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [confirmRelease, setConfirmRelease] = useState(false);

  // 筛选状态
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedEvolution, setSelectedEvolution] = useState<EvolutionFilter>('all');
  const [selectedActive, setSelectedActive] = useState<ActiveFilter>('all');
  const [minLevel, setMinLevel] = useState<number>(0);
  const [maxLevel, setMaxLevel] = useState<number>(100);

  // 获取所有灵宠种类
  const allSpecies = useMemo(() => {
    const speciesSet = new Set<string>();
    player.pets.forEach((pet) => {
      speciesSet.add(pet.species);
    });
    return Array.from(speciesSet).sort();
  }, [player.pets]);

  // 筛选后的灵宠列表
  const filteredPets = useMemo(() => {
    return player.pets.filter((pet) => {
      // 稀有度筛选
      if (selectedRarity !== 'all' && pet.rarity !== selectedRarity) {
        return false;
      }

      // 种类筛选
      if (selectedSpecies !== 'all' && pet.species !== selectedSpecies) {
        return false;
      }

      // 进化阶段筛选
      if (selectedEvolution !== 'all') {
        const stage = pet.evolutionStage.toString();
        if (stage !== selectedEvolution) {
          return false;
        }
      }

      // 激活状态筛选
      if (selectedActive !== 'all') {
        const isActive = pet.id === player.activePetId;
        if (selectedActive === 'active' && !isActive) {
          return false;
        }
        if (selectedActive === 'inactive' && isActive) {
          return false;
        }
      }

      // 等级范围筛选
      if (pet.level < minLevel || pet.level > maxLevel) {
        return false;
      }

      return true;
    });
  }, [player.pets, selectedRarity, selectedSpecies, selectedEvolution, selectedActive, minLevel, maxLevel, player.activePetId]);

  // 必须在所有 hooks 之后才能提前返回
  if (!isOpen) return null;

  const handleTogglePet = (petId: string) => {
    setSelectedPets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(petId)) {
        newSet.delete(petId);
      } else {
        newSet.add(petId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPets.size === filteredPets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(filteredPets.map((p) => p.id)));
    }
  };

  const handleRelease = () => {
    if (selectedPets.size === 0) return;
    if (!confirmRelease) {
      setConfirmRelease(true);
      return;
    }

    const petIds = Array.from(selectedPets);
    onReleasePets(petIds);
    setSelectedPets(new Set());
    setConfirmRelease(false);
    onClose();
  };

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

  // 计算总补偿
  const totalCompensation = Array.from(selectedPets).reduce((total, petId) => {
    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return total;
    const baseCompensation = 100;
    const levelMultiplier = 1 + pet.level * 0.1;
    const rarityMultiplier = {
      '普通': 1,
      '稀有': 2,
      '传说': 5,
      '仙品': 10,
    }[pet.rarity] || 1;
    return total + Math.floor(baseCompensation * levelMultiplier * rarityMultiplier);
  }, 0);

  // 检查是否包含激活的灵宠
  const includesActivePet = selectedPets.has(player.activePetId || '');

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 w-full max-w-2xl rounded-lg border border-stone-600 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-600 bg-ink-800 rounded-t flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-400" size={20} />
            <h3 className="text-xl font-serif text-mystic-gold">批量放生灵宠</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {confirmRelease ? (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded p-4 flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-400 mb-2">确认放生</h4>
                  <p className="text-stone-300 mb-2">
                    你确定要放生 <span className="text-red-400 font-bold">{selectedPets.size}</span> 只灵宠吗？
                  </p>
                  {includesActivePet && (
                    <p className="text-yellow-400 text-sm mb-2">
                      ⚠️ 注意：其中包含当前激活的灵宠，放生后将自动取消激活。
                    </p>
                  )}
                  <div className="bg-stone-900 rounded p-3 mt-3">
                    <div className="text-sm text-stone-400 mb-2">将放生的灵宠：</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {Array.from(selectedPets).map((petId) => {
                        const pet = player.pets.find((p) => p.id === petId);
                        if (!pet) return null;
                        return (
                          <div
                            key={petId}
                            className="text-sm text-stone-300 flex items-center justify-between"
                          >
                            <span>
                              {pet.name} (Lv.{pet.level}, {pet.rarity})
                              {petId === player.activePetId && (
                                <span className="text-yellow-400 ml-2">[激活中]</span>
                              )}
                            </span>
                            <span className="text-stone-500">
                              {Math.floor(100 * (1 + pet.level * 0.1) * ({
                                '普通': 1,
                                '稀有': 2,
                                '传说': 5,
                                '仙品': 10,
                              }[pet.rarity] || 1))} 灵石
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-700 flex justify-between items-center">
                      <span className="text-stone-300 font-bold">总补偿：</span>
                      <span className="text-yellow-400 text-lg font-bold">
                        {totalCompensation} 灵石
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-400 text-sm mt-3">
                    此操作不可撤销，请谨慎确认。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRelease(false)}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  取消
                </button>
                <button
                  onClick={handleRelease}
                  className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-white font-bold"
                >
                  确认放生
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-stone-300 mb-1">
                      选择要放生的灵宠（已选择 {selectedPets.size} / {filteredPets.length}）
                      {filteredPets.length !== player.pets.length && (
                        <span className="text-stone-500 text-xs ml-2">
                          (共 {player.pets.length} 只)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500">
                      放生灵宠将获得灵石补偿，补偿金额根据灵宠等级和稀有度计算
                    </p>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600 text-sm"
                  >
                    {selectedPets.size === filteredPets.length && filteredPets.length > 0 ? '取消全选' : '全选'}
                  </button>
                </div>

                {/* 筛选器 */}
                <div className="bg-stone-900 rounded p-3 border border-stone-700 space-y-3">
                  <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <Filter size={16} />
                    <span>筛选条件:</span>
                  </div>

                  {/* 稀有度筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">稀有度:</span>
                    {(['all', '普通', '稀有', '传说', '仙品'] as RarityFilter[]).map((rarity) => (
                      <button
                        key={rarity}
                        onClick={() => {
                          setSelectedRarity(rarity);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selectedRarity === rarity
                            ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        {rarity === 'all' ? '全部' : rarity}
                      </button>
                    ))}
                  </div>

                  {/* 种类筛选 */}
                  {allSpecies.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-stone-500">种类:</span>
                      <button
                        onClick={() => {
                          setSelectedSpecies('all');
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selectedSpecies === 'all'
                            ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        全部
                      </button>
                      {allSpecies.map((species) => (
                        <button
                          key={species}
                          onClick={() => {
                            setSelectedSpecies(species);
                            setSelectedPets(new Set());
                          }}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${
                            selectedSpecies === species
                              ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                              : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                          }`}
                        >
                          {species}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 进化阶段筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">进化阶段:</span>
                    {(['all', '0', '1', '2'] as EvolutionFilter[]).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => {
                          setSelectedEvolution(stage);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selectedEvolution === stage
                            ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        {stage === 'all' ? '全部' : stage === '0' ? '幼年期' : stage === '1' ? '成熟期' : '完全体'}
                      </button>
                    ))}
                  </div>

                  {/* 激活状态筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">激活状态:</span>
                    {(['all', 'active', 'inactive'] as ActiveFilter[]).map((active) => (
                      <button
                        key={active}
                        onClick={() => {
                          setSelectedActive(active);
                          setSelectedPets(new Set());
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selectedActive === active
                            ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        {active === 'all' ? '全部' : active === 'active' ? '已激活' : '未激活'}
                      </button>
                    ))}
                  </div>

                  {/* 等级范围筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-500">等级范围:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minLevel}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          setMinLevel(val);
                          setSelectedPets(new Set());
                        }}
                        className="w-16 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-xs text-stone-300"
                        placeholder="最小"
                      />
                      <span className="text-stone-500 text-xs">~</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maxLevel}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
                          setMaxLevel(val);
                          setSelectedPets(new Set());
                        }}
                        className="w-16 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-xs text-stone-300"
                        placeholder="最大"
                      />
                    </div>
                  </div>

                  {/* 清除筛选 */}
                  {(selectedRarity !== 'all' || selectedSpecies !== 'all' || selectedEvolution !== 'all' || selectedActive !== 'all' || minLevel > 0 || maxLevel < 100) && (
                    <button
                      onClick={() => {
                        setSelectedRarity('all');
                        setSelectedSpecies('all');
                        setSelectedEvolution('all');
                        setSelectedActive('all');
                        setMinLevel(0);
                        setMaxLevel(100);
                        setSelectedPets(new Set());
                      }}
                      className="px-3 py-1 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600 text-xs text-stone-300"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              </div>

              {filteredPets.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  {player.pets.length === 0 ? '没有可放生的灵宠' : '没有符合条件的灵宠'}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPets.map((pet) => {
                    const isSelected = selectedPets.has(pet.id);
                    const isActive = pet.id === player.activePetId;
                    const compensation = Math.floor(
                      100 * (1 + pet.level * 0.1) * ({
                        '普通': 1,
                        '稀有': 2,
                        '传说': 5,
                        '仙品': 10,
                      }[pet.rarity] || 1)
                    );

                    return (
                      <div
                        key={pet.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-red-900/30 border-red-600'
                            : 'bg-stone-900 border-stone-700 hover:bg-stone-800'
                        }`}
                        onClick={() => handleTogglePet(pet.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTogglePet(pet.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getRarityColor(pet.rarity)}`}>
                                  {pet.name}
                                </span>
                                {isActive && (
                                  <span className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded">
                                    激活中
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-400 mt-1">
                                {pet.species} · Lv.{pet.level} · {pet.rarity}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-yellow-400 font-bold">
                              {compensation} 灵石
                            </div>
                            <div className="text-xs text-stone-500">补偿</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedPets.size > 0 && (
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-300">
                      已选择 <span className="font-bold text-white">{selectedPets.size}</span> 只灵宠
                    </span>
                    <span className="text-yellow-400 text-lg font-bold">
                      总补偿: {totalCompensation} 灵石
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  取消
                </button>
                <button
                  onClick={handleRelease}
                  disabled={selectedPets.size === 0}
                  className={`flex-1 px-4 py-2 rounded border font-bold ${
                    selectedPets.size === 0
                      ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      : 'bg-red-900 hover:bg-red-800 border-red-700 text-white'
                  }`}
                >
                  放生 ({selectedPets.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchReleaseModal;

