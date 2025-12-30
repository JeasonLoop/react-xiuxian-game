/**
 * useGameState Hook - 兼容层
 * 此 hook 现在从 zustand gameStore 读取状态，保持原有接口兼容
 * 后续可以逐步在组件中直接使用 useGameStore
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerStats, LogEntry, GameSettings } from '../types';

export function useGameState() {
  // 从 zustand store 获取状态和 actions
  const hasSave = useGameStore((state) => state.hasSave);
  const setHasSave = useGameStore((state) => state.setHasSave);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setGameStarted = useGameStore((state) => state.setGameStarted);
  const player = useGameStore((state) => state.player);
  const setPlayer = useGameStore((state) => state.setPlayer);
  const settings = useGameStore((state) => state.settings);
  const setSettings = useGameStore((state) => state.setSettings);
  const logs = useGameStore((state) => state.logs);
  const setLogs = useGameStore((state) => state.setLogs);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const startNewGame = useGameStore((state) => state.startNewGame);

  // 游戏启动时自动加载存档
  useEffect(() => {
    if (hasSave && !player) {
      loadGame();
    }
  }, [hasSave, player, loadGame]);

  // 兼容原有的 handleStartGame 接口
  const handleStartGame = (
    playerName: string,
    talentId: string,
    difficulty: GameSettings['difficulty']
  ) => {
    startNewGame(playerName, talentId, difficulty);
  };

  // 返回与原有 hook 相同的接口
  return {
    hasSave,
    setHasSave,
    gameStarted,
    setGameStarted,
    player,
    setPlayer,
    settings,
    setSettings,
    logs,
    setLogs,
    handleStartGame,
    saveGame: (playerData: PlayerStats, logsData: LogEntry[]) => {
      // 兼容旧接口：先更新状态再保存
      // 新代码应该直接使用 setPlayer + setLogs，让 zustand 自动保存
      setPlayer(playerData);
      setLogs(logsData);
    },
  };
}
