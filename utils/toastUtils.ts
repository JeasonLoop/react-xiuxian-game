/**
 * Alert 弹窗工具函数
 * 用于显示提示弹窗，替代 alert 和轻提示
 */

import { AlertType } from '../components/AlertModal';

// 全局 alert 状态管理
interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

let globalAlertSetter: ((alert: AlertState | null) => void) | null = null;

/**
 * 设置全局 alert setter
 */
export const setGlobalAlertSetter = (
  setter: (alert: AlertState | null) => void
) => {
  globalAlertSetter = setter;
};

/**
 * 显示 alert 弹窗
 * @param message 提示文本
 * @param type 提示类型: 'success' | 'error' | 'info' | 'warning'
 * @param title 标题（可选）
 * @param onConfirm 确认回调（可选）
 * @param showCancel 是否显示取消按钮（可选）
 */
export const showAlert = (
  message: string,
  type: AlertType = 'info',
  title?: string,
  onConfirm?: () => void,
  showCancel: boolean = false
) => {
  if (globalAlertSetter) {
    globalAlertSetter({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
    });
  } else {
    // 如果没有设置全局 setter，降级使用 alert（开发阶段）
    console.warn('Alert setter not initialized, using alert fallback:', message);
    alert(message);
  }
};

/**
 * 显示成功提示
 */
export const showSuccess = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'success', title, onConfirm);
};

/**
 * 显示错误提示
 */
export const showError = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'error', title, onConfirm);
};

/**
 * 显示警告提示
 */
export const showWarning = (
  message: string,
  title?: string,
  onConfirm?: () => void,
  showCancel: boolean = false
) => {
  showAlert(message, 'warning', title, onConfirm, showCancel);
};

/**
 * 显示普通提示
 */
export const showInfo = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'info', title, onConfirm);
};

/**
 * 显示确认对话框
 */
export const showConfirm = (
  message: string,
  title: string = '确认',
  onConfirm?: () => void,
  onCancel?: () => void
) => {
  if (globalAlertSetter) {
    globalAlertSetter({
      isOpen: true,
      type: 'warning',
      title,
      message,
      onConfirm,
      showCancel: true,
      onCancel,
    });
  } else {
    // 降级使用原生 confirm
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && onConfirm) {
      onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }
  }
};

