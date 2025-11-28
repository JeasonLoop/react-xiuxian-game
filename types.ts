
export enum RealmType {
  QiRefining = '炼气期',
  Foundation = '筑基期',
  GoldenCore = '金丹期',
  NascentSoul = '元婴期',
  SpiritSevering = '化神期',
  VoidRefining = '炼虚期',
  ImmortalAscension = '渡劫飞升'
}

export interface CultivationArt {
  id: string;
  name: string;
  type: 'mental' | 'body'; // Mental (心法) for Exp rate, Body (体术) for permanent stats
  description: string;
  realmRequirement: RealmType;
  cost: number;
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number; // e.g., 0.1 for +10% exp from meditation
  };
}

export enum ItemType {
  Herb = '草药',
  Pill = '丹药',
  Material = '材料',
  Artifact = '法宝',
  Weapon = '武器',
  Armor = '护甲',
  Accessory = '首饰',
  Ring = '戒指'
}

export type ItemRarity = '普通' | '稀有' | '传说' | '仙品';

// 装备部位枚举
export enum EquipmentSlot {
  Head = '头部',
  Shoulder = '肩部',
  Chest = '胸甲',
  Gloves = '手套',
  Legs = '裤腿',
  Boots = '鞋子',
  Ring1 = '戒指1',
  Ring2 = '戒指2',
  Ring3 = '戒指3',
  Ring4 = '戒指4',
  Accessory1 = '首饰1',
  Accessory2 = '首饰2',
  Artifact1 = '法宝1',
  Artifact2 = '法宝2',
  Weapon = '武器'
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  quantity: number;
  rarity?: ItemRarity; // Defaults to '普通' if undefined
  level?: number; // Upgrade level, defaults to 0
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot; // 装备部位
  isNatal?: boolean; // 是否为本命法宝
  effect?: {
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
  permanentEffect?: {
    // 永久提升的属性（使用物品后永久增加）
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
  };
}

export enum SectRank {
  Outer = '外门弟子',
  Inner = '内门弟子',
  Core = '真传弟子',
  Elder = '长老'
}

export interface SecretRealm {
  id: string;
  name: string;
  description: string;
  minRealm: RealmType;
  cost: number; // Spirit stones to enter
  riskLevel: '低' | '中' | '高' | '极度危险';
  drops: string[]; // Description of potential drops
}

// 角色系统扩展
export interface Talent {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number;
    luck?: number; // 幸运值，影响奇遇和掉落
  };
}

export interface Title {
  id: string;
  name: string;
  description: string;
  requirement: string;
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number;
  };
}

export interface PlayerStats {
  name: string;
  realm: RealmType;
  realmLevel: number; // 1-9
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  attack: number; // 攻击力
  defense: number; // 防御力
  spirit: number; // 神识（影响法术威力和感知能力）
  physique: number; // 体魄（影响气血上限和物理抗性）
  speed: number; // 速度（影响行动顺序和闪避）
  spiritStones: number;
  inventory: Item[];
  cultivationArts: string[]; // IDs of learned arts
  activeArtId: string | null; // ID of the currently active Mental Art
  equippedItems: Partial<Record<EquipmentSlot, string>>; // 装备栏位 -> 物品ID的映射
  sectId: string | null;
  sectRank: SectRank;
  sectContribution: number;
  // 角色系统扩展
  talentId: string | null; // 天赋ID（游戏开始时随机生成，之后不可修改）
  titleId: string | null; // 称号ID
  attributePoints: number; // 可分配属性点
  luck: number; // 幸运值
  // 成就系统
  achievements: string[]; // 已完成的成就ID
  // 灵宠系统
  pets: Pet[]; // 拥有的灵宠
  activePetId: string | null; // 当前激活的灵宠ID
  // 抽奖系统
  lotteryTickets: number; // 抽奖券
  lotteryCount: number; // 累计抽奖次数（用于保底）
  // 传承系统
  inheritanceLevel: number; // 传承等级（0-4，每次传承可突破1-4个境界）
  // 每日任务系统
  dailyTaskCount: {
    instant: number; // 今日已完成瞬时任务次数（限制10次）
    short: number; // 今日已完成短暂任务次数（限制5次）
    medium: number; // 今日已完成中等任务次数（限制3次）
    long: number; // 今日已完成较长任务次数（限制2次）
  };
  lastTaskResetDate: string; // 上次重置任务计数的日期（YYYY-MM-DD格式）
  // 成就系统扩展
  viewedAchievements: string[]; // 已查看过的成就ID（用于角标显示）
  // 本命法宝系统
  natalArtifactId: string | null; // 本命法宝ID
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'normal' | 'gain' | 'danger' | 'special';
  timestamp: number;
}

export type AdventureType = 'normal' | 'lucky' | 'secret_realm';

