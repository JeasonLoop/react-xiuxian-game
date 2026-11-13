/**
 * 战斗技能栏装配编辑抽屉（通用组件）
 * 以嵌套面板形式展开在宿主容器内（角色面板 / 战斗弹窗均可复用，不新开顶层 Modal）。
 * 技能全集通过 allSkills props 传入（角色面板传 collectPlayerCombatSkills(player)）。
 * 左侧为技能全集（可搜索），右侧为当前装配序列（≤15，支持上移/下移/移除）。
 * 变更即时回调 onWriteLoadout（由宿主负责持久化与状态更新）。
 */
import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Search,
  Settings2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { BattleSkill } from '../../types';
import { MAX_LOADOUT_SKILLS } from '../../utils/battleLoadout';

interface LoadoutEditorDrawerProps {
  /** 玩家技能全集 */
  allSkills: BattleSkill[];
  /** 当前装配序列（skillId 列表） */
  loadout: string[];
  /** 写入新装配序列（持久化 + 更新状态） */
  onWriteLoadout: (skillIds: string[]) => void;
  /** 关闭编辑抽屉 */
  onClose: () => void;
}

/** 技能类型 → 图标与颜色 */
const SKILL_TYPE_META: Record<
  BattleSkill['type'],
  { label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; iconClass: string }
> = {
  attack: { label: '攻击', Icon: Sword, iconClass: 'text-rose-400' },
  defense: { label: '防御', Icon: Shield, iconClass: 'text-blue-400' },
  heal: { label: '治疗', Icon: HeartPulse, iconClass: 'text-emerald-400' },
  buff: { label: '增益', Icon: TrendingUp, iconClass: 'text-amber-400' },
  debuff: { label: '减益', Icon: TrendingDown, iconClass: 'text-purple-400' },
  special: { label: '特殊', Icon: Sparkles, iconClass: 'text-cyan-400' },
};

