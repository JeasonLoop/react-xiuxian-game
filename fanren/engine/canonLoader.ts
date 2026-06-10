/** 正史資料存取層：把章號錨點的來源資料轉成以「天」為單位的執行期查詢。 */
import type {
  CanonEventSource,
  CanonNpcSource,
  NpcRuntimeState,
  RegionDef,
} from '../types';
import { CANON_NPCS } from '../data/canonNpcs';
import { CANON_EVENTS } from '../data/canonTimeline';
import { REGIONS } from '../data/regions';
import { WORLD_MAP } from '../data/worldMap';
import { chapterToDay } from './clock';

// 境界排序（含原著靈界以上境界，供 minRealm 門檻比較）
const REALM_ORDER = [
  '凡人', '炼气期', '煉氣期', '筑基期', '築基期', '金丹期', '结丹期', '結丹期',
  '元婴期', '元嬰期', '化神期', '合道期', '炼虚期', '煉虛期', '合体期', '合體期',
  '大乘期', '長生境', '长生境', '渡劫期', '真仙', '真仙境',
];
export function realmRank(realm: string | undefined): number {
  if (!realm) return 0;
  for (let i = 0; i < REALM_ORDER.length; i++) {
    if (realm.includes(REALM_ORDER[i])) return i;
  }
  return 0;
}

// ── 索引 ──
// 卷次 → 約略解鎖章號（供詳細地圖節點換算 unlockChapter）
const VOL_FIRST_CHAPTER: Record<number, number> = {
  1: 1, 2: 100, 3: 160, 4: 500, 5: 760, 6: 900, 7: 1180, 8: 1300, 9: 1500, 10: 1900, 11: 2350, 12: 2400, 13: 2440,
};
const REGION_MAP: Record<string, RegionDef> = {};
for (const r of REGIONS) REGION_MAP[r.id] = r;
// 併入詳細世界地圖（以中文名為鍵；不覆蓋既有地點）
for (const n of WORLD_MAP) {
  if (!REGION_MAP[n.name]) {
    REGION_MAP[n.name] = {
      id: n.name,
      name: n.name,
      tier: n.tier,
      parentId: n.parentId,
      description: n.description,
      unlockChapter: VOL_FIRST_CHAPTER[n.firstVolume || 1] || 1,
    };
  }
}

const NPC_MAP: Record<string, CanonNpcSource> = {};
for (const n of CANON_NPCS) {
  NPC_MAP[n.id] = n;
  NPC_MAP[n.name] = n;
}

// 事件依世界日排序
export interface ScheduledEvent extends CanonEventSource {
  scheduledDay: number;
}
export const SCHEDULED_EVENTS: ScheduledEvent[] = CANON_EVENTS.map((e) => ({
  ...e,
  scheduledDay: chapterToDay(e.chapterAnchor),
})).sort((a, b) => a.scheduledDay - b.scheduledDay);

export function getRegion(id: string): RegionDef | undefined {
  return REGION_MAP[id];
}
export function allNpcNames(): string[] {
  return CANON_NPCS.map((n) => n.name);
}
export function allLocationNames(): string[] {
  return Array.from(new Set([...REGIONS.map((r) => r.name), ...WORLD_MAP.map((n) => n.name)]));
}
export function getNpc(idOrName: string): CanonNpcSource | undefined {
  return NPC_MAP[idOrName];
}

const EVENT_MAP: Record<string, ScheduledEvent> = {};
for (const e of SCHEDULED_EVENTS) EVENT_MAP[e.id] = e;
export function getEvent(id: string): ScheduledEvent | undefined {
  return EVENT_MAP[id];
}

/** 進度章號 → 可見劇透層級預算（0 公開 → 3 終局）。 */
export function spoilerBudget(chapter: number): number {
  if (chapter >= 1900) return 3;
  if (chapter >= 1180) return 2;
  if (chapter >= 500) return 1;
  return 0;
}

export interface ResolvedNpc {
  locationId: string;
  realm: string;
  status: NpcRuntimeState['status'];
  activity: string;
  canonEventIds?: string[];
}

/** 解析某 NPC 在指定世界日的正史狀態（彈性時間窗）。 */
export function resolveNpcAtDay(npc: CanonNpcSource, day: number): ResolvedNpc {
  let chosen: ResolvedNpc | null = null;
  for (const c of npc.chronicle) {
    const from = chapterToDay(c.fromChapter);
    const to = chapterToDay(c.toChapter);
    if (day >= from && day <= to) {
      chosen = { locationId: c.locationId, realm: String(c.realm), status: c.status, activity: c.activity, canonEventIds: c.canonEventIds };
      break;
    }
    if (day < from) {
      // 尚未到此段：停在前一段或視為「未現身」
      break;
    }
    chosen = { locationId: c.locationId, realm: String(c.realm), status: c.status, activity: c.activity };
  }
  if (!chosen) {
    const first = npc.chronicle[0];
    if (first && day < chapterToDay(first.fromChapter)) {
      return { locationId: first.locationId, realm: String(first.realm), status: 'unknown', activity: '尚未現於世人眼前' };
    }
    const last = npc.chronicle[npc.chronicle.length - 1];
    if (last) return { locationId: last.locationId, realm: String(last.realm), status: last.status, activity: npc.canonFate };
  }
  return chosen || { locationId: '未知', realm: '凡人', status: 'unknown', activity: '行蹤不明' };
}

/** 建立遊戲開始時的 NPC 執行期狀態表。 */
export function buildInitialNpcStates(startDay: number): Record<string, NpcRuntimeState> {
  const out: Record<string, NpcRuntimeState> = {};
  for (const npc of CANON_NPCS) {
    const r = resolveNpcAtDay(npc, startDay);
    out[npc.id] = {
      id: npc.id,
      realm: r.realm,
      locationId: r.locationId,
      status: r.status,
      relationship: 0,
      knownToPlayer: false,
      diverged: false,
      lastSyncDay: startDay,
    };
  }
  return out;
}

/** 取得 (fromDay, toDay] 內預定發生的正史事件。 */
export function eventsInWindow(fromDay: number, toDay: number): ScheduledEvent[] {
  return SCHEDULED_EVENTS.filter((e) => e.scheduledDay > fromDay && e.scheduledDay <= toDay);
}

/** 取得目前時間點「附近」的正史事件（供世界提醒）。 */
export function eventsNear(day: number, windowDays: number): ScheduledEvent[] {
  return SCHEDULED_EVENTS.filter((e) => Math.abs(e.scheduledDay - day) <= windowDays);
}
