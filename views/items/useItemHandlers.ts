import React from 'react';
import { PlayerStats, Item, Pet, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../../types';
import { PET_TEMPLATES, DISCOVERABLE_RECIPES, getRandomPetName, INHERITANCE_ROUTES, REALM_ORDER } from '../../constants';
import { uid } from '../../utils/gameUtils';
import { showConfirm } from '../../utils/toastUtils';

interface UseItemHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 辅助函数：应用单个物品效果
 * 抽离核心逻辑以复用，减少 handleUseItem 和 handleBatchUseItems 的重复
 */
const applyItemEffect = (
  prev: PlayerStats,
  item: Item,
  options: {
    addLog: (message: string, type?: string) => void;
    setItemActionLog?: (log: { text: string; type: string } | null) => void;
    isBatch?: boolean;
  }
): PlayerStats => {
  const { addLog, setItemActionLog, isBatch = false } = options;

  // 基础数据克隆
  let newStats = { ...prev };
  let newInv = prev.inventory
    .map((i) => {
      if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
      return i;
    })
    .filter((i) => i.quantity > 0);
  let newPets = [...prev.pets];
  const effectLogs: string[] = [];

  // 1. 处理传承石（特殊物品）
  const isInheritanceStone = item.name === '传承石';
  if (isInheritanceStone) {
    // 如果已经有传承，提示
    if (prev.inheritanceRoute) {
      addLog('你已经获得了传承，无法再次使用传承石。', 'danger');
      return { ...prev, inventory: newInv, pets: newPets };
    }

    // 找到所有可用的传承路线（根据境界要求）
    const getRealmIndex = (realm: RealmType) => REALM_ORDER.indexOf(realm);
    const playerRealmIndex = getRealmIndex(prev.realm);

    const availableRoutes = INHERITANCE_ROUTES.filter(route => {
      if (route.unlockRequirement?.realm) {
        const requiredRealmIndex = getRealmIndex(route.unlockRequirement.realm);
        return playerRealmIndex >= requiredRealmIndex;
      }
      return true; // 没有境界要求的传承路线
    });

    if (availableRoutes.length === 0) {
      addLog('你的境界不足以使用传承石，需要达到更高境界。', 'danger');
      return { ...prev, inventory: newInv, pets: newPets };
    }

    // 随机选择一个可用的传承路线
    const randomRoute = availableRoutes[Math.floor(Math.random() * availableRoutes.length)];
    const routeEffects = randomRoute.baseEffects;

    // 应用传承效果
    let newAttack = prev.attack + (routeEffects.attack || 0);
    let newDefense = prev.defense + (routeEffects.defense || 0);
    let newMaxHp = prev.maxHp + (routeEffects.hp || 0);
    let newHp = prev.hp + (routeEffects.hp || 0);
    let newSpirit = prev.spirit + (routeEffects.spirit || 0);
    let newPhysique = prev.physique + (routeEffects.physique || 0);
    let newSpeed = prev.speed + (routeEffects.speed || 0);

    addLog(`✨ 你使用了传承石，获得了【${randomRoute.name}】传承！`, 'special');
    if (routeEffects.attack) {
      addLog(`攻击力 +${routeEffects.attack}`, 'gain');
    }
    if (routeEffects.defense) {
      addLog(`防御力 +${routeEffects.defense}`, 'gain');
    }
    if (routeEffects.hp) {
      addLog(`气血 +${routeEffects.hp}`, 'gain');
    }
    if (routeEffects.spirit) {
      addLog(`神识 +${routeEffects.spirit}`, 'gain');
    }
    if (routeEffects.physique) {
      addLog(`体魄 +${routeEffects.physique}`, 'gain');
    }
    if (routeEffects.speed) {
      addLog(`速度 +${routeEffects.speed}`, 'gain');
    }
    if (routeEffects.expRate) {
      addLog(`修炼速度 +${(routeEffects.expRate * 100).toFixed(0)}%`, 'gain');
    }

    return {
      ...newStats,
      inventory: newInv,
      pets: newPets,
      inheritanceRoute: randomRoute.id,
      inheritanceSkills: [],
      inheritanceLevel: 1, // 初始传承等级为1
      inheritanceExp: 0, // 初始传承经验为0
      attack: newAttack,
      defense: newDefense,
      maxHp: newMaxHp,
      hp: Math.min(newHp, newMaxHp),
      spirit: newSpirit,
      physique: newPhysique,
      speed: newSpeed,
    };
  }

  // 2. 处理灵兽蛋孵化
  const isPetEgg =
    item.name.includes('蛋') ||
    item.name.toLowerCase().includes('egg') ||
    item.name.includes('灵兽蛋') ||
    item.name.includes('灵宠蛋') ||
    (item.description &&
      (item.description.includes('孵化') ||
        item.description.includes('灵宠') ||
        item.description.includes('灵兽') ||
        item.description.includes('宠物')));

  if (isPetEgg) {
    const availablePets = PET_TEMPLATES.filter((t) => {
      if (item.rarity === '普通') return t.rarity === '普通' || t.rarity === '稀有';
      if (item.rarity === '稀有') return t.rarity === '稀有' || t.rarity === '传说';
      if (item.rarity === '传说') return t.rarity === '传说' || t.rarity === '仙品';
      if (item.rarity === '仙品') return t.rarity === '仙品';
      return true;
    });

    if (availablePets.length > 0) {
      const randomTemplate = availablePets[Math.floor(Math.random() * availablePets.length)];
      const newPet: Pet = {
        id: uid(),
        name: getRandomPetName(randomTemplate),
        species: randomTemplate.species,
        level: 1,
        exp: 0,
        maxExp: 60,
        rarity: randomTemplate.rarity,
        stats: { ...randomTemplate.baseStats },
        skills: [...randomTemplate.skills],
        evolutionStage: 0,
        affection: 50,
      };
      newPets.push(newPet);
      const logMsg = `✨ 孵化出了灵宠【${newPet.name}】！`;
      effectLogs.push(logMsg);
      if (!isBatch) {
        addLog(`🎉 你成功孵化了${item.name}，获得了灵宠【${newPet.name}】！`, 'special');
      }
    } else {
      const logMsg = '但似乎什么都没有孵化出来...';
      effectLogs.push(logMsg);
      if (!isBatch) addLog(`你尝试孵化${item.name}，但似乎什么都没有发生...`, 'normal');
    }
  }

  // 3. 处理临时效果
  if (item.effect?.hp) {
    newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
    effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
  }
  if (item.effect?.exp) {
    newStats.exp += item.effect.exp;
    effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
  }
  if (item.effect?.lifespan) {
    const currentLifespan = newStats.lifespan ?? newStats.maxLifespan ?? 100;
    const maxLifespan = newStats.maxLifespan ?? 100;
    const lifespanIncrease = item.effect.lifespan;

    // 修复：普通效果增加寿命不应超过当前上限
    const nextLifespan = Math.min(maxLifespan, currentLifespan + lifespanIncrease);

    // 确保寿命不会因为普通效果减少（除非增加值为负，但通常为正）
    newStats.lifespan = Math.max(newStats.lifespan ?? 0, nextLifespan);
    effectLogs.push(`寿命增加了 ${lifespanIncrease} 年。`);
  }

  // 4. 处理永久效果（装备类型不应该有永久效果，只有消耗品如丹药才有）
  if (item.permanentEffect && !item.isEquippable) {
    const permLogs: string[] = [];
    const pe = item.permanentEffect;
    if (pe.attack) { newStats.attack += pe.attack; permLogs.push(`攻击力永久 +${pe.attack}`); }
    if (pe.defense) { newStats.defense += pe.defense; permLogs.push(`防御力永久 +${pe.defense}`); }
    if (pe.spirit) { newStats.spirit += pe.spirit; permLogs.push(`神识永久 +${pe.spirit}`); }
    if (pe.physique) { newStats.physique += pe.physique; permLogs.push(`体魄永久 +${pe.physique}`); }
    if (pe.speed) { newStats.speed += pe.speed; permLogs.push(`速度永久 +${pe.speed}`); }
    if (pe.maxHp) {
      newStats.maxHp += pe.maxHp;
      newStats.hp += pe.maxHp;
      permLogs.push(`气血上限永久 +${pe.maxHp}`);
    }
    if (pe.maxLifespan) {
      newStats.maxLifespan = (newStats.maxLifespan ?? 100) + pe.maxLifespan;
      newStats.lifespan = Math.min(
        newStats.maxLifespan,
        (newStats.lifespan ?? newStats.maxLifespan ?? 100) + pe.maxLifespan
      );
      permLogs.push(`最大寿命永久 +${pe.maxLifespan} 年`);
    }
    if (pe.spiritualRoots) {
      const rootNames: Record<string, string> = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
      const rootChanges: string[] = [];
      // 确保 spiritualRoots 对象存在并初始化
      if (!newStats.spiritualRoots) {
        newStats.spiritualRoots = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
      } else {
        newStats.spiritualRoots = { ...newStats.spiritualRoots };
      }

      if (Object.values(pe.spiritualRoots).every(v => v === 0 || v === undefined || v === null)) {
        const rootTypes: Array<keyof typeof rootNames> = ['metal', 'wood', 'water', 'fire', 'earth'];
        const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
        newStats.spiritualRoots[randomRoot] = Math.min(100, (newStats.spiritualRoots[randomRoot] || 0) + 5);
        rootChanges.push(`${rootNames[randomRoot]}灵根 +5`);
      } else {
        Object.entries(pe.spiritualRoots).forEach(([key, value]) => {
          // 处理 undefined、null 和 0 的情况
          const numValue = value ?? 0;
          if (numValue > 0) {
            const rootKey = key as keyof typeof newStats.spiritualRoots;
            const currentValue = newStats.spiritualRoots[rootKey] || 0;
            newStats.spiritualRoots[rootKey] = Math.min(100, currentValue + numValue);
            rootChanges.push(`${rootNames[key]}灵根 +${numValue}`);
          }
        });
      }
      if (rootChanges.length > 0) permLogs.push(`灵根提升：${rootChanges.join('，')}`);
    }
    if (permLogs.length > 0) effectLogs.push(`✨ ${permLogs.join('，')}`);
  }

  // 4. 处理丹方使用
  if (item.type === ItemType.Recipe) {
    let recipeName = item.recipeData?.name || item.name.replace(/丹方$/, '');
    if (!item.recipeData) {
      const matched = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      if (matched) recipeName = matched.name;
    }

    if (recipeName) {
      newStats.unlockedRecipes = [...(newStats.unlockedRecipes || [])];
      if (newStats.unlockedRecipes.includes(recipeName)) {
        if (!isBatch) addLog(`你已经学会了【${recipeName}】的炼制方法。`, 'normal');
      } else {
        const recipeExists = DISCOVERABLE_RECIPES.some(r => r.name === recipeName);
        if (!recipeExists) {
          if (!isBatch) addLog(`【${recipeName}】的配方不存在，无法学习。`, 'danger');
        } else {
          newStats.unlockedRecipes.push(recipeName);
          const stats = { ...(newStats.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };
          newStats.statistics = { ...stats, recipeCount: newStats.unlockedRecipes.length };
          effectLogs.push(`✨ 学会了【${recipeName}】的炼制方法！`);
          if (!isBatch) {
            addLog(`你研读了【${item.name}】，学会了【${recipeName}】的炼制方法！`, 'special');
          }
        }
      }
    } else if (!isBatch) {
      addLog(`无法从【${item.name}】中识别出配方名称。`, 'danger');
    }
  }

  // 5. 显示使用日志 (非灵兽蛋且非丹方)
  if (!isPetEgg && item.type !== ItemType.Recipe) {
    if (item.type === ItemType.Pill || effectLogs.length > 0) {
      const logMessage = effectLogs.length > 0
        ? `你使用了 ${item.name}。 ${effectLogs.join(' ')}`
        : `你使用了 ${item.name}。`;

      if (!isBatch) addLog(logMessage, 'gain');
      if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'gain' });
    }
  } else if (item.type === ItemType.Recipe && effectLogs.length > 0) {
    const logMessage = effectLogs[0];
    if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'special' });
  }

  return { ...newStats, inventory: newInv, pets: newPets };
};

