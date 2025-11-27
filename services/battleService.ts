import { AdventureResult, AdventureType, PlayerStats, RealmType } from '../types';
import { REALM_ORDER } from '../constants';
import { generateEnemyName } from './aiService';

const randomId = () => Math.random().toString(36).slice(2, 9);

const ENEMY_NAMES = [
  // 妖兽类
  '血牙狼', '裂地熊', '玄煞蛛', '阴焰鸦', '噬魂藤', '赤纹虎', '蓝鬃豹', '铁背猿',
  '骨鳞蜥', '黄泉使', '暗影豹', '雷霆狮', '冰霜蛇', '烈焰鸟', '风暴鹰', '毒沼鳄',
  '石甲龟', '幻影狐', '幽冥猫', '金角牛', '银鳞鱼', '黑翼蝠', '紫电貂', '青鳞蟒',
  '赤目猴', '白毛象', '灰鬃马', '绿眼狼', '黄沙蝎', '黑水蛇', '红尾狐', '蓝羽雀',

  // 修士类
  '星落修士', '魇沙客', '断魂剑客', '血手魔修', '鬼面道人', '邪心散修', '暗影刺客',
  '狂刀武修', '毒手药师', '阴煞老怪', '血魔真人', '白骨道人', '黑风散人', '赤发魔君',
  '青面鬼修', '紫袍邪修', '灰衣杀手', '白衣剑客', '黑衣刀客', '红衣魔女', '绿袍毒师',

  // 特殊类
  '护宝傀儡', '机关兽', '石像守卫', '木偶人', '铁甲兵', '铜人阵', '银甲卫', '金甲将',
  '怨灵', '恶鬼', '僵尸', '骷髅', '幽灵', '魔物', '邪灵', '妖魂'
];

const ENEMY_TITLES = [
  // 妖兽称号
  '荒原妖兽', '巡山妖将', '秘境妖兽', '深山老妖', '古林妖王', '血海妖尊', '魔域妖将',
  '妖山统领', '妖谷守护', '妖洞领主', '妖林霸主', '妖域先锋', '妖界战将',

  // 修士称号
  '堕落修士', '邪修', '魔道散修', '血魔修士', '鬼道真人', '邪道魔君', '魔门长老',
  '邪派护法', '魔教使者', '邪宗弟子', '魔道散人', '邪门高手', '魔修强者',

  // 守卫称号
  '秘境守卫', '护宝傀儡', '遗迹守护', '古墓守卫', '洞府守护', '宝库守卫', '禁地守卫',
  '秘地守护', '禁制守卫', '法阵守护', '机关守卫', '石像守卫',

  // 其他称号
  '荒野游魂', '古战场怨灵', '迷失修士', '堕落真人', '被诅咒者', '魔化修士', '邪化妖兽'
];

const battleDifficulty: Record<AdventureType, number> = {
  normal: 1,
  lucky: 0.85,
  secret_realm: 1.25
};

const baseBattleChance: Record<AdventureType, number> = {
  normal: 0.22,
  lucky: 0.08,
  secret_realm: 0.45
};

const pickOne = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

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
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
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
}

const clampMin = (value: number, min: number) => (value < min ? min : value);

const createEnemy = async (player: PlayerStats, adventureType: AdventureType) => {
  const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
  const realmOffset = adventureType === 'secret_realm' ? 1 : adventureType === 'lucky' ? -1 : 0;
  const targetIndex = clampMin(Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset), 0);
  const realm = REALM_ORDER[targetIndex];
  const difficulty = battleDifficulty[adventureType] || 1;
  const variance = () => 0.85 + Math.random() * 0.35; // 0.85 - 1.2

  // 15%概率使用AI生成敌人名字，失败则使用预设列表
  let name = pickOne(ENEMY_NAMES);
  let title = pickOne(ENEMY_TITLES);

  if (Math.random() < 0.15) {
    try {
      const aiGenerated = await generateEnemyName(realm, adventureType);
      if (aiGenerated.name && aiGenerated.title) {
        name = aiGenerated.name;
        title = aiGenerated.title;
      }
    } catch (e) {
      // AI生成失败，使用预设列表
      console.log("AI生成敌人名字失败，使用预设列表");
    }
  }

  return {
    name,
    title,
    realm,
    attack: Math.max(12, Math.round((player.attack + player.realmLevel * 5) * variance() * difficulty)),
    defense: Math.max(10, Math.round((player.defense + player.realmLevel * 4) * variance() * difficulty)),
    maxHp: Math.max(60, Math.round(player.maxHp * (0.75 + Math.random() * 0.5) * difficulty)),
    speed: Math.max(8, Math.round((player.speed || 10) * (0.8 + Math.random() * 0.4)))
  };
};

const calcDamage = (attack: number, defense: number) => {
  const base = attack * 0.9 - defense * 0.45;
  const minDamage = Math.max(5, attack * 0.25);
  const randomFactor = 0.9 + Math.random() * 0.25;
  return Math.round(Math.max(minDamage, base) * randomFactor);
};

export const shouldTriggerBattle = (player: PlayerStats, adventureType: AdventureType): boolean => {
  const base = baseBattleChance[adventureType] ?? 0.2;
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.015;
  const speedBonus = (player.speed || 0) * 0.0004;
  const luckMitigation = (player.luck || 0) * 0.0002;
  const chance = Math.min(0.75, base + realmBonus + speedBonus - luckMitigation);
  return Math.random() < Math.max(0.05, chance);
};

export const resolveBattleEncounter = async (player: PlayerStats, adventureType: AdventureType): Promise<BattleResolution> => {
  const enemy = await createEnemy(player, adventureType);
  const difficulty = battleDifficulty[adventureType] || 1;
  let playerHp = player.hp;
  let enemyHp = enemy.maxHp;
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' = (player.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(isPlayerTurn ? player.attack : enemy.attack, isPlayerTurn ? enemy.defense : player.defense);
    const critChanceBase = 0.08 + ((isPlayerTurn ? player.speed : enemy.speed) / ((player.speed || 1) + enemy.speed + 1)) * 0.2;
    const crit = Math.random() < critChanceBase;
    const finalDamage = crit ? Math.round(damage * 1.5) : damage;

    if (isPlayerTurn) {
      enemyHp = Math.max(0, enemyHp - finalDamage);
    } else {
      playerHp = Math.max(0, playerHp - finalDamage);
    }

    rounds.push({
      id: randomId(),
      attacker,
      damage: finalDamage,
      crit,
      description: isPlayerTurn
        ? `你发动灵力攻势，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`
        : `${enemy.title}${enemy.name}反扑，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp
    });

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;
  if (!victory) {
    playerHp = Math.max(1, Math.round(player.maxHp * 0.08));
  }

  const hpLoss = Math.max(0, player.hp - playerHp);

  const baseExp = 25 + player.realmLevel * 12;
  const rewardExp = Math.round(baseExp * difficulty);
  const rewardStones = Math.max(3, Math.round((6 + player.realmLevel * 2) * difficulty));

  const expChange = victory ? rewardExp : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory ? rewardStones : -Math.max(2, Math.round(rewardStones * 0.6));

  const summary = victory
    ? `你斩杀了${enemy.title}${enemy.name}，耗费 ${hpLoss} 点气血。`
    : `你不敌${enemy.title}${enemy.name}，重伤撤离，损失 ${hpLoss} 点气血。`;

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange: playerHp - player.hp,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger'
  };

  return {
    adventureResult,
    replay: {
      id: randomId(),
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: player.hp,
      playerHpAfter: playerHp,
      summary,
      expChange,
      spiritChange
    }
  };
};


