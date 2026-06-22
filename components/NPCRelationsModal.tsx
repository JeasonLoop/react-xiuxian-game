import React, { useState, useCallback } from 'react';
import { PlayerStats, Item } from '../types';
import { Modal } from './common';
import { Users, Heart, Gift, Swords, Star, Crown, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: (p: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  addLog: (text: string, type?: string) => void;
}

/** NPC 好感度等级 */
function getFavorLevel(f: number): { label: string; color: string; icon: string } {
  if (f >= 80) return { label: '道侣/挚友', color: 'text-pink-400', icon: '💑' };
  if (f >= 50) return { label: '好友', color: 'text-emerald-400', icon: '🤝' };
  if (f >= 20) return { label: '友善', color: 'text-blue-400', icon: '😊' };
  if (f >= 0) return { label: '中立', color: 'text-stone-400', icon: '😐' };
  if (f >= -20) return { label: '冷淡', color: 'text-yellow-400', icon: '😒' };
  if (f >= -50) return { label: '敌视', color: 'text-orange-400', icon: '😠' };
  return { label: '仇敌', color: 'text-red-400', icon: '💀' };
}

/** 好感度 buff 效果 */
function getFavorBuff(f: number): string | null {
  if (f >= 80) return '修炼速度 +10%，战斗中有几率获得道侣助阵';
  if (f >= 50) return '修炼速度 +5%';
  if (f >= 20) return '灵石获取 +5%';
  if (f <= -50) return '冒险中可能遭遇仇敌追杀（击败有额外掉落）';
  return null;
}

const NPCRelationsModal: React.FC<Props> = ({ isOpen, onClose, player, setPlayer, addLog }) => {
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);
  const [giftMode, setGiftMode] = useState(false);

  const relations = player.socialRelations || [];
  const npc = selectedNpc ? relations.find(r => r.id === selectedNpc) : null;
  const favor = npc ? getFavorLevel(npc.favorability) : null;
  const buff = npc ? getFavorBuff(npc.favorability) : null;

  // 可赠送的物品（排除装备）
  const giftableItems = (player.inventory || []).filter(
    i => !i.isEquippable && (i.type as string) !== 'Recipe' && i.quantity > 0
  );

  const handleGift = useCallback((item: Item) => {
    if (!npc) return;
    if ((item as any).locked) {
      addLog(`🔒 【${item.name}】已锁定，无法赠送！`, 'danger');
      return;
    }
    const giftValue = Math.floor((item.effect?.attack || 0) * 2 + (item.effect?.defense || 0) * 1.5 +
      (item.effect?.hp || 0) * 0.5 + (item.effect?.spirit || 0) * 2);
    const favorGain = Math.max(1, Math.floor(giftValue / 10));
    
    setPlayer(prev => {
      const newRelations = prev.socialRelations.map(r => {
        if (r.id === npc.id) {
          return { ...r, favorability: Math.min(100, Math.max(-100, r.favorability + favorGain)) };
        }
        return r;
      });
      const newInv = prev.inventory.map(i => {
        if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
        return i;
      }).filter(i => i.quantity > 0);
      return { ...prev, socialRelations: newRelations, inventory: newInv };
    });
    
    addLog(`🎁 向${npc.name}赠送了${item.name}，好感度 +${favorGain}`, 'gain');
    setGiftMode(false);
  }, [npc, setPlayer, addLog]);

  const handleGiftStones = useCallback(() => {
    if (!npc || player.spiritStones < 100) return;
    const amount = 100;
    const favorGain = 5;
    
    setPlayer(prev => {
      const newRelations = prev.socialRelations.map(r => {
        if (r.id === npc.id) {
          return { ...r, favorability: Math.min(100, Math.max(-100, r.favorability + favorGain)) };
        }
        return r;
      });
      return { ...prev, socialRelations: newRelations, spiritStones: prev.spiritStones - amount };
    });
    
    addLog(`🎁 向${npc.name}赠送了 ${amount} 灵石，好感度 +${favorGain}`, 'gain');
    setGiftMode(false);
  }, [npc, player.spiritStones, setPlayer, addLog]);

  // 计算 buff 效果
  const getBuffSummary = (): { expBonus: number; stoneBonus: number; daoCompanion: boolean; huntChance: boolean } => {
    let expBonus = 0, stoneBonus = 0, daoCompanion = false, huntChance = false;
    for (const r of relations) {
      if (r.favorability >= 80) { expBonus += 10; daoCompanion = true; }
      else if (r.favorability >= 50) expBonus += 5;
      if (r.favorability >= 20 && r.favorability < 50) stoneBonus += 5;
      if (r.favorability <= -50) huntChance = true;
    }
    return { expBonus, stoneBonus, daoCompanion, huntChance };
  };

  const buffs = getBuffSummary();

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="人物志" titleIcon={<Users size={18} />} size="lg" height="lg">
      <div className="space-y-4">
        {/* Buff 总览 */}
        {(buffs.expBonus > 0 || buffs.stoneBonus > 0 || buffs.daoCompanion || buffs.huntChance) && (
          <div className="bg-ink-900 p-3 rounded border border-stone-700 space-y-1 text-xs">
            <p className="text-stone-400 font-bold mb-1">人际关系加成</p>
            {buffs.expBonus > 0 && <p className="text-emerald-400">✨ 修炼速度 +{buffs.expBonus}%</p>}
            {buffs.stoneBonus > 0 && <p className="text-yellow-400">💎 灵石获取 +{buffs.stoneBonus}%</p>}
            {buffs.daoCompanion && <p className="text-pink-400">💑 战斗时道侣有几率出手助阵</p>}
            {buffs.huntChance && <p className="text-red-400">⚠️ 仇敌可能在冒险中追杀你</p>}
          </div>
        )}

        {relations.length === 0 ? (
          <div className="text-center text-stone-500 py-8 font-serif">
            尚未结识任何道友，多在历练中闯荡吧。
          </div>
        ) : (
          <div className="flex gap-4 min-h-0">
            {/* NPC 列表 */}
            <div className="w-1/3 border-r border-stone-700 pr-3 overflow-y-auto space-y-1 max-h-[50vh]">
              {relations.sort((a, b) => b.favorability - a.favorability).map(rel => {
                const lv = getFavorLevel(rel.favorability);
                return (
                  <button
                    key={rel.id}
                    onClick={() => { setSelectedNpc(rel.id); setGiftMode(false); }}
                    className={`w-full text-left p-2 rounded text-xs border transition-colors flex items-center gap-2 ${
                      selectedNpc === rel.id
                        ? 'bg-mystic-gold/20 border-mystic-gold'
                        : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    <span>{lv.icon}</span>
                    <span className="text-stone-200 truncate flex-1">{rel.name}</span>
                    <span className={lv.color + ' text-[10px]'}>{lv.label}</span>
                  </button>
                );
              })}
            </div>

            {/* NPC 详情 */}
            <div className="flex-1 min-h-0">
              {npc ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{favor?.icon}</span>
                    <div>
                      <h3 className="text-stone-200 font-serif text-lg">{npc.name}</h3>
                      <p className={`text-sm font-bold ${favor?.color}`}>{favor?.label}</p>
                    </div>
                  </div>

                  {/* 好感度条 */}
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>好感度</span>
                      <span>{npc.favorability}</span>
                    </div>
                    <div className="w-full bg-stone-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${npc.favorability >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.abs(npc.favorability)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 italic">{npc.description}</p>
                  <p className="text-xs text-stone-500">结识于：{npc.lastEncounterRealm}</p>

                  {buff && (
                    <div className="bg-ink-900 p-2 rounded border border-stone-700 text-xs text-stone-300">
                      <span className="text-mystic-gold">效果：</span>{buff}
                    </div>
                  )}

                  {/* 赠送按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGiftMode(!giftMode)}
                      className="px-3 py-1.5 bg-pink-900/20 border border-pink-700 text-pink-300 rounded text-sm hover:bg-pink-900/30 flex items-center gap-1"
                    >
                      <Gift size={14} /> 赠送
                    </button>
                    <button
                      onClick={handleGiftStones}
                      disabled={player.spiritStones < 100}
                      className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-700 text-yellow-300 rounded text-sm hover:bg-yellow-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      💎 赠灵石 (100)
                    </button>
                  </div>

                  {/* 赠送物品列表 */}
                  {giftMode && (
                    <div className="bg-stone-800 rounded p-2 border border-stone-600 max-h-40 overflow-y-auto space-y-1">
                      {giftableItems.slice(0, 20).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleGift(item)}
                          className="w-full text-left px-2 py-1 rounded text-xs hover:bg-stone-700 flex justify-between"
                        >
                          <span className="text-stone-300">{item.name}</span>
                          <span className="text-stone-500">×{item.quantity}</span>
                        </button>
                      ))}
                      {giftableItems.length === 0 && (
                        <p className="text-stone-500 text-xs text-center py-2">没有可赠送的物品</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-stone-500 py-8">选择一位道友查看详情</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NPCRelationsModal;
