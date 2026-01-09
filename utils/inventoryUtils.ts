import { Item, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { uid } from './gameUtils';
import { inferItemTypeAndSlot, normalizeItemEffect, adjustItemStatsByRealm } from './itemUtils';
import { getItemFromConstants } from './itemConstantsUtils';

/**
 * 将物品添加到物品栏
 * 处理了类型推断、效果规范化、可叠加物品和不可叠加物品（装备）的逻辑
 *
 * @param inventory 当前物品栏
 * @param itemData 物品模板数据（原始数据）
 * @param quantity 数量（默认为1）
 * @param adjustmentContext 可选的境界调整上下文（realm, realmLevel）
 * @returns 更新后的物品栏副本
 */
export function addItemToInventory(
  inventory: Item[],
  itemData: any, // 接受原始数据，内部进行规范化
  quantity: number = 1,
  adjustmentContext?: { realm: RealmType; realmLevel: number }
): Item[] {
  const newInv = [...inventory];

  const itemName = (itemData.name || '未知物品').trim();
  const rawType = (itemData.type as ItemType) || ItemType.Material;
  const rawIsEquippable = !!itemData.isEquippable;
  const rawRarity = (itemData.rarity as ItemRarity) || '普通';

  // 1. 优先从常量池获取物品信息（如果常量池中有，直接使用，避免类型推断）
  const itemFromConstants = getItemFromConstants(itemName);
  let itemType: ItemType;
  let isEquippable: boolean;
  let equipmentSlot: EquipmentSlot | undefined;

  if (itemFromConstants) {
    // 常量池中有完整定义，优先使用常量池的数据
    itemType = itemFromConstants.type as ItemType;
    isEquippable = itemFromConstants.isEquippable || false;
    equipmentSlot = itemFromConstants.equipmentSlot as EquipmentSlot | undefined;
    // 如果传入的数据中有装备槽位，优先使用传入的（可能是动态生成的）
    if (itemData.equipmentSlot) {
      equipmentSlot = itemData.equipmentSlot as EquipmentSlot;
    }
  } else {
    // 常量池中没有，才进行类型推断
    const inferred = inferItemTypeAndSlot(
      itemName,
      rawType,
      itemData.description || '',
      rawIsEquippable
    );
    itemType = inferred.type;
    isEquippable = inferred.isEquippable;
    equipmentSlot = itemData.equipmentSlot || inferred.equipmentSlot;
  }

  // 2. 效果规范化
  const normalized = normalizeItemEffect(
    itemName,
    itemData.effect,
    itemData.permanentEffect,
    itemType,
    rawRarity
  );

  let finalEffect = normalized.effect;
  let finalPermanentEffect = normalized.permanentEffect;

  // 3. 境界调整（如果提供了上下文）
  if (adjustmentContext) {
    // 装备类物品需要将 permanentEffect 转换为 effect 才能正确调整并穿戴
    if (isEquippable && finalPermanentEffect) {
      finalEffect = finalEffect || {};
      const stats: Array<'attack' | 'defense' | 'spirit' | 'physique' | 'speed'> = ['attack', 'defense', 'spirit', 'physique', 'speed'];
      stats.forEach(key => {
        if (typeof finalPermanentEffect![key] === 'number') {
          finalEffect![key] = (finalEffect![key] || 0) + (finalPermanentEffect![key] as number);
        }
      });
      if (finalPermanentEffect.maxHp) finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
      finalPermanentEffect = undefined;
    }

    const adjusted = adjustItemStatsByRealm(
      finalEffect,
      finalPermanentEffect,
      adjustmentContext.realm,
      adjustmentContext.realmLevel,
      itemType,
      rawRarity
    );
    finalEffect = adjusted.effect;
    finalPermanentEffect = adjusted.permanentEffect;
  }

  // 4. 装备和特定类型物品不可叠加，每次都创建新实例
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
        effect: finalEffect,
        permanentEffect: finalPermanentEffect,
        isEquippable: true,
        equipmentSlot: equipmentSlot,
        recipeData: itemData.recipeData,
        reviveChances: itemData.reviveChances,
        advancedItemType: itemData.advancedItemType,
        advancedItemId: itemData.advancedItemId,
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
      effect: finalEffect,
      permanentEffect: finalPermanentEffect,
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
      effect: finalEffect,
      permanentEffect: finalPermanentEffect,
      isEquippable: false,
      recipeData: itemData.recipeData,
      advancedItemType: itemData.advancedItemType,
      advancedItemId: itemData.advancedItemId,
    } as Item);
  }

  return newInv;
}



