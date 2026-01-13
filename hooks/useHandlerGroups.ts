/**
 * Handler Groups Hook
 * 统一管理 App 组件中所有 handlers 的分组
 *
 * 从 App.tsx 中提取，将多个 useMemo 整合到一个 hook 中
 */
import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Item, PlayerStats, ShopItem, SecretRealm } from '../types';
import type { BattleReplay } from '../services/battleService';

/**
 * 核心游戏操作 handlers
 */
interface CoreHandlers {
  handleMeditate: () => void; // 打坐
  handleAdventure: () => Promise<void>; // 历练
  handleEnterRealm: (realm: SecretRealm) => Promise<void>; // 进入境界
  handleUseItem: (item: Item) => void; // 使用物品
  handleEquipItem: (item: Item) => void; // 装备物品
  handleUnequipItem: (slot: string) => void; // 卸下物品
  handleOpenUpgrade: (item: Item) => void; // 打开升级界面
  handleDiscardItem: (item: Item) => void; // 丢弃物品
  handleBatchDiscard: (itemIds: string[]) => void; // 批量丢弃物品
  handleBatchUse: (itemIds: string[]) => void; // 批量使用物品
  handleOrganizeInventory: () => void; // 整理背包
  handleRefineNatalArtifact: (item: Item) => void; // 涅槃重生
  handleUnrefineNatalArtifact: () => void; // 取消涅槃重生
  handleRefineAdvancedItem: (item: Item, materialIds: string[]) => void; // 强化高级物品
  handleUpgradeItem: (item: Item, costStones: number, costMats: number, upgradeStones?: number, failurePenalty?: number) => Promise<'success' | 'failure' | 'error'>; // 升级物品
  handleLearnArt: (artId: string) => void; // 学习功法
  handleActivateArt: (artId: string) => void; // 激活功法
  handleCraft: (recipeId: string) => void; // 炼制丹药
  handleCraftArtifact: (materials: Item[], customName: string, selectedSlot?: string) => Promise<void>; // 炼制法宝
  handleFuseArtifact: (item1: Item, item2: Item, stone: Item, customName?: string) => Promise<void>; // 融合法宝
}

/**
 * 宗门相关 handlers
 */
interface SectHandlers {
  handleJoinSect: (sectId: string) => void; // 加入宗门
  handleLeaveSect: () => void; // 离开宗门
  handleSafeLeaveSect: () => void; // 安全离开宗门
  handleSectTask: () => void; // 宗门任务
  handleSectPromote: () => void; // 宗门晋升
  handleSectBuy: (itemId: string) => void; // 宗门购买
  handleChallengeLeader: () => void; // 挑战宗门领袖
}

/**
 * 角色相关 handlers
 */
interface CharacterHandlers {
  handleSelectTalent: (talentId: string) => void; // 选择天赋
  handleSelectTitle: (titleId: string) => void; // 选择称号
  handleAllocateAttribute: (attr: string, amount: number) => void; // 分配属性
  handleAllocateAllAttributes: (distribution: Record<string, number>) => void; // 分配所有属性
  handleUseInheritance: () => void; // 使用传承
}

/**
 * 灵宠相关 handlers
 */
interface PetHandlers {
  handleActivatePet: (petId: string) => void; // 激活灵宠
  handleDeactivatePet: (petId: string) => void; // 解除灵宠
  handleFeedPet: (petId: string, itemId: string) => void; // 喂养灵宠
  handleBatchFeedItems: (petId: string, itemIds: string[]) => void; // 批量喂养灵宠
  handleBatchFeedHp: (petId: string, hpAmount: number) => void; // 批量喂养灵宠
  handleEvolvePet: (petId: string) => void; // 进化灵宠
  handleReleasePet: (petId: string) => void; // 释放灵宠
  handleBatchReleasePets: (petIds: string[]) => void; // 批量释放灵宠
}

/**
 * 洞府相关 handlers
 */
