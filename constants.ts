import {
  RealmType,
  Item,
  ItemType,
  CultivationArt,
  SectRank,
  SecretRealm,
  Recipe,
  Talent,
  Title,
  EncounterEvent,
  ExplorationLocation,
  Achievement,
  PetTemplate,
  PetSkill,
  LotteryPrize,
  EquipmentSlot,
  Shop,
  ShopType,
  ItemRarity,
  DailyQuestType
} from './types';


export const REALM_ORDER = [
  RealmType.QiRefining,
  RealmType.Foundation,
  RealmType.GoldenCore,
  RealmType.NascentSoul,
  RealmType.SpiritSevering,
  RealmType.VoidRefining,
  RealmType.ImmortalAscension,
];

export const REALM_DATA: Record<
  RealmType,
  {
    baseMaxHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpirit: number; // 神识
    basePhysique: number; // 体魄
    baseSpeed: number; // 速度
    maxExpBase: number;
    baseMaxLifespan: number; // 基础最大寿命（年）
  }
> = {
  [RealmType.QiRefining]: {
    baseMaxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    baseSpirit: 5,
    basePhysique: 10,
    baseSpeed: 10,
    maxExpBase: 100,
    baseMaxLifespan: 100, // 炼气期基础寿命100年
  },
  [RealmType.Foundation]: {
    baseMaxHp: 500,
    baseAttack: 50,
    baseDefense: 25,
    baseSpirit: 25,
    basePhysique: 50,
    baseSpeed: 30,
    maxExpBase: 1000,
    baseMaxLifespan: 200, // 筑基期基础寿命200年
  },
  [RealmType.GoldenCore]: {
    baseMaxHp: 2500,
    baseAttack: 200,
    baseDefense: 100,
    baseSpirit: 100,
    basePhysique: 200,
    baseSpeed: 50,
    maxExpBase: 5000,
    baseMaxLifespan: 500, // 金丹期基础寿命500年
  },
  [RealmType.NascentSoul]: {
    baseMaxHp: 10000,
    baseAttack: 1000,
    baseDefense: 500,
    baseSpirit: 500,
    basePhysique: 1000,
    baseSpeed: 100,
    maxExpBase: 25000,
    baseMaxLifespan: 1000, // 元婴期基础寿命1000年
  },
  [RealmType.SpiritSevering]: {
    baseMaxHp: 50000,
    baseAttack: 5000,
    baseDefense: 2500,
    baseSpirit: 2500,
    basePhysique: 5000,
    baseSpeed: 200,
    maxExpBase: 100000,
    baseMaxLifespan: 2000, // 化神期基础寿命2000年
  },
  [RealmType.VoidRefining]: {
    baseMaxHp: 200000,
    baseAttack: 20000,
    baseDefense: 10000,
    baseSpirit: 10000,
    basePhysique: 20000,
    baseSpeed: 300,
    maxExpBase: 500000,
    baseMaxLifespan: 5000, // 炼虚期基础寿命5000年
  },
  [RealmType.ImmortalAscension]: {
    baseMaxHp: 1000000,
    baseAttack: 100000,
    baseDefense: 50000,
    baseSpirit: 50000,
    basePhysique: 100000,
    baseSpeed: 500,
    maxExpBase: 9999999,
    baseMaxLifespan: 10000, // 渡劫飞升基础寿命10000年
  },
};

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  普通: 1,
  稀有: 1.5,
  传说: 2.5,
  仙品: 5.0,
};

export const CULTIVATION_ARTS: CultivationArt[] = [
  {
    id: 'art-basic-breath',
    name: '吐纳法',
    type: 'mental',
    grade: '黄',
    description: '基础的呼吸吐纳之术，微弱提升修炼速度。',
    realmRequirement: RealmType.QiRefining,
    cost: 0,
    effects: { expRate: 0.1 },
  },
  {
    id: 'art-iron-skin',
    name: '铁皮功',
    type: 'body',
    grade: '黄',
    description: '锤炼皮肉，使其坚如凡铁。永久提升防御。',
    realmRequirement: RealmType.QiRefining,
    cost: 50,
    effects: { defense: 5, hp: 20 },
  },
  {
    id: 'art-spirit-cloud',
    name: '云灵诀',
    type: 'mental',
    grade: '黄',
    description: '云灵宗入门心法，吸纳灵气如云雾缭绕。',
    realmRequirement: RealmType.QiRefining,
    cost: 100,
    sectId: 'sect-cloud', // 云灵宗专属
    effects: { expRate: 0.25, attack: 5 },
  },
  {
    id: 'art-fiery-fist',
    name: '烈火拳',
    type: 'body',
    grade: '玄',
    description: '将灵气转化为烈火附着于双拳。大幅提升攻击力。',
    realmRequirement: RealmType.Foundation,
    cost: 300,
    spiritualRoot: 'fire',
    effects: { attack: 30 },
  },
  {
    id: 'art-jade-bone',
    name: '玉骨功',
    type: 'body',
    grade: '玄',
    description: '锻骨如玉，百毒不侵。大幅提升气血与防御。',
    realmRequirement: RealmType.Foundation,
    cost: 500,
    spiritualRoot: 'earth',
    effects: { defense: 20, hp: 100 },
  },
  {
    id: 'art-pure-yang',
    name: '纯阳无极功',
    type: 'mental',
    grade: '地',
    description: '至刚至阳的高深心法，修炼速度极快。',
    realmRequirement: RealmType.GoldenCore,
    cost: 2000,
    spiritualRoot: 'fire',
    effects: { expRate: 0.5, attack: 50 },
  },
  {
    id: 'art-thunder-sword',
    name: '天雷剑诀',
    type: 'body',
    grade: '地',
    description: '引九天神雷入剑，威力绝伦，若是肉身不够强横恐遭反噬。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3000,
    spiritualRoot: 'metal',
    effects: { attack: 150 },
  },
  {
    id: 'art-immortal-life',
    name: '长生诀',
    type: 'mental',
    grade: '天',
    description: '上古木系神功，生生不息，气血悠长。',
    realmRequirement: RealmType.NascentSoul,
    cost: 8000,
    spiritualRoot: 'wood',
    effects: { expRate: 0.6, hp: 2000 },
  },
  {
    id: 'art-void-body',
    name: '虚空霸体',
    type: 'body',
    grade: '天',
    description: '炼化虚空之力入体，肉身成圣。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 20000,
    effects: { defense: 500, attack: 500, hp: 5000 },
  },
  {
    id: 'art-wind-step',
    name: '御风步',
    type: 'body',
    grade: '黄',
    description: '身法如风，行动迅捷。提升攻击和速度。',
    realmRequirement: RealmType.QiRefining,
    cost: 80,
    effects: { attack: 8 },
  },
  {
    id: 'art-water-mirror',
    name: '水镜心法',
    type: 'mental',
    grade: '玄',
    description: '心如止水，明镜高悬。提升修炼速度和防御。',
    realmRequirement: RealmType.Foundation,
    cost: 400,
    spiritualRoot: 'water',
    effects: { expRate: 0.3, defense: 15 },
  },
  {
    id: 'art-earth-shield',
    name: '厚土护体',
    type: 'body',
    grade: '玄',
    description: '引大地之力护体，防御力极强。',
    realmRequirement: RealmType.Foundation,
    cost: 600,
    spiritualRoot: 'earth',
    effects: { defense: 40, hp: 150 },
  },
  {
    id: 'art-ice-soul',
    name: '冰心诀',
    type: 'mental',
    grade: '地',
    description: '心如寒冰，不为外物所动。大幅提升修炼速度。',
    realmRequirement: RealmType.GoldenCore,
    cost: 2500,
    effects: { expRate: 0.6, defense: 30 },
  },
  {
    id: 'art-dragon-fist',
    name: '龙拳',
    type: 'body',
    grade: '地',
    description: '拳如真龙，威力无穷。大幅提升攻击力。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3500,
    effects: { attack: 200 },
  },
  {
    id: 'art-phoenix-rebirth',
    name: '凤凰涅槃功',
    type: 'mental',
    grade: '天',
    description: '如凤凰涅槃，每次突破都能获得巨大提升。',
    realmRequirement: RealmType.NascentSoul,
    cost: 10000,
    effects: { expRate: 0.7, hp: 3000, attack: 100 },
  },
  {
    id: 'art-star-destruction',
    name: '星辰破灭诀',
    type: 'body',
    grade: '天',
    description: '引星辰之力，破灭万物。攻击力达到极致。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 25000,
    effects: { attack: 1000, defense: 200 },
  },
  {
    id: 'art-universe-devour',
    name: '吞天噬地',
    type: 'mental',
    grade: '天',
    description: '吞噬天地灵气，修炼速度达到极致。',
    realmRequirement: RealmType.VoidRefining,
    cost: 50000,
    effects: { expRate: 1.0, attack: 500, defense: 500, hp: 10000 },
  },
  // 新增20种功法
  {
    id: 'art-wooden-body',
    name: '木身功',
    type: 'body',
    grade: '黄',
    description: '基础炼体功法，如古木般坚韧。',
    realmRequirement: RealmType.QiRefining,
    cost: 60,
    effects: { defense: 8, hp: 30 },
  },
  {
    id: 'art-golden-armor',
    name: '金甲功',
    type: 'body',
    grade: '黄',
    description: '将灵气化作金甲护体，防御力不俗。',
    realmRequirement: RealmType.QiRefining,
    cost: 120,
    effects: { defense: 15, hp: 40 },
  },
  {
    id: 'art-moonlight-refine',
    name: '月华淬炼诀',
    type: 'mental',
    grade: '黄',
    description: '吸收月华之力，提升修炼速度。',
    realmRequirement: RealmType.QiRefining,
    cost: 150,
    effects: { expRate: 0.2, spirit: 5 },
  },
  {
    id: 'art-swift-shadow',
    name: '疾影步',
    type: 'body',
    grade: '黄',
    description: '身法如影，速度极快。',
    realmRequirement: RealmType.QiRefining,
    cost: 100,
    effects: { speed: 10, attack: 5 },
  },
  {
    id: 'art-flame-palm',
    name: '炎掌',
    type: 'body',
    grade: '玄',
    description: '掌中带火，焚尽万物。',
    realmRequirement: RealmType.Foundation,
    cost: 350,
    effects: { attack: 40, defense: 5 },
  },
  {
    id: 'art-frost-breath',
    name: '寒冰吐息',
    type: 'mental',
    grade: '玄',
    description: '冰系心法，修炼时如临寒潭。',
    realmRequirement: RealmType.Foundation,
    cost: 450,
    effects: { expRate: 0.35, defense: 20 },
  },
  {
    id: 'art-iron-fist',
    name: '铁拳术',
    type: 'body',
    grade: '玄',
    description: '双拳如铁，刚猛无比。',
    realmRequirement: RealmType.Foundation,
    cost: 550,
    effects: { attack: 50, hp: 80 },
  },
  {
    id: 'art-cloud-dance',
    name: '云舞身法',
    type: 'body',
    grade: '玄',
    description: '身法飘逸，如云中起舞。',
    realmRequirement: RealmType.Foundation,
    cost: 500,
    effects: { speed: 20, defense: 15 },
  },
  {
    id: 'art-storm-heart',
    name: '风暴之心',
    type: 'mental',
    grade: '玄',
    description: '心法狂暴如风暴，修炼速度惊人。',
    realmRequirement: RealmType.Foundation,
    cost: 700,
    effects: { expRate: 0.4, attack: 20 },
  },
  {
    id: 'art-jade-armor',
    name: '玉甲护体',
    type: 'body',
    grade: '玄',
    description: '炼体至玉质，防御力大增。',
    realmRequirement: RealmType.Foundation,
    cost: 800,
    effects: { defense: 50, hp: 200 },
  },
  {
    id: 'art-sun-flame',
    name: '太阳真火',
    type: 'mental',
    grade: '地',
    description: '引太阳真火入体，至阳至刚。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3000,
    effects: { expRate: 0.55, attack: 80, hp: 300 },
  },
  {
    id: 'art-dark-sword',
    name: '幽冥剑法',
    type: 'body',
    grade: '地',
    description: '剑法诡异，伤人于无形。',
    realmRequirement: RealmType.GoldenCore,
    cost: 4000,
    effects: { attack: 180, speed: 30 },
  },
  {
    id: 'art-celestial-body',
    name: '天元体',
    type: 'body',
    grade: '地',
    description: '炼体至天元，肉身强横。',
    realmRequirement: RealmType.GoldenCore,
    cost: 4500,
    effects: { defense: 120, hp: 500, attack: 100 },
  },
  {
    id: 'art-starlight-gather',
    name: '聚星诀',
    type: 'mental',
    grade: '地',
    description: '聚集星辰之力，修炼事半功倍。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3800,
    effects: { expRate: 0.65, spirit: 50 },
  },
  {
    id: 'art-soul-forge',
    name: '炼魂诀',
    type: 'mental',
    grade: '地',
    description: '淬炼神魂，神识大增。',
    realmRequirement: RealmType.GoldenCore,
    cost: 4200,
    effects: { expRate: 0.6, spirit: 800, defense: 400 },
  },
  {
    id: 'art-divine-dragon',
    name: '真龙诀',
    type: 'mental',
    grade: '天',
    description: '真龙传承心法，威震天地。',
    realmRequirement: RealmType.NascentSoul,
    cost: 12000,
    effects: { expRate: 0.75, attack: 1500, hp: 2500 },
  },
  {
    id: 'art-void-step',
    name: '虚空步',
    type: 'body',
    grade: '天',
    description: '穿梭虚空，身法超绝。',
    realmRequirement: RealmType.NascentSoul,
    cost: 15000,
    effects: { speed: 3000, attack: 1200, defense: 80 },
  },
  {
    id: 'art-chaos-body',
    name: '混沌体',
    type: 'body',
    grade: '天',
    description: '炼化混沌之力，肉身成圣。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 30000,
    effects: { defense: 8000, attack: 6000, hp: 80000 },
  },
  {
    id: 'art-dao-heart',
    name: '道心诀',
    type: 'mental',
    grade: '天',
    description: '领悟大道之心，修炼速度登峰造极。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 35000,
    effects: { expRate: 0.9, spirit: 2000, attack: 3000, defense: 2500 },
  },
  {
    id: 'art-immortal-awakening',
    name: '仙醒诀',
    type: 'mental',
    grade: '天',
    description: '觉醒仙人之力，超越凡俗。',
    realmRequirement: RealmType.VoidRefining,
    cost: 60000,
    spiritualRoot: 'fire',
    effects: { expRate: 1.5, attack: 8000, defense: 7000, hp: 15000, spirit: 3000 },
  },
  // 新增五行功法
  {
    id: 'art-golden-sword',
    name: '金剑诀',
    type: 'body',
    grade: '黄',
    description: '金系剑法，锋芒毕露。',
    realmRequirement: RealmType.QiRefining,
    cost: 90,
    spiritualRoot: 'metal',
    effects: { attack: 12, defense: 3 },
  },
  {
    id: 'art-wooden-heart',
    name: '木心诀',
    type: 'mental',
    grade: '黄',
    description: '木系心法，生机勃勃。',
    realmRequirement: RealmType.QiRefining,
    cost: 70,
    spiritualRoot: 'wood',
    effects: { expRate: 0.15, hp: 25 },
  },
  {
    id: 'art-water-flow',
    name: '流水诀',
    type: 'mental',
    grade: '黄',
    description: '水系心法，柔中带刚。',
    realmRequirement: RealmType.QiRefining,
    cost: 85,
    spiritualRoot: 'water',
    effects: { expRate: 0.18, spirit: 4 },
  },
  {
    id: 'art-flame-body',
    name: '火体功',
    type: 'body',
    grade: '黄',
    description: '火系炼体，刚猛霸道。',
    realmRequirement: RealmType.QiRefining,
    cost: 95,
    spiritualRoot: 'fire',
    effects: { attack: 10, speed: 5 },
  },
  {
    id: 'art-earth-core',
    name: '土核功',
    type: 'body',
    grade: '黄',
    description: '土系炼体，厚重沉稳。',
    realmRequirement: RealmType.QiRefining,
    cost: 75,
    spiritualRoot: 'earth',
    effects: { defense: 10, hp: 35 },
  },
  {
    id: 'art-golden-protection',
    name: '金甲护体',
    type: 'body',
    grade: '玄',
    description: '金系防御功法，坚不可摧。',
    realmRequirement: RealmType.Foundation,
    cost: 650,
    spiritualRoot: 'metal',
    effects: { defense: 55, attack: 25 },
  },
  {
    id: 'art-wooden-rebirth',
    name: '木生诀',
    type: 'mental',
    grade: '玄',
    description: '木系恢复心法，生生不息。',
    realmRequirement: RealmType.Foundation,
    cost: 550,
    spiritualRoot: 'wood',
    effects: { expRate: 0.35, hp: 180, defense: 10 },
  },
  {
    id: 'art-ice-spirit',
    name: '冰魄诀',
    type: 'mental',
    grade: '玄',
    description: '水系变异心法，冰寒刺骨。',
    realmRequirement: RealmType.Foundation,
    cost: 750,
    spiritualRoot: 'water',
    effects: { expRate: 0.38, spirit: 30, defense: 25 },
  },
  {
    id: 'art-sun-fire',
    name: '太阳真火诀',
    type: 'mental',
    grade: '地',
    description: '火系至高心法，如太阳般炽热。',
    realmRequirement: RealmType.GoldenCore,
    cost: 3500,
    spiritualRoot: 'fire',
    effects: { expRate: 0.58, attack: 90, hp: 400 },
  },
  {
    id: 'art-earth-mountain',
    name: '山岳功',
    type: 'body',
    grade: '地',
    description: '土系炼体至境，如山岳般厚重。',
    realmRequirement: RealmType.GoldenCore,
    cost: 4000,
    spiritualRoot: 'earth',
    effects: { defense: 150, hp: 600, attack: 60 },
  },
  {
    id: 'art-golden-dragon',
    name: '金龙诀',
    type: 'body',
    grade: '地',
    description: '金系至高功法，如金龙般威猛。',
    realmRequirement: RealmType.GoldenCore,
    cost: 4200,
    spiritualRoot: 'metal',
    effects: { attack: 220, defense: 80, speed: 40 },
  },
  {
    id: 'art-wood-immortal',
    name: '木仙诀',
    type: 'mental',
    grade: '天',
    description: '木系仙级心法，与天地同寿。',
    realmRequirement: RealmType.NascentSoul,
    cost: 11000,
    spiritualRoot: 'wood',
    effects: { expRate: 0.7, hp: 3000, defense: 200 },
  },
  {
    id: 'art-ocean-heart',
    name: '海心诀',
    type: 'mental',
    grade: '天',
    description: '水系仙级心法，如海洋般深邃。',
    realmRequirement: RealmType.NascentSoul,
    cost: 13000,
    spiritualRoot: 'water',
    effects: { expRate: 0.68, spirit: 1200, defense: 300 },
  },
  {
    id: 'art-phoenix-fire',
    name: '凤凰真火',
    type: 'mental',
    grade: '天',
    description: '火系仙级心法，如凤凰涅槃。',
    realmRequirement: RealmType.NascentSoul,
    cost: 14000,
    spiritualRoot: 'fire',
    effects: { expRate: 0.72, attack: 1800, hp: 2800 },
  },
  {
    id: 'art-earth-immortal',
    name: '土仙体',
    type: 'body',
    grade: '天',
    description: '土系仙级炼体，与大地同源。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 28000,
    spiritualRoot: 'earth',
    effects: { defense: 6000, hp: 70000, attack: 4000 },
  },
  {
    id: 'art-golden-immortal',
    name: '金仙剑',
    type: 'body',
    grade: '天',
    description: '金系仙级剑法，斩断一切。',
    realmRequirement: RealmType.SpiritSevering,
    cost: 32000,
    spiritualRoot: 'metal',
    effects: { attack: 8000, defense: 3000, speed: 2000 },
  },
  {
    id: 'art-five-elements',
    name: '五行归一',
    type: 'mental',
    grade: '天',
    description: '融合五行之力，达到修炼的极致。',
    realmRequirement: RealmType.VoidRefining,
    cost: 70000,
    effects: { expRate: 1.2, attack: 10000, defense: 8000, hp: 20000, spirit: 5000 },
  },
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'spirit-stone-shard',
    name: '灵石碎片',
    type: ItemType.Material,
    description: '含有少量灵气的碎裂灵石。',
    quantity: 5,
    rarity: '普通',
  },
  {
    id: 'refining-stone',
    name: '炼器石',
    type: ItemType.Material,
    description: '用于强化法宝的基础材料。',
    quantity: 10,
    rarity: '普通',
  },
  {
    id: 'healing-herb',
    name: '止血草',
    type: ItemType.Herb,
    description: '常见的草药，用于治疗轻微外伤。',
    quantity: 2,
    rarity: '普通',
    effect: { hp: 20 },
  },
  {
    id: 'spirit-gathering-grass',
    name: '聚灵草',
    type: ItemType.Herb,
    description: '吸收天地灵气的草药，炼制聚气丹的主材。',
    quantity: 5,
    rarity: '普通',
  },
  {
    id: 'iron-sword',
    name: '凡铁剑',
    type: ItemType.Weapon,
    description: '普通的铁剑，聊胜于无。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 5 },
  },
  {
    id: 'cloth-robe',
    name: '粗布道袍',
    type: ItemType.Armor,
    description: '云灵宗外门弟子制式道袍。',
    quantity: 1,
    rarity: '普通',
    level: 0,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Chest,
    effect: { defense: 3, hp: 10 },
  },
];

