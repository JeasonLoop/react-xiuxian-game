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
import { initializeEventTemplateLibrary } from '../services/adventureTemplateService';
import {
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';
import { apiService } from '../services/apiService';
import { showSuccess, showError } from '../utils/toastUtils';

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

// 检查是否有存档 (不再使用本地逻辑，初始为 false)
function checkHasSave(): boolean {
  return false;
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
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  startNewGame: (
    playerName: string,
    talentId: string,
    difficulty: GameSettings['difficulty']
  ) => Promise<void>;
  checkCloudSave: () => Promise<void>;
}

// 使用 subscribeWithSelector 中间件来支持选择性订阅
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    hasSave: checkHasSave(),
    gameStarted: false,
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

    // 检查云端存档
    checkCloudSave: async () => {
      if (!apiService.isLoggedIn()) {
        set({ hasSave: false });
        return;
      }
      try {
        const save = await apiService.getCloudSave();
        if (save) {
          set({ hasSave: true });
        } else {
          set({ hasSave: false });
        }
      } catch (error) {
        console.error('检查云存档失败:', error);
        set({ hasSave: false });
      }
    },

    // 保存游戏 (上传到云端)
    saveGame: async () => {
      const state = get();
      if (!state.player) return;

      try {
        const saveData = {
          player: state.player,
          logs: state.logs,
          timestamp: Date.now(),
        };

        const saveDataStr = JSON.stringify(saveData);
        // 生成摘要
        const summary = `${state.player.name} - ${state.player.realm}`;

        // 始终保存到默认槽位 (简化逻辑)
        await apiService.uploadSave(saveDataStr, summary);
        console.log('游戏已保存到云端');

        // 保存设置
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(state.settings)
        );
      } catch (error) {
        console.error('保存存档失败:', error);
        showError('云端保存失败，请检查网络连接');
      }
    },

    // 加载游戏 (从云端下载)
    loadGame: async () => {
      const state = get();
      if (!state.hasSave) return;

      try {
        // 重新生成事件模板库
        initializeEventTemplateLibrary(true);
        console.log('加载存档时重新生成事件模板库');

        const save = await apiService.getCloudSave();

        if (save && save.saveData) {
            const savedData = JSON.parse(save.saveData);

            // 使用统一的兼容性处理函数
            const loadedPlayer = ensurePlayerStatsCompatibility(savedData.player);
            set({
                player: loadedPlayer,
                logs: savedData.logs || [],
                gameStarted: true,
            });
            console.log('云端存档加载成功');
        } else {
          set({
            hasSave: false,
            gameStarted: false,
          });
        }
      } catch (error) {
        console.error('加载存档失败:', error);
        showError('加载云端存档失败');
        set({
          hasSave: false,
          gameStarted: false,
        });
      }
    },

    // 开始新游戏
    startNewGame: async (playerName, talentId, difficulty) => {
      const state = get();

      // 重新生成事件模板库
      initializeEventTemplateLibrary(true);
      console.log('开始新游戏时重新生成事件模板库');

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
        const saveDataStr = JSON.stringify(saveData);
        const summary = `${newPlayer.name} - ${newPlayer.realm}`;

        await apiService.uploadSave(saveDataStr, summary);

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

  // 计算防抖延迟：延长到 30秒/10秒，减少后端压力
  const timeSinceLastSave = Date.now() - lastSaveTime;
  const debounceDelay = timeSinceLastSave > 30000 ? 5000 : 10000;

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

// 订阅 player 状态变化 (仅用于记录状态变化，不再触发高频防抖保存)
useGameStore.subscribe(
  (state) => state.player,
  (player, prevPlayer) => {
    // 可以在这里标记数据已脏，但不再直接调用 debouncedSave
    // if (player && prevPlayer && player !== prevPlayer) {
    //   debouncedSave();
    // }
  },
  { equalityFn: Object.is }
);

// 启动定时自动保存 (每5分钟)
if (typeof window !== 'undefined') {
  setInterval(() => {
    console.log('触发定时自动保存 (5分钟)');
    performSave();
  }, 300000); // 5分钟 = 300000ms
}

// 页面卸载前保存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // 清除待执行的防抖保存
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    // 立即执行保存 (尝试，但不保证在关闭前完成异步请求)
    performSave();
  });

  // 页面可见性变化时保存
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
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
