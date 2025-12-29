/**
 * 宗门系统相关常量
 */

import { RealmType, SectRank, SecretRealm, Item, ItemType } from '../types';

export type SectGrade = '天' | '地' | '玄' | '黄'; // 宗门等级：天最高，黄最低

export interface SectInfo {
  id: string;
  name: string;
  description: string;
  reqRealm: RealmType;
  grade: SectGrade; // 宗门等级
  exitCost?: {
    // 安全退出宗门的代价
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
}

export const SECTS: SectInfo[] = [
  {
    id: 'sect-cloud',
    name: '云灵宗',
    description: '正道大宗，门风清正，适合大部分修士。',
    reqRealm: RealmType.QiRefining,
    grade: '玄',
    exitCost: {
      spiritStones: 500,
      items: [{ name: '聚灵草', quantity: 10 }],
    },
  },
  {
    id: 'sect-fire',
    name: '烈阳宗',
    description: '坐落于火山之上，专修火法，行事霸道。',
    reqRealm: RealmType.Foundation,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '炼器石', quantity: 20 }],
    },
  },
  {
    id: 'sect-sword',
    name: '万剑门',
    description: '一剑破万法。门徒皆为剑痴，攻击力极强。',
    reqRealm: RealmType.Foundation,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '精铁', quantity: 15 }],
    },
  },
  {
    id: 'sect-temple',
    name: '天音寺',
    description: '佛门圣地，慈悲为怀，防御力出众。',
    reqRealm: RealmType.QiRefining,
    grade: '玄',
    exitCost: {
      spiritStones: 500,
      items: [{ name: '止血草', quantity: 10 }],
    },
  },
  {
    id: 'sect-taoist',
    name: '太虚观',
    description: '道门正统，修炼速度极快。',
    reqRealm: RealmType.Foundation,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '聚灵草', quantity: 15 }],
    },
  },
  {
    id: 'sect-blood',
    name: '血魔宗',
    description: '魔道宗门，行事狠辣，但实力强大。',
    reqRealm: RealmType.GoldenCore,
    grade: '天',
    exitCost: {
      spiritStones: 10000,
      items: [{ name: '妖兽内丹', quantity: 5 }],
    },
  },
  {
    id: 'sect-lotus',
    name: '青莲剑派',
    description: '剑修圣地，剑法精妙。',
    reqRealm: RealmType.Foundation,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '精铁', quantity: 15 }],
    },
  },
  {
    id: 'sect-xuantian',
    name: '玄天宗',
    description: '正道大宗，底蕴深厚。',
    reqRealm: RealmType.GoldenCore,
    grade: '天',
    exitCost: {
      spiritStones: 10000,
      items: [{ name: '千年人参', quantity: 3 }],
    },
  },
  {
    id: 'sect-jiuyou',
    name: '九幽门',
    description: '魔道宗门，阴险狡诈。',
    reqRealm: RealmType.GoldenCore,
    grade: '天',
    exitCost: {
      spiritStones: 10000,
      items: [{ name: '妖兽内丹', quantity: 5 }],
    },
  },
  {
    id: 'sect-star',
    name: '星辰阁',
    description: '神秘组织，掌握星辰之力。',
    reqRealm: RealmType.NascentSoul,
    grade: '天',
    exitCost: {
      spiritStones: 50000,
      items: [{ name: '星辰石', quantity: 10 }],
    },
  },
  {
    id: 'sect-dragon',
    name: '龙族圣地',
    description: '龙族后裔建立的宗门，血脉强大。',
    reqRealm: RealmType.NascentSoul,
    grade: '天',
    exitCost: {
      spiritStones: 50000,
      items: [{ name: '龙鳞果', quantity: 5 }],
    },
  },
  {
    id: 'sect-phoenix',
    name: '凤凰宫',
    description: '凤凰血脉传承，涅槃重生。',
    reqRealm: RealmType.NascentSoul,
    grade: '天',
    exitCost: {
      spiritStones: 50000,
      items: [{ name: '九叶芝草', quantity: 3 }],
    },
  },
  {
    id: 'sect-thunder',
    name: '雷神殿',
    description: '专修雷法，攻击力极强。',
    reqRealm: RealmType.GoldenCore,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '炼器石', quantity: 20 }],
    },
  },
  {
    id: 'sect-ice',
    name: '冰魄宗',
    description: '冰属性修士的圣地，防御力强。',
    reqRealm: RealmType.Foundation,
    grade: '黄',
    exitCost: {
      spiritStones: 300,
      items: [{ name: '聚灵草', quantity: 5 }],
    },
  },
  {
    id: 'sect-poison',
    name: '毒王谷',
    description: '毒修聚集地，擅长用毒。',
    reqRealm: RealmType.Foundation,
    grade: '黄',
    exitCost: {
      spiritStones: 300,
      items: [{ name: '止血草', quantity: 5 }],
    },
  },
  {
    id: 'sect-illusion',
    name: '幻月门',
    description: '幻术宗门，擅长迷惑敌人。',
    reqRealm: RealmType.Foundation,
    grade: '黄',
    exitCost: {
      spiritStones: 300,
      items: [{ name: '聚灵草', quantity: 5 }],
    },
  },
  {
    id: 'sect-diamond',
    name: '金刚寺',
    description: '体修宗门，肉身强大。',
    reqRealm: RealmType.QiRefining,
    grade: '玄',
    exitCost: {
      spiritStones: 500,
      items: [{ name: '炼器石', quantity: 10 }],
    },
  },
  {
    id: 'sect-yinyang',
    name: '阴阳教',
    description: '阴阳调和，攻防兼备。',
    reqRealm: RealmType.GoldenCore,
    grade: '地',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: '聚灵草', quantity: 15 }],
    },
  },
];