export const PILL_RECIPES: Recipe[] = [
  {
    name: '聚气丹',
    cost: 10,
    ingredients: [{ name: '聚灵草', qty: 3 }],
    result: {
      name: '聚气丹',
      type: ItemType.Pill,
      description: '短时间内大幅提升修炼速度（瞬间获得修为）。',
      rarity: '普通',
      effect: { exp: 50 },
    },
  },
  {
    name: '回春丹',
    cost: 20,
    ingredients: [
      { name: '止血草', qty: 3 },
      { name: '聚灵草', qty: 1 },
    ],
    result: {
      name: '回春丹',
      type: ItemType.Pill,
      description: '疗伤圣药，大幅恢复气血。',
      rarity: '稀有',
      effect: { hp: 200 },
    },
  },
  {
    name: '洗髓丹',
    cost: 100,
    ingredients: [
      { name: '紫猴花', qty: 2 },
      { name: '天灵果', qty: 1 },
    ],
    result: {
      name: '洗髓丹',
      type: ItemType.Pill,
      description: '易筋洗髓，脱胎换骨。永久增加少量最大生命值。',
      rarity: '稀有',
      effect: { hp: 50 }, // Treated as permanent in App logic special case or simple maxHp boost
    },
  },
  {
    name: '筑基丹',
    cost: 500,
    ingredients: [
      { name: '千年人参', qty: 2 },
      { name: '妖兽内丹', qty: 1 },
    ],
    result: {
      name: '筑基丹',
      type: ItemType.Pill,
      description: '增加突破到筑基期的几率。服用后获得海量修为。',
      rarity: '传说',
      effect: { exp: 500 },
    },
  },
  {
    name: '龙血丹',
    cost: 2000,
    ingredients: [
      { name: '龙鳞果', qty: 3 },
      { name: '高阶妖丹', qty: 2 },
    ],
    result: {
      name: '龙血丹',
      type: ItemType.Pill,
      description: '蕴含一丝真龙之血，服用后气血如龙。大幅增加气血上限。',
      rarity: '传说',
      effect: { hp: 500 },
    },
  },
  {
    name: '九转金丹',
    cost: 5000,
    ingredients: [
      { name: '万年灵乳', qty: 1 },
      { name: '九叶芝草', qty: 1 },
    ],
    result: {
      name: '九转金丹',
      type: ItemType.Pill,
      description: '传说中的仙丹，服用后甚至能让凡人立地飞升。',
      rarity: '仙品',
      effect: { exp: 5000, attack: 10, defense: 10 },
    },
  },
  {
    name: '延寿丹',
    cost: 300,
    ingredients: [
      { name: '千年人参', qty: 2 },
      { name: '血参', qty: 3 },
    ],
    result: {
      name: '延寿丹',
      type: ItemType.Pill,
      description: '增加寿命的珍贵丹药，可延长10年寿命。',
      rarity: '稀有',
      effect: { lifespan: 10 },
    },
  },
  {
    name: '长生丹',
    cost: 1500,
    ingredients: [
      { name: '万年仙草', qty: 1 },
      { name: '千年灵芝', qty: 2 },
    ],
    result: {
      name: '长生丹',
      type: ItemType.Pill,
      description: '增加寿命的极品丹药，可延长50年寿命并增加最大寿命。',
      rarity: '传说',
      effect: { lifespan: 50 },
      permanentEffect: { maxLifespan: 20 },
    },
  },
  {
    name: '不死仙丹',
    cost: 8000,
    ingredients: [
      { name: '万年灵乳', qty: 2 },
      { name: '九叶芝草', qty: 2 },
      { name: '龙鳞果', qty: 3 },
    ],
    result: {
      name: '不死仙丹',
      type: ItemType.Pill,
      description: '传说中的不死仙丹，可延长200年寿命并大幅增加最大寿命。',
      rarity: '仙品',
      effect: { lifespan: 200 },
      permanentEffect: { maxLifespan: 100 },
    },
  },
  {
    name: '洗灵丹',
    cost: 400,
    ingredients: [
      { name: '天灵果', qty: 3 },
      { name: '紫猴花', qty: 2 },
    ],
    result: {
      name: '洗灵丹',
      type: ItemType.Pill,
      description: '洗涤灵根，随机提升一种灵根5点。',
      rarity: '稀有',
      permanentEffect: {
        spiritualRoots: {
          metal: 0,
          wood: 0,
          water: 0,
          fire: 0,
          earth: 0,
        },
      },
    },
  },
  {
    name: '五行灵丹',
    cost: 2500,
    ingredients: [
      { name: '千年人参', qty: 3 },
      { name: '天灵果', qty: 3 },
      { name: '高阶妖丹', qty: 2 },
    ],
    result: {
      name: '五行灵丹',
      type: ItemType.Pill,
      description: '平衡五行，所有灵根各提升3点。',
      rarity: '传说',
      permanentEffect: {
        spiritualRoots: {
          metal: 3,
          wood: 3,
          water: 3,
          fire: 3,
          earth: 3,
        },
      },
    },
  },
  {
    name: '天灵根丹',
    cost: 10000,
    ingredients: [
      { name: '万年灵乳', qty: 3 },
      { name: '九叶芝草', qty: 3 },
      { name: '万年仙草', qty: 2 },
    ],
    result: {
      name: '天灵根丹',
      type: ItemType.Pill,
      description: '传说中的仙丹，所有灵根各提升10点。',
      rarity: '仙品',
      permanentEffect: {
        spiritualRoots: {
          metal: 10,
          wood: 10,
          water: 10,
          fire: 10,
          earth: 10,
        },
      },
    },
  },
];

// 可通过历练获得的额外丹方（这些不会在初始炼丹面板中显示，需要通过使用丹方物品解锁）
export const DISCOVERABLE_RECIPES: Recipe[] = [
  {
    name: '凝神丹',
    cost: 150,
    ingredients: [
      { name: '凝神花', qty: 3 },
      { name: '聚灵草', qty: 2 },
    ],
    result: {
      name: '凝神丹',
      type: ItemType.Pill,
      description: '凝神静气，提升神识。永久增加神识属性。',
      rarity: '稀有',
      effect: { spirit: 20 },
    },
  },
  {
    name: '强体丹',
    cost: 200,
    ingredients: [
      { name: '血参', qty: 2 },
      { name: '回气草', qty: 3 },
    ],
    result: {
      name: '强体丹',
      type: ItemType.Pill,
      description: '强身健体，提升体魄。永久增加体魄属性。',
      rarity: '稀有',
      effect: { physique: 20 },
    },
  },
  {
    name: '破境丹',
    cost: 800,
    ingredients: [
      { name: '千年灵芝', qty: 1 },
      { name: '妖兽内丹', qty: 2 },
    ],
    result: {
      name: '破境丹',
      type: ItemType.Pill,
      description: '突破境界的辅助丹药，大幅提升修为。',
      rarity: '传说',
      effect: { exp: 1000 },
    },
  },
  {
    name: '仙灵丹',
    cost: 3000,
    ingredients: [
      { name: '万年仙草', qty: 1 },
      { name: '高阶妖丹', qty: 3 },
    ],
    result: {
      name: '仙灵丹',
      type: ItemType.Pill,
      description: '仙家灵丹，服用后修为与属性大幅提升。',
      rarity: '传说',
      effect: { exp: 2000, spirit: 50, physique: 50 },
    },
  },
  {
    name: '天元丹',
    cost: 10000,
    ingredients: [
      { name: '万年灵乳', qty: 2 },
      { name: '九叶芝草', qty: 2 },
      { name: '龙鳞果', qty: 5 },
    ],
    result: {
      name: '天元丹',
      type: ItemType.Pill,
      description: '天元级别的仙丹，服用后全属性大幅提升。',
      rarity: '仙品',
      effect: {
        exp: 10000,
        attack: 50,
        defense: 50,
        spirit: 100,
        physique: 100,
        speed: 30,
      },
    },
  },
];

// Upgrade Constants
export const UPGRADE_MATERIAL_NAME = '炼器石';
export const UPGRADE_STONE_NAME = '强化石';
export const BASE_UPGRADE_COST_STONES = 50;
export const BASE_UPGRADE_COST_MATS = 2;
export const UPGRADE_STONE_SUCCESS_BONUS = 0.1; // 每颗强化石提高10%成功率

// Returns percentage increase (0.1 = 10%)
export const getUpgradeMultiplier = (rarity: ItemRarity = '普通') => {
  switch (rarity) {
    case '普通':
      return 0.1;
    case '稀有':
      return 0.15;
    case '传说':
      return 0.2;
    case '仙品':
      return 0.25;
    default:
      return 0.1;
  }
};

// --- SECT CONSTANTS ---

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

export const SECT_RANK_REQUIREMENTS: Record<
  SectRank,
  { contribution: number; realmIndex: number }
