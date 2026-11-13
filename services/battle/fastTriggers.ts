/**
 * 快速战斗触发器摘要引擎
 * 把回合制战斗（turnBased.ts）已实装的技能/Buff/Debuff 结算语义
 * 以摘要方式复刻到快速战斗，保证两模式结果一致。
 *
 * 对齐清单（与 turnBased 权威实现一一对应）：
 * - 技能伤害：calcDamage(base + 属性×倍率, 对应防御) + 技能暴击 + 0.9~1.1 浮动
 * - 治疗技能：base + maxHp × multiplier
 * - 攻击/防御 buff：百分比加成（sumPercentBuffs）
 * - 暴击/闪避/减伤/反弹/法防/吸血/无视防御 buff：max/累加语义见各函数
 * - DoT（毒/烧）：负值为最大气血百分比，正值为固定伤害
 * - heal/regen buff：每行动周期结算
 * - 冷却：每行动周期 -1，使用后设为 maxCooldown
 * - 未实装效果（stun/freeze/shield/weakness）：两模式一致地不生效，
 *   M4 机制词条池落地时在本文件统一扩展
 */
import { BattleSkill, BattleUnit, Buff, Debuff } from '../../types';
import { calcDamage } from './shared';
import { sumPercentBuffs } from './skillAssembly';

export interface FastSkillResult {
  damage: number; // 对目标造成的伤害
  heal: number; // 施法者回复量（治疗技能 + 吸血）
  reflected: number; // 施法者受到的反弹伤害
  dodged: boolean; // 目标闪避
  description: string;
}

/** 目标闪避判定（对齐 executeNormalAttack：buff 闪避与速度闪避取最大） */
function rollDodge(attacker: BattleUnit, target: BattleUnit): boolean {
  let maxDodge = 0;
  target.buffs.forEach((buff) => {
    if (buff.dodge && buff.dodge > maxDodge) maxDodge = buff.dodge;
  });
  // 速度差闪避：每点速度差 0.05%，上限 15%（与 shared.computeSpeedDodge 一致）
  const speedDiff = attacker.speed - target.speed;
  const speedDodge = speedDiff > 0 ? Math.min(0.15, speedDiff * 0.0005) : 0;
  maxDodge = Math.max(maxDodge, speedDodge);
  return maxDodge > 0 && Math.random() < maxDodge;
}

/** 施法者暴击倍率加成（累加 buff.critDamage） */
function critDamageBonus(caster: BattleUnit): number {
  return caster.buffs.reduce((sum, buff) => sum + (buff.critDamage || 0), 0);
}

/**
 * 结算一个技能（摘要版 executeSkill），并设置冷却。
 * 调用方负责扣灵力与把返回值写入双方 hp。
 */
