import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { uid } from './gameUtils';
import { inferItemTypeAndSlot, normalizeItemEffect } from './itemUtils';

/**
 * 将物品添加到物品栏
 * 处理了类型推断、效果规范化、可叠加物品和不可叠加物品（装备）的逻辑
 *
 * @param inventory 当前物品栏
 * @param itemData 物品模板数据（原始数据）
 * @param quantity 数量（默认为1）
 * @returns 更新后的物品栏副本
 */
export function addItemToInventory(
  inventory: Item[],
  itemData: any, // 接受原始数据，内部进行规范化
  quantity: number = 1
): Item[] {
  const newInv = [...inventory];

  const itemName = (itemData.name || '未知物品').trim();
  const rawType = (itemData.type as ItemType) || ItemType.Material;
  const rawIsEquippable = !!itemData.isEquippable;
  const rawRarity = (itemData.rarity as ItemRarity) || '普通';

  // 1. 类型和槽位推断
  const inferred = inferItemTypeAndSlot(
    itemName,
    rawType,
    itemData.description || '',
    rawIsEquippable
  );

  const itemType = inferred.type;
  const isEquippable = inferred.isEquippable;
  const equipmentSlot = itemData.equipmentSlot || inferred.equipmentSlot;

  // 2. 效果规范化
  const normalized = normalizeItemEffect(
    itemName,
    itemData.effect,
    itemData.permanentEffect,
    itemType,
    rawRarity
  );

  // 装备和特定类型物品不可叠加，每次都创建新实例
  if (isEquippable) {
    for (let i = 0; i < quantity; i++) {
      newInv.push({
        id: uid(),
        name: itemName,
        type: itemType,
        description: itemData.description || '',
        quantity: 1, // 装备数量始终为1
        rarity: rawRarity,
        level: itemData.level || 0,
        effect: normalized.effect,
        permanentEffect: normalized.permanentEffect,
        isEquippable: true,
        equipmentSlot: equipmentSlot,
        recipeData: itemData.recipeData,
        reviveChances: itemData.reviveChances,
      } as Item);
    }
    return newInv;
  }

  // 非装备类物品尝试叠加
  const existingIdx = newInv.findIndex((i) => i.name === itemName);
  if (existingIdx >= 0) {
    // 叠加时保留所有属性，包括permanentEffect
    newInv[existingIdx] = {
      ...newInv[existingIdx],
      ...normalized, // 保留规范化后的effect和permanentEffect
      quantity: newInv[existingIdx].quantity + quantity,
    };
  } else {
    newInv.push({
      id: uid(),
      name: itemName,
      type: itemType,
      description: itemData.description || '',
      quantity: quantity,
      rarity: rawRarity,
      level: itemData.level || 0,
      effect: normalized.effect,
      permanentEffect: normalized.permanentEffect,
      isEquippable: false,
      recipeData: itemData.recipeData,
    } as Item);
  }

  return newInv;
}



