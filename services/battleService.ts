import {
  AdventureResult,
  AdventureType,
  PlayerStats,
  RealmType,
  ItemRarity,
  ItemType,
  EquipmentSlot,
  BattleState,
  BattleUnit,
  BattleSkill,
  BattleAction,
  PlayerAction,
  Buff,
  Debuff,
  Item,
  Pet,
  PetSkill,
  SectRank,
} from '../types';
import {
  REALM_ORDER,
  REALM_DATA,
  DISCOVERABLE_RECIPES,
  CULTIVATION_ARTS,
  CULTIVATION_ART_BATTLE_SKILLS,
  ARTIFACT_BATTLE_SKILLS,
  WEAPON_BATTLE_SKILLS,
  BATTLE_POTIONS,
  SECT_MASTER_CHALLENGE_REQUIREMENTS,
  HEAVEN_EARTH_SOUL_BOSSES,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../constants/index';
import { getPlayerTotalStats } from '../utils/statUtils';
import { getRandomEnemyName } from './templateService';
import { logger } from '../utils/logger';
import { getItemsByType } from '../utils/itemConstantsUtils';


const randomId = () => Math.random().toString(36).slice(2, 9);

// ==================== 配置常量 ====================

const ENEMY_NAMES = [
  // 妖兽类
  '血牙狼', '裂地熊', '玄煞蛛', '阴焰鸦', '噬魂藤', '赤纹虎', '蓝鬃豹', '铁背猿', '骨鳞蜥', '黄泉使',
  '暗影豹', '雷霆狮', '冰霜蛇', '烈焰鸟', '风暴鹰', '毒沼鳄', '石甲龟', '幻影狐', '幽冥猫', '金角牛',
  '银鳞鱼', '黑翼蝠', '紫电貂', '青鳞蟒', '赤目猴', '白毛象', '灰鬃马', '绿眼狼', '黄沙蝎', '黑水蛇',
  '红尾狐', '蓝羽雀',
  // 修士类
  '星落修士', '魇沙客', '断魂剑客', '血手魔修', '鬼面道人', '邪心散修', '暗影刺客', '狂刀武修', '毒手药师',
  '阴煞老怪', '血魔真人', '白骨道人', '黑风散人', '赤发魔君', '青面鬼修', '紫袍邪修', '灰衣杀手', '白衣剑客',
  '黑衣刀客', '红衣魔女', '绿袍毒师',
  // 特殊类
  '护宝傀儡', '机关兽', '石像守卫', '木偶人', '铁甲兵', '铜人阵', '银甲卫', '金甲将', '怨灵', '恶鬼',
  '僵尸', '骷髅', '幽灵', '魔物', '邪灵', '妖魂',
];

const ENEMY_TITLES = [
  // 妖兽称号
  '荒原妖兽', '巡山妖将', '秘境妖兽', '深山老妖', '古林妖王', '血海妖尊', '魔域妖将', '妖山统领', '妖谷守护',
  '妖洞领主', '妖林霸主', '妖域先锋', '妖界战将',
  // 修士称号
  '堕落修士', '邪修', '魔道散修', '血魔修士', '鬼道真人', '邪道魔君', '魔门长老', '邪派护法', '魔教使者',
  '邪宗弟子', '魔道散人', '邪门高手', '魔修强者',
  // 守卫称号
  '秘境守卫', '护宝傀儡', '遗迹守护', '古墓守卫', '洞府守护', '宝库守卫', '禁地守卫', '秘地守护', '禁制守卫',
  '法阵守护', '机关守卫', '石像守卫',
  // 其他称号
  '荒野游魂', '古战场怨灵', '迷失修士', '堕落真人', '被诅咒者', '魔化修士', '邪化妖兽',
];

/**
 * 风险等级奖励倍数配置
 */
const RISK_REWARD_MULTIPLIERS = {
  低: 1.0,
  中: 1.3,
  高: 1.6,
  极度危险: 2.2,
};

/**
 * 功法品级基础倍数
 */
const GRADE_MULTIPLIERS: Record<string, number> = {
  '黄': 1.0,
  '玄': 1.5,
  '地': 2.5,
  '天': 4.0,
};

/**
 * 技能威力品级加成
 */
const GRADE_POWER_BONUS: Record<string, { baseDamage: number; damageMultiplier: number; critChance: number; critMultiplier: number }> = {
  '黄': { baseDamage: 5, damageMultiplier: 0, critChance: 0, critMultiplier: 0 },
  '玄': { baseDamage: 10, damageMultiplier: 0.1, critChance: 0.02, critMultiplier: 0.1 },
  '地': { baseDamage: 20, damageMultiplier: 0.2, critChance: 0.05, critMultiplier: 0.2 },
  '天': { baseDamage: 40, damageMultiplier: 0.35, critChance: 0.08, critMultiplier: 0.3 },
};

// ==================== 预构建映射表 ====================

// 预构建法宝和武器技能映射表，避免在战斗中重复构建
const ARTIFACT_SKILLS_MAP = new Map<string, BattleSkill[]>();
const WEAPON_SKILLS_MAP = new Map<string, BattleSkill[]>();

const initializeSkillMaps = () => {
  Object.entries(ARTIFACT_BATTLE_SKILLS).forEach(([key, skillArray]) => {
    ARTIFACT_SKILLS_MAP.set(key, skillArray);
    skillArray.forEach((skill) => {
      if (skill.sourceId && !ARTIFACT_SKILLS_MAP.has(skill.sourceId)) {
        ARTIFACT_SKILLS_MAP.set(skill.sourceId, skillArray);
      }
    });
  });

  Object.entries(WEAPON_BATTLE_SKILLS).forEach(([key, skillArray]) => {
    WEAPON_SKILLS_MAP.set(key, skillArray);
    skillArray.forEach((skill) => {
      if (skill.sourceId && !WEAPON_SKILLS_MAP.has(skill.sourceId)) {
        WEAPON_SKILLS_MAP.set(skill.sourceId, skillArray);
      }
    });
  });
};

initializeSkillMaps();

// ==================== 工具函数 ====================

/**
 * 获取风险等级奖励倍数
 */
const getRiskRewardMultiplier = (riskLevel?: '低' | '中' | '高' | '极度危险'): number => {
  return riskLevel ? (RISK_REWARD_MULTIPLIERS[riskLevel] || 1.0) : 1.0;
};

// 根据风险等级计算战斗难度
const getBattleDifficulty = (

  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): number => {
  if (adventureType === 'secret_realm' && riskLevel) {
    // 秘境根据风险等级调整难度（扩大差异使风险等级名称与实际难度匹配）
    const riskMultipliers = {
      低: 0.6,      // 降低难度，适合刷级
      中: 1.0,       // 标准难度
      高: 1.5,       // 提高难度，增加挑战
      极度危险: 2.2, // 大幅提高难度，名副其实的"极度危险"
    };
    return riskMultipliers[riskLevel];
  }
  // 非秘境使用固定难度
  const baseDifficulty: Record<AdventureType, number> = {
    normal: 1,
    lucky: 0.85,
    secret_realm: 1.25,
    sect_challenge: 1.5, // 宗主挑战难度稍微下调，从2.0降至1.8
    dao_combining_challenge: 2.0, // 天地之魄挑战难度
  };
  return baseDifficulty[adventureType];
};

const baseBattleChance: Record<AdventureType, number> = {
  normal: 0.25, // 历练基础概率降低到25%
  lucky: 0.12, // 机缘历练基础概率降低到12%
  secret_realm: 0.45, // 秘境基础概率降低到45%
  sect_challenge: 1.0, // 挑战必然触发
  dao_combining_challenge: 1.0, // 天地之魄挑战必然触发
};

// Fisher-Yates 洗牌算法，用于打乱数组顺序
const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 改进的随机选择函数，先打乱数组再选择，增加随机性
const pickOne = <T>(list: T[]): T => {
  if (list.length === 0) throw new Error('Cannot pick from empty list');
  // 对于小数组，直接随机选择；对于大数组，先打乱再选择
  if (list.length <= 10) {
    return list[Math.floor(Math.random() * list.length)];
  }
  // 对于大数组，打乱后选择，增加随机性
  const shuffled = shuffle(list);
  return shuffled[Math.floor(Math.random() * shuffled.length)];
};

// 搜刮奖励物品名称库（全部从常量池获取，确保数据一致性）
export const LOOT_ITEMS = {
  // 草药类
  herbs: (() => getItemsByType(ItemType.Herb))(),
  // 丹药类
  pills: (() => getItemsByType(ItemType.Pill))(),
  // 材料类
  materials: (() => getItemsByType(ItemType.Material))(),
  // 装备类（武器）
  weapons: (() => getItemsByType(ItemType.Weapon))(),
  // 装备类（护甲）
  armors: (() => getItemsByType(ItemType.Armor))(),
  // 首饰类
  accessories: (() => getItemsByType(ItemType.Accessory))(),
  // 戒指类
  rings: (() => getItemsByType(ItemType.Ring))(),
  // 法宝类
  artifacts: (() => getItemsByType(ItemType.Artifact))(),
  // 合成石类
  stones: (() => getItemsByType(ItemType.ArtifactStone))(),

  // 丹方
  recipes: (() => getItemsByType(ItemType.Recipe))(),
};

// 稀有度等级顺序（缓存，避免重复创建）
const RARITY_ORDER: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];

