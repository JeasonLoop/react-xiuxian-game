/**
 * 交易行处理函数
 * 支持本地模式（单机）和 API 模式（联机）
 * API 模式：上架/购买通过服务端接口，确保库存一致性
 */

import type { PlayerStats, MarketItem } from '../../types';
import { useGameStore, useUIStore } from '../../store';
import { useAuthStore } from '../../store/authStore';
import { createPlayerListing, restoreFromListing } from '../../services/auctionService';
import { addItemToInventory } from '../../utils/inventoryUtils';
import * as marketApi from '../../services/marketApiService';
import { cloudSaveService } from '../../services/cloudSaveService';

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
      const currentUserId = useAuthStore.getState().user?.id;
      const remoteItems: MarketItem[] = (res.items || []).map((i: any) => {
        const isOwner =
          currentUserId != null &&
          (Number(i.sellerId) === Number(currentUserId) || i.sellerId === 'player');
        return {
          ...i,
          id: String(i.id).startsWith('market-') ? i.id : `market-${i.id}`,
          sellerId: isOwner ? ('player' as const) : ('system' as const),
          quantity: i.quantity || 1,
        };
      });
      // 仅保留未在服务端出现的本地挂单，避免在线时重复显示
      const playerItems = getPlayerListings().filter(
        (localItem) => !remoteItems.some((r) => r.id === localItem.id)
      );
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
        // 顺带结算出售收益
        claimPayouts();
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

  /** 购买物品：联机先服务端确认再对齐本地，避免双扣/双发 */
  const applyPurchasedItem = (target: PlayerStats, marketItem: MarketItem): PlayerStats => ({
    ...target,
    spiritStones: Math.max(0, (Number(target.spiritStones) || 0) - marketItem.price),
    inventory: addItemToInventory(
      target.inventory,
      {
        name: marketItem.name, type: marketItem.type, description: marketItem.description,
        rarity: marketItem.rarity, isEquippable: marketItem.isEquippable,
        equipmentSlot: marketItem.equipmentSlot, effect: marketItem.effect,
        advancedItemType: marketItem.advancedItemType,
        advancedItemId: marketItem.advancedItemId,
      },
      marketItem.quantity || 1,
      { realm: target.realm, realmLevel: target.realmLevel }
    ),
  });

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

    if (isAuthenticated()) {
      try {
        const latest = useGameStore.getState();
        if (latest.player) {
          await cloudSaveService.pushSave({
            player: latest.player,
            logs: latest.logs,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.warn('购买前同步云存档失败:', e);
      }

      const check = await marketApi.checkPurchase(itemId);
      if (!check.success) {
        addLog(check.error || '商品已售出', 'danger');
        setItems(items.filter((i) => i.id !== itemId));
        return;
      }

      const confirm = await marketApi.confirmPurchase(itemId);
      if (!confirm.success) {
        addLog(`购买失败：${confirm.error || '商品已被他人买走'}`, 'danger');
        return;
      }

      setPlayer((prev) => (prev ? applyPurchasedItem(prev, item) : prev));
      setItems(items.filter((i) => i.id !== itemId));
      addLog(`你以 ${item.price} 灵石购得了【${item.name}】！`, 'special');
      try {
        const latest = useGameStore.getState();
        if (latest.player) {
          await cloudSaveService.pushSave({
            player: latest.player,
            logs: latest.logs,
            timestamp: Date.now(),
          });
        }
      } catch {
        // 本地已入账，下次自动云存会补齐
      }
      return;
    }

    setPlayer((prev) => (prev ? applyPurchasedItem(prev, item) : prev));
    setItems(items.filter((i) => i.id !== itemId));
    addLog(`你以 ${item.price} 灵石购得了【${item.name}】！`, 'special');
  };

  /** 玩家上架自己的物品 */
  const handleListItem = async (itemId: string, price: number, quantity: number = 1) => {
    if (!player || price <= 0) return;

    const inventory = player.inventory;
    const sourceItem = inventory.find((i) => i.id === itemId);
    if (!sourceItem) { addLog('背包中找不到该物品。', 'danger'); return; }
    if (sourceItem.locked) { addLog(`【${sourceItem.name}】已锁定，无法上架。`, 'danger'); return; }
    const listingQuantity = Math.floor(Number(quantity) || 0);
    if (listingQuantity < 1 || listingQuantity > (sourceItem.quantity || 1)) {
      addLog(`上架数量需在 1-${sourceItem.quantity || 1} 之间。`, 'danger');
      return;
    }

    const isEquipped = Object.values(player.equippedItems).includes(sourceItem.id);
    if (isEquipped) { addLog('已装备的物品无法上架！', 'danger'); return; }

    const listing = createPlayerListing(sourceItem, price, listingQuantity);

    // API 模式：调用上架接口
    if (isAuthenticated()) {
      const data = {
        itemName: sourceItem.name,
        itemType: sourceItem.type,
        description: sourceItem.description || '',
        rarity: sourceItem.rarity || '普通',
        price,
        quantity: listingQuantity,
        effect: sourceItem.effect as Record<string, number> | undefined,
        isEquippable: sourceItem.isEquippable,
        equipmentSlot: sourceItem.equipmentSlot as string | undefined,
        advancedItemType: sourceItem.advancedItemType,
        advancedItemId: sourceItem.advancedItemId,
        itemSourceJson: JSON.stringify({ ...sourceItem, quantity: listingQuantity }),
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
          .map((i) => (i.id === itemId ? { ...i, quantity: (i.quantity || 1) - listingQuantity } : i))
          .filter((i) => i.quantity > 0),
      };
    });

    // 添加到交易行
    setItems([...getItems(), listing]);
    addLog(`你成功将【${sourceItem.name}】x${listingQuantity} 上架，售价 ${price} 灵石。`, 'gain');
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
      // 顺带结算出售收益
      claimPayouts();
    } catch (err) {
      console.warn('同步市场数据失败:', err);
    }
  };

  /** 领取交易行出售收益（服务端结算的卖家灵石） */
  const claimPayouts = async () => {
    if (!isAuthenticated()) return;
    try {
      const pending = await marketApi.fetchMarketPayouts();
      if (!pending.total) return;
      const claim = await marketApi.claimMarketPayouts();
      if (claim.success && (claim.amount || 0) > 0) {
        const amount = claim.amount || 0;
        setPlayer((prev) =>
          prev ? { ...prev, spiritStones: (Number(prev.spiritStones) || 0) + amount } : prev
        );
        addLog(`你在交易行出售的物品已结算，获得 ${amount} 灵石。`, 'gain');
      }
    } catch {
      // 收益查询失败不影响主流程
    }
  };

  return {
    handleOpenTradeMarket,
    handlePurchase,
    handleRefresh,
    handleSyncMarket,
    handleListItem,
    handleCancelListing,
    getPlayerListings,
    claimPayouts,
    setIsTradeMarketOpen,
  };
}
