/**
 * 战斗技能组装（单一来源）
 * 回合制战斗与快速战斗共用：玩家技能收集、灵力上限计算。
 * 从 turnBased.ts 抽出，保证两模式的技能池与资源规则完全一致。
 */
import {
  BattleSkill,
  Buff,
  ItemType,
  PlayerStats,
  Item,
} from '../../types';
import { CULTIVATION_ARTS, CULTIVATION_ART_BATTLE_SKILLS } from '../../constants/cultivation';
import { REALM_ORDER } from '../../constants/realms';
import { calculateAllCustomSpellBonuses } from '../customSpellService';
import {
  ARTIFACT_SKILLS_MAP,
  GRADE_MULTIPLIERS,
  GRADE_POWER_BONUS,
  WEAPON_SKILLS_MAP,
} from './constants';

/**
 * 为没有配置技能的功法生成默认技能
 */
export function generateDefaultSkillForArt(art: { id: string; name: string; type: string; grade: string; effects: any }): BattleSkill | null {
  // 根据功法类型和品级生成不同的技能
  const multiplier = GRADE_MULTIPLIERS[art.grade] || 1.0;
  const powerBonus = GRADE_POWER_BONUS[art.grade] || GRADE_POWER_BONUS['黄'];

  // 根据功法类型决定技能类型
  if (art.type === 'body') {
    // 体术类功法 -> 攻击技能
    // 消耗公式: 基础15 + 品级加成
    const bodyCostBonus: Record<string, number> = { '黄': 10, '玄': 25, '地': 45, '天': 75 };
    const skillCost = 15 + (bodyCostBonus[art.grade] || 10);

    const baseDamage = Math.round(30 * multiplier) + powerBonus.baseDamage;
    const damageMultiplier = 0.8 + (multiplier - 1) * 0.3 + powerBonus.damageMultiplier;

    return {
      id: `skill-${art.id}`,
      name: art.name,
      description: `施展${art.name}，对敌人造成伤害。`,
      type: 'attack',
      source: 'cultivation_art',
      sourceId: art.id,
      effects: [],
      cost: { mana: skillCost },
      cooldown: 0,
      maxCooldown: Math.max(2, Math.round(multiplier)),
      target: 'enemy',
      damage: {
        base: baseDamage,
        multiplier: damageMultiplier,
        type: 'physical',
        critChance: 0.1 + (multiplier - 1) * 0.05 + powerBonus.critChance,
        critMultiplier: 1.5 + (multiplier - 1) * 0.2 + powerBonus.critMultiplier,
      },
    };
  } else if (art.type === 'mental') {
    // 心法类功法 -> 根据效果决定技能类型
    if (art.effects?.expRate) {
      // 如果有修炼速度加成，生成Buff技能（提升属性）
      // 消耗公式: 基础20 + 品级加成
      const mentalBuffCostBonus: Record<string, number> = { '黄': 15, '玄': 30, '地': 55, '天': 90 };
      const skillCost = 20 + (mentalBuffCostBonus[art.grade] || 15);

      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `运转${art.name}，提升自身属性。`,
        type: 'buff',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [
          {
            type: 'buff',
            target: 'self',
            buff: {
              id: `${art.id}-buff`,
              name: art.name,
              type: 'attack',
              value: 0.1 * multiplier, // 10% * 品级倍数
              duration: 3,
              source: art.id,
              description: `攻击力提升${Math.round(10 * multiplier)}%`,
            },
          },
        ],
        cost: { mana: skillCost },
        cooldown: 0,
        maxCooldown: Math.max(3, Math.round(multiplier * 1.5)),
        target: 'self',
      };
    } else {
      // 其他心法 -> 法术攻击
      // 消耗公式: 基础25 + 品级加成
      const mentalAttackCostBonus: Record<string, number> = { '黄': 20, '玄': 40, '地': 70, '天': 110 };
      const skillCost = 25 + (mentalAttackCostBonus[art.grade] || 20);

      const baseDamage = Math.round(40 * multiplier) + powerBonus.baseDamage;
      const damageMultiplier = 1.0 + (multiplier - 1) * 0.4 + powerBonus.damageMultiplier;

      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `施展${art.name}，对敌人造成法术伤害。`,
        type: 'attack',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [],
        cost: { mana: skillCost },
        cooldown: 0,
        maxCooldown: Math.max(2, Math.round(multiplier)),
        target: 'enemy',
        damage: {
          base: baseDamage,
          multiplier: damageMultiplier,
          type: 'magical',
          critChance: 0.15 + (multiplier - 1) * 0.05 + powerBonus.critChance,
          critMultiplier: 2.0 + (multiplier - 1) * 0.3 + powerBonus.critMultiplier,
        },
      };
    }
  }

  return null;
}

/**
 * 获取玩家装备的物品列表
 */
export function getEquippedItems(player: PlayerStats): Item[] {
  const equipped: Item[] = [];
  Object.values(player.equippedItems).forEach((itemId) => {
    if (!itemId) return;
    const item = player.inventory.find((i) => i.id === itemId);
    if (item) equipped.push(item);
  });
  return equipped;
}

