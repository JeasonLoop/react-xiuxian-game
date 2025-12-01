import React, { useState, useMemo } from 'react';
import { X, ShoppingBag, Coins, Package, Filter, Trash, RefreshCw } from 'lucide-react';
import {
  Shop,
  ShopItem,
  Item,
  PlayerStats,
  RealmType,
  ItemRarity,
  ItemType,
} from '../types';
import { REALM_ORDER, RARITY_MULTIPLIERS } from '../constants';
import { generateShopItems } from '../services/shopService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  player: PlayerStats;
  onBuyItem: (shopItem: ShopItem, quantity?: number) => void;
  onSellItem: (item: Item) => void;
  onRefreshShop?: (newItems: ShopItem[]) => void;
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '稀有':
        return 'text-blue-400 border-blue-600';
      case '传说':
        return 'text-purple-400 border-purple-600';
      case '仙品':
        return 'text-yellow-400 border-yellow-600';
      default:
        return 'text-gray-400 border-gray-600';
    }
  };

  const canBuyItem = (shopItem: ShopItem): boolean => {
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

  // 过滤可购买的物品（根据境界和类型）
  const availableItems = useMemo(() => {
    let filtered = shop.items.filter((item) => {
      if (!item.minRealm) return true;
      const itemRealmIndex = REALM_ORDER.indexOf(item.minRealm);
      const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
      return playerRealmIndex >= itemRealmIndex;
    });

    // 按类型筛选
    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedTypeFilter);
    }

    return filtered;
  }, [shop.items, player.realm, selectedTypeFilter]);

  // 计算物品出售价格（与 App.tsx 中的逻辑保持一致）
  const calculateItemSellPrice = (item: Item): number => {
    const rarity = item.rarity || '普通';
    const level = item.level || 0;

    // 基础价格（根据稀有度）
    const basePrices: Record<ItemRarity, number> = {
      普通: 10,
      稀有: 50,
      传说: 300,
      仙品: 2000,
    };
    let basePrice = basePrices[rarity];

    // 计算属性价值
    let attributeValue = 0;
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

    // 临时效果价值（effect）
    if (item.effect) {
      const effect = item.effect;
      attributeValue += (effect.attack || 0) * 2; // 攻击力每点值2灵石
      attributeValue += (effect.defense || 0) * 1.5; // 防御力每点值1.5灵石
      attributeValue += (effect.hp || 0) * 0.5; // 气血每点值0.5灵石
      attributeValue += (effect.spirit || 0) * 1.5; // 神识每点值1.5灵石
      attributeValue += (effect.physique || 0) * 1.5; // 体魄每点值1.5灵石
      attributeValue += (effect.speed || 0) * 2; // 速度每点值2灵石
      attributeValue += (effect.exp || 0) * 0.1; // 修为每点值0.1灵石（临时效果）
    }

    // 永久效果价值（permanentEffect，更值钱）
    if (item.permanentEffect) {
      const permEffect = item.permanentEffect;
      attributeValue += (permEffect.attack || 0) * 10; // 永久攻击每点值10灵石
      attributeValue += (permEffect.defense || 0) * 8; // 永久防御每点值8灵石
      attributeValue += (permEffect.maxHp || 0) * 3; // 永久气血上限每点值3灵石
      attributeValue += (permEffect.spirit || 0) * 8; // 永久神识每点值8灵石
      attributeValue += (permEffect.physique || 0) * 8; // 永久体魄每点值8灵石
      attributeValue += (permEffect.speed || 0) * 10; // 永久速度每点值10灵石
    }

    // 应用稀有度倍率到属性价值
    attributeValue = Math.floor(attributeValue * rarityMultiplier);

    // 装备类物品额外价值加成
    let equipmentBonus = 0;
    if (item.isEquippable) {
      // 装备类物品根据类型有不同的基础价值
      switch (item.type) {
        case ItemType.Weapon:
          equipmentBonus = basePrice * 1.5; // 武器额外50%价值
          break;
        case ItemType.Armor:
          equipmentBonus = basePrice * 1.2; // 护甲额外20%价值
          break;
        case ItemType.Artifact:
          equipmentBonus = basePrice * 2; // 法宝额外100%价值
          break;
        case ItemType.Ring:
        case ItemType.Accessory:
          equipmentBonus = basePrice * 1.3; // 戒指和首饰额外30%价值
          break;
      }
    }

    // 强化等级加成（每级增加20%价值）
    const levelMultiplier = 1 + level * 0.2;

    // 计算最终价格
    const totalValue =
      (basePrice + attributeValue + equipmentBonus) * levelMultiplier;

    // 根据物品类型调整（消耗品价值较低）
    let typeMultiplier = 1;
    if (item.type === ItemType.Herb || item.type === ItemType.Pill) {
      typeMultiplier = 0.5; // 消耗品价值减半
    } else if (item.type === ItemType.Material) {
      typeMultiplier = 0.3; // 材料价值更低
    }

    // 最终价格（取整，最低为1）
    return Math.max(1, Math.floor(totalValue * typeMultiplier));
  };

  // 可出售的物品（排除已装备的，并根据类型和品质筛选）
  const sellableItems = useMemo(() => {
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
      // 使用原始商店物品列表，只根据境界过滤
      shop.items
        .filter((item) => {
          if (!item.minRealm) return true;
          const itemRealmIndex = REALM_ORDER.indexOf(item.minRealm);
          const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
          return playerRealmIndex >= itemRealmIndex;
        })
        .forEach((item) => types.add(item.type));
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
    player.realm,
    player.inventory,
    player.equippedItems,
  ]);

  // 当切换标签页时，如果当前筛选的类型在新标签页中不存在，则重置为'all'
  React.useEffect(() => {
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
      totalPrice += sellPrice * item.quantity;
    });

    if (
      window.confirm(
        `确定要出售选中的 ${selectedItems.size} 件物品吗？将获得 ${totalPrice} 灵石。`
      )
    ) {
      itemsToSell.forEach((item) => {
        onSellItem(item);
      });
      setSelectedItems(new Set());
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <div>
            <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
              <ShoppingBag size={18} className="md:w-5 md:h-5" />
              {shop.name}
            </h3>
            <p className="text-sm text-stone-400 mt-1">{shop.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshShop && (
              <button
                onClick={() => {
                  const refreshCost = 100; // 刷新费用
                  if (player.spiritStones < refreshCost) {
                    alert('灵石不足！刷新需要100灵石。');
                    return;
                  }
                  if (window.confirm(`确定要花费 ${refreshCost} 灵石刷新商店物品吗？`)) {
                    const newItems = generateShopItems(shop.type, player.realm, true);
                    onRefreshShop(newItems);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors text-sm"
                title="花费100灵石刷新商店物品（小概率出现高级物品）"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">刷新</span>
                <span className="text-xs text-stone-400">(100)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-stone-600 bg-stone-900">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 px-4 py-3 font-bold transition-colors ${
              activeTab === 'buy'
                ? 'bg-ink-800 text-mystic-gold border-b-2 border-mystic-gold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            购买
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 px-4 py-3 font-bold transition-colors ${
              activeTab === 'sell'
                ? 'bg-ink-800 text-mystic-gold border-b-2 border-mystic-gold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            出售
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
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
                            ? getRarityColor(shopItem.rarity).split(' ')[1]
                            : 'border-stone-700 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4
                              className={`font-bold ${getRarityColor(shopItem.rarity).split(' ')[0]}`}
                            >
                              {shopItem.name}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {shopItem.type}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getRarityColor(shopItem.rarity).split(' ')[1]} ${getRarityColor(shopItem.rarity).split(' ')[0]}`}
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
                              <div>攻击 +{shopItem.effect.attack}</div>
                            )}
                            {shopItem.effect.defense && (
                              <div>防御 +{shopItem.effect.defense}</div>
                            )}
                            {shopItem.effect.hp && (
                              <div>气血 +{shopItem.effect.hp}</div>
                            )}
                            {shopItem.effect.exp && (
                              <div>修为 +{shopItem.effect.exp}</div>
                            )}
                          </div>
                        )}
                        {shopItem.minRealm && (
                          <div className="text-xs text-stone-500 mb-2">
                            境界要求: {shopItem.minRealm}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-mystic-gold">
                            <Coins size={16} />
                            <span className="font-bold">{shopItem.price}</span>
                            {buyQuantities[shopItem.id] > 1 && (
                              <span className="text-xs text-stone-400 ml-1">
                                x{buyQuantities[shopItem.id]} ={' '}
                                {shopItem.price * buyQuantities[shopItem.id]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border border-stone-600 rounded">
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
                                className="px-2 py-1 text-stone-400 hover:text-white"
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
                                className="px-2 py-1 text-stone-400 hover:text-white"
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
                              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                                canBuy &&
                                shopItem.price *
                                  (buyQuantities[shopItem.id] || 1) <=
                                  player.spiritStones
                                  ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border border-mystic-gold/50'
                                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                              }`}
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
                            : getRarityColor(rarity).split(' ')[1]
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
                              className={`font-bold ${getRarityColor(rarity).split(' ')[0]}`}
                            >
                              {item.name}
                              {item.level && item.level > 0 && (
                                <span className="text-xs text-stone-500 ml-1">
                                  +{item.level}
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-500">
                              {item.type}
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
                              <div>攻击 +{item.effect.attack}</div>
                            )}
                            {item.effect.defense && (
                              <div>防御 +{item.effect.defense}</div>
                            )}
                            {item.effect.hp && (
                              <div>气血 +{item.effect.hp}</div>
                            )}
                            {item.effect.exp && (
                              <div>修为 +{item.effect.exp}</div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-green-400">
                            <Coins size={16} />
                            <span className="font-bold">{sellPrice}</span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-stone-500">
                                (总计: {sellPrice * item.quantity})
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
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