interface GrottoHandlers {
  handleUpgradeGrotto: () => void; // 升级洞府
  handlePlantHerb: (slotIndex: number, herbId: string) => void; // 种植草药
  handleHarvestHerb: (slotIndex: number) => void; // 收获草药
  handleHarvestAll: () => void; // 收获所有草药
  handleEnhanceSpiritArray: () => void; // 增强灵力
  handleToggleAutoHarvest: () => void; // 切换自动收获
  handleSpeedupHerb: (slotIndex: number) => void; // 加速草药收获
}

/**
 * 商店和战斗相关 handlers
 */
interface ShopAndBattleHandlers {
  handleBuyItem: (item: ShopItem) => void; // 购买物品
  handleSellItem: (item: Item) => void; // 出售物品
  handleRefreshShop: (newItems: ShopItem[]) => void; // 刷新商店
  handleReputationEventChoice: (choiceIndex: number) => void; // 选择声望事件
  handleTakeTreasureVaultItem: (item: Item) => void; // 领取宝库物品
  handleUpdateVault: (vault: { items: Item[]; takenItemIds: string[] }) => void; // 更新宝库
  handleBattleResult: (result: any) => void; // 战斗结果
  handleSkipBattleLogs: () => void; // 跳过战斗日志
  handleCloseBattleModal: () => void; // 关闭战斗模态框
  handleDraw: (count: number) => void; // 抽取
  handleUpdateSettings: (settings: any) => void; // 更新设置
  handleRebirth: () => void; // 涅槃重生
  handleClaimQuestReward: (questId: string) => void; // 领取任务奖励
}

/**
 * Modal Setters 分组
 */
interface ModalSettersGroup {
  setIsInventoryOpen: (open: boolean) => void; // 打开背包
  setIsCultivationOpen: (open: boolean) => void; // 打开修仙法门
  setIsAlchemyOpen: (open: boolean) => void; // 打开炼丹界面
  setIsUpgradeOpen: (open: boolean) => void; // 打开升级界面
  setIsSectOpen: (open: boolean) => void; // 打开宗门界面
  setIsRealmOpen: (open: boolean) => void; // 打开境界界面
  setIsCharacterOpen: (open: boolean) => void; // 打开角色界面
  setIsAchievementOpen: (open: boolean) => void; // 打开成就界面
  setIsPetOpen: (open: boolean) => void; // 打开灵宠界面
  setIsLotteryOpen: (open: boolean) => void; // 打开抽奖界面
  setIsSettingsOpen: (open: boolean) => void; // 打开设置界面
  setIsDebugOpen: (open: boolean) => void; // 打开调试界面
  setIsDailyQuestOpen: (open: boolean) => void; // 打开每日任务界面
  setIsShopOpen: (open: boolean) => void; // 打开商店界面
  setIsGrottoOpen: (open: boolean) => void; // 打开洞府界面
  setIsBattleModalOpen: (open: boolean) => void; // 打开战斗模态框
  setIsTurnBasedBattleOpen: (open: boolean) => void; // 打开回合制战斗界面
  setIsMobileSidebarOpen: (open: boolean) => void; // 打开移动侧边栏
  setIsMobileStatsOpen: (open: boolean) => void; // 打开移动统计界面
  setIsReputationEventOpen: (open: boolean) => void; // 打开声望事件界面
  setIsTreasureVaultOpen: (open: boolean) => void; // 打开宝库界面
  setIsSaveManagerOpen: (open: boolean) => void; // 打开存档管理器界面
  setIsAutoAdventureConfigOpen: (open: boolean) => void; // 打开自动历练配置界面
}

/**
 * 其他 Setters 和状态
 */
