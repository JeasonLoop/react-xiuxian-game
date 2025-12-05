import React from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

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
  if (!isOpen) return null;

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
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-600',
          titleColor: 'text-red-300',
          defaultTitle: '错误',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-600',
          titleColor: 'text-yellow-300',
          defaultTitle: '警告',
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
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-stone-800 rounded-lg border-2 ${config.borderColor} shadow-2xl max-w-md w-full ${config.bgColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 图标和标题 */}
          <div className="flex items-start gap-4 mb-4">
            <Icon size={32} className={`${config.iconColor} flex-shrink-0 mt-1`} />
            <div className="flex-1">
              <h3 className={`text-xl font-serif font-bold ${config.titleColor} mb-2`}>
                {displayTitle}
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 mt-6">
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
              className={`px-4 py-2 rounded border transition-colors ${
                type === 'success'
                  ? 'bg-green-700 hover:bg-green-600 text-green-200 border-green-600'
                  : type === 'error'
                    ? 'bg-red-700 hover:bg-red-600 text-red-200 border-red-600'
                    : type === 'warning'
                      ? 'bg-yellow-700 hover:bg-yellow-600 text-yellow-200 border-yellow-600'
                      : 'bg-blue-700 hover:bg-blue-600 text-blue-200 border-blue-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

