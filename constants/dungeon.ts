/**
 * 秘境 Roguelike 地宫系统
 * 多层地宫探索：每层3选1，奖励递增，风险递增
 */

import { PlayerStats, RealmType, Item } from '../types';
import { REALM_DATA, REALM_ORDER } from './realms';

// 地宫层数范围
const MIN_FLOORS = 5;
const MAX_FLOORS = 12;

// 地宫事件类型
export type DungeonEventType = 'battle' | 'treasure' | 'heal' | 'mystery' | 'merchant' | 'boss';

export interface DungeonEvent {
  type: DungeonEventType;
  title: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  icon: string;
}

export interface DungeonFloor {
  floor: number;
  events: DungeonEvent[]; // 3个事件可选
  isBossFloor: boolean;
}

export interface DungeonState {
  id: string;
  name: string;
  totalFloors: number;
  currentFloor: number;
  floors: DungeonFloor[];
  rewards: {
    exp: number;
    spiritStones: number;
    items: Item[];
  };
  isActive: boolean;
  completed: boolean;
}

// 事件生成池
const EVENT_TITLES: Record<DungeonEventType, string[]> = {
  battle: [
    '妖兽拦路', '邪修偷袭', '魔物盘踞', '古兽苏醒',
    '剑意残留', '阵法守护', '怨灵徘徊', '机关傀儡',
  ],
  treasure: [
    '灵石矿脉', '远古丹炉', '仙人遗物', '天材地宝',
    '灵草园圃', '法宝碎片', '功法残卷', '神秘宝箱',
  ],
  heal: [
    '灵泉涌现', '回春阵法', '菩提树下', '灵气漩涡',
    '仙药生长', '天降甘霖', '灵脉汇聚', '生命之泉',
  ],
  mystery: [
    '空间裂缝', '时间乱流', '仙人投影', '天道感悟',
    '因果交织', '前世记忆', '混沌之源', '命运之轮',
  ],
  merchant: [
    '游方商人', '秘境行者', '时空旅者', '仙道商贾',
    '异界来客', '古老器灵', '秘法传人', '丹道大师',
  ],
  boss: [
    '远古守护者', '秘境之主', '混沌魔兽', '堕落仙尊',
    '天劫化身', '虚空领主', '不朽战魂', '道化之灵',
  ],
};

const EVENT_RISK_DESC: Record<string, string> = {
  low: '风险较低，收益稳定',
  medium: '有一定风险，收益可观',
  high: '高风险，高回报！',
};

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成一个地宫事件
 */
function generateEvent(
  type: DungeonEventType,
  floor: number,
  player: PlayerStats
): DungeonEvent {
  const title = getRandomFromArray(EVENT_TITLES[type]);
  const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const riskIdx = Math.min(
    Math.floor((floor - 1) / 3),
    riskLevels.length - 1
  );
  const risk = riskLevels[riskIdx];

  const descPrefix = `第${floor}层 - `;
  return {
    type,
    title,
    description: `${descPrefix}${title}。${EVENT_RISK_DESC[risk]}`,
    risk,
    icon: type === 'battle' ? '⚔️' : type === 'treasure' ? '💎' : type === 'heal' ? '❤️' : type === 'mystery' ? '❓' : type === 'merchant' ? '🏪' : '👹',
  };
}

/**
 * 生成地宫（随机层数和事件）
 */
export function generateDungeon(
  player: PlayerStats,
  name?: string
): DungeonState {
  const totalFloors =
    MIN_FLOORS + Math.floor(Math.random() * (MAX_FLOORS - MIN_FLOORS + 1));

  const dungeonNames = [
    '上古遗迹', '虚空秘境', '混沌洞天', '仙人洞府',
    '天魔深渊', '龙脉秘境', '星辰古路', '太初秘境',
  ];

  const floors: DungeonFloor[] = [];
  for (let f = 1; f <= totalFloors; f++) {
    const isBossFloor = f % 5 === 0;
    const eventTypes: DungeonEventType[] = isBossFloor
      ? ['boss', 'heal', 'treasure']
      : pickRandomEventTypes(3);

    const events = eventTypes.map((type) =>
      generateEvent(type, f, player)
    );
    floors.push({ floor: f, events, isBossFloor });
  }

  return {
    id: `dungeon-${Date.now()}`,
    name: name || getRandomFromArray(dungeonNames),
    totalFloors,
    currentFloor: 0,
    floors,
    rewards: { exp: 0, spiritStones: 0, items: [] },
    isActive: true,
    completed: false,
  };
}

