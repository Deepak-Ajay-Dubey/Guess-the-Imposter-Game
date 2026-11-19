import { useState } from 'react';
import {
  Check,
  ChevronRight,
  EyeOff,
  FolderOpen,
  Hourglass,
  Layers,
  Lightbulb,
  Minus,
  Pencil,
  Plus,
  Shuffle,
  Smartphone,
  Timer,
  Users,
  UserX,
} from 'lucide-react';
import {
  CURATED_CATEGORIES,
  getCategoryShortLabel,
} from '../../data/curatedWords';
import {
  MAX_PLAYERS,
  MAX_TIMER_MINUTES,
  MIN_MIXED_PLAYERS,
  MIN_PLAYERS,
  MIN_TIMER_MINUTES,
} from '../../engine/gameLogic';
import type { GameConfig, GameMode } from '../../types/game';
import { HeroBanner } from '../shared/HeroBanner';

interface SetupScreenProps {
  config: GameConfig;
  roleCounts: { civilians: number; undercovers: number; mrWhites: number };
  maxTotalOddOnes: number;
  onSetMode: (mode: GameMode) => void;
  onAdjustPlayers: (delta: number) => void;
  onAdjustMrWhite: (delta: number) => void;
  onAdjustUndercover: (delta: number) => void;
  onSetCustomName: (index: number, value: string) => void;
  onClearCustomNames: () => void;
  onToggleHint: () => void;
  onOpenCategories: () => void;
  onToggleTimer: () => void;
  onAdjustTimerMinutes: (delta: number) => void;
  onStartRound: () => void;
}

const MODE_OPTIONS: readonly {
  id: GameMode;
  title: string;
  shortDesc: string;
  fullDesc: string;
  Icon: typeof Smartphone;
}[] = [
  {
    id: 'classic',
    title: 'Classic',
    shortDesc: 'Mr. White gets no word',
    fullDesc:
      'Everyone gets the same secret word — except Mr. White, who has to wing it.',
    Icon: Smartphone,
  },
  {
    id: 'twisted',
    title: 'Twisted',
    shortDesc: 'Undercover gets a lookalike',
    fullDesc:
      'Everyone gets a word — except Undercover, who gets a closely related lookalike.',
    Icon: Shuffle,
  },
  {
    id: 'mixed',
    title: 'Mixed',
    shortDesc: 'Both roles in one game',
    fullDesc:
      'Both Mr. White (no word) and Undercover (lookalike word) hide among the group.',
    Icon: Layers,
  },
];