> = {
  [SectRank.Outer]: { contribution: 0, realmIndex: 0 },
  [SectRank.Inner]: { contribution: 500, realmIndex: 1 }, // Foundation
  [SectRank.Core]: { contribution: 2000, realmIndex: 2 }, // Golden Core
  [SectRank.Elder]: { contribution: 10000, realmIndex: 3 }, // Nascent Soul
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

// --- SECRET REALMS ---

export const SECRET_REALMS: SecretRealm[] = [
  {
    id: 'realm-beast-mountain',
    name: '万兽山脉',
    description:
      '外围相对安全，深处盘踞着可怕的妖兽。适合炼气、筑基期修士历练。',
    minRealm: RealmType.QiRefining,
    cost: 80,
    riskLevel: '中',
    drops: ['妖兽材料', '稀有草药', '攻击法器'],
  },
  {
    id: 'realm-ancient-tomb',
    name: '上古剑冢',
    description: '传说中上古剑修的埋骨之地，剑气纵横。非筑基期不可入。',
    minRealm: RealmType.Foundation,
    cost: 300,
    riskLevel: '高',
    drops: ['剑修功法', '残破灵宝', '剑意草'],
  },
  {
    id: 'realm-thunder-purgatory',
    name: '雷罚炼狱',
    description: '终年雷霆不息，稍有不慎便会灰飞烟灭。',
    minRealm: RealmType.GoldenCore,
    cost: 800,
    riskLevel: '极度危险',
    drops: ['雷属性至宝', '仙品丹药材料', '天阶功法'],
  },
  {
    id: 'realm-immortal-garden',
    name: '仙灵秘境',
    description: '仙灵之气浓郁，适合修炼，相对安全。适合初入仙途的修士。',
    minRealm: RealmType.QiRefining,
    cost: 50,
    riskLevel: '低',
    drops: ['聚灵草', '普通丹药', '基础功法'],
  },
  {
    id: 'realm-star-ruins',
    name: '星辰遗迹',
    description: '星辰之力汇聚，灵气充沛，但需小心守护妖兽。',
    minRealm: RealmType.QiRefining,
    cost: 60,
    riskLevel: '低',
    drops: ['星辰石', '灵草', '防御法器'],
  },
  {
    id: 'realm-ice-domain',
    name: '冰封雪域',
    description: '冰天雪地，寒风刺骨，但蕴藏着珍贵的冰属性宝物。',
    minRealm: RealmType.Foundation,
    cost: 250,
    riskLevel: '中',
    drops: ['冰晶', '寒属性灵草', '冰系功法'],
  },
  {
    id: 'realm-dragon-tomb',
    name: '龙族古墓',
    description: '龙族遗迹，蕴藏着龙族传承，但守护力量不弱。',
    minRealm: RealmType.Foundation,
    cost: 400,
    riskLevel: '中',
    drops: ['龙鳞', '龙血草', '龙族传承'],
  },
  {
    id: 'realm-fire-lava',
    name: '天火熔岩',
    description: '地火喷涌，岩浆翻滚，火属性修士的圣地，但极端危险。',
    minRealm: RealmType.GoldenCore,
    cost: 600,
    riskLevel: '高',
    drops: ['火精', '熔岩之心', '火系至宝'],
  },
  {
    id: 'realm-poison-swamp',
    name: '毒瘴沼泽',
    description: '毒气弥漫，危险重重，但蕴藏着珍稀毒草和剧毒妖兽。',
    minRealm: RealmType.GoldenCore,
    cost: 700,
    riskLevel: '高',
    drops: ['毒草', '毒丹材料', '毒系功法'],
  },
  {
    id: 'realm-blood-sea',
    name: '血海魔渊',
    description: '魔气滔天，邪物横行，是正道修士的绝地，九死一生。',
    minRealm: RealmType.NascentSoul,
    cost: 1500,
    riskLevel: '极度危险',
    drops: ['魔血', '邪道功法', '魔器碎片'],
  },
  {
    id: 'realm-nine-hells',
    name: '九幽深渊',
    description: '九幽之地，死气沉沉，亡者的国度，生者禁入。',
    minRealm: RealmType.NascentSoul,
    cost: 1200,
    riskLevel: '极度危险',
    drops: ['死灵精华', '阴属性至宝', '鬼道传承'],
  },
  {
    id: 'realm-chaos-void',
    name: '混沌虚空',
    description: '混沌之力混乱，空间不稳定，随时可能被空间裂缝吞噬。',
    minRealm: RealmType.SpiritSevering,
    cost: 2000,
    riskLevel: '极度危险',
    drops: ['混沌石', '空间碎片', '虚空传承'],
  },
  {
    id: 'realm-god-demon-battlefield',
    name: '神魔战场',
    description: '上古神魔大战的遗迹，杀气冲天，怨灵遍地。',
    minRealm: RealmType.SpiritSevering,
    cost: 2500,
    riskLevel: '极度危险',
    drops: ['神魔遗物', '战魂精华', '上古传承'],
  },
  {
    id: 'realm-time-rift',
    name: '时光裂缝',
    description: '时间之力扭曲，过去未来交错，稍有不慎便会迷失其中。',
    minRealm: RealmType.GoldenCore,
    cost: 900,
    riskLevel: '高',
    drops: ['时光碎片', '时间之沙', '时空功法'],
  },
  {
    id: 'realm-phantom-cave',
    name: '幻境迷窟',
    description: '幻象丛生，真假难辨，考验修士的心智和意志。',
    minRealm: RealmType.Foundation,
    cost: 350,
    riskLevel: '中',
    drops: ['幻心草', '幻术功法', '迷魂符'],
  },
];

// --- 角色系统：天赋 ---
export const TALENTS: Talent[] = [
  // 普通天赋（3个）
  {
    id: 'talent-ordinary',
    name: '凡体',
    description: '普通的修仙资质，没有任何特殊加成。',
    rarity: '普通',
    effects: {},
  },
  {
    id: 'talent-strong-body',
    name: '强健体魄',
    description: '身体比常人强壮一些，气血略微提升。',
    rarity: '普通',
    effects: { hp: 50 },
  },
  {
    id: 'talent-quick-learner',
    name: '悟性尚可',
    description: '学习能力稍强，修炼速度略微提升。',
    rarity: '普通',
    effects: { expRate: 0.05 },
  },

  // 稀有天赋（8个）
  {
    id: 'talent-spirit-root',
    name: '灵根',
    description: '拥有灵根，修炼速度提升10%。',
    rarity: '稀有',
    effects: { expRate: 0.1 },
  },
  {
    id: 'talent-iron-bone',
    name: '铁骨',
    description: '骨骼坚硬，防御力提升。',
    rarity: '稀有',
    effects: { defense: 30, physique: 20 },
  },
  {
    id: 'talent-sharp-blade',
    name: '利刃',
    description: '天生适合使用武器，攻击力提升。',
    rarity: '稀有',
    effects: { attack: 40 },
  },
  {
    id: 'talent-spirit-sense',
    name: '神识敏锐',
    description: '神识天生敏锐，神识和速度提升。',
    rarity: '稀有',
    effects: { spirit: 25, speed: 15 },
  },
  {
    id: 'talent-vitality',
    name: '生机勃勃',
    description: '生命力旺盛，气血上限大幅提升。',
    rarity: '稀有',
    effects: { hp: 150, physique: 15 },
  },
  {
    id: 'talent-fast-cultivation',
    name: '修炼奇才',
    description: '修炼天赋出众，修炼速度提升15%。',
    rarity: '稀有',
    effects: { expRate: 0.15 },
  },
  {
    id: 'talent-lucky',
    name: '小有气运',
    description: '运气不错，幸运值提升。',
    rarity: '稀有',
    effects: { luck: 20 },
  },
  {
    id: 'talent-balanced',
    name: '均衡发展',
    description: '各项属性均衡提升。',
    rarity: '稀有',
    effects: {
      attack: 20,
      defense: 20,
      hp: 80,
      spirit: 15,
      physique: 15,
      speed: 10,
    },
  },

  // 传说天赋（6个）
  {
    id: 'talent-immortal-body',
    name: '仙体',
    description: '天生仙体，气血和防御大幅提升。',
    rarity: '传说',
    effects: { hp: 200, defense: 50 },
  },
  {
    id: 'talent-sword-heart',
    name: '剑心',
    description: '天生剑心，攻击力大幅提升。',
    rarity: '传说',
    effects: { attack: 100 },
  },
  {
    id: 'talent-thunder-body',
    name: '雷体',
    description: '拥有雷属性体质，攻击和速度大幅提升。',
    rarity: '传说',
    effects: { attack: 80, speed: 40, spirit: 30 },
  },
  {
    id: 'talent-dragon-blood',
    name: '龙血',
    description: '体内流淌着龙族血脉，气血和体魄大幅提升。',
    rarity: '传说',
    effects: { hp: 300, physique: 50, defense: 40 },
  },
  {
    id: 'talent-genius',
    name: '修炼天才',
    description: '修炼天赋绝佳，修炼速度大幅提升。',
    rarity: '传说',
    effects: { expRate: 0.25, spirit: 40 },
  },
  {
    id: 'talent-blessed',
    name: '天眷之人',
    description: '受天道眷顾，幸运值和修炼速度提升。',
    rarity: '传说',
    effects: { luck: 35, expRate: 0.15 },
  },

  // 仙品天赋（3个）
  {
    id: 'talent-lucky-star',
    name: '天运之子',
    description: '受天道眷顾，幸运值大幅提升，更容易遇到奇遇。',
    rarity: '仙品',
    effects: { luck: 50, expRate: 0.2 },
  },
  {
    id: 'talent-immortal-king',
    name: '仙王转世',
    description: '疑似仙王转世，各项属性大幅提升，修炼速度极快。',
    rarity: '仙品',
    effects: {
      attack: 150,
      defense: 100,
      hp: 400,
      spirit: 60,
      physique: 60,
      speed: 50,
      expRate: 0.3,
    },
  },
  {
    id: 'talent-chaos-body',
    name: '混沌之体',
    description: '拥有传说中的混沌之体，所有属性全面提升，修炼速度极快。',
    rarity: '仙品',
    effects: {
      attack: 120,
      defense: 80,
      hp: 350,
      spirit: 50,
      physique: 50,
      speed: 40,
      expRate: 0.25,
      luck: 30,
    },
  },
];

// --- 角色系统：称号 ---
export const TITLES: Title[] = [
  {
    id: 'title-novice',
    name: '初入仙途',
    description: '刚刚踏入修仙之路的新人。',
    requirement: '初始称号',
    effects: {},
  },
  {
    id: 'title-foundation',
    name: '筑基修士',
    description: '成功筑基，正式踏入修仙门槛。',
    requirement: '达到筑基期',
    effects: { attack: 10, defense: 5 },
  },
  {
    id: 'title-golden-core',
    name: '金丹真人',
    description: '凝聚金丹，已是修仙界的中流砥柱。',
    requirement: '达到金丹期',
    effects: { attack: 50, defense: 25, hp: 200 },
  },
  {
    id: 'title-nascent-soul',
    name: '元婴老祖',
    description: '修成元婴，可称一方老祖。',
    requirement: '达到元婴期',
    effects: { attack: 200, defense: 100, hp: 1000 },
  },
  {
    id: 'title-immortal',
    name: '飞升仙人',
    description: '渡劫飞升，已是真正的仙人。',
    requirement: '达到渡劫飞升',
    effects: { attack: 1000, defense: 500, hp: 5000, expRate: 0.3 },
  },
];

// --- 奇遇系统 ---
export const ENCOUNTER_EVENTS: EncounterEvent[] = [
  {
    id: 'encounter-herb',
    name: '发现灵草',
    description: '你在山间发现了一株珍贵的灵草。',
    rarity: '普通',
    triggerChance: 0.3,
    rewards: {
      exp: 20,
      items: [{ name: '聚灵草', rarity: '普通', quantity: 1 }],
    },
  },
  {
    id: 'encounter-spirit-stone',
    name: '灵石矿脉',
    description: '你意外发现了一处小型灵石矿脉。',
    rarity: '稀有',
    triggerChance: 0.15,
    rewards: {
      spiritStones: 100,
      exp: 50,
    },
  },
  {
    id: 'encounter-ancient-cave',
    name: '古修士洞府',
    description: '你发现了一处古修士遗留的洞府，获得了珍贵的传承。',
    rarity: '传说',
    triggerChance: 0.05,
    minRealm: RealmType.Foundation,
    requirements: { minLuck: 30 },
    rewards: {
      exp: 500,
      spiritStones: 500,
      items: [{ name: '上古功法残卷', rarity: '传说', quantity: 1 }],
    },
  },
  {
    id: 'encounter-immortal-herb',
    name: '万年仙草',
    description: '你遇到了传说中的万年仙草，这是天大的机缘！',
    rarity: '仙品',
    triggerChance: 0.01,
    minRealm: RealmType.GoldenCore,
    requirements: { minLuck: 50 },
    rewards: {
      exp: 2000,
      items: [{ name: '万年仙草', rarity: '仙品', quantity: 1 }],
    },
  },
];

// --- 探索系统 ---
export const EXPLORATION_LOCATIONS: ExplorationLocation[] = [
  {
    id: 'explore-forest',
    name: '迷雾森林',
    description: '常年被迷雾笼罩的森林，隐藏着许多秘密。',
    minRealm: RealmType.QiRefining,
    cost: 20,
    riskLevel: '低',
    eventTypes: ['normal', 'lucky'],
  },
  {
    id: 'explore-mountain',
    name: '天柱山',
    description: '高耸入云的山峰，传说有仙人居住。',
    minRealm: RealmType.Foundation,
    cost: 50,
    riskLevel: '中',
    eventTypes: ['normal', 'lucky'],
    specialEncounters: ['encounter-ancient-cave'],
  },
  {
    id: 'explore-abyss',
    name: '无底深渊',
    description: '深不见底的深渊，危险与机遇并存。',
    minRealm: RealmType.GoldenCore,
    cost: 200,
    riskLevel: '高',
    eventTypes: ['normal', 'lucky', 'secret_realm'],
    specialEncounters: ['encounter-immortal-herb'],
  },
];

// --- 成就系统 ---
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-step',
    name: '第一步',
    description: '完成第一次打坐修炼',
    category: 'cultivation',
    requirement: { type: 'custom', value: 1, target: 'meditate' },
    reward: { exp: 50, spiritStones: 10 },
    rarity: '普通',
  },
  {
    id: 'ach-foundation',
    name: '筑基成功',
    description: '突破到筑基期',
    category: 'cultivation',
    requirement: { type: 'realm', value: 1, target: RealmType.Foundation },
    reward: { exp: 500, spiritStones: 200, titleId: 'title-foundation' },
    rarity: '稀有',
  },
  {
    id: 'ach-golden-core',
    name: '金丹大道',
    description: '突破到金丹期',
    category: 'cultivation',
    requirement: { type: 'realm', value: 1, target: RealmType.GoldenCore },
    reward: { exp: 2000, spiritStones: 1000, titleId: 'title-golden-core' },
    rarity: '传说',
  },
  {
    id: 'ach-first-kill',
    name: '初战告捷',
    description: '在历练中击败第一个敌人',
    category: 'combat',
    requirement: { type: 'kill', value: 1 },
    reward: { exp: 100, spiritStones: 50 },
    rarity: '普通',
  },
  {
    id: 'ach-collector',
    name: '收藏家',
    description: '收集10种不同的物品',
    category: 'collection',
    requirement: { type: 'collect', value: 10 },
    reward: { exp: 300, spiritStones: 200 },
    rarity: '稀有',
  },
  {
    id: 'ach-immortal',
    name: '飞升成仙',
    description: '达到渡劫飞升境界',
    category: 'special',
    requirement: {
      type: 'realm',
      value: 1,
      target: RealmType.ImmortalAscension,
    },
    reward: { exp: 10000, spiritStones: 10000, titleId: 'title-immortal' },
    rarity: '仙品',
  },
  // 新增20个成就
  {
    id: 'ach-nascent-soul',
    name: '元婴出窍',
    description: '突破到元婴期',
    category: 'cultivation',
    requirement: { type: 'realm', value: 1, target: RealmType.NascentSoul },
    reward: { exp: 5000, spiritStones: 3000 },
    rarity: '传说',
  },
  {
    id: 'ach-spirit-severing',
    name: '化神之境',
    description: '突破到化神期',
    category: 'cultivation',
    requirement: { type: 'realm', value: 1, target: RealmType.SpiritSevering },
    reward: { exp: 8000, spiritStones: 5000 },
    rarity: '传说',
  },
  {
    id: 'ach-void-refining',
    name: '炼虚合道',
    description: '突破到炼虚期',
    category: 'cultivation',
    requirement: { type: 'realm', value: 1, target: RealmType.VoidRefining },
    reward: { exp: 12000, spiritStones: 8000 },
    rarity: '仙品',
  },
  {
    id: 'ach-killer-10',
    name: '十人斩',
    description: '击败10个敌人',
    category: 'combat',
    requirement: { type: 'kill', value: 10 },
    reward: { exp: 200, spiritStones: 100 },
    rarity: '普通',
  },
  {
    id: 'ach-killer-50',
    name: '百战不殆',
    description: '击败50个敌人',
    category: 'combat',
    requirement: { type: 'kill', value: 50 },
    reward: { exp: 1000, spiritStones: 500 },
    rarity: '稀有',
  },
  {
    id: 'ach-killer-100',
    name: '千人斩',
    description: '击败100个敌人',
    category: 'combat',
    requirement: { type: 'kill', value: 100 },
    reward: { exp: 3000, spiritStones: 1500 },
    rarity: '传说',
  },
  {
    id: 'ach-collector-20',
    name: '物品收藏家',
    description: '收集20种不同的物品',
    category: 'collection',
    requirement: { type: 'collect', value: 20 },
    reward: { exp: 500, spiritStones: 300 },
    rarity: '稀有',
  },
  {
    id: 'ach-collector-50',
    name: '收藏大师',
    description: '收集50种不同的物品',
    category: 'collection',
    requirement: { type: 'collect', value: 50 },
    reward: { exp: 2000, spiritStones: 1000 },
    rarity: '传说',
  },
  {
    id: 'ach-meditate-10',
    name: '勤修不辍',
    description: '完成10次打坐修炼',
    category: 'cultivation',
    requirement: { type: 'meditate', value: 10 },
    reward: { exp: 150, spiritStones: 50 },
    rarity: '普通',
  },
  {
    id: 'ach-meditate-50',
    name: '闭关苦修',
    description: '完成50次打坐修炼',
    category: 'cultivation',
    requirement: { type: 'meditate', value: 50 },
    reward: { exp: 800, spiritStones: 300 },
    rarity: '稀有',
  },
  {
    id: 'ach-meditate-100',
    name: '道心坚定',
    description: '完成100次打坐修炼',
    category: 'cultivation',
    requirement: { type: 'meditate', value: 100 },
    reward: { exp: 2000, spiritStones: 1000 },
    rarity: '传说',
  },
  {
    id: 'ach-adventure-20',
    name: '历练新手',
    description: '完成20次历练',
    category: 'exploration',
    requirement: { type: 'adventure', value: 20 },
    reward: { exp: 300, spiritStones: 150 },
    rarity: '普通',
  },
  {
    id: 'ach-adventure-100',
    name: '历练老手',
    description: '完成100次历练',
    category: 'exploration',
    requirement: { type: 'adventure', value: 100 },
    reward: { exp: 1500, spiritStones: 800 },
    rarity: '稀有',
  },
  {
    id: 'ach-equip-5',
    name: '装备齐全',
    description: '装备5件物品',
    category: 'collection',
    requirement: { type: 'equip', value: 5 },
    reward: { exp: 200, spiritStones: 100 },
    rarity: '普通',
  },
  {
    id: 'ach-pet-1',
    name: '灵宠伙伴',
    description: '获得第一个灵宠',
    category: 'special',
    requirement: { type: 'pet', value: 1 },
    reward: { exp: 500, spiritStones: 200 },
    rarity: '稀有',
  },
  {
    id: 'ach-pet-3',
    name: '灵宠大师',
    description: '获得3个灵宠',
    category: 'special',
    requirement: { type: 'pet', value: 3 },
    reward: { exp: 1500, spiritStones: 800 },
    rarity: '传说',
  },
  {
    id: 'ach-recipe-5',
    name: '丹道入门',
    description: '解锁5个丹方',
    category: 'collection',
    requirement: { type: 'recipe', value: 5 },
    reward: { exp: 400, spiritStones: 200 },
    rarity: '稀有',
  },
  {
    id: 'ach-art-3',
    name: '功法初成',
    description: '学习3种功法',
    category: 'cultivation',
    requirement: { type: 'art', value: 3 },
    reward: { exp: 600, spiritStones: 300 },
    rarity: '稀有',
  },
  {
    id: 'ach-art-10',
    name: '功法大成',
    description: '学习10种功法',
    category: 'cultivation',
    requirement: { type: 'art', value: 10 },
    reward: { exp: 3000, spiritStones: 1500 },
    rarity: '传说',
  },
  {
    id: 'ach-breakthrough-5',
    name: '突破达人',
    description: '完成5次突破',
    category: 'cultivation',
    requirement: { type: 'breakthrough', value: 5 },
    reward: { exp: 1000, spiritStones: 500 },
    rarity: '稀有',
  },
  {
    id: 'ach-secret-realm-5',
    name: '秘境探索者',
    description: '进入5次秘境',
    category: 'exploration',
    requirement: { type: 'secret_realm', value: 5 },
    reward: { exp: 2000, spiritStones: 1000 },
    rarity: '传说',
  },
  {
    id: 'ach-lottery-10',
    name: '抽奖新手',
    description: '进行10次抽奖',
    category: 'special',
    requirement: { type: 'lottery', value: 10 },
    reward: { exp: 300, spiritStones: 200 },
    rarity: '普通',
  },
  {
    id: 'ach-lottery-50',
    name: '抽奖达人',
    description: '进行50次抽奖',
    category: 'special',
    requirement: { type: 'lottery', value: 50 },
    reward: { exp: 2000, spiritStones: 1500 },
    rarity: '稀有',
  },
];

