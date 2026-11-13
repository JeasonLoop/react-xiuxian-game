import {
  AdventureType,
  BattleAction,
  BattleSkill,
  BattleState,
  BattleUnit,
  Buff,
  Debuff,
  DifficultyMode,
  PlayerAction,
  PlayerStats,
  RealmType,
} from '../../types';
import {
  BATTLE_POTIONS,
  CULTIVATION_ARTS,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../../constants/index';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { createEnemy } from './enemyFactory';
import {
  collectPlayerCombatSkills,
  collectPlayerInnateBuffs,
  computeEnemyMaxMana,
  computePlayerMaxMana,
  sumPercentBuffs,
} from './skillAssembly';
import { ENEMY_SKILL_DAMAGE_CAP_RATIO } from './constants';
import { calcDamage, computeCritChance, computeSpeedDodge, handlePetAction, randomId } from './shared';
import { getPlayerEquipmentMechanicTriggers } from '../../utils/reforgeUtils';
import {
  applyDefensiveAdjust,
  applyKillHeal,
  buildUnitPassives,
  computeConditionalMultipliers,
  getEffectiveLifeLeech,
  rollAttackTriggers,
  settleEquipmentRegen,
} from './equipTriggerEngine';
import { applyBossUnitInit, checkBossPhase } from './bossPhases';

/**
 * 计算行动次数（基于速度差和神识差）
 * @param fasterSpeed 更快单位的速度
 * @param slowerSpeed 更慢单位的速度
 * @param fasterSpirit 更快单位的神识
 * @param slowerSpirit 更慢单位的神识
 * @returns 行动次数（1-5）
 */
const calculateActionCount = (
  fasterSpeed: number,
  slowerSpeed: number,
  fasterSpirit: number,
  slowerSpirit: number
): number => {
  // 确保速度值是有效数字，防止NaN
  const validFasterSpeed = Number(fasterSpeed) || 0;
  const validSlowerSpeed = Number(slowerSpeed) || 1; // 避免除零，默认至少为1
  const validFasterSpirit = Number(fasterSpirit) || 0;
  const validSlowerSpirit = Number(slowerSpirit) || 1; // 避免除零，默认至少为1

  // 计算速度和神识的综合行动力
  // 速度权重0.6，神识权重0.4
  const fasterActionPower = validFasterSpeed * 0.6 + validFasterSpirit * 0.4;
  const slowerActionPower = validSlowerSpeed * 0.6 + validSlowerSpirit * 0.4;

  if (fasterActionPower <= slowerActionPower) return 1; // 行动力不占优，只有1次行动

  const powerDiff = fasterActionPower - slowerActionPower;
  // 确保slowerActionPower至少为1，避免除零
  const safeSlowerPower = Math.max(1, slowerActionPower);
  const powerRatio = powerDiff / safeSlowerPower; // 行动力差比例

  // 基础1次 + 每50%行动力优势额外1次行动
  // 例如：行动力是敌人的1.5倍 = 2次行动，2倍 = 3次行动，3倍 = 4次行动
  const extraActions = Math.floor(powerRatio / 0.5);
  const totalActions = 1 + extraActions;

  // 最多5次行动（避免过于不平衡）
  return Math.min(5, Math.max(1, totalActions));
};

/**
 * 初始化回合制战斗
 */
export const initializeTurnBasedBattle = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  sectMasterId?: string | null,
  bossId?: string, // 指定的天地之魄BOSS ID（用于事件模板）
  difficultyMode: DifficultyMode = 'normal'
): Promise<BattleState> => {
  // 创建敌人（如果是追杀战斗，从 player 对象中获取追杀参数）
  const huntSectId = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntSectId : undefined;
  const huntLevel = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntLevel : undefined;
  const enemyData = await createEnemy(player, adventureType, riskLevel, realmMinRealm, huntSectId, huntLevel, bossId, difficultyMode);

  // 创建玩家战斗单位
  const playerUnit = createBattleUnitFromPlayer(player);

  // 创建敌人战斗单位
  const enemyUnit: BattleUnit = {
    id: 'enemy',
    name: enemyData.name,
    realm: enemyData.realm,
    hp: enemyData.maxHp,
    maxHp: enemyData.maxHp,
    attack: enemyData.attack,
    defense: enemyData.defense,
    speed: enemyData.speed,
    spirit: enemyData.spirit, // 使用敌人数据中的神识属性
    buffs: [],
    debuffs: [],
    skills: enemyData.skills ?? [], // 敌人技能（精英/BOSS 必带，AI 的技能分支自然生效）
    cooldowns: {},
    // 敌人MP也根据属性计算（与 skillAssembly.computeEnemyMaxMana 同口径）
    mana: computeEnemyMaxMana(enemyData),
    maxMana: computeEnemyMaxMana(enemyData),
    isDefending: false,
    frozenTurns: 0, // 霜寒禁锢冻结计数（敌人不携带装备词条）
  };

  // 秘境机制 BOSS：初始化阶段标记与第一阶段机制（如护盾）
  const bossEntryLog = applyBossUnitInit(enemyUnit, enemyData.bossEncounterId, playerUnit);

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    if (activePet.skillCooldowns) {
      petSkillCooldowns = { ...activePet.skillCooldowns };
    } else {
      petSkillCooldowns = {};
    }
  }

  // 确定先手
  const playerFirst = (playerUnit.speed || 0) >= enemyUnit.speed;

  const playerMaxActions = calculateActionCount(
    playerUnit.speed,
    enemyUnit.speed,
    playerUnit.spirit,
    enemyUnit.spirit
  );
  const enemyMaxActions = calculateActionCount(
    enemyUnit.speed,
    playerUnit.speed,
    enemyUnit.spirit,
    playerUnit.spirit
  );

  // 初始化战斗历史
  const initialHistory: BattleAction[] = [];

  // 秘境机制 BOSS：写入第一阶段登场日志
  if (bossEntryLog) {
    initialHistory.push({
      id: randomId(),
      round: 1,
      turn: 'enemy',
      actor: 'enemy',
      actionType: 'attack',
      result: {},
      description: bossEntryLog,
    });
  }

  // 如果玩家神识比对手高，添加震慑提示
  if (playerUnit.spirit > enemyUnit.spirit) {
    const spiritDiff = playerUnit.spirit - enemyUnit.spirit;
    const spiritRatio = spiritDiff / enemyUnit.spirit;
    // 如果神识优势超过20%，添加震慑日志
    if (spiritRatio >= 0.2) {
      const intimidateAction: BattleAction = {
        id: randomId(),
        round: 1,
        turn: 'player',
        actor: 'player',
        actionType: 'attack',
        result: {},
        description: `你的神识远超对手，对手被你震慑了！`,
      };
      initialHistory.push(intimidateAction);
    }
  }

  return {
    id: randomId(),
    round: 1,
    turn: playerFirst ? 'player' : 'enemy',
    player: playerUnit,
    enemy: enemyUnit,
    history: initialHistory,
    isPlayerTurn: playerFirst,
    waitingForPlayerAction: playerFirst,
    playerInventory: player.inventory, // 保存玩家背包
    playerActionsRemaining: playerFirst ? playerMaxActions : 0,
    enemyActionsRemaining: playerFirst ? 0 : enemyMaxActions,
    playerMaxActions,
    enemyMaxActions,
    enemyStrengthMultiplier: enemyData.strengthMultiplier, // 保存敌人强度倍数
    enemyIsElite: enemyData.isElite, // 是否为精英强敌（弹窗标识/禁用跳过/奖励翻倍）
    adventureType, // 保存历练类型
    riskLevel, // 保存风险等级
    bossId, // 保存BOSS ID
    activePet, // 保存激活的灵宠
    petSkillCooldowns, // 保存灵宠技能冷却
    elementalField: initializeElementalField(player), // 初始化五行领域
  };
};

