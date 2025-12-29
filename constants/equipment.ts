/**
 * 装备模板系统
 * 从物品模板中提取所有可装备的物品
 */

import { ItemType, ItemRarity, EquipmentSlot } from '../types';
import { ITEM_TEMPLATES } from './itemTemplates';

/**
 * 装备模板接口
 */
export interface EquipmentTemplate {
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  effect?: {
    attack?: number;
    defense?: number;
    hp?: number;
    exp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    lifespan?: number;
  };
  description?: string;
}

/**
 * 装备模板列表（从物品模板中提取所有可装备的物品）
 */
export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = ITEM_TEMPLATES.filter(
  (item) => item.isEquippable && item.equipmentSlot
).map((item) => ({
  name: item.name,
  type: item.type,
  rarity: item.rarity || '普通',
  slot: item.equipmentSlot!,
  effect: item.effect,
  description: item.description,
}));
