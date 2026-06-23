import React, { useState } from 'react';
import Modal from './common/Modal';
import {
  X,
  Heart,
  Zap,
  Shield,
  Swords,
  Droplet,
  Package,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { PlayerStats, Pet, ItemRarity } from '../types';
import { PET_TEMPLATES, RARITY_MULTIPLIERS, REALM_ORDER } from '../constants/index';
import BatchFeedModal from './BatchFeedModal';
import BatchReleaseModal from './BatchReleaseModal';
import { getRarityTextColor } from '../utils/rarityUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onActivatePet: (petId: string) => void;
  onDeactivatePet?: () => void;
  onFeedPet: (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => void;
  onBatchFeedItems?: (petId: string, itemIds: string[]) => void;
  onBatchFeedHp?: (petId: string) => void;
  onEvolvePet: (petId: string) => void;
  onPetExpedition?: (petId: string) => void;
  onReleasePet?: (petId: string) => void;
  onBatchReleasePets?: (petIds: string[]) => void;
}

const PetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onActivatePet,
  onDeactivatePet,
  onFeedPet,
  onBatchFeedItems,
  onBatchFeedHp,
  onEvolvePet,
  onPetExpedition,
  onReleasePet,
  onBatchReleasePets,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'hp' | 'item' | 'exp' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isBatchFeedOpen, setIsBatchFeedOpen] = useState(false);
  const [batchFeedPetId, setBatchFeedPetId] = useState<string | null>(null);
  const [expandedPetIds, setExpandedPetIds] = useState<Set<string>>(new Set());
  const [isBatchReleaseOpen, setIsBatchReleaseOpen] = useState(false);
  const [releaseConfirmPetId, setReleaseConfirmPetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activePet = player.pets.find((p) => p.id === player.activePetId);

  // 获取灵宠图片
  const getPetImage = (pet: Pet) => {
    const template = PET_TEMPLATES.find((t) => t.species === pet.species);
    return template?.image || '🐾';
  };

  // 可喂养的物品（所有未装备的物品）
  const equippedItemIds = new Set(Object.values(player.equippedItems).filter(Boolean));
  const feedableItems = player.inventory.filter(item =>
    !equippedItemIds.has(item.id) && item.quantity > 0
  );

  const handleFeedClick = (petId: string) => {
    setSelectedPetId(petId);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedConfirm = () => {
    if (!selectedPetId || !feedType) return;
    if (feedType === 'item' && !selectedItemId) return;

    onFeedPet(selectedPetId, feedType, selectedItemId || undefined);
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

  const handleFeedCancel = () => {
    setSelectedPetId(null);
    setFeedType(null);
    setSelectedItemId(null);
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="灵宠系统"
      size="3xl"
      height="full"
      containerClassName="bg-paper-800 border-stone-600"
      headerClassName="bg-ink-800 border-b border-stone-600"
      contentClassName="space-y-6 bg-paper-800"
      contentPadding="p-6"
    >
          {/* 当前激活的灵宠 */}
          {activePet && (
            <div className="bg-stone-900 rounded p-4 border-2 border-yellow-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{getPetImage(activePet)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-400">
                      {activePet.name}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({activePet.species})
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                        已激活
                      </span>
                      {onDeactivatePet && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivatePet();
                          }}
                          className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-stone-300"
                          title="取消激活"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Swords className="text-red-400" size={16} />
                  <span className="text-sm">
                    攻击: {Math.floor(activePet.stats.attack)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-400" size={16} />
                  <span className="text-sm">
                    防御: {Math.floor(activePet.stats.defense)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="text-green-400" size={16} />
                  <span className="text-sm">气血: {Math.floor(activePet.stats.hp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-400" size={16} />
                  <span className="text-sm">速度: {Math.floor(activePet.stats.speed)}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>等级: {activePet.level}</span>
                  <span>
                    经验: {activePet.exp} / {activePet.maxExp}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (activePet.exp / activePet.maxExp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>亲密度</span>
                  <span>{activePet.affection} / 100</span>
                </div>
                <div className="w-full bg-stone-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${activePet.affection}%` }}
                  />
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  亲密度影响：治疗技能效果 +{Math.floor(activePet.affection / 2)}%，普通攻击 +{Math.floor(activePet.affection * 0.5)}点
                </div>
              </div>
              {/* 进化阶段显示 */}
              <div className="mb-3">
                <div className="text-sm mb-1">
                  <span>进化阶段: </span>
                  <span className="font-bold">
                    {activePet.evolutionStage === 0 ? '幼年期' : activePet.evolutionStage === 1 ? '成熟期' : '完全体'}
                  </span>
                </div>
              </div>
              {/* 技能列表 */}
              {activePet.skills && activePet.skills.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-bold mb-2">技能列表</div>
                  <div className="space-y-2">
                    {activePet.skills.map((skill) => {
                      const cooldown = activePet.skillCooldowns?.[skill.id] || 0;
                      const getSkillTypeColor = (type: string) => {
                        switch (type) {
                          case 'attack': return 'text-red-400';
                          case 'defense': return 'text-blue-400';
                          case 'support': return 'text-green-400';
                          case 'passive': return 'text-purple-400';
                          default: return 'text-stone-400';
                        }
                      };
                      const getSkillTypeName = (type: string) => {
                        switch (type) {
                          case 'attack': return '攻击';
                          case 'defense': return '防御';
                          case 'support': return '辅助';
                          case 'passive': return '被动';
                          default: return type;
                        }
                      };
                      return (
                        <div key={skill.id} className="bg-stone-800 rounded p-2 border border-stone-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{skill.name}</span>
                            <span className={`text-xs ${getSkillTypeColor(skill.type)}`}>
                              {getSkillTypeName(skill.type)}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mb-1">{skill.description}</div>
                          <div className="text-xs text-stone-500">
                            {skill.effect.damage && `伤害: ${skill.effect.damage} `}
                            {skill.effect.damageMultiplier && `伤害倍率: ${skill.effect.damageMultiplier}x `}
                            {skill.effect.heal && `治疗: ${skill.effect.heal} `}
                            {skill.effect.healPercent && `治疗: ${Math.floor(skill.effect.healPercent * 100)}% `}
                            {skill.effect.buff && (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                {skill.effect.buff.attack && <span className="text-orange-300">攻击+${skill.effect.buff.attack}</span>}
                                {skill.effect.buff.attackPercent && <span className="text-orange-400">攻击+${Math.floor(skill.effect.buff.attackPercent * 100)}%</span>}
                                {skill.effect.buff.defense && <span className="text-blue-300">防御+${skill.effect.buff.defense}</span>}
                                {skill.effect.buff.defensePercent && <span className="text-blue-400">防御+${Math.floor(skill.effect.buff.defensePercent * 100)}%</span>}
                                {skill.effect.buff.speedPercent && <span className="text-cyan-300">速度+${Math.floor(skill.effect.buff.speedPercent * 100)}%</span>}
                                {skill.effect.buff.critChance && <span className="text-red-400">暴击+${Math.floor(skill.effect.buff.critChance * 100)}%</span>}
                                {skill.effect.buff.dodge && <span className="text-emerald-300">闪避+${Math.floor(skill.effect.buff.dodge * 100)}%</span>}
                                {skill.effect.buff.hp && <span className="text-green-300">气血+${skill.effect.buff.hp}</span>}
                              </div>
                            )}
                            {skill.cooldown && (
                              <span className="mt-1 block">
                                {cooldown > 0 ? (
                                  <span className="text-yellow-400 font-bold">冷却中: {cooldown}回合</span>
                                ) : (
                                  <span className="text-green-400">冷却: {skill.cooldown}回合</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* 进化条件显示 */}
              {activePet.evolutionStage < 2 && (() => {
                const template = PET_TEMPLATES.find((t) => t.species === activePet.species);
                if (!template?.evolutionRequirements) return null;
                const nextStage = activePet.evolutionStage + 1;
                const requirements = nextStage === 1
                  ? (template.evolutionRequirements.stage1 || template.evolutionRequirements)
                  : (template.evolutionRequirements.stage2 || template.evolutionRequirements);
                const hasLevel = activePet.level >= (requirements.level || 0);
                const missingItems: string[] = [];
                if (requirements.items) {
                  requirements.items.forEach((req) => {
                    const item = player.inventory.find((i) => i.name === req.name);
                    if (!item || item.quantity < req.quantity) {
                      missingItems.push(`${req.name} x${req.quantity}`);
                    }
                  });
                }
                const canEvolve = hasLevel && missingItems.length === 0;
                return (
                  <div className="mb-3 p-2 bg-stone-800 rounded border border-stone-700">
                    <div className="text-sm font-bold mb-2">
                      进化到{nextStage === 1 ? '成熟期' : '完全体'}条件：
                    </div>
                    <div className="text-xs space-y-1">
                      <div className={hasLevel ? 'text-green-400' : 'text-red-400'}>
                        ✓ 等级: {activePet.level} / {requirements.level || 0} {hasLevel ? '✓' : '✗'}
                      </div>
                      {requirements.items && requirements.items.length > 0 && (
                        <div>
                          <div className="mb-1">材料需求:</div>
                          {requirements.items.map((req, idx) => {
                            const item = player.inventory.find((i) => i.name === req.name);
                            const hasItem = item && item.quantity >= req.quantity;
                            return (
                              <div key={idx} className={hasItem ? 'text-green-400' : 'text-red-400'}>
                                {hasItem ? '✓' : '✗'} {req.name} x{req.quantity}
                                {item && ` (拥有: ${item.quantity})`}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {canEvolve && (
                        <div className="text-green-400 font-bold mt-2">✓ 可以进化！</div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleFeedClick(activePet.id)}
                  className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-sm"
                >
                  喂养
                </button>
                {onPetExpedition && (
                  <button
                    onClick={() => onPetExpedition(activePet.id)}
                    className="flex-1 px-4 py-2 bg-teal-900 hover:bg-teal-800 rounded border border-teal-700 text-sm flex items-center justify-center gap-2"
                    title={`灵兽秘径 - 消耗 ${Math.floor(3000 + Math.max(0, REALM_ORDER.indexOf(player.realm)) * 4500 + activePet.evolutionStage * 9000)} 灵石 + ${Math.max(200, Math.floor(player.maxHp * (0.18 + activePet.evolutionStage * 0.07)))} 气血 + ${Math.max(100, Math.floor(player.maxExp * (0.08 + activePet.evolutionStage * 0.04)))} 修为`}
                  >
                    <Compass size={16} />
                    <span>秘径</span>
                    <span className="text-yellow-400 text-[10px] ml-1">
                      💰{Math.floor(3000 + Math.max(0, REALM_ORDER.indexOf(player.realm)) * 4500 + activePet.evolutionStage * 9000)}
                    </span>
                  </button>
                )}
                {onBatchFeedItems && (
                  <button
                    onClick={() => {
                      setBatchFeedPetId(activePet.id);
                      setIsBatchFeedOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-sm"
                    title="批量喂养"
                  >
                    <Layers size={16} />
                  </button>
                )}
                {activePet.evolutionStage < 2 && (
                  <button
                    onClick={() => onEvolvePet(activePet.id)}
                    className="flex-1 px-4 py-2 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 text-sm"
                  >
                    进化
                  </button>
                )}
                {onReleasePet && (
                  <button
                    onClick={() => setReleaseConfirmPetId(activePet.id)}
                    className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-sm"
                    title="放生"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 所有灵宠列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">
                我的灵宠 ({player.pets.length})
              </h3>
              {onBatchReleasePets && player.pets.length > 0 && (
                <button
                  onClick={() => setIsBatchReleaseOpen(true)}
                  className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  批量放生
                </button>
              )}
            </div>
            {player.pets.length === 0 ? (
              <div className="bg-stone-900 rounded p-4 border border-stone-700 text-center text-stone-500">
                还没有灵宠，快去抽奖或探索获得吧！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className={`bg-stone-900 rounded p-4 border ${
                      pet.id === player.activePetId
                        ? 'border-yellow-600'
                        : 'border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">{getPetImage(pet)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span
                              className={`font-bold ${getRarityTextColor(pet.rarity as ItemRarity)}`}
                            >
                              {pet.name}
                            </span>
                            <span className="text-xs text-stone-500 ml-2">
                              Lv.{pet.level}
                            </span>
                          </div>
                          {pet.id === player.activePetId ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                                激活中
                              </span>
                              {onDeactivatePet && (
                                <button
                                  onClick={() => onDeactivatePet()}
                                  className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-stone-300"
                                  title="取消激活"
                                >
                                  取消
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => onActivatePet(pet.id)}
                              className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded"
                            >
                              激活
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-stone-400 mb-2">
                      {pet.species}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>攻击: {Math.floor(pet.stats.attack)}</div>
                      <div>防御: {Math.floor(pet.stats.defense)}</div>
                      <div>气血: {Math.floor(pet.stats.hp)}</div>
                      <div>速度: {Math.floor(pet.stats.speed)}</div>
                    </div>
                    <div className="text-xs text-stone-500 mb-2">
                      经验: {pet.exp} / {pet.maxExp}
                    </div>
                    <div className="w-full bg-stone-700 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (pet.exp / pet.maxExp) * 100)}%` }}
                      />
                    </div>
                    {/* 进化阶段 */}
                    <div className="text-xs text-stone-400 mb-1">
                      阶段: {pet.evolutionStage === 0 ? '幼年期' : pet.evolutionStage === 1 ? '成熟期' : '完全体'}
                    </div>
                    {/* 技能数量提示 */}
                    {pet.skills && pet.skills.length > 0 && (
                      <div className="text-xs text-stone-400 mb-1">
                        技能: {pet.skills.length}个
                      </div>
                    )}
                    {/* 展开/收起按钮 */}
                    <button
                      onClick={() => {
                        setExpandedPetIds((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(pet.id)) {
                            newSet.delete(pet.id);
                          } else {
                            newSet.add(pet.id);
                          }
                          return newSet;
                        });
                      }}
                      className="w-full mb-2 px-2 py-1 text-xs bg-stone-800 hover:bg-stone-700 rounded border border-stone-600"
                    >
                      {expandedPetIds.has(pet.id) ? '收起详情' : '展开详情'}
                    </button>
                    {/* 展开后的详细信息 */}
                    {expandedPetIds.has(pet.id) && (
                      <div className="mb-2 space-y-2 border-t border-stone-700 pt-2">
                        {/* 亲密度 */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>亲密度</span>
                            <span>{pet.affection} / 100</span>
                          </div>
                          <div className="w-full bg-stone-700 rounded-full h-1.5">
                            <div
                              className="bg-pink-500 h-1.5 rounded-full"
                              style={{ width: `${pet.affection}%` }}
                            />
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            影响：治疗+{Math.floor(pet.affection / 2)}%，攻击+{Math.floor(pet.affection * 0.5)}点
                          </div>
                        </div>
                        {/* 技能列表 */}
                        {pet.skills && pet.skills.length > 0 && (
                          <div>
                            <div className="text-xs font-bold mb-1">技能列表</div>
                            <div className="space-y-1">
                              {pet.skills.map((skill) => {
                                const cooldown = pet.skillCooldowns?.[skill.id] || 0;
                                const getSkillTypeColor = (type: string) => {
                                  switch (type) {
                                    case 'attack': return 'text-red-400';
                                    case 'defense': return 'text-blue-400';
                                    case 'support': return 'text-green-400';
                                    case 'passive': return 'text-purple-400';
                                    default: return 'text-stone-400';
                                  }
                                };
                                const getSkillTypeName = (type: string) => {
                                  switch (type) {
                                    case 'attack': return '攻击';
                                    case 'defense': return '防御';
                                    case 'support': return '辅助';
                                    case 'passive': return '被动';
                                    default: return type;
                                  }
                                };
                                return (
                                  <div key={skill.id} className="bg-stone-800 rounded p-1.5 border border-stone-700">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="font-bold text-xs">{skill.name}</span>
                                      <span className={`text-xs ${getSkillTypeColor(skill.type)}`}>
                                        {getSkillTypeName(skill.type)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-stone-400 mb-0.5">{skill.description}</div>
                                    <div className="text-xs text-stone-500">
                                      {skill.effect.damage && `伤害: ${skill.effect.damage} `}
                                      {skill.effect.heal && `治疗: ${skill.effect.heal} `}
                                      {skill.effect.buff && (
                                        <>
                                          {skill.effect.buff.attack && `攻击+${skill.effect.buff.attack} `}
                                          {skill.effect.buff.defense && `防御+${skill.effect.buff.defense} `}
                                          {skill.effect.buff.hp && `气血+${skill.effect.buff.hp}`}
                                        </>
                                      )}
                                      {skill.cooldown && (
                                        <span className="ml-1">
                                          {cooldown > 0 ? (
                                            <span className="text-yellow-400">冷却: {cooldown}回合</span>
                                          ) : (
                                            <span className="text-green-400">冷却: {skill.cooldown}回合</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* 进化条件 */}
                        {pet.evolutionStage < 2 && (() => {
                          const template = PET_TEMPLATES.find((t) => t.species === pet.species);
                          if (!template?.evolutionRequirements) return null;
                          const nextStage = pet.evolutionStage + 1;
                          const requirements = nextStage === 1
                            ? (template.evolutionRequirements.stage1 || template.evolutionRequirements)
                            : (template.evolutionRequirements.stage2 || template.evolutionRequirements);
                          const hasLevel = pet.level >= (requirements.level || 0);
                          return (
                            <div className="p-1.5 bg-stone-800 rounded border border-stone-700">
                              <div className="text-xs font-bold mb-1">
                                进化到{nextStage === 1 ? '成熟期' : '完全体'}：
                              </div>
                              <div className="text-xs space-y-0.5">
                                <div className={hasLevel ? 'text-green-400' : 'text-red-400'}>
                                  {hasLevel ? '✓' : '✗'} 等级: {pet.level} / {requirements.level || 0}
                                </div>
                                {requirements.items && requirements.items.length > 0 && (
                                  <div>
                                    {requirements.items.map((req, idx) => {
                                      const item = player.inventory.find((i) => i.name === req.name);
                                      const hasItem = item && item.quantity >= req.quantity;
                                      return (
                                        <div key={idx} className={hasItem ? 'text-green-400' : 'text-red-400'}>
                                          {hasItem ? '✓' : '✗'} {req.name} x{req.quantity}
                                          {item && ` (${item.quantity})`}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleFeedClick(pet.id)}
                        className="flex-1 px-3 py-1.5 bg-green-900 hover:bg-green-800 rounded border border-green-700 text-xs"
                      >
                        喂养
                      </button>
                      {onPetExpedition && (
                        <button
                          onClick={() => onPetExpedition(pet.id)}
                          className="flex-1 px-3 py-1.5 bg-teal-900 hover:bg-teal-800 rounded border border-teal-700 text-xs flex items-center justify-center gap-1"
                          title={`灵兽秘径 - 消耗 ${Math.floor(3000 + Math.max(0, REALM_ORDER.indexOf(player.realm)) * 4500 + pet.evolutionStage * 9000)} 灵石 + ${Math.max(200, Math.floor(player.maxHp * (0.18 + pet.evolutionStage * 0.07)))} 气血 + ${Math.max(100, Math.floor(player.maxExp * (0.08 + pet.evolutionStage * 0.04)))} 修为`}
                        >
                          <Compass size={14} />
                          秘径
                          <span className="text-yellow-400">💰{Math.floor(3000 + Math.max(0, REALM_ORDER.indexOf(player.realm)) * 4500 + pet.evolutionStage * 9000)}</span>
                        </button>
                      )}
                      {onBatchFeedItems && (
                        <button
                          onClick={() => {
                            setBatchFeedPetId(pet.id);
                            setIsBatchFeedOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 text-xs"
                          title="批量喂养"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                      {pet.evolutionStage < 2 && (
                        <button
                          onClick={() => onEvolvePet(pet.id)}
                          className="flex-1 px-3 py-1.5 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 text-xs"
                        >
                          进化
                        </button>
                      )}
                      {onReleasePet && (
                        <button
                          onClick={() => setReleaseConfirmPetId(pet.id)}
                          className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-xs"
                          title="放生"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    </Modal>

        {/* 喂养方式选择弹窗 */}
        {selectedPetId && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-70 p-4">
            <div className="bg-stone-800 rounded-lg border border-stone-700 w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4 text-mystic-gold">
                选择喂养方式
              </h3>

              {!feedType ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setFeedType('hp')}
                    className="w-full px-4 py-3 bg-red-900 hover:bg-red-800 rounded border border-red-700 flex items-center gap-3"
                  >
                    <Droplet className="text-red-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">血量喂养</div>
                      <div className="text-xs text-stone-400">消耗 200 点气血 (经验根据境界计算，+2~5亲密度)</div>
                    </div>
                  </button>

                  {onBatchFeedHp && (
                    <button
                      onClick={() => {
                        if (!selectedPetId) return;
                        onBatchFeedHp(selectedPetId);
                        setSelectedPetId(null);
                        setFeedType(null);
                      }}
                      className="w-full px-4 py-3 bg-red-800 hover:bg-red-700 rounded border border-red-600 flex items-center gap-3"
                      title={`批量喂血：可喂 ${Math.floor(player.hp / 200)} 次`}
                    >
                      <Droplet className="text-red-300" size={20} />
                      <div className="flex-1 text-left">
                        <div className="font-bold">批量喂血</div>
                        <div className="text-xs text-stone-400">
                          消耗所有可用气血 (可喂 {Math.floor(player.hp / 200)} 次，每次200点)
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setFeedType('item')}
                    className="w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 rounded border border-blue-700 flex items-center gap-3"
                    disabled={feedableItems.length === 0}
                  >
                    <Package className="text-blue-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">物品喂养</div>
                      <div className="text-xs text-stone-400">
                        {feedableItems.length === 0
                          ? '背包中没有可喂养物品'
                          : `消耗物品 (经验根据境界和物品品质计算，+2~5亲密度)`}
                      </div>
                    </div>
                  </button>

                  {onBatchFeedItems && (
                    <button
                      onClick={() => {
                        if (!selectedPetId) return;
                        setBatchFeedPetId(selectedPetId);
                        setIsBatchFeedOpen(true);
                        setSelectedPetId(null);
                        setFeedType(null);
                      }}
                      className="w-full px-4 py-3 bg-blue-800 hover:bg-blue-700 rounded border border-blue-600 flex items-center gap-3"
                      disabled={feedableItems.length === 0}
                    >
                      <Layers className="text-blue-300" size={20} />
                      <div className="flex-1 text-left">
                        <div className="font-bold">批量喂养</div>
                        <div className="text-xs text-stone-400">
                          {feedableItems.length === 0
                            ? '背包中没有可喂养物品'
                            : `批量选择物品进行喂养`}
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setFeedType('exp')}
                    className="w-full px-4 py-3 bg-purple-900 hover:bg-purple-800 rounded border border-purple-700 flex items-center gap-3"
                  >
                    <Sparkles className="text-purple-400" size={20} />
                    <div className="flex-1 text-left">
                      <div className="font-bold">修为喂养</div>
                      <div className="text-xs text-stone-400">消耗 5% 当前修为 (经验根据境界计算，+2~5亲密度)</div>
                    </div>
                  </button>
                </div>
              ) : feedType === 'item' ? (
                <div className="space-y-3">
                  <div className="text-sm text-stone-400 mb-3">
                    选择要喂养的物品：
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {feedableItems.length === 0 ? (
                      <div className="text-center text-stone-500 py-4">
                        背包中没有可喂养物品
                      </div>
                    ) : (
                      feedableItems.map(item => {
                        // 计算预估经验值
                        const rarity = item.rarity || '普通';
                        const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
                        const realmIndex = REALM_ORDER.indexOf(player.realm);
                        const realmMultiplier = 1 + realmIndex * 0.5;
                        const levelMultiplier = 1 + player.realmLevel * 0.1;
                        const baseExp = Math.floor(10 * realmMultiplier * levelMultiplier);
                        const estimatedExp = Math.floor(baseExp * rarityMultiplier);

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full px-3 py-2 rounded border text-left ${
                              selectedItemId === item.id
                                ? 'bg-blue-900 border-blue-600'
                                : 'bg-stone-700 border-stone-600 hover:bg-stone-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className={`text-xs px-1.5 py-0.5 rounded ${getRarityTextColor(rarity as ItemRarity)}`}>
                                {rarity}
                              </div>
                            </div>
                            <div className="text-xs text-stone-400 mt-1">
                              数量: {item.quantity} · 预估经验: {estimatedExp}~{Math.floor(estimatedExp * 1.2)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleFeedCancel}
                  className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                >
                  取消
                </button>
                {feedType && (feedType !== 'item' || selectedItemId) && (
                  <button
                    onClick={handleFeedConfirm}
                    className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 rounded border border-green-700"
                  >
                    确认喂养
                  </button>
                )}
                {feedType && feedType !== 'item' && (
                  <button
                    onClick={() => setFeedType(null)}
                    className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                  >
                    返回
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 批量喂养弹窗 */}
        {onBatchFeedItems && batchFeedPetId && (
          <BatchFeedModal
            isOpen={isBatchFeedOpen}
            onClose={() => {
              setIsBatchFeedOpen(false);
              setBatchFeedPetId(null);
            }}
            player={player}
            petId={batchFeedPetId}
            onFeedItems={onBatchFeedItems}
          />
        )}

        {/* 批量放生弹窗 */}
        {onBatchReleasePets && (
          <BatchReleaseModal
            isOpen={isBatchReleaseOpen}
            onClose={() => setIsBatchReleaseOpen(false)}
            player={player}
            onReleasePets={onBatchReleasePets}
          />
        )}

        {/* 单个放生确认弹窗 */}
        {onReleasePet && releaseConfirmPetId && (() => {
          const pet = player.pets.find((p) => p.id === releaseConfirmPetId);
          if (!pet) return null;
          const isActive = pet.id === player.activePetId;
          const compensation = Math.floor(
            100 * (1 + pet.level * 0.1) * ({
              '普通': 1,
              '稀有': 2,
              '传说': 5,
              '仙品': 10,
            }[pet.rarity] || 1)
          );

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70 p-4 backdrop-blur-sm">
              <div
                className="bg-stone-800 w-full max-w-md rounded-lg border border-stone-600 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-stone-600 bg-ink-800 rounded-t flex justify-between items-center">
                  <h3 className="text-lg font-serif text-red-400 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    确认放生
                  </h3>
                  <button
                    title="关闭"
                    onClick={() => setReleaseConfirmPetId(null)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-900/20 border border-red-700 rounded p-4">
                    <p className="text-stone-300 mb-2">
                      你确定要放生灵宠 <span className="text-red-400 font-bold">【{pet.name}】</span> 吗？
                    </p>
                    {isActive && (
                      <p className="text-yellow-400 text-sm mb-2">
                        ⚠️ 注意：这是当前激活的灵宠，放生后将自动取消激活。
                      </p>
                    )}
                    <div className="bg-stone-900 rounded p-3 mt-3">
                      <div className="text-sm text-stone-400 mb-1">灵宠信息：</div>
                      <div className="text-sm text-stone-300 space-y-1">
                        <div>等级: {pet.level}</div>
                        <div>稀有度: {pet.rarity}</div>
                        <div>种类: {pet.species}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-700 flex justify-between items-center">
                        <span className="text-stone-300">补偿：</span>
                        <span className="text-yellow-400 text-lg font-bold">
                          {compensation} 灵石
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-400 text-sm mt-3">
                      此操作不可撤销，请谨慎确认。
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReleaseConfirmPetId(null)}
                      className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded border border-stone-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        onReleasePet(releaseConfirmPetId);
                        setReleaseConfirmPetId(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 rounded border border-red-700 text-white font-bold"
                    >
                      确认放生
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};

export default React.memo(PetModal);
