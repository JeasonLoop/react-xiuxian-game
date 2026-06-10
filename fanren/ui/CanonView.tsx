import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayer, useLogs } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../worldStore';
import ChroniclePanel from './ChroniclePanel';
import CreatePanel from './CreatePanel';
import MapPanel from './MapPanel';
import { formatTime } from '../engine/clock';
import { buildReminders } from '../engine/reminderRecall';
import { getRegion } from '../engine/canonLoader';

const logColor: Record<string, string> = {
  normal: 'text-zinc-300',
  gain: 'text-emerald-300',
  danger: 'text-rose-300',
  special: 'text-amber-300',
};

const QUICK = [
  { label: '閉關修煉十年', text: '閉關修煉十年' },
  { label: '外出歷練', text: '外出歷練查探一番' },
  { label: '查看天下動向', text: '查看天下動向與四周' },
  { label: '回憶往事', text: '回憶我過去發生過什麼' },
  { label: '動用金手指', text: '發動我的金手指' },
];

// 系統工具列：開啟既有功能模態框（背包/角色/煉丹/洞府…）
const SYSTEM_TABS: { key: string; label: string; icon: string }[] = [
  { key: 'isCharacterOpen', label: '角色', icon: '👤' },
  { key: 'isInventoryOpen', label: '背包', icon: '🎒' },
  { key: 'isCultivationOpen', label: '功法', icon: '📖' },
  { key: 'isAlchemyOpen', label: '煉丹', icon: '⚗️' },
  { key: 'isGrottoOpen', label: '洞府', icon: '🏔️' },
  { key: 'isSectOpen', label: '宗門', icon: '🏛️' },
  { key: 'isPetOpen', label: '靈寵', icon: '🐉' },
  { key: 'isRealmOpen', label: '境界', icon: '🌌' },
  { key: 'isAchievementOpen', label: '成就', icon: '🏆' },
  { key: 'isSettingsOpen', label: '設定', icon: '⚙️' },
];

