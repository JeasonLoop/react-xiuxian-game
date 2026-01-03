import { Item, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { RARITY_MULTIPLIERS, REALM_ORDER, REALM_DATA } from '../constants/index';
import { getItemFromConstants } from './itemConstantsUtils';

// 共享的装备数值配置（统一管理，避免重复定义）
// 调整属性浮动范围，缩小差距，使装备属性更稳定
export const EQUIPMENT_RARITY_PERCENTAGES: Record<ItemRarity, { min: number; max: number }> = {
  普通: { min: 0.25, max: 0.40 },  // 普通装备：25%-40%基础属性
  稀有: { min: 0.50, max: 0.80 },  // 稀有装备：50%-80%基础属性（约1.3倍普通）
  传说: { min: 0.90, max: 1.40 },  // 传说装备：90%-140%基础属性（约1.8倍普通）
  仙品: { min: 1.50, max: 2.20 },  // 仙品装备：150%-220%基础属性（约2.5倍普通）
  // 优化：缩小稀有度差距，从原来的1/1.5/2.5/4倍改为1/1.3/1.8/2.5倍
};

export const EQUIPMENT_MIN_STATS: Record<ItemRarity, { attack: number; defense: number; hp: number; spirit: number; physique: number; speed: number }> = {
  普通: { attack: 50, defense: 50, hp: 50, spirit: 50, physique: 50, speed: 50 },
  稀有: { attack: 200, defense: 200, hp: 200, spirit: 200, physique: 200, speed: 200 },
  传说: { attack: 400, defense: 400, hp: 400, spirit: 400, physique: 400, speed: 400 },
  仙品: { attack: 1000, defense: 1000, hp: 1000, spirit: 1000, physique: 1000, speed: 1000 },
};

// 定义物品效果类型（与 Item 接口中的类型保持一致）
type ItemEffect = NonNullable<Item['effect']>;
type ItemPermanentEffect = NonNullable<Item['permanentEffect']>;

// 将常见的类型别称规范化，避免多处硬编码
export const normalizeTypeHint = (type?: ItemType | string): ItemType | undefined => {
  if (!type) return undefined;
  const t = String(type).toLowerCase();
  const map: Record<string, ItemType> = {
    防具: ItemType.Armor,
    护具: ItemType.Armor,
    甲: ItemType.Armor,
    装备: ItemType.Armor,
    armor: ItemType.Armor,
    灵器: ItemType.Artifact,
    神器: ItemType.Artifact,
    灵宝: ItemType.Artifact,
    法器: ItemType.Artifact,
    artifact: ItemType.Artifact,
    weapon: ItemType.Weapon,
    武器: ItemType.Weapon,
    丹: ItemType.Pill,
    药: ItemType.Pill,
    pill: ItemType.Pill,
    potion: ItemType.Pill,
    elixir: ItemType.Pill,
    草: ItemType.Herb,
    灵草: ItemType.Herb,
    herb: ItemType.Herb,
    material: ItemType.Material,
    材料: ItemType.Material,
    accessory: ItemType.Accessory,
    首饰: ItemType.Accessory,
    ring: ItemType.Ring,
    戒指: ItemType.Ring,
    recipe: ItemType.Recipe,
  };
  return map[t] || (Object.values(ItemType).includes(type as ItemType) ? (type as ItemType) : undefined);
};

// 将类型别称规范化为中文字符串标签（用于显示）
export const normalizeTypeLabel = (type: ItemType | string, item?: {
  advancedItemType?: string;
  equipmentSlot?: EquipmentSlot;
  name?: string;
  description?: string;
}): string => {
  if (!type) return '未知';
  const t = String(type).toLowerCase();

  // 如果是进阶物品，显示具体类型
  if (t === 'advanceditem' || type === ItemType.AdvancedItem) {
    if (item?.advancedItemType) {
      const typeMap: Record<string, string> = {
        foundationTreasure: '筑基奇物',
        heavenEarthEssence: '天地精华',
        heavenEarthMarrow: '天地之髓',
        longevityRule: '规则之力',
      };
      return typeMap[item.advancedItemType] || '进阶物品';
    }
    return '进阶物品';
  }

  // 如果是护甲类型，显示具体槽位名称
  if (t === 'armor' || type === ItemType.Armor) {
    // 优先使用物品的 equipmentSlot 属性
    if (item?.equipmentSlot) {
      return item.equipmentSlot; // EquipmentSlot 枚举值已经是中文（如"头部"、"肩部"等）
    }

    // 如果没有 equipmentSlot，尝试从名称和描述推断
    if (item?.name && item?.description) {
      const inferred = inferItemTypeAndSlot(
        item.name,
        ItemType.Armor,
        item.description,
        true
      );
      if (inferred.equipmentSlot) {
        return inferred.equipmentSlot;
      }
    }

    // 如果无法推断，显示默认的"护甲"
    return '护甲';
  }

  const map: Record<string, string> = {
    herb: '草药',
    pill: '丹药',
    material: '材料',
    artifact: '法宝',
    weapon: '武器',
    armor: '护甲',
    accessory: '首饰',
    ring: '戒指',
    recipe: '丹方',
    advanceditem: '进阶物品',
  };
  return map[t] || (type as string);
};

// 稳定的槽位选择：同名物品在任意流程都会落在同一个槽位
const stablePickSlot = (name: string, slots: EquipmentSlot[]) => {
  const hash = Array.from(name).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0) & 0xffffffff, 0);
  return slots[hash % slots.length];
};

