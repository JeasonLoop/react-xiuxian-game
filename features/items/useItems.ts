import { useCallback } from 'react';
import { PlayerStats, Item } from '../../types';
import { PET_TEMPLATES } from '../../constants';
import { uid } from '../../utils/gameUtils';

interface UseItemsParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
}

export function useItems({ player, setPlayer, addLog }: UseItemsParams) {
  const handleUseItem = useCallback(
    (item: Item) => {
      setPlayer((prev) => {
        if (!prev) return prev;

        const newInv = prev.inventory
          .map((i) => {
            if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
            return i;
          })
          .filter((i) => i.quantity > 0);

        const effectLogs = [];
        let newStats = { ...prev };
        let newPets = [...prev.pets];

        // 处理灵兽蛋孵化
        const isPetEgg =
          item.name.includes('蛋') ||
          item.name.toLowerCase().includes('egg') ||
          item.name.includes('灵兽蛋') ||
          item.name.includes('灵宠蛋') ||
          (item.description &&
            (item.description.includes('孵化') ||
              item.description.includes('灵宠') ||
              item.description.includes('灵兽') ||
              item.description.includes('宠物')));

        if (isPetEgg) {
          // 根据物品稀有度匹配灵宠稀有度
          const availablePets = PET_TEMPLATES.filter((t) => {
            if (item.rarity === '普通')
              return t.rarity === '普通' || t.rarity === '稀有';
            if (item.rarity === '稀有')
              return t.rarity === '稀有' || t.rarity === '传说';
            if (item.rarity === '传说')
              return t.rarity === '传说' || t.rarity === '仙品';
            if (item.rarity === '仙品') return t.rarity === '仙品';
            return true;
          });

          if (availablePets.length > 0) {
            const randomTemplate =
              availablePets[Math.floor(Math.random() * availablePets.length)];
            const newPet = {
              id: uid(),
              name: randomTemplate.name,
              species: randomTemplate.species,
              level: 1,
              exp: 0,
              maxExp: 100,
              rarity: randomTemplate.rarity,
              stats: { ...randomTemplate.baseStats },
              skills: [...randomTemplate.skills],
              evolutionStage: 0,
              affection: 50,
            };
            newPets.push(newPet);
            effectLogs.push(`✨ 孵化出了灵宠【${newPet.name}】！`);
            addLog(
              `🎉 你成功孵化了${item.name}，获得了灵宠【${newPet.name}】！`,
              'special'
            );
          } else {
            effectLogs.push('但似乎什么都没有孵化出来...');
            addLog(`你尝试孵化${item.name}，但似乎什么都没有发生...`, 'normal');
          }
        }

        // 处理临时效果
        if (item.effect?.hp) {
          newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
          effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
        }
        if (item.effect?.exp) {
          newStats.exp += item.effect.exp;
          effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
        }

        // 处理永久效果
        if (item.permanentEffect) {
          const permLogs = [];
          if (item.permanentEffect.attack) {
            newStats.attack += item.permanentEffect.attack;
            permLogs.push(`攻击力永久 +${item.permanentEffect.attack}`);
          }
          if (item.permanentEffect.defense) {
            newStats.defense += item.permanentEffect.defense;
            permLogs.push(`防御力永久 +${item.permanentEffect.defense}`);
          }
          if (item.permanentEffect.spirit) {
            newStats.spirit += item.permanentEffect.spirit;
            permLogs.push(`神识永久 +${item.permanentEffect.spirit}`);
          }
          if (item.permanentEffect.physique) {
            newStats.physique += item.permanentEffect.physique;
            permLogs.push(`体魄永久 +${item.permanentEffect.physique}`);
          }
          if (item.permanentEffect.speed) {
            newStats.speed += item.permanentEffect.speed;
            permLogs.push(`速度永久 +${item.permanentEffect.speed}`);
          }
          if (item.permanentEffect.maxHp) {
            newStats.maxHp += item.permanentEffect.maxHp;
            newStats.hp += item.permanentEffect.maxHp;
            permLogs.push(`气血上限永久 +${item.permanentEffect.maxHp}`);
          }
          if (permLogs.length > 0) {
            effectLogs.push(`✨ ${permLogs.join('，')}`);
          }
        }

        // 对于非灵兽蛋的物品，显示使用日志
        if (effectLogs.length > 0 && !isPetEgg) {
          addLog(`你使用了 ${item.name}。 ${effectLogs.join(' ')}`, 'gain');
        }

        return { ...newStats, inventory: newInv, pets: newPets };
      });
    },
    [setPlayer, addLog]
  );

  const handleDiscardItem = useCallback(
    (item: Item) => {
      if (window.confirm(`确定要丢弃 ${item.name} x${item.quantity} 吗？`)) {
        setPlayer((prev) => {
          if (!prev) return prev;
          // 检查是否已装备
          const isEquipped = Object.values(prev.equippedItems).includes(
            item.id
          );
          if (isEquipped) {
            addLog('无法丢弃已装备的物品！请先卸下。', 'danger');
            return prev;
          }

          const newInv = prev.inventory.filter((i) => i.id !== item.id);
          addLog(`你丢弃了 ${item.name} x${item.quantity}。`, 'normal');
          return { ...prev, inventory: newInv };
        });
      }
    },
    [setPlayer, addLog]
  );

  return {
    handleUseItem,
    handleDiscardItem,
  };
}