/**
 * 整理背包逻辑
 */
const organizeInventory = (player: PlayerStats): Item[] => {
  const inventory = [...player.inventory];
  const equippedIds = new Set(Object.values(player.equippedItems).filter(Boolean) as string[]);

  // 1. 合并可堆叠物品
  const mergedInventory: Item[] = [];
  const stackMap = new Map<string, Item>();

  for (const item of inventory) {
    // 已装备的物品不参与合并，直接保留
    if (equippedIds.has(item.id)) {
      mergedInventory.push(item);
      continue;
    }

    // 生成唯一标识符用于判断是否可堆叠
    const itemKey = `${item.name}-${item.type}-${item.rarity || '普通'}-${item.level || 0}-${JSON.stringify(item.effect || {})}-${JSON.stringify(item.permanentEffect || {})}`;

    // 只有非装备类物品（草药、丹药、材料、丹方等）才自动合并
    const isStackable =
      item.type === ItemType.Herb ||
      item.type === ItemType.Pill ||
      item.type === ItemType.Material ||
      item.type === ItemType.Recipe;

    if (isStackable) {
      if (stackMap.has(itemKey)) {
        const existingItem = stackMap.get(itemKey)!;
        existingItem.quantity += item.quantity;
      } else {
        const newItem = { ...item };
        stackMap.set(itemKey, newItem);
        mergedInventory.push(newItem);
      }
    } else {
      // 装备类或不可堆叠类物品，直接加入
      mergedInventory.push(item);
    }
  }

  // 2. 排序逻辑
  const typeOrder: Record<string, number> = {
    [ItemType.Weapon]: 1,
    [ItemType.Armor]: 2,
    [ItemType.Artifact]: 3,
    [ItemType.Accessory]: 4,
    [ItemType.Ring]: 5,
    [ItemType.Pill]: 6,
    [ItemType.Herb]: 7,
    [ItemType.Material]: 8,
    [ItemType.Recipe]: 9,
  };

  const rarityOrder: Record<string, number> = {
    '仙品': 1,
    '传说': 2,
    '稀有': 3,
    '普通': 4,
  };

  return mergedInventory.sort((a, b) => {
    // 已装备优先
    const aEquipped = equippedIds.has(a.id);
    const bEquipped = equippedIds.has(b.id);
    if (aEquipped !== bEquipped) return aEquipped ? -1 : 1;

    // 按类型排序
    const aType = typeOrder[a.type] || 99;
    const bType = typeOrder[b.type] || 99;
    if (aType !== bType) return aType - bType;

    // 按稀有度排序
    const aRarity = rarityOrder[a.rarity || '普通'] || 99;
    const bRarity = rarityOrder[b.rarity || '普通'] || 99;
    if (aRarity !== bRarity) return aRarity - bRarity; // 仙品(1) < 普通(4)，所以 aRarity - bRarity 为负，a 排在前面

    // 按等级排序（高到低）
    const aLevel = a.level || 0;
    const bLevel = b.level || 0;
    if (aLevel !== bLevel) return bLevel - aLevel;

    // 按名称排序
    return a.name.localeCompare(b.name, 'zh-CN');
  });
};

