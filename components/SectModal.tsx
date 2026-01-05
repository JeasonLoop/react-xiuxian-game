import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { PlayerStats, SectRank, RealmType, Item, AdventureResult } from '../types';
import { SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER, SECT_RANK_DATA } from '../constants/index';
import { generateRandomSects, generateRandomSectTasks, generateSectShopItems, RandomSectTask } from '../services/randomService';
import { X, Users, ShoppingBag, Shield, Scroll, ArrowUp, RefreshCw, BookOpen } from 'lucide-react';
import SectTaskModal from './SectTaskModal';
import { showConfirm } from '../utils/toastUtils';
import { CULTIVATION_ARTS } from '../constants/cultivation';
import { CultivationArt } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onJoinSect: (sectId: string, sectName?: string, sectInfo?: { exitCost?: { spiritStones?: number; items?: { name: string; quantity: number }[] } }) => void;
  onLeaveSect: () => void;
  onSafeLeaveSect: () => void;
  onTask: (task: RandomSectTask, encounterResult?: AdventureResult) => void;
  onPromote: () => void;
  onBuy: (item: Partial<Item>, cost: number, quantity?: number) => void;
  onLearnArt: (art: CultivationArt) => void;
  onChallengeLeader: () => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
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
  onLearnArt,
  onChallengeLeader,
  setItemActionLog,
}) => {
  const [activeTab, setActiveTab] = useState<'hall' | 'mission' | 'shop' | 'library'>(
    'hall'
  );
  const [selectedTask, setSelectedTask] = useState<RandomSectTask | null>(null);
  const [buyQuantities, setBuyQuantities] = useState<Record<number, number>>(
    {}
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [realmFilter, setRealmFilter] = useState<RealmType | 'all'>('all');

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
    // 生成更多宗门以确保能选出6个唯一的
    const allSects = generateRandomSects(player.realm, 12);
    const uniqueSects: typeof SECTS = [];
    const seenNames = new Set<string>();

    // 去重：按宗门名称去重，保留第一次出现的
    for (const sect of allSects) {
      if (!seenNames.has(sect.name)) {
        seenNames.add(sect.name);
        uniqueSects.push(sect);
        if (uniqueSects.length >= 6) break;
      }
    }

    return uniqueSects.slice(0, 6); // 确保最多返回6个
  }, [player.realm, player.sectId, refreshKey]);

  // 生成随机任务列表（已加入宗门时）
  const randomTasks = useMemo(() => {
    if (!player.sectId) return [];
    return generateRandomSectTasks(player.sectRank, player.realm, 12);
  }, [player.sectId, player.sectRank, player.realm, refreshKey]);

  // 获取宗门功法
  const sectArts = useMemo(() => {
    if (!player.sectId) return [];
    return CULTIVATION_ARTS.filter(art => art.sectId === player.sectId);
  }, [player.sectId]);

  // 根据境界过滤任务列表
  const filteredTasks = useMemo(() => {
    if (realmFilter === 'all') return randomTasks;
    const filterRealmIndex = REALM_ORDER.indexOf(realmFilter);
    return randomTasks.filter((task) => {
      // 如果没有境界要求，显示所有任务
      if (!task.minRealm) return true;
      // 只显示境界要求小于等于选择境界的任务
      const taskRealmIndex = REALM_ORDER.indexOf(task.minRealm);
      return taskRealmIndex <= filterRealmIndex;
    });
  }, [randomTasks, realmFilter]);

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

  // 获取当前宗门信息，优先从保存的信息中获取（用于随机生成的宗门）
  const currentSect =
    (player.currentSectInfo ? {
      id: player.currentSectInfo.id,
      name: player.currentSectInfo.name,
      description: '',
      reqRealm: RealmType.QiRefining,
      grade: '黄',
      exitCost: player.currentSectInfo.exitCost,
    } : null) ||
    availableSects.find((s) => s.id === player.sectId) ||
    SECTS.find((s) => s.id === player.sectId);
  const getRealmIndex = (r: RealmType) => REALM_ORDER.indexOf(r);

  if (!player.sectId) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="寻访仙门"
        size="4xl"
        height="auto"
        containerClassName="bg-paper-800 border-stone-600"
        headerClassName="bg-ink-800 border-b border-stone-600"
        contentClassName="bg-paper-800"
        titleExtra={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors mr-2"
            title="刷新宗门列表"
          >
            <RefreshCw size={16} />
            <span className="hidden md:inline">刷新</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      onJoinSect(sect.id, sect.name, { exitCost: sect.exitCost });
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
      </Modal>
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-lg md:text-xl font-serif text-mystic-gold">
                {currentSect?.name}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-stone-700 text-stone-300 border border-stone-600 flex items-center gap-1">
                <Shield size={10} className="text-blue-400" />
                {SECT_RANK_DATA[player.sectRank]?.title || player.sectRank}
              </span>
            </div>
            <div className="text-[10px] md:text-xs text-stone-400">
              宗门贡献:{' '}
              <span className="text-white font-bold">
                {player.sectContribution}
              </span>
            </div>
          </div>
        }
        size="4xl"
        height="full"
        containerClassName="bg-paper-800 border-stone-600"
        headerClassName="bg-ink-800 border-b border-stone-600"
        contentClassName="bg-paper-800"
        titleExtra={
          activeTab === 'mission' && (
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-xs flex items-center gap-1 transition-colors mr-2"
              title="刷新任务列表"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">刷新</span>
            </button>
          )
        }
        subHeader={
          <div className="flex border-b border-stone-700 bg-ink-900">
            <button
              onClick={() => setActiveTab('hall')}
              className={`flex-1 py-2.5 text-xs md:text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'hall' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <Shield size={14} /> 宗门大殿
            </button>
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex-1 py-2.5 text-xs md:text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'mission' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <Scroll size={14} /> 任务阁
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 py-2.5 text-xs md:text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'shop' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <ShoppingBag size={14} /> 藏宝阁
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-2.5 text-xs md:text-sm font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'library' ? 'text-mystic-gold bg-paper-800 border-t-2 border-mystic-gold' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <BookOpen size={14} /> 功法阁
            </button>
          </div>
        }
      >
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
                      onClick={() => {
                        if (!canPromote) return;
                        // 如果是晋升到宗主，弹出确认对话框
                        if (nextRank === SectRank.Leader) {
                          showConfirm(
                            '宗主之位需通过挑战禁地并战胜上代宗主方可继任。\n\n挑战失败将损失贡献和气血，是否确认挑战？',
                            '挑战宗主',
                            () => {
                              onChallengeLeader();
                            }
                          );
                        } else {
                          // 其他等级直接晋升
                          onPromote();
                        }
                      }}
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
                  <div>
                    {player.sectRank === SectRank.Elder && (
                      <div className="mt-4 pt-4 border-t border-stone-700">
                        <p className="text-sm text-stone-400 mb-2 text-center">
                          你已身为长老，是否有志更进一步，挑战现任宗主？
                        </p>
                        <button
                          onClick={onChallengeLeader}
                          className="w-full py-3 bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50 rounded font-serif text-base transition-all animate-pulse"
                        >
                          🔥 挑战宗主 🔥
                        </button>
                      </div>
                    )}
                    <p className="text-mystic-gold text-center py-4">
                      {player.sectRank === SectRank.Leader ? (
                        <div className="space-y-4">
                          <p>你已登临宗主之位，统领全宗。</p>
                          <div className="bg-mystic-gold/10 p-4 rounded border border-mystic-gold/30">
                            <h5 className="text-mystic-gold font-bold mb-2">宗主特权</h5>
                            <ul className="text-xs text-stone-400 text-left space-y-1 list-disc list-inside">
                              <li>藏宝阁兑换享受 <span className="text-mystic-gold">5折</span> 优惠</li>
                              <li>后续将解锁更多宗门管理功能...</li>
                            </ul>
                          </div>
                        </div>
                      ) : '你已位极人臣，乃宗门之中流砥柱。'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-ink-800 p-4 rounded border border-stone-700">
                <h4 className="font-serif text-lg text-stone-200 mb-2 border-b border-stone-700 pb-2">
                  退出宗门
                </h4>
                <p className="text-sm text-stone-500 mb-4">
                  退出宗门将清空所有贡献值。可以选择安全退出（支付代价）或直接背叛（会被追杀）。
                </p>
                {currentSect && currentSect.exitCost ? (
                  <div className="mb-4 p-3 bg-ink-900 rounded border border-stone-600">
                    <p className="text-xs text-stone-400 mb-2">安全退出代价：</p>
                    <div className="text-xs text-stone-300 space-y-1">
                      {currentSect.exitCost.spiritStones && (
                        <div>灵石: {currentSect.exitCost.spiritStones}</div>
                      )}
                      {currentSect.exitCost.items && Array.isArray(currentSect.exitCost.items) && currentSect.exitCost.items.map((item, idx) => (
                        <div key={idx}>{item.name} x{item.quantity}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-ink-900 rounded border border-stone-600">
                    <p className="text-xs text-stone-400 mb-2">安全退出代价：</p>
                    <div className="text-xs text-stone-300 space-y-1">
                      <div>灵石: 300</div>
                      <div>聚灵草 x5</div>
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
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h4 className="font-serif text-lg text-stone-200">任务列表</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={realmFilter}
                    onChange={(e) => setRealmFilter(e.target.value as RealmType | 'all')}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm transition-colors cursor-pointer"
                    title="按境界过滤任务"
                  >
                    <option value="all">全部境界</option>
                    {REALM_ORDER.map((realm) => (
                      <option key={realm} value={realm}>
                        {realm}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded text-sm flex items-center gap-1.5 transition-colors"
                    title="刷新任务列表"
                  >
                    <RefreshCw size={16} />
                    <span>刷新</span>
                  </button>
                </div>
              </div>
              <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full text-center text-stone-500 py-10 font-serif">
                    当前过滤条件下暂无任务
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                  // 检查任务是否可以完成（但不阻止点击）
                  const taskStatus = (() => {
                    const reasons: string[] = [];

                    // 检查境界要求
                    if (task.minRealm) {
                      const realmIndex = REALM_ORDER.indexOf(player.realm);
                      const minRealmIndex = REALM_ORDER.indexOf(task.minRealm);
                      if (realmIndex < minRealmIndex) {
                        reasons.push('境界不足');
                      }
                    }
                    if (
                      task.cost?.spiritStones &&
                      player.spiritStones < task.cost.spiritStones
                    ) {
                      reasons.push('灵石不足');
                    }
                    if (task.cost?.items && Array.isArray(player.inventory)) {
                      for (const itemReq of task.cost.items) {
                        const item = player.inventory.find(
                          (i) => i.name === itemReq.name
                        );
                        if (!item || item.quantity < itemReq.quantity) {
                          reasons.push(`缺少${itemReq.name}`);
                          break;
                        }
                      }
                    }
                    // 检查每日任务次数限制（按单个任务）
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = player.lastTaskResetDate || today;
                    const TASK_DAILY_LIMIT = 3; // 每个任务每天最多3次

                    if (lastReset === today) {
                      const dailyTaskCount = player.dailyTaskCount || {};
                      const currentCount = dailyTaskCount[task.id] || 0;
                      if (currentCount >= TASK_DAILY_LIMIT) {
                        reasons.push(`今日已完成${TASK_DAILY_LIMIT}次该任务`);
                      }
                    }
                    return {
                      canComplete: reasons.length === 0,
                      reasons: reasons.join('、'),
                    };
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
                          {task.isDailySpecial && (
                            <span className="text-xs text-yellow-400 ml-2 animate-pulse">
                              ⭐ 每日特殊
                            </span>
                          )}
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
                              task.cost.items && Array.isArray(task.cost.items) && task.cost.items.map((item, idx) => (
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
                        {task.successRate && (
                          <div className="text-xs text-yellow-400">
                            完美完成概率: {task.successRate}%
                          </div>
                        )}
                        {task.completionBonus && (
                          <div className="text-xs text-purple-400">
                            完美完成可获得额外奖励
                          </div>
                        )}
                        {task.typeBonus && player.lastCompletedTaskType === task.type && (
                          <div className="text-xs text-green-400 font-bold">
                            ⚡ 连续完成加成: +{task.typeBonus}%
                          </div>
                        )}
                        {task.recommendedFor && (() => {
                          const recommendations: string[] = [];
                          if (task.recommendedFor.highAttack && player.attack > 50) {
                            recommendations.push('适合高攻击');
                          }
                          if (task.recommendedFor.highDefense && player.defense > 50) {
                            recommendations.push('适合高防御');
                          }
                          if (task.recommendedFor.highSpirit && player.spirit > 50) {
                            recommendations.push('适合高神识');
                          }
                          if (task.recommendedFor.highSpeed && player.speed > 50) {
                            recommendations.push('适合高速度');
                          }
                          return recommendations.length > 0 ? (
                            <div className="text-xs text-blue-400">
                              💡 推荐: {recommendations.join('、')}
                            </div>
                          ) : null;
                        })()}
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const lastReset = player.lastTaskResetDate || today;
                          const TASK_DAILY_LIMIT = 3; // 每个任务每天最多3次

                          if (lastReset === today) {
                            const dailyTaskCount = player.dailyTaskCount || {};
                            const currentCount = dailyTaskCount[task.id] || 0;
                            return (
                              <div className="text-xs text-stone-500">
                                今日已完成: {currentCount} / {TASK_DAILY_LIMIT} 次
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <button
                        onClick={() => {
                          if (!taskStatus.canComplete && taskStatus.reasons) {
                            // 如果无法完成，显示提示但允许点击查看详情
                            // 实际限制检查会在任务执行时进行
                          }
                          setSelectedTask(task);
                        }}
                        className={`w-full py-2 rounded text-sm ${
                          !taskStatus.canComplete
                            ? 'bg-stone-800 text-stone-400 border border-stone-600 hover:bg-stone-700'
                            : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                        }`}
                        title={!taskStatus.canComplete ? `无法完成：${taskStatus.reasons}` : ''}
                      >
                        {!taskStatus.canComplete ? `无法完成（${taskStatus.reasons}）` : '执行任务'}
                      </button>
                    </div>
                  );
                  })
                )}
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
                // 宗主享受5折优惠
                const baseCost = player.sectRank === SectRank.Leader ? Math.ceil(item.cost * 0.5) : item.cost;
                const totalCost = baseCost * quantity;
                const canBuy = player.sectContribution >= totalCost;

                return (
                  <div
                    key={idx}
                    className="bg-ink-800 p-3 rounded border border-stone-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-200">
                        {item.name}
                        {player.sectRank === SectRank.Leader && (
                          <span className="text-[10px] ml-2 px-1 bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30 rounded">
                            宗主特权 5折
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        {item.item.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-mystic-gold font-bold">
                        {baseCost} 贡献
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
                            onBuy(item.item, baseCost, quantity);
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

          {/* Library */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-serif text-lg text-stone-200">功法阁</h4>
                  <p className="text-xs text-stone-500 mt-1">这里存放着宗门历代传承的绝学，需消耗贡献领悟。</p>
                </div>
              </div>

              {sectArts.length === 0 ? (
                <div className="text-center py-12 bg-ink-800 rounded border border-stone-700">
                  <BookOpen className="mx-auto text-stone-600 mb-4" size={48} />
                  <p className="text-stone-500 font-serif">该宗门暂无专属传承功法</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectArts.map((art) => {
                    const isUnlocked = (player.unlockedArts || []).includes(art.id) || player.cultivationArts.includes(art.id);
                    const canAfford = player.sectContribution >= art.cost;
                    const meetsRealm = getRealmIndex(player.realm) >= getRealmIndex(art.realmRequirement);

                    return (
                      <div
                        key={art.id}
                        className={`bg-ink-800 p-4 rounded border flex flex-col ${
                          isUnlocked ? 'border-mystic-jade/30 bg-mystic-jade/5' : 'border-stone-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-serif font-bold text-stone-200">{art.name}</h5>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border border-stone-600 bg-stone-900/50 ${
                            art.grade === '天' ? 'text-yellow-400' :
                            art.grade === '地' ? 'text-purple-400' :
                            art.grade === '玄' ? 'text-blue-400' : 'text-stone-400'
                          }`}>
                            {art.grade}级{art.type === 'mental' ? '心法' : '功法'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mb-3 flex-1">{art.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="text-[10px] text-stone-400">
                            要求: <span className={meetsRealm ? 'text-stone-300' : 'text-red-400'}>{art.realmRequirement}</span>
                          </div>
                          <div className="text-[10px] text-mystic-gold">
                            消耗: <span>{art.cost} 贡献</span>
                          </div>
                        </div>

                        <button
                          onClick={() => !isUnlocked && meetsRealm && canAfford && onLearnArt(art)}
                          disabled={isUnlocked || !meetsRealm || !canAfford}
                          className={`w-full py-2 rounded text-xs transition-colors ${
                            isUnlocked
                              ? 'bg-mystic-jade/20 text-mystic-jade border border-mystic-jade/30 cursor-default'
                              : !meetsRealm || !canAfford
                              ? 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                              : 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold hover:bg-mystic-gold/30'
                          }`}
                        >
                          {isUnlocked ? '已领悟' : !meetsRealm ? '境界不足' : !canAfford ? '贡献不足' : '领悟功法'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
      </Modal>

      {/* 任务执行弹窗 */}
      {selectedTask && (
        <SectTaskModal
          isOpen={true}
          onClose={() => {
            setSelectedTask(null);
          }}
          task={selectedTask}
          player={player}
          setItemActionLog={setItemActionLog}
          onTaskComplete={(task, encounterResult, isPerfectCompletion) => {
            onTask(task, encounterResult, isPerfectCompletion);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};

export default React.memo(SectModal);
