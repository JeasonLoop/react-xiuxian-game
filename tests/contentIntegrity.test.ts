/**
 * 内容数据完整性测试
 * 遍历各系统的静态配置数据，校验引用完整性与数值合法性，
 * 防止内容扩容时出现断链（引用不存在的物品/功法/称号/BOSS 等）。
 *
 * 运行方式：npx tsx tests/contentIntegrity.test.ts
 * 说明：违规项会全部收集后统一报告，一次运行能看到所有问题。
 */
import assert from 'node:assert/strict';
import { REALM_ORDER } from '../constants/realms';
import { CULTIVATION_ARTS, CULTIVATION_ART_BATTLE_SKILLS } from '../constants/cultivation';
import { ART_SYNERGY_SETS } from '../constants/artSynergy';
import { SECRET_REALMS } from '../constants/secretRealms';
import {
  ALL_PILL_RECIPES,
  ALCHEMY_MATERIALS_ITEMS,
  PET_EVOLUTION_MATERIALS_ITEMS,
  INITIAL_ITEMS,
  ARTIFACT_STONES,
  COMMON_PILLS,
} from '../constants/items';
import { PET_TEMPLATES } from '../constants/pets';
import { ACHIEVEMENTS, TITLES, TITLE_SET_EFFECTS } from '../constants/talents';
import { getTowerFloorConfig, calculateTowerDailySweep } from '../constants/tower';
import { HEAVEN_EARTH_SOUL_BOSSES } from '../constants/heavenEarth';
import { LONGEVITY_RULES } from '../constants/advanced';
import { SECTS, SECT_SHOP_ITEMS } from '../constants/sects';
import { PREDEFINED_DAILY_QUESTS } from '../constants/dailyQuest';
import { PLANTABLE_HERBS } from '../constants/grotto';
import { LOTTERY_PRIZES } from '../constants/lottery';
import {
  initializeEventTemplateLibrary,
  getEventTemplateLibrary,
} from '../services/adventureTemplateService';

// ==================== 基础集合 ====================

const REALM_SET = new Set<string>(REALM_ORDER);
const ART_GRADES = new Set(['天', '地', '玄', '黄']);
const RARITIES = new Set(['普通', '稀有', '传说', '仙品']);
const RISK_LEVELS = new Set(['低', '中', '高', '极度危险']);
const EVENT_COLORS = new Set(['normal', 'gain', 'danger', 'special']);
const ADVENTURE_TYPES = new Set(['normal', 'lucky', 'secret_realm', 'sect_challenge', 'dao_combining_challenge']);
const QUEST_TYPES = new Set([
  'meditate', 'adventure', 'breakthrough', 'alchemy', 'equip',
  'pet', 'sect', 'realm', 'kill', 'collect', 'learn', 'other',
]);

/** 全游戏已知物品名集合（用于校验各处引用的物品名真实存在） */
const KNOWN_ITEM_NAMES = new Set<string>();
for (const item of INITIAL_ITEMS) KNOWN_ITEM_NAMES.add(item.name);
for (const item of ALCHEMY_MATERIALS_ITEMS) KNOWN_ITEM_NAMES.add(item.name);
for (const item of PET_EVOLUTION_MATERIALS_ITEMS) KNOWN_ITEM_NAMES.add(item.name);
for (const item of ARTIFACT_STONES) KNOWN_ITEM_NAMES.add(item.name);
for (const herb of PLANTABLE_HERBS as { name: string }[]) KNOWN_ITEM_NAMES.add(herb.name);
for (const shopItem of SECT_SHOP_ITEMS) KNOWN_ITEM_NAMES.add(shopItem.item.name);
for (const pillName of Object.keys(COMMON_PILLS)) KNOWN_ITEM_NAMES.add(pillName);
for (const recipe of ALL_PILL_RECIPES) KNOWN_ITEM_NAMES.add(recipe.result.name);
KNOWN_ITEM_NAMES.add('太虚洗炼石'); // tower.createReforgeStoneItem
KNOWN_ITEM_NAMES.add('太虚悟道卷'); // tower.createComprehensionScrollItem

// ==================== 违规收集器 ====================

const violations: string[] = [];
const add = (scope: string, msg: string) => violations.push(`[${scope}] ${msg}`);

/** 检查文本是否干净（非空、无占位符残留） */
function isCleanText(text: unknown): boolean {
  if (typeof text !== 'string' || text.trim() === '') return false;
  return !/undefined|NaN|\{\}/.test(text);
}

// ==================== 各数据源检查 ====================

