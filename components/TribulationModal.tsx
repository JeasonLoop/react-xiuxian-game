import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Shield, Sword, Heart, Eye, Gauge, Skull, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { TribulationState, TribulationResult } from '../types';
import {
  getTribulationDescription,
  formatAttributeBonus,
  formatEquipmentBonus,
} from '../utils/tribulationUtils';
import { TRIBULATION_STAGES } from '../constants';

interface TribulationModalProps {
  tribulationState: TribulationState;
  onTribulationComplete: (result: TribulationResult) => void;
}

const TribulationModal: React.FC<TribulationModalProps> = ({
  tribulationState,
  onTribulationComplete,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TribulationResult | null>(null);
  const hasStartedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTribulation = useCallback(() => {
    if (!tribulationState.isOpen || isProcessing) return;

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
  }, [tribulationState, isProcessing]);

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
            {isProcessing && (
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
