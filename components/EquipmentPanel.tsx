import React from 'react';
import { EquipmentSlot, Item } from '../types';
import { ShieldCheck, X } from 'lucide-react';
import { getItemStats } from '../utils/itemUtils';
import { getRarityColor, normalizeRarityValue } from '../utils/rarityUtils';
import { getEquipmentSlotConfig } from '../utils/equipmentUtils';

interface Props {
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  inventory: Item[];
  natalArtifactId?: string;
  onUnequip: (slot: EquipmentSlot) => void;
}

const EquipmentPanel: React.FC<Props> = ({
  equippedItems,
  inventory,
  natalArtifactId,
  onUnequip,
}) => {
  const getItemById = (id: string | undefined): Item | null => {
    if (!id) return null;
    return inventory.find((item) => item.id === id) || null;
  };

  // 使用统一的工具函数获取槽位配置
  const slotConfig = getEquipmentSlotConfig();

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
          const isNatal = item ? item.id === natalArtifactId : false;
          const stats = item ? getItemStats(item, isNatal) : null;
          const rarity = normalizeRarityValue(item?.rarity);
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

