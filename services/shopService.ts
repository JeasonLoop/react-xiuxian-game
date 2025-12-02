import { ShopItem, ShopType, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { REALM_ORDER } from '../constants';
import { uid } from '../utils/gameUtils';

// 商店物品模板池
const SHOP_ITEM_TEMPLATES: Record<ShopType, Array<Omit<ShopItem, 'id'>>> = {
  [ShopType.Village]: [
    {
      name: '止血草',
      type: ItemType.Herb,
      description: '常见的草药，用于治疗轻微外伤。',
      rarity: '普通',
      price: 10,
      sellPrice: 3,
      effect: { hp: 20 },
    },
    {
      name: '炼器石',
      type: ItemType.Material,
      description: '用于强化法宝的基础材料。',
      rarity: '普通',
      price: 15,
      sellPrice: 5,
    },
    {
      name: '聚气丹',
      type: ItemType.Pill,
      description: '短时间内大幅提升修炼速度。',
      rarity: '普通',
      price: 30,
      sellPrice: 10,
      effect: { exp: 50 },
    },
    {
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
    {
      name: '回血丹',
      type: ItemType.Pill,
      description: '恢复少量气血。',
      rarity: '普通',
      price: 20,
      sellPrice: 7,
      effect: { hp: 30 },
    },
  ],
  [ShopType.City]: [
    {
      name: '紫猴花',
      type: ItemType.Herb,
      description: '炼制洗髓丹的材料，生长在悬崖峭壁。',
      rarity: '稀有',
      price: 80,
      sellPrice: 25,
    },
    {
      name: '洗髓丹',
      type: ItemType.Pill,
      description: '强身健体，略微提升最大气血。',
      rarity: '稀有',
      price: 150,
      sellPrice: 50,
      effect: { hp: 50 },
    },
    {
      name: '青钢剑',
      type: ItemType.Weapon,
      description: '精钢打造的剑，锋利无比。',
      rarity: '稀有',
      price: 200,
      sellPrice: 60,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Weapon,
      effect: { attack: 15 },
    },
    {
      name: '凝神丹',
      type: ItemType.Pill,
      description: '凝神聚气，提升神识。',
      rarity: '稀有',
      price: 120,
      sellPrice: 40,
      effect: { spirit: 10 },
    },
    {
      name: '强体丹',
      type: ItemType.Pill,
      description: '强身健体，提升体魄。',
      rarity: '稀有',
      price: 120,
      sellPrice: 40,
      effect: { physique: 10 },
    },
    {
      name: '强化石',
      type: ItemType.Material,
      description: '用于强化法宝的珍贵材料。',
      rarity: '稀有',
      price: 50,
      sellPrice: 15,
    },
  ],
  [ShopType.Sect]: [
    {
      name: '筑基丹',
      type: ItemType.Pill,
      description: '增加突破到筑基期的几率。',
      rarity: '传说',
      price: 1000,
      sellPrice: 300,
      effect: { exp: 500 },
    },
    {
      name: '高阶妖丹',
      type: ItemType.Material,
      description: '强大妖兽的内丹，灵气逼人。',
      rarity: '稀有',
      price: 500,
      sellPrice: 150,
    },
    {
      name: '凝神丹',
      type: ItemType.Pill,
      description: '凝神聚气，提升神识。',
      rarity: '稀有',
      price: 200,
      sellPrice: 60,
      effect: { spirit: 15 },
    },
    {
      name: '强体丹',
      type: ItemType.Pill,
      description: '强身健体，提升体魄。',
      rarity: '稀有',
      price: 200,
      sellPrice: 60,
      effect: { physique: 15 },
    },
  ],
};

// 高级物品模板（刷新时小概率出现）
const PREMIUM_ITEM_TEMPLATES: Array<Omit<ShopItem, 'id'>> = [
  {
    name: '千年灵芝',
    type: ItemType.Herb,
    description: '千年灵草，蕴含浓郁灵气。',
    rarity: '传说',
    price: 2000,
    sellPrice: 600,
    effect: { hp: 200, exp: 200 },
  },
  {
    name: '紫霄剑',
    type: ItemType.Weapon,
    description: '传说中的仙剑，剑气逼人。',
    rarity: '传说',
    price: 5000,
    sellPrice: 1500,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 80, speed: 20 },
    minRealm: RealmType.QiRefining,
  },
  {
    name: '村里最好的剑',
    type: ItemType.Weapon,
    description: '村里最好的剑，听老板说刷出来的一般是大富大贵之人，关键时刻可以保命（这玩意被人动过手脚）',
    rarity: '仙品',
    price: 2500000,
    sellPrice: 2500000,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 100000, physique: 100000, spirit: 100000, hp: 100000, speed: 100000 },
    reviveChances: 5,
    minRealm: RealmType.QiRefining,
  },
  {
    name: '九转金丹',
    type: ItemType.Pill,
    description: '传说中的仙丹，可大幅提升修为。',
    rarity: '传说',
    price: 3000,
    sellPrice: 900,
    effect: { exp: 1000 },
  },
  {
    name: '龙鳞甲',
    type: ItemType.Armor,
    description: '龙鳞制成的护甲，防御力极强。',
    rarity: '传说',
    price: 4000,
    sellPrice: 1200,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Chest,
      effect: { defense: 60, hp: 100 },
    minRealm: RealmType.QiRefining,
  },
  {
    name: '仙灵草',
    type: ItemType.Herb,
    description: '仙气缭绕的灵草，极为罕见。',
    rarity: '仙品',
    price: 10000,
    sellPrice: 3000,
    effect: { hp: 500, exp: 500 },
  },
  {
    name: '天元丹',
    type: ItemType.Pill,
    description: '传说中的仙丹，可大幅提升所有属性。',
    rarity: '仙品',
    price: 15000,
    sellPrice: 4500,
    effect: { attack: 50, defense: 50, spirit: 50, physique: 50, speed: 50 },
  },
];

