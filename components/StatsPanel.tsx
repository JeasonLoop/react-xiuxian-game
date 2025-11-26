import React from 'react';
import { PlayerStats, ItemRarity } from '../types';
import { CULTIVATION_ARTS } from '../constants';
import { Shield, Zap, Coins, BookOpen, Sword } from 'lucide-react';

interface Props {
  player: PlayerStats;
}

const StatsPanel: React.FC<Props> = ({ player }) => {
  const expPercentage = Math.min(100, (player.exp / player.maxExp) * 100);
  const hpPercentage = Math.min(100, (player.hp / player.maxHp) * 100);

  const activeArt = CULTIVATION_ARTS.find(a => a.id === player.activeArtId);
  const equippedItem = player.inventory.find(i => i.id === player.equippedArtifactId);

  const getRarityColor = (rarity: ItemRarity | undefined) => {
    switch (rarity) {
      case '稀有': return 'text-blue-400';
      case '传说': return 'text-purple-400';
      case '仙品': return 'text-mystic-gold';
      case '普通':
      default: return 'text-stone-200';
    }
  };

  return (
    <div className="bg-paper-800 border-r-2 border-stone-700 p-6 flex flex-col gap-6 w-full md:w-80 shrink-0 h-auto md:h-full overflow-y-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-mystic-gold tracking-widest">{player.name}</h2>
        <div className="text-stone-400 text-sm mt-1 font-serif">{player.realm} - {player.realmLevel} 层</div>
      </div>

      {/* Vitals */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>气血 (HP)</span>
            <span>{player.hp} / {player.maxHp}</span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
            <div 
              className="h-full bg-mystic-blood transition-all duration-500 ease-out" 
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>修为 (Exp)</span>
            <span>{Math.floor(player.exp)} / {player.maxExp}</span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
            <div 
              className="h-full bg-mystic-jade transition-all duration-500 ease-out" 
              style={{ width: `${expPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Art */}
      <div className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center gap-3">
        <BookOpen size={18} className="text-blue-400" />
        <div className="flex-1">
          <div className="text-xs text-stone-500">当前心法</div>
          <div className="text-stone-200 font-serif font-bold text-sm">
            {activeArt ? activeArt.name : '无名心法'}
          </div>
        </div>
      </div>

      {/* Equipped Artifact */}
      <div className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center gap-3">
        <Sword size={18} className="text-purple-400" />
        <div className="flex-1">
          <div className="text-xs text-stone-500">本命法宝</div>
          <div className={`font-serif font-bold text-sm ${getRarityColor(equippedItem?.rarity)}`}>
            {equippedItem ? equippedItem.name : '未装备'}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-2 gap-4 mt-1">
        <div className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center gap-3">
          <Zap size={18} className="text-stone-500" />
          <div>
            <div className="text-xs text-stone-500">攻击</div>
            <div className="text-stone-200 font-bold">{player.attack}</div>
          </div>
        </div>
        <div className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center gap-3">
          <Shield size={18} className="text-stone-500" />
          <div>
            <div className="text-xs text-stone-500">防御</div>
            <div className="text-stone-200 font-bold">{player.defense}</div>
          </div>
        </div>
        <div className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center gap-3 col-span-2">
          <Coins size={18} className="text-mystic-gold" />
          <div>
            <div className="text-xs text-stone-500">灵石</div>
            <div className="text-mystic-gold font-bold">{player.spiritStones}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-stone-700 text-xs text-stone-500 italic text-center">
        “道可道，非常道。”
      </div>
    </div>
  );
};

export default StatsPanel;