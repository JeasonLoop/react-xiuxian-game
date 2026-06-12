import React from 'react';
import type { PlayerStats } from '../../types';
import type { FanrenWorldState } from '../types';
import { ORIGINS, DAO_HEARTS, getFortune, getVariantRoot } from '../data/creationOptions';
import { canonRealmDisplay, getRealmIndex, combatPowerFactor } from '../engine/realm';
import { tripleFactor, daoHeartResist, travelSpeedMult, fleeChance, rootPotency } from '../engine/aptitude';
import { cultivationMultFromRoots } from '../worldStore';
import { CULTIVATION_ARTS } from '../../constants/cultivation';

const ART_NAME: Record<string, string> = Object.fromEntries(CULTIVATION_ARTS.map((a) => [a.id, a.name]));
const artName = (id: string) => ART_NAME[id] || id;

const section = 'rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-3';
const h = 'mb-2 text-sm font-semibold text-amber-300';

const ROOT_META: { key: keyof PlayerStats['spiritualRoots']; name: string; color: string }[] = [
  { key: 'metal', name: '金', color: 'bg-yellow-300' },
  { key: 'wood', name: '木', color: 'bg-emerald-400' },
  { key: 'water', name: '水', color: 'bg-sky-400' },
  { key: 'fire', name: '火', color: 'bg-rose-400' },
  { key: 'earth', name: '土', color: 'bg-amber-600' },
];

/** 由五行向量判靈根等第（忠於原著四等）。 */
function rootTier(roots: PlayerStats['spiritualRoots'], variant?: number): string {
  const vals = ROOT_META.map((m) => roots[m.key] || 0);
  const nonZero = vals.filter((v) => v > 0).length;
  const max = Math.max(0, ...vals, variant || 0);
  if ((variant || 0) >= 60) return '變異靈根（異種升華，較五行更純更利）';
  if (nonZero <= 1 && max >= 60) return '天靈根（單一五行最純，進境最速）';
  if (nonZero >= 1 && nonZero <= 3 && max >= 40) return '真靈根（二三屬性，資質上乘）';
  if (nonZero >= 4) return '偽靈根（五行混雜俱弱，凡人逆襲之資）';
  return max > 0 ? '靈根駁雜' : '凡體（無靈根）';
}