// 根据敌人强度和类型生成搜刮奖励
const generateLoot = (
  enemyStrength: number,
  adventureType: AdventureType,
  playerRealm: RealmType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): AdventureResult['itemObtained'][] => {
  const lootItems: AdventureResult['itemObtained'][] = [];
  // 用于追踪已选择的物品，避免重复（装备类物品按名称+稀有度去重）
  const selectedItems = new Set<string>();
  // 用于追踪已选择的物品类型，避免连续获得相同类型
  const selectedTypes: string[] = [];

  // 根据敌人强度决定奖励数量（1-4个物品）
  const numItems =
    enemyStrength < 0.7
      ? 1 // 弱敌：1个物品
      : enemyStrength < 1.0
        ? 1 + Math.floor(Math.random() * 2) // 普通：1-2个物品
        : 2 + Math.floor(Math.random() * 3); // 强敌：2-4个物品

  // 根据玩家境界调整稀有度概率（高境界更容易获得高级物品）
  const realmIndex = REALM_ORDER.indexOf(playerRealm);
  // 境界加成：每个境界增加稀有度概率，降低加成上限防止物品通胀
  // 基础加成：每个境界增加1%仙品、1.5%传说、2.5%稀有概率
  // 高境界（第4个境界及以上）额外获得50%加成
  const isHighRealm = realmIndex >= 3; // 元婴期及以上
  const realmMultiplier = isHighRealm ? 1.5 : 1.0;
  const realmBonusImmortal = Math.min(0.05, realmIndex * 0.01 * realmMultiplier); // 仙品加成，最高5%
  const realmBonusLegend = Math.min(0.10, realmIndex * 0.015 * realmMultiplier); // 传说加成，最高10%
  const realmBonusRare = Math.min(0.20, realmIndex * 0.025 * realmMultiplier); // 稀有加成，最高20%

  // 根据敌人强度和类型决定稀有度分布
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // 秘境：根据风险等级调整稀有度概率
      if (riskLevel === '极度危险') {
        // 极度危险：更高概率获得顶级物品（降低基础概率防止通胀）
        if (roll < 0.05 + realmBonusImmortal) return '仙品'; // 降低10%
        if (roll < 0.20 + realmBonusLegend) return '传说'; // 降低30%
        if (roll < 0.70 + realmBonusRare) return '稀有'; // 降低15%
        return '普通';
      } else if (riskLevel === '高') {
        // 高风险：较高概率
        if (roll < 0.12 + realmBonusImmortal) return '仙品';
        if (roll < 0.4 + realmBonusLegend) return '传说';
        if (roll < 0.75 + realmBonusRare) return '稀有';
        return '普通';
      } else if (riskLevel === '中') {
        // 中风险：中等概率
        if (roll < 0.08 + realmBonusImmortal) return '仙品';
        if (roll < 0.3 + realmBonusLegend) return '传说';
        if (roll < 0.65 + realmBonusRare) return '稀有';
        return '普通';
      } else {
        // 低风险：较低概率（但比普通历练高）
        if (roll < 0.05 + realmBonusImmortal) return '仙品';
        if (roll < 0.2 + realmBonusLegend) return '传说';
        if (roll < 0.55 + realmBonusRare) return '稀有';
        return '普通';
      }
    } else if (adventureType === 'lucky') {
      // 机缘：中等概率，境界加成更明显
      if (roll < 0.02 + realmBonusImmortal * 0.8) return '仙品'; // 机缘历练也可能获得仙品
      if (roll < 0.05 + realmBonusLegend) return '传说';
      if (roll < 0.25 + realmBonusRare) return '稀有';
      return '普通';
    } else {
      // 普通历练：较低概率，但境界加成明显
      if (roll < 0.01 + realmBonusImmortal * 0.5) return '仙品'; // 普通历练极低概率获得仙品
      if (roll < 0.05 + realmBonusLegend) return '传说';
      if (roll < 0.2 + realmBonusRare) return '稀有';
      return '普通';
    }
  };

  // 最大尝试次数，避免无限循环
  let maxAttempts = numItems * 10;
  let attempts = 0;

  while (lootItems.length < numItems && attempts < maxAttempts) {
    attempts++;
    const targetRarity = getRarityChance();

    const typeWeights = [
      { type: 'herbs', weight: 25, name: '草药', pool: LOOT_ITEMS.herbs },
      { type: 'pills', weight: 25, name: '丹药', pool: LOOT_ITEMS.pills },
      { type: 'materials', weight: 12, name: '材料', pool: LOOT_ITEMS.materials },
      { type: 'weapons', weight: 6, name: '武器', pool: LOOT_ITEMS.weapons },
      { type: 'armors', weight: 8, name: '护甲', pool: LOOT_ITEMS.armors },
      { type: 'accessories', weight: 5, name: '首饰', pool: LOOT_ITEMS.accessories },
      { type: 'rings', weight: 5, name: '戒指', pool: LOOT_ITEMS.rings },
      { type: 'artifacts', weight: 7, name: '法宝', pool: LOOT_ITEMS.artifacts },
      { type: 'stones', weight: 20, name: '装备合成石', pool: LOOT_ITEMS.stones },
      { type: 'recipe', weight: 8, name: '丹方', pool: LOOT_ITEMS.recipes },
    ];

    // 如果上一个物品是装备类，轻微降低装备类权重
    if (selectedTypes.length > 0 && !['草药', '丹药', '材料'].includes(selectedTypes[selectedTypes.length - 1])) {
      typeWeights.forEach(w => {
        if (['weapons', 'armors', 'accessories', 'rings', 'artifacts'].includes(w.type)) {
          w.weight *= 0.85;
        }
      });
    }

    const totalWeight = typeWeights.reduce((sum, w) => sum + w.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedType = typeWeights[0];
    for (const type of typeWeights) {
      randomWeight -= type.weight;
      if (randomWeight <= 0) {
        selectedType = type;
        break;
      }
    }

    const itemType = selectedType.name;
    let itemPool: any[] = [];

    if (selectedType.type === 'recipe') {
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const targetIndex = RARITY_ORDER.indexOf(targetRarity);
        const recipeIndex = RARITY_ORDER.indexOf(recipe.result.rarity);
        const recipeKey = `${recipe.name}丹方-${recipe.result.rarity}`;
        return recipeIndex <= targetIndex && !selectedItems.has(recipeKey);
      });

      if (availableRecipes.length > 0) {
        const selectedRecipe = pickOne(availableRecipes);
        const recipeKey = `${selectedRecipe.name}丹方-${selectedRecipe.result.rarity}`;
        selectedItems.add(recipeKey);
        selectedTypes.push(itemType);
        lootItems.push({
          name: `${selectedRecipe.name}丹方`,
          type: '丹方',
          description: `记载了【${selectedRecipe.name}】炼制方法的古老丹方。使用后可学会炼制此丹药。`,
          rarity: selectedRecipe.result.rarity,
          isEquippable: false,
          recipeName: selectedRecipe.name,
        } as any);
      }
      continue;
    }

    if (selectedType.type === 'armors') {
      const armorSlots = [EquipmentSlot.Head, EquipmentSlot.Shoulder, EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Legs, EquipmentSlot.Boots];
      const selectedSlot = pickOne(armorSlots);
      itemPool = (selectedType.pool as any).filter((item: any) => item.equipmentSlot === selectedSlot);
      if (itemPool.length === 0) itemPool = selectedType.pool as any;
    } else {
      itemPool = selectedType.pool as any;
    }

    // 从对应稀有度的物品中随机选择，排除已选择的
    let availableItems = itemPool.filter((item: any) => {
      const itemKey = item.slot !== undefined ? `${item.name}-${item.rarity}-${item.slot}` : `${item.name}-${item.rarity}`;
      return item.rarity === targetRarity && !selectedItems.has(itemKey);
    });

    // 如果没有可用物品，尝试降级选择
    if (availableItems.length === 0) {
      availableItems = itemPool.filter((item: any) => {
        const itemKey = item.slot !== undefined ? `${item.name}-${item.rarity}-${item.slot}` : `${item.name}-${item.rarity}`;
        return RARITY_ORDER.indexOf(item.rarity) <= RARITY_ORDER.indexOf(targetRarity) && !selectedItems.has(itemKey);
      });
    }

    if (availableItems.length > 0) {
      const selected = pickOne(availableItems);
      const itemKey = selected.slot !== undefined ? `${selected.name}-${selected.rarity}-${selected.slot}` : `${selected.name}-${selected.rarity}`;
      selectedItems.add(itemKey);
      selectedTypes.push(itemType);

      let reviveChances: number | undefined = undefined;
      if ((selected.rarity === '传说' || selected.rarity === '仙品') && (itemType === '武器' || itemType === '法宝')) {
        const hasRevive = selected.rarity === '传说' ? Math.random() < 0.06 : Math.random() < 0.12;
        if (hasRevive) reviveChances = Math.floor(Math.random() * 3) + 1;
      }

      lootItems.push({
        name: selected.name,
        type: itemType,
        description: `${selected.name}，从敌人身上搜刮获得。`,
        rarity: selected.rarity,
        isEquippable: selected.slot !== undefined,
        equipmentSlot: selected.slot as string | undefined,
        effect: selected.effect,
        permanentEffect: selected.permanentEffect,
        reviveChances: reviveChances,
      } as any);
    }
  }

  return lootItems;
};

export interface BattleRoundLog {
  id: string;
  attacker: 'player' | 'enemy';
  damage: number;
  crit: boolean;
  description: string;
  playerHpAfter: number;
  enemyHpAfter: number;
}

export interface BattleReplay {
  id: string;
  adventureType?: AdventureType; // 历练类型
  bossId?: string | null; // 挑战的BOSS ID（用于天地之魄等特殊战斗）
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    spirit: number; // 敌人神识属性
    strengthMultiplier?: number; // 敌人强度倍数
  };
  rounds: BattleRoundLog[];
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  summary: string;
  expChange: number;
  spiritChange: number;
}

