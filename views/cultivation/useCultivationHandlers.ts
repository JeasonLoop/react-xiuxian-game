import React from 'react';
import { PlayerStats, CultivationArt, RealmType } from '../../types';
import { SECTS, REALM_ORDER, calculateSpiritualRootArtBonus } from '../../constants/index';
import { showError, showWarning } from '../../utils/toastUtils';
import { useGameStore } from '../../store';

interface UseCultivationHandlersProps {
  player?: PlayerStats;
  setPlayer?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog?: (message: string, type?: string) => void;
}

/**
 * 功法处理函数
 * 包含领悟功法、激活功法
 * @param props 可选的 props（向后兼容），如果不提供则从 zustand store 获取
 * @returns handleLearnArt 领悟功法
 * @returns handleActivateArt 激活功法
 */

export function useCultivationHandlers(
  props?: UseCultivationHandlersProps
) {
  // 从 zustand store 获取状态
  const storePlayer = useGameStore((state) => state.player);
  const storeSetPlayer = useGameStore((state) => state.setPlayer);
  const storeAddLog = useGameStore((state) => state.addLog);

  // 使用 props 或 store 的值（props 优先，用于向后兼容）
  const player = props?.player ?? storePlayer;
  const setPlayer = props?.setPlayer ?? storeSetPlayer;
  const addLog = props?.addLog ?? storeAddLog;
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

    // 检查是否已解锁（只有通过历练解锁的功法才能学习）
    const unlockedArts = player.unlockedArts || [];
    if (!unlockedArts.includes(art.id)) {
      showWarning(`你尚未解锁功法【${art.name}】！需要通过历练获得。`, '未解锁');
      addLog(`你尚未解锁功法【${art.name}】！需要通过历练获得。`, 'danger');
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

    // 使用函数式更新，确保状态一致性
    setPlayer((prev) => {
      // 再次检查，防止重复学习（双重保险）
      if (prev.cultivationArts.includes(art.id)) {
        // 如果已经学习过，不显示警告（可能是快速点击导致的）
        return prev;
      }

      // 再次检查解锁状态（防止状态不同步）
      const unlockedArts = prev.unlockedArts || [];
      if (!unlockedArts.includes(art.id)) {
        // 如果未解锁，不更新状态，但也不显示错误（可能状态还未同步）
        return prev;
      }

      // 再次检查灵石（防止状态不同步）
      if (prev.spiritStones < art.cost) {
        return prev;
      }

      // 再次检查境界要求（防止状态不同步）
      const getRealmIndex = (realm: RealmType) => REALM_ORDER.indexOf(realm);
      if (getRealmIndex(prev.realm) < getRealmIndex(art.realmRequirement)) {
        return prev;
      }

      // 再次检查宗门要求（防止状态不同步）
      if (art.sectId !== null && art.sectId !== undefined) {
        if (prev.sectId !== art.sectId) {
          return prev;
        }
      }

      // 再次检查属性要求（防止状态不同步）
      if (art.attributeRequirements) {
        const reqs = art.attributeRequirements;
        if (reqs.attack && prev.attack < reqs.attack) return prev;
        if (reqs.defense && prev.defense < reqs.defense) return prev;
        if (reqs.spirit && prev.spirit < reqs.spirit) return prev;
        if (reqs.physique && prev.physique < reqs.physique) return prev;
        if (reqs.speed && prev.speed < reqs.speed) return prev;
      }

      // 所有检查通过，执行学习
      const newStones = prev.spiritStones - art.cost;

      // 计算灵根加成
      const spiritualRootBonus = calculateSpiritualRootArtBonus(art, prev.spiritualRoots || {
        metal: 0,
        wood: 0,
        water: 0,
        fire: 0,
        earth: 0,
      });

      // 属性加成逻辑：体术功法永久增加属性，心法功法通过激活动态增加
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      if (art.type === 'body') {
        newAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
        newDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
        newMaxHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
        newHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
      }

      // 确保不会重复添加（再次检查，防止竞态条件）
      if (prev.cultivationArts.includes(art.id)) {
        return prev;
      }
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

    // 显示灵根加成信息
    const spiritualRootBonus = calculateSpiritualRootArtBonus(art, player.spiritualRoots || {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0,
    });

    if (art.spiritualRoot && spiritualRootBonus > 1.0) {
      const rootNames: Record<string, string> = {
        metal: '金',
        wood: '木',
        water: '水',
        fire: '火',
        earth: '土',
      };
      const bonusPercent = Math.floor((spiritualRootBonus - 1.0) * 100);
      addLog(`你成功领悟了功法【${art.name}】！由于你的${rootNames[art.spiritualRoot]}灵根，功法效果提升了${bonusPercent}%！`, 'gain');
    } else {
      addLog(`你成功领悟了功法【${art.name}】！实力大增。`, 'gain');
    }
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
