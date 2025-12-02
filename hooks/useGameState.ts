import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerStats, LogEntry, GameSettings } from '../types';
import { createInitialPlayer } from '../utils/playerUtils';
import { SAVE_KEY, SETTINGS_KEY } from '../utils/gameUtils';
import { TALENTS } from '../constants';

export function useGameState() {
  const [hasSave, setHasSave] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved !== null;
    } catch {
      return false;
    }
  });

  const [gameStarted, setGameStarted] = useState(hasSave);
  const [player, setPlayer] = useState<PlayerStats | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...JSON.parse(saved) };
      }
    } catch {}
    return {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 70,
      musicVolume: 50,
      autoSave: true,
      animationSpeed: 'normal',
      language: 'zh',
    };
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 加载存档
  useEffect(() => {
    if (hasSave && !player) {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
          const savedData = JSON.parse(saved);
          // 确保加载的存档包含新字段
          const loadedPlayer = {
            ...savedData.player,
            dailyTaskCount:
              savedData.player.dailyTaskCount &&
              typeof savedData.player.dailyTaskCount === 'object'
                ? savedData.player.dailyTaskCount
                : typeof savedData.player.dailyTaskCount === 'number'
                  ? {
                      instant: savedData.player.dailyTaskCount,
                      short: 0,
                      medium: 0,
                      long: 0,
                    } // 兼容旧存档
                  : { instant: 0, short: 0, medium: 0, long: 0 },
            lastTaskResetDate:
              savedData.player.lastTaskResetDate ||
              new Date().toISOString().split('T')[0],
            viewedAchievements: savedData.player.viewedAchievements || [],
            natalArtifactId: savedData.player.natalArtifactId || null,
            unlockedRecipes: savedData.player.unlockedRecipes || [], // 兼容旧存档，确保 unlockedRecipes 存在
            meditationHpRegenMultiplier:
              savedData.player.meditationHpRegenMultiplier ?? 1.0, // 兼容旧存档
            meditationBoostEndTime:
              savedData.player.meditationBoostEndTime ?? null, // 兼容旧存档
            statistics: savedData.player.statistics || {
              killCount: 0,
              meditateCount: 0,
              adventureCount: 0,
              equipCount: 0,
              petCount: 0,
              recipeCount: savedData.player.unlockedRecipes?.length || 0,
              artCount: savedData.player.cultivationArts?.length || 0,
              breakthroughCount: 0,
              secretRealmCount: 0,
            },
          };
          setPlayer(loadedPlayer);
          setLogs(savedData.logs || []);
          setGameStarted(true);
        } else {
          // 如果 hasSave 为 true 但 localStorage 中没有存档，更新状态
          // 这可以防止在重生后卡在加载页面
          setHasSave(false);
          setGameStarted(false);
        }
      } catch (error) {
        console.error('加载存档失败:', error);
        setHasSave(false);
        setGameStarted(false);
      }
    }
  }, [hasSave, player]);

  // 保存存档
  const saveGame = useCallback(
    (playerData: PlayerStats, logsData: LogEntry[]) => {
      try {
        const saveData = {
          player: playerData,
          logs: logsData,
          timestamp: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        if (settings.autoSave) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
      } catch (error) {
        console.error('保存存档失败:', error);
      }
    },
    [settings]
  );

  // 开始新游戏
  const handleStartGame = useCallback(
    (playerName: string, talentId: string) => {
      const newPlayer = createInitialPlayer(playerName, talentId);
      const initialTalent = TALENTS.find((t) => t.id === talentId);
      const initialLogs: LogEntry[] = [
        {
          id: `${Date.now()}-1-${Math.random().toString(36).substr(2, 9)}`,
          text: '欢迎来到修仙世界。你的长生之路就此开始。',
          type: 'special',
          timestamp: Date.now(),
        },
        {
          id: `${Date.now()}-2-${Math.random().toString(36).substr(2, 9)}`,
          text: `你天生拥有【${initialTalent?.name}】天赋。${initialTalent?.description}`,
          type: 'special',
          timestamp: Date.now(),
        },
      ];
      setPlayer(newPlayer);
      setLogs(initialLogs);
      setGameStarted(true);
      setHasSave(true);
      saveGame(newPlayer, initialLogs);
    },
    [saveGame]
  );

  // 自动保存 - 使用防抖机制，避免频繁保存导致卡顿
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (player && gameStarted && settings.autoSave) {
      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 设置新的定时器，延迟2秒保存
      saveTimeoutRef.current = setTimeout(() => {
        saveGame(player, logs);
      }, 2000);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [player, logs, settings.autoSave, saveGame, gameStarted]);

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
    saveGame,
  };
}
