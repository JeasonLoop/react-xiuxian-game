import { SecretRealm, RealmType, Item, ItemType } from '../types';
import { REALM_ORDER, SectInfo, SectGrade } from '../constants';

const randomId = () => Math.random().toString(36).slice(2, 9);

// 秘境名称池 - 按风险等级分类
const REALM_NAMES_BY_RISK: Record<'低' | '中' | '高' | '极度危险', string[]> = {
  '低': [
    '仙灵秘境', '星辰遗迹', '万兽山脉外围', '灵草园', '清风谷',
    '碧水潭', '紫竹林', '灵鸟栖息地', '灵石矿脉', '古修士洞府',
    '百花谷', '月华池', '云海峰', '翠竹岭', '灵泉洞',
    '仙鹤湖', '彩虹桥', '灵药田', '静心亭', '飞瀑崖'
  ],
  '中': [
    '上古剑冢', '冰封雪域', '幻境迷窟', '龙族古墓', '万兽山脉深处',
    '古战场遗迹', '天音谷', '迷雾森林', '灵石洞', '试炼之塔',
    '风雷谷', '烈焰山', '寒冰洞', '毒蛇谷', '妖兽巢穴',
    '古墓迷宫', '剑意峰', '龙脉之地', '传承殿', '试炼秘境'
  ],
  '高': [
    '天火熔岩', '毒瘴沼泽', '幽冥洞府', '时光裂缝', '死亡峡谷',
    '血海边缘', '雷霆谷', '邪魔洞', '黑风山', '白骨岭',
    '魔焰深渊', '鬼哭岭', '血月洞', '暗影森林', '诅咒之地',
    '绝望深渊', '魔龙巢', '邪神祭坛', '死灵之域', '破碎虚空'
  ],
  '极度危险': [
    '雷罚炼狱', '血海魔渊', '九幽深渊', '天劫雷池', '混沌虚空',
    '神魔战场', '灭世禁地', '亡者之国', '虚空裂缝', '万古魔域',
    '天道禁区', '轮回之地', '永恒炼狱', '虚无之境', '毁灭之源',
    '禁忌之地', '天罚之域', '魔道本源', '死亡核心', '终极深渊'
  ]
};

