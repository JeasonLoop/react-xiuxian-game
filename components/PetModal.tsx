import React, { useState } from 'react';
import {
  X,
  Heart,
  Zap,
  Shield,
  Swords,
  Droplet,
  Package,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PlayerStats, Pet, Item, ItemType } from '../types';
import { PET_TEMPLATES, RARITY_MULTIPLIERS, REALM_ORDER } from '../constants';
import BatchFeedModal from './BatchFeedModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onActivatePet: (petId: string) => void;
  onFeedPet: (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => void;
  onBatchFeedItems?: (petId: string, itemIds: string[]) => void;
  onEvolvePet: (petId: string) => void;
}

const PetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onActivatePet,
  onFeedPet,
  onBatchFeedItems,
  onEvolvePet,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'hp' | 'item' | 'exp' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isBatchFeedOpen, setIsBatchFeedOpen] = useState(false);
  const [batchFeedPetId, setBatchFeedPetId] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const activePet = player.pets.find((p) => p.id === player.activePetId);

  // 可喂养的物品（所有未装备的物品）
  const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));
  const feedableItems = player.inventory.filter(item =>
    !equippedItemIds.has(item.id) && item.quantity > 0
  );

  const handleFeedClick = (petId: string) => {
    setSelectedPetId(petId);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedConfirm = () => {
    if (!selectedPetId || !feedType) return;
    if (feedType === 'item' && !selectedItemId) return;

    onFeedPet(selectedPetId, feedType, selectedItemId || undefined);
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedCancel = () => {
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

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
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">
            灵宠系统
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 当前激活的灵宠 */}
          {activePet && (
            <div className="bg-stone-900 rounded p-4 border-2 border-yellow-600">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-yellow-400">
                  {activePet.name}
                </span>
                <span className="text-xs text-stone-500">
                  ({activePet.species})
                </span>
                <span className="ml-auto text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                  已激活
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="text-red-400" size={16} />
                  <span className="text-sm">
                    攻击: {activePet.stats.attack}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-400" size={16} />
                  <span className="text-sm">
                    防御: {activePet.stats.defense}
                  </span>
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
                  <span>
                    经验: {activePet.exp} / {activePet.maxExp}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(activePet.exp / activePet.maxExp) * 100}%`,
                    }}
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
                  onClick={() => handleFeedClick(activePet.id)}
                  className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-sm"
                >
                  喂养
                </button>
                {onBatchFeedItems && (
                  <button
                    onClick={() => {
                      setBatchFeedPetId(activePet.id);
                      setIsBatchFeedOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-sm"
                    title="批量喂养"
                  >
                    <Layers size={16} />
                  </button>
                )}
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
            <h3 className="text-lg font-bold mb-3">
              我的灵宠 ({player.pets.length})
            </h3>
            {player.pets.length === 0 ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center text-stone-500">
                还没有灵宠，快去抽奖或探索获得吧！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className={`bg-stone-900 rounded p-4 border ${
                      pet.id === player.activePetId
                        ? 'border-yellow-600'
                        : 'border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span
                          className={`font-bold ${getRarityColor(pet.rarity)}`}
                        >
                          {pet.name}
                        </span>
                        <span className="text-xs text-stone-500 ml-2">
                          Lv.{pet.level}
                        </span>
                      </div>
                      {pet.id === player.activePetId ? (
                        <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                          激活中
                        </span>
                      ) : (
                        <button
                          onClick={() => onActivatePet(pet.id)}
                          className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded"
                        >
                          激活
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-stone-400 mb-2">
                      {pet.species}
                    </div>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedClick(pet.id)}
                        className="flex-1 px-3 py-1.5 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-xs"
                      >
                        喂养
                      </button>
                      {onBatchFeedItems && (
                        <button
                          onClick={() => {
                            setBatchFeedPetId(pet.id);
                            setIsBatchFeedOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-xs"
                          title="批量喂养"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 喂养方式选择弹窗 */}
        {selectedPetId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-stone-800 rounded-lg border border-stone-700 w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4 text-mystic-gold">
                选择喂养方式
              </h3>

              {!feedType ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setFeedType('hp')}
                    className="w-full px-4 py-3 bg-red-900 hover:bg-red-800 rounded border border-red-700 flex items-center gap-3"
                  >
                    <Droplet className="text-red-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">血量喂养</div>
                      <div className="text-xs text-stone-400">消耗 200 点气血 (经验根据境界计算，+2~5亲密度)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFeedType('item')}
                    className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 flex items-center gap-3"
                    disabled={feedableItems.length === 0}
                  >
                    <Package className="text-blue-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">物品喂养</div>
                      <div className="text-xs text-stone-400">
                        {feedableItems.length === 0
                          ? '背包中没有可喂养物品'
                          : `消耗物品 (经验根据境界和物品品质计算，+2~5亲密度)`}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFeedType('exp')}
                    className="w-full px-4 py-3 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 flex items-center gap-3"
                  >
                    <Sparkles className="text-purple-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">修为喂养</div>
                      <div className="text-xs text-stone-400">消耗 5% 当前修为 (经验根据境界计算，+2~5亲密度)</div>
                    </div>
                  </button>
                </div>
              ) : feedType === 'item' ? (
                <div className="space-y-3">
                  <div className="text-sm text-stone-400 mb-3">
                    选择要喂养的物品：
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {feedableItems.length === 0 ? (
                      <div className="text-center text-stone-500 py-4">
                        背包中没有可喂养物品
                      </div>
                    ) : (
                      feedableItems.map(item => {
                        // 计算预估经验值
                        const rarity = item.rarity || '普通';
                        const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
                        const realmIndex = REALM_ORDER.indexOf(player.realm);
                        const realmMultiplier = 1 + realmIndex * 0.5;
                        const levelMultiplier = 1 + player.realmLevel * 0.1;
                        const baseExp = Math.floor(10 * realmMultiplier * levelMultiplier);
                        const estimatedExp = Math.floor(baseExp * rarityMultiplier);

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full px-3 py-2 rounded border text-left ${
                              selectedItemId === item.id
                                ? 'bg-blue-900 border-blue-600'
                                : 'bg-stone-700 border-stone-600 hover:bg-stone-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className={`text-xs px-1.5 py-0.5 rounded ${getRarityColor(rarity)}`}>
                                {rarity}
                              </div>
                            </div>
                            <div className="text-xs text-stone-400 mt-1">
                              数量: {item.quantity} · 预估经验: {estimatedExp}~{Math.floor(estimatedExp * 1.2)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleFeedCancel}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  取消
                </button>
                {feedType && (feedType !== 'item' || selectedItemId) && (
                  <button
                    onClick={handleFeedConfirm}
                    className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700"
                  >
                    确认喂养
                  </button>
                )}
                {feedType && feedType !== 'item' && (
                  <button
                    onClick={() => setFeedType(null)}
                    className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                  >
                    返回
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 批量喂养弹窗 */}
        {onBatchFeedItems && batchFeedPetId && (
          <BatchFeedModal
            isOpen={isBatchFeedOpen}
            onClose={() => {
              setIsBatchFeedOpen(false);
              setBatchFeedPetId(null);
            }}
            player={player}
            petId={batchFeedPetId}
            onFeedItems={onBatchFeedItems}
          />
        )}
      </div>
    </div>
  );
};

export default PetModal;
