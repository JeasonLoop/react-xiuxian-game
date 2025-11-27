import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  className?: string;
}

const LogPanel: React.FC<Props> = ({ logs, className }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={`flex-1 bg-ink-900 p-3 md:p-6 overflow-y-auto relative min-h-[200px] md:min-h-[300px] scrollbar-hide ${className || ''}`}>
      <div className="absolute top-0 left-0 w-full h-8 md:h-12 bg-gradient-to-b from-ink-900 to-transparent pointer-events-none z-10" />

      <div className="space-y-2 md:space-y-4 pb-4">
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
  );
};

export default LogPanel;