import { PlayerStats, ItemType, RealmType, AdventureResult } from '../types';
import { REALM_ORDER, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../constants/index';
import { uid } from './gameUtils';
import { RandomSectTask } from '../services/randomService';

/**
 * 宗门任务工具类
 */
export const sectTaskUtils = {
  /**
   * 检查任务每日限制
   */
  checkDailyLimit: (player: PlayerStats, taskId: string): { limitReached: boolean; updatedCount: Record<string, number>; resetDate: string } => {
    const today = new Date().toISOString().split('T')[0];
    let dailyTaskCount = player.dailyTaskCount || {};
    let lastTaskResetDate = player.lastTaskResetDate || today;

    if (lastTaskResetDate !== today) {
      dailyTaskCount = {};
      lastTaskResetDate = today;
    }

    const TASK_DAILY_LIMIT = 3;
    const currentCount = dailyTaskCount[taskId] || 0;

    if (currentCount >= TASK_DAILY_LIMIT) {
      return { limitReached: true, updatedCount: dailyTaskCount, resetDate: lastTaskResetDate };
    }

    return {
      limitReached: false,
      updatedCount: { ...dailyTaskCount, [taskId]: currentCount + 1 },
      resetDate: lastTaskResetDate
    };
  },

  /**
   * 计算任务奖励
   */
  calculateRewards: (player: PlayerStats, task: RandomSectTask, isPerfect: boolean, encounter?: AdventureResult) => {
    let contribGain = task.reward.contribution || 0;
    let expGain = task.reward.exp || 0;
    let stoneGain = task.reward.spiritStones || 0;

    // 连续类型加成
    if (player.lastCompletedTaskType === task.type && task.typeBonus) {
      const multiplier = 1 + task.typeBonus / 100;
      contribGain = Math.floor(contribGain * multiplier);
      expGain = Math.floor(expGain * multiplier);
      stoneGain = Math.floor(stoneGain * multiplier);
    }

    // 完美完成加成
    if (isPerfect && task.completionBonus) {
      contribGain += task.completionBonus.contribution || 0;
      expGain += task.completionBonus.exp || 0;
      stoneGain += task.completionBonus.spiritStones || 0;
    }

    // 奇遇额外奖励
    if (encounter) {
      expGain += encounter.expChange || 0;
      stoneGain += encounter.spiritStonesChange || 0;
    }

    return { contribGain, expGain, stoneGain };
  },

  /**
   * 尝试获取进阶物品奖励
   */
  tryGetAdvancedItem: (player: PlayerStats, task: RandomSectTask): { item: any | null; message: string } => {
    if (task.difficulty !== '极难' || task.quality !== '仙品') {
      return { item: null, message: '' };
    }

    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
    const advancedItemChance = 0.08;

    if (Math.random() >= advancedItemChance) return { item: null, message: '' };

    // 筑基奇物（炼气期、筑基期）
    if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
      const treasures = Object.values(FOUNDATION_TREASURES);
      const available = treasures.filter(t => !t.requiredLevel || player.realmLevel >= t.requiredLevel);
      if (available.length > 0) {
        const selected = available[Math.floor(Math.random() * available.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'foundationTreasure',
            advancedItemId: selected.id,
          },
          message: ` ✨ 获得筑基奇物【${selected.name}】！`
        };
      }
    }

    // 天地精华（金丹期、元婴期）
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) && currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
      const essences = Object.values(HEAVEN_EARTH_ESSENCES);
      if (essences.length > 0) {
        const selected = essences[Math.floor(Math.random() * essences.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'heavenEarthEssence',
            advancedItemId: selected.id,
          },
          message: ` ✨ 获得天地精华【${selected.name}】！`
        };
      }
    }

    // 天地之髓（化神期及以上）
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering) && Math.random() < 0.7) {
      const marrows = Object.values(HEAVEN_EARTH_MARROWS);
      if (marrows.length > 0) {
        const selected = marrows[Math.floor(Math.random() * marrows.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'heavenEarthMarrow',
            advancedItemId: selected.id,
          },
          message: ` ✨ 获得天地之髓【${selected.name}】！`
        };
      }
    }

    // 规则之力（长生境）
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm) && Math.random() < 0.5) {
      const rules = Object.values(LONGEVITY_RULES);
      const currentRules = player.longevityRules || [];
      const available = rules.filter(r => !currentRules.includes(r.id));
      const maxRules = player.maxLongevityRules || 3;
      if (available.length > 0 && currentRules.length < maxRules) {
        const selected = available[Math.floor(Math.random() * available.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: '仙品',
            advancedItemType: 'longevityRule',
            advancedItemId: selected.id,
          },
          message: ` ✨ 获得规则之力【${selected.name}】！`
        };
      }
    }

    return { item: null, message: '' };
  }
};

