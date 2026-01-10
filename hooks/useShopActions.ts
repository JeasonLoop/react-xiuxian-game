/**
 * Shop Actions Hook
 * 处理商店相关的操作，从 useAppHandlers 中提取
 */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, Shop, ShopItem } from '../types';

interface UseShopActionsProps {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
}

/**
 * 商店操作 Hook
 */
export function useShopActions({
  player,
  setPlayer,
  addLog,
  currentShop,
  setCurrentShop,
}: UseShopActionsProps) {
  /**
   * 刷新商店
   */
  const handleRefreshShop = useCallback(
    (newItems: ShopItem[]) => {
      if (!currentShop || !player) return;
      const refreshCost = currentShop.refreshCost || 100;
      if (player.spiritStones < refreshCost) {
        addLog(`灵石不足，无法刷新商店。需要${refreshCost}灵石。`, 'danger');
        return;
      }
      setCurrentShop({
        ...currentShop,
        items: newItems,
      });
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          spiritStones: prev.spiritStones - refreshCost,
        };
      });
      addLog('商店物品已刷新！', 'special');
    },
    [currentShop, player, addLog, setCurrentShop, setPlayer]
  );

  return {
    handleRefreshShop,
  };
}

