import React from 'react';
import { PlayerStats } from '../../types';
import { TITLES } from '../../constants';

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

    setPlayer((prev) => {
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      // 移除旧称号效果
      if (prev.titleId) {
        const oldTitle = TITLES.find((t) => t.id === prev.titleId);
        if (oldTitle) {
          newAttack -= oldTitle.effects.attack || 0;
          newDefense -= oldTitle.effects.defense || 0;
          newMaxHp -= oldTitle.effects.hp || 0;
          newHp -= oldTitle.effects.hp || 0;
        }
      }

      // 应用新称号效果
      newAttack += title.effects.attack || 0;
      newDefense += title.effects.defense || 0;
      newMaxHp += title.effects.hp || 0;
      newHp += title.effects.hp || 0;

      addLog(`你装备了称号【${title.name}】！`, 'special');
      return {
        ...prev,
        titleId: titleId,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(newHp, newMaxHp),
      };
    });
  };

  const handleAllocateAttribute = (type: 'attack' | 'defense' | 'hp') => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer((prev) => {
      const points = prev.attributePoints - 1;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      if (type === 'attack') {
        newAttack += 5;
        addLog('你分配了1点属性点到攻击力 (+5)', 'gain');
      } else if (type === 'defense') {
        newDefense += 3;
        addLog('你分配了1点属性点到防御力 (+3)', 'gain');
      } else if (type === 'hp') {
        newMaxHp += 20;
        newHp += 20;
        addLog('你分配了1点属性点到气血 (+20)', 'gain');
      }

      return {
        ...prev,
        attributePoints: points,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
      };
    });
  };

  return {
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
  };
}
