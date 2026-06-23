/**
 * 交易行 API 服务
 * 调用后端市场接口（同时支持 Express 和 Worker）
 */

import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';
import type { MarketItem } from '../types';

/** 获取认证头 */
function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export interface MarketItemsResponse {
  items: MarketItem[];
  total: number;
  page: number;
  limit: number;
}

/** GET /api/market/items — 分页获取在售商品 */
export async function fetchMarketItems(
  page = 1,
  limit = 20,
  category?: string,
  search?: string
): Promise<MarketItemsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category && category !== 'all') params.set('category', category);
  if (search?.trim()) params.set('search', search.trim());

  const res = await fetch(`${API_URL}/market/items?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('获取商品列表失败');
  return res.json();
}

/** POST /api/market/list — 上架物品 */
export async function listItem(data: {
  itemName: string;
  itemType: string;
  description: string;
  rarity: string;
  price: number;
  quantity: number;
  effect?: Record<string, number>;
  isEquippable?: boolean;
  equipmentSlot?: string;
  itemSourceJson: string;
}): Promise<{ success: boolean; listingId?: number; error?: string }> {
  const res = await fetch(`${API_URL}/market/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '上架失败' }));
    return { success: false, error: err.error || '上架失败' };
  }
  return res.json();
}

/** POST /api/market/purchase — 查库存 */
export async function checkPurchase(
  listingId: string
): Promise<{ success: boolean; listing?: any; error?: string }> {
  const res = await fetch(`${API_URL}/market/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '购买失败' }));
    return { success: false, error: err.error || '购买失败' };
  }
  return res.json();
}

/** POST /api/market/purchase/confirm — 确认购买 */
export async function confirmPurchase(
  listingId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_URL}/market/purchase/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '确认购买失败' }));
    return { success: false, error: err.error || '确认购买失败' };
  }
  return res.json();
}

/** POST /api/market/cancel — 下架物品 */
export async function cancelListing(
  listingId: string
): Promise<{ success: boolean; item?: any; error?: string }> {
  const res = await fetch(`${API_URL}/market/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '下架失败' }));
    return { success: false, error: err.error || '下架失败' };
  }
  return res.json();
}
