import { ShopItem, ShopType, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { REALM_ORDER, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS } from '../constants/index';
import { uid } from '../utils/gameUtils';
import { getItemFromConstants } from '../utils/itemConstantsUtils';
import { generateItems } from '../utils/itemGenerator';

/**
 * 从常量池获取物品并添加商店价格信息
 */
function createShopItemFromConstants(
  itemName: string,
  price: number,
  sellPrice: number,
  minRealm?: RealmType
): Omit<ShopItem, 'id'> {
  const itemFromConstants = getItemFromConstants(itemName);
  if (!itemFromConstants) {
    throw new Error(`物品 ${itemName} 在常量池中未找到`);
  }
  return {
    name: itemFromConstants.name,
    type: itemFromConstants.type,
    description: itemFromConstants.description,
    rarity: itemFromConstants.rarity,
    price,
    sellPrice,
    effect: itemFromConstants.effect,
    permanentEffect: itemFromConstants.permanentEffect,
    isEquippable: itemFromConstants.isEquippable,
    equipmentSlot: itemFromConstants.equipmentSlot as EquipmentSlot | undefined,
    advancedItemType: (itemFromConstants as any).advancedItemType,
    advancedItemId: (itemFromConstants as any).advancedItemId,
    minRealm,
  };
}

// 商店物品模板池（所有物品都从常量池获取）
const SHOP_ITEM_TEMPLATES: Record<ShopType, Array<Omit<ShopItem, 'id'>>> = {
  [ShopType.Village]: [
    createShopItemFromConstants('止血草', 10, 3),
    createShopItemFromConstants('炼器石', 15, 5),
    (() => {
      const item = createShopItemFromConstants('聚气丹', 30, 10);
      return item;
    })(),
    createShopItemFromConstants('凡铁剑', 50, 15), // 使用常量池中的名称
    // 回血丹不在常量池中，如果常量池中没有则跳过
    ...(getItemFromConstants('回血丹') ? [createShopItemFromConstants('回血丹', 20, 7)] : []),
  ],
  [ShopType.City]: [
    // 只添加常量池中存在的物品
    ...(getItemFromConstants('紫猴花') ? [createShopItemFromConstants('紫猴花', 80, 25)] : []),
    ...(getItemFromConstants('洗髓丹') ? [createShopItemFromConstants('洗髓丹', 150, 50)] : []),
    // 青钢剑可能不在常量池中，如果不在则跳过
    ...(getItemFromConstants('青钢剑') ? [createShopItemFromConstants('青钢剑', 200, 60)] : []),
    ...(getItemFromConstants('凝神丹') ? [createShopItemFromConstants('凝神丹', 120, 40)] : []),
    ...(getItemFromConstants('强体丹') ? [createShopItemFromConstants('强体丹', 120, 40)] : []),
    // 强化石可能不在常量池中，如果不在则跳过
    ...(getItemFromConstants('强化石') ? [createShopItemFromConstants('强化石', 50, 15)] : []),
  ],
  [ShopType.Sect]: [
    ...(getItemFromConstants('筑基丹') ? [createShopItemFromConstants('筑基丹', 1000, 300)] : []),
    // 高阶妖丹可能不在常量池中，如果不在则跳过
    ...(getItemFromConstants('高阶妖丹') ? [createShopItemFromConstants('高阶妖丹', 500, 150)] : []),
    ...(getItemFromConstants('凝神丹') ? [createShopItemFromConstants('凝神丹', 200, 60)] : []),
    ...(getItemFromConstants('强体丹') ? [createShopItemFromConstants('强体丹', 200, 60)] : []),
  ],
  [ShopType.BlackMarket]: [], // 黑市物品从高级物品池中随机生成
  [ShopType.LimitedTime]: [], // 限时商店物品从所有物品池中随机生成，带折扣
  [ShopType.Reputation]: [], // 声望商店物品需要声望值解锁
};

// 高级物品模板（刷新时小概率出现，黑市也会使用）
// 只包含常量池中存在的物品，特殊物品（如"村里最好的剑"）可以保留硬编码
const PREMIUM_ITEM_TEMPLATES: Array<Omit<ShopItem, 'id'>> = [
  // 从常量池获取的物品
  ...(getItemFromConstants('千年灵芝') ? [createShopItemFromConstants('千年灵芝', 2000, 600)] : []),
  ...(getItemFromConstants('紫霄剑') ? [createShopItemFromConstants('紫霄剑', 5000, 1500, RealmType.QiRefining)] : []),
  ...(getItemFromConstants('九转金丹') ? [createShopItemFromConstants('九转金丹', 3000, 900)] : []),
  ...(getItemFromConstants('龙鳞甲') ? [createShopItemFromConstants('龙鳞甲', 4000, 1200, RealmType.QiRefining)] : []),
  ...(getItemFromConstants('仙灵草') ? [createShopItemFromConstants('仙灵草', 10000, 3000)] : []),
  ...(getItemFromConstants('天元丹') ? [createShopItemFromConstants('天元丹', 15000, 4500)] : []),
  // 特殊物品（不在常量池中，保留硬编码）
  {
    name: '村里最好的剑',
    type: ItemType.Weapon,
    description: '村里最好的剑，听老板说刷出来的一般是大富大贵之人，关键时刻可以保命（这玩意被人动过手脚）',
    rarity: '仙品' as ItemRarity,
    price: 999999,
    sellPrice: 999999,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 100000, physique: 100000, spirit: 100000, hp: 100000, speed: 100000 },
    reviveChances: 5,
    minRealm: RealmType.QiRefining,
  },
].filter(Boolean); // 过滤掉 undefined 项

