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
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  getRandomPetName,
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
import { getAllArtifacts } from '../../utils/itemConstantsUtils';
import { normalizeRarityValue } from '../../utils/rarityUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { useUIStore } from '../../store/uiStore';

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
  skipReputationEvent?: boolean; // 是否跳过声望事件
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void;
  onPauseAutoAdventure?: () => void; // 暂停自动历练回调（用于天地之魄等特殊事件）
}

// 核心玩家状态更新逻辑 (Refactored)
// ==================== 辅助处理函数 ====================

/**
 * 处理掉落物品
 */
const processLootItems = (
  inventory: Item[],
  result: AdventureResult,
  player: PlayerStats,
): Item[] => {
  let newInv = [...inventory];
  const itemsToProcess = [...(result.itemsObtained || [])];
  if (result.itemObtained) itemsToProcess.push(result.itemObtained);

  const currentBatchNames = new Set<string>();

  itemsToProcess.forEach(itemData => {
    if (!itemData || !itemData.name) return;

    let itemName = itemData.name.trim();
    let itemType = (itemData.type as ItemType) || ItemType.Material;
    let isEquippable = !!itemData.isEquippable;
    let equipmentSlot = itemData.equipmentSlot as EquipmentSlot | undefined;

    try {
      // 1. 神秘法宝处理
      const isBasicItem = !(itemData as any).advancedItemType &&
                           !(itemData as any).advancedItemId &&
                           !(itemData as any).recipeData;

      if (isBasicItem && itemName.includes('法宝')) {
        const artifacts = getAllArtifacts();
        if (artifacts.length > 0) {
          const randomArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
          itemName = randomArtifact.name;
          itemType = randomArtifact.type;
          isEquippable = true;
          equipmentSlot = (randomArtifact.equipmentSlot as EquipmentSlot) || (Math.random() < 0.5 ? EquipmentSlot.Artifact1 : EquipmentSlot.Artifact2);
          if (randomArtifact.description) itemData.description = randomArtifact.description;
          if (randomArtifact.effect) itemData.effect = randomArtifact.effect;
          if (randomArtifact.permanentEffect) itemData.permanentEffect = randomArtifact.permanentEffect;
          if (randomArtifact.rarity) itemData.rarity = randomArtifact.rarity;
        }
      }

      // 2. 常量池信息补全与重名处理
      const itemRarity = (itemData.rarity as ItemRarity) || '普通';

      // 重名装备处理
      if (isEquippable || itemName.includes('剑') || itemName.includes('甲') || itemName.includes('环') || itemName.includes('戒')) {
        const baseName = itemName;
        const suffixes = ['·改', '·变', '·异', '·新', '·复', '·二', '·三'];
        let attempts = 0;
        while (attempts < suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) {
          itemName = baseName + suffixes[attempts++];
        }
        if (attempts >= suffixes.length && (newInv.some(i => i.name === itemName) || currentBatchNames.has(itemName))) return;
      }
      currentBatchNames.add(itemName);

      // 3. 复活次数逻辑（仅针对新装备）
      let reviveChances = (itemData as any).reviveChances;
      if (reviveChances === undefined && (itemRarity === '传说' || itemRarity === '仙品') && (itemType === ItemType.Weapon || itemType === ItemType.Artifact)) {
        if (Math.random() < (itemRarity === '传说' ? 0.3 : 0.6)) reviveChances = Math.floor(Math.random() * 3) + 1;
      }

      // 4. 调用统一的 addItemToInventory 处理逻辑（包含规范化、境界调整、叠加逻辑）
      newInv = addItemToInventory(
        newInv,
        {
          ...itemData,
          name: itemName,
          reviveChances,
        },
        1,
        { realm: player.realm, realmLevel: player.realmLevel }
      );

    } catch (e) {
      console.error('Item processing error:', e);
    }
  });

  return newInv;
};

/**
 * 处理功法领悟
 */
