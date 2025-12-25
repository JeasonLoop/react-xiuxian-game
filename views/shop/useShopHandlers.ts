import React from 'react';
import { PlayerStats, ShopType, ShopItem, Item, Shop } from '../../types';
import { SHOPS, REALM_ORDER, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../../constants';
import { uid } from '../../utils/gameUtils';
import { calculateItemSellPrice } from '../../utils/itemUtils';
import { generateShopItems } from '../../services/shopService';

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
  player,
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
      // 对于动态商店（黑市、限时商店、声望商店），需要生成物品
      const dynamicShopTypes = [
        ShopType.BlackMarket,
        ShopType.LimitedTime,
        ShopType.Reputation,
      ];

      if (dynamicShopTypes.includes(shopType)) {
        // 生成商店物品
        const generatedItems = generateShopItems(shopType, player.realm, false);
        const shopWithItems: Shop = {
          ...shop,
          items: generatedItems,
        };
        setCurrentShop(shopWithItems);
      } else {
        // 普通商店直接使用预定义的物品
        setCurrentShop(shop);
      }

      setIsShopOpen(true);
      addLog(`你来到了【${shop.name}】。`, 'normal');
    }
  };

  const handleBuyItem = (shopItem: ShopItem, quantity: number = 1) => {
    setPlayer((prev) => {
      // 检查声望要求（声望商店）
      if (currentShop?.reputationRequired && (prev.reputation || 0) < currentShop.reputationRequired) {
        addLog(`声望不足！需要 ${currentShop.reputationRequired} 声望值才能购买。`, 'danger');
        return prev;
      }

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

      // 检查是否是进阶物品
      if (shopItem.isAdvancedItem && shopItem.advancedItemType) {
        // 进阶物品：从常量池随机选择，直接设置到玩家状态
        let selectedItem: { id: string; name: string } | null = null;
        let newFoundationTreasure = prev.foundationTreasure;
        let newHeavenEarthEssence = prev.heavenEarthEssence;
        let newHeavenEarthMarrow = prev.heavenEarthMarrow;
        let newLongevityRules = [...(prev.longevityRules || [])];
        let marrowRefiningProgress = prev.marrowRefiningProgress;
        let marrowRefiningSpeed = prev.marrowRefiningSpeed;

        if (shopItem.advancedItemType === 'foundationTreasure') {
          if (!prev.foundationTreasure) {
            const treasures = Object.values(FOUNDATION_TREASURES);
            const availableTreasures = treasures.filter(t =>
              !t.requiredLevel || prev.realmLevel >= t.requiredLevel
            );
            if (availableTreasures.length > 0) {
              const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
              selectedItem = { id: selected.id, name: selected.name };
              newFoundationTreasure = selected.id;
            } else {
              addLog('没有可用的筑基奇物！', 'danger');
              return prev;
            }
          } else {
            addLog('你已经拥有筑基奇物，无法重复购买！', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'heavenEarthEssence') {
          if (!prev.heavenEarthEssence) {
            const essences = Object.values(HEAVEN_EARTH_ESSENCES);
            if (essences.length > 0) {
              const selected = essences[Math.floor(Math.random() * essences.length)];
              selectedItem = { id: selected.id, name: selected.name };
              newHeavenEarthEssence = selected.id;
            } else {
              addLog('没有可用的天地精华！', 'danger');
              return prev;
            }
          } else {
            addLog('你已经拥有天地精华，无法重复购买！', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'heavenEarthMarrow') {
          if (!prev.heavenEarthMarrow) {
            const marrows = Object.values(HEAVEN_EARTH_MARROWS);
            if (marrows.length > 0) {
              const selected = marrows[Math.floor(Math.random() * marrows.length)];
              selectedItem = { id: selected.id, name: selected.name };
              newHeavenEarthMarrow = selected.id;
              marrowRefiningProgress = 0;
              marrowRefiningSpeed = 1.0;
            } else {
              addLog('没有可用的天地之髓！', 'danger');
              return prev;
            }
          } else {
            addLog('你已经拥有天地之髓，无法重复购买！', 'danger');
            return prev;
          }
        } else if (shopItem.advancedItemType === 'longevityRule') {
          const maxRules = prev.maxLongevityRules || 3;
          if ((prev.longevityRules || []).length < maxRules) {
            const rules = Object.values(LONGEVITY_RULES);
            const currentRules = prev.longevityRules || [];
            const availableRules = rules.filter(r => !currentRules.includes(r.id));
            if (availableRules.length > 0) {
              const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
              selectedItem = { id: selected.id, name: selected.name };
              newLongevityRules.push(selected.id);
            } else {
              addLog('你已经拥有所有可用的规则之力！', 'danger');
              return prev;
            }
          } else {
            addLog('你已经拥有最大数量的规则之力，无法继续购买！', 'danger');
            return prev;
          }
        }

        if (selectedItem) {
          addLog(
            `✨ 你花费 ${totalPrice} 灵石购买了【${selectedItem.name}】！这是突破的关键物品！`,
            'special'
          );
          setPurchaseSuccess({ item: selectedItem.name, quantity: 1 });
          setTimeout(() => setPurchaseSuccess(null), 2000);

          return {
            ...prev,
            spiritStones: prev.spiritStones - totalPrice,
            foundationTreasure: newFoundationTreasure,
            heavenEarthEssence: newHeavenEarthEssence,
            heavenEarthMarrow: newHeavenEarthMarrow,
            longevityRules: newLongevityRules,
            marrowRefiningProgress,
            marrowRefiningSpeed,
          };
        }
      }

      // 普通物品：放入背包
      const newInv = [...prev.inventory];
      const isEquipment = shopItem.isEquippable && shopItem.equipmentSlot;
      const existingIdx = newInv.findIndex((i) => i.name === shopItem.name);

      if (existingIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        // 确保叠加时保留所有属性（包括permanentEffect）
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          ...shopItem,
          id: newInv[existingIdx].id, // 保留原有ID
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
            permanentEffect: shopItem.permanentEffect,
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

  const handleSellItem = (item: Item, quantity?: number) => {
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

      // 确保 sellPrice 是有效数字
      const validSellPrice = isNaN(sellPrice) || sellPrice <= 0 ? 1 : sellPrice;

      // 确定要出售的数量（默认为1，但不超过物品的实际数量）
      const sellQuantity = quantity !== undefined
        ? Math.min(quantity, item.quantity || 1)
        : 1;

      if (sellQuantity <= 0) return prev;

      const totalPrice = validSellPrice * sellQuantity;

      // 确保 totalPrice 是有效数字
      if (isNaN(totalPrice) || totalPrice <= 0) {
        addLog('出售价格计算错误，请重试。', 'danger');
        return prev;
      }

      const newInv = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            return { ...i, quantity: i.quantity - sellQuantity };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      if (sellQuantity === 1) {
        addLog(`你出售了 ${item.name}，获得 ${validSellPrice} 灵石。`, 'gain');
      } else {
        addLog(`你出售了 ${item.name} x${sellQuantity}，获得 ${totalPrice} 灵石。`, 'gain');
      }

      // 确保 spiritStones 是有效数字，防止 NaN
      const currentSpiritStones = prev.spiritStones || 0;
      const newSpiritStones = currentSpiritStones + totalPrice;

      // 再次检查，确保结果不是 NaN
      if (isNaN(newSpiritStones)) {
        addLog('灵石数量计算错误，请重试。', 'danger');
        return prev;
      }

      return {
        ...prev,
        spiritStones: newSpiritStones,
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
