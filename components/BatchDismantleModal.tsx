import React, { useState, useMemo } from 'react';
import { Hammer, Filter, Check } from 'lucide-react';
import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { getRarityTextColor, getRarityBorder, getRarityDisplayName } from '../utils/rarityUtils';
import { normalizeTypeLabel } from '../utils/itemUtils';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  onDismantle: (itemIds: string[], stoneCount: number) => void;
}

type RarityFilter = 'all' | ItemRarity;

const STONE_PER_RARITY: Record<string, number> = {
  '普通': 1,
  '稀有': 3,
  '传说': 8,
  '仙品': 20,
};

const BatchDismantleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onDismantle,
}) => {
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 可分解装备：未装备 + 可装备类型
  const dismantlableItems = useMemo(() => {
    return inventory.filter(item => {
      if (!item.isEquippable) return false;
      if (Object.values(equippedItems).includes(item.id)) return false;
      if (item.locked) return false;
      if (selectedRarity !== 'all' && (item.rarity || '普通') !== selectedRarity) return false;
      return true;
    });
  }, [inventory, equippedItems, selectedRarity]);

  // 预计产出炼器石
  const totalStones = useMemo(() => {
    return dismantlableItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (STONE_PER_RARITY[item.rarity || '普通'] || 1) * (item.quantity || 1), 0);
  }, [dismantlableItems, selectedItems]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === dismantlableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(dismantlableItems.map(i => i.id)));
    }
  };

  const handleConfirm = () => {
    if (selectedItems.size === 0) return;
    onDismantle(Array.from(selectedItems), totalStones);
    setSelectedItems(new Set());
    onClose();
  };

  const rarityColor = (rarity?: ItemRarity) => {
    const colors: Record<string, string> = {
      '仙品': 'text-yellow-300', '传说': 'text-purple-300',
      '稀有': 'text-blue-300', '普通': 'text-stone-400',
    };
    return colors[rarity || '普通'] || 'text-stone-400';
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="批量分解" titleIcon={<Hammer size={18} />} size="lg" height="lg">
      <div className="space-y-3">
        {/* 说明 */}
        <div className="bg-amber-900/20 p-3 rounded border border-amber-700/50 text-xs text-amber-300">
          <p>选择要分解的闲置装备，分解后可获得<strong>炼器石</strong>（用于强化法宝）。</p>
          <p className="mt-1 text-amber-400/70">普通×1 · 稀有×3 · 传说×8 · 仙品×20</p>
        </div>

        {/* 筛选 */}
        <div className="flex gap-1 items-center">
          <Filter size={14} className="text-stone-500" />
          <span className="text-xs text-stone-500 mr-2">品质:</span>
          {(['all', '普通', '稀有', '传说', '仙品'] as const).map(r =>
            <button
              key={r}
              onClick={() => { setSelectedRarity(r); setSelectedItems(new Set()); }}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${selectedRarity === r ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold' : 'bg-stone-700 border-stone-600 text-stone-400 hover:text-stone-200'}`}
            >
              {r === 'all' ? '全部' : r}
            </button>
          )}
        </div>

        {/* 全选 */}
        {dismantlableItems.length > 0 && (
          <button onClick={toggleAll} className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1">
            <Check size={12} className={selectedItems.size === dismantlableItems.length ? 'text-mystic-gold' : ''} />
            {selectedItems.size === dismantlableItems.length ? '取消全选' : '全选'}
          </button>
        )}

        {/* 物品列表 */}
        <div className="max-h-[50vh] overflow-y-auto space-y-1">
          {dismantlableItems.length === 0 ? (
            <div className="text-center text-stone-500 py-8 text-sm">没有可分解的闲置装备</div>
          ) : (
            dismantlableItems.map(item => {
              const isSelected = selectedItems.has(item.id);
              const stones = STONE_PER_RARITY[item.rarity || '普通'] || 1;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full text-left p-2 rounded border text-xs flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-amber-900/30 border-amber-600' : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500 border-amber-400' : 'border-stone-500'}`}>
                    {isSelected && <Check size={10} className="text-stone-900" />}
                  </div>
                  <span className={`font-bold truncate flex-1 ${rarityColor(item.rarity)}`}>
                    {item.name}
                    {item.level && item.level > 0 && <span className="text-stone-500 ml-1">+{item.level}</span>}
                  </span>
                  <span className="text-stone-500 text-[10px] shrink-0">{getRarityDisplayName(item.rarity || '普通')}</span>
                  <span className="text-stone-500 text-[10px] shrink-0 hidden sm:inline">{normalizeTypeLabel(item.type, item)}</span>
                  <span className="text-amber-400 shrink-0">⚒️×{stones}</span>
                  <span className="text-stone-600 text-[10px]">×{item.quantity}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 底部确认 */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-700 mt-3">
        <span className="text-sm text-stone-400">
          已选 <span className="text-amber-400">{selectedItems.size}</span> 件 · 产出 <span className="text-amber-400">{totalStones}</span> 个炼器石
        </span>
        <button
          onClick={handleConfirm}
          disabled={selectedItems.size === 0}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-stone-900 rounded font-bold text-sm transition-colors"
        >
          确认分解
        </button>
      </div>
    </Modal>
  );
};

export default BatchDismantleModal;