// --- 灵宠系统 ---
export const PET_SKILLS: PetSkill[] = [
  {
    id: 'skill-bite',
    name: '撕咬',
    description: '基础攻击技能',
    type: 'attack',
    effect: { damage: 10 },
  },
  {
    id: 'skill-heal',
    name: '治愈之光',
    description: '为主人恢复气血',
    type: 'support',
    effect: { heal: 50 },
  },
  {
    id: 'skill-protect',
    name: '守护',
    description: '提升主人防御',
    type: 'defense',
    effect: { buff: { defense: 100 } },
  },
  {
    id: 'skill-blessing',
    name: '祝福',
    description: '提升主人攻击和防御',
    type: 'support',
    effect: { buff: { attack: 150, defense: 75 } },
  },
];

// 灵宠进化材料池
export const PET_EVOLUTION_MATERIALS = [
  // 幼年期 -> 成熟期材料
  { name: '聚灵草', rarity: '普通' as ItemRarity, description: '蕴含灵气的灵草，可用于灵宠进化。' },
  { name: '妖兽内丹', rarity: '普通' as ItemRarity, description: '妖兽体内凝聚的内丹，蕴含妖力。' },
  { name: '灵兽精血', rarity: '稀有' as ItemRarity, description: '灵兽的精血，蕴含强大的生命力。' },
  { name: '月华石', rarity: '稀有' as ItemRarity, description: '吸收月华之力的灵石，可助灵宠进化。' },
  { name: '星辰碎片', rarity: '稀有' as ItemRarity, description: '来自星辰的碎片，蕴含神秘力量。' },
  { name: '龙鳞片', rarity: '传说' as ItemRarity, description: '真龙脱落的鳞片，极其珍贵。' },
  { name: '凤凰羽', rarity: '传说' as ItemRarity, description: '凤凰的羽毛，蕴含涅槃之力。' },
  { name: '麒麟角', rarity: '传说' as ItemRarity, description: '麒麟的角，拥有祥瑞之力。' },
  // 成熟期 -> 完全体材料
  { name: '仙灵果', rarity: '稀有' as ItemRarity, description: '仙灵树结出的果实，可大幅提升灵宠实力。' },
  { name: '九转金丹', rarity: '传说' as ItemRarity, description: '经过九次炼制的金丹，蕴含无上药力。' },
  { name: '天材地宝', rarity: '传说' as ItemRarity, description: '天地孕育的至宝，极其罕见。' },
  { name: '神兽精魄', rarity: '传说' as ItemRarity, description: '神兽的精魄，蕴含神兽之力。' },
  { name: '混沌石', rarity: '仙品' as ItemRarity, description: '来自混沌的奇石，蕴含创世之力。' },
  { name: '大道碎片', rarity: '仙品' as ItemRarity, description: '大道法则的碎片，可助灵宠突破极限。' },
  { name: '仙灵本源', rarity: '仙品' as ItemRarity, description: '仙灵的本源力量，极其珍贵。' },
  { name: '造化神液', rarity: '仙品' as ItemRarity, description: '造化之力凝聚的神液，可重塑灵宠。' },
];

// 从模板中随机选择一个名字
export const getRandomPetName = (template: PetTemplate): string => {
  if (template.nameVariants && template.nameVariants.length > 0) {
    return template.nameVariants[Math.floor(Math.random() * template.nameVariants.length)];
  }
  return template.name;
};

