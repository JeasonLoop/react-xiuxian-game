import React from 'react';
import { PlayerStats, CultivationArt, RealmType } from '../../types';
import { SECTS, REALM_ORDER } from '../../constants';
import { showError, showWarning } from '../../utils/toastUtils';

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
    if (!player) {
      showError('玩家数据不存在！', '错误');
      addLog('玩家数据不存在！', 'danger');
      return;
    }

    // 检查是否已经学习过
    if (player.cultivationArts.includes(art.id)) {
      showWarning(`你已经学习过功法【${art.name}】了！`, '无法学习');
      addLog(`你已经学习过功法【${art.name}】了！`, 'danger');
      return;
    }

    if (player.spiritStones < art.cost) {
      showError(`灵石不足！\n需要 ${art.cost} 灵石，你当前只有 ${player.spiritStones} 灵石。`, '灵石不足');
      addLog('灵石不足！', 'danger');
      return;
    }

    // 检查境界要求
    const getRealmIndex = (realm: RealmType) => REALM_ORDER.indexOf(realm);
    if (getRealmIndex(player.realm) < getRealmIndex(art.realmRequirement)) {
      showWarning(
        `学习该功法需要达到【${art.realmRequirement}】境界。\n你当前境界为【${player.realm}】。`,
        '境界不足'
      );
      addLog(`学习该功法需要达到【${art.realmRequirement}】境界，你当前境界为【${player.realm}】。`, 'danger');
      return;
    }

    // 检查宗门要求
    if (art.sectId !== null && art.sectId !== undefined) {
      if (player.sectId !== art.sectId) {
        const sect = SECTS.find((s) => s.id === art.sectId);
        const sectName = sect ? sect.name : art.sectId;
        showWarning(`该功法为【${sectName}】专属功法，你无法学习。`, '无法学习');
        addLog(`该功法为【${sectName}】专属功法，你无法学习。`, 'danger');
        return;
      }
    }

    // 检查属性要求
    if (art.attributeRequirements) {
      const reqs = art.attributeRequirements;
      const missingReqs: string[] = [];

      if (reqs.attack && player.attack < reqs.attack) {
        missingReqs.push(`攻击力：需要 ${reqs.attack}，当前 ${player.attack}`);
      }
      if (reqs.defense && player.defense < reqs.defense) {
        missingReqs.push(`防御力：需要 ${reqs.defense}，当前 ${player.defense}`);
      }
      if (reqs.spirit && player.spirit < reqs.spirit) {
        missingReqs.push(`神识：需要 ${reqs.spirit}，当前 ${player.spirit}`);
      }
      if (reqs.physique && player.physique < reqs.physique) {
        missingReqs.push(`体魄：需要 ${reqs.physique}，当前 ${player.physique}`);
      }
      if (reqs.speed && player.speed < reqs.speed) {
        missingReqs.push(`速度：需要 ${reqs.speed}，当前 ${player.speed}`);
      }

      if (missingReqs.length > 0) {
        const message = `学习该功法需要满足以下属性要求：\n\n${missingReqs.join('\n')}`;
        showWarning(message, '属性不足');
        // 保留原有的日志记录（只记录第一个不满足的属性）
        if (reqs.attack && player.attack < reqs.attack) {
          addLog(`学习该功法需要攻击力达到 ${reqs.attack}，你当前攻击力为 ${player.attack}。`, 'danger');
        } else if (reqs.defense && player.defense < reqs.defense) {
          addLog(`学习该功法需要防御力达到 ${reqs.defense}，你当前防御力为 ${player.defense}。`, 'danger');
        } else if (reqs.spirit && player.spirit < reqs.spirit) {
          addLog(`学习该功法需要神识达到 ${reqs.spirit}，你当前神识为 ${player.spirit}。`, 'danger');
        } else if (reqs.physique && player.physique < reqs.physique) {
          addLog(`学习该功法需要体魄达到 ${reqs.physique}，你当前体魄为 ${player.physique}。`, 'danger');
        } else if (reqs.speed && player.speed < reqs.speed) {
          addLog(`学习该功法需要速度达到 ${reqs.speed}，你当前速度为 ${player.speed}。`, 'danger');
        }
        return;
      }
    }

    setPlayer((prev) => {
      // 再次检查，防止重复学习（双重保险）
      if (prev.cultivationArts.includes(art.id)) {
        showWarning(`你已经学习过功法【${art.name}】了！`, '无法学习');
        addLog(`你已经学习过功法【${art.name}】了！`, 'danger');
        return prev;
      }

      const newStones = prev.spiritStones - art.cost;

      const newAttack = prev.attack + (art.effects.attack || 0);
      const newDefense = prev.defense + (art.effects.defense || 0);
      const newMaxHp = prev.maxHp + (art.effects.hp || 0);
      const newHp = prev.hp + (art.effects.hp || 0);

      // 确保不会重复添加
      const newArts = prev.cultivationArts.includes(art.id)
        ? prev.cultivationArts
        : [...prev.cultivationArts, art.id];

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
