import { AdventureResult, AdventureType, PlayerStats, RealmType, ItemRarity, ItemType, EquipmentSlot } from '../types';
import { REALM_ORDER, RARITY_MULTIPLIERS, DISCOVERABLE_RECIPES } from '../constants';
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

// 搜刮奖励物品名称库
const LOOT_ITEMS = {
  // 草药类
  herbs: [
    { name: '止血草', type: ItemType.Herb, rarity: '普通' as ItemRarity, effect: { hp: 20 } },
    { name: '聚灵草', type: ItemType.Herb, rarity: '普通' as ItemRarity },
    { name: '回气草', type: ItemType.Herb, rarity: '普通' as ItemRarity, effect: { hp: 30 } },
    { name: '凝神花', type: ItemType.Herb, rarity: '稀有' as ItemRarity, effect: { hp: 50, spirit: 5 } },
    { name: '血参', type: ItemType.Herb, rarity: '稀有' as ItemRarity, effect: { hp: 80 } },
    { name: '千年灵芝', type: ItemType.Herb, rarity: '传说' as ItemRarity, effect: { hp: 150, maxHp: 20 } },
    { name: '万年仙草', type: ItemType.Herb, rarity: '仙品' as ItemRarity, effect: { hp: 300, maxHp: 50 } },
  ],
  // 丹药类
  pills: [
    { name: '回血丹', type: ItemType.Pill, rarity: '普通' as ItemRarity, effect: { hp: 50 } },
    { name: '聚气丹', type: ItemType.Pill, rarity: '普通' as ItemRarity, effect: { exp: 20 } },
    { name: '强体丹', type: ItemType.Pill, rarity: '稀有' as ItemRarity, permanentEffect: { physique: 5 } },
    { name: '凝神丹', type: ItemType.Pill, rarity: '稀有' as ItemRarity, permanentEffect: { spirit: 5 } },
    { name: '筑基丹', type: ItemType.Pill, rarity: '传说' as ItemRarity, effect: { exp: 100 } },
    { name: '破境丹', type: ItemType.Pill, rarity: '传说' as ItemRarity, effect: { exp: 200 } },
    { name: '仙灵丹', type: ItemType.Pill, rarity: '仙品' as ItemRarity, effect: { exp: 500 }, permanentEffect: { maxHp: 100 } },
  ],
  // 材料类
  materials: [
    { name: '灵石碎片', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '炼器石', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '强化石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '精铁', type: ItemType.Material, rarity: '普通' as ItemRarity },
    { name: '玄铁', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '星辰石', type: ItemType.Material, rarity: '稀有' as ItemRarity },
    { name: '天外陨铁', type: ItemType.Material, rarity: '传说' as ItemRarity },
    { name: '仙晶', type: ItemType.Material, rarity: '仙品' as ItemRarity },
  ],
  // 装备类（武器）
  weapons: [
    { name: '精铁剑', type: ItemType.Weapon, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Weapon, effect: { attack: 10 } },
    { name: '玄铁刀', type: ItemType.Weapon, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Weapon, effect: { attack: 30 } },
    { name: '星辰剑', type: ItemType.Weapon, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Weapon, effect: { attack: 80, speed: 10 } },
    { name: '仙灵剑', type: ItemType.Weapon, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Weapon, effect: { attack: 200, spirit: 50 } },
  ],
  // 装备类（护甲）- 包含所有部位
  armors: [
    // 普通 - 头部
    { name: '布帽', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Head, effect: { defense: 3, hp: 15 } },
    // 普通 - 肩部
    { name: '布肩', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Shoulder, effect: { defense: 3, hp: 15 } },
    // 普通 - 胸甲
    { name: '布甲', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Chest, effect: { defense: 5, hp: 20 } },
    // 普通 - 手套
    { name: '布手套', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Gloves, effect: { defense: 3, hp: 15 } },
    // 普通 - 裤腿
    { name: '布裤', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Legs, effect: { defense: 4, hp: 18 } },
    // 普通 - 鞋子
    { name: '布鞋', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Boots, effect: { defense: 3, speed: 2 } },

    // 普通 - 铁制装备
    { name: '铁头盔', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Head, effect: { defense: 8, hp: 30 } },
    { name: '铁肩甲', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Shoulder, effect: { defense: 8, hp: 30 } },
    { name: '铁甲', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Chest, effect: { defense: 15, hp: 50 } },
    { name: '铁护手', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Gloves, effect: { defense: 8, hp: 30 } },
    { name: '铁护腿', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Legs, effect: { defense: 10, hp: 40 } },
    { name: '铁战靴', type: ItemType.Armor, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Boots, effect: { defense: 8, speed: 5 } },

    // 稀有 - 头部
    { name: '玄铁头盔', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Head, effect: { defense: 25, hp: 60, spirit: 10 } },
    // 稀有 - 肩部
    { name: '玄铁肩甲', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Shoulder, effect: { defense: 25, hp: 60, spirit: 10 } },
    // 稀有 - 胸甲
    { name: '玄铁甲', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Chest, effect: { defense: 40, hp: 100 } },
    // 稀有 - 手套
    { name: '玄铁护手', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Gloves, effect: { defense: 25, hp: 60, spirit: 10 } },
    // 稀有 - 裤腿
    { name: '玄铁护腿', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Legs, effect: { defense: 30, hp: 80 } },
    // 稀有 - 鞋子
    { name: '玄铁战靴', type: ItemType.Armor, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Boots, effect: { defense: 25, speed: 12 } },

    // 传说 - 头部
    { name: '星辰头冠', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Head, effect: { defense: 60, hp: 150, spirit: 20, attack: 10 } },
    // 传说 - 肩部
    { name: '星辰云肩', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Shoulder, effect: { defense: 60, hp: 150, spirit: 20, attack: 10 } },
    // 传说 - 胸甲
    { name: '星辰战甲', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Chest, effect: { defense: 100, hp: 300, attack: 20 } },
    // 传说 - 手套
    { name: '星辰法手', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Gloves, effect: { defense: 60, hp: 150, spirit: 20, attack: 10 } },
    // 传说 - 裤腿
    { name: '星辰护腿', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Legs, effect: { defense: 75, hp: 200, attack: 15 } },
    // 传说 - 鞋子
    { name: '星辰战靴', type: ItemType.Armor, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Boots, effect: { defense: 60, hp: 150, speed: 25 } },

    // 仙品 - 头部
    { name: '仙灵道冠', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Head, effect: { defense: 150, hp: 400, spirit: 50, attack: 30 } },
    // 仙品 - 肩部
    { name: '仙灵云肩', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Shoulder, effect: { defense: 150, hp: 400, spirit: 50, attack: 30 } },
    // 仙品 - 胸甲
    { name: '仙灵法袍', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Chest, effect: { defense: 250, hp: 800, spirit: 100 } },
    // 仙品 - 手套
    { name: '仙灵法手', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Gloves, effect: { defense: 150, hp: 400, spirit: 50, attack: 30 } },
    // 仙品 - 裤腿
    { name: '仙灵法裤', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Legs, effect: { defense: 180, hp: 500, spirit: 60 } },
    // 仙品 - 鞋子
    { name: '仙灵仙履', type: ItemType.Armor, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Boots, effect: { defense: 150, hp: 400, speed: 60 } },
  ],
  // 装备类（首饰）
  accessories: [
    { name: '护身符', type: ItemType.Accessory, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Accessory1, effect: { defense: 3, hp: 15 } },
    { name: '聚灵玉佩', type: ItemType.Accessory, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Accessory1, effect: { spirit: 20, exp: 10 } },
    { name: '星辰项链', type: ItemType.Accessory, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Accessory1, effect: { attack: 30, defense: 30, speed: 15 } },
    { name: '仙灵手镯', type: ItemType.Accessory, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Accessory1, effect: { attack: 80, defense: 80, hp: 200 } },
  ],
  // 装备类（戒指）
  rings: [
    { name: '铁戒指', type: ItemType.Ring, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Ring1, effect: { attack: 5 } },
    { name: '银戒指', type: ItemType.Ring, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Ring1, effect: { defense: 5 } },
    { name: '金戒指', type: ItemType.Ring, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Ring1, effect: { attack: 15, defense: 15 } },
    { name: '星辰戒指', type: ItemType.Ring, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Ring1, effect: { attack: 40, defense: 40, speed: 20 } },
    { name: '仙灵戒指', type: ItemType.Ring, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Ring1, effect: { attack: 100, defense: 100, spirit: 50 } },
  ],
  // 法宝类
  artifacts: [
    { name: '聚灵珠', type: ItemType.Artifact, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Artifact1, effect: { spirit: 10, exp: 5 } },
    { name: '护体符', type: ItemType.Artifact, rarity: '普通' as ItemRarity, slot: EquipmentSlot.Artifact1, effect: { defense: 10, hp: 30 } },
    { name: '玄灵镜', type: ItemType.Artifact, rarity: '稀有' as ItemRarity, slot: EquipmentSlot.Artifact1, effect: { spirit: 30, defense: 20 } },
    { name: '星辰盘', type: ItemType.Artifact, rarity: '传说' as ItemRarity, slot: EquipmentSlot.Artifact1, effect: { attack: 50, defense: 50, spirit: 50 } },
    { name: '仙灵宝珠', type: ItemType.Artifact, rarity: '仙品' as ItemRarity, slot: EquipmentSlot.Artifact1, effect: { attack: 150, defense: 150, spirit: 150, hp: 500 } },
  ],
};

// 根据敌人强度和类型生成搜刮奖励
const generateLoot = (enemyStrength: number, adventureType: AdventureType, playerRealm: RealmType): AdventureResult['itemObtained'][] => {
  const lootItems: AdventureResult['itemObtained'][] = [];

  // 根据敌人强度决定奖励数量（1-3个物品）
  const numItems = enemyStrength < 0.7 ? 1 : enemyStrength < 1.0 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);

  // 根据敌人强度和类型决定稀有度分布
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // 秘境：更高概率获得稀有物品
      if (roll < 0.1) return '仙品';
      if (roll < 0.3) return '传说';
      if (roll < 0.6) return '稀有';
      return '普通';
    } else if (adventureType === 'lucky') {
      // 机缘：中等概率
      if (roll < 0.05) return '传说';
      if (roll < 0.25) return '稀有';
      return '普通';
    } else {
      // 普通历练：较低概率（略微提升稀有度概率）
      if (roll < 0.03) return '传说';
      if (roll < 0.2) return '稀有';
      return '普通';
    }
  };

  for (let i = 0; i < numItems; i++) {
    const targetRarity = getRarityChance();

    // 根据稀有度选择物品类型
    const itemTypeRoll = Math.random();
    let itemPool: Array<{
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      effect?: any;
      permanentEffect?: any;
      slot?: EquipmentSlot;
    }>;
    let itemType: string;

    if (itemTypeRoll < 0.25) {
      // 25% 草药
      itemPool = LOOT_ITEMS.herbs as any;
      itemType = '草药';
    } else if (itemTypeRoll < 0.45) {
      // 20% 丹药
      itemPool = LOOT_ITEMS.pills as any;
      itemType = '丹药';
    } else if (itemTypeRoll < 0.6) {
      // 15% 材料
      itemPool = LOOT_ITEMS.materials as any;
      itemType = '材料';
    } else if (itemTypeRoll < 0.8) {
      // 20% 装备（武器/护甲/首饰/戒指）
      const equipRoll = Math.random();
      if (equipRoll < 0.25) {
        itemPool = LOOT_ITEMS.weapons as any;
        itemType = '武器';
      } else if (equipRoll < 0.65) {
        // 护甲概率提升到40%，因为护甲有6个部位需要覆盖
        itemPool = LOOT_ITEMS.armors as any;
        itemType = '护甲';
      } else if (equipRoll < 0.85) {
        itemPool = LOOT_ITEMS.accessories as any;
        itemType = '首饰';
      } else {
        itemPool = LOOT_ITEMS.rings as any;
        itemType = '戒指';
      }
    } else if (itemTypeRoll < 0.92) {
      // 12% 法宝
      itemPool = LOOT_ITEMS.artifacts as any;
      itemType = '法宝';
    } else {
      // 8% 丹方（稀有奖励）
      // 丹方将在后面特殊处理
      itemType = '丹方';
      itemPool = []; // 丹方不使用常规物品池
    }

    // 特殊处理：丹方
    if (itemType === '丹方') {
      // 根据稀有度筛选可获得的丹方
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const recipeIndex = rarityOrder.indexOf(recipe.result.rarity);
        return recipeIndex <= targetIndex;
      });

      if (availableRecipes.length > 0) {
        const selectedRecipe = pickOne(availableRecipes);
        const item: AdventureResult['itemObtained'] & { recipeName?: string } = {
          name: `${selectedRecipe.name}丹方`,
          type: '丹方',
          description: `记载了【${selectedRecipe.name}】炼制方法的古老丹方。使用后可学会炼制此丹药。`,
          rarity: selectedRecipe.result.rarity,
          isEquippable: false,
          recipeName: selectedRecipe.name, // 用于在 executeAdventureCore 中查找对应的配方
        };
        lootItems.push(item);
      }
      // 如果没有可用的丹方，跳过这次生成
      continue;
    }

    // 从对应稀有度的物品中随机选择
    const availableItems = itemPool.filter(item => item.rarity === targetRarity);
    if (availableItems.length === 0) {
      // 如果没有对应稀有度的物品，降级选择
      const fallbackItems = itemPool.filter(item => {
        const rarityOrder: ItemRarity[] = ['普通', '稀有', '传说', '仙品'];
        const targetIndex = rarityOrder.indexOf(targetRarity);
        const itemIndex = rarityOrder.indexOf(item.rarity);
        return itemIndex <= targetIndex;
      });
      if (fallbackItems.length > 0) {
        const selected = pickOne(fallbackItems);
        const item: AdventureResult['itemObtained'] = {
          name: selected.name,
          type: itemType,
          description: `${selected.name}，从敌人身上搜刮获得。`,
          rarity: selected.rarity,
          isEquippable: selected.slot !== undefined,
          equipmentSlot: selected.slot as string | undefined,
          effect: selected.effect,
          permanentEffect: selected.permanentEffect,
        };
        lootItems.push(item);
      }
    } else {
      const selected = pickOne(availableItems);
      const item: AdventureResult['itemObtained'] = {
        name: selected.name,
        type: itemType,
        description: `${selected.name}，从敌人身上搜刮获得。`,
        rarity: selected.rarity,
        isEquippable: selected.slot !== undefined,
        equipmentSlot: selected.slot as string | undefined,
        effect: selected.effect,
        permanentEffect: selected.permanentEffect,
      };
      lootItems.push(item);
    }
  }

  return lootItems;
};

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
    strengthMultiplier?: number; // 敌人强度倍数
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

