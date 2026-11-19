# Word Spy v2.1 — AI Development Rules & Boundaries

These rules are **mandatory guardrails** for any AI coding assistant working on this repository. Follow them strictly in every phase.

---

## 1. Approved & Forbidden Libraries

### Approved Stack (Use Only These)
* `react`, `react-dom`, `typescript`, `vite`
* `tailwindcss` for styling
* `lucide-react` for icons
* `@google/genai` **strictly inside `/api/*`** (never imported in `/src/*`)
* Native browser APIs: `localStorage`, `window.AudioContext`, `history.pushState`, `beforeunload`

### Forbidden (Do NOT Install or Use)
* **No Express, Fastify, or Koa**: Backend routes must be standard Vercel Serverless Functions under `/api/*`.
* **No heavy state libraries**: Do not add Redux, Zustand, MobX, or React Query. React `useState`/`useReducer` + custom hooks are sufficient.
* **No UI component frameworks**: Do not install MUI, Chakra UI, Ant Design, or Bootstrap. Build clean Tailwind components matching `Design.md`.
* **No audio libraries or MP3/WAV files**: Do not install Howler.js or Tone.js; synthesize all 9 sounds via `AudioContext` in `src/engine/audioEngine.ts`.
* **No database/auth SDKs**: Do not add Firebase, Supabase, Clerk, or Prisma.

---

## 2. Pass-and-Play Privacy & Anti-Spoiler Rules (CRITICAL)
1. **Never expose a secret word on reload**: If `ActiveMatchSnapshot.phase === 'ROLE_REVEAL'`, hydration MUST step back to `'PASS_TO_REVEAL'` for the same `currentRevealIndex`.
2. **Never give Mr. White hints**: Do not add decoy themes, category hints, or last-guess modals. Mr. White must only see `NO SECRET WORD`.
3. **Zero audio tells**: `audioEngine.playCardFlip()` must produce the **exact same waveform and duration** for Civilian, Undercover, and Mr. White.
4. **Keep words classified until `GAME_OVER`**: Neither `VOTING` nor `ELIMINATION_REVEAL` may ever display `civilianWord` or `undercoverWord`.
5. **Safe Private Peek gate**: Clicking a player's name in `PrivatePeekModal` must never immediately show the word. It must first show a *"Hand phone to [Name] — Press & Hold to Peek"* button, and hide the word immediately on pointer release (`onPointerUp`, `onPointerLeave`, `onPointerCancel`).
6. **Never tell Undercover they are Undercover**: On `ROLE_REVEAL` and `PrivatePeekModal`, Civilians and Undercovers must see the **exact same UI chrome** (only their secret word differs).

---

## 3. Game Logic Integrity Rules
* **Pure Engine Functions**: All functions in `src/engine/gameLogic.ts` and `src/engine/scoreManager.ts` must be pure TypeScript with zero React imports so they are easy to test and reason about.
* **Round 1 Mr. White Protection**: When `roundNumber === 1`, the turn-order generator MUST guarantee Mr. White is not at index `0`, and when `alivePlayers.length >= 5`, Mr. White is placed at index `>= 2`.
* **Randomized Word Direction**: Every match start must randomly swap `wordA`/`wordB` with 50% probability before assigning `civilianWord` and `undercoverWord`.
* **Stable Word Keys**: Always normalize word pair IDs as `[wordA.trim().toLowerCase(), wordB.trim().toLowerCase()].sort().join('|')`. Never store array indices in `localStorage`.
* **Dedicated `INFILTRATORS` State**: Never map a Final-2 (1 Undercover + 1 Mr. White) outcome to `UNDERCOVERS`. It MUST return `'INFILTRATORS'` and award `+3` to the surviving Undercover and `+4` to the surviving Mr. White.
* **Player Name Hygiene**: Always `.trim()` player names and reject duplicates using `.toLowerCase()` comparison before allowing Setup to start a match.

---

## 4. Error Handling & Resilience Rules
* **`localStorage` Safety**: Never call `localStorage.getItem`, `setItem`, or `JSON.parse` directly in components. Always route through `src/engine/storage.ts`, which wraps every call in `try/catch` and degrades gracefully to an in-memory `Map` if storage is unavailable or corrupted.
* **Zero-Wait AI Fallback**: Starting a match MUST NEVER block on a network call. AI pairs are prefetched asynchronously into a local queue; if the queue is empty, the API returns `429`/`500`, or the device is offline, `wordService.getNextWordPair()` immediately returns an unused curated pair.
* **Web Audio Unlock**: Mobile Safari/Chrome block `AudioContext` until a user gesture. Lazily initialize/resume `AudioContext` inside user click handlers and wrap all audio calls in `try/catch` so audio errors never interrupt gameplay.
* **Serverless API Validation**: Validate request body shapes in `/api/words/generate-batch.ts`, enforce `POST` only, cap `count <= 20`, and never leak stack traces or `GEMINI_API_KEY` in error responses.

---

## 5. Code Quality & Scope Boundaries
* **Strict TypeScript**: No `any` types, no `@ts-ignore`, and no unused variables.
* **One Phase at a Time**: Follow `Phases.md` sequentially. Do not build Phase 5 features while implementing Phase 1.
* **Keep Files Focused**: Keep components under ~250 lines; extract reusable UI primitives (buttons, modals, badges) cleanly rather than duplicating markup.
* **Do Not Hardcode Secrets or Model Names**: Always read `process.env.GEMINI_API_KEY` and `process.env.GEMINI_MODEL || 'gemini-3.8-flash'` on the server.
* **No Unrequested Feature Creep**: Do not add timers to voting, chat boxes, avatar uploads, or extra game modes not specified in `PRD.md`.