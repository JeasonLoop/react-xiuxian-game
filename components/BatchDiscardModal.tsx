import React, { useState, useMemo } from 'react';
import { X, Trash2, Filter } from 'lucide-react';
import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  onDiscardItems: (itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'equipment' | 'pill' | 'consumable';
type RarityFilter = 'all' | ItemRarity;

const BatchDiscardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onDiscardItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 判断物品分类
  const getItemCategory = (item: Item): ItemCategory => {
    if (
      item.isEquippable ||
      item.type === ItemType.Weapon ||
      item.type === ItemType.Armor ||
      item.type === ItemType.Artifact ||
      item.type === ItemType.Accessory ||
      item.type === ItemType.Ring
    ) {
      return 'equipment';
    }
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    return 'consumable';
  };

  // 过滤物品
  const filteredItems = useMemo(() => {
    let filtered = inventory.filter((item) => {
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
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleDiscard = () => {
    if (selectedItems.size === 0) return;
    if (
      window.confirm(
        `确定要丢弃选中的 ${selectedItems.size} 件物品吗？此操作不可撤销！`
      )
    ) {
      onDiscardItems(Array.from(selectedItems));
      setSelectedItems(new Set());
      onClose();
    }
  };

  if (!isOpen) return null;

  const getRarityColor = (rarity: ItemRarity | undefined) => {
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
            <Trash2 size={20} /> 批量丢弃
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
              {(
                ['all', 'equipment', 'pill', 'consumable'] as ItemCategory[]
              ).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedItems(new Set());
                  }}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === category
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {category === 'all'
                    ? '全部'
                    : category === 'equipment'
                      ? '装备'
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
                已选择: {selectedItems.size} / {filteredItems.length}
              </span>
            </div>
            <button
              onClick={handleDiscard}
              disabled={selectedItems.size === 0}
              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
                selectedItems.size > 0
                  ? 'bg-red-900 hover:bg-red-800 text-red-200 border border-red-700'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed border border-stone-600'
              }`}
            >
              丢弃选中 ({selectedItems.size})
            </button>
          </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center text-stone-500 py-10">
                没有符合条件的物品
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-red-900/30 border-red-600'
                        : 'bg-ink-800 hover:bg-ink-700 border-stone-700'
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.id)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`font-bold text-sm ${
                            getRarityColor(rarity).split(' ')[0]
                          }`}
                        >
                          {item.name}
                        </h4>
                        <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded shrink-0">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityColor(
                            rarity
                          )}`}
                        >
                          {rarity}
                        </span>
                        <span className="text-xs text-stone-500">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
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

export default BatchDiscardModal;
