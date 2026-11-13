import {
  Sword,
  Wand2,
  Zap,
  Heart,
  Wind,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * 战斗日志分级主题（纯展示层）
 * 普攻 Sword 灰 / 技能 Wand2 紫 / 暴击 Zap 金 / 治疗 Heart 绿 / 闪避 Wind 灰
 * 敌人行动统一红色系底色区分（暴击/治疗保持原色以突出）
 */

export interface BattleLogStyle {
  Icon: LucideIcon;
  iconClass: string;
  rowClass: string;
}

export interface BattleLogEntryInfo {
  actorSide: 'player' | 'enemy';
  description: string;
  actionType?: string;
  crit?: boolean;
  miss?: boolean;
  damage?: number;
  heal?: number;
  /** 灵宠行动（描述以【宠物名】开头的玩家侧行动） */
  isPet?: boolean;
}

export function classifyBattleLog(entry: BattleLogEntryInfo): BattleLogStyle {
  const hasDamage = (entry.damage ?? 0) > 0;
  const hasHeal = (entry.heal ?? 0) > 0;
  // description 关键词兜底（快速战斗日志没有结构化字段）
  const descMiss = /闪避/.test(entry.description);
  const descHeal = /治疗|恢复|回复/.test(entry.description);

  // 判定优先级：闪避 > 治疗 > 暴击 > 灵宠 > 技能 > 防御 > 丹药 > 普攻
  let style: BattleLogStyle;
  if (entry.miss || descMiss) {
    style = {
      Icon: Wind,
      iconClass: 'text-stone-400',
      rowClass: 'border-stone-600/40 bg-stone-900/40',
    };
  } else if (hasHeal || (!hasDamage && descHeal)) {
    style = {
      Icon: Heart,
      iconClass: 'text-emerald-400',
      rowClass: 'border-emerald-700/40 bg-emerald-950/20',
    };
  } else if (entry.crit) {
    style = {
      Icon: Zap,
      iconClass: 'text-mystic-gold',
      rowClass: 'border-mystic-gold/60 bg-yellow-950/20',
    };
  } else if (entry.isPet) {
    style = {
      Icon: Sparkles,
      iconClass: 'text-cyan-300',
      rowClass: 'border-cyan-700/40 bg-cyan-950/20',
    };
  } else if (entry.actionType === 'skill' || /施展|释放了/.test(entry.description)) {
    style = {
      Icon: Wand2,
      iconClass: 'text-purple-300',
      rowClass: 'border-purple-700/40 bg-purple-950/20',
    };
  } else if (entry.actionType === 'defend') {
    style = {
      Icon: Shield,
      iconClass: 'text-cyan-300',
      rowClass: 'border-cyan-700/40 bg-cyan-950/20',
    };
  } else if (entry.actionType === 'item') {
    style = {
      Icon: Sparkles,
      iconClass: 'text-purple-300',
      rowClass: 'border-purple-700/40 bg-purple-950/20',
    };
  } else {
    style = {
      Icon: Sword,
      iconClass: 'text-stone-300',
      rowClass: 'border-stone-700/40 bg-stone-900/40',
    };
  }

  // 敌人行动：红色系底色区分（暴击/治疗保持原色）
  if (entry.actorSide === 'enemy' && !entry.crit && !hasHeal) {
    style = { ...style, rowClass: 'border-rose-700/50 bg-rose-950/25' };
    if (style.Icon === Sword) style = { ...style, iconClass: 'text-rose-300' };
  }

  return style;
}
