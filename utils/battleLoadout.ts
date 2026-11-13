/**
 * 战斗技能栏装配配置工具
 * 使用 localStorage 轻量存储装配序列（skillId 列表），不入玩家存档。
 * 上限 15 个技能，保持插入顺序；提供增删与上移/下移能力。
 */
import { BattleSkill, BattleUnit } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';

/** 战斗技能栏最大装配数量 */
export const MAX_LOADOUT_SKILLS = 15;

/** 读取装配序列（skillId 列表，保持插入顺序）；数据异常时返回空数组 */
export function getBattleLoadout(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATTLE_SKILL_LOADOUT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id) => typeof id === 'string' && id.length > 0)
      .slice(0, MAX_LOADOUT_SKILLS);
  } catch {
    return [];
  }
}

/** 保存装配序列（去重、截断到上限），返回实际保存的序列 */
export function saveBattleLoadout(skillIds: string[]): string[] {
  const trimmed = Array.from(new Set(skillIds)).slice(0, MAX_LOADOUT_SKILLS);
  try {
    localStorage.setItem(STORAGE_KEYS.BATTLE_SKILL_LOADOUT, JSON.stringify(trimmed));
  } catch {
    // 存储失败（如隐私模式）不影响本次战斗内的使用
  }
  return trimmed;
}

/** 切换技能装配状态：已装配则移除；未装配且未满则追加到末尾。返回新序列（已持久化） */
export function toggleSkillInLoadout(skillIds: string[], skillId: string): string[] {
  if (skillIds.includes(skillId)) {
    return saveBattleLoadout(skillIds.filter((id) => id !== skillId));
  }
  if (skillIds.length >= MAX_LOADOUT_SKILLS) {
    return skillIds; // 已满，忽略添加
  }
  return saveBattleLoadout([...skillIds, skillId]);
}

/** 上移/下移装配序列中的技能（direction: -1 上移 / 1 下移）。返回新序列（已持久化） */
export function moveSkillInLoadout(skillIds: string[], index: number, direction: -1 | 1): string[] {
  const targetIndex = index + direction;
  if (index < 0 || index >= skillIds.length || targetIndex < 0 || targetIndex >= skillIds.length) {
    return skillIds;
  }
  const next = [...skillIds];
  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;
  return saveBattleLoadout(next);
}

/**
 * 判断技能当前是否可由玩家使用（冷却 / 灵力 / 施放条件）。
 * 仅用于展示层置灰提示，实际校验仍由战斗服务执行。
 */
export function checkSkillUsable(
  player: BattleUnit,
  skill: BattleSkill
): { usable: boolean; reason: string } {
  const cooldown = player.cooldowns[skill.id] || 0;
  if (cooldown > 0) {
    return { usable: false, reason: `冷却 ${cooldown} 回合` };
  }
  if (skill.cost.mana && (player.mana || 0) < skill.cost.mana) {
    return { usable: false, reason: `灵力不足 (需要 ${skill.cost.mana})` };
  }
  const cond = skill.conditions;
  if (cond) {
    if (cond.minHp !== undefined && player.maxHp > 0 && player.hp / player.maxHp < cond.minHp) {
      return { usable: false, reason: '气血比例不足' };
    }
    if (cond.requireBuff && !player.buffs.some((b) => b.id === cond.requireBuff)) {
      return { usable: false, reason: '需要特定增益状态' };
    }
    if (cond.requireDebuff && !player.debuffs.some((d) => d.id === cond.requireDebuff)) {
      return { usable: false, reason: '需要特定减益状态' };
    }
  }
  return { usable: true, reason: '' };
}
