import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats } from '../types';

interface UsePlayTimeProps {
  gameStarted: boolean;
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  saveGame: () => void;
}

export function usePlayTime({
  gameStarted,
  player,
  setPlayer,
  saveGame,
}: UsePlayTimeProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickAtRef = useRef<number>(Date.now());
  const playerRef = useRef<PlayerStats | null>(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (!gameStarted || !player) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickAtRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickAtRef.current;
      lastTickAtRef.current = now;

      if (document.visibilityState !== 'visible') {
        return;
      }

      const activeElapsed = Math.min(Math.max(elapsed, 0), 1000);
      setPlayer((prev) => {
        if (!prev) return null;
        return { ...prev, playTime: (prev.playTime || 0) + activeElapsed };
      });
    }, 1000);

    const handleVisibilityChange = () => {
      lastTickAtRef.current = Date.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (playerRef.current) {
        saveGame();
      }
    };
  }, [gameStarted, player?.id, player?.name, saveGame, setPlayer]);
}