/**
 * 初始化五行领域
 * 根据玩家和敌人的灵根属性决定初始领域
 */
function initializeElementalField(player: PlayerStats): BattleState['elementalField'] {
  const roots = player.spiritualRoots;
  const types: Array<'metal' | 'wood' | 'water' | 'fire' | 'earth'> = ['metal', 'wood', 'water', 'fire', 'earth'];

  // 找到最强的灵根
  let maxType = types[0];
  let maxValue = roots[maxType];

  types.forEach(type => {
    if (roots[type] > maxValue) {
      maxValue = roots[type];
      maxType = type;
    }
  });

  // 如果最强灵根超过 30，有概率开启领域
  if (maxValue > 30 && Math.random() < (maxValue / 100)) {
    return {
      type: maxType,
      intensity: Math.ceil(maxValue / 20),
      duration: 3 + Math.floor(maxValue / 25)
    };
  }

  return undefined;
}

/**
 * 从玩家数据创建战斗单位
 */
function createBattleUnitFromPlayer(player: PlayerStats): BattleUnit {
  // 获取包含心法加成的总属性
  const totalStats = getPlayerTotalStats(player);

  const totalAttack = totalStats.attack;
  const totalDefense = totalStats.defense;
  const totalSpirit = totalStats.spirit;
  const totalSpeed = totalStats.speed;

  // 收集技能与自带 Buff（与快速战斗共用同一组装逻辑，保证两模式一致）
  const skills = collectPlayerCombatSkills(player);
  const buffs = collectPlayerInnateBuffs(player);
  const maxMana = computePlayerMaxMana(player, totalSpirit);

  // 按比例调整血量：如果功法增加了最大血量，当前血量也应该按比例增加
  const baseMaxHp = Number(player.maxHp) || 1; // 避免除零
  const currentHp = Number(player.hp) || 0;
  const hpRatio = baseMaxHp > 0 ? currentHp / baseMaxHp : 0; // 计算血量比例
  const adjustedHp = Math.floor(totalStats.maxHp * hpRatio); // 按比例应用到新的最大血量

  const unit: BattleUnit = {
    id: 'player',
    name: player.name,
    realm: player.realm,
    hp: Math.min(adjustedHp, totalStats.maxHp),
    maxHp: totalStats.maxHp, // 使用实际最大血量（包含金丹法数加成等）
    attack: totalAttack,
    defense: totalDefense,
    speed: totalSpeed,
    spirit: totalSpirit,
    buffs,
    debuffs: [],
    skills,
    cooldowns: {},
    mana: maxMana,
    maxMana,
    isDefending: false,
  };

  // 装备机制词条：聚合触发器并应用常驻被动（追风逐电速度、玄光庇护护盾池）
  unit.triggers = getPlayerEquipmentMechanicTriggers(player);
  buildUnitPassives(unit, unit.triggers);

  return unit;
}

/**
 * 执行玩家行动
 */
export function executePlayerAction(
  battleState: BattleState,
  action: PlayerAction
): BattleState {
  if (!battleState.waitingForPlayerAction || battleState.playerActionsRemaining <= 0) {
    throw new Error('Not player turn or no actions remaining');
  }

  let newState = { ...battleState };
  let actionResult: BattleAction | null = null;

  // 霜寒禁锢：玩家被冻结时跳过整个行动阶段（等待行动前判定）
  if ((newState.player.frozenTurns || 0) > 0) {
    newState.player.frozenTurns = (newState.player.frozenTurns || 0) - 1;
    newState.history.push({
      id: randomId(),
      round: newState.round,
      turn: 'player',
      actor: 'player',
      actionType: 'attack',
      result: {},
      description: '你被【霜寒禁锢】冻结，无法行动！',
    });
    newState = updateBattleStateAfterAction(newState);
    newState.playerActionsRemaining = 0;
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    newState.enemyActionsRemaining = newState.enemyMaxActions;
    return newState;
  }

  switch (action.type) {
    case 'attack':
      actionResult = executeNormalAttack(newState, 'player', 'enemy');
      break;
    case 'skill':
      actionResult = executeSkill(newState, 'player', action.skillId, 'enemy');
      break;
    case 'item':
      actionResult = executeItem(newState, action.itemId);
      break;
    case 'advancedItem':
      actionResult = executeAdvancedItem(newState, action.itemType, action.itemId);
      break;
    case 'defend':
      actionResult = executeDefend(newState, 'player');
      break;
    case 'flee':
      actionResult = executeFlee(newState);
      // 逃跑成功则直接结束
      if (actionResult.description.includes('成功')) {
        return newState;
      }
      break;
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState);
  }

  // 减少剩余行动次数
  newState.playerActionsRemaining -= 1;

  // 玩家行动后，灵宠可以行动（如果敌人还没死）
  if (newState.activePet && newState.enemy.hp > 0) {
    // 更新灵宠技能冷却
    const petSkillCooldowns = newState.petSkillCooldowns || {};
    const newPetSkillCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        newPetSkillCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = newPetSkillCooldowns;

    const petAction = executePetAction(newState);
    if (petAction) {
      newState.history.push(petAction);
      newState = updateBattleStateAfterAction(newState);
    }
  }

  // 如果还有剩余行动次数，继续玩家回合；否则切换到敌人回合
  if (newState.playerActionsRemaining > 0) {
    // 继续玩家回合，可以再次行动
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
  } else {
    // 玩家回合结束，切换到敌人回合
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    newState.enemyActionsRemaining = newState.enemyMaxActions;
  }

  return newState;
}

/**
 * 执行敌人回合（AI）
 */
