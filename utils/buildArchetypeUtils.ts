/**
 * 根据已学功法、装备词条、出战灵宠估算 Build 三维倾向
 */

import {
  ItemType,
  type BuildArchetypeKind,
  type EquipmentSlot,
  type PlayerStats,
} from '../types';
import { CULTIVATION_ARTS } from '../constants/cultivation';
import { PET_TEMPLATES } from '../constants/pets';
import {
  BUILD_ARCHETYPE_HINTS,
  BUILD_ARCHETYPE_LABELS,
  BUILD_KEYWORD_GROUPS,
  PET_SPECIES_FALLBACK,
} from '../constants/buildArchetypes';

export interface BuildArchetypeProfile {
  crit: number;
  sustain: number;
  counter: number;
  /** 占比 0~100，三者之和为 100 */
  percent: Record<BuildArchetypeKind, number>;
  dominant: BuildArchetypeKind;
  dominantLabel: string;
  summary: string;
}

function emptyScores(): Record<BuildArchetypeKind, number> {
  return { crit: 0, sustain: 0, counter: 0 };
}

function addAffinity(
  acc: Record<BuildArchetypeKind, number>,
  partial: Partial<Record<BuildArchetypeKind, number>> | undefined,
  factor: number
) {
  if (!partial) return;
  (['crit', 'sustain', 'counter'] as const).forEach((k) => {
    const v = partial[k];
    if (typeof v === 'number' && v > 0) acc[k] += v * factor;
  });
}

function scoreTextBlob(blob: string): Record<BuildArchetypeKind, number> {
  const s = emptyScores();
  if (!blob) return s;
  const lower = blob.toLowerCase();
  (['crit', 'sustain', 'counter'] as const).forEach((kind) => {
    for (const kw of BUILD_KEYWORD_GROUPS[kind]) {
      if (blob.includes(kw) || lower.includes(kw.toLowerCase())) {
        s[kind] += 1;
      }
    }
  });
  return s;
}

function mergeScores(
  a: Record<BuildArchetypeKind, number>,
  b: Record<BuildArchetypeKind, number>,
  factor: number
) {
  (['crit', 'sustain', 'counter'] as const).forEach((k) => {
    a[k] += b[k] * factor;
  });
}

function normalize(
  raw: Record<BuildArchetypeKind, number>
): Record<BuildArchetypeKind, number> {
  const sum = raw.crit + raw.sustain + raw.counter;
  if (sum <= 0) {
    return { crit: 34, sustain: 33, counter: 33 };
  }
  const c = Math.round((raw.crit / sum) * 100);
  const s = Math.round((raw.sustain / sum) * 100);
  let co = 100 - c - s;
  if (co < 0) co = 0;
  return { crit: c, sustain: s, counter: co };
}

function addEquipmentBaseAffinity(
  acc: Record<BuildArchetypeKind, number>,
  item: NonNullable<PlayerStats['inventory']>[number]
) {
  // 先按物品大类给基础倾向
  switch (item.type) {
    case ItemType.Weapon:
      acc.crit += 1.15;
      break;
    case ItemType.Armor:
      acc.sustain += 1.15;
      break;
    case ItemType.Artifact:
      acc.counter += 0.95;
      break;
    case ItemType.Ring:
      acc.crit += 0.7;
      break;
    case ItemType.Accessory:
      acc.counter += 0.65;
      break;
    default:
      break;
  }

  // 再按装备位微调
  const slot = item.equipmentSlot as EquipmentSlot | undefined;
  if (!slot) return;
  const slotText = String(slot);
  if (slotText.includes('武器')) acc.crit += 0.5;
  if (slotText.includes('胸甲') || slotText.includes('裤腿')) acc.sustain += 0.45;
  if (slotText.includes('法宝')) acc.counter += 0.45;
}

/**
 * 计算当前角色 Build 流派倾向（展示用，非战斗硬数值）
 */
export function getBuildArchetypeProfile(player: PlayerStats): BuildArchetypeProfile {
  const acc = emptyScores();

  const learned = player.cultivationArts || [];
  const unlocked = player.unlockedArts || [];

  for (const artId of learned) {
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (!art) continue;
    addAffinity(acc, art.buildAffinity, 1);
    mergeScores(acc, scoreTextBlob(`${art.name} ${art.description}`), 0.35);
  }

  for (const artId of unlocked) {
    if (learned.includes(artId)) continue;
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (!art) continue;
    addAffinity(acc, art.buildAffinity, 0.45);
    mergeScores(acc, scoreTextBlob(`${art.name} ${art.description}`), 0.2);
  }

  const activeId = player.activeArtId;
  if (activeId) {
    const active = CULTIVATION_ARTS.find((a) => a.id === activeId);
    if (active) {
      addAffinity(acc, active.buildAffinity, 0.5);
      mergeScores(acc, scoreTextBlob(`${active.name} ${active.description}`), 0.25);
    }
  }

  Object.values(player.equippedItems || {}).forEach((itemId) => {
    if (!itemId) return;
    const item = player.inventory?.find((i) => i.id === itemId);
    if (!item) return;
    addEquipmentBaseAffinity(acc, item);
    const blob = `${item.name} ${item.description || ''}`;
    mergeScores(acc, scoreTextBlob(blob), 0.85);
  });

  if (player.activePetId && player.pets?.length) {
    const pet = player.pets.find((p) => p.id === player.activePetId);
    if (pet) {
      const tmpl = PET_TEMPLATES.find((t) => t.species === pet.species);
      if (tmpl?.buildAffinity) {
        addAffinity(acc, tmpl.buildAffinity, 1.1);
      } else {
        const fb = PET_SPECIES_FALLBACK[pet.species];
        if (fb) {
          acc.crit += fb[0] * 0.8;
          acc.sustain += fb[1] * 0.8;
          acc.counter += fb[2] * 0.8;
        }
      }
      const skillBlob = pet.skills
        .map((s) => `${s.name} ${s.description}`)
        .join(' ');
      mergeScores(acc, scoreTextBlob(skillBlob), 0.6);
    }
  }

  const dominant: BuildArchetypeKind =
    acc.crit >= acc.sustain && acc.crit >= acc.counter
      ? 'crit'
      : acc.sustain >= acc.counter
        ? 'sustain'
        : 'counter';

  const percent = normalize(acc);
  const dominantLabel = BUILD_ARCHETYPE_LABELS[dominant];
  const summary = BUILD_ARCHETYPE_HINTS[dominant];

  return {
    crit: acc.crit,
    sustain: acc.sustain,
    counter: acc.counter,
    percent,
    dominant,
    dominantLabel,
    summary,
  };
}
