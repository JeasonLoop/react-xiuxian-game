import {
  AdventureResult,
  AdventureType,
  BattleUnit,
  BattleSkill,
  DifficultyMode,
  PlayerStats,
  RealmType,
} from '../../types';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { createEnemy } from './enemyFactory';
import { BattleEnemy, BattleResolution, BattleRoundLog } from './types';
import { ENEMY_SKILL_DAMAGE_CAP_RATIO, ELITE_REWARD_MULTIPLIER } from './constants';
import {
  calcDamage,
  computeCritChance,
  computeSpeedDodge,
  generateLoot,
  getBattleDifficulty,
  getExpAndStoneRewards,
  getRiskRewardMultiplier,
  handlePetAction,
  randomId,
} from './shared';
import {
  collectPlayerCombatSkills,
  collectPlayerInnateBuffs,
  computeEnemyMaxMana,
  computePlayerMaxMana,
  sumPercentBuffs,
} from './skillAssembly';
import { applySkillFast, settlePersistEffects } from './fastTriggers';

const safeNumber = (val: unknown, def: number = 0) => Number(val) || def;

/**
 * 根据基础最大值和当前值，按比例计算新的值
 */
const getScaledValue = (oldMax: number, current: number, newMax: number) => {
  const ratio = oldMax > 0 ? current / oldMax : 0;
  return Math.floor(newMax * ratio);
};

/**
 * 玩家技能决策（挂机自动逻辑）：
 * 低血量优先治疗，否则用期望伤害最高的攻击技能，否则上增益，无可用技能则普攻。
 */
function choosePlayerSkill(unit: BattleUnit): BattleSkill | null {
  const usable = unit.skills.filter((skill) => {
    if ((unit.cooldowns[skill.id] || 0) > 0) return false;
    if ((unit.mana || 0) < (skill.cost.mana || 0)) return false;
    // 条件技能：气血百分比门槛
    if (skill.conditions?.minHp && unit.hp / Math.max(1, unit.maxHp) < skill.conditions.minHp) {
      return false;
    }
    return true;
  });
  if (usable.length === 0) return null;

  const hpRatio = unit.hp / Math.max(1, unit.maxHp);
  // 低血量优先治疗技能
  if (hpRatio < 0.55) {
    const healSkill = usable.find((s) => s.heal);
    if (healSkill) return healSkill;
  }
  // 攻击技能：取期望伤害最高者（物理看攻击、法术看神识）
  const attackSkills = usable.filter((s) => s.damage);
  if (attackSkills.length > 0) {
    attackSkills.sort((a, b) => {
      const expected = (s: BattleSkill) =>
        (s.damage?.base || 0) +
        (s.damage?.type === 'magical' ? unit.spirit : unit.attack) * (s.damage?.multiplier || 0);
      return expected(b) - expected(a);
    });
    return attackSkills[0];
  }
  // 增益技能兜底（冷却与灵力天然限频）
  return usable.find((s) => s.type === 'buff') || null;
}

