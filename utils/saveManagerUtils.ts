/**
 * 存档管理工具函数
 * 支持多存档槽位、备份和对比功能
 */

import { PlayerStats, LogEntry } from '../types';

export interface SaveSlot {
  id: number; // 存档槽位ID (1-10)
  name: string; // 存档名称（用户自定义）
  playerName: string; // 玩家名称
  realm: string; // 境界
  realmLevel: number; // 境界等级
  timestamp: number; // 保存时间戳
  data: SaveData | null; // 存档数据（null表示空槽位）
}

export interface SaveData {
  player: PlayerStats;
  logs: LogEntry[];
  timestamp: number;
}

// localStorage 键名
const SAVE_SLOT_PREFIX = 'xiuxian-game-save-slot-';
const SAVE_BACKUP_PREFIX = 'xiuxian-game-save-backup-';
const CURRENT_SLOT_KEY = 'xiuxian-game-current-slot';
const MAX_SLOTS = 10; // 最大存档槽位数
const MAX_BACKUPS = 5; // 每个存档槽位最大备份数

/**
 * 获取当前使用的存档槽位ID
 */
export const getCurrentSlotId = (): number => {
  try {
    const slotId = localStorage.getItem(CURRENT_SLOT_KEY);
    return slotId ? parseInt(slotId, 10) : 1; // 默认使用槽位1
  } catch {
    return 1;
  }
};

/**
 * 设置当前使用的存档槽位ID
 */
export const setCurrentSlotId = (slotId: number): void => {
  try {
    localStorage.setItem(CURRENT_SLOT_KEY, slotId.toString());
  } catch (error) {
    console.error('设置当前存档槽位失败:', error);
  }
};

/**
 * 获取存档槽位的localStorage键名
 */
const getSlotKey = (slotId: number): string => {
  return `${SAVE_SLOT_PREFIX}${slotId}`;
};

/**
 * 获取备份的localStorage键名
 */
const getBackupKey = (slotId: number, backupIndex: number): string => {
  return `${SAVE_BACKUP_PREFIX}${slotId}-${backupIndex}`;
};

/**
 * 保存存档到指定槽位
 */
export const saveToSlot = (
  slotId: number,
  player: PlayerStats,
  logs: LogEntry[],
  slotName?: string
): boolean => {
  try {
    if (slotId < 1 || slotId > MAX_SLOTS) {
      console.error(`存档槽位ID必须在1-${MAX_SLOTS}之间`);
      return false;
    }

    const saveData: SaveData = {
      player,
      logs,
      timestamp: Date.now(),
    };

    const slotKey = getSlotKey(slotId);
    localStorage.setItem(slotKey, JSON.stringify(saveData));

    // 更新当前槽位
    setCurrentSlotId(slotId);

    // 自动创建备份
    createBackup(slotId, saveData);

    return true;
  } catch (error) {
    console.error('保存存档失败:', error);
    return false;
  }
};

/**
 * 从指定槽位加载存档
 */
export const loadFromSlot = (slotId: number): SaveData | null => {
  try {
    if (slotId < 1 || slotId > MAX_SLOTS) {
      console.error(`存档槽位ID必须在1-${MAX_SLOTS}之间`);
      return null;
    }

    const slotKey = getSlotKey(slotId);
    const saved = localStorage.getItem(slotKey);

    if (!saved) {
      return null;
    }

    const saveData: SaveData = JSON.parse(saved);
    setCurrentSlotId(slotId);
    return saveData;
  } catch (error) {
    console.error('加载存档失败:', error);
    return null;
  }
};

/**
 * 获取所有存档槽位信息
 */
