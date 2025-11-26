
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
    expRate?: number; // e.g., 0.1 for +10% exp from meditation
  };
}

export enum ItemType {
  Herb = '草药',
  Pill = '丹药',
  Material = '材料',
  Artifact = '法宝'
}

export type ItemRarity = '普通' | '稀有' | '传说' | '仙品';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  quantity: number;
  rarity?: ItemRarity; // Defaults to '普通' if undefined
  level?: number; // Upgrade level, defaults to 0
  isEquippable?: boolean;
  effect?: {
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
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

export interface PlayerStats {
  name: string;
  realm: RealmType;
  realmLevel: number; // 1-9
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  spiritStones: number;
  inventory: Item[];
  cultivationArts: string[]; // IDs of learned arts
  activeArtId: string | null; // ID of the currently active Mental Art
  equippedArtifactId: string | null; // ID of the equipped item
  sectId: string | null;
  sectRank: SectRank;
  sectContribution: number;
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
  itemObtained?: {
    name: string;
    type: string; // "草药" | "材料" | "法宝"
    description: string;
    rarity?: string;
    isEquippable?: boolean;
    effect?: {
      attack?: number;
      defense?: number;
      hp?: number;
      exp?: number;
    }
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
    };
  };
}
