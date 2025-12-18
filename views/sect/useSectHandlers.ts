import React from 'react';
import {
  PlayerStats,
  Item,
  ItemType,
  ItemRarity,
  RealmType,
  SectRank,
} from '../../types';
import { SECTS, SECT_RANK_REQUIREMENTS } from '../../constants';
import { RandomSectTask } from '../../services/randomService';
import { AdventureResult } from '../../types';
import { uid } from '../../utils/gameUtils';

interface UseSectHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setIsSectOpen: (open: boolean) => void;
  setPurchaseSuccess: (
    success: { item: string; quantity: number } | null
  ) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 宗门处理函数
 * 包含加入宗门、离开宗门、完成宗门任务、晋升宗门、购买宗门物品
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param setIsSectOpen 设置宗门是否打开
 * @param setPurchaseSuccess 设置购买成功
 * @returns handleJoinSect 加入宗门
 * @returns handleLeaveSect 离开宗门
 * @returns handleSectTask 完成宗门任务
 * @returns handleSectPromote 晋升宗门
 * @returns handleSectBuy 购买宗门物品
 */

export function useSectHandlers({
  setPlayer,
  addLog,
  setIsSectOpen,
  setPurchaseSuccess,
  setItemActionLog,
}: UseSectHandlersProps) {
  // 辅助函数：统一处理日志输出，优先使用 setItemActionLog
  const logMessage = (message: string, type: string = 'normal') => {
    if (setItemActionLog) {
      setItemActionLog({ text: message, type });
    } else {
      addLog(message, type);
    }
  };

  const handleJoinSect = (sectId: string, sectName?: string, sectInfo?: { exitCost?: { spiritStones?: number; items?: { name: string; quantity: number }[] } }) => {
    // 先尝试从 SECTS 中查找
    let sect = SECTS.find((s) => s.id === sectId);

    // 如果找不到，说明是随机生成的宗门，使用传入的名称或创建一个临时宗门对象
    if (!sect) {
      if (sectName) {
        // 使用传入的名称创建临时宗门对象
        sect = {
          id: sectId,
          name: sectName,
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: '黄', // 默认等级
          exitCost: sectInfo?.exitCost || {
            spiritStones: 300,
            items: [{ name: '聚灵草', quantity: 5 }],
          },
        };
      } else {
        // 如果连名称都没有，尝试从 availableSects 中查找（但这需要从 SectModal 传递）
        console.warn('无法找到宗门信息:', sectId);
        return;
      }
    }

    setPlayer((prev) => ({
      ...prev,
      sectId: sectId,
      sectRank: SectRank.Outer,
      sectContribution: 0,
      // 如果是随机生成的宗门，保存完整信息
      currentSectInfo: !SECTS.find((s) => s.id === sectId) ? {
        id: sectId,
        name: sect!.name,
        exitCost: sect!.exitCost,
      } : undefined,
    }));
    logMessage(`恭喜！你已拜入【${sect.name}】，成为一名外门弟子。`, 'special');
  };

  const handleLeaveSect = () => {
    // 直接背叛，会被追杀
    setPlayer((prev) => {
      if (!prev.sectId) return prev;

      const betrayedSects = [...(prev.betrayedSects || [])];
      if (!betrayedSects.includes(prev.sectId)) {
        betrayedSects.push(prev.sectId);
      }

      // 设置追杀时间（7天）
      const huntDuration = 7 * 24 * 60 * 60 * 1000; // 7天
      const huntEndTime = Date.now() + huntDuration;

      return {
        ...prev,
        sectId: null,
        sectRank: SectRank.Outer,
        sectContribution: 0,
        currentSectInfo: undefined, // 清除保存的宗门信息
        betrayedSects,
        sectHuntEndTime: huntEndTime,
      };
    });
    logMessage(`你叛出了宗门，从此成为一名散修。宗门已发布追杀令，你需小心行事！`, 'danger');
    setIsSectOpen(false);
  };

  const handleSafeLeaveSect = () => {
    // 安全退出，需要支付代价
    setPlayer((prev) => {
      if (!prev.sectId) {
        logMessage('你当前未加入任何宗门。', 'danger');
        return prev;
      }

      // 先尝试从 SECTS 中查找
      let sect = SECTS.find((s) => s.id === prev.sectId);

      // 如果找不到，尝试从保存的宗门信息中获取
      if (!sect && prev.currentSectInfo) {
        sect = {
          id: prev.currentSectInfo.id,
          name: prev.currentSectInfo.name,
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: '黄',
          exitCost: prev.currentSectInfo.exitCost,
        };
      }

      // 如果还是找不到，使用默认退出代价
      if (!sect) {
        sect = {
          id: prev.sectId,
          name: '该宗门', // 无法获取名称，使用占位符
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: '黄',
          exitCost: {
            spiritStones: 300,
            items: [{ name: '聚灵草', quantity: 5 }],
          },
        };
      }

      if (!sect.exitCost) {
        logMessage('无法安全退出该宗门，该宗门未设置退出代价。', 'danger');
        return prev;
      }

      // 检查是否有足够的资源
      let updatedInventory = [...prev.inventory];
      let stoneCost = sect.exitCost.spiritStones || 0;
      const missingItems: string[] = [];

      if (prev.spiritStones < stoneCost) {
        logMessage(`灵石不足，需要 ${stoneCost} 灵石，当前拥有 ${prev.spiritStones} 灵石。`, 'danger');
        return prev;
      }

      if (sect.exitCost.items) {
        for (const itemReq of sect.exitCost.items) {
          const itemIdx = updatedInventory.findIndex(
            (i) => i.name === itemReq.name
          );
          if (
            itemIdx === -1 ||
            updatedInventory[itemIdx].quantity < itemReq.quantity
          ) {
            const currentQuantity = itemIdx >= 0 ? updatedInventory[itemIdx].quantity : 0;
            missingItems.push(`${itemReq.name}（需要 ${itemReq.quantity} 个，当前拥有 ${currentQuantity} 个）`);
          }
        }

        if (missingItems.length > 0) {
          logMessage(`物品不足，缺少：${missingItems.join('、')}。`, 'danger');
          return prev;
        }

        // 扣除物品
        for (const itemReq of sect.exitCost.items) {
          const itemIdx = updatedInventory.findIndex(
            (i) => i.name === itemReq.name
          );
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            quantity: updatedInventory[itemIdx].quantity - itemReq.quantity,
          };
        }
        updatedInventory = updatedInventory.filter((i) => i.quantity > 0);
      }

      logMessage(`你花费了代价，安全退出了【${sect.name}】。`, 'normal');
      setIsSectOpen(false);

      return {
        ...prev,
        sectId: null,
        sectRank: SectRank.Outer,
        sectContribution: 0,
        currentSectInfo: undefined, // 清除保存的宗门信息
        spiritStones: prev.spiritStones - stoneCost,
        inventory: updatedInventory,
      };
    });
  };

  const handleSectTask = (task: RandomSectTask, encounterResult?: AdventureResult, isPerfectCompletion?: boolean) => {
    setPlayer((prev) => {
      // 检查每日任务限制
      const today = new Date().toISOString().split('T')[0];
      let dailyTaskCount = prev.dailyTaskCount || {
        instant: 0,
        short: 0,
        medium: 0,
        long: 0,
      };
      let lastTaskResetDate = prev.lastTaskResetDate || today;

      // 如果日期变化，重置计数
      if (lastTaskResetDate !== today) {
        dailyTaskCount = { instant: 0, short: 0, medium: 0, long: 0 };
        lastTaskResetDate = today;
      }

      // 任务类型限制配置
      const taskLimits: Record<string, { limit: number; name: string }> = {
        instant: { limit: 10, name: '瞬时' },
        short: { limit: 5, name: '短暂' },
        medium: { limit: 3, name: '中等' },
        long: { limit: 2, name: '较长' },
      };

      // 检查当前任务类型的每日限制
      const taskType = task.timeCost;
      const limitConfig = taskLimits[taskType];
      if (limitConfig) {
        const currentCount =
          dailyTaskCount[taskType as keyof typeof dailyTaskCount] || 0;
        if (currentCount >= limitConfig.limit) {
          logMessage(
            `今日已完成${limitConfig.limit}次${limitConfig.name}任务，请明日再来。`,
            'danger'
          );
          return prev;
        }
        // 增加计数
        dailyTaskCount = {
          ...dailyTaskCount,
          [taskType]: currentCount + 1,
        };
      }

      // 检查消耗
      let stoneCost = 0;
      let updatedInventory = [...prev.inventory];

      if (task.cost?.spiritStones) {
        if (prev.spiritStones < task.cost.spiritStones) {
          logMessage(`灵石不足，需要 ${task.cost.spiritStones} 灵石。`, 'danger');
          return prev;
        }
        stoneCost = task.cost.spiritStones;
      }

      if (task.cost?.items) {
        for (const itemReq of task.cost.items) {
          const itemIdx = updatedInventory.findIndex(
            (i) => i.name === itemReq.name
          );
          if (
            itemIdx === -1 ||
            updatedInventory[itemIdx].quantity < itemReq.quantity
          ) {
            logMessage(
              `物品不足，需要 ${itemReq.quantity} 个【${itemReq.name}】。`,
              'danger'
            );
            return prev;
          }
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            quantity: updatedInventory[itemIdx].quantity - itemReq.quantity,
          };
        }
        updatedInventory = updatedInventory.filter((i) => i.quantity > 0);
      }

      // 计算奖励
      let contribGain = task.reward.contribution || 0;
      let expGain = task.reward.exp || 0;
      let stoneGain = task.reward.spiritStones || 0;

      // 任务类型连续完成加成（检查玩家最近完成的任务类型）
      let typeBonusMultiplier = 1.0;
      const lastCompletedTaskType = prev.lastCompletedTaskType;
      if (lastCompletedTaskType === task.type && task.typeBonus) {
        typeBonusMultiplier = 1 + (task.typeBonus / 100);
        contribGain = Math.floor(contribGain * typeBonusMultiplier);
        expGain = Math.floor(expGain * typeBonusMultiplier);
        stoneGain = Math.floor(stoneGain * typeBonusMultiplier);
        logMessage(`连续完成${task.type}任务，获得${task.typeBonus}%奖励加成！`, 'special');
      }

      // 完美完成奖励
      if (isPerfectCompletion && task.completionBonus) {
        contribGain += task.completionBonus.contribution || 0;
        expGain += task.completionBonus.exp || 0;
        stoneGain += task.completionBonus.spiritStones || 0;
      }

      // 特殊奖励（低概率触发）
      let specialRewardObtained = false;
      if (task.specialReward && Math.random() < 0.1) {
        specialRewardObtained = true;
        if (task.specialReward.item) {
          const specialItem = task.specialReward.item;
          const existingIdx = updatedInventory.findIndex(
            (i) => i.name === specialItem.name
          );
          if (existingIdx >= 0) {
            updatedInventory[existingIdx] = {
              ...updatedInventory[existingIdx],
              quantity: updatedInventory[existingIdx].quantity + (specialItem.quantity || 1),
            };
          } else {
            updatedInventory.push({
              id: uid(),
              name: specialItem.name,
              type: ItemType.Material,
              description: `完成任务获得的特殊奖励：${specialItem.name}`,
              quantity: specialItem.quantity || 1,
              rarity: task.quality === '仙品' ? '仙品' : '传说',
            });
          }
        }
      }

      // 如果有奇遇结果，添加奇遇奖励
      if (encounterResult) {
        expGain += encounterResult.expChange || 0;
        stoneGain += encounterResult.spiritStonesChange || 0;
        // 注意：hpChange会在后面单独处理
      }

      // 添加奖励物品
      if (task.reward.items) {
        task.reward.items.forEach((rewardItem) => {
          const existingIdx = updatedInventory.findIndex(
            (i) => i.name === rewardItem.name
          );
          if (existingIdx >= 0) {
            updatedInventory[existingIdx] = {
              ...updatedInventory[existingIdx],
              quantity:
                updatedInventory[existingIdx].quantity +
                (rewardItem.quantity || 1),
            };
          } else {
            // 创建新物品（简化版，只包含基本信息）
            updatedInventory.push({
              id: uid(),
              name: rewardItem.name,
              type: ItemType.Material,
              description: `完成任务获得的${rewardItem.name}`,
              quantity: rewardItem.quantity || 1,
              rarity: '普通',
            });
          }
        });
      }

      // 生成任务完成日志
      const rewardText = [
        `${contribGain} 贡献`,
        expGain > 0 ? `${expGain} 修为` : '',
        stoneGain > 0 ? `${stoneGain} 灵石` : '',
        task.reward.items
          ? task.reward.items.map((i) => `${i.quantity} ${i.name}`).join('、')
          : '',
      ]
        .filter(Boolean)
        .join('、');

      let completionMessage = `你完成了任务【${task.name}】`;
      if (isPerfectCompletion) {
        completionMessage += '（完美完成）';
      }
      completionMessage += `，获得了 ${rewardText}。`;

      if (specialRewardObtained && task.specialReward?.item) {
        completionMessage += ` 额外获得特殊奖励：${task.specialReward.item.name}！`;
      }

      logMessage(completionMessage, isPerfectCompletion ? 'special' : 'gain');

      // 处理奇遇的HP变化
      let newHp = prev.hp;
      let newMaxHp = prev.maxHp;
      if (encounterResult && encounterResult.hpChange) {
        newHp = Math.max(0, Math.min(prev.maxHp, prev.hp + encounterResult.hpChange));
      }

      return {
        ...prev,
        spiritStones: prev.spiritStones - stoneCost + stoneGain,
        exp: prev.exp + expGain,
        hp: newHp,
        maxHp: newMaxHp,
        inventory: updatedInventory,
        sectContribution: prev.sectContribution + contribGain,
        dailyTaskCount,
        lastTaskResetDate,
        lastCompletedTaskType: task.type, // 记录最后完成的任务类型
      };
    });
  };

  const handleSectPromote = () => {
    setPlayer((prev) => {
      const ranks = Object.values(SectRank);
      const currentRankIdx = ranks.indexOf(prev.sectRank);
      const nextRank = ranks[currentRankIdx + 1];

      if (!nextRank) return prev;

      const req = SECT_RANK_REQUIREMENTS[nextRank];
      if (prev.sectContribution < req.contribution) return prev;

      // 根据宗门和等级给予奖励
      const getSectPromotionReward = (sectId: string | null, rank: SectRank) => {
        const baseRewards: Record<SectRank, { contribution: number; exp: number; spiritStones: number }> = {
          [SectRank.Outer]: { contribution: 0, exp: 0, spiritStones: 0 },
          [SectRank.Inner]: { contribution: 500, exp: 2000, spiritStones: 3000 },
          [SectRank.Core]: { contribution: 1500, exp: 8000, spiritStones: 10000 },
          [SectRank.Elder]: { contribution: 5000, exp: 30000, spiritStones: 50000 },
        };

        const base = baseRewards[rank];

        // 根据宗门特色给予特殊奖励
        const sectSpecialRewards: Record<string, Record<SectRank, { items: { name: string; quantity: number }[] }>> = {
          'sect-cloud': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '聚气丹', quantity: 10 }, { name: '云灵草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '洗髓丹', quantity: 5 }, { name: '云灵草', quantity: 10 }, { name: '聚灵符', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '筑基丹', quantity: 2 }, { name: '云灵草', quantity: 20 }, { name: '聚灵符', quantity: 10 }, { name: '宗门制式剑', quantity: 1 }] },
          },
          'sect-fire': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '火精', quantity: 5 }, { name: '炼器石', quantity: 10 }] },
            [SectRank.Core]: { items: [{ name: '火精', quantity: 10 }, { name: '炼器石', quantity: 20 }, { name: '烈火丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '火精', quantity: 20 }, { name: '炼器石', quantity: 50 }, { name: '烈火丹', quantity: 10 }, { name: '熔岩之心', quantity: 1 }] },
          },
          'sect-sword': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '精铁', quantity: 10 }, { name: '剑意草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '精铁', quantity: 20 }, { name: '剑意草', quantity: 10 }, { name: '青钢剑', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '精铁', quantity: 50 }, { name: '剑意草', quantity: 20 }, { name: '青钢剑', quantity: 1 }, { name: '剑修功法残卷', quantity: 1 }] },
          },
          'sect-temple': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '止血草', quantity: 10 }, { name: '护体符', quantity: 3 }] },
            [SectRank.Core]: { items: [{ name: '止血草', quantity: 20 }, { name: '护体符', quantity: 5 }, { name: '玄铁甲', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '止血草', quantity: 30 }, { name: '护体符', quantity: 10 }, { name: '玄铁甲', quantity: 1 }, { name: '佛门护符', quantity: 1 }] },
          },
          'sect-taoist': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '聚灵草', quantity: 10 }, { name: '经验符', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '聚灵草', quantity: 20 }, { name: '经验符', quantity: 10 }, { name: '聚灵符', quantity: 5 }] },
            [SectRank.Elder]: { items: [{ name: '聚灵草', quantity: 30 }, { name: '经验符', quantity: 20 }, { name: '聚灵符', quantity: 10 }, { name: '道门心法残卷', quantity: 1 }] },
          },
          'sect-blood': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '妖兽内丹', quantity: 5 }, { name: '血精', quantity: 3 }] },
            [SectRank.Core]: { items: [{ name: '妖兽内丹', quantity: 10 }, { name: '血精', quantity: 5 }, { name: '魔血丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '妖兽内丹', quantity: 20 }, { name: '血精', quantity: 10 }, { name: '魔血丹', quantity: 10 }, { name: '血魔功残卷', quantity: 1 }] },
          },
          'sect-lotus': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '精铁', quantity: 10 }, { name: '青莲叶', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '精铁', quantity: 20 }, { name: '青莲叶', quantity: 10 }, { name: '青钢剑', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '精铁', quantity: 50 }, { name: '青莲叶', quantity: 20 }, { name: '青钢剑', quantity: 1 }, { name: '青莲剑诀残卷', quantity: 1 }] },
          },
          'sect-xuantian': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '千年人参', quantity: 3 }, { name: '聚灵草', quantity: 10 }] },
            [SectRank.Core]: { items: [{ name: '千年人参', quantity: 5 }, { name: '聚灵草', quantity: 20 }, { name: '玄天丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '千年人参', quantity: 10 }, { name: '聚灵草', quantity: 30 }, { name: '玄天丹', quantity: 10 }, { name: '玄天功残卷', quantity: 1 }] },
          },
          'sect-jiuyou': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '妖兽内丹', quantity: 5 }, { name: '阴魂石', quantity: 3 }] },
            [SectRank.Core]: { items: [{ name: '妖兽内丹', quantity: 10 }, { name: '阴魂石', quantity: 5 }, { name: '九幽丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '妖兽内丹', quantity: 20 }, { name: '阴魂石', quantity: 10 }, { name: '九幽丹', quantity: 10 }, { name: '九幽魔功残卷', quantity: 1 }] },
          },
          'sect-star': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '星辰石', quantity: 5 }, { name: '星辉草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '星辰石', quantity: 10 }, { name: '星辉草', quantity: 10 }, { name: '星辰剑', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '星辰石', quantity: 20 }, { name: '星辉草', quantity: 20 }, { name: '星辰剑', quantity: 1 }, { name: '星辰诀残卷', quantity: 1 }] },
          },
          'sect-dragon': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '龙鳞果', quantity: 3 }, { name: '龙血草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '龙鳞果', quantity: 5 }, { name: '龙血草', quantity: 10 }, { name: '龙鳞甲', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '龙鳞果', quantity: 10 }, { name: '龙血草', quantity: 20 }, { name: '龙鳞甲', quantity: 1 }, { name: '真龙诀残卷', quantity: 1 }] },
          },
          'sect-phoenix': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '九叶芝草', quantity: 3 }, { name: '凤凰羽', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '九叶芝草', quantity: 5 }, { name: '凤凰羽', quantity: 10 }, { name: '涅槃丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '九叶芝草', quantity: 10 }, { name: '凤凰羽', quantity: 20 }, { name: '涅槃丹', quantity: 10 }, { name: '凤凰涅槃功残卷', quantity: 1 }] },
          },
          'sect-thunder': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '炼器石', quantity: 10 }, { name: '雷晶', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '炼器石', quantity: 20 }, { name: '雷晶', quantity: 10 }, { name: '雷霆符', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '炼器石', quantity: 50 }, { name: '雷晶', quantity: 20 }, { name: '雷霆符', quantity: 10 }, { name: '雷神诀残卷', quantity: 1 }] },
          },
          'sect-ice': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '聚灵草', quantity: 10 }, { name: '冰晶', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '聚灵草', quantity: 20 }, { name: '冰晶', quantity: 10 }, { name: '寒冰符', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '聚灵草', quantity: 30 }, { name: '冰晶', quantity: 20 }, { name: '寒冰符', quantity: 10 }, { name: '冰魄诀残卷', quantity: 1 }] },
          },
          'sect-poison': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '止血草', quantity: 10 }, { name: '毒草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '止血草', quantity: 20 }, { name: '毒草', quantity: 10 }, { name: '毒丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '止血草', quantity: 30 }, { name: '毒草', quantity: 20 }, { name: '毒丹', quantity: 10 }, { name: '毒王经残卷', quantity: 1 }] },
          },
          'sect-illusion': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '聚灵草', quantity: 10 }, { name: '幻心草', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '聚灵草', quantity: 20 }, { name: '幻心草', quantity: 10 }, { name: '迷魂符', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '聚灵草', quantity: 30 }, { name: '幻心草', quantity: 20 }, { name: '迷魂符', quantity: 10 }, { name: '幻月诀残卷', quantity: 1 }] },
          },
          'sect-diamond': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '炼器石', quantity: 10 }, { name: '金刚石', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '炼器石', quantity: 20 }, { name: '金刚石', quantity: 10 }, { name: '玄铁甲', quantity: 1 }] },
            [SectRank.Elder]: { items: [{ name: '炼器石', quantity: 50 }, { name: '金刚石', quantity: 20 }, { name: '玄铁甲', quantity: 1 }, { name: '金刚体诀残卷', quantity: 1 }] },
          },
          'sect-yinyang': {
            [SectRank.Outer]: { items: [] },
            [SectRank.Inner]: { items: [{ name: '聚灵草', quantity: 10 }, { name: '阴阳石', quantity: 5 }] },
            [SectRank.Core]: { items: [{ name: '聚灵草', quantity: 20 }, { name: '阴阳石', quantity: 10 }, { name: '阴阳丹', quantity: 3 }] },
            [SectRank.Elder]: { items: [{ name: '聚灵草', quantity: 30 }, { name: '阴阳石', quantity: 20 }, { name: '阴阳丹', quantity: 10 }, { name: '阴阳诀残卷', quantity: 1 }] },
          },
        };

        const specialReward = sectSpecialRewards[sectId || '']?.[rank] || { items: [] };

        return {
          ...base,
          items: specialReward.items,
        };
      };

      const reward = getSectPromotionReward(prev.sectId, nextRank);
      let updatedInventory = [...prev.inventory];

      // 添加奖励物品
      if (reward.items) {
        reward.items.forEach((rewardItem) => {
          const existingIdx = updatedInventory.findIndex(
            (i) => i.name === rewardItem.name
          );
          if (existingIdx >= 0) {
            updatedInventory[existingIdx] = {
              ...updatedInventory[existingIdx],
              quantity: updatedInventory[existingIdx].quantity + (rewardItem.quantity || 1),
            };
          } else {
            updatedInventory.push({
              id: uid(),
              name: rewardItem.name,
              type: ItemType.Material,
              description: `晋升奖励：${rewardItem.name}`,
              quantity: rewardItem.quantity || 1,
              rarity: '普通',
            });
          }
        });
      }

      const rewardText = [
        `${reward.contribution} 贡献`,
        `${reward.exp} 修为`,
        `${reward.spiritStones} 灵石`,
        reward.items ? reward.items.map((i) => `${i.quantity} ${i.name}`).join('、') : '',
      ].filter(Boolean).join('、');

      logMessage(`恭喜！你晋升为【${nextRank}】，地位大增。获得奖励：${rewardText}。`, 'special');

      return {
        ...prev,
        sectRank: nextRank,
        sectContribution: prev.sectContribution - req.contribution + reward.contribution,
        exp: prev.exp + reward.exp,
        spiritStones: prev.spiritStones + reward.spiritStones,
        inventory: updatedInventory,
      };
    });
  };

  const handleSectBuy = (
    itemTemplate: Partial<Item>,
    cost: number,
    quantity: number = 1
  ) => {
    setPlayer((prev) => {
      const totalCost = cost * quantity;
      if (prev.sectContribution < totalCost) {
        logMessage('贡献不足！', 'danger');
        return prev;
      }

      const newInv = [...prev.inventory];
      const isEquipment =
        itemTemplate.isEquippable && itemTemplate.equipmentSlot;
      const existingIdx = newInv.findIndex((i) => i.name === itemTemplate.name);

      if (existingIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          quantity: newInv[existingIdx].quantity + quantity,
        };
      } else {
        // 装备类物品或新物品，每个装备单独占一格
        // 如果是装备，每次兑换创建一个新物品（quantity=1）
        const itemsToAdd = isEquipment ? quantity : 1; // 装备每次兑换都创建新物品
        const addQuantity = isEquipment ? 1 : quantity; // 装备quantity始终为1

        for (let i = 0; i < itemsToAdd; i++) {
          newInv.push({
            id: uid(),
            name: itemTemplate.name || '未知物品',
            type: itemTemplate.type || ItemType.Material,
            description: itemTemplate.description || '',
            quantity: addQuantity,
            rarity: (itemTemplate.rarity as ItemRarity) || '普通',
            effect: itemTemplate.effect,
            level: 0,
            isEquippable: itemTemplate.isEquippable,
            equipmentSlot: itemTemplate.equipmentSlot,
          });
        }
      }

      logMessage(
        `你消耗了 ${totalCost} 贡献，兑换了 ${itemTemplate.name} x${quantity}。`,
        'gain'
      );
      // 显示购买成功弹窗
      setPurchaseSuccess({ item: itemTemplate.name || '未知物品', quantity });
      setTimeout(() => setPurchaseSuccess(null), 2000);

      return {
        ...prev,
        sectContribution: prev.sectContribution - totalCost,
        inventory: newInv,
      };
    });
  };

  return {
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
  };
}
