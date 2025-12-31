import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearAllSlots } from '../utils/saveManagerUtils';
import { useUIStore } from '../store';
import { PlayerStats, LogEntry } from '../types';

interface UseRebirthParams {
  setPlayer: (player: PlayerStats | null) => void;
  setLogs: (logs: LogEntry[]) => void;
  setGameStarted: (started: boolean) => void;
  setHasSave: (hasSave: boolean) => void;
  setIsDead: (isDead: boolean) => void;
  setDeathBattleData: (data: any) => void;
  setDeathReason: (reason: string) => void;
}

/**
 * 涅槃重生功能 Hook
 */
export function useRebirth({
  setPlayer,
  setLogs,
  setGameStarted,
  setHasSave,
  setIsDead,
  setDeathBattleData,
  setDeathReason,
}: UseRebirthParams) {
  const {
    setLastBattleReplay,
    setAutoMeditate,
    setAutoAdventure,
    setPausedByBattle,
    setPausedByShop,
    setPausedByReputationEvent,
  } = useUIStore();

  const handleRebirth = () => {
    // 清除所有存档
    clearAllSlots();
    localStorage.removeItem(STORAGE_KEYS.SAVE);

    // 重置生命周期状态
    setIsDead(false);
    setDeathBattleData(null);
    setDeathReason('');

    // 重置 UI 状态
    setLastBattleReplay(null);
    setAutoMeditate(false);
    setAutoAdventure(false);
    setPausedByBattle(false);
    setPausedByShop(false);
    setPausedByReputationEvent(false);

    // 重置游戏核心状态
    setPlayer(null);
    setLogs([]);
    setGameStarted(false);
    setHasSave(false);
  };

  return { handleRebirth };
}

