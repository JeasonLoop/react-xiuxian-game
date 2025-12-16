import React, {
  useState,
  useMemo,
  useTransition,
  useCallback,
  memo,
} from 'react';
import {
  Item,
  ItemType,
  ItemRarity,
  PlayerStats,
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
} from 'lucide-react';
import {  REALM_ORDER } from '../constants';
import EquipmentPanel from './EquipmentPanel';
import BatchDiscardModal from './BatchDiscardModal';
import BatchUseModal from './BatchUseModal';
import {
  getRarityNameClasses,
  getRarityBorder,
  getRarityBadge,
  getRarityOrder,
} from '../utils/rarityUtils';
import { getItemStats } from '../utils/itemUtils';
import {
  findEmptyEquipmentSlot,
  isItemEquipped as checkItemEquipped,
  findItemEquippedSlot,
  areSlotsInSameGroup,
} from '../utils/equipmentUtils';

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
  onBatchDiscard: (itemIds: string[]) => void;
  onBatchUse?: (itemIds: string[]) => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
}

type ItemCategory = 'all' | 'equipment' | 'pill' | 'consumable' | 'recipe';

// 物品项组件 - 使用 memo 优化性能
interface InventoryItemProps {
  item: Item;
  player: PlayerStats;
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  isEquipped: boolean;
  onHover: (item: Item | null) => void;
  onUseItem: (item: Item) => void;
  onEquipItem: (item: Item, slot: EquipmentSlot) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUpgradeItem: (item: Item) => void;
  onDiscardItem: (item: Item) => void;
  onRefineNatalArtifact?: (item: Item) => void;
  onUnrefineNatalArtifact?: () => void;
}

