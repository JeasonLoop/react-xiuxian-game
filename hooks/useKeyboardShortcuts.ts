import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * 键盘快捷键处理 Hook
 * @param shortcuts 快捷键配置数组
 * @param enabled 是否启用快捷键（默认 true）
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 如果快捷键被禁用，直接返回
      if (!enabled) return;

      // 如果用户正在输入（input、textarea、contenteditable），不处理快捷键
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // 允许 ESC 键关闭弹窗，即使正在输入
        if (event.key === 'Escape') {
          // 继续处理 ESC 键
        } else {
          return;
        }
      }

      // 遍历所有快捷键配置
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
}

/**
 * 格式化快捷键显示文本
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');

  // 特殊键的显示名称
  const keyDisplay = shortcut.key === 'Escape'
    ? 'ESC'
    : shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return parts.join(' + ');
}

