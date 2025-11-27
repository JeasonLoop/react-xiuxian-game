
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerStats, RealmType, LogEntry, Item, ItemType, AdventureResult, CultivationArt, ItemRarity, SectRank, SecretRealm, AdventureType, Recipe, GameSettings, Pet, EquipmentSlot, Shop, ShopType, ShopItem } from './types';
import { REALM_DATA, INITIAL_ITEMS, CULTIVATION_ARTS, PILL_RECIPES, RARITY_MULTIPLIERS, UPGRADE_MATERIAL_NAME, getUpgradeMultiplier, SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER, TALENTS, TITLES, ACHIEVEMENTS, PET_TEMPLATES, LOTTERY_PRIZES, SHOPS } from './constants';
import StatsPanel from './components/StatsPanel';
import LogPanel from './components/LogPanel';
import InventoryModal from './components/InventoryModal';
import CultivationModal from './components/CultivationModal';
import AlchemyModal from './components/AlchemyModal';
import ArtifactUpgradeModal from './components/ArtifactUpgradeModal';
import SectModal from './components/SectModal';
import SecretRealmModal from './components/SecretRealmModal';
import CombatVisuals from './components/CombatVisuals';
import CharacterModal from './components/CharacterModal';
import AchievementModal from './components/AchievementModal';
import PetModal from './components/PetModal';
import LotteryModal from './components/LotteryModal';
import SettingsModal from './components/SettingsModal';
import ShopModal from './components/ShopModal';
import StartScreen from './components/StartScreen';
import MobileSidebar from './components/MobileSidebar';
import { generateAdventureEvent, generateBreakthroughFlavorText } from './services/aiService';
import { Sword, User, Backpack, BookOpen, Sparkles, Scroll, Mountain, Star, Trophy, Gift, Settings, ShoppingBag, Menu } from 'lucide-react';

// Unique ID generator
const uid = () => Math.random().toString(36).substr(2, 9);

// localStorage 键名
const SAVE_KEY = 'xiuxian-game-save';
const SETTINGS_KEY = 'xiuxian-game-settings';

// 创建初始玩家数据
const createInitialPlayer = (name: string, talentId: string): PlayerStats => {
  const initialTalent = TALENTS.find(t => t.id === talentId);
  const talentAttack = initialTalent?.effects.attack || 0;
  const talentDefense = initialTalent?.effects.defense || 0;
  const talentHp = initialTalent?.effects.hp || 0;
  const talentSpirit = initialTalent?.effects.spirit || 0;
  const talentPhysique = initialTalent?.effects.physique || 0;
  const talentSpeed = initialTalent?.effects.speed || 0;
  const talentLuck = initialTalent?.effects.luck || 0;

  const realmData = REALM_DATA[RealmType.QiRefining];
  return {
    name,
    realm: RealmType.QiRefining,
    realmLevel: 1,
    exp: 0,
    maxExp: realmData.maxExpBase,
    hp: realmData.baseMaxHp + talentHp,
    maxHp: realmData.baseMaxHp + talentHp,
    attack: realmData.baseAttack + talentAttack,
    defense: realmData.baseDefense + talentDefense,
    spirit: realmData.baseSpirit + talentSpirit,
    physique: realmData.basePhysique + talentPhysique,
    speed: realmData.baseSpeed + talentSpeed,
    spiritStones: 50,
    inventory: [...INITIAL_ITEMS],
    cultivationArts: [],
    activeArtId: null,
    equippedItems: {},
    sectId: null,
    sectRank: SectRank.Outer,
    sectContribution: 0,
    talentId: talentId,
    titleId: null,
    attributePoints: 0,
    luck: 10 + talentLuck,
    achievements: [],
    pets: [],
    activePetId: null,
    lotteryTickets: 3,
    lotteryCount: 0,
    inheritanceLevel: 0,
    dailyTaskCount: 0,
    lastTaskResetDate: new Date().toISOString().split('T')[0],
    viewedAchievements: [],
    natalArtifactId: null
  };
};

