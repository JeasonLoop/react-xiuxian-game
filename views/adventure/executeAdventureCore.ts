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
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  HEAVEN_EARTH_SOUL_BOSSES,
  LONGEVITY_RULES,
  SECTS,
} from '../../constants/index';
import { SectRank } from '../../types';
import { BattleReplay } from '../../services/battleService';
import { uid } from '../../utils/gameUtils';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../../services/adventureTemplateService';
import { getAllArtifacts, getItemFromConstants } from '../../utils/itemConstantsUtils';
import {
  normalizeItemEffect,
  inferItemTypeAndSlot,
  adjustEquipmentStatsByRealm,
  adjustItemStatsByRealm,
} from '../../utils/itemUtils';
import { normalizeRarityValue } from '../../utils/rarityUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface ExecuteAdventureCoreProps {
  result: AdventureResult;
  battleContext: BattleReplay | null;
  petSkillCooldowns?: Record<string, number>;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  onOpenBattleModal: (replay: BattleReplay) => void;
  realmName?: string;
  adventureType: AdventureType;
  skipBattle?: boolean;
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void;
}

// 已移除 ensureEquipmentAttributes 函数
// 不再调整装备属性，直接使用常量池中的原始属性

/**
 * 核心玩家状态更新逻辑 (Refactored)
 */
