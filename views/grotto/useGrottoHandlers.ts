import React from 'react';
import { PlayerStats, ItemType } from '../../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS } from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseGrottoHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 洞府处理函数
 * 包含购买/升级洞府、种植/收获灵草、使用洞府仓库
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleUpgradeGrotto 升级洞府
 * @returns handlePlantHerb 种植灵草
 * @returns handleHarvestHerb 收获灵草
 * @returns handleEnhanceSpiritArray 改造聚灵阵
 */
export function useGrottoHandlers({
  player,
  setPlayer,
  addLog,
}: UseGrottoHandlersProps) {
  /**
   * 升级洞府
   */
  const handleUpgradeGrotto = (targetLevel: number) => {
    setPlayer((prev) => {
      // 确保 grotto 存在，如果不存在则使用默认值
      const grotto = prev.grotto || {
        level: 0,
        expRateBonus: 0,
        storageCapacity: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
      };
      const currentLevel = grotto.level;

      // 检查是否是升级
      if (targetLevel <= currentLevel) {
        addLog('无法降级洞府！', 'danger');
        return prev;
      }

      // 获取目标等级的配置
      const targetConfig = GROTTO_CONFIGS.find((c) => c.level === targetLevel);
      if (!targetConfig) {
        addLog('无效的洞府等级！', 'danger');
        return prev;
      }

      // 检查境界要求
      if (targetConfig.realmRequirement) {
        const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
        const requiredRealmIndex = REALM_ORDER.indexOf(targetConfig.realmRequirement);
        if (playerRealmIndex < requiredRealmIndex) {
          addLog(`需要达到${targetConfig.realmRequirement}境界才能购买此洞府！`, 'danger');
          return prev;
        }
      }

      // 检查灵石是否足够
      if (prev.spiritStones < targetConfig.cost) {
        addLog(`灵石不足！需要 ${targetConfig.cost} 灵石。`, 'danger');
        return prev;
      }

      // 计算需要删除的种植（如果新等级支持更少的槽位）
      const currentConfig = GROTTO_CONFIGS.find((c) => c.level === currentLevel);
      const maxSlots = targetConfig.maxHerbSlots;
      const currentPlanted = grotto.plantedHerbs.length;
      let newPlantedHerbs = [...grotto.plantedHerbs];

      // 如果新等级支持更少的槽位，需要移除多余的种植
      if (currentPlanted > maxSlots) {
        const toRemove = currentPlanted - maxSlots;
        // 移除最早种植的
        newPlantedHerbs = newPlantedHerbs.slice(toRemove);
        addLog(`升级洞府时，移除了 ${toRemove} 个灵草种植槽位。`, 'normal');
      }

      // 扣除灵石并升级洞府
      const newSpiritStones = prev.spiritStones - targetConfig.cost;

      addLog(
        `成功${currentLevel === 0 ? '购买' : '升级'}洞府至【${targetConfig.name}】！消耗 ${targetConfig.cost} 灵石。`,
        'gain'
      );

      return {
        ...prev,
        spiritStones: newSpiritStones,
        grotto: {
          ...grotto,
          level: targetLevel,
          expRateBonus: targetConfig.expRateBonus,
          storageCapacity: targetConfig.storageCapacity,
          plantedHerbs: newPlantedHerbs,
          spiritArrayEnhancement: grotto.spiritArrayEnhancement || 0,
        },
      };
    });
  };

  /**
   * 种植灵草
   */
  const handlePlantHerb = (herbId: string) => {
    setPlayer((prev) => {
      // 确保 grotto 存在
      const grotto = prev.grotto || {
        level: 0,
        expRateBonus: 0,
        storageCapacity: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
        spiritArrayEnhancement: 0,
      };
      const currentConfig = GROTTO_CONFIGS.find((c) => c.level === grotto.level);
      if (!currentConfig) {
        addLog('请先购买洞府！', 'danger');
        return prev;
      }

      // 检查是否有空余槽位
      if (grotto.plantedHerbs.length >= currentConfig.maxHerbSlots) {
        addLog(`洞府种植槽位已满（最多 ${currentConfig.maxHerbSlots} 个）！`, 'danger');
        return prev;
      }

      // 查找灵草配置
      const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herbId);
      if (!herbConfig) {
        addLog('无效的灵草！', 'danger');
        return prev;
      }

      // 检查洞府等级要求
      if (grotto.level < (herbConfig.grottoLevelRequirement || 1)) {
        addLog(`种植${herbConfig.name}需要${herbConfig.grottoLevelRequirement}级洞府！`, 'danger');
        return prev;
      }

      // 检查背包中是否有该灵草种子
      const seedItem = prev.inventory.find(
        (item) => item.name === herbConfig.name && item.type === ItemType.Herb
      );

      if (!seedItem || seedItem.quantity < 1) {
        addLog(`背包中没有${herbConfig.name}种子！`, 'danger');
        return prev;
      }

      // 扣除种子
      const updatedInventory = prev.inventory.map((item) => {
        if (item.id === seedItem.id) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }
        return item;
      }).filter((item) => item.quantity > 0);

      // 计算收获时间
      const now = Date.now();
      const harvestTime = now + herbConfig.growthTime;

      // 添加种植
      const newPlantedHerb = {
        herbId: herbConfig.id,
        herbName: herbConfig.name,
        plantTime: now,
        harvestTime: harvestTime,
        quantity: herbConfig.harvestQuantity.min +
          Math.floor(Math.random() * (herbConfig.harvestQuantity.max - herbConfig.harvestQuantity.min + 1)),
      };

      addLog(`成功种植${herbConfig.name}！预计 ${Math.floor(herbConfig.growthTime / 60000)} 分钟后可收获。`, 'gain');

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: [...grotto.plantedHerbs, newPlantedHerb],
        },
      };
    });
  };

  /**
   * 收获灵草
   */
  const handleHarvestHerb = (herbIndex: number) => {
    setPlayer((prev) => {
      // 确保 grotto 存在
      const grotto = prev.grotto || {
        level: 0,
        expRateBonus: 0,
        storageCapacity: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
        spiritArrayEnhancement: 0,
      };
      const plantedHerbs = [...grotto.plantedHerbs];

      if (herbIndex < 0 || herbIndex >= plantedHerbs.length) {
        addLog('无效的种植索引！', 'danger');
        return prev;
      }

      const herb = plantedHerbs[herbIndex];
      const now = Date.now();

      // 检查是否到了收获时间
      if (now < herb.harvestTime) {
        const remainingTime = Math.ceil((herb.harvestTime - now) / 60000);
        addLog(`灵草还未成熟！还需 ${remainingTime} 分钟。`, 'danger');
        return prev;
      }

      // 收获灵草，添加到背包
      const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
      if (!herbConfig) {
        addLog('无效的灵草配置！', 'danger');
        return prev;
      }

      const updatedInventory = [...prev.inventory];
      const existingHerbIndex = updatedInventory.findIndex(
        (item) => item.name === herb.herbName && item.type === ItemType.Herb
      );

      if (existingHerbIndex >= 0) {
        // 如果背包中已有该灵草，增加数量
        updatedInventory[existingHerbIndex] = {
          ...updatedInventory[existingHerbIndex],
          quantity: updatedInventory[existingHerbIndex].quantity + herb.quantity,
        };
      } else {
        // 否则添加新物品
        updatedInventory.push({
          id: uid(),
          name: herb.herbName,
          type: ItemType.Herb,
          description: `${herbConfig.name}，可用于炼丹。`,
          quantity: herb.quantity,
          rarity: herbConfig.rarity,
        });
      }

      // 移除已收获的种植
      plantedHerbs.splice(herbIndex, 1);

      addLog(
        `成功收获${herb.herbName} x${herb.quantity}！`,
        'gain'
      );

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: plantedHerbs,
          lastHarvestTime: now,
        },
      };
    });
  };

  /**
   * 批量收获所有成熟的灵草
   */
  const handleHarvestAll = () => {
    setPlayer((prev) => {
      // 确保 grotto 存在
      const grotto = prev.grotto || {
        level: 0,
        expRateBonus: 0,
        storageCapacity: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
        spiritArrayEnhancement: 0,
      };
      const now = Date.now();
      const matureHerbs = grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime);

      if (matureHerbs.length === 0) {
        addLog('没有可以收获的灵草！', 'danger');
        return prev;
      }

      let updatedInventory = [...prev.inventory];
      const remainingHerbs = grotto.plantedHerbs.filter((herb) => now < herb.harvestTime);

      // 收获所有成熟的灵草
      matureHerbs.forEach((herb) => {
        const existingHerbIndex = updatedInventory.findIndex(
          (item) => item.name === herb.herbName && item.type === ItemType.Herb
        );

        if (existingHerbIndex >= 0) {
          updatedInventory[existingHerbIndex] = {
            ...updatedInventory[existingHerbIndex],
            quantity: updatedInventory[existingHerbIndex].quantity + herb.quantity,
          };
        } else {
          const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
          updatedInventory.push({
            id: uid(),
            name: herb.herbName,
            type: ItemType.Herb,
            description: `${herbConfig?.name || herb.herbName}，可用于炼丹。`,
            quantity: herb.quantity,
            rarity: herbConfig?.rarity || '普通',
          });
        }
      });

      const totalQuantity = matureHerbs.reduce((sum, herb) => sum + herb.quantity, 0);
      addLog(
        `成功批量收获 ${matureHerbs.length} 个灵草，共 ${totalQuantity} 个！`,
        'gain'
      );

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: remainingHerbs,
          lastHarvestTime: now,
        },
      };
    });
  };

  /**
   * 改造聚灵阵
   */
  const handleEnhanceSpiritArray = (enhancementId: string) => {
    setPlayer((prev) => {
      // 确保 grotto 存在
      const grotto = prev.grotto || {
        level: 0,
        expRateBonus: 0,
        storageCapacity: 0,
        plantedHerbs: [],
        lastHarvestTime: null,
        spiritArrayEnhancement: 0,
      };

      // 检查是否拥有洞府
      if (grotto.level === 0) {
        addLog('请先购买洞府！', 'danger');
        return prev;
      }

      // 查找改造配置
      const enhancementConfig = SPIRIT_ARRAY_ENHANCEMENTS.find((e) => e.id === enhancementId);
      if (!enhancementConfig) {
        addLog('无效的改造配置！', 'danger');
        return prev;
      }

      // 检查洞府等级要求
      if (grotto.level < enhancementConfig.grottoLevelRequirement) {
        addLog(`需要${enhancementConfig.grottoLevelRequirement}级洞府才能进行此改造！`, 'danger');
        return prev;
      }

      // 检查材料是否足够
      const inventory = [...prev.inventory];
      for (const material of enhancementConfig.materials) {
        const item = inventory.find((i) => i.name === material.name);
        if (!item || item.quantity < material.quantity) {
          addLog(`材料不足！需要 ${material.name} x${material.quantity}。`, 'danger');
          return prev;
        }
      }

      // 扣除材料
      let updatedInventory = inventory.map((item) => {
        const material = enhancementConfig.materials.find((m) => m.name === item.name);
        if (material) {
          return {
            ...item,
            quantity: item.quantity - material.quantity,
          };
        }
        return item;
      }).filter((item) => item.quantity > 0);

      // 应用改造加成
      const newEnhancement = (grotto.spiritArrayEnhancement || 0) + enhancementConfig.expRateBonus;

      addLog(
        `成功改造聚灵阵【${enhancementConfig.name}】！修炼速度额外提升 ${(enhancementConfig.expRateBonus * 100).toFixed(0)}%。`,
        'gain'
      );

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          spiritArrayEnhancement: newEnhancement,
        },
      };
    });
  };

  return {
    handleUpgradeGrotto,
    handlePlantHerb,
    handleHarvestHerb,
    handleHarvestAll,
    handleEnhanceSpiritArray,
  };
}

