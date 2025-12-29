import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerStats, LogEntry, GameSettings } from '../types';
import { createInitialPlayer } from '../utils/playerUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { TALENTS } from '../constants/index';
import {
  getCurrentSlotId,
  loadFromSlot,
  saveToSlot,
  getAllSlots,
  setCurrentSlotId,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';

export function useGameState() {
  const [hasSave, setHasSave] = useState(() => {
    try {
      // 先检查多存档槽位系统
      const currentSlotId = getCurrentSlotId();
      const slotSave = loadFromSlot(currentSlotId);
      if (slotSave) {
        return true;
      }
      // 兼容旧存档系统
      const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
      return saved !== null;
    } catch {
      return false;
    }
  });

  const [gameStarted, setGameStarted] = useState(hasSave);
  const [player, setPlayer] = useState<PlayerStats | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
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
      difficulty: 'normal', // 默认普通模式
    };
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 加载存档
  useEffect(() => {
    if (hasSave && !player) {
      try {
        // 优先从多存档槽位系统加载
        const currentSlotId = getCurrentSlotId();
        let savedData = loadFromSlot(currentSlotId);

        // 如果没有，尝试从旧存档系统加载（兼容性）
        if (!savedData) {
          const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
          if (saved) {
            savedData = JSON.parse(saved);
            // 如果从旧系统加载成功，迁移到槽位1
            if (savedData) {
              saveToSlot(1, savedData.player, savedData.logs || []);
              setCurrentSlotId(1);
            }
          }
        }

        if (savedData) {
          // 使用统一的兼容性处理函数
          const loadedPlayer = ensurePlayerStatsCompatibility(savedData.player);
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

        // 保存到当前槽位
        const currentSlotId = getCurrentSlotId();
        saveToSlot(currentSlotId, playerData, logsData);

        // 同时保存到旧存档系统（兼容性）
        localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(saveData));

        if (settings.autoSave) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }
      } catch (error) {
        console.error('保存存档失败:', error);
      }
    },
    [settings]
  );

  // 开始新游戏
  const handleStartGame = useCallback(
    (
      playerName: string,
      talentId: string,
      difficulty: GameSettings['difficulty']
    ) => {
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
      // 更新难度设置
      setSettings((prev) => ({ ...prev, difficulty }));
      const newSettings = { ...settings, difficulty };
      setPlayer(newPlayer);
      setLogs(initialLogs);
      setGameStarted(true);
      setHasSave(true);
      saveGame(newPlayer, initialLogs);
      // 保存设置
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    [saveGame, settings]
  );

  // 自动保存 - 使用防抖机制，避免频繁保存导致卡顿
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 使用 ref 存储最新的 player 和 logs，避免因对象引用变化而频繁触发保存
  const playerRef = useRef<PlayerStats | null>(player);
  const logsRef = useRef<LogEntry[]>(logs);
  // 记录上次保存时间，避免短时间内重复保存
  const lastSaveTimeRef = useRef<number>(0);

  // 更新 ref 当数据变化时
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    if (player && gameStarted && settings.autoSave) {
      // 检查是否距离上次保存超过5秒，避免短时间内重复保存
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      const debounceDelay = timeSinceLastSave > 5000 ? 2000 : 5000;

      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 设置新的定时器
      // 使用 ref 获取最新数据，避免闭包问题
      saveTimeoutRef.current = setTimeout(() => {
        const currentPlayer = playerRef.current;
        const currentLogs = logsRef.current;
        if (currentPlayer && currentLogs) {
          lastSaveTimeRef.current = Date.now();
          saveGame(currentPlayer, currentLogs);
        }
      }, debounceDelay);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
    // 当 player, logs, gameStarted 或 settings.autoSave 变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, logs, gameStarted, settings.autoSave, saveGame]);

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
