import {
  AdventureResult,
  AdventureType,
  PlayerStats,
  RealmType,
  ItemRarity,
  ItemType,
  EquipmentSlot,
  BattleState,
  BattleUnit,
  BattleSkill,
  BattleAction,
  PlayerAction,
  Buff,
  Debuff,
  Item,
  Pet,
  PetSkill,
} from '../types';
import {
  REALM_ORDER,
  RARITY_MULTIPLIERS,
  DISCOVERABLE_RECIPES,
  CULTIVATION_ARTS,
  CULTIVATION_ART_BATTLE_SKILLS,
  ARTIFACT_BATTLE_SKILLS,
  WEAPON_BATTLE_SKILLS,
  BATTLE_POTIONS,
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
  normal: 0.4, // 历练基础概率从22%提高到40%
  lucky: 0.2, // 机缘历练基础概率从8%提高到20%
  secret_realm: 0.65, // 秘境基础概率从45%提高到65%
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
      name: '青草',
      type: ItemType.Herb,
      rarity: '普通' as ItemRarity,
      effect: { hp: 15 },
    },
    {
      name: '白花',
      type: ItemType.Herb,
      rarity: '普通' as ItemRarity,
      effect: { hp: 25 },
    },
    {
      name: '黄精',
      type: ItemType.Herb,
      rarity: '普通' as ItemRarity,
      effect: { hp: 35 },
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
      name: '紫猴花',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 60, exp: 10 },
    },
    {
      name: '天灵果',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 70, spirit: 10 },
    },
    {
      name: '龙鳞果',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 90, maxHp: 10 },
    },
    {
      name: '千年人参',
      type: ItemType.Herb,
      rarity: '稀有' as ItemRarity,
      effect: { hp: 100, maxHp: 15 },
    },
    {
      name: '千年灵芝',
      type: ItemType.Herb,
      rarity: '传说' as ItemRarity,
      effect: { hp: 150, maxHp: 20 },
    },
    {
      name: '九叶芝草',
      type: ItemType.Herb,
      rarity: '传说' as ItemRarity,
      effect: { hp: 180, maxHp: 25, spirit: 15 },
    },
    {
      name: '万年灵乳',
      type: ItemType.Herb,
      rarity: '传说' as ItemRarity,
      effect: { hp: 200, maxHp: 30, exp: 50 },
    },
    {
      name: '万年仙草',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 300, maxHp: 50 },
    },
    {
      name: '九转还魂草',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 400, maxHp: 80, spirit: 30 },
    },
    {
      name: '太虚仙草',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 350, maxHp: 70, exp: 100 },
    },
    {
      name: '混沌青莲',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 500, maxHp: 100, spirit: 50, exp: 150 },
    },
    {
      name: '造化仙草',
      type: ItemType.Herb,
      rarity: '仙品' as ItemRarity,
      effect: { hp: 450, maxHp: 90, physique: 20, spirit: 40 },
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
    // 普通材料
    { name: '灵石碎片', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '炼器石', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '精铁', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '铜矿', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '银矿', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '铁矿', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '木材', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '兽皮', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '骨粉', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '聚灵草', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '妖兽内丹', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '普通妖核', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '灵土', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '灵水', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '灵木', type: ItemType.Material, rarity: '普通' as ItemRarity },
    // 稀有材料
    { name: '强化石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '玄铁', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '星辰石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '灵兽精血', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '月华石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '星辰碎片', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '仙灵果', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '紫晶石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '黑曜石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '寒铁', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '火晶石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '风灵石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '土灵石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '水灵石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '木灵石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '金灵石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '中阶妖核', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '灵晶', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    // 传说材料
    { name: '天外陨铁', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '龙鳞片', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '凤凰羽', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '麒麟角', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '九转金丹', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '天材地宝', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '神兽精魄', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '高阶妖丹', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '太虚石', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '混沌石', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '星核', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '龙珠', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '凤凰之心', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '麒麟血', type: ItemType.Material, rarity: '传说' as ItemRarity },
    // 仙品材料
    { name: '仙晶', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '混沌本源石', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '大道碎片', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '仙灵本源', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '造化神液', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '太虚本源', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '混沌本源', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '先天神物', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '鸿蒙紫气', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '先天至宝', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '大道之种', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '造化神石', type: ItemType.Material, rarity: '仙品' as ItemRarity },
    { name: '太初之晶', type: ItemType.Material, rarity: '仙品' as ItemRarity },
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
  // 用于追踪已选择的物品，避免重复（装备类物品按名称+稀有度去重）
  const selectedItems = new Set<string>();
  // 用于追踪已选择的物品类型，避免连续获得相同类型
  const selectedTypes: string[] = [];

  // 根据敌人强度决定奖励数量（1-3个物品）
  const numItems =
    enemyStrength < 0.7
      ? 1
      : enemyStrength < 1.0
        ? 1 + Math.floor(Math.random() * 2)
        : 2 + Math.floor(Math.random() * 2);

  // 根据玩家境界调整稀有度概率（高境界更容易获得高级物品）
  const realmIndex = REALM_ORDER.indexOf(playerRealm);
  const realmRarityBonus = realmIndex * 0.05; // 每个境界增加5%高级物品概率

  // 根据敌人强度和类型决定稀有度分布
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // 秘境：根据风险等级调整稀有度概率
      if (riskLevel === '极度危险') {
        // 极度危险：更高概率获得顶级物品（降低仙品概率以平衡）
        if (roll < 0.15 + realmRarityBonus) return '仙品'; // 从20%降低到15%
        if (roll < 0.5 + realmRarityBonus * 0.5) return '传说';
        if (roll < 0.85 + realmRarityBonus * 0.3) return '稀有';
        return '普通';
      } else if (riskLevel === '高') {
        // 高风险：较高概率
        if (roll < 0.12 + realmRarityBonus) return '仙品';
        if (roll < 0.4 + realmRarityBonus * 0.5) return '传说';
        if (roll < 0.75 + realmRarityBonus * 0.3) return '稀有';
        return '普通';
      } else if (riskLevel === '中') {
        // 中风险：中等概率
        if (roll < 0.08 + realmRarityBonus) return '仙品';
        if (roll < 0.3 + realmRarityBonus * 0.5) return '传说';
        if (roll < 0.65 + realmRarityBonus * 0.3) return '稀有';
        return '普通';
      } else {
        // 低风险：较低概率（但比普通历练高）
        if (roll < 0.05 + realmRarityBonus) return '仙品';
        if (roll < 0.2 + realmRarityBonus * 0.5) return '传说';
        if (roll < 0.55 + realmRarityBonus * 0.3) return '稀有';
        return '普通';
      }
    } else if (adventureType === 'lucky') {
      // 机缘：中等概率
      if (roll < 0.05 + realmRarityBonus * 0.5) return '传说';
      if (roll < 0.25 + realmRarityBonus * 0.3) return '稀有';
      return '普通';
    } else {
      // 普通历练：较低概率（提高传说装备概率）
      if (roll < 0.05 + realmRarityBonus * 0.5) return '传说'; // 从3%提高到5%
      if (roll < 0.2 + realmRarityBonus * 0.3) return '稀有';
      return '普通';
    }
  };

  // 最大尝试次数，避免无限循环
  let maxAttempts = numItems * 10;
  let attempts = 0;

  while (lootItems.length < numItems && attempts < maxAttempts) {
    attempts++;
    const targetRarity = getRarityChance();

    // 根据稀有度选择物品类型，避免连续获得相同类型
    let itemTypeRoll = Math.random();
    // 如果上一个物品是装备类，降低再次获得装备的概率
    if (selectedTypes.length > 0 && selectedTypes[selectedTypes.length - 1] !== '草药' && selectedTypes[selectedTypes.length - 1] !== '丹药' && selectedTypes[selectedTypes.length - 1] !== '材料') {
      itemTypeRoll = Math.random() * 0.7; // 降低装备类概率
    }

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
      // 25% 草药（从30%降低）
      itemPool = LOOT_ITEMS.herbs as any;
      itemType = '草药';
    } else if (itemTypeRoll < 0.5) {
      // 25% 丹药
      itemPool = LOOT_ITEMS.pills as any;
      itemType = '丹药';
    } else if (itemTypeRoll < 0.65) {
      // 15% 材料
      itemPool = LOOT_ITEMS.materials as any;
      itemType = '材料';
    } else if (itemTypeRoll < 0.85) {
      // 20% 装备（武器/护甲/首饰/戒指）（从15%提高）
      const equipRoll = Math.random();
      if (equipRoll < 0.3) {
        itemPool = LOOT_ITEMS.weapons as any;
        itemType = '武器';
      } else if (equipRoll < 0.7) {
        // 护甲概率40%，因为护甲有6个部位需要覆盖
        // 先随机选择一个部位，确保每个部位有相等的概率
        const armorSlots = [
          EquipmentSlot.Head,
          EquipmentSlot.Shoulder,
          EquipmentSlot.Chest,
          EquipmentSlot.Gloves,
          EquipmentSlot.Legs,
          EquipmentSlot.Boots,
        ];
        const selectedSlot = armorSlots[Math.floor(Math.random() * armorSlots.length)];
        // 从护甲池中筛选出该部位的装备
        const slotFilteredArmors = (LOOT_ITEMS.armors as any).filter((item: any) => item.slot === selectedSlot);
        // 如果该部位没有装备，则使用全部护甲池（降级处理）
        itemPool = slotFilteredArmors.length > 0 ? slotFilteredArmors : (LOOT_ITEMS.armors as any);
        itemType = '护甲';
      } else if (equipRoll < 0.85) {
        itemPool = LOOT_ITEMS.accessories as any;
        itemType = '首饰';
      } else {
        itemPool = LOOT_ITEMS.rings as any;
        itemType = '戒指';
      }
    } else if (itemTypeRoll < 0.92) {
      // 7% 法宝（从10%略微降低以平衡）
      itemPool = LOOT_ITEMS.artifacts as any;
      itemType = '法宝';
    } else {
      // 8% 丹方（稀有奖励）（从5%提高）
      itemType = '丹方';
      itemPool = []; // 丹方不使用常规物品池
    }

    // 特殊处理：丹方
    if (itemType === '丹方') {
      // 根据稀有度筛选可获得的丹方，排除已选择的
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const recipeIndex = rarityOrder.indexOf(recipe.result.rarity);
        const recipeKey = `${recipe.name}丹方-${recipe.result.rarity}`;
        return recipeIndex <= targetIndex && !selectedItems.has(recipeKey);
      });

      if (availableRecipes.length > 0) {
        const selectedRecipe = pickOne(availableRecipes);
        const recipeKey = `${selectedRecipe.name}丹方-${selectedRecipe.result.rarity}`;
        selectedItems.add(recipeKey);
        selectedTypes.push(itemType);

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

    // 从对应稀有度的物品中随机选择，排除已选择的装备
    let availableItems = itemPool.filter((item) => {
      if (item.rarity !== targetRarity) return false;
      // 对于装备类物品，检查是否已选择（按名称+稀有度+槽位去重）
      if (item.slot !== undefined) {
        const itemKey = `${item.name}-${item.rarity}-${item.slot}`;
        return !selectedItems.has(itemKey);
      }
      // 对于非装备类物品，只按名称+稀有度去重
      const itemKey = `${item.name}-${item.rarity}`;
      return !selectedItems.has(itemKey);
    });

    // 如果过滤后没有可用物品，尝试降级选择
    if (availableItems.length === 0) {
      const fallbackItems = itemPool.filter((item) => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const itemIndex = rarityOrder.indexOf(item.rarity);
        if (itemIndex > targetIndex) return false;

        // 同样检查是否已选择
        if (item.slot !== undefined) {
          const itemKey = `${item.name}-${item.rarity}-${item.slot}`;
          return !selectedItems.has(itemKey);
        }
        const itemKey = `${item.name}-${item.rarity}`;
        return !selectedItems.has(itemKey);
      });
      availableItems = fallbackItems;
    }

    if (availableItems.length > 0) {
      const selected = pickOne(availableItems);

      // 标记为已选择
      if (selected.slot !== undefined) {
        const itemKey = `${selected.name}-${selected.rarity}-${selected.slot}`;
        selectedItems.add(itemKey);
      } else {
        const itemKey = `${selected.name}-${selected.rarity}`;
        selectedItems.add(itemKey);
      }
      selectedTypes.push(itemType);

      // 检查是否为传说或仙品装备，随机添加保命机会
      let reviveChances: number | undefined = undefined;
      const rarity = selected.rarity;

      // 只有武器和法宝类型的传说/仙品装备可能有保命机会
      if (
        (rarity === '传说' || rarity === '仙品') &&
        (itemType === '武器' || itemType === '法宝')
      ) {
        // 传说装备6%概率有保命（从3%提高），仙品装备12%概率有保命（从6%提高）
        const hasRevive =
          rarity === '传说' ? Math.random() < 0.06 : Math.random() < 0.12;

        if (hasRevive) {
          // 随机1-3次保命机会
          reviveChances = Math.floor(Math.random() * 3) + 1;
        }
      }

      const item: AdventureResult['itemObtained'] & { reviveChances?: number } =
        {
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
  petSkillCooldowns?: Record<string, number>; // 战斗结束后的灵宠技能冷却状态
}

const clampMin = (value: number, min: number) => (value < min ? min : value);

const createEnemy = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType
): Promise<{
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
    targetRealmIndex = clampMin(
      Math.min(REALM_ORDER.length - 1, realmMinIndex + realmOffset),
      0
    );

    // 如果玩家境界高于秘境要求，降低敌人强度（境界压制）
    if (currentRealmIndex > realmMinIndex) {
      const realmDiff = currentRealmIndex - realmMinIndex;
      // 每高1个境界，降低15%难度，最多降低60%
      realmLevelReduction = Math.max(0.4, 1.0 - realmDiff * 0.15);
    }
  } else {
    // 普通历练和机缘历练，按原逻辑
    const realmOffset =
      adventureType === 'secret_realm' ? 1 : adventureType === 'lucky' ? -1 : 0;
    targetRealmIndex = clampMin(
      Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
      0
    );
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

  const variance = () =>
    strengthVariance.min +
    Math.random() * (strengthVariance.max - strengthVariance.min);
  // 应用境界压制倍率到最终难度
  const finalDifficulty =
    baseDifficulty * strengthMultiplier * realmLevelReduction;

  // 15%概率使用AI生成敌人名字，失败则使用预设列表
  let name = pickOne(ENEMY_NAMES);
  let title = pickOne(ENEMY_TITLES);

  if (Math.random() < 0.15) {
    try {
      // 添加超时处理，防止AI调用卡住战斗初始化
      const timeoutPromise = new Promise<{ name: string; title: string }>((_, reject) => {
        setTimeout(() => reject(new Error('AI生成敌人名称超时')), 3000); // 3秒超时
      });

      const aiGenerated = await Promise.race([
        generateEnemyName(realm, adventureType),
        timeoutPromise
      ]);

      if (aiGenerated.name && aiGenerated.title) {
        name = aiGenerated.name;
        title = aiGenerated.title;
      }
    } catch (e) {
      // AI生成失败或超时，使用预设列表
      console.log('AI生成敌人名字失败或超时，使用预设列表:', e);
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
      // 确保REALM_ORDER.length不为0，防止除零
      const realmOrderLength = REALM_ORDER.length || 1;
      const realmRatio = realmMinIndex / realmOrderLength;
      basePlayerAttack =
        (Number(player.attack) || 0) * (0.4 + realmRatio * 0.3); // 40%-70%
      basePlayerDefense =
        (Number(player.defense) || 0) * (0.4 + realmRatio * 0.3);
      basePlayerMaxHp =
        (Number(player.maxHp) || 0) * (0.3 + realmRatio * 0.3); // 30%-60%
      basePlayerSpeed =
        (Number(player.speed) || 10) * (0.5 + realmRatio * 0.3);
      basePlayerRealmLevel = Math.max(
        1,
        player.realmLevel - (currentRealmIndex - realmMinIndex)
      );
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

  // 平衡敌人的基础属性，提高攻击力系数使战斗更有挑战性
  const baseAttack = basePlayerAttack * 0.85 + basePlayerRealmLevel * 3; // 从0.7提升到0.85
  const baseDefense = basePlayerDefense * 0.7 + basePlayerRealmLevel * 2;

  return {
    name,
    title,
    realm,
    attack: Math.max(8, Math.round(baseAttack * variance() * finalDifficulty)),
    defense: Math.max(
      6,
      Math.round(baseDefense * variance() * finalDifficulty)
    ),
    maxHp: Math.max(
      40,
      Math.round(
        basePlayerMaxHp * (0.5 + Math.random() * 0.4) * finalDifficulty
      )
    ),
    speed: Math.max(
      6,
      Math.round(
        basePlayerSpeed * (0.7 + Math.random() * 0.3) * strengthMultiplier
      )
    ),
    strengthMultiplier, // 保存强度倍数用于生成奖励
  };
};

const calcDamage = (attack: number, defense: number) => {
  // 确保输入是有效数字，防止NaN
  const validAttack = Number(attack) || 0;
  const validDefense = Number(defense) || 0;

  // 伤害计算：如果攻击力大于防御力，造成伤害；否则伤害很小或为0
  let baseDamage: number;

  if (validAttack > validDefense) {
    // 攻击力大于防御力：造成有效伤害
    // 伤害 = (攻击力 - 防御力) * 系数 + 基础伤害
    const damageDiff = validAttack - validDefense;
    baseDamage = damageDiff * 0.6 + validAttack * 0.3; // 60%差值伤害 + 30%攻击力
  } else {
    // 攻击力小于等于防御力：造成很少的伤害（穿透伤害）
    const penetration = Math.max(0, validAttack * 0.1 - validDefense * 0.05);
    baseDamage = Math.max(1, penetration); // 至少1点伤害
  }

  // 随机波动 85%-115%
  const randomFactor = 0.85 + Math.random() * 0.3;
  return Math.round(Math.max(1, baseDamage * randomFactor));
};

export const shouldTriggerBattle = (
  player: PlayerStats,
  adventureType: AdventureType
): boolean => {
  const base = baseBattleChance[adventureType] ?? 0.4; // 基础战斗概率
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.02; // 境界加成（从0.015提高到0.02）
  const speedBonus = (player.speed || 0) * 0.0005; // 速度加成（从0.0004提高到0.0005）
  const luckMitigation = (player.luck || 0) * 0.00015; // 幸运减成（从0.0002降低到0.00015，减少影响）
  const chance = Math.min(0.75, base + realmBonus + speedBonus - luckMitigation); // 保持上限适中
  return Math.random() < Math.max(0.1, chance); // 确保不会过低也不过高
  // return true; // 调试战斗打开
};

export const resolveBattleEncounter = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  realmName?: string,
  realmDescription?: string
): Promise<BattleResolution> => {
  const enemy = await createEnemy(
    player,
    adventureType,
    riskLevel,
    realmMinRealm
  );
  const difficulty = getBattleDifficulty(adventureType, riskLevel);
  // 确保初始值为有效数字，防止NaN
  const initialPlayerHp = Number(player.hp) || 0;
  const initialMaxHp = Number(player.maxHp) || 0;
  let playerHp = Math.max(0, Math.min(initialPlayerHp, initialMaxHp));
  let enemyHp = Number(enemy.maxHp) || 0;
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' =
    (player.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却（如果还没有）
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet && !activePet.skillCooldowns) {
    petSkillCooldowns = {};
  } else if (activePet) {
    petSkillCooldowns = { ...activePet.skillCooldowns };
  }

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(
      isPlayerTurn ? player.attack : enemy.attack,
      isPlayerTurn ? enemy.defense : player.defense
    );
    // 确保速度值是有效数字，防止NaN
    const playerSpeed = Number(player.speed) || 0;
    const enemySpeed = Number(enemy.speed) || 0;
    const speedSum = playerSpeed + enemySpeed + 1; // 避免除零
    const critSpeed = isPlayerTurn ? playerSpeed : enemySpeed;
    const critChanceBase = 0.08 + (critSpeed / speedSum) * 0.2;
    // 确保暴击率在合理范围内
    const validCritChance = Math.max(0, Math.min(1, critChanceBase));
    const crit = Math.random() < validCritChance;
    const finalDamage = crit ? Math.round(damage * 1.5) : damage;

    if (isPlayerTurn) {
      enemyHp = Math.max(0, (Number(enemyHp) || 0) - finalDamage);
    } else {
      playerHp = Math.max(0, (Number(playerHp) || 0) - finalDamage);
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

    // 玩家回合后，灵宠可以行动（附加攻击或释放技能）
    if (isPlayerTurn && activePet && enemyHp > 0) {
      // 更新技能冷却
      Object.keys(petSkillCooldowns).forEach((skillId) => {
        if (petSkillCooldowns[skillId] > 0) {
          petSkillCooldowns[skillId]--;
        }
      });

      // 决定灵宠行动：根据亲密度和等级动态调整技能释放概率
      // 基础概率30%，亲密度每10点增加2%，等级每10级增加1%，最高70%
      const baseProbability = 0.3;
      const petAffection = Number(activePet.affection) || 0; // 确保是有效数字
      const petLevel = Number(activePet.level) || 0; // 确保是有效数字
      const affectionBonus = (petAffection / 100) * 0.2; // 亲密度加成，最高20%
      const levelBonus = (petLevel / 100) * 0.1; // 等级加成，最高10%
      const skillProbability = Math.min(0.7, baseProbability + affectionBonus + levelBonus);
      const useSkill = Math.random() < skillProbability;
      let petAction: 'attack' | 'skill' | null = null;
      let usedSkill: PetSkill | null = null;

      if (useSkill && activePet.skills.length > 0) {
        // 查找可用的技能（冷却时间为0或未设置冷却）
        const availableSkills = activePet.skills.filter(
          (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
        );

        if (availableSkills.length > 0) {
          usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          petAction = 'skill';
        } else {
          petAction = 'attack';
        }
      } else {
        petAction = 'attack';
      }

      if (petAction === 'skill' && usedSkill) {
        // 释放技能
        let petDamage = 0;
        let petHeal = 0;
        let petBuff: { attack?: number; defense?: number; hp?: number } | undefined;

        if (usedSkill.effect.damage) {
          // 技能伤害：基础伤害值 + 灵宠攻击力加成 + 等级加成
          const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
          // 根据进化阶段增加攻击力倍率
          const evolutionMultiplier = 1.0 + (Number(activePet.evolutionStage) || 0) * 0.5;
          const attackMultiplier = 1.0 + ((Number(activePet.level) || 0) / 50); // 每50级增加100%攻击力
          // 攻击力加成从30%提升到100%，并应用进化倍率
          const baseAttack = Number(activePet.stats?.attack) || 0;
          const attackBonus = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier * 1.0); // 100%攻击力加成
          const levelBonus = Math.floor((Number(activePet.level) || 0) * 5); // 每级+5伤害（从2提升到5）
          const affectionBonus = Math.floor((Number(activePet.affection) || 0) * 0.8); // 亲密度对技能伤害也有加成
          const skillDamage = baseSkillDamage + attackBonus + levelBonus + affectionBonus;
          petDamage = calcDamage(skillDamage, enemy.defense);
          enemyHp = Math.max(0, (Number(enemyHp) || 0) - petDamage);
        }

        if (usedSkill.effect.heal) {
          // 治疗玩家
          const baseHeal = Number(usedSkill.effect.heal) || 0;
          const petLevel = Number(activePet.level) || 0;
          const petAffection = Number(activePet.affection) || 0;
          petHeal = Math.floor(
            baseHeal * (1 + petLevel * 0.05) * (1 + petAffection / 200)
          );
          const maxHp = Number(player.maxHp) || 0;
          playerHp = Math.max(0, Math.min(maxHp, Math.floor((Number(playerHp) || 0) + petHeal)));
        }

        if (usedSkill.effect.buff) {
          petBuff = usedSkill.effect.buff;
        }

        // 设置技能冷却
        if (usedSkill.cooldown) {
          petSkillCooldowns[usedSkill.id] = usedSkill.cooldown;
        }

        // 构建技能描述
        let skillDesc = `【${activePet.name}】释放了【${usedSkill.name}】！`;
        if (petDamage > 0) {
          skillDesc += `对敌人造成 ${petDamage} 点伤害。`;
        }
        if (petHeal > 0) {
          skillDesc += `为你恢复了 ${petHeal} 点气血。`;
        }
        if (petBuff) {
          const buffParts: string[] = [];
          if (petBuff.attack) buffParts.push(`攻击+${petBuff.attack}`);
          if (petBuff.defense) buffParts.push(`防御+${petBuff.defense}`);
          if (petBuff.hp) buffParts.push(`气血+${petBuff.hp}`);
          if (buffParts.length > 0) {
            skillDesc += `你获得了${buffParts.join('、')}的增益。`;
          }
        }

        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: petDamage,
          crit: false,
          description: skillDesc,
          playerHpAfter: playerHp,
          enemyHpAfter: enemyHp,
        });
      } else {
        // 普通攻击：基础攻击力 + 攻击力百分比加成 + 等级加成 + 亲密度加成
        const baseAttack = Number(activePet.stats?.attack) || 0;
        // 根据进化阶段增加攻击力倍率（幼年期1.0，成熟期1.5，完全体2.0）
        const evolutionMultiplier = 1.0 + (Number(activePet.evolutionStage) || 0) * 0.5;
        const attackMultiplier = 1.0 + ((Number(activePet.level) || 0) / 50); // 每50级增加100%攻击力
        const levelBonus = Math.floor((Number(activePet.level) || 0) * 8); // 每级+8攻击（从3提升到8）
        const affectionBonus = Math.floor((Number(activePet.affection) || 0) * 1.5); // 亲密度加成（从0.5提升到1.5）
        // 最终攻击力 = (基础攻击力 * 进化倍率 * 等级倍率) + 等级加成 + 亲密度加成
        const petAttackDamage = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
        const petDamage = calcDamage(petAttackDamage, enemy.defense);
        enemyHp = Math.max(0, (Number(enemyHp) || 0) - petDamage);

        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: petDamage,
          crit: false,
          description: `【${activePet.name}】紧随其后发动攻击，造成 ${petDamage} 点伤害。`,
          playerHpAfter: playerHp,
          enemyHpAfter: enemyHp,
        });
      }
    }

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;

  // 确保hpLoss是有效数字，防止NaN
  const playerHpBefore = Number(player.hp) || 0;
  const playerHpAfter = Number(playerHp) || 0;
  const hpLoss = Math.max(0, Math.floor(playerHpBefore - playerHpAfter));

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

  // 根据境界计算基础奖励（高境界获得更多奖励）
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // 境界基础倍数：每个境界大幅增加奖励倍数（指数增长）
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // 基础修为 = 境界基础倍数 * (基础值 + 境界等级 * 系数) * 境界等级加成
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.2; // 每级增加20%
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * difficulty * rewardMultiplier);

  // 基础灵石 = 境界基础倍数 * (基础值 + 境界等级 * 系数) * 境界等级加成
  const baseStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(
    10,
    Math.round(baseStones * difficulty * rewardMultiplier)
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
  const generateBattleSummary = (
    victory: boolean,
    enemy: { name: string; title: string },
    hpLoss: number,
    hasLoot: boolean,
    realmName?: string
  ): string => {
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
    const battleScenarios = victory
      ? [
          `经过一番激烈的战斗，你最终将${enemy.title}${enemy.name}斩于剑下。虽然耗费了 ${hpLoss} 点气血，但你成功获得了胜利。${hasLoot ? '你仔细搜刮了敌人的遗物，发现了一些有用的物品。' : ''}`,
          `你与${enemy.title}${enemy.name}展开了殊死搏斗，剑光与妖气交织。最终，你凭借精湛的剑法将其击败，但也消耗了 ${hpLoss} 点气血。${hasLoot ? '你从敌人身上搜刮到了一些战利品。' : ''}`,
          `面对${enemy.title}${enemy.name}的疯狂攻击，你沉着应对，运转功法防御。经过一番苦战，你终于找到破绽，将其一击必杀。虽然损失了 ${hpLoss} 点气血，但胜利的喜悦让你忘记了疼痛。${hasLoot ? '你检查了敌人的遗物，收获颇丰。' : ''}`,
          `你与${enemy.title}${enemy.name}的战斗异常激烈，双方都拼尽全力。最终，你凭借更强的实力将其斩杀，但也被其临死反击，损失了 ${hpLoss} 点气血。${hasLoot ? '战斗结束后，你搜刮了战利品。' : ''}`,
          `你祭出法宝，与${enemy.title}${enemy.name}展开对决。战斗持续了数个回合，法宝的光芒与妖气不断碰撞。最终，你技高一筹，成功将其击杀，但气血也损耗了 ${hpLoss} 点。${hasLoot ? '你在敌人身上找到了一些有价值的物品。' : ''}`,
          `你施展神通，与${enemy.title}${enemy.name}展开激战。双方你来我往，招式层出不穷。最终，你抓住机会，一剑将其斩杀。虽然耗费了 ${hpLoss} 点气血，但你的实力也在这场战斗中得到了提升。${hasLoot ? '你仔细搜刮了敌人的遗物。' : ''}`,
        ]
      : [
          `你与${enemy.title}${enemy.name}展开了激烈的战斗，但对方的实力远超你的想象。你拼尽全力抵抗，却依然不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
          `面对强大的${enemy.title}${enemy.name}，你奋力迎战。然而，对方的攻击太过猛烈，你渐渐落入下风。最终，你不得不放弃战斗，带着伤势逃离，损失了 ${hpLoss} 点气血。`,
          `你与${enemy.title}${enemy.name}的战斗异常艰难。对方的速度和力量都远超你的预期，你虽然拼尽全力，却依然无法战胜。为了保全性命，你只能重伤撤离，损失了 ${hpLoss} 点气血。`,
          `你祭出法宝与${enemy.title}${enemy.name}交战，但对方的防御力极强，你的攻击无法造成有效伤害。眼看局势不妙，你只得放弃战斗，带着伤势撤离，损失了 ${hpLoss} 点气血。`,
          `你施展神通与${enemy.title}${enemy.name}对决，但对方的实力深不可测。经过一番苦战，你意识到无法取胜，只得选择撤退，损失了 ${hpLoss} 点气血。`,
        ];

    // 随机选择一个场景描述
    return battleScenarios[Math.floor(Math.random() * battleScenarios.length)];
  };

  const summary = generateBattleSummary(
    victory,
    enemy,
    hpLoss,
    lootItems.length > 0,
    realmName
  );

  // 确保hpChange是有效数字，防止NaN
  const hpChange = Math.floor(playerHpAfter - playerHpBefore);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  // 清理冷却时间为0的技能冷却（节省存储空间）
  const finalPetSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        finalPetSkillCooldowns[skillId] = petSkillCooldowns[skillId];
      }
    });
  }

  return {
    adventureResult,
    replay: {
      id: randomId(),
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: playerHpBefore,
      playerHpAfter: playerHpAfter,
      summary,
      expChange,
      spiritChange,
    },
    petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
  };
};

// ==================== 回合制战斗系统 ====================

/**
 * 计算战斗奖励
 */
export const calculateBattleRewards = (
  battleState: BattleState,
  player: PlayerStats,
  adventureType?: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): {
  expChange: number;
  spiritChange: number;
  items?: AdventureResult['itemObtained'][];
} => {
  const victory = battleState.enemy.hp <= 0;
  const actualAdventureType = adventureType || battleState.adventureType;
  const actualRiskLevel = riskLevel || battleState.riskLevel;
  const difficulty = getBattleDifficulty(actualAdventureType, actualRiskLevel);

  // 根据敌人强度计算奖励倍数（敌人越强，奖励越多）
  const enemyStrength = battleState.enemyStrengthMultiplier || 1.0;
  const strengthRewardMultiplier = 0.8 + enemyStrength * 0.4; // 0.8-1.2倍（弱敌）到 1.2-2.0倍（强敌）

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

  const riskRewardMultiplier =
    actualAdventureType === 'secret_realm' ? getRewardMultiplier(actualRiskLevel) : 1.0;

  // 综合奖励倍数
  const totalRewardMultiplier = difficulty * riskRewardMultiplier * strengthRewardMultiplier;

  // 根据境界计算基础奖励（高境界获得更多奖励）
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // 境界基础倍数：每个境界大幅增加奖励倍数（指数增长）
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // 基础修为 = 境界基础倍数 * (基础值 + 境界等级 * 系数) * 境界等级加成
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.2; // 每级增加20%
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * totalRewardMultiplier);

  // 基础灵石 = 境界基础倍数 * (基础值 + 境界等级 * 系数) * 境界等级加成
  const baseStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(
    10,
    Math.round(baseStones * totalRewardMultiplier)
  );

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成物品奖励
  let items: AdventureResult['itemObtained'][] | undefined = undefined;
  if (victory) {
    items = generateLoot(
      enemyStrength,
      actualAdventureType,
      player.realm,
      actualRiskLevel
    );
  }

  return { expChange, spiritChange, items };
};

/**
 * 初始化回合制战斗
 */
export const initializeTurnBasedBattle = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType
): Promise<BattleState> => {
  // 创建敌人
  const enemyData = await createEnemy(player, adventureType, riskLevel, realmMinRealm);

  // 创建玩家战斗单位
  const playerUnit = createBattleUnitFromPlayer(player);

  // 创建敌人战斗单位
  const enemyUnit: BattleUnit = {
    id: 'enemy',
    name: enemyData.name,
    realm: enemyData.realm,
    hp: enemyData.maxHp,
    maxHp: enemyData.maxHp,
    attack: enemyData.attack,
    defense: enemyData.defense,
    speed: enemyData.speed,
    spirit: Math.floor(enemyData.attack * 0.5), // 敌人神识基于攻击力
    buffs: [],
    debuffs: [],
    skills: [], // 敌人技能（可以后续添加）
    cooldowns: {},
    // 敌人MP也根据属性计算
    mana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    maxMana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    isDefending: false,
  };

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    if (activePet.skillCooldowns) {
      petSkillCooldowns = { ...activePet.skillCooldowns };
    } else {
      petSkillCooldowns = {};
    }
  }

  // 确定先手
  const playerFirst = (playerUnit.speed || 0) >= enemyUnit.speed;

  // 计算行动次数（基于速度差）
  const calculateActionCount = (fasterSpeed: number, slowerSpeed: number): number => {
    // 确保速度值是有效数字，防止NaN
    const validFasterSpeed = Number(fasterSpeed) || 0;
    const validSlowerSpeed = Number(slowerSpeed) || 1; // 避免除零，默认至少为1

    if (validFasterSpeed <= validSlowerSpeed) return 1; // 速度不占优，只有1次行动

    const speedDiff = validFasterSpeed - validSlowerSpeed;
    const speedRatio = speedDiff / validSlowerSpeed; // 速度差比例

    // 基础1次 + 每50%速度优势额外1次行动
    // 例如：速度是敌人的1.5倍 = 2次行动，2倍 = 3次行动，3倍 = 4次行动
    const extraActions = Math.floor(speedRatio / 0.5);
    const totalActions = 1 + extraActions;

    // 最多5次行动（避免过于不平衡）
    return Math.min(5, Math.max(1, totalActions));
  };

  const playerMaxActions = calculateActionCount(playerUnit.speed, enemyUnit.speed);
  const enemyMaxActions = calculateActionCount(enemyUnit.speed, playerUnit.speed);

  return {
    id: randomId(),
    round: 1,
    turn: playerFirst ? 'player' : 'enemy',
    player: playerUnit,
    enemy: enemyUnit,
    history: [],
    isPlayerTurn: playerFirst,
    waitingForPlayerAction: playerFirst,
    playerInventory: player.inventory, // 保存玩家背包
    playerActionsRemaining: playerFirst ? playerMaxActions : 0,
    enemyActionsRemaining: playerFirst ? 0 : enemyMaxActions,
    playerMaxActions,
    enemyMaxActions,
    enemyStrengthMultiplier: enemyData.strengthMultiplier, // 保存敌人强度倍数
    adventureType, // 保存历练类型
    riskLevel, // 保存风险等级
    activePet, // 保存激活的灵宠
    petSkillCooldowns, // 保存灵宠技能冷却
  };
};

/**
 * 从玩家数据创建战斗单位
 */
function createBattleUnitFromPlayer(player: PlayerStats): BattleUnit {
  // 计算装备加成后的属性
  const equippedItems = getEquippedItems(player);
  let totalAttack = player.attack;
  let totalDefense = player.defense;
  let totalSpirit = player.spirit;
  let totalSpeed = player.speed;

  equippedItems.forEach((item) => {
    if (item.effect) {
      totalAttack += item.effect.attack || 0;
      totalDefense += item.effect.defense || 0;
      totalSpirit += item.effect.spirit || 0;
      totalSpeed += item.effect.speed || 0;
    }
  });

  // 收集所有可用技能
  const skills: BattleSkill[] = [];

  // 1. 功法技能
  player.cultivationArts.forEach((artId) => {
    const artSkills = CULTIVATION_ART_BATTLE_SKILLS[artId];
    if (artSkills) {
      skills.push(...artSkills.map((s) => ({ ...s, cooldown: 0 })));
    }
  });

  // 2. 法宝/武器技能
  equippedItems.forEach((item) => {
    // 优先使用物品自带的battleSkills
    if (item.battleSkills && item.battleSkills.length > 0) {
      skills.push(...item.battleSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // 如果没有，尝试从配置中获取
      if (item.type === ItemType.Artifact) {
        // 通过物品名称匹配法宝技能（简化处理，实际应该用ID）
        const artifactSkills = ARTIFACT_BATTLE_SKILLS[item.id] ||
          Object.values(ARTIFACT_BATTLE_SKILLS).find((skills) =>
            skills.some((s) => s.sourceId === item.id)
          );
        if (artifactSkills) {
          skills.push(...artifactSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      } else if (item.type === ItemType.Weapon) {
        const weaponSkills = WEAPON_BATTLE_SKILLS[item.id] ||
          Object.values(WEAPON_BATTLE_SKILLS).find((skills) =>
            skills.some((s) => s.sourceId === item.id)
          );
        if (weaponSkills) {
          skills.push(...weaponSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      }
    }
  });

  // 应用被动效果（心法）
  const buffs: Buff[] = [];
  if (player.activeArtId) {
    const activeArt = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
    if (activeArt && activeArt.type === 'mental') {
      const artSkills = CULTIVATION_ART_BATTLE_SKILLS[player.activeArtId];
      if (artSkills) {
        artSkills.forEach((skill) => {
          if (skill.type === 'buff' && skill.effects) {
            skill.effects.forEach((effect) => {
              if (effect.type === 'buff' && effect.buff) {
                buffs.push(effect.buff);
              }
            });
          }
        });
      }
    }
  }

  // 根据境界计算MP（灵力值）
  // MP = 基础值 + 境界加成 + 神识加成
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const baseMana = 50; // 基础灵力值
  const realmManaBonus = realmIndex * 50 + (player.realmLevel - 1) * 10; // 境界加成
  const spiritManaBonus = Math.floor(totalSpirit * 0.5); // 神识加成（神识的50%）
  const maxMana = baseMana + realmManaBonus + spiritManaBonus;
  const currentMana = maxMana; // 战斗开始时MP满值

  return {
    id: 'player',
    name: player.name,
    realm: player.realm,
    hp: player.hp,
    maxHp: player.maxHp,
    attack: totalAttack,
    defense: totalDefense,
    speed: totalSpeed,
    spirit: totalSpirit,
    buffs,
    debuffs: [],
    skills,
    cooldowns: {},
    mana: currentMana,
    maxMana: maxMana,
    isDefending: false,
  };
}

/**
 * 获取玩家装备的物品列表
 */
function getEquippedItems(player: PlayerStats): Item[] {
  const equipped: Item[] = [];
  Object.values(player.equippedItems).forEach((itemId) => {
    if (itemId) {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        equipped.push(item);
      }
    }
  });
  return equipped;
}

/**
 * 执行玩家行动
 */
export function executePlayerAction(
  battleState: BattleState,
  action: PlayerAction
): BattleState {
  if (!battleState.waitingForPlayerAction || battleState.playerActionsRemaining <= 0) {
    throw new Error('Not player turn or no actions remaining');
  }

  let newState = { ...battleState };
  let actionResult: BattleAction | null = null;

  switch (action.type) {
    case 'attack':
      actionResult = executeNormalAttack(newState, 'player', 'enemy');
      break;
    case 'skill':
      actionResult = executeSkill(newState, 'player', action.skillId, 'enemy');
      break;
    case 'item':
      actionResult = executeItem(newState, action.itemId);
      break;
    case 'defend':
      actionResult = executeDefend(newState, 'player');
      break;
    case 'flee':
      actionResult = executeFlee(newState);
      // 逃跑成功则直接结束
      if (actionResult.description.includes('成功')) {
        return newState;
      }
      break;
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState, actionResult);
  }

  // 减少剩余行动次数
  newState.playerActionsRemaining -= 1;

  // 玩家行动后，灵宠可以行动（如果敌人还没死）
  if (newState.activePet && newState.enemy.hp > 0) {
    // 更新灵宠技能冷却
    const petSkillCooldowns = newState.petSkillCooldowns || {};
    const newPetSkillCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        newPetSkillCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = newPetSkillCooldowns;

    const petAction = executePetAction(newState);
    if (petAction) {
      newState.history.push(petAction);
      newState = updateBattleStateAfterAction(newState, petAction);
    }
  }

  // 如果还有剩余行动次数，继续玩家回合；否则切换到敌人回合
  if (newState.playerActionsRemaining > 0) {
    // 继续玩家回合，可以再次行动
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
  } else {
    // 玩家回合结束，切换到敌人回合
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    newState.enemyActionsRemaining = newState.enemyMaxActions;
  }

  return newState;
}

/**
 * 执行敌人回合（AI）
 */
export function executeEnemyTurn(battleState: BattleState): BattleState {
  if (battleState.waitingForPlayerAction || battleState.enemyActionsRemaining <= 0) {
    throw new Error('Not enemy turn or no actions remaining');
  }

  let newState = { ...battleState };
  const enemy = newState.enemy;
  const player = newState.player;

  // 简单的AI：70%普通攻击，20%技能（如果有），10%防御
  const actionRoll = Math.random();
  let actionResult: BattleAction | null = null;

  if (actionRoll < 0.7) {
    // 普通攻击
    actionResult = executeNormalAttack(newState, 'enemy', 'player');
  } else if (actionRoll < 0.9 && enemy.skills.length > 0) {
    // 使用技能（随机选择一个可用技能）
    const availableSkills = enemy.skills.filter(
      (s) => (enemy.cooldowns[s.id] || 0) === 0 && (!s.cost.mana || (enemy.mana || 0) >= s.cost.mana)
    );
    if (availableSkills.length > 0) {
      const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      actionResult = executeSkill(newState, 'enemy', skill.id, 'player');
    } else {
      actionResult = executeNormalAttack(newState, 'enemy', 'player');
    }
  } else {
    // 防御
    actionResult = executeDefend(newState, 'enemy');
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState, actionResult);
  }

  // 减少剩余行动次数
  newState.enemyActionsRemaining -= 1;

  // 敌人回合结束后，更新灵宠技能冷却（如果存在）
  if (newState.activePet && newState.petSkillCooldowns) {
    const petSkillCooldowns = newState.petSkillCooldowns;
    const updatedCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        updatedCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = updatedCooldowns;
  }

  // 如果还有剩余行动次数，继续敌人回合；否则切换到玩家回合
  if (newState.enemyActionsRemaining > 0) {
    // 继续敌人回合，可以再次行动
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    // 递归执行下一次敌人行动
    return executeEnemyTurn(newState);
  } else {
    // 敌人回合结束，切换到玩家回合
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
    newState.round += 1;
    // 重新计算并重置玩家行动次数（速度可能因为Buff/Debuff改变）
    const playerSpeed = newState.player.speed;
    const enemySpeed = newState.enemy.speed;
    const calculateActionCount = (fasterSpeed: number, slowerSpeed: number): number => {
      // 确保速度值是有效数字，防止NaN
      const validFasterSpeed = Number(fasterSpeed) || 0;
      const validSlowerSpeed = Number(slowerSpeed) || 1; // 避免除零，默认至少为1

      if (validFasterSpeed <= validSlowerSpeed) return 1;
      const speedDiff = validFasterSpeed - validSlowerSpeed;
      const speedRatio = speedDiff / validSlowerSpeed;
      const extraActions = Math.floor(speedRatio / 0.5);
      return Math.min(5, Math.max(1, 1 + extraActions));
    };
    newState.playerMaxActions = calculateActionCount(playerSpeed, enemySpeed);
    newState.enemyMaxActions = calculateActionCount(enemySpeed, playerSpeed);
    newState.playerActionsRemaining = newState.playerMaxActions;

    // 如果玩家行动次数为0（速度太慢），立即切换回敌人回合
    if (newState.playerActionsRemaining <= 0) {
      newState.waitingForPlayerAction = false;
      newState.turn = 'enemy';
      newState.enemyActionsRemaining = newState.enemyMaxActions;
      // 递归执行敌人回合
      return executeEnemyTurn(newState);
    }
  }

  return newState;
}

/**
 * 执行普通攻击
 */
function executeNormalAttack(
  battleState: BattleState,
  attackerId: 'player' | 'enemy',
  targetId: 'player' | 'enemy'
): BattleAction {
  const attacker = attackerId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  // 计算基础伤害
  const baseDamage = calcDamage(attacker.attack, target.defense);

  // 计算暴击
  let critChance = 0.08; // 基础暴击率
  // 应用Buff/Debuff
  attacker.buffs.forEach((buff) => {
    if (buff.type === 'crit') {
      critChance += buff.value;
    }
  });
  const isCrit = Math.random() < critChance;
  const finalDamage = isCrit ? Math.round(baseDamage * 1.5) : baseDamage;

  // 应用防御状态
  let actualDamage = finalDamage;
  if (target.isDefending) {
    actualDamage = Math.round(actualDamage * 0.5); // 防御状态减伤50%
  }

  // 更新目标血量（确保是整数）
  target.hp = Math.max(0, Math.floor(target.hp - actualDamage));

  return {
    id: randomId(),
    round: battleState.round,
    turn: attackerId,
    actor: attackerId,
    actionType: 'attack',
    target: targetId,
    result: {
      damage: actualDamage,
      crit: isCrit,
    },
    description:
      attackerId === 'player'
        ? `你发动攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`
        : `${attacker.name}攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`,
  };
}

/**
 * 执行技能
 */
function executeSkill(
  battleState: BattleState,
  casterId: 'player' | 'enemy',
  skillId: string,
  targetId: 'player' | 'enemy'
): BattleAction {
  const caster = casterId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  const skill = caster.skills.find((s) => s.id === skillId);
  if (!skill) {
    throw new Error(`Skill ${skillId} not found`);
  }

  // 检查冷却
  if ((caster.cooldowns[skillId] || 0) > 0) {
    throw new Error(`Skill ${skillId} is on cooldown`);
  }

  // 检查消耗
  if (skill.cost.mana && (caster.mana || 0) < skill.cost.mana) {
    throw new Error(`灵力不足！需要 ${skill.cost.mana} 点灵力，当前只有 ${caster.mana || 0} 点。`);
  }

  // 消耗资源
  if (skill.cost.mana) {
    caster.mana = (caster.mana || 0) - skill.cost.mana;
  }

  // 执行技能效果
  let damage = 0;
  let heal = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];

  // 伤害计算
  if (skill.damage) {
    const base = skill.damage.base;
    const multiplier = skill.damage.multiplier;
    const statValue =
      skill.damage.type === 'magical' ? caster.spirit : caster.attack;
    const baseDamage = base + statValue * multiplier;

    let critChance = skill.damage.critChance || 0;
    // 应用Buff
    caster.buffs.forEach((buff) => {
      if (buff.type === 'crit') {
        critChance += buff.value;
      }
    });
    const isCrit = Math.random() < critChance;
    damage = isCrit
      ? Math.round(baseDamage * (skill.damage.critMultiplier || 1.5))
      : Math.round(baseDamage);

    // 应用防御
    if (skill.damage.type === 'physical') {
      // 物理伤害：如果伤害值大于目标防御，造成伤害；否则造成很少的穿透伤害
      if (damage > target.defense) {
        damage = damage - target.defense * 0.5; // 正常减伤
      } else {
        // 伤害小于防御，造成少量穿透伤害
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    } else {
      // 法术伤害：如果伤害值大于目标神识，造成伤害；否则造成很少的穿透伤害
      if (damage > target.spirit) {
        damage = damage - target.spirit * 0.3; // 正常减伤
      } else {
        // 伤害小于神识，造成少量穿透伤害
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    }

    // 确保伤害至少为1（除非完全免疫）
    damage = Math.max(1, Math.round(damage));

    if (target.isDefending) {
      damage = Math.round(damage * 0.5);
    }

    target.hp = Math.max(0, Math.floor(target.hp - damage));
  }

  // 治疗计算
  if (skill.heal) {
    const base = skill.heal.base;
    const multiplier = skill.heal.multiplier;
    heal = Math.floor(base + caster.maxHp * multiplier);
    caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + heal));
  }

  // 应用技能效果
  skill.effects.forEach((effect) => {
    if (effect.type === 'buff' && effect.buff) {
      const targetUnit = effect.target === 'self' ? caster : target;
      targetUnit.buffs.push({ ...effect.buff });
    }
    if (effect.type === 'debuff' && effect.debuff) {
      const targetUnit = effect.target === 'enemy' ? target : caster;
      targetUnit.debuffs.push({ ...effect.debuff });
    }
  });

  // 设置冷却
  caster.cooldowns[skillId] = skill.maxCooldown;

  return {
    id: randomId(),
    round: battleState.round,
    turn: casterId,
    actor: casterId,
    actionType: 'skill',
    skillId,
    target: targetId,
    result: {
      damage,
      heal,
      buffs,
      debuffs,
      manaCost: skill.cost.mana,
    },
    description: generateSkillDescription(skill, caster, target, damage, heal),
  };
}

/**
 * 执行使用物品
 */
function executeItem(battleState: BattleState, itemId: string): BattleAction {
  const player = battleState.player;

  // 从玩家背包中查找物品
  const item = battleState.playerInventory.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found in inventory`);
  }

  // 查找丹药配置（通过物品名称匹配）
  const potionConfig = Object.values(BATTLE_POTIONS).find(
    (p) => p.name === item.name
  );
  if (!potionConfig) {
    throw new Error(`Potion config for ${item.name} not found`);
  }

  let heal = 0;
  const buffs: Buff[] = [];

  if (potionConfig.type === 'heal' && potionConfig.effect.heal) {
    heal = Math.floor(potionConfig.effect.heal);
    player.hp = Math.min(player.maxHp, Math.floor(player.hp + heal));
  }

  if (potionConfig.type === 'buff' && potionConfig.effect.buffs) {
    potionConfig.effect.buffs.forEach((buff) => {
      player.buffs.push({ ...buff });
    });
  }

  // 消耗物品（减少数量）
  const itemIndex = battleState.playerInventory.findIndex((i) => i.id === itemId);
  if (itemIndex >= 0) {
    battleState.playerInventory[itemIndex] = {
      ...battleState.playerInventory[itemIndex],
      quantity: battleState.playerInventory[itemIndex].quantity - 1,
    };
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'item',
    itemId,
    result: {
      heal,
      buffs: potionConfig.effect.buffs || [],
    },
    description: `你使用了${potionConfig.name}，${heal > 0 ? `恢复了 ${heal} 点气血。` : '获得了增益效果。'}`,
  };
}

