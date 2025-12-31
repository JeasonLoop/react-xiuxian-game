import React, { useState, useEffect } from 'react';
import { X, Play, Settings } from 'lucide-react';

export interface AutoAdventureConfig {
  skipBattle: boolean; // 是否跳过战斗
  fleeOnBattle: boolean; // 遇到战斗是否逃跑
  skipShop: boolean; // 是否跳过商店
  skipReputationEvent: boolean; // 是否跳过声望事件
  minHpThreshold: number; // 血量阈值，低于此值时自动停止历练（0表示不限制）
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: AutoAdventureConfig) => void;
  currentConfig?: AutoAdventureConfig;
}

const defaultConfig: AutoAdventureConfig = {
  skipBattle: true,
  fleeOnBattle: false,
  skipShop: true, // 默认跳过商店
  skipReputationEvent: false,
  minHpThreshold: 0, // 默认不限制
};

const AutoAdventureConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  currentConfig = defaultConfig,
}) => {
  const [config, setConfig] = useState<AutoAdventureConfig>(currentConfig);

  // 修复状态同步问题：当模态框打开或配置变化时，同步内部状态
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full max-w-md rounded-lg border border-stone-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-700">
          <div className="flex items-center gap-2">
            <Settings className="text-mystic-gold" size={20} />
            <h2 className="text-xl font-serif text-stone-200">自动历练配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* 配置项 */}
        <div className="p-4 space-y-4">
          {/* 跳过战斗 */}
          <div className="flex items-center justify-between p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            <div className="flex-1">
              <label className="text-stone-200 font-medium block mb-1">
                跳过战斗
              </label>
              <p className="text-xs text-stone-400">
                自动模式下遇到战斗时直接跳过，不进行战斗
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.skipBattle}
                onChange={(e) =>
                  setConfig({ ...config, skipBattle: e.target.checked })
                }
                className="sr-only peer"
                aria-label="跳过战斗"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-mystic-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mystic-gold"></div>
            </label>
          </div>

          {/* 遇到战斗逃跑 */}
          <div className="flex items-center justify-between p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            <div className="flex-1">
              <label className="text-stone-200 font-medium block mb-1">
                遇到战斗逃跑
              </label>
              <p className="text-xs text-stone-400">
                自动模式下遇到战斗时自动逃跑，避免战斗
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.fleeOnBattle}
                onChange={(e) =>
                  setConfig({ ...config, fleeOnBattle: e.target.checked })
                }
                className="sr-only peer"
                disabled={config.skipBattle}
                aria-label="遇到战斗逃跑"
              />
              <div
                className={`w-11 h-6 bg-stone-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-mystic-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mystic-gold ${
                  config.skipBattle ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              ></div>
            </label>
          </div>

          {/* 跳过商店 */}
          <div className="flex items-center justify-between p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            <div className="flex-1">
              <label className="text-stone-200 font-medium block mb-1">
                跳过商店
              </label>
              <p className="text-xs text-stone-400">
                自动模式下遇到商店时自动跳过，不打开商店界面
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.skipShop}
                onChange={(e) =>
                  setConfig({ ...config, skipShop: e.target.checked })
                }
                className="sr-only peer"
                aria-label="跳过商店"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-mystic-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mystic-gold"></div>
            </label>
          </div>

          {/* 跳过声望事件 */}
          <div className="flex items-center justify-between p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            <div className="flex-1">
              <label className="text-stone-200 font-medium block mb-1">
                跳过声望事件
              </label>
              <p className="text-xs text-stone-400">
                自动模式下遇到声望事件时自动跳过，不打开事件界面
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.skipReputationEvent}
                onChange={(e) =>
                  setConfig({ ...config, skipReputationEvent: e.target.checked })
                }
                className="sr-only peer"
                aria-label="跳过声望事件"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-mystic-gold rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mystic-gold"></div>
            </label>
          </div>

          {/* 血量阈值 */}
          <div className="p-3 bg-stone-900/50 rounded-lg border border-stone-700">
            <label className="text-stone-200 font-medium block mb-2">
              血量阈值
            </label>
            <p className="text-xs text-stone-400 mb-2">
              当血量低于此值时自动停止历练（设置为0表示不限制）
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={config.minHpThreshold}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setConfig({ ...config, minHpThreshold: value });
                }}
                className="flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-200 focus:outline-none focus:ring-2 focus:ring-mystic-gold"
                placeholder="0"
              />
              <span className="text-stone-400 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-2 p-4 border-t border-stone-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-mystic-gold hover:bg-mystic-gold/80 text-stone-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={16} />
            开始自动历练
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoAdventureConfigModal;

