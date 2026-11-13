import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Shield } from 'lucide-react';
import type { Buff, Debuff } from '../../types';
import BuffBar from './BuffBar';

/**
 * 对峙舞台的战斗单位面板（纯展示层可复用组件）
 * 名称 + 境界 + 血条 + 灵力条 + buff 图标行
 * hitTick：受击计数（驱动面板 shake 与血条容器红光，奇偶交替重触发动画）
 * lungeTick：进攻前冲计数（translateX 由 --lunge-dx 决定方向）
 * 两个 tick 都不重挂载组件，保证血条 width 过渡动画不受影响
 */
interface FighterPanelProps {
  side: 'player' | 'enemy';
  name: string;
  realm?: string;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  buffs?: Buff[];
  debuffs?: Debuff[];
  hitTick?: number;
  lungeTick?: number;
  defending?: boolean;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const FighterPanel: React.FC<FighterPanelProps> = ({
  side,
  name,
  realm,
  hp,
  maxHp,
  mana,
  maxMana,
  buffs,
  debuffs,
  hitTick = 0,
  lungeTick = 0,
  defending = false,
  headerExtra,
  footer,
  className,
}) => {
  const isPlayer = side === 'player';
  const hpPercent = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  const manaPercent =
    typeof mana === 'number' && typeof maxMana === 'number' && maxMana > 0
      ? Math.max(0, Math.min(100, (mana / maxMana) * 100))
      : null;

  // 动画类奇偶交替：每次 tick 变化都会重新触发一次同名 keyframes 动画
  const shakeClass = hitTick > 0 ? (hitTick % 2 === 1 ? 'anim-shake-a' : 'anim-shake-b') : '';
  const lungeClass = lungeTick > 0 ? (lungeTick % 2 === 1 ? 'anim-lunge-a' : 'anim-lunge-b') : '';
  const flashClass = hitTick > 0 ? (hitTick % 2 === 1 ? 'anim-hp-flash-a' : 'anim-hp-flash-b') : '';
  const lungeStyle = { '--lunge-dx': isPlayer ? '28px' : '-28px' } as CSSProperties;

  return (
    <div
      className={`relative rounded-lg border p-3 md:p-4 ${
        isPlayer
          ? 'border-emerald-700/40 bg-emerald-900/20'
          : 'border-rose-700/40 bg-rose-900/20'
      } ${shakeClass} ${lungeClass} ${className || ''}`}
      style={lungeStyle}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`truncate font-semibold ${isPlayer ? 'text-emerald-300' : 'text-rose-300'}`}
          >
            {name}
          </span>
          {realm && (
            <span className="shrink-0 rounded border border-stone-700 bg-ink-800 px-1.5 py-0.5 text-[10px] text-stone-400">
              {realm}
            </span>
          )}
          {defending && (
            <span title="防御姿态" className="shrink-0 text-cyan-300">
              <Shield size={12} />
            </span>
          )}
          {headerExtra}
        </div>
        <span className="shrink-0 text-[11px] text-stone-400">
          {Math.floor(hp)} / {Math.floor(maxHp)}
        </span>
      </div>

      {/* 血条：width 过渡平滑 + 受击时容器红光脉冲一次 */}
      <div
        className={`relative h-3 w-full overflow-hidden rounded-full bg-stone-800 ${flashClass}`}
      >
        <div
          className={`h-3 rounded-full transition-[width] duration-300 ease-out ${
            isPlayer ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* 灵力条（有灵力数据时显示） */}
      {manaPercent !== null && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-[width] duration-300 ease-out"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-stone-400">
            灵力 {Math.floor(mana || 0)}/{Math.floor(maxMana || 0)}
          </span>
        </div>
      )}

      {footer}

      {/* Buff/Debuff 图标行 */}
      <BuffBar buffs={buffs} debuffs={debuffs} />
    </div>
  );
};

export default React.memo(FighterPanel);
