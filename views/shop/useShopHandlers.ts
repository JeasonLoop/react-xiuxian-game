import React from 'react';
import { PlayerStats, ShopType, ShopItem, Item, Shop } from '../../types';
import { SHOPS, REALM_ORDER } from '../../constants';
import { uid } from '../../utils/gameUtils';
import { calculateItemSellPrice } from '../../utils/itemUtils';

interface UseShopHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
  setIsShopOpen: (open: boolean) => void;
  setPurchaseSuccess: (
    success: { item: string; quantity: number } | null
  ) => void;
}

/**
 * 商店处理函数
 * 包含打开商店、购买物品、出售物品
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param currentShop 当前商店
 * @param setCurrentShop 设置当前商店
 * @param setIsShopOpen 设置商店是否打开
 * @param setPurchaseSuccess 设置购买成功
 * @returns handleOpenShop 打开商店
 * @returns handleBuyItem 购买物品
 * @returns handleSellItem 出售物品
 */

export function useShopHandlers({
  setPlayer,
  addLog,
  currentShop,
  setCurrentShop,
  setIsShopOpen,
  setPurchaseSuccess,
}: UseShopHandlersProps) {
  const handleOpenShop = (shopType: ShopType) => {
    const shop = SHOPS.find((s) => s.type === shopType);
    if (shop) {
      setCurrentShop(shop);
      setIsShopOpen(true);
      addLog(`你来到了【${shop.name}】。`, 'normal');
    }
  };

  const handleBuyItem = (shopItem: ShopItem, quantity: number = 1) => {
    setPlayer((prev) => {
      const totalPrice = shopItem.price * quantity;
      if (prev.spiritStones < totalPrice) {
        addLog('灵石不足！', 'danger');
        return prev;
      }

      // 检查境界要求
      if (shopItem.minRealm) {
        const itemRealmIndex = REALM_ORDER.indexOf(shopItem.minRealm);
        const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
        if (playerRealmIndex < itemRealmIndex) {
          addLog(`境界不足！需要 ${shopItem.minRealm} 才能购买。`, 'danger');
          return prev;
        }
      }

      const newInv = [...prev.inventory];
      const isEquipment = shopItem.isEquippable && shopItem.equipmentSlot;
      const existingIdx = newInv.findIndex((i) => i.name === shopItem.name);

      if (existingIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          quantity: newInv[existingIdx].quantity + quantity,
        };
      } else {
        // 装备类物品或新物品，每个装备单独占一格
        // 如果是装备，每次购买创建一个新物品（quantity=1）
        // 如果是非装备，创建或叠加
        const itemsToAdd = isEquipment ? quantity : 1; // 装备每次购买都创建新物品
        const addQuantity = isEquipment ? 1 : quantity; // 装备quantity始终为1

        for (let i = 0; i < itemsToAdd; i++) {
          const newItem: Item = {
            id: uid(),
            name: shopItem.name,
            type: shopItem.type,
            description: shopItem.description,
            quantity: addQuantity,
            rarity: shopItem.rarity,
            level: 0,
            isEquippable: shopItem.isEquippable,
            equipmentSlot: shopItem.equipmentSlot,
            effect: shopItem.effect,
          };
          newInv.push(newItem);
        }
      }

      addLog(
        `你花费 ${totalPrice} 灵石购买了 ${shopItem.name} x${quantity}。`,
        'gain'
      );
      // 显示购买成功弹窗
      setPurchaseSuccess({ item: shopItem.name, quantity });
      setTimeout(() => setPurchaseSuccess(null), 2000);

      return {
        ...prev,
        spiritStones: prev.spiritStones - totalPrice,
        inventory: newInv,
      };
    });
  };

  const handleSellItem = (item: Item) => {
    if (!currentShop) return;

    setPlayer((prev) => {
      // 检查是否已装备
      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        addLog('无法出售已装备的物品！请先卸下。', 'danger');
        return prev;
      }

      // 找到对应的商店物品来计算出售价格
      const shopItem = currentShop.items.find((si) => si.name === item.name);
      const sellPrice = shopItem?.sellPrice || calculateItemSellPrice(item);

      const newInv = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      addLog(`你出售了 ${item.name}，获得 ${sellPrice} 灵石。`, 'gain');
      return {
        ...prev,
        spiritStones: prev.spiritStones + sellPrice,
        inventory: newInv,
      };
    });
  };

  return {
    handleOpenShop,
    handleBuyItem,
    handleSellItem,
  };
}
