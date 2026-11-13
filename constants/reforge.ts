/**
 * 万宝仙炉 · 装备洗炼系统配置
 */
import type { ItemRarity } from '../types';

/** 数值型词条（攻防血百分比、会心等） */
export type NumericAffixType =
  | 'attackPercent'
  | 'defensePercent'
  | 'hpPercent'
  | 'critRate'
  | 'critDamage'
  | 'dodgeRate'
  | 'lifeLeech';

/** 机制型词条 ID（按触发类型分组的 20 个机制词条） */
export type MechanicAffixType =
  // 常驻被动
  | 'thorns'
  | 'shield'
  | 'regen'
  | 'lifeLeechBoost'
  | 'swift'
  | 'tenacity'
  | 'spellGuard'
  // 概率触发（攻击结算判定）
  | 'combo'
  | 'burn'
  | 'freeze'
  | 'thunder'
  | 'armorBreak'
  // 条件触发（状态判定）
  | 'execute'
  | 'berserk'
  | 'bulwark'
  | 'slayer'
  | 'critResist'
  // 击杀/受击触发
  | 'killHeal'
  | 'hitSpirit'
  | 'block';

/** 洗炼词条总类型 = 数值型 + 机制型 */
export type ReforgeAffixType = NumericAffixType | MechanicAffixType;

export interface ReforgeAffixDefinition {
  type: NumericAffixType;
  name: string;
  unit: string;
  isPercent: boolean;
  color: string;
  desc: string;
}

export const REFORGE_AFFIX_DEFINITIONS: Record<NumericAffixType, ReforgeAffixDefinition> = {
  attackPercent: {
    type: 'attackPercent',
    name: '锋芒',
    unit: '%',
    isPercent: true,
    color: 'text-red-400',
    desc: '提升总攻击力百分比',
  },
  defensePercent: {
    type: 'defensePercent',
    name: '玄甲',
    unit: '%',
    isPercent: true,
    color: 'text-blue-400',
    desc: '提升总防御力百分比',
  },
  hpPercent: {
    type: 'hpPercent',
    name: '长生',
    unit: '%',
    isPercent: true,
    color: 'text-emerald-400',
    desc: '提升总气血上限百分比',
  },
  critRate: {
    type: 'critRate',
    name: '天煞',
    unit: '%',
    isPercent: true,
    color: 'text-amber-400',
    desc: '提升会心一击几率',
  },
  critDamage: {
    type: 'critDamage',
    name: '裂魄',
    unit: '%',
    isPercent: true,
    color: 'text-orange-400',
    desc: '提升会心一击伤害倍率',
  },
  dodgeRate: {
    type: 'dodgeRate',
    name: '幻影',
    unit: '%',
    isPercent: true,
    color: 'text-purple-400',
    desc: '提升身法闪避几率',
  },
  lifeLeech: {
    type: 'lifeLeech',
    name: '噬灵',
    unit: '%',
    isPercent: true,
    color: 'text-rose-400',
    desc: '造成的伤害按比例吸取气血',
  },
};

export const REFORGE_AFFIX_TYPES: NumericAffixType[] = [
  'attackPercent',
  'defensePercent',
  'hpPercent',
  'critRate',
  'critDamage',
  'dodgeRate',
  'lifeLeech',
];

export interface ReforgeRarityConfig {
  minAffixes: number;
  maxAffixes: number;
  minValue: number; // 如 0.02
  maxValue: number; // 如 0.06
}

export const REFORGE_RARITY_CONFIGS: Record<ItemRarity, ReforgeRarityConfig> = {
  '普通': {
    minAffixes: 1,
    maxAffixes: 1,
    minValue: 0.02,
    maxValue: 0.05,
  },
  '稀有': {
    minAffixes: 1,
    maxAffixes: 2,
    minValue: 0.05,
    maxValue: 0.10,
  },
  '传说': {
    minAffixes: 2,
    maxAffixes: 3,
    minValue: 0.08,
    maxValue: 0.15,
  },
  '仙品': {
    minAffixes: 3,
    maxAffixes: 3,
    minValue: 0.12,
    maxValue: 0.22,
  },
};

