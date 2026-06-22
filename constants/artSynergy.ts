/**
 * 功法羁绊套装系统
 * 当玩家同时修炼特定功法组合时，触发套装效果
 */

import { BuildArchetypeKind } from '../types';

export interface ArtSynergySet {
  id: string;
  name: string; // 羁绊名称
  description: string; // 羁绊描述（显示在UI中）
  requiredArts: string[]; // 需要的功法ID列表
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number; // 修炼速度加成
    attackPercent?: number;
    defensePercent?: number;
    hpPercent?: number;
    critRate?: number; // 暴击率加成(0-1)
    critDamage?: number; // 暴击伤害加成(0-1)
    damageReduction?: number; // 减伤率(0-1)
    dodgeRate?: number; // 闪避率(0-1)
    lifeLeech?: number; // 生命偷取(0-1)
    counter?: number; // 反击加成
    counterRate?: number; // 反击率
    counterDamage?: number; // 反击伤害
  };
}

/**
 * 功法羁绊套装定义
 * 多个功法组合形成套装，获得额外加成
 */
export const ART_SYNERGY_SETS: ArtSynergySet[] = [
  // ===== 火系三绝 =====
  {
    id: 'synergy-fire-triple',
    name: '🔥 火系三绝',
    description: '烈火拳、纯阳无极功、凤凰涅槃功三法合一，火系功法威力大增',
    requiredArts: ['art-fiery-fist', 'art-pure-yang', 'art-phoenix-rebirth'],
    effects: {
      attackPercent: 0.25,
      expRate: 0.15,
      critRate: 0.08,
    },
  },

  // ===== 金系剑道 =====
  {
    id: 'synergy-metal-sword',
    name: '⚔️ 金系剑道',
    description: '天雷剑诀、金刚剑、星辰破灭诀，剑道至境',
    requiredArts: ['art-thunder-sword', 'art-golden-sword', 'art-star-destruction'],
    effects: {
      attackPercent: 0.20,
      critRate: 0.10,
      critDamage: 0.30,
    },
  },

  // ===== 土系铁壁 =====
  {
    id: 'synergy-earth-wall',
    name: '🛡️ 土系铁壁',
    description: '铁皮功、厚土护体、玉骨功，固若金汤',
    requiredArts: ['art-iron-skin', 'art-earth-shield', 'art-jade-bone'],
    effects: {
      defense: 150,
      hpPercent: 0.20,
      damageReduction: 0.10,
    },
  },

  // ===== 水系灵动 =====
  {
    id: 'synergy-water-flow',
    name: '💧 水系灵动',
    description: '水镜心法、冰心诀相辅相成，以柔克刚',
    requiredArts: ['art-water-mirror', 'art-ice-soul'],
    effects: {
      expRate: 0.10,
      dodgeRate: 0.08,
      counter: 15,
    },
  },

  // ===== 木系长生 =====
  {
    id: 'synergy-wood-life',
    name: '🌿 木系长生',
    description: '木身功与长生诀相辅相成，生机不绝',
    requiredArts: ['art-wooden-body', 'art-immortal-life'],
    effects: {
      hpPercent: 0.30,
      hp: 1000,
      lifeLeech: 0.05,
    },
  },

  // ===== 五行归元 =====
  {
    id: 'synergy-five-elements',
    name: '🌟 五行归元',
    description: '金木水火土五系各修一门，五行合一',
    requiredArts: [
      'art-golden-armor', // 金
      'art-wooden-heart', // 木
      'art-water-flow', // 水
      'art-fiery-fist', // 火
      'art-earth-shield', // 土
    ],
    effects: {
      attackPercent: 0.15,
      defensePercent: 0.15,
      hpPercent: 0.15,
      expRate: 0.20,
    },
  },

  // ===== 剑意通神 =====
  {
    id: 'synergy-sword-intent',
    name: '🗡️ 剑意通神',
    description: '剑意、杀意、神剑三诀合一，剑气纵横',
    requiredArts: ['art-sword-intent', 'art-killing-intent', 'art-divine-sword'],
    effects: {
      attackPercent: 0.30,
      critRate: 0.12,
      critDamage: 0.40,
    },
  },

  // ===== 混沌不朽 =====
  {
    id: 'synergy-chaos-immortal',
    name: '🌀 混沌不朽',
    description: '混沌霸体、虚空霸体、不死不灭，万法不侵',
    requiredArts: ['art-chaos-body', 'art-void-body', 'art-immortal-awakening'],
    effects: {
      hpPercent: 0.40,
      damageReduction: 0.15,
      lifeLeech: 0.08,
    },
  },

  // ===== 龙凤呈祥 =====
  {
    id: 'synergy-dragon-phoenix',
    name: '🐉 龙凤呈祥',
    description: '龙拳与凤凰涅槃功，龙凤齐鸣',
    requiredArts: ['art-dragon-fist', 'art-phoenix-rebirth'],
    effects: {
      attack: 300,
      hp: 2000,
      critRate: 0.05,
    },
  },

  // ===== 风雷双绝 =====
  {
    id: 'synergy-wind-thunder',
    name: '⚡ 风雷双绝',
    description: '御风步加天雷剑诀，风雷交加',
    requiredArts: ['art-wind-step', 'art-thunder-sword'],
    effects: {
      speed: 80,
      attack: 100,
      dodgeRate: 0.05,
    },
  },
];

