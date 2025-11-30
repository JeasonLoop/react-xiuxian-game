import React from 'react';
import { BattleReplay } from '../../services/battleService';

interface UseBattleHandlersProps {
  battleReplay: BattleReplay | null;
  setBattleReplay: React.Dispatch<React.SetStateAction<BattleReplay | null>>;
  isBattleModalOpen: boolean;
  setIsBattleModalOpen: (open: boolean) => void;
  revealedBattleRounds: number;
  setRevealedBattleRounds: (
    rounds: number | ((prev: number) => number)
  ) => void;
  animationSpeed: string;
}

/**
 * 战斗处理函数
 * 包含打开战斗模态框、跳过战斗日志、关闭战斗模态框
 * @param battleReplay 战斗回放
 * @param setBattleReplay 设置战斗回放
 * @param setIsBattleModalOpen 设置战斗模态框是否打开
 * @param setRevealedBattleRounds 设置战斗回放已揭露的回合数
 * @returns openBattleModal 打开战斗模态框
 * @returns handleSkipBattleLogs 跳过战斗日志
 * @returns handleCloseBattleModal 关闭战斗模态框
 */
export function useBattleHandlers({
  battleReplay,
  setBattleReplay,
  setIsBattleModalOpen,
  setRevealedBattleRounds,
}: UseBattleHandlersProps) {
  const openBattleModal = (replay: BattleReplay) => {
    setBattleReplay(replay);
    setIsBattleModalOpen(true);
    setRevealedBattleRounds(replay.rounds.length > 0 ? 1 : 0);
  };

  const handleSkipBattleLogs = () => {
    if (battleReplay) {
      setRevealedBattleRounds(battleReplay.rounds.length);
    }
  };

  const handleCloseBattleModal = () => {
    setIsBattleModalOpen(false);
    setBattleReplay(null);
    setRevealedBattleRounds(0);
  };

  return {
    openBattleModal,
    handleSkipBattleLogs,
    handleCloseBattleModal,
  };
}
