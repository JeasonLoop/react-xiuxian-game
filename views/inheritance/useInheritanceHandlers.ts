import React from 'react';
import { PlayerStats, RealmType } from '../../types';
import { INHERITANCE_ROUTES, INHERITANCE_SKILLS, REALM_ORDER } from '../../constants';
import { showConfirm, showError } from '../../utils/toastUtils';

interface UseInheritanceHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * 传承处理函数
 * 包含选择传承路线、学习技能、修炼传承
 */
export function useInheritanceHandlers({
  player,
  setPlayer,
  addLog,
}: UseInheritanceHandlersProps) {
  /**
   * 选择传承路线
   */
  const handleSelectInheritanceRoute = (routeId: string) => {
    if (player.inheritanceRoute) {
      showError('你已经选择了传承路线，无法更改！');
      return;
    }

    const route = INHERITANCE_ROUTES.find(r => r.id === routeId);
    if (!route) return;

    // 检查解锁条件
    if (route.unlockRequirement?.realm) {
      const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
      const requiredRealmIndex = REALM_ORDER.indexOf(route.unlockRequirement.realm);
      if (playerRealmIndex < requiredRealmIndex) {
        showError(`需要达到 ${route.unlockRequirement.realm} 境界才能选择此传承。`);
        return;
      }
    }

    showConfirm(
      `确定要选择【${route.name}】传承吗？选择后无法更改。\n\n${route.description}`,
      '确认选择传承',
      () => {
        setPlayer((prev) => {
          // 应用基础传承效果
          const routeEffects = route.baseEffects;
          let newAttack = prev.attack + (routeEffects.attack || 0);
          let newDefense = prev.defense + (routeEffects.defense || 0);
          let newMaxHp = prev.maxHp + (routeEffects.hp || 0);
          let newHp = prev.hp + (routeEffects.hp || 0);
          let newSpirit = prev.spirit + (routeEffects.spirit || 0);
          let newPhysique = prev.physique + (routeEffects.physique || 0);
          let newSpeed = prev.speed + (routeEffects.speed || 0);

          addLog(`✨ 你选择了【${route.name}】传承！`, 'special');
          if (routeEffects.attack) {
            addLog(`攻击力 +${routeEffects.attack}`, 'gain');
          }
          if (routeEffects.defense) {
            addLog(`防御力 +${routeEffects.defense}`, 'gain');
          }
          if (routeEffects.hp) {
            addLog(`气血 +${routeEffects.hp}`, 'gain');
          }

          return {
            ...prev,
            inheritanceRoute: routeId,
            attack: newAttack,
            defense: newDefense,
            maxHp: newMaxHp,
            hp: Math.min(newHp, newMaxHp),
            spirit: newSpirit,
            physique: newPhysique,
            speed: newSpeed,
          };
        });
      }
    );
  };

  /**
   * 学习传承技能
   */
  const handleLearnInheritanceSkill = (skillId: string) => {
    if (!player.inheritanceRoute) {
      showError('请先选择传承路线！');
      return;
    }

    const skill = INHERITANCE_SKILLS.find(s => s.id === skillId);
    if (!skill || skill.route !== player.inheritanceRoute) {
      showError('技能不存在或不属于当前传承路线！');
      return;
    }

    if (player.inheritanceSkills?.includes(skillId)) {
      showError('你已经学会了这个技能！');
      return;
    }

    if (player.inheritanceLevel < skill.unlockLevel) {
      showError(`需要传承等级 ${skill.unlockLevel} 才能学习此技能。当前等级：${player.inheritanceLevel}`);
      return;
    }

    // 学习技能需要消耗传承经验
    const skillCost = skill.unlockLevel * 100; // 每个等级需要100经验
    if (player.inheritanceExp < skillCost) {
      showError(`学习此技能需要 ${skillCost} 传承经验，当前只有 ${player.inheritanceExp}。`);
      return;
    }

    showConfirm(
      `确定要学习【${skill.name}】吗？\n\n消耗：${skillCost} 传承经验\n\n${skill.description}`,
      '确认学习技能',
      () => {
        setPlayer((prev) => {
          // 应用技能效果
          const skillEffects = skill.effects;
          let newAttack = prev.attack + (skillEffects.attack || 0);
          let newDefense = prev.defense + (skillEffects.defense || 0);
          let newMaxHp = prev.maxHp + (skillEffects.hp || 0);
          let newHp = prev.hp + (skillEffects.hp || 0);
          let newSpirit = prev.spirit + (skillEffects.spirit || 0);
          let newPhysique = prev.physique + (skillEffects.physique || 0);
          let newSpeed = prev.speed + (skillEffects.speed || 0);

          addLog(`✨ 你学会了【${skill.name}】！`, 'special');
          if (skillEffects.attack) {
            addLog(`攻击力 +${skillEffects.attack}`, 'gain');
          }
          if (skillEffects.defense) {
            addLog(`防御力 +${skillEffects.defense}`, 'gain');
          }
          if (skillEffects.hp) {
            addLog(`气血 +${skillEffects.hp}`, 'gain');
          }

          return {
            ...prev,
            inheritanceSkills: [...(prev.inheritanceSkills || []), skillId],
            inheritanceExp: prev.inheritanceExp - skillCost,
            attack: newAttack,
            defense: newDefense,
            maxHp: newMaxHp,
            hp: Math.min(newHp, newMaxHp),
            spirit: newSpirit,
            physique: newPhysique,
            speed: newSpeed,
          };
        });
      }
    );
  };

  /**
   * 修炼传承（消耗资源提升传承等级和经验）
   */
  const handleCultivateInheritance = (cultivationType: 'level' | 'exp') => {
    if (!player.inheritanceRoute) {
      showError('请先选择传承路线！');
      return;
    }

    if (cultivationType === 'level') {
      // 提升传承等级
      if (player.inheritanceLevel >= 4) {
        showError('传承等级已达到上限！');
        return;
      }

      const levelCost = (player.inheritanceLevel + 1) * 5000; // 每级需要5000灵石
      if (player.spiritStones < levelCost) {
        showError(`提升传承等级需要 ${levelCost} 灵石，当前只有 ${player.spiritStones}。`);
        return;
      }

      showConfirm(
        `确定要提升传承等级吗？\n\n当前等级：${player.inheritanceLevel}\n目标等级：${player.inheritanceLevel + 1}\n消耗：${levelCost} 灵石`,
        '确认提升传承等级',
        () => {
          setPlayer((prev) => {
            addLog(`✨ 传承等级提升至 ${prev.inheritanceLevel + 1}！`, 'special');
            return {
              ...prev,
              inheritanceLevel: prev.inheritanceLevel + 1,
              spiritStones: prev.spiritStones - levelCost,
            };
          });
        }
      );
    } else {
      // 提升传承经验
      const expGain = 100; // 每次修炼获得100经验
      const expCost = 1000; // 每次修炼消耗1000灵石

      if (player.spiritStones < expCost) {
        showError(`修炼传承需要 ${expCost} 灵石，当前只有 ${player.spiritStones}。`);
        return;
      }

      setPlayer((prev) => {
        addLog(`✨ 传承经验 +${expGain}（当前：${prev.inheritanceExp + expGain}）`, 'gain');
        return {
          ...prev,
          inheritanceExp: prev.inheritanceExp + expGain,
          spiritStones: prev.spiritStones - expCost,
        };
      });
    }
  };

  return {
    handleSelectInheritanceRoute,
    handleLearnInheritanceSkill,
    handleCultivateInheritance,
  };
}

