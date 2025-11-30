import { PlayerStats, RealmType } from '../types';
import { REALM_DATA, INITIAL_ITEMS, TALENTS } from '../constants';

// 创建初始玩家数据
export const createInitialPlayer = (
  name: string,
  talentId: string
): PlayerStats => {
  const initialTalent = TALENTS.find((t) => t.id === talentId);
  const talentAttack = initialTalent?.effects.attack || 0;
  const talentDefense = initialTalent?.effects.defense || 0;
  const talentHp = initialTalent?.effects.hp || 0;
  const talentSpirit = initialTalent?.effects.spirit || 0;
  const talentPhysique = initialTalent?.effects.physique || 0;
  const talentSpeed = initialTalent?.effects.speed || 0;
  const talentLuck = initialTalent?.effects.luck || 0;

  const realmData = REALM_DATA[RealmType.QiRefining];
  return {
    name,
    realm: RealmType.QiRefining,
    realmLevel: 1,
    exp: 0,
    maxExp: realmData.maxExpBase,
    hp: realmData.baseMaxHp + talentHp,
    maxHp: realmData.baseMaxHp + talentHp,
    attack: realmData.baseAttack + talentAttack,
    defense: realmData.baseDefense + talentDefense,
    spirit: realmData.baseSpirit + talentSpirit,
    physique: realmData.basePhysique + talentPhysique,
    speed: realmData.baseSpeed + talentSpeed,
    spiritStones: 50,
    inventory: [...INITIAL_ITEMS],
    cultivationArts: [],
    activeArtId: null,
    equippedItems: {},
    sectId: null,
    sectRank: '外门' as any,
    sectContribution: 0,
    talentId: talentId,
    titleId: null,
    attributePoints: 0,
    luck: 10 + talentLuck,
    achievements: [],
    pets: [],
    activePetId: null,
    lotteryTickets: 3,
    lotteryCount: 0,
    inheritanceLevel: 0,
    dailyTaskCount: {
      instant: 0,
      short: 0,
      medium: 0,
      long: 0,
    },
    lastTaskResetDate: new Date().toISOString().split('T')[0],
    viewedAchievements: [],
    natalArtifactId: null,
    unlockedRecipes: [], // 已解锁的丹方名称列表
    meditationHpRegenMultiplier: 1.0, // 打坐回血速度加成倍数（默认1.0）
    meditationBoostEndTime: null, // 打坐回血加成结束时间戳（毫秒）
  };
};
