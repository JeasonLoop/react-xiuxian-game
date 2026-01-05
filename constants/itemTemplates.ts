/**
 * 物品模板系统
 * 包含装备、丹药、草药、材料的基础模板
 * 每种物品类型每个品级各10件，共计160件
 */

import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';
import { EQUIPMENT_MIN_STATS } from '../utils/itemUtils';

// 名称生成词库
const NAME_COMPONENTS = {
  // 材质词（普通）
  commonMaterials: ['精铁', '青钢', '木制', '铁制', '铜制', '石制', '骨制', '藤制', '竹制', '布', '皮', '麻', '草', '棉'],
  // 材质词（稀有）
  rareMaterials: ['寒光', '烈火', '冰霜', '雷霆', '紫金', '龙鳞', '凤羽', '青云', '星辰', '玄铁', '精钢', '玄冰', '金刚', '云纹'],
  // 材质词（传说）
  legendaryMaterials: ['青莲', '紫霄', '裂空', '破天', '斩龙', '开山', '震天', '追风', '定海', '射日', '真龙', '凤凰', '玄武', '白虎', '麒麟', '九尾', '三足金乌', '四象', '五行', '八卦'],
  // 材质词（仙品）
  immortalMaterials: ['诛仙', '灭魔', '弑神', '破虚', '开天', '镇世', '缚龙', '定天', '射月', '斩道', '九天', '十地', '万古', '不朽', '永恒', '不灭', '无上', '至尊', '至圣', '至神'],

  // 武器类型
  weaponTypes: ['剑', '刀', '枪', '戟', '斧', '锤', '鞭', '棍', '矛', '弓', '弩', '匕首', '短剑', '长剑', '重剑', '飞剑', '灵剑', '仙剑'],
  // 护甲类型
  armorTypes: ['甲', '袍', '衣', '护甲', '战甲', '铠甲', '道袍', '法袍', '宝甲', '神甲', '战衣', '法衣', '仙衣', '道衣'],
  // 护甲部位（按槽位顺序：头部、肩部、胸甲、手套、裤腿、鞋子）
  armorParts: {
    head: ['头盔', '头冠', '道冠', '法冠', '仙冠', '龙冠', '凤冠', '帽', '发簪', '发带', '头饰', '面罩'],
    shoulder: ['护肩', '肩甲', '肩饰', '肩胛', '云肩', '法肩', '仙肩', '披风', '斗篷'],
    chest: ['胸甲', '护胸', '铠甲', '战甲', '法袍', '道袍', '长袍', '外衣', '护甲', '重甲', '轻甲', '板甲', '锁甲', '软甲', '硬甲'],
    gloves: ['手套', '护手', '手甲', '拳套', '法手', '仙手', '龙爪套'],
    legs: ['护腿', '腿甲', '裤', '下装', '法裤', '仙裤', '龙鳞裤'],
    boots: ['战靴', '法靴', '草鞋', '布鞋', '靴', '鞋', '仙履', '云履', '龙鳞靴'],
  },
  // 饰品类型
  accessoryTypes: ['玉佩', '手镯', '项链', '护符', '吊坠', '手链', '腰佩', '发带', '护腕', '脚环', '玉珏', '灵珠', '法印', '宝鉴'],
  // 戒指类型
  ringTypes: ['指环', '戒指', '宝戒', '灵戒', '玉戒', '金戒', '银戒', '法戒', '玄戒', '圣戒'],
  // 法宝类型
  artifactTypes: ['葫芦', '宝塔', '钟', '镜', '扇', '印', '珠', '鼎', '旗', '符', '笔', '图', '盘', '袋'],

  // 丹药效果词
  pillEffects: ['聚气', '回血', '强体', '凝神', '回春', '增智', '提速', '护魂', '保命', '筑基', '洗髓', '破境', '凝魂', '强魄', '增灵', '回灵', '回元', '固本', '培元', '养神'],
  // 丹药大小前缀
  pillSizePrefixes: {
    普通: ['小'],
    稀有: ['中', '精'],
    传说: ['大', '上'],
    仙品: ['仙', '神', '天'],
  },

  // 草药效果词
  herbEffects: ['止血', '聚灵', '回气', '凝神', '血参', '紫猴', '天灵', '龙鳞', '凤羽', '星辰', '回春', '强体', '增智', '护魂', '保命', '固本', '培元', '养神', '凝魂', '强魄'],
  // 草药类型
  herbTypes: ['草', '花', '果', '参', '芝', '根', '叶', '枝', '茎', '籽'],
  // 草药稀有度前缀
  herbRarityPrefixes: {
    普通: [],
    稀有: ['灵'],
    传说: ['仙', '千年', '万年'],
    仙品: ['神', '万年', '亿年'],
  },

  // 材料类型
  materialTypes: ['锭', '片', '晶', '玉', '石', '沙', '粉', '块', '条', '核', '丝', '线', '粒', '珠', '丸'],
  // 材料基础词
  materialBases: ['精铁', '铜', '木', '石', '骨', '藤', '草', '布', '皮革', '竹', '灵晶', '灵玉', '神铁', '仙金', '龙血', '凤羽', '龙鳞'],
  // 材料稀有度前缀
  materialRarityPrefixes: {
    普通: [],
    稀有: ['灵'],
    传说: ['仙', '精炼'],
    仙品: ['神', '精炼', '纯化'],
  },
};

/**
 * 生成武器名称
 */
function generateWeaponName(rarity: ItemRarity, index: number): string {
  const materials =
    rarity === '普通' ? NAME_COMPONENTS.commonMaterials :
    rarity === '稀有' ? NAME_COMPONENTS.rareMaterials :
    rarity === '传说' ? NAME_COMPONENTS.legendaryMaterials :
    NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];
  const weaponType = NAME_COMPONENTS.weaponTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.weaponTypes.length];

  return `${material}${weaponType}`;
}

/**
 * 生成护甲名称
 * @param rarity 稀有度
 * @param index 索引
 * @param slot 装备槽位（可选，如果提供则根据槽位生成对应的部位名称）
 */
