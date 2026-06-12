import React, { useMemo, useState } from 'react';
import type { CharacterCreation, GoldenFinger, AttrAllocation } from '../types';
import { ORIGINS, DAO_HEARTS, FORTUNE_TIERS, getFortune, VARIANT_ROOTS, getVariantRoot } from '../data/creationOptions';
import { GOLDEN_FINGER_ARCHETYPES } from '../data/goldenFingerArchetypes';
import { parseGoldenFinger } from '../engine/goldenFinger';
import { extrapolateMechanicSync } from '../engine/extrapolate';
import { passiveStatBonus } from '../engine/mechanics';
import { getCanonStartingStatPreview } from '../engine/charBuild';
import { cultivationMultFromRoots } from '../worldStore';
import { comprehensionMult } from '../engine/aptitude';
import { SealMark } from './Brand';

// 屬性標籤配色
const ATTR_STYLE: Record<string, string> = {
  金: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  木: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  水: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  火: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  土: 'border-yellow-700/40 bg-yellow-700/10 text-yellow-200',
};

interface Props {
  onComplete: (creation: CharacterCreation) => void;
  onBack: () => void;
}

const card = 'rounded-xl border border-amber-900/40 bg-zinc-900/60 p-4';
const label = 'text-amber-300/90 font-semibold mb-2 text-sm';
const chip = (active: boolean) =>
  `cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
    active ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-amber-600'
  }`;

const ZERO_ALLOC: AttrAllocation = {
  roots: { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 },
  variantType: '', variantValue: 0,
  comprehension: 0, daoHeart: 0, attack: 0, defense: 0, spirit: 0, physique: 0, speed: 0,
};

function spentOf(a: AttrAllocation): number {
  return a.roots.metal + a.roots.wood + a.roots.water + a.roots.fire + a.roots.earth + (a.variantValue || 0)
    + a.comprehension + a.daoHeart + a.attack + a.defense + a.spirit + a.physique + a.speed;
}

const ROOT_KEYS: { key: keyof AttrAllocation['roots']; cn: string }[] = [
  { key: 'metal', cn: '金' }, { key: 'wood', cn: '木' }, { key: 'water', cn: '水' }, { key: 'fire', cn: '火' }, { key: 'earth', cn: '土' },
];
const COMBAT_KEYS: { key: 'attack' | 'defense' | 'spirit' | 'physique' | 'speed'; cn: string; hint: string }[] = [
  { key: 'attack', cn: '攻擊', hint: '近身與法術攻擊' },
  { key: 'defense', cn: '防禦', hint: '減傷與護體' },
  { key: 'spirit', cn: '神識', hint: '術法威能・感知（受靈根悟性加成）' },
  { key: 'physique', cn: '體魄', hint: '氣血上限與肉身強度' },
  { key: 'speed', cn: '速度', hint: '出手先後・遁速・閃避' },
];

