import React from 'react';
import { PlayerStats, Item, Pet, ItemType, ItemRarity, EquipmentSlot } from '../../types';
import { PET_TEMPLATES, DISCOVERABLE_RECIPES, getRandomPetName } from '../../constants';
import { uid } from '../../utils/gameUtils';
import { showConfirm } from '../../utils/toastUtils';

interface UseItemHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 辅助函数：应用单个物品效果
 * 抽离核心逻辑以复用，减少 handleUseItem 和 handleBatchUseItems 的重复
 */
const applyItemEffect = (
  prev: PlayerStats,
  item: Item,
  options: {
    addLog: (message: string, type?: string) => void;
    setItemActionLog?: (log: { text: string; type: string } | null) => void;
    isBatch?: boolean;
  }
): PlayerStats => {
  const { addLog, setItemActionLog, isBatch = false } = options;

  // 基础数据克隆
  let newStats = { ...prev };
  let newInv = prev.inventory
    .map((i) => {
      if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
      return i;
    })
    .filter((i) => i.quantity > 0);
  let newPets = [...prev.pets];
  const effectLogs: string[] = [];

  // 1. 处理灵兽蛋孵化
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
      if (item.rarity === '普通') return t.rarity === '普通' || t.rarity === '稀有';
      if (item.rarity === '稀有') return t.rarity === '稀有' || t.rarity === '传说';
      if (item.rarity === '传说') return t.rarity === '传说' || t.rarity === '仙品';
      if (item.rarity === '仙品') return t.rarity === '仙品';
      return true;
    });

    if (availablePets.length > 0) {
      const randomTemplate = availablePets[Math.floor(Math.random() * availablePets.length)];
      const newPet: Pet = {
        id: uid(),
        name: getRandomPetName(randomTemplate),
        species: randomTemplate.species,
        level: 1,
        exp: 0,
        maxExp: 60,
        rarity: randomTemplate.rarity,
        stats: { ...randomTemplate.baseStats },
        skills: [...randomTemplate.skills],
        evolutionStage: 0,
        affection: 50,
      };
      newPets.push(newPet);
      const logMsg = `✨ 孵化出了灵宠【${newPet.name}】！`;
      effectLogs.push(logMsg);
      if (!isBatch) {
        addLog(`🎉 你成功孵化了${item.name}，获得了灵宠【${newPet.name}】！`, 'special');
      }
    } else {
      const logMsg = '但似乎什么都没有孵化出来...';
      effectLogs.push(logMsg);
      if (!isBatch) addLog(`你尝试孵化${item.name}，但似乎什么都没有发生...`, 'normal');
    }
  }

  // 2. 处理临时效果
  if (item.effect?.hp) {
    newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
    effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
  }
  if (item.effect?.exp) {
    newStats.exp += item.effect.exp;
    effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
  }
  if (item.effect?.lifespan) {
    const currentLifespan = newStats.lifespan || newStats.maxLifespan || 100;
    const maxLifespan = newStats.maxLifespan || 100;
    const lifespanIncrease = item.effect.lifespan;
    const nextLifespan = currentLifespan + lifespanIncrease;

    if (nextLifespan > maxLifespan) {
      newStats.maxLifespan = nextLifespan;
      newStats.lifespan = nextLifespan;
    } else {
      newStats.lifespan = nextLifespan;
    }
    effectLogs.push(`寿命增加了 ${lifespanIncrease} 年。`);
  }

  // 3. 处理永久效果
  if (item.permanentEffect) {
    const permLogs: string[] = [];
    const pe = item.permanentEffect;
    if (pe.attack) { newStats.attack += pe.attack; permLogs.push(`攻击力永久 +${pe.attack}`); }
    if (pe.defense) { newStats.defense += pe.defense; permLogs.push(`防御力永久 +${pe.defense}`); }
    if (pe.spirit) { newStats.spirit += pe.spirit; permLogs.push(`神识永久 +${pe.spirit}`); }
    if (pe.physique) { newStats.physique += pe.physique; permLogs.push(`体魄永久 +${pe.physique}`); }
    if (pe.speed) { newStats.speed += pe.speed; permLogs.push(`速度永久 +${pe.speed}`); }
    if (pe.maxHp) {
      newStats.maxHp += pe.maxHp;
      newStats.hp += pe.maxHp;
      permLogs.push(`气血上限永久 +${pe.maxHp}`);
    }
    if (pe.maxLifespan) {
      newStats.maxLifespan = (newStats.maxLifespan || 100) + pe.maxLifespan;
      newStats.lifespan = Math.min(
        newStats.maxLifespan,
        (newStats.lifespan || newStats.maxLifespan || 100) + pe.maxLifespan
      );
      permLogs.push(`最大寿命永久 +${pe.maxLifespan} 年`);
    }
    if (pe.spiritualRoots) {
      const rootNames: Record<string, string> = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
      const rootChanges: string[] = [];
      newStats.spiritualRoots = { ...(newStats.spiritualRoots || { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 }) };

      if (Object.values(pe.spiritualRoots).every(v => v === 0)) {
        const rootTypes: Array<keyof typeof rootNames> = ['metal', 'wood', 'water', 'fire', 'earth'];
        const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
        newStats.spiritualRoots[randomRoot] = Math.min(100, (newStats.spiritualRoots[randomRoot] || 0) + 5);
        rootChanges.push(`${rootNames[randomRoot]}灵根 +5`);
      } else {
        Object.entries(pe.spiritualRoots).forEach(([key, value]) => {
          if (value && value > 0) {
            const rootKey = key as keyof typeof newStats.spiritualRoots;
            newStats.spiritualRoots[rootKey] = Math.min(100, (newStats.spiritualRoots[rootKey] || 0) + value);
            rootChanges.push(`${rootNames[key]}灵根 +${value}`);
          }
        });
      }
      if (rootChanges.length > 0) permLogs.push(`灵根提升：${rootChanges.join('，')}`);
    }
    if (permLogs.length > 0) effectLogs.push(`✨ ${permLogs.join('，')}`);
  }

  // 4. 处理丹方使用
  if (item.type === ItemType.Recipe) {
    let recipeName = item.recipeData?.name || item.name.replace(/丹方$/, '');
    if (!item.recipeData) {
      const matched = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      if (matched) recipeName = matched.name;
    }

    if (recipeName) {
      newStats.unlockedRecipes = [...(newStats.unlockedRecipes || [])];
      if (newStats.unlockedRecipes.includes(recipeName)) {
        if (!isBatch) addLog(`你已经学会了【${recipeName}】的炼制方法。`, 'normal');
      } else {
        const recipeExists = DISCOVERABLE_RECIPES.some(r => r.name === recipeName);
        if (!recipeExists) {
          if (!isBatch) addLog(`【${recipeName}】的配方不存在，无法学习。`, 'danger');
        } else {
          newStats.unlockedRecipes.push(recipeName);
          const stats = { ...(newStats.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };
          newStats.statistics = { ...stats, recipeCount: newStats.unlockedRecipes.length };
          effectLogs.push(`✨ 学会了【${recipeName}】的炼制方法！`);
          if (!isBatch) {
            addLog(`你研读了【${item.name}】，学会了【${recipeName}】的炼制方法！`, 'special');
          }
        }
      }
    } else if (!isBatch) {
      addLog(`无法从【${item.name}】中识别出配方名称。`, 'danger');
    }
  }

  // 5. 显示使用日志 (非灵兽蛋且非丹方)
  if (!isPetEgg && item.type !== ItemType.Recipe) {
    if (item.type === ItemType.Pill || effectLogs.length > 0) {
      const logMessage = effectLogs.length > 0
        ? `你使用了 ${item.name}。 ${effectLogs.join(' ')}`
        : `你使用了 ${item.name}。`;

      if (!isBatch) addLog(logMessage, 'gain');
      if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'gain' });
    }
  } else if (item.type === ItemType.Recipe && effectLogs.length > 0) {
    const logMessage = effectLogs[0];
    if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'special' });
  }

  return { ...newStats, inventory: newInv, pets: newPets };
};

/**
 * 物品处理钩子
 */
export function useItemHandlers({
  setPlayer,
  addLog,
  setItemActionLog,
}: UseItemHandlersProps) {
  const handleUseItem = (item: Item) => {
    setPlayer((prev) => applyItemEffect(prev, item, { addLog, setItemActionLog }));
  };

  const handleDiscardItem = (item: Item) => {
    showConfirm(
      `确定要丢弃 ${item.name} x${item.quantity} 吗？`,
      '确认丢弃',
      () => {
        setPlayer((prev) => {
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
    );
  };

  const handleBatchUseItems = (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    setPlayer((prev) => {
      let currentPlayer = prev;
      itemIds.forEach((itemId) => {
        const item = currentPlayer.inventory.find((i) => i.id === itemId);
        if (item) {
          currentPlayer = applyItemEffect(currentPlayer, item, {
            addLog,
            setItemActionLog,
            isBatch: true
          });
        }
      });
      return currentPlayer;
    });

    if (itemIds.length > 0) {
      addLog(`批量使用了 ${itemIds.length} 件物品。`, 'gain');
    }
  };

  return {
    handleUseItem,
    handleDiscardItem,
    handleBatchUseItems,
  };
}
