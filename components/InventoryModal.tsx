
import React, { useState } from 'react';
import { Item, ItemType, ItemRarity, PlayerStats } from '../types';
import { X, Package, ShieldCheck, ArrowRight, Hammer } from 'lucide-react';
import { RARITY_MULTIPLIERS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedId: string | null;
  player: PlayerStats;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (item: Item) => void;
  onUpgradeItem: (item: Item) => void;
}

const InventoryModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  inventory, 
  equippedId,
  player,
  onUseItem,
  onEquipItem,
  onUnequipItem,
  onUpgradeItem
}) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

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
    if (!hoveredItem || !hoveredItem.isEquippable || hoveredItem.id === equippedId) return null;

    // 1. Get currently equipped stats
    let currentEquippedStats = { attack: 0, defense: 0, hp: 0 };
    if (equippedId) {
      const currentEquippedItem = inventory.find(i => i.id === equippedId);
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

  const comparison = calculateComparison();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-paper-800 w-full max-w-2xl rounded border border-stone-600 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
          <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Package size={20} /> 储物袋
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 bg-paper-800 flex-1">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center text-stone-500 py-10 font-serif">
              储物袋空空如也，快去历练一番吧！
            </div>
          ) : (
            inventory.map((item, idx) => {
              const isEquipped = item.id === equippedId;
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
                    
                    {item.effect && (
                      <div className="text-xs text-stone-400 mb-2 grid grid-cols-2 gap-1">
                        {stats.attack > 0 && <span>攻 +{stats.attack}</span>}
                        {stats.defense > 0 && <span>防 +{stats.defense}</span>}
                        {stats.hp > 0 && <span>血 +{stats.hp}</span>}
                        {stats.exp > 0 && <span>修 +{stats.exp}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex gap-1.5">
                    {item.isEquippable ? (
                      <>
                        {isEquipped ? (
                          <button 
                            onClick={() => onUnequipItem(item)}
                            className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors border border-stone-500"
                          >
                            卸下
                          </button>
                        ) : (
                          <button 
                            onClick={() => onEquipItem(item)}
                            className="flex-1 bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold text-xs py-2 rounded transition-colors border border-mystic-gold/50"
                          >
                            装备
                          </button>
                        )}
                        <button
                          onClick={() => onUpgradeItem(item)}
                          className="px-3 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs py-2 rounded transition-colors border border-stone-500"
                          title="强化"
                        >
                          <Hammer size={14} />
                        </button>
                      </>
                    ) : (
                      item.effect && (
                        <button 
                          onClick={() => onUseItem(item)}
                          className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors"
                        >
                          使用
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
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
