import React, { useMemo, useState } from 'react';
import { WORLD_MAP } from '../data/worldMap';
import type { WorldMapNode } from '../types';
import { useWorldStore } from '../worldStore';

interface Props { onClose: () => void; onTravel: (name: string) => void; }

const TIERS: { t: WorldMapNode['tier']; label: string; unlock: number }[] = [
  { t: 'human', label: '人界', unlock: 0 },
  { t: 'spirit', label: '靈界', unlock: 1180 },
  { t: 'demon', label: '魔界', unlock: 1900 },
  { t: 'immortal', label: '仙界', unlock: 2350 },
];

const MapPanel: React.FC<Props> = ({ onClose, onTravel }) => {
  const world = useWorldStore((s) => s.world);
  const busy = useWorldStore((s) => s.busy);
  const [tier, setTier] = useState<WorldMapNode['tier']>('human');
  const progress = world.progressChapter;
  const here = world.currentLocationId;

  const { roots, childrenOf } = useMemo(() => {
    const nodes = WORLD_MAP.filter((n) => n.tier === tier);
    const ids = new Set(nodes.map((n) => n.id));
    const childrenOf: Record<string, WorldMapNode[]> = {};
    const roots: WorldMapNode[] = [];
    for (const n of nodes) {
      if (n.parentId && ids.has(n.parentId)) (childrenOf[n.parentId] = childrenOf[n.parentId] || []).push(n);
      else roots.push(n);
    }
    return { roots, childrenOf };
  }, [tier]);

  const tierLocked = (TIERS.find((x) => x.t === tier)?.unlock || 0) > progress;

  const renderNode = (n: WorldMapNode, depth: number): React.ReactNode => {
    const kids = childrenOf[n.id] || [];
    const isHere = n.name === here;
    return (
      <div key={n.id} style={{ marginLeft: depth * 12 }} className="mt-1">
        <div className={`rounded-lg border px-2 py-1.5 ${isHere ? 'border-amber-400 bg-amber-500/15' : 'border-zinc-800 bg-zinc-900/50'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isHere ? 'text-amber-200' : 'text-zinc-200'}`}>{depth > 0 ? '└ ' : ''}{n.name}{isHere ? '（你在此）' : ''}</span>
            {n.firstVolume ? <span className="text-[10px] text-zinc-600">V{n.firstVolume}</span> : null}
            {!isHere && !tierLocked && (
              <button
                disabled={busy}
                onClick={() => { onTravel(n.name); onClose(); }}
                className="ml-auto rounded border border-amber-700/50 bg-amber-950/30 px-2 py-0.5 text-[11px] text-amber-200 hover:border-amber-400 disabled:opacity-50"
              >
                前往
              </button>
            )}
          </div>
          {n.description && <div className="mt-0.5 text-[11px] text-zinc-400">{n.description}</div>}
          {n.factions && n.factions.length > 0 && <div className="text-[11px] text-zinc-600">勢力：{n.factions.slice(0, 5).join('、')}</div>}
        </div>
        {kids.map((k) => renderNode(k, Math.min(depth + 1, 5)))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4" onClick={onClose}>
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-amber-800/40 bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-300">🗺️ 凡人修仙界・詳細地圖 <span className="text-xs text-zinc-500">（{WORLD_MAP.length} 處）</span></h2>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-amber-500">關閉</button>
        </div>
        <div className="mb-3 flex gap-2">
          {TIERS.map((x) => {
            const locked = x.unlock > progress;
            return (
              <button
                key={x.t}
                onClick={() => setTier(x.t)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${tier === x.t ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-amber-600'}`}
              >
                {x.label} {locked ? '🔒' : ''}
              </button>
            );
          })}
        </div>
        {tierLocked ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
            此界域非你目前修為與見識所能觸及——待你境界精進、足跡漸遠，方能窺其全貌。
          </div>
        ) : (
          <div className="max-h-[64vh] overflow-y-auto pr-1">{roots.map((r) => renderNode(r, 0))}</div>
        )}
      </div>
    </div>
  );
};

export default MapPanel;
