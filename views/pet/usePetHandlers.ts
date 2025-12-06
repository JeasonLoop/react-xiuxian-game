import React from 'react';
import { PlayerStats, ItemRarity } from '../../types';
import { PET_TEMPLATES, REALM_DATA, REALM_ORDER, RARITY_MULTIPLIERS } from '../../constants';

interface UsePetHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 灵宠处理函数
 * 包含激活灵宠、喂养灵宠、进化灵宠
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleActivatePet 激活灵宠
 * @returns handleFeedPet 喂养灵宠
 * @returns handleEvolvePet 进化灵宠
 */

export function usePetHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UsePetHandlersProps) {
  const handleActivatePet = (petId: string) => {
    if (!player) return;
    setPlayer((prev) => ({ ...prev, activePetId: petId }));
    const pet = player.pets.find((p) => p.id === petId);
    if (pet) addLog(`你激活了灵宠【${pet.name}】！`, 'gain');
  };

  const handleDeactivatePet = () => {
    if (!player) return;
    const activePet = player.pets.find((p) => p.id === player.activePetId);
    setPlayer((prev) => ({ ...prev, activePetId: null }));
    if (activePet) addLog(`你取消了灵宠【${activePet.name}】的激活状态。`, 'normal');
  };

  const handleFeedPet = (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => {
    if (!player) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    // 检查消耗
    let canFeed = false;
    let costMessage = '';

    if (feedType === 'hp') {
      const hpCost = 200;
      if (player.hp >= hpCost) {
        canFeed = true;
        costMessage = `消耗了 ${hpCost} 点气血`;
      } else {
        addLog(
          `气血不足，无法喂养！需要 ${hpCost} 点气血，当前只有 ${player.hp} 点`,
          'danger'
        );
        return;
      }
    } else if (feedType === 'item') {
      if (!itemId) {
        addLog('请选择要喂养的物品', 'danger');
        return;
      }
      const item = player.inventory.find((i) => i.id === itemId);
      if (!item || item.quantity <= 0) {
        addLog('物品不存在或数量不足', 'danger');
        return;
      }
      canFeed = true;
      costMessage = `消耗了 1 个【${item.name}】`;
    } else if (feedType === 'exp') {
      const expCost = Math.max(1, Math.floor(player.exp * 0.05)); // 消耗5%当前修为，至少1点
      if (player.exp >= expCost) {
        canFeed = true;
        costMessage = `消耗了 ${expCost} 点修为`;
      } else {
        addLog(
          `修为不足，无法喂养！需要 ${expCost} 点修为，当前只有 ${player.exp} 点`,
          'danger'
        );
        return;
      }
    }

    if (!canFeed) return;

    setPlayer((prev) => {
      if (!prev) return prev;

      // 先计算经验值（需要物品信息，在扣除之前计算）
      // 大幅增加基础经验值
      let baseExp = 200; // 基础经验值从100提升到200

      // 根据玩家境界计算基础经验值（境界越高，基础经验值越高）
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      const realmMultiplier = 1 + realmIndex * 2.5; // 每个境界增加250%基础经验（从80%提升）
      const levelMultiplier = 1 + prev.realmLevel * 0.5; // 每层增加50%（从15%提升）
      baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

      // 根据喂养类型调整经验倍率
      let feedTypeMultiplier = 1;
      if (feedType === 'hp') {
        feedTypeMultiplier = 1.2; // 气血喂养给1.2倍经验
      } else if (feedType === 'exp') {
        feedTypeMultiplier = 1.5; // 修为喂养给1.5倍经验
      } else if (feedType === 'item') {
        feedTypeMultiplier = 3; // 物品喂养基础倍率从1.0提升到3
      }

      // 根据物品品质计算经验倍率
      let rarityMultiplier = 1;
      if (feedType === 'item' && itemId) {
        const item = prev.inventory.find(i => i.id === itemId);
        if (item) {
          const rarity = item.rarity || '普通';
          rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
          // 材料类物品额外加成
          if (item.type === '材料') {
            rarityMultiplier *= 2.0; // 材料类物品额外加成从50%提升到100%
          }
        }
      }

      // 计算最终经验值（基础经验 * 喂养类型倍率 * 品质倍率，有随机波动 ±15%）
      let expGain = Math.floor(baseExp * feedTypeMultiplier * rarityMultiplier);
      const randomVariation = 0.85 + Math.random() * 0.3; // 0.85 到 1.15
      expGain = Math.floor(expGain * randomVariation);

      // 确保不超过升级所需经验
      const expToNextLevel = pet.maxExp - pet.exp;
      expGain = Math.min(expGain, expToNextLevel);

      // 至少给1点经验
      expGain = Math.max(1, expGain);

      // 扣除消耗
      let newHp = prev.hp;
      let newExp = prev.exp;
      let newInventory = [...prev.inventory];

      if (feedType === 'hp') {
        newHp = Math.max(0, prev.hp - 200);
      } else if (feedType === 'item' && itemId) {
        newInventory = prev.inventory
          .map((item) => {
            if (item.id === itemId) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);
      } else if (feedType === 'exp') {
        const expCost = Math.max(1, Math.floor(prev.exp * 0.05));
        newExp = Math.max(0, prev.exp - expCost);
      }

      // 增加亲密度（每次喂养增加2-5点）
      const affectionGain = Math.floor(2 + Math.random() * 4);

      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          let petNewExp = p.exp + expGain;
          let petNewLevel = p.level;
          let petNewMaxExp = p.maxExp;
          let leveledUp = false;

          // 处理升级（可能因为经验足够而直接升级）
          while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
            petNewExp -= petNewMaxExp;
            petNewLevel += 1;
            petNewMaxExp = Math.floor(petNewMaxExp * 1.5);
            leveledUp = true;
            addLog(`【${p.name}】升级了！现在是 ${petNewLevel} 级`, 'gain');
          }

          // 只有升级时才提升属性
          const newStats = leveledUp
            ? {
                attack: Math.floor(p.stats.attack * 1.1),
                defense: Math.floor(p.stats.defense * 1.1),
                hp: Math.floor(p.stats.hp * 1.1),
                speed: Math.floor(p.stats.speed * 1.05),
              }
            : p.stats;

          // 增加亲密度（最高100）
          const newAffection = Math.min(100, p.affection + affectionGain);

          return {
            ...p,
            level: petNewLevel,
            exp: petNewExp,
            maxExp: petNewMaxExp,
            stats: newStats,
            affection: newAffection,
          };
        }
        return p;
      });

      // 构建反馈消息
      let feedbackMessage = `${costMessage}，【${pet.name}】获得了 ${expGain} 点经验`;
      if (affectionGain > 0) {
        feedbackMessage += `，亲密度提升了 ${affectionGain} 点`;
      }
      addLog(feedbackMessage, 'gain');

      return {
        ...prev,
        hp: newHp,
        exp: newExp,
        inventory: newInventory,
        pets: newPets,
      };
    });
  };

  const handleEvolvePet = (petId: string) => {
    if (!player) {
      addLog('无法进化：玩家数据不存在！', 'danger');
      return;
    }

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) {
      addLog('无法进化：找不到该灵宠！', 'danger');
      return;
    }

    if (pet.evolutionStage >= 2) {
      addLog('灵宠已达到完全体，无法继续进化！', 'danger');
      return;
    }

    const template = PET_TEMPLATES.find((t) => t.species === pet.species);
    if (!template) {
      addLog(`无法进化：找不到【${pet.species}】的模板数据！`, 'danger');
      return;
    }

    if (!template.evolutionRequirements) {
      addLog('该灵宠无法进化！', 'danger');
      return;
    }

    // 确定当前进化阶段的需求
    const nextStage = pet.evolutionStage + 1; // 0->1 或 1->2
    const requirements = nextStage === 1
      ? (template.evolutionRequirements.stage1 || template.evolutionRequirements)
      : (template.evolutionRequirements.stage2 || template.evolutionRequirements);

    // 检查等级要求
    if (pet.level < (requirements.level || 0)) {
      const message = `灵宠等级不足，需要 ${requirements.level} 级才能进化到${nextStage === 1 ? '成熟期' : '完全体'}`;
      addLog(message, 'danger');
      if (setItemActionLog) {
          setItemActionLog({ text: message, type: 'danger' });
          setTimeout(() => setItemActionLog(null), 3000);
        }
      return;
    }

    // 检查材料要求
    if (requirements.items && requirements.items.length > 0) {
      const missingItems: string[] = [];
      requirements.items.forEach((req) => {
        const item = player.inventory.find((i) => i.name === req.name);
        if (!item || item.quantity < req.quantity) {
          missingItems.push(`${req.name} x${req.quantity}`);
        }
      });

      if (missingItems.length > 0) {
        const message = `进化材料不足，需要：${missingItems.join('、')}`;
        addLog(message, 'normal');
        // 显示右上角轻提示
        if (setItemActionLog) {
          setItemActionLog({ text: message, type: 'normal' });
          setTimeout(() => setItemActionLog(null), 3000);
        }
        return;
      }
    }

    setPlayer((prev) => {
      if (!prev) return prev;

      // 扣除材料
      let newInventory = [...prev.inventory];
      if (requirements.items && requirements.items.length > 0) {
        requirements.items.forEach((req) => {
          newInventory = newInventory
            .map((item) => {
              if (item.name === req.name) {
                return { ...item, quantity: item.quantity - req.quantity };
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
        });
      }

      // 更新灵宠
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          const newStage = p.evolutionStage + 1;
          // 根据阶段提升属性（大幅提升以匹配境界）
          const statMultiplier = newStage === 1 ? 3.0 : 3.0; // 成熟期3倍，完全体再3倍（总共9倍）
          const speedMultiplier = newStage === 1 ? 1.5 : 1.5; // 速度提升1.5倍

          // 更新名称（如果有进化名称）
          let newName = p.name;
          if (template.evolutionNames) {
            if (newStage === 1 && template.evolutionNames.stage1) {
              newName = template.evolutionNames.stage1;
            } else if (newStage === 2 && template.evolutionNames.stage2) {
              newName = template.evolutionNames.stage2;
            }
          }

          const stageName = newStage === 1 ? '成熟期' : '完全体';
          addLog(
            `【${p.name}】进化到${stageName}！${newName !== p.name ? `更名为【${newName}】！` : ''}实力大幅提升！`,
            'special'
          );

          return {
            ...p,
            name: newName,
            evolutionStage: newStage,
            stats: {
              attack: Math.floor(p.stats.attack * statMultiplier),
              defense: Math.floor(p.stats.defense * statMultiplier),
              hp: Math.floor(p.stats.hp * statMultiplier),
              speed: Math.floor(p.stats.speed * speedMultiplier),
            },
          };
        }
        return p;
      });

      return { ...prev, inventory: newInventory, pets: newPets };
    });
  };

  const handleBatchFeedItems = (petId: string, itemIds: string[]) => {
    if (!player || itemIds.length === 0) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    // 批量喂养：直接处理所有物品，不使用延迟动画
    setPlayer((prev) => {
      if (!prev) return prev;

      let totalExpGain = 0;
      let totalAffectionGain = 0;
      let newInventory = [...prev.inventory];
      const usedItemIds = new Set<string>();

      // 计算所有物品的总经验值
      itemIds.forEach((itemId) => {
        const item = prev.inventory.find((i) => i.id === itemId);
        if (item && item.quantity > 0 && !usedItemIds.has(itemId)) {
          usedItemIds.add(itemId);

          // 计算这个物品提供的经验（复用喂养逻辑）
          let baseExp = 200; // 基础经验值从100提升到200
          const realmIndex = REALM_ORDER.indexOf(prev.realm);
          const realmMultiplier = 1 + realmIndex * 1.2; // 每个境界增加120%基础经验
          const levelMultiplier = 1 + prev.realmLevel * 0.2; // 每层增加20%
          baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

          // 物品喂养倍率
          const feedTypeMultiplier = 1.3; // 物品喂养基础倍率从1.0提升到1.3

          const rarity = item.rarity || '普通';
          let rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
          if (item.type === '材料') {
            rarityMultiplier *= 2.0; // 材料类物品额外加成从50%提升到100%
          }

          // 应用物品喂养倍率
          baseExp = Math.floor(baseExp * feedTypeMultiplier);

          const expGain = Math.floor(baseExp * rarityMultiplier * (0.85 + Math.random() * 0.3));
          totalExpGain += expGain;

          // 扣除物品
          newInventory = newInventory
            .map((invItem) => {
              if (invItem.id === itemId) {
                return { ...invItem, quantity: invItem.quantity - 1 };
              }
              return invItem;
            })
            .filter((invItem) => invItem.quantity > 0);
        }
      });

      // 增加亲密度（每个物品2-5点）
      totalAffectionGain = Math.floor((2 + Math.random() * 4) * usedItemIds.size);

      // 更新灵宠
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          let petNewExp = p.exp + totalExpGain;
          let petNewLevel = p.level;
          let petNewMaxExp = p.maxExp;
          let leveledUp = false;

          // 处理升级
          while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
            petNewExp -= petNewMaxExp;
            petNewLevel += 1;
            petNewMaxExp = Math.floor(petNewMaxExp * 1.5);
            leveledUp = true;
            addLog(`【${p.name}】升级了！现在是 ${petNewLevel} 级`, 'gain');
          }

          const newStats = leveledUp
            ? {
                attack: Math.floor(p.stats.attack * 1.1),
                defense: Math.floor(p.stats.defense * 1.1),
                hp: Math.floor(p.stats.hp * 1.1),
                speed: Math.floor(p.stats.speed * 1.05),
              }
            : p.stats;

          const newAffection = Math.min(100, p.affection + totalAffectionGain);

          return {
            ...p,
            level: petNewLevel,
            exp: petNewExp,
            maxExp: petNewMaxExp,
            stats: newStats,
            affection: newAffection,
          };
        }
        return p;
      });

      addLog(
        `批量喂养完成，【${pet.name}】获得了 ${totalExpGain} 点经验，亲密度提升了 ${totalAffectionGain} 点。`,
        'gain'
      );

      return {
        ...prev,
        inventory: newInventory,
        pets: newPets,
      };
    });
  };

  const handleReleasePet = (petId: string) => {
    if (!player) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) {
      addLog('找不到该灵宠！', 'danger');
      return;
    }

    // 如果放生的是当前激活的灵宠，需要取消激活
    const isActivePet = player.activePetId === petId;

    setPlayer((prev) => {
      if (!prev) return prev;

      // 移除灵宠
      const newPets = prev.pets.filter((p) => p.id !== petId);

      // 如果放生的是激活的灵宠，取消激活
      const newActivePetId = isActivePet ? null : prev.activePetId;

      // 根据灵宠等级和稀有度给予补偿（灵石）
      const baseCompensation = 100;
      const levelMultiplier = 1 + pet.level * 0.1; // 每级增加10%
      const rarityMultiplier = {
        '普通': 1,
        '稀有': 2,
        '传说': 5,
        '仙品': 10,
      }[pet.rarity] || 1;
      const compensation = Math.floor(baseCompensation * levelMultiplier * rarityMultiplier);

      addLog(
        `你放生了灵宠【${pet.name}】，获得了 ${compensation} 灵石作为补偿。`,
        isActivePet ? 'normal' : 'gain'
      );

      return {
        ...prev,
        pets: newPets,
        activePetId: newActivePetId,
        spiritStones: prev.spiritStones + compensation,
      };
    });
  };

  const handleBatchReleasePets = (petIds: string[]) => {
    if (!player || petIds.length === 0) return;

    setPlayer((prev) => {
      if (!prev) return prev;

      let totalCompensation = 0;
      const releasedPetNames: string[] = [];
      const wasActivePet = petIds.includes(prev.activePetId || '');

      // 计算所有放生灵宠的补偿
      petIds.forEach((petId) => {
        const pet = prev.pets.find((p) => p.id === petId);
        if (pet) {
          const baseCompensation = 100;
          const levelMultiplier = 1 + pet.level * 0.1;
          const rarityMultiplier = {
            '普通': 1,
            '稀有': 2,
            '传说': 5,
            '仙品': 10,
          }[pet.rarity] || 1;
          const compensation = Math.floor(baseCompensation * levelMultiplier * rarityMultiplier);
          totalCompensation += compensation;
          releasedPetNames.push(pet.name);
        }
      });

      // 移除灵宠
      const newPets = prev.pets.filter((p) => !petIds.includes(p.id));

      // 如果放生了激活的灵宠，取消激活
      const newActivePetId = wasActivePet ? null : prev.activePetId;

      addLog(
        `你批量放生了 ${petIds.length} 只灵宠（${releasedPetNames.join('、')}），获得了 ${totalCompensation} 灵石作为补偿。`,
        'gain'
      );

      return {
        ...prev,
        pets: newPets,
        activePetId: newActivePetId,
        spiritStones: prev.spiritStones + totalCompensation,
      };
    });
  };

  return {
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
  };
}
