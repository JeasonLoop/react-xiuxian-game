/**
 * 物品生成工具函数
 * 支持根据类型、品级、数量生成物品
 */

import { Item, ItemType, ItemRarity, EquipmentSlot, LotteryPrize, RealmType } from '../types';
import { ITEM_TEMPLATES, getItemTemplatesByType, getItemTemplatesByRarity, getItemTemplatesByTypeAndRarity } from '../constants/itemTemplates';
import { uid } from './gameUtils';
import { adjustItemStatsByRealm } from './itemUtils';

/**
 * 物品生成配置
 */
interface GenerateItemsOptions {
  type?: ItemType; // 物品类型，如果不指定则从所有类型中选择
  rarity?: ItemRarity; // 稀有度，如果不指定则根据权重随机
  count: number; // 生成数量
  allowDuplicates?: boolean; // 是否允许重复
  realm?: RealmType; // 境界，用于调整数值
  realmLevel?: number; // 境界等级，用于调整数值
}

/**
 * 根据稀有度获取权重
 */
function getRarityWeight(rarity: ItemRarity): number {
  const weights: Record<ItemRarity, number> = {
    普通: 40,
    稀有: 30,
    传说: 20,
    仙品: 10,
  };
  return weights[rarity];
}

/**
 * 根据权重随机选择稀有度
 */
function randomRarityByWeight(): ItemRarity {
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
  const totalWeight = rarities.reduce((sum, rarity) => sum + getRarityWeight(rarity), 0);

  let random = Math.random() * totalWeight;
  for (const rarity of rarities) {
    random -= getRarityWeight(rarity);
    if (random <= 0) {
      return rarity;
    }
  }

  return '普通';
}

/**
 * 生成物品
 * @param options 生成配置
 * @returns 生成的物品数组
 */
export function generateItems(options: GenerateItemsOptions): Item[] {
  const { type, rarity, count, allowDuplicates = true, realm, realmLevel = 1 } = options;

  // 获取可用的物品模板
  let availableTemplates = ITEM_TEMPLATES;

  if (type && rarity) {
    // 指定类型和稀有度
    availableTemplates = getItemTemplatesByTypeAndRarity(type, rarity);
  } else if (type) {
    // 只指定类型
    availableTemplates = getItemTemplatesByType(type);
  } else if (rarity) {
    // 只指定稀有度
    availableTemplates = getItemTemplatesByRarity(rarity);
  }

  // 如果没有找到模板，返回空数组
  if (availableTemplates.length === 0) {
    return [];
  }

  const generatedItems: Item[] = [];
  const usedIds = new Set<string>();
  const maxAttempts = count * 10; // 防止无限循环
  let attempts = 0;

  while (generatedItems.length < count && attempts < maxAttempts) {
    attempts++;

    // 随机选择一个模板
    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    // 如果不允许重复，检查是否已经使用过
    if (!allowDuplicates && usedIds.has(template.id)) {
      continue;
    }

    // 深拷贝模板
    const item: Item = JSON.parse(JSON.stringify(template));

    // 生成新的唯一ID（使用 uid 函数确保唯一性，不依赖模板的 id）
    item.id = uid();

    // 如果没有指定稀有度，根据权重随机选择
    if (!rarity) {
      item.rarity = randomRarityByWeight();
    }

    // 根据境界调整数值
    if (realm) {
      const adjusted = adjustItemStatsByRealm(item.effect, item.permanentEffect, realm, realmLevel || 1, item.type, item.rarity || '普通');
      item.effect = adjusted.effect;
      item.permanentEffect = adjusted.permanentEffect;
    }

    generatedItems.push(item);
    usedIds.add(template.id);
  }

  return generatedItems;
}

/**
 * 生成单个物品
 * @param options 生成配置
 * @returns 生成的物品，如果失败则返回null
 */
export function generateItem(options: Omit<GenerateItemsOptions, 'count'>): Item | null {
  const items = generateItems({ ...options, count: 1 });
  return items.length > 0 ? items[0] : null;
}

/**
 * 生成抽奖奖品
 * @param options 生成配置
 * @returns 生成的抽奖奖品数组
 */
export function generateLotteryPrizes(options: Omit<GenerateItemsOptions, 'count'>): LotteryPrize[] {
  const item = generateItem(options);

  if (!item) {
    return [];
  }

  const weight = getRarityWeight(item.rarity);

  return [{
    id: `lottery-prize-${item.id}`,
    name: item.name,
    type: 'item',
    rarity: item.rarity,
    weight,
    value: {
      item,
    },
  }];
}

/**
 * 生成指定数量的物品，每种类型各生成指定数量
 * @param types 物品类型数组
 * @param rarity 稀有度
 * @param count 每种类型的数量
 * @returns 生成的物品数组
 */
export function generateItemsByTypes(
  types: ItemType[],
  rarity: ItemRarity,
  count: number
): Item[] {
  const items: Item[] = [];

  types.forEach(type => {
    const typeItems = generateItems({
      type,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...typeItems);
  });

  return items;
}

/**
 * 生成所有品级的装备
 * @param count 每种品级的数量
 * @returns 生成的装备数组
 */
export function generateAllRarityEquipments(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
  const types: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact];

  const items: Item[] = [];

  types.forEach(type => {
    rarities.forEach(rarity => {
      const rarityItems = generateItems({
        type,
        rarity,
        count,
        allowDuplicates: false,
      });
      items.push(...rarityItems);
    });
  });

  return items;
}

/**
 * 生成所有品级的丹药
 * @param count 每种品级的数量
 * @returns 生成的丹药数组
 */
export function generateAllRarityPills(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Pill,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * 生成所有品级的草药
 * @param count 每种品级的数量
 * @returns 生成的草药数组
 */
export function generateAllRarityHerbs(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Herb,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * 生成所有品级的材料
 * @param count 每种品级的数量
 * @returns 生成的材料数组
 */
export function generateAllRarityMaterials(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Material,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * 生成所有类型的物品（装备、丹药、草药、材料）
 * @param count 每种类型每个品级的数量
 * @returns 生成的物品数组
 */
export function generateAllItems(count: number = 10): Item[] {
  return [
    ...generateAllRarityEquipments(count),
    ...generateAllRarityPills(count),
    ...generateAllRarityHerbs(count),
    ...generateAllRarityMaterials(count),
  ];
}
