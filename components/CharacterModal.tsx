import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Award, Info, Zap, BarChart3, TrendingUp, Sparkles, BookOpen, Users, Beaker, Package } from 'lucide-react';
import { PlayerStats, ItemRarity, RealmType, Title } from '../types';
import {
  TALENTS,
  TITLES,
  TITLE_SET_EFFECTS,
  ACHIEVEMENTS,
  CULTIVATION_ARTS,
  REALM_ORDER,
  INHERITANCE_ROUTES,
  INHERITANCE_SKILLS,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
  GOLDEN_CORE_METHOD_CONFIG,
  RARITY_MULTIPLIERS,
} from '../constants';
import { getGoldenCoreBonusMultiplier } from '../utils/cultivationUtils';
import { getItemStats } from '../utils/itemUtils';
import { getRarityTextColor } from '../utils/rarityUtils';
import { showConfirm, showError } from '../utils/toastUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  calculateTitleEffects,
  getActiveSetEffects,
} from '../utils/titleUtils';
import { useInheritanceHandlers } from '../views/inheritance';
import { getPlayerTotalStats, getActiveMentalArt } from '../utils/statUtils';
import { logger } from '../utils/logger';

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

// HoverableCard 组件 - 带 tooltip 的卡片
const HoverableCard: React.FC<{
  children: React.ReactNode;
  tooltipContent: React.ReactNode;
  borderColor?: string;
  width?: string;
  className?: string;
}> = ({ children, tooltipContent, borderColor = 'border-blue-500', width = 'w-64', className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip || !cardRef.current) return;

    const updatePosition = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = width === 'w-72' ? 288 : 256;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const gap = 8;

      let left = rect.right + gap;
      let top = rect.top;

      if (left + tooltipWidth > window.innerWidth) {
        left = rect.left - tooltipWidth - gap;
      }

      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 0);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showTooltip, width]);

  return (
    <>
      <div
        ref={cardRef}
        className={className}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed ${width} bg-stone-900 border-2 ${borderColor} rounded-lg p-3 shadow-xl z-[10000] pointer-events-none transition-opacity duration-200`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {tooltipContent}
        </div>,
        document.body
      )}
    </>
  );
};

// Tooltip 组件 - 使用 Portal 渲染到 body，避免被遮挡（保留用于向后兼容）
const Tooltip: React.FC<{
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement>;
  isVisible: boolean;
  borderColor?: string;
  width?: string;
}> = ({ children, targetRef, isVisible, borderColor = 'border-blue-500', width = 'w-64' }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !targetRef.current) return;

    const updatePosition = () => {
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = width === 'w-72' ? 288 : 256; // w-64 = 256px, w-72 = 288px
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const gap = 8; // ml-2 = 8px

      let left = rect.right + gap;
      let top = rect.top;

      // 检查是否会超出视口右侧
      if (left + tooltipWidth > window.innerWidth) {
        // 显示在左侧
        left = rect.left - tooltipWidth - gap;
      }

      // 检查是否会超出视口底部
      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      // 检查是否会超出视口顶部
      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 0); // 延迟一帧确保 DOM 更新
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, targetRef, width]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`fixed ${width} bg-stone-900 border-2 ${borderColor} rounded-lg p-3 shadow-xl z-[10000] pointer-events-none transition-opacity duration-200`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

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
  addLog = (msg: string) => logger.log(msg),
}) => {
  if (!isOpen) return null;

  // 使用 getPlayerTotalStats 获取包含心法加成的总属性
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const totalStats = useMemo(() => getPlayerTotalStats(player), [player]);

  // 传承处理函数
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inheritanceHandlers = useInheritanceHandlers({
    player,
    setPlayer,
    addLog,
  });

  const [activeTab, setActiveTab] = useState<'character' | 'statistics'>(
    'character'
  );
  const [showAttributeDetails, setShowAttributeDetails] = useState(false);
  const [showMarrowFeedModal, setShowMarrowFeedModal] = useState(false);
  const [selectedFeedItemId, setSelectedFeedItemId] = useState<string | null>(null);
  const [showTitleDetails, setShowTitleDetails] = useState(false);
  const [showInheritanceDetails, setShowInheritanceDetails] = useState(false);
  const [selectedInheritanceRoute, setSelectedInheritanceRoute] = useState<
    string | null
  >(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const currentTalent = TALENTS.find((t) => t.id === player.talentId);
  const currentTitle = TITLES.find((t) => t.id === player.titleId);

  // 检查称号是否满足解锁条件
  const checkTitleRequirement = useCallback(
    (title: Title, player: PlayerStats): boolean => {
      const requirement = title.requirement.toLowerCase();
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

    // 检查境界类称号
    if (requirement.includes('筑基期') || requirement.includes('筑基')) {
      return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.Foundation);
    }
    if (requirement.includes('金丹期') || requirement.includes('金丹')) {
      return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.GoldenCore);
    }
    if (requirement.includes('元婴期') || requirement.includes('元婴')) {
      return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.NascentSoul);
    }
    if (requirement.includes('渡劫飞升') || requirement.includes('飞升') || requirement.includes('长生境')) {
      return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.LongevityRealm);
    }

    // 检查战斗类称号
    if (requirement.includes('击败10个敌人') || requirement.includes('击败10')) {
      return stats.killCount >= 10;
    }
    if (requirement.includes('击败50个敌人') || requirement.includes('击败50')) {
      return stats.killCount >= 50;
    }
    if (requirement.includes('击败100个敌人') || requirement.includes('击败100')) {
      return stats.killCount >= 100;
    }

    // 检查探索类称号
    if (requirement.includes('完成20次历练') || requirement.includes('20次历练')) {
      return stats.adventureCount >= 20;
    }
    if (requirement.includes('完成50次历练') || requirement.includes('50次历练')) {
      return stats.adventureCount >= 50;
    }
    if (requirement.includes('完成100次历练') || requirement.includes('100次历练')) {
      return stats.adventureCount >= 100;
    }

    // 检查打坐类称号
    if (requirement.includes('打坐') || requirement.includes('冥想')) {
      const match = requirement.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1]);
        return stats.meditateCount >= count;
      }
    }

    // 检查收集类称号
    if (requirement.includes('收集') || requirement.includes('物品')) {
      const match = requirement.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1]);
        const uniqueItems = new Set(player.inventory.map((i) => i.name)).size;
        return uniqueItems >= count;
      }
    }

    // 初始称号默认解锁
    if (requirement.includes('初始称号')) {
      return true;
    }

    return false;
    },
    []
  );

  // 获取已解锁的称号列表
  const unlockedTitles = useMemo(() => {
    return TITLES.filter((t) => (player.unlockedTitles || []).includes(t.id));
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
      const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
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
    const titleEffects = calculateTitleEffects(
      player.titleId,
      player.unlockedTitles || []
    );
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

    // 传承加成 (体术类)
    let inheritanceStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    (player.inheritanceSkills || []).forEach((skillId) => {
      const skill = INHERITANCE_SKILLS.find((s) => s.id === skillId);
      if (skill && !skill.effects.expRate) {
        // 只有体术类传承技能永久加成
        inheritanceStats.attack += skill.effects.attack || 0;
        inheritanceStats.defense += skill.effects.defense || 0;
        inheritanceStats.hp += skill.effects.hp || 0;
        inheritanceStats.spirit += skill.effects.spirit || 0;
        inheritanceStats.physique += skill.effects.physique || 0;
        inheritanceStats.speed += skill.effects.speed || 0;
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

    // 当前激活心法加成
    const activeArt = getActiveMentalArt(player);
    let activeArtStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    if (activeArt && activeArt.type === 'mental') {
      activeArtStats.attack = activeArt.effects.attack || 0;
      activeArtStats.defense = activeArt.effects.defense || 0;
      activeArtStats.hp = activeArt.effects.hp || 0;
      activeArtStats.spirit = activeArt.effects.spirit || 0;
      activeArtStats.physique = activeArt.effects.physique || 0;
      activeArtStats.speed = activeArt.effects.speed || 0;
    }

    return {
      base: baseStats,
      talent: baseStats,
      title: titleStats,
      art: artStats,
      inheritance: inheritanceStats,
      equipment: equipmentStats,
      activeArt: activeArtStats,
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
    const totalInventoryItems = player.inventory.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalEquippedItems = Object.keys(player.equippedItems).filter(
      (key) => player.equippedItems[key as keyof typeof player.equippedItems]
    ).length;
    const totalSpiritStonesEarned = player.spiritStones; // 当前灵石（简化，实际应该累计）
    const totalExpEarned = player.exp; // 当前修为（简化，实际应该累计）
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const maxRealmIndex = REALM_ORDER.length - 1;
    const realmProgress =
      ((realmIndex * 9 + player.realmLevel) / (maxRealmIndex * 9 + 9)) * 100;

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
    // 确保realmIndex有效，防止NaN
    const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
    // 与useCharacterHandlers.ts保持一致：线性增长
    const multiplier = 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍

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
    // 确保realmIndex有效，防止NaN
    const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
    // 与useCharacterHandlers.ts保持一致：线性增长
    const multiplier = 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍

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
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl w-full h-[80vh] md:h-auto md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 bg-ink-800 md:rounded-t flex justify-between items-start">
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
        <div className="flex border-b border-stone-600 bg-ink-800">
            <button
              onClick={() => setActiveTab('character')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'character'
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
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'statistics'
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

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-6 bg-paper-800">
          {activeTab === 'character' ? (
            <>
              {/* 修炼系统信息 */}
              <div className="bg-gradient-to-r from-blue-900/50 to-green-900/50 rounded-lg p-6 border-2 border-blue-500 shadow-lg" style={{ overflow: 'visible' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <TrendingUp className="text-blue-400" size={24} />
                    修炼系统
                  </h3>
                  <div className="text-sm text-blue-300 bg-blue-800/50 px-3 py-1 rounded-full">
                    新修炼体系
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                  {/* 筑基奇物 */}
                  {player.foundationTreasure ? (() => {
                    const treasure = FOUNDATION_TREASURES[player.foundationTreasure];
                    const effects = treasure?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`气血+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`攻击+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`防御+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`神识+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`体魄+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`速度+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-blue-500"
                        className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl p-4 border-2 border-blue-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-blue-300 mb-2">{treasure?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{treasure?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-blue-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  特殊效果: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-blue-300">筑基奇物</h4>
                        </div>
                        <div className="text-lg font-semibold text-blue-200 mb-1">
                          {treasure?.name || '未知'}
                        </div>
                        <div className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          {treasure?.rarity || '普通'}品质
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-blue-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-blue-400">+{effectTexts.length - 3}项</div>
                            )}
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">筑基奇物</h4>
                      </div>
                      <div className="text-sm text-gray-500">未选择</div>
                    </div>
                  )}

                  {/* 金丹法数 */}
                  {(() => {
                    // 兼容旧存档：如果没有goldenCoreMethodCount，尝试计算
                    let methodCount = player.goldenCoreMethodCount;

                    // 检查是否曾经是金丹期（当前境界在金丹期之后）
                    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
                    const goldenCoreRealmIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
                    const wasGoldenCore = currentRealmIndex > goldenCoreRealmIndex;
                    const isGoldenCore = currentRealmIndex === goldenCoreRealmIndex;

                    // 如果当前是金丹期或曾经是金丹期，但没有法数，尝试从功法数量计算
                    if (!methodCount && (isGoldenCore || wasGoldenCore)) {
                      const artCount = player.cultivationArts?.length || 0;
                      methodCount = Math.min(artCount, 9);
                    }

                    // 如果有法数，显示金丹法数
                    if (methodCount && methodCount > 0) {
                      const cappedCount = Math.min(methodCount, 9);
                      const bonusMultiplier = getGoldenCoreBonusMultiplier(methodCount);
                      const bonusPercent = ((bonusMultiplier - 1) * 100).toFixed(0);
                      const difficulty = GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[cappedCount] || 1;

                      return (
                        <HoverableCard
                          borderColor="border-yellow-500"
                          className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-xl p-4 border-2 border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                          tooltipContent={
                            <>
                              <div className="text-sm font-bold text-yellow-300 mb-2">{cappedCount}法金丹详情</div>
                              <div className="text-xs text-stone-300 space-y-1">
                                <div className="text-yellow-300">天劫难度: {difficulty}x</div>
                                <div className="text-green-300">属性加成倍数: {bonusMultiplier.toFixed(1)}x</div>
                                <div className="text-green-300">属性加成: +{bonusPercent}%</div>
                                <div className="text-stone-400 mt-2 pt-2 border-t border-stone-700">
                                  金丹法数越高，天劫难度越大，但属性加成也越强
                                </div>
                              </div>
                            </>
                          }
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <h4 className="text-base font-bold text-yellow-300">金丹法数</h4>
                          </div>
                          <div className="text-2xl font-bold text-yellow-400 mb-1">
                            {cappedCount}法金丹
                          </div>
                          <div className="text-xs text-yellow-500 bg-yellow-900/30 px-2 py-1 rounded-full inline-block mb-2">
                            难度: {difficulty}x
                          </div>
                          {bonusMultiplier > 1 && (
                            <div className="text-xs text-green-300 space-y-0.5">
                              <div>属性加成: +{bonusPercent}%</div>
                            </div>
                          )}
                        </HoverableCard>
                      );
                    }

                    // 没有法数，显示未结丹
                    return (
                      <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-gray-400">金丹法数</h4>
                        </div>
                        <div className="text-sm text-gray-500">未结丹</div>
                      </div>
                    );
                  })()}

                  {/* 天地精华 */}
                  {player.heavenEarthEssence ? (() => {
                    const essence = HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence];
                    const effects = essence?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`气血+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`攻击+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`防御+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`神识+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`体魄+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`速度+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-purple-500"
                        className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-4 border-2 border-purple-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-purple-300 mb-2">{essence?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{essence?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              <div className="text-purple-300">品质: {essence?.quality || 0}</div>
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-purple-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  特殊效果: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-purple-300">天地精华</h4>
                        </div>
                        <div className="text-lg font-semibold text-purple-200 mb-1">
                          {essence?.name || '未知'}
                        </div>
                        <div className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          品质: {essence?.quality || 0}
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-purple-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-purple-400">+{effectTexts.length - 3}项</div>
                            )}
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">天地精华</h4>
                      </div>
                      <div className="text-sm text-gray-500">未选择</div>
                    </div>
                  )}

                  {/* 天地之髓 */}
                  {player.heavenEarthMarrow ? (() => {
                    const marrow = HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow];
                    const effects = marrow?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`气血+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`攻击+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`防御+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`神识+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`体魄+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`速度+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-red-500"
                        className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-xl p-4 border-2 border-red-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-red-300 mb-2">{marrow?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{marrow?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              <div className="text-red-300">品质: {marrow?.quality || 0} | 炼化时间: {marrow?.refiningTime || 0}天</div>
                              {player.marrowRefiningProgress !== undefined && (
                                <div className="text-red-300">炼化进度: {player.marrowRefiningProgress}%</div>
                              )}
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-red-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  特殊效果: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-red-300">天地之髓</h4>
                        </div>
                        <div className="text-lg font-semibold text-red-200 mb-1">
                          {marrow?.name || '未知'}
                        </div>
                        <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          品质: {marrow?.quality || 0}
                          {player.marrowRefiningProgress && player.marrowRefiningProgress > 0 && (
                            <span> - 炼化: {player.marrowRefiningProgress}%</span>
                          )}
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-red-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-red-400">+{effectTexts.length - 3}项</div>
                            )}
                          </div>
                        )}
                        {/* 炼化进度条和投喂按钮 */}
                        {player.marrowRefiningProgress !== undefined && player.marrowRefiningProgress < 100 && (
                          <div className="mt-3 space-y-2">
                            <div className="w-full bg-red-900/30 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${player.marrowRefiningProgress}%` }}
                              ></div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMarrowFeedModal(true);
                              }}
                              className="w-full px-3 py-2 bg-red-800 hover:bg-red-700 text-red-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Beaker size={14} />
                              投喂物品提升炼化
                            </button>
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">天地之髓</h4>
                      </div>
                      <div className="text-sm text-gray-500">未炼化</div>
                    </div>
                  )}

                  {/* 合道期挑战状态 */}
                  {player.daoCombiningChallenged ? (
                    <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-xl p-4 border-2 border-indigo-600 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-indigo-300">天地之魄</h4>
                      </div>
                      <div className="text-lg font-semibold text-indigo-200 mb-1">
                        挑战通过
                      </div>
                      <div className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded-full inline-block">
                        具备合道期突破资格
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">天地之魄</h4>
                      </div>
                      <div className="text-sm text-gray-500">未挑战</div>
                    </div>
                  )}


                  {/* 规则之力 */}
                  {player.longevityRules && player.longevityRules.length > 0 ? (
                    <HoverableCard
                      borderColor="border-green-500"
                      width="w-72"
                      className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-xl p-4 border-2 border-green-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                      tooltipContent={
                        <div className="max-h-96 overflow-y-auto">
                          <div className="text-sm font-bold text-green-300 mb-3">规则之力详情</div>
                          {player.longevityRules.map((ruleId, idx) => {
                            const rule = LONGEVITY_RULES[ruleId];
                            if (!rule) return null;
                            const effects = rule.effects || {};
                            const effectTexts: string[] = [];
                            if (effects.hpPercent) effectTexts.push(`气血+${(effects.hpPercent * 100).toFixed(0)}%`);
                            if (effects.attackPercent) effectTexts.push(`攻击+${(effects.attackPercent * 100).toFixed(0)}%`);
                            if (effects.defensePercent) effectTexts.push(`防御+${(effects.defensePercent * 100).toFixed(0)}%`);
                            if (effects.spiritPercent) effectTexts.push(`神识+${(effects.spiritPercent * 100).toFixed(0)}%`);
                            if (effects.physiquePercent) effectTexts.push(`体魄+${(effects.physiquePercent * 100).toFixed(0)}%`);
                            if (effects.speedPercent) effectTexts.push(`速度+${(effects.speedPercent * 100).toFixed(0)}%`);

                            return (
                              <div key={ruleId} className={`mb-3 ${idx > 0 ? 'border-t border-stone-700 pt-3' : ''}`}>
                                <div className="text-xs font-bold text-green-300 mb-1">{rule.name}</div>
                                <div className="text-xs text-stone-400 mb-1">{rule.description}</div>
                                <div className="text-xs text-stone-500 mb-1">力量: {rule.power}</div>
                                {effectTexts.length > 0 && (
                                  <div className="text-xs text-green-300 space-y-0.5">
                                    {effectTexts.map((text, i) => (
                                      <div key={i}>{text}</div>
                                    ))}
                                  </div>
                                )}
                                {effects.specialEffect && (
                                  <div className="text-xs text-yellow-400 mt-1">
                                    特殊: {effects.specialEffect}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-green-300">规则之力</h4>
                      </div>
                      <div className="text-sm text-green-200 mb-1">
                        {player.longevityRules.map(ruleId =>
                          LONGEVITY_RULES[ruleId]?.name || '未知'
                        ).join(', ')}
                      </div>
                      <div className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full inline-block">
                        掌握: {player.longevityRules.length}/{player.maxLongevityRules || 3}道
                      </div>
                    </HoverableCard>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">规则之力</h4>
                      </div>
                      <div className="text-sm text-gray-500">未掌握</div>
                    </div>
                  )}

                </div>
              </div>

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
                                className={`p-3 rounded border ${canUnlock
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
                                  className={`p-2 rounded border ${isLearned
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
                    <span className="text-red-400 font-bold">
                      {totalStats.attack}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">防御:</span>{' '}
                    <span className="text-blue-400 font-bold">
                      {totalStats.defense}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">气血:</span>{' '}
                    <span className="text-green-400 font-bold">
                      {player.hp}/{totalStats.maxHp}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">神识:</span>{' '}
                    <span className="text-purple-400 font-bold">
                      {totalStats.spirit}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">体魄:</span>{' '}
                    <span className="text-orange-400 font-bold">
                      {totalStats.physique}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">速度:</span>{' '}
                    <span className="text-yellow-400 font-bold">
                      {totalStats.speed}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">声望:</span>{' '}
                    <span className="text-mystic-gold font-bold">
                      {player.reputation || 0}
                    </span>
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
                        <span className="text-stone-400">传承:</span> 攻击{' '}
                        {attributeSources.inheritance.attack}, 防御{' '}
                        {attributeSources.inheritance.defense}, 气血 {attributeSources.inheritance.hp}
                      </div>
                      <div>
                        <span className="text-stone-400">装备:</span> 攻击{' '}
                        {attributeSources.equipment.attack}, 防御{' '}
                        {attributeSources.equipment.defense}, 气血{' '}
                        {attributeSources.equipment.hp}
                      </div>
                      <div className="col-span-2 text-blue-400">
                        <span className="text-stone-400 text-xs">当前心法:</span> 攻击{' '}
                        {attributeSources.activeArt.attack}, 防御{' '}
                        {attributeSources.activeArt.defense}, 气血{' '}
                        {attributeSources.activeArt.hp}
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
                    <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-80">
                      {unlockedTitles.map((title) => {
                        const isEquipped = title.id === player.titleId;
                        const isPartOfSet = title.setGroup && TITLE_SET_EFFECTS.some(se =>
                          se.titles.includes(title.id) &&
                          se.titles.every(tid => (player.unlockedTitles || []).includes(tid))
                        );

                        return (
                          <button
                            key={title.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isEquipped && onSelectTitle) {
                                onSelectTitle(title.id);
                              }
                            }}
                            disabled={isEquipped}
                            className={`text-left rounded p-3 border transition-colors ${isEquipped
                                ? 'bg-yellow-900/30 border-yellow-500 cursor-default opacity-60'
                                : 'bg-stone-900 hover:bg-stone-700 border-stone-700 cursor-pointer'
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
                        <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-60 mt-2">
                          {TITLES.filter(t => !unlockedTitles.map(ut => ut.id).includes(t.id)).map((title) => {
                            const isMet = checkTitleRequirement(title, player);
                            return (
                              <div
                                key={title.id}
                                className={`bg-stone-900/50 rounded p-3 border ${isMet ? 'border-green-600 opacity-100' : 'border-stone-800 opacity-60'}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${getRarityColor(title.rarity || '普通')}`}>
                                    {title.name}
                                  </span>
                                  {title.rarity && (
                                    <span className="text-xs text-stone-500">({title.rarity})</span>
                                  )}
                                  {isMet && (
                                    <span className="text-xs text-green-400 font-bold">✓ 可解锁</span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500">{title.requirement}</p>
                              </div>
                            );
                          })}
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
                      <div className="text-stone-400 text-xs mb-1">
                        游戏天数
                      </div>
                      <div className="text-xl font-bold text-mystic-gold">
                        {statistics.gameDays}
                      </div>
                    </div>
                    {gameDuration && (
                      <div className="bg-stone-800 rounded p-3 border border-stone-700">
                        <div className="text-stone-400 text-xs mb-1">
                          游戏时长
                        </div>
                        <div className="text-xl font-bold text-blue-400">
                          {gameDuration}
                        </div>
                      </div>
                    )}
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        当前境界
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {player.realm} {player.realmLevel}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        境界进度
                      </div>
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
                      <div className="text-stone-400 text-xs mb-1">
                        当前修为
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {player.exp.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        / {player.maxExp.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        当前灵石
                      </div>
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
                      <div className="text-stone-400 text-xs mb-1">
                        击杀敌人
                      </div>
                      <div className="text-xl font-bold text-red-400">
                        {statistics.killCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        历练次数
                      </div>
                      <div className="text-xl font-bold text-orange-400">
                        {statistics.adventureCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        秘境探索
                      </div>
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
                      <div className="text-stone-400 text-xs mb-1">
                        打坐次数
                      </div>
                      <div className="text-xl font-bold text-blue-400">
                        {statistics.meditateCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        突破次数
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {statistics.breakthroughCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        学习功法
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {statistics.learnedArtsCount} /{' '}
                        {statistics.unlockedArtsCount}
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
                      <div className="text-stone-400 text-xs mb-1">
                        获得灵宠
                      </div>
                      <div className="text-xl font-bold text-pink-400">
                        {statistics.petCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前拥有: {player.pets.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        装备物品
                      </div>
                      <div className="text-xl font-bold text-cyan-400">
                        {statistics.equipCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前装备: {statistics.totalEquippedItems}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        解锁丹方
                      </div>
                      <div className="text-xl font-bold text-emerald-400">
                        {statistics.recipeCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        当前拥有: {(player.unlockedRecipes || []).length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        背包物品
                      </div>
                      <div className="text-xl font-bold text-stone-300">
                        {statistics.totalInventoryItems.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        物品种类: {player.inventory.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        完成成就
                      </div>
                      <div className="text-xl font-bold text-yellow-400">
                        {player.achievements.length} / {ACHIEVEMENTS.length}
                      </div>
                      <div className="text-xs text-stone-500">
                        {(
                          (player.achievements.length / ACHIEVEMENTS.length) *
                          100
                        ).toFixed(1)}
                        % 完成度
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 天地之髓投喂模态框 */}
      {showMarrowFeedModal && player.heavenEarthMarrow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4"
          onClick={() => setShowMarrowFeedModal(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-red-600 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-stone-800 border-b border-red-600 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-300 flex items-center gap-2">
                <Beaker size={20} />
                投喂物品提升炼化进度
              </h3>
              <button
                onClick={() => setShowMarrowFeedModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 text-sm text-stone-300">
                <p>选择物品投喂给天地之髓，根据物品稀有度提升炼化进度：</p>
                <ul className="mt-2 space-y-1 text-xs text-stone-400">
                  <li>• 普通物品：+1-2% 进度</li>
                  <li>• 稀有物品：+3-5% 进度</li>
                  <li>• 传说物品：+6-10% 进度</li>
                  <li>• 仙品物品：+15-25% 进度</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {player.inventory
                  .filter((item) => {
                    // 只显示未装备的物品
                    const isEquipped = Object.values(player.equippedItems).includes(item.id);
                    return !isEquipped && item.quantity > 0;
                  })
                  .map((item) => {
                    const rarity = item.rarity || '普通';
                    const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
                    // 根据稀有度计算进度提升
                    const baseProgress = rarity === '普通' ? 1.5 : rarity === '稀有' ? 4 : rarity === '传说' ? 8 : 20;
                    const progressGain = Math.floor(baseProgress * (0.8 + Math.random() * 0.4)); // 80%-120%波动

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (!player.heavenEarthMarrow) return;

                          const currentProgress = player.marrowRefiningProgress || 0;
                          const newProgress = Math.min(100, currentProgress + progressGain);

                          setPlayer((prev) => {
                            if (!prev) return prev;
                            const newInventory = prev.inventory.map((i) =>
                              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                            ).filter((i) => i.quantity > 0);

                            const marrow = HEAVEN_EARTH_MARROWS[prev.heavenEarthMarrow!];
                            const isCompleted = newProgress >= 100;

                            if (addLog) {
                              if (isCompleted) {
                                addLog(`✨ 成功炼化【${marrow?.name || '天地之髓'}】！获得全部属性加成！`);
                              } else {
                                addLog(`投喂【${item.name}】，炼化进度 +${progressGain}% (${currentProgress}% → ${newProgress}%)`);
                              }
                            }

                            return {
                              ...prev,
                              inventory: newInventory,
                              marrowRefiningProgress: newProgress,
                            };
                          });

                          if (newProgress >= 100) {
                            setShowMarrowFeedModal(false);
                          }
                        }}
                        className="p-3 bg-stone-700 hover:bg-stone-600 rounded border-2 border-stone-600 hover:border-red-500 transition-all text-left"
                      >
                        <div className="text-xs font-bold mb-1" style={{ color: getRarityTextColor(rarity) }}>
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-400 mb-1">数量: {item.quantity}</div>
                        <div className="text-xs text-green-400">+{progressGain}% 进度</div>
                      </button>
                    );
                  })}
              </div>
              {player.inventory.filter((item) => {
                const isEquipped = Object.values(player.equippedItems).includes(item.id);
                return !isEquipped && item.quantity > 0;
              }).length === 0 && (
                <div className="text-center py-8 text-stone-400">
                  背包中没有可投喂的物品
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterModal;
