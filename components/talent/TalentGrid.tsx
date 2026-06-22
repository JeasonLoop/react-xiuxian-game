import React from 'react';
import { Talent } from '../../types';
import { canAffordTalent, getTalentById } from '../../utils/talentUtils';
import TalentCard from './TalentCard';

interface TalentGridProps {
  talents: Talent[];
  selectedIds: string[];
  remainingPoints: number;
  onToggle: (id: string) => void;
}

const TalentGrid: React.FC<TalentGridProps> = ({ talents, selectedIds, remainingPoints, onToggle }) => {
  if (talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-500">
        <span className="text-4xl mb-3 opacity-40">&#x262F;</span>
        <span className="text-sm">无匹配天赋</span>
      </div>
    );
  }

  // 检查是否已选仙品天赋
  const hasImmortalSelected = selectedIds.some((id) => {
    const t = getTalentById(id);
    return t && t.rarity === '仙品';
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {talents.map((talent) => {
        const isSelected = selectedIds.includes(talent.id);
        const isImmortalTier = talent.rarity === '仙品';
        const blockedByImmortal = isImmortalTier && !isSelected && hasImmortalSelected;
        const canAfford = isSelected || (!blockedByImmortal && canAffordTalent(talent.id, selectedIds));

        return (
          <TalentCard
            key={talent.id}
            talent={talent}
            selected={isSelected}
            canAfford={canAfford}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
};

export default TalentGrid;
