import {
  AdventureResult,
  AdventureType,
  BattleAction,
  BattleState,
  BattleUnit,
  Buff,
  DifficultyMode,
  EquipmentSlot,
  ItemRarity,
  ItemType,
  Pet,
  PetSkill,
  PlayerStats,
  RealmType,
  SectRank,
} from '../../types';
import {
  CULTIVATION_ARTS,
  DISCOVERABLE_RECIPES,
  HEAVEN_EARTH_SOUL_BOSSES,
  REALM_ORDER,
  SECT_MASTER_CHALLENGE_REQUIREMENTS,
} from '../../constants/index';
import { getAdventureBalance, getDifficultyBalance } from '../../constants/balance';
import { uid } from '../../utils/gameUtils';
import { ELITE_REWARD_MULTIPLIER, LOOT_ITEMS, RARITY_ORDER, RISK_REWARD_MULTIPLIERS } from './constants';
import { BattleRoundLog } from './types';

export const randomId = uid;

/**
 * 获取风险等级奖励倍数
 */
export const getRiskRewardMultiplier = (riskLevel?: '低' | '中' | '高' | '极度危险'): number => {
  return riskLevel ? (RISK_REWARD_MULTIPLIERS[riskLevel] || 1.0) : 1.0;
};

// 根据风险等级计算战斗难度
export const getBattleDifficulty = (

  adventureType: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  difficultyMode: DifficultyMode = 'normal'
): number => {
  const difficultyBalance = getDifficultyBalance(difficultyMode);
  const adventureBalance = getAdventureBalance(adventureType);
  const balanceMultiplier = difficultyBalance.enemyPower * adventureBalance.enemyPower;

  if (adventureType === 'secret_realm' && riskLevel) {
    // 秘境根据风险等级调整难度（扩大差异使风险等级名称与实际难度匹配）
    // 敌人强度整体上调 ×1.25（原 0.6 / 1.0 / 1.5 / 2.2）
    const riskMultipliers = {
      低: 0.75,      // 降低难度，适合刷级
      中: 1.25,      // 标准难度
      高: 1.875,     // 提高难度，增加挑战
      极度危险: 2.75, // 大幅提高难度，名副其实的"极度危险"
    };
    return riskMultipliers[riskLevel] * balanceMultiplier;
  }
  // 非秘境使用固定难度
  // 敌人强度整体上调：普通历练档 ×1.15，秘境/宗门挑战 ×1.25，天地之魄挑战保持不变
  const baseDifficulty: Record<AdventureType, number> = {
    normal: 1.15, // 原1，普通历练敌人强度 +15%
    lucky: 0.98, // 原0.85 × 1.15，机缘档同比例上调
    secret_realm: 1.56, // 原1.25 × 1.25，秘境基础难度同步上调
    sect_challenge: 1.875, // 宗主挑战难度 ×1.25（原1.5）
    dao_combining_challenge: 2.0, // 天地之魄挑战难度
  };
  return baseDifficulty[adventureType] * balanceMultiplier;
};

// Fisher-Yates 洗牌算法，用于打乱数组顺序
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 改进的随机选择函数，先打乱数组再选择，增加随机性
export const pickOne = <T>(list: T[]): T => {
  if (list.length === 0) throw new Error('Cannot pick from empty list');
  // 对于小数组，直接随机选择；对于大数组，先打乱再选择
  if (list.length <= 10) {
    return list[Math.floor(Math.random() * list.length)];
  }
  // 对于大数组，打乱后选择，增加随机性
  const shuffled = shuffle(list);
  return shuffled[Math.floor(Math.random() * shuffled.length)];
};

