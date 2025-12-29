import { useState, useEffect } from 'react';
import { AlertType } from '../components/AlertModal';
import { setGlobalAlertSetter } from '../utils/toastUtils';

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
    setGlobalAlertSetter((alert) => {
      setAlertState(alert);
    });
  }, []);

  const closeAlert = () => setAlertState(null);

  return {
    alertState,
    setAlertState,
    closeAlert,
  };
}

