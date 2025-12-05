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
} from '../../types';
import {
  REALM_ORDER,
  TALENTS,
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  RARITY_MULTIPLIERS,
  DISCOVERABLE_RECIPES,
  PET_EVOLUTION_MATERIALS,
  getRandomPetName,
} from '../../constants';
import { BattleReplay } from '../../services/battleService';
import { generateAdventureEvent } from '../../services/aiService';
import { uid } from '../../utils/gameUtils';
import {
  normalizeItemEffect,
  inferItemTypeAndSlot,
} from '../../utils/itemUtils';

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
}

/**
 * 为装备添加属性（如果装备没有属性，根据品阶自动生成）
 * @param itemType 物品类型
 * @param effect 当前效果
 * @param rarity 稀有度
 * @returns 更新后的效果对象
 */
function ensureEquipmentAttributes(
  itemType: ItemType,
  effect: AdventureResult['itemObtained']['effect'] | undefined,
  rarity: ItemRarity
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

  // 检查是否已有任何属性
  const hasAnyAttribute =
    processedEffect?.attack ||
    processedEffect?.defense ||
    processedEffect?.hp ||
    processedEffect?.spirit ||
    processedEffect?.physique ||
    processedEffect?.speed;

  // 如果没有属性，根据品阶生成属性
  if (!hasAnyAttribute) {
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

    // 根据稀有度生成基础属性值
    const baseValue =
      rarity === '普通'
        ? 10
        : rarity === '稀有'
          ? 30
          : rarity === '传说'
            ? 80
            : 200;

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

    const newEffect: any = {};
    selectedAttributes.forEach((attr) => {
      const value = Math.floor(
        baseValue * rarityMultiplier * (0.8 + Math.random() * 0.4)
      );
      newEffect[attr] = value;
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
    let newTalentId = prev.talentId;
    let newAttack = prev.attack;
    let newDefense = prev.defense;
    let newMaxHp = prev.maxHp;
    let newHp = prev.hp;
    let newLuck = prev.luck;
    let newLotteryTickets = prev.lotteryTickets;
    let newInheritanceLevel = prev.inheritanceLevel;
    let newPets = [...prev.pets];
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
    if (result.itemsObtained && result.itemsObtained.length > 0) {
      result.itemsObtained.forEach((itemData) => {
        let itemName = itemData.name;
        let itemType = (itemData.type as ItemType) || ItemType.Material;
        let isEquippable = itemData.isEquippable;
        let equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;
        const itemDescription = itemData.description || '';

        // 自动推断和修正物品类型和装备槽位
        // 优先使用代码推断的结果，因为代码的规则更准确
        const inferred = inferItemTypeAndSlot(
          itemName,
          itemType,
          itemDescription,
          isEquippable
        );
        // 如果推断出的类型与AI返回的类型不一致，使用推断的类型（代码规则优先）
        if (inferred.type !== itemType) {
          console.log(
            `[物品类型修正] "${itemName}": AI返回类型="${itemType}", 推断类型="${inferred.type}", 使用推断类型`
          );
        }
        itemType = inferred.type;
        isEquippable = inferred.isEquippable;
        equipmentSlot = inferred.equipmentSlot || equipmentSlot;

        // 规范化物品效果（确保已知物品的效果与描述一致）
        const normalized = normalizeItemEffect(
          itemName,
          itemData.effect,
          itemData.permanentEffect
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
            rarity
          ) as typeof finalEffect;
        }

        const isEquipment = isEquippable && equipmentSlot;
        const existingIdx = newInv.findIndex((i) => i.name === itemName);

        // 处理丹方：需要添加 recipeData
        let recipeData = undefined;
        if (itemType === ItemType.Recipe) {
          // 从 itemData 中获取 recipeName（如果存在）
          const recipeName = (itemData as any).recipeName;
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

        if (existingIdx >= 0 && !isEquipment && itemType !== ItemType.Recipe) {
          // 丹方不能叠加，每个丹方都是独立的
          newInv[existingIdx] = {
            ...newInv[existingIdx],
            quantity: newInv[existingIdx].quantity + 1,
          };
        } else {
          // 检查是否为传说或仙品装备，随机添加保命机会
          const rarity = (itemData.rarity as ItemRarity) || '普通';
          let reviveChances: number | undefined = undefined;

          // 只有武器和法宝类型的传说/仙品装备可能有保命机会
          if ((rarity === '传说' || rarity === '仙品') &&
              (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
            // 传说装备30%概率有保命，仙品装备60%概率有保命
            const hasRevive = rarity === '传说'
              ? Math.random() < 0.3
              : Math.random() < 0.6;

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
      });
    }

    // 处理获得的单个物品（兼容旧代码）
    if (result.itemObtained) {
      let itemName = result.itemObtained.name;
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
        // 自动推断和修正物品类型和装备槽位
        // 优先使用代码推断的结果，因为代码的规则更准确
        const inferred = inferItemTypeAndSlot(
          itemName,
          itemType,
          itemDescription,
          isEquippable
        );
        // 如果推断出的类型与AI返回的类型不一致，使用推断的类型（代码规则优先）
        if (inferred.type !== itemType) {
          console.log(
            `[物品类型修正] "${itemName}": AI返回类型="${itemType}", 推断类型="${inferred.type}", 使用推断类型`
          );
        }
        itemType = inferred.type;
        isEquippable = inferred.isEquippable;
        equipmentSlot = inferred.equipmentSlot || equipmentSlot;
      }

      // 规范化物品效果（确保已知物品的效果与描述一致）
      const normalized = normalizeItemEffect(
        itemName,
        result.itemObtained.effect,
        result.itemObtained.permanentEffect
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
          rarity
        ) as typeof finalEffect;
      }

      // 处理丹方：需要添加 recipeData
      let recipeData = undefined;
      if (itemType === ItemType.Recipe) {
        // 从 result.itemObtained 中获取 recipeName（如果存在）
        const recipeName = (result.itemObtained as any).recipeName;
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

      // 装备类物品可以重复获得，但每个装备单独占一格（quantity始终为1）
      const isEquipment = isEquippable && equipmentSlot;
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
        } else if ((rarity === '传说' || rarity === '仙品') &&
                   (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
          // 只有武器和法宝类型的传说/仙品装备可能有保命机会
          // 传说装备30%概率有保命，仙品装备60%概率有保命
          const hasRevive = rarity === '传说'
            ? Math.random() < 0.3
            : Math.random() < 0.6;

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

    // 处理传承奖励（极小概率获得传承，可直接突破1-4个境界）
    if (result.inheritanceLevelChange && result.inheritanceLevelChange > 0) {
      // 限制传承等级变化在1-4之间，且总传承等级不超过4
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
            maxExp: 100,
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
      // 如果还是没有，随机选择一个
      if (!targetPet) {
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

    // 极小概率获得功法（3%概率，秘境中5%）
    const artChance = realmName ? 0.05 : 0.03;
    if (Math.random() < artChance && adventureType !== 'lucky') {
      const availableArts = CULTIVATION_ARTS.filter((art) => {
        // 已经拥有的排除
        if (newArts.includes(art.id)) return false;
        // 境界要求
        if (
          REALM_ORDER.indexOf(art.realmRequirement) >
          REALM_ORDER.indexOf(prev.realm)
        ) {
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
        // 确保功法没有被重复添加
        if (!newArts.includes(randomArt.id)) {
          newArts.push(randomArt.id);
          newStats.artCount += 1;
          newAttack += randomArt.effects.attack || 0;
          newDefense += randomArt.effects.defense || 0;
          newMaxHp += randomArt.effects.hp || 0;
          newHp += randomArt.effects.hp || 0;
          addLog(
            `🎉 你在历练中领悟了功法【${randomArt.name}】！可在功法阁查看。`,
            'special'
          );
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

    // 极小概率获得天赋（1%概率，秘境中2%，大机缘中5%）
    const talentChance =
      adventureType === 'lucky' ? 0.05 : realmName ? 0.02 : 0.01;
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

    // 允许hp变为0或负数，用于触发死亡检测
    const finalHp = newHp + safeHpChange;

    return {
      ...prev,
      hp: Math.min(newMaxHp, finalHp), // 移除 Math.max(0, ...)，允许负数
      exp: Math.max(0, prev.exp + safeExpChange), // 修为不能为负
      spiritStones: Math.max(0, prev.spiritStones + safeSpiritStonesChange), // 灵石不能为负
      inventory: newInv,
      cultivationArts: newArts,
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
    };
  });

  addLog(result.story, result.eventColor);

  // 显示获得的物品
  if (result.itemsObtained && result.itemsObtained.length > 0) {
    result.itemsObtained.forEach((item) => {
      const rarityText = item.rarity ? `【${item.rarity}】` : '';
      addLog(`获得物品: ${rarityText}${item.name}`, 'gain');
    });
  } else if (result.itemObtained) {
    addLog(`获得物品: ${result.itemObtained.name}`, 'gain');
  }

  // 即使跳过战斗，也要保存战斗数据用于死亡统计
  // 但只在非自动模式下显示战斗弹窗
  if (battleContext) {
    if (!skipBattle) {
      onOpenBattleModal(battleContext);
    } else {
      // 自动模式下，静默保存战斗数据（通过 onOpenBattleModal 回调）
      // 这样可以在死亡时显示战斗统计
      onOpenBattleModal(battleContext);
    }
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

        // 处理秘境中的物品
        if (secretRealmResult.itemObtained) {
          const itemName = secretRealmResult.itemObtained.name;
          const existingIdx = newInv.findIndex((i) => i.name === itemName);
          if (existingIdx < 0) {
            // 规范化物品效果（确保已知物品的效果与描述一致）
            const normalized = normalizeItemEffect(
              itemName,
              secretRealmResult.itemObtained.effect,
              secretRealmResult.itemObtained.permanentEffect
            );
            const newItem: Item = {
              id: uid(),
              name: itemName,
              type:
                (secretRealmResult.itemObtained.type as ItemType) ||
                ItemType.Material,
              description: secretRealmResult.itemObtained.description,
              quantity: 1,
              rarity:
                (secretRealmResult.itemObtained.rarity as ItemRarity) || '普通',
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
          attack: newAttack,
          defense: newDefense,
          maxHp: newMaxHp,
          spirit: newSpirit,
          physique: newPhysique,
          speed: newSpeed,
        };
      });
      addLog(secretRealmResult.story, secretRealmResult.eventColor);
      if (secretRealmResult.itemObtained) {
        addLog(`获得物品: ${secretRealmResult.itemObtained.name}`, 'gain');
      }
    }, 1000);
  }
}