function generateArmorName(rarity: ItemRarity, index: number, slot?: EquipmentSlot): string {
  const materials =
    rarity === '普通' ? NAME_COMPONENTS.commonMaterials :
    rarity === '稀有' ? NAME_COMPONENTS.rareMaterials :
    rarity === '传说' ? NAME_COMPONENTS.legendaryMaterials :
    NAME_COMPONENTS.immortalMaterials;

  const material = materials[index % materials.length];

  // 如果提供了槽位，根据槽位生成对应的部位名称
  if (slot) {
    const slotPartsMap: Partial<Record<EquipmentSlot, string[]>> = {
      [EquipmentSlot.Head]: NAME_COMPONENTS.armorParts.head,
      [EquipmentSlot.Shoulder]: NAME_COMPONENTS.armorParts.shoulder,
      [EquipmentSlot.Chest]: NAME_COMPONENTS.armorParts.chest,
      [EquipmentSlot.Gloves]: NAME_COMPONENTS.armorParts.gloves,
      [EquipmentSlot.Legs]: NAME_COMPONENTS.armorParts.legs,
      [EquipmentSlot.Boots]: NAME_COMPONENTS.armorParts.boots,
    };

    const parts = slotPartsMap[slot];
    if (parts && parts.length > 0) {
      const partIndex = Math.floor(index / materials.length) % parts.length;
      return `${material}${parts[partIndex]}`;
    }
  }

  // 如果没有提供槽位，使用原来的逻辑（兼容性）
  // 根据索引决定使用类型还是部位
  if (index % 2 === 0) {
    const armorType = NAME_COMPONENTS.armorTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.armorTypes.length];
    return `${material}${armorType}`;
  } else {
    // 从所有部位中随机选择（保持向后兼容）
    const allParts = [
      ...NAME_COMPONENTS.armorParts.head,
      ...NAME_COMPONENTS.armorParts.shoulder,
      ...NAME_COMPONENTS.armorParts.chest,
      ...NAME_COMPONENTS.armorParts.gloves,
      ...NAME_COMPONENTS.armorParts.legs,
      ...NAME_COMPONENTS.armorParts.boots,
    ];
    const armorPart = allParts[Math.floor(index / materials.length) % allParts.length];
    return `${material}${armorPart}`;
  }
}

/**
 * 生成饰品名称
 */
function generateAccessoryName(rarity: ItemRarity, index: number): string {
  if (rarity === '普通') {
    const materials = NAME_COMPONENTS.commonMaterials;
    const accessoryType = NAME_COMPONENTS.accessoryTypes[index % NAME_COMPONENTS.accessoryTypes.length];
    const material = materials[Math.floor(index / NAME_COMPONENTS.accessoryTypes.length) % materials.length];
    return `${material}制${accessoryType}`;
  } else {
    const materials =
      rarity === '稀有' ? NAME_COMPONENTS.rareMaterials :
      rarity === '传说' ? NAME_COMPONENTS.legendaryMaterials :
      NAME_COMPONENTS.immortalMaterials;

    const material = materials[index % materials.length];
    const accessoryType = NAME_COMPONENTS.accessoryTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.accessoryTypes.length];
    return `${material}${accessoryType}`;
  }
}

/**
 * 生成戒指名称
 */
function generateRingName(rarity: ItemRarity, index: number): string {
  if (rarity === '普通') {
    const materials = NAME_COMPONENTS.commonMaterials;
    const ringType = NAME_COMPONENTS.ringTypes[index % NAME_COMPONENTS.ringTypes.length];
    const material = materials[Math.floor(index / NAME_COMPONENTS.ringTypes.length) % materials.length];
    return `${material}${ringType}`;
  } else if (rarity === '稀有') {
    const effects = ['灵', '法', '护体', '聚灵', '凝神', '回气', '强体', '增智', '提速', '护魂'];
    const effect = effects[index % effects.length];
    return `${effect}戒`;
  } else {
    const materials =
      rarity === '传说' ? NAME_COMPONENTS.legendaryMaterials :
      NAME_COMPONENTS.immortalMaterials;

    const material = materials[index % materials.length];
    return `${material}戒`;
  }
}

/**
 * 生成法宝名称
 */
function generateArtifactName(rarity: ItemRarity, index: number): string {
  if (rarity === '普通') {
    const materials = NAME_COMPONENTS.commonMaterials;
    const artifactType = NAME_COMPONENTS.artifactTypes[index % NAME_COMPONENTS.artifactTypes.length];
    const material = materials[Math.floor(index / NAME_COMPONENTS.artifactTypes.length) % materials.length];
    return `${material}制${artifactType}`;
  } else if (rarity === '稀有') {
    const effects = ['灵', '护身', '聚灵', '凝神', '回气', '强体', '增智', '提速', '护魂', '保命'];
    const effect = effects[index % effects.length];
    const artifactType = NAME_COMPONENTS.artifactTypes[Math.floor(index / effects.length) % NAME_COMPONENTS.artifactTypes.length];
    return `${effect}${artifactType}`;
  } else {
    const materials =
      rarity === '传说' ? NAME_COMPONENTS.legendaryMaterials :
      NAME_COMPONENTS.immortalMaterials;

    const material = materials[index % materials.length];
    const artifactType = NAME_COMPONENTS.artifactTypes[Math.floor(index / materials.length) % NAME_COMPONENTS.artifactTypes.length];
    return `${material}${artifactType}`;
  }
}

/**
 * 生成丹药名称
 */
function generatePillName(rarity: ItemRarity, index: number): string {
  const effect = NAME_COMPONENTS.pillEffects[index % NAME_COMPONENTS.pillEffects.length];
  const sizePrefixes = NAME_COMPONENTS.pillSizePrefixes[rarity];
  const sizePrefix = sizePrefixes[index % sizePrefixes.length];
  return `${sizePrefix}${effect}丹`;
}

/**
 * 生成草药名称
 */
function generateHerbName(rarity: ItemRarity, index: number): string {
  const effect = NAME_COMPONENTS.herbEffects[index % NAME_COMPONENTS.herbEffects.length];
  const herbType = NAME_COMPONENTS.herbTypes[Math.floor(index / NAME_COMPONENTS.herbEffects.length) % NAME_COMPONENTS.herbTypes.length];
  const rarityPrefixes = NAME_COMPONENTS.herbRarityPrefixes[rarity];
  const rarityPrefix = rarityPrefixes.length > 0 ? rarityPrefixes[index % rarityPrefixes.length] : '';
  return `${rarityPrefix}${effect}${herbType}`;
}

/**
 * 生成材料名称
 */
