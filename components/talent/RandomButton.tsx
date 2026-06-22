import React from 'react';
import { Shuffle, X } from 'lucide-react';

interface RandomButtonProps {
  onRandom: () => void;
  onClear: () => void;
  hasSelection: boolean;
}

const RandomButton: React.FC<RandomButtonProps> = ({ onRandom, onClear, hasSelection }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRandom}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
          bg-amber-500/15 text-amber-400 border border-amber-500/40
          hover:bg-amber-500/25 hover:border-amber-500/60 hover:shadow-[0_0_8px_rgba(245,158,11,0.2)]
          active:scale-95 transition-all duration-150"
      >
        <Shuffle size={15} />
        <span>随机分配</span>
      </button>

      <button
        onClick={onClear}
        disabled={!hasSelection}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
          hasSelection
            ? 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700 hover:text-stone-100 hover:border-stone-500 active:scale-95'
            : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-50'
        }`}
      >
        <X size={15} />
        <span>清空重选</span>
      </button>
    </div>
  );
};

export default RandomButton;