export const resolveBattleEncounter = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  realmName?: string,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string, // 指定的天地之魄BOSS ID（用于事件模板）
  difficultyMode: DifficultyMode = 'normal',
  presetEnemy?: BattleEnemy // 预生成的敌人（调用方已完成精英判定时传入，避免二次随机）
): Promise<BattleResolution> => {
  const enemy = presetEnemy ?? await createEnemy(
    player,
    adventureType,
    riskLevel,
    realmMinRealm,
    huntSectId,
    huntLevel,
    bossId,
    difficultyMode
  );
  const difficulty = getBattleDifficulty(adventureType, riskLevel, difficultyMode);
  // 使用getPlayerTotalStats计算实际最大血量（包含金丹法数、心法等加成）
  const totalStats = getPlayerTotalStats(player);
  const actualMaxHp = totalStats.maxHp;
  // 确保初始值为有效数字，防止NaN
  // 按比例调整血量：如果功法增加了最大血量，当前血量也应该按比例增加
  const initialPlayerHp = getScaledValue(safeNumber(player.maxHp, 1), safeNumber(player.hp, 0), actualMaxHp);
  const initialMaxHp = actualMaxHp;

  // 构建与回合制一致的战斗单元（技能/灵力/自带Buff 与 turnBased 共用同一组装逻辑）
  const playerUnit: BattleUnit = {
    id: 'player',
    name: player.name,
    realm: player.realm,
    hp: Math.max(0, Math.min(initialPlayerHp, initialMaxHp)),
    maxHp: initialMaxHp,
    attack: totalStats.attack,
    defense: totalStats.defense,
    speed: totalStats.speed,
    spirit: totalStats.spirit,
    buffs: collectPlayerInnateBuffs(player),
    debuffs: [],
    skills: collectPlayerCombatSkills(player),
    cooldowns: {},
    mana: computePlayerMaxMana(player, totalStats.spirit),
    maxMana: computePlayerMaxMana(player, totalStats.spirit),
    isDefending: false,
  };
  const enemyUnit: BattleUnit = {
    id: 'enemy',
    name: enemy.name,
    realm: enemy.realm,
    hp: safeNumber(enemy.maxHp),
    maxHp: safeNumber(enemy.maxHp),
    attack: safeNumber(enemy.attack),
    defense: safeNumber(enemy.defense),
    speed: safeNumber(enemy.speed),
    spirit: safeNumber(enemy.spirit),
    buffs: [],
    debuffs: [],
    skills: enemy.skills ?? [], // 敌人技能（精英/BOSS 必带，普通敌可能为空）
    cooldowns: {},
    mana: computeEnemyMaxMana(enemy),
    maxMana: computeEnemyMaxMana(enemy),
    isDefending: false,
  };

  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' = playerUnit.speed >= enemyUnit.speed ? 'player' : 'enemy';

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? (player.pets || []).find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却（如果还没有）
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet && !activePet.skillCooldowns) {
    petSkillCooldowns = {};
  } else if (activePet) {
    petSkillCooldowns = { ...activePet.skillCooldowns };
  }

  while (playerUnit.hp > 0 && enemyUnit.hp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';

    if (isPlayerTurn) {
      playerUnit.isDefending = false;

      // 技能决策：治疗 > 攻击 > 增益 > 普攻
      const chosenSkill = choosePlayerSkill(playerUnit);
      if (chosenSkill) {
        playerUnit.mana = (playerUnit.mana || 0) - (chosenSkill.cost.mana || 0);
        const result = applySkillFast(playerUnit, enemyUnit, chosenSkill);
        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: result.damage,
          crit: false, // 摘要结算的技能暴击信息并入伤害，不单独标记
          description: result.dodged
            ? `你施展${chosenSkill.name}，但被${enemy.title}${enemy.name}闪避了！`
            : result.damage > 0
              ? `你施展${chosenSkill.name}，造成 ${result.damage} 点伤害。${result.heal > 0 ? `（回复 ${result.heal} 气血）` : ''}`
              : `你运转${chosenSkill.name}，${result.heal > 0 ? `回复了 ${result.heal} 点气血。` : '灵光护体。'}`,
          playerHpAfter: playerUnit.hp,
          enemyHpAfter: enemyUnit.hp,
        });
      } else {
        // 普攻（与回合制 executeNormalAttack 同口径：攻击/防御 buff 生效）
        const effectiveAttack = Math.round(playerUnit.attack * (1 + sumPercentBuffs(playerUnit.buffs, 'attack')));
        const effectiveDefense = Math.round(enemyUnit.defense * (1 + sumPercentBuffs(enemyUnit.buffs, 'defense')));
        const damage = calcDamage(effectiveAttack, effectiveDefense);

        // 暴击：速度差公式 + 暴击 buff（与回合制一致）
        let extraCritChance = 0;
        let critMultiplier = 1.5;
        playerUnit.buffs.forEach((buff) => {
          if (buff.type === 'crit') extraCritChance += buff.value;
          if (buff.critDamage && buff.critDamage > 0) critMultiplier += buff.critDamage;
        });
        const critChance = computeCritChance(playerUnit.speed, enemyUnit.speed, extraCritChance);
        const crit = Math.random() < critChance;
        let finalDamage = crit ? Math.round(damage * critMultiplier) : damage;
        let isDodged = false;

        // 敌方闪避判定（速度差闪避，上限 15%）
        const enemyDodgeChance = computeSpeedDodge(playerUnit.speed, enemyUnit.speed);
        // 敌人防御状态：动态减伤 50%/40%/35%（与回合制 executeDefend 一致）
        if (enemyUnit.isDefending) {
          const ratio = effectiveAttack / Math.max(1, effectiveDefense);
          const defenseReduction = ratio > 3.0 ? 0.35 : ratio > 2.0 ? 0.4 : 0.5;
          finalDamage = Math.round(finalDamage * (1 - defenseReduction));
        }
        if (enemyDodgeChance > 0 && Math.random() < enemyDodgeChance) {
          finalDamage = 0;
          isDodged = true;
        } else {
          enemyUnit.hp = Math.max(0, enemyUnit.hp - finalDamage);
          // 普攻吸血（buff.lifeLeech 取最大，与回合制 executeNormalAttack 一致）
          const lifeLeech = playerUnit.buffs.reduce((max, buff) => Math.max(max, buff.lifeLeech || 0), 0);
          if (finalDamage > 0 && lifeLeech > 0) {
            playerUnit.hp = Math.min(playerUnit.maxHp, playerUnit.hp + Math.floor(finalDamage * lifeLeech));
          }
        }

        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: finalDamage,
          crit,
          description: isDodged
            ? `你发动灵力攻势，但被${enemy.title}${enemy.name}闪避了！`
            : `你发动灵力攻势，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
          playerHpAfter: playerUnit.hp,
          enemyHpAfter: enemyUnit.hp,
        });
      }

      // 玩家行动周期结算：DoT/持续治疗/冷却（与回合制 updateBattleStateAfterAction 一致）
      settlePersistEffects(playerUnit);

      // 玩家回合后，灵宠可以行动（附加攻击或释放技能）
      if (activePet && enemyUnit.hp > 0) {
        // 更新技能冷却
        Object.keys(petSkillCooldowns).forEach((skillId) => {
          if (petSkillCooldowns[skillId] > 0) {
            petSkillCooldowns[skillId]--;
          }
        });

        const { action, updatedEnemyHp, updatedPlayerHp, updatedCooldowns } = handlePetAction(
          activePet,
          { ...player, hp: playerUnit.hp } as PlayerStats,
          { hp: enemyUnit.hp, maxHp: enemyUnit.maxHp, defense: enemyUnit.defense, name: enemy.name, title: enemy.title },
          petSkillCooldowns,
          randomId,
          calcDamage,
          getPlayerTotalStats
        );

        enemyUnit.hp = updatedEnemyHp;
        playerUnit.hp = Math.min(playerUnit.maxHp, updatedPlayerHp);
        petSkillCooldowns = updatedCooldowns;
        rounds.push(action as BattleRoundLog);
      }
    } else {
      // 敌人回合（AI 摘要）：有可用技能时 20% 概率释放技能（与回合制 70/20/10 的技能分支对齐），
      // 否则 10% 防御，其余普攻
      const availableSkills = enemyUnit.skills.filter(
        (s) =>
          (enemyUnit.cooldowns[s.id] || 0) === 0 &&
          (!s.cost.mana || (enemyUnit.mana || 0) >= s.cost.mana)
      );
      if (availableSkills.length > 0 && Math.random() < 0.2) {
        const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        enemyUnit.mana = (enemyUnit.mana || 0) - (skill.cost.mana || 0);
        // 敌人技能伤害上限：单次不超过玩家最大气血的 35%（防止技能一击秒杀）
        const enemyDamageCap = Math.floor(playerUnit.maxHp * ENEMY_SKILL_DAMAGE_CAP_RATIO);
        const result = applySkillFast(enemyUnit, playerUnit, skill, enemyDamageCap);
        rounds.push({
          id: randomId(),
          attacker: 'enemy',
          damage: result.damage,
          crit: false,
          description: result.dodged
            ? `${enemy.title}${enemy.name}施展【${skill.name}】，被你闪避了！`
            : result.damage > 0
              ? `${enemy.title}${enemy.name}施展【${skill.name}】，对你造成 ${result.damage} 点伤害。`
              : `${enemy.title}${enemy.name}施展【${skill.name}】。`,
          playerHpAfter: playerUnit.hp,
          enemyHpAfter: enemyUnit.hp,
        });
      } else if (Math.random() < 0.1) {
        enemyUnit.isDefending = true;
        rounds.push({
          id: randomId(),
          attacker: 'enemy',
          damage: 0,
          crit: false,
          description: `${enemy.title}${enemy.name}凝神戒备，摆出了防御姿态。`,
          playerHpAfter: playerUnit.hp,
          enemyHpAfter: enemyUnit.hp,
        });
      } else {
        const effectiveAttack = Math.round(enemyUnit.attack * (1 + sumPercentBuffs(enemyUnit.buffs, 'attack')));
        const damage = calcDamage(effectiveAttack, playerUnit.defense);

        // 敌人暴击（与回合制一致：速度差公式，无技能加成）
        const critChance = computeCritChance(enemyUnit.speed, playerUnit.speed, 0);
        const crit = Math.random() < critChance;
        let finalDamage = crit ? Math.round(damage * 1.5) : damage;

        // 玩家闪避：buff 闪避与速度差闪避取最大
        let maxDodge = 0;
        playerUnit.buffs.forEach((buff) => {
          if (buff.dodge && buff.dodge > maxDodge) maxDodge = buff.dodge;
        });
        const dodgeChance = Math.max(maxDodge, computeSpeedDodge(enemyUnit.speed, playerUnit.speed));
        let isDodged = false;
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
          finalDamage = 0;
          isDodged = true;
        } else {
          // 玩家防御状态（快速战斗中玩家不主动防御，预留字段保持一致）
          if (playerUnit.isDefending) {
            const ratio = effectiveAttack / Math.max(1, playerUnit.defense);
            const defenseReduction = ratio > 3.0 ? 0.35 : ratio > 2.0 ? 0.4 : 0.5;
            finalDamage = Math.round(finalDamage * (1 - defenseReduction));
          }
          // 减伤 buff（取最大，与回合制一致）
          const maxReduction = playerUnit.buffs.reduce((max, buff) => Math.max(max, buff.damageReduction || 0), 0);
          finalDamage = Math.round(finalDamage * (1 - Math.min(0.6, maxReduction)));
          playerUnit.hp = Math.max(0, playerUnit.hp - finalDamage);

          // 反弹伤害（玩家 reflectDamage 取最大）
          const maxReflect = playerUnit.buffs.reduce((max, buff) => Math.max(max, buff.reflectDamage || 0), 0);
          if (finalDamage > 0 && maxReflect > 0) {
            enemyUnit.hp = Math.max(0, enemyUnit.hp - Math.floor(finalDamage * maxReflect));
          }
        }

        rounds.push({
          id: randomId(),
          attacker: 'enemy',
          damage: finalDamage,
          crit,
          description: isDodged
            ? `${enemy.title}${enemy.name}反扑，被你闪避了！`
            : `${enemy.title}${enemy.name}反扑，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
          playerHpAfter: playerUnit.hp,
          enemyHpAfter: enemyUnit.hp,
        });
      }

      // 敌人行动周期结算
      settlePersistEffects(enemyUnit);
    }

    if (playerUnit.hp <= 0 || enemyUnit.hp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyUnit.hp <= 0 && playerUnit.hp > 0;

  // 确保hpLoss是有效数字，防止NaN
  const playerHpBefore = Number(player.hp) || 0;
  const playerHpAfter = Number(playerUnit.hp) || 0;
  const hpLoss = Math.max(0, Math.floor(playerHpBefore - playerHpAfter));

  const rewardMultiplier =
    adventureType === 'secret_realm' ? getRiskRewardMultiplier(riskLevel) : 1.0;

  const { exp: baseRewardExp, stones: baseRewardStones } = getExpAndStoneRewards(

    player,
    adventureType,
    difficulty,
    rewardMultiplier,
    enemy.strengthMultiplier,
    difficultyMode
  );

  // 精英强敌：修为与灵石奖励 ×2（仅胜利结算时生效）
  const eliteRewardMultiplier = enemy.isElite ? ELITE_REWARD_MULTIPLIER : 1;
  const rewardExp = Math.round(baseRewardExp * eliteRewardMultiplier);
  const rewardStones = Math.round(baseRewardStones * eliteRewardMultiplier);

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成搜刮奖励
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(
      enemy.strengthMultiplier,
      adventureType,
      player.realm,
      riskLevel
    );
    lootItems.push(...loot);
  }

  // 生成更丰富的战斗描述
  const generateBattleSummary = (
    victory: boolean,
    enemy: { name: string; title: string },
    hpLoss: number,
    hasLoot: boolean,
    realmName?: string
  ): string => {
    const realmContext = realmName && adventureType === 'secret_realm' ? `在${realmName}中，` : "";
    const lootText = hasLoot ? (Math.random() < 0.5 ? "你仔细搜刮了敌人的遗物。" : "你从敌人身上找到了战利品。") : "";

    const victoryScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}展开激战。最终，你将其斩于剑下，但也耗费了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你遭遇了${enemy.title}${enemy.name}的袭击。经过一番殊死搏斗，你成功将其击败，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你与${enemy.title}${enemy.name}展开对决。最终，你凭借更强的实力将其斩杀，损失了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你祭出法宝，与${enemy.title}${enemy.name}展开对决。最终，你技高一筹，成功将其击杀，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你施展神通，与${enemy.title}${enemy.name}展开激战。最终，你抓住机会，一剑将其斩杀。耗费了 ${hpLoss} 点气血。${lootText}`,
    ];

    const defeatScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常艰难。对方实力强大，你拼尽全力仍不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你遭遇了强大的${enemy.title}${enemy.name}。面对其猛烈的攻击，你渐渐落入下风，只能带着伤势逃离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常激烈。对方的速度和力量远超预期，你无法取胜，只得选择撤退，损失了 ${hpLoss} 点气血。`,
    ];

    const scenarios = victory ? victoryScenarios : defeatScenarios;
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  const summary = generateBattleSummary(
    victory,
    enemy,
    hpLoss,
    lootItems.length > 0,
    realmName
  );

  // 确保hpChange是有效数字，防止NaN
  const hpChange = Math.floor(playerHpAfter - playerHpBefore);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  // 清理冷却时间为0的技能冷却（节省存储空间）
  const finalPetSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        finalPetSkillCooldowns[skillId] = petSkillCooldowns[skillId];
      }
    });
  }

  return {
    adventureResult,
    replay: {
      id: randomId(),
      adventureType,
      bossId: bossId || null,
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: playerHpBefore,
      playerHpAfter: playerHpAfter,
      summary,
      expChange,
      spiritChange,
    },
    petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
  };
};
