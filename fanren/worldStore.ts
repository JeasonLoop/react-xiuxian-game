/** 凡人編年史 世界層狀態（Zustand）。與既有 gameStore 協作：世界/時間/NPC/金手指在此，玩家數值仍在 gameStore。 */
import { create } from 'zustand';
import { RealmType } from '../types';
import type { CharacterCreation, FanrenWorldState, TurnResult } from './types';
import { dayToGameTime } from './engine/clock';
import { initCensus, tickCensus } from './engine/census';
import { initPopulation, tickDemographics } from './engine/demographics';
import { initReputation, applyDeed } from './engine/reputation';
import { getSect, canJoinSect, gainMerit, effectiveRank } from './engine/sect';
import { buildCeremony } from './engine/induction';
import {
  pickMentor, oathOf, accrueStipend, runMission, buildPromotionCeremony,
  departureOutcome, maybeRollSectEvent, resolveSectEvent,
  isAtSectHome, sectHomeName,
} from './engine/sectRitual';
import { buildInitialNpcStates, getEvent, getNpc, realmRank, getRegion } from './engine/canonLoader';
import { runTurn } from './engine/turnEngine';
import { markDivergence } from './engine/worldEvolution';
import { makeMemory } from './engine/reminderRecall';
import { initialDiscoveries } from './engine/mapDiscovery';
import { settleLoot } from './engine/party';
import { applyCascade, getOpportunity } from './engine/cascade';
import { nextBreakthrough, realmMaxExp, realmLifespan } from './engine/realm';
import { CANON_REALMS, realmIndexFromType } from './data/realms';
import { getAbode } from './data/abodes';
import { canAcquireAbode, gardenMatureDays, canEstablishAbodeHere } from './engine/abode';
import { findMapNode } from './engine/mapIntel';
import type { OwnedAbode, SectMembership, SectDef } from './types';
import { createGoldenFingerRuntime } from './engine/goldenFinger';
import { applyTrigger, passiveStatBonus } from './engine/mechanics';
import { extrapolateMechanic, extrapolateMechanicSync } from './engine/extrapolate';
import { CANON_FACTIONS } from './data/factions';
import { ORIGINS, SPIRITUAL_ROOT_PROFILES, DAO_HEARTS } from './data/creationOptions';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';

/** NPC 境界字串 → 遊戲 RealmType（供戰鬥敵人生成）。 */
export function toRealmType(realm: string | undefined, fallback: RealmType): RealmType {
  const r = realm || '';
  if (/炼气|煉氣/.test(r)) return RealmType.QiRefining;
  if (/筑基|築基/.test(r)) return RealmType.Foundation;
  if (/金丹|結丹|结丹/.test(r)) return RealmType.GoldenCore;
  if (/元婴|元嬰/.test(r)) return RealmType.NascentSoul;
  if (/化神/.test(r)) return RealmType.SpiritSevering;
  if (/合体|合體|合道|煉虛|炼虚/.test(r)) return RealmType.DaoCombining;
  if (/大乘|長生|长生|渡劫|真仙/.test(r)) return RealmType.LongevityRealm;
  return fallback;
}

const WORLD_KEY = 'fanren_world_v1';

function emptyWorld(): FanrenWorldState {
  return {
    enabled: false,
    clock: dayToGameTime(0),
    progressChapter: 1,
    currentLocationId: '七玄門',
    goldenFinger: null,
    goldenFingerRuntime: null,
    mechanics: [],
    karma: 0,
    daoHeartId: null,
    originId: null,
    npcStates: {},
    worldEventStates: {},
    npcFateStates: {},
    factionStates: {},
    divergences: [],
    expandedRegions: [],
    memory: [],
    governorViolations: 0,
    pendingChoice: null,
    census: initCensus(0),
    population: initPopulation(0),
    reputation: initReputation(),
  };
}

function loadWorld(): FanrenWorldState {
  try {
    const raw = localStorage.getItem(WORLD_KEY);
    if (raw) return migrateWorld({ ...emptyWorld(), ...JSON.parse(raw) });
  } catch {}
  return emptyWorld();
}

/** 存檔遷移：仙凡有別——清除舊版誤入的武林門派師門（七玄門等），修仙者本不投江湖武門。 */
function migrateWorld(w: FanrenWorldState): FanrenWorldState {
  if (w.sect) {
    const s = getSect(w.sect.sectId);
    if (s && s.category === '武林門派') {
      return { ...w, sect: undefined };
    }
  }
  return w;
}

function persistWorld(w: FanrenWorldState) {
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(w));
  } catch {}
}

/** 由玩家五行靈根（含變異靈根）推導修煉倍率（0.6 廢靈根 ~ 3.2 純異靈根/天靈根）。 */
export function cultivationMultFromRoots(
  roots: { metal: number; wood: number; water: number; fire: number; earth: number },
  variantValue = 0
): number {
  // 變異靈根較五行更純更利：以 ×1.1 計入純度與峰值。
  const vals = [roots.metal, roots.wood, roots.water, roots.fire, roots.earth, variantValue * 1.1];
  const max = Math.max(...vals);
  const nonZero = vals.filter((v) => v > 5).length;
  // 靈根數越少越純 → 倍率越高；最高屬性越高 → 倍率越高
  const purity = nonZero <= 1 ? 1.0 : nonZero === 2 ? 0.7 : nonZero === 3 ? 0.5 : 0.35;
  const variantBonus = variantValue > 50 && nonZero <= 1 ? 0.2 : 0; // 純粹異靈根，進境尤速
  return Math.max(0.6, Math.min(3.2, 0.6 + (max / 100) * 1.8 * purity + (nonZero <= 1 ? 0.6 : 0) + variantBonus));
}

/** 套用屬性增量到玩家（含 maxHp 連動）。 */
function applyStatDeltas(p: any, d: Record<string, number>): any {
  const maxHp = Math.max(1, (p.maxHp || 0) + (d.maxHp || 0));
  return {
    ...p,
    maxHp,
    hp: Math.min(p.hp, maxHp),
    attack: (p.attack || 0) + (d.attack || 0),
    defense: (p.defense || 0) + (d.defense || 0),
    spirit: (p.spirit || 0) + (d.spirit || 0),
    physique: (p.physique || 0) + (d.physique || 0),
    speed: (p.speed || 0) + (d.speed || 0),
  };
}

/** 推進世界時間 N 日，並讓背景人口/普查照常流轉（宗門辦差、領俸、盛事歷練皆耗時日）。 */
function tickDays(world: FanrenWorldState, days: number): Partial<FanrenWorldState> {
  const d = Math.max(0, Math.round(days));
  const newDay = world.clock.totalDays + d;
  const patch: Partial<FanrenWorldState> = { clock: dayToGameTime(newDay) };
  if (d <= 0) return patch;
  try {
    const region = getRegion(world.currentLocationId);
    const demo = tickDemographics({ ...world, clock: dayToGameTime(newDay) }, newDay, region?.name || '此地');
    patch.population = demo.population;
    const cen = tickCensus(world.census, newDay);
    patch.census = cen.census;
  } catch {}
  return patch;
}

/** 老存檔遷移：功勳缺省時，補足以保住現階（功勳乃資歷，與可花用貢獻分流）。 */
function normSect(m: SectMembership, sect: SectDef): SectMembership {
  if (m.merit != null) return m;
  const merit = Math.max(m.contribution || 0, sect.ranks[m.rankIndex]?.reqContribution || 0);
  return { ...m, merit };
}

/** 引薦信物所附之入門厚禮（劇情/AI 結合：敘事「持升仙令拜入黃楓谷得築基丹」真實落地）。 */
const SECT_TOKEN_BUNDLE: Record<string, { name: string; type: string; rarity: string; description: string; quantity: number }[]> = {
  升仙令: [{ name: '築基丹', type: '丹药', rarity: '稀有', description: '升仙令所附贈的築基聖藥——黃楓谷升仙大會錄取者之厚禮，築基修為圓滿時服之，可大增衝擊瓶頸的把握。', quantity: 1 }],
  引薦帖: [{ name: '聚靈丹', type: '丹药', rarity: '普通', description: '引薦入門所附的尋常輔修丹藥。', quantity: 3 }],
};

/** 宗門事務本門閘：不在本門則阻擋並提示前往山門。回傳是否放行。 */
function requireAtSect(world: FanrenWorldState, sect: SectDef, gameStore: { addLog: (t: string, k?: any) => void }): boolean {
  if (isAtSectHome(world.currentLocationId, sect)) return true;
  const home = sectHomeName(sect);
  const here = getRegion(world.currentLocationId)?.name || world.currentLocationId;
  gameStore.addLog(
    `【宗門事務須親至本門】你此刻身在「${here}」。拜師、辦差、領俸、晉升、赴會聽訓——宗門諸事皆須回到${home ? `「${home}」` : '本門'}當面操辦，豈有隔空遙領之理？${home ? `（可於下方輸入「前往${home}」，或開地圖前往。）` : ''}`,
    'danger'
  );
  return false;
}