export interface AdventureResult {
  story: string;
  hpChange: number;
  expChange: number;
  spiritStonesChange: number;
  lotteryTicketsChange?: number; // 抽奖券变化
  inheritanceLevelChange?: number; // 传承等级变化（1-4，表示可以突破的境界数）
  attributeReduction?: {
    // 属性降低（遭遇陷阱、邪修等危险事件时）
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
  };
  triggerSecretRealm?: boolean; // 是否触发随机秘境
  itemObtained?: {
    name: string;
    type: string; // "草药" | "材料" | "法宝" | "武器" | "护甲" | "首饰" | "戒指"
    description: string;
    rarity?: string;
    isEquippable?: boolean;
    equipmentSlot?: string; // "头部" | "肩部" | "胸甲" | "手套" | "裤腿" | "鞋子" | "戒指1-4" | "首饰1-2" | "法宝1-2" | "武器"
    effect?: {
      attack?: number;
      defense?: number;
      hp?: number;
      exp?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
    };
    permanentEffect?: {
      // 永久提升的属性
      attack?: number;
      defense?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
      maxHp?: number;
    };
  };
  itemsObtained?: Array<{ // 多个物品（用于搜刮等）
    name: string;
    type: string;
    description: string;
    rarity?: string;
    isEquippable?: boolean;
    equipmentSlot?: string;
    effect?: {
      attack?: number;
      defense?: number;
      hp?: number;
      exp?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
    };
    permanentEffect?: {
      attack?: number;
      defense?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
      maxHp?: number;
    };
  }>;
  petObtained?: string; // 获得的灵宠模板ID（如 "pet-spirit-fox"）
  petOpportunity?: { // 灵宠机缘
    type: 'evolution' | 'level' | 'stats' | 'exp'; // 机缘类型：进化、提升等级、提升属性、获得经验
    petId?: string; // 影响的灵宠ID（可选，如果为空则随机选择玩家拥有的一个灵宠）
    levelGain?: number; // 提升的等级数（type为'level'时）
    expGain?: number; // 获得的经验值（type为'exp'时）
    statsBoost?: { // 属性提升（type为'stats'时）
      attack?: number;
      defense?: number;
      hp?: number;
      speed?: number;
    };
  };
  eventColor: 'normal' | 'gain' | 'danger' | 'special';
}

export interface Recipe {
  name: string;
  cost: number;
  ingredients: { name: string; qty: number }[];
  result: {
    name: string;
    type: ItemType;
    description: string;
    rarity: ItemRarity;
    effect?: {
      hp?: number;
      exp?: number;
      attack?: number;
      defense?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
    };
  };
}

// 奇遇系统
export interface EncounterEvent {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  triggerChance: number; // 触发概率 (0-1)
  minRealm?: RealmType; // 最低境界要求
  rewards: {
    exp?: number;
    spiritStones?: number;
    items?: { name: string; rarity: ItemRarity; quantity?: number }[];
    hpChange?: number;
  };
  requirements?: {
    minLuck?: number;
    sectId?: string;
  };
}

// 探索系统
export interface ExplorationLocation {
  id: string;
  name: string;
  description: string;
  minRealm: RealmType;
  cost: number; // 进入消耗
  riskLevel: '低' | '中' | '高' | '极度危险';
  eventTypes: AdventureType[];
  specialEncounters?: string[]; // 特殊奇遇ID列表
}

// 成就系统
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'cultivation' | 'combat' | 'exploration' | 'collection' | 'special';
  requirement: {
    type: string; // 'realm' | 'level' | 'kill' | 'collect' | 'custom'
    value: number;
    target?: string; // 目标名称（如物品名、境界名等）
  };
  reward: {
    exp?: number;
    spiritStones?: number;
    items?: Item[];
    titleId?: string;
  };
  rarity: ItemRarity;
}

// 灵宠系统
export interface Pet {
  id: string;
  name: string;
  species: string; // 种类
  level: number;
  exp: number;
  maxExp: number;
  rarity: ItemRarity;
  stats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number; // 速度，影响战斗中的行动顺序
  };
  skills: PetSkill[];
  evolutionStage: number; // 进化阶段 0-2
  affection: number; // 亲密度 0-100
}

export interface PetSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'support' | 'passive';
  effect: {
    damage?: number;
    heal?: number;
    buff?: { attack?: number; defense?: number; hp?: number };
  };
  cooldown?: number;
}

export interface PetTemplate {
  id: string;
  name: string;
  species: string;
  description: string;
  rarity: ItemRarity;
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
  };
  skills: PetSkill[];
  evolutionRequirements?: {
    level: number;
    items?: { name: string; quantity: number }[];
  };
}

// 抽奖系统
export interface LotteryPrize {
  id: string;
  name: string;
  type: 'item' | 'spiritStones' | 'exp' | 'pet' | 'ticket';
  rarity: ItemRarity;
  weight: number; // 权重，越高越容易抽到
  value: {
    item?: Partial<Item>;
    spiritStones?: number;
    exp?: number;
    petId?: string;
    tickets?: number;
  };
}

// 设置系统
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number; // 0-100
  musicVolume: number; // 0-100
  autoSave: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  language: 'zh' | 'en';
}

// 商店系统
export enum ShopType {
  Village = '村庄',
  City = '城市',
  Sect = '仙门'
}

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  price: number; // 购买价格
  sellPrice: number; // 出售价格（通常是购买价格的30-50%）
  effect?: {
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
  equipmentSlot?: EquipmentSlot;
  isEquippable?: boolean;
  minRealm?: RealmType; // 最低境界要求
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  description: string;
  items: ShopItem[];
}
