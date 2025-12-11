import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Minus,
  Package,
  Sparkles,
  BookOpen,
  Award,
  Building2,
  MapPin,
  Trophy,
  Heart,
  FlaskConical,
  Scroll,
  Power,
  Skull,
} from 'lucide-react';
import {
  PlayerStats,
  RealmType,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
  Talent,
  Title,
  CultivationArt,
  PetTemplate,
  Achievement,
  Recipe,
  SectRank,
  Pet,
} from '../types';
import {
  REALM_DATA,
  REALM_ORDER,
  TALENTS,
  TITLES,
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  ACHIEVEMENTS,
  PILL_RECIPES,
  DISCOVERABLE_RECIPES,
  INITIAL_ITEMS,
  SECTS,
  SECRET_REALMS,
  EQUIPMENT_TEMPLATES,
  LOTTERY_PRIZES,
  SECT_SHOP_ITEMS,
} from '../constants';
import { LOOT_ITEMS } from '../services/battleService';
import { showSuccess, showError, showInfo, showConfirm } from '../utils/toastUtils';
import { getRarityTextColor } from '../utils/rarityUtils';

// 生成唯一ID
const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpdatePlayer: (updates: Partial<PlayerStats>) => void;
  onTriggerDeath?: () => void; // 触发死亡测试
}

