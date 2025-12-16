import React from 'react';
import { PlayerStats, RealmType } from '../../types';
import { TITLES, TITLE_SET_EFFECTS, REALM_ORDER } from '../../constants';
import { calculateTitleEffects } from '../../utils/titleUtils';

interface UseCharacterHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 角色处理函数
 * 包含选择天赋、选择称号、分配属性
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @returns handleSelectTalent 选择天赋
 * @returns handleSelectTitle 选择称号
 * @returns handleAllocateAttribute 分配属性
 */
export function useCharacterHandlers({
  player,
  setPlayer,
  addLog,
}: UseCharacterHandlersProps) {
  const handleSelectTalent = (talentId: string) => {
    // 天赋在游戏开始时随机生成，之后不可修改
    addLog('天赋在游戏开始时已确定，无法修改！', 'danger');
    return;
  };

  const handleSelectTitle = (titleId: string) => {
    const title = TITLES.find((t) => t.id === titleId);
    if (!title) return;

    // 检查是否已解锁该称号
    if (!player.unlockedTitles.includes(titleId)) {
      addLog(`你尚未解锁称号【${title.name}】！`, 'danger');
      return;
    }

    setPlayer((prev) => {
      // 计算旧称号效果（包括套装效果）
      const oldEffects = calculateTitleEffects(prev.titleId, prev.unlockedTitles);

      // 计算新称号效果（包括套装效果）
      const newEffects = calculateTitleEffects(titleId, prev.unlockedTitles);

      // 应用效果差值
      const attackDiff = newEffects.attack - oldEffects.attack;
      const defenseDiff = newEffects.defense - oldEffects.defense;
      const hpDiff = newEffects.hp - oldEffects.hp;
      const spiritDiff = newEffects.spirit - oldEffects.spirit;
      const physiqueDiff = newEffects.physique - oldEffects.physique;
      const speedDiff = newEffects.speed - oldEffects.speed;
      const expRateDiff = newEffects.expRate - oldEffects.expRate;
      const luckDiff = newEffects.luck - oldEffects.luck;

      let newAttack = prev.attack + attackDiff;
      let newDefense = prev.defense + defenseDiff;
      let newMaxHp = prev.maxHp + hpDiff;
      let newHp = prev.hp + hpDiff;
      let newSpirit = prev.spirit + spiritDiff;
      let newPhysique = prev.physique + physiqueDiff;
      let newSpeed = prev.speed + speedDiff;
      let newLuck = prev.luck + luckDiff;

      let logMessage = `你装备了称号【${title.name}】！`;

      // 检查是否有套装效果
      if (title.setGroup) {
        const setEffect = TITLE_SET_EFFECTS.find(se =>
          se.titles.includes(titleId) &&
          se.titles.every(tid => prev.unlockedTitles.includes(tid))
        );
        if (setEffect) {
          logMessage += `\n✨ 激活了套装效果【${setEffect.setName}】！`;
        }
      }

      addLog(logMessage, 'special');
      return {
        ...prev,
        titleId: titleId,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(newHp, newMaxHp),
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
        luck: newLuck,
      };
    });
  };

  const handleAllocateAttribute = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer((prev) => {
      const points = prev.attributePoints - 1;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // 根据境界计算属性点加成倍数（线性增长，更平衡）
      // 基础倍数：1 + 境界索引 * 2，随境界线性增长
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      // 确保realmIndex有效，防止NaN
      const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
      const multiplier = 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍（之前是128倍）

      // 基础属性增加值
      const baseAttack = 5;
      const baseDefense = 3;
      const baseHp = 20;
      const baseSpirit = 3;
      const basePhysique = 3;
      const basePhysiqueHp = 10; // 体魄额外增加的气血
      const baseSpeed = 2;

      if (type === 'attack') {
        const gain = Math.floor(baseAttack * multiplier);
        newAttack += gain;
        addLog(`你分配了1点属性点到攻击力 (+${gain})`, 'gain');
      } else if (type === 'defense') {
        const gain = Math.floor(baseDefense * multiplier);
        newDefense += gain;
        addLog(`你分配了1点属性点到防御力 (+${gain})`, 'gain');
      } else if (type === 'hp') {
        const gain = Math.floor(baseHp * multiplier);
        newMaxHp += gain;
        newHp += gain;
        addLog(`你分配了1点属性点到气血 (+${gain})`, 'gain');
      } else if (type === 'spirit') {
        const gain = Math.floor(baseSpirit * multiplier);
        newSpirit += gain;
        addLog(`你分配了1点属性点到神识 (+${gain})`, 'gain');
      } else if (type === 'physique') {
        const physiqueGain = Math.floor(basePhysique * multiplier);
        const hpGain = Math.floor(basePhysiqueHp * multiplier);
        newPhysique += physiqueGain;
        newMaxHp += hpGain;
        newHp += hpGain;
        addLog(`你分配了1点属性点到体魄 (+${physiqueGain}体魄, +${hpGain}气血)`, 'gain');
      } else if (type === 'speed') {
        const gain = Math.floor(baseSpeed * multiplier);
        newSpeed += gain;
        addLog(`你分配了1点属性点到速度 (+${gain})`, 'gain');
      }

      return {
        ...prev,
        attributePoints: points,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
      };
    });
  };

  const handleAllocateAllAttributes = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer((prev) => {
      const pointsToAllocate = prev.attributePoints;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // 根据境界计算属性点加成倍数（线性增长，更平衡）
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      // 确保realmIndex有效，防止NaN
      const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
      const multiplier = 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍（之前是128倍）

      // 基础属性增加值
      const baseAttack = 5;
      const baseDefense = 3;
      const baseHp = 20;
      const baseSpirit = 3;
      const basePhysique = 3;
      const basePhysiqueHp = 10; // 体魄额外增加的气血
      const baseSpeed = 2;

      // 计算总增加值
      let totalGain = 0;
      let totalPhysiqueGain = 0;
      let totalHpGain = 0;

      if (type === 'attack') {
        totalGain = Math.floor(baseAttack * multiplier * pointsToAllocate);
        newAttack += totalGain;
        addLog(`你一键分配了 ${pointsToAllocate} 点属性点到攻击力 (+${totalGain})`, 'gain');
      } else if (type === 'defense') {
        totalGain = Math.floor(baseDefense * multiplier * pointsToAllocate);
        newDefense += totalGain;
        addLog(`你一键分配了 ${pointsToAllocate} 点属性点到防御力 (+${totalGain})`, 'gain');
      } else if (type === 'hp') {
        totalGain = Math.floor(baseHp * multiplier * pointsToAllocate);
        newMaxHp += totalGain;
        newHp += totalGain;
        addLog(`你一键分配了 ${pointsToAllocate} 点属性点到气血 (+${totalGain})`, 'gain');
      } else if (type === 'spirit') {
        totalGain = Math.floor(baseSpirit * multiplier * pointsToAllocate);
        newSpirit += totalGain;
        addLog(`你一键分配了 ${pointsToAllocate} 点属性点到神识 (+${totalGain})`, 'gain');
      } else if (type === 'physique') {
        totalPhysiqueGain = Math.floor(basePhysique * multiplier * pointsToAllocate);
        totalHpGain = Math.floor(basePhysiqueHp * multiplier * pointsToAllocate);
        newPhysique += totalPhysiqueGain;
        newMaxHp += totalHpGain;
        newHp += totalHpGain;
        addLog(
          `你一键分配了 ${pointsToAllocate} 点属性点到体魄 (+${totalPhysiqueGain}体魄, +${totalHpGain}气血)`,
          'gain'
        );
      } else if (type === 'speed') {
        totalGain = Math.floor(baseSpeed * multiplier * pointsToAllocate);
        newSpeed += totalGain;
        addLog(`你一键分配了 ${pointsToAllocate} 点属性点到速度 (+${totalGain})`, 'gain');
      }

      return {
        ...prev,
        attributePoints: 0,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
      };
    });
  };

  const handleResetAttributes = () => {
    if (!player) return;

    // 计算重置成本：每点已分配属性点需要100灵石
    const allocatedPoints = 0; // 这里需要追踪已分配的属性点，暂时设为0
    const cost = allocatedPoints * 100;

    if (player.spiritStones < cost) {
      addLog(`重置属性需要 ${cost} 灵石，你的灵石不足！`, 'danger');
      return;
    }

    // 暂时提示功能未完全实现
    addLog('属性重置功能需要追踪已分配属性点，暂时未完全实现。', 'danger');
  };

  return {
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleResetAttributes,
  };
}