interface OtherSettersAndState {
  setItemToUpgrade: (item: Item | null) => void; // 设置升级物品
  setCurrentShop: (shop: any) => void; // 设置当前商店
  setBattleReplay: (replay: BattleReplay | null) => void; // 设置战斗回放
  setRevealedBattleRounds: (rounds: number) => void; // 设置已揭露的战斗回合
  setTurnBasedBattleParams: (params: any) => void; // 设置回合制战斗参数
  setReputationEvent: (event: any) => void; // 设置声望事件
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>; // 设置玩家
  addLog: (message: string, type?: string) => void; // 添加日志
  autoMeditate: boolean; // 自动打坐
  autoAdventure: boolean; // 自动历练
  pausedByShop: boolean; // 暂停商店
  pausedByBattle: boolean; // 暂停战斗
  pausedByReputationEvent: boolean; // 暂停声望事件
  pausedByHeavenEarthSoul: boolean; // 天地之魄暂停
  setAutoMeditate: (value: boolean) => void;
  setAutoAdventure: (value: boolean) => void; // 设置自动历练
  setPausedByShop: (value: boolean) => void; // 设置暂停商店
  setPausedByBattle: (value: boolean) => void; // 设置暂停战斗
  setPausedByReputationEvent: (value: boolean) => void; // 设置暂停声望事件
  setPausedByHeavenEarthSoul: (value: boolean) => void; // 天地之魄暂停
}

interface UseHandlerGroupsProps {
  // 从 useAppHandlers 获取的 handlers
  appHandlers: {
    handleMeditate: () => void; // 打坐
    handleAdventure: () => Promise<void>; // 历练
    handleEnterRealm: (realm: SecretRealm) => Promise<void>; // 进入境界
    handleUseItem: (item: Item) => void; // 使用物品
    handleEquipItem: (item: Item) => void; // 装备物品
    handleUnequipItem: (slot: string) => void; // 卸下物品
    handleOpenUpgrade: (item: Item) => void; // 打开升级界面
    handleDiscardItem: (item: Item) => void; // 丢弃物品
    handleBatchDiscard: (itemIds: string[]) => void; // 批量丢弃物品
    handleBatchUse: (itemIds: string[]) => void; // 批量使用物品
    handleOrganizeInventory: () => void; // 整理背包
    handleRefineNatalArtifact: (item: Item) => void; // 涅槃重生
    handleUnrefineNatalArtifact: () => void; // 取消涅槃重生
    handleRefineAdvancedItem: (item: Item, materialIds: string[]) => void; // 强化高级物品
    handleUpgradeItem: (item: Item, costStones: number, costMats: number, upgradeStones?: number, failurePenalty?: number) => Promise<'success' | 'failure' | 'error'>;
    handleLearnArt: (artId: string) => void; // 学习功法
    handleActivateArt: (artId: string) => void; // 激活功法
    handleCraft: (recipeId: string) => void; // 炼制丹药
    handleCraftArtifact: (materials: Item[], customName: string, selectedSlot?: string) => Promise<void>; // 炼制法宝
    handleFuseArtifact: (item1: Item, item2: Item, stone: Item) => Promise<void>; // 融合法宝
    handleSelectTalent: (talentId: string) => void; // 选择天赋
    handleSelectTitle: (titleId: string) => void; // 选择称号
    handleAllocateAttribute: (attr: string, amount: number) => void; // 分配属性
    handleAllocateAllAttributes: (distribution: Record<string, number>) => void; // 分配所有属性
    handleUseInheritance: () => void; // 使用传承
    handleActivatePet: (petId: string) => void; // 激活灵宠
    handleDeactivatePet: (petId: string) => void; // 解除灵宠
    handleFeedPet: (petId: string, itemId: string) => void; // 喂养灵宠
    handleBatchFeedItems: (petId: string, itemIds: string[]) => void; // 批量喂养灵宠
    handleBatchFeedHp: (petId: string, hpAmount: number) => void; // 批量喂养灵宠
    handleEvolvePet: (petId: string) => void; // 进化灵宠
    handleReleasePet: (petId: string) => void; // 释放灵宠
    handleBatchReleasePets: (petIds: string[]) => void; // 批量释放灵宠
    handleJoinSect: (sectId: string) => void; // 加入宗门
    handleLeaveSect: () => void; // 离开宗门
    handleSafeLeaveSect: () => void; // 安全离开宗门
    handleSectTask: () => void; // 宗门任务
    handleSectPromote: () => void; // 宗门晋升
    handleSectBuy: (itemId: string) => void; // 宗门购买
    handleChallengeLeader: () => void; // 挑战宗门领袖
    handleBuyItem: (item: ShopItem) => void;
    handleSellItem: (item: Item) => void; // 出售物品
    handleRefreshShop: (newItems: ShopItem[]) => void; // 刷新商店
    handleReputationEventChoice: (choiceIndex: number) => void; // 选择声望事件
    handleTakeTreasureVaultItem: (item: Item) => void; // 领取宝库物品
    handleUpdateVault: (vault: { items: Item[]; takenItemIds: string[] }) => void; // 更新宝库
    handleBattleResult: (result: any) => void; // 战斗结果
    handleSkipBattleLogs: () => void; // 跳过战斗日志
    handleCloseBattleModal: () => void; // 关闭战斗模态框
    handleDraw: (count: number) => void; // 抽取
    handleUpdateSettings: (settings: any) => void; // 更新设置
    handleRebirth: () => void; // 涅槃重生
    handleClaimQuestReward: (questId: string) => void; // 领取任务奖励
    checkAchievements: () => void; // 检查成就
    // 洞府相关
    handleUpgradeGrotto: () => void; // 升级洞府
    handlePlantHerb: (slotIndex: number, herbId: string) => void; // 种植草药
    handleHarvestHerb: (slotIndex: number) => void; // 收获草药
    handleHarvestAll: () => void; // 收获所有草药
    handleEnhanceSpiritArray: () => void; // 增强灵力
    handleToggleAutoHarvest: () => void; // 切换自动收获
    handleSpeedupHerb: (slotIndex: number) => void; // 加速草药收获
    claimQuestReward: (questId: string) => void; // 领取任务奖励（别名）
  };