const applyResultToPlayer = (
  prev: PlayerStats,
  result: AdventureResult,
  options: {
    isSecretRealm: boolean;
    adventureType: AdventureType;
    realmName?: string;
    riskLevel?: string;
    battleContext?: BattleReplay | null;
    petSkillCooldowns?: Record<string, number>;
    addLog: (msg: string, type?: string) => void;
    triggerVisual: (type: string, text?: string, className?: string) => void;
  }
): PlayerStats => {
  const { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual } = options;
  if (!prev) return prev;

  const realmIndex = REALM_ORDER.indexOf(prev.realm);
  const realmMultiplier = 1 + realmIndex * 0.3 + (prev.realmLevel - 1) * 0.1;

  let newInv = [...prev.inventory];
  let newArts = [...prev.cultivationArts];
  // 使用 Set 确保唯一性，然后转回数组
  // 修复：初始化 Set 时应包含 prev.unlockedArts，确保之前已解锁的功法不被丢失
  const unlockedArtsSet = new Set([...(prev.unlockedArts || []), ...prev.cultivationArts]);
  let newUnlockedArts = Array.from(unlockedArtsSet);

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
  let newSpirit = prev.spirit;
  let newPhysique = prev.physique;
  let newSpeed = prev.speed;
  let newLifespan = prev.lifespan ?? prev.maxLifespan ?? 100;
  let newSpiritualRoots = { ...prev.spiritualRoots };
  let newExp = prev.exp;
  let newStones = prev.spiritStones;

  const newStats = { ...(prev.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };
  newStats.adventureCount += 1;
  if (realmName || isSecretRealm) newStats.secretRealmCount += 1;
  if (battleContext?.victory) newStats.killCount += 1;

  // 灵宠冷却
  if (petSkillCooldowns && prev.activePetId) {
    newPets = newPets.map(p => {
      if (p.id === prev.activePetId) {
        const cooldowns = { ...p.skillCooldowns };
        Object.entries(petSkillCooldowns).forEach(([id, cd]) => { if (cd > 0) cooldowns[id] = Math.max(cooldowns[id] || 0, cd); });
        const finalCds: Record<string, number> = {};
        Object.entries(cooldowns).forEach(([id, cd]) => { if (cd > 0) finalCds[id] = cd; });
        return { ...p, skillCooldowns: Object.keys(finalCds).length > 0 ? finalCds : undefined };
      }
      return p;
    });
  }

  // 物品处理逻辑
  const itemsToProcess = [...(result.itemsObtained || [])];
  if (result.itemObtained) itemsToProcess.push(result.itemObtained);

  const currentBatchNames = new Set<string>();
  itemsToProcess.forEach(itemData => {
    // 修复：提前检查 itemData 是否有效，避免无效数据导致处理失败
    if (!itemData || !itemData.name) {
      console.error('Item data is null/undefined or has no name, skipping:', itemData);
      return;
    }

    // 将变量声明移到 try 块外部，以便 catch 块也能访问
    let itemName = '';
    let itemType = ItemType.Material;
    let itemRarity: ItemRarity = '普通';
    let isEquippable = false;
    let equipmentSlot: EquipmentSlot | undefined = undefined;
    let finalEffect: any = undefined;
    let finalPermanentEffect: any = undefined;

    try {
      itemName = itemData.name.trim();
      itemType = (itemData.type as ItemType) || ItemType.Material;
      isEquippable = !!itemData.isEquippable;
      equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;

      // 修复：神神秘法宝处理只对普通物品生效，避免高级物品被替换
      const isBasicItem = !(itemData as any).advancedItemType &&
                           !(itemData as any).advancedItemId &&
                           !(itemData as any).recipeData;

      if (isBasicItem && itemName.includes('法宝')) {
        // 从常量池获取随机法宝
        const artifacts = getAllArtifacts();
        if (artifacts.length > 0) {
          const randomArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
          itemName = randomArtifact.name;
          itemType = randomArtifact.type;
          isEquippable = randomArtifact.isEquippable || true;
          equipmentSlot = (randomArtifact.equipmentSlot as EquipmentSlot) || (Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2);
          // 使用常量池中的描述和效果
          if (randomArtifact.description) {
            itemData.description = randomArtifact.description;
          }
          if (randomArtifact.effect) {
            itemData.effect = randomArtifact.effect;
          }
          if (randomArtifact.permanentEffect) {
            itemData.permanentEffect = randomArtifact.permanentEffect;
          }
          if (randomArtifact.rarity) {
            itemData.rarity = randomArtifact.rarity;
          }
        } else {
          // 如果常量池中没有法宝，使用默认处理
          itemName = '神秘法宝';
          itemType = ItemType.Artifact;
          isEquippable = true;
          equipmentSlot = Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2;
        }
      } else {
        // 非基础物品（已包含高级物品信息），直接跳过法宝处理逻辑
      }

      // 优先从常量池获取物品完整信息（如果常量池中有，直接使用，避免类型推断）
      itemRarity = (itemData.rarity as ItemRarity) || '普通';
      const itemFromConstants = getItemFromConstants(itemName);
      if (itemFromConstants) {
        // 常量池中有完整定义，优先使用常量池的数据
        itemType = itemFromConstants.type as ItemType;
        itemRarity = itemFromConstants.rarity;
        // 如果常量池中有装备槽位信息，使用常量池的
        if (itemFromConstants.equipmentSlot) {
          equipmentSlot = itemFromConstants.equipmentSlot as EquipmentSlot;
          isEquippable = itemFromConstants.isEquippable || true;
        }
        // 如果常量池中有描述，使用常量池的描述
        if (itemFromConstants.description && !itemData.description) {
          itemData.description = itemFromConstants.description;
        }
        // 如果常量池中有进阶物品信息，使用常量池的（优先使用常量池的数据）
        if ((itemFromConstants as any).advancedItemType && !(itemData as any).advancedItemType) {
          (itemData as any).advancedItemType = (itemFromConstants as any).advancedItemType;
        }
        if ((itemFromConstants as any).advancedItemId && !(itemData as any).advancedItemId) {
          (itemData as any).advancedItemId = (itemFromConstants as any).advancedItemId;
        }

        // 验证装备槽位：即使常量池中有槽位，也要通过名称推断验证是否正确
        // 如果推断出的槽位与常量池不一致，且推断结果更合理（基于物品名称），则使用推断结果
        if (isEquippable && equipmentSlot) {
          const inferred = inferItemTypeAndSlot(itemName, itemType, itemData.description || '', isEquippable);
          if (inferred.equipmentSlot && inferred.equipmentSlot !== equipmentSlot) {
            // 如果推断出的槽位与常量池不一致，优先使用推断结果（因为推断基于物品名称，更准确）
            // 这样可以修复常量池中可能存在的错误槽位定义
            equipmentSlot = inferred.equipmentSlot;
            if (import.meta.env.DEV) {
              console.warn(`【槽位修正】物品"${itemName}"的槽位从常量池的"${itemFromConstants.equipmentSlot}"修正为推断的"${inferred.equipmentSlot}"`);
            }
          } else if (!equipmentSlot && inferred.equipmentSlot) {
            // 如果常量池中没有槽位，但推断出了槽位，使用推断结果
            equipmentSlot = inferred.equipmentSlot;
          }
        }
      } else {
        // 常量池中没有，才进行类型推断
        const inferred = inferItemTypeAndSlot(itemName, itemType, itemData.description || '', isEquippable);
        itemType = inferred.type;
        isEquippable = inferred.isEquippable;
        equipmentSlot = inferred.equipmentSlot || equipmentSlot;
      }

      // 效果规范化（完全使用常量池中的原始属性）
      const normalized = normalizeItemEffect(itemName, itemData.effect, itemData.permanentEffect, itemType, itemRarity);
      finalEffect = normalized.effect;
      finalPermanentEffect = normalized.permanentEffect;

      // 装备不应该有永久效果，如果有则转换为临时效果（effect）
      if (isEquippable && finalPermanentEffect) {
        // 将 permanentEffect 的属性合并到 effect 中
        if (!finalEffect) {
          finalEffect = {};
        }
        // 属性映射表，减少重复代码
        const permEffectMap: Array<{ permKey: keyof typeof finalPermanentEffect; effectKey: keyof typeof finalEffect }> = [
          { permKey: 'attack', effectKey: 'attack' },
          { permKey: 'defense', effectKey: 'defense' },
          { permKey: 'spirit', effectKey: 'spirit' },
          { permKey: 'physique', effectKey: 'physique' },
          { permKey: 'speed', effectKey: 'speed' },
        ];
        permEffectMap.forEach(({ permKey, effectKey }) => {
          const permValue = finalPermanentEffect?.[permKey];
          if (permValue !== undefined && typeof permValue === 'number') {
            finalEffect[effectKey] = (finalEffect[effectKey] || 0) + permValue;
          }
        });
        // maxHp 特殊处理，转换为 hp
        if (finalPermanentEffect.maxHp !== undefined) {
          finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
        }
        // 装备不应该有永久效果
        finalPermanentEffect = undefined;
      }

      // 所有物品属性根据境界进行调整，确保属性跟上角色成长
      // 对于装备，使用专门的adjustEquipmentStatsByRealm；对于其他物品，使用通用的adjustItemStatsByRealm
      if (finalEffect || finalPermanentEffect) {
        const adjusted = adjustItemStatsByRealm(
          finalEffect,
          finalPermanentEffect,
          prev.realm,
          prev.realmLevel,
          itemType,
          itemRarity
        );
        finalEffect = adjusted.effect;
        finalPermanentEffect = adjusted.permanentEffect;
      }

      // 重名装备处理
      if (isEquippable && equipmentSlot) {
        let baseName = itemName;
        const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
        let attempts = 0;
        while (attempts < suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) {
          itemName = baseName + suffixes[attempts++];
          // 添加到 currentBatchNames，确保当前批次中的物品不会重复
          currentBatchNames.add(itemName);
        }
        // 修复：检查条件调整顺序，确保先检查 attempts，避免跳过添加
        if (attempts >= suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) return;
      }
      currentBatchNames.add(itemName);

      // 丹方处理
      let recipeData = undefined;
      if (itemType === ItemType.Recipe) {
        let recipeName = (itemData as any).recipeName || itemName.replace(/丹方$/, '');
        recipeData = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      }

      const existingIdx = newInv.findIndex(i => i.name === itemName);
      if (existingIdx >= 0 && !isEquippable && itemType !== ItemType.Recipe) {
        newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
      } else {
        let reviveChances = (itemData as any).reviveChances;
        if (reviveChances === undefined && (itemRarity === '传说' || itemRarity === '仙品') && (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
          if (Math.random() < (itemRarity === '传说' ? 0.3 : 0.6)) reviveChances = Math.floor(Math.random() * 3) + 1;
        }
        // 确保装备不会有 permanentEffect
        const equipmentPermanentEffect = isEquippable ? undefined : finalPermanentEffect;
        // 传递进阶物品相关字段
        const advancedItemType = (itemData as any).advancedItemType;
        const advancedItemId = (itemData as any).advancedItemId;
        newInv.push({ id: uid(), name: itemName, type: itemType, description: itemData.description, quantity: 1, rarity: itemRarity, level: 0, isEquippable, equipmentSlot, effect: finalEffect, permanentEffect: equipmentPermanentEffect, recipeData, reviveChances, advancedItemType, advancedItemId });
      }
    } catch (e) {
      console.error('Item processing error:', e);
      // 确保即使出错也添加物品（使用默认值）
      const fallbackItem = {
        id: uid(),
        name: itemName,
        type: itemType,
        description: itemData?.description || '未描述物品',
        quantity: 1,
        rarity: itemRarity,
        level: (itemData as any)?.level || 0,
        isEquippable: false,
        effect: finalEffect || {},
        permanentEffect: undefined,
        // 添加缺失的装备属性
        equipmentSlot: equipmentSlot || undefined,
        recipeData: (itemData as any)?.recipeData,
        reviveChances: (itemData as any)?.reviveChances,
        advancedItemType: (itemData as any)?.advancedItemType,
        advancedItemId: (itemData as any)?.advancedItemId
      };
      newInv.push(fallbackItem);
    }
  });

  // 功法解锁逻辑
  // 检查事件描述是否包含功法相关关键词（确保 cultivationArt 类型事件能正确解锁）
  const storyHasArtKeywords = result.story && (
    result.story.includes('功法') ||
    result.story.includes('残卷') ||
    result.story.includes('秘籍') ||
    result.story.includes('领悟') ||
    result.story.includes('传授') ||
    result.story.includes('传承')
  );

  // 如果事件描述包含功法关键词，保证解锁；否则按概率解锁（降低概率）
  const artChance = storyHasArtKeywords ? 1.0 : (isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.10 : 0.04));
  let artUnlocked = false;

  // 增加随机性：结合确定性随机数和真正的随机数
  // 使用事件描述的字符码总和作为基础种子
  const storyHash = result.story ? result.story.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
  // 添加更多变化因子，让每次历练结果更不一样
  const deterministicSeed = storyHash + (prev.exp || 0) + (prev.spiritStones || 0) + (prev.realm?.length || 0) + (prev.hp || 0) + (prev.attack || 0);
  const deterministicRandom = Math.abs(Math.sin(deterministicSeed)) % 1;
  // 加入真正的随机数，增加变化性（70%确定性 + 30%随机性）
  const trueRandom = Math.random();
  const artRandom = deterministicRandom * 0.7 + trueRandom * 0.3;
  const shouldUnlock = artRandom < artChance;

  // 使用 Set 跟踪本次处理中已解锁的功法，避免重复
  const unlockedInThisRun = new Set<string>();

  if (shouldUnlock) {
    const availableArts = CULTIVATION_ARTS.filter(art => {
      // 排除已学习的功法
      if (newArts.includes(art.id)) return false;
      // 排除已解锁的功法（避免重复解锁）
      if (newUnlockedArts.includes(art.id)) return false;
      // 排除本次运行中已解锁的功法
      if (unlockedInThisRun.has(art.id)) return false;
      const artRealmIdx = REALM_ORDER.indexOf(art.realmRequirement);
      const playerRealmIdx = REALM_ORDER.indexOf(prev.realm);
      return artRealmIdx >= 0 && playerRealmIdx >= artRealmIdx && (!art.sectId || art.sectId === prev.sectId);
    });
    if (availableArts.length > 0) {
      // 增加随机性：结合确定性随机数和真正的随机数选择功法
      const selectionSeed = deterministicSeed + availableArts.length;
      const deterministicSelection = Math.abs(Math.sin(selectionSeed)) % 1;
      const randomSelection = Math.random();
      const combinedSelection = deterministicSelection * 0.6 + randomSelection * 0.4;
      const artIndex = Math.floor(combinedSelection * availableArts.length);
      const randomArt = availableArts[artIndex];
      // 领悟功法只解锁，不直接学习（需要花费灵石学习）
      // 多重检查，确保不会重复添加
      if (!newUnlockedArts.includes(randomArt.id) &&
          !newArts.includes(randomArt.id) &&
          !unlockedInThisRun.has(randomArt.id)) {
        // 确保添加到解锁列表（使用数组展开，避免引用问题）
        newUnlockedArts = [...newUnlockedArts, randomArt.id];
        unlockedInThisRun.add(randomArt.id);
        newStats.artCount += 1;
        artUnlocked = true;
        triggerVisual('special', `🎉 领悟功法【${randomArt.name}】`, 'special');
        // 始终输出日志，确保玩家知道获得了功法
        addLog(`🎉 你领悟了功法【${randomArt.name}】！现在可以在功法阁中学习它了。`, 'special');

        // 开发环境调试信息
        if (import.meta.env.DEV) {
          console.log('【功法解锁】', {
            artId: randomArt.id,
            artName: randomArt.name,
            newUnlockedArts: newUnlockedArts,
            prevUnlockedArts: prev.unlockedArts,
          });
        }
      } else {
        // 如果已经解锁过，记录调试信息
        if (import.meta.env.DEV) {
          console.log('【功法解锁跳过】', {
            artId: randomArt.id,
            artName: randomArt.name,
            reason: newUnlockedArts.includes(randomArt.id) ? '已在解锁列表' :
                    newArts.includes(randomArt.id) ? '已学习' :
                    unlockedInThisRun.has(randomArt.id) ? '本次运行已解锁' : '未知',
          });
        }
      }
    } else {
      // 如果没有可用的功法，记录调试信息
      if (import.meta.env.DEV) {
        console.log('【功法解锁失败】', {
          reason: '没有可用的功法',
          availableArtsCount: availableArts.length,
          prevUnlockedArtsCount: prev.unlockedArts?.length || 0,
          prevCultivationArtsCount: prev.cultivationArts?.length || 0,
        });
      }
    }
  }

  // 灵宠奖励
  if (result.petObtained) {
    const template = PET_TEMPLATES.find(t => t.id === result.petObtained);
    if (template) {
      // 检查是否已拥有该种类的灵宠
      const hasPet = newPets.some(p => p.species === template.species);
      if (!hasPet) {
        const newPet: Pet = { id: uid(), name: getRandomPetName(template), species: template.species, level: 1, exp: 0, maxExp: 60, rarity: template.rarity, stats: { ...template.baseStats }, skills: [...template.skills], evolutionStage: 0, affection: 50 };
        newPets.push(newPet);
        newStats.petCount += 1;
        // 事件描述中已经提到了灵宠（如"你与它建立了联系"），这里不再重复提示
        // 只在事件描述中没有提到灵宠相关词汇时才添加提示
        const storyHasPet = result.story && (
          result.story.includes('灵兽') ||
          result.story.includes('灵宠') ||
          result.story.includes('建立了联系') ||
          result.story.includes('愿意跟随')
        );
        if (!storyHasPet) {
          addLog(`✨ 你获得了灵宠【${newPet.name}】！`, 'special');
        }
      } else {
        // 如果已拥有该种类的灵宠，不添加新灵宠，也不提示
        // 可以添加一个提示说明遇到了但已有同类灵宠
        addLog(`你遇到了一只${template.species}，但你已经有同类灵宠了。`, 'normal');
      }
    }
  }

  // 灵宠机缘
  if (result.petOpportunity && newPets.length > 0) {
    const targetPetId = result.petOpportunity.petId || prev.activePetId;
    const petIdx = newPets.findIndex(p => p.id === targetPetId);
    const pet = petIdx >= 0 ? { ...newPets[petIdx] } : { ...newPets[0] };
    const opp = result.petOpportunity;
    if (opp.type === 'evolution' && pet.evolutionStage < 2) {
      pet.evolutionStage += 1; pet.stats = { attack: pet.stats.attack * 3, defense: pet.stats.defense * 3, hp: pet.stats.hp * 3, speed: pet.stats.speed * 1.5 };
      addLog(`✨ 【${pet.name}】成功进化！`, 'special');
    } else if (opp.type === 'level' && opp.levelGain) {
      const gain = Math.min(opp.levelGain, 5); pet.level += gain;
      for (let i = 0; i < gain; i++) { pet.stats.attack *= 1.1; pet.stats.defense *= 1.1; pet.stats.hp *= 1.1; pet.stats.speed *= 1.05; }
      addLog(`✨ 【${pet.name}】提升了等级！`, 'special');
    } else if (opp.type === 'stats' && opp.statsBoost) {
      const b = opp.statsBoost; pet.stats.attack += b.attack || 0; pet.stats.defense += b.defense || 0; pet.stats.hp += b.hp || 0; pet.stats.speed += b.speed || 0;
      addLog(`✨ 【${pet.name}】获得机缘提升了属性！`, 'special');
    } else if (opp.type === 'exp' && opp.expGain) {
      pet.exp += opp.expGain;
      while (pet.exp >= pet.maxExp && pet.level < 100) {
        pet.exp -= pet.maxExp; pet.level += 1; pet.maxExp *= 1.5;
        pet.stats.attack *= 1.1; pet.stats.defense *= 1.1; pet.stats.hp *= 1.1; pet.stats.speed *= 1.05;
      }
      addLog(`✨ 【${pet.name}】获得了经验！`, 'special');
    }
    newPets[petIdx >= 0 ? petIdx : 0] = pet;
  }

  // 属性降低
  if (result.attributeReduction) {
    const r = result.attributeReduction;
    const totalR = (r.attack || 0) + (r.defense || 0) + (r.spirit || 0) + (r.physique || 0) + (r.speed || 0) + (r.maxHp || 0);
    const totalStats = prev.attack + prev.defense + prev.spirit + prev.physique + prev.speed + prev.maxHp;
    const maxR = totalStats * 0.15;
    const scale = totalR > maxR ? maxR / totalR : 1;

    if (r.attack) newAttack = Math.max(0, newAttack - Math.floor(Math.min(r.attack * scale, prev.attack * 0.1)));
    if (r.defense) newDefense = Math.max(0, newDefense - Math.floor(Math.min(r.defense * scale, prev.defense * 0.1)));
    if (r.spirit) newSpirit = Math.max(0, newSpirit - Math.floor(Math.min(r.spirit * scale, prev.spirit * 0.1)));
    if (r.physique) newPhysique = Math.max(0, newPhysique - Math.floor(Math.min(r.physique * scale, prev.physique * 0.1)));
    if (r.speed) newSpeed = Math.max(0, newSpeed - Math.floor(Math.min(r.speed * scale, prev.speed * 0.1)));
    if (r.maxHp) {
      // 使用实际最大血量（包含金丹法数加成等）进行计算
      const totalStats = getPlayerTotalStats(prev);
      const actualMaxHp = totalStats.maxHp;
      const red = Math.floor(Math.min(r.maxHp * scale, actualMaxHp * 0.1));
      newMaxHp = Math.max(actualMaxHp * 0.5, newMaxHp - red);
      newHp = Math.min(newHp, newMaxHp);
    }

    if (isSecretRealm) {
      const hasComp = result.itemObtained || (result.expChange || 0) > 100 * realmMultiplier || (result.spiritStonesChange || 0) > 200 * realmMultiplier;
      if (!hasComp && totalR > 0) { newExp += Math.floor(50 * realmMultiplier); newStones += Math.floor(100 * realmMultiplier); }
    }
  }

  // 天赋 (仅非秘境)
  if (!isSecretRealm && !newTalentId && Math.random() < (adventureType === 'lucky' ? 0.05 : realmName ? 0.03 : 0.02)) {
    const available = TALENTS.filter(t => t.id !== 'talent-ordinary' && t.rarity !== '仙品');
    if (available.length > 0) {
      const t = available[Math.floor(Math.random() * available.length)];
      newTalentId = t.id; newAttack += t.effects.attack || 0; newDefense += t.effects.defense || 0; newMaxHp += t.effects.hp || 0; newHp += t.effects.hp || 0; newLuck += t.effects.luck || 0;
      addLog(`🌟 你觉醒了天赋【${t.name}】！`, 'special');
    }
  }

  // 进阶材料概率
  if (Math.random() < (isSecretRealm ? 0.08 : 0.05)) {
    const m = PET_EVOLUTION_MATERIALS[Math.floor(Math.random() * PET_EVOLUTION_MATERIALS.length)];
    const idx = newInv.findIndex(i => i.name === m.name);
    if (idx >= 0) newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity + 1 };
    else newInv.push({ id: uid(), name: m.name, type: ItemType.Material, description: m.description, quantity: 1, rarity: m.rarity as ItemRarity, level: 0 });
    addLog(`🎁 你获得了灵宠进阶材料【${m.name}】！`, 'gain');
  }

  // 进阶物品获取逻辑（改为添加到背包）
  const currentRealmIndex = REALM_ORDER.indexOf(prev.realm);

  // 筑基奇物：炼气期、筑基期历练/秘境有概率获得（提高概率）
  if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
    const foundationChance = isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.06 : 0.03); // 从1-3%提高到3-8%
    if (Math.random() < foundationChance) {
      const treasures = Object.values(FOUNDATION_TREASURES);
      const availableTreasures = treasures.filter(t =>
        !t.requiredLevel || prev.realmLevel >= t.requiredLevel
      );
      if (availableTreasures.length > 0) {
        const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
        addLog(`✨ 你获得了筑基奇物【${selected.name}】！这是突破筑基期的关键物品！`, 'special');
        // 添加到背包
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'foundationTreasure',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // 天地精华：金丹期、元婴期历练/秘境有概率获得（提高概率）
  if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) && currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
    const essenceChance = isSecretRealm ? 0.06 : (adventureType === 'lucky' ? 0.05 : 0.025); // 从0.8-2%提高到2.5-6%
    if (Math.random() < essenceChance) {
      const essences = Object.values(HEAVEN_EARTH_ESSENCES);
      if (essences.length > 0) {
        const selected = essences[Math.floor(Math.random() * essences.length)];
        addLog(`✨ 你获得了天地精华【${selected.name}】！这是突破元婴期的关键物品！`, 'special');
        // 添加到背包
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'heavenEarthEssence',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // 天地之髓：元婴期、化神期历练/秘境有概率获得（元婴期概率稍低，化神期概率更高）
  const nascentSoulIndex = REALM_ORDER.indexOf(RealmType.NascentSoul);
  if (currentRealmIndex >= nascentSoulIndex) {
    // 元婴期：概率较低；化神期及以上：概率较高
    const isNascentSoul = currentRealmIndex === nascentSoulIndex;
    const marrowChance = isNascentSoul
      ? (isSecretRealm ? 0.15 : (adventureType === 'lucky' ? 0.08 : 0.08)) // 元婴期：普通8%，机缘8%，秘境15%
      : (isSecretRealm ? 0.10 : (adventureType === 'lucky' ? 0.12 : 0.08)); // 化神期及以上：普通8%，机缘12%，秘境10%
    if (Math.random() < marrowChance) {
      const marrows = Object.values(HEAVEN_EARTH_MARROWS);
      if (marrows.length > 0) {
        const selected = marrows[Math.floor(Math.random() * marrows.length)];
        addLog(`✨ 你获得了天地之髓【${selected.name}】！这是突破化神期的关键物品！`, 'special');
        // 添加到背包
        newInv.push({
          id: uid(),
          name: selected.name,
          type: ItemType.AdvancedItem,
          description: selected.description,
          quantity: 1,
          rarity: selected.rarity,
          advancedItemType: 'heavenEarthMarrow',
          advancedItemId: selected.id,
        });
      }
    }
  }

  // 规则之力：从事件模板中获取
  if (result.longevityRuleObtained) {
    const ruleId = result.longevityRuleObtained;
    const rule = LONGEVITY_RULES[ruleId];
    if (rule) {
      const currentRules = prev.longevityRules || [];
      const maxRules = prev.maxLongevityRules || 3;
      if (!currentRules.includes(ruleId) && currentRules.length < maxRules) {
        addLog(`✨ 你获得了规则之力【${rule.name}】！这是掌控天地的力量！`, 'special');
        // 添加到背包
        newInv.push({
          id: uid(),
          name: rule.name,
          type: ItemType.AdvancedItem,
          description: rule.description,
          quantity: 1,
          rarity: '仙品',
          advancedItemType: 'longevityRule',
          advancedItemId: rule.id,
        });
      } else if (currentRules.includes(ruleId)) {
        addLog(`你已经拥有规则之力【${rule.name}】。`, 'normal');
      } else if (currentRules.length >= maxRules) {
        addLog(`你已经拥有最大数量的规则之力，无法继续获得。`, 'normal');
      }
    }
  } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm)) {
    // 原有的规则之力获取逻辑（作为备用，如果事件模板没有提供，提高概率）
    const rulesChance = isSecretRealm && riskLevel === '极度危险' ? 0.12 : (adventureType === 'dao_combining_challenge' ? 0.4 : 0.02); // 提高概率
    if (Math.random() < rulesChance) {
      const rules = Object.values(LONGEVITY_RULES);
      const currentRules = prev.longevityRules || [];
      const availableRules = rules.filter(r => !currentRules.includes(r.id));
      if (availableRules.length > 0) {
        const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
        const maxRules = prev.maxLongevityRules || 3;
        if (currentRules.length < maxRules) {
          addLog(`✨ 你获得了规则之力【${selected.name}】！这是掌控天地的力量！`, 'special');
          // 添加到背包
          newInv.push({
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: '仙品',
            advancedItemType: 'longevityRule',
            advancedItemId: selected.id,
          });
        }
      }
    }
  }

  // 天地之魄：化神期及以上有额外概率遭遇（提高概率）
  const spiritSeveringIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);
  if (currentRealmIndex >= spiritSeveringIndex && !result.heavenEarthSoulEncounter) {
    // 化神期及以上：根据境界和事件类型计算概率
    const isSpiritSevering = currentRealmIndex === spiritSeveringIndex;
    const soulChance = isSpiritSevering
      ? (isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.10 : 0.05)) // 化神期：普通5%，机缘10%，秘境8%
      : (isSecretRealm ? 0.12 : (adventureType === 'lucky' ? 0.15 : 0.08)); // 化神期以上：普通8%，机缘15%，秘境12%

    if (Math.random() < soulChance) {
      // 随机选择一个天地之魄BOSS
      const bosses = Object.values(HEAVEN_EARTH_SOUL_BOSSES);
      if (bosses.length > 0) {
        const selectedBoss = bosses[Math.floor(Math.random() * bosses.length)];
        result.heavenEarthSoulEncounter = selectedBoss.id;
        result.adventureType = 'dao_combining_challenge';
        addLog(`你遇到了天地之魄【${selectedBoss.name}】！这是合道期的考验，只有击败它才能获得合道期的资格！`, 'danger');
      }
    }
  }

  // 天地之魄：从事件模板中获取，触发挑战（确保adventureType已设置）
  if (result.heavenEarthSoulEncounter) {
    const bossId = result.heavenEarthSoulEncounter;
    addLog(`你遇到了天地之魄【${HEAVEN_EARTH_SOUL_BOSSES[bossId]?.name || '未知'}】！这是合道期的考验，只有击败它才能获得合道期的资格！`, 'danger');
    // 确保adventureType设置为合道挑战类型
    if (!result.adventureType || result.adventureType !== 'dao_combining_challenge') {
      result.adventureType = 'dao_combining_challenge';
    }
    // 注意：实际战斗会在后续的战斗逻辑中处理，这里只是标记遇到了
    // 由于adventureType已经设置为'dao_combining_challenge'，战斗系统会自动识别
  }

  // 天地之魄挑战胜利：给予对应天地之魄功法（作为进阶物品显示）
  if (adventureType === 'dao_combining_challenge' && battleContext?.victory && battleContext?.bossId) {
    const bossId = battleContext.bossId;
    const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];

    if (boss) {
      // 根据bossId查找对应的天地之魄功法
      const soulArt = CULTIVATION_ARTS.find(art =>
        (art as any).isHeavenEarthSoulArt && (art as any).bossId === bossId
      );

      if (soulArt && !newUnlockedArts.includes(soulArt.id)) {
        // 添加到功法解锁列表
        newUnlockedArts.push(soulArt.id);

        // 同时作为进阶物品添加到背包（用于在进阶物品中显示）
        // 注意：功法的 hp 属性需要转换为 permanentEffect 的 maxHp
        const permanentEffect: any = {
          attack: soulArt.effects.attack,
          defense: soulArt.effects.defense,
          hp: soulArt.effects.hp,
          spirit: soulArt.effects.spirit,
          physique: soulArt.effects.physique,
          speed: soulArt.effects.speed,
          expRate: soulArt.effects.expRate,
          maxHp: soulArt.effects.hp || 0,
        };

        const soulArtItem: Item = {
          id: uid(),
          name: soulArt.name,
          type: ItemType.AdvancedItem,
          description: soulArt.description,
          quantity: 1,
          rarity: '仙品',
          isEquippable: false,
          effect: {},
          permanentEffect: permanentEffect,
          advancedItemType: 'heavenEarthEssence' as const,
          advancedItemId: soulArt.id,
        };

        // 检查是否已存在同名物品
        const existingIdx = newInv.findIndex(i => i.name === soulArt.name);
        if (existingIdx >= 0) {
          newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
        } else {
          newInv.push(soulArtItem);
        }

        addLog(`🌟 你领悟了天地之魄【${boss.name}】传授的功法【${soulArt.name}】！此功法蕴含天地之力，威力无穷！`, 'special');
        addLog(`✨ 功法已添加到进阶物品中，可以在进阶物品界面查看详情。`, 'gain');
      }
    }
  }

  // 抽奖券结算（优先处理事件模板中的抽奖券变化）
  if (result.lotteryTicketsChange !== undefined) {
    newLotteryTickets = Math.max(0, newLotteryTickets + result.lotteryTicketsChange);
    if (result.lotteryTicketsChange > 0) {
      addLog(`🎫 捡到了 ${result.lotteryTicketsChange} 张抽奖券！`, 'gain');
    }
  } else {
    // 如果事件模板没有抽奖券变化，则使用随机逻辑（5%概率）
    if (Math.random() < 0.05) {
      const count = Math.floor(Math.random() * 10) + 1;
      newLotteryTickets = Math.max(0, newLotteryTickets + count);
      addLog(`🎫 捡到了 ${count} 张抽奖券！`, 'gain');
    }
  }

  // 传承等级获取（只能通过事件模板获得，不能随机获得）
  // 如果事件模板中指定了传承等级变化，则应用
  if ((result.inheritanceLevelChange || 0) > 0) {
    const oldLevel = newInheritanceLevel;
    // 传承等级每次只能增加1级，最多到4级
    newInheritanceLevel = Math.min(4, newInheritanceLevel + 1);
    if (newInheritanceLevel > oldLevel) {
      addLog(`🌟 你获得了上古传承！传承等级提升至 ${newInheritanceLevel}！`, 'special');
    }
  }

  // 寿命流逝
  const lifespanLoss = isSecretRealm ? 1.0 : (riskLevel === '低' ? 0.3 : riskLevel === '中' ? 0.6 : riskLevel === '高' ? 1.0 : riskLevel === '极度危险' ? 1.5 : 0.4);
  newLifespan = Math.max(0, Math.min(prev.maxLifespan, newLifespan + (result.lifespanChange || 0) - lifespanLoss));

  // 灵根变化
  if (result.spiritualRootsChange) {
    const src = result.spiritualRootsChange;
    newSpiritualRoots = {
      metal: Math.min(100, Math.max(0, (newSpiritualRoots.metal || 0) + (src.metal || 0))),
      wood: Math.min(100, Math.max(0, (newSpiritualRoots.wood || 0) + (src.wood || 0))),
      water: Math.min(100, Math.max(0, (newSpiritualRoots.water || 0) + (src.water || 0))),
      fire: Math.min(100, Math.max(0, (newSpiritualRoots.fire || 0) + (src.fire || 0))),
      earth: Math.min(100, Math.max(0, (newSpiritualRoots.earth || 0) + (src.earth || 0))),
    };
  }

  // 修为灵石结算
  newExp = Math.max(0, newExp + (result.expChange || 0));
  newStones = Math.max(0, newStones + (result.spiritStonesChange || 0));

  // 计算实际最大血量（包含功法加成等）
  // 先构建更新后的玩家状态来计算实际最大血量
  const updatedPlayer = {
    ...prev,
    maxHp: newMaxHp,
    hp: newHp,
    attack: newAttack,
    defense: newDefense,
    spirit: newSpirit,
    physique: newPhysique,
    speed: newSpeed,
    cultivationArts: newArts,
    activeArtId: prev.activeArtId,
    goldenCoreMethodCount: prev.goldenCoreMethodCount,
    spiritualRoots: newSpiritualRoots,
  };
  const totalStats = getPlayerTotalStats(updatedPlayer);
  const actualMaxHp = totalStats.maxHp;

  // 计算血量变化：先按比例调整当前血量到实际最大血量（如果功法增加了最大血量）
  const baseMaxHp = newMaxHp || 1; // 避免除零
  const hpRatio = baseMaxHp > 0 ? newHp / baseMaxHp : 0; // 当前血量比例
  const adjustedHp = Math.floor(actualMaxHp * hpRatio); // 按比例调整到实际最大血量

  // 应用血量变化，使用实际最大血量作为上限
  let finalHp = adjustedHp + (result.hpChange || 0);
  finalHp = Math.max(0, Math.min(actualMaxHp, finalHp));

  // 秘境特殊处理：确保血量不为负
  if (isSecretRealm) {
    finalHp = Math.max(0, finalHp);
  }

  // 同步新学习的功法到解锁列表（确保新学习的功法也在解锁列表中）
  // 使用 Set 确保唯一性
  const finalUnlockedArtsSet = new Set(newUnlockedArts);
  newArts.forEach(id => finalUnlockedArtsSet.add(id));
  newUnlockedArts = Array.from(finalUnlockedArtsSet);

  return {
    ...prev, hp: finalHp, exp: newExp, spiritStones: newStones, inventory: newInv, cultivationArts: newArts, unlockedArts: newUnlockedArts,
    talentId: newTalentId, attack: newAttack, defense: newDefense, maxHp: newMaxHp, spirit: newSpirit, physique: newPhysique, speed: newSpeed,
    luck: newLuck, lotteryTickets: newLotteryTickets, inheritanceLevel: newInheritanceLevel, pets: newPets, statistics: newStats, lifespan: newLifespan, spiritualRoots: newSpiritualRoots, reputation: newReputation
  };
};

