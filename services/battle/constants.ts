import { AdventureType, BattleSkill, ItemRarity, ItemType } from '../../types';
import { ARTIFACT_BATTLE_SKILLS, WEAPON_BATTLE_SKILLS } from '../../constants/index';
import { getItemsByType } from '../../utils/itemConstantsUtils';

// ==================== 配置常量 ====================

export const ENEMY_NAMES = [
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

export const ENEMY_TITLES = [
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
export const RISK_REWARD_MULTIPLIERS = {
  低: 1.0,
  中: 1.3,
  高: 1.6,
  极度危险: 2.2,
};

/**
 * 功法品级基础倍数
 */
export const GRADE_MULTIPLIERS: Record<string, number> = {
  '黄': 1.0,
  '玄': 1.5,
  '地': 2.5,
  '天': 4.0,
};

/**
 * 技能威力品级加成
 */
export const GRADE_POWER_BONUS: Record<string, { baseDamage: number; damageMultiplier: number; critChance: number; critMultiplier: number }> = {
  '黄': { baseDamage: 5, damageMultiplier: 0, critChance: 0, critMultiplier: 0 },
  '玄': { baseDamage: 10, damageMultiplier: 0.1, critChance: 0.02, critMultiplier: 0.1 },
  '地': { baseDamage: 20, damageMultiplier: 0.2, critChance: 0.05, critMultiplier: 0.2 },
  '天': { baseDamage: 40, damageMultiplier: 0.35, critChance: 0.08, critMultiplier: 0.3 },
};

// ==================== 预构建映射表 ====================

// 预构建法宝和武器技能映射表，避免在战斗中重复构建
export const ARTIFACT_SKILLS_MAP = new Map<string, BattleSkill[]>();
export const WEAPON_SKILLS_MAP = new Map<string, BattleSkill[]>();

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

export const baseBattleChance: Record<AdventureType, number> = {
  normal: 0.25, // 历练基础概率降低到25%
  lucky: 0.12, // 机缘历练基础概率降低到12%
  secret_realm: 0.45, // 秘境基础概率降低到45%
  sect_challenge: 1.0, // 挑战必然触发
  dao_combining_challenge: 1.0, // 天地之魄挑战必然触发
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
export const RARITY_ORDER: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
