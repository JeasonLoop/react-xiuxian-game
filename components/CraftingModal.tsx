import React, { useMemo, useState } from 'react';
import { PlayerStats, Recipe, Item, ItemType, EquipmentSlot, ItemRarity } from '../types';
import { PILL_RECIPES, DISCOVERABLE_RECIPES } from '../constants/index';
import { FlaskConical, CircleOff, Hammer, Combine, Trash2, Plus } from 'lucide-react';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onCraft: (recipe: Recipe) => Promise<void>;
  onCraftArtifact: (materials: Item[], customName: string, selectedSlot?: string) => Promise<void>;
  onFuseArtifact: (item1: Item, item2: Item, stone: Item, customName?: string) => Promise<void>;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const CraftingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onCraft,
  onCraftArtifact,
  onFuseArtifact,
  setItemActionLog,
}) => {
  const [activeTab, setActiveTab] = useState<'alchemy' | 'artifact'>('alchemy');
  const [artifactTab, setArtifactTab] = useState<'material' | 'fuse'>('material');

  // 材料合成状态
  const [selectedMaterials, setSelectedMaterials] = useState<Item[]>([]);
  const [customArtifactName, setCustomArtifactName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | '全部'>('全部');

  // 装备融合状态
  const [fuseItem1, setFuseItem1] = useState<Item | null>(null);
  const [fuseItem2, setFuseItem2] = useState<Item | null>(null);
  const [fuseStone, setFuseStone] = useState<Item | null>(null);
  const [customFuseName, setCustomFuseName] = useState('');
  const [fuseRarityFilter, setFuseRarityFilter] = useState<ItemRarity | '全部'>('全部');
  const [fuseSlotFilter, setFuseSlotFilter] = useState<string>('全部');

  const rarityColors: Record<string, string> = {
    '普通': 'border-stone-700/50 text-stone-400 bg-stone-900/20',
    '稀有': 'border-blue-800/50 text-blue-400 bg-blue-900/10',
    '传说': 'border-purple-800/50 text-purple-400 bg-purple-900/10',
    '仙品': 'border-mystic-gold/50 text-mystic-gold bg-mystic-gold/10',
  };

  const CRAFTABLE_SLOTS = [
    { value: '', label: '随机部位' },
    { value: EquipmentSlot.Weapon, label: '武器' },
    { value: EquipmentSlot.Chest, label: '胸甲' },
    { value: EquipmentSlot.Head, label: '头部' },
    { value: EquipmentSlot.Boots, label: '鞋子' },
    { value: EquipmentSlot.Accessory1, label: '首饰' },
    { value: EquipmentSlot.Artifact1, label: '法宝' },
  ];

  const countItem = (itemName: string) => {
    const item = player.inventory.find((i) => i.name === itemName);
    return item ? item.quantity : 0;
  };

  // 合并基础配方和已解锁的配方
  const availableRecipes = useMemo(() => {
    const unlockedRecipes = player.unlockedRecipes || [];
    const unlocked = DISCOVERABLE_RECIPES.filter((recipe) =>
      unlockedRecipes.includes(recipe.name)
    );
    return [...PILL_RECIPES, ...unlocked];
  }, [player.unlockedRecipes]);

  // 获取背包中可用于炼器的材料
  const materialItems = useMemo(() => {
    return player.inventory.filter(i => {
      const isMaterial =
        i.type === ItemType.Herb ||
        i.type === ItemType.Material ||
        i.type === ItemType.AdvancedItem;

      if (!isMaterial) return false;
      if (rarityFilter === '全部') return true;
      return i.rarity === rarityFilter;
    });
  }, [player.inventory, rarityFilter]);

  // 获取背包中可用于融合的装备
  const equippableItems = useMemo(() => {
    const equippedIds = Object.values(player.equippedItems);
    return player.inventory.filter(i => {
      // 必须是可装备物品
      if (!i.isEquippable) return false;
      // 必须未被装备
      if (equippedIds.includes(i.id)) return false;
      // 品级筛选
      if (fuseRarityFilter !== '全部' && i.rarity !== fuseRarityFilter) return false;
      // 槽位筛选
      if (fuseSlotFilter !== '全部') {
        // 对于特殊类型，只要类型匹配即可
        const isSpecialType = [ItemType.Ring, ItemType.Artifact, ItemType.Accessory].includes(i.type);
        if (isSpecialType) {
          // 获取当前筛选槽位对应的物品类型
          const getFilterType = (slot: string) => {
            if (slot === EquipmentSlot.Ring1) return ItemType.Ring;
            if (slot === EquipmentSlot.Artifact1) return ItemType.Artifact;
            if (slot === EquipmentSlot.Accessory1) return ItemType.Accessory;
            return null;
          };
          const filterType = getFilterType(fuseSlotFilter);
          if (filterType && i.type !== filterType) return false;
          if (!filterType && i.equipmentSlot !== fuseSlotFilter) return false;
        } else if (i.equipmentSlot !== fuseSlotFilter) {
          return false;
        }
      }

      return true;
    });
  }, [player.inventory, player.equippedItems, fuseRarityFilter, fuseSlotFilter]);

  // 获取背包中的合成石
  const synthesisStones = useMemo(() => {
    return player.inventory.filter(i => i.type === ItemType.ArtifactStone);
  }, [player.inventory]);

  const handleAddMaterial = (item: Item) => {
    if (selectedMaterials.length >= 8) return;

    // 检查已选数量是否超过拥有数量
    const alreadySelectedCount = selectedMaterials.filter(m => m.id === item.id).length;
    if (alreadySelectedCount >= item.quantity) return;

    // 创建一个副本，数量设为1
    const newItem = { ...item, quantity: 1 };
    setSelectedMaterials([...selectedMaterials, newItem]);
  };

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials.splice(index, 1);
    setSelectedMaterials(newMaterials);
  };

  const handleCraftArtifact = async () => {
    if (selectedMaterials.length < 4) return;
    await onCraftArtifact(selectedMaterials, customArtifactName, selectedSlot);
    setSelectedMaterials([]);
    setCustomArtifactName('');
    setSelectedSlot('');
  };

  // 品质等级映射：数字越大品质越高
  const getRarityLevel = (rarity?: ItemRarity): number => {
    const rarityLevels: Record<ItemRarity | '普通', number> = {
      '普通': 0,
      '稀有': 1,
      '传说': 2,
      '仙品': 3,
    };
    return rarityLevels[rarity || '普通'];
  };

  // 检查合成石品质是否满足要求
  const isStoneRarityValid = (): boolean => {
    if (!fuseItem1 || !fuseItem2 || !fuseStone) return false;
    const stoneLevel = getRarityLevel(fuseStone.rarity);
    const item1Level = getRarityLevel(fuseItem1.rarity);
    const item2Level = getRarityLevel(fuseItem2.rarity);
    return stoneLevel >= item1Level && stoneLevel >= item2Level;
  };

  const handleFuse = async () => {
    // 判断合成石等级要大于等于装备品质
    if (fuseItem1 && fuseItem2 && fuseStone) {
      // 检查品质要求
      if (!isStoneRarityValid()) {
        const maxRarity = getRarityLevel(fuseItem1.rarity) > getRarityLevel(fuseItem2.rarity)
          ? fuseItem1.rarity || '普通'
          : fuseItem2.rarity || '普通';
        if (setItemActionLog) {
          setItemActionLog({
            text: `合成石品质不足，需要 ${maxRarity} 或更高品质的合成石才能融合`,
            type: 'danger',
          });
        }
        return; // 品质不符合要求，不执行融合
      }
      await onFuseArtifact(fuseItem1, fuseItem2, fuseStone, customFuseName);
      setFuseItem1(null);
      setFuseItem2(null);
      setFuseStone(null);
      setCustomFuseName('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'alchemy' ? "丹房" : "炼器坊"}
      titleIcon={activeTab === 'alchemy' ? <FlaskConical size={18} /> : <Hammer size={18} />}
      size="4xl"
      height="2xl"
    >
      <div className="flex flex-col h-full">
        {/* Tab 切换 */}
        <div className="flex border-b border-stone-800 mb-4">
          <button
            onClick={() => setActiveTab('alchemy')}
            className={`px-6 py-2 font-serif font-bold transition-colors ${activeTab === 'alchemy' ? 'text-mystic-gold border-b-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            炼丹
          </button>
          <button
            onClick={() => setActiveTab('artifact')}
            className={`px-6 py-2 font-serif font-bold transition-colors ${activeTab === 'artifact' ? 'text-mystic-gold border-b-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            炼器
          </button>
        </div>

        {activeTab === 'alchemy' ? (
          /* 炼丹界面 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-y-auto pr-2">
            <div className="col-span-full mb-2 bg-ink-900/50 p-3 rounded border border-stone-700 text-sm text-stone-400 flex justify-between">
              <span>拥有灵石：<span className="text-mystic-gold font-bold">{player.spiritStones}</span></span>
              <span>炼丹乃逆天而行，需耗费心神与灵石。</span>
            </div>
            {availableRecipes.map((recipe, idx) => {
              const canAfford = player.spiritStones >= recipe.cost;
              let hasIngredients = true;
              return (
                <div key={idx} className="bg-ink-800 border border-stone-700 rounded p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-serif font-bold text-stone-200">{recipe.name}</h4>
                    <span className="text-xs bg-mystic-gold/10 text-mystic-gold border border-mystic-gold/30 px-2 py-0.5 rounded">丹药</span>
                  </div>
                  <p className="text-sm text-stone-500 italic mb-4 h-10 overflow-hidden">{recipe.result.description}</p>
                  <div className="bg-ink-900 p-2 rounded border border-stone-800 mb-4 flex-1">
                    <div className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-wider">所需材料</div>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing, i) => {
                        const owned = countItem(ing.name);
                        if (owned < ing.qty) hasIngredients = false;
                        return (
                          <li key={i} className="flex justify-between text-sm">
                            <span className="text-stone-300">{ing.name}</span>
                            <span className={owned >= ing.qty ? 'text-mystic-jade' : 'text-mystic-blood'}>{owned}/{ing.qty}</span>
                          </li>
                        );
                      })}
                      <li className="flex justify-between text-sm pt-1 border-t border-stone-800 mt-1">
                        <span className="text-stone-300">灵石消耗</span>
                        <span className={canAfford ? 'text-mystic-gold' : 'text-mystic-blood'}>{recipe.cost}</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => onCraft(recipe)}
                    disabled={!canAfford || !hasIngredients}
                    className={`w-full py-2 rounded font-serif font-bold text-sm flex items-center justify-center gap-2 transition-colors ${canAfford && hasIngredients ? 'bg-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/30 border border-mystic-gold' : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'}`}
                  >
                    {!canAfford || !hasIngredients ? <CircleOff size={16} /> : <FlaskConical size={16} />}
                    {canAfford && hasIngredients ? '开炉炼丹' : '材料不足'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* 炼器界面 */
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setArtifactTab('material')}
                className={`flex-1 py-1.5 rounded text-sm font-serif font-bold transition-all ${artifactTab === 'material' ? 'bg-mystic-gold text-ink-900 shadow-lg' : 'bg-ink-800 text-stone-500 border border-stone-700'}`}
              >
                材料合成
              </button>
              <button
                onClick={() => setArtifactTab('fuse')}
                className={`flex-1 py-1.5 rounded text-sm font-serif font-bold transition-all ${artifactTab === 'fuse' ? 'bg-mystic-gold text-ink-900 shadow-lg' : 'bg-ink-800 text-stone-500 border border-stone-700'}`}
              >
                装备融合
              </button>
            </div>

            {artifactTab === 'material' ? (
              /* 材料合成 */
              <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
                {/* 左侧：材料选择 */}
                <div className="flex-1 flex flex-col overflow-hidden bg-ink-900/50 p-3 rounded border border-stone-800">
                  <div className="flex justify-between items-center mb-2 border-b border-stone-800 pb-1">
                    <div className="text-sm font-bold text-stone-400">可选材料</div>
                    <div className="flex gap-1">
                      {['全部', '普通', '稀有', '传说', '仙品'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRarityFilter(r as any)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                            rarityFilter === r
                              ? 'bg-mystic-gold text-ink-900 border-mystic-gold'
                              : 'bg-ink-800 text-stone-500 border-stone-700 hover:border-stone-500'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 max-h-[480px]">
                    {materialItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddMaterial(item)}
                        className={`border p-2 rounded text-left hover:border-white/30 transition-all flex flex-col ${rarityColors[item.rarity || '普通']}`}
                      >
                        <div className="text-xs font-serif font-bold truncate">{item.name}</div>
                        <div className="text-[10px] opacity-60 flex justify-between">
                          <span>{item.rarity}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      </button>
                    ))}
                    {materialItems.length === 0 && <div className="col-span-full text-center py-10 text-stone-600 text-sm">暂无该品级材料</div>}
                  </div>
                </div>

                {/* 右侧：炼制区 */}
                <div className="flex-1 flex flex-col bg-ink-800 border border-stone-700 p-4 rounded relative">
                  <div className="text-center mb-4">
                    <h3 className="font-serif font-bold text-xl text-mystic-gold">造化炼器</h3>
                    <p className="text-xs text-stone-500">投入 4-8 种材料，炼制绝世神兵</p>
                  </div>

                  {/* 材料槽位 */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-ink-900 border-2 border-dashed border-stone-800 rounded flex items-center justify-center relative overflow-hidden">
                        {selectedMaterials[i] ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-1 group">
                            <span className="text-[10px] text-stone-300 text-center leading-tight truncate w-full">{selectedMaterials[i].name}</span>
                            <button
                              onClick={() => handleRemoveMaterial(i)}
                              className="absolute inset-0 bg-mystic-blood/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <Plus size={16} className="text-stone-800" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 命名与部位 */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">自定义名称 (可选)</label>
                      <input
                        type="text"
                        value={customArtifactName}
                        onChange={(e) => setCustomArtifactName(e.target.value)}
                        placeholder="输入法宝名称..."
                        className="w-full bg-ink-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 outline-none focus:border-mystic-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">预选部位 (可选)</label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full bg-ink-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 outline-none focus:border-mystic-gold appearance-none cursor-pointer"
                      >
                        {CRAFTABLE_SLOTS.map(slot => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCraftArtifact}
                    disabled={selectedMaterials.length < 4}
                    className={`w-full py-3 rounded font-serif font-bold text-lg flex items-center justify-center gap-2 transition-all ${selectedMaterials.length >= 4 ? 'bg-mystic-gold text-ink-900 hover:scale-105 active:scale-95 shadow-mystic-gold/20 shadow-lg' : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'}`}
                  >
                    <Hammer size={20} />
                    {selectedMaterials.length < 4 ? `还需 ${4 - selectedMaterials.length} 种材料` : '开炉炼器'}
                  </button>
                </div>
              </div>
            ) : (
              /* 装备融合 */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-ink-900/50 p-3 rounded border border-stone-700 text-xs text-stone-400 mb-4">
                  融合规则：选择两件<span className="text-mystic-gold">相同部位</span>的装备，配合对应的<span className="text-mystic-gold">装备合成石</span>。融合后将继承双方特殊效果，综合属性并获得额外提升。
                </div>

                <div className="flex gap-4 flex-1 overflow-hidden">
                      {/* 选择区域 */}
                      <div className="w-1/3 bg-ink-900/50 p-3 rounded border border-stone-800 flex flex-col overflow-hidden">
                        <div className="flex flex-col gap-2 mb-2 border-b border-stone-800 pb-2">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-bold text-stone-400">装备与合成石</div>
                            <div className="flex gap-1">
                              {['全部', '普通', '稀有', '传说', '仙品'].map((r) => (
                                <button
                                  key={r}
                                  onClick={() => setFuseRarityFilter(r as any)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                                    fuseRarityFilter === r
                                      ? 'bg-mystic-gold text-ink-900 border-mystic-gold'
                                      : 'bg-ink-800 text-stone-500 border-stone-700 hover:border-stone-500'
                                  }`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* 槽位筛选 */}
                          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                            {['全部', '武器', '胸甲', '头部', '鞋子', '首饰', '戒指', '法宝'].map((slotLabel) => {
                              const slotValueMap: Record<string, string> = {
                                '全部': '全部',
                                '武器': EquipmentSlot.Weapon,
                                '胸甲': EquipmentSlot.Chest,
                                '头部': EquipmentSlot.Head,
                                '鞋子': EquipmentSlot.Boots,
                                '首饰': EquipmentSlot.Accessory1,
                                '戒指': EquipmentSlot.Ring1,
                                '法宝': EquipmentSlot.Artifact1,
                              };
                              const val = slotValueMap[slotLabel];
                              return (
                                <button
                                  key={slotLabel}
                                  onClick={() => setFuseSlotFilter(val)}
                                  className={`px-2 py-0.5 rounded text-[10px] border whitespace-nowrap transition-all ${
                                    fuseSlotFilter === val
                                      ? 'bg-stone-200 text-ink-900 border-stone-200'
                                      : 'bg-ink-800 text-stone-500 border-stone-800 hover:border-stone-600'
                                  }`}
                                >
                                  {slotLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 overflow-y-auto pr-1 max-h-[480px]">
                          {/* 装备列表 */}
                      <div>
                        <div className="text-[10px] text-stone-500 mb-1">可选装备</div>
                            <div className="grid grid-cols-1 gap-2">
                              {equippableItems.map(item => {
                                const isSelected1 = fuseItem1?.id === item.id;
                                const isSelected2 = fuseItem2?.id === item.id;
                                const isSelected = isSelected1 || isSelected2;

                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      if (isSelected1) setFuseItem1(null);
                                      else if (isSelected2) setFuseItem2(null);
                                      else if (!fuseItem1) setFuseItem1(item);
                                      else if (!fuseItem2) setFuseItem2(item);
                                    }}
                                    className={`p-2 rounded text-left border transition-all ${
                                      isSelected
                                        ? 'border-mystic-gold bg-mystic-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                        : `${rarityColors[item.rarity || '普通']} hover:border-white/30`
                                    }`}
                                  >
                                    <div className="text-xs font-serif font-bold truncate">{item.name}</div>
                                    <div className="text-[10px] opacity-60 flex justify-between">
                                      <span>{item.equipmentSlot}</span>
                                      <span>{item.rarity}</span>
                                    </div>
                                  </button>
                                );
                              })}
                              {equippableItems.length === 0 && (
                                <div className="text-center py-4 text-stone-600 text-xs">
                                  {fuseRarityFilter === '全部' ? '暂无可融合装备' : `暂无${fuseRarityFilter}品级装备`}
                                </div>
                              )}
                            </div>
                      </div>
                      {/* 合成石列表 */}
                      <div>
                        <div className="text-[10px] text-stone-500 mb-1">可选合成石</div>
                        <div className="grid grid-cols-1 gap-2">
                              {synthesisStones.map(stone => (
                                <button
                                  key={stone.id}
                                  onClick={() => setFuseStone(stone)}
                                  className={`p-2 rounded text-left border transition-all ${
                                    fuseStone?.id === stone.id
                                      ? 'border-mystic-gold bg-mystic-gold/20'
                                      : `${rarityColors[stone.rarity || '普通']} hover:border-white/30`
                                  }`}
                                >
                                  <div className="text-xs font-serif font-bold truncate">{stone.name}</div>
                                  <div className="text-[10px] opacity-60 flex justify-between">
                                    <span>{stone.rarity}</span>
                                    <span>x{stone.quantity}</span>
                                  </div>
                                </button>
                              ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 融合展示 */}
                  <div className="flex-1 bg-ink-800 border border-stone-700 p-6 rounded flex flex-col items-center justify-center">
                    <div className="flex items-center gap-8 mb-8 w-full max-w-sm">
                      {/* 槽位1 */}
                      <div className={`flex-1 aspect-square bg-ink-900 border-2 rounded-lg flex flex-col items-center justify-center p-2 relative ${fuseItem1 ? 'border-mystic-gold shadow-lg shadow-mystic-gold/20' : 'border-stone-700'}`}>
                        {fuseItem1 ? (
                          <>
                            <div className="text-xs font-bold text-stone-200 text-center mb-1 truncate w-full">{fuseItem1.name}</div>
                            <div className="text-[10px] text-stone-500 mb-2">{fuseItem1.equipmentSlot}</div>

                            {/* 属性展示 */}
                            <div className="w-full space-y-0.5 mt-auto border-t border-stone-800 pt-1">
                              {Object.entries(fuseItem1.effect || {}).slice(0, 3).map(([key, val]) => {
                                const attrNames: Record<string, string> = {
                                  attack: '攻', defense: '防', hp: '血',
                                  spirit: '神', physique: '体', speed: '速'
                                };
                                return (
                                  <div key={key} className="flex justify-between text-[9px]">
                                    <span className="text-stone-500">{attrNames[key] || key}</span>
                                    <span className="text-mystic-gold">+{val}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <button onClick={() => setFuseItem1(null)} className="absolute -top-2 -right-2 bg-mystic-blood rounded-full p-1"><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <div className="text-xs text-stone-700">主装备</div>
                        )}
                      </div>

                      <Combine size={32} className="text-mystic-gold" />

                      {/* 槽位2 */}
                      <div className={`flex-1 aspect-square bg-ink-900 border-2 rounded-lg flex flex-col items-center justify-center p-2 relative ${fuseItem2 ? 'border-mystic-gold shadow-lg shadow-mystic-gold/20' : 'border-stone-700'}`}>
                        {fuseItem2 ? (
                          <>
                            <div className="text-xs font-bold text-stone-200 text-center mb-1 truncate w-full">{fuseItem2.name}</div>
                            <div className="text-[10px] text-stone-500 mb-2">{fuseItem2.equipmentSlot}</div>

                            {/* 属性展示 */}
                            <div className="w-full space-y-0.5 mt-auto border-t border-stone-800 pt-1">
                              {Object.entries(fuseItem2.effect || {}).slice(0, 3).map(([key, val]) => {
                                const attrNames: Record<string, string> = {
                                  attack: '攻', defense: '防', hp: '血',
                                  spirit: '神', physique: '体', speed: '速'
                                };
                                return (
                                  <div key={key} className="flex justify-between text-[9px]">
                                    <span className="text-stone-500">{attrNames[key] || key}</span>
                                    <span className="text-mystic-gold">+{val}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <button onClick={() => setFuseItem2(null)} className="absolute -top-2 -right-2 bg-mystic-blood rounded-full p-1"><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <div className="text-xs text-stone-700">副装备</div>
                        )}
                      </div>
                    </div>

                        {/* 合成石与命名 */}
                        <div className="flex items-center gap-6 mb-8">
                          <div className="w-24 aspect-square bg-ink-900 border-2 border-mystic-gold/30 rounded-full flex flex-col items-center justify-center p-2 relative">
                            {fuseStone ? (
                              <>
                                <div className="text-[10px] font-bold text-mystic-gold text-center">{fuseStone.name}</div>
                                <button onClick={() => setFuseStone(null)} className="absolute -top-2 -right-2 bg-mystic-blood rounded-full p-1"><Trash2 size={12} /></button>
                              </>
                            ) : (
                              <div className="text-xs text-stone-700">合成石</div>
                            )}
                          </div>

                          <div className="w-48">
                            <label className="text-xs text-stone-500 mb-1 block">融合命名 (可选)</label>
                            <input
                              type="text"
                              value={customFuseName}
                              onChange={(e) => setCustomFuseName(e.target.value)}
                              placeholder="新神兵之名..."
                              className="w-full bg-ink-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 outline-none focus:border-mystic-gold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleFuse}
                          disabled={
                            !fuseItem1 ||
                            !fuseItem2 ||
                            !fuseStone ||
                            !(
                              fuseItem1.equipmentSlot === fuseItem2.equipmentSlot ||
                              (
                                fuseItem1.type === fuseItem2.type &&
                                [ItemType.Ring, ItemType.Artifact, ItemType.Accessory].includes(fuseItem1.type)
                              )
                            ) ||
                            !isStoneRarityValid()
                          }
                          className={`px-12 py-3 rounded-full font-serif font-bold text-lg flex items-center gap-2 transition-all ${
                            fuseItem1 &&
                            fuseItem2 &&
                            fuseStone &&
                            (
                              fuseItem1.equipmentSlot === fuseItem2.equipmentSlot ||
                              (
                                fuseItem1.type === fuseItem2.type &&
                                [ItemType.Ring, ItemType.Artifact, ItemType.Accessory].includes(fuseItem1.type)
                              )
                            ) &&
                            isStoneRarityValid()
                              ? 'bg-mystic-gold text-ink-900 hover:scale-110 shadow-mystic-gold/40 shadow-xl'
                              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                          }`}
                        >
                          万物融合
                        </button>
                        {fuseItem1 && fuseItem2 &&
                          !(
                            fuseItem1.equipmentSlot === fuseItem2.equipmentSlot ||
                            (
                              fuseItem1.type === fuseItem2.type &&
                              [ItemType.Ring, ItemType.Artifact, ItemType.Accessory].includes(fuseItem1.type)
                            )
                          ) && (
                          <div className="text-mystic-blood text-xs mt-2">种类或部位不匹配，无法融合</div>
                        )}
                        {fuseItem1 && fuseItem2 && fuseStone && !isStoneRarityValid() && (
                          <div className="text-mystic-blood text-xs mt-2">
                            合成石品质不足，需要 {fuseItem1.rarity || '普通'} 或更高品质的合成石
                          </div>
                        )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(CraftingModal);

