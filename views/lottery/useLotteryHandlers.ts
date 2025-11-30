import React from 'react';
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
  const handleDraw = (count: 1 | 10) => {
    if (!player || player.lotteryTickets < count) {
      addLog('抽奖券不足！', 'danger');
      return;
    }

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

    // 收集所有获得的奖励用于弹窗显示
    const rewards: Array<{ type: string; name: string; quantity?: number }> =
      [];

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
          rewards.push({
            type: 'spiritStones',
            name: '灵石',
            quantity: amount,
          });
          addLog(`获得 ${amount} 灵石`, 'gain');
        } else if (prize.type === 'exp') {
          const amount = prize.value.exp || 0;
          newExp += amount;
          rewards.push({ type: 'exp', name: '修为', quantity: amount });
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
          rewards.push({ type: 'item', name: item.name, quantity: 1 });
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
            rewards.push({ type: 'pet', name: template.name, quantity: 1 });
            addLog(`获得灵宠【${template.name}】！`, 'special');
          }
        } else if (prize.type === 'ticket') {
          const amount = prize.value.tickets || 0;
          newTickets += amount;
          rewards.push({ type: 'ticket', name: '抽奖券', quantity: amount });
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

    // 显示抽奖结果弹窗（在setPlayer外部调用）
    if (rewards.length > 0) {
      setLotteryRewards(rewards);
      setTimeout(() => setLotteryRewards([]), 3000);
    }
  };

  return {
    handleDraw,
  };
}
