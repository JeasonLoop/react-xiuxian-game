import React from 'react';
import {
  PlayerStats,
  Recipe,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
} from '../../types';
import { uid } from '../../utils/gameUtils';

interface UseAlchemyHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 炼丹处理函数
 * 包含炼丹
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleCraft 炼丹
 */
export function useAlchemyHandlers({
  setPlayer,
  addLog,
}: UseAlchemyHandlersProps) {
  const handleCraft = (recipe: Recipe) => {
    setPlayer((prev) => {
      if (prev.spiritStones < recipe.cost) return prev;

      const newInventory = [...prev.inventory];
      for (const req of recipe.ingredients) {
        const itemIdx = newInventory.findIndex((i) => i.name === req.name);
        if (itemIdx === -1 || newInventory[itemIdx].quantity < req.qty)
          return prev;

        newInventory[itemIdx] = {
          ...newInventory[itemIdx],
          quantity: newInventory[itemIdx].quantity - req.qty,
        };
      }

      const cleanedInventory = newInventory.filter((i) => i.quantity > 0);

      const isEquipment =
        recipe.result.type === ItemType.Artifact ||
        recipe.result.type === ItemType.Weapon ||
        recipe.result.type === ItemType.Armor ||
        recipe.result.type === ItemType.Ring ||
        recipe.result.type === ItemType.Accessory;
      const existingResultIdx = cleanedInventory.findIndex(
        (i) => i.name === recipe.result.name
      );

      if (existingResultIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        cleanedInventory[existingResultIdx] = {
          ...cleanedInventory[existingResultIdx],
          quantity: cleanedInventory[existingResultIdx].quantity + 1,
        };
      } else {
        // 装备类物品或新物品，创建新物品
        const newItem: Item = {
          id: uid(),
          name: recipe.result.name || 'Unknown',
          type: recipe.result.type || ItemType.Pill,
          description: recipe.result.description || '',
          quantity: 1,
          rarity: (recipe.result.rarity as ItemRarity) || '普通',
          level: 0,
          effect: recipe.result.effect,
        };

        // 如果是装备，添加装备相关属性
        if (isEquipment) {
          newItem.isEquippable = true;
          if ('equipmentSlot' in recipe.result && recipe.result.equipmentSlot) {
            newItem.equipmentSlot = recipe.result
              .equipmentSlot as EquipmentSlot;
          } else {
            // 根据类型推断装备槽位
            if (recipe.result.type === ItemType.Artifact) {
              const artifactSlots = [
                EquipmentSlot.Artifact1,
                EquipmentSlot.Artifact2,
              ];
              newItem.equipmentSlot =
                artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
            } else if (recipe.result.type === ItemType.Weapon) {
              newItem.equipmentSlot = EquipmentSlot.Weapon;
            } else if (recipe.result.type === ItemType.Ring) {
              const ringSlots = [
                EquipmentSlot.Ring1,
                EquipmentSlot.Ring2,
                EquipmentSlot.Ring3,
                EquipmentSlot.Ring4,
              ];
              newItem.equipmentSlot =
                ringSlots[Math.floor(Math.random() * ringSlots.length)];
            } else if (recipe.result.type === ItemType.Accessory) {
              const accessorySlots = [
                EquipmentSlot.Accessory1,
                EquipmentSlot.Accessory2,
              ];
              newItem.equipmentSlot =
                accessorySlots[
                  Math.floor(Math.random() * accessorySlots.length)
                ];
            }
          }
        }

        cleanedInventory.push(newItem);
      }

      addLog(`丹炉火起，药香四溢。你炼制出了 ${recipe.result.name}。`, 'gain');

      return {
        ...prev,
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory,
      };
    });
  };

  return {
    handleCraft,
  };
}
