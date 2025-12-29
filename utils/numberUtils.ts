import { RealmType } from '../types';
import {
  MAX_ATTRIBUTE_POINTS_PER_REALM,
  MAX_SPIRITUAL_ROOT_VALUE,
  MAX_EQUIPMENT_LEVEL,
  MAX_ITEM_QUANTITY,
  MAX_BATTLE_ROUNDS,
  MAX_ITEM_SELL_PRICE
} from '../constants/index';

/**
 * 限制属性点数量不超过当前境界的上限
 * @param points 当前后备用属性点数
 * @param realm 当前境界
 * @returns 限制后的属性点数
 */
export const clampAttributePoints = (points: number, realm: RealmType): number => {
  const maxPoints = MAX_ATTRIBUTE_POINTS_PER_REALM[realm] || MAX_ATTRIBUTE_POINTS_PER_REALM[RealmType.LongevityRealm];
  return Math.min(Math.max(0, Math.floor(points)), maxPoints);
};

/**
 * 限制灵根值在合理范围内
 * @param value 灵根值
 * @returns 限制后的灵根值（0-100）
 */
export const clampSpiritualRoot = (value: number): number => {
  return Math.min(Math.max(0, Math.floor(value)), MAX_SPIRITUAL_ROOT_VALUE);
};

/**
 * 限制装备等级
 * @param level 装备等级
 * @returns 限制后的装备等级（0-20）
 */
export const clampEquipmentLevel = (level: number): number => {
  return Math.min(Math.max(0, Math.floor(level)), MAX_EQUIPMENT_LEVEL);
};

/**
 * 限制物品数量
 * @param quantity 物品数量
 * @returns 限制后的物品数量（0-9999）
 */
export const clampItemQuantity = (quantity: number): number => {
  return Math.min(Math.max(0, Math.floor(quantity)), MAX_ITEM_QUANTITY);
};

/**
 * 限制战斗回合数
 * @param rounds 当前回合数
 * @returns 是否超过上限
 */
export const isBattleRoundsExceeded = (rounds: number): boolean => {
  return rounds > MAX_BATTLE_ROUNDS;
};

/**
 * 限制物品出售价格
 * @param price 计算出的价格
 * @returns 限制后的价格（最高1000万）
 */
export const clampItemSellPrice = (price: number): number => {
  return Math.min(Math.max(0, Math.floor(price)), MAX_ITEM_SELL_PRICE);
};

/**
 * 通用数值限制函数
 * @param value 原始值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(min, value), max);
};

/**
 * 安全的数值加法（防止溢出）
 * @param a 第一个数
 * @param b 第二个数
 * @param max 最大值限制（可选）
 * @returns 加法结果
 */
export const safeAdd = (a: number, b: number, max?: number): number => {
  const result = a + b;
  if (max !== undefined) {
    return Math.min(result, max);
  }
  return result;
};

/**
 * 安全的数值乘法（防止溢出）
 * @param a 第一个数
 * @param b 第二个数
 * @param max 最大值限制（可选）
 * @returns 乘法结果
 */
export const safeMultiply = (a: number, b: number, max?: number): number => {
  const result = a * b;
  if (max !== undefined) {
    return Math.min(result, max);
  }
  return result;
};
