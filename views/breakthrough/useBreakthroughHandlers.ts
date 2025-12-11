import React from 'react';
import { PlayerStats, RealmType } from '../../types';
import { REALM_DATA, CULTIVATION_ARTS, TALENTS, TITLES, calculateSpiritualRootArtBonus } from '../../constants';
import { getItemStats } from '../../utils/itemUtils';
import { generateBreakthroughFlavorText } from '../../services/aiService';

interface UseBreakthroughHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

/**
 * 突破处理函数
 * 包含突破、使用传承
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param setLoading 设置加载状态
 * @param loading 加载状态
 * @returns handleBreakthrough 突破
 * @returns handleUseInheritance 使用传承
 */
export function useBreakthroughHandlers({
  player,
  setPlayer,
  addLog,
  setLoading,
  loading,
}: UseBreakthroughHandlersProps) {
  const handleBreakthrough = async () => {
    if (loading || !player) return;

    const isRealmUpgrade = player.realmLevel >= 9;
    const successChance = isRealmUpgrade ? 0.6 : 0.9;
    const roll = Math.random();

    if (roll < successChance) {
      setLoading(true);
      const nextLevel = isRealmUpgrade ? 1 : player.realmLevel + 1;

      let nextRealm = player.realm;
      if (isRealmUpgrade) {
        const realms = Object.values(RealmType);
        const currentIndex = realms.indexOf(player.realm);
        if (currentIndex < realms.length - 1) {
          nextRealm = realms[currentIndex + 1];
        }
      }

      const realmText = isRealmUpgrade ? nextRealm : `${player.realm} 第 ${nextLevel} 层`;
      // 传递目标境界用于选择描述模板（如果是境界升级则用新境界，否则用当前境界）
      const targetRealmForDescription = isRealmUpgrade ? nextRealm : player.realm;
      const flavor = await generateBreakthroughFlavorText(
        realmText,
        true,
        player.name,
        targetRealmForDescription // 传递目标境界，用于选择对应的描述模板
      );
      addLog(flavor, 'special');

      setPlayer((prev) => {
        const stats = REALM_DATA[nextRealm];
        const levelMultiplier = 1 + nextLevel * 0.1;

        // 计算旧境界的基础属性（用于计算分配的属性点）
        const oldStats = REALM_DATA[prev.realm];
        const oldLevelMultiplier = 1 + prev.realmLevel * 0.1;
        const oldBaseAttack = Math.floor(oldStats.baseAttack * oldLevelMultiplier);
        const oldBaseDefense = Math.floor(oldStats.baseDefense * oldLevelMultiplier);
        const oldBaseHp = Math.floor(oldStats.baseMaxHp * oldLevelMultiplier);
        const oldBaseSpirit = Math.floor(oldStats.baseSpirit * oldLevelMultiplier);
        const oldBasePhysique = Math.floor(oldStats.basePhysique * oldLevelMultiplier);
        const oldBaseSpeed = Math.floor(oldStats.baseSpeed * oldLevelMultiplier);

        // Calculate all bonuses
        let bonusAttack = 0;
        let bonusDefense = 0;
        let bonusHp = 0;
        let bonusSpirit = 0;
        let bonusPhysique = 0;
        let bonusSpeed = 0;

        // Art bonuses (with spiritual root bonus)
        prev.cultivationArts.forEach((artId) => {
          const art = CULTIVATION_ARTS.find((a) => a.id === artId);
          if (art) {
            const spiritualRootBonus = calculateSpiritualRootArtBonus(
              art,
              prev.spiritualRoots || {
                metal: 0,
                wood: 0,
                water: 0,
                fire: 0,
                earth: 0,
              }
            );
            bonusAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
            bonusDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
            bonusHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
            bonusSpirit += Math.floor((art.effects.spirit || 0) * spiritualRootBonus);
            bonusPhysique += Math.floor((art.effects.physique || 0) * spiritualRootBonus);
            bonusSpeed += Math.floor((art.effects.speed || 0) * spiritualRootBonus);
          }
        });

        // Equipment bonuses
        Object.values(prev.equippedItems).forEach((itemId) => {
          const equippedItem = prev.inventory.find((i) => i.id === itemId);
          if (equippedItem && equippedItem.effect) {
            const isNatal = equippedItem.id === prev.natalArtifactId;
            const itemStats = getItemStats(equippedItem, isNatal);
            bonusAttack += itemStats.attack;
            bonusDefense += itemStats.defense;
            bonusHp += itemStats.hp;
            bonusSpirit += itemStats.spirit;
            bonusPhysique += itemStats.physique;
            bonusSpeed += itemStats.speed;
          }
        });

        // Talent bonuses
        const talent = TALENTS.find((t) => t.id === prev.talentId);
        if (talent) {
          bonusAttack += talent.effects.attack || 0;
          bonusDefense += talent.effects.defense || 0;
          bonusHp += talent.effects.hp || 0;
          bonusSpirit += talent.effects.spirit || 0;
          bonusPhysique += talent.effects.physique || 0;
          bonusSpeed += talent.effects.speed || 0;
        }

        // Title bonuses
        const title = TITLES.find((t) => t.id === prev.titleId);
        if (title) {
          bonusAttack += title.effects.attack || 0;
          bonusDefense += title.effects.defense || 0;
          bonusHp += title.effects.hp || 0;
          bonusSpirit += title.effects.spirit || 0;
          bonusPhysique += title.effects.physique || 0;
          bonusSpeed += title.effects.speed || 0;
        }

        // 计算用户通过属性点分配的额外属性
        // 当前属性 = 基础属性（旧境界） + 加成 + 分配的属性点
        // 分配的属性点 = 当前属性 - 基础属性（旧境界） - 加成
        const allocatedAttack = Math.max(0, prev.attack - oldBaseAttack - bonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseDefense - bonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseHp - bonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseSpirit - bonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBasePhysique - bonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseSpeed - bonusSpeed);

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);
        const newMaxExp = Math.floor(stats.maxExpBase * levelMultiplier * 1.5);
        const newBaseMaxLifespan = stats.baseMaxLifespan;

        // 计算超出当前境界的经验值，保留到下一个境界
        const excessExp = Math.max(0, prev.exp - prev.maxExp);
        const newExp = excessExp;

        // 更新统计
        const playerStats = prev.statistics || {
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

        // 突破时给予属性点：指数级别增长
        // 境界升级：2^(境界索引+1)，层数升级：2^境界索引/9 + 1
        const realms = Object.values(RealmType);
        const currentRealmIndex = realms.indexOf(isRealmUpgrade ? nextRealm : prev.realm);
        // 确保realmIndex有效，防止NaN
        const validRealmIndex = currentRealmIndex >= 0 ? currentRealmIndex : 0;
        let attributePointsGained: number;
        if (isRealmUpgrade) {
          // 境界升级：2^(新境界索引+1)
          attributePointsGained = Math.floor(Math.pow(2, validRealmIndex + 1));
        } else {
          // 层数升级：2^境界索引/9 + 1（至少1点）
          attributePointsGained = Math.max(1, Math.floor(Math.pow(2, validRealmIndex) / 9) + 1);
        }
        if (attributePointsGained > 0) {
          addLog(
            `✨ 突破成功！获得 ${attributePointsGained} 点可分配属性点！`,
            'gain'
          );
        }

        // 计算寿命增加（境界升级时增加更多）
        const lifespanIncrease = isRealmUpgrade
          ? newBaseMaxLifespan - (prev.maxLifespan || newBaseMaxLifespan)
          : Math.floor((newBaseMaxLifespan - (prev.maxLifespan || newBaseMaxLifespan)) / 9); // 层数升级时增加1/9

        const newMaxLifespan = newBaseMaxLifespan;
        const newLifespan = Math.min(
          (prev.lifespan ?? prev.maxLifespan ?? newBaseMaxLifespan) + Math.max(0, lifespanIncrease),
          newMaxLifespan
        );

        if (lifespanIncrease > 0) {
          addLog(
            `✨ 突破成功！你的寿命增加了 ${lifespanIncrease} 年！当前寿命：${Math.floor(newLifespan)}/${newMaxLifespan} 年`,
            'gain'
          );
        }

        return {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          exp: newExp, // 保留超出部分
          maxExp: newMaxExp,
          // 新属性 = 基础属性（新境界） + 加成 + 分配的属性点
          maxHp: newBaseMaxHp + bonusHp + allocatedHp,
          hp: newBaseMaxHp + bonusHp + allocatedHp, // Full heal
          attack: Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack,
          defense: Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense,
          spirit: Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit,
          physique: Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique,
          speed: Math.max(
            0,
            Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed
          ),
          attributePoints: prev.attributePoints + attributePointsGained,
          maxLifespan: newMaxLifespan,
          lifespan: newLifespan,
          statistics: {
            ...playerStats,
            breakthroughCount: playerStats.breakthroughCount + 1,
          },
        };
      });
      setLoading(false);
    } else {
      addLog('你尝试冲击瓶颈，奈何根基不稳，惨遭反噬！', 'danger');
      setPlayer((prev) => ({
        ...prev,
        exp: Math.floor(prev.exp * 0.7),
        hp: Math.floor(prev.hp * 0.5),
      }));
    }
  };

  const handleUseInheritance = () => {
    if (!player || player.inheritanceLevel <= 0) {
      addLog('你没有可用的传承！', 'danger');
      return;
    }

    setPlayer((prev) => {
      let remainingInheritance = prev.inheritanceLevel;
      let currentRealm = prev.realm;
      let currentLevel = prev.realmLevel;
      let breakthroughCount = 0;

      const maxBreakthroughs = Math.min(remainingInheritance, 4);

      for (let i = 0; i < maxBreakthroughs; i++) {
        const isRealmUpgrade = currentLevel >= 9;

        if (isRealmUpgrade) {
          const realms = Object.values(RealmType);
          const currentIndex = realms.indexOf(currentRealm);
          if (currentIndex < realms.length - 1) {
            currentRealm = realms[currentIndex + 1];
            currentLevel = 1;
            breakthroughCount++;
            remainingInheritance--;
          } else {
            break;
          }
        } else {
          currentLevel++;
          breakthroughCount++;
          remainingInheritance--;
        }
      }

      if (breakthroughCount > 0) {
        const stats = REALM_DATA[currentRealm];
        const levelMultiplier = 1 + currentLevel * 0.1;

        // 计算旧境界的基础属性（用于计算分配的属性点）
        const oldStats = REALM_DATA[prev.realm];
        const oldLevelMultiplier = 1 + prev.realmLevel * 0.1;
        const oldBaseAttack = Math.floor(oldStats.baseAttack * oldLevelMultiplier);
        const oldBaseDefense = Math.floor(oldStats.baseDefense * oldLevelMultiplier);
        const oldBaseHp = Math.floor(oldStats.baseMaxHp * oldLevelMultiplier);
        const oldBaseSpirit = Math.floor(oldStats.baseSpirit * oldLevelMultiplier);
        const oldBasePhysique = Math.floor(oldStats.basePhysique * oldLevelMultiplier);
        const oldBaseSpeed = Math.floor(oldStats.baseSpeed * oldLevelMultiplier);

        // Calculate all bonuses (similar to handleBreakthrough)
        let bonusAttack = 0;
        let bonusDefense = 0;
        let bonusHp = 0;
        let bonusSpirit = 0;
        let bonusPhysique = 0;
        let bonusSpeed = 0;

        prev.cultivationArts.forEach((artId) => {
          const art = CULTIVATION_ARTS.find((a) => a.id === artId);
          if (art) {
            const spiritualRootBonus = calculateSpiritualRootArtBonus(
              art,
              prev.spiritualRoots || {
                metal: 0,
                wood: 0,
                water: 0,
                fire: 0,
                earth: 0,
              }
            );
            bonusAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
            bonusDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
            bonusHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
            bonusSpirit += Math.floor((art.effects.spirit || 0) * spiritualRootBonus);
            bonusPhysique += Math.floor((art.effects.physique || 0) * spiritualRootBonus);
            bonusSpeed += Math.floor((art.effects.speed || 0) * spiritualRootBonus);
          }
        });

        Object.values(prev.equippedItems).forEach((itemId) => {
          const equippedItem = prev.inventory.find((i) => i.id === itemId);
          if (equippedItem && equippedItem.effect) {
            const isNatal = equippedItem.id === prev.natalArtifactId;
            const itemStats = getItemStats(equippedItem, isNatal);
            bonusAttack += itemStats.attack;
            bonusDefense += itemStats.defense;
            bonusHp += itemStats.hp;
            bonusSpirit += itemStats.spirit;
            bonusPhysique += itemStats.physique;
            bonusSpeed += itemStats.speed;
          }
        });

        const talent = TALENTS.find((t) => t.id === prev.talentId);
        if (talent) {
          bonusAttack += talent.effects.attack || 0;
          bonusDefense += talent.effects.defense || 0;
          bonusHp += talent.effects.hp || 0;
          bonusSpirit += talent.effects.spirit || 0;
          bonusPhysique += talent.effects.physique || 0;
          bonusSpeed += talent.effects.speed || 0;
        }

        const title = TITLES.find((t) => t.id === prev.titleId);
        if (title) {
          bonusAttack += title.effects.attack || 0;
          bonusDefense += title.effects.defense || 0;
          bonusHp += title.effects.hp || 0;
          bonusSpirit += title.effects.spirit || 0;
          bonusPhysique += title.effects.physique || 0;
          bonusSpeed += title.effects.speed || 0;
        }

        // 计算用户通过属性点分配的额外属性
        const allocatedAttack = Math.max(0, prev.attack - oldBaseAttack - bonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseDefense - bonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseHp - bonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseSpirit - bonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBasePhysique - bonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseSpeed - bonusSpeed);

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);
        const newMaxExp = Math.floor(stats.maxExpBase * levelMultiplier * 1.5);

        // 计算超出当前境界的经验值，保留到下一个境界
        const excessExp = Math.max(0, prev.exp - prev.maxExp);
        const newExp = excessExp;

        // 计算传承突破获得的属性点（指数级别增长）
        let attributePointsGained = 0;
        let tempRealm = prev.realm;
        let tempLevel = prev.realmLevel;
        const realms = Object.values(RealmType);
        for (let i = 0; i < breakthroughCount; i++) {
          const isRealmUpgrade = tempLevel >= 9;
          if (isRealmUpgrade) {
            const currentRealmIndex = realms.indexOf(tempRealm);
            // 确保realmIndex有效，防止NaN
            const validRealmIndex = currentRealmIndex >= 0 ? currentRealmIndex : 0;
            if (validRealmIndex < realms.length - 1) {
              const nextRealmIndex = validRealmIndex + 1;
              // 境界升级：2^(新境界索引+1)
              attributePointsGained += Math.floor(Math.pow(2, nextRealmIndex + 1));
              tempRealm = realms[nextRealmIndex];
              tempLevel = 1;
            }
          } else {
            const currentRealmIndex = realms.indexOf(tempRealm);
            // 确保realmIndex有效，防止NaN
            const validRealmIndex = currentRealmIndex >= 0 ? currentRealmIndex : 0;
            // 层数升级：2^境界索引/9 + 1（至少1点）
            attributePointsGained += Math.max(1, Math.floor(Math.pow(2, validRealmIndex) / 9) + 1);
            tempLevel++;
          }
        }

        addLog(
          `🌟 你使用了传承，连续突破了 ${breakthroughCount} 个境界！获得 ${attributePointsGained} 点属性点！`,
          'special'
        );

        return {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          exp: newExp, // 保留超出部分
          maxExp: newMaxExp,
          // 新属性 = 基础属性（新境界） + 加成 + 分配的属性点
          maxHp: newBaseMaxHp + bonusHp + allocatedHp,
          hp: newBaseMaxHp + bonusHp + allocatedHp,
          attack: Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack,
          defense: Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense,
          spirit: Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit,
          physique: Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique,
          speed: Math.max(
            0,
            Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed
          ),
          attributePoints: prev.attributePoints + attributePointsGained,
          inheritanceLevel: remainingInheritance,
        };
      }

      return prev;
    });
  };

  return {
    handleBreakthrough,
    handleUseInheritance,
  };
}
