/**
 * 战斗服务门面（facade）
 * 实现已拆分至 services/battle/ 目录，此处仅 re-export 保持既有 import 路径兼容。
 */
export * from './battle/types';
export * from './battle/constants';
export * from './battle/shared';
export * from './battle/enemyFactory';
export * from './battle/fastBattle';
export * from './battle/turnBased';
