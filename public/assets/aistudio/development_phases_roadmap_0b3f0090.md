# Word Spy v2.1 — Phased Implementation Roadmap

Build the project strictly **one phase at a time**. Complete and verify each phase's **Definition of Done** before moving to the next, and update `Memory.md` at the end of every phase.

---

## Phase 1: Project Scaffold, Types & Pure Game Engine
**Goal**: Set up the Vite + React + TypeScript + Tailwind project and implement the pure, bug-free core game logic and scoring engine.

* **Files to Create**:
  * `package.json`, `vite.config.ts`, `tsconfig.json`, `vercel.json`, `index.html`, `src/index.css`
  * `src/types/game.ts` — All v2.1 types (`Role`, `WinnerFaction`, `GamePhase`, `Player`, `WordPair`, `ActiveMatchSnapshot`, `MatchRecord`).
  * `src/engine/gameLogic.ts` — Role distribution (`3–15` players, `3` UC at `12–15`), codetag generator, `generateTurnOrder()` with Round 1 Mr. White guard, `checkWinCondition()` with `INFILTRATORS` support.
  * `src/engine/scoreManager.ts` — `calculateMatchPoints()` (`+2/+1` Civ, `+3` UC, `+4` MW, `INFILTRATORS` `+3/+4`) and cumulative scoreboard helpers.
* **Definition of Done**:
  * `npm run build` compiles with zero TypeScript errors.
  * Unit/console verification confirms role ratios for 3, 5, 7, 12, 15 players; Round 1 Mr. White is never Speaker #1; and Final-2 (1 UC + 1 MW) returns `INFILTRATORS` awarding `+3` and `+4`.

---

## Phase 2: Everyday Pan-Indian Word Library & Safe Persistence Layer
**Goal**: Build the curated "No-Google Test" word database, normalized no-repeat tracker, and refresh-proof `localStorage` persistence manager.

* **Files to Create**:
  * `src/engine/storage.ts` — `try/catch` safe `localStorage` wrapper with in-memory fallback.
  * `src/data/curatedWords.ts` — 160+ high-quality, everyday pan-Indian word pairs evenly distributed across all 8 categories (zero obscure/regional/jargon words).
  * `src/engine/wordService.ts` — Stable normalized `wordA|wordB` keys, 50/50 Civilian/Undercover direction flip, category-scoped recycling, and offline-first pair picker.
  * `src/engine/sessionManager.ts` — Roster persistence (`word_spy_last_roster_v1`), category persistence (`word_spy_selected_cats_v1`), live snapshot save/load (`word_spy_active_match_v1`), `ROLE_REVEAL` → `PASS_TO_REVEAL` privacy downgrade, and `<15m` / `15m–12h` / `>12h` staleness evaluator.
* **Definition of Done**:
  * Every curated word passes the "No-Google Test" with zero duplicates.
  * Refreshing with a simulated `ROLE_REVEAL` snapshot safely resolves to `PASS_TO_REVEAL`.
  * Exhausting a category recycles only that category without resetting others.

---

## Phase 3: App Shell, Navigation & Reveal Flow (Screens 1–4)
**Goal**: Build the tactical visual shell, central state controller, and the first half of the playable loop (`HOME` → `SETUP` → `PASS_TO_REVEAL` → `ROLE_REVEAL`).

* **Files to Create**:
  * `src/hooks/useGameController.ts` — Central state machine wired to `sessionManager`.
  * `src/components/layout/AppShell.tsx` & `Header.tsx`
  * `src/components/screens/HomeScreen.tsx` — Brand header, 8 categories + `All Categories` + `Surprise Me (AI Live)`.
  * `src/components/screens/SetupScreen.tsx` — 3–15 player inputs, trim & case-insensitive unique validation, Reset Roster button, live role ratio preview.
  * `src/components/screens/PassPhoneScreen.tsx` — Privacy handoff screen + "Back to Previous Player" button (`i > 0`).
  * `src/components/screens/RoleRevealScreen.tsx` — 3D flip card, 5-second memorize progress bar, Hide/Show toggle, identical Civilian/Undercover UI, and blind Mr. White (`NO SECRET WORD`) card.
  * `src/App.tsx`
* **Definition of Done**:
  * Full pass-and-play reveal loop works smoothly on mobile viewport (`375px` width).
  * Editing names persists across hard browser refresh; duplicate or blank names are blocked cleanly.
  * Refreshing mid-reveal always lands safely on `PASS_TO_REVEAL`.

