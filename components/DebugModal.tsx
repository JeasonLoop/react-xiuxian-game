import React, { useEffect, useMemo, useState } from 'react';
import Modal from './common/Modal';
import { AlertTriangle, Bug, FlaskConical, Heart, Search, Sword } from 'lucide-react';
import { ItemType, PlayerStats, RealmType } from '../types';
import { INITIAL_ITEMS, REALM_ORDER } from '../constants';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { showInfo, showSuccess } from '../utils/toastUtils';
import { getAllItemsFromConstants } from '../utils/itemConstantsUtils';
import { getItemStats } from '../utils/itemUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpdatePlayer: (updates: Partial<PlayerStats>) => void;
  onTriggerDeath?: () => void;
  onTriggerReputationEvent?: (event: unknown) => void;
  onChallengeDaoCombining?: () => void;
}

type TabKey = 'quick' | 'player' | 'items' | 'danger';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'quick', label: '快捷操作' },
  { key: 'player', label: '角色调整' },
  { key: 'items', label: '物品注入' },
  { key: 'danger', label: '危险操作' },
];

const defaultInjectCount = 10;
const categoryAll = '全部';
const rarityAll = '全部稀有度';
const DB_NAME = 'xiuxian-game-db';
const ADVENTURE_STORE = 'adventure-templates';

const getCategoryLabel = (item: (typeof INITIAL_ITEMS)[number]): string => {
  if (item.type !== ItemType.AdvancedItem) return item.type;
  switch (item.advancedItemType) {
    case 'foundationTreasure':
      return '筑基奇物';
    case 'heavenEarthEssence':
      return '天地精华';
    case 'heavenEarthMarrow':
      return '天地之髓';
    case 'longevityRule':
      return '规则之力';
    case 'soulArt':
      return '天地之魄功法';
    default:
      return '进阶物品(其他)';
  }
};

const toSafeNumber = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeNumericInput = (rawValue: string): string => {
  const normalized = rawValue.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
  return normalized.replace(/\D/g, '');
};

const toNonNegativeInt = (rawValue: string, fallback = 0): number => {
  const digitsOnly = normalizeNumericInput(rawValue);
  if (!digitsOnly) return fallback;
  return Number.parseInt(digitsOnly, 10);
};

const calculateEquipmentSoftCapFactor = (player: PlayerStats, equippedItemCount: number): number => {
  const realm = player.realm;
  const realmLevel = player.realmLevel || 1;
  const realmBaseFactors: Record<string, number> = {
    炼气期: 0.6,
    筑基期: 0.7,
    金丹期: 0.8,
    元婴期: 0.9,
    化神期: 1.0,
    合道期: 1.1,
    长生境: 1.2,
    渡劫飞升: 1.3,
  };
  const baseFactor = realmBaseFactors[realm] ?? 0.8;
  const levelBonus = 1 + (realmLevel - 1) * 0.01;
  const equipmentCountFactor = Math.max(0.5, 1.0 - (equippedItemCount - 8) * 0.05);
  return baseFactor * levelBonus * equipmentCountFactor;
};

const applyEquipmentSoftCap = (equipmentBonus: number, softCapFactor: number): number => {
  const baseThreshold = 1000 * softCapFactor;
  if (equipmentBonus <= baseThreshold) return equipmentBonus;
  const overThreshold = equipmentBonus - baseThreshold;
  const diminishedBonus = overThreshold * (0.5 + softCapFactor * 0.3);
  return Math.floor(baseThreshold + diminishedBonus);
};

interface PlayerSettingsDraft {
  hp: string;
  maxHp: string;
  exp: string;
  maxExp: string;
  spiritStones: string;
  lotteryTickets: string;
  attack: string;
  defense: string;
  spirit: string;
  physique: string;
  speed: string;
  realm: RealmType;
  realmLevel: string;
}