/* ============================================================
 * 机制型词条定义（M4-1）
 * 所有数值与概率集中在本文件，战斗触发器由后续任务消费。
 * 存储结构沿用 { type, name, value }：value 为洗炼随机化后的参数，
 * 由 rollTarget 决定随机化的是触发概率（chance）还是效果数值（value），
 * 其余固定参数存放在 params 中。
 * ============================================================ */

/** 机制词条触发类型分组 */
export type MechanicAffixCategory = 'passive' | 'onAttack' | 'conditional' | 'onEvent';

/** 机制词条的固定参数（不随洗炼浮动） */
export interface MechanicAffixParams {
  /** 固定触发概率（rollTarget 为 'value' 的词条生效，如雷罚 15% 概率） */
  chance?: number;
  /** 固定数值：追击/DoT 倍率、降防比例、减伤比例等 */
  value?: number;
  /** 固定持续回合数 */
  duration?: number;
  /** 条件触发的血量阈值（如斩杀 0.25 = 目标血量 < 25%） */
  threshold?: number;
}

/** 机制型词条定义 */
export interface MechanicAffix {
  id: MechanicAffixType;
  name: string;
  /** 触发类型分组：常驻被动 / 攻击概率 / 条件触发 / 击杀受击 */
  category: MechanicAffixCategory;
  /** 触发说明（含数值区间，需与 valueMin/valueMax、params 一致） */
  description: string;
  /** 最低可洗出档位：低于该稀有度的洗炼池不会出现此词条 */
  minRarity: ItemRarity;
  /** 池内权重（预留，当前与数值词条按 MECHANIC_AFFIX_ROLL_WEIGHT 混抽） */
  weight: number;
  /** 洗炼随机化的参数：'value' 随机效果数值，'chance' 随机触发概率 */
  rollTarget: 'value' | 'chance';
  /** value 的单位：百分比（0.08 = 8%）或固定点数（如灵力 8-15 点） */
  valueUnit: 'percent' | 'flat';
  /** 洗炼可随机到的最小值 */
  valueMin: number;
  /** 洗炼可随机到的最大值（仙品满值；低档按 RARITY_VALUE_FACTORS 折减） */
  valueMax: number;
  /** UI 展示颜色（tailwind 类名，风格与数值词条一致） */
  color: string;
  /** 固定参数 */
  params: MechanicAffixParams;
}

/* ---------- 常驻被动：聚合进战斗 unit 属性/字段 ---------- */

const MECHANIC_PASSIVE_AFFIXES: MechanicAffix[] = [
  {
    id: 'thorns',
    name: '荆棘反噬',
    category: 'passive',
    description: '受击时反弹 8%-15% 所受伤害',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.08,
    valueMax: 0.15,
    color: 'text-lime-400',
    params: {},
  },
  {
    id: 'shield',
    name: '玄光庇护',
    category: 'passive',
    description: '战斗开始时获得 5%-10% 气血上限的护盾',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.05,
    valueMax: 0.10,
    color: 'text-cyan-300',
    params: {},
  },
  {
    id: 'regen',
    name: '回春妙术',
    category: 'passive',
    description: '每个行动周期回复 1.5%-3% 气血上限（同类可叠加）',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.015,
    valueMax: 0.03,
    color: 'text-emerald-300',
    params: {},
  },
  {
    id: 'lifeLeechBoost',
    name: '噬血狂化',
    category: 'passive',
    description: '吸血比例额外 +5%-12%（同类可叠加）',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.05,
    valueMax: 0.12,
    color: 'text-rose-300',
    params: {},
  },
  {
    id: 'swift',
    name: '追风逐电',
    category: 'passive',
    description: '速度提升 8%-18%',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.08,
    valueMax: 0.18,
    color: 'text-sky-300',
    params: {},
  },
  {
    id: 'tenacity',
    name: '不动如山',
    category: 'passive',
    description: '受到的所有伤害减免 4%-10%',
    minRarity: '传说',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.04,
    valueMax: 0.10,
    color: 'text-stone-300',
    params: {},
  },
  {
    id: 'spellGuard',
    name: '破法真罡',
    category: 'passive',
    description: '受到的技能伤害降低 6%-15%',
    minRarity: '仙品',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.06,
    valueMax: 0.15,
    color: 'text-violet-300',
    params: {},
  },
];

