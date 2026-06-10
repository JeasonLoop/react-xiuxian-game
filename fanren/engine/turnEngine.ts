/** 動態回合引擎：玩家行動 → 輸入治理 → 數值結算 → 時間推進 → 世界演化 → 敘事 → 提醒/記憶。 */
import type {
  FanrenWorldState,
  MemoryEntry,
  NpcReaction,
  TurnChoice,
  TurnResult,
} from '../types';
import { advanceTime, dayToChapter, dayToGameTime, daysForScale } from './clock';
import { parseIntent } from './keywordRouter';
import { govern, violationFeedback } from './governor';
import { AWAKEN_NAMES, regenGoldenFinger, useGoldenFinger } from './goldenFinger';
import { evolveWorld } from './worldEvolution';
import { allLocationNames, allNpcNames, eventsInWindow, getNpc, getRegion, resolveNpcAtDay, spoilerBudget } from './canonLoader';
import { generateRegion, isUnknownDestination } from './worldExpansion';
import { buildReminders, makeMemory, recall } from './reminderRecall';
import { catalyzeHerb, rollExploreLoot, type ItemGrant } from './loot';
import { narrate } from './gmService';

export interface TurnContext {
  world: FanrenWorldState;
  player: {
    name: string;
    realm: string;
    realmType: string; // 純境界（RealmType 列舉值），供戰鬥敵人生成
    exp: number;
    maxExp: number;
    hp: number;
    maxHp: number;
    spiritStones: number;
    lifespan: number;
    luck: number;
    cultivationMult: number; // 由靈根決定的修煉倍率
    inventoryNames: string[];
  };
}

/** 觸發既有回合制戰鬥的請求（由 worldStore 接 openTurnBasedBattle）。 */
export interface BattleTrigger {
  realmMinRealm: string; // 敵人境界（RealmType）
  riskLevel: '低' | '中' | '高' | '极度危险';
  context: string; // 戰鬥緣由（敘事用）
  divergenceEventId?: string; // 若為正史介入戰鬥
}

export interface PlayerDeltas {
  exp?: number;
  hp?: number;
  spiritStones?: number;
  lifespan?: number; // 年
}

export interface TurnOutcome {
  result: TurnResult;
  worldPatch: Partial<FanrenWorldState>;
  playerDeltas: PlayerDeltas;
  newMemory?: MemoryEntry;
  battle?: BattleTrigger; // 若本回合應開啟回合制戰鬥
  itemsGranted?: ItemGrant[]; // 本回合落地到背包的物品
}

function cultivateExpPerDay(maxExp: number, mult: number): number {
  return Math.max(1, (maxExp * 0.0008) * mult);
}