export const PET_TEMPLATES: PetTemplate[] = [
  {
    id: 'pet-spirit-fox',
    name: '灵狐',
    nameVariants: ['灵狐', '雪狐', '月狐', '银狐', '火狐', '风狐', '云狐', '星狐'],
    species: '狐族',
    description: '聪明伶俐的灵狐，擅长辅助。',
    rarity: '普通',
    image: '🦊',
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-bite',
        name: '撕咬',
        description: '基础攻击',
        type: 'attack',
        effect: { damage: 50 },
      },
      {
        id: 'skill-heal',
        name: '治愈之光',
        description: '恢复气血',
        type: 'support',
        effect: { heal: 250 },
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: '聚灵草', quantity: 10 }],
      },
      stage2: {
        level: 30,
        items: [{ name: '灵兽精血', quantity: 5 }, { name: '月华石', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '九尾灵狐',
      stage2: '天狐',
    },
  },
  {
    id: 'pet-thunder-tiger',
    name: '雷虎',
    nameVariants: ['雷虎', '雷霆虎', '闪电虎', '霹雳虎', '风暴虎', '狂雷虎', '天雷虎', '雷暴虎'],
    species: '虎族',
    description: '凶猛威武的雷虎，攻击力极强。',
    rarity: '稀有',
    image: '🐅',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-bite',
        name: '撕咬',
        description: '基础攻击',
        type: 'attack',
        effect: { damage: 150 },
      },
      {
        id: 'skill-thunder',
        name: '雷击',
        description: '雷属性攻击',
        type: 'attack',
        effect: { damage: 50 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 5 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '神兽精魄', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '雷霆虎王',
      stage2: '雷神虎',
    },
  },
  {
    id: 'pet-phoenix',
    name: '凤凰',
    nameVariants: ['凤凰', '火凤', '炎凤', '赤凤', '金凤', '天凤', '神凤', '圣凤'],
    species: '神兽',
    description: '传说中的神兽凤凰，拥有强大的力量。',
    rarity: '仙品',
    image: '🦅',
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-blessing',
        name: '祝福',
        description: '提升属性',
        type: 'support',
        effect: { buff: { attack: 250, defense: 150 } },
        cooldown: 5,
      },
      {
        id: 'skill-rebirth',
        name: '涅槃',
        description: '复活主人',
        type: 'support',
        effect: { heal: 50000 },
        cooldown: 10,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: '凤凰羽', quantity: 5 }, { name: '九转金丹', quantity: 3 }],
      },
      stage2: {
        level: 70,
        items: [{ name: '混沌石', quantity: 2 }, { name: '大道碎片', quantity: 2 }, { name: '仙灵本源', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '不死凤凰',
      stage2: '涅槃神凤',
    },
  },
  // 新增20种灵宠
  {
    id: 'pet-ice-dragon',
    name: '冰龙',
    nameVariants: ['冰龙', '寒冰龙', '霜龙', '雪龙', '冰霜龙', '极冰龙', '玄冰龙', '冰魄龙'],
    species: '龙族',
    description: '掌控寒冰之力的龙族，防御力极强。',
    rarity: '传说',
    image: '🐉',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-ice-breath',
        name: '冰霜吐息',
        description: '冰属性范围攻击',
        type: 'attack',
        effect: { damage: 400 },
        cooldown: 4,
      },
      {
        id: 'skill-ice-shield',
        name: '冰霜护盾',
        description: '提升主人防御',
        type: 'defense',
        effect: { buff: { defense: 200 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 5 }, { name: '星辰碎片', quantity: 5 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 3 }, { name: '天材地宝', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '寒冰龙王',
      stage2: '极冰神龙',
    },
  },
  {
    id: 'pet-fire-bird',
    name: '火鸟',
    nameVariants: ['火鸟', '烈焰鸟', '炎鸟', '赤鸟', '火灵鸟', '炽鸟', '焚鸟', '火羽鸟'],
    species: '鸟族',
    description: '掌控火焰之力的灵鸟，攻击力强大。',
    rarity: '稀有',
    image: '🔥',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-fire-storm',
        name: '火焰风暴',
        description: '火属性攻击',
        type: 'attack',
        effect: { damage: 70 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: '妖兽内丹', quantity: 8 }, { name: '灵兽精血', quantity: 3 }],
      },
      stage2: {
        level: 40,
        items: [{ name: '凤凰羽', quantity: 3 }, { name: '仙灵果', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: '烈焰鸟',
      stage2: '朱雀',
    },
  },
  {
    id: 'pet-earth-turtle',
    name: '土龟',
    nameVariants: ['土龟', '石龟', '山龟', '地龟', '岩龟', '厚甲龟', '坚盾龟', '大地龟'],
    species: '龟族',
    description: '防御力极强的灵龟，擅长守护。',
    rarity: '普通',
    image: '🐢',
    baseStats: { attack: 30, defense: 50, hp: 500, speed: 20 },
    skills: [
      {
        id: 'skill-earth-shield',
        name: '大地守护',
        description: '大幅提升防御',
        type: 'defense',
        effect: { buff: { defense: 300, hp: 500 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 5 }, { name: '星辰碎片', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: '玄龟',
      stage2: '玄武',
    },
  },
  {
    id: 'pet-wind-wolf',
    name: '风狼',
    nameVariants: ['风狼', '疾风狼', '追风狼', '旋风狼', '狂风狼', '风影狼', '风灵狼', '疾影狼'],
    species: '狼族',
    description: '速度极快的风狼，擅长突袭。',
    rarity: '稀有',
    image: '🐺',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-wind-blade',
        name: '风刃',
        description: '高速攻击',
        type: 'attack',
        effect: { damage: 275 },
        cooldown: 2,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '妖兽内丹', quantity: 6 }, { name: '灵兽精血', quantity: 2 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '星辰碎片', quantity: 8 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '疾风狼王',
      stage2: '天狼',
    },
  },
  {
    id: 'pet-water-serpent',
    name: '水蛇',
    nameVariants: ['水蛇', '灵水蛇', '碧水蛇', '清波蛇', '水灵蛇', '流波蛇', '水影蛇', '柔水蛇'],
    species: '蛇族',
    description: '灵活的水蛇，擅长治疗和辅助。',
    rarity: '普通',
    image: '🐍',
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-water-heal',
        name: '水疗术',
        description: '恢复气血',
        type: 'support',
        effect: { heal: 400 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: '聚灵草', quantity: 12 }],
      },
      stage2: {
        level: 30,
        items: [{ name: '月华石', quantity: 4 }, { name: '灵兽精血', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '水灵蛇',
      stage2: '蛟龙',
    },
  },
  {
    id: 'pet-shadow-cat',
    name: '影猫',
    nameVariants: ['影猫', '暗影猫', '夜猫', '幽影猫', '影灵猫', '暗夜猫', '影魅猫', '黑猫'],
    species: '猫族',
    description: '神秘的影猫，擅长暗影攻击。',
    rarity: '稀有',
    image: '🐱',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 50 },
    skills: [
      {
        id: 'skill-shadow-strike',
        name: '暗影突袭',
        description: '高伤害暗影攻击',
        type: 'attack',
        effect: { damage: 450 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 7 }, { name: '星辰碎片', quantity: 4 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '麒麟角', quantity: 2 }, { name: '九转金丹', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '暗影猫王',
      stage2: '九命影猫',
    },
  },
  {
    id: 'pet-light-rabbit',
    name: '光兔',
    nameVariants: ['光兔', '月兔', '玉兔', '灵兔', '光灵兔', '圣光兔', '明兔', '辉兔'],
    species: '兔族',
    description: '温和的光兔，擅长辅助和治疗。',
    rarity: '普通',
    image: '🐰',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-light-blessing',
        name: '光明祝福',
        description: '恢复气血并提升属性',
        type: 'support',
        effect: { heal: 300, buff: { attack: 100, defense: 75 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 5 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '月兔',
      stage2: '玉兔',
    },
  },
  {
    id: 'pet-thunder-eagle',
    name: '雷鹰',
    nameVariants: ['雷鹰', '雷霆鹰', '闪电鹰', '天雷鹰', '雷暴鹰', '霹雳鹰', '雷神鹰', '风暴鹰'],
    species: '鹰族',
    description: '掌控雷电的雄鹰，攻击力强大。',
    rarity: '传说',
    image: '🦅',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-thunder-bolt',
        name: '雷霆一击',
        description: '强力雷属性攻击',
        type: 'attack',
        effect: { damage: 600 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 4 }, { name: '星辰碎片', quantity: 6 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 3 }, { name: '天材地宝', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '雷神鹰',
      stage2: '天雷神鹰',
    },
  },
  {
    id: 'pet-poison-spider',
    name: '毒蛛',
    nameVariants: ['毒蛛', '剧毒蛛', '毒灵蛛', '毒影蛛', '毒王蛛', '毒液蛛', '毒刺蛛', '毒牙蛛'],
    species: '蛛族',
    description: '擅长用毒的灵蛛，攻击附带毒素。',
    rarity: '稀有',
    image: '🕷️',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-poison-bite',
        name: '毒牙',
        description: '带毒的持续伤害攻击',
        type: 'attack',
        effect: { damage: 325 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '妖兽内丹', quantity: 8 }, { name: '灵兽精血', quantity: 3 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '麒麟角', quantity: 2 }, { name: '仙灵果', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: '毒王蛛',
      stage2: '万毒蛛皇',
    },
  },
  {
    id: 'pet-forest-deer',
    name: '灵鹿',
    nameVariants: ['灵鹿', '仙鹿', '灵角鹿', '森林鹿', '自然鹿', '灵性鹿', '翠鹿', '绿鹿'],
    species: '鹿族',
    description: '温和的灵鹿，擅长辅助和恢复。',
    rarity: '普通',
    image: '🦌',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-nature-heal',
        name: '自然治愈',
        description: '恢复大量气血',
        type: 'support',
        effect: { heal: 500 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 15 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 5 }, { name: '灵兽精血', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: '仙鹿',
      stage2: '九色鹿',
    },
  },
  {
    id: 'pet-iron-bear',
    name: '铁熊',
    nameVariants: ['铁熊', '钢铁熊', '金刚熊', '铁甲熊', '坚盾熊', '重甲熊', '铁壁熊', '钢爪熊'],
    species: '熊族',
    description: '防御力极强的铁熊，擅长守护。',
    rarity: '稀有',
    image: '🐻',
    baseStats: { attack: 80, defense: 60, hp: 1000, speed: 25 },
    skills: [
      {
        id: 'skill-iron-defense',
        name: '钢铁守护',
        description: '大幅提升防御',
        type: 'defense',
        effect: { buff: { defense: 400, hp: 750 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 6 }, { name: '星辰碎片', quantity: 5 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '九转金丹', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '金刚熊',
      stage2: '神铁熊',
    },
  },
  {
    id: 'pet-crystal-butterfly',
    name: '晶蝶',
    nameVariants: ['晶蝶', '水晶蝶', '灵晶蝶', '彩晶蝶', '幻晶蝶', '星晶蝶', '月晶蝶', '光晶蝶'],
    species: '蝶族',
    description: '美丽的晶蝶，擅长辅助和增益。',
    rarity: '稀有',
    image: '🦋',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 45 },
    skills: [
      {
        id: 'skill-crystal-blessing',
        name: '晶华祝福',
        description: '提升全属性',
        type: 'support',
        effect: { buff: { attack: 150, defense: 125 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: '月华石', quantity: 5 }, { name: '灵兽精血', quantity: 3 }],
      },
      stage2: {
        level: 40,
        items: [{ name: '星辰碎片', quantity: 8 }, { name: '仙灵果', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: '七彩晶蝶',
      stage2: '仙晶蝶',
    },
  },
  {
    id: 'pet-stone-golem',
    name: '石魔',
    nameVariants: ['石魔', '巨石魔', '山岳魔', '岩石魔', '坚石魔', '石巨人', '石像魔', '石灵魔'],
    species: '魔物',
    description: '防御力极强的石魔，擅长守护。',
    rarity: '传说',
    image: '🗿',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 30 },
    skills: [
      {
        id: 'skill-stone-wall',
        name: '石墙守护',
        description: '大幅提升防御和气血',
        type: 'defense',
        effect: { buff: { defense: 500, hp: 1000 } },
        cooldown: 7,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: '龙鳞片', quantity: 5 }, { name: '麒麟角', quantity: 3 }],
      },
      stage2: {
        level: 65,
        items: [{ name: '神兽精魄', quantity: 4 }, { name: '天材地宝', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '巨石魔',
      stage2: '山岳巨魔',
    },
  },
  {
    id: 'pet-void-owl',
    name: '虚空猫头鹰',
    nameVariants: ['虚空猫头鹰', '虚空鹰', '虚无鹰', '暗空鹰', '虚影鹰', '空灵鹰', '虚界鹰', '混沌鹰'],
    species: '鸟族',
    description: '掌控虚空之力的猫头鹰，神秘而强大。',
    rarity: '传说',
    image: '🦉',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-void-strike',
        name: '虚空打击',
        description: '无视防御的虚空攻击',
        type: 'attack',
        effect: { damage: 550 },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 28,
        items: [{ name: '龙鳞片', quantity: 4 }, { name: '凤凰羽', quantity: 3 }],
      },
      stage2: {
        level: 65,
        items: [{ name: '混沌石', quantity: 2 }, { name: '大道碎片', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '虚空神鹰',
      stage2: '混沌猫头鹰',
    },
  },
  {
    id: 'pet-golden-lion',
    name: '金狮',
    nameVariants: ['金狮', '黄金狮', '金毛狮', '金鬃狮', '金甲狮', '金辉狮', '金耀狮', '金王狮'],
    species: '狮族',
    description: '威严的金狮，攻击和防御均衡。',
    rarity: '传说',
    image: '🦁',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-golden-roar',
        name: '黄金咆哮',
        description: '提升攻击和防御',
        type: 'support',
        effect: { buff: { attack: 250, defense: 200 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 5 }, { name: '麒麟角', quantity: 2 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 3 }, { name: '天材地宝', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '黄金狮王',
      stage2: '神金狮',
    },
  },
  {
    id: 'pet-silver-fox',
    name: '银狐',
    nameVariants: ['银狐', '月银狐', '银光狐', '银雪狐', '银月狐', '银辉狐', '银灵狐', '银影狐'],
    species: '狐族',
    description: '优雅的银狐，擅长速度和辅助。',
    rarity: '稀有',
    image: '🦊',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-silver-flash',
        name: '银光闪',
        description: '高速攻击',
        type: 'attack',
        effect: { damage: 70 },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '月华石', quantity: 6 }, { name: '灵兽精血', quantity: 3 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '星辰碎片', quantity: 8 }, { name: '仙灵果', quantity: 4 }],
      },
    },
    evolutionNames: {
      stage1: '月银狐',
      stage2: '天银狐',
    },
  },
  {
    id: 'pet-rainbow-peacock',
    name: '彩孔雀',
    nameVariants: ['彩孔雀', '七彩孔雀', '彩虹孔雀', '彩羽孔雀', '彩灵孔雀', '彩霞孔雀', '彩云孔雀', '彩光孔雀'],
    species: '鸟族',
    description: '美丽的彩孔雀，擅长辅助和增益。',
    rarity: '稀有',
    image: '🦚',
    baseStats: { attack: 100, defense: 60, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-rainbow-dance',
        name: '彩虹之舞',
        description: '提升全属性',
        type: 'support',
        effect: { buff: { attack: 175, defense: 150 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '月华石', quantity: 7 }, { name: '星辰碎片', quantity: 5 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '凤凰羽', quantity: 3 }, { name: '仙灵果', quantity: 5 }],
      },
    },
    evolutionNames: {
      stage1: '七彩孔雀',
      stage2: '仙孔雀',
    },
  },
  {
    id: 'pet-dark-dragon',
    name: '暗龙',
    nameVariants: ['暗龙', '暗黑龙', '黑魔龙', '暗影龙', '幽冥龙', '暗夜龙', '暗灵龙', '暗渊龙'],
    species: '龙族',
    description: '掌控黑暗之力的暗龙，攻击力极强。',
    rarity: '仙品',
    image: '🐲',
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-dark-blast',
        name: '暗黑冲击',
        description: '强力暗属性攻击',
        type: 'attack',
        effect: { damage: 150 },
        cooldown: 4,
      },
      {
        id: 'skill-dark-shield',
        name: '暗黑护盾',
        description: '提升防御并恢复气血',
        type: 'defense',
        effect: { buff: { defense: 300 }, heal: 500 },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '龙鳞片', quantity: 8 }, { name: '神兽精魄', quantity: 3 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '混沌石', quantity: 3 }, { name: '大道碎片', quantity: 3 }, { name: '造化神液', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '暗黑龙王',
      stage2: '混沌暗龙',
    },
  },
  {
    id: 'pet-light-unicorn',
    name: '光独角兽',
    nameVariants: ['光独角兽', '圣光独角兽', '神圣独角兽', '光明独角兽', '天光独角兽', '神光独角兽', '圣洁独角兽', '光辉独角兽'],
    species: '神兽',
    description: '神圣的光独角兽，擅长治疗和辅助。',
    rarity: '仙品',
    image: '🦄',
    baseStats: { attack: 200, defense: 120, hp: 2500, speed: 60 },
    skills: [
      {
        id: 'skill-holy-heal',
        name: '神圣治愈',
        description: '恢复大量气血',
        type: 'support',
        effect: { heal: 1000 },
        cooldown: 4,
      },
      {
        id: 'skill-holy-blessing',
        name: '神圣祝福',
        description: '提升全属性',
        type: 'support',
        effect: { buff: { attack: 300, defense: 250, hp: 750 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '麒麟角', quantity: 5 }, { name: '九转金丹', quantity: 4 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '仙灵本源', quantity: 2 }, { name: '造化神液', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '圣光独角兽',
      stage2: '神光独角兽',
    },
  },
  {
    id: 'pet-ice-phoenix',
    name: '冰凤凰',
    nameVariants: ['冰凤凰', '寒冰凤凰', '冰霜凤凰', '极冰凤凰', '玄冰凤凰', '冰魄凤凰', '雪凤', '冰灵凤凰'],
    species: '神兽',
    description: '掌控寒冰的凤凰，防御和治疗并重。',
    rarity: '仙品',
    image: '❄️',
    baseStats: { attack: 200, defense: 130, hp: 2500, speed: 55 },
    skills: [
      {
        id: 'skill-ice-storm',
        name: '冰霜风暴',
        description: '范围冰属性攻击',
        type: 'attack',
        effect: { damage: 700 },
        cooldown: 5,
      },
      {
        id: 'skill-ice-recovery',
        name: '冰霜恢复',
        description: '恢复气血并提升防御',
        type: 'support',
        effect: { heal: 750, buff: { defense: 250 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '凤凰羽', quantity: 8 }, { name: '神兽精魄', quantity: 3 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '混沌石', quantity: 3 }, { name: '大道碎片', quantity: 3 }, { name: '仙灵本源', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '寒冰凤凰',
      stage2: '极冰神凤',
    },
  },
];

// --- 抽奖系统 ---
export const LOTTERY_PRIZES: LotteryPrize[] = [
  // 普通奖励 - 灵石
  {
    id: 'lottery-stone-10',
    name: '10灵石',
    type: 'spiritStones',
    rarity: '普通',
    weight: 35,
    value: { spiritStones: 10 },
  },
  {
    id: 'lottery-stone-50',
    name: '50灵石',
    type: 'spiritStones',
    rarity: '普通',
    weight: 25,
    value: { spiritStones: 50 },
  },
  {
    id: 'lottery-stone-100',
    name: '100灵石',
    type: 'spiritStones',
    rarity: '稀有',
    weight: 18,
    value: { spiritStones: 100 },
  },
  {
    id: 'lottery-stone-500',
    name: '500灵石',
    type: 'spiritStones',
    rarity: '稀有',
    weight: 8,
    value: { spiritStones: 500 },
  },
  {
    id: 'lottery-stone-1000',
    name: '1000灵石',
    type: 'spiritStones',
    rarity: '传说',
    weight: 3,
    value: { spiritStones: 1000 },
  },

  // 普通奖励 - 修为
  {
    id: 'lottery-exp-50',
    name: '50修为',
    type: 'exp',
    rarity: '普通',
    weight: 30,
    value: { exp: 50 },
  },
  {
    id: 'lottery-exp-200',
    name: '200修为',
    type: 'exp',
    rarity: '普通',
    weight: 20,
    value: { exp: 200 },
  },
  {
    id: 'lottery-exp-500',
    name: '500修为',
    type: 'exp',
    rarity: '稀有',
    weight: 12,
    value: { exp: 500 },
  },
  {
    id: 'lottery-exp-2000',
    name: '2000修为',
    type: 'exp',
    rarity: '传说',
    weight: 4,
    value: { exp: 2000 },
  },

  // 普通奖励 - 丹药
  {
    id: 'lottery-pill-qi',
    name: '聚气丹',
    type: 'item',
    rarity: '普通',
    weight: 18,
    value: {
      item: {
        name: '聚气丹',
        type: ItemType.Pill,
        description: '短时间内大幅提升修炼速度',
        quantity: 1,
        rarity: '普通',
        effect: { exp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-qi-2',
    name: '聚气丹x3',
    type: 'item',
    rarity: '普通',
    weight: 12,
    value: {
      item: {
        name: '聚气丹',
        type: ItemType.Pill,
        description: '短时间内大幅提升修炼速度',
        quantity: 3,
        rarity: '普通',
        effect: { exp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-heal',
    name: '回春丹',
    type: 'item',
    rarity: '普通',
    weight: 15,
    value: {
      item: {
        name: '回春丹',
        type: ItemType.Pill,
        description: '疗伤圣药，大幅恢复气血',
        quantity: 1,
        rarity: '稀有',
        effect: { hp: 200 },
      },
    },
  },
  {
    id: 'lottery-pill-marrow',
    name: '洗髓丹',
    type: 'item',
    rarity: '稀有',
    weight: 10,
    value: {
      item: {
        name: '洗髓丹',
        type: ItemType.Pill,
        description: '易筋洗髓，脱胎换骨',
        quantity: 1,
        rarity: '稀有',
        effect: { hp: 50 },
      },
    },
  },
  {
    id: 'lottery-pill-foundation',
    name: '筑基丹',
    type: 'item',
    rarity: '稀有',
    weight: 8,
    value: {
      item: {
        name: '筑基丹',
        type: ItemType.Pill,
        description: '增加突破到筑基期的几率',
        quantity: 1,
        rarity: '传说',
        effect: { exp: 500 },
      },
    },
  },
  {
    id: 'lottery-pill-golden',
    name: '结金丹',
    type: 'item',
    rarity: '传说',
    weight: 6,
    value: {
      item: {
        name: '结金丹',
        type: ItemType.Pill,
        description: '有助于凝结金丹的珍贵丹药',
        quantity: 1,
        rarity: '稀有',
        effect: { exp: 30000, spirit: 20 },
      },
    },
  },
  {
    id: 'lottery-pill-soul',
    name: '凝魂丹',
    type: 'item',
    rarity: '传说',
    weight: 4,
    value: {
      item: {
        name: '凝魂丹',
        type: ItemType.Pill,
        description: '能够凝聚神魂的珍贵丹药',
        quantity: 1,
        rarity: '传说',
        effect: { exp: 10000, spirit: 50, hp: 300 },
      },
    },
  },
  {
    id: 'lottery-pill-dragon',
    name: '龙血丹',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '龙血丹',
        type: ItemType.Pill,
        description: '蕴含一丝真龙之血，气血如龙',
        quantity: 1,
        rarity: '传说',
        effect: { hp: 500, attack: 20, defense: 20 },
      },
    },
  },
  {
    id: 'lottery-pill-phoenix',
    name: '凤凰涅槃丹',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '凤凰涅槃丹',
        type: ItemType.Pill,
        description: '蕴含凤凰涅槃之力的神丹',
        quantity: 1,
        rarity: '传说',
        effect: { hp: 800, exp: 1500, attack: 30 },
      },
    },
  },
  {
    id: 'lottery-pill-immortal',
    name: '九转金丹',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '九转金丹',
        type: ItemType.Pill,
        description: '传说中的仙丹，能让凡人立地飞升',
        quantity: 1,
        rarity: '仙品',
        effect: { exp: 5000, attack: 10, defense: 10 },
      },
    },
  },

  // 普通奖励 - 材料
  {
    id: 'lottery-material-refining',
    name: '炼器石',
    type: 'item',
    rarity: '普通',
    weight: 16,
    value: {
      item: {
        name: '炼器石',
        type: ItemType.Material,
        description: '用于强化法宝的基础材料',
        quantity: 5,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-refining-2',
    name: '炼器石x10',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '炼器石',
        type: ItemType.Material,
        description: '用于强化法宝的基础材料',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone',
    name: '强化石',
    type: 'item',
    rarity: '稀有',
    weight: 10,
    value: {
      item: {
        name: '强化石',
        type: ItemType.Material,
        description: '提高装备强化成功率的珍贵材料，每颗可提高10%成功率',
        quantity: 1,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-upgrade-stone-3',
    name: '强化石x10',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '强化石',
        type: ItemType.Material,
        description: '提高装备强化成功率的珍贵材料，每颗可提高10%成功率',
        quantity: 10,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-spirit',
    name: '灵石碎片',
    type: 'item',
    rarity: '普通',
    weight: 14,
    value: {
      item: {
        name: '灵石碎片',
        type: ItemType.Material,
        description: '破碎的灵石，可用于炼器',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-iron',
    name: '精铁',
    type: 'item',
    rarity: '普通',
    weight: 12,
    value: {
      item: {
        name: '精铁',
        type: ItemType.Material,
        description: '经过提炼的精铁，是炼器的好材料',
        quantity: 5,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-silver',
    name: '秘银',
    type: 'item',
    rarity: '稀有',
    weight: 7,
    value: {
      item: {
        name: '秘银',
        type: ItemType.Material,
        description: '珍贵的炼器材料，能够提升法宝品质',
        quantity: 3,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-dragon-scale',
    name: '龙鳞',
    type: 'item',
    rarity: '传说',
    weight: 3,
    value: {
      item: {
        name: '龙鳞',
        type: ItemType.Material,
        description: '真龙身上的鳞片，是炼制顶级法宝的材料',
        quantity: 1,
        rarity: '传说',
      },
    },
  },
  {
    id: 'lottery-material-herb',
    name: '聚灵草',
    type: 'item',
    rarity: '普通',
    weight: 15,
    value: {
      item: {
        name: '聚灵草',
        type: ItemType.Herb,
        description: '吸收天地灵气的草药',
        quantity: 10,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-herb-2',
    name: '聚灵草x20',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '聚灵草',
        type: ItemType.Herb,
        description: '吸收天地灵气的草药',
        quantity: 20,
        rarity: '普通',
      },
    },
  },
  {
    id: 'lottery-material-rare',
    name: '紫猴花',
    type: 'item',
    rarity: '稀有',
    weight: 8,
    value: {
      item: {
        name: '紫猴花',
        type: ItemType.Herb,
        description: '炼制洗髓丹的材料',
        quantity: 3,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-snow-lotus',
    name: '雪莲花',
    type: 'item',
    rarity: '稀有',
    weight: 6,
    value: {
      item: {
        name: '雪莲花',
        type: ItemType.Herb,
        description: '生长在极寒之地的灵花，药效极强',
        quantity: 2,
        rarity: '稀有',
      },
    },
  },
  {
    id: 'lottery-material-legend',
    name: '千年人参',
    type: 'item',
    rarity: '传说',
    weight: 4,
    value: {
      item: {
        name: '千年人参',
        type: ItemType.Herb,
        description: '千年灵药，珍贵无比',
        quantity: 2,
        rarity: '传说',
      },
    },
  },
  {
    id: 'lottery-material-phoenix-feather',
    name: '凤凰羽',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '凤凰羽',
        type: ItemType.Material,
        description: '凤凰身上的羽毛，蕴含涅槃之力',
        quantity: 1,
        rarity: '传说',
      },
    },
  },

  // 普通奖励 - 装备（武器）
  {
    id: 'lottery-weapon-iron',
    name: '精铁剑',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '精铁剑',
        type: ItemType.Weapon,
        description: '精铁打造的利剑，锋利无比',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 10 },
      },
    },
  },
  {
    id: 'lottery-weapon-bronze',
    name: '青铜刀',
    type: 'item',
    rarity: '普通',
    weight: 9,
    value: {
      item: {
        name: '青铜刀',
        type: ItemType.Weapon,
        description: '青铜锻造的宝刀，刀锋锐利',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 12 },
      },
    },
  },
  {
    id: 'lottery-weapon-frost',
    name: '青霜剑',
    type: 'item',
    rarity: '稀有',
    weight: 6,
    value: {
      item: {
        name: '青霜剑',
        type: ItemType.Weapon,
        description: '剑身泛着寒光，削铁如泥',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 15 },
      },
    },
  },
  {
    id: 'lottery-weapon-fire',
    name: '烈焰枪',
    type: 'item',
    rarity: '稀有',
    weight: 5,
    value: {
      item: {
        name: '烈焰枪',
        type: ItemType.Weapon,
        description: '枪身燃烧着烈焰，威力惊人',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 18, hp: 20 },
      },
    },
  },
  {
    id: 'lottery-weapon-thunder',
    name: '雷光剑',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '雷光剑',
        type: ItemType.Weapon,
        description: '剑身缠绕着雷光，速度极快',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 20, speed: 10 },
      },
    },
  },
  {
    id: 'lottery-weapon-sky',
    name: '天罡剑',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '天罡剑',
        type: ItemType.Weapon,
        description: '传说中的天罡剑，剑气纵横',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 200, defense: 50 },
      },
    },
  },
  {
    id: 'lottery-weapon-dragon',
    name: '龙吟刀',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '龙吟刀',
        type: ItemType.Weapon,
        description: '刀出如龙吟，威力惊天',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 220, defense: 40, hp: 100 },
      },
    },
  },
  {
    id: 'lottery-weapon-immortal',
    name: '诛仙剑',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '诛仙剑',
        type: ItemType.Weapon,
        description: '传说中的仙剑，可诛仙灭魔',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 3000, defense: 200, hp: 500, spirit: 100 },
      },
    },
  },

  // 普通奖励 - 装备（防具）
  {
    id: 'lottery-armor-cloth',
    name: '布甲',
    type: 'item',
    rarity: '普通',
    weight: 10,
    value: {
      item: {
        name: '布甲',
        type: ItemType.Armor,
        description: '普通的布制护甲，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 5, hp: 20 },
      },
    },
  },
  {
    id: 'lottery-armor-leather',
    name: '皮甲',
    type: 'item',
    rarity: '普通',
    weight: 9,
    value: {
      item: {
        name: '皮甲',
        type: ItemType.Armor,
        description: '用兽皮制作的护甲，比布甲更坚固',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-armor-cloud',
    name: '云灵道袍',
    type: 'item',
    rarity: '稀有',
    weight: 6,
    value: {
      item: {
        name: '云灵道袍',
        type: ItemType.Armor,
        description: '云灵宗内门弟子道袍，防御力不俗',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 15, hp: 50 },
      },
    },
  },
  {
    id: 'lottery-armor-iron',
    name: '铁甲',
    type: 'item',
    rarity: '稀有',
    weight: 5,
    value: {
      item: {
        name: '铁甲',
        type: ItemType.Armor,
        description: '精铁打造的护甲，防御力强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 20, hp: 60 },
      },
    },
  },
  {
    id: 'lottery-armor-dragon',
    name: '龙鳞甲',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '龙鳞甲',
        type: ItemType.Armor,
        description: '用真龙鳞片打造的护甲，防御力极强',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 150, hp: 500, attack: 30 },
      },
    },
  },
  {
    id: 'lottery-armor-phoenix',
    name: '凤凰羽衣',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '凤凰羽衣',
        type: ItemType.Armor,
        description: '用凤凰羽毛编织的仙衣，轻盈而坚固',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 140, hp: 450, speed: 30, spirit: 40 },
      },
    },
  },
  {
    id: 'lottery-armor-immortal',
    name: '仙灵道袍',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵道袍',
        type: ItemType.Armor,
        description: '仙灵所制的道袍，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 800, hp: 3000, attack: 100, spirit: 200 },
      },
    },
  },

  // 普通奖励 - 装备（饰品）
  {
    id: 'lottery-ring-copper',
    name: '铜戒指',
    type: 'item',
    rarity: '普通',
    weight: 9,
    value: {
      item: {
        name: '铜戒指',
        type: ItemType.Ring,
        description: '普通的铜制戒指，略微提升属性',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 2, defense: 2 },
      },
    },
  },
  {
    id: 'lottery-ring-silver',
    name: '银戒指',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '银戒指',
        type: ItemType.Ring,
        description: '银制的戒指，比铜戒指更精致',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { defense: 5 },
      },
    },
  },
  {
    id: 'lottery-ring-gold',
    name: '金戒指',
    type: 'item',
    rarity: '稀有',
    weight: 5,
    value: {
      item: {
        name: '金戒指',
        type: ItemType.Ring,
        description: '黄金打造的戒指，属性加成不错',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 15, defense: 15 },
      },
    },
  },
  {
    id: 'lottery-ring-star',
    name: '星辰戒指',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰戒指',
        type: ItemType.Ring,
        description: '蕴含星辰之力的戒指，威力强大',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 40, defense: 40, speed: 20 },
      },
    },
  },
  {
    id: 'lottery-ring-daopath',
    name: '大道戒指',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '大道戒指',
        type: ItemType.Ring,
        description: '蕴含大道之力的戒指，威力强大',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 1000, defense: 1000, speed: 1000, spirit: 1000 },
      },
    },
  },
  {
    id: 'lottery-accessory-protect',
    name: '护身符',
    type: 'item',
    rarity: '普通',
    weight: 5,
    value: {
      item: {
        name: '护身符',
        type: ItemType.Accessory,
        description: '普通的护身符，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-accessory-jade',
    name: '玉佩',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玉佩',
        type: ItemType.Accessory,
        description: '温润的玉佩，能够静心凝神',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { spirit: 30, hp: 80, defense: 15 },
      },
    },
  },
  {
    id: 'lottery-accessory-immortal',
    name: '仙灵玉佩',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '仙灵玉佩',
        type: ItemType.Accessory,
        description: '仙灵所制的玉佩，蕴含无上仙力',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { attack: 50, defense: 50, hp: 300, spirit: 80 },
      },
    },
  },
  {
    id: 'lottery-accessory-shenpath',
    name: '神道符',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '神道符',
        type: ItemType.Accessory,
        description: '蕴含神道的符箓，据说的得到的人可以窥探天机',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { attack: 2000, defense: 400, hp: 500, spirit: 30000 },
      },
    },
  },

  // 普通奖励 - 法宝
  {
    id: 'lottery-artifact-common-1',
    name: '聚灵珠',
    type: 'item',
    rarity: '普通',
    weight: 6,
    value: {
      item: {
        name: '聚灵珠',
        type: ItemType.Artifact,
        description: '能够聚集天地灵气的宝珠，略微提升修炼速度',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { spirit: 10, exp: 5 },
      },
    },
  },
  {
    id: 'lottery-artifact-common-2',
    name: '护体符',
    type: 'item',
    rarity: '普通',
    weight: 6,
    value: {
      item: {
        name: '护体符',
        type: ItemType.Artifact,
        description: '基础的护身符箓，提供微弱的防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { defense: 10, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-1',
    name: '玄灵镜',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄灵镜',
        type: ItemType.Artifact,
        description: '能够洞察虚实的宝镜，提升神识和防御',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { spirit: 30, defense: 20 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-2',
    name: '紫霄钟',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '紫霄钟',
        type: ItemType.Artifact,
        description: '紫霄宫传承法宝，钟声可震慑邪魔',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 100, defense: 50, hp: 200, spirit: 20 },
      },
    },
  },
  {
    id: 'lottery-artifact-rare-3',
    name: '阴阳扇',
    type: 'item',
    rarity: '稀有',
    weight: 3,
    value: {
      item: {
        name: '阴阳扇',
        type: ItemType.Artifact,
        description: '蕴含阴阳之力的宝扇，攻防兼备',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 90, defense: 70, hp: 220 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-1',
    name: '星辰盘',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰盘',
        type: ItemType.Artifact,
        description: '能够引动星辰之力的法宝，威力无穷',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 50, defense: 50, spirit: 50 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-2',
    name: '九幽塔',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '九幽塔',
        type: ItemType.Artifact,
        description: '来自九幽之地的宝塔，可镇压一切邪祟',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 500, defense: 300, hp: 1000, spirit: 80 },
      },
    },
  },
  {
    id: 'lottery-artifact-legend-3',
    name: '太虚鼎',
    type: 'item',
    rarity: '传说',
    weight: 1,
    value: {
      item: {
        name: '太虚鼎',
        type: ItemType.Artifact,
        description: '太虚道人的本命法宝，蕴含虚空之力',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 550, defense: 250, hp: 1100, spirit: 120 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-1',
    name: '仙灵宝珠',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵宝珠',
        type: ItemType.Artifact,
        description: '仙灵凝聚而成的宝珠，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 150, defense: 150, spirit: 150, hp: 500 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-2',
    name: '太极图',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '太极图',
        type: ItemType.Artifact,
        description: '先天至宝，蕴含太极阴阳大道',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 2000, defense: 1000, hp: 5000, spirit: 600 },
      },
    },
  },
  {
    id: 'lottery-artifact-immortal-3',
    name: '混沌印',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '混沌印',
        type: ItemType.Artifact,
        description: '开天辟地时诞生的至宝，可镇压万物',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Artifact1,
        effect: { attack: 2200, defense: 1100, hp: 5500, spirit: 550 },
      },
    },
  },

  // 普通奖励 - 装备（头部）
  {
    id: 'lottery-head-cloth',
    name: '布帽',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '布帽',
        type: ItemType.Armor,
        description: '普通的布制帽子，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-head-iron',
    name: '铁头盔',
    type: 'item',
    rarity: '普通',
    weight: 7,
    value: {
      item: {
        name: '铁头盔',
        type: ItemType.Armor,
        description: '精铁打造的头盔，防御力不错',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-head-mystic',
    name: '玄铁头盔',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄铁头盔',
        type: ItemType.Armor,
        description: '玄铁打造的头盔，防御力强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-head-star',
    name: '星辰头冠',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰头冠',
        type: ItemType.Armor,
        description: '蕴含星辰之力的头冠，威力强大',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-head-immortal',
    name: '仙灵道冠',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵道冠',
        type: ItemType.Armor,
        description: '仙灵所制的道冠，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // 普通奖励 - 装备（肩部）
  {
    id: 'lottery-shoulder-cloth',
    name: '布肩',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '布肩',
        type: ItemType.Armor,
        description: '普通的布制肩甲，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-shoulder-iron',
    name: '铁肩甲',
    type: 'item',
    rarity: '普通',
    weight: 7,
    value: {
      item: {
        name: '铁肩甲',
        type: ItemType.Armor,
        description: '精铁打造的肩甲，防御力不错',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-shoulder-mystic',
    name: '玄铁肩甲',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄铁肩甲',
        type: ItemType.Armor,
        description: '玄铁打造的肩甲，防御力强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-shoulder-star',
    name: '星辰云肩',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰云肩',
        type: ItemType.Armor,
        description: '蕴含星辰之力的云肩，威力强大',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-shoulder-immortal',
    name: '仙灵云肩',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵云肩',
        type: ItemType.Armor,
        description: '仙灵所制的云肩，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // 普通奖励 - 装备（手套）
  {
    id: 'lottery-gloves-cloth',
    name: '布手套',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '布手套',
        type: ItemType.Armor,
        description: '普通的布制手套，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 3, hp: 15 },
      },
    },
  },
  {
    id: 'lottery-gloves-iron',
    name: '铁护手',
    type: 'item',
    rarity: '普通',
    weight: 7,
    value: {
      item: {
        name: '铁护手',
        type: ItemType.Armor,
        description: '精铁打造的护手，防御力不错',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 8, hp: 30 },
      },
    },
  },
  {
    id: 'lottery-gloves-mystic',
    name: '玄铁护手',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄铁护手',
        type: ItemType.Armor,
        description: '玄铁打造的护手，防御力强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 25, hp: 60, spirit: 10 },
      },
    },
  },
  {
    id: 'lottery-gloves-star',
    name: '星辰法手',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰法手',
        type: ItemType.Armor,
        description: '蕴含星辰之力的法手，威力强大',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
      },
    },
  },
  {
    id: 'lottery-gloves-immortal',
    name: '仙灵法手',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵法手',
        type: ItemType.Armor,
        description: '仙灵所制的法手，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves,
        effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
      },
    },
  },

  // 普通奖励 - 装备（裤腿）
  {
    id: 'lottery-legs-cloth',
    name: '布裤',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '布裤',
        type: ItemType.Armor,
        description: '普通的布制裤子，提供基础防护',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 4, hp: 18 },
      },
    },
  },
  {
    id: 'lottery-legs-iron',
    name: '铁护腿',
    type: 'item',
    rarity: '普通',
    weight: 7,
    value: {
      item: {
        name: '铁护腿',
        type: ItemType.Armor,
        description: '精铁打造的护腿，防御力不错',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 10, hp: 40 },
      },
    },
  },
  {
    id: 'lottery-legs-mystic',
    name: '玄铁护腿',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄铁护腿',
        type: ItemType.Armor,
        description: '玄铁打造的护腿，防御力强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 30, hp: 80 },
      },
    },
  },
  {
    id: 'lottery-legs-star',
    name: '星辰护腿',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰护腿',
        type: ItemType.Armor,
        description: '蕴含星辰之力的护腿，威力强大',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 75, hp: 200, attack: 15 },
      },
    },
  },
  {
    id: 'lottery-legs-immortal',
    name: '仙灵法裤',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵法裤',
        type: ItemType.Armor,
        description: '仙灵所制的法裤，蕴含无上仙力',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs,
        effect: { defense: 180, hp: 500, spirit: 60 },
      },
    },
  },

  // 普通奖励 - 装备（鞋子）
  {
    id: 'lottery-boots-cloth',
    name: '布鞋',
    type: 'item',
    rarity: '普通',
    weight: 8,
    value: {
      item: {
        name: '布鞋',
        type: ItemType.Armor,
        description: '普通的布制鞋子，略微提升速度',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 3, speed: 2 },
      },
    },
  },
  {
    id: 'lottery-boots-iron',
    name: '铁战靴',
    type: 'item',
    rarity: '普通',
    weight: 7,
    value: {
      item: {
        name: '铁战靴',
        type: ItemType.Armor,
        description: '精铁打造的战靴，防御力和速度都不错',
        quantity: 1,
        rarity: '普通',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 8, speed: 5 },
      },
    },
  },
  {
    id: 'lottery-boots-mystic',
    name: '玄铁战靴',
    type: 'item',
    rarity: '稀有',
    weight: 4,
    value: {
      item: {
        name: '玄铁战靴',
        type: ItemType.Armor,
        description: '玄铁打造的战靴，防御力和速度强劲',
        quantity: 1,
        rarity: '稀有',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 25, speed: 12 },
      },
    },
  },
  {
    id: 'lottery-boots-star',
    name: '星辰战靴',
    type: 'item',
    rarity: '传说',
    weight: 2,
    value: {
      item: {
        name: '星辰战靴',
        type: ItemType.Armor,
        description: '蕴含星辰之力的战靴，速度极快',
        quantity: 1,
        rarity: '传说',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 60, hp: 150, speed: 25 },
      },
    },
  },
  {
    id: 'lottery-boots-immortal',
    name: '仙灵仙履',
    type: 'item',
    rarity: '仙品',
    weight: 1,
    value: {
      item: {
        name: '仙灵仙履',
        type: ItemType.Armor,
        description: '仙灵所制的仙履，蕴含无上仙力，速度惊人',
        quantity: 1,
        rarity: '仙品',
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots,
        effect: { defense: 150, hp: 400, speed: 60 },
      },
    },
  },

  // 普通奖励 - 灵宠
  {
    id: 'lottery-pet-fox',
    name: '灵狐',
    type: 'pet',
    rarity: '普通',
    weight: 5,
    value: { petId: 'pet-spirit-fox' },
  },
  {
    id: 'lottery-pet-tiger',
    name: '雷虎',
    type: 'pet',
    rarity: '稀有',
    weight: 3,
    value: { petId: 'pet-thunder-tiger' },
  },
  {
    id: 'lottery-pet-phoenix',
    name: '凤凰',
    type: 'pet',
    rarity: '仙品',
    weight: 1,
    value: { petId: 'pet-phoenix' },
  },

  // 普通奖励 - 抽奖券
  {
    id: 'lottery-ticket-1',
    name: '1张抽奖券',
    type: 'ticket',
    rarity: '普通',
    weight: 15,
    value: { tickets: 1 },
  },
  {
    id: 'lottery-ticket-3',
    name: '3张抽奖券',
    type: 'ticket',
    rarity: '稀有',
    weight: 6,
    value: { tickets: 3 },
  },
  {
    id: 'lottery-ticket-5',
    name: '5张抽奖券',
    type: 'ticket',
    rarity: '传说',
    weight: 2,
    value: { tickets: 5 },
  },
];

