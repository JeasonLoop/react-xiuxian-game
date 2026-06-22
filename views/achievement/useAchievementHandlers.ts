import React, { useCallback, useRef } from 'react';
import { PlayerStats, RealmType } from '../../types';
import { REALM_ORDER, ACHIEVEMENTS, TITLES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { calculateTitleEffects } from '../../utils/titleUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseAchievementHandlersProps {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
}
/**
 * 成就处理函数
 * 包含检查成就、应用成就效果
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns checkAchievements 检查成就
 */
export function useAchievementHandlers({
  player,
  setPlayer,
  addLog,
}: UseAchievementHandlersProps) {
  // 使用 ref 来防止成就重复触发
  const checkingAchievementsRef = useRef(false);

  const checkAchievements = useCallback(() => {
    if (!player) return; // 防止 player 为 null
    if (checkingAchievementsRef.current) return; // 防止重复触发
    checkingAchievementsRef.current = true;

    if (!ACHIEVEMENTS?.length) {
      // 如果成就列表为空，立即释放检查锁，避免后续无法再次触发
      checkingAchievementsRef.current = false;
      return;
    }

    setPlayer((prev) => {
      if (!prev) {
        checkingAchievementsRef.current = false;
        return prev; // 防止 prev 为 null
      }

      const newAchievements = [...(prev.achievements || [])];
      let hasNewAchievement = false;
      let newExp = prev.exp;
      let newStones = prev.spiritStones;
      let newInv = [...(prev?.inventory || [])];
      let lastRewardedTitleId = '';
      const newlyUnlockedTitles: string[] = [];
      (ACHIEVEMENTS || []).forEach((achievement) => {
        // 跳过已完成的成就，避免重复触发
        if (newAchievements.includes(achievement.id)) return;

        let completed = false;
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

        // 检查不同类型的成就
        if (achievement.requirement.type === 'realm') {
          const realmIndex = REALM_ORDER.indexOf(
            achievement.requirement.target as RealmType
          );
          const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
          // 如果索引无效（-1），保守处理：不满足条件
          if (realmIndex < 0 || playerRealmIndex < 0) {
            completed = false;
          } else {
            completed = playerRealmIndex >= realmIndex;
          }
        } else if (achievement.requirement.type === 'kill') {
          // 击杀成就
          completed = stats.killCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'collect') {
          // 收集成就：检查背包中不同物品的数量
          const uniqueItems = Array.isArray(prev.inventory)
            ? new Set(prev.inventory.map((item) => item.name))
            : new Set();
          completed = uniqueItems.size >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'meditate') {
          // 打坐成就
          completed = stats.meditateCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'adventure') {
          // 历练成就
          completed = stats.adventureCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'equip') {
          // 装备成就
          completed = stats.equipCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'pet') {
          // 灵宠成就
          completed = Array.isArray(prev.pets) && (prev.pets?.length || 0) >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'recipe') {
          // 丹方成就
          completed = Array.isArray(prev.unlockedRecipes) && (prev.unlockedRecipes?.length || 0) >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'art') {
          // 功法成就
          completed = Array.isArray(prev.cultivationArts) && (prev.cultivationArts?.length || 0) >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'breakthrough') {
          // 突破成就
          completed = stats.breakthroughCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'secret_realm') {
          // 秘境成就
          completed = stats.secretRealmCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'lottery') {
          // 抽奖成就
          completed = (prev.lotteryCount || 0) >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'custom') {
          // 自定义成就（如首次打坐等，需要在特定地方单独检查）
          if (achievement.requirement.target === 'meditate') {
            // 这个需要在打坐时单独检查
            return;
          } else if (achievement.requirement.target === 'alchemy') {
            completed = (stats.alchemyCount || 0) >= achievement.requirement.value;
          } else if (achievement.requirement.target === 'sect_elder') {
            const rankOrder = ['外门弟子', '内门弟子', '核心弟子', '真传弟子', '长老', '掌门'];
            const playerRankIdx = rankOrder.indexOf(prev.sectRank || '');
            const targetRankIdx = rankOrder.indexOf('长老');
            completed = playerRankIdx >= targetRankIdx;
          }
          // 其他自定义成就可以根据需要添加
        }

        if (completed) {
          hasNewAchievement = true;
          newAchievements.push(achievement.id);
          newExp += achievement.reward.exp || 0;
          newStones += achievement.reward.spiritStones || 0;

          if (achievement.reward.items) {
            achievement.reward.items.forEach((item) => {
              const existingIdx = newInv.findIndex((i) => i.name === item.name);
              if (existingIdx >= 0) {
                newInv[existingIdx] = {
                  ...newInv[existingIdx],
                  quantity: newInv[existingIdx].quantity + 1,
                };
              } else {
                newInv.push({ ...item, id: uid() });
              }
            });
          }

          if (achievement.reward.titleId) {
            lastRewardedTitleId = achievement.reward.titleId;
            if (!prev.unlockedTitles?.includes(lastRewardedTitleId) && !newlyUnlockedTitles.includes(lastRewardedTitleId)) {
              newlyUnlockedTitles.push(lastRewardedTitleId);
            }
          }

          addLog(`🎉 达成成就：【${achievement.name}】！`, 'special');
        }
      });

      if (!hasNewAchievement) {
        checkingAchievementsRef.current = false;
        return prev;
      }

      // 更新已解锁的称号列表
      const updatedUnlockedTitles = [...(prev.unlockedTitles || [])];
      newlyUnlockedTitles.forEach(tid => {
        if (!updatedUnlockedTitles.includes(tid)) {
          updatedUnlockedTitles.push(tid);
        }
      });

      // 决定是否自动装备新称号
      // 如果获得了新称号，且当前没有称号，或者新称号比当前称号好（这里简单处理为最后获得的称号）
      let finalTitleId = prev.titleId;
      let statUpdates = {};

      if (lastRewardedTitleId && lastRewardedTitleId !== prev.titleId) {
        // 自动装备最后一个获得的称号
        finalTitleId = lastRewardedTitleId;

        // 计算效果差值
        const oldEffects = calculateTitleEffects(prev.titleId, prev.unlockedTitles || []);
        const newEffects = calculateTitleEffects(finalTitleId, updatedUnlockedTitles);

        // 先计算新的基础属性
        const newMaxHp = prev.maxHp + (newEffects.hp - oldEffects.hp);
        const newHp = prev.hp + (newEffects.hp - oldEffects.hp);

        // 创建临时玩家对象来计算实际最大血量
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;

        statUpdates = {
          attack: prev.attack + (newEffects.attack - oldEffects.attack),
          defense: prev.defense + (newEffects.defense - oldEffects.defense),
          maxHp: newMaxHp,
          hp: Math.min(newHp, actualMaxHp), // 使用实际最大血量作为上限
          spirit: prev.spirit + (newEffects.spirit - oldEffects.spirit),
          physique: prev.physique + (newEffects.physique - oldEffects.physique),
          speed: prev.speed + (newEffects.speed - oldEffects.speed),
          luck: prev.luck + (newEffects.luck - oldEffects.luck),
        };
        addLog(`✨ 已自动为你装备新称号：【${TITLES.find(t => t.id === finalTitleId)?.name}】！`, 'special');
      } else if (newlyUnlockedTitles.length > 0) {
        // 即使没有自动装备，如果解锁了新称号且满足套装效果，属性也会变化
        const oldEffects = calculateTitleEffects(prev.titleId, prev.unlockedTitles || []);
        const newEffects = calculateTitleEffects(prev.titleId, updatedUnlockedTitles);

        if (JSON.stringify(oldEffects) !== JSON.stringify(newEffects)) {
          // 先计算新的基础属性
          const newMaxHp = prev.maxHp + (newEffects.hp - oldEffects.hp);
          const newHp = prev.hp + (newEffects.hp - oldEffects.hp);

          // 创建临时玩家对象来计算实际最大血量
          const tempPlayer = { ...prev, maxHp: newMaxHp };
          const totalStats = getPlayerTotalStats(tempPlayer);
          const actualMaxHp = totalStats.maxHp;

          statUpdates = {
            attack: prev.attack + (newEffects.attack - oldEffects.attack),
            defense: prev.defense + (newEffects.defense - oldEffects.defense),
            maxHp: newMaxHp,
            hp: Math.min(newHp, actualMaxHp), // 使用实际最大血量作为上限
            spirit: prev.spirit + (newEffects.spirit - oldEffects.spirit),
            physique: prev.physique + (newEffects.physique - oldEffects.physique),
            speed: prev.speed + (newEffects.speed - oldEffects.speed),
            luck: prev.luck + (newEffects.luck - oldEffects.luck),
          };
          addLog(`✨ 解锁新称号触发了称号套装效果，实力获得了提升！`, 'special');
        }
      }

      checkingAchievementsRef.current = false;
      return {
        ...prev,
        achievements: newAchievements,
        exp: newExp,
        spiritStones: newStones,
        inventory: newInv,
        titleId: finalTitleId,
        unlockedTitles: updatedUnlockedTitles,
        ...statUpdates,
      };

    });
  }, [player, setPlayer, addLog]);

  return {
    checkAchievements,
  };
}
