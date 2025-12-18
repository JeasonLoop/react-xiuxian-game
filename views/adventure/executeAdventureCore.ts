import React from 'react';
import {
  PlayerStats,
  AdventureResult,
  AdventureType,
  Item,
  ItemType,
  ItemRarity,
  EquipmentSlot,
  Pet,
  RealmType,
} from '../../types';
import {
  REALM_ORDER,
  TALENTS,
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  DISCOVERABLE_RECIPES,
  PET_EVOLUTION_MATERIALS,
  getRandomPetName,
  REALM_DATA,
} from '../../constants';
import { BattleReplay } from '../../services/battleService';
import { generateAdventureEvent } from '../../services/aiService';
import { uid } from '../../utils/gameUtils';
import {
  normalizeItemEffect,
  inferItemTypeAndSlot,
  adjustEquipmentStatsByRealm,
} from '../../utils/itemUtils';
import { normalizeRarityValue } from '../../utils/rarityUtils';

/**
 * 历练核心逻辑
 * 包含物品处理、灵宠处理、功法处理、天赋处理、属性降低处理、抽奖券和传承处理、随机秘境处理
 * @param result 历练结果
 * @param battleContext 战斗上下文
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param triggerVisual 触发视觉效果
 * @param onOpenBattleModal 打开战斗模态框
 * @param realmName 历练场景名称
 * @param adventureType 历练类型
 * @returns 历练核心逻辑
 */

interface ExecuteAdventureCoreProps {
  result: AdventureResult;
  battleContext: BattleReplay | null;
  petSkillCooldowns?: Record<string, number>; // 战斗结束后的灵宠技能冷却状态
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  onOpenBattleModal: (replay: BattleReplay) => void;
  realmName?: string;
  adventureType: AdventureType;
  skipBattle?: boolean; // 是否跳过战斗（自动模式下）
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void; // 声望事件回调
}

/**
 * 为装备添加属性（如果装备没有属性，根据品阶自动生成）
 * @param itemType 物品类型
 * @param effect 当前效果
 * @param rarity 稀有度
 * @param realm 玩家境界（用于平衡数值）
 * @param realmLevel 玩家境界等级（用于平衡数值）
 * @returns 更新后的效果对象
 */
function ensureEquipmentAttributes(
  itemType: ItemType,
  effect: AdventureResult['itemObtained']['effect'] | undefined,
  rarity: ItemRarity,
  realm?: RealmType,
  realmLevel?: number
): AdventureResult['itemObtained']['effect'] | undefined {
  // 只处理装备类型
  const equipmentTypes = [
    ItemType.Artifact,
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Accessory,
    ItemType.Ring,
  ];

  if (!equipmentTypes.includes(itemType)) {
    return effect;
  }

  // 移除exp加成（装备不应该提供修为加成）
  let processedEffect = effect;
  if (processedEffect?.exp) {
    const { exp, ...restEffect } = processedEffect;
    processedEffect = restEffect;
  }

  // 获取境界基础属性作为参考
  let realmData = realm ? REALM_DATA[realm] : null;
  if (!realmData) {
    // 如果没有提供境界，使用炼气期作为默认
    realmData = REALM_DATA[RealmType.QiRefining];
  }

  const level = realmLevel || 1;
  const levelMultiplier = 1 + (level - 1) * 0.05;

  // 根据稀有度确定装备数值占境界基础属性的百分比（提高装备属性占比）
  const rarityPercentages: Record<ItemRarity, { min: number; max: number }> = {
    普通: { min: 0.08, max: 0.12 },
    稀有: { min: 0.20, max: 0.30 }, // 提高稀有装备数值
    传说: { min: 0.40, max: 0.60 }, // 大幅提高传说装备数值
    仙品: { min: 0.70, max: 1.00 }, // 大幅提高仙品装备数值
  };

  // 根据稀有度设置最小属性值（确保高品质装备数值更高）
  const rarityMinStats: Record<ItemRarity, { attack: number; defense: number; hp: number; spirit: number; physique: number; speed: number }> = {
    普通: { attack: 1, defense: 1, hp: 5, spirit: 1, physique: 1, speed: 1 },
    稀有: { attack: 5, defense: 3, hp: 20, spirit: 3, physique: 3, speed: 3 },
    传说: { attack: 15, defense: 10, hp: 50, spirit: 10, physique: 10, speed: 10 },
    仙品: { attack: 50, defense: 30, hp: 150, spirit: 30, physique: 30, speed: 30 },
  };

  const percentage = rarityPercentages[rarity] || rarityPercentages['普通'];
  const targetPercentage = percentage.min + (percentage.max - percentage.min) * Math.random();
  const minStats = rarityMinStats[rarity] || rarityMinStats['普通'];

  // 检查是否已有任何属性
  const hasAnyAttribute =
    processedEffect?.attack ||
    processedEffect?.defense ||
    processedEffect?.hp ||
    processedEffect?.spirit ||
    processedEffect?.physique ||
    processedEffect?.speed;

  // 如果没有属性，根据品阶和境界生成属性
  // 如果有属性但数值太低（不符合稀有度），也需要重新生成或调整
  if (!hasAnyAttribute || (hasAnyAttribute && processedEffect && (
    (processedEffect.attack && processedEffect.attack < minStats.attack) ||
    (processedEffect.defense && processedEffect.defense < minStats.defense) ||
    (processedEffect.hp && processedEffect.hp < minStats.hp) ||
    (processedEffect.spirit && processedEffect.spirit < minStats.spirit) ||
    (processedEffect.physique && processedEffect.physique < minStats.physique) ||
    (processedEffect.speed && processedEffect.speed < minStats.speed)
  ))) {
    // 随机生成1-3种属性
    const attributeTypes = [
      'attack',
      'defense',
      'hp',
      'spirit',
      'physique',
      'speed',
    ];
    const numAttributes = Math.floor(Math.random() * 3) + 1; // 1-3种属性
    const selectedAttributes = attributeTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, numAttributes);

    const newEffect: NonNullable<AdventureResult['itemObtained']>['effect'] = {};

    // 如果已有属性，保留符合稀有度的属性，只替换或生成不符合的
    if (hasAnyAttribute && processedEffect) {
      // 保留符合稀有度要求的现有属性
      if (processedEffect.attack && processedEffect.attack >= minStats.attack) {
        newEffect.attack = processedEffect.attack;
      }
      if (processedEffect.defense && processedEffect.defense >= minStats.defense) {
        newEffect.defense = processedEffect.defense;
      }
      if (processedEffect.hp && processedEffect.hp >= minStats.hp) {
        newEffect.hp = processedEffect.hp;
      }
      if (processedEffect.spirit && processedEffect.spirit >= minStats.spirit) {
        newEffect.spirit = processedEffect.spirit;
      }
      if (processedEffect.physique && processedEffect.physique >= minStats.physique) {
        newEffect.physique = processedEffect.physique;
      }
      if (processedEffect.speed && processedEffect.speed >= minStats.speed) {
        newEffect.speed = processedEffect.speed;
      }
    }

    // 为选中的属性生成或更新数值
    selectedAttributes.forEach((attr) => {
      // 如果该属性已经存在且符合要求，跳过
      if (newEffect[attr as keyof typeof newEffect] !== undefined) {
        return;
      }

      let baseValue = 0;
      switch (attr) {
        case 'attack':
          baseValue = realmData.baseAttack;
          break;
        case 'defense':
          baseValue = realmData.baseDefense;
          break;
        case 'hp':
          baseValue = realmData.baseMaxHp;
          break;
        case 'spirit':
          baseValue = realmData.baseSpirit;
          break;
        case 'physique':
          baseValue = realmData.basePhysique;
          break;
        case 'speed':
          baseValue = realmData.baseSpeed;
          break;
      }
      // 根据境界基础属性和稀有度百分比生成数值
      const value = Math.floor(baseValue * targetPercentage * levelMultiplier);
      // 确保数值不低于该稀有度的最小值
      const minValue = minStats[attr as keyof typeof minStats];
      const finalValue = Math.max(minValue, value);

      // 类型安全地设置属性
      if (attr === 'attack') {
        newEffect.attack = finalValue;
      } else if (attr === 'defense') {
        newEffect.defense = finalValue;
      } else if (attr === 'hp') {
        newEffect.hp = finalValue;
      } else if (attr === 'spirit') {
        newEffect.spirit = finalValue;
      } else if (attr === 'physique') {
        newEffect.physique = finalValue;
      } else if (attr === 'speed') {
        newEffect.speed = finalValue;
      }
    });

    return newEffect;
  }

  return processedEffect;
}

