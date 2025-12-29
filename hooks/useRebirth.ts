import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearAllSlots } from '../utils/saveManagerUtils';
import { useUI } from '../context/UIContext';
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
  const { auto, battle } = useUI();

  const handleRebirth = () => {
    // 清除所有存档
    clearAllSlots();
    localStorage.removeItem(STORAGE_KEYS.SAVE);

    // 重置生命周期状态
    setIsDead(false);
    setDeathBattleData(null);
    setDeathReason('');

    // 重置 UI 状态
    battle.setLastBattleReplay(null);
    auto.setAutoMeditate(false);
    auto.setAutoAdventure(false);
    auto.setPausedByBattle(false);
    auto.setPausedByShop(false);
    auto.setPausedByReputationEvent(false);

    // 重置游戏核心状态
    setPlayer(null);
    setLogs([]);
    setGameStarted(false);
    setHasSave(false);
  };

  return { handleRebirth };
}