// 秘境描述池 - 按风险等级分类
const REALM_DESCRIPTIONS_BY_RISK: Record<'低' | '中' | '高' | '极度危险', string[]> = {
  '低': [
    '仙灵之气浓郁，适合修炼，相对安全。',
    '星辰之力汇聚，灵气充沛，但需小心守护妖兽。',
    '外围相对安全，只有一些弱小的妖兽出没。',
    '灵草遍地，适合采集，偶有灵兽守护。',
    '清风徐来，环境宜人，但不可掉以轻心。',
    '碧水清波，灵气氤氲，适合静心修炼。',
    '紫竹摇曳，环境清幽，偶有小妖兽。',
    '灵鸟聚集之地，相对安全，可采集灵物。',
    '灵石矿脉，需要小心守护者。',
    '古修士遗留的洞府，结构完整，相对安全。',
    '百花盛开，香气四溢，灵气温和，适合新手修士。',
    '月华如水，夜晚时灵气最为浓郁，适合夜间修炼。',
    '云海翻腾，仙气缭绕，但需注意高空危险。',
    '翠竹成林，清雅幽静，偶有竹精出没。',
    '灵泉汩汩，泉水甘甜，长期饮用可改善体质。',
    '仙鹤翩翩，祥瑞之地，但不可惊扰仙鹤。',
    '彩虹横跨，美丽异常，但彩虹尽头隐藏着未知。',
    '灵药成片，药香扑鼻，需小心守护药园的妖兽。',
    '静心亭中，可静心悟道，但不可久留。',
    '飞瀑如练，水声轰鸣，瀑布后别有洞天。'
  ],
  '中': [
    '传说中上古剑修的埋骨之地，剑气纵横，需小心剑意。',
    '冰天雪地，寒风刺骨，但蕴藏着珍贵的冰属性宝物。',
    '幻象丛生，真假难辨，考验修士的心智和意志。',
    '龙族遗迹，蕴藏着龙族传承，但守护力量不弱。',
    '深处盘踞着强大的妖兽，需要小心应对。',
    '古战场遗迹，杀气残留，偶有怨灵出没。',
    '天音回荡，但暗藏杀机，需要谨慎探索。',
    '迷雾重重，容易迷失方向，需要强大的神识。',
    '灵石洞中，守护妖兽实力强劲。',
    '试炼之塔，层层考验，风险与机遇并存。',
    '风雷交加，电闪雷鸣，风雷属性修士的福地。',
    '烈焰熊熊，火属性灵气浓郁，但温度极高。',
    '寒冰刺骨，冰属性宝物众多，但需抵御严寒。',
    '毒蛇盘踞，毒气弥漫，需备好解毒丹药。',
    '妖兽巢穴，妖兽众多，但材料丰富。',
    '古墓迷宫，机关重重，需小心谨慎。',
    '剑意冲天，剑修圣地，但剑气伤人。',
    '龙脉之地，灵气汇聚，但龙威压迫。',
    '传承殿中，功法众多，但考验严格。',
    '试炼秘境，层层试炼，通过者可得传承。'
  ],
  '高': [
    '地火喷涌，岩浆翻滚，火属性修士的圣地，但极端危险。',
    '毒气弥漫，危险重重，但蕴藏着珍稀毒草和剧毒妖兽。',
    '阴气森森，鬼物横行，非正道修士或实力不足者不可入。',
    '时间之力扭曲，过去未来交错，稍有不慎便会迷失其中。',
    '死气弥漫，亡魂游荡，生命气息会被逐渐侵蚀。',
    '血海边缘，魔气滔天，邪物横行，正道修士的禁地。',
    '雷霆谷中，雷光闪烁，稍有不慎便会遭到雷霆攻击。',
    '邪魔聚集之地，魔气浓郁，正道修士需格外小心。',
    '黑风山，邪风阵阵，危险异常。',
    '白骨岭，死气沉沉，亡者之地。',
    '魔焰燃烧，魔气冲天，魔道修士的乐园，正道修士的绝地。',
    '鬼哭狼嚎，怨气冲天，无数怨灵在此游荡。',
    '血月当空，邪异异常，血月之下邪物实力大增。',
    '暗影笼罩，光线难入，暗属性妖兽横行。',
    '诅咒之力弥漫，进入者会受到诅咒，需小心应对。',
    '绝望气息笼罩，意志不坚者会陷入绝望。',
    '魔龙盘踞，龙威滔天，非强者不可入。',
    '邪神祭坛，邪气浓郁，邪神之力残留。',
    '死灵之域，死气浓郁，生者进入会被死气侵蚀。',
    '空间破碎，虚空裂缝遍布，随时可能被吞噬。'
  ],
  '极度危险': [
    '终年雷霆不息，天劫之力残留，稍有不慎便会灰飞烟灭。',
    '魔气滔天，邪物横行，是正道修士的绝地，九死一生。',
    '九幽之地，死气沉沉，亡者的国度，生者禁入。',
    '天劫之力残留，危险异常，稍有不慎便会引发天劫。',
    '混沌之力混乱，空间不稳定，随时可能被空间裂缝吞噬。',
    '上古神魔大战的遗迹，杀气冲天，怨灵遍地。',
    '灭世禁地，连仙人都要避让，凡人进入必死无疑。',
    '亡者之国，死者的世界，生者无法存活。',
    '虚空裂缝，空间破碎，稍有不慎便会坠入无尽虚空。',
    '万古魔域，魔道之源，正道修士的绝地。',
    '天道禁区，天道之力排斥一切，进入者必遭天谴。',
    '轮回之地，生死轮回，稍有不慎便会陷入轮回。',
    '永恒炼狱，火焰永恒不灭，连灵魂都会被灼烧。',
    '虚无之境，一切皆无，存在本身都会被抹除。',
    '毁灭之源，毁灭之力弥漫，一切都会被毁灭。',
    '禁忌之地，天道禁忌，进入者必遭天罚。',
    '天罚之域，天罚之力残留，随时可能降下天罚。',
    '魔道本源，魔道力量的源头，魔气浓郁到极致。',
    '死亡核心，死亡之力的核心，生者无法存活。',
    '终极深渊，一切深渊的终点，进入者永无归路。'
  ]
};

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

