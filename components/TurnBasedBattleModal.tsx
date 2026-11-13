import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import {
  Sword,
  FastForward,
  Skull,
  Trophy,
  Crown,
} from 'lucide-react';
import {
  BattleState,
  PlayerAction,
  Item,
  PlayerStats,
  RealmType,
  DifficultyMode,
} from '../types';
import {
  executePlayerAction,
  executeEnemyTurn,
  checkBattleEnd,
  initializeTurnBasedBattle,
  calculateBattleRewards,
} from '../services/battleService';
 import { BATTLE_POTIONS, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../constants/index';
import { useUIStore } from '../store/uiStore';
import BattleResultSummary from './BattleResultSummary';

import {
  FighterPanel,
  DamageFloat,
  SkillBanner,
  classifyBattleLog,
  buildTurnActionEvent,
  useBattleStageEffects,
  LoadoutSkillBar,
} from './battle';
import { getBattleLoadout } from '../utils/battleLoadout';

interface TurnBasedBattleModalProps {
  isOpen: boolean;
  player: PlayerStats;
  adventureType: 'normal' | 'lucky' | 'secret_realm' | 'sect_challenge' | 'dao_combining_challenge';
  riskLevel?: '低' | '中' | '高' | '极度危险';
  realmMinRealm?: RealmType;
  bossId?: string; // 指定的天地之魄BOSS ID（用于事件模板）
  difficulty?: DifficultyMode;
  autoAdventure?: boolean; // 是否在自动历练模式下
  onClose: (
    result?: {
      victory: boolean;
      hpLoss: number;
      expChange: number;
      spiritChange: number;
      adventureType?:
        | 'normal'
        | 'lucky'
        | 'secret_realm'
        | 'sect_challenge'
        | 'dao_combining_challenge';
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

interface BattleSettlementResult {
  victory: boolean;
  hpLoss: number;
  expChange: number;
  spiritChange: number;
  adventureType?:
    | 'normal'
    | 'lucky'
    | 'secret_realm'
    | 'sect_challenge'
    | 'dao_combining_challenge';
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
  petSkillCooldowns?: Record<string, number>;
}

const TurnBasedBattleModal: React.FC<TurnBasedBattleModalProps> = ({
  isOpen,
  player,
  adventureType,
  riskLevel,
  realmMinRealm,
  bossId,
  difficulty = 'normal',
  onClose,
}) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [showPotions, setShowPotions] = useState(false);
  const [showAdvancedItems, setShowAdvancedItems] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<{
    result: BattleSettlementResult;
    updatedInventory?: Item[];
  } | null>(null);
  // 使用 ref 来创建一个更可靠的锁，防止在状态更新期间重复点击（同步检查）
  const isActionLockedRef = useRef(false);
  // 使用状态来触发重新渲染，确保按钮禁用状态正确更新

  // 战斗技能栏装配序列（localStorage 持久化，独立于玩家存档；仅展示层使用）
  const [battleLoadout, setBattleLoadout] = useState<string[]>(() => getBattleLoadout());
  // 每次战斗弹窗打开时重新读取装配配置，保证角色面板中的修改在后续战斗中生效
  useEffect(() => {
    if (isOpen) {
      setBattleLoadout(getBattleLoadout());
    }
  }, [isOpen]);
  const getActionActorLabel = (action: BattleState['history'][number]) => {
    if (action.turn === 'enemy') return '敌方出手';
    if (action.actionType === 'item') return '丹药生效';
    if (action.actionType === 'defend') return '防御姿态';
    if (action.actor === 'player' && action.description.startsWith('【')) return '灵宠出手';
    return '你的出手';
  };

  const getActionDetailTags = (action: BattleState['history'][number]) => {
    const tags: Array<{ text: string; className: string }> = [];
    if (action.result.miss) {
      tags.push({ text: '闪避', className: 'border-stone-500 text-stone-300' });
    }
    if (action.result.damage && action.result.damage > 0) {
      tags.push({ text: `伤害 ${action.result.damage}`, className: 'border-rose-500/60 text-rose-300' });
    }
    if (action.result.heal && action.result.heal > 0) {
      tags.push({ text: `治疗 ${action.result.heal}`, className: 'border-emerald-500/60 text-emerald-300' });
    }
    if (action.result.crit) {
      tags.push({ text: '暴击', className: 'border-yellow-500/70 text-yellow-300' });
    }
    if (action.result.reflectedDamage && action.result.reflectedDamage > 0) {
      tags.push({ text: `反弹 ${action.result.reflectedDamage}`, className: 'border-cyan-500/60 text-cyan-300' });
    }
    if (action.result.manaCost && action.result.manaCost > 0) {
      tags.push({ text: `灵力 -${action.result.manaCost}`, className: 'border-blue-500/60 text-blue-300' });
    }
    return tags;
  };

  // 初始化战斗 - 使用 ref 防止重复初始化
  const isInitializedRef = useRef(false);
  // 用于跟踪初始化是否已超时
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitTimedOutRef = useRef(false);

  useEffect(() => {
    if (isOpen && !battleState && !isInitializedRef.current) {
      isInitializedRef.current = true;
      isActionLockedRef.current = false;
      setIsProcessing(true); // 初始化时设置为处理中

      // 重置超时标志
      hasInitTimedOutRef.current = false;

      // 添加初始化超时保护（10秒），防止AI调用导致永久卡住
      initTimeoutRef.current = setTimeout(() => {
        if (isInitializedRef.current) {
          hasInitTimedOutRef.current = true;
          console.error('战斗初始化超时（10秒）');
          setErrorMessage('战斗初始化超时，请重试');
          setIsProcessing(false);
          isActionLockedRef.current = false;
          isInitializedRef.current = false; // 允许重试
          initTimeoutRef.current = null;
          setTimeout(() => setErrorMessage(null), 3000);
        }
      }, 10000);

      initializeTurnBasedBattle(
        player,
        adventureType,
        riskLevel,
        realmMinRealm as any,
        undefined,
        bossId,
        difficulty
      )
        .then((state) => {
          if (hasInitTimedOutRef.current || !isInitializedRef.current) {
            // 如果已超时，忽略结果
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            return;
          }
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          setBattleState(state);
          setIsProcessing(false); // 初始化完成后重置
          isActionLockedRef.current = false;

          // 输出遭遇敌人的提示（使用实际生成的敌人信息）
          const enemyName = state.enemy.name;
          const store = useUIStore.getState();
          if (store.turnBasedBattleParams?.onBattleInitialized) {
            store.turnBasedBattleParams.onBattleInitialized(enemyName);
          }
        })
        .catch((error) => {
          if (hasInitTimedOutRef.current || !isInitializedRef.current) {
            // 如果已超时，忽略错误
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            return;
          }
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          console.error('战斗初始化失败:', error);
          setErrorMessage('战斗初始化失败');
          setIsProcessing(false);
          isActionLockedRef.current = false;
          isInitializedRef.current = false; // 初始化失败，允许重试
          setTimeout(() => setErrorMessage(null), 3000);
        });
    } else if (!isOpen && battleState) {
      // 关闭时重置所有状态
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      hasInitTimedOutRef.current = false;
      isInitializedRef.current = false;
      isProcessingEnemyTurnRef.current = false;
      setBattleState(null);
      setIsProcessing(false);
      isActionLockedRef.current = false;
      setShowPotions(false);
      setShowAdvancedItems(false);
      setErrorMessage(null);
      setSettlement(null);
    }
  }, [isOpen, player, adventureType, riskLevel, realmMinRealm, bossId, difficulty]);

  const prepareSettlement = (
    result: BattleSettlementResult,
    updatedInventory?: Item[]
  ) => {
    setSettlement({ result, updatedInventory });
    isProcessingEnemyTurnRef.current = false;
    setIsProcessing(false);
    isActionLockedRef.current = false;
  };
  // onClose 父组件每次渲染都会重建，用 ref 固定引用供自动关闭定时器回调使用
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 胜利结算：显示「战斗胜利」横幅 1 秒后自动关闭弹窗（携带与确认按钮相同的结算数据）；
  // 失败时不触发自动关闭，保留确认按钮由玩家手动查看损失。
  // 定时器在组件卸载/提前关闭时清理，避免重复回调。
  useEffect(() => {
    if (!settlement?.result.victory) return;
    const timer = window.setTimeout(() => {
      onCloseRef.current(settlement.result, settlement.updatedInventory);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [settlement]);

  // 监控状态，确保操作栏能正确显示（防止 isProcessing 卡住）
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
        setIsProcessing((prev) => {
          // 只有在仍然是处理中且仍然是玩家回合时才重置
          if (prev && battleState?.waitingForPlayerAction) {
            console.warn('检测到 isProcessing 可能卡住，自动重置');
            return false;
          }
          return prev;
        });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [battleState?.waitingForPlayerAction, battleState?.playerActionsRemaining, isProcessing]);

  // 如果是敌方先手，自动驱动敌人行动，避免界面没有操作栏
  // 使用 ref 跟踪是否正在处理敌人回合，避免重复触发
  const isProcessingEnemyTurnRef = useRef(false);

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
      isProcessingEnemyTurnRef.current = false;
      return;
    }

    // 避免多次触发：使用 ref 检查是否正在处理
    if (isProcessingEnemyTurnRef.current || isProcessing) {
      return;
    }

    isProcessingEnemyTurnRef.current = true;
    setIsProcessing(true);

    // 使用更短的延迟，让界面更新更快
    const timer = setTimeout(() => {
      try {
        let newState = executeEnemyTurn(battleState);

        // 如果玩家行动次数为0（速度太慢），继续执行敌人回合直到玩家可以行动或战斗结束
        // executeEnemyTurn 已经处理了这种情况，但为了安全起见，这里再检查一次
        let safety = 0;
        while (
          newState.waitingForPlayerAction &&
          newState.playerActionsRemaining <= 0 &&
          !checkBattleEnd(newState) &&
          safety < 10
        ) {
          // 玩家无法行动，立即切换回敌人回合（executeEnemyTurn 应该已经处理，但以防万一）
          if (newState.enemyActionsRemaining <= 0) {
            newState.waitingForPlayerAction = false;
            newState.turn = 'enemy';
            newState.enemyActionsRemaining = newState.enemyMaxActions;
          }
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
            riskLevel,
            difficulty
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
          prepareSettlement(
            {
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              adventureType,
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

        // 直接设置状态，然后在下一个事件循环中重置处理标志
        setBattleState(newState);

        // 使用 setTimeout 确保状态更新完成后再重置处理标志
        setTimeout(() => {
          isProcessingEnemyTurnRef.current = false;
          setIsProcessing(false);
          isActionLockedRef.current = false; // 释放锁，敌人回合结束后允许玩家操作
        }, 50);
      } catch (error) {
        console.error('敌人先手回合错误:', error);
        isProcessingEnemyTurnRef.current = false;
        setErrorMessage('敌人行动出错');
        setIsProcessing(false);
        isActionLockedRef.current = false; // 释放锁
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }, 100); // 减少延迟时间

    return () => {
      clearTimeout(timer);
    };
  }, [battleState?.waitingForPlayerAction, battleState?.enemyActionsRemaining, battleState?.id]);


  // ===== 战斗演出（纯展示层）：监听新增的行动记录，逐条错开播放演出 =====
  const stageEffects = useBattleStageEffects();
  const playedHistoryCountRef = useRef(0);

  useEffect(() => {
    if (!battleState) {
      // 战斗关闭/重置：清空演出并重置播放游标
      playedHistoryCountRef.current = 0;
      stageEffects.clear();
      return;
    }
    const history = battleState.history;
    if (history.length <= playedHistoryCountRef.current) {
      playedHistoryCountRef.current = Math.min(playedHistoryCountRef.current, history.length);
      return;
    }
    // 一次状态更新可能追加多条记录（如玩家+灵宠连动），每 380ms 错开演出，
    // 不阻塞下一次玩家操作，只做视觉演出
    const newEntries = history.slice(playedHistoryCountRef.current);
    playedHistoryCountRef.current = history.length;
    const schedule = stageEffects.schedule;
    const playEntry = stageEffects.playEntry;
    newEntries.forEach((action, index) => {
      schedule(() => playEntry(buildTurnActionEvent(action, battleState)), index * 380);
    });
  }, [battleState?.id, battleState?.history.length, stageEffects.schedule, stageEffects.playEntry]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setShowPotions(false);
    setShowAdvancedItems(false);

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
          riskLevel,
          difficulty
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
        prepareSettlement(
          {
            victory,
            hpLoss,
            expChange: rewards.expChange,
            spiritChange: rewards.spiritChange,
            adventureType,
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
              riskLevel,
              difficulty
            );
            prepareSettlement(
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
    // 精英强敌/秘境机制 BOSS：禁止跳过战斗（与按钮隐藏逻辑保持一致，防御性兜底）
    if (battleState.enemyIsElite || battleState.enemy.bossEncounterId) return;

    setIsProcessing(true);
    let currentState = { ...battleState };
    let isBattleEnded = false;
    let loopCount = 0;
    const MAX_LOOPS = 200;

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
            riskLevel,
            difficulty
          );

          prepareSettlement(
            {
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              adventureType,
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


  // 获取可用丹药（从战斗状态中的背包获取，因为物品使用会更新背包）
  const availablePotions = useMemo(() => {
    if (!battleState) return [];
    const inventory = battleState.playerInventory || player.inventory;
    if (!Array.isArray(inventory)) return [];
    return inventory.filter((item) => {
      const potionConfig = Object.values(BATTLE_POTIONS).find(
        (p) => p.name === item.name
      );
      return potionConfig && item.quantity > 0;
    });
  }, [battleState?.playerInventory, player.inventory]);

  if (!isOpen || !battleState) return null;
  const { player: playerUnit, enemy: enemyUnit } = battleState;
  // 秘境机制 BOSS 判定：回合制初始化时 bossEncounterId 会写入敌方单位（见 applyBossUnitInit），
  // 徽标/跳过禁用直接使用 battleState.enemy?.bossEncounterId 判断
  // 确保HP值是整数（避免浮点数精度问题）
  const playerHp = Math.floor(playerUnit.hp);
  const playerMaxHp = Math.floor(playerUnit.maxHp);
  const enemyHp = Math.floor(enemyUnit.hp);
  const enemyMaxHp = Math.floor(enemyUnit.maxHp);
  // 演出区震屏（暴击时触发，奇偶交替重触发动画）
  const stageShakeClass =
    stageEffects.stageShakeTick > 0
      ? stageEffects.stageShakeTick % 2 === 1
        ? 'anim-shake-a'
        : 'anim-shake-b'
      : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // onClose is handled by internal logic
      title={
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest leading-none mb-1">
            {settlement ? '战斗结算' : `回合制战斗 · 第 ${battleState.round} 回合`}
          </div>
          <div className="flex items-center gap-2 text-base md:text-lg font-serif text-mystic-gold">
            <Sword size={16} className="text-mystic-gold" />
            {enemyUnit.name}
            <span className="text-[10px] text-stone-400 bg-ink-800 px-1.5 py-0.5 rounded border border-stone-700 font-sans">
              {enemyUnit.realm}
            </span>
          </div>
          {!settlement &&
            battleState.waitingForPlayerAction &&
            battleState.playerActionsRemaining > 0 && (
              <div className="text-[10px] text-emerald-400 mt-1 leading-none">
                剩余行动: {battleState.playerActionsRemaining} / {battleState.playerMaxActions}
              </div>
            )}
        </div>
      }
      titleExtra={
        battleState.enemy?.bossEncounterId ? (
          // 秘境机制 BOSS：显示「秘境主宰」标识，禁止跳过战斗
          <span
            className="flex items-center gap-1 px-2 py-1 mr-2 rounded border border-mystic-gold/80 bg-amber-900/40 text-mystic-gold text-xs font-bold"
            title="秘境主宰无法跳过战斗"
          >
            <Crown size={14} />
            秘境主宰
          </span>
        ) : battleState.enemyIsElite ? (
          // 精英强敌：显示「强敌来袭」标识，禁止跳过战斗
          <span
            className="flex items-center gap-1 px-2 py-1 mr-2 rounded border border-red-500/80 bg-red-900/40 text-red-300 text-xs font-bold"
            title="精英强敌无法跳过战斗"
          >
            <Skull size={14} />
            强敌来袭
          </span>
        ) : (
          <button
            onClick={handleSkipBattle}
            disabled={isProcessing || !!settlement}
            className="p-2 rounded border border-stone-600 text-stone-200 hover:bg-stone-700/40 disabled:opacity-50 transition-colors mr-2"
            title="跳过战斗"
          >
            <FastForward size={16} />
          </button>
        )
      }
      size="4xl"
      height="auto"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      containerClassName="bg-ink-900 border-stone-700 shadow-2xl"
      headerClassName="bg-ink-900 border-b border-stone-700 px-4 md:px-6 py-3 md:py-4"
      contentClassName="bg-ink-950"
      zIndex={80}
    >

        {/* 战斗区域 */}
        <div className="modal-scroll-container modal-scroll-content px-6 py-4 space-y-4">
          {settlement && (
            <div className="space-y-3">
              <BattleResultSummary
                victory={settlement.result.victory}
                hpLoss={settlement.result.hpLoss}
                expChange={settlement.result.expChange}
                spiritChange={settlement.result.spiritChange}
              />
              {settlement.result.victory ? (
                // 胜利横幅：替代「确认并返回」按钮，1 秒后由上方定时器自动关闭弹窗
                <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/60 bg-gradient-to-r from-emerald-900/40 via-ink-900/30 to-yellow-900/30 px-4 py-3">
                  <Trophy size={20} className="text-yellow-400" />
                  <span className="text-lg font-serif font-bold text-yellow-300">战斗胜利</span>
                  <span className="text-sm text-emerald-300">
                    修为 +{settlement.result.expChange} · 灵石 +{settlement.result.spiritChange}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onClose(settlement.result, settlement.updatedInventory)}
                  className="w-full px-4 py-2 rounded border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10"
                >
                  确认并返回
                </button>
              )}
            </div>
          )}
          {/* 对峙舞台：玩家左 / 敌人右 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <FighterPanel
              side="player"
              name={playerUnit.name}
              realm={playerUnit.realm}
              hp={playerHp}
              maxHp={playerMaxHp}
              mana={playerUnit.mana}
              maxMana={playerUnit.maxMana}
              buffs={playerUnit.buffs}
              debuffs={playerUnit.debuffs}
              hitTick={stageEffects.hitTicks.player}
              lungeTick={stageEffects.lungeTicks.player}
              defending={playerUnit.isDefending}
              headerExtra={
                battleState.waitingForPlayerAction && battleState.playerActionsRemaining > 0 ? (
                  <span className="shrink-0 text-[10px] text-emerald-400">
                    行动 {battleState.playerActionsRemaining}/{battleState.playerMaxActions}
                  </span>
                ) : null
              }
              footer={
                <div className="mt-1.5 flex gap-3 text-[10px] text-stone-400">
                  <span>攻 {playerUnit.attack}</span>
                  <span>防 {playerUnit.defense}</span>
                  <span>速 {playerUnit.speed}</span>
                  <span>识 {playerUnit.spirit}</span>
                </div>
              }
              className="flex-1 min-w-0"
            />
            <FighterPanel
              side="enemy"
              name={enemyUnit.name}
              realm={enemyUnit.realm}
              hp={enemyHp}
              maxHp={enemyMaxHp}
              mana={enemyUnit.mana}
              maxMana={enemyUnit.maxMana}
              buffs={enemyUnit.buffs}
              debuffs={enemyUnit.debuffs}
              hitTick={stageEffects.hitTicks.enemy}
              lungeTick={stageEffects.lungeTicks.enemy}
              defending={enemyUnit.isDefending}
              headerExtra={
                battleState.enemyIsElite ? (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-500 text-amber-400 bg-amber-900/40 font-bold">
                    <Skull size={12} />
                    强敌来袭
                  </span>
                ) : null
              }
              footer={
                <div className="mt-1.5 flex gap-3 text-[10px] text-stone-400">
                  <span>攻 {enemyUnit.attack}</span>
                  <span>防 {enemyUnit.defense}</span>
                  <span>速 {enemyUnit.speed}</span>
                  <span>识 {enemyUnit.spirit}</span>
                </div>
              }
              className="flex-1 min-w-0"
            />
          </div>

          {/* 演出区：留白给飘字 / 技能名横幅 / 领域提示 */}
          <div
            className={`relative h-44 md:h-60 rounded-lg border border-stone-800 bg-ink-900/70 overflow-hidden ${stageShakeClass}`}
          >
            {/* 五行领域背景特效 */}
            {battleState.elementalField && (
              <div className={`absolute inset-0 opacity-10 pointer-events-none ${
                battleState.elementalField.type === 'metal' ? 'bg-yellow-400' :
                battleState.elementalField.type === 'wood' ? 'bg-green-400' :
                battleState.elementalField.type === 'water' ? 'bg-blue-400' :
                battleState.elementalField.type === 'fire' ? 'bg-red-400' :
                'bg-amber-600'
              }`} />
            )}
            {/* 领域提示（演出区顶部居中） */}
            {battleState.elementalField && (
              <span className={`absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                battleState.elementalField.type === 'metal' ? 'border-yellow-500 text-yellow-400' :
                battleState.elementalField.type === 'wood' ? 'border-green-500 text-green-400' :
                battleState.elementalField.type === 'water' ? 'border-blue-500 text-blue-400' :
                battleState.elementalField.type === 'fire' ? 'border-red-500 text-red-400' :
                'border-amber-600 text-amber-500'
              }`}>
                {battleState.elementalField.type === 'metal' ? '金' :
                 battleState.elementalField.type === 'wood' ? '木' :
                 battleState.elementalField.type === 'water' ? '水' :
                 battleState.elementalField.type === 'fire' ? '火' : '土'}之领域 LV.{battleState.elementalField.intensity}
              </span>
            )}
            {/* 对峙水印 */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="select-none font-serif text-6xl text-stone-800/70 md:text-7xl">
                对决
              </span>
            </div>
            {stageEffects.floats.map((float) => (
              <DamageFloat key={float.id} float={float} />
            ))}
            {stageEffects.banner && <SkillBanner banner={stageEffects.banner} />}
          </div>

          {/* 战斗日志：收窄滚动条 + 图标分级染色 */}
          {battleState.history.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-stone-800 bg-ink-900/60 p-2">
              <div className="space-y-1.5">
                {battleState.history.slice(-12).map((action) => {
                  const style = classifyBattleLog({
                    actorSide: action.turn,
                    description: action.description,
                    actionType: action.actionType,
                    crit: action.result.crit,
                    miss: action.result.miss,
                    damage: action.result.damage,
                    heal: action.result.heal,
                    isPet: action.turn === 'player' && action.description.startsWith('【'),
                  });
                  const detailTags = getActionDetailTags(action);
                  return (
                    <div
                      key={action.id}
                      className={`flex items-start gap-2 rounded border px-2 py-1.5 text-xs text-stone-200 ${style.rowClass}`}
                    >
                      <style.Icon size={13} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500">
                          <span>第 {action.round} 回合 · {getActionActorLabel(action)}</span>
                          {detailTags.length > 0 && (
                            <span className="flex flex-wrap justify-end gap-1">
                              {detailTags.map((tag) => (
                                <span
                                  key={tag.text}
                                  className={`rounded border px-1 py-0.5 ${tag.className}`}
                                >
                                  {tag.text}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        <div className="leading-snug">{action.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 行动选择区域 */}
        {!settlement && battleState.waitingForPlayerAction && battleState.playerActionsRemaining > 0 && !isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-ink-900/90">
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

            {/* 进阶物品列表 */}
            {showAdvancedItems && (() => {
              const availableAdvancedItems: Array<{
                type: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
                id: string;
                name: string;
                rarity: string;
                battleEffect: any;
                cooldown?: number;
              }> = [];

              // 检查筑基奇物
              if (player?.foundationTreasure) {
                const treasure = FOUNDATION_TREASURES[player.foundationTreasure];
                if (treasure) {
                  if (treasure.battleEffect) {
                  const cooldownKey = `advanced_foundationTreasure_${treasure.id}`;
                  const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                  availableAdvancedItems.push({
                    type: 'foundationTreasure',
                    id: treasure.id,
                    name: treasure.name,
                    rarity: treasure.rarity,
                    battleEffect: treasure.battleEffect,
                    cooldown,
                  });
                  } else {
                    // 如果没有battleEffect，也显示但标记为不可用
                    availableAdvancedItems.push({
                      type: 'foundationTreasure',
                      id: treasure.id,
                      name: treasure.name,
                      rarity: treasure.rarity,
                      battleEffect: null as any, // 标记为null表示没有战斗效果
                      cooldown: 0,
                    });
                  }
                }
              }

              // 检查天地精华
              if (player?.heavenEarthEssence) {
                const essence = HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence];
                if (essence) {
                  if (essence.battleEffect) {
                  const cooldownKey = `advanced_heavenEarthEssence_${essence.id}`;
                  const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                  availableAdvancedItems.push({
                    type: 'heavenEarthEssence',
                    id: essence.id,
                    name: essence.name,
                    rarity: essence.rarity,
                    battleEffect: essence.battleEffect,
                    cooldown,
                  });
                  } else {
                    availableAdvancedItems.push({
                      type: 'heavenEarthEssence',
                      id: essence.id,
                      name: essence.name,
                      rarity: essence.rarity,
                      battleEffect: null as any,
                      cooldown: 0,
                    });
                  }
                }
              }

              // 检查天地之髓
              if (player?.heavenEarthMarrow) {
                const marrow = HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow];
                if (marrow) {
                  if (marrow.battleEffect) {
                  const cooldownKey = `advanced_heavenEarthMarrow_${marrow.id}`;
                  const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                  availableAdvancedItems.push({
                    type: 'heavenEarthMarrow',
                    id: marrow.id,
                    name: marrow.name,
                    rarity: marrow.rarity,
                    battleEffect: marrow.battleEffect,
                    cooldown,
                  });
                  } else {
                    availableAdvancedItems.push({
                      type: 'heavenEarthMarrow',
                      id: marrow.id,
                      name: marrow.name,
                      rarity: marrow.rarity,
                      battleEffect: null as any,
                      cooldown: 0,
                    });
                  }
                }
              }

              // 检查规则之力
              if (player?.longevityRules && Array.isArray(player.longevityRules)) {
                player.longevityRules.forEach((ruleId) => {
                  const rule = LONGEVITY_RULES[ruleId];
                  if (rule) {
                    if (rule.battleEffect) {
                    const cooldownKey = `advanced_longevityRule_${rule.id}`;
                    const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                    availableAdvancedItems.push({
                      type: 'longevityRule',
                      id: rule.id,
                      name: rule.name,
                      rarity: '仙品',
                      battleEffect: rule.battleEffect,
                      cooldown,
                    });
                    } else {
                      availableAdvancedItems.push({
                        type: 'longevityRule',
                        id: rule.id,
                        name: rule.name,
                        rarity: '仙品',
                        battleEffect: null as any,
                        cooldown: 0,
                      });
                    }
                  }
                });
              }
              return (
                <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
                  <div className="text-xs text-stone-400 mb-2">进阶物品</div>
                  <div className="space-y-2">
                    {availableAdvancedItems.length === 0 ? (
                      <div className="text-sm text-stone-500">没有可用的进阶物品</div>
                    ) : (
                      availableAdvancedItems.map((item) => {
                        const isOnCooldown = (item.cooldown || 0) > 0;
                        const hasBattleEffect = item.battleEffect !== null;
                        const canUse = !isProcessing && battleState.playerActionsRemaining > 0 && !isOnCooldown && hasBattleEffect;

                        return (
                          <button
                            key={`${item.type}_${item.id}`}
                            onClick={() => {
                              if (canUse) {
                                handlePlayerAction({
                                  type: 'advancedItem',
                                  itemType: item.type,
                                  itemId: item.id,
                                });
                              }
                            }}
                            disabled={!canUse}
                            className={`w-full text-left p-2 rounded border text-sm ${
                              !canUse
                                ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                                : 'border-yellow-700/50 bg-yellow-900/20 hover:bg-yellow-900/40'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-yellow-300 font-semibold">
                                {item.name}
                              </span>
                              <span className={`text-xs ${
                                item.rarity === '仙品' ? 'text-purple-400' :
                                item.rarity === '传说' ? 'text-orange-400' :
                                item.rarity === '稀有' ? 'text-blue-400' :
                                'text-stone-400'
                              }`}>
                                {item.rarity}
                              </span>
                            </div>
                            {hasBattleEffect ? (
                              <>
                                <div className="text-xs text-stone-400 mt-1">
                                  {item.battleEffect.description}
                                </div>
                                <div className="text-xs text-stone-500 mt-1">
                                  {item.battleEffect.cost?.lifespan && `消耗寿命: ${item.battleEffect.cost.lifespan}年`}
                                  {item.battleEffect.cost?.maxHp && `消耗气血上限: ${typeof item.battleEffect.cost.maxHp === 'number' && item.battleEffect.cost.maxHp < 1 ? `${(item.battleEffect.cost.maxHp * 100).toFixed(0)}%` : item.battleEffect.cost.maxHp}`}
                                  {item.battleEffect.cost?.hp && `消耗气血: ${item.battleEffect.cost.hp}`}
                                  {item.battleEffect.cost?.spirit && `消耗神识: ${item.battleEffect.cost.spirit}`}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-stone-500 mt-1">
                                该进阶物品没有战斗效果
                              </div>
                            )}
                            {isOnCooldown && (
                              <div className="text-xs text-red-400 mt-1">
                                冷却中: {item.cooldown} 回合
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
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

        {/* 底部统一操作栏：sticky 固定在弹窗最底部，集中全部战斗操作（普攻/防御/技能格/逃跑 + 丹药/进阶物品入口），
            敌方回合/处理中保持可见但置灰，点击格子直接派发对应行动 */}
        {!settlement && (
          <div className="sticky bottom-0 z-20">
            <LoadoutSkillBar
              player={battleState.player}
              loadout={battleLoadout}
              disabled={
                isProcessing ||
                !battleState.waitingForPlayerAction ||
                battleState.playerActionsRemaining <= 0
              }
              onUseSkill={(skillId) => handlePlayerAction({ type: 'skill', skillId })}
              onAttack={() => handlePlayerAction({ type: 'attack' })}
              onDefend={() => handlePlayerAction({ type: 'defend' })}
              onFlee={() => handlePlayerAction({ type: 'flee' })}
              potionCount={availablePotions.length}
              potionsOpen={showPotions}
              onTogglePotions={() => setShowPotions(!showPotions)}
              advancedItemsOpen={showAdvancedItems}
              onToggleAdvancedItems={() => setShowAdvancedItems(!showAdvancedItems)}
            />
          </div>
        )}
    </Modal>
  );
};

export default TurnBasedBattleModal;
