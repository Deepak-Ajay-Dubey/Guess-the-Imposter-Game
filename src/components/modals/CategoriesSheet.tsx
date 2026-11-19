import { useEffect } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { CURATED_CATEGORIES } from '../../data/curatedWords';
import type { CuratedCategoryId } from '../../types/game';

interface CategoriesSheetProps {
  selectedCategories: readonly CuratedCategoryId[];
  useAiWords: boolean;
  onToggleCategory: (categoryId: CuratedCategoryId) => void;
  onSelectAll: () => void;
  onToggleAiWords: () => void;
  onClose: () => void;
}

export function CategoriesSheet({
  selectedCategories,
  useAiWords,
  onToggleCategory,
  onSelectAll,
  onToggleAiWords,
  onClose,
}: CategoriesSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const allSelected = selectedCategories.length === CURATED_CATEGORIES.length;
  const totalSelectedPairs = selectedCategories.length * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-sheet-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88dvh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-fade-up">
        {/* Grab handle on mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-[#E5E7EB]" />
        </div>

        {/* Sheet Header */}
        <div className="px-6 pt-4 pb-3 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div>
            <h2
              id="categories-sheet-title"
              className="font-[var(--font-display)] text-xl font-extrabold tracking-tight text-[#0D0F12]"
            >
              Categories
            </h2>
            <p className="text-xs text-[#5C6470] mt-0.5 tabular-nums">
              {selectedCategories.length} of {CURATED_CATEGORIES.length} packs ·{' '}
              {totalSelectedPairs.toLocaleString()} curated pairs
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!allSelected && (
              <button
                type="button"
                onClick={onSelectAll}
                className="min-h-10 px-3 rounded-full text-xs font-semibold text-[#1D7BF2] hover:bg-[#F3F5F8] transition-colors whitespace-nowrap cursor-pointer"
              >
                Select all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close categories"
              className="w-10 h-10 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] text-[#0D0F12] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Optional AI Word Generator Row */}
          <div className="rounded-2xl bg-[#F3F5F8] px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0D0F12] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0D0F12]">
                  AI Word Generator
                </p>
                <p className="text-xs text-[#5C6470] leading-relaxed mt-0.5">
                  Mix in fresh AI-generated everyday Indian word pairs from your
                  selected topics. Falls back to curated packs offline.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={useAiWords}
              aria-label="Toggle AI Word Generator"
              onClick={onToggleAiWords}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7BF2] ${
                useAiWords ? 'bg-[#1D7BF2]' : 'bg-[#D1D5DB]'
              }`}
            >
              <span
                className={`inline-block h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  useAiWords ? 'translate-x-5.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 10 Curated Pan-Indian Packs */}
          <div className="divide-y divide-[#E5E7EB]">
            {CURATED_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              const isOnlySelected =
                isSelected && selectedCategories.length === 1;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onToggleCategory(category.id)}
                  aria-pressed={isSelected}
                  disabled={isOnlySelected}
                  className="w-full min-h-[60px] py-3.5 flex items-center justify-between gap-4 text-left transition-opacity disabled:opacity-75 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-semibold text-[#0D0F12] group-hover:text-[#0D0F12]">
                        {category.label}
                      </span>
                      <span className="text-xs text-[#5C6470] tabular-nums">
                        100 pairs
                      </span>
                    </div>
                    <p className="text-xs text-[#5C6470] mt-0.5 truncate">
                      {category.description}
                    </p>
                  </div>

                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#1D7BF2] text-white'
                        : 'border-2 border-[#D1D5DB] bg-white'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-12 rounded-full bg-[#0D0F12] hover:bg-[#23262C] text-white text-sm font-bold transition-[transform,background-color] duration-150 active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
