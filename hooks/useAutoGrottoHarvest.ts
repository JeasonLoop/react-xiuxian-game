/**
 * 洞府自动收获 Hook
 * 当自动收获开启时，定期检查并自动收获成熟的灵草
 */

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats } from '../types';
import { HERBARIUM_REWARDS, PLANTABLE_HERBS } from '../constants/index';
import { addItemToInventory } from '../utils/inventoryUtils';
import { ItemType } from '../types';

interface UseAutoGrottoHarvestParams {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 自动收获洞府中成熟的灵草
 * 每30秒检查一次是否有成熟的灵草
 */
export function useAutoGrottoHarvest({
  player,
  setPlayer,
  addLog,
}: UseAutoGrottoHarvestParams) {
  const lastCheckRef = useRef<number>(0);

  const applyHerbariumRewards = (nextPlayer: PlayerStats, herbCount: number): PlayerStats => {
    const unclaimedRewards = HERBARIUM_REWARDS.filter(
      (reward) =>
        herbCount >= reward.herbCount &&
        !nextPlayer.achievements.includes(`herbarium-${reward.herbCount}`)
    );
    if (unclaimedRewards.length === 0) {
      return nextPlayer;
    }

    let totalExp = 0;
    let totalSpiritStones = 0;
    let totalAttributePoints = 0;
    let updated = { ...nextPlayer };

    unclaimedRewards.forEach((reward) => {
      if (reward.reward.exp) totalExp += reward.reward.exp;
      if (reward.reward.spiritStones) totalSpiritStones += reward.reward.spiritStones;
      if (reward.reward.attributePoints) totalAttributePoints += reward.reward.attributePoints;
      updated = {
        ...updated,
        achievements: [...updated.achievements, `herbarium-${reward.herbCount}`],
      };
    });

    if (totalExp > 0 || totalSpiritStones > 0 || totalAttributePoints > 0) {
      addLog(
        `📖 图鉴奖励：自动收获触发奖励，获得 ${[
          totalExp > 0 ? `${totalExp} 修为` : '',
          totalSpiritStones > 0 ? `${totalSpiritStones} 灵石` : '',
          totalAttributePoints > 0 ? `${totalAttributePoints} 属性点` : '',
        ]
          .filter(Boolean)
          .join('、')}。`,
        'special'
      );
    }

    return {
      ...updated,
      exp: updated.exp + totalExp,
      spiritStones: updated.spiritStones + totalSpiritStones,
      attributePoints: updated.attributePoints + totalAttributePoints,
    };
  };

  useEffect(() => {
    if (!player || !player.grotto || !player.grotto.autoHarvest) {
      return;
    }

    const grotto = player.grotto;
    if (grotto.level === 0 || grotto.plantedHerbs.length === 0) {
      return;
    }

    const doAutoHarvest = () => {
      const now = Date.now();

      // 避免短时间重复触发
      if (now - lastCheckRef.current < 5000) {
        return;
      }
      lastCheckRef.current = now;

      setPlayer((prev) => {
        if (!prev || !prev.grotto || !prev.grotto.autoHarvest) return prev;

        const currentGrotto = prev.grotto;
        const currentNow = Date.now();
        const matureHerbs = currentGrotto.plantedHerbs.filter(
          (herb) => currentNow >= herb.harvestTime
        );

        if (matureHerbs.length === 0) {
          return prev;
        }

        const remainingHerbs = currentGrotto.plantedHerbs.filter(
          (herb) => currentNow < herb.harvestTime
        );

        let updatedInventory = [...prev.inventory];
        const harvestedNames: string[] = [];
        let totalQuantity = 0;
        const updatedHerbarium = [...(currentGrotto.herbarium || [])];
        let hasNewHerbarium = false;

        // 收获所有成熟的灵草
        matureHerbs.forEach((herb) => {
          const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
          const actualQuantity =
            herb.isMutated && herb.mutationBonus
              ? Math.floor(herb.quantity * herb.mutationBonus)
              : herb.quantity;

          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: herb.herbName,
              type: ItemType.Herb,
              description: `${herbConfig?.name || herb.herbName}，可用于炼丹。`,
              rarity: herbConfig?.rarity || '普通',
            },
            actualQuantity
          );

          if (!harvestedNames.includes(herb.herbName)) {
            harvestedNames.push(herb.herbName);
          }
          totalQuantity += actualQuantity;
          if (!updatedHerbarium.includes(herb.herbName)) {
            updatedHerbarium.push(herb.herbName);
            hasNewHerbarium = true;
          }
        });

        let nextPlayer: PlayerStats = {
          ...prev,
          inventory: updatedInventory,
          grotto: {
            ...currentGrotto,
            plantedHerbs: remainingHerbs,
            lastHarvestTime: currentNow,
            herbarium: updatedHerbarium,
          },
        };
        nextPlayer = applyHerbariumRewards(nextPlayer, updatedHerbarium.length);

        addLog(
          `✨ 洞府自动收获：${harvestedNames.join('、')}，共 ${totalQuantity} 个。已自动放入背包。${
            hasNewHerbarium ? ' 📖 图鉴已更新。' : ''
          }`,
          'gain'
        );

        return nextPlayer;
      });
    };

    // 挂载后立即检查一次，避免进游戏后还要等待轮询周期
    doAutoHarvest();
    const checkInterval = setInterval(doAutoHarvest, 30000); // 每30秒检查一次

    return () => clearInterval(checkInterval);
  }, [player?.grotto?.autoHarvest, player?.grotto?.plantedHerbs?.length, setPlayer, addLog]);
}

