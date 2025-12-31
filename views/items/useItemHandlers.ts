import React from 'react';
import { PlayerStats, Item, Pet, ItemType, ItemRarity, RealmType } from '../../types';
import { PET_TEMPLATES, DISCOVERABLE_RECIPES, getRandomPetName, REALM_ORDER,} from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { showConfirm } from '../../utils/toastUtils';
import { LOOT_ITEMS } from '../../services/battleService';
import { compareItemEffects } from '../../utils/objectUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { useGameStore } from '../../store';
import { useUIStore } from '../../store';

// 兼容旧接口（可选，用于向后兼容）
interface UseItemHandlersProps {
  player?: PlayerStats | null;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog?: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  onOpenTreasureVault?: () => void; // 打开宗门宝库弹窗的回调
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

  // 1. 处理传承石（特殊物品）- 已删除传承路线功能，仅提升传承等级
  const isInheritanceStone = item.name === '传承石';
  if (isInheritanceStone) {
    addLog(`✨ 你使用了传承石，传承等级 +1！`, 'special');
    return {
      ...newStats,
      inventory: newInv,
      pets: newPets,
      inheritanceLevel: (prev.inheritanceLevel || 0) + 1,
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
    // 使用实际最大血量（包含金丹法数加成等）作为上限
    const totalStats = getPlayerTotalStats(newStats);
    const actualMaxHp = totalStats.maxHp;
    newStats.hp = Math.min(actualMaxHp, newStats.hp + item.effect.hp);
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

  // 4. 处理材料包（使用后获得若干对应品级的丹药）
  const isMaterialPack = item.name.includes('材料包');
  if (isMaterialPack) {
    // 根据材料包的稀有度确定要生成的丹药稀有度
    const packRarity = item.rarity || '普通';
    let targetRarity: ItemRarity = '普通';

    // 材料包的稀有度对应生成丹药的稀有度
    if (packRarity === '仙品') {
      targetRarity = '仙品';
    } else if (packRarity === '传说') {
      targetRarity = '传说';
    } else if (packRarity === '稀有') {
      targetRarity = '稀有';
    } else {
      targetRarity = '普通';
    }

    // 从对应稀有度的丹药中筛选
    const allPills = LOOT_ITEMS.pills;
    let availablePills: Array<{
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      effect?: any;
      permanentEffect?: any;
      description?: string;
    }> = allPills.filter(p => p.rarity === targetRarity);

    // 如果没有找到对应稀有度的丹药，降级查找
    if (availablePills.length === 0 && targetRarity !== '普通') {
      availablePills = allPills.filter(p => p.rarity === '普通');
    }

    // 如果还是没有，从草药中获取（草药也可以作为丹药材料）
    if (availablePills.length === 0) {
      const allHerbs = LOOT_ITEMS.herbs;
      availablePills = allHerbs.filter(h => h.rarity === targetRarity || targetRarity === '普通').map(h => ({
        name: h.name,
        type: ItemType.Pill, // 强制设置为丹药类型，因为材料包应该生成丹药
        rarity: h.rarity,
        effect: h.effect,
        permanentEffect: (h as any).permanentEffect,
        description: (h as any).description,
      }));
    }

    // 如果仍然为空，使用默认丹药
    if (availablePills.length === 0) {
      // 创建一个默认丹药作为后备
      availablePills = [{
        name: '聚气丹',
        type: ItemType.Pill,
        rarity: '普通' as ItemRarity,
        effect: { exp: 50 },
        permanentEffect: { spirit: 1 },
        description: '基础的聚气丹药，可恢复少量修为。',
      }];
    }

    // 生成3-6个随机丹药
    const pillCount = 3 + Math.floor(Math.random() * 4); // 3-6个
    const obtainedPills: Item[] = [];
    const pillNames = new Set<string>();

    for (let i = 0; i < pillCount && availablePills.length > 0; i++) {
      const randomPill = availablePills[Math.floor(Math.random() * availablePills.length)];
      const pillName = randomPill.name;

      // 避免重复（如果丹药池不够大，允许少量重复）
      if (!pillNames.has(pillName) || pillNames.size >= availablePills.length) {
        pillNames.add(pillName);
        const quantity = 1 + Math.floor(Math.random() * 3); // 每个丹药1-3个
        obtainedPills.push({
          id: uid(),
          name: pillName,
          type: ItemType.Pill, // 强制设置为丹药类型，确保类型正确
          description: randomPill.description || `${pillName}，来自材料包的丹药。`,
          quantity,
          rarity: randomPill.rarity,
          effect: randomPill.effect,
          permanentEffect: randomPill.permanentEffect,
        });
      }
    }

    // 将获得的丹药添加到背包
    obtainedPills.forEach(pill => {
      // 检查背包中是否已有相同丹药（按名称、类型、稀有度、效果匹配）
      // 使用优化的深度比较函数替代 JSON.stringify，提高性能
      const existingIndex = newInv.findIndex(
        i => i.name === pill.name &&
        i.type === pill.type &&
        i.rarity === pill.rarity &&
        compareItemEffects(i.effect, pill.effect, i.permanentEffect, pill.permanentEffect)
      );

      if (existingIndex >= 0) {
        newInv[existingIndex].quantity += pill.quantity;
      } else {
        newInv.push(pill);
      }
    });

    if (obtainedPills.length > 0) {
      const pillList = obtainedPills.map(p => `${p.name} x${p.quantity}`).join('、');
      effectLogs.push(`✨ 获得了：${pillList}`);
      if (!isBatch) {
        addLog(`你打开了${item.name}，获得了：${pillList}`, 'gain');
      }
    } else {
      if (!isBatch) {
        addLog(`你打开了${item.name}，但似乎什么都没有...`, 'normal');
      }
    }
  }

  // 5. 处理丹方使用
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
    [ItemType.AdvancedItem]: 9, // 进阶物品
    [ItemType.Recipe]: 10,
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
 * 现在直接从 zustand store 获取状态，props 为可选（向后兼容）
 */
export function useItemHandlers(props?: UseItemHandlersProps) {
  // 从 zustand store 获取状态
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);
  const storeSetItemActionLog = useUIStore((state) => state.setItemActionLog);
  const storeSetIsTreasureVaultOpen = useUIStore((state) => state.setIsTreasureVaultOpen);

  // 使用 props 或 store 的值（props 优先，用于向后兼容）
  const player = props?.player ?? storePlayer;
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const setItemActionLog = props?.setItemActionLog ?? storeSetItemActionLog;
  const onOpenTreasureVault = props?.onOpenTreasureVault ?? (() => storeSetIsTreasureVaultOpen(true));

  // 如果 player 为 null，返回空的 handlers（防御性编程）
  if (!player) {
    return {
      handleUseItem: () => {},
      handleOrganizeInventory: () => {},
      handleDiscardItem: () => {},
      handleBatchUseItems: () => {},
      handleRefineAdvancedItem: () => {},
    };
  }

  const handleUseItem = (item: Item) => {
    // 检查是否是宗门宝库钥匙
    const isTreasureVaultKey = item.name === '宗门宝库钥匙';

    if (isTreasureVaultKey) {
      // 宗主身份，钥匙可重复使用，不消耗钥匙
      addLog('你使用了宗门宝库钥匙，打开了宗门宝库！', 'special');

      // 打开宗门宝库弹窗
      if (onOpenTreasureVault) {
        onOpenTreasureVault();
      }
      return;
    }

    // 其他物品正常使用
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

  const handleRefineAdvancedItem = (item: Item) => {
    if (item.type !== ItemType.AdvancedItem || !item.advancedItemType || !item.advancedItemId) {
      addLog('该物品不是进阶物品！', 'danger');
      return;
    }

    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
    let requiredRealm: RealmType | null = null;
    let canRefine = false;
    let warningMessage = '';

    if (item.advancedItemType === 'foundationTreasure') {
      requiredRealm = RealmType.QiRefining;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.QiRefining);
      warningMessage = '天道警告：炼化筑基奇物需要达到炼气期！';
    } else if (item.advancedItemType === 'heavenEarthEssence') {
      requiredRealm = RealmType.GoldenCore;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore);
      warningMessage = '天道警告：炼化天地精华需要达到金丹期！';
    } else if (item.advancedItemType === 'heavenEarthMarrow') {
      requiredRealm = RealmType.NascentSoul;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.NascentSoul);
      warningMessage = '天道警告：炼化天地之髓需要达到元婴期！';
    } else if (item.advancedItemType === 'longevityRule') {
      requiredRealm = RealmType.DaoCombining;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.DaoCombining);
      warningMessage = '天道警告：炼化规则之力需要达到合道期！';
    }

