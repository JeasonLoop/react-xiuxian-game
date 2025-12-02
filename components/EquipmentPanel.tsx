import React from 'react';
import { EquipmentSlot, Item, PlayerStats } from '../types';
import { ShieldCheck, X } from 'lucide-react';
import { getItemStats } from '../utils/itemUtils';

interface Props {
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  inventory: Item[];
  player: PlayerStats;
  onUnequip: (slot: EquipmentSlot) => void;
}

const EquipmentPanel: React.FC<Props> = ({ equippedItems, inventory, player, onUnequip }) => {
  const getItemById = (id: string | undefined): Item | null => {
    if (!id) return null;
    return inventory.find(item => item.id === id) || null;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '稀有': return 'border-blue-600 bg-blue-900/20';
      case '传说': return 'border-purple-600 bg-purple-900/20';
      case '仙品': return 'border-yellow-600 bg-yellow-900/20';
      default: return 'border-stone-600 bg-stone-800';
    }
  };

  const slotConfig: { slot: EquipmentSlot; label: string; icon?: string }[] = [
    { slot: EquipmentSlot.Head, label: '头部' },
    { slot: EquipmentSlot.Shoulder, label: '肩部' },
    { slot: EquipmentSlot.Chest, label: '胸甲' },
    { slot: EquipmentSlot.Gloves, label: '手套' },
    { slot: EquipmentSlot.Legs, label: '裤腿' },
    { slot: EquipmentSlot.Boots, label: '鞋子' },
    { slot: EquipmentSlot.Ring1, label: '戒指1' },
    { slot: EquipmentSlot.Ring2, label: '戒指2' },
    { slot: EquipmentSlot.Ring3, label: '戒指3' },
    { slot: EquipmentSlot.Ring4, label: '戒指4' },
    { slot: EquipmentSlot.Accessory1, label: '首饰1' },
    { slot: EquipmentSlot.Accessory2, label: '首饰2' },
    { slot: EquipmentSlot.Artifact1, label: '法宝1' },
    { slot: EquipmentSlot.Artifact2, label: '法宝2' },
    { slot: EquipmentSlot.Weapon, label: '武器' },
  ];

  return (
    <div className="bg-stone-900 rounded-lg border border-stone-700 p-4">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ShieldCheck size={20} className="text-mystic-gold" />
        装备栏位
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {slotConfig.map(({ slot, label }) => {
          const itemId = equippedItems[slot];
          const item = getItemById(itemId);
          const isNatal = item ? item.id === player.natalArtifactId : false;
          const stats = item ? getItemStats(item, isNatal) : null;
          const rarity = item?.rarity || '普通';

          return (
            <div
              key={slot}
              className={`relative border-2 rounded-lg p-3 min-h-[100px] flex flex-col ${
                item ? getRarityColor(rarity) : 'border-stone-700 bg-stone-800/50'
              }`}
            >
              <div className="text-xs text-stone-400 mb-2">{label}</div>

              {item ? (
                <>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1 text-stone-200">
                      {item.name}
                      {item.level && item.level > 0 && (
                        <span className="text-xs text-stone-500 ml-1">+{item.level}</span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 mb-2">{rarity}</div>
                    {item.reviveChances && item.reviveChances > 0 && (
                      <div className="text-xs text-yellow-400 mb-1 font-bold">
                        💫 保命 {item.reviveChances}次
                      </div>
                    )}
                    {stats && (
                      <div className="text-xs space-y-0.5">
                        {stats.attack > 0 && <div className="text-red-400">攻 +{stats.attack}</div>}
                        {stats.defense > 0 && <div className="text-blue-400">防 +{stats.defense}</div>}
                        {stats.hp > 0 && <div className="text-green-400">血 +{stats.hp}</div>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onUnequip(slot)}
                    className="mt-2 w-full px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    卸下
                  </button>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-stone-600 text-xs">
                  空
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentPanel;