function SwitchControl({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7BF2] ${
        checked ? 'bg-[#1D7BF2]' : 'bg-[#D1D5DB]'
      }`}
    >
      <span
        className={`inline-block h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5.5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function StepperControl({
  valueLabel,
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: {
  valueLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label={decreaseLabel}
        className="w-10 h-10 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] disabled:opacity-35 disabled:pointer-events-none text-[#0D0F12] flex items-center justify-center transition-[transform,background-color] duration-150 active:scale-95 cursor-pointer"
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>

      <span className="min-w-[3.25rem] text-center font-[var(--font-mono)] text-[15px] font-bold text-[#0D0F12] tabular-nums whitespace-nowrap">
        {valueLabel}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label={increaseLabel}
        className="w-10 h-10 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] disabled:opacity-35 disabled:pointer-events-none text-[#0D0F12] flex items-center justify-center transition-[transform,background-color] duration-150 active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function SetupScreen({
  config,
  roleCounts,
  maxTotalOddOnes,
  onSetMode,
  onAdjustPlayers,
  onAdjustMrWhite,
  onAdjustUndercover,
  onSetCustomName,
  onClearCustomNames,
  onToggleHint,
  onOpenCategories,
  onToggleTimer,
  onAdjustTimerMinutes,
  onStartRound,
}: SetupScreenProps) {
  const [showNamesEditor, setShowNamesEditor] = useState(false);

  const activeModeMeta =
    MODE_OPTIONS.find((m) => m.id === config.mode) ?? MODE_OPTIONS[0];

  const minPlayersForMode =
    config.mode === 'mixed' ? MIN_MIXED_PLAYERS : MIN_PLAYERS;

  const showMrWhiteRow = config.mode === 'classic' || config.mode === 'mixed';
  const showUndercoverRow =
    config.mode === 'twisted' || config.mode === 'mixed';

  const maxMrWhite =
    config.mode === 'mixed'
      ? Math.max(1, maxTotalOddOnes - config.undercoverCount)
      : maxTotalOddOnes;

  const maxUndercover =
    config.mode === 'mixed'
      ? Math.max(1, maxTotalOddOnes - config.mrWhiteCount)
      : maxTotalOddOnes;

  const hasCustomNames = config.customNames
    .slice(0, config.playerCount)
    .some((name) => name.trim().length > 0);

  const firstCategoryShort = getCategoryShortLabel(
    config.selectedCategories[0] ?? CURATED_CATEGORIES[0].id
  );
  const extraCategoryCount = Math.max(0, config.selectedCategories.length - 1);
  const categorySummary =
    extraCategoryCount > 0
      ? `${firstCategoryShort} +${extraCategoryCount}`
      : firstCategoryShort;

  return (
    <div className="flex-1 flex flex-col animate-fade-up">
      {/* Main Setup Stage */}
      <div className="w-full max-w-[520px] mx-auto space-y-6">
        <HeroBanner />

        {/* Mode Selector Cards: Classic / Twisted / Mixed */}
        <section aria-label="Game mode" className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            {MODE_OPTIONS.map((option) => {
              const isSelected = config.mode === option.id;
              const Icon = option.Icon;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSetMode(option.id)}
                  aria-pressed={isSelected}
                  className={`rounded-2xl p-3.5 sm:p-4 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] flex flex-col justify-between min-h-[116px] cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-[#0D0F12] shadow-xs'
                      : 'bg-[#F3F5F8] hover:bg-[#EBEEF4] border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#0D0F12]' : 'text-[#5C6470]'
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#1D7BF2] text-white'
                          : 'border-2 border-[#D1D5DB] bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                      )}
                    </span>
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <p
                      className={`font-[var(--font-display)] text-sm sm:text-[15px] font-bold leading-tight ${
                        isSelected ? 'text-[#0D0F12]' : 'text-[#4B5563]'
                      }`}
                    >
                      {option.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#5C6470] leading-snug">
                      {option.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-[#5C6470] leading-relaxed max-w-[420px] mx-auto px-2">
            {activeModeMeta.fullDesc}
          </p>
        </section>

        {/* Hairline Settings Rows */}
        <section
          aria-label="Game settings"
          className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]"
        >
          {/* Players Row + Optional Inline Name Editor */}
          <div className="py-3.5">
            <div className="min-h-[44px] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Users
                  className="w-5 h-5 text-[#0D0F12] shrink-0"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="text-[15px] font-semibold text-[#0D0F12] whitespace-nowrap">
                    Players
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNamesEditor((prev) => !prev)}
                    aria-expanded={showNamesEditor}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1D7BF2] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" aria-hidden="true" />
                    <span>
                      {showNamesEditor
                        ? 'Done'
                        : hasCustomNames
                          ? 'Edit names'
                          : 'Add names'}
                    </span>
                  </button>
                </div>
              </div>

              <StepperControl
                valueLabel={String(config.playerCount)}
                canDecrease={config.playerCount > minPlayersForMode}
                canIncrease={config.playerCount < MAX_PLAYERS}
                decreaseLabel="Decrease players"
                increaseLabel="Increase players"
                onDecrease={() => onAdjustPlayers(-1)}
                onIncrease={() => onAdjustPlayers(1)}
              />
            </div>

            {showNamesEditor && (
              <div className="mt-3.5 pt-3.5 border-t border-[#F1F3F6] space-y-3 animate-fade-up">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#5C6470]">
                    Optional — leave blank to use Player 1, Player 2, and so on.
                  </p>
                  {hasCustomNames && (
                    <button
                      type="button"
                      onClick={onClearCustomNames}
                      className="text-xs font-medium text-[#5C6470] hover:text-[#0D0F12] whitespace-nowrap cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: config.playerCount }, (_, index) => (
                    <div key={index} className="relative">
                      <label
                        htmlFor={`optional-player-name-${index}`}
                        className="sr-only"
                      >
                        Player {index + 1} name
                      </label>
                      <input
                        id={`optional-player-name-${index}`}
                        type="text"
                        value={config.customNames[index] ?? ''}
                        maxLength={24}
                        autoComplete="off"
                        placeholder={`Player ${index + 1}`}
                        onChange={(event) =>
                          onSetCustomName(index, event.target.value)
                        }
                        className="w-full min-h-11 px-3.5 rounded-xl bg-[#F3F5F8] border border-transparent focus:border-[#0D0F12] focus:bg-white text-sm font-medium text-[#0D0F12] placeholder:text-[#8A93A1] focus:outline-none transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mr. White Count (Classic & Mixed) */}
          {showMrWhiteRow && (
            <div className="min-h-[64px] py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <EyeOff
                  className="w-5 h-5 text-[#FA362A] shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#0D0F12] whitespace-nowrap">
                    {config.mode === 'classic' ? 'Odd ones out' : 'Mr. White'}
                  </span>
                  {config.mode === 'mixed' && (
                    <span className="block text-xs text-[#5C6470]">
                      Gets no word
                    </span>
                  )}
                </div>
              </div>

              <StepperControl
                valueLabel={String(config.mrWhiteCount)}
                canDecrease={config.mrWhiteCount > 1}
                canIncrease={config.mrWhiteCount < maxMrWhite}
                decreaseLabel="Decrease Mr. White count"
                increaseLabel="Increase Mr. White count"
                onDecrease={() => onAdjustMrWhite(-1)}
                onIncrease={() => onAdjustMrWhite(1)}
              />
            </div>
          )}

          {/* Undercover Count (Twisted & Mixed) */}
          {showUndercoverRow && (
            <div className="min-h-[64px] py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserX
                  className="w-5 h-5 text-[#0D0F12] shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#0D0F12] whitespace-nowrap">
                    {config.mode === 'twisted' ? 'Odd ones out' : 'Undercover'}
                  </span>
                  {config.mode === 'mixed' && (
                    <span className="block text-xs text-[#5C6470]">
                      Gets lookalike word
                    </span>
                  )}
                </div>
              </div>

              <StepperControl
                valueLabel={String(config.undercoverCount)}
                canDecrease={config.undercoverCount > 1}
                canIncrease={config.undercoverCount < maxUndercover}
                decreaseLabel="Decrease Undercover count"
                increaseLabel="Increase Undercover count"
                onDecrease={() => onAdjustUndercover(-1)}
                onIncrease={() => onAdjustUndercover(1)}
              />
            </div>
          )}

          {/* Hint for Mr. White Toggle (Classic & Mixed) */}
          {showMrWhiteRow && (
            <div className="min-h-[64px] py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Lightbulb
                  className="w-5 h-5 text-[#0D0F12] shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[15px] font-semibold text-[#0D0F12]">
                  {config.mode === 'mixed'
                    ? 'Hint for Mr. White'
                    : 'Hint for the odd one'}
                </span>
              </div>

              <SwitchControl
                checked={config.hintForOddOne}
                label="Toggle category hint for Mr. White"
                onToggle={onToggleHint}
              />
            </div>
          )}

          {/* Categories Disclosure Row */}
          <button
            type="button"
            onClick={onOpenCategories}
            className="w-full min-h-[64px] py-3 flex items-center justify-between gap-3 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FolderOpen
                className="w-5 h-5 text-[#0D0F12] shrink-0"
                aria-hidden="true"
              />
              <span className="text-[15px] font-semibold text-[#0D0F12] whitespace-nowrap">
                Categories
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-[#5C6470] shrink-0">
              <span className="whitespace-nowrap">
                {categorySummary}
                {config.useAiWords ? ' · AI' : ''}
              </span>
              <ChevronRight className="w-4 h-4 text-[#8A93A1]" aria-hidden="true" />
            </div>
          </button>

          {/* Time Limit Toggle */}
          <div className="min-h-[64px] py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Timer
                className="w-5 h-5 text-[#0D0F12] shrink-0"
                aria-hidden="true"
              />
              <span className="text-[15px] font-semibold text-[#0D0F12]">
                Time limit
              </span>
            </div>

            <SwitchControl
              checked={config.timerEnabled}
              label="Toggle discussion timer"
              onToggle={onToggleTimer}
            />
          </div>

          {/* Duration Stepper (when timer enabled) */}
          {config.timerEnabled && (
            <div className="min-h-[64px] py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Hourglass
                  className="w-5 h-5 text-[#0D0F12] shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[15px] font-semibold text-[#0D0F12]">
                  Duration
                </span>
              </div>

              <StepperControl
                valueLabel={`${config.timerMinutes} min`}
                canDecrease={config.timerMinutes > MIN_TIMER_MINUTES}
                canIncrease={config.timerMinutes < MAX_TIMER_MINUTES}
                decreaseLabel="Decrease timer duration"
                increaseLabel="Increase timer duration"
                onDecrease={() => onAdjustTimerMinutes(-1)}
                onIncrease={() => onAdjustTimerMinutes(1)}
              />
            </div>
          )}
        </section>

        {/* Quiet Role Breakdown Line + Primary Start CTA */}
        <div className="pt-1 flex flex-col items-center space-y-4">
          <p className="text-xs text-[#5C6470] tabular-nums">
            {roleCounts.civilians}{' '}
            {roleCounts.civilians === 1 ? 'Civilian' : 'Civilians'}
            {roleCounts.undercovers > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                {roleCounts.undercovers} Undercover
              </>
            )}
            {roleCounts.mrWhites > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                {roleCounts.mrWhites} Mr. White
              </>
            )}
            <span aria-hidden="true"> · </span>
            1,000 word pairs
          </p>

          <button
            type="button"
            data-start="true"
            onClick={onStartRound}
            className="min-h-[54px] px-11 rounded-full bg-[#0D0F12] hover:bg-[#23262C] text-white font-[var(--font-display)] text-base font-bold tracking-tight shadow-[0_10px_24px_-10px_rgba(13,15,18,0.55)] transition-[transform,background-color] duration-150 active:scale-[0.97] whitespace-nowrap cursor-pointer"
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Inline Visual "How to Play" Section (Below the Fold) */}
      <section
        aria-labelledby="how-to-play-heading"
        className="w-full max-w-[920px] mx-auto mt-16 sm:mt-20 pt-10 border-t border-[#E5E7EB]"
      >
        <h2
          id="how-to-play-heading"
          className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-center text-[#0D0F12] mb-7"
        >
          How to Play
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <article className="rounded-[24px] bg-[#F3F5F8] p-6 flex flex-col items-center text-center">
            <span className="w-9 h-9 rounded-full border-2 border-[#0D0F12] font-[var(--font-display)] text-sm font-extrabold text-[#0D0F12] flex items-center justify-center mb-5">
              1
            </span>

            {/* Mini visual cards illustration */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-2 mb-5 h-16"
            >
              <div className="w-11 h-14 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center font-[var(--font-display)] text-xs font-bold text-[#0D0F12]">
                Chai
              </div>
              <div className="w-11 h-14 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center font-[var(--font-display)] text-xs font-bold text-[#0D0F12]">
                Chai
              </div>
              <div className="w-11 h-14 rounded-xl bg-[#FA362A] text-white shadow-sm flex items-center justify-center -rotate-3">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="w-11 h-14 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center font-[var(--font-display)] text-xs font-bold text-[#0D0F12]">
                Chai
              </div>
            </div>

            <h3 className="font-[var(--font-display)] text-base font-bold text-[#0D0F12] mb-1.5">
              Pass &amp; Peek
            </h3>
            <p className="text-sm text-[#5C6470] leading-relaxed">
              Pass one phone around. Everyone gets the secret word — except Mr.
              White (no word) or Undercover (similar word).
            </p>
          </article>

          {/* Step 2 */}
          <article className="rounded-[24px] bg-[#F3F5F8] p-6 flex flex-col items-center text-center">
            <span className="w-9 h-9 rounded-full border-2 border-[#0D0F12] font-[var(--font-display)] text-sm font-extrabold text-[#0D0F12] flex items-center justify-center mb-5">
              2
            </span>

            {/* Mini clue bubbles illustration */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-2 mb-5 h-16"
            >
              <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0D0F12]">
                &ldquo;Morning&rdquo;
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0D0F12]">
                &ldquo;Ginger&rdquo;
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#0D0F12] text-xs font-semibold text-white">
                &ldquo;Warm?&rdquo;
              </span>
            </div>

            <h3 className="font-[var(--font-display)] text-base font-bold text-[#0D0F12] mb-1.5">
              Give One Clue
            </h3>
            <p className="text-sm text-[#5C6470] leading-relaxed">
              Go around the circle saying one related word each. Too obvious
              gives it away; too vague makes you look guilty.
            </p>
          </article>

          {/* Step 3 */}
          <article className="rounded-[24px] bg-[#F3F5F8] p-6 flex flex-col items-center text-center">
            <span className="w-9 h-9 rounded-full border-2 border-[#0D0F12] font-[var(--font-display)] text-sm font-extrabold text-[#0D0F12] flex items-center justify-center mb-5">
              3
            </span>

            {/* Mini countdown & reveal illustration */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-2.5 mb-5 h-16"
            >
              <span className="px-3.5 py-2 rounded-xl bg-[#0D0F12] text-white font-[var(--font-mono)] text-sm font-bold tabular-nums">
                3 · 2 · 1
              </span>
              <span className="px-3.5 py-2 rounded-xl bg-[#FA362A] text-white font-[var(--font-display)] text-xs font-bold">
                Reveal!
              </span>
            </div>

            <h3 className="font-[var(--font-display)] text-base font-bold text-[#0D0F12] mb-1.5">
              Point &amp; Reveal
            </h3>
            <p className="text-sm text-[#5C6470] leading-relaxed">
              On three, everyone points at who they suspect in real life. Tap
              Reveal to unmask the odd one out.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
