/**
 * 排行榜 Modal
 * 支持修为排行、战力排行、灵石排行三种维度
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './common';
import { Trophy, Swords, Coins, RefreshCw } from 'lucide-react';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

interface RankingEntry {
  rank: number;
  user_id: number;
  username: string;
  realm: string;
  realm_level: number;
  exp: number;
  combat_power: number;
  spirit_stones: number;
  reputation: number;
  achievement_count: number;
  kill_count: number;
  play_time: number;
  updated_at: string;
}

interface LeaderboardResponse {
  sort: string;
  limit: number;
  offset: number;
  total: number;
  rankings: RankingEntry[];
}

interface MyRankResponse {
  found: boolean;
  message?: string;
  username?: string;
  realm_rank?: number;
  combat_rank?: number;
  stones_rank?: number;
}

type SortType = 'realm' | 'combat' | 'stones';

const SORT_OPTIONS: { key: SortType; label: string; icon: React.ReactNode }[] = [
  { key: 'realm', label: '修为榜', icon: <Trophy className="w-4 h-4" /> },
  { key: 'combat', label: '战力榜', icon: <Swords className="w-4 h-4" /> },
  { key: 'stones', label: '灵石榜', icon: <Coins className="w-4 h-4" /> },
];

const PAGE_SIZE = 50;

function formatNumber(n: number): string {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
  return n.toLocaleString();
}

function formatPlayTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}时`;
  }
  if (hours > 0) return `${hours}小时`;
  const mins = Math.floor(ms / 60000);
  return `${mins}分钟`;
}

function getRankBadge(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: 'bg-yellow-400/20', text: 'text-yellow-400' };
  if (rank === 2) return { bg: 'bg-gray-300/20', text: 'text-gray-300' };
  if (rank === 3) return { bg: 'bg-amber-600/20', text: 'text-amber-500' };
  return { bg: 'bg-white/5', text: 'text-white/60' };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [sortBy, setSortBy] = useState<SortType>('realm');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [myRank, setMyRank] = useState<MyRankResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);

  const fetchLeaderboard = useCallback(async (sort: SortType, pageOffset: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/leaderboard?sort=${sort}&limit=${PAGE_SIZE}&offset=${pageOffset}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '获取排行榜失败');
      }
      const data: LeaderboardResponse = await res.json();
      if (append) {
        setRankings((prev) => [...prev, ...data.rankings]);
      } else {
        setRankings(data.rankings);
      }
      setHasMore(data.total >= PAGE_SIZE);
    } catch (e: any) {
      setError(e.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyRank = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/leaderboard/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: MyRankResponse = await res.json();
        setMyRank(data);
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      setOffset(0);
      fetchLeaderboard(sortBy, 0, false);
      fetchMyRank();
    }
  }, [isOpen, sortBy]);

  const handleSortChange = (sort: SortType) => {
    setSortBy(sort);
    setOffset(0);
    setRankings([]);
  };

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchLeaderboard(sortBy, newOffset, true);
  };

  const currentRankLabel = sortBy === 'realm' ? '修为' : sortBy === 'combat' ? '战力' : '灵石';
  const myCurrentRank = sortBy === 'realm'
    ? myRank?.realm_rank
    : sortBy === 'combat'
    ? myRank?.combat_rank
    : myRank?.stones_rank;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="修仙排行榜"
      titleIcon={<Trophy className="w-5 h-5 text-yellow-400" />}
      size="3xl"
      height="xl"
      zIndex={80}
      titleExtra={
        <button
          onClick={() => {
            setOffset(0);
            fetchLeaderboard(sortBy, 0, false);
            fetchMyRank();
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="flex flex-col h-full">
        {/* 排序标签 */}
        <div className="flex gap-2 mb-4">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === opt.key
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* 我的排名 */}
        {myRank?.found && myCurrentRank && (
          <div className="mb-3 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
            <span className="text-white/60">我的{currentRankLabel}排名：</span>
            <span className="text-yellow-400 font-bold">第 {myCurrentRank} 名</span>
            {myRank.username && (
              <span className="text-white/40 ml-2">({myRank.username})</span>
            )}
          </div>
        )}
        {myRank && !myRank.found && token && (
          <div className="mb-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/40">
            {myRank.message || '上传存档后即可参与排名'}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
            <button
              onClick={() => {
                setOffset(0);
                fetchLeaderboard(sortBy, 0, false);
              }}
              className="ml-2 underline hover:text-red-300"
            >
              重试
            </button>
          </div>
        )}

        {/* 排行列表 */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {rankings.length === 0 && !loading && (
            <div className="text-center py-12 text-white/30">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无排行数据</p>
              <p className="text-sm mt-1">成为第一个上传存档的修士吧！</p>
            </div>
          )}

          <div className="space-y-1">
            {rankings.map((entry) => {
              const badge = getRankBadge(entry.rank);
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${badge.bg} hover:bg-white/10 transition-colors`}
                >
                  {/* 排名 */}
                  <div className={`w-10 text-center font-bold text-lg ${badge.text}`}>
                    {entry.rank <= 3 ? (
                      <span className="text-xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* 玩家信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{entry.username}</div>
                    <div className="text-xs text-white/40">
                      {entry.realm} · {entry.realm_level}层
                    </div>
                  </div>

                  {/* 主要数据 */}
                  {sortBy === 'realm' && (
                    <div className="text-right text-sm">
                      <div className="text-yellow-400/80">{formatNumber(entry.exp)} 修为</div>
                    </div>
                  )}
                  {sortBy === 'combat' && (
                    <div className="text-right text-sm">
                      <div className="text-orange-400/80">{formatNumber(entry.combat_power)} 战力</div>
                    </div>
                  )}
                  {sortBy === 'stones' && (
                    <div className="text-right text-sm">
                      <div className="text-cyan-400/80">{formatNumber(entry.spirit_stones)} 💎</div>
                    </div>
                  )}

                  {/* 次要数据 */}
                  <div className="hidden md:block text-right text-xs text-white/30 w-20">
                    {sortBy !== 'realm' && <div>{entry.realm}·{entry.realm_level}层</div>}
                    {sortBy === 'realm' && <div>战力 {formatNumber(entry.combat_power)}</div>}
                    <div>{formatPlayTime(entry.play_time)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-sm transition-colors disabled:opacity-30"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LeaderboardModal;
