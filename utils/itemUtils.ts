import { Item, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { RARITY_MULTIPLIERS, REALM_ORDER, REALM_DATA } from '../constants';

// 定义物品效果类型（与 Item 接口中的类型保持一致）
type ItemEffect = NonNullable<Item['effect']>;
type ItemPermanentEffect = NonNullable<Item['permanentEffect']>;

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

  // 武器类（优先级最高，即使描述中提到"灵器"、"法器"等，只要名称包含武器关键词就是武器）
  // 武器关键词：剑、刀、枪、戟、斧、锤、鞭、棍、棒、矛、弓、弩、匕首等
  if (
    combined.match(
      /剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首|短剑|长剑|重剑|飞剑|灵剑|仙剑|裂空剑|青莲剑|紫霄剑|玄天剑|青云剑|精铁剑|玄冰剑|宝剑/
    )
  ) {
    return {
      type: ItemType.Weapon,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Weapon,
    };
  }

  // 头部装备（优先检查，避免被其他规则误判）
  if (
    combined.match(
      /头盔|头冠|道冠|法冠|仙冠|龙冠|凤冠|冠|帽|发簪|发带|头饰|面罩|头|首/
    )
  ) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Head,
    };
  }

  // 肩部装备
  if (combined.match(/肩|裘|披风|斗篷|肩甲|护肩|肩饰|肩胛|云肩|法肩|仙肩/)) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Shoulder,
    };
  }

  // 手套（优先检查，避免被其他规则误判）
  if (combined.match(/手套|护手|手甲|拳套|法手|仙手|龙爪套|手/)) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Gloves,
    };
  }

  // 鞋子（优先检查，避免被其他规则误判）
  if (combined.match(/靴|鞋|足|步|履|仙履|云履|龙鳞靴|战靴|法靴/)) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Boots,
    };
  }

  // 裤腿
  if (combined.match(/裤|腿甲|护腿|下装|法裤|仙裤|龙鳞裤|腿/)) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Legs,
    };
  }

  // 胸甲装备（放在最后，作为默认护甲类型）
  if (combined.match(/道袍|法衣|胸甲|护胸|铠甲|战甲|法袍|长袍|外衣|甲|袍|衣/)) {
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Chest,
    };
  }

  // 戒指
  if (combined.match(/戒指|指环|戒/)) {
    // 随机分配一个戒指槽位
    const ringSlots = [
      EquipmentSlot.Ring1,
      EquipmentSlot.Ring2,
      EquipmentSlot.Ring3,
      EquipmentSlot.Ring4,
    ];
    return {
      type: ItemType.Ring,
      isEquippable: true,
      equipmentSlot: ringSlots[Math.floor(Math.random() * ringSlots.length)],
    };
  }

  // 首饰（项链、玉佩、手镯等）
  if (combined.match(/项链|玉佩|手镯|手链|吊坠|护符|符|佩|饰/)) {
    const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
    return {
      type: ItemType.Accessory,
      isEquippable: true,
      equipmentSlot:
        accessorySlots[Math.floor(Math.random() * accessorySlots.length)],
    };
  }

  // 法宝（注意：如果名称包含武器关键词，已经在上面被判定为武器了，不会到这里）
  // 法宝关键词：法宝、法器、仙器、神器、鼎、钟、镜、塔、扇、珠、印、盘、笔、袋、旗、炉、图等
  // 注意：斧、锤如果明确是武器（如"开天斧"、"辟地锤"），应该在上面被判定为武器
  // 但如果只是"斧"、"锤"且没有武器特征，可能是法宝类工具
  if (
    combined.match(
      /法宝|法器|仙器|神器|鼎|钟|镜|塔|扇|珠|印|盘|笔|袋|旗|炉|图/
    ) &&
    !combined.match(/剑|刀|枪|戟|鞭|棍|棒|矛|弓|弩|匕首/) // 确保不包含武器关键词
  ) {
    const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
    return {
      type: ItemType.Artifact,
      isEquippable: true,
      equipmentSlot:
        artifactSlots[Math.floor(Math.random() * artifactSlots.length)],
    };
  }

  // 如果当前类型是"防具"等非标准类型，转换为护甲
  if (currentType === ('防具' as any)) {
    // 默认作为胸甲处理
    return {
      type: ItemType.Armor,
      isEquippable: true,
      equipmentSlot: EquipmentSlot.Chest,
    };
  }

  // 保持原有类型，但如果是装备类且没有槽位，尝试推断
  if (currentIsEquippable) {
    if (currentType === ItemType.Armor) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest, // 默认胸甲
      };
    } else if (currentType === ItemType.Weapon) {
      return {
        type: ItemType.Weapon,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon,
      };
    }
  }

  return {
    type: currentType,
    isEquippable: currentIsEquippable || false,
  };
};

/**
 * 根据境界获取装备数值的基础倍数
 * 用于平衡不同境界的装备数值，确保装备与玩家境界匹配
 */
export const getRealmEquipmentMultiplier = (realm: RealmType, realmLevel: number): number => {
  const realmIndex = REALM_ORDER.indexOf(realm);
  // 基础倍数：根据境界指数增长 [1, 2, 4, 8, 16, 32, 64]
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;
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
  let basePrice = basePrices[rarity];

  // 计算属性价值
  let attributeValue = 0;
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

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

  // 应用稀有度倍率到属性价值
  attributeValue = Math.floor(attributeValue * rarityMultiplier);

  // 装备类物品额外价值加成
  let equipmentBonus = 0;
  if (item.isEquippable) {
    // 装备类物品根据类型有不同的基础价值
    switch (item.type) {
      case ItemType.Weapon:
        equipmentBonus = basePrice * 1.5; // 武器额外50%价值
        break;
      case ItemType.Armor:
        equipmentBonus = basePrice * 1.2; // 护甲额外20%价值
        break;
      case ItemType.Artifact:
        equipmentBonus = basePrice * 2; // 法宝额外100%价值
        break;
      case ItemType.Ring:
      case ItemType.Accessory:
        equipmentBonus = basePrice * 1.3; // 戒指和首饰额外30%价值
        break;
    }
  }

  // 强化等级加成（每级增加20%价值）
  const levelMultiplier = 1 + level * 0.2;

  // 计算最终价格
  const totalValue =
    (basePrice + attributeValue + equipmentBonus) * levelMultiplier;

  // 根据物品类型调整（消耗品价值较低）
  let typeMultiplier = 1;
  if (item.type === ItemType.Herb || item.type === ItemType.Pill) {
    typeMultiplier = 0.5; // 消耗品价值减半
  } else if (item.type === ItemType.Material) {
    typeMultiplier = 0.3; // 材料价值更低
  }

  // 最终价格（取整，最低为1）
  return Math.max(1, Math.floor(totalValue * typeMultiplier));
};
