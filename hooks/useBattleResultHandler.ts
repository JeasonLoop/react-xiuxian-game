/**
 * 战斗结果处理 Hook
 * 处理回合制战斗结果，更新玩家状态、处理物品奖励等
 */
import type { Dispatch, SetStateAction } from 'react';
import { Item, ItemType, PlayerStats, SectRank} from '../types';
import { addItemToInventory } from '../utils/inventoryUtils';
import {
  SECT_PROMOTION_BASE_REWARDS,
  SECT_SPECIAL_REWARDS,
  SECT_MASTER_CHALLENGE_REQUIREMENTS,
  SECTS,
} from '../constants/index';
import { getPlayerTotalStats } from '../utils/statUtils';

  // 战斗结果类型（可能不包含所有字段）
interface BattleResultData {
  victory: boolean;
  hpLoss: number;
  expChange: number;
  spiritChange: number;
  adventureType?: string;
  karmaChange?: number;
  npcRelationChange?: {
    npcId: string;
    npcName: string;
    favorabilityChange: number;
    description: string;
  };
  items?: Array<{
    name: string;
    type?: string;
    description?: string;
    rarity?: string;
    isEquippable?: boolean;
    equipmentSlot?: string;
    effect?: any;
    permanentEffect?: any;
  }>;
  petSkillCooldowns?: Record<string, number>;
  playerHpBefore?: number;
  playerHpAfter?: number;
  summary?: string;
}

interface UseBattleResultHandlerParams {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  setLoading: (loading: boolean) => void;
  updateQuestProgress?: (type: string, amount?: number) => void; // 更新任务进度回调
}

/**
 * 处理战斗结果
 */