// 宗门名称和描述绑定池（名称和描述一一对应）
const SECT_DATA: Array<{ name: string; description: string }> = [
  { name: '云灵宗', description: '正道大宗，门风清正，适合大部分修士。' },
  { name: '烈阳宗', description: '坐落于火山之上，专修火法，行事霸道。' },
  { name: '万剑门', description: '一剑破万法。门徒皆为剑痴，攻击力极强。' },
  { name: '天音寺', description: '佛门圣地，慈悲为怀，防御力出众。' },
  { name: '太虚观', description: '道门正统，修炼速度极快。' },
  { name: '血魔宗', description: '魔道宗门，行事狠辣，但实力强大。' },
  { name: '青莲剑派', description: '剑修圣地，剑法精妙。' },
  { name: '玄天宗', description: '正道大宗，底蕴深厚。' },
  { name: '九幽门', description: '魔道宗门，阴险狡诈。' },
  { name: '星辰阁', description: '神秘组织，掌握星辰之力。' },
  { name: '龙族圣地', description: '龙族后裔建立的宗门，血脉强大。' },
  { name: '凤凰宫', description: '凤凰血脉传承，涅槃重生。' },
  { name: '雷神殿', description: '专修雷法，攻击力极强。' },
  { name: '冰魄宗', description: '冰属性修士的圣地，防御力强。' },
  { name: '毒王谷', description: '毒修聚集地，擅长用毒。' },
  { name: '幻月门', description: '幻术宗门，擅长迷惑敌人。' },
  { name: '金刚寺', description: '体修宗门，肉身强大。' },
  { name: '阴阳教', description: '阴阳调和，攻防兼备。' }
];

// 任务名称池（按类型分类）
const TASK_NAMES_BY_TYPE: Record<TaskType, string[]> = {
  patrol: ['山门巡逻', '宗门巡视', '边界巡查', '治安维护'],
  donate_stone: ['上交灵石', '捐献灵石', '资助宗门'],
  donate_herb: ['上交草药', '捐献灵草', '提供药材'],
  collect: ['收集材料', '采集资源', '收集物资'],
  hunt: ['猎杀妖兽', '除妖任务', '妖兽清剿', '除魔卫道'],
  alchemy: ['炼制丹药', '炼丹任务', '炼制灵丹', '炼制仙丹'],
  forge: ['炼制法宝', '炼器任务', '锻造法器', '炼制灵宝'],
  teach: ['教导弟子', '指导修炼', '传授功法', '培养新人'],
  defend: ['守护宗门', '防御任务', '宗门守卫', '护山大阵'],
  explore: ['探索遗迹', '遗迹探索', '古墓探索', '秘境探索'],
  trade: ['贸易任务', '护送商队', '交易任务', '商业往来'],
  research: ['研究功法', '功法研究', '参悟心法', '钻研道法'],
  cultivate: ['培育灵草', '种植灵药', '培育仙草', '灵田管理'],
  maintain: ['维护阵法', '修复法阵', '阵法维护', '护山大阵维护'],
  diplomacy: ['外交任务', '宗门交流', '友好往来', '结盟任务'],
  trial: ['试炼任务', '宗门试炼', '考验任务', '历练任务'],
  rescue: ['救援任务', '营救同门', '救援行动', '紧急救援'],
  investigate: ['调查任务', '情报收集', '探查任务', '侦查任务'],
};

