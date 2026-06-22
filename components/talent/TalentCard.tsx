import React from 'react';
import {
  Sword,
  Shield,
  Heart,
  Brain,
  Dumbbell,
  Wind,
  Sparkles,
  Clover,
  Star,
  Check,
} from 'lucide-react';
import { Talent } from '../../types';
import { getRarityColor, getRarityTextColor, getRarityBadge } from '../../utils/rarityUtils';
import { getStatLabel, formatStatValue } from '../../utils/talentUtils';

interface TalentCardProps {
  talent: Talent;
  selected: boolean;
  canAfford: boolean;
  onToggle: (id: string) => void;
}

/** Map stat keys to lucide icons */
const STAT_ICONS: Record<string, React.FC<{ className?: string; size?: number }>> = {
  attack: Sword,
  defense: Shield,
  hp: Heart,
  spirit: Brain,
  physique: Dumbbell,
  speed: Wind,
  expRate: Sparkles,
  luck: Clover,
};

const TalentCard: React.FC<TalentCardProps> = ({ talent, selected, canAfford, onToggle }) => {
  const isInteractive = canAfford || selected;

  const handleClick = () => {
    if (isInteractive) {
      onToggle(talent.id);
    }
  };

  // Collect non-zero stat effects
  const statEntries = Object.entries(talent.effects).filter(
    ([, value]) => value !== undefined && value !== 0,
  ) as [string, number][];

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col p-3 rounded-lg border-2 transition-all duration-200 select-none ${
        selected
          ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
          : getRarityColor(talent.rarity)
      } ${
        isInteractive
          ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
          : 'opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <Check size={12} className="text-stone-900" strokeWidth={3} />
        </div>
      )}

      {/* Header: name + badges */}
      <div className="flex items-start gap-2 mb-1.5 pr-6">
        <span className={`text-sm font-bold leading-tight ${getRarityTextColor(talent.rarity)}`}>
          {talent.name}
        </span>
        {talent.specialAbility && (
          <Star size={13} className="text-amber-400 flex-shrink-0 mt-0.5 fill-amber-400" />
        )}
      </div>

      {/* Category + rarity badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded border bg-stone-800/80 text-stone-400 border-stone-600">
          {talent.category}
        </span>
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getRarityBadge(talent.rarity)}`}>
          {talent.rarity}
        </span>
      </div>

      {/* Fate cost */}
      <div className="absolute top-2 left-2 flex items-center gap-0.5">
        <span className="text-[11px] font-bold text-amber-400/80">{talent.fateCost}</span>
        <span className="text-[9px] text-amber-500/60">点</span>
      </div>

      {/* Stat effects grid */}
      {statEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-auto pt-1.5 border-t border-stone-700/50">
          {statEntries.map(([stat, value]) => {
            const Icon = STAT_ICONS[stat] || Sparkles;
            return (
              <div key={stat} className="flex items-center gap-1">
                <Icon size={11} className="text-stone-500 flex-shrink-0" />
                <span className="text-[11px] text-stone-500 truncate">{getStatLabel(stat)}</span>
                <span className="text-[11px] font-medium text-emerald-400 ml-auto">
                  {formatStatValue(stat, value)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Description tooltip hint (truncated) */}
      {talent.description && (
        <p className="mt-1.5 text-[10px] text-stone-500 leading-relaxed line-clamp-2">
          {talent.description}
        </p>
      )}
    </div>
  );
};

export default TalentCard;