// 已知物品的效果映射表（与常量池保持一致）
// 注意：这些值必须与 constants.ts 中的定义完全一致
export const KNOWN_ITEM_EFFECTS: Record<
  string,
  { effect?: ItemEffect; permanentEffect?: ItemPermanentEffect }
> = {
  // 草药类 - 从 INITIAL_ITEMS 和战斗奖励中获取
  止血草: { effect: { hp: 20 } }, // INITIAL_ITEMS: effect: { hp: 20 }
  聚灵草: {}, // INITIAL_ITEMS: 无 effect（只是材料）
  回气草: { effect: { hp: 30 } }, // 战斗奖励: effect: { hp: 30 }, permanentEffect: { maxHp: 5 } - 但这里只保留主要效果
  凝神花: { effect: { hp: 50, spirit: 5 } }, // 战斗奖励: effect: { hp: 50, spirit: 5 }
  血参: { effect: { hp: 80 } }, // 战斗奖励: effect: { hp: 80 }
  千年灵芝: {
    // 战斗奖励: effect: { hp: 150 }, permanentEffect: { maxHp: 40, spirit: 20, physique: 15, maxLifespan: 30 }
    effect: { hp: 150 },
    permanentEffect: { maxHp: 40, spirit: 20, physique: 15, maxLifespan: 30 },
  },
  万年仙草: {
    // 战斗奖励: effect: { hp: 300 }, permanentEffect: { maxHp: 100, spirit: 100, physique: 80, speed: 50, maxLifespan: 200 }
    effect: { hp: 300 },
    permanentEffect: { maxHp: 100, spirit: 100, physique: 80, speed: 50, maxLifespan: 200 },
  },
  // 丹药类 - 从 PILL_RECIPES 和 DISCOVERABLE_RECIPES 中获取
  回血丹: { effect: { hp: 50 } }, // 常量中未找到，保留原值
  聚气丹: { effect: { exp: 50 } }, // PILL_RECIPES: effect: { exp: 50 } (修正：从 20 改为 50)
  强体丹: { permanentEffect: { physique: 20 } }, // DISCOVERABLE_RECIPES: permanentEffect: { physique: 20 } (修正：从 5 改为 20)
  凝神丹: { permanentEffect: { spirit: 20 } }, // DISCOVERABLE_RECIPES: permanentEffect: { spirit: 20 } (修正：从 5 改为 20)
  筑基丹: {
    // PILL_RECIPES: effect: { exp: 500 }, permanentEffect: { spirit: 30, physique: 30, maxHp: 100 }
    effect: { exp: 500 },
    permanentEffect: { spirit: 30, physique: 30, maxHp: 100 },
  },
  破境丹: {
    // DISCOVERABLE_RECIPES: effect: { exp: 10000 }, permanentEffect: { spirit: 50, physique: 50, attack: 30, defense: 30 }
    effect: { exp: 10000 },
    permanentEffect: { spirit: 50, physique: 50, attack: 30, defense: 30 },
  },
  仙灵丹: {
    // DISCOVERABLE_RECIPES: effect: { exp: 2000, spirit: 50, physique: 50 }, permanentEffect: { maxLifespan: 300, spirit: 300, attack: 300, defense: 300, physique: 300, speed: 300 }
    effect: { exp: 2000, spirit: 50, physique: 50 },
    permanentEffect: { maxLifespan: 300, spirit: 300, attack: 300, defense: 300, physique: 300, speed: 300 },
  },
};

/**
 * 根据稀有度调整丹药效果
 * 确保不同稀有度的丹药效果差异明显
 */
