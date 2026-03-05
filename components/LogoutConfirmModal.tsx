import React from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Modal } from './common';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <LogOut size={20} className="text-red-400" />
          <span>退出登录</span>
        </div>
      }
      size="sm"
      height="auto"
      zIndex={100}
      showCloseButton={true}
    >
      <div className="flex flex-col items-center py-4 text-center">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-200 mb-2">确定要退出登录吗？</h3>
        <p className="text-stone-400 text-sm leading-relaxed mb-6">
          退出后本地进度将不再同步到该账号。<br />
          请确保您的存档已上传至云端。
        </p>
        
        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg border border-stone-600 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg border border-red-600 transition-colors font-medium shadow-lg shadow-red-900/20"
          >
            确认退出
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutConfirmModal;
