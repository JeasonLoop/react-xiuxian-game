/**
 * 灵宠系统相关常量
 */

import { PetTemplate, PetSkill, ItemRarity } from '../types';

export const PET_SKILLS: PetSkill[] = [
  {
    id: 'skill-bite',
    name: '撕咬',
    description: '基础攻击技能',
    type: 'attack',
    effect: { damage: 10 },
  },
  {
    id: 'skill-heal',
    name: '治愈之光',
    description: '为主人恢复气血',
    type: 'support',
    effect: { heal: 50 },
  },
  {
    id: 'skill-protect',
    name: '守护',
    description: '提升主人防御',
    type: 'defense',
    effect: { buff: { defense: 100 } },
  },
  {
    id: 'skill-blessing',
    name: '祝福',
    description: '提升主人攻击和防御',
    type: 'support',
    effect: { buff: { attack: 150, defense: 75 } },
  },
];

// 灵宠进化材料池
export const PET_EVOLUTION_MATERIALS = [
  // 幼年期 -> 成熟期材料
  { name: '聚灵草', rarity: '普通' as ItemRarity, description: '蕴含灵气的灵草，可用于灵宠进化。' },
  { name: '妖兽内丹', rarity: '普通' as ItemRarity, description: '妖兽体内凝聚的内丹，蕴含妖力。' },
  { name: '灵兽精血', rarity: '稀有' as ItemRarity, description: '灵兽的精血，蕴含强大的生命力。' },
  { name: '月华石', rarity: '稀有' as ItemRarity, description: '吸收月华之力的灵石，可助灵宠进化。' },
  { name: '星辰碎片', rarity: '稀有' as ItemRarity, description: '来自星辰的碎片，蕴含神秘力量。' },
  { name: '龙鳞片', rarity: '传说' as ItemRarity, description: '真龙脱落的鳞片，极其珍贵。' },
  { name: '凤凰羽', rarity: '传说' as ItemRarity, description: '凤凰的羽毛，蕴含涅槃之力。' },
  { name: '麒麟角', rarity: '传说' as ItemRarity, description: '麒麟的角，拥有祥瑞之力。' },
  // 成熟期 -> 完全体材料
  { name: '仙灵果', rarity: '稀有' as ItemRarity, description: '仙灵树结出的果实，可大幅提升灵宠实力。' },
  { name: '九转金丹', rarity: '传说' as ItemRarity, description: '经过九次炼制的金丹，蕴含无上药力。' },
  { name: '天材地宝', rarity: '传说' as ItemRarity, description: '天地孕育的至宝，极其罕见。' },
  { name: '神兽精魄', rarity: '传说' as ItemRarity, description: '神兽的精魄，蕴含神兽之力。' },
  { name: '混沌石', rarity: '仙品' as ItemRarity, description: '来自混沌的奇石，蕴含创世之力。' },
  { name: '大道碎片', rarity: '仙品' as ItemRarity, description: '大道法则的碎片，可助灵宠突破极限。' },
  { name: '仙灵本源', rarity: '仙品' as ItemRarity, description: '仙灵的本源力量，极其珍贵。' },
  { name: '造化神液', rarity: '仙品' as ItemRarity, description: '造化之力凝聚的神液，可重塑灵宠。' },
];

// 从模板中随机选择一个名字
export const getRandomPetName = (template: PetTemplate): string => {
  if (template.nameVariants && template.nameVariants.length > 0) {
    return template.nameVariants[Math.floor(Math.random() * template.nameVariants.length)];
  }
  return template.name;
};


