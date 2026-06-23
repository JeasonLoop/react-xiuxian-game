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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** session 开始时的时钟时间 */
  const sessionStartRef = useRef<number>(0);
  /** session 开始时的存档 playTime 基准值（只取一次，不随 setPlayer 更新） */
  const basePlayTimeRef = useRef<number>(0);
  const inSessionRef = useRef(false);

  useEffect(() => {
    if (!gameStarted || !player) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      inSessionRef.current = false;
      return;
    }

    // 新 session：记录基准值
    if (!inSessionRef.current) {
      inSessionRef.current = true;
      basePlayTimeRef.current = player.playTime || 0;
      sessionStartRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return null;
        // playTime = 存档基准值 + 从 session 开始经过的毫秒数
        const newPlayTime = basePlayTimeRef.current + (Date.now() - sessionStartRef.current);
        return { ...prev, playTime: newPlayTime };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (player && inSessionRef.current) {
        inSessionRef.current = false;
        const finalPlayTime = basePlayTimeRef.current + (Date.now() - sessionStartRef.current);
        try {
          const saveData = {
            player: { ...player, playTime: finalPlayTime },
            logs,
            timestamp: Date.now(),
            lastActiveTime: Date.now(),
          };
          localStorage.setItem('xiuxian-save', JSON.stringify(saveData));
        } catch {}
      }
    };
  }, [gameStarted]);
}
