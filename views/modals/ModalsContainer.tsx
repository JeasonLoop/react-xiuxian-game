import React from 'react';
import { PlayerStats, Shop, GameSettings, Item } from '../../types';
import InventoryModal from '../../components/InventoryModal';
import CultivationModal from '../../components/CultivationModal';
import AlchemyModal from '../../components/AlchemyModal';
import ArtifactUpgradeModal from '../../components/ArtifactUpgradeModal';
import SectModal from '../../components/SectModal';
import SecretRealmModal from '../../components/SecretRealmModal';
import BattleModal from '../../components/BattleModal';
import CharacterModal from '../../components/CharacterModal';
import AchievementModal from '../../components/AchievementModal';
import PetModal from '../../components/PetModal';
import LotteryModal from '../../components/LotteryModal';
import SettingsModal from '../../components/SettingsModal';
import ShopModal from '../../components/ShopModal';
import { BattleReplay } from '../../services/battleService';
import { CultivationArt, Recipe } from '../../types';
import { RandomSectTask } from '../../services/randomService';

/**
 * 弹窗容器组件
 * 包含战斗、背包、功法、炼丹、法宝强化、宗门、秘境、角色、成就、灵宠、抽奖、设置、商店弹窗
 * @param player 玩家数据
 * @param settings 游戏设置
 * @param modals 弹窗状态
 * @param modalState 弹窗状态
 * @param handlers 弹窗处理函数
 */

