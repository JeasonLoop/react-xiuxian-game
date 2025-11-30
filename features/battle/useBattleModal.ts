import { useState, useEffect } from 'react';
import { BattleReplay } from '../../services/battleService';
import { GameSettings } from '../../types';

export function useBattleModal(settings: GameSettings) {
  const [battleReplay, setBattleReplay] = useState<BattleReplay | null>(null);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [revealedBattleRounds, setRevealedBattleRounds] = useState(0);

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

  useEffect(() => {
    if (!isBattleModalOpen || !battleReplay) return;
    if (revealedBattleRounds >= battleReplay.rounds.length) return;
    const speedMap = { slow: 1200, normal: 800, fast: 450 } as const;
    const delay = speedMap[settings.animationSpeed] || 800;
    const timer = window.setTimeout(() => {
      setRevealedBattleRounds((prev) =>
        Math.min(prev + 1, battleReplay.rounds.length)
      );
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    isBattleModalOpen,
    battleReplay,
    revealedBattleRounds,
    settings.animationSpeed,
  ]);

  return {
    battleReplay,
    isBattleModalOpen,
    revealedBattleRounds,
    openBattleModal,
    handleSkipBattleLogs,
    handleCloseBattleModal,
  };
}
