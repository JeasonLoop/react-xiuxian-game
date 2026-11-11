/**
 * 数值平衡模拟脚本（标准玩家进度模型）
 *
 * 用途：用真实游戏公式模拟"全自动挂机玩家"从炼气到长生的进度节奏，
 * 输出各大境界逐层耗时表，供数值调整前评估"需求/收入比"是否突变。
 *
 * 模型假设（全部注明，参数可用命令行覆盖）：
 * 1. 24 小时全天挂机：自动打坐（1500ms/tick）+ 自动历练（cooldown=1，约 1 次/秒）
 * 2. 修炼效率综合加成（功法/灵根/洞府/称号等）默认 +30%，可用 --bonus=0.5 覆盖
 * 3. 顿悟收益忽略（自动顿悟每日上限 3 次，期望占比 <0.1%）
 * 4. 历练收益取 1200 个事件模板的 expChange 均值（真实生成数据）；
 *    战斗额外奖励未计入，结果偏保守
 * 5. 修为条满即突破（含大境界，忽略天劫风险与感悟门槛），为"最快路径"
 *
 * 运行：npx tsx scripts/balance-sim.ts
 */
import { REALM_ORDER, REALM_DATA, getRealmMaxExp } from '../constants/realms';
import {
  initializeEventTemplateLibrary,
  getEventTemplateLibrary,
} from '../services/adventureTemplateService';

// ==================== 参数 ====================

/** 每日挂机小时数（--hours=4 可覆盖；实际在线时长决定有效收益） */
let HOURS_PER_DAY = 24;
/** 自动打坐 tick 间隔（与 GAME_BALANCE.meditation.autoIntervalMs 一致） */
const MEDITATE_INTERVAL_MS = 1500;
/** 自动历练冷却秒数（与 GAME_BALANCE.autoAdventure.cooldown 一致，每秒 -1） */
const ADVENTURE_COOLDOWN_S = 1;
/** 修炼效率综合加成（--bonus=0.5 可覆盖） */
let EXP_BONUS = 0.3;
for (const arg of process.argv.slice(2)) {
  const bonus = arg.match(/^--bonus=([\d.]+)$/);
  if (bonus) EXP_BONUS = Number(bonus[1]);
  const hours = arg.match(/^--hours=([\d.]+)$/);
  if (hours) HOURS_PER_DAY = Number(hours[1]);
}

// 打坐基础修为的境界倍数（与 useMeditationHandlers 中 realmBaseMultipliers 一致）
const REALM_BASE_MULTIPLIERS = [1, 2, 4, 8, 15, 30, 60];

// ==================== 收益模型 ====================

/** 每日打坐 tick 数 */
const MEDITATE_TICKS_PER_DAY = (HOURS_PER_DAY * 3600 * 1000) / MEDITATE_INTERVAL_MS;
/** 每日历练次数 */
const ADVENTURES_PER_DAY = (HOURS_PER_DAY * 3600) / ADVENTURE_COOLDOWN_S;

/**
 * 打坐单次修为（与 useMeditationHandlers 公式一致）：
 * baseGain = 境界倍数 × 10 × (1 + 层数 × 0.15)，随机波动均值 ≈ 1.0
 */
function meditationGainPerTick(realmIndex: number, realmLevel: number): number {
  const multiplier = REALM_BASE_MULTIPLIERS[realmIndex] || 1;
  return Math.floor(multiplier * 10 * (1 + realmLevel * 0.15)) * (1 + EXP_BONUS);
}

/** 初始化历练模板库并统计各冒险类型的平均收益 */
function getAdventureAverages(): { avgExp: number; avgStones: number; sampleCount: number } {
  initializeEventTemplateLibrary();
  const templates = getEventTemplateLibrary();
  let totalExp = 0;
  let totalStones = 0;
  for (const tpl of templates) {
    totalExp += tpl.expChange;
    totalStones += tpl.spiritStonesChange;
  }
  return {
    avgExp: totalExp / templates.length,
    avgStones: totalStones / templates.length,
    sampleCount: templates.length,
  };
}

/**
 * 历练收益的境界缩放（与 templateToAdventureResult 公式一致）：
 * realmMultiplier = 3^境界序号 × (1 + (层数-1) × 0.3)
 * 注意：历练收入 3×/境界 < 修为需求 6.3×/境界，这个差距由打坐倍数部分弥补
 */
