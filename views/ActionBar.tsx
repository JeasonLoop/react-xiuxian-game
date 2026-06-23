import React from 'react';
import {
  User,
  Sword,
  Mountain,
  Sparkles,
  Scroll,
  Play,
  Pause,
  Lock,
} from 'lucide-react';
import { RealmType } from '../types';
import { isFeatureUnlocked, FeatureId, getFeatureRequirementText } from '../constants/featureUnlock';
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
  autoMeditate: boolean;
  autoAdventure: boolean;
  pausedByBattle?: boolean; // 是否因战斗暂停
  onToggleAutoMeditate: () => void;
  onToggleAutoAdventure: () => void;
  realm: RealmType; // 当前境界（用于解锁判断）
}

function ActionBar({
  loading,
  cooldown,
  onMeditate,
  onAdventure,
  onOpenRealm,
  onOpenAlchemy,
  onOpenSect,
  autoMeditate,
  autoAdventure,
  pausedByBattle = false,
  onToggleAutoMeditate,
  onToggleAutoAdventure,
  realm,
}: ActionBarProps) {
  // 境界解锁检查
  const sectLocked = !isFeatureUnlocked(FeatureId.SECT, realm);
  const alchemyLocked = !isFeatureUnlocked(FeatureId.ALCHEMY, realm);
  const realmLocked = !isFeatureUnlocked(FeatureId.SECRET_REALM, realm);

  // 锁定按钮样式
  const lockedCls =
    'opacity-35 cursor-not-allowed bg-stone-900 border-stone-800';

  return (
    <div className="bg-paper-800 p-3 md:p-4 border-t border-stone-700 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 shrink-0 fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto z-50 shadow-lg md:shadow-none">
      <div className="relative">
        <button
          onClick={onMeditate}
          disabled={loading || cooldown > 0 || autoAdventure}
          className={`
            flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px] w-full
            ${
              loading || cooldown > 0 || autoAdventure
                ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                : 'bg-ink-800 border-stone-600 active:border-mystic-jade active:bg-ink-700 text-stone-200'
            }
            ${autoMeditate ? 'border-mystic-jade border-2' : ''}
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
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoMeditate();
          }}
          className={`
            absolute top-1 right-1 p-1 rounded transition-all duration-200
            ${
              autoMeditate
                ? 'bg-mystic-jade/80 text-stone-900 hover:bg-mystic-jade'
                : 'bg-stone-700/80 text-stone-400 hover:bg-stone-600'
            }
          `}
          title={autoMeditate ? '关闭自动打坐' : '开启自动打坐'}
        >
          {autoMeditate ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={onAdventure}
          disabled={loading || cooldown > 0 || autoMeditate}
          className={`
            flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 group touch-manipulation min-h-[90px] md:min-h-[100px] w-full
            ${
              loading || cooldown > 0 || autoMeditate
                ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                : 'bg-ink-800 border-stone-600 active:border-mystic-gold active:bg-ink-700 text-stone-200'
            }
            ${autoAdventure ? 'border-mystic-gold border-2' : ''}
          `}
        >
          <Sword
            size={24}
            className={`md:w-6 md:h-6 mb-1.5 md:mb-2 text-mystic-gold ${
              loading
                ? 'animate-spin'
                : 'group-active:scale-110 transition-transform'
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
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoAdventure();
          }}
          className={`
            absolute top-1 right-1 p-1 rounded transition-all duration-200
            ${
              autoAdventure || pausedByBattle
                ? 'bg-mystic-gold/80 text-stone-900 hover:bg-mystic-gold'
                : 'bg-stone-700/80 text-stone-400 hover:bg-stone-600'
            }
          `}
          title={
            pausedByBattle
              ? '取消自动历练（战斗中）'
              : autoAdventure
              ? '关闭自动历练'
              : '开启自动历练'
          }
        >
          {autoAdventure || pausedByBattle ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>

      {realmLocked ? (
        <div
          className={`flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px] relative ${lockedCls}`}
          title={getFeatureRequirementText(FeatureId.SECRET_REALM)}
        >
          <Lock size={10} className="absolute top-1 right-1 text-stone-600" />
          <Mountain
            size={24}
            className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-stone-600"
          />
          <span className="font-serif font-bold text-base md:text-base text-stone-500">
            秘境
          </span>
          <span className="text-[10px] text-stone-600 mt-0.5">
            {getFeatureRequirementText(FeatureId.SECRET_REALM)}
          </span>
        </div>
      ) : (
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
      )}

      {alchemyLocked ? (
        <div
          className={`flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px] relative ${lockedCls}`}
          title={getFeatureRequirementText(FeatureId.ALCHEMY)}
        >
          <Lock size={10} className="absolute top-1 right-1 text-stone-600" />
          <Sparkles
            size={24}
            className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-stone-600"
          />
          <span className="font-serif font-bold text-base md:text-base text-stone-500">
            炼丹 · 炼器
          </span>
          <span className="text-[10px] text-stone-600 mt-0.5">
            {getFeatureRequirementText(FeatureId.ALCHEMY)}
          </span>
        </div>
      ) : (
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
          炼丹 · 炼器
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">
          神丹 · 神兵
        </span>
      </button>
      )}

      {sectLocked ? (
        <div
          className={`flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px] relative ${lockedCls}`}
          title={getFeatureRequirementText(FeatureId.SECT)}
        >
          <Lock size={10} className="absolute top-1 right-1 text-stone-600" />
          <Scroll
            size={24}
            className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-stone-600"
          />
          <span className="font-serif font-bold text-base md:text-base text-stone-500">
            宗门
          </span>
          <span className="text-[10px] text-stone-600 mt-0.5">
            {getFeatureRequirementText(FeatureId.SECT)}
          </span>
        </div>
      ) : (
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
      )}
      <p className="col-span-2 md:col-span-5 text-center text-[10px] md:text-xs text-stone-500 mt-1">
        快捷键见设置
      </p>
    </div>
  );
}

export default React.memo(ActionBar);