export function executeEnemyTurn(battleState: BattleState): BattleState {
  let newState = { ...battleState };

  // 秘境机制 BOSS：敌人回合开始时推进阶段机制（自毁倒计时/镜像自损/阶段切换）
  if (newState.enemy.bossEncounterId && newState.enemy.hp > 0) {
    const phaseLogs = checkBossPhase(newState.enemy, newState.player);
    phaseLogs.forEach((desc) => {
      newState.history.push({
        id: randomId(),
        round: newState.round,
        turn: 'enemy',
        actor: 'enemy',
        actionType: 'attack',
        result: {},
        description: desc,
      });
    });
    // BOSS 因自毁力竭 / 道消身殒而死亡：跳过本回合行动
    if (newState.enemy.hp <= 0) {
      newState.enemyActionsRemaining = 0;
    }
  }

  // 使用循环代替递归，处理敌人的多个行动点
  while (newState.enemyActionsRemaining > 0 && newState.enemy.hp > 0 && newState.player.hp > 0) {
    if (newState.waitingForPlayerAction) {
      break;
    }

    // 霜寒禁锢：敌人被冻结时跳过整个敌人回合
    if ((newState.enemy.frozenTurns || 0) > 0) {
      newState.enemy.frozenTurns = (newState.enemy.frozenTurns || 0) - 1;
      newState.history.push({
        id: randomId(),
        round: newState.round,
        turn: 'enemy',
        actor: 'enemy',
        actionType: 'attack',
        result: {},
        description: `${newState.enemy.name}被【霜寒禁锢】冻结，无法行动！`,
      });
      newState.enemyActionsRemaining = 0;
      break;
    }

    const enemy = newState.enemy;
    const actionRoll = Math.random();
    let actionResult: BattleAction | null = null;

    if (actionRoll < 0.7) {
      // 普通攻击
      actionResult = executeNormalAttack(newState, 'enemy', 'player');
    } else if (actionRoll < 0.9 && enemy.skills.length > 0) {
      // 使用技能（随机选择一个可用技能）
      const availableSkills = enemy.skills.filter(
        (s) => (enemy.cooldowns[s.id] || 0) === 0 && (!s.cost.mana || (enemy.mana || 0) >= s.cost.mana)
      );
      if (availableSkills.length > 0) {
        const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        actionResult = executeSkill(newState, 'enemy', skill.id, 'player');
      } else {
        actionResult = executeNormalAttack(newState, 'enemy', 'player');
      }
    } else {
      // 防御
      actionResult = executeDefend(newState, 'enemy');
    }

    if (actionResult) {
      newState.history.push(actionResult);
      newState = updateBattleStateAfterAction(newState);
    }

    // 减少剩余行动次数
    newState.enemyActionsRemaining -= 1;
  }

  // 敌人回合结束后，更新灵宠技能冷却（如果存在）
  if (newState.activePet && newState.petSkillCooldowns) {
    const petSkillCooldowns = newState.petSkillCooldowns;
    const updatedCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        updatedCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = updatedCooldowns;
  }

  // 切换到玩家回合
  if (newState.enemyActionsRemaining <= 0) {
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
    newState.round += 1;
    // 重新计算并重置玩家行动次数（速度和神识可能因为Buff/Debuff改变）
    newState.playerMaxActions = calculateActionCount(
      newState.player.speed,
      newState.enemy.speed,
      newState.player.spirit,
      newState.enemy.spirit
    );
    newState.enemyMaxActions = calculateActionCount(
      newState.enemy.speed,
      newState.player.speed,
      newState.enemy.spirit,
      newState.player.spirit
    );
    newState.playerActionsRemaining = newState.playerMaxActions;

    // 如果玩家行动次数为0（速度太慢），立即再次切换回敌人回合
    if (newState.playerActionsRemaining <= 0 && newState.enemy.hp > 0) {
      newState.waitingForPlayerAction = false;
      newState.turn = 'enemy';
      newState.enemyActionsRemaining = newState.enemyMaxActions;
      // 注意：这里需要再次进入循环，所以递归调用一次是安全的（因为 round 已经增加了，且这种情况极少连续发生）
      return executeEnemyTurn(newState);
    }
  }

  return newState;
}

/**
 * 执行普通攻击
 */
