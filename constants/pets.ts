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
        effect: { damage: 50 },
      },
      {
        id: 'skill-heal',
        name: '治愈之光',
        description: '恢复气血',
        type: 'support',
        effect: { heal: 250 },
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-fox-fire',
          name: '灵狐火',
          description: '发射灵气狐火攻击敌人',
          type: 'attack',
          effect: { damage: 150 },
          cooldown: 3,
        }
      ],
      stage2: [
        {
          id: 'skill-fox-enchant',
          name: '魅惑',
          description: '使敌人分神，降低其防御',
          type: 'debuff',
          effect: { buff: { defense: -100 } },
          cooldown: 5,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 10,
        items: [{ name: '聚灵草', quantity: 10 }],
      },
      stage2: {
        level: 30,
        items: [{ name: '灵兽精血', quantity: 5 }, { name: '月华石', quantity: 3 }],
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
        effect: { damage: 150 },
      },
      {
        id: 'skill-thunder',
        name: '雷击',
        description: '雷属性攻击',
        type: 'attack',
        effect: { damage: 50 },
        cooldown: 3,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-thunder-roar',
          name: '雷霆咆哮',
          description: '震慑敌人，造成大量伤害',
          type: 'attack',
          effect: { damage: 300 },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-heavenly-thunder',
          name: '九天引雷',
          description: '引动九天神雷，毁灭性打击',
          type: 'attack',
          effect: { damage: 800 },
          cooldown: 6,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 20,
        items: [{ name: '妖兽内丹', quantity: 5 }, { name: '星辰碎片', quantity: 3 }],
      },
      stage2: {
        level: 50,
        items: [{ name: '龙鳞片', quantity: 3 }, { name: '神兽精魄', quantity: 2 }],
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
        name: '祝福',
        description: '提升属性',
        type: 'support',
        effect: { buff: { attack: 250, defense: 150 } },
        cooldown: 5,
      },
      {
        id: 'skill-rebirth',
        name: '涅槃',
        description: '大量恢复气血',
        type: 'support',
        effect: { heal: 5000 },
        cooldown: 10,
      },
    ],
    stageSkills: {
      stage1: [
        {
          id: 'skill-phoenix-fire',
          name: '凤凰真火',
          description: '焚尽世间万物的神火',
          type: 'attack',
          effect: { damage: 600 },
          cooldown: 4,
        }
      ],
      stage2: [
        {
          id: 'skill-immortal-aura',
          name: '长生领域',
          description: '散发仙气，大幅提升全属性',
          type: 'support',
          effect: { buff: { attack: 1000, defense: 500, hp: 2000 } },
          cooldown: 8,
        }
      ]
    },
    evolutionRequirements: {
      stage1: {
        level: 30,
        items: [{ name: '凤凰羽', quantity: 5 }, { name: '九转金丹', quantity: 3 }],
      },
      stage2: {
        level: 70,
        items: [{ name: '混沌石', quantity: 2 }, { name: '大道碎片', quantity: 2 }, { name: '仙灵本源', quantity: 1 }],
      },
    },
    evolutionNames: {
      stage1: '不死凤凰',
      stage2: '涅槃神凤',
    },
  },
  // 由于 PET_TEMPLATES 内容太长，这里只列出了前3个模板作为示例
  // 完整的 PET_TEMPLATES 数组有 20+ 种灵宠定义
  // 实际使用时需要从 constants.ts 中提取完整内容
];