// 根据敌人强度和类型生成搜刮奖励
export const generateLoot = (
  enemyStrength: number,
  adventureType: AdventureType,
  playerRealm: RealmType,
  riskLevel?: '低' | '中' | '高' | '极度危险'
): AdventureResult['itemObtained'][] => {
  const lootItems: AdventureResult['itemObtained'][] = [];
  // 用于追踪已选择的物品，避免重复（装备类物品按名称+稀有度去重）
  const selectedItems = new Set<string>();
  // 用于追踪已选择的物品类型，避免连续获得相同类型
  const selectedTypes: string[] = [];

  // 根据敌人强度决定奖励数量（1-4个物品）
  const numItems =
    enemyStrength < 0.7
      ? 1 // 弱敌：1个物品
      : enemyStrength < 1.0
        ? 1 + Math.floor(Math.random() * 2) // 普通：1-2个物品
        : 2 + Math.floor(Math.random() * 3); // 强敌：2-4个物品

  // 根据玩家境界调整稀有度概率（高境界更容易获得高级物品）
  const realmIndex = REALM_ORDER.indexOf(playerRealm);
  // 境界加成：每个境界增加稀有度概率，降低加成上限防止物品通胀
  // 基础加成：每个境界增加1%仙品、1.5%传说、2.5%稀有概率
  // 高境界（第4个境界及以上）额外获得50%加成
  const isHighRealm = realmIndex >= 3; // 元婴期及以上
  const realmMultiplier = isHighRealm ? 1.5 : 1.0;
  const realmBonusImmortal = Math.min(0.05, realmIndex * 0.01 * realmMultiplier); // 仙品加成，最高5%
  const realmBonusLegend = Math.min(0.10, realmIndex * 0.015 * realmMultiplier); // 传说加成，最高10%
  const realmBonusRare = Math.min(0.20, realmIndex * 0.025 * realmMultiplier); // 稀有加成，最高20%

  // 根据敌人强度和类型决定稀有度分布
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // 秘境：根据风险等级调整稀有度概率
      if (riskLevel === '极度危险') {
        // 极度危险：更高概率获得顶级物品（降低基础概率防止通胀）
        if (roll < 0.15 + realmBonusImmortal) return '仙品';
        if (roll < 0.45 + realmBonusLegend) return '传说';
        if (roll < 0.82 + realmBonusRare) return '稀有';
        return '普通';
      } else if (riskLevel === '高') {
        // 高风险：较高概率
        if (roll < 0.12 + realmBonusImmortal) return '仙品';
        if (roll < 0.4 + realmBonusLegend) return '传说';
        if (roll < 0.75 + realmBonusRare) return '稀有';
        return '普通';
      } else if (riskLevel === '中') {
        // 中风险：中等概率
        if (roll < 0.08 + realmBonusImmortal) return '仙品';
        if (roll < 0.3 + realmBonusLegend) return '传说';
        if (roll < 0.65 + realmBonusRare) return '稀有';
        return '普通';
      } else {
        // 低风险：较低概率（但比普通历练高）
        if (roll < 0.05 + realmBonusImmortal) return '仙品';
        if (roll < 0.2 + realmBonusLegend) return '传说';
        if (roll < 0.55 + realmBonusRare) return '稀有';
        return '普通';
      }
    } else if (adventureType === 'lucky') {
      // 机缘：中等概率，境界加成更明显
      if (roll < 0.02 + realmBonusImmortal * 0.8) return '仙品'; // 机缘历练也可能获得仙品
      if (roll < 0.05 + realmBonusLegend) return '传说';
      if (roll < 0.25 + realmBonusRare) return '稀有';
      return '普通';
    } else {
      // 普通历练：较低概率，但境界加成明显
      if (roll < 0.01 + realmBonusImmortal * 0.5) return '仙品'; // 普通历练极低概率获得仙品
      if (roll < 0.05 + realmBonusLegend) return '传说';
      if (roll < 0.2 + realmBonusRare) return '稀有';
      return '普通';
    }
  };

  // 最大尝试次数，避免无限循环
  const maxAttempts = numItems * 10;
  let attempts = 0;

  while (lootItems.length < numItems && attempts < maxAttempts) {
    attempts++;
    const targetRarity = getRarityChance();

    const typeWeights = [
      { type: 'herbs', weight: 25, name: '草药', pool: LOOT_ITEMS.herbs },
      { type: 'pills', weight: 25, name: '丹药', pool: LOOT_ITEMS.pills },
      { type: 'materials', weight: 20, name: '材料', pool: LOOT_ITEMS.materials }, // 提高材料掉落概率：12 -> 20
      { type: 'weapons', weight: 6, name: '武器', pool: LOOT_ITEMS.weapons },
      { type: 'armors', weight: 8, name: '护甲', pool: LOOT_ITEMS.armors },
      { type: 'accessories', weight: 5, name: '首饰', pool: LOOT_ITEMS.accessories },
      { type: 'rings', weight: 5, name: '戒指', pool: LOOT_ITEMS.rings },
      { type: 'artifacts', weight: 7, name: '法宝', pool: LOOT_ITEMS.artifacts },
      { type: 'stones', weight: 20, name: '装备合成石', pool: LOOT_ITEMS.stones },
      { type: 'recipe', weight: 8, name: '丹方', pool: LOOT_ITEMS.recipes },
    ];

    // 如果上一个物品是装备类，轻微降低装备类权重
    if (selectedTypes.length > 0 && !['草药', '丹药', '材料'].includes(selectedTypes[selectedTypes.length - 1])) {
      typeWeights.forEach(w => {
        if (['weapons', 'armors', 'accessories', 'rings', 'artifacts'].includes(w.type)) {
          w.weight *= 0.85;
        }
      });
    }

    const totalWeight = typeWeights.reduce((sum, w) => sum + w.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedType = typeWeights[0];
    for (const type of typeWeights) {
      randomWeight -= type.weight;
      if (randomWeight <= 0) {
        selectedType = type;
        break;
      }
    }

    const itemType = selectedType.name;
    let itemPool: any[] = [];

    if (selectedType.type === 'recipe') {
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const targetIndex = RARITY_ORDER.indexOf(targetRarity);
        const recipeIndex = RARITY_ORDER.indexOf(recipe.result.rarity);
        const recipeKey = `${recipe.name}丹方-${recipe.result.rarity}`;
        return recipeIndex <= targetIndex && !selectedItems.has(recipeKey);
      });

      if (availableRecipes.length > 0) {
        const selectedRecipe = pickOne(availableRecipes);
        const recipeKey = `${selectedRecipe.name}丹方-${selectedRecipe.result.rarity}`;
        selectedItems.add(recipeKey);
        selectedTypes.push(itemType);
        lootItems.push({
          name: `${selectedRecipe.name}丹方`,
          type: '丹方',
          description: `记载了【${selectedRecipe.name}】炼制方法的古老丹方。使用后可学会炼制此丹药。`,
          rarity: selectedRecipe.result.rarity,
          isEquippable: false,
          recipeName: selectedRecipe.name,
        } as any);
      }
      continue;
    }

    if (selectedType.type === 'armors') {
      const armorSlots = [EquipmentSlot.Head, EquipmentSlot.Shoulder, EquipmentSlot.Chest, EquipmentSlot.Gloves, EquipmentSlot.Legs, EquipmentSlot.Boots];
      const selectedSlot = pickOne(armorSlots);
      itemPool = (selectedType.pool as any).filter((item: any) => item.equipmentSlot === selectedSlot);
      if (itemPool.length === 0) itemPool = selectedType.pool as any;
    } else {
      itemPool = selectedType.pool as any;
    }

    // 从对应稀有度的物品中随机选择，排除已选择的
    let availableItems = itemPool.filter((item: any) => {
      const itemKey = item.slot !== undefined ? `${item.name}-${item.rarity}-${item.slot}` : `${item.name}-${item.rarity}`;
      return item.rarity === targetRarity && !selectedItems.has(itemKey);
    });

    // 如果没有可用物品，尝试降级选择
    if (availableItems.length === 0) {
      availableItems = itemPool.filter((item: any) => {
        const itemKey = item.slot !== undefined ? `${item.name}-${item.rarity}-${item.slot}` : `${item.name}-${item.rarity}`;
        return RARITY_ORDER.indexOf(item.rarity) <= RARITY_ORDER.indexOf(targetRarity) && !selectedItems.has(itemKey);
      });
    }

    if (availableItems.length > 0) {
      const selected = pickOne(availableItems);
      const itemKey = selected.slot !== undefined ? `${selected.name}-${selected.rarity}-${selected.slot}` : `${selected.name}-${selected.rarity}`;
      selectedItems.add(itemKey);
      selectedTypes.push(itemType);

      let reviveChances: number | undefined = undefined;
      if ((selected.rarity === '传说' || selected.rarity === '仙品') && (itemType === '武器' || itemType === '法宝')) {
        const hasRevive = selected.rarity === '传说' ? Math.random() < 0.06 : Math.random() < 0.12;
        if (hasRevive) reviveChances = Math.floor(Math.random() * 3) + 1;
      }

      lootItems.push({
        name: selected.name,
        type: itemType,
        description: `${selected.name}，从敌人身上搜刮获得。`,
        rarity: selected.rarity,
        isEquippable: selected.slot !== undefined,
        equipmentSlot: selected.slot as string | undefined,
        effect: selected.effect,
        permanentEffect: selected.permanentEffect,
        reviveChances: reviveChances,
      } as any);
    }
  }

  return lootItems;
};

