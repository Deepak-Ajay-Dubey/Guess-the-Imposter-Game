import { EyeOff, RotateCcw, SlidersHorizontal, UserX } from 'lucide-react';
import type { Player, WordPair } from '../../types/game';

interface ResultScreenProps {
  players: readonly Player[];
  wordPair: WordPair;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

export function ResultScreen({
  players,
  wordPair,
  onPlayAgain,
  onBackToSetup,
}: ResultScreenProps) {
  const oddOnes = players.filter((player) => player.role !== 'CIVILIAN');
  const civilians = players.filter((player) => player.role === 'CIVILIAN');
  const hasUndercover = oddOnes.some((player) => player.role === 'UNDERCOVER');

  return (
    <div className="flex-1 w-full max-w-[480px] mx-auto flex flex-col justify-between py-4 animate-fade-up">
      <div className="space-y-6">
        {/* Heading */}
        <div className="text-center space-y-1.5 pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FA362A]">
            {oddOnes.length > 1 ? 'The odd ones out' : 'The odd one out'}
          </p>
          <h1 className="font-[var(--font-display)] text-[1.9rem] sm:text-[2.2rem] font-extrabold tracking-tight text-[#0D0F12] leading-tight">
            {oddOnes.map((p) => p.name).join(' & ')}
          </h1>
        </div>

        {/* Unmasked Impostor Cards */}
        <section aria-label="Revealed odd ones" className="space-y-2.5">
          {oddOnes.map((impostor) => {
            const isMrWhite = impostor.role === 'MR_WHITE';
            return (
              <div
                key={impostor.id}
                className={`rounded-2xl p-4 flex items-center justify-between gap-3 border-2 ${
                  isMrWhite
                    ? 'bg-[#FFF5F5] border-[#FA362A]'
                    : 'bg-white border-[#0D0F12]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isMrWhite
                        ? 'bg-[#FA362A] text-white'
                        : 'bg-[#0D0F12] text-white'
                    }`}
                  >
                    {isMrWhite ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <UserX className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-[var(--font-display)] text-base font-bold text-[#0D0F12] truncate">
                      {impostor.name}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        isMrWhite ? 'text-[#FA362A]' : 'text-[#5C6470]'
                      }`}
                    >
                      {isMrWhite
                        ? 'Mr. White · No secret word'
                        : 'Undercover · Lookalike word'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Secret Word Reveal Card */}
        <section
          aria-label="Secret words"
          className="rounded-[24px] bg-[#F3F5F8] p-6 space-y-4"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-[var(--font-display)] text-sm font-bold text-[#0D0F12]">
              {hasUndercover ? 'Secret Words' : 'Secret Word'}
            </h2>
            <span className="text-xs text-[#5C6470]">
              {wordPair.categoryLabel}
              {wordPair.source === 'ai' ? ' · AI' : ''}
            </span>
          </div>

          <div
            className={`grid gap-3 ${
              hasUndercover ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB]">
              <p className="text-xs font-medium text-[#5C6470]">
                {hasUndercover ? 'Civilians' : 'Everyone else'}
              </p>
              <p
                data-testid="revealed-civilian-word"
                className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[#0D0F12] mt-1 break-words"
              >
                {wordPair.civilianWord}
              </p>
            </div>

            {hasUndercover && (
              <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB]">
                <p className="text-xs font-medium text-[#FA362A]">Undercover</p>
                <p
                  data-testid="revealed-undercover-word"
                  className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[#0D0F12] mt-1 break-words"
                >
                  {wordPair.undercoverWord}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quiet Civilians Summary */}
        {civilians.length > 0 && (
          <div className="text-center text-xs text-[#5C6470] leading-relaxed px-2">
            <span className="font-semibold text-[#0D0F12]">Civilians: </span>
            {civilians.map((c) => c.name).join(', ')}
          </div>
        )}
      </div>

      {/* Bottom Replay Actions */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full sm:w-auto min-h-[54px] px-9 rounded-full bg-[#0D0F12] hover:bg-[#23262C] text-white font-[var(--font-display)] text-base font-bold tracking-tight inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_-10px_rgba(13,15,18,0.5)] transition-[transform,background-color] duration-150 active:scale-[0.97] whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Play Again</span>
        </button>

        <button
          type="button"
          onClick={onBackToSetup}
          className="w-full sm:w-auto min-h-[54px] px-7 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] text-[#0D0F12] font-[var(--font-display)] text-sm font-bold inline-flex items-center justify-center gap-2 transition-[transform,background-color] duration-150 active:scale-[0.97] whitespace-nowrap cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span>Change Settings</span>
        </button>
      </div>
    </div>
  );
}
