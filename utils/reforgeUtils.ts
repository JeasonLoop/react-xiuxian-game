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

/** 随机抽取指定数量的唯一词条类型 */
function sampleUniqueAffixTypes(count: number): ReforgeAffixType[] {
  const pool = [...REFORGE_AFFIX_TYPES];
  const selected: ReforgeAffixType[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return selected;
}

/** 为指定稀有度生成新的洗炼词条列表 */
export function rollReforgeAffixes(rarity: ItemRarity = '普通'): Array<{
  type: ReforgeAffixType;
  name: string;
  value: number;
}> {
  const config = REFORGE_RARITY_CONFIGS[rarity] || REFORGE_RARITY_CONFIGS['普通'];
  const affixCount = Math.floor(
    Math.random() * (config.maxAffixes - config.minAffixes + 1)
  ) + config.minAffixes;

  const chosenTypes = sampleUniqueAffixTypes(affixCount);

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
 * 执行装备洗炼
 */
export function executeItemReforge(
  player: PlayerStats,
  itemId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
  newAffixes?: Array<{ type: ReforgeAffixType; name: string; value: number }>;
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

  const currentReforgeCount = targetItem.reforgeCount || 0;
  const { stones: costStones, spiritStones: costSpiritStones } = getReforgeCost(currentReforgeCount);

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

  // 重新生成词条
  const rolledAffixes = rollReforgeAffixes(targetItem.rarity || '普通');

  // 更新法宝自身词条与洗炼次数
  const updatedItem: Item = {
    ...targetItem,
    reforgeAffixes: rolledAffixes,
    reforgeCount: currentReforgeCount + 1,
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

  const affixDesc = rolledAffixes
    .map(
      (a) =>
        `${REFORGE_AFFIX_DEFINITIONS[a.type].name} +${(a.value * 100).toFixed(1)}%`
    )
    .join('、');

  return {
    success: true,
    message: `【万宝淬炼】仙炉神火烈烈！【${targetItem.name}】重铸成功，觉醒道蕴：${affixDesc}`,
    updatedPlayer,
    newAffixes: rolledAffixes,
  };
}
