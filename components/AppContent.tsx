/**
 * App Content Component
 * 主游戏内容渲染组件
 * 从 App.tsx 中提取了所有游戏内容的渲染逻辑
 */

import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, TribulationState, LogEntry } from '../types';
import { BattleReplay } from '../services/battleService';
import TribulationModal from './TribulationModal';
import DeathModal from './DeathModal';
import DungeonModal from './DungeonModal';
import NPCRelationsModal from './NPCRelationsModal';
import RebirthModal, { canRebirth, getRebirthBonuses } from './RebirthModal';
import GameView from '../views/GameView';
import DebugModal from './DebugModal';
import AlertModal from './AlertModal';
import ModalsContainer from '../views/modals/ModalsContainer';
import CultivationIntroModal from './CultivationIntroModal';
import AutoAdventureConfigModal from './AutoAdventureConfigModal';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { REALM_DATA } from '../constants/index';
import { createInitialPlayer } from '../utils/playerUtils';
import { useUIStore, useModals } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { isDebugFeatureAvailable } from '../utils/debugMode';
import AuctionHouseModal from './AuctionHouseModal';
import { useTradeMarketHandlers } from '../views/auctionHouse/useAuctionHouseHandlers';

interface AppContentProps {
  // 玩家数据
  player: PlayerStats;

  // 游戏状态
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  visualEffects: any[];
  loading: boolean;
  cooldown: number;
  settings: any;

  // 弹窗状态
  isDead: boolean;
  deathBattleData: BattleReplay | null;
  deathReason: string;
  tribulationState: TribulationState | null;
  showCultivationIntro: boolean;
  isAnyModalOpen: boolean;

  // 通知状态
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
  itemActionLogValue: { text: string; type: string } | null;

  // 自动功能状态
  autoAdventure: boolean;

  // Setters
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  setIsDead: (dead: boolean) => void;
  setDeathBattleData: (data: BattleReplay | null) => void;
  setDeathReason: (reason: string) => void;
  setShowCultivationIntro: (show: boolean) => void;
  setLotteryRewards: (rewards: Array<{ type: string; name: string; quantity?: number }>) => void;
  setItemActionLog: (log: { text: string; type: string } | null) => void;
  setReputationEvent: (event: any | null) => void;

  // Auto adventure config
  autoAdventureConfig: {
    skipBattle: boolean;
    fleeOnBattle: boolean;
    skipShop: boolean;
    skipReputationEvent: boolean;
    minHpThreshold: number;
  };
  setAutoAdventureConfig: React.Dispatch<React.SetStateAction<{
    skipBattle: boolean;
    fleeOnBattle: boolean;
    skipShop: boolean;
    skipReputationEvent: boolean;
    minHpThreshold: number;
  }>>;

  // Handlers
  handleTribulationComplete: (result: any) => void;
  handleRebirth: () => void;
  closeAlert: () => void;
  alertState: any;
  gameViewHandlers: any;
  modalsHandlers: any;
  adventureHandlers: any;
}

/**
 * 主游戏内容组件
 */