// 任务描述池（按类型分类）
const TASK_DESCRIPTIONS_BY_TYPE: Record<TaskType, string[]> = {
  patrol: [
    '在宗门附近巡视，驱逐野兽，维护治安。',
    '巡查宗门边界，确保安全。',
    '维护宗门周边的秩序。',
  ],
  donate_stone: [
    '为宗门捐献灵石，支持宗门发展。',
    '上交灵石以换取贡献。',
    '资助宗门的日常运营。',
  ],
  donate_herb: [
    '为宗门提供草药，支持炼丹。',
    '上交收集的灵草，换取贡献。',
    '捐献药材以支持宗门炼丹。',
  ],
  collect: [
    '收集宗门需要的炼器材料。',
    '前往指定地点采集资源。',
    '收集任务所需的物资。',
  ],
  hunt: [
    '猎杀威胁宗门安全的妖兽。',
    '清除宗门附近的妖兽威胁。',
    '执行除妖任务，维护宗门安全。',
  ],
  alchemy: [
    '为宗门炼制指定丹药，需要丹方和材料。',
    '使用宗门提供的材料炼制丹药。',
    '炼制高级丹药，需要一定的炼丹造诣。',
  ],
  forge: [
    '为宗门炼制法宝，需要炼器材料。',
    '使用珍贵材料锻造法器。',
    '炼制强大的法宝，需要炼器技能。',
  ],
  teach: [
    '指导新入门的弟子修炼，需要一定境界。',
    '传授修炼心得，培养新人。',
    '为弟子答疑解惑，指导修炼。',
  ],
  defend: [
    '守护宗门，抵御外敌入侵，可能触发战斗。',
    '参与宗门防御，保护同门。',
    '守卫宗门要地，防止敌人破坏。',
  ],
  explore: [
    '探索附近的遗迹，寻找宝物，可能获得意外收获。',
    '深入古墓探索，寻找传承。',
    '探索秘境，寻找机缘。',
  ],
  trade: [
    '护送重要物资到指定地点，可能遭遇劫匪。',
    '执行贸易任务，促进宗门交流。',
    '护送商队，确保物资安全。',
  ],
  research: [
    '研究宗门功法，需要时间，可获得修为提升。',
    '参悟心法，提升修炼速度。',
    '钻研道法，加深对修炼的理解。',
  ],
  cultivate: [
    '培育灵草，需要时间，可获得草药奖励。',
    '管理灵田，培育珍稀灵药。',
    '种植仙草，需要耐心和技巧。',
  ],
  maintain: [
    '维护宗门的护山大阵，需要材料。',
    '修复损坏的阵法，确保宗门安全。',
    '维护防御法阵，需要阵法知识。',
  ],
  diplomacy: [
    '执行外交任务，需要高境界，可能获得特殊奖励。',
    '代表宗门与其他势力交流。',
    '促进宗门间的友好关系。',
  ],
  trial: [
    '参加宗门试炼，高风险高回报。',
    '接受宗门考验，证明实力。',
    '完成试炼任务，获得丰厚奖励。',
  ],
  rescue: [
    '救援遇险的同门，可能遭遇战斗。',
    '执行紧急救援任务。',
    '营救被困的宗门弟子。',
  ],
  investigate: [
    '调查异常情况，需要强大的神识。',
    '收集情报，探查敌情。',
    '侦查任务，需要谨慎和智慧。',
  ],
};

// 任务品质配置
const TASK_QUALITY_CONFIG: Record<TaskQuality, {
  probability: number;
  rewardMultiplier: number;
  contributionBonus: number;
}> = {
  普通: {
    probability: 0.6,
    rewardMultiplier: 1.0,
    contributionBonus: 0,
  },
  稀有: {
    probability: 0.25,
    rewardMultiplier: 1.5,
    contributionBonus: 50,
  },
  传说: {
    probability: 0.12,
    rewardMultiplier: 2.5,
    contributionBonus: 200,
  },
  仙品: {
    probability: 0.03,
    rewardMultiplier: 5.0,
    contributionBonus: 1000,
  },
};

// 任务品质类型
export type TaskQuality = '普通' | '稀有' | '传说' | '仙品';

// 任务类型扩展
export type TaskType =
  | 'patrol'           // 巡逻
  | 'donate_stone'     // 上交灵石
  | 'donate_herb'      // 上交草药
  | 'collect'          // 收集
  | 'hunt'             // 猎杀
  | 'alchemy'          // 炼制丹药
  | 'forge'            // 炼制法宝
  | 'teach'            // 教导弟子
  | 'defend'           // 守护宗门
  | 'explore'          // 探索遗迹
  | 'trade'            // 贸易任务
  | 'research'         // 研究功法
  | 'cultivate'        // 培育灵草
  | 'maintain'         // 维护阵法
  | 'diplomacy'        // 外交任务
  | 'trial'            // 试炼任务
  | 'rescue'           // 救援任务
  | 'investigate';     // 调查任务

