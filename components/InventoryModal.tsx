
import React, { useState } from 'react';
import { Item, ItemType, ItemRarity, PlayerStats, EquipmentSlot } from '../types';
import { X, Package, ShieldCheck, ArrowRight, Hammer, Trash2, Sparkles } from 'lucide-react';
import { RARITY_MULTIPLIERS } from '../constants';
import EquipmentPanel from './EquipmentPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  player: PlayerStats;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item, slot: EquipmentSlot) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
}

const InventoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  player,
  onUseItem,
  onEquipItem,
  onUnequipItem,
  onUpgradeItem,
  onDiscardItem,
  onRefineNatalArtifact,
  onUnrefineNatalArtifact,
}) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [showEquipment, setShowEquipment] = useState(true);

  if (!isOpen) return null;

  const getRarityNameClasses = (rarity: ItemRarity | undefined) => {
    const base = "font-bold transition-colors duration-300 cursor-default ";
    switch (rarity) {
      case '稀有': return base + "text-stone-300 hover:text-blue-400";
      case '传说': return base + "text-stone-300 hover:text-purple-400";
      case '仙品': return base + "text-stone-300 hover:text-mystic-gold hover:drop-shadow-[0_0_8px_rgba(203,161,53,0.5)]";
      default: return base + "text-stone-300 hover:text-stone-100";
    }
  };

  const getRarityBorder = (rarity: ItemRarity | undefined) => {
    switch (rarity) {
      case '稀有': return 'border-blue-800';
      case '传说': return 'border-purple-800';
      case '仙品': return 'border-mystic-gold';
      default: return 'border-stone-700';
    }
  };

  const getRarityBadge = (rarity: ItemRarity | undefined) => {
    switch (rarity) {
      case '稀有': return 'bg-blue-900/40 text-blue-300 border-blue-700';
      case '传说': return 'bg-purple-900/40 text-purple-300 border-purple-700';
      case '仙品': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700';
      default: return 'bg-stone-700 text-stone-400 border-stone-600';
    }
  };

  const getItemStats = (item: Item) => {
    const rarity = item.rarity || '普通';
    const multiplier = RARITY_MULTIPLIERS[rarity] || 1;

    return {
      attack: item.effect?.attack ? Math.floor(item.effect.attack * multiplier) : 0,
      defense: item.effect?.defense ? Math.floor(item.effect.defense * multiplier) : 0,
      hp: item.effect?.hp ? Math.floor(item.effect.hp * multiplier) : 0,
      exp: item.effect?.exp || 0 // Exp usually static
    };
  };

  const calculateComparison = () => {
    if (!hoveredItem || !hoveredItem.isEquippable || !hoveredItem.equipmentSlot) return null;

    // 1. Get currently equipped stats for this slot
    const slot = hoveredItem.equipmentSlot;
    const currentEquippedId = equippedItems[slot];
    let currentEquippedStats = { attack: 0, defense: 0, hp: 0 };
    if (currentEquippedId) {
      const currentEquippedItem = inventory.find(i => i.id === currentEquippedId);
      if (currentEquippedItem) {
        currentEquippedStats = getItemStats(currentEquippedItem);
      }
    }

    // 2. Get hovered item stats
    const hoveredStats = getItemStats(hoveredItem);

    // 3. Calculate difference
    return {
      attack: hoveredStats.attack - currentEquippedStats.attack,
      defense: hoveredStats.defense - currentEquippedStats.defense,
      hp: hoveredStats.hp - currentEquippedStats.hp
    };
  };

  const isItemEquipped = (item: Item): boolean => {
    if (!item.equipmentSlot) return false;
    return equippedItems[item.equipmentSlot] === item.id;
  };

  const comparison = calculateComparison();

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-6xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Package size={18} className="md:w-5 md:h-5" /> 储物袋
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className={`px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation ${
                showEquipment
                  ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                  : 'bg-stone-700 border-stone-600 text-stone-300'
              }`}
            >
              {showEquipment ? '隐藏' : '显示'}装备栏
            </button>
            <button onClick={onClose} className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 装备面板 */}
          {showEquipment && (
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-600 p-3 md:p-4 overflow-y-auto">
              <EquipmentPanel
                equippedItems={equippedItems}
                inventory={inventory}
                onUnequip={onUnequipItem}
              />
            </div>
          )}

          {/* 物品列表 */}
          <div className={`${showEquipment ? 'w-full md:w-1/2' : 'w-full'} p-4 overflow-y-auto`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.length === 0 ? (
                <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                  储物袋空空如也，快去历练一番吧！
                </div>
              ) : (
                inventory.map((item, idx) => {
              const isEquipped = isItemEquipped(item);
              const stats = getItemStats(item);
              const rarity = item.rarity || '普通';
              const level = item.level || 0;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`p-3 rounded border flex flex-col justify-between relative transition-colors ${isEquipped ? 'bg-ink-800 border-mystic-gold shadow-md' : `bg-ink-800 hover:bg-ink-700 ${getRarityBorder(item.rarity)}`}`}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {isEquipped && (
                    <div className="absolute top-2 right-2 text-mystic-gold bg-mystic-gold/10 px-2 py-0.5 rounded text-xs border border-mystic-gold/30 flex items-center gap-1">
                      <ShieldCheck size={12} /> 已装备
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start pr-16 mb-1">
                      <h4 className={getRarityNameClasses(item.rarity)}>
                        {item.name} {level > 0 && <span className="text-stone-500 text-xs font-normal ml-1">+ {level}</span>}
                      </h4>
                      <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded shrink-0 h-fit">x{item.quantity}</span>
                    </div>

                    <div className="flex gap-2 mb-2">
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}>
                        {rarity}
                      </span>
                      <span className="text-xs text-stone-500 py-0.5">{item.type}</span>
                    </div>

                    <p className="text-xs text-stone-500 italic mb-3">{item.description}</p>

                    {item.isNatal && (
                      <div className="text-xs text-mystic-gold mb-2 flex items-center gap-1">
                        <Sparkles size={12} />
                        <span className="font-bold">本命法宝（属性+50%）</span>
                      </div>
                    )}

                    {item.effect && (
                      <div className="text-xs text-stone-400 mb-2 grid grid-cols-2 gap-1">
                        {stats.attack > 0 && <span>攻 +{stats.attack}</span>}
                        {stats.defense > 0 && <span>防 +{stats.defense}</span>}
                        {stats.hp > 0 && <span>血 +{stats.hp}</span>}
                        {stats.exp > 0 && <span>修 +{stats.exp}</span>}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {item.isEquippable && item.equipmentSlot ? (
                      <>
                        {isEquipped ? (
                          <button
                            onClick={() => onUnequipItem(item.equipmentSlot!)}
                            className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors border border-stone-500"
                          >
                            卸下
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              // 对于戒指、首饰、法宝，自动找到第一个空槽位
                              let targetSlot = item.equipmentSlot!;
                              let hasEmptySlot = true;

                              if (item.type === ItemType.Ring) {
                                // 查找第一个空的戒指槽位
                                const ringSlots = [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4];
                                const emptyRingSlot = ringSlots.find(slot => !equippedItems[slot]);
                                if (emptyRingSlot) {
                                  targetSlot = emptyRingSlot;
                                } else {
                                  hasEmptySlot = false;
                                }
                              } else if (item.type === ItemType.Accessory) {
                                // 查找第一个空的首饰槽位
                                const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
                                const emptyAccessorySlot = accessorySlots.find(slot => !equippedItems[slot]);
                                if (emptyAccessorySlot) {
                                  targetSlot = emptyAccessorySlot;
                                } else {
                                  hasEmptySlot = false;
                                }
                              } else if (item.type === ItemType.Artifact) {
                                // 查找第一个空的法宝槽位
                                const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
                                const emptyArtifactSlot = artifactSlots.find(slot => !equippedItems[slot]);
                                if (emptyArtifactSlot) {
                                  targetSlot = emptyArtifactSlot;
                                } else {
                                  hasEmptySlot = false;
                                }
                              }

                              if (hasEmptySlot) {
                                onEquipItem(item, targetSlot);
                              } else {
                                // 如果没有空槽位，仍然尝试装备（会替换已装备的物品）
                                onEquipItem(item, targetSlot);
                              }
                            }}
                            className="flex-1 bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold text-xs py-2 rounded transition-colors border border-mystic-gold/50"
                          >
                            装备
                          </button>
                        )}
                        {/* 本命法宝祭炼按钮（仅对法宝显示） */}
                        {item.type === ItemType.Artifact && onRefineNatalArtifact && (
                          <button
                            onClick={() => {
                              if (item.isNatal && onUnrefineNatalArtifact) {
                                onUnrefineNatalArtifact();
                              } else if (!item.isNatal) {
                                onRefineNatalArtifact(item);
                              }
                            }}
                            className={`px-3 text-xs py-2 rounded transition-colors border ${
                              item.isNatal
                                ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border-mystic-gold/50'
                                : 'bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 border-purple-700/50'
                            }`}
                            title={item.isNatal ? '解除本命祭炼' : '祭炼为本命法宝'}
                          >
                            <Sparkles size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onUpgradeItem(item)}
                          className="px-3 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs py-2 rounded transition-colors border border-stone-500"
                          title="强化"
                        >
                          <Hammer size={14} />
                        </button>
                        <button
                          onClick={() => onDiscardItem(item)}
                          className="px-3 bg-red-900 hover:bg-red-800 text-red-200 text-xs py-2 rounded transition-colors border border-red-700"
                          title="丢弃"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        {item.effect && (
                          <button
                            onClick={() => onUseItem(item)}
                            className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors"
                          >
                            使用
                          </button>
                        )}
                        <button
                          onClick={() => onDiscardItem(item)}
                          className="px-3 bg-red-900 hover:bg-red-800 text-red-200 text-xs py-2 rounded transition-colors border border-red-700"
                          title="丢弃"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
                })
              )}
            </div>
          </div>
        </div>

        {/* Stat Comparison Footer */}
        <div className="p-3 border-t border-stone-600 bg-ink-900 rounded-b text-sm font-serif min-h-[3rem] flex items-center justify-center">
          {comparison ? (
            <div className="flex items-center gap-4">
               <span className="text-stone-400">装备预览:</span>
               {comparison.attack !== 0 && (
                 <span className={`${comparison.attack > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}>
                   攻击 {comparison.attack > 0 ? '+' : ''}{comparison.attack}
                 </span>
               )}
               {comparison.defense !== 0 && (
                 <span className={`${comparison.defense > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}>
                   防御 {comparison.defense > 0 ? '+' : ''}{comparison.defense}
                 </span>
               )}
               {comparison.hp !== 0 && (
                 <span className={`${comparison.hp > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}>
                   气血 {comparison.hp > 0 ? '+' : ''}{comparison.hp}
                 </span>
               )}
               {comparison.attack === 0 && comparison.defense === 0 && comparison.hp === 0 && (
                 <span className="text-stone-500">属性无变化</span>
               )}
            </div>
          ) : (
            <span className="text-stone-500">悬停装备查看属性变化</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
