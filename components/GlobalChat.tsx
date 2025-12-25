import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, Bell } from 'lucide-react';
import { useParty } from '../hooks/useParty';

interface Props {
  playerName: string;
}

export const GlobalChat: React.FC<Props> = ({ playerName }) => {
  const { messages, sendMessage } = useParty('global');
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  // 检查是否有新消息（用户未查看过的）
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    const lastMessageTimestamp = lastMessage.timestamp || Date.now();
    
    // 如果聊天窗口关闭，且有新消息（时间戳大于最后查看时间），并且不是自己发的消息，则显示红点
    if (!isOpen && lastMessageTimestamp > lastViewedTimestamp && lastMessage.user !== playerName) {
      setHasNew(true);
    }
  }, [messages, isOpen, lastViewedTimestamp, playerName]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({
        type: 'chat',
        text: input,
        user: playerName,
        timestamp: Date.now(),
      });
      setInput('');
    }
  };

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      // 打开聊天窗口时，更新最后查看时间为当前时间，并清除红点
      setLastViewedTimestamp(Date.now());
      setHasNew(false);
    }
  };

  return (
    <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-101 transition-all duration-300 ease-in-out w-9 md:w-11">
      {/* 消息气泡统计 / 红点 */}
      {!isOpen && hasNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-stone-900" />
      )}

      {/* 切换按钮 */}
      <button
        onClick={toggleOpen}
        className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shadow-lg transition-all border ${
          isOpen
            ? 'bg-stone-800 border-amber-500/50 text-amber-500'
            : 'bg-stone-900/90 border-stone-700 text-stone-400 hover:border-amber-500/50 hover:text-amber-500'
        }`}
      >
        {isOpen ? <ChevronDown size={20} /> : <MessageSquare size={18} />}
      </button>

      {/* 聊天面板 */}
      <div
        className={`absolute bottom-full right-0 mb-2 w-80 bg-stone-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'h-96 opacity-100 scale-100'
            : 'h-0 opacity-0 scale-90 pointer-events-none'
        }`}
      >
        {/* 头部 */}
        <div className="p-3 bg-linear-to-r from-stone-800 to-stone-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-amber-500 animate-pulse" />
            <span className="text-sm font-bold text-amber-200 tracking-widest">
              千里传音
            </span>
          </div>
          <span className="text-[10px] text-stone-500">在线参与中</span>
        </div>

        {/* 消息区域 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              {msg.type === 'chat' ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-amber-500/80 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {msg.user}
                    </span>
                    <span className="text-[9px] text-stone-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-stone-200 pl-1 leading-relaxed border-l border-stone-800 ml-1">
                    {msg.text}
                  </div>
                </div>
              ) : msg.type === 'welcome' ? (
                <div className="flex flex-col items-center py-2">
                  <div className="h-px w-12 bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
                  <span className="text-[11px] text-amber-200/60 italic my-1 font-serif line-clamp-1">
                    {msg.message}
                  </span>
                  <div className="h-px w-12 bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
                </div>
              ) : null}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <MessageSquare size={32} className="text-stone-700 mb-2" />
              <p className="text-xs text-stone-500">此地鸦雀无声...</p>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-3 bg-stone-800/50 border-t border-amber-500/20">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-stone-900 border border-stone-700 rounded-full pl-4 pr-10 py-1.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 transition-all shadow-inner"
              placeholder="切磋武艺，交流感悟..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-1.5 p-1.5 text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-amber-500 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.3);
        }
      `}</style>
    </div>
  );
};
