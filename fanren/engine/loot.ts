/** 正史探索掉落：產生符合地域層級／境界的真實物品，落地到背包。 */
import { realmRank } from './canonLoader';

export interface ItemGrant {
  name: string;
  type: '草药' | '丹药' | '材料' | '法宝'; // 對應既有 ItemType 字串
  rarity: '普通' | '稀有' | '传说' | '仙品';
  quantity: number;
  description: string;
}

interface LootDef {
  name: string;
  type: ItemGrant['type'];
  rarity: ItemGrant['rarity'];
  desc: string;
  minRank: number; // realmRank 下限
}

// 由低到高的掉落池（名稱取自修仙通用＋原著風味）
const POOL: LootDef[] = [
  { name: '黃精草', type: '草药', rarity: '普通', desc: '常見靈草，可入基礎丹方。', minRank: 0 },
  { name: '凝血草', type: '草药', rarity: '普通', desc: '止血療傷的尋常藥草。', minRank: 0 },
  { name: '靈晶礦', type: '材料', rarity: '普通', desc: '蘊含微弱靈氣的礦石，煉器常用。', minRank: 0 },
  { name: '聚氣丹', type: '丹药', rarity: '普通', desc: '輔助煉氣期修煉的入門丹藥。', minRank: 0 },
  { name: '百年靈乳', type: '草药', rarity: '稀有', desc: '百年方成的靈乳，藥力醇厚。', minRank: 2 },
  { name: '玄鐵', type: '材料', rarity: '稀有', desc: '煉製法器的上佳材料。', minRank: 2 },
  { name: '築基靈液', type: '丹药', rarity: '稀有', desc: '助益築基的珍貴靈液。', minRank: 3 },
  { name: '寒玉髓', type: '材料', rarity: '稀有', desc: '極寒之地所結，煉製冰屬法寶之材。', minRank: 4 },
  { name: '凝元丹', type: '丹药', rarity: '传说', desc: '結丹期修士夢寐以求的增益靈丹。', minRank: 5 },
  { name: '千年靈芝', type: '草药', rarity: '传说', desc: '千年靈芝，可遇不可求的煉丹主材。', minRank: 5 },
  { name: '噬靈金', type: '材料', rarity: '传说', desc: '能吞噬靈氣的奇金，本命法寶之材。', minRank: 7 },
  { name: '九轉還魂丹', type: '丹药', rarity: '仙品', desc: '傳說中起死回生的仙品神丹。', minRank: 9 },
];

/** 依地域層級與玩家境界、氣運擲取探索掉落（0–2 件）。在瀏覽器端，可用 Math.random。 */
export function rollExploreLoot(tier: string, playerRealm: string, luck: number): ItemGrant[] {
  const rank = realmRank(playerRealm);
  const candidates = POOL.filter((d) => d.minRank <= rank + 1); // 允許略高一階的驚喜
  if (!candidates.length) return [];
  const out: ItemGrant[] = [];
  const baseChance = 0.55 + Math.min(0.3, (luck || 0) / 200);
  if (Math.random() < baseChance) out.push(pick(candidates, rank));
  if (Math.random() < baseChance * 0.4) out.push(pick(candidates, rank));
  return out;
}

function pick(cands: LootDef[], rank: number): ItemGrant {
  // 偏向接近玩家境界、偶有高階驚喜
  const weighted = cands.map((d) => ({ d, w: 1 / (1 + Math.abs(d.minRank - rank)) + (d.rarity === '仙品' ? 0.02 : 0) }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let chosen = weighted[0].d;
  for (const x of weighted) { r -= x.w; if (r <= 0) { chosen = x.d; break; } }
  return { name: chosen.name, type: chosen.type, rarity: chosen.rarity, quantity: 1, description: chosen.desc };
}

/** 金手指催熟靈藥（小綠瓶式）→ 產出一株高階靈草。 */
export function catalyzeHerb(playerRealm: string, magnitude: number): ItemGrant {
  const rank = realmRank(playerRealm);
  const herbs = POOL.filter((d) => d.type === '草药' && d.minRank <= rank + 2);
  const best = herbs.sort((a, b) => b.minRank - a.minRank)[0] || POOL[0];
  return { name: best.name, type: '草药', rarity: best.rarity, quantity: Math.max(1, Math.round(magnitude / 2)), description: `（催熟而得）${best.desc}` };
}
