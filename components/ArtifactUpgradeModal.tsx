import React, { useState } from 'react';
import { Item, PlayerStats } from '../types';
import {
  UPGRADE_MATERIAL_NAME,
  UPGRADE_STONE_NAME,
  BASE_UPGRADE_COST_STONES,
  BASE_UPGRADE_COST_MATS,
  getUpgradeMultiplier,
  RARITY_MULTIPLIERS,
  UPGRADE_STONE_SUCCESS_BONUS,
} from '../constants';
import {
  X,
  Hammer,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Plus,
  Minus,
} from 'lucide-react';

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
  ) => void;
}

const ArtifactUpgradeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  player,
  onConfirm,
}) => {
  const [upgradeStones, setUpgradeStones] = useState(0);

  if (!isOpen || !item) return null;

  // 从玩家库存中获取最新的物品信息（确保显示的是最新数据）
  const currentItem = player.inventory.find((i) => i.id === item.id) || item;

  const currentLevel = currentItem.level || 0;
  const nextLevel = currentLevel + 1;
  const rarity = currentItem.rarity || '普通';
  const rarityMult = RARITY_MULTIPLIERS[rarity];

  // Cost Calculation - 每次强化后炼器石需求增加
  const costStones = Math.floor(
    BASE_UPGRADE_COST_STONES * (currentLevel + 1) * rarityMult
  );
  const costMats = Math.floor(
    BASE_UPGRADE_COST_MATS * (currentLevel + 1) * (1 + currentLevel * 0.2)
  ); // 每次强化后增加20%

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

  // Current Stats (with Rarity applied already in display logic usually, but here we work on base effect for persistent updates or raw numbers)
  // Note: Inventory stores RAW base effects. InventoryModal applies rarity visual multiplier.
  // HOWEVER, the `handleUpgrade` logic updates the raw effect in inventory.
  // So `item.effect` is the source of truth.

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

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-md md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
          <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Hammer size={20} /> 法宝祭炼
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
              <span className="text-stone-400">灵石消耗</span>
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
              <span className="text-stone-400">{UPGRADE_MATERIAL_NAME}</span>
              <span
                className={
                  playerMats >= costMats ? 'text-stone-200' : 'text-red-400'
                }
              >
                {playerMats} / {costMats}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-400">
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
            onClick={() => {
              onConfirm(currentItem, costStones, costMats, upgradeStones);
              setUpgradeStones(0); // 重置强化石数量
            }}
            disabled={!canAfford}
            className={`
              w-full py-3 rounded font-serif font-bold text-lg transition-all
              ${
                canAfford
                  ? 'bg-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/30 border border-mystic-gold shadow-[0_0_15px_rgba(203,161,53,0.3)]'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
              }
            `}
          >
            {canAfford ? '开始祭炼' : '材料不足'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactUpgradeModal;
