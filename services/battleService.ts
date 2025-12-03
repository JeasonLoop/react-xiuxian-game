import {
  AdventureResult,
  AdventureType,
  PlayerStats,
  RealmType,
  ItemRarity,
  ItemType,
  EquipmentSlot,
} from '../types';
import {
  REALM_ORDER,
  RARITY_MULTIPLIERS,
  DISCOVERABLE_RECIPES,
} from '../constants';
import { generateEnemyName } from './aiService';

const randomId = () => Math.random().toString(36).slice(2, 9);

const ENEMY_NAMES = [
  // 妖兽类
  '血牙狼',
  '裂地熊',
  '玄煞蛛',
  '阴焰鸦',
  '噬魂藤',
  '赤纹虎',
  '蓝鬃豹',
  '铁背猿',
  '骨鳞蜥',
  '黄泉使',
  '暗影豹',
  '雷霆狮',
  '冰霜蛇',
  '烈焰鸟',
  '风暴鹰',
  '毒沼鳄',
  '石甲龟',
  '幻影狐',
  '幽冥猫',
  '金角牛',
  '银鳞鱼',
  '黑翼蝠',
  '紫电貂',
  '青鳞蟒',
  '赤目猴',
  '白毛象',
  '灰鬃马',
  '绿眼狼',
  '黄沙蝎',
  '黑水蛇',
  '红尾狐',
  '蓝羽雀',

  // 修士类
  '星落修士',
  '魇沙客',
  '断魂剑客',
  '血手魔修',
  '鬼面道人',
  '邪心散修',
  '暗影刺客',
  '狂刀武修',
  '毒手药师',
  '阴煞老怪',
  '血魔真人',
  '白骨道人',
  '黑风散人',
  '赤发魔君',
  '青面鬼修',
  '紫袍邪修',
  '灰衣杀手',
  '白衣剑客',
  '黑衣刀客',
  '红衣魔女',
  '绿袍毒师',

  // 特殊类
  '护宝傀儡',
  '机关兽',
  '石像守卫',
  '木偶人',
  '铁甲兵',
  '铜人阵',
  '银甲卫',
  '金甲将',
  '怨灵',
  '恶鬼',
  '僵尸',
  '骷髅',
  '幽灵',
  '魔物',
  '邪灵',
  '妖魂',
];

const ENEMY_TITLES = [
  // 妖兽称号
  '荒原妖兽',
  '巡山妖将',
  '秘境妖兽',
  '深山老妖',
  '古林妖王',
  '血海妖尊',
  '魔域妖将',
  '妖山统领',
  '妖谷守护',
  '妖洞领主',
  '妖林霸主',
  '妖域先锋',
  '妖界战将',

  // 修士称号
  '堕落修士',
  '邪修',
  '魔道散修',
  '血魔修士',
  '鬼道真人',
  '邪道魔君',
  '魔门长老',
  '邪派护法',
  '魔教使者',
  '邪宗弟子',
  '魔道散人',
  '邪门高手',
  '魔修强者',

  // 守卫称号
  '秘境守卫',
  '护宝傀儡',
  '遗迹守护',
  '古墓守卫',
  '洞府守护',
  '宝库守卫',
  '禁地守卫',
  '秘地守护',
  '禁制守卫',
  '法阵守护',
  '机关守卫',
  '石像守卫',

  // 其他称号
  '荒野游魂',
  '古战场怨灵',
  '迷失修士',
  '堕落真人',
  '被诅咒者',
  '魔化修士',
  '邪化妖兽',
];

// 根据风险等级计算战斗难度
const getBattleDifficulty = (
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): number => {
  if (adventureType === 'secret_realm' && riskLevel) {
    // 秘境根据风险等级调整难度
    const riskMultipliers = {
      低: 1.0,
      中: 1.25,
      高: 1.5,
      极度危险: 2.0,
    };
    return riskMultipliers[riskLevel];
  }
  // 非秘境使用固定难度
  const baseDifficulty: Record<AdventureType, number> = {
    normal: 1,
    lucky: 0.85,
    secret_realm: 1.25,
  };
  return baseDifficulty[adventureType];
};

const baseBattleChance: Record<AdventureType, number> = {
  normal: 0.22,
  lucky: 0.08,
  secret_realm: 0.45,
};

const pickOne = <T>(list: T[]): T =>
  list[Math.floor(Math.random() * list.length)];

