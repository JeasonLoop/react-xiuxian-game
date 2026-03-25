import React from 'react';
import {
  PlayerStats,
  Recipe,
  ItemType,
  ItemRarity,
  Item,
} from '../../types';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { multiplyEffects, adjustPillEffectByPurity } from '../../utils/itemUtils';
import { showSuccess, showError, showInfo } from '../../utils/toastUtils';
import { useGameStore } from '../../store';
import { artifactService } from '../../services/artifactService';
import {
  ALCHEMY_EXP_REQUIREMENTS,
  ALCHEMY_EXP_GAINED,
  ALCHEMY_SUCCESS_BASE,
  ALCHEMY_LEVEL_SUCCESS_BONUS,
  FAILED_ALCHEMY_RESULT
} from '../../constants/items';

interface UseAlchemyHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
  triggerVisual?: (type: 'damage' | 'heal' | 'slash' | 'alchemy', value?: string, color?: string) => void;
}

/**
 * 炼丹与炼器处理函数
 */
export function useAlchemyHandlers(
  props?: UseAlchemyHandlersProps
) {
  // 从 zustand store 获取状态
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);

  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
  const triggerVisual = props?.triggerVisual;

  /**
   * 炼丹逻辑
   */
  const handleCraft = async (recipe: Recipe) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '🔥 炼丹中...', 'text-mystic-gold');
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    setPlayer((prev) => {
      if (!prev) return prev;
      if (prev.spiritStones < recipe.cost) return prev;

      // 1. 检查并扣除材料
      const newInventory = [...prev.inventory];
      for (const req of recipe.ingredients) {
        const itemIdx = newInventory.findIndex((i) => i.name === req.name);
        if (itemIdx === -1 || newInventory[itemIdx].quantity < req.qty) {
          showError(`材料不足：${req.name}`);
          return prev;
        }

        newInventory[itemIdx] = {
          ...newInventory[itemIdx],
          quantity: newInventory[itemIdx].quantity - req.qty,
        };
      }

      // 2. 计算成功率
      const baseSuccess = ALCHEMY_SUCCESS_BASE[recipe.result.rarity as ItemRarity] || 0.5;
      const levelBonus = (prev.alchemyLevel - 1) * ALCHEMY_LEVEL_SUCCESS_BONUS;
      const luckBonus = (prev.luck || 0) * 0.001; // 100幸运提升10%
      const successRate = Math.min(0.98, baseSuccess + levelBonus + luckBonus);

      const isSuccess = Math.random() < successRate;

      let finalResultItem: any;
      let logMessage = '';
      let logType: 'normal' | 'gain' | 'danger' | 'special' = 'normal';
      let expGained = 0;
      let hpChange = 0;

      if (isSuccess) {
        // 成功：计算纯度 (60-100)
        const basePurity = 60 + Math.random() * 20;
        const levelPurityBonus = (prev.alchemyLevel - 1) * 2;
        const luckPurityBonus = (prev.luck || 0) * 0.05;
        const purity = Math.min(100, Math.floor(basePurity + levelPurityBonus + luckPurityBonus));

        // 品质名称前缀
        let qualityPrefix = '';
        if (purity >= 100) qualityPrefix = '完美';
        else if (purity >= 95) qualityPrefix = '极品';
        else if (purity >= 85) qualityPrefix = '上品';
        else if (purity >= 70) qualityPrefix = '中品';
        else qualityPrefix = '下品';

        // 调整效果
        const { effect, permanentEffect } = adjustPillEffectByPurity(
          recipe.result.effect,
          recipe.result.permanentEffect,
          purity
        );

        finalResultItem = {
          ...recipe.result,
          name: `${qualityPrefix}${recipe.result.name}`,
          purity: purity,
          effect,
          permanentEffect,
        };

        logMessage = `丹炉火起，药香四溢。你炼制出了【${finalResultItem.name}】(纯度: ${purity}%)。`;
        logType = 'gain';
        expGained = ALCHEMY_EXP_GAINED[recipe.result.rarity as ItemRarity] || 10;
        showSuccess(`炼制成功！获得 ${finalResultItem.name}`);

        if (triggerVisual) {
          setTimeout(() => {
            triggerVisual('alchemy', `✨ ${finalResultItem.name}`, 'text-mystic-gold');
          }, 200);
        }
      } else {
        // 失败：炸炉或废丹
        const isExplosion = Math.random() < 0.2; // 20% 炸炉率
        if (isExplosion) {
          hpChange = -Math.floor(prev.maxHp * 0.1);
          logMessage = `轰的一声，丹炉承受不住药力炸裂开来！你受到了 ${Math.abs(hpChange)} 点反噬伤害。`;
          logType = 'danger';
          showError('炸炉了！炼丹失败。');
        } else {
          finalResultItem = FAILED_ALCHEMY_RESULT;
          logMessage = `火候未到，药材化为了一团黑糊糊的废丹。`;
          logType = 'normal';
          showInfo('炼制失败，只得到了废丹。');
          expGained = Math.max(1, Math.floor((ALCHEMY_EXP_GAINED[recipe.result.rarity as ItemRarity] || 10) / 5));
        }
      }

      // 3. 处理经验与升级
      let newLevel = prev.alchemyLevel || 1;
      let newProficiency = (prev.alchemyProficiency || 0) + expGained;

      const nextLevelReq = ALCHEMY_EXP_REQUIREMENTS[newLevel] || 9999999;
      if (newProficiency >= nextLevelReq && newLevel < 9) {
        newLevel += 1;
        newProficiency -= nextLevelReq;
        addLog(`【炼丹】你的炼丹造诣提升到了第 ${newLevel} 层！`, 'special');
      }

      // 4. 更新背包与统计
      let cleanedInventory = [...newInventory.filter((i) => i.quantity > 0)];

      if (isSuccess || (finalResultItem && logType !== 'danger')) {
        cleanedInventory = addItemToInventory(
          cleanedInventory,
          finalResultItem,
          1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );
      }

      const newStats = { ...(prev.statistics || {}) };
      newStats.alchemyCount = (newStats.alchemyCount || 0) + 1;

      if (logMessage) addLog(logMessage, logType);
      return {
        ...prev,
        hp: Math.max(1, prev.hp + hpChange),
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory,
        alchemyLevel: newLevel,
        alchemyProficiency: newProficiency,
        statistics: newStats as any,
      };
    });
  };

  /**
   * 炼器逻辑：材料合成
   */
  const handleCraftArtifact = async (materials: Item[], customName: string, selectedSlot?: string) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '⚒️ 炼器中...', 'text-stone-400');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const newArtifact = artifactService.craftFromMaterials(materials, customName, selectedSlot);

      setPlayer(prev => {
        if (!prev) return prev;

        // 扣除材料
        const newInventory = [...prev.inventory];
        materials.forEach(m => {
          const idx = newInventory.findIndex(invItem => invItem.id === m.id);
          if (idx !== -1) {
            newInventory[idx].quantity -= 1;
          }
        });

        const cleanedInventory = addItemToInventory(
          newInventory.filter(i => i.quantity > 0),
          newArtifact,
          1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );

        addLog(`金石交击，神兵出世！你炼制出了 ${newArtifact.name}。`, 'special');
        showSuccess(`炼器成功！获得 ${newArtifact.name}`);

        return {
          ...prev,
          inventory: cleanedInventory
        };
      });
    } catch (e: any) {
      showError(e.message);
    }
  };

  /**
   * 炼器逻辑：装备融合
   */
  const handleFuseArtifact = async (item1: Item, item2: Item, stone: Item, customName?: string) => {
    if (triggerVisual) {
      triggerVisual('alchemy', '🌀 融合中...', 'text-mystic-gold');
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const fusedItem = artifactService.fuseEquipment(item1, item2, stone, customName);

      setPlayer(prev => {
        if (!prev) return prev;

        // 移除旧装备和合成石
        const newInventory = prev.inventory.filter(i =>
          i.id !== item1.id && i.id !== item2.id
        );

        // 扣除合成石数量
        const stoneIdx = newInventory.findIndex(i => i.id === stone.id);
        if (stoneIdx !== -1) {
          newInventory[stoneIdx].quantity -= 1;
        }

        const cleanedInventory = addItemToInventory(
          newInventory.filter(i => i.quantity > 0),
          fusedItem,
          1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );

        addLog(`两件神兵在合成石的作用下合二为一，${fusedItem.name} 诞生了！`, 'special');
        showSuccess(`融合成功！获得 ${fusedItem.name}`);

        return {
          ...prev,
          inventory: cleanedInventory
        };
      });
    } catch (e: any) {
      showError(e.message);
    }
  };

  return {
    handleCraft,
    handleCraftArtifact,
    handleFuseArtifact,
  };
}
