import React from 'react';
import { PlayerStats, DailyQuest, DailyQuestType } from '../../types';
import {
  PREDEFINED_DAILY_QUESTS,
  calculateDailyQuestReward,
} from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseDailyQuestHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 日常任务处理函数
 * 包含生成日常任务、更新任务进度、完成任务等
 */
export function useDailyQuestHandlers({
  player,
  setPlayer,
  addLog,
}: UseDailyQuestHandlersProps) {
  // 生成日常任务（从30个预定义任务中随机选择）
  const generateDailyQuests = (): DailyQuest[] => {
    // 随机生成10-20个任务
    const questCount = Math.floor(Math.random() * 11) + 10; // 10-20

    // 从30个预定义任务中随机选择
    const availableQuests = [...PREDEFINED_DAILY_QUESTS];
    const selectedQuests: DailyQuest[] = [];
    const usedIndices = new Set<number>();

    // 随机选择指定数量的任务，确保不重复
    while (selectedQuests.length < questCount && usedIndices.size < availableQuests.length) {
      const randomIndex = Math.floor(Math.random() * availableQuests.length);

      // 如果已经使用过这个索引，跳过
      if (usedIndices.has(randomIndex)) {
        continue;
      }

      usedIndices.add(randomIndex);
      const questTemplate = availableQuests[randomIndex];

      // 对于突破任务，50%概率生成
      if (questTemplate.type === 'breakthrough') {
        if (Math.random() < 0.5) {
          continue; // 跳过，不生成突破任务
        }
      }

      // 随机生成目标数量
      const target = Math.floor(
        Math.random() * (questTemplate.targetRange.max - questTemplate.targetRange.min + 1)
      ) + questTemplate.targetRange.min;

      // 计算奖励
      const reward = calculateDailyQuestReward(
        questTemplate.type,
        target,
        questTemplate.rarity
      );

      selectedQuests.push({
        id: `daily-quest-${uid()}`,
        type: questTemplate.type,
        name: questTemplate.name,
        description: questTemplate.description,
        target,
        progress: 0,
        reward,
        rarity: questTemplate.rarity,
        completed: false,
      });
    }

    // 如果选择的任务数量不足，补充任务（避免重复）
    if (selectedQuests.length < questCount) {
      const remainingQuests = availableQuests.filter((_, index) => !usedIndices.has(index));
      const needed = questCount - selectedQuests.length;

      for (let i = 0; i < needed && remainingQuests.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * remainingQuests.length);
        const questTemplate = remainingQuests[randomIndex];
        remainingQuests.splice(randomIndex, 1);

        // 对于突破任务，50%概率生成
        if (questTemplate.type === 'breakthrough' && Math.random() < 0.5) {
          continue;
        }

        const target = Math.floor(
          Math.random() * (questTemplate.targetRange.max - questTemplate.targetRange.min + 1)
        ) + questTemplate.targetRange.min;

        const reward = calculateDailyQuestReward(
          questTemplate.type,
          target,
          questTemplate.rarity
        );

        selectedQuests.push({
          id: `daily-quest-${uid()}`,
          type: questTemplate.type,
          name: questTemplate.name,
          description: questTemplate.description,
          target,
          progress: 0,
          reward,
          rarity: questTemplate.rarity,
          completed: false,
        });
      }
    }

    return selectedQuests.slice(0, questCount);
  };

  // 重置日常任务（每天重置）
  const resetDailyQuests = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = player.lastDailyQuestResetDate || today;

    // 如果日期变化或 dailyQuests 不存在/为空，则重置
    if (lastReset !== today || !player.dailyQuests || player.dailyQuests.length === 0) {
      // 只有在日期变化时才显示生成提示
      if (lastReset !== today) {
        addLog('正在生成日常任务...', 'special');
      }

      const newQuests = generateDailyQuests();

        setPlayer((prev) => {
          const currentGameDays = prev.gameDays || 1;
          const isNewDay = lastReset !== today;

          return {
            ...prev,
            dailyQuests: newQuests,
            // 如果是新的一天，重置进度和已完成列表
            dailyQuestProgress: isNewDay ? {} : (prev.dailyQuestProgress || {}),
            dailyQuestCompleted: isNewDay ? [] : (prev.dailyQuestCompleted || []),
            lastDailyQuestResetDate: today,
            gameDays: isNewDay ? currentGameDays + 1 : currentGameDays, // 只有日期变化时才增加游戏天数
          };
        });

      if (lastReset !== today) {
        addLog(`新的日常任务已刷新！今日共${newQuests.length}个任务。`, 'special');
      }
    }
  };

  // 初始化日常任务（如果为空）
  const initializeDailyQuests = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = player.lastDailyQuestResetDate || today;

    // 只有在以下情况才生成任务：
    // 1. 任务不存在或为空
    // 2. 日期变化（新的一天）
    const needsReset =
      !player.dailyQuests ||
      player.dailyQuests.length === 0 ||
      lastReset !== today;

    if (needsReset) {
      resetDailyQuests();
    }
    // 如果任务已存在且日期未变化，不做任何操作
  };

  // 更新任务进度（不自动发放奖励，需要手动领取）
  const updateQuestProgress = (
    questType: DailyQuestType,
    amount: number = 1
  ) => {
    setPlayer((prev) => {
      // 确保 dailyQuests 存在
      if (!prev.dailyQuests || prev.dailyQuests.length === 0) {
        return prev;
      }
      const updatedQuests = prev.dailyQuests.map((quest) => {
        if (quest.type === questType && !quest.completed) {
          const newProgress = Math.min(quest.progress + amount, quest.target);
          const completed = newProgress >= quest.target;

          return {
            ...quest,
            progress: newProgress,
            completed: completed,
          };
        }
        return quest;
      });

      // 更新进度记录
      const updatedProgress = { ...prev.dailyQuestProgress };
      updatedQuests.forEach((quest) => {
        if (quest.type === questType) {
          updatedProgress[quest.id] = quest.progress;
        }
      });

      return {
        ...prev,
        dailyQuests: updatedQuests,
        dailyQuestProgress: updatedProgress,
      };
    });
  };

  // 领取任务奖励（手动领取，用于UI）
  const claimQuestReward = (questId: string) => {
    setPlayer((prev) => {
      // 确保 dailyQuests 存在
      if (!prev.dailyQuests || prev.dailyQuests.length === 0) {
        return prev;
      }
      const quest = prev.dailyQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || prev.dailyQuestCompleted.includes(questId)) {
        return prev;
      }

      const expGain = quest.reward.exp || 0;
      const stoneGain = quest.reward.spiritStones || 0;
      const ticketGain = quest.reward.lotteryTickets || 0;

      // 构建奖励文本
      const rewardParts: string[] = [];
      if (expGain > 0) rewardParts.push(`${expGain} 修为`);
      if (stoneGain > 0) rewardParts.push(`${stoneGain} 灵石`);
      if (ticketGain > 0) rewardParts.push(`${ticketGain} 抽奖券`);

      const rewardText = rewardParts.length > 0 ? rewardParts.join('、') : '无奖励';

      addLog(
        `领取日常任务【${quest.name}】奖励！获得 ${rewardText}。`,
        'gain'
      );

      return {
        ...prev,
        exp: prev.exp + expGain,
        spiritStones: prev.spiritStones + stoneGain,
        lotteryTickets: prev.lotteryTickets + ticketGain,
        dailyQuestCompleted: [...prev.dailyQuestCompleted, questId],
      };
    });
  };

  return {
    initializeDailyQuests,
    resetDailyQuests,
    updateQuestProgress,
    claimQuestReward,
  };
}

