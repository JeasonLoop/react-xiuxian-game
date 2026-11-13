/**
 * 历练分支 / 声望事件等：按境界与层数放大资源奖励，使中后期收益跟得上成长曲线。
 *
 * 乘区与主事件（services/adventureTemplateService.ts 的 templateToAdventureResult）保持一致：
 *   realmMultiplier = 3^境界序号 × (1 + (层数 - 1) × 0.3)
 * 此前分支使用独立的线性乘区（约 1~4×），与主事件（最高约 2479×）严重脱节，
 * 导致高境界下分支奖励形同虚设。
 */

import type { AdventureResult, PlayerStats } from '../types';
import { REALM_ORDER } from '../constants/realms';

export type ReputationEventChoice = NonNullable<
  AdventureResult['reputationEvent']
>['choices'][number];

type ChoiceLike = {
  reputationChange: number;
  hpChange?: number;
  expChange?: number;
  spiritStonesChange?: number;
};

/**
 * 资源类奖励倍率：与主事件同一乘区。
 * 炼气 1 层为 1.0×，化神 5 层约 178×，长生 9 层约 2479×。
 */
export function getRealmEventRewardMultiplier(player: PlayerStats): number {
  const idx = REALM_ORDER.indexOf(player.realm);
  const ri = idx >= 0 ? idx : 0;
  const lv = Math.max(1, player.realmLevel ?? 1);
  const realmBaseMultiplier = Math.pow(3, ri);
  const levelMultiplier = 1 + (lv - 1) * 0.3;
  return realmBaseMultiplier * levelMultiplier;
}

function roundReward(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/**
 * 声望是非数值化的"地位"资源，有上限语义（如宗门声望等级），
 * 不随主乘区暴涨，只随境界序号轻微增长（与主事件的因果值处理一致）。
 */
function reputationScaleMultiplier(realmIndex: number): number {
  return 1 + realmIndex * 0.1;
}

/**
 * 返回应用境界倍率后的选项（用于 UI 与结算，需传入同一 player 以保证一致）。
 * 修为/灵石/气血按主事件乘区缩放；声望仅做轻量增长。
 */
export function scaleReputationEventChoice<
  T extends ChoiceLike & Record<string, unknown>,
>(player: PlayerStats, choice: T): T {
  const idx = REALM_ORDER.indexOf(player.realm);
  const ri = idx >= 0 ? idx : 0;
  const rewardMult = getRealmEventRewardMultiplier(player);
  const repMult = reputationScaleMultiplier(ri);

  const next = { ...choice } as T;

  if (choice.expChange !== undefined && choice.expChange !== 0) {
    next.expChange = roundReward(choice.expChange * rewardMult);
  }
  if (choice.spiritStonesChange !== undefined && choice.spiritStonesChange !== 0) {
    next.spiritStonesChange = roundReward(choice.spiritStonesChange * rewardMult);
  }
  if (choice.reputationChange !== undefined && choice.reputationChange !== 0) {
    next.reputationChange = roundReward(choice.reputationChange * repMult);
  }
  if (choice.hpChange !== undefined && choice.hpChange !== 0) {
    // 气血属于角色数值资源，代价与收益同乘区放大（相对最大气血的比例保持稳定）
    next.hpChange = roundReward(choice.hpChange * rewardMult);
  }

  return next;
}
