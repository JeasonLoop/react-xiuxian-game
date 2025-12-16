import React from 'react';
import { PlayerStats } from '../../types';
import {
  CULTIVATION_ARTS,
  TALENTS,
  ACHIEVEMENTS,
  REALM_ORDER,
  calculateSpiritualRootArtBonus,
} from '../../constants';

interface UseMeditationHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  checkLevelUp: (addedExp: number) => void;
}

/**
 * 打坐处理函数
 * 包含打坐
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param checkLevelUp 检查升级
 * @returns handleMeditate 打坐
 */

export function useMeditationHandlers({
  player,
  setPlayer,
  addLog,
  checkLevelUp,
}: UseMeditationHandlersProps) {
  const handleMeditate = () => {
    if (!player) return;

    // 根据境界计算基础修为
    // 基础修为 = 境界基础值 * (1 + 境界层数 * 0.15)
    const realmIndex = REALM_ORDER.indexOf(player.realm);

    // 不同境界的基础修为倍数（基于境界等级）
    const realmBaseMultipliers = [1, 2, 5, 10, 25, 50, 100];
    const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

    // 基础修为 = 境界基础倍数 * (1 + 境界层数 * 0.15)
    let baseGain = Math.floor(
      realmBaseMultiplier * 10 * (1 + player.realmLevel * 0.15)
    );

    // Apply Active Art Bonus
    const activeArt = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
    if (activeArt && activeArt.effects.expRate) {
      // 计算灵根对心法的加成
      const spiritualRootBonus = calculateSpiritualRootArtBonus(
        activeArt,
        player.spiritualRoots || {
          metal: 0,
          wood: 0,
          water: 0,
          fire: 0,
          earth: 0,
        }
      );
      baseGain = Math.floor(baseGain * (1 + activeArt.effects.expRate) * spiritualRootBonus);
    }

    // Apply Talent Bonus
    const talent = TALENTS.find((t) => t.id === player.talentId);
    if (talent && talent.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + talent.effects.expRate));
    }

    // 检查是否触发顿悟（0.1%概率）
    const isEnlightenment = Math.random() < 0.001;
    let actualGain: number;
    let logMessage: string;

    if (isEnlightenment) {
      // 顿悟：获得30-50倍修为
      const enlightenmentMultiplier = 30 + Math.random() * 20; // 3-5倍
      actualGain = Math.floor(baseGain * enlightenmentMultiplier);
      const artText = activeArt ? `，运转${activeArt.name}` : '';
      logMessage = `✨ 你突然顿悟，灵台清明，对大道有了更深的理解${artText}！(+${actualGain} 修为)`;
      addLog(logMessage, 'special');
    } else {
      // 正常修炼：小幅随机波动
      actualGain = Math.floor(baseGain * (0.85 + Math.random() * 0.3)); // 85%-115%
      const artText = activeArt ? `，运转${activeArt.name}` : '';
      logMessage = `你潜心感悟大道${artText}。(+${actualGain} 修为)`;
      addLog(logMessage);
    }

    setPlayer((prev) => {
      // 打坐时直接加速回血：基础2倍，根据境界和层数可以增加
      // 基础倍数 = 2.0 + 境界层数 * 0.1（最高3.5倍）
      const baseMultiplier = 2.0 + Math.min(prev.realmLevel * 0.1, 1.5); // 2.0 - 3.5倍

      // 计算回血量：基础回血 * 打坐加成倍数
      const baseRegen = Math.max(1, Math.floor(prev.maxHp * 0.01));
      const actualRegen = Math.floor(baseRegen * baseMultiplier);

      // 直接恢复血量
      const newHp = Math.min(prev.maxHp, prev.hp + actualRegen);

      // 添加回血提示
      const multiplierText = baseMultiplier.toFixed(1);
      if (newHp > prev.hp) {
        addLog(
          `💚 打坐加速回血，恢复 ${actualRegen} 点气血（${multiplierText}倍速度）`,
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
        addLog(`💰 打坐时获得了 ${Math.max(1, stoneGain)} 灵石`, 'gain');
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

    // 检查首次打坐成就
    if (!player.achievements.includes('ach-first-step')) {
      const firstMeditateAchievement = ACHIEVEMENTS.find(
        (a) => a.id === 'ach-first-step'
      );
      if (firstMeditateAchievement) {
        setPlayer((prev) => {
          const newAchievements = [...prev.achievements, 'ach-first-step'];
          addLog(
            `🎉 达成成就：【${firstMeditateAchievement.name}】！`,
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
  };

  return {
    handleMeditate,
  };
}
