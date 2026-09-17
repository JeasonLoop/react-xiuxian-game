/**
 * 九天通天塔业务服务层
 * 处理爬塔挑战判定、战力演算、首通奖励结算与每日扫荡逻辑
 */

import { PlayerStats, Item } from '../types';
import {
  getTowerFloorConfig,
  calculateTowerDailySweep,
  createReforgeStoneItem,
  createComprehensionScrollItem,
  TowerFloorConfig,
} from '../constants/tower';
import { getPlayerTotalStats } from '../utils/statUtils';
import { addItemToInventory } from '../utils/inventoryUtils';
import dayjs from 'dayjs';

export interface TowerChallengeResult {
  success: boolean;
  floor: number;
  combatLogs: string[];
  rewards?: {
    exp: number;
    spiritStones: number;
    items: Item[];
  };
  playerHpLoss?: number;
}

/**
 * 挑战指定通天塔层数
 */
export function challengeTowerFloor(
  player: PlayerStats,
  floorToChallenge: number
): { result: TowerChallengeResult; updatedPlayer: PlayerStats } {
  const currentHighest = player.tower?.highestFloor || 0;
  const targetFloor = floorToChallenge;

  if (targetFloor > currentHighest + 1) {
    return {
      result: {
        success: false,
        floor: targetFloor,
        combatLogs: [`你尚未通关前置层数，无法跨层挑战第 ${targetFloor} 层！`],
      },
      updatedPlayer: player,
    };
  }

  if (targetFloor > 100) {
    return {
      result: {
        success: false,
        floor: 100,
        combatLogs: ['你已登顶九天通天塔最高之巅，万界俯首，无人可阻！'],
      },
      updatedPlayer: player,
    };
  }

  const floorConfig: TowerFloorConfig = getTowerFloorConfig(targetFloor);
  const playerStats = getPlayerTotalStats(player);

  const logs: string[] = [
    `【踏入试炼】你踏入【${floorConfig.name}】，狂暴的法则雷云翻涌！`,
    `守塔生灵【${floorConfig.guardianName}】（境界：${floorConfig.realm}）手持道兵，冷冷凝视着你。`,
  ];

  // 战斗演算：回合制数值博弈模拟
  const pAttack = playerStats.attack;
  const pDefense = playerStats.defense;
  let pHp = Math.max(1, player.hp);
  const pSpeed = playerStats.speed;

  const gAttack = floorConfig.baseAttack;
  const gDefense = floorConfig.baseDefense;
  let gHp = floorConfig.baseHp;
  const gSpeed = floorConfig.baseSpeed;

  let round = 1;
  const maxRounds = 25;
  let victory = false;

  while (round <= maxRounds && pHp > 0 && gHp > 0) {
    // 速度决定行动顺序与连击概率
    const playerFirst = pSpeed >= gSpeed;

    if (playerFirst) {
      // 玩家攻击
      const pDmg = Math.max(1, Math.floor(pAttack * (1 + Math.random() * 0.2) - gDefense * 0.4));
      gHp = Math.max(0, gHp - pDmg);
      if (round <= 3 || gHp <= 0) {
        logs.push(`第${round}回合：你运起无上神通轰出，对其造成 ${pDmg} 点穿透伤害！(守关者气血剩余: ${gHp})`);
      }
      if (gHp <= 0) {
        victory = true;
        break;
      }

      // 敌人反击
      const gDmg = Math.max(1, Math.floor(gAttack * (1 + Math.random() * 0.2) - pDefense * 0.45));
      pHp = Math.max(0, pHp - gDmg);
      if (round <= 3 || pHp <= 0) {
        logs.push(`守塔将【${floorConfig.guardianName}】法印震荡，对你造成 ${gDmg} 点震慑反震！(自身气血剩余: ${pHp})`);
      }
      if (pHp <= 0) {
        victory = false;
        break;
      }
    } else {
      // 敌人先攻
      const gDmg = Math.max(1, Math.floor(gAttack * (1 + Math.random() * 0.2) - pDefense * 0.45));
      pHp = Math.max(0, pHp - gDmg);
      if (round <= 3 || pHp <= 0) {
        logs.push(`守塔将【${floorConfig.guardianName}】先发制人，重击对你造成 ${gDmg} 点伤害！`);
      }
      if (pHp <= 0) {
        victory = false;
        break;
      }

      // 玩家反击
      const pDmg = Math.max(1, Math.floor(pAttack * (1 + Math.random() * 0.2) - gDefense * 0.4));
      gHp = Math.max(0, gHp - pDmg);
      if (round <= 3 || gHp <= 0) {
        logs.push(`你稳住阵脚，反手祭出道芒重创对手 ${pDmg} 点气血！`);
      }
      if (gHp <= 0) {
        victory = true;
        break;
      }
    }

    round++;
  }

  // 若回合用尽则按剩余血量百分比裁决
  if (pHp > 0 && gHp > 0) {
    const playerRatio = pHp / playerStats.maxHp;
    const guardianRatio = gHp / floorConfig.baseHp;
    victory = playerRatio >= guardianRatio;
    logs.push(victory ? '激战数十回合，你气势如虹，生生将守关者本源神念磨灭！' : '力战力竭，守关傀儡大阵威能愈发澎湃，你遗憾败退。');
  }

  if (victory) {
    logs.push(`【破关大捷】你成功通关【九天通天塔 第 ${targetFloor} 层】！`);

    const rewardItems: Item[] = [];
    if (floorConfig.firstClearRewards.reforgeStones > 0) {
      rewardItems.push(createReforgeStoneItem(floorConfig.firstClearRewards.reforgeStones));
    }
    if (floorConfig.firstClearRewards.comprehensionScrolls && floorConfig.firstClearRewards.comprehensionScrolls > 0) {
      rewardItems.push(createComprehensionScrollItem(floorConfig.firstClearRewards.comprehensionScrolls));
    }
    if (floorConfig.firstClearRewards.items) {
      rewardItems.push(...floorConfig.firstClearRewards.items);
    }

    const isFirstClear = targetFloor > currentHighest;
    let rewardExp = 0;
    let rewardStones = 0;
    let grantItems: Item[] = [];

    if (isFirstClear) {
      logs.push('【首次破关】天道赐福降下，你获得本层全部首通嘉奖！');
      rewardExp = floorConfig.firstClearRewards.exp;
      rewardStones = floorConfig.firstClearRewards.spiritStones;
      grantItems = rewardItems;
    } else {
      logs.push('此层早已踏破，本次仅淬炼心性，未再领取首通嘉奖。');
    }

    let newInventory = [...player.inventory];
    for (const rew of grantItems) {
      newInventory = addItemToInventory(newInventory, rew, rew.quantity || 1, {
        realm: player.realm,
        realmLevel: player.realmLevel,
      });
    }

    const updatedPlayer: PlayerStats = {
      ...player,
      hp: Math.max(1, pHp),
      exp: player.exp + rewardExp,
      spiritStones: player.spiritStones + rewardStones,
      inventory: newInventory,
      tower: {
        highestFloor: Math.max(currentHighest, targetFloor),
        dailySwept: player.tower?.dailySwept || false,
        lastSweepDate: player.tower?.lastSweepDate || '',
      },
    };

    return {
      result: {
        success: true,
        floor: targetFloor,
        combatLogs: logs,
        rewards: {
          exp: rewardExp,
          spiritStones: rewardStones,
          items: grantItems,
        },
        playerHpLoss: Math.max(0, player.hp - pHp),
      },
      updatedPlayer,
    };
  } else {
    logs.push(`【挑战落败】你被守塔者的恐怖威压震飞出通天塔，所幸本源未损。`);
    const updatedPlayer: PlayerStats = {
      ...player,
      hp: Math.max(1, Math.floor(player.maxHp * 0.15)),
    };

    return {
      result: {
        success: false,
        floor: targetFloor,
        combatLogs: logs,
        playerHpLoss: player.hp - updatedPlayer.hp,
      },
      updatedPlayer,
    };
  }
}

