import React from 'react';
import { PlayerStats, DailyQuest, DailyQuestType, RealmType, ItemType } from '../../types';
import {
  PREDEFINED_DAILY_QUESTS,
  calculateDailyQuestReward,
  REALM_ORDER,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../../constants/index';
import { uid } from '../../utils/gameUtils';

/**
 * 获取本地日期字符串（YYYY-MM-DD格式）
 * 使用本地时区而不是UTC，避免时区问题
 */
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

      // 计算奖励（根据玩家境界调整）
      const reward = calculateDailyQuestReward(
        questTemplate.type,
        target,
        questTemplate.rarity,
        player.realm,
        player.realmLevel
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
          questTemplate.rarity,
          player.realm,
          player.realmLevel
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
    const now = Date.now();
    const today = getLocalDateString(new Date());
    const lastResetDate = player.lastDailyQuestResetDate || today;
    const lastResetTime = player.lastDailyQuestResetTime || now;

    // 计算上次重置时间对应的日期（使用本地时区）
    const lastResetDateObj = new Date(lastResetTime);
    const lastResetDateStr = getLocalDateString(lastResetDateObj);

    // 判断是否需要刷新：如果时间戳是昨天或更早，或者任务不存在/为空
    const isPastDay = lastResetDateStr !== today;
    const needsReset = isPastDay || !player.dailyQuests || player.dailyQuests.length === 0;

    if (needsReset) {
      // 如果任务为空或日期变化，显示生成提示
      const isEmpty = !player.dailyQuests || player.dailyQuests.length === 0;
      if (isPastDay || isEmpty) {
        addLog('正在生成日常任务...', 'special');
      }

      const newQuests = generateDailyQuests();

      setPlayer((prev) => {
        const currentGameDays = prev.gameDays || 1;

        return {
          ...prev,
          dailyQuests: newQuests,
          // 如果是新的一天，重置进度和已完成列表
          dailyQuestProgress: isPastDay ? {} : (prev.dailyQuestProgress || {}),
          dailyQuestCompleted: isPastDay ? [] : (prev.dailyQuestCompleted || []),
          lastDailyQuestResetDate: today,
          lastDailyQuestResetTime: now, // 更新刷新时间戳
          gameDays: isPastDay ? currentGameDays + 1 : currentGameDays, // 只有日期变化时才增加游戏天数
        };
      });

      if (isPastDay || isEmpty) {
        addLog(`新的日常任务已刷新！今日共${newQuests.length}个任务。`, 'special');
      }
    }
  };

  // 初始化日常任务（如果为空）
  const initializeDailyQuests = () => {
    const now = Date.now();
    const today = getLocalDateString(new Date());
    const lastResetTime = player.lastDailyQuestResetTime || now;

    // 计算上次重置时间对应的日期（使用本地时区）
    const lastResetDateObj = new Date(lastResetTime);
    const lastResetDateStr = getLocalDateString(lastResetDateObj);

    // 只有在以下情况才生成任务：
    // 1. 任务不存在或为空
    // 2. 时间戳对应的日期是昨天或更早（需要刷新）
    const needsReset =
      !player.dailyQuests ||
      player.dailyQuests.length === 0 ||
      lastResetDateStr !== today;

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
        // 只更新匹配类型且未完成的任务
        if (quest.type === questType && !quest.completed) {
          // 计算新进度，确保不超过目标值
          const newProgress = Math.min(quest.progress + amount, quest.target);
          // 完成判定：当进度达到或超过目标值时，任务完成
          const completed = newProgress >= quest.target;

          return {
            ...quest,
            progress: newProgress,
            completed: completed,
          };
        }
        return quest;
      });

      // 更新进度记录（保存所有匹配类型的任务的当前进度）
      const updatedProgress = { ...prev.dailyQuestProgress };
      updatedQuests.forEach((quest) => {
        // 只更新匹配类型的任务进度（包括已完成的任务，用于记录）
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

      // 进阶物品奖励（高品质任务有概率获得）- 添加到背包
      const currentRealmIndex = REALM_ORDER.indexOf(prev.realm);
      let advancedItemMsg = '';
      let newInventory = [...prev.inventory];

      // 只有传说或仙品任务才有概率获得进阶物品
      if ((quest.rarity === '传说' || quest.rarity === '仙品') && Math.random() < 0.05) {
        // 5%概率获得进阶物品

        // 筑基奇物（炼气期、筑基期）
        if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
          const treasures = Object.values(FOUNDATION_TREASURES);
          const availableTreasures = treasures.filter(t => !t.requiredLevel || prev.realmLevel >= t.requiredLevel);
          if (availableTreasures.length > 0) {
            const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'foundationTreasure',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ 额外获得筑基奇物【${selected.name}】！`;
          }
        }

        // 天地精华（金丹期、元婴期）
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) &&
            currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
          const essences = Object.values(HEAVEN_EARTH_ESSENCES);
          if (essences.length > 0) {
            const selected = essences[Math.floor(Math.random() * essences.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'heavenEarthEssence',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ 额外获得天地精华【${selected.name}】！`;
          }
        }

        // 天地之髓（化神期及以上）
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering)) {
          const marrows = Object.values(HEAVEN_EARTH_MARROWS);
          if (marrows.length > 0) {
            const selected = marrows[Math.floor(Math.random() * marrows.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'heavenEarthMarrow',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ 额外获得天地之髓【${selected.name}】！`;
          }
        }

        // 规则之力（长生境）
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm)) {
          const rules = Object.values(LONGEVITY_RULES);
          const currentRules = prev.longevityRules || [];
          const availableRules = rules.filter(r => !currentRules.includes(r.id));
          const maxRules = prev.maxLongevityRules || 3;
          if (availableRules.length > 0 && currentRules.length < maxRules) {
            const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: '仙品',
              advancedItemType: 'longevityRule',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ 额外获得规则之力【${selected.name}】！`;
          }
        }
      }

      // 构建奖励文本
      const rewardParts: string[] = [];
      if (expGain > 0) rewardParts.push(`${expGain} 修为`);
      if (stoneGain > 0) rewardParts.push(`${stoneGain} 灵石`);
      if (ticketGain > 0) rewardParts.push(`${ticketGain} 抽奖券`);

      const rewardText = rewardParts.length > 0 ? rewardParts.join('、') : '无奖励';

      addLog(
        `领取日常任务【${quest.name}】奖励！获得 ${rewardText}。${advancedItemMsg}`,
        advancedItemMsg ? 'special' : 'gain'
      );

      return {
        ...prev,
        exp: prev.exp + expGain,
        inventory: newInventory,
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

