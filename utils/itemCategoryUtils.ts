/**
 * 物品分类工具函数
 * 与 InventoryModal 保持一致，供交易行等模块复用
 */

import { ItemType } from '../types';
import type { Item, MarketItem } from '../types';

export type ItemCategory = 'all' | 'equipment' | 'pill' | 'material' | 'herb' | 'synthesisStone' | 'recipe' | 'advancedItem';

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  all: '全部',
  equipment: '装备',
  pill: '丹药',
  material: '材料',
  herb: '草药',
  synthesisStone: '合成',
  recipe: '丹方',
  advancedItem: '进阶',
};

export const CATEGORY_LIST: { key: ItemCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'equipment', label: '装备' },
  { key: 'pill', label: '丹药' },
  { key: 'material', label: '材料' },
  { key: 'herb', label: '草药' },
  { key: 'synthesisStone', label: '合成' },
  { key: 'recipe', label: '丹方' },
  { key: 'advancedItem', label: '进阶' },
];

export function getItemCategory(item: Item | MarketItem): ItemCategory {
  const typeKey = String(item.type).toLowerCase();
  if (item.type === ItemType.Recipe || typeKey === 'recipe') return 'recipe';
  if (item.type === ItemType.AdvancedItem || typeKey === 'advanceditem' || typeKey === '进阶物品') return 'advancedItem';
  if (item.isEquippable || item.type === ItemType.Weapon || item.type === ItemType.Armor || item.type === ItemType.Artifact || item.type === ItemType.Accessory || item.type === ItemType.Ring || ['weapon', 'armor', 'artifact', 'accessory', 'ring'].includes(typeKey)) return 'equipment';
  if (item.type === ItemType.Pill || ['pill', 'elixir', 'potion'].includes(typeKey)) return 'pill';
  if (item.type === ItemType.Herb || typeKey === 'herb' || typeKey === '草药') return 'herb';
  const name = (item as any).name || '';
  if (name.includes('合成石')) return 'synthesisStone';
  if (name.includes('草') || name.includes('花') || name.includes('参') || name.includes('芝')) return 'herb';
  return 'material';
}
