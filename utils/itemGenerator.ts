/**
 * 物品生成工具函数
 * 支持根据类型、品级、数量生成物品
 */

import { Item, ItemType, ItemRarity, EquipmentSlot, LotteryPrize } from '../types';
import { ITEM_TEMPLATES, getItemTemplatesByType, getItemTemplatesByRarity, getItemTemplatesByTypeAndRarity } from '../constants/itemTemplates';
import { uid } from './gameUtils';

/**
 * 物品生成配置
 */
interface GenerateItemsOptions {
  type?: ItemType; // 物品类型，如果不指定则从所有类型中选择
  rarity?: ItemRarity; // 稀有度，如果不指定则根据权重随机
  count: number; // 生成数量
  allowDuplicates?: boolean; // 是否允许重复
  realm?: 'QiRefining' | 'Foundation' | 'GoldenCore' | 'NascentSoul' | 'SpiritSevering' | 'DaoCombining' | 'LongevityRealm'; // 境界，用于调整数值
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
 * 根据境界调整物品数值
 * 优化：降低倍数增长，与装备调整函数保持一致，防止数值膨胀
 */
function adjustStatsByRealm(
  effect: Item['effect'],
  permanentEffect: Item['permanentEffect'],
  realm: string,
  realmLevel: number = 1
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  // 优化后的境界倍数：与装备调整函数保持一致
  // 从 [1, 2, 4, 8, 16, 32, 64] 改为 [1, 1.5, 2.5, 4, 6, 10, 16]
  const realmMultipliers: Record<string, number> = {
    QiRefining: 1,
    Foundation: 1.5,
    GoldenCore: 2.5,
    NascentSoul: 4,
    SpiritSevering: 6,
    DaoCombining: 10,
    LongevityRealm: 16,
  };

  const realmMultiplier = realmMultipliers[realm] || 1;
  // 降低层数加成：从10%降低到8%，与装备调整保持一致
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  const totalMultiplier = realmMultiplier * levelMultiplier;

  const adjusted: Item['effect'] = {};
  const adjustedPermanent: Item['permanentEffect'] = {};

  // 调整临时效果
  if (effect) {
    if (effect.attack) adjusted.attack = Math.floor(effect.attack * totalMultiplier);
    if (effect.defense) adjusted.defense = Math.floor(effect.defense * totalMultiplier);
    if (effect.hp) adjusted.hp = Math.floor(effect.hp * totalMultiplier);
    if (effect.spirit) adjusted.spirit = Math.floor(effect.spirit * totalMultiplier);
    if (effect.physique) adjusted.physique = Math.floor(effect.physique * totalMultiplier);
    if (effect.speed) adjusted.speed = Math.floor(effect.speed * totalMultiplier);
    if (effect.exp) adjusted.exp = Math.floor(effect.exp * totalMultiplier);
    if (effect.lifespan) adjusted.lifespan = effect.lifespan; // 寿命不受境界调整影响
  }

  // 调整永久效果
  if (permanentEffect) {
    if (permanentEffect.attack) adjustedPermanent.attack = Math.floor(permanentEffect.attack * totalMultiplier);
    if (permanentEffect.defense) adjustedPermanent.defense = Math.floor(permanentEffect.defense * totalMultiplier);
    if (permanentEffect.spirit) adjustedPermanent.spirit = Math.floor(permanentEffect.spirit * totalMultiplier);
    if (permanentEffect.physique) adjustedPermanent.physique = Math.floor(permanentEffect.physique * totalMultiplier);
    if (permanentEffect.speed) adjustedPermanent.speed = Math.floor(permanentEffect.speed * totalMultiplier);
    if (permanentEffect.maxHp) adjustedPermanent.maxHp = Math.floor(permanentEffect.maxHp * totalMultiplier);
    if (permanentEffect.maxLifespan) adjustedPermanent.maxLifespan = permanentEffect.maxLifespan; // 最大寿命不受境界调整影响

    if (permanentEffect.spiritualRoots) {
      adjustedPermanent.spiritualRoots = {};
      const roots = permanentEffect.spiritualRoots;
      if (roots.metal) adjustedPermanent.spiritualRoots.metal = Math.floor(roots.metal * totalMultiplier);
      if (roots.wood) adjustedPermanent.spiritualRoots.wood = Math.floor(roots.wood * totalMultiplier);
      if (roots.water) adjustedPermanent.spiritualRoots.water = Math.floor(roots.water * totalMultiplier);
      if (roots.fire) adjustedPermanent.spiritualRoots.fire = Math.floor(roots.fire * totalMultiplier);
      if (roots.earth) adjustedPermanent.spiritualRoots.earth = Math.floor(roots.earth * totalMultiplier);
    }
  }

  return {
    effect: Object.keys(adjusted).length > 0 ? adjusted : effect,
    permanentEffect: Object.keys(adjustedPermanent).length > 0 ? adjustedPermanent : permanentEffect,
  };
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
      const adjusted = adjustStatsByRealm(item.effect, item.permanentEffect, realm, realmLevel);
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
