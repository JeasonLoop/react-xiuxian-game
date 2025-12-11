/**
 * 战斗结果处理 Hook
 * 处理回合制战斗结果，更新玩家状态、处理物品奖励等
 */
import React from 'react';
import { Item, ItemType, PlayerStats, ItemRarity} from '../types';
import { uid } from '../utils/gameUtils';
import { normalizeItemEffect, inferItemTypeAndSlot } from '../utils/itemUtils';

// 战斗结果类型（可能不包含所有字段）
interface BattleResultData {
  victory: boolean;
  hpLoss: number;
  expChange: number;
  spiritChange: number;
  items?: Array<{
    name: string;
    type?: string;
    description?: string;
    rarity?: string;
    isEquippable?: boolean;
    equipmentSlot?: string;
    effect?: any;
    permanentEffect?: any;
  }>;
  petSkillCooldowns?: Record<string, number>;
  playerHpBefore?: number;
  playerHpAfter?: number;
  summary?: string;
}

interface UseBattleResultHandlerParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 处理战斗结果
 */
export function useBattleResultHandler({
  player,
  setPlayer,
  addLog,
  setLoading,
}: UseBattleResultHandlerParams) {
  const handleBattleResult = (
    result: BattleResultData | null,
    updatedInventory?: Item[]
  ) => {
    if (!player) return;

    setLoading(false);

    if (result) {
      // 更新玩家状态
      setPlayer((prev) => {
        if (!prev) return prev;
        const newHp = Math.max(0, prev.hp - result.hpLoss);
        const newExp = Math.max(0, prev.exp + result.expChange);
        const newSpiritStones = Math.max(
          0,
          prev.spiritStones + result.spiritChange
        );

        // 更新灵宠技能冷却（如果有）
        let newPets = [...prev.pets];
        if (result.petSkillCooldowns && prev.activePetId) {
          newPets = newPets.map((pet) => {
            if (pet.id === prev.activePetId) {
              const updatedCooldowns = { ...pet.skillCooldowns };
              Object.keys(result.petSkillCooldowns).forEach((skillId) => {
                const newCooldown = result.petSkillCooldowns![skillId];
                if (newCooldown > 0) {
                  updatedCooldowns[skillId] = Math.max(
                    updatedCooldowns[skillId] || 0,
                    newCooldown
                  );
                }
              });
              const finalCooldowns: Record<string, number> = {};
              Object.keys(updatedCooldowns).forEach((skillId) => {
                if (updatedCooldowns[skillId] > 0) {
                  finalCooldowns[skillId] = updatedCooldowns[skillId];
                }
              });
              return {
                ...pet,
                skillCooldowns:
                  Object.keys(finalCooldowns).length > 0
                    ? finalCooldowns
                    : undefined,
              };
            }
            return pet;
          });
        }

        // 更新战斗统计
        const newStatistics = { ...prev.statistics };
        if (result.victory) {
          newStatistics.killCount += 1;
        }

        // 处理物品奖励
        let newInventory = updatedInventory || prev.inventory;
        if (result.victory && result.items && result.items.length > 0) {
          result.items.forEach((itemData: any) => {
            const itemName = itemData.name;
            const itemTypeFromData =
              (itemData.type as ItemType) || ItemType.Material;
            const inferred = inferItemTypeAndSlot(
              itemName,
              itemTypeFromData,
              itemData.description || '',
              itemData.isEquippable
            );
            const itemType = inferred.type;
            const equipmentSlot = inferred.equipmentSlot;
            const isEquippable = inferred.isEquippable;
            const rarity = (itemData.rarity as ItemRarity) || '普通';

            // 规范化物品效果（确保已知物品的效果与描述一致）
            // 对于丹药，根据稀有度调整效果，确保仙品丹药效果明显强于稀有
            const normalized = normalizeItemEffect(
              itemName,
              itemData.effect,
              itemData.permanentEffect,
              itemType,
              rarity
            );

            // 装备类物品可以重复获得，但每个装备单独占一格
            const isEquipment = isEquippable && equipmentSlot;
            const existingIdx = newInventory.findIndex(
              (i: Item) => i.name === itemName
            );

            if (existingIdx >= 0 && !isEquipment) {
              // 非装备类物品可以叠加
              newInventory[existingIdx] = {
                ...newInventory[existingIdx],
                quantity: newInventory[existingIdx].quantity + 1,
              };
            } else {
              // 装备类物品或新物品，每个装备单独占一格
              const newItem: Item = {
                id: uid(),
                name: itemName,
                type: itemType,
                description: itemData.description || '',
                quantity: 1,
                rarity: rarity,
                level: 0,
                isEquippable: isEquippable,
                equipmentSlot: equipmentSlot,
                effect: normalized.effect,
                permanentEffect: normalized.permanentEffect,
              };
              newInventory.push(newItem);
              addLog(`获得 ${itemName}！`, 'gain');
            }
          });
        }

        const hasItems = result.items && result.items.length > 0;
        const itemsText = hasItems
          ? `获得物品：${result.items.map((item) => item.name).join('，')}`
          : '';

        const rewardText = result.victory
          ? `战斗胜利！获得 ${result.expChange} 修为，${result.spiritChange} 灵石。${itemsText}`
          : `战斗失败，损失 ${result.hpLoss} 点气血。`;

        addLog(rewardText, result.victory ? 'gain' : 'danger');

        return {
          ...prev,
          hp: newHp,
          exp: newExp,
          spiritStones: newSpiritStones,
          statistics: newStatistics,
          inventory: newInventory,
          pets: newPets,
        };
      });
    }
  };

  return { handleBattleResult };
}