/**
 * 统一的暴击率计算（快速战斗与回合制共用，保证两条路径公式一致）：
 * 暴击率 = 基础10% + 速度占比加成（攻击方速度 / 双方速度之和，最高贡献10%）+ 额外加成（领域、Buff等）
 * 结果限制在 [0, 35%] 区间内（原注释中的"上限20%"为漂移描述，实际一直使用35%上限）
 */
export const computeCritChance = (attackerSpeed: number, targetSpeed: number, extraChance: number = 0): number => {
  const speedSum = Math.max(1, attackerSpeed + targetSpeed); // 至少为1，避免除零
  const speedBonus = (attackerSpeed / speedSum) * 0.10;
  return Math.min(0.35, Math.max(0, 0.10 + speedBonus + extraChance));
};

/**
 * 统一的速度差闪避率（快速战斗与回合制共用）：
 * 目标每比攻击方快1点速度提供0.05%闪避，上限15%
 */
export const computeSpeedDodge = (attackerSpeed: number, targetSpeed: number): number => {
  const speedDiff = Math.max(0, targetSpeed - attackerSpeed);
  return Math.min(0.15, speedDiff * 0.0005);
};

export const calcDamage = (attack: number, defense: number) => {
  // 确保输入是有效数字，防止NaN
  const validAttack = Number(attack) || 0;
  const validDefense = Number(defense) || 0;

  // 优化后的伤害计算：使用双曲线公式，确保防御收益递减但不会完全无效
  // 公式: damage = attack * (1 - defense / (defense + attack * k))
  // 这个公式的特点：
  // 1. 防御力越高，减伤效果越明显，但不会完全无效
  // 2. 当防御=0时，伤害=攻击力
  // 3. 当防御=攻击时，伤害约为攻击力的33%（k=0.5时）
  // 4. 当防御远大于攻击时，伤害会趋近于0，但不会完全为0
  const k = 0.8; // 增加 k 值，使防御力的减伤曲线更平滑，避免低防御时减伤过高
  const denominator = validDefense + validAttack * k;

  // 避免除零
  if (denominator <= 0) {
    return Math.max(1, Math.round(validAttack * (0.9 + Math.random() * 0.2)));
  }

  // 计算基础伤害
  const baseDamage = validAttack * (1 - validDefense / denominator);

  // 优化：提高最小伤害到攻击力的 5%，确保高防御时仍能造成一定伤害，但不会过高
  const minDamage = validAttack > 0 ? Math.max(1, Math.floor(validAttack * 0.05)) : 0;

  // 随机波动范围（伤害在一定范围内浮动）
  const baseRandomRange = 0.2; // 基础±10%波动（即0.9~1.1倍）
  const randomFactor = 0.9 + Math.random() * baseRandomRange; // 0.9~1.1倍
  return Math.round(Math.max(minDamage, baseDamage * randomFactor));
};