function App() {
  // 检查是否有存档
  const [hasSave, setHasSave] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved !== null;
    } catch {
      return false;
    }
  });

  const [gameStarted, setGameStarted] = useState(hasSave);
  const [player, setPlayer] = useState<PlayerStats | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...JSON.parse(saved) };
      }
    } catch {}
    return {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 70,
      musicVolume: 50,
      autoSave: true,
      animationSpeed: 'normal',
      language: 'zh'
    };
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 使用 ref 来防止成就重复触发
  const checkingAchievementsRef = useRef(false);

  // 加载存档
  useEffect(() => {
    if (hasSave && !player) {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
          const savedData = JSON.parse(saved);
          // 确保加载的存档包含新字段
          const loadedPlayer = {
            ...savedData.player,
            dailyTaskCount: savedData.player.dailyTaskCount || 0,
            lastTaskResetDate: savedData.player.lastTaskResetDate || new Date().toISOString().split('T')[0],
            viewedAchievements: savedData.player.viewedAchievements || [],
            natalArtifactId: savedData.player.natalArtifactId || null
          };
          setPlayer(loadedPlayer);
          setLogs(savedData.logs || []);
          setGameStarted(true);
        }
      } catch (error) {
        console.error('加载存档失败:', error);
        setHasSave(false);
        setGameStarted(false);
      }
    }
  }, [hasSave, player]);

  // 保存存档
  const saveGame = useCallback((playerData: PlayerStats, logsData: LogEntry[]) => {
    try {
      const saveData = {
        player: playerData,
        logs: logsData,
        timestamp: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      if (settings.autoSave) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('保存存档失败:', error);
    }
  }, [settings]);

  // 开始新游戏
  const handleStartGame = (playerName: string, talentId: string) => {
    const newPlayer = createInitialPlayer(playerName, talentId);
    const initialTalent = TALENTS.find(t => t.id === talentId);
    const initialLogs: LogEntry[] = [
      { id: uid(), text: "欢迎来到修仙世界。你的长生之路就此开始。", type: 'special', timestamp: Date.now() },
      { id: uid(), text: `你天生拥有【${initialTalent?.name}】天赋。${initialTalent?.description}`, type: 'special', timestamp: Date.now() }
    ];
    setPlayer(newPlayer);
    setLogs(initialLogs);
    setGameStarted(true);
    setHasSave(true);
    saveGame(newPlayer, initialLogs);
  };

  // 自动保存
  useEffect(() => {
    if (player && gameStarted && settings.autoSave) {
      saveGame(player, logs);
    }
  }, [player, logs, settings.autoSave, saveGame, gameStarted]);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCultivationOpen, setIsCultivationOpen] = useState(false);
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSectOpen, setIsSectOpen] = useState(false);
  const [isRealmOpen, setIsRealmOpen] = useState(false);
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isPetOpen, setIsPetOpen] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{ item: string; quantity: number } | null>(null);
  const [lotteryRewards, setLotteryRewards] = useState<Array<{ type: string; name: string; quantity?: number }>>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [visualEffects, setVisualEffects] = useState<{ type: 'damage' | 'heal' | 'slash', value?: string, color?: string, id: string }[]>([]);

  // Helper to add logs
  const addLog = (text: string, type: LogEntry['type'] = 'normal') => {
    setLogs(prev => [...prev, { id: uid(), text, type, timestamp: Date.now() }]);
  };

  // Helper to trigger visuals
  const triggerVisual = (type: 'damage' | 'heal' | 'slash', value?: string, color?: string) => {
    const id = uid();
    setVisualEffects(prev => [...prev, { type, value, color, id }]);
    setTimeout(() => {
      setVisualEffects(prev => prev.filter(v => v.id !== id));
    }, 1000);
  };

  // 根据物品名称和描述推断物品类型和装备槽位
  const inferItemTypeAndSlot = (
    name: string,
    currentType: ItemType,
    description: string,
    currentIsEquippable?: boolean
  ): { type: ItemType; isEquippable: boolean; equipmentSlot?: EquipmentSlot } => {
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();
    const combined = nameLower + descLower;

    // 武器类
    if (combined.match(/剑|刀|枪|戟|斧|锤|鞭|棍|棒|矛|弓|弩|匕首|短剑|长剑|重剑|飞剑|灵剑|仙剑/)) {
      return {
        type: ItemType.Weapon,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Weapon
      };
    }

    // 肩部装备（裘、披风、肩甲等）
    if (combined.match(/裘|披风|斗篷|肩甲|护肩|肩饰|肩胛/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Shoulder
      };
    }

    // 头部装备
    if (combined.match(/头盔|头冠|冠|帽|发簪|发带|头饰|面罩/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Head
      };
    }

    // 胸甲装备
    if (combined.match(/道袍|法衣|胸甲|护胸|铠甲|战甲|法袍|长袍|外衣/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest
      };
    }

    // 手套
    if (combined.match(/手套|护手|手甲|拳套/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Gloves
      };
    }

    // 鞋子
    if (combined.match(/靴|鞋|足|步|履/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Boots
      };
    }

    // 裤腿
    if (combined.match(/裤|腿甲|护腿|下装/)) {
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Legs
      };
    }

    // 戒指
    if (combined.match(/戒指|指环|戒/)) {
      // 随机分配一个戒指槽位
      const ringSlots = [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4];
      return {
        type: ItemType.Ring,
        isEquippable: true,
        equipmentSlot: ringSlots[Math.floor(Math.random() * ringSlots.length)]
      };
    }

    // 首饰（项链、玉佩、手镯等）
    if (combined.match(/项链|玉佩|手镯|手链|吊坠|护符|符|佩|饰/)) {
      const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
      return {
        type: ItemType.Accessory,
        isEquippable: true,
        equipmentSlot: accessorySlots[Math.floor(Math.random() * accessorySlots.length)]
      };
    }

    // 法宝
    if (combined.match(/法宝|法器|灵器|仙器|神器|鼎|钟|镜|塔|扇|珠|印|盘|笔|袋|旗|炉|图|斧|锤/)) {
      const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
      return {
        type: ItemType.Artifact,
        isEquippable: true,
        equipmentSlot: artifactSlots[Math.floor(Math.random() * artifactSlots.length)]
      };
    }

    // 如果当前类型是"防具"等非标准类型，转换为护甲
    if (currentType === '防具' as any) {
      // 默认作为胸甲处理
      return {
        type: ItemType.Armor,
        isEquippable: true,
        equipmentSlot: EquipmentSlot.Chest
      };
    }

    // 保持原有类型，但如果是装备类且没有槽位，尝试推断
    if (currentIsEquippable) {
      if (currentType === ItemType.Armor) {
        return {
          type: ItemType.Armor,
          isEquippable: true,
          equipmentSlot: EquipmentSlot.Chest // 默认胸甲
        };
      } else if (currentType === ItemType.Weapon) {
        return {
          type: ItemType.Weapon,
          isEquippable: true,
          equipmentSlot: EquipmentSlot.Weapon
        };
      }
    }

    return {
      type: currentType,
      isEquippable: currentIsEquippable || false
    };
  };

  // Helper to calculate item stats based on rarity
  const getItemStats = (item: Item, isNatal: boolean = false) => {
    const rarity = item.rarity || '普通';
    const multiplier = RARITY_MULTIPLIERS[rarity] || 1;
    // 本命法宝额外50%加成
    const natalMultiplier = isNatal ? 1.5 : 1;

    return {
      attack: item.effect?.attack ? Math.floor(item.effect.attack * multiplier * natalMultiplier) : 0,
      defense: item.effect?.defense ? Math.floor(item.effect.defense * multiplier * natalMultiplier) : 0,
      hp: item.effect?.hp ? Math.floor(item.effect.hp * multiplier * natalMultiplier) : 0,
      spirit: item.effect?.spirit ? Math.floor(item.effect.spirit * multiplier * natalMultiplier) : 0,
      physique: item.effect?.physique ? Math.floor(item.effect.physique * multiplier * natalMultiplier) : 0,
      speed: item.effect?.speed ? Math.floor(item.effect.speed * multiplier * natalMultiplier) : 0,
    };
  };

  // 生成属性预览文本
  const generateAttributePreview = (effect: Item['effect']): string => {
    if (!effect) return '';
    const attrs: string[] = [];
    if (effect.attack) attrs.push(`攻+${effect.attack}`);
    if (effect.defense) attrs.push(`防+${effect.defense}`);
    if (effect.hp) attrs.push(`血+${effect.hp}`);
    if (effect.spirit) attrs.push(`神识+${effect.spirit}`);
    if (effect.physique) attrs.push(`体魄+${effect.physique}`);
    if (effect.speed) attrs.push(`速度+${effect.speed}`);
    return attrs.length > 0 ? ` [${attrs.join(' ')}]` : '';
  };

  // Passive Regeneration logic
  useEffect(() => {
    if (!player) return; // 如果 player 为 null，不执行定时器

    const timer = setInterval(() => {
      setPlayer(prev => {
        if (!prev) return prev; // 防止 prev 为 null
        if (prev.hp < prev.maxHp) {
          return { ...prev, hp: Math.min(prev.maxHp, prev.hp + Math.max(1, Math.floor(prev.maxHp * 0.01))) };
        }
        return prev;
      });
      if (cooldown > 0) setCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown, player]);

  // Action: Meditate (Reliable Exp)
  const handleMeditate = () => {
    if (loading || cooldown > 0 || !player) return;

    let baseGain = 10 + (player.realmLevel * 5);

    // Apply Active Art Bonus
    const activeArt = CULTIVATION_ARTS.find(a => a.id === player.activeArtId);
    if (activeArt && activeArt.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + activeArt.effects.expRate));
    }

    // Apply Talent Bonus
    const talent = TALENTS.find(t => t.id === player.talentId);
    if (talent && talent.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + talent.effects.expRate));
    }

    // Slight randomness
    const actualGain = Math.floor(baseGain * (0.8 + Math.random() * 0.4));

    setPlayer(prev => ({ ...prev, exp: prev.exp + actualGain }));

    const artText = activeArt ? `，运转${activeArt.name}` : '';
    addLog(`你潜心感悟大道${artText}。(+${actualGain} 修为)`);
    setCooldown(1);
    checkLevelUp(actualGain);

    // 检查首次打坐成就
    if (!player.achievements.includes('ach-first-step')) {
      const firstMeditateAchievement = ACHIEVEMENTS.find(a => a.id === 'ach-first-step');
      if (firstMeditateAchievement) {
        setPlayer(prev => {
          const newAchievements = [...prev.achievements, 'ach-first-step'];
          addLog(`🎉 达成成就：【${firstMeditateAchievement.name}】！`, 'special');
          return {
            ...prev,
            achievements: newAchievements,
            exp: prev.exp + (firstMeditateAchievement.reward.exp || 0),
            spiritStones: prev.spiritStones + (firstMeditateAchievement.reward.spiritStones || 0)
          };
        });
      }
    }
  };

  // Common adventure/realm logic
  const executeAdventure = async (adventureType: AdventureType, realmName?: string) => {
    if (!player) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (realmName) {
      addLog(`你进入了【${realmName}】，只觉灵气逼人，杀机四伏...`, 'special');
    } else {
      addLog("你走出洞府，前往荒野历练...", 'normal');
    }

    try {
      const result: AdventureResult = await generateAdventureEvent(player, adventureType);

      // Handle Visuals
      if (result.hpChange < 0) {
        triggerVisual('damage', String(result.hpChange), 'text-red-500');
        // Simple shake effect is handled by CSS on body if we wanted global,
        // but here we rely on the floating text for now.
        if (document.body) {
          document.body.classList.add('animate-shake');
          setTimeout(() => document.body.classList.remove('animate-shake'), 500);
        }
      } else if (result.hpChange > 0) {
        triggerVisual('heal', `+${result.hpChange}`, 'text-emerald-400');
      }

      if (result.eventColor === 'danger' || adventureType === 'secret_realm') {
        triggerVisual('slash');
      }

      setPlayer(prev => {
        let newInv = [...prev.inventory];
        let newArts = [...prev.cultivationArts];
        let newTalentId = prev.talentId;
        let newAttack = prev.attack;
        let newDefense = prev.defense;
        let newMaxHp = prev.maxHp;
        let newHp = prev.hp;
        let newExpRate = 0;
        let newLuck = prev.luck;
        let newLotteryTickets = prev.lotteryTickets;
        let newInheritanceLevel = prev.inheritanceLevel;

        // 处理获得的物品
        if (result.itemObtained) {
          let itemName = result.itemObtained.name;
          let itemType = result.itemObtained.type as ItemType || ItemType.Material;
          let isEquippable = result.itemObtained.isEquippable;
          let equipmentSlot = result.itemObtained.equipmentSlot as EquipmentSlot | undefined;
          const itemDescription = result.itemObtained.description || '';

          // 处理神秘法宝：随机命名并设置为法宝类型
          if (itemName.includes('神秘') && itemName.includes('法宝')) {
            const artifactNames = [
              '青莲剑', '紫霄钟', '玄天镜', '九幽塔', '太虚鼎', '阴阳扇', '星辰珠', '混沌印',
              '天机盘', '轮回笔', '乾坤袋', '五行旗', '八卦炉', '太极图', '无极剑', '造化钟',
              '开天斧', '辟地锤', '混元珠', '先天图', '后天镜', '三生石', '六道轮', '九重天'
            ];
            itemName = artifactNames[Math.floor(Math.random() * artifactNames.length)];
            itemType = ItemType.Artifact;
            isEquippable = true;
            // 随机分配一个法宝槽位
            const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
            equipmentSlot = artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
          } else {
            // 自动推断和修正物品类型和装备槽位
            const inferred = inferItemTypeAndSlot(itemName, itemType, itemDescription, isEquippable);
            itemType = inferred.type;
            isEquippable = inferred.isEquippable;
            equipmentSlot = inferred.equipmentSlot || equipmentSlot;
          }

          // 确保法宝有属性加成，且不能有exp加成
          let finalEffect = result.itemObtained.effect || {};
          if (itemType === ItemType.Artifact) {
            // 移除exp加成（法宝不应该提供修为加成）
            if (finalEffect.exp) {
              const { exp, ...restEffect } = finalEffect;
              finalEffect = restEffect;
            }

            // 如果法宝没有任何属性加成，自动生成属性
            const hasAnyAttribute = finalEffect.attack || finalEffect.defense || finalEffect.hp ||
                                   finalEffect.spirit || finalEffect.physique || finalEffect.speed;

            if (!hasAnyAttribute) {
              const rarity = (result.itemObtained.rarity as ItemRarity) || '普通';
              const rarityMultiplier = RARITY_MULTIPLIERS[rarity];

              // 根据稀有度生成基础属性值
              const baseValue = rarity === '普通' ? 10 :
                              rarity === '稀有' ? 30 :
                              rarity === '传说' ? 80 : 200;

              // 随机生成1-3种属性
              const attributeTypes = ['attack', 'defense', 'hp', 'spirit', 'physique', 'speed'];
              const numAttributes = Math.floor(Math.random() * 3) + 1; // 1-3种属性
              const selectedAttributes = attributeTypes.sort(() => Math.random() - 0.5).slice(0, numAttributes);

              finalEffect = {};
              selectedAttributes.forEach(attr => {
                const value = Math.floor(baseValue * rarityMultiplier * (0.8 + Math.random() * 0.4));
                (finalEffect as any)[attr] = value;
              });
            }
          }

          // 装备类物品可以重复获得，但每个装备单独占一格（quantity始终为1）
          const isEquipment = isEquippable && equipmentSlot;
          const existingIdx = newInv.findIndex(i => i.name === itemName);

          if (existingIdx >= 0 && !isEquipment) {
            // 非装备类物品可以叠加
            newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
          } else {
            // 装备类物品或新物品，创建新物品（每个装备单独占一格）
            const newItem: Item = {
              id: uid(),
              name: itemName,
              type: itemType,
              description: result.itemObtained.description + (isEquipment ? generateAttributePreview(finalEffect) : ''),
              quantity: 1, // 装备quantity始终为1
              rarity: (result.itemObtained.rarity as ItemRarity) || '普通',
              level: 0,
              isEquippable: isEquippable,
              equipmentSlot: equipmentSlot,
              effect: finalEffect,
              permanentEffect: result.itemObtained.permanentEffect
            };
            newInv.push(newItem);
          }
        }

        // 处理抽奖券奖励
        if (result.lotteryTicketsChange && result.lotteryTicketsChange > 0) {
          newLotteryTickets += result.lotteryTicketsChange;
          addLog(`🎫 获得 ${result.lotteryTicketsChange} 张抽奖券！`, 'gain');
        }

        // 处理传承奖励（极小概率获得传承，可直接突破1-4个境界）
        if (result.inheritanceLevelChange && result.inheritanceLevelChange > 0) {
          newInheritanceLevel += result.inheritanceLevelChange;
          addLog(`🌟 你获得了上古传承！可以直接突破 ${result.inheritanceLevelChange} 个境界！`, 'special');
        }

        // 小概率获得功法（3%概率，秘境中5%）
        const artChance = realmName ? 0.05 : 0.03;
        if (Math.random() < artChance && adventureType !== 'lucky') {
          const availableArts = CULTIVATION_ARTS.filter(art =>
            !newArts.includes(art.id) &&
            REALM_ORDER.indexOf(art.realmRequirement) <= REALM_ORDER.indexOf(prev.realm)
          );
          if (availableArts.length > 0) {
            const randomArt = availableArts[Math.floor(Math.random() * availableArts.length)];
            newArts.push(randomArt.id);
            newAttack += randomArt.effects.attack || 0;
            newDefense += randomArt.effects.defense || 0;
            newMaxHp += randomArt.effects.hp || 0;
            newHp += randomArt.effects.hp || 0;
            addLog(`🎉 你在历练中领悟了功法【${randomArt.name}】！`, 'special');
          }
        }

        // 极小概率获得天赋（1%概率，秘境中2%，大机缘中5%）
        const talentChance = adventureType === 'lucky' ? 0.05 : (realmName ? 0.02 : 0.01);
        if (Math.random() < talentChance && !newTalentId) {
          const availableTalents = TALENTS.filter(t =>
            t.id !== 'talent-ordinary' &&
            t.rarity !== '仙品' // 仙品天赋只能通过特殊方式获得
          );
          if (availableTalents.length > 0) {
            const randomTalent = availableTalents[Math.floor(Math.random() * availableTalents.length)];
            newTalentId = randomTalent.id;
            newAttack += randomTalent.effects.attack || 0;
            newDefense += randomTalent.effects.defense || 0;
            newMaxHp += randomTalent.effects.hp || 0;
            newHp += randomTalent.effects.hp || 0;
            newLuck += randomTalent.effects.luck || 0;
            addLog(`🌟 你在历练中觉醒了天赋【${randomTalent.name}】！`, 'special');
          }
        }

        // 处理属性降低（遭遇陷阱、邪修等危险事件）
        let newSpirit = prev.spirit;
        let newPhysique = prev.physique;
        let newSpeed = prev.speed;
        if (result.attributeReduction) {
          const reduction = result.attributeReduction;
          if (reduction.attack) {
            newAttack = Math.max(0, newAttack - reduction.attack);
            addLog(`⚠️ 你的攻击力降低了 ${reduction.attack} 点！`, 'danger');
          }
          if (reduction.defense) {
            newDefense = Math.max(0, newDefense - reduction.defense);
            addLog(`⚠️ 你的防御力降低了 ${reduction.defense} 点！`, 'danger');
          }
          if (reduction.spirit) {
            newSpirit = Math.max(0, newSpirit - reduction.spirit);
            addLog(`⚠️ 你的神识降低了 ${reduction.spirit} 点！`, 'danger');
          }
          if (reduction.physique) {
            newPhysique = Math.max(0, newPhysique - reduction.physique);
            addLog(`⚠️ 你的体魄降低了 ${reduction.physique} 点！`, 'danger');
          }
          if (reduction.speed) {
            newSpeed = Math.max(0, newSpeed - reduction.speed);
            addLog(`⚠️ 你的速度降低了 ${reduction.speed} 点！`, 'danger');
          }
          if (reduction.maxHp) {
            newMaxHp = Math.max(prev.maxHp * 0.5, newMaxHp - reduction.maxHp); // 至少保留50%气血上限
            newHp = Math.min(newHp, newMaxHp);
            addLog(`⚠️ 你的气血上限降低了 ${reduction.maxHp} 点！`, 'danger');
          }
        }

        return {
          ...prev,
          hp: Math.max(0, Math.min(newMaxHp, newHp + result.hpChange)),
          exp: Math.max(0, prev.exp + result.expChange), // 修为不能为负
          spiritStones: Math.max(0, prev.spiritStones + result.spiritStonesChange), // 灵石不能为负
          inventory: newInv,
          cultivationArts: newArts,
          talentId: newTalentId || prev.talentId,
          attack: newAttack,
          defense: newDefense,
          maxHp: newMaxHp,
          spirit: newSpirit,
          physique: newPhysique,
          speed: newSpeed,
          luck: newLuck,
          lotteryTickets: newLotteryTickets,
          inheritanceLevel: newInheritanceLevel
        };
      });

      addLog(result.story, result.eventColor);

      if (result.itemObtained) {
        addLog(`获得物品: ${result.itemObtained.name}`, 'gain');
      }

      // 如果触发随机秘境，自动进入秘境并触发新的随机事件
      if (result.triggerSecretRealm) {
        setTimeout(async () => {
          addLog(`你进入了秘境深处...`, 'special');
          const secretRealmResult = await generateAdventureEvent(player, 'secret_realm');
          // 递归处理秘境事件
          setPlayer(prev => {
            if (!prev) return prev;
            let newInv = [...prev.inventory];
            let newStones = prev.spiritStones;
            let newExp = prev.exp;
            let newHp = prev.hp;
            let newMaxHp = prev.maxHp;
            let newAttack = prev.attack;
            let newDefense = prev.defense;
            let newSpirit = prev.spirit;
            let newPhysique = prev.physique;
            let newSpeed = prev.speed;

            // 处理秘境中的物品
            if (secretRealmResult.itemObtained) {
              const itemName = secretRealmResult.itemObtained.name;
              const existingIdx = newInv.findIndex(i => i.name === itemName);
              if (existingIdx < 0) {
                const newItem: Item = {
                  id: uid(),
                  name: itemName,
                  type: secretRealmResult.itemObtained.type as ItemType || ItemType.Material,
                  description: secretRealmResult.itemObtained.description,
                  quantity: 1,
                  rarity: (secretRealmResult.itemObtained.rarity as ItemRarity) || '普通',
                  level: 0,
                  isEquippable: secretRealmResult.itemObtained.isEquippable,
                  equipmentSlot: secretRealmResult.itemObtained.equipmentSlot as EquipmentSlot | undefined,
                  effect: secretRealmResult.itemObtained.effect,
                  permanentEffect: secretRealmResult.itemObtained.permanentEffect
                };
                newInv.push(newItem);
              }
            }

            // 处理属性降低
            if (secretRealmResult.attributeReduction) {
              const reduction = secretRealmResult.attributeReduction;
              if (reduction.attack) newAttack = Math.max(0, newAttack - reduction.attack);
              if (reduction.defense) newDefense = Math.max(0, newDefense - reduction.defense);
              if (reduction.spirit) newSpirit = Math.max(0, newSpirit - reduction.spirit);
              if (reduction.physique) newPhysique = Math.max(0, newPhysique - reduction.physique);
              if (reduction.speed) newSpeed = Math.max(0, newSpeed - reduction.speed);
              if (reduction.maxHp) {
                newMaxHp = Math.max(prev.maxHp * 0.5, newMaxHp - reduction.maxHp);
                newHp = Math.min(newHp, newMaxHp);
              }
            }

            return {
              ...prev,
              hp: Math.max(0, Math.min(newMaxHp, newHp + secretRealmResult.hpChange)),
              exp: Math.max(0, newExp + secretRealmResult.expChange),
              spiritStones: Math.max(0, newStones + secretRealmResult.spiritStonesChange),
              inventory: newInv,
              attack: newAttack,
              defense: newDefense,
              maxHp: newMaxHp,
              spirit: newSpirit,
              physique: newPhysique,
              speed: newSpeed
            };
          });
          addLog(secretRealmResult.story, secretRealmResult.eventColor);
          if (secretRealmResult.itemObtained) {
            addLog(`获得物品: ${secretRealmResult.itemObtained.name}`, 'gain');
          }
        }, 1000);
      }

    } catch (e) {
      addLog("历练途中突发异变，你神识受损，不得不返回。", 'danger');
    } finally {
      setLoading(false);
      setCooldown(2);
    }
  };

  // Action: Adventure
  const handleAdventure = async () => {
    if (loading || cooldown > 0) return;
    if (player.hp < player.maxHp * 0.2) {
      addLog("你身受重伤，不宜出行。请先打坐疗伤。", 'danger');
      return;
    }

    // 根据境界计算机缘概率
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const baseLuckyChance = 0.05; // 基础5%概率
    const realmBonus = realmIndex * 0.02; // 每提升一个境界增加2%
    const levelBonus = (player.realmLevel - 1) * 0.01; // 每提升一层增加1%
    const luckBonus = player.luck * 0.001; // 幸运值加成
    const luckyChance = Math.min(0.3, baseLuckyChance + realmBonus + levelBonus + luckBonus);

    // 15% Chance to encounter a shop
    const shopChance = Math.random();
    if (shopChance < 0.15) {
      const shopTypes = [ShopType.Village, ShopType.City, ShopType.Sect];
      const randomShopType = shopTypes[Math.floor(Math.random() * shopTypes.length)];
      handleOpenShop(randomShopType);
      return;
    }

    // 根据境界计算机缘概率
    const isLucky = Math.random() < luckyChance;
    await executeAdventure(isLucky ? 'lucky' : 'normal');
  };

  // Action: Secret Realm
  const handleEnterRealm = async (realm: SecretRealm) => {
    if (loading || cooldown > 0 || !player) return;

    if (player.hp < player.maxHp * 0.3) {
      addLog("你气血不足，此时进入秘境无异于自寻死路！", 'danger');
      return;
    }

    if (player.spiritStones < realm.cost) {
      addLog("囊中羞涩，无法支付开启秘境的灵石。", 'danger');
      return;
    }

    setPlayer(prev => ({ ...prev, spiritStones: prev.spiritStones - realm.cost }));
    setIsRealmOpen(false); // Close modal

    // Secret Realm Adventure
    await executeAdventure('secret_realm', realm.name);
  };

  // Reactive Level Up Check
  useEffect(() => {
    if (player && player.exp >= player.maxExp) {
      handleBreakthrough();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.exp, player?.maxExp]);

  const checkLevelUp = (addedExp: number) => {
    // Rely on useEffect
  };

  // 使用传承突破境界
  const handleUseInheritance = () => {
    if (!player || player.inheritanceLevel <= 0) {
      addLog('你没有可用的传承！', 'danger');
      return;
    }

    setPlayer(prev => {
      let remainingInheritance = prev.inheritanceLevel;
      let currentRealm = prev.realm;
      let currentLevel = prev.realmLevel;
      let breakthroughCount = 0;

      // 使用传承突破境界（最多突破4个境界）
      const maxBreakthroughs = Math.min(remainingInheritance, 4);

      for (let i = 0; i < maxBreakthroughs; i++) {
        const isRealmUpgrade = currentLevel >= 9;

        if (isRealmUpgrade) {
          const realms = Object.values(RealmType);
          const currentIndex = realms.indexOf(currentRealm);
          if (currentIndex < realms.length - 1) {
            currentRealm = realms[currentIndex + 1];
            currentLevel = 1;
            breakthroughCount++;
            remainingInheritance--;
          } else {
            // 已经达到最高境界
            break;
          }
        } else {
          currentLevel++;
          breakthroughCount++;
          remainingInheritance--;
        }
      }

      if (breakthroughCount > 0) {
        const stats = REALM_DATA[currentRealm];
        const levelMultiplier = 1 + (currentLevel * 0.1);

        // 计算所有加成
        let bonusAttack = 0;
        let bonusDefense = 0;
        let bonusHp = 0;
        let bonusSpirit = 0;
        let bonusPhysique = 0;
        let bonusSpeed = 0;

        // 功法加成
        prev.cultivationArts.forEach(artId => {
          const art = CULTIVATION_ARTS.find(a => a.id === artId);
          if (art) {
            bonusAttack += art.effects.attack || 0;
            bonusDefense += art.effects.defense || 0;
            bonusHp += art.effects.hp || 0;
            bonusSpirit += art.effects.spirit || 0;
            bonusPhysique += art.effects.physique || 0;
            bonusSpeed += art.effects.speed || 0;
          }
        });

        // 装备加成（包括本命法宝）
        Object.values(prev.equippedItems).forEach(itemId => {
          const equippedItem = prev.inventory.find(i => i.id === itemId);
          if (equippedItem && equippedItem.effect) {
            const isNatal = equippedItem.id === prev.natalArtifactId;
            const itemStats = getItemStats(equippedItem, isNatal);
            bonusAttack += itemStats.attack;
            bonusDefense += itemStats.defense;
            bonusHp += itemStats.hp;
            bonusSpirit += itemStats.spirit;
            bonusPhysique += itemStats.physique;
            bonusSpeed += itemStats.speed;
          }
        });

        // 天赋加成
        const talent = TALENTS.find(t => t.id === prev.talentId);
        if (talent) {
          bonusAttack += talent.effects.attack || 0;
          bonusDefense += talent.effects.defense || 0;
          bonusHp += talent.effects.hp || 0;
          bonusSpirit += talent.effects.spirit || 0;
          bonusPhysique += talent.effects.physique || 0;
          bonusSpeed += talent.effects.speed || 0;
        }

        // 称号加成
        const title = TITLES.find(t => t.id === prev.titleId);
        if (title) {
          bonusAttack += title.effects.attack || 0;
          bonusDefense += title.effects.defense || 0;
          bonusHp += title.effects.hp || 0;
          bonusSpirit += title.effects.spirit || 0;
          bonusPhysique += title.effects.physique || 0;
          bonusSpeed += title.effects.speed || 0;
        }

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);

        addLog(`🌟 你使用了传承，连续突破了 ${breakthroughCount} 个境界！`, 'special');

        return {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          exp: 0,
          maxExp: Math.floor(stats.maxExpBase * levelMultiplier * 1.5),
          maxHp: newBaseMaxHp + bonusHp,
          hp: newBaseMaxHp + bonusHp, // Full heal
          attack: Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack,
          defense: Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense,
          spirit: Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit,
          physique: Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique,
          speed: Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed,
          inheritanceLevel: remainingInheritance
        };
      }

      return prev;
    });
  };

  const handleBreakthrough = async () => {
    if (loading || !player) return;

    const isRealmUpgrade = player.realmLevel >= 9;
    const successChance = isRealmUpgrade ? 0.6 : 0.9;
    const roll = Math.random();

    if (roll < successChance) {
      setLoading(true);
      const nextLevel = isRealmUpgrade ? 1 : player.realmLevel + 1;

      let nextRealm = player.realm;
      if (isRealmUpgrade) {
        const realms = Object.values(RealmType);
        const currentIndex = realms.indexOf(player.realm);
        if (currentIndex < realms.length - 1) {
          nextRealm = realms[currentIndex + 1];
        }
      }

      const flavor = await generateBreakthroughFlavorText(isRealmUpgrade ? nextRealm : `第 ${nextLevel} 层`, true);
      addLog(flavor, 'special');
      addLog(isRealmUpgrade ? `恭喜！你的境界提升到了 ${nextRealm} ！` : `恭喜！你突破到了第 ${nextLevel} 层！`, 'special');

      setPlayer(prev => {
        const stats = REALM_DATA[nextRealm];
        const levelMultiplier = 1 + (nextLevel * 0.1);

        // 1. Calculate Art Bonuses
        let bonusAttack = 0;
        let bonusDefense = 0;
        let bonusHp = 0;
        let bonusSpirit = 0;
        let bonusPhysique = 0;
        let bonusSpeed = 0;

        prev.cultivationArts.forEach(artId => {
           const art = CULTIVATION_ARTS.find(a => a.id === artId);
           if (art) {
             bonusAttack += art.effects.attack || 0;
             bonusDefense += art.effects.defense || 0;
             bonusHp += art.effects.hp || 0;
             bonusSpirit += art.effects.spirit || 0;
             bonusPhysique += art.effects.physique || 0;
             bonusSpeed += art.effects.speed || 0;
           }
        });

        // 2. Calculate Equipment Bonuses
        Object.values(prev.equippedItems).forEach(itemId => {
          const equippedItem = prev.inventory.find(i => i.id === itemId);
          if (equippedItem && equippedItem.effect) {
            const itemStats = getItemStats(equippedItem);
            bonusAttack += itemStats.attack;
            bonusDefense += itemStats.defense;
            bonusHp += itemStats.hp;
          }
        });

        // 3. Calculate Talent Bonuses
        const talent = TALENTS.find(t => t.id === prev.talentId);
        if (talent) {
          bonusAttack += talent.effects.attack || 0;
          bonusDefense += talent.effects.defense || 0;
          bonusHp += talent.effects.hp || 0;
          bonusSpirit += talent.effects.spirit || 0;
          bonusPhysique += talent.effects.physique || 0;
          bonusSpeed += talent.effects.speed || 0;
        }

        // 4. Calculate Title Bonuses
        const title = TITLES.find(t => t.id === prev.titleId);
        if (title) {
          bonusAttack += title.effects.attack || 0;
          bonusDefense += title.effects.defense || 0;
          bonusHp += title.effects.hp || 0;
          bonusSpirit += title.effects.spirit || 0;
          bonusPhysique += title.effects.physique || 0;
          bonusSpeed += title.effects.speed || 0;
        }

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);

        return {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          exp: 0,
          maxExp: Math.floor(stats.maxExpBase * levelMultiplier * 1.5),
          maxHp: newBaseMaxHp + bonusHp,
          hp: newBaseMaxHp + bonusHp, // Full heal
          attack: Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack,
          defense: Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense,
          spirit: Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit,
          physique: Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique,
          speed: Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed,
        };
      });
      setLoading(false);

    } else {
      addLog("你尝试冲击瓶颈，奈何根基不稳，惨遭反噬！", 'danger');
      setPlayer(prev => ({ ...prev, exp: Math.floor(prev.exp * 0.7), hp: Math.floor(prev.hp * 0.5) }));
    }
  };

  const handleUseItem = (item: Item) => {
    setPlayer(prev => {
      const newInv = prev.inventory.map(i => {
        if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
        return i;
      }).filter(i => i.quantity > 0);

      const effectLogs = [];
      let newStats = { ...prev };
      let newPets = [...prev.pets];

      // 处理灵兽蛋孵化
      // 识别条件：名称包含"蛋"、"Egg"、"灵兽蛋"等，或描述包含"孵化"、"灵宠"、"灵兽"等关键词
      const isPetEgg =
        item.name.includes('蛋') ||
        item.name.toLowerCase().includes('egg') ||
        item.name.includes('灵兽蛋') ||
        item.name.includes('灵宠蛋') ||
        (item.description && (
          item.description.includes('孵化') ||
          item.description.includes('灵宠') ||
          item.description.includes('灵兽') ||
          item.description.includes('宠物')
        ));

      if (isPetEgg) {
        // 根据物品稀有度匹配灵宠稀有度
        const availablePets = PET_TEMPLATES.filter(t => {
          // 根据物品稀有度匹配灵宠稀有度
          if (item.rarity === '普通') return t.rarity === '普通' || t.rarity === '稀有';
          if (item.rarity === '稀有') return t.rarity === '稀有' || t.rarity === '传说';
          if (item.rarity === '传说') return t.rarity === '传说' || t.rarity === '仙品';
          if (item.rarity === '仙品') return t.rarity === '仙品';
          return true;
        });

        if (availablePets.length > 0) {
          const randomTemplate = availablePets[Math.floor(Math.random() * availablePets.length)];
          const newPet: Pet = {
            id: uid(),
            name: randomTemplate.name,
            species: randomTemplate.species,
            level: 1,
            exp: 0,
            maxExp: 100,
            rarity: randomTemplate.rarity,
            stats: { ...randomTemplate.baseStats },
            skills: [...randomTemplate.skills],
            evolutionStage: 0,
            affection: 50
          };
          newPets.push(newPet);
          effectLogs.push(`✨ 孵化出了灵宠【${newPet.name}】！`);
          addLog(`🎉 你成功孵化了${item.name}，获得了灵宠【${newPet.name}】！`, 'special');
        } else {
          effectLogs.push('但似乎什么都没有孵化出来...');
          addLog(`你尝试孵化${item.name}，但似乎什么都没有发生...`, 'normal');
        }
      }

      // 处理临时效果
      if (item.effect?.hp) {
        newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
        effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
      }
      if (item.effect?.exp) {
        newStats.exp += item.effect.exp;
        effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
      }

      // 处理永久效果（使用后永久提升属性）
      if (item.permanentEffect) {
        const permLogs = [];
        if (item.permanentEffect.attack) {
          newStats.attack += item.permanentEffect.attack;
          permLogs.push(`攻击力永久 +${item.permanentEffect.attack}`);
        }
        if (item.permanentEffect.defense) {
          newStats.defense += item.permanentEffect.defense;
          permLogs.push(`防御力永久 +${item.permanentEffect.defense}`);
        }
        if (item.permanentEffect.spirit) {
          newStats.spirit += item.permanentEffect.spirit;
          permLogs.push(`神识永久 +${item.permanentEffect.spirit}`);
        }
        if (item.permanentEffect.physique) {
          newStats.physique += item.permanentEffect.physique;
          permLogs.push(`体魄永久 +${item.permanentEffect.physique}`);
        }
        if (item.permanentEffect.speed) {
          newStats.speed += item.permanentEffect.speed;
          permLogs.push(`速度永久 +${item.permanentEffect.speed}`);
        }
        if (item.permanentEffect.maxHp) {
          newStats.maxHp += item.permanentEffect.maxHp;
          newStats.hp += item.permanentEffect.maxHp; // 同时增加当前气血
          permLogs.push(`气血上限永久 +${item.permanentEffect.maxHp}`);
        }
        if (permLogs.length > 0) {
          effectLogs.push(`✨ ${permLogs.join('，')}`);
        }
      }

      // 对于非灵兽蛋的物品，显示使用日志
      if (effectLogs.length > 0 && !isPetEgg) {
        addLog(`你使用了 ${item.name}。 ${effectLogs.join(' ')}`, 'gain');
      }

      return { ...newStats, inventory: newInv, pets: newPets };
    });
  };

  // 丢弃物品
  const handleDiscardItem = (item: Item) => {
    if (window.confirm(`确定要丢弃 ${item.name} x${item.quantity} 吗？`)) {
      setPlayer(prev => {
        // 检查是否已装备
        const isEquipped = Object.values(prev.equippedItems).includes(item.id);
        if (isEquipped) {
          addLog('无法丢弃已装备的物品！请先卸下。', 'danger');
          return prev;
        }

        const newInv = prev.inventory.filter(i => i.id !== item.id);
        addLog(`你丢弃了 ${item.name} x${item.quantity}。`, 'normal');
        return { ...prev, inventory: newInv };
      });
    }
  };

  // 打开商店
  const handleOpenShop = (shopType: ShopType) => {
    const shop = SHOPS.find(s => s.type === shopType);
    if (shop) {
      setCurrentShop(shop);
      setIsShopOpen(true);
      addLog(`你来到了【${shop.name}】。`, 'normal');
    }
  };

  // 购买物品（支持批量购买）
  const handleBuyItem = (shopItem: ShopItem, quantity: number = 1) => {
    setPlayer(prev => {
      const totalPrice = shopItem.price * quantity;
      if (prev.spiritStones < totalPrice) {
        addLog('灵石不足！', 'danger');
        return prev;
      }

      // 检查境界要求
      if (shopItem.minRealm) {
        const itemRealmIndex = REALM_ORDER.indexOf(shopItem.minRealm);
        const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
        if (playerRealmIndex < itemRealmIndex) {
          addLog(`境界不足！需要 ${shopItem.minRealm} 才能购买。`, 'danger');
          return prev;
        }
      }

      const newInv = [...prev.inventory];
      const isEquipment = shopItem.isEquippable && shopItem.equipmentSlot;
      const existingIdx = newInv.findIndex(i => i.name === shopItem.name);

      if (existingIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + quantity };
      } else {
        // 装备类物品或新物品，每个装备单独占一格
        // 如果是装备，每次购买创建一个新物品（quantity=1）
        // 如果是非装备，创建或叠加
        const itemsToAdd = isEquipment ? quantity : 1; // 装备每次购买都创建新物品
        const addQuantity = isEquipment ? 1 : quantity; // 装备quantity始终为1

        for (let i = 0; i < itemsToAdd; i++) {
          const newItem: Item = {
            id: uid(),
            name: shopItem.name,
            type: shopItem.type,
            description: shopItem.description + (isEquipment ? generateAttributePreview(shopItem.effect) : ''),
            quantity: addQuantity,
            rarity: shopItem.rarity,
            level: 0,
            isEquippable: shopItem.isEquippable,
            equipmentSlot: shopItem.equipmentSlot,
            effect: shopItem.effect
          };
          newInv.push(newItem);
        }
      }

      addLog(`你花费 ${totalPrice} 灵石购买了 ${shopItem.name} x${quantity}。`, 'gain');
      // 显示购买成功弹窗
      setPurchaseSuccess({ item: shopItem.name, quantity });
      setTimeout(() => setPurchaseSuccess(null), 2000);

      return {
        ...prev,
        spiritStones: prev.spiritStones - totalPrice,
        inventory: newInv
      };
    });
  };

  // 出售物品
  const handleSellItem = (item: Item) => {
    if (!currentShop) return;

    setPlayer(prev => {
      // 检查是否已装备
      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        addLog('无法出售已装备的物品！请先卸下。', 'danger');
        return prev;
      }

      // 找到对应的商店物品来计算出售价格
      const shopItem = currentShop.items.find(si => si.name === item.name);
      const sellPrice = shopItem?.sellPrice || Math.floor(
        (item.rarity === '普通' ? 5 :
         item.rarity === '稀有' ? 20 :
         item.rarity === '传说' ? 100 : 500) * ((item.level || 0) + 1)
      );

      const newInv = prev.inventory.map(i => {
        if (i.id === item.id) {
          return { ...i, quantity: i.quantity - 1 };
        }
        return i;
      }).filter(i => i.quantity > 0);

      addLog(`你出售了 ${item.name}，获得 ${sellPrice} 灵石。`, 'gain');
      return {
        ...prev,
        spiritStones: prev.spiritStones + sellPrice,
        inventory: newInv
      };
    });
  };

  const handleEquipItem = (item: Item, slot: EquipmentSlot) => {
    // 检查装备类型是否匹配
    if (!item.equipmentSlot) {
      addLog('该物品无法装备！', 'danger');
      return;
    }

    // 对于戒指、首饰、法宝，允许装备到任意同类型的空槽位
    const isRing = item.type === ItemType.Ring;
    const isAccessory = item.type === ItemType.Accessory;
    const isArtifact = item.type === ItemType.Artifact;

    if (isRing) {
      // 戒指可以装备到任意戒指槽位
      const ringSlots = [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4];
      if (!ringSlots.includes(slot)) {
        addLog('戒指只能装备到戒指槽位！', 'danger');
        return;
      }
    } else if (isAccessory) {
      // 首饰可以装备到任意首饰槽位
      const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
      if (!accessorySlots.includes(slot)) {
        addLog('首饰只能装备到首饰槽位！', 'danger');
        return;
      }
    } else if (isArtifact) {
      // 法宝可以装备到任意法宝槽位
      const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
      if (!artifactSlots.includes(slot)) {
        addLog('法宝只能装备到法宝槽位！', 'danger');
        return;
      }
    } else {
      // 其他装备类型需要精确匹配
      if (item.equipmentSlot !== slot) {
        addLog('装备部位不匹配！', 'danger');
        return;
      }
    }

    setPlayer(prev => {
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;
      const newEquippedItems = { ...prev.equippedItems };

      // 1. Remove stats from currently equipped item in this slot if any
      const currentEquippedId = prev.equippedItems[slot];
      if (currentEquippedId) {
        const currentEquipped = prev.inventory.find(i => i.id === currentEquippedId);
        if (currentEquipped) {
          const isNatal = currentEquipped.id === prev.natalArtifactId;
          const stats = getItemStats(currentEquipped, isNatal);
          newAttack -= stats.attack;
          newDefense -= stats.defense;
          newMaxHp -= stats.hp;
          newSpirit -= stats.spirit;
          newPhysique -= stats.physique;
          newSpeed -= stats.speed;
        }
      }

      // 2. Add stats from new item
      const isNatal = item.id === prev.natalArtifactId;
      const newStats = getItemStats(item, isNatal);
      newAttack += newStats.attack;
      newDefense += newStats.defense;
      newMaxHp += newStats.hp;
      newSpirit += newStats.spirit;
      newPhysique += newStats.physique;
      newSpeed += newStats.speed;

      // 3. Update equipped items
      newEquippedItems[slot] = item.id;

      addLog(`你装备了 ${item.name} 到${slot}，实力有所提升。`, 'normal');

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp), // Clamp current HP if maxHp decreased
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed
      };
    });
  };

  // 祭炼本命法宝
  const handleRefineNatalArtifact = (item: Item) => {
    if (item.type !== ItemType.Artifact) {
      addLog('只有法宝才能祭炼为本命法宝！', 'danger');
      return;
    }

    if (item.isNatal) {
      addLog('该法宝已经是本命法宝！', 'normal');
      return;
    }

    // 检查是否已有本命法宝
    setPlayer(prev => {
      if (prev.natalArtifactId) {
        const currentNatal = prev.inventory.find(i => i.id === prev.natalArtifactId);
        if (currentNatal) {
          addLog(`你已经拥有本命法宝【${currentNatal.name}】，需要先解除祭炼才能祭炼新的法宝。`, 'danger');
          return prev;
        }
      }

      // 消耗气血上限（根据法宝稀有度决定消耗量）
      const rarity = item.rarity || '普通';
      const hpCostMap: Record<ItemRarity, number> = {
        '普通': 50,
        '稀有': 100,
        '传说': 200,
        '仙品': 500
      };
      const hpCost = hpCostMap[rarity];

      if (prev.maxHp <= hpCost) {
        addLog(`气血上限不足！祭炼需要消耗 ${hpCost} 点气血上限。`, 'danger');
        return prev;
      }

      // 更新物品，标记为本命
      const newInventory = prev.inventory.map(i => {
        if (i.id === item.id) {
          return { ...i, isNatal: true };
        }
        // 如果之前有本命法宝，取消标记
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      const newMaxHp = prev.maxHp - hpCost;
      const newHp = Math.min(prev.hp, newMaxHp);

      // 如果本命法宝已装备，需要重新计算属性（因为本命法宝有50%加成）
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // 检查本命法宝是否已装备
      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        // 重新计算属性，应用本命加成
        const oldStats = getItemStats(item, false);
        const newStats = getItemStats(item, true);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog(`你消耗了 ${hpCost} 点气血上限，将【${item.name}】祭炼为本命法宝！`, 'special');
      addLog(`本命法宝与你的生命相连，属性加成提升50%！`, 'special');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: item.id,
        maxHp: newMaxHp,
        hp: newHp,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed
      };
    });
  };

  // 解除本命法宝祭炼
  const handleUnrefineNatalArtifact = () => {
    setPlayer(prev => {
      if (!prev.natalArtifactId) {
        addLog('你没有本命法宝！', 'danger');
        return prev;
      }

      const natalItem = prev.inventory.find(i => i.id === prev.natalArtifactId);
      if (!natalItem) {
        addLog('本命法宝不存在！', 'danger');
        return prev;
      }

      const newInventory = prev.inventory.map(i => {
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      // 如果本命法宝已装备，需要重新计算属性（移除本命加成）
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isEquipped = Object.values(prev.equippedItems).includes(prev.natalArtifactId);
      if (isEquipped) {
        const oldStats = getItemStats(natalItem, true);
        const newStats = getItemStats(natalItem, false);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog('你解除了本命法宝的祭炼。', 'normal');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: null,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed
      };
    });
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    setPlayer(prev => {
      const currentEquippedId = prev.equippedItems[slot];
      if (!currentEquippedId) {
        addLog('该栏位没有装备！', 'danger');
        return prev;
      }

      const item = prev.inventory.find(i => i.id === currentEquippedId);
      if (!item) return prev;

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isNatal = item.id === prev.natalArtifactId;
      const stats = getItemStats(item, isNatal);
      newAttack -= stats.attack;
      newDefense -= stats.defense;
      newMaxHp -= stats.hp;
      newSpirit -= stats.spirit;
      newPhysique -= stats.physique;
      newSpeed -= stats.speed;

      const newEquippedItems = { ...prev.equippedItems };
      delete newEquippedItems[slot];

      addLog(`你卸下了 ${item.name}。`, 'normal');

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp),
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed
      };
    });
  };

  const handleOpenUpgrade = (item: Item) => {
    setItemToUpgrade(item);
    setIsUpgradeOpen(true);
  };

  const handleUpgradeItem = (item: Item, costStones: number, costMats: number) => {
    setPlayer(prev => {
      const matsItem = prev.inventory.find(i => i.name === UPGRADE_MATERIAL_NAME);
      if (prev.spiritStones < costStones || !matsItem || matsItem.quantity < costMats) {
        return prev;
      }

      const growthRate = getUpgradeMultiplier(item.rarity);
      const getNextStat = (val: number) => Math.floor(val * (1 + growthRate));

      const newEffect = {
        ...item.effect,
        attack: item.effect?.attack ? getNextStat(item.effect.attack) : undefined,
        defense: item.effect?.defense ? getNextStat(item.effect.defense) : undefined,
        hp: item.effect?.hp ? getNextStat(item.effect.hp) : undefined,
        spirit: item.effect?.spirit ? getNextStat(item.effect.spirit) : undefined,
        physique: item.effect?.physique ? getNextStat(item.effect.physique) : undefined,
        speed: item.effect?.speed ? getNextStat(item.effect.speed) : undefined,
      };

      const newInventory = prev.inventory.map(i => {
        if (i.name === UPGRADE_MATERIAL_NAME) {
          return { ...i, quantity: i.quantity - costMats };
        }
        if (i.id === item.id) {
          return {
            ...i,
            level: (i.level || 0) + 1,
            effect: newEffect
          };
        }
        return i;
      }).filter(i => i.quantity > 0);

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // Check if item is equipped in any slot
      const equippedSlot = Object.entries(prev.equippedItems).find(([_, itemId]) => itemId === item.id)?.[0] as EquipmentSlot | undefined;
      if (equippedSlot) {
        const oldStats = getItemStats(item);
        newAttack -= oldStats.attack;
        newDefense -= oldStats.defense;
        newMaxHp -= oldStats.hp;
        newSpirit -= oldStats.spirit;
        newPhysique -= oldStats.physique;
        newSpeed -= oldStats.speed;

        const newItem = { ...item, effect: newEffect };
        const newStats = getItemStats(newItem);

        newAttack += newStats.attack;
        newDefense += newStats.defense;
        newMaxHp += newStats.hp;
        newSpirit += newStats.spirit;
        newPhysique += newStats.physique;
        newSpeed += newStats.speed;
      }

      addLog(`祭炼成功！${item.name} 品质提升了。`, 'gain');

      return {
        ...prev,
        spiritStones: prev.spiritStones - costStones,
        inventory: newInventory,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed
      };
    });
    setIsUpgradeOpen(false);
    setItemToUpgrade(null);
  };

  const handleLearnArt = (art: CultivationArt) => {
    if (!player || player.spiritStones < art.cost) return;

    setPlayer(prev => {
      const newStones = prev.spiritStones - art.cost;

      const newAttack = prev.attack + (art.effects.attack || 0);
      const newDefense = prev.defense + (art.effects.defense || 0);
      const newMaxHp = prev.maxHp + (art.effects.hp || 0);
      const newHp = prev.hp + (art.effects.hp || 0);

      const newArts = [...prev.cultivationArts, art.id];

      let newActiveId = prev.activeArtId;
      if (!newActiveId && art.type === 'mental') {
        newActiveId = art.id;
      }

      return {
        ...prev,
        spiritStones: newStones,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        cultivationArts: newArts,
        activeArtId: newActiveId
      };
    });

    addLog(`你成功领悟了功法【${art.name}】！实力大增。`, 'gain');
  };

  const handleActivateArt = (art: CultivationArt) => {
    if (art.type !== 'mental') return;
    setPlayer(prev => ({ ...prev, activeArtId: art.id }));
    addLog(`你开始运转心法【${art.name}】。`, 'normal');
  };

  const handleCraft = (recipe: Recipe) => {
    setPlayer(prev => {
      if (prev.spiritStones < recipe.cost) return prev;

      const newInventory = [...prev.inventory];
      for (const req of recipe.ingredients) {
        const itemIdx = newInventory.findIndex(i => i.name === req.name);
        if (itemIdx === -1 || newInventory[itemIdx].quantity < req.qty) return prev;

        newInventory[itemIdx] = { ...newInventory[itemIdx], quantity: newInventory[itemIdx].quantity - req.qty };
      }

      const cleanedInventory = newInventory.filter(i => i.quantity > 0);

      const isEquipment = recipe.result.type === ItemType.Artifact || recipe.result.type === ItemType.Weapon ||
                         recipe.result.type === ItemType.Armor || recipe.result.type === ItemType.Ring ||
                         recipe.result.type === ItemType.Accessory;
      const existingResultIdx = cleanedInventory.findIndex(i => i.name === recipe.result.name);

      if (existingResultIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        cleanedInventory[existingResultIdx] = {
          ...cleanedInventory[existingResultIdx],
          quantity: cleanedInventory[existingResultIdx].quantity + 1
        };
      } else {
        // 装备类物品或新物品，创建新物品（每个装备单独占一格）
        const newItem: Item = {
          id: uid(),
          name: recipe.result.name || 'Unknown',
          type: recipe.result.type || ItemType.Pill,
          description: (recipe.result.description || '') + (isEquipment ? generateAttributePreview(recipe.result.effect) : ''),
          quantity: 1, // 装备quantity始终为1
          rarity: (recipe.result.rarity as ItemRarity) || '普通',
          level: 0,
          effect: recipe.result.effect
        };

        // 如果是装备，添加装备相关属性
        if (isEquipment) {
          newItem.isEquippable = true;
          // 尝试从recipe.result获取equipmentSlot，如果没有则根据类型推断
          if ('equipmentSlot' in recipe.result && recipe.result.equipmentSlot) {
            newItem.equipmentSlot = recipe.result.equipmentSlot as EquipmentSlot;
          } else {
            // 根据类型推断装备槽位
            if (recipe.result.type === ItemType.Artifact) {
              const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
              newItem.equipmentSlot = artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
            } else if (recipe.result.type === ItemType.Weapon) {
              newItem.equipmentSlot = EquipmentSlot.Weapon;
            } else if (recipe.result.type === ItemType.Ring) {
              const ringSlots = [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4];
              newItem.equipmentSlot = ringSlots[Math.floor(Math.random() * ringSlots.length)];
            } else if (recipe.result.type === ItemType.Accessory) {
              const accessorySlots = [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2];
              newItem.equipmentSlot = accessorySlots[Math.floor(Math.random() * accessorySlots.length)];
            }
          }
        }

        cleanedInventory.push(newItem);
      }

      addLog(`丹炉火起，药香四溢。你炼制出了 ${recipe.result.name}。`, 'gain');

      return {
        ...prev,
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory
      };
    });
  };

  // --- SECT HANDLERS ---
  const handleJoinSect = (sectId: string) => {
    const sect = SECTS.find(s => s.id === sectId);
    if (!sect) return;

    setPlayer(prev => ({ ...prev, sectId: sectId, sectRank: SectRank.Outer, sectContribution: 0 }));
    addLog(`恭喜！你已拜入【${sect.name}】，成为一名外门弟子。`, 'special');
  };

  const handleLeaveSect = () => {
    setPlayer(prev => ({ ...prev, sectId: null, sectRank: SectRank.Outer, sectContribution: 0 }));
    addLog(`你叛出了宗门，从此成为一名散修。`, 'danger');
    setIsSectOpen(false);
  };

  const handleSectTask = (type: 'patrol' | 'donate_stone' | 'donate_herb') => {
    setPlayer(prev => {
      // 检查每日任务限制（瞬时完成的任务每日限制10次）
      const today = new Date().toISOString().split('T')[0];
      let dailyTaskCount = prev.dailyTaskCount || 0;
      let lastTaskResetDate = prev.lastTaskResetDate || today;

      // 如果日期变化，重置计数
      if (lastTaskResetDate !== today) {
        dailyTaskCount = 0;
        lastTaskResetDate = today;
      }

      // 瞬时完成的任务（patrol）有每日限制
      if (type === 'patrol') {
        if (dailyTaskCount >= 10) {
          addLog('今日已完成10次瞬时任务，请明日再来。', 'danger');
          return prev;
        }
        dailyTaskCount += 1;
      }

      let contribGain = 0;
      let stoneCost = 0;
      let updatedInventory = [...prev.inventory];

      if (type === 'patrol') {
        contribGain = 10;
        addLog('你在山门附近巡视了一圈，震慑了一些宵小之辈。', 'normal');
      } else if (type === 'donate_stone') {
        if (prev.spiritStones < 100) return prev;
        stoneCost = 100;
        contribGain = 50;
        addLog('你向宗门捐献了 100 灵石。', 'normal');
      } else if (type === 'donate_herb') {
        const herbIdx = updatedInventory.findIndex(i => i.name === '聚灵草');
        if (herbIdx === -1 || updatedInventory[herbIdx].quantity < 1) return prev;

        updatedInventory[herbIdx] = { ...updatedInventory[herbIdx], quantity: updatedInventory[herbIdx].quantity - 1 };
        updatedInventory = updatedInventory.filter(i => i.quantity > 0);
        contribGain = 20;
        addLog('你向炼丹房上交了一株聚灵草。', 'normal');
      }

      return {
        ...prev,
        spiritStones: prev.spiritStones - stoneCost,
        inventory: updatedInventory,
        sectContribution: prev.sectContribution + contribGain,
        dailyTaskCount,
        lastTaskResetDate
      };
    });
  };

  const handleSectPromote = () => {
    setPlayer(prev => {
      const ranks = Object.values(SectRank);
      const currentRankIdx = ranks.indexOf(prev.sectRank);
      const nextRank = ranks[currentRankIdx + 1];

      if (!nextRank) return prev;

      const req = SECT_RANK_REQUIREMENTS[nextRank];
      if (prev.sectContribution < req.contribution) return prev;

      addLog(`恭喜！你晋升为【${nextRank}】，地位大增。`, 'special');

      return {
        ...prev,
        sectRank: nextRank,
        sectContribution: prev.sectContribution - req.contribution
      };
    });
  };

  const handleSectBuy = (itemTemplate: Partial<Item>, cost: number, quantity: number = 1) => {
    setPlayer(prev => {
       const totalCost = cost * quantity;
       if (prev.sectContribution < totalCost) {
         addLog('贡献不足！', 'danger');
         return prev;
       }

      const newInv = [...prev.inventory];
      const isEquipment = itemTemplate.isEquippable && itemTemplate.equipmentSlot;
      const existingIdx = newInv.findIndex(i => i.name === itemTemplate.name);

      if (existingIdx >= 0 && !isEquipment) {
        // 非装备类物品可以叠加
        newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + quantity };
      } else {
        // 装备类物品或新物品，每个装备单独占一格
        // 如果是装备，每次兑换创建一个新物品（quantity=1）
        const itemsToAdd = isEquipment ? quantity : 1; // 装备每次兑换都创建新物品
        const addQuantity = isEquipment ? 1 : quantity; // 装备quantity始终为1

        for (let i = 0; i < itemsToAdd; i++) {
          newInv.push({
            id: uid(),
            name: itemTemplate.name || '未知物品',
            type: itemTemplate.type || ItemType.Material,
            description: (itemTemplate.description || '') + (isEquipment ? generateAttributePreview(itemTemplate.effect) : ''),
            quantity: addQuantity,
            rarity: (itemTemplate.rarity as ItemRarity) || '普通',
            effect: itemTemplate.effect,
            level: 0,
            isEquippable: itemTemplate.isEquippable,
            equipmentSlot: itemTemplate.equipmentSlot
          });
        }
      }

       addLog(`你消耗了 ${totalCost} 贡献，兑换了 ${itemTemplate.name} x${quantity}。`, 'gain');
       // 显示购买成功弹窗
       setPurchaseSuccess({ item: itemTemplate.name || '未知物品', quantity });
       setTimeout(() => setPurchaseSuccess(null), 2000);

       return {
         ...prev,
         sectContribution: prev.sectContribution - totalCost,
         inventory: newInv
       };
    });
  };

  // --- 新系统处理函数 ---

  // 角色系统（天赋不可修改，此函数保留用于兼容性，但不会实际修改天赋）
  const handleSelectTalent = (talentId: string) => {
    // 天赋在游戏开始时随机生成，之后不可修改
    addLog('天赋在游戏开始时已确定，无法修改！', 'danger');
    return;
  };

  const handleSelectTitle = (titleId: string) => {
    const title = TITLES.find(t => t.id === titleId);
    if (!title) return;

    setPlayer(prev => {
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      // 移除旧称号效果
      if (prev.titleId) {
        const oldTitle = TITLES.find(t => t.id === prev.titleId);
        if (oldTitle) {
          newAttack -= oldTitle.effects.attack || 0;
          newDefense -= oldTitle.effects.defense || 0;
          newMaxHp -= oldTitle.effects.hp || 0;
          newHp -= oldTitle.effects.hp || 0;
        }
      }

      // 应用新称号效果
      newAttack += title.effects.attack || 0;
      newDefense += title.effects.defense || 0;
      newMaxHp += title.effects.hp || 0;
      newHp += title.effects.hp || 0;

      addLog(`你装备了称号【${title.name}】！`, 'special');
      return {
        ...prev,
        titleId: titleId,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(newHp, newMaxHp)
      };
    });
  };

  const handleAllocateAttribute = (type: 'attack' | 'defense' | 'hp') => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer(prev => {
      const points = prev.attributePoints - 1;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      if (type === 'attack') {
        newAttack += 5;
        addLog('你分配了1点属性点到攻击力 (+5)', 'gain');
      } else if (type === 'defense') {
        newDefense += 3;
        addLog('你分配了1点属性点到防御力 (+3)', 'gain');
      } else if (type === 'hp') {
        newMaxHp += 20;
        newHp += 20;
        addLog('你分配了1点属性点到气血 (+20)', 'gain');
      }

      return {
        ...prev,
        attributePoints: points,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp
      };
    });
  };

  // 成就系统
  const checkAchievements = useCallback(() => {
    if (!player) return; // 防止 player 为 null
    if (checkingAchievementsRef.current) return; // 防止重复触发
    checkingAchievementsRef.current = true;

    setPlayer(prev => {
      if (!prev) {
        checkingAchievementsRef.current = false;
        return prev; // 防止 prev 为 null
      }

      const newAchievements = [...prev.achievements];
      let hasNewAchievement = false;
      let newExp = prev.exp;
      let newStones = prev.spiritStones;
      let newInv = [...prev.inventory];
      let newTitleId = prev.titleId;

      ACHIEVEMENTS.forEach(achievement => {
        // 跳过已完成的成就，避免重复触发
        if (newAchievements.includes(achievement.id)) return;

        let completed = false;
        if (achievement.requirement.type === 'realm') {
          const realmIndex = REALM_ORDER.indexOf(achievement.requirement.target as RealmType);
          const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
          completed = playerRealmIndex >= realmIndex;
        } else if (achievement.requirement.type === 'custom' && achievement.requirement.target === 'meditate') {
          // 这个需要在打坐时单独检查
          return;
        }

        if (completed) {
          hasNewAchievement = true;
          newAchievements.push(achievement.id);
          newExp += achievement.reward.exp || 0;
          newStones += achievement.reward.spiritStones || 0;

          if (achievement.reward.items) {
            achievement.reward.items.forEach(item => {
              const existingIdx = newInv.findIndex(i => i.name === item.name);
              if (existingIdx >= 0) {
                newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
              } else {
                newInv.push({ ...item, id: uid() });
              }
            });
          }

          if (achievement.reward.titleId) {
            newTitleId = achievement.reward.titleId;
          }

          addLog(`🎉 达成成就：【${achievement.name}】！`, 'special');
        }
      });

      if (hasNewAchievement && newTitleId && newTitleId !== prev.titleId) {
        // 应用新称号效果
        const title = TITLES.find(t => t.id === newTitleId);
        if (title) {
          const oldTitle = prev.titleId ? TITLES.find(t => t.id === prev.titleId) : null;
          let titleAttack = prev.attack - (oldTitle?.effects.attack || 0) + (title.effects.attack || 0);
          let titleDefense = prev.defense - (oldTitle?.effects.defense || 0) + (title.effects.defense || 0);
          let titleMaxHp = prev.maxHp - (oldTitle?.effects.hp || 0) + (title.effects.hp || 0);
          let titleHp = prev.hp - (oldTitle?.effects.hp || 0) + (title.effects.hp || 0);

          checkingAchievementsRef.current = false;
          return {
            ...prev,
            achievements: newAchievements,
            exp: newExp,
            spiritStones: newStones,
            inventory: newInv,
            titleId: newTitleId,
            attack: titleAttack,
            defense: titleDefense,
            maxHp: titleMaxHp,
            hp: Math.min(titleHp, titleMaxHp)
          };
        }
      }

      if (hasNewAchievement) {
        checkingAchievementsRef.current = false;
        return {
          ...prev,
          achievements: newAchievements,
          exp: newExp,
          spiritStones: newStones,
          inventory: newInv,
          titleId: newTitleId || prev.titleId
        };
      }

      checkingAchievementsRef.current = false;
      return prev;
    });
  }, [player]);

  // 灵宠系统
  const handleActivatePet = (petId: string) => {
    if (!player) return;
    setPlayer(prev => ({ ...prev, activePetId: petId }));
    const pet = player.pets.find(p => p.id === petId);
    if (pet) addLog(`你激活了灵宠【${pet.name}】！`, 'gain');
  };

  const handleFeedPet = (petId: string) => {
    setPlayer(prev => {
      const newPets = prev.pets.map(pet => {
        if (pet.id === petId) {
          let newExp = pet.exp + 10;
          let newLevel = pet.level;
          let newMaxExp = pet.maxExp;
          let leveledUp = false;

          if (newExp >= pet.maxExp) {
            newLevel += 1;
            newExp = 0;
            newMaxExp = Math.floor(pet.maxExp * 1.5);
            leveledUp = true;
            addLog(`【${pet.name}】升级了！现在是 ${newLevel} 级`, 'gain');
          }

          // 只有升级时才提升属性，而不是每次喂养都提升
          const newStats = leveledUp ? {
            attack: Math.floor(pet.stats.attack * 1.1),
            defense: Math.floor(pet.stats.defense * 1.1),
            hp: Math.floor(pet.stats.hp * 1.1),
            speed: Math.floor(pet.stats.speed * 1.05) // 速度也稍微提升
          } : pet.stats;

          return {
            ...pet,
            level: newLevel,
            exp: newExp,
            maxExp: newMaxExp,
            stats: newStats
          };
        }
        return pet;
      });

      return { ...prev, pets: newPets };
    });
  };

  const handleEvolvePet = (petId: string) => {
    if (!player) return;
    const pet = player.pets.find(p => p.id === petId);
    if (!pet || pet.evolutionStage >= 2) return;

    const template = PET_TEMPLATES.find(t => t.species === pet.species);
    if (!template || !template.evolutionRequirements) return;

    if (pet.level < template.evolutionRequirements.level) {
      addLog(`灵宠等级不足，需要 ${template.evolutionRequirements.level} 级才能进化`, 'danger');
      return;
    }

    setPlayer(prev => {
      const newPets = prev.pets.map(p => {
        if (p.id === petId) {
          return {
            ...p,
            evolutionStage: p.evolutionStage + 1,
            stats: {
              attack: Math.floor(p.stats.attack * 1.5),
              defense: Math.floor(p.stats.defense * 1.5),
              hp: Math.floor(p.stats.hp * 1.5),
              speed: Math.floor(p.stats.speed * 1.2)
            }
          };
        }
        return p;
      });

      addLog(`【${pet.name}】进化了！实力大幅提升！`, 'special');
      return { ...prev, pets: newPets };
    });
  };

  // 抽奖系统
  const handleDraw = (count: 1 | 10) => {
    if (!player || player.lotteryTickets < count) {
      addLog('抽奖券不足！', 'danger');
      return;
    }

    const results: typeof LOTTERY_PRIZES = [];
    let guaranteedRare = count === 10 && (player.lotteryCount + 1) % 10 === 0;

    for (let i = 0; i < count; i++) {
      if (guaranteedRare && i === count - 1) {
        // 保底稀有以上
        const rarePrizes = LOTTERY_PRIZES.filter(p => p.rarity !== '普通');
        const totalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const prize of rarePrizes) {
          random -= prize.weight;
          if (random <= 0) {
            results.push(prize);
            break;
          }
        }
      } else {
        const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const prize of LOTTERY_PRIZES) {
          random -= prize.weight;
          if (random <= 0) {
            results.push(prize);
            break;
          }
        }
      }
    }

    // 收集所有获得的奖励用于弹窗显示
    const rewards: Array<{ type: string; name: string; quantity?: number }> = [];

    setPlayer(prev => {
      let newInv = [...prev.inventory];
      let newStones = prev.spiritStones;
      let newExp = prev.exp;
      let newPets = [...prev.pets];
      let newTickets = prev.lotteryTickets;

      for (const prize of results) {
        if (prize.type === 'spiritStones') {
          const amount = prize.value.spiritStones || 0;
          newStones += amount;
          rewards.push({ type: 'spiritStones', name: '灵石', quantity: amount });
          addLog(`获得 ${amount} 灵石`, 'gain');
        } else if (prize.type === 'exp') {
          const amount = prize.value.exp || 0;
          newExp += amount;
          rewards.push({ type: 'exp', name: '修为', quantity: amount });
          addLog(`获得 ${amount} 修为`, 'gain');
        } else if (prize.type === 'item' && prize.value.item) {
          const item = prize.value.item;
          const isEquipment = item.isEquippable && item.equipmentSlot;
          const existingIdx = newInv.findIndex(i => i.name === item.name);

          if (existingIdx >= 0 && !isEquipment) {
            // 非装备类物品可以叠加
            newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
          } else {
            // 装备类物品或新物品，每个装备单独占一格
            // 如果是法宝类型但没有装备槽位，自动分配
            let finalItem = { ...item };
            if (item.type === ItemType.Artifact && !item.equipmentSlot) {
              const artifactSlots = [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2];
              finalItem.equipmentSlot = artifactSlots[Math.floor(Math.random() * artifactSlots.length)];
              finalItem.isEquippable = true;
            }

            // 添加属性预览到描述
            const finalIsEquipment = finalItem.isEquippable && finalItem.equipmentSlot;
            const descriptionWithPreview = (finalItem.description || '') + (finalIsEquipment ? generateAttributePreview(finalItem.effect) : '');

            newInv.push({
              ...finalItem,
              id: uid(),
              description: descriptionWithPreview,
              quantity: 1 // 装备quantity始终为1
            } as Item);
          }
          rewards.push({ type: 'item', name: item.name, quantity: 1 });
          addLog(`获得 ${item.name}！`, 'gain');
        } else if (prize.type === 'pet' && prize.value.petId) {
          const template = PET_TEMPLATES.find(t => t.id === prize.value.petId);
          if (template) {
            const newPet: Pet = {
              id: uid(),
              name: template.name,
              species: template.species,
              level: 1,
              exp: 0,
              maxExp: 100,
              rarity: template.rarity,
              stats: { ...template.baseStats },
              skills: [...template.skills],
              evolutionStage: 0,
              affection: 50
            };
            newPets.push(newPet);
            rewards.push({ type: 'pet', name: template.name, quantity: 1 });
            addLog(`获得灵宠【${template.name}】！`, 'special');
          }
        } else if (prize.type === 'ticket') {
          const amount = prize.value.tickets || 0;
          newTickets += amount;
          rewards.push({ type: 'ticket', name: '抽奖券', quantity: amount });
          addLog(`获得 ${amount} 张抽奖券`, 'gain');
        }
      }

      return {
        ...prev,
        lotteryTickets: newTickets - count,
        lotteryCount: prev.lotteryCount + count,
        inventory: newInv,
        spiritStones: newStones,
        exp: newExp,
        pets: newPets
      };
    });

    // 显示抽奖结果弹窗（在setPlayer外部调用）
    if (rewards.length > 0) {
      setLotteryRewards(rewards);
      setTimeout(() => setLotteryRewards([]), 3000);
    }
  };

  // 检查成就（境界变化时）
  useEffect(() => {
    if (player) {
      checkAchievements();
    }
  }, [player?.realm, player?.realmLevel, checkAchievements]);

  // 设置系统
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // 显示开始界面
  if (!gameStarted || !player) {
    return <StartScreen onStart={handleStartGame} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-900 text-stone-200 overflow-hidden relative">

      {/* Visual Effects Layer */}
      <CombatVisuals effects={visualEffects} />

      <div className="hidden md:block">
        <StatsPanel player={player} />
      </div>

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="bg-paper-800 p-2 md:p-4 border-b border-stone-700 flex justify-between items-center shadow-lg z-10">
          <h1 className="text-base md:text-xl font-serif text-mystic-gold tracking-widest">云灵修仙</h1>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-12 h-12 bg-ink-800 active:bg-stone-700 rounded border border-stone-600 touch-manipulation"
          >
            <Menu size={24} className="text-stone-200" />
          </button>
          {/* Desktop Buttons */}
          <div className="hidden md:flex gap-2 flex-wrap">
            <button
              onClick={() => setIsCultivationOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <BookOpen size={18} />
              <span>功法</span>
            </button>
            <button
              onClick={() => setIsInventoryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <Backpack size={18} />
              <span>储物袋</span>
            </button>
            <button
              onClick={() => setIsCharacterOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <Star size={18} />
              <span>角色</span>
            </button>
            <button
              onClick={() => {
                setIsAchievementOpen(true);
                setPlayer(prev => ({
                  ...prev,
                  viewedAchievements: [...prev.achievements]
                }));
              }}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
            >
              <Trophy size={18} />
              <span>成就</span>
              {(() => {
                const newAchievements = player.achievements.filter(a => !player.viewedAchievements.includes(a));
                return newAchievements.length > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newAchievements.length}
                  </span>
                ) : null;
              })()}
            </button>
            <button
              onClick={() => setIsPetOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <Sparkles size={18} />
              <span>灵宠</span>
              {player.pets.length > 0 && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                  {player.pets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsLotteryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <Gift size={18} />
              <span>抽奖</span>
              {player.lotteryTickets > 0 && (
                <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">
                  {player.lotteryTickets}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            >
              <Settings size={18} />
              <span>设置</span>
            </button>
          </div>
        </header>

        <LogPanel logs={logs} className="pb-[23rem] md:pb-0" />

        {/* Action Bar - Mobile: Bottom Fixed, Desktop: Normal */}
        <div className="bg-paper-800 p-3 md:p-4 border-t border-stone-700 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 shrink-0 fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto z-20 shadow-lg md:shadow-none">

          <button
            onClick={handleMeditate}
            disabled={loading || cooldown > 0}
            className={`
              flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
              ${loading || cooldown > 0 ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 active:border-mystic-jade active:bg-ink-700 text-stone-200'}
            `}
          >
            <User size={24} className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-mystic-jade" />
            <span className="font-serif font-bold text-base md:text-base">打坐</span>
            <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">修炼 · 心法</span>
          </button>

          <button
            onClick={handleAdventure}
            disabled={loading || cooldown > 0}
            className={`
              flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 group touch-manipulation min-h-[90px] md:min-h-[100px]
              ${loading || cooldown > 0 ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 active:border-mystic-gold active:bg-ink-700 text-stone-200'}
            `}
          >
            <Sword size={24} className={`md:w-6 md:h-6 mb-1.5 md:mb-2 text-mystic-gold ${loading ? 'animate-spin' : 'group-active:scale-110 transition-transform'}`} />
            <span className="font-serif font-bold text-base md:text-base">{loading ? '历练中...' : '历练'}</span>
            <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">机缘 · 战斗</span>
          </button>

          <button
            onClick={() => setIsRealmOpen(true)}
            disabled={loading}
            className={`
              flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 active:border-purple-500 active:bg-ink-700 text-stone-200'}
            `}
          >
            <Mountain size={24} className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-purple-400" />
            <span className="font-serif font-bold text-base md:text-base">秘境</span>
            <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">探险 · 夺宝</span>
          </button>

          <button
            onClick={() => setIsAlchemyOpen(true)}
            disabled={loading}
            className={`
              flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 active:border-cyan-500 active:bg-ink-700 text-stone-200'}
            `}
          >
            <Sparkles size={24} className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-cyan-400" />
            <span className="font-serif font-bold text-base md:text-base">炼丹</span>
            <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">丹药 · 辅助</span>
          </button>

          <button
            onClick={() => setIsSectOpen(true)}
            className={`
              flex flex-col items-center justify-center p-4 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 active:border-blue-400 active:bg-ink-700 text-stone-200'}
            `}
          >
            <Scroll size={24} className="md:w-6 md:h-6 mb-1.5 md:mb-2 text-blue-400" />
            <span className="font-serif font-bold text-base md:text-base">宗门</span>
            <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1">任务 · 晋升</span>
          </button>

        </div>
      </main>

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={player.inventory}
        equippedItems={player.equippedItems}
        player={player}
        onUseItem={handleUseItem}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onUpgradeItem={handleOpenUpgrade}
        onDiscardItem={handleDiscardItem}
        onRefineNatalArtifact={handleRefineNatalArtifact}
        onUnrefineNatalArtifact={handleUnrefineNatalArtifact}
      />

      <CultivationModal
        isOpen={isCultivationOpen}
        onClose={() => setIsCultivationOpen(false)}
        player={player}
        onLearnArt={handleLearnArt}
        onActivateArt={handleActivateArt}
      />

      <AlchemyModal
        isOpen={isAlchemyOpen}
        onClose={() => setIsAlchemyOpen(false)}
        player={player}
        onCraft={handleCraft}
      />

      <ArtifactUpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => { setIsUpgradeOpen(false); setItemToUpgrade(null); }}
        item={itemToUpgrade}
        player={player}
        onConfirm={handleUpgradeItem}
      />

      <SectModal
        isOpen={isSectOpen}
        onClose={() => setIsSectOpen(false)}
        player={player}
        onJoinSect={handleJoinSect}
        onLeaveSect={handleLeaveSect}
        onTask={handleSectTask}
        onPromote={handleSectPromote}
        onBuy={handleSectBuy}
      />

      <SecretRealmModal
        isOpen={isRealmOpen}
        onClose={() => setIsRealmOpen(false)}
        player={player}
        onEnter={handleEnterRealm}
      />

      <CharacterModal
        isOpen={isCharacterOpen}
        onClose={() => setIsCharacterOpen(false)}
        player={player}
        onSelectTalent={handleSelectTalent}
        onSelectTitle={handleSelectTitle}
        onAllocateAttribute={handleAllocateAttribute}
        onUseInheritance={handleUseInheritance}
      />

      <AchievementModal
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
        player={player}
      />

      <PetModal
        isOpen={isPetOpen}
        onClose={() => setIsPetOpen(false)}
        player={player}
        onActivatePet={handleActivatePet}
        onFeedPet={handleFeedPet}
        onEvolvePet={handleEvolvePet}
      />

      <LotteryModal
        isOpen={isLotteryOpen}
        onClose={() => setIsLotteryOpen(false)}
        player={player}
        onDraw={handleDraw}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {currentShop && (
        <ShopModal
          isOpen={isShopOpen}
          onClose={() => { setIsShopOpen(false); setCurrentShop(null); }}
          shop={currentShop}
          player={player}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
        />
      )}

      {/* 购买成功弹窗 */}
      {purchaseSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-green-400 animate-bounce pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <div className="font-bold text-lg">购买成功！</div>
                <div className="text-sm">获得 {purchaseSuccess.item} x{purchaseSuccess.quantity}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 抽奖获得物品弹窗 */}
      {lotteryRewards.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] pointer-events-none">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white px-8 py-6 rounded-lg shadow-2xl border-2 border-purple-400 animate-bounce pointer-events-auto max-w-md">
            <div className="flex flex-col items-center gap-3">
              <div className="text-3xl">🎁</div>
              <div className="font-bold text-xl">抽奖获得！</div>
              <div className="w-full space-y-2 max-h-60 overflow-y-auto">
                {lotteryRewards.map((reward, idx) => (
                  <div key={idx} className="bg-white/20 rounded px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold">{reward.name}</span>
                    {reward.quantity !== undefined && (
                      <span className="text-yellow-300 font-bold">x{reward.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenStats={() => setIsMobileStatsOpen(true)}
        onOpenCultivation={() => setIsCultivationOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenCharacter={() => setIsCharacterOpen(true)}
        onOpenAchievement={() => {
          setIsAchievementOpen(true);
          setPlayer(prev => ({
            ...prev,
            viewedAchievements: [...prev.achievements]
          }));
        }}
        onOpenPet={() => setIsPetOpen(true)}
        onOpenLottery={() => setIsLotteryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        achievementCount={player.achievements.filter(a => !player.viewedAchievements.includes(a)).length}
        petCount={player.pets.length}
        lotteryTickets={player.lotteryTickets}
      />

      {isMobileStatsOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-[70] p-0 md:hidden touch-manipulation"
          onClick={() => setIsMobileStatsOpen(false)}
        >
          <div
            className="bg-paper-800 w-full h-[80vh] rounded-t-2xl border border-stone-700 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StatsPanel player={player} />
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
