import React from 'react';
import type { BattleFloatItem } from './useBattleStageEffects';

/**
 * 伤害飘字（纯展示层可复用组件）
 * 普攻白 / 暴击金色放大 / 治疗绿色带 + 号 / 闪避灰字「闪避」
 * 动画只使用 transform/opacity，动画结束后由父级移除元素
 */
const DamageFloat: React.FC<{ float: BattleFloatItem }> = ({ float }) => {
  const baseClass =
    'battle-damage-float pointer-events-none absolute top-1/2 left-1/2 font-serif font-bold whitespace-nowrap';

  if (float.type === 'crit') {
    // 暴击：金色放大 + 光晕
    return (
      <div
        className={`${baseClass} battle-damage-crit-float text-4xl md:text-5xl text-mystic-gold`}
        style={{
          marginLeft: float.dx,
          textShadow:
            '0 0 18px rgba(203, 161, 53, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8)',
        }}
      >
        {float.value}
      </div>
    );
  }

  if (float.type === 'heal') {
    return (
      <div
        className={`${baseClass} text-3xl text-emerald-400`}
        style={{
          marginLeft: float.dx,
          textShadow: '0 0 12px rgba(92, 148, 110, 0.7), 0 2px 4px rgba(0, 0, 0, 0.8)',
        }}
      >
        +{float.value ?? 0}
      </div>
    );
  }

  if (float.type === 'miss') {
    return (
      <div
        className={`${baseClass} text-2xl text-stone-400`}
        style={{ marginLeft: float.dx, textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}
      >
        闪避
      </div>
    );
  }

  // 普通伤害：白色
  return (
    <div
      className={`${baseClass} text-3xl text-white`}
      style={{ marginLeft: float.dx, textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}
    >
      {float.value ?? 0}
    </div>
  );
};

export default React.memo(DamageFloat);
