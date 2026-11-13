import React from 'react';
import type { BattleBannerItem } from './useBattleStageEffects';

/**
 * 技能名横幅（纯展示层可复用组件）
 * 「天雷剑诀」式大字横幅：金色渐入 + 高光水平扫过 + 淡出，总 600ms
 * 玩家技能金色系，敌人技能红色系
 */
const SkillBanner: React.FC<{ banner: BattleBannerItem }> = ({ banner }) => {
  const isPlayer = banner.side === 'player';
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        className={`battle-skill-banner relative overflow-hidden rounded border bg-ink-900/85 px-6 py-2 font-serif text-xl font-bold tracking-[0.3em] md:text-2xl ${
          isPlayer
            ? 'border-mystic-gold/70 text-mystic-gold shadow-[0_0_18px_rgba(203,161,53,0.35)]'
            : 'border-rose-500/70 text-rose-300 shadow-[0_0_18px_rgba(190,40,40,0.35)]'
        }`}
      >
        {/* 高光水平扫过层 */}
        <span
          aria-hidden
          className={`battle-banner-sweep ${
            isPlayer
              ? 'battle-banner-sweep-gold'
              : 'battle-banner-sweep-red'
          }`}
        />
        {banner.name}
      </div>
    </div>
  );
};

export default React.memo(SkillBanner);
