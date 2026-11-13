/**
 * 秘境机制 BOSS 阶段引擎（M4-2）
 * 供回合制（turnBased）与快速战斗（fastBattle）共用：
 * - 战斗开始时初始化 BOSS 单位（第一阶段机制，如护盾）
 * - 敌人回合开始时结算每回合特殊机制（自毁倒计时 / 镜像自损）并按血量阈值推进阶段
 * 阶段推进内容：属性乘区、增益推送、阶段技能池解锁、醒目切换日志。
 */

import { BattleUnit } from '../../types';
import { BossEncounter, SECRET_REALM_BOSSES } from '../../constants/bossEncounters';

/** 按 BOSS 配置 ID 获取 BOSS 定义 */
export function getBossEncounterConfig(encounterId?: string | null): BossEncounter | null {
  if (!encounterId) return null;
  return SECRET_REALM_BOSSES[encounterId] || null;
}

/**
 * 战斗开始时初始化机制 BOSS 单位：写入阶段标记并应用第一阶段机制。
 * 镜像 BOSS 的技能来自玩家功法池，因此灵力上限对齐玩家，避免技能因灵力不足而不可用。
 * @returns 需要写入战斗日志的第一阶段登场描述（无 BOSS 时返回 null）
 */
export function applyBossUnitInit(
  enemyUnit: BattleUnit,
  bossEncounterId: string | undefined,
  playerUnit: BattleUnit
): string | null {
  const boss = getBossEncounterConfig(bossEncounterId);
  if (!boss) return null;

  enemyUnit.bossEncounterId = boss.id;
  enemyUnit.bossPhase = 1;

  if (boss.isMirror) {
    enemyUnit.mana = playerUnit.maxMana;
    enemyUnit.maxMana = playerUnit.maxMana;
  }

  // 应用第一阶段配置（如玄枢的护盾）
  const phaseOne = boss.bossPhases.find((p) => p.phase === 1);
  if (phaseOne) {
    applyPhaseEntry(enemyUnit, playerUnit, boss, phaseOne);
    return phaseOne.entryLog;
  }
  return null;
}

/**
 * 应用单个阶段的进场效果（属性乘区 / 增益 / 特殊机制 / 阶段技能解锁）
 */
function applyPhaseEntry(
  enemy: BattleUnit,
  player: BattleUnit,
  boss: BossEncounter,
  phaseConfig: BossEncounter['bossPhases'][number]
): void {
  // 属性乘区（一次性永久生效）
  if (phaseConfig.statMultipliers) {
    if (phaseConfig.statMultipliers.attack) {
      enemy.attack = Math.max(1, Math.round(enemy.attack * phaseConfig.statMultipliers.attack));
    }
    if (phaseConfig.statMultipliers.defense) {
      enemy.defense = Math.max(0, Math.round(enemy.defense * phaseConfig.statMultipliers.defense));
    }
    if (phaseConfig.statMultipliers.speed) {
      enemy.speed = Math.max(1, Math.round(enemy.speed * phaseConfig.statMultipliers.speed));
    }
  }
  // 防御归零（玄枢「自毁程序」）
  if (phaseConfig.zeroDefense) {
    enemy.defense = 0;
  }
  // 推送阶段增益
  (phaseConfig.entryBuffs || []).forEach((buff) => enemy.buffs.push({ ...buff }));
  // 解锁该阶段技能池
  (boss.phaseSkills[phaseConfig.phase] || []).forEach((skill) => enemy.skills.push({ ...skill, cooldown: 0 }));
  // 特殊机制
  switch (phaseConfig.special) {
    case 'shield':
      enemy.shieldPool = Math.max(
        enemy.shieldPool || 0,
        Math.floor(enemy.maxHp * (phaseConfig.shieldRatio ?? 0.2))
      );
      break;
    case 'copyPlayerBuffs':
      // 镜像复制玩家当前全部增益（深拷贝，冷却内/持续中的状态一并复制）
      player.buffs.forEach((buff) => enemy.buffs.push({ ...buff }));
      break;
    case 'selfDestruct':
      enemy.bossSelfDestructTurns = phaseConfig.selfDestructTurns ?? 3;
      break;
    case 'mirrorSacrifice':
      enemy.bossSelfDamageRatio = phaseConfig.selfDamageRatio ?? 0.03;
      break;
  }
}

/**
 * BOSS 阶段推进检查：在每个 BOSS 回合开始时调用（两模式统一入口）。
 * 1. 结算每回合特殊机制（自毁倒计时 / 镜像自损），可能直接终结 BOSS；
 * 2. 按血量阈值推进阶段并应用进场效果。
 * @returns 需要写入战斗日志的描述数组（空数组表示本回合无变化）
 */
export function checkBossPhase(enemy: BattleUnit, player: BattleUnit): string[] {
  const logs: string[] = [];
  const boss = getBossEncounterConfig(enemy.bossEncounterId);
  if (!boss || enemy.hp <= 0) return logs;

  // 1. 每回合特殊机制结算
  if (enemy.bossSelfDestructTurns !== undefined) {
    enemy.bossSelfDestructTurns -= 1;
    if (enemy.bossSelfDestructTurns <= 0) {
      // 「自毁程序」运行至尽头：BOSS 力竭死亡
      enemy.hp = 0;
      logs.push(`【${boss.name}】的自毁程序运行至尽头，机枢崩解，力竭而灭！`);
      return logs;
    }
  }
  if (enemy.bossSelfDamageRatio && enemy.bossSelfDamageRatio > 0) {
    const loss = Math.max(1, Math.floor(enemy.maxHp * enemy.bossSelfDamageRatio));
    enemy.hp = Math.max(0, enemy.hp - loss);
    logs.push(`【${boss.name}】道消身殒反噬己身，损失 ${loss} 点气血！`);
    if (enemy.hp <= 0) return logs;
  }

  // 2. 阶段判定：取满足血量阈值的最高阶段
  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  const currentPhase = enemy.bossPhase || 1;
  let targetPhase = currentPhase;
  for (const phaseConfig of boss.bossPhases) {
    if (hpRatio < phaseConfig.hpThreshold) {
      targetPhase = Math.max(targetPhase, phaseConfig.phase);
    }
  }
  if (targetPhase === currentPhase) return logs;

  // 3. 依次应用新阶段的进场效果（防止跳阶段时遗漏中间阶段）
  for (const phaseConfig of boss.bossPhases) {
    if (phaseConfig.phase <= currentPhase || phaseConfig.phase > targetPhase) continue;
    applyPhaseEntry(enemy, player, boss, phaseConfig);
    logs.push(phaseConfig.entryLog);
  }
  enemy.bossPhase = targetPhase;

  return logs;
}
