import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Minus,
  Package,
  Sparkles,
} from 'lucide-react';
import {
  PlayerStats,
  RealmType,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
  Talent,
} from '../types';
import { REALM_DATA, REALM_ORDER, TALENTS } from '../constants';

// 生成唯一ID
const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

// 装备模板列表（从battleService的LOOT_ITEMS中提取）
const EQUIPMENT_TEMPLATES: Array<{
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  effect?: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    exp?: number;
  };
  description?: string;
}> = [
  // 武器
  {
    name: '精铁剑',
    type: ItemType.Weapon,
    rarity: '普通',
    slot: EquipmentSlot.Weapon,
    effect: { attack: 10 },
    description: '普通的精铁剑',
  },
  {
    name: '玄铁刀',
    type: ItemType.Weapon,
    rarity: '稀有',
    slot: EquipmentSlot.Weapon,
    effect: { attack: 30 },
    description: '锋利的玄铁刀',
  },
  {
    name: '星辰剑',
    type: ItemType.Weapon,
    rarity: '传说',
    slot: EquipmentSlot.Weapon,
    effect: { attack: 80, speed: 10 },
    description: '蕴含星辰之力的宝剑',
  },
  {
    name: '仙灵剑',
    type: ItemType.Weapon,
    rarity: '仙品',
    slot: EquipmentSlot.Weapon,
    effect: { attack: 200, spirit: 50 },
    description: '仙灵之力凝聚的神剑',
  },
  // 护甲 - 头部
  {
    name: '布帽',
    type: ItemType.Armor,
    rarity: '普通',
    slot: EquipmentSlot.Head,
    effect: { defense: 3, hp: 15 },
    description: '普通的布帽',
  },
  {
    name: '铁头盔',
    type: ItemType.Armor,
    rarity: '普通',
    slot: EquipmentSlot.Head,
    effect: { defense: 8, hp: 30 },
    description: '坚固的铁制头盔',
  },
  {
    name: '玄铁头盔',
    type: ItemType.Armor,
    rarity: '稀有',
    slot: EquipmentSlot.Head,
    effect: { defense: 25, hp: 60, spirit: 10 },
    description: '玄铁打造的头盔',
  },
  {
    name: '星辰头冠',
    type: ItemType.Armor,
    rarity: '传说',
    slot: EquipmentSlot.Head,
    effect: { defense: 60, hp: 150, spirit: 20, attack: 10 },
    description: '星辰之力凝聚的头冠',
  },
  {
    name: '仙灵道冠',
    type: ItemType.Armor,
    rarity: '仙品',
    slot: EquipmentSlot.Head,
    effect: { defense: 150, hp: 400, spirit: 50, attack: 30 },
    description: '仙灵道冠',
  },
  // 护甲 - 胸甲
  {
    name: '布甲',
    type: ItemType.Armor,
    rarity: '普通',
    slot: EquipmentSlot.Chest,
    effect: { defense: 5, hp: 20 },
    description: '普通的布甲',
  },
  {
    name: '铁甲',
    type: ItemType.Armor,
    rarity: '普通',
    slot: EquipmentSlot.Chest,
    effect: { defense: 15, hp: 50 },
    description: '坚固的铁甲',
  },
  {
    name: '玄铁甲',
    type: ItemType.Armor,
    rarity: '稀有',
    slot: EquipmentSlot.Chest,
    effect: { defense: 40, hp: 100 },
    description: '玄铁打造的护甲',
  },
  {
    name: '星辰战甲',
    type: ItemType.Armor,
    rarity: '传说',
    slot: EquipmentSlot.Chest,
    effect: { defense: 100, hp: 300, attack: 20 },
    description: '星辰战甲',
  },
  {
    name: '仙灵法袍',
    type: ItemType.Armor,
    rarity: '仙品',
    slot: EquipmentSlot.Chest,
    effect: { defense: 250, hp: 800, spirit: 100 },
    description: '仙灵法袍',
  },
  // 首饰
  {
    name: '护身符',
    type: ItemType.Accessory,
    rarity: '普通',
    slot: EquipmentSlot.Accessory1,
    effect: { defense: 3, hp: 15 },
    description: '普通的护身符',
  },
  {
    name: '聚灵玉佩',
    type: ItemType.Accessory,
    rarity: '稀有',
    slot: EquipmentSlot.Accessory1,
    effect: { spirit: 20, exp: 10 },
    description: '聚灵玉佩',
  },
  {
    name: '星辰项链',
    type: ItemType.Accessory,
    rarity: '传说',
    slot: EquipmentSlot.Accessory1,
    effect: { attack: 30, defense: 30, speed: 15 },
    description: '星辰项链',
  },
  {
    name: '仙灵手镯',
    type: ItemType.Accessory,
    rarity: '仙品',
    slot: EquipmentSlot.Accessory1,
    effect: { attack: 80, defense: 80, hp: 200 },
    description: '仙灵手镯',
  },
  // 戒指
  {
    name: '铁戒指',
    type: ItemType.Ring,
    rarity: '普通',
    slot: EquipmentSlot.Ring1,
    effect: { attack: 5 },
    description: '普通的铁戒指',
  },
  {
    name: '金戒指',
    type: ItemType.Ring,
    rarity: '稀有',
    slot: EquipmentSlot.Ring1,
    effect: { attack: 15, defense: 15 },
    description: '金戒指',
  },
  {
    name: '星辰戒指',
    type: ItemType.Ring,
    rarity: '传说',
    slot: EquipmentSlot.Ring1,
    effect: { attack: 40, defense: 40, speed: 20 },
    description: '星辰戒指',
  },
  {
    name: '仙灵戒指',
    type: ItemType.Ring,
    rarity: '仙品',
    slot: EquipmentSlot.Ring1,
    effect: { attack: 100, defense: 100, spirit: 50 },
    description: '仙灵戒指',
  },
  // 法宝
  {
    name: '聚灵珠',
    type: ItemType.Artifact,
    rarity: '普通',
    slot: EquipmentSlot.Artifact1,
    effect: { spirit: 10, exp: 5 },
    description: '聚灵珠',
  },
  {
    name: '护体符',
    type: ItemType.Artifact,
    rarity: '普通',
    slot: EquipmentSlot.Artifact1,
    effect: { defense: 10, hp: 30 },
    description: '护体符',
  },
  {
    name: '玄灵镜',
    type: ItemType.Artifact,
    rarity: '稀有',
    slot: EquipmentSlot.Artifact1,
    effect: { spirit: 30, defense: 20 },
    description: '玄灵镜',
  },
  {
    name: '星辰盘',
    type: ItemType.Artifact,
    rarity: '传说',
    slot: EquipmentSlot.Artifact1,
    effect: { attack: 50, defense: 50, spirit: 50 },
    description: '星辰盘',
  },
  {
    name: '仙灵宝珠',
    type: ItemType.Artifact,
    rarity: '仙品',
    slot: EquipmentSlot.Artifact1,
    effect: { attack: 150, defense: 150, spirit: 150, hp: 500 },
    description: '仙灵宝珠',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpdatePlayer: (updates: Partial<PlayerStats>) => void;
}

const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
}) => {
  const [localPlayer, setLocalPlayer] = useState<PlayerStats>(player);
  const [activeTab, setActiveTab] = useState<'equipment' | 'talent'>(
    'equipment'
  );
  const [equipmentFilter, setEquipmentFilter] = useState<ItemRarity | 'all'>(
    'all'
  );

  // 当player变化时更新本地状态
  useEffect(() => {
    setLocalPlayer(player);
  }, [player]);

  // 过滤装备
  const filteredEquipment = useMemo(() => {
    if (equipmentFilter === 'all') return EQUIPMENT_TEMPLATES;
    return EQUIPMENT_TEMPLATES.filter((eq) => eq.rarity === equipmentFilter);
  }, [equipmentFilter]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 确保hp不超过maxHp
    const finalHp = Math.min(localPlayer.hp, localPlayer.maxHp);
    onUpdatePlayer({
      ...localPlayer,
      hp: finalHp,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalPlayer(player);
  };

  const updateField = <K extends keyof PlayerStats>(
    field: K,
    value: PlayerStats[K]
  ) => {
    setLocalPlayer((prev) => ({ ...prev, [field]: value }));
  };

  const adjustNumber = (
    field: keyof PlayerStats,
    delta: number,
    min: number = 0
  ) => {
    setLocalPlayer((prev) => {
      const current = prev[field] as number;
      const newValue = Math.max(min, current + delta);
      return { ...prev, [field]: newValue };
    });
  };

  const handleRealmChange = (newRealm: RealmType) => {
    const realmData = REALM_DATA[newRealm];
    setLocalPlayer((prev) => ({
      ...prev,
      realm: newRealm,
      // 如果境界降低，调整相关属性
      maxHp: Math.max(prev.maxHp, realmData.baseMaxHp),
      hp: Math.min(prev.hp, Math.max(prev.maxHp, realmData.baseMaxHp)),
      attack: Math.max(prev.attack, realmData.baseAttack),
      defense: Math.max(prev.defense, realmData.baseDefense),
      spirit: Math.max(prev.spirit, realmData.baseSpirit),
      physique: Math.max(prev.physique, realmData.basePhysique),
      speed: Math.max(prev.speed, realmData.baseSpeed),
    }));
  };

  const handleRealmLevelChange = (newLevel: number) => {
    const clampedLevel = Math.max(1, Math.min(9, newLevel));
    setLocalPlayer((prev) => ({
      ...prev,
      realmLevel: clampedLevel,
    }));
  };

  // 添加装备到背包
  const handleAddEquipment = (template: (typeof EQUIPMENT_TEMPLATES)[0]) => {
    const newItem: Item = {
      id: uid(),
      name: template.name,
      type: template.type,
      description: template.description || `${template.name}的装备`,
      quantity: 1,
      rarity: template.rarity,
      level: 0,
      isEquippable: true,
      equipmentSlot: template.slot,
      effect: template.effect,
    };

    setLocalPlayer((prev) => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
    }));
  };

  // 选择天赋
  const handleSelectTalent = (talent: Talent) => {
    const oldTalent = TALENTS.find((t) => t.id === localPlayer.talentId);
    const newTalent = talent;

    // 计算属性变化
    let attackChange =
      (newTalent.effects.attack || 0) - (oldTalent?.effects.attack || 0);
    let defenseChange =
      (newTalent.effects.defense || 0) - (oldTalent?.effects.defense || 0);
    let hpChange = (newTalent.effects.hp || 0) - (oldTalent?.effects.hp || 0);
    let spiritChange =
      (newTalent.effects.spirit || 0) - (oldTalent?.effects.spirit || 0);
    let physiqueChange =
      (newTalent.effects.physique || 0) - (oldTalent?.effects.physique || 0);
    let speedChange =
      (newTalent.effects.speed || 0) - (oldTalent?.effects.speed || 0);
    let luckChange =
      (newTalent.effects.luck || 0) - (oldTalent?.effects.luck || 0);

    setLocalPlayer((prev) => ({
      ...prev,
      talentId: talent.id,
      attack: prev.attack + attackChange,
      defense: prev.defense + defenseChange,
      maxHp: prev.maxHp + hpChange,
      hp: prev.hp + hpChange,
      spirit: prev.spirit + spiritChange,
      physique: prev.physique + physiqueChange,
      speed: prev.speed + speedChange,
      luck: prev.luck + luckChange,
    }));
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case '普通':
        return 'text-stone-400 border-stone-600';
      case '稀有':
        return 'text-blue-400 border-blue-600';
      case '传说':
        return 'text-purple-400 border-purple-600';
      case '仙品':
        return 'text-yellow-400 border-yellow-600';
      default:
        return 'text-stone-400 border-stone-600';
    }
  };

  // 获取稀有度背景色
  const getRarityBgColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case '普通':
        return 'bg-stone-800/50';
      case '稀有':
        return 'bg-blue-900/20';
      case '传说':
        return 'bg-purple-900/20';
      case '仙品':
        return 'bg-yellow-900/20';
      default:
        return 'bg-stone-800/50';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[90vh] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center md:rounded-t-2xl shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-red-500">
            🔧 调试模式
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 警告提示 */}
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
            ⚠️ 调试模式：修改数据可能导致游戏异常，请谨慎操作！
          </div>

          {/* 基础信息 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              基础信息
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  玩家名称
                </label>
                <input
                  type="text"
                  value={localPlayer.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 境界和等级 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              境界与等级
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界
                </label>
                <select
                  value={localPlayer.realm}
                  onChange={(e) =>
                    handleRealmChange(e.target.value as RealmType)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  {REALM_ORDER.map((realm) => (
                    <option key={realm} value={realm}>
                      {realm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界等级 (1-9)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel - 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={localPlayer.realmLevel}
                    onChange={(e) =>
                      handleRealmLevelChange(parseInt(e.target.value) || 1)
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-center"
                  />
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel + 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  经验值
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('exp', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.exp}
                    onChange={(e) =>
                      updateField(
                        'exp',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('exp', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  最大经验值
                </label>
                <input
                  type="number"
                  min="1"
                  value={localPlayer.maxExp}
                  onChange={(e) =>
                    updateField(
                      'maxExp',
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 属性 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              属性
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'hp', label: '气血', maxKey: 'maxHp' },
                { key: 'maxHp', label: '最大气血' },
                { key: 'attack', label: '攻击力' },
                { key: 'defense', label: '防御力' },
                { key: 'spirit', label: '神识' },
                { key: 'physique', label: '体魄' },
                { key: 'speed', label: '速度' },
                { key: 'luck', label: '幸运值' },
              ].map(({ key, label, maxKey }) => {
                const value = localPlayer[key as keyof PlayerStats] as number;
                const maxValue = maxKey
                  ? (localPlayer[maxKey as keyof PlayerStats] as number)
                  : undefined;
                return (
                  <div key={key}>
                    <label className="block text-sm text-stone-400 mb-1">
                      {label}
                      {maxValue !== undefined && ` (最大: ${maxValue})`}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, -100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        -100
                      </button>
                      <input
                        type="number"
                        min={maxValue !== undefined ? 0 : undefined}
                        max={maxValue}
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          const clampedValue =
                            maxValue !== undefined
                              ? Math.max(0, Math.min(maxValue, newValue))
                              : Math.max(0, newValue);
                          updateField(key as keyof PlayerStats, clampedValue);
                        }}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                      />
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, 100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 资源 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              资源
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  灵石
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('spiritStones', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.spiritStones}
                    onChange={(e) =>
                      updateField(
                        'spiritStones',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('spiritStones', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  抽奖券
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('lotteryTickets', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.lotteryTickets}
                    onChange={(e) =>
                      updateField(
                        'lotteryTickets',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('lotteryTickets', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  属性点
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('attributePoints', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.attributePoints}
                    onChange={(e) =>
                      updateField(
                        'attributePoints',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('attributePoints', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  传承等级
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', -1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={localPlayer.inheritanceLevel}
                    onChange={(e) =>
                      updateField(
                        'inheritanceLevel',
                        Math.max(0, Math.min(4, parseInt(e.target.value) || 0))
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', 1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              快速操作
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    hp: prev.maxHp,
                  }));
                }}
                className="bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-sm"
              >
                回满血
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    exp: prev.maxExp - 1,
                  }));
                }}
                className="bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm"
              >
                经验差1升级
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    spiritStones: 999999,
                  }));
                }}
                className="bg-yellow-700 hover:bg-yellow-600 text-white rounded px-3 py-2 text-sm"
              >
                灵石999K
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    lotteryTickets: 999,
                  }));
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white rounded px-3 py-2 text-sm"
              >
                抽奖券999
              </button>
            </div>
          </div>

          {/* 装备和天赋选择 */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-700 pb-2">
              <h3 className="font-bold text-stone-200">装备与天赋</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    activeTab === 'equipment'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <Package size={16} className="inline mr-1" />
                  装备
                </button>
                <button
                  onClick={() => setActiveTab('talent')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    activeTab === 'talent'
                      ? 'bg-red-700 text-white'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  <Sparkles size={16} className="inline mr-1" />
                  天赋
                </button>
              </div>
            </div>

            {/* 装备选择 */}
            {activeTab === 'equipment' && (
              <div>
                {/* 稀有度筛选 */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {(['all', '普通', '稀有', '传说', '仙品'] as const).map(
                    (rarity) => (
                      <button
                        key={rarity}
                        onClick={() => setEquipmentFilter(rarity)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          equipmentFilter === rarity
                            ? 'bg-red-700 text-white'
                            : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                        }`}
                      >
                        {rarity === 'all' ? '全部' : rarity}
                      </button>
                    )
                  )}
                </div>

                {/* 装备卡片列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredEquipment.map((equipment, index) => (
                    <div
                      key={`${equipment.name}-${index}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRarityColor(
                        equipment.rarity
                      )} ${getRarityBgColor(equipment.rarity)}`}
                      onClick={() => handleAddEquipment(equipment)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm">{equipment.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                          {equipment.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mb-2">
                        {equipment.description || equipment.name}
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="text-stone-300">
                          <span className="text-stone-500">部位：</span>
                          {equipment.slot}
                        </div>
                        {equipment.effect && (
                          <div className="text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(equipment.effect)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  exp: '经验',
                                };
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        className="mt-2 w-full bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddEquipment(equipment);
                        }}
                      >
                        添加到背包
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 天赋选择 */}
            {activeTab === 'talent' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  当前天赋：
                  <span className="text-stone-200 ml-2">
                    {TALENTS.find((t) => t.id === localPlayer.talentId)?.name ||
                      '无'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {TALENTS.map((talent) => {
                    const isSelected = localPlayer.talentId === talent.id;
                    return (
                      <div
                        key={talent.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : getRarityColor(talent.rarity)
                        } ${getRarityBgColor(talent.rarity)}`}
                        onClick={() => handleSelectTalent(talent)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{talent.name}</h4>
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                已选择
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {talent.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {talent.description}
                        </p>
                        {Object.keys(talent.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">效果：</span>
                            {Object.entries(talent.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: '攻击',
                                  defense: '防御',
                                  hp: '气血',
                                  spirit: '神识',
                                  physique: '体魄',
                                  speed: '速度',
                                  expRate: '修炼速度',
                                  luck: '幸运',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) {
                              handleSelectTalent(talent);
                            }
                          }}
                          disabled={isSelected}
                        >
                          {isSelected ? '已选择' : '选择天赋'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-800 border-t border-stone-700 p-3 md:p-4 flex justify-end gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors"
          >
            <RotateCcw size={16} />
            重置
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded border border-red-600 transition-colors"
          >
            <Save size={16} />
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
