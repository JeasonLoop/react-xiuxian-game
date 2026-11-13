/**
 * 装备洗炼工具函数
 */
import { Item, ItemRarity, PlayerStats, ItemType } from '../types';
import {
  REFORGE_AFFIX_DEFINITIONS,
  REFORGE_AFFIX_TYPES,
  REFORGE_RARITY_CONFIGS,
  MECHANIC_AFFIX_ROLL_WEIGHT,
  RARITY_VALUE_FACTORS,
  getMechanicAffixPool,
  getMechanicAffixById,
  getReforgeCost,
  EquipmentTriggers,
  MechanicAffix,
  ReforgeAffixType,
  NumericAffixType,
} from '../constants/reforge';

/** 洗炼词条统一存储结构（数值词条与机制词条共用） */
export interface ReforgeAffixResult {
  type: ReforgeAffixType;
  name: string;
  value: number;
}

/** 判断物品是否为可洗炼的法宝装备 */
export function isReforgeableEquipment(item: Item): boolean {
  if (!item) return false;
  if (item.isEquippable) return true;
  const eqTypes = [
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Accessory,
    ItemType.Ring,
    ItemType.Artifact,
  ];
  return eqTypes.includes(item.type);
}

/** 统计背包中太虚洗炼石总数 */
export function getReforgeStoneCount(player: PlayerStats): number {
  return player.inventory.reduce((count, item) => {
    if (item.name === '太虚洗炼石' || item.id === 'taixu-reforge-stone') {
      return count + (item.quantity || 1);
    }
    return count;
  }, 0);
}

/**
 * 按装备档位随机机制词条的数值：
 * 仙品可洗出 [valueMin, valueMax] 全区间，低档按 RARITY_VALUE_FACTORS 压缩上限。
 */
function rollMechanicAffixValue(def: MechanicAffix, rarity: ItemRarity): number {
  const factor = RARITY_VALUE_FACTORS[rarity] ?? 1;
  const min = def.valueMin;
  const max = min + (def.valueMax - min) * factor;
  const raw = min + Math.random() * (max - min);
  if (def.valueUnit === 'flat') {
    // 固定点数词条（如受击回灵）取整，且不低于原始下限
    return Math.max(min, Math.round(raw));
  }
  return Math.round(raw * 1000) / 1000;
}

/**
 * 为指定稀有度生成洗炼词条列表（数值词条 + 机制词条混池）
 * - 机制词条按 minRarity 过滤：低档洗不出部分机制词
 * - 每个词条位置约 40% 概率抽机制词条，其余抽数值词条
 * - 某类池耗尽时自动回落到另一类，保证条数足额
 * @param count 可指定条数；不传则按稀有度配置随机
 * @param excludedTypes 需要从类型池中排除的词条类型（通常为已锁定类型）
 */
export function rollReforgeAffixes(
  rarity: ItemRarity = '普通',
  count?: number,
  excludedTypes?: Set<ReforgeAffixType>
): ReforgeAffixResult[] {
  const config = REFORGE_RARITY_CONFIGS[rarity] || REFORGE_RARITY_CONFIGS['普通'];
  const affixCount =
    count ??
    (Math.floor(Math.random() * (config.maxAffixes - config.minAffixes + 1)) +
      config.minAffixes);

  // 数值词条池与机制词条池分别维护，均排除已锁定/已选中的类型
  const numericPool: NumericAffixType[] = REFORGE_AFFIX_TYPES.filter(
    (t) => !excludedTypes || !excludedTypes.has(t)
  );
  const mechanicPool = getMechanicAffixPool(rarity).filter(
    (a) => !excludedTypes || !excludedTypes.has(a.id)
  );

  const results: ReforgeAffixResult[] = [];
  for (let i = 0; i < affixCount; i++) {
    const canRollMechanic = mechanicPool.length > 0;
    const canRollNumeric = numericPool.length > 0;
    if (!canRollMechanic && !canRollNumeric) break;

    // 机制词条约 40% 概率被抽中（MECHANIC_AFFIX_ROLL_WEIGHT）
    let useMechanic = false;
    if (canRollMechanic && canRollNumeric) {
      useMechanic = Math.random() < MECHANIC_AFFIX_ROLL_WEIGHT;
    } else {
      useMechanic = canRollMechanic;
    }

    if (useMechanic) {
      const idx = Math.floor(Math.random() * mechanicPool.length);
      const def = mechanicPool[idx];
      mechanicPool.splice(idx, 1);
      results.push({
        type: def.id,
        name: def.name,
        value: rollMechanicAffixValue(def, rarity),
      });
    } else {
      const idx = Math.floor(Math.random() * numericPool.length);
      const type = numericPool[idx];
      numericPool.splice(idx, 1);
      const def = REFORGE_AFFIX_DEFINITIONS[type];
      // 在 [minValue, maxValue] 区间内随机生成，保留3位小数
      const rawVal = config.minValue + Math.random() * (config.maxValue - config.minValue);
      const value = Math.round(rawVal * 1000) / 1000;
      results.push({
        type,
        name: def.name,
        value,
      });
    }
  }

  return results;
}

