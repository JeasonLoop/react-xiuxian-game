import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { MarketItem, PlayerStats } from '../types';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { formatNumber } from '../utils/formatUtils';
import { RefreshCw, Coins, Store, X, Package, Filter, Search } from 'lucide-react';
import { CATEGORY_LIST, getItemCategory } from '../utils/itemCategoryUtils';
import type { ItemCategory } from '../utils/itemCategoryUtils';

type TabType = 'buy' | 'sell';
type AdvancedItemType = NonNullable<MarketItem['advancedItemType']>;

const ADVANCED_ITEM_TYPE_LABELS: Record<AdvancedItemType, string> = {
  foundationTreasure: '筑基奇物',
  heavenEarthEssence: '天地精华',
  heavenEarthMarrow: '天地之髓',
  longevityRule: '长生规则',
  soulArt: '天地之魄',
};

function getMarketItemTypeLabel(item: {
  type: MarketItem['type'];
  advancedItemType?: MarketItem['advancedItemType'];
  sellerItemData?: string;
}): string {
  let advancedItemType = item.advancedItemType;

  if (!advancedItemType && item.sellerItemData) {
    try {
      advancedItemType = JSON.parse(item.sellerItemData)?.advancedItemType;
    } catch {
      advancedItemType = undefined;
    }
  }

  if (advancedItemType && ADVANCED_ITEM_TYPE_LABELS[advancedItemType]) {
    return ADVANCED_ITEM_TYPE_LABELS[advancedItemType];
  }

  return item.type;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  items: MarketItem[];
  onPurchase: (itemId: string) => void;
  onRefresh: () => void;
  onSyncMarket: () => void;
  onListItem: (itemId: string, price: number, quantity: number) => void;
  onCancelListing: (marketItemId: string) => void;
}

