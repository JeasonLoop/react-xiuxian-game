import React, { useEffect, useMemo, useRef, useState } from 'react';
 import { Shield, Skull, Sword, SkipForward, Trophy } from 'lucide-react';
import { BattleReplay } from '../services/battleService';
import { Modal } from './common';
import BattleResultSummary from './BattleResultSummary';
import {
  FighterPanel,
  DamageFloat,
  SkillBanner,
  classifyBattleLog,
  buildRoundLogEvent,
  useBattleStageEffects,
} from './battle';

interface BattleModalProps {
  isOpen: boolean;
  replay: BattleReplay | null;
  revealedRounds: number;
  onSkip: () => void;
  onClose: () => void;
}

// 演武播放节奏：每 300ms 揭示一条回合记录并同步演出
const PLAY_STEP_MS = 300;

const BattleModal: React.FC<BattleModalProps> = ({
  isOpen,
  replay,
  revealedRounds,
  onSkip,
  onClose,
}) => {
  const logRef = useRef<HTMLDivElement | null>(null);
  // 演武播放进度：本地逐条推进，驱动飘字/震屏/血条 tween 与日志染色追加
  const [playIndex, setPlayIndex] = useState(0);
  const stageEffects = useBattleStageEffects();

  // 用户系统开启"减少动态效果"时跳过演出，直接显示结果
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const totalRounds = replay?.rounds.length ?? 0;
  const isResolved = totalRounds > 0 && playIndex >= totalRounds;

  // onSkip 每次父组件渲染都会重建，用 ref 固定引用，避免重置播放定时器
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  // onClose 同样每次渲染重建，用 ref 固定引用供自动关闭定时器回调使用
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 胜利结算：演出播完（或跳过）后显示「战斗胜利」横幅，1 秒后自动关闭弹窗；
  // 失败时不触发自动关闭，保留确认按钮由玩家手动查看结算。
  // 定时器在组件卸载/提前手动关闭时清理，避免重复回调。
  useEffect(() => {
    if (!isOpen || !replay || !replay.victory || !isResolved) return;
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isOpen, replay, isResolved]);

  // 新战斗回放：从头开始演武
  useEffect(() => {
    setPlayIndex(0);
    stageEffects.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay?.id]);

  // 演武逐条播放：定时器驱动，播完同步外部 revealedRounds 解锁关闭
  useEffect(() => {
    if (!replay) return;
    if (revealedRounds >= totalRounds) {
      // 外部已揭示全部（如外部跳过），本地同步到结尾
      if (playIndex < totalRounds) setPlayIndex(totalRounds);
      return;
    }
    if (playIndex >= totalRounds) {
      // 本地播放完成，同步外部状态解锁关闭按钮
      onSkipRef.current();
      return;
    }
    if (prefersReducedMotion) {
      // 降级：直接显示结果
      stageEffects.clear();
      setPlayIndex(totalRounds);
      onSkipRef.current();
      return;
    }
    // playEntry 为稳定 useCallback，避免整体 effects 对象（飘字/tick 状态）
    // 变化导致播放定时器被反复重置
    const playEntry = stageEffects.playEntry;
    const timer = window.setTimeout(() => {
      const next = playIndex + 1;
      // 播放当前回合的演出（飘字 / 横幅 / shake / 血条 tween）
      playEntry(buildRoundLogEvent(replay.rounds[next - 1]));
      setPlayIndex(next);
    }, PLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [replay, playIndex, revealedRounds, totalRounds, prefersReducedMotion, stageEffects.playEntry]); // eslint-disable-line react-hooks/exhaustive-deps

  // 日志区自动滚动到底
  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [playIndex, replay]);

  const { shownRounds, progressText, damageStats } = useMemo(() => {
    if (!replay) {
      return {
        shownRounds: [],
        progressText: '0 / 0',
        damageStats: { playerDamage: 0, petDamage: 0, enemyDamage: 0, crits: 0 },
      };
    }
    const shown = replay.rounds.slice(0, playIndex);
    return {
      shownRounds: shown,
      progressText: `${Math.min(playIndex, totalRounds)} / ${totalRounds}`,
      damageStats: shown.reduce(
        (stats, round) => {
          if (round.attacker === 'enemy') {
            stats.enemyDamage += round.damage || 0;
          } else if (/【.+】/.test(round.description)) {
            stats.petDamage += round.damage || 0;
          } else {
            stats.playerDamage += round.damage || 0;
          }
          if (round.crit) stats.crits += 1;
          return stats;
        },
        { playerDamage: 0, petDamage: 0, enemyDamage: 0, crits: 0 }
      ),
    };
  }, [replay, playIndex, totalRounds]);

  if (!replay) return null;

  const closeDisabled = !isResolved;

  // 跳过演出：直接显示结果与完整日志
  const handleSkipPerformance = () => {
    stageEffects.clear();
    setPlayIndex(totalRounds);
    onSkip();
  };

  // 双方血量：取最新已揭示回合的余量（血条 width 过渡自动 tween）
  const lastRound = shownRounds[shownRounds.length - 1];
  const playerHp = lastRound ? lastRound.playerHpAfter : replay.playerHpBefore;
  const enemyHp = lastRound ? lastRound.enemyHpAfter : replay.enemy.maxHp;

  // 演出区震屏（暴击时触发，奇偶交替重触发动画）
  const stageShakeClass =
    stageEffects.stageShakeTick > 0
      ? stageEffects.stageShakeTick % 2 === 1
        ? 'anim-shake-a'
        : 'anim-shake-b'
      : '';

  const getRoundActorLabel = (attacker: 'player' | 'enemy', description: string) => {
    if (attacker !== 'player') return '敌方出手';
    return /【.+】/.test(description) ? '灵宠出手' : '你的出手';
  };
  const getRoundDamageTags = (round: BattleReplay['rounds'][number]) => [
    {
      text: `伤害 ${round.damage || 0}`,
      className:
        round.attacker === 'enemy'
          ? 'border-rose-500/60 text-rose-300'
          : 'border-emerald-500/60 text-emerald-300',
    },
    ...(round.crit ? [{ text: '暴击', className: 'border-yellow-500/70 text-yellow-300' }] : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDisabled ? () => {} : onClose}
      title={
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-widest">
            战斗遭遇
          </div>
          <div className="flex items-center gap-2 text-lg md:text-xl font-serif text-mystic-gold">
            <Sword size={18} className="text-mystic-gold" />
            {replay.enemy.title}·{replay.enemy.name}
            <span className="text-[11px] text-stone-400 bg-ink-800 px-2 py-0.5 rounded border border-stone-700">
              {replay.enemy.realm}
            </span>
            {replay.enemy.isElite && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-red-500/80 text-red-400 bg-red-900/40 font-bold">
                <Skull size={12} />
                强敌来袭
              </span>
            )}
          </div>
        </div>
      }
      size="3xl"
      height="xl"
      zIndex={80}
      closeOnOverlayClick={!closeDisabled}
      closeOnEsc={!closeDisabled}
      footer={
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-stone-400 space-y-1">
            <div>战斗进度：{progressText} 回合</div>
            {isResolved ? (
              <>
                <BattleResultSummary
                  victory={replay.victory}
                  hpLoss={replay.hpLoss}
                  expChange={replay.expChange}
                  spiritChange={replay.spiritChange}
                />
                <div>当前气血：{replay.playerHpAfter}</div>
              </>
            ) : (
              <div className="text-mystic-gold/80">演武进行中...</div>
            )}
          </div>
          <div className="flex gap-2">
            {!isResolved && !replay.enemy.isElite && (
              <button
                onClick={handleSkipPerformance}
                className="flex items-center gap-1 px-3 py-2 rounded border border-amber-500 text-amber-300 hover:bg-amber-500/10 text-sm"
              >
                <SkipForward size={16} />
                跳过演出
              </button>
            )}
            {isResolved && replay.victory ? (
              // 胜利横幅：替代「结束战斗」按钮，1 秒后由上方定时器自动关闭弹窗
              <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/60 bg-gradient-to-r from-emerald-900/40 via-ink-900/30 to-yellow-900/30 px-4 py-2">
                <Trophy size={18} className="text-yellow-400" />
                <span className="font-serif font-bold text-yellow-300">战斗胜利</span>
                <span className="text-xs text-emerald-300">
                  修为 +{replay.expChange} · 灵石 +{replay.spiritChange}
                </span>
              </div>
            ) : (
              <button
                onClick={onClose}
                disabled={closeDisabled}
                className={`flex items-center gap-1 px-3 py-2 rounded border text-sm ${
                  closeDisabled
                    ? 'border-stone-700 text-stone-600 cursor-not-allowed'
                    : 'border-emerald-500 text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                <Shield size={16} />
                {closeDisabled ? '战斗进行中' : '结束战斗'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* 对峙舞台：玩家左 / 敌人右 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <FighterPanel
          side="player"
          name="你"
          hp={playerHp}
          maxHp={replay.playerHpBefore}
          buffs={[]}
          debuffs={[]}
          hitTick={stageEffects.hitTicks.player}
          lungeTick={stageEffects.lungeTicks.player}
          className="flex-1 min-w-0"
        />
        <FighterPanel
          side="enemy"
          name={`${replay.enemy.title}·${replay.enemy.name}`}
          realm={replay.enemy.realm}
          hp={enemyHp}
          maxHp={replay.enemy.maxHp}
          buffs={[]}
          debuffs={[]}
          hitTick={stageEffects.hitTicks.enemy}
          lungeTick={stageEffects.lungeTicks.enemy}
          headerExtra={
            replay.enemy.isElite ? (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-500 text-amber-400 bg-amber-900/40 font-bold">
                <Skull size={12} />
                强敌
              </span>
            ) : null
          }
          className="flex-1 min-w-0"
        />
      </div>

      {/* 演出区：留白给飘字与技能名横幅 */}
      <div
        className={`relative mt-3 h-44 md:h-60 rounded-lg border border-stone-800 bg-ink-900/70 overflow-hidden ${stageShakeClass}`}
      >
        {/* 对峙水印 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-6xl md:text-7xl text-stone-800/70 select-none">
            对决
          </span>
        </div>
        {stageEffects.floats.map((float) => (
          <DamageFloat key={float.id} float={float} />
        ))}
        {stageEffects.banner && <SkillBanner banner={stageEffects.banner} />}
      </div>

      {/* 播放进度点 */}
      {totalRounds > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
          {replay.rounds.map((round, idx) => (
            <span
              key={round.id}
              className={`h-1.5 w-1.5 rounded-full ${
                idx < playIndex ? 'bg-mystic-gold' : 'bg-stone-700'
              }`}
            />
          ))}
        </div>
      )}

      {/* 伤害统计（已揭示部分，随演武实时累计） */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <div className="rounded border border-emerald-700/40 bg-emerald-950/20 px-3 py-2">
          <div className="text-stone-500">本体伤害</div>
          <div className="text-emerald-300 font-semibold">{damageStats.playerDamage}</div>
        </div>
        <div className="rounded border border-cyan-700/40 bg-cyan-950/20 px-3 py-2">
          <div className="text-stone-500">灵宠伤害</div>
          <div className="text-cyan-300 font-semibold">{damageStats.petDamage}</div>
        </div>
        <div className="rounded border border-rose-700/40 bg-rose-950/20 px-3 py-2">
          <div className="text-stone-500">承受伤害</div>
          <div className="text-rose-300 font-semibold">{damageStats.enemyDamage}</div>
        </div>
        <div className="rounded border border-yellow-700/40 bg-yellow-950/20 px-3 py-2">
          <div className="text-stone-500">暴击次数</div>
          <div className="text-yellow-300 font-semibold">{damageStats.crits}</div>
        </div>
      </div>

      {/* 战斗日志：收窄滚动条，逐条染色追加 */}
      <div
        ref={logRef}
        className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-stone-800 bg-ink-900/60 p-2"
      >
        {shownRounds.length === 0 ? (
          <div className="py-3 text-center text-xs text-stone-500">
            演武记录准备中...
          </div>
        ) : (
          <div className="space-y-1.5">
            {shownRounds.map((round, idx) => {
              const style = classifyBattleLog({
                actorSide: round.attacker,
                description: round.description,
                crit: round.crit,
                damage: round.damage,
              });
              const detailTags = getRoundDamageTags(round);
              return (
                <div
                  key={round.id}
                  className={`flex items-start gap-2 rounded border px-2 py-1.5 text-xs text-stone-200 ${style.rowClass}`}
                >
                  <style.Icon size={13} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500">
                      <span>
                        第 {idx + 1} 条 · {getRoundActorLabel(round.attacker, round.description)}
                      </span>
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
                    </div>
                    <div className="leading-snug">{round.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BattleModal;