export interface BattleResolution {
  adventureResult: AdventureResult;
  replay: BattleReplay;
  petSkillCooldowns?: Record<string, number>; // 战斗结束后的灵宠技能冷却状态
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const safeNumber = (val: any, def: number = 0) => Number(val) || def;

/**
 * 根据基础最大值和当前值，按比例计算新的值
 */
const getScaledValue = (oldMax: number, current: number, newMax: number) => {
  const ratio = oldMax > 0 ? current / oldMax : 0;
  return Math.floor(newMax * ratio);
};

/**
 * 计算行动次数（基于速度差和神识差）
 * @param fasterSpeed 更快单位的速度
 * @param slowerSpeed 更慢单位的速度
 * @param fasterSpirit 更快单位的神识
 * @param slowerSpirit 更慢单位的神识
 * @returns 行动次数（1-5）
 */
const calculateActionCount = (
  fasterSpeed: number,
  slowerSpeed: number,
  fasterSpirit: number,
  slowerSpirit: number
): number => {
  // 确保速度值是有效数字，防止NaN
  const validFasterSpeed = Number(fasterSpeed) || 0;
  const validSlowerSpeed = Number(slowerSpeed) || 1; // 避免除零，默认至少为1
  const validFasterSpirit = Number(fasterSpirit) || 0;
  const validSlowerSpirit = Number(slowerSpirit) || 1; // 避免除零，默认至少为1

  // 计算速度和神识的综合行动力
  // 速度权重0.6，神识权重0.4
  const fasterActionPower = validFasterSpeed * 0.6 + validFasterSpirit * 0.4;
  const slowerActionPower = validSlowerSpeed * 0.6 + validSlowerSpirit * 0.4;

  if (fasterActionPower <= slowerActionPower) return 1; // 行动力不占优，只有1次行动

  const powerDiff = fasterActionPower - slowerActionPower;
  // 确保slowerActionPower至少为1，避免除零
  const safeSlowerPower = Math.max(1, slowerActionPower);
  const powerRatio = powerDiff / safeSlowerPower; // 行动力差比例

  // 基础1次 + 每50%行动力优势额外1次行动
  // 例如：行动力是敌人的1.5倍 = 2次行动，2倍 = 3次行动，3倍 = 4次行动
  const extraActions = Math.floor(powerRatio / 0.5);
  const totalActions = 1 + extraActions;

  // 最多5次行动（避免过于不平衡）
  return Math.min(5, Math.max(1, totalActions));
};

/**
 * 统一处理灵宠行动逻辑（包括技能和普通攻击）
 */
function handlePetAction(
  activePet: Pet,
  player: PlayerStats | BattleUnit,
  enemy: { hp: number; maxHp: number; defense: number; name: string; title?: string },
  petSkillCooldowns: Record<string, number>,
  randomId: () => string,
  calcDamage: (atk: number, def: number) => number,
  getPlayerTotalStats?: (p: PlayerStats) => any
): {
  action: BattleAction | BattleRoundLog;
  updatedEnemyHp: number;
  updatedPlayerHp: number;
  updatedCooldowns: Record<string, number>;
} {
  const petLevel = Number(activePet.level) || 0;
  const petAffection = Number(activePet.affection) || 0;
  const evolutionStage = Number(activePet.evolutionStage) || 0;
  const evolutionMultiplier = 1.0 + evolutionStage * 0.5;
  const affectionBonusFactor = 1 + petAffection / 200;

  // 决定灵宠行动：根据亲密度和等级动态调整技能释放概率
  const baseProbability = 0.3;
  const affectionBonus = (petAffection / 100) * 0.2;
  const levelBonus = (petLevel / 100) * 0.1;
  const skillProbability = Math.min(0.7, baseProbability + affectionBonus + levelBonus);
  const useSkill = Math.random() < skillProbability;

  let usedSkill: PetSkill | null = null;
  if (useSkill && activePet.skills.length > 0) {
    const availableSkills = activePet.skills.filter(
      (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
    );
    if (availableSkills.length > 0) {
      usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }
  }

  let petDamage = 0;
  let petHeal = 0;
  let petBuffs: Buff[] = [];
  let description = "";
  let skillId: string | undefined = undefined;

  const isPlayerUnit = "maxHp" in player && "buffs" in player;
  const playerMaxHp = isPlayerUnit ? (player as BattleUnit).maxHp : (getPlayerTotalStats ? getPlayerTotalStats(player as PlayerStats).maxHp : (player as any).hp);
  let playerHp = player.hp;
  let enemyHp = enemy.hp;

  if (usedSkill) {
    skillId = usedSkill.id;
    // 释放技能
    if (usedSkill.effect.damage || usedSkill.effect.damageMultiplier) {
      const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
      const damageMultiplier = Number(usedSkill.effect.damageMultiplier) || 0;
      const attackMultiplier = 1.0 + (petLevel / 50);
      const baseAttack = Number(activePet.stats?.attack) || 0;

      let skillDamage = baseSkillDamage;
      if (damageMultiplier > 0) {
        skillDamage += baseAttack * damageMultiplier * evolutionMultiplier * attackMultiplier;
      } else {
        skillDamage += baseAttack * evolutionMultiplier * attackMultiplier;
      }

      const lBonus = Math.floor(petLevel * 5);
      const aBonus = Math.floor(petAffection * 0.8);
      const finalSkillDamage = (skillDamage + lBonus + aBonus) * affectionBonusFactor;
      petDamage = calcDamage(finalSkillDamage, enemy.defense);
      enemyHp = Math.max(0, enemyHp - petDamage);
    }

    if (usedSkill.effect.heal || usedSkill.effect.healPercent) {
      const baseHeal = Number(usedSkill.effect.heal) || 0;
      const healPercent = Number(usedSkill.effect.healPercent) || 0;
      let finalHeal = baseHeal * (1 + petLevel * 0.05);
      if (healPercent > 0) {
        finalHeal += playerMaxHp * healPercent;
      }
      petHeal = Math.floor(finalHeal * affectionBonusFactor);
      playerHp = Math.min(playerMaxHp, playerHp + petHeal);
    }

    if (usedSkill.effect.buff) {
      const b = usedSkill.effect.buff;
      const duration = 3 + Math.floor(petLevel / 20);
      const buffSource = `pet_${activePet.id}`;

      if (b.attack) petBuffs.push({ id: randomId(), name: `${activePet.name}的激励`, type: 'attack', value: Math.floor(b.attack * affectionBonusFactor), duration, source: buffSource });
      if (b.attackPercent) petBuffs.push({ id: randomId(), name: `${activePet.name}的狂暴`, type: 'attack', value: Math.floor(player.attack * b.attackPercent * affectionBonusFactor), duration, source: buffSource });
      if (b.defense) petBuffs.push({ id: randomId(), name: `${activePet.name}的守护`, type: 'defense', value: Math.floor(b.defense * affectionBonusFactor), duration, source: buffSource });
      if (b.defensePercent) petBuffs.push({ id: randomId(), name: `${activePet.name}的铁壁`, type: 'defense', value: Math.floor(player.defense * b.defensePercent * affectionBonusFactor), duration, source: buffSource });
      if (b.critChance) petBuffs.push({ id: randomId(), name: `${activePet.name}的精准`, type: 'crit', value: b.critChance * affectionBonusFactor, duration, source: buffSource });
      if (b.dodge) petBuffs.push({ id: randomId(), name: `${activePet.name}的灵动`, type: 'custom', value: 0, duration, source: buffSource, dodge: b.dodge * affectionBonusFactor });

      // 如果是 BattleUnit 类型，需要直接应用数值加成
      if (isPlayerUnit) {
        petBuffs.forEach(buff => {
          if (buff.type === 'attack') (player as BattleUnit).attack += buff.value;
          if (buff.type === 'defense') (player as BattleUnit).defense += buff.value;
        });
      }
    }

    const updatedCooldowns = { ...petSkillCooldowns };
    if (usedSkill.cooldown) {
      updatedCooldowns[usedSkill.id] = usedSkill.cooldown;
    }

    description = `【${activePet.name}】释放了【${usedSkill.name}】！`;
    if (petDamage > 0) description += `对敌人造成 ${petDamage} 点伤害。`;
    if (petHeal > 0) description += `为你恢复了 ${petHeal} 点气血。`;
    if (petBuffs.length > 0) {
      const buffNames = petBuffs.map(b => b.name.split('的')[1]).join('、');
      description += `你获得了${buffNames}状态。`;
    }

    return {
      action: {
        id: randomId(),
        round: (player as any).round || 1,
        turn: 'player',
        attacker: 'player',
        actor: 'player',
        actionType: 'skill',
        skillId,
        damage: petDamage,
        crit: false,
        description,
        playerHpAfter: playerHp,
        enemyHpAfter: enemyHp,
        result: { damage: petDamage, heal: petHeal, buffs: petBuffs }
      } as any,
      updatedEnemyHp: enemyHp,
      updatedPlayerHp: playerHp,
      updatedCooldowns
    };
  } else {
    // 普通攻击
    const baseAttack = Number(activePet.stats?.attack) || 0;
    const attackMultiplier = 1.0 + (petLevel / 50);
    const levelBonus = Math.floor(petLevel * 8);
    const affectionBonus = Math.floor(petAffection * 1.5);
    const petAttackDamage = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
    petDamage = calcDamage(petAttackDamage, enemy.defense);
    enemyHp = Math.max(0, enemyHp - petDamage);

    return {
      action: {
        id: randomId(),
        round: (player as any).round || 1,
        turn: 'player',
        attacker: 'player',
        actor: 'player',
        actionType: 'attack',
        damage: petDamage,
        crit: false,
        description: `【${activePet.name}】紧随其后发动攻击，造成 ${petDamage} 点伤害。`,
        playerHpAfter: playerHp,
        enemyHpAfter: enemyHp,
        result: { damage: petDamage }
      } as any,
      updatedEnemyHp: enemyHp,
      updatedPlayerHp: playerHp,
      updatedCooldowns: petSkillCooldowns
    };
  }
}

export const createEnemy = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string // 指定的天地之魄BOSS ID（用于事件模板）
): Promise<{
  name: string;
  title: string;
  realm: RealmType;
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
  spirit: number;
  strengthMultiplier: number;
}> => {
  const currentRealmIndex = REALM_ORDER.indexOf(player.realm);

  // 保存选中的BOSS用于后续属性计算（天地之魄挑战）
  let selectedBossForStats: typeof HEAVEN_EARTH_SOUL_BOSSES[string] | null = null;
  if (adventureType === 'dao_combining_challenge') {
    // 天地之魄挑战：如果指定了BOSS ID，使用指定的；否则随机选择一个
    if (bossId && HEAVEN_EARTH_SOUL_BOSSES[bossId]) {
      selectedBossForStats = HEAVEN_EARTH_SOUL_BOSSES[bossId];
    } else {
      const bossIds = Object.keys(HEAVEN_EARTH_SOUL_BOSSES);
      const randomBossId = bossIds[Math.floor(Math.random() * bossIds.length)];
      selectedBossForStats = HEAVEN_EARTH_SOUL_BOSSES[randomBossId] || null;
    }
  }

  // 如果进入秘境且有秘境的最低境界要求，基于秘境境界计算敌人强度
  let targetRealmIndex: number;
  let realmLevelReduction = 1.0; // 境界压制倍率（玩家境界高于秘境要求时降低难度）

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    const realmOffset = 0;
    targetRealmIndex = clamp(realmMinIndex + realmOffset, 0, REALM_ORDER.length - 1);

    if (currentRealmIndex > realmMinIndex) {
      const realmDiff = currentRealmIndex - realmMinIndex;
      realmLevelReduction = Math.max(0.4, 1.0 - realmDiff * 0.15);
    }
  } else if (adventureType === 'sect_challenge') {
    if (huntSectId && huntLevel !== undefined) {
      let realmOffset = 0;
      if (huntLevel >= 3) realmOffset = Math.random() < 0.85 ? 1 : 2;
      else if (huntLevel >= 2) realmOffset = Math.random() < 0.7 ? 0 : 1;
      else if (huntLevel >= 1) realmOffset = Math.random() < 0.6 ? 0 : -1;
      else realmOffset = Math.random() < 0.7 ? -1 : -2;

      targetRealmIndex = clamp(currentRealmIndex + realmOffset, 0, REALM_ORDER.length - 1);
      if (huntLevel >= 3) targetRealmIndex = Math.max(targetRealmIndex, 3);
    } else {
      const realmOffset = Math.random() < 0.85 ? 1 : 2;
      targetRealmIndex = clamp(currentRealmIndex + realmOffset, 3, REALM_ORDER.length - 1);
    }
  } else if (adventureType === 'dao_combining_challenge') {
    targetRealmIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);
  } else {
    const realmOffset = adventureType === 'lucky' ? -1 : 0;
    targetRealmIndex = clamp(currentRealmIndex + realmOffset, 0, REALM_ORDER.length - 1);
  }

  // 确保targetRealmIndex有效
  const validTargetRealmIndex = clamp(targetRealmIndex, 0, REALM_ORDER.length - 1);
  const realm = REALM_ORDER[validTargetRealmIndex];
  if (!realm) {
    const fallbackRealm = REALM_ORDER[0];
    if (!fallbackRealm) throw new Error('REALM_ORDER is empty');
    return { name: '未知敌人', title: '神秘的', realm: fallbackRealm, attack: 10, defense: 8, maxHp: 50, speed: 10, spirit: 5, strengthMultiplier: 1 };
  }
  const baseDifficulty = getBattleDifficulty(adventureType, riskLevel);
  const strengthRoll = Math.random();

  // 强度等级系数配置
  const STRENGTH_CONFIGS: Record<string, any> = {
    normal: { weak: 0.4, mid: 0.9, ranges: [[0.6, 0.2, 0.6, 0.9], [0.8, 0.2, 0.75, 1.1], [1.0, 0.2, 0.9, 1.3]] },
    lucky: { weak: 0.6, mid: 0.95, ranges: [[0.5, 0.2, 0.5, 0.85], [0.7, 0.2, 0.65, 1.0], [0.9, 0.2, 0.8, 1.2]] },
    secret_realm: {
      极度危险: { weak: 0.15, mid: 0.6, ranges: [[0.85, 0.15, 0.8, 1.1], [1.0, 0.2, 0.9, 1.3], [1.2, 0.3, 1.1, 1.6]] },
      高: { weak: 0.2, mid: 0.7, ranges: [[0.75, 0.15, 0.7, 1.0], [0.9, 0.2, 0.85, 1.2], [1.1, 0.25, 1.0, 1.5]] },
      中: { weak: 0.3, mid: 0.85, ranges: [[0.65, 0.2, 0.6, 0.95], [0.85, 0.2, 0.75, 1.15], [1.05, 0.2, 0.95, 1.3]] },
      低: { weak: 0.4, mid: 0.9, ranges: [[0.55, 0.2, 0.5, 0.85], [0.75, 0.2, 0.7, 1.05], [0.95, 0.2, 0.85, 1.2]] },
    }
  };

  let strengthMultiplier = 1;
  let strengthVariance = { min: 0.85, max: 1.2 };

  if (adventureType === 'sect_challenge') {
    strengthMultiplier = 1.0;
    if (strengthRoll < 0.3) strengthVariance = { min: 0.9, max: 1.1 };
    else if (strengthRoll < 0.8) strengthVariance = { min: 1.1, max: 1.3 };
    else strengthVariance = { min: 1.3, max: 1.6 };
  } else if (adventureType === 'dao_combining_challenge') {
    strengthMultiplier = 1.0;
    strengthVariance = { min: 1.0, max: 1.0 };
  } else {
    const config = adventureType === 'secret_realm' ? STRENGTH_CONFIGS.secret_realm[riskLevel || '中'] : STRENGTH_CONFIGS[adventureType];
    if (config) {
      const idx = strengthRoll < config.weak ? 0 : (strengthRoll < config.mid ? 1 : 2);
      const [mBase, mRand, vMin, vMax] = config.ranges[idx];
      strengthMultiplier = mBase + Math.random() * mRand;
      strengthVariance = { min: vMin, max: vMax };
    }
  }

  const getVariance = () => strengthVariance.min + Math.random() * (strengthVariance.max - strengthVariance.min);

  const variance = () =>
    strengthVariance.min +
    Math.random() * (strengthVariance.max - strengthVariance.min);
  // 应用境界压制倍率到最终难度
  const finalDifficulty =
    baseDifficulty * strengthMultiplier * realmLevelReduction;

  // 15%概率使用AI生成敌人名字，失败则使用预设列表
  let name = pickOne(ENEMY_NAMES);
  let title = pickOne(ENEMY_TITLES);

  if (adventureType === 'sect_challenge') {
    if (huntSectId && huntLevel !== undefined) {
      if (huntLevel >= 3) { name = '宗主'; title = '威震八方的'; }
      else if (huntLevel >= 2) { name = pickOne(['执法长老', '传功长老', '护法长老']); title = '实力强大的'; }
      else if (huntLevel >= 1) { name = pickOne(['精英弟子', '核心弟子', '真传弟子']); title = '宗门'; }
      else { name = pickOne(['外门弟子', '内门弟子', '执法弟子']); title = '宗门'; }
    } else {
      name = '上代宗主';
      title = '威震八方的';
    }
  } else if (adventureType === 'dao_combining_challenge' && selectedBossForStats) {
    name = selectedBossForStats.name;
    title = '天地之魄-';
  }

  if (Math.random() < 0.15 && !['sect_challenge', 'dao_combining_challenge'].includes(adventureType)) {
    try {
      const generated = getRandomEnemyName(realm, adventureType);
      if (generated.name && generated.title) { name = generated.name; title = generated.title; }
    } catch (e) { logger.warn('模板生成敌人名字失败:', e); }
  }

  // 属性计算基准
  let basePlayerStats = { attack: player.attack, defense: player.defense, maxHp: player.maxHp, speed: player.speed || 10, spirit: player.spirit || 0, level: player.realmLevel };

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    if (currentRealmIndex > realmMinIndex) {
      const ratio = 0.4 + (realmMinIndex / (REALM_ORDER.length || 1)) * 0.3;
      basePlayerStats = {
        attack: player.attack * ratio,
        defense: player.defense * ratio,
        maxHp: player.maxHp * (ratio - 0.1),
        speed: (player.speed || 10) * (ratio + 0.1),
        spirit: (player.spirit || 0) * ratio,
        level: Math.max(1, player.realmLevel - (currentRealmIndex - realmMinIndex))
      };
    }
  }

  // 平衡敌人的基础属性
  // 天地之魄挑战：直接使用BOSS的基础属性
  let baseAttack: number;
  let baseDefense: number;
  let baseMaxHp: number;
  let baseSpeed: number;
  let baseSpirit: number;

  if (adventureType === 'dao_combining_challenge' && selectedBossForStats) {
    // 使用BOSS的基础属性
    baseAttack = selectedBossForStats.baseStats.attack;
    baseDefense = selectedBossForStats.baseStats.defense;
    baseMaxHp = selectedBossForStats.baseStats.hp;
    baseSpeed = selectedBossForStats.baseStats.speed;
    baseSpirit = selectedBossForStats.baseStats.spirit;
  } else {
    // 普通敌人：基于玩家属性计算
    baseAttack = basePlayerStats.attack * 0.7 + basePlayerStats.level * 2;
    baseDefense = basePlayerStats.defense * 0.7 + basePlayerStats.level * 2;
    const realmBaseSpirit = REALM_DATA[realm]?.baseSpirit || 0;
    baseSpirit = basePlayerStats.spirit * 0.3 + realmBaseSpirit * 0.5 + basePlayerStats.level * 1;
    baseMaxHp = basePlayerStats.maxHp * (0.7 + Math.random() * 0.2);
    baseSpeed = basePlayerStats.speed;
  }

  // 天地之魄挑战：根据玩家战斗力动态调整BOSS属性
  if (adventureType === 'dao_combining_challenge' && selectedBossForStats) {
    const playerCombatPower = basePlayerStats.attack * 0.4 + basePlayerStats.defense * 0.3 + basePlayerStats.maxHp * 0.002 + basePlayerStats.speed * 0.15 + basePlayerStats.spirit * 0.15;
    const bossBaseCombatPower = baseAttack * 0.4 + baseDefense * 0.3 + baseMaxHp * 0.002 + baseSpeed * 0.15 + baseSpirit * 0.15;
    const randomMultiplier = 0.9 + Math.random() * 0.9;
    const targetCombatPower = playerCombatPower * randomMultiplier;
    const powerRatio = bossBaseCombatPower > 0 ? targetCombatPower / bossBaseCombatPower : randomMultiplier;

    return {
      name, title, realm,
      attack: Math.round(baseAttack * powerRatio),
      defense: Math.round(baseDefense * powerRatio),
      maxHp: Math.round(baseMaxHp * powerRatio),
      speed: Math.round(baseSpeed * powerRatio),
      spirit: Math.round(baseSpirit * powerRatio),
      strengthMultiplier: randomMultiplier,
    };
  }

  const attackRatio = baseAttack / Math.max(1, basePlayerStats.attack);
  let calculatedHp = Math.round(baseMaxHp * finalDifficulty);
  if (attackRatio > 1.2) calculatedHp = Math.round(calculatedHp * 0.9);
  else if (attackRatio < 0.8) calculatedHp = Math.round(calculatedHp * 1.1);

  const v = getVariance();
  return {
    name, title, realm,
    attack: Math.max(8, Math.round(baseAttack * v * finalDifficulty)),
    defense: Math.max(6, Math.round(baseDefense * v * finalDifficulty)),
    maxHp: Math.max(40, calculatedHp),
    speed: Math.max(6, Math.round(baseSpeed * (0.7 + Math.random() * 0.3) * strengthMultiplier)),
    spirit: Math.max(5, Math.round(baseSpirit * v * finalDifficulty)),
    strengthMultiplier,
  };
};

