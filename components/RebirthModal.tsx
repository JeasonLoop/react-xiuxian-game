import React, { useMemo } from 'react';
import { PlayerStats } from '../types';
import { REALM_ORDER, REALM_DATA } from '../constants/index';
import { Modal } from './common';
import { RefreshCw, Star, BookOpen, Gem, AlertTriangle } from 'lucide-react';
import { createInitialPlayer } from '../utils/playerUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onRebirth: () => void;
}

/** 转世条件：元婴期及以上 + 9层 + 经验满 */
function canRebirth(player: PlayerStats): boolean {
  const idx = REALM_ORDER.indexOf(player.realm);
  return idx >= 3 && player.realmLevel >= 9 && player.exp >= player.maxExp;
}

/** 转世奖励等级 */
function getRebirthBonuses(inheritanceLevel: number): {
  statBonus: number;
  expBonus: number;
  keepArts: number;
  rootBoost: number;
  title: string;
} {
  const levels = [
    { statBonus: 0.10, expBonus: 0.10, keepArts: 2, rootBoost: 3, title: '初转' },
    { statBonus: 0.22, expBonus: 0.22, keepArts: 3, rootBoost: 5, title: '二转' },
    { statBonus: 0.35, expBonus: 0.35, keepArts: 4, rootBoost: 8, title: '三转' },
    { statBonus: 0.50, expBonus: 0.50, keepArts: 5, rootBoost: 10, title: '四转' },
    { statBonus: 0.70, expBonus: 0.70, keepArts: 7, rootBoost: 15, title: '五转·圆满' },
  ];
  return levels[Math.min(inheritanceLevel, 4)];
}

const RebirthModal: React.FC<Props> = ({ isOpen, onClose, player, onRebirth }) => {
  const nextLevel = (player.inheritanceLevel || 0) + 1;
  const bonuses = getRebirthBonuses(nextLevel - 1);
  const canDo = canRebirth(player);
  const maxReached = nextLevel > 5;

  // 统计会保留的功法（挑品级最高的几个）
  const topArts = useMemo(() => {
    if (!player.cultivationArts) return [];
    const arts = player.cultivationArts
      .map(id => ({ id }))
      .sort(() => Math.random() - 0.5);
    return arts.slice(0, bonuses.keepArts);
  }, [player.cultivationArts, bonuses.keepArts]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="转世重修" titleIcon={<RefreshCw size={18} />} size="md" height="auto">
      <div className="space-y-4 text-sm">
        {maxReached ? (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">🌟</div>
            <p className="text-mystic-gold font-serif text-lg">你已达成五转圆满</p>
            <p className="text-stone-400">转世之力已臻极致，无需再度轮回。</p>
          </div>
        ) : !canDo ? (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">🔒</div>
            <p className="text-stone-400">转世重修需要达到 <span className="text-mystic-gold">元婴期 9 层</span> 且经验满值</p>
            <p className="text-stone-500 text-xs">当前：{player.realm} {player.realmLevel} 层</p>
          </div>
        ) : (
          <>
            <div className="bg-ink-900 p-4 rounded border border-yellow-700/50 text-center">
              <p className="text-yellow-400 font-serif text-lg mb-1">
                {bonuses.title}转世
              </p>
              <p className="text-stone-400 text-xs">
                抛弃肉身，保留真灵，来世重修更加强大
              </p>
            </div>

            {/* 转世收益 */}
            <div className="bg-emerald-900/20 p-3 rounded border border-emerald-700/50 space-y-2">
              <p className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                <Star size={14} /> 转世收益（第 {nextLevel} 次）
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-800 p-2 rounded">
                  <span className="text-stone-400">全属性</span>
                  <p className="text-emerald-300 font-bold">+{Math.round(bonuses.statBonus * 100)}%</p>
                </div>
                <div className="bg-stone-800 p-2 rounded">
                  <span className="text-stone-400">修炼速度</span>
                  <p className="text-emerald-300 font-bold">+{Math.round(bonuses.expBonus * 100)}%</p>
                </div>
                <div className="bg-stone-800 p-2 rounded">
                  <span className="text-stone-400">保留功法</span>
                  <p className="text-emerald-300 font-bold">{bonuses.keepArts} 门</p>
                </div>
                <div className="bg-stone-800 p-2 rounded">
                  <span className="text-stone-400">灵根提升</span>
                  <p className="text-emerald-300 font-bold">+{bonuses.rootBoost}</p>
                </div>
              </div>
            </div>

            {/* 保留与失去 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                <p className="text-emerald-400 font-bold text-xs mb-2">✅ 保留</p>
                <ul className="text-xs text-stone-300 space-y-1">
                  <li>· 灵根属性（强化后）</li>
                  <li>· {bonuses.keepArts} 门功法（需重修习）</li>
                  <li>· 所有灵宠</li>
                  <li>· 成就记录</li>
                  <li>· 天赋 & 称号</li>
                </ul>
              </div>
              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                <p className="text-red-400 font-bold text-xs mb-2">❌ 失去</p>
                <ul className="text-xs text-stone-300 space-y-1">
                  <li>· 境界回归炼气期</li>
                  <li>· 所有物品 & 灵石</li>
                  <li>· 装备 & 法宝</li>
                  <li>· 宗门身份</li>
                  <li>· 洞府（需重建）</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-900/20 p-3 rounded border border-red-700/50 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                <p className="font-bold">确认转世后将无法撤销！</p>
                <p className="text-red-400/70 mt-1">你将从炼气期重新开始，但保留真灵之力。</p>
              </div>
            </div>

            <button
              onClick={onRebirth}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-stone-900 rounded font-bold font-serif text-lg transition-colors"
            >
              确认转世重修
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export { canRebirth, getRebirthBonuses };
export default RebirthModal;
