import { AdventureResult, AdventureType, ItemRarity, RealmType, EquipmentSlot, ItemType } from '../types';
import {
  REALM_ORDER,
  PET_TEMPLATES,
  getPillDefinition,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  HEAVEN_EARTH_SOUL_BOSSES,
  LONGEVITY_RULES,
} from '../constants/index';
import { getAllItemsFromConstants } from '../utils/itemConstantsUtils';
import { logger } from '../utils/logger';

// ==================== 常量定义 ====================

/**
 * 常用地点描述
 * 用于生成事件故事中的地点描述
 */
const COMMON_LOCATIONS = ['古洞府', '遗迹', '仙山', '秘境', '禁地'] as const;
const DANGEROUS_LOCATIONS = ['险地', '禁地', '危险区域', '魔域', '死地'] as const;
const NATURAL_LOCATIONS = ['森林', '山洞', '山谷', '河边', '山崖'] as const;
const CULTIVATION_LOCATIONS = ['灵泉', '古洞', '遗迹', '仙山', '秘境'] as const;

/**
 * 常用描述词
 * 用于修饰物品、地点等的形容词
 */
const QUALITY_WORDS = ['残破', '古老', '神秘', '珍贵', '稀有'] as const;
const CONTAINER_WORDS = ['玉盒', '石盒', '木盒', '金盒', '宝盒'] as const;
const PLATFORM_WORDS = ['祭坛', '石台', '玉座', '法阵', '灵池'] as const;

/**
 * 人物类型
 * 用于生成事件中遇到的人物描述
 */
const CULTIVATOR_TYPES = ['散修', '宗门弟子', '游方道士', '隐世高人', '商队护卫'] as const;
const ELDER_TYPES = ['隐世高人', '前辈修士', '神秘老者', '仙门长老', '散修大能'] as const;
const ENEMY_TYPES = ['邪修', '魔修', '恶人', '歹徒', '敌人'] as const;

/**
 * 物品类型
 * 用于描述洞府中发现的物品
 */
const ITEM_TYPES = ['书籍', '丹药', '材料', '灵石', '法器'] as const;

/**
 * 仙品丹药效果最小值
 * 确保仙品丹药的效果不会太低
 */
const MIN_PILL_EFFECT = 250;
const MIN_PILL_EXP_EFFECT = 5000;

/**
 * 事件模板接口
 */
interface AdventureEventTemplate {
  story: string;
  hpChange: number;
  expChange: number;
  spiritStonesChange: number;
  eventColor: 'normal' | 'gain' | 'danger' | 'special';
  adventureType: AdventureType;
  riskLevel?: '低' | '中' | '高' | '极度危险';
  // 可选字段
  itemObtained?: AdventureResult['itemObtained'];
  itemsObtained?: AdventureResult['itemsObtained'];
  petObtained?: string;
  petOpportunity?: AdventureResult['petOpportunity'];
  attributeReduction?: AdventureResult['attributeReduction'];
  reputationChange?: number;
  reputationEvent?: AdventureResult['reputationEvent'];
  inheritanceLevelChange?: number;
  triggerSecretRealm?: boolean;
  spiritualRootsChange?: AdventureResult['spiritualRootsChange'];
  lifespanChange?: number;
  lotteryTicketsChange?: number;
  longevityRuleObtained?: string; // 获得的规则之力ID
  heavenEarthSoulEncounter?: string; // 遇到的天地之魄BOSS ID
}

/**
 * 事件模板库
 */
let eventTemplateLibrary: AdventureEventTemplate[] = [];

/**
 * 事件模板库是否已初始化
 */
let isInitialized = false;

/**
 * 事件模板数量配置
 */
const TEMPLATE_COUNTS = {
  NORMAL: 720,        // 普通历练事件 (60%)
  LUCKY: 120,         // 大机缘事件 (10%)
  SECRET_REALM: 300,  // 秘境探索事件 (25%)
  SECT_CHALLENGE: 60, // 宗门挑战事件 (5%)
} as const;

/**
 * 确定性随机数生成器（基于种子）
 * 确保相同种子生成相同序列的随机数
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 基于索引的确定性随机数生成器
 */
function deterministicRandom(index: number, offset: number = 0): number {
  return seededRandom(index * 1000 + offset);
}

/**
 * 从数组中确定性选择一个元素（增加随机性）
 */
function selectFromArray<T>(array: T[], index: number): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  // 使用确定性随机数而不是简单的取模，增加随机性
  const randomValue = deterministicRandom(index, 600);
  const selectedIndex = Math.floor(randomValue * array.length);
  return array[selectedIndex];
}

/**
 * 生成确定性随机整数（范围：[min, max)）
 */
function randomInt(index: number, min: number, max: number, offset: number = 0): number {
  const range = max - min;
  return Math.floor(deterministicRandom(index, offset) * range) + min;
}

/**
 * 生成确定性随机浮点数（范围：[min, max)）
 */
function randomFloat(index: number, min: number, max: number, offset: number = 0): number {
  const range = max - min;
  return deterministicRandom(index, offset) * range + min;
}

/**
 * 基于概率的确定性判断
 */
function randomChance(index: number, probability: number, offset: number = 0): boolean {
  return deterministicRandom(index, offset) < probability;
}

/**
 * 从常量数组中获取元素（基于索引）
 * @param array 常量数组
 * @param index 索引值
 * @returns 数组中的元素（循环使用）
 */
function getFromConstArray<T extends readonly string[]>(array: T, index: number): T[number] {
  return array[index % array.length];
}

/**
 * 创建基础事件模板
 */
function createBaseTemplate(): AdventureEventTemplate {
  return {
    story: '',
    hpChange: 0,
    expChange: 0,
    spiritStonesChange: 0,
    eventColor: 'normal',
    adventureType: 'normal',
  };
}

/**
 * 从常量池中获取指定类型的物品
 */
function getItemFromConstants(itemType: ItemType, index: number, offset: number = 500) {
  const allItems = getAllItemsFromConstants();
  const filtered = allItems.filter(item => item.type === itemType);
  if (filtered.length === 0) return null;
  const random = deterministicRandom(index, offset);
  const itemIndex = Math.floor(random * filtered.length);
  return filtered[itemIndex] || filtered[0];
}

/**
 * 生成高级物品事件模板（用于筑基奇物、天地精华、天地之髓等）
 */
function generateAdvancedItemTemplate(
  index: number,
  items: Array<{ id: string; name: string; description: string; rarity: ItemRarity; effects: EffectSource }>,
  itemName: string,
  advancedItemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow',
  storyTemplates: (itemName: string, index: number) => string[],
  hpRange: [number, number],
  expRange: [number, number],
  hpOffset: number,
  expOffset: number
): AdventureEventTemplate {
  const selected = selectFromArray(items, index);
  const stories = storyTemplates(selected.name, index);
  const permanentEffect = convertEffectsToPermanentEffect(selected.effects);

  return {
    ...createBaseTemplate(),
    story: selectFromArray(stories, index),
    hpChange: randomInt(index, hpRange[0], hpRange[1], hpOffset),
    expChange: randomInt(index, expRange[0], expRange[1], expOffset),
    eventColor: 'special',
    itemObtained: {
      name: selected.name,
      type: ItemType.AdvancedItem,
      description: selected.description,
      rarity: selected.rarity,
      permanentEffect: Object.keys(permanentEffect).length > 0 ? permanentEffect : undefined,
      advancedItemType,
      advancedItemId: selected.id,
    },
  };
}

/**
 * 生成事件模板库（1200个事件）
 */
export function generateEventTemplateLibrary(): AdventureEventTemplate[] {
  const templates: AdventureEventTemplate[] = [];

  for (let i = 0; i < TEMPLATE_COUNTS.NORMAL; i++) {
    templates.push(generateNormalEventTemplate(i));
  }

  for (let i = 0; i < TEMPLATE_COUNTS.LUCKY; i++) {
    templates.push(generateLuckyEventTemplate(i));
  }

  for (let i = 0; i < TEMPLATE_COUNTS.SECRET_REALM; i++) {
    templates.push(generateSecretRealmEventTemplate(i));
  }

  for (let i = 0; i < TEMPLATE_COUNTS.SECT_CHALLENGE; i++) {
    templates.push(generateSectChallengeEventTemplate(i));
  }

  return templates;
}

/**
 * 生成普通历练事件模板
 */