const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  onTriggerDeath,
}) => {
  const [localPlayer, setLocalPlayer] = useState<PlayerStats>(player);
  const [activeTab, setActiveTab] = useState<
    | 'equipment'
    | 'talent'
    | 'title'
    | 'cultivation'
    | 'sect'
    | 'achievement'
    | 'pet'
    | 'item'
    | 'recipe'
    | 'death'
  >('equipment');

  // 当 player 更新时同步 localPlayer
  useEffect(() => {
    setLocalPlayer(player);
  }, [player]);
  const [equipmentFilter, setEquipmentFilter] = useState<ItemRarity | 'all'>(
    'all'
  );
  const [itemFilter, setItemFilter] = useState<ItemType | 'all'>('all');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // 过滤装备
  const filteredEquipment = useMemo(() => {
    if (equipmentFilter === 'all') return EQUIPMENT_TEMPLATES;
    return EQUIPMENT_TEMPLATES.filter((eq) => eq.rarity === equipmentFilter);
  }, [equipmentFilter]);

  // 合并所有物品列表
  const allItems = useMemo(() => {
    const items: Array<{
      name: string;
      type: ItemType;
      description: string;
      rarity?: ItemRarity;
      effect?: any;
      permanentEffect?: any;
      isEquippable?: boolean;
      equipmentSlot?: EquipmentSlot;
      level?: number;
    }> = [];
    const itemNames = new Set<string>(); // 用于去重

    // 从初始物品
    INITIAL_ITEMS.forEach((item) => {
      if (!itemNames.has(item.name)) {
        itemNames.add(item.name);
        items.push({
          name: item.name,
          type: item.type,
          description: item.description,
          rarity: item.rarity,
          effect: item.effect,
          permanentEffect: item.permanentEffect,
          isEquippable: item.isEquippable,
          equipmentSlot: item.equipmentSlot,
          level: item.level,
        });
      }
    });

    // 从丹药配方
    [...PILL_RECIPES, ...DISCOVERABLE_RECIPES].forEach((recipe) => {
      if (!itemNames.has(recipe.result.name)) {
        itemNames.add(recipe.result.name);
        items.push({
          name: recipe.result.name,
          type: recipe.result.type,
          description: recipe.result.description,
          rarity: recipe.result.rarity,
          effect: recipe.result.effect,
          permanentEffect: recipe.result.effect,
        });
      }
    });

    // 从抽奖奖品中提取物品
    LOTTERY_PRIZES.forEach((prize) => {
      if (prize.type === 'item' && prize.value.item) {
        const item = prize.value.item;
        if (!itemNames.has(item.name)) {
          itemNames.add(item.name);
          items.push({
            name: item.name,
            type: item.type,
            description: item.description,
            rarity: item.rarity,
            effect: item.effect,
            permanentEffect: item.permanentEffect,
            isEquippable: item.isEquippable,
            equipmentSlot: item.equipmentSlot,
            level: item.level,
          });
        }
      }
    });

    // 从宗门商店物品
    SECT_SHOP_ITEMS.forEach((shopItem) => {
      if (!itemNames.has(shopItem.item.name)) {
        itemNames.add(shopItem.item.name);
        items.push({
          name: shopItem.item.name,
          type: shopItem.item.type,
          description: shopItem.item.description,
          rarity: shopItem.item.rarity,
          effect: shopItem.item.effect,
          permanentEffect: shopItem.item.permanentEffect,
          isEquippable: shopItem.item.isEquippable,
          equipmentSlot: shopItem.item.equipmentSlot,
          level: shopItem.item.level,
        });
      }
    });

    // 从LOOT_ITEMS中提取草药
    LOOT_ITEMS.herbs.forEach((herb) => {
      if (!itemNames.has(herb.name)) {
        itemNames.add(herb.name);
        items.push({
          name: herb.name,
          type: herb.type,
          description: `稀有草药：${herb.name}`,
          rarity: herb.rarity,
          effect: herb.effect,
          permanentEffect: (herb as any).permanentEffect,
        });
      }
    });

    // 从LOOT_ITEMS中提取材料
    LOOT_ITEMS.materials.forEach((material) => {
      if (!itemNames.has(material.name)) {
        itemNames.add(material.name);
        items.push({
          name: material.name,
          type: material.type,
          description: `炼器材料：${material.name}`,
          rarity: material.rarity,
          permanentEffect: (material as any).permanentEffect,
        });
      }
    });

    // 从可发现配方中生成丹方物品
    DISCOVERABLE_RECIPES.forEach((recipe) => {
      const recipeItemName = `${recipe.name}丹方`;
      if (!itemNames.has(recipeItemName)) {
        itemNames.add(recipeItemName);
        items.push({
          name: recipeItemName,
          type: ItemType.Recipe,
          description: `记载了【${recipe.name}】炼制方法的古老丹方。使用后可学会炼制此丹药。`,
          rarity: recipe.result.rarity,
        });
      }
    });

    return items;
  }, []);

  // 过滤物品
  const filteredItems = useMemo(() => {
    if (itemFilter === 'all') return allItems;
    return allItems.filter((item) => item.type === itemFilter);
  }, [allItems, itemFilter]);

  if (!isOpen) return null;

  // 移除 handleSave，因为所有修改现在都直接生效

  const handleReset = () => {
    setLocalPlayer(player);
  };

  const updateField = <K extends keyof PlayerStats>(
    field: K,
    value: PlayerStats[K]
  ) => {
    setLocalPlayer((prev) => {
      const updated = { ...prev, [field]: value };
      // 直接更新到实际玩家状态
      onUpdatePlayer({ [field]: value });
      return updated;
    });
  };

  const adjustNumber = (
    field: keyof PlayerStats,
    delta: number,
    min: number = 0
  ) => {
    setLocalPlayer((prev) => {
      const current = prev[field] as number;
      const newValue = Math.max(min, current + delta);
      const updated = { ...prev, [field]: newValue };
      // 直接更新到实际玩家状态
      onUpdatePlayer({ [field]: newValue });
      return updated;
    });
  };

  const handleRealmChange = (newRealm: RealmType) => {
    const realmData = REALM_DATA[newRealm];
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        realm: newRealm,
        // 如果境界降低，调整相关属性
        maxHp: Math.max(prev.maxHp, realmData.baseMaxHp),
        hp: Math.min(prev.hp, Math.max(prev.maxHp, realmData.baseMaxHp)),
        attack: Math.max(prev.attack, realmData.baseAttack),
        defense: Math.max(prev.defense, realmData.baseDefense),
        spirit: Math.max(prev.spirit, realmData.baseSpirit),
        physique: Math.max(prev.physique, realmData.basePhysique),
        speed: Math.max(prev.speed, realmData.baseSpeed),
      };
      // 直接更新到实际玩家状态
      onUpdatePlayer({
        realm: updated.realm,
        maxHp: updated.maxHp,
        hp: updated.hp,
        attack: updated.attack,
        defense: updated.defense,
        spirit: updated.spirit,
        physique: updated.physique,
        speed: updated.speed,
      });
      return updated;
    });
  };

  const handleRealmLevelChange = (newLevel: number) => {
    const clampedLevel = Math.max(1, Math.min(9, newLevel));
    setLocalPlayer((prev) => {
      const updated = { ...prev, realmLevel: clampedLevel };
      // 直接更新到实际玩家状态
      onUpdatePlayer({ realmLevel: clampedLevel });
      return updated;
    });
  };

  // 添加装备到背包
  const handleAddEquipment = (template: (typeof EQUIPMENT_TEMPLATES)[0]) => {
    const newItem: Item = {
      id: uid(),
      name: template.name,
      type: template.type,
      description: (template as any).description || `${template.name}的装备`,
      quantity: 1,
      rarity: template.rarity,
      level: 0,
      isEquippable: true,
      equipmentSlot: template.slot,
      effect: template.effect,
    };

    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        inventory: [...prev.inventory, newItem],
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        inventory: updated.inventory,
      });
      return updated;
    });
    showSuccess(`已添加装备：${template.name}`);
  };

  // 选择天赋
  const handleSelectTalent = (talent: Talent) => {
    const oldTalent = TALENTS.find((t) => t.id === localPlayer.talentId);
    const newTalent = talent;

    // 计算属性变化
    let attackChange =
      (newTalent.effects.attack || 0) - (oldTalent?.effects.attack || 0);
    let defenseChange =
      (newTalent.effects.defense || 0) - (oldTalent?.effects.defense || 0);
    let hpChange = (newTalent.effects.hp || 0) - (oldTalent?.effects.hp || 0);
    let spiritChange =
      (newTalent.effects.spirit || 0) - (oldTalent?.effects.spirit || 0);
    let physiqueChange =
      (newTalent.effects.physique || 0) - (oldTalent?.effects.physique || 0);
    let speedChange =
      (newTalent.effects.speed || 0) - (oldTalent?.effects.speed || 0);
    let luckChange =
      (newTalent.effects.luck || 0) - (oldTalent?.effects.luck || 0);

    const updatedPlayer = {
      ...localPlayer,
      talentId: talent.id,
      attack: localPlayer.attack + attackChange,
      defense: localPlayer.defense + defenseChange,
      maxHp: localPlayer.maxHp + hpChange,
      hp: localPlayer.hp + hpChange,
      spirit: localPlayer.spirit + spiritChange,
      physique: localPlayer.physique + physiqueChange,
      speed: localPlayer.speed + speedChange,
      luck: localPlayer.luck + luckChange,
    };
    setLocalPlayer(updatedPlayer);
    // 立即更新到实际玩家状态
    onUpdatePlayer({
      talentId: talent.id,
      attack: updatedPlayer.attack,
      defense: updatedPlayer.defense,
      maxHp: updatedPlayer.maxHp,
      hp: updatedPlayer.hp,
      spirit: updatedPlayer.spirit,
      physique: updatedPlayer.physique,
      speed: updatedPlayer.speed,
      luck: updatedPlayer.luck,
    });
    showSuccess(`已选择天赋：${talent.name}`);
  };

  // 获取稀有度颜色
  // 使用统一的工具函数获取稀有度颜色（带边框）
  const getRarityColor = (rarity: ItemRarity) => {
    const baseColor = getRarityTextColor(rarity);
    switch (rarity) {
      case '普通':
        return `${baseColor} border-stone-600`;
      case '稀有':
        return `${baseColor} border-blue-600`;
      case '传说':
        return `${baseColor} border-purple-600`;
      case '仙品':
        return `${baseColor} border-yellow-600`;
      default:
        return `${baseColor} border-stone-600`;
    }
  };

  // 获取稀有度背景色
  const getRarityBgColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case '普通':
        return 'bg-stone-800/50';
      case '稀有':
        return 'bg-blue-900/20';
      case '传说':
        return 'bg-purple-900/20';
      case '仙品':
        return 'bg-yellow-900/20';
      default:
        return 'bg-stone-800/50';
    }
  };

  // 选择称号
  const handleSelectTitle = (title: Title) => {
    const oldTitle = TITLES.find((t) => t.id === localPlayer.titleId);
    const newTitle = title;

    // 计算属性变化
    let attackChange =
      (newTitle.effects.attack || 0) - (oldTitle?.effects.attack || 0);
    let defenseChange =
      (newTitle.effects.defense || 0) - (oldTitle?.effects.defense || 0);
    let hpChange = (newTitle.effects.hp || 0) - (oldTitle?.effects.hp || 0);

    const updatedPlayer = {
      ...localPlayer,
      titleId: title.id,
      attack: localPlayer.attack + attackChange,
      defense: localPlayer.defense + defenseChange,
      maxHp: localPlayer.maxHp + hpChange,
      hp: localPlayer.hp + hpChange,
    };
    setLocalPlayer(updatedPlayer);
    // 立即更新到实际玩家状态
    onUpdatePlayer({
      titleId: title.id,
      attack: updatedPlayer.attack,
      defense: updatedPlayer.defense,
      maxHp: updatedPlayer.maxHp,
      hp: updatedPlayer.hp,
    });
    showSuccess(`已选择称号：${title.name}`);
  };

  // 学习功法
  const handleLearnCultivationArt = (art: CultivationArt) => {
    if (localPlayer.cultivationArts.includes(art.id)) {
      showError('该功法已学习');
      return; // 已经学习过了
    }
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        cultivationArts: [...prev.cultivationArts, art.id],
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        cultivationArts: updated.cultivationArts,
      });
      return updated;
    });
    showSuccess(`已学习功法：${art.name}`);
  };

  // 加入宗门
  const handleJoinSect = (sectId: string) => {
    const sect = SECTS.find((s) => s.id === sectId);
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        sectId: sectId,
        sectRank: SectRank.Outer,
        sectContribution: 0,
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        sectId: sectId,
        sectRank: SectRank.Outer,
        sectContribution: 0,
      });
      return updated;
    });
    showSuccess(`已加入宗门：${sect?.name || sectId}`);
  };

  // 完成成就
  const handleCompleteAchievement = (achievementId: string) => {
    if (localPlayer.achievements.includes(achievementId)) {
      showError('该成就已完成');
      return; // 已经完成了
    }
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        achievements: [...prev.achievements, achievementId],
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        achievements: updated.achievements,
      });
      return updated;
    });
    showSuccess(`已完成成就：${achievement?.name || achievementId}`);
  };

  // 添加灵宠
  const handleAddPet = (template: PetTemplate) => {
    const newPet = {
      id: uid(),
      name: template.name,
      species: template.species,
      level: 1,
      exp: 0,
      maxExp: 100,
      rarity: template.rarity,
      stats: { ...template.baseStats },
      skills: template.skills,
      evolutionStage: 0,
      affection: 50,
    };

    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        pets: [...prev.pets, newPet],
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        pets: updated.pets,
      });
      return updated;
    });
    showSuccess(`已添加灵宠：${template.name}`);
  };

  // 添加物品
  const handleAddItem = (itemTemplate: Partial<Item> | Recipe['result'], quantity: number = 1) => {
    const isEquipment = (itemTemplate as any).isEquippable && (itemTemplate as any).equipmentSlot;
    const isRecipe = itemTemplate.type === ItemType.Recipe;

    setLocalPlayer((prev) => {
      const newInv = [...prev.inventory];
      const existingIdx = newInv.findIndex((i) => i.name === itemTemplate.name);

      if (existingIdx >= 0 && !isEquipment && !isRecipe) {
        // 非装备类、非丹方类物品可以叠加
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          quantity: newInv[existingIdx].quantity + quantity,
        };
        showSuccess(`已添加物品：${itemTemplate.name} x${quantity}（当前数量：${newInv[existingIdx].quantity}）`);
      } else {
        // 装备类物品、丹方或新物品，每个单独占一格
        const itemsToAdd = isEquipment ? quantity : 1;
        const addQuantity = isEquipment ? 1 : quantity;

        for (let i = 0; i < itemsToAdd; i++) {
          // 处理丹方：需要添加 recipeData
          let recipeData: Recipe | undefined = undefined;
          if (isRecipe) {
            // 从物品名称中推断配方名称（例如："天元丹丹方" -> "天元丹"）
            const recipeName = (itemTemplate.name || '').replace(/丹方$/, '');
            // 在 DISCOVERABLE_RECIPES 中查找对应的配方
            const matchedRecipe = DISCOVERABLE_RECIPES.find(
              (recipe) => recipe.name === recipeName
            );
            if (matchedRecipe) {
              recipeData = matchedRecipe;
            }
          }

          const newItem: Item = {
            id: uid(),
            name: itemTemplate.name || '未知物品',
            type: itemTemplate.type || ItemType.Material,
            description: itemTemplate.description || '',
            quantity: addQuantity,
            rarity: itemTemplate.rarity || '普通',
            level: (itemTemplate as any).level ?? 0,
            isEquippable: (itemTemplate as any).isEquippable,
            equipmentSlot: (itemTemplate as any).equipmentSlot,
            effect: itemTemplate.effect,
            permanentEffect: (itemTemplate as any).permanentEffect,
            recipeData: recipeData,
          };
          newInv.push(newItem);
        }
        showSuccess(`已添加物品：${itemTemplate.name} x${quantity}`);
      }

      const updated = {
        ...prev,
        inventory: newInv,
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        inventory: updated.inventory,
      });
      return updated;
    });
  };

  // 解锁丹方
  const handleUnlockRecipe = (recipeName: string) => {
    if (localPlayer.unlockedRecipes.includes(recipeName)) {
      showError('该丹方已解锁');
      return; // 已经解锁了
    }
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        unlockedRecipes: [...prev.unlockedRecipes, recipeName],
      };
      // 立即更新到实际玩家状态
      onUpdatePlayer({
        unlockedRecipes: updated.unlockedRecipes,
      });
      return updated;
    });
    showSuccess(`已解锁丹方：${recipeName}`);
  };

  // 关闭调试模式
  const handleDisableDebugMode = () => {
    showConfirm(
      '确定要关闭调试模式吗？关闭后需要重新点击游戏名称5次才能再次启用。',
      '确认关闭',
      () => {
        const DEBUG_MODE_KEY = 'xiuxian-debug-mode';
        localStorage.removeItem(DEBUG_MODE_KEY);
        // 刷新页面以应用更改
        window.location.reload();
      }
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[90vh] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center md:rounded-t-2xl shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-red-500">
            🔧 调试模式
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 警告提示 */}
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
            ⚠️ 调试模式：修改数据可能导致游戏异常，请谨慎操作！
          </div>

          {/* 基础信息 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              基础信息
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  玩家名称
                </label>
                <input
                  type="text"
                  value={localPlayer.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 境界和等级 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              境界与等级
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界
                </label>
                <select
                  value={localPlayer.realm}
                  onChange={(e) =>
                    handleRealmChange(e.target.value as RealmType)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  {REALM_ORDER.map((realm) => (
                    <option key={realm} value={realm}>
                      {realm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界等级 (1-9)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel - 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={localPlayer.realmLevel}
                    onChange={(e) =>
                      handleRealmLevelChange(parseInt(e.target.value) || 1)
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-center"
                  />
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel + 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  经验值
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('exp', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.exp}
                    onChange={(e) =>
                      updateField(
                        'exp',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('exp', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  最大经验值
                </label>
                <input
                  type="number"
                  min="1"
                  value={localPlayer.maxExp}
                  onChange={(e) =>
                    updateField(
                      'maxExp',
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 属性 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              属性
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'hp', label: '气血', maxKey: 'maxHp' },
                { key: 'maxHp', label: '最大气血' },
                { key: 'attack', label: '攻击力' },
                { key: 'defense', label: '防御力' },
                { key: 'spirit', label: '神识' },
                { key: 'physique', label: '体魄' },
                { key: 'speed', label: '速度' },
                { key: 'luck', label: '幸运值' },
              ].map(({ key, label, maxKey }) => {
                const value = localPlayer[key as keyof PlayerStats] as number;
                const maxValue = maxKey
                  ? (localPlayer[maxKey as keyof PlayerStats] as number)
                  : undefined;
                return (
                  <div key={key}>
                    <label className="block text-sm text-stone-400 mb-1">
                      {label}
                      {maxValue !== undefined && ` (最大: ${maxValue})`}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, -100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        -100
                      </button>
                      <input
                        type="number"
                        min={maxValue !== undefined ? 0 : undefined}
                        max={maxValue}
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          const clampedValue =
                            maxValue !== undefined
                              ? Math.max(0, Math.min(maxValue, newValue))
                              : Math.max(0, newValue);
                          updateField(key as keyof PlayerStats, clampedValue);
                        }}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                      />
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, 100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 资源 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              资源
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  灵石
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('spiritStones', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.spiritStones}
                    onChange={(e) =>
                      updateField(
                        'spiritStones',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('spiritStones', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  抽奖券
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('lotteryTickets', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.lotteryTickets}
                    onChange={(e) =>
                      updateField(
                        'lotteryTickets',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('lotteryTickets', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  属性点
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('attributePoints', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.attributePoints}
                    onChange={(e) =>
                      updateField(
                        'attributePoints',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('attributePoints', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  传承等级
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', -1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={localPlayer.inheritanceLevel}
                    onChange={(e) =>
                      updateField(
                        'inheritanceLevel',
                        Math.max(0, Math.min(4, parseInt(e.target.value) || 0))
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', 1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              快速操作
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    hp: prev.maxHp,
                  }));
                }}
                className="bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-sm"
              >
                回满血
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    exp: prev.maxExp - 1,
                  }));
                }}
                className="bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm"
              >
                经验差1升级
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    spiritStones: 999999,
                  }));
                }}
                className="bg-yellow-700 hover:bg-yellow-600 text-white rounded px-3 py-2 text-sm"
              >
                灵石999K
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    lotteryTickets: 999,
                  }));
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white rounded px-3 py-2 text-sm"
              >
                抽奖券999
              </button>
            </div>
          </div>

          {/* 游戏内容选择 */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-700 pb-2">
              <h3 className="font-bold text-stone-200">游戏内容</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'equipment'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="装备"
                >
                  <Package size={14} className="inline mr-1" />
                  装备
                </button>
                <button
                  onClick={() => setActiveTab('talent')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'talent'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="天赋"
                >
                  <Sparkles size={14} className="inline mr-1" />
                  天赋
                </button>
                <button
                  onClick={() => setActiveTab('title')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'title'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="称号"
                >
                  <Award size={14} className="inline mr-1" />
                  称号
                </button>
                <button
                  onClick={() => setActiveTab('cultivation')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'cultivation'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="功法"
                >
                  <BookOpen size={14} className="inline mr-1" />
                  功法
                </button>
                <button
                  onClick={() => setActiveTab('sect')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'sect'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="宗门"
                >
                  <Building2 size={14} className="inline mr-1" />
                  宗门
                </button>
                <button
                  onClick={() => setActiveTab('achievement')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'achievement'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="成就"
                >
                  <Trophy size={14} className="inline mr-1" />
                  成就
                </button>
                <button
                  onClick={() => setActiveTab('pet')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'pet'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="灵宠"
                >
                  <Heart size={14} className="inline mr-1" />
                  灵宠
                </button>
                <button
                  onClick={() => setActiveTab('item')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'item'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="物品"
                >
                  <FlaskConical size={14} className="inline mr-1" />
                  物品
                </button>
                <button
                  onClick={() => setActiveTab('recipe')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'recipe'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="丹方"
                >
                  <Scroll size={14} className="inline mr-1" />
                  丹方
                </button>
                <button
                  onClick={() => setActiveTab('death')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTab === 'death'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                  title="死亡测试"
                >
                  <Skull size={14} className="inline mr-1" />
                  死亡测试
                </button>
              </div>
            </div>

            {/* 装备选择 */}
            {activeTab === 'equipment' && (
              <div>
                {/* 稀有度筛选 */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {(['all', '普通', '稀有', '传说', '仙品'] as const).map(
                    (rarity) => (
                      <button
                        key={rarity}
                        onClick={() => setEquipmentFilter(rarity)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          equipmentFilter === rarity
                            ? 'bg-red-700 text-white'
                            : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                        }`}
                      >
                        {rarity === 'all' ? '全部' : rarity}
                      </button>
                    )
                  )}
                </div>

                {/* 装备卡片列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredEquipment.map((equipment, index) => (
                    <div
                      key={`${equipment.name}-${index}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRarityColor(
                        equipment.rarity
                      )} ${getRarityBgColor(equipment.rarity)}`}
                      onClick={() => handleAddEquipment(equipment)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm">{equipment.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                          {equipment.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mb-2">
                        {(equipment as any).description || equipment.name}
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="text-stone-300">
                          <span className="text-stone-500">部位：</span>
                          {equipment.slot}
                        </div>
                        {equipment.effect && (
                          <div className="text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(equipment.effect)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  exp: '经验',
                                };
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        className="mt-2 w-full bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddEquipment(equipment);
                        }}
                      >
                        添加到背包
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 天赋选择 */}
            {activeTab === 'talent' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  当前天赋：
                  <span className="text-stone-200 ml-2">
                    {TALENTS.find((t) => t.id === localPlayer.talentId)?.name ||
                      '无'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {TALENTS.map((talent) => {
                    const isSelected = localPlayer.talentId === talent.id;
                    return (
                      <div
                        key={talent.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : getRarityColor(talent.rarity)
                        } ${getRarityBgColor(talent.rarity)}`}
                        onClick={() => handleSelectTalent(talent)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{talent.name}</h4>
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                已选择
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {talent.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {talent.description}
                        </p>
                        {Object.keys(talent.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(talent.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  expRate: '修炼速度',
                                  luck: '幸运',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) {
                              handleSelectTalent(talent);
                            }
                          }}
                          disabled={isSelected}
                        >
                          {isSelected ? '已选择' : '选择天赋'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 称号选择 */}
            {activeTab === 'title' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  当前称号：
                  <span className="text-stone-200 ml-2">
                    {TITLES.find((t) => t.id === localPlayer.titleId)?.name ||
                      '无'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {TITLES.map((title) => {
                    const isSelected = localPlayer.titleId === title.id;
                    return (
                      <div
                        key={title.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => handleSelectTitle(title)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{title.name}</h4>
                          {isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                              已选择
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {title.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">要求：</span>
                          {title.requirement}
                        </div>
                        {Object.keys(title.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(title.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  expRate: '修炼速度',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) {
                              handleSelectTitle(title);
                            }
                          }}
                          disabled={isSelected}
                        >
                          {isSelected ? '已选择' : '选择称号'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 功法选择 */}
            {activeTab === 'cultivation' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  已学功法：{localPlayer.cultivationArts.length} 种
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {CULTIVATION_ARTS.map((art) => {
                    const isLearned = localPlayer.cultivationArts.includes(
                      art.id
                    );
                    const isActive = localPlayer.activeArtId === art.id;
                    return (
                      <div
                        key={art.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isActive
                            ? 'border-red-500 bg-red-900/20'
                            : isLearned
                              ? 'border-green-500 bg-green-900/20'
                              : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => {
                          if (!isLearned) {
                            handleLearnCultivationArt(art);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{art.name}</h4>
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                激活中
                              </span>
                            )}
                            {isLearned && !isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                已学习
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {art.type === 'mental' ? '心法' : '体术'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {art.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">境界要求：</span>
                          {art.realmRequirement}
                        </div>
                        {Object.keys(art.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(art.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  expRate: '修炼速度',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isLearned
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLearned) {
                              handleLearnCultivationArt(art);
                            }
                          }}
                          disabled={isLearned}
                        >
                          {isLearned ? '已学习' : '学习功法'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 宗门选择 */}
            {activeTab === 'sect' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  当前宗门：
                  <span className="text-stone-200 ml-2">
                    {localPlayer.sectId
                      ? SECTS.find((s) => s.id === localPlayer.sectId)?.name ||
                        '未知'
                      : '无'}
                  </span>
                  {localPlayer.sectId && (
                    <span className="text-stone-200 ml-2">
                      ({localPlayer.sectRank})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {SECTS.map((sect) => {
                    const isJoined = localPlayer.sectId === sect.id;
                    return (
                      <div
                        key={sect.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isJoined
                            ? 'border-red-500 bg-red-900/20'
                            : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => {
                          if (!isJoined) {
                            handleJoinSect(sect.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{sect.name}</h4>
                          <div className="flex items-center gap-1">
                            {isJoined && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                已加入
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {sect.grade}级
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {sect.description}
                        </p>
                        <div className="text-xs text-stone-300">
                          <span className="text-stone-500">境界要求：</span>
                          {sect.reqRealm}
                        </div>
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isJoined
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isJoined) {
                              handleJoinSect(sect.id);
                            }
                          }}
                          disabled={isJoined}
                        >
                          {isJoined ? '已加入' : '加入宗门'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 成就选择 */}
            {activeTab === 'achievement' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  已完成成就：{localPlayer.achievements.length} /{' '}
                  {ACHIEVEMENTS.length}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {ACHIEVEMENTS.map((achievement) => {
                    const isCompleted = localPlayer.achievements.includes(
                      achievement.id
                    );
                    return (
                      <div
                        key={achievement.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isCompleted
                            ? 'border-green-500 bg-green-900/20'
                            : getRarityColor(achievement.rarity)
                        } ${getRarityBgColor(achievement.rarity)}`}
                        onClick={() => {
                          if (!isCompleted) {
                            handleCompleteAchievement(achievement.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">
                            {achievement.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {isCompleted && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                已完成
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {achievement.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">要求：</span>
                          {achievement.requirement.type === 'realm'
                            ? `达到${achievement.requirement.target}`
                            : achievement.requirement.type === 'kill'
                              ? `击败${achievement.requirement.value}个敌人`
                              : achievement.requirement.type === 'collect'
                                ? `收集${achievement.requirement.value}种物品`
                                : achievement.requirement.type === 'meditate'
                                  ? `完成${achievement.requirement.value}次打坐`
                                  : achievement.requirement.type === 'adventure'
                                    ? `完成${achievement.requirement.value}次历练`
                                    : achievement.requirement.type === 'equip'
                                      ? `装备${achievement.requirement.value}件物品`
                                      : achievement.requirement.type === 'pet'
                                        ? `获得${achievement.requirement.value}个灵宠`
                                        : achievement.requirement.type ===
                                            'recipe'
                                          ? `解锁${achievement.requirement.value}个丹方`
                                          : achievement.requirement.type ===
                                              'art'
                                            ? `学习${achievement.requirement.value}种功法`
                                            : achievement.requirement.type ===
                                                'breakthrough'
                                              ? `完成${achievement.requirement.value}次突破`
                                              : achievement.requirement.type ===
                                                  'secret_realm'
                                                ? `进入${achievement.requirement.value}次秘境`
                                                : achievement.requirement
                                                      .type === 'lottery'
                                                  ? `进行${achievement.requirement.value}次抽奖`
                                                  : `${achievement.requirement.type} ${achievement.requirement.value}`}
                        </div>
                        {achievement.reward && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">奖励：</span>
                            {[
                              achievement.reward.exp &&
                                `修为+${achievement.reward.exp}`,
                              achievement.reward.spiritStones &&
                                `灵石+${achievement.reward.spiritStones}`,
                              achievement.reward.titleId && '称号',
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isCompleted
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCompleted) {
                              handleCompleteAchievement(achievement.id);
                            }
                          }}
                          disabled={isCompleted}
                        >
                          {isCompleted ? '已完成' : '完成成就'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 灵宠选择 */}
            {activeTab === 'pet' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  拥有灵宠：{localPlayer.pets.length} 只
                </div>

                {/* 当前灵宠列表 */}
                {localPlayer.pets.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-stone-200 mb-2 border-b border-stone-700 pb-1">
                      当前灵宠
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {localPlayer.pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="border border-stone-700 rounded-lg p-3 bg-stone-800/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-bold text-sm text-stone-200">
                                {pet.name}
                              </h5>
                              <p className="text-xs text-stone-400">
                                {pet.species} | Lv.{pet.level} | 亲密度:{' '}
                                {pet.affection}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingPetId(pet.id);
                                setEditingPet({ ...pet });
                              }}
                              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded"
                            >
                              编辑
                            </button>
                          </div>
                          <div className="text-xs text-stone-300">
                            攻击: {pet.stats.attack} | 防御: {pet.stats.defense}{' '}
                            | 气血: {pet.stats.hp} | 速度: {pet.stats.speed}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 编辑灵宠弹窗 */}
                {editingPet && editingPetId && (
                  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-800 border border-stone-700 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="font-bold text-stone-200 mb-4">
                        编辑灵宠：{editingPet.name}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            等级
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingPet.level}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                level: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            经验值
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.exp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                exp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            最大经验值
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingPet.maxExp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                maxExp: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            亲密度 (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingPet.affection}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                affection: Math.max(
                                  0,
                                  Math.min(100, parseInt(e.target.value) || 0)
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            进化阶段 (0-2)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="2"
                            value={editingPet.evolutionStage}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                evolutionStage: Math.max(
                                  0,
                                  Math.min(2, parseInt(e.target.value) || 0)
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            攻击力
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.attack}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  attack: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            防御力
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.defense}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  defense: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            气血
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.hp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  hp: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            速度
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.speed}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  speed: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            if (!editingPet) return;
                            const updatedPets = localPlayer.pets.map((p) =>
                              p.id === editingPetId ? editingPet : p
                            );
                            setLocalPlayer((prev) => ({
                              ...prev,
                              pets: updatedPets,
                            }));
                            onUpdatePlayer({
                              pets: updatedPets,
                            });
                            setEditingPet(null);
                            setEditingPetId(null);
                            showSuccess('已更新灵宠参数');
                          }}
                          className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setEditingPet(null);
                            setEditingPetId(null);
                          }}
                          className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 添加新灵宠 */}
                <div className="mt-4">
                  <h4 className="font-bold text-stone-200 mb-2 border-b border-stone-700 pb-1">
                    添加新灵宠
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {PET_TEMPLATES.map((template) => {
                      const hasPet = localPlayer.pets.some(
                        (p) => p.species === template.species
                      );
                      return (
                        <div
                          key={template.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRarityColor(
                            template.rarity
                          )} ${getRarityBgColor(template.rarity)}`}
                          onClick={() => handleAddPet(template)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-sm">
                              {template.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              {hasPet && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                  已拥有
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                                {template.rarity}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-400 mb-2">
                            {template.description}
                          </p>
                          <div className="text-xs text-stone-300 mb-2">
                            <span className="text-stone-500">种类：</span>
                            {template.species}
                          </div>
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">基础属性：</span>
                            攻击{template.baseStats.attack} 防御
                            {template.baseStats.defense} 气血
                            {template.baseStats.hp} 速度
                            {template.baseStats.speed}
                          </div>
                          <button
                            className="mt-2 w-full bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddPet(template);
                            }}
                          >
                            添加灵宠
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 物品选择 */}
            {activeTab === 'item' && (
              <div>
                {/* 物品类型筛选 */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {(['all', ...Object.values(ItemType)] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setItemFilter(type)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          itemFilter === type
                            ? 'bg-red-700 text-white'
                            : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                        }`}
                      >
                        {type === 'all' ? '全部' : type}
                      </button>
                    )
                  )}
                </div>

                {/* 物品卡片列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                        item.rarity
                          ? getRarityColor(item.rarity)
                          : 'border-stone-600'
                      } ${
                        item.rarity
                          ? getRarityBgColor(item.rarity)
                          : 'bg-stone-800/50'
                      }`}
                      onClick={() => handleAddItem(item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        {item.rarity && (
                          <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                            {item.rarity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mb-2">
                        {item.description}
                      </p>
                      <div className="text-xs text-stone-300 mb-1">
                        <span className="text-stone-500">类型：</span>
                        {item.type}
                      </div>
                      {item.effect && (
                        <div className="text-xs text-stone-300 mb-1">
                          <span className="text-stone-500">效果：</span>
                          {Object.entries(item.effect)
                            .map(([key, value]) => {
                              const keyMap: Record<string, string> = {
                                attack: '攻击',
                                defense: '防御',
                                hp: '气血',
                                spirit: '神识',
                                physique: '体魄',
                                speed: '速度',
                                exp: '经验',
                              };
                              return `${keyMap[key] || key}+${value}`;
                            })
                            .join(', ')}
                        </div>
                      )}
                      {item.permanentEffect && (
                        <div className="text-xs text-yellow-300 mb-1">
                          <span className="text-stone-500">永久效果：</span>
                          {Object.entries(item.permanentEffect)
                            .map(([key, value]) => {
                              const keyMap: Record<string, string> = {
                                attack: '攻击',
                                defense: '防御',
                                maxHp: '最大气血',
                                spirit: '神识',
                                physique: '体魄',
                                speed: '速度',
                              };
                              return `${keyMap[key] || key}+${value}`;
                            })
                            .join(', ')}
                        </div>
                      )}
                      {item.isEquippable && (
                        <div className="text-xs text-blue-300 mb-1">
                          <span className="text-stone-500">可装备：</span>
                          {item.equipmentSlot || '未知部位'}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={itemQuantities[item.name || ''] || 1}
                          onChange={(e) => {
                            const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                            setItemQuantities((prev) => ({
                              ...prev,
                              [item.name || '']: value,
                            }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 text-center"
                          placeholder="1"
                        />
                        <button
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const quantity = itemQuantities[item.name || ''] || 1;
                            handleAddItem(item, quantity);
                          }}
                        >
                          添加到背包
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 丹方选择 */}
            {activeTab === 'recipe' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  已解锁丹方：{localPlayer.unlockedRecipes.length} 个
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {[...PILL_RECIPES, ...DISCOVERABLE_RECIPES].map((recipe) => {
                    const isUnlocked = localPlayer.unlockedRecipes.includes(
                      recipe.name
                    );
                    return (
                      <div
                        key={recipe.name}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isUnlocked
                            ? 'border-green-500 bg-green-900/20'
                            : getRarityColor(recipe.result.rarity)
                        } ${getRarityBgColor(recipe.result.rarity)}`}
                        onClick={() => {
                          if (!isUnlocked) {
                            handleUnlockRecipe(recipe.name);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{recipe.name}</h4>
                          <div className="flex items-center gap-1">
                            {isUnlocked && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                已解锁
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {recipe.result.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {recipe.result.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">材料：</span>
                          {recipe.ingredients
                            .map((ing) => `${ing.name}x${ing.qty}`)
                            .join(', ')}
                        </div>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">成本：</span>
                          {recipe.cost} 灵石
                        </div>
                        {recipe.result.effect && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(recipe.result.effect)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  exp: '经验',
                                };
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isUnlocked
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUnlocked) {
                              handleUnlockRecipe(recipe.name);
                            }
                          }}
                          disabled={isUnlocked}
                        >
                          {isUnlocked ? '已解锁' : '解锁丹方'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 死亡测试 */}
            {activeTab === 'death' && (
              <div>
                <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skull size={20} className="text-red-400" />
                    <h3 className="font-bold text-red-400">死亡测试</h3>
                  </div>
                  <p className="text-sm text-stone-300 mb-2">
                    此功能用于测试死亡机制和不同难度模式下的死亡惩罚。
                  </p>
                  <p className="text-xs text-stone-400">
                    当前气血：{localPlayer.hp} / {localPlayer.maxHp}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 快速设置气血 */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      快速设置气血
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: 0 });
                          showInfo('已将气血设置为 0，将触发死亡检测');
                        }}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        设置为 0（立即死亡）
                      </button>
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: 1 });
                          showInfo('已将气血设置为 1');
                        }}
                        className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded transition-colors"
                      >
                        设置为 1（濒死）
                      </button>
                      <button
                        onClick={() => {
                          const halfHp = Math.floor(localPlayer.maxHp * 0.5);
                          onUpdatePlayer({ hp: halfHp });
                          showInfo(`已将气血设置为 ${halfHp}（50%）`);
                        }}
                        className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded transition-colors"
                      >
                        设置为 50%
                      </button>
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: localPlayer.maxHp });
                          showInfo('已将气血设置为最大值');
                        }}
                        className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                      >
                        恢复满血
                      </button>
                    </div>
                  </div>

                  {/* 触发死亡 */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      触发死亡
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-4">
                      <p className="text-sm text-stone-300 mb-4">
                        直接触发死亡机制，测试不同难度模式下的死亡处理：
                      </p>
                      <button
                        onClick={() => {
                          showConfirm(
                            '确定要触发死亡吗？这将根据当前难度模式执行相应的死亡惩罚。',
                            '确认触发',
                            () => {
                              // 先将气血设置为0
                              onUpdatePlayer({ hp: 0 });
                              // 然后触发死亡回调
                              if (onTriggerDeath) {
                                setTimeout(() => {
                                  onTriggerDeath();
                                }, 100);
                              } else {
                                showError('死亡测试回调未配置');
                              }
                            }
                          );
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Skull size={20} />
                        触发死亡测试
                      </button>
                      <p className="text-xs text-stone-400 mt-2">
                        *
                        注意：这将立即触发死亡机制，根据当前难度模式执行相应惩罚
                      </p>
                    </div>
                  </div>

                  {/* 当前难度信息 */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      当前难度模式
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-3">
                      <p className="text-sm text-stone-300">
                        <span className="text-stone-400">难度：</span>
                        <span className="font-semibold ml-2">
                          {(() => {
                            try {
                              const settings = JSON.parse(
                                localStorage.getItem('xiuxian-game-settings') ||
                                  '{}'
                              );
                              const difficulty =
                                settings.difficulty || 'normal';
                              if (difficulty === 'easy') {
                                return (
                                  <span className="text-green-400">
                                    简单模式
                                  </span>
                                );
                              } else if (difficulty === 'normal') {
                                return (
                                  <span className="text-yellow-400">
                                    普通模式
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-red-400">困难模式</span>
                                );
                              }
                            } catch {
                              return (
                                <span className="text-yellow-400">
                                  普通模式
                                </span>
                              );
                            }
                          })()}
                        </span>
                      </p>
                      <div className="mt-2 text-xs text-stone-400 space-y-1">
                        <p>• 简单模式：死亡无惩罚，直接复活</p>
                        <p>• 普通模式：死亡掉落部分属性(10-20%)和装备(1-3件)</p>
                        <p>• 困难模式：死亡清除存档</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-800 border-t border-stone-700 p-3 md:p-4 flex justify-between items-center shrink-0">
          <button
            onClick={handleDisableDebugMode}
            className="flex items-center gap-2 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded border border-orange-600 transition-colors"
            title="关闭调试模式"
          >
            <Power size={16} />
            关闭调试模式
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors"
            >
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