---

## Phase 4: Describe, Safe Peek, Voting, Debrief & Game Over (Screens 5–8)
**Goal**: Complete the full end-to-end playable game loop.

* **Files to Create**:
  * `src/components/screens/DescribeScreen.tsx` — Shuffled speaker list + "Forgot your word?" trigger.
  * `src/components/modals/PrivatePeekModal.tsx` — Player list → *"Hand phone to [Name] — Press & Hold to Peek"* gate.
  * `src/components/screens/VotingScreen.tsx` — Rotating Designated Voter badge, alive suspect grid, and Tied Vote / Skip Round button.
  * `src/components/modals/ConfirmVoteModal.tsx` — Two-step confirmation with accurate spoiler-free copy.
  * `src/components/screens/EliminationScreen.tsx` — Animated role stamp (`CIVILIAN`, `UNDERCOVER`, `MR. WHITE`) + Remaining Threats Radar (words still hidden).
  * `src/components/screens/GameOverScreen.tsx` — Winner banner (`CIVILIANS`, `UNDERCOVERS`, `MR_WHITE`, `INFILTRATORS`), revealed words, full role & points table, "Play Again (Same Players)" and "Change Players".
* **Definition of Done**:
  * Complete multi-round matches can be played from `HOME` to `GAME_OVER` for all 4 victory outcomes.
  * Tied Vote skips elimination, increments round, rotates Designated Voter, and reshuffles speakers.
  * `GAME_OVER` clears `word_spy_active_match_v1` while keeping roster and scores intact.

---

## Phase 5: Scoreboard, History Vault, Audio, Modals & Mobile Guards
**Goal**: Add session continuity, lifetime analytics, procedural sound effects, and mobile UX hardening.

* **Files to Create**:
  * `src/engine/historyManager.ts` — Match Vault logger & lifetime analytics aggregator (including `INFILTRATORS`).
  * `src/engine/audioEngine.ts` — 9 synthesized Web Audio SFX with persisted mute toggle (`word_spy_sound`) and identical card-flip audio across all roles.
  * `src/hooks/useNavigationGuard.ts` — `beforeunload` and History API `popstate` back-swipe guard during active gameplay.
  * `src/components/modals/ScoreboardModal.tsx` — Cumulative leaderboard + Reset Scores.
  * `src/components/modals/HistoryVaultModal.tsx` — 2-tab Records & Stats + expandable Match Vault.
  * `src/components/modals/ResumeMatchModal.tsx`, `QuitConfirmModal.tsx`, `HowToPlayModal.tsx`.
* **Definition of Done**:
  * Scores accumulate accurately across consecutive matches and survive browser refresh.
  * Audio plays reliably on mobile tap without throwing errors when muted or locked.
  * `15m–12h` stale snapshots trigger `ResumeMatchModal`; `Quit Game` clears active snapshot safely.

---

## Phase 6: Vercel Serverless AI Live Mode
**Goal**: Wire up free-tier Gemini AI word generation with background prefetching and instant curated fallback.

* **Files to Create / Update**:
  * `api/health.ts` — `GET /api/health` returning `{ ok, aiConfigured, model }`.
  * `api/words/generate-batch.ts` — `POST /api/words/generate-batch` using `@google/genai`, `process.env.GEMINI_MODEL || 'gemini-3.8-flash'`, structured JSON `responseSchema`, and the strict "No-Google Test" pan-Indian prompt.
  * Update `src/engine/wordService.ts` — Add background 15-pair AI prefetch queue with automatic zero-wait fallback on offline / `429` / timeout.
* **Definition of Done**:
  * `vercel dev` serves both the React SPA and `/api/*` routes cleanly.
  * Selecting `Surprise Me (AI Live)` serves fresh AI pairs when online and falls back seamlessly to curated words when `GEMINI_API_KEY` is absent or rate-limited.

---

## Phase 7: QA Polish & Vercel Production Deployment
**Goal**: Final verification across edge cases and live deployment.

* **Verification Checklist**:
  * Test 3-player sudden-death, 5-player blind Mr. White, and 12-player 3-Undercover scaling.
  * Test hard refresh on every single phase (`HOME` through `GAME_OVER`).
  * Test mobile portrait layout (`360px–430px`) for tap target comfort and zero horizontal scroll.
  * Deploy to Vercel, configure `GEMINI_API_KEY` and `GEMINI_MODEL` in Vercel Project Settings, and verify `/api/health` in production.