function executeNormalAttack(
  battleState: BattleState,
  attackerId: 'player' | 'enemy',
  targetId: 'player' | 'enemy'
): BattleAction {
  const attacker = attackerId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  // 攻击/防御 buff 生效：value 为百分比加成（如 +10% 攻击），与快速战斗口径一致
  const attackerBonus = sumPercentBuffs(attacker.buffs, 'attack');
  const targetDefenseBonus = sumPercentBuffs(target.buffs, 'defense');

  // 装备词条条件乘区：斩杀/狂暴/弑仙作用于攻击方，坚壁作用于防御方
  const isEliteTarget = targetId === 'enemy' && !!battleState.enemyIsElite;
  const attackerCond = computeConditionalMultipliers(attacker, target, attacker.triggers, isEliteTarget);
  const defenderCond = computeConditionalMultipliers(target, attacker, target.triggers, false);
  const effectiveAttack = Math.round(attacker.attack * (1 + attackerBonus) * attackerCond.attackMult);
  const effectiveDefense = Math.round(target.defense * (1 + targetDefenseBonus) * defenderCond.defenseMult);

  // 计算基础伤害
  const baseDamage = calcDamage(effectiveAttack, effectiveDefense);

  // 应用五行领域加成
  let elementalMultiplier = 1.0;
  if (battleState.elementalField) {
    const field = battleState.elementalField;
    // 假设玩家属性与领域相同有加成
    if (attackerId === 'player') {
      elementalMultiplier += (field.intensity * 0.05); // 每级强度增加 5% 伤害
    }
  }

  // 计算暴击（统一使用工具函数 computeCritChance，保证与快速战斗公式一致）
  const attackerSpeed = Number(attacker.speed) || 0;
  const targetSpeed = Number(target.speed) || 0;
  let critMultiplier = 1.5; // 基础暴击伤害倍率

  // 额外暴击加成：领域 + 攻击者增益
  let extraCritChance = 0;
  if (battleState.elementalField?.type === 'fire') {
    extraCritChance += (battleState.elementalField.intensity * 0.02);
  }

  // 预先收集攻击者增益
  attacker.buffs.forEach((buff) => {
    if (buff.type === 'crit') {
      extraCritChance += buff.value;
    }
    if (buff.critDamage && buff.critDamage > 0) {
      critMultiplier += buff.critDamage;
    }
  });

  // 暴击率上限35%、下限0，由 computeCritChance 内部统一处理
  const critChance = computeCritChance(attackerSpeed, targetSpeed, extraCritChance);
  const isCrit = Math.random() < critChance;
  const finalDamage = Math.round(
    (isCrit ? baseDamage * critMultiplier : baseDamage) * elementalMultiplier * attackerCond.damageMult
  );

  // 预先收集目标增益/减益
  let maxDodge = 0;
  let maxDamageReduction = 0;
  let maxReflectRatio = 0;
  const hasIgnoreDefense = attacker.buffs.some(buff => buff.ignoreDefense);

  target.buffs.forEach((buff) => {
    if (buff.dodge && buff.dodge > maxDodge) maxDodge = buff.dodge;
    if (buff.damageReduction && buff.damageReduction > maxDamageReduction) maxDamageReduction = buff.damageReduction;
    if (buff.reflectDamage && buff.reflectDamage > maxReflectRatio) maxReflectRatio = buff.reflectDamage;
  });

  // 速度提供基础闪避率：统一使用 computeSpeedDodge（每点速度差0.05%闪避，上限15%）
  const baseDodgeFromSpeed = computeSpeedDodge(attackerSpeed, targetSpeed);
  maxDodge = Math.max(maxDodge, baseDodgeFromSpeed);

  // 检查闪避
  const isDodged = maxDodge > 0 && Math.random() < maxDodge;


  if (isDodged) {
    return {
      id: randomId(),
      round: battleState.round,
      turn: attackerId,
      actor: attackerId,
      actionType: 'attack',
      target: targetId,
      result: {
        miss: true,
      },
      description:
        attackerId === 'player'
          ? `你发动攻击，但被${target.name}闪避了！`
          : `${attacker.name}攻击，但被你闪避了！`,
    };
  }

  // 应用防御状态（优化：根据攻击力和防御力比例动态调整减伤效果）
  let actualDamage = finalDamage;

  if (target.isDefending && !hasIgnoreDefense) {
    // 基础减伤50%，如果攻击力远高于防御力，减伤效果降低
    const attackDefenseRatio = attacker.attack / Math.max(1, target.defense);
    let defenseReduction = 0.5; // 基础减伤50%

    // 如果攻击力是防御力的2倍以上，减伤效果降低到40%
    if (attackDefenseRatio > 2.0) {
      defenseReduction = 0.4;
    }
    // 如果攻击力是防御力的3倍以上，减伤效果降低到35%
    else if (attackDefenseRatio > 3.0) {
      defenseReduction = 0.35;
    }
    // 如果防御力高于攻击力，减伤效果提高到60%
    else if (attackDefenseRatio < 1.0) {
      defenseReduction = 0.6;
    }

    actualDamage = Math.round(actualDamage * (1 - defenseReduction));
  } else if (hasIgnoreDefense) {
    // 无视防御，直接造成伤害
    actualDamage = finalDamage;
  }

  // 防御侧词条结算：格挡/受暴减免/不动如山/破法真罡/护盾/荆棘/受击回灵（与 buff 减伤取 max）
  const defAdjust = applyDefensiveAdjust(target, target.triggers, actualDamage, isCrit, {
    isSkill: false,
    buffDamageReduction: maxDamageReduction,
  });
  actualDamage = defAdjust.damage;

  // 更新目标血量（确保是整数）
  target.hp = Math.max(0, Math.floor(target.hp - actualDamage));

  let leechedHp = 0;
  const leechRatio = getEffectiveLifeLeech(attacker);
  if (actualDamage > 0 && leechRatio > 0) {
    leechedHp = Math.floor(actualDamage * leechRatio);
    attacker.hp = Math.min(attacker.maxHp, Math.floor(attacker.hp + leechedHp));
  }

  // 处理反弹伤害（如果目标有 reflectDamage buff）
  let reflectedDamage = 0;
  if (actualDamage > 0 && maxReflectRatio > 0) {
    reflectedDamage = Math.floor(actualDamage * maxReflectRatio);
    attacker.hp = Math.max(0, Math.floor(attacker.hp - reflectedDamage));
  }

  // 荆棘反噬：受击按实际承伤反弹（词条，与 buff 反弹叠加）
  if (defAdjust.reflect > 0) {
    reflectedDamage += defAdjust.reflect;
    attacker.hp = Math.max(0, Math.floor(attacker.hp - defAdjust.reflect));
  }

  // 装备词条攻击触发：连击追击/雷罚/灼烧/冻结/破甲 + 击杀回血（仅攻击者携带词条时生效）
  let triggerLog = '';
  if (attacker.triggers && actualDamage > 0) {
    if (target.hp > 0) {
      const attackTrigger = rollAttackTriggers(attacker, target, attacker.triggers, actualDamage);
      if (attackTrigger.extraDamage > 0) {
        target.hp = Math.max(0, Math.floor(target.hp - attackTrigger.extraDamage));
      }
      if (attackTrigger.debuffs.length > 0) {
        target.debuffs.push(...attackTrigger.debuffs);
      }
      if (attackTrigger.freezeTurns > 0) {
        target.frozenTurns = Math.max(target.frozenTurns || 0, attackTrigger.freezeTurns);
      }
      triggerLog = attackTrigger.extraLog;
    } else {
      const killHealed = applyKillHeal(attacker);
      if (killHealed > 0) {
        triggerLog = `触发【饮血归元】，回复 ${killHealed} 点气血。`;
      }
    }
  }


  // 构建描述
  let description = '';
  if (attackerId === 'player') {
    description = `你发动攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`;
    if (leechedHp > 0) {
      description += ` 神通汲取 ${leechedHp} 点气血。`;
    }
    if (reflectedDamage > 0) {
      description += ` ${target.name}的反弹效果对你造成了 ${reflectedDamage} 点伤害！`;
    }
  } else {
    description = `${attacker.name}攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`;
    if (leechedHp > 0) {
      description += ` 汲取了 ${leechedHp} 点气血。`;
    }
    if (reflectedDamage > 0) {
      description += ` 你的反弹效果对${attacker.name}造成了 ${reflectedDamage} 点伤害！`;
    }
  }

  // 追加装备词条触发说明（防御方格挡/护盾/回灵 + 攻击方追击/灼烧/冻结等）
  const extraDescription = [defAdjust.log, triggerLog].filter(Boolean).join(' ');
  if (extraDescription) {
    description += ` ${extraDescription}`;
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: attackerId,
    actor: attackerId,
    actionType: 'attack',
    target: targetId,
    result: {
      damage: actualDamage,
      crit: isCrit,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * 执行技能
 */
function executeSkill(
  battleState: BattleState,
  casterId: 'player' | 'enemy',
  skillId: string,
  targetId: 'player' | 'enemy'
): BattleAction {
  const caster = casterId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  const skill = caster.skills.find((s) => s.id === skillId);
  if (!skill) {
    throw new Error(`Skill ${skillId} not found`);
  }

  // 检查冷却
  if ((caster.cooldowns[skillId] || 0) > 0) {
    throw new Error(`Skill ${skillId} is on cooldown`);
  }

  // 检查消耗
  if (skill.cost.mana && (caster.mana || 0) < skill.cost.mana) {
    throw new Error(`灵力不足！需要 ${skill.cost.mana} 点灵力，当前只有 ${caster.mana || 0} 点。`);
  }

  // 消耗资源
  if (skill.cost.mana) {
    caster.mana = (caster.mana || 0) - skill.cost.mana;
  }

  // 执行技能效果
  let damage = 0;
  let heal = 0;
  let reflectedDamage = 0;
  let equipmentLog = ''; // 装备词条触发说明（攻击触发 + 防御触发）
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];

  // 伤害计算（统一使用calcDamage函数，确保与普通攻击一致）
  if (skill.damage) {
    const base = skill.damage.base;
    const multiplier = skill.damage.multiplier;
    // 攻击 buff 生效：物理用攻击力、法术用神识，均为百分比加成（与普攻口径一致）
    const atkBonus = sumPercentBuffs(caster.buffs, 'attack');
    const rawStatValue =
      skill.damage.type === 'magical' ? caster.spirit : caster.attack;

    // 装备词条条件乘区：斩杀/狂暴/弑仙作用于施法方，坚壁作用于受击方（仅物理防御）
    const isEliteTarget = targetId === 'enemy' && !!battleState.enemyIsElite;
    const casterCond = computeConditionalMultipliers(caster, target, caster.triggers, isEliteTarget);
    const targetCond = computeConditionalMultipliers(target, caster, target.triggers, false);
    const statValue = rawStatValue * (1 + atkBonus) * casterCond.attackMult;
    // 计算技能的基础攻击力（用于伤害计算）
    const skillAttack = base + statValue * multiplier;

    // 根据伤害类型选择对应的防御属性；物理防御受 defense buff 影响
    const defenseBonus = sumPercentBuffs(target.buffs, 'defense');
    const targetDefense =
      skill.damage.type === 'magical'
        ? target.spirit
        : Math.round(target.defense * (1 + defenseBonus) * targetCond.defenseMult);

    // 使用统一的伤害计算函数
    const baseDamage = calcDamage(skillAttack, targetDefense);

    // 计算暴击
    let critChance = skill.damage.critChance || 0;
    // 应用Buff
    caster.buffs.forEach((buff) => {
      if (buff.type === 'crit') {
        critChance += buff.value;
      }
    });
    const isCrit = Math.random() < critChance;

    // 计算暴击伤害倍率（基础1.5倍或技能指定倍率，加上buff加成）
    let critMultiplier = skill.damage.critMultiplier || 1.5;
    caster.buffs.forEach((buff) => {
      if (buff.critDamage && buff.critDamage > 0) {
        critMultiplier += buff.critDamage;
      }
    });

    // 计算基础伤害（包括暴击）
    damage = isCrit
      ? Math.round(baseDamage * critMultiplier)
      : Math.round(baseDamage);

    // 添加随机伤害浮动（0.9-1.1倍）
    const randomMultiplier = 0.9 + Math.random() * 0.2; // 0.9-1.1之间的随机数
    damage = Math.round(damage * randomMultiplier);

    // 装备词条伤害乘区：斩龙断岳/弑仙诛邪
    damage = Math.round(damage * casterCond.damageMult);

    // 应用法术防御buff（仅对法术技能生效）
    if (skill.damage.type === 'magical') {
      if (target.buffs.some(buff => buff.magicDefense && buff.magicDefense > 0)) {
        const maxMagicDefense = Math.max(...target.buffs
          .filter(buff => buff.magicDefense && buff.magicDefense > 0)
          .map(buff => buff.magicDefense!));
        // 法术防御buff提供百分比减伤，直接作用于最终伤害
        damage = Math.round(damage * (1 - maxMagicDefense));
      }
    }

    // 确保伤害至少为1（除非完全免疫）
    damage = Math.max(1, Math.round(damage));

    // 检查闪避
    let isDodged = false;
    let maxDodge = 0;
    // 速度提供基础闪避率：每点速度差提供0.05%闪避，上限15%
    const speedDiff = Math.max(0, (Number(target.speed) || 0) - (Number(caster.speed) || 0));
    maxDodge = Math.min(0.15, speedDiff * 0.0005);
    // Buff闪避
    if (target.buffs.some(buff => buff.dodge && buff.dodge > 0)) {
      const buffDodge = Math.max(...target.buffs
        .filter(buff => buff.dodge && buff.dodge > 0)
        .map(buff => buff.dodge!));
      maxDodge = Math.max(maxDodge, buffDodge);
    }
    if (maxDodge > 0) {
      isDodged = Math.random() < maxDodge;
    }

    if (isDodged) {
      return {
        id: randomId(),
        round: battleState.round,
        turn: casterId,
        actor: casterId,
        actionType: 'skill',
        skillId,
        target: targetId,
        result: {
          miss: true,
          manaCost: skill.cost.mana,
        },
        description: generateSkillDescription(skill, caster, target, 0, 0) + ` 但被${target.name}闪避了！`,
      };
    }

    // 检查攻击者是否有无视防御buff
    const hasIgnoreDefense = caster.buffs.some(buff => buff.ignoreDefense);

    // 应用防御状态减伤（优化：与普通攻击保持一致，动态调整减伤效果）
    if (target.isDefending && !hasIgnoreDefense) {
      // 基础减伤50%，如果攻击力远高于防御力，减伤效果降低
      const skillAttackValue = skill.damage.type === 'magical' ? caster.spirit : caster.attack;
      const targetDefenseValue = skill.damage.type === 'magical' ? target.spirit : target.defense;
      const attackDefenseRatio = skillAttackValue / Math.max(1, targetDefenseValue);
      let defenseReduction = 0.5; // 基础减伤50%

      // 如果攻击力是防御力的2倍以上，减伤效果降低到40%
      if (attackDefenseRatio > 2.0) {
        defenseReduction = 0.4;
      }
      // 如果攻击力是防御力的3倍以上，减伤效果降低到35%
      else if (attackDefenseRatio > 3.0) {
        defenseReduction = 0.35;
      }
      // 如果防御力高于攻击力，减伤效果提高到60%
      else if (attackDefenseRatio < 1.0) {
        defenseReduction = 0.6;
      }

      damage = Math.round(damage * (1 - defenseReduction));
    }
    // 无视防御时直接造成全额伤害，跳过减免判定

    // 敌人技能伤害上限：单次不超过玩家最大气血的 35%（防止技能一击秒杀）
    if (casterId === 'enemy') {
      const damageCap = Math.floor(target.maxHp * ENEMY_SKILL_DAMAGE_CAP_RATIO);
      if (damage > damageCap) damage = damageCap;
    }

    // 防御侧词条结算：格挡/受暴减免/不动如山/破法真罡/护盾/荆棘/受击回灵（与 buff 减伤取 max）
    const buffDamageReduction = target.buffs.reduce(
      (max, buff) => Math.max(max, buff.damageReduction || 0),
      0
    );
    const defAdjust = applyDefensiveAdjust(target, target.triggers, damage, isCrit, {
      isSkill: true,
      buffDamageReduction,
    });
    damage = defAdjust.damage;

    target.hp = Math.max(0, Math.floor(target.hp - damage));

    const skillLeech = getEffectiveLifeLeech(caster);
    if (damage > 0 && skillLeech > 0) {
      const leeched = Math.floor(damage * skillLeech);
      caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + leeched));
      heal += leeched;
    }

    // 处理反弹伤害（如果目标有 reflectDamage buff）
    if (damage > 0 && target.buffs.some(buff => buff.reflectDamage && buff.reflectDamage > 0)) {
      // 找到最高的反弹伤害比例
      const maxReflectRatio = Math.max(...target.buffs
        .filter(buff => buff.reflectDamage && buff.reflectDamage > 0)
        .map(buff => buff.reflectDamage!));

      if (maxReflectRatio > 0) {
        reflectedDamage = Math.floor(damage * maxReflectRatio);
        caster.hp = Math.max(0, Math.floor(caster.hp - reflectedDamage));
      }
    }

    // 荆棘反噬：受击按实际承伤反弹（词条，与 buff 反弹叠加）
    if (defAdjust.reflect > 0) {
      reflectedDamage += defAdjust.reflect;
      caster.hp = Math.max(0, Math.floor(caster.hp - defAdjust.reflect));
    }

    // 装备词条攻击触发：连击追击/雷罚/灼烧/冻结/破甲 + 击杀回血（仅施法方携带词条时生效）
    let attackTriggerLog = '';
    if (caster.triggers && damage > 0) {
      if (target.hp > 0) {
        const attackTrigger = rollAttackTriggers(caster, target, caster.triggers, damage);
        if (attackTrigger.extraDamage > 0) {
          target.hp = Math.max(0, Math.floor(target.hp - attackTrigger.extraDamage));
        }
        if (attackTrigger.debuffs.length > 0) {
          target.debuffs.push(...attackTrigger.debuffs);
        }
        if (attackTrigger.freezeTurns > 0) {
          target.frozenTurns = Math.max(target.frozenTurns || 0, attackTrigger.freezeTurns);
        }
        attackTriggerLog = attackTrigger.extraLog;
      } else {
        const killHealed = applyKillHeal(caster);
        if (killHealed > 0) {
          attackTriggerLog = `触发【饮血归元】，回复 ${killHealed} 点气血。`;
        }
      }
    }

    equipmentLog = [defAdjust.log, attackTriggerLog].filter(Boolean).join(' ');
  }

  // 治疗计算
  if (skill.heal) {
    const base = skill.heal.base;
    const multiplier = skill.heal.multiplier;
    heal = Math.floor(base + caster.maxHp * multiplier);
    caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + heal));
  }

  // 应用技能效果
  skill.effects.forEach((effect) => {
    if (effect.type === 'buff' && effect.buff) {
      const targetUnit = effect.target === 'self' ? caster : target;
      targetUnit.buffs.push({ ...effect.buff });
    }
    if (effect.type === 'debuff' && effect.debuff) {
      const targetUnit = effect.target === 'enemy' ? target : caster;
      // 检查免疫
      const hasImmunity = targetUnit.buffs.some(buff => buff.immunity);
      if (!hasImmunity) {
        targetUnit.debuffs.push({ ...effect.debuff });
      }
    }
  });

  // 设置冷却
  caster.cooldowns[skillId] = skill.maxCooldown;

  // 生成描述（包含反弹伤害信息）
  let description = generateSkillDescription(skill, caster, target, damage, heal);
  if (reflectedDamage > 0) {
    if (casterId === 'enemy') {
      description += ` 你的反弹效果对${caster.name}造成了 ${reflectedDamage} 点伤害！`;
    } else {
      description += ` ${target.name}的反弹效果对你造成了 ${reflectedDamage} 点伤害！`;
    }
  }

  // 追加装备词条触发说明
  if (equipmentLog) {
    description += ` ${equipmentLog}`;
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: casterId,
    actor: casterId,
    actionType: 'skill',
    skillId,
    target: targetId,
    result: {
      damage,
      heal,
      buffs,
      debuffs,
      manaCost: skill.cost.mana,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * 执行使用进阶物品
 */
function executeAdvancedItem(
  battleState: BattleState,
  itemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule' | 'soulArt',
  itemId: string
): BattleAction {
  const player = battleState.player;
  const enemy = battleState.enemy;

  // 根据类型获取进阶物品
  let advancedItem: any = null;
  switch (itemType) {
    case 'foundationTreasure':
      advancedItem = FOUNDATION_TREASURES[itemId];
      break;
    case 'heavenEarthEssence':
      advancedItem = HEAVEN_EARTH_ESSENCES[itemId];
      break;
    case 'heavenEarthMarrow':
      advancedItem = HEAVEN_EARTH_MARROWS[itemId];
      break;
    case 'longevityRule':
      advancedItem = LONGEVITY_RULES[itemId];
      break;
    case 'soulArt':
      advancedItem = CULTIVATION_ARTS.find(art => art.id === itemId);
      break;
  }

  if (!advancedItem || !advancedItem.battleEffect) {
    throw new Error(`Advanced item ${itemId} not found or has no battle effect`);
  }

  const effect = advancedItem.battleEffect;
  let damage = 0;
  let heal = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];
  let description = '';

  // 检查冷却（使用battleState中的冷却记录）
  const cooldownKey = `advanced_${itemType}_${itemId}`;
  if ((battleState.player.cooldowns[cooldownKey] || 0) > 0) {
    throw new Error(`${advancedItem.name}还在冷却中`);
  }

  // 检查消耗
  if (effect.cost.lifespan) {
    // 寿命消耗在战斗结束后处理，这里只记录
    // 实际应该在战斗结束后从playerStats中扣除
  }
  if (effect.cost.maxHp) {
    const maxHpCost = typeof effect.cost.maxHp === 'number' && effect.cost.maxHp < 1
      ? Math.floor(player.maxHp * effect.cost.maxHp)
      : (effect.cost.maxHp || 0);
    player.maxHp = Math.max(1, player.maxHp - maxHpCost);
    player.hp = Math.min(player.hp, player.maxHp); // 调整当前HP不超过最大HP
  }
  if (effect.cost.hp) {
    player.hp = Math.max(1, player.hp - effect.cost.hp);
  }
  if (effect.cost.spirit) {
    player.mana = Math.max(0, (player.mana || 0) - effect.cost.spirit);
  }

  // 应用效果
  if (effect.type === 'damage' && effect.effect.damage) {
    const dmg = effect.effect.damage;
    let baseDamage = 0;

    if (dmg.base) {
      baseDamage = dmg.base;
    }
    if (dmg.multiplier) {
      baseDamage += player.attack * dmg.multiplier;
    }
    if (dmg.percentOfMaxHp) {
      baseDamage += player.maxHp * dmg.percentOfMaxHp;
    }
    if (dmg.percentOfLifespan) {
      // 寿命百分比伤害（需要从playerStats获取，这里简化处理）
      baseDamage += player.maxHp * dmg.percentOfLifespan * 0.1; // 简化：用最大HP的10%代表寿命
    }

    // 应用对邪魔的伤害倍率（如果敌人是邪魔类型）
    const isDemon = enemy.name.includes('魔') || enemy.name.includes('邪') || enemy.name.includes('鬼') ||
                    enemy.name.includes('妖') || enemy.name.includes('怨') || enemy.name.includes('恶');
    if (dmg.demonMultiplier && isDemon) {
      baseDamage = Math.floor(baseDamage * dmg.demonMultiplier);
    }

    // 计算最终伤害
    if (dmg.ignoreDefense) {
      // 支持百分比无视防御（0-1之间的数字）或完全无视（true）
      const ignoreRatio = typeof dmg.ignoreDefense === 'number' ? dmg.ignoreDefense : 1;
      const effectiveDefense = enemy.defense * (1 - ignoreRatio);
      damage = Math.floor(Math.max(1, baseDamage - effectiveDefense * 0.5));
    } else {
      damage = Math.floor(Math.max(1, baseDamage - enemy.defense * 0.5));
    }

    // 应用必定暴击
    let isCrit = false;
    if (dmg.guaranteedCrit) {
      isCrit = true;
      damage = Math.floor(damage * 1.5); // 基础暴击倍率1.5
    }

    enemy.hp = Math.max(0, enemy.hp - damage);
    description = `${effect.name}！对${enemy.name}造成了 ${damage}${isCrit ? '（暴击）' : ''} 点伤害！`;
  }

  if (effect.type === 'heal' && effect.effect.heal) {
    const healEffect = effect.effect.heal;
    if (healEffect.base) {
      heal = healEffect.base;
    }
    if (healEffect.percentOfMaxHp) {
      heal += Math.floor(player.maxHp * healEffect.percentOfMaxHp);
    }
    player.hp = Math.min(player.maxHp, player.hp + heal);
    description = `${effect.name}！恢复了 ${heal} 点气血！`;
  }

  if (effect.type === 'buff' && effect.effect.buff) {
    const buffEffect = effect.effect.buff;
    const buff: Buff = {
      id: `advanced_${itemId}_${Date.now()}`,
      name: effect.name,
      type: 'custom',
      value: 0,
      duration: buffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (buffEffect.attack) {
      player.attack = Math.floor(player.attack * (1 + buffEffect.attack));
    }
    if (buffEffect.defense) {
      player.defense = Math.floor(player.defense * (1 + buffEffect.defense));
    }
    if (buffEffect.speed) {
      player.speed = Math.floor(player.speed * (1 + buffEffect.speed));
    }
    if (buffEffect.critChance) {
      // 暴击率加成通过buff记录
      buff.type = 'crit';
      buff.value = buffEffect.critChance;
    }
    if (buffEffect.critDamage) {
      // 暴击伤害加成
      buff.critDamage = buffEffect.critDamage;
    }
    if (buffEffect.reflectDamage) {
      // 反弹伤害比例
      buff.reflectDamage = buffEffect.reflectDamage;
    }
    if (buffEffect.spirit) {
      // 神识加成
      player.spirit = Math.floor(player.spirit * (1 + buffEffect.spirit));
    }
    if (buffEffect.physique) {
      // 体魄加成（体魄影响防御和生命）
      player.defense = Math.floor(player.defense * (1 + buffEffect.physique * 0.5));
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.physique * 0.3));
      player.hp = Math.min(player.maxHp, Math.floor(player.hp * (1 + buffEffect.physique * 0.3)));
    }
    if (buffEffect.maxHp) {
      // 最大气血加成
      const oldMaxHp = player.maxHp;
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.maxHp));
      // 按比例增加当前HP
      const hpRatio = player.hp / oldMaxHp;
      player.hp = Math.floor(player.maxHp * hpRatio);
    }
    if (buffEffect.revive) {
      // 复活标记
      buff.revive = buffEffect.revive;
    }
    if (buffEffect.dodge !== undefined) {
      // 闪避率加成
      buff.dodge = buffEffect.dodge;
    }
    if (buffEffect.ignoreDefense) {
      // 攻击无视防御
      buff.ignoreDefense = buffEffect.ignoreDefense;
    }
    if (buffEffect.regen) {
      // 每回合恢复
      buff.regen = buffEffect.regen;
    }
    if (buffEffect.damageReduction) {
      // 伤害减免
      buff.damageReduction = buffEffect.damageReduction;
    }
    if (buffEffect.immunity) {
      // 免疫所有负面状态
      buff.immunity = buffEffect.immunity;
    }
    if (buffEffect.cleanse) {
      // 清除所有负面状态
      player.debuffs = [];
    }
    if (buffEffect.magicDefense) {
      // 法术防御加成（影响神识防御）
      buff.magicDefense = buffEffect.magicDefense;
    }

    player.buffs.push(buff);
    buffs.push(buff);
    description = `${effect.name}！获得了强大的增益效果！`;
  }

  if (effect.type === 'debuff' && effect.effect.debuff) {
    const debuffEffect = effect.effect.debuff;
    const debuff: Debuff = {
      id: `advanced_${itemId}_debuff_${Date.now()}`,
      name: effect.name,
      type: 'weakness',
      value: 0,
      duration: debuffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (debuffEffect.attack) {
      enemy.attack = Math.floor(enemy.attack * (1 - debuffEffect.attack));
    }
    if (debuffEffect.defense) {
      enemy.defense = Math.floor(enemy.defense * (1 - debuffEffect.defense));
    }
    if (debuffEffect.speed) {
      enemy.speed = Math.floor(enemy.speed * (1 + debuffEffect.speed)); // speed是负数，所以用加法
    }
    if (debuffEffect.spirit) {
      enemy.spirit = Math.floor(enemy.spirit * (1 + debuffEffect.spirit)); // spirit是负数，所以用加法
    }
    if (debuffEffect.hp) {
      // 持续掉血（负数表示损失）
      debuff.type = 'poison'; // 使用poison类型表示持续掉血
      debuff.value = debuffEffect.hp; // 存储百分比值
    }

    // 检查免疫
    const hasImmunity = enemy.buffs.some(buff => buff.immunity);
    if (!hasImmunity) {
      enemy.debuffs.push(debuff);
      debuffs.push(debuff);
      description = `${effect.name}！${enemy.name}受到了削弱效果！`;
    } else {
      description = `${effect.name}！但${enemy.name}免疫了负面效果！`;
    }
  }

  // 设置冷却
  if (effect.cooldown) {
    battleState.player.cooldowns[cooldownKey] = effect.cooldown;
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'skill', // 使用skill类型，因为进阶物品效果类似技能
    result: {
      damage,
      heal,
      buffs,
      debuffs,
    },
    description,
  };
}

