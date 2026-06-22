import React, { useState, useRef } from 'react';
import { DifficultyMode, TalentCategory, FATE_POINTS_TOTAL } from '../types';
import { TALENTS } from '../constants/index';
import { Sparkles, User, Upload, TriangleAlert } from 'lucide-react';
import { showError } from '../utils/toastUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  saveGameData,
  importSave,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';
import {
  calculateTotalFateCost,
  getRemainingFatePoints,
  randomizeTalents,
} from '../utils/talentUtils';
import FatePointBudget from './talent/FatePointBudget';
import CategoryFilter from './talent/CategoryFilter';
import TalentGrid from './talent/TalentGrid';
import SelectedTalents from './talent/SelectedTalents';
import RandomButton from './talent/RandomButton';

interface Props {
  onStart: (
    playerName: string,
    talentIds: string[],
    difficulty: DifficultyMode
  ) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTalentIds, setSelectedTalentIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TalentCategory | '全部'>('全部');
  // 从 localStorage 读取保存的难度选择，如果没有则默认为 'normal'
  const [difficulty, setDifficulty] = useState<DifficultyMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.difficulty) {
          return settings.difficulty;
        }
      }
    } catch (error) {
      console.error('读取难度设置失败:', error);
    }
    return 'normal';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCost = calculateTotalFateCost(selectedTalentIds);
  const remainingPoints = getRemainingFatePoints(selectedTalentIds);

  // 筛选天赋列表
  const filteredTalents = categoryFilter === '全部'
    ? TALENTS
    : TALENTS.filter((t) => t.category === categoryFilter);

  const handleToggleTalent = (talentId: string) => {
    if (selectedTalentIds.includes(talentId)) {
      setSelectedTalentIds((prev) => prev.filter((id) => id !== talentId));
    } else {
      const talent = TALENTS.find((t) => t.id === talentId);
      if (!talent) return;
      if (totalCost + talent.fateCost > FATE_POINTS_TOTAL) {
        showError('命运点不足，无法选择此天赋！');
        return;
      }
      // 仙品天赋只能选一个
      const isImmortalTier = talent.rarity === '仙品';
      if (isImmortalTier) {
        const hasImmortalSelected = selectedTalentIds.some((id) => {
          const t = TALENTS.find((x) => x.id === id);
          return t && t.rarity === '仙品';
        });
        if (hasImmortalSelected) {
          showError('仙品天赋只能选择一个！请先取消已选的仙品天赋。');
          return;
        }
      }
      setSelectedTalentIds((prev) => [...prev, talentId]);
    }
  };

  const handleRemoveTalent = (talentId: string) => {
    setSelectedTalentIds((prev) => prev.filter((id) => id !== talentId));
  };

  const handleRandom = () => {
    const randomIds = randomizeTalents(FATE_POINTS_TOTAL);
    setSelectedTalentIds(randomIds);
  };

  const handleClear = () => {
    setSelectedTalentIds([]);
  };

  const handleStart = () => {
    if (!playerName.trim()) {
      showError('请输入修仙者名称！');
      return;
    }
    if (selectedTalentIds.length === 0) {
      showError('请至少选择一个天赋，或使用随机分配！');
      return;
    }
    onStart(playerName.trim(), selectedTalentIds, difficulty);
  };

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      const saveData = importSave(text);

      if (!saveData) {
        showError('存档文件格式错误！请确保文件内容是有效的JSON格式。');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (!saveData.player || !Array.isArray(saveData.logs)) {
        showError('存档数据格式错误！缺少必要的数据字段。');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      try {
        const success = saveGameData(
          ensurePlayerStatsCompatibility(saveData.player),
          saveData.logs || []
        );

        if (!success) {
          showError('保存存档失败，请重试！');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        // window.location.reload();
      } catch (error) {
        console.error('保存存档失败:', error);
        showError(`保存存档失败：${error instanceof Error ? error.message : '未知错误'}，请重试！`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('导入存档失败:', error);
      showError(
        `导入存档失败！错误信息: ${error instanceof Error ? error.message : '未知错误'}，请检查文件格式是否正确。`
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 保存难度选择到 localStorage
  const saveDifficulty = (newDifficulty: DifficultyMode) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = saved ? JSON.parse(saved) : {};
      settings.difficulty = newDifficulty;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('保存难度设置失败:', error);
    }
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDifficulty = e.target.value as DifficultyMode;
    setDifficulty(newDifficulty);
    saveDifficulty(newDifficulty);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-4 md:p-6 max-w-4xl w-full shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            云灵修仙
          </h1>
          <p className="text-stone-400 text-sm md:text-lg">踏上你的长生之路</p>
        </div>

        <div className="space-y-4 md:space-y-5">
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

          {/* 命运点预算 */}
          <FatePointBudget used={totalCost} total={FATE_POINTS_TOTAL} />

          {/* 天赋选择 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <Sparkles size={18} className="md:w-5 md:h-5" />
              天赋选择
              <span className="text-xs text-stone-500 font-normal">
                （消耗命运点选择天赋，可多选）
              </span>
            </label>

            {/* 分类筛选 */}
            <CategoryFilter
              selected={categoryFilter}
              onSelect={setCategoryFilter}
            />

            {/* 天赋卡片网格 */}
            <div className="max-h-[300px] md:max-h-[350px] overflow-y-auto pr-1 mt-3 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
              <TalentGrid
                talents={filteredTalents}
                selectedIds={selectedTalentIds}
                remainingPoints={remainingPoints}
                onToggle={handleToggleTalent}
              />
            </div>

            {/* 已选天赋摘要 */}
            <SelectedTalents
              selectedIds={selectedTalentIds}
              totalCost={totalCost}
              totalPoints={FATE_POINTS_TOTAL}
              onRemove={handleRemoveTalent}
            />

            {/* 随机/清空按钮 */}
            <RandomButton
              onRandom={handleRandom}
              onClear={handleClear}
              hasSelection={selectedTalentIds.length > 0}
            />

            <p className="text-[10px] md:text-xs text-stone-500 mt-2">
              * 天赋在游戏开始后不可修改，请谨慎分配命运点
            </p>
          </div>

          {/* 难度选择 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <TriangleAlert size={18} className="md:w-5 md:h-5" />
              游戏难度
            </label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${
                difficulty === 'easy'
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-stone-700 hover:border-mystic-jade/50'
              }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={difficulty === 'easy'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-green-500 accent-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-400">简单模式</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    死亡无惩罚，适合新手体验
                  </p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${
                difficulty === 'normal'
                  ? 'border-yellow-500 bg-yellow-900/20'
                  : 'border-stone-700 hover:border-mystic-jade/50'
              }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={difficulty === 'normal'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-yellow-500 accent-yellow-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-400">普通模式</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    死亡掉落部分属性(10-20%)和装备(1-3件)
                  </p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${
                difficulty === 'hard'
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-stone-700 hover:border-mystic-jade/50'
              }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={difficulty === 'hard'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-red-500 accent-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-400">困难模式</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    死亡清除存档，适合挑战自我
                  </p>
                </div>
              </label>
            </div>
            <p className="text-[10px] md:text-xs text-stone-500 mt-2">
              * 难度模式在游戏开始后可在设置中查看，但建议在开始前选择
            </p>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
            aria-label="导入存档文件"
          />

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={!playerName.trim() || selectedTalentIds.length === 0}
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