interface WorldStoreState {
  world: FanrenWorldState;
  busy: boolean;
  lastResult: TurnResult | null;
  pendingBattle: { context: string; divergenceEventId?: string } | null;
  setWorld: (w: FanrenWorldState | ((p: FanrenWorldState) => FanrenWorldState)) => void;
  initCanonWorld: (creation: CharacterCreation) => void;
  submitAction: (rawText: string) => Promise<void>;
  resolveChoice: (optionId: string) => void;
  applyBattleResult: (result: { victory: boolean; hpLoss: number; expChange: number; spiritChange: number; spiritStones?: number }) => void;
  createMechanic: (rawText: string, kind: 'ability' | 'art' | 'recipe') => Promise<void>;
  onKill: () => void; // 戰鬥擊殺後觸發 on:'kill' 機制（吞噬/吸取等）
  die: (cause: string) => void; // 主角永久死亡，遊戲結束（canon 模式無重生）
  reloadFromStorage: () => void; // 由存檔還原世界狀態（切槽/匯入後同步）
  attemptBreakthrough: () => void; // 突破/渡劫：修為圓滿時衝擊瓶頸
  completeSpiritualRoot: () => void; // 祕法補全所缺靈根（韓立缺金之姿可後天補金）；須持補根祕法
  applyTrade: (p: { stoneDelta?: number; removeName?: string; removeQty?: number; addItem?: { name: string; type?: string; rarity?: string; description?: string; quantity: number }; log?: string; logType?: 'normal' | 'gain' | 'danger' | 'special' }) => void;
  acquireAbode: (abodeId: string) => void; // 取得洞府（靈石/身分）
  plantHerb: (herbName: string) => void; // 洞府藥園栽種
  harvestGarden: () => void; // 收成藥園
  joinSect: (sectId: string, opts?: { viaItem?: string }) => void; // 入門大典（分類閘＋測靈根＋拜師＋立誓＋賜物）；viaItem＝持升仙令等引薦信物受招