const genderLabel = (g?: string) => (g === 'male' ? '男' : g === 'female' ? '女' : '不拘');

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string; tone?: string }> = ({ label, value, hint, tone }) => (
  <div className="flex items-baseline gap-2">
    <span className="w-14 shrink-0 text-zinc-500">{label}</span>
    <span className={`font-semibold ${tone || 'text-zinc-100'}`}>{value}</span>
    {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
  </div>
);

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="h-1.5 flex-1 overflow-hidden rounded bg-zinc-800">
    <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

const CanonCharacterPanel: React.FC<{ world: FanrenWorldState; player: PlayerStats; onClose: () => void }> = ({ world, player, onClose }) => {
  const origin = ORIGINS.find((o) => o.id === world.originId);
  const dao = DAO_HEARTS.find((d) => d.id === world.daoHeartId);
  const fortune = world.fortuneId ? getFortune(world.fortuneId) : undefined;
  const comp = player.comprehension ?? 50;
  const dh = player.daoHeart ?? 50;
  const agi = player.agility ?? 0;
  const creationAlloc = world.creationAllocation;
  const roots = player.spiritualRoots || { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  const variant = player.variantRoot;
  const cultMult = cultivationMultFromRoots(roots, variant?.value || 0);
  const pot = Math.max(rootPotency(roots), variant?.value || 0);
  const realmIdx = getRealmIndex(world, player.realm);
  const power = combatPowerFactor(realmIdx, world.canonSubStage || 0, player.realmLevel || 1);
  const techniques = world.techniques || [];
  const expPct = Math.round((player.exp / Math.max(1, player.maxExp)) * 100);
  const hpPct = Math.round((player.hp / Math.max(1, player.maxHp)) * 100);

  const combat: { key: 'attack' | 'defense' | 'spirit' | 'physique' | 'speed'; label: string; v: number; hint: string }[] = [
    { key: 'attack', label: '攻擊', v: player.attack, hint: '近戰威能；與神識比決定遠/近取向' },
    { key: 'spirit', label: '神識', v: player.spirit, hint: '術法威能・戰鬥先機・感知傳音' },
    { key: 'defense', label: '防禦', v: player.defense, hint: '減傷（主要作用於遭遇戰結算）' },
    { key: 'physique', label: '體魄', v: player.physique, hint: '壯氣血上限、近戰扛傷' },
    { key: 'speed', label: '速度', v: player.speed, hint: '出手快慢（旅行/逃離見「遁速」）' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4" onClick={onClose}>
      <div className="my-4 w-full max-w-3xl space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-300">👤 角色 · 身與道</h2>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-amber-500">關閉</button>
        </div>

        {/* 1) 名牌 */}
        <div className={section}>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-bold text-amber-200">{player.name}</span>
            <span className="text-sm text-zinc-300">{canonRealmDisplay(world, player.realm, player.realmLevel)}</span>
            {fortune && <span className={`text-xs ${fortune.accent}`}>天命・{fortune.name}</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-3">
            <Stat label="出身" value={origin?.name || '（未知）'} />
            <Stat label="道心" value={dao?.name || '（未定）'} />
            <Stat label="性別" value={genderLabel(world.gender)} />
            {world.age != null && <Stat label="入道齡" value={`${world.age} 歲`} />}
            <Stat label="壽元" value={`${Math.floor(player.lifespan)} / ${player.maxLifespan} 年`} tone="text-emerald-300" />
            <Stat label="靈石" value={player.spiritStones} tone="text-amber-200" />
          </div>
        </div>

        {/* 2) 稟性·根骨 */}
        <div className={section}>
          <div className={h}>稟性 · 根骨</div>
          <div className="grid grid-cols-1 gap-1.5 text-sm md:grid-cols-3">
            <Stat label="悟性" value={comp} tone="text-[#9fdcc4]" hint={`修煉/領悟 ×${tripleFactor(comp).toFixed(2)}`} />
            <Stat label="心性" value={dh} tone="text-[#9fdcc4]" hint={`抗心魔/走火 −${Math.round(daoHeartResist(dh) * 100)}%`} />
            <Stat label="速度稟賦" value={agi} tone="text-[#9fdcc4]" hint={agi > 0 ? `旅行 ×${travelSpeedMult(agi).toFixed(1)}・逃離 ${Math.round(fleeChance(agi, player.luck || 0) * 100)}%` : '尋常腳程'} />
          </div>
          <div className="mt-1 text-[10px] text-zinc-600">悟性主修煉與突破效率；心性鎮壓心魔、渡劫定力；速度稟賦決定遁速與逃殺。</div>
        </div>

        {/* 3) 靈根明細 */}
        <div className={section}>
          <div className={h}>靈根 · 資質</div>
          <div className="space-y-1.5">
            {ROOT_META.map((m) => (
              <div key={m.key} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-zinc-400">{m.name}</span>
                <Bar pct={roots[m.key] || 0} color={m.color} />
                <span className="w-7 text-right text-zinc-500">{roots[m.key] || 0}</span>
              </div>
            ))}
          </div>
          {variant && (
            <div className="mt-2 text-sm">
              <span className="text-zinc-500">異靈根：</span>
              <span className="text-violet-300">{getVariantRoot(variant.type)?.label || `${variant.type}靈根`}</span>
              <span className="ml-1 text-[10px] text-zinc-600">（強度 {variant.value}，較五行更純更利）</span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-400">{rootTier(roots, variant?.value)}</span>
            <span className="text-zinc-500">資質強度 <span className="text-amber-200">{pot}</span></span>
            <span className="text-zinc-500">修煉倍率 <span className="text-emerald-300">×{cultMult.toFixed(2)}</span></span>
          </div>
        </div>

        {/* 4) 戰力·五屬 */}
        <div className={section}>
          <div className={h}>戰力 · 五屬</div>
          <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm md:grid-cols-3">
            {combat.map((c) => (
              <Stat
                key={c.label}
                label={c.label}
                value={Math.round(c.v)}
                hint={`${creationAlloc ? `創角投入 ${creationAlloc[c.key]} 點；` : ''}${c.hint}`}
              />
            ))}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2"><span className="w-10 text-zinc-500">氣血</span><Bar pct={hpPct} color="bg-rose-500" /><span className="w-20 text-right text-zinc-500">{Math.floor(player.hp)}/{player.maxHp}</span></div>
            <div className="flex items-center gap-2"><span className="w-10 text-zinc-500">修為</span><Bar pct={expPct} color="bg-amber-400" /><span className="w-20 text-right text-zinc-500">{expPct}%</span></div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-600">
            面板數字是「境界基礎值 × 稟賦換算」後的實際戰力，不等同創角投入點。
            概略戰力階 ≈ {power >= 1e6 ? power.toExponential(1) : Math.round(power).toLocaleString()}（境界為主，子境與稟賦為輔；跨大境界呈指數輾壓）。
          </div>
        </div>

        {/* 5) 功法 */}
        <div className={section}>
          <div className={h}>功法 · 傳承</div>
          {techniques.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {techniques.map((t) => (
                <span key={t.id} className="rounded-lg border border-indigo-700/50 bg-indigo-950/30 px-2 py-0.5 text-xs text-indigo-200">{t.name}<span className="ml-1 text-[10px] text-indigo-400/70">第{t.level}層</span></span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500">尚未習得具名功法——可往「🛠️ 百藝・功法」修習，或拜入宗門得傳承。</div>
          )}
          {player.cultivationArts && player.cultivationArts.length > 0 && (
            <div className="mt-2 text-[10px] text-zinc-600">啟蒙心法：{player.cultivationArts.map(artName).join('、')}</div>
          )}
        </div>

        {/* 6) 宗門身分 */}
        {world.sect && (
          <div className={section}>
            <div className={h}>宗門 · 身分</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-3">
              <Stat label="宗門" value={world.sect.sectName} />
              <Stat label="貢獻" value={world.sect.contribution} tone="text-amber-200" />
              {world.sect.masterName && <Stat label="師承" value={world.sect.masterName} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanonCharacterPanel;
