import React, { useState, useEffect, useRef } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { PlayerStats, LotteryPrize, ItemRarity } from '../types';
import { LOTTERY_PRIZES } from '../constants/index';
import { showError } from '../utils/toastUtils';
import { getRarityColor, getRarityBorder } from '../utils/rarityUtils';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onDraw: (count: number) => void;
}

const LotteryModal: React.FC<Props> = ({ isOpen, onClose, player, onDraw }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<LotteryPrize[] | null>(null);
  const [displayTickets, setDisplayTickets] = useState(player.lotteryTickets);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const drawTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 将输入值转换为数字，空字符串时返回0
  const customCount = customCountInput === '' ? 0 : parseInt(customCountInput, 10) || 0;

  // 监听抽奖券数量变化，确保及时更新显示并自动调整自定义抽奖次数
  useEffect(() => {
    setDisplayTickets(player.lotteryTickets);
    // 如果自定义抽奖次数超过当前拥有的抽奖券数量，自动调整
    const currentCount = parseInt(customCountInput, 10) || 1;
    if (currentCount > player.lotteryTickets && player.lotteryTickets > 0) {
      setCustomCountInput(String(player.lotteryTickets));
    } else if (player.lotteryTickets === 0 && currentCount > 1) {
      setCustomCountInput('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.lotteryTickets]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
        drawTimeoutRef.current = null;
      }
    };
  }, []);

  const handleDraw = async (count: number) => {
    const currentTickets = player.lotteryTickets;
    if (currentTickets < count) {
      showError(`抽奖券不足！需要 ${count} 张，当前拥有 ${currentTickets} 张`);
      return;
    }
    if (count <= 0 || !Number.isInteger(count)) {
      showError('抽奖次数必须为正整数！');
      return;
    }

    // 清理之前的定时器
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
    }

    setIsDrawing(true);
    setLastResult(null);

    // 抽奖动画持续时间（根据抽奖次数调整，但不超过5秒）
    const drawDuration = Math.min(2500 + (count - 1) * 200, 5000);

    // 模拟抽奖动画
    drawTimeoutRef.current = setTimeout(() => {
      setIsDrawing(false);
      onDraw(count);
      // 这里应该从实际抽奖结果中获取，暂时用空数组
      setLastResult([]);
      drawTimeoutRef.current = null;
    }, drawDuration);
  };

  // 渲染抽奖动画遮罩
  const renderDrawingOverlay = () => {
    if (!isDrawing) return null;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 animate-in fade-in duration-500">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* 八卦阵背景 */}
          <div className="absolute inset-0 border-4 border-mystic-gold/20 rounded-full animate-bagua flex items-center justify-center">
            <div className="w-[90%] h-[90%] border-2 border-mystic-gold/10 rounded-full border-dashed" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="text-4xl text-mystic-gold font-bold">☯</div>
            </div>
          </div>

          {/* 灵气汇聚粒子 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="spirit-particle"
              style={
                {
                  '--rotation': `${i * 30}deg`,
                  animationDelay: `${i * 0.1}s`,
                  color:
                    i % 3 === 0
                      ? '#fbbf24'
                      : i % 3 === 1
                        ? '#a78bfa'
                        : '#60a5fa',
                } as React.CSSProperties
              }
            />
          ))}

          {/* 中心光点 */}
          <div className="relative z-10 w-16 h-16 bg-mystic-gold rounded-full shadow-[0_0_50px_rgba(203,161,53,0.8)] flex items-center justify-center animate-pulse">
            <Sparkles
              className="text-white w-8 h-8 animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="text-2xl font-serif text-mystic-gold tracking-[0.5em] animate-pulse">
            天机演化中...
          </div>
          <div className="mt-2 text-stone-500 text-sm">正在窥探大道先机</div>
        </div>

        {/* 氛围装饰 */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-24 opacity-30">
          <div className="w-1 h-32 bg-gradient-to-t from-transparent via-mystic-gold to-transparent" />
          <div className="w-1 h-32 bg-gradient-to-t from-transparent via-mystic-gold to-transparent" />
        </div>
      </div>
    );
  };

  return (
    <>
      {renderDrawingOverlay()}
      <Modal
        isOpen={isOpen}
        onClose={isDrawing ? () => {} : onClose}
        title="抽奖系统"
        titleIcon={<Gift className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />}
        size="2xl"
        height="lg"
        closeOnOverlayClick={!isDrawing}
        closeOnEsc={!isDrawing}
      >
        <div className="space-y-6">
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
          <div className="space-y-4">
            {/* 快速抽奖按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDraw(1)}
                disabled={isDrawing || displayTickets < 1}
                className="group relative px-6 py-8 bg-stone-900 hover:bg-stone-800 rounded-lg border-2 border-purple-900/50 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -inset-y-2 w-px bg-purple-500/20 left-4 group-hover:bg-purple-500/40 transition-colors" />
                <div className="absolute -inset-y-2 w-px bg-purple-500/20 right-4 group-hover:bg-purple-500/40 transition-colors" />

                {isDrawing ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-purple-400 text-sm">寻觅机缘...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <Gift
                      size={32}
                      className="text-purple-400 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-stone-200">单抽</span>
                    <span className="text-xs text-stone-500">消耗 1 张</span>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleDraw(10)}
                disabled={isDrawing || displayTickets < 10}
                className="group relative px-6 py-8 bg-stone-900 hover:bg-stone-800 rounded-lg border-2 border-yellow-900/50 hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -inset-y-2 w-px bg-yellow-500/20 left-4 group-hover:bg-yellow-500/40 transition-colors" />
                <div className="absolute -inset-y-2 w-px bg-yellow-500/20 right-4 group-hover:bg-yellow-500/40 transition-colors" />
                <div className="absolute inset-0 draw-button-shimmer pointer-events-none opacity-20" />

                {isDrawing ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-yellow-400 text-sm">天降大任...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <Sparkles
                      size={32}
                      className="text-yellow-400 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-stone-200">十连抽</span>
                    <span className="text-xs text-stone-500">消耗 10 张</span>
                  </div>
                )}
              </button>
            </div>

            {/* 自定义连抽 */}
            <div className="bg-stone-900 rounded-lg p-4 border border-stone-700">
              <div className="text-sm font-bold text-stone-300 mb-3">
                自定义连抽
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={displayTickets}
                  value={customCountInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // 允许用户输入空字符串或数字
                    if (inputValue === '') {
                      setCustomCountInput('');
                      return;
                    }
                    const value = parseInt(inputValue, 10);
                    if (!isNaN(value) && value > 0) {
                      // 输入时只验证最小值，允许用户输入超过当前抽奖券数量的值
                      // 最大值限制在失去焦点时处理
                      setCustomCountInput(String(Math.max(1, value)));
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    // 如果为空，保持空值
                    if (inputValue === '') {
                      return;
                    }
                    const value = parseInt(inputValue, 10);
                    if (isNaN(value) || value < 1) {
                      // 无效值时设为空而不是1
                      setCustomCountInput('');
                    } else {
                      // 失去焦点时，确保值在有效范围内
                      const maxValue = displayTickets > 0 ? displayTickets : 1;
                      const validValue = Math.min(Math.max(1, value), maxValue);
                      setCustomCountInput(String(validValue));
                    }
                  }}
                  disabled={isDrawing}
                  className="flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="输入抽奖次数"
                />
                <button
                  onClick={() => handleDraw(customCount)}
                  disabled={
                    isDrawing || displayTickets < customCount || customCount < 1
                  }
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white font-bold transition-colors"
                >
                  {customCount > 0 ? `抽 ${customCount} 次` : '输入抽奖次数'}
                </button>
              </div>
              <div className="text-xs text-stone-500 mt-2">
                {customCount > 0 ? `消耗 ${customCount} 张抽奖券` : '请输入抽奖次数'}
                {customCount > 0 && displayTickets < customCount && (
                  <span className="text-red-400 ml-2">（抽奖券不足）</span>
                )}
              </div>
            </div>
          </div>

          {/* 奖品稀有度分布 */}
          <div>
            <h3 className="text-lg font-bold mb-3">奖品稀有度分布</h3>
            <div className="space-y-3">
              {(['普通', '稀有', '传说', '仙品'] as const).map((rarity) => {
                const prizesOfRarity = LOTTERY_PRIZES.filter(
                  (p) => p.rarity === rarity
                );
                const totalWeight = LOTTERY_PRIZES.reduce(
                  (sum, p) => sum + p.weight,
                  0
                );
                const rarityWeight = prizesOfRarity.reduce(
                  (sum, p) => sum + p.weight,
                  0
                );
                const probability = (
                  (rarityWeight / totalWeight) *
                  100
                ).toFixed(1);

                return (
                  <div
                    key={rarity}
                    className={`bg-stone-900 rounded p-3 border ${getRarityBorder(rarity as ItemRarity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-sm font-bold ${getRarityColor(rarity).split(' ')[0]}`}
                        >
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
      </Modal>
    </>
  );
};

export default LotteryModal;
