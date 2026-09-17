/**
 * 灵兽远征业务服务
 */
import { PlayerStats, PetExpedition } from '../types';
import {
  EXPEDITION_LOCATIONS,
  getUnlockedExpeditionSlots,
} from '../constants/petExpedition';
import { uid } from '../utils/gameUtils';
import { addItemToInventory } from '../utils/inventoryUtils';

/**
 * 启动新的灵兽远征
 */
export function startPetExpedition(
  player: PlayerStats,
  petId: string,
  locationId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
} {
  const grotto = player.grotto;
  if (!grotto || grotto.level < 1) {
    return {
      success: false,
      message: '尚未开辟洞府，无法开启灵兽苑远征！',
      updatedPlayer: player,
    };
  }

  const pet = player.pets?.find((p) => p.id === petId);
  if (!pet) {
    return {
      success: false,
      message: '未找到指定灵兽！',
      updatedPlayer: player,
    };
  }

  const location = EXPEDITION_LOCATIONS.find((loc) => loc.id === locationId);
  if (!location) {
    return {
      success: false,
      message: '未知的探索地点！',
      updatedPlayer: player,
    };
  }

  if (pet.level < location.minPetLevel) {
    return {
      success: false,
      message: `【${pet.name}】境界未稳（当前等级 ${pet.level}），前往【${location.name}】需达到 Lv.${location.minPetLevel}！`,
      updatedPlayer: player,
    };
  }

  const currentExpeditions = grotto.petExpeditions || [];
  const maxSlots = getUnlockedExpeditionSlots(grotto.level);

  // 正在远征中（或已完成待领取的）数量
  const activeCount = currentExpeditions.filter((e) => e.status !== 'claimed').length;
  if (activeCount >= maxSlots) {
    return {
      success: false,
      message: `灵兽远征队伍已满（当前最多 ${maxSlots} 队），升级洞府可解锁更多队伍！`,
      updatedPlayer: player,
    };
  }

  // 检查灵兽是否已在远征中
  const isAlreadyBusy = currentExpeditions.some(
    (e) => e.petId === petId && e.status !== 'claimed'
  );
  if (isAlreadyBusy) {
    return {
      success: false,
      message: `【${pet.name}】正在外出远征，无法重复派遣！`,
      updatedPlayer: player,
    };
  }

  const now = Date.now();
  const newExpedition: PetExpedition = {
    id: uid(),
    petId: pet.id,
    petName: pet.name,
    locationId: location.id,
    locationName: location.name,
    startTime: now,
    duration: location.durationMs,
    endTime: now + location.durationMs,
    status: 'exploring',
  };

  const updatedPlayer: PlayerStats = {
    ...player,
    grotto: {
      ...grotto,
      petExpeditions: [...currentExpeditions, newExpedition],
    },
  };

  return {
    success: true,
    message: `【灵兽远征】你派遣【${pet.name}】前往【${location.name}】踏上寻珍之旅！`,
    updatedPlayer,
  };
}

/**
 * 刷新并检查所有远征状态，自动将到期的标记为完成并结算奖励
 */
export function checkAndUpdateExpeditions(player: PlayerStats): PlayerStats {
  const grotto = player.grotto;
  if (!grotto || !grotto.petExpeditions || grotto.petExpeditions.length === 0) {
    return player;
  }

  const now = Date.now();
  let hasChange = false;

  const updatedExpeditions = grotto.petExpeditions.map((expedition) => {
    if (expedition.status === 'exploring' && now >= expedition.endTime) {
      hasChange = true;
      const loc = EXPEDITION_LOCATIONS.find((l) => l.id === expedition.locationId);
      const pet = player.pets?.find((p) => p.id === expedition.petId);
      const petLevel = pet?.level || 1;

      const rewards = loc
        ? loc.generateRewards(petLevel)
        : { spiritStones: 500, exp: 800, items: [] };

      return {
        ...expedition,
        status: 'completed' as const,
        rewards,
      };
    }
    return expedition;
  });

  if (!hasChange) return player;

  return {
    ...player,
    grotto: {
      ...grotto,
      petExpeditions: updatedExpeditions,
    },
  };
}

/**
 * 领取远征战果
 */
export function claimPetExpedition(
  player: PlayerStats,
  expeditionId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
} {
  const grotto = player.grotto;
  if (!grotto || !grotto.petExpeditions) {
    return {
      success: false,
      message: '远征记录不存在！',
      updatedPlayer: player,
    };
  }

  const target = grotto.petExpeditions.find((e) => e.id === expeditionId);
  if (!target) {
    return {
      success: false,
      message: '远征记录不存在！',
      updatedPlayer: player,
    };
  }

  if (target.status !== 'completed' || !target.rewards) {
    return {
      success: false,
      message: '远征尚未凯旋，暂无法领取！',
      updatedPlayer: player,
    };
  }

  const { spiritStones, exp, items } = target.rewards;

  // 将奖励物品添加进玩家背包
  let newInventory = [...player.inventory];
  for (const rewardItem of items) {
    newInventory = addItemToInventory(newInventory, rewardItem);
  }

  // 移出已领取的远征项
  const remainingExpeditions = grotto.petExpeditions.filter((e) => e.id !== expeditionId);

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: player.spiritStones + spiritStones,
    exp: player.exp + exp,
    inventory: newInventory,
    grotto: {
      ...grotto,
      petExpeditions: remainingExpeditions,
    },
  };

  const itemSummary =
    items.length > 0
      ? `、获得珍宝：${items.map((i) => `${i.name}x${i.quantity || 1}`).join('，')}`
      : '';

  return {
    success: true,
    message: `【远征凯旋】灵兽【${target.petName}】自【${target.locationName}】满载而归！获得灵石 +${spiritStones.toLocaleString()}，历练修为 +${exp.toLocaleString()}${itemSummary}。`,
    updatedPlayer,
  };
}

/**
 * 提前召回远征灵兽（放弃奖励）
 */
export function recallPetExpedition(
  player: PlayerStats,
  expeditionId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
} {
  const grotto = player.grotto;
  if (!grotto || !grotto.petExpeditions) {
    return {
      success: false,
      message: '远征记录不存在！',
      updatedPlayer: player,
    };
  }

  const target = grotto.petExpeditions.find((e) => e.id === expeditionId);
  if (!target) {
    return {
      success: false,
      message: '远征记录不存在！',
      updatedPlayer: player,
    };
  }

  const remaining = grotto.petExpeditions.filter((e) => e.id !== expeditionId);

  const updatedPlayer: PlayerStats = {
    ...player,
    grotto: {
      ...grotto,
      petExpeditions: remaining,
    },
  };

  return {
    success: true,
    message: `【灵兽归苑】已提前传音召回【${target.petName}】。`,
    updatedPlayer,
  };
}
