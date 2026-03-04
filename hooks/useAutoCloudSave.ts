import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { showError } from '../utils/toastUtils';

export function useAutoCloudSave() {
  const gameStarted = useGameStore((state) => state.gameStarted);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!gameStarted || !isAuthenticated) return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (!state.player) return;

      cloudSaveService
        .pushSave({
          player: state.player,
          logs: state.logs,
          timestamp: Date.now(),
        })
        .catch((err) => {
          showError(err instanceof Error ? err.message : '云端自动保存失败，请稍后重试');
        });
    }, 60000);

    return () => clearInterval(interval);
  }, [gameStarted, isAuthenticated]);
}