export async function executeAdventureCore({
  result, battleContext, petSkillCooldowns, player, setPlayer, addLog, triggerVisual, onOpenBattleModal, realmName, adventureType, riskLevel, onReputationEvent
}: ExecuteAdventureCoreProps & { riskLevel?: '低' | '中' | '高' | '极度危险'; }) {
  // Visual Effects
  const safeHpChange = result.hpChange || 0;
  if (safeHpChange < 0) {
    triggerVisual('damage', String(safeHpChange), 'text-red-500');
    document.body?.classList.add('animate-shake'); setTimeout(() => document.body?.classList.remove('animate-shake'), 500);
  } else if (safeHpChange > 0) triggerVisual('heal', `+${safeHpChange}`, 'text-emerald-400');
  if (result.eventColor === 'danger' || adventureType === 'secret_realm') triggerVisual('slash');

  // 处理追杀战斗结果（只有在追杀状态下才处理，正常挑战宗主不在这里处理）
  const isHuntBattle = adventureType === 'sect_challenge' &&
    player.sectHuntSectId &&
    player.sectHuntEndTime &&
    player.sectHuntEndTime > Date.now() &&
    player.sectId === null; // 确保不是在宗门内正常挑战
  if (isHuntBattle && battleContext && battleContext.victory) {
    const huntLevel = player.sectHuntLevel || 0;
    const huntSectId = player.sectHuntSectId;

    setPlayer((prev) => {
      if (huntLevel >= 3) {
        // 战胜宗主，成为宗主
        // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
        let sectName = player.sectHuntSectName;
        if (!sectName) {
          const sect = SECTS.find((s) => s.id === huntSectId);
          sectName = sect ? sect.name : huntSectId;
        }

        addLog(`🎉 你战胜了【${sectName}】的宗主！宗门上下无不震惊，你正式接管了宗门，成为新一代宗主！`, 'special');

        return {
          ...prev,
          sectId: huntSectId,
          sectRank: SectRank.Leader,
          sectMasterId: prev.id || 'player-leader',
          sectHuntEndTime: null, // 清除追杀状态
          sectHuntLevel: 0,
          sectHuntSectId: null,
          sectHuntSectName: null,
          sectContribution: 0,
        };
      } else {
        // 击杀宗门弟子/长老，增加追杀强度
        const newHuntLevel = Math.min(3, huntLevel + 1);
        const levelNames = ['普通弟子', '精英弟子', '长老', '宗主'];
        // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
        let sectName = player.sectHuntSectName;
        if (!sectName) {
          const sect = SECTS.find((s) => s.id === huntSectId);
          sectName = sect ? sect.name : huntSectId;
        }

        addLog(`⚠️ 你击杀了【${sectName}】的${levelNames[huntLevel]}！宗门震怒，将派出更强的追杀者！`, 'danger');

        return {
          ...prev,
          sectHuntLevel: newHuntLevel,
        };
      }
    });
  }

  // Apply Main Result
  // 根据 adventureType 判断是否为秘境
  const isSecretRealm = adventureType === 'secret_realm';
  setPlayer(prev => applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual }));

  // Events & Logs
  if (result.reputationEvent && onReputationEvent) {
    const eventTitle = result.reputationEvent.title || result.reputationEvent.text || '神秘事件';
    addLog(`📜 遇到了事件：${eventTitle}`, 'special');

    // 测试环境打印调试信息
    if (import.meta.env.DEV) {
      console.log('【声望事件触发】', {
        hasEvent: !!result.reputationEvent,
        hasCallback: !!onReputationEvent,
        event: result.reputationEvent,
        choicesCount: result.reputationEvent.choices?.length || 0,
      });
    }

    onReputationEvent(result.reputationEvent);
  } else if (result.reputationEvent && !onReputationEvent) {
    // 如果有声望事件但没有回调，记录警告
    if (import.meta.env.DEV) {
      console.warn('【声望事件警告】有声望事件但没有回调函数', result.reputationEvent);
    }
  }

  // 确保事件描述被添加到日志
  if (result.story && result.story.trim()) {
    addLog(result.story, result.eventColor || 'normal');
  } else {
    // 如果事件描述为空，添加默认日志
    addLog('你在历练途中没有遇到什么特别的事情。', 'normal');
  }

  // 添加数值变化日志（如果测试环境需要）
  if (import.meta.env.DEV && (result.expChange || result.spiritStonesChange || result.hpChange)) {
    const changes: string[] = [];
    if (result.expChange) changes.push(`修为 ${result.expChange > 0 ? '+' : ''}${result.expChange}`);
    if (result.spiritStonesChange) changes.push(`灵石 ${result.spiritStonesChange > 0 ? '+' : ''}${result.spiritStonesChange}`);
    if (result.hpChange) changes.push(`气血 ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`);
    if (changes.length > 0) {
      addLog(`📊 ${changes.join(' | ')}`, result.eventColor || 'normal');
    }
  }

  if (result.lifespanChange) addLog(result.lifespanChange > 0 ? `✨ 寿命增加 ${result.lifespanChange.toFixed(1)} 年` : `⚠️ 寿命减少 ${Math.abs(result.lifespanChange).toFixed(1)} 年`, result.lifespanChange > 0 ? 'gain' : 'danger');
  if (result.spiritualRootsChange) {
    const names: any = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    Object.entries(result.spiritualRootsChange).forEach(([k, v]) => { if (v) addLog(v > 0 ? `✨ ${names[k]}灵根提升 ${v}` : `⚠️ ${names[k]}灵根降低 ${Math.abs(v)}`, v > 0 ? 'gain' : 'danger'); });
  }

  const items = [...(result.itemsObtained || [])]; if (result.itemObtained) items.push(result.itemObtained);
  items.forEach(i => { if (i?.name) addLog(`获得物品: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });

  // 战斗弹窗延迟2秒后打开
  if (battleContext) {
    setTimeout(() => {
      onOpenBattleModal(battleContext);
    }, 2000);
  }

  // Trigger Secret Realm
  if (result.triggerSecretRealm) {
    setTimeout(() => {
      addLog(`你进入了秘境深处...`, 'special');
      // 使用事件模板库生成秘境事件
      initializeEventTemplateLibrary();
      const srTemplate = getRandomEventTemplate('secret_realm', undefined, player.realm, player.realmLevel);

      if (srTemplate) {
        // 使用实际最大血量（包含金丹法数加成等）
        const totalStats = getPlayerTotalStats(player);
        const srResult = templateToAdventureResult(srTemplate, {
          realm: player.realm,
          realmLevel: player.realmLevel,
          maxHp: totalStats.maxHp,
        });
        setPlayer(prev => applyResultToPlayer(prev, srResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
        addLog(srResult.story, srResult.eventColor);
        const srItems = [...(srResult.itemsObtained || [])]; if (srResult.itemObtained) srItems.push(srResult.itemObtained);
        srItems.forEach(i => { if (i?.name) addLog(`获得物品: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });
      } else {
        // 如果模板库为空，使用默认事件
        const defaultSrResult: AdventureResult = {
          story: '你在秘境深处探索，但没有发现什么特别的东西。',
          hpChange: 0,
          expChange: Math.floor(50 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
          spiritStonesChange: Math.floor(100 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
          eventColor: 'normal',
        };
        setPlayer(prev => applyResultToPlayer(prev, defaultSrResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
        addLog(defaultSrResult.story, defaultSrResult.eventColor);
      }
    }, 1000);
  }
}
