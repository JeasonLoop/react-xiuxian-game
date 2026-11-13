import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * 战斗演出效果驱动 Hook（纯展示层）
 * 统一管理：伤害飘字、技能名横幅、受击 shake、进攻前冲、暴击震屏
 * 演出均为非阻塞视觉，不影响战斗逻辑与输入
 */

export type BattleFloatType = 'damage' | 'crit' | 'heal' | 'miss';

export interface BattleFloatItem {
  id: number;
  type: BattleFloatType;
  value?: number;
  /** 水平随机偏移（px），避免连续飘字完全重叠 */
  dx: number;
}

export interface BattleBannerItem {
  id: number;
  name: string;
  side: 'player' | 'enemy';
}

/** 一次行动的演出事件（由展示层从回合数据归一化而来） */
export interface BattleEffectEvent {
  id: string;
  attacker: 'player' | 'enemy';
  kind: 'damage' | 'crit' | 'heal' | 'miss' | 'info';
  value?: number;
  skillName?: string | null;
}

// 飘字动画 700ms / 横幅 600ms，移除时机稍长于动画保证播完
const FLOAT_LIFETIME = 780;
const BANNER_LIFETIME = 650;

const randomOffset = () => Math.round(Math.random() * 60 - 30);

export function useBattleStageEffects() {
  const [floats, setFloats] = useState<BattleFloatItem[]>([]);
  const [banner, setBanner] = useState<BattleBannerItem | null>(null);
  // 受击 shake + 血条红光：奇偶交替计数，用于同类动画类的重触发
  const [hitTicks, setHitTicks] = useState({ player: 0, enemy: 0 });
  // 进攻方前冲计数
  const [lungeTicks, setLungeTicks] = useState({ player: 0, enemy: 0 });
  // 暴击震屏（演出区整体 shake）
  const [stageShakeTick, setStageShakeTick] = useState(0);
  const timersRef = useRef<number[]>([]);
  const idRef = useRef(1);

  // 组件卸载时清理所有未完成的演出定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const timer = window.setTimeout(fn, delay);
    timersRef.current.push(timer);
  }, []);

  // 跳过演出：清空所有待播演出与当前元素
  const clear = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setFloats([]);
    setBanner(null);
  }, []);

  const playEntry = useCallback(
    (event: BattleEffectEvent) => {
      const id = idRef.current++;
      const defender = event.attacker === 'player' ? 'enemy' : 'player';

      // 技能名横幅：普攻无技能名不触发
      if (event.skillName) {
        setBanner({ id, name: event.skillName, side: event.attacker });
        schedule(() => {
          setBanner((cur) => (cur && cur.id === id ? null : cur));
        }, BANNER_LIFETIME);
      }

      // 先固定为 const，保证类型收窄在 setState 回调闭包内依然有效
      const kind = event.kind;
      const value = event.value;

      if (kind === 'damage' || kind === 'crit') {
        setFloats((prev) => [
          ...prev,
          { id, type: kind, value, dx: randomOffset() },
        ]);
        schedule(() => {
          setFloats((prev) => prev.filter((f) => f.id !== id));
        }, FLOAT_LIFETIME);
        // 受击方 shake + 血条红光；进攻方前冲
        setHitTicks((prev) => ({ ...prev, [defender]: prev[defender] + 1 }));
        setLungeTicks((prev) => ({
          ...prev,
          [event.attacker]: prev[event.attacker] + 1,
        }));
        // 暴击时演出区整体震屏
        if (kind === 'crit') setStageShakeTick((t) => t + 1);
        return;
      }

      if (kind === 'heal' || kind === 'miss') {
        setFloats((prev) => [
          ...prev,
          { id, type: kind, value, dx: randomOffset() },
        ]);
        schedule(() => {
          setFloats((prev) => prev.filter((f) => f.id !== id));
        }, FLOAT_LIFETIME);
        // 出手被闪避也保留前冲动作，表现"打空"
        if (kind === 'miss') {
          setLungeTicks((prev) => ({
            ...prev,
            [event.attacker]: prev[event.attacker] + 1,
          }));
        }
      }
      // info 类（防御/增益等）：只播横幅，无飘字与受击
    },
    [schedule]
  );

  return useMemo(
    () => ({
      floats,
      banner,
      hitTicks,
      lungeTicks,
      stageShakeTick,
      playEntry,
      schedule,
      clear,
    }),
    [floats, banner, hitTicks, lungeTicks, stageShakeTick, playEntry, schedule, clear]
  );
}
