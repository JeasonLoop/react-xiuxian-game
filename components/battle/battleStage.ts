import type { BattleAction, BattleState } from '../../types';
import type { BattleEffectEvent } from './useBattleStageEffects';

/**
 * 战斗演出事件归一化（纯展示层）
 * 把回合数据（BattleAction / BattleRoundLog）转成演出事件，
 * 技能名优先用结构化字段（skillId 查表），否则从描述文本解析
 */

/**
 * 从描述文本解析技能名
 * 支持：【宠物名】释放了【技能名】！ / 你施展天雷剑诀，... / 「技能名」
 */
export function parseSkillName(description: string): string | null {
  const brackets = description.match(/【([^【】]{1,16})】/g);
  if (brackets && brackets.length >= 2) {
    // 灵宠描述：【宠物名】释放了【技能名】！，取最后一个括号内容
    const last = brackets[brackets.length - 1];
    return last.slice(1, -1);
  }
  const cast = description.match(/(?:施展了?|释放了)([^，。！？\s]{1,16})/);
  if (cast) {
    return cast[1].replace(/[【】「」]/g, '') || null;
  }
  const corner = description.match(/「([^「」]{1,16})」/);
  if (corner) return corner[1];
  return null;
}

/** 回合制 BattleAction -> 演出事件 */
export function buildTurnActionEvent(
  action: BattleAction,
  state: BattleState
): BattleEffectEvent {
  // 技能名：优先按 skillId 查双方技能表，查不到再解析描述
  let skillName: string | null = null;
  if (action.skillId) {
    const found = [...state.player.skills, ...state.enemy.skills].find(
      (s) => s.id === action.skillId
    );
    skillName = found ? found.name : parseSkillName(action.description);
  } else {
    skillName = parseSkillName(action.description);
  }

  if (action.result.miss) {
    return { id: action.id, attacker: action.turn, kind: 'miss', skillName };
  }
  if (action.result.heal && action.result.heal > 0) {
    return {
      id: action.id,
      attacker: action.turn,
      kind: 'heal',
      value: action.result.heal,
      skillName,
    };
  }
  if (action.result.damage && action.result.damage > 0) {
    return {
      id: action.id,
      attacker: action.turn,
      kind: action.result.crit ? 'crit' : 'damage',
      value: action.result.damage,
      skillName,
    };
  }
  // 防御/增益/减益等：只播技能名横幅（如有）
  return { id: action.id, attacker: action.turn, kind: 'info', skillName };
}

/** 快速战斗 BattleRoundLog -> 演出事件 */
export function buildRoundLogEvent(round: {
  id: string;
  attacker: 'player' | 'enemy';
  damage: number;
  crit: boolean;
  description: string;
}): BattleEffectEvent {
  const skillName = parseSkillName(round.description);
  if (/闪避/.test(round.description)) {
    return { id: round.id, attacker: round.attacker, kind: 'miss', skillName };
  }
  if (round.damage > 0) {
    return {
      id: round.id,
      attacker: round.attacker,
      kind: round.crit ? 'crit' : 'damage',
      value: round.damage,
      skillName,
    };
  }
  // 无伤害：治疗或增益，治疗数值从描述提取
  const healMatch = round.description.match(/(?:回复|恢复|治疗)\s*(\d+)/);
  if (healMatch) {
    return {
      id: round.id,
      attacker: round.attacker,
      kind: 'heal',
      value: Number(healMatch[1]),
      skillName,
    };
  }
  return { id: round.id, attacker: round.attacker, kind: 'info', skillName };
}