// --- 装备模板列表（从抽奖奖品中提取） ---
export const EQUIPMENT_TEMPLATES = LOTTERY_PRIZES.filter(
  (prize) => prize.type === 'item' && prize.value.item?.isEquippable
).map((prize) => {
  const item = prize.value.item!;
  return {
    name: item.name,
    type: item.type,
    rarity: item.rarity || '普通',
    slot: item.equipmentSlot!,
    effect: item.effect,
    description: item.description,
  };
});

// --- 商店系统 ---

export const SHOPS: Shop[] = [
  {
    id: 'shop-village',
    name: '村庄杂货铺',
    type: ShopType.Village,
    description: '小村庄的杂货铺，主要售卖基础物品和低阶材料。',
    items: [
      {
        id: 'shop-herb-1',
        name: '止血草',
        type: ItemType.Herb,
        description: '常见的草药，用于治疗轻微外伤。',
        rarity: '普通',
        price: 10,
        sellPrice: 3,
        effect: { hp: 20 },
      },
      {
        id: 'shop-material-1',
        name: '炼器石',
        type: ItemType.Material,
        description: '用于强化法宝的基础材料。',
        rarity: '普通',
        price: 15,
        sellPrice: 5,
      },
      {
        id: 'shop-pill-1',
        name: '聚气丹',
        type: ItemType.Pill,
        description: '短时间内大幅提升修炼速度。',
        rarity: '普通',
        price: 30,
        sellPrice: 10,
        effect: { exp: 50 },
      },
      {
        id: 'shop-weapon-1',
        name: '木剑',
        type: ItemType.Weapon,
        description: '普通的木制剑，适合初学者。',
        rarity: '普通',
        price: 50,
        sellPrice: 15,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 3 },
      },
    ],
  },
  {
    id: 'shop-city',
    name: '城市商会',
    type: ShopType.City,
    description: '繁华城市的商会，商品种类丰富，品质较高。',
    items: [
      {
        id: 'shop-herb-2',
        name: '聚灵草',
        type: ItemType.Herb,
        description: '吸收天地灵气的草药，炼制聚气丹的主材。',
        rarity: '普通',
        price: 20,
        sellPrice: 7,
      },
      {
        id: 'shop-pill-2',
        name: '回春丹',
        type: ItemType.Pill,
        description: '疗伤圣药，大幅恢复气血。',
        rarity: '稀有',
        price: 100,
        sellPrice: 30,
        effect: { hp: 200 },
      },
      {
        id: 'shop-weapon-2',
        name: '精铁剑',
        type: ItemType.Weapon,
        description: '精铁打造的利剑，锋利无比。',
        rarity: '普通',
        price: 150,
        sellPrice: 45,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 10 },
      },
      {
        id: 'shop-armor-1',
        name: '布甲',
        type: ItemType.Armor,
        description: '普通的布制护甲，提供基础防护。',
        rarity: '普通',
        price: 120,
        sellPrice: 36,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 5, hp: 20 },
      },
      {
        id: 'shop-ring-1',
        name: '铜戒指',
        type: ItemType.Ring,
        description: '普通的铜制戒指，略微提升属性。',
        rarity: '普通',
        price: 80,
        sellPrice: 24,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Ring1,
        effect: { attack: 2, defense: 2 },
      },
    ],
  },
  {
    id: 'shop-sect',
    name: '仙门宝库',
    type: ShopType.Sect,
    description: '仙门内部的宝库，只对门内弟子开放，售卖高阶物品。',
    items: [
      {
        id: 'shop-pill-3',
        name: '洗髓丹',
        type: ItemType.Pill,
        description: '易筋洗髓，脱胎换骨。永久增加少量最大生命值。',
        rarity: '稀有',
        price: 500,
        sellPrice: 150,
        effect: { hp: 50 },
        minRealm: RealmType.Foundation,
      },
      {
        id: 'shop-weapon-3',
        name: '青霜剑',
        type: ItemType.Weapon,
        description: '剑身泛着寒光，削铁如泥。',
        rarity: '稀有',
        price: 800,
        sellPrice: 240,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 15 },
        minRealm: RealmType.Foundation,
      },
      {
        id: 'shop-armor-2',
        name: '云灵道袍',
        type: ItemType.Armor,
        description: '云灵宗内门弟子道袍，防御力不俗。',
        rarity: '稀有',
        price: 600,
        sellPrice: 180,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 15, hp: 50 },
        minRealm: RealmType.Foundation,
      },
      {
        id: 'shop-pill-4',
        name: '筑基丹',
        type: ItemType.Pill,
        description: '增加突破到筑基期的几率。服用后获得海量修为。',
        rarity: '传说',
        price: 2000,
        sellPrice: 600,
        effect: { exp: 500 },
        minRealm: RealmType.QiRefining,
      },
      {
        id: 'shop-weapon-legend',
        name: '天罡剑',
        type: ItemType.Weapon,
        description: '传说中的天罡剑，剑气纵横，威力无穷。',
        rarity: '传说',
        price: 5000,
        sellPrice: 1500,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 200, defense: 50 },
        minRealm: RealmType.GoldenCore,
      },
      {
        id: 'shop-armor-legend',
        name: '龙鳞甲',
        type: ItemType.Armor,
        description: '用真龙鳞片打造的护甲，防御力极强。',
        rarity: '传说',
        price: 4000,
        sellPrice: 1200,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 150, hp: 500, attack: 30 },
        minRealm: RealmType.NascentSoul,
      },
      {
        id: 'shop-accessory-1',
        name: '护身符',
        type: ItemType.Accessory,
        description: '普通的护身符，提供基础防护。',
        rarity: '普通',
        price: 1000,
        sellPrice: 300,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Accessory1,
        effect: { defense: 3, hp: 15 },
        minRealm: RealmType.GoldenCore,
      },
      {
        id: 'shop-weapon-immortal',
        name: '仙剑·诛仙',
        type: ItemType.Weapon,
        description: '传说中的仙剑，一剑可诛仙，威力达到极致。',
        rarity: '仙品',
        price: 20000,
        sellPrice: 6000,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
        effect: { attack: 1000, defense: 200, hp: 500 },
        minRealm: RealmType.SpiritSevering,
      },
      {
        id: 'shop-armor-immortal',
        name: '仙甲·不灭',
        type: ItemType.Armor,
        description: '传说中的仙甲，防御力达到极致，几乎不灭。',
        rarity: '仙品',
        price: 18000,
        sellPrice: 5400,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest,
        effect: { defense: 800, hp: 2000, attack: 100 },
        minRealm: RealmType.SpiritSevering,
      },
    ],
  },
];

