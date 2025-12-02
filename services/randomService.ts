import { SecretRealm, RealmType, Item, ItemType } from '../types';
import { REALM_ORDER, SectInfo, SectGrade } from '../constants';

const randomId = () => Math.random().toString(36).slice(2, 9);

// 秘境名称池 - 按风险等级分类
const REALM_NAMES_BY_RISK: Record<'低' | '中' | '高' | '极度危险', string[]> = {
  '低': [
    '仙灵秘境', '星辰遗迹', '万兽山脉外围', '灵草园', '清风谷',
    '碧水潭', '紫竹林', '灵鸟栖息地', '灵石矿脉', '古修士洞府'
  ],
  '中': [
    '上古剑冢', '冰封雪域', '幻境迷窟', '龙族古墓', '万兽山脉深处',
    '古战场遗迹', '天音谷', '迷雾森林', '灵石洞', '试炼之塔'
  ],
  '高': [
    '天火熔岩', '毒瘴沼泽', '幽冥洞府', '时光裂缝', '死亡峡谷',
    '血海边缘', '雷霆谷', '邪魔洞', '黑风山', '白骨岭'
  ],
  '极度危险': [
    '雷罚炼狱', '血海魔渊', '九幽深渊', '天劫雷池', '混沌虚空',
    '神魔战场', '灭世禁地', '亡者之国', '虚空裂缝', '万古魔域'
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
    '古修士遗留的洞府，结构完整，相对安全。'
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
    '试炼之塔，层层考验，风险与机遇并存。'
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
    '白骨岭，死气沉沉，亡者之地。'
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
    '万古魔域，魔道之源，正道修士的绝地。'
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
  difficulty: '简单' | '普通' | '困难' | '极难'; // 任务难度
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

  // 难度配置
  const difficulties: Array<'简单' | '普通' | '困难' | '极难'> = ['简单', '普通', '困难', '极难'];

  for (let i = 0; i < count; i++) {
    const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const name = TASK_NAMES[Math.floor(Math.random() * TASK_NAMES.length)];
    const description =
      TASK_DESCRIPTIONS[Math.floor(Math.random() * TASK_DESCRIPTIONS.length)];

    // 随机选择难度
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const difficultyMultiplier = {
      '简单': 0.7,
      '普通': 1.0,
      '困难': 1.5,
      '极难': 2.5,
    }[difficulty];

    let cost: RandomSectTask['cost'] = {};
    let reward: RandomSectTask['reward'] = {
      contribution: Math.floor((10 + Math.random() * 40) * rankMultiplier * difficultyMultiplier),
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
          (10 + Math.random() * 20) * rankMultiplier * difficultyMultiplier
        );
        break;
      case 'donate_stone':
        // 上交灵石：消耗灵石，给贡献和少量灵石
        cost.spiritStones = Math.floor((50 + Math.random() * 150) * difficultyMultiplier);
        reward.contribution = Math.floor(
          (20 + Math.random() * 30) * rankMultiplier * difficultyMultiplier
        );
        reward.spiritStones = Math.floor(cost.spiritStones * 0.3);
        break;
      case 'donate_herb':
        // 上交草药：消耗草药，给贡献
        const herbNames = ['聚灵草', '紫猴花', '天灵草', '血参', '灵芝'];
        cost.items = [
          {
            name: herbNames[Math.floor(Math.random() * herbNames.length)],
            quantity: Math.floor((1 + Math.random() * 3) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (15 + Math.random() * 25) * rankMultiplier * difficultyMultiplier
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
            quantity: Math.floor((1 + Math.random() * 2) * difficultyMultiplier),
          },
        ];
        reward.contribution = Math.floor(
          (25 + Math.random() * 35) * rankMultiplier * difficultyMultiplier
        );
        reward.items = [
          {
            name: '聚气丹',
            quantity: Math.floor(difficultyMultiplier),
          },
        ];
        break;
      case 'hunt':
        // 猎杀任务：需要战斗，给贡献和经验
        reward.contribution = Math.floor(
          (30 + Math.random() * 40) * rankMultiplier * difficultyMultiplier
        );
        reward.exp = Math.floor((50 + Math.random() * 100) * rankMultiplier * difficultyMultiplier);
        break;
    }

    tasks.push({
      id: `task-${randomId()}`,
      name,
      description,
      type,
      difficulty,
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

