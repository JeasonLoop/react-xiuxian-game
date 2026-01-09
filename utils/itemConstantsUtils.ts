/**
 * 物品常量池工具函数
 * 统一从常量池获取物品，确保所有物品都来自常量池
 */

import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import {
  INITIAL_ITEMS,
  LOTTERY_PRIZES,
  SECT_SHOP_ITEMS,
  PILL_RECIPES,
  DISCOVERABLE_RECIPES,
  getPillDefinition,
  PET_EVOLUTION_MATERIALS_ITEMS,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../constants/index';
import { ITEM_TEMPLATES } from '../constants/itemTemplates';

// 缓存所有物品
let cachedAllItems: Array<ConstantItem> | null = null;
let cachedItemNameMap: Map<string, ConstantItem> | null = null;
let cachedItemRarityMap: Map<ItemRarity, ConstantItem[]> | null = null;
let cachedItemTypeMap: Map<ItemType | string, ConstantItem[]> | null = null;

/**
 * 内部使用的物品类型定义，减少重复代码
 */
interface ConstantItem {
  name: string;
  type: ItemType | string;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
}

/**
 * 将原始项转换为 ConstantItem 格式
 */
function mapToConstantItem(item: any): ConstantItem {
  return {
    name: item.name,
    type: item.type,
    description: item.description,
    rarity: (item.rarity || '普通') as ItemRarity,
    effect: item.effect,
    permanentEffect: item.permanentEffect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
    advancedItemType: item.advancedItemType,
    advancedItemId: item.advancedItemId,
  };
}

/**
 * 从所有常量池中获取所有物品
 */
export function getAllItemsFromConstants(): Array<ConstantItem> {
  // 使用缓存
  if (cachedAllItems) {
    return cachedAllItems;
  }

  const items: ConstantItem[] = [];
  const itemNames = new Set<string>();
  const nameMap = new Map<string, ConstantItem>();
  const rarityMap = new Map<ItemRarity, ConstantItem[]>();
  const typeMap = new Map<ItemType | string, ConstantItem[]>();

  // 辅助函数：将基础物品添加到列表并更新索引
  const addItem = (item: any) => {
    if (itemNames.has(item.name)) return;

    const constantItem = mapToConstantItem(item);

    itemNames.add(item.name);
    items.push(constantItem);

    // 更新索引映射
    nameMap.set(constantItem.name, constantItem);

    // 更新稀有度映射
    const rarityItems = rarityMap.get(constantItem.rarity) || [];
    rarityItems.push(constantItem);
    rarityMap.set(constantItem.rarity, rarityItems);

    // 更新类型映射
    const typeItems = typeMap.get(constantItem.type) || [];
    typeItems.push(constantItem);
    typeMap.set(constantItem.type, typeItems);
  };

  // 1. 从 INITIAL_ITEMS 中提取物品
  INITIAL_ITEMS.forEach(addItem);

  // 2. 从灵宠进化材料中提取物品
  PET_EVOLUTION_MATERIALS_ITEMS.forEach(addItem);

  // 3. 从筑基奇物中提取
  Object.values(FOUNDATION_TREASURES).forEach(treasure => {
    addItem({
      ...treasure,
      type: ItemType.AdvancedItem,
      advancedItemType: 'foundationTreasure',
      advancedItemId: treasure.id,
    });
  });

  // 4. 从天地精华中提取
  Object.values(HEAVEN_EARTH_ESSENCES).forEach(essence => {
    addItem({
      ...essence,
      type: ItemType.AdvancedItem,
      advancedItemType: 'heavenEarthEssence',
      advancedItemId: essence.id,
    });
  });

  // 5. 从天地之髓中提取
  Object.values(HEAVEN_EARTH_MARROWS).forEach(marrow => {
    addItem({
      ...marrow,
      type: ItemType.AdvancedItem,
      advancedItemType: 'heavenEarthMarrow',
      advancedItemId: marrow.id,
    });
  });

  // 6. 从规则之力中提取
  Object.values(LONGEVITY_RULES).forEach(rule => {
    addItem({
      ...rule,
      type: ItemType.AdvancedItem,
      rarity: '仙品',
      advancedItemType: 'longevityRule',
      advancedItemId: rule.id,
    });
  });

  // 7. 从所有丹方中提取丹药
  [...PILL_RECIPES, ...DISCOVERABLE_RECIPES].forEach(recipe => {
    if (recipe.result) {
      addItem(recipe.result);
    }
  });

  // 8. 从抽奖奖品中提取物品
  LOTTERY_PRIZES.forEach(prize => {
    if (prize.type === 'item' && prize.value.item) {
      const item = prize.value.item;
      if (item.type === ItemType.Pill) {
        const pillDef = getPillDefinition(item.name!);
        if (pillDef) {
          addItem(pillDef);
          return;
        }
      }
      addItem(item);
    }
  });

  // 9. 从宗门商店物品中提取
  SECT_SHOP_ITEMS.forEach(shopItem => {
    const item = shopItem.item;
    if (item.type === ItemType.Pill) {
      const pillDef = getPillDefinition(item.name!);
      if (pillDef) {
        addItem(pillDef);
        return;
      }
    }
    addItem(item);
  });

  // 10. 从 ITEM_TEMPLATES 中提取
  ITEM_TEMPLATES.forEach(addItem);

  cachedAllItems = items;
  cachedItemNameMap = nameMap;
  cachedItemRarityMap = rarityMap;
  cachedItemTypeMap = typeMap;

  return items;
}

/**
 * 内部转换函数，确保返回一致的结构
 */
function finalizeItem(item: ConstantItem) {
  const itemType = Object.values(ItemType).includes(item.type as ItemType)
    ? (item.type as ItemType)
    : ItemType.Material;

  return {
    name: item.name,
    type: itemType,
    description: item.description,
    rarity: item.rarity,
    effect: item.effect,
    permanentEffect: item.permanentEffect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
    advancedItemType: item.advancedItemType,
    advancedItemId: item.advancedItemId,
  };
}

/**
 * 从常量池中根据名称获取物品
 * @param itemName 物品名称
 * @returns 物品数据，如果未找到则返回 null
 */
export function getItemFromConstants(itemName: string) {
  getAllItemsFromConstants(); // 确保缓存已填充
  const item = cachedItemNameMap?.get(itemName);
  return item ? finalizeItem(item) : null;
}

/**
 * 从常量池中根据稀有度筛选物品
 * @param rarity 稀有度
 * @returns 符合条件的物品列表
 */
export function getItemsByRarity(rarity: ItemRarity) {
  getAllItemsFromConstants(); // 确保缓存已填充
  const items = cachedItemRarityMap?.get(rarity) || [];
  return items.map(finalizeItem);
}

/**
 * 从常量池中根据类型筛选物品
 * @param itemType 物品类型
 * @returns 符合条件的物品列表
 */
export function getItemsByType(itemType: ItemType) {
  getAllItemsFromConstants(); // 确保缓存已填充
  const items = cachedItemTypeMap?.get(itemType) || [];
  return items.map(finalizeItem);
}

/**
 * 从常量池中获取所有法宝（Artifact类型）
 * @returns 所有法宝列表
 */
export function getAllArtifacts(): Array<{
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
}> {
  return getItemsByType(ItemType.Artifact);
}

