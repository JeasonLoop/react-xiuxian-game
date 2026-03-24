/**
 * App Content Component
 * 主游戏内容渲染组件
 * 从 App.tsx 中提取了所有游戏内容的渲染逻辑
 */

import React from 'react';
import { PlayerStats, TribulationState, LogEntry } from '../types';
import { BattleReplay } from '../services/battleService';
import TribulationModal from './TribulationModal';
import DeathModal from './DeathModal';
import GameView from '../views/GameView';
import DebugModal from './DebugModal';
import AlertModal from './AlertModal';
import ModalsContainer from '../views/modals/ModalsContainer';
import CultivationIntroModal from './CultivationIntroModal';
import AutoAdventureConfigModal from './AutoAdventureConfigModal';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useUIStore, useModals } from '../store/uiStore';
import { isDebugFeatureAvailable } from '../utils/debugMode';

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
    </>
  );
}