/** 執行一個回合。永不拋錯。 */
export async function runTurn(rawText: string, ctx: TurnContext): Promise<TurnOutcome> {
  const w = ctx.world;
  const oldDay = w.clock.totalDays;
  const intent = parseIntent(rawText, {
    npcNames: allNpcNames(),
    locationNames: allLocationNames(),
    itemNames: ctx.player.inventoryNames,
  });
  const verdict = govern(rawText, intent, w.governorViolations);

  // ── 越權：拒絕 ──
  if (verdict.decision === 'reject') {
    const violations = w.governorViolations + 1;
    const feedback = violationFeedback(verdict, violations);
    const gfRt = w.goldenFingerRuntime && verdict.sanctionKarma
      ? { ...w.goldenFingerRuntime, karma: w.goldenFingerRuntime.karma + verdict.sanctionKarma }
      : w.goldenFingerRuntime;
    const result: TurnResult = {
      narrative: feedback,
      intent,
      verdict,
      daysElapsed: 0,
      worldEventsFired: [],
      npcReactions: [],
      logType: 'danger',
    };
    return { result, worldPatch: { governorViolations: violations, goldenFingerRuntime: gfRt }, playerDeltas: {} };
  }

  // ── 純查詢類（不耗時）──
  if (intent.type === 'inspect') {
    const reminders = buildReminders(w);
    const text = reminders.map((r) => `· ${r.text}`).join('\n');
    return {
      result: { narrative: `【環視四周・打探消息】\n${text}`, intent, verdict, daysElapsed: 0, worldEventsFired: [], npcReactions: [], reminders, logType: 'normal' },
      worldPatch: {},
      playerDeltas: {},
    };
  }
  if (intent.type === 'recall') {
    // 僅以捕獲到的已知人/地名作檢索鍵；否則回顧重點往事
    const q = intent.targets[0];
    return {
      result: { narrative: recall(w.memory, q), intent, verdict, daysElapsed: 0, worldEventsFired: [], npcReactions: [], logType: 'special' },
      worldPatch: {},
      playerDeltas: {},
    };
  }

  // ── 決定耗時 ──
  let days = daysForScale(intent.durationScale, intent.durationDays);
  if (verdict.decision === 'reframe') days = Math.min(days, 7); // 被重構的行動先小步推進

  const playerDeltas: PlayerDeltas = {};
  let mechanical = '';
  let worldPatch: Partial<FanrenWorldState> = {};
  let logType: TurnResult['logType'] = 'normal';
  let newLocationId = w.currentLocationId;
  let gfRuntime = w.goldenFingerRuntime;
  let memoryNote: { summary: string; tags: string[]; important: boolean } | null = null;
  let battle: BattleTrigger | undefined;
  let itemsGranted: ItemGrant[] | undefined;

  const newDay = oldDay + days;

  switch (intent.type) {
    case 'cultivate': {
      const expGain = Math.round(cultivateExpPerDay(ctx.player.maxExp, ctx.player.cultivationMult) * days);
      playerDeltas.exp = expGain;
      playerDeltas.lifespan = -(days / 360);
      mechanical = `你凝神入定，吐納天地靈氣。${days}日苦修，修為精進（修為 +${expGain}）。`;
      memoryNote = { summary: `閉關修煉約${Math.max(1, Math.round(days / 360))}年`, tags: ['修煉', w.currentLocationId], important: days >= 1800 };
      break;
    }
    case 'use_golden_finger': {
      if (!w.goldenFinger || !w.goldenFingerRuntime) {
        mechanical = '你並無可動用的金手指。';
        logType = 'normal';
        break;
      }
      const ur = useGoldenFinger(w.goldenFingerRuntime, w.goldenFinger, newDay);
      gfRuntime = ur.runtime;
      if (!ur.ok) {
        mechanical = ur.reason || '金手指此刻無法發動。';
        logType = 'danger';
      } else {
        const eff = ur.effect!;
        if (eff.hook === 'cultivationRateMult') {
          const burst = Math.round(cultivateExpPerDay(ctx.player.maxExp, ctx.player.cultivationMult) * 30 * eff.magnitude);
          playerDeltas.exp = burst;
          mechanical = `你催動「${w.goldenFinger.name}」，靈氣如百川歸海般湧入經脈，修為暴漲（修為 +${burst}）。`;
        } else if (eff.hook === 'herbMaturation') {
          const stones = Math.round(20 * eff.magnitude * (1 + dayToChapter(newDay) / 200));
          playerDeltas.spiritStones = stones;
          const herb = catalyzeHerb(ctx.player.realmType, eff.magnitude);
          itemsGranted = [herb];
          mechanical = `你以「${w.goldenFinger.name}」催熟靈藥，得「${herb.name}×${herb.quantity}」入袋，餘藥售與坊市得靈石 +${stones}。`;
        } else if (eff.hook === 'luckBonus') {
          mechanical = `「${w.goldenFinger.name}」之力流轉周身，冥冥中氣運攀升，近日諸事似有貴人相助。`;
        } else if (eff.hook === 'appraise') {
          mechanical = `「${w.goldenFinger.name}」開啟，萬物來歷真偽在你眼中纖毫畢現。`;
        } else if (eff.hook === 'craftSuccess') {
          mechanical = `「${w.goldenFinger.name}」加持，你對火候藥理的掌控臻於圓融，成丹率大增。`;
        } else {
          mechanical = `你發動了「${w.goldenFinger.name}」，獨特之力悄然生效。`;
        }
        logType = 'special';
        if (ur.awakened) {
          const nm = AWAKEN_NAMES[Math.min(AWAKEN_NAMES.length, ur.awakenLevel || 1) - 1];
          mechanical += `\n\n✦ 金手指覺醒！「${w.goldenFinger.name}」臻入「${nm}」之境（覺醒第${ur.awakenLevel}階），自此威能更勝往昔。`;
        }
        if (ur.anomaly) {
          mechanical += `\n但業力陡增，引動「系統異常」——金手指暫陷沉寂，須待時日方能復原。`;
          logType = 'danger';
        }
      }
      memoryNote = { summary: `動用金手指「${w.goldenFinger.name}」`, tags: ['金手指'], important: !!ur.anomaly || !!ur.awakened };
      break;
    }
    case 'travel': {
      let target = intent.targets.find((t) => getRegion(t)) || intent.targets[0];
      if (!target) {
        // 從自由文本擷取目的地（即使不在已知地圖）→ 觸發世界擴充
        const m = intent.rawText.match(/(?:前往|趕往|去往|飛往|遁往|前去|去|往)\s*([^\s，。,.！!？?]{2,12})/);
        if (m) target = m[1].replace(/(探索|拜師|一帶|附近|看看|遊歷|歷練|去|的)+$/g, '').trim();
      }
      if (target && isUnknownDestination(target)) {
        const region = getRegion(w.currentLocationId);
        const tier = (region?.tier || 'human') as 'human' | 'spirit' | 'demon' | 'immortal';
        const gen = generateRegion({ fromRegionId: w.currentLocationId, tier, day: newDay, existingCount: w.expandedRegions.length, hint: intent.rawText });
        newLocationId = gen.id;
        worldPatch.expandedRegions = [...w.expandedRegions, gen];
        mechanical = `你循未知之向而行，歷經${days}日跋涉，抵達一處輿圖未載之地——${gen.name}。${gen.description}`;
        logType = 'special';
      } else if (target) {
        newLocationId = getRegion(target)?.id || target;
        const reg = getRegion(newLocationId);
        mechanical = `你動身前往${reg?.name || newLocationId}，${days}日後抵達。${reg?.description || ''}`;
      } else {
        mechanical = `你漫無目的地遊走了${days}日。`;
      }
      memoryNote = { summary: `前往${getRegion(newLocationId)?.name || newLocationId}`, tags: ['行旅', newLocationId], important: false };
      break;
    }
    case 'talk': {
      const npcName = intent.targets.find((t) => getNpc(t));
      if (npcName) {
        const npc = getNpc(npcName)!;
        const rt = w.npcStates[npc.id];
        if (rt && rt.status === 'dead') {
          mechanical = `${npc.name}早已不在人世，你遍尋不見。`;
        } else if (rt && rt.locationId !== w.currentLocationId) {
          const here = getRegion(rt.locationId);
          mechanical = `${npc.name}並不在此處，據聞其人正在${here?.name || rt.locationId}一帶（${resolveNpcAtDay(npc, newDay).activity}）。`;
        } else if (npc.firstChapter > w.progressChapter + 30) {
          mechanical = `你打聽${npcName}，卻無人聽過此名——或許時機未到。`;
        } else {
          worldPatch.npcStates = { ...w.npcStates, [npc.id]: { ...(rt || w.npcStates[npc.id]), knownToPlayer: true } };
          mechanical = `你尋到${npc.name}，與之攀談。${npc.bio.slice(0, 60)}……對方${rt && rt.relationship > 0 ? '態度和善' : '不置可否'}。`;
          memoryNote = { summary: `結識/會晤${npc.name}`, tags: ['人物', npc.name], important: npc.importance !== 'minor' };
        }
      } else {
        mechanical = `你與當地修士寒暄了一番，打探些許消息。`;
      }
      break;
    }
    case 'explore': {
      const stones = Math.round(5 + dayToChapter(newDay) / 50);
      const expGain = Math.round(cultivateExpPerDay(ctx.player.maxExp, 1) * days * 0.3);
      playerDeltas.spiritStones = stones;
      playerDeltas.exp = expGain;
      const tier = getRegion(w.currentLocationId)?.tier || 'human';
      itemsGranted = rollExploreLoot(tier, ctx.player.realmType, ctx.player.luck);
      const lootTxt = itemsGranted.length ? ` 途中尋得：${itemsGranted.map((g) => `${g.name}×${g.quantity}`).join('、')}。` : '';
      mechanical = `你在${getRegion(w.currentLocationId)?.name || '此地'}遊歷查探${days}日，略有所獲（靈石 +${stones}，修為 +${expGain}）。${lootTxt}`;
      memoryNote = { summary: `於${w.currentLocationId}歷練`, tags: ['歷練', w.currentLocationId], important: false };
      break;
    }
    case 'fight': {
      const foe = intent.targets.find((t) => getNpc(t));
      const foeNpc = foe ? getNpc(foe) : undefined;
      const foeRealm = foeNpc ? String(w.npcStates[foeNpc.id]?.realm || ctx.player.realmType) : ctx.player.realmType;
      battle = { realmMinRealm: foeRealm, riskLevel: '中', context: foe ? `與${foe}交手` : '與來犯之敵交手' };
      mechanical = `${foe ? `你向${foe}出手` : '你拔出兵刃，迎向來敵'}，一場惡鬥一觸即發。`;
      logType = 'danger';
      break;
    }
    case 'craft':
    case 'use_item':
    case 'trade': {
      mechanical = `你著手「${intent.rawText}」。此類行動的具體得失，依你的背包、配方與當地行情而定（可於對應介面操作）。`;
      break;
    }
    case 'wait': {
      mechanical = `你按兵不動，靜觀其變，任${days}日悄然流逝。`;
      break;
    }
    default: {
      // freeform / reframe
      mechanical = `${verdict.reframedAs ? '' : ''}你嘗試「${intent.rawText}」。世界依其法則回應你的舉動。`;
    }
  }

  // ── 時間推進 + 世界演化 ──
  const clock = dayToGameTime(newDay);
  const progressChapter = Math.max(w.progressChapter, dayToChapter(newDay));

  // 正史事件互動式介入：短行動且事件正發生於你所在地 → 暫扣住該事件、生成抉擇
  let pendingChoice: TurnChoice | null = null;
  const heldIds = new Set<string>();
  const interactiveScale = intent.durationScale === 'instant' || intent.durationScale === 'short' || intent.durationScale === 'medium';
  if (interactiveScale && !battle) {
    const dueAtLoc = eventsInWindow(oldDay, newDay).filter(
      (e) =>
        e.locationId === newLocationId &&
        e.interventions && e.interventions.length > 0 &&
        e.spoilerLevel <= spoilerBudget(progressChapter) &&
        !w.worldEventStates[e.id]?.fired &&
        !w.worldEventStates[e.id]?.diverged
    );
    if (dueAtLoc.length) {
      const ev = dueAtLoc[0];
      heldIds.add(ev.id);
      pendingChoice = {
        prompt: `【正史節點・${ev.title}】${ev.summary}\n\n此刻你正身處其中——是否介入？`,
        sourceEventId: ev.id,
        options: [
          ...ev.interventions.slice(0, 4).map((iv) => ({ id: iv.id, text: iv.description, hint: iv.minRealm ? `需 ${iv.minRealm}` : undefined })),
          { id: '__observe__', text: '旁觀，任其依正史發生', hint: '不改寫歷史' },
        ],
      };
      mechanical += `\n\n你恰逢一樁正史變局，正身處其中——天機已動，你的抉擇將決定歷史是否轉向。`;
      logType = 'special';
    }
  }

  const evolvingWorld: FanrenWorldState = { ...w, ...worldPatch, currentLocationId: newLocationId, clock, progressChapter };
  const evo = evolveWorld(evolvingWorld, oldDay, newDay, heldIds);

  // 金手指能量回復（若本回合未主動使用，也隨時間回能）
  if (intent.type !== 'use_golden_finger' && w.goldenFinger && gfRuntime) {
    gfRuntime = regenGoldenFinger(gfRuntime, w.goldenFinger, newDay);
  }

  worldPatch = {
    ...worldPatch,
    clock,
    progressChapter,
    currentLocationId: newLocationId,
    npcStates: evo.npcStates,
    worldEventStates: evo.worldEventStates,
    goldenFingerRuntime: gfRuntime,
    pendingChoice,
  };

  // ── 敘事 ──
  const reactions: NpcReaction[] = evo.reactions;
  const visibleFired = evo.firedSummaries; // 已於 evolveWorld 內粗略產生
  const { text } = await narrate({
    world: evolvingWorld,
    intent,
    verdict,
    daysElapsed: days,
    mechanicalOutcome: mechanical,
    firedSummaries: visibleFired,
    reactions,
    playerRealm: ctx.player.realm,
    playerName: ctx.player.name,
  });

  const reminders = buildReminders({ ...evolvingWorld, ...worldPatch });
  const newMemory = memoryNote ? makeMemory(newDay, memoryNote.summary, memoryNote.tags, memoryNote.important) : undefined;

  const result: TurnResult = {
    narrative: text,
    intent,
    verdict,
    daysElapsed: days,
    statDeltas: playerDeltas as Record<string, number>,
    worldEventsFired: evo.firedEventIds,
    npcReactions: reactions,
    reminders,
    logType,
  };
  return { result, worldPatch, playerDeltas, newMemory, battle, itemsGranted };
}
