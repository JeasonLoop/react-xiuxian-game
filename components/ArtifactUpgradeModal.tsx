import React, { useState, useEffect } from 'react';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  player: PlayerStats;
  onConfirm: (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number
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

  // 当 Modal 打开时重置状态
  useEffect(() => {
    if (isOpen && item) {
      setUpgradeStones(0);
      setIsUpgrading(false);
    }
  }, [isOpen, item]);

  if (!item) return null;

  // 从玩家库存中获取最新的物品信息（确保显示的是最新数据）
  const currentItem = player.inventory.find((i) => i.id === item.id) || item;

  const currentLevel = currentItem.level || 0;
  const nextLevel = currentLevel + 1;
  const rarity = currentItem.rarity || '普通';
  const rarityMult = RARITY_MULTIPLIERS[rarity];

  // Cost Calculation - 每次强化后炼器石需求增加
  // 灵石消耗：基础消耗 * (等级+1) * 品质倍率 * (1 + 等级 * 0.25) - 高等级增长更快
  const costStones = Math.floor(
    BASE_UPGRADE_COST_STONES * (currentLevel + 1) * rarityMult * (1 + currentLevel * 0.25)
  );
  // 材料消耗：基础消耗 * 品质倍率 * (等级+1) * (1 + 等级 * 0.5) - 高等级和品质消耗大幅增加
  const costMats = Math.floor(
    BASE_UPGRADE_COST_MATS * rarityMult * (currentLevel + 1) * (1 + currentLevel * 0.5)
  );

  // 计算基础成功率（根据稀有度和等级）
  const baseSuccessRate = Math.max(
    0.1,
    1 - currentLevel * 0.1 - (rarityMult - 1) * 0.15
  );
  const successRate = Math.min(
    1,
    baseSuccessRate + upgradeStones * UPGRADE_STONE_SUCCESS_BONUS
  );

  // Stat Calculation
  const growthRate = getUpgradeMultiplier(rarity);
  const getNextStat = (val: number) => Math.floor(val * (1 + growthRate));

  const currentEffect = currentItem.effect || {};
  const nextEffect = {
    attack: currentEffect.attack ? getNextStat(currentEffect.attack) : 0,
    defense: currentEffect.defense ? getNextStat(currentEffect.defense) : 0,
    hp: currentEffect.hp ? getNextStat(currentEffect.hp) : 0,
  };

  // Check Resources
  const playerStones = player.spiritStones;
  const playerMats =
    player.inventory.find((i) => i.name === UPGRADE_MATERIAL_NAME)?.quantity ||
    0;
  const playerUpgradeStones =
    player.inventory.find((i) => i.name === UPGRADE_STONE_NAME)?.quantity || 0;
  const maxUpgradeStones = Math.min(upgradeStones, playerUpgradeStones);
  const canAfford = playerStones >= costStones && playerMats >= costMats;

  const handleUpgrade = async () => {
    if (!canAfford || isUpgrading) return;

    setIsUpgrading(true);

    // 延迟1.5秒模拟强化动画
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = await onConfirm(currentItem, costStones, costMats, upgradeStones);

      if (result === 'success') {
        if (setItemActionLog) {
          setItemActionLog({
            text: `✨ 祭炼成功！${currentItem.name} 品质提升了！`,
            type: 'special'
          });
          setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
        }
        setUpgradeStones(0);
        // 延迟一下再关闭，让用户看到结果
        setTimeout(() => {
          setIsUpgrading(false);
          onClose();
        }, 500);
      } else if (result === 'failure') {
        if (setItemActionLog) {
          setItemActionLog({
            text: `❌ 祭炼失败！${currentItem.name} 未能提升品质，材料已消耗。`,
            type: 'danger'
          });
          setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
        }
        setIsUpgrading(false);
        setUpgradeStones(0);
      } else {
        // error - 材料不足等情况
        if (setItemActionLog) {
          // 检查具体缺少什么材料
          const missingItems: string[] = [];
          if (playerStones < costStones) {
            missingItems.push('灵石');
          }
          if (playerMats < costMats) {
            missingItems.push(UPGRADE_MATERIAL_NAME);
          }
          if (upgradeStones > 0 && playerUpgradeStones < upgradeStones) {
            missingItems.push(UPGRADE_STONE_NAME);
          }

          const errorMsg = missingItems.length > 0
            ? `⚠️ ${missingItems.join('、')}不足，无法进行祭炼！`
            : `⚠️ 材料不足，无法进行祭炼！`;

          setItemActionLog({
            text: errorMsg,
            type: 'danger'
          });
          setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
        }
        setIsUpgrading(false);
      }
    } catch (error) {
      setIsUpgrading(false);
      console.error('Upgrade error:', error);
      if (setItemActionLog) {
        setItemActionLog({
          text: `❌ 祭炼过程中发生错误，请重试！`,
          type: 'danger'
        });
        setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
      }
    }
  };

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

        {/* Stats Comparison */}
        <div className="bg-ink-900 p-4 rounded border border-stone-700 grid grid-cols-3 gap-4 items-center">
          {/* Current */}
          <div className="space-y-2 text-right">
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

          {/* Next */}
          <div className="space-y-2 text-left font-bold">
            {currentEffect.attack !== undefined && (
              <div className="text-mystic-jade flex items-center gap-1">
                <Zap size={14} /> {nextEffect.attack}
              </div>
            )}
            {currentEffect.defense !== undefined && (
              <div className="text-mystic-jade flex items-center gap-1">
                <Shield size={14} /> {nextEffect.defense}
              </div>
            )}
            {currentEffect.hp !== undefined && (
              <div className="text-mystic-jade flex items-center gap-1">
                <Heart size={14} /> {nextEffect.hp}
              </div>
            )}
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
          <div className="flex justify-between text-sm">
            <span className={playerStones >= costStones ? 'text-stone-400' : 'text-red-400'}>
              灵石消耗
            </span>
            <span
              className={
                playerStones >= costStones
                  ? 'text-mystic-gold'
                  : 'text-red-400'
              }
            >
              {playerStones} / {costStones}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={playerMats >= costMats ? 'text-stone-400' : 'text-red-400'}>
              {UPGRADE_MATERIAL_NAME}
            </span>
            <span
              className={
                playerMats >= costMats ? 'text-stone-200' : 'text-red-400'
              }
            >
              {playerMats} / {costMats}
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
            canAfford ? '开始祭炼' : '材料不足'
          )}
        </button>
      </div>
    </Modal>
  );
};

export default ArtifactUpgradeModal;
