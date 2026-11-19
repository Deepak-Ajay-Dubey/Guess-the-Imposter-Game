import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import mascotImage from '../../assets/images/mascot_raccoon_spy_1795085482480.jpg';

export function HeroBanner() {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="w-full rounded-[26px] bg-[#FA362A] text-white px-6 sm:px-8 py-5 sm:py-6 shadow-[0_14px_32px_-12px_rgba(250,54,42,0.45)] flex items-center justify-center gap-4 sm:gap-6">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-[#FA362A] flex items-center justify-center">
        {!imgError ? (
          <img
            src={mascotImage}
            alt="Word Spy mischievous raccoon mascot"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover scale-110"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white">
            <EyeOff className="w-8 h-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-[var(--font-display)] text-sm sm:text-base font-bold tracking-tight text-white/95 leading-snug">
          Word Spy
        </p>
        <h1 className="font-[var(--font-display)] text-[1.75rem] sm:text-[2.15rem] font-extrabold tracking-[-0.03em] text-white leading-[1.08] [text-wrap:balance]">
          Odd One Out
        </h1>
      </div>
    </header>
  );
}
