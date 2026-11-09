import {
  AdventureResult,
  AdventureType,
  DifficultyMode,
  PlayerStats,
  RealmType,
} from '../../types';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { calculateAllCustomSpellBonuses } from '../customSpellService';
import { createEnemy } from './enemyFactory';
import { BattleResolution, BattleRoundLog } from './types';
import {
  calcDamage,
  computeCritChance,
  computeSpeedDodge,
  generateLoot,
  getBattleDifficulty,
  getExpAndStoneRewards,
  getRiskRewardMultiplier,
  handlePetAction,
  randomId,
} from './shared';

const safeNumber = (val: any, def: number = 0) => Number(val) || def;

/**
 * 根据基础最大值和当前值，按比例计算新的值
 */
const getScaledValue = (oldMax: number, current: number, newMax: number) => {
  const ratio = oldMax > 0 ? current / oldMax : 0;
  return Math.floor(newMax * ratio);
};

export const resolveBattleEncounter = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  realmMinRealm?: RealmType,
  realmName?: string,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string, // 指定的天地之魄BOSS ID（用于事件模板）
  difficultyMode: DifficultyMode = 'normal'
): Promise<BattleResolution> => {
  const enemy = await createEnemy(
    player,
    adventureType,
    riskLevel,
    realmMinRealm,
    huntSectId,
    huntLevel,
    bossId,
    difficultyMode
  );
  const difficulty = getBattleDifficulty(adventureType, riskLevel, difficultyMode);
  // 使用getPlayerTotalStats计算实际最大血量（包含金丹法数、心法等加成）
  const totalStats = getPlayerTotalStats(player);
  const actualMaxHp = totalStats.maxHp;
  const battlePlayer = {
    ...player,
    attack: totalStats.attack,
    defense: totalStats.defense,
    maxHp: actualMaxHp,
    speed: totalStats.speed,
    spirit: totalStats.spirit,
  };
  // 确保初始值为有效数字，防止NaN
  // 按比例调整血量：如果功法增加了最大血量，当前血量也应该按比例增加
  const initialPlayerHp = getScaledValue(safeNumber(player.maxHp, 1), safeNumber(player.hp, 0), actualMaxHp);
  const initialMaxHp = actualMaxHp;
  let playerHp = Math.max(0, Math.min(initialPlayerHp, initialMaxHp));
  let enemyHp = safeNumber(enemy.maxHp);
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' =
    (battlePlayer.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  // 获取激活的灵宠
  const activePet = player.activePetId
    ? (player.pets || []).find((p) => p.id === player.activePetId)
    : null;

  // 初始化灵宠技能冷却（如果还没有）
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet && !activePet.skillCooldowns) {
    petSkillCooldowns = {};
  } else if (activePet) {
    petSkillCooldowns = { ...activePet.skillCooldowns };
  }

  const spellBonuses = calculateAllCustomSpellBonuses(player);

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(
      isPlayerTurn ? battlePlayer.attack : enemy.attack,
      isPlayerTurn ? enemy.defense : battlePlayer.defense
    );
    // 确保速度值是有效数字，防止NaN
    const playerSpeed = Number(battlePlayer.speed) || 0;
    const enemySpeed = Number(enemy.speed) || 0;
    // 暴击率统一使用 computeCritChance，与回合制路径保持同一公式
    const attackerSpeed = isPlayerTurn ? playerSpeed : enemySpeed;
    const targetSpeed = isPlayerTurn ? enemySpeed : playerSpeed;
    const extraCritChance = isPlayerTurn ? spellBonuses.critRate : 0;
    const critChance = computeCritChance(attackerSpeed, targetSpeed, extraCritChance);
    const crit = Math.random() < critChance;
    const critMultiplier = 1.5 + (isPlayerTurn ? spellBonuses.critDamage : 0);
    let finalDamage = crit ? Math.round(damage * critMultiplier) : damage;
    let isDodged = false;

    if (isPlayerTurn) {
      // 敌方目标的闪避判定：与回合制一致，使用速度差闪避（上限15%）
      const enemyDodgeChance = computeSpeedDodge(playerSpeed, enemySpeed);
      if (enemyDodgeChance > 0 && Math.random() < enemyDodgeChance) {
        finalDamage = 0;
        isDodged = true;
      } else {
        enemyHp = Math.max(0, (Number(enemyHp) || 0) - finalDamage);
        if (finalDamage > 0 && spellBonuses.lifeLeech > 0) {
          playerHp = Math.min(initialMaxHp, playerHp + Math.floor(finalDamage * spellBonuses.lifeLeech));
        }
      }
    } else {
      // 玩家的闪避判定：法术闪避（保持原有35%上限）与速度差闪避取最大值，与回合制逻辑一致
      const dodgeChance = Math.max(
        Math.max(0, Math.min(0.35, spellBonuses.dodgeRate)),
        computeSpeedDodge(enemySpeed, playerSpeed)
      );
      if (dodgeChance > 0 && Math.random() < dodgeChance) {
        finalDamage = 0;
        isDodged = true;
      } else {
        finalDamage = Math.round(finalDamage * (1 - Math.min(0.6, spellBonuses.damageReduction)));
        playerHp = Math.max(0, (Number(playerHp) || 0) - finalDamage);
      }
    }
    rounds.push({
      id: randomId(),
      attacker,
      damage: finalDamage,
      crit,
      description: isPlayerTurn
        ? isDodged
          ? `你发动灵力攻势，但被${enemy.title}${enemy.name}闪避了！`
          : `你发动灵力攻势，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`
        : finalDamage === 0
          ? `${enemy.title}${enemy.name}反扑，被你闪避了！`
          : `${enemy.title}${enemy.name}反扑，造成 ${finalDamage}${crit ? '（暴击）' : ''} 点伤害。`,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });

    // 玩家回合后，灵宠可以行动（附加攻击或释放技能）
    if (isPlayerTurn && activePet && enemyHp > 0) {
      // 更新技能冷却
      Object.keys(petSkillCooldowns).forEach((skillId) => {
        if (petSkillCooldowns[skillId] > 0) {
          petSkillCooldowns[skillId]--;
        }
      });

      const { action, updatedEnemyHp, updatedPlayerHp, updatedCooldowns } = handlePetAction(
        activePet,
        { ...battlePlayer, hp: playerHp } as PlayerStats,
        { hp: enemyHp, maxHp: enemy.maxHp, defense: enemy.defense, name: enemy.name, title: enemy.title },
        petSkillCooldowns,
        randomId,
        calcDamage,
        getPlayerTotalStats
      );

      enemyHp = updatedEnemyHp;
      playerHp = updatedPlayerHp;
      petSkillCooldowns = updatedCooldowns;
      rounds.push(action as BattleRoundLog);
    }

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;

  // 确保hpLoss是有效数字，防止NaN
  const playerHpBefore = Number(player.hp) || 0;
  const playerHpAfter = Number(playerHp) || 0;
  const hpLoss = Math.max(0, Math.floor(playerHpBefore - playerHpAfter));

  const rewardMultiplier =
    adventureType === 'secret_realm' ? getRiskRewardMultiplier(riskLevel) : 1.0;

  const { exp: rewardExp, stones: rewardStones } = getExpAndStoneRewards(

    player,
    adventureType,
    difficulty,
    rewardMultiplier,
    enemy.strengthMultiplier,
    difficultyMode
  );

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成搜刮奖励
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(
      enemy.strengthMultiplier,
      adventureType,
      player.realm,
      riskLevel
    );
    lootItems.push(...loot);
  }

  // 生成更丰富的战斗描述
  const generateBattleSummary = (
    victory: boolean,
    enemy: { name: string; title: string },
    hpLoss: number,
    hasLoot: boolean,
    realmName?: string
  ): string => {
    const realmContext = realmName && adventureType === 'secret_realm' ? `在${realmName}中，` : "";
    const lootText = hasLoot ? (Math.random() < 0.5 ? "你仔细搜刮了敌人的遗物。" : "你从敌人身上找到了战利品。") : "";

    const victoryScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}展开激战。最终，你将其斩于剑下，但也耗费了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你遭遇了${enemy.title}${enemy.name}的袭击。经过一番殊死搏斗，你成功将其击败，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你与${enemy.title}${enemy.name}展开对决。最终，你凭借更强的实力将其斩杀，损失了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你祭出法宝，与${enemy.title}${enemy.name}展开对决。最终，你技高一筹，成功将其击杀，消耗了 ${hpLoss} 点气血。${lootText}`,
      `${realmContext}你施展神通，与${enemy.title}${enemy.name}展开激战。最终，你抓住机会，一剑将其斩杀。耗费了 ${hpLoss} 点气血。${lootText}`,
    ];

    const defeatScenarios = [
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常艰难。对方实力强大，你拼尽全力仍不敌，只得重伤撤离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你遭遇了强大的${enemy.title}${enemy.name}。面对其猛烈的攻击，你渐渐落入下风，只能带着伤势逃离，损失了 ${hpLoss} 点气血。`,
      `${realmContext}你与${enemy.title}${enemy.name}的战斗异常激烈。对方的速度和力量远超预期，你无法取胜，只得选择撤退，损失了 ${hpLoss} 点气血。`,
    ];

    const scenarios = victory ? victoryScenarios : defeatScenarios;
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  const summary = generateBattleSummary(
    victory,
    enemy,
    hpLoss,
    lootItems.length > 0,
    realmName
  );

  // 确保hpChange是有效数字，防止NaN
  const hpChange = Math.floor(playerHpAfter - playerHpBefore);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  // 清理冷却时间为0的技能冷却（节省存储空间）
  const finalPetSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        finalPetSkillCooldowns[skillId] = petSkillCooldowns[skillId];
      }
    });
  }

  return {
    adventureResult,
    replay: {
      id: randomId(),
      adventureType,
      bossId: bossId || null,
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: playerHpBefore,
      playerHpAfter: playerHpAfter,
      summary,
      expChange,
      spiritChange,
    },
    petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
  };
};
