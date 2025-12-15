import React, { useState, useMemo } from 'react';
import { PlayerStats, RealmType, SecretRealm } from '../types';
import { REALM_ORDER } from '../constants';
import { generateRandomRealms } from '../services/randomService';
import { X, Mountain, Gem, Ticket, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onEnter: (realm: SecretRealm) => void;
}

const SecretRealmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onEnter,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // 使用 useMemo 生成随机秘境列表，refreshKey 变化时重新生成
  const availableRealms = useMemo(() => {
    return generateRandomRealms(player.realm, 6);
  }, [player.realm, refreshKey]);

  if (!isOpen) return null;

  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-md touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-ink-900 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-purple-900 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex flex-col md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-purple-900 flex justify-between items-center bg-purple-900/20 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-purple-300 flex items-center gap-2">
            <Mountain size={18} className="md:w-5 md:h-5" /> 秘境探索
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700 rounded text-sm flex items-center gap-1.5 transition-colors min-h-[44px] md:min-h-0 touch-manipulation"
              title="刷新秘境列表"
            >
              <RefreshCw size={16} />
              <span className="hidden md:inline">刷新</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-3 md:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {availableRealms.map((realm) => {
            const playerRealmIndex = getRealmIndex(player.realm);
            const reqRealmIndex = getRealmIndex(realm.minRealm);
            const isRealmEnough = playerRealmIndex >= reqRealmIndex;
            const canAfford = player.spiritStones >= realm.cost;
            const locked = !isRealmEnough;

            return (
              <div
                key={realm.id}
                className={`
                  relative border flex flex-col p-5 rounded-lg transition-all duration-300 group
                  ${
                    locked
                      ? 'bg-ink-900 border-stone-800 opacity-60'
                      : 'bg-ink-800 border-purple-800 hover:border-purple-500 hover:bg-ink-800/80 hover:shadow-lg hover:shadow-purple-900/20'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4
                    className={`text-xl font-serif font-bold ${locked ? 'text-stone-500' : 'text-purple-200 group-hover:text-purple-100'}`}
                  >
                    {realm.name}
                  </h4>
                  <span
                    className={`
                    text-xs px-2 py-0.5 rounded border
                    ${
                      realm.riskLevel === '极度危险'
                        ? 'text-red-500 border-red-900 bg-red-900/20'
                        : realm.riskLevel === '高'
                          ? 'text-orange-400 border-orange-900 bg-orange-900/20'
                          : 'text-yellow-400 border-yellow-900 bg-yellow-900/20'
                    }
                  `}
                  >
                    {realm.riskLevel}风险
                  </span>
                </div>

                <p className="text-sm text-stone-500 mb-4 h-12">
                  {realm.description}
                </p>

                <div className="bg-ink-900/50 p-3 rounded border border-stone-800 mb-4 flex-1">
                  <div className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Gem size={12} /> 可能掉落
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {realm.drops.map((drop, i) => (
                      <span
                        key={i}
                        className="text-xs text-purple-300/80 bg-purple-900/20 px-1.5 py-0.5 rounded"
                      >
                        {drop}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">境界要求</span>
                    <span
                      className={
                        isRealmEnough ? 'text-stone-300' : 'text-red-500'
                      }
                    >
                      {realm.minRealm}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">门票消耗</span>
                    <span
                      className={
                        canAfford ? 'text-mystic-gold' : 'text-red-500'
                      }
                    >
                      {realm.cost} 灵石
                    </span>
                  </div>

                  <button
                    onClick={() => onEnter(realm)}
                    disabled={locked || !canAfford}
                    className={`
                       w-full py-2.5 rounded font-serif font-bold text-sm flex items-center justify-center gap-2 mt-4 transition-all
                       ${
                         locked || !canAfford
                           ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                           : 'bg-purple-900/40 text-purple-300 border border-purple-700 hover:bg-purple-800/60 hover:text-white hover:border-purple-500'
                       }
                     `}
                  >
                    {locked ? '境界不足' : !canAfford ? '灵石不足' : '进入秘境'}
                    {!locked && canAfford && <Ticket size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SecretRealmModal;