const InventoryItem = memo<InventoryItemProps>(
  ({
    item,
    player,
    equippedItems,
    isEquipped,
    onHover,
    onUseItem,
    onEquipItem,
    onUnequipItem,
    onUpgradeItem,
    onDiscardItem,
    onRefineNatalArtifact,
    onUnrefineNatalArtifact,
  }) => {
    // 使用统一的工具函数计算物品统计
    const isNatal = item.id === player.natalArtifactId;
    const stats = getItemStats(item, isNatal);
    const rarity = item.rarity || '普通';
    const showLevel =
      typeof item.level === 'number' && Number.isFinite(item.level) && item.level > 0;
    const reviveChances =
      typeof item.reviveChances === 'number' && Number.isFinite(item.reviveChances)
        ? item.reviveChances
        : undefined;

    // 使用统一的工具函数查找空槽位
    const handleEquip = useCallback(() => {
      if (!item.equipmentSlot) return;
      const targetSlot = findEmptyEquipmentSlot(item, equippedItems);
      if (targetSlot) {
        onEquipItem(item, targetSlot);
      }
    }, [item, equippedItems, onEquipItem]);

    return (
      <div
        className={`p-3 rounded border flex flex-col justify-between relative transition-colors ${isEquipped ? 'bg-ink-800 border-mystic-gold shadow-md' : `bg-ink-800 hover:bg-ink-700 ${getRarityBorder(item.rarity)}`}`}
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
            <h4 className={getRarityNameClasses(item.rarity)}>
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
              className={`text-[10px] px-1.5 py-0.5 rounded border ${getRarityBadge(item.rarity)}`}
            >
              {rarity}
            </span>
            <span className="text-xs text-stone-500 py-0.5">{item.type}</span>
          </div>

          <p className="text-xs text-stone-500 italic mb-3">
            {item.description}
          </p>

          {item.isNatal && (
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
                  {item.effect.exp && item.effect.exp > 0 && <span>修 +{item.effect.exp}</span>}
                  {stats.spirit > 0 && <span>神识 +{stats.spirit}</span>}
                  {stats.physique > 0 && <span>体魄 +{stats.physique}</span>}
                  {stats.speed > 0 && <span>速度 +{stats.speed}</span>}
                  {item.effect.lifespan && item.effect.lifespan > 0 && <span>寿 +{item.effect.lifespan}</span>}
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
                  onClick={() => {
                    // 使用统一的工具函数查找实际装备的槽位
                    const actualSlot = findItemEquippedSlot(item, equippedItems);
                    if (actualSlot) {
                      onUnequipItem(actualSlot);
                    }
                  }}
                  className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors border border-stone-500"
                >
                  卸下
                </button>
              ) : (
                <button
                  onClick={handleEquip}
                  className="flex-1 bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold text-xs py-2 rounded transition-colors border border-mystic-gold/50"
                >
                  装备
                </button>
              )}
              {item.type === ItemType.Artifact && onRefineNatalArtifact && (() => {
                // 检查境界要求：必须达到金丹期才能祭炼本命法宝
                const realmIndex = REALM_ORDER.indexOf(player.realm);
                const goldenCoreIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
                const canRefine = realmIndex >= goldenCoreIndex;
                const isDisabled = !item.isNatal && !canRefine;

                return (
                  <button
                    onClick={() => {
                      if (item.isNatal && onUnrefineNatalArtifact) {
                        onUnrefineNatalArtifact();
                      } else if (!item.isNatal && canRefine) {
                        onRefineNatalArtifact(item);
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-3 text-xs py-2 rounded transition-colors border ${
                      item.isNatal
                        ? 'bg-mystic-gold/20 hover:bg-mystic-gold/30 text-mystic-gold border-mystic-gold/50'
                        : isDisabled
                        ? 'bg-stone-800/50 text-stone-500 border-stone-700/50 cursor-not-allowed opacity-50'
                        : 'bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 border-purple-700/50'
                    }`}
                    title={
                      item.isNatal
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
                onClick={() => onDiscardItem(item)}
                className="px-3 bg-red-900 hover:bg-red-800 text-red-200 text-xs py-2 rounded transition-colors border border-red-700"
                title="丢弃"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              {(item.effect || item.type === ItemType.Recipe) &&
                item.type !== ItemType.Material && (
                  <button
                    onClick={() => onUseItem(item)}
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs py-2 rounded transition-colors"
                  >
                    {item.type === ItemType.Recipe ? '研读' : '使用'}
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
  }
);

InventoryItem.displayName = 'InventoryItem';

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
  onBatchDiscard,
  onBatchUse,
  onRefineNatalArtifact,
  onUnrefineNatalArtifact,
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

  // 过滤和排序物品
  const filteredAndSortedInventory = useMemo(() => {
    // 使用统一的工具函数获取品级排序权重

    // 判断物品分类
    const getItemCategory = (item: Item): ItemCategory => {
      if (item.type === ItemType.Recipe) {
        return 'recipe'; // 丹方单独分类
      }
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

    // 搜索过滤（按名称和描述）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    }

    // 稀有度过滤
    if (rarityFilter !== 'all') {
      filtered = filtered.filter((item) => item.rarity === rarityFilter);
    }

    // 属性过滤
    if (statFilter !== 'all' && statFilterMin > 0) {
      filtered = filtered.filter((item) => {
        const isNatal = item.id === player.natalArtifactId;
        const stats = getItemStats(item, isNatal);
        const statValue = stats[statFilter] || 0;
        return statValue >= statFilterMin;
      });
    }

    // 按品级排序（从高到低）
    if (sortByRarity) {
      filtered = [...filtered].sort((a, b) => {
        const rarityA = getRarityOrder(a.rarity);
        const rarityB = getRarityOrder(b.rarity);
        if (rarityB !== rarityA) {
          return rarityB - rarityA; // 品级从高到低
        }
        // 如果品级相同，按名称排序
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    }

    return filtered;
  }, [inventory, selectedCategory, selectedEquipmentSlot, sortByRarity, searchQuery, rarityFilter, statFilter, statFilterMin, player.natalArtifactId]);

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
          const isNatal = item.id === player.natalArtifactId;
          const stats = getItemStats(item, isNatal);

          totalAttack += stats.attack;
          totalDefense += stats.defense;
          totalHp += stats.hp;
        }
      }
    });

    return { attack: totalAttack, defense: totalDefense, hp: totalHp };
  }, [equippedItems, inventory, player.natalArtifactId]);

  // 获取物品统计信息（用于比较）- 使用统一的工具函数
  const getItemStatsForComparison = useCallback(
    (item: Item) => {
      const isNatal = item.id === player.natalArtifactId;
      return getItemStats(item, isNatal);
    },
    [player.natalArtifactId]
  );

  if (!isOpen) return null;

  const calculateComparison = () => {
    if (!hoveredItem || !hoveredItem.isEquippable || !hoveredItem.equipmentSlot)
      return null;

    // 1. Get currently equipped stats for this slot
    const slot = hoveredItem.equipmentSlot;
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

    // 2. Get hovered item stats
    const hoveredStats = getItemStatsForComparison(hoveredItem);

    // 3. Calculate difference
    return {
      attack: hoveredStats.attack - currentEquippedStats.attack,
      defense: hoveredStats.defense - currentEquippedStats.defense,
      hp: hoveredStats.hp - currentEquippedStats.hp,
    };
  };

  // 使用统一的工具函数检查物品是否已装备
  const isItemEquipped = (item: Item): boolean => {
    return checkItemEquipped(item, equippedItems);
  };

  const comparison = calculateComparison();

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-6xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Package size={18} className="md:w-5 md:h-5" /> 储物袋
          </h3>
          <div className="flex gap-2">
            {onBatchUse && (
              <button
                onClick={() => setIsBatchUseOpen(true)}
                className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation bg-green-900/20 border-green-700 text-green-300 hover:bg-green-900/30"
              >
                <div className="flex items-center">
                  <Zap size={14} className="inline mr-1" />
                  批量使用
                </div>
              </button>
            )}
            <button
              onClick={() => setIsBatchDiscardOpen(true)}
              className="px-2 md:px-3 py-1.5 md:py-1 rounded text-xs md:text-sm border transition-colors min-h-[44px] md:min-h-0 touch-manipulation bg-red-900/20 border-red-700 text-red-300 hover:bg-red-900/30"
            >
              <div className="flex items-center">
                <Trash size={14} className="inline mr-1" />
                批量丢弃
              </div>
            </button>
            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className={`hidden flex items-center justify-center md:flex px-3 py-1 rounded text-sm border transition-colors ${
                showEquipment
                  ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                  : 'bg-stone-700 border-stone-600 text-stone-300'
              }`}
            >
              {showEquipment ? '隐藏' : '显示'}装备栏
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="关闭"
              title="关闭"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 移动端Tab切换 */}
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

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 装备面板 */}
          {(showEquipment || mobileActiveTab === 'equipment') && (
            <div
              className={`w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-600 p-3 md:p-4 overflow-y-auto ${
                mobileActiveTab !== 'equipment' ? 'hidden md:block' : ''
              }`}
            >
              <EquipmentPanel
                equippedItems={equippedItems}
                inventory={inventory}
                player={player}
                onUnequip={onUnequipItem}
              />
            </div>
          )}

          {/* 物品列表 */}
          <div
            className={`${showEquipment ? 'w-full md:w-1/2' : 'w-full'} p-4 overflow-y-auto flex flex-col ${
              mobileActiveTab !== 'inventory' ? 'hidden md:flex' : ''
            }`}
          >
            {/* 搜索和筛选 */}
            <div className="mb-4 flex flex-col gap-3">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索物品名称或描述..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 筛选工具栏 */}
              <div className="flex gap-2 items-center flex-wrap">
                {/* 高级筛选按钮 */}
                <button
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-2 ${
                    showAdvancedFilter || rarityFilter !== 'all' || statFilter !== 'all'
                      ? 'bg-purple-900/20 border-purple-600 text-purple-300'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                  高级筛选
                  {(rarityFilter !== 'all' || statFilter !== 'all') && (
                    <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                      已启用
                    </span>
                  )}
                </button>

                {/* 稀有度快速筛选 */}
                <div className="flex gap-1">
                  {(['all', '普通', '稀有', '传说', '仙品'] as const).map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarity)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        rarityFilter === rarity
                          ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                          : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                      }`}
                    >
                      {rarity === 'all' ? '全部品质' : rarity}
                    </button>
                  ))}
                </div>

                {/* 排序按钮 */}
                <button
                  onClick={() => setSortByRarity(!sortByRarity)}
                  className={`ml-auto px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-2 ${
                    sortByRarity
                      ? 'bg-blue-900/20 border-blue-600 text-blue-300'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <ArrowUpDown size={16} />
                  {sortByRarity ? '按品质排序' : '不排序'}
                </button>
              </div>

              {/* 高级筛选面板 */}
              {showAdvancedFilter && (
                <div className="bg-stone-800 rounded p-4 border border-stone-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-purple-400" />
                    <h4 className="text-sm font-bold text-purple-300">高级筛选</h4>
                  </div>
                  <div className="flex-col gap-2">
                    <label className="block text-xs text-stone-400 mb-2">属性筛选</label>
                    <div className="flex items-center gap-2">
                      {/* 属性筛选 */}
                      <div>
                        <div className="flex gap-2 mb-2">
                          <select
                            value={statFilter}
                            onChange={(e) => {
                              setStatFilter(e.target.value as typeof statFilter);
                              if (e.target.value === 'all') setStatFilterMin(0);
                            }}
                            className="flex-1 px-2 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200"
                          >
                            <option value="all">全部属性</option>
                            <option value="attack">攻击力</option>
                            <option value="defense">防御力</option>
                            <option value="hp">气血</option>
                            <option value="spirit">神识</option>
                            <option value="physique">体魄</option>
                            <option value="speed">速度</option>
                          </select>
                        </div>
                        {statFilter !== 'all' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={statFilterMin}
                              onChange={(e) => setStatFilterMin(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="最小值"
                              className="w-full px-2 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm text-stone-200"
                            />
                          </div>
                        )}
                      </div>

                      {/* 清除筛选按钮 */}
                      <div className="flex items-start" style={{ marginTop: '-10px' }}>
                        <button
                          onClick={() => {
                            setRarityFilter('all');
                            setStatFilter('all');
                            setStatFilterMin(0);
                          }}
                          className="w-full px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700 text-red-300 rounded text-sm transition-colors"
                        >
                          清除所有筛选
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 分类标签 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCategoryChange('all')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  全部
                </button>
                <button
                  onClick={() => handleCategoryChange('equipment')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === 'equipment'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  装备
                </button>
                <button
                  onClick={() => handleCategoryChange('pill')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === 'pill'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  丹药
                </button>
                <button
                  onClick={() => handleCategoryChange('consumable')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === 'consumable'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  用品
                </button>
                <button
                  onClick={() => handleCategoryChange('recipe')}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    selectedCategory === 'recipe'
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                >
                  丹方
                </button>
              </div>
              {/* 装备部位细分（仅在装备分类时显示） */}
              {selectedCategory === 'equipment' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleEquipmentSlotChange('all')}
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === 'all'
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    全部装备
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Weapon)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Weapon
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    武器
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Head)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Head
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    头部
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Shoulder)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Shoulder
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    肩部
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Chest)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Chest
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    胸甲
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Gloves)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Gloves
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    手套
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Legs)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Legs
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    裤腿
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Boots)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Boots
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    鞋子
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Ring1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Ring1 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring2 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring3 ||
                      selectedEquipmentSlot === EquipmentSlot.Ring4
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    戒指
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Accessory1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Accessory1 ||
                      selectedEquipmentSlot === EquipmentSlot.Accessory2
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    首饰
                  </button>
                  <button
                    onClick={() =>
                      handleEquipmentSlotChange(EquipmentSlot.Artifact1)
                    }
                    disabled={isPending}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      selectedEquipmentSlot === EquipmentSlot.Artifact1 ||
                      selectedEquipmentSlot === EquipmentSlot.Artifact2
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    法宝
                  </button>
                </div>
              )}
              {/* 排序按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortByRarity(!sortByRarity)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-1.5 ${
                    sortByRarity
                      ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                      : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <ArrowUpDown size={14} />
                  {sortByRarity ? '按品级排序' : '原始顺序'}
                </button>
                <span className="text-xs text-stone-500">
                  {filteredAndSortedInventory.length} 件物品
                </span>
              </div>
            </div>

            {/* 物品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {filteredAndSortedInventory.length === 0 ? (
                <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                  {selectedCategory === 'all'
                    ? '储物袋空空如也，快去历练一番吧！'
                    : `当前分类暂无物品`}
                </div>
              ) : (
                filteredAndSortedInventory.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    player={player}
                    equippedItems={equippedItems}
                    isEquipped={isItemEquipped(item)}
                    onHover={handleHoverItem}
                    onUseItem={onUseItem}
                    onEquipItem={onEquipItem}
                    onUnequipItem={onUnequipItem}
                    onUpgradeItem={onUpgradeItem}
                    onDiscardItem={onDiscardItem}
                    onRefineNatalArtifact={onRefineNatalArtifact}
                    onUnrefineNatalArtifact={onUnrefineNatalArtifact}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stat Comparison Footer */}
        <div className="p-3 border-t border-stone-600 bg-ink-900 rounded-b text-sm font-serif">
          <div className="flex items-center justify-center gap-4 mb-2 min-h-[3rem]">
          {comparison ? (
            <div className="flex items-center gap-4">
              <span className="text-stone-400">装备预览:</span>
              {comparison.attack !== 0 && (
                <span
                  className={`${comparison.attack > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                >
                  攻击 {comparison.attack > 0 ? '+' : ''}
                  {comparison.attack}
                </span>
              )}
              {comparison.defense !== 0 && (
                <span
                  className={`${comparison.defense > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                >
                  防御 {comparison.defense > 0 ? '+' : ''}
                  {comparison.defense}
                </span>
              )}
              {comparison.hp !== 0 && (
                <span
                  className={`${comparison.hp > 0 ? 'text-mystic-jade' : 'text-mystic-blood'}`}
                >
                  气血 {comparison.hp > 0 ? '+' : ''}
                  {comparison.hp}
                </span>
              )}
              {comparison.attack === 0 &&
                comparison.defense === 0 &&
                comparison.hp === 0 && (
                  <span className="text-stone-500">属性无变化</span>
                )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-stone-400">装备预览:</span>
              {calculateTotalEquippedStats.attack > 0 && (
                <span className="text-mystic-jade">
                  攻击 +{calculateTotalEquippedStats.attack}
                </span>
              )}
              {calculateTotalEquippedStats.defense > 0 && (
                <span className="text-mystic-jade">
                  防御 +{calculateTotalEquippedStats.defense}
                </span>
              )}
              {calculateTotalEquippedStats.hp > 0 && (
                <span className="text-mystic-jade">
                  气血 +{calculateTotalEquippedStats.hp}
                </span>
              )}
              {calculateTotalEquippedStats.attack === 0 &&
                calculateTotalEquippedStats.defense === 0 &&
                calculateTotalEquippedStats.hp === 0 && (
                  <span className="text-stone-500">暂无装备</span>
                )}
            </div>
          )}
          </div>


        </div>
      </div>

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
    </div>
  );
};

export default InventoryModal;
