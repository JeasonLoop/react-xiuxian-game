import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { showError } from '../utils/toastUtils';

const AUTO_SAVE_ERROR_THROTTLE_MS = 5 * 60 * 1000; // 5 分钟内不重复提示

export function useAutoCloudSave() {
  const gameStarted = useGameStore((state) => state.gameStarted);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastErrorToastRef = useRef<number>(0);

  useEffect(() => {
    if (!gameStarted || !isAuthenticated) return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (!state.player) return;

      cloudSaveService
        .pushSave({
          player: state.player,
          logs: state.logs,
          marketItems: useUIStore.getState().marketItems,
          timestamp: Date.now(),
        })
        .catch((err) => {
          const now = Date.now();
          if (now - lastErrorToastRef.current < AUTO_SAVE_ERROR_THROTTLE_MS) return;
          lastErrorToastRef.current = now;
          showError(
            err instanceof Error ? err.message : '云端自动保存失败，请稍后重试'
          );
        });
    }, 60000);

    return () => clearInterval(interval);
  }, [gameStarted, isAuthenticated]);
}