export default function TradeMarketModal({
  isOpen,
  onClose,
  player,
  items,
  onPurchase,
  onRefresh,
  onSyncMarket,
  onListItem,
  onCancelListing,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('buy');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory>('all');
  const [listingPrice, setListingPrice] = useState<Record<string, string>>({});
  const [listingQuantity, setListingQuantity] = useState<Record<string, string>>({});
  const [buySearch, setBuySearch] = useState('');
  const [sellSearch, setSellSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 搜索/分类变化时重置到第一页
  const onBuySearchChange = (v: string) => { setBuySearch(v); setPage(1); };
  const onCategoryChange = (v: ItemCategory) => { setCategoryFilter(v); setPage(1); };

  // 切换到购买tab时自动同步市场数据（跳过初始挂载，避免和 handleOpenTradeMarket 重复）
  const syncRef = useRef(onSyncMarket);
  syncRef.current = onSyncMarket;
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activeTab === 'buy') {
      syncRef.current();
    }
  }, [activeTab]);

  const systemItems = items.filter((i) => i.sellerId === 'system');
  const playerListings = items.filter((i) => i.sellerId === 'player');

  // 购买 tab：分类 + 搜索 + 分页
  const filteredItems = useMemo(() => {
    let result = systemItems;
    if (categoryFilter !== 'all') {
      result = result.filter((i) => getItemCategory(i) === categoryFilter);
    }
    if (buySearch.trim()) {
      const q = buySearch.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [systemItems, categoryFilter, buySearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // 上架 tab：分类 + 搜索（背包物品）
  const listableInventory = useMemo(() => {
    let result = player.inventory.filter((item) => {
      if (item.locked) return false;
      const isEquipped = Object.values(player.equippedItems).includes(item.id);
      if (isEquipped) return false;
      return true;
    });
    // 分类
    if (categoryFilter !== 'all') {
      result = result.filter((i) => getItemCategory(i) === categoryFilter);
    }
    // 搜索
    if (sellSearch.trim()) {
      const q = sellSearch.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [player.inventory, player.equippedItems, categoryFilter, sellSearch]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-lg md:text-xl font-serif text-mystic-gold">
          <Store size={20} />
          <span>交易行</span>
        </div>
      }
      size="4xl"
      height="full"
      containerClassName="bg-paper-800 border-stone-600"
      headerClassName="bg-ink-800 border-b border-stone-600"
      contentClassName="bg-paper-800"
      titleExtra={
        activeTab === 'buy' ? (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors text-xs md:text-sm"
            title="消耗灵石刷新商品"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">刷新</span>
          </button>
        ) : undefined
      }
      subHeader={
        <div>
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
              上架
            </button>
          </div>
          <div className="px-4 py-2 bg-stone-900/80 border-b border-stone-700 flex items-center gap-2 text-sm text-stone-400">
            <Coins size={16} className="text-mystic-gold" />
            <span>
              灵石: <span className="text-mystic-gold font-bold">{formatNumber(player.spiritStones)}</span>
            </span>
            {activeTab === 'buy' && (
              <span className="ml-auto text-stone-500">
                在售: <span className="text-cyan-400 font-bold">{filteredItems.length}</span> 件
              </span>
            )}
            {activeTab === 'sell' && (
              <span className="ml-auto text-stone-500">
                已上架: <span className="text-amber-400 font-bold">{playerListings.length}</span> 件
              </span>
            )}
          </div>
        </div>
      }
    >
      {activeTab === 'buy' ? (
        /* ========== 购买标签 ========== */
        <div className="p-3 md:p-4 space-y-3">
          {/* 搜索栏 */}
          <div className="flex items-center gap-2 bg-stone-900 rounded border border-stone-700 px-3 py-2">
            <Search size={16} className="text-stone-500 shrink-0" />
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={buySearch}
              onChange={(e) => onBuySearchChange(e.target.value)}
              className="w-full bg-transparent text-stone-200 text-sm focus:outline-none placeholder-stone-600"
            />
            {buySearch && (
              <button onClick={() => onBuySearchChange('')} className="text-stone-500 hover:text-stone-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-stone-500" />
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  categoryFilter === cat.key
                    ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 物品列表 */}
          {filteredItems.length === 0 ? (
            <div className="text-center text-stone-500 py-12">
              <div className="text-4xl mb-3 text-stone-600">📭</div>
              <p className="text-base">
                {buySearch || categoryFilter !== 'all' ? '没有匹配的商品' : '交易行暂无商品'}
              </p>
              <p className="text-sm mt-2 text-stone-600">
                {buySearch || categoryFilter !== 'all'
                  ? '试试调整搜索条件'
                  : '点击右上角「刷新」查看新上架的宝物'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {pagedItems.map((item) => {
                const canAfford = player.spiritStones >= item.price;
                const isOwnItem = item.sellerId === 'player';
                const canBuy = canAfford && !isOwnItem;
                return (
                  <div
                    key={item.id}
                    className={`bg-stone-900 rounded-lg p-4 border-2 transition-colors ${
                      canBuy
                        ? getRarityBorder(item.rarity)
                        : 'border-stone-700 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate ${getRarityTextColor(item.rarity)}`}>
                          {item.name}
                        </h4>
                        <span className="text-xs text-stone-500">{getMarketItemTypeLabel(item)}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded shrink-0 ml-2 ${getRarityBorder(item.rarity)} ${getRarityTextColor(item.rarity)}`}>
                        {item.rarity}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mb-1">卖家: {item.sellerName || '匿名修士'}</div>
                    <p className="text-sm text-stone-400 mb-3">{item.description}</p>
                    {item.effect && (
                      <div className="text-xs text-stone-400 mb-3 space-y-1">
                        {item.effect.attack && <div>攻击 +{formatNumber(item.effect.attack)}</div>}
                        {item.effect.defense && <div>防御 +{formatNumber(item.effect.defense)}</div>}
                        {item.effect.hp && <div>气血 +{formatNumber(item.effect.hp)}</div>}
                        {item.effect.spirit && <div>神识 +{formatNumber(item.effect.spirit)}</div>}
                        {item.effect.physique && <div>体魄 +{formatNumber(item.effect.physique)}</div>}
                        {item.effect.speed && <div>速度 +{formatNumber(item.effect.speed)}</div>}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-mystic-gold">
                        <Coins size={16} />
                        <span className="font-bold text-base">{formatNumber(item.price)}</span>
                      </div>
                      <button
                        onClick={() => onPurchase(item.id)}
                        disabled={!canBuy}
                        className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                          canBuy
                            ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50 hover:bg-mystic-gold/30'
                            : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                        }`}
                      >
                        {isOwnItem ? '自己的物品' : canAfford ? '购买' : '灵石不足'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 分页 */}
          {filteredItems.length > pageSize && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  page > 1
                    ? 'bg-stone-700 text-stone-200 hover:bg-stone-600 border border-stone-600'
                    : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                }`}
              >
                上一页
              </button>
              <span className="text-sm text-stone-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  page < totalPages
                    ? 'bg-stone-700 text-stone-200 hover:bg-stone-600 border border-stone-600'
                    : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                }`}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ========== 上架标签 ========== */
        <div className="p-3 md:p-4 space-y-4">
          {/* 我的上架 */}
          <div>
            <h4 className="text-sm font-bold text-stone-300 mb-2 flex items-center gap-2">
              <Package size={16} className="text-amber-400" />
              我的上架
              <span className="text-xs text-stone-500 font-normal">（{playerListings.length} 件）</span>
            </h4>
            {playerListings.length === 0 ? (
              <div className="text-center text-stone-600 py-6 bg-stone-900/50 rounded-lg border border-stone-800">
                <p className="text-sm">暂无上架物品</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {playerListings.map((item) => (
                  <div key={item.id} className="bg-stone-900 rounded-lg p-3 border border-stone-700 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`font-bold text-sm truncate ${getRarityTextColor(item.rarity)}`}>{item.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getRarityBorder(item.rarity)} ${getRarityTextColor(item.rarity)}`}>{item.rarity}</span>
                      <span className="text-xs text-stone-500">x{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-mystic-gold text-sm font-bold">
                        <Coins size={14} />
                        {formatNumber(item.price)}
                      </span>
                      <button
                        onClick={() => onCancelListing(item.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded border border-red-800 text-xs transition-colors"
                      >
                        <X size={12} />
                        下架
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 上架新物品 */}
          <div>
            <h4 className="text-sm font-bold text-stone-300 mb-2 flex items-center gap-2">
              <Store size={16} className="text-green-400" />
              上架新物品
            </h4>

            {/* 搜索 + 分类 */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 bg-stone-900 rounded border border-stone-700 px-3 py-2">
                <Search size={16} className="text-stone-500 shrink-0" />
                <input
                  type="text"
                  placeholder="搜索背包物品..."
                  value={sellSearch}
                  onChange={(e) => setSellSearch(e.target.value)}
                  className="w-full bg-transparent text-stone-200 text-sm focus:outline-none placeholder-stone-600"
                />
                {sellSearch && (
                  <button onClick={() => setSellSearch('')} className="text-stone-500 hover:text-stone-300">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={16} className="text-stone-500" />
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => onCategoryChange(cat.key)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      categoryFilter === cat.key
                        ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {listableInventory.length === 0 ? (
              <div className="text-center text-stone-600 py-8 bg-stone-900/50 rounded-lg border border-stone-800">
                <p className="text-sm">
                  {sellSearch || categoryFilter !== 'all' ? '没有匹配的物品' : '背包中没有可上架的物品'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {listableInventory.map((item) => {
                  const priceKey = item.id;
                  const priceVal = listingPrice[priceKey] || '';
                  const quantityVal = listingQuantity[priceKey] || '1';
                  const priceNum = parseInt(priceVal) || 0;
                  const maxQuantity = Math.max(1, item.quantity || 1);
                  const quantityNum = Math.max(1, Math.min(parseInt(quantityVal) || 1, maxQuantity));
                  const unitPrice = quantityNum > 0 ? Math.floor(priceNum / quantityNum) : 0;

                  return (
                    <div key={item.id} className="bg-stone-900 rounded-lg p-3 border border-stone-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <span className={`font-bold text-sm ${getRarityTextColor(item.rarity)}`}>
                            {item.name}
                          </span>
                          <span className="text-xs text-stone-500 ml-2">x{item.quantity}</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${getRarityBorder(item.rarity)} ${getRarityTextColor(item.rarity)}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mb-2">{getMarketItemTypeLabel(item)}</div>
                      <div className="grid grid-cols-[minmax(0,1fr)_92px_auto] gap-2 items-center">
                        <div className="flex items-center flex-1 bg-stone-800 rounded border border-stone-600 px-2 py-1">
                          <Coins size={14} className="text-mystic-gold shrink-0" />
                          <input
                            type="number"
                            min="1"
                            placeholder="总价"
                            value={priceVal}
                            onChange={(e) => setListingPrice((prev) => ({ ...prev, [priceKey]: e.target.value }))}
                            className="w-full bg-transparent text-stone-200 text-sm text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={quantityVal}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value) || 1;
                            const next = Math.max(1, Math.min(raw, maxQuantity));
                            setListingQuantity((prev) => ({ ...prev, [priceKey]: String(next) }));
                          }}
                          onBlur={() => {
                            setListingQuantity((prev) => ({ ...prev, [priceKey]: String(quantityNum) }));
                          }}
                          className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-stone-200 text-sm text-center focus:outline-none focus:border-mystic-gold/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title={`上架数量，最多 ${maxQuantity}`}
                        />
                        <button
                          onClick={() => {
                            if (priceNum <= 0 || quantityNum <= 0) return;
                            onListItem(item.id, priceNum, quantityNum);
                            setListingPrice((prev) => ({ ...prev, [priceKey]: '' }));
                            setListingQuantity((prev) => ({ ...prev, [priceKey]: '1' }));
                          }}
                          disabled={priceNum <= 0 || quantityNum <= 0}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors shrink-0 ${
                            priceNum > 0 && quantityNum > 0
                              ? 'bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-900/70'
                              : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                          }`}
                        >
                          上架
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] text-stone-600 text-right">
                        上架 x{quantityNum} / {maxQuantity}
                        {priceNum > 0 && quantityNum > 1 ? `，约 ${formatNumber(unitPrice)} 灵石/个` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 上架规则 */}
          <div className="text-xs text-stone-600 bg-stone-900 rounded-lg p-3 border border-stone-800">
            <p className="font-bold text-stone-500 mb-1">📜 上架规则</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>已装备或锁定的物品不可上架</li>
              <li>上架后物品从背包移除，下架后归还</li>
              <li>同一件物品不可重复上架</li>
              <li>物品售出后你将在日志中收到通知</li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