const calcDamage = (attack: number, defense: number) => {
  // 确保输入是有效数字，防止NaN
  const validAttack = Number(attack) || 0;
  const validDefense = Number(defense) || 0;

  // 优化后的伤害计算：使用双曲线公式，确保防御收益递减但不会完全无效
  // 公式: damage = attack * (1 - defense / (defense + attack * k))
  // 这个公式的特点：
  // 1. 防御力越高，减伤效果越明显，但不会完全无效
  // 2. 当防御=0时，伤害=攻击力
  // 3. 当防御=攻击时，伤害约为攻击力的33%（k=0.5时）
  // 4. 当防御远大于攻击时，伤害会趋近于0，但不会完全为0
  const k = 0.5; // 调整系数，控制防御收益曲线
  const denominator = validDefense + validAttack * k;

  // 避免除零
  if (denominator <= 0) {
    return Math.max(1, Math.round(validAttack * (0.9 + Math.random() * 0.2)));
  }

  // 计算基础伤害
  const baseDamage = validAttack * (1 - validDefense / denominator);

  // 优化：提高最小伤害到攻击力的15%，确保高防御时仍能造成有效伤害
  const minDamage = validAttack > 0 ? Math.max(1, Math.floor(validAttack * 0.15)) : 0;

  // 随机波动范围（伤害在一定范围内浮动）
  const baseRandomRange = 0.2; // 基础±10%波动（即0.9~1.1倍）
  const randomFactor = 0.9 + Math.random() * baseRandomRange; // 0.9~1.1倍
  return Math.round(Math.max(minDamage, baseDamage * randomFactor));
};

// 战斗触发
export const shouldTriggerBattle = (
  player: PlayerStats,
  adventureType: AdventureType
): boolean => {
  // 挑战类型（宗主挑战、天地之魄挑战）总是触发战斗
  if (adventureType === 'sect_challenge' || adventureType === 'dao_combining_challenge') {
    return true;
  }

  const base = baseBattleChance[adventureType] ?? 0.2; // 基础战斗概率
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.02; // 境界加成（从0.015提高到0.02）
  const speedBonus = (player.speed || 0) * 0.0005; // 速度加成（从0.0004提高到0.0005）
  const luckMitigation = (player.luck || 0) * 0.00015; // 幸运减成（从0.0002降低到0.00015，减少影响）
  const chance = Math.min(0.6, base + realmBonus + speedBonus - luckMitigation); // 保持上限适中
  return Math.random() < Math.max(0.1, chance); // 确保不会过低也不过高
  // return true; // 调试战斗打开
};

/**
 * 计算修为和灵石奖励
 */
function getExpAndStoneRewards(
  player: PlayerStats,
  adventureType: AdventureType,
  difficulty: number,
  rewardMultiplier: number,
  enemyStrengthMultiplier: number = 1.0
): { exp: number, stones: number } {
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // 统一使用较为稳健的倍数，防止数值膨胀
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // 综合强度倍数：敌人越强，奖励越多
  const strengthRewardMultiplier = 0.8 + enemyStrengthMultiplier * 0.4;
  const totalMultiplier = difficulty * rewardMultiplier * strengthRewardMultiplier;

  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.15;
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * totalMultiplier);

  const baseStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(10, Math.round(baseStones * totalMultiplier));

  return { exp: rewardExp, stones: rewardStones };
}

