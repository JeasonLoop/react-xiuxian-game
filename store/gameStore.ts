/**
 * Game Store - Zustand 游戏核心状态管理
 * 管理玩家数据、日志、设置、存档相关状态
 * 使用 subscribe 订阅状态变化来触发自动保存
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PlayerStats, LogEntry, GameSettings } from '../types';
import { createInitialPlayer } from '../utils/playerUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { TALENTS } from '../constants/index';
import {
  getCurrentSlotId,
  loadFromSlot,
  saveToSlot,
  setCurrentSlotId,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';

// 默认游戏设置
const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 70,
  musicVolume: 50,
  autoSave: true,
  animationSpeed: 'normal',
  language: 'zh',
  difficulty: 'normal',
};

// 加载初始设置
function loadInitialSettings(): GameSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

// 检查是否有存档
function checkHasSave(): boolean {
  try {
    const currentSlotId = getCurrentSlotId();
    const slotSave = loadFromSlot(currentSlotId);
    if (slotSave) {
      return true;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
    return saved !== null;
  } catch {
    return false;
  }
}

// Store 状态接口
interface GameState {
  // 状态
  hasSave: boolean;
  gameStarted: boolean;
  player: PlayerStats | null;
  settings: GameSettings;
  logs: LogEntry[];

  // 状态 Setters
  setHasSave: (hasSave: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setPlayer: (
    player:
      | PlayerStats
      | null
      | ((prev: PlayerStats | null) => PlayerStats | null)
  ) => void;
  setSettings: (
    settings: GameSettings | ((prev: GameSettings) => GameSettings)
  ) => void;
  setLogs: (logs: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void;

  // Actions
  addLog: (text: string, type: LogEntry['type']) => void;
  saveGame: () => void;
  loadGame: () => void;
  startNewGame: (
    playerName: string,
    talentId: string,
    difficulty: GameSettings['difficulty']
  ) => void;
}

// 使用 subscribeWithSelector 中间件来支持选择性订阅
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    hasSave: checkHasSave(),
    gameStarted: checkHasSave(),
    player: null,
    settings: loadInitialSettings(),
    logs: [],

    // 状态 Setters
    setHasSave: (hasSave) => set({ hasSave }),

    setGameStarted: (gameStarted) => set({ gameStarted }),

    setPlayer: (playerOrUpdater) => {
      set((state) => {
        const newPlayer =
          typeof playerOrUpdater === 'function'
            ? playerOrUpdater(state.player)
            : playerOrUpdater;
        return { player: newPlayer };
      });
    },

    setSettings: (settingsOrUpdater) => {
      set((state) => {
        const newSettings =
          typeof settingsOrUpdater === 'function'
            ? settingsOrUpdater(state.settings)
            : settingsOrUpdater;
        // 保存设置到 localStorage
        try {
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify(newSettings)
          );
        } catch (error) {
          console.error('保存设置失败:', error);
        }
        return { settings: newSettings };
      });
    },

    setLogs: (logsOrUpdater) => {
      set((state) => {
        const newLogs =
          typeof logsOrUpdater === 'function'
            ? logsOrUpdater(state.logs)
            : logsOrUpdater;
        return { logs: newLogs };
      });
    },

    // 添加日志
    addLog: (text, type) => {
      set((state) => ({
        logs: [
          ...state.logs,
          {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text,
            type,
            timestamp: Date.now(),
          },
        ],
      }));
    },

    // 保存游戏
    saveGame: () => {
      const state = get();
      if (!state.player) return;

      try {
        const saveData = {
          player: state.player,
          logs: state.logs,
          timestamp: Date.now(),
        };

        // 保存到当前槽位
        const currentSlotId = getCurrentSlotId();
        saveToSlot(currentSlotId, state.player, state.logs);

        // 同时保存到旧存档系统（兼容性）
        localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(saveData));

        // 保存设置
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(state.settings)
        );
      } catch (error) {
        console.error('保存存档失败:', error);
      }
    },

    // 加载游戏
    loadGame: () => {
      const state = get();
      if (!state.hasSave) return;

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
          set({
            player: loadedPlayer,
            logs: savedData.logs || [],
            gameStarted: true,
          });
        } else {
          set({
            hasSave: false,
            gameStarted: false,
          });
        }
      } catch (error) {
        console.error('加载存档失败:', error);
        set({
          hasSave: false,
          gameStarted: false,
        });
      }
    },

    // 开始新游戏
    startNewGame: (playerName, talentId, difficulty) => {
      const state = get();
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

      const newSettings = { ...state.settings, difficulty };

      set({
        player: newPlayer,
        logs: initialLogs,
        settings: newSettings,
        gameStarted: true,
        hasSave: true,
      });

      // 立即保存新游戏
      try {
        const saveData = {
          player: newPlayer,
          logs: initialLogs,
          timestamp: Date.now(),
        };
        const currentSlotId = getCurrentSlotId();
        saveToSlot(currentSlotId, newPlayer, initialLogs);
        localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(saveData));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      } catch (error) {
        console.error('保存游戏失败:', error);
      }
    },
  }))
);

// ============================================
// 使用 subscribe 订阅状态变化，实现防抖自动保存
// ============================================

// 防抖保存的状态管理
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime = 0;

// 执行保存的函数
function performSave() {
  const state = useGameStore.getState();
  if (state.player && state.gameStarted && state.settings.autoSave) {
    state.saveGame();
    lastSaveTime = Date.now();
  }
}

// 防抖保存函数
function debouncedSave() {
  const state = useGameStore.getState();

  // 检查是否应该保存
  if (!state.player || !state.gameStarted || !state.settings.autoSave) {
    return;
  }

  // 计算防抖延迟：如果距离上次保存超过5秒，使用较短的延迟
  const timeSinceLastSave = Date.now() - lastSaveTime;
  const debounceDelay = timeSinceLastSave > 5000 ? 1000 : 3000;

  // 清除之前的定时器
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
  }

  // 设置新的定时器
  saveTimeoutId = setTimeout(() => {
    performSave();
    saveTimeoutId = null;
  }, debounceDelay);
}

// 订阅 player 状态变化
useGameStore.subscribe(
  (state) => state.player,
  (player, prevPlayer) => {
    // 只在 player 真正变化时触发（排除初始加载）
    if (player && prevPlayer && player !== prevPlayer) {
      debouncedSave();
    }
  },
  { equalityFn: Object.is }
);

// 订阅 logs 状态变化（可选，日志变化频繁，可以考虑不单独订阅）
useGameStore.subscribe(
  (state) => state.logs,
  (logs, prevLogs) => {
    // 只在日志真正增加时触发（不是初始加载或替换）
    if (logs && prevLogs && logs.length > prevLogs.length) {
      debouncedSave();
    }
  },
  { equalityFn: Object.is }
);

// 页面卸载前保存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // 清除待执行的防抖保存
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    // 立即执行保存
    performSave();
  });

  // 页面可见性变化时保存（用户切换标签页或最小化窗口时）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 清除待执行的防抖保存，立即保存
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
        saveTimeoutId = null;
      }
      performSave();
    }
  });
}

// 导出便捷 hooks
export const usePlayer = () => useGameStore((state) => state.player);
export const useSettings = () => useGameStore((state) => state.settings);
export const useLogs = () => useGameStore((state) => state.logs);
export const useGameStarted = () => useGameStore((state) => state.gameStarted);
