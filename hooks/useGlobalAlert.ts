import { useState, useEffect } from 'react';
import { AlertType } from '../components/AlertModal';
import { setGlobalAlertSetter } from '../utils/toastUtils';
import { useAuthStore } from '../store/authStore';

export interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

/**
 * 全局 Alert 系统 Hook
 */
export function useGlobalAlert() {
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  useEffect(() => {
    setGlobalAlertSetter(setAlertState);
    // 登录/登出切换时丢弃上一个会话的弹窗，避免登录后旧提示再次出现。
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.isAuthenticated !== previous.isAuthenticated) setAlertState(null);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const closeAlert = () => setAlertState(null);

  return {
    alertState,
    setAlertState,
    closeAlert,
  };
}

