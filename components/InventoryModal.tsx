import React, {
  useState,
  useMemo,
  useTransition,
  useCallback,
  memo,
} from 'react';
import Modal from './common/Modal';
import {
  Item,
  ItemType,
  ItemRarity,
  EquipmentSlot,
  RealmType,
} from '../types';
import {
  X,
  Package,
  ShieldCheck,
  Hammer,
  Trash2,
  Sparkles,
  ArrowUpDown,
  Trash,
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
  Wand,
  Lock,
  Unlock,
} from 'lucide-react';
import { REALM_ORDER, SPIRITUAL_ROOT_NAMES, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES, CULTIVATION_ARTS } from '../constants/index';
import EquipmentPanel from './EquipmentPanel';
import BatchDiscardModal from './BatchDiscardModal';
import BatchUseModal from './BatchUseModal';
import BatchDismantleModal from './BatchDismantleModal';
import {
  getRarityNameClasses,
  getRarityBorder,
  getRarityBadge,
  getRarityOrder,
  getRarityDisplayName,
  normalizeRarityValue,
} from '../utils/rarityUtils';
import { getItemStats, normalizeTypeLabel, calculateItemPower } from '../utils/itemUtils';
import {
  findEmptyEquipmentSlot,
  isItemEquipped as checkItemEquipped,
  findItemEquippedSlot,
  areSlotsInSameGroup,
  getEquipmentSlotsByType,
} from '../utils/equipmentUtils';
import { useDebounce } from '../hooks/useDebounce';
import { showConfirm } from '../utils/toastUtils';
import { formatValueChange, formatNumber } from '../utils/formatUtils';

// 模块级：避免每次渲染重新创建
const getItemCategory = (item: Item): ItemCategory => {
  const typeKey = String(item.type).toLowerCase();
  if (item.type === ItemType.Recipe || typeKey === 'recipe') return 'recipe';
  if (item.type === ItemType.AdvancedItem || typeKey === 'advanceditem' || typeKey === '进阶物品') return 'advancedItem';
  if (item.isEquippable || item.type === ItemType.Weapon || item.type === ItemType.Armor || item.type === ItemType.Artifact || item.type === ItemType.Accessory || item.type === ItemType.Ring || ['weapon', 'armor', 'artifact', 'accessory', 'ring'].includes(typeKey)) return 'equipment';
  if (item.type === ItemType.Pill || ['pill', 'elixir', 'potion'].includes(typeKey)) return 'pill';
  if (item.type === ItemType.Herb || typeKey === 'herb' || typeKey === '草药') return 'herb';
  const name = item.name;
  if (name.includes('合成石')) return 'synthesisStone';
  if (name.includes('草') || name.includes('花') || name.includes('参') || name.includes('芝')) return 'herb';
  return 'material';
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  natalArtifactId?: string;
  playerRealm: string;
  foundationTreasure?: string;
  heavenEarthEssence?: string;
  heavenEarthMarrow?: string;
  longevityRules?: string[];
  maxLongevityRules?: number;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item, slot: EquipmentSlot) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onBatchDiscard: (itemIds: string[]) => void;
  onBatchUse?: (itemIds: string[]) => void;
  onOrganizeInventory?: () => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
  onRefineAdvancedItem?: (item: Item) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

type ItemCategory = 'all' | 'equipment' | 'pill' | 'material' | 'herb' | 'synthesisStone' | 'recipe' | 'advancedItem';

