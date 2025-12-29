/**
 * 抽奖系统相关常量
 * 包含所有抽奖奖品定义
 */

import { LotteryPrize, ItemType, EquipmentSlot, ItemRarity } from '../types'
import { generateLotteryPrizes } from '../utils/itemGenerator';

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
        description: '有助于凝结金丹的珍贵丹药。服用后大幅提升修为，并永久增强神识。',
        quantity: 1,
        rarity: '稀有',
        effect: { exp: 30000, spirit: 20 },
        permanentEffect: { spirit: 50, maxHp: 200 },
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
        description: '能够凝聚神魂的珍贵丹药。服用后大幅提升修为和神识，并永久增强神魂。',
        quantity: 1,
        rarity: '传说',
        effect: { exp: 10000, spirit: 50, hp: 300 },
        permanentEffect: { spirit: 100, maxHp: 300, attack: 50 },
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
        description: '蕴含一丝真龙之血，服用后气血如龙。大幅增加气血上限。',
        quantity: 1,
        rarity: '传说',
        permanentEffect: { maxHp: 500, physique: 50 },
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
        description: '蕴含凤凰涅槃之力的神丹。服用后获得涅槃重生之力，大幅提升修为和属性。',
        quantity: 1,
        rarity: '传说',
        effect: { hp: 800, exp: 1500, attack: 30 },
        permanentEffect: { maxHp: 400, attack: 100, defense: 100, spirit: 80, physique: 80, speed: 50 },
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
        effect: { exp: 50000 },
        permanentEffect: { maxLifespan: 1000, spirit: 1000, attack: 1000, defense: 1000, physique: 1000, speed: 1000},
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
    weight: 2, // 从1提升到2，提高仙品掉落概率
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
    weight: 2, // 从1提升到2，提高仙品掉落概率
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
    weight: 2, // 从1提升到2，提高仙品掉落概率
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
    weight: 2, // 从1提升到2，提高仙品掉落概率
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

  // 普通奖励 - 灵宠（提高权重，增加获得概率）
  {
    id: 'lottery-pet-fox',
    name: '灵狐',
    type: 'pet',
    rarity: '普通',
    weight: 20, // 进一步提高权重，增加获得概率
    value: { petId: 'pet-spirit-fox' },
  },
  {
    id: 'lottery-pet-tiger',
    name: '雷虎',
    type: 'pet',
    rarity: '稀有',
    weight: 15, // 进一步提高权重，增加获得概率
    value: { petId: 'pet-thunder-tiger' },
  },
  {
    id: 'lottery-pet-phoenix',
    name: '凤凰',
    type: 'pet',
    rarity: '仙品',
    weight: 6, // 进一步提高权重，增加获得概率
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
  // 进阶物品奖励（极稀有）
  {
    id: 'lottery-foundation-treasure',
    name: '筑基奇物',
    type: 'item',
    rarity: '传说',
    weight: 3, // 从1提高到3
    value: {
      item: {
        name: '筑基奇物',
        type: ItemType.Material,
        description: '突破筑基期的关键物品，可在修炼系统中使用',
        quantity: 1,
        rarity: '传说',
      },
      foundationTreasure: true, // 标记为进阶物品，需要在抽奖处理中特殊处理
    },
  },
  {
    id: 'lottery-heaven-earth-essence',
    name: '天地精华',
    type: 'item',
    rarity: '仙品',
    weight: 2, // 从0.5提高到2
    value: {
      item: {
        name: '天地精华',
        type: ItemType.Material,
        description: '突破元婴期的关键物品，可在修炼系统中使用',
        quantity: 1,
        rarity: '仙品',
      },
      heavenEarthEssence: true,
    },
  },
  {
    id: 'lottery-heaven-earth-marrow',
    name: '天地之髓',
    type: 'item',
    rarity: '仙品',
    weight: 1.5, // 从0.3提高到1.5
    value: {
      item: {
        name: '天地之髓',
        type: ItemType.Material,
        description: '突破化神期的关键物品，可在修炼系统中使用',
        quantity: 1,
        rarity: '仙品',
      },
      heavenEarthMarrow: true,
    },
  },
  {
    id: 'lottery-longevity-rule',
    name: '规则之力',
    type: 'item',
    rarity: '仙品',
    weight: 0.5, // 从0.1提高到0.5
    value: {
      item: {
        name: '规则之力',
        type: ItemType.Material,
        description: '掌控天地的规则之力，可在修炼系统中使用',
        quantity: 1,
        rarity: '仙品',
      },
      longevityRule: true,
    },
  },
];

// 生成装备奖品（每个品级10件）
const equipmentTypes: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact];
const equipmentRarities: Array<{ rarity: ItemRarity; label: string }> = [
  { rarity: '普通', label: 'common' },
  { rarity: '稀有', label: 'rare' },
  { rarity: '传说', label: 'legend' },
  { rarity: '仙品', label: 'immortal' },
];

equipmentTypes.forEach(type => {
  equipmentRarities.forEach(({ rarity, label }) => {
    const generatedPrizes = generateLotteryPrizes({ type, rarity: rarity as any });
    LOTTERY_PRIZES.push(...generatedPrizes);
  });
});

// 生成丹药奖品（每个品级10件）
const pillRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 15 },
  { rarity: '稀有', weight: 10 },
  { rarity: '传说', weight: 5 },
  { rarity: '仙品', weight: 2 },
];

pillRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Pill, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// 生成草药奖品（每个品级10件）
const herbRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 15 },
  { rarity: '稀有', weight: 10 },
  { rarity: '传说', weight: 5 },
  { rarity: '仙品', weight: 2 },
];

herbRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Herb, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});

// 生成材料奖品（每个品级10件）
const materialRarities: Array<{ rarity: ItemRarity; weight: number }> = [
  { rarity: '普通', weight: 20 },
  { rarity: '稀有', weight: 12 },
  { rarity: '传说', weight: 6 },
  { rarity: '仙品', weight: 3 },
];

materialRarities.forEach(({ rarity, weight }) => {
  const generatedPrizes = generateLotteryPrizes({ type: ItemType.Material, rarity: rarity as any });
  // 调整权重
  generatedPrizes.forEach(prize => {
    prize.weight = weight;
  });
  LOTTERY_PRIZES.push(...generatedPrizes);
});