/**
 * 执行防御
 */
function executeDefend(
  battleState: BattleState,
  unitId: 'player' | 'enemy'
): BattleAction {
  const unit = unitId === 'player' ? battleState.player : battleState.enemy;
  unit.isDefending = true;

  return {
    id: randomId(),
    round: battleState.round,
    turn: unitId,
    actor: unitId,
    actionType: 'defend',
    result: {},
    description:
      unitId === 'player'
        ? '你进入防御状态，下回合受到的伤害减少50%。'
        : `${unit.name}进入防御状态。`,
  };
}

/**
 * 执行逃跑
 */
function executeFlee(battleState: BattleState): BattleAction {
  // 逃跑成功率基于速度差
  const playerSpeed = Number(battleState.player.speed) || 0;
  const enemySpeed = Number(battleState.enemy.speed) || 0;
  const speedDiff = playerSpeed - enemySpeed;
  const fleeChance = 0.3 + Math.min(0.5, speedDiff / 100);
  const success = Math.random() < Math.max(0, Math.min(1, fleeChance)); // 确保概率在0-1之间

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'flee',
    result: {},
    description: success
      ? '你成功逃离了战斗。'
      : '你试图逃跑，但被敌人拦截。',
  };
}

/**
 * 更新战斗状态（处理持续效果、冷却等）
 */