/* ---------- 概率触发：攻击结算判定 ---------- */

const MECHANIC_ON_ATTACK_AFFIXES: MechanicAffix[] = [
  {
    id: 'combo',
    name: '剑气纵横',
    category: 'onAttack',
    description: '普攻后 12%-25% 概率追击一次，造成 50% 伤害',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'chance',
    valueUnit: 'percent',
    valueMin: 0.12,
    valueMax: 0.25,
    color: 'text-red-300',
    params: { value: 0.5 },
  },
  {
    id: 'burn',
    name: '焚天炽焰',
    category: 'onAttack',
    description: '攻击时 10%-20% 概率点燃目标，每回合造成 25% 攻击力的灼烧伤害，持续 3 回合',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'chance',
    valueUnit: 'percent',
    valueMin: 0.10,
    valueMax: 0.20,
    color: 'text-orange-300',
    params: { value: 0.25, duration: 3 },
  },
  {
    id: 'freeze',
    name: '霜寒禁锢',
    category: 'onAttack',
    description: '攻击时 6%-12% 概率冻结目标 1 回合',
    minRarity: '仙品',
    weight: 1,
    rollTarget: 'chance',
    valueUnit: 'percent',
    valueMin: 0.06,
    valueMax: 0.12,
    color: 'text-blue-300',
    params: { duration: 1 },
  },
  {
    id: 'thunder',
    name: '雷罚天诛',
    category: 'onAttack',
    description: '攻击时 15% 概率追加一次 30%-50% 雷系伤害',
    minRarity: '传说',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.30,
    valueMax: 0.50,
    color: 'text-yellow-300',
    params: { chance: 0.15 },
  },
  {
    id: 'armorBreak',
    name: '开山裂石',
    category: 'onAttack',
    description: '攻击时 12%-22% 概率降低目标 20% 防御，持续 3 回合',
    minRarity: '传说',
    weight: 1,
    rollTarget: 'chance',
    valueUnit: 'percent',
    valueMin: 0.12,
    valueMax: 0.22,
    color: 'text-amber-300',
    params: { value: 0.20, duration: 3 },
  },
];

/* ---------- 条件触发：状态判定 ---------- */

const MECHANIC_CONDITIONAL_AFFIXES: MechanicAffix[] = [
  {
    id: 'execute',
    name: '斩龙断岳',
    category: 'conditional',
    description: '目标气血低于 25% 时，造成的伤害提升 30%-50%',
    minRarity: '仙品',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.30,
    valueMax: 0.50,
    color: 'text-red-400',
    params: { threshold: 0.25 },
  },
  {
    id: 'berserk',
    name: '浴血狂澜',
    category: 'conditional',
    description: '自身气血低于 40% 时，攻击提升 25%-40%',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.25,
    valueMax: 0.40,
    color: 'text-red-300',
    params: { threshold: 0.40 },
  },
  {
    id: 'bulwark',
    name: '不动明王',
    category: 'conditional',
    description: '自身气血高于 70% 时，防御提升 25%-40%',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.25,
    valueMax: 0.40,
    color: 'text-teal-300',
    params: { threshold: 0.70 },
  },
  {
    id: 'slayer',
    name: '弑仙诛邪',
    category: 'conditional',
    description: '对精英与 BOSS 造成的伤害提升 12%-25%',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.12,
    valueMax: 0.25,
    color: 'text-fuchsia-300',
    params: {},
  },
  {
    id: 'critResist',
    name: '金刚不坏',
    category: 'conditional',
    description: '受到会心一击时，伤害降低 25%-40%',
    minRarity: '传说',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.25,
    valueMax: 0.40,
    color: 'text-amber-200',
    params: {},
  },
];

/* ---------- 击杀/受击触发 ---------- */