// 搜刮奖励物品名称库
export const LOOT_ITEMS = {
  // 草药类
  herbs: [
    {
      name: '止血草',
      type: ItemType.Herb,
      rarity: '普通' as ItemRarity,
      effect: { hp: 20 },
    },
    { name: '聚灵草', type: ItemType.Herb, rarity: '普通' as ItemRarity },
    {
      name: '回气草',
      type: ItemType.Herb,
      rarity: '普通' as ItemRarity,
      effect: { hp: 30 },
    },
    {
      name: '凝神花',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 50, spirit: 5 },
    },
    {
      name: '血参',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 80 },
    },
    {
      name: '千年灵芝',
      type: ItemType.Herb,
      rarity: '传说' as ItemRarity,
      effect: { hp: 150, maxHp: 20 },
    },
    {
      name: '万年仙草',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 300, maxHp: 50 },
    },
  ],
  // 丹药类
  pills: [
    {
      name: '回血丹',
      type: ItemType.Pill,
      rarity: '普通' as ItemRarity,
      effect: { hp: 50 },
    },
    {
      name: '聚气丹',
      type: ItemType.Pill,
      rarity: '普通' as ItemRarity,
      effect: { exp: 20 },
    },
    {
      name: '强体丹',
      type: ItemType.Pill,
      rarity: '稀有' as ItemRarity,
      permanentEffect: { physique: 5 },
    },
    {
      name: '凝神丹',
      type: ItemType.Pill,
      rarity: '稀有' as ItemRarity,
      permanentEffect: { spirit: 5 },
    },
    {
      name: '筑基丹',
      type: ItemType.Pill,
      rarity: '传说' as ItemRarity,
      effect: { exp: 100 },
    },
    {
      name: '破境丹',
      type: ItemType.Pill,
      rarity: '传说' as ItemRarity,
      effect: { exp: 200 },
    },
    {
      name: '仙灵丹',
      type: ItemType.Pill,
      rarity: '仙品' as ItemRarity,
      effect: { exp: 500 },
      permanentEffect: { maxHp: 100 },
    },
  ],
  // 材料类
  materials: [
    { name: '灵石碎片', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '炼器石', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '强化石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '精铁', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '玄铁', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '星辰石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '天外陨铁', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '仙晶', type: ItemType.Material, rarity: '仙品' as ItemRarity },
  ],
  // 装备类（武器）
  weapons: [
    {
      name: '精铁剑',
      type: ItemType.Weapon,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Weapon,
      effect: { attack: 10 },
    },
    {
      name: '玄铁刀',
      type: ItemType.Weapon,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Weapon,
      effect: { attack: 30 },
    },
    {
      name: '星辰剑',
      type: ItemType.Weapon,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Weapon,
      effect: { attack: 80, speed: 10 },
    },
    {
      name: '仙灵剑',
      type: ItemType.Weapon,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Weapon,
      effect: { attack: 200, spirit: 50 },
    },
  ],
  // 装备类（护甲）- 包含所有部位
  armors: [
    // 普通 - 头部
    {
      name: '布帽',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Head,
      effect: { defense: 3, hp: 15 },
    },
    // 普通 - 肩部
    {
      name: '布肩',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Shoulder,
      effect: { defense: 3, hp: 15 },
    },
    // 普通 - 胸甲
    {
      name: '布甲',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Chest,
      effect: { defense: 5, hp: 20 },
    },
    // 普通 - 手套
    {
      name: '布手套',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Gloves,
      effect: { defense: 3, hp: 15 },
    },
    // 普通 - 裤腿
    {
      name: '布裤',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Legs,
      effect: { defense: 4, hp: 18 },
    },
    // 普通 - 鞋子
    {
      name: '布鞋',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Boots,
      effect: { defense: 3, speed: 2 },
    },

    // 普通 - 铁制装备
    {
      name: '铁头盔',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Head,
      effect: { defense: 8, hp: 30 },
    },
    {
      name: '铁肩甲',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Shoulder,
      effect: { defense: 8, hp: 30 },
    },
    {
      name: '铁甲',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Chest,
      effect: { defense: 15, hp: 50 },
    },
    {
      name: '铁护手',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Gloves,
      effect: { defense: 8, hp: 30 },
    },
    {
      name: '铁护腿',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Legs,
      effect: { defense: 10, hp: 40 },
    },
    {
      name: '铁战靴',
      type: ItemType.Armor,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Boots,
      effect: { defense: 8, speed: 5 },
    },

    // 稀有 - 头部
    {
      name: '玄铁头盔',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Head,
      effect: { defense: 25, hp: 60, spirit: 10 },
    },
    // 稀有 - 肩部
    {
      name: '玄铁肩甲',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Shoulder,
      effect: { defense: 25, hp: 60, spirit: 10 },
    },
    // 稀有 - 胸甲
    {
      name: '玄铁甲',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Chest,
      effect: { defense: 40, hp: 100 },
    },
    // 稀有 - 手套
    {
      name: '玄铁护手',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Gloves,
      effect: { defense: 25, hp: 60, spirit: 10 },
    },
    // 稀有 - 裤腿
    {
      name: '玄铁护腿',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Legs,
      effect: { defense: 30, hp: 80 },
    },
    // 稀有 - 鞋子
    {
      name: '玄铁战靴',
      type: ItemType.Armor,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Boots,
      effect: { defense: 25, speed: 12 },
    },

    // 传说 - 头部
    {
      name: '星辰头冠',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Head,
      effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
    },
    // 传说 - 肩部
    {
      name: '星辰云肩',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Shoulder,
      effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
    },
    // 传说 - 胸甲
    {
      name: '星辰战甲',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Chest,
      effect: { defense: 100, hp: 300, attack: 20 },
    },
    // 传说 - 手套
    {
      name: '星辰法手',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Gloves,
      effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
    },
    // 传说 - 裤腿
    {
      name: '星辰护腿',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Legs,
      effect: { defense: 75, hp: 200, attack: 15 },
    },
    // 传说 - 鞋子
    {
      name: '星辰战靴',
      type: ItemType.Armor,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Boots,
      effect: { defense: 60, hp: 150, speed: 25 },
    },

    // 仙品 - 头部
    {
      name: '仙灵道冠',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Head,
      effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
    },
    // 仙品 - 肩部
    {
      name: '仙灵云肩',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Shoulder,
      effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
    },
    // 仙品 - 胸甲
    {
      name: '仙灵法袍',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Chest,
      effect: { defense: 250, hp: 800, spirit: 100 },
    },
    // 仙品 - 手套
    {
      name: '仙灵法手',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Gloves,
      effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
    },
    // 仙品 - 裤腿
    {
      name: '仙灵法裤',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Legs,
      effect: { defense: 180, hp: 500, spirit: 60 },
    },
    // 仙品 - 鞋子
    {
      name: '仙灵仙履',
      type: ItemType.Armor,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Boots,
      effect: { defense: 150, hp: 400, speed: 60 },
    },
  ],
  // 装备类（首饰）
  accessories: [
    {
      name: '护身符',
      type: ItemType.Accessory,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Accessory1,
      effect: { defense: 3, hp: 15 },
    },
    {
      name: '聚灵玉佩',
      type: ItemType.Accessory,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Accessory1,
      effect: { spirit: 20, exp: 10 },
    },
    {
      name: '星辰项链',
      type: ItemType.Accessory,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Accessory1,
      effect: { attack: 30, defense: 30, speed: 15 },
    },
    {
      name: '仙灵手镯',
      type: ItemType.Accessory,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Accessory1,
      effect: { attack: 80, defense: 80, hp: 200 },
    },
  ],
  // 装备类（戒指）
  rings: [
    {
      name: '铁戒指',
      type: ItemType.Ring,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Ring1,
      effect: { attack: 5 },
    },
    {
      name: '银戒指',
      type: ItemType.Ring,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Ring1,
      effect: { defense: 5 },
    },
    {
      name: '金戒指',
      type: ItemType.Ring,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Ring1,
      effect: { attack: 15, defense: 15 },
    },
    {
      name: '星辰戒指',
      type: ItemType.Ring,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Ring1,
      effect: { attack: 40, defense: 40, speed: 20 },
    },
    {
      name: '仙灵戒指',
      type: ItemType.Ring,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Ring1,
      effect: { attack: 100, defense: 100, spirit: 50 },
    },
  ],
  // 法宝类
  artifacts: [
    {
      name: '聚灵珠',
      type: ItemType.Artifact,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Artifact1,
      effect: { spirit: 10, exp: 5 },
    },
    {
      name: '护体符',
      type: ItemType.Artifact,
      rarity: '普通' as ItemRarity,
      slot: EquipmentSlot.Artifact1,
      effect: { defense: 10, hp: 30 },
    },
    {
      name: '玄灵镜',
      type: ItemType.Artifact,
      rarity: '稀有' as ItemRarity,
      slot: EquipmentSlot.Artifact1,
      effect: { spirit: 30, defense: 20 },
    },
    {
      name: '星辰盘',
      type: ItemType.Artifact,
      rarity: '传说' as ItemRarity,
      slot: EquipmentSlot.Artifact1,
      effect: { attack: 50, defense: 50, spirit: 50 },
    },
    {
      name: '仙灵宝珠',
      type: ItemType.Artifact,
      rarity: '仙品' as ItemRarity,
      slot: EquipmentSlot.Artifact1,
      effect: { attack: 150, defense: 150, spirit: 150, hp: 500 },
    },
  ],
};

