
import React from 'react';

interface VisualEffect {
  id: string;
  type: 'damage' | 'heal' | 'slash';
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
              top: `${50 + (Math.random() * 20 - 10)}%` // Slight random Y offset
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
