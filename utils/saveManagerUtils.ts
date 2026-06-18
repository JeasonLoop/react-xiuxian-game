/**
 * 存档管理工具函数
 * 单存档模式：仅使用 STORAGE_KEYS.SAVE 存储当前存档
 */

import { PlayerStats, LogEntry } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';

const sanitizeNumber = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 确保玩家数据兼容性，填充缺失的字段
 */
export const ensurePlayerStatsCompatibility = (loadedPlayer: any): PlayerStats => {
  const safeAttack = sanitizeNumber(loadedPlayer.attack, 10);
  const safeDefense = sanitizeNumber(loadedPlayer.defense, 5);
  const safeSpirit = sanitizeNumber(loadedPlayer.spirit, 5);
  const safePhysique = sanitizeNumber(loadedPlayer.physique, 10);
  const safeSpeed = sanitizeNumber(loadedPlayer.speed, 10);
  const safeMaxHp = Math.max(1, sanitizeNumber(loadedPlayer.maxHp, 100));
  const safeHp = Math.min(Math.max(0, sanitizeNumber(loadedPlayer.hp, safeMaxHp)), safeMaxHp);
  const safeMaxExp = Math.max(1, sanitizeNumber(loadedPlayer.maxExp, 100));
  const safeExp = Math.min(Math.max(0, sanitizeNumber(loadedPlayer.exp, 0)), safeMaxExp);
  const safeRealmLevel = Math.min(9, Math.max(1, Math.floor(sanitizeNumber(loadedPlayer.realmLevel, 1))));

  return {
    ...loadedPlayer,
    realmLevel: safeRealmLevel,
    exp: safeExp,
    maxExp: safeMaxExp,
    hp: safeHp,
    maxHp: safeMaxHp,
    attack: safeAttack,
    defense: safeDefense,
    spirit: safeSpirit,
    physique: safePhysique,
    speed: safeSpeed,
    dailyTaskCount:
      loadedPlayer.dailyTaskCount &&
      typeof loadedPlayer.dailyTaskCount === 'object' &&
      !('instant' in loadedPlayer.dailyTaskCount)
        ? loadedPlayer.dailyTaskCount
        : {},
    lastTaskResetDate:
      loadedPlayer.lastTaskResetDate ||
      new Date().toISOString().split('T')[0],
    viewedAchievements: loadedPlayer.viewedAchievements || [],
    natalArtifactId: loadedPlayer.natalArtifactId || null,
    unlockedRecipes: loadedPlayer.unlockedRecipes || [],
    alchemyLevel: loadedPlayer.alchemyLevel || 1,
    alchemyProficiency: loadedPlayer.alchemyProficiency || loadedPlayer.alchemyExp || 0,
    unlockedArts: loadedPlayer.unlockedArts || loadedPlayer.cultivationArts || [],
    sectTreasureVault: loadedPlayer.sectTreasureVault || undefined,
    meditationHpRegenMultiplier:
      loadedPlayer.meditationHpRegenMultiplier ?? 1.0,
    meditationBoostEndTime:
      loadedPlayer.meditationBoostEndTime ?? null,
    playTime: loadedPlayer.playTime ?? 0,
    statistics: loadedPlayer.statistics || {
      killCount: 0,
      meditateCount: 0,
      adventureCount: 0,
      equipCount: 0,
      petCount: 0,
      recipeCount: loadedPlayer.unlockedRecipes?.length || 0,
      artCount: loadedPlayer.cultivationArts?.length || 0,
      breakthroughCount: 0,
      secretRealmCount: 0,
    },
    lifespan: loadedPlayer.lifespan ?? loadedPlayer.maxLifespan ?? 100,
    maxLifespan: loadedPlayer.maxLifespan ?? 100,
    spiritualRoots: loadedPlayer.spiritualRoots || {
      metal: Math.floor(Math.random() * 16),
      wood: Math.floor(Math.random() * 16),
      water: Math.floor(Math.random() * 16),
      fire: Math.floor(Math.random() * 16),
      earth: Math.floor(Math.random() * 16),
    },
    unlockedTitles: loadedPlayer.unlockedTitles || (loadedPlayer.titleId ? [loadedPlayer.titleId] : ['title-novice']),
    reputation: loadedPlayer.reputation || 0,
    breakthroughFailCount: loadedPlayer.breakthroughFailCount ?? 0,
    // 宗门追杀系统
    betrayedSects: loadedPlayer.betrayedSects || [],
    sectHuntEndTime: loadedPlayer.sectHuntEndTime || null,
    sectHuntLevel: loadedPlayer.sectHuntLevel || 0,
    sectHuntSectId: loadedPlayer.sectHuntSectId || null,
    sectHuntSectName: loadedPlayer.sectHuntSectName || null,
    grotto: loadedPlayer.grotto ? {
      ...loadedPlayer.grotto,
      autoHarvest: loadedPlayer.grotto.autoHarvest ?? false,
      growthSpeedBonus: loadedPlayer.grotto.growthSpeedBonus ?? 0,
      spiritArrayEnhancement: loadedPlayer.grotto.spiritArrayEnhancement || 0,
      herbarium: loadedPlayer.grotto.herbarium || [],
      dailySpeedupCount: loadedPlayer.grotto.dailySpeedupCount || 0,
      lastSpeedupResetDate: loadedPlayer.grotto.lastSpeedupResetDate || new Date().toISOString().split('T')[0],
      plantedHerbs: (loadedPlayer.grotto.plantedHerbs || []).map((herb: any) => ({
        ...herb,
        isMutated: herb.isMutated || false,
        mutationBonus: herb.mutationBonus || undefined,
      })),
    } : {
      level: 0,
      expRateBonus: 0,
      autoHarvest: false,
      growthSpeedBonus: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
      herbarium: [],
      dailySpeedupCount: 0,
      lastSpeedupResetDate: new Date().toISOString().split('T')[0],
    },
  };
};

