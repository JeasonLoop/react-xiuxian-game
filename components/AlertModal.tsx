import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Modal } from './common';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = '确定',
  onConfirm,
  showCancel = false,
  cancelText = '取消',
  onCancel,
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-600',
          titleColor: 'text-green-300',
          defaultTitle: '成功',
          buttonBg: 'bg-green-700 hover:bg-green-600 text-green-200 border-green-600',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-600',
          titleColor: 'text-red-300',
          defaultTitle: '错误',
          buttonBg: 'bg-red-700 hover:bg-red-600 text-red-200 border-red-600',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-600',
          titleColor: 'text-yellow-300',
          defaultTitle: '警告',
          buttonBg: 'bg-yellow-700 hover:bg-yellow-600 text-yellow-200 border-yellow-600',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-600',
          titleColor: 'text-blue-300',
          defaultTitle: '提示',
          buttonBg: 'bg-blue-700 hover:bg-blue-600 text-blue-200 border-blue-600',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Icon size={24} className={config.iconColor} />
          <span className={config.titleColor}>{displayTitle}</span>
        </div>
      }
      size="md"
      height="auto"
      zIndex={100}
      containerClassName={`${config.bgColor} ${config.borderColor} border-2`}
      showHeaderBorder={false}
      footer={
        <div className="flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded border border-stone-600 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded border transition-colors ${config.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </Modal>
  );
};

export default AlertModal;
