/**
 * 死亡检测 Hook
 * 处理玩家死亡检测、保命装备、死亡惩罚等逻辑
 */
import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats, Item, EquipmentSlot, GameSettings } from '../types';
import { BattleReplay } from '../services/battleService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearSaveData } from '../utils/saveManagerUtils';


/**
 * 获取战斗类型的中文描述
 */
function getAdventureTypeName(adventureType?: string): string {
  const typeMap: Record<string, string> = {
    normal: '历练',
    lucky: '奇遇',
    secret_realm: '秘境',
    sect_challenge: '宗门挑战',
    dao_combining_challenge: '天地之魄挑战',
  };
  return typeMap[adventureType || ''] || '历练';
}

/**
 * 生成具体的死亡原因
 */
function generateDetailedDeathReason(
  battleReplay: BattleReplay | null,
  difficulty: 'easy' | 'normal' | 'hard'
): string {
  if (!battleReplay) {
    const reasons = [
      '你在历练途中遭遇不测，被未知的强敌偷袭，伤势过重，最终不治身亡。',
      '你在探索秘境时，触发了古老的禁制，强大的反噬之力将你重创，最终不治身亡。',
      '你在修炼途中走火入魔，真气逆流，经脉尽断，最终不治身亡。',
      '你在历练途中遭遇天劫余波，被狂暴的天地之力撕碎，最终不治身亡。',
    ];
    const baseReason = reasons[Math.floor(Math.random() * reasons.length)];
    if (difficulty === 'hard') {
      return baseReason;
    } else if (difficulty === 'normal') {
      return `${baseReason}但你的灵魂尚未完全消散，在付出代价后得以重生。`;
    } else {
      return `${baseReason}但天道的仁慈让你得以重生，继续你的修仙之路。`;
    }
  }

  const { enemy, rounds, victory, adventureType } = battleReplay;
  const enemyName = `${enemy.title}${enemy.name}`;
  const adventureTypeName = getAdventureTypeName(adventureType);

  // 找到最后一击（导致玩家死亡的那一击）
  const lastEnemyAttack = rounds
    .filter((round) => round.attacker === 'enemy')
    .slice(-1)[0];

  // 生成具体的死亡描述
  let deathDescription = '';

  if (victory) {
    // 虽然胜利但伤势过重
    const victoryReasons = [
      `在${adventureTypeName}中，虽然你成功击败了${enemyName}，但在激烈的战斗中，你被其临死前的反扑重创，五脏六腑皆受重创，最终不治身亡。`,
      `在${adventureTypeName}中，你虽然战胜了${enemyName}，但战斗中的伤势过重，失血过多，最终力竭而亡。`,
      `在${adventureTypeName}中，虽然${enemyName}倒在了你的剑下，但你在战斗中受到的致命伤无法愈合，最终不治身亡。`,
      `在${adventureTypeName}中，你成功斩杀了${enemyName}，但自己也身负重伤，真气耗尽，最终油尽灯枯而亡。`,
    ];
    deathDescription = victoryReasons[Math.floor(Math.random() * victoryReasons.length)];
  } else {
    // 战斗失败
    if (lastEnemyAttack) {
      const isCrit = lastEnemyAttack.crit;
      const damage = lastEnemyAttack.damage;

      if (isCrit) {
        const critReasons = [
          `在${adventureTypeName}中，${enemyName}的致命一击直接贯穿了你的心脏，你当场毙命。`,
          `在${adventureTypeName}中，${enemyName}的暴击攻击击碎了你的护体真气，强大的力量瞬间摧毁了你的生机。`,
          `在${adventureTypeName}中，${enemyName}的致命一击撕裂了你的丹田，你的修为瞬间崩散，当场身死道消。`,
          `在${adventureTypeName}中，${enemyName}的暴击攻击直接命中你的要害，你连反应的机会都没有，便已魂飞魄散。`,
        ];
        deathDescription = critReasons[Math.floor(Math.random() * critReasons.length)];
      } else if (damage > 100) {
        const heavyReasons = [
          `在${adventureTypeName}中，${enemyName}的强力攻击重创了你的经脉，你无法承受如此巨大的伤害，最终力竭而亡。`,
          `在${adventureTypeName}中，${enemyName}的攻击威力巨大，你的防御被彻底击破，身受重伤，最终不治身亡。`,
          `在${adventureTypeName}中，${enemyName}的猛烈攻击让你五脏移位，伤势过重，最终不治身亡。`,
        ];
        deathDescription = heavyReasons[Math.floor(Math.random() * heavyReasons.length)];
      } else {
        const normalReasons = [
          `在${adventureTypeName}中，与${enemyName}的激战中，你逐渐力不从心，最终被其击败，力竭而亡。`,
          `在${adventureTypeName}中，${enemyName}的境界远高于你，你拼尽全力也无法抵挡，最终被其重创，不治身亡。`,
          `在${adventureTypeName}中，面对${enemyName}的强大实力，你的防御被层层击破，最终身受致命伤，不治身亡。`,
          `在${adventureTypeName}中，与${enemyName}的战斗中，你节节败退，最终被其抓住破绽，一击致命。`,
        ];
        deathDescription = normalReasons[Math.floor(Math.random() * normalReasons.length)];
      }
    } else {
      deathDescription = `在${adventureTypeName}中，与${enemyName}的战斗中，你力竭而亡。`;
    }
  }

  // 根据难度添加重生说明
  if (difficulty === 'hard') {
    return deathDescription;
  } else if (difficulty === 'normal') {
    return `${deathDescription}但你的灵魂尚未完全消散，在付出代价后得以重生。`;
  } else {
    return `${deathDescription}但天道的仁慈让你得以重生，继续你的修仙之路。`;
  }
}