export const adjustPillEffectByRarity = (
  effect: ItemEffect | undefined,
  permanentEffect: ItemPermanentEffect | undefined,
  rarity: ItemRarity
): { effect?: ItemEffect; permanentEffect?: ItemPermanentEffect } => {
  const multiplier = RARITY_MULTIPLIERS[rarity] || 1;

  // 如果稀有度是普通，直接返回
  if (rarity === '普通' || multiplier === 1) {
    return { effect, permanentEffect };
  }

  const adjustedEffect: ItemEffect = {};
  const adjustedPermanentEffect: ItemPermanentEffect = {};

  // 调整临时效果（effect）
  if (effect) {
    if (effect.exp !== undefined) {
      adjustedEffect.exp = Math.floor(effect.exp * multiplier);
    }
    if (effect.hp !== undefined) {
      adjustedEffect.hp = Math.floor(effect.hp * multiplier);
    }
    if (effect.attack !== undefined) {
      adjustedEffect.attack = Math.floor(effect.attack * multiplier);
    }
    if (effect.defense !== undefined) {
      adjustedEffect.defense = Math.floor(effect.defense * multiplier);
    }
    if (effect.spirit !== undefined) {
      adjustedEffect.spirit = Math.floor(effect.spirit * multiplier);
    }
    if (effect.physique !== undefined) {
      adjustedEffect.physique = Math.floor(effect.physique * multiplier);
    }
    if (effect.speed !== undefined) {
      adjustedEffect.speed = Math.floor(effect.speed * multiplier);
    }
    if (effect.lifespan !== undefined) {
      adjustedEffect.lifespan = Math.floor(effect.lifespan * multiplier);
    }
  }

  // 调整永久效果（permanentEffect）
  if (permanentEffect) {
    if (permanentEffect.attack !== undefined) {
      adjustedPermanentEffect.attack = Math.floor(permanentEffect.attack * multiplier);
    }
    if (permanentEffect.defense !== undefined) {
      adjustedPermanentEffect.defense = Math.floor(permanentEffect.defense * multiplier);
    }
    if (permanentEffect.spirit !== undefined) {
      adjustedPermanentEffect.spirit = Math.floor(permanentEffect.spirit * multiplier);
    }
    if (permanentEffect.physique !== undefined) {
      adjustedPermanentEffect.physique = Math.floor(permanentEffect.physique * multiplier);
    }
    if (permanentEffect.speed !== undefined) {
      adjustedPermanentEffect.speed = Math.floor(permanentEffect.speed * multiplier);
    }
    if (permanentEffect.maxHp !== undefined) {
      adjustedPermanentEffect.maxHp = Math.floor(permanentEffect.maxHp * multiplier);
    }
    if (permanentEffect.maxLifespan !== undefined) {
      adjustedPermanentEffect.maxLifespan = Math.floor(permanentEffect.maxLifespan * multiplier);
    }
    if (permanentEffect.spiritualRoots) {
      adjustedPermanentEffect.spiritualRoots = {};
      Object.entries(permanentEffect.spiritualRoots).forEach(([key, value]) => {
        if (value !== undefined) {
          adjustedPermanentEffect.spiritualRoots![key as keyof typeof permanentEffect.spiritualRoots] =
            Math.floor(value * multiplier);
        }
      });
    }
  }

  return {
    effect: Object.keys(adjustedEffect).length > 0 ? adjustedEffect : effect,
    permanentEffect: Object.keys(adjustedPermanentEffect).length > 0 ? adjustedPermanentEffect : permanentEffect,
  };
};

// 规范化物品效果，确保已知物品的效果与描述一致
// 完全使用常量池中的原始属性，不做任何调整
export const normalizeItemEffect = (
  itemName: string,
  aiEffect?: ItemEffect,
  aiPermanentEffect?: ItemPermanentEffect,
  itemType?: ItemType,
  rarity?: ItemRarity
) => {
  // 优先从常量池获取物品定义（如果常量池中有，直接使用，不再调整）
  const itemFromConstants = getItemFromConstants(itemName);
  if (itemFromConstants) {
    // 如果常量池中有该物品的定义，优先使用常量池中的效果
    // 如果常量池中的 effect 或 permanentEffect 是 undefined 或空对象，则使用传入的值
    // 如果传入的值也是 undefined，则返回 undefined（不返回空对象）
    const constantsEffect = itemFromConstants.effect;
    const constantsPermanentEffect = itemFromConstants.permanentEffect;

    // 检查常量池中的 effect 是否有效（不是 undefined 且不是空对象）
    const hasValidConstantsEffect = constantsEffect !== undefined &&
      constantsEffect !== null &&
      Object.keys(constantsEffect || {}).length > 0;

    // 检查常量池中的 permanentEffect 是否有效（不是 undefined 且不是空对象）
    const hasValidConstantsPermanentEffect = constantsPermanentEffect !== undefined &&
      constantsPermanentEffect !== null &&
      Object.keys(constantsPermanentEffect || {}).length > 0;

    return {
      effect: hasValidConstantsEffect
        ? constantsEffect
        : aiEffect,
      permanentEffect: hasValidConstantsPermanentEffect
        ? constantsPermanentEffect
        : aiPermanentEffect,
    };
  }

  const knownItem = KNOWN_ITEM_EFFECTS[itemName];
  if (knownItem) {
    // 如果物品在已知列表中，使用预定义的效果
    // 如果已知列表中没有定义，则使用传入的值
    return {
      effect: knownItem.effect !== undefined
        ? knownItem.effect
        : aiEffect,
      permanentEffect: knownItem.permanentEffect !== undefined
        ? knownItem.permanentEffect
        : aiPermanentEffect,
    };
  }

  // 直接使用提供的效果，不做任何调整
  return {
    effect: aiEffect,
    permanentEffect: aiPermanentEffect,
  };
};

