import React, { useState, useMemo, useEffect } from 'react';
import { Home, ArrowUp, Sprout, Package, Coins, Zap, Clock, CheckCircle, AlertCircle, BookOpen, Sparkles, Gauge } from 'lucide-react';
import { Modal } from './common';
import { PlayerStats, ItemRarity } from '../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS, SPEEDUP_CONFIG, HERBARIUM_REWARDS } from '../constants/index';
import { getRarityTextColor } from '../utils/rarityUtils';
import { formatGrottoTime } from '../utils/formatUtils';
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
  onToggleAutoHarvest: () => void;
  onSpeedupHerb: (index: number) => void;
}

/**
 * 计算进度百分比（0-100）
 */
const calculateProgress = (plantTime: number, harvestTime: number): number => {
  const now = Date.now();
  if (now >= harvestTime) return 100;
  if (now <= plantTime) return 0;

  const total = harvestTime - plantTime;
  const elapsed = now - plantTime;
  return Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
};

const GrottoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpgradeGrotto,
  onPlantHerb,
  onHarvestHerb,
  onHarvestAll,
  onEnhanceSpiritArray,
  onToggleAutoHarvest,
  onSpeedupHerb,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'plant' | 'enhancement' | 'herbarium'>('overview');
  const [timeUpdateKey, setTimeUpdateKey] = useState(0);

  // 安全的 grotto 对象，如果不存在则使用默认值
  const grotto = useMemo(() => {
    return (
      player.grotto || {
        level: 0,
        expRateBonus: 0,
        autoHarvest: false,
        growthSpeedBonus: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
        spiritArrayEnhancement: 0,
        herbarium: [] as string[],
        dailySpeedupCount: 0,
        lastSpeedupResetDate: '',
      }
    );
  }, [player.grotto]);

  const currentConfig = useMemo(() => {
    if (grotto.level === 0) return null;
    return GROTTO_CONFIGS.find((c) => c.level === grotto.level);
  }, [grotto.level]);

  // 计算可收获的灵草数量
  const matureHerbsCount = useMemo(() => {
    const now = Date.now();
    return grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime).length;
  }, [grotto.plantedHerbs, timeUpdateKey]);

  // 定时更新显示时间（每分钟更新一次）
  useEffect(() => {
    if (!isOpen || activeTab !== 'overview' && activeTab !== 'plant') return;

    const interval = setInterval(() => {
      setTimeUpdateKey((prev) => prev + 1);
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

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

  // 获取可种植的灵草（显示所有可能的草药，包括背包中没有的）
  const availableHerbs = useMemo(() => {
    // 获取背包中所有草药（包括数量为0的，用于显示曾经获得过的草药）
    // 严格过滤：只包含草药类型，排除丹药等其他类型
    const allInventoryHerbs = player.inventory.filter(
      (item) => item.type === ItemType.Herb
    );

    // 创建草药列表，优先使用 PLANTABLE_HERBS 中的配置，否则使用默认配置
    const herbMap = new Map<string, typeof PLANTABLE_HERBS[0]>();

    // 先添加 PLANTABLE_HERBS 中定义的所有草药（显示所有可种植的草药）
    PLANTABLE_HERBS.forEach((herb) => {
      herbMap.set(herb.name, herb);
    });

    // 添加背包中其他未定义的草药（使用默认配置，包括数量为0的）
    allInventoryHerbs.forEach((item) => {
      if (!herbMap.has(item.name)) {
        // 根据稀有度设置默认配置
        const rarity = item.rarity || '普通';
        const rarityConfigs: Record<string, { growthTime: number; harvestQuantity: { min: number; max: number }; grottoLevelRequirement: number }> = {
          '普通': { growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, grottoLevelRequirement: 1 },
          '稀有': { growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, grottoLevelRequirement: 3 },
          '传说': { growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 5 },
          '仙品': { growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 6 },
        };
        const config = rarityConfigs[rarity];
        herbMap.set(item.name, {
          id: `herb-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.name,
          growthTime: config.growthTime,
          harvestQuantity: config.harvestQuantity,
          rarity: rarity as ItemRarity,
          grottoLevelRequirement: config.grottoLevelRequirement,
        });
      }
    });

    // 返回所有草药（包括背包中没有的），并按照可种植状态排序
    const allHerbs = Array.from(herbMap.values());

    // 获取当前洞府信息用于排序
    const grotto = player.grotto || {
      level: 0,
      expRateBonus: 0,
      autoHarvest: false,
      growthSpeedBonus: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
    };
    const currentConfig = GROTTO_CONFIGS.find((c) => c.level === grotto.level);
    const maxHerbSlots = currentConfig?.maxHerbSlots || 0;
    const isFull = grotto.plantedHerbs.length >= maxHerbSlots;

    // 排序：可种植的排在前面
    return allHerbs.sort((a, b) => {
      // 获取每个草药的种子信息
      const seedItemA = player.inventory.find(
        (item) => item.name === a.name && item.type === ItemType.Herb
      );
      const seedItemB = player.inventory.find(
        (item) => item.name === b.name && item.type === ItemType.Herb
      );

      // 计算每个草药的可种植状态
      const levelMetA = grotto.level >= (a.grottoLevelRequirement || 1);
      const levelMetB = grotto.level >= (b.grottoLevelRequirement || 1);
      const hasSeedA = seedItemA && seedItemA.quantity > 0;
      const hasSeedB = seedItemB && seedItemB.quantity > 0;
      const canPlantA = !isFull && hasSeedA && levelMetA;
      const canPlantB = !isFull && hasSeedB && levelMetB;

      // 优先级排序：
      // 1. 可以种植的（canPlant = true）
      // 2. 有种子但等级不够的（hasSeed && !levelMet）
      // 3. 有种子但槽位已满的（hasSeed && isFull）
      // 4. 没有种子的（!hasSeed）

      if (canPlantA && !canPlantB) return -1;
      if (!canPlantA && canPlantB) return 1;

      // 如果都是可种植或都不可种植，继续比较其他条件
      if (hasSeedA && !hasSeedB) return -1;
      if (!hasSeedA && hasSeedB) return 1;

      // 如果都有种子或都没有种子，比较等级要求
      if (levelMetA && !levelMetB) return -1;
      if (!levelMetA && levelMetB) return 1;

      // 最后按名称排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }, [player.inventory, player.grotto]);

  if (!isOpen) return null;

  // 标题额外内容（Tabs）
  const titleExtra = (
    <div className="flex gap-2 overflow-x-hidden scrollbar-hide py-2 px-5">
      <button
        onClick={() => setActiveTab('overview')}
        className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
          activeTab === 'overview'
            ? 'bg-mystic-gold text-stone-900 font-bold'
            : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
        }`}
      >
        <Home size={16} />
        <span>总览</span>
      </button>
      <button
        onClick={() => setActiveTab('upgrade')}
        className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
          activeTab === 'upgrade'
            ? 'bg-mystic-gold text-stone-900 font-bold'
            : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
        }`}
      >
        <ArrowUp size={16} />
        <span>升级</span>
      </button>
      <button
        onClick={() => setActiveTab('plant')}
        className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 relative shrink-0 ${
          activeTab === 'plant'
            ? 'bg-mystic-gold text-stone-900 font-bold'
            : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
        }`}
      >
        <Sprout size={16} />
        <span>种植</span>
        {matureHerbsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {matureHerbsCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setActiveTab('enhancement')}
        className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 ${
          activeTab === 'enhancement'
            ? 'bg-mystic-gold text-stone-900 font-bold'
            : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
        }`}
      >
        <Zap size={16} />
        <span>改造</span>
      </button>
      <button
        onClick={() => setActiveTab('herbarium')}
        className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 shrink-0 relative ${
          activeTab === 'herbarium'
            ? 'bg-mystic-gold text-stone-900 font-bold'
            : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
        }`}
      >
        <BookOpen size={16} />
        <span>图鉴</span>
        {grotto.herbarium && grotto.herbarium.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {grotto.herbarium.length}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          洞府
          {grotto.level > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-stone-700 text-stone-300 border border-stone-600 font-normal">
              {currentConfig?.name || `等级 ${grotto.level}`}
            </span>
          )}
        </span>
      }
      titleIcon={<Home className="text-mystic-gold" size={24} />}
      titleExtra={titleExtra}
      size="4xl"
      height="full"
      showHeaderBorder={false}
    >
      {/* Content */}
      <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={64} />
                  <p className="text-stone-300 text-lg mb-2 font-bold">你还没有洞府</p>
                  <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
                    购买洞府可以获得聚灵阵修炼加成、灵草种植功能和生长速度提升
                  </p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-3 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors shadow-lg"
                  >
                    前往购买
                  </button>
                </div>
              ) : (
                <>
                  {/* 洞府信息卡片 */}
                  <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-200">
                          {currentConfig?.name || '未知洞府'}
                        </h3>
                        <p className="text-stone-400 text-sm mt-1">{currentConfig?.description}</p>
                      </div>
                      <span className="text-stone-200 text-sm bg-mystic-gold/20 px-3 py-1 rounded border border-mystic-gold/50 font-bold">
                        Lv.{grotto.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-mystic-gold/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="text-mystic-gold" size={18} />
                          <span className="text-stone-400 text-xs font-medium">修炼加成</span>
                        </div>
                        <p className="text-2xl font-bold text-mystic-gold">
                          +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                        </p>
                        {grotto.spiritArrayEnhancement > 0 && (
                          <p className="text-xs text-stone-500 mt-1">
                            基础 +{(grotto.expRateBonus * 100).toFixed(0)}% | 改造 +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-green-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Sprout className="text-green-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">生长速度</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          +{(grotto.growthSpeedBonus * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-stone-500 mt-1">减少生长时间</p>
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-blue-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="text-blue-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">种植槽位</span>
                        </div>
                        <p className="text-2xl font-bold text-stone-200">
                          {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0) ? '已满' : '可用'}
                        </p>
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-purple-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="text-purple-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">图鉴进度</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                          {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}% 完成
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 自动收获开关 */}
                  {currentConfig?.autoHarvest && (
                    <div className="bg-ink-900 p-4 rounded-lg border border-stone-700 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${grotto.autoHarvest ? 'bg-green-900/30 border-2 border-green-500' : 'bg-stone-800 border-2 border-stone-700'}`}>
                            <Zap className={grotto.autoHarvest ? 'text-green-400' : 'text-stone-500'} size={20} />
                          </div>
                          <div>
                            <p className="text-stone-200 font-bold flex items-center gap-2">
                              自动收获
                              {grotto.autoHarvest && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">开启中</span>
                              )}
                            </p>
                            <p className="text-stone-400 text-sm mt-0.5">
                              {grotto.autoHarvest ? '成熟的灵草将自动收获到背包' : '需要手动收获灵草'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={onToggleAutoHarvest}
                          className={`px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                            grotto.autoHarvest
                              ? 'bg-green-600 text-white hover:bg-green-700 border-2 border-green-500'
                              : 'bg-stone-700 text-stone-300 hover:bg-stone-600 border-2 border-stone-600'
                          }`}
                        >
                          {grotto.autoHarvest ? '✓ 已开启' : '○ 已关闭'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 种植的灵草 */}
                  {grotto.plantedHerbs.length > 0 && (
                    <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                          <Sprout size={20} />
                          种植中的灵草
                          {matureHerbsCount > 0 && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              {matureHerbsCount} 可收获
                            </span>
                          )}
                        </h3>
                        {matureHerbsCount > 0 && (
                          <button
                            onClick={onHarvestAll}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold flex items-center gap-2 shadow-lg border-2 border-green-500"
                          >
                            <CheckCircle size={16} />
                            批量收获
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {grotto.plantedHerbs.map((herb, index) => {
                          const now = Date.now();
                          const isMature = now >= herb.harvestTime;
                          const remaining = Math.max(0, herb.harvestTime - now);
                          const progress = calculateProgress(herb.plantTime, herb.harvestTime);

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isMature
                                  ? 'bg-green-900/30 border-green-500 shadow-lg ring-2 ring-green-500/30'
                                  : 'bg-stone-800/50 border-stone-700 hover:border-stone-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-stone-200 text-lg">{herb.herbName}</span>
                                    {herb.isMutated && (
                                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                        <Sparkles size={12} />
                                        变异
                                      </span>
                                    )}
                                    <span className="text-stone-400 text-sm bg-stone-700 px-2 py-0.5 rounded">
                                      x{herb.isMutated && herb.mutationBonus ? Math.floor(herb.quantity * herb.mutationBonus) : herb.quantity}
                                    </span>
                                    {isMature && (
                                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        可收获
                                      </span>
                                    )}
                                  </div>

                                  {!isMature && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="flex items-center gap-1.5 text-stone-300">
                                          <Clock size={14} className="text-blue-400" />
                                          <span>剩余时间</span>
                                        </span>
                                        <span className="font-bold text-mystic-gold">{formatGrottoTime(remaining)}</span>
                                      </div>
                                      <div className="w-full bg-stone-700/50 rounded-full h-2.5 overflow-hidden border border-stone-600">
                                        <div
                                          className="bg-gradient-to-r from-mystic-gold to-yellow-500 h-full transition-all duration-1000 shadow-lg"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between mt-1.5">
                                        <p className="text-xs text-stone-500">生长进度</p>
                                        <p className="text-xs font-bold text-mystic-gold">{progress}%</p>
                                      </div>
                                    </div>
                                  )}

                                  {isMature && (
                                    <p className="text-sm text-green-300 flex items-center gap-1">
                                      <CheckCircle size={14} />
                                      已成熟，可以收获了！
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!isMature && (
                                    <button
                                      onClick={() => onSpeedupHerb(index)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold flex items-center gap-1.5 shadow-lg border-2 border-blue-500"
                                      title="使用灵石加速生长"
                                    >
                                      <Gauge size={14} />
                                      加速
                                    </button>
                                  )}
                                  {isMature && (
                                    <button
                                      onClick={() => onHarvestHerb(index)}
                                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-lg border-2 border-green-500"
                                    >
                                      <CheckCircle size={14} className="inline mr-1" />
                                      收获
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {grotto.plantedHerbs.length === 0 && (
                    <div className="bg-ink-900 p-8 rounded-lg border border-stone-700 text-center">
                      <Sprout className="mx-auto text-stone-500 mb-3" size={48} />
                      <p className="text-stone-400">还没有种植任何灵草</p>
                      <p className="text-stone-500 text-sm mt-2">前往"种植"标签页开始种植</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <ArrowUp size={20} />
                购买/升级洞府
              </h3>
              {availableUpgrades.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400">
                    {grotto.level === 0
                      ? '暂无可用洞府'
                      : '🎉 恭喜！已达到最高等级'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableUpgrades.map((config) => {
                    const canAfford = player.spiritStones >= config.cost;
                    const shortage = config.cost - player.spiritStones;

                    return (
                      <div
                        key={config.level}
                        className={`bg-ink-900 p-5 rounded-lg border-2 shadow-lg transition-all ${
                          canAfford
                            ? 'border-stone-700 hover:border-mystic-gold hover:shadow-mystic-gold/20'
                            : 'border-stone-700/50 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-stone-200">
                                {config.name}
                              </h4>
                              <span className="text-stone-400 text-sm bg-stone-800 px-2 py-1 rounded border border-stone-700">
                                等级 {config.level}
                              </span>
                            </div>
                            <p className="text-stone-400 text-sm mb-4">{config.description}</p>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">修炼加成</span>
                                <span className="text-mystic-gold font-bold text-lg">
                                  +{(config.expRateBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">生长速度</span>
                                <span className="text-green-400 font-bold text-lg">
                                  +{(config.growthSpeedBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">种植槽位</span>
                                <span className="text-stone-200 font-bold text-lg">{config.maxHerbSlots}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => onUpgradeGrotto(config.level)}
                              disabled={!canAfford}
                              className={`px-6 py-3 rounded font-bold transition-colors flex items-center gap-2 shadow-lg ${
                                canAfford
                                  ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600'
                                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              <Coins size={20} />
                              <span>{config.cost.toLocaleString()}</span>
                            </button>
                            {!canAfford && (
                              <p className="text-xs text-red-400 text-right">
                                还差 {shortage.toLocaleString()} 灵石
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                  <Sprout size={20} />
                  种植灵草
                </h3>
                {grotto.level > 0 && (
                  <div className="text-stone-400 text-sm bg-stone-800 px-3 py-1 rounded border border-stone-700">
                    已种植: {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                  </div>
                )}
              </div>

              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400 mb-2">请先购买洞府才能种植灵草</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-4 py-2 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors mt-4"
                  >
                    前往购买
                  </button>
                </div>
              ) : availableHerbs.length === 0 ? (
                <div className="text-center py-12">
                  <Sprout className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400">背包中没有可种植的灵草种子</p>
                  <p className="text-stone-500 text-sm mt-2">通过历练、商店或其他方式获得种子</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableHerbs.map((herb) => {
                    // 严格查找：名称和类型都必须匹配，必须是草药类型，排除丹药
                    const seedItem = player.inventory.find(
                      (item) => item.name === herb.name && item.type === ItemType.Herb
                    );
                    const isFull = grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0);
                    const levelRequirementMet = grotto.level >= (herb.grottoLevelRequirement || 1);
                    const canPlant = !isFull && seedItem && seedItem.quantity > 0 && levelRequirementMet;

                    const growthMinutes = Math.floor(herb.growthTime / 60000);
                    const growthHours = Math.floor(growthMinutes / 60);
                    const growthMins = growthMinutes % 60;
                    const timeText = growthHours > 0
                      ? `${growthHours}小时${growthMins}分钟`
                      : `${growthMinutes}分钟`;

                    return (
                      <div
                        key={herb.id}
                        className={`bg-ink-900 p-4 rounded-lg border-2 transition-all ${
                          canPlant
                            ? 'border-stone-700 hover:border-green-500 shadow-lg hover:shadow-green-500/20'
                            : 'border-stone-700/50 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="font-bold text-lg"
                                style={{ color: getRarityTextColor(herb.rarity) }}
                              >
                                {herb.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                                {herb.rarity}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-stone-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>生长时间: {timeText}</span>
                              </div>
                              <div>
                                收获: {herb.harvestQuantity.min}-{herb.harvestQuantity.max} 个
                              </div>
                              {herb.grottoLevelRequirement && (
                                <div className={`text-xs ${levelRequirementMet ? 'text-green-400' : 'text-red-400'}`}>
                                  {levelRequirementMet ? '✓' : '✗'} 需要{herb.grottoLevelRequirement}级洞府
                                </div>
                              )}
                            </div>

                            <div className={`text-xs ${(!seedItem || seedItem.quantity === 0) ? 'text-red-400' : 'text-stone-500'}`}>
                              拥有种子: <span className={`font-bold ${(!seedItem || seedItem.quantity === 0) ? 'text-red-300' : 'text-stone-300'}`}>{seedItem?.quantity || 0}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onPlantHerb(herb.id || herb.name)}
                            disabled={!canPlant}
                            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex-shrink-0 ${
                              canPlant
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg border-2 border-green-500'
                                : 'bg-stone-700 text-stone-500 cursor-not-allowed border-2 border-stone-600'
                            }`}
                          >
                            {(!seedItem || seedItem.quantity < 1)
                              ? '种子不足'
                              : !levelRequirementMet
                              ? `需${herb.grottoLevelRequirement}级`
                              : isFull
                              ? '槽位已满'
                              : '✓ 种植'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enhancement' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <Zap size={20} />
                聚灵阵改造
              </h3>
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400 mb-2">请先购买洞府才能改造聚灵阵</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-4 py-2 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors mt-4"
                  >
                    前往购买
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-mystic-gold/20 border-2 border-mystic-gold/50">
                        <Zap className="text-mystic-gold" size={24} />
                      </div>
                      <div className="flex-1">
                        <span className="text-stone-200 font-bold text-lg block">当前改造加成</span>
                        <p className="text-3xl font-bold text-mystic-gold mt-1">
                          +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-stone-800/50 p-3 rounded-lg border border-stone-700/50">
                      <p className="text-stone-400 text-sm">
                        <span className="text-stone-300">基础加成:</span> +{(grotto.expRateBonus * 100).toFixed(0)}% |{' '}
                        <span className="text-mystic-gold font-bold">总加成:</span> +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {SPIRIT_ARRAY_ENHANCEMENTS.map((enhancement) => {
                      const meetsLevelRequirement = grotto.level >= enhancement.grottoLevelRequirement;
                      const hasMaterials = enhancement.materials.every((material) => {
                        const item = player.inventory.find((i) => i.name === material.name);
                        return item && item.quantity >= material.quantity;
                      });
                      const canEnhance = meetsLevelRequirement && hasMaterials;

                      return (
                        <div
                          key={enhancement.id}
                          className={`bg-ink-900 p-5 rounded-lg border-2 transition-all ${
                            canEnhance
                              ? 'border-stone-700 hover:border-mystic-gold shadow-lg hover:shadow-mystic-gold/20'
                              : 'border-stone-700/50 opacity-75'
                          }`}
                        >
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-stone-200 text-lg">{enhancement.name}</span>
                              <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded border border-stone-700">
                                需要{enhancement.grottoLevelRequirement}级洞府
                              </span>
                            </div>
                            <p className="text-stone-400 text-sm mb-4">{enhancement.description}</p>

                            <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 mb-4">
                              <div className="text-stone-300 text-base mb-3 font-bold flex items-center gap-2">
                                <Zap size={18} className="text-mystic-gold" />
                                加成: +{(enhancement.expRateBonus * 100).toFixed(0)}% 修炼速度
                              </div>
                              <div className="text-stone-400 text-sm mb-2 font-medium">所需材料:</div>
                              <div className="flex flex-wrap gap-2">
                                {enhancement.materials.map((material, idx) => {
                                  const item = player.inventory.find((i) => i.name === material.name);
                                  const hasEnough = item && item.quantity >= material.quantity;
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-sm px-3 py-1.5 rounded border ${
                                        hasEnough
                                          ? 'bg-green-900/50 text-green-300 border-green-700'
                                          : 'bg-red-900/50 text-red-300 border-red-700'
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

                          <button
                            onClick={() => onEnhanceSpiritArray(enhancement.id)}
                            disabled={!canEnhance}
                            className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
                              canEnhance
                                ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600 shadow-lg border-2 border-yellow-500'
                                : 'bg-stone-700 text-stone-500 cursor-not-allowed border-2 border-stone-600'
                            }`}
                          >
                            {!meetsLevelRequirement
                              ? `需要${enhancement.grottoLevelRequirement}级洞府`
                              : !hasMaterials
                              ? '材料不足'
                              : '✓ 进行改造'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'herbarium' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                灵草图鉴
              </h3>

              {/* 图鉴统计 */}
              <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-purple-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="text-purple-400" size={18} />
                      <div className="text-stone-400 text-xs font-medium">已收集</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                    </div>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-mystic-gold/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-mystic-gold" size={18} />
                      <div className="text-stone-400 text-xs font-medium">收集进度</div>
                    </div>
                    <div className="text-2xl font-bold text-mystic-gold">
                      {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-blue-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-blue-400" size={18} />
                      <div className="text-stone-400 text-xs font-medium">今日加速</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const lastReset = grotto.lastSpeedupResetDate || today;
                        return lastReset === today ? (grotto.dailySpeedupCount || 0) : 0;
                      })()} / {SPEEDUP_CONFIG.dailyLimit}
                    </div>
                  </div>
                </div>

                {/* 图鉴奖励进度 */}
                {HERBARIUM_REWARDS.map((reward) => {
                  const isClaimed = player.achievements.includes(`herbarium-${reward.herbCount}`);
                  const isUnlocked = (grotto.herbarium?.length || 0) >= reward.herbCount;
                  return (
                    <div
                      key={reward.herbCount}
                      className={`p-3 rounded-lg border mb-2 ${
                        isClaimed
                          ? 'bg-green-900/30 border-green-600'
                          : isUnlocked
                          ? 'bg-yellow-900/30 border-yellow-600'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-stone-200 font-bold">
                            收集 {reward.herbCount} 种灵草
                            {isClaimed && <span className="ml-2 text-green-400 text-sm">✓ 已领取</span>}
                            {!isClaimed && isUnlocked && <span className="ml-2 text-yellow-400 text-sm">可领取</span>}
                          </div>
                          <div className="text-stone-400 text-sm mt-1">
                            奖励:{' '}
                            {reward.reward.exp && `${reward.reward.exp} 修为 `}
                            {reward.reward.spiritStones && `${reward.reward.spiritStones} 灵石 `}
                            {reward.reward.attributePoints && `${reward.reward.attributePoints} 属性点 `}
                            {reward.reward.title && `称号: ${reward.reward.title}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 灵草列表 */}
              <div className="bg-ink-900 p-5 rounded-lg border border-stone-700">
                <h4 className="text-stone-200 font-bold mb-4">已收集的灵草</h4>
                {grotto.herbarium && grotto.herbarium.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PLANTABLE_HERBS.map((herb) => {
                      const isCollected = grotto.herbarium?.includes(herb.name);
                      return (
                        <div
                          key={herb.id}
                          className={`p-3 rounded-lg border text-center ${
                            isCollected
                              ? 'bg-stone-800 border-stone-600'
                              : 'bg-stone-900/50 border-stone-800 opacity-50'
                          }`}
                        >
                          <div
                            className={`font-bold text-sm mb-1 ${
                              isCollected ? getRarityTextColor(herb.rarity) : 'text-stone-600'
                            }`}
                          >
                            {herb.name}
                          </div>
                          <div className="text-xs text-stone-500">{herb.rarity}</div>
                          {isCollected && (
                            <div className="mt-2">
                              <CheckCircle className="mx-auto text-green-400" size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto text-stone-500 mb-3" size={48} />
                    <p className="text-stone-400">还没有收集任何灵草</p>
                    <p className="text-stone-500 text-sm mt-2">种植并收获灵草即可记录到图鉴</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </Modal>
  );
};

export default GrottoModal;
