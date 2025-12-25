import React, { useRef } from 'react';
import { PlayerStats, Item, Pet, ItemType, EquipmentSlot } from '../../types';
import { LOTTERY_PRIZES, PET_TEMPLATES, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../../constants';
import { uid } from '../../utils/gameUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';

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
        if (rarePrizes.length === 0) {
          // 如果没有稀有以上奖品，降级使用所有奖品（防御性处理）
          const totalWeight = LOTTERY_PRIZES.reduce(
            (sum, p) => sum + p.weight,
            0
          );
          if (totalWeight > 0) {
            let random = Math.random() * totalWeight;
            for (const prize of LOTTERY_PRIZES) {
              random -= prize.weight;
              if (random <= 0) {
                results.push(prize);
                break;
              }
            }
          } else {
            // 如果所有奖品权重都为0，使用第一个奖品作为保底
            if (LOTTERY_PRIZES.length > 0) {
              results.push(LOTTERY_PRIZES[0]);
            }
          }
        } else {
          const totalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);
          let random = Math.random() * totalWeight;
          for (const prize of rarePrizes) {
            random -= prize.weight;
            if (random <= 0) {
              results.push(prize);
              break;
            }
          }
        }
      } else {
        const totalWeight = LOTTERY_PRIZES.reduce(
          (sum, p) => sum + p.weight,
          0
        );
        if (totalWeight > 0) {
          let random = Math.random() * totalWeight;
          for (const prize of LOTTERY_PRIZES) {
            random -= prize.weight;
            if (random <= 0) {
              results.push(prize);
              break;
            }
          }
        } else {
          // 如果所有奖品权重都为0，使用第一个奖品作为保底
          if (LOTTERY_PRIZES.length > 0) {
            results.push(LOTTERY_PRIZES[0]);
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
      let newFoundationTreasure = prev.foundationTreasure;
      let newHeavenEarthEssence = prev.heavenEarthEssence;
      let newHeavenEarthMarrow = prev.heavenEarthMarrow;
      let newLongevityRules = [...(prev.longevityRules || [])];

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
          // 检查是否是进阶物品
          if (prize.value.foundationTreasure) {
            // 筑基奇物
            if (!prev.foundationTreasure) {
              const treasures = Object.values(FOUNDATION_TREASURES);
              const selected = treasures[Math.floor(Math.random() * treasures.length)];
              newFoundationTreasure = selected.id;
              addLog(`✨ 获得筑基奇物【${selected.name}】！这是突破筑基期的关键物品！`, 'special');
            } else {
              addLog(`你已经拥有筑基奇物，本次奖励转换为灵石`, 'gain');
              newStones += 1000;
            }
          } else if (prize.value.heavenEarthEssence) {
            // 天地精华
            if (!prev.heavenEarthEssence) {
              const essences = Object.values(HEAVEN_EARTH_ESSENCES);
              const selected = essences[Math.floor(Math.random() * essences.length)];
              newHeavenEarthEssence = selected.id;
              addLog(`✨ 获得天地精华【${selected.name}】！这是突破元婴期的关键物品！`, 'special');
            } else {
              addLog(`你已经拥有天地精华，本次奖励转换为灵石`, 'gain');
              newStones += 5000;
            }
          } else if (prize.value.heavenEarthMarrow) {
            // 天地之髓
            if (!prev.heavenEarthMarrow) {
              const marrows = Object.values(HEAVEN_EARTH_MARROWS);
              const selected = marrows[Math.floor(Math.random() * marrows.length)];
              newHeavenEarthMarrow = selected.id;
              addLog(`✨ 获得天地之髓【${selected.name}】！这是突破化神期的关键物品！`, 'special');
            } else {
              addLog(`你已经拥有天地之髓，本次奖励转换为灵石`, 'gain');
              newStones += 10000;
            }
          } else if (prize.value.longevityRule) {
            // 规则之力
            const maxRules = prev.maxLongevityRules || 3;
            if ((prev.longevityRules || []).length < maxRules) {
              const rules = Object.values(LONGEVITY_RULES);
              const currentRules = prev.longevityRules || [];
              const availableRules = rules.filter(r => !currentRules.includes(r.id));
              if (availableRules.length > 0) {
                const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
                newLongevityRules.push(selected.id);
                addLog(`✨ 获得规则之力【${selected.name}】！这是掌控天地的力量！`, 'special');
              } else {
                addLog(`你已经拥有所有规则之力，本次奖励转换为灵石`, 'gain');
                newStones += 20000;
              }
            } else {
              addLog(`你已经拥有最大数量的规则之力，本次奖励转换为灵石`, 'gain');
              newStones += 20000;
            }
          } else {
            // 普通物品
            const item = prize.value.item;
            newInv = addItemToInventory(newInv, item);
            addLog(`获得 ${item.name}！`, 'gain');
          }
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
              maxExp: 60, // 统一为60
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
        foundationTreasure: newFoundationTreasure,
        heavenEarthEssence: newHeavenEarthEssence,
        heavenEarthMarrow: newHeavenEarthMarrow,
        longevityRules: newLongevityRules,
        marrowRefiningProgress: newHeavenEarthMarrow && !prev.heavenEarthMarrow ? 0 : prev.marrowRefiningProgress,
        marrowRefiningSpeed: newHeavenEarthMarrow && !prev.heavenEarthMarrow ? 1.0 : prev.marrowRefiningSpeed,
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
