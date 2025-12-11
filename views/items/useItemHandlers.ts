import React from 'react';
import { PlayerStats, Item, Pet, ItemType } from '../../types';
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
            maxExp: 60, // 降低初始经验值，从100降到60
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
      if (item.effect?.lifespan) {
        const currentLifespan = newStats.lifespan || newStats.maxLifespan || 100;
        const maxLifespan = newStats.maxLifespan || 100;
        const lifespanIncrease = item.effect.lifespan;
        const newLifespan = currentLifespan + lifespanIncrease;

        // 如果增加后的寿命超过最大寿命，同时增加最大寿命
        if (newLifespan > maxLifespan) {
          newStats.maxLifespan = newLifespan;
          newStats.lifespan = newLifespan;
        } else {
          newStats.lifespan = newLifespan;
        }
        effectLogs.push(`寿命增加了 ${lifespanIncrease} 年。`);
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
          if (item.permanentEffect.maxLifespan) {
            newStats.maxLifespan = (newStats.maxLifespan || 100) + item.permanentEffect.maxLifespan;
            newStats.lifespan = Math.min(
              newStats.maxLifespan,
              (newStats.lifespan || newStats.maxLifespan || 100) + item.permanentEffect.maxLifespan
            );
            permLogs.push(`最大寿命永久 +${item.permanentEffect.maxLifespan} 年`);
          }
          if (item.permanentEffect.spiritualRoots) {
            const rootNames: Record<string, string> = {
              metal: '金',
              wood: '木',
              water: '水',
              fire: '火',
              earth: '土',
            };
            const rootChanges: string[] = [];
            if (!newStats.spiritualRoots) {
              newStats.spiritualRoots = {
                metal: 0,
                wood: 0,
                water: 0,
                fire: 0,
                earth: 0,
              };
            }

            // 如果所有灵根都是0，随机分配一个
            if (
              item.permanentEffect.spiritualRoots.metal === 0 &&
              item.permanentEffect.spiritualRoots.wood === 0 &&
              item.permanentEffect.spiritualRoots.water === 0 &&
              item.permanentEffect.spiritualRoots.fire === 0 &&
              item.permanentEffect.spiritualRoots.earth === 0
            ) {
              // 洗灵丹：随机提升一种灵根5点
              const rootTypes: Array<keyof typeof rootNames> = ['metal', 'wood', 'water', 'fire', 'earth'];
              const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
              newStats.spiritualRoots[randomRoot] = Math.min(
                100,
                (newStats.spiritualRoots[randomRoot] || 0) + 5
              );
              rootChanges.push(`${rootNames[randomRoot]}灵根 +5`);
            } else {
              // 其他丹药：按指定值提升
              Object.entries(item.permanentEffect.spiritualRoots).forEach(([key, value]) => {
                if (value && value > 0) {
                  const rootKey = key as keyof typeof newStats.spiritualRoots;
                  newStats.spiritualRoots[rootKey] = Math.min(
                    100,
                    (newStats.spiritualRoots[rootKey] || 0) + value
                  );
                  rootChanges.push(`${rootNames[key]}灵根 +${value}`);
                }
              });
            }

            if (rootChanges.length > 0) {
              permLogs.push(`灵根提升：${rootChanges.join('，')}`);
            }
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
        // 更新统计
        const stats = newStats.statistics || {
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
        newStats.statistics = {
          ...stats,
          recipeCount: newStats.unlockedRecipes.length,
        };
        effectLogs.push(`✨ 学会了【${recipeName}】的炼制方法！`);
        addLog(
          `你研读了【${item.name}】，学会了【${recipeName}】的炼制方法！现在可以在炼丹面板中炼制这种丹药了。`,
          'special'
        );
        // 丹方使用后会被消耗（已在上面处理了数量减少）
      }

      // 对于非灵兽蛋的物品，显示使用日志
      if (!isPetEgg && item.type !== ItemType.Recipe) {
        // 使用丹药时，总是显示提示
        if (item.type === ItemType.Pill) {
          const logMessage = effectLogs.length > 0
            ? `你使用了 ${item.name}。 ${effectLogs.join(' ')}`
            : `你使用了 ${item.name}。`;
          addLog(logMessage, 'gain');
          // 显示轻提示
          if (setItemActionLog) {
            setItemActionLog({ text: logMessage, type: 'gain' });
            // 延迟清除由 App.tsx 中的 useDelayedState 自动处理
          }
        } else if (effectLogs.length > 0) {
          // 其他物品有效果时显示提示
          const logMessage = `你使用了 ${item.name}。 ${effectLogs.join(' ')}`;
          addLog(logMessage, 'gain');
          if (setItemActionLog) {
            setItemActionLog({ text: logMessage, type: 'gain' });
            // 延迟清除由 App.tsx 中的 useDelayedState 自动处理
          }
        }
      } else if (item.type === ItemType.Recipe && effectLogs.length > 0) {
        // 丹方使用后的提示
        const logMessage = effectLogs[0];
        if (setItemActionLog) {
          setItemActionLog({ text: logMessage, type: 'special' });
          // 延迟清除由 App.tsx 中的 useDelayedState 自动处理
        }
      }

      return { ...newStats, inventory: newInv, pets: newPets };
    });
  };

  const handleDiscardItem = (item: Item) => {
    showConfirm(
      `确定要丢弃 ${item.name} x${item.quantity} 吗？`,
      '确认丢弃',
      () => {
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
    );
  };

  const handleBatchUseItems = (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    setPlayer((prev) => {
      let currentPlayer = prev;
      // 逐个使用物品
      itemIds.forEach((itemId) => {
        const item = currentPlayer.inventory.find((i) => i.id === itemId);
        if (!item) return;

        // 创建一个临时的 Item 对象用于使用
        const itemToUse: Item = { ...item };
        // 调用 handleUseItem 的逻辑（复用）
        // 由于我们需要在 setPlayer 内部处理，所以直接在这里实现逻辑
        const newInv = currentPlayer.inventory
          .map((i) => {
            if (i.id === itemId) return { ...i, quantity: i.quantity - 1 };
            return i;
          })
          .filter((i) => i.quantity > 0);

        const effectLogs = [];
        let newStats = { ...currentPlayer };
        let newPets = [...currentPlayer.pets];

        // 处理灵兽蛋孵化
        const isPetEgg =
          itemToUse.name.includes('蛋') ||
          itemToUse.name.toLowerCase().includes('egg') ||
          itemToUse.name.includes('灵兽蛋') ||
          itemToUse.name.includes('灵宠蛋') ||
          (itemToUse.description &&
            (itemToUse.description.includes('孵化') ||
              itemToUse.description.includes('灵宠') ||
              itemToUse.description.includes('灵兽') ||
              itemToUse.description.includes('宠物')));

        if (isPetEgg) {
          const availablePets = PET_TEMPLATES.filter((t) => {
            if (itemToUse.rarity === '普通')
              return t.rarity === '普通' || t.rarity === '稀有';
            if (itemToUse.rarity === '稀有')
              return t.rarity === '稀有' || t.rarity === '传说';
            if (itemToUse.rarity === '传说')
              return t.rarity === '传说' || t.rarity === '仙品';
            if (itemToUse.rarity === '仙品') return t.rarity === '仙品';
            return true;
          });

          if (availablePets.length > 0) {
            const randomTemplate =
              availablePets[Math.floor(Math.random() * availablePets.length)];
            const newPet: Pet = {
              id: uid(),
              name: getRandomPetName(randomTemplate),
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
          }
        }

        // 处理临时效果
        if (itemToUse.effect?.hp) {
          newStats.hp = Math.min(newStats.maxHp, newStats.hp + itemToUse.effect.hp);
          effectLogs.push(`恢复了 ${itemToUse.effect.hp} 点气血。`);
        }
        if (itemToUse.effect?.exp) {
          newStats.exp += itemToUse.effect.exp;
          effectLogs.push(`增长了 ${itemToUse.effect.exp} 点修为。`);
        }
        if (itemToUse.effect?.lifespan) {
          const currentLifespan = newStats.lifespan || newStats.maxLifespan || 100;
          const maxLifespan = newStats.maxLifespan || 100;
          const lifespanIncrease = itemToUse.effect.lifespan;
          const newLifespan = currentLifespan + lifespanIncrease;

          // 如果增加后的寿命超过最大寿命，同时增加最大寿命
          if (newLifespan > maxLifespan) {
            newStats.maxLifespan = newLifespan;
            newStats.lifespan = newLifespan;
          } else {
            newStats.lifespan = newLifespan;
          }
          effectLogs.push(`寿命增加了 ${lifespanIncrease} 年。`);
        }

        // 处理永久效果
        if (itemToUse.permanentEffect) {
          const permLogs = [];
          if (itemToUse.permanentEffect.attack) {
            newStats.attack += itemToUse.permanentEffect.attack;
            permLogs.push(`攻击力永久 +${itemToUse.permanentEffect.attack}`);
          }
          if (itemToUse.permanentEffect.defense) {
            newStats.defense += itemToUse.permanentEffect.defense;
            permLogs.push(`防御力永久 +${itemToUse.permanentEffect.defense}`);
          }
          if (itemToUse.permanentEffect.spirit) {
            newStats.spirit += itemToUse.permanentEffect.spirit;
            permLogs.push(`神识永久 +${itemToUse.permanentEffect.spirit}`);
          }
          if (itemToUse.permanentEffect.physique) {
            newStats.physique += itemToUse.permanentEffect.physique;
            permLogs.push(`体魄永久 +${itemToUse.permanentEffect.physique}`);
          }
          if (itemToUse.permanentEffect.speed) {
            newStats.speed += itemToUse.permanentEffect.speed;
            permLogs.push(`速度永久 +${itemToUse.permanentEffect.speed}`);
          }
          if (itemToUse.permanentEffect.maxHp) {
            newStats.maxHp += itemToUse.permanentEffect.maxHp;
            newStats.hp += itemToUse.permanentEffect.maxHp;
            permLogs.push(`气血上限永久 +${itemToUse.permanentEffect.maxHp}`);
          }
          if (itemToUse.permanentEffect.maxLifespan) {
            newStats.maxLifespan = (newStats.maxLifespan || 100) + itemToUse.permanentEffect.maxLifespan;
            newStats.lifespan = Math.min(
              newStats.maxLifespan,
              (newStats.lifespan || newStats.maxLifespan || 100) + itemToUse.permanentEffect.maxLifespan
            );
            permLogs.push(`最大寿命永久 +${itemToUse.permanentEffect.maxLifespan} 年`);
          }
          if (itemToUse.permanentEffect.spiritualRoots) {
            const rootNames: Record<string, string> = {
              metal: '金',
              wood: '木',
              water: '水',
              fire: '火',
              earth: '土',
            };
            const rootChanges: string[] = [];
            if (!newStats.spiritualRoots) {
              newStats.spiritualRoots = {
                metal: 0,
                wood: 0,
                water: 0,
                fire: 0,
                earth: 0,
              };
            }

            // 如果所有灵根都是0，随机分配一个
            if (
              itemToUse.permanentEffect.spiritualRoots.metal === 0 &&
              itemToUse.permanentEffect.spiritualRoots.wood === 0 &&
              itemToUse.permanentEffect.spiritualRoots.water === 0 &&
              itemToUse.permanentEffect.spiritualRoots.fire === 0 &&
              itemToUse.permanentEffect.spiritualRoots.earth === 0
            ) {
              // 洗灵丹：随机提升一种灵根5点
              const rootTypes: Array<keyof typeof rootNames> = ['metal', 'wood', 'water', 'fire', 'earth'];
              const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
              newStats.spiritualRoots[randomRoot] = Math.min(
                100,
                (newStats.spiritualRoots[randomRoot] || 0) + 5
              );
              rootChanges.push(`${rootNames[randomRoot]}灵根 +5`);
            } else {
              // 其他丹药：按指定值提升
              Object.entries(itemToUse.permanentEffect.spiritualRoots).forEach(([key, value]) => {
                if (value && value > 0) {
                  const rootKey = key as keyof typeof newStats.spiritualRoots;
                  newStats.spiritualRoots[rootKey] = Math.min(
                    100,
                    (newStats.spiritualRoots[rootKey] || 0) + value
                  );
                  rootChanges.push(`${rootNames[key]}灵根 +${value}`);
                }
              });
            }

            if (rootChanges.length > 0) {
              permLogs.push(`灵根提升：${rootChanges.join('，')}`);
            }
          }
          if (permLogs.length > 0) {
            effectLogs.push(`✨ ${permLogs.join('，')}`);
          }
        }

        // 处理丹方使用
        if (itemToUse.type === ItemType.Recipe && itemToUse.recipeData) {
          const recipeName = itemToUse.recipeData.name;
          if (!newStats.unlockedRecipes) {
            newStats.unlockedRecipes = [];
          }
          if (!newStats.unlockedRecipes.includes(recipeName)) {
            newStats.unlockedRecipes = [...newStats.unlockedRecipes, recipeName];
            const stats = newStats.statistics || {
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
            newStats.statistics = {
              ...stats,
              recipeCount: newStats.unlockedRecipes.length,
            };
            effectLogs.push(`✨ 学会了【${recipeName}】的炼制方法！`);
          }
        }

        // 更新当前玩家状态
        currentPlayer = {
          ...newStats,
          inventory: newInv,
          pets: newPets,
        };

        // 对于非灵兽蛋的物品，显示使用日志（批量使用时只记录最后几个）
        if (effectLogs.length > 0 && !isPetEgg && itemToUse.type !== ItemType.Recipe) {
          const logMessage = `使用了 ${itemToUse.name}。 ${effectLogs.join(' ')}`;
          addLog(logMessage, 'gain');
          if (setItemActionLog) {
            setItemActionLog({ text: logMessage, type: 'gain' });
            // 延迟清除由 App.tsx 中的 useDelayedState 自动处理
          }
        }
      });

      return currentPlayer;
    });

    // 批量使用完成提示
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
