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
  LONGEVITY_RULES,
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

/**
 * 为装备添加属性（如果装备没有属性，根据品阶自动生成）
 */
function ensureEquipmentAttributes(
  itemType: ItemType,
  effect: AdventureResult['itemObtained']['effect'] | undefined,
  rarity: ItemRarity,
  realm?: RealmType,
  realmLevel?: number
): AdventureResult['itemObtained']['effect'] | undefined {
  const equipmentTypes = [
    ItemType.Artifact,
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Accessory,
    ItemType.Ring,
  ];

  if (!equipmentTypes.includes(itemType)) return effect;

  let processedEffect = effect;
  if (processedEffect?.exp) {
    const { exp, ...restEffect } = processedEffect;
    processedEffect = restEffect;
  }

  let realmData = (realm && REALM_DATA[realm]) || REALM_DATA[RealmType.QiRefining];
  const level = realmLevel || 1;
  const levelMultiplier = 1 + (level - 1) * 0.05;

  const rarityPercentages: Record<ItemRarity, { min: number; max: number }> = {
    普通: { min: 0.08, max: 0.12 },
    稀有: { min: 0.20, max: 0.30 },
    传说: { min: 0.40, max: 0.60 },
    史诗: { min: 0.80, max: 1.00 },
    仙品: { min: 1.20, max: 1.80 },
  };

  const rarityMinStats: Record<ItemRarity, { attack: number; defense: number; hp: number; spirit: number; physique: number; speed: number }> = {
    普通: { attack: 1, defense: 1, hp: 5, spirit: 1, physique: 1, speed: 1 },
    稀有: { attack: 5, defense: 3, hp: 20, spirit: 3, physique: 3, speed: 3 },
    传说: { attack: 15, defense: 10, hp: 50, spirit: 10, physique: 10, speed: 10 },
    史诗: { attack: 50, defense: 30, hp: 150, spirit: 30, physique: 30, speed: 25 },
    仙品: { attack: 200, defense: 150, hp: 500, spirit: 100, physique: 100, speed: 80 },
  };

  const percentage = rarityPercentages[rarity] || rarityPercentages['普通'];
  const targetPercentage = percentage.min + (percentage.max - percentage.min) * Math.random();
  const minStats = rarityMinStats[rarity] || rarityMinStats['普通'];

  const hasAnyAttribute = processedEffect && (
    processedEffect.attack || processedEffect.defense || processedEffect.hp ||
    processedEffect.spirit || processedEffect.physique || processedEffect.speed
  );

  if (!hasAnyAttribute || (processedEffect && (
    (processedEffect.attack && processedEffect.attack < minStats.attack) ||
    (processedEffect.defense && processedEffect.defense < minStats.defense) ||
    (processedEffect.hp && processedEffect.hp < minStats.hp) ||
    (processedEffect.spirit && processedEffect.spirit < minStats.spirit) ||
    (processedEffect.physique && processedEffect.physique < minStats.physique) ||
    (processedEffect.speed && processedEffect.speed < minStats.speed)
  ))) {
    const attributeTypes = ['attack', 'defense', 'hp', 'spirit', 'physique', 'speed'];
    const numAttributes = Math.floor(Math.random() * 3) + 1;
    const selectedAttributes = attributeTypes.sort(() => Math.random() - 0.5).slice(0, numAttributes);

    const newEffect: any = {};
    if (processedEffect) {
      if (processedEffect.attack >= minStats.attack) newEffect.attack = processedEffect.attack;
      if (processedEffect.defense >= minStats.defense) newEffect.defense = processedEffect.defense;
      if (processedEffect.hp >= minStats.hp) newEffect.hp = processedEffect.hp;
      if (processedEffect.spirit >= minStats.spirit) newEffect.spirit = processedEffect.spirit;
      if (processedEffect.physique >= minStats.physique) newEffect.physique = processedEffect.physique;
      if (processedEffect.speed >= minStats.speed) newEffect.speed = processedEffect.speed;
    }

    selectedAttributes.forEach((attr) => {
      if (newEffect[attr] !== undefined) return;
      let baseValue = 0;
      if (attr === 'attack') baseValue = realmData.baseAttack;
      else if (attr === 'defense') baseValue = realmData.baseDefense;
      else if (attr === 'hp') baseValue = realmData.baseMaxHp;
      else if (attr === 'spirit') baseValue = realmData.baseSpirit;
      else if (attr === 'physique') baseValue = realmData.basePhysique;
      else if (attr === 'speed') baseValue = realmData.baseSpeed;

      const value = Math.floor(baseValue * targetPercentage * levelMultiplier);
      newEffect[attr] = Math.max(minStats[attr as keyof typeof minStats], value);
    });

    return newEffect;
  }

  return processedEffect;
}

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
  let newUnlockedArts = [...(prev.unlockedArts || [])];

  // 修复同步解锁功法
  prev.cultivationArts.forEach(id => { if (!newUnlockedArts.includes(id)) newUnlockedArts.push(id); });

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
    try {
      if (!itemData?.name) return;
      let itemName = itemData.name.trim();
      let itemType = (itemData.type as ItemType) || ItemType.Material;
      let isEquippable = !!itemData.isEquippable;
      let equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;

      // 神秘法宝处理
      if (itemName.includes('神秘') || itemName.includes('法宝')) {
        const artifactNames = ['青莲剑', '紫霄钟', '玄天镜', '九幽塔', '太虚鼎', '阴阳扇', '星辰珠', '混沌印', '天机盘', '轮回笔'];
        itemName = artifactNames[Math.floor(Math.random() * artifactNames.length)];
        itemType = ItemType.Artifact; isEquippable = true;
        equipmentSlot = Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2;
      }

      // 类型推断
      const inferred = inferItemTypeAndSlot(itemName, itemType, itemData.description || '', isEquippable);
      if (inferred.type !== itemType || (!equipmentSlot && inferred.equipmentSlot)) {
        itemType = inferred.type; isEquippable = inferred.isEquippable; equipmentSlot = inferred.equipmentSlot || equipmentSlot;
      }

      // 效果规范化
      // 对于高级丹药，根据名称推断稀有度（如果未设置或设置为普通）
      let itemRarity = (itemData.rarity as ItemRarity) || '普通';
      if (itemType === ItemType.Pill && itemRarity === '普通') {
        // 根据丹药名称推断稀有度
        const name = itemName.toLowerCase();
        if (name.includes('真仙') || name.includes('仙丹') || name.includes('九转') || name.includes('天元') || name.includes('不死')) {
          itemRarity = '仙品';
        } else if (name.includes('仙灵') || name.includes('破境') || name.includes('龙血') || name.includes('五行') || name.includes('天灵根')) {
          itemRarity = '传说';
        } else if (name.includes('筑基') || name.includes('洗髓') || name.includes('凝神') || name.includes('强体')) {
          itemRarity = '稀有';
        }
      }
      const normalized = normalizeItemEffect(itemName, itemData.effect, itemData.permanentEffect, itemType, itemRarity);
      let finalEffect = normalized.effect;
      let finalPermanentEffect = normalized.permanentEffect;

      // 装备不应该有永久效果，如果有则转换为临时效果（effect）
      if (isEquippable && finalPermanentEffect) {
        // 将 permanentEffect 的属性合并到 effect 中
        if (!finalEffect) {
          finalEffect = {};
        }
        if (finalPermanentEffect.attack) finalEffect.attack = (finalEffect.attack || 0) + finalPermanentEffect.attack;
        if (finalPermanentEffect.defense) finalEffect.defense = (finalEffect.defense || 0) + finalPermanentEffect.defense;
        if (finalPermanentEffect.spirit) finalEffect.spirit = (finalEffect.spirit || 0) + finalPermanentEffect.spirit;
        if (finalPermanentEffect.physique) finalEffect.physique = (finalEffect.physique || 0) + finalPermanentEffect.physique;
        if (finalPermanentEffect.speed) finalEffect.speed = (finalEffect.speed || 0) + finalPermanentEffect.speed;
        if (finalPermanentEffect.maxHp) finalEffect.hp = (finalEffect.hp || 0) + finalPermanentEffect.maxHp;
        // 装备不应该有永久效果
        finalPermanentEffect = undefined;
      }

      if (isEquippable) {
        finalEffect = ensureEquipmentAttributes(itemType, finalEffect, itemRarity, prev.realm, prev.realmLevel);
        if (finalEffect) finalEffect = adjustEquipmentStatsByRealm(finalEffect, prev.realm, prev.realmLevel, itemRarity);
      }

      // 重名装备处理
      if (isEquippable && equipmentSlot) {
        let baseName = itemName;
        const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
        let attempts = 0;
        while ((newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName)) && attempts < suffixes.length) {
          itemName = baseName + suffixes[attempts++];
        }
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
        newInv.push({ id: uid(), name: itemName, type: itemType, description: itemData.description, quantity: 1, rarity: itemRarity, level: 0, isEquippable, equipmentSlot, effect: finalEffect, permanentEffect: equipmentPermanentEffect, recipeData, reviveChances });
      }
    } catch (e) { console.error('Item processing error:', e); }
  });

  // 功法概率
  const artChance = isSecretRealm ? 0.10 : (adventureType === 'lucky' ? 0.15 : 0.05);
  let artUnlocked = false;
  if (Math.random() < artChance) {
    const availableArts = CULTIVATION_ARTS.filter(art => {
      // 排除已学习的功法
      if (newArts.includes(art.id)) return false;
      // 排除已解锁的功法（避免重复解锁）
      if (newUnlockedArts.includes(art.id)) return false;
      const artRealmIdx = REALM_ORDER.indexOf(art.realmRequirement);
      const playerRealmIdx = REALM_ORDER.indexOf(prev.realm);
      return artRealmIdx >= 0 && playerRealmIdx >= artRealmIdx && (!art.sectId || art.sectId === prev.sectId);
    });
    if (availableArts.length > 0) {
      const randomArt = availableArts[Math.floor(Math.random() * availableArts.length)];
      // 领悟功法只解锁，不直接学习（需要花费灵石学习）
      if (!newUnlockedArts.includes(randomArt.id)) {
        newUnlockedArts.push(randomArt.id);
        newStats.artCount += 1;
        artUnlocked = true;
        triggerVisual('special', `🎉 领悟功法【${randomArt.name}】`, 'special');
        addLog(`🎉 你领悟了功法【${randomArt.name}】！现在可以在功法阁中学习它了。`, 'special');
      }
    }
  }

  // 灵宠奖励
  if (result.petObtained) {
    const template = PET_TEMPLATES.find(t => t.id === result.petObtained);
    if (template && !newPets.some(p => p.species === template.species)) {
      const newPet: Pet = { id: uid(), name: getRandomPetName(template), species: template.species, level: 1, exp: 0, maxExp: 60, rarity: template.rarity, stats: { ...template.baseStats }, skills: [...template.skills], evolutionStage: 0, affection: 50 };
      newPets.push(newPet); newStats.petCount += 1;
      addLog(`✨ 你获得了灵宠【${newPet.name}】！`, 'special');
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
      const red = Math.floor(Math.min(r.maxHp * scale, prev.maxHp * 0.1));
      newMaxHp = Math.max(prev.maxHp * 0.5, newMaxHp - red); newHp = Math.min(newHp, newMaxHp);
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

  // 进阶物品获取逻辑
  const currentRealmIndex = REALM_ORDER.indexOf(prev.realm);
  let newFoundationTreasure = prev.foundationTreasure;
  let newHeavenEarthEssence = prev.heavenEarthEssence;
  let newHeavenEarthMarrow = prev.heavenEarthMarrow;
  let newLongevityRules = [...(prev.longevityRules || [])];

  // 筑基奇物：炼气期、筑基期历练/秘境有概率获得
  if (!prev.foundationTreasure && (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation))) {
    const foundationChance = isSecretRealm ? 0.03 : (adventureType === 'lucky' ? 0.02 : 0.01);
    if (Math.random() < foundationChance) {
      const treasures = Object.values(FOUNDATION_TREASURES);
      const availableTreasures = treasures.filter(t =>
        !t.requiredLevel || prev.realmLevel >= t.requiredLevel
      );
      if (availableTreasures.length > 0) {
        const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
        addLog(`✨ 你获得了筑基奇物【${selected.name}】！这是突破筑基期的关键物品！`, 'special');
        newFoundationTreasure = selected.id;
      }
    }
  }

  // 天地精华：金丹期、元婴期历练/秘境有概率获得
  if (!prev.heavenEarthEssence && (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) && currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul))) {
    const essenceChance = isSecretRealm ? 0.02 : (adventureType === 'lucky' ? 0.015 : 0.008);
    if (Math.random() < essenceChance) {
      const essences = Object.values(HEAVEN_EARTH_ESSENCES);
      if (essences.length > 0) {
        const selected = essences[Math.floor(Math.random() * essences.length)];
        addLog(`✨ 你获得了天地精华【${selected.name}】！这是突破元婴期的关键物品！`, 'special');
        newHeavenEarthEssence = selected.id;
      }
    }
  }

  // 天地之髓：化神期历练/秘境有概率获得
  if (!prev.heavenEarthMarrow && currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering)) {
    const marrowChance = isSecretRealm ? 0.015 : (adventureType === 'lucky' ? 0.01 : 0.005);
    if (Math.random() < marrowChance) {
      const marrows = Object.values(HEAVEN_EARTH_MARROWS);
      if (marrows.length > 0) {
        const selected = marrows[Math.floor(Math.random() * marrows.length)];
        addLog(`✨ 你获得了天地之髓【${selected.name}】！这是突破化神期的关键物品！`, 'special');
        newHeavenEarthMarrow = selected.id;
      }
    }
  }

  // 规则之力：长生境特殊挑战/终极奖励
  if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm)) {
    const rulesChance = isSecretRealm && riskLevel === '极度危险' ? 0.05 : (adventureType === 'dao_combining_challenge' ? 0.3 : 0);
    if (Math.random() < rulesChance) {
      const rules = Object.values(LONGEVITY_RULES);
      const currentRules = prev.longevityRules || [];
      const availableRules = rules.filter(r => !currentRules.includes(r.id));
      if (availableRules.length > 0) {
        const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
        const maxRules = prev.maxLongevityRules || 3;
        if (currentRules.length < maxRules) {
          addLog(`✨ 你获得了规则之力【${selected.name}】！这是掌控天地的力量！`, 'special');
          newLongevityRules.push(selected.id);
        }
      }
    }
  }

  // 抽奖券与传承（如果AI没有生成抽奖券变化，则使用随机逻辑）
  if (result.lotteryTicketsChange === undefined && Math.random() < 0.05) {
    const count = Math.floor(Math.random() * 10) + 1;
    newLotteryTickets += count;
    addLog(`🎫 捡到了 ${count} 张抽奖券！`, 'gain');
  }
  const inheritanceChance = isSecretRealm ? 0.005 : (adventureType === 'lucky' ? 0.01 : 0.001);
  if (Math.random() < inheritanceChance || (result.inheritanceLevelChange || 0) > 0) {
    const oldLevel = newInheritanceLevel; newInheritanceLevel = Math.min(4, newInheritanceLevel + (Math.floor(Math.random() * 4) + 1));
    if (newInheritanceLevel > oldLevel) addLog(`🌟 你获得了上古传承！`, 'special');
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

  // 抽奖券结算（处理AI生成的lotteryTicketsChange）
  if (result.lotteryTicketsChange !== undefined) {
    newLotteryTickets = Math.max(0, newLotteryTickets + result.lotteryTicketsChange);
    if (result.lotteryTicketsChange > 0) {
      addLog(`🎫 捡到了 ${result.lotteryTicketsChange} 张抽奖券！`, 'gain');
    }
  }

  // 修为灵石结算
  newExp = Math.max(0, newExp + (result.expChange || 0));
  newStones = Math.max(0, newStones + (result.spiritStonesChange || 0));
  const finalHp = isSecretRealm ? Math.max(0, Math.min(newMaxHp, newHp + (result.hpChange || 0))) : Math.min(newMaxHp, newHp + (result.hpChange || 0));

  // 同步新领悟的功法
  newArts.forEach(id => { if (!newUnlockedArts.includes(id)) newUnlockedArts.push(id); });

  return {
    ...prev, hp: finalHp, exp: newExp, spiritStones: newStones, inventory: newInv, cultivationArts: newArts, unlockedArts: newUnlockedArts,
    talentId: newTalentId, attack: newAttack, defense: newDefense, maxHp: newMaxHp, spirit: newSpirit, physique: newPhysique, speed: newSpeed,
    luck: newLuck, lotteryTickets: newLotteryTickets, inheritanceLevel: newInheritanceLevel, pets: newPets, statistics: newStats, lifespan: newLifespan, spiritualRoots: newSpiritualRoots, reputation: newReputation,
    foundationTreasure: newFoundationTreasure, heavenEarthEssence: newHeavenEarthEssence, heavenEarthMarrow: newHeavenEarthMarrow, longevityRules: newLongevityRules,
    marrowRefiningProgress: newHeavenEarthMarrow && !prev.heavenEarthMarrow ? 0 : prev.marrowRefiningProgress,
    marrowRefiningSpeed: newHeavenEarthMarrow && !prev.heavenEarthMarrow ? 1.0 : prev.marrowRefiningSpeed
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

  // Apply Main Result
  setPlayer(prev => applyResultToPlayer(prev, result, { isSecretRealm: false, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual }));

  // Events & Logs
  if (result.reputationEvent && onReputationEvent) {
    const eventTitle = result.reputationEvent.title || result.reputationEvent.text || '神秘事件';
    addLog(`📜 遇到了事件：${eventTitle}`, 'special');
    onReputationEvent(result.reputationEvent);
  }
  addLog(result.story, result.eventColor);

  if (result.lifespanChange) addLog(result.lifespanChange > 0 ? `✨ 寿命增加 ${result.lifespanChange.toFixed(1)} 年` : `⚠️ 寿命减少 ${Math.abs(result.lifespanChange).toFixed(1)} 年`, result.lifespanChange > 0 ? 'gain' : 'danger');
  if (result.spiritualRootsChange) {
    const names: any = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
    Object.entries(result.spiritualRootsChange).forEach(([k, v]) => { if (v) addLog(v > 0 ? `✨ ${names[k]}灵根提升 ${v}` : `⚠️ ${names[k]}灵根降低 ${Math.abs(v)}`, v > 0 ? 'gain' : 'danger'); });
  }

  const items = [...(result.itemsObtained || [])]; if (result.itemObtained) items.push(result.itemObtained);
  items.forEach(i => { if (i?.name) addLog(`获得物品: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });

  if (battleContext) onOpenBattleModal(battleContext);

  // Trigger Secret Realm
  if (result.triggerSecretRealm) {
    setTimeout(async () => {
      addLog(`你进入了秘境深处...`, 'special');
      const srResult = await generateAdventureEvent(player, 'secret_realm');
      setPlayer(prev => applyResultToPlayer(prev, srResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
      addLog(srResult.story, srResult.eventColor);
      const srItems = [...(srResult.itemsObtained || [])]; if (srResult.itemObtained) srItems.push(srResult.itemObtained);
      srItems.forEach(i => { if (i?.name) addLog(`获得物品: ${normalizeRarityValue(i.rarity) ? `【${normalizeRarityValue(i.rarity)}】` : ''}${i.name}`, 'gain'); });
    }, 1000);
  }
}
