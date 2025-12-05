import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Sword,
  X,
  Zap,
  Option,
  ArrowRight,
  FastForward,
} from 'lucide-react';
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
  onClose: (
    result?: {
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
      petSkillCooldowns?: Record<string, number>; // 灵宠技能冷却状态
    },
    updatedInventory?: Item[]
  ) => void;
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
  // 使用 ref 来创建一个更可靠的锁，防止在状态更新期间重复点击（同步检查）
  const isActionLockedRef = useRef(false);
  // 使用状态来触发重新渲染，确保按钮禁用状态正确更新

  // 初始化战斗
  useEffect(() => {
    if (isOpen && !battleState) {
      isActionLockedRef.current = false;
      setIsProcessing(true); // 初始化时设置为处理中
      initializeTurnBasedBattle(
        player,
        adventureType,
        riskLevel,
        realmMinRealm as any
      )
        .then((state) => {
          setBattleState(state);
          setIsProcessing(false); // 初始化完成后重置
          isActionLockedRef.current = false;
        })
        .catch((error) => {
          console.error('战斗初始化失败:', error);
          setErrorMessage('战斗初始化失败');
          setIsProcessing(false);
          isActionLockedRef.current = false;
          setTimeout(() => setErrorMessage(null), 3000);
        });
    } else if (!isOpen) {
      // 关闭时重置所有状态
      setBattleState(null);
      setIsProcessing(false);
      isActionLockedRef.current = false;
      setShowSkills(false);
      setShowPotions(false);
      setErrorMessage(null);
    }
  }, [isOpen, player, adventureType, riskLevel, realmMinRealm, battleState]);

  // 监控状态，确保操作栏能正确显示
  useEffect(() => {
    if (!battleState) return;

    // 如果应该是玩家回合但 isProcessing 被卡住，自动重置
    if (
      battleState.waitingForPlayerAction &&
      battleState.playerActionsRemaining > 0 &&
      isProcessing
    ) {
      // 检查是否真的在处理中（通过检查是否有正在进行的异步操作）
      // 如果超过2秒还在处理中，可能是卡住了，自动重置
      const timeout = setTimeout(() => {
        if (isProcessing && battleState?.waitingForPlayerAction) {
          console.warn('检测到 isProcessing 可能卡住，自动重置');
          setIsProcessing(false);
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [battleState, isProcessing]);

  // 如果是敌方先手，自动驱动敌人行动，避免界面没有操作栏
  useEffect(() => {
    if (
      !battleState ||
      battleState.waitingForPlayerAction ||
      battleState.enemyActionsRemaining <= 0
    ) {
      // 如果应该是玩家回合但没有操作栏，确保 isProcessing 被重置
      if (battleState?.waitingForPlayerAction && isProcessing) {
        setIsProcessing(false);
      }
      return;
    }

    // 避免多次触发：仅在切到敌人回合且未在处理中时执行
    if (isProcessing) return;

    setIsProcessing(true);
    const timer = setTimeout(() => {
      try {
        let newState = executeEnemyTurn(battleState);

        // 如果敌人行动后轮到玩家但因 0 行动次数直接结束，需要立刻再跑敌人回合，直到玩家可行动或战斗结束
        let safety = 0;
        while (
          !newState.waitingForPlayerAction &&
          newState.enemyActionsRemaining <= 0 &&
          !checkBattleEnd(newState) &&
          safety < 5
        ) {
          newState = executeEnemyTurn(newState);
          safety += 1;
        }

        // 战斗结束立即结算并回调
        if (checkBattleEnd(newState)) {
          const victory = newState.enemy.hp <= 0;
          const hpLoss = player.hp - newState.player.hp;
          const rewards = calculateBattleRewards(
            newState,
            player,
            adventureType,
            riskLevel
          );
          const finalPetSkillCooldowns: Record<string, number> = {};
          if (newState.petSkillCooldowns) {
            Object.keys(newState.petSkillCooldowns).forEach((skillId) => {
              if (newState.petSkillCooldowns![skillId] > 0) {
                finalPetSkillCooldowns[skillId] =
                  newState.petSkillCooldowns![skillId];
              }
            });
          }
          setIsProcessing(false);
          isActionLockedRef.current = false; // 释放锁
          onClose(
            {
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              items: rewards.items,
              petSkillCooldowns:
                Object.keys(finalPetSkillCooldowns).length > 0
                  ? finalPetSkillCooldowns
                  : undefined,
            },
            newState.playerInventory
          );
          return;
        }

        setBattleState(newState);
        setIsProcessing(false);
        isActionLockedRef.current = false; // 释放锁，敌人回合结束后允许玩家操作
      } catch (error) {
        console.error('敌人先手回合错误:', error);
        setErrorMessage('敌人行动出错');
        setIsProcessing(false);
        isActionLockedRef.current = false; // 释放锁
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      // 如果组件卸载或依赖变化，确保重置处理状态
      setIsProcessing(false);
      isActionLockedRef.current = false; // 释放锁
    };
  }, [battleState, isProcessing, player, adventureType, riskLevel, onClose]);

  // 处理玩家行动
  const handlePlayerAction = async (action: PlayerAction) => {
    // 使用 ref 锁进行第一层检查（同步，立即生效）
    if (isActionLockedRef.current) {
      return;
    }

    // 严格检查：必须满足所有条件才能操作
    if (
      !battleState ||
      isProcessing ||
      !battleState.waitingForPlayerAction ||
      battleState.playerActionsRemaining <= 0
    ) {
      return;
    }

    // 立即设置锁，防止重复点击（同时更新 ref 和 state）
    isActionLockedRef.current = true;
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
        const rewards = calculateBattleRewards(
          newState,
          player,
          adventureType,
          riskLevel
        );
        // 清理冷却时间为0的技能冷却
        const finalPetSkillCooldowns: Record<string, number> = {};
        if (newState.petSkillCooldowns) {
          Object.keys(newState.petSkillCooldowns).forEach((skillId) => {
            if (newState.petSkillCooldowns![skillId] > 0) {
              finalPetSkillCooldowns[skillId] = newState.petSkillCooldowns![skillId];
            }
          });
        }
        setIsProcessing(false);
        isActionLockedRef.current = false;
        onClose(
          {
            victory,
            hpLoss,
            expChange: rewards.expChange,
            spiritChange: rewards.spiritChange,
            items: rewards.items,
            petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
          },
          newState.playerInventory
        );
        return;
      }

      // 如果玩家还有剩余行动次数，继续玩家回合
      // 但需要等待状态更新完成，防止快速连续点击
      if (
        newState.waitingForPlayerAction &&
        newState.playerActionsRemaining > 0
      ) {
        setBattleState(newState);
        // 添加短暂延迟，确保状态更新完成后再允许下一次操作
        setTimeout(() => {
          setIsProcessing(false);
          isActionLockedRef.current = false;
        }, 500); // 增加到500ms延迟，确保状态更新完成
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
            const rewards = calculateBattleRewards(
              newState,
              player,
              adventureType,
              riskLevel
            );
            setIsProcessing(false);
            isActionLockedRef.current = false; // 释放锁
            onClose(
              {
                victory,
                hpLoss,
                expChange: rewards.expChange,
                spiritChange: rewards.spiritChange,
                items: rewards.items,
              },
              newState.playerInventory
            );
            return;
          }

          setBattleState(newState);
          setIsProcessing(false);
          isActionLockedRef.current = false; // 释放锁，敌人回合结束后允许玩家操作
        } catch (error) {
          console.error('敌人回合错误:', error);
          setIsProcessing(false);
          isActionLockedRef.current = false; // 释放锁
          setErrorMessage('敌人回合出错');
          setTimeout(() => setErrorMessage(null), 3000);
        }
      }, 1000);
    } catch (error) {
      console.error('战斗行动错误:', error);
      // 显示错误提示（特别是MP不足的情况）
      const errorMsg = error instanceof Error ? error.message : '战斗行动失败';
      setErrorMessage(errorMsg);
      setIsProcessing(false);
      isActionLockedRef.current = false; // 释放锁
      // 3秒后清除错误提示
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 跳过战斗
  const handleSkipBattle = () => {
    if (!battleState || isProcessing) return;

    setIsProcessing(true);
    let currentState = { ...battleState };
    let isBattleEnded = false;
    let loopCount = 0;
    const MAX_LOOPS = 200; // 防止死循环

    try {
      while (!isBattleEnded && loopCount < MAX_LOOPS) {
        loopCount++;

        // 玩家回合
        if (
          currentState.waitingForPlayerAction &&
          currentState.playerActionsRemaining > 0
        ) {
          currentState = executePlayerAction(currentState, { type: 'attack' });
          isBattleEnded = checkBattleEnd(currentState);
          if (isBattleEnded) break;
        }

        // 敌人回合 (如果玩家行动耗尽或不是玩家回合)
        if (
          !isBattleEnded &&
          (!currentState.waitingForPlayerAction ||
            currentState.playerActionsRemaining <= 0)
        ) {
          currentState = executeEnemyTurn(currentState);
          isBattleEnded = checkBattleEnd(currentState);
        }
      }

      // 战斗结束结算
      const victory = currentState.enemy.hp <= 0;
      const hpLoss = player.hp - currentState.player.hp;
      const rewards = calculateBattleRewards(
        currentState,
        player,
        adventureType,
        riskLevel
      );

      onClose(
        {
          victory,
          hpLoss,
          expChange: rewards.expChange,
          spiritChange: rewards.spiritChange,
          items: rewards.items,
        },
        currentState.playerInventory
      );
    } catch (error) {
      console.error('跳过战斗出错:', error);
      setErrorMessage('跳过战斗出错');
      setIsProcessing(false);
    }
  };

  // 获取可用技能（检查冷却和MP）
  const availableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter((skill) => {
      const cooldownOk = (battleState.player.cooldowns[skill.id] || 0) === 0;
      const manaOk =
        !skill.cost.mana || (battleState.player.mana || 0) >= skill.cost.mana;
      return cooldownOk && manaOk;
    });
  }, [battleState]);

  // 获取冷却中或MP不足的技能
  const unavailableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter((skill) => {
      const onCooldown = (battleState.player.cooldowns[skill.id] || 0) > 0;
      const notEnoughMana =
        skill.cost.mana && (battleState.player.mana || 0) < skill.cost.mana;
      return onCooldown || notEnoughMana;
    });
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
        if (
          e.target === e.currentTarget &&
          !battleState.waitingForPlayerAction
        ) {
          // 只在战斗结束时允许点击外部关闭
        }
      }}
    >
      <div
        className="bg-ink-900 border border-stone-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
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
            {battleState.waitingForPlayerAction &&
              battleState.playerActionsRemaining > 0 && (
                <div className="text-xs text-emerald-400 mt-1">
                  剩余行动次数: {battleState.playerActionsRemaining} /{' '}
                  {battleState.playerMaxActions}
                </div>
              )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipBattle}
              disabled={isProcessing}
              className="p-2 rounded border border-stone-600 text-stone-200 hover:bg-stone-700/40 disabled:opacity-50"
              title="跳过战斗"
            >
              <FastForward size={18} />
            </button>
            <button
              onClick={() => onClose()}
              className="p-2 rounded border border-stone-600 text-stone-200 hover:bg-stone-700/40"
              title="关闭战斗"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 战斗区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 敌人信息 */}
          <div className="bg-rose-900/20 border border-rose-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-300 font-semibold">
                {enemyUnit.name}
              </span>
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
              <span className="text-emerald-300 font-semibold">
                {playerUnit.name}
              </span>
              <span className="text-xs text-stone-400">
                HP: {playerUnit.hp} / {playerUnit.maxHp} · MP:{' '}
                {playerUnit.mana || 0} / {playerUnit.maxMana || 100}
                {battleState.waitingForPlayerAction && (
                  <span className="text-emerald-400 ml-2">
                    · 行动: {battleState.playerActionsRemaining}/
                    {battleState.playerMaxActions}
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
        {battleState.waitingForPlayerAction && battleState.playerActionsRemaining > 0 && !isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-ink-900/90">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handlePlayerAction({ type: 'attack' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  isProcessing || battleState.playerActionsRemaining <= 0
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                    : 'border-amber-500 text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Sword size={16} />
                普通攻击
              </button>
              <button
                onClick={() => setShowSkills(!showSkills)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  isProcessing
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                    : 'border-blue-500 text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                <Zap size={16} />
                技能 ({availableSkills.length})
              </button>
              <button
                onClick={() => setShowPotions(!showPotions)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  isProcessing
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                    : 'border-purple-500 text-purple-300 hover:bg-purple-500/10'
                }`}
              >
                <Option size={16} />
                丹药 ({availablePotions.length})
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'defend' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  isProcessing || battleState.playerActionsRemaining <= 0
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                    : 'border-cyan-500 text-cyan-300 hover:bg-cyan-500/10'
                }`}
              >
                <Shield size={16} />
                防御
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'flee' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  isProcessing || battleState.playerActionsRemaining <= 0
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                    : 'border-stone-500 text-stone-300 hover:bg-stone-500/10'
                }`}
              >
                <ArrowRight size={16} />
                逃跑
              </button>
            </div>

            {/* 技能列表 */}
            {showSkills && (
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
                <div className="text-xs text-stone-400 mb-2">可用技能</div>
                <div className="space-y-2">
                  {availableSkills.length === 0 ? (
                    <div className="text-sm text-stone-500">没有可用技能</div>
                  ) : (
                    availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() =>
                          handlePlayerAction({
                            type: 'skill',
                            skillId: skill.id,
                          })
                        }
                        disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                        className={`w-full text-left p-2 rounded border text-sm ${
                          isProcessing || battleState.playerActionsRemaining <= 0
                            ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                            : 'border-blue-700/50 bg-blue-900/20 hover:bg-blue-900/40'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-blue-300 font-semibold">
                            {skill.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {skill.cost.mana
                              ? `消耗灵力: ${skill.cost.mana}`
                              : ''}
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
                    <div className="text-xs text-stone-500 mt-3 mb-2">
                      不可用技能
                    </div>
                    <div className="space-y-2">
                      {unavailableSkills.map((skill) => {
                        const onCooldown =
                          (battleState.player.cooldowns[skill.id] || 0) > 0;
                        const notEnoughMana =
                          skill.cost.mana &&
                          (battleState.player.mana || 0) < skill.cost.mana;
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
                                {onCooldown &&
                                  `冷却: ${battleState.player.cooldowns[skill.id]} 回合`}
                                {notEnoughMana &&
                                  `灵力不足 (需要 ${skill.cost.mana}, 当前 ${battleState.player.mana || 0})`}
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
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
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
                            handlePlayerAction({
                              type: 'item',
                              itemId: item.id,
                            })
                          }
                          disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                          className={`w-full text-left p-2 rounded border text-sm ${
                            isProcessing || battleState.playerActionsRemaining <= 0
                              ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                              : 'border-purple-700/50 bg-purple-900/20 hover:bg-purple-900/40'
                          }`}
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
            <div className="text-center text-rose-300 text-sm">
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnBasedBattleModal;
