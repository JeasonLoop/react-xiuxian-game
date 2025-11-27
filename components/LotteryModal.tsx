import React, { useState } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { PlayerStats, LotteryPrize } from '../types';
import { LOTTERY_PRIZES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onDraw: (count: 1 | 10) => void;
}

const LotteryModal: React.FC<Props> = ({ isOpen, onClose, player, onDraw }) => {
  if (!isOpen) return null;

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<LotteryPrize[] | null>(null);

  const handleDraw = async (count: 1 | 10) => {
    if (player.lotteryTickets < count) {
      alert(`抽奖券不足！需要 ${count} 张，当前拥有 ${player.lotteryTickets} 张`);
      return;
    }

    setIsDrawing(true);
    setLastResult(null);

    // 模拟抽奖动画
    setTimeout(() => {
      setIsDrawing(false);
      onDraw(count);
      // 这里应该从实际抽奖结果中获取，暂时用空数组
      setLastResult([]);
    }, 1500);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '普通': return 'text-gray-400 border-gray-600';
      case '稀有': return 'text-blue-400 border-blue-600';
      case '传说': return 'text-purple-400 border-purple-600';
      case '仙品': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-stone-800 rounded-lg border border-stone-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Gift className="text-yellow-400" size={24} />
            抽奖系统
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 抽奖券信息 */}
          <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {player.lotteryTickets} 张
            </div>
            <div className="text-stone-400">抽奖券</div>
            <div className="text-xs text-stone-500 mt-2">
              累计抽奖: {player.lotteryCount} 次
              {player.lotteryCount >= 10 && player.lotteryCount % 10 !== 0 && (
                <span className="text-yellow-400 ml-2">
                  (再抽 {10 - (player.lotteryCount % 10)} 次必出稀有以上)
                </span>
              )}
            </div>
          </div>

          {/* 抽奖按钮 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleDraw(1)}
              disabled={isDrawing || player.lotteryTickets < 1}
              className="relative px-6 py-8 bg-gradient-to-br from-purple-900 to-blue-900 hover:from-purple-800 hover:to-blue-800 rounded-lg border-2 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDrawing ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="animate-spin text-yellow-400" size={32} />
                  <span>抽奖中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Gift size={32} className="text-yellow-400" />
                  <span className="font-bold">单抽</span>
                  <span className="text-xs">消耗 1 张</span>
                </div>
              )}
            </button>

            <button
              onClick={() => handleDraw(10)}
              disabled={isDrawing || player.lotteryTickets < 10}
              className="relative px-6 py-8 bg-gradient-to-br from-yellow-900 to-orange-900 hover:from-yellow-800 hover:to-orange-800 rounded-lg border-2 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDrawing ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="animate-spin text-yellow-400" size={32} />
                  <span>抽奖中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Gift size={32} className="text-yellow-400" />
                  <span className="font-bold">十连抽</span>
                  <span className="text-xs">消耗 10 张 (必出稀有以上)</span>
                </div>
              )}
            </button>
          </div>

          {/* 奖品池预览 */}
          <div>
            <h3 className="text-lg font-bold mb-3">奖品池</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {LOTTERY_PRIZES.map(prize => (
                <div
                  key={prize.id}
                  className={`bg-stone-900 rounded p-3 border ${getRarityColor(prize.rarity).split(' ')[1]}`}
                >
                  <div className={`text-sm font-bold ${getRarityColor(prize.rarity).split(' ')[0]} mb-1`}>
                    {prize.name}
                  </div>
                  <div className="text-xs text-stone-500">{prize.rarity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryModal;

