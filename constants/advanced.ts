/**
 * 进阶物品系统相关常量
 * 包含筑基奇物、天地精华、天地之髓、规则之力等进阶物品定义
 */

import { FoundationTreasure, HeavenEarthEssence, HeavenEarthMarrow, LongevityRule } from '../types';

// 筑基奇物系统
export const FOUNDATION_TREASURES: Record<string, FoundationTreasure> = {
  // 普通筑基奇物 (10种)
  'ft_001': {
    id: 'ft_001',
    name: '青木灵根',
    description: '蕴含青木之气的灵根，可增强生命力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 500, spiritBonus: 50 },
    battleEffect: {
      type: 'heal',
      name: '青木回春',
      description: '消耗10年寿命，恢复30%最大气血',
      cost: { lifespan: 10 },
      effect: {
        heal: { percentOfMaxHp: 0.3 }
      },
      cooldown: 3
    }
  },
  'ft_002': {
    id: 'ft_002',
    name: '赤火晶石',
    description: '蕴含纯阳火气的晶石，可增强攻击力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { attackBonus: 100, physiqueBonus: 30 },
    battleEffect: {
      type: 'damage',
      name: '赤火焚天',
      description: '消耗5%最大气血，造成攻击力2.5倍伤害',
      cost: { maxHp: 0.05 },
      effect: {
        damage: { multiplier: 2.5 }
      },
      cooldown: 2
    }
  },
  'ft_003': {
    id: 'ft_003',
    name: '玄水精魄',
    description: '蕴含玄阴水气的精魄，可增强灵力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 80, defenseBonus: 40 },
    battleEffect: {
      type: 'buff',
      name: '玄水护体',
      description: '消耗8年寿命，获得防御力+40%的增益，持续2回合',
      cost: { lifespan: 8 },
      effect: {
        buff: { defense: 0.4, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_004': {
    id: 'ft_004',
    name: '厚土灵核',
    description: '蕴含厚重土气的灵核，可增强防御',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { defenseBonus: 80, hpBonus: 300 },
    battleEffect: {
      type: 'heal',
      name: '厚土回春',
      description: '消耗12年寿命，恢复25%最大气血',
      cost: { lifespan: 12 },
      effect: {
        heal: { percentOfMaxHp: 0.25 }
      },
      cooldown: 4
    }
  },
  'ft_005': {
    id: 'ft_005',
    name: '庚金灵胚',
    description: '蕴含锐利金气的灵胚，可增强速度',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { speedBonus: 20, attackBonus: 60 },
    battleEffect: {
      type: 'damage',
      name: '庚金破甲',
      description: '消耗6年寿命，造成攻击力2倍伤害，无视20%防御',
      cost: { lifespan: 6 },
      effect: {
        damage: { multiplier: 2, ignoreDefense: 0.2 }
      },
      cooldown: 2
    }
  },
  'ft_006': {
    id: 'ft_006',
    name: '风雷之羽',
    description: '蕴含风雷之力的羽毛，可增强身法',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { speedBonus: 30, spiritBonus: 40 },
    battleEffect: {
      type: 'buff',
      name: '风雷加速',
      description: '消耗7年寿命，获得速度+50%的增益，持续3回合',
      cost: { lifespan: 7 },
      effect: {
        buff: { speed: 0.5, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_007': {
    id: 'ft_007',
    name: '冰晶玉髓',
    description: '蕴含寒冰之气的玉髓，可增强灵力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 70, defenseBonus: 30 },
    battleEffect: {
      type: 'debuff',
      name: '冰封万里',
      description: '消耗9年寿命，对敌人造成攻击力1.8倍伤害，并降低敌人速度30%，持续2回合',
      cost: { lifespan: 9 },
      effect: {
        damage: { multiplier: 1.8 },
        debuff: { speed: -0.3, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_008': {
    id: 'ft_008',
    name: '熔岩之心',
    description: '蕴含地火之力的核心，可增强体魄',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { physiqueBonus: 50, hpBonus: 400 },
    battleEffect: {
      type: 'damage',
      name: '熔岩爆发',
      description: '消耗10年寿命，造成攻击力2.2倍伤害，附带持续灼烧效果',
      cost: { lifespan: 10 },
      effect: {
        damage: { multiplier: 2.2 },
        debuff: { hp: -0.05, duration: 2 } // 持续2回合，每回合损失5%最大气血
      },
      cooldown: 3
    }
  },
  'ft_009': {
    id: 'ft_009',
    name: '星辰碎片',
    description: '蕴含星辰之力的碎片，可增强灵力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 60, speedBonus: 15 },
    battleEffect: {
      type: 'buff',
      name: '星辰之力',
      description: '消耗8年寿命，获得灵力+40%、速度+20%的增益，持续2回合',
      cost: { lifespan: 8 },
      effect: {
        buff: { spirit: 0.4, speed: 0.2, duration: 2 }
      },
      cooldown: 3
    }
  },
  'ft_010': {
    id: 'ft_010',
    name: '月华露珠',
    description: '蕴含月华之气的露珠，可增强生命力',
    rarity: '普通',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 350, spiritBonus: 45 },
    battleEffect: {
      type: 'heal',
      name: '月华润泽',
      description: '消耗10年寿命，恢复20%最大气血，并提升灵力20%，持续2回合',
      cost: { lifespan: 10 },
      effect: {
        heal: { percentOfMaxHp: 0.2 },
        buff: { spirit: 0.2, duration: 2 }
      },
      cooldown: 3
    }
  },

  // 稀有筑基奇物 (10种)
  'ft_011': {
    id: 'ft_011',
    name: '九转金丹',
    description: '九转炼制的金丹，可大幅增强根基',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 800, attackBonus: 150, defenseBonus: 100 },
    battleEffect: {
      type: 'buff',
      name: '九转之力',
      description: '消耗20年寿命，获得攻击力+50%、防御力+30%的增益，持续3回合',
      cost: { lifespan: 20 },
      effect: {
        buff: { attack: 0.5, defense: 0.3, duration: 3 }
      },
      cooldown: 5
    }
  },
  'ft_012': {
    id: 'ft_012',
    name: '紫府仙莲',
    description: '生长在紫府的仙莲，可增强灵力根基',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 120, hpBonus: 600, specialEffect: '灵力恢复速度提升20%' },
    battleEffect: {
      type: 'heal',
      name: '仙莲回春',
      description: '消耗15年寿命，恢复35%最大气血，并提升灵力30%，持续3回合',
      cost: { lifespan: 15 },
      effect: {
        heal: { percentOfMaxHp: 0.35 },
        buff: { spirit: 0.3, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_013': {
    id: 'ft_013',
    name: '龙血精石',
    description: '蕴含真龙血脉的精石，可增强体魄',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { physiqueBonus: 80, hpBonus: 1000, attackBonus: 120 },
    battleEffect: {
      type: 'buff',
      name: '真龙之力',
      description: '消耗18年寿命，获得攻击力+60%、体魄+40%的增益，持续3回合',
      cost: { lifespan: 18 },
      effect: {
        buff: { attack: 0.6, physique: 0.4, duration: 3 }
      },
      cooldown: 5
    }
  },
  'ft_014': {
    id: 'ft_014',
    name: '凤翎灵羽',
    description: '用凤凰翎羽制成的灵物，可增强灵力',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 150, speedBonus: 25, specialEffect: '法术伤害提升15%' },
    battleEffect: {
      type: 'damage',
      name: '凤凰真火',
      description: '消耗16年寿命，造成攻击力3.5倍伤害，法术伤害提升50%',
      cost: { lifespan: 16 },
      effect: {
        damage: { multiplier: 3.5 },
        buff: { spirit: 0.5, duration: 2 }
      },
      cooldown: 4
    }
  },
  'ft_015': {
    id: 'ft_015',
    name: '麒麟角',
    description: '神兽麒麟的角，可增强防御力',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { defenseBonus: 150, hpBonus: 700, physiqueBonus: 60 },
    battleEffect: {
      type: 'buff',
      name: '麒麟守护',
      description: '消耗17年寿命，获得防御力+50%、气血上限+30%的增益，持续4回合',
      cost: { lifespan: 17 },
      effect: {
        buff: { defense: 0.5, maxHp: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'ft_016': {
    id: 'ft_016',
    name: '玄武甲片',
    description: '神兽玄武的甲片，可大幅增强防御',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { defenseBonus: 200, hpBonus: 900, specialEffect: '受到伤害减少10%' },
    battleEffect: {
      type: 'buff',
      name: '玄武护体',
      description: '消耗20年寿命，获得防御力+60%的增益，并反弹30%受到的伤害，持续4回合',
      cost: { lifespan: 20 },
      effect: {
        buff: { defense: 0.6, reflectDamage: 0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_017': {
    id: 'ft_017',
    name: '白虎牙',
    description: '神兽白虎的牙齿，可增强攻击力',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { attackBonus: 200, speedBonus: 30, physiqueBonus: 70 },
    battleEffect: {
      type: 'damage',
      name: '白虎破军',
      description: '消耗18年寿命，造成攻击力4倍伤害，无视40%防御',
      cost: { lifespan: 18 },
      effect: {
        damage: { multiplier: 4, ignoreDefense: 0.4 }
      },
      cooldown: 4
    }
  },
  'ft_018': {
    id: 'ft_018',
    name: '朱雀羽',
    description: '神兽朱雀的羽毛，可增强火系灵力',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 180, attackBonus: 130, specialEffect: '火系法术威力提升25%' },
    battleEffect: {
      type: 'damage',
      name: '朱雀真火',
      description: '消耗19年寿命，造成攻击力3.8倍伤害，附带持续灼烧，持续3回合',
      cost: { lifespan: 19 },
      effect: {
        damage: { multiplier: 3.8 },
        debuff: { hp: -0.08, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_019': {
    id: 'ft_019',
    name: '青龙鳞',
    description: '神兽青龙的鳞片，可增强生命力',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 1200, spiritBonus: 100, speedBonus: 20 },
    battleEffect: {
      type: 'heal',
      name: '青龙回生',
      description: '消耗17年寿命，恢复40%最大气血，并提升速度30%，持续3回合',
      cost: { lifespan: 17 },
      effect: {
        heal: { percentOfMaxHp: 0.4 },
        buff: { speed: 0.3, duration: 3 }
      },
      cooldown: 4
    }
  },
  'ft_020': {
    id: 'ft_020',
    name: '混沌石',
    description: '蕴含混沌之气的奇石，可平衡五行',
    rarity: '稀有',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 500, attackBonus: 100, defenseBonus: 100, spiritBonus: 100, physiqueBonus: 50 },
    battleEffect: {
      type: 'buff',
      name: '混沌平衡',
      description: '消耗20年寿命，获得全属性+25%的增益，持续4回合',
      cost: { lifespan: 20 },
      effect: {
        buff: { attack: 0.25, defense: 0.25, spirit: 0.25, physique: 0.25, speed: 0.25, duration: 4 }
      },
      cooldown: 5
    }
  },

  // 传说筑基奇物 (10种)
  'ft_021': {
    id: 'ft_021',
    name: '太初道胎',
    description: '蕴含太初之气的道胎，可铸就无上根基',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 1500, attackBonus: 300, defenseBonus: 200, spiritBonus: 250, physiqueBonus: 150, specialEffect: '所有属性提升10%' },
    battleEffect: {
      type: 'buff',
      name: '太初之力',
      description: '消耗30年寿命，获得全属性+40%的增益，持续5回合',
      cost: { lifespan: 30 },
      effect: {
        buff: { attack: 0.4, defense: 0.4, spirit: 0.4, physique: 0.4, speed: 0.4, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_022': {
    id: 'ft_022',
    name: '鸿蒙紫气',
    description: '开天辟地时的鸿蒙紫气，可增强道基',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 400, hpBonus: 1000, specialEffect: '灵力上限提升30%，修炼速度提升20%' },
    battleEffect: {
      type: 'buff',
      name: '鸿蒙开天',
      description: '消耗35年寿命，获得灵力+80%、气血上限+50%的增益，持续5回合',
      cost: { lifespan: 35 },
      effect: {
        buff: { spirit: 0.8, maxHp: 0.5, duration: 5 }
      },
      cooldown: 7
    }
  },
  'ft_023': {
    id: 'ft_023',
    name: '造化玉碟',
    description: '蕴含造化之力的玉碟，可改变资质',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 1200, attackBonus: 250, defenseBonus: 180, spiritBonus: 300, speedBonus: 40, specialEffect: '突破成功率提升15%' },
    battleEffect: {
      type: 'buff',
      name: '造化之力',
      description: '消耗32年寿命，获得全属性+35%的增益，并提升暴击率30%，持续5回合',
      cost: { lifespan: 32 },
      effect: {
        buff: { attack: 0.35, defense: 0.35, spirit: 0.35, physique: 0.35, speed: 0.35, critChance: 0.3, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_024': {
    id: 'ft_024',
    name: '轮回印',
    description: '蕴含轮回之力的印记，可增强生命力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 2000, physiqueBonus: 200, specialEffect: '死亡时有30%几率复活并恢复50%生命' },
    battleEffect: {
      type: 'heal',
      name: '轮回重生',
      description: '消耗40年寿命，恢复50%最大气血，并获得复活标记（死亡时自动复活一次）',
      cost: { lifespan: 40 },
      effect: {
        heal: { percentOfMaxHp: 0.5 },
        buff: { revive: 1, duration: 999 } // 复活标记持续到战斗结束
      },
      cooldown: 8
    }
  },
  'ft_025': {
    id: 'ft_025',
    name: '时空沙漏',
    description: '可操控时空的沙漏，可增强速度',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { speedBonus: 60, spiritBonus: 200, specialEffect: '战斗时先手几率提升25%，闪避率提升15%' },
    battleEffect: {
      type: 'buff',
      name: '时空加速',
      description: '消耗30年寿命，获得速度+100%、闪避率+50%的增益，持续4回合',
      cost: { lifespan: 30 },
      effect: {
        buff: { speed: 1.0, dodge: 0.5, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_026': {
    id: 'ft_026',
    name: '命运之轮',
    description: '可改变命运的轮盘，可增强气运',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 800, attackBonus: 200, defenseBonus: 150, spiritBonus: 180, specialEffect: '暴击率提升20%，暴击伤害提升30%' },
    battleEffect: {
      type: 'buff',
      name: '命运眷顾',
      description: '消耗28年寿命，获得暴击率+50%、暴击伤害+80%的增益，持续5回合',
      cost: { lifespan: 28 },
      effect: {
        buff: { critChance: 0.5, critDamage: 0.8, duration: 5 }
      },
      cooldown: 6
    }
  },
  'ft_027': {
    id: 'ft_027',
    name: '因果之线',
    description: '连接因果的神秘丝线，可增强灵力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 350, hpBonus: 900, specialEffect: '法术命中率提升25%，法术暴击率提升15%' },
    battleEffect: {
      type: 'damage',
      name: '因果反噬',
      description: '消耗33年寿命，造成攻击力4.5倍伤害，必定命中，并反弹敌人下次攻击的50%伤害',
      cost: { lifespan: 33 },
      effect: {
        damage: { multiplier: 4.5, guaranteedHit: true },
        buff: { reflectDamage: 0.5, duration: 1 }
      },
      cooldown: 5
    }
  },
  'ft_028': {
    id: 'ft_028',
    name: '虚无灵镜',
    description: '可看透虚实的灵镜，可增强洞察力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { defenseBonus: 250, spiritBonus: 220, specialEffect: '受到攻击时有20%几率完全闪避，看破敌人弱点几率提升' },
    battleEffect: {
      type: 'buff',
      name: '虚无化形',
      description: '消耗31年寿命，获得闪避率+80%的增益，并看破敌人弱点（攻击无视防御），持续4回合',
      cost: { lifespan: 31 },
      effect: {
        buff: { dodge: 0.8, ignoreDefense: true, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_029': {
    id: 'ft_029',
    name: '永恒之火',
    description: '永不熄灭的火焰，可增强攻击力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { attackBonus: 350, spiritBonus: 280, specialEffect: '攻击附带灼烧效果，持续造成伤害' },
    battleEffect: {
      type: 'damage',
      name: '永恒灼烧',
      description: '消耗34年寿命，造成攻击力5倍伤害，附带永恒灼烧（每回合损失10%最大气血），持续5回合',
      cost: { lifespan: 34 },
      effect: {
        damage: { multiplier: 5 },
        debuff: { hp: -0.1, duration: 5 }
      },
      cooldown: 5
    }
  },
  'ft_030': {
    id: 'ft_030',
    name: '不朽之木',
    description: '永恒不朽的神木，可增强生命力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 1800, defenseBonus: 220, specialEffect: '生命恢复速度提升50%，中毒抗性提升' },
    battleEffect: {
      type: 'heal',
      name: '不朽回春',
      description: '消耗32年寿命，恢复60%最大气血，并每回合恢复10%最大气血，持续5回合',
      cost: { lifespan: 32 },
      effect: {
        heal: { percentOfMaxHp: 0.6 },
        buff: { regen: 0.1, duration: 5 }
      },
      cooldown: 6
    }
  },

  // 传说筑基奇物 (10种)
  'ft_031': {
    id: 'ft_031',
    name: '天道碎片',
    description: '天道的碎片，蕴含无上法则',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 2500, attackBonus: 500, defenseBonus: 400, spiritBonus: 600, physiqueBonus: 300, speedBonus: 80, specialEffect: '所有属性提升20%，突破成功率提升25%' },
    battleEffect: {
      type: 'buff',
      name: '天道之力',
      description: '消耗50年寿命，获得全属性+60%的增益，持续6回合',
      cost: { lifespan: 50 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_032': {
    id: 'ft_032',
    name: '混沌青莲',
    description: '混沌中诞生的青莲，可铸就完美道基',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 3000, spiritBonus: 800, specialEffect: '灵力上限提升50%，修炼速度提升40%，法术威力提升30%' },
    battleEffect: {
      type: 'buff',
      name: '青莲绽放',
      description: '消耗55年寿命，获得灵力+100%、气血上限+70%的增益，持续6回合',
      cost: { lifespan: 55 },
      effect: {
        buff: { spirit: 1.0, maxHp: 0.7, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_033': {
    id: 'ft_033',
    name: '盘古精血',
    description: '开天辟地盘古的精血，可增强体魄',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { physiqueBonus: 500, hpBonus: 4000, attackBonus: 600, defenseBonus: 500, specialEffect: '生命恢复速度提升100%，物理伤害提升40%' },
    battleEffect: {
      type: 'buff',
      name: '盘古开天',
      description: '消耗60年寿命，获得攻击力+80%、体魄+70%、每回合恢复15%最大气血的增益，持续6回合',
      cost: { lifespan: 60 },
      effect: {
        buff: { attack: 0.8, physique: 0.7, regen: 0.15, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_034': {
    id: 'ft_034',
    name: '女娲石',
    description: '女娲补天所用的神石，可增强灵力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 1000, defenseBonus: 600, hpBonus: 2000, specialEffect: '灵力恢复速度提升80%，法术防御提升50%' },
    battleEffect: {
      type: 'buff',
      name: '女娲补天',
      description: '消耗52年寿命，获得灵力+90%、防御力+70%、法术防御+60%的增益，持续6回合',
      cost: { lifespan: 52 },
      effect: {
        buff: { spirit: 0.9, defense: 0.7, magicDefense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_035': {
    id: 'ft_035',
    name: '东皇钟意',
    description: '蕴含东皇钟神韵的奇物，可增强防御',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { defenseBonus: 800, hpBonus: 3500, specialEffect: '受到伤害减少30%，反弹20%伤害给攻击者' },
    battleEffect: {
      type: 'buff',
      name: '东皇护体',
      description: '消耗58年寿命，获得防御力+80%、受到伤害减少50%、反弹40%伤害的增益，持续6回合',
      cost: { lifespan: 58 },
      effect: {
        buff: { defense: 0.8, damageReduction: 0.5, reflectDamage: 0.4, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_036': {
    id: 'ft_036',
    name: '轩辕剑意',
    description: '人族圣剑轩辕剑的剑意，可增强攻击',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { attackBonus: 800, speedBonus: 100, specialEffect: '攻击力提升50%，暴击率提升30%，对邪魔伤害翻倍' },
    battleEffect: {
      type: 'damage',
      name: '轩辕斩魔',
      description: '消耗56年寿命，造成攻击力6倍伤害，无视50%防御，对邪魔伤害翻倍',
      cost: { lifespan: 56 },
      effect: {
        damage: { multiplier: 6, ignoreDefense: 0.5, demonMultiplier: 2.0 }
      },
      cooldown: 6
    }
  },
  'ft_037': {
    id: 'ft_037',
    name: '昆仑镜心',
    description: '蕴含昆仑镜神韵的奇物，可增强洞察',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 700, speedBonus: 120, specialEffect: '先手几率提升40%，闪避率提升25%，看破敌人招式' },
    battleEffect: {
      type: 'buff',
      name: '昆仑洞察',
      description: '消耗54年寿命，获得速度+100%、闪避率+70%、攻击无视防御的增益，持续5回合',
      cost: { lifespan: 54 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, ignoreDefense: true, duration: 5 }
      },
      cooldown: 7
    }
  },
  'ft_038': {
    id: 'ft_038',
    name: '伏羲琴音',
    description: '蕴含伏羲琴神韵的奇物，可增强灵力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { spiritBonus: 900, hpBonus: 1800, specialEffect: '灵力上限提升60%，音律法术威力提升50%' },
    battleEffect: {
      type: 'damage',
      name: '伏羲天音',
      description: '消耗57年寿命，造成攻击力5.5倍伤害，并降低敌人所有属性30%，持续4回合',
      cost: { lifespan: 57 },
      effect: {
        damage: { multiplier: 5.5 },
        debuff: { attack: -0.3, defense: -0.3, spirit: -0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'ft_039': {
    id: 'ft_039',
    name: '神农鼎火',
    description: '蕴含神农鼎神韵的奇物，可增强生命力',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 5000, physiqueBonus: 400, specialEffect: '生命恢复速度提升150%，中毒抗性提升100%' },
    battleEffect: {
      type: 'heal',
      name: '神农回生',
      description: '消耗59年寿命，恢复80%最大气血，清除所有负面状态，并每回合恢复20%最大气血，持续6回合',
      cost: { lifespan: 59 },
      effect: {
        heal: { percentOfMaxHp: 0.8 },
        buff: { regen: 0.2, cleanse: true, duration: 6 }
      },
      cooldown: 8
    }
  },
  'ft_040': {
    id: 'ft_040',
    name: '太极图录',
    description: '蕴含阴阳大道的至宝，可平衡阴阳',
    rarity: '传说',
    advancedItemType: 'foundationTreasure',
    effects: { hpBonus: 2200, attackBonus: 400, defenseBonus: 400, spiritBonus: 500, physiqueBonus: 300, speedBonus: 60, specialEffect: '所有属性提升25%，阴阳平衡，万法不侵' },
    battleEffect: {
      type: 'buff',
      name: '太极平衡',
      description: '消耗60年寿命，获得全属性+70%、免疫所有负面状态、反弹50%伤害的增益，持续7回合',
      cost: { lifespan: 60 },
      effect: {
        buff: { attack: 0.7, defense: 0.7, spirit: 0.7, physique: 0.7, speed: 0.7, immunity: true, reflectDamage: 0.5, duration: 7 }
      },
      cooldown: 9
    }
  }
};

// 金丹多法系统配置
export const GOLDEN_CORE_METHOD_CONFIG = {
  // 功法数量与天劫难度的关系
  methodDifficultyMultiplier: {
    1: 1.0,   // 1法金丹：基础难度
    2: 1.5,   // 2法金丹：难度+50%
    3: 2.0,   // 3法金丹：难度+100%
    4: 2.5,   // 4法金丹：难度+150%
    5: 3.0,   // 5法金丹：难度+200%
    6: 3.5,   // 6法金丹：难度+250%
    7: 4.0,   // 7法金丹：难度+300%
    8: 4.5,   // 8法金丹：难度+350%
    9: 5.0,   // 9法金丹：难度+400%
  },

  // 功法数量与属性加成的倍数
  methodBonusMultiplier: {
    1: 1.0,   // 基础加成
    2: 1.8,   // 2法金丹：加成+80%
    3: 2.5,   // 3法金丹：加成+150%
    4: 3.1,   // 4法金丹：加成+210%
    5: 3.6,   // 5法金丹：加成+260%
    6: 4.0,   // 6法金丹：加成+300%
    7: 4.3,   // 7法金丹：加成+330%
    8: 4.5,   // 8法金丹：加成+350%
    9: 4.6,   // 9法金丹：加成+360%
  },

  // 金丹法数对应的称号
  methodTitles: {
    1: '一法金丹',
    2: '二法金丹',
    3: '三法金丹',
    4: '四法金丹',
    5: '五法金丹',
    6: '六法金丹',
    7: '七法金丹',
    8: '八法金丹',
    9: '九法金丹',
  }
};

// 天地精华系统（40种）
export const HEAVEN_EARTH_ESSENCES: Record<string, HeavenEarthEssence> = {
  // 普通天地精华 (10种)
  'hee_001': {
    id: 'hee_001',
    name: '业火红莲',
    description: '蕴含业火之力的红莲，可净化因果',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 30,
    effects: { attackBonus: 200, spiritBonus: 100, specialEffect: '攻击附带业火灼烧，持续造成伤害' },
    battleEffect: {
      type: 'damage',
      name: '业火焚身',
      description: '消耗15年寿命，造成攻击力3倍伤害，无视30%防御',
      cost: { lifespan: 15 },
      effect: {
        damage: { multiplier: 3, ignoreDefense: true }
      },
      cooldown: 3
    }
  },
  'hee_002': {
    id: 'hee_002',
    name: '太华千山',
    description: '太华山脉的精华，可增强防御',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 35,
    effects: { defenseBonus: 250, hpBonus: 500, specialEffect: '受到伤害时有一定几率触发山岳守护' },
    battleEffect: {
      type: 'buff',
      name: '山岳守护',
      description: '消耗20年寿命，获得防御力+50%、受到伤害减少30%的增益，持续4回合',
      cost: { lifespan: 20 },
      effect: {
        buff: { defense: 0.5, damageReduction: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hee_003': {
    id: 'hee_003',
    name: '五行洞天',
    description: '蕴含五行之力的洞天精华',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 40,
    effects: { hpBonus: 400, attackBonus: 150, defenseBonus: 150, spiritBonus: 120, physiqueBonus: 80 },
    battleEffect: {
      type: 'buff',
      name: '五行平衡',
      description: '消耗22年寿命，获得全属性+30%的增益，持续4回合',
      cost: { lifespan: 22 },
      effect: {
        buff: { attack: 0.3, defense: 0.3, spirit: 0.3, physique: 0.3, speed: 0.3, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hee_004': {
    id: 'hee_004',
    name: '诡道红符',
    description: '蕴含诡道之力的神秘符箓',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 45,
    effects: { spiritBonus: 200, speedBonus: 30, specialEffect: '法术命中率提升，有一定几率迷惑敌人' },
    battleEffect: {
      type: 'debuff',
      name: '诡道迷惑',
      description: '消耗21年寿命，对敌人造成攻击力2.5倍伤害，并降低敌人攻击力30%、速度20%，持续3回合',
      cost: { lifespan: 21 },
      effect: {
        damage: { multiplier: 2.5 },
        debuff: { attack: -0.3, speed: -0.2, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_005': {
    id: 'hee_005',
    name: '幽冥鬼火',
    description: '来自幽冥的诡异火焰',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 50,
    effects: { attackBonus: 180, spiritBonus: 150, specialEffect: '攻击附带幽冥效果，降低敌人防御' },
    battleEffect: {
      type: 'damage',
      name: '幽冥侵蚀',
      description: '消耗23年寿命，造成攻击力3.2倍伤害，并降低敌人防御力40%，持续3回合',
      cost: { lifespan: 23 },
      effect: {
        damage: { multiplier: 3.2 },
        debuff: { defense: -0.4, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_006': {
    id: 'hee_006',
    name: '血月精华',
    description: '血月之夜凝聚的精华',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 55,
    effects: { physiqueBonus: 100, hpBonus: 600, specialEffect: '生命恢复速度提升，夜晚战斗力增强' },
    battleEffect: {
      type: 'heal',
      name: '血月回生',
      description: '消耗24年寿命，恢复35%最大气血，并提升攻击力40%，持续3回合',
      cost: { lifespan: 24 },
      effect: {
        heal: { percentOfMaxHp: 0.35 },
        buff: { attack: 0.4, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_007': {
    id: 'hee_007',
    name: '星辰之泪',
    description: '星辰陨落时凝聚的精华',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 60,
    effects: { spiritBonus: 180, speedBonus: 25, specialEffect: '灵力上限提升，星辰法术威力增强' },
    battleEffect: {
      type: 'buff',
      name: '星辰之力',
      description: '消耗25年寿命，获得灵力+50%、速度+30%的增益，持续4回合',
      cost: { lifespan: 25 },
      effect: {
        buff: { spirit: 0.5, speed: 0.3, duration: 4 }
      },
      cooldown: 4
    }
  },
  'hee_008': {
    id: 'hee_008',
    name: '九幽寒冰',
    description: '九幽之地的极寒精华',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 65,
    effects: { defenseBonus: 200, spiritBonus: 160, specialEffect: '冰系法术威力提升，有一定几率冻结敌人' },
    battleEffect: {
      type: 'debuff',
      name: '九幽冰封',
      description: '消耗26年寿命，对敌人造成攻击力3倍伤害，并降低敌人速度50%，持续3回合',
      cost: { lifespan: 26 },
      effect: {
        damage: { multiplier: 3 },
        debuff: { speed: -0.5, duration: 3 }
      },
      cooldown: 4
    }
  },
  'hee_009': {
    id: 'hee_009',
    name: '雷劫残片',
    description: '天劫后残留的雷劫之力',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 70,
    effects: { attackBonus: 220, speedBonus: 35, specialEffect: '雷系法术威力提升，暴击率增加' },
    battleEffect: {
      type: 'damage',
      name: '雷劫天罚',
      description: '消耗27年寿命，造成攻击力3.5倍伤害，无视35%防御，并提升暴击率50%，持续2回合',
      cost: { lifespan: 27 },
      effect: {
        damage: { multiplier: 3.5, ignoreDefense: 0.35 },
        buff: { critChance: 0.5, duration: 2 }
      },
      cooldown: 4
    }
  },
  'hee_010': {
    id: 'hee_010',
    name: '混沌魔气',
    description: '混沌中诞生的魔气精华',
    rarity: '普通',
    advancedItemType: 'heavenEarthEssence',
    quality: 75,
    effects: { physiqueBonus: 120, attackBonus: 190, specialEffect: '物理攻击附带魔气侵蚀效果' },
    battleEffect: {
      type: 'damage',
      name: '魔气侵蚀',
      description: '消耗28年寿命，造成攻击力3.8倍伤害，附带持续侵蚀（每回合损失8%最大气血），持续3回合',
      cost: { lifespan: 28 },
      effect: {
        damage: { multiplier: 3.8 },
        debuff: { hp: -0.08, duration: 3 }
      },
      cooldown: 4
    }
  },

  // 稀有天地精华 (10种)
  'hee_011': {
    id: 'hee_011',
    name: '轮回之眼',
    description: '可窥视轮回的神秘之眼',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 80,
    effects: { spiritBonus: 300, hpBonus: 800, specialEffect: '死亡时有几率复活，看破敌人弱点几率提升' },
    battleEffect: {
      type: 'heal',
      name: '轮回重生',
      description: '消耗35年寿命，恢复45%最大气血，并获得复活标记（死亡时自动复活一次）',
      cost: { lifespan: 35 },
      effect: {
        heal: { percentOfMaxHp: 0.45 },
        buff: { revive: 1, duration: 999 }
      },
      cooldown: 6
    }
  },
  'hee_012': {
    id: 'hee_012',
    name: '时空碎片',
    description: '破碎的时空法则碎片',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 85,
    effects: { speedBonus: 50, spiritBonus: 250, specialEffect: '先手几率大幅提升，闪避率增加' },
    battleEffect: {
      type: 'buff',
      name: '时空加速',
      description: '消耗36年寿命，获得速度+80%、闪避率+60%的增益，持续5回合',
      cost: { lifespan: 36 },
      effect: {
        buff: { speed: 0.8, dodge: 0.6, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_013': {
    id: 'hee_013',
    name: '命运之线',
    description: '连接命运的神秘丝线',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 90,
    effects: { hpBonus: 1000, spiritBonus: 280, specialEffect: '气运提升，机缘获取几率增加' },
    battleEffect: {
      type: 'buff',
      name: '命运眷顾',
      description: '消耗37年寿命，获得暴击率+60%、暴击伤害+70%的增益，持续5回合',
      cost: { lifespan: 37 },
      effect: {
        buff: { critChance: 0.6, critDamage: 0.7, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_014': {
    id: 'hee_014',
    name: '因果之轮',
    description: '掌控因果的神秘轮盘',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 95,
    effects: { attackBonus: 350, defenseBonus: 200, specialEffect: '攻击附带因果反噬效果' },
    battleEffect: {
      type: 'damage',
      name: '因果反噬',
      description: '消耗38年寿命，造成攻击力4.5倍伤害，并反弹敌人下次攻击的60%伤害',
      cost: { lifespan: 38 },
      effect: {
        damage: { multiplier: 4.5 },
        buff: { reflectDamage: 0.6, duration: 1 }
      },
      cooldown: 5
    }
  },
  'hee_015': {
    id: 'hee_015',
    name: '虚无之镜',
    description: '可看透虚实的镜子',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 100,
    effects: { defenseBonus: 300, spiritBonus: 320, specialEffect: '受到攻击时有几率完全闪避' },
    battleEffect: {
      type: 'buff',
      name: '虚无化形',
      description: '消耗39年寿命，获得闪避率+80%、攻击无视防御的增益，持续5回合',
      cost: { lifespan: 39 },
      effect: {
        buff: { dodge: 0.8, ignoreDefense: true, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_016': {
    id: 'hee_016',
    name: '永恒之火',
    description: '永不熄灭的永恒火焰',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 105,
    effects: { attackBonus: 380, spiritBonus: 300, specialEffect: '攻击附带永恒灼烧，无法被熄灭' },
    battleEffect: {
      type: 'damage',
      name: '永恒灼烧',
      description: '消耗40年寿命，造成攻击力5倍伤害，附带永恒灼烧（每回合损失10%最大气血），持续5回合',
      cost: { lifespan: 40 },
      effect: {
        damage: { multiplier: 5 },
        debuff: { hp: -0.1, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hee_017': {
    id: 'hee_017',
    name: '不朽之木',
    description: '永恒不朽的神木精华',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 110,
    effects: { hpBonus: 1500, defenseBonus: 250, specialEffect: '生命恢复速度大幅提升' },
    battleEffect: {
      type: 'heal',
      name: '不朽回春',
      description: '消耗41年寿命，恢复55%最大气血，并每回合恢复12%最大气血，持续5回合',
      cost: { lifespan: 41 },
      effect: {
        heal: { percentOfMaxHp: 0.55 },
        buff: { regen: 0.12, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_018': {
    id: 'hee_018',
    name: '天道碎片',
    description: '破碎的天道法则',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 115,
    effects: { spiritBonus: 400, attackBonus: 300, defenseBonus: 280, specialEffect: '所有法术威力提升' },
    battleEffect: {
      type: 'buff',
      name: '天道之力',
      description: '消耗42年寿命，获得全属性+45%的增益，持续5回合',
      cost: { lifespan: 42 },
      effect: {
        buff: { attack: 0.45, defense: 0.45, spirit: 0.45, physique: 0.45, speed: 0.45, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hee_019': {
    id: 'hee_019',
    name: '混沌青莲',
    description: '混沌中诞生的青莲精华',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 120,
    effects: { hpBonus: 1200, spiritBonus: 450, specialEffect: '灵力上限大幅提升，修炼速度加快' },
    battleEffect: {
      type: 'buff',
      name: '青莲绽放',
      description: '消耗43年寿命，获得灵力+70%、气血上限+50%的增益，持续6回合',
      cost: { lifespan: 43 },
      effect: {
        buff: { spirit: 0.7, maxHp: 0.5, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hee_020': {
    id: 'hee_020',
    name: '盘古精血',
    description: '开天辟地盘古的精血',
    rarity: '稀有',
    advancedItemType: 'heavenEarthEssence',
    quality: 125,
    effects: { physiqueBonus: 200, hpBonus: 2000, attackBonus: 400, specialEffect: '物理伤害大幅提升' },
    battleEffect: {
      type: 'buff',
      name: '盘古开天',
      description: '消耗44年寿命，获得攻击力+70%、体魄+60%、每回合恢复12%最大气血的增益，持续6回合',
      cost: { lifespan: 44 },
      effect: {
        buff: { attack: 0.7, physique: 0.6, regen: 0.12, duration: 6 }
      },
      cooldown: 7
    }
  },

  // 传说天地精华 (10种)
  'hee_021': {
    id: 'hee_021',
    name: '女娲石',
    description: '女娲补天所用的神石精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 130,
    effects: { defenseBonus: 500, spiritBonus: 600, specialEffect: '法术防御大幅提升，灵力恢复速度加快' },
    battleEffect: {
      type: 'buff',
      name: '女娲补天',
      description: '消耗50年寿命，获得灵力+80%、防御力+70%、法术防御+60%的增益，持续6回合',
      cost: { lifespan: 50 },
      effect: {
        buff: { spirit: 0.8, defense: 0.7, magicDefense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_022': {
    id: 'hee_022',
    name: '东皇钟',
    description: '上古神器东皇钟的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 135,
    effects: { defenseBonus: 600, hpBonus: 1800, specialEffect: '受到伤害大幅减少，反弹伤害给攻击者' },
    battleEffect: {
      type: 'buff',
      name: '东皇护体',
      description: '消耗55年寿命，获得防御力+80%、受到伤害减少50%、反弹40%伤害的增益，持续6回合',
      cost: { lifespan: 55 },
      effect: {
        buff: { defense: 0.8, damageReduction: 0.5, reflectDamage: 0.4, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_023': {
    id: 'hee_023',
    name: '轩辕剑',
    description: '人族圣剑轩辕剑的剑意',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 140,
    effects: { attackBonus: 700, speedBonus: 80, specialEffect: '攻击力大幅提升，对邪魔伤害翻倍' },
    battleEffect: {
      type: 'damage',
      name: '轩辕斩魔',
      description: '消耗52年寿命，造成攻击力6倍伤害，无视50%防御，对邪魔伤害翻倍',
      cost: { lifespan: 52 },
      effect: {
        damage: { multiplier: 6, ignoreDefense: 0.5, demonMultiplier: 2.0 }
      },
      cooldown: 6
    }
  },
  'hee_024': {
    id: 'hee_024',
    name: '昆仑镜',
    description: '可窥探天机的神镜精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 145,
    effects: { spiritBonus: 700, speedBonus: 100, specialEffect: '先手几率大幅提升，看破敌人招式' },
    battleEffect: {
      type: 'buff',
      name: '昆仑洞察',
      description: '消耗53年寿命，获得速度+100%、闪避率+70%、攻击无视防御的增益，持续5回合',
      cost: { lifespan: 53 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, ignoreDefense: true, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hee_025': {
    id: 'hee_025',
    name: '伏羲琴',
    description: '可操控音律的神琴精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 150,
    effects: { spiritBonus: 800, hpBonus: 1500, specialEffect: '音律法术威力大幅提升' },
    battleEffect: {
      type: 'damage',
      name: '伏羲天音',
      description: '消耗54年寿命，造成攻击力5.5倍伤害，并降低敌人所有属性30%，持续4回合',
      cost: { lifespan: 54 },
      effect: {
        damage: { multiplier: 5.5 },
        debuff: { attack: -0.3, defense: -0.3, spirit: -0.3, duration: 4 }
      },
      cooldown: 6
    }
  },
  'hee_026': {
    id: 'hee_026',
    name: '神农鼎',
    description: '可炼制神药的宝鼎精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 155,
    effects: { hpBonus: 3000, physiqueBonus: 300, specialEffect: '生命恢复速度极快，中毒抗性提升' },
    battleEffect: {
      type: 'heal',
      name: '神农回生',
      description: '消耗56年寿命，恢复70%最大气血，清除所有负面状态，并每回合恢复18%最大气血，持续6回合',
      cost: { lifespan: 56 },
      effect: {
        heal: { percentOfMaxHp: 0.7 },
        buff: { regen: 0.18, cleanse: true, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hee_027': {
    id: 'hee_027',
    name: '太极阴阳图',
    description: '蕴含阴阳大道的至宝精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 160,
    effects: { hpBonus: 2000, attackBonus: 500, defenseBonus: 500, spiritBonus: 600, specialEffect: '阴阳平衡，万法不侵' },
    battleEffect: {
      type: 'buff',
      name: '太极平衡',
      description: '消耗57年寿命，获得全属性+60%、免疫所有负面状态、反弹50%伤害的增益，持续7回合',
      cost: { lifespan: 57 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, immunity: true, reflectDamage: 0.5, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_028': {
    id: 'hee_028',
    name: '诛仙剑阵',
    description: '诛仙剑阵的杀伐精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 165,
    effects: { attackBonus: 800, speedBonus: 120, specialEffect: '攻击附带诛仙剑气，威力巨大' },
    battleEffect: {
      type: 'damage',
      name: '诛仙剑气',
      description: '消耗58年寿命，造成攻击力7倍伤害，无视60%防御，必定暴击',
      cost: { lifespan: 58 },
      effect: {
        damage: { multiplier: 7, ignoreDefense: 0.6, guaranteedCrit: true }
      },
      cooldown: 6
    }
  },
  'hee_029': {
    id: 'hee_029',
    name: '周天星斗',
    description: '周天星斗大阵的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 170,
    effects: { spiritBonus: 900, defenseBonus: 400, specialEffect: '星辰法术威力极大提升' },
    battleEffect: {
      type: 'buff',
      name: '星斗大阵',
      description: '消耗59年寿命，获得灵力+90%、防御力+60%的增益，并每回合对敌人造成攻击力1倍伤害，持续6回合',
      cost: { lifespan: 59 },
      effect: {
        buff: { spirit: 0.9, defense: 0.6, duration: 6 },
        debuff: { hp: -1.0, duration: 6 } // 每回合造成攻击力1倍伤害
      },
      cooldown: 8
    }
  },
  'hee_030': {
    id: 'hee_030',
    name: '都天神煞',
    description: '都天神煞大阵的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 175,
    effects: { attackBonus: 750, physiqueBonus: 400, specialEffect: '物理攻击附带神煞效果' },
    battleEffect: {
      type: 'damage',
      name: '神煞灭世',
      description: '消耗60年寿命，造成攻击力6.5倍伤害，无视55%防御，并降低敌人全属性40%，持续4回合',
      cost: { lifespan: 60 },
      effect: {
        damage: { multiplier: 6.5, ignoreDefense: 0.55 },
        debuff: { attack: -0.4, defense: -0.4, spirit: -0.4, duration: 4 }
      },
      cooldown: 6
    }
  },

  // 传说天地精华 (10种)
  'hee_031': {
    id: 'hee_031',
    name: '鸿蒙紫气',
    description: '开天辟地时的鸿蒙紫气',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 180,
    effects: { spiritBonus: 1200, hpBonus: 2500, specialEffect: '灵力上限极大提升，修炼速度极快' },
    battleEffect: {
      type: 'buff',
      name: '鸿蒙开天',
      description: '消耗70年寿命，获得灵力+120%、气血上限+80%的增益，持续7回合',
      cost: { lifespan: 70 },
      effect: {
        buff: { spirit: 1.2, maxHp: 0.8, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_032': {
    id: 'hee_032',
    name: '造化玉碟',
    description: '蕴含造化之力的玉碟精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 185,
    effects: { hpBonus: 3000, attackBonus: 900, defenseBonus: 700, spiritBonus: 1000, specialEffect: '所有属性大幅提升' },
    battleEffect: {
      type: 'buff',
      name: '造化之力',
      description: '消耗72年寿命，获得全属性+80%、暴击率+60%的增益，持续7回合',
      cost: { lifespan: 72 },
      effect: {
        buff: { attack: 0.8, defense: 0.8, spirit: 0.8, physique: 0.8, speed: 0.8, critChance: 0.6, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_033': {
    id: 'hee_033',
    name: '混沌钟',
    description: '混沌至宝混沌钟的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 190,
    effects: { defenseBonus: 1000, hpBonus: 4000, specialEffect: '防御力极强，可抵挡致命攻击' },
    battleEffect: {
      type: 'buff',
      name: '混沌护体',
      description: '消耗75年寿命，获得防御力+100%、受到伤害减少70%、免疫致命攻击的增益，持续7回合',
      cost: { lifespan: 75 },
      effect: {
        buff: { defense: 1.0, damageReduction: 0.7, immunity: true, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_034': {
    id: 'hee_034',
    name: '盘古斧',
    description: '开天辟地盘古斧的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 195,
    effects: { attackBonus: 1500, speedBonus: 150, specialEffect: '攻击力极强，可破开一切防御' },
    battleEffect: {
      type: 'damage',
      name: '盘古开天',
      description: '消耗73年寿命，造成攻击力8倍伤害，无视80%防御，必定暴击',
      cost: { lifespan: 73 },
      effect: {
        damage: { multiplier: 8, ignoreDefense: 0.8, guaranteedCrit: true }
      },
      cooldown: 7
    }
  },
  'hee_035': {
    id: 'hee_035',
    name: '乾坤鼎',
    description: '可炼化万物的乾坤鼎精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 200,
    effects: { spiritBonus: 1500, hpBonus: 3500, specialEffect: '灵力恢复速度极快，可炼化一切' },
    battleEffect: {
      type: 'buff',
      name: '乾坤炼化',
      description: '消耗74年寿命，获得灵力+110%、每回合恢复25%最大气血的增益，持续7回合',
      cost: { lifespan: 74 },
      effect: {
        buff: { spirit: 1.1, regen: 0.25, duration: 7 }
      },
      cooldown: 9
    }
  },
  'hee_036': {
    id: 'hee_036',
    name: '山河社稷图',
    description: '蕴含山河社稷的图卷精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 205,
    effects: { hpBonus: 5000, defenseBonus: 800, specialEffect: '生命值极高，可自成一方世界' },
    battleEffect: {
      type: 'heal',
      name: '山河守护',
      description: '消耗76年寿命，恢复100%最大气血，并获得防御力+90%的增益，持续8回合',
      cost: { lifespan: 76 },
      effect: {
        heal: { percentOfMaxHp: 1.0 },
        buff: { defense: 0.9, duration: 8 }
      },
      cooldown: 10
    }
  },
  'hee_037': {
    id: 'hee_037',
    name: '十二品莲台',
    description: '十二品莲台的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 210,
    effects: { spiritBonus: 1800, defenseBonus: 900, specialEffect: '灵力防御极强，可净化一切负面状态' },
    battleEffect: {
      type: 'buff',
      name: '莲台净化',
      description: '消耗77年寿命，获得灵力+130%、法术防御+100%、免疫所有负面状态的增益，持续8回合',
      cost: { lifespan: 77 },
      effect: {
        buff: { spirit: 1.3, magicDefense: 1.0, immunity: true, duration: 8 }
      },
      cooldown: 10
    }
  },
  'hee_038': {
    id: 'hee_038',
    name: '七宝妙树',
    description: '七宝妙树的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 215,
    effects: { attackBonus: 1200, spiritBonus: 1600, specialEffect: '法术攻击威力极大，可刷落一切法宝' },
    battleEffect: {
      type: 'damage',
      name: '七宝刷落',
      description: '消耗78年寿命，造成攻击力7.5倍伤害，无视70%防御，并降低敌人攻击力50%，持续5回合',
      cost: { lifespan: 78 },
      effect: {
        damage: { multiplier: 7.5, ignoreDefense: 0.7 },
        debuff: { attack: -0.5, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hee_039': {
    id: 'hee_039',
    name: '定海神珠',
    description: '定海神珠的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 220,
    effects: { spiritBonus: 2000, speedBonus: 200, specialEffect: '灵力控制极强，可定住一切' },
    battleEffect: {
      type: 'debuff',
      name: '定海神威',
      description: '消耗79年寿命，对敌人造成攻击力6倍伤害，并定住敌人（降低速度100%），持续4回合',
      cost: { lifespan: 79 },
      effect: {
        damage: { multiplier: 6 },
        debuff: { speed: -1.0, duration: 4 }
      },
      cooldown: 7
    }
  },
  'hee_040': {
    id: 'hee_040',
    name: '混沌珠',
    description: '混沌至宝混沌珠的精华',
    rarity: '传说',
    advancedItemType: 'heavenEarthEssence',
    quality: 225,
    effects: { hpBonus: 6000, attackBonus: 1800, defenseBonus: 1200, spiritBonus: 2500, specialEffect: '所有属性达到极致，混沌不灭' },
    battleEffect: {
      type: 'buff',
      name: '混沌不灭',
      description: '消耗80年寿命，获得全属性+100%、免疫所有伤害和负面状态、每回合恢复30%最大气血的增益，持续9回合',
      cost: { lifespan: 80 },
      effect: {
        buff: { attack: 1.0, defense: 1.0, spirit: 1.0, physique: 1.0, speed: 1.0, immunity: true, regen: 0.3, duration: 9 }
      },
      cooldown: 10
    }
  }
};

// 天地之髓系统（40种）
export const HEAVEN_EARTH_MARROWS: Record<string, HeavenEarthMarrow> = {
  // 普通天地之髓 (10种)
  'hem_001': {
    id: 'hem_001',
    name: '星辰髓',
    description: '蕴含星辰之力的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 30,
    refiningTime: 30,
    effects: { spiritBonus: 300, speedBonus: 40, specialEffect: '星辰法术威力提升，夜晚修炼速度加快' },
    battleEffect: {
      type: 'buff',
      name: '星辰之力',
      description: '消耗25年寿命，获得灵力+60%、速度+40%的增益，持续5回合',
      cost: { lifespan: 25 },
      effect: {
        buff: { spirit: 0.6, speed: 0.4, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_002': {
    id: 'hem_002',
    name: '月华髓',
    description: '月华凝聚的精华精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 35,
    refiningTime: 35,
    effects: { spiritBonus: 350, hpBonus: 800, specialEffect: '灵力恢复速度提升，月夜修炼效果增强' },
    battleEffect: {
      type: 'heal',
      name: '月华回春',
      description: '消耗28年寿命，恢复40%最大气血，并提升灵力50%，持续4回合',
      cost: { lifespan: 28 },
      effect: {
        heal: { percentOfMaxHp: 0.4 },
        buff: { spirit: 0.5, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hem_003': {
    id: 'hem_003',
    name: '日精髓',
    description: '太阳精华凝聚的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 40,
    refiningTime: 40,
    effects: { attackBonus: 400, physiqueBonus: 200, specialEffect: '攻击力提升，白日战斗威力增强' },
    battleEffect: {
      type: 'damage',
      name: '日精破邪',
      description: '消耗30年寿命，造成攻击力4.5倍伤害，无视40%防御，对邪魔伤害提升50%',
      cost: { lifespan: 30 },
      effect: {
        damage: { multiplier: 4.5, ignoreDefense: 0.4, demonMultiplier: 1.5 }
      },
      cooldown: 5
    }
  },
  'hem_004': {
    id: 'hem_004',
    name: '地脉髓',
    description: '大地脉络的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 45,
    refiningTime: 45,
    effects: { defenseBonus: 500, hpBonus: 1000, specialEffect: '防御力提升，大地守护效果' },
    battleEffect: {
      type: 'buff',
      name: '地脉守护',
      description: '消耗32年寿命，获得防御力+70%、受到伤害减少40%的增益，持续5回合',
      cost: { lifespan: 32 },
      effect: {
        buff: { defense: 0.7, damageReduction: 0.4, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hem_005': {
    id: 'hem_005',
    name: '天风髓',
    description: '九天之风的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 50,
    refiningTime: 50,
    effects: { speedBonus: 60, spiritBonus: 400, specialEffect: '速度大幅提升，风系法术威力增强' },
    battleEffect: {
      type: 'buff',
      name: '天风加速',
      description: '消耗33年寿命，获得速度+90%、闪避率+50%的增益，持续5回合',
      cost: { lifespan: 33 },
      effect: {
        buff: { speed: 0.9, dodge: 0.5, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_006': {
    id: 'hem_006',
    name: '雷劫髓',
    description: '雷劫中诞生的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 55,
    refiningTime: 55,
    effects: { attackBonus: 450, spiritBonus: 380, specialEffect: '雷系法术威力提升，渡劫成功率增加' },
    battleEffect: {
      type: 'damage',
      name: '雷劫天罚',
      description: '消耗35年寿命，造成攻击力5倍伤害，无视45%防御，并提升暴击率60%，持续3回合',
      cost: { lifespan: 35 },
      effect: {
        damage: { multiplier: 5, ignoreDefense: 0.45 },
        buff: { critChance: 0.6, duration: 3 }
      },
      cooldown: 5
    }
  },
  'hem_007': {
    id: 'hem_007',
    name: '火精髓',
    description: '纯阳火气的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 60,
    refiningTime: 60,
    effects: { attackBonus: 500, physiqueBonus: 250, specialEffect: '火系法术威力提升，攻击附带灼烧' },
    battleEffect: {
      type: 'damage',
      name: '真火焚天',
      description: '消耗36年寿命，造成攻击力5.2倍伤害，附带持续灼烧（每回合损失9%最大气血），持续4回合',
      cost: { lifespan: 36 },
      effect: {
        damage: { multiplier: 5.2 },
        debuff: { hp: -0.09, duration: 4 }
      },
      cooldown: 5
    }
  },
  'hem_008': {
    id: 'hem_008',
    name: '水精髓',
    description: '玄阴水气的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 65,
    refiningTime: 65,
    effects: { spiritBonus: 450, defenseBonus: 350, specialEffect: '水系法术威力提升，防御效果增强' },
    battleEffect: {
      type: 'buff',
      name: '玄水护体',
      description: '消耗37年寿命，获得防御力+60%、灵力+50%的增益，持续5回合',
      cost: { lifespan: 37 },
      effect: {
        buff: { defense: 0.6, spirit: 0.5, duration: 5 }
      },
      cooldown: 5
    }
  },
  'hem_009': {
    id: 'hem_009',
    name: '木精髓',
    description: '青木生机的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 70,
    refiningTime: 70,
    effects: { hpBonus: 1200, spiritBonus: 420, specialEffect: '生命恢复速度提升，木系法术威力增强' },
    battleEffect: {
      type: 'heal',
      name: '青木回春',
      description: '消耗38年寿命，恢复50%最大气血，并每回合恢复12%最大气血，持续5回合',
      cost: { lifespan: 38 },
      effect: {
        heal: { percentOfMaxHp: 0.5 },
        buff: { regen: 0.12, duration: 5 }
      },
      cooldown: 6
    }
  },
  'hem_010': {
    id: 'hem_010',
    name: '金精髓',
    description: '庚金锐气的精髓',
    rarity: '普通',
    advancedItemType: 'heavenEarthMarrow',
    quality: 75,
    refiningTime: 75,
    effects: { attackBonus: 550, defenseBonus: 400, specialEffect: '金属性法术威力提升，攻击穿透效果' },
    battleEffect: {
      type: 'damage',
      name: '庚金破甲',
      description: '消耗39年寿命，造成攻击力5.5倍伤害，无视50%防御',
      cost: { lifespan: 39 },
      effect: {
        damage: { multiplier: 5.5, ignoreDefense: 0.5 }
      },
      cooldown: 5
    }
  },

  // 稀有天地之髓 (10种)
  'hem_011': {
    id: 'hem_011',
    name: '时空髓',
    description: '时空法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 80,
    refiningTime: 80,
    effects: { speedBonus: 100, spiritBonus: 600, specialEffect: '时空法术威力极大提升，可操控时间流速' },
    battleEffect: {
      type: 'buff',
      name: '时空掌控',
      description: '消耗45年寿命，获得速度+100%、闪避率+70%的增益，持续6回合',
      cost: { lifespan: 45 },
      effect: {
        buff: { speed: 1.0, dodge: 0.7, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_012': {
    id: 'hem_012',
    name: '命运髓',
    description: '命运法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 85,
    refiningTime: 85,
    effects: { hpBonus: 2000, spiritBonus: 700, specialEffect: '气运极大提升，机缘获取几率大幅增加' },
    battleEffect: {
      type: 'buff',
      name: '命运眷顾',
      description: '消耗42年寿命，获得全属性+40%、暴击率+60%的增益，持续6回合',
      cost: { lifespan: 42 },
      effect: {
        buff: { attack: 0.4, defense: 0.4, spirit: 0.4, physique: 0.4, speed: 0.4, critChance: 0.6, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_013': {
    id: 'hem_013',
    name: '因果髓',
    description: '因果法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 90,
    refiningTime: 90,
    effects: { attackBonus: 800, defenseBonus: 600, specialEffect: '攻击附带因果反噬，防御可反弹伤害' },
    battleEffect: {
      type: 'buff',
      name: '因果反噬',
      description: '消耗44年寿命，获得攻击力+50%、反弹伤害+50%的增益，持续6回合',
      cost: { lifespan: 44 },
      effect: {
        buff: { attack: 0.5, reflectDamage: 0.5, duration: 6 }
      },
      cooldown: 7
    }
  },
  'hem_014': {
    id: 'hem_014',
    name: '轮回髓',
    description: '轮回法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 95,
    refiningTime: 95,
    effects: { hpBonus: 2500, spiritBonus: 800, specialEffect: '死亡时可轮回重生，保留部分修为' },
    battleEffect: {
      type: 'heal',
      name: '轮回重生',
      description: '消耗46年寿命，恢复70%最大气血，并获得复活标记（死亡时可复活一次，恢复50%气血）',
      cost: { lifespan: 46 },
      effect: {
        heal: { percentOfMaxHp: 0.7 },
        buff: { revive: 1, duration: -1 } // 永久标记
      },
      cooldown: 8
    }
  },
  'hem_015': {
    id: 'hem_015',
    name: '虚无髓',
    description: '虚无法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 100,
    refiningTime: 100,
    effects: { defenseBonus: 800, spiritBonus: 900, specialEffect: '可化为虚无，免疫大部分物理攻击' },
    battleEffect: {
      type: 'buff',
      name: '虚无之体',
      description: '消耗48年寿命，获得防御力+100%、闪避率+60%的增益，持续5回合',
      cost: { lifespan: 48 },
      effect: {
        buff: { defense: 1.0, dodge: 0.6, duration: 5 }
      },
      cooldown: 7
    }
  },
  'hem_016': {
    id: 'hem_016',
    name: '永恒髓',
    description: '永恒法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 105,
    refiningTime: 105,
    effects: { hpBonus: 3000, physiqueBonus: 500, specialEffect: '生命永恒不灭，寿命大幅延长' },
    battleEffect: {
      type: 'heal',
      name: '永恒不灭',
      description: '消耗50年寿命，恢复80%最大气血，并每回合恢复20%最大气血，持续7回合',
      cost: { lifespan: 50 },
      effect: {
        heal: { percentOfMaxHp: 0.8 },
        buff: { regen: 0.2, duration: 7 }
      },
      cooldown: 8
    }
  },
  'hem_017': {
    id: 'hem_017',
    name: '创造髓',
    description: '创造法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 110,
    refiningTime: 110,
    effects: { spiritBonus: 1200, attackBonus: 900, specialEffect: '可创造万物，法术威力极大提升' },
    battleEffect: {
      type: 'buff',
      name: '创造之力',
      description: '消耗52年寿命，获得灵力+120%、攻击力+80%的增益，持续6回合',
      cost: { lifespan: 52 },
      effect: {
        buff: { spirit: 1.2, attack: 0.8, duration: 6 }
      },
      cooldown: 8
    }
  },
  'hem_018': {
    id: 'hem_018',
    name: '毁灭髓',
    description: '毁灭法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 115,
    refiningTime: 115,
    effects: { attackBonus: 1500, speedBonus: 120, specialEffect: '毁灭一切，攻击力达到极致' },
    battleEffect: {
      type: 'damage',
      name: '毁灭一击',
      description: '消耗54年寿命，造成攻击力12倍伤害，无视80%防御',
      cost: { lifespan: 54 },
      effect: {
        damage: { multiplier: 12, ignoreDefense: 0.8 }
      },
      cooldown: 7
    }
  },
  'hem_019': {
    id: 'hem_019',
    name: '秩序髓',
    description: '秩序法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 120,
    refiningTime: 120,
    effects: { defenseBonus: 1000, spiritBonus: 1100, specialEffect: '建立秩序领域，防御力极强' },
    battleEffect: {
      type: 'buff',
      name: '秩序领域',
      description: '消耗56年寿命，获得防御力+120%、受到伤害减少60%的增益，持续7回合',
      cost: { lifespan: 56 },
      effect: {
        buff: { defense: 1.2, damageReduction: 0.6, duration: 7 }
      },
      cooldown: 8
    }
  },
  'hem_020': {
    id: 'hem_020',
    name: '混沌髓',
    description: '混沌法则的精髓',
    rarity: '稀有',
    advancedItemType: 'heavenEarthMarrow',
    quality: 125,
    refiningTime: 125,
    effects: { hpBonus: 3500, attackBonus: 1200, defenseBonus: 900, specialEffect: '混沌不灭，所有属性平衡提升' },
    battleEffect: {
      type: 'buff',
      name: '混沌之力',
      description: '消耗58年寿命，获得全属性+70%、每回合恢复15%最大气血的增益，持续7回合',
      cost: { lifespan: 58 },
      effect: {
        buff: { attack: 0.7, defense: 0.7, spirit: 0.7, physique: 0.7, speed: 0.7, regen: 0.15, duration: 7 }
      },
      cooldown: 8
    }
  },

  // 传说天地之髓 (10种)
  'hem_021': {
    id: 'hem_021',
    name: '天道髓',
    description: '天道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 130,
    refiningTime: 130,
    effects: { spiritBonus: 2000, hpBonus: 4000, specialEffect: '天道眷顾，修炼速度极快，机缘不断' }
  },
  'hem_022': {
    id: 'hem_022',
    name: '地道髓',
    description: '地道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 135,
    refiningTime: 135,
    effects: { defenseBonus: 1500, hpBonus: 5000, specialEffect: '大地守护，防御力极强，生命值极高' }
  },
  'hem_023': {
    id: 'hem_023',
    name: '人道髓',
    description: '人道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 140,
    refiningTime: 140,
    effects: { attackBonus: 1800, physiqueBonus: 800, specialEffect: '人道昌盛，攻击力极强，体魄强健' }
  },
  'hem_024': {
    id: 'hem_024',
    name: '鬼道髓',
    description: '鬼道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 145,
    refiningTime: 145,
    effects: { spiritBonus: 2200, speedBonus: 180, specialEffect: '鬼道神通，法术威力极大，速度极快' }
  },
  'hem_025': {
    id: 'hem_025',
    name: '妖道髓',
    description: '妖道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 150,
    refiningTime: 150,
    effects: { attackBonus: 2000, hpBonus: 4500, specialEffect: '妖道神通，攻击力极强，生命力旺盛' }
  },
  'hem_026': {
    id: 'hem_026',
    name: '魔道髓',
    description: '魔道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 155,
    refiningTime: 155,
    effects: { attackBonus: 2200, spiritBonus: 2400, specialEffect: '魔道神通，攻击力和灵力都达到极致' }
  },
  'hem_027': {
    id: 'hem_027',
    name: '佛道髓',
    description: '佛道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 160,
    refiningTime: 160,
    effects: { defenseBonus: 1800, spiritBonus: 2600, specialEffect: '佛道神通，防御力和灵力极强' }
  },
  'hem_028': {
    id: 'hem_028',
    name: '仙道髓',
    description: '仙道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 165,
    refiningTime: 165,
    effects: { hpBonus: 6000, spiritBonus: 2800, specialEffect: '仙道神通，生命力和灵力达到仙级' }
  },
  'hem_029': {
    id: 'hem_029',
    name: '神道髓',
    description: '神道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 170,
    refiningTime: 170,
    effects: { attackBonus: 2500, defenseBonus: 2000, specialEffect: '神道神通，攻击和防御都达到神级' }
  },
  'hem_030': {
    id: 'hem_030',
    name: '圣道髓',
    description: '圣道法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 175,
    refiningTime: 175,
    effects: { hpBonus: 8000, spiritBonus: 3000, specialEffect: '圣道神通，生命和灵力达到圣级' }
  },

  // 传说天地之髓 (10种)
  'hem_031': {
    id: 'hem_031',
    name: '鸿蒙髓',
    description: '鸿蒙未开时的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 180,
    refiningTime: 180,
    effects: { hpBonus: 10000, attackBonus: 3000, defenseBonus: 2500, spiritBonus: 4000, specialEffect: '鸿蒙不灭，所有属性达到极致' }
  },
  'hem_032': {
    id: 'hem_032',
    name: '混沌髓',
    description: '混沌初开的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 185,
    refiningTime: 185,
    effects: { attackBonus: 3500, spiritBonus: 4500, specialEffect: '混沌归一，攻击和灵力达到混沌级' }
  },
  'hem_033': {
    id: 'hem_033',
    name: '太初髓',
    description: '太初时代的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 190,
    refiningTime: 190,
    effects: { defenseBonus: 3000, hpBonus: 12000, specialEffect: '太初守护，防御和生命达到太初级' }
  },
  'hem_034': {
    id: 'hem_034',
    name: '造化髓',
    description: '造化法则的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 195,
    refiningTime: 195,
    effects: { spiritBonus: 5000, speedBonus: 300, specialEffect: '造化无穷，灵力和速度达到造化级' }
  },
  'hem_035': {
    id: 'hem_035',
    name: '命运髓',
    description: '命运长河的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 200,
    refiningTime: 200,
    effects: { hpBonus: 15000, spiritBonus: 5500, specialEffect: '命运主宰，生命和灵力达到命运级' }
  },
  'hem_036': {
    id: 'hem_036',
    name: '因果髓',
    description: '因果之网的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 205,
    refiningTime: 205,
    effects: { attackBonus: 4000, defenseBonus: 3500, specialEffect: '因果循环，攻击和防御达到因果级' }
  },
  'hem_037': {
    id: 'hem_037',
    name: '轮回髓',
    description: '轮回之轮的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 210,
    refiningTime: 210,
    effects: { hpBonus: 20000, physiqueBonus: 1500, specialEffect: '轮回不灭，生命和体魄达到轮回级' }
  },
  'hem_038': {
    id: 'hem_038',
    name: '时空髓',
    description: '时空长河的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 215,
    refiningTime: 215,
    effects: { speedBonus: 500, spiritBonus: 6000, specialEffect: '时空掌控，速度和灵力达到时空级' }
  },
  'hem_039': {
    id: 'hem_039',
    name: '永恒髓',
    description: '永恒之门的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 220,
    refiningTime: 220,
    effects: { hpBonus: 25000, defenseBonus: 4000, specialEffect: '永恒不灭，生命和防御达到永恒级' }
  },
  'hem_040': {
    id: 'hem_040',
    name: '大道髓',
    description: '大道本源的精髓',
    rarity: '传说',
    advancedItemType: 'heavenEarthMarrow',
    quality: 225,
    refiningTime: 225,
    effects: { hpBonus: 30000, attackBonus: 5000, defenseBonus: 4500, spiritBonus: 7000, speedBonus: 600, specialEffect: '大道归一，所有属性达到大道级' }
  }
};

// 规则之力系统
export const LONGEVITY_RULES: Record<string, LongevityRule> = {
  'lr_001': {
    id: 'lr_001',
    name: '时间规则',
    description: '掌控时间流速的规则之力',
    advancedItemType: 'longevityRule',
    power: 100,
    effects: { speedPercent: 0.5, specialEffect: '可操控时间流速，战斗中获得先手优势' },
    battleEffect: {
      type: 'buff',
      name: '时间加速',
      description: '消耗50年寿命，获得速度+150%、攻击力+50%的增益，持续6回合',
      cost: { lifespan: 50 },
      effect: {
        buff: { speed: 1.5, attack: 0.5, duration: 6 }
      },
      cooldown: 8
    }
  },
  'lr_002': {
    id: 'lr_002',
    name: '空间规则',
    description: '掌控空间移动的规则之力',
    advancedItemType: 'longevityRule',
    power: 95,
    effects: { defensePercent: 0.4, specialEffect: '可进行空间跳跃，闪避率大幅提升' },
    battleEffect: {
      type: 'buff',
      name: '空间跳跃',
      description: '消耗48年寿命，获得闪避率+80%、防御力+60%的增益，持续6回合',
      cost: { lifespan: 48 },
      effect: {
        buff: { dodge: 0.8, defense: 0.6, duration: 6 }
      },
      cooldown: 8
    }
  },
  'lr_003': {
    id: 'lr_003',
    name: '生命规则',
    description: '掌控生命力的规则之力',
    advancedItemType: 'longevityRule',
    power: 90,
    effects: { hpPercent: 0.6, specialEffect: '生命恢复速度极快，可复活一次' },
    battleEffect: {
      type: 'heal',
      name: '生命复苏',
      description: '消耗45年寿命，恢复60%最大气血，并每回合恢复15%最大气血，持续6回合',
      cost: { lifespan: 45 },
      effect: {
        heal: { percentOfMaxHp: 0.6 },
        buff: { regen: 0.15, duration: 6 }
      },
      cooldown: 7
    }
  },
  'lr_004': {
    id: 'lr_004',
    name: '死亡规则',
    description: '掌控死亡的规则之力',
    advancedItemType: 'longevityRule',
    power: 85,
    effects: { attackPercent: 0.5, specialEffect: '攻击附带死亡气息，有几率直接秒杀敌人' },
    battleEffect: {
      type: 'damage',
      name: '死亡审判',
      description: '消耗42年寿命，造成攻击力8倍伤害，无视60%防御',
      cost: { lifespan: 42 },
      effect: {
        damage: { multiplier: 8, ignoreDefense: 0.6 }
      },
      cooldown: 7
    }
  },
  'lr_005': {
    id: 'lr_005',
    name: '因果规则',
    description: '掌控因果联系的规则之力',
    advancedItemType: 'longevityRule',
    power: 80,
    effects: { spiritPercent: 0.4, specialEffect: '可改变因果，攻击必定命中' },
    battleEffect: {
      type: 'buff',
      name: '因果逆转',
      description: '消耗40年寿命，获得攻击力+60%、暴击率+70%的增益，持续5回合',
      cost: { lifespan: 40 },
      effect: {
        buff: { attack: 0.6, critChance: 0.7, duration: 5 }
      },
      cooldown: 7
    }
  },
  'lr_006': {
    id: 'lr_006',
    name: '命运规则',
    description: '掌控命运轨迹的规则之力',
    advancedItemType: 'longevityRule',
    power: 75,
    effects: { hpPercent: 0.3, attackPercent: 0.3, specialEffect: '气运极佳，机缘获取几率大幅提升' },
    battleEffect: {
      type: 'buff',
      name: '命运眷顾',
      description: '消耗38年寿命，获得全属性+50%、暴击伤害+100%的增益，持续5回合',
      cost: { lifespan: 38 },
      effect: {
        buff: { attack: 0.5, defense: 0.5, spirit: 0.5, physique: 0.5, speed: 0.5, critDamage: 1.0, duration: 5 }
      },
      cooldown: 7
    }
  },
  'lr_007': {
    id: 'lr_007',
    name: '创造规则',
    description: '掌控创造之力的规则',
    advancedItemType: 'longevityRule',
    power: 70,
    effects: { spiritPercent: 0.5, specialEffect: '可创造万物，法术威力极大提升' },
    battleEffect: {
      type: 'buff',
      name: '创造之力',
      description: '消耗35年寿命，获得灵力+100%、攻击力+70%的增益，持续5回合',
      cost: { lifespan: 35 },
      effect: {
        buff: { spirit: 1.0, attack: 0.7, duration: 5 }
      },
      cooldown: 6
    }
  },
  'lr_008': {
    id: 'lr_008',
    name: '毁灭规则',
    description: '掌控毁灭之力的规则',
    advancedItemType: 'longevityRule',
    power: 65,
    effects: { attackPercent: 0.6, specialEffect: '毁灭一切，攻击力达到极致' },
    battleEffect: {
      type: 'damage',
      name: '毁灭一击',
      description: '消耗33年寿命，造成攻击力10倍伤害，无视70%防御',
      cost: { lifespan: 33 },
      effect: {
        damage: { multiplier: 10, ignoreDefense: 0.7 }
      },
      cooldown: 6
    }
  },
  'lr_009': {
    id: 'lr_009',
    name: '秩序规则',
    description: '掌控秩序平衡的规则',
    advancedItemType: 'longevityRule',
    power: 60,
    effects: { defensePercent: 0.5, specialEffect: '建立秩序领域，防御力极强' },
    battleEffect: {
      type: 'buff',
      name: '秩序领域',
      description: '消耗30年寿命，获得防御力+100%、受到伤害减少50%的增益，持续6回合',
      cost: { lifespan: 30 },
      effect: {
        buff: { defense: 1.0, damageReduction: 0.5, duration: 6 }
      },
      cooldown: 6
    }
  },
  'lr_010': {
    id: 'lr_010',
    name: '混沌规则',
    description: '掌控混沌之力的规则',
    advancedItemType: 'longevityRule',
    power: 55,
    effects: { hpPercent: 0.4, attackPercent: 0.4, defensePercent: 0.4, specialEffect: '混沌不灭，所有属性平衡提升' },
    battleEffect: {
      type: 'buff',
      name: '混沌之力',
      description: '消耗28年寿命，获得全属性+60%、每回合恢复10%最大气血的增益，持续6回合',
      cost: { lifespan: 28 },
      effect: {
        buff: { attack: 0.6, defense: 0.6, spirit: 0.6, physique: 0.6, speed: 0.6, regen: 0.1, duration: 6 }
      },
      cooldown: 6
    }
  }
};

