
import React from 'react';
import { CultivationArt, RealmType, PlayerStats } from '../types';
import { CULTIVATION_ARTS, REALM_ORDER } from '../constants';
import { X, BookOpen, Check, Lock, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onLearnArt: (art: CultivationArt) => void;
  onActivateArt: (art: CultivationArt) => void;
}

const CultivationModal: React.FC<Props> = ({ isOpen, onClose, player, onLearnArt, onActivateArt }) => {
  if (!isOpen) return null;

  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-paper-800 w-full max-w-3xl rounded border border-stone-600 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
          <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <BookOpen size={20} /> 功法阁
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 bg-paper-800 overflow-y-auto">
          <div className="mb-4 text-sm text-stone-400 bg-ink-900/50 p-3 rounded border border-stone-700">
            <p>心法（mental）：主修功法，激活后提升修炼效率。</p>
            <p>体术（body）：辅修功法，习得后永久提升身体属性。</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {CULTIVATION_ARTS.map((art) => {
              const isLearned = player.cultivationArts.includes(art.id);
              const isActive = player.activeArtId === art.id;
              const canLearn = !isLearned && 
                player.spiritStones >= art.cost && 
                getRealmIndex(player.realm) >= getRealmIndex(art.realmRequirement);
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
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-lg font-serif font-bold ${isActive ? 'text-mystic-gold' : 'text-stone-200'}`}>
                        {art.name}
                      </h4>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${art.type === 'mental' ? 'border-blue-800 text-blue-300 bg-blue-900/20' : 'border-red-800 text-red-300 bg-red-900/20'}`}>
                        {art.type === 'mental' ? '心法' : '体术'}
                      </span>
                      {isActive && <span className="text-xs text-mystic-gold flex items-center"><Check size={12} className="mr-1"/> 运行中</span>}
                    </div>
                    <p className="text-sm text-stone-400 mb-2">{art.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span>境界要求: <span className={getRealmIndex(player.realm) >= getRealmIndex(art.realmRequirement) ? 'text-stone-300' : 'text-red-400'}>{art.realmRequirement}</span></span>
                      {!isLearned && <span>消耗灵石: <span className={player.spiritStones >= art.cost ? 'text-stone-300' : 'text-red-400'}>{art.cost}</span></span>}
                    </div>
                    
                    <div className="mt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {art.effects.expRate && <span className="text-mystic-jade">+{(art.effects.expRate * 100).toFixed(0)}% 修炼速度</span>}
                      {art.effects.attack && <span className="text-stone-300">+{art.effects.attack} 攻击</span>}
                      {art.effects.defense && <span className="text-stone-300">+{art.effects.defense} 防御</span>}
                      {art.effects.hp && <span className="text-stone-300">+{art.effects.hp} 气血</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:w-32 shrink-0">
                    {isLearned ? (
                      art.type === 'mental' ? (
                        isActive ? (
                          <button disabled className="px-3 py-1.5 bg-mystic-gold/10 border border-mystic-gold text-mystic-gold rounded text-sm font-serif cursor-default">
                            已激活
                          </button>
                        ) : (
                          <button 
                            onClick={() => onActivateArt(art)}
                            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-sm font-serif transition-colors border border-stone-500"
                          >
                            运行此法
                          </button>
                        )
                      ) : (
                        <span className="text-stone-500 text-sm font-serif italic">已修习</span>
                      )
                    ) : (
                      <button
                        onClick={() => onLearnArt(art)}
                        disabled={locked}
                        className={`
                          px-4 py-2 rounded text-sm font-serif transition-all flex items-center gap-1
                          ${locked 
                            ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700' 
                            : 'bg-mystic-jade/20 text-mystic-jade border border-mystic-jade hover:bg-mystic-jade/30'}
                        `}
                      >
                        {locked ? <Lock size={14} /> : <BookOpen size={14} />}
                        {art.cost === 0 ? '免费领悟' : '修习'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultivationModal;
