
import React, { useState } from 'react';
import { PlayerStats, SectRank, RealmType, Item } from '../types';
import { SECTS, SECT_RANK_REQUIREMENTS, SECT_SHOP_ITEMS, REALM_ORDER } from '../constants';
import { X, Users, Award, ShoppingBag, Shield, Scroll, ArrowUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onJoinSect: (sectId: string) => void;
  onLeaveSect: () => void;
  onTask: (type: 'patrol' | 'donate_stone' | 'donate_herb') => void;
  onPromote: () => void;
  onBuy: (item: Partial<Item>, cost: number, quantity?: number) => void;
}

const SectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onJoinSect,
  onLeaveSect,
  onTask,
  onPromote,
  onBuy
}) => {
  const [activeTab, setActiveTab] = useState<'hall' | 'mission' | 'shop'>('hall');
  const [buyQuantities, setBuyQuantities] = useState<Record<number, number>>({});

  if (!isOpen) return null;

  const currentSect = SECTS.find(s => s.id === player.sectId);
  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // -- Selection View (Not in a sect) --
  if (!player.sectId) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-paper-800 w-full max-w-4xl rounded border border-stone-600 shadow-2xl flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
            <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
              <Users size={20} /> 寻访仙门
            </h3>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {SECTS.map(sect => {
              const canJoin = getRealmIndex(player.realm) >= getRealmIndex(sect.reqRealm);
              return (
                <div key={sect.id} className="bg-ink-800 border border-stone-700 p-4 rounded flex flex-col">
                  <h4 className="text-xl font-serif font-bold text-stone-200 mb-2">{sect.name}</h4>
                  <p className="text-stone-400 text-sm mb-4 flex-1">{sect.description}</p>

                  <div className="text-xs text-stone-500 mb-4">
                    入门要求: <span className={canJoin ? 'text-stone-300' : 'text-red-400'}>{sect.reqRealm}</span>
                  </div>

                  <button
                    onClick={() => onJoinSect(sect.id)}
                    disabled={!canJoin}
                    className={`
                      w-full py-2 rounded font-serif text-sm transition-colors border
                      ${canJoin
                        ? 'bg-mystic-jade/20 text-mystic-jade border-mystic-jade hover:bg-mystic-jade/30'
                        : 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'}
                    `}
                  >
                    {canJoin ? '拜入山门' : '境界不足'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Dashboard View (In a sect) --

  // Promotion Logic
  const ranks = Object.values(SectRank);
  const currentRankIdx = ranks.indexOf(player.sectRank);
  const nextRank = currentRankIdx < ranks.length - 1 ? ranks[currentRankIdx + 1] : null;
  const nextReq = nextRank ? SECT_RANK_REQUIREMENTS[nextRank] : null;

  const canPromote = nextRank && nextReq &&
    player.sectContribution >= nextReq.contribution &&
    getRealmIndex(player.realm) >= nextReq.realmIndex;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-stone-600 bg-ink-800 md:rounded-t flex justify-between items-start">
          <div>
             <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-xl md:text-2xl font-serif text-mystic-gold">{currentSect?.name}</h3>
                <span className="text-[10px] md:text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-300 border border-stone-600">
                  {player.sectRank}
                </span>
             </div>
             <div className="text-xs md:text-sm text-stone-400 flex gap-4">
               <span>宗门贡献: <span className="text-white font-bold">{player.sectContribution}</span></span>
             </div>
          </div>
          <button onClick={onClose} className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-stone-700 bg-ink-900">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'hall' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Shield size={16} /> 宗门大殿
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'mission' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Scroll size={16} /> 任务阁
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'shop' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <ShoppingBag size={16} /> 藏宝阁
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-paper-800">

          {/* Main Hall */}
          {activeTab === 'hall' && (
            <div className="space-y-6">
              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">身份晋升</h4>
                {nextRank ? (
                  <div>
                     <p className="text-sm text-stone-400 mb-4">
                       下级职衔：<span className="text-stone-200 font-bold">{nextRank}</span>
                     </p>
                     <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="bg-ink-900 p-2 rounded">
                          <span className="text-stone-500 block">所需贡献</span>
                          <span className={player.sectContribution >= (nextReq?.contribution || 0) ? 'text-mystic-jade' : 'text-red-400'}>
                            {player.sectContribution} / {nextReq?.contribution}
                          </span>
                        </div>
                        <div className="bg-ink-900 p-2 rounded">
                          <span className="text-stone-500 block">所需境界</span>
                          <span className={getRealmIndex(player.realm) >= (nextReq?.realmIndex || 0) ? 'text-mystic-jade' : 'text-red-400'}>
                            {Object.values(RealmType)[nextReq?.realmIndex || 0]}
                          </span>
                        </div>
                     </div>
                     <button
                       onClick={onPromote}
                       disabled={!canPromote}
                       className={`
                         w-full py-2 rounded font-serif text-sm transition-colors flex items-center justify-center gap-2
                         ${canPromote
                           ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold hover:bg-mystic-gold/30'
                           : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'}
                       `}
                     >
                       <ArrowUp size={16} /> 申请晋升
                     </button>
                  </div>
                ) : (
                  <p className="text-mystic-gold text-center py-4">你已位极人臣，乃宗门之中流砥柱。</p>
                )}
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                 <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">退出宗门</h4>
                 <p className="text-sm text-stone-500 mb-4">退出宗门将清空所有贡献值，且短期内不可再次加入。</p>
                 <button
                   onClick={onLeaveSect}
                   className="px-4 py-2 border border-red-900 text-red-400 hover:bg-red-900/20 rounded text-sm transition-colors"
                 >
                   叛出宗门
                 </button>
              </div>
            </div>
          )}

          {/* Mission Hall */}
          {activeTab === 'mission' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-ink-800 p-4 rounded border border-stone-700 flex flex-col">
                <h4 className="font-serif font-bold text-stone-200 mb-1">山门巡逻</h4>
                <p className="text-xs text-stone-500 mb-4 flex-1">在宗门附近巡视，驱逐野兽，维护治安。</p>
                <div className="flex justify-between items-center text-xs text-stone-400 mb-2">
                   <span>奖励: 10 贡献</span>
                   <span>耗时: 瞬时</span>
                </div>
                <div className="text-xs text-stone-500 mb-2">
                  今日已完成: {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = player.lastTaskResetDate || today;
                    return lastReset === today ? (player.dailyTaskCount || 0) : 0;
                  })()} / 10 次
                </div>
                <button
                  onClick={() => onTask('patrol')}
                  disabled={(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = player.lastTaskResetDate || today;
                    const count = lastReset === today ? (player.dailyTaskCount || 0) : 0;
                    return count >= 10;
                  })()}
                  className={`w-full py-2 rounded text-sm ${
                    (() => {
                      const today = new Date().toISOString().split('T')[0];
                      const lastReset = player.lastTaskResetDate || today;
                      const count = lastReset === today ? (player.dailyTaskCount || 0) : 0;
                      return count >= 10;
                    })()
                      ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
                      : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                  }`}
                >
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = player.lastTaskResetDate || today;
                    const count = lastReset === today ? (player.dailyTaskCount || 0) : 0;
                    return count >= 10 ? '今日已完成' : '执行任务';
                  })()}
                </button>
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700 flex flex-col">
                <h4 className="font-serif font-bold text-stone-200 mb-1">上交灵石</h4>
                <p className="text-xs text-stone-500 mb-4 flex-1">为宗门建设捐献灵石。</p>
                <div className="flex justify-between items-center text-xs text-stone-400 mb-3">
                   <span>消耗: 100 灵石</span>
                   <span>奖励: 50 贡献</span>
                </div>
                <button
                  onClick={() => onTask('donate_stone')}
                  disabled={player.spiritStones < 100}
                  className={`w-full py-2 rounded text-sm ${player.spiritStones < 100 ? 'bg-stone-900 text-stone-600' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'}`}
                >
                  {player.spiritStones < 100 ? '灵石不足' : '上交物资'}
                </button>
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700 flex flex-col">
                <h4 className="font-serif font-bold text-stone-200 mb-1">上交草药</h4>
                <p className="text-xs text-stone-500 mb-4 flex-1">上交一株【聚灵草】以供炼丹房使用。</p>
                <div className="flex justify-between items-center text-xs text-stone-400 mb-3">
                   <span>消耗: 1 聚灵草</span>
                   <span>奖励: 20 贡献</span>
                </div>
                <button
                  onClick={() => onTask('donate_herb')}
                  disabled={!player.inventory.find(i => i.name === '聚灵草' && i.quantity > 0)}
                  className={`w-full py-2 rounded text-sm ${!player.inventory.find(i => i.name === '聚灵草' && i.quantity > 0) ? 'bg-stone-900 text-stone-600' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'}`}
                >
                  上交物资
                </button>
              </div>
            </div>
          )}

          {/* Treasure Pavilion */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              {SECT_SHOP_ITEMS.map((item, idx) => {
                const quantity = buyQuantities[idx] || 1;
                const totalCost = item.cost * quantity;
                const canBuy = player.sectContribution >= totalCost;

                return (
                  <div key={idx} className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-200">{item.name}</div>
                      <div className="text-xs text-stone-500">{item.item.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-mystic-gold font-bold">
                        {item.cost} 贡献
                        {quantity > 1 && (
                          <span className="text-xs text-stone-400 ml-1">
                            x{quantity} = {totalCost}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-stone-600 rounded">
                          <button
                            onClick={() => setBuyQuantities(prev => ({ ...prev, [idx]: Math.max(1, (prev[idx] || 1) - 1) }))}
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setBuyQuantities(prev => ({ ...prev, [idx]: val }));
                            }}
                            className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                          />
                          <button
                            onClick={() => setBuyQuantities(prev => ({ ...prev, [idx]: (prev[idx] || 1) + 1 }))}
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            onBuy(item.item, item.cost, quantity);
                            setBuyQuantities(prev => ({ ...prev, [idx]: 1 }));
                          }}
                          disabled={!canBuy}
                          className={`
                            px-3 py-1.5 rounded text-xs border
                            ${canBuy
                              ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border-stone-600'
                              : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'}
                          `}
                        >
                          兑换
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SectModal;
