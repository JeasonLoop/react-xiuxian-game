import React from 'react';
import { PlayerStats, ItemRarity } from '../../types';
import { PET_TEMPLATES, REALM_DATA, REALM_ORDER, RARITY_MULTIPLIERS } from '../../constants';

interface UsePetHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
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
}: UsePetHandlersProps) {
  const handleActivatePet = (petId: string) => {
    if (!player) return;
    setPlayer((prev) => ({ ...prev, activePetId: petId }));
    const pet = player.pets.find((p) => p.id === petId);
    if (pet) addLog(`你激活了灵宠【${pet.name}】！`, 'gain');
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
      let baseExp = 10; // 基础经验值

      // 根据玩家境界计算基础经验值（境界越高，基础经验值越高）
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      const realmMultiplier = 1 + realmIndex * 0.5; // 每个境界增加50%基础经验
      const levelMultiplier = 1 + prev.realmLevel * 0.1; // 每层增加10%
      baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

      // 根据物品品质计算经验倍率
      let rarityMultiplier = 1;
      if (feedType === 'item' && itemId) {
        const item = prev.inventory.find(i => i.id === itemId);
        if (item) {
          const rarity = item.rarity || '普通';
          rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
        }
      }

      // 计算最终经验值（基础经验 * 品质倍率，有随机波动 ±20%）
      let expGain = Math.floor(baseExp * rarityMultiplier);
      const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 到 1.2
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
    if (!player) return;
    const pet = player.pets.find((p) => p.id === petId);
    if (!pet || pet.evolutionStage >= 2) return;

    const template = PET_TEMPLATES.find((t) => t.species === pet.species);
    if (!template || !template.evolutionRequirements) return;

    if (pet.level < template.evolutionRequirements.level) {
      addLog(
        `灵宠等级不足，需要 ${template.evolutionRequirements.level} 级才能进化`,
        'danger'
      );
      return;
    }

    setPlayer((prev) => {
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          return {
            ...p,
            evolutionStage: p.evolutionStage + 1,
            stats: {
              attack: Math.floor(p.stats.attack * 1.5),
              defense: Math.floor(p.stats.defense * 1.5),
              hp: Math.floor(p.stats.hp * 1.5),
              speed: Math.floor(p.stats.speed * 1.2),
            },
          };
        }
        return p;
      });

      addLog(`【${pet.name}】进化了！实力大幅提升！`, 'special');
      return { ...prev, pets: newPets };
    });
  };

  const handleBatchFeedItems = async (petId: string, itemIds: string[]) => {
    if (!player || itemIds.length === 0) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    // 批量喂养：逐个喂养物品（使用延迟以避免状态更新冲突）
    for (const itemId of itemIds) {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item && item.quantity > 0) {
        handleFeedPet(petId, 'item', itemId);
        // 添加小延迟以确保状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 50));
        // 更新 player 引用以便下次循环使用最新状态
        // 注意：由于 React 的状态更新是异步的，这里可能不能完全同步
        // 但延迟可以帮助避免冲突
      }
    }

    addLog(`批量喂养完成，共使用了 ${itemIds.length} 件物品喂养【${pet.name}】。`, 'gain');
  };

  return {
    handleActivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleEvolvePet,
  };
}