const LoadoutEditorDrawer: React.FC<LoadoutEditorDrawerProps> = ({
  allSkills,
  loadout,
  onWriteLoadout,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  // 类型筛选：null 表示不筛选；再点同类型按钮取消
  const [typeFilter, setTypeFilter] = useState<BattleSkill['type'] | null>(null);

  // 装配序列 → 技能对象（保持栏位顺序）
  const skillMap = useMemo(
    () => new Map(allSkills.map((skill) => [skill.id, skill])),
    [allSkills]
  );
  const loadoutSkills = loadout
    .map((id) => skillMap.get(id))
    .filter((skill): skill is BattleSkill => !!skill);
  const loadoutIdSet = new Set(loadout);

  // 左侧全集列表按类型筛选 + 搜索词叠加过滤
  const filteredSkills = useMemo(() => {
    return allSkills.filter((skill) => {
      if (typeFilter && skill.type !== typeFilter) return false;
      if (search) {
        return skill.name.includes(search) || skill.description.includes(search);
      }
      return true;
    });
  }, [allSkills, search, typeFilter]);
  /** 勾选添加 / 移除（点击左侧列表项切换装配状态） */
  const toggleSkill = (skillId: string) => {
    if (loadoutIdSet.has(skillId)) {
      onWriteLoadout(loadout.filter((id) => id !== skillId));
    } else if (loadout.length < MAX_LOADOUT_SKILLS) {
      onWriteLoadout([...loadout, skillId]);
    }
  };

  return (
    <div className="border-t border-stone-700 bg-ink-950/95 px-4 py-3">
      {/* 抽屉标题行 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-mystic-gold">
          <Settings2 size={15} />
          编辑战斗技能栏
          <span className="text-xs font-normal text-stone-400">
            {loadout.length}/{MAX_LOADOUT_SKILLS}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded border border-stone-600 p-1.5 text-stone-300 transition-colors hover:bg-stone-700/40"
          title="关闭编辑"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 左侧：技能全集（可搜索 + 类型筛选，点击勾选添加/移除） */}
        <div className="flex max-h-[55vh] min-h-0 flex-col rounded border border-stone-800 bg-ink-900/60">
          <div className="flex items-center gap-2 border-b border-stone-800 px-2 py-1.5">
            <Search size={13} className="shrink-0 text-stone-500" />
            <input
              type="text"
              placeholder="搜索技能名称 / 描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-stone-200 placeholder-stone-600 focus:outline-none"
            />
          </div>
          {/* 类型筛选按钮组：单选高亮，再点取消，与搜索叠加过滤 */}
          <div className="flex flex-wrap gap-1 border-b border-stone-800 px-2 py-1.5">
            {(Object.keys(SKILL_TYPE_META) as BattleSkill['type'][]).map((type) => {
              const meta = SKILL_TYPE_META[type];
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(active ? null : type)}
                  className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
                    active
                      ? 'border-stone-400 bg-stone-600/80 text-stone-100'
                      : 'border-stone-700 bg-ink-900 text-stone-400 hover:border-stone-500 hover:text-stone-200'
                  }`}
                >
                  <meta.Icon size={11} className={active ? meta.iconClass : ''} />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {filteredSkills.map((skill) => {
              const meta = SKILL_TYPE_META[skill.type];
              const isEquipped = loadoutIdSet.has(skill.id);
              const full = !isEquipped && loadout.length >= MAX_LOADOUT_SKILLS;
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  disabled={full}
                  title={full ? '技能栏已满（最多 15 个）' : skill.description}
                  className={`w-full rounded border px-2 py-1.5 text-left transition-colors ${
                    isEquipped
                      ? 'border-blue-500/70 bg-blue-900/30'
                      : full
                        ? 'cursor-not-allowed border-stone-800 bg-stone-900/30 opacity-50'
                        : 'border-stone-700 bg-ink-900 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <meta.Icon size={13} className={`shrink-0 ${meta.iconClass}`} />
                      <span className="truncate text-xs font-semibold text-stone-200">
                        {skill.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-stone-500">{meta.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[10px]">
                      {skill.cost.mana ? (
                        <span className="text-blue-400/80">灵力 {skill.cost.mana}</span>
                      ) : (
                        <span className="text-stone-600">无消耗</span>
                      )}
                      {skill.maxCooldown > 0 && (
                        <span className="text-stone-500">冷却 {skill.maxCooldown}</span>
                      )}
                      <span
                        className={`rounded border px-1 py-0.5 ${
                          isEquipped
                            ? 'border-blue-500 text-blue-300'
                            : 'border-stone-600 text-stone-400'
                        }`}
                      >
                        {isEquipped ? '已装配' : '添加'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredSkills.length === 0 && (
              <div className="py-4 text-center text-xs text-stone-500">
                未找到符合条件的技能
              </div>
            )}
          </div>
        </div>

        {/* 右侧：当前装配序列（顺序即栏位顺序，支持上移/下移/移除） */}
        <div className="flex max-h-[55vh] min-h-0 flex-col rounded border border-stone-800 bg-ink-900/60">
          <div className="flex items-center justify-between border-b border-stone-800 px-2 py-1.5">
            <span className="text-xs font-semibold text-stone-300">当前装配顺序</span>
            <span className="text-[10px] text-stone-500">上为第 1 格</span>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {loadoutSkills.map((skill, index) => (
              <div
                key={skill.id}
                className="flex items-center justify-between gap-2 rounded border border-stone-700 bg-ink-900 px-2 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-[10px] text-stone-500">{index + 1}.</span>
                  <span className="truncate text-xs font-semibold text-blue-200">
                    {skill.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      const next = [...loadout];
                      const temp = next[index];
                      next[index] = next[index - 1];
                      next[index - 1] = temp;
                      onWriteLoadout(next);
                    }}
                    disabled={index === 0}
                    className="rounded border border-stone-600 p-1 text-stone-300 transition-colors hover:bg-stone-700/40 disabled:opacity-30"
                    title="上移"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => {
                      const next = [...loadout];
                      const temp = next[index];
                      next[index] = next[index + 1];
                      next[index + 1] = temp;
                      onWriteLoadout(next);
                    }}
                    disabled={index === loadoutSkills.length - 1}
                    className="rounded border border-stone-600 p-1 text-stone-300 transition-colors hover:bg-stone-700/40 disabled:opacity-30"
                    title="下移"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => onWriteLoadout(loadout.filter((id) => id !== skill.id))}
                    className="rounded border border-red-700/60 p-1 text-red-300 transition-colors hover:bg-red-900/40"
                    title="移除"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
            {loadoutSkills.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-1 py-6 text-center">
                <Skull size={20} className="text-stone-700" />
                <div className="text-xs text-stone-500">尚未装配技能</div>
                <div className="text-[10px] text-stone-600">
                  从左侧点击技能添加（最多 {MAX_LOADOUT_SKILLS} 个）
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadoutEditorDrawer;
