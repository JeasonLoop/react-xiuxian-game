import React from 'react';
import { PlayerStats, Item, ItemType, EquipmentSlot, ItemRarity } from '../../types';
import { getItemStats } from '../../utils/itemUtils';
import { UPGRADE_MATERIAL_NAME, UPGRADE_STONE_NAME, UPGRADE_STONE_SUCCESS_BONUS, getUpgradeMultiplier, RARITY_MULTIPLIERS } from '../../constants';

interface UseEquipmentHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 装备处理函数
 * 包含装备物品、卸下物品、祭炼本命法宝、解除祭炼本命法宝、打开升级界面、升级物品
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleEquipItem 装备物品
 * @returns handleUnequipItem 卸下物品
 * @returns handleRefineNatalArtifact 祭炼本命法宝
 * @returns handleUnrefineNatalArtifact 解除祭炼本命法宝
 * @returns handleOpenUpgrade 打开升级界面
 * @returns handleUpgradeItem 升级物品
 */
export function useEquipmentHandlers({
  player,
  setPlayer,
  addLog,
}: UseEquipmentHandlersProps) {
  const handleEquipItem = (item: Item, slot: EquipmentSlot) => {
    // 检查装备类型是否匹配
    if (!item.equipmentSlot) {
      addLog('该物品无法装备！', 'danger');
      return;
    }

    setPlayer((prev) => {
      // 检查物品是否在背包中
      const itemInInventory = prev.inventory.find((i) => i.id === item.id);
      if (!itemInInventory) {
        addLog('该物品不在背包中！', 'danger');
        return prev;
      }

      // 对于戒指、首饰、法宝，允许装备到任意同类型的空槽位
      const isRing = item.type === ItemType.Ring;
      const isAccessory = item.type === ItemType.Accessory;
      const isArtifact = item.type === ItemType.Artifact;

      if (isRing) {
        const ringSlots = [
          EquipmentSlot.Ring1,
          EquipmentSlot.Ring2,
          EquipmentSlot.Ring3,
          EquipmentSlot.Ring4,
        ];
        if (!ringSlots.includes(slot)) {
          addLog('戒指只能装备到戒指槽位！', 'danger');
          return prev;
        }
      } else if (isAccessory) {
        const accessorySlots = [
          EquipmentSlot.Accessory1,
          EquipmentSlot.Accessory2,
        ];
        if (!accessorySlots.includes(slot)) {
          addLog('首饰只能装备到首饰槽位！', 'danger');
          return prev;
        }
      } else if (isArtifact) {
        const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
        if (!artifactSlots.includes(slot)) {
          addLog('法宝只能装备到法宝槽位！', 'danger');
          return prev;
        }
      } else {
        // 其他装备类型需要精确匹配
        if (item.equipmentSlot !== slot) {
          addLog('装备部位不匹配！', 'danger');
          return prev;
        }
      }

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;
      const newEquippedItems = { ...prev.equippedItems };

      // 0. 如果该物品已经在其他槽位装备，先卸下旧槽位的装备
      let oldSlot: EquipmentSlot | null = null;
      for (const [equippedSlot, equippedItemId] of Object.entries(prev.equippedItems)) {
        if (equippedItemId === item.id && equippedSlot !== slot) {
          oldSlot = equippedSlot as EquipmentSlot;
          // 移除旧槽位的装备ID
          delete newEquippedItems[oldSlot];
          // 减去旧槽位的属性（如果物品已经在某个槽位，属性已经被计算过了，所以需要先减去）
          const isNatal = item.id === prev.natalArtifactId;
          const oldStats = getItemStats(item, isNatal);
          newAttack -= oldStats.attack;
          newDefense -= oldStats.defense;
          newMaxHp -= oldStats.hp;
          newSpirit -= oldStats.spirit;
          newPhysique -= oldStats.physique;
          newSpeed -= oldStats.speed;
          break;
        }
      }

      // 1. Remove stats from currently equipped item in this slot if any
      const currentEquippedId = prev.equippedItems[slot];
      if (currentEquippedId && currentEquippedId !== item.id) {
        const currentEquipped = prev.inventory.find(
          (i) => i.id === currentEquippedId
        );
        if (currentEquipped) {
          const isNatal = currentEquipped.id === prev.natalArtifactId;
          const stats = getItemStats(currentEquipped, isNatal);
          newAttack -= stats.attack;
          newDefense -= stats.defense;
          newMaxHp -= stats.hp;
          newSpirit -= stats.spirit;
          newPhysique -= stats.physique;
          newSpeed -= stats.speed;
        }
      }

      // 2. Add stats from new item
      const isNatal = item.id === prev.natalArtifactId;
      const newStats = getItemStats(item, isNatal);
      newAttack += newStats.attack;
      newDefense += newStats.defense;
      newMaxHp += newStats.hp;
      newSpirit += newStats.spirit;
      newPhysique += newStats.physique;
      newSpeed += newStats.speed;

      // 3. Update equipped items
      newEquippedItems[slot] = item.id;

      if (oldSlot) {
        addLog(`你将 ${item.name} 从${oldSlot}移动到${slot}。`, 'normal');
      } else {
        addLog(`你装备了 ${item.name} 到${slot}，实力有所提升。`, 'normal');
      }

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp),
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    setPlayer((prev) => {
      const currentEquippedId = prev.equippedItems[slot];
      if (!currentEquippedId) {
        addLog('该栏位没有装备！', 'danger');
        return prev;
      }

      const item = prev.inventory.find((i) => i.id === currentEquippedId);
      if (!item) return prev;

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isNatal = item.id === prev.natalArtifactId;
      const stats = getItemStats(item, isNatal);
      newAttack -= stats.attack;
      newDefense -= stats.defense;
      newMaxHp -= stats.hp;
      newSpirit -= stats.spirit;
      newPhysique -= stats.physique;
      newSpeed -= stats.speed;

      const newEquippedItems = { ...prev.equippedItems };
      delete newEquippedItems[slot];

      addLog(`你卸下了 ${item.name}。`, 'normal');

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp),
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleRefineNatalArtifact = (item: Item) => {
    if (item.type !== ItemType.Artifact) {
      addLog('只有法宝才能祭炼为本命法宝！', 'danger');
      return;
    }

    if (item.isNatal) {
      addLog('该法宝已经是本命法宝！', 'normal');
      return;
    }

    setPlayer((prev) => {
      if (prev.natalArtifactId) {
        const currentNatal = prev.inventory.find(
          (i) => i.id === prev.natalArtifactId
        );
        if (currentNatal) {
          addLog(
            `你已经拥有本命法宝【${currentNatal.name}】，需要先解除祭炼才能祭炼新的法宝。`,
            'danger'
          );
          return prev;
        }
      }

      // 消耗气血上限
      const rarity = (item.rarity as ItemRarity) || '普通';
      const hpCostMap: Record<ItemRarity, number> = {
        普通: 50,
        稀有: 100,
        传说: 200,
        仙品: 500,
      };
      const hpCost = hpCostMap[rarity];

      if (prev.maxHp <= hpCost) {
        addLog(`气血上限不足！祭炼需要消耗 ${hpCost} 点气血上限。`, 'danger');
        return prev;
      }

      // 更新物品，标记为本命
      const newInventory = prev.inventory.map((i) => {
        if (i.id === item.id) {
          return { ...i, isNatal: true };
        }
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      const newMaxHp = prev.maxHp - hpCost;
      const newHp = Math.min(prev.hp, newMaxHp);

      // 如果本命法宝已装备，需要重新计算属性
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        const oldStats = getItemStats(item, false);
        const newStats = getItemStats(item, true);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog(
        `你消耗了 ${hpCost} 点气血上限，将【${item.name}】祭炼为本命法宝！`,
        'special'
      );
      addLog(`本命法宝与你的生命相连，属性加成提升50%！`, 'special');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: item.id,
        maxHp: newMaxHp,
        hp: newHp,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleUnrefineNatalArtifact = () => {
    setPlayer((prev) => {
      if (!prev.natalArtifactId) {
        addLog('你没有本命法宝！', 'danger');
        return prev;
      }

      const natalItem = prev.inventory.find(
        (i) => i.id === prev.natalArtifactId
      );
      if (!natalItem) {
        addLog('本命法宝不存在！', 'danger');
        return prev;
      }

      const newInventory = prev.inventory.map((i) => {
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      // 如果本命法宝已装备，需要重新计算属性（移除本命加成）
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isEquipped = Object.values(prev.equippedItems).includes(
        prev.natalArtifactId
      );
      if (isEquipped) {
        const oldStats = getItemStats(natalItem, true);
        const newStats = getItemStats(natalItem, false);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog('你解除了本命法宝的祭炼。', 'normal');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: null,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleOpenUpgrade = (item: Item) => {
    return item; // 这个函数主要用于设置状态，实际逻辑在调用处
  };

  const handleUpgradeItem = (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number = 0
  ) => {
    setPlayer((prev) => {
      const matsItem = prev.inventory.find(
        (i) => i.name === UPGRADE_MATERIAL_NAME
      );
      const upgradeStoneItem = prev.inventory.find(
        (i) => i.name === UPGRADE_STONE_NAME
      );

      if (
        prev.spiritStones < costStones ||
        !matsItem ||
        matsItem.quantity < costMats ||
        !upgradeStoneItem ||
        upgradeStoneItem.quantity < upgradeStones
      ) {
        return prev;
      }

      // 计算成功率
      const currentLevel = item.level || 0;
      const rarity = item.rarity || '普通';
      const rarityMult = RARITY_MULTIPLIERS[rarity];
      const baseSuccessRate = Math.max(0.1, 1 - (currentLevel * 0.1) - (rarityMult - 1) * 0.15);
      const successRate = Math.min(1, baseSuccessRate + upgradeStones * UPGRADE_STONE_SUCCESS_BONUS);

      // 判断是否成功
      const isSuccess = Math.random() < successRate;

      // 消耗材料
      const newInventory = prev.inventory
        .map((i) => {
          if (i.name === UPGRADE_MATERIAL_NAME) {
            return { ...i, quantity: i.quantity - costMats };
          }
          if (i.name === UPGRADE_STONE_NAME && upgradeStones > 0) {
            return { ...i, quantity: i.quantity - upgradeStones };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      // 消耗灵石（无论成功失败都消耗）
      const newSpiritStones = prev.spiritStones - costStones;

      if (!isSuccess) {
        addLog(`祭炼失败！${item.name} 未能提升品质，材料已消耗。`, 'danger');
        return {
          ...prev,
          spiritStones: newSpiritStones,
          inventory: newInventory,
        };
      }

      // 成功：提升属性
      const growthRate = getUpgradeMultiplier(rarity);
      const getNextStat = (val: number) => Math.floor(val * (1 + growthRate));

      const newEffect = {
        ...item.effect,
        attack: item.effect?.attack
          ? getNextStat(item.effect.attack)
          : undefined,
        defense: item.effect?.defense
          ? getNextStat(item.effect.defense)
          : undefined,
        hp: item.effect?.hp ? getNextStat(item.effect.hp) : undefined,
        spirit: item.effect?.spirit
          ? getNextStat(item.effect.spirit)
          : undefined,
        physique: item.effect?.physique
          ? getNextStat(item.effect.physique)
          : undefined,
        speed: item.effect?.speed ? getNextStat(item.effect.speed) : undefined,
      };

      const finalInventory = newInventory.map((i) => {
        if (i.id === item.id) {
          return {
            ...i,
            level: (i.level || 0) + 1,
            effect: newEffect,
          };
        }
        return i;
      });

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // Check if item is equipped in any slot
      const equippedSlot = Object.entries(prev.equippedItems).find(
        ([_, itemId]) => itemId === item.id
      )?.[0] as EquipmentSlot | undefined;
      if (equippedSlot) {
        const isNatal = item.id === prev.natalArtifactId;
        const oldStats = getItemStats(item, isNatal);
        newAttack -= oldStats.attack;
        newDefense -= oldStats.defense;
        newMaxHp -= oldStats.hp;
        newSpirit -= oldStats.spirit;
        newPhysique -= oldStats.physique;
        newSpeed -= oldStats.speed;

        const newItem = { ...item, effect: newEffect, level: (item.level || 0) + 1 };
        const newStats = getItemStats(newItem, isNatal);

        newAttack += newStats.attack;
        newDefense += newStats.defense;
        newMaxHp += newStats.hp;
        newSpirit += newStats.spirit;
        newPhysique += newStats.physique;
        newSpeed += newStats.speed;
      }

      addLog(`祭炼成功！${item.name} 品质提升了。`, 'gain');

      return {
        ...prev,
        spiritStones: newSpiritStones,
        inventory: finalInventory,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  return {
    handleEquipItem,
    handleUnequipItem,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleOpenUpgrade,
    handleUpgradeItem,
  };
}

