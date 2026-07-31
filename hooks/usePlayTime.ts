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
  const activeSinceRef = useRef<number | null>(null);
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
      activeSinceRef.current = null;
      return;
    }

    const flushActiveTime = (countElapsed = document.visibilityState === 'visible') => {
      const activeSince = activeSinceRef.current;
      if (activeSince === null) return;

      const now = Date.now();
      const elapsed = Math.max(0, now - activeSince);
      activeSinceRef.current = now;

      if (elapsed === 0 || !countElapsed) return;

      setPlayer((prev) => {
        if (!prev) return null;
        return { ...prev, playTime: (prev.playTime || 0) + elapsed };
      });
    };

    activeSinceRef.current =
      document.visibilityState === 'visible' ? Date.now() : null;

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') flushActiveTime();
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        activeSinceRef.current = Date.now();
      } else {
        flushActiveTime(true);
        activeSinceRef.current = null;
      }
    };
    const handlePageHide = () => {
      flushActiveTime(true);
      activeSinceRef.current = null;
      if (playerRef.current) saveGame();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);

      if (document.visibilityState === 'visible') flushActiveTime();
      activeSinceRef.current = null;

      if (playerRef.current) {
        saveGame();
      }
    };
  }, [gameStarted, player?.id, player?.name, saveGame, setPlayer]);
}
