import React from 'react';
import { LogEntry } from '../types';

interface PurchaseSuccessProps {
  item: string;
  quantity: number;
}
/**
 *
 * @param item 物品名称
 * @param quantity 物品数量
 * 购买成功弹窗
 * @returns
 */
export function PurchaseSuccessToast({ item, quantity }: PurchaseSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] pointer-events-none">
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-green-400 animate-bounce pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <div className="font-bold text-lg">购买成功！</div>
            <div className="text-sm">
              获得 {item} x{quantity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ItemActionToastProps {
  log: LogEntry | null;
}

/**
 * 物品使用/装备后的轻提示组件
 * 显示与LogPanel相同格式的内容
 */
export function ItemActionToast({ log }: ItemActionToastProps) {
  if (!log) return null;

  const logClassName = (() => {
    const baseClass = 'p-3 rounded border-l-4 font-serif text-sm shadow-2xl';
    switch (log.type) {
      case 'normal':
        return `${baseClass} border-stone-600 text-stone-300 bg-ink-800/90`;
      case 'gain':
        return `${baseClass} border-mystic-jade text-emerald-100 bg-emerald-900/90`;
      case 'danger':
        return `${baseClass} border-mystic-blood text-red-100 bg-red-900/90`;
      case 'special':
        return `${baseClass} border-mystic-gold text-amber-100 bg-amber-900/90`;
      default:
        return `${baseClass} border-stone-600 text-stone-300 bg-ink-800/90`;
    }
  })();

  return (
    <div className="fixed top-20 right-4 z-[70] pointer-events-none animate-fade-in">
      <div className={logClassName}>{log.text}</div>
    </div>
  );
}

interface LotteryRewardsProps {
  rewards: Array<{ type: string; name: string; quantity?: number }>;
}

export function LotteryRewardsToast({ rewards }: LotteryRewardsProps) {
  if (rewards.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] pointer-events-none">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white px-8 py-6 rounded-lg shadow-2xl border-2 border-purple-400 animate-bounce pointer-events-auto max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="text-3xl">🎁</div>
          <div className="font-bold text-xl">抽奖获得！</div>
          <div className="w-full space-y-2 max-h-60 overflow-y-auto">
            {rewards.map((reward, idx) => (
              <div
                key={idx}
                className="bg-white/20 rounded px-4 py-2 flex items-center justify-between"
              >
                <span className="font-semibold">{reward.name}</span>
                {reward.quantity !== undefined && (
                  <span className="text-yellow-300 font-bold">
                    x{reward.quantity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