export const resolveBattleEncounter = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  realmName?: string,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string, // 指定的天地之魄BOSS ID（用于事件模板）
): Promise<BattleResolution> => {
  const enemy = await createEnemy(
    player,
    adventureType,
    riskLevel,
    realmMinRealm,
    huntSectId,
    huntLevel,
    bossId
  );
  const difficulty = getBattleDifficulty(adventureType, riskLevel);
  // 使用getPlayerTotalStats计算实际最大血量（包含金丹法数、心法等加成）
  const totalStats = getPlayerTotalStats(player);
  const actualMaxHp = totalStats.maxHp;
  // 确保初始值为有效数字，防止NaN
  // 按比例调整血量：如果功法增加了最大血量，当前血量也应该按比例增加
  const baseMaxHp = Number(player.maxHp) || 1; // 避免除零
  const currentHp = Number(player.hp) || 0;
  const hpRatio = baseMaxHp > 0 ? currentHp / baseMaxHp : 0; // 计算血量比例
  const initialPlayerHp = getScaledValue(safeNumber(player.maxHp, 1), safeNumber(player.hp, 0), actualMaxHp);
  const initialMaxHp = actualMaxHp;
  let playerHp = Math.max(0, Math.min(initialPlayerHp, initialMaxHp));
  let enemyHp = safeNumber(enemy.maxHp);
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' =
    (player.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却（如果还没有）
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet && !activePet.skillCooldowns) {
    petSkillCooldowns = {};
  } else if (activePet) {
    petSkillCooldowns = { ...activePet.skillCooldowns };
  }

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(
      isPlayerTurn ? player.attack : enemy.attack,
      isPlayerTurn ? enemy.defense : player.defense
    );
    // 确保速度值是有效数字，防止NaN
    const playerSpeed = Number(player.speed) || 0;
    const enemySpeed = Number(enemy.speed) || 0;
    const speedSum = Math.max(1, playerSpeed + enemySpeed); // 确保至少为1，避免除零
    const critSpeed = isPlayerTurn ? playerSpeed : enemySpeed;
    // 优化暴击率计算：降低速度对暴击率的影响，设置上限为20%
    // 基础10% + 速度加成最高10% = 最高20%暴击率（修复：基础暴击率改为10%）
    const critChanceBase = 0.10 + (critSpeed / speedSum) * 0.10;
    // 确保暴击率在合理范围内（最高20%）
    const validCritChance = Math.max(0, Math.min(0.2, critChanceBase));
    const crit = Math.random() < validCritChance;
    const finalDamage = crit ? Math.round(damage * 1.5) : damage;

    if (isPlayerTurn) {
      enemyHp = Math.max(0, (Number(enemyHp) || 0) - finalDamage);
    } else {
      playerHp = Math.max(0, (Number(playerHp) || 0) - finalDamage);
    }
    rounds.push({
      id: randomId(),
      attacker,
      damage: finalDamage,
      crit,
      description: isPlayerTurn
        ? `你发动灵力攻势，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`
        : `${enemy.title}${enemy.name}反扑，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });

    // 玩家回合后，灵宠可以行动（附加攻击或释放技能）
    if (isPlayerTurn && activePet && enemyHp > 0) {
      // 更新技能冷却
      Object.keys(petSkillCooldowns).forEach((skillId) => {
        if (petSkillCooldowns[skillId] > 0) {
          petSkillCooldowns[skillId]--;
        }
      });

      const { action, updatedEnemyHp, updatedPlayerHp, updatedCooldowns } = handlePetAction(
        activePet,
        { ...player, hp: playerHp } as PlayerStats,
        { hp: enemyHp, maxHp: enemy.maxHp, defense: enemy.defense, name: enemy.name, title: enemy.title },
        petSkillCooldowns,
        randomId,
        calcDamage,
        getPlayerTotalStats
      );

      enemyHp = updatedEnemyHp;
      playerHp = updatedPlayerHp;
      petSkillCooldowns = updatedCooldowns;
      rounds.push(action as BattleRoundLog);
    }

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;

  // 确保hpLoss是有效数字，防止NaN
  const playerHpBefore = Number(player.hp) || 0;
  const playerHpAfter = Number(playerHp) || 0;
  const hpLoss = Math.max(0, Math.floor(playerHpBefore - playerHpAfter));

  const rewardMultiplier =
    adventureType === 'secret_realm' ? getRiskRewardMultiplier(riskLevel) : 1.0;

  const { exp: rewardExp, stones: rewardStones } = getExpAndStoneRewards(

    player,
    adventureType,
    difficulty,
    rewardMultiplier,
    enemy.strengthMultiplier
  );

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成搜刮奖励
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(
      enemy.strengthMultiplier,
      adventureType,
      player.realm,
      riskLevel
    );
    lootItems.push(...loot);
  }

  // 生成更丰富的战斗描述
  const generateBattleSummary = (
    victory: boolean,
    enemy: { name: string; title: string },
    hpLoss: number,
    hasLoot: boolean,
    realmName?: string
  ): string => {
    const realmContext = realmName && adventureType === 'secret_realm' ? `在${realmName}中，` : "";
    const lootText = hasLoot ? (Math.random() < 0.5 ? "你仔细搜刮了敌人的遗物。" : "你从敌人身上找到了战利品。") : "";

    const victoryScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}展开激战。最终，你将其斩于剑下，但也耗费了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你遭遇了${enemy.title}${enemy.name}的袭击。经过一番殊死搏斗，你成功将其击败，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你与${enemy.title}${enemy.name}展开对决。最终，你凭借更强的实力将其斩杀，损失了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你祭出法宝，与${enemy.title}${enemy.name}展开对决。最终，你技高一筹，成功将其击杀，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你施展神通，与${enemy.title}${enemy.name}展开激战。最终，你抓住机会，一剑将其斩杀。耗费了 ${hpLoss} 点气血。${lootText}`,
    ];

    const defeatScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常艰难。对方实力强大，你拼尽全力仍不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你遭遇了强大的${enemy.title}${enemy.name}。面对其猛烈的攻击，你渐渐落入下风，只能带着伤势逃离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常激烈。对方的速度和力量远超预期，你无法取胜，只得选择撤退，损失了 ${hpLoss} 点气血。`,
    ];

    const scenarios = victory ? victoryScenarios : defeatScenarios;
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  const summary = generateBattleSummary(
    victory,
    enemy,
    hpLoss,
    lootItems.length > 0,
    realmName
  );

  // 确保hpChange是有效数字，防止NaN
  const hpChange = Math.floor(playerHpAfter - playerHpBefore);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  // 清理冷却时间为0的技能冷却（节省存储空间）
  const finalPetSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        finalPetSkillCooldowns[skillId] = petSkillCooldowns[skillId];
      }
    });
  }

  return {
    adventureResult,
    replay: {
      id: randomId(),
      adventureType,
      bossId: bossId || null,
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: playerHpBefore,
      playerHpAfter: playerHpAfter,
      summary,
      expChange,
      spiritChange,
    },
    petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
  };
};

// ==================== 回合制战斗系统 ====================

/**
 * 计算战斗奖励
 */
export const calculateBattleRewards = (
  battleState: BattleState,
  player: PlayerStats,
  adventureType?: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): {
  expChange: number;
  spiritChange: number;
  items?: AdventureResult['itemObtained'][];
} => {
  const victory = battleState.enemy.hp <= 0;
  const actualAdventureType = adventureType || battleState.adventureType;
  const actualRiskLevel = riskLevel || battleState.riskLevel;
  const difficulty = getBattleDifficulty(actualAdventureType, actualRiskLevel);

  // 根据敌人强度计算奖励倍数（敌人越强，奖励越多）
  const enemyStrength = battleState.enemyStrengthMultiplier || 1.0;
  const strengthRewardMultiplier = 0.8 + enemyStrength * 0.4; // 0.8-1.2倍（弱敌）到 1.2-2.0倍（强敌）

  const riskRewardMultiplier =
    actualAdventureType === 'secret_realm' ? getRiskRewardMultiplier(actualRiskLevel) : 1.0;

  const { exp: rewardExp, stones: rewardStones } = getExpAndStoneRewards(

    player,
    actualAdventureType,
    difficulty,
    riskRewardMultiplier,
    enemyStrength
  );

  // 宗门挑战特殊奖励（只有战胜宗主才给特殊奖励）
  if (actualAdventureType === 'sect_challenge') {
    // 判断是否是宗主战斗：
    // 1. 追杀战斗且 huntLevel >= 3（战胜宗主）
    // 2. 正常挑战且是长老挑战宗主
    const isHuntMasterBattle = player.sectId === null &&
      player.sectHuntSectId &&
      player.sectHuntLevel !== undefined &&
      player.sectHuntLevel >= 3;
    const isNormalMasterBattle = player.sectId !== null &&
      player.sectRank === SectRank.Elder;
    const isMasterBattle = isHuntMasterBattle || isNormalMasterBattle;

    if (victory && isMasterBattle) {
      // 战胜宗主，给予特殊奖励
      return {
        expChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.exp,
        spiritChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.spiritStones,
        items: [
          {
            name: '宗主信物',
            type: ItemType.Material,
            rarity: '仙品',
            description: '宗门之主的象征，持此信物可号令宗门上下。'
          },
          {
            name: '宗门宝库钥匙',
            type: ItemType.Material,
            rarity: '仙品',
            description: '用于开启宗门宝库的钥匙，藏有历代宗主的积累。'
          }
        ]
      };
    } else if (!victory && isMasterBattle) {
      // 挑战宗主失败，根据常量扣除修为
      return {
        expChange: -SECT_MASTER_CHALLENGE_REQUIREMENTS.defeatPenalty.expLoss,
        spiritChange: 0,
      };
    }
    // 如果不是宗主战斗，继续使用普通奖励计算逻辑
  }

  // 天地之魄挑战特殊奖励
  if (actualAdventureType === 'dao_combining_challenge' && victory) {
    const bossId = battleState.bossId;
    if (bossId && HEAVEN_EARTH_SOUL_BOSSES[bossId]) {
      const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];
      // 查找该BOSS对应的功法
      const soulArt = CULTIVATION_ARTS.find(art => art.isHeavenEarthSoulArt && art.bossId === bossId);

      const rewardsItems: AdventureResult['itemObtained'][] = [];

      if (soulArt) {
        rewardsItems.push({
          name: soulArt.name,
          type: '进阶物品',
          description: soulArt.description,
          rarity: '仙品',
          advancedItemType: 'soulArt',
          advancedItemId: soulArt.id
        });
      }

      // 如果BOSS定义中有物品奖励
      if (boss.rewards.items && boss.rewards.items.length > 0) {
        // 这里可以根据需要添加更多BOSS特定的奖励物品
      }

      return {
        expChange: boss.rewards.exp,
        spiritChange: boss.rewards.spiritStones,
        items: rewardsItems.length > 0 ? rewardsItems : undefined
      };
    }
  }

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成物品奖励
  let items: AdventureResult['itemObtained'][] | undefined = undefined;
  if (victory) {
    items = generateLoot(
      enemyStrength,
      actualAdventureType,
      player.realm,
      actualRiskLevel
    );
  }

  return { expChange, spiritChange, items };
};

/**
 * 初始化回合制战斗
 */
export const initializeTurnBasedBattle = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  sectMasterId?: string | null,
  bossId?: string // 指定的天地之魄BOSS ID（用于事件模板）
): Promise<BattleState> => {
  // 创建敌人（如果是追杀战斗，从 player 对象中获取追杀参数）
  const huntSectId = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntSectId : undefined;
  const huntLevel = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntLevel : undefined;
  const enemyData = await createEnemy(player, adventureType, riskLevel, realmMinRealm, huntSectId, huntLevel, bossId);

  // 创建玩家战斗单位
  const playerUnit = createBattleUnitFromPlayer(player);

  // 创建敌人战斗单位
  const enemyUnit: BattleUnit = {
    id: 'enemy',
    name: enemyData.name,
    realm: enemyData.realm,
    hp: enemyData.maxHp,
    maxHp: enemyData.maxHp,
    attack: enemyData.attack,
    defense: enemyData.defense,
    speed: enemyData.speed,
    spirit: enemyData.spirit, // 使用敌人数据中的神识属性
    buffs: [],
    debuffs: [],
    skills: [], // 敌人技能（可以后续添加）
    cooldowns: {},
    // 敌人MP也根据属性计算
    mana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    maxMana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    isDefending: false,
  };

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    if (activePet.skillCooldowns) {
      petSkillCooldowns = { ...activePet.skillCooldowns };
    } else {
      petSkillCooldowns = {};
    }
  }

  // 确定先手
  const playerFirst = (playerUnit.speed || 0) >= enemyUnit.speed;

  const playerMaxActions = calculateActionCount(
    playerUnit.speed,
    enemyUnit.speed,
    playerUnit.spirit,
    enemyUnit.spirit
  );
  const enemyMaxActions = calculateActionCount(
    enemyUnit.speed,
    playerUnit.speed,
    enemyUnit.spirit,
    playerUnit.spirit
  );

  // 初始化战斗历史
  const initialHistory: BattleAction[] = [];

  // 如果玩家神识比对手高，添加震慑提示
  if (playerUnit.spirit > enemyUnit.spirit) {
    const spiritDiff = playerUnit.spirit - enemyUnit.spirit;
    const spiritRatio = spiritDiff / enemyUnit.spirit;
    // 如果神识优势超过20%，添加震慑日志
    if (spiritRatio >= 0.2) {
      const intimidateAction: BattleAction = {
        id: randomId(),
        round: 1,
        turn: 'player',
        actor: 'player',
        actionType: 'attack',
        result: {},
        description: `✨ 你的神识远超对手，对手被你震慑了！`,
      };
      initialHistory.push(intimidateAction);
    }
  }

  return {
    id: randomId(),
    round: 1,
    turn: playerFirst ? 'player' : 'enemy',
    player: playerUnit,
    enemy: enemyUnit,
    history: initialHistory,
    isPlayerTurn: playerFirst,
    waitingForPlayerAction: playerFirst,
    playerInventory: player.inventory, // 保存玩家背包
    playerActionsRemaining: playerFirst ? playerMaxActions : 0,
    enemyActionsRemaining: playerFirst ? 0 : enemyMaxActions,
    playerMaxActions,
    enemyMaxActions,
    enemyStrengthMultiplier: enemyData.strengthMultiplier, // 保存敌人强度倍数
    adventureType, // 保存历练类型
    riskLevel, // 保存风险等级
    bossId, // 保存BOSS ID
    activePet, // 保存激活的灵宠
    petSkillCooldowns, // 保存灵宠技能冷却
  };
};

/**
 * 为没有配置技能的功法生成默认技能
 */
function generateDefaultSkillForArt(art: { id: string; name: string; type: string; grade: string; effects: any }): BattleSkill | null {
  // 根据功法类型和品级生成不同的技能
  const multiplier = GRADE_MULTIPLIERS[art.grade] || 1.0;
  const powerBonus = GRADE_POWER_BONUS[art.grade] || GRADE_POWER_BONUS['黄'];

  // 根据功法类型决定技能类型
  if (art.type === 'body') {
    // 体术类功法 -> 攻击技能
    // 消耗公式: 基础15 + 品级加成
    const bodyCostBonus: Record<string, number> = { '黄': 10, '玄': 25, '地': 45, '天': 75 };
    const skillCost = 15 + (bodyCostBonus[art.grade] || 10);

    const baseDamage = Math.round(30 * multiplier) + powerBonus.baseDamage;
    const damageMultiplier = 0.8 + (multiplier - 1) * 0.3 + powerBonus.damageMultiplier;

    return {
      id: `skill-${art.id}`,
      name: art.name,
      description: `施展${art.name}，对敌人造成伤害。`,
      type: 'attack',
      source: 'cultivation_art',
      sourceId: art.id,
      effects: [],
      cost: { mana: skillCost },
      cooldown: 0,
      maxCooldown: Math.max(2, Math.round(multiplier)),
      target: 'enemy',
      damage: {
        base: baseDamage,
        multiplier: damageMultiplier,
        type: 'physical',
        critChance: 0.1 + (multiplier - 1) * 0.05 + powerBonus.critChance,
        critMultiplier: 1.5 + (multiplier - 1) * 0.2 + powerBonus.critMultiplier,
      },
    };
  } else if (art.type === 'mental') {
    // 心法类功法 -> 根据效果决定技能类型
    if (art.effects?.expRate) {
      // 如果有修炼速度加成，生成Buff技能（提升属性）
      // 消耗公式: 基础20 + 品级加成
      const mentalBuffCostBonus: Record<string, number> = { '黄': 15, '玄': 30, '地': 55, '天': 90 };
      const skillCost = 20 + (mentalBuffCostBonus[art.grade] || 15);

      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `运转${art.name}，提升自身属性。`,
        type: 'buff',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [
          {
            type: 'buff',
            target: 'self',
            buff: {
              id: `${art.id}-buff`,
              name: art.name,
              type: 'attack',
              value: 0.1 * multiplier, // 10% * 品级倍数
              duration: 3,
              source: art.id,
              description: `攻击力提升${Math.round(10 * multiplier)}%`,
            },
          },
        ],
        cost: { mana: skillCost },
        cooldown: 0,
        maxCooldown: Math.max(3, Math.round(multiplier * 1.5)),
        target: 'self',
      };
    } else {
      // 其他心法 -> 法术攻击
      // 消耗公式: 基础25 + 品级加成
      const mentalAttackCostBonus: Record<string, number> = { '黄': 20, '玄': 40, '地': 70, '天': 110 };
      const skillCost = 25 + (mentalAttackCostBonus[art.grade] || 20);

      const baseDamage = Math.round(40 * multiplier) + powerBonus.baseDamage;
      const damageMultiplier = 1.0 + (multiplier - 1) * 0.4 + powerBonus.damageMultiplier;

      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `施展${art.name}，对敌人造成法术伤害。`,
        type: 'attack',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [],
        cost: { mana: skillCost },
        cooldown: 0,
        maxCooldown: Math.max(2, Math.round(multiplier)),
        target: 'enemy',
        damage: {
          base: baseDamage,
          multiplier: damageMultiplier,
          type: 'magical',
          critChance: 0.15 + (multiplier - 1) * 0.05 + powerBonus.critChance,
          critMultiplier: 2.0 + (multiplier - 1) * 0.3 + powerBonus.critMultiplier,
        },
      };
    }
  }

  return null;
}


/**
 * 从玩家数据创建战斗单位
 */
function createBattleUnitFromPlayer(player: PlayerStats): BattleUnit {
  // 获取包含心法加成的总属性
  const totalStats = getPlayerTotalStats(player);

  const equippedItems = getEquippedItems(player);
  let totalAttack = totalStats.attack;
  let totalDefense = totalStats.defense;
  let totalSpirit = totalStats.spirit;
  let totalSpeed = totalStats.speed;

  // 注意：player.attack 等字段已经包含了装备加成
  // getPlayerTotalStats 也包含了心法加成
  // 所以这里不再需要遍历 equippedItems 累加属性，否则会重复计算

  // 收集所有可用技能
  const skills: BattleSkill[] = [];

  // 优化：预先建立功法映射，避免在循环中重复查找
  const artsMap = new Map(
    CULTIVATION_ARTS.map(art => [art.id, art])
  );

  // 1. 功法技能
  player.cultivationArts.forEach((artId) => {
    const artSkills = CULTIVATION_ART_BATTLE_SKILLS[artId];
    if (artSkills) {
      // 如果功法有配置的技能，使用配置的技能
      skills.push(...artSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // 如果功法没有配置技能，自动生成默认技能
      const art = CULTIVATION_ARTS.find(a => a.id === artId);
      if (art) {
        const defaultSkill = generateDefaultSkillForArt(art);
        if (defaultSkill) {
          skills.push({ ...defaultSkill, cooldown: 0 });
        }
      }
    }
  });

  // 2. 法宝/武器技能
  // 使用预构建的映射表，大幅提升查找性能
  equippedItems.forEach((item) => {
    // 优先使用物品自带的battleSkills
    if (item.battleSkills && item.battleSkills.length > 0) {
      skills.push(...item.battleSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // 如果没有，尝试从配置中获取
      if (item.type === ItemType.Artifact) {
        // 优先通过 id 查找（支持重命名后的法宝）
        const artifactSkills = ARTIFACT_SKILLS_MAP.get(item.id) ||
          ARTIFACT_SKILLS_MAP.get(item.name);
        if (artifactSkills) {
          skills.push(...artifactSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      } else if (item.type === ItemType.Weapon) {
        // 优先通过 id 查找
        const weaponSkills = WEAPON_SKILLS_MAP.get(item.id) ||
          WEAPON_SKILLS_MAP.get(item.name);
        if (weaponSkills) {
          skills.push(...weaponSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      }

    }
  });


  // 应用被动效果（心法）
  const buffs: Buff[] = [];
  if (player.activeArtId) {
    const activeArt = artsMap.get(player.activeArtId);
    if (activeArt && activeArt.type === 'mental') {
      const artSkills = CULTIVATION_ART_BATTLE_SKILLS[player.activeArtId];
      if (artSkills) {
        artSkills.forEach((skill) => {
          if (skill.type === 'buff' && skill.effects) {
            skill.effects.forEach((effect) => {
              if (effect.type === 'buff' && effect.buff) {
                buffs.push(effect.buff);
              }
            });
          }
        });
      }
    }
  }

  // 根据境界计算MP（灵力值）
  // MP = 基础值 + 境界加成 + 神识加成
  // 使用新的灵力消耗配置: baseMana=60, realmMultiplier=70, levelMultiplier=15, spiritMultiplier=0.8
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const baseMana = 60; // 基础灵力值(原50,提升20%)
  const realmManaBonus = realmIndex * 70 + Math.max(0, player.realmLevel - 1) * 15; // 境界加成(原50/10,提升40%/50%)
  const spiritManaBonus = Math.floor(totalSpirit * 0.8); // 神识加成(原0.5,提升60%)
  const maxMana = baseMana + realmManaBonus + spiritManaBonus;
  const currentMana = maxMana; // 战斗开始时MP满值

  // 按比例调整血量：如果功法增加了最大血量，当前血量也应该按比例增加
  const baseMaxHp = Number(player.maxHp) || 1; // 避免除零
  const currentHp = Number(player.hp) || 0;
  const hpRatio = baseMaxHp > 0 ? currentHp / baseMaxHp : 0; // 计算血量比例
  const adjustedHp = Math.floor(totalStats.maxHp * hpRatio); // 按比例应用到新的最大血量

  return {
    id: 'player',
    name: player.name,
    realm: player.realm,
    hp: Math.min(adjustedHp, totalStats.maxHp), // 使用按比例调整后的血量
    maxHp: totalStats.maxHp, // 使用实际最大血量（包含金丹法数加成等）
    attack: totalAttack,
    defense: totalDefense,
    speed: totalSpeed,
    spirit: totalSpirit,
    buffs,
    debuffs: [],
    skills,
    cooldowns: {},
    mana: currentMana,
    maxMana: maxMana,
    isDefending: false,
  };
}

/**
 * 获取玩家装备的物品列表
 */
function getEquippedItems(player: PlayerStats): Item[] {
  const equipped: Item[] = [];
  Object.values(player.equippedItems).forEach((itemId) => {
    if (itemId) {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        equipped.push(item);
      }
    }
  });
  return equipped;
}

/**
 * 执行玩家行动
 */
export function executePlayerAction(
  battleState: BattleState,
  action: PlayerAction
): BattleState {
  if (!battleState.waitingForPlayerAction || battleState.playerActionsRemaining <= 0) {
    throw new Error('Not player turn or no actions remaining');
  }

  let newState = { ...battleState };
  let actionResult: BattleAction | null = null;

  switch (action.type) {
    case 'attack':
      actionResult = executeNormalAttack(newState, 'player', 'enemy');
      break;
    case 'skill':
      actionResult = executeSkill(newState, 'player', action.skillId, 'enemy');
      break;
    case 'item':
      actionResult = executeItem(newState, action.itemId);
      break;
    case 'advancedItem':
      actionResult = executeAdvancedItem(newState, action.itemType, action.itemId);
      break;
    case 'defend':
      actionResult = executeDefend(newState, 'player');
      break;
    case 'flee':
      actionResult = executeFlee(newState);
      // 逃跑成功则直接结束
      if (actionResult.description.includes('成功')) {
        return newState;
      }
      break;
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState, actionResult);
  }

  // 减少剩余行动次数
  newState.playerActionsRemaining -= 1;

  // 玩家行动后，灵宠可以行动（如果敌人还没死）
  if (newState.activePet && newState.enemy.hp > 0) {
    // 更新灵宠技能冷却
    const petSkillCooldowns = newState.petSkillCooldowns || {};
    const newPetSkillCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        newPetSkillCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = newPetSkillCooldowns;

    const petAction = executePetAction(newState);
    if (petAction) {
      newState.history.push(petAction);
      newState = updateBattleStateAfterAction(newState, petAction);
    }
  }

  // 如果还有剩余行动次数，继续玩家回合；否则切换到敌人回合
  if (newState.playerActionsRemaining > 0) {
    // 继续玩家回合，可以再次行动
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
  } else {
    // 玩家回合结束，切换到敌人回合
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    newState.enemyActionsRemaining = newState.enemyMaxActions;
  }

  return newState;
}

/**
 * 执行敌人回合（AI）
 */
export function executeEnemyTurn(battleState: BattleState): BattleState {
  let newState = { ...battleState };

  // 使用循环代替递归，处理敌人的多个行动点
  while (newState.enemyActionsRemaining > 0 && newState.enemy.hp > 0 && newState.player.hp > 0) {
    if (newState.waitingForPlayerAction) {
      break;
    }

    const enemy = newState.enemy;
    const actionRoll = Math.random();
    let actionResult: BattleAction | null = null;

    if (actionRoll < 0.7) {
      // 普通攻击
      actionResult = executeNormalAttack(newState, 'enemy', 'player');
    } else if (actionRoll < 0.9 && enemy.skills.length > 0) {
      // 使用技能（随机选择一个可用技能）
      const availableSkills = enemy.skills.filter(
        (s) => (enemy.cooldowns[s.id] || 0) === 0 && (!s.cost.mana || (enemy.mana || 0) >= s.cost.mana)
      );
      if (availableSkills.length > 0) {
        const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        actionResult = executeSkill(newState, 'enemy', skill.id, 'player');
      } else {
        actionResult = executeNormalAttack(newState, 'enemy', 'player');
      }
    } else {
      // 防御
      actionResult = executeDefend(newState, 'enemy');
    }

    if (actionResult) {
      newState.history.push(actionResult);
      newState = updateBattleStateAfterAction(newState, actionResult);
    }

    // 减少剩余行动次数
    newState.enemyActionsRemaining -= 1;
  }

  // 敌人回合结束后，更新灵宠技能冷却（如果存在）
  if (newState.activePet && newState.petSkillCooldowns) {
    const petSkillCooldowns = newState.petSkillCooldowns;
    const updatedCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        updatedCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = updatedCooldowns;
  }

  // 切换到玩家回合
  if (newState.enemyActionsRemaining <= 0) {
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
    newState.round += 1;
    // 重新计算并重置玩家行动次数（速度和神识可能因为Buff/Debuff改变）
    newState.playerMaxActions = calculateActionCount(
      newState.player.speed,
      newState.enemy.speed,
      newState.player.spirit,
      newState.enemy.spirit
    );
    newState.enemyMaxActions = calculateActionCount(
      newState.enemy.speed,
      newState.player.speed,
      newState.enemy.spirit,
      newState.player.spirit
    );
    newState.playerActionsRemaining = newState.playerMaxActions;

    // 如果玩家行动次数为0（速度太慢），立即再次切换回敌人回合
    if (newState.playerActionsRemaining <= 0 && newState.enemy.hp > 0) {
      newState.waitingForPlayerAction = false;
      newState.turn = 'enemy';
      newState.enemyActionsRemaining = newState.enemyMaxActions;
      // 注意：这里需要再次进入循环，所以递归调用一次是安全的（因为 round 已经增加了，且这种情况极少连续发生）
      return executeEnemyTurn(newState);
    }
  }

  return newState;
}


/**
 * 执行普通攻击
 */
function executeNormalAttack(
  battleState: BattleState,
  attackerId: 'player' | 'enemy',
  targetId: 'player' | 'enemy'
): BattleAction {
  const attacker = attackerId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  // 计算基础伤害
  const baseDamage = calcDamage(attacker.attack, target.defense);

  // 计算暴击（优化：统一暴击率计算，设置上限）
  let critChance = 0.10; // 基础暴击率10%
  let critMultiplier = 1.5; // 基础暴击伤害倍率

  // 预先收集攻击者增益
  attacker.buffs.forEach((buff) => {
    if (buff.type === 'crit') {
      critChance += buff.value;
    }
    if (buff.critDamage && buff.critDamage > 0) {
      critMultiplier += buff.critDamage;
    }
  });

  // 根据速度差计算速度加成
  const attackerSpeed = Number(attacker.speed) || 0;
  const targetSpeed = Number(target.speed) || 0;
  const speedSum = Math.max(1, attackerSpeed + targetSpeed);
  const speedBonus = (attackerSpeed / speedSum) * 0.10;
  critChance += speedBonus;

  // 设置暴击率上限为20%（除非Buff本身加成很高）
  critChance = Math.min(0.2, Math.max(0, critChance));
  const isCrit = Math.random() < critChance;
  const finalDamage = isCrit ? Math.round(baseDamage * critMultiplier) : baseDamage;

  // 预先收集目标增益/减益
  let maxDodge = 0;
  let maxDamageReduction = 0;
  let maxReflectRatio = 0;
  let hasIgnoreDefense = attacker.buffs.some(buff => buff.ignoreDefense);

  target.buffs.forEach((buff) => {
    if (buff.dodge && buff.dodge > maxDodge) maxDodge = buff.dodge;
    if (buff.damageReduction && buff.damageReduction > maxDamageReduction) maxDamageReduction = buff.damageReduction;
    if (buff.reflectDamage && buff.reflectDamage > maxReflectRatio) maxReflectRatio = buff.reflectDamage;
  });

  // 检查闪避
  const isDodged = maxDodge > 0 && Math.random() < maxDodge;


  if (isDodged) {
    return {
      id: randomId(),
      round: battleState.round,
      turn: attackerId,
      actor: attackerId,
      actionType: 'attack',
      target: targetId,
      result: {
        miss: true,
      },
      description:
        attackerId === 'player'
          ? `你发动攻击，但被${target.name}闪避了！`
          : `${attacker.name}攻击，但被你闪避了！`,
    };
  }

  // 应用防御状态（优化：根据攻击力和防御力比例动态调整减伤效果）
  let actualDamage = finalDamage;

  if (target.isDefending && !hasIgnoreDefense) {
    // 基础减伤50%，如果攻击力远高于防御力，减伤效果降低
    const attackDefenseRatio = attacker.attack / Math.max(1, target.defense);
    let defenseReduction = 0.5; // 基础减伤50%

    // 如果攻击力是防御力的2倍以上，减伤效果降低到40%
    if (attackDefenseRatio > 2.0) {
      defenseReduction = 0.4;
    }
    // 如果攻击力是防御力的3倍以上，减伤效果降低到35%
    else if (attackDefenseRatio > 3.0) {
      defenseReduction = 0.35;
    }
    // 如果防御力高于攻击力，减伤效果提高到60%
    else if (attackDefenseRatio < 1.0) {
      defenseReduction = 0.6;
    }

    actualDamage = Math.round(actualDamage * (1 - defenseReduction));
  } else if (hasIgnoreDefense) {
    // 无视防御，直接造成伤害
    actualDamage = finalDamage;
  }

  // 应用伤害减免buff
  if (maxDamageReduction > 0) {
    actualDamage = Math.round(actualDamage * (1 - maxDamageReduction));
  }

  // 更新目标血量（确保是整数）
  target.hp = Math.max(0, Math.floor(target.hp - actualDamage));

  // 处理反弹伤害（如果目标有 reflectDamage buff）
  let reflectedDamage = 0;
  if (actualDamage > 0 && maxReflectRatio > 0) {
    reflectedDamage = Math.floor(actualDamage * maxReflectRatio);
    attacker.hp = Math.max(0, Math.floor(attacker.hp - reflectedDamage));
  }


  // 构建描述
  let description = '';
  if (attackerId === 'player') {
    description = `你发动攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`;
    if (reflectedDamage > 0) {
      description += ` ${target.name}的反弹效果对你造成了 ${reflectedDamage} 点伤害！`;
    }
  } else {
    description = `${attacker.name}攻击，造成 ${actualDamage}${isCrit ? '（暴击）' : ''} 点伤害。`;
    if (reflectedDamage > 0) {
      description += ` 你的反弹效果对${attacker.name}造成了 ${reflectedDamage} 点伤害！`;
    }
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: attackerId,
    actor: attackerId,
    actionType: 'attack',
    target: targetId,
    result: {
      damage: actualDamage,
      crit: isCrit,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * 执行技能
 */
function executeSkill(
  battleState: BattleState,
  casterId: 'player' | 'enemy',
  skillId: string,
  targetId: 'player' | 'enemy'
): BattleAction {
  const caster = casterId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  const skill = caster.skills.find((s) => s.id === skillId);
  if (!skill) {
    throw new Error(`Skill ${skillId} not found`);
  }

  // 检查冷却
  if ((caster.cooldowns[skillId] || 0) > 0) {
    throw new Error(`Skill ${skillId} is on cooldown`);
  }

  // 检查消耗
  if (skill.cost.mana && (caster.mana || 0) < skill.cost.mana) {
    throw new Error(`灵力不足！需要 ${skill.cost.mana} 点灵力，当前只有 ${caster.mana || 0} 点。`);
  }

  // 消耗资源
  if (skill.cost.mana) {
    caster.mana = (caster.mana || 0) - skill.cost.mana;
  }

  // 执行技能效果
  let damage = 0;
  let heal = 0;
  let reflectedDamage = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];

  // 伤害计算（统一使用calcDamage函数，确保与普通攻击一致）
  if (skill.damage) {
    const base = skill.damage.base;
    const multiplier = skill.damage.multiplier;
    const statValue =
      skill.damage.type === 'magical' ? caster.spirit : caster.attack;
    // 计算技能的基础攻击力（用于伤害计算）
    const skillAttack = base + statValue * multiplier;

    // 根据伤害类型选择对应的防御属性
    const targetDefense = skill.damage.type === 'magical' ? target.spirit : target.defense;

    // 使用统一的伤害计算函数
    let baseDamage = calcDamage(skillAttack, targetDefense);

    // 计算暴击
    let critChance = skill.damage.critChance || 0;
    // 应用Buff
    caster.buffs.forEach((buff) => {
      if (buff.type === 'crit') {
        critChance += buff.value;
      }
    });
    const isCrit = Math.random() < critChance;

    // 计算暴击伤害倍率（基础1.5倍或技能指定倍率，加上buff加成）
    let critMultiplier = skill.damage.critMultiplier || 1.5;
    caster.buffs.forEach((buff) => {
      if (buff.critDamage && buff.critDamage > 0) {
        critMultiplier += buff.critDamage;
      }
    });

    // 计算基础伤害（包括暴击）
    damage = isCrit
      ? Math.round(baseDamage * critMultiplier)
      : Math.round(baseDamage);

    // 添加随机伤害浮动（0.9-1.1倍）
    const randomMultiplier = 0.9 + Math.random() * 0.2; // 0.9-1.1之间的随机数
    damage = Math.round(damage * randomMultiplier);

    // 应用防御（保留技能伤害的特殊处理逻辑）
    if (skill.damage.type === 'physical') {
      // 物理伤害：如果伤害值大于目标防御，造成伤害；否则造成很少的穿透伤害
      if (damage > target.defense) {
        damage = damage - target.defense * 0.5; // 正常减伤
      } else {
        // 伤害小于防御，造成少量穿透伤害
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    } else {
      // 法术伤害：如果伤害值大于目标神识，造成伤害；否则造成很少的穿透伤害
      // 应用法术防御buff
      let effectiveSpirit = target.spirit;
      if (target.buffs.some(buff => buff.magicDefense && buff.magicDefense > 0)) {
        const maxMagicDefense = Math.max(...target.buffs
          .filter(buff => buff.magicDefense && buff.magicDefense > 0)
          .map(buff => buff.magicDefense!));
        effectiveSpirit = Math.floor(target.spirit * (1 + maxMagicDefense));
      }

      if (damage > effectiveSpirit) {
        damage = damage - effectiveSpirit * 0.3; // 正常减伤
      } else {
        // 伤害小于神识，造成少量穿透伤害
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    }

    // 确保伤害至少为1（除非完全免疫）
    damage = Math.max(1, Math.round(damage));

    // 检查闪避
    let isDodged = false;
    if (target.buffs.some(buff => buff.dodge && buff.dodge > 0)) {
      const maxDodge = Math.max(...target.buffs
        .filter(buff => buff.dodge && buff.dodge > 0)
        .map(buff => buff.dodge!));
      isDodged = Math.random() < maxDodge;
    }

    if (isDodged) {
      return {
        id: randomId(),
        round: battleState.round,
        turn: casterId,
        actor: casterId,
        actionType: 'skill',
        skillId,
        target: targetId,
        result: {
          miss: true,
          manaCost: skill.cost.mana,
        },
        description: generateSkillDescription(skill, caster, target, 0, 0) + ` 但被${target.name}闪避了！`,
      };
    }

    // 检查攻击者是否有无视防御buff
    const hasIgnoreDefense = caster.buffs.some(buff => buff.ignoreDefense);

    // 应用防御状态减伤（优化：与普通攻击保持一致，动态调整减伤效果）
    if (target.isDefending && !hasIgnoreDefense) {
      // 基础减伤50%，如果攻击力远高于防御力，减伤效果降低
      const skillAttackValue = skill.damage.type === 'magical' ? caster.spirit : caster.attack;
      const targetDefenseValue = skill.damage.type === 'magical' ? target.spirit : target.defense;
      const attackDefenseRatio = skillAttackValue / Math.max(1, targetDefenseValue);
      let defenseReduction = 0.5; // 基础减伤50%

      // 如果攻击力是防御力的2倍以上，减伤效果降低到40%
      if (attackDefenseRatio > 2.0) {
        defenseReduction = 0.4;
      }
      // 如果攻击力是防御力的3倍以上，减伤效果降低到35%
      else if (attackDefenseRatio > 3.0) {
        defenseReduction = 0.35;
      }
      // 如果防御力高于攻击力，减伤效果提高到60%
      else if (attackDefenseRatio < 1.0) {
        defenseReduction = 0.6;
      }

      damage = Math.round(damage * (1 - defenseReduction));
    } else if (hasIgnoreDefense) {
      // 无视防御，直接造成伤害
      damage = damage;
    }

    // 应用伤害减免buff
    if (target.buffs.some(buff => buff.damageReduction && buff.damageReduction > 0)) {
      const maxReduction = Math.max(...target.buffs
        .filter(buff => buff.damageReduction && buff.damageReduction > 0)
        .map(buff => buff.damageReduction!));
      damage = Math.round(damage * (1 - maxReduction));
    }

    target.hp = Math.max(0, Math.floor(target.hp - damage));

    // 处理反弹伤害（如果目标有 reflectDamage buff）
    if (damage > 0 && target.buffs.some(buff => buff.reflectDamage && buff.reflectDamage > 0)) {
      // 找到最高的反弹伤害比例
      const maxReflectRatio = Math.max(...target.buffs
        .filter(buff => buff.reflectDamage && buff.reflectDamage > 0)
        .map(buff => buff.reflectDamage!));

      if (maxReflectRatio > 0) {
        reflectedDamage = Math.floor(damage * maxReflectRatio);
        caster.hp = Math.max(0, Math.floor(caster.hp - reflectedDamage));
      }
    }
  }

  // 治疗计算
  if (skill.heal) {
    const base = skill.heal.base;
    const multiplier = skill.heal.multiplier;
    heal = Math.floor(base + caster.maxHp * multiplier);
    caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + heal));
  }

  // 应用技能效果
  skill.effects.forEach((effect) => {
    if (effect.type === 'buff' && effect.buff) {
      const targetUnit = effect.target === 'self' ? caster : target;
      targetUnit.buffs.push({ ...effect.buff });
    }
    if (effect.type === 'debuff' && effect.debuff) {
      const targetUnit = effect.target === 'enemy' ? target : caster;
      // 检查免疫
      const hasImmunity = targetUnit.buffs.some(buff => buff.immunity);
      if (!hasImmunity) {
        targetUnit.debuffs.push({ ...effect.debuff });
      }
    }
  });

  // 设置冷却
  caster.cooldowns[skillId] = skill.maxCooldown;

  // 生成描述（包含反弹伤害信息）
  let description = generateSkillDescription(skill, caster, target, damage, heal);
  if (reflectedDamage > 0) {
    if (casterId === 'enemy') {
      description += ` 你的反弹效果对${caster.name}造成了 ${reflectedDamage} 点伤害！`;
    } else {
      description += ` ${target.name}的反弹效果对你造成了 ${reflectedDamage} 点伤害！`;
    }
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: casterId,
    actor: casterId,
    actionType: 'skill',
    skillId,
    target: targetId,
    result: {
      damage,
      heal,
      buffs,
      debuffs,
      manaCost: skill.cost.mana,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * 执行使用进阶物品
 */
function executeAdvancedItem(
  battleState: BattleState,
  itemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule' | 'soulArt',
  itemId: string
): BattleAction {
  const player = battleState.player;
  const enemy = battleState.enemy;

  // 根据类型获取进阶物品
  let advancedItem: any = null;
  switch (itemType) {
    case 'foundationTreasure':
      advancedItem = FOUNDATION_TREASURES[itemId];
      break;
    case 'heavenEarthEssence':
      advancedItem = HEAVEN_EARTH_ESSENCES[itemId];
      break;
    case 'heavenEarthMarrow':
      advancedItem = HEAVEN_EARTH_MARROWS[itemId];
      break;
    case 'longevityRule':
      advancedItem = LONGEVITY_RULES[itemId];
      break;
    case 'soulArt':
      advancedItem = CULTIVATION_ARTS.find(art => art.id === itemId);
      break;
  }

  if (!advancedItem || !advancedItem.battleEffect) {
    throw new Error(`Advanced item ${itemId} not found or has no battle effect`);
  }

  const effect = advancedItem.battleEffect;
  let damage = 0;
  let heal = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];
  let description = '';

  // 检查冷却（使用battleState中的冷却记录）
  const cooldownKey = `advanced_${itemType}_${itemId}`;
  if ((battleState.player.cooldowns[cooldownKey] || 0) > 0) {
    throw new Error(`${advancedItem.name}还在冷却中`);
  }

  // 检查消耗
  if (effect.cost.lifespan) {
    // 寿命消耗在战斗结束后处理，这里只记录
    // 实际应该在战斗结束后从playerStats中扣除
  }
  if (effect.cost.maxHp) {
    const maxHpCost = typeof effect.cost.maxHp === 'number' && effect.cost.maxHp < 1
      ? Math.floor(player.maxHp * effect.cost.maxHp)
      : (effect.cost.maxHp || 0);
    player.maxHp = Math.max(1, player.maxHp - maxHpCost);
    player.hp = Math.min(player.hp, player.maxHp); // 调整当前HP不超过最大HP
  }
  if (effect.cost.hp) {
    player.hp = Math.max(1, player.hp - effect.cost.hp);
  }
  if (effect.cost.spirit) {
    player.mana = Math.max(0, (player.mana || 0) - effect.cost.spirit);
  }

  // 应用效果
  if (effect.type === 'damage' && effect.effect.damage) {
    const dmg = effect.effect.damage;
    let baseDamage = 0;

    if (dmg.base) {
      baseDamage = dmg.base;
    }
    if (dmg.multiplier) {
      baseDamage += player.attack * dmg.multiplier;
    }
    if (dmg.percentOfMaxHp) {
      baseDamage += player.maxHp * dmg.percentOfMaxHp;
    }
    if (dmg.percentOfLifespan) {
      // 寿命百分比伤害（需要从playerStats获取，这里简化处理）
      baseDamage += player.maxHp * dmg.percentOfLifespan * 0.1; // 简化：用最大HP的10%代表寿命
    }

    // 应用对邪魔的伤害倍率（如果敌人是邪魔类型）
    const isDemon = enemy.name.includes('魔') || enemy.name.includes('邪') || enemy.name.includes('鬼') ||
                    enemy.name.includes('妖') || enemy.name.includes('怨') || enemy.name.includes('恶');
    if (dmg.demonMultiplier && isDemon) {
      baseDamage = Math.floor(baseDamage * dmg.demonMultiplier);
    }

    // 计算最终伤害
    if (dmg.ignoreDefense) {
      // 支持百分比无视防御（0-1之间的数字）或完全无视（true）
      const ignoreRatio = typeof dmg.ignoreDefense === 'number' ? dmg.ignoreDefense : 1;
      const effectiveDefense = enemy.defense * (1 - ignoreRatio);
      damage = Math.floor(Math.max(1, baseDamage - effectiveDefense * 0.5));
    } else {
      damage = Math.floor(Math.max(1, baseDamage - enemy.defense * 0.5));
    }

    // 应用必定暴击
    let isCrit = false;
    if (dmg.guaranteedCrit) {
      isCrit = true;
      damage = Math.floor(damage * 1.5); // 基础暴击倍率1.5
    }

    enemy.hp = Math.max(0, enemy.hp - damage);
    description = `${effect.name}！对${enemy.name}造成了 ${damage}${isCrit ? '（暴击）' : ''} 点伤害！`;
  }

  if (effect.type === 'heal' && effect.effect.heal) {
    const healEffect = effect.effect.heal;
    if (healEffect.base) {
      heal = healEffect.base;
    }
    if (healEffect.percentOfMaxHp) {
      heal += Math.floor(player.maxHp * healEffect.percentOfMaxHp);
    }
    player.hp = Math.min(player.maxHp, player.hp + heal);
    description = `${effect.name}！恢复了 ${heal} 点气血！`;
  }

  if (effect.type === 'buff' && effect.effect.buff) {
    const buffEffect = effect.effect.buff;
    const buff: Buff = {
      id: `advanced_${itemId}_${Date.now()}`,
      name: effect.name,
      type: 'custom',
      value: 0,
      duration: buffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (buffEffect.attack) {
      player.attack = Math.floor(player.attack * (1 + buffEffect.attack));
    }
    if (buffEffect.defense) {
      player.defense = Math.floor(player.defense * (1 + buffEffect.defense));
    }
    if (buffEffect.speed) {
      player.speed = Math.floor(player.speed * (1 + buffEffect.speed));
    }
    if (buffEffect.critChance) {
      // 暴击率加成通过buff记录
      buff.type = 'crit';
      buff.value = buffEffect.critChance;
    }
    if (buffEffect.critDamage) {
      // 暴击伤害加成
      buff.critDamage = buffEffect.critDamage;
    }
    if (buffEffect.reflectDamage) {
      // 反弹伤害比例
      buff.reflectDamage = buffEffect.reflectDamage;
    }
    if (buffEffect.spirit) {
      // 神识加成
      player.spirit = Math.floor(player.spirit * (1 + buffEffect.spirit));
    }
    if (buffEffect.physique) {
      // 体魄加成（体魄影响防御和生命）
      player.defense = Math.floor(player.defense * (1 + buffEffect.physique * 0.5));
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.physique * 0.3));
      player.hp = Math.min(player.maxHp, Math.floor(player.hp * (1 + buffEffect.physique * 0.3)));
    }
    if (buffEffect.maxHp) {
      // 最大气血加成
      const oldMaxHp = player.maxHp;
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.maxHp));
      // 按比例增加当前HP
      const hpRatio = player.hp / oldMaxHp;
      player.hp = Math.floor(player.maxHp * hpRatio);
    }
    if (buffEffect.revive) {
      // 复活标记
      buff.revive = buffEffect.revive;
    }
    if (buffEffect.dodge !== undefined) {
      // 闪避率加成
      buff.dodge = buffEffect.dodge;
    }
    if (buffEffect.ignoreDefense) {
      // 攻击无视防御
      buff.ignoreDefense = buffEffect.ignoreDefense;
    }
    if (buffEffect.regen) {
      // 每回合恢复
      buff.regen = buffEffect.regen;
    }
    if (buffEffect.damageReduction) {
      // 伤害减免
      buff.damageReduction = buffEffect.damageReduction;
    }
    if (buffEffect.immunity) {
      // 免疫所有负面状态
      buff.immunity = buffEffect.immunity;
    }
    if (buffEffect.cleanse) {
      // 清除所有负面状态
      player.debuffs = [];
    }
    if (buffEffect.magicDefense) {
      // 法术防御加成（影响神识防御）
      buff.magicDefense = buffEffect.magicDefense;
    }

    player.buffs.push(buff);
    buffs.push(buff);
    description = `${effect.name}！获得了强大的增益效果！`;
  }

  if (effect.type === 'debuff' && effect.effect.debuff) {
    const debuffEffect = effect.effect.debuff;
    const debuff: Debuff = {
      id: `advanced_${itemId}_debuff_${Date.now()}`,
      name: effect.name,
      type: 'weakness',
      value: 0,
      duration: debuffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (debuffEffect.attack) {
      enemy.attack = Math.floor(enemy.attack * (1 - debuffEffect.attack));
    }
    if (debuffEffect.defense) {
      enemy.defense = Math.floor(enemy.defense * (1 - debuffEffect.defense));
    }
    if (debuffEffect.speed) {
      enemy.speed = Math.floor(enemy.speed * (1 + debuffEffect.speed)); // speed是负数，所以用加法
    }
    if (debuffEffect.spirit) {
      enemy.spirit = Math.floor(enemy.spirit * (1 + debuffEffect.spirit)); // spirit是负数，所以用加法
    }
    if (debuffEffect.hp) {
      // 持续掉血（负数表示损失）
      debuff.type = 'poison'; // 使用poison类型表示持续掉血
      debuff.value = debuffEffect.hp; // 存储百分比值
    }

    // 检查免疫
    const hasImmunity = enemy.buffs.some(buff => buff.immunity);
    if (!hasImmunity) {
      enemy.debuffs.push(debuff);
      debuffs.push(debuff);
      description = `${effect.name}！${enemy.name}受到了削弱效果！`;
    } else {
      description = `${effect.name}！但${enemy.name}免疫了负面效果！`;
    }
  }

  // 设置冷却
  if (effect.cooldown) {
    battleState.player.cooldowns[cooldownKey] = effect.cooldown;
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'skill', // 使用skill类型，因为进阶物品效果类似技能
    result: {
      damage,
      heal,
      buffs,
      debuffs,
    },
    description,
  };
}

/**
 * 执行使用物品
 */
function executeItem(battleState: BattleState, itemId: string): BattleAction {
  const player = battleState.player;

  // 从玩家背包中查找物品
  const item = battleState.playerInventory.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found in inventory`);
  }

  // 查找丹药配置（通过物品名称匹配）
  const potionConfig = Object.values(BATTLE_POTIONS).find(
    (p) => p.name === item.name
  );
  if (!potionConfig) {
    throw new Error(`Potion config for ${item.name} not found`);
  }

  let heal = 0;
  const buffs: Buff[] = [];

  if (potionConfig.type === 'heal' && potionConfig.effect.heal) {
    heal = Math.floor(potionConfig.effect.heal);
    player.hp = Math.min(player.maxHp, Math.floor(player.hp + heal));
  }

  if (potionConfig.type === 'buff' && potionConfig.effect.buffs) {
    potionConfig.effect.buffs.forEach((buff) => {
      player.buffs.push({ ...buff });
    });
  }

  // 消耗物品（减少数量）
  const itemIndex = battleState.playerInventory.findIndex((i) => i.id === itemId);
  if (itemIndex >= 0) {
    battleState.playerInventory[itemIndex] = {
      ...battleState.playerInventory[itemIndex],
      quantity: battleState.playerInventory[itemIndex].quantity - 1,
    };
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'item',
    itemId,
    result: {
      heal,
      buffs: potionConfig.effect.buffs || [],
    },
    description: `你使用了${potionConfig.name}，${heal > 0 ? `恢复了 ${heal} 点气血。` : '获得了增益效果。'}`,
  };
}

