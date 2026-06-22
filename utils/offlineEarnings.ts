/**
 * 离线收益计算
 * 计算玩家离线期间的修行收益，在上线时结算展示
 */

import { PlayerStats, RealmType } from '../types';
import { REALM_ORDER, REALM_DATA } from '../constants/realms';

export interface OfflineEarnings {
  elapsedSeconds: number;
  elapsedText: string;
  meditationExp: number;
  spiritStoneIncome: number;
  grottoHerbs: Array<{ name: string; quantity: number }>;
  lifespanSpent: number;
}

/**
 * 计算离线收益
 * @param player 玩家当前状态
 * @param elapsedMs 离线时长（毫秒）
 */
export function calculateOfflineEarnings(
  player: PlayerStats,
  elapsedMs: number
): OfflineEarnings {
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedHours = elapsedSeconds / 3600;

  // 限制最大离线收益：24 小时
  const cappedHours = Math.min(elapsedHours, 24);

  // 格式化离线时间文本
  let elapsedText: string;
  if (elapsedSeconds < 60) {
    elapsedText = `${elapsedSeconds} 秒`;
  } else if (elapsedSeconds < 3600) {
    elapsedText = `${Math.floor(elapsedSeconds / 60)} 分钟`;
  } else if (elapsedSeconds < 86400) {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    elapsedText = `${h} 小时${m > 0 ? ` ${m} 分钟` : ''}`;
  } else {
    const d = Math.floor(elapsedSeconds / 86400);
    const h = Math.floor((elapsedSeconds % 86400) / 3600);
    elapsedText = `${d} 天${h > 0 ? ` ${h} 小时` : ''}`;
  }

  // 修行经验收益：基础打坐收益 × 离线系数(0.2) × 小时数
  const realmIdx = REALM_ORDER.indexOf(player.realm);
  const realmData = REALM_DATA[player.realm];
  const baseMeditationExp = realmData.maxExpBase * 0.02; // 每次打坐大约获得 2% 的 maxExp
  const meditationExp = Math.floor(baseMeditationExp * 0.2 * cappedHours * 60); // 0.2倍效率，按分钟计

  // 灵石收入：基于境界的固定时薪
  const hourlyStoneRate = Math.floor(50 * Math.pow(1.5, realmIdx));
  const spiritStoneIncome = Math.floor(hourlyStoneRate * cappedHours);

  // 洞府灵草收获
  const grottoHerbs: Array<{ name: string; quantity: number }> = [];
  if (player.grotto && player.grotto.level > 0 && player.grotto.plantedHerbs.length > 0) {
    const now = Date.now();
    const elapsedStart = now - elapsedMs;

    player.grotto.plantedHerbs.forEach((herb) => {
      // 检查在这段时间内可以收获多少次
      const growTime = herb.harvestTime - herb.plantTime;
      if (growTime <= 0) return;

      let harvestTime = herb.harvestTime;
      let harvests = 0;
      while (harvestTime <= now && harvestTime > elapsedStart) {
        harvests++;
        harvestTime += growTime; // 智能再生长
      }

      if (harvests > 0 && player.grotto.autoHarvest) {
        const existing = grottoHerbs.find((h) => h.name === herb.herbName);
        if (existing) {
          existing.quantity += herb.quantity * harvests;
        } else {
          grottoHerbs.push({
            name: herb.herbName,
            quantity: herb.quantity * harvests,
          });
        }
      }
    });
  }

  // 寿命消耗：离线时间按秒折算为年
  const lifespanSpent = cappedHours / (365 * 24) * 365; // 简化计算：按实际时间流逝

  return {
    elapsedSeconds,
    elapsedText,
    meditationExp,
    spiritStoneIncome,
    grottoHerbs,
    lifespanSpent,
  };
}

/**
 * 应用离线收益到玩家数据
 */
export function applyOfflineEarnings(
  player: PlayerStats,
  earnings: OfflineEarnings
): PlayerStats {
  const updated = { ...player };

  // 添加经验和灵石
  updated.exp = Math.min(
    (updated.exp || 0) + earnings.meditationExp,
    (updated.maxExp || 100) * 2
  );
  updated.spiritStones = (updated.spiritStones || 0) + earnings.spiritStoneIncome;

  // 添加洞府产物到背包
  const newInventory = [...(updated.inventory || [])];
  earnings.grottoHerbs.forEach((herb) => {
    const existing = newInventory.find(
      (item) => item.name === herb.name && (item as any).type === 'Herb'
    );
    if (existing) {
      existing.quantity = (existing.quantity || 1) + herb.quantity;
    } else {
      newInventory.push({
        id: `offline-herb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: herb.name,
        type: 'Herb' as any,
        quantity: herb.quantity,
        description: '离线期间收获的灵草',
      } as any);
    }
  });
  updated.inventory = newInventory;

  // 消耗寿命
  updated.lifespan = Math.max(0, (updated.lifespan || 100) - earnings.lifespanSpent);

  return updated;
}

/**
 * 生成离线收益日志文本
 */
export function getOfflineEarningsLog(earnings: OfflineEarnings): string {
  const parts: string[] = [];
  parts.push(`💤 你离线修炼了 ${earnings.elapsedText}`);

  if (earnings.meditationExp > 0) {
    parts.push(`获得 ${earnings.meditationExp} 修为`);
  }
  if (earnings.spiritStoneIncome > 0) {
    parts.push(`自动吸纳 ${earnings.spiritStoneIncome} 灵石`);
  }
  if (earnings.grottoHerbs.length > 0) {
    const herbText = earnings.grottoHerbs
      .map((h) => `${h.name}×${h.quantity}`)
      .join('、');
    parts.push(`洞府收获：${herbText}`);
  }

  return parts.join(' · ');
}