  // 额外的 handlers
  handleRebirth: () => void;

  // Modal setters
  modalSetters: ModalSettersGroup;

  // 其他 setters 和状态
  otherSettersAndState: OtherSettersAndState;
}

/**
 * 核心游戏操作 handlers 分组
 */
export function useCoreHandlers(appHandlers: UseHandlerGroupsProps['appHandlers']): CoreHandlers {
  return useMemo(
    () => ({
      handleMeditate: appHandlers.handleMeditate,
      handleAdventure: appHandlers.handleAdventure,
      handleEnterRealm: appHandlers.handleEnterRealm,
      handleUseItem: appHandlers.handleUseItem,
      handleEquipItem: appHandlers.handleEquipItem,
      handleUnequipItem: appHandlers.handleUnequipItem,
      handleOpenUpgrade: appHandlers.handleOpenUpgrade,
      handleDiscardItem: appHandlers.handleDiscardItem,
      handleBatchDiscard: appHandlers.handleBatchDiscard,
      handleBatchUse: appHandlers.handleBatchUse,
      handleOrganizeInventory: appHandlers.handleOrganizeInventory,
      handleRefineNatalArtifact: appHandlers.handleRefineNatalArtifact,
      handleUnrefineNatalArtifact: appHandlers.handleUnrefineNatalArtifact,
      handleRefineAdvancedItem: appHandlers.handleRefineAdvancedItem,
      handleUpgradeItem: appHandlers.handleUpgradeItem,
      handleLearnArt: appHandlers.handleLearnArt,
      handleActivateArt: appHandlers.handleActivateArt,
      handleCraft: appHandlers.handleCraft,
      handleCraftArtifact: appHandlers.handleCraftArtifact,
      handleFuseArtifact: appHandlers.handleFuseArtifact,
    }),
    [
      appHandlers.handleMeditate,
      appHandlers.handleAdventure,
      appHandlers.handleEnterRealm,
      appHandlers.handleUseItem,
      appHandlers.handleEquipItem,
      appHandlers.handleUnequipItem,
      appHandlers.handleOpenUpgrade,
      appHandlers.handleDiscardItem,
      appHandlers.handleBatchDiscard,
      appHandlers.handleBatchUse,
      appHandlers.handleOrganizeInventory,
      appHandlers.handleRefineNatalArtifact,
      appHandlers.handleUnrefineNatalArtifact,
      appHandlers.handleRefineAdvancedItem,
      appHandlers.handleUpgradeItem,
      appHandlers.handleLearnArt,
      appHandlers.handleActivateArt,
      appHandlers.handleCraft,
      appHandlers.handleCraftArtifact,
      appHandlers.handleFuseArtifact,
    ]
  );
}

