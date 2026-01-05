import React, { useState, useMemo, useRef } from 'react';
import { CultivationArt, RealmType, PlayerStats, ArtGrade } from '../types';
import { CULTIVATION_ARTS, REALM_ORDER } from '../constants/index';
import { BookOpen, Check, Lock, Search, X } from 'lucide-react';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onLearnArt: (art: CultivationArt) => void;
  onActivateArt: (art: CultivationArt) => void;
}

const CultivationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onLearnArt,
  onActivateArt,
}) => {
  const [gradeFilter, setGradeFilter] = useState<ArtGrade | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mental' | 'body'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'learned' | 'obtained' | 'unobtained'>('all');
  const [learningArtId, setLearningArtId] = useState<string | null>(null); // 防止重复点击
  const learningArtIdRef = useRef<string | null>(null); // 同步检查用
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const scrollContainerRef = useRef<HTMLDivElement>(null); // 滚动容器引用

  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // 处理学习功法的点击，确保传递正确的 art 对象
  const handleLearnClick = (art: CultivationArt, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 防止重复点击（双重检查）
    if (learningArtIdRef.current === art.id || learningArtId === art.id) {
      return;
    }

    // 检查是否已经学习过
    if (player.cultivationArts.includes(art.id)) {
      return;
    }

    // 保存当前滚动位置
    const scrollContainer = scrollContainerRef.current;
    const scrollTop = scrollContainer?.scrollTop || 0;

    learningArtIdRef.current = art.id;
    setLearningArtId(art.id);
    onLearnArt(art);

    // 恢复滚动位置（使用 requestAnimationFrame 确保在 DOM 更新后恢复）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    });

    // 1000ms 后重置，允许再次点击（给状态更新足够的时间）
    setTimeout(() => {
      learningArtIdRef.current = null;
      setLearningArtId(null);
    }, 1000);
  };

  // 传承技能系统尚未实现，暂时返回空数组
  const inheritanceArts = useMemo(() => {
    return [];
  }, []);

  // 合并普通功法和传承功法
  const allArts = useMemo(() => {
    return [...CULTIVATION_ARTS, ...inheritanceArts];
  }, [inheritanceArts]);

  // 使用 useMemo 直接计算并排序功法列表（包含未解锁的功法，用于"未获得"筛选）
  const sortedArts = useMemo(() => {
    if (!isOpen) return [];

    const learnedSet = new Set(player.cultivationArts || []);
    const unlockedSet = new Set(player.unlockedArts || []);
    // 传承技能自动解锁和学习
    inheritanceArts.forEach(art => {
      learnedSet.add(art.id);
      unlockedSet.add(art.id);
    });

    const gradeOrder = { 天: 4, 地: 3, 玄: 2, 黄: 1 };

    // 排序权重：已激活 < 已学习 < 已解锁未学 < 未解锁
    const statusWeight = (artId: string) => {
      if (player.activeArtId === artId) return 0;
      if (learnedSet.has(artId)) return 1;
      if (unlockedSet.has(artId)) return 2;
      return 3;
    };

    return allArts.map((art, idx) => ({ art, idx }))
      .sort((a, b) => {
        const wa = statusWeight(a.art.id);
        const wb = statusWeight(b.art.id);
        if (wa !== wb) return wa - wb;

        // 同状态下，如果都是已学习，按品级排序；否则保持原顺序
        if (wa <= 1) {
          const ga = gradeOrder[a.art.grade] || 0;
          const gb = gradeOrder[b.art.grade] || 0;
          if (ga !== gb) return gb - ga; // 高品级在前
        }

        return a.idx - b.idx; // 保持原有次序
      })
      .map((item) => item.art);
  }, [isOpen, player.unlockedArts, player.cultivationArts, player.activeArtId, allArts, inheritanceArts]);

  // 过滤功法 - 基于已排序的列表进行过滤
  const filteredArts = useMemo(() => {
    const learnedSet = new Set(player.cultivationArts);
    const unlockedSet = new Set(player.unlockedArts || []);
    // 传承技能自动解锁和学习
    inheritanceArts.forEach(art => {
      learnedSet.add(art.id);
      unlockedSet.add(art.id);
    });

    return sortedArts.filter((art) => {
      // 兼容性处理：如果功法没有 grade 字段，默认显示
      const artGrade = art.grade || '黄';
      if (gradeFilter !== 'all' && artGrade !== gradeFilter) return false;
      if (typeFilter !== 'all' && art.type !== typeFilter) return false;

      // 状态筛选：已学习、已获得（已解锁但未学习）、未获得（未解锁）
      if (statusFilter !== 'all') {
        const isLearned = learnedSet.has(art.id);
        const isUnlocked = unlockedSet.has(art.id);
        if (statusFilter === 'learned' && !isLearned) return false; // 已学习：已学习的功法
        if (statusFilter === 'obtained' && (!isUnlocked || isLearned)) return false; // 已获得：已解锁但未学习的功法
        if (statusFilter === 'unobtained' && (isUnlocked || isLearned)) return false; // 未获得：未解锁的功法（已学习也应排除）
      }

      // 搜索过滤（按名称和描述）
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = art.name.toLowerCase().includes(query);
        const descMatch = art.description?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch) return false;
      }

      return true;
    });
  }, [gradeFilter, typeFilter, statusFilter, sortedArts, player.cultivationArts, player.unlockedArts, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="功法阁"
      titleIcon={<BookOpen size={18} className="md:w-5 md:h-5" />}
      size="3xl"
      height="xl"
    >
      <div ref={scrollContainerRef}>
        <div className="mb-3 md:mb-4 text-xs md:text-sm text-stone-400 bg-ink-900/50 p-2 md:p-3 rounded border border-stone-700">
          <p>心法：主修功法，激活后提升修炼效率。</p>
          <p>体术：辅修功法，习得后永久提升身体属性。</p>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索功法名称或描述..."
              className="w-full pl-10 pr-10 py-2 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-stone-400 self-center">品级筛选：</span>
            {(['all', '天', '地', '玄', '黄'] as const).map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade === 'all' ? 'all' : grade)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  gradeFilter === grade
                    ? grade === '天'
                      ? 'bg-yellow-700 text-yellow-200'
                      : grade === '地'
                      ? 'bg-purple-700 text-purple-200'
                      : grade === '玄'
                      ? 'bg-blue-700 text-blue-200'
                      : grade === '黄'
                      ? 'bg-stone-700 text-stone-200'
                      : 'bg-mystic-jade text-white'
                    : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
                }`}
              >
                {grade === 'all' ? '全部' : `${grade}品`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-stone-400 self-center">类型筛选：</span>
            {(['all', 'mental', 'body'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  typeFilter === type
                    ? type === 'mental'
                      ? 'bg-blue-700 text-blue-200'
                      : type === 'body'
                      ? 'bg-red-700 text-red-200'
                      : 'bg-mystic-jade text-white'
                    : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
                }`}
              >
                {type === 'all' ? '全部' : type === 'mental' ? '心法' : '体术'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-stone-400 self-center">状态筛选：</span>
            {(['all', 'learned', 'obtained', 'unobtained'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  statusFilter === status
                    ? status === 'learned'
                      ? 'bg-green-700 text-green-200'
                      : status === 'obtained'
                      ? 'bg-yellow-700 text-yellow-200'
                      : status === 'unobtained'
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-mystic-jade text-white'
                    : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
                }`}
              >
                {status === 'all' ? '全部' : status === 'learned' ? '已学习' : status === 'obtained' ? '已获得' : '未获得'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {filteredArts.length === 0 ? (
            <div className="text-center text-stone-400 py-8">
              没有符合条件的功法
            </div>
          ) : (
            filteredArts.map((art) => {
              if (!art) return null; // 安全处理
              // 传承技能自动视为已学习和已解锁
              const isInheritanceArt = inheritanceArts.some(ia => ia.id === art.id);
              const isLearned = player.cultivationArts.includes(art.id) || isInheritanceArt;
              const isActive = player.activeArtId === art.id;
              const unlockedArts = player.unlockedArts || [];
              const isUnlocked = unlockedArts.includes(art.id) || isInheritanceArt;
              const canLearn =
                !isLearned &&
                isUnlocked && // 必须已解锁
                player.spiritStones >= art.cost &&
                getRealmIndex(player.realm) >=
                  getRealmIndex(art.realmRequirement);
              const locked = !isLearned && !canLearn;

            return (
              <div
                key={art.id}
                className={`
                  relative p-4 rounded border transition-colors flex flex-col sm:flex-row justify-between gap-4
                  ${isActive ? 'bg-ink-800 border-mystic-gold shadow-[0_0_10px_rgba(203,161,53,0.1)]' : 'bg-ink-800 border-stone-700'}
                  ${locked ? 'opacity-60 grayscale' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4
                      className={`text-base md:text-lg font-serif font-bold ${isActive ? 'text-mystic-gold' : 'text-stone-200'}`}
                    >
                      {art.name}
                    </h4>
                    <span
                      className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded border font-bold ${
                        (art.grade || '黄') === '天'
                          ? 'border-yellow-500 text-yellow-300 bg-yellow-900/30'
                          : (art.grade || '黄') === '地'
                          ? 'border-purple-500 text-purple-300 bg-purple-900/30'
                          : (art.grade || '黄') === '玄'
                          ? 'border-blue-500 text-blue-300 bg-blue-900/30'
                          : 'border-stone-500 text-stone-300 bg-stone-800/30'
                      }`}
                    >
                      {art.grade || '黄'}品
                    </span>
                    <span
                      className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded border ${art.type === 'mental' ? 'border-blue-800 text-blue-300 bg-blue-900/20' : 'border-red-800 text-red-300 bg-red-900/20'}`}
                    >
                      {art.type === 'mental' ? '心法' : '体术'}
                    </span>
                    {isActive && (
                      <span className="text-[10px] md:text-xs text-mystic-gold flex items-center">
                        <Check size={10} className="md:w-3 md:h-3 mr-1" />{' '}
                        运行中
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-stone-400 mb-2">
                    {art.description}
                  </p>
                  <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-xs text-stone-500">
                    <span>
                      境界要求:{' '}
                      <span
                        className={
                          getRealmIndex(player.realm) >=
                          getRealmIndex(art.realmRequirement)
                            ? 'text-stone-300'
                            : 'text-red-400'
                        }
                      >
                        {art.realmRequirement}
                      </span>
                    </span>
                    {!isLearned && (
                      <span>
                        消耗灵石:{' '}
                        <span
                          className={
                            player.spiritStones >= art.cost
                              ? 'text-stone-300'
                              : 'text-red-400'
                          }
                        >
                          {art.cost}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-[10px] md:text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {art.effects.expRate && (
                      <span className="text-mystic-jade">
                        +{(art.effects.expRate * 100).toFixed(0)}% 修炼速度
                      </span>
                    )}
                    {(art.effects.attack || art.effects.attackPercent) && (
                      <span className="text-stone-300">
                        {art.effects.attack ? `+${art.effects.attack} ` : ''}
                        {art.effects.attackPercent ? `+${(art.effects.attackPercent * 100).toFixed(0)}% ` : ''}
                        攻击
                      </span>
                    )}
                    {(art.effects.defense || art.effects.defensePercent) && (
                      <span className="text-stone-300">
                        {art.effects.defense ? `+${art.effects.defense} ` : ''}
                        {art.effects.defensePercent ? `+${(art.effects.defensePercent * 100).toFixed(0)}% ` : ''}
                        防御
                      </span>
                    )}
                    {(art.effects.hp || art.effects.hpPercent) && (
                      <span className="text-stone-300">
                        {art.effects.hp ? `+${art.effects.hp} ` : ''}
                        {art.effects.hpPercent ? `+${(art.effects.hpPercent * 100).toFixed(0)}% ` : ''}
                        气血
                      </span>
                    )}
                    {(art.effects.spirit || art.effects.spiritPercent) && (
                      <span className="text-stone-300">
                        {art.effects.spirit ? `+${art.effects.spirit} ` : ''}
                        {art.effects.spiritPercent ? `+${(art.effects.spiritPercent * 100).toFixed(0)}% ` : ''}
                        神识
                      </span>
                    )}
                    {(art.effects.physique || art.effects.physiquePercent) && (
                      <span className="text-stone-300">
                        {art.effects.physique ? `+${art.effects.physique} ` : ''}
                        {art.effects.physiquePercent ? `+${(art.effects.physiquePercent * 100).toFixed(0)}% ` : ''}
                        体魄
                      </span>
                    )}
                    {(art.effects.speed || art.effects.speedPercent) && (
                      <span className="text-stone-300">
                        {art.effects.speed ? `+${art.effects.speed} ` : ''}
                        {art.effects.speedPercent ? `+${(art.effects.speedPercent * 100).toFixed(0)}% ` : ''}
                        速度
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end sm:w-32 shrink-0 mt-2 sm:mt-0">
                  {isLearned ? (
                    art.type === 'mental' ? (
                      isActive ? (
                        <button
                          disabled
                          className="px-3 py-2 md:py-1.5 bg-mystic-gold/10 border border-mystic-gold text-mystic-gold rounded text-xs md:text-sm font-serif cursor-default min-h-[44px] md:min-h-0"
                        >
                          已激活
                        </button>
                      ) : (
                        <button
                          onClick={() => onActivateArt(art)}
                          className="px-3 py-2 md:py-1.5 bg-stone-700 active:bg-stone-600 text-stone-200 rounded text-xs md:text-sm font-serif transition-colors border border-stone-500 min-h-[44px] md:min-h-0 touch-manipulation"
                        >
                          运行此法
                        </button>
                      )
                    ) : (
                      <span className="text-stone-500 text-xs md:text-sm font-serif italic">
                        已修习
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleLearnClick(art, e)}
                      disabled={locked || learningArtId === art.id}
                      className={`
                        px-4 py-2 rounded text-xs md:text-sm font-serif transition-all flex items-center gap-1 min-h-[44px] md:min-h-0 touch-manipulation
                        ${
                          locked || learningArtId === art.id
                            ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                            : 'bg-mystic-jade/20 text-mystic-jade border border-mystic-jade active:bg-mystic-jade/30'
                        }
                      `}
                      title={!isUnlocked ? '需要通过历练解锁此功法' : undefined}
                    >
                      {locked ? <Lock size={14} /> : <BookOpen size={14} />}
                      {!isUnlocked ? '未解锁' : art.cost === 0 ? '免费领悟' : '修习'}
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(CultivationModal);
