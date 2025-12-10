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
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
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
          return (
            <div key={effect.id} className="absolute inset-0 flex items-center justify-center">
              {/* 炼丹成功文字 */}
              {effect.value && (
                <div
                  className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    text-4xl font-bold font-serif animate-float-up
                    ${effect.color || 'text-mystic-gold'}
                    text-shadow-outline
                  `}
                  style={{
                    textShadow: '0 0 20px rgba(203, 161, 53, 0.8), 0 2px 4px rgba(0,0,0,0.8)',
                    animationDuration: '2s',
                  }}
                >
                  {effect.value}
                </div>
              )}
              {/* 炼丹火花效果 */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-mystic-gold animate-float-up opacity-80"
                  style={{
                    left: `${50 + Math.cos((i * Math.PI * 2) / 8) * 30}%`,
                    top: `${50 + Math.sin((i * Math.PI * 2) / 8) * 30}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '2s',
                    boxShadow: '0 0 10px rgba(203, 161, 53, 0.8)',
                  }}
                />
              ))}
              {/* 药香烟雾效果 */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-mystic-jade/20 animate-float-up blur-xl"
                style={{
                  animationDuration: '2s',
                }}
              />
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