/**
 * 执行防御
 */
function executeDefend(
  battleState: BattleState,
  unitId: 'player' | 'enemy'
): BattleAction {
  const unit = unitId === 'player' ? battleState.player : battleState.enemy;
  unit.isDefending = true;

  return {
    id: randomId(),
    round: battleState.round,
    turn: unitId,
    actor: unitId,
    actionType: 'defend',
    result: {},
    description:
      unitId === 'player'
        ? '你进入防御状态，下回合受到的伤害减少50%。'
        : `${unit.name}进入防御状态。`,
  };
}

/**
 * 执行逃跑
 */
function executeFlee(battleState: BattleState): BattleAction {
  // 逃跑成功率基于速度差
  const playerSpeed = Number(battleState.player.speed) || 0;
  const enemySpeed = Number(battleState.enemy.speed) || 0;
  const speedDiff = playerSpeed - enemySpeed;
  const fleeChance = 0.3 + Math.min(0.5, speedDiff / 100);
  const success = Math.random() < Math.max(0, Math.min(1, fleeChance)); // 确保概率在0-1之间

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'flee',
    result: {},
    description: success
      ? '你成功逃离了战斗。'
      : '你试图逃跑，但被敌人拦截。',
  };
}

/**
 * 更新战斗状态（处理持续效果、冷却等）
 */