const CanonView: React.FC = () => {
  const player = usePlayer();
  const logs = useLogs();
  const world = useWorldStore((s) => s.world);
  const busy = useWorldStore((s) => s.busy);
  const submitAction = useWorldStore((s) => s.submitAction);
  const resolveChoice = useWorldStore((s) => s.resolveChoice);
  const onKill = useWorldStore((s) => s.onKill);
  const setModal = useUIStore((s) => s.setModal);
  const [input, setInput] = useState('');
  const [showChronicle, setShowChronicle] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const pendingChoice = world.pendingChoice;

  const reminders = useMemo(() => buildReminders(world), [world]);
  const region = getRegion(world.currentLocationId);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  // 戰鬥擊殺自動觸發 on:'kill' 異能（吞噬/吸取）
  const killCount = player?.statistics?.killCount ?? 0;
  const prevKillRef = useRef(killCount);
  useEffect(() => {
    if (killCount > prevKillRef.current) onKill();
    prevKillRef.current = killCount;
  }, [killCount, onKill]);

  if (!player) return null;

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput('');
    void submitAction(t);
  };

  const expPct = Math.min(100, Math.round((player.exp / Math.max(1, player.maxExp)) * 100));
  const gf = world.goldenFinger;
  const gfRt = world.goldenFingerRuntime;
  const gfPct = gf && gfRt ? Math.round((gfRt.energy / gf.energyMax) * 100) : 0;

  return (
    <>
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-6xl px-3 py-4">
        {/* 頂部狀態列 */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-amber-900/40 bg-zinc-900/70 px-4 py-2 text-sm">
          <span className="font-semibold text-amber-300">{player.name}</span>
          <span className="text-zinc-300">{player.realm}{player.realmLevel}層</span>
          <span className="text-amber-200/80">{formatTime(world.clock)}</span>
          <span className="text-zinc-400">📍 {region?.name || world.currentLocationId}</span>
          <span className="text-emerald-300/90">壽元 {Math.floor(player.lifespan)}/{player.maxLifespan}</span>
          <span className="ml-auto text-zinc-400">靈石 {player.spiritStones}</span>
        </div>

        {/* 系統工具列：開啟既有功能（背包/角色/煉丹/洞府/宗門…） */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setShowChronicle(true)}
            className="rounded-lg border border-amber-700/60 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-200 transition hover:border-amber-400"
          >
            📜 史冊
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-rose-700/60 bg-rose-950/30 px-2.5 py-1 text-xs text-rose-200 transition hover:border-rose-400"
          >
            ✦ 自創
          </button>
          <button
            onClick={() => setShowMap(true)}
            className="rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-2.5 py-1 text-xs text-emerald-200 transition hover:border-emerald-400"
          >
            🗺️ 地圖
          </button>
          {SYSTEM_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setModal(t.key as any, true)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-amber-500 hover:text-amber-200"
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* 左：敘事 + 輸入 */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="h-[58vh] overflow-y-auto rounded-xl border border-zinc-800 bg-black/40 p-4 leading-relaxed">
              {logs.length === 0 && <div className="text-zinc-500">你的仙途自此展開……輸入你的行動，或點選下方快捷。</div>}
              {logs.map((l) => (
                <p key={l.id} className={`mb-3 whitespace-pre-wrap ${logColor[l.type] || 'text-zinc-300'}`}>
                  {l.text}
                </p>
              ))}
              {busy && <p className="animate-pulse text-amber-400/70">（天機演算中……）</p>}
              <div ref={logEndRef} />
            </div>

            {/* 正史節點・介入抉擇 */}
            {pendingChoice && (
              <div className="mt-2 rounded-xl border border-amber-500/70 bg-amber-950/40 p-3 shadow-lg shadow-amber-900/20">
                <div className="mb-2 whitespace-pre-wrap text-sm text-amber-100">{pendingChoice.prompt}</div>
                <div className="flex flex-col gap-1.5">
                  {pendingChoice.options.map((o) => (
                    <button
                      key={o.id}
                      disabled={busy}
                      onClick={() => resolveChoice(o.id)}
                      className="rounded-lg border border-amber-700/60 bg-zinc-900/70 px-3 py-2 text-left text-sm text-amber-100 transition hover:border-amber-400 disabled:opacity-50"
                    >
                      ▸ {o.text}
                      {o.hint ? <span className="ml-2 text-xs text-zinc-400">（{o.hint}）</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 快捷行動 */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  disabled={busy || !!pendingChoice}
                  onClick={() => submit(q.text)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 py-1.5 text-xs text-zinc-200 transition hover:border-amber-500 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* 輸入列 */}
            <div className="mt-2 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(input); }}
                disabled={busy || !!pendingChoice}
                placeholder={pendingChoice ? '請先就上方正史節點做出抉擇……' : '輸入你的行動……（例：前往黃楓谷拜師 / 用背包中的丹藥修煉 / 與南宮婉結交 / 出手攻擊邪修）'}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <button
                disabled={busy || !input.trim() || !!pendingChoice}
                onClick={() => submit(input)}
                className="rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                行動
              </button>
            </div>
          </div>

          {/* 右：狀態 / 提醒 / 金手指 */}
          <div className="space-y-3">
            {/* 修為 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>修為</span><span>{expPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
                <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${expPct}%` }} />
              </div>
              {expPct >= 100 && <div className="mt-1 text-xs text-amber-300">修為已滿，可尋機突破境界。</div>}
            </div>

            {/* 金手指 */}
            {gf && gfRt && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
                <div className="mb-0.5 text-sm font-semibold text-amber-300">金手指 · {gf.name}</div>
                <div className="mb-1 text-xs text-cyan-300/80">
                  {gfRt.awakenLevel ? `✦ 覺醒第${gfRt.awakenLevel}階（威能+${gfRt.awakenLevel * 30}%）` : '尚未覺醒'} · 已動用 {gfRt.usesTotal} 次
                </div>
                <div className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>能量</span><span>{Math.floor(gfRt.energy)}/{gf.energyMax}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300" style={{ width: `${gfPct}%` }} />
                </div>
                <div className="mt-1 text-xs text-zinc-400">業力 {Math.floor(gfRt.karma)}/60 {gfRt.suppressedUntilDay && world.clock.totalDays < gfRt.suppressedUntilDay ? '· ⚠ 異常維修中' : ''}</div>
                <button disabled={busy} onClick={() => submit('發動金手指')} className="mt-2 w-full rounded-lg border border-cyan-700/60 bg-cyan-900/30 py-1.5 text-xs text-cyan-200 hover:border-cyan-400 disabled:opacity-50">
                  發動
                </button>
              </div>
            )}

            {/* 世界提醒 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="mb-2 text-sm font-semibold text-amber-300">📜 天機提醒</div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                {reminders.map((r, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span>{r.kind === 'opportunity' ? '✦' : r.kind === 'npc_nearby' ? '👤' : r.kind === 'danger' ? '⚠' : r.kind === 'world_event' ? '🌐' : '·'}</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
              提示：世界依正史自然流轉。你可改寫命運，但無法憑空成神。閉關會跳過漫長歲月，期間天下大事照常發生。
            </div>
          </div>
        </div>
      </div>
    </div>
    {showChronicle && <ChroniclePanel world={world} player={player} onClose={() => setShowChronicle(false)} />}
    {showCreate && <CreatePanel onClose={() => setShowCreate(false)} />}
    {showMap && <MapPanel onClose={() => setShowMap(false)} onTravel={(nm) => submitAction(`前往${nm}`)} />}
    </>
  );
};

export default CanonView;