export function AppContent(props: AppContentProps) {
  const canUseDebugFeature = isDebugFeatureAvailable();
  // 从 store 获取状态和方法
  const setAutoAdventure = useUIStore((state) => state.setAutoAdventure);
  const setModal = useUIStore((state) => state.setModal);
  const modals = useModals();
  const marketItems = useUIStore((state) => state.marketItems);

  const {
    player,
    logs,
    setLogs,
    visualEffects,
    loading,
    cooldown,
    settings,
    isDead,
    deathBattleData,
    deathReason,
    tribulationState,
    showCultivationIntro,
    isAnyModalOpen,
    purchaseSuccess,
    lotteryRewards,
    itemActionLogValue,
    autoAdventure,
    setPlayer,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
    setShowCultivationIntro,
    setLotteryRewards,
    setItemActionLog,
    setReputationEvent,
    autoAdventureConfig,
    setAutoAdventureConfig,
    handleTribulationComplete,
    handleRebirth,
    closeAlert,
    alertState,
    gameViewHandlers,
    modalsHandlers,
    adventureHandlers,
  } = props;

  // 快捷方法
  const setIsDebugOpen = (open: boolean) => setModal('isDebugOpen', open);
  const setIsReputationEventOpen = (open: boolean) => setModal('isReputationEventOpen', open);
  const setIsAutoAdventureConfigOpen = (open: boolean) => setModal('isAutoAdventureConfigOpen', open);
  const setIsDungeonOpen = (open: boolean) => setModal('isDungeonOpen', open);

  // 交易行
  const tradeMarketHandlers = useTradeMarketHandlers({
    player: player || undefined,
    setPlayer: setPlayer as React.Dispatch<React.SetStateAction<PlayerStats>>,
    addLog: (text, type) => useGameStore.getState().addLog(text, (type || 'normal') as any),
    setIsTradeMarketOpen: (open) => setModal('isTradeMarketOpen', open),
  });

  // NPC 人物志弹窗
  const [isRelationsOpen, setIsRelationsOpen] = useState(false);
  useEffect(() => {
    const handler = () => setIsRelationsOpen(true);
    window.addEventListener('open-npc-relations', handler);
    return () => window.removeEventListener('open-npc-relations', handler);
  }, []);

  // 交易行：收到事件后同步市场数据
  const tradeMarketHandlerRef = useRef(tradeMarketHandlers);
  tradeMarketHandlerRef.current = tradeMarketHandlers;
  useEffect(() => {
    const handler = () => {
      tradeMarketHandlerRef.current.handleOpenTradeMarket();
    };
    window.addEventListener('open-trade-market', handler);
    return () => window.removeEventListener('open-trade-market', handler);
  }, []);

  // 转世重修
  const [isRebirthOpen, setIsRebirthOpen] = useState(false);
  useEffect(() => {
    const handler = () => setIsRebirthOpen(true);
    window.addEventListener('open-rebirth', handler);
    return () => window.removeEventListener('open-rebirth', handler);
  }, []);

  // 批量分解装备
  useEffect(() => {
    const handler = (e: Event) => {
      const { stoneCount } = (e as CustomEvent).detail;
      setPlayer((prev: any) => {
        if (!prev) return prev;
        const inv = [...prev.inventory];
        const stone = inv.find((i: any) => i.name === '炼器石');
        if (stone) { stone.quantity += stoneCount; }
        else { inv.push({ id: `refining-stone-${Date.now()}`, name: '炼器石', type: 'Material', quantity: stoneCount, description: '用于强化法宝和装备', rarity: '普通' }); }
        return { ...prev, inventory: inv };
      });
    };
    window.addEventListener('dismantle-equip', handler);
    return () => window.removeEventListener('dismantle-equip', handler);
  }, [setPlayer]);

  // 物品锁定切换
  useEffect(() => {
    const handler = (e: Event) => {
      const { itemId } = (e as CustomEvent).detail;
      setPlayer((prev: any) => {
        if (!prev) return prev;
        const inv = prev.inventory.map((i: any) =>
          i.id === itemId ? { ...i, locked: !i.locked } : i
        );
        return { ...prev, inventory: inv };
      });
    };
    window.addEventListener('toggle-item-lock', handler);
    return () => window.removeEventListener('toggle-item-lock', handler);
  }, [setPlayer]);
  const doRebirth = () => {
    if (!player) return;
    const nextLevel = (player.inheritanceLevel || 0) + 1;
    const bonuses = getRebirthBonuses(nextLevel - 1);
    
    setPlayer(prev => {
      if (!prev) return prev;
      // 保留功法（选品级最高的）
      const sortedArts = [...(prev.cultivationArts || [])].sort(() => Math.random() - 0.5).slice(0, bonuses.keepArts);
      // 提升灵根
      const roots = { ...prev.spiritualRoots };
      for (const k of Object.keys(roots) as Array<keyof typeof roots>) {
        roots[k] = Math.min(100, (roots[k] || 0) + bonuses.rootBoost);
      }
      
      const realmData = REALM_DATA[prev.realm]; // 取当前境界数据但不直接用
      // 创建新玩家，重置境界但保留关键数据
      const prevTalentIds = Array.isArray(prev.talentIds) && prev.talentIds.length > 0
        ? prev.talentIds
        : (prev as any).talentId ? [(prev as any).talentId] : ['talent-balanced'];
      const newPlayer = createInitialPlayer(prev.name, prevTalentIds);
      return {
        ...newPlayer,
        name: prev.name,
        spiritualRoots: roots,
        unlockedArts: [...new Set([...(prev.unlockedArts || []), ...sortedArts])],
        cultivationArts: [],
        activeArtId: null,
        pets: prev.pets,
        achievements: prev.achievements,
        viewedAchievements: prev.viewedAchievements || [],
        unlockedTitles: prev.unlockedTitles || [],
        titleId: prev.titleId,
        talentIds: prevTalentIds,
        inheritanceLevel: nextLevel,
        luck: prev.luck + 2,
        // 应用转世属性加成
        attack: Math.floor(newPlayer.attack * (1 + bonuses.statBonus)),
        defense: Math.floor(newPlayer.defense * (1 + bonuses.statBonus)),
        maxHp: Math.floor(newPlayer.maxHp * (1 + bonuses.statBonus)),
        hp: Math.floor(newPlayer.maxHp * (1 + bonuses.statBonus)),
        spirit: Math.floor(newPlayer.spirit * (1 + bonuses.statBonus)),
        physique: Math.floor(newPlayer.physique * (1 + bonuses.statBonus)),
        speed: Math.floor(newPlayer.speed * (1 + bonuses.statBonus)),
        // 传承记忆：保留部分灵石
        spiritStones: 0,
        inventory: [],
        equippedItems: {},
        sectId: null,
        sectRank: '外门弟子' as any,
        sectContribution: 0,
        grotto: { level: 0, expRateBonus: 0, autoHarvest: false, growthSpeedBonus: 0, plantedHerbs: [], lastHarvestTime: null, spiritArrayEnhancement: 0, herbarium: prev.grotto?.herbarium || [], dailySpeedupCount: 0, lastSpeedupResetDate: new Date().toISOString().split('T')[0] },
        lotteryTickets: prev.lotteryTickets + 10,
      };
    });
    
    useGameStore.getState().addLog(`🌟 你抛弃凡躯，转世重修！第 ${nextLevel} 次转世，全属性 +${Math.round(bonuses.statBonus * 100)}%，修炼速度 +${Math.round(bonuses.expBonus * 100)}%`, 'special');
    setIsRebirthOpen(false);
  };

  // 模态框 Setters
  const modalSetters = {
    setIsInventoryOpen: (open: boolean) => setModal('isInventoryOpen', open),
    setIsCultivationOpen: (open: boolean) => setModal('isCultivationOpen', open),
    setIsCharacterOpen: (open: boolean) => setModal('isCharacterOpen', open),
    setIsAchievementOpen: (open: boolean) => setModal('isAchievementOpen', open),
    setIsPetOpen: (open: boolean) => setModal('isPetOpen', open),
    setIsLotteryOpen: (open: boolean) => setModal('isLotteryOpen', open),
    setIsSettingsOpen: (open: boolean) => setModal('isSettingsOpen', open),
    setIsRealmOpen: (open: boolean) => setModal('isRealmOpen', open),
    setIsAlchemyOpen: (open: boolean) => setModal('isAlchemyOpen', open),
    setIsSectOpen: (open: boolean) => setModal('isSectOpen', open),
    setIsMobileSidebarOpen: (open: boolean) => setModal('isMobileSidebarOpen', open),
    setIsMobileStatsOpen: (open: boolean) => setModal('isMobileStatsOpen', open),
    setIsLeaderboardOpen: (open: boolean) => setModal('isLeaderboardOpen', open),
    setIsTradeMarketOpen: (open: boolean) => setModal('isTradeMarketOpen', open),
  };

  return (
    <>
      {/* 天劫弹窗 */}
      {tribulationState && (
        <TribulationModal
          tribulationState={tribulationState}
          onTribulationComplete={handleTribulationComplete}
          player={player}
        />
      )}

      {/* 死亡弹窗 - 无法关闭 */}
      {isDead && player && (
        <DeathModal
          isOpen={isDead}
          player={player}
          battleData={deathBattleData}
          deathReason={deathReason}
          difficulty={settings.difficulty || 'normal'}
          onRebirth={handleRebirth}
          onContinue={
            settings.difficulty !== 'hard'
              ? () => {
                  setIsDead(false);
                  setDeathBattleData(null);
                  setDeathReason('');
                }
              : undefined
          }
        />
      )}

      <GameView
        player={player}
        logs={logs}
        setLogs={setLogs}
        visualEffects={visualEffects}
        loading={loading}
        cooldown={cooldown}
        purchaseSuccess={purchaseSuccess}
        lotteryRewards={lotteryRewards}
        onCloseLotteryRewards={() => setLotteryRewards([])}
        itemActionLog={itemActionLogValue}
        isMobileSidebarOpen={modals.isMobileSidebarOpen}
        isMobileStatsOpen={modals.isMobileStatsOpen}
        modals={{
          ...modals,
          ...modalSetters,
        }}
        handlers={gameViewHandlers}
        isDebugModeEnabled={modals.isDebugModeEnabled}
      />

      {/* 调试弹窗 */}
      {player && canUseDebugFeature && modals.isDebugModeEnabled && (
        <DebugModal
          isOpen={modals.isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
          player={player}
          onUpdatePlayer={(updates) => {
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, ...updates };
            });
          }}
          onTriggerDeath={() => {
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, hp: 0 };
            });
          }}
          onTriggerReputationEvent={(event) => {
            setReputationEvent(event);
            setIsReputationEventOpen(true);
          }}
          onChallengeDaoCombining={() => {
            if (adventureHandlers) {
              adventureHandlers.executeAdventure('dao_combining_challenge', undefined, '极度危险');
            }
          }}
        />
      )}

      {/* Alert 提示弹窗 */}
      {alertState && (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm}
          showCancel={alertState.showCancel}
          onCancel={alertState.onCancel}
        />
      )}

      {player && isAnyModalOpen && (
        <ModalsContainer
          player={player}
          settings={settings}
          setItemActionLog={setItemActionLog}
          autoAdventure={autoAdventure}
          handlers={modalsHandlers}
        />
      )}

      {/* 交易行弹窗 */}
      {player && (
        <AuctionHouseModal
          isOpen={modals.isTradeMarketOpen}
          onClose={() => setModal('isTradeMarketOpen', false)}
          player={player}
          items={marketItems}
          onPurchase={tradeMarketHandlers.handlePurchase}
          onRefresh={tradeMarketHandlers.handleRefresh}
          onSyncMarket={tradeMarketHandlers.handleSyncMarket}
          onListItem={tradeMarketHandlers.handleListItem}
          onCancelListing={tradeMarketHandlers.handleCancelListing}
        />
      )}

      {/* 寿元将尽预警 */}
      {player && !isDead && player.lifespan < Math.max(5, (player.maxLifespan || 100) * 0.1) && (
        <>
          <div className="lifespan-warning" />
          <div className="lifespan-warning-text animate-pulse">
            ⚠️ 寿元将尽 (剩余 {player.lifespan.toFixed(1)} 年)
          </div>
        </>
      )}

      {/* 修仙法门弹窗 */}
      {showCultivationIntro && (
        <CultivationIntroModal
          isOpen={showCultivationIntro}
          onClose={() => {
            setShowCultivationIntro(false);
            localStorage.setItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN, 'true');
          }}
        />
      )}

      {/* 自动历练配置弹窗 */}
      <AutoAdventureConfigModal
        isOpen={modals.isAutoAdventureConfigOpen}
        onClose={() => setIsAutoAdventureConfigOpen(false)}
        onConfirm={(config) => {
          setAutoAdventureConfig(config);
          setAutoAdventure(true); // 配置确认后自动开启自动历练
          setIsAutoAdventureConfigOpen(false);
        }}
        currentConfig={autoAdventureConfig}
      />

      {/* 秘境 Roguelike 地宫探索 */}
      {player && (
        <DungeonModal
          isOpen={modals.isDungeonOpen}
          onClose={() => setIsDungeonOpen(false)}
          player={player}
          setPlayer={setPlayer as any}
          addLog={(text: string, type?: string) => {
            useGameStore.getState().addLog(text, (type || 'normal') as any);
          }}
        />
      )}

      {/* NPC 人物志 */}
      {player && (
        <NPCRelationsModal
          isOpen={isRelationsOpen}
          onClose={() => setIsRelationsOpen(false)}
          player={player}
          setPlayer={setPlayer as any}
          addLog={(text: string, type?: string) => {
            useGameStore.getState().addLog(text, (type || 'normal') as any);
          }}
        />
      )}

      {/* 转世重修 */}
      {player && (
        <RebirthModal
          isOpen={isRebirthOpen}
          onClose={() => setIsRebirthOpen(false)}
          player={player}
          onRebirth={doRebirth}
        />
      )}
    </>
  );
}

