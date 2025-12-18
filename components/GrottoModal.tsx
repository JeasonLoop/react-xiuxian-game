import React, { useState, useMemo, useEffect } from 'react';
import { X, Home, ArrowUp, Sprout, Package, Coins, Zap, Clock } from 'lucide-react';
import { PlayerStats } from '../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS } from '../constants';
import { getRarityTextColor } from '../utils/rarityUtils';
import { ItemType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpgradeGrotto: (level: number) => void;
  onPlantHerb: (herbId: string) => void;
  onHarvestHerb: (index: number) => void;
  onHarvestAll: () => void;
  onEnhanceSpiritArray: (enhancementId: string) => void;
}

const GrottoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpgradeGrotto,
  onPlantHerb,
  onHarvestHerb,
  onHarvestAll,
  onEnhanceSpiritArray,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'plant' | 'enhancement'>('overview');

  // 安全的 grotto 对象，如果不存在则使用默认值
  const grotto = useMemo(() => {
    return player.grotto || {
      level: 0,
      expRateBonus: 0,
      storageCapacity: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
    };
  }, [player.grotto]);

  const currentConfig = useMemo(() => {
    if (grotto.level === 0) return null;
    return GROTTO_CONFIGS.find((c) => c.level === grotto.level);
  }, [grotto.level]);

  // 计算可收获的灵草数量
  const matureHerbsCount = useMemo(() => {
    const now = Date.now();
    return grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime).length;
  }, [grotto.plantedHerbs]);

  // 计算每个种植的剩余时间
  const getHerbRemainingTime = (harvestTime: number) => {
    const now = Date.now();
    const remaining = harvestTime - now;
    if (remaining <= 0) return '可收获';
    const minutes = Math.ceil(remaining / 60000);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
  };

  // 获取可升级的洞府列表
  const availableUpgrades = useMemo(() => {
    const currentLevel = grotto.level;
    const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
    return GROTTO_CONFIGS.filter((config) => {
      if (config.level <= currentLevel) return false;
      if (config.realmRequirement) {
        const requiredIndex = REALM_ORDER.indexOf(config.realmRequirement);
        return playerRealmIndex >= requiredIndex;
      }
      return true;
    });
  }, [grotto.level, player.realm]);

  // 获取可种植的灵草（背包中有种子的）
  const availableHerbs = useMemo(() => {
    return PLANTABLE_HERBS.filter((herb) => {
      const seedItem = player.inventory.find(
        (item) => item.name === herb.name && item.type === ItemType.Herb
      );
      return seedItem && seedItem.quantity > 0;
    });
  }, [player.inventory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-paper-800 border-2 border-stone-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-ink-900 p-4 border-b border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="text-mystic-gold" size={24} />
            <h2 className="text-xl font-serif text-mystic-gold tracking-widest">洞府</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-ink-900 border-b border-stone-700 flex gap-2 p-2 overflow-x-auto min-h-[60px]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-mystic-gold text-stone-900 font-bold'
                : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${
              activeTab === 'upgrade'
                ? 'bg-mystic-gold text-stone-900 font-bold'
                : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            升级
          </button>
          <button
            onClick={() => setActiveTab('plant')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${
              activeTab === 'plant'
                ? 'bg-mystic-gold text-stone-900 font-bold'
                : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            种植
          </button>
          <button
            onClick={() => setActiveTab('enhancement')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap ${
              activeTab === 'enhancement'
                ? 'bg-mystic-gold text-stone-900 font-bold'
                : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            改造
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={64} />
                  <p className="text-stone-400 text-lg mb-4">你还没有洞府</p>
                  <p className="text-stone-500 text-sm mb-6">
                    购买洞府可以获得聚灵阵修炼加成、额外存储空间和灵草种植功能
                  </p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-3 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors"
                  >
                    前往购买
                  </button>
                </div>
              ) : (
                <>
                  {/* 洞府信息 */}
                  <div className="bg-ink-900 p-4 rounded border border-stone-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-stone-200">
                        {currentConfig?.name || '未知洞府'}
                      </h3>
                      <span className="text-stone-400 text-sm">等级 {grotto.level}</span>
                    </div>
                    <p className="text-stone-400 text-sm mb-4">{currentConfig?.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-stone-800 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="text-mystic-gold" size={18} />
                          <span className="text-stone-400 text-sm">修炼加成</span>
                        </div>
                        <p className="text-xl font-bold text-mystic-gold">
                          +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                        </p>
                        {grotto.spiritArrayEnhancement > 0 && (
                          <p className="text-xs text-stone-500 mt-1">
                            基础: +{(grotto.expRateBonus * 100).toFixed(0)}% + 改造: +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-stone-800 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="text-mystic-gold" size={18} />
                          <span className="text-stone-400 text-sm">额外存储</span>
                        </div>
                        <p className="text-xl font-bold text-stone-200">
                          +{grotto.storageCapacity} 格
                        </p>
                      </div>
                      <div className="bg-stone-800 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Sprout className="text-mystic-gold" size={18} />
                          <span className="text-stone-400 text-sm">种植槽位</span>
                        </div>
                        <p className="text-xl font-bold text-stone-200">
                          {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 种植的灵草 */}
                  {grotto.plantedHerbs.length > 0 && (
                    <div className="bg-ink-900 p-4 rounded border border-stone-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-stone-200">种植中的灵草</h3>
                        {matureHerbsCount > 0 && (
                          <button
                            onClick={onHarvestAll}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            批量收获 ({matureHerbsCount})
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {grotto.plantedHerbs.map((herb, index) => {
                          const isMature = Date.now() >= herb.harvestTime;
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded border ${
                                isMature
                                  ? 'bg-green-900/30 border-green-600'
                                  : 'bg-stone-800 border-stone-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-stone-200">{herb.herbName}</span>
                                    <span className="text-stone-400 text-sm">
                                      x{herb.quantity}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-stone-400">
                                    <Clock size={14} />
                                    <span>{getHerbRemainingTime(herb.harvestTime)}</span>
                                  </div>
                                </div>
                                {isMature && (
                                  <button
                                    onClick={() => onHarvestHerb(index)}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                  >
                                    收获
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4">购买/升级洞府</h3>
              {availableUpgrades.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  {grotto.level === 0
                    ? '暂无可用洞府'
                    : '已达到最高等级'}
                </div>
              ) : (
                <div className="space-y-3">
                  {availableUpgrades.map((config) => (
                    <div
                      key={config.level}
                      className="bg-ink-900 p-4 rounded border border-stone-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-stone-200">
                              {config.name}
                            </h4>
                            <span className="text-stone-400 text-sm">等级 {config.level}</span>
                          </div>
                          <p className="text-stone-400 text-sm mb-3">{config.description}</p>
                        </div>
                        <button
                          onClick={() => onUpgradeGrotto(config.level)}
                          disabled={player.spiritStones < config.cost}
                          className={`px-4 py-2 rounded font-bold transition-colors ${
                            player.spiritStones >= config.cost
                              ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600'
                              : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Coins size={18} />
                            <span>{config.cost.toLocaleString()}</span>
                          </div>
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-stone-400">修炼加成: </span>
                          <span className="text-mystic-gold font-bold">
                            +{(config.expRateBonus * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">额外存储: </span>
                          <span className="text-stone-200 font-bold">
                            +{config.storageCapacity} 格
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">种植槽位: </span>
                          <span className="text-stone-200 font-bold">{config.maxHerbSlots}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plant' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4">种植灵草</h3>
              {grotto.level === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  请先购买洞府才能种植灵草
                </div>
              ) : availableHerbs.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  背包中没有可种植的灵草种子
                </div>
              ) : (
                <>
                  <div className="bg-ink-900 p-3 rounded border border-stone-700 mb-4">
                    <div className="text-stone-400 text-sm">
                      已种植: {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableHerbs.map((herb) => {
                      const seedItem = player.inventory.find(
                        (item) => item.name === herb.name && item.type === ItemType.Herb
                      );
                      const isFull = grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0);

                      return (
                        <div
                          key={herb.id}
                          className="bg-ink-900 p-4 rounded border border-stone-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="font-bold"
                                  style={{ color: getRarityTextColor(herb.rarity) }}
                                >
                                  {herb.name}
                                </span>
                              </div>
                              <p className="text-stone-400 text-sm mb-2">
                                生长时间: {Math.floor(herb.growthTime / 60000)} 分钟
                              </p>
                              <p className="text-stone-400 text-sm mb-2">
                                收获: {herb.harvestQuantity.min}-{herb.harvestQuantity.max} 个
                              </p>
                              {herb.grottoLevelRequirement && (
                                <p className="text-xs text-stone-500 mb-2">
                                  需要{herb.grottoLevelRequirement}级洞府
                                  {grotto.level < herb.grottoLevelRequirement && (
                                    <span className="text-red-400 ml-2">(等级不足)</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => onPlantHerb(herb.id)}
                              disabled={isFull || !seedItem || seedItem.quantity < 1 || (herb.grottoLevelRequirement && grotto.level < herb.grottoLevelRequirement)}
                              className={`px-4 py-2 rounded font-bold transition-colors ${
                                isFull || !seedItem || seedItem.quantity < 1 || (herb.grottoLevelRequirement && grotto.level < herb.grottoLevelRequirement)
                                  ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {herb.grottoLevelRequirement && grotto.level < herb.grottoLevelRequirement
                                ? `需要${herb.grottoLevelRequirement}级洞府`
                                : isFull
                                ? '槽位已满'
                                : !seedItem || seedItem.quantity < 1
                                ? '种子不足'
                                : '种植'}
                            </button>
                          </div>
                          <div className="text-stone-500 text-xs mt-2">
                            拥有种子: {seedItem?.quantity || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'enhancement' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4">聚灵阵改造</h3>
              {grotto.level === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  请先购买洞府才能改造聚灵阵
                </div>
              ) : (
                <>
                  <div className="bg-ink-900 p-4 rounded border border-stone-700 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-mystic-gold" size={20} />
                      <span className="text-stone-200 font-bold">当前改造加成</span>
                    </div>
                    <p className="text-2xl font-bold text-mystic-gold">
                      +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                    </p>
                    <p className="text-stone-400 text-sm mt-2">
                      基础加成: +{(grotto.expRateBonus * 100).toFixed(0)}% | 总加成: +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="space-y-3">
                    {SPIRIT_ARRAY_ENHANCEMENTS.map((enhancement) => {
                      // 检查是否满足洞府等级要求
                      const meetsLevelRequirement = grotto.level >= enhancement.grottoLevelRequirement;

                      // 检查材料是否足够
                      const hasMaterials = enhancement.materials.every((material) => {
                        const item = player.inventory.find((i) => i.name === material.name);
                        return item && item.quantity >= material.quantity;
                      });

                      const canEnhance = meetsLevelRequirement && hasMaterials;

                      return (
                        <div
                          key={enhancement.id}
                          className="bg-ink-900 p-4 rounded border border-stone-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-stone-200">{enhancement.name}</span>
                                <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded">
                                  需要{enhancement.grottoLevelRequirement}级洞府
                                </span>
                              </div>
                              <p className="text-stone-400 text-sm mb-3">{enhancement.description}</p>
                              <div className="bg-stone-800 p-3 rounded mb-3">
                                <div className="text-stone-300 text-sm mb-1 font-bold">
                                  加成: +{(enhancement.expRateBonus * 100).toFixed(0)}% 修炼速度
                                </div>
                                <div className="text-stone-400 text-sm">
                                  所需材料:
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {enhancement.materials.map((material, idx) => {
                                    const item = player.inventory.find((i) => i.name === material.name);
                                    const hasEnough = item && item.quantity >= material.quantity;
                                    return (
                                      <span
                                        key={idx}
                                        className={`text-xs px-2 py-1 rounded ${
                                          hasEnough
                                            ? 'bg-green-900/50 text-green-300'
                                            : 'bg-red-900/50 text-red-300'
                                        }`}
                                      >
                                        {material.name} x{material.quantity}
                                        {item && ` (拥有: ${item.quantity})`}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onEnhanceSpiritArray(enhancement.id)}
                            disabled={!canEnhance}
                            className={`w-full px-4 py-2 rounded font-bold transition-colors ${
                              canEnhance
                                ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600'
                                : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            {!meetsLevelRequirement
                              ? `需要${enhancement.grottoLevelRequirement}级洞府`
                              : !hasMaterials
                              ? '材料不足'
                              : '进行改造'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrottoModal;

