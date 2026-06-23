/**
 * 交易行处理函数
 * 支持本地模式（单机）和 API 模式（联机）
 * API 模式：上架/购买通过服务端接口，确保库存一致性
 */

import type { PlayerStats, MarketItem, Item } from '../../types';
import { useGameStore, useUIStore } from '../../store';
import { createPlayerListing, restoreFromListing } from '../../services/auctionService';
import { addItemToInventory } from '../../utils/inventoryUtils';
import * as marketApi from '../../services/marketApiService';
import { useAuthStore } from '../../store/authStore';

interface UseTradeMarketHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  setIsTradeMarketOpen?: (open: boolean) => void;
}

export function useTradeMarketHandlers(
  props?: UseTradeMarketHandlersProps
) {
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);
  const storeSetModal = useUIStore((state) => state.setModal);
  const storeSetMarketItems = useUIStore((state) => state.setMarketItems);

  const player = props?.player ?? storePlayer;
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const setIsTradeMarketOpen = props?.setIsTradeMarketOpen ??
    ((open: boolean) => storeSetModal('isTradeMarketOpen', open));

  const getItems = () => useUIStore.getState().marketItems;
  const setItems = (items: MarketItem[]) => storeSetMarketItems(items);

  const isAuthenticated = () => !!useAuthStore.getState().token;

  /** 获取玩家自己的上架物品（本地） */
  const getPlayerListings = (): MarketItem[] => getItems().filter((i) => i.sellerId === 'player');

  /** 从服务端拉取在售商品 + 合并本地上架 */
  const refreshFromServer = async (): Promise<MarketItem[]> => {
    if (!isAuthenticated()) return [];

    try {
      // 拉取足够多的数据，确保客户端分页有内容可翻
      const res = await marketApi.fetchMarketItems(1, 100);
      const remoteItems: MarketItem[] = (res.items || []).map((i: any) => ({
        ...i,
        id: `market-${i.id}`,
        sellerId: 'system' as const,
        quantity: i.quantity || 1,
      }));
      const playerItems = getPlayerListings();
      return [...remoteItems, ...playerItems];
    } catch (e) {
      console.error('市场同步失败:', e);
      return [];
    }
  };

  /** 打开交易行：同步市场数据 */
  const handleOpenTradeMarket = async () => {
    if (!player) return;

    try {
      if (isAuthenticated()) {
        const merged = await refreshFromServer();
        setItems(merged);
      } else {
        // 未登录：清空市场（仅保留本地上架）
        setItems(getPlayerListings());
      }
    } catch {
      setItems(getPlayerListings());
      console.warn('交易行API不可用，请确认后端服务已启动');
    }
  };

  /** 刷新商品（消耗灵石） */
  const handleRefresh = async () => {
    if (!player) return;

    if (!isAuthenticated()) {
      addLog('未登录，无法刷新市场数据。', 'danger');
      return;
    }

    const refreshCost = Math.floor(500 + Math.max(0, player.spiritStones * 0.01));
    if (player.spiritStones < refreshCost) {
      addLog(`灵石不足！刷新需要 ${refreshCost} 灵石。`, 'danger');
      return;
    }

    setPlayer((prev) => {
      if (!prev) return prev;
      return { ...prev, spiritStones: prev.spiritStones - refreshCost };
    });

    // 刷新时重置到第一页
    const merged = await refreshFromServer();
    setItems(merged);
    addLog(`你花费 ${refreshCost} 灵石刷新了交易行。`, 'gain');
  };

  /** 购买物品（先查库存再确认） */
  const handlePurchase = async (itemId: string) => {
    if (!player) return;

    const items = getItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      addLog('该商品不存在或已被买走。', 'danger');
      return;
    }

    if (item.sellerId === 'player') {
      addLog('不能购买自己上架的物品。', 'danger');
      return;
    }

    if (player.spiritStones < item.price) {
      addLog(`灵石不足！需要 ${item.price} 灵石。`, 'danger');
      return;
    }

    // API 模式：先查库存
    if (isAuthenticated()) {
      const check = await marketApi.checkPurchase(itemId);
      if (!check.success) {
        addLog(check.error || '商品已售出', 'danger');
        setItems(items.filter((i) => i.id !== itemId));
        return;
      }
    }

    // 扣灵石 + 给物品（本地即时）
    // 保存扣费前的快照，用于 confirm 失败时回滚
    let rollbackSnapshot: PlayerStats | null = null;
    setPlayer((prev) => {
      if (!prev) return prev;
      rollbackSnapshot = prev;
      return {
        ...prev,
        spiritStones: prev.spiritStones - item.price,
        inventory: addItemToInventory(
          prev.inventory,
          {
            name: item.name, type: item.type, description: item.description,
            rarity: item.rarity, isEquippable: item.isEquippable,
            equipmentSlot: item.equipmentSlot, effect: item.effect,
          },
          item.quantity || 1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        ),
      };
    });

    // 从列表移除
    setItems(items.filter((i) => i.id !== itemId));

    // API 模式：确认购买
    if (isAuthenticated()) {
      const confirm = await marketApi.confirmPurchase(itemId);
      if (!confirm.success) {
        // 回滚：恢复灵石和背包
        if (rollbackSnapshot) {
          setPlayer(rollbackSnapshot);
        }
        addLog(`购买失败：${confirm.error || '商品已被他人买走'}，灵石已退回。`, 'danger');
        // 将物品重新加回列表（可能被其他人上架）
        setItems(items);
        return;
      }
    }

    addLog(`你以 ${item.price} 灵石购得了【${item.name}】！`, 'special');
  };

  /** 玩家上架自己的物品 */
  const handleListItem = async (itemId: string, price: number) => {
    if (!player || price <= 0) return;

    const inventory = player.inventory;
    const sourceItem = inventory.find((i) => i.id === itemId);
    if (!sourceItem) { addLog('背包中找不到该物品。', 'danger'); return; }
    if (sourceItem.locked) { addLog(`🔒 【${sourceItem.name}】已锁定，无法上架。`, 'danger'); return; }

    const isEquipped = Object.values(player.equippedItems).includes(sourceItem.id);
    if (isEquipped) { addLog('已装备的物品无法上架！', 'danger'); return; }

    const listing = createPlayerListing(sourceItem, price);

    // API 模式：调用上架接口
    if (isAuthenticated()) {
      const data = {
        itemName: sourceItem.name,
        itemType: sourceItem.type,
        description: sourceItem.description || '',
        rarity: sourceItem.rarity || '普通',
        price,
        quantity: sourceItem.quantity || 1,
        effect: sourceItem.effect as Record<string, number> | undefined,
        isEquippable: sourceItem.isEquippable,
        equipmentSlot: sourceItem.equipmentSlot as string | undefined,
        itemSourceJson: JSON.stringify(sourceItem),
      };
      const res = await marketApi.listItem(data);
      if (!res.success) {
        addLog(res.error || '上架失败，请重试。', 'danger');
        return;
      }
      // 使用服务端返回的 ID
      listing.id = `market-${res.listingId}`;
    }

    // 从背包移除（本地即时）
    setPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: prev.inventory
          .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - listing.quantity } : i))
          .filter((i) => i.quantity > 0),
      };
    });

    // 添加到交易行
    setItems([...getItems(), listing]);
    addLog(`你成功将【${sourceItem.name}】上架，售价 ${price} 灵石。`, 'gain');
  };

  /** 玩家下架自己的物品 */
  const handleCancelListing = async (marketItemId: string) => {
    const items = getItems();
    const listing = items.find((i) => i.id === marketItemId && i.sellerId === 'player');
    if (!listing) { addLog('找不到该上架记录。', 'danger'); return; }

    // API 模式：调用下架接口
    if (isAuthenticated()) {
      const res = await marketApi.cancelListing(marketItemId);
      if (!res.success) {
        addLog(res.error || '下架失败，请重试。', 'danger');
        return;
      }
    }

    const restored = restoreFromListing(listing);

    setPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: addItemToInventory(prev.inventory, restored, restored.quantity || 1, {
          realm: prev.realm, realmLevel: prev.realmLevel,
        }),
      };
    });

    setItems(items.filter((i) => i.id !== marketItemId));
    addLog(`已将【${listing.name}】从交易行下架，放回背包。`, 'normal');
  };

  /** 免费同步市场数据（购买tab切换时自动调用） */
  const handleSyncMarket = async () => {
    if (!player || !isAuthenticated()) return;
    try {
      const merged = await refreshFromServer();
      setItems(merged);
    } catch {}
  };

  return {
    handleOpenTradeMarket,
    handlePurchase,
    handleRefresh,
    handleSyncMarket,
    handleListItem,
    handleCancelListing,
    getPlayerListings,
  };
}
