/**
 * 装备机制词条触发器引擎（纯函数）
 * 回合制（turnBased.ts）与快速战斗（fastBattle.ts / fastTriggers.ts）共用，
 * 是两模式战斗结算一致性的关键：所有词条的概率与数值均从 EquipmentTriggers 读取。
 */
import type { BattleUnit, Debuff } from '../../types';
import type { EquipmentTriggers } from '../../constants/reforge';

/** 词条唯一 ID 生成（同一回合可能多次触发，需避免重复） */
function genDebuffId(kind: string): string {
  return `equip_${kind}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

/* ============================================================
 * 1. 条件触发乘区：斩杀 / 狂暴 / 坚壁 / 弑仙
 * ============================================================ */

export interface ConditionalMultipliers {
  /** 攻击乘区（浴血狂澜：自身血量低时提升） */
  attackMult: number;
  /** 防御乘区（不动明王：自身血量高时提升） */
  defenseMult: number;
  /** 伤害乘区（斩龙断岳：目标血量低时提升；弑仙诛邪：对精英/BOSS 提升） */
  damageMult: number;
}

/**
 * 计算条件触发乘区。
 * @param owner 触发器持有者（乘区作用对象：attackMult/damageMult 在其攻击时生效，defenseMult 作用于其防御）
 * @param opponent 当前交战对手（用于斩杀目标血量判定）
 * @param triggers 触发器（undefined 表示无词条，全部返回 1）
 * @param isEliteEnemy 对手是否为精英/BOSS（弑仙诛邪判定）
 */
export function computeConditionalMultipliers(
  owner: BattleUnit,
  opponent: BattleUnit,
  triggers: EquipmentTriggers | undefined,
  isEliteEnemy: boolean
): ConditionalMultipliers {
  const result: ConditionalMultipliers = { attackMult: 1, defenseMult: 1, damageMult: 1 };
  if (!triggers) return result;

  const cond = triggers.conditional;
  const ownerHpRatio = owner.maxHp > 0 ? owner.hp / owner.maxHp : 1;
  const opponentHpRatio = opponent.maxHp > 0 ? opponent.hp / opponent.maxHp : 1;

  // 斩龙断岳：目标气血低于阈值时伤害提升
  if (cond.execute && opponentHpRatio < cond.execute.threshold) {
    result.damageMult += cond.execute.value;
  }
  // 浴血狂澜：自身气血低于阈值时攻击提升
  if (cond.berserk && ownerHpRatio < cond.berserk.threshold) {
    result.attackMult += cond.berserk.value;
  }
  // 不动明王：自身气血高于阈值时防御提升
  if (cond.bulwark && ownerHpRatio > cond.bulwark.threshold) {
    result.defenseMult += cond.bulwark.value;
  }
  // 弑仙诛邪：对精英/BOSS 伤害提升
  if (cond.slayer && isEliteEnemy) {
    result.damageMult += cond.slayer.value;
  }
  return result;
}

/* ============================================================
 * 2. 攻击概率触发：连击 / 雷罚 / 灼烧 / 冻结 / 破甲
 * ============================================================ */

export interface AttackTriggerResult {
  /** 追击/雷罚的额外伤害（由调用方扣减目标气血） */
  extraDamage: number;
  /** 需要推入目标 debuff 列表的词条效果（灼烧 DoT / 破甲记录） */
  debuffs: Debuff[];
  /** 冻结回合数（0 表示未触发；调用方写入目标 frozenTurns） */
  freezeTurns: number;
  /** 追加到战斗日志的触发描述 */
  extraLog: string;
}

/**
 * 攻击命中后的概率触发判定（仅攻击者携带词条时生效）。
 * @param damage 本次命中造成的实际伤害（连击/雷罚按其比例追击）
 */
export function rollAttackTriggers(
  attacker: BattleUnit,
  target: BattleUnit,
  triggers: EquipmentTriggers | undefined,
  damage: number
): AttackTriggerResult {
  const result: AttackTriggerResult = { extraDamage: 0, debuffs: [], freezeTurns: 0, extraLog: '' };
  if (!triggers || damage <= 0) return result;

  const onAttack = triggers.onAttack;
  const logs: string[] = [];

  // 同类词条去重：目标已有同源效果时只刷新持续回合，不叠加（防止灼烧/破甲叠爆）

  // 剑气纵横：概率追击一次，造成 value 倍伤害
  if (onAttack.combo && Math.random() < onAttack.combo.chance) {
    const comboDamage = Math.max(1, Math.floor(damage * onAttack.combo.value));
    result.extraDamage += comboDamage;
    logs.push(`触发【剑气纵横】追击，造成 ${comboDamage} 点额外伤害！`);
  }

  // 雷罚天诛：概率追加一次雷系伤害
  if (onAttack.thunder && Math.random() < onAttack.thunder.chance) {
    const thunderDamage = Math.max(1, Math.floor(damage * onAttack.thunder.value));
    result.extraDamage += thunderDamage;
    logs.push(`触发【雷罚天诛】，轰落 ${thunderDamage} 点雷系伤害！`);
  }

  // 焚天炽焰：概率点燃目标（灼烧 DoT：每回合 value 倍攻击力固定伤害；已有同源灼烧则刷新时长）
  if (onAttack.burn && Math.random() < onAttack.burn.chance) {
    const existingBurn = target.debuffs.find(
      (d) => d.type === 'burn' && d.source === '装备词条'
    );
    if (existingBurn) {
      existingBurn.duration = Math.max(existingBurn.duration, onAttack.burn.duration);
    } else {
      const dotDamage = Math.max(1, Math.floor(attacker.attack * onAttack.burn.value));
      result.debuffs.push({
        id: genDebuffId('burn'),
        name: '焚天炽焰',
        type: 'burn',
        value: dotDamage, // 正值 = 固定数值掉血（与现有 debuff 结算语义一致）
        duration: onAttack.burn.duration,
        source: '装备词条',
        description: `焚天炽焰灼烧经脉，每回合受到 ${dotDamage} 点伤害`,
      });
      logs.push('触发【焚天炽焰】，目标被点燃！');
    }
  }

  // 开山裂石：概率降低目标防御（已有同源破甲则只刷新时长，防御不重复削减）
  if (onAttack.armorBreak && Math.random() < onAttack.armorBreak.chance) {
    const existingBreak = target.debuffs.find(
      (d) => d.type === 'armor_break' && d.source === '装备词条'
    );
    if (existingBreak) {
      existingBreak.duration = Math.max(existingBreak.duration, onAttack.armorBreak.duration);
    } else {
      const beforeDefense = target.defense;
      target.defense = Math.max(0, Math.floor(target.defense * (1 - onAttack.armorBreak.value)));
      result.debuffs.push({
        id: genDebuffId('armor_break'),
        name: '开山裂石',
        type: 'armor_break',
        value: onAttack.armorBreak.value,
        duration: onAttack.armorBreak.duration,
        source: '装备词条',
        description: `开山裂石震裂护体罡气，防御降低 ${Math.round(onAttack.armorBreak.value * 100)}%`,
      });
      logs.push(`触发【开山裂石】，目标防御降低（${beforeDefense} → ${target.defense}）！`);
    }
  }

  // 霜寒禁锢：概率冻结目标
  if (onAttack.freeze && Math.random() < onAttack.freeze.chance) {
    result.freezeTurns = Math.max(result.freezeTurns, onAttack.freeze.duration);
    logs.push('触发【霜寒禁锢】，目标被冻结！');
  }

  result.extraLog = logs.join(' ');
  return result;
}

/* ============================================================
 * 3. 防御侧结算：格挡 / 受暴击减免 / 减伤聚合 / 护盾 / 荆棘 / 受击回灵
 * ============================================================ */

export interface DefensiveAdjustOptions {
  /** 是否为技能伤害（破法真罡仅对技能伤害生效） */
  isSkill?: boolean;
  /** 目标现有 buff 的伤害减免比例（与词条减伤取 max，避免重复乘算） */
  buffDamageReduction?: number;
}

export interface DefensiveAdjustResult {
  /** 最终进入扣血的伤害（护盾已吸收） */
  damage: number;
  /** 是否触发四两拨千斤格挡 */
  blocked: boolean;
  /** 荆棘反噬反弹伤害（由调用方扣减攻击者气血） */
  reflect: number;
  /** 采气还灵回灵量（引擎内已直接加到 defender.mana，此处供日志展示） */
  spiritGain: number;
  /** 护盾吸收的伤害量 */
  shieldAbsorbed: number;
  /** 追加到战斗日志的触发描述 */
  log: string;
}

/**
 * 受击方防御词条结算（受击方携带词条时生效；与现有 buff 反弹/闪避逻辑并存）。
 * 顺序：格挡 → 受暴击减免 → 减伤聚合 → 护盾吸收 → 荆棘反噬 → 受击回灵。
 */
export function applyDefensiveAdjust(
  defender: BattleUnit,
  triggers: EquipmentTriggers | undefined,
  incomingDamage: number,
  isCrit: boolean,
  options: DefensiveAdjustOptions = {}
): DefensiveAdjustResult {
  const result: DefensiveAdjustResult = {
    damage: Math.max(0, Math.floor(incomingDamage)),
    blocked: false,
    reflect: 0,
    spiritGain: 0,
    shieldAbsorbed: 0,
    log: '',
  };
  if (!triggers || incomingDamage <= 0) return result;

  const logs: string[] = [];
  const passive = triggers.passive;
  const conditional = triggers.conditional;
  const onEvent = triggers.onEvent;

  // 四两拨千斤：概率将本次伤害乘以 value（0.5 = 减半）
  if (onEvent.block && Math.random() < onEvent.block.chance) {
    result.damage = Math.max(1, Math.floor(result.damage * onEvent.block.value));
    result.blocked = true;
    logs.push('触发【四两拨千斤】，格挡成功！');
  }

  // 金刚不坏：受到会心一击时伤害降低
  if (isCrit && conditional.critResist) {
    result.damage = Math.round(result.damage * (1 - conditional.critResist.value));
    logs.push('触发【金刚不坏】，暴击伤害降低！');
  }

  // 减伤聚合：不动如山（全部）/ 破法真罡（仅技能）与现有 buff damageReduction 取 max，上限 60%
  const triggerReduction = Math.max(
    passive.tenacity || 0,
    options.isSkill ? passive.spellGuard || 0 : 0
  );
  const totalReduction = Math.min(0.6, Math.max(triggerReduction, options.buffDamageReduction || 0));
  if (totalReduction > 0) {
    result.damage = Math.round(result.damage * (1 - totalReduction));
  }

  // 玄光庇护：护盾先扣，再扣气血（护盾不随回合重置）
  let remaining = result.damage;
  const currentShield = defender.shieldPool || 0;
  if (currentShield > 0 && remaining > 0) {
    const absorbed = Math.min(currentShield, remaining);
    defender.shieldPool = currentShield - absorbed;
    remaining -= absorbed;
    result.shieldAbsorbed = absorbed;
    logs.push(`【玄光庇护】护盾抵挡 ${absorbed} 点伤害！`);
  }
  result.damage = remaining;

  // 荆棘反噬：按实际承伤反弹（与 buff reflectDamage 叠加，由调用方结算）
  if (remaining > 0 && passive.thorns) {
    result.reflect = Math.max(1, Math.floor(remaining * passive.thorns));
  }

  // 采气还灵：受击回复灵力（直接写入 defender.mana，保证两模式一致）
  if (remaining > 0 && onEvent.hitSpirit) {
    result.spiritGain = Math.round(onEvent.hitSpirit.value);
    if (defender.maxMana !== undefined) {
      defender.mana = Math.min(defender.maxMana, (defender.mana || 0) + result.spiritGain);
    } else {
      defender.mana = (defender.mana || 0) + result.spiritGain;
    }
  }

  result.log = logs.join(' ');
  return result;
}

/* ============================================================
 * 4. 单位级常驻被动：速度 / 护盾池 / 回春 / 击杀回血 / 有效吸血
 * ============================================================ */

/**
 * 构建单位常驻被动（unit 构建后调用一次）：
 * 追风逐电速度加成、玄光庇护初始护盾池、冻结计数清零。
 */
export function buildUnitPassives(unit: BattleUnit, triggers: EquipmentTriggers | undefined): void {
  if (!triggers) {
    unit.frozenTurns = 0;
    return;
  }
  // 追风逐电：速度提升
  if (triggers.passive.swift) {
    unit.speed = Math.round(unit.speed * (1 + triggers.passive.swift));
  }
  // 玄光庇护：战斗开始获得 maxHp 比例的护盾
  unit.shieldPool = Math.floor(unit.maxHp * (triggers.passive.shield || 0));
  unit.frozenTurns = 0;
}

/**
 * 回合尾/行动周期结算回春妙术（常驻回血，护盾池不重置）。
 * @returns 实际回复量（0 表示未触发）
 */
export function settleEquipmentRegen(unit: BattleUnit): number {
  const regen = unit.triggers?.passive.regen;
  if (!regen || unit.hp <= 0) return 0;
  const healed = Math.floor(unit.maxHp * regen);
  unit.hp = Math.min(unit.maxHp, unit.hp + healed);
  return healed;
}

/**
 * 击杀回血（饮血归元）：击杀者携带词条且目标被击杀时调用。
 * @returns 实际回复量
 */
export function applyKillHeal(killer: BattleUnit): number {
  const killHeal = killer.triggers?.onEvent.killHeal;
  if (!killHeal || killer.hp <= 0) return 0;
  const healed = Math.floor(killer.maxHp * killHeal.value);
  killer.hp = Math.min(killer.maxHp, killer.hp + healed);
  return healed;
}

/**
 * 有效吸血比例：现有 buff lifeLeech 取最大 + 噬血狂化词条加成（可叠加）。
 */
export function getEffectiveLifeLeech(unit: BattleUnit): number {
  const buffLeech = unit.buffs.reduce((max, buff) => Math.max(max, buff.lifeLeech || 0), 0);
  return buffLeech + (unit.triggers?.passive.lifeLeechBoost || 0);
}
