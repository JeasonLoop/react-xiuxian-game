/* Generate fanren/data/worldMap.ts from game_db/game/world_map.json (BOM-safe). */
const fs = require('fs');
const SRC = 'C:\\Users\\User\\Desktop\\修仙遊戲\\game_db\\game\\world_map.json';
const OUT = 'C:\\Users\\User\\Desktop\\修仙遊戲\\react-xiuxian-game\\fanren\\data\\worldMap.ts';
const raw = fs.readFileSync(SRC, 'utf8').replace(/^﻿/, '').replace(/^ï»¿/, '');
const arr = JSON.parse(raw);
const clean = arr.map((n) => ({
  id: String(n.id || n.name),
  name: String(n.name || n.id),
  tier: ['human', 'spirit', 'demon', 'immortal'].includes(n.tier) ? n.tier : 'human',
  parentId: n.parentId || undefined,
  description: String(n.description || ''),
  factions: Array.isArray(n.factions) ? n.factions.filter((x) => typeof x === 'string') : undefined,
  connections: Array.isArray(n.connections) ? n.connections.filter((x) => typeof x === 'string') : undefined,
  firstVolume: typeof n.firstVolume === 'number' ? n.firstVolume : undefined,
}));
const header = `import type { WorldMapNode } from '../types';\n// 由 game_db/game/world_map.json 生成（網路爬取＋本地考據彙整，${clean.length} 節點）。\nexport const WORLD_MAP: WorldMapNode[] = `;
fs.writeFileSync(OUT, header + JSON.stringify(clean, null, 1) + ';\n', 'utf8');
console.log(`Wrote ${clean.length} map nodes to worldMap.ts`);
console.log('tiers:', clean.reduce((m, n) => ((m[n.tier] = (m[n.tier] || 0) + 1), m), {}));