/**
 * Build 流派阈值加成
 * 根据玩家已学功法的 buildAffinity 总点数，在不同阈值触发加成
 */
export interface BuildThresholdBonus {
  threshold: number; // 需要达到的buildAffinity总点数
  name: string; // 称号
  effects: {
    attackPercent?: number;
    defensePercent?: number;
    hpPercent?: number;
    critRate?: number;
    critDamage?: number;
    damageReduction?: number;
    dodgeRate?: number;
    lifeLeech?: number;
    counterRate?: number;
    counterDamage?: number;
  };
}

export const BUILD_THRESHOLD_BONUSES: Record<
  BuildArchetypeKind,
  BuildThresholdBonus[]
> = {
  // 暴击爆发流（crit）
  crit: [
    { threshold: 3, name: '锋芒初现', effects: { critRate: 0.03 } },
    { threshold: 6, name: '锐不可当', effects: { critRate: 0.06, critDamage: 0.15 } },
    { threshold: 10, name: '一剑封喉', effects: { critRate: 0.10, critDamage: 0.30 } },
    { threshold: 15, name: '天外飞仙', effects: { critRate: 0.15, critDamage: 0.50 } },
  ],
  // 站桩续航流（sustain）
  sustain: [
    { threshold: 3, name: '血气充盈', effects: { hpPercent: 0.05 } },
    { threshold: 6, name: '铜皮铁骨', effects: { hpPercent: 0.10, damageReduction: 0.05 } },
    { threshold: 10, name: '不灭金身', effects: { hpPercent: 0.18, damageReduction: 0.10 } },
    { threshold: 15, name: '万古不朽', effects: { hpPercent: 0.25, damageReduction: 0.15, lifeLeech: 0.05 } },
  ],
  // 反制反击流（counter）
  counter: [
    { threshold: 3, name: '以静制动', effects: { counterRate: 0.10, counterDamage: 0.15 } },
    { threshold: 6, name: '借力打力', effects: { counterRate: 0.18, counterDamage: 0.30 } },
    { threshold: 10, name: '太极化境', effects: { counterRate: 0.25, counterDamage: 0.50, dodgeRate: 0.05 } },
    { threshold: 15, name: '万法归宗', effects: { counterRate: 0.35, counterDamage: 0.75, dodgeRate: 0.10 } },
  ],
};

/**
 * 检查功法组合触发了哪些羁绊套装
 */
export function getActiveSynergies(
  learnedArtIds: string[]
): ArtSynergySet[] {
  return ART_SYNERGY_SETS.filter((set) =>
    set.requiredArts.every((artId) => learnedArtIds.includes(artId))
  );
}

/**
 * 计算所有已激活羁绊的累加效果
 */
export function calculateSynergyEffects(
  synergies: ArtSynergySet[]
): ArtSynergySet['effects'] {
  const total: ArtSynergySet['effects'] = {};
  for (const syn of synergies) {
    for (const [key, value] of Object.entries(syn.effects)) {
      if (value !== undefined) {
        (total as any)[key] = ((total as any)[key] || 0) + value;
      }
    }
  }
  return total;
}

/**
 * 计算Build流派总分和已激活的阈值奖励
 */
export function calculateBuildAffinityTotals(
  learnedArts: Array<{ buildAffinity?: Partial<Record<BuildArchetypeKind, number>> }>
): { totals: Record<BuildArchetypeKind, number>; activeThresholds: Record<BuildArchetypeKind, BuildThresholdBonus[]> } {
  const totals: Record<BuildArchetypeKind, number> = {
    crit: 0,
    sustain: 0,
    counter: 0,
  };

  for (const art of learnedArts) {
    if (art.buildAffinity) {
      for (const [kind, points] of Object.entries(art.buildAffinity)) {
        if (kind in totals) {
          totals[kind as BuildArchetypeKind] += points;
        }
      }
    }
  }

  const activeThresholds: Record<BuildArchetypeKind, BuildThresholdBonus[]> = {
    crit: [],
    sustain: [],
    counter: [],
  };

  for (const kind of ['crit', 'sustain', 'counter'] as BuildArchetypeKind[]) {
    const total = totals[kind];
    activeThresholds[kind] = BUILD_THRESHOLD_BONUSES[kind].filter(
      (b) => total >= b.threshold
    );
  }

  return { totals, activeThresholds };
}

/**
 * 计算Build流派奖励的总效果
 */
export function calculateBuildThresholdEffects(
  activeThresholds: Record<BuildArchetypeKind, BuildThresholdBonus[]>
): Partial<Record<string, number>> {
  const effects: Partial<Record<string, number>> = {};
  for (const bonuses of Object.values(activeThresholds)) {
    // 只取最高阈值的奖励
    if (bonuses.length > 0) {
      const highest = bonuses[bonuses.length - 1];
      for (const [key, value] of Object.entries(highest.effects)) {
        if (value !== undefined) {
          (effects as any)[key] = ((effects as any)[key] || 0) + value;
        }
      }
    }
  }
  return effects;
}