function updateBattleStateAfterAction(
  battleState: BattleState,
  action: BattleAction
): BattleState {
  const newState = { ...battleState };

  // 处理持续效果
  [newState.player, newState.enemy].forEach((unit) => {
    // 处理Debuff（持续伤害）
    unit.debuffs = unit.debuffs
      .map((debuff) => {
        if (debuff.type === 'poison' || debuff.type === 'burn') {
          const debuffValue = Math.floor(debuff.value);
          unit.hp = Math.max(0, Math.floor(unit.hp - debuffValue));
        }
        return { ...debuff, duration: debuff.duration - 1 };
      })
      .filter((debuff) => debuff.duration > 0);

    // 处理Buff（持续治疗等）
    unit.buffs = unit.buffs
      .map((buff) => {
        if (buff.type === 'heal' && buff.duration > 0) {
          const healValue = Math.floor(buff.value);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + healValue));
        }
        return { ...buff, duration: buff.duration === -1 ? -1 : buff.duration - 1 };
      })
      .filter((buff) => buff.duration === -1 || buff.duration > 0);

    // 更新冷却时间
    Object.keys(unit.cooldowns).forEach((skillId) => {
      if (unit.cooldowns[skillId] > 0) {
        unit.cooldowns[skillId] -= 1;
      }
    });

    // 重置防御状态
    unit.isDefending = false;
  });

  return newState;
}

