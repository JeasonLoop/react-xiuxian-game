import { AdventureResult, AdventureType, BattleSkill, RealmType } from '../../types';

export interface BattleRoundLog {
  id: string;
  attacker: 'player' | 'enemy';
  damage: number;
  crit: boolean;
  description: string;
  playerHpAfter: number;
  enemyHpAfter: number;
}

export interface BattleReplay {
  id: string;
  adventureType?: AdventureType; // 历练类型
  bossId?: string | null; // 挑战的BOSS ID（用于天地之魄等特殊战斗）
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    spirit: number; // 敌人神识属性
    strengthMultiplier?: number; // 敌人强度倍数
    isElite?: boolean; // 是否为精英强敌
  };
  rounds: BattleRoundLog[];
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  summary: string;
  expChange: number;
  spiritChange: number;
}

export interface BattleResolution {
  adventureResult: AdventureResult;
  replay: BattleReplay;
  petSkillCooldowns?: Record<string, number>; // 战斗结束后的灵宠技能冷却状态
}

/**
 * 敌人生成结果（enemyFactory.createEnemy 的返回类型）
 * 精英强敌：isElite = true，必带技能，属性与奖励均有额外乘区
 */
export interface BattleEnemy {
  name: string;
  title: string;
  realm: RealmType;
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
  spirit: number;
  strengthMultiplier: number;
  isElite: boolean;
  skills: BattleSkill[];
}
