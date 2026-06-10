/**
 * 凡人編年史系統 — 共用型別契約 (shared contracts)
 * 這是 11 項新系統（金手指 / 動態回合 / 世界演化 / 數值化 / NPC 編年史 /
 * 自適應時間 / 角色創建 / 世界擴充 / 輸入治理 / 提醒回憶）的型別基礎。
 *
 * 設計原則：所有「世界層」狀態與既有 PlayerStats 分離，存於 worldStore，
 * 以便在不破壞既有放置玩法的前提下疊加正史驅動的文字冒險主流程。
 */
import type { RealmType } from '../types';

// ──────────────────────────────────────────────
// 時間系統（自適應時間流逝）
// ──────────────────────────────────────────────
/** 遊戲內絕對時間。以「日」為最小敘事單位，年/月/日方便顯示。 */
export interface GameTime {
  totalDays: number; // 自遊戲紀元起的絕對天數（單一事實來源）
  year: number; // 顯示用：第 N 年
  month: number; // 1-12
  day: number; // 1-30（簡化曆）
}

/** 行動時間尺度：不同行動消耗的天數量級差異極大（戰鬥分秒 vs 閉關數十年）。 */
export type TimeScale =
  | 'instant' // 對話、查看（0 天）
  | 'short' // 一次歷練、趕路近處（1-7 天）
  | 'medium' // 跨區趕路、煉丹（數十天）
  | 'long' // 閉關修煉（數月～數年，可被打斷）
  | 'epoch'; // 長期閉關 / 跨越歷史節點（數十～數百年）

// ──────────────────────────────────────────────
// 金手指（自定義外掛）
// ──────────────────────────────────────────────
export type GoldenFingerCategory =
  | 'cultivation' // 修煉加速型（如小綠瓶催熟靈藥）
  | 'combat' // 戰鬥強化型
  | 'knowledge' // 情報/洞察型（鑑寶、讀心、預知片段）
  | 'fortune' // 機緣/氣運型
  | 'crafting' // 煉丹/煉器/種植型
  | 'social' // 人際/聲望型
  | 'utility'; // 其他輔助

/** 解析自玩家自由文本的結構化金手指。經平衡器約束。 */
export interface GoldenFinger {
  id: string;
  name: string; // 玩家命名或系統提煉
  rawText: string; // 玩家原始描述（保留供追溯）
  category: GoldenFingerCategory;
  description: string; // 規整後的機制描述
  // 平衡三參數（業界共識：等級上限 / 每日能量 / 業力門檻）
  powerTier: 1 | 2 | 3 | 4 | 5; // 1=微弱 5=逆天（影響成本與反制）
  energyMax: number; // 能量槽上限
  energyRegenPerDay: number; // 每日回復
  energyCostPerUse: number; // 每次發動消耗
  karmaPerUse: number; // 每次使用累積的業力/天罰風險
  // 三崩壞底線之守則（必填，避免無敵）
  limits: string[]; // 明確限制（系統盲區、暴露風險、產量上限…）
  blindSpots: string[]; // 失效情境（高境界繞過、特定場合無效）
  // 機制鉤子：引擎據此施加數值效果
  effects: GoldenFingerEffect[];
}

export interface GoldenFingerEffect {
  hook:
    | 'cultivationRateMult' // 修煉效率倍率
    | 'herbMaturation' // 催熟靈藥（小綠瓶）
    | 'combatBuff'
    | 'appraise' // 鑑定/洞察
    | 'luckBonus'
    | 'craftSuccess'
    | 'custom';
  magnitude: number; // 效果強度（依 hook 解讀）
  note?: string;
}

/** 金手指的執行期狀態（存檔）。 */
export interface GoldenFingerRuntime {
  energy: number; // 當前能量
  karma: number; // 累積業力（達門檻觸發「系統異常/天道感應」事件）
  usesTotal: number;
  lastRegenDay: number; // 上次回能的絕對天數
  suppressedUntilDay?: number; // 系統異常導致的維修期（暫時失效）
  awakenLevel?: number; // 覺醒等級：隨使用次數累積，提升威能（0=未覺醒）
}

