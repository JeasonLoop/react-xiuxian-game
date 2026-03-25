import React from 'react';
import { PlayerStats, ItemType, RealmType, ItemRarity } from '../../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS, HERB_MUTATION_CONFIG, SPEEDUP_CONFIG, HERBARIUM_REWARDS } from '../../constants/index';
import { addItemToInventory } from '../../utils/inventoryUtils';

interface UseGrottoHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 洞府处理函数
 * 包含购买/升级洞府、种植/收获灵草、使用洞府仓库、改造聚灵阵
 *
 * 设计原则：
 * - 所有操作都有明确的反馈
 * - 错误提示清晰且友好
 * - 自动处理边界情况
 */
export function useGrottoHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UseGrottoHandlersProps) {
  /**
   * 获取默认洞府数据
   */
  const getDefaultGrotto = () => ({
    level: 0,
    expRateBonus: 0,
    autoHarvest: false,
    growthSpeedBonus: 0,
    plantedHerbs: [],
    lastHarvestTime: null,
    spiritArrayEnhancement: 0,
    herbarium: [],
    dailySpeedupCount: 0,
    lastSpeedupResetDate: new Date().toISOString().split('T')[0],
  });

  /**
   * 获取当前洞府配置
   */
  const getCurrentGrottoConfig = (level: number) => {
    return GROTTO_CONFIGS.find((c) => c.level === level);
  };

  /**
   * 检查境界要求
   */
  const checkRealmRequirement = (requiredRealm: RealmType | undefined, playerRealm: RealmType): boolean => {
    if (!requiredRealm) return true;
    const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
    const requiredRealmIndex = REALM_ORDER.indexOf(requiredRealm);
    return playerRealmIndex >= requiredRealmIndex;
  };

  /**
   * 根据稀有度获取草药的默认配置
   */
  const getDefaultHerbConfig = (herbName: string, rarity: ItemRarity = '普通') => {
    // 根据稀有度设置默认生长时间和收获数量
    const rarityConfigs: Record<ItemRarity, { growthTime: number; harvestQuantity: { min: number; max: number }; grottoLevelRequirement: number }> = {
      '普通': { growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, grottoLevelRequirement: 1 },
      '稀有': { growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, grottoLevelRequirement: 3 },
      '传说': { growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 5 },
      '仙品': { growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 6 },
    };

    const config = rarityConfigs[rarity];
    return {
      id: `herb-${herbName.toLowerCase().replace(/\s+/g, '-')}`,
      name: herbName,
      growthTime: config.growthTime,
      harvestQuantity: config.harvestQuantity,
      rarity: rarity,
      grottoLevelRequirement: config.grottoLevelRequirement,
    };
  };

  /**
   * 升级洞府
   *
   * 优化点：
   * - 更清晰的错误提示
   * - 自动处理降级情况
   * - 友好的成功反馈
   */
  const handleUpgradeGrotto = (targetLevel: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const currentLevel = grotto.level;

      // 检查是否是升级
      if (targetLevel <= currentLevel) {
        addLog('无法降级洞府！如需更换洞府，请先出售当前洞府。', 'danger');
        return prev;
      }

      // 获取目标等级的配置
      const targetConfig = GROTTO_CONFIGS.find((c) => c.level === targetLevel);
      if (!targetConfig) {
        addLog('抱歉，找不到这个等级的洞府配置。', 'danger');
        return prev;
      }

      // 检查境界要求
      if (!checkRealmRequirement(targetConfig.realmRequirement, prev.realm)) {
        addLog(
          `需要达到【${targetConfig.realmRequirement}】境界才能购买此洞府。当前境界：${prev.realm}`,
          'danger'
        );
        return prev;
      }

      // 检查灵石是否足够
      if (prev.spiritStones < targetConfig.cost) {
        const shortage = targetConfig.cost - prev.spiritStones;
        addLog(
          `灵石不足！需要 ${targetConfig.cost.toLocaleString()} 灵石，当前拥有 ${prev.spiritStones.toLocaleString()} 灵石，还差 ${shortage.toLocaleString()} 灵石。`,
          'danger'
        );
        return prev;
      }

      // 计算需要删除的种植（如果新等级支持更少的槽位）
      const currentConfig = getCurrentGrottoConfig(currentLevel);
      const maxSlots = targetConfig.maxHerbSlots;
      const currentPlanted = grotto.plantedHerbs.length;
      let newPlantedHerbs = [...grotto.plantedHerbs];

      // 如果新等级支持更少的槽位，需要移除多余的种植
      if (currentPlanted > maxSlots) {
        const toRemove = currentPlanted - maxSlots;
        // 移除最早种植的
        newPlantedHerbs = newPlantedHerbs.slice(toRemove);
        addLog(
          `升级洞府时，由于新洞府只有 ${maxSlots} 个种植槽位，已自动移除 ${toRemove} 个最早种植的灵草。`,
          'normal'
        );
      }

      // 扣除灵石并升级洞府
      const newSpiritStones = prev.spiritStones - targetConfig.cost;

      const actionText = currentLevel === 0 ? '购买' : '升级';
      const features: string[] = [
        `修炼速度提升 ${(targetConfig.expRateBonus * 100).toFixed(0)}%`,
        `种植槽位 ${targetConfig.maxHerbSlots} 个`,
      ];

      if (targetConfig.growthSpeedBonus > 0) {
        features.push(`灵草生长速度提升 ${(targetConfig.growthSpeedBonus * 100).toFixed(0)}%`);
      }
      if (targetConfig.autoHarvest) {
        features.push('支持自动收获');
      }

      addLog(
        `✨ 成功${actionText}洞府至【${targetConfig.name}】！消耗 ${targetConfig.cost.toLocaleString()} 灵石。${features.join('，')}。`,
        'gain'
      );

      return {
        ...prev,
        spiritStones: newSpiritStones,
        grotto: {
          ...grotto,
          level: targetLevel,
          expRateBonus: targetConfig.expRateBonus,
          autoHarvest: targetConfig.autoHarvest,
          growthSpeedBonus: targetConfig.growthSpeedBonus,
          plantedHerbs: newPlantedHerbs,
          spiritArrayEnhancement: grotto.spiritArrayEnhancement || 0,
        },
      };
    });
  };

  /**
   * 种植灵草
   *
   * 优化点：
   * - 更详细的验证和反馈
   * - 自动计算收获时间
   * - 友好的时间显示
   * - 支持所有草药类型
   */
  const handlePlantHerb = (herbIdOrName: string) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      // 检查是否拥有洞府
      if (grotto.level === 0) {
        addLog('请先购买洞府才能种植灵草。在"升级"标签页可以购买洞府。', 'danger');
        return prev;
      }

      const currentConfig = getCurrentGrottoConfig(grotto.level);
      if (!currentConfig) {
        addLog('洞府配置异常，请重新加载游戏。', 'danger');
        return prev;
      }

      // 检查是否有空余槽位
      if (grotto.plantedHerbs.length >= currentConfig.maxHerbSlots) {
        addLog(
          `种植槽位已满！当前已种植 ${grotto.plantedHerbs.length} 个，最多可种植 ${currentConfig.maxHerbSlots} 个。请先收获成熟的灵草或升级洞府。`,
          'danger'
        );
        return prev;
      }

      // 先尝试从 PLANTABLE_HERBS 中查找（通过 ID 或名称）
      let herbConfig = PLANTABLE_HERBS.find((h) => h.id === herbIdOrName || h.name === herbIdOrName);

      // 确定要查找的草药名称（优先使用配置中的名称，如果没有配置则使用传入的参数）
      let targetHerbName = herbIdOrName;
      if (herbConfig) {
        targetHerbName = herbConfig.name;
      } else {
        // 如果传入的是 ID 格式（如 herb-雪莲花），尝试提取名称部分
        // 或者如果传入的就是名称，直接使用
        if (herbIdOrName.startsWith('herb-')) {
          // 尝试从 ID 中提取名称（herb-雪莲花 -> 雪莲花）
          // 但更安全的方式是直接使用传入的值，然后在背包中查找
          targetHerbName = herbIdOrName;
        }
      }

      // 从背包中查找草药（多种匹配方式）
      // 严格过滤：只包含草药类型，排除丹药等其他类型
      let seedItem = prev.inventory.find(
        (item) => {
          if (item.type !== ItemType.Herb) return false;
          // 1. 精确名称匹配
          if (item.name === targetHerbName) return true;
          // 2. 如果传入的是 ID，尝试匹配名称
          if (herbConfig && item.name === herbConfig.name) return true;
          // 3. 如果传入的是 ID 格式，尝试从 ID 中提取名称匹配
          if (herbIdOrName.startsWith('herb-')) {
            const possibleName = herbIdOrName.replace(/^herb-/, '');
            if (item.name === possibleName) return true;
          }
          // 4. 通过物品 ID 匹配（兼容旧数据）
          if (item.id === herbIdOrName) return true;
          return false;
        }
      );

      if (!seedItem || seedItem.quantity < 1) {
        const herbName = herbConfig?.name || herbIdOrName;
        addLog(`背包中没有【${herbName}】种子！请先通过历练、商店或其他方式获得种子。`, 'danger');
        return prev;
      }

      // 如果找不到预定义配置，使用默认配置
      if (!herbConfig) {
        herbConfig = getDefaultHerbConfig(seedItem.name, seedItem.rarity || '普通');
      }

      // 检查洞府等级要求
      if (grotto.level < (herbConfig.grottoLevelRequirement || 1)) {
        addLog(
          `种植【${herbConfig.name}】需要 ${herbConfig.grottoLevelRequirement} 级洞府，当前洞府等级为 ${grotto.level}。请先升级洞府。`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `种植【${herbConfig.name}】需要 ${herbConfig.grottoLevelRequirement} 级洞府，当前洞府等级为 ${grotto.level}。请先升级洞府。`, type: 'danger' });
        }
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

      // 计算收获时间（应用生长速度加成）
      const now = Date.now();
      const growthSpeedBonus = grotto.growthSpeedBonus || 0;
      const actualGrowthTime = Math.floor(herbConfig.growthTime * (1 - growthSpeedBonus));
      const harvestTime = now + actualGrowthTime;

      // 计算变异概率
      const mutationChance = Math.min(
        HERB_MUTATION_CONFIG.baseMutationChance + (grotto.level * HERB_MUTATION_CONFIG.grottoLevelBonus),
        HERB_MUTATION_CONFIG.maxMutationChance
      );
      const isMutated = Math.random() < mutationChance;
      const mutationBonus = isMutated
        ? HERB_MUTATION_CONFIG.mutationBonusRange.min +
          Math.random() * (HERB_MUTATION_CONFIG.mutationBonusRange.max - HERB_MUTATION_CONFIG.mutationBonusRange.min)
        : 1.0;

      // 计算收获数量（变异灵草有数量加成）
      let harvestQuantity = herbConfig.harvestQuantity.min +
        Math.floor(Math.random() * (herbConfig.harvestQuantity.max - herbConfig.harvestQuantity.min + 1));

      if (isMutated) {
        const quantityMultiplier = HERB_MUTATION_CONFIG.quantityMultiplier.min +
          Math.random() * (HERB_MUTATION_CONFIG.quantityMultiplier.max - HERB_MUTATION_CONFIG.quantityMultiplier.min);
        harvestQuantity = Math.floor(harvestQuantity * quantityMultiplier);
      }

      // 添加种植
      const newPlantedHerb = {
        herbId: herbConfig.id,
        herbName: herbConfig.name,
        plantTime: now,
        harvestTime: harvestTime,
        quantity: harvestQuantity,
        isMutated: isMutated,
        mutationBonus: isMutated ? mutationBonus : undefined,
      };

      // 格式化时间显示
      const growthMinutes = Math.floor(actualGrowthTime / 60000);
      const growthHours = Math.floor(growthMinutes / 60);
      const growthMins = growthMinutes % 60;
      const timeText = growthHours > 0
        ? `${growthHours}小时${growthMins}分钟`
        : `${growthMinutes}分钟`;

      let bonusText = '';
      if (growthSpeedBonus > 0) {
        const originalMinutes = Math.floor(herbConfig.growthTime / 60000);
        bonusText = `（洞府加成：${(growthSpeedBonus * 100).toFixed(0)}%，原需 ${originalMinutes} 分钟）`;
      }

      let logMessage = `🌱 成功种植【${herbConfig.name}】！预计 ${timeText} 后可收获 ${harvestQuantity} 个。${bonusText}`;
      if (isMutated) {
        logMessage += ` ✨ 发生变异！产量提升 ${((mutationBonus - 1) * 100).toFixed(0)}%！`;
      }
      addLog(logMessage, isMutated ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: isMutated ? 'special' : 'gain' });
      }

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
   *
   * 优化点：
   * - 更清晰的错误提示
   * - 自动合并到背包
   * - 友好的成功反馈
   */
  const handleHarvestHerb = (herbIndex: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const plantedHerbs = [...grotto.plantedHerbs];

      if (herbIndex < 0 || herbIndex >= plantedHerbs.length) {
        addLog('抱歉，找不到这个种植位置。请刷新页面重试。', 'danger');
        return prev;
      }

      const herb = plantedHerbs[herbIndex];
      const now = Date.now();

      // 检查是否到了收获时间
      if (now < herb.harvestTime) {
        const remaining = herb.harvestTime - now;
        const remainingMinutes = Math.ceil(remaining / 60000);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        const timeText = remainingHours > 0
          ? `${remainingHours}小时${remainingMins}分钟`
          : `${remainingMinutes}分钟`;

        addLog(`【${herb.herbName}】还未成熟！还需等待 ${timeText}。`, 'danger');
        return prev;
      }

      // 收获灵草，添加到背包
      const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
      if (!herbConfig) {
        addLog('抱歉，找不到这个灵草的配置信息。', 'danger');
        return prev;
      }

      // 计算实际收获数量（变异灵草有加成）
      const actualQuantity = herb.isMutated && herb.mutationBonus
        ? Math.floor(herb.quantity * herb.mutationBonus)
        : herb.quantity;

      const updatedInventory = addItemToInventory(
        prev.inventory,
        {
          name: herb.herbName,
          type: ItemType.Herb,
          description: `${herbConfig.name}，可用于炼丹。`,
          rarity: herbConfig.rarity,
        },
        actualQuantity
      );

      // 更新图鉴（如果未收集过）
      const updatedHerbarium = [...(grotto.herbarium || [])];
      if (!updatedHerbarium.includes(herb.herbName)) {
        updatedHerbarium.push(herb.herbName);
      }

      // 移除已收获的种植
      plantedHerbs.splice(herbIndex, 1);

      let logMessage = `✨ 成功收获【${herb.herbName}】x${actualQuantity}！已自动放入背包。`;
      if (herb.isMutated) {
        logMessage += ` 🌟 变异灵草额外加成！`;
      }
      if (!grotto.herbarium?.includes(herb.herbName)) {
        logMessage += ` 📖 已记录到图鉴！`;
      }
      addLog(logMessage, herb.isMutated ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: herb.isMutated ? 'special' : 'gain' });
      }

      // 检查图鉴奖励
      const newPlayer = {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: plantedHerbs,
          lastHarvestTime: now,
          herbarium: updatedHerbarium,
        },
      };

      // 检查并发放图鉴奖励
      const finalPlayer = checkAndAwardHerbariumRewards(newPlayer, updatedHerbarium.length);

      return finalPlayer;
    });
  };

  /**
   * 批量收获所有成熟的灵草
   *
   * 优化点：
   * - 更详细的反馈信息
   * - 自动处理所有成熟的灵草
   */
  const handleHarvestAll = () => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const now = Date.now();
      const matureHerbs = grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime);

      if (matureHerbs.length === 0) {
        addLog('目前没有可以收获的灵草。请等待灵草成熟后再来收获。', 'normal');
        return prev;
      }

      let updatedInventory = [...prev.inventory];
      const remainingHerbs = grotto.plantedHerbs.filter((herb) => now < herb.harvestTime);
      const updatedHerbarium = [...(grotto.herbarium || [])];
      let totalQuantity = 0;
      let hasMutation = false;
      const newHerbs: string[] = [];

      // 收获所有成熟的灵草
      matureHerbs.forEach((herb) => {
        const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);

        // 计算实际收获数量（变异灵草有加成）
        const actualQuantity = herb.isMutated && herb.mutationBonus
          ? Math.floor(herb.quantity * herb.mutationBonus)
          : herb.quantity;

        totalQuantity += actualQuantity;
        if (herb.isMutated) hasMutation = true;

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

        // 更新图鉴
        if (!updatedHerbarium.includes(herb.herbName)) {
          updatedHerbarium.push(herb.herbName);
          newHerbs.push(herb.herbName);
        }
      });

      const herbNames = matureHerbs.map(h => h.herbName).join('、');
      let logMessage = `✨ 成功批量收获 ${matureHerbs.length} 个灵草（${herbNames}），共 ${totalQuantity} 个！已自动放入背包。`;
      if (hasMutation) {
        logMessage += ` 🌟 包含变异灵草！`;
      }
      if (newHerbs.length > 0) {
        logMessage += ` 📖 新增 ${newHerbs.length} 种图鉴！`;
      }
      addLog(logMessage, hasMutation ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: hasMutation ? 'special' : 'gain' });
      }

      const newPlayer = {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: remainingHerbs,
          lastHarvestTime: now,
          herbarium: updatedHerbarium,
        },
      };

      // 检查并发放图鉴奖励
      return checkAndAwardHerbariumRewards(newPlayer, updatedHerbarium.length);
    });
  };

  /**
   * 改造聚灵阵
   *
   * 优化点：
   * - 更详细的材料检查
   * - 友好的成功反馈
   */
  const handleEnhanceSpiritArray = (enhancementId: string) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      // 检查是否拥有洞府
      if (grotto.level === 0) {
        addLog('请先购买洞府才能改造聚灵阵。在"升级"标签页可以购买洞府。', 'danger');
        return prev;
      }

      // 查找改造配置
      const enhancementConfig = SPIRIT_ARRAY_ENHANCEMENTS.find((e) => e.id === enhancementId);
      if (!enhancementConfig) {
        addLog('抱歉，找不到这个改造配置。', 'danger');
        return prev;
      }
      const enhancementKey = `grotto-array-${enhancementId}`;
      if (prev.achievements.includes(enhancementKey)) {
        addLog(`【${enhancementConfig.name}】已完成改造，无需重复投入材料。`, 'normal');
        return prev;
      }

      // 检查洞府等级要求
      if (grotto.level < enhancementConfig.grottoLevelRequirement) {
        addLog(
          `进行【${enhancementConfig.name}】需要 ${enhancementConfig.grottoLevelRequirement} 级洞府，当前洞府等级为 ${grotto.level}。请先升级洞府。`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `进行【${enhancementConfig.name}】需要 ${enhancementConfig.grottoLevelRequirement} 级洞府，当前洞府等级为 ${grotto.level}。请先升级洞府。`, type: 'danger' });
        }
        return prev;
      }

      // 检查材料是否足够
      const missingMaterials: string[] = [];
      for (const material of enhancementConfig.materials) {
        const item = prev.inventory.find((i) => i.name === material.name);
        if (!item || item.quantity < material.quantity) {
          const has = item?.quantity || 0;
          missingMaterials.push(`${material.name}（需要 ${material.quantity}，拥有 ${has}）`);
        }
      }

      if (missingMaterials.length > 0) {
        addLog(
          `材料不足！缺少：${missingMaterials.join('、')}。请先收集所需材料。`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `材料不足！缺少：${missingMaterials.join('、')}。请先收集所需材料。`, type: 'danger' });
        }
        return prev;
      }

      // 扣除材料
      let updatedInventory = prev.inventory.map((item) => {
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
      const totalBonus = (grotto.expRateBonus + newEnhancement) * 100;

      addLog(
        `✨ 成功改造聚灵阵【${enhancementConfig.name}】！修炼速度额外提升 ${(enhancementConfig.expRateBonus * 100).toFixed(0)}%。当前总修炼加成：${totalBonus.toFixed(0)}%（基础 ${(grotto.expRateBonus * 100).toFixed(0)}% + 改造 ${(newEnhancement * 100).toFixed(0)}%）。`,
        'gain'
      );
      if (setItemActionLog) {
        setItemActionLog({ text: `✨ 成功改造聚灵阵【${enhancementConfig.name}】！修炼速度额外提升 ${(enhancementConfig.expRateBonus * 100).toFixed(0)}%。当前总修炼加成：${totalBonus.toFixed(0)}%（基础 ${(grotto.expRateBonus * 100).toFixed(0)}% + 改造 ${(newEnhancement * 100).toFixed(0)}%）。`, type: 'gain' });
      }

      return {
        ...prev,
        inventory: updatedInventory,
        achievements: [...prev.achievements, enhancementKey],
        grotto: {
          ...grotto,
          spiritArrayEnhancement: newEnhancement,
        },
      };
    });
  };

  /**
   * 切换自动收获开关
   */
  const handleToggleAutoHarvest = () => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      if (grotto.level === 0) {
        addLog('请先购买洞府才能使用自动收获功能。', 'danger');
        return prev;
      }

      const currentConfig = getCurrentGrottoConfig(grotto.level);
      if (!currentConfig || !currentConfig.autoHarvest) {
        addLog(`当前洞府等级不支持自动收获功能。需要 ${GROTTO_CONFIGS.find(c => c.autoHarvest)?.level || 4} 级及以上洞府。`, 'danger');
        return prev;
      }

      const newAutoHarvest = !grotto.autoHarvest;
      addLog(
        newAutoHarvest
          ? '✨ 已开启自动收获功能！成熟的灵草将自动收获到背包。'
          : '已关闭自动收获功能。',
        newAutoHarvest ? 'gain' : 'normal'
      );

      return {
        ...prev,
        grotto: {
          ...grotto,
          autoHarvest: newAutoHarvest,
        },
      };
    });
  };

  /**
   * 检查并发放图鉴奖励
   */
  const checkAndAwardHerbariumRewards = (player: PlayerStats, herbCount: number): PlayerStats => {
    const grotto = player.grotto || getDefaultGrotto();
    const awardedRewards = grotto.herbarium?.length || 0;

    // 查找未领取的奖励
    const unclaimedRewards = HERBARIUM_REWARDS.filter(
      reward => herbCount >= reward.herbCount && !player.achievements.includes(`herbarium-${reward.herbCount}`)
    );

    if (unclaimedRewards.length === 0) {
      return player;
    }

    let updatedPlayer = { ...player };
    let totalExp = 0;
    let totalSpiritStones = 0;
    let totalAttributePoints = 0;
    const newTitles: string[] = [];

    unclaimedRewards.forEach(reward => {
      if (reward.reward.exp) totalExp += reward.reward.exp;
      if (reward.reward.spiritStones) totalSpiritStones += reward.reward.spiritStones;
      if (reward.reward.attributePoints) totalAttributePoints += reward.reward.attributePoints;
      if (reward.reward.title) newTitles.push(reward.reward.title);

      // 标记奖励已领取
      updatedPlayer.achievements = [...updatedPlayer.achievements, `herbarium-${reward.herbCount}`];
    });

    // 应用奖励
    updatedPlayer.exp += totalExp;
    updatedPlayer.spiritStones += totalSpiritStones;
    updatedPlayer.attributePoints += totalAttributePoints;

    // 添加称号（如果有）
    if (newTitles.length > 0) {
      // 这里需要根据实际的称号系统来添加称号
      // 暂时只记录日志
      newTitles.forEach(title => {
        addLog(`🏆 获得称号：【${title}】！`, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: `🏆 获得称号：【${title}】！`, type: 'special' });
        }
      });
    }

    // 生成奖励消息
    const rewardParts: string[] = [];
    if (totalExp > 0) rewardParts.push(`${totalExp} 修为`);
    if (totalSpiritStones > 0) rewardParts.push(`${totalSpiritStones} 灵石`);
    if (totalAttributePoints > 0) rewardParts.push(`${totalAttributePoints} 属性点`);

    if (rewardParts.length > 0) {
      addLog(
        `📖 图鉴奖励：收集了 ${herbCount} 种灵草，获得 ${rewardParts.join('、')}！`,
        'special'
      );
      if (setItemActionLog) {
        setItemActionLog({ text: `📖 图鉴奖励：收集了 ${herbCount} 种灵草，获得 ${rewardParts.join('、')}！`, type: 'special' });
      }
    }

    return updatedPlayer;
  };

  /**
   * 时间加速：使用灵石加速灵草生长
   */
  const handleSpeedupHerb = (herbIndex: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      if (grotto.level === 0) {
        addLog('请先购买洞府才能使用加速功能。', 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: '请先购买洞府才能使用加速功能。', type: 'danger' });
        }
        return prev;
      }

      // 检查每日加速次数限制
      const today = new Date().toISOString().split('T')[0];
      let dailySpeedupCount = grotto.dailySpeedupCount || 0;
      const lastSpeedupResetDate = grotto.lastSpeedupResetDate || today;

      // 如果日期变化，重置计数
      if (lastSpeedupResetDate !== today) {
        dailySpeedupCount = 0;
      }

      if (dailySpeedupCount >= SPEEDUP_CONFIG.dailyLimit) {
        addLog(`今日加速次数已达上限（${SPEEDUP_CONFIG.dailyLimit}次），请明天再来。`, 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: `今日加速次数已达上限（${SPEEDUP_CONFIG.dailyLimit}次），请明天再来。`, type: 'danger' });
        }
        return prev;
      }

      const plantedHerbs = [...grotto.plantedHerbs];
      if (herbIndex < 0 || herbIndex >= plantedHerbs.length) {
        addLog('抱歉，找不到这个种植位置。', 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: '抱歉，找不到这个种植位置。', type: 'danger' });
        }
        return prev;
      }

      const herb = plantedHerbs[herbIndex];
      const now = Date.now();

      // 如果已经成熟，不需要加速
      if (now >= herb.harvestTime) {
        addLog('该灵草已经成熟，无需加速。', 'normal');
        if (setItemActionLog) {
          setItemActionLog({ text: '该灵草已经成熟，无需加速。', type: 'normal' });
        }
        return prev;
      }

      // 计算剩余时间和消耗
      const remainingTime = herb.harvestTime - now;
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      const cost = Math.max(
        SPEEDUP_CONFIG.minCost,
        remainingMinutes * SPEEDUP_CONFIG.costPerMinute
      );

      // 检查灵石是否足够
      if (prev.spiritStones < cost) {
        const shortage = cost - prev.spiritStones;
        addLog(`灵石不足！加速需要 ${cost.toLocaleString()} 灵石，当前拥有 ${prev.spiritStones.toLocaleString()} 灵石，还差 ${shortage.toLocaleString()} 灵石。`, 'danger');
        return prev;
      }

      // 立即完成生长
      plantedHerbs[herbIndex] = {
        ...herb,
        harvestTime: now,
      };

      dailySpeedupCount += 1;

      addLog(
        `⚡ 使用 ${cost.toLocaleString()} 灵石加速【${herb.herbName}】生长，立即成熟！`,
        'gain'
      );

      return {
        ...prev,
        spiritStones: prev.spiritStones - cost,
        grotto: {
          ...grotto,
          plantedHerbs: plantedHerbs,
          dailySpeedupCount: dailySpeedupCount,
          lastSpeedupResetDate: today,
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
    handleToggleAutoHarvest,
    handleSpeedupHerb,
  };
}
