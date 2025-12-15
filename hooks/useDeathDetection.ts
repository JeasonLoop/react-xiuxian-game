/**
 * 死亡检测 Hook
 * 处理玩家死亡检测、保命装备、死亡惩罚等逻辑
 */
import React from 'react';
import { useEffect } from 'react';
import { PlayerStats, Item, EquipmentSlot, GameSettings } from '../types';
import { BattleReplay } from '../services/battleService';
import { SAVE_KEY } from '../utils/gameUtils';

interface UseDeathDetectionParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
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
}: UseDeathDetectionParams) {
  useEffect(() => {
    if (!player || isDead) return;

    // 检测寿命归零（老死）
    if (player.lifespan !== undefined && player.lifespan <= 0) {
      addLog('⏰ 你的寿命已尽，寿终正寝 还是无缘窥探大道...', 'danger');

      if (settings.difficulty === 'hard') {
        // 困难模式：死亡惩罚
        setIsDead(true);
        setPlayer((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hp: 0, // 触发死亡
          };
        });
        const reason = '你的寿命已尽，寿终正寝。';
        setDeathReason(reason);
        setDeathBattleData(null);
        localStorage.removeItem(SAVE_KEY);
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

        const reason = '你的寿命已尽，寿终正寝。但天道的仁慈让你得以重生，继续你的修仙之路。';
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
        // 困难模式：清除存档
        setIsDead(true);
        setDeathBattleData(lastBattleReplay);
        localStorage.removeItem(SAVE_KEY);

        setIsBattleModalOpen(false);

        let reason = '';
        if (lastBattleReplay && !lastBattleReplay.victory) {
          reason = `在与${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}的战斗中，你力竭而亡。`;
        } else if (lastBattleReplay) {
          reason = `虽然战胜了${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}，但你伤势过重，最终不治身亡。`;
        } else {
          reason = '你在历练途中遭遇不测，伤势过重，最终不治身亡。';
        }
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
        let reason = '';
        if (lastBattleReplay && !lastBattleReplay.victory) {
          reason = `在与${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}的战斗中，你力竭而亡。但你的灵魂尚未完全消散，在付出代价后得以重生。`;
        } else if (lastBattleReplay) {
          reason = `虽然战胜了${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}，但你伤势过重，最终不治身亡。但你的灵魂尚未完全消散，在付出代价后得以重生。`;
        } else {
          reason =
            '你在历练途中遭遇不测，伤势过重，最终不治身亡。但你的灵魂尚未完全消散，在付出代价后得以重生。';
        }
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
        let reason = '';
        if (lastBattleReplay && !lastBattleReplay.victory) {
          reason = `在与${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}的战斗中，你力竭而亡。但天道的仁慈让你得以重生，继续你的修仙之路。`;
        } else if (lastBattleReplay) {
          reason = `虽然战胜了${lastBattleReplay.enemy.title}${lastBattleReplay.enemy.name}，但你伤势过重，最终不治身亡。但天道的仁慈让你得以重生，继续你的修仙之路。`;
        } else {
          reason =
            '你在历练途中遭遇不测，伤势过重，最终不治身亡。但天道的仁慈让你得以重生，继续你的修仙之路。';
        }
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

