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
      <div className="bg-green-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl border-2 border-green-400 animate-bounce pointer-events-auto max-w-[90vw]">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl">✓</span>
          <div>
            <div className="font-bold text-base md:text-lg">购买成功！</div>
            <div className="text-xs md:text-sm">
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
    <>
     {
      log.text && (
          <div className="fixed top-20 right-4 z-[70] pointer-events-none animate-fade-in">
            <div className={logClassName}>{log.text}</div>
          </div>
      )
     }
    </>
  );
}

interface LotteryRewardsProps {
  rewards: Array<{ type: string; name: string; quantity?: number }>;
  onClose?: () => void;
}

export function LotteryRewardsToast({ rewards, onClose }: LotteryRewardsProps) {
  if (rewards.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] animate-in fade-in duration-300 pointer-events-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border-2 border-mystic-gold p-1 rounded-lg shadow-[0_0_50px_rgba(203,161,53,0.3)] max-w-md w-[90%] md:w-auto animate-in zoom-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-stone-800 rounded px-6 py-8 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-mystic-gold/20 rounded-full blur-xl animate-pulse" />
            <div className="relative text-5xl">🎁</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-serif text-mystic-gold font-bold tracking-widest">
              机缘到手
            </div>
            <div className="text-stone-400 text-sm mt-1">恭喜道友获得以下宝物</div>
          </div>

          <div className="w-full space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {rewards.map((reward, idx) => (
              <div
                key={idx}
                className="bg-stone-900/50 border border-stone-700 rounded-lg px-4 py-3 flex items-center justify-between group hover:border-mystic-gold/50 transition-colors animate-in slide-in-from-bottom duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-mystic-gold shadow-[0_0_5px_rgba(203,161,53,1)]" />
                  <span className="font-semibold text-stone-200">{reward.name}</span>
                </div>
                {reward.quantity !== undefined && (
                  <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">
                    x{reward.quantity}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-600 to-transparent" />

          <div className="text-stone-500 text-xs animate-pulse">
            点击空白处关闭
          </div>
        </div>
      </div>
    </div>
  );
}