const handleArtUnlocks = (
  player: PlayerStats,
  result: AdventureResult,
  isSecretRealm: boolean,
  adventureType: AdventureType,
  addLog: (msg: string, type?: string) => void,
  triggerVisual: (type: string, text?: string, className?: string) => void,
): { unlockedArts: string[], artUnlocked: boolean } => {
  let newUnlockedArts = [...(player.unlockedArts || [])];
  let artUnlocked = false;

  const storyHasArtKeywords = result.story && /功法|残卷|秘籍|领悟|传授|传承/.test(result.story);
  const artChance = storyHasArtKeywords ? 0.2 : (isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.10 : 0.04));

  const storyHash = result.story ? result.story.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
  const deterministicSeed = storyHash + (player.exp || 0) + (player.spiritStones || 0);
  const artRandom = (Math.abs(Math.sin(deterministicSeed)) % 1) * 0.7 + Math.random() * 0.3;

  if (artRandom < artChance) {
    const playerRealmIdx = REALM_ORDER.indexOf(player.realm);
    const availableArts = CULTIVATION_ARTS.filter(art => {
      if (player.cultivationArts.includes(art.id) || newUnlockedArts.includes(art.id)) return false;
      const artRealmIdx = REALM_ORDER.indexOf(art.realmRequirement);
      return artRealmIdx >= 0 && playerRealmIdx >= artRealmIdx && (!art.sectId || art.sectId === player.sectId);
    });

    if (availableArts.length > 0) {
      const artIndex = Math.floor(Math.random() * availableArts.length);
      const randomArt = availableArts[artIndex];
      newUnlockedArts.push(randomArt.id);
      artUnlocked = true;
      triggerVisual('special', `🎉 领悟功法【${randomArt.name}】`, 'special');
      addLog(`🎉 你领悟了功法【${randomArt.name}】！现在可以在功法阁中学习它了。`, 'special');
    }
  }

  return { unlockedArts: newUnlockedArts, artUnlocked };
};

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

  // 1. 基础属性副本与统计更新
  let newState = { ...prev };
  const statistics = { ...(prev.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };

  statistics.adventureCount += 1;
  if (realmName || isSecretRealm) statistics.secretRealmCount += 1;
  if (battleContext?.victory) statistics.killCount += 1;

  // 2. 处理物品掉落 (调用子函数)
  newState.inventory = processLootItems(prev.inventory, result, prev);

  // 3. 处理功法领悟 (调用子函数)
  const { unlockedArts, artUnlocked } = handleArtUnlocks(prev, result, isSecretRealm, adventureType, addLog, triggerVisual);
  newState.unlockedArts = unlockedArts;
  if (artUnlocked) statistics.artCount += 1;

  // 4. 处理灵宠更新
  let newPets = [...prev.pets];
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

  if (result.petObtained) {
    const template = PET_TEMPLATES.find(t => t.id === result.petObtained);
    if (template && !newPets.some(p => p.species === template.species)) {
      const newPet: Pet = { id: uid(), name: getRandomPetName(template), species: template.species, level: 1, exp: 0, maxExp: 60, rarity: template.rarity, stats: { ...template.baseStats }, skills: [...template.skills], evolutionStage: 0, affection: 50 };
      newPets.push(newPet);
      statistics.petCount += 1;
      const storyHasPet = result.story && /灵兽|灵宠|建立了联系|愿意跟随/.test(result.story);
      if (!storyHasPet) addLog(`✨ 你获得了灵宠【${newPet.name}】！`, 'special');
    } else if (template) {
      const duplicatePet = newPets.find(p => p.species === template.species);
      if (duplicatePet) {
        newPets = newPets.map(p => (
          p.id === duplicatePet.id
            ? {
                ...p,
                exp: Math.min(p.maxExp, p.exp + 40),
                affection: Math.min(100, p.affection + 8),
              }
            : p
        ));
        addLog(`你已经拥有【${duplicatePet.name}】，这次灵宠机缘转化为亲密度 +8、经验 +40。`, 'gain');
      }
    }
  }
  newState.pets = newPets;

  // 5. 数值结算 (Exp, Stones, Hp, etc.)
  newState.exp = Math.max(0, prev.exp + (result.expChange || 0));
  newState.spiritStones = Math.max(0, prev.spiritStones + (result.spiritStonesChange || 0));
  newState.reputation = Math.max(0, (prev.reputation || 0) + (result.reputationChange || 0));
  newState.lotteryTickets = Math.max(0, prev.lotteryTickets + (result.lotteryTicketsChange || 0));
  newState.inheritanceLevel = Math.max(0, Math.min(4, prev.inheritanceLevel + (result.inheritanceLevelChange || 0)));
  newState.karma = (prev.karma || 0) + (result.karmaChange || 0);

  // 处理 NPC 关系变化
  if (result.npcRelationChange) {
    const { npcId, npcName, favorabilityChange, description } = result.npcRelationChange;
    const newSocialRelations = [...(prev.socialRelations || [])];
    const existingIndex = newSocialRelations.findIndex(r => r.id === npcId);

    if (existingIndex >= 0) {
      newSocialRelations[existingIndex] = {
        ...newSocialRelations[existingIndex],
        favorability: Math.max(-100, Math.min(100, newSocialRelations[existingIndex].favorability + favorabilityChange)),
        lastEncounterRealm: prev.realm
      };
    } else {
      newSocialRelations.push({
        id: npcId,
        name: npcName,
        favorability: favorabilityChange,
        description,
        lastEncounterRealm: prev.realm
      });
    }
    newState.socialRelations = newSocialRelations;

    const changeType = favorabilityChange > 0 ? '增加' : '降低';
    addLog(`✨ 你与【${npcName}】的关系${changeType}了 ${Math.abs(favorabilityChange)} 点！`, favorabilityChange > 0 ? 'gain' : 'danger');
  }

  if (result.karmaChange) {
    const changeType = result.karmaChange > 0 ? '增加' : '减少';
    addLog(`✨ 你的因果值${changeType}了 ${Math.abs(result.karmaChange)} 点！`, result.karmaChange > 0 ? 'gain' : 'danger');
  }

  // 寿命与灵根
  const lifespanLoss = isSecretRealm ? 1.0 : (riskLevel === '低' ? 0.3 : riskLevel === '中' ? 0.6 : riskLevel === '高' ? 1.0 : riskLevel === '极度危险' ? 1.5 : 0.4);
  newState.lifespan = Math.max(0, Math.min(prev.maxLifespan, (prev.lifespan ?? prev.maxLifespan) + (result.lifespanChange || 0) - lifespanLoss));

  if (result.spiritualRootsChange) {
    const src = result.spiritualRootsChange;
    newState.spiritualRoots = {
      metal: Math.min(100, Math.max(0, (prev.spiritualRoots.metal || 0) + (src.metal || 0))),
      wood: Math.min(100, Math.max(0, (prev.spiritualRoots.wood || 0) + (src.wood || 0))),
      water: Math.min(100, Math.max(0, (prev.spiritualRoots.water || 0) + (src.water || 0))),
      fire: Math.min(100, Math.max(0, (prev.spiritualRoots.fire || 0) + (src.fire || 0))),
      earth: Math.min(100, Math.max(0, (prev.spiritualRoots.earth || 0) + (src.earth || 0))),
    };
  }

  // 6. 处理属性降低
  if (result.attributeReduction) {
    const r = result.attributeReduction;
    const totalR = (r.attack || 0) + (r.defense || 0) + (r.spirit || 0) + (r.physique || 0) + (r.speed || 0) + (r.maxHp || 0);
    const currentTotal = prev.attack + prev.defense + prev.spirit + prev.physique + prev.speed + prev.maxHp;
    const scale = totalR > currentTotal * 0.15 ? (currentTotal * 0.15) / totalR : 1;

    if (r.attack) newState.attack = Math.max(1, prev.attack - Math.floor(r.attack * scale));
    if (r.defense) newState.defense = Math.max(1, prev.defense - Math.floor(r.defense * scale));
    if (r.spirit) newState.spirit = Math.max(1, prev.spirit - Math.floor(r.spirit * scale));
    if (r.physique) newState.physique = Math.max(1, prev.physique - Math.floor(r.physique * scale));
    if (r.speed) newState.speed = Math.max(1, prev.speed - Math.floor(r.speed * scale));
    if (r.maxHp) newState.maxHp = Math.max(10, prev.maxHp - Math.floor(r.maxHp * scale));
  }

  // 7. 计算血量 (基于 getPlayerTotalStats)
  const previousTotalStats = getPlayerTotalStats(prev);
  const previousActualMaxHp = Math.max(1, previousTotalStats.maxHp);
  const totalStats = getPlayerTotalStats(newState);
  const actualMaxHp = totalStats.maxHp;
  const hpRatio = prev.hp / previousActualMaxHp;
  const adjustedHp = Math.floor(actualMaxHp * hpRatio);

  newState.hp = Math.max(0, Math.min(actualMaxHp, adjustedHp + (result.hpChange || 0)));
  newState.statistics = statistics;

  return newState;
};