/**
 * 每日扫荡九天通天塔
 */
export function sweepTower(player: PlayerStats): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
  rewards?: { exp: number; spiritStones: number; items: Item[] };
} {
  const today = dayjs().format('YYYY-MM-DD');
  const towerState = player.tower || { highestFloor: 0, dailySwept: false, lastSweepDate: '' };

  if (towerState.highestFloor <= 0) {
    return {
      success: false,
      message: '你尚未通关任何通天塔关卡，无法进行扫荡！',
      updatedPlayer: player,
    };
  }

  if (towerState.lastSweepDate === today && towerState.dailySwept) {
    return {
      success: false,
      message: '今日已完成通天塔扫荡，天道回馈每日仅限一次，请明日再来！',
      updatedPlayer: player,
    };
  }

  const sweep = calculateTowerDailySweep(towerState.highestFloor);

  let newInventory = [...player.inventory];
  for (const rew of sweep.items) {
    newInventory = addItemToInventory(newInventory, rew, rew.quantity || 1, {
      realm: player.realm,
      realmLevel: player.realmLevel,
    });
  }

  const updatedPlayer: PlayerStats = {
    ...player,
    exp: player.exp + sweep.exp,
    spiritStones: player.spiritStones + sweep.spiritStones,
    inventory: newInventory,
    tower: {
      ...towerState,
      dailySwept: true,
      lastSweepDate: today,
    },
  };

  return {
    success: true,
    message: `【仙光垂落】你一键扫荡了前 ${towerState.highestFloor} 层通天塔，收获颇丰！`,
    updatedPlayer,
    rewards: {
      exp: sweep.exp,
      spiritStones: sweep.spiritStones,
      items: sweep.items,
    },
  };
}
