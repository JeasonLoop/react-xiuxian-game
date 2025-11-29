import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  className?: string;
}

// 限制日志数量，只显示最近500条，避免DOM过多导致卡顿
const MAX_LOGS = 500;

// 单个日志项组件，使用 memo 优化
const LogItem = React.memo<{ log: LogEntry }>(({ log }) => {
  const timeString = useMemo(
    () => new Date(log.timestamp).toLocaleTimeString(),
    [log.timestamp]
  );

  const logClassName = useMemo(() => {
    const baseClass = 'p-2 md:p-3 rounded border-l-2 font-serif text-xs md:text-sm lg:text-base leading-relaxed animate-fade-in';
    switch (log.type) {
      case 'normal':
        return `${baseClass} border-stone-600 text-stone-300 bg-ink-800/50`;
      case 'gain':
        return `${baseClass} border-mystic-jade text-emerald-100 bg-emerald-900/10`;
      case 'danger':
        return `${baseClass} border-mystic-blood text-red-100 bg-red-900/10`;
      case 'special':
        return `${baseClass} border-mystic-gold text-amber-100 bg-amber-900/10`;
      default:
        return `${baseClass} border-stone-600 text-stone-300 bg-ink-800/50`;
    }
  }, [log.type]);

  return (
    <div className={logClassName}>
      <span className="text-[10px] md:text-xs opacity-50 block mb-0.5 md:mb-1 font-mono">
        {timeString}
      </span>
      {log.text}
    </div>
  );
});

LogItem.displayName = 'LogItem';

const LogPanel: React.FC<Props> = ({ logs, className }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastLogIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef(true); // 跟踪是否应该自动滚动

  // 限制日志数量，只显示最近的部分
  const displayedLogs = useMemo(() => {
    if (logs.length <= MAX_LOGS) return logs;
    return logs.slice(-MAX_LOGS);
  }, [logs]);

  // 检查是否在底部
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 计算距离底部的距离
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // 如果距离底部小于等于 50px，认为在底部（增加容差，避免频繁切换）
    return distanceFromBottom <= 50;
  }, []);

  // 当有新日志时，如果用户在底部，自动滚动到底部
  useEffect(() => {
    const container = containerRef.current;
    if (!container || logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    const hasNewLog = lastLog.id !== lastLogIdRef.current;

    if (hasNewLog) {
      lastLogIdRef.current = lastLog.id;

      // 检查用户是否在底部
      const isAtBottom = checkIfAtBottom();
      shouldAutoScrollRef.current = isAtBottom;

      if (isAtBottom) {
        // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
        requestAnimationFrame(() => {
          endRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }

    // 延迟检查是否在底部，更新滚动按钮状态
    const timer = setTimeout(() => {
      const isAtBottom = checkIfAtBottom();
      setShowScrollButton(!isAtBottom);
      shouldAutoScrollRef.current = isAtBottom;
    }, 200);

    return () => clearTimeout(timer);
  }, [logs, checkIfAtBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom();
      setShowScrollButton(!isAtBottom);
      // 更新自动滚动状态：如果用户手动滚动到底部，则允许自动滚动
      shouldAutoScrollRef.current = isAtBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // 初始检查
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);

  // 初始化时滚动到底部
  useEffect(() => {
    if (displayedLogs.length > 0) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, []); // 只在组件挂载时执行一次

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });

    // 更新自动滚动状态
    shouldAutoScrollRef.current = true;

    // 延迟隐藏按钮，等待滚动完成
    setTimeout(() => {
      setShowScrollButton(false);
    }, 300);
  }, []);

  return (
    <div className={`flex-1 bg-ink-900 relative min-h-[200px] md:min-h-[300px] ${className || ''}`}>
      {/* 滚动容器 */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide relative"
      >
        <div className="absolute top-0 left-0 w-full h-8 md:h-12 bg-gradient-to-b from-ink-900 to-transparent pointer-events-none z-10" />

        <div className="p-3 md:p-6 space-y-2 md:space-y-4 pb-4">
          {displayedLogs.map((log) => (
            <LogItem key={log.id} log={log} />
          ))}
          <div ref={endRef} />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-8 md:h-12 bg-gradient-to-t from-ink-900 to-transparent pointer-events-none z-10" />
      </div>

      {/* 滚动到底部按钮 - 固定在日志窗口右下角，不随内容滚动 */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-[100]
                     w-9 h-9 md:w-11 md:h-11
                     bg-mystic-jade hover:bg-mystic-jade/90
                     text-white rounded-full
                     flex items-center justify-center
                     shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95
                     transition-all duration-200
                     border-2 border-white/20
                     cursor-pointer
                     pointer-events-auto"
          title="滚动到底部"
          aria-label="滚动到底部"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default React.memo(LogPanel);