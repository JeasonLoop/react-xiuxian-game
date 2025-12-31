/**
 * App 键盘快捷键 Hook
 * 统一管理所有键盘快捷键配置
 */

import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlayerStats } from '../types';
import { KeyboardShortcut } from './useKeyboardShortcuts';
import { getShortcutConfig, configToShortcut } from '../utils/shortcutUtils';
import { useUIStore } from '../store/uiStore';

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
  setPausedByShop: (value: boolean) => void;
  setPausedByBattle: (value: boolean) => void;
  setPausedByReputationEvent: (value: boolean) => void;
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
  setPlayer: Dispatch<SetStateAction<PlayerStats | null>>;
  handleCloseCurrentModal: () => void;
  setIsAutoAdventureConfigOpen: (open: boolean) => void;
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
    setPausedByShop,
    setPausedByBattle,
    setPausedByReputationEvent,
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
    setIsAutoAdventureConfigOpen,
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
      // 使用 zustand store 的 getState 获取最新状态，避免闭包问题
      const store = useUIStore.getState();
      const currentAutoAdventure = store.autoAdventure;
      const currentPausedByBattle = store.pausedByBattle;
      const currentPausedByShop = store.pausedByShop;
      const currentPausedByReputationEvent = store.pausedByReputationEvent;

      // 如果当前是暂停状态（autoAdventure 为 false 但 pausedBy* 为 true），恢复自动历练
      const isPaused = !currentAutoAdventure && (
        currentPausedByBattle ||
        currentPausedByShop ||
        currentPausedByReputationEvent
      );

      if (isPaused) {
        // 恢复自动历练：清除暂停状态并开启自动历练
        setPausedByShop(false);
        setPausedByBattle(false);
        setPausedByReputationEvent(false);
        setAutoAdventure(true);
      } else if (currentAutoAdventure) {
        // 如果正在自动历练，直接关闭
        setAutoAdventure(false);
      } else {
        // 如果未开启，打开配置弹窗
        setIsAutoAdventureConfigOpen(true);
      }
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
    // 注意：如果自动打坐开启，则禁用空格键，避免冲突
    shortcuts.push({
      key: ' ',
      action: () => {
        // 如果自动打坐开启，不执行任何操作（不能开启自动历练）
        // 但如果自动历练已经开启，即使自动打坐开启，也应该允许关闭自动历练
        if (autoMeditate && !autoAdventure) {
          return;
        }
        toggleAutoAdventureAction();
      },
      description: '切换自动历练（自动打坐时禁用开启）',
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
    setPausedByShop,
    setPausedByBattle,
    setPausedByReputationEvent,
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