const CanonCreation: React.FC<Props> = ({ onComplete, onBack }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unset'>('unset');
  const [age, setAge] = useState(16);
  const [appearance, setAppearance] = useState('');
  const [originId, setOriginId] = useState(ORIGINS[0]?.id || '');
  const [fortuneId, setFortuneId] = useState('gifted');
  const [alloc, setAlloc] = useState<AttrAllocation>(ZERO_ALLOC);
  const [daoId, setDaoId] = useState(DAO_HEARTS[0]?.id || '');
  const [gfText, setGfText] = useState('');
  const [abilityText, setAbilityText] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const abilityPreview = useMemo(
    () => (abilityText.trim().length >= 4 ? extrapolateMechanicSync(abilityText, 'ability', 'born') : null),
    [abilityText]
  );

  const origin = ORIGINS.find((o) => o.id === originId);
  const fortune = getFortune(fortuneId) || FORTUNE_TIERS[0];
  const pool = fortune.points;
  const spent = spentOf(alloc);
  const remaining = pool - spent;

  // 靈根即時判定與倍率（含變異靈根）
  const roots = alloc.roots;
  const variantVal = alloc.variantValue || 0;
  const rootVals = [roots.metal, roots.wood, roots.water, roots.fire, roots.earth, variantVal];
  const maxRoot = Math.max(...rootVals);
  const nonZero = rootVals.filter((v) => v > 5).length;
  const variantDominant = variantVal > 5 && variantVal >= maxRoot;
  const rootTierLabel = maxRoot === 0 ? '凡體・無靈根（無法修仙）'
    : variantDominant && nonZero <= 1 ? `變異靈根・${alloc.variantType}（異靈根，最純最利）`
    : nonZero <= 1 && maxRoot >= 80 ? '天靈根・單一極純'
    : nonZero <= 1 ? '單一靈根'
    : nonZero <= 3 ? `真靈根・${nonZero} 屬`
    : `偽靈根・${nonZero} 屬混雜`;
  const cultMult = cultivationMultFromRoots(roots, variantVal);
  const compF = comprehensionMult(alloc.comprehension);

  const changeFortune = (id: string) => {
    setFortuneId(id);
    const np = getFortune(id)?.points ?? 0;
    if (spentOf(alloc) > np) setAlloc(ZERO_ALLOC); // 點數變少且超支 → 重置重分
  };

  const adjFlat = (key: 'comprehension' | 'daoHeart' | 'attack' | 'defense' | 'spirit' | 'physique' | 'speed', delta: number) => {
    setAlloc((a) => {
      const cur = a[key];
      const next = Math.max(0, Math.min(100, cur + delta));
      const rd = next - cur;
      if (rd > 0 && rd > pool - spentOf(a)) return a;
      return { ...a, [key]: next };
    });
  };
  const adjRoot = (el: keyof AttrAllocation['roots'], delta: number) => {
    setAlloc((a) => {
      const cur = a.roots[el];
      const next = Math.max(0, Math.min(100, cur + delta));
      const rd = next - cur;
      if (rd > 0 && rd > pool - spentOf(a)) return a;
      return { ...a, roots: { ...a.roots, [el]: next } };
    });
  };
  const setVariant = (type: string) => {
    setAlloc((a) => {
      const next = a.variantType === type ? '' : type;
      return next === '' ? { ...a, variantType: '', variantValue: 0 } : { ...a, variantType: next };
    });
  };
  const adjVariant = (delta: number) => {
    setAlloc((a) => {
      if (!a.variantType) return a;
      const cur = a.variantValue || 0;
      const next = Math.max(0, Math.min(100, cur + delta));
      const rd = next - cur;
      if (rd > 0 && rd > pool - spentOf(a)) return a;
      return { ...a, variantValue: next };
    });
  };

  const gfPreview: GoldenFinger | null = useMemo(
    () => (gfText.trim().length >= 4 ? parseGoldenFinger(gfText, name) : null),
    [gfText, name]
  );

  const startingPreview = useMemo(() => {
    const creation: CharacterCreation = {
      name: name.trim() || '無名修士',
      appearance: { gender, age, descriptors: [], freeText: appearance.trim() || undefined },
      originId,
      fortuneId,
      allocation: alloc,
      daoHeartId: daoId,
      startingArtIds: origin?.startingArtIds || [],
      startingItemRefs: origin?.startingItemRefs || [],
      goldenFinger: gfPreview,
      abilityText: abilityText.trim() || undefined,
      difficulty,
    };
    const passive = abilityPreview ? passiveStatBonus(abilityPreview) : {};
    return getCanonStartingStatPreview(creation, passive);
  }, [name, gender, age, appearance, originId, fortuneId, alloc, daoId, origin, gfPreview, abilityText, difficulty, abilityPreview]);

  const canStart = name.trim().length >= 1 && !!origin && remaining >= 0;

  const handleStart = () => {
    if (!canStart) return;
    const creation: CharacterCreation = {
      name: name.trim(),
      appearance: { gender, age, descriptors: [], freeText: appearance.trim() || undefined },
      originId,
      fortuneId,
      allocation: alloc,
      daoHeartId: daoId,
      startingArtIds: origin?.startingArtIds || [],
      startingItemRefs: origin?.startingItemRefs || [],
      goldenFinger: gfPreview,
      abilityText: abilityText.trim() || undefined,
      difficulty,
    };
    onComplete(creation);
  };

  // 加減點列
  const StepRow = ({ cn, value, onMinus, onPlus, colorCls, hint, previewValue }: { cn: string; value: number; onMinus: (d: number) => void; onPlus: (d: number) => void; colorCls?: string; hint?: string; previewValue?: number }) => (
    <div className="flex items-center gap-1.5 py-1">
      <span className={`w-16 shrink-0 rounded border px-1 text-center text-xs ${colorCls || 'border-zinc-600/40 bg-zinc-700/20 text-zinc-200'}`}>{cn}</span>
      <button onClick={() => onMinus(100)} disabled={value <= 0} className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-400 disabled:opacity-30" title="清空">清</button>
      <button onClick={() => onMinus(10)} disabled={value <= 0} className="rounded border border-zinc-700 px-1.5 text-xs text-zinc-300 disabled:opacity-30">−10</button>
      <button onClick={() => onMinus(1)} disabled={value <= 0} className="rounded border border-zinc-700 px-1.5 text-xs text-zinc-300 disabled:opacity-30">−</button>
      <div className="relative h-2 flex-1 overflow-hidden rounded bg-zinc-800">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-700 to-amber-400" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-xs text-amber-200">{value}</span>
      {previewValue !== undefined && <span className="w-20 shrink-0 text-right text-[11px] text-rose-200">→ 開局 {Math.round(previewValue)}</span>}
      <button onClick={() => onPlus(1)} disabled={remaining <= 0 || value >= 100} className="rounded border border-zinc-700 px-1.5 text-xs text-zinc-300 disabled:opacity-30">＋</button>
      <button onClick={() => onPlus(10)} disabled={remaining <= 0 || value >= 100} className="rounded border border-zinc-700 px-1.5 text-xs text-zinc-300 disabled:opacity-30">＋10</button>
      <button onClick={() => onPlus(100)} disabled={remaining <= 0 || value >= 100} className="rounded border border-amber-700/60 px-1 text-[10px] text-amber-300/90 disabled:opacity-30" title="盡量拉滿">滿</button>
      {hint && <span className="ml-1 hidden w-36 shrink-0 text-[10px] text-zinc-500 lg:block">{hint}</span>}
    </div>
  );

  return (
    <div className="h-screen w-full overflow-y-auto ink-wash text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SealMark size={40} />
            <h1 className="brand-serif text-2xl font-bold tracking-wide text-[#9fdcc4]">凡人修仙編年史 · 開局創角</h1>
          </div>
          <button onClick={onBack} className="text-sm text-zinc-400 hover:text-[#9fdcc4]">← 返回</button>
        </div>
        <p className="mb-5 text-sm text-zinc-400">
          世界依《凡人修仙傳》正史自然演化。你的每個抉擇都可能改寫某人的命運，但你無法憑空成神——一切力量皆有代價。
        </p>

        <div className="space-y-4">
          {/* 道號 + 外貌 */}
          <div className={card}>
            <div className={label}>道號與外貌</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入你的道號（如：韓某、葉凡…）"
              className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            <div className="mb-3 flex gap-2">
              {(['male', 'female', 'unset'] as const).map((g) => (
                <div key={g} className={chip(gender === g)} onClick={() => setGender(g)}>
                  {g === 'male' ? '男' : g === 'female' ? '女' : '不拘'}
                </div>
              ))}
              <div className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
                初始年齡
                <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(Number(e.target.value) || 16)} className="w-16 rounded border border-zinc-700 bg-zinc-800 px-2 py-1" />
              </div>
            </div>
            <input
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="外貌描述（選填，如：面容普通、雙目卻有神…）"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* 出身 */}
          <div className={card}>
            <div className={label}>出身（決定起點地域、境界、資源與機緣）</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ORIGINS.map((o) => (
                <div key={o.id} className={chip(originId === o.id)} onClick={() => setOriginId(o.id)}>
                  <div className="font-semibold">{o.name} <span className="text-xs text-amber-400/80">難度{o.difficulty}</span></div>
                  <div className="mt-1 text-xs text-zinc-400 line-clamp-2">{o.description}</div>
                </div>
              ))}
            </div>
            {origin && (
              <div className="mt-2 text-xs text-zinc-400">
                起於【{origin.startRegionId}】· {String(origin.startRealm)}{origin.startRealmLevel}層 · 靈石{origin.spiritStones}
              </div>
            )}
          </div>

          {/* 天命等級 + 點數分配 */}
          <div className={card}>
            <div className={label}>天命・稟賦（選天命等級得點數，自由分配於靈根/悟性/心性/戰鬥）</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {FORTUNE_TIERS.map((f) => (
                <div key={f.id} className={chip(fortuneId === f.id)} onClick={() => changeFortune(f.id)}>
                  <div className={`text-sm font-semibold ${f.accent}`}>{f.name}</div>
                  <div className="text-[11px] text-amber-300/80">{f.points} 點</div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 text-[11px] text-zinc-500">{fortune.desc}</div>

            {/* 剩餘點數 */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-1.5">
              <span className="text-sm text-zinc-300">剩餘點數</span>
              <span className={`text-lg font-bold ${remaining < 0 ? 'text-rose-400' : 'text-amber-300'}`}>{remaining} <span className="text-xs text-zinc-500">/ {pool}</span></span>
              <button onClick={() => setAlloc(ZERO_ALLOC)} className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-amber-600">重置</button>
            </div>

            {/* 五行靈根 */}
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-emerald-300">五行靈根（屬性越少越純，修煉越快）</span>
                <span className="text-[11px] text-zinc-400">{rootTierLabel}　<span className="text-amber-400/80">修煉 ×{cultMult.toFixed(1)}</span></span>
              </div>
              {ROOT_KEYS.map((r) => (
                <StepRow key={r.key} cn={r.cn} value={roots[r.key]} colorCls={ATTR_STYLE[r.cn]} onMinus={(d) => adjRoot(r.key, -d)} onPlus={(d) => adjRoot(r.key, d)} />
              ))}
            </div>

            {/* 變異靈根（異靈根） */}
            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-violet-300">變異靈根・異靈根（萬中無一，較五行更純更利；擇一加點）</div>
              <div className="mb-1.5 flex flex-wrap gap-1">
                <button onClick={() => setVariant('')} className={`rounded border px-2 py-0.5 text-[11px] transition ${!alloc.variantType ? 'border-violet-400 bg-violet-500/20 text-violet-100' : 'border-zinc-700 text-zinc-400 hover:border-violet-600'}`}>無</button>
                {VARIANT_ROOTS.map((v) => (
                  <button key={v.type} onClick={() => setVariant(v.type)} title={v.desc} className={`rounded border px-2 py-0.5 text-[11px] transition ${alloc.variantType === v.type ? 'border-violet-400 bg-violet-500/20 text-violet-100' : 'border-zinc-700 text-zinc-300 hover:border-violet-600'}`}>{v.label}</button>
                ))}
              </div>
              {alloc.variantType
                ? <StepRow cn={getVariantRoot(alloc.variantType)?.label || alloc.variantType} value={alloc.variantValue || 0} colorCls="border-violet-500/40 bg-violet-500/10 text-violet-200" onMinus={(d) => adjVariant(-d)} onPlus={(d) => adjVariant(d)} hint={getVariantRoot(alloc.variantType)?.desc} />
                : <div className="text-[10px] text-zinc-600">擇一異靈根後可加點。異靈根計入靈根純度，純異靈根進境猶勝天靈根，並增益神識術法。</div>}
            </div>

            {/* 稟賦 */}
            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-sky-300">稟賦・悟性與心性（拉滿約 3 倍加成）</div>
              <StepRow cn="悟性" value={alloc.comprehension} onMinus={(d) => adjFlat('comprehension', -d)} onPlus={(d) => adjFlat('comprehension', d)} hint={`修煉/學習/突破 ×${compF.toFixed(2)}`} />
              <StepRow cn="心性" value={alloc.daoHeart} onMinus={(d) => adjFlat('daoHeart', -d)} onPlus={(d) => adjFlat('daoHeart', d)} hint="心魔・走火入魔・渡劫定力" />
            </div>

            {/* 戰鬥五屬 */}
            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-rose-300">戰鬥稟賦點（0–100 為投入點；「開局」是進入角色面板後的實際值）</div>
              {COMBAT_KEYS.map((c) => (
                <StepRow
                  key={c.key}
                  cn={c.cn}
                  value={alloc[c.key]}
                  previewValue={startingPreview[c.key]}
                  onMinus={(d) => adjFlat(c.key, -d)}
                  onPlus={(d) => adjFlat(c.key, d)}
                  hint={c.hint}
                />
              ))}
              <div className="mt-1.5 rounded-lg border border-rose-900/30 bg-rose-950/10 px-3 py-1.5 text-[11px] text-zinc-400">
                進遊戲實值：攻擊 <span className="text-rose-200">{Math.round(startingPreview.attack)}</span>・
                防禦 <span className="text-rose-200">{Math.round(startingPreview.defense)}</span>・
                神識 <span className="text-rose-200">{Math.round(startingPreview.spirit)}</span>・
                體魄 <span className="text-rose-200">{Math.round(startingPreview.physique)}</span>・
                速度 <span className="text-rose-200">{Math.round(startingPreview.speed)}</span>・
                氣血 <span className="text-rose-200">{Math.round(startingPreview.hp)}/{Math.round(startingPreview.maxHp)}</span>
                {abilityPreview && <span className="ml-1 text-violet-300/80">（已含天生異能被動）</span>}
              </div>
            </div>
            {maxRoot === 0 && <div className="mt-2 text-[11px] text-rose-300/80">※ 未分配靈根則無法修仙，僅能以凡夫之軀苟活——除非你另有奇遇。</div>}
          </div>

          {/* 道心 */}
          <div className={card}>
            <div className={label}>道心</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DAO_HEARTS.map((d) => (
                <div key={d.id} className={chip(daoId === d.id)} onClick={() => setDaoId(d.id)}>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-zinc-400 line-clamp-2">{d.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 金手指 */}
          <div className={card}>
            <div className={label}>自定義金手指（你的本命外掛 — 用文字描述，系統會凝練並平衡它）</div>
            <textarea
              value={gfText}
              onChange={(e) => setGfText(e.target.value)}
              rows={3}
              placeholder="例：我撿到一個神秘小綠瓶，能催熟靈藥藥草……（描述越克制、越具體，效率越好；越誇大則代價越高、限制越多）"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {GOLDEN_FINGER_ARCHETYPES.slice(0, 6).map((a) => (
                <button key={a.id} onClick={() => setGfText(a.rawText || a.description)} className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs text-zinc-300 hover:border-amber-600">
                  範本：{a.name}
                </button>
              ))}
            </div>
            {gfPreview && (
              <div className="mt-3 rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-xs">
                <div className="font-semibold text-amber-300">「{gfPreview.name}」 · {gfPreview.category} · 強度階 {gfPreview.powerTier}/5</div>
                <div className="mt-1 text-zinc-300">{gfPreview.description}</div>
                <div className="mt-1 text-zinc-400">能量 {gfPreview.energyMax}（每日回{gfPreview.energyRegenPerDay}，每次耗{gfPreview.energyCostPerUse}）· 每次業力+{gfPreview.karmaPerUse}</div>
                <div className="mt-1 text-rose-300/80">限制：{gfPreview.limits.join('；')}</div>
                <div className="text-rose-300/60">盲區：{gfPreview.blindSpots.join('；')}</div>
              </div>
            )}
          </div>

          {/* 天生異能 */}
          <div className={card}>
            <div className={label}>天生異能 / 特殊體質（選填 — 用文字描述，系統會「演繹」成可執行的遊戲機制）</div>
            <textarea
              value={abilityText}
              onChange={(e) => setAbilityText(e.target.value)}
              rows={2}
              placeholder="例：我有種能吞噬他人屍體增進自身能力的功法 / 我天生肉身不壞 / 我能洞察萬物來歷真偽……"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
            {abilityPreview && (
              <div className="mt-3 rounded-lg border border-rose-700/40 bg-rose-950/20 p-3 text-xs">
                <div className="font-semibold text-rose-300">演繹結果：「{abilityPreview.name}」 · {abilityPreview.category} · {abilityPreview.powerTier}/5階</div>
                <div className="mt-1 text-zinc-300">{abilityPreview.summary}</div>
                <div className="mt-1 text-zinc-400">
                  觸發：{abilityPreview.triggers.map((t) => t.on).join('、')}　影響：
                  {abilityPreview.triggers.flatMap((t) => t.effects).map((e) => (e.type === 'permanent_gain' ? `${e.stat}↑` : e.type)).filter((v, i, a) => a.indexOf(v) === i).join('、')}
                </div>
                <div className="mt-1 text-rose-300/80">限制：{abilityPreview.limits.join('；')}</div>
                <div className="text-rose-300/60">風險：{abilityPreview.risks.join('；')}</div>
              </div>
            )}
          </div>

          {/* 難度 */}
          <div className={card}>
            <div className={label}>難度</div>
            <div className="flex gap-2">
              {(['easy', 'normal', 'hard'] as const).map((d) => (
                <div key={d} className={chip(difficulty === d)} onClick={() => setDifficulty(d)}>
                  {d === 'easy' ? '輕鬆' : d === 'normal' ? '普通' : '凡人逆襲（困難）'}
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={!canStart}
            onClick={handleStart}
            className={`w-full rounded-xl py-3 text-lg font-bold transition ${
              canStart ? 'bg-amber-500 text-black hover:bg-amber-400' : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
            }`}
          >
            {remaining < 0 ? '點數超支，請重新分配' : '踏入仙途'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanonCreation;
