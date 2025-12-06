import React, { useState, useMemo } from 'react';
import { PlayerStats, SectRank, RealmType, Item, AdventureResult } from '../types';
import { SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER } from '../constants';
import { generateRandomSects, generateRandomSectTasks, generateSectShopItems, RandomSectTask } from '../services/randomService';
import { X, Users, Award, ShoppingBag, Shield, Scroll, ArrowUp, RefreshCw } from 'lucide-react';
import SectTaskModal from './SectTaskModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onJoinSect: (sectId: string, sectName?: string) => void;
  onLeaveSect: () => void;
  onSafeLeaveSect: () => void;
  onTask: (task: RandomSectTask, encounterResult?: AdventureResult) => void;
  onPromote: () => void;
  onBuy: (item: Partial<Item>, cost: number, quantity?: number) => void;
}

const SectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onJoinSect,
  onLeaveSect,
  onSafeLeaveSect,
  onTask,
  onPromote,
  onBuy,
}) => {
  const [activeTab, setActiveTab] = useState<'hall' | 'mission' | 'shop'>(
    'hall'
  );
  const [selectedTask, setSelectedTask] = useState<RandomSectTask | null>(null);
  const [buyQuantities, setBuyQuantities] = useState<Record<number, number>>(
    {}
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // 藏宝阁刷新相关状态
  const [sectShopItems, setSectShopItems] = useState<Array<{ name: string; cost: number; item: Omit<Item, 'id'> }>>(() => generateSectShopItems(1));
  const [sectShopItemsFloor2, setSectShopItemsFloor2] = useState<Array<{ name: string; cost: number; item: Omit<Item, 'id'> }>>(() => generateSectShopItems(2));
  const [shopFloor, setShopFloor] = useState<1 | 2>(1);
  const [shopRefreshTime, setShopRefreshTime] = useState<number>(() => Date.now() + 5 * 60 * 1000); // 5分钟后可刷新
  const [shopRefreshCooldown, setShopRefreshCooldown] = useState<number>(() => {
    // 初始化时计算剩余倒计时
    const now = Date.now();
    const refreshTime = Date.now() + 5 * 60 * 1000;
    return Math.max(0, Math.floor((refreshTime - now) / 1000));
  }); // 倒计时（秒）

  // 生成随机宗门列表（未加入宗门时）
  const availableSects = useMemo(() => {
    if (player.sectId) return SECTS;
    return generateRandomSects(player.realm, 6);
  }, [player.realm, player.sectId, refreshKey]);

  // 生成随机任务列表（已加入宗门时）
  const randomTasks = useMemo(() => {
    if (!player.sectId) return [];
    return generateRandomSectTasks(player.sectRank, player.realm, 3);
  }, [player.sectId, player.sectRank, player.realm, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // 藏宝阁刷新处理
  const handleShopRefresh = React.useCallback(() => {
    const now = Date.now();
    if (now >= shopRefreshTime) {
      setSectShopItems(generateSectShopItems(1));
      if (player.sectContribution >= 5000) {
        setSectShopItemsFloor2(generateSectShopItems(2));
      }
      const newRefreshTime = now + 5 * 60 * 1000; // 设置下次刷新时间
      setShopRefreshTime(newRefreshTime);
      setShopRefreshCooldown(5 * 60); // 重置倒计时
      setBuyQuantities({}); // 清空购买数量
    }
  }, [shopRefreshTime, player.sectContribution]);

  // 藏宝阁倒计时更新
  React.useEffect(() => {
    if (activeTab !== 'shop' || !isOpen) return;

    const updateCooldown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((shopRefreshTime - now) / 1000));
      setShopRefreshCooldown(remaining);

      // 如果倒计时结束，自动刷新
      if (remaining === 0 && now >= shopRefreshTime) {
        const newItems = generateSectShopItems();
        setSectShopItems(newItems);
        const newRefreshTime = now + 5 * 60 * 1000;
        setShopRefreshTime(newRefreshTime);
        setShopRefreshCooldown(5 * 60);
        setBuyQuantities({});
      }
    };

    // 立即更新一次
    updateCooldown();

    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [activeTab, isOpen, shopRefreshTime]);

  if (!isOpen) return null;

  const currentSect =
    availableSects.find((s) => s.id === player.sectId) ||
    SECTS.find((s) => s.id === player.sectId);
  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  // -- Selection View (Not in a sect) --
  if (!player.sectId) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-paper-800 w-full max-w-4xl rounded border border-stone-600 shadow-2xl flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 rounded-t">
            <h3 className="text-xl font-serif text-mystic-gold flex items-center gap-2">
              <Users size={20} /> 寻访仙门
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors"
                title="刷新宗门列表"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">刷新</span>
              </button>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableSects.map((sect) => {
              const canJoin =
                getRealmIndex(player.realm) >= getRealmIndex(sect.reqRealm);
              return (
                <div
                  key={sect.id}
                  className="bg-ink-800 border border-stone-700 p-4 rounded flex flex-col"
                >
                  <h4 className="text-xl font-serif font-bold text-stone-200 mb-2">
                    {sect.name}
                  </h4>
                  <p className="text-stone-400 text-sm mb-4 flex-1">
                    {sect.description}
                  </p>

                  <div className="text-xs text-stone-500 mb-4">
                    入门要求:{' '}
                    <span
                      className={canJoin ? 'text-stone-300' : 'text-red-400'}
                    >
                      {sect.reqRealm}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canJoin) {
                        onJoinSect(sect.id, sect.name);
                      }
                    }}
                    disabled={!canJoin}
                    className={`
                      w-full py-2 rounded font-serif text-sm transition-colors border touch-manipulation
                      ${
                        canJoin
                          ? 'bg-mystic-jade/20 text-mystic-jade border-mystic-jade hover:bg-mystic-jade/30 active:bg-mystic-jade/40'
                          : 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                      }
                    `}
                  >
                    {canJoin ? '拜入山门' : '境界不足'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -- Dashboard View (In a sect) --

  // Promotion Logic
  const ranks = Object.values(SectRank);
  const currentRankIdx = ranks.indexOf(player.sectRank);
  const nextRank =
    currentRankIdx < ranks.length - 1 ? ranks[currentRankIdx + 1] : null;
  const nextReq = nextRank ? SECT_RANK_REQUIREMENTS[nextRank] : null;

  const canPromote =
    nextRank &&
    nextReq &&
    player.sectContribution >= nextReq.contribution &&
    getRealmIndex(player.realm) >= nextReq.realmIndex;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-4xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-stone-600 bg-ink-800 md:rounded-t flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl md:text-2xl font-serif text-mystic-gold">
                {currentSect?.name}
              </h3>
              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-300 border border-stone-600">
                {player.sectRank}
              </span>
            </div>
            <div className="text-xs md:text-sm text-stone-400 flex gap-4">
              <span>
                宗门贡献:{' '}
                <span className="text-white font-bold">
                  {player.sectContribution}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'mission' && (
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors min-h-[44px] md:min-h-0 touch-manipulation"
                title="刷新任务列表"
              >
                <RefreshCw size={16} />
                <span className="hidden md:inline">刷新</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-stone-700 bg-ink-900">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'hall' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Shield size={16} /> 宗门大殿
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'mission' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Scroll size={16} /> 任务阁
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'shop' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <ShoppingBag size={16} /> 藏宝阁
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-paper-800">
          {/* Main Hall */}
          {activeTab === 'hall' && (
            <div className="space-y-6">
              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">
                  身份晋升
                </h4>
                {nextRank ? (
                  <div>
                    <p className="text-sm text-stone-400 mb-4">
                      下级职衔：
                      <span className="text-stone-200 font-bold">
                        {nextRank}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="bg-ink-900 p-2 rounded">
                        <span className="text-stone-500 block">所需贡献</span>
                        <span
                          className={
                            player.sectContribution >=
                            (nextReq?.contribution || 0)
                              ? 'text-mystic-jade'
                              : 'text-red-400'
                          }
                        >
                          {player.sectContribution} / {nextReq?.contribution}
                        </span>
                      </div>
                      <div className="bg-ink-900 p-2 rounded">
                        <span className="text-stone-500 block">所需境界</span>
                        <span
                          className={
                            getRealmIndex(player.realm) >=
                            (nextReq?.realmIndex || 0)
                              ? 'text-mystic-jade'
                              : 'text-red-400'
                          }
                        >
                          {Object.values(RealmType)[nextReq?.realmIndex || 0]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onPromote}
                      disabled={!canPromote}
                      className={`
                         w-full py-2 rounded font-serif text-sm transition-colors flex items-center justify-center gap-2
                         ${
                           canPromote
                             ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold hover:bg-mystic-gold/30'
                             : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                         }
                       `}
                    >
                      <ArrowUp size={16} /> 申请晋升
                    </button>
                  </div>
                ) : (
                  <p className="text-mystic-gold text-center py-4">
                    你已位极人臣，乃宗门之中流砥柱。
                  </p>
                )}
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">
                  退出宗门
                </h4>
                <p className="text-sm text-stone-500 mb-4">
                  退出宗门将清空所有贡献值。可以选择安全退出（支付代价）或直接背叛（会被追杀）。
                </p>
                {currentSect && currentSect.exitCost && (
                  <div className="mb-4 p-3 bg-ink-900 rounded border border-stone-600">
                    <p className="text-xs text-stone-400 mb-2">安全退出代价：</p>
                    <div className="text-xs text-stone-300 space-y-1">
                      {currentSect.exitCost.spiritStones && (
                        <div>灵石: {currentSect.exitCost.spiritStones}</div>
                      )}
                      {currentSect.exitCost.items && currentSect.exitCost.items.map((item, idx) => (
                        <div key={idx}>{item.name} x{item.quantity}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={onSafeLeaveSect}
                    className="flex-1 px-4 py-2 border border-yellow-900 text-yellow-400 hover:bg-yellow-900/20 rounded text-sm transition-colors"
                  >
                    安全退出
                  </button>
                  <button
                    onClick={onLeaveSect}
                    className="flex-1 px-4 py-2 border border-red-900 text-red-400 hover:bg-red-900/20 rounded text-sm transition-colors"
                  >
                    叛出宗门
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mission Hall */}
          {activeTab === 'mission' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-serif text-lg text-stone-200">任务列表</h4>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors"
                  title="刷新任务列表"
                >
                  <RefreshCw size={16} />
                  <span>刷新</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {randomTasks.map((task) => {
                  const canComplete = (() => {
                    // 检查境界要求
                    if (task.minRealm) {
                      const realmIndex = REALM_ORDER.indexOf(player.realm);
                      const minRealmIndex = REALM_ORDER.indexOf(task.minRealm);
                      if (realmIndex < minRealmIndex) {
                        return false;
                      }
                    }
                    if (
                      task.cost?.spiritStones &&
                      player.spiritStones < task.cost.spiritStones
                    )
                      return false;
                    if (task.cost?.items) {
                      for (const itemReq of task.cost.items) {
                        const item = player.inventory.find(
                          (i) => i.name === itemReq.name
                        );
                        if (!item || item.quantity < itemReq.quantity)
                          return false;
                      }
                    }
                    // 检查每日任务限制
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = player.lastTaskResetDate || today;
                    const taskLimits: Record<string, number> = {
                      instant: 10,
                      short: 5,
                      medium: 3,
                      long: 2,
                    };
                    const limit = taskLimits[task.timeCost];
                    if (limit) {
                      const dailyTaskCount =
                        lastReset === today
                          ? player.dailyTaskCount &&
                            typeof player.dailyTaskCount === 'object'
                            ? player.dailyTaskCount
                            : typeof player.dailyTaskCount === 'number'
                              ? {
                                  instant: player.dailyTaskCount,
                                  short: 0,
                                  medium: 0,
                                  long: 0,
                                }
                              : { instant: 0, short: 0, medium: 0, long: 0 }
                          : { instant: 0, short: 0, medium: 0, long: 0 };
                      const currentCount =
                        dailyTaskCount[
                          task.timeCost as keyof typeof dailyTaskCount
                        ] || 0;
                      if (currentCount >= limit) return false;
                    }
                    return true;
                  })();

                  const timeCostText = {
                    instant: '瞬时',
                    short: '短暂',
                    medium: '中等',
                    long: '较长',
                  }[task.timeCost];

                  // 任务品质颜色配置
                  const qualityColors = {
                    普通: 'text-stone-400 border-stone-600 bg-stone-900/20',
                    稀有: 'text-blue-400 border-blue-600 bg-blue-900/20',
                    传说: 'text-purple-400 border-purple-600 bg-purple-900/20',
                    仙品: 'text-yellow-400 border-yellow-600 bg-yellow-900/20',
                  };

                  // 难度颜色配置
                  const difficultyColors = {
                    简单: 'text-green-400',
                    普通: 'text-blue-400',
                    困难: 'text-orange-400',
                    极难: 'text-red-400',
                  };

                  // 检查境界要求
                  const meetsRealmRequirement = task.minRealm
                    ? REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(task.minRealm)
                    : true;

                  return (
                    <div
                      key={task.id}
                      className={`bg-ink-800 p-4 rounded border flex flex-col ${
                        task.quality === '仙品'
                          ? 'border-yellow-600/50 shadow-lg shadow-yellow-900/20'
                          : task.quality === '传说'
                          ? 'border-purple-600/50 shadow-md shadow-purple-900/10'
                          : 'border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-serif font-bold text-stone-200 flex-1">
                          {task.name}
                        </h4>
                        {task.quality && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${qualityColors[task.quality]}`}>
                            {task.quality}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mb-3 flex-1">
                        {task.description}
                      </p>

                      {/* 任务标签 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[task.difficulty]} bg-stone-900/30 border-stone-600`}>
                          难度: {task.difficulty}
                        </span>
                        {task.minRealm && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${
                            meetsRealmRequirement
                              ? 'text-green-400 border-green-600 bg-green-900/20'
                              : 'text-red-400 border-red-600 bg-red-900/20'
                          }`}>
                            境界: {task.minRealm}
                            {!meetsRealmRequirement && ' (不足)'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        {task.cost && (
                          <div className="text-xs text-red-400">
                            消耗:{' '}
                            {task.cost.spiritStones && (
                              <span>{task.cost.spiritStones} 灵石</span>
                            )}
                            {task.cost.items &&
                              task.cost.items.map((item, idx) => (
                                <span key={idx}>
                                  {idx > 0 && '、'}
                                  {item.quantity} {item.name}
                                </span>
                              ))}
                          </div>
                        )}
                        <div className="text-xs text-stone-400">
                          奖励:{' '}
                          <span className="text-mystic-gold">
                            {task.reward.contribution} 贡献
                          </span>
                          {task.reward.exp && (
                            <span>、{task.reward.exp} 修为</span>
                          )}
                          {task.reward.spiritStones && (
                            <span>、{task.reward.spiritStones} 灵石</span>
                          )}
                          {task.reward.items &&
                            task.reward.items.map((item, idx) => (
                              <span key={idx}>
                                {idx === 0 && '、'}
                                {item.quantity} {item.name}
                              </span>
                            ))}
                        </div>
                        <div className="text-xs text-stone-500">
                          耗时: {timeCostText}
                        </div>
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const lastReset = player.lastTaskResetDate || today;
                          const taskLimits: Record<string, number> = {
                            instant: 10,
                            short: 5,
                            medium: 3,
                            long: 2,
                          };
                          const limit = taskLimits[task.timeCost];
                          if (limit) {
                            const dailyTaskCount =
                              lastReset === today
                                ? player.dailyTaskCount &&
                                  typeof player.dailyTaskCount === 'object'
                                  ? player.dailyTaskCount
                                  : typeof player.dailyTaskCount === 'number'
                                    ? {
                                        instant: player.dailyTaskCount,
                                        short: 0,
                                        medium: 0,
                                        long: 0,
                                      }
                                    : {
                                        instant: 0,
                                        short: 0,
                                        medium: 0,
                                        long: 0,
                                      }
                                : { instant: 0, short: 0, medium: 0, long: 0 };
                            const currentCount =
                              dailyTaskCount[
                                task.timeCost as keyof typeof dailyTaskCount
                              ] || 0;
                            return (
                              <div className="text-xs text-stone-500">
                                今日已完成: {currentCount} / {limit} 次
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <button
                        onClick={() => setSelectedTask(task)}
                        disabled={!canComplete}
                        className={`w-full py-2 rounded text-sm ${
                          !canComplete
                            ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
                            : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                        }`}
                      >
                        {!canComplete ? '无法完成' : '执行任务'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Treasure Pavilion */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-serif text-lg text-stone-200">藏宝阁</h4>
                  <div className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                    <button
                      onClick={() => setShopFloor(1)}
                      className={`px-2 py-1 rounded text-xs ${shopFloor === 1 ? 'bg-stone-700 text-stone-200' : 'bg-stone-800 text-stone-500'}`}
                    >
                      一楼
                    </button>
                    <button
                      onClick={() => player.sectContribution >= 5000 && setShopFloor(2)}
                      disabled={player.sectContribution < 5000}
                      className={`px-2 py-1 rounded text-xs ${shopFloor === 2 ? 'bg-stone-700 text-stone-200' : 'bg-stone-800 text-stone-500'} ${player.sectContribution < 5000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      二楼 {player.sectContribution >= 5000 ? '✓' : '(需5000贡献)'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {shopRefreshCooldown > 0 ? (
                    <span className="text-xs text-stone-400">
                      {Math.floor(shopRefreshCooldown / 60)}:{(shopRefreshCooldown % 60).toString().padStart(2, '0')} 后可刷新
                    </span>
                  ) : (
                    <span className="text-xs text-green-400">可刷新</span>
                  )}
                  <button
                    onClick={handleShopRefresh}
                    disabled={shopRefreshCooldown > 0}
                    className={`px-3 py-1.5 rounded text-sm border flex items-center gap-1.5 transition-colors ${
                      shopRefreshCooldown > 0
                        ? 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                        : 'bg-blue-700 hover:bg-blue-600 text-stone-200 border-blue-600'
                    }`}
                    title={shopRefreshCooldown > 0 ? `还需等待 ${Math.floor(shopRefreshCooldown / 60)} 分 ${shopRefreshCooldown % 60} 秒` : '刷新藏宝阁物品（5分钟冷却）'}
                  >
                    <RefreshCw size={16} />
                    <span>刷新</span>
                  </button>
                </div>
              </div>
              {(shopFloor === 1 ? sectShopItems : sectShopItemsFloor2).map((item, idx) => {
                const quantity = buyQuantities[idx] || 1;
                const totalCost = item.cost * quantity;
                const canBuy = player.sectContribution >= totalCost;

                return (
                  <div
                    key={idx}
                    className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-200">
                        {item.name}
                      </div>
                      <div className="text-xs text-stone-500">
                        {item.item.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-mystic-gold font-bold">
                        {item.cost} 贡献
                        {quantity > 1 && (
                          <span className="text-xs text-stone-400 ml-1">
                            x{quantity} = {totalCost}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-stone-600 rounded">
                          <button
                            onClick={() =>
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: Math.max(1, (prev[idx] || 1) - 1),
                              }))
                            }
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                              const val = Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              );
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: val,
                              }));
                            }}
                            className="w-12 text-center bg-transparent text-stone-200 border-0 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              setBuyQuantities((prev) => ({
                                ...prev,
                                [idx]: (prev[idx] || 1) + 1,
                              }))
                            }
                            className="px-2 py-1 text-stone-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            onBuy(item.item, item.cost, quantity);
                            setBuyQuantities((prev) => ({ ...prev, [idx]: 1 }));
                          }}
                          disabled={!canBuy}
                          className={`
                            px-3 py-1.5 rounded text-xs border
                            ${
                              canBuy
                                ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border-stone-600'
                                : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
                            }
                          `}
                        >
                          兑换
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 任务执行弹窗 */}
      {selectedTask && (
        <SectTaskModal
          isOpen={true}
          onClose={() => {
            setSelectedTask(null);
          }}
          task={selectedTask}
          player={player}
          onTaskComplete={(task, encounterResult) => {
            onTask(task, encounterResult);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default SectModal;