// 宗主挑战要求与奖励
export const SECT_MASTER_CHALLENGE_REQUIREMENTS = {
  minRealm: RealmType.NascentSoul, // 需要元婴期
  minContribution: 10000, // 需要10000宗门贡献
  challengeCost: {
    spiritStones: 50000, // 挑战需要50000灵石
  },
  victoryReward: {
    exp: 50000, // 胜利获得50000修为
    spiritStones: 100000, // 胜利获得100000灵石
  },
  defeatPenalty: {
    expLoss: 10000, // 失败扣除10000修为
    contributionLoss: 2000, // 失败扣除2000宗门贡献
    hpLossPercent: 0.3, // 失败额外扣除30%当前气血
  },
};

// 宗门晋升基础奖励
export const SECT_PROMOTION_BASE_REWARDS: Record<SectRank, {
  exp: number;
  spiritStones: number;
  contribution: number;
}> = {
  [SectRank.Outer]: {
    exp: 0,
    spiritStones: 0,
    contribution: 0,
  },
  [SectRank.Inner]: {
    exp: 100,
    spiritStones: 50,
    contribution: 100,
  },
  [SectRank.Core]: {
    exp: 500,
    spiritStones: 200,
    contribution: 500,
  },
  [SectRank.Elder]: {
    exp: 2000,
    spiritStones: 1000,
    contribution: 2000,
  },
  [SectRank.Leader]: {
    exp: 10000,
    spiritStones: 50000,
    contribution: 5000,
  },
};

// 宗门特殊奖励（按宗门ID和职位）
export const SECT_SPECIAL_REWARDS: Record<string, Partial<Record<SectRank, {
  items: Array<{ name: string; quantity: number }>;
}>>> = {
  // 可以在这里为特定宗门添加特殊奖励
  // 例如：
  // 'sect-cloud': {
  //   [SectRank.Leader]: {
  //     items: [{ name: '云灵宗传承', quantity: 1 }],
  //   },
  // },
};

// 宗门职位晋升要求
export const SECT_RANK_REQUIREMENTS: Record<SectRank, {
  contribution: number;
  realmIndex: number;
}> = {
  [SectRank.Outer]: {
    contribution: 0, // 初始职位，无要求
    realmIndex: 0, // 炼气期
  },
  [SectRank.Inner]: {
    contribution: 100, // 需要100贡献
    realmIndex: 0, // 炼气期
  },
  [SectRank.Core]: {
    contribution: 500, // 需要500贡献
    realmIndex: 1, // 筑基期
  },
  [SectRank.Elder]: {
    contribution: 2000, // 需要2000贡献
    realmIndex: 2, // 金丹期
  },
  [SectRank.Leader]: {
    contribution: 10000, // 需要10000贡献（通过挑战获得）
    realmIndex: 3, // 元婴期
  },
};

// 宗门职位显示数据
export const SECT_RANK_DATA: Record<SectRank, {
  title: string;
  description?: string;
}> = {
  [SectRank.Outer]: {
    title: '外门弟子',
    description: '宗门最基础的职位',
  },
  [SectRank.Inner]: {
    title: '内门弟子',
    description: '宗门核心弟子',
  },
  [SectRank.Core]: {
    title: '真传弟子',
    description: '宗门重点培养的弟子',
  },
  [SectRank.Elder]: {
    title: '长老',
    description: '宗门高层管理者',
  },
  [SectRank.Leader]: {
    title: '宗主',
    description: '宗门之主',
  },
};

export const SECT_SHOP_ITEMS: {
  name: string;
  cost: number;
  item: Omit<Item, 'id'>;
}[] = [
  {
    name: '炼器石',
    cost: 10,
    item: {
      name: '炼器石',
      type: ItemType.Material,
      description: '用于强化法宝的基础材料。',
      quantity: 1,
      rarity: '普通',
    },
  },
  {
    name: '聚气丹',
    cost: 20,
    item: {
      name: '聚气丹',
      type: ItemType.Pill,
      description: '短时间内大幅提升修炼速度。',
      quantity: 1,
      rarity: '普通',
      effect: { exp: 50 },
    },
  },
  {
    name: '紫猴花',
    cost: 50,
    item: {
      name: '紫猴花',
      type: ItemType.Herb,
      description: '炼制洗髓丹的材料，生长在悬崖峭壁。',
      quantity: 1,
      rarity: '稀有',
    },
  },
  {
    name: '洗髓丹',
    cost: 100,
    item: {
      name: '洗髓丹',
      type: ItemType.Pill,
      description: '强身健体，略微提升最大气血。',
      quantity: 1,
      rarity: '稀有',
      effect: { hp: 50 },
    },
  },
  {
    name: '筑基丹',
    cost: 1000,
    item: {
      name: '筑基丹',
      type: ItemType.Pill,
      description: '增加突破到筑基期的几率。',
      quantity: 1,
      rarity: '传说',
      effect: { exp: 500 },
    },
  },
  {
    name: '高阶妖丹',
    cost: 500,
    item: {
      name: '高阶妖丹',
      type: ItemType.Material,
      description: '强大妖兽的内丹，灵气逼人。',
      quantity: 1,
      rarity: '稀有',
    },
  },
];
