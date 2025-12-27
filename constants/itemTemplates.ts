/**
 * 物品模板系统
 * 包含装备、丹药、草药、材料的基础模板
 * 每种物品类型每个品级各10件，共计160件
 */

import { Item, ItemType, ItemRarity, EquipmentSlot } from '../types';

// 物品名称前缀（用于生成多样化物品名称）
const ITEM_PREFIXES = {
  weapon: ['玄铁', '精钢', '紫金', '寒光', '烈火', '冰霜', '雷霆', '龙鳞', '凤羽', '青云'],
  armor: ['玄铁', '精钢', '龙鳞', '凤羽', '玄冰', '烈火', '星辰', '紫金', '云纹', '金刚'],
  accessory: ['玉佩', '项链', '护符', '玉珏', '项链', '手镯', '玉佩', '灵珠', '法印', '宝鉴'],
  ring: ['指环', '戒指', '宝戒', '灵戒', '玉戒', '金戒', '银戒', '法戒', '玄戒', '圣戒'],
  artifact: ['葫芦', '宝塔', '钟', '镜', '扇', '印', '珠', '鼎', '旗', '符'],
  pill: ['聚', '凝', '筑', '洗', '回', '强', '破', '凝', '仙', '天'],
  herb: ['止血草', '聚灵草', '回气草', '凝神花', '血参', '千年灵芝', '万年仙草', '紫猴花', '天灵果', '龙鳞果'],
  material: ['精铁', '玄铁', '紫金', '龙鳞', '凤羽', '灵晶', '灵玉', '神铁', '仙金', '龙血'],
};

const ITEM_SUFFIXES = {
  weapon: ['剑', '刀', '枪', '戟', '斧', '锤', '鞭', '棍', '矛', '弓'],
  armor: ['甲', '袍', '衣', '护甲', '战甲', '铠甲', '道袍', '法袍', '宝甲', '神甲'],
  accessory: ['', '之力', '之魂', '之韵', '之灵', '之佑', '之护', '之威', '之辉', '之芒'],
  ring: ['之力', '之魂', '之韵', '之灵', '之佑', '之护', '之威', '之辉', '之芒', '之华'],
  artifact: ['', '葫芦', '宝塔', '钟', '镜', '扇', '印', '珠', '鼎', '旗'],
  pill: ['气丹', '神丹', '基丹', '髓丹', '春丹', '体丹', '境丹', '魂丹', '灵丹', '元丹'],
  herb: ['', '花', '果', '芝草', '灵芝', '参', '草', '花', '果', '根'],
  material: ['锭', '片', '晶', '玉', '石', '沙', '粉', '块', '条', '核'],
};

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
 * 生成装备名称
 */
function generateEquipmentName(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number
): string {
  const prefix = ITEM_PREFIXES[type][(index + rarity.length) % ITEM_PREFIXES[type].length];
  const suffix = ITEM_SUFFIXES[type][index % ITEM_SUFFIXES[type].length];

  // 稀有度修饰词
  const rarityPrefixes: Record<ItemRarity, string> = {
    普通: '',
    稀有: '精制',
    传说: '史诗',
    仙品: '神级',
  };

  const rarityPrefix = rarityPrefixes[rarity];
  return rarityPrefix ? `${rarityPrefix}${prefix}${suffix}` : `${prefix}${suffix}`;
}

/**
 * 生成装备基础属性
 */
