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

/** 靈根四等（出自小說設定）：天根單屬性 / 變異特殊屬性 / 真靈根二至三屬性 / 偽靈根五行混雜。 */
export type RootTier = 'heaven' | 'variant' | 'true' | 'pseudo';

export interface SpiritualRootProfileOption {
  id: string;
  name: string; // 天靈根 / 單靈根 / 偽靈根…
  description: string;
  roots: SpiritualRoots; // 引擎用五行向量（變異屬性以最相近的本行承載，純度高＝修煉快）
  cultivationMult: number; // 修煉速度倍率（0.7 廢靈根 → 3.0 天靈根）；實際以 roots 向量推導，此為顯示參考
  probabilityWeight: number; // 隨機分配時的權重
  tier?: RootTier; // 四等分類（顯示與分組用）
  attributes?: string[]; // 屬性標籤（顯示用）：['火'] / ['雷'] / ['金','水']
  variant?: string; // 變異屬性名（雷/風/冰/冥/陽…），僅變異靈根
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

/** 開局點數自定義屬性分配（由天命等級決定可用點數）。 */
export interface AttrAllocation {
  roots: { metal: number; wood: number; water: number; fire: number; earth: number }; // 五行靈根各 0-100
  variantType?: string; // 變異靈根（異靈根）類型，如「雷」「風」「冰」「暗」「光」「空間」；空＝無
  variantValue?: number; // 變異靈根強度 0-100（異靈根較五行更純更利，進境尤速）
  comprehension: number; // 悟性 0-100
  daoHeart: number; // 心性 0-100
  attack: number; // 攻擊 0-100（=對境界基礎值的強化點）
  defense: number; // 防禦 0-100
  spirit: number; // 神識/術法 0-100
  physique: number; // 體魄 0-100
  speed: number; // 速度 0-100
}

/** 角色創建結果，注入 startNewGame。 */
export interface CharacterCreation {
  name: string;
  appearance: AppearanceOption;
  originId: string;
  spiritualRootId?: string; // 舊制靈根模板（已改為點數自由分配 allocation；保留以相容）
  fortuneId?: string; // 天命等級（決定可分配點數）
  allocation?: AttrAllocation; // 開局點數分配（五行靈根/悟性/心性/戰鬥五屬）
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
export interface InterventionReward {
  items?: { name: string; type?: string; rarity?: string; quantity: number }[];
  exp?: number;
  spiritStones?: number;
  relationship?: number; // 對涉事 NPC 好感變動
  flag?: string; // 參與旗標（供結算/後續判定）
  note?: string; // 結算敘述
}
export interface InterventionPoint {
  id: string;
  description: string; // 玩家可如何介入
  minRealm?: RealmType | string;
  reward?: InterventionReward; // 「有參與才給」：選擇此介入並達成時的收穫
}

// ── 組隊 / 分贓 ──
export interface PartyMember {
  npcId: string;
  name: string;
  joinedDay: number;
  realm?: string;
}
export interface LootShare {
  name: string;
  quantity: number;
  rarity?: string;
  type?: string;
}
export interface PartyState {
  members: PartyMember[];
  storyEventId?: string; // 劇情綁定：該事件結束則自動解散
  storyTitle?: string;
  lootPool: LootShare[]; // 隊伍共同收穫，解散時分贓
  formedDay: number;
  pendingInviteFromNpcId?: string; // 他人/系統向玩家發出、待接受的邀請
  pendingInviteName?: string;
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
  magnitude?: number; // 時間線震幅（蝴蝶效應規模）
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
  | 'flee' // 逃離/遁走（速度決定能否甩脫追兵）
  | 'use_item' // 使用背包物品
  | 'craft' // 煉丹/煉器/種植
  | 'explore' // 探索/歷練
  | 'trade' // 交易
  | 'use_golden_finger'
  | 'wait' // 等待/觀望
  | 'inspect' // 查看狀態/世界
  | 'recall' // 回憶（金手指）
  | 'party' // 組隊：邀請/接受/離隊/解散/分贓
  | 'transmit' // 神識傳音
  | 'organize' // 成立組織（船隊/商團/宗門…）
  | 'join_sect' // 拜入既有宗門（自行拜入／持信物如升仙令）
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
    | 'meta' // 元遊戲指令
    | 'ooc'; // 出戲：現代/科幻/異世界等非《凡人修仙傳》世界觀之物
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
  kind: 'world_event' | 'npc_nearby' | 'time' | 'danger' | 'opportunity' | 'sect';
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
  /** 創角身分（供角色面板顯示；不影響機制）：天命等級 id、性別、初始年齡。舊存檔為 undefined，顯示時須 null 安全。 */
  fortuneId?: string;
  gender?: 'male' | 'female' | 'unset';
  age?: number;
  creationAllocation?: AttrAllocation; // 創角投入點原值，供角色面板與實際換算值對照
  npcStates: Record<string, NpcRuntimeState>;
  worldEventStates: Record<string, WorldEventState>;
  /** 主要 NPC 結局里程碑觸發記錄（key＝NPC id）。 */
  npcFateStates?: Record<string, WorldEventState>;
  factionStates: Record<string, FactionState>;
  divergences: Divergence[];
  expandedRegions: ExpandedRegion[];
  discoveredLocationIds?: string[]; // 已探明的原著地點 id（霧中探明，隨移動擴展）
  party?: PartyState; // 當前隊伍（含劇情組隊/分贓）
  eventParticipation?: Record<string, string[]>; // 事件 id → 玩家實際做過的介入旗標（供「有參與才給」結算）
  claimedOpportunityIds?: string[]; // 已處置的「提前機緣」id（取走/破壞/參研）
  baiyi?: Record<string, BaiYiProficiency>; // 修仙百藝熟練度（artId → 熟練）
  organizations?: Organization[]; // 玩家創立的組織（船隊/商團/宗門…）
  memory: MemoryEntry[];
  governorViolations: number; // 累計越權次數（升級懲戒）
  pendingChoice?: TurnChoice | null; // 待玩家選擇的分支
  gameOver?: { dead: boolean; cause: string; day: number }; // 主角永久死亡（canon 模式無重生）
  canonRealmIndex?: number; // 忠實境界階梯索引（0 煉氣 → 9 真仙），與經典 RealmType 解耦
  canonSubStage?: number; // 子境界 0 初期 → 3 大圓滿（煉氣期以 player.realmLevel 表層數）
  techniques?: LearnedTechnique[]; // 已習具名功法（含層數/已解鎖神通）
  bottleSpace?: { herbs: { name: string; quality: number }[]; lingZhiAwakened: boolean }; // 掌天瓶內空間（藏藥/瓶靈）
  abode?: OwnedAbode; // 洞府（聚靈陣加修煉、藥園、禁制）
  garden?: GardenPlot[]; // 洞府藥園所植靈藥
  population?: WorldPopulation; // 活世界背景人口（繁衍/殞落，不影響正史）
  census?: WorldCensus; // 天下生靈・境界分層人口普查（~50萬，越高越少）
  reputation?: Reputation; // 聲望/名號（正邪兩軸，影響世界對玩家的反應）
  quests?: QuestState; // 任務/委託（懸賞榜、進行中、已完成）
  sect?: SectMembership; // 宗門身分（貢獻/階級）
  sectEvent?: SectEventState | null; // 當前宗門盛事（講道/大比/秘境）
  flags?: Record<string, boolean>; // 世界旗標（封印解除/機關開啟…），供地點劇情閘與敘事
  legacy?: LegacyState; // 收徒/道侶/傳承
}

/** 活世界背景人口（散修/小人物的自然繁衍與殞落，使世界不致空空如也）。 */
export interface WorldPopulation {
  total: number; // 背景修士人口估計
  cumulativeBirths: number;
  cumulativeDeaths: number;
  lastTickDay: number;
}

/** 天下生靈・境界分層人口普查（對齊 CANON_REALMS）。 */
export interface WorldCensus {
  byRealm: number[]; // index 0 煉氣 … 9 真仙 的在世人數
  total: number;
  lastTickDay: number;
}

/** 聲望/名號：正邪兩軸聲望值 + 當前名號。世界依此對玩家改觀。 */
export interface ReputationTitle {
  axis: string; // 正道/魔道/中立/妖
  tier: number;
  name: string;
  threshold: number;
  effect: string;
}
export interface Reputation {
  righteous: number; // 俠義聲望
  demonic: number; // 兇名/魔名
  deeds: number; // 揚名事蹟數
  titleName?: string;
}

// ── 煉製配方 ──
export interface Recipe {
  id: string;
  name: string;
  craft: string; // 丹道/器道
  realmReq: string;
  tool: string; // 所需丹爐/煉器爐
  ingredients: { name: string; qty: number }[];
  product: { name: string; rarity: string; effect: string };
  difficulty: number; // 1-5 火候難度
}

// ── 任務/委託 ──
export interface QuestReward {
  stones?: number;
  exp?: number;
  righteous?: number; // 正道聲望
  demonic?: number; // 魔道聲望
  contribution?: number; // 宗門貢獻
  itemTier?: number; // 物品掉落層級
}
export interface QuestDef {
  id: string;
  title: string;
  type: string; // 懸賞/宗門/尋寶/仇殺/護送/採集
  realmReq: string;
  region?: string;
  giver: string;
  objective: string;
  reward: string; // 敘事用獎勵描述
  hook: string; // 張貼文案
}
export interface ActiveQuest {
  defId: string;
  title: string;
  type: string;
  objective: string;
  hook: string;
  region?: string;
  reward: QuestReward; // 機制化獎勵
  rewardText: string;
  acceptedDay: number;
  progress: number;
  target: number;
  done: boolean;
}
export interface QuestState {
  boardDay: number;
  board: QuestDef[];
  active: ActiveQuest[];
  completedCount: number;
}

// ── 宗門身分/晉升 ──
export interface SectRank {
  name: string; // 外門弟子/內門弟子/核心弟子/真傳弟子/長老
  reqContribution: number;
  perk: string;
  realmReq?: string; // 晉此階所需最低境界（築基/結丹…）；貢獻足而境界未及則掌門不予晉升
}
export interface SectDef {
  id: string;
  name: string;
  category: '武林門派' | '修仙宗門' | '魔道宗門'; // 七玄門等江湖武林 vs 真正修仙勢力 vs 魔道
  alignment: string;
  joinRealmReq?: string; // 入門最低境界（武林門派可為凡人/煉氣；修仙宗門須煉氣+靈根）
  needRoot?: boolean; // 是否需靈根（修仙/魔道宗門為 true）
  ranks: SectRank[];
  missions: { name: string; contribution: number; note: string }[];
  resources: { name: string; cost: number; note: string }[];
}

/** 入門/晉升大典中的一道儀程（逐句呈現以營造儀式感）。 */
export interface SectCeremonyBeat {
  rite: string; // 儀節名：測靈根/拜師/立誓/賜禮/晉升
  text: string; // 該道儀程的敘事
  tone?: 'normal' | 'gain' | 'danger' | 'special';
}

export interface SectMembership {
  sectId: string;
  sectName: string;
  rankIndex: number;
  contribution: number; // 可兌換的貢獻點（隨兌換消減）
  joinedDay: number;
  identityToken?: string; // 身分信物（玉牌/腰牌/血令）
  rootTier?: string; // 入門測靈根結果
  masterName?: string; // 拜入時所授之師父（修仙/魔道宗門）
  oath?: string; // 入門所立門規誓
  merit?: number; // 功勳：終身累計、不隨兌換消減；用於晉升資序與榮典
  demerit?: number; // 過失：觸犯門規所記，過多遭罰乃至逐出
  titles?: string[]; // 所獲榮銜（如「內門大比魁首」「護山先登」）
  lastStipendDay?: number; // 上次領取月俸之日
  missionsDone?: number; // 累計完成宗門任務數
}

/** 宗門盛事：定期舉行的講道/大比/秘境，賦予宗門生活節律與盛典感。 */
export interface SectEventState {
  kind: 'lecture' | 'tournament' | 'secret_realm'; // 開壇講道／宗門大比／秘境開啟
  sectId: string;
  title: string;
  desc: string;
  startDay: number;
  endDay: number; // 逾期則錯過
  participated?: boolean;
}

// ── 收徒/道侶/傳承 ──
export interface Disciple {
  name: string;
  realm: string;
  talent: string; // 資質/靈根標籤
  technique?: string; // 所授功法
  joinedDay: number;
  loyalty: number; // 忠誠/羈絆 0..100
}
export interface DaoCompanion {
  name: string;
  realm: string;
  bondDay: number;
  note?: string;
}
export interface LegacyState {
  disciples: Disciple[];
  companion?: DaoCompanion;
  techniquesPassed: number;
}

/** 走火入魔/心魔事件定義。 */
export interface QiEvent {
  id: string;
  trigger: 'cultivate' | 'breakthrough' | 'devour' | 'karma';
  severity: number; // 1-5
  name: string;
  desc: string;
  effect: string; // 機制後果摘要（敘事用）
}

// ── 具名功法 / 神通 ──
export interface TechniqueNeigong {
  level: number; // 第幾層解鎖
  name: string;
  desc: string;
}
export interface TechniqueDef {
  id: string;
  name: string; // 長春功 / 青元劍訣 / 大衍訣 …
  category: string; // 對應百藝類別（sword/puppet/talisman/formation/body/agility/soul/thunder/…）
  realmReq: string; // 最低修為
  maxLevel: number; // 功法層數
  desc: string;
  canonRefs?: string[];
  neigong?: TechniqueNeigong[]; // 分層解鎖的神通
  statBonus?: Partial<Record<'attack' | 'defense' | 'spirit' | 'physique' | 'speed' | 'maxHp', number>>; // 每層加成
}
export interface LearnedTechnique {
  id: string;
  name: string;
  level: number; // 已修煉到第幾層
}

// ── 正史寶物 ──
export interface CanonItem {
  id: string;
  name: string;
  kind: string; // 丹药/法宝/材料/灵植/符箓/傀儡/奇物
  rarity: string; // 普通/精良/稀有/传说/仙品
  realmTier: string; // 炼气/筑基/金丹/元婴/化神/炼虚以上/通用
  effect: string;
  canonRef?: string;
}

// ── 程序生成詞庫（領域化詞素，供 procGen 組合生成）──
export interface BeastLineageBank {
  key: string;
  name: string;
  prefixes: string[];
  bodies: string[];
  suffixes: string[];
  dropParts: string[];
}
export interface TechDomainBank {
  key: string;
  name: string;
  category: string;
  prefixes: string[];
  cores: string[];
  suffixes: string[];
  elements?: string[];
  grades: string[];
}
export interface ItemDomainBank {
  key: string;
  name: string;
  kind: string;
  prefixes: string[];
  bodies: string[];
  suffixes?: string[];
  modifiers: string[];
}
export interface NpcBanks {
  surnames: string[];
  givenMale: string[];
  givenFemale: string[];
  titles: string[];
  sectPrefixes: string[];
  sectSuffixes: string[];
  origins: string[];
  traits: string[];
  physiques: string[];
}

// ── 具名妖獸（procGen 野外/旅途遭遇用）──
export interface NamedBeast {
  id: string;
  name: string;
  realm: string; // 妖獸境界（傳統字，如 元婴期/煉虛期）
  beastType: string; // 蛟龍/狼妖/禽類…
  region: string; // 出沒地域
  desc: string;
  drops: { name: string; rarity: string }[]; // 妖丹/材料等掉落
}

// ── 人物關係 ──
export interface NpcRelationship {
  targetName: string; // 對象（中文名）
  type: 'spouse' | 'companion' | 'master' | 'disciple' | 'rival' | 'enemy' | 'sworn' | 'kin' | 'ally';
  note: string;
}

export interface TurnChoice {
  prompt: string;
  options: Array<{ id: string; text: string; hint?: string }>;
  sourceEventId?: string;
  sourceOpportunityId?: string; // 來自「提前機緣」的抉擇
  sourceAscension?: boolean; // 飛升靈界・測試版邊界鎖（玩家確認方可飛升）
}

// ── 修仙百藝（職業/技藝）+ 組織 ──
export type BaiYiCategory =
  | 'alchemy' | 'refining' | 'talisman' | 'formation' | 'puppet' | 'plant'
  | 'beast' | 'body' | 'agility' | 'appraisal' | 'disguise' | 'soul' | 'medicine' | 'sword' | 'generic';

export interface BaiYiArt {
  id: string;
  name: string; // 丹道/器道/符道/陣道…
  category: BaiYiCategory;
  description: string;
  practiceVerbs: string[]; // 觸發此藝的關鍵詞
  canonRefs?: string[];
  generated?: boolean; // 引擎於玩家提及時即時生成
}
export interface BaiYiProficiency {
  artId: string;
  name: string;
  category: string;
  exp: number; // 熟練度經驗
  rank: number; // 0 未習 → 5 宗師
  generated?: boolean;
}
// ── 洞府 ──
export interface AbodeDef {
  id: string;
  name: string;
  locationKind: '坊市' | '城內' | '宗門' | '野外' | '秘境福地';
  desc: string;
  costStones: number; // 靈石購置價（0＝以身分換取/分配）
  rentPerYear?: number; // 坊市客棧/租屋的年租
  identityReq?: string; // 身分要求（如「宗門弟子」「結丹期以上」）
  realmReq?: string; // 適配境界
  spiritArray: number; // 聚靈陣等級 → 閉關修煉加成（0..1，表 +%）
  herbPlots: number; // 藥園靈田數
  wardLevel: number; // 禁制等級 → 藏匿/安全
}
export interface OwnedAbode {
  id: string;
  name: string;
  locationKind: string;
  spiritArray: number;
  herbPlots: number;
  wardLevel: number;
  acquiredDay: number;
  rented?: boolean;
  locationId?: string; // 洞府所在地（節點 id）——洞府不可移動，綁定於此
  locationName?: string; // 所在地中文名（顯示）
  protected?: boolean; // 是否在勢力保護範圍內（收庇護費、較安全）
}
export interface GardenPlot {
  herb: string;
  plantedDay: number;
  matureDay: number;
}

export interface Organization {
  id: string;
  name: string;
  type: string; // 船隊/商團/宗門/拍賣行/坊市/護衛團/散修聯盟…
  description: string;
  foundedDay: number;
  baseLocationId: string;
  members: number;
  influence: number; // 0..100
  assets: number; // 靈石
  generated?: boolean; // 引擎於玩家提及未定義型別時生成
}

// ── 提前機緣 + 時間線級聯（蝴蝶效應）──
export interface NpcFate {
  npcId: string;
  fate: 'dead' | 'freed' | 'altered' | 'spared'; // 死/脫離正史自由/路線偏移/倖存
  note: string;
  minMagnitude?: number; // 時間線震幅達此值才觸發（預設 0）
}
export interface CascadeEffect {
  cancelEventIds?: string[]; // 被改寫、不再依正史發生的事件
  npcFates?: NpcFate[]; // 受牽連角色的命運改變（依震幅觸發）
  factionShifts?: { name: string; status?: string; note?: string }[];
  worldNote?: string; // 天下大勢變動敘述
}
export interface OpportunityAction {
  id: string;
  label: string;
  magnitude: number; // 0..100 時間線震幅（越大，後續改寫越廣越自由）
  grantsTreasure?: boolean;
  cascade?: CascadeEffect;
  note: string; // 結算敘述
}
export interface HiddenOpportunity {
  id: string;
  name: string;
  regionId: string; // 觸發大區/地點（中文名）
  canonChapter: number; // 正史中此機緣被取得/公開的章號（之前可「提前」獲取）
  discoverHint: string;
  treasures?: { name: string; type?: string; rarity?: string; quantity: number }[];
  actions: OpportunityAction[];
  spoilerLevel?: number;
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
  access?: SectMapAccess; // 劇情閘：未開放/隱匿/需信物/需解封（見 engine/mapGate）
}

/** 地點劇情閘條件（見 engine/mapGate）。 */
export interface SectMapAccess {
  hidden?: boolean; // 平時隱匿，未得指引不顯於圖
  requiresItem?: string; // 入內須持此物（如「虛天殿圖」）
  requiresFlag?: string; // 入內須此世界旗標為真（如「虛天殿封印解除」）
  unlockChapter?: number; // 覆寫 firstVolume 推得的解鎖章
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
  relationships?: NpcRelationship[]; // 道侶/師徒/宿敵/結義 等典型關係（補關係模型）
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
  /** major＝手工策展的大事件（含介入分支）；beat＝由 game_db 逐章生成的細節節拍（無介入、純正史推演）。預設視為 major。 */
  tier?: 'major' | 'beat';
  /** 節拍專用：比 locationId 更精確的原文地點名。 */
  place?: string;
  /** 節拍專用：跨章事件的結束章。 */
  chapterEnd?: number;
  /** 節拍專用：此刻韓立境界（正規詞開頭，供推演/驗證）。 */
  hanliRealm?: string;
}

/** 主要 NPC 的結局里程碑：不介入推演時，於正確時點公告其命運（走完原著結局）。 */
export interface CanonNpcFate {
  id: string;
  name: string;
  importance: 'major' | 'protagonist';
  fateArc: string;
  fateChapter: number; // 結局約略章號
  kind: 'death' | 'ascend' | 'rebirth' | 'seal' | 'exit' | 'other';
  text: string;
  firstArc: string;
  appearances: number;
}

/**
 * 韓立試煉台帳：原著大量「生死大考」結構化。用途有三：
 *  1. 自走驗證——確認不介入時韓立依序通過每道試煉，方能抵達靈界（非一路順風）。
 *  2. 遊戲性——玩家若想分一杯羹/搶同一機緣，須面對同等試煉（minRealm 門檻＋風險）。
 *  3. 敘事——以「韓立正闖某試煉、險死還生」框定其背景行跡，凸顯修仙之難。
 */
export interface CanonTrial {
  id: string;
  title: string;
  chapterStart: number;
  chapterEnd: number;
  locationId: string;
  /** 有資格「面對」此試煉的最低境界（韓立入場時的境界）。 */
  realmGate: string;
  /** 試煉性質。 */
  kind: '突破' | '生死試煉' | '奪寶' | '逃殺' | '渡劫' | '秘境' | '大戰' | '尋訪';
  /** 致命處：此關若敗，下場為何（凸顯難度）。 */
  peril: string;
  /** 韓立在原著中如何通過（憑何物/何法/何代價）。 */
  hanliOutcome: string;
  /** 通過後所得（功法/法寶/境界/人脈）。 */
  gains: string[];
  /** 對玩家的意義（同台競爭或另闢蹊徑的鉤子）。 */
  playerHook?: string;
  /** 對應的主線事件或節拍 id（如有）。 */
  linkedEventId?: string;
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