function generateMaterialName(rarity: ItemRarity, index: number): string {
  const materialBase = NAME_COMPONENTS.materialBases[index % NAME_COMPONENTS.materialBases.length];
  const materialType = NAME_COMPONENTS.materialTypes[Math.floor(index / NAME_COMPONENTS.materialBases.length) % NAME_COMPONENTS.materialTypes.length];
  const rarityPrefixes = NAME_COMPONENTS.materialRarityPrefixes[rarity];
  const rarityPrefix = rarityPrefixes.length > 0 ? rarityPrefixes[index % rarityPrefixes.length] : '';
  return `${rarityPrefix}${materialBase}${materialType}`;
}

// 品级对应的属性倍率
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  普通: 1,
  稀有: 1.5,
  传说: 2.5,
  仙品: 6.0,
};

// 装备槽位类型
type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'ring' | 'artifact';

/**
 * 生成装备名称（使用规则生成，避免拼凑）
 * @param type 装备类型
 * @param rarity 稀有度
 * @param index 索引
 * @param slot 装备槽位（可选，仅对护甲有效）
 */
function generateEquipmentName(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number,
  slot?: EquipmentSlot
): string {
  switch (type) {
    case 'weapon':
      return generateWeaponName(rarity, index);
    case 'armor':
      return generateArmorName(rarity, index, slot);
    case 'accessory':
      return generateAccessoryName(rarity, index);
    case 'ring':
      return generateRingName(rarity, index);
    case 'artifact':
      return generateArtifactName(rarity, index);
    default:
      return '未知装备';
  }
}

/**
 * 生成装备基础属性
 * 先应用保底值（EQUIPMENT_MIN_STATS），然后在此基础上进行调整
 */
function generateEquipmentStats(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number
): Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 5; // 基础值随索引增加

  // 获取该稀有度的保底属性
  const minStats = EQUIPMENT_MIN_STATS[rarity];

  const stats: Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> = {};

  switch (type) {
    case 'weapon': {
      // 武器：先应用保底值，然后在此基础上进行调整
      const baseAttack = minStats.attack + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * 0.3 * (1 + Math.random() * 0.5));

      // 确保不低于保底值
      stats.attack = Math.max(baseAttack, minStats.attack);
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      break;
    }
    case 'armor': {
      // 护甲：先应用保底值，然后在此基础上进行调整
      const baseDefense = minStats.defense + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      const basePhysique = minStats.physique + Math.floor(baseValue * multiplier * 0.2 * (1 + Math.random() * 0.5));

      // 确保不低于保底值
      stats.defense = Math.max(baseDefense, minStats.defense);
      stats.hp = Math.max(baseHp, minStats.hp);
      stats.physique = Math.max(basePhysique, minStats.physique);
      break;
    }
    case 'accessory':
    case 'ring': {
      // 饰品/戒指：先应用保底值，然后在此基础上进行调整
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      const baseSpeed = minStats.speed + Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.4 * (1 + Math.random() * 0.5));

      // 确保不低于保底值
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      stats.speed = Math.max(baseSpeed, minStats.speed);
      stats.hp = Math.max(baseHp, minStats.hp);
      break;
    }
    case 'artifact': {
      // 法宝：先应用保底值，然后在此基础上进行调整
      const baseAttack = minStats.attack + Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      const baseDefense = minStats.defense + Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      const baseSpirit = minStats.spirit + Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      const baseHp = minStats.hp + Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));

      // 确保不低于保底值
      stats.attack = Math.max(baseAttack, minStats.attack);
      stats.defense = Math.max(baseDefense, minStats.defense);
      stats.spirit = Math.max(baseSpirit, minStats.spirit);
      stats.hp = Math.max(baseHp, minStats.hp);
      break;
    }
  }

  return stats;
}

/**
 * 生成装备描述
 */
