import React, { useState, useEffect } from 'react';
import { PlayerStats, AdventureResult } from '../types';
import { RandomSectTask } from '../services/randomService';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../services/adventureTemplateService';
import { Loader2, Scroll } from 'lucide-react';
import { logger } from '../utils/logger';
import { getPlayerTotalStats } from '../utils/statUtils';
import { Modal } from './common';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: RandomSectTask;
  player: PlayerStats;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  onTaskComplete: (task: RandomSectTask, encounterResult?: AdventureResult, isPerfectCompletion?: boolean) => void;
}

const SectTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  task,
  player,
  setItemActionLog,
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
      logger.log('开始执行任务:', task);
      setStage('executing');
      setLoading(true);
      setProgress(0);

      // 根据推荐属性计算成功率加成
      let statBonus = 0;
      if (task.recommendedFor) {
        if (task.recommendedFor.highAttack) statBonus += (player.attack / 500);
        if (task.recommendedFor.highDefense) statBonus += (player.defense / 250);
        if (task.recommendedFor.highSpirit) statBonus += (player.spirit / 100);
        if (task.recommendedFor.highSpeed) statBonus += (player.speed / 100);
      }

      // 限制加成上限为 20%
      const finalStatBonus = Math.min(20, statBonus);

      // 模拟任务执行进度
      const duration = {
        'instant': 800,
        'short': 1500,
        'medium': 3000,
        'long': 5000,
      }[task.timeCost] || 2000;

      const steps = 20;
      const stepDuration = duration / steps;

      // 根据难度设置触发概率
      const encounterChance = {
        '简单': 0.05,   // 5%
        '普通': 0.10,   // 10%
        '困难': 0.15,   // 15%
        '极难': 0.20,   // 20%
      }[task.difficulty] || 0.10;

      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress((i / steps) * 100);

        // 在任务执行过程中根据难度随机触发事件
        if (i === Math.floor(steps / 2) && Math.random() < encounterChance) {
          setLoading(false);
          setStage('encounter');

          try {
            // 使用事件模板库生成奇遇事件
            initializeEventTemplateLibrary();
            // 根据难度选择风险等级
            const riskLevel = task.difficulty === '简单' ? '低' :
                            task.difficulty === '普通' ? '低' :
                            task.difficulty === '困难' ? '中' : '高';
            const template = getRandomEventTemplate('lucky', riskLevel, player.realm, player.realmLevel);

            if (template) {
              // 使用实际最大血量（包含金丹法数加成等）
              const totalStats = getPlayerTotalStats(player);
              const result = templateToAdventureResult(template, {
                realm: player.realm,
                realmLevel: player.realmLevel,
                maxHp: totalStats.maxHp,
              });
              setEncounterResult(result);

              // 使用 setItemActionLog 提示
              if (setItemActionLog && result.story) {
                setItemActionLog({
                  text: `✨ 任务途中遇到奇遇：${result.story.substring(0, 30)}${result.story.length > 30 ? '...' : ''}`,
                  type: result.eventColor || 'special',
                });
              }
            } else {
              // 如果模板库为空，使用默认事件
              const defaultResult = {
                story: '你在执行任务时遇到了一些小机缘。',
                hpChange: 0,
                expChange: Math.floor(50 * (1 + 0.3)),
                spiritStonesChange: Math.floor(30 * (1 + 0.3)),
                eventColor: 'gain' as const,
              };
              setEncounterResult(defaultResult);

              if (setItemActionLog) {
                setItemActionLog({
                  text: '✨ 任务途中遇到奇遇：你在执行任务时遇到了一些小机缘。',
                  type: 'special',
                });
              }
            }
          } catch (error) {
            console.error('生成奇遇失败:', error);
            const difficultyMultiplier = {
              '简单': 0.7,
              '普通': 1,
              '困难': 1.5,
              '极难': 2.5,
            }[task.difficulty] || 1;

            const fallbackResult = {
              story: '你在执行任务途中遇到了一位宗门前辈，他见你勤勉，随手赐下一番机缘。',
              hpChange: 0,
              expChange: Math.floor(50 * difficultyMultiplier),
              spiritStonesChange: Math.floor(100 * difficultyMultiplier),
              eventColor: 'special' as const,
            };
            setEncounterResult(fallbackResult);

            if (setItemActionLog) {
              setItemActionLog({
                text: '✨ 任务途中遇到奇遇：你在执行任务途中遇到了一位宗门前辈，他见你勤勉，随手赐下一番机缘。',
                type: 'special',
              });
            }
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

  const handleEncounterContinue = async () => {
    try {
      setStage('executing');
      setLoading(true);

      // 继续任务执行，从50%进度开始
      const duration = {
        'instant': 800,
        'short': 1500,
        'medium': 3000,
        'long': 5000,
      }[task.timeCost] || 2000;

      const steps = 20;
      const stepDuration = duration / steps;
      const startProgress = 50; // 从50%开始，因为奇遇发生在中间

      for (let i = Math.floor(steps / 2); i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress((i / steps) * 100);
      }

      setLoading(false);
      setStage('complete');
    } catch (error) {
      console.error('继续执行任务出错:', error);
      setLoading(false);
      setStage('complete');
    }
  };

  const handleComplete = () => {
    // 计算最终成功率
    let successRate = task.successRate ?? 75;

    // 加上属性加成
    if (task.recommendedFor) {
      const attackBonus = task.recommendedFor.highAttack ? (player.attack / 1000) * 10 : 0;
      const defenseBonus = task.recommendedFor.highDefense ? (player.defense / 500) * 10 : 0;
      const spiritBonus = task.recommendedFor.highSpirit ? (player.spirit / 200) * 10 : 0;
      const speedBonus = task.recommendedFor.highSpeed ? (player.speed / 200) * 10 : 0;
      successRate += (attackBonus + defenseBonus + spiritBonus + speedBonus);
    }

    const isPerfectCompletion = Math.random() * 100 < Math.min(95, successRate);

    onTaskComplete(task, encounterResult || undefined, isPerfectCompletion);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="text-xl font-serif text-mystic-gold mb-1">
            {task.name}
          </div>
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
            {task.recommendedFor && (
              <div className="flex gap-1 ml-auto">
                {task.recommendedFor.highAttack && <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">推荐攻击</span>}
                {task.recommendedFor.highDefense && <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">推荐防御</span>}
                {task.recommendedFor.highSpirit && <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">推荐神识</span>}
                {task.recommendedFor.highSpeed && <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">推荐速度</span>}
              </div>
            )}
          </div>
        </div>
      }
      titleIcon={<Scroll size={20} className="text-mystic-gold" />}
      size="2xl"
      height="auto"
      zIndex={60}
      showHeaderBorder={false}
    >
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
            {task.completionBonus && (
              <div className="mt-3 pt-3 border-t border-stone-700">
                <div className="text-xs text-stone-500 mb-1">完美完成额外奖励:</div>
                <div className="space-y-1 text-xs text-stone-400">
                  {task.completionBonus.contribution && (
                    <div>贡献: <span className="text-mystic-gold">+{task.completionBonus.contribution}</span></div>
                  )}
                  {task.completionBonus.exp && (
                    <div>修为: <span className="text-green-400">+{task.completionBonus.exp}</span></div>
                  )}
                  {task.completionBonus.spiritStones && (
                    <div>灵石: <span className="text-blue-400">+{task.completionBonus.spiritStones}</span></div>
                  )}
                </div>
              </div>
            )}
            {task.successRate && (
              <div className="mt-2 text-xs text-stone-500">
                完美完成概率: <span className="text-yellow-400">{task.successRate}%</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logger.log('按钮被点击，开始执行任务');
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

      {stage === 'complete' && (() => {
        const successRate = task.successRate ?? 75;
        const isPerfectCompletion = Math.random() * 100 < successRate;
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">{isPerfectCompletion ? '✨' : '✅'}</div>
              <p className="text-xl font-serif text-mystic-gold mb-2">
                {isPerfectCompletion ? '完美完成！' : '任务完成！'}
              </p>
              <p className="text-stone-400">
                {isPerfectCompletion
                  ? '你完美地完成了任务，获得了额外奖励！'
                  : '你成功完成了任务，获得了相应的奖励。'}
              </p>
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
        );
      })()}
    </Modal>
  );
};

export default SectTaskModal;
