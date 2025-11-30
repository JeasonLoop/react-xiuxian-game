import { useState } from 'react';
import { Shop, Item } from '../../types';

export function useModalState() {
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    item: string;
    quantity: number;
  } | null>(null);
  const [lotteryRewards, setLotteryRewards] = useState<
    Array<{ type: string; name: string; quantity?: number }>
  >([]);

  return {
    modals: {
      isInventoryOpen,
      setIsInventoryOpen,
      isCultivationOpen,
      setIsCultivationOpen,
      isAlchemyOpen,
      setIsAlchemyOpen,
      isUpgradeOpen,
      setIsUpgradeOpen,
      isSectOpen,
      setIsSectOpen,
      isRealmOpen,
      setIsRealmOpen,
      isCharacterOpen,
      setIsCharacterOpen,
      isAchievementOpen,
      setIsAchievementOpen,
      isPetOpen,
      setIsPetOpen,
      isLotteryOpen,
      setIsLotteryOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      isShopOpen,
      setIsShopOpen,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      isMobileStatsOpen,
      setIsMobileStatsOpen,
    },
    shop: {
      currentShop,
      setCurrentShop,
    },
    upgrade: {
      itemToUpgrade,
      setItemToUpgrade,
    },
    notifications: {
      purchaseSuccess,
      setPurchaseSuccess,
      lotteryRewards,
      setLotteryRewards,
    },
  };
}
