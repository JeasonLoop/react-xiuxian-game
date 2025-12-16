import React, { useState, useMemo, useEffect } from 'react';
import { X, Star, Award, Info, Zap, BarChart3, TrendingUp, Sparkles, BookOpen, Users } from 'lucide-react';
import { PlayerStats,  ItemRarity } from '../types';
import {
  TALENTS,
  TITLES,
  TITLE_SET_EFFECTS,
  RARITY_MULTIPLIERS,
  ACHIEVEMENTS,
  CULTIVATION_ARTS,
  REALM_ORDER,
  INHERITANCE_ROUTES,
  INHERITANCE_SKILLS,
} from '../constants';
import { getItemStats } from '../utils/itemUtils';
import { getRarityTextColor } from '../utils/rarityUtils';
import { showConfirm, showError } from '../utils/toastUtils';
import { SAVE_KEY } from '../utils/gameUtils';
import { calculateTitleEffects, getActiveSetEffects } from '../utils/titleUtils';
import { useInheritanceHandlers } from '../views/inheritance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onSelectTalent: (talentId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onAllocateAttribute: (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => void;
  onAllocateAllAttributes?: (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => void;
  onUseInheritance?: () => void;
  onResetAttributes?: () => void;
  addLog?: (message: string, type?: string) => void;
}

const CharacterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  onSelectTalent,
  onSelectTitle,
  onAllocateAttribute,
  onAllocateAllAttributes,
  onUseInheritance,
  onResetAttributes,
  addLog = (msg: string) => console.log(msg),
}) => {
  if (!isOpen) return null;

  // 传承处理函数
  const inheritanceHandlers = useInheritanceHandlers({
    player,
    setPlayer,
    addLog,
  });

  const [activeTab, setActiveTab] = useState<'character' | 'statistics'>('character');
  const [showAttributeDetails, setShowAttributeDetails] = useState(false);
  const [showTitleDetails, setShowTitleDetails] = useState(false);
  const [showInheritanceDetails, setShowInheritanceDetails] = useState(false);
  const [selectedInheritanceRoute, setSelectedInheritanceRoute] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const currentTalent = TALENTS.find((t) => t.id === player.talentId);
  const currentTitle = TITLES.find((t) => t.id === player.titleId);

  // 获取已解锁的称号列表
  const unlockedTitles = useMemo(() => {
    return TITLES.filter(t => (player.unlockedTitles || []).includes(t.id));
  }, [player.unlockedTitles]);

  // 计算当前称号效果（包括套装效果）
  const titleEffects = useMemo(() => {
    return calculateTitleEffects(player.titleId, player.unlockedTitles || []);
  }, [player.titleId, player.unlockedTitles]);

  // 获取激活的套装效果
  const activeSetEffects = useMemo(() => {
    return getActiveSetEffects(player.titleId, player.unlockedTitles || []);
  }, [player.titleId, player.unlockedTitles]);

  // 获取游戏开始时间（从存档时间戳计算）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const saveData = JSON.parse(saved);
        if (saveData.timestamp) {
          // 从最早的存档时间戳作为游戏开始时间（简化处理）
          setGameStartTime(saveData.timestamp);
        }
      }
    } catch (e) {
      console.error('获取游戏开始时间失败:', e);
    }
  }, []);

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

    // 称号加成（包括套装效果）
    const titleEffects = calculateTitleEffects(player.titleId, player.unlockedTitles || []);
    const titleStats = {
      attack: titleEffects.attack,
      defense: titleEffects.defense,
      hp: titleEffects.hp,
      spirit: titleEffects.spirit,
      physique: titleEffects.physique,
      speed: titleEffects.speed,
    };

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
      title: titleStats,
      art: artStats,
      equipment: equipmentStats,
    };
  };

  const attributeSources = calculateAttributeSources();

  // 使用统一的工具函数获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    return getRarityTextColor(rarity as ItemRarity);
  };

  // 计算游戏时长
  const gameDuration = useMemo(() => {
    if (!gameStartTime) return null;
    const now = Date.now();
    const duration = now - gameStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    const hoursRemainder = hours % 24;

    if (days > 0) {
      return `${days}天 ${hoursRemainder}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }, [gameStartTime]);

  // 计算统计数据
  const statistics = useMemo(() => {
    const stats = player.statistics || {
      killCount: 0,
      meditateCount: 0,
      adventureCount: 0,
      equipCount: 0,
      petCount: 0,
      recipeCount: 0,
      artCount: 0,
      breakthroughCount: 0,
      secretRealmCount: 0,
    };

    // 计算额外统计数据
    const totalInventoryItems = player.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalEquippedItems = Object.keys(player.equippedItems).filter(
      (key) => player.equippedItems[key as keyof typeof player.equippedItems]
    ).length;
    const totalSpiritStonesEarned = player.spiritStones; // 当前灵石（简化，实际应该累计）
    const totalExpEarned = player.exp; // 当前修为（简化，实际应该累计）
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const maxRealmIndex = REALM_ORDER.length - 1;
    const realmProgress = ((realmIndex * 9 + player.realmLevel) / (maxRealmIndex * 9 + 9)) * 100;

    return {
      ...stats,
      totalInventoryItems,
      totalEquippedItems,
      totalSpiritStonesEarned,
      totalExpEarned,
      realmProgress: Math.min(100, realmProgress),
      gameDays: player.gameDays || 1,
      unlockedArtsCount: (player.unlockedArts || []).length,
      learnedArtsCount: player.cultivationArts.length,
    };
  }, [player]);

  // 根据境界计算属性点实际增加值
  const attributeGains = useMemo(() => {
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const multiplier = Math.pow(2, realmIndex + 1);

    // 基础属性增加值
    const baseAttack = 5;
    const baseDefense = 3;
    const baseHp = 20;
    const baseSpirit = 3;
    const basePhysique = 3;
    const basePhysiqueHp = 10; // 体魄额外增加的气血
    const baseSpeed = 2;

    return {
      attack: Math.floor(baseAttack * multiplier),
      defense: Math.floor(baseDefense * multiplier),
      hp: Math.floor(baseHp * multiplier),
      spirit: Math.floor(baseSpirit * multiplier),
      physique: Math.floor(basePhysique * multiplier),
      physiqueHp: Math.floor(basePhysiqueHp * multiplier),
      speed: Math.floor(baseSpeed * multiplier),
    };
  }, [player.realm]);

  // 处理一键分配的确认
  const handleAllocateAllWithConfirm = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!onAllocateAllAttributes) return;

    const attributeNames: Record<typeof type, string> = {
      attack: '攻击',
      defense: '防御',
      hp: '气血',
      spirit: '神识',
      physique: '体魄',
      speed: '速度',
    };

    const attributeName = attributeNames[type];
    const points = player.attributePoints;
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const multiplier = Math.pow(2, realmIndex + 1);

    // 计算总增加值
    let totalGain = 0;
    let totalPhysiqueGain = 0;
    let totalHpGain = 0;

    if (type === 'attack') {
      totalGain = Math.floor(5 * multiplier * points);
    } else if (type === 'defense') {
      totalGain = Math.floor(3 * multiplier * points);
    } else if (type === 'hp') {
      totalGain = Math.floor(20 * multiplier * points);
    } else if (type === 'spirit') {
      totalGain = Math.floor(3 * multiplier * points);
    } else if (type === 'physique') {
      totalPhysiqueGain = Math.floor(3 * multiplier * points);
      totalHpGain = Math.floor(10 * multiplier * points);
    } else if (type === 'speed') {
      totalGain = Math.floor(2 * multiplier * points);
    }

    const gainText =
      type === 'physique'
        ? `+${totalPhysiqueGain}体魄, +${totalHpGain}气血`
        : `+${totalGain}`;

    showConfirm(
      `确定要将所有 ${points} 点属性点一键分配给【${attributeName}】吗？\n\n预计增加: ${gainText}\n\n此操作不可撤销！`,
      '确认分配',
      () => {
        onAllocateAllAttributes(type);
      }
    );
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
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700">
          <div className="p-3 md:p-4 flex justify-between items-center">
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
          {/* 标签页切换 */}
          <div className="flex border-t border-stone-700">
            <button
              onClick={() => setActiveTab('character')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'character'
                  ? 'bg-stone-700 text-mystic-gold border-b-2 border-mystic-gold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Info size={16} />
                角色信息
              </div>
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'statistics'
                  ? 'bg-stone-700 text-mystic-gold border-b-2 border-mystic-gold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                数据统计
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'character' ? (
            <>
          {/* 传承系统 */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded p-4 border-2 border-purple-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="text-purple-400" size={20} />
                传承系统
              </h3>
              <button
                onClick={() => setShowInheritanceDetails(!showInheritanceDetails)}
                className="text-xs text-purple-300 hover:text-purple-200"
              >
                {showInheritanceDetails ? '收起详情' : '展开详情'}
              </button>
            </div>

            {player.inheritanceLevel > 0 ? (
              <div>
                <p className="text-sm text-stone-300 mb-2">
                  传承等级: <span className="font-bold text-purple-300">{player.inheritanceLevel}</span> / 4
                </p>
                {player.inheritanceRoute && (
                  <p className="text-sm text-stone-300 mb-2">
                    传承路线: <span className="font-bold text-purple-300">
                      {INHERITANCE_ROUTES.find(r => r.id === player.inheritanceRoute)?.name || '未知'}
                    </span>
                  </p>
                )}
                {player.inheritanceExp > 0 && (
                  <p className="text-sm text-stone-300 mb-2">
                    传承经验: {player.inheritanceExp}
                  </p>
                )}
                <div className="flex gap-2 mb-3">
                  {player.inheritanceLevel < 4 && (
                    <button
                      onClick={() => inheritanceHandlers.handleCultivateInheritance('level')}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                    >
                      提升等级 ({(player.inheritanceLevel + 1) * 5000} 灵石)
                    </button>
                  )}
                  <button
                    onClick={() => inheritanceHandlers.handleCultivateInheritance('exp')}
                    className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
                  >
                    修炼经验 (1000 灵石)
                  </button>
                </div>
                {onUseInheritance && (
                  <button
                    onClick={onUseInheritance}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded border border-purple-400 font-bold text-white transition-all"
                  >
                    使用传承突破境界
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400 mb-3">
                尚未获得传承。传承可以通过历练获得。
              </p>
            )}

            {showInheritanceDetails && (
              <div className="mt-4 pt-4 border-t border-purple-700/50 space-y-4">
                {/* 传承路线选择 */}
                {!player.inheritanceRoute && (
                  <div>
                    <h4 className="text-sm font-bold text-purple-300 mb-2">选择传承路线</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {INHERITANCE_ROUTES.map((route) => {
                        const canUnlock = !route.unlockRequirement?.realm ||
                          REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(route.unlockRequirement.realm);
                        return (
                          <div
                            key={route.id}
                            className={`p-3 rounded border ${
                              canUnlock
                                ? 'border-purple-500 bg-purple-900/30 hover:bg-purple-900/50 cursor-pointer'
                                : 'border-stone-700 bg-stone-900/50 opacity-50'
                            }`}
                            onClick={() => {
                              if (canUnlock && !player.inheritanceRoute) {
                                inheritanceHandlers.handleSelectInheritanceRoute(route.id);
                              } else if (!canUnlock) {
                                showError(`需要达到 ${route.unlockRequirement?.realm} 境界才能选择此传承。`);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold ${getRarityColor(route.rarity)}`}>
                                {route.name}
                              </span>
                              <span className="text-xs text-stone-500">({route.rarity})</span>
                            </div>
                            <p className="text-xs text-stone-400 mb-2">{route.description}</p>
                            {route.unlockRequirement?.realm && !canUnlock && (
                              <p className="text-xs text-red-400">
                                需要: {route.unlockRequirement.realm}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 已选择的传承路线详情 */}
                {player.inheritanceRoute && (
                  <div>
                    <h4 className="text-sm font-bold text-purple-300 mb-2">传承技能</h4>
                    <div className="space-y-2">
                      {INHERITANCE_SKILLS
                        .filter(skill => skill.route === player.inheritanceRoute)
                        .map((skill) => {
                          const isLearned = player.inheritanceSkills?.includes(skill.id);
                          const canLearn = player.inheritanceLevel >= skill.unlockLevel;
                          return (
                            <div
                              key={skill.id}
                              className={`p-2 rounded border ${
                                isLearned
                                  ? 'border-green-500 bg-green-900/30'
                                  : canLearn
                                  ? 'border-purple-500 bg-purple-900/30'
                                  : 'border-stone-700 bg-stone-900/30 opacity-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm">{skill.name}</span>
                                    {isLearned && (
                                      <span className="text-xs text-green-400">✓ 已学习</span>
                                    )}
                                    {!isLearned && canLearn && (
                                      <span className="text-xs text-purple-400">可学习</span>
                                    )}
                                    {!canLearn && (
                                      <span className="text-xs text-stone-500">
                                        需要传承等级 {skill.unlockLevel}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-stone-400 mb-1">{skill.description}</p>
                                  {skill.passiveEffect && (
                                    <p className="text-xs text-yellow-400 italic">
                                      {skill.passiveEffect.description}
                                    </p>
                                  )}
                                  {!isLearned && canLearn && (
                                    <button
                                      onClick={() => inheritanceHandlers.handleLearnInheritanceSkill(skill.id)}
                                      className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                    >
                                      学习技能 (消耗 {skill.unlockLevel * 100} 经验)
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
              </div>
            )}
          </div>

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
              <div>
                <span className="text-stone-400">声望:</span>{' '}
                <span className="text-mystic-gold font-bold">{player.reputation || 0}</span>
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
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('attack')}
                    className="flex-1 px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded border border-red-700"
                  >
                    攻击 +{attributeGains.attack}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('attack')}
                      className="px-2 py-2 text-sm bg-red-800 hover:bg-red-700 rounded border border-red-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到攻击`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('defense')}
                    className="flex-1 px-3 py-2 text-sm bg-blue-900 hover:bg-blue-800 rounded border border-blue-700"
                  >
                    防御 +{attributeGains.defense}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('defense')}
                      className="px-2 py-2 text-sm bg-blue-800 hover:bg-blue-700 rounded border border-blue-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到防御`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('hp')}
                    className="flex-1 px-3 py-2 text-sm bg-green-900 hover:bg-green-800 rounded border border-green-700"
                  >
                    气血 +{attributeGains.hp}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('hp')}
                      className="px-2 py-2 text-sm bg-green-800 hover:bg-green-700 rounded border border-green-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到气血`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('spirit')}
                    className="flex-1 px-3 py-2 text-sm bg-purple-900 hover:bg-purple-800 rounded border border-purple-700"
                  >
                    神识 +{attributeGains.spirit}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('spirit')}
                      className="px-2 py-2 text-sm bg-purple-800 hover:bg-purple-700 rounded border border-purple-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到神识`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('physique')}
                    className="flex-1 px-3 py-2 text-sm bg-orange-900 hover:bg-orange-800 rounded border border-orange-700"
                  >
                    体魄 +{attributeGains.physique}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('physique')}
                      className="px-2 py-2 text-sm bg-orange-800 hover:bg-orange-700 rounded border border-orange-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到体魄`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAllocateAttribute('speed')}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-900 hover:bg-yellow-800 rounded border border-yellow-700"
                  >
                    速度 +{attributeGains.speed}
                  </button>
                  {onAllocateAllAttributes && (
                    <button
                      onClick={() => handleAllocateAllWithConfirm('speed')}
                      className="px-2 py-2 text-sm bg-yellow-800 hover:bg-yellow-700 rounded border border-yellow-600 flex items-center justify-center"
                      title={`一键分配所有 ${player.attributePoints} 点到速度`}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                </div>
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="text-yellow-400" size={20} />
                称号系统
                {unlockedTitles.length > 0 && (
                  <span className="text-xs text-stone-500">
                    ({unlockedTitles.length}/{TITLES.length})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowTitleDetails(!showTitleDetails)}
                className="text-xs text-stone-400 hover:text-stone-300"
              >
                {showTitleDetails ? '收起' : '展开'}
              </button>
            </div>

            {/* 当前装备的称号 */}
            {currentTitle ? (
              <div className="bg-stone-900 rounded p-4 border-2 border-yellow-500/50 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${getRarityColor(currentTitle.rarity || '普通')}`}>
                        {currentTitle.name}
                      </span>
                      {currentTitle.rarity && (
                        <span className="text-xs text-stone-500">({currentTitle.rarity})</span>
                      )}
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                        已装备
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mb-1">
                      {currentTitle.description}
                    </p>
                    <p className="text-xs text-stone-500 mb-2">
                      获得条件: {currentTitle.requirement}
                    </p>

                    {/* 称号效果 */}
                    <div className="text-xs text-stone-400 space-y-1 mb-2">
                      {titleEffects.attack > 0 && <div>攻击 +{titleEffects.attack}</div>}
                      {titleEffects.defense > 0 && <div>防御 +{titleEffects.defense}</div>}
                      {titleEffects.hp > 0 && <div>气血 +{titleEffects.hp}</div>}
                      {titleEffects.spirit > 0 && <div>神识 +{titleEffects.spirit}</div>}
                      {titleEffects.physique > 0 && <div>体魄 +{titleEffects.physique}</div>}
                      {titleEffects.speed > 0 && <div>速度 +{titleEffects.speed}</div>}
                      {titleEffects.expRate > 0 && <div>修炼速度 +{(titleEffects.expRate * 100).toFixed(0)}%</div>}
                      {titleEffects.luck > 0 && <div>幸运 +{titleEffects.luck}</div>}
                    </div>

                    {/* 套装效果 */}
                    {activeSetEffects.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-yellow-500/30">
                        {activeSetEffects.map((setEffect) => (
                          <div key={setEffect.setName} className="text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Sparkles size={12} className="text-yellow-400" />
                              <span className="font-bold text-yellow-400">套装效果: {setEffect.setName}</span>
                            </div>
                            <p className="text-stone-400 mb-1">{setEffect.description}</p>
                            <div className="text-stone-400 space-y-1">
                              {setEffect.effects.attack > 0 && <div>攻击 +{setEffect.effects.attack}</div>}
                              {setEffect.effects.defense > 0 && <div>防御 +{setEffect.effects.defense}</div>}
                              {setEffect.effects.hp > 0 && <div>气血 +{setEffect.effects.hp}</div>}
                              {setEffect.effects.spirit > 0 && <div>神识 +{setEffect.effects.spirit}</div>}
                              {setEffect.effects.speed > 0 && <div>速度 +{setEffect.effects.speed}</div>}
                              {setEffect.effects.expRate > 0 && <div>修炼速度 +{(setEffect.effects.expRate * 100).toFixed(0)}%</div>}
                              {setEffect.effects.luck > 0 && <div>幸运 +{setEffect.effects.luck}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 mb-3">
                <p className="text-stone-500">未装备称号</p>
              </div>
            )}

            {/* 已解锁的称号列表 */}
            {showTitleDetails && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-stone-400 mb-2">已解锁的称号</h4>
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                  {unlockedTitles.map((title) => {
                    const isEquipped = title.id === player.titleId;
                    const isPartOfSet = title.setGroup && TITLE_SET_EFFECTS.some(se =>
                      se.titles.includes(title.id) &&
                      se.titles.every(tid => (player.unlockedTitles || []).includes(tid))
                    );

                    return (
                      <button
                        key={title.id}
                        onClick={() => !isEquipped && onSelectTitle(title.id)}
                        className={`text-left rounded p-3 border transition-colors ${
                          isEquipped
                            ? 'bg-yellow-900/30 border-yellow-500 cursor-default'
                            : 'bg-stone-900 hover:bg-stone-700 border-stone-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold ${getRarityColor(title.rarity || '普通')}`}>
                                {title.name}
                              </span>
                              {title.rarity && (
                                <span className="text-xs text-stone-500">({title.rarity})</span>
                              )}
                              {title.category && (
                                <span className="text-xs text-stone-500">[{title.category}]</span>
                              )}
                              {isEquipped && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                  已装备
                                </span>
                              )}
                              {isPartOfSet && !isEquipped && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                  套装可用
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mb-1">
                              {title.description}
                            </p>
                            <p className="text-xs text-stone-500">
                              {title.requirement}
                            </p>
                          </div>
                          {!isEquipped && (
                            <div className="ml-2 text-xs text-yellow-400">
                              点击装备
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {unlockedTitles.length === 0 && (
                    <div className="text-center text-stone-500 py-4">
                      尚未解锁任何称号
                    </div>
                  )}
                </div>

                {/* 未解锁的称号（可选显示） */}
                {TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm font-bold text-stone-400 cursor-pointer mb-2">
                      未解锁的称号 ({TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length})
                    </summary>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto mt-2">
                      {TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).map((title) => (
                        <div
                          key={title.id}
                          className="bg-stone-900/50 rounded p-3 border border-stone-800 opacity-60"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold ${getRarityColor(title.rarity || '普通')}`}>
                              {title.name}
                            </span>
                            {title.rarity && (
                              <span className="text-xs text-stone-500">({title.rarity})</span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500">{title.requirement}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
          </>
          ) : (
            <>
              {/* 数据统计面板 */}
              <div className="space-y-4">
                {/* 基础统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-400" size={20} />
                    基础统计
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">游戏天数</div>
                      <div className="text-xl font-bold text-mystic-gold">
                        {statistics.gameDays}
                      </div>
                    </div>
                    {gameDuration && (
                      <div className="bg-stone-800 rounded p-3 border border-stone-700">
                        <div className="text-stone-400 text-xs mb-1">游戏时长</div>
                        <div className="text-xl font-bold text-blue-400">
                          {gameDuration}
                        </div>
                      </div>
                    )}
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">当前境界</div>
                      <div className="text-xl font-bold text-purple-400">
                        {player.realm} {player.realmLevel}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">境界进度</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${statistics.realmProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-purple-400">
                          {statistics.realmProgress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">当前修为</div>
                      <div className="text-xl font-bold text-green-400">
                        {player.exp.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        / {player.maxExp.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">当前灵石</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {player.spiritStones.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 战斗统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-red-400" size={20} />
                    战斗统计
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">击杀敌人</div>
                      <div className="text-xl font-bold text-red-400">
                        {statistics.killCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">历练次数</div>
                      <div className="text-xl font-bold text-orange-400">
                        {statistics.adventureCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">秘境探索</div>
                      <div className="text-xl font-bold text-purple-400">
                        {statistics.secretRealmCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 修炼统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="text-yellow-400" size={20} />
                    修炼统计
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">打坐次数</div>
                      <div className="text-xl font-bold text-blue-400">
                        {statistics.meditateCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">突破次数</div>
                      <div className="text-xl font-bold text-purple-400">
                        {statistics.breakthroughCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">学习功法</div>
                      <div className="text-xl font-bold text-green-400">
                        {statistics.learnedArtsCount} / {statistics.unlockedArtsCount}
                      </div>
                      <div className="text-xs text-stone-500">
                        已学习 / 已解锁
                      </div>
                    </div>
                  </div>
                </div>

                {/* 收集统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Award className="text-yellow-400" size={20} />
                    收集统计
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">获得灵宠</div>
                      <div className="text-xl font-bold text-pink-400">
                        {statistics.petCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前拥有: {player.pets.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">装备物品</div>
                      <div className="text-xl font-bold text-cyan-400">
                        {statistics.equipCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前装备: {statistics.totalEquippedItems}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">解锁丹方</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {statistics.recipeCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前拥有: {(player.unlockedRecipes || []).length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">背包物品</div>
                      <div className="text-xl font-bold text-stone-300">
                        {statistics.totalInventoryItems.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        物品种类: {player.inventory.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">完成成就</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {player.achievements.length} / {ACHIEVEMENTS.length}
                      </div>
                      <div className="text-xs text-stone-500">
                        {((player.achievements.length / ACHIEVEMENTS.length) * 100).toFixed(1)}% 完成度
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterModal;
