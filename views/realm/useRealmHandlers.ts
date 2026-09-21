import React from 'react';
import { PlayerStats, SecretRealm, RealmType, ItemRarity } from '../../types';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { SECRET_REALMS } from '../../constants/secretRealms';
import { generateItem } from '../../utils/itemGenerator';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { uid } from '../../utils/gameUtils';

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

/** 根据秘境风险等级决定主题掉落的稀有度 */
function getThemedDropRarity(riskLevel: SecretRealm['riskLevel']): ItemRarity {
  switch (riskLevel) {
    case '极度危险':
      return Math.random() < 0.25 ? '仙品' : '传说';
    case '高':
      return Math.random() < 0.15 ? '仙品' : '传说';
    case '中':
      return Math.random() < 0.1 ? '传说' : '稀有';
    default:
      return '稀有';
  }
}

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
  const handleEnterRealm = async (realm: SecretRealm): Promise<boolean> => {
    if (loading || cooldown > 0 || !player) return false;

    // 使用实际最大血量（包含金丹法数加成等）来判断气血不足
    const totalStats = getPlayerTotalStats(player);
    if (player.hp < totalStats.maxHp * 0.3) {
      const message = '你气血不足，此时进入秘境无异于自寻死路！';
      addLog(message, 'danger');
      if (setItemActionLog) {
        setItemActionLog({ text: message, type: 'danger' });
      }
      return false;
    }

    if (player.spiritStones < realm.cost) {
      addLog('囊中羞涩，无法支付开启秘境的灵石。', 'danger');
      return false;
    }

    // 名境（固定秘境）：结算每日首通与主题掉落
    const fixedRealm = SECRET_REALMS.find((r) => r.id === realm.id);
    let themedItem: ReturnType<typeof generateItem> = null;
    let firstClearToday = false;

    if (fixedRealm && fixedRealm.themedTypes && fixedRealm.themedTypes.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const lastClear = player.dailyRealmFirstClears?.[fixedRealm.id];
      firstClearToday = lastClear !== today;

      // 主题掉落：每日首通必得，非首通 50% 概率
      if (firstClearToday || Math.random() < 0.5) {
        const type = fixedRealm.themedTypes[Math.floor(Math.random() * fixedRealm.themedTypes.length)];
        const rarity = getThemedDropRarity(fixedRealm.riskLevel);
        themedItem = generateItem({
          type,
          rarity,
          realm: player.realm,
          realmLevel: player.realmLevel,
        });
      }
    }

    setPlayer((prev) => {
      let nextInventory = prev.inventory;
      const nextStones = prev.spiritStones - realm.cost;

      // 返还首通门票（名境每日首通奖励之一）
      const refundStones = fixedRealm && firstClearToday ? realm.cost : 0;

      // 发放主题掉落物品
      if (themedItem) {
        nextInventory = addItemToInventory(
          nextInventory,
          { ...themedItem, id: uid() },
          themedItem.quantity || 1,
          { realm: prev.realm, realmLevel: prev.realmLevel }
        );
      }

      // 更新名境每日首通记录
      let dailyRealmFirstClears = prev.dailyRealmFirstClears;
      if (fixedRealm && firstClearToday) {
        dailyRealmFirstClears = {
          ...(prev.dailyRealmFirstClears || {}),
          [fixedRealm.id]: new Date().toISOString().split('T')[0],
        };
      }

      return {
        ...prev,
        spiritStones: nextStones + refundStones,
        inventory: nextInventory,
        dailyRealmFirstClears,
      };
    });

    // 主题掉落与首通提示（在冒险日志之前输出）
    if (fixedRealm && firstClearToday) {
      addLog(`【${fixedRealm.name}】今日首次开启！门票已返还，并必有主题宝物相赠。`, 'special');
    }
    if (themedItem) {
      addLog(`秘境深处灵光一闪，你获得了【${themedItem.name}】x${themedItem.quantity || 1}！`, 'gain');
    }

    setIsRealmOpen(false); // Close modal

    // Secret Realm Adventure - 传递秘境的完整信息
    await executeAdventure('secret_realm', realm.name, realm.riskLevel, realm.minRealm, realm.description);
    return true;
  };

  return {
    handleEnterRealm,
  };
}