// 根据物品名称和描述推断物品类型和装备槽位
export const inferItemTypeAndSlot = (
  name: string,
  currentType: ItemType,
  description: string,
  currentIsEquippable?: boolean
): {
  type: ItemType;
  isEquippable: boolean;
  equipmentSlot?: EquipmentSlot;
} => {
  const nameLower = name.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = nameLower + descLower;

  const weaponKeywords =
    /剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首|短剑|长剑|重剑|飞剑|灵剑|仙剑|裂空剑|青莲剑|紫霄剑|玄天剑|青云剑|精铁剑|玄冰剑|宝剑/;

  const rules: Array<{
    match: RegExp;
    exclude?: RegExp;
    type: ItemType;
    isEquippable: boolean;
    slot?: EquipmentSlot | EquipmentSlot[];
  }> = [
    { match: weaponKeywords, type: ItemType.Weapon, isEquippable: true, slot: EquipmentSlot.Weapon },
    {
      match: /头盔|头冠|道冠|法冠|仙冠|龙冠|凤冠|冠|帽|发簪|发带|头饰|面罩|头|首/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Head,
    },
    {
      match: /肩|裘|披风|斗篷|肩甲|护肩|肩饰|肩胛|云肩|法肩|仙肩/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Shoulder,
    },
    {
      match: /戒指|指环|戒/,
      type: ItemType.Ring,
      isEquippable: true,
      slot: [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4],
    },
    {
      match: /项链|玉佩|手镯|手链|吊坠|护符|佩|饰|腰佩|腰坠/,
      exclude: /手套|护手|手甲|法宝|法器|仙器|神器|灵器|灵宝/, // 避免手套和法宝被误判
      type: ItemType.Accessory,
      isEquippable: true,
      slot: [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2],
    },
    {
      match: /手套|护手|手甲|拳套|法手|仙手|龙爪套/,
      exclude: /手镯|手链/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Gloves,
    },
    {
      match: /靴|鞋|足|步|履|仙履|云履|龙鳞靴|战靴|法靴/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Boots,
    },
    {
      match: /裤|腿甲|护腿|下装|法裤|仙裤|龙鳞裤|腿/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Legs,
    },
    {
      match: /草药|药草|灵草|仙草|草|花|果|叶|根|茎|枝|胆草|解毒|疗伤|恢复|治疗|回血|回蓝|回灵|回气/,
      exclude: /草甲|草衣|草帽|草鞋|丹|丸|散|液|膏|剂/, // 排除丹药关键词，避免误判（如"回血丹"）
      type: ItemType.Herb,
      isEquippable: false,
    },
    {
      // 丹方判断必须在丹药判断之前（优先级更高）
      match: /丹方|配方|炼制方法|炼药|炼丹.*方法|炼制.*方法|配方.*丹/,
      type: ItemType.Recipe,
      isEquippable: false,
    },
    {
      match: /丹药|丹|丸|散|液|膏|剂|药|灵丹|仙丹/,
      exclude: /丹方|配方/, // 排除丹方关键词，避免误判
      type: ItemType.Pill,
      isEquippable: false,
    },
    {
      match: /材料|矿物|矿石|晶石|灵石|铁|铜|银|金|木|石|骨|皮|角|鳞|羽|毛|丝|线|布|纸/,
      type: ItemType.Material,
      isEquippable: false,
    },
    {
      match: /道袍|法衣|胸甲|护胸|铠甲|战甲|法袍|长袍|外衣|护甲|重甲|轻甲|板甲|锁甲|软甲|硬甲|袍|衣/,
      exclude: /胆草|草药|药草|灵草|仙草/,
      type: ItemType.Armor,
      isEquippable: true,
      slot: EquipmentSlot.Chest,
    },
    {
      match: /法宝|法器|仙器|神器|灵器|灵宝|鼎|钟|镜|塔|扇|珠|印|盘|笔|袋|旗|炉|图|符箓|灵符|仙符|神符|法符|兽符/,
      exclude: weaponKeywords,
      type: ItemType.Artifact,
      isEquippable: true,
      slot: [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2],
    },
  ];

  // 如果当前类型已经是明确的装备类型，优先保持类型，只推断槽位
  const normalized = normalizeTypeHint(currentType) || currentType;
  const isKnownEquipmentType = [
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Artifact,
    ItemType.Ring,
    ItemType.Accessory,
  ].includes(normalized as ItemType);

  // 如果当前类型是明确的装备类型，且isEquippable为true，优先保持类型
  if (isKnownEquipmentType && (currentIsEquippable || normalized === ItemType.Artifact || normalized === ItemType.Weapon || normalized === ItemType.Armor || normalized === ItemType.Ring || normalized === ItemType.Accessory)) {
    // 只推断槽位，不改变类型
    switch (normalized) {
      case ItemType.Weapon:
        return { type: ItemType.Weapon, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon };
      case ItemType.Armor:
        // 尝试推断具体部位
        for (const rule of rules) {
          if (rule.type === ItemType.Armor && rule.slot && rule.match.test(combined)) {
            if (!rule.exclude || !rule.exclude.test(combined)) {
              const slot = Array.isArray(rule.slot) ? stablePickSlot(nameLower, rule.slot) : rule.slot;
              return { type: ItemType.Armor, isEquippable: true, equipmentSlot: slot };
            }
          }
        }
        return { type: ItemType.Armor, isEquippable: true, equipmentSlot: EquipmentSlot.Chest };
      case ItemType.Artifact:
        return {
          type: ItemType.Artifact,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2]),
        };
      case ItemType.Ring:
        return {
          type: ItemType.Ring,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4]),
        };
      case ItemType.Accessory:
        return {
          type: ItemType.Accessory,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2]),
        };
    }
  }

  // 规则化的优先级匹配（仅在类型不明确时使用）
  for (const rule of rules) {
    if (rule.exclude && rule.exclude.test(combined)) continue;
    if (rule.match.test(combined)) {
      const slot = Array.isArray(rule.slot) ? stablePickSlot(nameLower, rule.slot) : rule.slot;
      return {
        type: rule.type,
        isEquippable: rule.isEquippable,
        equipmentSlot: rule.isEquippable ? slot : undefined,
      };
    }
  }

  // 使用规范化的类型提示作兜底（如果上面的逻辑都没有匹配到）
  if (currentIsEquippable || isKnownEquipmentType) {
    switch (normalized) {
      case ItemType.Weapon:
        return { type: ItemType.Weapon, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon };
      case ItemType.Armor:
        return { type: ItemType.Armor, isEquippable: true, equipmentSlot: EquipmentSlot.Chest };
      case ItemType.Artifact:
        return {
          type: ItemType.Artifact,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2]),
        };
      case ItemType.Ring:
        return {
          type: ItemType.Ring,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4]),
        };
      case ItemType.Accessory:
        return {
          type: ItemType.Accessory,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2]),
        };
      default:
        break;
    }
  }

  const fallbackType = (normalized || currentType || ItemType.Material) as ItemType;

  return {
    type: fallbackType,
    isEquippable: currentIsEquippable || false,
  };
};

