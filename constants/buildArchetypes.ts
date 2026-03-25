/**
 * Build 流派：关键词与种族兜底（用于装备名/描述未标 buildAffinity 时的推断）
 */

import type { BuildArchetypeKind } from '../types';

export const BUILD_ARCHETYPE_LABELS: Record<BuildArchetypeKind, string> = {
  crit: '暴击流',
  sustain: '续航流',
  counter: '反击流',
};

export const BUILD_ARCHETYPE_HINTS: Record<BuildArchetypeKind, string> = {
  crit: '偏爆发与先手，适合堆攻、速度、暴击相关搭配',
  sustain: '偏站桩与消耗，适合气血、防御、回复类搭配',
  counter: '偏反制与承伤，适合护体、反震、镜反类搭配',
};

/** 名称/描述关键词命中计数（每条命中 +1 分） */
export const BUILD_KEYWORD_GROUPS: Record<BuildArchetypeKind, readonly string[]> = {
  crit: [
    '暴击',
    '暴击率',
    '天雷',
    '雷霆',
    '九天',
    '穿甲',
    '破甲',
    '破军',
    '疾风',
    '锋锐',
    '斩杀',
    '灭',
    '剑意',
    '雷劫',
  ],
  sustain: [
    '气血',
    '回血',
    '治疗',
    '再生',
    '护体',
    '护盾',
    '长生',
    '生生不息',
    '龟甲',
    '回春',
    '灵愈',
    '厚土',
    '体魄',
    '防御',
  ],
  counter: [
    '反击',
    '反弹',
    '反震',
    '荆棘',
    '反伤',
    '镜反',
    '水镜',
    '反噬',
    '反制',
    '卸力',
    '招架',
  ],
};

/** 灵宠种族兜底（无模板 buildAffinity 时） */
export const PET_SPECIES_FALLBACK: Partial<
  Record<string, readonly [number, number, number]>
> = {
  虎族: [3, 0, 0],
  狼族: [2, 0, 1],
  龟族: [0, 3, 1],
  狐族: [1, 2, 0],
  龙族: [2, 1, 1],
  神兽: [2, 2, 0],
  凤族: [2, 1, 0],
};
