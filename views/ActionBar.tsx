import React from 'react';
import { User, Sword, Mountain, Sparkles, Scroll } from 'lucide-react';
/**
 * 操作按钮栏组件
 * 包含打坐、历练、秘境、炼丹、宗门五个按钮
 * 打坐按钮：修炼 · 心法
 * 历练按钮：机缘 · 战斗
 * 秘境按钮：探险 · 夺宝
 * 炼丹按钮：丹药 · 辅助
 * 宗门按钮：任务 · 晋升
 */
interface ActionBarProps {
  loading: boolean;
  cooldown: number;
  onMeditate: () => void;
  onAdventure: () => void;
  onOpenRealm: () => void;
  onOpenAlchemy: () => void;
  onOpenSect: () => void;
}

function ActionBar({
  loading,
  cooldown,
  onMeditate,
  onAdventure,
  onOpenRealm,
  onOpenAlchemy,
  onOpenSect,
}: ActionBarProps) {
  return (
    <div className="bg-paper-800 p-3 md:p-4 border-t border-stone-700 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 shrink-0 fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto z-20 shadow-lg md:shadow-none">
      <button
        onClick={onMeditate}
        disabled={loading || cooldown > 0}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${
            loading || cooldown > 0
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
              : 'bg-ink-800 border-stone-600 active:border-mystic-jade active:bg-ink-700 text-stone-200'
          }
        `}
      >
        <User
          size={24}
          className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-mystic-jade"
        />
        <span className="font-serif font-bold text-base md:text-base">
          打坐
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          修炼 · 心法
        </span>
      </button>

      <button
        onClick={onAdventure}
        disabled={loading || cooldown > 0}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 group touch-manipulation min-h-[90px] md:min-h-[100px]
          ${
            loading || cooldown > 0
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
              : 'bg-ink-800 border-stone-600 active:border-mystic-gold active:bg-ink-700 text-stone-200'
          }
        `}
      >
        <Sword
          size={24}
          className={`md:w-6 md:h-6 mb-1.5 md:mb-2 text-mystic-gold ${
            loading ? 'animate-spin' : 'group-active:scale-110 transition-transform'
          }`}
        />
        <span className="font-serif font-bold text-base md:text-base">
          {loading ? '历练中...' : '历练'}
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          机缘 · 战斗
        </span>
      </button>

      <button
        onClick={onOpenRealm}
        disabled={loading}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${
            loading
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
              : 'bg-ink-800 border-stone-600 active:border-purple-500 active:bg-ink-700 text-stone-200'
          }
        `}
      >
        <Mountain
          size={24}
          className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-purple-400"
        />
        <span className="font-serif font-bold text-base md:text-base">
          秘境
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          探险 · 夺宝
        </span>
      </button>

      <button
        onClick={onOpenAlchemy}
        disabled={loading}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${
            loading
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
              : 'bg-ink-800 border-stone-600 active:border-cyan-500 active:bg-ink-700 text-stone-200'
          }
        `}
      >
        <Sparkles
          size={24}
          className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-cyan-400"
        />
        <span className="font-serif font-bold text-base md:text-base">
          炼丹
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          丹药 · 辅助
        </span>
      </button>

      <button
        onClick={onOpenSect}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${
            loading
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
              : 'bg-ink-800 border-stone-600 active:border-blue-400 active:bg-ink-700 text-stone-200'
          }
        `}
      >
        <Scroll
          size={24}
          className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-blue-400"
        />
        <span className="font-serif font-bold text-base md:text-base">
          宗门
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          任务 · 晋升
        </span>
      </button>
    </div>
  );
}

export default React.memo(ActionBar);

