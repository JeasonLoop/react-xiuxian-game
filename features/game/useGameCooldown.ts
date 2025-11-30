import { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';

export function useGameCooldown(player: PlayerStats | null) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Passive Regeneration logic
  useEffect(() => {
    if (!player) return;

    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c > 0) return c - 1;
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [player]);

  return { loading, setLoading, cooldown, setCooldown };
}
