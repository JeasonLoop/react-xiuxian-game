/**
 * 境界系统相关常量
 * 包含境界顺序、境界数据等配置
 */

import { RealmType } from '../types';

export const REALM_ORDER = [
  RealmType.QiRefining,
  RealmType.Foundation,
  RealmType.GoldenCore,
  RealmType.NascentSoul,
  RealmType.SpiritSevering,
  RealmType.DaoCombining,
  RealmType.LongevityRealm,
];

export const REALM_DATA: Record<
  RealmType,
  {
    baseMaxHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpirit: number; // 神识
    basePhysique: number; // 体魄
    baseSpeed: number; // 速度
    maxExpBase: number;
    baseMaxLifespan: number; // 基础最大寿命（年）
  }
> = {
  [RealmType.QiRefining]: {
    baseMaxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    baseSpirit: 5,
    basePhysique: 10,
    baseSpeed: 10,
    maxExpBase: 250, // 降低为5倍增长，提升升级体验
    baseMaxLifespan: 120, // 炼气期基础寿命120年
  },
  [RealmType.Foundation]: {
    baseMaxHp: 500,
    baseAttack: 50,
    baseDefense: 25,
    baseSpirit: 25,
    basePhysique: 50,
    baseSpeed: 30,
    maxExpBase: 1250, // 降低为5倍增长，提升升级体验
    baseMaxLifespan: 300, // 筑基期基础寿命300年
  },
  [RealmType.GoldenCore]: {
    baseMaxHp: 2500,
    baseAttack: 200,
    baseDefense: 100,
    baseSpirit: 100,
    basePhysique: 200,
    baseSpeed: 50,
    maxExpBase: 6250, // 降低为5倍增长，提升升级体验
    baseMaxLifespan: 800, // 金丹期基础寿命800年
  },
  [RealmType.NascentSoul]: {
    baseMaxHp: 10000,
    baseAttack: 1000,
    baseDefense: 500,
    baseSpirit: 500,
    basePhysique: 1000,
    baseSpeed: 100,
    maxExpBase: 31250, // 降低为5倍增长，提升升级体验
    baseMaxLifespan: 2000, // 元婴期基础寿命2000年
  },
  [RealmType.SpiritSevering]: {
    baseMaxHp: 50000,
    baseAttack: 5000,
    baseDefense: 2500,
    baseSpirit: 2500,
    basePhysique: 5000,
    baseSpeed: 800,
    maxExpBase: 156250,
    baseMaxLifespan: 5000, // 化神期基础寿命5000年
  },
  [RealmType.DaoCombining]: {
    baseMaxHp: 250000,
    baseAttack: 25000,
    baseDefense: 12500,
    baseSpirit: 12500,
    basePhysique: 25000,
    baseSpeed: 4000,
    maxExpBase: 781250,
    baseMaxLifespan: 12500, // 合道期基础寿命12500年
  },
  [RealmType.LongevityRealm]: {
    baseMaxHp: 1250000,
    baseAttack: 125000,
    baseDefense: 62500,
    baseSpirit: 62500,
    basePhysique: 125000,
    baseSpeed: 20000,
    maxExpBase: 3906250,
    baseMaxLifespan: 31250, // 长生期基础寿命31250年
  },
};