function generateEquipmentDescription(
  type: EquipmentType,
  name: string,
  rarity: ItemRarity,
  index: number
): string {
  // 根据装备类型和稀有度生成不同的描述
  const weaponDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的兵器，虽然材质一般，但经过精心打磨，依然锋利。',
      '常见的武器，适合初学者使用，能够提供基础的战斗能力。',
      '凡铁打造，虽然平凡，但在熟练者手中也能发挥不俗的威力。',
      '基础的战斗兵器，朴实无华却实用可靠。',
      '普通的兵器，虽然威力有限，但胜在价格便宜，适合大量装备。',
      '常见的武器，制作工艺简单，适合日常使用。',
      '基础的战斗兵器，虽然平凡，但在关键时刻也能派上用场。',
      '普通的兵器，蕴含着微弱的灵气，适合初学者使用。',
      '常见的武器，虽然品质不高，但胜在容易获得。',
      '基础的战斗兵器，朴实耐用，是修士的常备武器。',
    ],
    稀有: [
      '精工打造的利器，剑身闪烁着寒光，削铁如泥。',
      '经过特殊工艺锻造的兵器，蕴含着微弱的灵气，威力不俗。',
      '上等材料制成的武器，锋芒毕露，令人心生敬畏。',
      '精心淬炼的兵器，剑身流转着淡淡的光华，锋利异常。',
      '精工打造的利器，每一道纹路都经过精心雕琢，威力强大。',
      '经过特殊工艺锻造的兵器，炼制时加入了珍贵的辅助材料。',
      '上等材料制成的武器，表面流转着淡淡的光泽，一看便知品质不凡。',
      '精心淬炼的兵器，蕴含着强大的力量，是修士梦寐以求的武器。',
      '精工打造的利器，炼制工艺精湛，威力远超普通武器。',
      '经过特殊工艺锻造的兵器，每一击都蕴含着强大的威力。',
    ],
    传说: [
      '传说中的神兵利器，剑身缠绕着强大的灵力，剑气纵横。',
      '上古流传的至宝，蕴含着无上威能，可斩断一切阻碍。',
      '历经无数战斗的传奇兵器，每一道痕迹都诉说着曾经的辉煌。',
      '天地灵气凝聚而成的神兵，出鞘时天地为之变色。',
      '传说中的神兵利器，炼制工艺已经失传，每一把都珍贵无比。',
      '上古流传的至宝，每一击都蕴含着大道之力，威力惊人。',
      '历经无数战斗的传奇兵器，虽然有些磨损，但依然威力强大。',
      '天地灵气凝聚而成的神兵，表面流转着五彩光华，一看便知是稀世珍宝。',
      '传说中的神兵利器，每一把都蕴含着无上威能，是无数修士梦寐以求的宝物。',
      '上古流传的至宝，每一击都足以改变战局，威力无穷。',
    ],
    仙品: [
      '仙灵所铸的无上神兵，蕴含着大道之力，可诛仙灭魔。',
      '开天辟地时诞生的至宝，拥有毁天灭地的恐怖威能。',
      '传说中的仙器，每一击都蕴含着天地法则，威力无穷。',
      '超越凡尘的仙兵，剑出如龙吟，可斩断因果轮回。',
      '仙灵所铸的无上神兵，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '开天辟地时诞生的至宝，每一击都蕴含着大道真意，威力无穷。',
      '传说中的仙器，炼制时融入了仙人之力，威力强大到足以改变命运。',
      '超越凡尘的仙兵，每一把都是天地间的至宝，珍贵无比。',
      '仙灵所铸的无上神兵，每一击都足以毁天灭地，是无数修士终其一生也难以获得的宝物。',
      '开天辟地时诞生的至宝，拥有无上威能，可斩断一切因果，接近成仙。',
    ],
  };

  const armorDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的护甲，虽然防御力有限，但聊胜于无。',
      '基础的防护装备，能够抵挡一些轻微的伤害。',
      '常见的防具，材质普通，但制作精良，提供基础防护。',
      '凡间常见的护甲，朴实耐用，适合日常使用。',
      '普通的护甲，虽然防御力一般，但胜在价格便宜，适合大量装备。',
      '基础的防护装备，制作工艺简单，适合初学者使用。',
      '常见的防具，虽然品质不高，但在关键时刻也能派上用场。',
      '凡间常见的护甲，蕴含着微弱的灵气，适合日常防护。',
      '普通的护甲，虽然平凡，但胜在容易获得。',
      '基础的防护装备，朴实耐用，是修士的常备防具。',
    ],
    稀有: [
      '精心制作的护甲，防御力强劲，能够有效抵御攻击。',
      '上等材料制成的防具，表面流转着淡淡的光泽，防护不俗。',
      '经过特殊工艺处理的护甲，质地坚韧，防御力出众。',
      '宗门弟子常用的道袍，不仅防御力强，还蕴含着微弱的灵气。',
      '精心制作的护甲，每一片甲片都经过精心打磨，防御力强大。',
      '上等材料制成的防具，炼制时加入了珍贵的辅助材料。',
      '经过特殊工艺处理的护甲，表面流转着淡淡的光华，一看便知品质不凡。',
      '宗门弟子常用的道袍，蕴含着强大的防护之力，是修士梦寐以求的防具。',
      '精心制作的护甲，炼制工艺精湛，防御力远超普通护甲。',
      '上等材料制成的防具，每一片都蕴含着强大的防护力量。',
    ],
    传说: [
      '传说中的护甲，用珍稀材料打造，防御力极强，可抵御大部分攻击。',
      '上古流传的宝甲，每一片甲片都蕴含着强大的防护之力。',
      '用真龙鳞片或凤凰羽毛制成的护甲，轻盈而坚固，防御力惊人。',
      '历经无数战斗的传奇护甲，虽然有些破损，但依然坚不可摧。',
      '传说中的护甲，炼制工艺已经失传，每一件都珍贵无比。',
      '上古流传的宝甲，每一片都蕴含着大道之力，防御力惊人。',
      '用真龙鳞片或凤凰羽毛制成的护甲，虽然有些磨损，但依然威力强大。',
      '历经无数战斗的传奇护甲，表面流转着五彩光华，一看便知是稀世珍宝。',
      '传说中的护甲，每一件都蕴含着无上威能，是无数修士梦寐以求的宝物。',
      '上古流传的宝甲，每一片都足以抵御大部分攻击，防御力无穷。',
    ],
    仙品: [
      '仙灵所制的无上道袍，蕴含着大道之力，防御力惊人，几乎可抵御一切攻击。',
      '传说中的仙甲，每一丝都蕴含着天地法则，可抵挡仙人之力。',
      '超越凡尘的仙衣，轻盈如羽却坚不可摧，蕴含着无上仙力。',
      '开天辟地时诞生的至宝护甲，拥有绝对防御，可抵御一切伤害。',
      '仙灵所制的无上道袍，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙甲，每一丝都蕴含着大道真意，防御力无穷。',
      '超越凡尘的仙衣，炼制时融入了仙人之力，防御力强大到足以改变命运。',
      '开天辟地时诞生的至宝护甲，每一件都是天地间的至宝，珍贵无比。',
      '仙灵所制的无上道袍，每一件都足以抵御一切攻击，是无数修士终其一生也难以获得的宝物。',
      '开天辟地时诞生的至宝护甲，拥有无上威能，可抵御一切伤害，接近成仙。',
    ],
  };

  const accessoryDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的饰品，虽然效果微弱，但也能提供一些帮助。',
      '常见的配饰，制作简单，但蕴含着微弱的灵气。',
      '基础的饰品，能够略微提升佩戴者的能力。',
      '凡间常见的配饰，虽然平凡，但制作精良。',
      '普通的饰品，虽然效果一般，但胜在价格便宜，适合大量使用。',
      '常见的配饰，制作工艺简单，适合初学者使用。',
      '基础的饰品，虽然品质不高，但在关键时刻也能派上用场。',
      '凡间常见的配饰，蕴含着微弱的灵气，适合日常使用。',
      '普通的饰品，虽然平凡，但胜在容易获得。',
      '基础的配饰，朴实耐用，是修士的常备物品。',
    ],
    稀有: [
      '精心制作的饰品，蕴含着浓郁的灵气，能够显著提升佩戴者的能力。',
      '上等材料制成的配饰，表面流转着淡淡的光华，效果不俗。',
      '宗门弟子常用的饰品，不仅美观，还能提升修炼效率。',
      '经过特殊工艺处理的饰品，蕴含着强大的辅助之力。',
      '精心制作的饰品，每一道纹路都经过精心雕琢，效果强大。',
      '上等材料制成的配饰，炼制时加入了珍贵的辅助材料。',
      '宗门弟子常用的饰品，表面流转着淡淡的光泽，一看便知品质不凡。',
      '经过特殊工艺处理的饰品，蕴含着强大的力量，是修士梦寐以求的宝物。',
      '精心制作的饰品，炼制工艺精湛，效果远超普通饰品。',
      '上等材料制成的配饰，每一件都蕴含着强大的辅助力量。',
    ],
    传说: [
      '传说中的宝物，蕴含着强大的力量，能够大幅提升佩戴者的各项能力。',
      '上古流传的至宝，每一丝都蕴含着无上威能，效果惊人。',
      '天地灵气凝聚而成的神物，佩戴后可获得强大的加持。',
      '历经无数岁月的传奇饰品，虽然有些磨损，但依然威力强大。',
      '传说中的宝物，炼制工艺已经失传，每一件都珍贵无比。',
      '上古流传的至宝，每一丝都蕴含着大道之力，效果惊人。',
      '天地灵气凝聚而成的神物，虽然有些磨损，但依然威力强大。',
      '历经无数岁月的传奇饰品，表面流转着五彩光华，一看便知是稀世珍宝。',
      '传说中的宝物，每一件都蕴含着无上威能，是无数修士梦寐以求的宝物。',
      '上古流传的至宝，每一丝都足以大幅提升佩戴者的能力，效果无穷。',
    ],
    仙品: [
      '仙灵所制的无上宝物，蕴含着大道之力，可大幅提升佩戴者的所有能力。',
      '传说中的仙器，每一丝都蕴含着天地法则，效果惊人。',
      '超越凡尘的仙物，佩戴后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运。',
      '仙灵所制的无上宝物，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙器，每一丝都蕴含着大道真意，效果无穷。',
      '超越凡尘的仙物，炼制时融入了仙人之力，效果强大到足以改变命运。',
      '开天辟地时诞生的至宝，每一件都是天地间的至宝，珍贵无比。',
      '仙灵所制的无上宝物，每一件都足以大幅提升佩戴者的所有能力，是无数修士终其一生也难以获得的宝物。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运，接近成仙。',
    ],
  };

  const ringDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的戒指，虽然效果微弱，但也能提供一些属性加成。',
      '常见的指环，制作简单，但蕴含着微弱的灵气。',
      '基础的戒指，能够略微提升佩戴者的能力。',
      '凡间常见的戒指，虽然平凡，但制作精良。',
      '普通的戒指，虽然效果一般，但胜在价格便宜，适合大量使用。',
      '常见的指环，制作工艺简单，适合初学者使用。',
      '基础的戒指，虽然品质不高，但在关键时刻也能派上用场。',
      '凡间常见的戒指，蕴含着微弱的灵气，适合日常使用。',
      '普通的戒指，虽然平凡，但胜在容易获得。',
      '基础的指环，朴实耐用，是修士的常备物品。',
    ],
    稀有: [
      '精心制作的戒指，蕴含着浓郁的灵气，能够显著提升佩戴者的能力。',
      '上等材料制成的指环，表面流转着淡淡的光华，效果不俗。',
      '宗门弟子常用的戒指，不仅美观，还能提升修炼效率。',
      '经过特殊工艺处理的戒指，蕴含着强大的辅助之力。',
      '精心制作的戒指，每一道纹路都经过精心雕琢，效果强大。',
      '上等材料制成的指环，炼制时加入了珍贵的辅助材料。',
      '宗门弟子常用的戒指，表面流转着淡淡的光泽，一看便知品质不凡。',
      '经过特殊工艺处理的戒指，蕴含着强大的力量，是修士梦寐以求的宝物。',
      '精心制作的戒指，炼制工艺精湛，效果远超普通戒指。',
      '上等材料制成的指环，每一件都蕴含着强大的辅助力量。',
    ],
    传说: [
      '传说中的宝戒，蕴含着强大的力量，能够大幅提升佩戴者的各项能力。',
      '上古流传的至宝，每一道纹路都蕴含着无上威能，效果惊人。',
      '天地灵气凝聚而成的神戒，佩戴后可获得强大的加持。',
      '历经无数岁月的传奇戒指，虽然有些磨损，但依然威力强大。',
      '传说中的宝戒，炼制工艺已经失传，每一件都珍贵无比。',
      '上古流传的至宝，每一道纹路都蕴含着大道之力，效果惊人。',
      '天地灵气凝聚而成的神戒，虽然有些磨损，但依然威力强大。',
      '历经无数岁月的传奇戒指，表面流转着五彩光华，一看便知是稀世珍宝。',
      '传说中的宝戒，每一件都蕴含着无上威能，是无数修士梦寐以求的宝物。',
      '上古流传的至宝，每一道纹路都足以大幅提升佩戴者的能力，效果无穷。',
    ],
    仙品: [
      '仙灵所制的无上宝戒，蕴含着大道之力，可大幅提升佩戴者的所有能力。',
      '传说中的仙戒，每一道纹路都蕴含着天地法则，效果惊人。',
      '超越凡尘的仙物，佩戴后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运。',
      '仙灵所制的无上宝戒，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙戒，每一道纹路都蕴含着大道真意，效果无穷。',
      '超越凡尘的仙物，炼制时融入了仙人之力，效果强大到足以改变命运。',
      '开天辟地时诞生的至宝，每一件都是天地间的至宝，珍贵无比。',
      '仙灵所制的无上宝戒，每一件都足以大幅提升佩戴者的所有能力，是无数修士终其一生也难以获得的宝物。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运，接近成仙。',
    ],
  };

  const artifactDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的法宝，虽然威力有限，但也能在战斗中提供一些帮助。',
      '基础的宝物，蕴含着微弱的灵气，适合初学者使用。',
      '常见的法宝，制作简单，但功能实用。',
      '凡间常见的宝物，虽然平凡，但制作精良。',
      '普通的法宝，虽然效果一般，但胜在价格便宜，适合大量使用。',
      '基础的宝物，制作工艺简单，适合初学者使用。',
      '常见的法宝，虽然品质不高，但在关键时刻也能派上用场。',
      '凡间常见的宝物，蕴含着微弱的灵气，适合日常使用。',
      '普通的法宝，虽然平凡，但胜在容易获得。',
      '基础的宝物，朴实耐用，是修士的常备物品。',
    ],
    稀有: [
      '精心炼制的法宝，蕴含着浓郁的灵气，威力不俗。',
      '上等材料制成的宝物，表面流转着淡淡的光华，效果出众。',
      '宗门弟子常用的法宝，不仅实用，还能提升战斗能力。',
      '经过特殊工艺处理的宝物，蕴含着强大的辅助之力。',
      '精心炼制的法宝，每一道纹路都经过精心雕琢，威力强大。',
      '上等材料制成的宝物，炼制时加入了珍贵的辅助材料。',
      '宗门弟子常用的法宝，表面流转着淡淡的光泽，一看便知品质不凡。',
      '经过特殊工艺处理的宝物，蕴含着强大的力量，是修士梦寐以求的宝物。',
      '精心炼制的法宝，炼制工艺精湛，威力远超普通法宝。',
      '上等材料制成的宝物，每一件都蕴含着强大的辅助力量。',
    ],
    传说: [
      '传说中的至宝，蕴含着强大的力量，能够大幅提升使用者的战斗能力。',
      '上古流传的神物，每一丝都蕴含着无上威能，威力惊人。',
      '天地灵气凝聚而成的法宝，使用后可获得强大的加持。',
      '历经无数战斗的传奇宝物，虽然有些磨损，但依然威力强大。',
      '传说中的至宝，炼制工艺已经失传，每一件都珍贵无比。',
      '上古流传的神物，每一丝都蕴含着大道之力，威力惊人。',
      '天地灵气凝聚而成的法宝，虽然有些磨损，但依然威力强大。',
      '历经无数战斗的传奇宝物，表面流转着五彩光华，一看便知是稀世珍宝。',
      '传说中的至宝，每一件都蕴含着无上威能，是无数修士梦寐以求的宝物。',
      '上古流传的神物，每一丝都足以大幅提升使用者的战斗能力，威力无穷。',
    ],
    仙品: [
      '仙灵所制的无上至宝，蕴含着大道之力，可大幅提升使用者的所有能力。',
      '传说中的仙器，每一丝都蕴含着天地法则，威力无穷。',
      '超越凡尘的仙物，使用后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可镇压万物。',
      '仙灵所制的无上至宝，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙器，每一丝都蕴含着大道真意，威力无穷。',
      '超越凡尘的仙物，炼制时融入了仙人之力，威力强大到足以改变命运。',
      '开天辟地时诞生的至宝，每一件都是天地间的至宝，珍贵无比。',
      '仙灵所制的无上至宝，每一件都足以大幅提升使用者的所有能力，是无数修士终其一生也难以获得的宝物。',
      '开天辟地时诞生的至宝，拥有无上威能，可镇压万物，接近成仙。',
    ],
  };

  const descriptionMap: Record<EquipmentType, Record<ItemRarity, string[]>> = {
    weapon: weaponDescriptions,
    armor: armorDescriptions,
    accessory: accessoryDescriptions,
    ring: ringDescriptions,
    artifact: artifactDescriptions,
  };

  const descriptions = descriptionMap[type][rarity];
  return descriptions[index % descriptions.length];
}

