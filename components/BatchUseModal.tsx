import React, { useState, useMemo } from 'react';
import { X, Zap, Filter } from 'lucide-react';
import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showConfirm } from '../utils/toastUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  onUseItems: (itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'pill' | 'consumable';
type RarityFilter = 'all' | ItemRarity;

const BatchUseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onUseItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Map<string, number>>(new Map());

  // 判断物品分类
  const getItemCategory = (item: Item): ItemCategory => {
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    return 'consumable';
  };

  // 判断物品是否可使用
  const isUsable = (item: Item): boolean => {
    // 装备不可使用
    if (item.isEquippable) return false;
    // 材料包和宗门宝库钥匙可以使用
    const isMaterialPack = item.name.includes('材料包') && item.type === ItemType.Material;
    const isTreasureVaultKey = item.name === '宗门宝库钥匙' && item.type === ItemType.Material;
    if (isMaterialPack || isTreasureVaultKey) return true;
    // 其他材料不可使用（除非有 effect）
    if (item.type === ItemType.Material && !item.effect) return false;
    // 有 effect 或 Recipe 类型的物品可以使用
    return !!(item.effect || item.type === ItemType.Recipe);
  };

  // 过滤物品
  const filteredItems = useMemo(() => {
    let filtered = inventory.filter((item) => {
      // 只显示可使用的物品
      if (!isUsable(item)) return false;

      // 排除已装备的物品
      const isEquipped = Object.values(equippedItems).includes(item.id);
      if (isEquipped) return false;

      // 按分类过滤
      if (selectedCategory !== 'all') {
        const category = getItemCategory(item);
        if (category !== selectedCategory) return false;
      }

      // 按品质过滤
      if (selectedRarity !== 'all') {
        if (item.rarity !== selectedRarity) return false;
      }

      return true;
    });

    return filtered;
  }, [inventory, equippedItems, selectedCategory, selectedRarity]);

  const handleToggleItem = (itemId: string) => {
    const isSelected = selectedItems.has(itemId);

    if (isSelected) {
      // 取消选中
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setItemQuantities((prev) => {
        const newQty = new Map(prev);
        newQty.delete(itemId);
        return newQty;
      });
    } else {
      // 选中
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      setItemQuantities((prev) => {
        const newQty = new Map(prev);
        newQty.set(itemId, 1); // 默认使用1个
        return newQty;
      });
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const maxQuantity = item.quantity;
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity));

    setItemQuantities((prev) => {
      const newQty = new Map(prev);
      newQty.set(itemId, validQuantity);
      return newQty;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
      setItemQuantities(new Map());
    } else {
      const newSet = new Set(filteredItems.map((item) => item.id));
      const newQty = new Map<string, number>();
      filteredItems.forEach((item) => {
        newQty.set(item.id, 1);
      });
      setSelectedItems(newSet);
      setItemQuantities(newQty);
    }
  };

  const handleUse = () => {
    if (selectedItems.size === 0) return;

    // 构建使用列表（考虑数量）
    const itemsToUse: string[] = [];
    selectedItems.forEach((itemId) => {
      const quantity = itemQuantities.get(itemId) || 1;
      for (let i = 0; i < quantity; i++) {
        itemsToUse.push(itemId);
      }
    });

    const totalCount = itemsToUse.length;
    const itemNames = Array.from(selectedItems)
      .map((id) => {
        const item = inventory.find((i) => i.id === id);
        const qty = itemQuantities.get(id) || 1;
        return item ? `${item.name} x${qty}` : '';
      })
      .filter(Boolean)
      .join('、');

    showConfirm(
      `确定要使用选中的 ${totalCount} 件物品吗？\n${itemNames}\n\n提示：物品将逐个使用，某些物品的效果可能会叠加。`,
      '确认使用',
      () => {
        onUseItems(itemsToUse);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      }
    );
  };

  if (!isOpen) return null;

  const totalSelectedQuantity = Array.from(selectedItems).reduce((sum, itemId) => {
    return sum + (itemQuantities.get(itemId) || 1);
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full max-w-4xl max-h-[90vh] rounded-lg border border-stone-600 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
          <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Zap size={20} /> 批量使用
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* 筛选器 */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <Filter size={16} />
                <span>分类:</span>
              </div>
              {(['all', 'pill', 'consumable'] as ItemCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedItems(new Set());
                    setItemQuantities(new Map());
                  }}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === category
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {category === 'all'
                    ? '全部'
                    : category === 'pill'
                      ? '丹药'
                      : '用品'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <Filter size={16} />
                <span>品质:</span>
              </div>
              {(['all', '普通', '稀有', '传说', '仙品'] as RarityFilter[]).map(
                (rarity) => (
                  <button
                    key={rarity}
                    onClick={() => {
                      setSelectedRarity(rarity);
                      setSelectedItems(new Set());
                      setItemQuantities(new Map());
                    }}
                    className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                      selectedRarity === rarity
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    {rarity === 'all' ? '全部' : rarity}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 操作栏 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm border border-stone-600"
              >
                {selectedItems.size === filteredItems.length
                  ? '取消全选'
                  : '全选'}
              </button>
              <span className="text-sm text-stone-400">
                已选择: {selectedItems.size} / {filteredItems.length} ({totalSelectedQuantity} 件)
              </span>
            </div>
            <button
              onClick={handleUse}
              disabled={selectedItems.size === 0}
              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                selectedItems.size > 0
                  ? 'bg-green-900 hover:bg-green-800 text-green-200 border border-green-700'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed border border-stone-600'
              }`}
            >
              使用选中 ({totalSelectedQuantity})
            </button>
          </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center text-stone-500 py-10">
                没有可使用的物品
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';
                const quantity = itemQuantities.get(item.id) || 1;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`p-3 rounded border flex flex-col gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-green-900/30 border-green-600'
                        : 'bg-ink-800 hover:bg-ink-700 border-stone-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 pointer-events-none"
                      />
                        <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`font-bold text-sm ${getRarityTextColor(rarity)}`}
                          >
                            {item.name}
                          </h4>
                          <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded shrink-0">
                            拥有: {item.quantity}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityBorder(rarity)}`}
                          >
                            {rarity}
                          </span>
                          <span className="text-xs text-stone-500">
                            {normalizeTypeLabel(item.type, item)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        className="flex items-center gap-2 pl-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="text-xs text-stone-400">使用数量:</label>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-20 px-2 py-1 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200"
                        />
                        <span className="text-xs text-stone-500">
                          / {item.quantity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchUseModal;

