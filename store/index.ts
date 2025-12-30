/**
 * Store 统一导出
 * 便于其他模块导入 zustand stores
 */

// Game Store - 游戏核心状态
export {
  useGameStore,
  usePlayer,
  useSettings,
  useLogs,
  useGameStarted,
} from './gameStore';

// UI Store - UI 状态
export {
  useUIStore,
  useModals,
  useAutoFeatures,
  useLoading,
  useCooldown,
} from './uiStore';