/**
 * 检查战斗是否结束
 */
export function checkBattleEnd(battleState: BattleState): boolean {
  return battleState.player.hp <= 0 || battleState.enemy.hp <= 0;
}

/**
 * 生成技能描述
 */
function generateSkillDescription(
  skill: BattleSkill,
  caster: BattleUnit,
  target: BattleUnit,
  damage: number,
  heal: number
): string {
  if (damage > 0) {
    return `你使用【${skill.name}】，对${target.name}造成 ${damage} 点伤害。`;
  }
  if (heal > 0) {
    return `你使用【${skill.name}】，恢复了 ${heal} 点气血。`;
  }
  return `你使用【${skill.name}】。`;
}

/**
 * 执行灵宠行动
 */
function executePetAction(battleState: BattleState): BattleAction | null {
  if (!battleState.activePet || battleState.enemy.hp <= 0) {
    return null;
  }

  const activePet = battleState.activePet;
  const petSkillCooldowns = battleState.petSkillCooldowns || {};

      // 决定灵宠行动：根据亲密度和等级动态调整技能释放概率
      // 基础概率30%，亲密度每10点增加2%，等级每10级增加1%，最高70%
      const baseProbability = 0.3;
      const petAffection = Number(activePet.affection) || 0; // 确保是有效数字
      const petLevel = Number(activePet.level) || 0; // 确保是有效数字
      const affectionBonus = (petAffection / 100) * 0.2; // 亲密度加成，最高20%
      const levelBonus = (petLevel / 100) * 0.1; // 等级加成，最高10%
      const skillProbability = Math.min(0.7, baseProbability + affectionBonus + levelBonus);
      const useSkill = Math.random() < skillProbability;
  let petAction: 'attack' | 'skill' | null = null;
  let usedSkill: PetSkill | null = null;

  if (useSkill && activePet.skills.length > 0) {
    // 查找可用的技能（冷却时间为0或未设置冷却）
    const availableSkills = activePet.skills.filter(
      (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
    );

    if (availableSkills.length > 0) {
      usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      petAction = 'skill';
    } else {
      petAction = 'attack';
    }
  } else {
    petAction = 'attack';
  }

  if (petAction === 'skill' && usedSkill) {
    // 释放技能
    let petDamage = 0;
    let petHeal = 0;
    let petBuff: { attack?: number; defense?: number; hp?: number } | undefined;

    if (usedSkill.effect.damage) {
      // 技能伤害：基础伤害值 + 灵宠攻击力加成 + 等级加成
      const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
      // 根据进化阶段增加攻击力倍率
      const evolutionStage = Number(activePet.evolutionStage) || 0;
      const petLevel = Number(activePet.level) || 0;
      const petAffection = Number(activePet.affection) || 0;
      const petAttack = Number(activePet.stats?.attack) || 0;
      const evolutionMultiplier = 1.0 + evolutionStage * 0.5;
      const attackMultiplier = 1.0 + (petLevel / 50); // 每50级增加100%攻击力
      // 攻击力加成从30%提升到100%，并应用进化倍率
      const attackBonus = Math.floor(petAttack * evolutionMultiplier * attackMultiplier * 1.0); // 100%攻击力加成
      const levelBonus = Math.floor(petLevel * 5); // 每级+5伤害（从2提升到5）
      const affectionBonus = Math.floor(petAffection * 0.8); // 亲密度对技能伤害也有加成
      const skillDamage = baseSkillDamage + attackBonus + levelBonus + affectionBonus;
      petDamage = calcDamage(skillDamage, battleState.enemy.defense);
      battleState.enemy.hp = Math.max(0, Math.floor((Number(battleState.enemy.hp) || 0) - petDamage));
    }

    if (usedSkill.effect.heal) {
      // 治疗玩家
      const baseHeal = Number(usedSkill.effect.heal) || 0;
      const petLevel = Number(activePet.level) || 0;
      const petAffection = Number(activePet.affection) || 0;
      petHeal = Math.floor(
        baseHeal * (1 + petLevel * 0.05) * (1 + petAffection / 200)
      );
      const maxHp = Number(battleState.player.maxHp) || 0;
      const currentHp = Number(battleState.player.hp) || 0;
      battleState.player.hp = Math.min(maxHp, Math.floor(currentHp + petHeal));
    }

    if (usedSkill.effect.buff) {
      petBuff = usedSkill.effect.buff;
      // 应用Buff到玩家
      if (petBuff.attack) {
        battleState.player.buffs.push({
          id: randomId(),
          name: `${activePet.name}的攻击增益`,
          type: 'attack',
          value: petBuff.attack,
          duration: 3, // 默认3回合
          source: `pet_${activePet.id}`,
        });
      }
      if (petBuff.defense) {
        battleState.player.buffs.push({
          id: randomId(),
          name: `${activePet.name}的防御增益`,
          type: 'defense',
          value: petBuff.defense,
          duration: 3,
          source: `pet_${activePet.id}`,
        });
      }
      if (petBuff.hp) {
        const hpBuff = Math.floor(petBuff.hp);
        battleState.player.maxHp = Math.floor(battleState.player.maxHp + hpBuff);
        battleState.player.hp = Math.floor(battleState.player.hp + hpBuff);
      }
    }

    // 设置技能冷却
    if (usedSkill.cooldown) {
      const updatedCooldowns = { ...petSkillCooldowns };
      updatedCooldowns[usedSkill.id] = usedSkill.cooldown;
      battleState.petSkillCooldowns = updatedCooldowns;
    }

    // 构建技能描述
    let skillDesc = `【${activePet.name}】释放了【${usedSkill.name}】！`;
    if (petDamage > 0) {
      skillDesc += `对敌人造成 ${petDamage} 点伤害。`;
    }
    if (petHeal > 0) {
      skillDesc += `为你恢复了 ${petHeal} 点气血。`;
    }
    if (petBuff) {
      const buffParts: string[] = [];
      if (petBuff.attack) buffParts.push(`攻击+${petBuff.attack}`);
      if (petBuff.defense) buffParts.push(`防御+${petBuff.defense}`);
      if (petBuff.hp) buffParts.push(`气血+${petBuff.hp}`);
      if (buffParts.length > 0) {
        skillDesc += `你获得了${buffParts.join('、')}的增益。`;
      }
    }

    return {
      id: randomId(),
      round: battleState.round,
      turn: 'player',
      actor: 'player',
      actionType: 'skill',
      skillId: usedSkill.id,
      target: 'enemy',
      result: {
        damage: petDamage,
        heal: petHeal,
        buffs: petBuff ? [
          ...(petBuff.attack ? [{
            id: randomId(),
            name: `${activePet.name}的攻击增益`,
            type: 'attack' as const,
            value: petBuff.attack,
            duration: 3,
            source: `pet_${activePet.id}`,
          }] : []),
          ...(petBuff.defense ? [{
            id: randomId(),
            name: `${activePet.name}的防御增益`,
            type: 'defense' as const,
            value: petBuff.defense,
            duration: 3,
            source: `pet_${activePet.id}`,
          }] : []),
        ] : [],
      },
      description: skillDesc,
    };
  } else {
    // 普通攻击：基础攻击力 + 等级加成 + 亲密度加成
    // 普通攻击：基础攻击力 + 攻击力百分比加成 + 等级加成 + 亲密度加成
    const baseAttack = Number(activePet.stats?.attack) || 0;
    // 根据进化阶段增加攻击力倍率（幼年期1.0，成熟期1.5，完全体2.0）
    const evolutionStage = Number(activePet.evolutionStage) || 0;
    const petLevel = Number(activePet.level) || 0;
    const petAffection = Number(activePet.affection) || 0;
    const evolutionMultiplier = 1.0 + evolutionStage * 0.5;
    const attackMultiplier = 1.0 + (petLevel / 50); // 每50级增加100%攻击力
    const levelBonus = Math.floor(petLevel * 8); // 每级+8攻击（从3提升到8）
    const affectionBonus = Math.floor(petAffection * 1.5); // 亲密度加成（从0.5提升到1.5）
    // 最终攻击力 = (基础攻击力 * 进化倍率 * 等级倍率) + 等级加成 + 亲密度加成
    const petAttackDamage = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
    const petDamage = calcDamage(petAttackDamage, battleState.enemy.defense);
    battleState.enemy.hp = Math.max(0, Math.floor((Number(battleState.enemy.hp) || 0) - petDamage));

    return {
      id: randomId(),
      round: battleState.round,
      turn: 'player',
      actor: 'player',
      actionType: 'attack',
      target: 'enemy',
      result: {
        damage: petDamage,
      },
      description: `【${activePet.name}】紧随其后发动攻击，造成 ${petDamage} 点伤害。`,
    };
  }
}
