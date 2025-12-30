/**
 * App 键盘快捷键 Hook
 * 统一管理所有键盘快捷键配置
 */

import { useMemo } from 'react';
import { PlayerStats } from '../types';
import { KeyboardShortcut } from './useKeyboardShortcuts';
import { getShortcutConfig, configToShortcut } from '../utils/shortcutUtils';

interface UseAppKeyboardShortcutsProps {
  player: PlayerStats | null;
  gameStarted: boolean;
  settings: {
    keyboardShortcuts?: Record<string, any>;
  };
  handleMeditate: () => void;
  handleAdventure: () => void;
  autoMeditate: boolean;
  autoAdventure: boolean;
  setAutoMeditate: (value: boolean | ((prev: boolean) => boolean)) => void;
  setAutoAdventure: (value: boolean | ((prev: boolean) => boolean)) => void;
  setAutoAdventurePausedByShop: (value: boolean) => void;
  setAutoAdventurePausedByBattle: (value: boolean) => void;
  setAutoAdventurePausedByReputationEvent: (value: boolean) => void;
  setIsInventoryOpen: (open: boolean) => void;
  setIsCultivationOpen: (open: boolean) => void;
  setIsCharacterOpen: (open: boolean) => void;
  setIsAchievementOpen: (open: boolean) => void;
  setIsPetOpen: (open: boolean) => void;
  setIsLotteryOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsRealmOpen: (open: boolean) => void;
  setIsAlchemyOpen: (open: boolean) => void;
  setIsSectOpen: (open: boolean) => void;
  setIsDailyQuestOpen: (open: boolean) => void;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  handleCloseCurrentModal: () => void;
}

/**
 * 生成键盘快捷键配置
 */
export function useAppKeyboardShortcuts(props: UseAppKeyboardShortcutsProps): KeyboardShortcut[] {
  const {
    player,
    gameStarted,
    settings,
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsDailyQuestOpen,
    setPlayer,
    handleCloseCurrentModal,
  } = props;

  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
    if (!player || !gameStarted) return [];

    const customShortcuts = settings.keyboardShortcuts || {};
    const shortcuts: KeyboardShortcut[] = [];

    // 打坐
    const meditateConfig = getShortcutConfig('meditate', customShortcuts);
    shortcuts.push(
      configToShortcut(meditateConfig, handleMeditate, '打坐', '基础操作')
    );

    // 历练
    const adventureConfig = getShortcutConfig('adventure', customShortcuts);
    shortcuts.push(
      configToShortcut(adventureConfig, handleAdventure, '历练', '基础操作')
    );

    // 切换自动打坐
    const toggleAutoMeditateConfig = getShortcutConfig(
      'toggleAutoMeditate',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        toggleAutoMeditateConfig,
        () => {
          setAutoMeditate((prev) => !prev);
        },
        '切换自动打坐',
        '基础操作'
      )
    );

    // 切换自动历练
    const toggleAutoAdventureConfig = getShortcutConfig(
      'toggleAutoAdventure',
      customShortcuts
    );
    const toggleAutoAdventureAction = () => {
      setAutoAdventure((prev) => {
        const newValue = !prev;
        // 如果关闭自动历练，清除所有暂停状态
        if (!newValue) {
          setAutoAdventurePausedByShop(false);
          setAutoAdventurePausedByBattle(false);
          setAutoAdventurePausedByReputationEvent(false);
        }
        return newValue;
      });
    };
    shortcuts.push(
      configToShortcut(
        toggleAutoAdventureConfig,
        toggleAutoAdventureAction,
        '切换自动历练',
        '基础操作'
      )
    );

    // 空格键切换自动历练（优先级高于配置的快捷键）
    shortcuts.push({
      key: ' ',
      action: toggleAutoAdventureAction,
      description: '切换自动历练',
      category: '基础操作',
    });

    // 打开储物袋
    const openInventoryConfig = getShortcutConfig(
      'openInventory',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openInventoryConfig,
        () => setIsInventoryOpen(true),
        '打开储物袋',
        '打开面板'
      )
    );

    // 打开功法
    const openCultivationConfig = getShortcutConfig(
      'openCultivation',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCultivationConfig,
        () => setIsCultivationOpen(true),
        '打开功法',
        '打开面板'
      )
    );

    // 打开角色
    const openCharacterConfig = getShortcutConfig(
      'openCharacter',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCharacterConfig,
        () => setIsCharacterOpen(true),
        '打开角色',
        '打开面板'
      )
    );

    // 打开成就
    const openAchievementConfig = getShortcutConfig(
      'openAchievement',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openAchievementConfig,
        () => {
          setIsAchievementOpen(true);
          setPlayer((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              viewedAchievements: [...prev.achievements],
            };
          });
        },
        '打开成就',
        '打开面板'
      )
    );

    // 打开灵宠
    const openPetConfig = getShortcutConfig('openPet', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openPetConfig,
        () => setIsPetOpen(true),
        '打开灵宠',
        '打开面板'
      )
    );

    // 打开抽奖
    const openLotteryConfig = getShortcutConfig('openLottery', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openLotteryConfig,
        () => setIsLotteryOpen(true),
        '打开抽奖',
        '打开面板'
      )
    );

    // 打开设置
    const openSettingsConfig = getShortcutConfig(
      'openSettings',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openSettingsConfig,
        () => setIsSettingsOpen(true),
        '打开设置',
        '打开面板'
      )
    );

    // 打开秘境
    const openRealmConfig = getShortcutConfig('openRealm', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openRealmConfig,
        () => setIsRealmOpen(true),
        '打开秘境',
        '打开面板'
      )
    );

    // 打开炼丹
    const openAlchemyConfig = getShortcutConfig('openAlchemy', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openAlchemyConfig,
        () => setIsAlchemyOpen(true),
        '打开炼丹',
        '打开面板'
      )
    );

    // 打开宗门
    const openSectConfig = getShortcutConfig('openSect', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openSectConfig,
        () => setIsSectOpen(true),
        '打开宗门',
        '打开面板'
      )
    );

    // 打开日常任务
    const openDailyQuestConfig = getShortcutConfig(
      'openDailyQuest',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openDailyQuestConfig,
        () => setIsDailyQuestOpen(true),
        '打开日常任务',
        '打开面板'
      )
    );

    // 关闭当前弹窗
    const closeModalConfig = getShortcutConfig('closeModal', customShortcuts);
    shortcuts.push(
      configToShortcut(
        closeModalConfig,
        handleCloseCurrentModal,
        '关闭当前弹窗',
        '通用操作'
      )
    );

    return shortcuts;
  }, [
    player,
    gameStarted,
    settings.keyboardShortcuts,
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setAutoMeditate,
    setAutoAdventure,
    setAutoAdventurePausedByShop,
    setAutoAdventurePausedByBattle,
    setAutoAdventurePausedByReputationEvent,
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsDailyQuestOpen,
    setPlayer,
    handleCloseCurrentModal,
  ]);

  return keyboardShortcuts;
}