const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  onTriggerDeath,
  onChallengeDaoCombining,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('quick');
  const [search, setSearch] = useState('');
  const [injectCount, setInjectCount] = useState(defaultInjectCount);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryAll);
  const [selectedRarity, setSelectedRarity] = useState<string>(rarityAll);
  const [templateItems, setTemplateItems] = useState<Array<(typeof INITIAL_ITEMS)[number]>>([]);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [playerDraft, setPlayerDraft] = useState<PlayerSettingsDraft | null>(null);

  const equipmentBonuses = useMemo(() => {
    const equippedItems = Object.values(player.equippedItems || {})
      .map((itemId) => player.inventory?.find((i) => i.id === itemId))
      .filter(Boolean);

    let attack = 0;
    let defense = 0;
    let hp = 0;
    let spirit = 0;
    let physique = 0;
    let speed = 0;

    equippedItems.forEach((equippedItem) => {
      if (!equippedItem || !equippedItem.effect) return;
      const isNatal = equippedItem.id === player.natalArtifactId;
      const itemStats = getItemStats(equippedItem, isNatal);
      attack += itemStats.attack;
      defense += itemStats.defense;
      hp += itemStats.hp;
      spirit += itemStats.spirit;
      physique += itemStats.physique;
      speed += itemStats.speed;
    });

    const softCapFactor = calculateEquipmentSoftCapFactor(player, equippedItems.length);
    return {
      attack: applyEquipmentSoftCap(attack, softCapFactor),
      defense: applyEquipmentSoftCap(defense, softCapFactor),
      hp: applyEquipmentSoftCap(hp, softCapFactor),
      spirit: applyEquipmentSoftCap(spirit, softCapFactor),
      physique: applyEquipmentSoftCap(physique, softCapFactor),
      speed: applyEquipmentSoftCap(speed, softCapFactor),
    };
  }, [player]);

  const editableStats = useMemo(() => {
    return {
      hp: Math.max(0, toSafeNumber(player.hp, 0) - equipmentBonuses.hp),
      maxHp: Math.max(1, toSafeNumber(player.maxHp, 1) - equipmentBonuses.hp),
      attack: Math.max(0, toSafeNumber(player.attack, 0) - equipmentBonuses.attack),
      defense: Math.max(0, toSafeNumber(player.defense, 0) - equipmentBonuses.defense),
      spirit: Math.max(0, toSafeNumber(player.spirit, 0) - equipmentBonuses.spirit),
      physique: Math.max(0, toSafeNumber(player.physique, 0) - equipmentBonuses.physique),
      speed: Math.max(0, toSafeNumber(player.speed, 0) - equipmentBonuses.speed),
    };
  }, [player, equipmentBonuses]);

  useEffect(() => {
    if (!isOpen) return;
    setPlayerDraft({
      hp: String(Math.max(1, editableStats.hp)),
      maxHp: String(Math.max(1, editableStats.maxHp)),
      exp: String(Math.max(0, Math.floor(toSafeNumber(player.exp, 0)))),
      maxExp: String(Math.max(1, Math.floor(toSafeNumber(player.maxExp, 1)))),
      spiritStones: String(Math.max(0, Math.floor(toSafeNumber(player.spiritStones, 0)))),
      lotteryTickets: String(Math.max(0, Math.floor(toSafeNumber(player.lotteryTickets, 0)))),
      attack: String(Math.max(1, editableStats.attack)),
      defense: String(Math.max(1, editableStats.defense)),
      spirit: String(Math.max(1, editableStats.spirit)),
      physique: String(Math.max(1, editableStats.physique)),
      speed: String(Math.max(1, editableStats.speed)),
      realm: player.realm,
      realmLevel: String(Math.max(1, Math.floor(toSafeNumber(player.realmLevel, 1)))),
    });
  }, [isOpen, player, editableStats]);

  useEffect(() => {
    let isCancelled = false;

    const normalizeType = (value: unknown): ItemType => {
      if (Object.values(ItemType).includes(value as ItemType)) {
        return value as ItemType;
      }
      return ItemType.Material;
    };

    const normalizeItem = (item: any) => {
      return {
        name: item.name || '未知物品',
        type: normalizeType(item.type),
        description: item.description || '无描述',
        rarity: item.rarity || '普通',
        effect: item.effect,
        permanentEffect: item.permanentEffect,
        isEquippable: item.isEquippable,
        equipmentSlot: item.equipmentSlot,
        advancedItemType: item.advancedItemType,
        advancedItemId: item.advancedItemId,
      };
    };

    const loadTemplateItems = async () => {
      setIsTemplateLoading(true);
      try {
        const mergedMap = new Map<string, (typeof INITIAL_ITEMS)[number]>();

        const constantItems = getAllItemsFromConstants().map(normalizeItem);
        constantItems.forEach((item) => {
          mergedMap.set(`${item.type}:${item.name}`, item);
        });

        const request = indexedDB.open(DB_NAME, 2);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const templates = await new Promise<any[]>((resolve, reject) => {
          const transaction = db.transaction([ADVENTURE_STORE], 'readonly');
          const store = transaction.objectStore(ADVENTURE_STORE);
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
          getAllRequest.onerror = () => reject(getAllRequest.error);
        });

        templates.forEach((record) => {
          const data = record?.data;
          if (!data) return;
          if (data.itemObtained) {
            const item = normalizeItem(data.itemObtained);
            mergedMap.set(`${item.type}:${item.name}`, item);
          }
          if (Array.isArray(data.itemsObtained)) {
            data.itemsObtained.forEach((raw: any) => {
              const item = normalizeItem(raw);
              mergedMap.set(`${item.type}:${item.name}`, item);
            });
          }
        });

        db.close();
        if (!isCancelled) {
          setTemplateItems(Array.from(mergedMap.values()));
        }
      } catch (_) {
        // IndexedDB 不可用时，回退到常量池
        if (!isCancelled) {
          const fallback = getAllItemsFromConstants().map((item) => ({
            name: item.name || '未知物品',
            type: normalizeType(item.type),
            description: item.description || '无描述',
            rarity: item.rarity || '普通',
            effect: item.effect,
            permanentEffect: item.permanentEffect,
            isEquippable: item.isEquippable,
            equipmentSlot: item.equipmentSlot,
            advancedItemType: item.advancedItemType,
            advancedItemId: item.advancedItemId,
          }));
          setTemplateItems(fallback);
        }
      } finally {
        if (!isCancelled) setIsTemplateLoading(false);
      }
    };

    if (isOpen) {
      loadTemplateItems();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    const sourceItems = templateItems.length > 0 ? templateItems : INITIAL_ITEMS;
    sourceItems.forEach((item) => categorySet.add(getCategoryLabel(item)));
    return [categoryAll, ...Array.from(categorySet)];
  }, [templateItems]);

  const categorizedItemCount = useMemo(() => {
    const sourceItems = templateItems.length > 0 ? templateItems : INITIAL_ITEMS;
    return sourceItems.reduce<Record<string, number>>((acc, item) => {
      const category = getCategoryLabel(item);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }, [templateItems]);

  const availableRarities = useMemo(() => {
    const sourceItems = templateItems.length > 0 ? templateItems : INITIAL_ITEMS;
    const raritySet = new Set<string>();
    sourceItems.forEach((item) => raritySet.add(item.rarity || '普通'));
    const rarityOrder = ['普通', '稀有', '传说', '仙品'];
    const sortedRarities = Array.from(raritySet).sort((a, b) => {
      const aIdx = rarityOrder.indexOf(a);
      const bIdx = rarityOrder.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b, 'zh-CN');
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
    return [rarityAll, ...sortedRarities];
  }, [templateItems]);

  const rarityItemCount = useMemo(() => {
    const sourceItems = templateItems.length > 0 ? templateItems : INITIAL_ITEMS;
    return sourceItems.reduce<Record<string, number>>((acc, item) => {
      const rarity = item.rarity || '普通';
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});
  }, [templateItems]);

  const filteredItems = useMemo(() => {
    const sourceItems = templateItems.length > 0 ? templateItems : INITIAL_ITEMS;
    const query = search.trim().toLowerCase();
    return sourceItems.filter((item) => {
      const categoryMatched =
        selectedCategory === categoryAll || getCategoryLabel(item) === selectedCategory;
      if (!categoryMatched) return false;
      const rarity = item.rarity || '普通';
      const rarityMatched = selectedRarity === rarityAll || rarity === selectedRarity;
      if (!rarityMatched) return false;
      const name = item.name?.toLowerCase?.() ?? '';
      const desc = item.description?.toLowerCase?.() ?? '';
      if (!query) return true;
      return name.includes(query) || desc.includes(query);
    }).slice(0, 120);
  }, [search, selectedCategory, selectedRarity, templateItems]);

  const getRarityClassName = (rarity?: string) => {
    switch (rarity) {
      case '仙品':
        return 'text-amber-300 border-amber-600 bg-amber-950/40';
      case '传说':
        return 'text-fuchsia-300 border-fuchsia-600 bg-fuchsia-950/40';
      case '稀有':
        return 'text-blue-300 border-blue-600 bg-blue-950/40';
      default:
        return 'text-stone-300 border-stone-600 bg-stone-900/40';
    }
  };

  const applyPatch = (patch: Partial<PlayerStats>, message?: string) => {
    onUpdatePlayer(patch);
    if (message) showSuccess(message);
  };

  const updateDraftField = (field: keyof PlayerSettingsDraft, rawValue: string) => {
    const sanitized = normalizeNumericInput(rawValue);
    setPlayerDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: sanitized };
    });
  };

  const handleApplyPlayerSettings = () => {
    if (!playerDraft) return;

    const maxLevel = 9;
    const safeLevel = Math.max(1, Math.min(maxLevel, toNonNegativeInt(playerDraft.realmLevel, 1)));

    const draftMaxHp = Math.max(1, toNonNegativeInt(playerDraft.maxHp, 1));
    const draftHp = Math.max(1, toNonNegativeInt(playerDraft.hp, draftMaxHp));
    const draftMaxExp = Math.max(1, toNonNegativeInt(playerDraft.maxExp, 1));
    const draftExp = Math.max(0, toNonNegativeInt(playerDraft.exp, 0));

    const safeMaxHp = draftMaxHp + equipmentBonuses.hp;
    const safeHp = Math.min(draftHp + equipmentBonuses.hp, safeMaxHp);
    const safeMaxExp = draftMaxExp;
    const safeExp = Math.min(draftExp, safeMaxExp);

    applyPatch(
      {
        realm: playerDraft.realm,
        realmLevel: safeLevel,
        maxExp: safeMaxExp,
        exp: safeExp,
        maxHp: safeMaxHp,
        hp: safeHp,
        spiritStones: Math.max(0, toNonNegativeInt(playerDraft.spiritStones, 0)),
        lotteryTickets: Math.max(0, toNonNegativeInt(playerDraft.lotteryTickets, 0)),
        attack: Math.max(1, toNonNegativeInt(playerDraft.attack, 1)) + equipmentBonuses.attack,
        defense: Math.max(1, toNonNegativeInt(playerDraft.defense, 1)) + equipmentBonuses.defense,
        spirit: Math.max(1, toNonNegativeInt(playerDraft.spirit, 1)) + equipmentBonuses.spirit,
        physique: Math.max(1, toNonNegativeInt(playerDraft.physique, 1)) + equipmentBonuses.physique,
        speed: Math.max(1, toNonNegativeInt(playerDraft.speed, 1)) + equipmentBonuses.speed,
      },
      '已应用角色设置'
    );
  };

  const handleAddItem = (template: (typeof INITIAL_ITEMS)[number]) => {
    const quantity = Math.max(1, Math.floor(injectCount || 1));
    const updatedInventory = [...player.inventory];
    const existingIndex = updatedInventory.findIndex((item) => item.name === template.name);

    if (existingIndex >= 0) {
      const existing = updatedInventory[existingIndex];
      updatedInventory[existingIndex] = {
        ...existing,
        quantity: (existing.quantity || 1) + quantity,
      };
    } else {
      updatedInventory.push({
        ...template,
        id: `${template.name}-${Date.now()}`,
        quantity,
      });
    }

    applyPatch({ inventory: updatedInventory }, `已添加 ${template.name} x${quantity}`);
  };

  const quickInjectByCategory = (category: ItemType, count = 5) => {
    const templates = INITIAL_ITEMS.filter((item) => item.type === category).slice(0, count);
    if (templates.length === 0) {
      showInfo(`当前没有可注入的 ${category} 模板`);
      return;
    }
    const updatedInventory = [...player.inventory];
    const quantity = Math.max(1, Math.floor(injectCount || 1));

    templates.forEach((template) => {
      const existingIndex = updatedInventory.findIndex((item) => item.name === template.name);
      if (existingIndex >= 0) {
        const existing = updatedInventory[existingIndex];
        updatedInventory[existingIndex] = {
          ...existing,
          quantity: (existing.quantity || 1) + quantity,
        };
      } else {
        updatedInventory.push({
          ...template,
          id: `${template.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          quantity,
        });
      }
    });

    applyPatch({ inventory: updatedInventory }, `已批量注入 ${templates.length} 个${category}`);
  };

  const resetDebugModeAndClose = () => {
    localStorage.removeItem(STORAGE_KEYS.DEBUG_MODE);
    showInfo('调试模式标记已清除，刷新后将关闭。');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="调试模式（本地开发）" size="full">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-stone-700 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded text-sm border transition-colors ${
                activeTab === tab.key
                  ? 'bg-red-900/70 border-red-500 text-red-100'
                  : 'bg-ink-800 border-stone-600 text-stone-300 hover:bg-ink-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'quick' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => applyPatch({ hp: player.maxHp }, '气血已回满')}
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <Heart size={16} className="text-green-400" />
              气血回满
            </button>
            <button
              onClick={() => applyPatch({ exp: Math.max(player.maxExp - 1, 0) }, '经验已设置到突破前')}
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <FlaskConical size={16} className="text-blue-400" />
              经验设为突破前
            </button>
            <button
              onClick={() => applyPatch({ spiritStones: player.spiritStones + 100000 }, '灵石 +100000')}
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <Bug size={16} className="text-yellow-400" />
              灵石 +100000
            </button>
            <button
              onClick={() => applyPatch({ lotteryTickets: player.lotteryTickets + 100 }, '抽奖券 +100')}
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <Sword size={16} className="text-purple-400" />
              抽奖券 +100
            </button>
            <button
              onClick={() =>
                applyPatch({
                  hp: player.maxHp,
                  spiritStones: player.spiritStones + 1000000,
                  lotteryTickets: player.lotteryTickets + 500,
                }, '已应用调试资源包')
              }
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <Bug size={16} className="text-red-400" />
              一键资源包
            </button>
            <button
              onClick={() => quickInjectByCategory(ItemType.Pill, 8)}
              className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
            >
              <FlaskConical size={16} className="text-emerald-400" />
              批量注入丹药
            </button>
          </div>
        )}

        {activeTab === 'player' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="text-sm text-stone-300">
                当前气血（不含装备）
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.hp ?? ''}
                  onChange={(e) => updateDraftField('hp', e.target.value)}
                />
              </label>
              <label className="text-sm text-stone-300">
                最大气血（不含装备）
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.maxHp ?? ''}
                  onChange={(e) => updateDraftField('maxHp', e.target.value)}
                />
              </label>
              <label className="text-sm text-stone-300">
                当前修为
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.exp ?? ''}
                  onChange={(e) => updateDraftField('exp', e.target.value)}
                />
              </label>
              <label className="text-sm text-stone-300">
                升级需求修为
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.maxExp ?? ''}
                  onChange={(e) => updateDraftField('maxExp', e.target.value)}
                />
              </label>
              <label className="text-sm text-stone-300">
                灵石
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.spiritStones ?? ''}
                  onChange={(e) => updateDraftField('spiritStones', e.target.value)}
                />
              </label>
              <label className="text-sm text-stone-300">
                抽奖券
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.lotteryTickets ?? ''}
                  onChange={(e) => updateDraftField('lotteryTickets', e.target.value)}
                />
              </label>
            </div>

            <div className="rounded border border-stone-700 bg-ink-900/60 p-3">
              <div className="text-stone-300 text-sm mb-3">核心属性调整（不含装备加成）</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <label className="text-sm text-stone-300">
                  攻击
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                    value={playerDraft?.attack ?? ''}
                    onChange={(e) => updateDraftField('attack', e.target.value)}
                  />
                </label>
                <label className="text-sm text-stone-300">
                  防御
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                    value={playerDraft?.defense ?? ''}
                    onChange={(e) => updateDraftField('defense', e.target.value)}
                  />
                </label>
                <label className="text-sm text-stone-300">
                  神识
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                    value={playerDraft?.spirit ?? ''}
                    onChange={(e) => updateDraftField('spirit', e.target.value)}
                  />
                </label>
                <label className="text-sm text-stone-300">
                  体魄
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                    value={playerDraft?.physique ?? ''}
                    onChange={(e) => updateDraftField('physique', e.target.value)}
                  />
                </label>
                <label className="text-sm text-stone-300">
                  速度
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                    value={playerDraft?.speed ?? ''}
                    onChange={(e) => updateDraftField('speed', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <label className="text-sm text-stone-300">
                境界
                <select
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.realm ?? player.realm}
                  onChange={(e) =>
                    setPlayerDraft((prev) => (prev ? { ...prev, realm: e.target.value as RealmType } : prev))
                  }
                >
                  {REALM_ORDER.map((realm) => (
                    <option key={realm} value={realm}>
                      {realm}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-stone-300">
                境界重数
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="mt-1 w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  value={playerDraft?.realmLevel ?? ''}
                  onChange={(e) => updateDraftField('realmLevel', e.target.value)}
                />
              </label>
              <button
                onClick={handleApplyPlayerSettings}
                className="h-[42px] rounded border border-blue-500 bg-blue-900/60 hover:bg-blue-800 text-blue-100"
              >
                应用设置
              </button>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-3">
            <div className="rounded border border-stone-700 bg-ink-900/60 p-3 space-y-3">
              <label className="block text-sm text-stone-300">
                <span className="block mb-1">搜索物品（名称/描述）</span>
                <div className="mt-1 relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-500"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-ink-800 border border-stone-600 rounded pl-8 pr-3 py-2"
                    placeholder="输入关键词"
                  />
                </div>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[220px_220px_140px] gap-3">
                <label className="text-sm text-stone-300">
                  <span className="block mb-1">分类</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  >
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-stone-300">
                  <span className="block mb-1">稀有度</span>
                  <select
                    value={selectedRarity}
                    onChange={(e) => setSelectedRarity(e.target.value)}
                    className="w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  >
                    {availableRarities.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-stone-300">
                  <span className="block mb-1">数量</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={injectCount}
                    onChange={(e) => setInjectCount(Math.max(1, toNonNegativeInt(e.target.value, 1)))}
                    className="w-full bg-ink-800 border border-stone-600 rounded px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <div className="rounded border border-stone-700 bg-ink-900/60 p-3">
              <div className="text-stone-200 text-sm mb-2">
                当前可生成物品：
                <span className="text-mystic-gold"> {templateItems.length > 0 ? templateItems.length : INITIAL_ITEMS.length}</span> 个
                {selectedCategory !== categoryAll && (
                  <span className="text-stone-400">（{selectedCategory} 共 {categorizedItemCount[selectedCategory] || 0} 个）</span>
                )}
                {selectedRarity !== rarityAll && (
                  <span className="text-stone-400">（{selectedRarity} 共 {rarityItemCount[selectedRarity] || 0} 个）</span>
                )}
                <span className="text-stone-500 ml-2">
                  {isTemplateLoading ? '（IndexedDB 同步中）' : '（来源：IndexedDB + 常量池）'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-2">
                {availableCategories.map((category) => (
                  <button
                    type="button"
                    key={`tag-${category}`}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 rounded border ${
                      selectedCategory === category
                        ? 'border-green-600 text-green-100 bg-green-800/80'
                        : 'border-stone-600 text-stone-300 bg-ink-800 hover:bg-ink-700'
                    }`}
                  >
                    {category} {category === categoryAll ? '' : `(${categorizedItemCount[category] || 0})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {availableRarities.map((rarity) => (
                  <button
                    type="button"
                    key={`rarity-${rarity}`}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-2 py-1 rounded border ${
                      selectedRarity === rarity
                        ? 'border-green-600 text-green-100 bg-green-800/80'
                        : `${getRarityClassName(rarity)} hover:brightness-110`
                    }`}
                  >
                    {rarity} {rarity === rarityAll ? '' : `(${rarityItemCount[rarity] || 0})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {filteredItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 p-3 rounded border border-stone-700 bg-ink-800"
                >
                  <div className="min-w-0">
                    <div className={`text-sm truncate font-medium ${
                      item.rarity === '仙品'
                        ? 'text-amber-300'
                        : item.rarity === '传说'
                          ? 'text-fuchsia-300'
                          : item.rarity === '稀有'
                            ? 'text-blue-300'
                            : 'text-stone-100'
                    }`}>{item.name}</div>
                    <div className="text-stone-400 text-xs truncate">{item.description}</div>
                    <div className="text-xs mt-1 flex items-center gap-2">
                      <span className="text-stone-500">{getCategoryLabel(item)}</span>
                      <span className={`px-1.5 py-0.5 rounded border ${getRarityClassName(item.rarity)}`}>
                        {item.rarity || '普通'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItem(item)}
                    className="shrink-0 px-3 py-1.5 rounded bg-green-800 hover:bg-green-700 border border-green-600 text-sm"
                  >
                    添加
                  </button>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center text-stone-400 text-sm py-6 border border-dashed border-stone-700 rounded">
                  当前筛选条件下没有可显示物品
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-3">
            <div className="rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
              该区域操作不可逆，建议先手动导出/保存。
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => onTriggerDeath?.()}
                className="flex items-center gap-2 p-3 rounded border border-red-700 bg-red-900/60 hover:bg-red-800/70"
              >
                <AlertTriangle size={16} />
                触发死亡
              </button>
              <button
                onClick={() => onChallengeDaoCombining?.()}
                className="flex items-center gap-2 p-3 rounded border border-orange-700 bg-orange-900/60 hover:bg-orange-800/70"
              >
                <Sword size={16} />
                挑战天地之魄
              </button>
              <button
                onClick={resetDebugModeAndClose}
                className="flex items-center gap-2 p-3 rounded border border-stone-600 bg-ink-800 hover:bg-ink-700"
              >
                <Bug size={16} />
                关闭调试模式（刷新后生效）
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(DebugModal);

