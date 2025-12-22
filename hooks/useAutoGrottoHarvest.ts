/**
 * 洞府自动收获 Hook
 * 当自动收获开启时，定期检查并自动收获成熟的灵草
 */

import React, { useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { PLANTABLE_HERBS } from '../constants';
import { addItemToInventory } from '../utils/inventoryUtils';
import { ItemType } from '../types';

interface UseAutoGrottoHarvestParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
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

  useEffect(() => {
    if (!player || !player.grotto || !player.grotto.autoHarvest) {
      return;
    }

    const grotto = player.grotto;
    if (grotto.level === 0 || grotto.plantedHerbs.length === 0) {
      return;
    }

    // 每30秒检查一次
    const checkInterval = setInterval(() => {
      const now = Date.now();

      // 避免频繁检查（至少间隔5秒）
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

        // 收获所有成熟的灵草
        matureHerbs.forEach((herb) => {
          const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: herb.herbName,
              type: ItemType.Herb,
              description: `${herbConfig?.name || herb.herbName}，可用于炼丹。`,
              rarity: herbConfig?.rarity || '普通',
            },
            herb.quantity
          );

          if (!harvestedNames.includes(herb.herbName)) {
            harvestedNames.push(herb.herbName);
          }
          totalQuantity += herb.quantity;
        });

        // 只在有收获时才显示日志
        if (matureHerbs.length > 0) {
          addLog(
            `✨ 洞府自动收获：${harvestedNames.join('、')}，共 ${totalQuantity} 个。已自动放入背包。`,
            'gain'
          );
        }

        return {
          ...prev,
          inventory: updatedInventory,
          grotto: {
            ...currentGrotto,
            plantedHerbs: remainingHerbs,
            lastHarvestTime: currentNow,
          },
        };
      });
    }, 30000); // 每30秒检查一次

    return () => clearInterval(checkInterval);
  }, [player?.grotto?.autoHarvest, player?.grotto?.plantedHerbs?.length, setPlayer, addLog]);
}

