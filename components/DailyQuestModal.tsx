import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Sparkles, Calendar } from 'lucide-react';
import { PlayerStats, DailyQuest } from '../types';
import { getRarityTextColor } from '../utils/rarityUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onClaimReward: (questId: string) => void;
}

const DailyQuestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onClaimReward,
}) => {
  if (!isOpen) return null;

  const dailyQuests = player.dailyQuests || [];
  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalCount = dailyQuests.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-ink-800 p-4 border-b border-stone-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Calendar className="text-mystic-gold w-6 h-6" />
            <h2 className="text-xl font-serif font-bold text-mystic-gold">
              日常任务
            </h2>
            <span className="text-sm text-stone-400">
              第 {player.gameDays} 天
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-ink-800 border-b border-stone-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-300 text-sm">今日进度</span>
            <span className="text-mystic-gold font-bold">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
            <div
              className="h-full bg-gradient-to-r from-mystic-jade to-mystic-gold transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dailyQuests.length === 0 ? (
            <div className="text-center text-stone-400 py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无日常任务</p>
            </div>
          ) : (
            dailyQuests.map((quest) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                onClaimReward={onClaimReward}
                isClaimed={player.dailyQuestCompleted?.includes(quest.id) || false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface QuestItemProps {
  quest: DailyQuest;
  onClaimReward: (questId: string) => void;
  isClaimed: boolean; // 是否已领取奖励
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, onClaimReward, isClaimed }) => {
  const progressPercentage = Math.min(
    (quest.progress / quest.target) * 100,
    100
  );
  const rarityColor = getRarityTextColor(quest.rarity);

  return (
    <div
      className={`bg-ink-800 rounded-lg border-2 p-4 transition-all ${
        quest.completed && isClaimed
          ? 'border-stone-600 bg-stone-800/50'
          : quest.completed
          ? 'border-mystic-jade bg-mystic-jade/10'
          : 'border-stone-700 hover:border-stone-600'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {quest.completed ? (
              <CheckCircle2 className="text-mystic-jade w-5 h-5 flex-shrink-0" />
            ) : (
              <Circle className="text-stone-500 w-5 h-5 flex-shrink-0" />
            )}
            <h3 className={`font-bold ${rarityColor}`}>{quest.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded border ${rarityColor} border-current`}
            >
              {quest.rarity}
            </span>
          </div>
          <p className="text-stone-400 text-sm mb-2">{quest.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
          <span>进度</span>
          <span>
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div
            className={`h-full transition-all duration-300 ${
              quest.completed
                ? 'bg-mystic-jade'
                : 'bg-gradient-to-r from-mystic-jade to-mystic-gold'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {quest.reward.exp && (
            <div className="flex items-center gap-1 text-mystic-jade">
              <Sparkles size={14} />
              <span>{quest.reward.exp} 修为</span>
            </div>
          )}
          {quest.reward.spiritStones && (
            <div className="flex items-center gap-1 text-mystic-gold">
              <Sparkles size={14} />
              <span>{quest.reward.spiritStones} 灵石</span>
            </div>
          )}
          {quest.reward.lotteryTickets && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Sparkles size={14} />
              <span>{quest.reward.lotteryTickets} 抽奖券</span>
            </div>
          )}
        </div>
        {quest.completed && !isClaimed && (
          <button
            onClick={() => onClaimReward(quest.id)}
            className="px-3 py-1.5 bg-mystic-jade hover:bg-mystic-jade/80 text-stone-900 font-bold rounded text-sm transition-colors"
          >
            领取奖励
          </button>
        )}
        {quest.completed && isClaimed && (
          <div className="px-3 py-1.5 bg-stone-700 text-stone-400 font-bold rounded text-sm">
            已领取
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuestModal;

