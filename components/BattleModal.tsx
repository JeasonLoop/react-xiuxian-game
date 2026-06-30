import React, { useEffect, useMemo, useRef } from 'react';
import { Shield, Sword, SkipForward } from 'lucide-react';
import { BattleReplay } from '../services/battleService';
import { Modal } from './common';
import BattleResultSummary from './BattleResultSummary';

interface BattleModalProps {
  isOpen: boolean;
  replay: BattleReplay | null;
  revealedRounds: number;
  onSkip: () => void;
  onClose: () => void;
}

const BattleModal: React.FC<BattleModalProps> = ({
  isOpen,
  replay,
  revealedRounds,
  onSkip,
  onClose,
}) => {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [revealedRounds, replay]);

  const { visibleRounds, isResolved, progressText, damageStats } = useMemo(() => {
    if (!replay) {
      return {
        visibleRounds: [],
        isResolved: true,
        progressText: '0 / 0',
        damageStats: {
          playerDamage: 0,
          petDamage: 0,
          enemyDamage: 0,
          crits: 0,
        },
      };
    }
    const total = replay.rounds.length || 1;
    const progress = Math.min(revealedRounds, total);
    const shownRounds = replay.rounds.slice(0, progress);
    return {
      visibleRounds: shownRounds,
      isResolved: progress >= total,
      progressText: `${progress} / ${total}`,
      damageStats: shownRounds.reduce(
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
  }, [replay, revealedRounds]);

  if (!replay) return null;

  const closeDisabled = !isResolved;
  const getRoundActorLabel = (round: BattleReplay['rounds'][number]) => {
    if (round.attacker !== 'player') return '敌方出手';
    return /【.+】/.test(round.description) ? '灵宠出手' : '你的出手';
  };
  const getRoundDamageTags = (round: BattleReplay['rounds'][number]) => [
    {
      text: `伤害 ${round.damage || 0}`,
      className: round.attacker === 'enemy'
        ? 'border-rose-500/60 text-rose-300'
        : 'border-emerald-500/60 text-emerald-300',
    },
    ...(round.crit
      ? [{ text: '暴击', className: 'border-yellow-500/70 text-yellow-300' }]
      : []),
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
            <BattleResultSummary
              victory={replay.victory}
              hpLoss={replay.hpLoss}
              expChange={replay.expChange}
              spiritChange={replay.spiritChange}
            />
            <div>当前气血：{replay.playerHpAfter}</div>
          </div>
          <div className="flex gap-2">
            {!isResolved && (
              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-3 py-2 rounded border border-amber-500 text-amber-300 hover:bg-amber-500/10 text-sm"
              >
                <SkipForward size={16} />
                跳过战斗
              </button>
            )}
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
          </div>
        </div>
      }
    >
      {/* 敌方属性 */}
      <div className="mb-4 pb-4 border-b border-stone-800">
        <div className="flex flex-wrap gap-4 text-xs text-stone-400">
          <span>敌方气血：{replay.enemy.maxHp}</span>
          <span>敌方攻击：{replay.enemy.attack}</span>
          <span>敌方防御：{replay.enemy.defense}</span>
          <span>敌方速度：{replay.enemy.speed}</span>
          <span>敌方神识：{replay.enemy.spirit}</span>
        </div>
        <p
          className={`mt-3 text-sm md:text-base font-semibold ${
            replay.victory ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {replay.summary}
        </p>
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
      </div>

      {/* 战斗日志 */}
      <div
        ref={logRef}
        className="space-y-3 text-sm max-h-[40vh] overflow-y-auto"
      >
        {visibleRounds.length === 0 ? (
          <div className="text-center text-stone-500 py-6">
            战斗记录准备中...
          </div>
        ) : (
          visibleRounds.map((round, idx) => {
            const detailTags = getRoundDamageTags(round);
            return (
              <div
                key={round.id}
                className={`p-3 rounded border text-stone-200 ${
                  round.attacker === 'player'
                    ? 'bg-emerald-900/10 border-emerald-700/40'
                    : 'bg-rose-900/15 border-rose-700/40'
                }`}
              >
                <div className="flex justify-between gap-2 text-[11px] text-stone-400 mb-1">
                  <span>
                    第 {idx + 1} 回合 ·{' '}
                    {getRoundActorLabel(round)}
                  </span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {detailTags.map((tag) => (
                      <span
                        key={tag.text}
                        className={`rounded border px-1.5 py-0.5 ${tag.className}`}
                      >
                        {tag.text}
                      </span>
                    ))}
                  </span>
                </div>
                <p>{round.description}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                  <span>你的气血：{round.playerHpAfter}</span>
                  <span>敌方气血：{round.enemyHpAfter}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default BattleModal;
