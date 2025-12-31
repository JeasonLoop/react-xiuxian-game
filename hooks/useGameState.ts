/**
 * useGameState Hook - 兼容层
 * 此 hook 现在从 zustand gameStore 读取状态，保持原有接口兼容
 * 后续可以逐步在组件中直接使用 useGameStore
 */

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { PlayerStats, LogEntry, GameSettings } from '../types';

export function useGameState() {
  // 使用 useShallow 批量选择，减少重渲染
  const {
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
    saveGame,
    loadGame,
    startNewGame,
  } = useGameStore(
    useShallow((state) => ({
      hasSave: state.hasSave,
      setHasSave: state.setHasSave,
      gameStarted: state.gameStarted,
      setGameStarted: state.setGameStarted,
      player: state.player,
      setPlayer: state.setPlayer,
      settings: state.settings,
      setSettings: state.setSettings,
      logs: state.logs,
      setLogs: state.setLogs,
      saveGame: state.saveGame,
      loadGame: state.loadGame,
      startNewGame: state.startNewGame,
    }))
  );

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
