import React, { useLayoutEffect, useRef, useState } from 'react';

export interface TabItem {
  /** 唯一标识 */
  key: string;
  /** 显示文案 */
  label: string;
  /** 可选图标 */
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  /** 当前激活的 tab key */
  activeKey: string;
  /** 切换回调 */
  onChange: (key: string) => void;
  /** pill：胶囊按钮组；underline：底部金线滑动指示条 */
  variant?: 'pill' | 'underline';
  /** 附加样式 */
  className?: string;
}

/**
 * 通用标签条（M2.4）
 * 统一 Tab 交互：激活项提亮、hover 反馈、指示条滑动过渡（transform 动画防抖动）。
 * 内容区切换动画由调用处配合 .tab-content-anim 类实现。
 */
const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeKey,
  onChange,
  variant = 'underline',
  className = '',
}) => {
   const containerRef = useRef<HTMLDivElement>(null);
   // 滑动指示条位置（underline 变体专用）
   const [indicator, setIndicator] = useState({ left: 0, width: 0 });
 
   // 激活项变化时重新测量指示条位置
   useLayoutEffect(() => {
     if (variant !== 'underline') return;
     const container = containerRef.current;
     if (!container) return;
 
     const measure = () => {
       const buttons = container.querySelectorAll<HTMLButtonElement>('[data-tab]');
       const index = tabs.findIndex((t) => t.key === activeKey);
       const btn = buttons[index];
       if (btn) {
         setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
       }
     };
 
     measure();
     // 容器尺寸变化（窗口 resize / 移动端旋转 / 弹窗断点切换）时重新测量，
     // 避免指示条停留在旧坐标
     const observer = new ResizeObserver(measure);
     observer.observe(container);
     return () => observer.disconnect();
   }, [activeKey, tabs, variant]);
 
   // 键盘左右方向键切换
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
     e.preventDefault();
     const index = tabs.findIndex((t) => t.key === activeKey);
     const delta = e.key === 'ArrowRight' ? 1 : -1;
     const next = tabs[(index + delta + tabs.length) % tabs.length];
     if (next) onChange(next.key);
   };

  if (variant === 'pill') {
    return (
      <div
        ref={containerRef}
        role="tablist"
        onKeyDown={handleKeyDown}
        className={`flex bg-stone-800 p-0.5 rounded border border-stone-700 text-xs ${className}`}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              data-tab={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                active
                  ? 'bg-mystic-gold text-stone-950 font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={`relative flex border-b border-stone-700 ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            data-tab={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`px-6 py-2 font-serif font-bold transition-colors ${
              active
                ? 'text-mystic-gold'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
      {/* 金色滑动指示条：只动 transform，不触发重排 */}
      <div
        aria-hidden
        className="absolute bottom-0 h-0.5 bg-mystic-gold"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
          transition:
            'transform var(--dur-base) var(--ease-spring), width var(--dur-base) var(--ease-out)',
        }}
      />
    </div>
  );
};

export default TabBar;
