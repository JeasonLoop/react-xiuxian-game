import React from 'react';
import { PlayerStats } from '../../types';
import { REALM_DATA, REALM_ORDER } from '../../constants/index';
import { getRandomBreakthroughDescription } from '../../services/templateService';
import { getRealmIndex, calculateBreakthroughAttributePoints } from '../../utils/attributeUtils';
import { checkBreakthroughConditions, calculateGoldenCoreMethodCount } from '../../utils/cultivationUtils';
import { getPlayerTotalStats, calculatePlayerBonuses } from '../../utils/statUtils';

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
  const handleBreakthrough = async (skipSuccessCheck: boolean = false, hpLoss: number = 0) => {
    if (!player) return;
    // 注意：不再检查loading状态，允许在自动历练时触发突破
    // 突破会自己管理loading状态

    const isRealmUpgrade = player.realmLevel >= 9;

    // 如果是境界升级，检查晋升条件
    if (isRealmUpgrade) {
      const currentIndex = REALM_ORDER.indexOf(player.realm);
      if (currentIndex < REALM_ORDER.length - 1) {
        const targetRealm = REALM_ORDER[currentIndex + 1];
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);

        if (!conditionCheck.canBreakthrough) {
          addLog(conditionCheck.message, 'danger');
          return;
        }
      }
    }

    const successChance = isRealmUpgrade ? 0.6 : 0.9;

    // 如果跳过成功率检查（天劫成功后），直接执行突破
    const isSuccess = skipSuccessCheck || Math.random() < successChance;

    if (isSuccess) {
      setLoading(true);

      let nextRealm = player.realm;
      let nextLevel = player.realmLevel + 1;

      if (isRealmUpgrade) {
        const currentIndex = REALM_ORDER.indexOf(player.realm);
        if (currentIndex < REALM_ORDER.length - 1) {
          nextRealm = REALM_ORDER[currentIndex + 1];
          nextLevel = 1;
        } else {
          // 已经是最高境界且达到9层，无法再通过正常方式突破
          addLog('你已达到仙道巅峰，由于位面限制，无法再行突破！', 'special');
          setLoading(false);
          // 将经验值锁定在满值，避免反复触发
          setPlayer(prev => ({ ...prev, exp: prev.maxExp }));
          return;
        }
      }

      const realmText = isRealmUpgrade ? nextRealm : `${player.realm} 第 ${nextLevel} 层`;
      // 使用模板库生成突破描述
      const flavor = getRandomBreakthroughDescription(realmText, player.name);
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

        // 使用统一的加成计算函数
        const bonuses = calculatePlayerBonuses(prev);
        const bonusAttack = bonuses.attack;
        const bonusDefense = bonuses.defense;
        const bonusHp = bonuses.hp;
        const bonusSpirit = bonuses.spirit;
        const bonusPhysique = bonuses.physique;
        const bonusSpeed = bonuses.speed;

        // 计算旧境界时的基础属性+固定加成（用于计算分配的属性点）
        const oldBaseWithFixedBonusAttack = oldBaseAttack + bonusAttack;
        const oldBaseWithFixedBonusDefense = oldBaseDefense + bonusDefense;
        const oldBaseWithFixedBonusHp = oldBaseHp + bonusHp;
        const oldBaseWithFixedBonusSpirit = oldBaseSpirit + bonusSpirit;
        const oldBaseWithFixedBonusPhysique = oldBasePhysique + bonusPhysique;
        const oldBaseWithFixedBonusSpeed = oldBaseSpeed + bonusSpeed;

        // 计算用户通过属性点分配的额外属性
        const allocatedAttack = Math.max(0, prev.attack - oldBaseWithFixedBonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseWithFixedBonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseWithFixedBonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseWithFixedBonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBaseWithFixedBonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseWithFixedBonusSpeed);

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
        const targetRealm = isRealmUpgrade ? nextRealm : prev.realm;
        const attributePointsGained = calculateBreakthroughAttributePoints(isRealmUpgrade, targetRealm);
        if (attributePointsGained > 0) {
          addLog(
            `✨ 突破成功！获得 ${attributePointsGained} 点可分配属性点！`,
            'gain'
          );
        }

        // 计算寿命增加（更明显的驱动力：长生）
        const oldMaxLifespan = prev.maxLifespan || 100;
        let lifespanIncrease = 0;

        if (isRealmUpgrade) {
          // 境界升级：获得两个境界基础寿命差额的全额，并额外奖励基础值
          const baseIncrease = newBaseMaxLifespan - oldMaxLifespan;
          lifespanIncrease = baseIncrease + Math.floor(newBaseMaxLifespan * 0.1);
        } else {
          // 层数升级：获得差额的 1/9，并至少增加 1-5 年随机寿命，体现积少成多
          const baseIncrease = Math.floor((newBaseMaxLifespan - oldMaxLifespan) / 9);
          const bonus = Math.floor(Math.random() * 5) + 1;
          lifespanIncrease = baseIncrease + bonus;
        }

        const newMaxLifespan = oldMaxLifespan + lifespanIncrease;
        const newLifespan = (prev.lifespan ?? oldMaxLifespan) + lifespanIncrease;

        if (lifespanIncrease > 0) {
          addLog(
            `✨ 突破成功！你的寿命增加了 ${lifespanIncrease} 年！当前寿命：${Math.floor(newLifespan)}/${newMaxLifespan} 年`,
            'gain'
          );
        }

        // 先计算基础属性 + 固定加成 + 分配的属性点
        const baseAttack = Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack;
        const baseDefense = Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense;
        const baseMaxHp = newBaseMaxHp + bonusHp + allocatedHp;
        const baseSpirit = Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit;
        const basePhysique = Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique;
        const baseSpeed = Math.max(0, Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed);

        // 计算金丹法数（如果晋升到金丹期）
        let goldenCoreMethodCount = prev.goldenCoreMethodCount;
        if (isRealmUpgrade && nextRealm === '金丹期') {
          goldenCoreMethodCount = calculateGoldenCoreMethodCount(prev);
        }

        // 构建更新后的玩家状态来计算实际最大血量（包含功法加成等）
        const updatedPlayer = {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          goldenCoreMethodCount,
          activeArtId: prev.activeArtId,
          cultivationArts: prev.cultivationArts,
          spiritualRoots: prev.spiritualRoots,
        };
        const totalStats = getPlayerTotalStats(updatedPlayer);
        const actualMaxHp = totalStats.maxHp; // 实际最大血量（包含功法加成）

        return {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          exp: newExp, // 保留超出部分
          maxExp: newMaxExp,
          // 新属性 = 基础属性（新境界） + 固定加成 + 分配的属性点
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          attributePoints: prev.attributePoints + attributePointsGained,
          maxLifespan: newMaxLifespan,
          lifespan: newLifespan,
          goldenCoreMethodCount, // 设置金丹法数
          hp: Math.max(0, actualMaxHp - hpLoss), // 应用渡劫产生的扣血
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
      setLoading(false); // 突破失败时也要重置loading状态
    }
  };

  const handleUseInheritance = () => {
    setPlayer((prev) => {
      const inheritanceLevel = prev.inheritanceLevel || 0;
      if (inheritanceLevel <= 0) {
        return prev;
      }

      let breakthroughCount = inheritanceLevel;
      let remainingInheritance = 0;
      let currentRealm = prev.realm;
      let currentLevel = prev.realmLevel;

      // 计算能够突破的次数，并检查突破条件
      while (breakthroughCount > 0) {
        const currentIndex = REALM_ORDER.indexOf(currentRealm);
        if (currentLevel >= 9) {
          // 境界升级，需要检查突破条件
          if (currentIndex < REALM_ORDER.length - 1) {
            const targetRealm = REALM_ORDER[currentIndex + 1];
            const conditionCheck = checkBreakthroughConditions(prev, targetRealm);

            // 如果条件不满足，停止突破并保留剩余的传承
            if (!conditionCheck.canBreakthrough) {
              remainingInheritance = breakthroughCount;
              addLog(`传承突破中断：${conditionCheck.message}`, 'danger');
              break;
            }

            currentRealm = targetRealm;
            currentLevel = 1;
          } else {
            // 已经是最高境界，无法再突破
            remainingInheritance = breakthroughCount;
            break;
          }
        } else {
          currentLevel += 1;
        }
        breakthroughCount--;
      }

      if (remainingInheritance === inheritanceLevel) {
        addLog('你已达到仙道巅峰，无法使用传承继续突破！', 'special');
        return prev;
      }

      const actualBreakthroughCount = inheritanceLevel - remainingInheritance;

      if (actualBreakthroughCount > 0) {
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

        // 使用统一的加成计算函数
        const bonuses = calculatePlayerBonuses(prev);
        const bonusAttack = bonuses.attack;
        const bonusDefense = bonuses.defense;
        const bonusHp = bonuses.hp;
        const bonusSpirit = bonuses.spirit;
        const bonusPhysique = bonuses.physique;
        const bonusSpeed = bonuses.speed;

        // 计算旧境界时的基础属性+固定加成（用于计算分配的属性点）
        const oldBaseWithFixedBonusAttack = oldBaseAttack + bonusAttack;
        const oldBaseWithFixedBonusDefense = oldBaseDefense + bonusDefense;
        const oldBaseWithFixedBonusHp = oldBaseHp + bonusHp;
        const oldBaseWithFixedBonusSpirit = oldBaseSpirit + bonusSpirit;
        const oldBaseWithFixedBonusPhysique = oldBasePhysique + bonusPhysique;
        const oldBaseWithFixedBonusSpeed = oldBaseSpeed + bonusSpeed;

        // 计算用户通过属性点分配的额外属性
        const allocatedAttack = Math.max(0, prev.attack - oldBaseWithFixedBonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseWithFixedBonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseWithFixedBonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseWithFixedBonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBaseWithFixedBonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseWithFixedBonusSpeed);

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);
        const newMaxExp = Math.floor(stats.maxExpBase * levelMultiplier * 1.5);
        const newBaseMaxLifespan = stats.baseMaxLifespan;

        // 计算超出当前境界的经验值，保留到下一个境界
        const excessExp = Math.max(0, prev.exp - prev.maxExp);
        const newExp = excessExp;

        // 计算寿命增加（传承突破也应该增加寿命）
        const oldMaxLifespan = prev.maxLifespan || 100;
        let totalLifespanIncrease = 0;

        // 计算每次突破的寿命增加
        let tempRealmForLifespan = prev.realm;
        let tempLevelForLifespan = prev.realmLevel;
        for (let i = 0; i < actualBreakthroughCount; i++) {
          const isRealmUpgradeForLifespan = tempLevelForLifespan >= 9;
          const tempRealmIndex = REALM_ORDER.indexOf(tempRealmForLifespan);

          if (isRealmUpgradeForLifespan) {
            if (tempRealmIndex < REALM_ORDER.length - 1) {
              const nextRealmForLifespan = REALM_ORDER[tempRealmIndex + 1];
              const nextRealmStats = REALM_DATA[nextRealmForLifespan];
              const oldRealmStats = REALM_DATA[tempRealmForLifespan];
              const baseIncrease = nextRealmStats.baseMaxLifespan - oldRealmStats.baseMaxLifespan;
              totalLifespanIncrease += baseIncrease + Math.floor(nextRealmStats.baseMaxLifespan * 0.1);
              tempRealmForLifespan = nextRealmForLifespan;
              tempLevelForLifespan = 1;
            }
          } else {
            const tempRealmStats = REALM_DATA[tempRealmForLifespan];
            const baseIncrease = Math.floor((tempRealmStats.baseMaxLifespan - oldMaxLifespan) / 9);
            const bonus = Math.floor(Math.random() * 5) + 1;
            totalLifespanIncrease += baseIncrease + bonus;
            tempLevelForLifespan++;
          }
        }

        const newMaxLifespan = oldMaxLifespan + totalLifespanIncrease;
        const newLifespan = (prev.lifespan ?? oldMaxLifespan) + totalLifespanIncrease;

        // 计算传承突破获得的属性点（指数级别增长）
        let attributePointsGained = 0;
        let tempRealm = prev.realm;
        let tempLevel = prev.realmLevel;
        for (let i = 0; i < actualBreakthroughCount; i++) {
          const isRealmUpgrade = tempLevel >= 9;
          const validRealmIndex = getRealmIndex(tempRealm);
          if (isRealmUpgrade) {
            if (validRealmIndex < REALM_ORDER.length - 1) {
              attributePointsGained += calculateBreakthroughAttributePoints(isRealmUpgrade, REALM_ORDER[validRealmIndex + 1]);
              tempRealm = REALM_ORDER[validRealmIndex + 1];
              tempLevel = 1;
            }
          } else {
            attributePointsGained += calculateBreakthroughAttributePoints(isRealmUpgrade, tempRealm);
            tempLevel++;
          }
        }

        addLog(
          `🌟 你使用了传承，连续突破了 ${actualBreakthroughCount} 个境界！获得 ${attributePointsGained} 点属性点！`,
          'special'
        );

        if (totalLifespanIncrease > 0) {
          addLog(
            `✨ 传承突破成功！你的寿命增加了 ${totalLifespanIncrease} 年！当前寿命：${Math.floor(newLifespan)}/${newMaxLifespan} 年`,
            'gain'
          );
        }

        // 计算新境界的最终属性 = 基础属性 + 固定加成 + 分配的属性点
        const baseAttack = Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack;
        const baseDefense = Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense;
        const baseMaxHp = newBaseMaxHp + bonusHp + allocatedHp;
        const baseSpirit = Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit;
        const basePhysique = Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique;
        const baseSpeed = Math.max(0, Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed);

        // 计算金丹法数（如果晋升到金丹期）
        let goldenCoreMethodCount = prev.goldenCoreMethodCount;
        // 检查是否在传承突破过程中晋升到金丹期
        let tempRealmForGoldenCore = prev.realm;
        let tempLevelForGoldenCore = prev.realmLevel;
        for (let i = 0; i < actualBreakthroughCount; i++) {
          if (tempLevelForGoldenCore >= 9) {
            const tempRealmIndex = REALM_ORDER.indexOf(tempRealmForGoldenCore);
            if (tempRealmIndex < REALM_ORDER.length - 1) {
              const nextRealm = REALM_ORDER[tempRealmIndex + 1];
              if (nextRealm === '金丹期') {
                // 构建临时玩家状态来计算金丹法数
                const tempPlayer = {
                  ...prev,
                  realm: nextRealm,
                  realmLevel: 1,
                };
                goldenCoreMethodCount = calculateGoldenCoreMethodCount(tempPlayer);
                break;
              }
              tempRealmForGoldenCore = nextRealm;
              tempLevelForGoldenCore = 1;
            } else {
              break;
            }
          } else {
            tempLevelForGoldenCore++;
          }
        }

        // 构建更新后的玩家状态来计算实际最大血量（包含功法加成等）
        const updatedPlayer = {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          goldenCoreMethodCount,
          activeArtId: prev.activeArtId,
          cultivationArts: prev.cultivationArts,
          spiritualRoots: prev.spiritualRoots,
        };
        const totalStats = getPlayerTotalStats(updatedPlayer);
        const actualMaxHp = totalStats.maxHp; // 实际最大血量（包含功法加成）

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

        return {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          exp: newExp,
          maxExp: newMaxExp,
          maxHp: baseMaxHp,
          hp: actualMaxHp, // 使用实际最大血量（包含功法加成）作为满血
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          attributePoints: prev.attributePoints + attributePointsGained,
          maxLifespan: newMaxLifespan,
          lifespan: newLifespan,
          goldenCoreMethodCount, // 设置金丹法数
          inheritanceLevel: remainingInheritance,
          statistics: {
            ...playerStats,
            breakthroughCount: playerStats.breakthroughCount + actualBreakthroughCount,
          },
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
