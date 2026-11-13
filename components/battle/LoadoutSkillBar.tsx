/**
 * 战斗底部操作栏（统一操作区）
 * 以 sticky 方式固定在回合战斗弹窗最底部，集中全部战斗操作：
 * - 固定格子：普攻（金色强调）/ 防御（青色强调）排在技能格最前，逃跑（红色强调）固定在行尾；
 * - 已装配技能格子：按装配顺序排列，点击直接派发技能行动（编辑入口在角色面板）；
 * - 标题行右侧：丹药 / 进阶物品 下拉入口（小按钮 + 数量角标）。
 */
import React from 'react';
import {
  Zap,
  Sword,
  Shield,
  Footprints,
  FlaskConical,
  Gem,
} from 'lucide-react';
import { BattleSkill, BattleUnit } from '../../types';
import { checkSkillUsable, MAX_LOADOUT_SKILLS } from '../../utils/battleLoadout';

interface LoadoutSkillBarProps {
  /** 玩家战斗单位（含技能全集、冷却、灵力、状态） */
  player: BattleUnit;
  /** 当前装配序列（skillId 列表） */
  loadout: string[];
  /** 是否禁用操作（敌方回合 / 处理中 / 行动次数耗尽），作用于全部格子 */
  disabled: boolean;
  /** 派发技能行动 */
  onUseSkill: (skillId: string) => void;
  /** 普通攻击 */
  onAttack: () => void;
  /** 防御 */
  onDefend: () => void;
  /** 逃跑 */
  onFlee: () => void;
  /** 可用丹药数量（角标显示） */
  potionCount: number;
  /** 丹药面板是否展开 */
  potionsOpen: boolean;
  /** 切换丹药面板 */
  onTogglePotions: () => void;
  /** 进阶物品面板是否展开 */
  advancedItemsOpen: boolean;
  /** 切换进阶物品面板 */
  onToggleAdvancedItems: () => void;
}

/** 技能类型中文标签 */
const SKILL_TYPE_LABELS: Record<BattleSkill['type'], string> = {
  attack: '攻击',
  defense: '防御',
  heal: '治疗',
  buff: '增益',
  debuff: '减益',
  special: '特殊',
};

