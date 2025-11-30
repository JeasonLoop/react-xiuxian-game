import React from 'react';
import { PlayerStats, Item, Pet, ItemType } from '../../types';
import { PET_TEMPLATES, DISCOVERABLE_RECIPES } from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseItemHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 物品处理函数
 * 包含使用物品、丢弃物品
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleUseItem 使用物品
 * @returns handleDiscardItem 丢弃物品
 */
export function useItemHandlers({
  setPlayer,
  addLog,
  setItemActionLog,
}: UseItemHandlersProps) {
  const handleUseItem = (item: Item) => {
    setPlayer((prev) => {
      const newInv = prev.inventory
        .map((i) => {
          if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
          return i;
        })
        .filter((i) => i.quantity > 0);

      const effectLogs = [];
      let newStats = { ...prev };
      let newPets = [...prev.pets];

      // 处理灵兽蛋孵化
      const isPetEgg =
        item.name.includes('蛋') ||
        item.name.toLowerCase().includes('egg') ||
        item.name.includes('灵兽蛋') ||
        item.name.includes('灵宠蛋') ||
        (item.description &&
          (item.description.includes('孵化') ||
            item.description.includes('灵宠') ||
            item.description.includes('灵兽') ||
            item.description.includes('宠物')));

      if (isPetEgg) {
        const availablePets = PET_TEMPLATES.filter((t) => {
          if (item.rarity === '普通')
            return t.rarity === '普通' || t.rarity === '稀有';
          if (item.rarity === '稀有')
            return t.rarity === '稀有' || t.rarity === '传说';
          if (item.rarity === '传说')
            return t.rarity === '传说' || t.rarity === '仙品';
          if (item.rarity === '仙品') return t.rarity === '仙品';
          return true;
        });

        if (availablePets.length > 0) {
          const randomTemplate =
            availablePets[Math.floor(Math.random() * availablePets.length)];
          const newPet: Pet = {
            id: uid(),
            name: randomTemplate.name,
            species: randomTemplate.species,
            level: 1,
            exp: 0,
            maxExp: 100,
            rarity: randomTemplate.rarity,
            stats: { ...randomTemplate.baseStats },
            skills: [...randomTemplate.skills],
            evolutionStage: 0,
            affection: 50,
          };
          newPets.push(newPet);
          effectLogs.push(`✨ 孵化出了灵宠【${newPet.name}】！`);
          addLog(
            `🎉 你成功孵化了${item.name}，获得了灵宠【${newPet.name}】！`,
            'special'
          );
        } else {
          effectLogs.push('但似乎什么都没有孵化出来...');
          addLog(`你尝试孵化${item.name}，但似乎什么都没有发生...`, 'normal');
        }
      }

      // 处理临时效果
      if (item.effect?.hp) {
        newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
        effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
      }
      if (item.effect?.exp) {
        newStats.exp += item.effect.exp;
        effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
      }

      // 处理永久效果
      if (item.permanentEffect) {
        const permLogs = [];
        if (item.permanentEffect.attack) {
          newStats.attack += item.permanentEffect.attack;
          permLogs.push(`攻击力永久 +${item.permanentEffect.attack}`);
        }
        if (item.permanentEffect.defense) {
          newStats.defense += item.permanentEffect.defense;
          permLogs.push(`防御力永久 +${item.permanentEffect.defense}`);
        }
        if (item.permanentEffect.spirit) {
          newStats.spirit += item.permanentEffect.spirit;
          permLogs.push(`神识永久 +${item.permanentEffect.spirit}`);
        }
        if (item.permanentEffect.physique) {
          newStats.physique += item.permanentEffect.physique;
          permLogs.push(`体魄永久 +${item.permanentEffect.physique}`);
        }
        if (item.permanentEffect.speed) {
          newStats.speed += item.permanentEffect.speed;
          permLogs.push(`速度永久 +${item.permanentEffect.speed}`);
        }
        if (item.permanentEffect.maxHp) {
          newStats.maxHp += item.permanentEffect.maxHp;
          newStats.hp += item.permanentEffect.maxHp;
          permLogs.push(`气血上限永久 +${item.permanentEffect.maxHp}`);
        }
        if (permLogs.length > 0) {
          effectLogs.push(`✨ ${permLogs.join('，')}`);
        }
      }

      // 处理丹方使用
      if (item.type === ItemType.Recipe && item.recipeData) {
        const recipeName = item.recipeData.name;
        // 确保 unlockedRecipes 存在（兼容旧存档）
        if (!newStats.unlockedRecipes) {
          newStats.unlockedRecipes = [];
        }
        // 检查是否已经解锁
        if (newStats.unlockedRecipes.includes(recipeName)) {
          addLog(`你已经学会了【${recipeName}】的炼制方法。`, 'normal');
          // 即使已解锁，也要消耗丹方物品
          return { ...newStats, inventory: newInv, pets: newPets };
        }
        // 解锁丹方
        newStats.unlockedRecipes = [...newStats.unlockedRecipes, recipeName];
        effectLogs.push(`✨ 学会了【${recipeName}】的炼制方法！`);
        addLog(
          `你研读了【${item.name}】，学会了【${recipeName}】的炼制方法！现在可以在炼丹面板中炼制这种丹药了。`,
          'special'
        );
        // 丹方使用后会被消耗（已在上面处理了数量减少）
      }

      // 对于非灵兽蛋的物品，显示使用日志
      if (effectLogs.length > 0 && !isPetEgg && item.type !== ItemType.Recipe) {
        const logMessage = `你使用了 ${item.name}。 ${effectLogs.join(' ')}`;
        addLog(logMessage, 'gain');
        // 显示轻提示
        if (setItemActionLog) {
          setItemActionLog({ text: logMessage, type: 'gain' });
          setTimeout(() => setItemActionLog(null), 3000);
        }
      } else if (item.type === ItemType.Recipe && effectLogs.length > 0) {
        // 丹方使用后的提示
        const logMessage = effectLogs[0];
        if (setItemActionLog) {
          setItemActionLog({ text: logMessage, type: 'special' });
          setTimeout(() => setItemActionLog(null), 3000);
        }
      }

      return { ...newStats, inventory: newInv, pets: newPets };
    });
  };

  const handleDiscardItem = (item: Item) => {
    if (window.confirm(`确定要丢弃 ${item.name} x${item.quantity} 吗？`)) {
      setPlayer((prev) => {
        // 检查是否已装备
        const isEquipped = Object.values(prev.equippedItems).includes(item.id);
        if (isEquipped) {
          addLog('无法丢弃已装备的物品！请先卸下。', 'danger');
          return prev;
        }

        const newInv = prev.inventory.filter((i) => i.id !== item.id);
        addLog(`你丢弃了 ${item.name} x${item.quantity}。`, 'normal');
        return { ...prev, inventory: newInv };
      });
    }
  };

  return {
    handleUseItem,
    handleDiscardItem,
  };
}