function updateBattleStateAfterAction(
  battleState: BattleState,
  action: BattleAction
): BattleState {
  // 深拷贝玩家和敌人状态，确保不可变性
  const newState: BattleState = {
    ...battleState,
    player: {
      ...battleState.player,
      buffs: battleState.player.buffs.map(b => ({ ...b })),
      debuffs: battleState.player.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.player.cooldowns },
    },
    enemy: {
      ...battleState.enemy,
      buffs: battleState.enemy.buffs.map(b => ({ ...b })),
      debuffs: battleState.enemy.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.enemy.cooldowns },
    },
  };

  // 处理持续效果
  [newState.player, newState.enemy].forEach((unit) => {
    // 处理Debuff（持续伤害）
    unit.debuffs = unit.debuffs
      .map((debuff) => {
        if (debuff.type === 'poison' || debuff.type === 'burn') {
          // 如果是百分比掉血（value是负数百分比）
          if (debuff.value < 0 && debuff.value > -1) {
            const hpLoss = Math.floor(unit.maxHp * Math.abs(debuff.value));
            unit.hp = Math.max(0, Math.floor(unit.hp - hpLoss));
          } else {
            // 固定数值掉血
            const debuffValue = Math.floor(debuff.value);
            unit.hp = Math.max(0, Math.floor(unit.hp - debuffValue));
          }
        }
        return { ...debuff, duration: debuff.duration - 1 };
      })
      .filter((debuff) => debuff.duration > 0);

    // 处理Buff（持续治疗等）
    unit.buffs = unit.buffs
      .map((buff) => {
        if (buff.type === 'heal' && buff.duration > 0) {
          const healValue = Math.floor(buff.value);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + healValue));
        }
        // 处理持续恢复（regen）
        if (buff.regen && buff.regen > 0 && buff.duration > 0) {
          const regenValue = Math.floor(unit.maxHp * buff.regen);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + regenValue));
        }
        return { ...buff, duration: buff.duration === -1 ? -1 : buff.duration - 1 };
      })
      .filter((buff) => buff.duration === -1 || buff.duration > 0);

    // 更新冷却时间
    Object.keys(unit.cooldowns).forEach((skillId) => {
      if (unit.cooldowns[skillId] > 0) {
        unit.cooldowns[skillId] -= 1;
      }
    });

    // 重置防御状态
    unit.isDefending = false;
  });

  return newState;
}

