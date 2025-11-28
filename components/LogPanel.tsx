import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  className?: string;
}

const LogPanel: React.FC<Props> = ({ logs, className }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 检查是否在底部
  const checkIfAtBottom = () => {
    const container = containerRef.current;
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    // 计算距离底部的距离
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // 如果距离底部小于等于 5px，认为在底部
    return distanceFromBottom <= 5;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 自动滚动到底部
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // 延迟检查是否在底部，确保滚动完成后再判断
    const timer = setTimeout(() => {
      const isAtBottom = checkIfAtBottom();
      setShowScrollButton(!isAtBottom);
    }, 200);

    return () => clearTimeout(timer);
  }, [logs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom();
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    // 初始检查
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
    
    // 延迟隐藏按钮，等待滚动完成
    setTimeout(() => {
      setShowScrollButton(false);
    }, 300);
  };

  return (
    <div className={`flex-1 bg-ink-900 relative min-h-[200px] md:min-h-[300px] ${className || ''}`}>
      {/* 滚动容器 */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide relative"
      >
        <div className="absolute top-0 left-0 w-full h-8 md:h-12 bg-gradient-to-b from-ink-900 to-transparent pointer-events-none z-10" />

        <div className="p-3 md:p-6 space-y-2 md:space-y-4 pb-4">
          {logs.map((log) => (
            <div key={log.id} className={`
              p-2 md:p-3 rounded border-l-2 font-serif text-xs md:text-sm lg:text-base leading-relaxed animate-fade-in
              ${log.type === 'normal' ? 'border-stone-600 text-stone-300 bg-ink-800/50' : ''}
              ${log.type === 'gain' ? 'border-mystic-jade text-emerald-100 bg-emerald-900/10' : ''}
              ${log.type === 'danger' ? 'border-mystic-blood text-red-100 bg-red-900/10' : ''}
              ${log.type === 'special' ? 'border-mystic-gold text-amber-100 bg-amber-900/10' : ''}
            `}>
              <span className="text-[10px] md:text-xs opacity-50 block mb-0.5 md:mb-1 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.text}
            </div>
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

export default LogPanel;