/**
 * 随机选择事件类型（不重复）
 */
function pickRandomEventTypes(count: number): DungeonEventType[] {
  const pool: DungeonEventType[] = [
    'battle', 'treasure', 'heal', 'mystery', 'merchant',
  ];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 解析地宫事件并返回结果
 */
export function resolveDungeonEvent(
  event: DungeonEvent,
  floor: number,
  player: PlayerStats
): {
  log: string;
  logType: string;
  expGain: number;
  spiritStoneGain: number;
  hpChange: number;
  items: Item[];
  triggeredBattle?: boolean;
  battleEnemyLevel?: number;
} {
  const realmIdx = REALM_ORDER.indexOf(player.realm);
  const baseMultiplier = Math.pow(1.5, realmIdx) * (1 + floor * 0.2);

  let expGain = 0;
  let spiritStoneGain = 0;
  let hpChange = 0;
  let items: Item[] = [];
  let log = '';
  let logType = 'normal';
  let triggeredBattle = false;

  switch (event.type) {
    case 'battle': {
      const riskMultiplier = event.risk === 'high' ? 2.0 : event.risk === 'medium' ? 1.3 : 0.8;
      expGain = Math.floor(player.maxExp * 0.15 * riskMultiplier);
      spiritStoneGain = Math.floor(100 * baseMultiplier * riskMultiplier);
      hpChange = -Math.floor(player.maxHp * (0.1 + (event.risk === 'high' ? 0.15 : 0)));
      triggeredBattle = true;
      log = `⚔️ 击败${event.title}，获得经验与灵石，但受了些伤。`;
      logType = 'danger';
      break;
    }
    case 'treasure': {
      const riskMultiplier = event.risk === 'high' ? 2.5 : event.risk === 'medium' ? 1.5 : 1.0;
      spiritStoneGain = Math.floor(200 * baseMultiplier * riskMultiplier);
      expGain = Math.floor(player.maxExp * 0.05 * riskMultiplier);
      // 高风险宝箱可能触发陷阱
      if (event.risk === 'high' && Math.random() < 0.3) {
        hpChange = -Math.floor(player.maxHp * 0.2);
        log = `💎 发现${event.title}，获得大量灵石，但不小心中了机关陷阱！`;
        logType = 'danger';
      } else {
        log = `💎 发现${event.title}，收获颇丰！`;
        logType = 'gain';
      }
      break;
    }
    case 'heal': {
      hpChange = Math.floor(player.maxHp * 0.3);
      expGain = Math.floor(player.maxExp * 0.02);
      log = `❤️ 在${event.title}处调息恢复，气血回复，心境也有所提升。`;
      logType = 'gain';
      break;
    }
    case 'mystery': {
      const roll = Math.random();
      if (roll < 0.4) {
        expGain = Math.floor(player.maxExp * 0.3);
        log = `❓ ${event.title}让你窥见大道一角，修为大进！`;
        logType = 'special';
      } else if (roll < 0.7) {
        spiritStoneGain = Math.floor(500 * baseMultiplier);
        log = `❓ ${event.title}中飘落几块极品灵石！`;
        logType = 'gain';
      } else if (roll < 0.9) {
        hpChange = -Math.floor(player.maxHp * 0.25);
        log = `❓ ${event.title}之力过于狂暴，你的神魂受到冲击...`;
        logType = 'danger';
      } else {
        expGain = Math.floor(player.maxExp * 0.5);
        spiritStoneGain = Math.floor(1000 * baseMultiplier);
        log = `❓ ${event.title}赐予你天大机缘！修为暴涨，灵石如山！`;
        logType = 'special';
      }
      break;
    }
    case 'merchant': {
      spiritStoneGain = Math.floor(300 * baseMultiplier);
      log = `🏪 遇到了${event.title}，用灵石交换了一些稀有物品，并获得额外灵石。`;
      logType = 'gain';
      break;
    }
    case 'boss': {
      expGain = Math.floor(player.maxExp * 0.5);
      spiritStoneGain = Math.floor(500 * baseMultiplier);
      hpChange = -Math.floor(player.maxHp * 0.3);
      triggeredBattle = true;
      log = `👹 激战${event.title}！虽然身受重伤，但收获巨大！`;
      logType = 'special';
      break;
    }
  }

  return {
    log,
    logType,
    expGain,
    spiritStoneGain,
    hpChange,
    items,
    triggeredBattle,
    battleEnemyLevel: triggeredBattle ? Math.ceil(floor * 1.5 + realmIdx * 3) : undefined,
  };
}
