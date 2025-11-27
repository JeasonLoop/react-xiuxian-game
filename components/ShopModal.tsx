import React, { useState } from 'react';
import { X, ShoppingBag, Coins, Package } from 'lucide-react';
import { Shop, ShopItem, Item, PlayerStats, RealmType } from '../types';
import { REALM_ORDER, RARITY_MULTIPLIERS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  player: PlayerStats;
  onBuyItem: (shopItem: ShopItem, quantity?: number) => void;
  onSellItem: (item: Item) => void;
}

const ShopModal: React.FC<Props> = ({ isOpen, onClose, shop, player, onBuyItem, onSellItem }) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '稀有': return 'text-blue-400 border-blue-600';
      case '传说': return 'text-purple-400 border-purple-600';
      case '仙品': return 'text-yellow-400 border-yellow-600';
      default: return 'text-gray-400 border-gray-600';
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
      case '村庄': return 'text-green-400';
      case '城市': return 'text-blue-400';
      case '仙门': return 'text-purple-400';
      default: return 'text-stone-400';
    }
  };

  // 过滤可购买的物品（根据境界）
  const availableItems = shop.items.filter(item => {
    if (!item.minRealm) return true;
    const itemRealmIndex = REALM_ORDER.indexOf(item.minRealm);
    const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
    return playerRealmIndex >= itemRealmIndex;
  });

  // 可出售的物品（排除已装备的）
  const sellableItems = player.inventory.filter(item => {
    // 不能出售已装备的物品
    const isEquipped = Object.values(player.equippedItems).includes(item.id);
    return !isEquipped;
  });

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
          <button onClick={onClose} className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
            <X size={24} />
          </button>
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
              <div className="mb-4 flex items-center justify-between">
                <span className="text-stone-400">当前灵石: <span className="text-mystic-gold font-bold">{player.spiritStones}</span></span>
                <span className={`text-sm ${getShopTypeColor(shop.type)}`}>{shop.type}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableItems.length === 0 ? (
                  <div className="col-span-full text-center text-stone-500 py-10">
                    当前境界无法购买任何物品
                  </div>
                ) : (
                  availableItems.map(shopItem => {
                    const canBuy = canBuyItem(shopItem);
                    return (
                      <div
                        key={shopItem.id}
                        className={`bg-stone-900 rounded-lg p-4 border-2 ${
                          canBuy ? getRarityColor(shopItem.rarity).split(' ')[1] : 'border-stone-700 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-bold ${getRarityColor(shopItem.rarity).split(' ')[0]}`}>
                              {shopItem.name}
                            </h4>
                            <span className="text-xs text-stone-500">{shopItem.type}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${getRarityColor(shopItem.rarity).split(' ')[1]} ${getRarityColor(shopItem.rarity).split(' ')[0]}`}>
                            {shopItem.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3">{shopItem.description}</p>
                        {shopItem.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {shopItem.effect.attack && <div>攻击 +{shopItem.effect.attack}</div>}
                            {shopItem.effect.defense && <div>防御 +{shopItem.effect.defense}</div>}
                            {shopItem.effect.hp && <div>气血 +{shopItem.effect.hp}</div>}
                            {shopItem.effect.exp && <div>修为 +{shopItem.effect.exp}</div>}
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
                                x{buyQuantities[shopItem.id]} = {shopItem.price * buyQuantities[shopItem.id]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 border border-stone-600 rounded">
                              <button
                                onClick={() => setBuyQuantities(prev => ({
                                  ...prev,
                                  [shopItem.id]: Math.max(1, (prev[shopItem.id] || 1) - 1)
                                }))}
                                className="px-2 py-1 text-stone-400 hover:text-white"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={buyQuantities[shopItem.id] || 1}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setBuyQuantities(prev => ({ ...prev, [shopItem.id]: val }));
                                }}
                                className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                              />
                              <button
                                onClick={() => setBuyQuantities(prev => ({
                                  ...prev,
                                  [shopItem.id]: (prev[shopItem.id] || 1) + 1
                                }))}
                                className="px-2 py-1 text-stone-400 hover:text-white"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const qty = buyQuantities[shopItem.id] || 1;
                                onBuyItem(shopItem, qty);
                                setBuyQuantities(prev => ({ ...prev, [shopItem.id]: 1 }));
                              }}
                              disabled={!canBuy || (shopItem.price * (buyQuantities[shopItem.id] || 1)) > player.spiritStones}
                              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                                canBuy && (shopItem.price * (buyQuantities[shopItem.id] || 1)) <= player.spiritStones
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
              <div className="mb-4 flex items-center justify-between">
                <span className="text-stone-400">当前灵石: <span className="text-mystic-gold font-bold">{player.spiritStones}</span></span>
                <span className="text-sm text-stone-500">可出售物品: {sellableItems.length}</span>
              </div>
              {sellableItems.length === 0 ? (
                <div className="text-center text-stone-500 py-10">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>没有可出售的物品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sellableItems.map(item => {
                    // 找到对应的商店物品来计算出售价格
                    const shopItem = shop.items.find(si => si.name === item.name);
                    const sellPrice = shopItem?.sellPrice || Math.floor((item.rarity === '普通' ? 5 : item.rarity === '稀有' ? 20 : item.rarity === '传说' ? 100 : 500) * ((item.level || 0) + 1));
                    const rarity = item.rarity || '普通';

                    return (
                      <div
                        key={item.id}
                        className={`bg-stone-900 rounded-lg p-4 border-2 ${getRarityColor(rarity).split(' ')[1]}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-bold ${getRarityColor(rarity).split(' ')[0]}`}>
                              {item.name}
                              {item.level && item.level > 0 && (
                                <span className="text-xs text-stone-500 ml-1">+{item.level}</span>
                              )}
                            </h4>
                            <span className="text-xs text-stone-500">{item.type}</span>
                          </div>
                          <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-3">{item.description}</p>
                        {item.effect && (
                          <div className="text-xs text-stone-400 mb-3 space-y-1">
                            {item.effect.attack && <div>攻击 +{item.effect.attack}</div>}
                            {item.effect.defense && <div>防御 +{item.effect.defense}</div>}
                            {item.effect.hp && <div>气血 +{item.effect.hp}</div>}
                            {item.effect.exp && <div>修为 +{item.effect.exp}</div>}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-green-400">
                            <Coins size={16} />
                            <span className="font-bold">{sellPrice}</span>
                          </div>
                          <button
                            onClick={() => onSellItem(item)}
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

