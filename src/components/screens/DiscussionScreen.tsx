import { useEffect, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import type { GameMode, Player } from '../../types/game';

interface DiscussionScreenProps {
  startingPlayer: Player;
  mode: GameMode;
  oddOneCount: number;
  timerEnabled: boolean;
  timerMinutes: number;
  onRevealOddOnes: () => void;
  onBackToSetup: () => void;
}

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function DiscussionScreen({
  startingPlayer,
  mode,
  oddOneCount,
  timerEnabled,
  timerMinutes,
  onRevealOddOnes,
  onBackToSetup,
}: DiscussionScreenProps) {
  const initialSeconds = timerMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(timerEnabled);

  useEffect(() => {
    setSecondsLeft(timerMinutes * 60);
    setIsRunning(timerEnabled);
  }, [timerMinutes, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled || !isRunning || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerEnabled, isRunning, secondsLeft]);

  const isTimeUp = timerEnabled && secondsLeft === 0;

  const handleToggleTimer = () => {
    if (isTimeUp) {
      setSecondsLeft(initialSeconds);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  const handleResetTimer = () => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
  };

  const voteHintText =
    mode === 'twisted'
      ? 'On three, everyone points at who they think got the sneaky lookalike word.'
      : mode === 'mixed'
        ? 'On three, everyone points at who they suspect. Watch out — both Mr. White and Undercover are hiding in the room.'
        : 'On three, everyone points at who they think is faking. Mr. White can win by guessing the secret word before you crack them.';

  return (
    <div className="flex-1 w-full max-w-[480px] mx-auto flex flex-col justify-between animate-fade-up">
      {/* Minimal Top Back Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSetup}
          className="min-h-10 -ml-2 px-2 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium text-[#5C6470] hover:text-[#0D0F12] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Setup</span>
        </button>
      </div>

      {/* Main Centered Discussion Stage */}
      <div className="my-auto py-8 flex flex-col items-center text-center space-y-7">
        <div className="space-y-2">
          <h1 className="font-[var(--font-display)] text-[1.9rem] sm:text-[2.25rem] font-extrabold tracking-tight text-[#0D0F12] leading-tight [text-wrap:balance]">
            {startingPlayer.name} goes first
          </h1>
          <p className="text-[15px] text-[#5C6470] leading-relaxed max-w-[360px] mx-auto">
            Go around the circle. One word each — not too obvious, not too
            vague.
          </p>
        </div>

        {/* High-Contrast Countdown Timer */}
        {timerEnabled && (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`min-w-[196px] rounded-[24px] px-9 py-5 font-[var(--font-mono)] text-[2.75rem] sm:text-[3.25rem] font-bold leading-none tabular-nums tracking-tight transition-colors duration-200 shadow-[0_14px_30px_-14px_rgba(13,15,18,0.4)] ${
                isTimeUp
                  ? 'bg-[#FA362A] text-white'
                  : 'bg-[#0D0F12] text-white'
              }`}
              role="timer"
              aria-live="off"
            >
              {formatSeconds(secondsLeft)}
            </div>

            {isTimeUp && (
              <p className="text-xs font-semibold text-[#FA362A]">
                Time&apos;s up — count to three and point!
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleTimer}
                className="min-h-10 px-5 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] text-sm font-semibold text-[#0D0F12] inline-flex items-center gap-1.5 transition-[transform,background-color] duration-150 active:scale-95 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isTimeUp ? 'Restart' : 'Resume'}</span>
                  </>
                )}
              </button>

              {!isRunning && secondsLeft !== initialSeconds && (
                <button
                  type="button"
                  onClick={handleResetTimer}
                  aria-label="Reset timer"
                  className="w-10 h-10 rounded-full bg-[#F3F5F8] hover:bg-[#E9EDF3] text-[#5C6470] hover:text-[#0D0F12] inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Soft Mist "Then vote" Card */}
        <section
          aria-label="How to vote in real life"
          className="w-full rounded-[22px] bg-[#F3F5F8] p-6 text-left space-y-1.5"
        >
          <h2 className="font-[var(--font-display)] text-base font-bold text-[#0D0F12]">
            Then vote
          </h2>
          <p className="text-sm text-[#5C6470] leading-relaxed">
            {voteHintText}
          </p>
        </section>

        {/* Bold Coral-Red Reveal CTA */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onRevealOddOnes}
            className="min-h-[54px] px-9 rounded-full bg-[#FA362A] hover:bg-[#E4281D] text-white font-[var(--font-display)] text-base font-bold tracking-tight shadow-[0_12px_26px_-10px_rgba(250,54,42,0.55)] transition-[transform,background-color] duration-150 active:scale-[0.97] whitespace-nowrap cursor-pointer"
          >
            {oddOneCount > 1 ? 'Reveal the odd ones' : 'Reveal the odd one'}
          </button>
        </div>
      </div>

      <div className="h-6" aria-hidden="true" />
    </div>
  );
}