/**
 * 检查战斗是否结束
 */
export function checkBattleEnd(battleState: BattleState): boolean {
  return battleState.player.hp <= 0 || battleState.enemy.hp <= 0;
}

/**
 * 生成技能描述
 */
function generateSkillDescription(
  skill: BattleSkill,
  caster: BattleUnit,
  target: BattleUnit,
  damage: number,
  heal: number
): string {
  if (damage > 0) {
    return `你使用【${skill.name}】，对${target.name}造成 ${damage} 点伤害。`;
  }
  if (heal > 0) {
    return `你使用【${skill.name}】，恢复了 ${heal} 点气血。`;
  }
  return `你使用【${skill.name}】。`;
}

/**
 * 执行灵宠行动
 */
function executePetAction(battleState: BattleState): BattleAction | null {
  if (!battleState.activePet || battleState.enemy.hp <= 0) {
    return null;
  }

  const { action, updatedEnemyHp, updatedPlayerHp, updatedCooldowns } = handlePetAction(
    battleState.activePet,
    battleState.player,
    { hp: battleState.enemy.hp, maxHp: battleState.enemy.maxHp, defense: battleState.enemy.defense, name: battleState.enemy.name },
    battleState.petSkillCooldowns || {},
    randomId,
    calcDamage
  );

  battleState.enemy.hp = updatedEnemyHp;
  battleState.player.hp = updatedPlayerHp;
  battleState.petSkillCooldowns = updatedCooldowns;

  return action as BattleAction;
}