// 根据敌人强度和类型生成搜刮奖励
const generateLoot = (
  enemyStrength: number,
  adventureType: AdventureType,
  playerRealm: RealmType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): AdventureResult['itemObtained'][] => {
  const lootItems: AdventureResult['itemObtained'][] = [];

  // 根据敌人强度决定奖励数量（1-3个物品）
  const numItems =
    enemyStrength < 0.7
      ? 1
      : enemyStrength < 1.0
        ? 1 + Math.floor(Math.random() * 2)
        : 2 + Math.floor(Math.random() * 2);

  // 根据敌人强度和类型决定稀有度分布
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // 秘境：根据风险等级调整稀有度概率
      if (riskLevel === '极度危险') {
        // 极度危险：更高概率获得顶级物品
        if (roll < 0.2) return '仙品';
        if (roll < 0.5) return '传说';
        if (roll < 0.85) return '稀有';
        return '普通';
      } else if (riskLevel === '高') {
        // 高风险：较高概率
        if (roll < 0.12) return '仙品';
        if (roll < 0.4) return '传说';
        if (roll < 0.75) return '稀有';
        return '普通';
      } else if (riskLevel === '中') {
        // 中风险：中等概率
        if (roll < 0.08) return '仙品';
        if (roll < 0.3) return '传说';
        if (roll < 0.65) return '稀有';
        return '普通';
      } else {
        // 低风险：较低概率（但比普通历练高）
        if (roll < 0.05) return '仙品';
        if (roll < 0.2) return '传说';
        if (roll < 0.55) return '稀有';
        return '普通';
      }
    } else if (adventureType === 'lucky') {
      // 机缘：中等概率
      if (roll < 0.05) return '传说';
      if (roll < 0.25) return '稀有';
      return '普通';
    } else {
      // 普通历练：较低概率（略微提升稀有度概率）
      if (roll < 0.03) return '传说';
      if (roll < 0.2) return '稀有';
      return '普通';
    }
  };

  for (let i = 0; i < numItems; i++) {
    const targetRarity = getRarityChance();

    // 根据稀有度选择物品类型
    const itemTypeRoll = Math.random();
    let itemPool: Array<{
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      effect?: any;
      permanentEffect?: any;
      slot?: EquipmentSlot;
    }>;
    let itemType: string;

    if (itemTypeRoll < 0.25) {
      // 25% 草药
      itemPool = LOOT_ITEMS.herbs as any;
      itemType = '草药';
    } else if (itemTypeRoll < 0.45) {
      // 20% 丹药
      itemPool = LOOT_ITEMS.pills as any;
      itemType = '丹药';
    } else if (itemTypeRoll < 0.6) {
      // 15% 材料
      itemPool = LOOT_ITEMS.materials as any;
      itemType = '材料';
    } else if (itemTypeRoll < 0.8) {
      // 20% 装备（武器/护甲/首饰/戒指）
      const equipRoll = Math.random();
      if (equipRoll < 0.25) {
        itemPool = LOOT_ITEMS.weapons as any;
        itemType = '武器';
      } else if (equipRoll < 0.65) {
        // 护甲概率提升到40%，因为护甲有6个部位需要覆盖
        itemPool = LOOT_ITEMS.armors as any;
        itemType = '护甲';
      } else if (equipRoll < 0.85) {
        itemPool = LOOT_ITEMS.accessories as any;
        itemType = '首饰';
      } else {
        itemPool = LOOT_ITEMS.rings as any;
        itemType = '戒指';
      }
    } else if (itemTypeRoll < 0.92) {
      // 12% 法宝
      itemPool = LOOT_ITEMS.artifacts as any;
      itemType = '法宝';
    } else {
      // 8% 丹方（稀有奖励）
      // 丹方将在后面特殊处理
      itemType = '丹方';
      itemPool = []; // 丹方不使用常规物品池
    }

    // 特殊处理：丹方
    if (itemType === '丹方') {
      // 根据稀有度筛选可获得的丹方
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const recipeIndex = rarityOrder.indexOf(recipe.result.rarity);
        return recipeIndex <= targetIndex;
      });

      if (availableRecipes.length > 0) {
        const selectedRecipe = pickOne(availableRecipes);
        const item: AdventureResult['itemObtained'] & { recipeName?: string } =
          {
            name: `${selectedRecipe.name}丹方`,
            type: '丹方',
            description: `记载了【${selectedRecipe.name}】炼制方法的古老丹方。使用后可学会炼制此丹药。`,
            rarity: selectedRecipe.result.rarity,
            isEquippable: false,
            recipeName: selectedRecipe.name, // 用于在 executeAdventureCore 中查找对应的配方
          };
        lootItems.push(item);
      }
      // 如果没有可用的丹方，跳过这次生成
      continue;
    }

    // 从对应稀有度的物品中随机选择
    const availableItems = itemPool.filter(
      (item) => item.rarity === targetRarity
    );
    if (availableItems.length === 0) {
      // 如果没有对应稀有度的物品，降级选择
      const fallbackItems = itemPool.filter((item) => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const itemIndex = rarityOrder.indexOf(item.rarity);
        return itemIndex <= targetIndex;
      });
      if (fallbackItems.length > 0) {
        const selected = pickOne(fallbackItems);
        const item: AdventureResult['itemObtained'] = {
          name: selected.name,
          type: itemType,
          description: `${selected.name}，从敌人身上搜刮获得。`,
          rarity: selected.rarity,
          isEquippable: selected.slot !== undefined,
          equipmentSlot: selected.slot as string | undefined,
          effect: selected.effect,
          permanentEffect: selected.permanentEffect,
        };
        lootItems.push(item);
      }
    } else {
      const selected = pickOne(availableItems);

      // 检查是否为传说或仙品装备，随机添加保命机会
      let reviveChances: number | undefined = undefined;
      const rarity = selected.rarity;

      // 只有武器和法宝类型的传说/仙品装备可能有保命机会
      if ((rarity === '传说' || rarity === '仙品') &&
          (itemType === '武器' || itemType === '法宝')) {
        // 传说装备3%概率有保命，仙品装备6%概率有保命
        const hasRevive = rarity === '传说'
          ? Math.random() < 0.03
          : Math.random() < 0.06;

        if (hasRevive) {
          // 随机1-3次保命机会
          reviveChances = Math.floor(Math.random() * 3) + 1;
        }
      }

      const item: AdventureResult['itemObtained'] & { reviveChances?: number } = {
        name: selected.name,
        type: itemType,
        description: `${selected.name}，从敌人身上搜刮获得。`,
        rarity: selected.rarity,
        isEquippable: selected.slot !== undefined,
        equipmentSlot: selected.slot as string | undefined,
        effect: selected.effect,
        permanentEffect: selected.permanentEffect,
        reviveChances: reviveChances,
      };
      lootItems.push(item);
    }
  }

  return lootItems;
};