/**
 * 洗炼候选生成：校验→扣费→保留锁定词条→重掷其余词条，结果存入 pendingReforge 待玩家取舍。
 * 费用与次数在掷出时即消耗，舍弃不退费，防止无限免费重掷。
 */
export function rollReforgeCandidate(
  player: PlayerStats,
  itemId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: PlayerStats;
  candidate?: ReforgeAffixResult[];
} {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return {
      success: false,
      message: '法宝未在背包中找到！',
      updatedPlayer: player,
    };
  }

  const targetItem = player.inventory[itemIndex];
  if (!isReforgeableEquipment(targetItem)) {
    return {
      success: false,
      message: '该物品非道兵法宝，无法进行淬火洗炼！',
      updatedPlayer: player,
    };
  }

  if (targetItem.pendingReforge) {
    return {
      success: false,
      message: '仙炉中尚有未取舍的洗炼候选，请先采纳或舍弃！',
      updatedPlayer: player,
    };
  }

  const currentAffixes = targetItem.reforgeAffixes || [];
  const locks = targetItem.reforgeLocks || [];
  const lockedAffixes = currentAffixes.filter((_, idx) => locks[idx]);
  const lockedTypes = new Set(lockedAffixes.map((a) => a.type));
  const lockedCount = lockedAffixes.length;

  const currentReforgeCount = targetItem.reforgeCount || 0;
  const { stones: costStones, spiritStones: costSpiritStones } = getReforgeCost(
    currentReforgeCount,
    lockedCount
  );

  const availableStones = getReforgeStoneCount(player);
  if (availableStones < costStones) {
    return {
      success: false,
      message: `太虚洗炼石不足！本次洗炼需 ${costStones} 颗，当前仅有 ${availableStones} 颗（可通过通天塔与灵兽远征获取）。`,
      updatedPlayer: player,
    };
  }

  if (player.spiritStones < costSpiritStones) {
    return {
      success: false,
      message: `灵石不足！本次洗炼需 ${costSpiritStones.toLocaleString()} 灵石。`,
      updatedPlayer: player,
    };
  }

  // 扣除灵石与洗炼石
  let stonesToDeduct = costStones;
  const newInventory = player.inventory
    .map((item) => {
      if (
        (item.name === '太虚洗炼石' || item.id === 'taixu-reforge-stone') &&
        stonesToDeduct > 0
      ) {
        const qty = item.quantity || 1;
        if (qty <= stonesToDeduct) {
          stonesToDeduct -= qty;
          return null; // 全部扣完
        } else {
          const rem = qty - stonesToDeduct;
          stonesToDeduct = 0;
          return { ...item, quantity: rem };
        }
      }
      return item;
    })
    .filter((item): item is Item => item !== null);

  // 目标条数不降于当前条数，保证锁定多条时不会越洗越少
  const config =
    REFORGE_RARITY_CONFIGS[targetItem.rarity || '普通'] ||
    REFORGE_RARITY_CONFIGS['普通'];
  const rolledCount =
    Math.floor(Math.random() * (config.maxAffixes - config.minAffixes + 1)) +
    config.minAffixes;
  const targetCount = Math.max(currentAffixes.length, rolledCount, lockedCount);

  // 候选 = 锁定词条原样保留 + 未锁位置重新掷点（类型池排除已锁类型）
  const freeCount = Math.max(0, targetCount - lockedCount);
  const rolledAffixes = rollReforgeAffixes(
    targetItem.rarity || '普通',
    freeCount,
    lockedTypes
  );
  const candidate = [...lockedAffixes, ...rolledAffixes];

  // 更新法宝：洗炼次数 +1，候选存入 pendingReforge
  const updatedItem: Item = {
    ...targetItem,
    reforgeCount: currentReforgeCount + 1,
    pendingReforge: candidate,
  };

  // 替换背包中的装备项
  const targetNewIndex = newInventory.findIndex((i) => i.id === itemId);
  if (targetNewIndex !== -1) {
    newInventory[targetNewIndex] = updatedItem;
  } else {
    newInventory.push(updatedItem);
  }

  const updatedPlayer: PlayerStats = {
    ...player,
    spiritStones: player.spiritStones - costSpiritStones,
    inventory: newInventory,
  };

  return {
    success: true,
    message: `【万宝淬炼】仙炉神火烈烈！【${targetItem.name}】重铸出新的道蕴候选，请取舍！`,
    updatedPlayer,
    candidate,
  };
}

