/**
 * Reputation Event Handler Hook
 * 处理声望事件相关的逻辑，从 useAppHandlers 中提取
 */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, AdventureResult } from '../types';
import { getPlayerTotalStats } from '../utils/statUtils';

interface UseReputationEventHandlerProps {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  reputationEvent: AdventureResult['reputationEvent'] | null;
  setReputationEvent: (event: AdventureResult['reputationEvent'] | null) => void;
  setIsReputationEventOpen: (open: boolean) => void;
  pausedByReputationEvent: boolean;
  setPausedByReputationEvent: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void;
}

/**
 * 声望事件处理 Hook
 */
export function useReputationEventHandler({
  player,
  setPlayer,
  addLog,
  reputationEvent,
  setReputationEvent,
  setIsReputationEventOpen,
  pausedByReputationEvent,
  setPausedByReputationEvent,
  setAutoAdventure,
}: UseReputationEventHandlerProps) {
  const handleReputationEventChoice = useCallback(
    (choiceIndex: number) => {
      if (!reputationEvent || !player) return;

      const choice = reputationEvent.choices[choiceIndex];
      if (!choice) return;

      setPlayer((prev) => {
        if (!prev) return prev;
        const newReputation = Math.max(
          0,
          (prev.reputation || 0) + choice.reputationChange
        );
        let newHp = prev.hp;
        let newExp = prev.exp;
        let newSpiritStones = prev.spiritStones;

        if (choice.hpChange !== undefined) {
          const totalStats = getPlayerTotalStats(prev);
          const actualMaxHp = totalStats.maxHp;
          newHp = Math.max(0, Math.min(actualMaxHp, prev.hp + choice.hpChange));
        }
        if (choice.expChange !== undefined) {
          newExp = Math.max(0, prev.exp + choice.expChange);
        }
        if (choice.spiritStonesChange !== undefined) {
          newSpiritStones = Math.max(
            0,
            prev.spiritStones + choice.spiritStonesChange
          );
        }

        if (choice.reputationChange > 0) {
          addLog(
            `✨ 你的声望增加了 ${choice.reputationChange} 点！当前声望：${newReputation}`,
            'gain'
          );
        } else if (choice.reputationChange < 0) {
          addLog(
            `⚠️ 你的声望减少了 ${Math.abs(choice.reputationChange)} 点！当前声望：${newReputation}`,
            'danger'
          );
        }

        if (choice.description) {
          addLog(
            choice.description,
            choice.reputationChange > 0
              ? 'gain'
              : choice.reputationChange < 0
                ? 'danger'
                : 'normal'
          );
        }

        return {
          ...prev,
          reputation: newReputation,
          hp: newHp,
          exp: newExp,
          spiritStones: newSpiritStones,
        };
      });

      setIsReputationEventOpen(false);
      setReputationEvent(null);

      if (pausedByReputationEvent) {
        setPausedByReputationEvent(false);
        setAutoAdventure(true);
      }
    },
    [
      reputationEvent,
      player,
      addLog,
      setPlayer,
      setIsReputationEventOpen,
      setReputationEvent,
      pausedByReputationEvent,
      setPausedByReputationEvent,
      setAutoAdventure,
    ]
  );

  return {
    handleReputationEventChoice,
  };
}

