/**
 * 通用弹窗组件 Modal
 * 提供统一的弹窗结构、动画、样式
 * 用于替代各个弹窗组件中重复的弹窗容器代码
 */

import React, { useEffect, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

// 弹窗尺寸配置
const sizeClasses = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
  '2xl': 'md:max-w-2xl',
  '3xl': 'md:max-w-3xl',
  '4xl': 'md:max-w-4xl',
  full: 'md:max-w-[95vw]',
};

// 弹窗高度配置
const heightClasses = {
  auto: 'md:h-auto md:max-h-[90vh]',
  sm: 'h-[50vh] md:h-auto md:max-h-[50vh]',
  md: 'h-[70vh] md:h-auto md:max-h-[70vh]',
  lg: 'h-[80vh] md:h-auto md:max-h-[80vh]',
  xl: 'h-[85vh] md:h-auto md:max-h-[85vh]',
  full: 'h-[90vh] md:h-auto md:max-h-[90vh]',
};

export interface ModalProps {
  /** 弹窗是否打开 */
  isOpen: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 弹窗标题 */
  title: string | React.ReactNode;
  /** 弹窗内容 */
  children: React.ReactNode;
  /** 弹窗宽度尺寸 */
  size?: keyof typeof sizeClasses;
  /** 弹窗高度尺寸 */
  height?: keyof typeof heightClasses;
  /** 底部操作区域 */
  footer?: React.ReactNode;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlayClick?: boolean;
  /** 按 ESC 是否关闭 */
  closeOnEsc?: boolean;
  /** 自定义标题图标 */
  titleIcon?: React.ReactNode;
  /** 标题右侧额外内容 */
  titleExtra?: React.ReactNode;
  /** 头部下方的额外内容（如 Tab 栏） */
  subHeader?: React.ReactNode;
  /** 自定义容器类名 */
  containerClassName?: string;
  /** 自定义内容区域类名 */
  contentClassName?: string;
  /** 自定义头部类名 */
  headerClassName?: string;
  /** 自定义底部类名 */
  footerClassName?: string;
  /** z-index 层级 */
  zIndex?: number;
  /** 是否显示头部边框 */
  showHeaderBorder?: boolean;
  /** 是否显示底部边框 */
  showFooterBorder?: boolean;
  /** 头部内边距 */
  headerPadding?: string;
  /** 内容区内边距 */
  contentPadding?: string;
}

/**
 * 通用弹窗组件
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="设置"
 *   size="md"
 * >
 *   <div>弹窗内容</div>
 * </Modal>
 * ```
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  height = 'full',
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  titleIcon,
  titleExtra,
  subHeader,
  containerClassName = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  zIndex = 51,
  showHeaderBorder = true,
  showFooterBorder = true,
  headerPadding = 'p-3 md:p-4',
  contentPadding = 'p-4 md:p-6',
}) => {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  // 注册/注销键盘事件
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 如果不打开则不渲染
  if (!isOpen) return null;

  // 点击遮罩层处理
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 阻止内容区域点击冒泡
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 touch-manipulation `}
      style={{ zIndex }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          bg-stone-800
          rounded-t-2xl md:rounded-lg
          border-0 md:border border-stone-700
          w-full ${sizeClasses[size]} ${heightClasses[height]}
          flex flex-col
          shadow-2xl shadow-black/50
          transform transition-all duration-200 ease-out
          ${containerClassName}
        `}
        onClick={handleContentClick}
      >
        {/* 头部区域 */}
        <div
          className={`
            bg-stone-800
            ${showHeaderBorder ? 'border-b border-stone-700' : ''}
            ${headerPadding}
            flex justify-between items-center
            rounded-t-2xl md:rounded-t-lg
            shrink-0
            ${headerClassName}
          `}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {titleIcon && (
                <span className="text-mystic-gold shrink-0">{titleIcon}</span>
              )}
              <h2
                id="modal-title"
                className="text-lg md:text-xl font-serif text-mystic-gold truncate"
              >
                {title}
              </h2>
            </div>
            {titleExtra && <div className="shrink-0 ml-2">{titleExtra}</div>}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors shrink-0 -mr-2"
              aria-label="关闭"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* 次级头部（Tab 栏等） */}
        {subHeader && (
          <div className="shrink-0">
            {subHeader}
          </div>
        )}

        {/* 内容区域 */}
        <div
          className={`
            modal-scroll-container modal-scroll-content
            ${contentPadding}
            flex-1 min-h-0
            ${contentClassName}
          `}
        >
          {children}
        </div>

        {/* 底部区域 */}
        {footer && (
          <div
            className={`
              ${showFooterBorder ? 'border-t border-stone-700' : ''}
              p-3 md:p-4
              shrink-0
              bg-stone-800
              rounded-b-lg
              ${footerClassName}
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body
  return createPortal(modalContent, document.body);
};

export default memo(Modal);