/** 抽奖奖池：id 唯一、权重合法、跨系统引用存在 */
function checkLottery() {
  const scope = '抽奖';
  const ids = new Set<string>();
  for (const prize of LOTTERY_PRIZES) {
    if (ids.has(prize.id)) add(scope, `重复 id: ${prize.id}`);
    ids.add(prize.id);
    if (!(prize.weight > 0)) add(scope, `${prize.id} 权重非法: ${prize.weight}`);
    if (!RARITIES.has(prize.rarity)) add(scope, `${prize.id} 稀有度非法: ${prize.rarity}`);
    const v = prize.value ?? {};
    if (prize.type === 'spiritStones' && !(v.spiritStones > 0)) add(scope, `${prize.id} 灵石数非法`);
    if (prize.type === 'exp' && !(v.exp > 0)) add(scope, `${prize.id} 经验非法`);
    if (prize.type === 'ticket' && !(v.tickets > 0)) add(scope, `${prize.id} 抽奖券数非法`);
    if (prize.type === 'pet' && !PET_TEMPLATES.some((p) => p.id === v.petId)) {
      add(scope, `${prize.id} 引用不存在的灵宠: ${v.petId}`);
    }
    if (prize.type === 'art' && !CULTIVATION_ARTS.some((a) => a.id === v.artId)) {
      add(scope, `${prize.id} 引用不存在的功法: ${v.artId}`);
    }
    if (prize.type === 'item' && !isCleanText(v.item?.name)) {
      add(scope, `${prize.id} 物品奖品缺少名称`);
    }
  }
}

/** 丹方：材料可溯源、产物不重名、效果完整 */
function checkPillRecipes() {
  const scope = '丹方';
  const resultNames = new Set<string>();
  for (const recipe of ALL_PILL_RECIPES) {
    if (resultNames.has(recipe.result.name)) add(scope, `产物重名: ${recipe.result.name}`);
    resultNames.add(recipe.result.name);
    if (!(recipe.cost > 0)) add(scope, `${recipe.name} 炼制花费非法: ${recipe.cost}`);
    const hasEffect = recipe.result.effect || recipe.result.permanentEffect;
    if (!hasEffect) add(scope, `${recipe.result.name} 无任何效果定义`);
    for (const ing of recipe.ingredients) {
      if (!KNOWN_ITEM_NAMES.has(ing.name)) {
        add(scope, `${recipe.name} 引用未知材料: ${ing.name}×${ing.qty}`);
      }
      if (!(ing.qty > 0)) add(scope, `${recipe.name} 材料 ${ing.name} 数量非法: ${ing.qty}`);
    }
  }
}

/** 灵宠：id/名称唯一、技能完整、进化材料存在 */
function checkPets() {
  const scope = '灵宠';
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const pet of PET_TEMPLATES) {
    if (ids.has(pet.id)) add(scope, `重复 id: ${pet.id}`);
    ids.add(pet.id);
    if (names.has(pet.name)) add(scope, `重名: ${pet.name}`);
    names.add(pet.name);
    if (!RARITIES.has(pet.rarity)) add(scope, `${pet.name} 稀有度非法: ${pet.rarity}`);
    for (const key of ['attack', 'defense', 'hp', 'speed'] as const) {
      if (!(pet.baseStats[key] > 0)) add(scope, `${pet.name} baseStats.${key} 非法: ${pet.baseStats[key]}`);
    }
    if (!pet.skills || pet.skills.length === 0) add(scope, `${pet.name} 无初始技能`);
    // 技能 id 只要求单宠内唯一：通用技能池（如撕咬）会在多个宠物模板中内联复用
    const skillIds = new Set<string>();
    const allSkills = [...(pet.skills ?? []), ...(pet.stageSkills?.stage1 ?? []), ...(pet.stageSkills?.stage2 ?? [])];
    for (const skill of allSkills) {
      if (skillIds.has(skill.id)) add(scope, `${pet.name} 重复技能 id: ${skill.id}`);
      skillIds.add(skill.id);
      if (!isCleanText(skill.name)) add(scope, `${pet.name} 存在无名技能 (${skill.id})`);
      if (!skill.effect || Object.keys(skill.effect).length === 0) {
        add(scope, `${pet.name} 技能 ${skill.name} 无效果定义`);
      }
    }
    const evo = pet.evolutionRequirements;
    const stages = [evo?.stage1, evo?.stage2];
    for (const stage of stages) {
      for (const mat of stage?.items ?? []) {
        if (!KNOWN_ITEM_NAMES.has(mat.name)) {
          add(scope, `${pet.name} 进化材料未知: ${mat.name}×${mat.quantity}`);
        }
        if (!(mat.quantity > 0)) add(scope, `${pet.name} 进化材料 ${mat.name} 数量非法`);
      }
    }
  }
}

