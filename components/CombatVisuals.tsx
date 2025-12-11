import React from 'react';

interface VisualEffect {
  id: string;
  type: 'damage' | 'heal' | 'slash' | 'alchemy';
  value?: string;
  color?: string;
}

interface Props {
  effects: VisualEffect[];
}

const CombatVisuals: React.FC<Props> = ({ effects }) => {
  if (effects.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
      {effects.map((effect) => {
        if (effect.type === 'slash') {
          return (
            <div
              key={effect.id}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-slash opacity-0 rotate-45"
            />
          );
        }

        if (effect.type === 'alchemy') {
          const isCrafting = effect.value?.includes('炼丹中');
          return (
            <div key={effect.id} className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
              {/* 炼丹过程/成功文字 */}
              {effect.value && (
                <div
                  className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    ${isCrafting ? 'text-3xl' : 'text-5xl'} font-bold font-serif animate-float-up
                    ${effect.color || 'text-mystic-gold'}
                    text-shadow-outline z-10
                  `}
                  style={{
                    textShadow: isCrafting
                      ? '0 0 30px rgba(203, 161, 53, 0.6), 0 2px 4px rgba(0,0,0,0.8)'
                      : '0 0 40px rgba(203, 161, 53, 1), 0 0 60px rgba(203, 161, 53, 0.6), 0 2px 4px rgba(0,0,0,0.8)',
                    animationDuration: isCrafting ? '1.5s' : '2.5s',
                    filter: isCrafting ? 'none' : 'drop-shadow(0 0 20px rgba(203, 161, 53, 0.8))',
                  }}
                >
                  {effect.value}
                </div>
              )}
              {/* 炼丹火花效果（更多火花，更明显） */}
              {[...Array(isCrafting ? 12 : 16)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-1/2 left-1/2 rounded-full bg-mystic-gold animate-float-up ${
                    isCrafting ? 'w-1.5 h-1.5 opacity-60' : 'w-3 h-3 opacity-90'
                  }`}
                  style={{
                    left: `${50 + Math.cos((i * Math.PI * 2) / (isCrafting ? 12 : 16)) * (isCrafting ? 25 : 40)}%`,
                    top: `${50 + Math.sin((i * Math.PI * 2) / (isCrafting ? 12 : 16)) * (isCrafting ? 25 : 40)}%`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: isCrafting ? '1.5s' : '2.5s',
                    boxShadow: isCrafting
                      ? '0 0 8px rgba(203, 161, 53, 0.6)'
                      : '0 0 15px rgba(203, 161, 53, 1), 0 0 25px rgba(203, 161, 53, 0.6)',
                  }}
                />
              ))}
              {/* 药香烟雾效果（更明显） */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mystic-jade/30 animate-float-up blur-2xl ${
                  isCrafting ? 'w-40 h-40' : 'w-48 h-48'
                }`}
                style={{
                  animationDuration: isCrafting ? '1.5s' : '2.5s',
                  background: isCrafting
                    ? 'radial-gradient(circle, rgba(92, 148, 110, 0.3) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(203, 161, 53, 0.4) 0%, rgba(92, 148, 110, 0.3) 50%, transparent 70%)',
                }}
              />
              {/* 成功时的光晕效果 */}
              {!isCrafting && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-mystic-gold/10 animate-glow-pulse blur-3xl"
                  style={{
                    animationDuration: '2s',
                  }}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={effect.id}
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              text-3xl font-bold font-serif animate-float-up
              ${effect.color || 'text-white'}
              text-shadow-outline
            `}
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              left: `${50 + (Math.random() * 20 - 10)}%`, // Slight random X offset
              top: `${50 + (Math.random() * 20 - 10)}%`, // Slight random Y offset
            }}
          >
            {effect.value}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(CombatVisuals);
