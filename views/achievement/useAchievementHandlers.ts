import React, { useCallback, useRef } from 'react';
import { PlayerStats, RealmType } from '../../types';
import { REALM_ORDER, ACHIEVEMENTS, TITLES } from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseAchievementHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
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

    setPlayer((prev) => {
      if (!prev) {
        checkingAchievementsRef.current = false;
        return prev; // 防止 prev 为 null
      }

      const newAchievements = [...prev.achievements];
      let hasNewAchievement = false;
      let newExp = prev.exp;
      let newStones = prev.spiritStones;
      let newInv = [...prev.inventory];
      let newTitleId = prev.titleId;

      ACHIEVEMENTS.forEach((achievement) => {
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
          completed = playerRealmIndex >= realmIndex;
        } else if (achievement.requirement.type === 'kill') {
          // 击杀成就
          completed = stats.killCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'collect') {
          // 收集成就：检查背包中不同物品的数量
          const uniqueItems = new Set(prev.inventory.map((item) => item.name));
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
          completed = prev.pets.length >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'recipe') {
          // 丹方成就
          completed = prev.unlockedRecipes.length >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'art') {
          // 功法成就
          completed = prev.cultivationArts.length >= achievement.requirement.value;
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
            newTitleId = achievement.reward.titleId;
          }

          addLog(`🎉 达成成就：【${achievement.name}】！`, 'special');
        }
      });

      if (hasNewAchievement && newTitleId && newTitleId !== prev.titleId) {
        // 应用新称号效果
        const title = TITLES.find((t) => t.id === newTitleId);
        if (title) {
          const oldTitle = prev.titleId
            ? TITLES.find((t) => t.id === prev.titleId)
            : null;
          let titleAttack =
            prev.attack -
            (oldTitle?.effects.attack || 0) +
            (title.effects.attack || 0);
          let titleDefense =
            prev.defense -
            (oldTitle?.effects.defense || 0) +
            (title.effects.defense || 0);
          let titleMaxHp =
            prev.maxHp - (oldTitle?.effects.hp || 0) + (title.effects.hp || 0);
          let titleHp =
            prev.hp - (oldTitle?.effects.hp || 0) + (title.effects.hp || 0);

          checkingAchievementsRef.current = false;
          return {
            ...prev,
            achievements: newAchievements,
            exp: newExp,
            spiritStones: newStones,
            inventory: newInv,
            titleId: newTitleId,
            attack: titleAttack,
            defense: titleDefense,
            maxHp: titleMaxHp,
            hp: Math.min(titleHp, titleMaxHp),
          };
        }
      }

      if (hasNewAchievement) {
        checkingAchievementsRef.current = false;
        return {
          ...prev,
          achievements: newAchievements,
          exp: newExp,
          spiritStones: newStones,
          inventory: newInv,
          titleId: newTitleId || prev.titleId,
        };
      }

      checkingAchievementsRef.current = false;
      return prev;
    });
  }, [player, setPlayer, addLog]);

  return {
    checkAchievements,
  };
}
