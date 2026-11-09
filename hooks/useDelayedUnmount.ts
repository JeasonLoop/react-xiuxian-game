import { useEffect, useRef, useState } from 'react';

/**
 * 弹窗延迟卸载 Hook
 * isOpen 变为 false 后保持组件挂载一小段时间，让退场动画播完再真正卸载。
 * 快速重新打开时（退场动画未结束）会取消卸载计时并立即恢复挂载。
 *
 * @param isOpen     弹窗是否打开
 * @param closeDelay 关闭动画保持时长（毫秒），需与 CSS 退场过渡时长匹配
 * @returns mounted 是否应挂载；state 当前动画状态（'open' | 'closed'），
 *          用于驱动 data-state 属性切换出入场样式
 */
export function useDelayedUnmount(
  isOpen: boolean,
  closeDelay = 220
): { mounted: boolean; state: 'open' | 'closed' } {
  const [mounted, setMounted] = useState(isOpen);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 重新打开时立即恢复挂载（render 期间派生状态，React 官方推荐模式）
  if (isOpen && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (isOpen) {
      // 打开状态不安排卸载；依赖变化时 cleanup 会清掉遗留的关闭计时
      return;
    }
    // 关闭：播完退场动画后卸载
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setMounted(false);
    }, closeDelay);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, closeDelay]);

  return { mounted, state: isOpen ? 'open' : 'closed' };
}
