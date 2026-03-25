/**
 * Reputation Event Handler Hook
 * 处理声望事件相关的逻辑，从 useAppHandlers 中提取
 */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, AdventureResult } from '../types';
import { getPlayerTotalStats } from '../utils/statUtils';
import { scaleReputationEventChoice } from '../utils/realmEventRewardScale';

type ReputationChoice = NonNullable<
  AdventureResult['reputationEvent']
>['choices'][number];

function formatOutcomeRatingLine(choice: ReputationChoice): string {
  const hp = choice.hpChange ?? 0;
  const exp = choice.expChange ?? 0;
  const stones = choice.spiritStonesChange ?? 0;
  const rep = choice.reputationChange;

  const parts: string[] = [];
  if (exp !== 0) parts.push(`修为${exp > 0 ? '+' : ''}${exp}`);
  if (hp !== 0) parts.push(`气血${hp > 0 ? '+' : ''}${hp}`);
  if (stones !== 0) parts.push(`灵石${stones > 0 ? '+' : ''}${stones}`);
  if (rep !== 0) parts.push(`声望${rep > 0 ? '+' : ''}${rep}`);

  const tag = choice.riskTag;
  let grade: string;
  if (tag === '稳妥') {
    grade = hp < -18 ? '险中求稳' : '稳扎稳打';
  } else if (tag === '激进') {
    grade =
      hp <= -20
        ? '险中求胜'
        : exp > 50 || stones > 80
          ? '收获颇丰'
          : '激进一搏';
  } else if (tag === '保底') {
    grade = '落袋为安';
  } else {
    const net = exp + stones * 0.05 - Math.max(0, -hp) * 1.2 + rep;
    grade =
      net > 25 ? '收益可观' : net > 0 ? '尚可接受' : '得失参半';
  }

  return `📊 结果评级：${grade}${parts.length ? '｜' + parts.join('，') : ''}`;
}

interface UseReputationEventHandlerProps {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  reputationEvent: AdventureResult['reputationEvent'] | null;
  setReputationEvent: (event: AdventureResult['reputationEvent'] | null) => void;
  setIsReputationEventOpen: (open: boolean) => void;
  pausedByReputationEvent: boolean;
  setPausedByReputationEvent: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void;
}

/**
 * 声望事件处理 Hook
 */
export function useReputationEventHandler({
  player,
  setPlayer,
  addLog,
  reputationEvent,
  setReputationEvent,
  setIsReputationEventOpen,
  pausedByReputationEvent,
  setPausedByReputationEvent,
  setAutoAdventure,
}: UseReputationEventHandlerProps) {
  const handleReputationEventChoice = useCallback(
    (choiceIndex: number) => {
      if (!reputationEvent || !player) return;

      const rawChoice = reputationEvent.choices[choiceIndex];
      if (!rawChoice) return;

      const choice = scaleReputationEventChoice(player, rawChoice);

      if (choice.riskTag) {
        addLog(
          `📍 抉择反馈【${choice.riskTag}】：你选择了「${choice.text}」`,
          'normal'
        );
      } else {
        addLog(`📍 抉择：你选择了「${choice.text}」`, 'normal');
      }

      setPlayer((prev) => {
        if (!prev) return prev;
        const newReputation = Math.max(
          0,
          (prev.reputation || 0) + choice.reputationChange
        );
        let newHp = prev.hp;
        let newExp = prev.exp;
        let newSpiritStones = prev.spiritStones;
        let newKarma = (prev.karma || 0) + (choice.karmaChange || 0);
        let newSocialRelations = [...(prev.socialRelations || [])];

        if (choice.npcRelationChange) {
          const { npcId, npcName, favorabilityChange, description } = choice.npcRelationChange;
          const existingIndex = newSocialRelations.findIndex(r => r.id === npcId);

          if (existingIndex >= 0) {
            newSocialRelations[existingIndex] = {
              ...newSocialRelations[existingIndex],
              favorability: Math.max(-100, Math.min(100, newSocialRelations[existingIndex].favorability + favorabilityChange)),
              lastEncounterRealm: prev.realm
            };
          } else {
            newSocialRelations.push({
              id: npcId,
              name: npcName,
              favorability: favorabilityChange,
              description,
              lastEncounterRealm: prev.realm
            });
          }

          const changeType = favorabilityChange > 0 ? '增加' : '降低';
          addLog(`✨ 你与【${npcName}】的关系${changeType}了 ${Math.abs(favorabilityChange)} 点！`, favorabilityChange > 0 ? 'gain' : 'danger');
        }

        if (choice.karmaChange) {
          const changeType = choice.karmaChange > 0 ? '增加' : '减少';
          addLog(`✨ 你的因果值${changeType}了 ${Math.abs(choice.karmaChange)} 点！`, choice.karmaChange > 0 ? 'gain' : 'danger');
        }

        if (choice.hpChange !== undefined) {
          const totalStats = getPlayerTotalStats(prev);
          const actualMaxHp = totalStats.maxHp;
          newHp = Math.max(0, Math.min(actualMaxHp, prev.hp + choice.hpChange));
        }
        if (choice.expChange !== undefined) {
          newExp = Math.max(0, prev.exp + choice.expChange);
        }
        if (choice.spiritStonesChange !== undefined) {
          newSpiritStones = Math.max(
            0,
            prev.spiritStones + choice.spiritStonesChange
          );
        }

        if (choice.reputationChange > 0) {
          addLog(
            `✨ 你的声望增加了 ${choice.reputationChange} 点！当前声望：${newReputation}`,
            'gain'
          );
        } else if (choice.reputationChange < 0) {
          addLog(
            `⚠️ 你的声望减少了 ${Math.abs(choice.reputationChange)} 点！当前声望：${newReputation}`,
            'danger'
          );
        }

        if (choice.description) {
          addLog(
            choice.description,
            choice.reputationChange > 0
              ? 'gain'
              : choice.reputationChange < 0
                ? 'danger'
                : 'normal'
          );
        }

        addLog(formatOutcomeRatingLine(choice), 'normal');

        return {
          ...prev,
          reputation: newReputation,
          hp: newHp,
          exp: newExp,
          spiritStones: newSpiritStones,
          karma: newKarma,
          socialRelations: newSocialRelations,
        };
      });

      setIsReputationEventOpen(false);
      setReputationEvent(null);

      if (pausedByReputationEvent) {
        setPausedByReputationEvent(false);
        setAutoAdventure(true);
      }
    },
    [
      reputationEvent,
      player,
      addLog,
      setPlayer,
      setIsReputationEventOpen,
      setReputationEvent,
      pausedByReputationEvent,
      setPausedByReputationEvent,
      setAutoAdventure,
    ]
  );

  return {
    handleReputationEventChoice,
  };
}