export function useBattleResultHandler({
  player,
  setPlayer,
  addLog,
  setLoading,
  updateQuestProgress,
}: UseBattleResultHandlerParams) {
  const handleBattleResult = (
    result: BattleResultData | null,
    updatedInventory?: Item[]
  ) => {
    if (!player) return;

    setLoading(false);

    if (result) {
      // 更新玩家状态
      setPlayer((prev) => {
        if (!prev) return prev;
        // 获取实际最大血量（包含功法加成等）作为上限
        const totalStats = getPlayerTotalStats(prev);
        const actualMaxHp = totalStats.maxHp;
        let newHp = Math.max(0, Math.min(actualMaxHp, prev.hp - result.hpLoss));
        let newExp = Math.max(0, prev.exp + result.expChange);
        let newSpiritStones = Math.max(
          0,
          prev.spiritStones + result.spiritChange
        );

        // 更新灵宠技能冷却（如果有）
        let newPets = [...prev.pets];
        if (result.petSkillCooldowns && prev.activePetId) {
          newPets = newPets.map((pet) => {
            if (pet.id === prev.activePetId) {
              const updatedCooldowns = { ...pet.skillCooldowns };
              Object.keys(result.petSkillCooldowns).forEach((skillId) => {
                const newCooldown = result.petSkillCooldowns![skillId];
                if (newCooldown > 0) {
                  updatedCooldowns[skillId] = Math.max(
                    updatedCooldowns[skillId] || 0,
                    newCooldown
                  );
                }
              });
              const finalCooldowns: Record<string, number> = {};
              Object.keys(updatedCooldowns).forEach((skillId) => {
                if (updatedCooldowns[skillId] > 0) {
                  finalCooldowns[skillId] = updatedCooldowns[skillId];
                }
              });
              return {
                ...pet,
                skillCooldowns:
                  Object.keys(finalCooldowns).length > 0
                    ? finalCooldowns
                    : undefined,
              };
            }
            return pet;
          });
        }

        // 更新战斗统计
        const newStatistics = { ...prev.statistics };
        if (result.victory) {
          newStatistics.killCount += 1;
          // 更新击杀任务进度
          if (updateQuestProgress) {
            updateQuestProgress('kill', 1);
          }
        }
        let newUnlockedArts = [...(prev.unlockedArts || [])];
        let hasNewArt = false;
        if (hasNewArt) {
          newStatistics.artCount = (newStatistics.artCount || 0) + 1;
        }

        // 处理物品奖励
        let newInventory = updatedInventory || prev.inventory;


        if (result.victory && result.items && result.items.length > 0) {
          result.items.forEach((itemData: any) => {
            // 特殊处理：天地之魄功法（进阶物品）
            if (itemData.type === '进阶物品' && itemData.advancedItemType === 'soulArt' && itemData.advancedItemId) {
              if (!newUnlockedArts.includes(itemData.advancedItemId) &&
                  !prev.cultivationArts.includes(itemData.advancedItemId)) {
                newUnlockedArts.push(itemData.advancedItemId);
                hasNewArt = true;
                addLog(`✨ 你领悟了天地之魄传授的秘法：【${itemData.name}】！`, 'special');
              }
            } else {
              // 普通物品进入背包
              newInventory = addItemToInventory(newInventory, itemData);
              addLog(`获得 ${itemData.name}！`, 'gain');
            }

            // 更新收集任务进度
            if (updateQuestProgress) {
              updateQuestProgress('collect', 1);
            }
          });
        }

        const hasItems = result.items && result.items.length > 0;
        const itemsText = hasItems
          ? `获得物品：${result.items.map((item) => item.name).join('，')}`
          : '';

        const rewardText = result.victory
          ? `战斗胜利！获得 ${result.expChange} 修为，${result.spiritChange} 灵石。${itemsText}`
          : `战斗失败，损失 ${result.hpLoss} 点气血。`;

        addLog(rewardText, result.victory ? 'gain' : 'danger');

        // 处理因果和 NPC 关系变化
        let newKarma = (prev.karma || 0) + (result.karmaChange || 0);
        let newSocialRelations = [...(prev.socialRelations || [])];

        if (result.npcRelationChange) {
          const { npcId, npcName, favorabilityChange, description } = result.npcRelationChange;
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

          const changeType = favorabilityChange > 0 ? '增加' : '降低';
          addLog(`✨ 你与【${npcName}】的关系${changeType}了 ${Math.abs(favorabilityChange)} 点！`, favorabilityChange > 0 ? 'gain' : 'danger');
        }

        if (result.karmaChange) {
          const changeType = result.karmaChange > 0 ? '增加' : '减少';
          addLog(`✨ 你的因果值${changeType}了 ${Math.abs(result.karmaChange)} 点！`, result.karmaChange > 0 ? 'gain' : 'danger');
        }

        // 特殊处理：宗主挑战结果
        let newSectRank = prev.sectRank;
        let finalSectMasterId = prev.sectMasterId;
        let finalSectContribution = prev.sectContribution;

        // 特殊处理：天地之魄挑战结果
        let newDaoCombiningChallenged = prev.daoCombiningChallenged;
        if (result.adventureType === 'dao_combining_challenge' && result.victory) {
          newDaoCombiningChallenged = true;
          addLog('✨ 你成功挑战了天地之魄，获得了合道期的资格！', 'special');
        }

        // 处理追杀战斗结果（只有在追杀状态下才处理，正常挑战宗主不在这里处理）
        const isHuntBattle = result.adventureType === 'sect_challenge' &&
          prev.sectHuntSectId &&
          prev.sectHuntEndTime &&
          prev.sectHuntEndTime > Date.now() &&
          prev.sectId === null; // 确保不是在宗门内正常挑战

        if (isHuntBattle && result.victory) {
          const huntLevel = prev.sectHuntLevel || 0;
          const huntSectId = prev.sectHuntSectId;

          if (huntLevel >= 3) {
            // 战胜宗主，成为宗主
            // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
            let sectName = SECTS.find((s) => s.id === huntSectId)?.name || huntSectId || prev.sectHuntSectName;
            if (!sectName) {
              sectName = SECTS.find((s) => s.id === huntSectId)?.name || huntSectId;
            }

            addLog(`🎉 你战胜了【${sectName}】的宗主！宗门上下无不震惊，你正式接管了宗门，成为新一代宗主！`, 'special');

            newSectRank = SectRank.Leader;
            finalSectMasterId = prev.id || 'player-leader';
            finalSectContribution = 0;

            return {
              ...prev,
              hp: newHp,
              exp: newExp,
              spiritStones: newSpiritStones,
              statistics: newStatistics,
              inventory: newInventory,
              pets: newPets,
              sectId: huntSectId,
              sectRank: newSectRank,
              sectMasterId: finalSectMasterId,
              sectContribution: finalSectContribution,
              sectHuntEndTime: null, // 清除追杀状态
              sectHuntLevel: 0,
              sectHuntSectId: null,
              sectHuntSectName: null,
              daoCombiningChallenged: newDaoCombiningChallenged,
              unlockedArts: newUnlockedArts,
            };
          } else {
            // 击杀宗门弟子/长老，增加追杀强度
            const newHuntLevel = Math.min(3, huntLevel + 1);
            const levelNames = ['普通弟子', '精英弟子', '长老', '宗主'];
            // 优先使用保存的宗门名称，否则从SECTS中查找，最后使用ID
            let sectName = prev.sectHuntSectName;
            if (!sectName) {
              const sect = SECTS.find((s) => s.id === huntSectId);
              sectName = sect ? sect.name : huntSectId;
            }

            addLog(`⚠️ 你击杀了【${sectName}】的${levelNames[huntLevel]}！宗门震怒，将派出更强的追杀者！`, 'danger');

            return {
              ...prev,
              hp: newHp,
              exp: newExp,
              spiritStones: newSpiritStones,
              statistics: newStatistics,
              inventory: newInventory,
              pets: newPets,
              sectRank: newSectRank,
              sectMasterId: finalSectMasterId,
              sectContribution: finalSectContribution,
              sectHuntLevel: newHuntLevel,
              daoCombiningChallenged: newDaoCombiningChallenged,
              unlockedArts: newUnlockedArts,
            };
          }
        }

        // 正常挑战宗主的逻辑（只有在宗门内且是长老时才处理）
        if (result.adventureType === 'sect_challenge' && prev.sectId && prev.sectRank === SectRank.Elder) {
          if (result.victory) {
            newSectRank = SectRank.Leader;
            finalSectMasterId = prev.id || 'player-leader';
            finalSectContribution += SECT_PROMOTION_BASE_REWARDS[SectRank.Leader].contribution;

            const baseReward = SECT_PROMOTION_BASE_REWARDS[SectRank.Leader];
            const specialReward = SECT_SPECIAL_REWARDS[prev.sectId || '']?.[SectRank.Leader] || { items: [] };

            // 额外奖励修为、灵石（注意：这里是叠加在战斗奖励之上的晋升奖励）
            newExp += baseReward.exp;
            newSpiritStones += baseReward.spiritStones;

            // 额外奖励物品
            if (specialReward.items) {
              specialReward.items.forEach((item) => {
                newInventory = addItemToInventory(newInventory, {
                  name: item.name,
                  type: ItemType.Material,
                  rarity: '仙品',
                }, item.quantity);
              });
            }

            addLog('恭喜！你战胜了上代宗主，正式接管宗门，成为新一代【宗主】！', 'special');
            addLog(`获得接任奖励：${baseReward.exp} 修为、${baseReward.spiritStones} 灵石、${baseReward.contribution} 宗门贡献。`, 'gain');
          } else if (!result.victory) {
            // 挑战失败，扣除贡献
            const contributionLoss = SECT_MASTER_CHALLENGE_REQUIREMENTS.defeatPenalty.contributionLoss;
            finalSectContribution = Math.max(0, prev.sectContribution - contributionLoss);

            // 额外扣除气血（禁地反噬）
            const extraHpLoss = Math.floor(prev.hp * SECT_MASTER_CHALLENGE_REQUIREMENTS.defeatPenalty.hpLossPercent);
            newHp = Math.max(0, newHp - extraHpLoss);
            newExp = Math.max(0, prev.exp + result.expChange); // result.expChange 已经是负值

            addLog(`挑战失败，你被宗主重伤，不仅损失了修为，宗门声望也一落千丈。`, 'danger');
            addLog(`损失了 ${contributionLoss} 宗门贡献及大量气血。`, 'danger');
          }
        }

        return {
          ...prev,
          hp: newHp,
          exp: newExp,
          spiritStones: newSpiritStones,
          statistics: newStatistics,
          inventory: newInventory,
          pets: newPets,
          sectRank: newSectRank,
          sectMasterId: finalSectMasterId,
          sectContribution: finalSectContribution,
          daoCombiningChallenged: newDaoCombiningChallenged,
          unlockedArts: newUnlockedArts,
          karma: newKarma,
          socialRelations: newSocialRelations,
        };
      });
    }
  };

  return { handleBattleResult };
}