/**
 * 执行使用物品
 */
function executeItem(battleState: BattleState, itemId: string): BattleAction {
  const player = battleState.player;

  // 从玩家背包中查找物品
  const item = battleState.playerInventory.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found in inventory`);
  }

  // 查找丹药配置（通过物品名称匹配）
  const potionConfig = Object.values(BATTLE_POTIONS).find(
    (p) => p.name === item.name
  );
  if (!potionConfig) {
    throw new Error(`Potion config for ${item.name} not found`);
  }

  let heal = 0;

  if (potionConfig.type === 'heal' && potionConfig.effect.heal) {
    heal = Math.floor(potionConfig.effect.heal);
    player.hp = Math.min(player.maxHp, Math.floor(player.hp + heal));
  }

  if (potionConfig.type === 'buff' && potionConfig.effect.buffs) {
    potionConfig.effect.buffs.forEach((buff) => {
      player.buffs.push({ ...buff });
    });
  }

  // 消耗物品（减少数量）
  const itemIndex = battleState.playerInventory.findIndex((i) => i.id === itemId);
  if (itemIndex >= 0) {
    battleState.playerInventory[itemIndex] = {
      ...battleState.playerInventory[itemIndex],
      quantity: battleState.playerInventory[itemIndex].quantity - 1,
    };
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'item',
    itemId,
    result: {
      heal,
      buffs: potionConfig.effect.buffs || [],
    },
    description: `你使用了${potionConfig.name}，${heal > 0 ? `恢复了 ${heal} 点气血。` : '获得了增益效果。'}`,
  };
}

/**
 * 执行防御
 */
function executeDefend(
  battleState: BattleState,
  unitId: 'player' | 'enemy'
): BattleAction {
  const unit = unitId === 'player' ? battleState.player : battleState.enemy;
  unit.isDefending = true;

  return {
    id: randomId(),
    round: battleState.round,
    turn: unitId,
    actor: unitId,
    actionType: 'defend',
    result: {},
    description:
      unitId === 'player'
        ? '你进入防御状态，下回合受到的伤害减少50%。'
        : `${unit.name}进入防御状态。`,
  };
}

/**
 * 执行逃跑
 */
function executeFlee(battleState: BattleState): BattleAction {
  // 逃跑成功率基于速度差
  const playerSpeed = Number(battleState.player.speed) || 0;
  const enemySpeed = Number(battleState.enemy.speed) || 0;
  const speedDiff = playerSpeed - enemySpeed;
  const fleeChance = 0.3 + Math.min(0.5, speedDiff / 100);
  const success = Math.random() < Math.max(0, Math.min(1, fleeChance)); // 确保概率在0-1之间

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'flee',
    result: {},
    description: success
      ? '你成功逃离了战斗。'
      : '你试图逃跑，但被敌人拦截。',
  };
}

/**
 * 更新战斗状态（处理持续效果、冷却等）
 */
function updateBattleStateAfterAction(
  battleState: BattleState
): BattleState {
  // 深拷贝玩家和敌人状态，确保不可变性
  const newState: BattleState = {
    ...battleState,
    player: {
      ...battleState.player,
      buffs: battleState.player.buffs.map(b => ({ ...b })),
      debuffs: battleState.player.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.player.cooldowns },
    },
    enemy: {
      ...battleState.enemy,
      buffs: battleState.enemy.buffs.map(b => ({ ...b })),
      debuffs: battleState.enemy.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.enemy.cooldowns },
    },
  };

  // 处理持续效果
  [newState.player, newState.enemy].forEach((unit) => {
    // 装备词条：回春妙术每个行动周期回血（护盾池不重置、冻结在回合切换处单独结算）
    settleEquipmentRegen(unit);

    // 处理Debuff（持续伤害）
    unit.debuffs = unit.debuffs
      .map((debuff) => {
        if (debuff.type === 'poison' || debuff.type === 'burn') {
          // 如果是百分比掉血（value是负数百分比）
          if (debuff.value < 0 && debuff.value > -1) {
            const hpLoss = Math.floor(unit.maxHp * Math.abs(debuff.value));
            unit.hp = Math.max(0, Math.floor(unit.hp - hpLoss));
          } else {
            // 固定数值掉血
            const debuffValue = Math.floor(debuff.value);
            unit.hp = Math.max(0, Math.floor(unit.hp - debuffValue));
          }
        }
        return { ...debuff, duration: debuff.duration - 1 };
      })
      .filter((debuff) => debuff.duration > 0);

    // 处理Buff（持续治疗等）
    unit.buffs = unit.buffs
      .map((buff) => {
        if (buff.type === 'heal' && buff.duration > 0) {
          const healValue = Math.floor(buff.value);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + healValue));
        }
        // 处理持续恢复（regen）
        if (buff.regen && buff.regen > 0 && buff.duration > 0) {
          const regenValue = Math.floor(unit.maxHp * buff.regen);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + regenValue));
        }
        return { ...buff, duration: buff.duration === -1 ? -1 : buff.duration - 1 };
      })
      .filter((buff) => buff.duration === -1 || buff.duration > 0);

    // 更新五行领域
    if (newState.elementalField) {
      newState.elementalField.duration -= 1;
      if (newState.elementalField.duration <= 0) {
        newState.elementalField = undefined;
        newState.history.push({
          id: randomId(),
          round: newState.round,
          turn: 'player',
          actor: 'system',
          actionType: 'attack',
          result: {},
          description: '五行领域能量耗尽，逐渐消散了。'
        } as any);
      }
    }

    // 更新冷却时间
    Object.keys(unit.cooldowns).forEach((skillId) => {
      if (unit.cooldowns[skillId] > 0) {
        unit.cooldowns[skillId] -= 1;
      }
    });

    // 重置防御状态
    unit.isDefending = false;
  });

  return newState;
}

/**
 * 检查战斗是否结束
 */
export function checkBattleEnd(battleState: BattleState): boolean {
  return battleState.player.hp <= 0 || battleState.enemy.hp <= 0;
}

/**
 * 生成技能描述
 */
function generateSkillDescription(
  skill: BattleSkill,
  caster: BattleUnit,
  target: BattleUnit,
  damage: number,
  heal: number
): string {
  // 敌人施法时主语改为敌人名字，避免描述中出现"你使用"的歧义
  const actor = caster.id === 'enemy' ? caster.name : '你';
  const targetName = caster.id === 'enemy' ? '你' : target.name;
  if (damage > 0) {
    return `${actor}使用【${skill.name}】，对${targetName}造成 ${damage} 点伤害。`;
  }
  if (heal > 0) {
    return `${actor}使用【${skill.name}】，恢复了 ${heal} 点气血。`;
  }
  return `${actor}使用【${skill.name}】。`;
}
/**
 * 执行灵宠行动
 */
function executePetAction(battleState: BattleState): BattleAction | null {
  if (!battleState.activePet || battleState.enemy.hp <= 0) {
    return null;
  }

  const { action, updatedEnemyHp, updatedPlayerHp, updatedCooldowns } = handlePetAction(
    battleState.activePet,
    battleState.player,
    { hp: battleState.enemy.hp, maxHp: battleState.enemy.maxHp, defense: battleState.enemy.defense, name: battleState.enemy.name },
    battleState.petSkillCooldowns || {},
    randomId,
    calcDamage
  );

  battleState.enemy.hp = updatedEnemyHp;
  battleState.player.hp = updatedPlayerHp;
  battleState.petSkillCooldowns = updatedCooldowns;

  return action as BattleAction;
}