const MECHANIC_ON_EVENT_AFFIXES: MechanicAffix[] = [
  {
    id: 'killHeal',
    name: '饮血归元',
    category: 'onEvent',
    description: '击杀敌人后回复 5%-10% 气血上限',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'percent',
    valueMin: 0.05,
    valueMax: 0.10,
    color: 'text-emerald-400',
    params: {},
  },
  {
    id: 'hitSpirit',
    name: '采气还灵',
    category: 'onEvent',
    description: '受击后回复 8-15 点灵力',
    minRarity: '稀有',
    weight: 1,
    rollTarget: 'value',
    valueUnit: 'flat',
    valueMin: 8,
    valueMax: 15,
    color: 'text-indigo-300',
    params: {},
  },
  {
    id: 'block',
    name: '四两拨千斤',
    category: 'onEvent',
    description: '受击时 10%-20% 概率将本次伤害减半',
    minRarity: '普通',
    weight: 1,
    rollTarget: 'chance',
    valueUnit: 'percent',
    valueMin: 0.10,
    valueMax: 0.20,
    color: 'text-stone-200',
    params: { value: 0.5 },
  },
];

/** 机制词条总池（20 个） */
export const MECHANIC_AFFIXES: MechanicAffix[] = [
  ...MECHANIC_PASSIVE_AFFIXES,
  ...MECHANIC_ON_ATTACK_AFFIXES,
  ...MECHANIC_CONDITIONAL_AFFIXES,
  ...MECHANIC_ON_EVENT_AFFIXES,
];

/** 机制词条按 ID 快速索引 */
export const MECHANIC_AFFIXES_BY_ID: Record<MechanicAffixType, MechanicAffix> =
  MECHANIC_AFFIXES.reduce((map, affix) => {
    map[affix.id] = affix;
    return map;
  }, {} as Record<MechanicAffixType, MechanicAffix>);

/** 按 ID 查找机制词条定义 */
export function getMechanicAffixById(id: string): MechanicAffix | undefined {
  return (MECHANIC_AFFIXES_BY_ID as Record<string, MechanicAffix | undefined>)[id];
}

/** 稀有度档位顺序（用于 minRarity 比较） */
const RARITY_ORDER: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

/**
 * 获取指定稀有度洗炼池可出现的机制词条
 * 规则：词条 minRarity <= 当前档位才混入池（低档洗不出部分机制词）
 */
export function getMechanicAffixPool(rarity: ItemRarity): MechanicAffix[] {
  const rarityIndex = RARITY_ORDER.indexOf(rarity);
  if (rarityIndex === -1) return [];
  return MECHANIC_AFFIXES.filter(
    (affix) => RARITY_ORDER.indexOf(affix.minRarity) <= rarityIndex
  );
}

/**
 * 机制词条每次洗炼时占抽取池的概率（约 40%，其余仍为数值词条）
 */
export const MECHANIC_AFFIX_ROLL_WEIGHT = 0.4;

/**
 * 各档位机制词条的数值折减系数：仙品可洗出满值（1.0），
 * 低档位按比例压缩 [valueMin, valueMax] 区间的上限，保证"仙品洗出高级数值"。
 */
export const RARITY_VALUE_FACTORS: Record<ItemRarity, number> = {
  '普通': 0.6,
  '稀有': 0.75,
  '传说': 0.9,
  '仙品': 1.0,
};

/* ============================================================
 * 聚合结果类型：装备机制词条汇总（战斗触发器消费的数据结构）
 * 同类词条默认取最优（避免叠爆），吸血/回春可叠加。
 * ============================================================ */

