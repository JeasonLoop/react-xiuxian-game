import { MAX_SPIRITUAL_ROOT_VALUE } from '../constants/index';

/**
 * 限制灵根值在合理范围内
 * @param value 灵根值
 * @returns 限制后的灵根值（0-100）
 */
export const clampSpiritualRoot = (value: number): number => {
  return Math.min(Math.max(0, Math.floor(value)), MAX_SPIRITUAL_ROOT_VALUE);
};
