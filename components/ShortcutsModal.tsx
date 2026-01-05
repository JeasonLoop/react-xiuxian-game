import React, { useState, useEffect, useCallback } from 'react';
import { Keyboard, Edit2, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutConfig } from '../types';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DESCRIPTIONS,
  checkShortcutConflict,
} from '../utils/shortcutUtils';
import { showError, showSuccess } from '../utils/toastUtils';
import { Modal } from './common';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  customShortcuts?: Record<string, KeyboardShortcutConfig>;
  onUpdateShortcuts?: (shortcuts: Record<string, KeyboardShortcutConfig>) => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  customShortcuts,
  onUpdateShortcuts,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedShortcuts, setEditedShortcuts] = useState<
    Record<string, KeyboardShortcutConfig>
  >({});
  const [conflictActionId, setConflictActionId] = useState<string | null>(null);

  // 初始化编辑状态
  useEffect(() => {
    if (isOpen) {
      setEditedShortcuts(customShortcuts || {});
      setEditingActionId(null);
      setConflictActionId(null);
    }
  }, [isOpen, customShortcuts]);

  // 获取当前快捷键配置（合并默认和自定义）
  const getCurrentShortcut = useCallback(
    (actionId: string): KeyboardShortcutConfig => {
      return editedShortcuts[actionId] || DEFAULT_SHORTCUTS[actionId] || { key: '' };
    },
    [editedShortcuts]
  );

  // 开始编辑快捷键
  const handleStartEdit = (actionId: string) => {
    setEditingActionId(actionId);
    setConflictActionId(null);
  };

  // 处理键盘输入
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, actionId: string) => {
      if (editingActionId !== actionId) return;

      // 忽略修饰键本身
      if (
        event.key === 'Control' ||
        event.key === 'Shift' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newShortcut: KeyboardShortcutConfig = {
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      };

      // 检查冲突
      const allShortcuts = { ...DEFAULT_SHORTCUTS, ...editedShortcuts };
      const conflictId = checkShortcutConflict(
        newShortcut,
        actionId,
        allShortcuts
      );

      if (conflictId) {
        setConflictActionId(conflictId);
        showError(
          `快捷键冲突！该快捷键已被 "${SHORTCUT_DESCRIPTIONS[conflictId]?.description || conflictId}" 使用`
        );
        return;
      }

      setConflictActionId(null);
      setEditedShortcuts((prev) => ({
        ...prev,
        [actionId]: newShortcut,
      }));
      setEditingActionId(null);
    },
    [editingActionId, editedShortcuts]
  );

  // 全局键盘事件处理（用于编辑模式）
  useEffect(() => {
    if (!isEditing || !editingActionId) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // 忽略修饰键本身
      if (
        event.key === 'Control' ||
        event.key === 'Shift' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newShortcut: KeyboardShortcutConfig = {
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      };

      // 检查冲突
      const allShortcuts = { ...DEFAULT_SHORTCUTS, ...editedShortcuts };
      const conflictId = checkShortcutConflict(
        newShortcut,
        editingActionId,
        allShortcuts
      );

      if (conflictId) {
        setConflictActionId(conflictId);
        showError(
          `快捷键冲突！该快捷键已被 "${SHORTCUT_DESCRIPTIONS[conflictId]?.description || conflictId}" 使用`
        );
        return;
      }

      setConflictActionId(null);
      setEditedShortcuts((prev) => ({
        ...prev,
        [editingActionId]: newShortcut,
      }));
      setEditingActionId(null);
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [isEditing, editingActionId, editedShortcuts]);

  // 重置单个快捷键
  const handleResetOne = (actionId: string) => {
    setEditedShortcuts((prev) => {
      const newShortcuts = { ...prev };
      delete newShortcuts[actionId];
      return newShortcuts;
    });
    setConflictActionId(null);
  };

  // 重置所有快捷键
  const handleResetAll = () => {
    setEditedShortcuts({});
    setConflictActionId(null);
    showSuccess('已重置所有快捷键为默认值');
  };

  // 保存快捷键
  const handleSave = () => {
    if (onUpdateShortcuts) {
      onUpdateShortcuts(editedShortcuts);
      showSuccess('快捷键设置已保存');
      setIsEditing(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditedShortcuts(customShortcuts || {});
    setEditingActionId(null);
    setConflictActionId(null);
    setIsEditing(false);
  };

  // 按分类分组快捷键
  const shortcutsByCategory = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const categories = Object.keys(shortcutsByCategory);

  // 获取 actionId（从 shortcuts 中提取，需要匹配）
  const getActionId = (shortcut: KeyboardShortcut): string | null => {
    for (const [actionId, desc] of Object.entries(SHORTCUT_DESCRIPTIONS)) {
      if (
        desc.description === shortcut.description &&
        desc.category === shortcut.category
      ) {
        return actionId;
      }
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="键盘快捷键"
      titleIcon={<Keyboard size={20} className="text-mystic-gold" />}
      titleExtra={
        <div className="flex items-center gap-2">
          {!isEditing ? (
            onUpdateShortcuts && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-sm transition-colors"
              >
                <Edit2 size={16} />
                <span>编辑</span>
              </button>
            )
          ) : (
            <>
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-sm transition-colors"
              >
                <RotateCcw size={16} />
                <span>重置全部</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 bg-mystic-gold hover:bg-yellow-600 text-stone-900 rounded text-sm transition-colors font-semibold"
              >
                <Save size={16} />
                <span>保存</span>
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-sm transition-colors"
              >
                取消
              </button>
            </>
          )}
        </div>
      }
      size="2xl"
      height="full"
      closeOnEsc={!isEditing}
    >
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="font-bold text-mystic-gold mb-3 text-lg">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcutsByCategory[category].map((shortcut, index) => {
                const actionId = getActionId(shortcut);
                const isEditingThis = editingActionId === actionId;
                const currentConfig = actionId
                  ? getCurrentShortcut(actionId)
                  : null;
                const displayShortcut = currentConfig
                  ? {
                      key: currentConfig.key,
                      ctrl: currentConfig.ctrl,
                      shift: currentConfig.shift,
                      alt: currentConfig.alt,
                      meta: currentConfig.meta,
                      action: shortcut.action,
                      description: shortcut.description,
                      category: shortcut.category,
                    }
                  : shortcut;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 bg-stone-900/50 border rounded transition-colors ${
                      isEditingThis
                        ? 'border-mystic-gold border-2'
                        : conflictActionId === actionId
                        ? 'border-red-500 border-2'
                        : 'border-stone-700'
                    }`}
                  >
                    <span className="text-stone-300 flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-2">
                      {isEditing && actionId ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(actionId)}
                            onKeyDown={(e) => {
                              if (isEditingThis) {
                                handleKeyDown(e, actionId);
                              }
                            }}
                            onBlur={() => {
                              if (isEditingThis) {
                                setEditingActionId(null);
                              }
                            }}
                            className={`px-3 py-1.5 border rounded text-sm font-mono transition-colors min-w-[120px] ${
                              isEditingThis
                                ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold outline-none ring-2 ring-mystic-gold'
                                : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600'
                            }`}
                            tabIndex={0}
                            autoFocus={isEditingThis}
                          >
                            {isEditingThis
                              ? '按下按键...'
                              : formatShortcut(displayShortcut)}
                          </button>
                          <button
                            onClick={() => actionId && handleResetOne(actionId)}
                            className="p-1.5 text-stone-400 hover:text-stone-200 transition-colors"
                            title="重置为默认值"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </>
                      ) : (
                        <kbd className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded text-sm font-mono text-mystic-gold">
                          {formatShortcut(displayShortcut)}
                        </kbd>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-stone-700 space-y-2">
          {isEditing && (
            <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">编辑模式提示：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>点击快捷键按钮，然后按下您想要设置的按键组合</li>
                    <li>如果快捷键冲突，会显示错误提示</li>
                    <li>点击重置按钮可以恢复单个快捷键为默认值</li>
                    <li>点击"重置全部"可以恢复所有快捷键为默认值</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-stone-500 text-center">
            提示：在输入框中输入时，快捷键会被禁用（ESC 键除外）
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutsModal;