/**
 * 生成商店物品
 * @param shopType 商店类型
 * @param playerRealm 玩家境界
 * @param includePremium 是否包含高级物品（刷新时小概率）
 * @returns 生成的商店物品列表
 */
export function generateShopItems(
  shopType: ShopType,
  playerRealm: RealmType,
  includePremium: boolean = false
): ShopItem[] {
  const templates = SHOP_ITEM_TEMPLATES[shopType];
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);

  // 基础物品数量：村庄3-5个，城市4-6个，仙门5-7个
  const baseCount = shopType === ShopType.Village ? 3 : shopType === ShopType.City ? 4 : 5;
  const maxCount = shopType === ShopType.Village ? 5 : shopType === ShopType.City ? 6 : 7;
  const itemCount = baseCount + Math.floor(Math.random() * (maxCount - baseCount + 1));

  const items: ShopItem[] = [];
  const usedNames = new Set<string>();

  // 生成基础物品
  for (let i = 0; i < itemCount; i++) {
    let attempts = 0;
    let template = templates[Math.floor(Math.random() * templates.length)];

    // 避免重复，最多尝试10次
    while (usedNames.has(template.name) && attempts < 10 && usedNames.size < templates.length) {
      template = templates[Math.floor(Math.random() * templates.length)];
      attempts++;
    }

    usedNames.add(template.name);

    // 检查境界要求
    if (template.minRealm) {
      const templateRealmIndex = REALM_ORDER.indexOf(template.minRealm);
      if (playerRealmIndex < templateRealmIndex) {
        continue; // 跳过境界不足的物品
      }
    }

    items.push({
      ...template,
      id: `shop-${shopType}-${uid()}`,
    });
  }

  // 如果启用高级物品且随机成功（10%概率），添加一个高级物品
  if (includePremium && Math.random() < 0.1) {
    const premiumTemplate = PREMIUM_ITEM_TEMPLATES[
      Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
    ];

    // 检查境界要求
    if (!premiumTemplate.minRealm ||
        playerRealmIndex >= REALM_ORDER.indexOf(premiumTemplate.minRealm)) {
      items.push({
        ...premiumTemplate,
        id: `shop-premium-${uid()}`,
      });
    }
  }

  return items;
}
