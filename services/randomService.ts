import { SecretRealm, RealmType } from '../types';
import { REALM_ORDER, SectInfo } from '../constants';

const randomId = () => Math.random().toString(36).slice(2, 9);

// 秘境名称池
const REALM_NAMES = [
  '万兽山脉',
  '上古剑冢',
  '雷罚炼狱',
  '幽冥洞府',
  '天火熔岩',
  '冰封雪域',
  '毒瘴沼泽',
  '幻境迷窟',
  '血海魔渊',
  '星辰遗迹',
  '龙族古墓',
  '仙灵秘境',
  '九幽深渊',
  '天劫雷池',
  '混沌虚空',
  '时光裂缝',
  '死亡峡谷',
  '神魔战场',
];

// 秘境描述池
const REALM_DESCRIPTIONS = [
  '外围相对安全，深处盘踞着可怕的妖兽。',
  '传说中上古修士的埋骨之地，剑气纵横。',
  '终年雷霆不息，稍有不慎便会灰飞烟灭。',
  '阴气森森，鬼物横行，非正道修士不可入。',
  '地火喷涌，岩浆翻滚，火属性修士的圣地。',
  '冰天雪地，寒风刺骨，水属性修士的试炼场。',
  '毒气弥漫，危险重重，但蕴藏着珍稀毒草。',
  '幻象丛生，真假难辨，考验修士的心智。',
  '魔气滔天，邪物横行，正道修士的禁地。',
  '星辰之力汇聚，神秘而强大。',
  '龙族遗迹，蕴藏着龙族传承。',
  '仙灵之气浓郁，适合修炼。',
  '九幽之地，死气沉沉。',
  '天劫之力残留，危险异常。',
  '混沌之力混乱，空间不稳定。',
  '时间之力扭曲，过去未来交错。',
  '死气弥漫，亡魂游荡。',
  '上古神魔大战的遗迹，杀气冲天。',
];

// 掉落物池
const DROP_ITEMS = [
  '妖兽材料',
  '稀有草药',
  '攻击法器',
  '剑修功法',
  '残破灵宝',
  '剑意草',
  '雷属性至宝',
  '仙品丹药材料',
  '天阶功法',
  '上古遗物',
  '灵兽内丹',
  '炼器材料',
  '符箓',
  '阵法图',
  '传承玉简',
  '仙草',
  '灵矿',
  '法宝碎片',
];

// 宗门名称池
const SECT_NAMES = [
  '云灵宗',
  '烈阳宗',
  '万剑门',
  '天音寺',
  '太虚观',
  '血魔宗',
  '青莲剑派',
  '玄天宗',
  '九幽门',
  '星辰阁',
  '龙族圣地',
  '凤凰宫',
  '雷神殿',
  '冰魄宗',
  '毒王谷',
  '幻月门',
  '金刚寺',
  '阴阳教',
];

// 宗门描述池
const SECT_DESCRIPTIONS = [
  '正道大宗，门风清正，适合大部分修士。',
  '坐落于火山之上，专修火法，行事霸道。',
  '一剑破万法。门徒皆为剑痴，攻击力极强。',
  '佛门圣地，慈悲为怀，防御力出众。',
  '道门正统，修炼速度极快。',
  '魔道宗门，行事狠辣，但实力强大。',
  '剑修圣地，剑法精妙。',
  '正道大宗，底蕴深厚。',
  '魔道宗门，阴险狡诈。',
  '神秘组织，掌握星辰之力。',
  '龙族后裔建立的宗门，血脉强大。',
  '凤凰血脉传承，涅槃重生。',
  '专修雷法，攻击力极强。',
  '冰属性修士的圣地，防御力强。',
  '毒修聚集地，擅长用毒。',
  '幻术宗门，擅长迷惑敌人。',
  '体修宗门，肉身强大。',
  '阴阳调和，攻防兼备。',
];

