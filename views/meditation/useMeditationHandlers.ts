import React, { useCallback } from 'react';
import { PlayerStats } from '../../types';
import {
  ACHIEVEMENTS,
  REALM_ORDER,
} from '../../constants/index';
import { getActiveMentalArt, getPlayerTotalStats, calculateTotalExpRate } from '../../utils/statUtils';
import { useGameStore } from '../../store';

interface UseMeditationHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  checkLevelUp?: (addedExp: number) => void;
}

/**
 * 打坐处理函数
 * 包含打坐
 * @param props 可选的 props（向后兼容），如果不提供则从 zustand store 获取
 * @returns handleMeditate 打坐
 */

export function useMeditationHandlers(
  props?: UseMeditationHandlersProps
) {
  // 从 zustand store 获取状态
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);

  // 使用 props 或 store 的值（props 优先，用于向后兼容）
  const player = props?.player ?? storePlayer;
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const checkLevelUp = props?.checkLevelUp ?? (() => {}); // 默认空函数，升级检查在 useEffect 中处理

  // 使用 useCallback 确保函数能够访问最新的值
  const handleMeditate = useCallback(() => {
    // 在函数内部直接从 store 获取最新的 player，避免闭包问题
    const currentPlayer = props?.player ?? useGameStore.getState().player;
    const currentSetPlayer = props?.setPlayer ?? useGameStore.getState().setPlayer;
    const currentAddLog = props?.addLog ?? useGameStore.getState().addLog;
    if (!currentPlayer) return;

    // 根据境界计算基础修为
    // 基础修为 = 境界基础值 * (1 + 境界层数 * 0.15)
    const realmIndex = REALM_ORDER.indexOf(currentPlayer.realm);

    // 不同境界的基础修为倍数（基于境界等级）- 降低基础倍数，减缓升级速度
    const realmBaseMultipliers = [1, 2, 4, 8, 15, 30, 60]; // 降低倍数：从[1,2,5,10,25,50,100]降低
    const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

    // 基础修为 = 境界基础倍数 * 5 * (1 + currentPlayer.realmLevel * 0.1) - 降低基础值和层数加成
    let baseGain = Math.floor(
      realmBaseMultiplier * 10 * (1 + currentPlayer.realmLevel * 0.15)
    );

    // 使用统一的函数计算总修炼效率加成
    const expRateInfo = calculateTotalExpRate(currentPlayer);
    if (expRateInfo.total > 0) {
      baseGain = Math.floor(baseGain * (1 + expRateInfo.total));
    }

    const activeArt = getActiveMentalArt(currentPlayer);

    // 检查是否触发顿悟（1%概率）
    const isEnlightenment = Math.random() < 0.01;
    let actualGain: number;
    let logMessage: string;

    if (isEnlightenment) {
      // 顿悟：获得30-50倍修为
      const enlightenmentMultiplier = 30 + Math.random() * 20; // 3-5倍
      actualGain = Math.floor(baseGain * enlightenmentMultiplier);
      const artText = activeArt ? `，运转${activeArt.name}` : '';
      logMessage = `你突然顿悟，灵台清明，对大道有了更深的理解${artText}！(+${actualGain} 修为)`;
      currentAddLog(logMessage, 'special');
    } else {
      // 正常修炼：小幅随机波动
      actualGain = Math.floor(baseGain * (0.85 + Math.random() * 0.3)); // 85%-115%
      const artText = activeArt ? `，运转${activeArt.name}` : '';
      logMessage = `你潜心感悟大道${artText}。(+${actualGain} 修为)`;
      currentAddLog(logMessage, 'gain');
    }

    currentSetPlayer((prev) => {
      // 获取实际的最大血量（包含金丹法数加成等）
      const totalStats = getPlayerTotalStats(prev);
      const actualMaxHp = totalStats.maxHp;

      // 打坐时直接加速回血：基础2倍，根据境界和层数可以增加
      // 基础倍数 = 2.0 + 境界层数 * 0.1（最高3.5倍）
      const baseMultiplier = 2.0 + Math.min(prev.realmLevel * 0.1, 1.5); // 2.0 - 3.5倍

      // 计算回血量：基础回血 * 打坐加成倍数（基于实际最大血量）
      const baseRegen = Math.max(1, Math.floor(actualMaxHp * 0.01));
      const actualRegen = Math.floor(baseRegen * baseMultiplier);

      // 直接恢复血量（使用实际最大血量作为上限）
      const newHp = Math.min(actualMaxHp, prev.hp + actualRegen);

      // 添加回血提示
      const multiplierText = baseMultiplier.toFixed(1);
      if (newHp > prev.hp) {
        // 使用最新的 addLog
        const latestAddLog = props?.addLog ?? useGameStore.getState().addLog;
        latestAddLog(
          `打坐加速回血，恢复 ${actualRegen} 点气血（${multiplierText}倍速度）`,
          'gain'
        );
      }

      // 打坐时获得少量灵石（提供稳定的灵石获取途径）
      // 基础灵石 = 境界索引 * 2 + 1，随境界增长
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      const baseStones = Math.max(1, realmIndex * 2 + 1);
      // 随机波动 ±1
      const stoneGain = baseStones + Math.floor(Math.random() * 3) - 1;
      const newSpiritStones = prev.spiritStones + Math.max(1, stoneGain);

      // 更新统计
      const stats = prev.statistics || {
        killCount: 0,
        meditateCount: 0,
        adventureCount: 0,
        equipCount: 0,
        petCount: 0,
        recipeCount: 0,
        artCount: 0,
        breakthroughCount: 0,
        secretRealmCount: 0,
      };

      // 只在获得灵石时显示提示（避免刷屏）
      if (stoneGain > 0 && Math.random() < 0.3) {
        // 30%概率显示提示，避免刷屏
        // 使用最新的 addLog
        const latestAddLog = props?.addLog ?? useGameStore.getState().addLog;
        latestAddLog(`打坐时获得了 ${Math.max(1, stoneGain)} 灵石`, 'gain');
      }

      return {
        ...prev,
        exp: prev.exp + actualGain,
        hp: newHp,
        spiritStones: newSpiritStones,
        statistics: {
          ...stats,
          meditateCount: stats.meditateCount + 1,
        },
      };
    });
    checkLevelUp(actualGain);

    // 检查首次打坐成就（使用最新的 player）
    const latestPlayer = props?.player ?? useGameStore.getState().player;
    if (latestPlayer && !latestPlayer.achievements.includes('ach-first-step')) {
      const firstMeditateAchievement = ACHIEVEMENTS.find(
        (a) => a.id === 'ach-first-step'
      );
      if (firstMeditateAchievement) {
        const latestSetPlayer = props?.setPlayer ?? useGameStore.getState().setPlayer;
        const latestAddLog = props?.addLog ?? useGameStore.getState().addLog;
        latestSetPlayer((prev) => {
          const newAchievements = [...prev.achievements, 'ach-first-step'];
          latestAddLog(
            `达成成就：【${firstMeditateAchievement.name}】！`,
            'special'
          );
          return {
            ...prev,
            achievements: newAchievements,
            exp: prev.exp + (firstMeditateAchievement.reward.exp || 0),
            spiritStones:
              prev.spiritStones +
              (firstMeditateAchievement.reward.spiritStones || 0),
          };
        });
      }
    }
  }, []); // 空依赖数组，函数内部总是从 store 获取最新值

  return {
    handleMeditate,
  };
}