/**
 * 收集玩家全部可用战斗技能（功法 + 法宝/武器），回合制与快速战斗共用
 */
export function collectPlayerCombatSkills(player: PlayerStats): BattleSkill[] {
  const skills: BattleSkill[] = [];

  // 1. 功法技能
  player.cultivationArts.forEach((artId) => {
    const artSkills = CULTIVATION_ART_BATTLE_SKILLS[artId];
    if (artSkills) {
      // 如果功法有配置的技能，使用配置的技能
      skills.push(...artSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // 如果功法没有配置技能，自动生成默认技能
      const art = CULTIVATION_ARTS.find((a) => a.id === artId);
      if (art) {
        const defaultSkill = generateDefaultSkillForArt(art);
        if (defaultSkill) {
          skills.push({ ...defaultSkill, cooldown: 0 });
        }
      }
    }
  });

  // 2. 法宝/武器技能
  // 使用预构建的映射表，大幅提升查找性能
  getEquippedItems(player).forEach((item) => {
    // 优先使用物品自带的battleSkills
    if (item.battleSkills && item.battleSkills.length > 0) {
      skills.push(...item.battleSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // 如果没有，尝试从配置中获取
      if (item.type === ItemType.Artifact) {
        // 优先通过 id 查找（支持重命名后的法宝）
        const artifactSkills = ARTIFACT_SKILLS_MAP.get(item.id) ||
          ARTIFACT_SKILLS_MAP.get(item.name);
        if (artifactSkills) {
          skills.push(...artifactSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      } else if (item.type === ItemType.Weapon) {
        // 优先通过 id 查找
        const weaponSkills = WEAPON_SKILLS_MAP.get(item.id) ||
          WEAPON_SKILLS_MAP.get(item.name);
        if (weaponSkills) {
          skills.push(...weaponSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      }
    }
  });

  return skills;
}

/**
 * 收集玩家战斗开始时自带的永久 Buff（心法被动 + 自创神通），回合制与快速战斗共用
 */
export function collectPlayerInnateBuffs(player: PlayerStats): Buff[] {
  const buffs: Buff[] = [];
  const artsMap = new Map(CULTIVATION_ARTS.map((art) => [art.id, art]));

  // 应用被动效果（心法）
  if (player.activeArtId) {
    const activeArt = artsMap.get(player.activeArtId);
    if (activeArt && activeArt.type === 'mental') {
      const artSkills = CULTIVATION_ART_BATTLE_SKILLS[player.activeArtId];
      if (artSkills) {
        artSkills.forEach((skill) => {
          if (skill.type === 'buff' && skill.effects) {
            skill.effects.forEach((effect) => {
              if (effect.type === 'buff' && effect.buff) {
                buffs.push(effect.buff);
              }
            });
          }
        });
      }
    }
  }

  const spellBonuses = calculateAllCustomSpellBonuses(player);
  if (spellBonuses.critRate > 0) {
    buffs.push({
      id: 'custom-spell-crit',
      name: '自创神通·会心',
      type: 'crit',
      value: spellBonuses.critRate,
      duration: -1,
      source: 'custom-spell',
    });
  }
  if (spellBonuses.critDamage > 0 || spellBonuses.dodgeRate > 0 || spellBonuses.damageReduction > 0 || spellBonuses.lifeLeech > 0) {
    buffs.push({
      id: 'custom-spell-combat',
      name: '自创神通·战意',
      type: 'custom',
      value: 0,
      duration: -1,
      source: 'custom-spell',
      critDamage: spellBonuses.critDamage || undefined,
      dodge: spellBonuses.dodgeRate || undefined,
      damageReduction: spellBonuses.damageReduction || undefined,
      lifeLeech: spellBonuses.lifeLeech || undefined,
    });
  }

  return buffs;
}

/**
 * 玩家灵力上限（战斗开始时满值），回合制与快速战斗共用
 * MP = 基础值 60 + 境界加成 + 神识加成
 */
export function computePlayerMaxMana(player: PlayerStats, totalSpirit: number): number {
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const baseMana = 60; // 基础灵力值
  const realmManaBonus = realmIndex * 70 + Math.max(0, player.realmLevel - 1) * 15;
  const spiritManaBonus = Math.floor(totalSpirit * 0.8);
  return baseMana + realmManaBonus + spiritManaBonus;
}

/**
 * 汇总 Buff 对攻击/防御的百分比加成（累加语义）
 * attack/defense 类型 buff 的 value 为百分比（0.1 = +10%）
 */
export function sumPercentBuffs(buffs: Buff[], type: 'attack' | 'defense'): number {
  return buffs
    .filter((buff) => buff.type === type && typeof buff.value === 'number')
    .reduce((sum, buff) => sum + buff.value, 0);
}

/** 敌人灵力上限（与回合制初始化口径一致） */
export function computeEnemyMaxMana(enemyData: { attack: number; maxHp: number }): number {
  return Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05);
}
