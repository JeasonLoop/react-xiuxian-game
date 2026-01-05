import React, { useMemo, useEffect, useCallback } from 'react';
import { PlayerStats, Item, ItemType, ItemRarity } from '../types';
import { LOOT_ITEMS } from '../services/battleService';
import { uid } from '../utils/gameUtils';
import { getRarityBadge } from '../utils/rarityUtils';
import { Package, Sparkles } from 'lucide-react';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onTakeItem: (item: Item) => void;
  onUpdateVault?: (vault: { items: Item[]; takenItemIds: string[] }) => void;
}

const SectTreasureVaultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onTakeItem,
  onUpdateVault,
}) => {
  // 生成宝库物品的辅助函数（使用 useCallback 避免不必要的重新创建）
  const generateVaultItems = useCallback((realm: string): Item[] => {
      const items: Item[] = [];
      const itemCount = 5 + Math.floor(Math.random() * 4); // 5-8个物品

      // 根据玩家境界决定稀有度分布
      const realmIndex = realm === '炼气期' ? 0 :
                        realm === '筑基期' ? 1 :
                        realm === '金丹期' ? 2 :
                        realm === '元婴期' ? 3 :
                        realm === '化神期' ? 4 :
                        realm === '合体期' ? 5 : 6;

      const rarityChances = {
        '仙品': Math.min(0.15 + realmIndex * 0.05, 0.4),
        '传说': Math.min(0.35 + realmIndex * 0.03, 0.6),
        '稀有': Math.min(0.4 - realmIndex * 0.02, 0.3),
        '普通': Math.max(0.1 - realmIndex * 0.01, 0.05),
      };

      const allItems = [
        ...LOOT_ITEMS.herbs,
        ...LOOT_ITEMS.pills,
        ...LOOT_ITEMS.materials,
        ...LOOT_ITEMS.weapons,
        ...LOOT_ITEMS.armors,
        ...LOOT_ITEMS.artifacts,
        ...LOOT_ITEMS.accessories,
      ];

      const selectedNames = new Set<string>();

      for (let i = 0; i < itemCount; i++) {
        const roll = Math.random();
        let targetRarity: ItemRarity = '普通';

        if (roll < rarityChances['仙品']) {
          targetRarity = '仙品';
        } else if (roll < rarityChances['仙品'] + rarityChances['传说']) {
          targetRarity = '传说';
        } else if (roll < rarityChances['仙品'] + rarityChances['传说'] + rarityChances['稀有']) {
          targetRarity = '稀有';
        } else {
          targetRarity = '普通';
        }

        // 筛选对应稀有度的物品
        let availableItems = allItems.filter(
          item => item.rarity === targetRarity && !selectedNames.has(item.name)
        );

        // 如果该稀有度没有可用物品，降级查找（但保持稀有度标签）
        if (availableItems.length === 0 && targetRarity !== '普通') {
          availableItems = allItems.filter(
            item => (item.rarity === '普通' || item.rarity === '稀有') && !selectedNames.has(item.name)
          );
        }

        // 如果还是没有，允许重复（但保持稀有度标签）
        if (availableItems.length === 0) {
          availableItems = allItems.filter(
            item => item.rarity === targetRarity || targetRarity === '普通'
          );
        }

        if (availableItems.length > 0) {
          const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          selectedNames.add(randomItem.name);

          // 创建物品对象
          const item: Item = {
            id: uid(),
            name: randomItem.name,
            type: randomItem.type,
            description: (randomItem as any).description || `${randomItem.name}，来自宗门宝库的珍藏。`,
            quantity: 1,
            rarity: randomItem.rarity,
            isEquippable: (randomItem as any).isEquippable,
            equipmentSlot: (randomItem as any).equipmentSlot,
            effect: (randomItem as any).effect,
            permanentEffect: (randomItem as any).permanentEffect,
          };

          items.push(item);
        }
      }

      return items;
  }, []);

  // 初始化或获取宗门宝库物品（根据玩家境界生成高质量物品）
  const vaultItems = useMemo(() => {
    // 如果宝库已存在且有物品，使用现有物品并过滤已拿取的
    if (player.sectTreasureVault && player.sectTreasureVault.items.length > 0) {
      const takenIds = new Set(player.sectTreasureVault.takenItemIds || []);
      return player.sectTreasureVault.items.filter(item => !takenIds.has(item.id));
    }

    // 否则返回空数组（由 useEffect 处理初始化）
    return [];
  }, [player.sectTreasureVault]);

  // 使用 useEffect 处理宝库初始化，避免在 useMemo 中使用副作用
  useEffect(() => {
    // 如果宝库为空且弹窗打开，生成新宝库
    if (isOpen && onUpdateVault && (!player.sectTreasureVault || player.sectTreasureVault.items.length === 0)) {
      const items = generateVaultItems(player.realm);
      if (items.length > 0) {
        onUpdateVault({
          items,
          takenItemIds: [],
        });
      }
    }
  }, [isOpen, player.realm, player.sectTreasureVault, onUpdateVault, generateVaultItems]);

  // 计算宝库统计信息
  const vaultStats = useMemo(() => {
    if (!player.sectTreasureVault) {
      return { total: 0, taken: 0, remaining: 0 };
    }
    const total = player.sectTreasureVault.items.length;
    const taken = player.sectTreasureVault.takenItemIds?.length || 0;
    const remaining = total - taken;
    return { total, taken, remaining };
  }, [player.sectTreasureVault]);

  const footer = (
    <button
      onClick={onClose}
      className="w-full px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded transition-colors"
    >
      关闭
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          宗门宝库
          <Sparkles size={16} className="text-yellow-400" />
        </span>
      }
      titleIcon={<Package size={20} />}
      size="4xl"
      height="full"
      zIndex={70}
      containerClassName="border-2 border-mystic-gold"
      footer={footer}
    >
      <div className="mb-4 text-stone-300 text-sm">
        <p className="mb-2">✨ 这里是宗门历代积累的珍藏，你可以选择一件物品带走。</p>
        <p className="text-stone-400">宝库中的物品品质与你的境界相关，境界越高，获得高品质物品的概率越大。</p>
        {vaultStats.total > 0 && (
          <p className="text-stone-500 text-xs mt-2">
            剩余物品：{vaultStats.remaining}/{vaultStats.total}（已拿取：{vaultStats.taken}）
          </p>
        )}
      </div>

      {vaultItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto text-stone-500 mb-4" size={48} />
          <p className="text-stone-400 text-lg mb-2">宝库已空</p>
          <p className="text-stone-500 text-sm">所有物品都已被取走</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaultItems.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 bg-stone-800/30 border-stone-400/50 hover:scale-105 transition-transform cursor-pointer ${
              item.rarity === '仙品' ? 'bg-yellow-900/30 border-yellow-400/50' :
              item.rarity === '传说' ? 'bg-purple-900/30 border-purple-400/50' :
              item.rarity === '稀有' ? 'bg-blue-900/30 border-blue-400/50' :
              'bg-stone-800/30 border-stone-400/50'
            }`}
            onClick={() => {
              onTakeItem(item);
              onClose();
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{item.name}</h4>
                  {item.rarity && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}>
                      {item.rarity}
                    </span>
                  )}
                  <span className="text-xs text-stone-400 px-2 py-0.5 rounded border border-stone-600">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-stone-300 mb-2">{item.description}</p>

                {item.effect && (
                  <div className="text-xs text-stone-400 space-y-1">
                    {item.effect.attack && <div>攻击 +{item.effect.attack}</div>}
                    {item.effect.defense && <div>防御 +{item.effect.defense}</div>}
                    {item.effect.hp && <div>气血 +{item.effect.hp}</div>}
                    {item.effect.spirit && <div>神识 +{item.effect.spirit}</div>}
                    {item.effect.physique && <div>体魄 +{item.effect.physique}</div>}
                    {item.effect.speed && <div>速度 +{item.effect.speed}</div>}
                    {item.effect.exp && <div>修为 +{item.effect.exp}</div>}
                  </div>
                )}

                {item.permanentEffect && (
                  <div className="text-xs text-yellow-400 space-y-1 mt-1">
                    {item.permanentEffect.attack && <div>✨ 攻击永久 +{item.permanentEffect.attack}</div>}
                    {item.permanentEffect.defense && <div>✨ 防御永久 +{item.permanentEffect.defense}</div>}
                    {item.permanentEffect.spirit && <div>✨ 神识永久 +{item.permanentEffect.spirit}</div>}
                    {item.permanentEffect.physique && <div>✨ 体魄永久 +{item.permanentEffect.physique}</div>}
                    {item.permanentEffect.speed && <div>✨ 速度永久 +{item.permanentEffect.speed}</div>}
                    {item.permanentEffect.maxHp && <div>✨ 气血上限永久 +{item.permanentEffect.maxHp}</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-700">
              <button
                className="w-full px-4 py-2 bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border border-mystic-gold rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onTakeItem(item);
                  onClose();
                }}
              >
                选择此物品
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </Modal>
  );
};

export default SectTreasureVaultModal;
