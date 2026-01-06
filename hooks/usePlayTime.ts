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
  const lastPlayTimeSaveRef = useRef<number>(0);
  const playerRef = useRef(player);
  const logsRef = useRef(logs);
  
  // 记录当前 session 开始的时间戳
  const sessionStartTimeRef = useRef<number>(0);
  // 记录当前 session 的累计时长（用于处理 effect 重启）
  const sessionAccumulatedTimeRef = useRef<number>(0);

  // 保持 refs 与状态同步
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    // 游戏未开始或没有玩家数据时，停止计时
    if (!gameStarted || !player) {
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
        playTimeIntervalRef.current = null;
        sessionStartTimeRef.current = 0;
        sessionAccumulatedTimeRef.current = 0;
      }
      return;
    }

    // 初始化 playTime（如果未定义）
    const basePlayTime = player.playTime ?? 0;
    
    // 记录当前 session 开始时间
    sessionStartTimeRef.current = Date.now();
    sessionAccumulatedTimeRef.current = 0;
    lastPlayTimeSaveRef.current = Date.now();

    playTimeIntervalRef.current = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return null;

        const now = Date.now();
        // 计算当前 session 的经过时间
        const sessionElapsed = now - sessionStartTimeRef.current;
        // 新的游戏时长 = 基础时长 + session 累计时长 + 当前 session 经过时间
        const newPlayTime = basePlayTime + sessionAccumulatedTimeRef.current + sessionElapsed;

        // 每 10 秒保存一次
        if (now - lastPlayTimeSaveRef.current >= 10000) {
          lastPlayTimeSaveRef.current = now;
          sessionAccumulatedTimeRef.current += sessionElapsed;
          sessionStartTimeRef.current = now;

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
        
        // 清理时保存最后的游戏时长
        if (playerRef.current && gameStarted) {
          const now = Date.now();
          const sessionElapsed = now - sessionStartTimeRef.current;
          const finalPlayTime = basePlayTime + sessionAccumulatedTimeRef.current + sessionElapsed;
          saveGame({ ...playerRef.current, playTime: finalPlayTime }, logsRef.current);
        }
        
        sessionStartTimeRef.current = 0;
        sessionAccumulatedTimeRef.current = 0;
      }
    };
    // 只依赖 gameStarted，避免频繁重启计时器
  }, [gameStarted, saveGame]);
}

