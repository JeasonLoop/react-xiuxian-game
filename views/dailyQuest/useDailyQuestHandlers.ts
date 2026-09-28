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
  GAME_BALANCE,
} from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { getLocalDateString } from '../../utils/dateUtils';

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
  const generateDailyQuests = (): DailyQuest[] => {
    const { countMin, countMax, coreTypes } = GAME_BALANCE.dailyQuest;
    const questCount = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
    const usedNames = new Set<string>();
    const selectedQuests: DailyQuest[] = [];

    const pushQuest = (questTemplate: (typeof PREDEFINED_DAILY_QUESTS)[number]) => {
      if (usedNames.has(questTemplate.name)) return false;
      if (questTemplate.type === 'breakthrough' && Math.random() < 0.5) return false;
      usedNames.add(questTemplate.name);
      const target =
        Math.floor(Math.random() * (questTemplate.targetRange.max - questTemplate.targetRange.min + 1)) +
        questTemplate.targetRange.min;
      selectedQuests.push({
        id: `daily-quest-${uid()}`,
        type: questTemplate.type,
        name: questTemplate.name,
        description: questTemplate.description,
        target,
        progress: 0,
        reward: calculateDailyQuestReward(
          questTemplate.type,
          target,
          questTemplate.rarity,
          player.realm,
          player.realmLevel
        ),
        rarity: questTemplate.rarity,
        completed: false,
      });
      return true;
    };

    for (const type of coreTypes) {
      const pool = PREDEFINED_DAILY_QUESTS.filter((q) => q.type === type);
      if (pool.length === 0) continue;
      pushQuest(pool[Math.floor(Math.random() * pool.length)]);
    }

    const leftover = PREDEFINED_DAILY_QUESTS.filter((q) => !usedNames.has(q.name));
    while (selectedQuests.length < questCount && leftover.length > 0) {
      const idx = Math.floor(Math.random() * leftover.length);
      const [picked] = leftover.splice(idx, 1);
      pushQuest(picked);
    }

    return selectedQuests.slice(0, questCount);
  };

  // 重置日常任务（每天重置）
  const resetDailyQuests = () => {
    const now = Date.now();
    const today = getLocalDateString();
    setPlayer((prev) => {
      const lastResetDate = prev.lastDailyQuestResetDate || '';
      if (lastResetDate === today) return prev;
      const isFirstGenerate = !lastResetDate;
      addLog('正在生成日常任务...', 'special');
      const newQuests = generateDailyQuests();
      addLog(`新的日常任务已刷新！今日共${newQuests.length}个任务。`, 'special');
      return {
        ...prev,
        dailyQuests: newQuests,
        dailyQuestProgress: {},
        dailyQuestCompleted: [],
        lastDailyQuestResetDate: today,
        lastDailyQuestResetTime: now,
        gameDays: isFirstGenerate ? (prev.gameDays || 1) : (prev.gameDays || 1) + 1,
      };
    });
  };

  const initializeDailyQuests = () => {
    if ((player.lastDailyQuestResetDate || '') !== getLocalDateString()) {
      resetDailyQuests();
    }
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

  const applyQuestClaim = (prev: PlayerStats, questId: string, silent = false): PlayerStats => {
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
            advancedItemMsg = ` 额外获得筑基奇物【${selected.name}】！`;
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
            advancedItemMsg = ` 额外获得天地精华【${selected.name}】！`;
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
            advancedItemMsg = ` 额外获得天地之髓【${selected.name}】！`;
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
            advancedItemMsg = ` 额外获得规则之力【${selected.name}】！`;
          }
        }
      }

      // 构建奖励文本
      const rewardParts: string[] = [];
      if (expGain > 0) rewardParts.push(`${expGain} 修为`);
      if (stoneGain > 0) rewardParts.push(`${stoneGain} 灵石`);
      if (ticketGain > 0) rewardParts.push(`${ticketGain} 抽奖券`);

      const rewardText = rewardParts.length > 0 ? rewardParts.join('、') : '无奖励';

      if (!silent) {
        addLog(
          `领取日常任务【${quest.name}】奖励！获得 ${rewardText}。${advancedItemMsg}`,
          advancedItemMsg ? 'special' : 'gain'
        );
      }

      return {
        ...prev,
        exp: prev.exp + expGain,
        inventory: newInventory,
        spiritStones: prev.spiritStones + stoneGain,
        lotteryTickets: prev.lotteryTickets + ticketGain,
        dailyQuestCompleted: [...prev.dailyQuestCompleted, questId],
      };
  };

  const claimQuestReward = (questId: string) => {
    setPlayer((prev) => applyQuestClaim(prev, questId));
  };

  const claimAllQuestRewards = () => {
    setPlayer((prev) => {
      const completed = (prev.dailyQuests || []).filter(
        (q) => q.completed && !(prev.dailyQuestCompleted || []).includes(q.id)
      );
      if (completed.length === 0) return prev;
      let next = prev;
      completed.forEach((quest) => {
        next = applyQuestClaim(next, quest.id, true);
      });
      addLog(`一键领取 ${completed.length} 项日常奖励。`, 'gain');
      return next;
    });
  };

  return {
    initializeDailyQuests,
    resetDailyQuests,
    updateQuestProgress,
    claimQuestReward,
    claimAllQuestRewards,
  };
}