// 任务名称池
const TASK_NAMES = [
  '山门巡逻',
  '采集灵草',
  '猎杀妖兽',
  '护送物资',
  '清理魔物',
  '修复阵法',
  '炼制丹药',
  '探索遗迹',
  '守护灵田',
  '驱逐邪修',
  '收集材料',
  '维护法阵',
  '教导弟子',
  '炼制符箓',
  '清理洞府',
];

// 任务描述池
const TASK_DESCRIPTIONS = [
  '在宗门附近巡视，驱逐野兽，维护治安。',
  '前往灵草园采集指定数量的灵草。',
  '猎杀威胁宗门安全的妖兽。',
  '护送重要物资到指定地点。',
  '清理宗门附近的魔物。',
  '修复宗门防御阵法。',
  '为宗门炼制指定丹药。',
  '探索附近的遗迹，寻找宝物。',
  '守护宗门的灵田，防止被破坏。',
  '驱逐威胁宗门的邪修。',
  '收集宗门需要的炼器材料。',
  '维护宗门的护山大阵。',
  '指导新入门的弟子修炼。',
  '为宗门炼制符箓。',
  '清理宗门废弃的洞府。',
];

export interface RandomSectTask {
  id: string;
  name: string;
  description: string;
  type: 'patrol' | 'donate_stone' | 'donate_herb' | 'collect' | 'hunt';
  cost?: {
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  reward: {
    contribution: number;
    exp?: number;
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
  timeCost: 'instant' | 'short' | 'medium' | 'long';
}

// 生成随机秘境
export const generateRandomRealms = (
  playerRealm: RealmType,
  count: number = 6
): SecretRealm[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const realms: SecretRealm[] = [];

  for (let i = 0; i < count; i++) {
    // 随机选择境界要求（不能超过玩家境界太多）
    const maxRealmIndex = Math.min(
      playerRealmIndex + 2,
      REALM_ORDER.length - 1
    );
    const minRealmIndex = Math.max(0, playerRealmIndex - 1);
    const realmIndex =
      Math.floor(Math.random() * (maxRealmIndex - minRealmIndex + 1)) +
      minRealmIndex;
    const minRealm = REALM_ORDER[realmIndex];

    // 随机选择风险等级
    const riskLevels: ('低' | '中' | '高' | '极度危险')[] = [
      '低',
      '中',
      '高',
      '极度危险',
    ];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    // 根据风险等级和境界计算成本
    const baseCost = 50 + realmIndex * 50;
    const riskMultiplier =
      riskLevel === '低'
        ? 0.8
        : riskLevel === '中'
          ? 1
          : riskLevel === '高'
            ? 1.5
            : 2;
    const cost = Math.floor(
      baseCost * riskMultiplier * (0.9 + Math.random() * 0.2)
    );

    // 随机选择名称和描述
    const name = REALM_NAMES[Math.floor(Math.random() * REALM_NAMES.length)];
    const description =
      REALM_DESCRIPTIONS[Math.floor(Math.random() * REALM_DESCRIPTIONS.length)];

    // 随机生成掉落物（2-4个）
    const dropCount = 2 + Math.floor(Math.random() * 3);
    const drops: string[] = [];
    const usedDrops = new Set<string>();
    for (let j = 0; j < dropCount; j++) {
      let drop = DROP_ITEMS[Math.floor(Math.random() * DROP_ITEMS.length)];
      while (usedDrops.has(drop) && usedDrops.size < DROP_ITEMS.length) {
        drop = DROP_ITEMS[Math.floor(Math.random() * DROP_ITEMS.length)];
      }
      usedDrops.add(drop);
      drops.push(drop);
    }

    realms.push({
      id: `realm-${randomId()}`,
      name,
      description,
      minRealm,
      cost,
      riskLevel,
      drops,
    });
  }

  return realms;
};

// 生成随机宗门
export const generateRandomSects = (
  playerRealm: RealmType,
  count: number = 6
): SectInfo[] => {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const sects: SectInfo[] = [];

  for (let i = 0; i < count; i++) {
    // 随机选择境界要求
    const maxRealmIndex = Math.min(
      playerRealmIndex + 1,
      REALM_ORDER.length - 1
    );
    const realmIndex = Math.floor(Math.random() * (maxRealmIndex + 1));
    const reqRealm = REALM_ORDER[realmIndex];

    // 随机选择名称和描述
    const name = SECT_NAMES[Math.floor(Math.random() * SECT_NAMES.length)];
    const description =
      SECT_DESCRIPTIONS[Math.floor(Math.random() * SECT_DESCRIPTIONS.length)];

    sects.push({
      id: `sect-${randomId()}`,
      name,
      description,
      reqRealm,
    });
  }

  return sects;
};

// 生成随机宗门任务
export const generateRandomSectTasks = (
  playerRank: string,
  count: number = 3
): RandomSectTask[] => {
  const tasks: RandomSectTask[] = [];
  const taskTypes: Array<
    'patrol' | 'donate_stone' | 'donate_herb' | 'collect' | 'hunt'
  > = ['patrol', 'donate_stone', 'donate_herb', 'collect', 'hunt'];

  // 根据等级调整奖励基数
  const rankMultiplier =
    playerRank === '外门弟子'
      ? 1
      : playerRank === '内门弟子'
        ? 1.5
        : playerRank === '真传弟子'
          ? 2
          : 3;

  for (let i = 0; i < count; i++) {
    const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const name = TASK_NAMES[Math.floor(Math.random() * TASK_NAMES.length)];
    const description =
      TASK_DESCRIPTIONS[Math.floor(Math.random() * TASK_DESCRIPTIONS.length)];

    let cost: RandomSectTask['cost'] = {};
    let reward: RandomSectTask['reward'] = {
      contribution: Math.floor((10 + Math.random() * 40) * rankMultiplier),
    };
    const timeCosts: Array<'instant' | 'short' | 'medium' | 'long'> = [
      'instant',
      'short',
      'medium',
      'long',
    ];
    const timeCost = timeCosts[Math.floor(Math.random() * timeCosts.length)];

    switch (type) {
      case 'patrol':
        // 巡逻任务：瞬时完成，只给贡献
        reward.contribution = Math.floor(
          (10 + Math.random() * 20) * rankMultiplier
        );
        break;
      case 'donate_stone':
        // 上交灵石：消耗灵石，给贡献和少量灵石
        cost.spiritStones = Math.floor(50 + Math.random() * 150);
        reward.contribution = Math.floor(
          (20 + Math.random() * 30) * rankMultiplier
        );
        reward.spiritStones = Math.floor(cost.spiritStones * 0.3);
        break;
      case 'donate_herb':
        // 上交草药：消耗草药，给贡献
        const herbNames = ['聚灵草', '紫猴花', '天灵草', '血参', '灵芝'];
        cost.items = [
          {
            name: herbNames[Math.floor(Math.random() * herbNames.length)],
            quantity: 1 + Math.floor(Math.random() * 3),
          },
        ];
        reward.contribution = Math.floor(
          (15 + Math.random() * 25) * rankMultiplier
        );
        break;
      case 'collect':
        // 收集任务：需要收集材料，给贡献和物品
        const materialNames = ['炼器石', '妖兽内丹', '灵矿', '符纸'];
        cost.items = [
          {
            name: materialNames[
              Math.floor(Math.random() * materialNames.length)
            ],
            quantity: 1 + Math.floor(Math.random() * 2),
          },
        ];
        reward.contribution = Math.floor(
          (25 + Math.random() * 35) * rankMultiplier
        );
        reward.items = [
          {
            name: '聚气丹',
            quantity: 1,
          },
        ];
        break;
      case 'hunt':
        // 猎杀任务：需要战斗，给贡献和经验
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier
        );
        reward.exp = Math.floor((50 + Math.random() * 100) * rankMultiplier);
        break;
    }

    tasks.push({
      id: `task-${randomId()}`,
      name,
      description,
      type,
      cost,
      reward,
      timeCost,
    });
  }

  return tasks;
};
