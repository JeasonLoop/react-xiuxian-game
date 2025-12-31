import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats } from '../types';

interface UsePlayTimeProps {
  gameStarted: boolean;
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  saveGame: (player: PlayerStats, logs: any[]) => void;
  logs: any[];
}

export function usePlayTime({
  gameStarted,
  player,
  setPlayer,
  saveGame,
  logs,
}: UsePlayTimeProps) {
  const playTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayTimeUpdateRef = useRef<number>(0);
  const lastPlayTimeSaveRef = useRef<number>(0);
  const playerRef = useRef(player);
  const logsRef = useRef(logs);

  // 保持 refs 与状态同步
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    if (!gameStarted || !player) {
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
        playTimeIntervalRef.current = null;
      }
      return;
    }

    if (player.playTime === undefined) {
      setPlayer((prev) => (prev ? { ...prev, playTime: 0 } : null));
      lastPlayTimeUpdateRef.current = 0;
    } else {
      lastPlayTimeUpdateRef.current = player.playTime;
    }

    const startTime = Date.now();
    lastPlayTimeSaveRef.current = Date.now();

    playTimeIntervalRef.current = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return null;

        const now = Date.now();
        const elapsed = now - startTime;
        const newPlayTime = lastPlayTimeUpdateRef.current + elapsed;

        if (now - lastPlayTimeSaveRef.current >= 10000) {
          lastPlayTimeSaveRef.current = now;
          lastPlayTimeUpdateRef.current = newPlayTime;

          const currentPlayer = playerRef.current;
          const currentLogs = logsRef.current;
          if (currentPlayer) {
            saveGame({ ...currentPlayer, playTime: newPlayTime }, currentLogs);
          }
        }

        return { ...prev, playTime: newPlayTime };
      });
    }, 1000);

    return () => {
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
        playTimeIntervalRef.current = null;
      }
    };
  }, [gameStarted, player?.name, saveGame, setPlayer]);
}

