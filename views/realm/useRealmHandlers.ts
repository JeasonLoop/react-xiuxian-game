import React from 'react';
import { PlayerStats, SecretRealm, RealmType } from '../../types';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseRealmHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  loading: boolean;
  cooldown: number;
  setIsRealmOpen: (open: boolean) => void;
  executeAdventure: (adventureType: 'secret_realm', realmName: string, riskLevel?: '低' | '中' | '高' | '极度危险', realmMinRealm?: RealmType, realmDescription?: string) => Promise<void>;
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
  setItemActionLog,
  loading,
  cooldown,
  setIsRealmOpen,
  executeAdventure,
}: UseRealmHandlersProps) {
  const handleEnterRealm = async (realm: SecretRealm) => {
    if (loading || cooldown > 0 || !player) return;

    // 使用实际最大血量（包含金丹法数加成等）来判断气血不足
    const totalStats = getPlayerTotalStats(player);
    if (player.hp < totalStats.maxHp * 0.3) {
      const message = '你气血不足，此时进入秘境无异于自寻死路！';
      addLog(message, 'danger');
      if (setItemActionLog) {
        setItemActionLog({ text: message, type: 'danger' });
      }
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

    // Secret Realm Adventure - 传递秘境的完整信息
    await executeAdventure('secret_realm', realm.name, realm.riskLevel, realm.minRealm, realm.description);
  };

  return {
    handleEnterRealm,
  };
}
