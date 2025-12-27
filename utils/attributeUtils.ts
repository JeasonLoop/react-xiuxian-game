import { RealmType } from '../types';
import { REALM_ORDER, MAX_ATTRIBUTE_POINTS_PER_REALM } from '../constants/index';

/**
 * 基础属性常量
 */
export const BASE_ATTRIBUTES = {
  attack: 5,
  defense: 3,
  hp: 20,
  spirit: 3,
  physique: 3,
  physiqueHp: 10,
  speed: 2,
} as const;

/**
 * 境界索引缓存（避免重复执行 indexOf）
 */
const REALM_INDEX_MAP = new Map<RealmType, number>(
  REALM_ORDER.map((realm, index) => [realm, index])
);

/**
 * 获取境界的索引位置（使用缓存）
 * @param realm 境界
 * @returns 境界索引（如果无效则返回0）
 */
export const getRealmIndex = (realm: RealmType): number => {
  return REALM_INDEX_MAP.get(realm) ?? 0;
};

/**
 * 根据境界计算属性点加成倍数（线性增长）
 * 基础倍数：1 + 境界索引 * 2
 * @param realm 境界
 * @returns 属性点加成倍数
 */
export const getAttributeMultiplier = (realm: RealmType): number => {
  const validRealmIndex = getRealmIndex(realm);
  return 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍
};

/**
 * 根据境界和层级计算属性值
 * @param type 属性类型
 * @param realm 境界
 * @param points 属性点数量
 * @returns 属性值
 */
export const calculateAttributeValue = (
  type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed',
  realm: RealmType,
  points: number = 1
): { value: number; physiqueHp?: number } => {
  const multiplier = getAttributeMultiplier(realm);
  const gain = Math.floor(BASE_ATTRIBUTES[type] * multiplier);

  if (type === 'physique') {
    const hpGain = Math.floor(BASE_ATTRIBUTES.physiqueHp * multiplier);
    return {
      value: gain,
      physiqueHp: hpGain,
    };
  }

  return { value: gain * points };
};

/**
 * 突破时获得的属性点数量（带上限保护）
 * 境界升级：根据境界线性增长，不超过当前境界上限
 * 层数升级：较小幅度增长，不超过当前境界上限
 * @param isRealmUpgrade 是否为境界升级
 * @param realm 境界
 * @param currentPoints 当前已分配的属性点数（可选）
 * @returns 属性点数量
 */
export const calculateBreakthroughAttributePoints = (
  isRealmUpgrade: boolean,
  realm: RealmType,
  currentPoints: number = 0
): number => {
  const validRealmIndex = getRealmIndex(realm);
  const maxPoints = MAX_ATTRIBUTE_POINTS_PER_REALM[realm];
  const pointsGain = isRealmUpgrade ? 2 : 1; // 简化为线性增长

  // 计算实际获得的点数（不超过上限）
  const actualGain = Math.min(pointsGain, maxPoints - currentPoints);
  return Math.max(0, actualGain);
};