export const PET_TEMPLATES: PetTemplate[] = [
  {
    id: 'pet-spirit-fox',
    name: '灵狐',
    nameVariants: ['灵狐', '雪狐', '月狐', '银狐', '火狐', '风狐', '云狐', '星狐'],
    species: '狐族',
    description: '聪明伶俐的灵狐，擅长辅助。',
    rarity: '普通',
    image: '🦊',
    stageImages: {
      stage1: '🦊',
      stage2: '🎑',
    },
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-bite',
        name: '撕咬',
        description: '基础攻击',
        type: 'attack',
        effect: { damageMultiplier: 1.2 },
      },
      {
        id: 'skill-heal',
        name: '治愈之光',
        description: '恢复主人气血',
        type: 'support',
        effect: { healPercent: 0.15 },
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-fox-fire',
          name: '灵狐火',
          description: '发射灵气狐火，造成大量伤害',
          type: 'attack',
          effect: { damageMultiplier: 2.5 },
          cooldown: 3,
        }
      ],
      stage2: [
        {
          id: 'skill-fox-enchant',
          name: '天狐魅惑',
          description: '使敌人分神，造成精神伤害并降低防御',
          type: 'attack',
          effect: { damageMultiplier: 3.5, buff: { defensePercent: -0.2 } },
          cooldown: 5,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: '聚灵草', quantity: 5 }],
      },
      stage2: {
        level: 30,
        items: [{ name: '灵兽精血', quantity: 3 }, { name: '月华石', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '九尾灵狐',
      stage2: '天狐',
    },
  },
  {
    id: 'pet-thunder-tiger',
    name: '雷虎',
    nameVariants: ['雷虎', '雷霆虎', '闪电虎', '霹雳虎', '风暴虎', '狂雷虎', '天雷虎', '雷暴虎'],
    species: '虎族',
    description: '凶猛威武的雷虎，攻击力极强。',
    rarity: '稀有',
    image: '🐅',
    stageImages: {
      stage1: '🐆',
      stage2: '⚡',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-bite',
        name: '撕咬',
        description: '基础攻击',
        type: 'attack',
        effect: { damageMultiplier: 1.5 },
      },
      {
        id: 'skill-thunder',
        name: '雷击',
        description: '雷属性攻击',
        type: 'attack',
        effect: { damageMultiplier: 2.0 },
        cooldown: 3,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-thunder-roar',
          name: '雷霆咆哮',
          description: '震慑敌人，造成巨量伤害并提升主人攻击',
          type: 'attack',
          effect: { damageMultiplier: 4.0, buff: { attackPercent: 0.15 } },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-heavenly-thunder',
          name: '九天引雷',
          description: '引动九天神雷，毁灭性打击，且极大提升主人暴击',
          type: 'attack',
          effect: { damageMultiplier: 8.0, buff: { critChance: 0.25 } },
          cooldown: 6,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 3 }, { name: '星辰碎片', quantity: 2 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '龙鳞片', quantity: 2 }, { name: '神兽精魄', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '雷霆虎王',
      stage2: '雷神虎',
    },
  },
  {
    id: 'pet-phoenix',
    name: '凤凰',
    nameVariants: ['凤凰', '火凤', '炎凤', '赤凤', '金凤', '天凤', '神凤', '圣凤'],
    species: '神兽',
    description: '传说中的神兽凤凰，拥有强大的力量。',
    rarity: '仙品',
    image: '🦅',
    stageImages: {
      stage1: '🔥',
      stage2: '🌅',
    },
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-blessing',
        name: '神凤祝福',
        description: '大幅提升主人攻击与防御',
        type: 'support',
        effect: { buff: { attackPercent: 0.25, defensePercent: 0.25 } },
        cooldown: 5,
      },
      {
        id: 'skill-rebirth',
        name: '涅槃重生',
        description: '极大量恢复气血并清除负面状态',
        type: 'support',
        effect: { healPercent: 0.8 },
        cooldown: 10,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-phoenix-fire',
          name: '凤凰真火',
          description: '焚尽世间万物的神火，造成毁灭性伤害',
          type: 'attack',
          effect: { damageMultiplier: 10.0 },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-immortal-aura',
          name: '长生领域',
          description: '散发仙气，全属性获得跨越式提升',
          type: 'support',
          effect: { buff: { attackPercent: 0.5, defensePercent: 0.5, speedPercent: 0.3 } },
          cooldown: 8,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: '凤凰羽', quantity: 3 }, { name: '九转金丹', quantity: 2 }],
      },
      stage2: {
        level: 70,
        items: [{ name: '混沌石', quantity: 1 }, { name: '大道碎片', quantity: 1 }, { name: '仙灵本源', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '不死凤凰',
      stage2: '涅槃神凤',
    },
  },
  // 新增20种灵宠
  {
    id: 'pet-ice-dragon',
    name: '冰龙',
    nameVariants: ['冰龙', '寒冰龙', '霜龙', '雪龙', '冰霜龙', '极冰龙', '玄冰龙', '冰魄龙'],
    species: '龙族',
    description: '掌控寒冰之力的龙族，防御力极强。',
    rarity: '传说',
    image: '🐉',
    stageImages: {
      stage1: '🐲',
      stage2: '🧊',
    },
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-ice-breath',
        name: '冰霜吐息',
        description: '龙息攻击，造成范围伤害',
        type: 'attack',
        effect: { damageMultiplier: 3.0 },
        cooldown: 4,
      },
      {
        id: 'skill-ice-shield',
        name: '冰霜护盾',
        description: '大幅提升主人防御',
        type: 'defense',
        effect: { buff: { defensePercent: 0.3 } },
        cooldown: 5,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-ice-prison',
          name: '寒冰牢笼',
          description: '困住敌人并造成巨量伤害，同时降低敌速',
          type: 'attack',
          effect: { damageMultiplier: 6.0, buff: { speedPercent: -0.2 } },
          cooldown: 5,
        }
      ],
      stage2: [
        {
          id: 'skill-absolute-zero',
          name: '绝对零度',
          description: '极寒领域，冻结一切，造成毁灭性打击',
          type: 'attack',
          effect: { damageMultiplier: 12.0 },
          cooldown: 8,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 2 }, { name: '天材地宝', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '寒冰龙王',
      stage2: '极冰神龙',
    },
  },
  {
    id: 'pet-fire-bird',
    name: '火鸟',
    nameVariants: ['火鸟', '烈焰鸟', '炎鸟', '赤鸟', '火灵鸟', '炽鸟', '焚鸟', '火羽鸟'],
    species: '鸟族',
    description: '掌控火焰之力的灵鸟，攻击力强大。',
    rarity: '稀有',
    image: '🔥',
    stageImages: {
      stage1: '🐥',
      stage2: '🐦',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-fire-storm',
        name: '火焰风暴',
        description: '大范围火焰攻击',
        type: 'attack',
        effect: { damageMultiplier: 1.8 },
        cooldown: 3,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-fire-wing',
          name: '烈焰之翼',
          description: '挥动火翼，造成扇形伤害并提升主人速度',
          type: 'attack',
          effect: { damageMultiplier: 3.5, buff: { speedPercent: 0.15 } },
          cooldown: 3,
        }
      ],
      stage2: [
        {
          id: 'skill-vermilion-bird-strike',
          name: '朱雀神击',
          description: '化身朱雀冲击，造成毁灭性伤害',
          type: 'attack',
          effect: { damageMultiplier: 7.5 },
          cooldown: 6,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: '妖兽内丹', quantity: 5 }, { name: '灵兽精血', quantity: 2 }],
      },
      stage2: {
        level: 40,
        items: [{ name: '凤凰羽', quantity: 2 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '烈焰鸟',
      stage2: '朱雀',
    },
  },
  {
    id: 'pet-earth-turtle',
    name: '土龟',
    nameVariants: ['土龟', '石龟', '山龟', '地龟', '岩龟', '厚甲龟', '坚盾龟', '大地龟'],
    species: '龟族',
    description: '防御力极强的灵龟，擅长守护。',
    rarity: '普通',
    image: '🐢',
    stageImages: {
      stage1: '🛡️',
      stage2: '⛰️',
    },
    baseStats: { attack: 30, defense: 50, hp: 500, speed: 20 },
    skills: [
      {
        id: 'skill-earth-shield',
        name: '大地守护',
        description: '大幅提升主人防御',
        type: 'defense',
        effect: { buff: { defensePercent: 0.4 } },
        cooldown: 6,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-mystic-defense',
          name: '玄武御',
          description: '绝对防御，极大提升防御力',
          type: 'defense',
          effect: { buff: { defensePercent: 0.8 } },
          cooldown: 8,
        }
      ],
      stage2: [
        {
          id: 'skill-world-turtle',
          name: '撑天之力',
          description: '引动大地之力，固若金汤，提升全属性防御',
          type: 'defense',
          effect: { buff: { defensePercent: 1.5, attackPercent: 0.2 } },
          cooldown: 12,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 8 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 3 }, { name: '星辰碎片', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '玄龟',
      stage2: '玄武',
    },
  },
  {
    id: 'pet-wind-wolf',
    name: '风狼',
    nameVariants: ['风狼', '疾风狼', '追风狼', '旋风狼', '狂风狼', '风影狼', '风灵狼', '疾影狼'],
    species: '狼族',
    description: '速度极快的风狼，擅长突袭。',
    rarity: '稀有',
    image: '🐺',
    stageImages: {
      stage1: '🐕',
      stage2: '💨',
    },
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-wind-blade',
        name: '风刃',
        description: '极速风刃攻击',
        type: 'attack',
        effect: { damageMultiplier: 2.2 },
        cooldown: 2,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-howl',
          name: '月下长啸',
          description: '大幅提升主人攻击力与速度',
          type: 'support',
          effect: { buff: { attackPercent: 0.2, speedPercent: 0.2 } },
          cooldown: 6,
        }
      ],
      stage2: [
        {
          id: 'skill-celestial-wolf-slash',
          name: '天狼裂星',
          description: '跨越空间的斩击，瞬间爆发毁灭性伤害',
          type: 'attack',
          effect: { damageMultiplier: 6.5 },
          cooldown: 5,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '妖兽内丹', quantity: 3 }, { name: '灵兽精血', quantity: 1 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '星辰碎片', quantity: 4 }, { name: '仙灵果', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '疾风狼王',
      stage2: '天狼',
    },
  },
  {
    id: 'pet-water-serpent',
    name: '水蛇',
    nameVariants: ['水蛇', '灵水蛇', '碧水蛇', '清波蛇', '水灵蛇', '流波蛇', '水影蛇', '柔水蛇'],
    species: '蛇族',
    description: '灵活的水蛇，擅长治疗和辅助。',
    rarity: '普通',
    image: '🐍',
    baseStats: { attack: 50, defense: 25, hp: 500, speed: 30 },
    skills: [
      {
        id: 'skill-water-heal',
        name: '水疗术',
        description: '持续恢复主人气血',
        type: 'support',
        effect: { healPercent: 0.2 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: '聚灵草', quantity: 6 }],
      },
      stage2: {
        level: 30,
        items: [{ name: '月华石', quantity: 2 }, { name: '灵兽精血', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '水灵蛇',
      stage2: '蛟龙',
    },
  },
  {
    id: 'pet-shadow-cat',
    name: '影猫',
    nameVariants: ['影猫', '暗影猫', '夜猫', '幽影猫', '影灵猫', '暗夜猫', '影魅猫', '黑猫'],
    species: '猫族',
    description: '神秘的影猫，擅长暗影攻击。',
    rarity: '稀有',
    image: '🐱',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 50 },
    skills: [
      {
        id: 'skill-shadow-strike',
        name: '暗影突袭',
        description: '潜入阴影中的致命一击',
        type: 'attack',
        effect: { damageMultiplier: 3.2 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 3 }, { name: '星辰碎片', quantity: 2 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '麒麟角', quantity: 1 }, { name: '九转金丹', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '暗影猫王',
      stage2: '九命影猫',
    },
  },
  {
    id: 'pet-light-rabbit',
    name: '光兔',
    nameVariants: ['光兔', '月兔', '玉兔', '灵兔', '光灵兔', '圣光兔', '明兔', '辉兔'],
    species: '兔族',
    description: '温和的光兔，擅长辅助和治疗。',
    rarity: '普通',
    image: '🐰',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-light-blessing',
        name: '光明祝福',
        description: '恢复气血并提升主人攻击与防御',
        type: 'support',
        effect: { healPercent: 0.1, buff: { attackPercent: 0.1, defensePercent: 0.1 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 8 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 3 }, { name: '仙灵果', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '月兔',
      stage2: '玉兔',
    },
  },
  {
    id: 'pet-thunder-eagle',
    name: '雷鹰',
    nameVariants: ['雷鹰', '雷霆鹰', '闪电鹰', '天雷鹰', '雷暴鹰', '霹雳鹰', '雷神鹰', '风暴鹰'],
    species: '鹰族',
    description: '掌控雷电的雄鹰，攻击力强大。',
    rarity: '传说',
    image: '🦅',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-thunder-bolt',
        name: '雷霆一击',
        description: '强力雷属性攻击',
        type: 'attack',
        effect: { damageMultiplier: 4.5 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 2 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 2 }, { name: '天材地宝', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '雷神鹰',
      stage2: '天雷神鹰',
    },
  },
  {
    id: 'pet-poison-spider',
    name: '毒蛛',
    nameVariants: ['毒蛛', '剧毒蛛', '毒灵蛛', '毒影蛛', '毒王蛛', '毒液蛛', '毒刺蛛', '毒牙蛛'],
    species: '蛛族',
    description: '擅长用毒的灵蛛，攻击附带毒素。',
    rarity: '稀有',
    image: '🕷️',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-poison-bite',
        name: '毒牙',
        description: '带毒的持续伤害攻击，且降低敌方防御',
        type: 'attack',
        effect: { damageMultiplier: 2.8, buff: { defensePercent: -0.15 } },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '妖兽内丹', quantity: 4 }, { name: '灵兽精血', quantity: 2 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '麒麟角', quantity: 1 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '毒王蛛',
      stage2: '万毒蛛皇',
    },
  },
  {
    id: 'pet-forest-deer',
    name: '灵鹿',
    nameVariants: ['灵鹿', '仙鹿', '灵角鹿', '森林鹿', '自然鹿', '灵性鹿', '翠鹿', '绿鹿'],
    species: '鹿族',
    description: '温和的灵鹿，擅长辅助和恢复。',
    rarity: '普通',
    image: '🦌',
    baseStats: { attack: 50, defense: 30, hp: 500, speed: 35 },
    skills: [
      {
        id: 'skill-nature-heal',
        name: '自然治愈',
        description: '恢复主人大量气血',
        type: 'support',
        effect: { healPercent: 0.35 },
        cooldown: 4,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 12,
        items: [{ name: '聚灵草', quantity: 8 }],
      },
      stage2: {
        level: 35,
        items: [{ name: '月华石', quantity: 3 }, { name: '灵兽精血', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '仙鹿',
      stage2: '九色鹿',
    },
  },
  {
    id: 'pet-iron-bear',
    name: '铁熊',
    nameVariants: ['铁熊', '钢铁熊', '金刚熊', '铁甲熊', '坚盾熊', '重甲熊', '铁壁熊', '钢爪熊'],
    species: '熊族',
    description: '防御力极强的铁熊，擅长守护。',
    rarity: '稀有',
    image: '🐻',
    baseStats: { attack: 80, defense: 60, hp: 1000, speed: 25 },
    skills: [
      {
        id: 'skill-iron-defense',
        name: '钢铁守护',
        description: '大幅提升主人防御并略微回血',
        type: 'defense',
        effect: { healPercent: 0.1, buff: { defensePercent: 0.4 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 3 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '龙鳞片', quantity: 2 }, { name: '九转金丹', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '金刚熊',
      stage2: '神铁熊',
    },
  },
  {
    id: 'pet-crystal-butterfly',
    name: '晶蝶',
    nameVariants: ['晶蝶', '水晶蝶', '灵晶蝶', '彩晶蝶', '幻晶蝶', '星晶蝶', '月晶蝶', '光晶蝶'],
    species: '蝶族',
    description: '美丽的晶蝶，擅长辅助和增益。',
    rarity: '稀有',
    image: '🦋',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 45 },
    skills: [
      {
        id: 'skill-crystal-blessing',
        name: '晶华祝福',
        description: '全属性提升并提供闪避',
        type: 'support',
        effect: { buff: { attackPercent: 0.15, defensePercent: 0.15, dodge: 0.1 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 15,
        items: [{ name: '月华石', quantity: 3 }, { name: '灵兽精血', quantity: 2 }],
      },
      stage2: {
        level: 40,
        items: [{ name: '星辰碎片', quantity: 4 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '七彩晶蝶',
      stage2: '仙晶蝶',
    },
  },
  {
    id: 'pet-stone-golem',
    name: '石魔',
    nameVariants: ['石魔', '巨石魔', '山岳魔', '岩石魔', '坚石魔', '石巨人', '石像魔', '石灵魔'],
    species: '魔物',
    description: '防御力极强的石魔，擅长守护。',
    rarity: '传说',
    image: '🗿',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 30 },
    skills: [
      {
        id: 'skill-stone-wall',
        name: '石墙守护',
        description: '大幅提升主人防御并提供巨量护盾',
        type: 'defense',
        effect: { buff: { defensePercent: 0.5, hp: 1000 } },
        cooldown: 7,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '麒麟角', quantity: 2 }],
      },
      stage2: {
        level: 65,
        items: [{ name: '神兽精魄', quantity: 2 }, { name: '天材地宝', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '巨石魔',
      stage2: '山岳巨魔',
    },
  },
  {
    id: 'pet-void-owl',
    name: '虚空猫头鹰',
    nameVariants: ['虚空猫头鹰', '虚空鹰', '虚无鹰', '暗空鹰', '虚影鹰', '空灵鹰', '虚界鹰', '混沌鹰'],
    species: '鸟族',
    description: '掌控虚空之力的猫头鹰，神秘而强大。',
    rarity: '传说',
    image: '🦉',
    baseStats: { attack: 150, defense: 75, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-void-strike',
        name: '虚空打击',
        description: '无视防御的虚空攻击，并提升主人暴击',
        type: 'attack',
        effect: { damageMultiplier: 5.0, buff: { critChance: 0.15 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 28,
        items: [{ name: '龙鳞片', quantity: 2 }, { name: '凤凰羽', quantity: 2 }],
      },
      stage2: {
        level: 65,
        items: [{ name: '混沌石', quantity: 1 }, { name: '大道碎片', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '虚空神鹰',
      stage2: '混沌猫头鹰',
    },
  },
  {
    id: 'pet-golden-lion',
    name: '金狮',
    nameVariants: ['金狮', '黄金狮', '金毛狮', '金鬃狮', '金甲狮', '金辉狮', '金耀狮', '金王狮'],
    species: '狮族',
    description: '威严的金狮，攻击和防御均衡。',
    rarity: '传说',
    image: '🦁',
    baseStats: { attack: 150, defense: 100, hp: 2000, speed: 50 },
    skills: [
      {
        id: 'skill-golden-roar',
        name: '黄金咆哮',
        description: '提升主人全方位攻防属性',
        type: 'support',
        effect: { buff: { attackPercent: 0.2, defensePercent: 0.2 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 25,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '麒麟角', quantity: 1 }],
      },
      stage2: {
        level: 60,
        items: [{ name: '神兽精魄', quantity: 2 }, { name: '天材地宝', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '黄金狮王',
      stage2: '神金狮',
    },
  },
  {
    id: 'pet-silver-fox',
    name: '银狐',
    nameVariants: ['银狐', '月银狐', '银光狐', '银雪狐', '银月狐', '银辉狐', '银灵狐', '银影狐'],
    species: '狐族',
    description: '优雅的银狐，擅长速度和辅助。',
    rarity: '稀有',
    image: '🦊',
    baseStats: { attack: 100, defense: 50, hp: 1000, speed: 55 },
    skills: [
      {
        id: 'skill-silver-flash',
        name: '银光闪',
        description: '极速闪击，并提升主人速度',
        type: 'attack',
        effect: { damageMultiplier: 1.5, buff: { speedPercent: 0.1 } },
        cooldown: 3,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 18,
        items: [{ name: '月华石', quantity: 3 }, { name: '灵兽精血', quantity: 2 }],
      },
      stage2: {
        level: 45,
        items: [{ name: '星辰碎片', quantity: 4 }, { name: '仙灵果', quantity: 2 }],
      },
    },
    evolutionNames: {
      stage1: '月银狐',
      stage2: '天银狐',
    },
  },
  {
    id: 'pet-rainbow-peacock',
    name: '彩孔雀',
    nameVariants: ['彩孔雀', '七彩孔雀', '彩虹孔雀', '彩羽孔雀', '彩灵孔雀', '彩霞孔雀', '彩云孔雀', '彩光孔雀'],
    species: '鸟族',
    description: '美丽的彩孔雀，擅长辅助和增益。',
    rarity: '稀有',
    image: '🦚',
    baseStats: { attack: 100, defense: 60, hp: 1000, speed: 40 },
    skills: [
      {
        id: 'skill-rainbow-dance',
        name: '彩虹之舞',
        description: '大幅提升主人攻击与防御',
        type: 'support',
        effect: { buff: { attackPercent: 0.2, defensePercent: 0.2 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '月华石', quantity: 4 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '凤凰羽', quantity: 2 }, { name: '仙灵果', quantity: 3 }],
      },
    },
    evolutionNames: {
      stage1: '七彩孔雀',
      stage2: '仙孔雀',
    },
  },
  {
    id: 'pet-dark-dragon',
    name: '暗龙',
    nameVariants: ['暗龙', '暗黑龙', '黑魔龙', '暗影龙', '幽冥龙', '暗夜龙', '暗灵龙', '暗渊龙'],
    species: '龙族',
    description: '掌控黑暗之力的暗龙，攻击力极强。',
    rarity: '仙品',
    image: '🐲',
    baseStats: { attack: 200, defense: 100, hp: 2500, speed: 50 },
    skills: [
      {
        id: 'skill-dark-blast',
        name: '暗黑冲击',
        description: '极强暗属性攻击',
        type: 'attack',
        effect: { damageMultiplier: 5.5 },
        cooldown: 4,
      },
      {
        id: 'skill-dark-shield',
        name: '暗黑护盾',
        description: '大幅提升防御并中量回血',
        type: 'defense',
        effect: { buff: { defensePercent: 0.4 }, healPercent: 0.2 },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '龙鳞片', quantity: 4 }, { name: '神兽精魄', quantity: 2 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '混沌石', quantity: 2 }, { name: '大道碎片', quantity: 2 }, { name: '造化神液', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '暗黑龙王',
      stage2: '混沌暗龙',
    },
  },
  {
    id: 'pet-light-unicorn',
    name: '光独角兽',
    nameVariants: ['光独角兽', '圣光独角兽', '神圣独角兽', '光明独角兽', '天光独角兽', '神光独角兽', '圣洁独角兽', '光辉独角兽'],
    species: '神兽',
    description: '神圣的光独角兽，擅长治疗 and 辅助。',
    rarity: '仙品',
    image: '🦄',
    baseStats: { attack: 200, defense: 120, hp: 2500, speed: 60 },
    skills: [
      {
        id: 'skill-holy-heal',
        name: '神圣治愈',
        description: '恢复主人大量气血',
        type: 'support',
        effect: { healPercent: 0.5 },
        cooldown: 4,
      },
      {
        id: 'skill-holy-blessing',
        name: '神圣祝福',
        description: '跨越式提升主人全属性',
        type: 'support',
        effect: { buff: { attackPercent: 0.3, defensePercent: 0.3, speedPercent: 0.2 } },
        cooldown: 6,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '麒麟角', quantity: 3 }, { name: '九转金丹', quantity: 2 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '仙灵本源', quantity: 1 }, { name: '造化神液', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '圣光独角兽',
      stage2: '神光独角兽',
    },
  },
  {
    id: 'pet-ice-phoenix',
    name: '冰凤凰',
    nameVariants: ['冰凤凰', '寒冰凤凰', '冰霜凤凰', '极冰凤凰', '玄冰凤凰', '冰魄凤凰', '雪凤', '冰灵凤凰'],
    species: '神兽',
    description: '掌控寒冰的凤凰，防御 and 治疗并重。',
    rarity: '仙品',
    image: '❄️',
    baseStats: { attack: 200, defense: 130, hp: 2500, speed: 55 },
    skills: [
      {
        id: 'skill-ice-storm',
        name: '冰霜风暴',
        description: '寒冰打击敌人，并降低其速度',
        type: 'attack',
        effect: { damageMultiplier: 4.5, buff: { speedPercent: -0.2 } },
        cooldown: 5,
      },
      {
        id: 'skill-ice-recovery',
        name: '冰霜恢复',
        description: '恢复气血并大幅提升主人防御',
        type: 'support',
        effect: { healPercent: 0.3, buff: { defensePercent: 0.4 } },
        cooldown: 5,
      },
    ],
    evolutionRequirements: {
      stage1: {
        level: 35,
        items: [{ name: '凤凰羽', quantity: 4 }, { name: '神兽精魄', quantity: 2 }],
      },
      stage2: {
        level: 75,
        items: [{ name: '混沌石', quantity: 2 }, { name: '大道碎片', quantity: 2 }, { name: '仙灵本源', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '寒冰凤凰',
      stage2: '极冰神凤',
    },
  },
];