export interface BattleRoundLog {
  id: string;
  attacker: 'player' | 'enemy';
  damage: number;
  crit: boolean;
  description: string;
  playerHpAfter: number;
  enemyHpAfter: number;
}

export interface BattleReplay {
  id: string;
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    strengthMultiplier?: number; // 敌人强度倍数
  };
  rounds: BattleRoundLog[];
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  summary: string;
  expChange: number;
  spiritChange: number;
}

export interface BattleResolution {
  adventureResult: AdventureResult;
  replay: BattleReplay;
}

const clampMin = (value: number, min: number) => (value < min ? min : value);

const createEnemy = async (player: PlayerStats, adventureType: AdventureType, riskLevel?: '低' | '中' | '高' | '极度危险', realmMinRealm?: RealmType): Promise<{
  name: string;
  title: string;
  realm: RealmType;
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
  strengthMultiplier: number;
}> => {
  const currentRealmIndex = REALM_ORDER.indexOf(player.realm);

  // 如果进入秘境且有秘境的最低境界要求，基于秘境境界计算敌人强度
  let targetRealmIndex: number;
  let realmLevelReduction = 1.0; // 境界压制倍率（玩家境界高于秘境要求时降低难度）

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    // 敌人境界基于秘境最低境界，而不是玩家境界
    const realmOffset = 1; // 秘境中敌人比秘境要求高1个境界
    targetRealmIndex = clampMin(Math.min(REALM_ORDER.length - 1, realmMinIndex + realmOffset), 0);

    // 如果玩家境界高于秘境要求，降低敌人强度（境界压制）
    if (currentRealmIndex > realmMinIndex) {
      const realmDiff = currentRealmIndex - realmMinIndex;
      // 每高1个境界，降低15%难度，最多降低60%
      realmLevelReduction = Math.max(0.4, 1.0 - realmDiff * 0.15);
    }
  } else {
    // 普通历练和机缘历练，按原逻辑
    const realmOffset = adventureType === 'secret_realm' ? 1 : adventureType === 'lucky' ? -1 : 0;
    targetRealmIndex = clampMin(Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset), 0);
  }

  const realm = REALM_ORDER[targetRealmIndex];
  const baseDifficulty = getBattleDifficulty(adventureType, riskLevel);

  // 引入强度等级系统：弱敌、普通、强敌
  // 普通历练：40%弱敌，50%普通，10%强敌
  // 机缘历练：60%弱敌，35%普通，5%强敌
  // 秘境历练：20%弱敌，50%普通，30%强敌
  const strengthRoll = Math.random();
  let strengthMultiplier = 1;
  let strengthVariance = { min: 0.85, max: 1.2 };

  if (adventureType === 'normal') {
    if (strengthRoll < 0.4) {
      // 弱敌 40%
      strengthMultiplier = 0.6 + Math.random() * 0.2; // 0.6 - 0.8
      strengthVariance = { min: 0.6, max: 0.9 };
    } else if (strengthRoll < 0.9) {
      // 普通 50%
      strengthMultiplier = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
      strengthVariance = { min: 0.75, max: 1.1 };
    } else {
      // 强敌 10%
      strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
      strengthVariance = { min: 0.9, max: 1.3 };
    }
  } else if (adventureType === 'lucky') {
    if (strengthRoll < 0.6) {
      // 弱敌 60%
      strengthMultiplier = 0.5 + Math.random() * 0.2; // 0.5 - 0.7
      strengthVariance = { min: 0.5, max: 0.85 };
    } else if (strengthRoll < 0.95) {
      // 普通 35%
      strengthMultiplier = 0.7 + Math.random() * 0.2; // 0.7 - 0.9
      strengthVariance = { min: 0.65, max: 1.0 };
    } else {
      // 强敌 5%
      strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
      strengthVariance = { min: 0.8, max: 1.2 };
    }
  } else if (adventureType === 'secret_realm') {
    // 秘境历练：根据风险等级调整敌人强度分布
    if (riskLevel === '极度危险') {
      // 极度危险：5%弱敌，30%普通，65%强敌
      if (strengthRoll < 0.05) {
        strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
        strengthVariance = { min: 0.85, max: 1.2 };
      } else if (strengthRoll < 0.35) {
        strengthMultiplier = 1.1 + Math.random() * 0.2; // 1.1 - 1.3
        strengthVariance = { min: 1.0, max: 1.4 };
      } else {
        strengthMultiplier = 1.3 + Math.random() * 0.4; // 1.3 - 1.7
        strengthVariance = { min: 1.2, max: 1.8 };
      }
    } else if (riskLevel === '高') {
      // 高风险：10%弱敌，40%普通，50%强敌
      if (strengthRoll < 0.1) {
        strengthMultiplier = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
        strengthVariance = { min: 0.75, max: 1.1 };
      } else if (strengthRoll < 0.5) {
        strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
        strengthVariance = { min: 0.9, max: 1.3 };
      } else {
        strengthMultiplier = 1.2 + Math.random() * 0.3; // 1.2 - 1.5
        strengthVariance = { min: 1.1, max: 1.6 };
      }
    } else if (riskLevel === '中') {
      // 中风险：20%弱敌，50%普通，30%强敌
      if (strengthRoll < 0.2) {
        strengthMultiplier = 0.7 + Math.random() * 0.2; // 0.7 - 0.9
        strengthVariance = { min: 0.65, max: 1.0 };
      } else if (strengthRoll < 0.7) {
        strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
        strengthVariance = { min: 0.8, max: 1.2 };
      } else {
        strengthMultiplier = 1.1 + Math.random() * 0.3; // 1.1 - 1.4
        strengthVariance = { min: 1.0, max: 1.5 };
      }
    } else {
      // 低风险：30%弱敌，55%普通，15%强敌
      if (strengthRoll < 0.3) {
        strengthMultiplier = 0.6 + Math.random() * 0.2; // 0.6 - 0.8
        strengthVariance = { min: 0.55, max: 0.9 };
      } else if (strengthRoll < 0.85) {
        strengthMultiplier = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
        strengthVariance = { min: 0.75, max: 1.1 };
      } else {
        strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
        strengthVariance = { min: 0.9, max: 1.3 };
      }
    }
  }

  const variance = () => strengthVariance.min + Math.random() * (strengthVariance.max - strengthVariance.min);
  // 应用境界压制倍率到最终难度
  const finalDifficulty = baseDifficulty * strengthMultiplier * realmLevelReduction;

  // 15%概率使用AI生成敌人名字，失败则使用预设列表
  let name = pickOne(ENEMY_NAMES);
  let title = pickOne(ENEMY_TITLES);

  if (Math.random() < 0.15) {
    try {
      const aiGenerated = await generateEnemyName(realm, adventureType);
      if (aiGenerated.name && aiGenerated.title) {
        name = aiGenerated.name;
        title = aiGenerated.title;
      }
    } catch (e) {
      // AI生成失败，使用预设列表
      console.log('AI生成敌人名字失败，使用预设列表');
    }
  }

  // 如果玩家境界高于秘境要求，使用秘境境界的属性基准，而不是玩家属性
  let basePlayerAttack: number;
  let basePlayerDefense: number;
  let basePlayerMaxHp: number;
  let basePlayerSpeed: number;
  let basePlayerRealmLevel: number;

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    if (currentRealmIndex > realmMinIndex) {
      // 使用秘境境界的属性作为基准（模拟秘境中敌人的合理强度）
      // 使用秘境最低境界的属性，但会根据风险等级调整
      basePlayerAttack = player.attack * (0.4 + (realmMinIndex / REALM_ORDER.length) * 0.3); // 40%-70%
      basePlayerDefense = player.defense * (0.4 + (realmMinIndex / REALM_ORDER.length) * 0.3);
      basePlayerMaxHp = player.maxHp * (0.3 + (realmMinIndex / REALM_ORDER.length) * 0.3); // 30%-60%
      basePlayerSpeed = (player.speed || 10) * (0.5 + (realmMinIndex / REALM_ORDER.length) * 0.3);
      basePlayerRealmLevel = Math.max(1, player.realmLevel - (currentRealmIndex - realmMinIndex));
    } else {
      // 玩家境界等于或低于秘境要求，使用玩家属性
      basePlayerAttack = player.attack;
      basePlayerDefense = player.defense;
      basePlayerMaxHp = player.maxHp;
      basePlayerSpeed = player.speed || 10;
      basePlayerRealmLevel = player.realmLevel;
    }
  } else {
    // 非秘境历练，使用玩家属性
    basePlayerAttack = player.attack;
    basePlayerDefense = player.defense;
    basePlayerMaxHp = player.maxHp;
    basePlayerSpeed = player.speed || 10;
    basePlayerRealmLevel = player.realmLevel;
  }

  // 降低敌人的基础属性，特别是攻击和防御
  const baseAttack = basePlayerAttack * 0.7 + basePlayerRealmLevel * 3;
  const baseDefense = basePlayerDefense * 0.7 + basePlayerRealmLevel * 2;

  return {
    name,
    title,
    realm,
    attack: Math.max(8, Math.round(baseAttack * variance() * finalDifficulty)),
    defense: Math.max(6, Math.round(baseDefense * variance() * finalDifficulty)),
    maxHp: Math.max(40, Math.round(basePlayerMaxHp * (0.5 + Math.random() * 0.4) * finalDifficulty)),
    speed: Math.max(6, Math.round(basePlayerSpeed * (0.7 + Math.random() * 0.3) * strengthMultiplier)),
    strengthMultiplier // 保存强度倍数用于生成奖励
  };
};