interface ModalsContainerProps {
  player: PlayerStats;
  settings: GameSettings;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  modals: {
    isInventoryOpen: boolean;
    isCultivationOpen: boolean;
    isAlchemyOpen: boolean;
    isUpgradeOpen: boolean;
    isSectOpen: boolean;
    isRealmOpen: boolean;
    isCharacterOpen: boolean;
    isAchievementOpen: boolean;
    isPetOpen: boolean;
    isLotteryOpen: boolean;
    isSettingsOpen: boolean;
    isShopOpen: boolean;
    isBattleModalOpen: boolean;
  };
  modalState: {
    currentShop: Shop | null;
    itemToUpgrade: Item | null;
    battleReplay: BattleReplay | null;
    revealedBattleRounds: number;
  };
  handlers: {
    // Modal toggles
    setIsInventoryOpen: (open: boolean) => void;
    setIsCultivationOpen: (open: boolean) => void;
    setIsAlchemyOpen: (open: boolean) => void;
    setIsUpgradeOpen: (open: boolean) => void;
    setIsSectOpen: (open: boolean) => void;
    setIsRealmOpen: (open: boolean) => void;
    setIsCharacterOpen: (open: boolean) => void;
    setIsAchievementOpen: (open: boolean) => void;
    setIsPetOpen: (open: boolean) => void;
    setIsLotteryOpen: (open: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setIsShopOpen: (open: boolean) => void;
    setIsBattleModalOpen: (open: boolean) => void;
    setItemToUpgrade: (item: Item | null) => void;
    setCurrentShop: (shop: Shop | null) => void;
    setBattleReplay: (replay: BattleReplay | null) => void;
    setRevealedBattleRounds: (
      rounds: number | ((prev: number) => number)
    ) => void;
    // Battle
    handleSkipBattleLogs: () => void;
    handleCloseBattleModal: () => void;
    // Inventory
    handleUseItem: (item: Item) => void;
    handleEquipItem: (item: Item, slot: any) => void;
    handleUnequipItem: (slot: any) => void;
    handleOpenUpgrade: (item: Item) => void;
    handleDiscardItem: (item: Item) => void;
    handleBatchDiscard: (itemIds: string[]) => void;
    handleRefineNatalArtifact: (item: Item) => void;
    handleUnrefineNatalArtifact: () => void;
    handleUpgradeItem: (item: Item, costStones: number, costMats: number, upgradeStones?: number) => Promise<'success' | 'failure' | 'error'>;
    // Cultivation
    handleLearnArt: (art: CultivationArt) => void;
    handleActivateArt: (art: CultivationArt) => void;
    // Alchemy
    handleCraft: (recipe: Recipe) => void;
    // Sect
    handleJoinSect: (sectId: string, sectName?: string) => void;
    handleLeaveSect: () => void;
    handleSafeLeaveSect: () => void;
    handleSectTask: (task: RandomSectTask, encounterResult?: any) => void;
    handleSectPromote: () => void;
    handleSectBuy: (
      itemTemplate: Partial<Item>,
      cost: number,
      quantity?: number
    ) => void;
    // Realm
    handleEnterRealm: (realm: any) => void;
    // Character
    handleSelectTalent: (talentId: string) => void;
    handleSelectTitle: (titleId: string) => void;
    handleAllocateAttribute: (type: 'attack' | 'defense' | 'hp') => void;
    handleUseInheritance: () => void;
    handleUpdateViewedAchievements: () => void;
    // Pet
    handleActivatePet: (petId: string) => void;
    handleFeedPet: (
      petId: string,
      feedType: 'hp' | 'item' | 'exp',
      itemId?: string
    ) => void;
    handleEvolvePet: (petId: string) => void;
    // Lottery
    handleDraw: (count: 1 | 10) => void;
    // Settings
    handleUpdateSettings: (newSettings: Partial<GameSettings>) => void;
    // Shop
    handleBuyItem: (shopItem: any, quantity?: number) => void;
    handleSellItem: (item: Item) => void;
    handleRefreshShop?: (newItems: ShopItem[]) => void;
  };
}

export default function ModalsContainer({
  player,
  settings,
  setItemActionLog,
  modals,
  modalState,
  handlers,
}: ModalsContainerProps) {
  return (
    <>
      <BattleModal
        isOpen={modals.isBattleModalOpen}
        replay={modalState.battleReplay}
        revealedRounds={modalState.revealedBattleRounds}
        onSkip={handlers.handleSkipBattleLogs}
        onClose={handlers.handleCloseBattleModal}
      />

      <InventoryModal
        isOpen={modals.isInventoryOpen}
        onClose={() => handlers.setIsInventoryOpen(false)}
        inventory={player.inventory}
        equippedItems={player.equippedItems}
        player={player}
        onUseItem={handlers.handleUseItem}
        onEquipItem={handlers.handleEquipItem}
        onUnequipItem={handlers.handleUnequipItem}
        onUpgradeItem={handlers.handleOpenUpgrade}
        onDiscardItem={handlers.handleDiscardItem}
        onBatchDiscard={handlers.handleBatchDiscard}
        onRefineNatalArtifact={handlers.handleRefineNatalArtifact}
        onUnrefineNatalArtifact={handlers.handleUnrefineNatalArtifact}
      />

      <CultivationModal
        isOpen={modals.isCultivationOpen}
        onClose={() => handlers.setIsCultivationOpen(false)}
        player={player}
        onLearnArt={handlers.handleLearnArt}
        onActivateArt={handlers.handleActivateArt}
      />

      <AlchemyModal
        isOpen={modals.isAlchemyOpen}
        onClose={() => handlers.setIsAlchemyOpen(false)}
        player={player}
        onCraft={handlers.handleCraft}
      />

      <ArtifactUpgradeModal
        isOpen={modals.isUpgradeOpen}
        onClose={() => {
          handlers.setIsUpgradeOpen(false);
          handlers.setItemToUpgrade(null);
        }}
        item={modalState.itemToUpgrade}
        player={player}
        onConfirm={handlers.handleUpgradeItem}
        setItemActionLog={setItemActionLog}
      />

      <SectModal
        isOpen={modals.isSectOpen}
        onClose={() => handlers.setIsSectOpen(false)}
        player={player}
        onJoinSect={handlers.handleJoinSect}
        onLeaveSect={handlers.handleLeaveSect}
        onSafeLeaveSect={handlers.handleSafeLeaveSect}
        onTask={handlers.handleSectTask}
        onPromote={handlers.handleSectPromote}
        onBuy={handlers.handleSectBuy}
      />

      <SecretRealmModal
        isOpen={modals.isRealmOpen}
        onClose={() => handlers.setIsRealmOpen(false)}
        player={player}
        onEnter={handlers.handleEnterRealm}
      />

      <CharacterModal
        isOpen={modals.isCharacterOpen}
        onClose={() => handlers.setIsCharacterOpen(false)}
        player={player}
        onSelectTalent={handlers.handleSelectTalent}
        onSelectTitle={handlers.handleSelectTitle}
        onAllocateAttribute={handlers.handleAllocateAttribute}
        onUseInheritance={handlers.handleUseInheritance}
      />

      <AchievementModal
        isOpen={modals.isAchievementOpen}
        onClose={() => handlers.setIsAchievementOpen(false)}
        player={player}
      />

      <PetModal
        isOpen={modals.isPetOpen}
        onClose={() => handlers.setIsPetOpen(false)}
        player={player}
        onActivatePet={handlers.handleActivatePet}
        onFeedPet={handlers.handleFeedPet}
        onEvolvePet={handlers.handleEvolvePet}
      />

      <LotteryModal
        isOpen={modals.isLotteryOpen}
        onClose={() => handlers.setIsLotteryOpen(false)}
        player={player}
        onDraw={handlers.handleDraw}
      />

      <SettingsModal
        isOpen={modals.isSettingsOpen}
        onClose={() => handlers.setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handlers.handleUpdateSettings}
      />

      {modalState.currentShop && (
        <ShopModal
          isOpen={modals.isShopOpen}
          onClose={() => {
            handlers.setIsShopOpen(false);
            handlers.setCurrentShop(null);
          }}
          shop={modalState.currentShop}
          player={player}
          onBuyItem={handlers.handleBuyItem}
          onSellItem={handlers.handleSellItem}
          onRefreshShop={handlers.handleRefreshShop}
        />
      )}
    </>
  );
}
