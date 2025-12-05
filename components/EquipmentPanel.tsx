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
          const showLevel =
            item && typeof item.level === 'number' && Number.isFinite(item.level) && item.level > 0;
          const reviveChances =
            item && typeof item.reviveChances === 'number' && Number.isFinite(item.reviveChances)
              ? item.reviveChances
              : undefined;

          return (
            <div
              key={slot}
              className={`relative border-2 rounded-lg p-2.5 h-[150px] flex flex-col ${
                item ? getRarityColor(rarity) : 'border-stone-700 bg-stone-800/50'
              }`}
            >
              <div className="text-[10px] text-stone-400 mb-1.5 shrink-0">{label}</div>

              {item ? (
                <>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="font-bold text-xs mb-0.5 text-stone-200 line-clamp-1">
                      {item.name}
                      {showLevel && (
                        <span className="text-[10px] text-stone-500 ml-1">+{item.level}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 mb-0.5 shrink-0">{rarity}</div>
                    {reviveChances !== undefined && reviveChances > 0 && (
                      <div className="text-[10px] text-yellow-400 mb-0.5 font-bold shrink-0">
                        💫 {reviveChances}次
                      </div>
                    )}
                    {reviveChances !== undefined && reviveChances <= 0 && (
                      <div className="text-[9px] text-stone-500 mb-0.5 shrink-0">
                        💫 已耗尽
                      </div>
                    )}
                    {stats && (
                      <div className="text-[10px] leading-tight space-y-0.5 flex-1 min-h-0 overflow-y-auto">
                        {stats.attack > 0 && <div className="text-red-400">攻+{stats.attack}</div>}
                        {stats.defense > 0 && <div className="text-blue-400">防+{stats.defense}</div>}
                        {stats.hp > 0 && <div className="text-green-400">血+{stats.hp}</div>}
                        {stats.spirit > 0 && <div className="text-purple-400">识+{stats.spirit}</div>}
                        {stats.physique > 0 && <div className="text-yellow-400">体+{stats.physique}</div>}
                        {stats.speed > 0 && <div className="text-cyan-400">速+{stats.speed}</div>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onUnequip(slot)}
                    className="mt-1.5 w-full px-1.5 py-0.5 bg-stone-700 hover:bg-stone-600 text-stone-200 text-[10px] rounded transition-colors flex items-center justify-center gap-1 shrink-0"
                  >
                    <X size={10} />
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

