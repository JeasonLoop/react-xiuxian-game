import React, { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { PlayerStats, LotteryPrize, ItemRarity } from '../types';
import { LOTTERY_PRIZES } from '../constants';
import { showError } from '../utils/toastUtils';
import { getRarityTextColor } from '../utils/rarityUtils';

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
  const [displayTickets, setDisplayTickets] = useState(player.lotteryTickets);

  // 监听抽奖券数量变化，确保及时更新显示
  useEffect(() => {
    setDisplayTickets(player.lotteryTickets);
  }, [player.lotteryTickets]);

  const handleDraw = async (count: 1 | 10) => {
    const currentTickets = player.lotteryTickets;
    if (currentTickets < count) {
      showError(
        `抽奖券不足！需要 ${count} 张，当前拥有 ${currentTickets} 张`
      );
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

  // 使用统一的工具函数获取稀有度颜色（带边框）
  const getRarityColor = (rarity: string) => {
    const baseColor = getRarityTextColor(rarity as ItemRarity);
    switch (rarity) {
      case '普通':
        return `${baseColor} border-gray-600`;
      case '稀有':
        return `${baseColor} border-blue-600`;
      case '传说':
        return `${baseColor} border-purple-600`;
      case '仙品':
        return `${baseColor} border-yellow-600`;
      default:
        return 'text-gray-400 border-gray-600';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Gift className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
            抽奖系统
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 抽奖券信息 */}
          <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {displayTickets} 张
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
              disabled={isDrawing || displayTickets < 1}
              className="relative px-6 py-8 bg-gradient-to-br from-purple-900 to-blue-900 hover:from-purple-800 hover:to-blue-800 rounded-lg border-2 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDrawing ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles
                    className="animate-spin text-yellow-400"
                    size={32}
                  />
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
              disabled={isDrawing || displayTickets < 10}
              className="relative px-6 py-8 bg-gradient-to-br from-yellow-900 to-orange-900 hover:from-yellow-800 hover:to-orange-800 rounded-lg border-2 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDrawing ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles
                    className="animate-spin text-yellow-400"
                    size={32}
                  />
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

          {/* 奖品稀有度分布 */}
          <div>
            <h3 className="text-lg font-bold mb-3">奖品稀有度分布</h3>
            <div className="space-y-3">
              {(['普通', '稀有', '传说', '仙品'] as const).map((rarity) => {
                const prizesOfRarity = LOTTERY_PRIZES.filter((p) => p.rarity === rarity);
                const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
                const rarityWeight = prizesOfRarity.reduce((sum, p) => sum + p.weight, 0);
                const probability = ((rarityWeight / totalWeight) * 100).toFixed(1);

                return (
                  <div
                    key={rarity}
                    className={`bg-stone-900 rounded p-3 border ${getRarityColor(rarity).split(' ')[1]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-bold ${getRarityColor(rarity).split(' ')[0]}`}>
                          {rarity}
                        </div>
                        <div className="text-xs text-stone-500">
                          ({prizesOfRarity.length} 种奖品)
                        </div>
                      </div>
                      <div className="text-sm font-bold text-yellow-400">
                        {probability}%
                      </div>
                    </div>
                    <div className="mt-2 bg-stone-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${rarity === '普通' ? 'bg-gray-500' : rarity === '稀有' ? 'bg-blue-500' : rarity === '传说' ? 'bg-purple-500' : 'bg-yellow-500'}`}
                        style={{ width: `${probability}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-stone-500 text-center">
              💡 十连抽必出稀有以上品质
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryModal;
