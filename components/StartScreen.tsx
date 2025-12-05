import React, { useState, useMemo, useRef } from 'react';
import { Talent } from '../types';
import { TALENTS } from '../constants';
import { Sparkles, Sword, Shield, Heart, Zap, User, Upload } from 'lucide-react';
import { showError, showSuccess } from '../utils/toastUtils';
import { SAVE_KEY } from '../utils/gameUtils';

interface Props {
  onStart: (playerName: string, talentId: string) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 只在组件首次加载时随机生成一个天赋（使用useMemo确保只执行一次）
  const initialRandomTalentId = useMemo(() => {
    const availableTalents = TALENTS;
    const randomTalent =
      availableTalents[Math.floor(Math.random() * availableTalents.length)];
    return randomTalent.id;
  }, []); // 空依赖数组，确保只执行一次

  // 如果没有选择天赋，使用初始随机天赋
  const finalTalentId = selectedTalentId || initialRandomTalentId;
  const selectedTalent = TALENTS.find((t) => t.id === finalTalentId);

  const handleStart = () => {
    if (!playerName.trim()) {
      showError('请输入修仙者名称！');
      return;
    }
    onStart(playerName.trim(), finalTalentId);
  };

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 支持 .json 和 .txt 文件
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      let saveData;

      // 尝试解析JSON
      try {
        saveData = JSON.parse(text);
      } catch (parseError) {
        showError('存档文件格式错误！请确保文件内容是有效的JSON格式。');
        console.error('JSON解析错误:', parseError);
        return;
      }

      // 验证存档数据结构
      if (!saveData || typeof saveData !== 'object') {
        showError('存档文件格式不正确！文件内容必须是有效的JSON对象。');
        return;
      }

      if (!saveData.player || typeof saveData.player !== 'object') {
        showError('存档文件格式不正确！缺少必要的玩家数据。');
        return;
      }

      if (!Array.isArray(saveData.logs)) {
        showError('存档文件格式不正确！日志数据必须是数组格式。');
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
      showSuccess('存档导入成功！页面即将刷新...', undefined, () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('导入存档失败:', error);
      showError(
        `导入存档失败！错误信息: ${error instanceof Error ? error.message : '未知错误'}，请检查文件格式是否正确。`
      );
    }

    // 清空文件输入，以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '稀有':
        return 'text-blue-400 border-blue-500';
      case '传说':
        return 'text-purple-400 border-purple-500';
      case '仙品':
        return 'text-yellow-400 border-yellow-500';
      default:
        return 'text-stone-300 border-stone-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-4 md:p-8 max-w-2xl w-full shadow-2xl my-auto">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            云灵修仙
          </h1>
          <p className="text-stone-400 text-sm md:text-lg">踏上你的长生之路</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* 输入名称 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <User size={18} className="md:w-5 md:h-5" />
              修仙者名称
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="请输入你的道号..."
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-jade focus:ring-2 focus:ring-mystic-jade/50 text-sm md:text-base"
              maxLength={20}
            />
          </div>

          {/* 天赋选择（只显示，不可修改） */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <Sparkles size={18} className="md:w-5 md:h-5" />
              天生天赋（随机生成，不可修改）
            </label>
            <div
              className={`p-3 md:p-4 rounded border-2 ${getRarityColor(selectedTalent?.rarity || '普通')} bg-stone-800/50`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg md:text-xl font-bold">
                  {selectedTalent?.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-[10px] md:text-xs font-semibold ${getRarityColor(selectedTalent?.rarity || '普通')}`}
                >
                  {selectedTalent?.rarity}
                </span>
              </div>
              <p className="text-stone-300 mb-2 md:mb-3 text-xs md:text-sm">
                {selectedTalent?.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                {selectedTalent?.effects.attack && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sword size={14} className="md:w-4 md:h-4 text-red-400" />
                    <span>攻击 +{selectedTalent.effects.attack}</span>
                  </div>
                )}
                {selectedTalent?.effects.defense && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield size={14} className="md:w-4 md:h-4 text-blue-400" />
                    <span>防御 +{selectedTalent.effects.defense}</span>
                  </div>
                )}
                {selectedTalent?.effects.hp && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Heart size={14} className="md:w-4 md:h-4 text-pink-400" />
                    <span>气血 +{selectedTalent.effects.hp}</span>
                  </div>
                )}
                {selectedTalent?.effects.spirit && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={14} className="md:w-4 md:h-4 text-yellow-400" />
                    <span>神识 +{selectedTalent.effects.spirit}</span>
                  </div>
                )}
                {selectedTalent?.effects.physique && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield
                      size={14}
                      className="md:w-4 md:h-4 text-green-400"
                    />
                    <span>体魄 +{selectedTalent.effects.physique}</span>
                  </div>
                )}
                {selectedTalent?.effects.speed && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={14} className="md:w-4 md:h-4 text-cyan-400" />
                    <span>速度 +{selectedTalent.effects.speed}</span>
                  </div>
                )}
                {selectedTalent?.effects.expRate && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles
                      size={14}
                      className="md:w-4 md:h-4 text-purple-400"
                    />
                    <span>
                      修炼速度 +
                      {Math.round(selectedTalent.effects.expRate * 100)}%
                    </span>
                  </div>
                )}
                {selectedTalent?.effects.luck && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles
                      size={14}
                      className="md:w-4 md:h-4 text-yellow-400"
                    />
                    <span>幸运 +{selectedTalent.effects.luck}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-stone-500 mt-2">
              * 天赋在游戏开始时随机生成，之后不可修改
            </p>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
          />

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-mystic-gold to-yellow-600 active:from-yellow-600 active:to-mystic-gold text-stone-900 font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg active:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] md:min-h-0 touch-manipulation"
          >
            <Sparkles size={20} className="md:w-6 md:h-6" />
            开始修仙之旅
          </button>

          {/* 导入存档按钮 */}
          <button
            onClick={handleImportClick}
            className="w-full py-2.5 md:py-3 bg-gradient-to-r from-stone-500 to-stone-600 active:from-stone-600 active:to-stone-500 text-stone-200 font-bold text-sm md:text-base rounded-lg transition-all duration-300 shadow-lg active:shadow-xl flex items-center justify-center gap-2 min-h-[48px] md:min-h-0 touch-manipulation border border-stone-500"
          >
            <Upload size={18} className="md:w-5 md:h-5" />
            导入存档
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
