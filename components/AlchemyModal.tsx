import React, { useMemo } from 'react';
import { Item, PlayerStats, Recipe } from '../types';
import { PILL_RECIPES, DISCOVERABLE_RECIPES } from '../constants';
import { X, Sparkles, FlaskConical, CircleOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onCraft: (recipe: Recipe) => void;
}

const AlchemyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onCraft,
}) => {
  if (!isOpen) return null;

  const countItem = (itemName: string) => {
    const item = player.inventory.find((i) => i.name === itemName);
    return item ? item.quantity : 0;
  };

  // 合并基础配方和已解锁的配方
  const availableRecipes = useMemo(() => {
    const unlockedRecipes = player.unlockedRecipes || [];
    const unlocked = DISCOVERABLE_RECIPES.filter((recipe) =>
      unlockedRecipes.includes(recipe.name)
    );
    return [...PILL_RECIPES, ...unlocked];
  }, [player.unlockedRecipes]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 w-full h-[80vh] md:h-auto md:max-w-3xl md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 flex justify-between items-center bg-ink-800 md:rounded-t">
          <h3 className="text-lg md:text-xl font-serif text-mystic-gold flex items-center gap-2">
            <Sparkles size={18} className="md:w-5 md:h-5" /> 丹房
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-3 md:p-4 bg-paper-800 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="col-span-full mb-2 bg-ink-900/50 p-3 rounded border border-stone-700 text-sm text-stone-400 flex justify-between">
            <span>
              拥有灵石：
              <span className="text-mystic-gold font-bold">
                {player.spiritStones}
              </span>
            </span>
            <span>炼丹乃逆天而行，需耗费心神与灵石。</span>
          </div>

          {availableRecipes.map((recipe, idx) => {
            const canAfford = player.spiritStones >= recipe.cost;
            let hasIngredients = true;

            return (
              <div
                key={idx}
                className="bg-ink-800 border border-stone-700 rounded p-4 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-serif font-bold text-stone-200">
                    {recipe.name}
                  </h4>
                  <span className="text-xs bg-mystic-gold/10 text-mystic-gold border border-mystic-gold/30 px-2 py-0.5 rounded">
                    丹药
                  </span>
                </div>

                <p className="text-sm text-stone-500 italic mb-4 h-10 overflow-hidden">
                  {recipe.result.description}
                </p>

                <div className="bg-ink-900 p-2 rounded border border-stone-800 mb-4 flex-1">
                  <div className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-wider">
                    所需材料
                  </div>
                  <ul className="space-y-1">
                    {recipe.ingredients.map((ing, i) => {
                      const owned = countItem(ing.name);
                      if (owned < ing.qty) hasIngredients = false;

                      return (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-stone-300">{ing.name}</span>
                          <span
                            className={
                              owned >= ing.qty
                                ? 'text-mystic-jade'
                                : 'text-mystic-blood'
                            }
                          >
                            {owned}/{ing.qty}
                          </span>
                        </li>
                      );
                    })}
                    <li className="flex justify-between text-sm pt-1 border-t border-stone-800 mt-1">
                      <span className="text-stone-300">灵石消耗</span>
                      <span
                        className={
                          canAfford ? 'text-mystic-gold' : 'text-mystic-blood'
                        }
                      >
                        {recipe.cost}
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onCraft(recipe)}
                  disabled={!canAfford || !hasIngredients}
                  className={`
                    w-full py-2 rounded font-serif font-bold text-sm flex items-center justify-center gap-2 transition-colors
                    ${
                      canAfford && hasIngredients
                        ? 'bg-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/30 border border-mystic-gold'
                        : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                    }
                  `}
                >
                  {!canAfford || !hasIngredients ? (
                    <CircleOff size={16} />
                  ) : (
                    <FlaskConical size={16} />
                  )}
                  {canAfford && hasIngredients ? '开炉炼丹' : '材料不足'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlchemyModal;
