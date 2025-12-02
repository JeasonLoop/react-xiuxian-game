import React from 'react';
import { PlayerStats, CultivationArt } from '../../types';
import { SECTS } from '../../constants';

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
    if (!player || player.spiritStones < art.cost) {
      addLog('灵石不足！', 'danger');
      return;
    }

    // 检查宗门要求
    if (art.sectId !== null && art.sectId !== undefined) {
      if (player.sectId !== art.sectId) {
        const sect = SECTS.find((s) => s.id === art.sectId);
        const sectName = sect ? sect.name : art.sectId;
        addLog(`该功法为【${sectName}】专属功法，你无法学习。`, 'danger');
        return;
      }
    }

    // 检查属性要求
    if (art.attributeRequirements) {
      const reqs = art.attributeRequirements;
      if (reqs.attack && player.attack < reqs.attack) {
        addLog(`学习该功法需要攻击力达到 ${reqs.attack}，你当前攻击力为 ${player.attack}。`, 'danger');
        return;
      }
      if (reqs.defense && player.defense < reqs.defense) {
        addLog(`学习该功法需要防御力达到 ${reqs.defense}，你当前防御力为 ${player.defense}。`, 'danger');
        return;
      }
      if (reqs.spirit && player.spirit < reqs.spirit) {
        addLog(`学习该功法需要神识达到 ${reqs.spirit}，你当前神识为 ${player.spirit}。`, 'danger');
        return;
      }
      if (reqs.physique && player.physique < reqs.physique) {
        addLog(`学习该功法需要体魄达到 ${reqs.physique}，你当前体魄为 ${player.physique}。`, 'danger');
        return;
      }
      if (reqs.speed && player.speed < reqs.speed) {
        addLog(`学习该功法需要速度达到 ${reqs.speed}，你当前速度为 ${player.speed}。`, 'danger');
        return;
      }
    }

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
