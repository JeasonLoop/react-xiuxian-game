import { Filter, Heart, Layers, Package, X, Check, Info, Minus, Plus } from 'lucide-react';
import { Item, ItemType, ItemRarity, PlayerStats } from '../types';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showInfo } from '../utils/toastUtils';
import { Modal } from './common';
import { useState, useMemo, useCallback, memo } from 'react';
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  petId: string;
  onFeedItems: (petId: string, itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'pill' | 'consumable' | 'equipment' | 'material';
type RarityFilter = 'all' | ItemRarity;

// --- 子组件：独立的物品卡片，使用 memo 优化 ---
const ItemCard = memo(({
  item,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange
}: {
  item: Item;
  isSelected: boolean;
  quantity: number;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
}) => {
  const rarity = item.rarity || '普通';
  const textColor = getRarityTextColor(rarity);
  const borderColor = getRarityBorder(rarity);

  return (
    <div
      className={`relative group p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-mystic-gold/10 border-mystic-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.05)]'
          : 'bg-stone-900/40 hover:bg-stone-800/60 border-stone-800 hover:border-stone-700'
      }`}
      onClick={() => onToggle(item.id)}
    >
      {/* 选中时的角标装饰 */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-l-[32px] border-t-mystic-gold border-l-transparent opacity-80" />
          <Check size={12} className="absolute top-1 right-1 text-black font-bold" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* 自定义复选框 */}
        <div className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300 shrink-0 ${
          isSelected
            ? 'bg-mystic-gold border-mystic-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
            : 'bg-stone-950 border-stone-700 group-hover:border-stone-500'
        }`}>
          {isSelected && <Check size={12} className="text-black stroke-[3px]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className={`font-bold text-base truncate ${textColor}`}>
              {item.name}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[10px] font-bold bg-stone-800/80 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700/50">
                持有: {item.quantity}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border leading-none shadow-sm ${borderColor} ${textColor}`}>
              {rarity}
            </span>
            <span className="text-[10px] text-stone-500 font-medium bg-stone-800/40 px-2 py-0.5 rounded-full">
              {normalizeTypeLabel(item.type, item)}
            </span>
          </div>

          <div className="flex items-start gap-1 text-stone-500">
            <Info size={10} className="mt-0.5 shrink-0 opacity-50" />
            <p className="text-xs line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      {/* 数量调节区 */}
      <div className={`mt-1 overflow-hidden transition-all duration-300 ${isSelected ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div
          className="flex items-center gap-4 pl-9 py-3 border-t border-mystic-gold/20 bg-mystic-gold/5 rounded-b-lg"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xs text-stone-400 font-medium">投入数量</span>
          <div className="flex items-center">
            <button
              className="w-8 h-8 flex items-center justify-center bg-stone-800 border border-stone-700 rounded-l-md hover:bg-stone-700 active:bg-stone-600 transition-colors text-stone-300 border-r-0"
              onClick={() => onQuantityChange(item.id, quantity - 1)}
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={quantity || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) onQuantityChange(item.id, val);
                else onQuantityChange(item.id, 0); // 临时设为0允许删除
              }}
              onBlur={() => {
                if (quantity < 1) onQuantityChange(item.id, 1);
              }}
              className="w-14 h-8 bg-stone-950 border-y border-stone-700 text-center text-xs text-mystic-gold font-bold focus:outline-none focus:border-mystic-gold/50"
            />
            <button
              className="w-8 h-8 flex items-center justify-center bg-stone-800 border border-stone-700 rounded-r-md hover:bg-stone-700 active:bg-stone-600 transition-colors text-stone-300 border-l-0"
              onClick={() => onQuantityChange(item.id, quantity + 1)}
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            className="text-[10px] font-bold text-mystic-gold hover:text-white bg-mystic-gold/10 hover:bg-mystic-gold/30 px-2.5 py-1.5 rounded transition-all ml-auto"
            onClick={() => onQuantityChange(item.id, item.quantity)}
          >最大</button>
        </div>
      </div>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

const BatchFeedModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  petId,
  onFeedItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map());

  const pet = useMemo(() => player.pets.find((p) => p.id === petId), [player.pets, petId]);

  // 判断物品分类
  const getItemCategory = useCallback((item: Item): ItemCategory => {
    if (item.type === ItemType.Pill) return 'pill';
    if (item.type === '材料') return 'material';
    if (item.isEquippable ||
        [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact].includes(item.type)) {
      return 'equipment';
    }
    return 'consumable';
  }, []);

  // 所有可喂养的物品
  const allFeedableItems = useMemo(() => {
    const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));
    return player.inventory.filter((item) => {
      return !equippedItemIds.has(item.id) && item.quantity > 0;
    });
  }, [player.inventory, player.equippedItems]);

  // 过滤物品
  const filteredItems = useMemo(() => {
    return allFeedableItems.filter((item) => {
      if (selectedCategory !== 'all' && getItemCategory(item) !== selectedCategory) return false;
      if (selectedRarity !== 'all' && item.rarity !== selectedRarity) return false;
      return true;
    });
  }, [allFeedableItems, selectedCategory, selectedRarity, getItemCategory]);

  const handleToggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        setItemQuantities((prevQty) => {
          const newQty = new Map(prevQty);
          newQty.delete(itemId);
          return newQty;
        });
      } else {
        newSet.add(itemId);
        const item = player.inventory.find((i) => i.id === itemId);
        if (item) {
          setItemQuantities((prevQty) => {
            const newQty = new Map(prevQty);
            newQty.set(itemId, item.quantity);
            return newQty;
          });
        }
      }
      return newSet;
    });
  }, [player.inventory]);

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    const item = player.inventory.find((i) => i.id === itemId);
    if (!item) return;

    const validQuantity = Math.max(0, Math.min(quantity, item.quantity));

    setItemQuantities((prev) => {
      const newQty = new Map(prev);
      newQty.set(itemId, validQuantity);
      return newQty;
    });
  }, [player.inventory]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Set());
      setItemQuantities(new Map());
    } else {
      const newSet = new Set(filteredItems.map((item) => item.id));
      const newQty = new Map<string, number>();
      filteredItems.forEach((item) => {
        newQty.set(item.id, item.quantity);
      });
      setSelectedItems(newSet);
      setItemQuantities(newQty);
    }
  }, [filteredItems, selectedItems.size]);

  const handleFeedAll = useCallback(() => {
    if (allFeedableItems.length === 0 || !pet) return;

    const itemsToFeed: string[] = [];
    allFeedableItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        itemsToFeed.push(item.id);
      }
    });

    showInfo(
      `确定要用所有 ${allFeedableItems.length} 种物品（共 ${itemsToFeed.length} 件）喂养【${pet.name}】吗？\n这将消耗所有可喂养的物品！`,
      '批量喂养',
      () => {
        onFeedItems(petId, itemsToFeed);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      }
    );
  }, [allFeedableItems, pet, petId, onFeedItems, onClose]);

  const handleFeed = useCallback(() => {
    if (selectedItems.size === 0 || !pet) return;

    const itemsToFeed: string[] = [];
    const itemDetails: string[] = [];
    selectedItems.forEach((itemId) => {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        const quantity = itemQuantities.get(itemId) || 1;
        for (let i = 0; i < quantity; i++) {
          itemsToFeed.push(itemId);
        }
        itemDetails.push(`${item.name} x${quantity}`);
      }
    });

    showInfo(
      `确定要用 ${selectedItems.size} 种物品（共 ${itemsToFeed.length} 件）喂养【${pet.name}】吗？\n\n${itemDetails.join('、')}`,
      '批量喂养',
      () => {
        onFeedItems(petId, itemsToFeed);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      }
    );
  }, [selectedItems, pet, petId, player.inventory, itemQuantities, onFeedItems, onClose]);

  const totalSelectedQuantity = useMemo(() => {
    let sum = 0;
    selectedItems.forEach(id => {
      sum += (itemQuantities.get(id) || 0);
    });
    return sum;
  }, [selectedItems, itemQuantities]);

  if (!pet) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`批量喂养 - ${pet.name}`}
      titleIcon={<Layers size={20} className="text-mystic-gold" />}
      size="4xl"
      height="full"
      zIndex={70}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* 筛选区域 */}
        <div className="mb-4 space-y-3 bg-stone-900/80 p-4 rounded-lg border border-stone-700 shadow-inner">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-stone-400 text-sm font-medium border-r border-stone-700 pr-3">
              <Filter size={14} className="text-mystic-gold" />
              <span>分类</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'pill', 'material', 'consumable', 'equipment'] as ItemCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedItems(new Set());
                    setItemQuantities(new Map());
                  }}
                  className={`px-3 py-1 rounded-md text-xs border transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  {category === 'all' ? '全部' :
                   category === 'pill' ? '丹药' :
                   category === 'material' ? '材料' :
                   category === 'equipment' ? '装备' : '用品'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-stone-400 text-sm font-medium border-r border-stone-700 pr-3">
              <Package size={14} className="text-mystic-gold" />
              <span>品质</span>
            </div>
            <div className="flex gap-2">
              {(['all', '普通', '稀有', '传说', '仙品'] as RarityFilter[]).map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => {
                    setSelectedRarity(rarity);
                    setSelectedItems(new Set());
                    setItemQuantities(new Map());
                  }}
                  className={`px-3 py-1 rounded-md text-xs border transition-all duration-200 ${
                    selectedRarity === rarity
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  {rarity === 'all' ? '全部' : rarity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3 bg-ink-900/60 p-3 rounded-lg border border-stone-700 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs border border-stone-600 transition-colors"
            >
              {selectedItems.size === filteredItems.length && filteredItems.length > 0
                ? '取消全选'
                : '全选当前'}
            </button>
            <button
              onClick={handleFeedAll}
              className="px-4 py-1.5 bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 rounded text-xs border border-orange-800/50 transition-all"
              title="喂养所有可喂养的物品"
            >
              一键全喂 ({allFeedableItems.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
            <div className="text-xs text-stone-500 ml-2 hidden sm:block">
              已选: <span className="text-mystic-gold font-bold text-sm">{selectedItems.size}</span> 种
              <span className="mx-2 opacity-30">|</span>
              共 <span className="text-mystic-gold font-bold text-sm">{totalSelectedQuantity}</span> 件
            </div>
          </div>
          <button
            onClick={handleFeed}
            disabled={selectedItems.size === 0}
            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              selectedItems.size > 0
                ? 'bg-gradient-to-r from-mystic-gold to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95'
                : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
            }`}
          >
            <Heart size={16} fill={selectedItems.size > 0 ? "currentColor" : "none"} />
            确认批量喂养
          </button>
        </div>

        {/* 物品列表区域 */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-600 bg-stone-900/20 rounded-xl border border-dashed border-stone-800">
              <Package size={64} className="mb-4 opacity-10" />
              <p className="text-lg font-serif">暂无符合条件的灵材</p>
              <p className="text-xs mt-2 opacity-50">尝试切换筛选条件或去历练获得更多物品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  quantity={itemQuantities.get(item.id) || 0}
                  onToggle={handleToggleItem}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BatchFeedModal;