/** 功法：唯一性、境界/品级合法、战斗技能映射一致 */
function checkArts() {
  const scope = '功法';
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const art of CULTIVATION_ARTS) {
    if (ids.has(art.id)) add(scope, `重复 id: ${art.id}`);
    ids.add(art.id);
    if (names.has(art.name)) add(scope, `重名: ${art.name}`);
    names.add(art.name);
    if (!ART_GRADES.has(art.grade)) add(scope, `${art.name} 品级非法: ${art.grade}`);
    if (!REALM_SET.has(art.realmRequirement)) add(scope, `${art.name} 境界要求非法: ${art.realmRequirement}`);
    if (!(art.cost >= 0)) add(scope, `${art.name} 学习花费非法: ${art.cost}`);
    if (!art.effects || Object.keys(art.effects).length === 0) add(scope, `${art.name} 无效果定义`);
    if (art.bossId && !HEAVEN_EARTH_SOUL_BOSSES[art.bossId]) {
      add(scope, `${art.name} 引用不存在的天地之魄 BOSS: ${art.bossId}`);
    }
  }
  for (const [artId, skills] of Object.entries(CULTIVATION_ART_BATTLE_SKILLS)) {
    if (!ids.has(artId)) add(scope, `战斗技能映射引用不存在的功法: ${artId}`);
    if (!skills || skills.length === 0) {
      add(scope, `${artId} 战斗技能映射为空`);
      continue;
    }
    for (const skill of skills) {
      if (!isCleanText(skill.name)) add(scope, `${artId} 存在无名战斗技能`);
      if (skill.sourceId && skill.sourceId !== artId) {
        add(scope, `技能 ${skill.name} sourceId (${skill.sourceId}) 与映射 key (${artId}) 不一致`);
      }
      if (skill.type === 'attack' && skill.damage && !(skill.damage.base > 0)) {
        add(scope, `攻击技能 ${skill.name} 基础伤害非法: ${skill.damage.base}`);
      }
    }
  }
}

/** 功法羁绊：引用的功法真实存在 */
function checkArtSynergies() {
  const scope = '功法羁绊';
  const artIds = new Set(CULTIVATION_ARTS.map((a) => a.id));
  const ids = new Set<string>();
  for (const set of ART_SYNERGY_SETS) {
    if (ids.has(set.id)) add(scope, `重复 id: ${set.id}`);
    ids.add(set.id);
    if (!set.requiredArts || set.requiredArts.length === 0) {
      add(scope, `${set.name} 未引用任何功法`);
      continue;
    }
    for (const artId of set.requiredArts) {
      if (!artIds.has(artId)) add(scope, `${set.name} 引用不存在的功法: ${artId}`);
    }
    if (!set.effects || Object.keys(set.effects).length === 0) add(scope, `${set.name} 无效果定义`);
  }
}

/** 秘境：境界合法、花费非负、掉落描述完整 */
function checkSecretRealms() {
  const scope = '秘境';
  const ids = new Set<string>();
  for (const realm of SECRET_REALMS) {
    if (ids.has(realm.id)) add(scope, `重复 id: ${realm.id}`);
    ids.add(realm.id);
    if (!REALM_SET.has(realm.minRealm)) add(scope, `${realm.name} 最低境界非法: ${realm.minRealm}`);
    if (!(realm.cost >= 0)) add(scope, `${realm.name} 进入花费非法: ${realm.cost}`);
    if (!RISK_LEVELS.has(realm.riskLevel)) add(scope, `${realm.name} 风险等级非法: ${realm.riskLevel}`);
    if (!realm.drops || realm.drops.length === 0) add(scope, `${realm.name} 无掉落描述`);
  }
}

/** 成就与称号：引用完整、目标数值合法 */
function checkAchievementsAndTitles() {
  const scope = '成就称号';
  const titleIds = new Set<string>();
  for (const title of TITLES) {
    if (titleIds.has(title.id)) add(scope, `称号重复 id: ${title.id}`);
    titleIds.add(title.id);
    // 称号允许空效果（如初始称号"初入仙途"是身份标记）
  }
  const achIds = new Set<string>();
  for (const ach of ACHIEVEMENTS) {
    if (achIds.has(ach.id)) add(scope, `成就重复 id: ${ach.id}`);
    achIds.add(ach.id);
    if (!isCleanText(ach.description)) add(scope, `成就 ${ach.name} 描述缺失或含占位符`);
    if (!Number.isFinite(ach.requirement?.value) || ach.requirement.value < 0) {
      add(scope, `成就 ${ach.name} 目标数值非法: ${ach.requirement?.value}`);
    }
    if (!RARITIES.has(ach.rarity)) add(scope, `成就 ${ach.name} 稀有度非法: ${ach.rarity}`);
    if (ach.reward?.titleId && !titleIds.has(ach.reward.titleId)) {
      add(scope, `成就 ${ach.name} 引用不存在的称号: ${ach.reward.titleId}`);
    }
  }
  for (const set of TITLE_SET_EFFECTS) {
    for (const titleId of set.titles) {
      if (!titleIds.has(titleId)) add(scope, `套装 ${set.setName} 引用不存在的称号: ${titleId}`);
    }
  }
}