// 声望商店物品模板（需要声望值解锁）
// 只包含常量池中存在的物品
const REPUTATION_SHOP_TEMPLATES: Array<Omit<ShopItem, 'id'>> = [
  ...(getItemFromConstants('传承石') ? [createShopItemFromConstants('传承石', 50000, 50000)] : []),
  ...(getItemFromConstants('仙品功法残卷') ? [createShopItemFromConstants('仙品功法残卷', 20000, 6000)] : []),
  ...(getItemFromConstants('真龙之血') ? [createShopItemFromConstants('真龙之血', 30000, 9000)] : []),
  ...(getItemFromConstants('凤凰羽毛') ? [createShopItemFromConstants('凤凰羽毛', 30000, 9000)] : []),
  ...(getItemFromConstants('虚空碎片') ? [createShopItemFromConstants('虚空碎片', 30000, 9000)] : []),
].filter(Boolean); // 过滤掉 undefined 项

// 从 ITEM_TEMPLATES 生成商店物品模板
const GENERATED_SHOP_ITEMS: Array<Omit<ShopItem, 'id'>> = [];
const itemTypes: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact, ItemType.Pill, ItemType.Herb, ItemType.Material];
const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

// 为每种类型和稀有度生成物品
itemTypes.forEach(type => {
  rarities.forEach(rarity => {
    const items = generateItems({
      type,
      rarity,
      count: 5, // 每个类型和稀有度生成5件用于商店
      allowDuplicates: false,
    });

    items.forEach(item => {
      // 根据稀有度设置价格
      let price = 100;
      let sellPrice = 30;
      let minRealm: RealmType | undefined;

      switch (rarity) {
        case '普通':
          price = 50 + Math.floor(Math.random() * 100);
          sellPrice = Math.floor(price * 0.3);
          break;
        case '稀有':
          price = 200 + Math.floor(Math.random() * 300);
          sellPrice = Math.floor(price * 0.3);
          minRealm = RealmType.QiRefining;
          break;
        case '传说':
          price = 1000 + Math.floor(Math.random() * 2000);
          sellPrice = Math.floor(price * 0.25);
          minRealm = RealmType.Foundation;
          break;
        case '仙品':
          price = 5000 + Math.floor(Math.random() * 10000);
          sellPrice = Math.floor(price * 0.2);
          minRealm = RealmType.GoldenCore;
          break;
      }

      // 根据物品类型调整价格
      if (type === ItemType.Weapon || type === ItemType.Armor) {
        price = Math.floor(price * 1.5);
        sellPrice = Math.floor(price * 0.3);
      } else if (type === ItemType.Artifact) {
        price = Math.floor(price * 2);
        sellPrice = Math.floor(price * 0.25);
      }

      GENERATED_SHOP_ITEMS.push({
        name: item.name,
        type: item.type,
        description: item.description,
        rarity: item.rarity,
        price,
        sellPrice,
        effect: item.effect,
        permanentEffect: item.permanentEffect,
        isEquippable: item.isEquippable,
        equipmentSlot: item.equipmentSlot as EquipmentSlot | undefined,
        minRealm,
      });
    });
  });
});

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
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const items: ShopItem[] = [];
  const usedNames = new Set<string>();

  // 黑市商店：只生成高级物品，3-5个，稀有度更高，可能包含进阶物品
  if (shopType === ShopType.BlackMarket) {
    // 检查高级物品模板是否为空
    if (PREMIUM_ITEM_TEMPLATES.length === 0) {
      return items; // 如果没有可用模板，返回空数组
    }

    const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5个
    let advancedItemAdded = false; // 防止重复添加进阶物品

    // 70%概率出现高级物品，30%概率出现传说/仙品物品
    for (let i = 0; i < itemCount; i++) {
      let template: Omit<ShopItem, 'id'> | undefined;

      // 15%概率出现进阶物品（每个黑市刷新最多一个）
      if (!advancedItemAdded && Math.random() < 0.15) {
        const currentRealmIndex = playerRealmIndex;

        // 根据境界选择进阶物品
        if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
          // 筑基奇物
          const treasures = Object.values(FOUNDATION_TREASURES);
          if (treasures.length > 0) {
            const selected = treasures[Math.floor(Math.random() * treasures.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 200000 + Math.floor(Math.random() * 200000), // 20万-40万灵石（涨价4倍）
              sellPrice: 60000,
              isAdvancedItem: true,
              advancedItemType: 'foundationTreasure',
              minRealm: RealmType.QiRefining,
            };
            advancedItemAdded = true;
          }
        } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) &&
                   currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
          // 天地精华
          const essences = Object.values(HEAVEN_EARTH_ESSENCES);
          if (essences.length > 0) {
            const selected = essences[Math.floor(Math.random() * essences.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 800000 + Math.floor(Math.random() * 800000), // 80万-160万灵石（涨价4倍）
              sellPrice: 240000,
              isAdvancedItem: true,
              advancedItemType: 'heavenEarthEssence',
              minRealm: RealmType.GoldenCore,
            };
            advancedItemAdded = true;
          }
        } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering)) {
          // 天地之髓
          const marrows = Object.values(HEAVEN_EARTH_MARROWS);
          if (marrows.length > 0) {
            const selected = marrows[Math.floor(Math.random() * marrows.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 2000000 + Math.floor(Math.random() * 2000000), // 200万-400万灵石（涨价4倍）
              sellPrice: 600000,
              isAdvancedItem: true,
              advancedItemType: 'heavenEarthMarrow',
              minRealm: RealmType.SpiritSevering,
            };
            advancedItemAdded = true;
          }
        }
      }

      // 如果没有选择进阶物品，则从普通物品池中选择
      if (!template) {
        if (Math.random() < 0.3) {
          // 30%概率从高级物品池中选择
          template = PREMIUM_ITEM_TEMPLATES[
            Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
          ];
        } else {
          // 70%概率从所有商店物品池中选择稀有/传说物品
          const allTemplates = [
            ...SHOP_ITEM_TEMPLATES[ShopType.Village],
            ...SHOP_ITEM_TEMPLATES[ShopType.City],
            ...SHOP_ITEM_TEMPLATES[ShopType.Sect],
          ].filter(t => t && (t.rarity === '稀有' || t.rarity === '传说'));

          if (allTemplates.length === 0) {
            template = PREMIUM_ITEM_TEMPLATES[
              Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
            ];
          } else {
            template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
          }
        }
      }

      // 确保 template 存在
      if (!template) {
        continue;
      }

      // 检查境界要求
      if (!template.minRealm ||
          playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-blackmarket-${uid()}`,
        });
      }
    }
    return items;
  }

  // 限时商店：从所有物品池中随机选择，数量5-7个
  if (shopType === ShopType.LimitedTime) {
    const itemCount = 5 + Math.floor(Math.random() * 3); // 5-7个
    const allTemplates = [
      ...SHOP_ITEM_TEMPLATES[ShopType.Village],
      ...SHOP_ITEM_TEMPLATES[ShopType.City],
      ...SHOP_ITEM_TEMPLATES[ShopType.Sect],
      ...PREMIUM_ITEM_TEMPLATES,
      ...GENERATED_SHOP_ITEMS, // 添加生成的物品
    ].filter(Boolean); // 过滤掉 undefined 项

    // 检查模板数组是否为空
    if (allTemplates.length === 0) {
      return items; // 如果没有可用模板，返回空数组
    }

    for (let i = 0; i < itemCount; i++) {
      // 如果所有物品都已使用，提前结束
      if (usedNames.size >= allTemplates.length) {
        break;
      }

      let attempts = 0;
      let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

      // 确保 template 存在
      if (!template) {
        continue;
      }

      while (template && usedNames.has(template.name) && attempts < 20 && usedNames.size < allTemplates.length) {
        template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        attempts++;
      }

      // 再次检查 template 是否存在
      if (!template) {
        continue;
      }

      usedNames.add(template.name);

      // 检查境界要求
      if (!template.minRealm ||
          playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-limited-${uid()}`,
        });
      }
    }
    return items;
  }

  // 声望商店：从声望商店模板中生成
  if (shopType === ShopType.Reputation) {
    // 合并声望商店模板和生成的物品
    const allTemplates = [
      ...REPUTATION_SHOP_TEMPLATES,
      ...GENERATED_SHOP_ITEMS.filter(item => item.rarity === '传说' || item.rarity === '仙品'),
    ];

    // 检查模板数组是否为空
    if (allTemplates.length === 0) {
      return items; // 如果没有可用模板，返回空数组
    }

    const itemCount = 4 + Math.floor(Math.random() * 3); // 4-6个

    for (let i = 0; i < itemCount; i++) {
      // 如果所有物品都已使用，提前结束
      if (usedNames.size >= allTemplates.length) {
        break;
      }

      let attempts = 0;
      let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

      // 确保 template 存在
      if (!template) {
        continue;
      }

      while (template && usedNames.has(template.name) && attempts < 10 && usedNames.size < allTemplates.length) {
        template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        attempts++;
      }

      // 再次检查 template 是否存在
      if (!template) {
        continue;
      }

      usedNames.add(template.name);

      // 检查境界要求
      if (!template.minRealm ||
          playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-reputation-${uid()}`,
        });
      }
    }
    return items;
  }

  // 普通商店（村庄、城市、仙门）
  const templates = SHOP_ITEM_TEMPLATES[shopType].filter(Boolean); // 过滤掉 undefined 项

  // 检查模板数组是否为空
  if (templates.length === 0) {
    return items; // 如果没有可用模板，返回空数组
  }

  const baseCount = shopType === ShopType.Village ? 3 : shopType === ShopType.City ? 4 : 5;
  const maxCount = shopType === ShopType.Village ? 5 : shopType === ShopType.City ? 6 : 7;
  const itemCount = baseCount + Math.floor(Math.random() * (maxCount - baseCount + 1));

  // 生成基础物品
  for (let i = 0; i < itemCount; i++) {
    // 如果所有物品都已使用，提前结束
    if (usedNames.size >= templates.length) {
      break;
    }

    let attempts = 0;
    let template = templates[Math.floor(Math.random() * templates.length)];

    // 确保 template 存在
    if (!template) {
      continue;
    }

    // 避免重复，最多尝试10次
    while (template && usedNames.has(template.name) && attempts < 10 && usedNames.size < templates.length) {
      template = templates[Math.floor(Math.random() * templates.length)];
      attempts++;
    }

    // 再次检查 template 是否存在
    if (!template) {
      continue;
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
  if (includePremium && Math.random() < 0.1 && PREMIUM_ITEM_TEMPLATES.length > 0) {
    const premiumTemplate = PREMIUM_ITEM_TEMPLATES[
      Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
    ];

    // 确保 premiumTemplate 存在
    if (premiumTemplate) {
      // 检查境界要求
      if (!premiumTemplate.minRealm ||
          playerRealmIndex >= REALM_ORDER.indexOf(premiumTemplate.minRealm)) {
        items.push({
          ...premiumTemplate,
          id: `shop-premium-${uid()}`,
        });
      }
    }
  }

  return items;
}
