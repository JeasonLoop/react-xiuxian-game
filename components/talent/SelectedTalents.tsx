import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { getTalentById } from '../../utils/talentUtils';
import { getRarityTextColor } from '../../utils/rarityUtils';

interface SelectedTalentsProps {
  selectedIds: string[];
  totalCost: number;
  totalPoints: number;
  onRemove: (id: string) => void;
}

const SelectedTalents: React.FC<SelectedTalentsProps> = ({ selectedIds, totalCost, totalPoints, onRemove }) => {
  if (selectedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-stone-800/50 rounded-lg border border-dashed border-stone-700">
        <Sparkles size={20} className="text-stone-600 mb-2" />
        <span className="text-sm text-stone-500">请从天赋池中选择天赋</span>
      </div>
    );
  }

  return (
    <div className="bg-stone-800 rounded-lg border border-stone-700 p-3">
      {/* Total cost header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-700">
        <span className="text-xs text-stone-400">已选天赋</span>
        <span className="text-sm font-bold text-amber-400">
          已用 {totalCost}/{totalPoints} 命运点
        </span>
      </div>

      {/* Talent chips */}
      <div className="flex flex-wrap gap-2">
        {selectedIds.map((id) => {
          const talent = getTalentById(id);
          if (!talent) return null;

          return (
            <div
              key={id}
              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-stone-900/60 border-stone-600 hover:border-stone-500 transition-colors`}
            >
              <span className={`text-xs font-medium ${getRarityTextColor(talent.rarity)}`}>
                {talent.name}
              </span>
              <span className="text-[10px] text-amber-500/70 font-medium">{talent.fateCost}点</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(id);
                }}
                className="ml-0.5 p-0.5 rounded text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                title="移除天赋"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedTalents;
