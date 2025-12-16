import { Title, TitleSetEffect, PlayerStats } from '../types';
import { TITLES, TITLE_SET_EFFECTS } from '../constants';

/**
 * 计算称号效果（包括套装效果）
 * @param titleId 当前装备的称号ID
 * @param unlockedTitles 已解锁的称号ID列表
 * @returns 称号效果对象
 */
export function calculateTitleEffects(
  titleId: string | null,
  unlockedTitles: string[]
): {
  attack: number;
  defense: number;
  hp: number;
  spirit: number;
  physique: number;
  speed: number;
  expRate: number;
  luck: number;
} {
  const effects = {
    attack: 0,
    defense: 0,
    hp: 0,
    spirit: 0,
    physique: 0,
    speed: 0,
    expRate: 0,
    luck: 0,
  };

  if (!titleId) return effects;

  // 基础称号效果
  const title = TITLES.find((t) => t.id === titleId);
  if (title) {
    effects.attack += title.effects.attack || 0;
    effects.defense += title.effects.defense || 0;
    effects.hp += title.effects.hp || 0;
    effects.spirit += title.effects.spirit || 0;
    effects.physique += title.effects.physique || 0;
    effects.speed += title.effects.speed || 0;
    effects.expRate += title.effects.expRate || 0;
    effects.luck += title.effects.luck || 0;
  }

  // 检查套装效果：如果已解锁套装的所有称号，且当前装备的称号属于该套装，则获得套装加成
  if (title?.setGroup) {
    for (const setEffect of TITLE_SET_EFFECTS) {
      // 检查当前装备的称号是否在该套装中
      if (setEffect.titles.includes(titleId)) {
        // 检查是否已解锁该套装的所有称号
        const allUnlocked = setEffect.titles.every((tid) =>
          unlockedTitles.includes(tid)
        );
        if (allUnlocked) {
          // 应用套装效果
          effects.attack += setEffect.effects.attack || 0;
          effects.defense += setEffect.effects.defense || 0;
          effects.hp += setEffect.effects.hp || 0;
          effects.spirit += setEffect.effects.spirit || 0;
          effects.physique += setEffect.effects.physique || 0;
          effects.speed += setEffect.effects.speed || 0;
          effects.expRate += setEffect.effects.expRate || 0;
          effects.luck += setEffect.effects.luck || 0;
        }
      }
    }
  }

  return effects;
}

/**
 * 获取激活的套装效果信息
 * @param titleId 当前装备的称号ID
 * @param unlockedTitles 已解锁的称号ID列表
 * @returns 激活的套装效果列表
 */
export function getActiveSetEffects(
  titleId: string | null,
  unlockedTitles: string[]
): TitleSetEffect[] {
  if (!titleId) return [];

  const title = TITLES.find((t) => t.id === titleId);
  if (!title?.setGroup) return [];

  const activeSets: TitleSetEffect[] = [];

  for (const setEffect of TITLE_SET_EFFECTS) {
    if (setEffect.titles.includes(titleId)) {
      const allUnlocked = setEffect.titles.every((tid) =>
        unlockedTitles.includes(tid)
      );
      if (allUnlocked) {
        activeSets.push(setEffect);
      }
    }
  }

  return activeSets;
}