function adventureRealmMultiplier(realmIndex: number, realmLevel: number): number {
  return Math.pow(3, realmIndex) * (1 + (realmLevel - 1) * 0.3);
}

// ==================== 模拟主流程 ====================

function main() {
  const adventure = getAdventureAverages();

  console.log('==== 数值平衡模拟（标准全自动挂机玩家） ====');
  console.log(
    `参数: 每日挂机 ${HOURS_PER_DAY}h | 修炼加成 +${(EXP_BONUS * 100).toFixed(0)}% | ` +
    `历练均值取自 ${adventure.sampleCount} 个模板: exp ${adventure.avgExp.toFixed(1)}/次, 灵石 ${adventure.avgStones.toFixed(1)}/次`
  );
  console.log(
    `每日修为产出: 打坐 ${MEDITATE_TICKS_PER_DAY.toFixed(0)} ticks + 历练 ${ADVENTURES_PER_DAY.toFixed(0)} 次（战斗奖励未计入，偏保守）`
  );
  console.log('');

  // 表头
  console.log(
    '| 境界 | 层 | 修为需求 | 打坐/天 | 历练/天 | 合计/天 | 灵石/天 | 该层耗时(天) | 累计(天) |'
  );
  console.log('|---|---|---|---|---|---|---|---|---|');

  let cumulativeDays = 0;
  const realmTotals: { realm: string; days: number; cumulative: number }[] = [];
  const realmStoneIncome = new Map<string, number>();

  REALM_ORDER.forEach((realm, realmIndex) => {
    const realmName = REALM_DATA[realm] ? String(realm) : String(realm);
    let realmDays = 0;
    for (let level = 1; level <= 9; level++) {
      const maxExp = getRealmMaxExp(realm, level);
      const medPerDay = MEDITATE_TICKS_PER_DAY * meditationGainPerTick(realmIndex, level);
      const advPerDay =
        ADVENTURES_PER_DAY * adventure.avgExp * adventureRealmMultiplier(realmIndex, level);
      const stonesPerDay =
        ADVENTURES_PER_DAY * adventure.avgStones * adventureRealmMultiplier(realmIndex, level);
      const totalPerDay = medPerDay + advPerDay;
      // 修为条满即突破；需求/产出比直接换算耗时
      const days = maxExp / totalPerDay;
      cumulativeDays += days;
      realmDays += days;
      console.log(
        `| ${realmName} | ${level} | ${maxExp.toLocaleString()} | ${fmt(medPerDay)} | ${fmt(advPerDay)} | ${fmt(totalPerDay)} | ${fmt(stonesPerDay)} | ${days.toFixed(2)} | ${cumulativeDays.toFixed(1)} |`
      );
      // 取每境界第 5 层的灵石收入作为该境界代表性收入（用于传承石购买力对照）
      if (level === 5) realmStoneIncome.set(realmName, stonesPerDay);
    }
    realmTotals.push({ realm: realmName, days: realmDays, cumulative: cumulativeDays });
  });

  // 境界汇总 + 突变点分析
  console.log('');
  console.log('==== 境界汇总 ====');
  console.log('| 境界 | 本境界耗时(天) | 累计(天) | 与上一境界耗时比 |');
  console.log('|---|---|---|---|');
  let prevDays: number | null = null;
  for (const item of realmTotals) {
    const ratio = prevDays ? (item.days / prevDays).toFixed(2) + '×' : '-';
    console.log(`| ${item.realm} | ${item.days.toFixed(1)} | ${item.cumulative.toFixed(1)} | ${ratio} |`);
    prevDays = item.days;
  }

  console.log('');
  console.log('==== 参考数据：传承石购买力（售价 50000 × 8^境界序号） ====');
  console.log('| 境界 | 售价(灵石) | 日均灵石收入 | 存够售价需要(天) |');
  console.log('|---|---|---|---|');
  REALM_ORDER.forEach((realm, i) => {
    const name = String(realm);
    const price = 50000 * Math.pow(8, i);
    const income = realmStoneIncome.get(name) ?? 0;
    console.log(`| ${name} | ${price.toExponential(2)} | ${fmt(income)} | ${(price / income).toFixed(1)} |`);
  });
  console.log('');
  console.log('提示: 逐层耗时突然翻倍以上的层 = 数值突变点，结合上表定位调整目标。');
}

/** 数值格式化：大数用科学计数，小数保留 1 位 */
function fmt(n: number): string {
  if (n >= 1e6) return n.toExponential(2);
  return n.toFixed(0);
}

main();