// ==================== 回合制战斗系统配置 ====================

import { BattleSkill, BattlePotion } from './types';

// 功法战斗技能配置
export const CULTIVATION_ART_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // 天雷剑诀 - 攻击技能
  'art-thunder-sword': [
    {
      id: 'skill-thunder-sword',
      name: '天雷剑诀',
      description: '引九天神雷入剑，对敌人造成大量法术伤害，有较高暴击率。',
      type: 'attack',
      source: 'cultivation_art',
      sourceId: 'art-thunder-sword',
      effects: [],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: {
        base: 50,
        multiplier: 1.5, // 150%攻击力
        type: 'magical', // 法术伤害（基于神识）
        critChance: 0.25,
        critMultiplier: 2.0,
      },
    },
  ],
  // 长生诀 - 治疗技能
  'art-immortal-life': [
    {
      id: 'skill-immortal-heal',
      name: '长生回春',
      description: '运转长生诀，恢复大量气血。',
      type: 'heal',
      source: 'cultivation_art',
      sourceId: 'art-immortal-life',
      effects: [],
      cost: { mana: 25 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
      heal: {
        base: 100,
        multiplier: 0.2, // 20%最大气血
      },
    },
  ],
  // 烈火拳 - 攻击技能
  'art-fiery-fist': [
    {
      id: 'skill-fiery-fist',
      name: '烈火拳',
      description: '将灵气转化为烈火附着于双拳，造成物理伤害并可能灼烧敌人。',
      type: 'attack',
      source: 'cultivation_art',
      sourceId: 'art-fiery-fist',
      effects: [
        {
          type: 'debuff',
          target: 'enemy',
          debuff: {
            id: 'burn',
            name: '灼烧',
            type: 'burn',
            value: 10, // 每回合伤害
            duration: 2,
            source: 'skill-fiery-fist',
            description: '每回合受到火焰伤害',
          },
        },
      ],
      cost: { mana: 20 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: {
        base: 30,
        multiplier: 1.2,
        type: 'physical',
        critChance: 0.15,
        critMultiplier: 1.8,
      },
    },
  ],
  // 纯阳无极功 - 被动效果（在战斗初始化时应用）
  'art-pure-yang': [
    {
      id: 'skill-pure-yang-buff',
      name: '纯阳护体',
      description: '纯阳无极功的被动效果，提升攻击力和暴击率。',
      type: 'buff',
      source: 'cultivation_art',
      sourceId: 'art-pure-yang',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'pure-yang-attack',
            name: '纯阳之力',
            type: 'attack',
            value: 0.15, // 15%攻击力提升
            duration: -1, // 永久（战斗期间）
            source: 'art-pure-yang',
            description: '攻击力提升15%',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'pure-yang-crit',
            name: '纯阳暴击',
            type: 'crit',
            value: 0.1, // 10%暴击率提升
            duration: -1,
            source: 'art-pure-yang',
            description: '暴击率提升10%',
          },
        },
      ],
      cost: {},
      cooldown: 0,
      maxCooldown: 0,
      target: 'self',
    },
  ],
  // 御风步 - 速度提升技能
  'art-wind-step': [
    {
      id: 'skill-wind-step',
      name: '御风步',
      description: '身法如风，提升速度，增加闪避和暴击率。',
      type: 'buff',
      source: 'cultivation_art',
      sourceId: 'art-wind-step',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'wind-speed',
            name: '御风',
            type: 'speed',
            value: 0.2, // 20%速度提升
            duration: 3,
            source: 'art-wind-step',
            description: '速度提升20%，持续3回合',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'wind-crit',
            name: '风之暴击',
            type: 'crit',
            value: 0.15, // 15%暴击率提升
            duration: 3,
            source: 'art-wind-step',
            description: '暴击率提升15%，持续3回合',
          },
        },
      ],
      cost: { mana: 20 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
    },
  ],
  // 水镜心法 - 防御技能
  'art-water-mirror': [
    {
      id: 'skill-water-mirror',
      name: '水镜护体',
      description: '心如止水，明镜高悬，大幅提升防御力。',
      type: 'buff',
      source: 'cultivation_art',
      sourceId: 'art-water-mirror',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'water-defense',
            name: '水镜',
            type: 'defense',
            value: 0.3, // 30%防御力提升
            duration: 3,
            source: 'art-water-mirror',
            description: '防御力提升30%，持续3回合',
          },
        },
      ],
      cost: { mana: 25 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
    },
  ],
  // 厚土护体 - 防御和护盾
  'art-earth-shield': [
    {
      id: 'skill-earth-shield',
      name: '厚土护体',
      description: '引大地之力护体，大幅提升防御并形成护盾。',
      type: 'buff',
      source: 'cultivation_art',
      sourceId: 'art-earth-shield',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'earth-defense',
            name: '厚土',
            type: 'defense',
            value: 0.4, // 40%防御力提升
            duration: 4,
            source: 'art-earth-shield',
            description: '防御力提升40%，持续4回合',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'earth-shield',
            name: '大地护盾',
            type: 'shield',
            value: 200, // 护盾值
            duration: 4,
            source: 'art-earth-shield',
            description: '获得200点护盾，持续4回合',
          },
        },
      ],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 4,
      target: 'self',
    },
  ],
  // 龙拳 - 高伤害攻击技能
  'art-dragon-fist': [
    {
      id: 'skill-dragon-fist',
      name: '龙拳',
      description: '拳如真龙，威力无穷，造成大量物理伤害。',
      type: 'attack',
      source: 'cultivation_art',
      sourceId: 'art-dragon-fist',
      effects: [],
      cost: { mana: 35 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: {
        base: 80,
        multiplier: 1.8,
        type: 'physical',
        critChance: 0.2,
        critMultiplier: 2.2,
      },
    },
  ],
  // 星辰破灭诀 - 终极攻击技能
  'art-star-destruction': [
    {
      id: 'skill-star-destruction',
      name: '星辰破灭',
      description: '引星辰之力，破灭万物，造成巨额法术伤害。',
      type: 'attack',
      source: 'cultivation_art',
      sourceId: 'art-star-destruction',
      effects: [],
      cost: { mana: 50 },
      cooldown: 0,
      maxCooldown: 5,
      target: 'enemy',
      damage: {
        base: 150,
        multiplier: 2.5,
        type: 'magical',
        critChance: 0.3,
        critMultiplier: 2.5,
      },
    },
  ],
};