/**
 * 根据境界获取装备数值的基础倍数
 * 用于平衡不同境界的装备数值，确保装备与玩家境界匹配
 */
export const getRealmEquipmentMultiplier = (realm: RealmType, realmLevel: number): number => {
  const realmIndex = REALM_ORDER.indexOf(realm);
  // 如果境界索引无效，使用默认值（炼气期，索引0）
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
  // 优化后的基础倍数：降低增长幅度，防止数值膨胀
  // 从 [1, 2, 4, 6, 10, 16, 32] 改为 [1, 1.5, 2.5, 4, 6, 10, 16]
  // 这样最高倍数从32倍降低到16倍，与境界属性增长（5倍）更匹配
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmBaseMultiplier = realmBaseMultipliers[validRealmIndex] || 1;
  // 境界等级加成：每级增加8%（进一步降低增长）
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  return realmBaseMultiplier * levelMultiplier;
};

/**
 * 根据境界调整装备数值
 * 确保装备数值与玩家当前境界匹配，避免数值过高或过低
 * 根据稀有度和境界基础属性计算合理的装备数值范围
 */
export const adjustEquipmentStatsByRealm = (
  effect: Item['effect'],
  realm: RealmType,
  realmLevel: number,
  rarity: ItemRarity = '普通'
): Item['effect'] | undefined => {
  if (!effect) return effect;

  const realmIndex = REALM_ORDER.indexOf(realm);
  // 获取当前境界的基础属性值作为参考
  const realmData = REALM_DATA[realm];
  // 如果境界数据不存在，使用炼气期作为默认值
  if (!realmData) {
    const defaultRealmData = REALM_DATA[RealmType.QiRefining];
    if (!defaultRealmData) {
      // 如果连默认值都没有，直接返回原效果（防止崩溃）
      return effect;
    }
    return adjustEquipmentStatsByRealm(effect, RealmType.QiRefining, realmLevel, rarity);
  }
  const baseAttack = realmData.baseAttack;
  const baseDefense = realmData.baseDefense;
  const baseMaxHp = realmData.baseMaxHp;
  const baseSpirit = realmData.baseSpirit;
  const basePhysique = realmData.basePhysique;
  const baseSpeed = realmData.baseSpeed;

  // 使用共享的装备数值配置
  const percentage = EQUIPMENT_RARITY_PERCENTAGES[rarity] || EQUIPMENT_RARITY_PERCENTAGES['普通'];
  // 使用中值作为基准
  const targetPercentage = (percentage.min + percentage.max) / 2;

  // 境界等级加成：每级增加5%
  const levelMultiplier = 1 + (realmLevel - 1) * 0.05;

  // 优化后的境界指数增长倍数：与装备倍数函数保持一致，防止数值膨胀
  // 从 [1, 2, 4, 8, 16, 32, 64] 改为 [1, 1.5, 2.5, 4, 6, 10, 16]
  // 这样最高倍数从64倍降低到16倍，与境界属性增长（5倍）更匹配
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmMultiplier = realmBaseMultipliers[realmIndex] || 1;

  const adjusted: Item['effect'] = {};

  // 属性映射表，减少重复代码
  const attributeMap: Array<{
    key: keyof Item['effect'];
    baseValue: number;
  }> = [
    { key: 'attack', baseValue: baseAttack },
    { key: 'defense', baseValue: baseDefense },
    { key: 'hp', baseValue: baseMaxHp },
    { key: 'spirit', baseValue: baseSpirit },
    { key: 'physique', baseValue: basePhysique },
    { key: 'speed', baseValue: baseSpeed },
  ];

  // 获取该稀有度的最小属性保底值
  const minStats = EQUIPMENT_MIN_STATS[rarity] || EQUIPMENT_MIN_STATS['普通'];

  // 统一处理所有属性
  attributeMap.forEach(({ key, baseValue }) => {
    const value = effect[key];
    if (value !== undefined && typeof value === 'number') {
      // 目标值 = 基础属性 × 稀有度百分比 × 境界等级加成 × 境界倍数
      const targetValue = Math.floor(baseValue * targetPercentage * levelMultiplier * realmMultiplier);
      const maxValue = Math.floor(baseValue * percentage.max * levelMultiplier * realmMultiplier);

      // 计算调整后的属性值
      let adjustedValue = value * realmMultiplier;

      // 确保装备属性至少达到目标值的80%
      adjustedValue = Math.max(adjustedValue, targetValue * 0.8);

      // 应用稀有度保底值：确保高品质装备至少有对应的最小属性值
      // 这对于低境界玩家获得高品质装备时特别重要
      const minStatValue = minStats[key as keyof typeof minStats];
      if (minStatValue !== undefined) {
        adjustedValue = Math.max(adjustedValue, minStatValue);
      }

      // 最高不超过最大值
      adjusted[key] = Math.min(adjustedValue, maxValue);
    }
  });
  if (effect.exp !== undefined) {
    adjusted.exp = effect.exp; // exp不受境界调整影响
  }
  if (effect.lifespan !== undefined) {
    adjusted.lifespan = effect.lifespan; // 寿命不受境界调整影响
  }

  return adjusted;
};

