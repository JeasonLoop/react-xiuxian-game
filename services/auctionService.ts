/**
 * 交易行服务
 * 玩家/NPC上架物品 → 玩家购买 → 物品下架
 */

import type { PlayerStats, MarketItem, Item } from '../types';
import { REALM_ORDER } from '../constants/realms';
import {
  MARKET_ITEM_POOL,
  MARKET_ITEMS_PER_BATCH,
  MARKET_REALM_PRICE_MULTIPLIERS,
  getRandomSellerName,
} from '../constants/auctionHouse';
import { uid } from '../utils/gameUtils';

/** 根据玩家境界生成一批系统(NPC)上架物品 */
export function generateMarketItems(player: PlayerStats): MarketItem[] {
  const realmIndex = Math.max(0, REALM_ORDER.indexOf(player.realm));
  const priceMultiplier = MARKET_REALM_PRICE_MULTIPLIERS[Math.min(realmIndex, MARKET_REALM_PRICE_MULTIPLIERS.length - 1)];

  const available = MARKET_ITEM_POOL.filter((t) => (t.minRealmIndex ?? 0) <= realmIndex);
  if (available.length === 0) {
    return MARKET_ITEM_POOL.slice(0, MARKET_ITEMS_PER_BATCH).map((t) => templateToMarketItem(t, priceMultiplier));
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, MARKET_ITEMS_PER_BATCH).map((t) => templateToMarketItem(t, priceMultiplier));
}

function templateToMarketItem(
  template: typeof MARKET_ITEM_POOL[number],
  priceMultiplier: number
): MarketItem {
  const price = Math.floor(template.price * priceMultiplier);
  const finalPrice = Math.max(1, Math.floor(price * (0.9 + Math.random() * 0.2)));
  return {
    id: `market-${uid()}`,
    name: template.name,
    type: template.type,
    description: template.description,
    rarity: template.rarity,
    price: finalPrice,
    effect: template.effect ? { ...template.effect } : undefined,
    isEquippable: template.isEquippable,
    equipmentSlot: template.equipmentSlot,
    quantity: 1,
    sellerName: getRandomSellerName(),
    sellerId: 'system',
  };
}

/** 玩家上架自己的物品 → 创建 MarketItem */
export function createPlayerListing(
  item: Item,
  price: number,
  quantity: number = item.quantity || 1
): MarketItem {
  const listingQuantity = Math.max(1, Math.min(Math.floor(quantity), item.quantity || 1));
  const listingItemData = {
    ...item,
    quantity: listingQuantity,
  };

  return {
    id: `market-${uid()}`,
    name: item.name,
    type: item.type,
    description: item.description,
    rarity: item.rarity || '普通',
    price,
    effect: item.effect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
    quantity: listingQuantity,
    sellerName: '我',
    sellerId: 'player',
    sourceItemId: item.id,
    sellerItemData: JSON.stringify(listingItemData), // 存完整数据用于精准还原
  };
}

/** 从交易行下架 → 还原为背包物品 */
export function restoreFromListing(marketItem: MarketItem): Item {
  // 优先使用完整数据还原
  if (marketItem.sellerItemData) {
    try {
      const restored = JSON.parse(marketItem.sellerItemData);
      return {
        ...restored,
        quantity: marketItem.quantity || restored.quantity || 1,
      };
    } catch {}
  }

  // 降级：用字段还原
  return {
    id: marketItem.sourceItemId || `restored-${uid()}`,
    name: marketItem.name,
    type: marketItem.type,
    description: marketItem.description,
    rarity: marketItem.rarity,
    quantity: marketItem.quantity || 1,
    isEquippable: marketItem.isEquippable,
    equipmentSlot: marketItem.equipmentSlot,
    effect: marketItem.effect as Item['effect'],
  };
}

/** 检查购买可行性 */
export function processPurchase(
  item: MarketItem,
  player: PlayerStats
): { success: boolean; message: string } {
  if (item.sellerId === 'player') {
    return { success: false, message: '不能购买自己上架的物品。' };
  }
  if (player.spiritStones < item.price) {
    return { success: false, message: `灵石不足！需要 ${item.price} 灵石。` };
  }
  return { success: true, message: '' };
}