  doSectMission: (missionIndex: number) => void; // 宗門辦差：耗時日、立功勳、偶有橫財或兇險
  redeemSectResource: (resIndex: number) => void; // 以貢獻兌換宗門資源
  claimSectStipend: () => void; // 支領積欠月俸（依階例俸＋丹藥例給）
  attemptSectPromotion: () => void; // 請受晉升大典（功勳與境界雙足方擢升）
  participateSectEvent: () => void; // 赴宗門盛事（講道／大比／秘境）
  leaveSect: () => void; // 離宗：正道自請出門；魔道叛教遭追殺
  _sectPromotionCeremony: (sect: SectDef, newRankIndex: number) => void; // 內部：擢升儀軌（賜物／榮銜）
  reset: () => void;
}

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  world: loadWorld(),
  busy: false,
  lastResult: null,
  pendingBattle: null,

  setWorld: (wOrFn) =>
    set((s) => {
      const next = typeof wOrFn === 'function' ? (wOrFn as (p: FanrenWorldState) => FanrenWorldState)(s.world) : wOrFn;
      persistWorld(next);
      return { world: next };
    }),

  initCanonWorld: (creation) => {
    const origin = ORIGINS.find((o) => o.id === creation.originId) || ORIGINS[0];
    const startDay = 0;
    // 演繹：天生異能/特殊體質
    const mechanics: any[] = [];
    if (creation.abilityText && creation.abilityText.trim()) {
      mechanics.push(extrapolateMechanicSync(creation.abilityText, 'ability', 'born'));
    }
    const w: FanrenWorldState = {
      ...emptyWorld(),
      enabled: true,
      clock: dayToGameTime(startDay),
      progressChapter: 1,
      currentLocationId: origin?.startRegionId || '七玄門',
      goldenFinger: creation.goldenFinger,
      goldenFingerRuntime: creation.goldenFinger ? createGoldenFingerRuntime(creation.goldenFinger, startDay) : null,
      mechanics,
      karma: 0,
      daoHeartId: creation.daoHeartId,
      originId: creation.originId,
      fortuneId: creation.fortuneId,
      gender: creation.appearance?.gender,
      age: creation.appearance?.age,
      creationAllocation: creation.allocation
        ? { ...creation.allocation, roots: { ...creation.allocation.roots } }
        : undefined,
      npcStates: buildInitialNpcStates(startDay),
      factionStates: Object.fromEntries(CANON_FACTIONS.map((f) => [f.id, { ...f }])),
      discoveredLocationIds: initialDiscoveries(origin?.startRegionId || '七玄門'),
      canonRealmIndex: realmIndexFromType(String(origin?.startRealm || '炼气期')),
      canonSubStage: 0,
      memory: [],
    };
    persistWorld(w);
    set({ world: w, lastResult: null });
    // 套用天生異能的永久被動到角色
    const passive = mechanics.reduce((acc, m) => {
      const b = passiveStatBonus(m);
      for (const k of Object.keys(b)) acc[k] = (acc[k] || 0) + (b as any)[k];
      return acc;
    }, {} as Record<string, number>);
    if (mechanics.length) {
      const gs = useGameStore.getState();
      if (Object.keys(passive).length) gs.setPlayer((prev) => (prev ? applyStatDeltas(prev, passive) : prev));
      gs.addLog(`你身具異能「${mechanics[0].name}」：${mechanics[0].summary}`, 'special');
    }
  },

  submitAction: async (rawText) => {
    if (get().busy) return;
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled) return;
    // 祕法補全靈根（韓立缺金之姿可後天補全）→ 走補根流程
    if (/補全靈根|補全五行|補.{0,2}靈根|補根|重塑靈根|祕法補.{0,2}|秘法补.{0,2}|补全灵根|补全五行|重塑灵根/.test(rawText)) {
      get().completeSpiritualRoot();
      return;
    }
    // 突破/渡劫關鍵詞 → 走專屬渡劫流程（修為圓滿才成）
    if (/突破|渡劫|沖關|衝關|沖关|衝關|晉階|晋阶|衝擊瓶頸|冲击瓶颈|破境|結丹|结丹|凝嬰|凝婴|築基|筑基|飛升|飛昇|飞升|羽化登仙/.test(rawText)) {
      get().attemptBreakthrough();
      return;
    }
    set({ busy: true });
    try {
      const cultivationMult = cultivationMultFromRoots(player.spiritualRoots, player.variantRoot?.value || 0);
      const outcome = await runTurn(rawText, {
        world,
        player: {
          name: player.name,
          realm: `${player.realm}${player.realmLevel}層`,
          realmType: player.realm,
          exp: player.exp,
          maxExp: player.maxExp,
          hp: player.hp,
          maxHp: player.maxHp,
          spiritStones: player.spiritStones,
          lifespan: player.lifespan,
          luck: player.luck,
          cultivationMult,
          comprehension: player.comprehension,
          daoHeart: player.daoHeart,
          agility: player.agility,
          spirit: player.spirit,
          attack: player.attack,
          defense: player.defense,
          physique: player.physique,
          speed: player.speed,
          inventoryNames: player.inventory.map((i) => i.name),
        },
      });

      // 套用世界層
      const newMemory = outcome.newMemory ? [...world.memory, outcome.newMemory] : world.memory;
      const nextWorld: FanrenWorldState = { ...world, ...outcome.worldPatch, memory: newMemory };
      persistWorld(nextWorld);
      set({ world: nextWorld, lastResult: outcome.result });

      // 套用玩家數值層（透過 gameStore）—— 含演繹引擎產生的永久屬性增益
      const d = outcome.playerDeltas;
      const anyDelta = d.exp || d.hp || d.spiritStones || d.lifespan || d.attack || d.defense || d.spirit || d.physique || d.speed || d.maxHp || d.luck;
      if (anyDelta) {
        gameStore.setPlayer((prev) => {
          if (!prev) return prev;
          const maxHp = Math.max(1, prev.maxHp + (d.maxHp || 0));
          const exp = Math.max(0, Math.min(prev.maxExp, prev.exp + (d.exp || 0)));
          const hp = Math.max(0, Math.min(maxHp, prev.hp + (d.hp || 0)));
          const spiritStones = Math.max(0, prev.spiritStones + (d.spiritStones || 0));
          const lifespan = Math.max(0, prev.lifespan + (d.lifespan || 0));
          const gameDays = (prev.gameDays || 0) + outcome.result.daysElapsed;
          return {
            ...prev, exp, hp, maxHp, spiritStones, lifespan, gameDays,
            attack: prev.attack + (d.attack || 0),
            defense: prev.defense + (d.defense || 0),
            spirit: prev.spirit + (d.spirit || 0),
            physique: prev.physique + (d.physique || 0),
            speed: prev.speed + (d.speed || 0),
            luck: prev.luck + (d.luck || 0),
          };
        });
      }
      // 物品落地：有隊伍（非解散回合）→ 入隊伍公帳待分贓；否則入背包
      if (outcome.itemsGranted && outcome.itemsGranted.length && nextWorld.party) {
        const grants = outcome.itemsGranted;
        const pooled: FanrenWorldState = {
          ...nextWorld,
          party: { ...nextWorld.party, lootPool: [...nextWorld.party.lootPool, ...grants.map((g) => ({ name: g.name, quantity: g.quantity, rarity: g.rarity, type: g.type }))] },
        };
        persistWorld(pooled);
        set({ world: pooled });
        gameStore.addLog(`【入隊伍公帳】${grants.map((g) => `${g.name}×${g.quantity}`).join('、')}（待解散時分贓）`, 'gain');
      } else if (outcome.itemsGranted && outcome.itemsGranted.length) {
        const grants = outcome.itemsGranted;
        gameStore.setPlayer((prev) => {
          if (!prev) return prev;
          const inv = prev.inventory.map((it) => ({ ...it }));
          for (const g of grants) {
            const ex = inv.find((it) => it.name === g.name && String(it.type) === g.type);
            if (ex) ex.quantity += g.quantity;
            else inv.push({ id: `canon-${g.name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: g.name, type: g.type as any, description: g.description, quantity: g.quantity, rarity: g.rarity as any } as any);
          }
          return { ...prev, inventory: inv };
        });
        gameStore.addLog(`【獲得】${grants.map((g) => `${g.name}×${g.quantity}（${g.rarity}）`).join('、')}`, 'gain');
      }

      // 敘事入日誌
      gameStore.addLog(outcome.result.narrative, outcome.result.logType);

      // 劇情/AI 結合：敘事中拜入宗門 → 真實落地為師門（入門大典＋賜物；持令者另獲令附之物）
      if (outcome.sectJoin) {
        get().joinSect(outcome.sectJoin.sectId, { viaItem: outcome.sectJoin.viaItem });
      }

      // 壽元/氣血歸零 → 主角永久死亡（遊戲結束）
      const afterPlayer = useGameStore.getState().player;
      if (afterPlayer && (afterPlayer.lifespan <= 0 || afterPlayer.hp <= 0)) {
        get().die(afterPlayer.lifespan <= 0 ? '壽元耗盡，油盡燈枯，於閉關中無疾而終' : '舊傷迸發、氣血枯竭而亡');
      }

      // 觸發回合制戰鬥（接既有 TurnBasedBattleModal）
      if (outcome.battle) {
        set({ pendingBattle: { context: outcome.battle.context, divergenceEventId: outcome.battle.divergenceEventId } });
        useUIStore.getState().openTurnBasedBattle({
          adventureType: 'normal',
          riskLevel: outcome.battle.riskLevel,
          realmMinRealm: toRealmType(outcome.battle.realmMinRealm, player.realm),
        });
      }
    } finally {
      set({ busy: false });
    }
  },

  // 解決正史事件介入抉擇
  resolveChoice: (optionId) => {
    const world = get().world;
    const pc = world.pendingChoice;
    if (!pc) return;
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const day = world.clock.totalDays;

    // ── 飛升靈界・測試版邊界鎖：玩家親手開鎖則飛升，否則暫留人界 ──
    if (pc.sourceAscension) {
      const cleared: FanrenWorldState = { ...world, pendingChoice: null };
      if (optionId === 'ascend') {
        cleared.flags = { ...(world.flags || {}), '飛升靈界_確認': true };
        persistWorld(cleared);
        set({ world: cleared });
        gameStore.addLog('你心意已決，催動一身護命法寶、闖入那漆黑的空間節點——空間風暴接踵撕扯、隔界之力壓得元嬰幾欲潰散……（此後為測試版未保證之天地，且行且珍重。）', 'special');
        get().attemptBreakthrough(); // 節點已闖，再衝關即真正偷渡飛升
      } else {
        persistWorld(cleared);
        set({ world: cleared });
        gameStore.addLog('你斂去飛升之念，暫且留在人界——化神大圓滿之境，從容打磨，靜待時機。', 'normal');
      }
      return;
    }

    // 提前機緣 → 時間線級聯（蝴蝶效應）
    if (pc.sourceOpportunityId) {
      const opp = getOpportunity(pc.sourceOpportunityId);
      if (!opp) { const cleared = { ...world, pendingChoice: null }; persistWorld(cleared); set({ world: cleared }); return; }
      const action = opp.actions.find((a) => a.id === optionId) || opp.actions[0];
      const res = applyCascade(world, opp, action, day);
      const patch: Partial<FanrenWorldState> = {
        ...res.patch,
        pendingChoice: null,
        memory: [...world.memory, makeMemory(day, `提前機緣：${opp.name}（${action.label}）`, ['機緣', '分歧', `震幅${res.magnitude}`], true)],
      };
      // 寶物：唯有選擇「取得類」行動（＝真的做了）才給；有隊伍則入公帳待分贓
      if (res.treasures.length && player) {
        if (world.party) {
          patch.party = { ...(patch.party || world.party), lootPool: [...(patch.party || world.party).lootPool, ...res.treasures.map((t) => ({ name: t.name, quantity: t.quantity, rarity: t.rarity, type: t.type }))] };
          gameStore.addLog(`【入隊伍公帳】${res.treasures.map((t) => `${t.name}×${t.quantity}`).join('、')}（待分贓）`, 'gain');
        } else {
          gameStore.setPlayer((prev) => {
            if (!prev) return prev;
            const inv = prev.inventory.map((i) => ({ ...i }));
            for (const t of res.treasures) {
              const exi = inv.find((x) => x.name === t.name);
              if (exi) exi.quantity += t.quantity;
              else inv.push({ id: `opp-${t.name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: t.name, type: (t.type || '材料') as any, description: `提前機緣「${opp.name}」所得`, quantity: t.quantity, rarity: (t.rarity || '普通') as any } as any);
            }
            return { ...prev, inventory: inv };
          });
          gameStore.addLog(`【機緣所得】${res.treasures.map((t) => `${t.name}×${t.quantity}`).join('、')}`, 'gain');
        }
      }
      gameStore.addLog(`【提前機緣・${opp.name}】\n${res.summary}`, res.magnitude >= 30 ? 'danger' : 'special');
      const nw = { ...world, ...patch };
      persistWorld(nw);
      set({ world: nw });
      return;
    }

    const ev = pc.sourceEventId ? getEvent(pc.sourceEventId) : undefined;
    if (!ev) {
      const nw = { ...world, pendingChoice: null };
      persistWorld(nw); set({ world: nw });
      return;
    }
    let patch: Partial<FanrenWorldState> = { pendingChoice: null };

    if (optionId === '__observe__') {
      patch.worldEventStates = { ...world.worldEventStates, [ev.id]: { id: ev.id, fired: true, firedDay: day, diverged: false } };
      patch.memory = [...world.memory, makeMemory(day, `旁觀正史：${ev.title}`, ['正史', ...(ev.involvedNpcIds || [])], true)];
      gameStore.addLog(`你選擇旁觀，未加干涉。${ev.title}依正史軌跡發生：${ev.summary}\n（後續：${ev.consequences.join('；')}）`, 'special');
    } else {
      const iv = (ev.interventions || []).find((i) => i.id === optionId);
      // 修為門檻：UI 顯示的 minRealm 現在真正生效——不足則無法介入（保留抉擇）
      if (iv?.minRealm && player && realmRank(player.realm) < realmRank(String(iv.minRealm))) {
        gameStore.addLog(`「${iv.description}」需「${iv.minRealm}」以上修為方能施為——你當前境界尚不足，未能介入。`, 'danger');
        return;
      }
      const npcIds = (ev.involvedNpcIds || []).map((n) => getNpc(n)?.id).filter((x): x is string => !!x);
      const dv = markDivergence(world, `介入「${ev.title}」：${iv?.description || ''}`, [ev.id], npcIds, day);
      patch.worldEventStates = dv.worldEventStates;
      patch.npcStates = dv.npcStates;
      patch.divergences = [...world.divergences, { id: `dv-${ev.id}-${day}`, day, cause: iv?.description || '介入', affectedEventIds: [ev.id], affectedNpcIds: npcIds, note: dv.note }];
      patch.memory = [...world.memory, makeMemory(day, `介入正史：${ev.title}`, ['分歧', ev.id, ...(ev.involvedNpcIds || [])], true)];
      gameStore.addLog(`你決意介入「${ev.title}」——${iv?.description || ''}。\n${dv.note}`, 'danger');

      // 參與旗標（供「有參與才給」結算）
      const part = { ...(world.eventParticipation || {}) };
      part[ev.id] = Array.from(new Set([...(part[ev.id] || []), iv?.id || optionId]));
      patch.eventParticipation = part;

      // 介入獎勵：唯有選擇（＝實際做了）此介入才給；旁觀或未參與者一無所獲
      if (iv?.reward && player) {
        const r = iv.reward;
        if (r.exp || r.spiritStones) {
          gameStore.setPlayer((prev) => (prev ? { ...prev, exp: Math.min(prev.maxExp, prev.exp + (r.exp || 0)), spiritStones: Math.max(0, prev.spiritStones + (r.spiritStones || 0)) } : prev));
        }
        if (r.items && r.items.length) {
          if (world.party) {
            patch.party = { ...(patch.party || world.party), lootPool: [...(patch.party || world.party).lootPool, ...r.items.map((it) => ({ name: it.name, quantity: it.quantity, rarity: it.rarity, type: it.type }))] };
            gameStore.addLog(`【入隊伍公帳】${r.items.map((it) => `${it.name}×${it.quantity}`).join('、')}（待分贓）`, 'gain');
          } else {
            gameStore.setPlayer((prev) => {
              if (!prev) return prev;
              const inv = prev.inventory.map((i) => ({ ...i }));
              for (const it of r.items!) {
                const ex = inv.find((x) => x.name === it.name);
                if (ex) ex.quantity += it.quantity;
                else inv.push({ id: `canon-${it.name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: it.name, type: (it.type || '材料') as any, description: r.note || '介入正史所得', quantity: it.quantity, rarity: (it.rarity || '普通') as any } as any);
              }
              return { ...prev, inventory: inv };
            });
            gameStore.addLog(`【參與所得】${r.items.map((it) => `${it.name}×${it.quantity}`).join('、')}`, 'gain');
          }
        }
        if (r.relationship && npcIds.length) {
          const ns = { ...(patch.npcStates || world.npcStates) };
          for (const nid of npcIds) if (ns[nid]) ns[nid] = { ...ns[nid], relationship: (ns[nid].relationship || 0) + r.relationship };
          patch.npcStates = ns;
        }
        if (r.note) gameStore.addLog(r.note, 'special');
      }

      const combat = /出手|阻止|擊殺|斬|攔|戰|奪|搶|護|救|逼|脅|破|殺|伏擊|偷襲/.test(iv?.description || '');
      if (combat && player) {
        const foeName = (ev.involvedNpcIds || [])[0];
        const foeRealm = foeName ? world.npcStates[getNpc(foeName)?.id || '']?.realm : undefined;
        set({ pendingBattle: { context: `介入正史節點「${ev.title}」`, divergenceEventId: ev.id } });
        useUIStore.getState().openTurnBasedBattle({
          adventureType: 'normal',
          riskLevel: '高',
          realmMinRealm: toRealmType(String(foeRealm || ''), player.realm),
        });
      }
    }
    // 劇情組隊：綁定此事件者，劇情落幕即解散並分贓
    if (world.party?.storyEventId === ev.id) {
      const finalPool = (patch.party || world.party).lootPool;
      const settle = settleLoot(finalPool, world.party.members.length);
      if (settle.playerShare.length && player) {
        gameStore.setPlayer((prev) => {
          if (!prev) return prev;
          const inv = prev.inventory.map((i) => ({ ...i }));
          for (const s of settle.playerShare) {
            const ex = inv.find((x) => x.name === s.name);
            if (ex) ex.quantity += s.quantity;
            else inv.push({ id: `loot-${s.name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: s.name, type: (s.type || '材料') as any, description: '劇情分贓所得', quantity: s.quantity, rarity: (s.rarity || '普通') as any } as any);
          }
          return { ...prev, inventory: inv };
        });
      }
      gameStore.addLog(`劇情落幕，臨時隊伍就此解散。\n${settle.narrative}`, 'special');
      patch.party = undefined;
    }

    const nw = { ...world, ...patch };
    persistWorld(nw);
    set({ world: nw });
  },

  // 套用戰鬥結果（由 CanonView 的 TurnBasedBattleModal onClose 呼叫）
  applyBattleResult: (result) => {
    const gameStore = useGameStore.getState();
    const pb = get().pendingBattle;
    const prev = gameStore.player;
    // 組隊助戰：同伴為你分擔部分傷勢（每人約 18%，最多 5 成）
    const allyCount = get().world.party?.members?.length || 0;
    const absorb = allyCount ? Math.min(0.5, allyCount * 0.18) : 0;
    const effHpLoss = Math.round((result.hpLoss || 0) * (1 - absorb));
    // 不再軟保底：氣血可歸零 → 真死
    const newHp = prev ? Math.max(0, Math.min(prev.maxHp, prev.hp - effHpLoss)) : 0;
    gameStore.setPlayer((p) => {
      if (!p) return p;
      const exp = Math.max(0, Math.min(p.maxExp, p.exp + (result.expChange || 0)));
      const spirit = Math.max(0, p.spirit + (result.spiritChange || 0));
      const spiritStones = Math.max(0, p.spiritStones + (result.spiritStones || 0));
      return { ...p, hp: newHp, exp, spirit, spiritStones };
    });
    set({ pendingBattle: null });
    const ctx = pb?.context ? `（${pb.context}）` : '';
    if (newHp <= 0) {
      get().die(`你在一場惡鬥中力竭身殞${ctx}——氣血耗盡，魂歸幽冥`);
      return;
    }
    const allyTag = allyCount ? `（同伴助戰、為你分擔了部分傷勢）` : '';
    gameStore.addLog(
      result.victory
        ? `你${allyCount ? '與同伴合力' : ''}險勝一場惡鬥${ctx}，氣血耗損但有所精進。${allyTag}`
        : `你不敵敗退，重傷遁走${ctx}，僥倖撿回一條性命。${allyTag}`,
      result.victory ? 'gain' : 'danger'
    );
  },

  // 戰鬥擊殺 → 執行所有 on:'kill' 機制（如噬靈祕術、奪元大法）
  onKill: () => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled || !world.mechanics.length) return;
    const day = world.clock.totalDays;
    const mechanics = world.mechanics.map((m) => ({ ...m, gainedByEffect: { ...m.gainedByEffect }, dailyByEffect: { ...m.dailyByEffect } }));
    let karma = 0;
    const deltas: Record<string, number> = {};
    const notes: string[] = [];
    let any = false;
    for (const spec of mechanics) {
      const r = applyTrigger(spec, 'kill', { day, maxHp: player.maxHp });
      if (!r.applied) continue;
      any = true;
      for (const k of Object.keys(r.deltas)) deltas[k] = (deltas[k] || 0) + (r.deltas as any)[k];
      karma += r.karma;
      if (r.narrative) notes.push(`〔${spec.name}〕${r.narrative}`);
    }
    if (!any) return;
    gameStore.setPlayer((prev) => {
      if (!prev) return prev;
      const base = applyStatDeltas(prev, deltas);
      return { ...base, exp: Math.min(prev.maxExp, prev.exp + (deltas.exp || 0)), spiritStones: prev.spiritStones + (deltas.spiritStones || 0), luck: prev.luck + (deltas.luck || 0) };
    });
    const nextWorld = { ...world, mechanics, karma: world.karma + karma };
    persistWorld(nextWorld);
    set({ world: nextWorld });
    gameStore.addLog(`【戰利・異能】${notes.join('；')}${karma > 0 ? `（業力 +${Math.round(karma)}）` : ''}`, 'danger');
  },

  // 自創/改良：把玩家文本演繹成新機制（異能/功法/丹方）
  createMechanic: async (rawText, kind) => {
    if (get().busy) return;
    const gameStore = useGameStore.getState();
    const world = get().world;
    if (!world.enabled || !rawText.trim()) return;
    set({ busy: true });
    try {
      const spec = await extrapolateMechanic(rawText, kind, `c${world.mechanics.length}`);
      const nextWorld = { ...world, mechanics: [...world.mechanics, spec] };
      persistWorld(nextWorld);
      set({ world: nextWorld });
      const passive = passiveStatBonus(spec);
      if (Object.keys(passive).length) gameStore.setPlayer((prev) => (prev ? applyStatDeltas(prev, passive) : prev));
      if (kind === 'recipe') {
        const rarity = ['普通', '稀有', '传说', '仙品'][Math.min(3, Math.max(0, spec.powerTier - 1))];
        gameStore.setPlayer((prev) =>
          prev ? { ...prev, inventory: [...prev.inventory, { id: `canon-pill-${Date.now()}`, name: spec.name, type: '丹药', description: spec.summary, quantity: 2, rarity, effect: { exp: 80 * spec.powerTier } } as any] } : prev
        );
      }
      const kindLabel = kind === 'art' ? '功法' : kind === 'recipe' ? '丹方' : '異能';
      gameStore.addLog(
        `【演繹・自創${kindLabel}】「${spec.name}」（${spec.category}・第${spec.powerTier}階・${spec.source === 'llm' ? 'AI演繹' : '推演'}）成形！\n${spec.summary}\n限制：${spec.limits.join('；')}\n風險：${spec.risks.join('；')}`,
        'special'
      );
    } finally {
      set({ busy: false });
    }
  },

  reset: () => {
    const w = emptyWorld();
    persistWorld(w);
    set({ world: w, lastResult: null });
  },

  // 主角永久死亡：遊戲結束，canon 模式無重生
  die: (cause) => {
    const world = get().world;
    if (world.gameOver?.dead) return;
    const nw: FanrenWorldState = { ...world, gameOver: { dead: true, cause, day: world.clock.totalDays } };
    persistWorld(nw);
    set({ world: nw });
    useGameStore.getState().addLog(`【身死道消】${cause}。\n你的仙途，至此終結——這方天地，自此再無你的傳說。`, 'danger');
  },

  // 由 localStorage 還原世界狀態（切換存檔槽/匯入後同步，避免 player↔world 失同步）
  reloadFromStorage: () => {
    set({ world: loadWorld() });
  },

  // 交易：統一改動背包與靈石（買/賣/拍賣/交換共用）
  applyTrade: (p) => {
    const gameStore = useGameStore.getState();
    gameStore.setPlayer((prev) => {
      if (!prev) return prev;
      let inv = prev.inventory.map((i) => ({ ...i }));
      if (p.removeName) {
        const ex = inv.find((i) => i.name === p.removeName);
        if (ex) { ex.quantity -= p.removeQty || 1; if (ex.quantity <= 0) inv = inv.filter((i) => i !== ex); }
      }
      if (p.addItem) {
        const ex = inv.find((i) => i.name === p.addItem!.name);
        if (ex) ex.quantity += p.addItem!.quantity;
        else inv.push({ id: `trade-${p.addItem!.name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: p.addItem!.name, type: (p.addItem!.type || '材料') as any, description: p.addItem!.description || '', quantity: p.addItem!.quantity, rarity: (p.addItem!.rarity || '普通') as any } as any);
      }
      const spiritStones = Math.max(0, prev.spiritStones + (p.stoneDelta || 0));
      return { ...prev, inventory: inv, spiritStones };
    });
    if (p.log) gameStore.addLog(p.log, p.logType || 'gain');
  },

  // 洞府：以靈石購置／租賃，或憑身分入主
  acquireAbode: (abodeId) => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled) return;
    const a = getAbode(abodeId);
    if (!a) return;
    const origin = ORIGINS.find((o) => o.id === world.originId);
    const gate = canAcquireAbode(abodeId, player.realm, origin?.startingSectId || null);
    if (!gate.ok) { gameStore.addLog(gate.reason, 'danger'); return; }
    // 開闢地點規則：須有靈氣、類型與地相符、勢力範圍收費（見 canEstablishAbodeHere）
    const place = canEstablishAbodeHere(world, a);
    if (!place.ok) { gameStore.addLog(place.reason, 'danger'); return; }
    // 一次只能有一個洞府：已有他處洞府，須先捨棄（洞府不可移動，舊居就此荒置）
    const replacingElsewhere = world.abode && world.abode.id !== a.id;
    const cost = a.rentPerYear ? a.rentPerYear : a.costStones;
    if (player.spiritStones < cost) {
      gameStore.addLog(`「${a.name}」需靈石 ${cost}${a.rentPerYear ? '（首年租金）' : ''}，你現有 ${player.spiritStones}，財力未逮。`, 'danger');
      return;
    }
    if (cost > 0) gameStore.setPlayer((p) => (p ? { ...p, spiritStones: Math.max(0, p.spiritStones - cost) } : p));
    const node = findMapNode(world.currentLocationId);
    const locName = node?.name || world.currentLocationId;
    const owned: OwnedAbode = {
      id: a.id, name: a.name, locationKind: a.locationKind, spiritArray: a.spiritArray, herbPlots: a.herbPlots, wardLevel: a.wardLevel,
      acquiredDay: world.clock.totalDays, rented: !!a.rentPerYear,
      locationId: world.currentLocationId, locationName: locName, protected: place.isProtected,
    };
    const nw: FanrenWorldState = { ...world, abode: owned, garden: world.abode?.id === a.id ? world.garden : [] };
    persistWorld(nw);
    set({ world: nw });
    if (replacingElsewhere) {
      gameStore.addLog(`你捨棄了原先位於「${world.abode!.locationName || '他處'}」的「${world.abode!.name}」（洞府不可移動，舊居就此荒置）。`, 'normal');
    }
    const protNote = place.isProtected ? '此地有勢力庇護，須按例納租／庇護費，較為安穩' : '此處荒僻無人庇護，須自行布陣禦敵、慎防外擾';
    gameStore.addLog(`你於「${locName}」（${place.lingMaiName}）${a.rentPerYear ? '租下' : a.costStones === 0 ? '憑門中身分入主' : '開闢購置'}了「${a.name}」——聚靈陣 +${Math.round(a.spiritArray * 100)}% 閉關效率，藥園 ${a.herbPlots} 畝，禁制 ${a.wardLevel} 級${cost > 0 ? `（耗靈石 ${cost}）` : ''}。${protNote}。洞府不可移動，自此於此安身潛修。`, 'special');
  },

  plantHerb: (herbName) => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.abode) { gameStore.addLog('你尚無洞府藥園可供栽種。', 'normal'); return; }
    const garden = world.garden || [];
    if (garden.length >= world.abode.herbPlots) { gameStore.addLog('藥園靈田已滿，待收成後再種。', 'normal'); return; }
    const seed = player.inventory.find((i) => i.name === herbName);
    if (!seed) { gameStore.addLog(`你背包中沒有「${herbName}」可作種苗。`, 'normal'); return; }
    get().applyTrade({ removeName: herbName, removeQty: 1 });
    const matureDay = world.clock.totalDays + gardenMatureDays(world.abode.spiritArray);
    const nw: FanrenWorldState = { ...get().world, garden: [...garden, { herb: herbName, plantedDay: world.clock.totalDays, matureDay }] };
    persistWorld(nw);
    set({ world: nw });
    gameStore.addLog(`你將「${herbName}」植入洞府藥園，借聚靈陣溫養，約 ${Math.max(1, Math.round((matureDay - world.clock.totalDays) / 30))} 月後可收。`, 'gain');
  },

  harvestGarden: () => {
    const gameStore = useGameStore.getState();
    const world = get().world;
    const day = world.clock.totalDays;
    if (!world.garden || !world.garden.length) { gameStore.addLog('藥園空空如也。', 'normal'); return; }
    const ripe = world.garden.filter((g) => g.matureDay <= day);
    if (!ripe.length) { gameStore.addLog('園中靈藥尚未成熟，再候些時日。', 'normal'); return; }
    for (const g of ripe) get().applyTrade({ addItem: { name: g.herb, type: '草药', rarity: '稀有', description: '洞府藥園所植、靈氣充盈的靈藥', quantity: 2 } });
    const nw: FanrenWorldState = { ...get().world, garden: world.garden.filter((g) => g.matureDay > day) };
    persistWorld(nw);
    set({ world: nw });
    gameStore.addLog(`你自洞府藥園收得 ${ripe.length} 種成熟靈藥：${ripe.map((g) => g.herb).join('、')}（各 ×2，品質更勝野生）。`, 'gain');
  },

  // 宗門儀軌：入門大典／辦差立功／資源兌換／支領月俸／晉升大典／赴宗門盛事／離宗
  joinSect: (sectId, opts) => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled) return;
    const sect = getSect(sectId);
    if (!sect) return;
    const hasRoot = !!player.spiritualRoots && Object.values(player.spiritualRoots as Record<string, number>).some((v) => v > 0);
    const check = canJoinSect(sect, { realmName: player.realm, hasRoot, currentSectId: world.sect?.sectId });
    if (!check.ok) { gameStore.addLog(check.reason, 'danger'); return; }
    // 持升仙令等引薦信物（viaItem）＝升仙大會受招，免親至山門；否則須在本門內。
    const viaItem = opts?.viaItem;
    if (!viaItem && !requireAtSect(world, sect, gameStore)) return; // 拜師須親至山門
    // 入門典禮：測靈根 → 拜師大典 → 立誓 → 賜物（詳細儀軌於 UI 呈現，此處落地賜物與身分）
    const day = world.clock.totalDays;
    const ceremony = buildCeremony(sect, { roots: player.spiritualRoots, playerName: player.name, realmName: player.realm });
    const master = pickMentor(sect, day);
    const membership: SectMembership = {
      sectId: sect.id, sectName: sect.name, rankIndex: 0, contribution: 0, merit: 0, demerit: 0,
      joinedDay: day, identityToken: ceremony.identityToken, rootTier: ceremony.rootTest.tier,
      masterName: master, oath: oathOf(sect, day), titles: [], lastStipendDay: day, missionsDone: 0,
    };
    const firstEvent = maybeRollSectEvent(sect, day, null);
    const nw: FanrenWorldState = { ...world, sect: membership, sectEvent: firstEvent };
    persistWorld(nw); set({ world: nw });
    for (const g of ceremony.gifts) get().applyTrade({ addItem: { name: g.name, type: g.type, rarity: g.rarity, description: g.desc, quantity: 1 } });
    if (ceremony.stones) get().applyTrade({ stoneDelta: ceremony.stones });
    const how = sect.category === '武林門派' ? '磕頭遞帖、演武試藝，立江湖規矩' : sect.category === '魔道宗門' ? '歃血立誓、納投名狀' : `測得「${ceremony.rootTest.tier}」，焚香三拜、敬受門規`;
    gameStore.addLog(`✦【拜入${sect.name}】禮成——你${how}，拜入「${master}」門下，名入門籍，位列「${ceremony.rankName}」。賜下：${ceremony.gifts.map((g) => g.name).join('、')}，例俸靈石 ${ceremony.stones}。`, 'special');
    // 引薦信物：耗去信物，並發放信物所附之獎（升仙令附築基丹——劇情/AI 結合，敘事所述真實落地）
    if (viaItem) {
      const bundle = SECT_TOKEN_BUNDLE[viaItem.includes('升仙令') ? '升仙令' : viaItem] || [];
      get().applyTrade({ removeName: viaItem, removeQty: 1 });
      for (const it of bundle) get().applyTrade({ addItem: it });
      gameStore.addLog(`你呈上的「${viaItem}」乃升仙大會錄取之憑，門中按例附贈${bundle.map((b) => `${b.name}×${b.quantity}`).join('、') || '入門資糧'}——信物已繳，自此你便是名正言順的門中弟子。`, 'gain');
    }
  },
  doSectMission: (missionIndex) => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    const raw = world.sect;
    if (!raw || !player) { gameStore.addLog('你尚未拜入任何宗門。', 'normal'); return; }
    const sect = getSect(raw.sectId);
    if (!sect) return;
    if (!requireAtSect(world, sect, gameStore)) return; // 辦差須在本門領命
    const m = normSect(raw, sect);
    const out = runMission(sect, missionIndex, { day: world.clock.totalDays, sectName: sect.name });
    if (!out) return;
    // 立功勳（與可花用貢獻同增），依功勳與境界雙閘重算階級
    const g = gainMerit(m, sect, out.meritGain, player.realm);
    const after: SectMembership = { ...g.membership, missionsDone: (m.missionsDone || 0) + 1 };
    const tp = tickDays(world, out.daysCost);
    const rolled = maybeRollSectEvent(sect, world.clock.totalDays + out.daysCost, world.sectEvent);
    let nw: FanrenWorldState = { ...world, ...tp, sect: after, sectEvent: rolled };
    // 善惡聲望／業力
    if (out.rep && (out.rep.righteous || out.rep.demonic)) {
      const dd = applyDeed(world.reputation, { righteous: out.rep.righteous, demonic: out.rep.demonic });
      nw = { ...nw, reputation: dd.rep };
    }
    if (out.rep?.karma) nw = { ...nw, karma: (world.karma || 0) + out.rep.karma };
    persistWorld(nw); set({ world: nw });
    // 時間流逝 → 壽元；橫財／兇險落地
    gameStore.setPlayer((p) => {
      if (!p) return p;
      const lifespan = Math.max(0, p.lifespan - out.daysCost / 360);
      const hp = out.hpLossFrac ? Math.max(1, Math.round(p.hp - p.maxHp * out.hpLossFrac)) : p.hp;
      return { ...p, lifespan, hp, gameDays: (p.gameDays || 0) + out.daysCost };
    });
    if (out.windfall) get().applyTrade({ addItem: out.windfall });
    gameStore.addLog(out.narrative + (out.rep?.demonic ? '（兇名加身、業力增長）' : out.rep?.righteous ? '（俠義之名稍長）' : ''), out.hpLossFrac ? 'danger' : 'gain');
    // 晉升大典／資歷受境界所阻
    if (g.promoted) get()._sectPromotionCeremony(sect, after.rankIndex);
    else if (g.heldByRealm && g.needRealm) gameStore.addLog(`你功勳資歷已足，惟修為未及「${g.needRealm}」——掌門暫不予擢升。待你修為精進，再行晉升大典。`, 'normal');
    const np = useGameStore.getState().player;
    if (np && np.lifespan <= 0) get().die('辦差積年，壽元耗盡，油盡燈枯');
  },
  redeemSectResource: (resIndex) => {
    const gameStore = useGameStore.getState();
    const world = get().world;
    const raw = world.sect;
    if (!raw) { gameStore.addLog('你尚未拜入任何宗門。', 'normal'); return; }
    const sect = getSect(raw.sectId);
    if (!sect) return;
    if (!requireAtSect(world, sect, gameStore)) return; // 兌換須親至本門領取
    const m = normSect(raw, sect);
    const r = sect.resources[resIndex];
    if (!r) return;
    if (m.contribution < r.cost) { gameStore.addLog(`「${r.name}」需貢獻 ${r.cost}，你現有 ${m.contribution}，尚不足——多為宗門辦差積攢吧。`, 'danger'); return; }
    // 只扣可花用之貢獻；功勳（資歷）不減，階級不動
    const nw: FanrenWorldState = { ...world, sect: { ...m, contribution: m.contribution - r.cost } };
    persistWorld(nw); set({ world: nw });
    get().applyTrade({ addItem: { name: r.name, type: sect.category === '武林門派' ? '材料' : '法宝', rarity: '稀有', description: r.note, quantity: 1 }, log: `你以貢獻 ${r.cost} 自「${sect.name}」兌得「${r.name}」（${r.note}）。功勳資歷不減，貢獻尚餘 ${m.contribution - r.cost}。`, logType: 'gain' });
  },
  claimSectStipend: () => {
    const gameStore = useGameStore.getState();
    const world = get().world;
    const raw = world.sect;
    if (!raw) { gameStore.addLog('你尚未拜入任何宗門。', 'normal'); return; }
    const sect = getSect(raw.sectId);
    if (!sect) return;
    if (!requireAtSect(world, sect, gameStore)) return; // 領俸須親至本門
    const m = normSect(raw, sect);
    const st = accrueStipend(m, sect, world.clock.totalDays);
    if (!st) { gameStore.addLog('距上次支俸未滿一月，例俸尚未積成——再候些時日。', 'normal'); return; }
    const nw: FanrenWorldState = { ...world, sect: { ...m, lastStipendDay: world.clock.totalDays } };
    persistWorld(nw); set({ world: nw });
    if (st.stones) get().applyTrade({ stoneDelta: st.stones });
    if (st.pill) get().applyTrade({ addItem: { name: st.pill, type: '丹药', rarity: '普通', description: '本階例給的丹藥配給', quantity: 1 } });
    gameStore.addLog(st.narrative, 'gain');
  },
  attemptSectPromotion: () => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    const raw = world.sect;
    if (!raw || !player) { gameStore.addLog('你尚未拜入任何宗門。', 'normal'); return; }
    const sect = getSect(raw.sectId);
    if (!sect) return;
    if (!requireAtSect(world, sect, gameStore)) return; // 晉升大典須親至本門受任
    const m = normSect(raw, sect);
    const eff = effectiveRank(sect, m.merit ?? m.contribution, player.realm);
    if (eff <= m.rankIndex) {
      const next = sect.ranks[m.rankIndex + 1];
      if (!next) { gameStore.addLog('你已位列宗門頂階，再無可晉。', 'normal'); return; }
      const meritReady = (m.merit ?? m.contribution) >= next.reqContribution;
      gameStore.addLog(meritReady
        ? `欲晉「${next.name}」，修為尚未及格——掌門不予擢升。先衝破瓶頸，再來受任。`
        : `欲晉「${next.name}」，尚須功勳 ${next.reqContribution}（你現有 ${m.merit ?? m.contribution}）——多為宗門立功吧。`, 'normal');
      return;
    }
    const after: SectMembership = { ...m, rankIndex: eff };
    persistWorld({ ...world, sect: after }); set({ world: { ...get().world, sect: after } });
    get()._sectPromotionCeremony(sect, eff);
  },
  participateSectEvent: () => {
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    const raw = world.sect;
    const ev = world.sectEvent;
    if (!raw || !player) { gameStore.addLog('你尚未拜入任何宗門。', 'normal'); return; }
    if (!ev || ev.sectId !== raw.sectId) { gameStore.addLog('宗門近日並無盛事。', 'normal'); return; }
    if (world.clock.totalDays > ev.endDay) { gameStore.addLog(`「${ev.title}」已然結束，你錯過了這場盛事。`, 'normal'); persistWorld({ ...world, sectEvent: null }); set({ world: { ...world, sectEvent: null } }); return; }
    const sect = getSect(raw.sectId)!;
    if (!requireAtSect(world, sect, gameStore)) return; // 赴會聽訓／參賽須親至本門
    const m = normSect(raw, sect);
    const res = resolveSectEvent(ev, sect, { day: world.clock.totalDays, rankIndex: m.rankIndex, playerName: player.name });
    const g = gainMerit(m, sect, res.meritGain, player.realm);
    const titles = res.title ? [...(m.titles || []), res.title] : m.titles;
    const after: SectMembership = { ...g.membership, titles };
    const tp = tickDays(world, res.daysCost);
    const nw: FanrenWorldState = { ...world, ...tp, sect: after, sectEvent: null };
    persistWorld(nw); set({ world: nw });
    gameStore.setPlayer((p) => {
      if (!p) return p;
      const exp = Math.max(0, Math.min(p.maxExp, p.exp + (res.expGain || 0)));
      const lifespan = Math.max(0, p.lifespan - res.daysCost / 360);
      return { ...p, exp, lifespan, gameDays: (p.gameDays || 0) + res.daysCost };
    });
    if (res.stones) get().applyTrade({ stoneDelta: res.stones });
    if (res.item) get().applyTrade({ addItem: res.item });
    gameStore.addLog(res.narrative + (res.title ? `\n✦ 你得榮銜「${res.title}」！` : ''), res.tone);
    if (g.promoted) get()._sectPromotionCeremony(sect, after.rankIndex);
  },
  leaveSect: () => {
    const gameStore = useGameStore.getState();
    const world = get().world;
    const raw = world.sect;
    if (!raw) return;
    const sect = getSect(raw.sectId);
    const m = sect ? normSect(raw, sect) : raw;
    const out = sect ? departureOutcome(sect, m) : { betrayal: false, narrative: `你退出了「${raw.sectName}」，自此再無瓜葛。`, tone: 'normal' as const, rep: undefined };
    let nw: FanrenWorldState = { ...world, sect: undefined, sectEvent: null };
    if (out.rep && (out.rep.demonic || out.rep.karma)) {
      if (out.rep.demonic) { const dd = applyDeed(world.reputation, { demonic: out.rep.demonic }); nw = { ...nw, reputation: dd.rep }; }
      if (out.rep.karma) nw = { ...nw, karma: (world.karma || 0) + out.rep.karma };
    }
    persistWorld(nw); set({ world: nw });
    gameStore.addLog(out.narrative, out.tone);
  },
  // 晉升大典（內部）：賜靈石／信符／榮銜，逐幕呈現擢升儀軌
  _sectPromotionCeremony: (sect: SectDef, newRankIndex: number) => {
    const gameStore = useGameStore.getState();
    const cer = buildPromotionCeremony(sect, newRankIndex, { playerName: gameStore.player?.name || '你' });
    const body = cer.beats.map((b) => `　${b.text}`).join('\n');
    gameStore.addLog(`✦【${sect.name}・晉升大典】\n${body}`, 'special');
    if (cer.rewardStones) get().applyTrade({ stoneDelta: cer.rewardStones });
    if (cer.rewardItem) get().applyTrade({ addItem: cer.rewardItem });
    if (cer.title) {
      const w = get().world;
      if (w.sect) { const after = { ...w.sect, titles: [...(w.sect.titles || []), cer.title] }; persistWorld({ ...w, sect: after }); set({ world: { ...w, sect: after } }); }
    }
  },

  // 突破 / 渡劫：修為圓滿時衝擊瓶頸。結丹起有風險，跳大境界需渡天劫，高境界失敗可致死。
  attemptBreakthrough: () => {
    if (get().busy) return;
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled || world.gameOver?.dead) return;
    if (player.exp < player.maxExp) {
      gameStore.addLog('修為尚未圓滿，難以衝擊瓶頸——再積累些時日吧。', 'normal');
      return;
    }
    const plan = nextBreakthrough(world, player.realm, player.realmLevel);
    // ── 飛升靈界・測試版邊界鎖：人界→靈界（化神→煉虛）的飛升須玩家親手「開鎖」確認 ──
    if (
      plan.realmJump &&
      CANON_REALMS[plan.curIndex]?.tier === 'human' &&
      CANON_REALMS[plan.targetIndex]?.tier === 'spirit' &&
      !world.flags?.['飛升靈界_確認']
    ) {
      const nw: FanrenWorldState = {
        ...world,
        pendingChoice: {
          prompt:
            '【飛升靈界・偷渡空間節點】你已立於人界之巔、化神大圓滿，人界靈氣再難支撐你寸進——唯有飛升靈界一途。\n\n' +
            '你並不走正規的「飛靈臺」之路（循正途者將被接往靈界天淵城、受三百年驅役方得自由），而是覓得一處隱秘的「空間節點」，欲行偷渡。節點之內空間風暴肆虐、隔界之力足以壓滅元嬰，沿途護身法寶恐毀去十之八九——九死一生。\n\n' +
            '（此處亦是本測試版劇情精心打磨的終點：一旦偷渡踏入靈界，其後天地雖廣，劇情未及細琢，往後皆由你親自體會、不保證遊玩品質。）\n\n' +
            '是否冒死推開這扇空間節點的門扉？',
          options: [
            { id: 'ascend', text: '冒死偷渡・踏入靈界', hint: '穿越空間節點（極凶險），抵達未保證品質的靈界' },
            { id: 'stay', text: '暫留人界，再積蓄', hint: '留在化神大圓滿之境，靜待時機' },
          ],
          sourceAscension: true,
        },
      };
      persistWorld(nw);
      set({ world: nw });
      gameStore.addLog('你循冥冥牽引，尋得一處隱秘的空間節點，幽深漆黑如墨——這便是偷渡靈界的門扉。闖與不闖，繫於一念之間。', 'special');
      return;
    }
    const dao = DAO_HEARTS.find((d) => d.id === world.daoHeartId);
    const daoBonus = (dao?.effects?.breakthroughBonus || 0) / 100;
    const karmaPenalty = Math.min(0.35, (world.goldenFingerRuntime?.karma || 0) / 200 + (world.karma || 0) / 500);
    let chance: number;
    if (plan.qiLayerUp) chance = 0.9;
    else if (!plan.realmJump) chance = 0.82 - (world.canonSubStage || 0) * 0.05;
    else chance = plan.needTribulation ? 0.58 - plan.curIndex * 0.03 : 0.72;

    // ── 原著考據・分大境界突破關卡：靈根品質定築基／凝丹碎丹之苦／元嬰心魔護魂 ──
    const invFind = (names: string[]) => player.inventory.find((i) => names.some((n) => i.name.includes(n)));
    const consumeItems: string[] = []; // 此次突破所耗之丹／靈物（成敗皆耗）
    let coreShatter = false;       // 結丹：凝丹瓶頸＋碎丹逆轉經脈之苦
    let nascentUnshielded = false; // 元嬰：無護魂之物，心魔幻象更兇
    let breakPrefixNote = '';
    const tgtKey = plan.targetRealm.key;
    if (tgtKey === 'foundation') {
      // 築基：成功率主由靈根品質決定（天/異近成、偽靈根渺茫）；築基丹大增成算（成敗皆耗一粒）
      const rootMult = cultivationMultFromRoots(player.spiritualRoots, player.variantRoot?.value || 0);
      const baseByRoot = rootMult >= 2.5 ? 0.85 : rootMult >= 1.4 ? 0.55 : rootMult >= 1.0 ? 0.38 : 0.12;
      const dan = invFind(['築基丹']);
      chance = dan ? baseByRoot : baseByRoot * 0.4;
      if (dan) consumeItems.push(dan.name);
      const rootDesc = rootMult >= 2.5 ? '靈根純厚，丹力如臂使指' : rootMult >= 1.0 ? '靈根尚可，丹力勉力可引' : '靈根駁雜孱弱、丹力滯澀難引（偽靈根築基，原著百中無一）';
      breakPrefixNote = dan ? `你服下「築基丹」洗髓易筋、衝擊築基瓶頸——${rootDesc}。` : '你並無築基丹傍身，僅憑己力強衝築基瓶頸，成算微乎其微——尋得「築基丹」再來，方為正道。';
    } else if (tgtKey === 'core') {
      // 結丹：凝丹瓶頸＋碎丹之苦（成功後另受逆脈重創）；補天丹／凝丹靈物可助丹基
      coreShatter = true;
      const aid = invFind(['補天丹', '九曲靈參', '凝丹', '聚靈']);
      if (aid) { chance += 0.12; consumeItems.push(aid.name); breakPrefixNote = `你以「${aid.name}」溫養丹基，凝丹成算大增。`; }
    } else if (tgtKey === 'nascent') {
      // 元嬰：化丹為嬰須歷心魔幻象，護魂之物（定靈丹／養魂木／婆羅珠）定神護魂
      const shield = invFind(['定靈丹', '安魂丹', '養魂木', '婆羅珠']);
      if (shield) { chance += 0.18; consumeItems.push(shield.name); breakPrefixNote = `你服「${shield.name}」護持心神，化丹為嬰時心魔幻象之擾大減。`; }
      else { chance -= 0.12; nascentUnshielded = true; breakPrefixNote = '你無定靈丹、養魂木、婆羅珠等護魂之物傍身，化丹為嬰時心魔反噬、幻象叢生，稍有沉溺便有癲狂入魔之危。'; }
    }
    // 悟性助領悟瓶頸；心性助渡劫定力（渡天劫時加倍計）
    const compBonus = (((player.comprehension ?? 50) - 50) / 400);
    const xinBonus = (((player.daoHeart ?? 50) - 50) / 400) * (plan.needTribulation ? 1.5 : 1);
    chance = Math.max(0.05, Math.min(0.97, chance + (player.luck || 0) * 0.01 + daoBonus + compBonus + xinBonus - karmaPenalty));
    const success = Math.random() <= chance;
    // 突破所耗之丹／靈物：成敗皆消耗（衝關時即已服下／引動）
    if (consumeItems.length) {
      gameStore.setPlayer((p) => {
        if (!p) return p;
        const inv = p.inventory.map((it) => ({ ...it }));
        for (const nm of consumeItems) { const ci = inv.find((it) => it.name === nm); if (ci) ci.quantity -= 1; }
        return { ...p, inventory: inv.filter((it) => it.quantity > 0) };
      });
    }
    const tgt = CANON_REALMS[plan.targetIndex];
    const isAscend = CANON_REALMS[plan.curIndex]?.tier === 'human' && tgt?.tier === 'spirit'; // 人界→靈界＝偷渡空間節點
    const tribTag = isAscend ? '【偷渡空間節點・飛升靈界】' : plan.needTribulation ? `【渡${plan.targetRealm.tribulationName || '天劫'}】` : plan.realmJump ? '【衝擊大境界】' : '';
    const advNote = (() => {
      switch (tgt?.key) {
        case 'foundation': return '築基功成、法力初凝——自此可禦器（飛劍／法器）凌空代步，正式踏入修仙之門。';
        case 'core': return '金丹凝成、法力化液——自此可以金丹溫養一件「本命法寶」，與你心意相通、威力倍增。';
        case 'nascent': return '金丹碎、元嬰成——一個與你眉眼無二的小人兒端坐識海。元嬰可離體神遊、奪舍重生，縱肉身碎滅亦留一線生機。';
        case 'spirit-sever': return '元嬰化神、神念成軀，初通天地元氣——然你已臻人界之巔，在此低階界域不可隨意全力出手，人界靈氣亦再難支撐你寸進。';
        default: return tgt?.features?.trait || '';
      }
    })();

    if (success) {
      const isQiTarget = !!CANON_REALMS[plan.targetIndex].layers;
      const newSub = plan.qiLayerUp || isQiTarget ? 0 : plan.targetSub;
      const nw: FanrenWorldState = { ...world, canonRealmIndex: plan.targetIndex, canonSubStage: newSub };
      persistWorld(nw);
      set({ world: nw });
      // 突破關口・一波大的屬性增長：大境界躍遷 +40%、子境界(初→中…)+15%、煉氣每層 +8%
      const spike = plan.realmJump ? 0.4 : plan.qiLayerUp ? 0.08 : 0.15;
      gameStore.setPlayer((p) => {
        if (!p) return p;
        const newMaxHp = Math.round(p.maxHp * (plan.realmJump ? 1.6 : 1.12));
        const newLifespan = realmLifespan(plan.targetIndex);
        const dispLevel = isQiTarget ? (plan.qiLayerUp ? p.realmLevel + 1 : p.realmLevel) : newSub + 1;
        return {
          ...p,
          realm: toRealmType(CANON_REALMS[plan.targetIndex].realmType, p.realm),
          realmLevel: Math.max(1, dispLevel),
          exp: 0,
          maxExp: realmMaxExp(plan.targetIndex, newSub),
          hp: coreShatter ? Math.max(1, Math.round(newMaxHp * 0.55)) : newMaxHp, // 碎丹逆脈重創，僅餘半血
          maxHp: newMaxHp,
          attack: Math.round(p.attack * (1 + spike)),
          defense: Math.round(p.defense * (1 + spike)),
          spirit: Math.round(p.spirit * (1 + spike)),
          physique: Math.round(p.physique * (1 + spike)),
          speed: Math.round(p.speed * (1 + spike)),
          lifespan: Math.max(0, Math.max(p.lifespan, newLifespan) - (coreShatter ? 4 : 0)), // 碎丹耗壽
          maxLifespan: newLifespan,
        };
      });
      const spikeNote = plan.realmJump ? '一身法力氣血如江河決堤般暴漲！' : '法力氣血隨之猛漲一截。';
      const coreNote = coreShatter ? '\n【凝丹瓶頸・碎丹之苦】你先聚渾身法力凝為一枚金丹，再強行碎丹、令真元逆流重塑全身經脈——痛楚徹骨、幾近生不如死；丹成之時氣血翻湧、形容枯槁，卻已脫胎換骨。' : '';
      const nascentNote = tgtKey === 'nascent'
        ? (nascentUnshielded
            ? '\n【心魔反噬】化丹為嬰之際，識海驟現畢生至懼——故鄉血洗、至親慘死眼前……繼又墮入種種美夢至樂幾欲沉溺；你無護魂之物，全憑一點道心苦苦支撐，數月幻象煎熬後方掙脫魔障、元嬰始成。'
            : '\n【心魔幻象】化丹為嬰須歷心魔——畢生至懼與美夢至樂交替襲來；幸有護魂之物定住心神，你數月間識破虛妄、安然渡過，元嬰終成。')
        : '';
      gameStore.addLog(
        (breakPrefixNote ? breakPrefixNote + '\n' : '') + (
          isAscend
            ? `${tribTag}空間風暴一波接一波幾將你撕成齏粉，隔界之力壓得元嬰幾近潰散……不知過了多久，你終於穿出亂流、墜入一片陌生天地的邊陲——偷渡成功，你踏入了靈界！${spikeNote}${advNote ? '\n' + advNote : ''}`
            : `${tribTag}你心神沉入瓶頸、靈氣轟然鼓盪——衝破了！修為臻入「${plan.targetLabel}」。${spikeNote}${plan.needTribulation ? '天劫滾滾而落，你險死還生，總算渡了過去，壽元隨之大增。' : ''}${coreNote}${nascentNote}${advNote ? '\n' + advNote : ''}`
        ),
        'special'
      );
    } else {
      const hpLoss = Math.round(player.maxHp * (plan.needTribulation ? 0.65 : 0.3));
      const lifeLoss = plan.needTribulation ? 5 + plan.curIndex : 1;
      const karmaAdd = plan.needTribulation ? 5 : 2;
      gameStore.setPlayer((p) => (p ? { ...p, hp: Math.max(0, p.hp - hpLoss), lifespan: Math.max(0, p.lifespan - lifeLoss), exp: Math.round(p.maxExp * 0.7) } : p));
      const nw: FanrenWorldState = { ...world, karma: (world.karma || 0) + karmaAdd };
      persistWorld(nw);
      set({ world: nw });
      const after = useGameStore.getState().player;
      const lethal = !!after && (after.hp <= 0 || (plan.needTribulation && plan.curIndex >= 4 && Math.random() < 0.5) || (nascentUnshielded && Math.random() < 0.35));
      if (lethal) {
        get().die(
          isAscend ? '偷渡空間節點失敗，空間風暴與隔界之力絞碎了元嬰，你永隕於虛空亂流之中'
          : nascentUnshielded ? '結嬰時無護魂之物，沉溺心魔幻象不能自拔，神智盡喪、癲狂入魔而亡'
          : `渡${plan.targetRealm.tribulationName || '天劫'}失敗，雷火加身、形神俱滅`
        );
      } else {
        gameStore.addLog(`${breakPrefixNote ? breakPrefixNote + '\n' : ''}${tribTag}你衝關失敗，${isAscend ? '空間風暴絞碎了大半護身法寶、隔界之力幾欲壓潰元嬰——你險些葬身節點，狼狽退回人界' : nascentUnshielded ? '心魔幻象排山倒海而來，你險些沉溺其中、走火入魔，幸而及時驚醒、強行收功' : plan.needTribulation ? '天劫反噬、五內如焚' : '瓶頸如山難越'}——重傷吐血、修為倒退，壽元亦損約 ${lifeLoss} 載。`, 'danger');
      }
    }
  },

  // 祕法補全靈根：韓立「四靈根·缺金」之姿，可後天以補根祕法（如「歸元補靈訣」）補全所缺之行。
  // 須持補根祕法信物；補全後五行漸全、純度回升，修煉倍率隨之提高（次回合由 cultivationMultFromRoots 重算）。
  completeSpiritualRoot: () => {
    if (get().busy) return;
    const gameStore = useGameStore.getState();
    const player = gameStore.player;
    const world = get().world;
    if (!player || !world.enabled || world.gameOver?.dead) return;
    const ROOT_KEYS = ['metal', 'wood', 'water', 'fire', 'earth'] as const;
    const ROOT_CN: Record<string, string> = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    const roots = (player.spiritualRoots || {}) as Record<string, number>;
    // 找出最缺的一行（值最低者；須顯著低於其餘行才算「缺」）
    const present = ROOT_KEYS.map((k) => roots[k] || 0);
    const maxRoot = Math.max(...present, 1);
    const lacking = ROOT_KEYS.filter((k) => (roots[k] || 0) <= Math.max(8, maxRoot * 0.2));
    if (!lacking.length) {
      gameStore.addLog('你五行俱全、靈根並無顯缺，補根祕法於你無用武之地。', 'normal');
      return;
    }
    const charm = player.inventory.find((i) => /歸元補靈|補靈訣|補根|歸元補根|补灵|补根/.test(i.name));
    if (!charm) {
      const lackCn = lacking.map((k) => ROOT_CN[k]).join('、');
      gameStore.addLog(
        `你欲補全所缺之【${lackCn}】行靈根，然此乃逆奪造化之舉——須得「歸元補靈訣」一類補根祕法方可行之。此等祕法世間罕有，多藏於上古遺府、秘境異寶或老怪傳承之中，你須先尋得，方能重塑靈根。`,
        'normal'
      );
      return;
    }
    // 持祕法：補全最缺之行（升至真靈根之資 ~55），消耗祕法
    const target = lacking[0];
    const fillVal = Math.max(50, Math.round(maxRoot * 0.6));
    gameStore.setPlayer((p) => {
      if (!p) return p;
      const nr = { ...(p.spiritualRoots as Record<string, number>) };
      nr[target] = Math.max(nr[target] || 0, fillVal);
      const inv = p.inventory.map((it) => ({ ...it }));
      const ci = inv.find((it) => it.id === charm.id);
      if (ci) { ci.quantity -= 1; }
      return { ...p, spiritualRoots: nr as any, inventory: inv.filter((it) => it.quantity > 0) };
    });
    const tp = tickDays(world, 360); // 補根閉關約一年
    const nw: FanrenWorldState = { ...world, ...tp };
    persistWorld(nw);
    set({ world: nw });
    gameStore.setPlayer((p) => (p ? { ...p, lifespan: Math.max(0, p.lifespan - 1), gameDays: (p.gameDays || 0) + 360 } : p));
    gameStore.addLog(
      `你依「${charm.name}」之法，閉死關引天地補缺之氣灌注經脈，重塑那殘缺的【${ROOT_CN[target]}】行靈根。痛楚徹骨、九死方成——當靈氣終於在缺脈中流轉自如，你只覺修為根基煥然一新，五行漸全、進境之速遠勝往昔！（${ROOT_CN[target]}行靈根已補全，修煉倍率隨純度提升而增）`,
      'special'
    );
  },
}));