/**
 * 根据境界调整物品效果（通用函数，适用于所有物品类型）
 * 对于装备，使用专门的 adjustEquipmentStatsByRealm
 * 对于其他物品（丹药、草药等），根据境界进行倍数调整
 */
export const adjustItemStatsByRealm = (
  effect: Item['effect'],
  permanentEffect: Item['permanentEffect'],
  realm: RealmType,
  realmLevel: number,
  itemType: ItemType,
  rarity: ItemRarity = '普通'
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } => {
  // 装备类型使用专门的调整函数
  const isEquipment = itemType === ItemType.Weapon ||
                      itemType === ItemType.Armor ||
                      itemType === ItemType.Accessory ||
                      itemType === ItemType.Ring ||
                      itemType === ItemType.Artifact;

  if (isEquipment && effect) {
    const adjustedEffect = adjustEquipmentStatsByRealm(effect, realm, realmLevel, rarity);
    return { effect: adjustedEffect, permanentEffect: undefined };
  }

  // 非装备物品：根据境界进行倍数调整
  const realmIndex = REALM_ORDER.indexOf(realm);
  // 优化后的境界倍数：与装备调整函数保持一致，防止数值膨胀
  // 从 [1, 2, 4, 8, 16, 20, 25] 改为 [1, 1.5, 2.5, 4, 6, 10, 16]
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmMultiplier = realmBaseMultipliers[realmIndex] || 1;
  // 降低层数加成：从10%降低到8%，与装备调整保持一致
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  const totalMultiplier = realmMultiplier * levelMultiplier;

  const adjustedEffect: Item['effect'] = {};
  const adjustedPermanentEffect: Item['permanentEffect'] = {};

  // 调整临时效果
  if (effect) {
    if (effect.attack !== undefined) adjustedEffect.attack = Math.floor(effect.attack * totalMultiplier);
    if (effect.defense !== undefined) adjustedEffect.defense = Math.floor(effect.defense * totalMultiplier);
    if (effect.hp !== undefined) adjustedEffect.hp = Math.floor(effect.hp * totalMultiplier);
    if (effect.spirit !== undefined) adjustedEffect.spirit = Math.floor(effect.spirit * totalMultiplier);
    if (effect.physique !== undefined) adjustedEffect.physique = Math.floor(effect.physique * totalMultiplier);
    if (effect.speed !== undefined) adjustedEffect.speed = Math.floor(effect.speed * totalMultiplier);
    if (effect.exp !== undefined) adjustedEffect.exp = Math.floor(effect.exp * totalMultiplier);
    // 寿命不受境界调整影响
    if (effect.lifespan !== undefined) adjustedEffect.lifespan = effect.lifespan;
  }

  // 调整永久效果
  if (permanentEffect) {
    if (permanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(permanentEffect.attack * totalMultiplier);
    if (permanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(permanentEffect.defense * totalMultiplier);
    if (permanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(permanentEffect.spirit * totalMultiplier);
    if (permanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(permanentEffect.physique * totalMultiplier);
    if (permanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(permanentEffect.speed * totalMultiplier);
    if (permanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(permanentEffect.maxHp * totalMultiplier);
    // 最大寿命不受境界调整影响
    if (permanentEffect.maxLifespan !== undefined) adjustedPermanentEffect.maxLifespan = permanentEffect.maxLifespan;

    if (permanentEffect.spiritualRoots) {
      adjustedPermanentEffect.spiritualRoots = {};
      const roots = permanentEffect.spiritualRoots;
      if (roots.metal !== undefined) adjustedPermanentEffect.spiritualRoots.metal = Math.floor(roots.metal * totalMultiplier);
      if (roots.wood !== undefined) adjustedPermanentEffect.spiritualRoots.wood = Math.floor(roots.wood * totalMultiplier);
      if (roots.water !== undefined) adjustedPermanentEffect.spiritualRoots.water = Math.floor(roots.water * totalMultiplier);
      if (roots.fire !== undefined) adjustedPermanentEffect.spiritualRoots.fire = Math.floor(roots.fire * totalMultiplier);
      if (roots.earth !== undefined) adjustedPermanentEffect.spiritualRoots.earth = Math.floor(roots.earth * totalMultiplier);
    }
  }

  return {
    effect: Object.keys(adjustedEffect).length > 0 ? adjustedEffect : effect,
    permanentEffect: Object.keys(adjustedPermanentEffect).length > 0 ? adjustedPermanentEffect : permanentEffect,
  };
};

/**
 * Helper to calculate item stats
 * 注意：装备数值已经考虑了稀有度，这里不再应用RARITY_MULTIPLIERS
 * 只应用本命法宝的额外加成
 */
export const getItemStats = (item: Item, isNatal: boolean = false) => {
  // 本命法宝额外50%加成
  const natalMultiplier = isNatal ? 1.5 : 1;

  return {
    attack: item.effect?.attack
      ? Math.floor(item.effect.attack * natalMultiplier)
      : 0,
    defense: item.effect?.defense
      ? Math.floor(item.effect.defense * natalMultiplier)
      : 0,
    hp: item.effect?.hp
      ? Math.floor(item.effect.hp * natalMultiplier)
      : 0,
    exp: item.effect?.exp || 0, // exp 不受倍率影响
    spirit: item.effect?.spirit
      ? Math.floor(item.effect.spirit * natalMultiplier)
      : 0,
    physique: item.effect?.physique
      ? Math.floor(item.effect.physique * natalMultiplier)
      : 0,
    speed: item.effect?.speed
      ? Math.floor(item.effect.speed * natalMultiplier)
      : 0,
  };
};


// 生成属性预览文本
export const generateAttributePreview = (effect: Item['effect']): string => {
  if (!effect) return '';
  const attrs: string[] = [];
  if (effect.attack) attrs.push(`攻+${effect.attack}`);
  if (effect.defense) attrs.push(`防+${effect.defense}`);
  if (effect.hp) attrs.push(`血+${effect.hp}`);
  if (effect.spirit) attrs.push(`神识+${effect.spirit}`);
  if (effect.physique) attrs.push(`体魄+${effect.physique}`);
  if (effect.speed) attrs.push(`速度+${effect.speed}`);
  if(effect.exp) attrs.push(`修为+${effect.exp}`);
  if(effect.lifespan) attrs.push(`寿命+${effect.lifespan}`);
  return attrs.length > 0 ? ` [${attrs.join(' ')}]` : '';
};

// 计算物品出售价格
export const calculateItemSellPrice = (item: Item): number => {
  const rarity = item.rarity || '普通';
  const level = item.level || 0;

  // 基础价格（根据稀有度）
  const basePrices: Record<ItemRarity, number> = {
    普通: 10,
    稀有: 50,
    传说: 300,
    仙品: 2000,
  };
  // 确保 basePrice 有默认值，防止 undefined
  let basePrice = basePrices[rarity] || 10;

  // 计算属性价值
  let attributeValue = 0;
  // 确保 rarityMultiplier 有默认值，防止 undefined
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;

  // 临时效果价值（effect）
  if (item.effect) {
    const effect = item.effect;
    attributeValue += (effect.attack || 0) * 2; // 攻击力每点值2灵石
    attributeValue += (effect.defense || 0) * 1.5; // 防御力每点值1.5灵石
    attributeValue += (effect.hp || 0) * 0.5; // 气血每点值0.5灵石
    attributeValue += (effect.spirit || 0) * 1.5; // 神识每点值1.5灵石
    attributeValue += (effect.physique || 0) * 1.5; // 体魄每点值1.5灵石
    attributeValue += (effect.speed || 0) * 2; // 速度每点值2灵石
    attributeValue += (effect.exp || 0) * 0.1; // 修为每点值0.1灵石（临时效果）
  }

  // 永久效果价值（permanentEffect，更值钱）
  if (item.permanentEffect) {
    const permEffect = item.permanentEffect;
    attributeValue += (permEffect.attack || 0) * 10; // 永久攻击每点值10灵石
    attributeValue += (permEffect.defense || 0) * 8; // 永久防御每点值8灵石
    attributeValue += (permEffect.maxHp || 0) * 3; // 永久气血上限每点值3灵石
    attributeValue += (permEffect.spirit || 0) * 8; // 永久神识每点值8灵石
    attributeValue += (permEffect.physique || 0) * 8; // 永久体魄每点值8灵石
    attributeValue += (permEffect.speed || 0) * 10; // 永久速度每点值10灵石
  }

  // 应用稀有度倍率到属性价值（确保不是 NaN）
  attributeValue = Math.floor((attributeValue || 0) * (rarityMultiplier || 1));

  // 装备类物品额外价值加成
  let equipmentBonus = 0;
  if (item.isEquippable) {
    // 装备类物品根据类型有不同的基础价值
    switch (item.type) {
      case ItemType.Weapon:
        equipmentBonus = (basePrice || 0) * 1.5; // 武器额外50%价值
        break;
      case ItemType.Armor:
        equipmentBonus = (basePrice || 0) * 1.2; // 护甲额外20%价值
        break;
      case ItemType.Artifact:
        equipmentBonus = (basePrice || 0) * 2; // 法宝额外100%价值
        break;
      case ItemType.Ring:
      case ItemType.Accessory:
        equipmentBonus = (basePrice || 0) * 1.3; // 戒指和首饰额外30%价值
        break;
    }
  }

  // 强化等级加成（每级增加20%价值）
  const levelMultiplier = 1 + (level || 0) * 0.2;

  // 计算最终价格（确保所有值都是数字）
  const totalValue =
    ((basePrice || 0) + (attributeValue || 0) + (equipmentBonus || 0)) * (levelMultiplier || 1);

  // 根据物品类型调整（消耗品价值较低）
  let typeMultiplier = 1;
  if (item.type === ItemType.Herb || item.type === ItemType.Pill) {
    typeMultiplier = 0.5; // 消耗品价值减半
  } else if (item.type === ItemType.Material) {
    typeMultiplier = 0.3; // 材料价值更低
  }

  // 最终价格（取整，最低为1，确保不是 NaN）
  const finalPrice = Math.max(1, Math.floor((totalValue || 0) * (typeMultiplier || 1)));
  // 如果计算结果仍然是 NaN，返回默认值
  return isNaN(finalPrice) ? 1 : finalPrice;
};
