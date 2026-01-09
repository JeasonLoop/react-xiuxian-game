import React from 'react';
import {
  PlayerStats,
  Recipe,
  ItemType,
  ItemRarity,
} from '../../types';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { showSuccess } from '../../utils/toastUtils';
import { useGameStore } from '../../store';

interface UseAlchemyHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  triggerVisual?: (type: 'damage' | 'heal' | 'slash' | 'alchemy', value?: string, color?: string) => void;
}

/**
 * 炼丹处理函数
 * 包含炼丹
 * @param props 可选的 props（向后兼容），如果不提供则从 zustand store 获取
 * @returns handleCraft 炼丹
 */
export function useAlchemyHandlers(
  props?: UseAlchemyHandlersProps
) {
  // 从 zustand store 获取状态
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);

  // 使用 props 或 store 的值（props 优先，用于向后兼容）
  // triggerVisual 来自 useGameEffects hook，不是 zustand store 的一部分，所以保持从 props 传入
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const triggerVisual = props?.triggerVisual;
  const handleCraft = async (recipe: Recipe) => {
    // 先触发炼丹开始动画
    if (triggerVisual) {
      triggerVisual('alchemy', '🔥 炼丹中...', 'text-mystic-gold');
    }

    // 延迟一下，让用户看到炼丹过程
    await new Promise((resolve) => setTimeout(resolve, 800));

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
      // 显示全局成功提示
      showSuccess(`炼制成功！获得 ${recipe.result.name}`);
      // 触发炼丹成功动画（更明显的效果）
      if (triggerVisual) {
        // 延迟触发成功动画，让用户看到完整的炼丹过程
        setTimeout(() => {
          triggerVisual('alchemy', `✨ ${recipe.result.name}`, 'text-mystic-gold');
        }, 200);
      }

      const newStats = {
        ...(prev.statistics || {
          killCount: 0,
          meditateCount: 0,
          adventureCount: 0,
          equipCount: 0,
          petCount: 0,
          recipeCount: 0,
          artCount: 0,
          breakthroughCount: 0,
          secretRealmCount: 0,
          alchemyCount: 0,
        }),
      };
      newStats.alchemyCount = (newStats.alchemyCount || 0) + 1;

      return {
        ...prev,
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory,
        statistics: newStats,
      };
    });
  };

  return {
    handleCraft,
  };
}
