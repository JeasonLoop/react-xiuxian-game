import React from 'react';
import {
  Sword,
  Shield,
  Heart,
  Wind,
  Zap,
  Sparkles,
  Skull,
  Flame,
  Snowflake,
  Moon,
  Hammer,
  CircleHelp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Buff, Debuff } from '../../types';

/**
 * Buff/Debuff 图标行（纯展示层可复用组件）
 * buff 绿色系 / debuff 红色系，图标右下角带持续回合角标（-1 显示 ∞）
 * 超过上限时折叠为「+N」
 */

const MAX_VISIBLE = 4;

// buff 类型 -> 图标映射
const BUFF_ICONS: Record<string, LucideIcon> = {
  attack: Sword,
  defense: Shield,
  shield: Shield,
  speed: Wind,
  heal: Heart,
  crit: Zap,
  custom: Sparkles,
};

// debuff 类型 -> 图标映射（红色系）
const DEBUFF_ICONS: Record<string, LucideIcon> = {
  poison: Skull,
  burn: Flame,
  freeze: Snowflake,
  stun: Zap,
  weakness: Moon,
  armor_break: Hammer,
  custom: CircleHelp,
};

interface BuffChip {
  key: string;
  kind: 'buff' | 'debuff';
  Icon: LucideIcon;
  label: string;
  duration: number;
}

const BuffBar: React.FC<{ buffs?: Buff[]; debuffs?: Debuff[] }> = ({
  buffs,
  debuffs,
}) => {
  const chips: BuffChip[] = [];

  (buffs || []).forEach((buff) => {
    chips.push({
      key: `buff_${buff.id}`,
      kind: 'buff',
      Icon: BUFF_ICONS[buff.type] || Sparkles,
      label: buff.description || buff.name,
      duration: buff.duration,
    });
  });

  (debuffs || []).forEach((debuff) => {
    chips.push({
      key: `debuff_${debuff.id}`,
      kind: 'debuff',
      Icon: DEBUFF_ICONS[debuff.type] || CircleHelp,
      label: debuff.description || debuff.name,
      duration: debuff.duration,
    });
  });

  if (chips.length === 0) return null;

  const visible = chips.slice(0, MAX_VISIBLE);
  const overflow = chips.length - MAX_VISIBLE;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {visible.map((chip) => (
        <span
          key={chip.key}
          title={chip.label}
          className={`relative flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] ${
            chip.kind === 'buff'
              ? 'border-emerald-500/30 bg-emerald-700/30 text-emerald-200'
              : 'border-rose-500/30 bg-rose-700/30 text-rose-200'
          }`}
        >
          <chip.Icon size={11} />
          <span className="font-semibold leading-none">
            {chip.duration === -1 ? '∞' : chip.duration}
          </span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="px-1 text-[10px] text-stone-400">+{overflow}</span>
      )}
    </div>
  );
};

export default React.memo(BuffBar);
