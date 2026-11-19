import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-white text-[#0D0F12] flex flex-col">
      <main className="flex-1 w-full max-w-[1040px] mx-auto px-5 sm:px-8 pt-6 sm:pt-10 pb-14 flex flex-col">
        {children}
      </main>
    </div>
  );
}