export interface SaveData {
  player: PlayerStats;
  logs: LogEntry[];
  timestamp: number;
  lastActiveTime?: number; // 上次活跃时间（用于离线收益计算）
}

/**
 * 保存单存档
 */
export const saveGameData = (
  player: PlayerStats,
  logs: LogEntry[]
): boolean => {
  try {
    const saveData: SaveData = {
      player,
      logs,
      timestamp: Date.now(),
      lastActiveTime: Date.now(), // 记录最后活跃时间
    };
    localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(saveData));
    localStorage.setItem(STORAGE_KEYS.SAVE_BACKUP, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('保存存档失败:', error);
    return false;
  }
};

/**
 * 读取单存档
 */
export const loadGameData = (): SaveData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('加载存档失败:', error);
    return null;
  }
};

/**
 * 清理单存档
 */
export const clearSaveData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SAVE);
    localStorage.removeItem(STORAGE_KEYS.SAVE_BACKUP);
  } catch (error) {
    console.error('清理存档失败:', error);
  }
};

/**
 * 读取备份存档（如果存在）
 */
export const loadBackupSaveData = (): SaveData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVE_BACKUP);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error('加载备份存档失败:', error);
    return null;
  }
};

/**
 * 从备份恢复存档
 */
export const restoreFromBackup = (): boolean => {
  try {
    const backup = loadBackupSaveData();
    if (!backup) {
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('恢复备份失败:', error);
    return false;
  }
};

/**
 * 对比两个存档的差异
 */
export interface SaveComparison {
  playerName: { old: string; new: string };
  realm: { old: string; new: string };
  realmLevel: { old: number; new: number };
  exp: { old: number; new: number };
  maxExp: { old: number; new: number };
  hp: { old: number; new: number };
  maxHp: { old: number; new: number };
  attack: { old: number; new: number };
  defense: { old: number; new: number };
  spirit: { old: number; new: number };
  physique: { old: number; new: number };
  speed: { old: number; new: number };
  spiritStones: { old: number; new: number };
  inventoryCount: { old: number; new: number };
  equipmentCount: { old: number; new: number };
  timestamp: { old: number; new: number };
}

export const compareSaves = (
  save1: SaveData,
  save2: SaveData
): SaveComparison => {
  const p1 = save1.player;
  const p2 = save2.player;

  return {
    playerName: { old: p1.name, new: p2.name },
    realm: { old: p1.realm, new: p2.realm },
    realmLevel: { old: p1.realmLevel, new: p2.realmLevel },
    exp: { old: p1.exp, new: p2.exp },
    maxExp: { old: p1.maxExp, new: p2.maxExp },
    hp: { old: p1.hp, new: p2.hp },
    maxHp: { old: p1.maxHp, new: p2.maxHp },
    attack: { old: p1.attack, new: p2.attack },
    defense: { old: p1.defense, new: p2.defense },
    spirit: { old: p1.spirit, new: p2.spirit },
    physique: { old: p1.physique, new: p2.physique },
    speed: { old: p1.speed, new: p2.speed },
    spiritStones: { old: p1.spiritStones, new: p2.spiritStones },
    inventoryCount: {
      old: p1.inventory?.length || 0,
      new: p2.inventory?.length || 0,
    },
    equipmentCount: {
      old: Object.values(p1.equippedItems || {}).filter((e) => e !== null).length,
      new: Object.values(p2.equippedItems || {}).filter((e) => e !== null).length,
    },
    timestamp: { old: save1.timestamp, new: save2.timestamp },
  };
};

/**
 * 导出存档为加密/编码后的字符串
 */
export const exportSave = (saveData: SaveData): string => {
  const json = JSON.stringify(saveData);
  // 简单的 Base64 编码，增加一点点修改难度
  try {
    return btoa(encodeURIComponent(json));
  } catch (e) {
    return json; // 回退到普通 JSON
  }
};

/**
 * 导入存档（处理加密/编码）
 */
export const importSave = (encodedString: string): SaveData | null => {
  try {
    let jsonString = encodedString;
    // 尝试解码 Base64
    try {
      if (!encodedString.startsWith('{')) {
        jsonString = decodeURIComponent(atob(encodedString));
      }
    } catch (e) {
      // 如果不是 Base64，则按原样处理
    }

    const saveData: SaveData = JSON.parse(jsonString);

    // 验证数据结构
    if (!saveData.player || !Array.isArray(saveData.logs)) {
      return null;
    }

    // 确保有timestamp
    if (!saveData.timestamp) {
      saveData.timestamp = Date.now();
    }

    return saveData;
  } catch (error) {
    console.error('导入存档失败:', error);
    return null;
  }
};

