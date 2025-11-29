import React from 'react';
import { PlayerStats } from '../../types';
import { CULTIVATION_ARTS, TALENTS, ACHIEVEMENTS } from '../../constants';

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

    let baseGain = 10 + player.realmLevel * 5;

    // Apply Active Art Bonus
    const activeArt = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
    if (activeArt && activeArt.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + activeArt.effects.expRate));
    }

    // Apply Talent Bonus
    const talent = TALENTS.find((t) => t.id === player.talentId);
    if (talent && talent.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + talent.effects.expRate));
    }

    // Slight randomness
    const actualGain = Math.floor(baseGain * (0.8 + Math.random() * 0.4));

    setPlayer((prev) => ({ ...prev, exp: prev.exp + actualGain }));

    const artText = activeArt ? `，运转${activeArt.name}` : '';
    addLog(`你潜心感悟大道${artText}。(+${actualGain} 修为)`);
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

