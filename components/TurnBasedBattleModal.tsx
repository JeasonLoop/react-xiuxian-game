import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Sword, X, Zap, Option, ArrowRight } from 'lucide-react';
import {
  BattleState,
  BattleSkill,
  PlayerAction,
  Item,
  PlayerStats,
  RealmType,
} from '../types';
import {
  executePlayerAction,
  executeEnemyTurn,
  checkBattleEnd,
  initializeTurnBasedBattle,
  calculateBattleRewards,
} from '../services/battleService';
import { BATTLE_POTIONS } from '../constants';

interface TurnBasedBattleModalProps {
  isOpen: boolean;
  player: PlayerStats;
  adventureType: 'normal' | 'lucky' | 'secret_realm';
  riskLevel?: '低' | '中' | '高' | '极度危险';
  realmMinRealm?: RealmType;
  onClose: (result?: {
    victory: boolean;
    hpLoss: number;
    expChange: number;
    spiritChange: number;
    items?: Array<{
      name: string;
      type: string;
      description: string;
      rarity?: string;
      isEquippable?: boolean;
      equipmentSlot?: string;
      effect?: any;
      permanentEffect?: any;
    }>;
  }, updatedInventory?: Item[]) => void;
}

const TurnBasedBattleModal: React.FC<TurnBasedBattleModalProps> = ({
  isOpen,
  player,
  adventureType,
  riskLevel,
  realmMinRealm,
  onClose,
}) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showPotions, setShowPotions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 初始化战斗
  useEffect(() => {
    if (isOpen && !battleState) {
      initializeTurnBasedBattle(
        player,
        adventureType,
        riskLevel,
        realmMinRealm as any
      ).then((state) => {
        setBattleState(state);
      });
    }
  }, [isOpen, player, adventureType, riskLevel, realmMinRealm, battleState]);

  // 处理玩家行动
  const handlePlayerAction = async (action: PlayerAction) => {
    if (!battleState || isProcessing || !battleState.waitingForPlayerAction) {
      return;
    }

    setIsProcessing(true);
    setShowSkills(false);
    setShowPotions(false);

    try {
      // 执行玩家行动
      let newState = executePlayerAction(battleState, action);

      // 检查战斗是否结束
      if (checkBattleEnd(newState)) {
        // 战斗结束，计算奖励
        const victory = newState.enemy.hp <= 0;
        const hpLoss = player.hp - newState.player.hp;
        const rewards = calculateBattleRewards(newState, player, adventureType, riskLevel);
        onClose({
          victory,
          hpLoss,
          expChange: rewards.expChange,
          spiritChange: rewards.spiritChange,
          items: rewards.items,
        }, newState.playerInventory);
        return;
      }

      // 如果玩家还有剩余行动次数，继续玩家回合
      if (newState.waitingForPlayerAction && newState.playerActionsRemaining > 0) {
        setBattleState(newState);
        setIsProcessing(false);
        return; // 继续等待玩家行动
      }

      // 玩家回合结束，延迟后执行敌人回合
      setTimeout(() => {
        try {
          newState = executeEnemyTurn(newState);

          // 再次检查战斗是否结束
          if (checkBattleEnd(newState)) {
            const victory = newState.enemy.hp <= 0;
            const hpLoss = player.hp - newState.player.hp;
            const rewards = calculateBattleRewards(newState, player, adventureType, riskLevel);
            onClose({
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              items: rewards.items,
            }, newState.playerInventory);
            return;
          }

          setBattleState(newState);
          setIsProcessing(false);
        } catch (error) {
          console.error('敌人回合错误:', error);
          setIsProcessing(false);
        }
      }, 1000);
    } catch (error) {
      console.error('战斗行动错误:', error);
      // 显示错误提示（特别是MP不足的情况）
      const errorMsg = error instanceof Error ? error.message : '战斗行动失败';
      setErrorMessage(errorMsg);
      setIsProcessing(false);
      // 3秒后清除错误提示
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 获取可用技能（检查冷却和MP）
  const availableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter(
      (skill) => {
        const cooldownOk = (battleState.player.cooldowns[skill.id] || 0) === 0;
        const manaOk = !skill.cost.mana || (battleState.player.mana || 0) >= skill.cost.mana;
        return cooldownOk && manaOk;
      }
    );
  }, [battleState]);

  // 获取冷却中或MP不足的技能
  const unavailableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter(
      (skill) => {
        const onCooldown = (battleState.player.cooldowns[skill.id] || 0) > 0;
        const notEnoughMana = skill.cost.mana && (battleState.player.mana || 0) < skill.cost.mana;
        return onCooldown || notEnoughMana;
      }
    );
  }, [battleState]);

  // 获取可用丹药（从战斗状态中的背包获取，因为物品使用会更新背包）
  const availablePotions = useMemo(() => {
    if (!battleState) return [];
    const inventory = battleState.playerInventory || player.inventory;
    return inventory.filter((item) => {
      const potionConfig = Object.values(BATTLE_POTIONS).find(
        (p) => p.name === item.name
      );
      return potionConfig && item.quantity > 0;
    });
  }, [battleState, player.inventory]);

  if (!isOpen || !battleState) return null;

  const { player: playerUnit, enemy: enemyUnit } = battleState;
  const playerHpPercent = (playerUnit.hp / playerUnit.maxHp) * 100;
  const enemyHpPercent = (enemyUnit.hp / enemyUnit.maxHp) * 100;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !battleState.waitingForPlayerAction) {
          // 只在战斗结束时允许点击外部关闭
        }
      }}
    >
      <div
        className="bg-ink-900 border border-stone-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">
              回合制战斗 · 第 {battleState.round} 回合
            </div>
            <div className="flex items-center gap-2 text-lg font-serif text-mystic-gold">
              <Sword size={18} className="text-mystic-gold" />
              {enemyUnit.name}
              <span className="text-[11px] text-stone-400 bg-ink-800 px-2 py-0.5 rounded border border-stone-700">
                {enemyUnit.realm}
              </span>
            </div>
            {battleState.waitingForPlayerAction && battleState.playerActionsRemaining > 0 && (
              <div className="text-xs text-emerald-400 mt-1">
                剩余行动次数: {battleState.playerActionsRemaining} / {battleState.playerMaxActions}
              </div>
            )}
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 rounded border border-stone-600 text-stone-200 hover:bg-stone-700/40"
            title="关闭战斗"
          >
            <X size={18} />
          </button>
        </div>

        {/* 战斗区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 敌人信息 */}
          <div className="bg-rose-900/20 border border-rose-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-300 font-semibold">{enemyUnit.name}</span>
              <span className="text-xs text-stone-400">
                HP: {enemyUnit.hp} / {enemyUnit.maxHp}
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-3 mb-2">
              <div
                className="bg-rose-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-stone-400">
              <span>攻击: {enemyUnit.attack}</span>
              <span>防御: {enemyUnit.defense}</span>
              <span>速度: {enemyUnit.speed}</span>
            </div>
          </div>

          {/* 玩家信息 */}
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300 font-semibold">{playerUnit.name}</span>
              <span className="text-xs text-stone-400">
                HP: {playerUnit.hp} / {playerUnit.maxHp} · MP: {playerUnit.mana || 0} / {playerUnit.maxMana || 100}
                {battleState.waitingForPlayerAction && (
                  <span className="text-emerald-400 ml-2">
                    · 行动: {battleState.playerActionsRemaining}/{battleState.playerMaxActions}
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-3 mb-2">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-stone-400">
              <span>攻击: {playerUnit.attack}</span>
              <span>防御: {playerUnit.defense}</span>
              <span>速度: {playerUnit.speed}</span>
              <span>神识: {playerUnit.spirit}</span>
            </div>
            {/* Buff/Debuff显示 */}
            {(playerUnit.buffs.length > 0 || playerUnit.debuffs.length > 0) && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {playerUnit.buffs.map((buff) => (
                  <span
                    key={buff.id}
                    className="text-xs bg-emerald-700/30 text-emerald-200 px-2 py-0.5 rounded"
                    title={buff.description || buff.name}
                  >
                    {buff.name}
                  </span>
                ))}
                {playerUnit.debuffs.map((debuff) => (
                  <span
                    key={debuff.id}
                    className="text-xs bg-rose-700/30 text-rose-200 px-2 py-0.5 rounded"
                    title={debuff.description || debuff.name}
                  >
                    {debuff.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 战斗日志 */}
          {battleState.history.length > 0 && (
            <div className="bg-ink-800/60 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="text-xs text-stone-400 mb-2">战斗日志</div>
              <div className="space-y-2">
                {battleState.history.slice(-5).map((action) => (
                  <div
                    key={action.id}
                    className={`text-sm ${
                      action.turn === 'player'
                        ? 'text-emerald-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {action.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 行动选择区域 */}
        {battleState.waitingForPlayerAction && !isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-ink-900/90">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handlePlayerAction({ type: 'attack' })}
                className="flex items-center gap-2 px-4 py-2 rounded border border-amber-500 text-amber-300 hover:bg-amber-500/10"
              >
                <Sword size={16} />
                普通攻击
              </button>
              <button
                onClick={() => setShowSkills(!showSkills)}
                className="flex items-center gap-2 px-4 py-2 rounded border border-blue-500 text-blue-300 hover:bg-blue-500/10"
              >
                <Zap size={16} />
                技能 ({availableSkills.length})
              </button>
              <button
                onClick={() => setShowPotions(!showPotions)}
                className="flex items-center gap-2 px-4 py-2 rounded border border-purple-500 text-purple-300 hover:bg-purple-500/10"
              >
                <Option size={16} />
                丹药 ({availablePotions.length})
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'defend' })}
                className="flex items-center gap-2 px-4 py-2 rounded border border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
              >
                <Shield size={16} />
                防御
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'flee' })}
                className="flex items-center gap-2 px-4 py-2 rounded border border-stone-500 text-stone-300 hover:bg-stone-500/10"
              >
                <ArrowRight size={16} />
                逃跑
              </button>
            </div>

            {/* 技能列表 */}
            {showSkills && (
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700">
                <div className="text-xs text-stone-400 mb-2">可用技能</div>
                <div className="space-y-2">
                  {availableSkills.length === 0 ? (
                    <div className="text-sm text-stone-500">没有可用技能</div>
                  ) : (
                    availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() =>
                          handlePlayerAction({ type: 'skill', skillId: skill.id })
                        }
                        className="w-full text-left p-2 rounded border border-blue-700/50 bg-blue-900/20 hover:bg-blue-900/40 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-blue-300 font-semibold">
                            {skill.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {skill.cost.mana ? `消耗灵力: ${skill.cost.mana}` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                          {skill.description}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {unavailableSkills.length > 0 && (
                  <>
                    <div className="text-xs text-stone-500 mt-3 mb-2">不可用技能</div>
                    <div className="space-y-2">
                      {unavailableSkills.map((skill) => {
                        const onCooldown = (battleState.player.cooldowns[skill.id] || 0) > 0;
                        const notEnoughMana = skill.cost.mana && (battleState.player.mana || 0) < skill.cost.mana;
                        return (
                          <div
                            key={skill.id}
                            className="w-full text-left p-2 rounded border border-stone-700 bg-stone-900/40 text-sm opacity-50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-stone-400 font-semibold">
                                {skill.name}
                              </span>
                              <span className="text-xs text-stone-500">
                                {onCooldown && `冷却: ${battleState.player.cooldowns[skill.id]} 回合`}
                                {notEnoughMana && `灵力不足 (需要 ${skill.cost.mana}, 当前 ${battleState.player.mana || 0})`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 丹药列表 */}
            {showPotions && (
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700">
                <div className="text-xs text-stone-400 mb-2">可用丹药</div>
                <div className="space-y-2">
                  {availablePotions.length === 0 ? (
                    <div className="text-sm text-stone-500">没有可用丹药</div>
                  ) : (
                    availablePotions.map((item) => {
                      const potionConfig = Object.values(BATTLE_POTIONS).find(
                        (p) => p.name === item.name
                      );
                      if (!potionConfig) return null;
                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            handlePlayerAction({ type: 'item', itemId: item.id })
                          }
                          className="w-full text-left p-2 rounded border border-purple-700/50 bg-purple-900/20 hover:bg-purple-900/40 text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300 font-semibold">
                              {item.name}
                            </span>
                            <span className="text-xs text-stone-400">
                              数量: {item.quantity}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            {potionConfig.type === 'heal'
                              ? `恢复 ${potionConfig.effect.heal} 点气血`
                              : '获得增益效果'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 处理中提示 */}
        {isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-ink-900/90">
            <div className="text-center text-stone-400">处理中...</div>
          </div>
        )}

        {/* 错误提示 */}
        {errorMessage && (
          <div className="border-t border-stone-700 px-6 py-4 bg-rose-900/20 border-rose-700/40">
            <div className="text-center text-rose-300 text-sm">{errorMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnBasedBattleModal;

