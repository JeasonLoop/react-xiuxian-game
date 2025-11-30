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
import { uid } from '../../utils/gameUtils';

interface UseSectHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setIsSectOpen: (open: boolean) => void;
  setPurchaseSuccess: (
    success: { item: string; quantity: number } | null
  ) => void;
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
}: UseSectHandlersProps) {
  const handleJoinSect = (sectId: string, sectName?: string) => {
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
    }));
    addLog(`恭喜！你已拜入【${sect.name}】，成为一名外门弟子。`, 'special');
  };

  const handleLeaveSect = () => {
    setPlayer((prev) => ({
      ...prev,
      sectId: null,
      sectRank: SectRank.Outer,
      sectContribution: 0,
    }));
    addLog(`你叛出了宗门，从此成为一名散修。`, 'danger');
    setIsSectOpen(false);
  };

  const handleSectTask = (task: RandomSectTask) => {
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
          addLog(
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
          addLog(`灵石不足，需要 ${task.cost.spiritStones} 灵石。`, 'danger');
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
            addLog(
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

      addLog(`你完成了任务【${task.name}】，获得了 ${rewardText}。`, 'gain');

      return {
        ...prev,
        spiritStones: prev.spiritStones - stoneCost + stoneGain,
        exp: prev.exp + expGain,
        inventory: updatedInventory,
        sectContribution: prev.sectContribution + contribGain,
        dailyTaskCount,
        lastTaskResetDate,
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

      addLog(`恭喜！你晋升为【${nextRank}】，地位大增。`, 'special');

      return {
        ...prev,
        sectRank: nextRank,
        sectContribution: prev.sectContribution - req.contribution,
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
        addLog('贡献不足！', 'danger');
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

      addLog(
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
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
  };
}