export interface RandomSectTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  difficulty: '简单' | '普通' | '困难' | '极难'; // 任务难度
  quality: TaskQuality; // 任务品质
  minRealm?: RealmType; // 最低境界要求
  recommendedRealm?: RealmType; // 推荐境界
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

    // 根据风险等级选择对应的名称和描述
    const availableNames = REALM_NAMES_BY_RISK[riskLevel];
    const availableDescriptions = REALM_DESCRIPTIONS_BY_RISK[riskLevel];
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    const description = availableDescriptions[Math.floor(Math.random() * availableDescriptions.length)];

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

    // 随机选择一个宗门（名称和描述绑定）
    const sectData = SECT_DATA[Math.floor(Math.random() * SECT_DATA.length)];
    const name = sectData.name;
    const description = sectData.description;

    // 根据境界随机分配宗门等级
    const grades: SectGrade[] = ['黄', '玄', '地', '天'];
    const gradeWeights = [0.4, 0.3, 0.2, 0.1]; // 黄最多，天最少
    let grade: SectGrade = '黄';
    const rand = Math.random();
    if (rand < gradeWeights[0]) grade = '黄';
    else if (rand < gradeWeights[0] + gradeWeights[1]) grade = '玄';
    else if (rand < gradeWeights[0] + gradeWeights[1] + gradeWeights[2]) grade = '地';
    else grade = '天';

    // 根据等级设置退出代价
    const exitCostMultiplier = {
      '黄': 1,
      '玄': 2,
      '地': 5,
      '天': 10,
    }[grade];

    sects.push({
      id: `sect-${randomId()}`,
      name,
      description,
      reqRealm,
      grade,
      exitCost: {
        spiritStones: Math.floor(300 * exitCostMultiplier),
        items: [{ name: '聚灵草', quantity: Math.floor(5 * exitCostMultiplier) }],
      },
    });
  }

  return sects;
};

// 根据玩家境界计算任务收益倍数
const getRealmMultiplier = (playerRealm: RealmType, taskRealm: RealmType): number => {
  const playerIndex = REALM_ORDER.indexOf(playerRealm);
  const taskIndex = REALM_ORDER.indexOf(taskRealm);
  const diff = playerIndex - taskIndex;

  if (diff < -1) return 0.5;      // 境界太低，收益减半
  if (diff === -1) return 0.8;   // 境界略低，收益80%
  if (diff === 0) return 1.0;    // 境界匹配，正常收益
  if (diff === 1) return 0.9;    // 境界略高，收益90%
  return 0.7;                     // 境界太高，收益70%
};

// 根据任务类型和玩家境界确定推荐境界
const getRecommendedRealm = (type: TaskType, playerRealm: RealmType): RealmType => {
  const playerIndex = REALM_ORDER.indexOf(playerRealm);

  // 不同任务类型有不同的境界要求
  const realmOffsets: Record<TaskType, number> = {
    patrol: 0,           // 巡逻：无要求
    donate_stone: 0,     // 上交灵石：无要求
    donate_herb: 0,      // 上交草药：无要求
    collect: 0,          // 收集：无要求
    hunt: 0,             // 猎杀：无要求
    alchemy: 1,          // 炼制丹药：需要一定境界
    forge: 1,            // 炼制法宝：需要一定境界
    teach: 2,            // 教导弟子：需要较高境界
    defend: 0,           // 守护：无要求
    explore: 1,          // 探索：需要一定境界
    trade: 0,            // 贸易：无要求
    research: 1,        // 研究：需要一定境界
    cultivate: 0,       // 培育：无要求
    maintain: 1,        // 维护：需要一定境界
    diplomacy: 3,       // 外交：需要高境界
    trial: 2,           // 试炼：需要较高境界
    rescue: 1,          // 救援：需要一定境界
    investigate: 1,     // 调查：需要一定境界
  };

  const offset = realmOffsets[type] || 0;
  const recommendedIndex = Math.min(
    playerIndex + offset,
    REALM_ORDER.length - 1
  );
  return REALM_ORDER[recommendedIndex];
};

// 生成任务品质
const generateTaskQuality = (): TaskQuality => {
  const rand = Math.random();
  if (rand < 0.6) return '普通';
  if (rand < 0.85) return '稀有';
  if (rand < 0.97) return '传说';
  return '仙品';
};

