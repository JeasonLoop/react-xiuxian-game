import React, { useRef } from 'react';
import { PlayerStats, Pet, ItemType} from '../../types';
import { LOTTERY_PRIZES, PET_TEMPLATES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { useGameStore, useUIStore } from '../../store';

interface UseLotteryHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  setLotteryRewards?: (
    rewards: Array<{ type: string; name: string; quantity?: number }>
  ) => void;
}

/**
 * 抽奖处理函数
 * 包含抽奖
 * @param props 可选的 props（向后兼容），如果不提供则从 zustand store 获取
 * @returns handleDraw 抽奖
 */
export function useLotteryHandlers(
  props?: UseLotteryHandlersProps
) {
  // 从 zustand store 获取状态
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);
  const storeSetLotteryRewards = useUIStore((state) => state.setLotteryRewards);

  // 使用 props 或 store 的值（props 优先，用于向后兼容）
  const player = props?.player ?? storePlayer;
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const setLotteryRewards = props?.setLotteryRewards ?? storeSetLotteryRewards;
  const isDrawingRef = useRef(false); // 防止重复调用
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 存储奖励显示定时器

  const handleDraw = (count: number) => {
    if (isDrawingRef.current) {
      return; // 如果正在抽奖，忽略重复调用
    }
    if (!player || player.lotteryTickets < count) {
      addLog('抽奖券不足！', 'danger');
      return;
    }
    if (count <= 0 || !Number.isInteger(count)) {
      addLog('抽奖次数必须为正整数！', 'danger');
      return;
    }

    // 检查奖品池是否为空
    if (LOTTERY_PRIZES.length === 0) {
      addLog('奖品池为空，无法抽奖！', 'danger');
      return;
    }

    isDrawingRef.current = true;

    const results: typeof LOTTERY_PRIZES = [];
    // 计算保底：每10次必出稀有以上
    const currentCount = player.lotteryCount;
    // 找出本次抽奖中哪些位置会触发保底（每10次必出稀有以上）
    // 优化：使用Set替代数组，提高查找效率
    const guaranteeIndices = new Set<number>();
    for (let i = 0; i < count; i++) {
      const totalCount = currentCount + i + 1;
      if (totalCount % 10 === 0) {
        guaranteeIndices.add(i);
      }
    }

    // 优化：预先计算稀有奖品列表和总权重，避免在循环中重复计算
    const rarePrizes = LOTTERY_PRIZES.filter((p) => p.rarity !== '普通');
    const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    const rareTotalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);

    // 辅助函数：根据权重随机选择奖品
    const selectPrizeByWeight = (prizes: typeof LOTTERY_PRIZES, weight: number) => {
      if (weight > 0) {
        let random = Math.random() * weight;
        for (const prize of prizes) {
          random -= prize.weight;
          if (random <= 0) {
            return prize;
          }
        }
      }
      // 如果权重为0或没有找到，返回第一个奖品作为保底
      return prizes.length > 0 ? prizes[0] : null;
    };

    for (let i = 0; i < count; i++) {
      // 检查是否应该触发保底（每10次必出稀有以上）
      const shouldGuarantee = guaranteeIndices.has(i);
      if (shouldGuarantee) {
        // 保底稀有以上
        if (rarePrizes.length === 0) {
          // 如果没有稀有以上奖品，降级使用所有奖品（防御性处理）
          const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
          if (prize) {
            results.push(prize);
          }
        } else {
          const prize = selectPrizeByWeight(rarePrizes, rareTotalWeight);
          if (prize) {
            results.push(prize);
          } else if (LOTTERY_PRIZES.length > 0) {
            // 如果连稀有以上奖品都没有，降级使用第一个奖品
            results.push(LOTTERY_PRIZES[0]);
          }
        }
      } else {
        // 普通抽奖
        const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
        if (prize) {
          results.push(prize);
        }
      }
    }

    // 检查是否成功生成了所有奖品（防御性检查）
    if (results.length !== count) {
      console.error(`抽奖结果数量不匹配：期望 ${count} 个，实际 ${results.length} 个`);
      // 如果结果数量不足，使用第一个奖品填充（确保每次抽奖都有结果）
      while (results.length < count && LOTTERY_PRIZES.length > 0) {
        results.push(LOTTERY_PRIZES[0]);
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
          // 检查是否是进阶物品
          if (item.advancedItemType && item.advancedItemId) {
            // 进阶物品 - 直接使用奖品中的具体物品信息
            if (item.advancedItemType === 'longevityRule') {
              // 规则之力需要检查是否已拥有
              const currentRules = prev.longevityRules || [];
              const maxRules = prev.maxLongevityRules || 3;
              if (currentRules.includes(item.advancedItemId)) {
                addLog(`你已经拥有规则之力【${item.name}】，本次奖励转换为灵石`, 'gain');
                newStones += 20000;
              } else if (currentRules.length >= maxRules) {
                addLog(`你已经拥有所有规则之力，本次奖励转换为灵石`, 'gain');
                newStones += 20000;
              } else {
                newInv.push({
                  id: uid(),
                  name: item.name,
                  type: ItemType.AdvancedItem,
                  description: item.description,
                  quantity: 1,
                  rarity: item.rarity || '仙品',
                  advancedItemType: item.advancedItemType,
                  advancedItemId: item.advancedItemId,
                });
                const typeNames: Record<string, string> = {
                  foundationTreasure: '筑基奇物',
                  heavenEarthEssence: '天地精华',
                  heavenEarthMarrow: '天地之髓',
                  longevityRule: '规则之力',
                };
                const typeName = typeNames[item.advancedItemType] || '进阶物品';
                addLog(`✨ 获得${typeName}【${item.name}】！`, 'special');
              }
            } else {
              // 其他进阶物品直接添加
              newInv.push({
                id: uid(),
                name: item.name,
                type: ItemType.AdvancedItem,
                description: item.description,
                quantity: 1,
                rarity: item.rarity || '传说',
                advancedItemType: item.advancedItemType,
                advancedItemId: item.advancedItemId,
              });
              const typeNames: Record<string, string> = {
                foundationTreasure: '筑基奇物',
                heavenEarthEssence: '天地精华',
                heavenEarthMarrow: '天地之髓',
                longevityRule: '规则之力',
              };
              const typeName = typeNames[item.advancedItemType] || '进阶物品';
              addLog(`✨ 获得${typeName}【${item.name}】！`, 'special');
            }
          } else {
            // 普通物品
            newInv = addItemToInventory(newInv, item, 1, { realm: prev.realm, realmLevel: prev.realmLevel });
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
      };
    });

    // 清理之前的定时器
    if (rewardTimeoutRef.current) {
      clearTimeout(rewardTimeoutRef.current);
      rewardTimeoutRef.current = null;
    }

    // 显示抽奖结果弹窗
    setLotteryRewards([]);
    if (rewards.length > 0) {
      // 延迟显示奖励，确保状态更新后显示
      setTimeout(() => {
        setLotteryRewards([...rewards]); // 使用展开运算符创建新数组
        // 3秒后隐藏奖励并重置状态
        const hideTimeout = setTimeout(() => {
          setLotteryRewards([]);
          isDrawingRef.current = false; // 重置抽奖状态
          rewardTimeoutRef.current = null;
        }, 3000);
        // 跟踪第二个定时器（持续时间最长，需要能够清理）
        rewardTimeoutRef.current = hideTimeout;
      }, 0);
    } else {
      isDrawingRef.current = false; // 如果没有奖励，立即重置状态
    }
  };

  return {
    handleDraw,
  };
}