const LoadoutSkillBar: React.FC<LoadoutSkillBarProps> = ({
  player,
  loadout,
  disabled,
  onUseSkill,
  onAttack,
  onDefend,
  onFlee,
  potionCount,
  potionsOpen,
  onTogglePotions,
  advancedItemsOpen,
  onToggleAdvancedItems,
}) => {
  // 全集技能映射，用于按装配序列还原技能对象
  const skillMap = new Map(player.skills.map((skill) => [skill.id, skill]));

  // 按装配顺序过滤出仍存在的技能（已遗忘功法的配置项自动隐藏），不做全集回退
  const loadoutSkills = loadout
    .map((id) => skillMap.get(id))
    .filter((skill): skill is BattleSkill => !!skill);

  // 置灰态通用样式（所有格子共用，保证视觉统一）
  const disabledCls = 'cursor-not-allowed border-stone-700 bg-stone-900/40 opacity-50';

  // 标题行右侧入口按钮的通用样式（小按钮 + 图标 + 角标）
  const entryBtnCls =
    'flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="border-t border-stone-700 bg-ink-900/95 px-4 py-3 backdrop-blur-sm">
      {/* 标题行：左侧标题计数 + 右侧丹药/进阶物品入口 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Zap size={13} className="text-blue-400" />
          <span className="font-semibold text-stone-300">战斗技能栏</span>
          <span className="text-[10px] text-stone-500">
            {loadoutSkills.length > 0
              ? `已装配 ${loadoutSkills.length}/${MAX_LOADOUT_SKILLS}`
              : '未配置'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 丹药入口（紫色系，带数量角标） */}
          <button
            onClick={onTogglePotions}
            disabled={disabled}
            title="使用丹药"
            className={`${entryBtnCls} ${
              disabled
                ? disabledCls
                : potionsOpen
                ? 'border-purple-400 bg-purple-900/50 text-purple-200'
                : 'border-purple-500/60 bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            <FlaskConical size={12} />
            丹药
            <span className="rounded-full bg-purple-800/90 px-1.5 text-[10px] leading-4 text-purple-200">
              {potionCount}
            </span>
          </button>
          {/* 进阶物品入口（蓝色系） */}
          <button
            onClick={onToggleAdvancedItems}
            disabled={disabled}
            title="使用进阶物品"
            className={`${entryBtnCls} ${
              disabled
                ? disabledCls
                : advancedItemsOpen
                ? 'border-blue-400 bg-blue-900/50 text-blue-200'
                : 'border-blue-500/60 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
            }`}
          >
            <Gem size={12} />
            进阶物品
          </button>
        </div>
      </div>

      {/* 格子行：普攻/防御固定在最前 + 已装配技能格 + 逃跑固定在行尾；移动端横向滚动 */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible">
        {/* 普通攻击（金色强调） */}
        <button
          onClick={onAttack}
          disabled={disabled}
          title="普通攻击"
          className={`relative shrink-0 rounded border px-2.5 py-1.5 text-left transition-colors md:shrink ${
            disabled ? disabledCls : 'border-amber-500/70 bg-amber-900/20 hover:bg-amber-900/40'
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Sword size={13} className={disabled ? 'text-stone-500' : 'text-amber-400'} />
            <span className={`text-xs font-semibold ${disabled ? 'text-stone-400' : 'text-amber-200'}`}>
              普通攻击
            </span>
          </div>
          <div className="whitespace-nowrap text-[10px] text-stone-500">基础打击</div>
        </button>

        {/* 防御（青色强调） */}
        <button
          onClick={onDefend}
          disabled={disabled}
          title="防御"
          className={`relative shrink-0 rounded border px-2.5 py-1.5 text-left transition-colors md:shrink ${
            disabled ? disabledCls : 'border-cyan-500/70 bg-cyan-900/20 hover:bg-cyan-900/40'
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Shield size={13} className={disabled ? 'text-stone-500' : 'text-cyan-400'} />
            <span className={`text-xs font-semibold ${disabled ? 'text-stone-400' : 'text-cyan-200'}`}>
              防御
            </span>
          </div>
          <div className="whitespace-nowrap text-[10px] text-stone-500">减伤姿态</div>
        </button>

        {/* 已装配技能格子 */}
        {loadoutSkills.map((skill) => {
          const check = checkSkillUsable(player, skill);
          const cooldown = player.cooldowns[skill.id] || 0;
          const canClick = !disabled && check.usable;
          return (
            <button
              key={skill.id}
              onClick={() => onUseSkill(skill.id)}
              disabled={!canClick}
              title={check.usable ? skill.description : check.reason}
              className={`relative shrink-0 rounded border px-2.5 py-1.5 text-left transition-colors md:shrink ${
                !canClick
                  ? disabledCls
                  : 'border-blue-700/60 bg-blue-900/20 hover:bg-blue-900/40'
              }`}
            >
              {/* 冷却剩余角标 */}
              {cooldown > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-red-500 bg-red-900/90 px-1 text-[10px] font-bold leading-none text-red-200">
                  {cooldown}
                </span>
              )}
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={`text-xs font-semibold ${
                    canClick ? 'text-blue-200' : 'text-stone-400'
                  }`}
                >
                  {skill.name}
                </span>
                <span className="text-[10px] text-stone-500">
                  {SKILL_TYPE_LABELS[skill.type]}
                </span>
              </div>
              <div className="whitespace-nowrap text-[10px] text-stone-500">
                {skill.cost.mana ? `灵力 ${skill.cost.mana}` : '无消耗'}
                {!check.usable && cooldown <= 0 && (
                  <span className="ml-1 text-rose-400/80">{check.reason}</span>
                )}
              </div>
            </button>
          );
        })}

        {/* 逃跑（红色强调，固定在格子行末尾的危险操作位） */}
        <button
          onClick={onFlee}
          disabled={disabled}
          title="逃离战斗"
          className={`relative shrink-0 rounded border px-2.5 py-1.5 text-left transition-colors md:shrink ${
            disabled ? disabledCls : 'border-red-500/70 bg-red-900/20 hover:bg-red-900/40'
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Footprints size={13} className={disabled ? 'text-stone-500' : 'text-red-400'} />
            <span className={`text-xs font-semibold ${disabled ? 'text-stone-400' : 'text-red-200'}`}>
              逃跑
            </span>
          </div>
          <div className="whitespace-nowrap text-[10px] text-stone-500">撤离战斗</div>
        </button>

        {/* 未配置（或配置项全部失效）时不展示技能格子，仅提示前往角色面板配置 */}
        {loadoutSkills.length === 0 && (
          <div className="flex w-full items-center gap-2 py-1 text-xs text-stone-500">
            <Zap size={13} className="text-stone-600" />
            尚未配置战斗技能栏，请前往 角色面板 → 战斗技能栏 配置
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadoutSkillBar;