/**
 * 宗门相关 handlers 分组
 */
export function useSectHandlersGroup(appHandlers: UseHandlerGroupsProps['appHandlers']): SectHandlers {
  return useMemo(
    () => ({
      handleJoinSect: appHandlers.handleJoinSect,
      handleLeaveSect: appHandlers.handleLeaveSect,
      handleSafeLeaveSect: appHandlers.handleSafeLeaveSect,
      handleSectTask: appHandlers.handleSectTask,
      handleSectPromote: appHandlers.handleSectPromote,
      handleSectBuy: appHandlers.handleSectBuy,
      handleChallengeLeader: appHandlers.handleChallengeLeader,
    }),
    [
      appHandlers.handleJoinSect,
      appHandlers.handleLeaveSect,
      appHandlers.handleSafeLeaveSect,
      appHandlers.handleSectTask,
      appHandlers.handleSectPromote,
      appHandlers.handleSectBuy,
      appHandlers.handleChallengeLeader,
    ]
  );
}

/**
 * 角色相关 handlers 分组
 */
export function useCharacterHandlersGroup(appHandlers: UseHandlerGroupsProps['appHandlers']): CharacterHandlers {
  return useMemo(
    () => ({
      handleSelectTalent: appHandlers.handleSelectTalent,
      handleSelectTitle: appHandlers.handleSelectTitle,
      handleAllocateAttribute: appHandlers.handleAllocateAttribute,
      handleAllocateAllAttributes: appHandlers.handleAllocateAllAttributes,
      handleUseInheritance: appHandlers.handleUseInheritance,
    }),
    [
      appHandlers.handleSelectTalent,
      appHandlers.handleSelectTitle,
      appHandlers.handleAllocateAttribute,
      appHandlers.handleAllocateAllAttributes,
      appHandlers.handleUseInheritance,
    ]
  );
}

/**
 * 灵宠相关 handlers 分组
 */
export function usePetHandlersGroup(appHandlers: UseHandlerGroupsProps['appHandlers']): PetHandlers {
  return useMemo(
    () => ({
      handleActivatePet: appHandlers.handleActivatePet,
      handleDeactivatePet: appHandlers.handleDeactivatePet,
      handleFeedPet: appHandlers.handleFeedPet,
      handleBatchFeedItems: appHandlers.handleBatchFeedItems,
      handleBatchFeedHp: appHandlers.handleBatchFeedHp,
      handleEvolvePet: appHandlers.handleEvolvePet,
      handleReleasePet: appHandlers.handleReleasePet,
      handleBatchReleasePets: appHandlers.handleBatchReleasePets,
    }),
    [
      appHandlers.handleActivatePet,
      appHandlers.handleDeactivatePet,
      appHandlers.handleFeedPet,
      appHandlers.handleBatchFeedItems,
      appHandlers.handleBatchFeedHp,
      appHandlers.handleEvolvePet,
      appHandlers.handleReleasePet,
      appHandlers.handleBatchReleasePets,
    ]
  );
}

/**
 * 洞府相关 handlers 分组
 */