const createEnemy = async (player: PlayerStats, adventureType: AdventureType): Promise<{
  name: string;
  title: string;
  realm: RealmType;
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
  strengthMultiplier: number;
}> => {
  const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
  const realmOffset = adventureType === 'secret_realm' ? 1 : adventureType === 'lucky' ? -1 : 0;
  const targetIndex = clampMin(Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset), 0);
  const realm = REALM_ORDER[targetIndex];
  const baseDifficulty = battleDifficulty[adventureType] || 1;

  // 引入强度等级系统：弱敌、普通、强敌
  // 普通历练：40%弱敌，50%普通，10%强敌
  // 机缘历练：60%弱敌，35%普通，5%强敌
  // 秘境历练：20%弱敌，50%普通，30%强敌
  const strengthRoll = Math.random();
  let strengthMultiplier = 1;
  let strengthVariance = { min: 0.85, max: 1.2 };

  if (adventureType === 'normal') {
    if (strengthRoll < 0.4) {
      // 弱敌 40%
      strengthMultiplier = 0.6 + Math.random() * 0.2; // 0.6 - 0.8
      strengthVariance = { min: 0.6, max: 0.9 };
    } else if (strengthRoll < 0.9) {
      // 普通 50%
      strengthMultiplier = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
      strengthVariance = { min: 0.75, max: 1.1 };
    } else {
      // 强敌 10%
      strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
      strengthVariance = { min: 0.9, max: 1.3 };
    }
  } else if (adventureType === 'lucky') {
    if (strengthRoll < 0.6) {
      // 弱敌 60%
      strengthMultiplier = 0.5 + Math.random() * 0.2; // 0.5 - 0.7
      strengthVariance = { min: 0.5, max: 0.85 };
    } else if (strengthRoll < 0.95) {
      // 普通 35%
      strengthMultiplier = 0.7 + Math.random() * 0.2; // 0.7 - 0.9
      strengthVariance = { min: 0.65, max: 1.0 };
    } else {
      // 强敌 5%
      strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
      strengthVariance = { min: 0.8, max: 1.2 };
    }
  } else if (adventureType === 'secret_realm') {
    if (strengthRoll < 0.2) {
      // 弱敌 20%
      strengthMultiplier = 0.7 + Math.random() * 0.2; // 0.7 - 0.9
      strengthVariance = { min: 0.65, max: 1.0 };
    } else if (strengthRoll < 0.7) {
      // 普通 50%
      strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
      strengthVariance = { min: 0.8, max: 1.2 };
    } else {
      // 强敌 30%
      strengthMultiplier = 1.1 + Math.random() * 0.3; // 1.1 - 1.4
      strengthVariance = { min: 1.0, max: 1.5 };
    }
  }

  const variance = () => strengthVariance.min + Math.random() * (strengthVariance.max - strengthVariance.min);
  const finalDifficulty = baseDifficulty * strengthMultiplier;

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

  // 降低敌人的基础属性，特别是攻击和防御
  const baseAttack = player.attack * 0.7 + player.realmLevel * 3; // 从 5 降到 3
  const baseDefense = player.defense * 0.7 + player.realmLevel * 2; // 从 4 降到 2

  return {
    name,
    title,
    realm,
    attack: Math.max(8, Math.round(baseAttack * variance() * finalDifficulty)),
    defense: Math.max(6, Math.round(baseDefense * variance() * finalDifficulty)),
    maxHp: Math.max(40, Math.round(player.maxHp * (0.5 + Math.random() * 0.4) * finalDifficulty)), // 从 0.75-1.25 降到 0.5-0.9
    speed: Math.max(6, Math.round((player.speed || 10) * (0.7 + Math.random() * 0.3) * strengthMultiplier)), // 从 0.8-1.2 降到 0.7-1.0
    strengthMultiplier // 保存强度倍数用于生成奖励
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
  // 移除战斗失败时的血量保护，允许死亡
  // if (!victory) {
  //   playerHp = Math.max(1, Math.round(player.maxHp * 0.08));
  // }

  const hpLoss = Math.max(0, player.hp - playerHp);

  const baseExp = 25 + player.realmLevel * 12;
  const rewardExp = Math.round(baseExp * difficulty);
  const rewardStones = Math.max(3, Math.round((6 + player.realmLevel * 2) * difficulty));

  const expChange = victory ? rewardExp : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory ? rewardStones : -Math.max(2, Math.round(rewardStones * 0.6));

  // 如果胜利，生成搜刮奖励
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(enemy.strengthMultiplier, adventureType, player.realm);
    lootItems.push(...loot);
  }

  const summary = victory
    ? `你斩杀了${enemy.title}${enemy.name}，耗费 ${hpLoss} 点气血。${lootItems.length > 0 ? '你搜刮了敌人的遗物。' : ''}`
    : `你不敌${enemy.title}${enemy.name}，重伤撤离，损失 ${hpLoss} 点气血。`;

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange: playerHp - player.hp,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined
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


