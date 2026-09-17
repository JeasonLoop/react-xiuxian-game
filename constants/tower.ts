/**
 * 九天通天塔系统相关常量与关卡数据
 * 共有 100 层，每一层有对应的守关者、境界、战斗属性和丰厚首通奖励
 */

import { RealmType, Item, ItemType, ItemRarity, EquipmentSlot } from '../types';

export interface TowerFloorConfig {
  floor: number;
  name: string;
  guardianName: string;
  guardianTitle: string;
  realm: RealmType;
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  baseSpeed: number;
  baseSpirit: number;
  description: string;
  firstClearRewards: {
    exp: number;
    spiritStones: number;
    reforgeStones: number; // 太虚洗炼石数量
    comprehensionScrolls?: number; // 太虚悟道卷数量
    items?: Item[];
  };
}

/** 生成太虚洗炼石 */
export function createReforgeStoneItem(quantity = 1): Item {
  return {
    id: 'taixu-reforge-stone',
    name: '太虚洗炼石',
    type: ItemType.Material,
    description: '蕴含九天太虚法则的奇石，可在洞天万宝炉中重铸与洗炼法宝装备的玄妙词条。',
    quantity,
    rarity: '稀有',
  };
}

/** 生成太虚悟道卷 */
export function createComprehensionScrollItem(quantity = 1): Item {
  return {
    id: 'taixu-comprehension-scroll',
    name: '太虚悟道卷',
    type: ItemType.Material,
    description: '记载远古神通道法奥义的残卷，可用于自创神通与提升神通领悟境界。',
    quantity,
    rarity: '传说',
  };
}

// 守护者称号库
const GUARDIAN_TITLES: string[] = [
  '守塔傀儡', '天门巡卫', '九霄剑修', '荒古武侍', '太虚灵兽',
  '星宿战将', '雷劫化身', '幽冥道尊', '通天金甲', '九天玄尊'
];

// 守护者姓名称谓库
const GUARDIAN_NAMES: string[] = [
  '玄铁傀儡', '破军剑侍', '青阳道长', '赤羽妖修', '裂渊蛮王',
  '飞霜剑圣', '天魁星君', '万劫雷尊', '乾坤法王', '九霄天帝真影'
];

/**
 * 动态获取通天塔指定层的关卡数据
 */
