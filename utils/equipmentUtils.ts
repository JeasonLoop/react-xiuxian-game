/**
 * 装备相关的工具函数
 * 统一管理装备槽位查找、装备状态检查等逻辑
 */

import { Item, ItemType, EquipmentSlot, PlayerStats } from '../types';

/**
 * 获取指定装备类型的所有可用槽位
 */
export const getEquipmentSlotsByType = (itemType: ItemType): EquipmentSlot[] => {
  switch (itemType) {
    case ItemType.Ring:
      return [
        EquipmentSlot.Ring1,
        EquipmentSlot.Ring2,
        EquipmentSlot.Ring3,
        EquipmentSlot.Ring4,
      ];
    case ItemType.Accessory:
      return [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
    case ItemType.Artifact:
      return [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
    default:
      return [];
  }
};

/**
 * 查找物品可以装备到的空槽位
 * @param item 要装备的物品
 * @param equippedItems 当前已装备的物品映射
 * @returns 可用的槽位，如果没有空槽位则返回物品的默认槽位（戒指会返回Ring1）
 */
export const findEmptyEquipmentSlot = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): EquipmentSlot | null => {
  // 对于戒指、首饰、法宝，即使有equipmentSlot属性，也要优先查找空槽位
  // 忽略物品的equipmentSlot属性，因为多槽位装备应该优先使用空槽位
  const slots = getEquipmentSlotsByType(item.type);
  if (slots.length > 0) {
    // 优先查找空槽位（明确检查是否为 undefined 或 null，确保空槽位检查正确）
    // 遍历所有可能的槽位，找到第一个空的就返回
    for (const slot of slots) {
      const equippedItemId = equippedItems[slot];
      // 如果槽位为空（undefined 或不存在），直接返回这个空槽位
      if (equippedItemId === undefined || equippedItemId === null || equippedItemId === '') {
        return slot;
      }
    }
    // 只有当所有槽位都满了，才返回第一个槽位（用于替换已有装备）
    return slots[0];
  }

  // 其他装备类型（武器、护甲等）需要equipmentSlot
  if (!item.equipmentSlot) {
    return null;
  }

  // 其他装备类型直接使用默认槽位（如果已装备，则替换）
  return item.equipmentSlot;
};

/**
 * 检查物品是否已装备
 * @param item 要检查的物品
 * @param equippedItems 当前已装备的物品映射
 * @returns 是否已装备
 */
export const isItemEquipped = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): boolean => {
  // 对于戒指、首饰、法宝，即使没有equipmentSlot也可以根据type检查所有同类型槽位
  const slots = getEquipmentSlotsByType(item.type);
  if (slots.length > 0) {
    return slots.some((slot) => equippedItems[slot] === item.id);
  }

  // 其他装备类型需要equipmentSlot才能检查
  if (!item.equipmentSlot) {
    return false;
  }

  // 其他装备类型直接检查对应槽位
  return equippedItems[item.equipmentSlot] === item.id;
};

/**
 * 查找物品实际装备的槽位
 * @param item 要查找的物品
 * @param equippedItems 当前已装备的物品映射
 * @returns 实际装备的槽位，如果未装备则返回 null
 */
export const findItemEquippedSlot = (
  item: Item,
  equippedItems: Partial<Record<EquipmentSlot, string>>
): EquipmentSlot | null => {
  // 对于戒指、首饰、法宝，即使没有equipmentSlot也可以根据type查找所有同类型槽位
  const slots = getEquipmentSlotsByType(item.type);
  if (slots.length > 0) {
    const equippedSlot = slots.find((slot) => equippedItems[slot] === item.id);
    return equippedSlot || null;
  }

  // 其他装备类型需要equipmentSlot才能查找
  if (!item.equipmentSlot) {
    return null;
  }

  // 其他装备类型直接检查对应槽位
  return equippedItems[item.equipmentSlot] === item.id ? item.equipmentSlot : null;
};

/**
 * 获取装备槽位配置（用于渲染装备面板）
 */
export const getEquipmentSlotConfig = (): Array<{
  slot: EquipmentSlot;
  label: string;
  icon?: string;
}> => {
  return [
    { slot: EquipmentSlot.Head, label: '头部' },
    { slot: EquipmentSlot.Shoulder, label: '肩部' },
    { slot: EquipmentSlot.Chest, label: '胸甲' },
    { slot: EquipmentSlot.Gloves, label: '手套' },
    { slot: EquipmentSlot.Legs, label: '裤腿' },
    { slot: EquipmentSlot.Boots, label: '鞋子' },
    { slot: EquipmentSlot.Ring1, label: '戒指1' },
    { slot: EquipmentSlot.Ring2, label: '戒指2' },
    { slot: EquipmentSlot.Ring3, label: '戒指3' },
    { slot: EquipmentSlot.Ring4, label: '戒指4' },
    { slot: EquipmentSlot.Accessory1, label: '首饰1' },
    { slot: EquipmentSlot.Accessory2, label: '首饰2' },
    { slot: EquipmentSlot.Artifact1, label: '法宝1' },
    { slot: EquipmentSlot.Artifact2, label: '法宝2' },
    { slot: EquipmentSlot.Weapon, label: '武器' },
  ];
};

/**
 * 获取装备槽位的中文标签
 * @param slot 装备槽位
 * @returns 中文标签，如果找不到则返回槽位值本身
 */
export const getEquipmentSlotLabel = (slot: EquipmentSlot): string => {
  const config = getEquipmentSlotConfig();
  const slotConfig = config.find((c) => c.slot === slot);
  return slotConfig?.label || slot;
};

/**
 * 根据槽位获取对应的装备类型
 */
export const getItemTypeBySlot = (slot: EquipmentSlot): ItemType | null => {
  const ringSlots = [
    EquipmentSlot.Ring1,
    EquipmentSlot.Ring2,
    EquipmentSlot.Ring3,
    EquipmentSlot.Ring4,
  ];
  const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
  const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];

  if (ringSlots.includes(slot)) return ItemType.Ring;
  if (accessorySlots.includes(slot)) return ItemType.Accessory;
  if (artifactSlots.includes(slot)) return ItemType.Artifact;
  if (slot === EquipmentSlot.Weapon) return ItemType.Weapon;
  if (
    [
      EquipmentSlot.Head,
      EquipmentSlot.Shoulder,
      EquipmentSlot.Chest,
      EquipmentSlot.Gloves,
      EquipmentSlot.Legs,
      EquipmentSlot.Boots,
    ].includes(slot)
  ) {
    return ItemType.Armor;
  }

  return null;
};

/**
 * 检查槽位是否属于同一组（用于过滤显示）
 * 例如：Ring1、Ring2、Ring3、Ring4 属于同一组
 */
export const areSlotsInSameGroup = (slot1: EquipmentSlot, slot2: EquipmentSlot): boolean => {
  const ringSlots = [
    EquipmentSlot.Ring1,
    EquipmentSlot.Ring2,
    EquipmentSlot.Ring3,
    EquipmentSlot.Ring4,
  ];
  const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
  const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];

  // 检查是否都在戒指组
  if (ringSlots.includes(slot1) && ringSlots.includes(slot2)) return true;
  // 检查是否都在首饰组
  if (accessorySlots.includes(slot1) && accessorySlots.includes(slot2)) return true;
  // 检查是否都在法宝组
  if (artifactSlots.includes(slot1) && artifactSlots.includes(slot2)) return true;

  // 其他情况，只有完全相同才属于同一组
  return slot1 === slot2;
};

