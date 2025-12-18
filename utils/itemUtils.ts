import { Item, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { RARITY_MULTIPLIERS, REALM_ORDER, REALM_DATA } from '../constants';

// 定义物品效果类型（与 Item 接口中的类型保持一致）
type ItemEffect = NonNullable<Item['effect']>;
type ItemPermanentEffect = NonNullable<Item['permanentEffect']>;

// 将常见的类型别称规范化，避免多处硬编码
const normalizeTypeHint = (type?: ItemType | string): ItemType | undefined => {
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

// 稳定的槽位选择：同名物品在任意流程都会落在同一个槽位
const stablePickSlot = (name: string, slots: EquipmentSlot[]) => {
  const hash = Array.from(name).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0) & 0xffffffff, 0);
  return slots[hash % slots.length];
};

// 已知物品的效果映射表（确保描述和实际效果一致）
export const KNOWN_ITEM_EFFECTS: Record<
  string,
  { effect?: ItemEffect; permanentEffect?: ItemPermanentEffect }
> = {
  止血草: { effect: { hp: 20 } },
  聚灵草: { effect: {} },
  回气草: { effect: { hp: 30 } },
  凝神花: { effect: { hp: 50, spirit: 5 } },
  血参: { effect: { hp: 80 } },
  千年灵芝: {
    effect: { hp: 1500 },
    permanentEffect: { maxHp: 200, physique: 100 },
  },
  万年仙草: {
    effect: { hp: 3000 },
    permanentEffect: { maxHp: 500, spirit: 50 },
  },
  回血丹: { effect: { hp: 50 } },
  聚气丹: { effect: { exp: 20 } },
  强体丹: { permanentEffect: { physique: 5 } },
  凝神丹: { permanentEffect: { spirit: 5 } },
  筑基丹: { effect: { exp: 100 } },
  破境丹: { effect: { exp: 200 } },
  仙灵丹: {
    effect: { exp: 500 },
    permanentEffect: { maxHp: 100, physique: 70 },
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
export const normalizeItemEffect = (
  itemName: string,
  aiEffect?: ItemEffect,
  aiPermanentEffect?: ItemPermanentEffect,
  itemType?: ItemType,
  rarity?: ItemRarity
) => {
  const knownItem = KNOWN_ITEM_EFFECTS[itemName];
  if (knownItem) {
    // 如果物品在已知列表中，使用预定义的效果（已知物品已经平衡过，不需要再调整）
    return {
      effect: knownItem.effect || aiEffect || {},
      permanentEffect: knownItem.permanentEffect || aiPermanentEffect || {},
    };
  }

  // 对于AI生成的丹药，根据稀有度调整效果
  if (itemType === ItemType.Pill && rarity && rarity !== '普通') {
    return adjustPillEffectByRarity(aiEffect, aiPermanentEffect, rarity);
  }

  // 否则使用AI生成的效果（其他类型物品）
  return {
    effect: aiEffect || {},
    permanentEffect: aiPermanentEffect || {},
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
      exclude: /草甲|草衣|草帽|草鞋/,
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
  // 基础倍数：根据境界指数增长 [1, 2, 4, 8, 16, 32, 64]
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[validRealmIndex] || 1;
  // 境界等级加成：每级增加10%（更温和的增长）
  const levelMultiplier = 1 + (realmLevel - 1) * 0.1;
  return realmBaseMultiplier * levelMultiplier;
};

/**
 * 根据境界调整装备数值
 * 确保装备数值与玩家当前境界匹配，避免数值过高或过低
 *
 * AI生成的装备数值范围（普通10-30，稀有30-80，传说80-200，仙品200-500）
 * 已经考虑了稀有度，这里根据境界进行缩放，使装备数值与境界匹配
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

  // 根据稀有度确定装备数值占境界基础属性的百分比
  // 普通：5-8%，稀有：8-12%，传说：12-18%，仙品：18-25%
  const rarityPercentages: Record<ItemRarity, { min: number; max: number }> = {
    普通: { min: 0.05, max: 0.08 },
    稀有: { min: 0.08, max: 0.12 },
    传说: { min: 0.12, max: 0.18 },
    仙品: { min: 0.18, max: 0.25 },
  };

  const percentage = rarityPercentages[rarity] || rarityPercentages['普通'];
  // 使用中值作为基准
  const targetPercentage = (percentage.min + percentage.max) / 2;

  // 境界等级加成：每级增加5%
  const levelMultiplier = 1 + (realmLevel - 1) * 0.05;

  const adjusted: Item['effect'] = {};

  if (effect.attack) {
    // 根据境界基础攻击力计算目标数值
    const targetValue = Math.floor(baseAttack * targetPercentage * levelMultiplier);
    // 如果AI生成的数值过高，进行缩放；如果合理，保持原值
    const maxValue = Math.floor(baseAttack * percentage.max * levelMultiplier);
    adjusted.attack = Math.min(Math.max(effect.attack, targetValue * 0.8), maxValue);
  }
  if (effect.defense) {
    const targetValue = Math.floor(baseDefense * targetPercentage * levelMultiplier);
    const maxValue = Math.floor(baseDefense * percentage.max * levelMultiplier);
    adjusted.defense = Math.min(Math.max(effect.defense, targetValue * 0.8), maxValue);
  }
  if (effect.hp) {
    const targetValue = Math.floor(baseMaxHp * targetPercentage * levelMultiplier);
    const maxValue = Math.floor(baseMaxHp * percentage.max * levelMultiplier);
    adjusted.hp = Math.min(Math.max(effect.hp, targetValue * 0.8), maxValue);
  }
  if (effect.spirit) {
    const targetValue = Math.floor(baseSpirit * targetPercentage * levelMultiplier);
    const maxValue = Math.floor(baseSpirit * percentage.max * levelMultiplier);
    adjusted.spirit = Math.min(Math.max(effect.spirit, targetValue * 0.8), maxValue);
  }
  if (effect.physique) {
    const targetValue = Math.floor(basePhysique * targetPercentage * levelMultiplier);
    const maxValue = Math.floor(basePhysique * percentage.max * levelMultiplier);
    adjusted.physique = Math.min(Math.max(effect.physique, targetValue * 0.8), maxValue);
  }
  if (effect.speed) {
    const targetValue = Math.floor(baseSpeed * targetPercentage * levelMultiplier);
    const maxValue = Math.floor(baseSpeed * percentage.max * levelMultiplier);
    adjusted.speed = Math.min(Math.max(effect.speed, targetValue * 0.8), maxValue);
  }
  if (effect.exp !== undefined) {
    adjusted.exp = effect.exp; // exp不受境界调整影响
  }
  if (effect.lifespan !== undefined) {
    adjusted.lifespan = effect.lifespan; // 寿命不受境界调整影响
  }

  return adjusted;
};

/**
 * Helper to calculate item stats
 * 注意：AI生成的装备数值已经考虑了稀有度，这里不再应用RARITY_MULTIPLIERS
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
