import React from 'react';
import {
  PlayerStats,
  Recipe,
  ItemType,
  ItemRarity,
  Item,
} from '../../types';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { showSuccess, showError } from '../../utils/toastUtils';
import { useGameStore } from '../../store';
import { artifactService } from '../../services/artifactService';

interface UseAlchemyHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  triggerVisual?: (type: 'damage' | 'heal' | 'slash' | 'alchemy', value?: string, color?: string) => void;
}

/**
 * 炼丹与炼器处理函数
 */
export function useAlchemyHandlers(
  props?: UseAlchemyHandlersProps
) {
  // 从 zustand store 获取状态
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);

  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const triggerVisual = props?.triggerVisual;

  /**
   * 炼丹逻辑
   */
  const handleCraft = async (recipe: Recipe) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '🔥 炼丹中...', 'text-mystic-gold');
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    setPlayer((prev) => {
      if (!prev) return prev;
      if (prev.spiritStones < recipe.cost) return prev;

      const newInventory = [...prev.inventory];
      for (const req of recipe.ingredients) {
        const itemIdx = newInventory.findIndex((i) => i.name === req.name);
        if (itemIdx === -1 || newInventory[itemIdx].quantity < req.qty) {
          showError(`材料不足：${req.name}`);
          return prev;
        }

        newInventory[itemIdx] = {
          ...newInventory[itemIdx],
          quantity: newInventory[itemIdx].quantity - req.qty,
        };
      }

      const cleanedInventory = addItemToInventory(
        newInventory.filter((i) => i.quantity > 0),
        {
          name: recipe.result.name || 'Unknown',
          type: recipe.result.type || ItemType.Pill,
          description: recipe.result.description || '',
          rarity: (recipe.result.rarity as ItemRarity) || '普通',
          effect: recipe.result.effect,
          permanentEffect: recipe.result.permanentEffect,
        },
        1,
        { realm: prev.realm, realmLevel: prev.realmLevel }
      );

      addLog(`丹炉火起，药香四溢。你炼制出了 ${recipe.result.name}。`, 'gain');
      showSuccess(`炼制成功！获得 ${recipe.result.name}`);

      if (triggerVisual) {
        setTimeout(() => {
          triggerVisual('alchemy', `✨ ${recipe.result.name}`, 'text-mystic-gold');
        }, 200);
      }

      const newStats = { ...(prev.statistics || {}) };
      newStats.alchemyCount = (newStats.alchemyCount || 0) + 1;

      return {
        ...prev,
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory,
        statistics: newStats as any,
      };
    });
  };

  /**
   * 炼器逻辑：材料合成
   */
  const handleCraftArtifact = async (materials: Item[], customName: string, selectedSlot?: string) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '⚒️ 炼器中...', 'text-stone-400');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const newArtifact = artifactService.craftFromMaterials(materials, customName, selectedSlot);

      setPlayer(prev => {
        if (!prev) return prev;

        // 扣除材料
        const newInventory = [...prev.inventory];
        materials.forEach(m => {
          const idx = newInventory.findIndex(invItem => invItem.id === m.id);
          if (idx !== -1) {
            newInventory[idx].quantity -= 1;
          }
        });

        const cleanedInventory = addItemToInventory(
          newInventory.filter(i => i.quantity > 0),
          newArtifact,
          1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );

        addLog(`金石交击，神兵出世！你炼制出了 ${newArtifact.name}。`, 'special');
        showSuccess(`炼器成功！获得 ${newArtifact.name}`);

        return {
          ...prev,
          inventory: cleanedInventory
        };
      });
    } catch (e: any) {
      showError(e.message);
    }
  };

  /**
   * 炼器逻辑：装备融合
   */
  const handleFuseArtifact = async (item1: Item, item2: Item, stone: Item, customName?: string) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '🌀 融合中...', 'text-mystic-gold');
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const fusedItem = artifactService.fuseEquipment(item1, item2, stone, customName);

      setPlayer(prev => {
        if (!prev) return prev;

        // 移除旧装备和合成石
        const newInventory = prev.inventory.filter(i =>
          i.id !== item1.id && i.id !== item2.id
        );

        // 扣除合成石数量
        const stoneIdx = newInventory.findIndex(i => i.id === stone.id);
        if (stoneIdx !== -1) {
          newInventory[stoneIdx].quantity -= 1;
        }

        const cleanedInventory = addItemToInventory(
          newInventory.filter(i => i.quantity > 0),
          fusedItem,
          1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );

        addLog(`两件神兵在合成石的作用下合二为一，${fusedItem.name} 诞生了！`, 'special');
        showSuccess(`融合成功！获得 ${fusedItem.name}`);

        return {
          ...prev,
          inventory: cleanedInventory
        };
      });
    } catch (e: any) {
      showError(e.message);
    }
  };

  return {
    handleCraft,
    handleCraftArtifact,
    handleFuseArtifact,
  };
}