// ──────────────────────────────────────────────
// 角色創建（深度自定義）
// ──────────────────────────────────────────────
export interface OriginOption {
  id: string;
  name: string; // 如「凡人農家少年」「修仙世家庶子」
  description: string;
  startRegionId: string;
  startRealm: RealmType;
  startRealmLevel: number;
  spiritStones: number;
  spiritualRootBias: Partial<SpiritualRoots>; // 出身對五行靈根的偏向
  startingArtIds: string[]; // 起始功法
  startingItemRefs: StartingItemRef[]; // 起始法寶/丹藥
  startingSectId?: string | null;
  hooks: string[]; // 該出身可接的劇情錨點
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=輕鬆 5=凡人逆襲
}

export interface SpiritualRoots {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

export interface SpiritualRootProfileOption {
  id: string;
  name: string; // 天靈根 / 單靈根 / 偽靈根…
  description: string;
  roots: SpiritualRoots;
  cultivationMult: number; // 修煉速度倍率（0.5 廢靈根 → 3.0 天靈根）
  probabilityWeight: number; // 隨機分配時的權重
}

export interface DaoHeartOption {
  id: string;
  name: string; // 道心：殺伐 / 慈悲 / 求知 / 問道…
  description: string;
  effects: { karmaResist?: number; breakthroughBonus?: number; reputationBias?: number };
}

export interface AppearanceOption {
  gender: 'male' | 'female' | 'unset';
  age: number;
  descriptors: string[]; // 自由標籤
  freeText?: string;
}

export interface StartingItemRef {
  ref: string; // 對應 constants 物品名稱或模板 id
  quantity: number;
}

/** 角色創建結果，注入 startNewGame。 */
export interface CharacterCreation {
  name: string;
  appearance: AppearanceOption;
  originId: string;
  spiritualRootId: string;
  daoHeartId: string;
  startingArtIds: string[];
  startingItemRefs: StartingItemRef[];
  goldenFinger: GoldenFinger | null;
  abilityText?: string; // 自由文本「天生異能/特殊體質」→ 由演繹引擎推演
  difficulty: 'easy' | 'normal' | 'hard';
}

// ──────────────────────────────────────────────
// NPC 編年史 + 分歧
// ──────────────────────────────────────────────
export type NpcStatus = 'alive' | 'dead' | 'ascended' | 'sealed' | 'unknown';

/** NPC 在某時間窗的正史狀態（活世界排程的基礎）。 */
export interface NpcChronicleEntry {
  fromDay: number; // 此狀態的起始絕對天數
  toDay: number; // 結束（彈性窗：在此區間內玩家可於 locationId 找到他）
  locationId: string;
  realm: RealmType | string; // 該時期修為
  status: NpcStatus;
  activity: string; // 在做什麼（供敘事）
  canonEventIds?: string[]; // 此期間涉及的正史事件
}

export interface CanonNpc {
  id: string;
  name: string;
  aliases?: string[];
  faction?: string;
  race?: string;
  importance: 'protagonist' | 'major' | 'minor';
  bio: string; // 一段背景（受進度揭露限制）
  firstChapter: number; // 首次登場章（進度過濾）
  chronicle: NpcChronicleEntry[]; // 依時間排序的正史行程
  canonFate: string; // 正史結局（玩家未介入時）
}

/** NPC 的執行期狀態（可被玩家行動改寫，存檔）。 */
export interface NpcRuntimeState {
  id: string;
  realm: RealmType | string;
  locationId: string;
  status: NpcStatus;
  relationship: number; // -100..100 對玩家好感
  knownToPlayer: boolean;
  diverged: boolean; // 是否已脫離正史
  divergenceNote?: string;
  lastSyncDay: number; // 上次依正史推進到的天數
}

// ──────────────────────────────────────────────
// 正史時間軸 + 世界演化
// ──────────────────────────────────────────────
export interface InterventionPoint {
  id: string;
  description: string; // 玩家可如何介入
  minRealm?: RealmType | string;
}

export interface CanonEvent {
  id: string;
  title: string;
  chapterAnchor: number; // 對應原著章號（排序與進度過濾）
  scheduledDay: number; // 預定發生的絕對天數（世界紀元）
  locationId: string;
  involvedNpcIds: string[];
  summary: string;
  consequences: string[]; // 正史後果（影響 NPC/勢力狀態）
  interventions: InterventionPoint[]; // 玩家可介入點
  spoilerLevel: number; // 0 公開 → 3 終局秘辛（RAG 過濾）
}

/** 已發生事件的執行期記錄與是否被玩家改寫。 */
export interface WorldEventState {
  id: string;
  fired: boolean;
  firedDay?: number;
  diverged: boolean; // 玩家介入導致偏離正史
  outcomeNote?: string;
}

export interface Divergence {
  id: string;
  day: number;
  cause: string; // 玩家做了什麼
  affectedEventIds: string[];
  affectedNpcIds: string[];
  note: string;
}

export interface FactionState {
  id: string;
  name: string;
  power: number; // 勢力強度
  relationToPlayer: number; // -100..100
  status: 'rising' | 'stable' | 'declining' | 'destroyed';
  note?: string;
}

export interface ExpandedRegion {
  id: string;
  name: string;
  tier: 'human' | 'spirit' | 'demon' | 'immortal';
  parentRegionId?: string;
  description: string;
  generatedDay: number; // 何時由世界擴充生成
}

// ──────────────────────────────────────────────
// 回合 / 輸入治理 / 關鍵字捕獲
// ──────────────────────────────────────────────
export type IntentType =
  | 'cultivate' // 修煉/閉關
  | 'travel' // 移動
  | 'talk' // 對話/social
  | 'fight' // 戰鬥
  | 'use_item' // 使用背包物品
  | 'craft' // 煉丹/煉器/種植
  | 'explore' // 探索/歷練
  | 'trade' // 交易
  | 'use_golden_finger'
  | 'wait' // 等待/觀望
  | 'inspect' // 查看狀態/世界
  | 'recall' // 回憶（金手指）
  | 'freeform' // 其他需 GM 裁決的自由行動
  | 'invalid'; // 被輸入治理攔截

export interface ParsedIntent {
  type: IntentType;
  rawText: string;
  // 關鍵字捕獲結果
  targets: string[]; // 物品/人/地點關鍵字
  durationScale: TimeScale; // 推定耗時尺度
  durationDays?: number; // 若可量化
  confidence: number; // 0-1
  notes?: string;
}

export type GovernorDecision = 'allow' | 'reframe' | 'reject';

/** 輸入治理裁決（反機械降神）。 */
export interface GovernorVerdict {
  decision: GovernorDecision;
  reason: string;
  violationType?:
    | 'godmode' // 自封神/直接飛升
    | 'narrate_world' // 越權敘述世界事實
    | 'teleport_resource' // 憑空獲得資源
    | 'control_npc' // 直接操控他人
    | 'meta'; // 元遊戲指令
  sanctionKarma?: number; // 天道感應懲戒
  reframedAs?: string; // reframe 後的合法意圖描述
}

/** 一次回合的完整輸出。 */
export interface TurnResult {
  narrative: string; // GM 敘事文本
  intent: ParsedIntent;
  verdict: GovernorVerdict;
  daysElapsed: number;
  statDeltas?: Record<string, number>; // 套用到 PlayerStats 的數值變化
  worldEventsFired: string[]; // 本回合觸發的正史事件 id
  npcReactions: NpcReaction[]; // NPC 相對行動/反應
  reminders?: WorldReminder[]; // 隨附的世界提醒
  logType: 'normal' | 'gain' | 'danger' | 'special';
}

export interface NpcReaction {
  npcId: string;
  npcName: string;
  action: string; // 該 NPC 本回合的行動/反應
  towardPlayer: boolean;
}

// ──────────────────────────────────────────────
// 提醒 / 回憶（小遊戲金手指）
// ──────────────────────────────────────────────
export interface WorldReminder {
  kind: 'world_event' | 'npc_nearby' | 'time' | 'danger' | 'opportunity';
  text: string;
  relatedId?: string;
}

export interface MemoryEntry {
  day: number;
  summary: string;
  tags: string[]; // 用於回憶檢索：人名/地點/事件
  important: boolean;
}

// ──────────────────────────────────────────────
// 世界層總狀態（worldStore / 存檔）
// ──────────────────────────────────────────────
export interface FanrenWorldState {
  enabled: boolean; // 是否處於凡人編年史模式
  clock: GameTime;
  progressChapter: number; // 玩家「進度章號」（RAG 防劇透過濾）
  currentLocationId: string;
  goldenFinger: GoldenFinger | null;
  goldenFingerRuntime: GoldenFingerRuntime | null;
  mechanics: MechanicSpec[]; // 玩家自創/天生異能、自創功法等（演繹引擎產物）
  karma: number; // 異能/禁忌之力累積的業力池（影響天劫/心魔）
  daoHeartId: string | null;
  originId: string | null;
  npcStates: Record<string, NpcRuntimeState>;
  worldEventStates: Record<string, WorldEventState>;
  factionStates: Record<string, FactionState>;
  divergences: Divergence[];
  expandedRegions: ExpandedRegion[];
  memory: MemoryEntry[];
  governorViolations: number; // 累計越權次數（升級懲戒）
  pendingChoice?: TurnChoice | null; // 待玩家選擇的分支
}

export interface TurnChoice {
  prompt: string;
  options: Array<{ id: string; text: string; hint?: string }>;
  sourceEventId?: string;
}

// ──────────────────────────────────────────────
// 資料來源型別（以「章號」為錨點，引擎於載入時轉成 day）
// 由 data/ 下的正史資料模組匯出，agent 叢集據此產生。
// ──────────────────────────────────────────────
export interface RegionDef {
  id: string; // 用地點名稱當 id（如 "七玄門"），跨模組一致
  name: string;
  tier: 'human' | 'spirit' | 'demon' | 'immortal';
  parentId?: string;
  description: string;
  unlockChapter: number; // 進度章號 ≥ 此值才解鎖/可知
}

/** 詳細世界地圖節點（由網路爬取彙整，100+ 節點，階層式）。 */
export interface WorldMapNode {
  id: string; // 拼音 id（樹狀結構用）
  name: string; // 中文名（顯示/旅行用）
  tier: 'human' | 'spirit' | 'demon' | 'immortal';
  parentId?: string;
  description: string;
  factions?: string[];
  connections?: string[];
  firstVolume?: number;
}

export interface CanonNpcSource {
  id: string;
  name: string;
  aliases?: string[];
  faction?: string;
  race?: string;
  importance: 'protagonist' | 'major' | 'minor';
  bio: string;
  firstChapter: number;
  canonFate: string;
  chronicle: Array<{
    fromChapter: number;
    toChapter: number;
    locationId: string; // 對應 RegionDef.id（地點名）
    realm: RealmType | string;
    status: NpcStatus;
    activity: string;
    canonEventIds?: string[];
  }>;
}

export interface CanonEventSource {
  id: string;
  title: string;
  chapterAnchor: number;
  locationId: string;
  involvedNpcIds: string[];
  summary: string;
  consequences: string[];
  interventions: InterventionPoint[];
  spoilerLevel: number;
}

// ──────────────────────────────────────────────
// 演繹引擎：MechanicSpec（玩家自由文本→可執行機制）
// ──────────────────────────────────────────────
export type MechStatKey = 'attack' | 'defense' | 'spirit' | 'physique' | 'speed' | 'maxHp';
export type MechEffectType =
  | 'permanent_gain' | 'cultivation_mult' | 'exp' | 'resource' | 'luck' | 'heal' | 'craft_bonus' | 'lifespan' | 'karma' | 'narrative';
export type MechTriggerOn =
  | 'devour' | 'kill' | 'cultivate' | 'explore' | 'craft' | 'breakthrough' | 'inspect' | 'activate' | 'passive' | 'turn';

export interface MechEffect {
  type: MechEffectType;
  stat?: MechStatKey;
  amount: number;
  capPerDay?: number;
  capTotal?: number;
  diminish?: number;
  note?: string;
}
export interface MechTriggerRule {
  on: MechTriggerOn;
  effects: MechEffect[];
}
export interface MechanicSpec {
  id: string;
  name: string;
  kind: 'ability' | 'art' | 'recipe' | 'finger';
  rawText: string;
  summary: string;
  category: string;
  powerTier: number;
  flavorVerbs: string[];
  triggers: MechTriggerRule[];
  limits: string[];
  risks: string[];
  source?: 'offline' | 'llm';
  // 執行期
  usesTotal: number;
  gainedByEffect: Record<string, number>;
  dailyByEffect: Record<string, number>;
  lastDay: number;
}

