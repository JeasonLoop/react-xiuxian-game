import {
  AdventureType,
  DifficultyMode,
  PlayerStats,
  RealmType,
} from '../../types';
import {
  HEAVEN_EARTH_SOUL_BOSSES,
  REALM_DATA,
  REALM_ORDER,
} from '../../constants/index';
import { getAdventureBalance, getDifficultyBalance } from '../../constants/balance';
import { logger } from '../../utils/logger';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { getRandomEnemyName } from '../templateService';
import { baseBattleChance, ENEMY_NAMES, ENEMY_TITLES } from './constants';
import { getBattleDifficulty, pickOne } from './shared';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const createEnemy = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string, // 指定的天地之魄BOSS ID（用于事件模板）
  difficultyMode: DifficultyMode = 'normal'
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
  const baseDifficulty = getBattleDifficulty(adventureType, riskLevel, difficultyMode);
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
  const playerTotalStats = getPlayerTotalStats(player);
  let basePlayerStats = {
    attack: playerTotalStats.attack,
    defense: playerTotalStats.defense,
    maxHp: playerTotalStats.maxHp,
    speed: playerTotalStats.speed || 10,
    spirit: playerTotalStats.spirit || 0,
    level: player.realmLevel,
  };

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    if (currentRealmIndex > realmMinIndex) {
      const ratio = 0.4 + (realmMinIndex / (REALM_ORDER.length || 1)) * 0.3;
      basePlayerStats = {
        attack: playerTotalStats.attack * ratio,
        defense: playerTotalStats.defense * ratio,
        maxHp: playerTotalStats.maxHp * (ratio - 0.1),
        speed: (playerTotalStats.speed || 10) * (ratio + 0.1),
        spirit: (playerTotalStats.spirit || 0) * ratio,
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
    baseSpeed = Math.max(6, Math.round(basePlayerStats.speed * (0.6 + Math.random() * 0.8))); // 60%-140% 玩家速度
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

// 战斗触发
export const shouldTriggerBattle = (
  player: PlayerStats,
  adventureType: AdventureType,
  difficultyMode: DifficultyMode = 'normal'
): boolean => {
  // 挑战类型（宗主挑战、天地之魄挑战）总是触发战斗
  if (adventureType === 'sect_challenge' || adventureType === 'dao_combining_challenge') {
    return true;
  }

  const base = baseBattleChance[adventureType] ?? 0.2; // 基础战斗概率
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.02; // 境界加成（从0.015提高到0.02）
  const speedBonus = (player.speed || 0) * 0.0005; // 速度加成（从0.0004提高到0.0005）
  const luckMitigation = (player.luck || 0) * 0.00015; // 幸运减成（从0.0002降低到0.00015，减少影响）
  const balanceMultiplier =
    getDifficultyBalance(difficultyMode).battleChance *
    getAdventureBalance(adventureType).battleChance;
  const chance = Math.min(0.7, (base + realmBonus + speedBonus - luckMitigation) * balanceMultiplier); // 保持上限适中
  return Math.random() < Math.max(0.1, chance); // 确保不会过低也不过高
  // return true; // 调试战斗打开
};
