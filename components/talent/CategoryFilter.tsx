import React from 'react';
import { TalentCategory } from '../../types';

interface CategoryFilterProps {
  selected: TalentCategory | '全部';
  onSelect: (cat: TalentCategory | '全部') => void;
}

const CATEGORIES: (TalentCategory | '全部')[] = ['全部', '体质', '悟性', '战斗', '气运', '特殊'];

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-1.5 p-1.5 bg-stone-800 rounded-lg border border-stone-700">
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${
              isActive
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_6px_rgba(245,158,11,0.3)]'
                : 'bg-stone-900/50 text-stone-400 border-stone-700 hover:text-stone-200 hover:border-stone-500'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