export const getAllSlots = (): SaveSlot[] => {
  const slots: SaveSlot[] = [];

  for (let i = 1; i <= MAX_SLOTS; i++) {
    const slotKey = getSlotKey(i);
    const saved = localStorage.getItem(slotKey);

    if (saved) {
      try {
        const saveData: SaveData = JSON.parse(saved);
        slots.push({
          id: i,
          name: `存档${i}`, // 默认名称，可以扩展支持自定义名称
          playerName: saveData.player.name || '未知',
          realm: saveData.player.realm || '未知',
          realmLevel: saveData.player.realmLevel || 1,
          timestamp: saveData.timestamp || Date.now(),
          data: saveData,
        });
      } catch (error) {
        console.error(`解析存档槽位${i}失败:`, error);
      }
    } else {
      // 空槽位
      slots.push({
        id: i,
        name: `存档${i}`,
        playerName: '',
        realm: '',
        realmLevel: 0,
        timestamp: 0,
        data: null,
      });
    }
  }

  return slots;
};

/**
 * 删除指定槽位的存档
 */
export const deleteSlot = (slotId: number): boolean => {
  try {
    if (slotId < 1 || slotId > MAX_SLOTS) {
      return false;
    }

    const slotKey = getSlotKey(slotId);
    localStorage.removeItem(slotKey);

    // 删除该槽位的所有备份
    for (let i = 0; i < MAX_BACKUPS; i++) {
      const backupKey = getBackupKey(slotId, i);
      localStorage.removeItem(backupKey);
    }

    return true;
  } catch (error) {
    console.error('删除存档失败:', error);
    return false;
  }
};

/**
 * 创建备份
 */
export const createBackup = (slotId: number, saveData?: SaveData): boolean => {
  try {
    if (slotId < 1 || slotId > MAX_SLOTS) {
      return false;
    }

    // 如果没有提供数据，从当前槽位加载
    if (!saveData) {
      saveData = loadFromSlot(slotId);
      if (!saveData) {
        return false;
      }
    }

    // 获取现有备份列表
    const backups = getBackups(slotId);

    // 添加新备份
    backups.unshift({
      ...saveData,
      timestamp: Date.now(),
    });

    // 只保留最新的MAX_BACKUPS个备份
    const backupsToKeep = backups.slice(0, MAX_BACKUPS);

    // 保存备份
    backupsToKeep.forEach((backup, index) => {
      const backupKey = getBackupKey(slotId, index);
      localStorage.setItem(backupKey, JSON.stringify(backup));
    });

    // 删除多余的备份
    for (let i = MAX_BACKUPS; i < backups.length; i++) {
      const backupKey = getBackupKey(slotId, i);
      localStorage.removeItem(backupKey);
    }

    return true;
  } catch (error) {
    console.error('创建备份失败:', error);
    return false;
  }
};

/**
 * 获取指定槽位的所有备份
 */
export const getBackups = (slotId: number): SaveData[] => {
  const backups: SaveData[] = [];

  for (let i = 0; i < MAX_BACKUPS; i++) {
    const backupKey = getBackupKey(slotId, i);
    const saved = localStorage.getItem(backupKey);

    if (saved) {
      try {
        const backup: SaveData = JSON.parse(saved);
        backups.push(backup);
      } catch (error) {
        console.error(`解析备份${i}失败:`, error);
      }
    }
  }

  return backups;
};

/**
 * 从备份恢复存档
 */
export const restoreFromBackup = (
  slotId: number,
  backupIndex: number
): boolean => {
  try {
    const backupKey = getBackupKey(slotId, backupIndex);
    const saved = localStorage.getItem(backupKey);

    if (!saved) {
      return false;
    }

    const backup: SaveData = JSON.parse(saved);
    return saveToSlot(slotId, backup.player, backup.logs);
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
  gold: { old: number; new: number };
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
    gold: { old: p1.gold, new: p2.gold },
    inventoryCount: {
      old: p1.inventory?.length || 0,
      new: p2.inventory?.length || 0,
    },
    equipmentCount: {
      old: Object.values(p1.equipment || {}).filter((e) => e !== null).length,
      new: Object.values(p2.equipment || {}).filter((e) => e !== null).length,
    },
    timestamp: { old: save1.timestamp, new: save2.timestamp },
  };
};

/**
 * 导出存档为JSON字符串
 */
export const exportSave = (saveData: SaveData): string => {
  return JSON.stringify(saveData, null, 2);
};

/**
 * 导入存档（从JSON字符串）
 */
export const importSave = (jsonString: string): SaveData | null => {
  try {
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