export async function executeAdventureCore({
  result,
  battleContext,
  petSkillCooldowns,
  player,
  setPlayer,
  addLog,
  triggerVisual,
  onOpenBattleModal,
  realmName,
  adventureType,
  skipBattle = false,
  riskLevel,
  onReputationEvent,
}: ExecuteAdventureCoreProps & {
  riskLevel?: '低' | '中' | '高' | '极度危险';
}) {
  // Handle Visuals
  // 确保hpChange是有效数字
  const safeHpChange = typeof result.hpChange === 'number' && !isNaN(result.hpChange) ? result.hpChange : 0;

  if (safeHpChange < 0) {
    triggerVisual('damage', String(safeHpChange), 'text-red-500');
    if (document.body) {
      document.body.classList.add('animate-shake');
      setTimeout(() => document.body.classList.remove('animate-shake'), 500);
    }
  } else if (safeHpChange > 0) {
    triggerVisual('heal', `+${safeHpChange}`, 'text-emerald-400');
  }

  if (result.eventColor === 'danger' || adventureType === 'secret_realm') {
    triggerVisual('slash');
  }

  // 核心玩家状态更新逻辑，从 App.tsx 中迁移而来
  setPlayer((prev) => {
    if (!prev) return prev;

    let newInv = [...prev.inventory];
    let newArts = [...prev.cultivationArts];
    // 确保所有已学习的功法都在 unlockedArts 中（修复旧存档问题）
    // 重要：基于 prev.unlockedArts 和 prev.cultivationArts 的并集，确保不会丢失已解锁的功法
    let newUnlockedArts = [...(prev.unlockedArts || [])];
    // 同步 cultivationArts 到 unlockedArts（修复通过其他方式获得的功法未解锁的问题）
    // 注意：这里同步的是 prev.cultivationArts，因为 newArts 可能还没有包含本次历练获得的功法
    prev.cultivationArts.forEach(artId => {
      if (!newUnlockedArts.includes(artId)) {
        newUnlockedArts.push(artId);
        console.log(`[功法解锁] 修复同步: 将已学习的功法 ${artId} 添加到 unlockedArts`);
      }
    });
    let newTalentId = prev.talentId;
    let newAttack = prev.attack;
    let newDefense = prev.defense;
    let newMaxHp = prev.maxHp;
    let newHp = prev.hp;
    let newLuck = prev.luck;
    let newLotteryTickets = prev.lotteryTickets;
    let newInheritanceLevel = prev.inheritanceLevel;
    let newPets = [...prev.pets];
    let newReputation = prev.reputation || 0;
    // 更新统计
    const stats = prev.statistics || {
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
    let newStats = { ...stats };

    // 更新历练次数
    newStats.adventureCount += 1;

    // 更新秘境次数
    if (realmName) {
      newStats.secretRealmCount += 1;
    }

    // 更新战斗胜利次数
    if (battleContext && battleContext.victory) {
      newStats.killCount += 1;
    }

    // 更新灵宠技能冷却（如果有战斗且灵宠激活）
    if (petSkillCooldowns && prev.activePetId) {
      newPets = newPets.map((pet) => {
        if (pet.id === prev.activePetId) {
          // 合并技能冷却，保留已有的冷却时间（取较大值，防止覆盖）
          const updatedCooldowns = { ...pet.skillCooldowns };
          Object.keys(petSkillCooldowns).forEach((skillId) => {
            const newCooldown = petSkillCooldowns[skillId];
            if (newCooldown > 0) {
              // 如果已有冷却，取较大值；否则使用新的冷却
              updatedCooldowns[skillId] = Math.max(
                updatedCooldowns[skillId] || 0,
                newCooldown
              );
            }
          });
          // 清理冷却时间为0的技能
          const finalCooldowns: Record<string, number> = {};
          Object.keys(updatedCooldowns).forEach((skillId) => {
            if (updatedCooldowns[skillId] > 0) {
              finalCooldowns[skillId] = updatedCooldowns[skillId];
            }
          });
          return {
            ...pet,
            skillCooldowns: Object.keys(finalCooldowns).length > 0 ? finalCooldowns : undefined,
          };
        }
        return pet;
      });
    }

    // 处理获得的多个物品（搜刮奖励等）
    if (result.itemsObtained && Array.isArray(result.itemsObtained) && result.itemsObtained.length > 0) {
      // 用于跟踪本次获得的物品名称，避免数组内部重复
      const currentBatchNames = new Set<string>();

      result.itemsObtained.forEach((itemData) => {
        try {
          // 验证物品数据完整性
          if (!itemData || !itemData.name || typeof itemData.name !== 'string' || itemData.name.trim() === '') {
            console.warn('[物品处理] 跳过无效物品数据:', itemData);
            addLog(`⚠️ 获得了一个无效物品，已跳过。`, 'normal');
            return; // 跳过无效物品
          }

          let itemName = itemData.name.trim();

        // 检查数组内部是否有重复名称（装备类物品）
        const isEquippableCheck = itemData.isEquippable;
        const equipmentSlotCheck = itemData.equipmentSlot;
        const isEquipmentCheck = isEquippableCheck && equipmentSlotCheck;

        if (isEquipmentCheck && currentBatchNames.has(itemName)) {
          // 如果数组内部已有同名装备，生成变体名称
          const baseName = itemName;
          const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
          let variantName = baseName;
          let attempts = 0;
          while (currentBatchNames.has(variantName) && attempts < suffixes.length) {
            variantName = baseName + suffixes[attempts];
            attempts++;
          }
          if (attempts >= suffixes.length) {
            // 如果所有变体都被占用，跳过这个装备
            addLog(`⚠️ 本次获得的物品中有重复的装备【${itemName}】，跳过重复装备。`, 'normal');
            return; // 跳过这个物品
          }
          itemName = variantName;
        }

        // 记录当前批次已使用的名称
        currentBatchNames.add(itemName);
        let itemType = (itemData.type as ItemType) || ItemType.Material;
        let isEquippable = itemData.isEquippable;
        let equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;
        const itemDescription = itemData.description || '';

        // 只在AI返回的类型明显错误或缺失时才进行推断和修正
        // 优先信任AI返回的类型，只在必要时才修正
        let needsCorrection = false;

        // 检查是否需要修正：
        // 1. AI没有返回类型或类型无效
        // 2. 装备类物品缺少槽位信息
        // 3. 类型与名称明显不匹配（如名称是"剑"但类型是"草药"）
        if (!itemType || itemType === ItemType.Material) {
          // 如果类型缺失或默认是材料，尝试推断
          needsCorrection = true;
        } else if (isEquippable && !equipmentSlot) {
          // 如果是装备但没有槽位，尝试推断槽位
          needsCorrection = true;
        } else {
          // 检查明显的类型错误（只检查极端不匹配的情况）
          const nameLower = itemName.toLowerCase();
          const hasWeaponKeyword = /剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首/.test(nameLower);
          const hasHerbKeyword = /草|花|果|叶|根/.test(nameLower) && !/草甲|草衣|草帽|草鞋/.test(nameLower);
          const hasRecipeKeyword = /丹方|配方|炼制方法|炼药|炼丹.*方法|炼制.*方法/.test(nameLower);
          const hasPillKeyword = /丹|丸|散|液|膏/.test(nameLower) && !/丹方|配方/.test(nameLower); // 排除丹方关键词
          const hasArtifactKeyword = /鼎|钟|镜|塔|扇|珠|印|盘|笔|袋|旗|炉|图/.test(nameLower) && !/剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首/.test(nameLower);

          if (hasWeaponKeyword && itemType !== ItemType.Weapon) {
            needsCorrection = true;
          } else if (hasRecipeKeyword && itemType !== ItemType.Recipe) {
            // 如果名称包含丹方关键词，必须识别为Recipe类型
            needsCorrection = true;
          } else if (hasHerbKeyword && itemType !== ItemType.Herb) {
            // 如果名称包含草药关键词（如"碧玉草"），但类型是法宝或其他装备类型，需要修正
            if (itemType === ItemType.Artifact || itemType === ItemType.Weapon || itemType === ItemType.Armor || itemType === ItemType.Ring || itemType === ItemType.Accessory) {
              needsCorrection = true;
            }
          } else if (hasPillKeyword && itemType !== ItemType.Pill && itemType !== ItemType.Recipe) {
            needsCorrection = true;
          } else if (hasArtifactKeyword && itemType !== ItemType.Artifact) {
            // 如果名称包含法宝关键词，但类型不是法宝，需要修正
            needsCorrection = true;
          } else if (itemType === ItemType.Artifact && !hasArtifactKeyword && hasHerbKeyword) {
            // 如果类型是法宝，但名称明显是草药（如"碧玉草"），需要修正
            needsCorrection = true;
          }
        }

        if (needsCorrection) {
          const inferred = inferItemTypeAndSlot(
            itemName,
            itemType,
            itemDescription,
            isEquippable
          );
          // 只在类型确实改变时才更新
          if (inferred.type !== itemType) {
            itemType = inferred.type;
            isEquippable = inferred.isEquippable;
            equipmentSlot = inferred.equipmentSlot || equipmentSlot;
          } else if (isEquippable && !equipmentSlot && inferred.equipmentSlot) {
            // 如果只是缺少槽位信息，补充槽位
            equipmentSlot = inferred.equipmentSlot;
          }
        } else if (isEquippable && !equipmentSlot) {
          // 如果只是缺少槽位，尝试推断槽位（不改变类型）
          const inferred = inferItemTypeAndSlot(
            itemName,
            itemType,
            itemDescription,
            isEquippable
          );
          if (inferred.equipmentSlot) {
            equipmentSlot = inferred.equipmentSlot;
          }
        }

        // 如果类型是明确的装备类型，但isEquippable未设置或为false，确保正确设置
        if (
          (itemType === ItemType.Artifact ||
            itemType === ItemType.Weapon ||
            itemType === ItemType.Armor ||
            itemType === ItemType.Ring ||
            itemType === ItemType.Accessory) &&
          !isEquippable
        ) {
          const inferred = inferItemTypeAndSlot(
            itemName,
            itemType,
            itemDescription,
            false
          );
          // 如果推断结果确认是装备类型，更新isEquippable和equipmentSlot
          if (
            inferred.type === itemType &&
            inferred.isEquippable &&
            inferred.equipmentSlot
          ) {
            isEquippable = true;
            equipmentSlot = inferred.equipmentSlot;
          }
        }

        // 规范化物品效果（确保已知物品的效果与描述一致）
        // 对于丹药，根据稀有度调整效果，确保仙品丹药效果明显强于稀有
        const normalized = normalizeItemEffect(
          itemName,
          itemData.effect,
          itemData.permanentEffect,
          itemType,
          itemData.rarity as ItemRarity
        );
        let finalEffect = normalized.effect;
        let finalPermanentEffect = normalized.permanentEffect;

        // 装备类物品应该使用 effect 而不是 permanentEffect
        // 如果装备只有 permanentEffect 而没有 effect，将其转换为 effect
        if (isEquippable && !finalEffect && finalPermanentEffect) {
          // 将 permanentEffect 转换为 effect（除了 maxHp，因为装备不提供 maxHp）
          finalEffect = {
            attack: finalPermanentEffect.attack,
            defense: finalPermanentEffect.defense,
            spirit: finalPermanentEffect.spirit,
            physique: finalPermanentEffect.physique,
            speed: finalPermanentEffect.speed,
            hp: 0, // maxHp 转换为 hp（装备时增加当前气血上限）
          };
          // 如果有 maxHp，也加到 hp 中
          if (finalPermanentEffect.maxHp) {
            finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
          }
          // 清空 permanentEffect（装备不应该有 permanentEffect）
          finalPermanentEffect = undefined;
          console.log(
            `[装备效果修正] "${itemName}": 将 permanentEffect 转换为 effect`
          );
        }

        // 确保所有装备类型都有属性加成（如果没有属性，根据品阶自动生成）
        if (isEquippable) {
          const rarity = (itemData.rarity as ItemRarity) || '普通';
          finalEffect = ensureEquipmentAttributes(
            itemType,
            finalEffect,
            rarity,
            player.realm,
            player.realmLevel
          ) as typeof finalEffect;

          // 应用境界调整，确保装备数值与玩家境界匹配
          if (finalEffect) {
            finalEffect = adjustEquipmentStatsByRealm(
              finalEffect,
              player.realm,
              player.realmLevel,
              rarity
            ) as typeof finalEffect;
          }
        }

        const isEquipment = isEquippable && equipmentSlot;
        const existingIdx = newInv.findIndex((i) => i.name === itemName);

        // 装备类物品不能有同名，如果已存在同名装备，跳过或重命名
        // 需要同时检查背包和本次批次内是否已有同名装备
        if (isEquipment && (existingIdx >= 0 || currentBatchNames.has(itemName))) {
          // 如果已存在同名装备，生成一个变体名称
          const baseName = itemName;
          const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
          let variantName = baseName;
          let attempts = 0;
          // 尝试找到未使用的变体名称（需要同时检查背包和本次批次）
          while (attempts < suffixes.length) {
            variantName = baseName + suffixes[attempts];
            if (newInv.findIndex((i) => i.name === variantName) < 0 && !currentBatchNames.has(variantName)) {
              // 找到了未使用的变体名称
              break;
            }
            attempts++;
          }
          // 如果所有变体都被占用，跳过这个装备
          if (attempts >= suffixes.length) {
            addLog(`⚠️ 已存在同名装备【${itemName}】，跳过重复装备。`, 'normal');
            return; // 跳过这个物品
          }
          itemName = variantName;
          // 更新当前批次名称记录，确保后续物品不会与重命名后的名称冲突
          currentBatchNames.add(itemName);
        }

        // 处理丹方：需要添加 recipeData
        let recipeData = undefined;
        if (itemType === ItemType.Recipe) {
          // 从 itemData 中获取 recipeName（如果存在）
          let recipeName = (itemData as any).recipeName;
          if (!recipeName) {
            // 如果 recipeName 不存在，尝试从物品名称中推断
            // 例如："天元丹丹方" -> "天元丹"
            const nameWithoutSuffix = itemName.replace(/丹方$/, '');
            // 在 DISCOVERABLE_RECIPES 中查找匹配的配方
            const matchedRecipe = DISCOVERABLE_RECIPES.find(
              (recipe) => recipe.name === nameWithoutSuffix
            );
            if (matchedRecipe) {
              recipeName = matchedRecipe.name;
            }
          }
          if (recipeName) {
            // 从 DISCOVERABLE_RECIPES 中查找对应的配方
            const recipe = DISCOVERABLE_RECIPES.find(
              (r) => r.name === recipeName
            );
            if (recipe) {
              recipeData = recipe;
            }
          }
        }

        // 确保 itemName 仍然有效（防止在处理过程中被清空）
        if (!itemName || itemName.trim() === '') {
          console.warn('[物品处理] 物品名称在处理过程中丢失，跳过该物品');
          addLog(`⚠️ 物品【${itemData.name}】处理失败，已跳过。`, 'normal');
          return; // 跳过无效物品
        }

        // 重新检查（因为可能重命名了）
        const finalExistingIdx = newInv.findIndex((i) => i.name === itemName);

        if (finalExistingIdx >= 0 && !isEquipment && itemType !== ItemType.Recipe) {
          // 非装备类物品可以叠加，但丹方不能叠加
          newInv[finalExistingIdx] = {
            ...newInv[finalExistingIdx],
            quantity: newInv[finalExistingIdx].quantity + 1,
          };
        } else {
          // 检查是否为传说或仙品装备，随机添加保命机会
          const rarity = (itemData.rarity as ItemRarity) || '普通';
          let reviveChances: number | undefined = undefined;

          // 只有武器和法宝类型的传说/仙品装备可能有保命机会
          if (
            (rarity === '传说' || rarity === '仙品') &&
            (itemType === ItemType.Weapon || itemType === ItemType.Artifact)
          ) {
            // 传说装备30%概率有保命，仙品装备60%概率有保命
            const hasRevive =
              rarity === '传说' ? Math.random() < 0.3 : Math.random() < 0.6;

            if (hasRevive) {
              // 随机1-3次保命机会
              reviveChances = Math.floor(Math.random() * 3) + 1;
            }
          }

          const newItem: Item = {
            id: uid(),
            name: itemName,
            type: itemType,
            description: itemData.description,
            quantity: 1,
            rarity: rarity,
            level: 0,
            isEquippable: isEquippable,
            equipmentSlot: equipmentSlot,
            effect: finalEffect,
            permanentEffect: finalPermanentEffect,
            recipeData: recipeData,
            reviveChances: reviveChances,
          };
          newInv.push(newItem);
        }
        } catch (error) {
          console.error('[物品处理] 处理物品时出错:', error, itemData);
          addLog(`⚠️ 处理物品【${itemData?.name || '未知'}】时出错，已跳过。`, 'normal');
        }
      });
    }

    // 处理获得的单个物品（兼容旧代码）
    if (result.itemObtained) {
      try {
        // 验证物品数据完整性
        if (!result.itemObtained.name || typeof result.itemObtained.name !== 'string' || result.itemObtained.name.trim() === '') {
          console.warn('[物品处理] 跳过无效物品数据:', result.itemObtained);
          addLog(`⚠️ 获得了一个无效物品，已跳过。`, 'normal');
        } else {
          let itemName = result.itemObtained.name.trim();
          let itemType =
            (result.itemObtained.type as ItemType) || ItemType.Material;
          let isEquippable = result.itemObtained.isEquippable;
          let equipmentSlot = result.itemObtained.equipmentSlot as
            | EquipmentSlot
            | undefined;
          const itemDescription = result.itemObtained.description || '';

          // 处理神秘法宝：随机命名并设置为法宝类型
          if (itemName?.includes('神秘') || itemName?.includes('法宝')) {
        const artifactNames = [
          '青莲剑',
          '紫霄钟',
          '玄天镜',
          '九幽塔',
          '太虚鼎',
          '阴阳扇',
          '星辰珠',
          '混沌印',
          '天机盘',
          '轮回笔',
          '乾坤袋',
          '五行旗',
          '八卦炉',
          '太极图',
          '无极剑',
          '造化钟',
          '开天斧',
          '辟地锤',
          '混元珠',
          '先天图',
          '后天镜',
          '三生石',
          '六道轮',
          '九重天',
            ];
            itemName =
              artifactNames[Math.floor(Math.random() * artifactNames.length)];
            itemType = ItemType.Artifact;
            isEquippable = true;
            // 随机分配一个法宝槽位
            const artifactSlots = [
              EquipmentSlot.Artifact1,
              EquipmentSlot.Artifact2,
            ];
            equipmentSlot =
              artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
          } else {
            // 只在AI返回的类型明显错误或缺失时才进行推断和修正
            // 优先信任AI返回的类型，只在必要时才修正
            let needsCorrection = false;

            // 检查是否需要修正：
            // 1. AI没有返回类型或类型无效
            // 2. 装备类物品缺少槽位信息
            // 3. 类型与名称明显不匹配（如名称是"剑"但类型是"草药"）
            if (!itemType || itemType === ItemType.Material) {
              // 如果类型缺失或默认是材料，尝试推断
              needsCorrection = true;
            } else if (isEquippable && !equipmentSlot) {
              // 如果是装备但没有槽位，尝试推断槽位
              needsCorrection = true;
            } else {
              // 检查明显的类型错误（只检查极端不匹配的情况）
              const nameLower = itemName.toLowerCase();
              const hasWeaponKeyword = /剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首/.test(nameLower);
              const hasHerbKeyword = /草|花|果|叶|根/.test(nameLower) && !/草甲|草衣|草帽|草鞋/.test(nameLower);
              const hasPillKeyword = /丹|丸|散|液|膏/.test(nameLower);
              const hasArtifactKeyword = /鼎|钟|镜|塔|扇|珠|印|盘|笔|袋|旗|炉|图/.test(nameLower) && !/剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首/.test(nameLower);

              if (hasWeaponKeyword && itemType !== ItemType.Weapon) {
                needsCorrection = true;
              } else if (hasHerbKeyword && itemType !== ItemType.Herb) {
                // 如果名称包含草药关键词（如"碧玉草"），但类型是法宝或其他装备类型，需要修正
                if (itemType === ItemType.Artifact || itemType === ItemType.Weapon || itemType === ItemType.Armor || itemType === ItemType.Ring || itemType === ItemType.Accessory) {
                  needsCorrection = true;
                }
              } else if (hasPillKeyword && itemType !== ItemType.Pill) {
                needsCorrection = true;
              } else if (hasArtifactKeyword && itemType !== ItemType.Artifact) {
                // 如果名称包含法宝关键词，但类型不是法宝，需要修正
                needsCorrection = true;
              } else if (itemType === ItemType.Artifact && !hasArtifactKeyword && hasHerbKeyword) {
                // 如果类型是法宝，但名称明显是草药（如"碧玉草"），需要修正
                needsCorrection = true;
              }
            }

            if (needsCorrection) {
              const inferred = inferItemTypeAndSlot(
                itemName,
                itemType,
                itemDescription,
                isEquippable
              );
              // 只在类型确实改变时才更新
              if (inferred.type !== itemType) {
                itemType = inferred.type;
                isEquippable = inferred.isEquippable;
                equipmentSlot = inferred.equipmentSlot || equipmentSlot;
              } else if (isEquippable && !equipmentSlot && inferred.equipmentSlot) {
                // 如果只是缺少槽位信息，补充槽位
                equipmentSlot = inferred.equipmentSlot;
              }
            } else if (isEquippable && !equipmentSlot) {
              // 如果只是缺少槽位，尝试推断槽位（不改变类型）
              const inferred = inferItemTypeAndSlot(
                itemName,
                itemType,
                itemDescription,
                isEquippable
              );
              if (inferred.equipmentSlot) {
                equipmentSlot = inferred.equipmentSlot;
              }
            }

            // 如果类型是明确的装备类型，但isEquippable未设置或为false，确保正确设置
            if (
              (itemType === ItemType.Artifact ||
                itemType === ItemType.Weapon ||
                itemType === ItemType.Armor ||
                itemType === ItemType.Ring ||
                itemType === ItemType.Accessory) &&
              !isEquippable
            ) {
              const inferred = inferItemTypeAndSlot(
                itemName,
                itemType,
                itemDescription,
                false
              );
              // 如果推断结果确认是装备类型，更新isEquippable和equipmentSlot
              if (
                inferred.type === itemType &&
                inferred.isEquippable &&
                inferred.equipmentSlot
              ) {
                isEquippable = true;
                equipmentSlot = inferred.equipmentSlot;
              }
            }
          }

          // 规范化物品效果（确保已知物品的效果与描述一致）
          // 对于丹药，根据稀有度调整效果，确保仙品丹药效果明显强于稀有
          const normalized = normalizeItemEffect(
            itemName,
            result.itemObtained.effect,
            result.itemObtained.permanentEffect,
            itemType,
            result.itemObtained.rarity as ItemRarity
          );
          let finalEffect = normalized.effect;
          let finalPermanentEffect = normalized.permanentEffect;

          // 装备类物品应该使用 effect 而不是 permanentEffect
          // 如果装备只有 permanentEffect 而没有 effect，将其转换为 effect
          if (isEquippable && !finalEffect && finalPermanentEffect) {
            // 将 permanentEffect 转换为 effect（除了 maxHp，因为装备不提供 maxHp）
            finalEffect = {
              attack: finalPermanentEffect.attack,
              defense: finalPermanentEffect.defense,
              spirit: finalPermanentEffect.spirit,
              physique: finalPermanentEffect.physique,
              speed: finalPermanentEffect.speed,
              hp: 0, // maxHp 转换为 hp（装备时增加当前气血上限）
            };
            // 如果有 maxHp，也加到 hp 中
            if (finalPermanentEffect.maxHp) {
              finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
            }
            // 清空 permanentEffect（装备不应该有 permanentEffect）
            finalPermanentEffect = undefined;
            console.log(
              `[装备效果修正] "${itemName}": 将 permanentEffect 转换为 effect`
            );
          }

          // 确保所有装备类型都有属性加成（如果没有属性，根据品阶自动生成）
          if (isEquippable) {
            const rarity = (result.itemObtained.rarity as ItemRarity) || '普通';
            finalEffect = ensureEquipmentAttributes(
              itemType,
              finalEffect,
              rarity,
              player.realm,
              player.realmLevel
            ) as typeof finalEffect;

            // 应用境界调整，确保装备数值与玩家境界匹配
            if (finalEffect) {
              finalEffect = adjustEquipmentStatsByRealm(
                finalEffect,
                player.realm,
                player.realmLevel,
                rarity
              ) as typeof finalEffect;
            }
          }

          // 处理丹方：需要添加 recipeData
          let recipeData = undefined;
          if (itemType === ItemType.Recipe) {
            // 从 result.itemObtained 中获取 recipeName（如果存在）
            let recipeName = (result.itemObtained as any).recipeName;
            if (!recipeName) {
              // 如果 recipeName 不存在，尝试从物品名称中推断
              // 例如："天元丹丹方" -> "天元丹"
              const nameWithoutSuffix = itemName.replace(/丹方$/, '');
              // 在 DISCOVERABLE_RECIPES 中查找匹配的配方
              const matchedRecipe = DISCOVERABLE_RECIPES.find(
                (recipe) => recipe.name === nameWithoutSuffix
              );
              if (matchedRecipe) {
                recipeName = matchedRecipe.name;
              }
            }
            if (recipeName) {
              // 从 DISCOVERABLE_RECIPES 中查找对应的配方
              const recipe = DISCOVERABLE_RECIPES.find(
                (r) => r.name === recipeName
              );
              if (recipe) {
                recipeData = recipe;
              }
            }
          }

          // 装备类物品不能有同名，如果已存在同名装备，跳过或重命名
          const isEquipment = isEquippable && equipmentSlot;

          if (isEquipment) {
            const existingIdx = newInv.findIndex((i) => i.name === itemName);
            if (existingIdx >= 0) {
              // 如果已存在同名装备，生成一个变体名称
              const baseName = itemName;
              const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
              let variantName = baseName;
              let attempts = 0;
              // 尝试找到未使用的变体名称
              while (attempts < suffixes.length) {
                variantName = baseName + suffixes[attempts];
                if (newInv.findIndex((i) => i.name === variantName) < 0) {
                  // 找到了未使用的变体名称
                  break;
                }
                attempts++;
              }
              // 如果所有变体都被占用，跳过这个装备
              if (attempts >= suffixes.length) {
                addLog(`⚠️ 已存在同名装备【${itemName}】，跳过重复装备。`, 'normal');
                return; // 跳过这个物品
              }
              itemName = variantName;
            }
          }

          const existingIdx = newInv.findIndex((i) => i.name === itemName);

          if (existingIdx >= 0 && !isEquipment && itemType !== ItemType.Recipe) {
            // 非装备类物品可以叠加，但丹方不能叠加
            newInv[existingIdx] = {
              ...newInv[existingIdx],
              quantity: newInv[existingIdx].quantity + 1,
            };
          } else {
            // 装备类物品或新物品，创建新物品（每个装备单独占一格）
            // 检查是否为传说或仙品装备，随机添加保命机会
            const rarity = (result.itemObtained.rarity as ItemRarity) || '普通';
            let reviveChances: number | undefined = undefined;

            // 检查是否从itemObtained中已经有保命机会（从battleService生成）
            if ((result.itemObtained as any).reviveChances !== undefined) {
              reviveChances = (result.itemObtained as any).reviveChances;
            } else if (
              (rarity === '传说' || rarity === '仙品') &&
              (itemType === ItemType.Weapon || itemType === ItemType.Artifact)
            ) {
              // 只有武器和法宝类型的传说/仙品装备可能有保命机会
              // 传说装备30%概率有保命，仙品装备60%概率有保命
              const hasRevive =
                rarity === '传说' ? Math.random() < 0.3 : Math.random() < 0.6;

              if (hasRevive) {
                // 随机1-3次保命机会
                reviveChances = Math.floor(Math.random() * 3) + 1;
              }
            }

            const newItem: Item = {
              id: uid(),
              name: itemName,
              type: itemType,
              description: result.itemObtained.description,
              quantity: 1, // 装备quantity始终为1
              rarity: rarity,
              level: 0,
              isEquippable: isEquippable,
              equipmentSlot: equipmentSlot,
              effect: finalEffect,
              permanentEffect: finalPermanentEffect,
              recipeData: recipeData,
              reviveChances: reviveChances,
            };
            newInv.push(newItem);
          }
        }
      } catch (error) {
        console.error('[物品处理] 处理单个物品时出错:', error, result.itemObtained);
        addLog(`⚠️ 处理物品【${result.itemObtained?.name || '未知'}】时出错，已跳过。`, 'normal');
      }
    }

    // 处理抽奖券奖励 - 本地概率判定（5%概率，1-10张）
    // 不再使用AI返回的lotteryTicketsChange，改为本地概率判定
    // 每次历练有5%的概率获得抽奖券（1%-10%的中值，可调整）
    const lotteryTicketChancePercent = 5; // 可以调整为1-10之间的任何值
    if (Math.random() * 100 < lotteryTicketChancePercent) {
      // 随机获得1-10张抽奖券
      const ticketAmount = Math.floor(Math.random() * 10) + 1;
      newLotteryTickets += ticketAmount;
      addLog(`🎫 运气不错，捡到了 ${ticketAmount} 张抽奖券！`, 'gain');
    }

    // 处理传承奖励（本地概率判定，明确掉落概率）
    // 普通历练0.1%，秘境0.5%，大机缘1%
    const inheritanceChance = adventureType === 'lucky' ? 0.01 : realmName ? 0.005 : 0.001;
    if (Math.random() < inheritanceChance) {
      // 随机1-4个境界的传承
      const validChange = Math.floor(Math.random() * 4) + 1;
      const newTotal = Math.min(4, newInheritanceLevel + validChange);
      const actualChange = newTotal - newInheritanceLevel;
      if (actualChange > 0) {
        newInheritanceLevel = newTotal;
        addLog(
          `🌟 你获得了上古传承！可以直接突破 ${actualChange} 个境界！`,
          'special'
        );
      }
    } else if (result.inheritanceLevelChange && result.inheritanceLevelChange > 0) {
      // 如果AI也返回了传承（极罕见情况），也处理
      const validChange = Math.max(
        1,
        Math.min(4, result.inheritanceLevelChange)
      );
      const newTotal = Math.min(4, newInheritanceLevel + validChange);
      const actualChange = newTotal - newInheritanceLevel;
      if (actualChange > 0) {
        newInheritanceLevel = newTotal;
        addLog(
          `🌟 你获得了上古传承！可以直接突破 ${actualChange} 个境界！`,
          'special'
        );
      }
    }

    // 处理获得的灵宠
    if (result.petObtained) {
      const petTemplate = PET_TEMPLATES.find(
        (t) => t.id === result.petObtained
      );
      if (petTemplate) {
        // 检查是否已经拥有该灵宠（根据种类判断，避免重复）
        const hasSameSpecies = newPets.some(
          (p) => p.species === petTemplate.species
        );
        if (!hasSameSpecies) {
          const newPet: Pet = {
            id: uid(),
            name: getRandomPetName(petTemplate),
            species: petTemplate.species,
            level: 1,
            exp: 0,
            maxExp: 60, // 降低初始经验值，从100降到60
            rarity: petTemplate.rarity,
            stats: { ...petTemplate.baseStats },
            skills: [...petTemplate.skills],
            evolutionStage: 0,
            affection: 50,
          };
          newPets.push(newPet);
          newStats.petCount += 1;
          addLog(`✨ 你拯救了灵兽，获得了灵宠【${newPet.name}】！`, 'special');
        } else {
          addLog(
            `你遇到了灵兽，但它似乎已经有了同类伙伴，便离开了。`,
            'normal'
          );
        }
      }
    }

    // 处理灵宠机缘
    if (result.petOpportunity && newPets.length > 0) {
      let targetPet: Pet | null = null;

      // 确定目标灵宠：优先使用当前激活的灵宠
      if (result.petOpportunity.petId) {
        targetPet =
          newPets.find((p) => p.id === result.petOpportunity.petId) || null;
      }
      // 如果没有指定或找不到，优先使用当前激活的灵宠
      if (!targetPet && prev.activePetId) {
        targetPet = newPets.find((p) => p.id === prev.activePetId) || null;
      }
      // 如果还是没有，随机选择一个（添加防御性检查）
      if (!targetPet && newPets.length > 0) {
        const randomPet = newPets[Math.floor(Math.random() * newPets.length)];
        targetPet = randomPet;
      }

      if (targetPet) {
        const petIndex = newPets.findIndex((p) => p.id === targetPet!.id);
        const updatedPet = { ...targetPet };

        switch (result.petOpportunity.type) {
          case 'evolution':
            if (updatedPet.evolutionStage < 2) {
              updatedPet.evolutionStage += 1;
              updatedPet.stats = {
                attack: Math.floor(updatedPet.stats.attack * 3.0),
                defense: Math.floor(updatedPet.stats.defense * 3.0),
                hp: Math.floor(updatedPet.stats.hp * 3.0),
                speed: Math.floor(updatedPet.stats.speed * 1.5),
              };
              newPets[petIndex] = updatedPet;
              addLog(
                `✨ 【${targetPet.name}】在历练中获得机缘，成功进化了！实力大幅提升！`,
                'special'
              );
            }
            break;

          case 'level':
            if (
              result.petOpportunity.levelGain &&
              result.petOpportunity.levelGain > 0
            ) {
              const levelGain = Math.min(result.petOpportunity.levelGain, 5); // 最多提升5级
              updatedPet.level += levelGain;
              // 每次升级提升属性
              for (let i = 0; i < levelGain; i++) {
                updatedPet.stats = {
                  attack: Math.floor(updatedPet.stats.attack * 1.1),
                  defense: Math.floor(updatedPet.stats.defense * 1.1),
                  hp: Math.floor(updatedPet.stats.hp * 1.1),
                  speed: Math.floor(updatedPet.stats.speed * 1.05),
                };
              }
              newPets[petIndex] = updatedPet;
              addLog(
                `✨ 【${targetPet.name}】在历练中获得机缘，直接提升了 ${levelGain} 级！`,
                'special'
              );
            }
            break;

          case 'stats':
            if (result.petOpportunity.statsBoost) {
              const boost = result.petOpportunity.statsBoost;
              updatedPet.stats = {
                attack: updatedPet.stats.attack + (boost.attack || 0),
                defense: updatedPet.stats.defense + (boost.defense || 0),
                hp: updatedPet.stats.hp + (boost.hp || 0),
                speed: updatedPet.stats.speed + (boost.speed || 0),
              };
              newPets[petIndex] = updatedPet;
              const statsText = [
                boost.attack ? `攻击+${boost.attack}` : '',
                boost.defense ? `防御+${boost.defense}` : '',
                boost.hp ? `气血+${boost.hp}` : '',
                boost.speed ? `速度+${boost.speed}` : '',
              ]
                .filter(Boolean)
                .join('、');
              addLog(
                `✨ 【${targetPet.name}】在历练中获得机缘，属性提升了：${statsText}！`,
                'special'
              );
            }
            break;

          case 'exp':
            if (
              result.petOpportunity.expGain &&
              result.petOpportunity.expGain > 0
            ) {
              let petNewExp = updatedPet.exp + result.petOpportunity.expGain;
              let petNewLevel = updatedPet.level;
              let petNewMaxExp = updatedPet.maxExp;
              let leveledUp = false;
              let levelGainCount = 0;

              // 处理升级（可能连升多级）
              while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
                petNewExp -= petNewMaxExp;
                petNewLevel += 1;
                levelGainCount += 1;
                petNewMaxExp = Math.floor(petNewMaxExp * 1.5);
                leveledUp = true;
              }

              // 每次升级提升属性
              if (leveledUp) {
                for (let i = 0; i < levelGainCount; i++) {
                  updatedPet.stats = {
                    attack: Math.floor(updatedPet.stats.attack * 1.1),
                    defense: Math.floor(updatedPet.stats.defense * 1.1),
                    hp: Math.floor(updatedPet.stats.hp * 1.1),
                    speed: Math.floor(updatedPet.stats.speed * 1.05),
                  };
                }
              }

              updatedPet.exp = petNewExp;
              updatedPet.level = petNewLevel;
              updatedPet.maxExp = petNewMaxExp;

              newPets[petIndex] = updatedPet;
              if (leveledUp) {
                addLog(
                  `✨ 【${targetPet.name}】在历练中获得了 ${result.petOpportunity.expGain} 点经验，并提升了 ${levelGainCount} 级！`,
                  'special'
                );
              } else {
                addLog(
                  `✨ 【${targetPet.name}】在历练中获得了 ${result.petOpportunity.expGain} 点经验！`,
                  'special'
                );
              }
            }
            break;
        }
      }
    }

    // 获得功法概率（普通历练5%，秘境中10%，大机缘中15%）
    // 每次历练最多解锁一个功法（逻辑保证：只选择一个随机功法并添加一次）
    // 注意：功法解锁由本地概率控制，AI不应在story中提及功法相关内容
    const artChance = adventureType === 'lucky' ? 0.15 : realmName ? 0.10 : 0.05;
    let artUnlocked = false; // 标记是否真的解锁了功法
    if (Math.random() < artChance) {
      const availableArts = CULTIVATION_ARTS.filter((art) => {
        // 已经拥有的排除
        if (newArts.includes(art.id)) return false;
        // 境界要求
        const artRealmIndex = REALM_ORDER.indexOf(art.realmRequirement);
        const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
        // 如果索引无效（-1），保守处理：不满足条件
        if (artRealmIndex < 0 || playerRealmIndex < 0 || artRealmIndex > playerRealmIndex) {
          return false;
        }
        // 宗门专属功法：需要同宗门
        if (art.sectId !== null && art.sectId !== undefined) {
          return art.sectId === prev.sectId;
        }
        return true;
      });
      if (availableArts.length > 0) {
        const randomArt =
          availableArts[Math.floor(Math.random() * availableArts.length)];
        // 双重检查确保功法没有被重复添加（防御性编程）
        if (!newArts.includes(randomArt.id)) {
          // 先解锁功法（添加到unlockedArts）- 确保解锁逻辑优先执行
          if (!newUnlockedArts.includes(randomArt.id)) {
            newUnlockedArts.push(randomArt.id);
            console.log(`[功法解锁] 历练中解锁功法: ${randomArt.name} (${randomArt.id})`);
          }
          // 然后直接学习（添加到cultivationArts）
          newArts.push(randomArt.id);
          newStats.artCount += 1;
          newAttack += randomArt.effects.attack || 0;
          newDefense += randomArt.effects.defense || 0;
          newMaxHp += randomArt.effects.hp || 0;
          newHp += randomArt.effects.hp || 0;
          // 确保总是显示提示（使用 triggerVisual 增强视觉效果）
          artUnlocked = true; // 标记已解锁功法
          triggerVisual('special', `🎉 领悟功法【${randomArt.name}】`, 'special');
          addLog(
            `🎉 你在历练中领悟了功法【${randomArt.name}】！可在功法阁查看。`,
            'special'
          );
        } else {
          // 如果功法已经在 cultivationArts 中，但不在 unlockedArts 中，也要添加到 unlockedArts
          // 这可以修复通过调试模式或其他方式获得的功法未解锁的问题
          if (!newUnlockedArts.includes(randomArt.id)) {
            newUnlockedArts.push(randomArt.id);
            console.log(`[功法解锁] 修复未解锁的功法: ${randomArt.name} (${randomArt.id})`);
          }
        }
      }
    }

    // 如果AI在story中提到了功法但实际没有解锁，需要过滤掉相关描述
    // 检查story中是否包含功法相关关键词，但实际没有解锁
    if (!artUnlocked && result.story) {
      const artKeywords = /功法|心法|体术|领悟|获得.*功法|习得.*功法|学会.*功法/i;
      if (artKeywords.test(result.story)) {
        // 如果story中提到了功法但实际没有解锁，移除相关描述
        // 使用简单的替换，移除包含功法关键词的句子
        result.story = result.story
          .split(/[。！？\n]/)
          .filter(sentence => !artKeywords.test(sentence))
          .join('。')
          .replace(/。+/g, '。') // 移除多余的句号
          .trim();
        // 如果过滤后story为空，使用默认描述
        if (!result.story || result.story.length < 10) {
          result.story = '你在历练中有所收获，但大道渺茫，还需继续努力。';
        }
      }
    }

    // 概率掉落灵宠进阶材料（本地概率判定）
    const petMaterialChance = adventureType === 'secret_realm' ? 0.08 : 0.05;
    if (Math.random() < petMaterialChance) {
      const material =
        PET_EVOLUTION_MATERIALS[
          Math.floor(Math.random() * PET_EVOLUTION_MATERIALS.length)
        ];
      const existingIdx = newInv.findIndex((i) => i.name === material.name);
      if (existingIdx >= 0) {
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          quantity: newInv[existingIdx].quantity + 1,
        };
      } else {
        newInv.push({
          id: uid(),
          name: material.name,
          type: ItemType.Material,
          description: material.description,
          quantity: 1,
          rarity: material.rarity as ItemRarity,
          level: 0,
        });
      }
      addLog(`🎁 你获得了灵宠进阶材料【${material.name}】！`, 'gain');
    }

    // 获得天赋概率（普通历练2%，秘境中3%，大机缘中5%）
    const talentChance =
      adventureType === 'lucky' ? 0.05 : realmName ? 0.03 : 0.02;
    if (Math.random() < talentChance && !newTalentId) {
      const availableTalents = TALENTS.filter(
        (t) => t.id !== 'talent-ordinary' && t.rarity !== '仙品' // 仙品天赋只能通过特殊方式获得
      );
      if (availableTalents.length > 0) {
        const randomTalent =
          availableTalents[Math.floor(Math.random() * availableTalents.length)];
        newTalentId = randomTalent.id;
        newAttack += randomTalent.effects.attack || 0;
        newDefense += randomTalent.effects.defense || 0;
        newMaxHp += randomTalent.effects.hp || 0;
        newHp += randomTalent.effects.hp || 0;
        newLuck += randomTalent.effects.luck || 0;
        addLog(`🌟 你在历练中觉醒了天赋【${randomTalent.name}】！`, 'special');
      }
    }

    // 处理属性降低（遭遇陷阱、邪修等危险事件）
    let newSpirit = prev.spirit;
    let newPhysique = prev.physique;
    let newSpeed = prev.speed;
    if (result.attributeReduction) {
      const reduction = result.attributeReduction;

      // 保护机制：限制单个属性最多降低10%，总属性降低不超过15%
      const maxSingleReductionRatio = 0.1; // 单个属性最多降低10%
      const maxTotalReductionRatio = 0.15; // 总属性最多降低15%

      // 计算总降低值
      let totalReduction = 0;
      if (reduction.attack) totalReduction += reduction.attack;
      if (reduction.defense) totalReduction += reduction.defense;
      if (reduction.spirit) totalReduction += reduction.spirit;
      if (reduction.physique) totalReduction += reduction.physique;
      if (reduction.speed) totalReduction += reduction.speed;
      if (reduction.maxHp) totalReduction += reduction.maxHp;

      // 计算玩家总属性值
      const totalAttributes =
        prev.attack +
        prev.defense +
        prev.spirit +
        prev.physique +
        prev.speed +
        prev.maxHp;
      const maxAllowedReduction = totalAttributes * maxTotalReductionRatio;

      // 如果总降低超过限制，按比例缩减
      let scaleFactor = 1;
      if (totalReduction > maxAllowedReduction) {
        scaleFactor = maxAllowedReduction / totalReduction;
      }

      if (reduction.attack) {
        const maxSingleReduction = Math.floor(
          prev.attack * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.attack * scaleFactor),
          maxSingleReduction
        );
        newAttack = Math.max(0, newAttack - actualReduction);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的攻击力降低了 ${actualReduction} 点！`, 'danger');
        }
      }
      if (reduction.defense) {
        const maxSingleReduction = Math.floor(
          prev.defense * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.defense * scaleFactor),
          maxSingleReduction
        );
        newDefense = Math.max(0, newDefense - actualReduction);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的防御力降低了 ${actualReduction} 点！`, 'danger');
        }
      }
      if (reduction.spirit) {
        const maxSingleReduction = Math.floor(
          prev.spirit * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.spirit * scaleFactor),
          maxSingleReduction
        );
        newSpirit = Math.max(0, newSpirit - actualReduction);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的神识降低了 ${actualReduction} 点！`, 'danger');
        }
      }
      if (reduction.physique) {
        const maxSingleReduction = Math.floor(
          prev.physique * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.physique * scaleFactor),
          maxSingleReduction
        );
        newPhysique = Math.max(0, newPhysique - actualReduction);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的体魄降低了 ${actualReduction} 点！`, 'danger');
        }
      }
      if (reduction.speed) {
        const maxSingleReduction = Math.floor(
          prev.speed * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.speed * scaleFactor),
          maxSingleReduction
        );
        newSpeed = Math.max(0, newSpeed - actualReduction);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的速度降低了 ${actualReduction} 点！`, 'danger');
        }
      }
      if (reduction.maxHp) {
        const maxSingleReduction = Math.floor(
          prev.maxHp * maxSingleReductionRatio
        );
        const actualReduction = Math.min(
          Math.floor(reduction.maxHp * scaleFactor),
          maxSingleReduction
        );
        newMaxHp = Math.max(prev.maxHp * 0.5, newMaxHp - actualReduction); // 至少保留50%气血上限
        newHp = Math.min(newHp, newMaxHp);
        if (actualReduction > 0) {
          addLog(`⚠️ 你的气血上限降低了 ${actualReduction} 点！`, 'danger');
        }
      }
    }

    // 确保数值有效，防止NaN
    const safeHpChange = typeof result.hpChange === 'number' && !isNaN(result.hpChange) ? result.hpChange : 0;
    const safeExpChange = typeof result.expChange === 'number' && !isNaN(result.expChange) ? result.expChange : 0;
    const safeSpiritStonesChange = typeof result.spiritStonesChange === 'number' && !isNaN(result.spiritStonesChange) ? result.spiritStonesChange : 0;

    // 处理寿命变化
    const safeLifespanChange = typeof result.lifespanChange === 'number' && !isNaN(result.lifespanChange) ? result.lifespanChange : 0;

    // 基础寿命流逝：每次历练流逝少量寿命（根据风险等级调整，已提高流失速度）
    let baseLifespanLoss = 0;
    if (riskLevel === '低') {
      baseLifespanLoss = 0.3; // 从0.1提高到0.3
    } else if (riskLevel === '中') {
      baseLifespanLoss = 0.6; // 从0.2提高到0.6
    } else if (riskLevel === '高') {
      baseLifespanLoss = 1.0; // 从0.3提高到1.0
    } else if (riskLevel === '极度危险') {
      baseLifespanLoss = 1.5; // 从0.5提高到1.5
    } else {
      baseLifespanLoss = 0.4; // 默认，从0.15提高到0.4
    }

    // 特殊事件可能额外流失寿命（已在result.lifespanChange中处理）
    const totalLifespanChange = safeLifespanChange - baseLifespanLoss;
    const newLifespan = Math.max(0, (prev.lifespan || prev.maxLifespan || 100) + totalLifespanChange);

    // 处理灵根变化
    let newSpiritualRoots = { ...prev.spiritualRoots };
    if (result.spiritualRootsChange) {
      newSpiritualRoots = {
        metal: Math.min(100, Math.max(0, (newSpiritualRoots.metal || 0) + (result.spiritualRootsChange.metal || 0))),
        wood: Math.min(100, Math.max(0, (newSpiritualRoots.wood || 0) + (result.spiritualRootsChange.wood || 0))),
        water: Math.min(100, Math.max(0, (newSpiritualRoots.water || 0) + (result.spiritualRootsChange.water || 0))),
        fire: Math.min(100, Math.max(0, (newSpiritualRoots.fire || 0) + (result.spiritualRootsChange.fire || 0))),
        earth: Math.min(100, Math.max(0, (newSpiritualRoots.earth || 0) + (result.spiritualRootsChange.earth || 0))),
      };
    }

    // 允许hp变为0或负数，用于触发死亡检测
    const finalHp = newHp + safeHpChange;

    // 最终同步：确保 newArts 中的所有功法都在 newUnlockedArts 中
    // 这可以修复在快速连续历练中可能丢失的解锁
    newArts.forEach(artId => {
      if (!newUnlockedArts.includes(artId)) {
        newUnlockedArts.push(artId);
        console.log(`[功法解锁] 最终同步: 确保功法 ${artId} 在 unlockedArts 中`);
      }
    });

    // 确保 unlockedArts 被正确保存
    if (artUnlocked && newUnlockedArts.length > (prev.unlockedArts || []).length) {
      console.log(`[功法解锁] 更新 unlockedArts:`, {
        before: prev.unlockedArts || [],
        after: newUnlockedArts,
        newArts: newArts.filter(id => !(prev.cultivationArts || []).includes(id))
      });
    }

    return {
      ...prev,
      hp: Math.min(newMaxHp, finalHp), // 移除 Math.max(0, ...)，允许负数
      exp: Math.max(0, prev.exp + safeExpChange), // 修为不能为负
      spiritStones: Math.max(0, prev.spiritStones + safeSpiritStonesChange), // 灵石不能为负
      inventory: newInv,
      cultivationArts: newArts,
      unlockedArts: newUnlockedArts, // 确保 unlockedArts 被正确更新
      talentId: newTalentId || prev.talentId,
      attack: newAttack,
      defense: newDefense,
      maxHp: newMaxHp,
      spirit: newSpirit,
      physique: newPhysique,
      speed: newSpeed,
      luck: newLuck,
      lotteryTickets: newLotteryTickets,
      inheritanceLevel: newInheritanceLevel,
      pets: newPets,
      statistics: newStats,
      lifespan: newLifespan,
      spiritualRoots: newSpiritualRoots,
      reputation: newReputation,
    };
  });

  // 处理声望事件（需要玩家选择，通过回调处理）
  if (
    result.reputationEvent &&
    onReputationEvent &&
    result.reputationEvent.title &&
    result.reputationEvent.description &&
    result.reputationEvent.choices &&
    Array.isArray(result.reputationEvent.choices) &&
    result.reputationEvent.choices.length > 0
  ) {
    addLog(`📜 你遇到了一个需要做出选择的事件：${result.reputationEvent.title}`, 'special');
    onReputationEvent(result.reputationEvent);
  }

  addLog(result.story, result.eventColor);

  // 显示寿命变化
  if (result.lifespanChange !== undefined && result.lifespanChange !== 0) {
    if (result.lifespanChange > 0) {
      addLog(`✨ 你的寿命增加了 ${result.lifespanChange.toFixed(1)} 年！`, 'gain');
    } else {
      addLog(`⚠️ 你的寿命减少了 ${Math.abs(result.lifespanChange).toFixed(1)} 年！`, 'danger');
    }
  }

  // 显示灵根变化
  if (result.spiritualRootsChange) {
    const rootNames: Record<string, string> = {
      metal: '金',
      wood: '木',
      water: '水',
      fire: '火',
      earth: '土',
    };
    Object.entries(result.spiritualRootsChange).forEach(([key, value]) => {
      if (value && value !== 0) {
        const rootName = rootNames[key] || key;
        if (value > 0) {
          addLog(`✨ 你的${rootName}灵根提升了 ${value} 点！`, 'gain');
        } else {
          addLog(`⚠️ 你的${rootName}灵根降低了 ${Math.abs(value)} 点！`, 'danger');
        }
      }
    });
  }

  // 显示获得的物品（只显示有效物品）
  // 注意：实际物品已经在setPlayer中处理，这里只显示log
  // 如果物品处理失败，会在处理过程中显示错误log
  if (result.itemsObtained && Array.isArray(result.itemsObtained) && result.itemsObtained.length > 0) {
    result.itemsObtained.forEach((item) => {
      // 只显示有效的物品名称
      if (item && item.name && typeof item.name === 'string' && item.name.trim() !== '') {
        const normalizedRarity = normalizeRarityValue(item.rarity);
        const rarityText = normalizedRarity ? `【${normalizedRarity}】` : '';
        addLog(`获得物品: ${rarityText}${item.name}`, 'gain');
      }
    });
  } else if (result.itemObtained && result.itemObtained.name && typeof result.itemObtained.name === 'string' && result.itemObtained.name.trim() !== '') {
    addLog(`获得物品: ${result.itemObtained.name}`, 'gain');
  }

  // 如果有战斗数据，打开战斗弹窗（自动模式下也会打开）
  if (battleContext) {
    onOpenBattleModal(battleContext);
  }

  // 如果触发随机秘境，自动进入秘境并触发新的随机事件
  if (result.triggerSecretRealm) {
    setTimeout(async () => {
      addLog(`你进入了秘境深处...`, 'special');
      const secretRealmResult = await generateAdventureEvent(
        player,
        'secret_realm'
      );

      setPlayer((prev) => {
        if (!prev) return prev;
        // 计算境界倍数（用于平衡补偿）
        const realmIndex = REALM_ORDER.indexOf(prev.realm);
        const realmMultiplier =
          1 + realmIndex * 0.3 + (prev.realmLevel - 1) * 0.1;

        let newInv = [...prev.inventory];
        let newStones = prev.spiritStones;
        let newExp = prev.exp;
        let newHp = prev.hp;
        let newMaxHp = prev.maxHp;
        let newAttack = prev.attack;
        let newDefense = prev.defense;
        let newSpirit = prev.spirit;
        let newPhysique = prev.physique;
        let newSpeed = prev.speed;
        let newArts = [...prev.cultivationArts];
        // 确保所有已学习的功法都在 unlockedArts 中（修复旧存档问题）
        // 重要：基于 prev.unlockedArts 和 prev.cultivationArts 的并集，确保不会丢失已解锁的功法
        let newUnlockedArts = [...(prev.unlockedArts || [])];
        // 同步 cultivationArts 到 unlockedArts（修复通过其他方式获得的功法未解锁的问题）
        // 注意：这里同步的是 prev.cultivationArts，因为 newArts 可能还没有包含本次秘境获得的功法
        prev.cultivationArts.forEach(artId => {
          if (!newUnlockedArts.includes(artId)) {
            newUnlockedArts.push(artId);
            console.log(`[功法解锁] 修复同步: 将已学习的功法 ${artId} 添加到 unlockedArts`);
          }
        });
        let newPets = [...prev.pets];
        let newLotteryTickets = prev.lotteryTickets;
        let newInheritanceLevel = prev.inheritanceLevel;
        let newLifespan = prev.lifespan || prev.maxLifespan || 100;
        let newSpiritualRoots = { ...prev.spiritualRoots };
        const stats = prev.statistics || {
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
        let newStats = { ...stats };

        // 处理秘境中的多个物品（优先处理itemsObtained）
        if (secretRealmResult.itemsObtained && Array.isArray(secretRealmResult.itemsObtained) && secretRealmResult.itemsObtained.length > 0) {
          const currentBatchNames = new Set<string>();
          secretRealmResult.itemsObtained.forEach((itemData) => {
            let itemName = itemData.name;
            const isEquippableCheck = itemData.isEquippable;
            const equipmentSlotCheck = itemData.equipmentSlot;
            const isEquipmentCheck = isEquippableCheck && equipmentSlotCheck;

            if (isEquipmentCheck && currentBatchNames.has(itemName)) {
              const baseName = itemName;
              const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
              let variantName = baseName;
              let attempts = 0;
              while (currentBatchNames.has(variantName) && attempts < suffixes.length) {
                variantName = baseName + suffixes[attempts];
                attempts++;
              }
              if (attempts >= suffixes.length) {
                addLog(`⚠️ 本次获得的物品中有重复的装备【${itemName}】，跳过重复装备。`, 'normal');
                return;
              }
              itemName = variantName;
            }
            currentBatchNames.add(itemName);

            let itemType = (itemData.type as ItemType) || ItemType.Material;
            let isEquippable = itemData.isEquippable;
            let equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;
            const itemDescription = itemData.description || '';

            if (!itemType || itemType === ItemType.Material || (isEquippable && !equipmentSlot)) {
              const inferred = inferItemTypeAndSlot(
                itemName,
                itemType,
                itemDescription,
                isEquippable
              );
              if (inferred.type !== itemType) {
                itemType = inferred.type;
                isEquippable = inferred.isEquippable;
                equipmentSlot = inferred.equipmentSlot || equipmentSlot;
              } else if (isEquippable && !equipmentSlot && inferred.equipmentSlot) {
                equipmentSlot = inferred.equipmentSlot;
              }
            }

            const normalized = normalizeItemEffect(
              itemName,
              itemData.effect,
              itemData.permanentEffect,
              itemType,
              itemData.rarity as ItemRarity
            );
            let finalEffect = normalized.effect;
            let finalPermanentEffect = normalized.permanentEffect;

            if (isEquippable && !finalEffect && finalPermanentEffect) {
              finalEffect = {
                attack: finalPermanentEffect.attack,
                defense: finalPermanentEffect.defense,
                spirit: finalPermanentEffect.spirit,
                physique: finalPermanentEffect.physique,
                speed: finalPermanentEffect.speed,
                hp: 0,
              };
              if (finalPermanentEffect.maxHp) {
                finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
              }
              finalPermanentEffect = undefined;
            }

            if (isEquippable) {
              const rarity = (itemData.rarity as ItemRarity) || '普通';
              finalEffect = ensureEquipmentAttributes(
                itemType,
                finalEffect,
                rarity,
                prev.realm,
                prev.realmLevel
              ) as typeof finalEffect;
              if (finalEffect) {
                finalEffect = adjustEquipmentStatsByRealm(
                  finalEffect,
                  prev.realm,
                  prev.realmLevel,
                  rarity
                ) as typeof finalEffect;
              }
            }

            const isEquipment = isEquippable && equipmentSlot;
            const existingIdx = newInv.findIndex((i) => i.name === itemName);

            if (isEquipment && (existingIdx >= 0 || currentBatchNames.has(itemName))) {
              const baseName = itemName;
              const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
              let variantName = baseName;
              let attempts = 0;
              while (attempts < suffixes.length) {
                variantName = baseName + suffixes[attempts];
                if (newInv.findIndex((i) => i.name === variantName) < 0 && !currentBatchNames.has(variantName)) {
                  break;
                }
                attempts++;
              }
              if (attempts >= suffixes.length) {
                addLog(`⚠️ 已存在同名装备【${itemName}】，跳过重复装备。`, 'normal');
                return;
              }
              itemName = variantName;
              currentBatchNames.add(itemName);
            }

            const finalExistingIdx = newInv.findIndex((i) => i.name === itemName);
            if (finalExistingIdx >= 0 && !isEquipment && itemType !== ItemType.Recipe) {
              newInv[finalExistingIdx] = {
                ...newInv[finalExistingIdx],
                quantity: newInv[finalExistingIdx].quantity + 1,
              };
            } else {
              const rarity = (itemData.rarity as ItemRarity) || '普通';
              let reviveChances: number | undefined = undefined;
              if (
                (rarity === '传说' || rarity === '仙品') &&
                (itemType === ItemType.Weapon || itemType === ItemType.Artifact)
              ) {
                const hasRevive =
                  rarity === '传说' ? Math.random() < 0.3 : Math.random() < 0.6;
                if (hasRevive) {
                  reviveChances = Math.floor(Math.random() * 3) + 1;
                }
              }

              const newItem: Item = {
                id: uid(),
                name: itemName,
                type: itemType,
                description: itemData.description,
                quantity: 1,
                rarity: rarity,
                level: 0,
                isEquippable: isEquippable,
                equipmentSlot: equipmentSlot,
                effect: finalEffect,
                permanentEffect: finalPermanentEffect,
                reviveChances: reviveChances,
              };
              newInv.push(newItem);
            }
          });
        } else if (secretRealmResult.itemObtained) {
          // 处理单个物品（兼容旧代码）
          const itemName = secretRealmResult.itemObtained.name;
          const existingIdx = newInv.findIndex((i) => i.name === itemName);
          if (existingIdx < 0) {
            const itemTypeForRealm =
              (secretRealmResult.itemObtained.type as ItemType) ||
              ItemType.Material;
            const rarityForRealm =
              (secretRealmResult.itemObtained.rarity as ItemRarity) || '普通';
            const normalized = normalizeItemEffect(
              itemName,
              secretRealmResult.itemObtained.effect,
              secretRealmResult.itemObtained.permanentEffect,
              itemTypeForRealm,
              rarityForRealm
            );
            const newItem: Item = {
              id: uid(),
              name: itemName,
              type: itemTypeForRealm,
              description: secretRealmResult.itemObtained.description,
              quantity: 1,
              rarity: rarityForRealm,
              level: 0,
              isEquippable: secretRealmResult.itemObtained.isEquippable,
              equipmentSlot: secretRealmResult.itemObtained.equipmentSlot as
                | EquipmentSlot
                | undefined,
              effect: normalized.effect,
              permanentEffect: normalized.permanentEffect,
            };
            newInv.push(newItem);
          }
        }

        // 处理获得的灵宠
        if (secretRealmResult.petObtained) {
          const petTemplate = PET_TEMPLATES.find(
            (t) => t.id === secretRealmResult.petObtained
          );
          if (petTemplate) {
            const hasSameSpecies = newPets.some(
              (p) => p.species === petTemplate.species
            );
            if (!hasSameSpecies) {
              const newPet: Pet = {
                id: uid(),
                name: getRandomPetName(petTemplate),
                species: petTemplate.species,
                level: 1,
                exp: 0,
                maxExp: 60,
                rarity: petTemplate.rarity,
                stats: { ...petTemplate.baseStats },
                skills: [...petTemplate.skills],
                evolutionStage: 0,
                affection: 50,
              };
              newPets.push(newPet);
              newStats.petCount += 1;
              addLog(`✨ 你拯救了灵兽，获得了灵宠【${newPet.name}】！`, 'special');
            } else {
              addLog(
                `你遇到了灵兽，但它似乎已经有了同类伙伴，便离开了。`,
                'normal'
              );
            }
          }
        }

        // 处理灵宠机缘
        if (secretRealmResult.petOpportunity && newPets.length > 0) {
          let targetPet: Pet | null = null;
          if (secretRealmResult.petOpportunity.petId) {
            targetPet =
              newPets.find((p) => p.id === secretRealmResult.petOpportunity.petId) || null;
          }
          if (!targetPet && prev.activePetId) {
            targetPet = newPets.find((p) => p.id === prev.activePetId) || null;
          }
          // 如果还是没有，随机选择一个（添加防御性检查）
          if (!targetPet && newPets.length > 0) {
            const randomPet = newPets[Math.floor(Math.random() * newPets.length)];
            targetPet = randomPet;
          }

          if (targetPet) {
            const petIndex = newPets.findIndex((p) => p.id === targetPet!.id);
            const updatedPet = { ...targetPet };

            switch (secretRealmResult.petOpportunity.type) {
              case 'evolution':
                if (updatedPet.evolutionStage < 2) {
                  updatedPet.evolutionStage += 1;
                  updatedPet.stats = {
                    attack: Math.floor(updatedPet.stats.attack * 3.0),
                    defense: Math.floor(updatedPet.stats.defense * 3.0),
                    hp: Math.floor(updatedPet.stats.hp * 3.0),
                    speed: Math.floor(updatedPet.stats.speed * 1.5),
                  };
                  newPets[petIndex] = updatedPet;
                  addLog(
                    `✨ 【${targetPet.name}】在秘境中获得机缘，成功进化了！实力大幅提升！`,
                    'special'
                  );
                }
                break;
              case 'level':
                if (secretRealmResult.petOpportunity.levelGain && secretRealmResult.petOpportunity.levelGain > 0) {
                  const levelGain = Math.min(secretRealmResult.petOpportunity.levelGain, 5);
                  updatedPet.level += levelGain;
                  for (let i = 0; i < levelGain; i++) {
                    updatedPet.stats = {
                      attack: Math.floor(updatedPet.stats.attack * 1.1),
                      defense: Math.floor(updatedPet.stats.defense * 1.1),
                      hp: Math.floor(updatedPet.stats.hp * 1.1),
                      speed: Math.floor(updatedPet.stats.speed * 1.05),
                    };
                  }
                  newPets[petIndex] = updatedPet;
                  addLog(
                    `✨ 【${targetPet.name}】在秘境中获得机缘，直接提升了 ${levelGain} 级！`,
                    'special'
                  );
                }
                break;
              case 'stats':
                if (secretRealmResult.petOpportunity.statsBoost) {
                  const boost = secretRealmResult.petOpportunity.statsBoost;
                  updatedPet.stats = {
                    attack: updatedPet.stats.attack + (boost.attack || 0),
                    defense: updatedPet.stats.defense + (boost.defense || 0),
                    hp: updatedPet.stats.hp + (boost.hp || 0),
                    speed: updatedPet.stats.speed + (boost.speed || 0),
                  };
                  newPets[petIndex] = updatedPet;
                  const statsText = [
                    boost.attack ? `攻击+${boost.attack}` : '',
                    boost.defense ? `防御+${boost.defense}` : '',
                    boost.hp ? `气血+${boost.hp}` : '',
                    boost.speed ? `速度+${boost.speed}` : '',
                  ]
                    .filter(Boolean)
                    .join('、');
                  addLog(
                    `✨ 【${targetPet.name}】在秘境中获得机缘，属性提升了：${statsText}！`,
                    'special'
                  );
                }
                break;
              case 'exp':
                if (secretRealmResult.petOpportunity.expGain && secretRealmResult.petOpportunity.expGain > 0) {
                  let petNewExp = updatedPet.exp + secretRealmResult.petOpportunity.expGain;
                  let petNewLevel = updatedPet.level;
                  let petNewMaxExp = updatedPet.maxExp;
                  let leveledUp = false;
                  let levelGainCount = 0;

                  while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
                    petNewExp -= petNewMaxExp;
                    petNewLevel += 1;
                    levelGainCount += 1;
                    petNewMaxExp = Math.floor(petNewMaxExp * 1.5);
                    leveledUp = true;
                  }

                  if (leveledUp) {
                    for (let i = 0; i < levelGainCount; i++) {
                      updatedPet.stats = {
                        attack: Math.floor(updatedPet.stats.attack * 1.1),
                        defense: Math.floor(updatedPet.stats.defense * 1.1),
                        hp: Math.floor(updatedPet.stats.hp * 1.1),
                        speed: Math.floor(updatedPet.stats.speed * 1.05),
                      };
                    }
                  }

                  updatedPet.exp = petNewExp;
                  updatedPet.level = petNewLevel;
                  updatedPet.maxExp = petNewMaxExp;
                  newPets[petIndex] = updatedPet;
                  if (leveledUp) {
                    addLog(
                      `✨ 【${targetPet.name}】在秘境中获得了 ${secretRealmResult.petOpportunity.expGain} 点经验，并提升了 ${levelGainCount} 级！`,
                      'special'
                    );
                  } else {
                    addLog(
                      `✨ 【${targetPet.name}】在秘境中获得了 ${secretRealmResult.petOpportunity.expGain} 点经验！`,
                      'special'
                    );
                  }
                }
                break;
            }
          }
        }

        // 处理抽奖券奖励
        if (secretRealmResult.lotteryTicketsChange && secretRealmResult.lotteryTicketsChange > 0) {
          newLotteryTickets += secretRealmResult.lotteryTicketsChange;
          addLog(`🎫 你在秘境中获得了 ${secretRealmResult.lotteryTicketsChange} 张抽奖券！`, 'gain');
        }

        // 处理传承奖励（本地概率判定，秘境0.5%）
        const secretRealmInheritanceChance = 0.005;
        if (Math.random() < secretRealmInheritanceChance) {
          // 随机1-4个境界的传承
          const validChange = Math.floor(Math.random() * 4) + 1;
          const newTotal = Math.min(4, newInheritanceLevel + validChange);
          const actualChange = newTotal - newInheritanceLevel;
          if (actualChange > 0) {
            newInheritanceLevel = newTotal;
            addLog(
              `🌟 你在秘境中获得了上古传承！可以直接突破 ${actualChange} 个境界！`,
              'special'
            );
          }
        } else if (secretRealmResult.inheritanceLevelChange && secretRealmResult.inheritanceLevelChange > 0) {
          // 如果AI也返回了传承（极罕见情况），也处理
          const validChange = Math.max(1, Math.min(4, secretRealmResult.inheritanceLevelChange));
          const newTotal = Math.min(4, newInheritanceLevel + validChange);
          const actualChange = newTotal - newInheritanceLevel;
          if (actualChange > 0) {
            newInheritanceLevel = newTotal;
            addLog(
              `🌟 你在秘境中获得了上古传承！可以直接突破 ${actualChange} 个境界！`,
              'special'
            );
          }
        }

        // 处理寿命变化
        if (secretRealmResult.lifespanChange !== undefined && secretRealmResult.lifespanChange !== 0) {
          newLifespan = Math.max(0, newLifespan + secretRealmResult.lifespanChange);
        }

        // 处理灵根变化
        if (secretRealmResult.spiritualRootsChange) {
          newSpiritualRoots = {
            metal: Math.min(100, Math.max(0, (newSpiritualRoots.metal || 0) + (secretRealmResult.spiritualRootsChange.metal || 0))),
            wood: Math.min(100, Math.max(0, (newSpiritualRoots.wood || 0) + (secretRealmResult.spiritualRootsChange.wood || 0))),
            water: Math.min(100, Math.max(0, (newSpiritualRoots.water || 0) + (secretRealmResult.spiritualRootsChange.water || 0))),
            fire: Math.min(100, Math.max(0, (newSpiritualRoots.fire || 0) + (secretRealmResult.spiritualRootsChange.fire || 0))),
            earth: Math.min(100, Math.max(0, (newSpiritualRoots.earth || 0) + (secretRealmResult.spiritualRootsChange.earth || 0))),
          };
        }

        // 获得功法概率（秘境中10%概率）
        // 注意：功法解锁由本地概率控制，AI不应在story中提及功法相关内容
        const artChance = 0.10;
        let secretRealmArtUnlocked = false; // 标记是否真的解锁了功法
        if (Math.random() < artChance) {
          const availableArts = CULTIVATION_ARTS.filter((art) => {
            if (newArts.includes(art.id)) return false;
            const artRealmIndex2 = REALM_ORDER.indexOf(art.realmRequirement);
            const playerRealmIndex2 = REALM_ORDER.indexOf(prev.realm);
            // 如果索引无效（-1），保守处理：不满足条件
            if (artRealmIndex2 < 0 || playerRealmIndex2 < 0 || artRealmIndex2 > playerRealmIndex2) {
              return false;
            }
            if (art.sectId !== null && art.sectId !== undefined) {
              return art.sectId === prev.sectId;
            }
            return true;
          });
          if (availableArts.length > 0) {
            const randomArt =
              availableArts[Math.floor(Math.random() * availableArts.length)];
            if (!newArts.includes(randomArt.id)) {
              // 先解锁功法（添加到unlockedArts）- 确保解锁逻辑优先执行
              if (!newUnlockedArts.includes(randomArt.id)) {
                newUnlockedArts.push(randomArt.id);
                console.log(`[功法解锁] 秘境中解锁功法: ${randomArt.name} (${randomArt.id})`);
              }
              // 然后直接学习（添加到cultivationArts）
              newArts.push(randomArt.id);
              newStats.artCount += 1;
              newAttack += randomArt.effects.attack || 0;
              newDefense += randomArt.effects.defense || 0;
              newMaxHp += randomArt.effects.hp || 0;
              newHp += randomArt.effects.hp || 0;
              secretRealmArtUnlocked = true; // 标记已解锁功法
              triggerVisual('special', `🎉 领悟功法【${randomArt.name}】`, 'special');
              addLog(
                `🎉 你在秘境中领悟了功法【${randomArt.name}】！可在功法阁查看。`,
                'special'
              );
            } else {
              // 如果功法已经在 cultivationArts 中，但不在 unlockedArts 中，也要添加到 unlockedArts
              // 这可以修复通过调试模式或其他方式获得的功法未解锁的问题
              if (!newUnlockedArts.includes(randomArt.id)) {
                newUnlockedArts.push(randomArt.id);
                console.log(`[功法解锁] 修复未解锁的功法: ${randomArt.name} (${randomArt.id})`);
              }
            }
          }
        }

        // 如果AI在story中提到了功法但实际没有解锁，需要过滤掉相关描述
        if (!secretRealmArtUnlocked && secretRealmResult.story) {
          const artKeywords = /功法|心法|体术|领悟|获得.*功法|习得.*功法|学会.*功法/i;
          if (artKeywords.test(secretRealmResult.story)) {
            // 如果story中提到了功法但实际没有解锁，移除相关描述
            secretRealmResult.story = secretRealmResult.story
              .split(/[。！？\n]/)
              .filter(sentence => !artKeywords.test(sentence))
              .join('。')
              .replace(/。+/g, '。') // 移除多余的句号
              .trim();
            // 如果过滤后story为空，使用默认描述
            if (!secretRealmResult.story || secretRealmResult.story.length < 10) {
              secretRealmResult.story = '你在秘境中探索，虽然有所收获，但大道渺茫，还需继续努力。';
            }
          }
        }

        // 秘境内本地概率掉落灵宠进阶材料
        const secretRealmPetMaterialChance = 0.08;
        if (Math.random() < secretRealmPetMaterialChance) {
          const material =
            PET_EVOLUTION_MATERIALS[
              Math.floor(Math.random() * PET_EVOLUTION_MATERIALS.length)
            ];
          const existingIdx = newInv.findIndex((i) => i.name === material.name);
          if (existingIdx >= 0) {
            newInv[existingIdx] = {
              ...newInv[existingIdx],
              quantity: newInv[existingIdx].quantity + 1,
            };
          } else {
            newInv.push({
              id: uid(),
              name: material.name,
              type: ItemType.Material,
              description: material.description,
              quantity: 1,
              rarity: material.rarity as ItemRarity,
              level: 0,
            });
          }
          addLog(`🎁 你在秘境中获得了灵宠进阶材料【${material.name}】！`, 'gain');
        }

        // 处理属性降低（平衡机制：限制降低数值，确保有补偿）
        if (secretRealmResult.attributeReduction) {
          const reduction = secretRealmResult.attributeReduction;

          // 计算属性降低的总量，如果降低太多，需要限制
          let totalReduction = 0;
          if (reduction.attack) totalReduction += reduction.attack;
          if (reduction.defense) totalReduction += reduction.defense;
          if (reduction.spirit) totalReduction += reduction.spirit;
          if (reduction.physique) totalReduction += reduction.physique;
          if (reduction.speed) totalReduction += reduction.speed;
          if (reduction.maxHp) totalReduction += reduction.maxHp;

          // 计算玩家总属性值（用于比例限制）
          const totalAttributes =
            prev.attack +
            prev.defense +
            prev.spirit +
            prev.physique +
            prev.speed +
            prev.maxHp;

          // 如果降低超过总属性的15%，则按比例缩减（确保不会过度降低）
          const maxReductionRatio = 0.15; // 最多降低15%
          const maxAllowedReduction = totalAttributes * maxReductionRatio;

          if (totalReduction > maxAllowedReduction) {
            const scaleFactor = maxAllowedReduction / totalReduction;
            // 按比例缩减所有降低值
            if (reduction.attack)
              reduction.attack = Math.floor(reduction.attack * scaleFactor);
            if (reduction.defense)
              reduction.defense = Math.floor(reduction.defense * scaleFactor);
            if (reduction.spirit)
              reduction.spirit = Math.floor(reduction.spirit * scaleFactor);
            if (reduction.physique)
              reduction.physique = Math.floor(reduction.physique * scaleFactor);
            if (reduction.speed)
              reduction.speed = Math.floor(reduction.speed * scaleFactor);
            if (reduction.maxHp)
              reduction.maxHp = Math.floor(reduction.maxHp * scaleFactor);
          }

          // 应用属性降低（限制单个属性最多降低10%）
          if (reduction.attack) {
            const maxAttackReduction = Math.floor(prev.attack * 0.1);
            newAttack = Math.max(
              0,
              newAttack - Math.min(reduction.attack, maxAttackReduction)
            );
          }
          if (reduction.defense) {
            const maxDefenseReduction = Math.floor(prev.defense * 0.1);
            newDefense = Math.max(
              0,
              newDefense - Math.min(reduction.defense, maxDefenseReduction)
            );
          }
          if (reduction.spirit) {
            const maxSpiritReduction = Math.floor(prev.spirit * 0.1);
            newSpirit = Math.max(
              0,
              newSpirit - Math.min(reduction.spirit, maxSpiritReduction)
            );
          }
          if (reduction.physique) {
            const maxPhysiqueReduction = Math.floor(prev.physique * 0.1);
            newPhysique = Math.max(
              0,
              newPhysique - Math.min(reduction.physique, maxPhysiqueReduction)
            );
          }
          if (reduction.speed) {
            const maxSpeedReduction = Math.floor(prev.speed * 0.1);
            newSpeed = Math.max(
              0,
              newSpeed - Math.min(reduction.speed, maxSpeedReduction)
            );
          }
          if (reduction.maxHp) {
            const maxHpReduction = Math.floor(prev.maxHp * 0.1);
            const actualReduction = Math.min(reduction.maxHp, maxHpReduction);
            newMaxHp = Math.max(prev.maxHp * 0.5, newMaxHp - actualReduction);
            newHp = Math.min(newHp, newMaxHp);
          }

          // 如果确实发生了属性降低，确保有补偿（检查是否有物品或大量奖励）
          const hasCompensation =
            secretRealmResult.itemObtained ||
            (typeof secretRealmResult.expChange === 'number' && !isNaN(secretRealmResult.expChange) && secretRealmResult.expChange > 100 * realmMultiplier) ||
            (typeof secretRealmResult.spiritStonesChange === 'number' && !isNaN(secretRealmResult.spiritStonesChange) && secretRealmResult.spiritStonesChange > 200 * realmMultiplier);

          if (!hasCompensation && totalReduction > 0) {
            // 如果没有补偿，自动增加一些奖励作为补偿
            newExp += Math.floor(50 * realmMultiplier);
            newStones += Math.floor(100 * realmMultiplier);
          }
        }

        // 确保数值有效，防止NaN
        const safeSecretHpChange = typeof secretRealmResult.hpChange === 'number' && !isNaN(secretRealmResult.hpChange) ? secretRealmResult.hpChange : 0;
        const safeSecretExpChange = typeof secretRealmResult.expChange === 'number' && !isNaN(secretRealmResult.expChange) ? secretRealmResult.expChange : 0;
        const safeSecretSpiritStonesChange = typeof secretRealmResult.spiritStonesChange === 'number' && !isNaN(secretRealmResult.spiritStonesChange) ? secretRealmResult.spiritStonesChange : 0;

        // 最终同步：确保 newArts 中的所有功法都在 newUnlockedArts 中
        // 这可以修复在快速连续秘境中可能丢失的解锁
        newArts.forEach(artId => {
          if (!newUnlockedArts.includes(artId)) {
            newUnlockedArts.push(artId);
            console.log(`[功法解锁] 最终同步: 确保功法 ${artId} 在 unlockedArts 中`);
          }
        });

        return {
          ...prev,
          hp: Math.max(
            0,
            Math.min(newMaxHp, newHp + safeSecretHpChange)
          ),
          exp: Math.max(0, newExp + safeSecretExpChange),
          spiritStones: Math.max(
            0,
            newStones + safeSecretSpiritStonesChange
          ),
          inventory: newInv,
          cultivationArts: newArts,
          unlockedArts: newUnlockedArts, // 确保 unlockedArts 被正确更新
          talentId: prev.talentId, // 保持天赋ID不变
          attack: newAttack,
          defense: newDefense,
          maxHp: newMaxHp,
          spirit: newSpirit,
          physique: newPhysique,
          speed: newSpeed,
          luck: prev.luck, // 保持幸运值不变（秘境中不修改）
          lotteryTickets: newLotteryTickets,
          inheritanceLevel: newInheritanceLevel,
          pets: newPets,
          statistics: newStats,
          lifespan: newLifespan,
          spiritualRoots: newSpiritualRoots,
        };
      });
      addLog(secretRealmResult.story, secretRealmResult.eventColor);

      // 显示获得的物品
      if (secretRealmResult.itemsObtained && Array.isArray(secretRealmResult.itemsObtained) && secretRealmResult.itemsObtained.length > 0) {
        secretRealmResult.itemsObtained.forEach((item) => {
          const normalizedRarity = normalizeRarityValue(item.rarity);
          const rarityText = normalizedRarity ? `【${normalizedRarity}】` : '';
          addLog(`获得物品: ${rarityText}${item.name}`, 'gain');
        });
      } else if (secretRealmResult.itemObtained) {
        addLog(`获得物品: ${secretRealmResult.itemObtained.name}`, 'gain');
      }

      // 显示寿命变化
      if (secretRealmResult.lifespanChange !== undefined && secretRealmResult.lifespanChange !== 0) {
        if (secretRealmResult.lifespanChange > 0) {
          addLog(`✨ 你的寿命增加了 ${secretRealmResult.lifespanChange.toFixed(1)} 年！`, 'gain');
        } else {
          addLog(`⚠️ 你的寿命减少了 ${Math.abs(secretRealmResult.lifespanChange).toFixed(1)} 年！`, 'danger');
        }
      }

      // 显示灵根变化
      if (secretRealmResult.spiritualRootsChange) {
        const rootNames: Record<string, string> = {
          metal: '金',
          wood: '木',
          water: '水',
          fire: '火',
          earth: '土',
        };
        Object.entries(secretRealmResult.spiritualRootsChange).forEach(([key, value]) => {
          if (value && value !== 0) {
            const rootName = rootNames[key] || key;
            if (value > 0) {
              addLog(`✨ 你的${rootName}灵根提升了 ${value} 点！`, 'gain');
            } else {
              addLog(`⚠️ 你的${rootName}灵根降低了 ${Math.abs(value)} 点！`, 'danger');
            }
          }
        });
      }
    }, 1000);
  }
}
