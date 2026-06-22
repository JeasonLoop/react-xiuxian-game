import React, { useState, useRef } from 'react';
import { DifficultyMode, TalentCategory, FATE_POINTS_TOTAL } from '../types';
import { TALENTS } from '../constants/index';
import {
  Sparkles,
  User,
  Upload,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
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

// 步骤定义
const STEPS = [
  { label: '道号', icon: User },
  { label: '天赋', icon: Sparkles },
  { label: '难度', icon: TriangleAlert },
] as const;

interface Props {
  onStart: (
    playerName: string,
    talentIds: string[],
    difficulty: DifficultyMode
  ) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [selectedTalentIds, setSelectedTalentIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TalentCategory | '全部'>('全部');
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

  // 导航：下一步
  const handleNext = () => {
    // Step 0 → 1: 校验道号
    if (currentStep === 0) {
      if (!playerName.trim()) {
        showError('请输入你的道号！');
        return;
      }
      setCurrentStep(1);
      return;
    }
    // Step 1 → 2: 校验天赋
    if (currentStep === 1) {
      if (selectedTalentIds.length === 0) {
        showError('请至少选择一个天赋，或使用随机分配！');
        return;
      }
      setCurrentStep(2);
      return;
    }
  };

  // 导航：上一步
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // 最终开始游戏
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

  // 步骤是否可进入下一步
  const canProceedStep0 = playerName.trim().length > 0;
  const canProceedStep1 = selectedTalentIds.length > 0;
  const canProceed = currentStep === 0 ? canProceedStep0 : currentStep === 1 ? canProceedStep1 : true;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-4 md:p-6 max-w-4xl w-full shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
        {/* 标题 */}
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            云灵修仙
          </h1>
          <p className="text-stone-400 text-sm md:text-lg">踏上你的长生之路</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-6 md:mb-8">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep;
            const isLast = index === STEPS.length - 1;

            return (
              <React.Fragment key={step.label}>
                {/* 步骤圆点 */}
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => {
                      // 允许点击已完成的步骤快速跳转
                      if (index < currentStep) setCurrentStep(index);
                    }}
                    className={`
                      w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                      border-2 transition-all duration-300
                      ${isDone
                        ? 'bg-mystic-gold/20 border-mystic-gold cursor-pointer hover:bg-mystic-gold/30'
                        : isActive
                          ? 'bg-mystic-gold/20 border-mystic-gold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-stone-800 border-stone-600'
                      }
                    `}
                  >
                    {isDone ? (
                      <Check size={18} className="text-mystic-gold md:w-5 md:h-5" />
                    ) : (
                      <StepIcon
                        size={18}
                        className={`md:w-5 md:h-5 ${
                          isActive ? 'text-mystic-gold' : 'text-stone-500'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium ${
                      isActive
                        ? 'text-mystic-gold'
                        : isDone
                          ? 'text-amber-400/70'
                          : 'text-stone-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* 连接线 */}
                {!isLast && (
                  <div
                    className={`w-8 md:w-16 h-0.5 mx-1 md:mx-2 mb-5 transition-colors duration-300 ${
                      index < currentStep ? 'bg-mystic-gold' : 'bg-stone-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 步骤内容 */}
        <div className="min-h-[280px] md:min-h-[320px] transition-all duration-300">
          {/* 第一步：道号 */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-stone-200 mb-2">
                  为你的修仙者取名
                </h2>
                <p className="text-stone-400 text-sm">
                  一个好的道号，是修仙之路的第一步
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
                  <User size={18} className="md:w-5 md:h-5" />
                  道号
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canProceed) handleNext();
                  }}
                  placeholder="请输入你的道号..."
                  className="w-full px-3 md:px-4 py-3 md:py-4 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-jade focus:ring-2 focus:ring-mystic-jade/50 text-base md:text-lg"
                  maxLength={20}
                  autoFocus
                />
                <p className="text-xs text-stone-500 mt-3 text-center">
                  道号将伴随你在修仙世界的一生，请谨慎取名
                </p>
              </div>
            </div>
          )}

          {/* 第二步：天赋选择 */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-stone-200 mb-2">
                  选择你的天赋
                </h2>
                <p className="text-stone-400 text-sm">
                  消耗命运点来赋予角色独特的天赋能力
                </p>
              </div>

              {/* 命运点预算 */}
              <FatePointBudget used={totalCost} total={FATE_POINTS_TOTAL} />

              {/* 分类筛选 */}
              <CategoryFilter
                selected={categoryFilter}
                onSelect={setCategoryFilter}
              />

              {/* 天赋卡片网格 */}
              <div className="max-h-[220px] md:max-h-[280px] overflow-y-auto pr-1 mt-2 scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-stone-800">
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

              <p className="text-[10px] md:text-xs text-stone-500 text-center">
                * 天赋在游戏开始后不可修改，请谨慎分配命运点
              </p>
            </div>
          )}

          {/* 第三步：难度选择 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-stone-200 mb-2">
                  选择游戏难度
                </h2>
                <p className="text-stone-400 text-sm">
                  不同难度决定了死亡惩罚的严重程度
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <label className={`flex items-center gap-3 p-4 bg-stone-800/50 rounded border-2 cursor-pointer transition-all duration-200 ${
                  difficulty === 'easy'
                    ? 'border-green-500 bg-green-900/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        推荐新手
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      死亡无惩罚，适合新手体验
                    </p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 bg-stone-800/50 rounded border-2 cursor-pointer transition-all duration-200 ${
                  difficulty === 'normal'
                    ? 'border-yellow-500 bg-yellow-900/20 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        推荐
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      死亡掉落部分属性(10-20%)和装备(1-3件)
                    </p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 bg-stone-800/50 rounded border-2 cursor-pointer transition-all duration-200 ${
                  difficulty === 'hard'
                    ? 'border-red-500 bg-red-900/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        硬核挑战
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      死亡清除存档，适合挑战自我
                    </p>
                  </div>
                </label>
              </div>
              <p className="text-[10px] md:text-xs text-stone-500 text-center mt-4">
                * 难度模式在游戏开始后可在设置中查看，但建议在开始前选择
              </p>
            </div>
          )}
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

        {/* 底部导航按钮 */}
        <div className="mt-6 md:mt-8 space-y-3">
          {/* 步骤导航 */}
          <div className="flex items-center gap-3">
            {/* 上一步按钮（第一步和最后一步不显示） */}
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 border border-stone-600 rounded-lg font-medium text-sm md:text-base transition-colors min-w-[100px]"
              >
                <ChevronLeft size={18} className="md:w-5 md:h-5" />
                上一步
              </button>
            )}

            {/* 下一步 / 开始按钮 */}
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-mystic-gold to-yellow-600 active:from-yellow-600 active:to-mystic-gold text-stone-900 font-bold text-sm md:text-base rounded-lg transition-all duration-300 shadow-lg active:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
              >
                下一步
                <ChevronRight size={18} className="md:w-5 md:h-5" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 py-3 md:py-4 bg-gradient-to-r from-mystic-gold to-yellow-600 active:from-yellow-600 active:to-mystic-gold text-stone-900 font-bold text-sm md:text-lg rounded-lg transition-all duration-300 shadow-lg active:shadow-xl min-h-[48px] touch-manipulation"
              >
                <Sparkles size={20} className="md:w-6 md:h-6" />
                开始修仙之旅
              </button>
            )}
          </div>

          {/* 导入存档（始终可见） */}
          <button
            onClick={handleImportClick}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-stone-700"
          >
            <Upload size={14} />
            导入已有存档
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
