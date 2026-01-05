import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, TribulationState, RealmType } from '../types';
import { REALM_ORDER, TRIBULATION_CONFIG } from '../constants/index';
import { checkBreakthroughConditions } from '../utils/cultivationUtils';
import { shouldTriggerTribulation, createTribulationState } from '../utils/tribulationUtils';
import { showConfirm } from '../utils/toastUtils';

interface UseLevelUpParams {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  tribulationState: TribulationState | null;
  setTribulationState: (state: TribulationState | null) => void;
  handleBreakthrough: (skipSuccessCheck?: boolean) => void;
  addLog: (message: string, type?: string) => void;
  autoAdventure?: boolean; // 是否正在自动历练
}

/**
 * 等级提升与天劫触发逻辑 Hook
 */
export function useLevelUp({
  player,
  setPlayer,
  tribulationState,
  setTribulationState,
  handleBreakthrough,
  addLog,
  autoAdventure = false,
}: UseLevelUpParams) {
  const isTribulationTriggeredRef = useRef(false);

  // 使用 ref 存储不稳定的函数引用，避免 useEffect 依赖导致循环
  const handleBreakthroughRef = useRef(handleBreakthrough);
  const addLogRef = useRef(addLog);
  const setPlayerRef = useRef(setPlayer);

  useEffect(() => {
    handleBreakthroughRef.current = handleBreakthrough;
    addLogRef.current = addLog;
    setPlayerRef.current = setPlayer;
  }, [handleBreakthrough, addLog, setPlayer]);

  useEffect(() => {

    if (player && player.exp >= player.maxExp) {
      // 检查是否达到绝对巅峰
      const realms = REALM_ORDER;
      const isMaxRealm = player.realm === realms[realms.length - 1];
      if (isMaxRealm && player.realmLevel >= 9) {
        // 锁定经验为满值
        if (player.exp > player.maxExp) {
          setPlayerRef.current((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
        }
        return;
      }

      // 如果经验值超过 maxExp，说明是新的经验值增加，重置标志位允许触发
      if (player.exp > player.maxExp) {
        isTribulationTriggeredRef.current = false;
      }

      // 检查是否已经触发了天劫（防止重复触发）
      // 只有当经验值刚好等于 maxExp 且已经触发过天劫时，才阻止重复触发
      if (isTribulationTriggeredRef.current && player.exp === player.maxExp) {
        return;
      }

      // 检查是否需要渡劫
      const isRealmUpgrade = player.realmLevel >= 9 && player.exp > player.maxExp;
      let targetRealm = player.realm;
      if (isRealmUpgrade) {
        const currentIndex = REALM_ORDER.indexOf(player.realm);
        if (currentIndex < REALM_ORDER.length - 1) {
          targetRealm = REALM_ORDER[currentIndex + 1];
        }
      }

      // 如果是境界升级，先检查是否满足突破条件
      if (isRealmUpgrade && targetRealm !== player.realm) {
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);
        if (!conditionCheck.canBreakthrough) {
          addLogRef.current(conditionCheck.message, 'danger');
          // 锁定经验值，避免反复触发
          setPlayerRef.current((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          return;
        }
      }

      // 检查是否需要渡劫
      const needsTribulation = shouldTriggerTribulation(player);

      if (needsTribulation && !tribulationState?.isOpen) {
        // 设置标志位，防止重复触发
        isTribulationTriggeredRef.current = true;

        // 获取天劫名称
        const config = TRIBULATION_CONFIG[targetRealm];
        const tribulationName = config?.tribulationLevel || `${targetRealm}天劫`;

        // 显示确认弹窗
        showConfirm(
          `你的${tribulationName}来了，是否现在渡劫？`,
          '确认渡劫',
          () => {
            const newTribulationState = createTribulationState(player, targetRealm);
            setTribulationState(newTribulationState);
          },
          () => {
            setTribulationState(null);
            setPlayerRef.current((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          }
        );
      } else if (!needsTribulation) {
        // 不需要渡劫，直接执行突破（不管tribulationState的状态）
        // 在自动历练时，即使loading为true也应该允许突破
        // 突破函数内部会处理loading状态
        handleBreakthroughRef.current();
      }
    }
    // 移除不稳定的函数依赖，使用 ref 访问最新值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.exp, player?.maxExp, player?.realm, player?.realmLevel, tribulationState?.isOpen, autoAdventure]);

  // 监听突破成功，重置天劫标志
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  useEffect(() => {
    if (player && prevRealmRef.current) {
      if (player.realm !== prevRealmRef.current.realm || player.realmLevel !== prevRealmRef.current.level) {
        isTribulationTriggeredRef.current = false;
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

