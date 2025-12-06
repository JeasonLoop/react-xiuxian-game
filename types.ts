export enum RealmType {
  QiRefining = '炼气期',
  Foundation = '筑基期',
  GoldenCore = '金丹期',
  NascentSoul = '元婴期',
  SpiritSevering = '化神期',
  VoidRefining = '炼虚期',
  ImmortalAscension = '渡劫飞升',
}

export type ArtGrade = '天' | '地' | '玄' | '黄'; // 功法品级：天、地、玄、黄

export interface CultivationArt {
  id: string;
  name: string;
  type: 'mental' | 'body'; // Mental (心法) for Exp rate, Body (体术) for permanent stats
  description: string;
  grade: ArtGrade; // 功法品级
  realmRequirement: RealmType;
  cost: number;
  sectId?: string | null; // 所属宗门ID，null表示通用功法
  attributeRequirements?: {
    // 属性要求
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
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
  Ring = '戒指',
  Recipe = '丹方',
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
  Weapon = '武器',
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
  recipeData?: Recipe; // 丹方数据（仅当 type 为 Recipe 时使用）
  reviveChances?: number; // 保命机会次数（1-3次），仅传说和仙品装备可能有
  battleSkills?: BattleSkill[]; // 战斗技能（法宝/武器）
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
  Elder = '长老',
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
  betrayedSects: string[]; // 背叛过的宗门ID列表
  sectHuntEndTime: number | null; // 宗门追杀结束时间戳（毫秒），null表示未被追杀
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
  // 丹方系统
  unlockedRecipes: string[]; // 已解锁的丹方名称列表
  // 打坐回血速度加成
  meditationHpRegenMultiplier: number; // 打坐回血速度加成倍数（默认1.0，打坐时增加）
  meditationBoostEndTime: number | null; // 打坐回血加成结束时间戳（毫秒）
  // 成就统计系统
  statistics: {
    killCount: number; // 击杀敌人数量
    meditateCount: number; // 打坐次数
    adventureCount: number; // 历练次数
    equipCount: number; // 装备物品数量
    petCount: number; // 获得灵宠数量
    recipeCount: number; // 解锁丹方数量
    artCount: number; // 学习功法数量
    breakthroughCount: number; // 突破次数
    secretRealmCount: number; // 进入秘境次数
  };
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
  itemsObtained?: Array<{
    // 多个物品（用于搜刮等）
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
  petOpportunity?: {
    // 灵宠机缘
    type: 'evolution' | 'level' | 'stats' | 'exp'; // 机缘类型：进化、提升等级、提升属性、获得经验
    petId?: string; // 影响的灵宠ID（可选，如果为空则随机选择玩家拥有的一个灵宠）
    levelGain?: number; // 提升的等级数（type为'level'时）
    expGain?: number; // 获得的经验值（type为'exp'时）
    statsBoost?: {
      // 属性提升（type为'stats'时）
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
  evolutionStage: number; // 进化阶段 0-2 (0=幼年期, 1=成熟期, 2=完全体)
  affection: number; // 亲密度 0-100
  skillCooldowns?: Record<string, number>; // 技能冷却时间追踪
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
  nameVariants?: string[]; // 名字变体，用于随机生成多样化名字
  species: string;
  description: string;
  rarity: ItemRarity;
  image?: string; // 灵宠图片（emoji或SVG路径）
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
  };
  skills: PetSkill[];
  evolutionRequirements?: {
    // 幼年期 -> 成熟期 (evolutionStage 0 -> 1)
    stage1?: {
      level: number;
      items?: { name: string; quantity: number }[];
    };
    // 成熟期 -> 完全体 (evolutionStage 1 -> 2)
    stage2?: {
      level: number;
      items?: { name: string; quantity: number }[];
    };
    // 兼容旧版本（如果没有stage1/stage2，使用这个）
    level?: number;
    items?: { name: string; quantity: number }[];
  };
  // 进化后的名称（可选，如果不提供则使用原名称）
  evolutionNames?: {
    stage1?: string; // 成熟期名称
    stage2?: string; // 完全体名称
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
  Sect = '仙门',
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
  reviveChances?: number; // 保命机会次数（1-3次），仅传说和仙品装备可能有
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  description: string;
  items: ShopItem[];
}

// ==================== 回合制战斗系统类型定义 ====================

// 状态效果
export interface Buff {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'speed' | 'heal' | 'crit' | 'shield' | 'custom';
  value: number; // 数值加成或百分比加成
  duration: number; // 剩余回合数，-1表示永久（战斗期间）
  source: string; // 来源（功法、丹药、技能等）
  description?: string;
}

export interface Debuff {
  id: string;
  name: string;
  type: 'poison' | 'burn' | 'freeze' | 'stun' | 'weakness' | 'armor_break' | 'custom';
  value: number;
  duration: number;
  source: string;
  description?: string;
}

// 技能效果
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  target: 'self' | 'enemy' | 'both';
  value?: number;
  duration?: number;
  buffId?: string;
  debuffId?: string;
  buff?: Buff;
  debuff?: Debuff;
}

// 战斗技能
export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'debuff' | 'special';
  source: 'cultivation_art' | 'artifact' | 'weapon' | 'potion' | 'innate';
  sourceId: string; // 来源ID（功法ID、法宝ID等）
  effects: SkillEffect[];
  cost: {
    mana?: number; // 灵力消耗
    energy?: number; // 能量消耗
    hp?: number; // 气血消耗（自残技能）
  };
  cooldown: number; // 当前冷却回合数
  maxCooldown: number; // 最大冷却回合数
  conditions?: {
    minHp?: number; // 最低气血百分比（0-1）
    requireBuff?: string; // 需要特定Buff ID
    requireDebuff?: string; // 需要特定Debuff ID
  };
  target: 'self' | 'enemy' | 'both';
  damage?: {
    base: number; // 基础伤害
    multiplier: number; // 伤害倍率（基于攻击力或神识）
    type: 'physical' | 'magical'; // 物理/法术伤害
    critChance?: number; // 暴击概率（0-1）
    critMultiplier?: number; // 暴击倍率
  };
  heal?: {
    base: number; // 基础治疗
    multiplier: number; // 治疗倍率（基于最大气血的百分比）
  };
}

// 战斗单位
export interface BattleUnit {
  id: string;
  name: string;
  realm: RealmType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number; // 神识（影响法术伤害）
  buffs: Buff[];
  debuffs: Debuff[];
  skills: BattleSkill[]; // 可用技能列表
  cooldowns: Record<string, number>; // 技能冷却时间（技能ID -> 剩余冷却回合）
  mana?: number; // 灵力值（可选，用于技能消耗）
  maxMana?: number; // 最大灵力值
  energy?: number; // 能量值（可选，用于特殊技能）
  maxEnergy?: number; // 最大能量值
  isDefending?: boolean; // 是否处于防御状态
}

// 战斗行动
export interface BattleAction {
  id: string;
  round: number;
  turn: 'player' | 'enemy';
  actor: string; // 行动者ID
  actionType: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  skillId?: string; // 使用的技能ID
  itemId?: string; // 使用的物品ID
  target?: string; // 目标ID
  result: {
    damage?: number;
    heal?: number;
    buffs?: Buff[];
    debuffs?: Debuff[];
    crit?: boolean;
    miss?: boolean;
    blocked?: boolean;
    manaCost?: number;
  };
  description: string; // 行动描述文本
}

// 战斗结果
export interface BattleResult {
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  expChange: number;
  spiritChange: number;
  summary: string;
}

// 战斗状态
export interface BattleState {
  id: string;
  round: number; // 当前回合数
  turn: 'player' | 'enemy'; // 当前行动方
  player: BattleUnit;
  enemy: BattleUnit;
  history: BattleAction[]; // 战斗历史
  result?: BattleResult; // 战斗结果
  isPlayerTurn: boolean; // 是否玩家回合（用于UI控制）
  waitingForPlayerAction: boolean; // 是否等待玩家行动
  playerInventory: Item[]; // 玩家背包（用于使用物品）
  // 行动次数系统
  playerActionsRemaining: number; // 玩家剩余行动次数
  enemyActionsRemaining: number; // 敌人剩余行动次数
  playerMaxActions: number; // 玩家本回合最大行动次数
  enemyMaxActions: number; // 敌人本回合最大行动次数
  // 战斗信息
  enemyStrengthMultiplier?: number; // 敌人强度倍数（用于奖励计算）
  adventureType: AdventureType; // 历练类型
  riskLevel?: '低' | '中' | '高' | '极度危险'; // 风险等级
  // 灵宠系统
  activePet?: Pet | null; // 激活的灵宠
  petSkillCooldowns?: Record<string, number>; // 灵宠技能冷却
}

// 玩家行动选择
export type PlayerAction =
  | { type: 'attack' }
  | { type: 'skill'; skillId: string }
  | { type: 'item'; itemId: string }
  | { type: 'defend' }
  | { type: 'flee' };

// 战斗可用丹药
export interface BattlePotion {
  itemId: string;
  name: string;
  type: 'heal' | 'buff' | 'debuff_removal';
  effect: {
    heal?: number;
    buffs?: Buff[];
    removeDebuffs?: string[]; // 移除的Debuff ID列表
  };
  cooldown?: number; // 使用后冷却（防止无限使用）
  itemType: ItemType; // 物品类型
}