const calcDamage = (attack: number, defense: number) => {
  // 调整伤害计算，降低死亡率：降低基础伤害和最小伤害
  const base = attack * 0.75 - defense * 0.5; // 降低攻击系数，提高防御系数
  const minDamage = Math.max(3, attack * 0.2); // 降低最小伤害
  const randomFactor = 0.85 + Math.random() * 0.3; // 增加随机性
  return Math.round(Math.max(minDamage, base) * randomFactor);
};

export const shouldTriggerBattle = (
  player: PlayerStats,
  adventureType: AdventureType
): boolean => {
  const base = baseBattleChance[adventureType] ?? 0.2;
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.015;
  const speedBonus = (player.speed || 0) * 0.0004;
  const luckMitigation = (player.luck || 0) * 0.0002;
  const chance = Math.min(
    0.75,
    base + realmBonus + speedBonus - luckMitigation
  );
  return Math.random() < Math.max(0.05, chance);
};

export const resolveBattleEncounter = async (player: PlayerStats, adventureType: AdventureType, riskLevel?: '低' | '中' | '高' | '极度危险', realmMinRealm?: RealmType, realmName?: string, realmDescription?: string): Promise<BattleResolution> => {
  const enemy = await createEnemy(player, adventureType, riskLevel, realmMinRealm);
  const difficulty = getBattleDifficulty(adventureType, riskLevel);
  let playerHp = player.hp;
  let enemyHp = enemy.maxHp;
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' =
    (player.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(
      isPlayerTurn ? player.attack : enemy.attack,
      isPlayerTurn ? enemy.defense : player.defense
    );
    const critChanceBase =
      0.08 +
      ((isPlayerTurn ? player.speed : enemy.speed) /
        ((player.speed || 1) + enemy.speed + 1)) *
        0.2;
    const crit = Math.random() < critChanceBase;
    const finalDamage = crit ? Math.round(damage * 1.5) : damage;

    if (isPlayerTurn) {
      enemyHp = Math.max(0, enemyHp - finalDamage);
    } else {
      playerHp = Math.max(0, playerHp - finalDamage);
    }

    rounds.push({
      id: randomId(),
      attacker,
      damage: finalDamage,
      crit,
      description: isPlayerTurn
        ? `你发动灵力攻势，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`
        : `${enemy.title}${enemy.name}反扑，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;
  // 移除战斗失败时的血量保护，允许死亡
  // if (!victory) {
  //   playerHp = Math.max(1, Math.round(player.maxHp * 0.08));
  // }

  const hpLoss = Math.max(0, player.hp - playerHp);

  // 根据风险等级调整奖励倍数
  const getRewardMultiplier = (
    riskLevel?: '低' | '中' | '高' | '极度危险'
  ): number => {
    if (!riskLevel) return 1.0;
    const multipliers = {
      低: 1.0,
      中: 1.3,
      高: 1.6,
      极度危险: 2.2,
    };
    return multipliers[riskLevel];
  };

  const rewardMultiplier =
    adventureType === 'secret_realm' ? getRewardMultiplier(riskLevel) : 1.0;
  const baseExp = 25 + player.realmLevel * 12;
  const rewardExp = Math.round(baseExp * difficulty * rewardMultiplier);
  const rewardStones = Math.max(
    3,
    Math.round((6 + player.realmLevel * 2) * difficulty * rewardMultiplier)
  );

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成搜刮奖励
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(
      enemy.strengthMultiplier,
      adventureType,
      player.realm,
      riskLevel
    );
    lootItems.push(...loot);
  }

  // 生成更丰富的战斗描述（如果有秘境信息，会结合秘境特点）
  const generateBattleSummary = (victory: boolean, enemy: { name: string; title: string }, hpLoss: number, hasLoot: boolean, realmName?: string): string => {
    // 如果有秘境名称，生成与秘境相关的描述
    if (realmName && adventureType === 'secret_realm') {
      const realmContext = `在${realmName}中，`;
      const victoryScenarios = [
        `${realmContext}你与${enemy.title}${enemy.name}展开激战。最终，你将其斩于剑下，但也耗费了 ${hpLoss} 点气血。${hasLoot ? '你仔细搜刮了敌人的遗物。' : ''}`,
        `${realmContext}你遭遇了${enemy.title}${enemy.name}的袭击。经过一番殊死搏斗，你成功将其击败，消耗了 ${hpLoss} 点气血。${hasLoot ? '你从敌人身上找到了战利品。' : ''}`,
        `${realmContext}你与${enemy.title}${enemy.name}在秘境中展开对决。最终，你凭借更强的实力将其斩杀，损失了 ${hpLoss} 点气血。${hasLoot ? '你检查了敌人的遗物，收获颇丰。' : ''}`,
      ];
      const defeatScenarios = [
        `${realmContext}你与${enemy.title}${enemy.name}的战斗异常艰难。对方实力强大，你拼尽全力仍不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
        `${realmContext}你遭遇了强大的${enemy.title}${enemy.name}。面对其猛烈的攻击，你渐渐落入下风，只能带着伤势逃离，损失了 ${hpLoss} 点气血。`,
      ];
      const scenarios = victory ? victoryScenarios : defeatScenarios;
      return scenarios[Math.floor(Math.random() * scenarios.length)];
    }

    // 默认描述（非秘境）
    const battleScenarios = victory ? [
      `经过一番激烈的战斗，你最终将${enemy.title}${enemy.name}斩于剑下。虽然耗费了 ${hpLoss} 点气血，但你成功获得了胜利。${hasLoot ? '你仔细搜刮了敌人的遗物，发现了一些有用的物品。' : ''}`,
      `你与${enemy.title}${enemy.name}展开了殊死搏斗，剑光与妖气交织。最终，你凭借精湛的剑法将其击败，但也消耗了 ${hpLoss} 点气血。${hasLoot ? '你从敌人身上搜刮到了一些战利品。' : ''}`,
      `面对${enemy.title}${enemy.name}的疯狂攻击，你沉着应对，运转功法防御。经过一番苦战，你终于找到破绽，将其一击必杀。虽然损失了 ${hpLoss} 点气血，但胜利的喜悦让你忘记了疼痛。${hasLoot ? '你检查了敌人的遗物，收获颇丰。' : ''}`,
      `你与${enemy.title}${enemy.name}的战斗异常激烈，双方都拼尽全力。最终，你凭借更强的实力将其斩杀，但也被其临死反击，损失了 ${hpLoss} 点气血。${hasLoot ? '战斗结束后，你搜刮了战利品。' : ''}`,
      `你祭出法宝，与${enemy.title}${enemy.name}展开对决。战斗持续了数个回合，法宝的光芒与妖气不断碰撞。最终，你技高一筹，成功将其击杀，但气血也损耗了 ${hpLoss} 点。${hasLoot ? '你在敌人身上找到了一些有价值的物品。' : ''}`,
      `你施展神通，与${enemy.title}${enemy.name}展开激战。双方你来我往，招式层出不穷。最终，你抓住机会，一剑将其斩杀。虽然耗费了 ${hpLoss} 点气血，但你的实力也在这场战斗中得到了提升。${hasLoot ? '你仔细搜刮了敌人的遗物。' : ''}`,
    ] : [
      `你与${enemy.title}${enemy.name}展开了激烈的战斗，但对方的实力远超你的想象。你拼尽全力抵抗，却依然不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
      `面对强大的${enemy.title}${enemy.name}，你奋力迎战。然而，对方的攻击太过猛烈，你渐渐落入下风。最终，你不得不放弃战斗，带着伤势逃离，损失了 ${hpLoss} 点气血。`,
      `你与${enemy.title}${enemy.name}的战斗异常艰难。对方的速度和力量都远超你的预期，你虽然拼尽全力，却依然无法战胜。为了保全性命，你只能重伤撤离，损失了 ${hpLoss} 点气血。`,
      `你祭出法宝与${enemy.title}${enemy.name}交战，但对方的防御力极强，你的攻击无法造成有效伤害。眼看局势不妙，你只得放弃战斗，带着伤势撤离，损失了 ${hpLoss} 点气血。`,
      `你施展神通与${enemy.title}${enemy.name}对决，但对方的实力深不可测。经过一番苦战，你意识到无法取胜，只得选择撤退，损失了 ${hpLoss} 点气血。`,
    ];

    // 随机选择一个场景描述
    return battleScenarios[Math.floor(Math.random() * battleScenarios.length)];
  };

  const summary = generateBattleSummary(victory, enemy, hpLoss, lootItems.length > 0, realmName);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange: playerHp - player.hp,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  return {
    adventureResult,
    replay: {
      id: randomId(),
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: player.hp,
      playerHpAfter: playerHp,
      summary,
      expChange,
      spiritChange,
    },
  };
};