/**
 * 生成装备模板
 */
function generateEquipmentTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  // 装备类型和对应的 ItemType 和 EquipmentSlot
  const equipmentTypes: Array<{
    type: EquipmentType;
    itemType: ItemType;
    slots: EquipmentSlot[];
  }> = [
    { type: 'weapon', itemType: ItemType.Weapon, slots: [EquipmentSlot.Weapon] },
    { type: 'armor', itemType: ItemType.Armor, slots: [EquipmentSlot.Head, EquipmentSlot.Shoulder, EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Legs, EquipmentSlot.Boots] },
    { type: 'accessory', itemType: ItemType.Accessory, slots: [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2] },
    { type: 'ring', itemType: ItemType.Ring, slots: [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4] },
    { type: 'artifact', itemType: ItemType.Artifact, slots: [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2] },
  ];

  let idCounter = 1;

  equipmentTypes.forEach(({ type, itemType, slots }) => {
    rarities.forEach(rarity => {
      for (let i = 0; i < 10; i++) {
        const slot = slots[i % slots.length];
        // 先确定槽位，然后根据槽位生成名称（确保名称和槽位对应）
        const name = generateEquipmentName(type, rarity, i, slot);
        const stats = generateEquipmentStats(type, rarity, i);

        items.push({
          id: `equip-${type}-${rarity}-${i + 1}`,
          name,
          type: itemType,
          description: generateEquipmentDescription(type, name, rarity, i),
          quantity: 1,
          rarity,
          level: 0,
          isEquippable: true,
          equipmentSlot: slot,
          effect: stats,
        });

        idCounter++;
      }
    });
  });

  return items;
}

