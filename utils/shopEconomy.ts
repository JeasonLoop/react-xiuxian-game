/**
 * 商店买卖：随境界与层数上浮标价，形成灵石消耗口；出售价略跟涨，但弱于买入，避免单纯刷卖。
 */

import type { PlayerStats } from '../types';
import { REALM_ORDER } from '../constants/realms';

export function getRealmShopPriceMultiplier(player: PlayerStats): number {
  const idx = REALM_ORDER.indexOf(player.realm);
  const ri = idx >= 0 ? idx : 0;
  const lv = Math.max(1, Math.min(9, player.realmLevel ?? 1));
  const base = 1 + ri * 0.22;
  const lvl = 1 + (lv - 1) * 0.028;
  return Math.round(base * lvl * 1000) / 1000;
}

/** 购买单价（含境界倍率） */
export function getEffectiveBuyPrice(shopItemPrice: number, player: PlayerStats): number {
  return Math.max(1, Math.ceil(shopItemPrice * getRealmShopPriceMultiplier(player)));
}

/** 相对标价的回收倍率（弱于买入，用于 UI 展示） */
export function getRealmSellPriceMultiplier(player: PlayerStats): number {
  const m = getRealmShopPriceMultiplier(player);
  return Math.round((1 + (m - 1) * 0.45) * 1000) / 1000;
}

export function getEffectiveSellPrice(
  baseSellPrice: number,
  player: PlayerStats
): number {
  return Math.max(1, Math.ceil(baseSellPrice * getRealmSellPriceMultiplier(player)));
}
