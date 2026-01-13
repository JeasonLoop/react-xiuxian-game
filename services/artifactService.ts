import { Item, ItemRarity, ItemType, EquipmentSlot } from '../types';
import { RARITY_MULTIPLIERS } from '../constants/items';

/**
 * 炼器服务 - 处理装备合成与融合逻辑
 */
export const artifactService = {
  /**
   * 材料合成逻辑：4-8种材料合成新装备
   * @param materials 投入的材料列表 (4-8个)
   * @param customName 自定义名称
   * @param selectedSlot 可选的选定部位
   */
  craftFromMaterials(materials: Item[], customName: string, selectedSlot?: string): Item {
    if (materials.length < 4 || materials.length > 8) {
      throw new Error('炼器需投入4-8种材料');
    }

    // 1. 计算平均品质得分
    const rarityScores: Record<ItemRarity, number> = {
      '普通': 1,
      '稀有': 3,
      '传说': 8,
      '仙品': 20
    };

    let totalScore = 0;
    materials.forEach(m => {
      totalScore += rarityScores[m.rarity || '普通'];
    });

    const avgScore = totalScore / materials.length;

    // 2. 决定品质
    let resultRarity: ItemRarity = '普通';
    if (avgScore >= 15) resultRarity = '仙品';
    else if (avgScore >= 6) resultRarity = '传说';
    else if (avgScore >= 2.5) resultRarity = '稀有';

    // 3. 决定装备类型
    let randomSlot: EquipmentSlot;
    if (selectedSlot && Object.values(EquipmentSlot).includes(selectedSlot as EquipmentSlot)) {
      randomSlot = selectedSlot as EquipmentSlot;
    } else {
      const slots = [
        EquipmentSlot.Weapon,
        EquipmentSlot.Chest,
        EquipmentSlot.Head,
        EquipmentSlot.Boots,
        EquipmentSlot.Accessory1,
        EquipmentSlot.Artifact1
      ];
      randomSlot = slots[Math.floor(Math.random() * slots.length)];
    }

    // 4. 计算基础属性与特殊效果
    const multiplier = RARITY_MULTIPLIERS[resultRarity];
    const baseValue = 100 * multiplier * (1 + (materials.length - 4) * 0.1); // 材料越多，属性越强

    const effect: any = {};

    // 定义各部位可能出现的属性池
    const attrPools: Record<string, string[]> = {
      primary: ['attack', 'defense', 'hp'],
      secondary: ['spirit', 'physique', 'speed']
    };

    // 决定属性数量 (2-4个，受品级影响)
    const attrCount = resultRarity === '普通' ? 2 : (resultRarity === '稀有' ? 2 : (resultRarity === '传说' ? 3 : 4));
    const selectedAttrs: string[] = [];

    // 根据部位设定主属性
    if (randomSlot === EquipmentSlot.Weapon) {
      effect.attack = Math.floor(baseValue * 1.2);
      selectedAttrs.push('attack');
    } else if ([EquipmentSlot.Chest, EquipmentSlot.Head, EquipmentSlot.Boots].includes(randomSlot)) {
      effect.defense = Math.floor(baseValue * 0.8);
      effect.hp = Math.floor(baseValue * 5);
      selectedAttrs.push('defense', 'hp');
    } else {
      effect.spirit = Math.floor(baseValue * 0.5);
      selectedAttrs.push('spirit');
    }

    // 补齐剩余属性
    const allPossibleAttrs = [...attrPools.primary, ...attrPools.secondary];
    while (selectedAttrs.length < attrCount) {
      const remaining = allPossibleAttrs.filter(a => !selectedAttrs.includes(a));
      if (remaining.length === 0) break;
      const nextAttr = remaining[Math.floor(Math.random() * remaining.length)];

      // 计算数值：主属性外的属性通常较弱
      let val = 0;
      if (nextAttr === 'hp') val = Math.floor(baseValue * 3);
      else if (['attack', 'defense'].includes(nextAttr)) val = Math.floor(baseValue * 0.6);
      else val = Math.floor(baseValue * 0.4);

      effect[nextAttr] = val;
      selectedAttrs.push(nextAttr);
    }

    // 5. 小概率生成保命机会 (传说及以上概率更高)
    let reviveChances: number | undefined = undefined;
    const reviveRoll = Math.random();
    const reviveThreshold = resultRarity === '仙品' ? 0.2 : (resultRarity === '传说' ? 0.1 : 0.03);

    if (reviveRoll < reviveThreshold) {
      reviveChances = resultRarity === '仙品' ? 2 : 1;
    }

    // 6. 生成材料描述
    const materialNames = materials.map(m => m.name).join('、');

    return {
      id: `crafted-${Date.now()}`,
      name: customName || `造化·${resultRarity}${randomSlot}`,
      type: this.getItemTypeFromSlot(randomSlot),
      description: `由 ${materialNames} 炼制而成的${resultRarity}装备。`,
      quantity: 1,
      rarity: resultRarity,
      isEquippable: true,
      equipmentSlot: randomSlot,
      effect,
      reviveChances,
      level: 0
    };
  },

  /**
   * 装备融合逻辑：两件同类型装备 + 合成石
   */
  fuseEquipment(item1: Item, item2: Item, stone: Item, customName?: string): Item {
    // ==================== 数值检查 ====================
    if (!item1 || !item2 || !stone) {
      throw new Error('融合需要两件装备和一块合成石');
    }

    if (!item1.effect || typeof item1.effect !== 'object') {
      throw new Error(`${item1.name} 的属性数据无效，无法融合`);
    }

    if (!item2.effect || typeof item2.effect !== 'object') {
      throw new Error(`${item2.name} 的属性数据无效，无法融合`);
    }

    // 检查属性值是否有效（必须是数字且非负数）
    const validateEffect = (effect: any, itemName: string) => {
      for (const [key, value] of Object.entries(effect)) {
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
          throw new Error(`${itemName} 的属性 ${key} 数值无效（${value}），无法融合`);
        }
      }
    };

    validateEffect(item1.effect, item1.name);
    validateEffect(item2.effect, item2.name);

    // ==================== 类型检查 ====================
    const isSameType = item1.type === item2.type;
    const isSameSlot = item1.equipmentSlot === item2.equipmentSlot;

    // 戒指、法宝、首饰只要类型相同即可融合
    const canFuseByType = [ItemType.Ring, ItemType.Artifact, ItemType.Accessory].includes(item1.type);

    if (!isSameSlot && (!canFuseByType || !isSameType)) {
      throw new Error('只有相同部位或同类型的特殊装备（戒指/法宝/首饰）才能融合');
    }

    // ==================== 品质计算 ====================
    const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
    const r1 = rarityOrder.indexOf(item1.rarity || '普通');
    const r2 = rarityOrder.indexOf(item2.rarity || '普通');
    const resultRarity = rarityOrder[Math.max(r1, r2)];

    // ==================== 属性融合 ====================
    const allKeys = Array.from(new Set([
      ...Object.keys(item1.effect || {}),
      ...Object.keys(item2.effect || {})
    ]));

    const mergedEffect: any = {};
    allKeys.forEach(key => {
      const val1 = (item1.effect as any)[key] || 0;
      const val2 = (item2.effect as any)[key] || 0;

      // 统一计算：两个装备数值之和 * 0.8
      mergedEffect[key] = Math.floor((val1 + val2) * 0.8);
    });

    // 筛选属性：根据品级限制属性项数量 (仙品5项，其他4项)
    const maxAttrCount = resultRarity === '仙品' ? 5 : 4;
    const finalEffect: any = {};

    // 优先级排序：共有属性 > 攻击/防御/气血 > 其他
    const sortedKeys = allKeys.sort((a, b) => {
      const isACommon = (item1.effect as any)[a] && (item2.effect as any)[a];
      const isBCommon = (item1.effect as any)[b] && (item2.effect as any)[b];
      if (isACommon && !isBCommon) return -1;
      if (!isACommon && isBCommon) return 1;

      const priorityAttrs = ['attack', 'defense', 'hp'];
      const aPrio = priorityAttrs.indexOf(a);
      const bPrio = priorityAttrs.indexOf(b);
      if (aPrio !== -1 && bPrio === -1) return -1;
      if (aPrio === -1 && bPrio !== -1) return 1;

      return (mergedEffect[b] || 0) - (mergedEffect[a] || 0);
    });

    sortedKeys.slice(0, maxAttrCount).forEach(key => {
      finalEffect[key] = mergedEffect[key];
    });

    // 3. 融合特殊效果 (如保命机会)
    const revive1 = item1.reviveChances || 0;
    const revive2 = item2.reviveChances || 0;
    const newRevive = Math.min(3, revive1 + revive2);

    return {
      id: `fused-${Date.now()}`,
      name: customName || `${item1.name}·融合`,
      type: item1.type,
      description: `由 ${item1.name} 与 ${item2.name} 完美融合而成的神兵。`,
      quantity: 1,
      rarity: resultRarity,
      isEquippable: true,
      equipmentSlot: item1.equipmentSlot,
      effect: finalEffect,
      reviveChances: newRevive > 0 ? newRevive : undefined,
      level: Math.max(item1.level || 0, item2.level || 0)
    };
  },

  getItemTypeFromSlot(slot: EquipmentSlot): ItemType {
    if (slot === EquipmentSlot.Weapon) return ItemType.Weapon;
    if (slot === EquipmentSlot.Chest || slot === EquipmentSlot.Head || slot === EquipmentSlot.Boots || slot === EquipmentSlot.Legs || slot === EquipmentSlot.Gloves || slot === EquipmentSlot.Shoulder) return ItemType.Armor;
    if (slot === EquipmentSlot.Accessory1 || slot === EquipmentSlot.Accessory2) return ItemType.Accessory;
    if (slot === EquipmentSlot.Ring1 || slot === EquipmentSlot.Ring2 || slot === EquipmentSlot.Ring3 || slot === EquipmentSlot.Ring4) return ItemType.Ring;
    if (slot === EquipmentSlot.Artifact1 || slot === EquipmentSlot.Artifact2) return ItemType.Artifact;
    return ItemType.Material;
  }
};