export function getTowerFloorConfig(floor: number): TowerFloorConfig {
  const safeFloor = Math.max(1, Math.min(100, Math.floor(floor)));
  const isBossFloor = safeFloor % 10 === 0;
  const isMilestoneFloor = safeFloor % 25 === 0;

  let realm: RealmType = RealmType.QiRefining;
  let realmFactor = 1;

  if (safeFloor <= 10) {
    realm = RealmType.QiRefining;
    realmFactor = 1 + safeFloor * 0.12;
  } else if (safeFloor <= 25) {
    realm = RealmType.Foundation;
    realmFactor = 2.5 + (safeFloor - 10) * 0.25;
  } else if (safeFloor <= 45) {
    realm = RealmType.GoldenCore;
    realmFactor = 6.5 + (safeFloor - 25) * 0.45;
  } else if (safeFloor <= 65) {
    realm = RealmType.NascentSoul;
    realmFactor = 16 + (safeFloor - 45) * 1.1;
  } else if (safeFloor <= 80) {
    realm = RealmType.SpiritSevering;
    realmFactor = 40 + (safeFloor - 65) * 2.8;
  } else if (safeFloor <= 95) {
    realm = RealmType.DaoCombining;
    realmFactor = 90 + (safeFloor - 80) * 6.5;
  } else {
    realm = RealmType.LongevityRealm;
    realmFactor = 200 + (safeFloor - 95) * 20;
  }

  const titleIndex = Math.min(GUARDIAN_TITLES.length - 1, Math.floor((safeFloor - 1) / 10));
  const guardianTitle = GUARDIAN_TITLES[titleIndex];
  const nameIndex = Math.min(GUARDIAN_NAMES.length - 1, Math.floor((safeFloor - 1) / 10));
  const guardianName = isBossFloor
    ? `【镇塔道尊】${GUARDIAN_NAMES[nameIndex]}`
    : `${GUARDIAN_NAMES[nameIndex]}·分身`;

  // 基础战力属性拟合
  const bossMultiplier = isBossFloor ? 1.4 : 1.0;
  const baseAttack = Math.floor((80 + safeFloor * 28) * realmFactor * bossMultiplier);
  const baseDefense = Math.floor((50 + safeFloor * 20) * realmFactor * bossMultiplier);
  const baseHp = Math.floor((500 + safeFloor * 260) * realmFactor * bossMultiplier * 1.5);
  const baseSpeed = Math.floor(40 + safeFloor * 4.5 + (isBossFloor ? 30 : 0));
  const baseSpirit = Math.floor(60 + safeFloor * 16 * realmFactor * 0.4);

  // 首通奖励
  const expReward = Math.floor(600 * Math.pow(1.065, safeFloor) + safeFloor * 500);
  const stoneReward = Math.floor(400 * Math.pow(1.055, safeFloor) + safeFloor * 300);
  const reforgeStones = Math.max(1, Math.floor(safeFloor / 10) + (isBossFloor ? 3 : 1));
  const comprehensionScrolls = isMilestoneFloor ? Math.max(1, Math.floor(safeFloor / 25)) : (isBossFloor ? 1 : undefined);

  let extraItem: Item | undefined;
  if (safeFloor === 100) {
    extraItem = {
      id: 'tower-divine-token',
      name: '九天通天令',
      type: ItemType.Artifact,
      description: '通关九天通天塔百层极顶后天道所赐的神物，佩戴可大幅增强全属性与悟性。',
      rarity: '仙品',
      quantity: 1,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Artifact1,
      effect: {
        attack: 8888,
        defense: 6666,
        hp: 66666,
        spirit: 3333,
      },
    };
  } else if (isBossFloor) {
    extraItem = {
      id: `tower-floor-chest-${safeFloor}`,
      name: `${safeFloor}层通天宝匣`,
      type: ItemType.Artifact,
      description: `九天通天塔第 ${safeFloor} 层镇守者珍藏的秘宝匣，打开可获得大量修炼资粮。`,
      rarity: (safeFloor >= 70 ? '仙品' : safeFloor >= 40 ? '传说' : '稀有') as ItemRarity,
      quantity: 1,
    };
  }

  return {
    floor: safeFloor,
    name: `九天通天塔 第 ${safeFloor} 重天`,
    guardianName,
    guardianTitle,
    realm,
    baseAttack,
    baseDefense,
    baseHp,
    baseSpeed,
    baseSpirit,
    description: isBossFloor
      ? `此乃通天塔第 ${safeFloor} 关大圆满重地，镇塔尊者神念亲临，威势滔天！`
      : `九天通天塔第 ${safeFloor} 层，天地法则凝聚的守塔灵将正驻守于此。`,
    firstClearRewards: {
      exp: expReward,
      spiritStones: stoneReward,
      reforgeStones,
      comprehensionScrolls,
      items: extraItem ? [extraItem] : undefined,
    },
  };
}

/** 每日扫荡基准收益 */
export function calculateTowerDailySweep(highestFloor: number): {
  exp: number;
  spiritStones: number;
  reforgeStones: number;
  items: Item[];
} {
  if (highestFloor <= 0) {
    return { exp: 0, spiritStones: 0, reforgeStones: 0, items: [] };
  }

  // 扫荡收益为所通关层数累计价值的约 35%
  let totalExp = 0;
  let totalStones = 0;
  for (let f = 1; f <= highestFloor; f++) {
    totalExp += Math.floor(150 * Math.pow(1.045, f) + f * 50);
    totalStones += Math.floor(100 * Math.pow(1.04, f) + f * 35);
  }

  const reforgeStones = Math.max(1, Math.floor(highestFloor / 8));
  const items: Item[] = [createReforgeStoneItem(reforgeStones)];

  if (highestFloor >= 50 && Math.random() < 0.6) {
    items.push(createComprehensionScrollItem(1));
  }

  return {
    exp: totalExp,
    spiritStones: totalStones,
    reforgeStones,
    items,
  };
}
