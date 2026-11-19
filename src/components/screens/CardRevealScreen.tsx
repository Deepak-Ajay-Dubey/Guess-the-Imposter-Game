import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { Player, WordPair } from '../../types/game';

interface CardRevealScreenProps {
  player: Player;
  nextPlayer: Player | null;
  cardIndex: number;
  totalCards: number;
  wordPair: WordPair;
  hintForOddOne: boolean;
  onAdvance: () => void;
  onBackToSetup: () => void;
}

export function CardRevealScreen({
  player,
  nextPlayer,
  cardIndex,
  totalCards,
  wordPair,
  hintForOddOne,
  onAdvance,
  onBackToSetup,
}: CardRevealScreenProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const isMrWhite = player.role === 'MR_WHITE';

  const handleTapCard = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[460px] mx-auto flex flex-col justify-between animate-fade-up">
      {/* Top Bar + Segmented Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToSetup}
            className="min-h-10 -ml-2 px-2 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium text-[#5C6470] hover:text-[#0D0F12] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>

          <span className="text-sm font-medium text-[#5C6470] tabular-nums">
            Card {cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* Coral Segmented Progress Bar */}
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={cardIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalCards}
          aria-label={`Card ${cardIndex + 1} of ${totalCards}`}
        >
          {Array.from({ length: totalCards }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                i <= cardIndex ? 'bg-[#FA362A]' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Centered Player Heading + 3D Flip Card */}
      <div className="my-7 flex flex-col items-center text-center">
        <h1 className="font-[var(--font-display)] text-[1.75rem] sm:text-[2rem] font-extrabold tracking-tight text-[#0D0F12] leading-tight">
          {player.name}
        </h1>
        <p className="text-sm text-[#5C6470] mt-1.5 mb-7">
          {isRevealed
            ? 'Memorise it, then hide it before passing on.'
            : "Make sure nobody's peeking"}
        </p>

        {/* Tactile 3D Flip Card */}
        <div className="w-full max-w-[300px] aspect-[3/4] perspective-1000">
          <div
            className={`relative w-full h-full flip-card-inner ${
              isRevealed ? 'is-flipped' : ''
            }`}
          >
            {/* Front Face: Matte Black Tap-to-Reveal */}
            <button
              type="button"
              onClick={handleTapCard}
              disabled={isRevealed}
              aria-label={`Tap to reveal secret card for ${player.name}`}
              className={`absolute inset-0 w-full h-full flip-card-face rounded-[28px] bg-[#0D0F12] text-white shadow-[0_20px_40px_-18px_rgba(13,15,18,0.45)] p-8 flex flex-col items-center justify-center gap-5 cursor-pointer transition-transform duration-150 active:scale-[0.985] ${
                isRevealed ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <EyeOff className="w-8 h-8" aria-hidden="true" />
              </div>
              <div className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-white">
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Tap to reveal</span>
              </div>
            </button>

            {/* Back Face: Crisp White Bordered Card
                ANTI-SPOILER RULE: Civilians and Undercovers see 100% identical layout and styling! */}
            <div
              className={`absolute inset-0 w-full h-full flip-card-face flip-card-back rounded-[28px] bg-white border-2 border-[#0D0F12] shadow-[0_18px_36px_-20px_rgba(13,15,18,0.22)] p-8 flex flex-col items-center justify-center text-center ${
                isRevealed ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {isMrWhite ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#FA362A]">
                    You are Mr. White
                  </p>
                  <p
                    data-testid="secret-word"
                    className="font-[var(--font-display)] text-[1.9rem] font-extrabold tracking-tight text-[#0D0F12] leading-tight"
                  >
                    No secret word
                  </p>
                  <p className="text-sm text-[#5C6470] leading-relaxed">
                    Listen carefully to the clues and blend in.
                  </p>
                  {hintForOddOne && (
                    <div className="pt-4 mt-2 border-t border-[#E5E7EB]">
                      <p className="text-xs text-[#5C6470]">
                        Category hint ·{' '}
                        <span className="font-semibold text-[#0D0F12]">
                          {wordPair.categoryLabel}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#5C6470]">
                    Your secret word
                  </p>
                  <p
                    data-testid="secret-word"
                    className="font-[var(--font-display)] text-[2rem] font-extrabold tracking-tight text-[#0D0F12] leading-tight break-words"
                  >
                    {player.word}
                  </p>
                  <p className="text-sm text-[#5C6470] pt-1">
                    {wordPair.categoryLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pill CTA */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onAdvance}
          disabled={!isRevealed}
          className="min-h-[54px] px-8 rounded-full bg-[#0D0F12] hover:bg-[#23262C] disabled:bg-[#D1D5DB] disabled:text-white/90 text-white font-[var(--font-display)] text-[15px] font-bold tracking-tight transition-[transform,background-color] duration-150 active:scale-[0.97] disabled:pointer-events-none whitespace-nowrap cursor-pointer shadow-[0_10px_24px_-10px_rgba(13,15,18,0.45)] disabled:shadow-none"
        >
          {nextPlayer
            ? `Hide & pass to ${nextPlayer.name}`
            : 'Hide & start round'}
        </button>
      </div>
    </div>
  );
}
