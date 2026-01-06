import React, { useState, useMemo } from 'react';
import { Filter, Heart } from 'lucide-react';
import { Item, ItemType, ItemRarity, PlayerStats } from '../types';
import { getRarityTextColor, getRarityBorder } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { showInfo } from '../utils/toastUtils';
import { Modal } from './common';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  petId: string;
  onFeedItems: (petId: string, itemIds: string[]) => void;
}

type ItemCategory = 'all' | 'pill' | 'consumable' | 'equipment';
type RarityFilter = 'all' | ItemRarity;

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

  const pet = player.pets.find((p) => p.id === petId);

  // 判断物品分类
  const getItemCategory = (item: Item): ItemCategory => {
    if (item.type === ItemType.Pill) {
      return 'pill';
    }
    if (item.isEquippable ||
        item.type === ItemType.Weapon ||
        item.type === ItemType.Armor ||
        item.type === ItemType.Accessory ||
        item.type === ItemType.Ring ||
        item.type === ItemType.Artifact) {
      return 'equipment';
    }
    return 'consumable';
  };

  // 可喂养的物品（所有未装备的物品）
  const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));

  // 所有可喂养的物品（不考虑筛选）
  const allFeedableItems = useMemo(() => {
    return player.inventory.filter((item) => {
      // 只显示可喂养的物品（未装备且数量>0）
      if (equippedItemIds.has(item.id)) return false;
      if (item.quantity <= 0) return false;
      return true;
    });
  }, [player.inventory, equippedItemIds]);

  // 过滤物品
  const filteredItems = useMemo(() => {
    let filtered = allFeedableItems.filter((item) => {
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
  }, [allFeedableItems, selectedCategory, selectedRarity]);

  const handleToggleItem = (itemId: string) => {
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
            newQty.set(itemId, 1); // 默认喂养1个
            return newQty;
          });
        }
      }
      return newSet;
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = player.inventory.find((i) => i.id === itemId);
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
        // 选中时设置为物品的全部数量
        newQty.set(item.id, item.quantity);
      });
      setSelectedItems(newSet);
      setItemQuantities(newQty);
    }
  };

  // 喂养全部物品（所有可喂养的物品，使用全部数量）
  const handleFeedAll = () => {
    if (allFeedableItems.length === 0 || !pet) return;

    // 构建喂养列表（使用所有数量）
    const itemsToFeed: string[] = [];
    allFeedableItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        itemsToFeed.push(item.id);
      }
    });

    const totalCount = itemsToFeed.length;
    const totalItems = allFeedableItems.length;

    showInfo(
      `确定要用所有 ${totalItems} 种物品（共 ${totalCount} 件）喂养【${pet.name}】吗？\n这将消耗所有可喂养的物品！`
    , '批量喂养', () => {
      onFeedItems(petId, itemsToFeed);
      setSelectedItems(new Set());
      setItemQuantities(new Map());
      onClose();
    })

  };

  const handleFeed = () => {
    if (selectedItems.size === 0 || !pet) return;

    // 构建喂养列表（使用用户设置的数量）
    const itemsToFeed: string[] = [];
    const itemDetails: string[] = [];
    selectedItems.forEach((itemId) => {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        const quantity = itemQuantities.get(itemId) || 1;
        // 使用用户设置的数量
        for (let i = 0; i < quantity; i++) {
          itemsToFeed.push(itemId);
        }
        itemDetails.push(`${item.name} x${quantity}`);
      }
    });

    const totalCount = itemsToFeed.length;
    const itemNames = itemDetails.join('、');

    showInfo(
      `确定要用 ${selectedItems.size} 种物品（共 ${totalCount} 件）喂养【${pet.name}】吗？\n\n${itemNames}`
      , '批量喂养', () => {
        onFeedItems(petId, itemsToFeed);
        setSelectedItems(new Set());
        setItemQuantities(new Map());
        onClose();
      })
  };

  if (!pet) return null;

  const totalSelectedQuantity = Array.from(selectedItems).reduce((sum, itemId) => {
    // 使用用户设置的数量
    return sum + (itemQuantities.get(itemId) || 1);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`批量喂养 - ${pet.name}`}
      titleIcon={<Heart size={20} />}
      size="4xl"
      height="full"
      zIndex={70}
    >
      {/* 筛选器 */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <Filter size={16} />
            <span>分类:</span>
          </div>
          {(['all', 'pill', 'consumable', 'equipment'] as ItemCategory[]).map((category) => (
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
                  : category === 'equipment'
                    ? '装备'
                    : '用品'}
            </button>
          ))}
        </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center text-stone-500 py-10">
                没有可喂养的物品
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarity = item.rarity || '普通';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded border flex flex-col gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-green-900/30 border-green-600'
                        : 'bg-ink-800 hover:bg-ink-700 border-stone-700'
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
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
                      <div className="flex items-center gap-2 pl-8">
                        <label className="text-xs text-stone-400">喂养数量:</label>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={itemQuantities.get(item.id) || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === '') {
                              // 允许清空，暂时不更新状态
                              setItemQuantities((prev) => {
                                const newQty = new Map(prev);
                                newQty.delete(item.id);
                                return newQty;
                              });
                            } else {
                              const newValue = parseInt(inputValue, 10);
                              if (!isNaN(newValue)) {
                                handleQuantityChange(item.id, newValue);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // 失去焦点时，如果为空或无效，设置为1
                            const inputValue = e.target.value;
                            if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                              handleQuantityChange(item.id, 1);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-sm text-stone-300 focus:outline-none focus:border-mystic-gold"
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
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm border border-stone-600"
          >
            {selectedItems.size === filteredItems.length
              ? '取消全选'
              : '全选当前'}
          </button>
          <button
            onClick={handleFeedAll}
            className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-orange-200 rounded text-sm border border-orange-600"
            title="喂养所有可喂养的物品（使用全部数量）"
          >
            喂养全部 ({allFeedableItems.reduce((sum, item) => sum + item.quantity, 0)} 件)
          </button>
          <span className="text-sm text-stone-400">
            已选择: {selectedItems.size} / {filteredItems.length} ({totalSelectedQuantity} 件)
          </span>
        </div>
        <button
          onClick={handleFeed}
          disabled={selectedItems.size === 0}
          className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
            selectedItems.size > 0
              ? 'bg-green-900 hover:bg-green-800 text-green-200 border border-green-700'
              : 'bg-stone-700 text-stone-500 cursor-not-allowed border border-stone-600'
          }`}
        >
          喂养选中 ({totalSelectedQuantity})
        </button>
      </div>

      {/* 物品列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center text-stone-500 py-10">
            没有可喂养的物品
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItems.has(item.id);
            const rarity = item.rarity || '普通';

            return (
              <div
                key={item.id}
                className={`p-3 rounded border flex flex-col gap-2 transition-colors ${
                  isSelected
                    ? 'bg-green-900/30 border-green-600'
                    : 'bg-ink-800 hover:bg-ink-700 border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleItem(item.id)}
                    className="mt-1"
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
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2 pl-8">
                    <label className="text-xs text-stone-400">喂养数量:</label>
                    <input
                      type="number"
                      min={1}
                      max={item.quantity}
                      value={item.quantity}
                      readOnly
                      className="w-20 px-2 py-1 bg-stone-800 border border-stone-600 rounded text-sm text-stone-300 cursor-not-allowed"
                      title="将使用全部数量进行喂养"
                    />
                    <span className="text-xs text-green-400 font-semibold">
                      全部喂养
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
    </Modal>
  );
};

export default BatchFeedModal;
