import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { PlayerStats, DailyQuest, ItemRarity } from '../types';
import { getRarityTextColor } from '../utils/rarityUtils';
import { Modal } from './common';

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
  const [filterRarity, setFilterRarity] = useState<ItemRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'default' | 'progress' | 'rarity' | 'reward'
  >('default');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  const dailyQuests = player.dailyQuests || [];
  const completedCount = dailyQuests.filter((q) => q.completed).length;
  const totalCount = dailyQuests.length;
  const completionRate =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 筛选任务
  const filteredQuests = dailyQuests.filter((quest) => {
    if (filterRarity !== 'all' && quest.rarity !== filterRarity) return false;
    if (!showCompleted && quest.completed) return false;
    return true;
  });

  // 排序任务
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        // 按进度排序（未完成的在前，已完成按进度降序）
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.progress - a.progress;
      case 'rarity':
        // 按稀有度排序
        const rarityOrder: Record<ItemRarity, number> = {
          普通: 1,
          稀有: 2,
          传说: 3,
          仙品: 4,
        };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'reward':
        // 按奖励价值排序
        const rewardA =
          (a.reward.exp || 0) +
          (a.reward.spiritStones || 0) * 0.1 +
          (a.reward.lotteryTickets || 0) * 10;
        const rewardB =
          (b.reward.exp || 0) +
          (b.reward.spiritStones || 0) * 0.1 +
          (b.reward.lotteryTickets || 0) * 10;
        return rewardB - rewardA;
      default:
        return 0;
    }
  });

  // 获取可一键领取的任务
  const claimableQuests = sortedQuests.filter(
    (q) => q.completed && !player.dailyQuestCompleted?.includes(q.id)
  );

  // 一键领取所有已完成任务
  const handleClaimAll = () => {
    claimableQuests.forEach((quest) => {
      onClaimReward(quest.id);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          日常任务
          <span className="text-sm text-stone-400 font-normal ml-2">
            第 {player.gameDays} 天
          </span>
        </>
      }
      titleIcon={<Calendar className="text-mystic-gold w-5 h-5 md:w-6 md:h-6" />}
      size="2xl"
      height="full"
      containerClassName="border-2 border-mystic-gold"
    >
      {/* Progress Bar */}
      <div className="mb-4 pb-4 border-b border-stone-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-stone-300 text-sm">今日进度</span>
          <div className="flex items-center gap-3">
            <span className="text-mystic-gold font-bold">
              {completedCount} / {totalCount}
            </span>
            {claimableQuests.length > 0 && (
              <button
                onClick={handleClaimAll}
                className="px-3 py-1.5 bg-mystic-jade hover:bg-mystic-jade/80 text-stone-900 font-bold rounded text-sm transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                一键领取 ({claimableQuests.length})
              </button>
            )}
          </div>
        </div>
        <div className="h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div
            className="h-full bg-gradient-to-r from-mystic-jade to-mystic-gold transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-4 pb-4 border-b border-stone-700 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-stone-400" />
          <span className="text-stone-300 text-sm">筛选:</span>
          <select
            value={filterRarity}
            onChange={(e) =>
              setFilterRarity(e.target.value as ItemRarity | 'all')
            }
            className="px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-sm"
          >
            <option value="all">全部稀有度</option>
            <option value="普通">普通</option>
            <option value="稀有">稀有</option>
            <option value="传说">传说</option>
            <option value="仙品">仙品</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-stone-400" />
          <span className="text-stone-300 text-sm">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-sm"
          >
            <option value="default">默认</option>
            <option value="progress">进度</option>
            <option value="rarity">稀有度</option>
            <option value="reward">奖励价值</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-mystic-jade focus:ring-mystic-jade"
          />
          <span className="text-stone-300 text-sm">显示已完成</span>
        </label>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {sortedQuests.length === 0 ? (
          <div className="text-center text-stone-400 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无符合条件的日常任务</p>
          </div>
        ) : (
          sortedQuests.map((quest) => (
            <QuestItem
              key={quest.id}
              quest={quest}
              onClaimReward={onClaimReward}
              isClaimed={
                player.dailyQuestCompleted?.includes(quest.id) || false
              }
            />
          ))
        )}
      </div>
    </Modal>
  );
};

interface QuestItemProps {
  quest: DailyQuest;
  onClaimReward: (questId: string) => void;
  isClaimed: boolean; // 是否已领取奖励
}

const QuestItem: React.FC<QuestItemProps> = ({
  quest,
  onClaimReward,
  isClaimed,
}) => {
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
              <CheckCircle2 className="text-mystic-jade w-5 h-5 shrink-0" />
            ) : (
              <Circle className="text-stone-500 w-5 h-5 shrink-0" />
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
          {!!quest.reward.exp && (
            <div className="flex items-center gap-1 text-mystic-jade">
              <Sparkles size={14} />
              <span>{quest.reward.exp} 修为</span>
            </div>
          )}
          {!!quest.reward.spiritStones && (
            <div className="flex items-center gap-1 text-mystic-gold">
              <Sparkles size={14} />
              <span>{quest.reward.spiritStones} 灵石</span>
            </div>
          )}
          {!!quest.reward.lotteryTickets && (
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
