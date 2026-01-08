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
let cachedAllItems: Array<{
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
}> | null = null;

/**
 * 从所有常量池中获取所有物品
 */
export function getAllItemsFromConstants(): Array<{
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
}> {
  // 使用缓存
  if (cachedAllItems) {
    return cachedAllItems;
  }

  const items: Array<{
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
  }> = [];
  const itemNames = new Set<string>();

  // 辅助函数：将基础物品添加到列表
  const addItem = (item: any) => {
    if (itemNames.has(item.name)) return;
    itemNames.add(item.name);
    items.push({
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
    });
  };

  // 1. 从 INITIAL_ITEMS 中提取物品
  INITIAL_ITEMS.forEach(addItem);

  // 2. 从灵宠进化材料中提取物品
  PET_EVOLUTION_MATERIALS_ITEMS.forEach(addItem);

  // 3. 从筑基奇物中提取
  Object.values(FOUNDATION_TREASURES).forEach(treasure => {
    if (itemNames.has(treasure.name)) return;
    itemNames.add(treasure.name);
    items.push({
      name: treasure.name,
      type: ItemType.AdvancedItem,
      description: treasure.description,
      rarity: treasure.rarity,
      advancedItemType: 'foundationTreasure',
      advancedItemId: treasure.id,
    });
  });

  // 4. 从天地精华中提取
  Object.values(HEAVEN_EARTH_ESSENCES).forEach(essence => {
    if (itemNames.has(essence.name)) return;
    itemNames.add(essence.name);
    items.push({
      name: essence.name,
      type: ItemType.AdvancedItem,
      description: essence.description,
      rarity: essence.rarity,
      advancedItemType: 'heavenEarthEssence',
      advancedItemId: essence.id,
    });
  });

  // 5. 从天地之髓中提取
  Object.values(HEAVEN_EARTH_MARROWS).forEach(marrow => {
    if (itemNames.has(marrow.name)) return;
    itemNames.add(marrow.name);
    items.push({
      name: marrow.name,
      type: ItemType.AdvancedItem,
      description: marrow.description,
      rarity: marrow.rarity,
      advancedItemType: 'heavenEarthMarrow',
      advancedItemId: marrow.id,
    });
  });

  // 6. 从规则之力中提取
  Object.values(LONGEVITY_RULES).forEach(rule => {
    if (itemNames.has(rule.name)) return;
    itemNames.add(rule.name);
    items.push({
      name: rule.name,
      type: ItemType.AdvancedItem,
      description: rule.description,
      rarity: '仙品',
      advancedItemType: 'longevityRule',
      advancedItemId: rule.id,
    });
  });

  // 7. 从所有丹方中提取丹药
  [...PILL_RECIPES, ...DISCOVERABLE_RECIPES].forEach(recipe => {
    if (recipe.result && !itemNames.has(recipe.result.name)) {
      itemNames.add(recipe.result.name);
      items.push({
        name: recipe.result.name,
        type: recipe.result.type,
        description: recipe.result.description,
        rarity: recipe.result.rarity as ItemRarity,
        effect: recipe.result.effect,
        permanentEffect: recipe.result.permanentEffect,
      });
    }
  });

  // 8. 从抽奖奖品中提取物品
  LOTTERY_PRIZES.forEach(prize => {
    if (prize.type === 'item' && prize.value.item) {
      const item = prize.value.item;
      if (itemNames.has(item.name)) return;
      itemNames.add(item.name);

      if (item.type === ItemType.Pill) {
        const pillDef = getPillDefinition(item.name);
        if (pillDef) {
          items.push({
            name: pillDef.name,
            type: pillDef.type,
            description: pillDef.description,
            rarity: pillDef.rarity as ItemRarity,
            effect: pillDef.effect,
            permanentEffect: pillDef.permanentEffect,
          });
          return;
        }
      }
      addItem(item);
    }
  });

  // 9. 从宗门商店物品中提取
  SECT_SHOP_ITEMS.forEach(shopItem => {
    const item = shopItem.item;
    if (itemNames.has(item.name)) return;
    itemNames.add(item.name);

    if (item.type === ItemType.Pill) {
      const pillDef = getPillDefinition(item.name);
      if (pillDef) {
        items.push({
          name: pillDef.name,
          type: pillDef.type,
          description: pillDef.description,
          rarity: pillDef.rarity as ItemRarity,
          effect: pillDef.effect,
          permanentEffect: pillDef.permanentEffect,
        });
        return;
      }
    }
    addItem(item);
  });

  // 10. 从 ITEM_TEMPLATES 中提取
  ITEM_TEMPLATES.forEach(addItem);

  cachedAllItems = items;
  return items;
}

/**
 * 从常量池中根据名称获取物品
 * @param itemName 物品名称
 * @returns 物品数据，如果未找到则返回 null
 */
export function getItemFromConstants(itemName: string): {
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
} | null {
  const allItems = getAllItemsFromConstants();
  const item = allItems.find(i => i.name === itemName);

  if (!item) {
    return null;
  }

  // 验证物品类型是否为有效的 ItemType
  const itemType = Object.values(ItemType).includes(item.type as ItemType)
    ? (item.type as ItemType)
    : ItemType.Material;

  const result: any = {
    name: item.name,
    type: itemType,
    description: item.description,
    rarity: item.rarity,
    effect: item.effect,
    permanentEffect: item.permanentEffect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
  };

  // 如果物品是进阶物品，添加进阶物品信息
  if (itemType === ItemType.AdvancedItem && (item as any).advancedItemType) {
    result.advancedItemType = (item as any).advancedItemType;
    result.advancedItemId = (item as any).advancedItemId;
  }

  return result;
}

/**
 * 从常量池中根据稀有度筛选物品
 * @param rarity 稀有度
 * @returns 符合条件的物品列表
 */
export function getItemsByRarity(rarity: ItemRarity): Array<{
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
}> {
  const allItems = getAllItemsFromConstants();
  return allItems
    .filter(item => item.rarity === rarity)
    .map(item => {
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
    });
}

/**
 * 从常量池中根据类型筛选物品
 * @param itemType 物品类型
 * @returns 符合条件的物品列表
 */
export function getItemsByType(itemType: ItemType): Array<{
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  effect?: any;
  permanentEffect?: any;
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot | string;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
  advancedItemId?: string;
}> {
  const allItems = getAllItemsFromConstants();
  return allItems.filter(item => item.type === itemType).map(item => ({
    name: item.name,
    type: item.type as ItemType,
    description: item.description,
    rarity: item.rarity,
    effect: item.effect,
    permanentEffect: item.permanentEffect,
    isEquippable: item.isEquippable,
    equipmentSlot: item.equipmentSlot,
    advancedItemType: item.advancedItemType,
    advancedItemId: item.advancedItemId,
  }));
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