/**
 * 采纳洗炼候选：将 pendingReforge 写入 reforgeAffixes
 */
export function applyReforgeCandidate(
  player: PlayerStats,
  itemId: string
): { success: boolean; message: string; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1 || !player.inventory[itemIndex].pendingReforge) {
    return { success: false, message: '无待采纳的洗炼候选！', updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  const newInventory = [...player.inventory];
  newInventory[itemIndex] = {
    ...targetItem,
    reforgeAffixes: targetItem.pendingReforge,
    pendingReforge: undefined,
  };

  return {
    success: true,
    message: `【万宝淬炼】天地道蕴已铭刻！【${targetItem.name}】新词条生效。`,
    updatedPlayer: { ...player, inventory: newInventory },
  };
}

/**
 * 舍弃洗炼候选：清空 pendingReforge，费用不退
 */
export function discardReforgeCandidate(
  player: PlayerStats,
  itemId: string
): { success: boolean; message: string; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1 || !player.inventory[itemIndex].pendingReforge) {
    return { success: false, message: '无待舍弃的洗炼候选！', updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  const newInventory = [...player.inventory];
  newInventory[itemIndex] = {
    ...targetItem,
    pendingReforge: undefined,
  };

  return {
    success: true,
    message: `【万宝淬炼】候选道蕴已散于天地，灵石与洗炼石不予退回。`,
    updatedPlayer: { ...player, inventory: newInventory },
  };
}

/**
 * 切换指定词条的锁定状态（存在 pendingReforge 时禁止操作）
 */
export function toggleReforgeLock(
  player: PlayerStats,
  itemId: string,
  index: number
): { success: boolean; updatedPlayer: PlayerStats } {
  const itemIndex = player.inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { success: false, updatedPlayer: player };
  }

  const targetItem = player.inventory[itemIndex];
  if (targetItem.pendingReforge) {
    return { success: false, updatedPlayer: player };
  }

  const affixes = targetItem.reforgeAffixes || [];
  if (index < 0 || index >= affixes.length) {
    return { success: false, updatedPlayer: player };
  }

  const locks = [...(targetItem.reforgeLocks || [])];
  while (locks.length < affixes.length) locks.push(false);
  locks[index] = !locks[index];

  // 至少保留一个未锁定位置，避免仙炉无法重掷任何词条
  const lockedCount = locks.filter(Boolean).length;
  if (lockedCount >= affixes.length && affixes.length > 0) {
    return { success: false, updatedPlayer: player };
  }

  const newInventory = [...player.inventory];
  newInventory[itemIndex] = { ...targetItem, reforgeLocks: locks };

  return { success: true, updatedPlayer: { ...player, inventory: newInventory } };
}

/* ============================================================
 * 机制词条聚合：已穿戴装备 → EquipmentTriggers
 * 同类词条默认取最优（数值最大，避免叠爆）；
 * 仅回春（regen）与吸血强化（lifeLeechBoost）同类叠加。
 * 数值词条（攻防血百分比等）仍由 statUtils 聚合，此处不处理。
 * ============================================================ */

/** 取最优辅助：undefined 视为无值，否则取最大 */
function maxOf(cur: number | undefined, val: number): number {
  return cur === undefined ? val : Math.max(cur, val);
}

/**
 * 聚合玩家所有已穿戴装备的机制词条
 * 遍历 equippedItems 对应背包物品的 reforgeAffixes，
 * 将洗炼随机值（value）与词条固定参数（params）合并为按触发类型分组的汇总对象。
 */
export function getPlayerEquipmentMechanicAffixes(
  player: PlayerStats
): EquipmentTriggers {
  const triggers: EquipmentTriggers = {
    passive: {},
    onAttack: {},
    conditional: {},
    onEvent: {},
  };

  const equippedItemIds = Object.values(player.equippedItems || {});
  for (const itemId of equippedItemIds) {
    if (!itemId) continue;
    const item = player.inventory.find((i) => i.id === itemId);
    if (!item?.reforgeAffixes) continue;

    for (const affix of item.reforgeAffixes) {
      const def = getMechanicAffixById(affix.type);
      if (!def) continue; // 数值词条不在本函数处理范围
      const v = affix.value;
      const p = def.params;

      switch (def.id) {
        // ---------- 常驻被动 ----------
        case 'thorns':
          triggers.passive.thorns = maxOf(triggers.passive.thorns, v);
          break;
        case 'shield':
          triggers.passive.shield = maxOf(triggers.passive.shield, v);
          break;
        case 'regen':
          // 回春可叠加
          triggers.passive.regen = (triggers.passive.regen || 0) + v;
          break;
        case 'lifeLeechBoost':
          // 吸血强化可叠加
          triggers.passive.lifeLeechBoost =
            (triggers.passive.lifeLeechBoost || 0) + v;
          break;
        case 'swift':
          triggers.passive.swift = maxOf(triggers.passive.swift, v);
          break;
        case 'tenacity':
          triggers.passive.tenacity = maxOf(triggers.passive.tenacity, v);
          break;
        case 'spellGuard':
          triggers.passive.spellGuard = maxOf(triggers.passive.spellGuard, v);
          break;

        // ---------- 概率触发（value 为触发概率，效果数值取固定 params） ----------
        case 'combo':
          if (!triggers.onAttack.combo || v > triggers.onAttack.combo.chance) {
            triggers.onAttack.combo = { chance: v, value: p.value ?? 0.5 };
          }
          break;
        case 'burn':
          if (!triggers.onAttack.burn || v > triggers.onAttack.burn.chance) {
            triggers.onAttack.burn = {
              chance: v,
              value: p.value ?? 0.25,
              duration: p.duration ?? 3,
            };
          }
          break;
        case 'freeze':
          if (!triggers.onAttack.freeze || v > triggers.onAttack.freeze.chance) {
            triggers.onAttack.freeze = { chance: v, duration: p.duration ?? 1 };
          }
          break;
        case 'thunder':
          // 雷罚：value 为伤害倍率，概率取固定 params.chance
          if (!triggers.onAttack.thunder || v > triggers.onAttack.thunder.value) {
            triggers.onAttack.thunder = { chance: p.chance ?? 0.15, value: v };
          }
          break;
        case 'armorBreak':
          if (!triggers.onAttack.armorBreak || v > triggers.onAttack.armorBreak.chance) {
            triggers.onAttack.armorBreak = {
              chance: v,
              value: p.value ?? 0.20,
              duration: p.duration ?? 3,
            };
          }
          break;

        // ---------- 条件触发（value 为效果数值，阈值取固定 params.threshold） ----------
        case 'execute':
          if (!triggers.conditional.execute || v > triggers.conditional.execute.value) {
            triggers.conditional.execute = { threshold: p.threshold ?? 0.25, value: v };
          }
          break;
        case 'berserk':
          if (!triggers.conditional.berserk || v > triggers.conditional.berserk.value) {
            triggers.conditional.berserk = { threshold: p.threshold ?? 0.40, value: v };
          }
          break;
        case 'bulwark':
          if (!triggers.conditional.bulwark || v > triggers.conditional.bulwark.value) {
            triggers.conditional.bulwark = { threshold: p.threshold ?? 0.70, value: v };
          }
          break;
        case 'slayer':
          triggers.conditional.slayer = {
            value: maxOf(triggers.conditional.slayer?.value, v),
          };
          break;
        case 'critResist':
          triggers.conditional.critResist = {
            value: maxOf(triggers.conditional.critResist?.value, v),
          };
          break;

        // ---------- 击杀/受击触发 ----------
        case 'killHeal':
          triggers.onEvent.killHeal = {
            value: maxOf(triggers.onEvent.killHeal?.value, v),
          };
          break;
        case 'hitSpirit':
          triggers.onEvent.hitSpirit = {
            value: maxOf(triggers.onEvent.hitSpirit?.value, v),
          };
          break;
        case 'block':
          if (!triggers.onEvent.block || v > triggers.onEvent.block.chance) {
            triggers.onEvent.block = { chance: v, value: p.value ?? 0.5 };
          }
          break;
      }
    }
  }

  return triggers;
}

/** 别名：战斗接入侧惯用的调用名，语义与 getPlayerEquipmentMechanicAffixes 相同 */
export const getPlayerEquipmentMechanicTriggers = getPlayerEquipmentMechanicAffixes;