// 法宝战斗技能配置
export const ARTIFACT_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // 星辰盘 - 防御和攻击技能
  'artifact-star-disk': [
    {
      id: 'skill-star-shield',
      name: '星辰护盾',
      description: '星辰盘释放护盾，大幅提升防御力。',
      type: 'defense',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'star-shield',
            name: '星辰护盾',
            type: 'defense',
            value: 0.3, // 30%防御力提升
            duration: 2,
            source: 'artifact-star-disk',
            description: '防御力提升30%，持续2回合',
          },
        },
      ],
      cost: { mana: 20 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
    },
    {
      id: 'skill-star-burst',
      name: '星辰爆裂',
      description: '星辰盘释放星辰之力，对敌人造成法术伤害。',
      type: 'attack',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      effects: [],
      cost: { mana: 40 },
      cooldown: 0,
      maxCooldown: 4,
      target: 'enemy',
      damage: {
        base: 30,
        multiplier: 1.2,
        type: 'magical',
        critChance: 0.15,
        critMultiplier: 2.0,
      },
    },
  ],
  // 仙灵宝珠 - 强力技能
  'artifact-immortal-bead': [
    {
      id: 'skill-immortal-blessing',
      name: '仙灵祝福',
      description: '仙灵宝珠释放祝福，全面提升属性。',
      type: 'buff',
      source: 'artifact',
      sourceId: 'artifact-immortal-bead',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-attack',
            name: '仙灵攻击',
            type: 'attack',
            value: 0.25, // 25%攻击力提升
            duration: 3,
            source: 'artifact-immortal-bead',
            description: '攻击力提升25%，持续3回合',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-defense',
            name: '仙灵防御',
            type: 'defense',
            value: 0.25, // 25%防御力提升
            duration: 3,
            source: 'artifact-immortal-bead',
            description: '防御力提升25%，持续3回合',
          },
        },
      ],
      cost: { mana: 50 },
      cooldown: 0,
      maxCooldown: 5,
      target: 'self',
    },
  ],
};

// 武器战斗技能配置
export const WEAPON_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // 仙灵剑 - 剑舞技能
  'weapon-immortal-sword': [
    {
      id: 'skill-sword-dance',
      name: '剑舞',
      description: '剑光如舞，连续攻击敌人，造成多次伤害。',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-immortal-sword',
      effects: [],
      cost: { mana: 25 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: {
        base: 40,
        multiplier: 1.3,
        type: 'physical',
        critChance: 0.2,
        critMultiplier: 2.0,
      },
    },
  ],
  // 星辰剑 - 星辰斩
  'weapon-star-sword': [
    {
      id: 'skill-star-slash',
      name: '星辰斩',
      description: '引星辰之力入剑，造成高额物理伤害。',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-star-sword',
      effects: [],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: {
        base: 60,
        multiplier: 1.5,
        type: 'physical',
        critChance: 0.25,
        critMultiplier: 2.2,
      },
    },
  ],
};

// 战斗可用丹药配置
export const BATTLE_POTIONS: Record<string, BattlePotion> = {
  '回血丹': {
    itemId: 'potion-heal-basic',
    name: '回血丹',
    type: 'heal',
    effect: {
      heal: 50,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  '回春丹': {
    itemId: 'potion-heal-advanced',
    name: '回春丹',
    type: 'heal',
    effect: {
      heal: 200,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  '强体丹': {
    itemId: 'potion-strength',
    name: '强体丹',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'strength-boost',
          name: '强体',
          type: 'attack',
          value: 50, // 攻击力+50
          duration: 3,
          source: '强体丹',
          description: '攻击力提升50点，持续3回合',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
  '凝神丹': {
    itemId: 'potion-spirit',
    name: '凝神丹',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'spirit-boost',
          name: '凝神',
          type: 'custom',
          value: 30, // 神识+30（影响法术伤害）
          duration: 3,
          source: '凝神丹',
          description: '神识提升30点，持续3回合',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
};

// ==================== 灵根系统配置 ====================

// 灵根类型
export type SpiritualRootType = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

// 灵根名称映射
export const SPIRITUAL_ROOT_NAMES: Record<SpiritualRootType, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

// 灵根对修炼速度的影响（每个灵根点增加0.1%的修炼速度）
export const SPIRITUAL_ROOT_EXP_MULTIPLIER = 0.001; // 每个灵根点增加0.1%修炼速度

// 灵根对突破成功率的影响（每个灵根点增加0.05%的突破成功率）
export const SPIRITUAL_ROOT_BREAKTHROUGH_BONUS = 0.0005; // 每个灵根点增加0.05%突破成功率

// 灵根对属性的影响（每个灵根点增加对应属性的0.1%）
export const SPIRITUAL_ROOT_ATTRIBUTE_MULTIPLIER = 0.001; // 每个灵根点增加0.1%属性

// 灵根属性加成映射（不同灵根影响不同属性）
export const SPIRITUAL_ROOT_ATTRIBUTE_MAP: Record<
  SpiritualRootType,
  {
    attack?: number; // 攻击力加成比例
    defense?: number; // 防御力加成比例
    spirit?: number; // 神识加成比例
    physique?: number; // 体魄加成比例
    speed?: number; // 速度加成比例
    maxHp?: number; // 气血上限加成比例（木灵根使用）
  }
> = {
  metal: { attack: 0.002, defense: 0.001 }, // 金灵根：攻击+0.2%/点，防御+0.1%/点
  wood: { maxHp: 0.002, physique: 0.001 }, // 木灵根：气血+0.2%/点，体魄+0.1%/点（通过maxHp实现）
  water: { spirit: 0.002, defense: 0.001 }, // 水灵根：神识+0.2%/点，防御+0.1%/点
  fire: { attack: 0.002, speed: 0.001 }, // 火灵根：攻击+0.2%/点，速度+0.1%/点
  earth: { defense: 0.002, physique: 0.001 }, // 土灵根：防御+0.2%/点，体魄+0.1%/点
};

// 计算灵根总等级
export const calculateTotalSpiritualRootLevel = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  return (
    spiritualRoots.metal +
    spiritualRoots.wood +
    spiritualRoots.water +
    spiritualRoots.fire +
    spiritualRoots.earth
  );
};

// 计算灵根对修炼速度的加成
export const calculateSpiritualRootExpBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return 1 + totalLevel * SPIRITUAL_ROOT_EXP_MULTIPLIER;
};

// 计算灵根对突破成功率的加成
export const calculateSpiritualRootBreakthroughBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return totalLevel * SPIRITUAL_ROOT_BREAKTHROUGH_BONUS;
};

// 计算灵根对功法的加成倍数（每个灵根点增加0.5%的效果）
export const calculateSpiritualRootArtBonus = (
  art: CultivationArt,
  spiritualRoots: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  }
): number => {
  if (!art.spiritualRoot) return 1.0; // 没有对应灵根的功法不加成

  const rootLevel = spiritualRoots[art.spiritualRoot] || 0;
  // 每个灵根点增加0.5%的效果，最高50%加成（100点灵根）
  return 1.0 + (rootLevel * 0.005);
};

// ==================== 日常任务系统配置 ====================

// 日常任务类型配置
export interface DailyQuestConfig {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number }; // 目标数量范围
  rewardMultiplier: number; // 奖励倍率（根据目标数量调整）
}

// 日常任务配置（根据类型，只包含基础类型）
export const DAILY_QUEST_CONFIGS: Partial<Record<DailyQuestType, Omit<DailyQuestConfig, 'targetRange'>>> = {
  meditate: {
    type: 'meditate',
    name: '打坐修炼',
    description: '完成指定次数的打坐修炼',
    rewardMultiplier: 1.0,
  },
  adventure: {
    type: 'adventure',
    name: '历练冒险',
    description: '完成指定次数的历练',
    rewardMultiplier: 1.2,
  },
  breakthrough: {
    type: 'breakthrough',
    name: '境界突破',
    description: '完成指定次数的境界突破',
    rewardMultiplier: 2.0,
  },
  alchemy: {
    type: 'alchemy',
    name: '炼制丹药',
    description: '炼制指定数量的丹药',
    rewardMultiplier: 1.5,
  },
  equip: {
    type: 'equip',
    name: '装备强化',
    description: '强化指定次数的装备',
    rewardMultiplier: 1.3,
  },
  pet: {
    type: 'pet',
    name: '灵宠培养',
    description: '喂养或进化灵宠指定次数',
    rewardMultiplier: 1.4,
  },
  sect: {
    type: 'sect',
    name: '宗门任务',
    description: '完成指定次数的宗门任务',
    rewardMultiplier: 1.6,
  },
  realm: {
    type: 'realm',
    name: '秘境探索',
    description: '探索指定次数的秘境',
    rewardMultiplier: 1.8,
  },
};

// 任务目标数量范围（根据类型）
export const DAILY_QUEST_TARGET_RANGES: Record<DailyQuestType, { min: number; max: number }> = {
  meditate: { min: 3, max: 8 }, // 打坐：3-8次，比较轻松
  adventure: { min: 3, max: 10 }, // 历练：3-10次，适中
  breakthrough: { min: 0, max: 1 }, // 境界突破：0-1次（0表示不出现，1表示最多1次），因为突破需要积累修为
  alchemy: { min: 2, max: 6 }, // 炼丹：2-6次，适中
  equip: { min: 1, max: 3 }, // 装备强化：1-3次，适中
  pet: { min: 1, max: 3 }, // 灵宠培养：1-3次，适中
  sect: { min: 2, max: 5 }, // 宗门任务：2-5次，适中
  realm: { min: 1, max: 3 }, // 秘境探索：1-3次，适中
  kill: { min: 5, max: 20 }, // 击败敌人：5-20次（AI生成）
  collect: { min: 3, max: 10 }, // 收集物品：3-10次（AI生成）
  learn: { min: 1, max: 3 }, // 学习功法：1-3次（AI生成）
  other: { min: 1, max: 5 }, // 其他任务：1-5次（AI生成）
};

// 根据稀有度计算奖励
export const calculateDailyQuestReward = (
  type: DailyQuestType,
  target: number,
  rarity: ItemRarity
): {
  exp?: number;
  spiritStones?: number;
  lotteryTickets?: number;
} => {
  const config = DAILY_QUEST_CONFIGS[type];
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity];
  const baseReward = target * config.rewardMultiplier * rarityMultiplier;

  // 根据任务类型分配奖励
  switch (type) {
    case 'meditate':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
    case 'adventure':
      return {
        exp: Math.floor(baseReward * 30),
        spiritStones: Math.floor(baseReward * 15),
        lotteryTickets: rarity === '仙品' ? 1 : 0,
      };
    case 'breakthrough':
      return {
        exp: Math.floor(baseReward * 100),
        spiritStones: Math.floor(baseReward * 50),
        lotteryTickets: rarity === '传说' || rarity === '仙品' ? 1 : 0,
      };
    case 'alchemy':
      return {
        exp: Math.floor(baseReward * 25),
        spiritStones: Math.floor(baseReward * 20),
      };
    case 'equip':
      return {
        exp: Math.floor(baseReward * 15),
        spiritStones: Math.floor(baseReward * 30),
      };
    case 'pet':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 15),
      };
    case 'sect':
      return {
        exp: Math.floor(baseReward * 40),
        spiritStones: Math.floor(baseReward * 25),
        lotteryTickets: rarity === '仙品' ? 1 : 0,
      };
    case 'realm':
      return {
        exp: Math.floor(baseReward * 50),
        spiritStones: Math.floor(baseReward * 40),
        lotteryTickets: rarity === '传说' || rarity === '仙品' ? 1 : 0,
      };
    default:
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
  }
};

// 生成日常任务稀有度（概率分布）
export const generateDailyQuestRarity = (): ItemRarity => {
  const rand = Math.random();
  if (rand < 0.5) return '普通';
  if (rand < 0.8) return '稀有';
  if (rand < 0.95) return '传说';
  return '仙品';
};

// 30个预定义的日常任务模板
export interface PredefinedDailyQuest {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number };
  rarity: ItemRarity; // 固定稀有度
}

export const PREDEFINED_DAILY_QUESTS: PredefinedDailyQuest[] = [
  // 打坐修炼类 (5个)
  { type: 'meditate', name: '晨光吐纳', description: '在清晨完成打坐修炼，吸收天地灵气', targetRange: { min: 3, max: 6 }, rarity: '普通' },
  { type: 'meditate', name: '静心修炼', description: '静心打坐，提升修为', targetRange: { min: 4, max: 8 }, rarity: '普通' },
  { type: 'meditate', name: '月夜冥想', description: '在月夜下进行深度冥想', targetRange: { min: 5, max: 8 }, rarity: '稀有' },
  { type: 'meditate', name: '九转金丹', description: '通过打坐修炼，凝练金丹', targetRange: { min: 6, max: 10 }, rarity: '传说' },
  { type: 'meditate', name: '大道归一', description: '参悟大道，达到天人合一', targetRange: { min: 8, max: 12 }, rarity: '仙品' },

  // 历练冒险类 (5个)
  { type: 'adventure', name: '除魔卫道', description: '外出历练，斩妖除魔', targetRange: { min: 3, max: 7 }, rarity: '普通' },
  { type: 'adventure', name: '探索未知', description: '探索未知区域，寻找机缘', targetRange: { min: 4, max: 8 }, rarity: '普通' },
  { type: 'adventure', name: '历练红尘', description: '在红尘中历练，提升心境', targetRange: { min: 5, max: 10 }, rarity: '稀有' },
  { type: 'adventure', name: '除魔大业', description: '完成除魔大业，维护正道', targetRange: { min: 6, max: 12 }, rarity: '传说' },
  { type: 'adventure', name: '仙路争锋', description: '在仙路上争锋，证明实力', targetRange: { min: 8, max: 15 }, rarity: '仙品' },

  // 境界突破类 (3个)
  { type: 'breakthrough', name: '突破瓶颈', description: '突破当前境界的瓶颈', targetRange: { min: 1, max: 1 }, rarity: '稀有' },
  { type: 'breakthrough', name: '境界飞升', description: '完成境界的飞升突破', targetRange: { min: 1, max: 1 }, rarity: '传说' },
  { type: 'breakthrough', name: '破境成仙', description: '破境成仙，踏上仙路', targetRange: { min: 1, max: 1 }, rarity: '仙品' },

  // 炼制丹药类 (4个)
  { type: 'alchemy', name: '丹道初学', description: '炼制基础丹药，学习丹道', targetRange: { min: 2, max: 5 }, rarity: '普通' },
  { type: 'alchemy', name: '炼制灵丹', description: '炼制灵丹妙药，提升修为', targetRange: { min: 3, max: 6 }, rarity: '稀有' },
  { type: 'alchemy', name: '丹道大师', description: '炼制高级丹药，展现丹道造诣', targetRange: { min: 4, max: 8 }, rarity: '传说' },
  { type: 'alchemy', name: '仙丹炼制', description: '炼制传说中的仙丹', targetRange: { min: 5, max: 10 }, rarity: '仙品' },

  // 装备强化类 (3个)
  { type: 'equip', name: '强化装备', description: '强化装备，提升实力', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'equip', name: '精炼法宝', description: '精炼法宝，增强威力', targetRange: { min: 2, max: 4 }, rarity: '稀有' },
  { type: 'equip', name: '祭炼神兵', description: '祭炼神兵利器，打造至宝', targetRange: { min: 3, max: 5 }, rarity: '传说' },

  // 灵宠培养类 (3个)
  { type: 'pet', name: '喂养灵宠', description: '喂养灵宠，提升其修为', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'pet', name: '灵宠进化', description: '帮助灵宠完成进化', targetRange: { min: 1, max: 2 }, rarity: '稀有' },
  { type: 'pet', name: '仙兽培养', description: '培养仙兽，培养强大伙伴', targetRange: { min: 2, max: 4 }, rarity: '传说' },

  // 宗门任务类 (3个)
  { type: 'sect', name: '宗门任务', description: '完成宗门分配的任务', targetRange: { min: 2, max: 5 }, rarity: '普通' },
  { type: 'sect', name: '宗门贡献', description: '为宗门做出贡献，提升地位', targetRange: { min: 3, max: 6 }, rarity: '稀有' },
  { type: 'sect', name: '宗门试炼', description: '完成宗门试炼，证明实力', targetRange: { min: 4, max: 8 }, rarity: '传说' },

  // 秘境探索类 (4个)
  { type: 'realm', name: '探索秘境', description: '探索神秘秘境，寻找机缘', targetRange: { min: 1, max: 3 }, rarity: '普通' },
  { type: 'realm', name: '秘境寻宝', description: '在秘境中寻找珍贵宝物', targetRange: { min: 2, max: 4 }, rarity: '稀有' },
  { type: 'realm', name: '古墓探秘', description: '探索古墓，寻找传承', targetRange: { min: 3, max: 5 }, rarity: '传说' },
  { type: 'realm', name: '仙府探索', description: '探索仙府遗迹，获得仙缘', targetRange: { min: 4, max: 6 }, rarity: '仙品' },
];