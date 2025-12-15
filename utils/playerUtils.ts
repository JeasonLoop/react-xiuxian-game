import { PlayerStats, RealmType, SectRank } from '../types';
import { REALM_DATA, INITIAL_ITEMS, TALENTS, CULTIVATION_ARTS } from '../constants';

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

  // 初始化灵根：随机生成，总等级在25-45之间，每个灵根在0-20之间
  // 有一定概率生成单一高灵根（天灵根）或双灵根（地灵根）
  const generateInitialSpiritualRoots = () => {
    const roots = {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0,
    };

    const rand = Math.random();

    if (rand < 0.05) {
      // 5%概率：天灵根（单一灵根极高）
      const rootTypes: Array<keyof typeof roots> = ['metal', 'wood', 'water', 'fire', 'earth'];
      const mainRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
      roots[mainRoot] = 30 + Math.floor(Math.random() * 11); // 30-40
      // 其他灵根随机分配剩余点数
      const remaining = 25 + Math.floor(Math.random() * 16); // 25-40
      const otherRoots = rootTypes.filter(r => r !== mainRoot);
      for (let i = 0; i < remaining; i++) {
        const randomRoot = otherRoots[Math.floor(Math.random() * otherRoots.length)];
        if (roots[randomRoot] < 10) {
          roots[randomRoot]++;
        }
      }
    } else if (rand < 0.20) {
      // 15%概率：地灵根（双灵根较高）
      const rootTypes: Array<keyof typeof roots> = ['metal', 'wood', 'water', 'fire', 'earth'];
      const shuffled = [...rootTypes].sort(() => Math.random() - 0.5);
      const mainRoot1 = shuffled[0];
      const mainRoot2 = shuffled[1];
      roots[mainRoot1] = 15 + Math.floor(Math.random() * 11); // 15-25
      roots[mainRoot2] = 15 + Math.floor(Math.random() * 11); // 15-25
      // 其他灵根随机分配
      const remaining = 15 + Math.floor(Math.random() * 11); // 15-25
      const otherRoots = shuffled.slice(2);
      for (let i = 0; i < remaining; i++) {
        const randomRoot = otherRoots[Math.floor(Math.random() * otherRoots.length)];
        if (roots[randomRoot] < 8) {
          roots[randomRoot]++;
        }
      }
    } else {
      // 80%概率：杂灵根（均匀分布）
      const totalTarget = 25 + Math.floor(Math.random() * 21); // 25-45之间
      const rootTypes: Array<keyof typeof roots> = ['metal', 'wood', 'water', 'fire', 'earth'];

      // 先随机分配基础值
      rootTypes.forEach(root => {
        roots[root] = Math.floor(Math.random() * 12); // 0-11
      });

      // 确保总等级接近目标值
      const currentTotal = roots.metal + roots.wood + roots.water + roots.fire + roots.earth;
      const diff = totalTarget - currentTotal;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
          if (roots[randomRoot] < 20) {
            roots[randomRoot]++;
          }
        }
      }
    }

    return roots;
  };

  const initialSpiritualRoots = generateInitialSpiritualRoots();
  const initialMaxLifespan = realmData.baseMaxLifespan;
  const initialLifespan = initialMaxLifespan; // 初始寿命等于最大寿命

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
    cultivationArts: ['art-basic-breath'], // 初始只有吐纳诀
    activeArtId: 'art-basic-breath', // 默认激活吐纳诀
    equippedItems: {},
    sectId: null,
    sectRank: SectRank.Outer,
    sectContribution: 0,
    betrayedSects: [], // 背叛过的宗门列表
    sectHuntEndTime: null, // 宗门追杀结束时间
    talentId: talentId,
    titleId: null,
    attributePoints: 0,
    luck: 10 + talentLuck,
    achievements: [],
    pets: [],
    activePetId: null,
    lotteryTickets: 10, // 开局十连抽
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
    statistics: {
      killCount: 0,
      meditateCount: 0,
      adventureCount: 0,
      equipCount: 0,
      petCount: 0,
      recipeCount: 0,
      artCount: 0,
      breakthroughCount: 0,
      secretRealmCount: 0,
    },
    lifespan: initialLifespan,
    maxLifespan: initialMaxLifespan,
    spiritualRoots: initialSpiritualRoots,
    // 日常任务系统
    dailyQuests: [],
    dailyQuestProgress: {},
    dailyQuestCompleted: [],
    lastDailyQuestResetDate: new Date().toISOString().split('T')[0],
    gameDays: 1, // 游戏内天数，从第1天开始
  };
};
