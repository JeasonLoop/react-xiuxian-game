import React, { useRef } from 'react';
import { PlayerStats, Pet, ItemType, LotteryPrize } from '../../types';
import { LOTTERY_PRIZES, PET_TEMPLATES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { getRealmEventRewardMultiplier } from '../../utils/realmEventRewardScale';
import { useGameStore, useUIStore } from '../../store';

/** 每 N 次累计抽奖必出「传说 / 仙品」池（与每 10 次稀有保底独立，取更优池） */
const LOTTERY_SOFT_PITY_LEGEND_INTERVAL = 50;
const DUPLICATE_PET_SPIRIT_STONES_BASE = 8000;

function convertDuplicatePetDrawsToCompensation(
  results: LotteryPrize[],
  player: PlayerStats
): LotteryPrize[] {
  const mult = getRealmEventRewardMultiplier(player);
  const speciesSeen = new Set(player.pets.map((p) => p.species));
  const out: LotteryPrize[] = [];
  for (const prize of results) {
    if (prize.type !== 'pet' || !prize.value.petId) {
      out.push(prize);
      continue;
    }
    const template = PET_TEMPLATES.find((t) => t.id === prize.value.petId);
    if (!template) {
      out.push(prize);
      continue;
    }
    if (speciesSeen.has(template.species)) {
      const stones = Math.max(
        2000,
        Math.floor(
          DUPLICATE_PET_SPIRIT_STONES_BASE *
            Math.min(2.6, 0.42 + mult * 0.32)
        )
      );
      out.push({
        id: `${prize.id}-dup-${out.length}`,
        name: `${template.name}（重复·灵石补偿）`,
        type: 'spiritStones',
        rarity: prize.rarity,
        weight: 0,
        value: { spiritStones: stones },
      });
    } else {
      speciesSeen.add(template.species);
      out.push(prize);
    }
  }
  return out;
}

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

    const results: LotteryPrize[] = [];
    const currentCount = player.lotteryCount;

    const rarePrizes = LOTTERY_PRIZES.filter((p) => p.rarity !== '普通');
    const legendImmortalPrizes = LOTTERY_PRIZES.filter(
      (p) => p.rarity === '传说' || p.rarity === '仙品'
    );
    const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    const rareTotalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);
    const legendTotalWeight = legendImmortalPrizes.reduce(
      (sum, p) => sum + p.weight,
      0
    );

    const selectPrizeByWeight = (
      prizes: LotteryPrize[],
      weight: number
    ): LotteryPrize | null => {
      if (weight > 0 && prizes.length > 0) {
        let random = Math.random() * weight;
        for (const prize of prizes) {
          random -= prize.weight;
          if (random <= 0) {
            return prize;
          }
        }
      }
      return prizes.length > 0 ? prizes[0] : null;
    };

    for (let i = 0; i < count; i++) {
      const totalCount = currentCount + i + 1;
      const shouldSoftLegend =
        totalCount % LOTTERY_SOFT_PITY_LEGEND_INTERVAL === 0 &&
        legendImmortalPrizes.length > 0 &&
        legendTotalWeight > 0;
      const shouldGuaranteeRare = totalCount % 10 === 0;

      if (shouldSoftLegend) {
        const prize = selectPrizeByWeight(
          legendImmortalPrizes,
          legendTotalWeight
        );
        if (prize) {
          results.push(prize);
        } else if (rarePrizes.length > 0) {
          const fallback = selectPrizeByWeight(rarePrizes, rareTotalWeight);
          if (fallback) results.push(fallback);
        } else if (LOTTERY_PRIZES.length > 0) {
          results.push(LOTTERY_PRIZES[0]);
        }
      } else if (shouldGuaranteeRare) {
        if (rarePrizes.length === 0) {
          const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
          if (prize) results.push(prize);
        } else {
          const prize = selectPrizeByWeight(rarePrizes, rareTotalWeight);
          if (prize) {
            results.push(prize);
          } else if (LOTTERY_PRIZES.length > 0) {
            results.push(LOTTERY_PRIZES[0]);
          }
        }
      } else {
        const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
        if (prize) {
          results.push(prize);
        }
      }
    }

    if (results.length !== count) {
      console.error(`抽奖结果数量不匹配：期望 ${count} 个，实际 ${results.length} 个`);
      while (results.length < count && LOTTERY_PRIZES.length > 0) {
        results.push(LOTTERY_PRIZES[0]);
      }
    }

    const resolvedResults = convertDuplicatePetDrawsToCompensation(
      results,
      player
    );

    // 先统计所有获得的奖励用于弹窗显示（在setPlayer之前，避免回调被调用多次导致重复）
    const rewardMap = new Map<string, { type: string; name: string; quantity: number }>();

    // 先遍历一次 resolvedResults，统计奖励（不修改背包状态）
    for (const prize of resolvedResults) {
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

      for (const prize of resolvedResults) {
        if (prize.type === 'spiritStones') {
          const amount = prize.value.spiritStones || 0;
          newStones += amount;
          if (prize.name.includes('重复')) {
            addLog(`灵宠重复：折算 ${amount} 灵石`, 'gain');
          } else {
            addLog(`获得 ${amount} 灵石`, 'gain');
          }
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
