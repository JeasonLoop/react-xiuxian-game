import React from 'react';

interface FatePointBudgetProps {
  used: number;
  total: number;
}

const FatePointBudget: React.FC<FatePointBudgetProps> = ({ used, total }) => {
  const remaining = total - used;
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const isNearFull = percentage >= 80;
  const isOverBudget = used > total;

  return (
    <div className="w-full px-4 py-3 bg-stone-800 rounded-lg border border-stone-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-amber-400 tracking-wide">命运点</span>
        <span className={`text-sm font-bold tabular-nums ${isOverBudget ? 'text-red-400' : 'text-amber-300'}`}>
          {remaining} / {total}
        </span>
      </div>

      <div className="relative w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isOverBudget
              ? 'bg-red-500'
              : isNearFull
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-gradient-to-r from-amber-700 to-amber-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {isNearFull && !isOverBudget && (
          <div
            className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-amber-400"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-stone-500">已用 {used}</span>
        <span className="text-xs text-stone-500">剩余 {remaining < 0 ? 0 : remaining}</span>
      </div>
    </div>
  );
};

export default FatePointBudget;