function generateNormalEventTemplate(index: number): AdventureEventTemplate {
  // 增加功法和灵宠的出现频率，提高获得概率
  const eventTypes = [
    'battle', // 妖兽战斗
    'herb', // 发现灵草
    'cultivator', // 遇到修士
    'cave', // 小型洞府
    'enlightenment', // 顿悟
    'cultivationArt', // 功法解锁（提高概率）
    'cultivationArt', // 功法解锁（重复一次，提高概率）
    'danger', // 危险
    'spiritStone', // 灵石矿脉
    'rescue', // 救助
    'spiritSpring', // 灵泉
    'pet', // 灵宠（提高概率）
    'pet', // 灵宠（重复一次，提高概率）
    'pet', // 灵宠（再次提高概率）
    'petOpportunity', // 灵宠机缘
    'petOpportunity', // 灵宠机缘（重复一次，提高概率）
    'foundationTreasure', // 筑基奇物
    'heavenEarthEssence', // 天地精华
    'heavenEarthMarrow', // 天地之髓
    'heavenEarthMarrow', // 天地之髓（重复一次，提高概率）
    'heavenEarthSoul', // 天地之魄（化神期及以上，提高概率）
    'heavenEarthSoul', // 天地之魄（重复，提高概率）
    'heavenEarthSoul', // 天地之魄（再次重复，进一步提高概率）
    'heavenEarthSoul', // 天地之魄（再次提高概率）
    'longevityRule', // 规则之力（长生境）
    'trap', // 陷阱
    'evilCultivator', // 邪修魔修
    'reputation', // 声望事件（提高概率）
    'reputation', // 声望事件（重复，提高概率）
    'reputation', // 声望事件（再次重复，进一步提高概率）
    'lottery', // 抽奖券
  ];

  const eventType = selectFromArray(eventTypes, index);
  const rarityRoll = deterministicRandom(index, 1);
  const rarity: ItemRarity = rarityRoll < 0.6 ? '普通' : rarityRoll < 0.9 ? '稀有' : '传说';

  const baseTemplate = createBaseTemplate();

  switch (eventType) {
    case 'battle': {
      const beasts = ['青狼', '黑熊', '花豹', '猛虎', '巨蟒'] as const;
      const enemies = ['野狼', '山贼', '妖兽', '魔物', '邪修'] as const;
      const undead = ['骷髅兵', '怨灵', '僵尸', '鬼物', '魔物'] as const;
      const poisonous = ['毒蛇', '蜘蛛', '蝎子', '蜈蚣', '蝙蝠'] as const;
      const wild = ['山猫', '野猪', '猛禽', '巨猿', '妖狐'] as const;

      const stories = [
        `你在一片茂密的原始森林中穿行，参天古木遮天蔽日，突然听到前方传来低沉的咆哮声，震得树叶簌簌作响。你屏住呼吸，小心翼翼地拨开灌木，发现一只${getFromConstArray(beasts, index)}正在撕咬猎物，眼中闪烁着凶光。你决定先发制人，运转功法，剑光如电，经过一番激烈的搏斗，终于将其斩于剑下。`,
        `在荒山野岭中，你正沿着崎岖的山路前行，突然四周传来阵阵低吼，一群${getFromConstArray(enemies, index)}从四面八方围了上来，眼中闪烁着贪婪和杀意。你临危不乱，祭出法宝，施展神通，剑光与妖气交织，经过一场惊心动魄的战斗，终于成功击退了它们。`,
        `你正在探索一处古战场遗址，残破的兵器散落一地，空气中弥漫着淡淡的血腥味。突然，从废墟深处传来骨骼摩擦的"咔嚓"声，一只${getFromConstArray(undead, index)}从地底爬出，眼中燃烧着幽绿的鬼火。你立即运转护体功法，剑指苍穹，经过一番苦斗，终于将其彻底消灭。`,
        `在一片幽暗的峡谷中，你小心翼翼地前行，突然感到背后传来一阵寒意。你迅速转身，发现一只巨大的${getFromConstArray(poisonous, index)}正虎视眈眈地盯着你，毒液从獠牙间滴落，腐蚀着地面。你不敢大意，立即施展身法，剑光如雨，经过一番惊险的战斗，终于将其击败。`,
        `你在一处山洞中休息时，正闭目调息，突然感到一股强烈的杀意袭来。你猛然睁开双眼，发现一只${getFromConstArray(wild, index)}正悄无声息地接近，眼中闪烁着狡黠的光芒。你立即起身，运转功法，经过一番激烈的搏斗，终于将其击退。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 10, 40, 10),
        expChange: randomInt(index, 20, 70, 20),
        spiritStonesChange: randomInt(index, 10, 40, 30),
        eventColor: 'danger',
        itemObtained: randomChance(index, 0.3, 40) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'herb': {
      // 从常量池中获取草药
      const selectedHerb = getItemFromConstants(ItemType.Herb, index, 500) || {
        name: '聚灵草',
        type: ItemType.Herb,
        description: '一株珍贵的聚灵草，蕴含着浓郁的灵气。',
        rarity: '普通' as ItemRarity,
        effect: { hp: 50, exp: 10 },
        permanentEffect: { spirit: 1, maxHp: 10 },
      };

      const stories = [
        `你在山间小径上行走，清风徐来，突然闻到一股淡淡的药香，沁人心脾。你停下脚步，仔细嗅了嗅，循着香味寻找，在一处隐蔽的岩石缝隙中发现了一株${selectedHerb.name}，叶片上还挂着晶莹的露珠，散发着淡淡的灵光。你小心地将其采摘下来，感受到其中蕴含的浓郁灵气。`,
        `在一片茂密的草丛中，你正穿行其间，突然眼前一亮，发现了一株散发着微弱灵光的${selectedHerb.name}，在微风中轻轻摇曳，仿佛在向你招手。你蹲下身来，仔细观察，只见其叶片翠绿如玉，茎干挺拔，显然已经生长了不短的时间。你小心地将其采摘下来，放入储物袋中。`,
        `你在一处瀑布旁休息时，水声轰鸣，水雾弥漫。你偶然发现水边生长着一株${selectedHerb.name}，它似乎吸收了瀑布的精华，叶片上闪烁着水光，显得格外生机勃勃。你将其采摘，感受到其中蕴含的浓郁灵气，仿佛能听到它在诉说着大自然的奥秘。`,
        `在探索一处古遗迹时，你在废墟中发现了一株顽强生长的${selectedHerb.name}，它从石缝中钻出，虽然环境恶劣，却依然生机盎然，叶片上还残留着古老的尘埃。你小心地将其收集起来，感叹生命的顽强，同时也为这株灵草能在如此环境中生长而感到惊奇。`,
        `你在一处灵泉边发现了一株${selectedHerb.name}，它似乎吸收了灵泉的精华，叶片上闪烁着七彩的光芒，茎干中仿佛有灵液在流动。你仔细观察，发现这株灵草比普通的同类更加珍贵，显然是经过灵泉滋养的变异品种。你小心地将其采摘下来，心中充满了喜悦。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 10, 30, 50),
        expChange: randomInt(index, 15, 45, 60),
        eventColor: 'gain',
        itemObtained: {
          name: selectedHerb.name,
          type: selectedHerb.type, // 常量池中的类型应该是正确的
          description: selectedHerb.description || '一株神秘的草药。',
          rarity: selectedHerb.rarity || '普通',
          effect: selectedHerb.effect,
          permanentEffect: selectedHerb.permanentEffect,
        },
      };
    }

    case 'cultivator': {
      const stories = [
        `你在路上遇到了一位${['散修', '宗门弟子', '游方道士', '隐世高人', '商队护卫'][index % 5]}，对方见你也是同道中人，主动上前搭话。你们在一处树荫下坐下，互相交流修炼心得，谈论着各自的修炼经历和感悟。对方分享了一些独到的见解，你从中获得了一些启发，对修炼之道有了更深的理解。`,
        `在一处茶肆中，你点了一壶灵茶，正独自品茗，突然一位${['老修士', '年轻剑客', '炼丹师', '阵法师', '符箓师'][index % 5]}走了过来，询问是否可以同坐。你们相谈甚欢，从修炼心得聊到江湖见闻，对方分享了一些宝贵的修炼经验，让你受益匪浅。临别时，对方还送了你一些灵石作为见面礼。`,
        `你在一处坊市中闲逛，突然听到有人在讨论修炼之事，你循声望去，发现是一位${['商人', '炼器师', '医师', '学者', '游侠'][index % 5]}。你主动上前搭话，对方见你也是同道中人，便与你交换了一些信息和物品。你们聊得很投机，对方还告诉了你一些坊市中的小道消息。`,
        `在探索途中，你遇到了一位${['同门', '道友', '前辈', '后辈', '陌生人'][index % 5]}，对方见你独自一人，便主动上前打招呼。你们互相交流，谈论着各自的见闻和经历。对方见多识广，分享了许多有用的信息，包括一些危险区域的注意事项和机缘所在。`,
        `你在一处客栈中休息时，正坐在窗边看着外面的风景，突然一位${['神秘人', '老者', '少年', '女子', '僧人'][index % 5]}走了过来，询问是否可以同坐。你们交谈后，发现对方见识不凡，对修炼之道有着独到的理解。对方分享了一些人生感悟和修炼心得，你获得了一些启发，对未来的修炼之路有了更清晰的认识。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 60, 70),
        spiritStonesChange: randomChance(index, 0.5, 80) ? randomInt(index, 20, 70, 90) : 0,
        eventColor: 'normal',
        itemObtained: randomChance(index, 0.2, 100) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'cave': {
      const stories = [
        `你在一处山崖下发现了一个隐蔽的洞口，洞口被藤蔓和杂草遮掩，若不仔细看很难发现。你小心翼翼地拨开藤蔓，进入其中，发现这是一个废弃的${['古修士洞府', '小型洞府', '临时居所', '修炼密室', '藏宝洞'][index % 5]}。洞内虽然已经荒废多年，但依然能感受到残留的灵气。你在其中仔细搜索，找到了一些遗留的物品，虽然已经蒙尘，但依然散发着淡淡的光芒。`,
        `你在一处山洞中探索，洞内幽深，石壁上刻着一些古老的符文，虽然已经模糊不清，但依然能感受到其中蕴含的道韵。你发现这里曾经是一位${['散修', '隐士', '前辈', '高人', '修士'][index % 5]}的修炼之地，虽然已经废弃多年，但洞内依然残留着淡淡的灵气。你在洞内仔细搜索，虽然大部分物品已经腐朽，但仍有一些有用的东西保存完好。`,
        `你偶然发现了一处被藤蔓遮掩的洞口，洞口不大，但里面却别有洞天。你进入后，发现这是一个小型洞府，洞内虽然简陋，但布置得井井有条。你在洞内搜索，发现了一些${['书籍', '丹药', '材料', '灵石', '法器'][index % 5]}，虽然已经有些年头，但保存得还算完好。你将这些物品收入囊中，心中充满了收获的喜悦。`,
        `在一处偏僻的山谷中，你发现了一个废弃的洞府，洞府入口处有一块石碑，上面刻着"静心居"三个字，虽然已经风化，但依然能看出字迹的苍劲有力。你进入探索，洞内虽然已经荒废，但依然能感受到曾经主人的气息。你在洞内仔细搜索，找到了一些有用的物品，包括一些修炼材料和灵石。`,
        `你在一处石壁下发现了一个隐蔽的洞口，洞口很小，只能容一人通过。你进入后，发现这是一个小型修炼洞府，洞内虽然不大，但布置得十分精致，石壁上还刻着一些修炼心得。你在洞内搜索，发现了一些遗留的物品，虽然已经有些年头，但依然散发着淡淡的光芒，显然不是凡物。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 5, 20, 110),
        expChange: randomInt(index, 30, 90, 120),
        spiritStonesChange: randomInt(index, 40, 120, 130),
        eventColor: 'gain',
        itemObtained: randomChance(index, 0.6, 140) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'enlightenment': {
      const stories = [
        `你在${['山顶', '瀑布边', '竹林', '古树下', '石台上'][index % 5]}静坐修炼，四周万籁俱寂，只有风声在耳边轻拂。你闭上双眼，运转功法，突然心有所感，仿佛有一道灵光从脑海中闪过，对修炼之道有了新的领悟。你感到体内的灵气运转更加顺畅，对功法的理解也更加深刻了。`,
        `你在一处${['灵泉', '古洞', '遗迹', '仙山', '秘境'][index % 5]}中修炼时，四周的灵气浓郁得几乎要凝成实质。你沉浸其中，运转功法，突然进入了一种玄妙的状态，仿佛与天地融为一体。在这种状态下，你对大道有了更深的理解，许多之前想不通的问题都豁然开朗。`,
        `你在观察${['云海', '星空', '日出', '月升', '潮汐'][index % 5]}时，被大自然的壮丽景象所震撼。你静静地站在那里，感受着天地间的韵律，突然领悟到了一些修炼的奥秘。你发现，修炼不仅仅是提升修为，更是要感悟天地大道，与自然和谐共存。`,
        `你在一处${['静室', '洞府', '山顶', '湖边', '林中'][index % 5]}中打坐，四周安静得只能听到自己的呼吸声。你运转功法，体内的灵气缓缓流动，突然灵光一闪，对功法有了新的理解。你发现，之前一直困扰你的问题，原来答案就在眼前，只是你一直没有注意到。`,
        `你在${['战斗', '探索', '修炼', '思考', '观察'][index % 5]}中突然顿悟，仿佛有一道闪电划破脑海，对修炼之道有了新的认识。你发现，修炼不仅仅是按部就班地提升修为，更是要在实践中不断感悟，在感悟中不断突破。这种顿悟让你感到前所未有的清明，仿佛整个世界都变得更加清晰了。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 50, 130, 150),
        spiritStonesChange: 0,
        eventColor: 'gain',
      };
    }

    case 'cultivationArt': {
      // 从常量池中获取功法（虽然系统会自动解锁，但事件描述要匹配）
      const stories = [
        `你在一处${['古洞府', '遗迹', '仙山', '秘境', '禁地'][index % 5]}中发现了一部${['残破', '古老', '神秘', '珍贵', '稀有'][index % 5]}的功法残卷，卷轴上虽然已经有些破损，但字迹依然清晰可见。你小心翼翼地将其展开，仔细研读，发现其中记载的修炼法门深奥玄妙，远超你之前所学的功法。你沉浸其中，不知不觉间，已经领悟到了其中的精髓。`,
        `你遇到了一位${['隐世高人', '前辈修士', '神秘老者', '仙门长老', '散修大能'][index % 5]}，对方见你资质不错，眼中闪过一丝赞赏。你们在一处僻静的地方坐下，对方开始传授你一部功法。对方讲解得深入浅出，每一个细节都讲得清清楚楚，你听得如痴如醉，很快就领悟了其中的奥妙。临别时，对方还叮嘱你要勤加练习，不可懈怠。`,
        `你在探索一处${['古墓', '遗迹', '洞府', '秘境', '禁地'][index % 5]}时，意外发现了一部${['失传', '古老', '神秘', '珍贵', '稀有'][index % 5]}的功法秘籍。秘籍被保存在一个玉盒中，虽然已经有些年头，但依然保存完好。你打开玉盒，取出秘籍，发现其中记载的功法深奥玄妙，显然是某个大能留下的传承。你仔细研读，很快就领悟了其中的精髓。`,
        `你在一处${['石壁', '石碑', '古书', '玉简', '卷轴'][index % 5]}上发现了刻录的功法，字迹虽然已经有些模糊，但依然能看出其中的精妙。你站在${['石壁', '石碑', '古书', '玉简', '卷轴'][index % 5]}前，仔细研读，发现其中记载的功法深奥玄妙，远超你之前所学的功法。你沉浸其中，不知不觉间，已经领悟了其中的奥妙。`,
        `你在一处${['古洞府', '遗迹', '仙山', '秘境', '禁地'][index % 5]}中，偶然发现了一部${['残破', '古老', '神秘', '珍贵', '稀有'][index % 5]}的功法残卷。残卷被保存在一个石盒中，虽然已经有些年头，但依然保存完好。你打开石盒，取出残卷，发现其中记载的功法深奥玄妙，显然是某个大能留下的传承。你仔细研读，很快就领悟了其中的精髓。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 50, 150, 160),
        spiritStonesChange: 0,
        eventColor: 'special',
      };
    }

    case 'danger': {
      const stories = [
        `你在探索时，脚下突然传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，${['陷阱', '机关', '禁制', '阵法', '毒气'][index % 5]}已经被触发。你拼尽全力闪避，虽然及时反应，但还是被${['陷阱', '机关', '禁制', '阵法', '毒气'][index % 5]}的余波击中，受了些伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周，生怕还有其他的危险。`,
        `你在一处${['险地', '禁地', '危险区域', '魔域', '死地'][index % 5]}中探索时，四周弥漫着危险的气息，你小心翼翼地前行，但依然遭遇了意外。突然，从暗处袭来一道攻击，你虽然及时反应，但还是被击中，受了轻伤。你不敢大意，立即运转功法防御，同时警惕地观察四周，准备应对接下来的危险。`,
        `你在一处${['古墓', '遗迹', '洞府', '秘境', '禁地'][index % 5]}中探索时，四周静得可怕，只有你的脚步声在回荡。你小心翼翼地前行，突然，脚下传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，机关已经被触发。你拼尽全力闪避，但还是被机关击中，受了伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周。`,
        `你在${['战斗', '探索', '修炼', '赶路', '休息'][index % 5]}时，突然遭遇了意外。你虽然及时应对，运转功法防御，但还是被意外击中，受了伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周，准备应对接下来的危险。`,
        `你在一处${['险境', '绝地', '禁地', '魔域', '死地'][index % 5]}中探索时，四周弥漫着危险的气息，空气中仿佛都带着杀意。你小心翼翼地前行，但依然遭遇了危险。突然，从暗处袭来一道攻击，你虽然及时反应，但还是被击中，受了伤。你不敢大意，立即运转功法防御，同时警惕地观察四周，准备应对接下来的危险。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 20, 60, 170),
        expChange: randomInt(index, 10, 40, 180),
        eventColor: 'danger',
      };
    }

    case 'spiritStone': {
      const stories = [
        `你在一处${['山洞', '矿洞', '地底', '峡谷', '山壁'][index % 5]}中探索时，突然感到四周的灵气变得浓郁起来。你循着灵气寻找，发现了一处小型灵石矿脉，矿脉中闪烁着淡淡的光芒，显然是品质不错的灵石。你取出工具，小心翼翼地挖掘，很快就采集到了不少灵石，心中充满了收获的喜悦。`,
        `你偶然发现了一处${['裸露', '半埋', '隐藏', '小型', '废弃'][index % 5]}的灵石矿脉，矿脉虽然不大，但品质却不错。你仔细观察，发现矿脉中的灵石闪烁着淡淡的光芒，显然是经过长时间孕育的优质灵石。你取出工具，小心翼翼地采集，很快就收集到了不少灵石。`,
        `你在探索时，突然感到脚下传来一阵灵气波动。你停下脚步，仔细观察，发现了一处灵石矿脉，虽然规模不大，但也能采集到一些灵石。你取出工具，小心翼翼地挖掘，很快就采集到了不少灵石，虽然数量不多，但品质却不错。`,
        `你在一处${['地下', '山洞', '矿洞', '地底', '山壁'][index % 5]}中探索时，突然眼前一亮，发现了一些灵石散落在地上，闪烁着淡淡的光芒。你仔细观察，发现这些灵石品质不错，显然是经过长时间孕育的优质灵石。你将其采集起来，收入储物袋中，心中充满了收获的喜悦。`,
        `你在一处${['矿洞', '山洞', '地底', '峡谷', '山壁'][index % 5]}中探索时，突然感到四周的灵气变得浓郁起来。你循着灵气寻找，发现了一处小型灵石矿脉，矿脉中闪烁着淡淡的光芒，显然是品质不错的灵石。你取出工具，小心翼翼地挖掘，很快就采集到了不少灵石，虽然数量不多，但品质却不错。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 60, 190),
        spiritStonesChange: randomInt(index, 50, 150, 200),
        eventColor: 'gain',
      };
    }

    case 'rescue': {
      const stories = [
        `你在路上遇到了一位${['受伤的修士', '被困的商人', '遇险的村民', '受伤的散修', '遇险的旅人'][index % 5]}，对方看起来十分狼狈，显然是遭遇了什么危险。你见对方需要帮助，便主动上前询问。对方见你愿意相助，眼中闪过一丝感激，向你说明了情况。你出手相助，帮助对方解决了困难，对方感激不尽，连连道谢。`,
        `你在一处${['森林', '山路', '荒野', '山谷', '河边'][index % 5]}中遇到了一位需要帮助的人，对方看起来十分焦急，显然是遇到了什么困难。你见对方需要帮助，便主动上前询问。对方见你愿意相助，眼中闪过一丝希望，向你说明了情况。你出手相助，帮助对方解决了困难，对方感激不尽。`,
        `你遇到了一位${['被妖兽围攻', '陷入陷阱', '受伤倒地', '迷失方向', '遭遇危险'][index % 5]}的人，对方看起来十分危险，显然是遭遇了什么意外。你见对方需要帮助，便主动上前相助。你运转功法，帮助对方解决了困难，对方感激不尽，连连道谢。`,
        `你在路上遇到了一位需要帮助的人，对方看起来十分狼狈，显然是遭遇了什么危险。你见对方需要帮助，便主动上前询问。对方见你愿意相助，眼中闪过一丝感激，向你说明了情况。你出手相助，帮助对方解决了困难，对方感激地给了你一些报酬，虽然不多，但也是一番心意。`,
        `你在一处${['险地', '禁地', '危险区域', '魔域', '死地'][index % 5]}中遇到了一位需要帮助的人，对方看起来十分危险，显然是遭遇了什么意外。你见对方需要帮助，便主动上前相助。你运转功法，帮助对方解决了困难，对方感激不尽，连连道谢，还告诉了你一些关于这个区域的注意事项。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomChance(index, 0.3, 210) ? -randomInt(index, 10, 30, 220) : 0,
        expChange: randomInt(index, 30, 80, 230),
        spiritStonesChange: randomChance(index, 0.5, 240) ? randomInt(index, 30, 90, 250) : 0,
        eventColor: 'gain',
        reputationChange: randomInt(index, 10, 30, 260),
        itemObtained: randomChance(index, 0.3, 270) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'spiritSpring': {
      const stories = [
        `你在一处${['山谷', '山洞', '森林', '山崖', '地底'][index % 5]}中探索时，突然听到潺潺的水声。你循声寻找，发现了一处灵泉，泉水清澈见底，散发着淡淡的灵光，空气中弥漫着浓郁的灵气。你蹲下身来，用手捧起一些灵泉水，一饮而尽，顿时感到一股暖流从喉咙流入体内，瞬间传遍全身，感觉身体充满了活力，仿佛所有的疲惫都一扫而空。`,
        `你偶然发现了一处${['清澈', '温热', '冰冷', '甘甜', '灵气浓郁'][index % 5]}的灵泉，泉水从石缝中涌出，散发着淡淡的灵光，空气中弥漫着浓郁的灵气。你仔细观察，发现这处灵泉品质不错，显然是经过长时间孕育的优质灵泉。你蹲下身来，用手捧起一些灵泉水，一饮而尽，顿时感到一股暖流从喉咙流入体内，感觉修为有所提升，体内的灵气也变得更加精纯了。`,
        `你在一处${['隐蔽', '神秘', '古老', '珍贵', '稀有'][index % 5]}的地方发现了一处灵泉，泉水从石缝中涌出，散发着淡淡的灵光，空气中弥漫着浓郁的灵气。你仔细观察，发现这处灵泉品质不错，显然是经过长时间孕育的优质灵泉。你蹲下身来，用手捧起一些灵泉水，一饮而尽，顿时感到一股暖流从喉咙流入体内，感觉身体充满了活力，仿佛所有的疲惫都一扫而空。`,
        `你在一处${['山洞', '山谷', '森林', '山崖', '地底'][index % 5]}中探索时，突然听到潺潺的水声。你循声寻找，发现了一处灵泉，泉水清澈见底，散发着淡淡的灵光，空气中弥漫着浓郁的灵气。你蹲下身来，用手捧起一些灵泉水，一饮而尽，顿时感到一股暖流从喉咙流入体内，瞬间传遍全身，感觉身体充满了活力，仿佛所有的疲惫都一扫而空。`,
        `你偶然发现了一处灵泉，泉水从石缝中涌出，散发着淡淡的灵光，空气中弥漫着浓郁的灵气。你仔细观察，发现这处灵泉品质不错，显然是经过长时间孕育的优质灵泉。你蹲下身来，用手捧起一些灵泉水，一饮而尽，顿时感到一股暖流从喉咙流入体内，感觉修为有所提升，体内的灵气也变得更加精纯了。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 20, 50, 280),
        expChange: randomInt(index, 25, 65, 290),
        eventColor: 'gain',
      };
    }

    case 'pet': {
      // 从常量池中获取灵宠模板
      const availablePets = PET_TEMPLATES.map(pet => pet.id);
      const petId = selectFromArray(availablePets, index);
      const stories = [
        `你在${['森林', '山洞', '山谷', '河边', '山崖'][index % 5]}中探索时，突然听到一阵轻微的响动。你循声寻找，发现了一只${['受伤', '幼小', '可爱', '神秘', '稀有'][index % 5]}的灵兽，它正警惕地看着你，眼中闪烁着灵性的光芒。你缓缓靠近，运转功法，释放出善意，灵兽似乎感受到了你的善意，逐渐放松了警惕。你与它建立了联系，它愿意跟随你，成为你的伙伴。`,
        `你在一处${['隐蔽', '神秘', '古老', '珍贵', '稀有'][index % 5]}的地方探索时，突然感到一股灵兽的气息。你循着气息寻找，发现了一只灵兽，它正静静地站在那里，眼中闪烁着灵性的光芒。你缓缓靠近，运转功法，释放出善意，灵兽似乎感受到了你的善意，主动走了过来。你与它建立了联系，它愿意跟随你，成为你的伙伴。`,
        `你在一处${['森林', '山洞', '山谷', '河边', '山崖'][index % 5]}中探索时，突然听到一阵轻微的响动。你循声寻找，发现了一只灵兽，它正警惕地看着你，眼中闪烁着灵性的光芒。你缓缓靠近，运转功法，释放出善意，灵兽似乎感受到了你的善意，逐渐放松了警惕。你与它建立了联系，它愿意跟随你，成为你的伙伴。`,
        `你偶然遇到了一只${['受伤', '幼小', '可爱', '神秘', '稀有'][index % 5]}的灵兽，它看起来十分虚弱，显然是遭遇了什么困难。你见它需要帮助，便主动上前，运转功法，释放出善意，同时用灵气为它疗伤。灵兽似乎感受到了你的善意，逐渐放松了警惕。你与它建立了联系，它愿意跟随你，成为你的伙伴。`,
        `你在一处${['隐蔽', '神秘', '古老', '珍贵', '稀有'][index % 5]}的地方探索时，突然感到一股灵兽的气息。你循着气息寻找，发现了一只灵兽，它正静静地站在那里，眼中闪烁着灵性的光芒。你缓缓靠近，运转功法，释放出善意，灵兽似乎感受到了你的善意，主动走了过来。你与它建立了联系，它愿意跟随你，成为你的伙伴。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 20, 50, 300),
        eventColor: 'special',
        petObtained: petId,
      };
    }

    case 'petOpportunity': {
      const opportunityTypes: Array<'evolution' | 'level' | 'stats' | 'exp'> = ['evolution', 'level', 'stats', 'exp'];
      const type = selectFromArray(opportunityTypes, index);
      const typeDesc = {
        evolution: '成功进化，身体发生了巨大的变化，实力大幅提升',
        level: '等级提升，实力更加强大',
        stats: '属性增强，各项能力都有了显著提升',
        exp: '获得经验，对修炼有了更深的理解'
      }[type];

      const locations = [getFromConstArray(CULTIVATION_LOCATIONS, index), getFromConstArray(QUALITY_WORDS, index)];
      const stories = [
        `你的灵宠在一处${locations[0]}中探索时，突然感到一股浓郁的灵气。它循着灵气寻找，发现了一处机缘之地。灵宠在那里停留了许久，吸收了大量的灵气，${typeDesc}。你看到灵宠的变化，心中充满了喜悦。`,
        `你在一处${locations[1]}的地方探索时，你的灵宠突然变得兴奋起来，它似乎感受到了什么。你跟着灵宠，来到了一处机缘之地。灵宠在那里停留了许久，吸收了大量的灵气，${typeDesc}。你看到灵宠的变化，心中充满了喜悦。`,
        `你的灵宠在一处${locations[0]}中探索时，突然感到一股浓郁的灵气。它循着灵气寻找，发现了一处机缘之地。灵宠在那里停留了许久，吸收了大量的灵气，${typeDesc}。你看到灵宠的变化，心中充满了喜悦。`,
        `你在一处${locations[1]}的地方探索时，你的灵宠突然变得兴奋起来，它似乎感受到了什么。你跟着灵宠，来到了一处机缘之地。灵宠在那里停留了许久，吸收了大量的灵气，${typeDesc}。你看到灵宠的变化，心中充满了喜悦。`,
        `你的灵宠在一处${locations[0]}中探索时，突然感到一股浓郁的灵气。它循着灵气寻找，发现了一处机缘之地。灵宠在那里停留了许久，吸收了大量的灵气，${typeDesc}。你看到灵宠的变化，心中充满了喜悦。`,
      ];

      const petOpportunity: AdventureResult['petOpportunity'] = type === 'evolution'
        ? { type: 'evolution' }
        : type === 'level'
        ? { type: 'level', levelGain: randomInt(index, 1, 4, 310) }
        : type === 'stats'
        ? {
            type: 'stats',
            statsBoost: {
              attack: randomInt(index, 10, 30, 320),
              defense: randomInt(index, 8, 23, 330),
              hp: randomInt(index, 30, 80, 340),
              speed: randomInt(index, 5, 15, 350),
            }
          }
        : { type: 'exp', expGain: randomInt(index, 50, 150, 360) };

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: randomInt(index, 10, 30, 370),
        eventColor: 'special',
        petOpportunity,
      };
    }

    case 'trap': {
      const stories = [
        `你在探索时，脚下突然传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，${['陷阱', '机关', '禁制', '阵法', '毒气'][index % 5]}已经被触发。你拼尽全力闪避，虽然及时反应，但还是被${['陷阱', '机关', '禁制', '阵法', '毒气'][index % 5]}的余波击中，受了些伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周，生怕还有其他的危险。`,
        `你在一处${['古墓', '遗迹', '洞府', '秘境', '禁地'][index % 5]}中探索时，四周静得可怕，只有你的脚步声在回荡。你小心翼翼地前行，突然，脚下传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，机关已经被触发。你拼尽全力闪避，但还是被机关击中，受了伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周。`,
        `你在${['探索', '赶路', '休息', '战斗', '修炼'][index % 5]}时，突然感到脚下传来一阵异样的感觉。你心中一惊，知道不妙，立即运转功法，想要后退，但已经来不及了，陷阱已经被触发。你拼尽全力闪避，但还是被陷阱击中，受了伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周，生怕还有其他的危险。`,
        `你在一处${['险地', '禁地', '危险区域', '魔域', '死地'][index % 5]}中探索时，四周弥漫着危险的气息，空气中仿佛都带着杀意。你小心翼翼地前行，突然，脚下传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，陷阱已经被触发。你拼尽全力闪避，但还是被陷阱击中，受了伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周。`,
        `你在探索时，脚下突然传来"咔嚓"一声，你心中一惊，知道不妙。你迅速运转功法，想要后退，但已经来不及了，陷阱已经被触发。你拼尽全力闪避，虽然及时反应，但还是被陷阱的余波击中，受了些伤。你不敢大意，立即运转功法疗伤，同时警惕地观察四周，生怕还有其他的危险。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 30, 80, 380),
        expChange: randomInt(index, 10, 30, 390),
        eventColor: 'danger',
      };
    }

    case 'evilCultivator': {
      const stories = [
        `你在一处${['偏僻', '阴暗', '危险', '禁地', '魔域'][index % 5]}的地方探索时，突然感到一股强烈的杀意袭来。你迅速转身，发现一位${['邪修', '魔修', '恶人', '歹徒', '敌人'][index % 5]}正虎视眈眈地盯着你，眼中闪烁着贪婪和杀意。对方二话不说，直接发动攻击，你不敢大意，立即运转功法，祭出法宝，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。`,
        `你在一处${['荒山', '野岭', '古墓', '遗迹', '禁地'][index % 5]}中探索时，突然听到一阵阴冷的笑声。你循声望去，发现一位${['邪修', '魔修', '恶人', '歹徒', '敌人'][index % 5]}正站在不远处，眼中闪烁着贪婪和杀意。对方见你发现了自己，不再隐藏，直接发动攻击。你不敢大意，立即运转功法，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。`,
        `你遇到了一位${['邪修', '魔修', '恶人', '歹徒', '敌人'][index % 5]}，对方见你独自一人，眼中闪过一丝贪婪，直接发动攻击。你不敢大意，立即运转功法，祭出法宝，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。你检查了对方的遗物，发现了一些有用的物品。`,
        `你在一处${['偏僻', '阴暗', '危险', '禁地', '魔域'][index % 5]}的地方探索时，突然感到一股强烈的杀意袭来。你迅速转身，发现一位${['邪修', '魔修', '恶人', '歹徒', '敌人'][index % 5]}正虎视眈眈地盯着你，眼中闪烁着贪婪和杀意。对方二话不说，直接发动攻击，你不敢大意，立即运转功法，祭出法宝，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。`,
        `你在一处${['荒山', '野岭', '古墓', '遗迹', '禁地'][index % 5]}中探索时，突然听到一阵阴冷的笑声。你循声望去，发现一位${['邪修', '魔修', '恶人', '歹徒', '敌人'][index % 5]}正站在不远处，眼中闪烁着贪婪和杀意。对方见你发现了自己，不再隐藏，直接发动攻击。你不敢大意，立即运转功法，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: -randomInt(index, 40, 100, 400),
        expChange: randomInt(index, 40, 100, 410),
        spiritStonesChange: randomInt(index, 50, 130, 420),
        eventColor: 'danger',
        itemObtained: randomChance(index, 0.4, 430) ? generateRandomItem(rarity, index) : undefined,
      };
    }

    case 'reputation': {
      const reputationEvents = [
        {
          title: '救助受伤的修士',
          description: '你在路上遇到了一位受伤的修士，他请求你的帮助。',
          choices: [
            { text: '出手相助', reputationChange: 15, expChange: 30, description: '你帮助了对方，获得了感谢和报酬。' },
            { text: '视而不见', reputationChange: -10, description: '你选择了无视，但内心有些不安。' },
            { text: '索要报酬', reputationChange: -5, spiritStonesChange: 50, description: '你帮助了对方，但要求了报酬。' },
          ],
        },
        {
          title: '发现秘密',
          description: '你偶然发现了一个秘密，这可能会影响某些人的利益。',
          choices: [
            { text: '公开秘密', reputationChange: 20, description: '你公开了秘密，获得了正义之士的赞赏。' },
            { text: '保守秘密', reputationChange: 5, description: '你选择了保守秘密，避免引起纷争。' },
            { text: '利用秘密', reputationChange: -15, spiritStonesChange: 100, description: '你利用秘密获得了利益，但名声受损。' },
          ],
        },
        {
          title: '惩恶扬善',
          description: '你遇到了一群恶人在欺负弱者，你决定出手。',
          choices: [
            { text: '出手相助', reputationChange: 25, hpChange: -20, description: '你出手相助，击败了恶人，获得了众人的赞赏。' },
            { text: '暗中帮助', reputationChange: 10, description: '你暗中帮助了弱者，但没有人知道。' },
            { text: '视而不见', reputationChange: -20, description: '你选择了无视，名声受损。' },
          ],
        },
      ];
      const event = selectFromArray(reputationEvents, index);
      return {
        ...baseTemplate,
        story: `你遇到了一个需要做出选择的情况：${event.description}`,
        hpChange: 0,
        expChange: randomInt(index, 20, 50, 440),
        eventColor: 'normal',
        reputationEvent: event,
      };
    }

    case 'foundationTreasure': {
      return generateAdvancedItemTemplate(
        index,
        Object.values(FOUNDATION_TREASURES),
        'foundationTreasure',
        'foundationTreasure',
        (name, idx) => [
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}中探索时，突然感到一股奇异的波动。你循着波动寻找，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的所在，那里摆放着一个${getFromConstArray(CONTAINER_WORDS, idx)}。你小心地打开，发现里面竟然是一份${name}！这正是筑基所需的奇物，你心中大喜，将其小心收好。`,
          `你在探索时，偶然遇到了一位${getFromConstArray(ELDER_TYPES, idx)}。对方见你资质不错，又正好处于筑基关口，便赠与了你一份${name}。你感激不尽，知道这正是筑基所需的重要奇物。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}的深处，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的祭坛。祭坛上摆放着几件物品，其中一件正是${name}。你感受到其中蕴含的强大力量，知道这正是筑基所需的奇物，便将其取走。`,
          `你在探索时，偶然发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的灵地。那里灵气浓郁，似乎有什么宝物。你仔细搜索，在一个隐蔽的地方发现了一份${name}。你感受到其中蕴含的筑基之力，心中充满了喜悦。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}中，意外触发了一个${getFromConstArray(QUALITY_WORDS, idx)}的机关。机关启动后，一个${getFromConstArray(CONTAINER_WORDS, idx)}从暗格中弹出。你打开一看，里面竟然是一份${name}！这正是你筑基所需的奇物。`,
        ],
        [10, 30],
        [30, 80],
        460,
        470
      );
    }

    case 'heavenEarthEssence': {
      return generateAdvancedItemTemplate(
        index,
        Object.values(HEAVEN_EARTH_ESSENCES),
        'heavenEarthEssence',
        'heavenEarthEssence',
        (name, idx) => [
          `你在探索时，突然感受到一股强大的天地之力。你循着这股力量寻找，在一处${getFromConstArray(COMMON_LOCATIONS, idx)}中发现了一个${getFromConstArray(QUALITY_WORDS, idx)}的${getFromConstArray(PLATFORM_WORDS, idx)}。祭坛中央悬浮着一团${name}，散发着强大的道韵。你小心地将其收集，知道这正是晋升元婴所需的重要精华。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}的深处，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的天地精华汇聚之地。那里灵气浓郁得几乎要凝成实质，中央悬浮着一团${name}。你感受到其中蕴含的强大力量，知道这正是晋升元婴所需的天地精华，便将其小心收集。`,
          `你偶然遇到了一位${getFromConstArray(ELDER_TYPES, idx)}，对方见你即将突破元婴，便告诉了你一处天地精华的所在。你按照指引前往，果然发现了一团${name}。你将其收集，心中充满了感激和喜悦。`,
          `你在探索一处${getFromConstArray(COMMON_LOCATIONS, idx)}时，突然感受到天地间传来的强烈波动。你循着波动寻找，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的所在，那里汇聚着强大的天地精华，中央悬浮着一团${name}。你将其收集，知道这正是晋升元婴所需的重要精华。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}中，意外发现了一个${getFromConstArray(QUALITY_WORDS, idx)}的${getFromConstArray(PLATFORM_WORDS, idx)}。法阵中央汇聚着强大的天地之力，凝聚成${name}。你感受到其中蕴含的强大道韵，将其小心收集，知道这正是晋升元婴所需的重要精华。`,
        ],
        [20, 50],
        [50, 120],
        480,
        490
      );
    }

    case 'heavenEarthMarrow': {
      return generateAdvancedItemTemplate(
        index,
        Object.values(HEAVEN_EARTH_MARROWS),
        'heavenEarthMarrow',
        'heavenEarthMarrow',
        (name, idx) => [
          `你在探索时，突然感受到一股极其强大的天地之力。你循着这股力量寻找，在一处${getFromConstArray(COMMON_LOCATIONS, idx)}的最深处，发现了一个${getFromConstArray(QUALITY_WORDS, idx)}的${getFromConstArray(PLATFORM_WORDS, idx)}。祭坛中央凝聚着一团${name}，散发着极其强大的道韵。你小心地将其收集，知道这正是晋升化神所需的珍贵之髓。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}的最深处，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的天地之髓汇聚之地。那里灵气浓郁得几乎要凝成实质，中央凝聚着一团${name}，散发着极其强大的力量。你感受到其中蕴含的化神之力，知道这正是晋升化神所需的天地之髓，便将其小心收集。`,
          `你偶然遇到了一位${getFromConstArray(ELDER_TYPES, idx)}，对方见你即将突破化神，便告诉了你一处天地之髓的所在。你按照指引前往，果然发现了一团${name}。你将其收集，心中充满了感激和喜悦，知道这需要经过炼化才能使用。`,
          `你在探索一处${getFromConstArray(COMMON_LOCATIONS, idx)}时，突然感受到天地间传来的极其强烈的波动。你循着波动寻找，发现了一处${getFromConstArray(QUALITY_WORDS, idx)}的所在，那里汇聚着极其强大的天地之髓，中央凝聚着一团${name}。你将其收集，知道这正是晋升化神所需的重要之髓，需要经过炼化才能使用。`,
          `你在一处${getFromConstArray(COMMON_LOCATIONS, idx)}的最深处，意外发现了一个${getFromConstArray(QUALITY_WORDS, idx)}的${getFromConstArray(PLATFORM_WORDS, idx)}。法阵中央汇聚着极其强大的天地之力，经过数万年的凝聚，形成了${name}。你感受到其中蕴含的强大道韵，将其小心收集，知道这正是晋升化神所需的珍贵之髓。`,
        ],
        [30, 70],
        [80, 150],
        500,
        510
      );
    }

    case 'heavenEarthSoul': {
      const selectedBoss = selectFromArray(Object.values(HEAVEN_EARTH_SOUL_BOSSES), index);
      const stories = [
        `你在探索一处${getFromConstArray(COMMON_LOCATIONS, index)}时，突然感受到一股极其强大的威压。你循着威压寻找，在一处${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}前，你看到了一个强大的存在——${selectedBoss.name}！这是天地之魄的化身，只有击败它，才能获得合道期的资格。你决定挑战这个强大的存在。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的最深处，突然感受到一股极其强大的天地之力。你循着这股力量寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。法阵中央，${selectedBoss.name}缓缓显现，这是天地之魄的化身。你感受到其中蕴含的强大力量，知道只有击败它，才能获得合道期的资格。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的深处，突然天地变色，强大的威压从天而降。你抬头望去，${selectedBoss.name}出现在你的面前，这是天地之魄的化身。${selectedBoss.description}。你感受到这是合道期的考验，只有击败它，才能获得合道期的资格。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}中探索时，突然感受到天地间传来的极其强烈的波动。你循着波动寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。法阵启动，${selectedBoss.name}从法阵中显现。这是天地之魄的化身，只有击败它，才能获得合道期的资格。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的最深处，突然感受到一股极其强大的气息。你循着气息寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。祭坛上，${selectedBoss.name}缓缓凝聚成形。${selectedBoss.description}。这是天地之魄的化身，只有击败它，才能获得合道期的资格。你决定迎接这个挑战。`,
      ];

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: 0,
        spiritStonesChange: 0,
        eventColor: 'danger',
        adventureType: 'dao_combining_challenge',
        heavenEarthSoulEncounter: selectedBoss.id,
      };
    }

    case 'longevityRule': {
      const selectedRule = selectFromArray(Object.values(LONGEVITY_RULES), index);
      const stories = [
        `你在探索时，突然感受到一股极其强大的规则之力。你循着这股力量寻找，在一处${getFromConstArray(COMMON_LOCATIONS, index)}的${getFromConstArray(QUALITY_WORDS, index)}所在，你发现了${selectedRule.name}的痕迹。这是掌控天地的规则之力，你尝试与之沟通，最终成功获得了它的认可。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的最深处，突然感受到天地间传来的极其强烈的规则波动。你循着波动寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。法阵中央，${selectedRule.name}的法则显现。${selectedRule.description}。你感受到其中蕴含的强大力量，经过一番参悟，成功掌握了这道规则之力。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的深处，突然天地变色，强大的规则之力从虚空中显现。你抬头望去，${selectedRule.name}的法则在你面前展开。${selectedRule.description}。你沉浸在对规则的参悟中，最终成功掌握了这道规则之力，这是掌控天地的力量！`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}中探索时，突然感受到天地间传来的极其强烈的规则波动。你循着波动寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。法阵启动，${selectedRule.name}的法则从法阵中显现。你感受到这是掌控天地的力量，经过一番参悟，成功掌握了这道规则之力。`,
        `你在一处${getFromConstArray(COMMON_LOCATIONS, index)}的最深处，突然感受到一股极其强大的规则气息。你循着气息寻找，发现了一个${getFromConstArray(QUALITY_WORDS, index)}的${getFromConstArray(PLATFORM_WORDS, index)}。祭坛上，${selectedRule.name}的法则缓缓凝聚成形。${selectedRule.description}。你沉浸在对规则的参悟中，最终成功掌握了这道规则之力，这是掌控天地的力量！`,
      ];

      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: randomInt(index, 50, 100, 520),
        expChange: randomInt(index, 200, 400, 530),
        spiritStonesChange: randomInt(index, 500, 1000, 540),
        eventColor: 'special',
        longevityRuleObtained: selectedRule.id, // 标记获得的规则之力ID
      };
    }

    case 'lottery': {
      const stories = [
        `你在${['路上', '山洞', '遗迹', '洞府', '秘境'][index % 5]}中探索时，突然发现地上散落着一些抽奖券，这些抽奖券看起来有些年头了，但依然保存完好。你将其收集起来，心中充满了期待，不知道这些抽奖券能带来什么好运。`,
        `你在一处${['隐蔽', '神秘', '古老', '珍贵', '稀有'][index % 5]}的地方探索时，突然发现了一些抽奖券，这些抽奖券被保存在一个木盒中，虽然已经有些年头，但依然保存完好。你打开木盒，取出抽奖券，心中充满了期待，不知道这些抽奖券能带来什么好运。`,
        `你偶然发现了一些抽奖券，这些抽奖券散落在地上，看起来有些年头了，但依然保存完好。你将其收集起来，心中充满了期待，不知道这些抽奖券能带来什么好运。`,
        `你在一处${['古墓', '遗迹', '洞府', '秘境', '禁地'][index % 5]}中探索时，突然发现了一些抽奖券，这些抽奖券被保存在一个石盒中，虽然已经有些年头，但依然保存完好。你打开石盒，取出抽奖券，心中充满了期待，不知道这些抽奖券能带来什么好运。`,
        `你在一处${['隐蔽', '神秘', '古老', '珍贵', '稀有'][index % 5]}的地方探索时，突然发现了一些抽奖券，这些抽奖券被保存在一个玉盒中，虽然已经有些年头，但依然保存完好。你打开玉盒，取出抽奖券，心中充满了期待，不知道这些抽奖券能带来什么好运。`,
      ];
      return {
        ...baseTemplate,
        story: selectFromArray(stories, index),
        hpChange: 0,
        expChange: 0,
        spiritStonesChange: 0,
        eventColor: 'gain',
        lotteryTicketsChange: randomInt(index, 1, 11, 450),
      };
    }

    default:
      return baseTemplate;
  }
}

/**
 * 生成大机缘事件模板
 */
function generateLuckyEventTemplate(index: number): AdventureEventTemplate {
  const places = ['古洞府', '上古遗迹', '仙府', '秘境', '禁地'];
  const treasures = ['传承', '宝藏', '机缘', '仙缘', '大道'];
  const qualities = ['神秘', '古老', '珍贵', '稀有', '传说'];
  const encounters = ['高人', '仙灵', '传承', '机缘', '大道'];

  const place = selectFromArray(places, index);
  const treasure = selectFromArray(treasures, index);
  const quality = selectFromArray(qualities, index);
  const encounter = selectFromArray(encounters, index);

  const stories = [
    `你在${place}中探索时，突然感到一股强烈的灵气波动。你循着灵气寻找，发现了一处${treasure}，这里散发着浓郁的光芒，空气中弥漫着强大的道韵。你小心翼翼地靠近，发现这里保存着许多珍贵的宝物和传承。你仔细搜索，获得了巨大的收获，心中充满了喜悦和激动。`,
    `你在一处${quality}的地方探索时，突然感到一股强大的气息。你循着气息寻找，遇到了一位${encounter}，对方见你资质不错，眼中闪过一丝赞赏。你们在一处僻静的地方坐下，对方开始传授你一些珍贵的知识和宝物。你获得了巨大的收获，心中充满了感激和喜悦。`,
    `你在一处${place}中探索时，突然感到一股强烈的灵气波动。你循着灵气寻找，发现了一处${treasure}，这里散发着浓郁的光芒，空气中弥漫着强大的道韵。你小心翼翼地靠近，发现这里保存着许多珍贵的宝物和传承。你仔细搜索，获得了巨大的收获，心中充满了喜悦和激动。`,
    `你在一处${quality}的地方探索时，突然感到一股强大的气息。你循着气息寻找，发现了一处${treasure}，这里散发着浓郁的光芒，空气中弥漫着强大的道韵。你小心翼翼地靠近，发现这里保存着许多珍贵的宝物和传承。你仔细搜索，获得了巨大的收获，心中充满了喜悦和激动。`,
    `你在一处${place}中探索时，突然感到一股强烈的灵气波动。你循着灵气寻找，发现了一处机缘之地，这里散发着浓郁的光芒，空气中弥漫着强大的道韵。你小心翼翼地靠近，发现这里保存着许多珍贵的宝物和传承。你仔细搜索，获得了巨大的收获，心中充满了喜悦和激动。`,
  ];

  const rarity: ItemRarity = randomChance(index, 0.5, 460) ? '传说' : '仙品';

  return {
    story: selectFromArray(stories, index),
    hpChange: randomInt(index, 30, 80, 470),
    expChange: randomInt(index, 300, 800, 480),
    spiritStonesChange: randomInt(index, 200, 500, 490),
    eventColor: 'special',
    adventureType: 'lucky',
    itemObtained: randomChance(index, 0.7, 500) ? generateRandomItem(rarity, index) : undefined,
    inheritanceLevelChange: randomChance(index, 0.1, 510) ? 1 : undefined, // 传承等级每次只能增加1级
    triggerSecretRealm: randomChance(index, 0.05, 530),
  };
}

/**
 * 生成秘境探索事件模板
 */
function generateSecretRealmEventTemplate(index: number): AdventureEventTemplate {
  const riskLevels: Array<'低' | '中' | '高' | '极度危险'> = ['低', '中', '高', '极度危险'];
  const riskLevel = selectFromArray(riskLevels, index);

  const encounters = ['守护妖兽', '绝迹宝物', '机关陷阱', '宝库传承', '其他修士'];
  const locations = ['古老遗迹', '奇异地形', '神秘禁地', '自然奇观', '危险区域'];

  const encounter = selectFromArray(encounters, index);
  const location = selectFromArray(locations, index);

  const stories = [
    `你在秘境中探索，四周弥漫着浓郁的灵气，空气中仿佛都带着神秘的气息。你小心翼翼地前行，突然发现了一处${encounter}，这里散发着强大的气息，显然不是凡物。你仔细观察，发现这里保存着许多珍贵的宝物和传承，但同时也充满了危险。`,
    `你在秘境深处探索，四周的景象变得越来越奇异，空气中弥漫着强大的道韵。你小心翼翼地前行，突然发现了一处${location}，这里散发着浓郁的光芒，显然不是凡物。你仔细观察，发现这里保存着许多珍贵的宝物和传承，但同时也充满了危险。`,
    `你在秘境中探索时，突然感到一股强烈的危险气息。你迅速运转功法，警惕地观察四周，发现遭遇了${encounter}。你不敢大意，立即运转功法，准备应对接下来的危险。`,
    `你在秘境深处探索，四周的景象变得越来越奇异，空气中弥漫着强大的道韵。你小心翼翼地前行，突然发现了一处${location}，这里散发着浓郁的光芒，显然不是凡物。你仔细观察，发现这里保存着许多珍贵的宝物和传承，但同时也充满了危险。`,
    `你在秘境中探索，四周弥漫着浓郁的灵气，空气中仿佛都带着神秘的气息。你小心翼翼地前行，突然发现了一处${encounter}，这里散发着强大的气息，显然不是凡物。你仔细观察，发现这里保存着许多珍贵的宝物和传承，但同时也充满了危险。`,
  ];

  const rarity: ItemRarity = riskLevel === '低' || riskLevel === '中' ? '稀有' : '传说';

  const baseRewards = {
    低: { exp: [50, 300], stones: [100, 600] },
    中: { exp: [100, 500], stones: [200, 1000] },
    高: { exp: [200, 800], stones: [400, 1500] },
    极度危险: { exp: [400, 1200], stones: [800, 2500] },
  } as const;

  const rewards = baseRewards[riskLevel];

  return {
    story: selectFromArray(stories, index),
    hpChange: riskLevel === '极度危险'
      ? -randomInt(index, 50, 150, 540)
      : -randomInt(index, 20, 80, 550),
    expChange: randomInt(index, rewards.exp[0], rewards.exp[1], 560),
    spiritStonesChange: randomInt(index, rewards.stones[0], rewards.stones[1], 570),
    eventColor: riskLevel === '极度危险' ? 'danger' : 'gain',
    adventureType: 'secret_realm',
    riskLevel,
    itemObtained: randomChance(index, 0.6, 580) ? generateRandomItem(rarity, index) : undefined,
    attributeReduction: riskLevel === '极度危险' && randomChance(index, 0.3, 590) ? {
      attack: randomInt(index, 20, 70, 600),
      defense: randomInt(index, 15, 45, 610),
    } : undefined,
  };
}

/**
 * 生成宗门挑战事件模板
 */
function generateSectChallengeEventTemplate(index: number): AdventureEventTemplate {
  const missions = ['任务', '挑战', '试炼', '考验', '委托'];
  const locations = ['险地', '禁地', '危险区域', '魔域', '死地'];
  const threats = ['敌人', '妖兽', '陷阱', '机关', '危险'];

  const mission = selectFromArray(missions, index);
  const location = selectFromArray(locations, index);
  const threat = selectFromArray(threats, index);

  const stories = [
    `你接受了宗门的${mission}，这是一个重要的任务，关系到宗门的声誉和利益。你收拾好行装，前往执行任务。一路上，你遇到了许多困难和挑战，但你凭借着自己的实力和智慧，一一克服了这些困难，最终成功完成了任务。`,
    `你在一处${location}中执行宗门任务，这里充满了危险，空气中弥漫着杀意。你小心翼翼地前行，突然遭遇了${threat}。你不敢大意，立即运转功法，与对方展开激战。经过一番激烈的搏斗，你终于将其击败，但自己也受了些伤。`,
    `你接受了宗门的${mission}，这是一个重要的任务，关系到宗门的声誉和利益。你收拾好行装，前往执行任务。一路上，你遇到了许多困难和挑战，但你凭借着自己的实力和智慧，一一克服了这些困难，最终成功完成了任务。宗门对你的表现非常满意，给予了丰厚的奖励。`,
    `你在一处${location}中执行宗门任务，这里充满了危险，空气中弥漫着杀意。你小心翼翼地前行，遇到了许多困难和挑战，但你凭借着自己的实力和智慧，一一克服了这些困难，最终成功完成了任务。`,
    `你接受了宗门的${mission}，这是一个重要的任务，关系到宗门的声誉和利益。你收拾好行装，前往执行任务。一路上，你遇到了许多困难和挑战，但你凭借着自己的实力和智慧，一一克服了这些困难，最终成功完成了任务。`,
  ];

  return {
    story: selectFromArray(stories, index),
    hpChange: randomChance(index, 0.5, 620) ? -randomInt(index, 20, 60, 630) : 0,
    expChange: randomInt(index, 50, 150, 640),
    spiritStonesChange: randomInt(index, 100, 250, 650),
    eventColor: 'gain',
    adventureType: 'sect_challenge',
    reputationChange: randomInt(index, 10, 30, 660),
    itemObtained: randomChance(index, 0.4, 670) ? generateRandomItem('稀有', index) : undefined,
  };
}

/**
 * 效果对象接口（用于转换）
 */
interface EffectSource {
  hpBonus?: number;
  attackBonus?: number;
  defenseBonus?: number;
  spiritBonus?: number;
  physiqueBonus?: number;
  speedBonus?: number;
}

/**
 * 将effects对象转换为permanentEffect格式
 */
function convertEffectsToPermanentEffect(effects: EffectSource): Record<string, number> {
  const permanentEffect: Record<string, number> = {};
  if (effects.hpBonus !== undefined) permanentEffect.maxHp = effects.hpBonus;
  if (effects.attackBonus !== undefined) permanentEffect.attack = effects.attackBonus;
  if (effects.defenseBonus !== undefined) permanentEffect.defense = effects.defenseBonus;
  if (effects.spiritBonus !== undefined) permanentEffect.spirit = effects.spiritBonus;
  if (effects.physiqueBonus !== undefined) permanentEffect.physique = effects.physiqueBonus;
  if (effects.speedBonus !== undefined) permanentEffect.speed = effects.speedBonus;
  return permanentEffect;
}

/**
 * 效果对象接口
 */
interface EffectObject {
  exp?: number;
  hp?: number;
  attack?: number;
  defense?: number;
  spirit?: number;
  physique?: number;
  speed?: number;
  maxHp?: number;
  maxLifespan?: number;
}

/**
 * 应用仙品丹药效果最小值保障
 */
function applyImmortalPillMinValues(
  effect: EffectObject,
  rarity: ItemRarity
): void {
  if (rarity !== '仙品') return;

  if (effect.exp !== undefined) {
    effect.exp = Math.max(effect.exp, MIN_PILL_EXP_EFFECT);
  }
  if (effect.hp !== undefined) {
    effect.hp = Math.max(effect.hp, MIN_PILL_EFFECT);
  }
  if (effect.attack !== undefined) {
    effect.attack = Math.max(effect.attack, MIN_PILL_EFFECT);
  }
  if (effect.defense !== undefined) {
    effect.defense = Math.max(effect.defense, MIN_PILL_EFFECT);
  }
  if (effect.spirit !== undefined) {
    effect.spirit = Math.max(effect.spirit, MIN_PILL_EFFECT);
  }
  if (effect.physique !== undefined) {
    effect.physique = Math.max(effect.physique, MIN_PILL_EFFECT);
  }
  if (effect.speed !== undefined) {
    effect.speed = Math.max(effect.speed, MIN_PILL_EFFECT);
  }
}

/**
 * 根据境界调整丹药/草药的效果
 */
function adjustPillHerbEffects(
  effect: EffectObject | undefined,
  permanentEffect: EffectObject | undefined,
  rarity: ItemRarity,
  realmMultiplier: number
): { effect: EffectObject | undefined; permanentEffect: EffectObject | undefined } {
  const adjustedEffect = effect ? { ...effect } : undefined;
  const adjustedPermanentEffect = permanentEffect ? { ...permanentEffect } : undefined;

  // 调整临时效果
  if (adjustedEffect) {
    const pillEffectMultiplier = realmMultiplier * 2;
    if (adjustedEffect.exp !== undefined) adjustedEffect.exp = Math.floor(adjustedEffect.exp * pillEffectMultiplier);
    if (adjustedEffect.hp !== undefined) adjustedEffect.hp = Math.floor(adjustedEffect.hp * pillEffectMultiplier);
    if (adjustedEffect.attack !== undefined) adjustedEffect.attack = Math.floor(adjustedEffect.attack * pillEffectMultiplier);
    if (adjustedEffect.defense !== undefined) adjustedEffect.defense = Math.floor(adjustedEffect.defense * pillEffectMultiplier);
    if (adjustedEffect.spirit !== undefined) adjustedEffect.spirit = Math.floor(adjustedEffect.spirit * pillEffectMultiplier);
    if (adjustedEffect.physique !== undefined) adjustedEffect.physique = Math.floor(adjustedEffect.physique * pillEffectMultiplier);
    if (adjustedEffect.speed !== undefined) adjustedEffect.speed = Math.floor(adjustedEffect.speed * pillEffectMultiplier);

    // 仙品丹药效果最小值保障
    applyImmortalPillMinValues(adjustedEffect, rarity);
  }

  // 调整永久效果
  if (adjustedPermanentEffect) {
    const pillPermanentMultiplier = realmMultiplier * 1.5;
    if (adjustedPermanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(adjustedPermanentEffect.maxHp * pillPermanentMultiplier);
    if (adjustedPermanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(adjustedPermanentEffect.attack * pillPermanentMultiplier);
    if (adjustedPermanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(adjustedPermanentEffect.defense * pillPermanentMultiplier);
    if (adjustedPermanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(adjustedPermanentEffect.spirit * pillPermanentMultiplier);
    if (adjustedPermanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(adjustedPermanentEffect.physique * pillPermanentMultiplier);
    if (adjustedPermanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(adjustedPermanentEffect.speed * pillPermanentMultiplier);
    if (adjustedPermanentEffect.maxLifespan !== undefined) adjustedPermanentEffect.maxLifespan = Math.floor(adjustedPermanentEffect.maxLifespan * pillPermanentMultiplier);

    // 仙品丹药永久效果最小值保障
    applyImmortalPillMinValues(adjustedPermanentEffect, rarity);
  }

  return { effect: adjustedEffect, permanentEffect: adjustedPermanentEffect };
}

/**
 * 从常量池中获取随机物品
 */
function generateRandomItem(rarity: ItemRarity, index: number): AdventureResult['itemObtained'] {
  const allItems = getAllItemsFromConstants();

  // 根据稀有度筛选物品
  let filteredItems = allItems.filter(item => item.rarity === rarity);

  // 如果该稀有度的物品太少，放宽条件
  if (filteredItems.length < 3) {
    // 允许使用相邻稀有度的物品
    const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
    const currentIndex = rarityOrder.indexOf(rarity);
    const allowedRarities: ItemRarity[] = [rarity];
    if (currentIndex > 0) allowedRarities.push(rarityOrder[currentIndex - 1]);
    if (currentIndex < rarityOrder.length - 1) allowedRarities.push(rarityOrder[currentIndex + 1]);
    filteredItems = allItems.filter(item => allowedRarities.includes(item.rarity));
  }

  // 如果还是没有，使用所有物品
  if (filteredItems.length === 0) {
    filteredItems = allItems;
  }

  // 使用确定性随机数生成器选择物品，增加随机性
  // 使用多个偏移量组合，避免固定模式
  const randomOffset1 = deterministicRandom(index, 100);
  const randomOffset2 = deterministicRandom(index, 200);
  const randomOffset3 = deterministicRandom(index, 300);
  // 组合多个随机数，增加随机性
  let combinedRandom = (randomOffset1 + randomOffset2 + randomOffset3) / 3;

  // 如果物品池较大，进行二次随机化
  if (filteredItems.length > 10) {
    // 使用额外的随机偏移，增加随机性
    const additionalRandom = deterministicRandom(index, 400);
    combinedRandom = (combinedRandom + additionalRandom) / 2;
  }

  // 使用 Fisher-Yates 风格的随机选择，增加随机性
  // 先打乱数组顺序（基于确定性随机数）
  const shuffledItems = [...filteredItems];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(deterministicRandom(index, 500 + i) * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  const selectedIndex = Math.floor(combinedRandom * shuffledItems.length);
  const selectedItem = shuffledItems[selectedIndex];

  if (!selectedItem) {
    // 如果常量池中没有物品，返回一个默认物品
    return {
      name: '未知物品',
      type: ItemType.Material,
      description: '一个神秘的物品。',
      rarity: '普通',
    };
  }

  // 验证物品类型是否为有效的 ItemType（常量池中的类型应该是正确的）
  const itemType = Object.values(ItemType).includes(selectedItem.type as ItemType)
    ? (selectedItem.type as ItemType)
    : ItemType.Material; // 如果类型无效，默认为材料

  // 构建返回的物品对象（直接使用常量池中的数据，不需要推断）
  const result: AdventureResult['itemObtained'] = {
    name: selectedItem.name,
    type: itemType,
    description: selectedItem.description || '一个神秘的物品。',
    rarity: selectedItem.rarity || '普通',
  };

  // 添加效果（常量池中的效果已经是正确的）
  if (selectedItem.effect && typeof selectedItem.effect === 'object') {
    result.effect = selectedItem.effect;
  }

  if (selectedItem.permanentEffect && typeof selectedItem.permanentEffect === 'object') {
    result.permanentEffect = selectedItem.permanentEffect;
  }

  // 如果草药或丹药没有效果，尝试从丹药定义中获取
  if ((itemType === ItemType.Herb || itemType === ItemType.Pill) &&
      !result.effect && !result.permanentEffect) {
    const pillDef = getPillDefinition(selectedItem.name);
    if (pillDef) {
      if (pillDef.effect) {
        result.effect = pillDef.effect;
      }
      if (pillDef.permanentEffect) {
        result.permanentEffect = pillDef.permanentEffect;
      }
    }
  }

  // 添加装备相关属性（常量池中的装备信息应该是正确的）
  if (selectedItem.isEquippable) {
    result.isEquippable = true;
    if (selectedItem.equipmentSlot) {
      // 验证 equipmentSlot 是否为有效的 EquipmentSlot
      const validSlots = Object.values(EquipmentSlot);
      if (validSlots.includes(selectedItem.equipmentSlot as EquipmentSlot)) {
        result.equipmentSlot = selectedItem.equipmentSlot as EquipmentSlot;
      }
    }
  }

  // 添加进阶物品相关属性（如果物品是进阶物品）
  if (itemType === ItemType.AdvancedItem) {
    if (selectedItem.advancedItemType) {
      result.advancedItemType = selectedItem.advancedItemType;
    }
    if (selectedItem.advancedItemId) {
      result.advancedItemId = selectedItem.advancedItemId;
    }
  }

  // 测试环境验证物品数据
  if (import.meta.env.DEV) {
    // 验证物品类型和稀有度的匹配
    const typeRarityValid = result.type && result.rarity;
    if (!typeRarityValid) {
      logger.warn('【物品验证警告】物品类型或稀有度缺失:', {
        name: result.name,
        type: result.type,
        rarity: result.rarity,
      });
    }

    // 验证装备物品必须有槽位
    if (result.isEquippable && !result.equipmentSlot) {
      logger.warn('【物品验证警告】装备物品缺少槽位:', {
        name: result.name,
        type: result.type,
      });
    }

    // 验证草药和丹药必须有 effect 或 permanentEffect
    // 如果仍然没有效果，提供默认效果（避免警告，但记录日志）
    if ((result.type === ItemType.Herb || result.type === ItemType.Pill) &&
        !result.effect && !result.permanentEffect) {
      // 为草药和丹药提供默认效果，避免游戏逻辑错误
      if (result.type === ItemType.Herb) {
        result.effect = { hp: 50, exp: 10 };
        result.permanentEffect = { spirit: 1 };
      } else if (result.type === ItemType.Pill) {
        result.effect = { exp: 50 };
        result.permanentEffect = { spirit: 1 };
      }

      // 只在开发环境记录警告，生产环境使用默认效果
      if (import.meta.env.DEV) {
        logger.warn('【物品验证警告】草药或丹药缺少效果，已使用默认效果:', {
          name: result.name,
          type: result.type,
        });
      }
    }
  }

  return result;
}

/**
 * 初始化事件模板库（同步版本，用于直接生成）
 */
export function initializeEventTemplateLibrary(force: boolean = false): void {
  if (force || (eventTemplateLibrary.length === 0 && !isInitialized)) {
    eventTemplateLibrary = generateEventTemplateLibrary();
    isInitialized = true;
  }
}

/**
 * 从外部设置事件模板库（用于从 IndexedDB 加载）
 */
export function setEventTemplateLibrary(templates: AdventureEventTemplate[]): void {
  eventTemplateLibrary = templates;
  isInitialized = true;
}

/**
 * 获取当前事件模板库
 */
export function getEventTemplateLibrary(): AdventureEventTemplate[] {
  return eventTemplateLibrary;
}

/**
 * 检查事件模板库是否已初始化
 */
export function isEventTemplateLibraryInitialized(): boolean {
  return isInitialized && eventTemplateLibrary.length > 0;
}

/**
 * 从模板库中随机获取一个事件模板
 * 根据玩家境界调整事件类型和风险等级的分布
 */
export function getRandomEventTemplate(
  adventureType: AdventureType = 'normal',
  riskLevel?: '低' | '中' | '高' | '极度危险',
  playerRealm?: RealmType,
  playerRealmLevel?: number
): AdventureEventTemplate | null {
  if (eventTemplateLibrary.length === 0) {
    initializeEventTemplateLibrary();
  }

  // 计算玩家境界指数（0-6，对应7个境界）
  const realmIndex = playerRealm ? REALM_ORDER.indexOf(playerRealm) : 0;
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
  const realmLevel = playerRealmLevel || 1;

  // 境界进度：0.0（最低）到 1.0（最高）
  // 考虑境界和境界等级，最高境界9层时接近1.0
  const realmProgress = (validRealmIndex + (realmLevel - 1) / 9) / REALM_ORDER.length;

  // 根据类型和风险等级筛选
  let filtered = eventTemplateLibrary.filter(t => t.adventureType === adventureType);

  // 根据玩家境界过滤特殊事件
  if (playerRealm) {
    const spiritSeveringIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);
    const longevityRealmIndex = REALM_ORDER.indexOf(RealmType.LongevityRealm);
    const currentRealmIndex = REALM_ORDER.indexOf(playerRealm);

    filtered = filtered.filter(template => {
      // 天地之魄事件：只允许化神期及以上遇到
      if (template.heavenEarthSoulEncounter) {
        return currentRealmIndex >= spiritSeveringIndex;
      }

      // 规则之力事件：只允许长生境遇到
      if (template.longevityRuleObtained) {
        return currentRealmIndex >= longevityRealmIndex;
      }

      // 其他事件不受限制
      return true;
    });
  }

  // 如果指定了风险等级（秘境探索），根据境界调整风险等级分布
  if (riskLevel && adventureType === 'secret_realm') {
    filtered = filtered.filter(t => t.riskLevel === riskLevel);
  } else if (adventureType === 'secret_realm' && !riskLevel) {
    // 如果没有指定风险等级，根据境界调整风险等级分布
    // 高境界玩家更容易遇到高风险事件
    const riskWeights = {
      低: Math.max(0.25, 1.0 - realmProgress * 1.5),      // 低境界：高概率，高境界：低概率
      中: 1.0 - realmProgress * 0.5,                      // 中等概率
      高: 0.3 + realmProgress * 0.7,                      // 高境界：高概率
      极度危险: Math.min(0.8, realmProgress * 1.2),       // 只有高境界才容易遇到
    };

    // 根据权重随机选择风险等级
    // 注意：这里使用 Math.random() 而不是确定性随机数，因为每次调用都需要不同的随机结果
    const totalWeight = Object.values(riskWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedRiskLevel: '低' | '中' | '高' | '极度危险' = '低';

    for (const [level, weight] of Object.entries(riskWeights)) {
      random -= weight;
      if (random <= 0) {
        selectedRiskLevel = level as '低' | '中' | '高' | '极度危险';
        break;
      }
    }

    filtered = filtered.filter(t => t.riskLevel === selectedRiskLevel);
  }

  // 如果类型是 normal，根据境界调整事件类型分布
  // 高境界玩家更容易遇到高价值事件（大机缘、秘境等）
  if (adventureType === 'normal' && filtered.length > 0) {
    // 根据境界调整筛选权重
    // 高境界玩家：更多高价值事件（大机缘、秘境、宗门挑战）
    // 低境界玩家：更多普通事件

    const valueWeights = filtered.map(template => {
      // 根据事件的价值和稀有度计算权重
      let weight = 1.0;

      // 检查是否有稀有物品
      const hasRareItem = template.itemObtained || (template.itemsObtained && template.itemsObtained.length > 0);
      if (hasRareItem) {
        const itemRarity = template.itemObtained?.rarity || template.itemsObtained?.[0]?.rarity || '普通';
        if (itemRarity === '仙品') weight *= 0.1 + realmProgress * 2.0; // 高境界更容易
        else if (itemRarity === '传说') weight *= 0.3 + realmProgress * 1.5;
        else if (itemRarity === '稀有') weight *= 0.5 + realmProgress * 1.0;
        else weight *= 1.0 - realmProgress * 0.3; // 普通物品，高境界概率降低
      }

      // 检查奖励数值（高奖励更适合高境界）
      const totalReward = Math.abs(template.expChange) + Math.abs(template.spiritStonesChange);
      if (totalReward > 500) {
        weight *= 0.2 + realmProgress * 1.5; // 高奖励，高境界更容易
      } else if (totalReward > 200) {
        weight *= 0.5 + realmProgress * 1.0;
      } else {
        weight *= 1.0 - realmProgress * 0.3; // 低奖励，高境界概率降低
      }

      // 检查是否有特殊奖励（灵宠等）
      if (template.petObtained) {
        weight *= 0.3 + realmProgress * 1.2;
      }

      return { template, weight };
    });

    // 根据权重随机选择
    // 注意：这里使用 Math.random() 而不是确定性随机数，因为每次调用都需要不同的随机结果
    const totalWeight = valueWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { template, weight } of valueWeights) {
      random -= weight;
      if (random <= 0) {
        return template;
      }
    }

    // 如果权重选择失败，使用随机选择
    // 注意：这里使用 Math.random() 而不是确定性随机数，因为每次调用都需要不同的随机结果
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  if (filtered.length === 0) {
    // 如果没有匹配的，返回任意一个同类型的事件
    filtered = eventTemplateLibrary.filter(t => t.adventureType === adventureType);
  }

  if (filtered.length === 0) {
    // 如果还是没有，返回任意一个事件
    filtered = eventTemplateLibrary;
  }

  if (filtered.length === 0) {
    return null;
  }

  // 注意：这里使用 Math.random() 而不是确定性随机数，因为每次调用都需要不同的随机结果
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * 根据境界调整物品稀有度
 * 高境界玩家更容易获得稀有物品
 * @param baseRarity 基础稀有度
 * @param realm 玩家境界
 * @param realmLevel 境界等级
 * @param itemSeed 物品种子（用于确定性随机）
 * @returns 调整后的稀有度
 */
function adjustRarityByRealm(
  baseRarity: ItemRarity,
  realm: RealmType,
  realmLevel: number,
  itemSeed: number = 0
): ItemRarity {
  const realmIndex = REALM_ORDER.indexOf(realm);
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;

  // 计算境界进度（0.0 到 1.0）
  // 考虑境界和境界等级，最高境界9层时接近1.0
  const realmProgress = (validRealmIndex + (realmLevel - 1) / 9) / REALM_ORDER.length;

  // 稀有度顺序
  const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
  const currentRarityIndex = rarityOrder.indexOf(baseRarity);

  // 如果已经是最高稀有度，不提升
  if (currentRarityIndex >= rarityOrder.length - 1) {
    return baseRarity;
  }

  // 根据境界进度计算稀有度提升概率
  // 基础概率：低境界5%，高境界40%
  const baseUpgradeChance = 0.05 + realmProgress * 0.35;

  // 使用确定性随机数（基于境界、等级和物品种子）
  const randomSeed = validRealmIndex * 1000 + realmLevel * 100 + itemSeed;
  const randomValue = seededRandom(randomSeed);

  // 计算升级概率（考虑当前稀有度）
  // 普通->稀有：基础概率
  // 稀有->传说：基础概率 * 0.8
  // 传说->仙品：基础概率 * 0.5
  const rarityMultipliers = [1.0, 0.8, 0.5];
  const upgradeChance = baseUpgradeChance * (rarityMultipliers[currentRarityIndex] || 0.3);

  if (randomValue < upgradeChance) {
    // 升级到下一个稀有度
    return rarityOrder[currentRarityIndex + 1];
  } else if (randomValue < upgradeChance * 0.2 && currentRarityIndex < rarityOrder.length - 2) {
    // 小概率（20%的升级概率）直接升级两级（仅对普通和稀有）
    return rarityOrder[currentRarityIndex + 2];
  }

  // 保持原稀有度
  return baseRarity;
}

/**
 * 将模板转换为AdventureResult（根据玩家境界调整数值）
 */
export function templateToAdventureResult(
  template: AdventureEventTemplate,
  player: { realm: RealmType; realmLevel: number; maxHp: number }
): AdventureResult {
  // 计算境界倍数
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.3;
  const realmMultiplier = realmBaseMultiplier * levelMultiplier;

  // 调整数值
  const result: AdventureResult = {
    story: template.story,
    hpChange: Math.floor(template.hpChange * realmMultiplier),
    expChange: Math.floor(template.expChange * realmMultiplier),
    spiritStonesChange: Math.floor(template.spiritStonesChange * realmMultiplier),
    eventColor: template.eventColor,
    adventureType: template.adventureType, // 传递adventureType，用于判断是否需要触发战斗
  };

  // 确保hpChange不超过maxHp的50%
  const maxHpChange = Math.floor(player.maxHp * 0.5);
  if (Math.abs(result.hpChange) > maxHpChange) {
    result.hpChange = result.hpChange > 0 ? maxHpChange : -maxHpChange;
  }

  // 根据境界调整物品稀有度
  if (template.itemObtained !== undefined) {
    // 使用物品名称和类型作为种子，确保相同物品的稀有度调整是确定的
    const itemSeed = template.itemObtained.name.length * 100 + template.itemObtained.type.length;
    const adjustedRarity = adjustRarityByRealm(
      template.itemObtained.rarity as ItemRarity,
      player.realm,
      player.realmLevel,
      itemSeed
    );

    // 如果稀有度提升了，尝试找到相同类型但更高稀有度的物品
    // 如果找不到，保持原物品但提升稀有度（属性会在后续处理中调整）
    if (adjustedRarity !== template.itemObtained.rarity) {
      // 尝试从常量池中找到相同类型但更高稀有度的物品
      const allItems = getAllItemsFromConstants();
      const sameTypeItems = allItems.filter(
        item => item.type === template.itemObtained!.type && item.rarity === adjustedRarity
      );

      if (sameTypeItems.length > 0) {
        // 找到相同类型的高稀有度物品，使用它
        const selectedItem = selectFromArray(sameTypeItems, itemSeed);
        result.itemObtained = {
          name: selectedItem.name,
          type: selectedItem.type as ItemType,
          description: selectedItem.description,
          rarity: adjustedRarity,
          effect: selectedItem.effect,
          permanentEffect: selectedItem.permanentEffect,
          isEquippable: selectedItem.isEquippable,
          equipmentSlot: selectedItem.equipmentSlot as EquipmentSlot | undefined,
          // 保留进阶物品相关字段
          advancedItemType: template.itemObtained.advancedItemType,
          advancedItemId: template.itemObtained.advancedItemId,
        };
      } else {
        // 找不到相同类型的高稀有度物品，保持原物品但提升稀有度
        result.itemObtained = {
          ...template.itemObtained,
          rarity: adjustedRarity,
        };
      }
    } else {
      result.itemObtained = template.itemObtained;
    }

    // 对丹药和草药的效果根据境界倍数进行调整（提高属性值）
    if (result.itemObtained && result.itemObtained.rarity &&
        (result.itemObtained.type === ItemType.Pill || result.itemObtained.type === ItemType.Herb)) {
      const { effect: adjustedEffect, permanentEffect: adjustedPermanentEffect } = adjustPillHerbEffects(
        result.itemObtained.effect,
        result.itemObtained.permanentEffect,
        result.itemObtained.rarity as ItemRarity,
        realmMultiplier
      );
      result.itemObtained.effect = adjustedEffect;
      result.itemObtained.permanentEffect = adjustedPermanentEffect;
    }
  }

  if (template.itemsObtained !== undefined) {
    // 对多个物品也应用稀有度调整
    result.itemsObtained = template.itemsObtained.map((item, index) => {
      const itemSeed = item.name.length * 100 + item.type.length + index * 10;
      const adjustedRarity = adjustRarityByRealm(
        item.rarity as ItemRarity,
        player.realm,
        player.realmLevel,
        itemSeed
      );

      if (adjustedRarity !== item.rarity) {
        // 尝试找到相同类型但更高稀有度的物品
        const allItems = getAllItemsFromConstants();
        const sameTypeItems = allItems.filter(
          i => i.type === item.type && i.rarity === adjustedRarity
        );

        if (sameTypeItems.length > 0) {
          const selectedItem = selectFromArray(sameTypeItems, itemSeed);
          const adjustedItem = {
            name: selectedItem.name,
            type: selectedItem.type as ItemType,
            description: selectedItem.description,
            rarity: adjustedRarity,
            effect: selectedItem.effect,
            permanentEffect: selectedItem.permanentEffect,
            isEquippable: selectedItem.isEquippable,
            equipmentSlot: selectedItem.equipmentSlot as EquipmentSlot | undefined,
          };

          // 对丹药和草药的效果根据境界倍数进行调整
          if (adjustedItem.type === ItemType.Pill || adjustedItem.type === ItemType.Herb) {
            const { effect: adjustedEffect, permanentEffect: adjustedPermanentEffect } = adjustPillHerbEffects(
              adjustedItem.effect,
              adjustedItem.permanentEffect,
              adjustedRarity,
              realmMultiplier
            );
            adjustedItem.effect = adjustedEffect;
            adjustedItem.permanentEffect = adjustedPermanentEffect;
          }

          return adjustedItem;
        } else {
          // 保持原物品但提升稀有度
          const adjustedItem = {
            ...item,
            rarity: adjustedRarity,
          };

          // 对丹药和草药的效果根据境界倍数进行调整
          if (adjustedItem.type === ItemType.Pill || adjustedItem.type === ItemType.Herb) {
            const { effect: adjustedEffect, permanentEffect: adjustedPermanentEffect } = adjustPillHerbEffects(
              adjustedItem.effect,
              adjustedItem.permanentEffect,
              adjustedRarity,
              realmMultiplier
            );
            adjustedItem.effect = adjustedEffect;
            adjustedItem.permanentEffect = adjustedPermanentEffect;
          }

          return adjustedItem;
        }
      }

      // 对原始物品也应用倍数调整（如果是丹药或草药）
      if (item.type === ItemType.Pill || item.type === ItemType.Herb) {
        const { effect: adjustedEffect, permanentEffect: adjustedPermanentEffect } = adjustPillHerbEffects(
          item.effect,
          item.permanentEffect,
          item.rarity,
          realmMultiplier
        );
        return {
          ...item,
          effect: adjustedEffect,
          permanentEffect: adjustedPermanentEffect,
        };
      }

      return item;
    });
  }
  if (template.petObtained !== undefined) result.petObtained = template.petObtained;
  if (template.petOpportunity !== undefined) result.petOpportunity = template.petOpportunity;
  if (template.attributeReduction !== undefined) result.attributeReduction = template.attributeReduction;
  if (template.reputationChange !== undefined) result.reputationChange = template.reputationChange;
  if (template.reputationEvent !== undefined) result.reputationEvent = template.reputationEvent;
  if (template.inheritanceLevelChange !== undefined) result.inheritanceLevelChange = template.inheritanceLevelChange;
  if (template.triggerSecretRealm !== undefined) result.triggerSecretRealm = template.triggerSecretRealm;
  if (template.spiritualRootsChange !== undefined) result.spiritualRootsChange = template.spiritualRootsChange;
  if (template.lifespanChange !== undefined) result.lifespanChange = template.lifespanChange;
  if (template.lotteryTicketsChange !== undefined) result.lotteryTicketsChange = template.lotteryTicketsChange;
  if (template.longevityRuleObtained !== undefined) result.longevityRuleObtained = template.longevityRuleObtained;
  if (template.heavenEarthSoulEncounter !== undefined) result.heavenEarthSoulEncounter = template.heavenEarthSoulEncounter;
  if (template.adventureType !== undefined) result.adventureType = template.adventureType;

  // 测试环境打印事件模板返回结果
  if (import.meta.env.DEV) {
    logger.log('=== 事件模板返回结果 ===');
    logger.log('【模板信息】');
    logger.log('  事件类型:', template.adventureType);
    logger.log('  风险等级:', template.riskLevel || '无');
    logger.log('  事件描述:', template.story);
    logger.log('  原始数值:', {
      hpChange: template.hpChange,
      expChange: template.expChange,
      spiritStonesChange: template.spiritStonesChange,
    });
    logger.log('【玩家信息】');
    logger.log('  境界:', player.realm);
    logger.log('  境界等级:', player.realmLevel);
    logger.log('  最大气血:', player.maxHp);
    logger.log('  境界倍数:', realmMultiplier.toFixed(2));
    logger.log('【转换结果】');
    logger.log('  事件描述:', result.story);
    logger.log('  气血变化:', result.hpChange);
    logger.log('  修为变化:', result.expChange);
    logger.log('  灵石变化:', result.spiritStonesChange);
    logger.log('  事件颜色:', result.eventColor);
    if (result.itemObtained) {
      logger.log('  获得物品:', {
        name: result.itemObtained.name,
        type: result.itemObtained.type,
        rarity: result.itemObtained.rarity,
      });
    }
    if (result.itemsObtained && result.itemsObtained.length > 0) {
      logger.log('  获得多个物品:', result.itemsObtained.map(item => ({
        name: item.name,
        type: item.type,
        rarity: item.rarity,
      })));
    }
    if (result.petObtained) {
      logger.log('  获得灵宠:', result.petObtained);
    }
    if (result.petOpportunity) {
      logger.log('  灵宠机缘:', result.petOpportunity);
    }
    if (result.attributeReduction) {
      logger.log('  属性降低:', result.attributeReduction);
    }
    if (result.reputationChange) {
      logger.log('  声望变化:', result.reputationChange);
    }
    if (result.reputationEvent) {
      logger.log('  声望事件:', result.reputationEvent);
    }
    if (result.inheritanceLevelChange) {
      logger.log('  传承等级变化:', result.inheritanceLevelChange);
    }
    if (result.triggerSecretRealm) {
      logger.log('  触发秘境:', result.triggerSecretRealm);
    }
    if (result.spiritualRootsChange) {
      logger.log('  灵根变化:', result.spiritualRootsChange);
    }
    if (result.lifespanChange) {
      logger.log('  寿命变化:', result.lifespanChange);
    }
    if (result.lotteryTicketsChange) {
      logger.log('  抽奖券变化:', result.lotteryTicketsChange);
    }
    logger.log('======================');
  }

  return result;
}

