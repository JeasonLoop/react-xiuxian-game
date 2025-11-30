import React from 'react';
import { PlayerStats, SecretRealm } from '../../types';

interface UseRealmHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  loading: boolean;
  cooldown: number;
  setIsRealmOpen: (open: boolean) => void;
  executeAdventure: (
    adventureType: 'secret_realm',
    realmName: string,
    riskLevel?: '低' | '中' | '高' | '极度危险'
  ) => Promise<void>;
}

/**
 * 秘境处理函数
 * 包含进入秘境
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param setLoading 设置加载状态
 * @param setCooldown 设置冷却时间
 * @param loading 加载状态
 * @param cooldown 冷却时间
 * @param setIsRealmOpen 设置秘境是否打开
 * @param executeAdventure 执行历练
 * @returns handleEnterRealm 进入秘境
 */

export function useRealmHandlers({
  player,
  setPlayer,
  addLog,
  loading,
  cooldown,
  setIsRealmOpen,
  executeAdventure,
}: UseRealmHandlersProps) {
  const handleEnterRealm = async (realm: SecretRealm) => {
    if (loading || cooldown > 0 || !player) return;

    if (player.hp < player.maxHp * 0.3) {
      addLog('你气血不足，此时进入秘境无异于自寻死路！', 'danger');
      return;
    }

    if (player.spiritStones < realm.cost) {
      addLog('囊中羞涩，无法支付开启秘境的灵石。', 'danger');
      return;
    }

    setPlayer((prev) => ({
      ...prev,
      spiritStones: prev.spiritStones - realm.cost,
    }));
    setIsRealmOpen(false); // Close modal

    // Secret Realm Adventure
    await executeAdventure('secret_realm', realm.name, realm.riskLevel);
  };

  return {
    handleEnterRealm,
  };
}