interface UseDeathDetectionParams {
  player: PlayerStats | null;
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  isDead: boolean;
  setIsDead: (dead: boolean) => void;
  addLog: (message: string, type?: string) => void;
  settings: GameSettings;
  lastBattleReplay: BattleReplay | null;
  setDeathBattleData: (replay: BattleReplay | null) => void;
  setDeathReason: (reason: string) => void;
  setIsBattleModalOpen: (open: boolean) => void;
  setAutoMeditate: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * 死亡检测和处理逻辑
 */
export function useDeathDetection({
  player,
  setPlayer,
  isDead,
  setIsDead,
  addLog,
  settings,
  lastBattleReplay,
  setDeathBattleData,
  setDeathReason,
  setIsBattleModalOpen,
  setAutoMeditate,
  setAutoAdventure,
  setItemActionLog,
}: UseDeathDetectionParams) {
  useEffect(() => {
    if (!player || isDead) return;

    // 检测寿命归零（老死）
    if (player.lifespan !== undefined && player.lifespan <= 0) {
      addLog('⏰ 你的寿命已尽，寿终正寝 还是无缘窥探大道...', 'danger');

      // 生成具体的寿终正寝原因
      const lifespanReasons = [
        '你的寿命已尽，大限将至。在生命的最后时刻，你盘膝而坐，试图突破境界以延寿，但终究未能成功，最终寿终正寝。',
        '你的寿命已尽，体内的生机逐渐消散。尽管你拼尽全力想要延续生命，但天道无情，你最终还是走到了生命的尽头，寿终正寝。',
        '你的寿命已尽，岁月在你身上留下了无法磨灭的痕迹。你的修为虽高，但终究无法突破寿命的桎梏，最终寿终正寝。',
        '你的寿命已尽，体内的真元逐渐枯竭。你尝试了各种延寿之法，但都未能成功，最终在遗憾中寿终正寝。',
      ];
      const baseReason = lifespanReasons[Math.floor(Math.random() * lifespanReasons.length)];

      if (settings.difficulty === 'hard') {
        // 困难模式：死亡惩罚 - 清除本地存档
        setIsDead(true);
        setPlayer((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hp: 0, // 触发死亡
          };
        });
        setDeathReason(baseReason);
        setDeathBattleData(null);
        clearSaveData();
        setIsBattleModalOpen(false);
        setAutoMeditate(false);
        setAutoAdventure(false);
      } else {
        // 简单/普通模式：无惩罚，直接复活
        setIsDead(true);
        setPlayer((prev) => {
          if (!prev) return prev;
          const reviveHp = Math.max(1, Math.floor(prev.maxHp * 0.1));
          const reviveLifespan = Math.min(prev.maxLifespan || 100, 10);
          return {
            ...prev,
            hp: reviveHp,
            lifespan: reviveLifespan,
          };
        });

        const reason = `${baseReason}但天道的仁慈让你得以重生，继续你的修仙之路。`;
        setDeathReason(reason);
        setDeathBattleData(null);
        setIsBattleModalOpen(false);
        setAutoMeditate(false);
        setAutoAdventure(false);
      }
      return;
    }

    // 检测气血归零
    if (player.hp <= 0) {
      // 检查是否有保命装备
      let reviveItem: Item | null = null;
      let reviveSlot: EquipmentSlot | null = null;

      // 遍历所有装备槽位，查找有保命机会的装备
      for (const [slot, itemId] of Object.entries(player.equippedItems)) {
        if (!itemId) continue;
        const item = player.inventory.find((i) => i.id === itemId);
        if (item && item.reviveChances && item.reviveChances > 0) {
          reviveItem = item;
          reviveSlot = slot as EquipmentSlot;
          break;
        }
      }

      if (reviveItem && reviveSlot) {
        // 有保命装备，消耗一次保命机会并复活
        setPlayer((prev) => {
          if (!prev) return prev;

          const newInventory = prev.inventory.map((item) => {
            if (item.id === reviveItem!.id) {
              const newChances = (item.reviveChances || 0) - 1;
              addLog(
                `💫 ${item.name}的保命之力被触发！你留下一口气，从死亡边缘被拉了回来。剩余保命机会：${newChances}次`,
                'special'
              );
              if (setItemActionLog) setItemActionLog({ text: `💫 ${item.name}的保命之力被触发！你留下一口气，从死亡边缘被拉了回来。剩余保命机会：${newChances}次`, type: 'special' });
              return {
                ...item,
                reviveChances: newChances,
              };
            }
            return item;
          });

          // 如果保命机会用完了，从装备栏移除
          const updatedItem = newInventory.find((i) => i.id === reviveItem!.id);
          const newEquippedItems = { ...prev.equippedItems };
          if (
            updatedItem &&
            (!updatedItem.reviveChances || updatedItem.reviveChances <= 0)
          ) {
            delete newEquippedItems[reviveSlot!];
            addLog(`⚠️ ${reviveItem!.name}的保命之力已耗尽，自动卸下。`, 'danger');
          }

          // 复活：恢复10%最大气血
          const reviveHp = Math.max(1, Math.floor(prev.maxHp * 0.1));

          return {
            ...prev,
            inventory: newInventory,
            equippedItems: newEquippedItems,
            hp: reviveHp,
          };
        });
        return; // 不触发死亡
      }

      // 没有保命装备，根据难度模式处理死亡
      const difficulty = settings.difficulty || 'normal';

      if (difficulty === 'hard') {
        // 困难模式：清除本地存档
        setIsDead(true);
        setDeathBattleData(lastBattleReplay);
        clearSaveData();

        setIsBattleModalOpen(false);

        const reason = generateDetailedDeathReason(lastBattleReplay, 'hard');
        setDeathReason(reason);

        setAutoMeditate(false);
        setAutoAdventure(false);
      } else if (difficulty === 'normal') {
        // 普通模式：掉落部分属性和装备
        setPlayer((prev) => {
          if (!prev) return prev;

          // 随机掉落属性 10-20%
          const attributeDropPercent = 0.1 + Math.random() * 0.1;
          const attackDrop = Math.floor(prev.attack * attributeDropPercent);
          const defenseDrop = Math.floor(prev.defense * attributeDropPercent);
          const spiritDrop = Math.floor(prev.spirit * attributeDropPercent);
          const physiqueDrop = Math.floor(prev.physique * attributeDropPercent);
          const speedDrop = Math.floor(prev.speed * attributeDropPercent);
          const maxHpDrop = Math.floor(prev.maxHp * attributeDropPercent);

          // 随机掉落装备 1-3件
          const equippedItemIds = Object.values(prev.equippedItems).filter(
            Boolean
          ) as string[];
          const dropCount = Math.min(
            1 + Math.floor(Math.random() * 3),
            equippedItemIds.length
          );
          const itemsToDrop = equippedItemIds
            .sort(() => Math.random() - 0.5)
            .slice(0, dropCount);

          // 先卸载掉落的装备
          const newEquippedItems = { ...prev.equippedItems };
          itemsToDrop.forEach((itemId) => {
            const slot = Object.entries(prev.equippedItems).find(
              ([_, id]) => id === itemId
            )?.[0] as EquipmentSlot | undefined;
            if (slot) {
              delete newEquippedItems[slot];
            }
          });

          // 直接丢弃掉落的装备
          const newInventory = prev.inventory.filter(
            (item) => !itemsToDrop.includes(item.id)
          );

          // 记录掉落信息
          const dropMessages: string[] = [];
          if (attackDrop > 0) dropMessages.push(`攻击力 -${attackDrop}`);
          if (defenseDrop > 0) dropMessages.push(`防御力 -${defenseDrop}`);
          if (spiritDrop > 0) dropMessages.push(`神识 -${spiritDrop}`);
          if (physiqueDrop > 0) dropMessages.push(`体魄 -${physiqueDrop}`);
          if (speedDrop > 0) dropMessages.push(`速度 -${speedDrop}`);
          if (maxHpDrop > 0) dropMessages.push(`气血上限 -${maxHpDrop}`);

          if (itemsToDrop.length > 0) {
            const droppedItemNames = itemsToDrop
              .map((id) => prev.inventory.find((i) => i.id === id)?.name)
              .filter(Boolean)
              .join('、');
            dropMessages.push(`装备掉落：${droppedItemNames}`);
          }

          if (dropMessages.length > 0) {
            addLog(`💀 死亡惩罚：${dropMessages.join('，')}`, 'danger');
          }

          // 恢复10%最大气血
          const reviveHp = Math.max(1, Math.floor((prev.maxHp - maxHpDrop) * 0.1));

          return {
            ...prev,
            attack: Math.max(0, prev.attack - attackDrop),
            defense: Math.max(0, prev.defense - defenseDrop),
            spirit: Math.max(0, prev.spirit - spiritDrop),
            physique: Math.max(0, prev.physique - physiqueDrop),
            speed: Math.max(0, prev.speed - speedDrop),
            maxHp: Math.max(1, prev.maxHp - maxHpDrop),
            hp: reviveHp,
            inventory: newInventory,
            equippedItems: newEquippedItems,
          };
        });

        // 生成死亡原因
        const reason = generateDetailedDeathReason(lastBattleReplay, 'normal');
        setDeathReason(reason);
        setIsDead(true);
        setDeathBattleData(lastBattleReplay);
        setIsBattleModalOpen(false);
        setAutoMeditate(false);
        setAutoAdventure(false);
      } else {
        // 简单模式：无惩罚，直接复活
        setPlayer((prev) => {
          if (!prev) return prev;
          const reviveHp = Math.max(1, Math.floor(prev.maxHp * 0.1));
          return {
            ...prev,
            hp: reviveHp,
          };
        });

        // 生成死亡原因
        const reason = generateDetailedDeathReason(lastBattleReplay, 'easy');
        setDeathReason(reason);
        setIsDead(true);
        setDeathBattleData(lastBattleReplay);
        setIsBattleModalOpen(false);
        setAutoMeditate(false);
        setAutoAdventure(false);
      }
    }
  }, [
    player?.hp,
    player?.lifespan,
    isDead,
    lastBattleReplay,
    addLog,
    settings.difficulty,
    setIsBattleModalOpen,
    setAutoMeditate,
    setAutoAdventure,
    setPlayer,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
  ]);
}

