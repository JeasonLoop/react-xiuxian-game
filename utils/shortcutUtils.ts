import { KeyboardShortcutConfig } from '../types';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

/**
 * 默认快捷键配置
 * key 为 actionId，用于标识不同的操作
 */
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcutConfig> = {
  meditate: { key: 'm' },
  adventure: { key: 'a' },
  toggleAutoMeditate: { key: 'm', shift: true },
  toggleAutoAdventure: { key: 'a', shift: true },
  openInventory: { key: 'i' },
  openCultivation: { key: 'c' },
  openCharacter: { key: 'p' },
  openAchievement: { key: 't' },
  openPet: { key: 'e' },
  openLottery: { key: 'l' },
  openSettings: { key: 's' },
  openRealm: { key: 'r' },
  openAlchemy: { key: 'n' },
  openSect: { key: 'g' },
  openDailyQuest: { key: 'q' },
  closeModal: { key: 'Escape' },
};

/**
 * 获取快捷键配置（合并默认和自定义配置）
 */
export function getShortcutConfig(
  actionId: string,
  customShortcuts?: Record<string, KeyboardShortcutConfig>
): KeyboardShortcutConfig {
  const custom = customShortcuts?.[actionId];
  return custom || DEFAULT_SHORTCUTS[actionId] || { key: '' };
}

/**
 * 检查快捷键是否冲突
 */
export function checkShortcutConflict(
  shortcut: KeyboardShortcutConfig,
  actionId: string,
  allShortcuts: Record<string, KeyboardShortcutConfig>
): string | null {
  for (const [id, config] of Object.entries(allShortcuts)) {
    if (id === actionId) continue; // 跳过自己

    if (
      config.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!config.ctrl === !!shortcut.ctrl &&
      !!config.shift === !!shortcut.shift &&
      !!config.alt === !!shortcut.alt &&
      !!config.meta === !!shortcut.meta
    ) {
      return id;
    }
  }
  return null;
}

/**
 * 将 KeyboardShortcutConfig 转换为 KeyboardShortcut
 */
export function configToShortcut(
  config: KeyboardShortcutConfig,
  action: () => void,
  description: string,
  category: string
): KeyboardShortcut {
  return {
    key: config.key,
    ctrl: config.ctrl,
    shift: config.shift,
    alt: config.alt,
    meta: config.meta,
    action,
    description,
    category,
  };
}

/**
 * 获取所有默认快捷键的显示信息
 */
export const SHORTCUT_DESCRIPTIONS: Record<
  string,
  { description: string; category: string }
> = {
  meditate: { description: '打坐', category: '基础操作' },
  adventure: { description: '历练', category: '基础操作' },
  toggleAutoMeditate: { description: '切换自动打坐', category: '基础操作' },
  toggleAutoAdventure: { description: '切换自动历练', category: '基础操作' },
  openInventory: { description: '打开储物袋', category: '打开面板' },
  openCultivation: { description: '打开功法', category: '打开面板' },
  openCharacter: { description: '打开角色', category: '打开面板' },
  openAchievement: { description: '打开成就', category: '打开面板' },
  openPet: { description: '打开灵宠', category: '打开面板' },
  openLottery: { description: '打开抽奖', category: '打开面板' },
  openSettings: { description: '打开设置', category: '打开面板' },
  openRealm: { description: '打开秘境', category: '打开面板' },
  openAlchemy: { description: '打开炼丹', category: '打开面板' },
  openSect: { description: '打开宗门', category: '打开面板' },
  openDailyQuest: { description: '打开日常任务', category: '打开面板' },
  closeModal: { description: '关闭当前弹窗', category: '通用操作' },
};

