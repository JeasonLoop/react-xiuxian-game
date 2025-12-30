import React from 'react';
import { PlayerStats, AdventureType, ShopType, RealmType, AdventureResult } from '../../types';
import { REALM_ORDER, HEAVEN_EARTH_SOUL_BOSSES } from '../../constants/index';
import {
  shouldTriggerBattle,
  resolveBattleEncounter,
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
  }) => void; // 打开回合制战斗
  skipBattle?: boolean; // 是否跳过战斗（自动模式下）
  useTurnBasedBattle?: boolean; // 是否使用回合制战斗系统
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void; // 声望事件回调
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
  useTurnBasedBattle = true, // 默认使用新的回合制战斗系统
  onReputationEvent,
}: UseAdventureHandlersProps) {
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
      let result;
      let battleContext: BattleReplay | null = null;

      let battleResolution: Awaited<ReturnType<typeof resolveBattleEncounter>> | undefined;

      // 检查是否被追杀
      const isHunted = player.sectHuntEndTime && player.sectHuntEndTime > Date.now();
      const huntSectId = player.sectHuntSectId;
      const huntLevel = player.sectHuntLevel || 0;

      // 如果被追杀，强制触发追杀战斗（30%概率）
      if (isHunted && huntSectId && Math.random() < 0.11) {
        addLog('⚠️ 你感受到了一股强烈的杀意！宗门追杀者出现了！', 'danger');

        // 如果使用回合制战斗系统，打开回合制战斗界面
        if (useTurnBasedBattle && onOpenTurnBasedBattle && !skipBattle) {
          setTimeout(() => {
            onOpenTurnBasedBattle({
              adventureType: 'sect_challenge',
              riskLevel: huntLevel >= 3 ? '极度危险' : huntLevel >= 2 ? '高' : huntLevel >= 1 ? '中' : '低',
              realmMinRealm: player.realm,
            });
          }, 2000);
          setLoading(false);
          setCooldown(2); // 设置冷却时间，防止立即再次触发历练
          return;
        }

        // 否则使用旧的自动战斗系统
        battleResolution = await resolveBattleEncounter(
          player,
          'sect_challenge',
          huntLevel >= 3 ? '极度危险' : huntLevel >= 2 ? '高' : huntLevel >= 1 ? '中' : '低',
          player.realm,
          undefined,
          huntSectId,
          huntLevel
        );
        result = battleResolution.adventureResult;
        battleContext = battleResolution.replay;
      } else if (shouldTriggerBattle(player, adventureType)) {
        // 如果使用回合制战斗系统，打开回合制战斗界面
        if (useTurnBasedBattle && onOpenTurnBasedBattle && !skipBattle) {
          setTimeout(() => {
          onOpenTurnBasedBattle({
            adventureType,
            riskLevel,
            realmMinRealm,
          });
          }, 2000);

          setLoading(false);
          setCooldown(2); // 设置冷却时间，防止立即再次触发历练
          return; // 回合制战斗会在战斗结束后通过回调更新玩家状态
        }

        // 否则使用旧的自动战斗系统
        battleResolution = await resolveBattleEncounter(
          player,
          adventureType,
          riskLevel,
          realmMinRealm
        );
        result = battleResolution.adventureResult;
        battleContext = battleResolution.replay;
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

                  // 如果使用回合制战斗系统，打开回合制战斗界面
                  if (useTurnBasedBattle && onOpenTurnBasedBattle && !skipBattle) {
                    setTimeout(() => {
                      onOpenTurnBasedBattle({
                        adventureType: actualAdventureType,
                        riskLevel,
                        realmMinRealm: player.realm,
                        bossId,
                      });
                    }, 1000);
                    setLoading(false);
                    setCooldown(2);
                    return;
                  }

                  // 否则使用旧的自动战斗系统
                  resolveBattleEncounter(
                    player,
                    actualAdventureType,
                    riskLevel,
                    player.realm,
                    undefined,
                    undefined,
                    undefined,
                    bossId
                  ).then((battleResolution) => {
                    const battleResult = battleResolution.adventureResult;
                    const battleCtx = battleResolution.replay;
                    executeAdventureCore({
                      result: battleResult,
                      battleContext: battleCtx,
                      player,
                      setPlayer,
                      addLog,
                      triggerVisual,
                      onOpenBattleModal,
                      adventureType: actualAdventureType,
                      realmName,
                    });
                    setLoading(false);
                    setCooldown(2);
                  });
                },
                () => {
                  // 玩家选择放弃
                  addLog(`你选择暂时避开${boss.name}，继续探索...`, 'normal');
                  setLoading(false);
                  setCooldown(1);
                }
              );

              setLoading(false);
              return; // 等待玩家选择
            }

            // 如果没有BOSS信息，使用默认流程
            // 如果使用回合制战斗系统，打开回合制战斗界面
            if (useTurnBasedBattle && onOpenTurnBasedBattle && !skipBattle) {
              setTimeout(() => {
                onOpenTurnBasedBattle({
                  adventureType: actualAdventureType,
                  riskLevel,
                  realmMinRealm: player.realm,
                  bossId,
                });
              }, 2000);
              setLoading(false);
              setCooldown(2);
              return;
            }

            // 否则使用旧的自动战斗系统
            battleResolution = await resolveBattleEncounter(
              player,
              actualAdventureType,
              riskLevel,
              player.realm,
              undefined,
              undefined,
              undefined,
              bossId
            );
            result = battleResolution.adventureResult;
            battleContext = battleResolution.replay;
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

      // 等待2秒后再处理结果
      await new Promise(resolve => setTimeout(resolve, 2000));

      if(import.meta.env.DEV) {
        console.log('result', result);
      }

      // 3秒后执行结果处理
      await executeAdventureCore({
        result,
        battleContext,
        petSkillCooldowns: battleResolution?.petSkillCooldowns,
        player,
        setPlayer,
        addLog,
        triggerVisual,
        onOpenBattleModal,
        realmName,
        adventureType,
        skipBattle,
        riskLevel,
        onReputationEvent,
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

      // 等待3秒后再打开商店
      setTimeout(() => {
        const shopTypes = [ShopType.Village, ShopType.City, ShopType.Sect, ShopType.LimitedTime, ShopType.BlackMarket, ShopType.Reputation];
        const randomShopType =
          shopTypes[Math.floor(Math.random() * shopTypes.length)];
        onOpenShop(randomShopType);
        setLoading(false);
        setCooldown(2);
      }, 3000);
      return;
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
