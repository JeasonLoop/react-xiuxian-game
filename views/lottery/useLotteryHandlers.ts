import React, { useRef } from 'react';
import { PlayerStats, Item, Pet, ItemType, EquipmentSlot } from '../../types';
import { LOTTERY_PRIZES, PET_TEMPLATES } from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseLotteryHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setLotteryRewards: (
    rewards: Array<{ type: string; name: string; quantity?: number }>
  ) => void;
}

/**
 * 抽奖处理函数
 * 包含抽奖
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param setLotteryRewards 设置抽奖结果
 * @returns handleDraw 抽奖
 */
export function useLotteryHandlers({
  player,
  setPlayer,
  addLog,
  setLotteryRewards,
}: UseLotteryHandlersProps) {
  const isDrawingRef = useRef(false); // 防止重复调用

  const handleDraw = (count: 1 | 10) => {
    if (isDrawingRef.current) {
      return; // 如果正在抽奖，忽略重复调用
    }
    if (!player || player.lotteryTickets < count) {
      addLog('抽奖券不足！', 'danger');
      return;
    }

    isDrawingRef.current = true;

    const results: typeof LOTTERY_PRIZES = [];
    let guaranteedRare = count === 10 && (player.lotteryCount + 1) % 10 === 0;

    for (let i = 0; i < count; i++) {
      if (guaranteedRare && i === count - 1) {
        // 保底稀有以上
        const rarePrizes = LOTTERY_PRIZES.filter((p) => p.rarity !== '普通');
        const totalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const prize of rarePrizes) {
          random -= prize.weight;
          if (random <= 0) {
            results.push(prize);
            break;
          }
        }
      } else {
        const totalWeight = LOTTERY_PRIZES.reduce(
          (sum, p) => sum + p.weight,
          0
        );
        let random = Math.random() * totalWeight;
        for (const prize of LOTTERY_PRIZES) {
          random -= prize.weight;
          if (random <= 0) {
            results.push(prize);
            break;
          }
        }
      }
    }

    // 先统计所有获得的奖励用于弹窗显示（在setPlayer之前，避免回调被调用多次导致重复）
    const rewardMap = new Map<string, { type: string; name: string; quantity: number }>();

    // 先遍历一次results，统计奖励（不修改背包状态）
    for (const prize of results) {
      if (prize.type === 'spiritStones') {
        const amount = prize.value.spiritStones || 0;
        const key = 'spiritStones';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'spiritStones', name: '灵石', quantity: amount });
        }
      } else if (prize.type === 'exp') {
        const amount = prize.value.exp || 0;
        const key = 'exp';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'exp', name: '修为', quantity: amount });
        }
      } else if (prize.type === 'item' && prize.value.item) {
        const item = prize.value.item;
        const key = `item:${item.name}`;
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          rewardMap.set(key, { type: 'item', name: item.name, quantity: 1 });
        }
      } else if (prize.type === 'pet' && prize.value.petId) {
        const template = PET_TEMPLATES.find((t) => t.id === prize.value.petId);
        if (template) {
          // 相同名称的灵宠合并显示
          const key = `pet:${template.name}`;
          const existing = rewardMap.get(key);
          if (existing) {
            existing.quantity += 1;
          } else {
            rewardMap.set(key, { type: 'pet', name: template.name, quantity: 1 });
          }
        }
      } else if (prize.type === 'ticket') {
        const amount = prize.value.tickets || 0;
        const key = 'ticket';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'ticket', name: '抽奖券', quantity: amount });
        }
      }
    }

    // 转换为数组
    const rewards = Array.from(rewardMap.values());

    setPlayer((prev) => {
      let newInv = [...prev.inventory];
      let newStones = prev.spiritStones;
      let newExp = prev.exp;
      let newPets = [...prev.pets];
      let newTickets = prev.lotteryTickets;

      for (const prize of results) {
        if (prize.type === 'spiritStones') {
          const amount = prize.value.spiritStones || 0;
          newStones += amount;
          addLog(`获得 ${amount} 灵石`, 'gain');
        } else if (prize.type === 'exp') {
          const amount = prize.value.exp || 0;
          newExp += amount;
          addLog(`获得 ${amount} 修为`, 'gain');
        } else if (prize.type === 'item' && prize.value.item) {
          const item = prize.value.item;
          const isEquipment = item.isEquippable && item.equipmentSlot;
          const existingIdx = newInv.findIndex((i) => i.name === item.name);

          if (existingIdx >= 0 && !isEquipment) {
            // 非装备类物品可以叠加
            newInv[existingIdx] = {
              ...newInv[existingIdx],
              quantity: newInv[existingIdx].quantity + 1,
            };
          } else {
            // 装备类物品或新物品，每个装备单独占一格
            // 如果是法宝类型但没有装备槽位，自动分配
            let finalItem = { ...item };
            if (item.type === ItemType.Artifact && !item.equipmentSlot) {
              const artifactSlots = [
                EquipmentSlot.Artifact1,
                EquipmentSlot.Artifact2,
              ];
              finalItem.equipmentSlot =
                artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
              finalItem.isEquippable = true;
            }

            newInv.push({
              ...finalItem,
              id: uid(),
              description: finalItem.description || '',
              quantity: 1, // 装备quantity始终为1
            } as Item);
          }
          addLog(`获得 ${item.name}！`, 'gain');
        } else if (prize.type === 'pet' && prize.value.petId) {
          const template = PET_TEMPLATES.find(
            (t) => t.id === prize.value.petId
          );
          if (template) {
            const newPet: Pet = {
              id: uid(),
              name: template.name,
              species: template.species,
              level: 1,
              exp: 0,
              maxExp: 100,
              rarity: template.rarity,
              stats: { ...template.baseStats },
              skills: [...template.skills],
              evolutionStage: 0,
              affection: 50,
            };
            newPets.push(newPet);
            addLog(`获得灵宠【${template.name}】！`, 'special');
          }
        } else if (prize.type === 'ticket') {
          const amount = prize.value.tickets || 0;
          newTickets += amount;
          addLog(`获得 ${amount} 张抽奖券`, 'gain');
        }
      }

      return {
        ...prev,
        lotteryTickets: newTickets - count,
        lotteryCount: prev.lotteryCount + count,
        inventory: newInv,
        spiritStones: newStones,
        exp: newExp,
        pets: newPets,
      };
    });

    // 显示抽奖结果弹窗
    setLotteryRewards([]);
    if (rewards.length > 0) {
      setTimeout(() => {
        setLotteryRewards([...rewards]); // 使用展开运算符创建新数组
        setTimeout(() => {
          setLotteryRewards([]);
          isDrawingRef.current = false; // 重置抽奖状态
        }, 3000);
      }, 0);
    } else {
      isDrawingRef.current = false; // 如果没有奖励，立即重置状态
    }
  };

  return {
    handleDraw,
  };
}