// generatePillName 已在上面定义

/**
 * 生成丹药属性
 */
function generatePillStats(
  rarity: ItemRarity,
  index: number
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 10;

  // 随机选择效果类型
  const effectType = index % 4;

  switch (effectType) {
    case 0: // 增加修为
      return {
        effect: { exp: Math.floor(baseValue * multiplier) },
      };
    case 1: // 恢复气血
      return {
        effect: { hp: Math.floor(baseValue * multiplier * 2) },
      };
    case 2: // 永久增加属性
      return {
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.3),
          physique: Math.floor(baseValue * multiplier * 0.3),
        },
      };
    case 3: // 混合效果
      return {
        effect: { exp: Math.floor(baseValue * multiplier * 0.5), hp: Math.floor(baseValue * multiplier) },
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.2),
        },
      };
  }
}

/**
 * 生成丹药描述
 */
function generatePillDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    普通: [
      '一颗普通的丹药，虽然品质一般，但也能提供基础的修炼辅助。',
      '常见的丹药，炼制简单，适合初学者使用，能够略微提升修为。',
      '凡间常见的丹药，虽然效果有限，但胜在容易获得。',
      '基础的丹药，朴实无华却实用可靠，是修炼路上的好帮手。',
      '普通的丹药，散发着淡淡的药香，服用后能感受到微弱的灵气流动。',
      '常见的丹药，虽然品质不高，但在关键时刻也能派上用场。',
      '基础的丹药，炼制工艺简单，适合日常修炼使用。',
      '普通的丹药，虽然效果一般，但胜在价格便宜，适合大量使用。',
      '常见的丹药，能够提供基础的修炼辅助，是修士的常备物品。',
      '基础的丹药，虽然平凡，但在熟练的炼丹师手中也能发挥不错的效果。',
    ],
    稀有: [
      '一颗精心炼制的丹药，散发着浓郁的灵气，服用后能够显著提升修为。',
      '上等品质的丹药，炼制工艺精湛，蕴含着强大的药力，效果出众。',
      '经过特殊手法炼制的丹药，药力温和而持久，适合长期服用。',
      '宗门弟子常用的丹药，不仅效果显著，还能提升修炼效率。',
      '精心调配的丹药，各种药材完美融合，散发出诱人的药香。',
      '上等丹药，炼制时加入了珍贵的辅助材料，药力更加强大。',
      '经过多次提纯的丹药，杂质极少，药力纯净而强大。',
      '精心炼制的丹药，表面流转着淡淡的光华，一看便知品质不凡。',
      '上等品质的丹药，服用后能够感受到体内灵气的明显增长。',
      '精心调配的丹药，药力温和，适合各种境界的修士使用。',
    ],
    传说: [
      '传说中的神丹，蕴含着强大的力量，服用后能够大幅提升修为和各项能力。',
      '上古流传的至宝丹药，每一颗都蕴含着无上威能，效果惊人。',
      '天地灵气凝聚而成的神丹，炼制工艺已经失传，每一颗都珍贵无比。',
      '历经无数岁月保存下来的传奇丹药，虽然有些年代，但药力依然强大。',
      '传说中的丹药，炼制时加入了多种珍稀材料，药力强大到令人震撼。',
      '上古流传的神丹，每一颗都蕴含着大道之力，服用后能够获得强大的加持。',
      '天地灵气凝聚而成的至宝，炼制工艺极其复杂，效果远超普通丹药。',
      '传说中的神丹，表面流转着五彩光华，一看便知是稀世珍宝。',
      '上古流传的至宝，服用后能够感受到体内发生翻天覆地的变化。',
      '传说中的丹药，每一颗都蕴含着无上威能，是无数修士梦寐以求的宝物。',
    ],
    仙品: [
      '仙灵所制的无上神丹，蕴含着大道之力，服用后能够获得仙人之力加持。',
      '传说中的仙丹，每一颗都蕴含着天地法则，效果惊人，可改变修士的命运。',
      '超越凡尘的仙物，炼制工艺已经达到登峰造极的境界，药力无穷。',
      '开天辟地时诞生的至宝丹药，拥有无上威能，可大幅提升使用者的所有能力。',
      '仙灵所制的神丹，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙丹，每一颗都蕴含着大道真意，服用后能够领悟天地法则。',
      '超越凡尘的至宝，炼制时融入了仙人之力，药力强大到足以改变命运。',
      '仙灵所制的无上神丹，服用后能够感受到体内发生脱胎换骨的变化。',
      '传说中的仙丹，每一颗都是天地间的至宝，是无数修士终其一生也难以获得的宝物。',
      '超越凡尘的仙物，蕴含着无上仙力，服用后能够获得仙人之力，接近成仙。',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * 生成丹药模板
 */
function generatePillTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generatePillName(rarity, i);
      const stats = generatePillStats(rarity, i);

      items.push({
        id: `pill-${rarity}-${i + 1}`,
        name,
        type: ItemType.Pill,
        description: generatePillDescription(rarity, i, name),
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

// generateHerbName 已在上面定义

/**
 * 生成草药属性
 */
function generateHerbStats(
  rarity: ItemRarity,
  index: number
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 5;

  // 随机选择效果类型
  const effectType = index % 3;

  switch (effectType) {
    case 0: // 恢复气血
      return {
        effect: { hp: Math.floor(baseValue * multiplier) },
      };
    case 1: // 增加修为
      return {
        effect: { exp: Math.floor(baseValue * multiplier * 0.3) },
      };
    case 2: // 永久增加属性
      return {
        permanentEffect: {
          spirit: Math.floor(baseValue * multiplier * 0.2),
          physique: Math.floor(baseValue * multiplier * 0.2),
          maxHp: Math.floor(baseValue * multiplier * 0.5),
        },
      };
  }
}

/**
 * 生成草药描述
 */
function generateHerbDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    普通: [
      '一株普通的草药，虽然灵气稀薄，但也能提供基础的疗伤效果。',
      '常见的草药，生长在普通的山林中，虽然平凡但实用。',
      '基础的草药，采摘容易，是修士常用的疗伤材料。',
      '普通的草药，散发着淡淡的清香，虽然效果有限但胜在容易获得。',
      '常见的草药，虽然品质一般，但在关键时刻也能派上用场。',
      '基础的草药，朴实无华却实用可靠，是炼丹的基础材料。',
      '普通的草药，蕴含着微弱的灵气，适合炼制基础丹药。',
      '常见的草药，虽然效果一般，但胜在价格便宜，适合大量使用。',
      '基础的草药，能够提供基础的疗伤和修炼辅助。',
      '普通的草药，虽然平凡，但在熟练的炼丹师手中也能发挥不错的效果。',
    ],
    稀有: [
      '一株精心培育的灵草，散发着浓郁的灵气，是炼制上等丹药的重要材料。',
      '上等品质的草药，生长在灵气充沛的地方，蕴含着强大的药力。',
      '经过特殊培育的灵草，药力温和而持久，适合炼制高品质丹药。',
      '宗门药园中精心培育的草药，不仅药力强大，还能提升丹药品质。',
      '精心挑选的灵草，各种药性完美融合，散发出诱人的药香。',
      '上等草药，生长时吸收了大量的天地灵气，药力更加强大。',
      '经过特殊手法培育的灵草，杂质极少，药力纯净而强大。',
      '精心培育的草药，表面流转着淡淡的光华，一看便知品质不凡。',
      '上等品质的灵草，蕴含着强大的药力，是炼制稀有丹药的必备材料。',
      '精心培育的草药，药力温和，适合炼制各种类型的丹药。',
    ],
    传说: [
      '传说中的神草，蕴含着强大的力量，是炼制神丹的珍贵材料。',
      '上古流传的至宝草药，每一株都蕴含着无上威能，珍贵无比。',
      '天地灵气凝聚而成的神草，生长在极其罕见的地方，每一株都珍贵无比。',
      '历经无数岁月保存下来的传奇草药，虽然有些年代，但药力依然强大。',
      '传说中的神草，生长时吸收了多种珍稀灵气，药力强大到令人震撼。',
      '上古流传的神草，每一株都蕴含着大道之力，是炼制至宝丹药的必备材料。',
      '天地灵气凝聚而成的至宝，生长环境极其苛刻，效果远超普通草药。',
      '传说中的神草，表面流转着五彩光华，一看便知是稀世珍宝。',
      '上古流传的至宝，每一株都蕴含着无上威能，是无数炼丹师梦寐以求的宝物。',
      '传说中的神草，每一株都是天地间的至宝，是炼制神丹的珍贵材料。',
    ],
    仙品: [
      '仙灵所培育的无上神草，蕴含着大道之力，是炼制仙丹的珍贵材料。',
      '传说中的仙草，每一株都蕴含着天地法则，珍贵无比，可改变炼丹师的命运。',
      '超越凡尘的仙物，生长在仙界，蕴含着无上仙力，药力无穷。',
      '开天辟地时诞生的至宝草药，拥有无上威能，是炼制仙丹的必备材料。',
      '仙灵所培育的神草，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙草，每一株都蕴含着大道真意，是炼制仙丹的珍贵材料。',
      '超越凡尘的至宝，生长时融入了仙人之力，药力强大到足以改变命运。',
      '仙灵所培育的无上神草，每一株都是天地间的至宝，珍贵无比。',
      '传说中的仙草，每一株都是无数炼丹师终其一生也难以获得的宝物。',
      '超越凡尘的仙物，蕴含着无上仙力，是炼制仙丹的珍贵材料，接近成仙。',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * 生成草药模板
 */
function generateHerbTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generateHerbName(rarity, i);
      const stats = generateHerbStats(rarity, i);

      items.push({
        id: `herb-${rarity}-${i + 1}`,
        name,
        type: ItemType.Herb,
        description: generateHerbDescription(rarity, i, name),
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

// generateMaterialName 已在上面定义

/**
 * 生成材料描述
 */
function generateMaterialDescription(rarity: ItemRarity, index: number, name: string): string {
  const descriptions: Record<ItemRarity, string[]> = {
    普通: [
      '一块普通的材料，虽然品质一般，但也能用于基础的炼器和炼丹。',
      '常见的材料，容易获得，适合炼制基础装备和丹药。',
      '基础的炼器材料，朴实无华却实用可靠，是炼器师常用的原料。',
      '普通的材料，虽然效果有限，但胜在价格便宜，适合大量使用。',
      '常见的材料，虽然品质不高，但在炼制基础物品时也能派上用场。',
      '基础的炼器材料，炼制工艺简单，适合初学者使用。',
      '普通的材料，蕴含着微弱的灵气，适合炼制基础装备。',
      '常见的材料，虽然效果一般，但胜在容易获得，适合日常使用。',
      '基础的炼器材料，能够提供基础的炼制辅助，是炼器师的常备物品。',
      '普通的材料，虽然平凡，但在熟练的炼器师手中也能发挥不错的效果。',
    ],
    稀有: [
      '一块精心提炼的材料，散发着浓郁的灵气，是炼制上等装备的重要原料。',
      '上等品质的材料，提炼工艺精湛，蕴含着强大的灵性，效果出众。',
      '经过特殊手法提炼的材料，灵性温和而持久，适合炼制高品质装备。',
      '宗门炼器师常用的材料，不仅灵性强大，还能提升装备品质。',
      '精心提炼的材料，各种属性完美融合，散发出诱人的灵光。',
      '上等材料，提炼时加入了珍贵的辅助材料，灵性更加强大。',
      '经过多次提纯的材料，杂质极少，灵性纯净而强大。',
      '精心提炼的材料，表面流转着淡淡的光华，一看便知品质不凡。',
      '上等品质的材料，蕴含着强大的灵性，是炼制稀有装备的必备原料。',
      '精心提炼的材料，灵性温和，适合炼制各种类型的装备。',
    ],
    传说: [
      '传说中的神材，蕴含着强大的力量，是炼制神器的珍贵原料。',
      '上古流传的至宝材料，每一块都蕴含着无上威能，珍贵无比。',
      '天地灵气凝聚而成的神材，提炼工艺已经失传，每一块都珍贵无比。',
      '历经无数岁月保存下来的传奇材料，虽然有些年代，但灵性依然强大。',
      '传说中的神材，提炼时加入了多种珍稀材料，灵性强大到令人震撼。',
      '上古流传的神材，每一块都蕴含着大道之力，是炼制至宝装备的必备材料。',
      '天地灵气凝聚而成的至宝，提炼工艺极其复杂，效果远超普通材料。',
      '传说中的神材，表面流转着五彩光华，一看便知是稀世珍宝。',
      '上古流传的至宝，每一块都蕴含着无上威能，是无数炼器师梦寐以求的宝物。',
      '传说中的神材，每一块都是天地间的至宝，是炼制神器的珍贵原料。',
    ],
    仙品: [
      '仙灵所提炼的无上神材，蕴含着大道之力，是炼制仙器的珍贵原料。',
      '传说中的仙材，每一块都蕴含着天地法则，珍贵无比，可改变炼器师的命运。',
      '超越凡尘的仙物，提炼工艺已经达到登峰造极的境界，灵性无穷。',
      '开天辟地时诞生的至宝材料，拥有无上威能，是炼制仙器的必备原料。',
      '仙灵所提炼的神材，表面流转着仙光，散发着令人心旷神怡的仙气。',
      '传说中的仙材，每一块都蕴含着大道真意，是炼制仙器的珍贵原料。',
      '超越凡尘的至宝，提炼时融入了仙人之力，灵性强大到足以改变命运。',
      '仙灵所提炼的无上神材，每一块都是天地间的至宝，珍贵无比。',
      '传说中的仙材，每一块都是无数炼器师终其一生也难以获得的宝物。',
      '超越凡尘的仙物，蕴含着无上仙力，是炼制仙器的珍贵原料，接近成仙。',
    ],
  };

  const descList = descriptions[rarity];
  return descList[index % descList.length];
}

/**
 * 生成材料模板
 */
function generateMaterialTemplates(): Item[] {
  const items: Item[] = [];
  const rarities: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

  rarities.forEach(rarity => {
    for (let i = 0; i < 10; i++) {
      const name = generateMaterialName(rarity, i);

      items.push({
        id: `material-${rarity}-${i + 1}`,
        name,
        type: ItemType.Material,
        description: generateMaterialDescription(rarity, i, name),
        quantity: 1,
        rarity,
      });
    }
  });

  return items;
}

/**
 * 生成所有物品模板
 */
export const ITEM_TEMPLATES: Item[] = [
  ...generateEquipmentTemplates(),
  ...generatePillTemplates(),
  ...generateHerbTemplates(),
  ...generateMaterialTemplates(),
];

/**
 * 根据物品类型和稀有度获取物品模板
 */
export function getItemTemplatesByTypeAndRarity(
  type: ItemType,
  rarity: ItemRarity
): Item[] {
  return ITEM_TEMPLATES.filter(
    item => item.type === type && item.rarity === rarity
  );
}

/**
 * 根据物品类型获取物品模板
 */
export function getItemTemplatesByType(type: ItemType): Item[] {
  return ITEM_TEMPLATES.filter(item => item.type === type);
}

/**
 * 根据稀有度获取物品模板
 */
export function getItemTemplatesByRarity(rarity: ItemRarity): Item[] {
  return ITEM_TEMPLATES.filter(item => item.rarity === rarity);
}