export async function executeAdventureCore({
  result, battleContext, petSkillCooldowns, player, setPlayer, addLog, triggerVisual, onOpenBattleModal, realmName, adventureType, riskLevel, skipBattle, skipReputationEvent, onReputationEvent, onPauseAutoAdventure
}: ExecuteAdventureCoreProps & { riskLevel?: '低' | '中' | '高' | '极度危险'; }) {
  // Visual Effects
  const safeHpChange = result.hpChange || 0;
  if (safeHpChange < 0) {
    triggerVisual('damage', String(safeHpChange), 'text-red-500');
    document.body?.classList.add('animate-shake'); setTimeout(() => document.body?.classList.remove('animate-shake'), 500);
  } else if (safeHpChange > 0) {
    triggerVisual('heal', `+${safeHpChange}`, 'text-emerald-400');
  }
  if (result.eventColor === 'danger' || adventureType === 'secret_realm') triggerVisual('slash');

  // Apply Main Result
  // 根据 adventureType 判断是否为秘境
  const isSecretRealm = adventureType === 'secret_realm';

  // 在应用结果之前，检查是否触发了天地之魄，如果是则立即暂停自动历练
  if ((result.adventureType === 'dao_combining_challenge' || result.heavenEarthSoulEncounter)) {
    onPauseAutoAdventure?.();
  }

  // 处理追杀战斗结果（只有在追杀状态下才处理，正常挑战宗主不在这里处理）
  // 注意：必须先应用战斗结果（包括血量变化），然后再处理追杀相关的特殊逻辑
  const isHuntBattle = adventureType === 'sect_challenge' &&
    player.sectHuntSectId &&
    player.sectHuntEndTime &&
    player.sectHuntEndTime > Date.now() &&
    player.sectId === null; // 确保不是在宗门内正常挑战

  if (isHuntBattle && battleContext && battleContext.victory) {
    const huntLevel = player.sectHuntLevel || 0;
    const huntSectId = player.sectHuntSectId;

    // 先应用战斗结果（包括血量变化），然后再更新追杀相关状态
    setPlayer((prev) => {
      // 先应用战斗结果，包括血量变化
      const updatedPlayer = applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual });

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
          ...updatedPlayer,
          sectId: huntSectId,
          sectRank: SectRank.Leader,
          sectMasterId: 'player-leader', // 玩家成为宗主时，设置为玩家标识
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
          ...updatedPlayer,
          sectHuntLevel: newHuntLevel,
        };
      }
    });
  } else {
    // 非追杀战斗或非胜利情况，直接应用结果（包括血量变化）
    setPlayer(prev => applyResultToPlayer(prev, result, { isSecretRealm, adventureType, realmName, riskLevel, battleContext, petSkillCooldowns, addLog, triggerVisual }));
  }

  // Events & Logs
  if (result.reputationEvent) {
    if (skipReputationEvent) {
      // 如果配置了跳过声望事件，只记录日志，不触发回调
      const eventTitle = result.reputationEvent.title || result.reputationEvent.text || '神秘事件';
      addLog(`📜 遇到了事件：${eventTitle}，你选择跳过...`, 'normal');
    } else if (onReputationEvent) {
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
    } else {
      // 如果有声望事件但没有回调，记录警告
      if (import.meta.env.DEV) {
        console.warn('【声望事件警告】有声望事件但没有回调函数', result.reputationEvent);
      }
    }
  }

  // 确保事件描述被添加到日志
  // 注意：如果 result 为空或未定义，也要输出默认日志
  if (result && result.story && result.story.trim()) {
    addLog(result.story, result.eventColor || 'normal');
  } else if (!result || !result.story) {
    // 如果事件描述为空或 result 为空，添加默认日志
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

  // 战斗弹窗延迟2秒后打开（如果跳过了战斗则不打开弹窗）
  const fastBattleSettlement = useUIStore.getState().fastBattleSettlement;
  if (battleContext && !skipBattle && !fastBattleSettlement) {
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
          expChange: Math.floor(200 * (1 + REALM_ORDER.indexOf(player.realm) * 0.5)),
          spiritStonesChange: Math.floor(150 * (1 + REALM_ORDER.indexOf(player.realm) * 0.5)),
          eventColor: 'normal',
        };
        setPlayer(prev => applyResultToPlayer(prev, defaultSrResult, { isSecretRealm: true, adventureType: 'secret_realm', addLog, triggerVisual }));
        addLog(defaultSrResult.story, defaultSrResult.eventColor);
      }
    }, 1000);
  }
}
