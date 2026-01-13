import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Item, PlayerStats } from '../types';
import {
  UPGRADE_MATERIAL_NAME,
  UPGRADE_STONE_NAME,
  BASE_UPGRADE_COST_STONES,
  BASE_UPGRADE_COST_MATS,
  getUpgradeMultiplier,
  RARITY_MULTIPLIERS,
  UPGRADE_STONE_SUCCESS_BONUS,
} from '../constants/index';
import {
  Hammer,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Modal } from './common';
import { useGameStore } from '../store';

// 常量
const UPGRADE_ANIMATION_DELAY = 1500; // 单次强化动画延迟（毫秒）
const CONTINUOUS_UPGRADE_DELAY = 1000; // 连续强化每次延迟（毫秒）
const CLOSE_DELAY = 500; // 关闭延迟（毫秒）
const FAILURE_PENALTY_RATE = 0.05; // 每次失败降低的成功率（5%）
const MIN_SUCCESS_RATE = 0.05; // 最低成功率（5%）

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  player: PlayerStats;
  onConfirm: (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number,
    failurePenalty?: number
  ) => Promise<'success' | 'failure' | 'error'>;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const ArtifactUpgradeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  player,
  onConfirm,
  setItemActionLog
}) => {
  const [upgradeStones, setUpgradeStones] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [targetLevelInput, setTargetLevelInput] = useState<string>(''); // 临时输入值
  const [upgradeMode, setUpgradeMode] = useState<'single' | 'target'>('single');

  // 当 Modal 打开时重置状态
  useEffect(() => {
    if (isOpen && item) {
      setUpgradeStones(0);
      setIsUpgrading(false);
      setTargetLevel(null);
      setTargetLevelInput('');
      setUpgradeMode('single');
    }
  }, [isOpen, item]);

  if (!item) return null;

  // ==================== 计算函数 ====================
  // 计算单个等级的消耗
  const calculateLevelCost = useCallback((level: number, rarityMult: number) => {
    const stones = Math.floor(
      BASE_UPGRADE_COST_STONES * (level + 1) * rarityMult * (1 + level * 0.25)
    );
    const mats = Math.floor(
      BASE_UPGRADE_COST_MATS * rarityMult * (level + 1) * (1 + level * 0.5)
    );
    return { stones, mats };
  }, []);

  // 计算从当前等级到目标等级的总消耗
  const calculateTotalCost = useCallback((fromLevel: number, toLevel: number, rarityMult: number) => {
    let totalStones = 0;
    let totalMats = 0;

    for (let level = fromLevel; level < toLevel; level++) {
      const { stones, mats } = calculateLevelCost(level, rarityMult);
      totalStones += stones;
      totalMats += mats;
    }

    return { totalStones, totalMats };
  }, [calculateLevelCost]);

  // ==================== 基础数据 ====================
  // 从玩家库存中获取最新的物品信息（确保显示的是最新数据）
  const currentItem = useMemo(
    () => player.inventory.find((i) => i.id === item.id) || item,
    [player.inventory, item]
  );

  const currentLevel = currentItem.level || 0;
  const nextLevel = currentLevel + 1;
  const rarity = currentItem.rarity || '普通';
  const rarityMult = RARITY_MULTIPLIERS[rarity];
  const growthRate = getUpgradeMultiplier(rarity);

  // ==================== 消耗计算 ====================
  const singleUpgradeCost = useMemo(
    () => calculateLevelCost(currentLevel, rarityMult),
    [currentLevel, rarityMult, calculateLevelCost]
  );

  const targetLevelValue = useMemo(
    () => (targetLevel !== null && targetLevel > currentLevel ? targetLevel : null),
    [targetLevel, currentLevel]
  );

  const totalCost = useMemo(() => {
    if (targetLevelValue) {
      return calculateTotalCost(currentLevel, targetLevelValue, rarityMult);
    }
    return { totalStones: singleUpgradeCost.stones, totalMats: singleUpgradeCost.mats };
  }, [targetLevelValue, currentLevel, rarityMult, calculateTotalCost, singleUpgradeCost]);

  const requiredStones = useMemo(
    () => (upgradeMode === 'target' && targetLevelValue ? totalCost.totalStones : singleUpgradeCost.stones),
    [upgradeMode, targetLevelValue, totalCost.totalStones, singleUpgradeCost.stones]
  );

  const requiredMats = useMemo(
    () => (upgradeMode === 'target' && targetLevelValue ? totalCost.totalMats : singleUpgradeCost.mats),
    [upgradeMode, targetLevelValue, totalCost.totalMats, singleUpgradeCost.mats]
  );

  // ==================== 成功率计算 ====================
  const baseSuccessRate = useMemo(
    () => Math.max(0.1, 1 - currentLevel * 0.1 - (rarityMult - 1) * 0.15),
    [currentLevel, rarityMult]
  );

  const successRate = useMemo(
    () => Math.min(1, baseSuccessRate + upgradeStones * UPGRADE_STONE_SUCCESS_BONUS),
    [baseSuccessRate, upgradeStones]
  );

  // ==================== 属性计算 ====================
  const getNextStat = useCallback(
    (val: number) => Math.floor(val * (1 + growthRate)),
    [growthRate]
  );

  const currentEffect = currentItem.effect || {};
  const nextEffect = useMemo(
    () => ({
      attack: currentEffect.attack ? getNextStat(currentEffect.attack) : 0,
      defense: currentEffect.defense ? getNextStat(currentEffect.defense) : 0,
      hp: currentEffect.hp ? getNextStat(currentEffect.hp) : 0,
    }),
    [currentEffect, getNextStat]
  );

  // 计算目标等级的属性
  const targetEffect = useMemo(() => {
    if (upgradeMode === 'target' && targetLevelValue) {
      let effect = { ...currentEffect };
      for (let i = currentLevel; i < targetLevelValue; i++) {
        effect = {
          attack: effect.attack !== undefined ? getNextStat(effect.attack) : undefined,
          defense: effect.defense !== undefined ? getNextStat(effect.defense) : undefined,
          hp: effect.hp !== undefined ? getNextStat(effect.hp) : undefined,
          spirit: effect.spirit !== undefined ? getNextStat(effect.spirit) : undefined,
          physique: effect.physique !== undefined ? getNextStat(effect.physique) : undefined,
          speed: effect.speed !== undefined ? getNextStat(effect.speed) : undefined,
        };
      }
      return effect;
    }
    return nextEffect;
  }, [upgradeMode, targetLevelValue, currentEffect, currentLevel, getNextStat, nextEffect]);

  // ==================== 资源检查 ====================
  const playerStones = player.spiritStones;
  const playerMats = useMemo(
    () => player.inventory.find((i) => i.name === UPGRADE_MATERIAL_NAME)?.quantity || 0,
    [player.inventory]
  );
  const playerUpgradeStones = useMemo(
    () => player.inventory.find((i) => i.name === UPGRADE_STONE_NAME)?.quantity || 0,
    [player.inventory]
  );

  const canAfford = useMemo(
    () => playerStones >= requiredStones && playerMats >= requiredMats,
    [playerStones, requiredStones, playerMats, requiredMats]
  );

  // ==================== 辅助函数 ====================
  const getMissingMaterials = useCallback(() => {
    const missing: string[] = [];
    if (playerStones < requiredStones) missing.push('灵石');
    if (playerMats < requiredMats) missing.push(UPGRADE_MATERIAL_NAME);
    if (upgradeStones > 0 && playerUpgradeStones < upgradeStones) {
      missing.push(UPGRADE_STONE_NAME);
    }
    return missing;
  }, [playerStones, requiredStones, playerMats, requiredMats, upgradeStones, playerUpgradeStones]);

  // 样式类名常量
  const modeButtonActiveClass = 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold';
  const modeButtonInactiveClass = 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700';

  const handleSingleUpgrade = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, UPGRADE_ANIMATION_DELAY));
    const result = await onConfirm(currentItem, singleUpgradeCost.stones, singleUpgradeCost.mats, upgradeStones);

    if (result === 'success') {
      setItemActionLog?.({
        text: `✨ 祭炼成功！${currentItem.name} 品质提升了！`,
        type: 'special'
      });
      setUpgradeStones(0);
      setTimeout(() => {
        setIsUpgrading(false);
        onClose();
      }, CLOSE_DELAY);
    } else if (result === 'failure') {
      setItemActionLog?.({
        text: `❌ 祭炼失败！${currentItem.name} 未能提升品质，材料已消耗。`,
        type: 'danger'
      });
      setIsUpgrading(false);
      setUpgradeStones(0);
    } else {
      const missingItems = getMissingMaterials();
      const errorMsg = missingItems.length > 0
        ? `⚠️ ${missingItems.join('、')}不足，无法进行祭炼！`
        : `⚠️ 材料不足，无法进行祭炼！`;
      setItemActionLog?.({ text: errorMsg, type: 'danger' });
      setIsUpgrading(false);
    }
  }, [currentItem, singleUpgradeCost, upgradeStones, onConfirm, setItemActionLog, getMissingMaterials, onClose]);

  const handleContinuousUpgrade = useCallback(async () => {
    if (!targetLevelValue) return;

    let currentItemLevel = currentLevel;
    let successCount = 0;
    let failureCount = 0;
    let consecutiveFailures = 0;
    const startLevel = currentLevel;

    while (currentItemLevel < targetLevelValue) {
      const latestPlayer = useGameStore.getState().player;
      const latestItem = latestPlayer.inventory.find((i) => i.id === item.id);
      if (!latestItem) break;

      const levelCost = calculateLevelCost(currentItemLevel, rarityMult);
      const currentStones = latestPlayer.spiritStones;
      const currentMats = latestPlayer.inventory.find((i) => i.name === UPGRADE_MATERIAL_NAME)?.quantity || 0;

      if (currentStones < levelCost.stones || currentMats < levelCost.mats) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, CONTINUOUS_UPGRADE_DELAY));
      const result = await onConfirm(latestItem, levelCost.stones, levelCost.mats, upgradeStones, consecutiveFailures);

      if (result === 'success') {
        currentItemLevel++;
        successCount++;
        consecutiveFailures = 0;
      } else if (result === 'failure') {
        failureCount++;
        consecutiveFailures++;
      } else {
        break;
      }
    }

    // 显示结果
    const finalLevel = currentItemLevel;
    const isCompleted = finalLevel >= targetLevelValue;

    if (isCompleted) {
      setItemActionLog?.({
        text: `✨ 连续祭炼完成！${item.name} 从 +${startLevel} 强化到 +${finalLevel}（成功 ${successCount} 次${failureCount > 0 ? `，失败 ${failureCount} 次` : ''}）`,
        type: 'special'
      });
    } else {
      const latestPlayer = useGameStore.getState().player;
      const latestItem = latestPlayer.inventory.find((i) => i.id === item.id);
      let reason = '材料不足无法继续';

      if (latestItem) {
        const nextLevelCost = calculateLevelCost(finalLevel, rarityMult);
        const hasMaterials = latestPlayer.spiritStones >= nextLevelCost.stones &&
          (latestPlayer.inventory.find((i) => i.name === UPGRADE_MATERIAL_NAME)?.quantity || 0) >= nextLevelCost.mats;

        if (hasMaterials && consecutiveFailures > 0) {
          reason = `连续失败 ${consecutiveFailures} 次，成功率过低无法继续`;
        }
      }

      setItemActionLog?.({
        text: `⚠️ 连续祭炼中断！${item.name} 从 +${startLevel} 强化到 +${finalLevel}（成功 ${successCount} 次${failureCount > 0 ? `，失败 ${failureCount} 次` : ''}），${reason}。`,
        type: 'warning'
      });
    }

    setUpgradeStones(0);
    setTimeout(() => {
      setIsUpgrading(false);
      onClose();
    }, CLOSE_DELAY);
  }, [targetLevelValue, currentLevel, item, rarityMult, upgradeStones, onConfirm, setItemActionLog, calculateLevelCost, onClose]);

  const handleUpgrade = useCallback(async () => {
    if (!canAfford || isUpgrading) return;

    setIsUpgrading(true);

    try {
      if (upgradeMode === 'target' && targetLevelValue) {
        await handleContinuousUpgrade();
      } else {
        await handleSingleUpgrade();
      }
    } catch (error) {
      setIsUpgrading(false);
      console.error('Upgrade error:', error);
      setItemActionLog?.({
        text: `❌ 祭炼过程中发生错误，请重试！`,
        type: 'danger'
      });
    }
  }, [canAfford, isUpgrading, upgradeMode, targetLevelValue, handleContinuousUpgrade, handleSingleUpgrade, setItemActionLog]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUpgrading ? () => {} : onClose}
      title="法宝祭炼"
      titleIcon={<Hammer size={20} />}
      size="md"
      height="auto"
      zIndex={60}
      closeOnOverlayClick={!isUpgrading}
      closeOnEsc={!isUpgrading}
    >
      {/* 强化动画覆盖层 */}
      {isUpgrading && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {/* 旋转的圆圈动画 */}
              <div className="absolute inset-0 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin"></div>
              {/* 中心闪烁效果 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-mystic-gold animate-pulse" size={48} />
              </div>
            </div>
            <div className="text-mystic-gold text-xl font-serif font-bold animate-pulse">
              正在祭炼中...
            </div>
            <div className="text-stone-400 text-sm mt-2">
              灵气汇聚中，请稍候
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 relative">
        {/* Header Item Info */}
        <div className="text-center">
          <h4 className="text-2xl font-bold font-serif text-stone-200">
            {currentItem.name}
          </h4>
          <div className="text-stone-400 text-sm mt-1">
            {currentItem.rarity} · +{currentLevel}
          </div>
        </div>

        {/* Upgrade Mode Selection */}
        <div className="bg-ink-900 p-4 rounded border border-stone-700">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setUpgradeMode('single');
                setTargetLevel(null);
                setTargetLevelInput('');
              }}
              className={`flex-1 py-2 px-4 rounded transition-all ${
                upgradeMode === 'single' ? modeButtonActiveClass : modeButtonInactiveClass
              }`}
            >
              单次强化
            </button>
            <button
              onClick={() => setUpgradeMode('target')}
              className={`flex-1 py-2 px-4 rounded transition-all ${
                upgradeMode === 'target' ? modeButtonActiveClass : modeButtonInactiveClass
              }`}
            >
              指定等级
            </button>
          </div>

          {upgradeMode === 'target' && (
            <div className="space-y-2">
              <label className="text-stone-400 text-sm">
                目标等级（当前：+{currentLevel}）
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={currentLevel + 1}
                  max={currentLevel + 50}
                  value={targetLevelInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || /^\d+$/.test(inputValue)) {
                      setTargetLevelInput(inputValue);
                      if (inputValue !== '') {
                        const numValue = parseInt(inputValue, 10);
                        setTargetLevel(!isNaN(numValue) && numValue > currentLevel ? numValue : null);
                      } else {
                        setTargetLevel(null);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setTargetLevelInput('');
                      setTargetLevel(null);
                    } else {
                      const numValue = parseInt(inputValue, 10);
                      if (!isNaN(numValue) && numValue > currentLevel) {
                        setTargetLevelInput(inputValue);
                        setTargetLevel(numValue);
                      } else {
                        setTargetLevelInput('');
                        setTargetLevel(null);
                      }
                    }
                  }}
                  placeholder={`输入目标等级（${currentLevel + 1} 及以上）`}
                  className="flex-1 bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-mystic-gold"
                />
                <button
                  onClick={() => {
                    const quickLevels = [currentLevel + 5, currentLevel + 10, currentLevel + 20];
                    const nextQuick = quickLevels.find(l => l > (targetLevel || currentLevel));
                    const selectedLevel = nextQuick || (currentLevel + 5);
                    setTargetLevel(selectedLevel);
                    setTargetLevelInput(selectedLevel.toString());
                  }}
                  className="px-3 py-2 bg-stone-700 text-stone-300 rounded border border-stone-600 hover:bg-stone-600 text-sm"
                >
                  快速选择
                </button>
              </div>
              {targetLevelValue && (
                <div className="space-y-1 mt-2">
                  <div className="text-stone-400 text-xs">
                    将强化 {targetLevelValue - currentLevel} 次，从 +{currentLevel} 到 +{targetLevelValue}
                  </div>
                  <div className="text-yellow-500 text-xs flex items-center gap-1">
                    ⚠️ 注意：连续强化时，每次失败会降低{Math.floor(FAILURE_PENALTY_RATE * 100)}%成功率（最低{Math.floor(MIN_SUCCESS_RATE * 100)}%）
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Comparison */}
        <div className="bg-ink-900 p-4 rounded border border-stone-700 grid grid-cols-3 gap-4 items-center">
          {/* Current */}
          <div className="space-y-2 text-right">
            <div className="text-stone-500 text-xs mb-1">当前 (+{currentLevel})</div>
            {currentEffect.attack !== undefined && (
              <div className="text-stone-400 flex items-center justify-end gap-1">
                {currentEffect.attack} <Zap size={14} />
              </div>
            )}
            {currentEffect.defense !== undefined && (
              <div className="text-stone-400 flex items-center justify-end gap-1">
                {currentEffect.defense} <Shield size={14} />
              </div>
            )}
            {currentEffect.hp !== undefined && (
              <div className="text-stone-400 flex items-center justify-end gap-1">
                {currentEffect.hp} <Heart size={14} />
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center text-stone-600">
            <ArrowRight size={24} />
          </div>

          {/* Next/Target */}
          <div className="space-y-2 text-left font-bold">
            <div className="text-stone-500 text-xs mb-1">
              {upgradeMode === 'target' && targetLevelValue
                ? `目标 (+${targetLevelValue})`
                : `下一级 (+${nextLevel})`}
            </div>
            <>
              {currentEffect.attack !== undefined && (
                <div className="text-mystic-jade flex items-center gap-1">
                  <Zap size={14} /> {targetEffect.attack}
                </div>
              )}
              {currentEffect.defense !== undefined && (
                <div className="text-mystic-jade flex items-center gap-1">
                  <Shield size={14} /> {targetEffect.defense}
                </div>
              )}
              {currentEffect.hp !== undefined && (
                <div className="text-mystic-jade flex items-center gap-1">
                  <Heart size={14} /> {targetEffect.hp}
                </div>
              )}
            </>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-ink-900 p-4 rounded border border-stone-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-stone-400 text-sm">成功率</span>
            <span
              className={`text-lg font-bold ${successRate >= 0.7 ? 'text-green-400' : successRate >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}
            >
              {Math.floor(successRate * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                successRate >= 0.7
                  ? 'bg-green-500'
                  : successRate >= 0.5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, successRate * 100)}%` }}
            />
          </div>
        </div>

        {/* Cost */}
        <div className="space-y-2">
          {upgradeMode === 'target' && targetLevelValue && (
            <div className="text-stone-500 text-xs mb-2">
              总消耗（从 +{currentLevel} 到 +{targetLevelValue}）
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className={playerStones >= requiredStones ? 'text-stone-400' : 'text-red-400'}>
              灵石消耗{upgradeMode === 'target' && targetLevelValue ? '（总计）' : ''}
            </span>
            <span
              className={
                playerStones >= requiredStones
                  ? 'text-mystic-gold'
                  : 'text-red-400'
              }
            >
              {playerStones} / {requiredStones}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={playerMats >= requiredMats ? 'text-stone-400' : 'text-red-400'}>
              {UPGRADE_MATERIAL_NAME}{upgradeMode === 'target' && targetLevelValue ? '（总计）' : ''}
            </span>
            <span
              className={
                playerMats >= requiredMats ? 'text-stone-200' : 'text-red-400'
              }
            >
              {playerMats} / {requiredMats}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className={upgradeStones <= playerUpgradeStones ? 'text-stone-400' : 'text-red-400'}>
              {UPGRADE_STONE_NAME} (每颗+10%成功率)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setUpgradeStones(Math.max(0, upgradeStones - 1))
                }
                disabled={upgradeStones === 0}
                className="p-1 rounded border border-stone-600 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <span
                className={
                  upgradeStones > playerUpgradeStones
                    ? 'text-red-400'
                    : 'text-stone-200'
                }
              >
                {upgradeStones} / {playerUpgradeStones}
              </span>
              <button
                onClick={() =>
                  setUpgradeStones(
                    Math.min(playerUpgradeStones, upgradeStones + 1)
                  )
                }
                disabled={upgradeStones >= playerUpgradeStones}
                className="p-1 rounded border border-stone-600 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={!canAfford || isUpgrading}
          className={`
            w-full py-3 rounded font-serif font-bold text-lg transition-all relative overflow-hidden
            ${canAfford && !isUpgrading
              ? 'bg-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/30 border border-mystic-gold shadow-[0_0_15px_rgba(203,161,53,0.3)]'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'}
          `}
        >
          {isUpgrading ? (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="animate-spin" size={20} />
              <span>祭炼中...</span>
            </div>
          ) : (
            canAfford
              ? (upgradeMode === 'target' && targetLevelValue
                  ? `连续祭炼到 +${targetLevelValue}`
                  : '开始祭炼')
              : '材料不足'
          )}
        </button>
      </div>
    </Modal>
  );
};

export default ArtifactUpgradeModal;
