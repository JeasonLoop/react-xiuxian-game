import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Shield, Sword, Heart, Eye, Gauge, Skull, CheckCircle2, XCircle, Sparkles, Grid3X3, HelpCircle, Lightbulb } from 'lucide-react';
import { TribulationState, TribulationResult } from '../types';
import {
  getTribulationDescription,
  formatAttributeBonus,
  formatEquipmentBonus,
} from '../utils/tribulationUtils';
import { generateGoldenCorePuzzle, generateNascentSoulPuzzle, generateSpiritSeveringPuzzle } from '../utils/cultivationUtils';
import { TRIBULATION_STAGES, CULTIVATION_ARTS, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS } from '../constants';

interface TribulationModalProps {
  tribulationState: TribulationState;
  onTribulationComplete: (result: TribulationResult) => void;
  player: any; // PlayerStats - 为了避免导入循环，使用any
}

const TribulationModal: React.FC<TribulationModalProps> = ({
  tribulationState,
  onTribulationComplete,
  player,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TribulationResult | null>(null);
  const hasStartedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 解密游戏状态
  const [puzzle, setPuzzle] = useState<any>(null);
  const [userInput, setUserInput] = useState<number[]>([]); // 用于数字序列
  const [currentSequence, setCurrentSequence] = useState<string[]>([]); // 用于符文序列
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 用于符文序列选择
  const [attempts, setAttempts] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);

  // 初始化解密游戏（金丹期、元婴期、化神期）
  const initializePuzzle = useCallback(() => {
    if (tribulationState.tribulationLevel === '金丹天劫') {
      // 金丹期：数字序列找规律
      // 使用所有功法数量来决定游戏难度（随法门数上升）
      const artCount = player.cultivationArts?.length || 0;

      const puzzleData = generateGoldenCorePuzzle(artCount);
      setPuzzle(puzzleData);
      setUserInput([0]); // 数字序列只需要一个答案
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === '元婴天劫') {
      // 元婴期：数字序列找规律（使用天地精华品质决定难度）
      const essenceQuality = player.heavenEarthEssence
        ? (HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence]?.quality || 50)
        : 50;

      // 使用数字序列游戏（与金丹期相同，但难度基于天地精华品质）
      const artCount = player.cultivationArts?.length || 0;
      // 结合功法数量和精华品质计算难度
      const difficultyFactor = Math.min(artCount + Math.floor(essenceQuality / 20), 9);

      const puzzleData = generateGoldenCorePuzzle(difficultyFactor);
      setPuzzle(puzzleData);
      setUserInput([0]);
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === '化神天劫') {
      // 化神期：符文序列（使用天地之髓品质决定难度）
      const marrowQuality = player.heavenEarthMarrow
        ? (HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow]?.quality || 50)
        : 50;

      const puzzleData = generateSpiritSeveringPuzzle(marrowQuality);
      setPuzzle(puzzleData);
      setCurrentSequence([...puzzleData.sequence]); // 初始化当前序列
      setSelectedIndex(null); // 重置选择
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    }
  }, [tribulationState, player.cultivationArts, player.heavenEarthEssence, player.heavenEarthMarrow]);

  const continueTribulation = useCallback(() => {
    let stageIndex = 0;

    const playStage = () => {
      if (stageIndex < TRIBULATION_STAGES.length - 2) { // -2 排除成功和失败状态
        setCurrentStage(stageIndex);
        stageIndex++;
        const delay = TRIBULATION_STAGES[stageIndex - 1].delay;
        timeoutRef.current = setTimeout(playStage, delay);
      } else {
        // 所有阶段完成，计算结果
        const tribulationResult: TribulationResult = {
          success: Math.random() > tribulationState.deathProbability,
          deathProbability: tribulationState.deathProbability,
          roll: Math.random(),
          hpLoss: Math.floor(tribulationState.totalStats.maxHp * (Math.random() * 0.3 + 0.1)),
          description: '',
        };

        if (tribulationResult.success) {
          // 渡劫成功
          const hpLossPercent = Math.random() * 0.3 + 0.1; // 损失10%-40%气血
          tribulationResult.hpLoss = Math.floor(tribulationState.totalStats.maxHp * hpLossPercent);

          if (tribulationResult.deathProbability < 0.2) {
            tribulationResult.description = '天劫对你来说如同儿戏，你轻松度过三道雷劫，毫发无损！';
          } else if (tribulationResult.deathProbability < 0.4) {
            tribulationResult.description = '你咬牙坚持，虽然身负重伤，但成功度过天劫！';
          } else if (tribulationResult.deathProbability < 0.6) {
            tribulationResult.description = '天劫凶险，你险象环生，最终险渡难关！';
          } else {
            tribulationResult.description = '你在生死边缘徘徊，凭着绝世运气躲过致命雷击！';
          }
        } else {
          // 渡劫失败
          if (tribulationResult.deathProbability < 0.3) {
            tribulationResult.description = '天劫太强，你虽全力抵抗，仍被雷霆击中，魂飞魄散...';
          } else if (tribulationResult.deathProbability < 0.5) {
            tribulationResult.description = '雷劫太过凶猛，你肉身被毁，元神亦被打散...';
          } else if (tribulationResult.deathProbability < 0.7) {
            tribulationResult.description = '天地之威不可挡，你在天劫下化为尘埃...';
          } else {
            tribulationResult.description = '绝世凶劫降临，你毫无还手之力，当场陨落...';
          }
        }

        setIsProcessing(false);
        setResult(tribulationResult);
      }
    };

    playStage();
  }, [tribulationState]);

  const handlePuzzleSubmit = useCallback(() => {
    if (!puzzle) return;

    setAttempts(prev => prev + 1);

    let isCorrect = false;

    // 根据游戏类型判断答案
    if (puzzle.puzzleType === '数字序列') {
      // 数字序列游戏：只需要比较一个答案
      isCorrect = userInput[0] === puzzle.solution;
    } else if (puzzle.puzzleType === '符文序列') {
      // 符文序列游戏：比较当前序列是否等于目标序列
      isCorrect = currentSequence.length === puzzle.targetSequence.length &&
                  currentSequence.every((val, idx) => val === puzzle.targetSequence[idx]);
    }

    if (isCorrect) {
      // 解密成功，继续天劫
      setShowPuzzle(false);
      continueTribulation();
    } else if (attempts >= puzzle.maxAttempts - 1) {
      // 解密失败，天劫失败
      const failMessage = puzzle.puzzleType === '数字序列'
        ? '数字序列推演失败！雷劫趁虚而入，你身陨道消...'
        : '符文序列推演失败！天劫之力将你吞噬...';
      const tribulationResult: TribulationResult = {
        success: false,
        deathProbability: 1.0,
        roll: Math.random(),
        description: failMessage,
      };
      setResult(tribulationResult);
      setIsProcessing(false);
      setShowPuzzle(false);
    }
  }, [puzzle, userInput, currentSequence, attempts, continueTribulation]);

  const startTribulation = useCallback(() => {
    if (!tribulationState.isOpen || isProcessing) return;

    // 金丹期、元婴期、化神期特殊处理：先进行解密游戏
    if (tribulationState.tribulationLevel === '金丹天劫' ||
        tribulationState.tribulationLevel === '元婴天劫' ||
        tribulationState.tribulationLevel === '化神天劫') {
      initializePuzzle();
      return;
    }

    // 其他境界正常流程
    continueTribulation();
  }, [tribulationState, isProcessing, initializePuzzle, continueTribulation]);

  useEffect(() => {
    // 当弹窗打开时，自动开始渡劫动画
    // 只有当没有在处理且没有结果且之前没开始过时才触发
    if (tribulationState.isOpen && !isProcessing && !result && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsProcessing(true);
      startTribulation();
    }
    // 当弹窗关闭时，重置状态
    if (!tribulationState.isOpen) {
      hasStartedRef.current = false;
      setCurrentStage(0);
      setIsProcessing(false);
      setResult(null);
      setShowPuzzle(false);
      setPuzzle(null);
      setUserInput([]);
      setAttempts(0);
      // 清除可能存在的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [tribulationState.isOpen, isProcessing, result, startTribulation]);

  const handleClose = () => {
    if (result) {
      onTribulationComplete(result);
    }
  };

  if (!tribulationState.isOpen) return null;

  const riskColor = tribulationState.deathProbability < 0.3 ? 'text-green-400' :
                   tribulationState.deathProbability < 0.5 ? 'text-yellow-400' :
                   tribulationState.deathProbability < 0.7 ? 'text-orange-400' : 'text-red-400';

  const currentStageInfo = TRIBULATION_STAGES[currentStage];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-2 sm:p-4 md:p-6 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 to-stone-900 rounded-lg border-2 border-purple-500/50 shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="p-4 sm:p-6 md:p-8">
          {/* 标题 */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-purple-300">
                {tribulationState.tribulationLevel}
              </h2>
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="text-sm sm:text-base md:text-lg text-stone-300">
              {tribulationState.targetRealm}突破在即，天劫降临！
            </p>
          </div>

          {/* 渡劫动画阶段 */}
          <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-black/30 rounded-lg border border-purple-500/30">
            {/* 解密游戏 */}
            {showPuzzle && puzzle && (
              <div className="text-center">
                <Grid3X3 className="text-purple-400 mx-auto mb-4 sm:mb-6 w-8 h-8 sm:w-10 sm:h-10" />
                <h3 className="text-lg sm:text-xl md:text-2xl text-purple-300 font-serif mb-2 sm:mb-3">
                  {puzzle.puzzleType === '数字序列' ? '数字序列推演' : '符文序列推演'}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-stone-400 mb-4 sm:mb-6">
                  {puzzle.description}
                </p>

                {/* 数字序列游戏 */}
                {puzzle.puzzleType === '数字序列' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 flex-wrap">
                      {puzzle.sequence.map((num: number, index: number) => (
                        <div
                          key={index}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-900/50 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-purple-200"
                        >
                          {num}
                        </div>
                      ))}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-stone-800 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-stone-400">
                        ?
                      </div>
                    </div>

                    {/* 答案输入 */}
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">请输入下一个数字：</label>
                      <input
                        type="number"
                        value={userInput[0] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setUserInput([val]);
                        }}
                        className="w-24 h-12 sm:w-28 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-stone-800 border-2 border-purple-500 rounded-lg text-stone-200 focus:border-purple-400 focus:outline-none"
                        placeholder="?"
                        min="1"
                      />
                    </div>
                  </div>
                )}

                {/* 符文序列游戏 */}
                {puzzle.puzzleType === '符文序列' && (
                  <div className="mb-6">
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">目标序列：</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {puzzle.targetSequence.map((symbol: string, index: number) => (
                          <div
                            key={index}
                            className="w-12 h-12 sm:w-14 sm:h-14 bg-green-900/50 border-2 border-green-500 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-green-200"
                          >
                            {symbol}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">当前序列（点击两个符文交换位置）：</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {currentSequence.map((symbol: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (selectedIndex === null) {
                                // 第一次点击：选择第一个符文
                                setSelectedIndex(index);
                              } else if (selectedIndex === index) {
                                // 点击同一个符文：取消选择
                                setSelectedIndex(null);
                              } else {
                                // 第二次点击：交换两个符文
                                const newSequence = [...currentSequence];
                                [newSequence[selectedIndex], newSequence[index]] = [newSequence[index], newSequence[selectedIndex]];
                                setCurrentSequence(newSequence);
                                setSelectedIndex(null);
                              }
                            }}
                            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold transition-colors cursor-pointer ${
                              selectedIndex === index
                                ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                                : 'bg-purple-900/50 border-purple-500 text-purple-200 hover:bg-purple-800/50'
                            }`}
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-2">
                        {selectedIndex === null
                          ? '提示：先点击一个符文，再点击另一个符文来交换位置'
                          : `已选择第 ${selectedIndex + 1} 个符文，请点击另一个符文交换`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 提示按钮和规则说明 */}
                <div className="mb-4 space-y-2">
                  <button
                    onClick={() => {
                      if (!hintUsed) {
                        setHintUsed(true);
                      }
                      setShowHint(!showHint);
                    }}
                    className="px-3 py-1.5 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <HelpCircle size={14} />
                    {showHint ? '隐藏提示' : '查看提示'}
                  </button>

                  {showHint && (
                    <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="text-yellow-400" size={16} />
                        <span className="text-sm font-bold text-yellow-300">规律提示</span>
                      </div>
                      <div className="text-xs text-stone-300 space-y-1.5">
                        <div><strong className="text-purple-300">规律类型：</strong>{puzzle.pattern}</div>
                        <div className="mt-2 pt-2 border-t border-purple-500/30">
                          <strong className="text-yellow-300">常见规律：</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-400">
                            <li>等差数列：每次增加相同的数（如：2, 4, 6, 8...）</li>
                            <li>等比数列：每次乘以相同的数（如：2, 4, 8, 16...）</li>
                            <li>递增步长：每次增加的数逐渐变大（如：1, 3, 6, 10...）</li>
                            <li>平方序列：完全平方数（如：1, 4, 9, 16...）</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-stone-500 mb-4 sm:mb-6">
                  剩余尝试次数: {puzzle.maxAttempts - attempts}
                  {hintUsed && <span className="text-yellow-400 ml-2">(已查看提示)</span>}
                </div>

                <button
                  onClick={handlePuzzleSubmit}
                  disabled={
                    puzzle.puzzleType === '数字序列'
                      ? (!userInput[0] || userInput[0] === 0)
                      : false // 符文序列总是可以提交
                  }
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold rounded-lg transition-colors"
                >
                  {puzzle.puzzleType === '数字序列' ? '提交答案' : '确认序列'}
                </button>
              </div>
            )}

            {isProcessing && !showPuzzle && (
              <div className="text-center">
                <Zap className="text-yellow-400 mx-auto mb-2 sm:mb-3 animate-pulse w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-yellow-300 font-medium mb-1 sm:mb-2">
                  {currentStageInfo.stage}
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-400">{currentStageInfo.description}</p>
              </div>
            )}

            {result && result.success && (
              <div className="text-center">
                <CheckCircle2 className="text-green-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-green-300 font-medium mb-1 sm:mb-2">
                  渡劫成功
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300 mb-2 sm:mb-3">{result.description}</p>
                <p className="text-xs sm:text-sm text-orange-300">
                  损耗气血：{result.hpLoss} / {tribulationState.totalStats.maxHp}
                </p>
              </div>
            )}

            {result && !result.success && (
              <div className="text-center">
                <XCircle className="text-red-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-red-300 font-medium mb-1 sm:mb-2">
                  渡劫失败
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300">{result.description}</p>
              </div>
            )}
          </div>

          {/* 天劫详情 */}
          {!result && (
            <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3 md:space-y-4">
              {/* 死亡概率 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Skull className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">死亡概率</span>
                </div>
                <span className={`text-lg sm:text-xl md:text-2xl font-bold ${riskColor}`}>
                  {(tribulationState.deathProbability * 100).toFixed(1)}%
                </span>
              </div>

              {/* 属性修正 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Shield className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">属性加成</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatAttributeBonus(tribulationState.attributeBonus)}
                </span>
              </div>

              {/* 装备修正 */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Sparkles className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">装备加成</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatEquipmentBonus(tribulationState.equipmentBonus)}
                </span>
              </div>

              {/* 综合属性 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Sword className="text-orange-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">攻击</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.attack}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Shield className="text-blue-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">防御</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.defense}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Heart className="text-red-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">气血</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.maxHp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Eye className="text-purple-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">神识</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.spirit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Gauge className="text-green-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">体魄</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.physique}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Zap className="text-yellow-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">速度</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.speed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 按钮 */}
          {result && (
            <button
              onClick={handleClose}
              className={`w-full py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold rounded-lg border-2 transition-all ${
                result.success
                  ? 'bg-green-700 hover:bg-green-600 text-green-100 border-green-500'
                  : 'bg-red-700 hover:bg-red-600 text-red-100 border-red-500'
              }`}
            >
              {result.success ? '成功突破' : '魂飞魄散'}
            </button>
          )}

          {!result && (
            <div className="text-center text-stone-500 text-xs sm:text-sm mt-2 sm:mt-4">
              天劫降临，不可逃避，唯有直面生死！
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TribulationModal;
