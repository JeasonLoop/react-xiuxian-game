import React from 'react';
import { PlayerStats, AdventureType, ShopType, RealmType, AdventureResult } from '../../types';
import { REALM_ORDER, HEAVEN_EARTH_SOUL_BOSSES } from '../../constants/index';
import {
  shouldTriggerBattle,
  resolveBattleEncounter,
  createEnemy,
  BattleReplay,
} from '../../services/battleService';
import { executeAdventureCore } from './executeAdventureCore';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../../services/adventureTemplateService';
import { showConfirm } from '../../utils/toastUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

/**
 * 历练处理函数
 * 包含历练、历练核心逻辑
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param triggerVisual 触发视觉效果
 * @param setLoading 设置加载状态
 * @param setCooldown 设置冷却时间
 * @param loading 加载状态
 * @param cooldown 冷却时间
 * @param onOpenShop 打开商店
 * @param onOpenBattleModal 打开战斗模态框
 * @returns handleAdventure 历练
 * @returns executeAdventure 历练核心逻辑
 */

interface UseAdventureHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  loading: boolean;
  cooldown: number;
  onOpenShop: (shopType: ShopType) => void;
  onOpenBattleModal: (replay: BattleReplay) => void;
  onOpenTurnBasedBattle?: (params: {
    adventureType: AdventureType;
    riskLevel?: '低' | '中' | '高' | '极度危险';
    realmMinRealm?: RealmType;
    bossId?: string; // 指定的天地之魄BOSS ID（用于事件模板）
    onBattleInitialized?: (enemyName: string) => void; // 战斗初始化完成后的回调
  }) => void; // 打开回合制战斗
  skipBattle?: boolean; // 是否跳过战斗（自动模式下）
  fleeOnBattle?: boolean; // 遇到战斗是否逃跑
  skipShop?: boolean; // 是否跳过商店
  skipReputationEvent?: boolean; // 是否跳过声望事件
  useTurnBasedBattle?: boolean; // 是否使用回合制战斗系统
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void; // 声望事件回调
  autoAdventure?: boolean; // 是否正在自动历练
  setAutoAdventurePausedByHeavenEarthSoul?: (paused: boolean) => void; // 设置天地之魄暂停状态
  setAutoAdventure?: (value: boolean) => void; // 设置自动历练状态
}