/** 通天塔：1-100 层可生成、属性单调、首通奖励为正 */
function checkTower() {
  const scope = '通天塔';
  let prevHp = 0;
  let prevAttack = 0;
  for (let floor = 1; floor <= 100; floor++) {
    const cfg = getTowerFloorConfig(floor);
    if (!isCleanText(cfg.name) || !isCleanText(cfg.guardianName)) {
      add(scope, `第 ${floor} 层名称缺失`);
    }
    for (const key of ['baseAttack', 'baseDefense', 'baseHp', 'baseSpeed', 'baseSpirit'] as const) {
      if (!(cfg[key] > 0)) add(scope, `第 ${floor} 层 ${key} 非法: ${cfg[key]}`);
    }
    // 属性整体趋势递增即可：每 10 层是 BOSS 层，下一层恢复常规强度会回落，跨段不比较
    if (floor % 10 !== 1) {
      if (cfg.baseHp < prevHp) add(scope, `第 ${floor} 层气血低于上一层 (${cfg.baseHp} < ${prevHp})`);
      if (cfg.baseAttack < prevAttack) add(scope, `第 ${floor} 层攻击低于上一层 (${cfg.baseAttack} < ${prevAttack})`);
    }
    prevHp = cfg.baseHp;
    prevAttack = cfg.baseAttack;
    const rewards = cfg.firstClearRewards;
    if (!(rewards.exp > 0) || !(rewards.spiritStones > 0)) {
      add(scope, `第 ${floor} 层首通奖励非法`);
    }
    if (rewards.reforgeStones < 0) add(scope, `第 ${floor} 层洗炼石奖励为负`);
  }
  const sweep = calculateTowerDailySweep(50);
  if (!(sweep.exp > 0) || !(sweep.spiritStones > 0)) add(scope, `每日扫荡收益非法: ${JSON.stringify(sweep)}`);
}

/** 天地之魄 BOSS：属性为正、强度倍数在档位内、奖励为正 */
function checkBosses() {
  const scope = '天地之魄';
  for (const [id, boss] of Object.entries(HEAVEN_EARTH_SOUL_BOSSES)) {
    if (!REALM_SET.has(boss.realm)) add(scope, `${boss.name} (${id}) 境界非法: ${boss.realm}`);
    for (const [key, val] of Object.entries(boss.baseStats)) {
      if (!(val > 0)) add(scope, `${boss.name} baseStats.${key} 非法: ${val}`);
    }
    // 类型注释写 0.9-3.0，但 extreme 档 BOSS 实际用到 3.5（星辰之魄），按实际设计区间校验
    if (!(boss.strengthMultiplier >= 0.9 && boss.strengthMultiplier <= 3.5)) {
      add(scope, `${boss.name} 强度倍数超出设计区间: ${boss.strengthMultiplier}`);
    }
    if (!boss.specialSkills || boss.specialSkills.length === 0) add(scope, `${boss.name} 无特殊技能`);
    if (!(boss.rewards.exp > 0) || !(boss.rewards.spiritStones > 0)) {
      add(scope, `${boss.name} 奖励非法`);
    }
  }
}

/** 宗门：品级合法、商店商品合法 */
function checkSects() {
  const scope = '宗门';
  const ids = new Set<string>();
  for (const sect of SECTS) {
    if (ids.has(sect.id)) add(scope, `重复 id: ${sect.id}`);
    ids.add(sect.id);
    if (!ART_GRADES.has(sect.grade)) add(scope, `${sect.name} 等级非法: ${sect.grade}`);
    if (!isCleanText(sect.name)) add(scope, `宗门名称缺失 (${sect.id})`);
  }
  for (const item of SECT_SHOP_ITEMS) {
    if (!(item.cost > 0)) add(scope, `商店商品 ${item.name} 售价非法: ${item.cost}`);
    if (!RARITIES.has(item.item.rarity)) add(scope, `商店商品 ${item.name} 稀有度非法`);
  }
}

