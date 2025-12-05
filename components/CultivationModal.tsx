import React, { useState, useMemo } from 'react';
import { CultivationArt, RealmType, PlayerStats, ArtGrade } from '../types';
import { CULTIVATION_ARTS, REALM_ORDER } from '../constants';
import { X, BookOpen, Check, Lock, Zap } from 'lucide-react';

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

  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // 过滤功法 - 必须在条件返回之前调用
  const filteredArts = useMemo(() => {
    return CULTIVATION_ARTS.filter((art) => {
      // 兼容性处理：如果功法没有 grade 字段，默认显示
      const artGrade = art.grade || '黄';
      if (gradeFilter !== 'all' && artGrade !== gradeFilter) return false;
      if (typeFilter !== 'all' && art.type !== typeFilter) return false;
      return true;
    });
  }, [gradeFilter, typeFilter]);

  // 必须在所有 hooks 之后才能有条件返回
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-3xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <BookOpen size={18} className="md:w-5 md:h-5" /> 功法阁
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-3 md:p-4 bg-paper-800 overflow-y-auto flex-1">
          <div className="mb-3 md:mb-4 text-xs md:text-sm text-stone-400 bg-ink-900/50 p-2 md:p-3 rounded border border-stone-700">
            <p>心法：主修功法，激活后提升修炼效率。</p>
            <p>体术：辅修功法，习得后永久提升身体属性。</p>
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
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredArts.length === 0 ? (
              <div className="text-center text-stone-400 py-8">
                没有符合条件的功法
              </div>
            ) : (
              filteredArts.map((art) => {
                if (!art) return null; // 安全处理
                const isLearned = player.cultivationArts.includes(art.id);
                const isActive = player.activeArtId === art.id;
                const canLearn =
                  !isLearned &&
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
                      {art.effects.attack && (
                        <span className="text-stone-300">
                          +{art.effects.attack} 攻击
                        </span>
                      )}
                      {art.effects.defense && (
                        <span className="text-stone-300">
                          +{art.effects.defense} 防御
                        </span>
                      )}
                      {art.effects.hp && (
                        <span className="text-stone-300">
                          +{art.effects.hp} 气血
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
                        onClick={() => onLearnArt(art)}
                        disabled={locked}
                        className={`
                          px-4 py-2 rounded text-xs md:text-sm font-serif transition-all flex items-center gap-1 min-h-[44px] md:min-h-0 touch-manipulation
                          ${
                            locked
                              ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                              : 'bg-mystic-jade/20 text-mystic-jade border border-mystic-jade active:bg-mystic-jade/30'
                          }
                        `}
                      >
                        {locked ? <Lock size={14} /> : <BookOpen size={14} />}
                        {art.cost === 0 ? '免费领悟' : '修习'}
                      </button>
                    )}
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultivationModal;
