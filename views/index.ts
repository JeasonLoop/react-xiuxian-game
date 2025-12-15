// 统一导出所有 views 模块的 handlers

// 基础功能
export { useMeditationHandlers } from './meditation';
export { useBreakthroughHandlers } from './breakthrough';
export { useBattleHandlers } from './battle';

// 物品和装备
export { useItemHandlers } from './items';
export { useEquipmentHandlers } from './equipment';

// 游戏系统
export { useCultivationHandlers } from './cultivation';
export { useAlchemyHandlers } from './alchemy';
export { useCharacterHandlers } from './character';

// UI 组件
export { default as GameView } from './GameView';
export { default as GameHeader } from './GameHeader';
export { default as ActionBar } from './ActionBar';
export { ModalsContainer } from './modals';

// 商店和设置
export { useShopHandlers } from './shop';
export { useSettingsHandlers } from './settings';
export { useRealmHandlers } from './realm';

// 其他模块
export { useAdventureHandlers } from './adventure';
export { useSectHandlers } from './sect';
export { usePetHandlers } from './pet';
export { useLotteryHandlers } from './lottery';
export { useAchievementHandlers } from './achievement';
export { useDailyQuestHandlers } from './dailyQuest';