export interface EquipmentTriggers {
  /** 常驻被动：数值为比例（0.08 = 8%），hitSpirit 之外的 flat 值不在此组 */
  passive: {
    /** 荆棘反噬：受击反弹伤害比例 */
    thorns?: number;
    /** 玄光庇护：战斗开始护盾占 maxHp 比例 */
    shield?: number;
    /** 回春妙术：每行动周期回复 maxHp 比例（可叠加） */
    regen?: number;
    /** 噬血狂化：额外吸血比例（可叠加） */
    lifeLeechBoost?: number;
    /** 追风逐电：速度提升比例 */
    swift?: number;
    /** 不动如山：受伤减免比例 */
    tenacity?: number;
    /** 破法真罡：受技能伤害降低比例 */
    spellGuard?: number;
  };
  /** 概率触发（攻击结算判定） */
  onAttack: {
    /** 剑气纵横：chance 概率追击 value 倍伤害 */
    combo?: { chance: number; value: number };
    /** 焚天炽焰：chance 概率点燃，每回合 value 倍攻击力伤害，持续 duration 回合 */
    burn?: { chance: number; value: number; duration: number };
    /** 霜寒禁锢：chance 概率冻结 duration 回合 */
    freeze?: { chance: number; duration: number };
    /** 雷罚天诛：chance 概率追加 value 倍雷系伤害 */
    thunder?: { chance: number; value: number };
    /** 开山裂石：chance 概率降低目标 value 比例防御，持续 duration 回合 */
    armorBreak?: { chance: number; value: number; duration: number };
  };
  /** 条件触发（状态判定） */
  conditional: {
    /** 斩龙断岳：目标血量 < threshold 时伤害 +value */
    execute?: { threshold: number; value: number };
    /** 浴血狂澜：自身血量 < threshold 时攻击 +value */
    berserk?: { threshold: number; value: number };
    /** 不动明王：自身血量 > threshold 时防御 +value */
    bulwark?: { threshold: number; value: number };
    /** 弑仙诛邪：对精英/BOSS 伤害 +value */
    slayer?: { value: number };
    /** 金刚不坏：受暴击时伤害 -value */
    critResist?: { value: number };
  };
  /** 击杀/受击触发 */
  onEvent: {
    /** 饮血归元：击杀回复 value 比例 maxHp */
    killHeal?: { value: number };
    /** 采气还灵：受击回复 value 点灵力（固定点数） */
    hitSpirit?: { value: number };
    /** 四两拨千斤：chance 概率将本次伤害乘以 value（0.5 = 减半） */
    block?: { chance: number; value: number };
  };
}

/* ============================================================
 * UI 展示辅助：统一数值词条与机制词条的名称/颜色/说明/数值文本
 * ============================================================ */

export interface ReforgeAffixDisplay {
  name: string;
  color: string;
  desc: string;
  /** 数值文本：百分比词条 +8.0%，概率词条 15.0%概率，固定点数词条 +12点 */
  valueText: string;
}

/** 未识别词条类型的兜底展示 */
const FALLBACK_AFFIX_DISPLAY: ReforgeAffixDisplay = {
  name: '未知词条',
  color: 'text-amber-300',
  desc: '未知的天地道蕴',
  valueText: '',
};

/**
 * 获取词条展示信息（数值词条与机制词条通用）
 * 机制词条的 desc 来自 definition.description，valueText 展示洗炼出的实际数值。
 */
export function getReforgeAffixDisplay(affix: {
  type: string;
  name: string;
  value: number;
}): ReforgeAffixDisplay {
  // 先查机制词条
  const mechanic = getMechanicAffixById(affix.type);
  if (mechanic) {
    let valueText: string;
    if (mechanic.valueUnit === 'flat') {
      valueText = `+${Math.round(affix.value)}点`;
    } else if (mechanic.rollTarget === 'chance') {
      valueText = `${(affix.value * 100).toFixed(1)}%概率`;
    } else {
      valueText = `+${(affix.value * 100).toFixed(1)}%`;
    }
    return {
      name: mechanic.name,
      color: mechanic.color,
      desc: mechanic.description,
      valueText,
    };
  }

  // 再查数值词条
  const numeric = REFORGE_AFFIX_DEFINITIONS[affix.type as NumericAffixType];
  if (numeric) {
    return {
      name: numeric.name,
      color: numeric.color,
      desc: numeric.desc,
      valueText: `+${(affix.value * 100).toFixed(1)}%`,
    };
  }

  return { ...FALLBACK_AFFIX_DISPLAY, name: affix.name };
}

/** 计算装备单次洗炼的消耗（lockedCount 为锁定词条数，锁定会额外加价） */
export function getReforgeCost(
  reforgeCount = 0,
  lockedCount = 0
): {
  stones: number;
  spiritStones: number;
} {
  const baseStones = 1 + Math.floor(reforgeCount / 5);
  const baseSpiritStones = 500 + Math.min(10000, reforgeCount * 250);
  const stones = baseStones + lockedCount;
  const spiritStones = Math.round(baseSpiritStones * (1 + 0.5 * lockedCount));
  return { stones, spiritStones };
}
