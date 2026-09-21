/**
 * 装备洗炼工具函数
 */
import { Item, ItemRarity, PlayerStats, ItemType } from '../types';
import {
  REFORGE_AFFIX_DEFINITIONS,
  REFORGE_AFFIX_TYPES,
  REFORGE_RARITY_CONFIGS,
  ReforgeAffixType,
  getReforgeCost,
} from '../constants/reforge';

/** 判断物品是否为可洗炼的法宝装备 */
export function isReforgeableEquipment(item: Item): boolean {
  if (!item) return false;
  if (item.isEquippable) return true;
  const eqTypes = [
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Accessory,
    ItemType.Ring,
    ItemType.Artifact,
  ];
  return eqTypes.includes(item.type);
}

/** 统计背包中太虚洗炼石总数 */
export function getReforgeStoneCount(player: PlayerStats): number {
  return player.inventory.reduce((count, item) => {
    if (item.name === '太虚洗炼石' || item.id === 'taixu-reforge-stone') {
      return count + (item.quantity || 1);
    }
    return count;
  }, 0);
}

/**
 * 为指定稀有度生成洗炼词条列表
 * @param count 可指定条数；不传则按稀有度配置随机
 * @param excludedTypes 需要从类型池中排除的词条类型（通常为已锁定类型）
 */
export function rollReforgeAffixes(
  rarity: ItemRarity = '普通',
  count?: number,
  excludedTypes?: Set<ReforgeAffixType>
): Array<{
  type: ReforgeAffixType;
  name: string;
  value: number;
}> {
  const config = REFORGE_RARITY_CONFIGS[rarity] || REFORGE_RARITY_CONFIGS['普通'];
  const affixCount =
    count ??
    (Math.floor(Math.random() * (config.maxAffixes - config.minAffixes + 1)) +
      config.minAffixes);

  const pool = REFORGE_AFFIX_TYPES.filter(
    (t) => !excludedTypes || !excludedTypes.has(t)
  );
  const chosenTypes: ReforgeAffixType[] = [];
  for (let i = 0; i < affixCount && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosenTypes.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return chosenTypes.map((type) => {
    const def = REFORGE_AFFIX_DEFINITIONS[type];
    // 在 [minValue, maxValue] 区间内随机生成，保留3位小数
    const rawVal = config.minValue + Math.random() * (config.maxValue - config.minValue);
    const value = Math.round(rawVal * 1000) / 1000;
    return {
      type,
      name: def.name,
      value,
    };
  });
}

/**
 * 洗炼候选生成：校验→扣费→保留锁定词条→重掷其余词条，结果存入 pendingReforge 待玩家取舍。
 * 费用与次数在掷出时即消耗，舍弃不退费，防止无限免费重掷。
 */
export function rollReforgeCandidate(
  player: PlayerStats,
  itemId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
  candidate?: Array<{ type: ReforgeAffixType; name: string; value: number }>;
} {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return {
      success: false,
      message: '法宝未在背包中找到！',
      updatedPlayer: player,
    };
  }

  const targetItem = player.inventory[itemIndex];
  if (!isReforgeableEquipment(targetItem)) {
    return {
      success: false,
      message: '该物品非道兵法宝，无法进行淬火洗炼！',
      updatedPlayer: player,
    };
  }

  if (targetItem.pendingReforge) {
    return {
      success: false,
      message: '仙炉中尚有未取舍的洗炼候选，请先采纳或舍弃！',
      updatedPlayer: player,
    };
  }

  const currentAffixes = targetItem.reforgeAffixes || [];
  const locks = targetItem.reforgeLocks || [];
  const lockedAffixes = currentAffixes.filter((_, idx) => locks[idx]);
  const lockedTypes = new Set(lockedAffixes.map((a) => a.type));
  const lockedCount = lockedAffixes.length;

  const currentReforgeCount = targetItem.reforgeCount || 0;
  const { stones: costStones, spiritStones: costSpiritStones } = getReforgeCost(
    currentReforgeCount,
    lockedCount
  );

  const availableStones = getReforgeStoneCount(player);
  if (availableStones < costStones) {
    return {
      success: false,
      message: `太虚洗炼石不足！本次洗炼需 ${costStones} 颗，当前仅有 ${availableStones} 颗（可通过通天塔与灵兽远征获取）。`,
      updatedPlayer: player,
    };
  }

  if (player.spiritStones < costSpiritStones) {
    return {
      success: false,
      message: `灵石不足！本次洗炼需 ${costSpiritStones.toLocaleString()} 灵石。`,
      updatedPlayer: player,
    };
  }

  // 扣除灵石与洗炼石
  let stonesToDeduct = costStones;
  const newInventory = player.inventory
    .map((item) => {
      if (
        (item.name === '太虚洗炼石' || item.id === 'taixu-reforge-stone') &&
        stonesToDeduct > 0
      ) {
        const qty = item.quantity || 1;
        if (qty <= stonesToDeduct) {
          stonesToDeduct -= qty;
          return null; // 全部扣完
        } else {
          const rem = qty - stonesToDeduct;
          stonesToDeduct = 0;
          return { ...item, quantity: rem };
        }
      }
      return item;
    })
    .filter((item): item is Item => item !== null);

  // 目标条数不降于当前条数，保证锁定多条时不会越洗越少
  const config =
    REFORGE_RARITY_CONFIGS[targetItem.rarity || '普通'] ||
    REFORGE_RARITY_CONFIGS['普通'];
  const rolledCount =
    Math.floor(Math.random() * (config.maxAffixes - config.minAffixes + 1)) +
    config.minAffixes;
  const targetCount = Math.max(currentAffixes.length, rolledCount, lockedCount);

  // 候选 = 锁定词条原样保留 + 未锁位置重新掷点（类型池排除已锁类型）
  const freeCount = Math.max(0, targetCount - lockedCount);
  const rolledAffixes = rollReforgeAffixes(
    targetItem.rarity || '普通',
    freeCount,
    lockedTypes
  );
  const candidate = [...lockedAffixes, ...rolledAffixes];

  // 更新法宝：洗炼次数 +1，候选存入 pendingReforge
  const updatedItem: Item = {
    ...targetItem,
    reforgeCount: currentReforgeCount + 1,
    pendingReforge: candidate,
  };

  // 替换背包中的装备项
  const targetNewIndex = newInventory.findIndex((i) => i.id === itemId);
  if (targetNewIndex !== -1) {
    newInventory[targetNewIndex] = updatedItem;
  } else {
    newInventory.push(updatedItem);
  }

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: player.spiritStones - costSpiritStones,
    inventory: newInventory,
  };

  return {
    success: true,
    message: `【万宝淬炼】仙炉神火烈烈！【${targetItem.name}】重铸出新的道蕴候选，请取舍！`,
    updatedPlayer,
    candidate,
  };
}