export function applySkillFast(
  caster: BattleUnit,
  target: BattleUnit,
  skill: BattleSkill,
  damageCap?: number // 伤害上限（敌人技能用：不超过玩家 maxHp × 35%，防止一击秒杀）
): FastSkillResult {
  let damage = 0;
  let heal = 0;
  let reflected = 0;
  let dodged = false;

  if (skill.damage) {
    // 攻击 buff 生效：物理用攻击力、法术用神识（与回合制 executeSkill 一致）
    const atkBonus = sumPercentBuffs(caster.buffs, 'attack');
    const rawStat = skill.damage.type === 'magical' ? caster.spirit : caster.attack;
    const skillAttack = skill.damage.base + rawStat * (1 + atkBonus) * skill.damage.multiplier;
    // 物理防御受 defense buff 影响；法术穿 Spirit（不享受 defense buff）
    const defenseBonus = sumPercentBuffs(target.buffs, 'defense');
    const targetDefense =
      skill.damage.type === 'magical'
        ? target.spirit
        : Math.round(target.defense * (1 + defenseBonus));

    const baseDamage = calcDamage(Math.round(skillAttack), targetDefense);

    // 暴击：技能自带概率 + 暴击 buff，倍率 = 技能指定 + buff 加成
    let critChance = skill.damage.critChance || 0;
    caster.buffs.forEach((buff) => {
      if (buff.type === 'crit') critChance += buff.value;
    });
    const critMultiplier = (skill.damage.critMultiplier || 1.5) + critDamageBonus(caster);
    const isCrit = Math.random() < critChance;

    damage = isCrit ? Math.round(baseDamage * critMultiplier) : Math.round(baseDamage);
    // 随机浮动 0.9~1.1（与回合制一致）
    damage = Math.round(damage * (0.9 + Math.random() * 0.2));

    // 法术防御 buff（仅法术技能生效，取最大）
    if (skill.damage.type === 'magical') {
      const maxMagicDef = Math.max(
        0,
        ...target.buffs.map((b) => b.magicDefense || 0)
      );
      if (maxMagicDef > 0) damage = Math.round(damage * (1 - maxMagicDef));
    }
    // 伤害上限：传入 damageCap 时（敌人技能），钳制单次技能伤害
    if (damageCap !== undefined) {
      damage = Math.min(damage, Math.max(1, Math.floor(damageCap)));
    }

    // 闪避判定（含无视防御攻击者的处理：ignoreDefense 仅跳过防御状态，不跳过闪避，与回合制一致）
    dodged = rollDodge(caster, target);
    if (dodged) {
      damage = 0;
    } else {
      target.hp = Math.max(0, Math.floor(target.hp - damage));

      // 技能吸血（buff.lifeLeech 取最大）
      const skillLeech = caster.buffs.reduce(
        (max, buff) => Math.max(max, buff.lifeLeech || 0),
        0
      );
      if (damage > 0 && skillLeech > 0) {
        const leeched = Math.floor(damage * skillLeech);
        caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + leeched));
        heal += leeched;
      }

      // 反弹伤害（目标 reflectDamage 取最大）
      const maxReflect = Math.max(0, ...target.buffs.map((b) => b.reflectDamage || 0));
      if (maxReflect > 0) {
        reflected = Math.floor(damage * maxReflect);
        caster.hp = Math.max(0, Math.floor(caster.hp - reflected));
      }
    }
  }

  // 治疗计算：base + maxHp × multiplier
  if (skill.heal) {
    heal += Math.floor(skill.heal.base + caster.maxHp * skill.heal.multiplier);
    caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + skill.heal.base + caster.maxHp * skill.heal.multiplier));
  }

  // 应用 buff/debuff 效果（与回合制一致：免疫检查、不去重）
  skill.effects.forEach((effect) => {
    if (effect.type === 'buff' && effect.buff) {
      const unit = effect.target === 'self' ? caster : target;
      unit.buffs.push({ ...effect.buff });
    }
    if (effect.type === 'debuff' && effect.debuff) {
      const unit = effect.target === 'enemy' ? target : caster;
      const hasImmunity = unit.buffs.some((buff) => buff.immunity);
      if (!hasImmunity) {
        unit.debuffs.push({ ...effect.debuff });
      }
    }
  });

  // 设置冷却
  caster.cooldowns[skill.id] = skill.maxCooldown;

  return { damage, heal, reflected, dodged, description: skill.description };
}

/**
 * 行动周期结算：DoT、heal/regen buff、冷却递减、时长递减。
 * 语义对齐回合制 updateBattleStateAfterAction 的持续效果部分。
 */
export function settlePersistEffects(unit: BattleUnit): void {
  // Debuff：毒/烧掉血（负值=最大气血百分比，正值=固定伤害），时长递减
  unit.debuffs = unit.debuffs
    .map((debuff: Debuff) => {
      if (debuff.type === 'poison' || debuff.type === 'burn') {
        if (debuff.value < 0 && debuff.value > -1) {
          const hpLoss = Math.floor(unit.maxHp * Math.abs(debuff.value));
          unit.hp = Math.max(0, Math.floor(unit.hp - hpLoss));
        } else {
          unit.hp = Math.max(0, Math.floor(unit.hp - Math.floor(debuff.value)));
        }
      }
      return { ...debuff, duration: debuff.duration - 1 };
    })
    .filter((debuff) => debuff.duration > 0);

  // Buff：持续治疗 + regen，时长递减（-1 为永久）
  unit.buffs = unit.buffs
    .map((buff: Buff) => {
      if (buff.type === 'heal' && buff.duration > 0) {
        unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + Math.floor(buff.value)));
      }
      if (buff.regen && buff.regen > 0 && buff.duration > 0) {
        unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + Math.floor(unit.maxHp * buff.regen)));
      }
      return { ...buff, duration: buff.duration === -1 ? -1 : buff.duration - 1 };
    })
    .filter((buff) => buff.duration === -1 || buff.duration > 0);

  // 冷却递减
  Object.keys(unit.cooldowns).forEach((skillId) => {
    if (unit.cooldowns[skillId] > 0) {
      unit.cooldowns[skillId] -= 1;
    }
  });
}
