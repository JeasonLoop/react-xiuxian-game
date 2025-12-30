/**
 * App Content Component
 * 主游戏内容渲染组件
 * 从 App.tsx 中提取了所有游戏内容的渲染逻辑
 */

import React from 'react';
import { PlayerStats, TribulationState } from '../types';
import { SaveData } from '../utils/saveManagerUtils';
import { BattleReplay } from '../services/battleService';
import TribulationModal from './TribulationModal';
import DeathModal from './DeathModal';
import GameView from '../views/GameView';
import DebugModal from './DebugModal';
import AlertModal from './AlertModal';
import SaveManagerModal from './SaveManagerModal';
import SaveCompareModal from './SaveCompareModal';
import ModalsContainer from '../views/modals/ModalsContainer';
import CultivationIntroModal from './CultivationIntroModal';
import { ensurePlayerStatsCompatibility } from '../utils/saveManagerUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface AppContentProps {
  // 玩家数据
  player: PlayerStats;

  // 游戏状态
  logs: Array<{ message: string; type?: string; timestamp: number }>;
  setLogs: React.Dispatch<React.SetStateAction<Array<{ message: string; type?: string; timestamp: number }>>>;
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
  isSaveManagerOpen: boolean;
  isSaveCompareOpen: boolean;
  compareSave1: SaveData | null;
  compareSave2: SaveData | null;
  isAnyModalOpen: boolean;
  isDebugModeEnabled: boolean;
  isDebugOpen: boolean;

  // 通知状态
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
  itemActionLogValue: { text: string; type: string } | null;

  // 自动功能状态
  autoAdventure: boolean;

  // 模态框状态
  modals: {
    isInventoryOpen: boolean;
    isCultivationOpen: boolean;
    isAlchemyOpen: boolean;
    isUpgradeOpen: boolean;
    isSectOpen: boolean;
    isRealmOpen: boolean;
    isCharacterOpen: boolean;
    isAchievementOpen: boolean;
    isPetOpen: boolean;
    isLotteryOpen: boolean;
    isSettingsOpen: boolean;
    isDailyQuestOpen: boolean;
    isShopOpen: boolean;
    isGrottoOpen: boolean;
    isBattleModalOpen: boolean;
    isTurnBasedBattleOpen: boolean;
    isMobileSidebarOpen: boolean;
    isMobileStatsOpen: boolean;
    isReputationEventOpen: boolean;
    isTreasureVaultOpen: boolean;
  };

  // Setters
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  setIsDead: (dead: boolean) => void;
  setDeathBattleData: (data: BattleReplay | null) => void;
  setDeathReason: (reason: string) => void;
  setShowCultivationIntro: (show: boolean) => void;
  setIsSaveManagerOpen: (open: boolean) => void;
  setIsSaveCompareOpen: (open: boolean) => void;
  setCompareSave1: (save: SaveData | null) => void;
  setCompareSave2: (save: SaveData | null) => void;
  setIsDebugOpen: (open: boolean) => void;
  setLotteryRewards: (rewards: Array<{ type: string; name: string; quantity?: number }>) => void;
  setItemActionLog: (log: { text: string; type: string } | null) => void;
  setReputationEvent: (event: any | null) => void;
  setIsReputationEventOpen: (open: boolean) => void;

  // Handlers
  handleTribulationComplete: (result: any) => void;
  handleRebirth: () => void;
  closeAlert: () => void;
  alertState: any;
  gameViewHandlers: any;
  modalsHandlers: any;
  adventureHandlers: any;

  // Modal setters
  setIsInventoryOpen: (open: boolean) => void;
  setIsCultivationOpen: (open: boolean) => void;
  setIsCharacterOpen: (open: boolean) => void;
  setIsAchievementOpen: (open: boolean) => void;
  setIsPetOpen: (open: boolean) => void;
  setIsLotteryOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsRealmOpen: (open: boolean) => void;
  setIsAlchemyOpen: (open: boolean) => void;
  setIsSectOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsMobileStatsOpen: (open: boolean) => void;
}

/**
 * 主游戏内容组件
 */
export function AppContent(props: AppContentProps) {
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
    isSaveManagerOpen,
    isSaveCompareOpen,
    compareSave1,
    compareSave2,
    isAnyModalOpen,
    isDebugModeEnabled,
    isDebugOpen,
    purchaseSuccess,
    lotteryRewards,
    itemActionLogValue,
    autoAdventure,
    modals,
    setPlayer,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
    setShowCultivationIntro,
    setIsSaveManagerOpen,
    setIsSaveCompareOpen,
    setCompareSave1,
    setCompareSave2,
    setIsDebugOpen,
    setLotteryRewards,
    setItemActionLog,
    setReputationEvent,
    setIsReputationEventOpen,
    handleTribulationComplete,
    handleRebirth,
    closeAlert,
    alertState,
    gameViewHandlers,
    modalsHandlers,
    adventureHandlers,
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsMobileSidebarOpen,
    setIsMobileStatsOpen,
  } = props;

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
          isInventoryOpen: modals.isInventoryOpen,
          isCultivationOpen: modals.isCultivationOpen,
          isCharacterOpen: modals.isCharacterOpen,
          isAchievementOpen: modals.isAchievementOpen,
          isPetOpen: modals.isPetOpen,
          isLotteryOpen: modals.isLotteryOpen,
          isSettingsOpen: modals.isSettingsOpen,
          isRealmOpen: modals.isRealmOpen,
          isAlchemyOpen: modals.isAlchemyOpen,
          isSectOpen: modals.isSectOpen,
          setIsMobileSidebarOpen,
          setIsMobileStatsOpen,
          setIsInventoryOpen,
          setIsCultivationOpen,
          setIsCharacterOpen,
          setIsAchievementOpen,
          setIsPetOpen,
          setIsLotteryOpen,
          setIsSettingsOpen,
          setIsRealmOpen,
          setIsAlchemyOpen,
          setIsSectOpen,
        }}
        handlers={gameViewHandlers}
        isDebugModeEnabled={isDebugModeEnabled}
      />

      {/* 调试弹窗 */}
      {player && isDebugModeEnabled && (
        <DebugModal
          isOpen={isDebugOpen}
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

      {/* 存档管理器 */}
      {player && (
        <SaveManagerModal
          isOpen={isSaveManagerOpen}
          onClose={() => setIsSaveManagerOpen(false)}
          currentPlayer={player}
          currentLogs={logs}
          onLoadSave={(loadedPlayer, loadedLogs) => {
            const compatiblePlayer = ensurePlayerStatsCompatibility(loadedPlayer);
            setPlayer(compatiblePlayer);
            setLogs(loadedLogs);
          }}
          onCompareSaves={(save1, save2) => {
            setCompareSave1(save1);
            setCompareSave2(save2);
            setIsSaveCompareOpen(true);
          }}
        />
      )}

      {/* 存档对比 */}
      {compareSave1 && compareSave2 && (
        <SaveCompareModal
          isOpen={isSaveCompareOpen}
          onClose={() => {
            setIsSaveCompareOpen(false);
            setCompareSave1(null);
            setCompareSave2(null);
          }}
          save1={compareSave1}
          save2={compareSave2}
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
    </>
  );
}