/**
 * 物品处理钩子
 */
export function useItemHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UseItemHandlersProps) {
  const handleUseItem = (item: Item) => {
    setPlayer((prev) => applyItemEffect(prev, item, { addLog, setItemActionLog }));
  };

  const handleOrganizeInventory = () => {
    setPlayer((prev) => {
      const newInventory = organizeInventory(prev);
      addLog('背包整理完毕。', 'gain');
      return { ...prev, inventory: newInventory };
    });
  };

  const handleDiscardItem = (item: Item) => {
    showConfirm(
      `确定要丢弃 ${item.name} x${item.quantity} 吗？`,
      '确认丢弃',
      () => {
        setPlayer((prev) => {
          const isEquipped = Object.values(prev.equippedItems).includes(item.id);
          if (isEquipped) {
            addLog('无法丢弃已装备的物品！请先卸下。', 'danger');
            return prev;
          }
          const newInv = prev.inventory.filter((i) => i.id !== item.id);
          addLog(`你丢弃了 ${item.name} x${item.quantity}。`, 'normal');
          return { ...prev, inventory: newInv };
        });
      }
    );
  };

  const handleBatchUseItems = (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    setPlayer((prev) => {
      let currentPlayer = prev;
      itemIds.forEach((itemId) => {
        const item = currentPlayer.inventory.find((i) => i.id === itemId);
        if (item) {
          currentPlayer = applyItemEffect(currentPlayer, item, {
            addLog,
            setItemActionLog,
            isBatch: true
          });
        }
      });
      return currentPlayer;
    });

    if (itemIds.length > 0) {
      addLog(`批量使用了 ${itemIds.length} 件物品。`, 'gain');
    }
  };

  return {
    handleUseItem,
    handleOrganizeInventory,
    handleDiscardItem,
    handleBatchUseItems,
  };
}
