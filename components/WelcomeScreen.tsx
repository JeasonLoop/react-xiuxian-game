import React from 'react';
import { Sparkles, Play } from 'lucide-react';

interface Props {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ hasSave, onStart, onContinue }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 overflow-hidden touch-manipulation">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(203,161,53,0.1),transparent_70%)]" />
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 md:p-8">
        {/* Logo 图片 */}
        <div className="mb-8 md:mb-12 animate-fade-in">
          <div className="relative">
            <img
              src="/assets/images/logo.png"
              alt="云灵修仙传"
              className="max-w-[90vw] max-h-[50vh] md:max-w-[600px] md:max-h-[400px] object-contain drop-shadow-2xl relative z-10 animate-glow-pulse"
            />
            {/* 光晕效果 */}
            <div
              className="absolute inset-0 -z-0 blur-3xl opacity-30 animate-glow-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(203, 161, 53, 0.6) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
            />
          </div>
        </div>

        {/* 游戏标题 */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-mystic-gold tracking-widest mb-3 md:mb-4 drop-shadow-lg">
            云灵修仙传
          </h1>
          <p className="text-stone-400 text-base md:text-xl lg:text-2xl font-light">
            踏上你的长生之路
          </p>
        </div>

        {/* 游戏按钮 */}
        <div className="animate-fade-in flex flex-col gap-3 md:gap-4 w-full max-w-md" style={{ animationDelay: '0.4s' }}>
          {hasSave ? (
            // 有存档：显示继续游戏和新游戏按钮
            <>
              <button
                onClick={onContinue}
                className="group relative px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-mystic-jade to-green-600 text-stone-900 font-bold text-lg md:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 min-h-[60px] md:min-h-[70px] touch-manipulation overflow-hidden"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Play size={24} className="md:w-7 md:h-7 relative z-10" />
                <span className="relative z-10">继续游戏</span>
              </button>
              <button
                onClick={onStart}
                className="group relative px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-stone-600 to-stone-700 text-stone-200 font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 min-h-[50px] md:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Sparkles size={20} className="md:w-6 md:h-6 relative z-10" />
                <span className="relative z-10">新游戏</span>
              </button>
            </>
          ) : (
            // 没有存档：显示开始游戏按钮
            <button
              onClick={onStart}
              className="group relative px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-mystic-gold to-yellow-600 text-stone-900 font-bold text-lg md:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 min-h-[60px] md:min-h-[70px] touch-manipulation overflow-hidden"
            >
              {/* 按钮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <Sparkles size={24} className="md:w-7 md:h-7 relative z-10" />
              <span className="relative z-10">开始游戏</span>
            </button>
          )}
        </div>

        {/* 底部装饰文字 */}
        <div className="absolute bottom-8 md:bottom-12 left-0 right-0 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-stone-500 text-xs md:text-sm">
            探索无尽的修仙世界
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

