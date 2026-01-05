import React from 'react';
import { PlayerStats, DifficultyMode } from '../types';
import { BattleReplay } from '../services/battleService';
import { Flame, Sword, Heart, Skull, RotateCcw } from 'lucide-react';
import { Modal } from './common';

interface DeathModalProps {
  isOpen: boolean;
  player: PlayerStats;
  battleData: BattleReplay | null;
  deathReason: string;
  difficulty: DifficultyMode;
  onRebirth: () => void;
  onContinue?: () => void; // 继续游戏（普通模式和简单模式）
}

const DeathModal: React.FC<DeathModalProps> = ({
  isOpen,
  player,
  battleData,
  deathReason,
  difficulty,
  onRebirth,
  onContinue,
}) => {
  // 计算战斗统计
  const battleStats = battleData
    ? {
        totalRounds: battleData.rounds.length,
        playerDamage: battleData.rounds
          .filter((r) => r.attacker === 'player')
          .reduce((sum, r) => sum + r.damage, 0),
        enemyDamage: battleData.rounds
          .filter((r) => r.attacker === 'enemy')
          .reduce((sum, r) => sum + r.damage, 0),
        critCount: battleData.rounds.filter((r) => r.crit).length,
        maxDamage: Math.max(...battleData.rounds.map((r) => r.damage), 0),
      }
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // 不允许关闭
      title={
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <Skull
            size={32}
            className="md:w-12 md:h-12 text-red-500 animate-pulse"
          />
          <span className="text-2xl md:text-3xl font-serif font-bold text-red-400">
            身死道消
          </span>
          <Skull
            size={32}
            className="md:w-12 md:h-12 text-red-500 animate-pulse"
          />
        </div>
      }
      size="2xl"
      height="auto"
      zIndex={100}
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showHeaderBorder={false}
      containerClassName="bg-gradient-to-br from-red-900/95 via-stone-900 to-red-900/95 border-2 md:border-4 border-red-600"
    >
      {/* 副标题 */}
      <div className="text-center mb-3 md:mb-4 -mt-2">
        <p className="text-stone-300 text-sm md:text-base">
          {player.name} 在修仙路上遭遇不测...
        </p>
      </div>

      {/* 死亡原因 */}
      <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-bold text-red-400 mb-1 md:mb-2 flex items-center gap-1 md:gap-2">
          <Flame size={16} className="md:w-5 md:h-5" />
          死亡原因
        </h2>
        <p className="text-stone-200 text-xs md:text-sm leading-relaxed">
          {deathReason}
        </p>
      </div>

      {/* 战斗统计 */}
      {battleStats && battleData && (
        <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-bold text-red-400 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
            <Sword size={16} className="md:w-5 md:h-5" />
            最后战斗统计
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                敌人
              </div>
              <div className="text-stone-200 font-bold text-sm md:text-base break-words">
                {battleData.enemy.title}
                {battleData.enemy.name}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                战斗回合
              </div>
              <div className="text-stone-200 font-bold text-sm md:text-base">
                {battleStats.totalRounds} 回合
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                造成伤害
              </div>
              <div className="text-red-300 font-bold text-sm md:text-base">
                {battleStats.playerDamage}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                承受伤害
              </div>
              <div className="text-red-400 font-bold text-sm md:text-base">
                {battleStats.enemyDamage}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                暴击次数
              </div>
              <div className="text-yellow-400 font-bold text-sm md:text-base">
                {battleStats.critCount}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-2">
              <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                最大伤害
              </div>
              <div className="text-orange-400 font-bold text-sm md:text-base">
                {battleStats.maxDamage}
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-stone-700 space-y-1 md:space-y-2">
            <div className="flex items-center justify-between text-stone-300 text-xs md:text-sm">
              <span>战斗前气血:</span>
              <span className="font-bold">{battleData.playerHpBefore}</span>
            </div>
            <div className="flex items-center justify-between text-stone-300 text-xs md:text-sm">
              <span>战斗后气血:</span>
              <span className="font-bold text-red-400">
                {battleData.playerHpAfter}
              </span>
            </div>
            <div className="flex items-center justify-between text-red-400 text-xs md:text-sm font-bold">
              <span>气血损失:</span>
              <span>-{battleData.hpLoss}</span>
            </div>
          </div>
        </div>
      )}

      {/* 角色信息 */}
      <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-bold text-red-400 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
          <Heart size={16} className="md:w-5 md:h-5" />
          最终状态
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              境界
            </div>
            <div className="text-stone-200 font-bold text-xs md:text-sm">
              {player.realm}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              层数
            </div>
            <div className="text-stone-200 font-bold text-xs md:text-sm">
              {player.realmLevel} 层
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              修为
            </div>
            <div className="text-stone-200 font-bold text-xs md:text-sm">
              {player.exp}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              灵石
            </div>
            <div className="text-stone-200 font-bold text-xs md:text-sm">
              {player.spiritStones}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              攻击
            </div>
            <div className="text-red-300 font-bold text-xs md:text-sm">
              {player.attack}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              防御
            </div>
            <div className="text-blue-300 font-bold text-xs md:text-sm">
              {player.defense}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              气血上限
            </div>
            <div className="text-pink-300 font-bold text-xs md:text-sm">
              {player.maxHp}
            </div>
          </div>
          <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
            <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
              速度
            </div>
            <div className="text-cyan-300 font-bold text-xs md:text-sm">
              {player.speed}
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="text-center space-y-2">
        {difficulty === 'hard' ? (
          <>
            <button
              onClick={onRebirth}
              className="w-full py-2.5 md:py-3 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 text-white font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 touch-manipulation"
            >
              <Flame size={18} className="md:w-6 md:h-6" />
              涅槃重生
            </button>
            <p className="text-stone-400 text-xs md:text-sm mt-2 md:mt-3">
              困难模式下死亡将清除存档，点击后将重置所有数据，返回开始页面
            </p>
          </>
        ) : (
          <>
            {onContinue && (
              <button
                onClick={onContinue}
                className="w-full py-2.5 md:py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 touch-manipulation"
              >
                <RotateCcw size={18} className="md:w-6 md:h-6" />
                继续游戏
              </button>
            )}
            <button
              onClick={onRebirth}
              className="w-full py-2 md:py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold text-sm md:text-base rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 touch-manipulation"
            >
              <Flame size={16} className="md:w-5 md:h-5" />
              涅槃重生（重新开始）
            </button>
            <p className="text-stone-400 text-xs md:text-sm mt-2">
              {difficulty === 'easy'
                ? '简单模式下死亡无惩罚，你可以继续游戏或选择重新开始'
                : '普通模式下死亡会掉落部分属性和装备，你可以继续游戏或选择重新开始'}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DeathModal;
