import React, { useState, useEffect } from 'react';
import { PlayerStats, AdventureResult } from '../types';
import { RandomSectTask } from '../services/randomService';
import { generateAdventureEvent } from '../services/aiService';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: RandomSectTask;
  player: PlayerStats;
  onTaskComplete: (task: RandomSectTask, encounterResult?: AdventureResult) => void;
}

const SectTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  task,
  player,
  onTaskComplete,
}) => {
  const [stage, setStage] = useState<'preparing' | 'executing' | 'encounter' | 'complete'>('preparing');
  const [progress, setProgress] = useState(0);
  const [encounterResult, setEncounterResult] = useState<AdventureResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStage('preparing');
      setProgress(0);
      setEncounterResult(null);
    }
  }, [isOpen, task.id]);

  const difficultyColors = {
    '简单': 'text-green-400',
    '普通': 'text-blue-400',
    '困难': 'text-orange-400',
    '极难': 'text-red-400',
  };

  const difficultyBgColors = {
    '简单': 'bg-green-900/20 border-green-700',
    '普通': 'bg-blue-900/20 border-blue-700',
    '困难': 'bg-orange-900/20 border-orange-700',
    '极难': 'bg-red-900/20 border-red-700',
  };

  const handleStartTask = async () => {
    try {
      console.log('开始执行任务:', task);
      setStage('executing');
      setLoading(true);
      setProgress(0);

      // 模拟任务执行进度
      const duration = {
        'instant': 1000,
        'short': 2000,
        'medium': 4000,
        'long': 6000,
      }[task.timeCost] || 2000;

      const steps = 20;
      const stepDuration = duration / steps;

      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress((i / steps) * 100);

        // 在任务执行过程中随机触发奇遇（1%概率）
        if (i === Math.floor(steps / 2) && Math.random() < 0.01) {
          setLoading(false);
          setStage('encounter');

          try {
            // 调用AI生成奇遇事件
            const result = await generateAdventureEvent(
              player,
              'lucky',
              '低', // 任务中的奇遇风险较低
              undefined,
              undefined
            );
            setEncounterResult(result);
          } catch (error) {
            console.error('生成奇遇失败:', error);
            // 如果AI失败，使用默认奇遇
            const difficultyMultiplier = {
              '简单': 0.7,
              '普通': 1,
              '困难': 1.5,
              '极难': 2.5,
            }[task.difficulty] || 1;

            setEncounterResult({
              story: '你在执行任务途中遇到了一位神秘修士，他给了你一些奖励。',
              hpChange: 0,
              expChange: Math.floor(20 * difficultyMultiplier),
              spiritStonesChange: Math.floor(50 * difficultyMultiplier),
              eventColor: 'special',
            });
          }
          return;
        }
      }

      setLoading(false);
      setStage('complete');
    } catch (error) {
      console.error('执行任务出错:', error);
      setLoading(false);
      setStage('complete');
    }
  };

  const handleEncounterContinue = () => {
    setStage('executing');
    setLoading(true);

    // 继续任务执行
    const remainingProgress = 50;
    const steps = 10;
    const stepDuration = 200;

    const continueTask = async () => {
      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress(remainingProgress + (i / steps) * 50);
      }
      setLoading(false);
      setStage('complete');
    };

    continueTask();
  };

  const handleComplete = () => {
    onTaskComplete(task, encounterResult || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={(e) => {
        // 阻止事件冒泡到 SectModal
        e.stopPropagation();
        // 点击背景时关闭任务弹窗
        onClose();
      }}
    >
      <div
        className="bg-paper-800 w-full max-w-2xl rounded-lg border border-stone-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-600 bg-ink-800 rounded-t flex justify-between items-center">
          <div>
            <h3 className="text-xl font-serif text-mystic-gold mb-1">
              {task.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[task.difficulty]} ${difficultyBgColors[task.difficulty]}`}>
                难度: {task.difficulty}
              </span>
              <span className="text-xs text-stone-400">
                耗时: {
                  task.timeCost === 'instant' ? '瞬时' :
                  task.timeCost === 'short' ? '短暂' :
                  task.timeCost === 'medium' ? '中等' : '较长'
                }
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {stage === 'preparing' && (
            <div className="space-y-4">
              <p className="text-stone-300">{task.description}</p>

              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="text-sm font-bold text-stone-200 mb-2">任务奖励</h4>
                <div className="space-y-1 text-sm text-stone-400">
                  <div>贡献: <span className="text-mystic-gold">{task.reward.contribution}</span></div>
                  {task.reward.exp && (
                    <div>修为: <span className="text-green-400">{task.reward.exp}</span></div>
                  )}
                  {task.reward.spiritStones && (
                    <div>灵石: <span className="text-blue-400">{task.reward.spiritStones}</span></div>
                  )}
                  {task.reward.items && task.reward.items.length > 0 && (
                    <div>物品: {task.reward.items.map((item, idx) => (
                      <span key={idx} className="text-yellow-400">{item.name} x{item.quantity}</span>
                    ))}</div>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('按钮被点击，开始执行任务');
                  handleStartTask();
                }}
                disabled={loading}
                className={`w-full py-3 border rounded transition-colors font-serif ${
                  loading
                    ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                    : 'bg-mystic-jade/20 text-mystic-jade border-mystic-jade hover:bg-mystic-jade/30'
                }`}
              >
                {loading ? '执行中...' : '开始执行任务'}
              </button>
            </div>
          )}

          {stage === 'executing' && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-mystic-gold mx-auto mb-4" />
                <p className="text-stone-300 mb-4">正在执行任务...</p>

                {/* 进度条 */}
                <div className="w-full bg-stone-700 rounded-full h-4 mb-2">
                  <div
                    className="bg-mystic-gold h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-stone-400">{Math.floor(progress)}%</p>
              </div>
            </div>
          )}

          {stage === 'encounter' && !encounterResult && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-mystic-gold mx-auto mb-4" />
                <p className="text-stone-300 mb-4">正在执行任务...</p>
              </div>
            </div>
          )}

          {stage === 'encounter' && encounterResult && (
            <div className="space-y-4">
              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="text-lg font-serif text-mystic-gold mb-2">✨ 奇遇事件</h4>
                <p className="text-stone-300 whitespace-pre-wrap mb-4">{encounterResult.story}</p>

                {(encounterResult.expChange !== 0 || encounterResult.spiritStonesChange !== 0 || encounterResult.hpChange !== 0) && (
                  <div className="space-y-1 text-sm">
                    {encounterResult.expChange > 0 && (
                      <div className="text-green-400">修为 +{encounterResult.expChange}</div>
                    )}
                    {encounterResult.spiritStonesChange > 0 && (
                      <div className="text-blue-400">灵石 +{encounterResult.spiritStonesChange}</div>
                    )}
                    {encounterResult.hpChange !== 0 && (
                      <div className={encounterResult.hpChange > 0 ? 'text-green-400' : 'text-red-400'}>
                        气血 {encounterResult.hpChange > 0 ? '+' : ''}{encounterResult.hpChange}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleEncounterContinue}
                className="w-full py-3 bg-mystic-jade/20 text-mystic-jade border border-mystic-jade hover:bg-mystic-jade/30 rounded transition-colors font-serif"
              >
                继续执行任务
              </button>
            </div>
          )}

          {stage === 'complete' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-xl font-serif text-mystic-gold mb-2">任务完成！</p>
                <p className="text-stone-400">你成功完成了任务，获得了相应的奖励。</p>
              </div>

              {encounterResult && (
                <div className="bg-ink-800 p-4 rounded border border-stone-700">
                  <h4 className="text-sm font-bold text-stone-200 mb-2">奇遇奖励</h4>
                  <div className="space-y-1 text-sm text-stone-400">
                    {encounterResult.expChange > 0 && (
                      <div>修为: <span className="text-green-400">+{encounterResult.expChange}</span></div>
                    )}
                    {encounterResult.spiritStonesChange > 0 && (
                      <div>灵石: <span className="text-blue-400">+{encounterResult.spiritStonesChange}</span></div>
                    )}
                    {encounterResult.hpChange !== 0 && (
                      <div className={encounterResult.hpChange > 0 ? 'text-green-400' : 'text-red-400'}>
                        气血: {encounterResult.hpChange > 0 ? '+' : ''}{encounterResult.hpChange}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-mystic-gold/20 text-mystic-gold border border-mystic-gold hover:bg-mystic-gold/30 rounded transition-colors font-serif"
              >
                确认
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectTaskModal;