/**
 * 计算修为和灵石奖励
 */
export function getExpAndStoneRewards(
  player: PlayerStats,
  adventureType: AdventureType,
  difficulty: number,
  rewardMultiplier: number,
  enemyStrengthMultiplier: number = 1.0,
  difficultyMode: DifficultyMode = 'normal'
): { exp: number, stones: number } {
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // 统一使用较为稳健的倍数，防止数值膨胀
  const realmBaseMultipliers = [1, 1.25, 1.75, 2.5, 3.5, 5.0, 7.0];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // 综合强度倍数：敌人越强，奖励越多
  const strengthRewardMultiplier = 0.8 + enemyStrengthMultiplier * 0.4;
  const balanceReward =
    getDifficultyBalance(difficultyMode).reward *
    getAdventureBalance(adventureType).reward;
  const totalMultiplier = difficulty * rewardMultiplier * strengthRewardMultiplier * balanceReward;

  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.15;
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * totalMultiplier);

  const baseStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(10, Math.round(baseStones * totalMultiplier));

  return { exp: rewardExp, stones: rewardStones };
}

/**
 * 计算战斗奖励
 */
export const calculateBattleRewards = (
  battleState: BattleState,
  player: PlayerStats,
  adventureType?: AdventureType,
  riskLevel?: '低' | '中' | '高' | '极度危险',
  difficultyMode: DifficultyMode = 'normal'
): {
  expChange: number;
  spiritChange: number;
  items?: AdventureResult['itemObtained'][];
} => {
  const victory = battleState.enemy.hp <= 0;
  const actualAdventureType = adventureType || battleState.adventureType;
  const actualRiskLevel = riskLevel || battleState.riskLevel;
  const difficulty = getBattleDifficulty(actualAdventureType, actualRiskLevel, difficultyMode);

  // 根据敌人强度计算奖励倍数（敌人越强，奖励越多）
  const enemyStrength = battleState.enemyStrengthMultiplier || 1.0;

  const riskRewardMultiplier =
    actualAdventureType === 'secret_realm' ? getRiskRewardMultiplier(actualRiskLevel) : 1.0;

  const { exp: rewardExp, stones: rewardStones } = getExpAndStoneRewards(

    player,
    actualAdventureType,
    difficulty,
    riskRewardMultiplier,
    enemyStrength,
    difficultyMode
  );

  // 宗门挑战特殊奖励（只有战胜宗主才给特殊奖励）
  if (actualAdventureType === 'sect_challenge') {
    // 判断是否是宗主战斗：
    // 1. 追杀战斗且 huntLevel >= 3（战胜宗主）
    // 2. 正常挑战且是长老挑战宗主
    const isHuntMasterBattle = player.sectId === null &&
      player.sectHuntSectId &&
      player.sectHuntLevel !== undefined &&
      player.sectHuntLevel >= 3;
    const isNormalMasterBattle = player.sectId !== null &&
      player.sectRank === SectRank.Elder;
    const isMasterBattle = isHuntMasterBattle || isNormalMasterBattle;

    if (victory && isMasterBattle) {
      // 战胜宗主，给予特殊奖励
      return {
        expChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.exp,
        spiritChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.spiritStones,
        items: [
          {
            name: '宗主信物',
            type: ItemType.Material,
            rarity: '仙品',
            description: '宗门之主的象征，持此信物可号令宗门上下。'
          },
          {
            name: '宗门宝库钥匙',
            type: ItemType.Material,
            rarity: '仙品',
            description: '用于开启宗门宝库的钥匙，藏有历代宗主的积累。'
          }
        ]
      };
    } else if (!victory && isMasterBattle) {
      // 挑战宗主失败，根据常量扣除修为
      return {
        expChange: -SECT_MASTER_CHALLENGE_REQUIREMENTS.defeatPenalty.expLoss,
        spiritChange: 0,
      };
    }
    // 如果不是宗主战斗，继续使用普通奖励计算逻辑
  }

  // 天地之魄挑战特殊奖励
  if (actualAdventureType === 'dao_combining_challenge' && victory) {
    const bossId = battleState.bossId;
    if (bossId && HEAVEN_EARTH_SOUL_BOSSES[bossId]) {
      const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];
      // 查找该BOSS对应的功法
      const soulArt = CULTIVATION_ARTS.find(art => art.isHeavenEarthSoulArt && art.bossId === bossId);

      const rewardsItems: AdventureResult['itemObtained'][] = [];

      if (soulArt) {
        rewardsItems.push({
          name: soulArt.name,
          type: '进阶物品',
          description: soulArt.description,
          rarity: '仙品',
          advancedItemType: 'soulArt',
          advancedItemId: soulArt.id
        });
      }

      // 如果BOSS定义中有物品奖励
      if (boss.rewards.items && boss.rewards.items.length > 0) {
        // 这里可以根据需要添加更多BOSS特定的奖励物品
      }

      return {
        expChange: boss.rewards.exp,
        spiritChange: boss.rewards.spiritStones,
        items: rewardsItems.length > 0 ? rewardsItems : undefined
      };
    }
  }

  // 精英强敌：修为与灵石奖励 ×2（仅胜利结算时生效）
  const eliteRewardMultiplier = battleState.enemyIsElite ? ELITE_REWARD_MULTIPLIER : 1;

  const expChange = victory
    ? Math.round(rewardExp * eliteRewardMultiplier)
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? Math.round(rewardStones * eliteRewardMultiplier)
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成物品奖励
  let items: AdventureResult['itemObtained'][] | undefined = undefined;
  if (victory) {
    items = generateLoot(
      enemyStrength,
      actualAdventureType,
      player.realm,
      actualRiskLevel
    );
  }

  return { expChange, spiritChange, items };
};