// 物品项组件 - 使用 memo 优化性能
interface InventoryItemProps {
  item: Item;
  isNatal: boolean;
  canRefine: boolean;
  isEquipped: boolean;
  playerRealm: string;
  foundationTreasure?: string;
  heavenEarthEssence?: string;
  heavenEarthMarrow?: string;
  longevityRules?: string[];
  maxLongevityRules?: number;
  onHover: (item: Item | null) => void;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (item: Item) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
  onRefineAdvancedItem?: (item: Item) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const InventoryItem = memo<InventoryItemProps>(
  ({
    item,
    isNatal,
    canRefine,
    isEquipped,
    playerRealm,
    foundationTreasure,
    heavenEarthEssence,
    heavenEarthMarrow,
    longevityRules,
    maxLongevityRules,
    onHover,
    onUseItem,
    onEquipItem,
    onUnequipItem,
    onUpgradeItem,
    onDiscardItem,
    onRefineNatalArtifact,
    onUnrefineNatalArtifact,
    onRefineAdvancedItem,
    setItemActionLog,
  }) => {
    // 使用统一的工具函数计算物品统计
    const stats = getItemStats(item, isNatal);
    const rarity = normalizeRarityValue(item.rarity);
    const rarityLabel = getRarityDisplayName(rarity);
    const typeLabel = normalizeTypeLabel(item.type, item);
    const showLevel =
      typeof item.level === 'number' && Number.isFinite(item.level) && item.level > 0;
    const reviveChances =
      typeof item.reviveChances === 'number' && Number.isFinite(item.reviveChances)
        ? item.reviveChances
        : undefined;

    return (
      <div
        className={`p-3 rounded border flex flex-col justify-between relative transition-colors ${isEquipped ? 'bg-ink-800 border-mystic-gold shadow-md' : `bg-ink-800 hover:bg-ink-700 ${getRarityBorder(rarity)}`}`}
        style={{ contain: 'layout style' }}
        onMouseEnter={() => onHover(item)}
        onMouseLeave={() => onHover(null)}
      >
        {isEquipped && (
          <div className="absolute top-2 right-2 text-mystic-gold bg-mystic-gold/10 px-2 py-0.5 rounded text-xs border border-mystic-gold/30 flex items-center gap-1">
            <ShieldCheck size={12} /> 已装备
          </div>
        )}

        <div>
          <div className="flex justify-between items-start pr-16 mb-1">
            <h4 className={getRarityNameClasses(rarity)}>
              {item.name}{' '}
              {showLevel && (
                <span className="text-stone-500 text-xs font-normal ml-1">
                  + {item.level}
                </span>
              )}
            </h4>
            <span className="text-xs bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded shrink-0 h-fit">
              x{item.quantity}
            </span>
          </div>

          <div className="flex gap-2 mb-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityBadge(rarity)}`}
            >
              {rarityLabel}
            </span>
            <span className="text-xs text-stone-500 py-0.5">{typeLabel}</span>
          </div>

          <p className="text-xs text-stone-500 italic mb-3">
            {item.description}
          </p>

          {/* 进阶物品效果显示 */}
          {item.type === ItemType.AdvancedItem && item.advancedItemType && item.advancedItemId && (() => {
            let advancedItemData: any = null;
            if (item.advancedItemType === 'foundationTreasure') {
              advancedItemData = FOUNDATION_TREASURES[item.advancedItemId];
            } else if (item.advancedItemType === 'heavenEarthEssence') {
              advancedItemData = HEAVEN_EARTH_ESSENCES[item.advancedItemId];
            } else if (item.advancedItemType === 'heavenEarthMarrow') {
              advancedItemData = HEAVEN_EARTH_MARROWS[item.advancedItemId];
            } else if (item.advancedItemType === 'longevityRule') {
              advancedItemData = LONGEVITY_RULES[item.advancedItemId];
            } else if (item.advancedItemType === 'soulArt') {
              advancedItemData = CULTIVATION_ARTS.find(art => art.id === item.advancedItemId);
            }

            if (advancedItemData && advancedItemData.effects) {
              const effects = advancedItemData.effects;
              const effectEntries: string[] = [];

              if (effects.hpBonus) effectEntries.push(`血+${effects.hpBonus}`);
              if (effects.attackBonus) effectEntries.push(`攻+${effects.attackBonus}`);
              if (effects.defenseBonus) effectEntries.push(`防+${effects.defenseBonus}`);
              if (effects.spiritBonus) effectEntries.push(`神识+${effects.spiritBonus}`);
              if (effects.physiqueBonus) effectEntries.push(`体魄+${effects.physiqueBonus}`);
              if (effects.speedBonus) effectEntries.push(`速度+${effects.speedBonus}`);

              // 支持功法格式
              if (effects.hp) effectEntries.push(`血+${effects.hp}`);
              if (effects.attack) effectEntries.push(`攻+${effects.attack}`);
              if (effects.defense) effectEntries.push(`防+${effects.defense}`);
              if (effects.spirit) effectEntries.push(`神识+${effects.spirit}`);
              if (effects.physique) effectEntries.push(`体魄+${effects.physique}`);
              if (effects.speed) effectEntries.push(`速度+${effects.speed}`);

              // 支持百分比格式 (规则之力)
              if (effects.hpPercent) effectEntries.push(`血+${Math.round(effects.hpPercent * 100)}%`);
              if (effects.attackPercent) effectEntries.push(`攻+${Math.round(effects.attackPercent * 100)}%`);
              if (effects.defensePercent) effectEntries.push(`防+${Math.round(effects.defensePercent * 100)}%`);
              if (effects.spiritPercent) effectEntries.push(`神识+${Math.round(effects.spiritPercent * 100)}%`);
              if (effects.physiquePercent) effectEntries.push(`体魄+${Math.round(effects.physiquePercent * 100)}%`);
              if (effects.speedPercent) effectEntries.push(`速度+${Math.round(effects.speedPercent * 100)}%`);

              return (
                <div className="text-xs mb-3 space-y-1">
                  {effectEntries.length > 0 && (
                    <div className="text-stone-400 grid grid-cols-2 gap-1">
                      {effectEntries.map((entry, idx) => (
                        <span key={idx}>{entry}</span>
                      ))}
                    </div>
                  )}
                  {effects.specialEffect && (
                    <div className="text-emerald-400 italic mt-1">
                      ✨ {effects.specialEffect}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* 材料用途说明 */}
          {item.type === ItemType.Material && (
            <div className="text-xs text-blue-400 mb-2 p-2 bg-blue-900/20 rounded border border-blue-800/50">
              <div className="font-bold mb-1">💡 用途说明：</div>
              <div className="space-y-0.5 text-blue-300">
                {item.name.includes('材料包') ? (
                  <div>• 使用后可获得对应品级的丹药材料</div>
                ) : item.name === '宗门宝库钥匙' ? (
                  <div>• 使用后可打开宗门宝库，选择一件物品带走</div>
                ) : null}
                {item.name.includes('炼器') || item.name.includes('石') || item.name.includes('铁') || item.name.includes('矿') ? (
                  <div>• 可用于强化法宝和装备</div>
                ) : null}
                {item.name.includes('草') || item.name.includes('花') || item.name.includes('参') || item.name.includes('芝') ? (
                  <div>• 可用于炼制丹药（查看丹方）</div>
                ) : null}
                {item.name.includes('内丹') || item.name.includes('妖丹') ? (
                  <div>• 可用于炼制丹药或喂养灵宠</div>
                ) : null}
                {item.name.includes('符') ? (
                  <div>• 可用于制作符箓或直接使用</div>
                ) : null}
                {!item.name.includes('材料包') && item.name !== '宗门宝库钥匙' && (
                  <div>• 可喂养灵宠获得经验</div>
                )}
                {!item.effect && !item.name.includes('材料包') && item.name !== '宗门宝库钥匙' && (
                  <div className="text-stone-400">• 此材料暂无直接使用效果</div>
                )}
              </div>
            </div>
          )}

          {isNatal && (
            <div className="text-xs text-mystic-gold mb-2 flex items-center gap-1">
              <Sparkles size={12} />
              <span className="font-bold">本命法宝（属性+50%）</span>
            </div>
          )}


          {reviveChances !== undefined && reviveChances > 0 && (
            <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1 font-bold">
              💫 保命机会：{reviveChances}次
            </div>
          )}
          {reviveChances !== undefined && reviveChances <= 0 && (
            <div className="text-[11px] text-stone-500 mb-2 flex items-center gap-1">
              💫 保命机会：已耗尽
            </div>
          )}

          {(item.effect || item.permanentEffect) && (
            <div className="text-xs mb-2 space-y-1">
              {/* 临时效果 */}
              {item.effect && (
                <div className="text-stone-400 grid grid-cols-2 gap-1">
                  {stats.attack > 0 && <span>攻 +{stats.attack}</span>}
                  {stats.defense > 0 && <span>防 +{stats.defense}</span>}
                  {stats.hp > 0 && <span>血 +{stats.hp}</span>}
                  {item.effect.exp && item.effect.exp > 0 && <span>修 +{Math.floor(item.effect.exp)}</span>}
                  {stats.spirit > 0 && <span>神识 +{stats.spirit}</span>}
                  {stats.physique > 0 && <span>体魄 +{stats.physique}</span>}
                  {stats.speed > 0 && <span>速度 +{stats.speed}</span>}
                  {item.effect.lifespan && item.effect.lifespan > 0 && <span>寿 +{Math.floor(item.effect.lifespan)}</span>}
                </div>
              )}
              {/* 永久效果 */}
              {item.permanentEffect && (
                <div className="text-emerald-400 grid grid-cols-2 gap-1">
                  {item.permanentEffect.attack && item.permanentEffect.attack > 0 && (
                    <span>✨ 攻永久 +{item.permanentEffect.attack}</span>
                  )}
                  {item.permanentEffect.defense && item.permanentEffect.defense > 0 && (
                    <span>✨ 防永久 +{item.permanentEffect.defense}</span>
                  )}
                  {item.permanentEffect.maxHp && item.permanentEffect.maxHp > 0 && (
                    <span>✨ 气血上限永久 +{item.permanentEffect.maxHp}</span>
                  )}
                  {item.permanentEffect.spirit && item.permanentEffect.spirit > 0 && (
                    <span>✨ 神识永久 +{item.permanentEffect.spirit}</span>
                  )}
                  {item.permanentEffect.physique && item.permanentEffect.physique > 0 && (
                    <span>✨ 体魄永久 +{item.permanentEffect.physique}</span>
                  )}
                  {item.permanentEffect.speed && item.permanentEffect.speed > 0 && (
                    <span>✨ 速度永久 +{item.permanentEffect.speed}</span>
                  )}
                  {item.permanentEffect.maxLifespan && item.permanentEffect.maxLifespan > 0 && (
                    <span>✨ 寿命上限永久 +{item.permanentEffect.maxLifespan}</span>
                  )}
                  {/* 灵根效果 */}
                  {item.permanentEffect.spiritualRoots && (() => {
                    const roots = item.permanentEffect.spiritualRoots;
                    const rootEntries: string[] = [];

                    if (roots.metal && roots.metal > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.metal}灵根+${roots.metal}`);
                    }
                    if (roots.wood && roots.wood > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.wood}灵根+${roots.wood}`);
                    }
                    if (roots.water && roots.water > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.water}灵根+${roots.water}`);
                    }
                    if (roots.fire && roots.fire > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.fire}灵根+${roots.fire}`);
                    }
                    if (roots.earth && roots.earth > 0) {
                      rootEntries.push(`${SPIRITUAL_ROOT_NAMES.earth}灵根+${roots.earth}`);
                    }

                    // 如果所有灵根提升相同，合并显示
                    if (rootEntries.length > 0) {
                      const allSame = rootEntries.every(entry => {
                        const match = entry.match(/\+(\d+)$/);
                        return match && match[1] === rootEntries[0].match(/\+(\d+)$/)?.[1];
                      });

                      if (allSame && rootEntries.length === 5) {
                        const value = rootEntries[0].match(/\+(\d+)$/)?.[1] || '0';
                        return <span className="col-span-2">✨ 所有灵根永久 +{value}</span>;
                      } else {
                        return rootEntries.map((entry, idx) => (
                          <span key={idx}>✨ {entry}永久</span>
                        ));
                      }
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex gap-1.5 flex-wrap">
          {item.isEquippable && item.equipmentSlot ? (
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
              {item.type === ItemType.Artifact && onRefineNatalArtifact && (() => {
                const isDisabled = !isNatal && !canRefine;

                return (
                  <button
                    onClick={() => {
                      if (isNatal && onUnrefineNatalArtifact) {
                        onUnrefineNatalArtifact();
                      } else if (!isNatal && canRefine) {
                        onRefineNatalArtifact(item);
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-3 text-xs py-2 rounded transition-colors border ${
                      isNatal
                        ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border-mystic-gold/50'
                        : isDisabled
                        ? 'bg-stone-800/50 text-stone-500 border-stone-700/50 cursor-not-allowed opacity-50'
                        : 'bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 border-purple-700/50'
                    }`}
                    title={
                      isNatal
                        ? '解除本命祭炼'
                        : isDisabled
                        ? '祭炼本命法宝需要达到金丹期境界'
                        : '祭炼为本命法宝'
                    }
                  >
                    <Sparkles size={14} />
                  </button>
                );
              })()}
              <button
                onClick={() => onUpgradeItem(item)}
                className="px-3 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs py-2 rounded transition-colors border border-stone-500"
                title="强化"
              >
                <Hammer size={14} />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-item-lock', { detail: { itemId: item.id } }))}
                className={`px-3 text-xs py-2 rounded transition-colors border ${item.locked ? 'bg-amber-900/30 border-amber-600 text-amber-300' : 'bg-stone-700 hover:bg-stone-600 text-stone-400 border-stone-500'}`}
                title={item.locked ? '解锁' : '锁定（锁定后不可丢弃/分解）'}
              >
                {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button
                onClick={() => onDiscardItem(item)}
                disabled={!!item.locked}
                className={`px-3 text-xs py-2 rounded transition-colors border ${item.locked ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed' : 'bg-red-900 hover:bg-red-800 text-red-200 border-red-700'}`}
                title={item.locked ? '已锁定，无法丢弃' : '丢弃'}
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              {(() => {
                // 判断物品是否可使用
                const isMaterialPack = item.name.includes('材料包') && item.type === ItemType.Material;
                const isTreasureVaultKey = item.name === '宗门宝库钥匙' && item.type === ItemType.Material;
                const hasEffect = item.effect || item.permanentEffect;
                const isRecipe = item.type === ItemType.Recipe;
                const isUsable = isMaterialPack || isTreasureVaultKey || (hasEffect && item.type !== ItemType.Material) || isRecipe;

                return isUsable ? (
                  <button
                    onClick={() => onUseItem(item)}
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors"
                  >
                    {item.type === ItemType.Recipe ? '研读' : '使用'}
                  </button>
                ) : null;
              })()}
              {item.type === ItemType.AdvancedItem && item.advancedItemType && onRefineAdvancedItem && (() => {
                const currentRealmIndex = REALM_ORDER.indexOf(playerRealm as RealmType);
                let canRefineItem = false;
                let warningMessage = '';
                let requiredRealmName = '';

                if (item.advancedItemType === 'foundationTreasure') {
                  requiredRealmName = '炼气期';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.QiRefining);
                  warningMessage = `炼化筑基奇物需要达到${requiredRealmName}境界\n当前境界：${playerRealm}`;
                } else if (item.advancedItemType === 'heavenEarthEssence') {
                  requiredRealmName = '金丹期';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore);
                  warningMessage = `炼化天地精华需要达到${requiredRealmName}境界\n当前境界：${playerRealm}`;
                } else if (item.advancedItemType === 'heavenEarthMarrow') {
                  requiredRealmName = '元婴期';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.NascentSoul);
                  warningMessage = `炼化天地之髓需要达到${requiredRealmName}境界\n当前境界：${playerRealm}`;
                } else if (item.advancedItemType === 'longevityRule') {
                  requiredRealmName = '合道期';
                  canRefineItem = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.DaoCombining);
                  warningMessage = `炼化规则之力需要达到${requiredRealmName}境界\n当前境界：${playerRealm}`;
                }

                // 检查是否已经拥有
                let alreadyOwned = false;
                let alreadyOwnedMessage = '';
                if (item.advancedItemType === 'foundationTreasure' && foundationTreasure) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = '你已经拥有筑基奇物，无法重复炼化';
                } else if (item.advancedItemType === 'heavenEarthEssence' && heavenEarthEssence) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = '你已经拥有天地精华，无法重复炼化';
                } else if (item.advancedItemType === 'heavenEarthMarrow' && heavenEarthMarrow) {
                  alreadyOwned = true;
                  alreadyOwnedMessage = '你已经拥有天地之髓，无法重复炼化';
                } else if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
                  if ((longevityRules || []).includes(item.advancedItemId)) {
                    alreadyOwned = true;
                    alreadyOwnedMessage = '你已经拥有该规则之力，无法重复炼化';
                  } else {
                    // 检查是否达到最大数量
                    const maxRules = maxLongevityRules || 3;
                    if ((longevityRules || []).length >= maxRules) {
                      alreadyOwned = true;
                      alreadyOwnedMessage = `你已经拥有${maxRules}个规则之力（已达上限），无法继续炼化`;
                    }
                  }
                }

                // 生成完整的提示信息
                const tooltipMessage = alreadyOwned
                  ? alreadyOwnedMessage
                  : !canRefineItem
                  ? warningMessage
                  : '炼化进阶物品';

                return (
                  <button
                    onClick={() => {
                      if (!canRefineItem) {
                        if (setItemActionLog) {
                          setItemActionLog({ text: warningMessage.replace(/\n/g, ' '), type: 'danger' });
                        }
                        return;
                      }
                      if (alreadyOwned) {
                        if (setItemActionLog) {
                          setItemActionLog({ text: alreadyOwnedMessage, type: 'danger' });
                        }
                        return;
                      }
                      // 二次确认，特别是筑基奇物炼化后不可修改
                      const confirmMessage = item.advancedItemType === 'foundationTreasure'
                        ? `确定要炼化【${item.name}】吗？\n\n⚠️ 警告：筑基奇物炼化后将无法修改，请谨慎选择！`
                        : `确定要炼化【${item.name}】吗？`;
                      showConfirm(
                        confirmMessage,
                        '确认炼化',
                        () => {
                          onRefineAdvancedItem(item);
                        }
                      );
                    }}
                    disabled={!canRefineItem || alreadyOwned}
                    className={`flex-1 text-xs py-2 rounded transition-colors border ${
                      !canRefineItem || alreadyOwned
                        ? 'bg-stone-800/50 text-stone-500 border-stone-700/50 cursor-not-allowed opacity-50'
                        : 'bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 border-purple-700/50'
                    }`}
                    title={tooltipMessage}
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    炼化
                  </button>
                );
              })()}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-item-lock', { detail: { itemId: item.id } }))}
                className={`px-3 text-xs py-2 rounded transition-colors border ${item.locked ? 'bg-amber-900/30 border-amber-600 text-amber-300' : 'bg-stone-700 hover:bg-stone-600 text-stone-400 border-stone-500'}`}
                title={item.locked ? '解锁' : '锁定（锁定后不可丢弃/分解）'}
              >
                {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button
                onClick={() => onDiscardItem(item)}
                disabled={!!item.locked}
                className={`px-3 text-xs py-2 rounded transition-colors border ${item.locked ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed' : 'bg-red-900 hover:bg-red-800 text-red-200 border-red-700'}`}
                title={item.locked ? '已锁定，无法丢弃' : '丢弃'}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 只有关键属性变化时才重新渲染
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.level === nextProps.item.level &&
      prevProps.item.rarity === nextProps.item.rarity &&
      prevProps.item.reviveChances === nextProps.item.reviveChances &&
      prevProps.item.locked === nextProps.item.locked &&
      prevProps.isEquipped === nextProps.isEquipped &&
      prevProps.isNatal === nextProps.isNatal &&
      prevProps.canRefine === nextProps.canRefine &&
      prevProps.playerRealm === nextProps.playerRealm &&
      prevProps.foundationTreasure === nextProps.foundationTreasure &&
      prevProps.heavenEarthEssence === nextProps.heavenEarthEssence &&
      prevProps.heavenEarthMarrow === nextProps.heavenEarthMarrow &&
      prevProps.longevityRules === nextProps.longevityRules &&
      prevProps.maxLongevityRules === nextProps.maxLongevityRules
    );
  }
);

InventoryItem.displayName = 'InventoryItem';

const InventoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  natalArtifactId,
  playerRealm,
  foundationTreasure,
  heavenEarthEssence,
  heavenEarthMarrow,
  longevityRules,
  maxLongevityRules,
  onUseItem,
  onEquipItem,
  onUnequipItem,
  onUpgradeItem,
  onDiscardItem,
  onBatchDiscard,
  onBatchUse,
  onOrganizeInventory,
  onRefineNatalArtifact,
  onUnrefineNatalArtifact,
  onRefineAdvancedItem,
  setItemActionLog,
}) => {
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [showEquipment, setShowEquipment] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<
    EquipmentSlot | 'all'
  >('all');
  const [sortByRarity, setSortByRarity] = useState(true);
  const [isBatchDiscardOpen, setIsBatchDiscardOpen] = useState(false);
  const [isBatchUseOpen, setIsBatchUseOpen] = useState(false);
  const [isBatchDismantleOpen, setIsBatchDismantleOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<
    'equipment' | 'inventory'
  >('inventory');
  // 搜索和高级筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [statFilter, setStatFilter] = useState<'all' | 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'>('all');
  const [statFilterMin, setStatFilterMin] = useState<number>(0);

  // 使用 useTransition 优化分类切换，避免阻塞UI
  const [isPending, startTransition] = useTransition();

  // 防抖搜索输入，减少不必要的重新渲染
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleBatchDiscard = (itemIds: string[]) => {
    onBatchDiscard(itemIds);
  };

  const handleBatchUse = (itemIds: string[]) => {
    if (onBatchUse) {
      onBatchUse(itemIds);
    }
  };

  // 使用 useCallback 优化分类切换处理函数
  const handleCategoryChange = useCallback((category: ItemCategory) => {
    startTransition(() => {
      setSelectedCategory(category);
      setSelectedEquipmentSlot('all');
    });
  }, []);

  const handleEquipmentSlotChange = useCallback(
    (slot: EquipmentSlot | 'all') => {
      startTransition(() => {
        setSelectedEquipmentSlot(slot);
      });
    },
    []
  );

  const handleHoverItem = useCallback((item: Item | null) => {
    setHoveredItem(item);
  }, []);

  const handleEquipWrapper = useCallback((item: Item) => {
    // 使用智能查找函数，自动找到对应的空槽位
    // 对于戒指、首饰、法宝，会优先查找空槽位
    // 对于其他装备类型，会使用对应的槽位（如果有空槽位则使用，否则替换已有装备）
    const targetSlot = findEmptyEquipmentSlot(item, equippedItems);

    if (targetSlot) {
      onEquipItem(item, targetSlot);
    }
    // 如果 findEmptyEquipmentSlot 返回 null，说明该物品无法装备（通常是缺少 equipmentSlot 且不是戒指/首饰/法宝）
  }, [equippedItems, onEquipItem]);

  const handleUnequipWrapper = useCallback((item: Item) => {
    const actualSlot = findItemEquippedSlot(item, equippedItems);
    if (actualSlot) {
      onUnequipItem(actualSlot);
    }
  }, [equippedItems, onUnequipItem]);

  // 一键装备：遍历所有槽位，自动装备最强装备
  const handleAutoEquip = useCallback(() => {
    if (!inventory || inventory.length === 0) return;
    const allSlots: EquipmentSlot[] = [
      EquipmentSlot.Weapon, EquipmentSlot.Head, EquipmentSlot.Shoulder,
      EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Legs, EquipmentSlot.Boots,
      EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4,
      EquipmentSlot.Accessory1, EquipmentSlot.Accessory2,
      EquipmentSlot.Artifact1, EquipmentSlot.Artifact2,
    ];
    const slotGroup = (s: EquipmentSlot): string =>
      s.startsWith('戒指') ? 'Ring' : s.startsWith('首饰') ? 'Accessory' : s.startsWith('法宝') ? 'Artifact' : s;
    const itemFitsSlot = (item: Item, slot: EquipmentSlot): boolean => {
      const slots = getEquipmentSlotsByType(item.type);
      return slots.length > 0 ? slots.includes(slot) : item.equipmentSlot === slot;
    };
    const groupSlots = (slot: EquipmentSlot): EquipmentSlot[] => {
      const t = slotGroup(slot);
      if (t === 'Ring') return [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4];
      if (t === 'Accessory') return [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
      if (t === 'Artifact') return [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
      return [slot];
    };
    const done = new Set<string>();
    const actions: Array<{ item: Item; slot: EquipmentSlot }> = [];
    for (const slot of allSlots) {
      const gk = slotGroup(slot);
      if (done.has(gk)) continue; done.add(gk);
      const gs = groupSlots(slot);
      let candidates = inventory.filter(i => i.isEquippable && i.effect && !checkItemEquipped(i, equippedItems) && itemFitsSlot(i, gs[0]));
      candidates.sort((a, b) => calculateItemPower(b, b.id === natalArtifactId) - calculateItemPower(a, a.id === natalArtifactId));
      const cur: Array<{ slot: EquipmentSlot; itemId: string; power: number }> = [];
      for (const s of gs) { const eid = equippedItems[s]; if (eid) { const ei = inventory.find(i => i.id === eid); if (ei) cur.push({ slot: s, itemId: eid, power: calculateItemPower(ei, eid === natalArtifactId) }); } }
      cur.sort((a, b) => a.power - b.power);
      if (gs.length === 1) {
        if (candidates.length > 0 && calculateItemPower(candidates[0], candidates[0].id === natalArtifactId) > (cur[0]?.power || 0)) {
          actions.push({ item: candidates[0], slot: gs[0] });
        }
      } else {
        let idx = 0;
        for (const s of gs) {
          const ce = cur.find(e => e.slot === s);
          if (idx < candidates.length && calculateItemPower(candidates[idx], candidates[idx].id === natalArtifactId) > (ce?.power || 0)) {
            actions.push({ item: candidates[idx], slot: s });
            if (ce) { const oi = inventory.find(i => i.id === ce.itemId); if (oi) { candidates.push(oi); candidates.sort((a, b) => calculateItemPower(b, b.id === natalArtifactId) - calculateItemPower(a, a.id === natalArtifactId)); } }
            idx++;
          }
        }
      }
    }
    if (actions.length > 0) { actions.forEach(a => onEquipItem(a.item, a.slot)); setItemActionLog?.({ text: `✨ 一键装备完成！已自动装备 ${actions.length} 件最优装备`, type: 'gain' }); }
    else setItemActionLog?.({ text: '当前装备已是最优配置', type: 'normal' });
  }, [inventory, equippedItems, natalArtifactId, onEquipItem, setItemActionLog]);

  // 预计算物品装备状态映射，避免在渲染时重复计算
  const itemEquippedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    inventory.forEach((item) => {
      map.set(item.id, checkItemEquipped(item, equippedItems));
    });
    return map;
  }, [inventory, equippedItems]);

  // 过滤和排序物品
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = inventory.filter(
        (item) => getItemCategory(item) === selectedCategory
      );
    }

    // 如果是装备分类，进一步按部位过滤（使用统一的工具函数）
    if (selectedCategory === 'equipment' && selectedEquipmentSlot !== 'all') {
      filtered = filtered.filter((item) => {
        if (!item.equipmentSlot) return false;
        // 使用工具函数检查槽位是否属于同一组
        return areSlotsInSameGroup(item.equipmentSlot, selectedEquipmentSlot);
      });
    }

    // 搜索过滤（按名称和描述）- 使用防抖后的搜索词
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    }

    // 稀有度过滤
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(
        (item) => normalizeRarityValue(item.rarity) === rarityFilter
      );
    }

    // 属性过滤 - 优化：只在需要时计算属性
    if (statFilter !== 'all' && statFilterMin > 0) {
      filtered = filtered.filter((item) => {
        const isNatal = item.id === natalArtifactId;
        const stats = getItemStats(item, isNatal);
        const statValue = stats[statFilter] || 0;
        return statValue >= statFilterMin;
      });
    }

    // 按品级排序（从高到低）
    if (sortByRarity) {
      filtered = [...filtered].sort((a, b) => {
        const rarityA = getRarityOrder(normalizeRarityValue(a.rarity));
        const rarityB = getRarityOrder(normalizeRarityValue(b.rarity));
        if (rarityB !== rarityA) {
          return rarityB - rarityA; // 品级从高到低
        }
        // 如果品级相同，按名称排序
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    }

    return filtered;
  }, [inventory, selectedCategory, selectedEquipmentSlot, sortByRarity, debouncedSearchQuery, rarityFilter, statFilter, statFilterMin, natalArtifactId]);

  // 计算所有已装备物品的总属性（使用统一的工具函数）
  const calculateTotalEquippedStats = useMemo(() => {
    let totalAttack = 0;
    let totalDefense = 0;
    let totalHp = 0;

    Object.values(equippedItems).forEach((itemId) => {
      if (itemId) {
        const item = inventory.find((i) => i.id === itemId);
        if (item) {
          // 使用统一的工具函数计算属性
          const isNatal = item.id === natalArtifactId;
          const stats = getItemStats(item, isNatal);

          totalAttack += stats.attack;
          totalDefense += stats.defense;
          totalHp += stats.hp;
        }
      }
    });

    return { attack: totalAttack, defense: totalDefense, hp: totalHp };
  }, [equippedItems, inventory, natalArtifactId]);

  // 获取物品统计信息（用于比较）- 使用统一的工具函数
  const getItemStatsForComparison = useCallback(
    (item: Item) => {
      const isNatal = item.id === natalArtifactId;
      return getItemStats(item, isNatal);
    },
    [natalArtifactId]
  );

  // 使用 useMemo 缓存装备比较结果，避免每次渲染都重新计算
  // 注意：必须在 if (!isOpen) return null; 之前调用，遵守 React Hooks 规则
  const comparison = useMemo(() => {
    if (!hoveredItem || !hoveredItem.isEquippable)
      return null;

    // 1. Get the slot to compare against
    let slot: EquipmentSlot | undefined = hoveredItem.equipmentSlot;

    // For items without equipmentSlot (like some Rings/Accessories/Artifacts),
    // try to find a relevant slot based on type
    if (!slot) {
      const slots = getEquipmentSlotsByType(hoveredItem.type);
      if (slots.length > 0) {
        // Find an empty slot or use the first one
        slot = slots.find(s => !equippedItems[s]) || slots[0];
      }
    }

    if (!slot) return null;

    // 2. Get currently equipped stats for this slot
    const currentEquippedId = equippedItems[slot];
    let currentEquippedStats = { attack: 0, defense: 0, hp: 0 };
    if (currentEquippedId) {
      const currentEquippedItem = inventory.find(
        (i) => i.id === currentEquippedId
      );
      if (currentEquippedItem) {
        currentEquippedStats = getItemStatsForComparison(currentEquippedItem);
      }
    }

    // 3. Get hovered item stats
    const hoveredStats = getItemStatsForComparison(hoveredItem);

    // 4. Calculate difference
    return {
      attack: hoveredStats.attack - currentEquippedStats.attack,
      defense: hoveredStats.defense - currentEquippedStats.defense,
      hp: hoveredStats.hp - currentEquippedStats.hp,
    };
  }, [hoveredItem, equippedItems, inventory, getItemStatsForComparison]);

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="储物袋"
      titleIcon={<Package size={18} className="md:w-5 md:h-5" />}
      size="full"
      containerClassName="md:max-w-6xl bg-paper-800 border-stone-600"
      headerClassName="bg-ink-800 border-b border-stone-600"
      contentClassName="bg-paper-800"
      disableScroll={false}
      showHeaderBorder={false}
      showFooterBorder={false}
      titleExtra={
        <div className="flex gap-2 items-center ml-auto md:ml-4">
            <button
              onClick={handleAutoEquip}
              className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-11 md:min-h-0 touch-manipulation bg-mystic-gold/20 border-mystic-gold text-mystic-gold hover:bg-mystic-gold/30"
              title="自动为每个槽位装备背包中战斗力最高的装备"
            >
              <div className="flex items-center">
                <Wand size={14} className="inline mr-1" />
                <span>一键装备</span>
              </div>
            </button>
            {onOrganizeInventory && (
              <button
                onClick={() => {
                  onOrganizeInventory();
                  setSortByRarity(false);
                }}
                className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-11 md:min-h-0 touch-manipulation bg-blue-900/20 border-blue-700 text-blue-300 hover:bg-blue-900/30"
                title="合并同类物品并按分类/品质排序"
              >
                <div className="flex items-center">
                  <ArrowUpDown size={14} className="inline mr-1" />
                  <span>整理背包</span>
                </div>
              </button>
            )}
            {onBatchUse && (
              <button
                onClick={() => setIsBatchUseOpen(true)}
                className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-11 md:min-h-0 touch-manipulation bg-green-900/20 border-green-700 text-green-300 hover:bg-green-900/30"
              >
                <div className="flex items-center">
                  <Zap size={14} className="inline mr-1" />
                  <span>批量使用</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setIsBatchDiscardOpen(true)}
              className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-11 md:min-h-0 touch-manipulation bg-red-900/20 border-red-700 text-red-300 hover:bg-red-900/30"
            >
              <div className="flex items-center">
                <Trash size={14} className="inline mr-1" />
                <span>批量丢弃</span>
              </div>
            </button>
            <button
              onClick={() => setIsBatchDismantleOpen(true)}
              className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-11 md:min-h-0 touch-manipulation bg-amber-900/20 border-amber-700 text-amber-300 hover:bg-amber-900/30"
              title="选择闲置装备分解为炼器石"
            >
              <div className="flex items-center">
                ⚒️ <span>批量分解</span>
              </div>
            </button>
            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className={`hidden md:flex items-center justify-center px-3 py-1 rounded text-sm border transition-colors ${
                showEquipment
                  ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                  : 'bg-stone-700 border-stone-600 text-stone-300'
              }`}
            >
              {showEquipment ? '隐藏' : '显示'}装备栏
            </button>
        </div>
      }
      subHeader={
        <div className="md:hidden border-b border-stone-600 bg-ink-800">
          <div className="flex">
            <button
              onClick={() => setMobileActiveTab('equipment')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                mobileActiveTab === 'equipment'
                  ? 'border-mystic-gold text-mystic-gold bg-mystic-gold/10'
                  : 'border-transparent text-stone-400 hover:text-stone-300'
              }`}
            >
              <ShieldCheck size={16} className="inline mr-2" />
              装备栏位
            </button>
            <button
              onClick={() => setMobileActiveTab('inventory')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                mobileActiveTab === 'inventory'
                  ? 'border-mystic-gold text-mystic-gold bg-mystic-gold/10'
                  : 'border-transparent text-stone-400 hover:text-stone-300'
              }`}
            >
              <Package size={16} className="inline mr-2" />
              背包
            </button>
          </div>
        </div>
      }
      // footer={
      //     <div className="flex items-center justify-center gap-4 min-h-12 text-sm font-serif w-full">
      //     {comparison ? (
      //       <div className="flex items-center gap-4">
      //         <span className="text-stone-400">装备预览:</span>
      //         {comparison.attack !== 0 && (
      //           <span
      //             className={`${comparison.attack > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
      //           >
      //             攻击 {formatValueChange(calculateTotalEquippedStats.attack, calculateTotalEquippedStats.attack + comparison.attack)}
      //           </span>
      //         )}
      //         {comparison.defense !== 0 && (
      //           <span
      //             className={`${comparison.defense > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
      //           >
      //             防御 {formatValueChange(calculateTotalEquippedStats.defense, calculateTotalEquippedStats.defense + comparison.defense)}
      //           </span>
      //         )}
      //         {comparison.hp !== 0 && (
      //           <span
      //             className={`${comparison.hp > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
      //           >
      //             气血 {formatValueChange(calculateTotalEquippedStats.hp, calculateTotalEquippedStats.hp + comparison.hp)}
      //           </span>
      //         )}
      //         {comparison.attack === 0 &&
      //           comparison.defense === 0 &&
      //           comparison.hp === 0 && (
      //             <span className="text-stone-500">属性无变化</span>
      //           )}
      //       </div>
      //     ) : (
      //       <div className="flex items-center gap-4">
      //         <span className="text-stone-400">装备预览:</span>
      //         {calculateTotalEquippedStats.attack > 0 && (
      //           <span className="text-mystic-jade">
      //             攻击 {formatNumber(calculateTotalEquippedStats.attack)}
      //           </span>
      //         )}
      //         {calculateTotalEquippedStats.defense > 0 && (
      //           <span className="text-mystic-jade">
      //             防御 {formatNumber(calculateTotalEquippedStats.defense)}
      //           </span>
      //         )}
      //         {calculateTotalEquippedStats.hp > 0 && (
      //           <span className="text-mystic-jade">
      //             气血 {formatNumber(calculateTotalEquippedStats.hp)}
      //           </span>
      //         )}
      //         {calculateTotalEquippedStats.attack === 0 &&
      //           calculateTotalEquippedStats.defense === 0 &&
      //           calculateTotalEquippedStats.hp === 0 && (
      //             <span className="text-stone-500">暂无装备</span>
      //           )}
      //       </div>
      //     )}
      //     </div>
      // }
      // footerClassName="p-3 border-t border-stone-600 bg-ink-900 rounded-b"
    >
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
          {/* 装备面板 */}
          {(showEquipment || mobileActiveTab === 'equipment') && (
            <div
              className={`w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-600 p-3 md:p-4 modal-scroll-container modal-scroll-content ${
                mobileActiveTab !== 'equipment' ? 'hidden md:block' : ''
              }`}
            >
              <EquipmentPanel
                equippedItems={equippedItems}
                inventory={inventory}
                natalArtifactId={natalArtifactId}
                onUnequip={onUnequipItem}
              />
            </div>
          )}

          {/* 物品列表 */}
          <div
            className={`${showEquipment ? 'w-full md:w-1/2' : 'w-full'} modal-scroll-container modal-scroll-content p-4 mb-6 flex flex-col ${
              mobileActiveTab !== 'inventory' ? 'hidden md:flex' : ''
            }`}
          >
            {/* 搜索和筛选 */}
            <div className="mb-2 flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索物品..." className="w-full pl-10 pr-4 py-2 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-gold text-sm" />
                {searchQuery && (<button title="清除搜索" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"><X size={16} /></button>)}
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                {(['all','equipment','pill','material','herb','synthesisStone','recipe','advancedItem'] as const).map(cat => {
                  const lbl: Record<string,string> = {all:'全部',equipment:'装备',pill:'丹药',material:'材料',herb:'草药',synthesisStone:'合成',recipe:'丹方',advancedItem:'进阶'};
                  return <button key={cat} onClick={() => handleCategoryChange(cat)} disabled={isPending} className={`px-2 py-1 rounded text-xs border transition-colors ${selectedCategory===cat?'bg-mystic-gold/20 border-mystic-gold text-mystic-gold':'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'} ${isPending?'opacity-50':''}`}>{lbl[cat]}</button>;
                })}
                <span className="text-xs text-stone-500 ml-auto">{filteredAndSortedInventory.length} 件</span>
                <button onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${showAdvancedFilter||rarityFilter!=='all'||statFilter!=='all'?'bg-purple-900/30 border-purple-600 text-purple-300':'bg-stone-700 border-stone-600 text-stone-400 hover:text-stone-200'}`}><SlidersHorizontal size={12} />筛选{(rarityFilter!=='all'||statFilter!=='all')&&<span className="bg-purple-600 text-white text-[10px] px-1 rounded">●</span>}</button>
              </div>
              {showAdvancedFilter && (
                <div className="bg-stone-800 rounded p-3 border border-stone-600 space-y-2">
                  <div className="flex gap-1 items-center"><span className="text-xs text-stone-500 shrink-0 mr-1">品质:</span>{(['all','普通','稀有','传说','仙品'] as const).map(r => <button key={r} onClick={() => setRarityFilter(r)} className={`px-2 py-0.5 rounded text-[11px] border ${rarityFilter===r?'bg-mystic-gold/20 border-mystic-gold text-mystic-gold':'bg-stone-700 border-stone-600 text-stone-400 hover:text-stone-200'}`}>{r==='all'?'全部':r}</button>)}</div>
                  <div className="flex gap-1 items-center flex-wrap"><span className="text-xs text-stone-500 shrink-0 mr-1">属性:</span><select value={statFilter} onChange={e => setStatFilter(e.target.value as any)} className="px-2 py-0.5 bg-stone-700 border border-stone-600 rounded text-xs text-stone-200"><option value="all">全部</option><option value="attack">攻击</option><option value="defense">防御</option><option value="hp">气血</option><option value="spirit">神识</option><option value="physique">体魄</option><option value="speed">速度</option></select>{statFilter!=='all'&&<input type="number" min={0} value={statFilterMin} onChange={e => setStatFilterMin(Math.max(0,parseInt(e.target.value)||0))} placeholder="最小" className="w-14 px-2 py-0.5 bg-stone-700 border border-stone-600 rounded text-xs text-stone-200" />}</div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setSortByRarity(!sortByRarity)} className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${sortByRarity?'bg-blue-900/20 border-blue-600 text-blue-300':'bg-stone-700 border-stone-600 text-stone-400'}`}><ArrowUpDown size={12} />{sortByRarity?'品质':'默认'}</button>
                    <button onClick={() => {setRarityFilter('all');setStatFilter('all');setStatFilterMin(0);}} className="px-2 py-0.5 rounded text-[11px] bg-red-900/20 border border-red-700 text-red-300 hover:bg-red-900/30">清除</button>
                  </div>
                  {selectedCategory==='equipment'&&(
                    <div className="flex gap-1 flex-wrap"><span className="text-xs text-stone-500 shrink-0 mr-1">部位:</span>
                      {([EquipmentSlot.Weapon,EquipmentSlot.Head,EquipmentSlot.Shoulder,EquipmentSlot.Chest,EquipmentSlot.Gloves,EquipmentSlot.Legs,EquipmentSlot.Boots,'ring','accessory','artifact'] as const).map(s => {const sl = s==='ring'?'戒指':s==='accessory'?'首饰':s==='artifact'?'法宝':s;return <button key={s} onClick={() => handleEquipmentSlotChange(s as any)} disabled={isPending} className={`px-1.5 py-0.5 rounded text-[10px] border ${selectedEquipmentSlot===s?'bg-mystic-gold/20 border-mystic-gold text-mystic-gold':'bg-stone-700 border-stone-600 text-stone-400 hover:text-stone-200'} ${isPending?'opacity-50':''}`}>{sl}</button>;})}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 物品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto min-h-0">
              {filteredAndSortedInventory.length === 0 ? (
                <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                  {selectedCategory === 'all'
                    ? '储物袋空空如也，快去历练一番吧！'
                    : `当前分类暂无物品`}
                </div>
              ) : (() => {
                const realmIndex = REALM_ORDER.indexOf(playerRealm as RealmType);
                const goldenCoreIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
                const canRefineGlobal = realmIndex >= goldenCoreIndex;

                return filteredAndSortedInventory.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    isNatal={item.id === natalArtifactId}
                    canRefine={canRefineGlobal}
                    isEquipped={itemEquippedMap.get(item.id) || false}
                    playerRealm={playerRealm}
                    foundationTreasure={foundationTreasure}
                    heavenEarthEssence={heavenEarthEssence}
                    heavenEarthMarrow={heavenEarthMarrow}
                    longevityRules={longevityRules}
                    maxLongevityRules={maxLongevityRules}
                    onHover={handleHoverItem}
                    onUseItem={onUseItem}
                    onEquipItem={handleEquipWrapper}
                    onUnequipItem={handleUnequipWrapper}
                    onUpgradeItem={onUpgradeItem}
                    onDiscardItem={onDiscardItem}
                    onRefineNatalArtifact={onRefineNatalArtifact}
                    onUnrefineNatalArtifact={onUnrefineNatalArtifact}
                    onRefineAdvancedItem={onRefineAdvancedItem}
                    setItemActionLog={setItemActionLog}
                  />
                ));
              })()}
            </div>
          </div>
      </div>
    </Modal>

      <BatchDiscardModal
        isOpen={isBatchDiscardOpen}
        onClose={() => setIsBatchDiscardOpen(false)}
        inventory={inventory}
        equippedItems={equippedItems}
        onDiscardItems={handleBatchDiscard}
      />

      {onBatchUse && (
        <BatchUseModal
          isOpen={isBatchUseOpen}
          onClose={() => setIsBatchUseOpen(false)}
          inventory={inventory}
          equippedItems={equippedItems}
          onUseItems={handleBatchUse}
        />
      )}
      {isBatchDismantleOpen && (
        <BatchDismantleModal
          isOpen={isBatchDismantleOpen}
          onClose={() => setIsBatchDismantleOpen(false)}
          inventory={inventory}
          equippedItems={equippedItems}
          onDismantle={(itemIds, stoneCount) => {
            onBatchDiscard(itemIds);
            window.dispatchEvent(new CustomEvent('dismantle-equip', { detail: { stoneCount } }));
            setItemActionLog?.({ text: `⚒️ 分解完成，获得 ${stoneCount} 个炼器石`, type: 'gain' });
          }}
        />
      )}
    </>
  );
};

export default React.memo(InventoryModal);