function generateEquipmentStats(
  type: EquipmentType,
  rarity: ItemRarity,
  index: number
): Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const baseValue = 10 + index * 5; // 基础值随索引增加

  const stats: Pick<Item['effect'], 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'> = {};

  switch (type) {
    case 'weapon':
      stats.attack = Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      stats.spirit = Math.floor(baseValue * multiplier * 0.3 * (1 + Math.random() * 0.5));
      break;
    case 'armor':
      stats.defense = Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      stats.hp = Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      stats.physique = Math.floor(baseValue * multiplier * 0.2 * (1 + Math.random() * 0.5));
      break;
    case 'accessory':
    case 'ring':
      stats.spirit = Math.floor(baseValue * multiplier * 0.8 * (1 + Math.random() * 0.5));
      stats.speed = Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));
      stats.hp = Math.floor(baseValue * multiplier * 0.4 * (1 + Math.random() * 0.5));
      break;
    case 'artifact':
      stats.attack = Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      stats.defense = Math.floor(baseValue * multiplier * 0.5 * (1 + Math.random() * 0.5));
      stats.spirit = Math.floor(baseValue * multiplier * (1 + Math.random() * 0.5));
      stats.hp = Math.floor(baseValue * multiplier * 0.6 * (1 + Math.random() * 0.5));
      break;
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
    ],
    稀有: [
      '精工打造的利器，剑身闪烁着寒光，削铁如泥。',
      '经过特殊工艺锻造的兵器，蕴含着微弱的灵气，威力不俗。',
      '上等材料制成的武器，锋芒毕露，令人心生敬畏。',
      '精心淬炼的兵器，剑身流转着淡淡的光华，锋利异常。',
    ],
    传说: [
      '传说中的神兵利器，剑身缠绕着强大的灵力，剑气纵横。',
      '上古流传的至宝，蕴含着无上威能，可斩断一切阻碍。',
      '历经无数战斗的传奇兵器，每一道痕迹都诉说着曾经的辉煌。',
      '天地灵气凝聚而成的神兵，出鞘时天地为之变色。',
    ],
    仙品: [
      '仙灵所铸的无上神兵，蕴含着大道之力，可诛仙灭魔。',
      '开天辟地时诞生的至宝，拥有毁天灭地的恐怖威能。',
      '传说中的仙器，每一击都蕴含着天地法则，威力无穷。',
      '超越凡尘的仙兵，剑出如龙吟，可斩断因果轮回。',
    ],
  };

  const armorDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的护甲，虽然防御力有限，但聊胜于无。',
      '基础的防护装备，能够抵挡一些轻微的伤害。',
      '常见的防具，材质普通，但制作精良，提供基础防护。',
      '凡间常见的护甲，朴实耐用，适合日常使用。',
    ],
    稀有: [
      '精心制作的护甲，防御力强劲，能够有效抵御攻击。',
      '上等材料制成的防具，表面流转着淡淡的光泽，防护不俗。',
      '经过特殊工艺处理的护甲，质地坚韧，防御力出众。',
      '宗门弟子常用的道袍，不仅防御力强，还蕴含着微弱的灵气。',
    ],
    传说: [
      '传说中的护甲，用珍稀材料打造，防御力极强，可抵御大部分攻击。',
      '上古流传的宝甲，每一片甲片都蕴含着强大的防护之力。',
      '用真龙鳞片或凤凰羽毛制成的护甲，轻盈而坚固，防御力惊人。',
      '历经无数战斗的传奇护甲，虽然有些破损，但依然坚不可摧。',
    ],
    仙品: [
      '仙灵所制的无上道袍，蕴含着大道之力，防御力惊人，几乎可抵御一切攻击。',
      '传说中的仙甲，每一丝都蕴含着天地法则，可抵挡仙人之力。',
      '超越凡尘的仙衣，轻盈如羽却坚不可摧，蕴含着无上仙力。',
      '开天辟地时诞生的至宝护甲，拥有绝对防御，可抵御一切伤害。',
    ],
  };

  const accessoryDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的饰品，虽然效果微弱，但也能提供一些帮助。',
      '常见的配饰，制作简单，但蕴含着微弱的灵气。',
      '基础的饰品，能够略微提升佩戴者的能力。',
      '凡间常见的配饰，虽然平凡，但制作精良。',
    ],
    稀有: [
      '精心制作的饰品，蕴含着浓郁的灵气，能够显著提升佩戴者的能力。',
      '上等材料制成的配饰，表面流转着淡淡的光华，效果不俗。',
      '宗门弟子常用的饰品，不仅美观，还能提升修炼效率。',
      '经过特殊工艺处理的饰品，蕴含着强大的辅助之力。',
    ],
    传说: [
      '传说中的宝物，蕴含着强大的力量，能够大幅提升佩戴者的各项能力。',
      '上古流传的至宝，每一丝都蕴含着无上威能，效果惊人。',
      '天地灵气凝聚而成的神物，佩戴后可获得强大的加持。',
      '历经无数岁月的传奇饰品，虽然有些磨损，但依然威力强大。',
    ],
    仙品: [
      '仙灵所制的无上宝物，蕴含着大道之力，可大幅提升佩戴者的所有能力。',
      '传说中的仙器，每一丝都蕴含着天地法则，效果惊人。',
      '超越凡尘的仙物，佩戴后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运。',
    ],
  };

  const ringDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的戒指，虽然效果微弱，但也能提供一些属性加成。',
      '常见的指环，制作简单，但蕴含着微弱的灵气。',
      '基础的戒指，能够略微提升佩戴者的能力。',
      '凡间常见的戒指，虽然平凡，但制作精良。',
    ],
    稀有: [
      '精心制作的戒指，蕴含着浓郁的灵气，能够显著提升佩戴者的能力。',
      '上等材料制成的指环，表面流转着淡淡的光华，效果不俗。',
      '宗门弟子常用的戒指，不仅美观，还能提升修炼效率。',
      '经过特殊工艺处理的戒指，蕴含着强大的辅助之力。',
    ],
    传说: [
      '传说中的宝戒，蕴含着强大的力量，能够大幅提升佩戴者的各项能力。',
      '上古流传的至宝，每一道纹路都蕴含着无上威能，效果惊人。',
      '天地灵气凝聚而成的神戒，佩戴后可获得强大的加持。',
      '历经无数岁月的传奇戒指，虽然有些磨损，但依然威力强大。',
    ],
    仙品: [
      '仙灵所制的无上宝戒，蕴含着大道之力，可大幅提升佩戴者的所有能力。',
      '传说中的仙戒，每一道纹路都蕴含着天地法则，效果惊人。',
      '超越凡尘的仙物，佩戴后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可改变佩戴者的命运。',
    ],
  };

  const artifactDescriptions: Record<ItemRarity, string[]> = {
    普通: [
      '普通的法宝，虽然威力有限，但也能在战斗中提供一些帮助。',
      '基础的宝物，蕴含着微弱的灵气，适合初学者使用。',
      '常见的法宝，制作简单，但功能实用。',
      '凡间常见的宝物，虽然平凡，但制作精良。',
    ],
    稀有: [
      '精心炼制的法宝，蕴含着浓郁的灵气，威力不俗。',
      '上等材料制成的宝物，表面流转着淡淡的光华，效果出众。',
      '宗门弟子常用的法宝，不仅实用，还能提升战斗能力。',
      '经过特殊工艺处理的宝物，蕴含着强大的辅助之力。',
    ],
    传说: [
      '传说中的至宝，蕴含着强大的力量，能够大幅提升使用者的战斗能力。',
      '上古流传的神物，每一丝都蕴含着无上威能，威力惊人。',
      '天地灵气凝聚而成的法宝，使用后可获得强大的加持。',
      '历经无数战斗的传奇宝物，虽然有些磨损，但依然威力强大。',
    ],
    仙品: [
      '仙灵所制的无上至宝，蕴含着大道之力，可大幅提升使用者的所有能力。',
      '传说中的仙器，每一丝都蕴含着天地法则，威力无穷。',
      '超越凡尘的仙物，使用后可获得仙人之力加持。',
      '开天辟地时诞生的至宝，拥有无上威能，可镇压万物。',
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
    { type: 'armor', itemType: ItemType.Armor, slots: [EquipmentSlot.Chest] },
    { type: 'accessory', itemType: ItemType.Accessory, slots: [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2] },
    { type: 'ring', itemType: ItemType.Ring, slots: [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4] },
    { type: 'artifact', itemType: ItemType.Artifact, slots: [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2] },
  ];

  let idCounter = 1;

  equipmentTypes.forEach(({ type, itemType, slots }) => {
    rarities.forEach(rarity => {
      for (let i = 0; i < 10; i++) {
        const name = generateEquipmentName(type, rarity, i);
        const stats = generateEquipmentStats(type, rarity, i);
        const slot = slots[i % slots.length];

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

/**
 * 生成丹药名称
 */
function generatePillName(rarity: ItemRarity, index: number): string {
  const prefix = ITEM_PREFIXES.pill[index % ITEM_PREFIXES.pill.length];
  const suffix = ITEM_SUFFIXES.pill[index % ITEM_SUFFIXES.pill.length];

  const rarityPrefixes: Record<ItemRarity, string> = {
    普通: '小',
    稀有: '中',
    传说: '大',
    仙品: '仙',
  };

  const rarityPrefix = rarityPrefixes[rarity];
  return `${rarityPrefix}${prefix}${suffix}`;
}

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
        description: `一颗${rarity}的丹药，服用后可以获得强大的效果。`,
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

/**
 * 生成草药名称
 */
function generateHerbName(rarity: ItemRarity, index: number): string {
  const baseName = ITEM_PREFIXES.herb[index % ITEM_PREFIXES.herb.length];
  const suffix = ITEM_SUFFIXES.herb[index % ITEM_SUFFIXES.herb.length];

  const rarityPrefixes: Record<ItemRarity, string> = {
    普通: '',
    稀有: '灵',
    传说: '仙',
    仙品: '神',
  };

  const rarityPrefix = rarityPrefixes[rarity];
  return rarityPrefix ? `${rarityPrefix}${baseName}${suffix}` : `${baseName}${suffix}`;
}

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
        description: `一株${rarity}的草药，蕴含着浓郁的灵气。`,
        quantity: 1,
        rarity,
        ...stats,
      });
    }
  });

  return items;
}

/**
 * 生成材料名称
 */
function generateMaterialName(rarity: ItemRarity, index: number): string {
  const prefix = ITEM_PREFIXES.material[index % ITEM_PREFIXES.material.length];
  const suffix = ITEM_SUFFIXES.material[index % ITEM_SUFFIXES.material.length];

  const rarityPrefixes: Record<ItemRarity, string> = {
    普通: '',
    稀有: '灵',
    传说: '仙',
    仙品: '神',
  };

  const rarityPrefix = rarityPrefixes[rarity];
  return rarityPrefix ? `${rarityPrefix}${prefix}${suffix}` : `${prefix}${suffix}`;
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
        description: `一块${rarity}的材料，是炼器和炼丹的重要原料。`,
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
