/**
 * 历练分支 / 声望事件等：按境界与层数放大资源奖励，使中后期收益跟得上成长曲线。
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
 * 资源类奖励倍率：境界索引 + 当前层数（1~9）线性放大。
 * 炼气约 1.0×，长生境高层可达约 4.x×。
 */
export function getRealmEventRewardMultiplier(player: PlayerStats): number {
  const idx = REALM_ORDER.indexOf(player.realm);
  const ri = idx >= 0 ? idx : 0;
  const lv = Math.max(1, Math.min(9, player.realmLevel ?? 1));
  const realmFactor = 1 + ri * 0.38;
  const levelFactor = 1 + (lv - 1) * 0.048;
  return Math.round(realmFactor * levelFactor * 1000) / 1000;
}

/**
 * 气血惩罚（负值）放大更温和，避免高境界一次扣血过狠。
 */
export function getRealmEventHpPenaltyMultiplier(player: PlayerStats): number {
  const m = getRealmEventRewardMultiplier(player);
  return Math.min(1.45, 0.72 + 0.28 * Math.sqrt(m));
}

function roundReward(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/**
 * 声望随境界略增（弱于修为/灵石），避免声望通胀过快。
 */
function reputationScaleMultiplier(rewardMult: number): number {
  return 1 + (rewardMult - 1) * 0.42;
}

/**
 * 返回应用境界倍率后的选项（用于 UI 与结算，需传入同一 player 以保证一致）。
 */
export function scaleReputationEventChoice<
  T extends ChoiceLike & Record<string, unknown>,
>(player: PlayerStats, choice: T): T {
  const rewardMult = getRealmEventRewardMultiplier(player);
  const hpPenMult = getRealmEventHpPenaltyMultiplier(player);
  const repMult = reputationScaleMultiplier(rewardMult);

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
    if (choice.hpChange < 0) {
      next.hpChange = roundReward(choice.hpChange * hpPenMult);
    } else {
      next.hpChange = roundReward(choice.hpChange * rewardMult);
    }
  }

  return next;
}
