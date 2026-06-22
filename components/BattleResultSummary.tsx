import React from 'react';

interface BattleResultSummaryProps {
  victory: boolean;
  hpLoss: number;
  expChange: number;
  spiritChange: number;
}

const BattleResultSummary: React.FC<BattleResultSummaryProps> = ({
  victory,
  hpLoss,
  expChange,
  spiritChange,
}) => {
  return (
    <div className="rounded-lg border border-stone-700 bg-ink-900/70 p-3 text-xs text-stone-300 space-y-1">
      <div className={victory ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
        {victory ? '战斗胜利' : '战斗失利'}
      </div>
      <div>损耗气血：{hpLoss}</div>
      <div>
        奖励：{expChange >= 0 ? `+${expChange}` : expChange} 修为 ·{' '}
        {spiritChange >= 0 ? `+${spiritChange}` : spiritChange} 灵石
      </div>
    </div>
  );
};

export default BattleResultSummary;
