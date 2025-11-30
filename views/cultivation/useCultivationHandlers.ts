import React from 'react';
import { PlayerStats, CultivationArt } from '../../types';

interface UseCultivationHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 功法处理函数
 * 包含领悟功法、激活功法
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleLearnArt 领悟功法
 * @returns handleActivateArt 激活功法
 */

export function useCultivationHandlers({
  player,
  setPlayer,
  addLog,
}: UseCultivationHandlersProps) {
  const handleLearnArt = (art: CultivationArt) => {
    if (!player || player.spiritStones < art.cost) return;

    setPlayer((prev) => {
      const newStones = prev.spiritStones - art.cost;

      const newAttack = prev.attack + (art.effects.attack || 0);
      const newDefense = prev.defense + (art.effects.defense || 0);
      const newMaxHp = prev.maxHp + (art.effects.hp || 0);
      const newHp = prev.hp + (art.effects.hp || 0);

      const newArts = [...prev.cultivationArts, art.id];

      let newActiveId = prev.activeArtId;
      if (!newActiveId && art.type === 'mental') {
        newActiveId = art.id;
      }

      return {
        ...prev,
        spiritStones: newStones,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        cultivationArts: newArts,
        activeArtId: newActiveId,
      };
    });

    addLog(`你成功领悟了功法【${art.name}】！实力大增。`, 'gain');
  };

  const handleActivateArt = (art: CultivationArt) => {
    if (art.type !== 'mental') return;
    setPlayer((prev) => ({ ...prev, activeArtId: art.id }));
    addLog(`你开始运转心法【${art.name}】。`, 'normal');
  };

  return {
    handleLearnArt,
    handleActivateArt,
  };
}
