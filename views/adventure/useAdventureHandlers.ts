import React from 'react';
import { PlayerStats, AdventureType, ShopType, RealmType, AdventureResult } from '../../types';
import { REALM_ORDER } from '../../constants';
import { generateAdventureEvent } from '../../services/aiService';
import {
  shouldTriggerBattle,
  resolveBattleEncounter,
  BattleReplay,
} from '../../services/battleService';
import { executeAdventureCore } from './executeAdventureCore';

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
    realmDescription?: string
  ) => {
    if (!player) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (realmName) {
      addLog(`你进入了【${realmName}】，只觉灵气逼人，杀机四伏...`, 'special');
    } else {
      addLog('你走出洞府，前往荒野历练...', 'normal');
    }

    try {
      let result;
      let battleContext: BattleReplay | null = null;

      let battleResolution: Awaited<ReturnType<typeof resolveBattleEncounter>> | undefined;

      if (shouldTriggerBattle(player, adventureType)) {
        // 如果使用回合制战斗系统，打开回合制战斗界面
        if (useTurnBasedBattle && onOpenTurnBasedBattle && !skipBattle) {
          onOpenTurnBasedBattle({
            adventureType,
            riskLevel,
            realmMinRealm,
          });
          setLoading(false);
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
        result = await generateAdventureEvent(player, adventureType, riskLevel, realmName, realmDescription);
      }

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
    if (player.hp < player.maxHp * 0.2) {
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
      const shopTypes = [ShopType.Village, ShopType.City, ShopType.Sect, ShopType.LimitedTime, ShopType.BlackMarket, ShopType.Reputation];
      const randomShopType =
        shopTypes[Math.floor(Math.random() * shopTypes.length)];
      onOpenShop(randomShopType);
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
