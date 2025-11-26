
import React, { useState, useEffect } from 'react';
import { PlayerStats, RealmType, LogEntry, Item, ItemType, AdventureResult, CultivationArt, ItemRarity, SectRank, SecretRealm, AdventureType, Recipe } from './types';
import { REALM_DATA, INITIAL_ITEMS, CULTIVATION_ARTS, PILL_RECIPES, RARITY_MULTIPLIERS, UPGRADE_MATERIAL_NAME, getUpgradeMultiplier, SECTS, SECT_RANK_REQUIREMENTS, REALM_ORDER } from './constants';
import StatsPanel from './components/StatsPanel';
import LogPanel from './components/LogPanel';
import InventoryModal from './components/InventoryModal';
import CultivationModal from './components/CultivationModal';
import AlchemyModal from './components/AlchemyModal';
import ArtifactUpgradeModal from './components/ArtifactUpgradeModal';
import SectModal from './components/SectModal';
import SecretRealmModal from './components/SecretRealmModal';
import CombatVisuals from './components/CombatVisuals';
import { generateAdventureEvent, generateBreakthroughFlavorText } from './services/geminiService';
import { Sword, User, Backpack, BookOpen, Sparkles, Scroll, Mountain } from 'lucide-react';

// Unique ID generator
const uid = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [player, setPlayer] = useState<PlayerStats>({
    name: '初入仙途',
    realm: RealmType.QiRefining,
    realmLevel: 1,
    exp: 0,
    maxExp: REALM_DATA[RealmType.QiRefining].maxExpBase,
    hp: REALM_DATA[RealmType.QiRefining].baseMaxHp,
    maxHp: REALM_DATA[RealmType.QiRefining].baseMaxHp,
    attack: REALM_DATA[RealmType.QiRefining].baseAttack,
    defense: REALM_DATA[RealmType.QiRefining].baseDefense,
    spiritStones: 50, // Give some starter money
    inventory: [...INITIAL_ITEMS],
    cultivationArts: [],
    activeArtId: null,
    equippedArtifactId: null,
    sectId: null,
    sectRank: SectRank.Outer,
    sectContribution: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: uid(), text: "欢迎来到修仙世界。你的长生之路就此开始。", type: 'special', timestamp: Date.now() }
  ]);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCultivationOpen, setIsCultivationOpen] = useState(false);
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSectOpen, setIsSectOpen] = useState(false);
  const [isRealmOpen, setIsRealmOpen] = useState(false);
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null);
  
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

  // Helper to calculate item stats based on rarity
  const getItemStats = (item: Item) => {
    const rarity = item.rarity || '普通';
    const multiplier = RARITY_MULTIPLIERS[rarity] || 1;
    
    return {
      attack: item.effect?.attack ? Math.floor(item.effect.attack * multiplier) : 0,
      defense: item.effect?.defense ? Math.floor(item.effect.defense * multiplier) : 0,
      hp: item.effect?.hp ? Math.floor(item.effect.hp * multiplier) : 0,
    };
  };

  // Passive Regeneration logic
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayer(prev => {
        if (prev.hp < prev.maxHp) {
          return { ...prev, hp: Math.min(prev.maxHp, prev.hp + Math.max(1, Math.floor(prev.maxHp * 0.01))) };
        }
        return prev;
      });
      if (cooldown > 0) setCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Action: Meditate (Reliable Exp)
  const handleMeditate = () => {
    if (loading || cooldown > 0) return;
    
    let baseGain = 10 + (player.realmLevel * 5);
    
    // Apply Active Art Bonus
    const activeArt = CULTIVATION_ARTS.find(a => a.id === player.activeArtId);
    if (activeArt && activeArt.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + activeArt.effects.expRate));
    }

    // Slight randomness
    const actualGain = Math.floor(baseGain * (0.8 + Math.random() * 0.4));
    
    setPlayer(prev => ({ ...prev, exp: prev.exp + actualGain }));
    
    const artText = activeArt ? `，运转${activeArt.name}` : '';
    addLog(`你潜心感悟大道${artText}。(+${actualGain} 修为)`);
    setCooldown(1);
    checkLevelUp(actualGain);
  };

  // Common adventure/realm logic
  const executeAdventure = async (adventureType: AdventureType, realmName?: string) => {
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
        
        if (result.itemObtained) {
          const existingIdx = newInv.findIndex(i => i.name === result.itemObtained?.name);
          if (existingIdx >= 0) {
            newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
          } else {
            const newItem: Item = {
              id: uid(),
              name: result.itemObtained.name,
              type: result.itemObtained.type as ItemType || ItemType.Material,
              description: result.itemObtained.description,
              quantity: 1,
              rarity: (result.itemObtained.rarity as ItemRarity) || '普通',
              level: 0,
              isEquippable: result.itemObtained.isEquippable,
              effect: result.itemObtained.effect
            };
            newInv.push(newItem);
          }
        }

        return {
          ...prev,
          hp: Math.max(0, Math.min(prev.maxHp, prev.hp + result.hpChange)),
          exp: prev.exp + result.expChange,
          spiritStones: prev.spiritStones + result.spiritStonesChange,
          inventory: newInv
        };
      });

      addLog(result.story, result.eventColor);
      
      if (result.itemObtained) {
        addLog(`获得物品: ${result.itemObtained.name}`, 'gain');
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

    // 10% Chance for a Lucky Event
    const isLucky = Math.random() < 0.1;
    await executeAdventure(isLucky ? 'lucky' : 'normal');
  };

  // Action: Secret Realm
  const handleEnterRealm = async (realm: SecretRealm) => {
    if (loading || cooldown > 0) return;
    
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
    if (player.exp >= player.maxExp) {
      handleBreakthrough();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.exp, player.maxExp]);

  const checkLevelUp = (addedExp: number) => {
    // Rely on useEffect
  };

  const handleBreakthrough = async () => {
    if (loading) return; 
    
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

        prev.cultivationArts.forEach(artId => {
           const art = CULTIVATION_ARTS.find(a => a.id === artId);
           if (art) {
             bonusAttack += art.effects.attack || 0;
             bonusDefense += art.effects.defense || 0;
             bonusHp += art.effects.hp || 0;
           }
        });

        // 2. Calculate Equipment Bonuses
        const equippedItem = prev.inventory.find(i => i.id === prev.equippedArtifactId);
        if (equippedItem && equippedItem.effect) {
          const itemStats = getItemStats(equippedItem);
          bonusAttack += itemStats.attack;
          bonusDefense += itemStats.defense;
          bonusHp += itemStats.hp;
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
      
      if (item.effect?.hp) {
        newStats.hp = Math.min(newStats.maxHp, newStats.hp + item.effect.hp);
        effectLogs.push(`恢复了 ${item.effect.hp} 点气血。`);
      }
      if (item.effect?.exp) {
        newStats.exp += item.effect.exp;
        effectLogs.push(`增长了 ${item.effect.exp} 点修为。`);
      }

      addLog(`你使用了 ${item.name}。 ${effectLogs.join(' ')}`, 'gain');
      
      return { ...newStats, inventory: newInv };
    });
  };

  const handleEquipItem = (item: Item) => {
    setPlayer(prev => {
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;

      // 1. Remove stats from currently equipped item if any
      const currentEquipped = prev.inventory.find(i => i.id === prev.equippedArtifactId);
      if (currentEquipped) {
        const stats = getItemStats(currentEquipped);
        newAttack -= stats.attack;
        newDefense -= stats.defense;
        newMaxHp -= stats.hp;
      }

      // 2. Add stats from new item
      const newStats = getItemStats(item);
      newAttack += newStats.attack;
      newDefense += newStats.defense;
      newMaxHp += newStats.hp;

      addLog(`你装备了 ${item.name}，实力有所提升。`, 'normal');

      return {
        ...prev,
        equippedArtifactId: item.id,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp) // Clamp current HP if maxHp decreased
      };
    });
  };

  const handleUnequipItem = (item: Item) => {
    setPlayer(prev => {
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;

      const stats = getItemStats(item);
      newAttack -= stats.attack;
      newDefense -= stats.defense;
      newMaxHp -= stats.hp;

      addLog(`你卸下了 ${item.name}。`, 'normal');

      return {
        ...prev,
        equippedArtifactId: null,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp)
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

      if (item.id === prev.equippedArtifactId) {
        const oldStats = getItemStats(item);
        newAttack -= oldStats.attack;
        newDefense -= oldStats.defense;
        newMaxHp -= oldStats.hp;

        const newItem = { ...item, effect: newEffect };
        const newStats = getItemStats(newItem);
        
        newAttack += newStats.attack;
        newDefense += newStats.defense;
        newMaxHp += newStats.hp;
      }

      addLog(`祭炼成功！${item.name} 品质提升了。`, 'gain');

      return {
        ...prev,
        spiritStones: prev.spiritStones - costStones,
        inventory: newInventory,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp
      };
    });
    setIsUpgradeOpen(false);
    setItemToUpgrade(null);
  };

  const handleLearnArt = (art: CultivationArt) => {
    if (player.spiritStones < art.cost) return;

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

      const existingResultIdx = cleanedInventory.findIndex(i => i.name === recipe.result.name);
      if (existingResultIdx >= 0) {
        cleanedInventory[existingResultIdx] = { 
          ...cleanedInventory[existingResultIdx], 
          quantity: cleanedInventory[existingResultIdx].quantity + 1 
        };
      } else {
        cleanedInventory.push({
          id: uid(),
          name: recipe.result.name || 'Unknown',
          type: recipe.result.type || ItemType.Pill,
          description: recipe.result.description || '',
          quantity: 1,
          rarity: (recipe.result.rarity as ItemRarity) || '普通',
          level: 0,
          effect: recipe.result.effect
        });
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
        sectContribution: prev.sectContribution + contribGain
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

  const handleSectBuy = (itemTemplate: Partial<Item>, cost: number) => {
    setPlayer(prev => {
       if (prev.sectContribution < cost) return prev;

       const newInv = [...prev.inventory];
       const existingIdx = newInv.findIndex(i => i.name === itemTemplate.name);
       
       if (existingIdx >= 0) {
         newInv[existingIdx] = { ...newInv[existingIdx], quantity: newInv[existingIdx].quantity + 1 };
       } else {
         newInv.push({
           id: uid(),
           name: itemTemplate.name || '未知物品',
           type: itemTemplate.type || ItemType.Material,
           description: itemTemplate.description || '',
           quantity: 1,
           rarity: (itemTemplate.rarity as ItemRarity) || '普通',
           effect: itemTemplate.effect,
           level: 0
         });
       }

       addLog(`你消耗了 ${cost} 贡献，兑换了 ${itemTemplate.name}。`, 'gain');

       return {
         ...prev,
         sectContribution: prev.sectContribution - cost,
         inventory: newInv
       };
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-900 text-stone-200 overflow-hidden relative">
      
      {/* Visual Effects Layer */}
      <CombatVisuals effects={visualEffects} />

      <StatsPanel player={player} />

      <main className="flex-1 flex flex-col h-full relative">
        <header className="bg-paper-800 p-4 border-b border-stone-700 flex justify-between items-center shadow-lg z-10">
          <h1 className="text-xl font-serif text-mystic-gold tracking-widest">云灵修仙</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCultivationOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm"
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">功法</span>
            </button>
            <button 
              onClick={() => setIsInventoryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded border border-stone-600 transition-colors text-sm"
            >
              <Backpack size={18} />
              <span className="hidden sm:inline">储物袋</span>
            </button>
          </div>
        </header>

        <LogPanel logs={logs} />

        {/* Action Bar */}
        <div className="bg-paper-800 p-4 border-t border-stone-700 grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
          
          <button
            onClick={handleMeditate}
            disabled={loading || cooldown > 0}
            className={`
              flex flex-col items-center justify-center p-4 rounded border transition-all duration-200
              ${loading || cooldown > 0 ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 hover:border-mystic-jade hover:bg-ink-700 text-stone-200'}
            `}
          >
            <User size={24} className="mb-2 text-mystic-jade" />
            <span className="font-serif font-bold">打坐</span>
            <span className="text-xs text-stone-500 mt-1">修炼 · 心法</span>
          </button>

          <button
            onClick={handleAdventure}
            disabled={loading || cooldown > 0}
            className={`
              flex flex-col items-center justify-center p-4 rounded border transition-all duration-200 group
              ${loading || cooldown > 0 ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 hover:border-mystic-gold hover:bg-ink-700 text-stone-200'}
            `}
          >
            <Sword size={24} className={`mb-2 text-mystic-gold ${loading ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="font-serif font-bold">{loading ? '历练中...' : '历练'}</span>
            <span className="text-xs text-stone-500 mt-1">机缘 · 战斗</span>
          </button>

          <button
            onClick={() => setIsRealmOpen(true)}
            disabled={loading}
            className={`
              flex flex-col items-center justify-center p-4 rounded border transition-all duration-200
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 hover:border-purple-500 hover:bg-ink-700 text-stone-200'}
            `}
          >
            <Mountain size={24} className="mb-2 text-purple-400" />
            <span className="font-serif font-bold">秘境</span>
            <span className="text-xs text-stone-500 mt-1">探险 · 夺宝</span>
          </button>

          <button
            onClick={() => setIsAlchemyOpen(true)}
            disabled={loading}
            className={`
              flex flex-col items-center justify-center p-4 rounded border transition-all duration-200
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 hover:border-cyan-500 hover:bg-ink-700 text-stone-200'}
            `}
          >
            <Sparkles size={24} className="mb-2 text-cyan-400" />
            <span className="font-serif font-bold">炼丹</span>
            <span className="text-xs text-stone-500 mt-1">丹药 · 辅助</span>
          </button>

          <button
            onClick={() => setIsSectOpen(true)}
            className={`
              flex flex-col items-center justify-center p-4 rounded border transition-all duration-200
              ${loading ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed' : 'bg-ink-800 border-stone-600 hover:border-blue-400 hover:bg-ink-700 text-stone-200'}
            `}
          >
            <Scroll size={24} className="mb-2 text-blue-400" />
            <span className="font-serif font-bold">宗门</span>
            <span className="text-xs text-stone-500 mt-1">任务 · 晋升</span>
          </button>

        </div>
      </main>

      <InventoryModal 
        isOpen={isInventoryOpen} 
        onClose={() => setIsInventoryOpen(false)} 
        inventory={player.inventory}
        equippedId={player.equippedArtifactId}
        player={player}
        onUseItem={handleUseItem}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onUpgradeItem={handleOpenUpgrade}
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

    </div>
  );
}

export default App;
