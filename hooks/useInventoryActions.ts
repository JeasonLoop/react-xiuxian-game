/**
 * Inventory Actions Hook
 * 处理背包相关的操作，从 useAppHandlers 中提取
 */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Item, PlayerStats } from '../types';
import { compareItemEffects } from '../utils/objectUtils';

interface UseInventoryActionsProps {
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 背包操作 Hook
 */
export function useInventoryActions({ setPlayer, addLog }: UseInventoryActionsProps) {
  /**
   * 批量丢弃物品
   */
  const handleBatchDiscard = useCallback(
    (itemIds: string[]) => {
      setPlayer((prev) => {
        if (!prev) return prev;
        const itemIdsSet = new Set(itemIds);
        const newInv = prev.inventory.filter((i) => !itemIdsSet.has(i.id));
        addLog(`你批量丢弃了 ${itemIds.length} 件物品。`, 'normal');
        return { ...prev, inventory: newInv };
      });
    },
    [addLog, setPlayer]
  );

  /**
   * 从宗门宝库取出物品
   */
  const handleTakeTreasureVaultItem = useCallback(
    (item: Item) => {
      setPlayer((prev) => {
        if (!prev) return prev;
        const newInv = [...prev.inventory];
        const isEquipment = item.isEquippable || false;

        if (!isEquipment) {
          const existingIndex = newInv.findIndex(
            (i) =>
              i.name === item.name &&
              i.type === item.type &&
              i.rarity === item.rarity &&
              compareItemEffects(i.effect, item.effect, i.permanentEffect, item.permanentEffect)
          );

          if (existingIndex >= 0) {
            newInv[existingIndex].quantity += item.quantity;
          } else {
            newInv.push(item);
          }
        } else {
          newInv.push(item);
        }

        const currentVault = prev.sectTreasureVault || { items: [], takenItemIds: [] };
        const takenIdsSet = new Set(currentVault.takenItemIds || []);
        if (!takenIdsSet.has(item.id)) {
          takenIdsSet.add(item.id);
        }
        const newTakenIds = Array.from(takenIdsSet);

        addLog(`✨ 你从宗门宝库中获得了【${item.name}】！`, 'special');
        return {
          ...prev,
          inventory: newInv,
          sectTreasureVault: {
            ...currentVault,
            takenItemIds: newTakenIds,
          },
        };
      });
    },
    [addLog, setPlayer]
  );

  /**
   * 更新宗门宝库
   */
  const handleUpdateVault = useCallback(
    (vault: { items: Item[]; takenItemIds: string[] }) => {
      setPlayer((prev) => ({
        ...prev,
        sectTreasureVault: vault,
      }));
    },
    [setPlayer]
  );

  return {
    handleBatchDiscard,
    handleTakeTreasureVaultItem,
    handleUpdateVault,
  };
}

