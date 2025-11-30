import React, { useRef } from 'react';
import {
  X,
  Volume2,
  Music,
  Save,
  Globe,
  Upload,
  Download,
  Github,
} from 'lucide-react';
import { GameSettings } from '../types';
import dayjs from 'dayjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onImportSave?: () => void;
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onImportSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SAVE_KEY = 'xiuxian-game-save';

  if (!isOpen) return null;

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 支持 .json 和 .txt 文件
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      alert('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      let saveData;

      // 尝试解析JSON
      try {
        saveData = JSON.parse(text);
      } catch (parseError) {
        alert('存档文件格式错误！请确保文件内容是有效的JSON格式。');
        console.error('JSON解析错误:', parseError);
        return;
      }

      // 验证存档数据结构
      if (!saveData || typeof saveData !== 'object') {
        alert('存档文件格式不正确！文件内容必须是有效的JSON对象。');
        return;
      }

      if (!saveData.player || typeof saveData.player !== 'object') {
        alert('存档文件格式不正确！缺少必要的玩家数据。');
        return;
      }

      if (!Array.isArray(saveData.logs)) {
        alert('存档文件格式不正确！日志数据必须是数组格式。');
        return;
      }

      // 显示存档信息预览
      const playerName = saveData.player.name || '未知';
      const realm = saveData.player.realm || '未知';
      const timestamp = saveData.timestamp
        ? new Date(saveData.timestamp).toLocaleString('zh-CN')
        : '未知';

      // 确认导入
      if (
        !window.confirm(
          `确定要导入此存档吗？\n\n玩家名称: ${playerName}\n境界: ${realm}\n保存时间: ${timestamp}\n\n当前存档将被替换，页面将自动刷新。`
        )
      ) {
        return;
      }

      // 保存到localStorage
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

      // 提示并刷新页面
      alert('存档导入成功！页面即将刷新...');
      window.location.reload();
    } catch (error) {
      console.error('导入存档失败:', error);
      alert(
        `导入存档失败！\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n请检查文件格式是否正确。`
      );
    }

    // 清空文件输入，以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportSave = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) {
        alert('没有找到存档数据！请先开始游戏。');
        return;
      }

      // 解析存档数据以获取玩家信息用于文件名
      let saveData;
      try {
        saveData = JSON.parse(saved);
      } catch (error) {
        alert('存档数据损坏，无法导出！');
        return;
      }

      // 创建文件名
      const playerName = saveData.player?.name || 'player';
      const fileName = `xiuxian-save-${playerName}-${dayjs().format('YYYY-MM-DD HH:mm:ss')}.json`;

      // 创建下载链接
      const blob = new Blob([saved], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('存档导出成功！');
    } catch (error) {
      console.error('导出存档失败:', error);
      alert(
        `导出存档失败！\n错误信息: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-md md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center md:rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">
            设置
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 音效设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={20} className="text-stone-400" />
              <h3 className="font-bold">音效</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">启用音效</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ soundEnabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              {settings.soundEnabled && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    音效音量: {settings.soundVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        soundVolume: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 音乐设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Music size={20} className="text-stone-400" />
              <h3 className="font-bold">音乐</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">启用音乐</span>
                <input
                  type="checkbox"
                  checked={settings.musicEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ musicEnabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              {settings.musicEnabled && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    音乐音量: {settings.musicVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        musicVolume: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 游戏设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Save size={20} className="text-stone-400" />
              <h3 className="font-bold">游戏</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">自动保存</span>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    onUpdateSettings({ autoSave: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  动画速度
                </label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) =>
                    onUpdateSettings({ animationSpeed: e.target.value as any })
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  <option value="slow">慢</option>
                  <option value="normal">正常</option>
                  <option value="fast">快</option>
                </select>
              </div>
            </div>
          </div>

          {/* 存档管理 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Save size={20} className="text-stone-400" />
              <h3 className="font-bold">存档管理</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  导出存档
                </label>
                <button
                  onClick={handleExportSave}
                  className="w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 flex items-center justify-center transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  导出当前存档 (.json)
                </button>
                <p className="text-xs text-stone-500 mt-2">
                  将当前存档导出为 JSON 文件，可用于备份或分享
                </p>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  导入存档
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleImportSave}
                  className="hidden"
                  id="import-save-input"
                />
                <label
                  htmlFor="import-save-input"
                  className="block w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 text-center cursor-pointer transition-colors"
                >
                  <Upload size={16} className="inline mr-2" />
                  选择存档文件 (.json 或 .txt)
                </label>
                <p className="text-xs text-stone-500 mt-2">
                  选择 .json 或 .txt
                  格式的存档文件，导入后将替换当前存档并刷新页面
                </p>
              </div>
            </div>
          </div>

          {/* 语言设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={20} className="text-stone-400" />
              <h3 className="font-bold">语言</h3>
            </div>
            <select
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({ language: e.target.value as any })
              }
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* 关于 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Github size={20} className="text-stone-400" />
              <h3 className="font-bold">关于</h3>
            </div>
            <div className="space-y-3">
              <a
                href="https://github.com/JeasonLoop/react-xiuxian-game"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 transition-colors"
              >
                <Github size={16} />
                <span>GitHub 仓库</span>
                <span className="ml-auto text-xs text-stone-400">↗</span>
              </a>
              <p className="text-xs text-stone-500">
                一款文字修仙小游戏，欢迎 Star 和 Fork！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