/** 日常任务模板：类型/稀有度合法、目标区间合理、名称唯一 */
function checkDailyQuests() {
  const scope = '日常任务';
  const names = new Set<string>();
  for (const quest of PREDEFINED_DAILY_QUESTS) {
    if (!QUEST_TYPES.has(quest.type)) add(scope, `${quest.name} 任务类型非法: ${quest.type}`);
    if (names.has(quest.name)) add(scope, `任务重名: ${quest.name}`);
    names.add(quest.name);
    const { min, max } = quest.targetRange;
    if (!(min > 0) || !(max >= min)) add(scope, `${quest.name} 目标区间非法: ${min}-${max}`);
    if (!RARITIES.has(quest.rarity)) add(scope, `${quest.name} 稀有度非法: ${quest.rarity}`);
  }
}

/** 历练事件模板库（程序化生成 1200 条）：文案干净、数值合法、跨系统引用存在 */
function checkEventTemplates() {
  const scope = '历练模板';
  initializeEventTemplateLibrary();
  const templates = getEventTemplateLibrary();
  if (templates.length !== 1200) {
    add(scope, `模板总数应为 1200，实际 ${templates.length}`);
  }
  const bossIds = new Set(Object.keys(HEAVEN_EARTH_SOUL_BOSSES));
  const ruleIds = new Set(Object.keys(LONGEVITY_RULES));
  templates.forEach((tpl, index) => {
    const label = `#${index}`;
    if (!isCleanText(tpl.story)) add(scope, `${label} 文案缺失或含占位符: ${String(tpl.story).slice(0, 30)}`);
    for (const key of ['hpChange', 'expChange', 'spiritStonesChange'] as const) {
      if (!Number.isFinite(tpl[key])) add(scope, `${label} ${key} 非数值: ${tpl[key]}`);
    }
    if (!ADVENTURE_TYPES.has(tpl.adventureType)) add(scope, `${label} 冒险类型非法: ${tpl.adventureType}`);
    if (!EVENT_COLORS.has(tpl.eventColor)) add(scope, `${label} 事件颜色非法: ${tpl.eventColor}`);
    if (tpl.riskLevel && !RISK_LEVELS.has(tpl.riskLevel)) add(scope, `${label} 风险等级非法: ${tpl.riskLevel}`);
    if (tpl.petObtained !== undefined && !isCleanText(tpl.petObtained)) {
      add(scope, `${label} 灵宠奖励为空引用`);
    }
    if (tpl.heavenEarthSoulEncounter && !bossIds.has(tpl.heavenEarthSoulEncounter)) {
      add(scope, `${label} 引用不存在的 BOSS: ${tpl.heavenEarthSoulEncounter}`);
    }
    if (tpl.longevityRuleObtained && !ruleIds.has(tpl.longevityRuleObtained)) {
      add(scope, `${label} 引用不存在的长生规则: ${tpl.longevityRuleObtained}`);
    }
    if (tpl.lotteryTicketsChange !== undefined && tpl.lotteryTicketsChange < 0) {
      add(scope, `${label} 抽奖券变化为负: ${tpl.lotteryTicketsChange}`);
    }
  });
}

// ==================== 主流程 ====================

function main() {
  checkLottery();
  checkPillRecipes();
  checkPets();
  checkArts();
  checkArtSynergies();
  checkSecretRealms();
  checkAchievementsAndTitles();
  checkTower();
  checkBosses();
  checkSects();
  checkDailyQuests();
  checkEventTemplates();

  // 输出各数据源规模，便于确认测试覆盖面
  console.log(
    `覆盖统计: 奖池 ${LOTTERY_PRIZES.length} | 丹方 ${ALL_PILL_RECIPES.length} | 灵宠 ${PET_TEMPLATES.length} | ` +
    `功法 ${CULTIVATION_ARTS.length} | 羁绊 ${ART_SYNERGY_SETS.length} | 秘境 ${SECRET_REALMS.length} | ` +
    `成就 ${ACHIEVEMENTS.length} | 称号 ${TITLES.length} | BOSS ${Object.keys(HEAVEN_EARTH_SOUL_BOSSES).length} | ` +
    `宗门 ${SECTS.length} | 日常模板 ${PREDEFINED_DAILY_QUESTS.length} | 事件模板 ${getEventTemplateLibrary().length}`
  );

  if (violations.length > 0) {
    console.error(`\n发现 ${violations.length} 处内容数据违规：`);
    for (const v of violations) console.error(`  ${v}`);
    assert.fail(`内容数据完整性校验失败，共 ${violations.length} 处违规`);
  }
  console.log('contentIntegrity ok');
}

main();