    if (!canRefine) {
      addLog(warningMessage, 'danger');
      return;
    }

    // 检查是否已经拥有
    if (item.advancedItemType === 'foundationTreasure' && player.foundationTreasure) {
      addLog('你已经拥有筑基奇物，无法重复炼化！', 'danger');
      return;
    }
    if (item.advancedItemType === 'heavenEarthEssence' && player.heavenEarthEssence) {
      addLog('你已经拥有天地精华，无法重复炼化！', 'danger');
      return;
    }
    if (item.advancedItemType === 'heavenEarthMarrow' && player.heavenEarthMarrow) {
      addLog('你已经拥有天地之髓，无法重复炼化！', 'danger');
      return;
    }
    if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
      if ((player.longevityRules || []).includes(item.advancedItemId)) {
        addLog('你已经拥有该规则之力，无法重复炼化！', 'danger');
        return;
      }
      const maxRules = player.maxLongevityRules || 3;
      if ((player.longevityRules || []).length >= maxRules) {
        addLog('你已经拥有最大数量的规则之力，无法继续炼化！', 'danger');
        return;
      }
    }

    // 执行炼化
    setPlayer((prev) => {
      const newInventory = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      let newFoundationTreasure = prev.foundationTreasure;
      let newHeavenEarthEssence = prev.heavenEarthEssence;
      let newHeavenEarthMarrow = prev.heavenEarthMarrow;
      let newLongevityRules = [...(prev.longevityRules || [])];
      let marrowRefiningProgress = prev.marrowRefiningProgress;
      let marrowRefiningSpeed = prev.marrowRefiningSpeed;

      if (item.advancedItemType === 'foundationTreasure') {
        newFoundationTreasure = item.advancedItemId;
        const successMessage = `✨ 你成功炼化了筑基奇物【${item.name}】！`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'heavenEarthEssence') {
        newHeavenEarthEssence = item.advancedItemId;
        const successMessage = `✨ 你成功炼化了天地精华【${item.name}】！`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'heavenEarthMarrow') {
        newHeavenEarthMarrow = item.advancedItemId;
        marrowRefiningProgress = 0;
        marrowRefiningSpeed = 1.0;
        const successMessage = `✨ 你成功炼化了天地之髓【${item.name}】！`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
        newLongevityRules.push(item.advancedItemId);
        const successMessage = `✨ 你成功炼化了规则之力【${item.name}】！`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      }

      return {
        ...prev,
        inventory: newInventory,
        foundationTreasure: newFoundationTreasure,
        heavenEarthEssence: newHeavenEarthEssence,
        heavenEarthMarrow: newHeavenEarthMarrow,
        longevityRules: newLongevityRules,
        marrowRefiningProgress,
        marrowRefiningSpeed,
      };
    });
  };

  return {
    handleUseItem,
    handleOrganizeInventory,
    handleDiscardItem,
    handleBatchUseItems,
    handleRefineAdvancedItem,
  };
}