export function useAdventureHandlers({
  player,
  setPlayer,
  addLog,
  triggerVisual,
  setLoading,
  setCooldown,
  loading,
  cooldown,
  onOpenShop,
  onOpenBattleModal,
  onOpenTurnBasedBattle,
  skipBattle = false,
  fleeOnBattle = false,
  skipShop = false,
  skipReputationEvent = false,
  useTurnBasedBattle = true, // 默认使用新的回合制战斗系统
  onReputationEvent,
  autoAdventure = false,
  setAutoAdventurePausedByHeavenEarthSoul,
  setAutoAdventure,
}: UseAdventureHandlersProps) {
  // 确保只有在自动历练模式下才应用跳过配置
  const effectiveSkipBattle = autoAdventure && skipBattle;
  const effectiveFleeOnBattle = autoAdventure && fleeOnBattle;
  const effectiveSkipShop = autoAdventure && skipShop;
  const effectiveSkipReputationEvent = autoAdventure && skipReputationEvent;

  /**
   * 暂停自动历练回调（用于天地之魄等特殊事件）
   */
  const handlePauseAutoAdventure = React.useCallback(() => {
    if (autoAdventure && setAutoAdventurePausedByHeavenEarthSoul && setAutoAdventure) {
      setAutoAdventurePausedByHeavenEarthSoul(true);
      setAutoAdventure(false);
    }
  }, [autoAdventure, setAutoAdventurePausedByHeavenEarthSoul, setAutoAdventure]);

  /**
   * 处理战斗的公共函数
   * 根据配置决定是跳过战斗、打开回合制战斗界面，还是使用自动战斗系统
   */
  const handleBattle = async (
    battleType: AdventureType,
    riskLevel: '低' | '中' | '高' | '极度危险',
    realmMinRealm: RealmType,
    bossId?: string,
    huntSectId?: string,
    huntLevel?: number
  ): Promise<{
    result: AdventureResult;
    battleContext: BattleReplay | null;
    petSkillCooldowns?: Record<string, number>;
    shouldReturn: boolean;
  }> => {
    // 如果配置了逃跑，直接跳过战斗
    if (effectiveFleeOnBattle) {
      addLog('你选择避开战斗，继续历练...', 'normal');
      setLoading(false);
      setCooldown(1);
      return { result: {} as AdventureResult, battleContext: null, shouldReturn: true };
    }

    // 自动历练模式下，如果配置了跳过战斗，直接使用自动战斗系统并展示结果（不打开战斗弹窗）
    // 注意：天地之魄挑战（bossId 存在或类型为 dao_combining_challenge）不跳过弹窗
    const isSpecialBattle = battleType === 'dao_combining_challenge' || !!bossId;
    if (autoAdventure && effectiveSkipBattle && !isSpecialBattle) {
      const battleResolution = await resolveBattleEncounter(
        player,
        battleType,
        riskLevel,
        realmMinRealm,
        undefined,
        huntSectId,
        huntLevel,
        bossId
      );
      const battleResult = battleResolution.adventureResult;
      const battleCtx = battleResolution.replay;
      const petSkillCooldowns = battleResolution.petSkillCooldowns;
      // 自动历练时跳过战斗，不打开战斗弹窗，直接返回结果
      return { result: battleResult, battleContext: battleCtx, shouldReturn: false };
    } else if (useTurnBasedBattle && onOpenTurnBasedBattle && !effectiveSkipBattle) {
      // 如果使用回合制战斗系统，打开回合制战斗界面
      // 注意：不在打开前调用 createEnemy，避免敌人信息不一致
      // 敌人信息将在战斗弹窗初始化完成后通过回调输出
      onOpenTurnBasedBattle({
        adventureType: battleType,
        riskLevel,
        realmMinRealm,
        bossId,
        onBattleInitialized: (enemyName: string) => {
          // 战斗初始化完成后输出遭遇敌人的提示
          addLog(`⚠️ 你遭遇了【${enemyName}】！战斗即将开始...`, 'danger');
          // 初始化完成后关闭 loading
          setLoading(false);
        },
      });
      // 保持 loading 状态直到战斗弹窗初始化完成
      setCooldown(2);
      return { result: {} as AdventureResult, battleContext: null, shouldReturn: true };
    } else {
      // 否则使用旧的自动战斗系统
      const battleResolution = await resolveBattleEncounter(
        player,
        battleType,
        riskLevel,
        realmMinRealm,
        undefined,
        huntSectId,
        huntLevel,
        bossId
      );
      return {
        result: battleResolution.adventureResult,
        battleContext: battleResolution.replay,
        petSkillCooldowns: battleResolution.petSkillCooldowns,
        shouldReturn: false,
      };
    }
  };

  const executeAdventure = async (
    adventureType: AdventureType,
    realmName?: string,
    riskLevel?: '低' | '中' | '高' | '极度危险',
    realmMinRealm?: RealmType,
  ) => {
    if (!player) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (realmName) {
      addLog(`你进入了【${realmName}】，只觉灵气逼人，杀机四伏...`, 'special');
      // 添加探索中的提示，避免用户感觉卡住
      // 使用 setTimeout 确保提示在日志中显示
      setTimeout(() => {
        addLog('正在探索秘境，寻找机缘...', 'normal');
      }, 100);
    } else if (adventureType === 'dao_combining_challenge') {
      addLog('你前往挑战天地之魄，这是合道期的终极考验...', 'special');
    } else {
      addLog('你走出洞府，前往荒野历练...', 'normal');
    }

    try {
      let result: AdventureResult | undefined;
      let battleContext: BattleReplay | null = null;
      let petSkillCooldowns: Record<string, number> | undefined;

      // 检查是否被追杀
      const isHunted = player.sectHuntEndTime && player.sectHuntEndTime > Date.now();
      const huntSectId = player.sectHuntSectId;
      const huntLevel = player.sectHuntLevel || 0;

      // 如果被追杀，强制触发追杀战斗（30%概率）
      if (isHunted && huntSectId && Math.random() < 0.11) {
        addLog('⚠️ 你感受到了一股强烈的杀意！宗门追杀者出现了！', 'danger');

        // 使用公共函数处理战斗
        const huntRiskLevel = huntLevel >= 3 ? '极度危险' : huntLevel >= 2 ? '高' : huntLevel >= 1 ? '中' : '低';
        const battleRes = await handleBattle(
          'sect_challenge',
          huntRiskLevel,
          player.realm,
          undefined,
          huntSectId,
          huntLevel
        );
        if (battleRes.shouldReturn) {
          // 如果返回了，确保至少输出一个日志
          if (!battleRes.result?.story) {
            addLog('你避开了追杀者，继续历练...', 'normal');
          }
          return;
        }
        result = battleRes.result;
        battleContext = battleRes.battleContext;
        petSkillCooldowns = battleRes.petSkillCooldowns;
      } else if (shouldTriggerBattle(player, adventureType)) {
        // 如果配置了逃跑，直接跳过战斗
        if (effectiveFleeOnBattle) {
          addLog('你选择避开战斗，继续历练...', 'normal');
          setLoading(false);
          setCooldown(1);
          return;
        }

        // 使用公共函数处理战斗
        const battleRes = await handleBattle(adventureType, riskLevel || '低', realmMinRealm || player.realm);
        if (battleRes.shouldReturn) {
          // 如果返回了，确保至少输出一个日志
          if (!battleRes.result?.story) {
            addLog('你避开了战斗，继续历练...', 'normal');
          }
          return;
        }
        result = battleRes.result;
        battleContext = battleRes.battleContext;
        petSkillCooldowns = battleRes.petSkillCooldowns;
      } else {
        // 100%使用模板库
        initializeEventTemplateLibrary();
        const template = getRandomEventTemplate(adventureType, riskLevel, player.realm, player.realmLevel);

        if (template) {
          // 使用实际最大血量（包含金丹法数加成等）
          const totalStats = getPlayerTotalStats(player);
          result = templateToAdventureResult(template, {
            realm: player.realm,
            realmLevel: player.realmLevel,
            maxHp: totalStats.maxHp,
          });

          // 天地之魄：化神期及以上有额外概率遭遇
          const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
          const spiritSeveringIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);

          if (currentRealmIndex >= spiritSeveringIndex && !result.heavenEarthSoulEncounter) {
            const isSecretRealm = adventureType === 'secret_realm';
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
              }
            }
          }


          // 如果事件模板返回的是天地之魄事件，需要触发战斗
          if (result.adventureType === 'dao_combining_challenge' || result.heavenEarthSoulEncounter) {
            const actualAdventureType = result.adventureType || 'dao_combining_challenge';
            const bossId = result.heavenEarthSoulEncounter;

            // 获取天地之魄BOSS信息
            const boss = bossId ? HEAVEN_EARTH_SOUL_BOSSES[bossId] : null;
            if (boss) {
              // 计算玩家实力
              const playerStats = getPlayerTotalStats(player);
              const playerPower = playerStats.attack + playerStats.defense + playerStats.maxHp / 10 + playerStats.speed;

              // 计算BOSS实力（应用强度倍率）
              const bossStats = boss.baseStats;
              const bossPower = (bossStats.attack + bossStats.defense + bossStats.hp / 10 + bossStats.speed) * (boss.strengthMultiplier || 1);

              // 计算实力对比
              const powerRatio = playerPower / bossPower;
              let strengthComparison = '';
              if (powerRatio >= 1.2) {
                strengthComparison = '你的实力明显强于对方';
              } else if (powerRatio >= 1.0) {
                strengthComparison = '你的实力略强于对方';
              } else if (powerRatio >= 0.8) {
                strengthComparison = '你的实力与对方相当';
              } else if (powerRatio >= 0.6) {
                strengthComparison = '你的实力略弱于对方';
              } else {
                strengthComparison = '你的实力明显弱于对方，建议谨慎挑战';
              }

              // 如果是自动历练模式，需要暂停自动历练
              if (autoAdventure) {
                handlePauseAutoAdventure();
              }

              // 构建提示信息
              const message = `你遭遇了天地之魄【${boss.name}】！\n\n` +
                `描述：${boss.description}\n\n` +
                `境界：${boss.realm}\n` +
                `难度：${boss.difficulty === 'easy' ? '简单' : boss.difficulty === 'normal' ? '普通' : boss.difficulty === 'hard' ? '困难' : '极难'}\n\n` +
                `实力对比：\n` +
                `  攻击：${playerStats.attack.toLocaleString()} vs ${Math.floor(bossStats.attack * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  防御：${playerStats.defense.toLocaleString()} vs ${Math.floor(bossStats.defense * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  气血：${playerStats.maxHp.toLocaleString()} vs ${Math.floor(bossStats.hp * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  速度：${playerStats.speed.toLocaleString()} vs ${Math.floor(bossStats.speed * (boss.strengthMultiplier || 1)).toLocaleString()}\n\n` +
                `${strengthComparison}\n\n` +
                `是否挑战？`;

              // 显示确认对话框
              showConfirm(
                message,
                `遭遇天地之魄：${boss.name}`,
                () => {
                  // 玩家选择挑战
                  addLog(`你决定挑战${boss.name}！`, 'warning');

                   setTimeout(() => {
                      onOpenTurnBasedBattle({
                        adventureType: actualAdventureType,
                        riskLevel,
                        realmMinRealm: player.realm,
                        bossId,
                      });
                    }, 300);
                    setLoading(false);
                    setCooldown(2);
                },
                () => {
                  // 玩家选择放弃
                  addLog(`你选择暂时避开${boss.name}，继续探索...`, 'normal');
                  setLoading(false);
                  setCooldown(1);
                  // 如果之前是自动历练模式，恢复自动历练
                  if (setAutoAdventurePausedByHeavenEarthSoul && setAutoAdventure) {
                    setAutoAdventurePausedByHeavenEarthSoul(false);
                    // 注意：这里不自动恢复 autoAdventure，让用户手动决定是否继续自动历练
                  }
                }
              );

              setLoading(false);
              return; // 等待玩家选择
            }

            // 如果没有BOSS信息，使用默认流程
            // 使用公共函数处理战斗
            const battleResult = await handleBattle(
              actualAdventureType,
              riskLevel || '低',
              player.realm,
              bossId
            );
            result = battleResult.result;
            battleContext = battleResult.battleContext;
          }
        } else {
          // 如果模板库为空，使用默认事件
          result = {
            story: '你在历练途中没有遇到什么特别的事情。',
            hpChange: 0,
            expChange: Math.floor(10 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
            spiritStonesChange: 0,
            eventColor: 'normal',
          };
        }
      }

      // 确保 result 存在，如果不存在则使用默认值
      if (!result) {
        result = {
          story: '你在历练途中没有遇到什么特别的事情。',
          hpChange: 0,
          expChange: Math.floor(10 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
          spiritStonesChange: 0,
          eventColor: 'normal',
        };
      }

      // 等待2秒后再处理结果
      await new Promise(resolve => setTimeout(resolve, 2000));

      if(import.meta.env.DEV) {
        console.log('result', result);
      }

      // 执行结果处理
      await executeAdventureCore({
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
        skipBattle: effectiveSkipBattle,
        riskLevel,
        skipReputationEvent: effectiveSkipReputationEvent,
        onReputationEvent,
        onPauseAutoAdventure: handlePauseAutoAdventure,
      });
    } catch (e) {
      addLog('历练途中突发异变，你神识受损，不得不返回。', 'danger');
    } finally {
      setLoading(false);
      setCooldown(2);
    }
  };

  const handleAdventure = async () => {
    if (loading || cooldown > 0) return;
    // 使用实际最大血量（包含金丹法数加成等）来判断重伤状态
    const totalStats = getPlayerTotalStats(player);
    if (player.hp < totalStats.maxHp * 0.2) {
      addLog('你身受重伤，仍然强撑着继续历练...', 'danger');
    }

    // 根据境界计算机缘概率
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const baseLuckyChance = 0.05; // 基础5%概率
    const realmBonus = realmIndex * 0.02; // 每提升一个境界增加2%
    const levelBonus = (player.realmLevel - 1) * 0.01; // 每提升一层增加1%
    const luckBonus = player.luck * 0.001; // 幸运值加成
    const luckyChance = Math.min(
      0.3,
      baseLuckyChance + realmBonus + levelBonus + luckBonus
    );

    // 15% Chance to encounter a shop
    const shopChance = Math.random();
    if (shopChance < 0.15) {
      setLoading(true);
      addLog('你在路上发现了一处商铺...', 'normal');

      // 如果配置了跳过商店，直接跳过并继续历练
      if (effectiveSkipShop) {
        addLog('你选择跳过商店，继续历练...', 'normal');
        setLoading(false);
        setCooldown(1);
        // 继续执行历练，不return
      } else {
        // 等待3秒后再打开商店
        setTimeout(() => {
          const shopTypes = [ShopType.Village, ShopType.City, ShopType.Sect, ShopType.LimitedTime, ShopType.BlackMarket, ShopType.Reputation];
          const randomShopType =
            shopTypes[Math.floor(Math.random() * shopTypes.length)];
          onOpenShop(randomShopType);
          setLoading(false);
          setCooldown(2);
        }, 3000);
        return; // 打开商店时，需要return，等待玩家操作
      }
    }

    // 根据境界计算机缘概率
    const isLucky = Math.random() < luckyChance;
    await executeAdventure(isLucky ? 'lucky' : 'normal');
  };

  return {
    handleAdventure,
    executeAdventure,
  };
}