/**
 * 采纳洗炼候选：将 pendingReforge 写入 reforgeAffixes
 */
export function applyReforgeCandidate(
  player: PlayerStats,
  itemId: string
): { success: boolean; message: string; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1 || !player.inventory[itemIndex].pendingReforge) {
    return { success: false, message: '无待采纳的洗炼候选！', updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  const newInventory = [...player.inventory];
  newInventory[itemIndex] = {
    ...targetItem,
    reforgeAffixes: targetItem.pendingReforge,
    pendingReforge: undefined,
  };

  return {
    success: true,
    message: `【万宝淬炼】天地道蕴已铭刻！【${targetItem.name}】新词条生效。`,
    updatedPlayer: { ...player, inventory: newInventory },
  };
}

/**
 * 舍弃洗炼候选：清空 pendingReforge，费用不退
 */
export function discardReforgeCandidate(
  player: PlayerStats,
  itemId: string
): { success: boolean; message: string; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1 || !player.inventory[itemIndex].pendingReforge) {
    return { success: false, message: '无待舍弃的洗炼候选！', updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  const newInventory = [...player.inventory];
  newInventory[itemIndex] = {
    ...targetItem,
    pendingReforge: undefined,
  };

  return {
    success: true,
    message: `【万宝淬炼】候选道蕴已散于天地，灵石与洗炼石不予退回。`,
    updatedPlayer: { ...player, inventory: newInventory },
  };
}

/**
 * 切换指定词条的锁定状态（存在 pendingReforge 时禁止操作）
 */
export function toggleReforgeLock(
  player: PlayerStats,
  itemId: string,
  index: number
): { success: boolean; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { success: false, updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  if (targetItem.pendingReforge) {
    return { success: false, updatedPlayer: player };
  }

  const affixes = targetItem.reforgeAffixes || [];
  if (index < 0 || index >= affixes.length) {
    return { success: false, updatedPlayer: player };
  }

  const locks = [...(targetItem.reforgeLocks || [])];
  while (locks.length < affixes.length) locks.push(false);
  locks[index] = !locks[index];

  // 至少保留一个未锁定位置，避免仙炉无法重掷任何词条
  const lockedCount = locks.filter(Boolean).length;
  if (lockedCount >= affixes.length && affixes.length > 0) {
    return { success: false, updatedPlayer: player };
  }

  const newInventory = [...player.inventory];
  newInventory[itemIndex] = { ...targetItem, reforgeLocks: locks };

  return { success: true, updatedPlayer: { ...player, inventory: newInventory } };
}
