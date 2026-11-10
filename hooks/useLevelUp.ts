import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats } from '../types';
import { REALM_ORDER, TRIBULATION_CONFIG } from '../constants/index';
 import { checkBreakthroughConditions, storeOverflowExp, getStoredExpCap } from '../utils/cultivationUtils';
import { shouldTriggerTribulation } from '../utils/tribulationUtils';

interface UseLevelUpParams {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 修为圆满检测 Hook
 * 经验达到上限时不再自动突破/自动弹天劫确认（改为玩家手动点击「突破」按钮触发），
 * 仅做三件事：
 * 1. 溢出修为存入修为泵（突破成功后自动补充新境界修为，不浪费）；
 * 2. 大境界晋升条件不满足时，按境界层级一次性输出原因日志；
 * 3. 修为圆满时按境界层级一次性输出「可点击突破」提示（需渡劫时提示迎接天劫）。
 */
export function useLevelUp({
  player,
  setPlayer,
  addLog,
}: UseLevelUpParams) {
  // 天劫提示标志：供境界变化监听使用
  const isTribulationTriggeredRef = useRef(false);
  // 同一境界层级的一次性日志守卫（避免每次经验变化都刷屏）
  const lastLogKeyRef = useRef('');

  // 使用 ref 存储不稳定的函数引用，避免 useEffect 依赖导致循环
  const addLogRef = useRef(addLog);
  const setPlayerRef = useRef(setPlayer);

  useEffect(() => {
    addLogRef.current = addLog;
    setPlayerRef.current = setPlayer;
  }, [addLog, setPlayer]);

  useEffect(() => {
    if (!player || player.exp < player.maxExp) return;

    const realms = REALM_ORDER;

    // 已达仙道巅峰：只存溢出修为，无突破概念
    const isPeak =
      player.realm === realms[realms.length - 1] && player.realmLevel >= 9;
    if (isPeak) {
      if (player.exp > player.maxExp) {
        setPlayerRef.current((prev) => (prev ? storeOverflowExp(prev) : null));
      }
      return;
    }

     // 溢出修为存入修为泵，等待手动突破成功后自动补充
     if (player.exp > player.maxExp) {
       // 泵满后溢出修为会被丢弃：一次性警告，推动玩家尽快突破
       const pumpCap = getStoredExpCap(player.maxExp);
       if ((player.storedExp || 0) >= pumpCap) {
         const pumpKey = `pump-full-${player.realm}-${player.realmLevel}`;
         if (lastLogKeyRef.current !== pumpKey) {
           lastLogKeyRef.current = pumpKey;
           addLogRef.current('修为泵已满，溢出修为正在散逸！请尽快点击属性面板中的「突破」按钮提升境界。', 'danger');
         }
       }
       setPlayerRef.current((prev) => (prev ? storeOverflowExp(prev) : null));
     }

    const isRealmUpgrade = player.realmLevel >= 9;

    // 大境界晋升但晋升条件不满足：每个境界层级只提示一次原因
    if (isRealmUpgrade) {
      const currentIndex = realms.indexOf(player.realm);
      if (currentIndex < realms.length - 1) {
        const targetRealm = realms[currentIndex + 1];
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);
        if (!conditionCheck.canBreakthrough) {
          const logKey = `blocked-${player.realm}-${player.realmLevel}`;
          if (lastLogKeyRef.current !== logKey) {
            lastLogKeyRef.current = logKey;
            addLogRef.current(conditionCheck.message, 'danger');
          }
          return;
        }
      }
    }

    // 修为圆满：一次性提示可手动突破（需渡劫时提示迎接天劫），不自动触发
    const needsTribulation = shouldTriggerTribulation(player);
    const logKey = `${needsTribulation ? 'tribulation' : 'breakthrough'}-${player.realm}-${player.realmLevel}`;
    if (lastLogKeyRef.current !== logKey) {
      lastLogKeyRef.current = logKey;
      if (needsTribulation) {
        isTribulationTriggeredRef.current = true;
        const currentIndex = realms.indexOf(player.realm);
        const targetRealm = realms[currentIndex + 1];
        const config = TRIBULATION_CONFIG[targetRealm];
        const tribulationName = config?.tribulationLevel || `${targetRealm}天劫`;
        addLogRef.current(
          `修为已圆满，${tribulationName}即将降临！可点击属性面板中的「突破」按钮迎接天劫。`,
          'special'
        );
      } else {
        addLogRef.current(
          '修为已圆满！可点击属性面板中的「突破」按钮尝试突破。',
          'special'
        );
      }
    }
     // 移除不稳定的函数依赖，使用 ref 访问最新值。
     // 依赖整个 player：大境界晋升条件（装备/功法/灵石等）补足时 exp 不变，
     // 若只依赖 exp/maxExp 等字段，「条件受阻解除」的提示将永远不会刷新
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [player]);
 
   // 监听境界变化，重置提示状态（突破成功后允许下一层的提示重新输出）
   const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
   useEffect(() => {
     if (player && prevRealmRef.current) {
       if (player.realm !== prevRealmRef.current.realm || player.realmLevel !== prevRealmRef.current.level) {
         isTribulationTriggeredRef.current = false;
         lastLogKeyRef.current = '';
       }
     }
     if (player) {
       prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
     }
   }, [player?.realm, player?.realmLevel]);

  return {
    isTribulationTriggeredRef,
  };
}
