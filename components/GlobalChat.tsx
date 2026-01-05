import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, Bell, Smile } from 'lucide-react';
import { useParty } from '../hooks/useParty';
import {
  EMOJI_CATEGORIES,
  EMOJI_SHORTCUTS,
  MESSAGE_TYPES,
} from '../constants/emojis';

interface Props {
  playerName: string;
}

export const GlobalChat: React.FC<Props> = ({ playerName }) => {
  const { messages, sendMessage } = useParty('global');
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(
    Date.now()
  );
  const [displayMessages, setDisplayMessages] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 处理消息显示逻辑：先显示历史消息，再显示实时消息
  useEffect(() => {
    if (messages.length === 0) return;

    const processedMessages: any[] = [];
    let hasProcessedHistory = false;
    let hasProcessedWelcome = false;

    // 按顺序处理消息：历史消息 -> 欢迎消息 -> 实时消息
    for (const msg of messages) {
      if (msg.type === 'history' && !hasProcessedHistory) {
        // 处理历史消息，添加到显示列表
        if (msg.messages && Array.isArray(msg.messages)) {
          processedMessages.push(...msg.messages);
        }
        hasProcessedHistory = true;
      } else if (msg.type === 'welcome' && !hasProcessedWelcome) {
        // 处理欢迎消息，在历史消息后显示
        processedMessages.push(msg);
        hasProcessedWelcome = true;
      } else if (msg.type === 'chat' || msg.type === 'welcome') {
        // 处理实时聊天消息和后续欢迎消息
        processedMessages.push(msg);
      }
    }

    setDisplayMessages(processedMessages);
  }, [messages]);

  // 独立的红点逻辑：只在聊天窗口关闭时检查新消息
  useEffect(() => {
    if (messages.length === 0 || isOpen) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageTimestamp = lastMessage.timestamp || Date.now();

    // 如果聊天窗口关闭，且有新消息（时间戳大于最后查看时间），并且不是自己发的消息，则显示红点
    if (
      lastMessageTimestamp > lastViewedTimestamp &&
      lastMessage.user !== playerName
    ) {
      setHasNew(true);
    }
  }, [messages, isOpen, lastViewedTimestamp, playerName]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
    }
  }, [displayMessages, isOpen]);

  // 添加表情到输入框
  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 处理表情快捷输入（如 :smile: 转换为 😀）
  const processEmojiShortcuts = (text: string): string => {
    let processedText = text;
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      processedText = processedText.replace(new RegExp(shortcut, 'g'), emoji);
    });
    return processedText;
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage({
        type: 'chat',
        messageType: MESSAGE_TYPES.TEXT,
        text: processEmojiShortcuts(input),
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
    } else {
      setShowEmojiPicker(false);
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
          className="flex-1 overflow-y-auto p-3 custom-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* 消息内容 */}
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-1 duration-300 mb-3 last:mb-0"
            >
              {msg.type === 'chat' ? (
                <div className="flex flex-col gap-2">
                  {/* 消息元信息 */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-amber-300 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-sm">
                        {msg.user}
                      </span>
                      <span className="text-[9px] text-stone-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 消息气泡 */}
                  <div className="relative">
                    {/* 气泡箭头 */}
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-stone-800 rotate-45" />

                    {/* 消息内容 */}
                    <div className="bg-stone-800/80 backdrop-blur-sm rounded-lg p-2 border border-stone-700/50 shadow-lg">
                      <div className="text-sm text-stone-100 leading-relaxed whitespace-pre-wrap break-words">
                        {Array.from(msg.text).map(
                          (char: string, index: number) =>
                            // 使用更全面的Emoji正则范围，包含修仙类表情(U+1F9xx)
                            /[\u{1F300}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(
                              char
                            ) ? (
                              <span
                                key={index}
                                className="inline-block text-xl align-middle mx-0.5"
                              >
                                {char}
                              </span>
                            ) : (
                              char
                            )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : msg.type === 'welcome' ? (
                <div className="flex flex-col items-center py-3">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                  <span className="text-xs text-amber-300/80 italic my-2 font-serif px-4 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    ✨ {msg.message} ✨
                  </span>
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                </div>
              ) : null}
            </div>
          ))}
          {displayMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <MessageSquare size={48} className="text-stone-700/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-stone-500/70 font-serif italic">
                此地鸦雀无声...
              </p>
              <p className="text-[10px] text-stone-600 mt-1">
                开始一段修仙对话吧
              </p>
            </div>
          )}
        </div>

        {/* 输入区域 - 减少高度占比 */}
        <div className="p-2 bg-stone-800/50 border-t border-amber-500/20 relative">
          {/* 表情选择器悬浮层 - 以表情按钮为基准 */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0  z-10 bg-stone-800/95 backdrop-blur-xl border border-amber-500/30 rounded-xl rounded-b-none p-3 max-h-40 overflow-y-auto  shadow-2xl">
              <div className="flex flex-wrap gap-2">
                {EMOJI_CATEGORIES.map((category) => (
                  <div key={category.name} className="w-full">
                    <div className="text-xs font-medium text-amber-300/80 mb-2 px-1 border-l-2 border-amber-500/50 pl-2">
                      {category.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {category.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="w-7 h-7 flex items-center justify-center text-base hover:bg-amber-500/30 hover:scale-110 rounded-lg transition-all duration-200 border border-transparent hover:border-amber-500/40 shadow-sm"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* 表情按钮 */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 rounded-lg transition-all duration-200 border relative ${
                showEmojiPicker
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg'
                  : 'bg-stone-800/50 border-stone-700/50 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30'
              }`}
              title="选择表情"
            >
              <Smile size={14} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-stone-900/80 backdrop-blur-sm border border-stone-700/50 rounded-lg pl-3 pr-10 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/50 focus:bg-stone-800/90 transition-all duration-300 shadow-inner"
                placeholder="切磋武艺，交流感悟..."
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded bg-gradient-to-r from-amber-500/80 to-amber-600/70 text-white hover:from-amber-500 hover:to-amber-600 disabled:from-stone-700 disabled:to-stone-800 disabled:text-stone-500 transition-all duration-200 shadow disabled:shadow-none"
              >
                <Send size={12} />
              </button>
            </div>
          </div>

          {/* 快捷输入提示 */}
          <div className="mt-1 px-2 py-0.5 bg-stone-800/30 rounded border border-stone-700/30">
            <div className="text-[9px] text-stone-400 font-mono">
              快捷输入: <span className="text-amber-400">:smile:</span>{' '}
              <span className="text-amber-400">:heart:</span>{' '}
              <span className="text-amber-400">:thumbsup:</span>
            </div>
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