// 生成随机宗门任务
export const generateRandomSectTasks = (
  playerRank: string,
  playerRealm: RealmType,
  count: number = 3
): RandomSectTask[] => {
  const tasks: RandomSectTask[] = [];

  // 所有任务类型
  const allTaskTypes: TaskType[] = [
    'patrol', 'donate_stone', 'donate_herb', 'collect', 'hunt',
    'alchemy', 'forge', 'teach', 'defend', 'explore',
    'trade', 'research', 'cultivate', 'maintain',
    'diplomacy', 'trial', 'rescue', 'investigate',
  ];

  // 根据等级调整奖励基数
  const rankMultiplier =
    playerRank === '外门弟子'
      ? 1
      : playerRank === '内门弟子'
        ? 1.5
        : playerRank === '真传弟子'
          ? 2
          : 3;

  // 难度配置
  const difficulties: Array<'简单' | '普通' | '困难' | '极难'> = ['简单', '普通', '困难', '极难'];

  for (let i = 0; i < count; i++) {
    // 随机选择任务类型
    const type = allTaskTypes[Math.floor(Math.random() * allTaskTypes.length)];

    // 从对应类型的名称和描述池中选择
    const names = TASK_NAMES_BY_TYPE[type];
    const descriptions = TASK_DESCRIPTIONS_BY_TYPE[type];
    const name = names[Math.floor(Math.random() * names.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // 生成任务品质
    const quality = generateTaskQuality();
    const qualityConfig = TASK_QUALITY_CONFIG[quality];

    // 确定推荐境界
    const recommendedRealm = getRecommendedRealm(type, playerRealm);
    const minRealm = recommendedRealm; // 最低境界等于推荐境界

    // 随机选择难度
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const difficultyMultiplier = {
      '简单': 0.7,
      '普通': 1.0,
      '困难': 1.5,
      '极难': 2.5,
    }[difficulty];

    // 计算境界收益倍数
    const realmMultiplier = getRealmMultiplier(playerRealm, recommendedRealm);

    let cost: RandomSectTask['cost'] = {};
    let baseContribution = Math.floor(
      (10 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
    );

    let reward: RandomSectTask['reward'] = {
      contribution: baseContribution + qualityConfig.contributionBonus,
    };

    const timeCosts: Array<'instant' | 'short' | 'medium' | 'long'> = [
      'instant',
      'short',
      'medium',
      'long',
    ];
    const timeCost = timeCosts[Math.floor(Math.random() * timeCosts.length)];

    // 根据任务类型设置具体奖励和消耗
    switch (type) {
      case 'patrol':
        reward.contribution = Math.floor(
          (10 + Math.random() * 20) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        break;
      case 'donate_stone':
        cost.spiritStones = Math.floor((50 + Math.random() * 150) * difficultyMultiplier);
        reward.contribution = Math.floor(
          (20 + Math.random() * 30) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.spiritStones = Math.floor(cost.spiritStones * 0.3);
        break;
      case 'donate_herb':
        const herbNames = ['聚灵草', '紫猴花', '天灵草', '血参', '灵芝'];
        cost.items = [
          {
            name: herbNames[Math.floor(Math.random() * herbNames.length)],
            quantity: Math.floor((1 + Math.random() * 3) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (15 + Math.random() * 25) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        break;
      case 'collect':
        const materialNames = ['炼器石', '妖兽内丹', '灵矿', '符纸'];
        cost.items = [
          {
            name: materialNames[Math.floor(Math.random() * materialNames.length)],
            quantity: Math.floor((1 + Math.random() * 2) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (25 + Math.random() * 35) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.items = [
          {
            name: '聚气丹',
            quantity: Math.floor(difficultyMultiplier * qualityConfig.rewardMultiplier),
          },
        ];
        break;
      case 'hunt':
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (50 + Math.random() * 100) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
      case 'alchemy':
        const alchemyMaterials = ['聚灵草', '紫猴花', '天灵草', '血参'];
        cost.items = [
          {
            name: alchemyMaterials[Math.floor(Math.random() * alchemyMaterials.length)],
            quantity: Math.floor((2 + Math.random() * 3) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.items = [
          {
            name: '聚气丹',
            quantity: Math.floor((2 + Math.random() * 3) * difficultyMultiplier * qualityConfig.rewardMultiplier),
          },
        ];
        break;
      case 'forge':
        const forgeMaterials = ['炼器石', '精铁', '灵矿', '妖兽内丹'];
        cost.items = [
          {
            name: forgeMaterials[Math.floor(Math.random() * forgeMaterials.length)],
            quantity: Math.floor((2 + Math.random() * 3) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (35 + Math.random() * 45) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.spiritStones = Math.floor(
          (50 + Math.random() * 100) * difficultyMultiplier * qualityConfig.rewardMultiplier
        );
        break;
      case 'teach':
        reward.contribution = Math.floor(
          (25 + Math.random() * 35) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (30 + Math.random() * 60) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
      case 'defend':
        reward.contribution = Math.floor(
          (40 + Math.random() * 50) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (60 + Math.random() * 120) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
      case 'explore':
        reward.contribution = Math.floor(
          (35 + Math.random() * 45) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.items = [
          {
            name: '炼器石',
            quantity: Math.floor((1 + Math.random() * 2) * difficultyMultiplier * qualityConfig.rewardMultiplier),
          },
        ];
        // 传说/仙品探索任务可能获得稀有物品
        if (quality === '传说' || quality === '仙品') {
          if (!reward.items) reward.items = [];
          reward.items.push({
            name: quality === '仙品' ? '仙品材料' : '传说材料',
            quantity: 1,
          });
        }
        break;
      case 'trade':
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.spiritStones = Math.floor(
          (100 + Math.random() * 200) * difficultyMultiplier * qualityConfig.rewardMultiplier
        );
        break;
      case 'research':
        reward.contribution = Math.floor(
          (20 + Math.random() * 30) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (80 + Math.random() * 150) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
      case 'cultivate':
        reward.contribution = Math.floor(
          (15 + Math.random() * 25) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.items = [
          {
            name: '聚灵草',
            quantity: Math.floor((3 + Math.random() * 5) * difficultyMultiplier * qualityConfig.rewardMultiplier),
          },
        ];
        break;
      case 'maintain':
        const maintainMaterials = ['炼器石', '符纸', '灵矿'];
        cost.items = [
          {
            name: maintainMaterials[Math.floor(Math.random() * maintainMaterials.length)],
            quantity: Math.floor((1 + Math.random() * 2) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (25 + Math.random() * 35) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        break;
      case 'diplomacy':
        reward.contribution = Math.floor(
          (50 + Math.random() * 70) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.spiritStones = Math.floor(
          (200 + Math.random() * 300) * difficultyMultiplier * qualityConfig.rewardMultiplier
        );
        // 外交任务可能获得特殊奖励
        if (quality === '传说' || quality === '仙品') {
          reward.items = [
            {
              name: '外交信物',
              quantity: 1,
            },
          ];
        }
        break;
      case 'trial':
        reward.contribution = Math.floor(
          (45 + Math.random() * 55) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (100 + Math.random() * 200) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        reward.spiritStones = Math.floor(
          (150 + Math.random() * 250) * difficultyMultiplier * qualityConfig.rewardMultiplier
        );
        break;
      case 'rescue':
        reward.contribution = Math.floor(
          (40 + Math.random() * 50) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (70 + Math.random() * 130) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
      case 'investigate':
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        ) + qualityConfig.contributionBonus;
        reward.exp = Math.floor(
          (40 + Math.random() * 80) * rankMultiplier * difficultyMultiplier * qualityConfig.rewardMultiplier * realmMultiplier
        );
        break;
    }

    tasks.push({
      id: `task-${randomId()}`,
      name,
      description,
      type,
      difficulty,
      quality,
      minRealm,
      recommendedRealm,
      cost,
      reward,
      timeCost,
    });
  }

  return tasks;
};

// 宗门商店物品池（用于生成藏宝阁物品）
const SECT_SHOP_ITEM_POOL: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  { name: '炼器石', cost: 10, item: { name: '炼器石', type: ItemType.Material, description: '用于强化法宝的基础材料。', quantity: 1, rarity: '普通' } },
  { name: '聚气丹', cost: 20, item: { name: '聚气丹', type: ItemType.Pill, description: '短时间内大幅提升修炼速度。', quantity: 1, rarity: '普通', effect: { exp: 50 } } },
  { name: '紫猴花', cost: 50, item: { name: '紫猴花', type: ItemType.Herb, description: '炼制洗髓丹的材料，生长在悬崖峭壁。', quantity: 1, rarity: '稀有' } },
  { name: '洗髓丹', cost: 100, item: { name: '洗髓丹', type: ItemType.Pill, description: '强身健体，略微提升最大气血。', quantity: 1, rarity: '稀有', effect: { hp: 50 } } },
  { name: '筑基丹', cost: 1000, item: { name: '筑基丹', type: ItemType.Pill, description: '增加突破到筑基期的几率。', quantity: 1, rarity: '传说', effect: { exp: 500 } } },
  { name: '高阶妖丹', cost: 500, item: { name: '高阶妖丹', type: ItemType.Material, description: '强大妖兽的内丹，灵气逼人。', quantity: 1, rarity: '稀有' } },
  { name: '强化石', cost: 30, item: { name: '强化石', type: ItemType.Material, description: '用于强化法宝的珍贵材料。', quantity: 1, rarity: '稀有' } },
  { name: '凝神丹', cost: 80, item: { name: '凝神丹', type: ItemType.Pill, description: '凝神聚气，提升神识。', quantity: 1, rarity: '稀有', effect: { spirit: 10 } } },
  { name: '强体丹', cost: 80, item: { name: '强体丹', type: ItemType.Pill, description: '强身健体，提升体魄。', quantity: 1, rarity: '稀有', effect: { physique: 10 } } },
  { name: '回血丹', cost: 15, item: { name: '回血丹', type: ItemType.Pill, description: '快速恢复气血。', quantity: 1, rarity: '普通', effect: { hp: 50 } } },
  { name: '聚灵草', cost: 25, item: { name: '聚灵草', type: ItemType.Herb, description: '吸收天地灵气的草药。', quantity: 1, rarity: '普通' } },
  { name: '玄铁', cost: 40, item: { name: '玄铁', type: ItemType.Material, description: '珍贵的炼器材料。', quantity: 1, rarity: '稀有' } },
  { name: '星辰石', cost: 60, item: { name: '星辰石', type: ItemType.Material, description: '蕴含星辰之力的稀有矿石。', quantity: 1, rarity: '稀有' } },
  { name: '精铁', cost: 20, item: { name: '精铁', type: ItemType.Material, description: '优质的炼器材料。', quantity: 1, rarity: '普通' } },
  { name: '天灵草', cost: 35, item: { name: '天灵草', type: ItemType.Herb, description: '珍贵的灵草，可用于炼制高级丹药。', quantity: 1, rarity: '稀有' } },
];

// 二楼高级物品池
const SECT_SHOP_ITEM_POOL_FLOOR2: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [
  { name: '天外陨铁', cost: 800, item: { name: '天外陨铁', type: ItemType.Material, description: '来自天外的神秘金属，炼制仙器的材料。', quantity: 1, rarity: '传说' } },
  { name: '仙晶', cost: 1500, item: { name: '仙晶', type: ItemType.Material, description: '蕴含仙气的晶石，极其珍贵。', quantity: 1, rarity: '仙品' } },
  { name: '九转金丹', cost: 3000, item: { name: '九转金丹', type: ItemType.Pill, description: '传说中的仙丹，服用后甚至能让凡人立地飞升。', quantity: 1, rarity: '仙品', effect: { exp: 5000, attack: 10, defense: 10 } } },
  { name: '天元丹', cost: 2000, item: { name: '天元丹', type: ItemType.Pill, description: '天元级别的仙丹，服用后全属性大幅提升。', quantity: 1, rarity: '仙品', effect: { exp: 10000, attack: 50, defense: 50, spirit: 100, physique: 100, speed: 30 } } },
  { name: '万年灵乳', cost: 1200, item: { name: '万年灵乳', type: ItemType.Material, description: '万年灵脉中凝聚的精华，炼制仙丹的珍贵材料。', quantity: 1, rarity: '传说' } },
  { name: '九叶芝草', cost: 1000, item: { name: '九叶芝草', type: ItemType.Herb, description: '九叶灵芝，炼制仙丹的顶级材料。', quantity: 1, rarity: '传说' } },
  { name: '龙鳞果', cost: 900, item: { name: '龙鳞果', type: ItemType.Herb, description: '龙族栖息地生长的灵果，蕴含龙族血脉之力。', quantity: 1, rarity: '传说' } },
];

// 生成宗门商店物品（藏宝阁物品，每次刷新4-8个）
export const generateSectShopItems = (floor: 1 | 2 = 1): Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> => {
  const itemCount = 4 + Math.floor(Math.random() * 5); // 4-8个物品
  const items: Array<{ name: string; cost: number; item: Omit<Item, 'id'> }> = [];
  const usedItems = new Set<string>();

  // 根据楼层选择物品池
  const itemPool = floor === 2 ? SECT_SHOP_ITEM_POOL_FLOOR2 : SECT_SHOP_ITEM_POOL;

  for (let i = 0; i < itemCount; i++) {
    // 随机选择一个物品
    let selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];

    // 避免重复（但如果池子不够大，允许少量重复）
    let attempts = 0;
    while (usedItems.has(selectedItem.name) && attempts < 10 && usedItems.size < itemPool.length) {
      selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
      attempts++;
    }

    usedItems.add(selectedItem.name);
    items.push({ ...selectedItem });
  }

  return items;
};

