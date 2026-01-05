import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import {
  ShoppingBag,
  Coins,
  Package,
  Filter,
  Trash,
  RefreshCw,
  Box,
} from 'lucide-react';
import {
  Shop,
  ShopItem,
  Item,
  PlayerStats,
  ItemRarity,
  ItemType,
} from '../types';
import { REALM_ORDER, RARITY_MULTIPLIERS } from '../constants/index';
import { generateShopItems } from '../services/shopService';
import { showError, showConfirm } from '../utils/toastUtils';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { calculateItemSellPrice, normalizeTypeLabel } from '../utils/itemUtils';
import { formatNumber } from '../utils/formatUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  player: PlayerStats;
  onBuyItem: (shopItem: ShopItem, quantity?: number) => void;
  onSellItem: (item: Item, quantity?: number) => void;
  onRefreshShop?: (newItems: ShopItem[]) => void;
  onOpenInventory?: () => void;
}

type ItemTypeFilter = 'all' | ItemType;

const ShopModal: React.FC<Props> = ({
  isOpen,
  onClose,
  shop,
  player,
  onBuyItem,
  onSellItem,
  onRefreshShop,
  onOpenInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>(
    {}
  );
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<ItemTypeFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedRarity, setSelectedRarity] = useState<'all' | ItemRarity>(
    'all'
  );

  if (!isOpen) return null;

  const canBuyItem = (shopItem: ShopItem): boolean => {
    // 检查声望要求（声望商店）
    if (shop.reputationRequired && (player.reputation || 0) < shop.reputationRequired) {
      return false;
    }
    if (player.spiritStones < shopItem.price) return false;
    if (shopItem.minRealm) {
      const itemRealmIndex = REALM_ORDER.indexOf(shopItem.minRealm);
      const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
      return playerRealmIndex >= itemRealmIndex;
    }
    return true;
  };

  const getShopTypeColor = (type: string) => {
    switch (type) {
      case '村庄':
        return 'text-green-400';
      case '城市':
        return 'text-blue-400';
      case '仙门':
        return 'text-purple-400';
      default:
        return 'text-stone-400';
    }
  };

  // 过滤物品（根据类型，但不根据境界过滤，让所有物品都显示）
  // 声望商店应该显示所有物品，即使当前境界无法购买
  const availableItems = useMemo(() => {
    let filtered = shop.items;

    // 按类型筛选
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedTypeFilter);
    }

    return filtered;
  }, [shop.items, selectedTypeFilter]);

  // 可出售的物品（排除已装备的，并根据类型和品质筛选）
  const sellableItems = useMemo(() => {
    if (!Array.isArray(player.inventory)) return [];
    let filtered = player.inventory.filter((item) => {
      // 不能出售已装备的物品
      const isEquipped = Object.values(player.equippedItems).includes(item.id);
      if (isEquipped) return false;

      // 按类型筛选
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }

      // 按品质筛选
      if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [
    player.inventory,
    player.equippedItems,
    selectedTypeFilter,
    selectedRarity,
  ]);

  // 获取所有可用的物品类型（用于筛选器，基于未筛选的原始数据）
  const availableTypes = useMemo(() => {
    if (activeTab === 'buy') {
      const types = new Set<ItemType>();
      // 使用原始商店物品列表，不根据境界过滤（显示所有物品类型）
      shop.items.forEach((item) => types.add(item.type));
      return Array.from(types);
    } else {
      const types = new Set<ItemType>();
      // 使用原始库存列表，只排除已装备的物品
      player.inventory
        .filter((item) => {
          const isEquipped = Object.values(player.equippedItems).includes(
            item.id
          );
          return !isEquipped;
        })
        .forEach((item) => types.add(item.type));
      return Array.from(types);
    }
  }, [
    activeTab,
    shop.items,
    player.inventory,
    player.equippedItems,
  ]);

  // 当切换标签页时，如果当前筛选的类型在新标签页中不存在，则重置为'all'
  useEffect(() => {
    if (
      selectedTypeFilter !== 'all' &&
      !availableTypes.includes(selectedTypeFilter as ItemType)
    ) {
      setSelectedTypeFilter('all');
    }
    // 切换标签页时清空选择
    setSelectedItems(new Set());
  }, [activeTab, availableTypes, selectedTypeFilter]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === sellableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sellableItems.map((item) => item.id)));
    }
  };

  const handleBatchSell = () => {
    if (selectedItems.size === 0) return;
    const itemsToSell = sellableItems.filter((item) =>
      selectedItems.has(item.id)
    );
    let totalPrice = 0;
    itemsToSell.forEach((item) => {
      const shopItem = shop.items.find((si) => si.name === item.name);
      const sellPrice = shopItem?.sellPrice || calculateItemSellPrice(item);
      // 确保 sellPrice 和 quantity 都是有效数字
      const validSellPrice = isNaN(sellPrice) || sellPrice <= 0 ? 1 : sellPrice;
      const validQuantity = item.quantity || 1;
      const itemPrice = validSellPrice * validQuantity;
      // 确保不是 NaN 才累加
      if (!isNaN(itemPrice)) {
        totalPrice += itemPrice;
      }
    });

    // 确保 totalPrice 是有效数字
    if (isNaN(totalPrice) || totalPrice <= 0) {
      showConfirm('出售价格计算错误，请重试。', '错误', () => {});
      return;
    }

    showConfirm(
      `确定要出售选中的 ${selectedItems.size} 件物品吗？将获得 ${totalPrice} 灵石。`,
      '确认出售',
      () => {
        itemsToSell.forEach((item) => {
          // 出售该物品的全部数量
          onSellItem(item, item.quantity);
        });
        setSelectedItems(new Set());
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <ShoppingBag size={18} className="md:w-5 md:h-5" />
            {shop.name}
          </h3>
          <p className="text-xs text-stone-400 font-normal mt-0.5">{shop.description}</p>
          {shop.reputationRequired && (
            <p className="text-[10px] text-yellow-400 mt-0.5">
              需要声望：{shop.reputationRequired}（当前：{player.reputation || 0}）
              {player.reputation < shop.reputationRequired && (
                <span className="text-red-400 ml-1">⚠️ 不足</span>
              )}
            </p>
          )}
        </div>
      }
      size="4xl"
      height="full"
      containerClassName="bg-paper-800 border-stone-600"
      headerClassName="bg-ink-800 border-b border-stone-600"
      contentClassName="bg-paper-800"
      titleExtra={
        <div className="flex items-center gap-1.5 md:gap-2 mr-2">
          {onOpenInventory && (
            <button
              onClick={onOpenInventory}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors text-xs md:text-sm"
              title="查看背包"
            >
              <Box size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">背包</span>
            </button>
          )}
          {onRefreshShop && (
            <button
              onClick={() => {
                const refreshCost = shop.refreshCost || 100;
                if (player.spiritStones < refreshCost) {
                  showError(`灵石不足！刷新需要${refreshCost}灵石。`);
                  return;
                }
                showConfirm(
                  `确定要花费 ${refreshCost} 灵石刷新商店物品吗？`,
                  '确认刷新',
                  () => {
                    const newItems = generateShopItems(
                      shop.type,
                      player.realm,
                      true
                    );
                    onRefreshShop(newItems);
                  }
                );
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors text-xs md:text-sm"
              title={`花费${shop.refreshCost || 100}灵石刷新`}
            >
              <RefreshCw size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">刷新</span>
              <span className="text-[10px] text-stone-400">({shop.refreshCost || 100})</span>
            </button>
          )}
        </div>
      }
      subHeader={
        <div className="flex border-b border-stone-600 bg-stone-900">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'buy'
                ? 'bg-ink-800 text-mystic-gold border-b-2 border-mystic-gold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            购买
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === 'sell'
                ? 'bg-ink-800 text-mystic-gold border-b-2 border-mystic-gold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            出售
          </button>
        </div>
      }
    >
          {activeTab === 'buy' ? (
            <div>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">
                    当前灵石:{' '}
                    <span className="text-mystic-gold font-bold">
                      {player.spiritStones}
                    </span>
                  </span>
                  <span className={`text-sm ${getShopTypeColor(shop.type)}`}>
                    {shop.type}
                  </span>
                </div>
                {/* 物品分类筛选器 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-stone-400 text-sm">
                    <Filter size={16} />
                    <span>分类:</span>
                  </div>
                  <button
                    onClick={() => setSelectedTypeFilter('all')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTypeFilter === 'all'
                        ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                    }`}
                  >
                    全部
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedTypeFilter(type)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        selectedTypeFilter === type
                          ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableItems.length === 0 ? (
                  <div className="col-span-full text-center text-stone-500 py-10">
                    当前境界无法购买任何物品
                  </div>
                ) : (
                  availableItems.map((shopItem) => {
                    const canBuy = canBuyItem(shopItem);
                    return (
                      <div
                        key={shopItem.id}
                        className={`bg-stone-900 rounded-lg p-4 border-2 ${
                          canBuy
                            ? getRarityBorder(shopItem.rarity)
                            : 'border-stone-700 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4
                              className={`font-bold ${getRarityTextColor(shopItem.rarity)}`}
                            >
                              {shopItem.name}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {normalizeTypeLabel(shopItem.type, shopItem)}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getRarityBorder(shopItem.rarity)} ${getRarityTextColor(shopItem.rarity)}`}
                          >
                            {shopItem.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3">
                          {shopItem.description}
                        </p>
                        {shopItem.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {shopItem.effect.attack && (
                              <div>攻击 +{formatNumber(shopItem.effect.attack)}</div>
                            )}
                            {shopItem.effect.defense && (
                              <div>防御 +{formatNumber(shopItem.effect.defense)}</div>
                            )}
                            {shopItem.effect.hp && (
                              <div>气血 +{formatNumber(shopItem.effect.hp)}</div>
                            )}
                            {shopItem.effect.exp && (
                              <div>修为 +{formatNumber(shopItem.effect.exp)}</div>
                            )}
                            {shopItem.effect.spirit && (
                              <div>神识 +{formatNumber(shopItem.effect.spirit)}</div>
                            )}
                            {shopItem.effect.physique && (
                              <div>体魄 +{formatNumber(shopItem.effect.physique)}</div>
                            )}
                            {shopItem.effect.speed && (
                              <div>速度 +{formatNumber(shopItem.effect.speed)}</div>
                            )}
                          </div>
                        )}
                        {shopItem.minRealm && (
                          <div className="text-xs text-stone-500 mb-2">
                            境界要求: {shopItem.minRealm}
                          </div>
                        )}
                        <div className="mt-4 flex flex-col justify-between space-y-2">
                          {/* 价格和描述 */}
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1 text-mystic-gold">
                                <Coins size={14} />
                                <span className="font-bold">{formatNumber(shopItem.price)}</span>
                              </div>
                              {buyQuantities[shopItem.id] > 1 && (
                                <div className="text-xs text-stone-400">
                                  总计: {formatNumber(shopItem.price * buyQuantities[shopItem.id])}
                                </div>
                              )}
                            </div>
                            {shopItem.minRealm && (
                              <div className="text-xs text-stone-500 self-end">
                                境界: {shopItem.minRealm}
                              </div>
                            )}
                          </div>

                          {/* 数量控制和购买按钮 */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 border border-stone-600 rounded bg-stone-800">
                              <button
                                onClick={() =>
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: Math.max(
                                      1,
                                      (prev[shopItem.id] || 1) - 1
                                    ),
                                  }))
                                }
                                className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={buyQuantities[shopItem.id] || 1}
                                onChange={(e) => {
                                  const val = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  );
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: val,
                                  }));
                                }}
                                className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                              />
                              <button
                                onClick={() =>
                                  setBuyQuantities((prev) => ({
                                    ...prev,
                                    [shopItem.id]: (prev[shopItem.id] || 1) + 1,
                                  }))
                                }
                                className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const qty = buyQuantities[shopItem.id] || 1;
                                onBuyItem(shopItem, qty);
                                setBuyQuantities((prev) => ({
                                  ...prev,
                                  [shopItem.id]: 1,
                                }));
                              }}
                              disabled={
                                !canBuy ||
                                shopItem.price *
                                  (buyQuantities[shopItem.id] || 1) >
                                  player.spiritStones
                              }
                              className={`px-3 py-1.5 rounded text-sm font-bold transition-colors flex-1 min-w-[70px] ${
                                canBuy &&
                                shopItem.price *
                                  (buyQuantities[shopItem.id] || 1) <=
                                  player.spiritStones
                                  ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border border-mystic-gold/50'
                                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                              }`}
                              title={
                                !canBuy
                                  ? shop.reputationRequired && (player.reputation || 0) < shop.reputationRequired
                                    ? '声望不足'
                                    : shopItem.minRealm
                                      ? `需要境界: ${shopItem.minRealm}`
                                      : '无法购买'
                                  : shopItem.price * (buyQuantities[shopItem.id] || 1) > player.spiritStones
                                    ? '灵石不足'
                                    : ''
                              }
                            >
                              购买
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">
                    当前灵石:{' '}
                    <span className="text-mystic-gold font-bold">
                      {player.spiritStones}
                    </span>
                  </span>
                  <span className="text-sm text-stone-500">
                    可出售物品: {sellableItems.length}
                  </span>
                </div>
                {/* 批量操作栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm border border-stone-600"
                    >
                      {selectedItems.size === sellableItems.length
                        ? '取消全选'
                        : '全选'}
                    </button>
                    <span className="text-sm text-stone-400">
                      已选择: {selectedItems.size} / {sellableItems.length}
                    </span>
                  </div>
                  <button
                    onClick={handleBatchSell}
                    disabled={selectedItems.size === 0}
                    className={`px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2 ${
                      selectedItems.size > 0
                        ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-700/50'
                        : 'bg-stone-700 text-stone-500 cursor-not-allowed border border-stone-600'
                    }`}
                  >
                    <Trash size={16} />
                    批量出售 ({selectedItems.size})
                  </button>
                </div>
                {/* 物品分类筛选器 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-stone-400 text-sm">
                      <Filter size={16} />
                      <span>分类:</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTypeFilter('all');
                        setSelectedItems(new Set());
                      }}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        selectedTypeFilter === 'all'
                          ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                      }`}
                    >
                      全部
                    </button>
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedTypeFilter(type);
                          setSelectedItems(new Set());
                        }}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          selectedTypeFilter === type
                            ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                            : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-stone-400 text-sm">
                      <Filter size={16} />
                      <span>品质:</span>
                    </div>
                    {(['all', '普通', '稀有', '传说', '仙品'] as const).map(
                      (rarity) => (
                        <button
                          key={rarity}
                          onClick={() => {
                            setSelectedRarity(rarity);
                            setSelectedItems(new Set());
                          }}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            selectedRarity === rarity
                              ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                              : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                          }`}
                        >
                          {rarity === 'all' ? '全部' : rarity}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
              {sellableItems.length === 0 ? (
                <div className="text-center text-stone-500 py-10">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>没有可出售的物品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sellableItems.map((item) => {
                    // 找到对应的商店物品来计算出售价格
                    const shopItem = shop.items.find(
                      (si) => si.name === item.name
                    );
                    const sellPrice =
                      shopItem?.sellPrice || calculateItemSellPrice(item);
                    const rarity = item.rarity || '普通';
                    const isSelected = selectedItems.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`bg-stone-900 rounded-lg p-4 border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-green-900/30 border-green-600'
                            : getRarityBorder(rarity)
                        }`}
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4
                              className={`font-bold ${getRarityTextColor(rarity)}`}
                            >
                              {item.name}
                              {item.level && item.level > 0 && (
                                <span className="text-xs text-stone-500 ml-1">
                                  +{item.level}
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {normalizeTypeLabel(item.type, item)}
                            </span>
                          </div>
                          <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3">
                          {item.description}
                        </p>
                        {item.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {item.effect.attack && (
                              <div>攻击 +{formatNumber(item.effect.attack)}</div>
                            )}
                            {item.effect.defense && (
                              <div>防御 +{formatNumber(item.effect.defense)}</div>
                            )}
                            {item.effect.hp && (
                              <div>气血 +{formatNumber(item.effect.hp)}</div>
                            )}
                            {item.effect.exp && (
                              <div>修为 +{formatNumber(item.effect.exp)}</div>
                            )}
                            {item.effect.spirit && (
                              <div>神识 +{formatNumber(item.effect.spirit)}</div>
                            )}
                            {item.effect.physique && (
                              <div>体魄 +{formatNumber(item.effect.physique)}</div>
                            )}
                            {item.effect.speed && (
                              <div>速度 +{formatNumber(item.effect.speed)}</div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-green-400">
                            <Coins size={16} />
                            <span className="font-bold">{formatNumber(sellPrice)}</span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-stone-500">
                                (总计: {formatNumber(sellPrice * item.quantity)})
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSellItem(item);
                            }}
                            className="px-4 py-2 bg-green-900/20 hover:bg-green-900/30 text-green-400 rounded text-sm font-bold transition-colors border border-green-700/50"
                          >
                            出售
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
    </Modal>
  );
};

export default React.memo(ShopModal);