export function useGrottoHandlersGroup(appHandlers: UseHandlerGroupsProps['appHandlers']): GrottoHandlers {
  return useMemo(
    () => ({
      handleUpgradeGrotto: appHandlers.handleUpgradeGrotto,
      handlePlantHerb: appHandlers.handlePlantHerb,
      handleHarvestHerb: appHandlers.handleHarvestHerb,
      handleHarvestAll: appHandlers.handleHarvestAll,
      handleEnhanceSpiritArray: appHandlers.handleEnhanceSpiritArray,
      handleToggleAutoHarvest: appHandlers.handleToggleAutoHarvest,
      handleSpeedupHerb: appHandlers.handleSpeedupHerb,
    }),
    [
      appHandlers.handleUpgradeGrotto,
      appHandlers.handlePlantHerb,
      appHandlers.handleHarvestHerb,
      appHandlers.handleHarvestAll,
      appHandlers.handleEnhanceSpiritArray,
      appHandlers.handleToggleAutoHarvest,
      appHandlers.handleSpeedupHerb,
    ]
  );
}

/**
 * 商店和战斗相关 handlers 分组
 */
export function useShopAndBattleHandlersGroup(
  appHandlers: UseHandlerGroupsProps['appHandlers'],
  handleRebirth: () => void
): ShopAndBattleHandlers {
  return useMemo(
    () => ({
      handleBuyItem: appHandlers.handleBuyItem,
      handleSellItem: appHandlers.handleSellItem,
      handleRefreshShop: appHandlers.handleRefreshShop,
      handleReputationEventChoice: appHandlers.handleReputationEventChoice,
      handleTakeTreasureVaultItem: appHandlers.handleTakeTreasureVaultItem,
      handleUpdateVault: appHandlers.handleUpdateVault,
      handleBattleResult: appHandlers.handleBattleResult,
      handleSkipBattleLogs: appHandlers.handleSkipBattleLogs,
      handleCloseBattleModal: appHandlers.handleCloseBattleModal,
      handleDraw: appHandlers.handleDraw,
      handleUpdateSettings: appHandlers.handleUpdateSettings,
      handleRebirth,
      handleClaimQuestReward: appHandlers.claimQuestReward,
    }),
    [
      appHandlers.handleBuyItem,
      appHandlers.handleSellItem,
      appHandlers.handleRefreshShop,
      appHandlers.handleReputationEventChoice,
      appHandlers.handleTakeTreasureVaultItem,
      appHandlers.handleUpdateVault,
      appHandlers.handleBattleResult,
      appHandlers.handleSkipBattleLogs,
      appHandlers.handleCloseBattleModal,
      appHandlers.handleDraw,
      appHandlers.handleUpdateSettings,
      handleRebirth,
      appHandlers.claimQuestReward,
    ]
  );
}

/**
 * 统一的 Handler Groups Hook
 * 整合所有 handlers 分组，简化 App.tsx 的代码
 */
export function useHandlerGroups(props: UseHandlerGroupsProps) {
  const { appHandlers, handleRebirth, modalSetters, otherSettersAndState } = props;

  const coreHandlers = useCoreHandlers(appHandlers);
  const sectHandlers = useSectHandlersGroup(appHandlers);
  const characterHandlers = useCharacterHandlersGroup(appHandlers);
  const petHandlers = usePetHandlersGroup(appHandlers);
  const grottoHandlers = useGrottoHandlersGroup(appHandlers);
  const shopAndBattleHandlers = useShopAndBattleHandlersGroup(appHandlers, handleRebirth);

  // 合并所有 handlers 参数（用于 useGameViewHandlers 和 useModalsHandlers）
  const commonHandlersParams = useMemo(
    () => ({
      ...coreHandlers,
      ...sectHandlers,
      ...characterHandlers,
      ...petHandlers,
      ...grottoHandlers,
      ...shopAndBattleHandlers,
      ...modalSetters,
      ...otherSettersAndState,
    }),
    [
      coreHandlers,
      sectHandlers,
      characterHandlers,
      petHandlers,
      grottoHandlers,
      shopAndBattleHandlers,
      modalSetters,
      otherSettersAndState,
    ]
  );

  return {
    coreHandlers,
    sectHandlers,
    characterHandlers,
    petHandlers,
    grottoHandlers,
    shopAndBattleHandlers,
    commonHandlersParams,
  };
}