/**
 * 统一处理灵宠行动逻辑（包括技能和普通攻击）
 */
export function handlePetAction(
  activePet: Pet,
  player: PlayerStats | BattleUnit,
  enemy: { hp: number; maxHp: number; defense: number; name: string; title?: string },
  petSkillCooldowns: Record<string, number>,
  randomId: () => string,
  calcDamage: (atk: number, def: number) => number,
  getPlayerTotalStats?: (p: PlayerStats) => any
): {
  action: BattleAction | BattleRoundLog;
  updatedEnemyHp: number;
  updatedPlayerHp: number;
  updatedCooldowns: Record<string, number>;
} {
  const petLevel = Number(activePet.level) || 0;
  const petAffection = Number(activePet.affection) || 0;
  const evolutionStage = Number(activePet.evolutionStage) || 0;
  const evolutionMultiplier = 1.0 + evolutionStage * 0.75;
  const affectionBonusFactor = 1 + petAffection / 140;
  const ownerAttack = Number(player.attack) || 0;
  const capPetDamage = (damage: number, hpRatio: number, attackRatio: number) =>
    Math.min(damage, Math.max(1, Math.floor(Math.max(enemy.maxHp * hpRatio, ownerAttack * attackRatio))));

  // 决定灵宠行动：根据亲密度和等级动态调整技能释放概率
  const baseProbability = 0.42;
  const affectionBonus = (petAffection / 100) * 0.25;
  const levelBonus = (petLevel / 100) * 0.18;
  const stageBonus = evolutionStage * 0.08;
  const skillProbability = Math.min(0.85, baseProbability + affectionBonus + levelBonus + stageBonus);
  const useSkill = Math.random() < skillProbability;

  let usedSkill: PetSkill | null = null;
  if (useSkill && activePet.skills.length > 0) {
    const availableSkills = activePet.skills.filter(
      (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
    );
    if (availableSkills.length > 0) {
      usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }
  }

  let petDamage = 0;
  let petHeal = 0;
  const petBuffs: Buff[] = [];
  let description = "";
  let skillId: string | undefined = undefined;

  const isPlayerUnit = "maxHp" in player && "buffs" in player;
  const playerMaxHp = isPlayerUnit ? (player as BattleUnit).maxHp : (getPlayerTotalStats ? getPlayerTotalStats(player as PlayerStats).maxHp : (player as any).hp);
  let playerHp = player.hp;
  let enemyHp = enemy.hp;

  if (usedSkill) {
    skillId = usedSkill.id;
    // 释放技能
    if (usedSkill.effect.damage || usedSkill.effect.damageMultiplier) {
      const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
      const damageMultiplier = Number(usedSkill.effect.damageMultiplier) || 0;
      const attackMultiplier = 1.0 + (petLevel / 40);
      const baseAttack = Number(activePet.stats?.attack) || 0;
      const ownerAssistDamage = ownerAttack * (0.08 + evolutionStage * 0.04);

      let skillDamage = baseSkillDamage;
      if (damageMultiplier > 0) {
        skillDamage += (baseAttack + ownerAssistDamage) * damageMultiplier * evolutionMultiplier * attackMultiplier;
      } else {
        skillDamage += (baseAttack + ownerAssistDamage) * evolutionMultiplier * attackMultiplier;
      }

      const lBonus = Math.floor(petLevel * 10);
      const aBonus = Math.floor(petAffection * 2.5);
      const finalSkillDamage = (skillDamage + lBonus + aBonus) * affectionBonusFactor;
      const minPetDamage = Math.floor((baseAttack + ownerAssistDamage) * (0.35 + evolutionStage * 0.18) + petLevel * 6 + petAffection);
      petDamage = capPetDamage(Math.max(minPetDamage, calcDamage(finalSkillDamage, enemy.defense)), 0.28, 1.2);
      enemyHp = Math.max(0, enemyHp - petDamage);
    }

    if (usedSkill.effect.heal || usedSkill.effect.healPercent) {
      const baseHeal = Number(usedSkill.effect.heal) || 0;
      const healPercent = Number(usedSkill.effect.healPercent) || 0;
      let finalHeal = baseHeal * (1 + petLevel * 0.05);
      if (healPercent > 0) {
        finalHeal += playerMaxHp * healPercent;
      }
      petHeal = Math.floor(finalHeal * affectionBonusFactor);
      playerHp = Math.min(playerMaxHp, playerHp + petHeal);
    }

    if (usedSkill.effect.buff) {
      const b = usedSkill.effect.buff;
      const duration = 3 + Math.floor(petLevel / 20);
      const buffSource = `pet_${activePet.id}`;

      if (b.attack) petBuffs.push({ id: randomId(), name: `${activePet.name}的激励`, type: 'attack', value: Math.floor(b.attack * affectionBonusFactor), duration, source: buffSource });
      if (b.attackPercent) petBuffs.push({ id: randomId(), name: `${activePet.name}的狂暴`, type: 'attack', value: Math.floor(player.attack * b.attackPercent * affectionBonusFactor), duration, source: buffSource });
      if (b.defense) petBuffs.push({ id: randomId(), name: `${activePet.name}的守护`, type: 'defense', value: Math.floor(b.defense * affectionBonusFactor), duration, source: buffSource });
      if (b.defensePercent) petBuffs.push({ id: randomId(), name: `${activePet.name}的铁壁`, type: 'defense', value: Math.floor(player.defense * b.defensePercent * affectionBonusFactor), duration, source: buffSource });
      if (b.critChance) petBuffs.push({ id: randomId(), name: `${activePet.name}的精准`, type: 'crit', value: b.critChance * affectionBonusFactor, duration, source: buffSource });
      if (b.dodge) petBuffs.push({ id: randomId(), name: `${activePet.name}的灵动`, type: 'custom', value: 0, duration, source: buffSource, dodge: b.dodge * affectionBonusFactor });

      // 如果是 BattleUnit 类型，需要直接应用数值加成
      if (isPlayerUnit) {
        petBuffs.forEach(buff => {
          if (buff.type === 'attack') (player as BattleUnit).attack += buff.value;
          if (buff.type === 'defense') (player as BattleUnit).defense += buff.value;
        });
      }
    }

    const updatedCooldowns = { ...petSkillCooldowns };
    if (usedSkill.cooldown) {
      updatedCooldowns[usedSkill.id] = usedSkill.cooldown;
    }

    description = `【${activePet.name}】释放了【${usedSkill.name}】！`;
    if (petDamage > 0) description += `对敌人造成 ${petDamage} 点伤害。`;
    if (petHeal > 0) description += `为你恢复了 ${petHeal} 点气血。`;
    if (petBuffs.length > 0) {
      const buffNames = petBuffs.map(b => b.name.split('的')[1]).join('、');
      description += `你获得了${buffNames}状态。`;
    }

    return {
      action: {
        id: randomId(),
        round: (player as any).round || 1,
        turn: 'player',
        attacker: 'player',
        actor: 'player',
        actionType: 'skill',
        skillId,
        damage: petDamage,
        crit: false,
        description,
        playerHpAfter: playerHp,
        enemyHpAfter: enemyHp,
        result: { damage: petDamage, heal: petHeal, buffs: petBuffs }
      } as any,
      updatedEnemyHp: enemyHp,
      updatedPlayerHp: playerHp,
      updatedCooldowns
    };
  } else {
    // 普通攻击
    const baseAttack = Number(activePet.stats?.attack) || 0;
    const attackMultiplier = 1.0 + (petLevel / 45);
    const ownerAssistDamage = ownerAttack * (0.06 + evolutionStage * 0.03);
    const levelBonus = Math.floor(petLevel * 12);
    const affectionBonus = Math.floor(petAffection * 2);
    const petAttackDamage = Math.floor((baseAttack + ownerAssistDamage) * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
    const minPetDamage = Math.floor((baseAttack + ownerAssistDamage) * (0.25 + evolutionStage * 0.15) + petLevel * 5 + petAffection * 0.8);
    petDamage = capPetDamage(Math.max(minPetDamage, calcDamage(petAttackDamage, enemy.defense)), 0.18, 0.8);
    enemyHp = Math.max(0, enemyHp - petDamage);

    return {
      action: {
        id: randomId(),
        round: (player as any).round || 1,
        turn: 'player',
        attacker: 'player',
        actor: 'player',
        actionType: 'attack',
        damage: petDamage,
        crit: false,
        description: `【${activePet.name}】紧随其后发动攻击，造成 ${petDamage} 点伤害。`,
        playerHpAfter: playerHp,
        enemyHpAfter: enemyHp,
        result: { damage: petDamage }
      } as any,
      updatedEnemyHp: enemyHp,
      updatedPlayerHp: playerHp,
      updatedCooldowns: petSkillCooldowns
    };
  }
}

/**
 * 计算五行克制倍率
 */
export function getElementalMultiplier(attackerType: string, defenderType: string): number {
  const relations: Record<string, string> = {
    metal: 'wood',  // 金克木
    wood: 'earth',  // 木克土
    earth: 'water', // 土克水
    water: 'fire',  // 水克火
    fire: 'metal'   // 火克金
  };

  if (relations[attackerType] === defenderType) return 1.3; // 克制增加 30% 伤害
  if (relations[defenderType] === attackerType) return 0.7; // 被克制减少 30% 伤害
  return 1.0;
}
