# Word Spy v2.1 — System Architecture

## 1. Technical Stack
| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite | Fast local dev, strict type safety for game state, small production bundle. |
| **Styling** | Tailwind CSS v4 (or v3) | Utility-first styling for rapid, consistent responsive mobile UI. |
| **Icons** | `lucide-react` | Lightweight, crisp tactical iconography with tree-shaking. |
| **Audio** | Native Web Audio API | Zero external MP3/WAV assets; instant procedural sound synthesis. |
| **Persistence** | Browser `localStorage` | Zero-login, offline-capable roster, snapshot, score, and history storage. |
| **Backend / API** | Vercel Serverless Functions (`/api/*`) | Co-located in the same repo; eliminates free-tier Express cold starts and CORS issues. |
| **AI Word Engine** | `@google/genai` (server-side) | Structured JSON output via free-tier `gemini-3.8-flash` (env-configurable). |
| **Hosting** | Vercel | Automatic Git deploys, zero-config SPA + `/api` routing, secure env vars. |

---

## 2. High-Level System Diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│                   VERCEL DEPLOYMENT (Single Repo)                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               CLIENT (React + Vite SPA — /src)                 │  │
│  │                                                                │  │
│  │  • Screen Views: Home, Setup, Pass, Reveal, Describe, Vote,    │  │
│  │    Elimination Debrief, Game Over                              │  │
│  │  • Global Overlays: How To Play, Scoreboard, History Vault,    │  │
│  │    Resume Match Modal, Quit Confirmation Modal                 │  │
│  │  • Core Engine (/src/engine):                                  │  │
│  │    SessionManager, GameLogic, WordService, ScoreManager,       │  │
│  │    HistoryManager, AudioEngine                                 │  │
│  └──────────────┬─────────────────────────────────┬───────────────┘  │
│                 │ localStorage (try/catch safe)   │ relative fetch   │
│                 ▼                                 ▼                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │     Browser localStorage     │  │ Vercel Serverless (/api)     │  │
│  │ • word_spy_last_roster_v1    │  │ • GET  /api/health           │  │
│  │ • word_spy_selected_cats_v1  │  │ • POST /api/words/generate-  │  │
│  │ • word_spy_active_match_v1   │  │        batch                 │  │
│  │ • word_spy_used_words_v2     │  └──────────────┬───────────────┘  │
│  │ • word_spy_session_scores_v2 │                 │ env vars:        │
│  │ • word_spy_match_history_v2  │                 │ GEMINI_API_KEY   │
│  │ • word_spy_sound             │                 │ GEMINI_MODEL     │
│  └──────────────────────────────┘                 ▼                  │
│                                    ┌──────────────────────────────┐  │
│                                    │  Gemini API (@google/genai)  │  │
│                                    │  Default: gemini-3.8-flash   │  │
│                                    │  Fallback: curated pool      │  │
│                                    └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Repository & Folder Structure

```text
/
├── api/
│   ├── health.ts                       # GET /api/health — status & active model check
│   └── words/
│       └── generate-batch.ts           # POST /api/words/generate-batch — Gemini structured JSON
├── public/
│   └── favicon.svg                     # Tactical spy emblem favicon
├── src/
│   ├── types/
│   │   └── game.ts                     # All TypeScript interfaces, enums & unions
│   ├── data/
│   │   └── curatedWords.ts             # Pruned everyday pan-Indian word pairs (8 categories)
│   ├── engine/
│   │   ├── storage.ts                  # Safe try/catch localStorage wrapper + in-memory fallback
│   │   ├── sessionManager.ts           # Roster, categories, active match snapshot & staleness logic
│   │   ├── gameLogic.ts                # Role ratios, codetags, R1 Mr. White guard, win checks
│   │   ├── wordService.ts              # Normalized keys, direction flip, AI prefetch & fallback
│   │   ├── scoreManager.ts             # Points calculation (+2/+1, +3, +4, INFILTRATORS)
│   │   ├── historyManager.ts           # Match Vault logging & lifetime analytics aggregation
│   │   └── audioEngine.ts              # Web Audio API 9-SFX procedural synthesizer
│   ├── hooks/
│   │   ├── useGameController.ts        # Central state reducer/orchestrator syncing to sessionManager
│   │   └── useNavigationGuard.ts       # beforeunload + History API popstate mobile guard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Top bar: Title, Quit, Scoreboard, History, Help, Mute
│   │   │   └── AppShell.tsx            # Centered mobile-first container & background grid
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx          # Hero + Category Selector + Start Setup
│   │   │   ├── SetupScreen.tsx         # 3–15 Player Roster, validation, Reset Roster, Role preview
│   │   │   ├── PassPhoneScreen.tsx     # Safe handoff screen + Back to Previous Player
│   │   │   ├── RoleRevealScreen.tsx    # Flip card, 5s bar, Hide/Show, blind Mr. White view
│   │   │   ├── DescribeScreen.tsx      # Shuffled speaker list + Safe Private Peek trigger
│   │   │   ├── VotingScreen.tsx        # Designated Voter banner, suspect grid, Tied Vote/Skip
│   │   │   ├── EliminationScreen.tsx   # Animated role stamp + Remaining Threats Radar
│   │   │   └── GameOverScreen.tsx      # Winner banner, revealed words, points breakdown, Replay
│   │   └── modals/
│   │       ├── PrivatePeekModal.tsx    # Player selector -> "Hand phone to [Name]" -> Hold to Peek
│   │       ├── ConfirmVoteModal.tsx    # Two-step vote confirmation with accurate spoiler-free copy
│   │       ├── ResumeMatchModal.tsx    # Shown for 15m–12h stale snapshots
│   │       ├── QuitConfirmModal.tsx    # Confirms clearing active snapshot while keeping roster
│   │       ├── ScoreboardModal.tsx     # Cumulative session leaderboard + Reset Scores
│   │       ├── HistoryVaultModal.tsx   # 2-tab Analytics KPIs + Expandable Match Vault
│   │       └── HowToPlayModal.tsx      # Crisp v2.1 rules & scoring reference
│   ├── App.tsx                         # Top-level phase router & modal host
│   ├── main.tsx                        # React entry point
│   └── index.css                       # Tailwind directives, font imports, custom keyframes
├── vercel.json                         # SPA rewrite excluding /api/*
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. State Machine & Data Flow

```text
HOME ──► SETUP ──► PASS_TO_REVEAL ──► ROLE_REVEAL ──(loop i < N)──► PASS_TO_REVEAL
                                           │ (all N viewed)
                                           ▼
                 ┌─────────────────► DESCRIBE_TURN
                 │                         │ (all alive spoke)
                 │ Tied Vote / Skip        ▼
                 │                      VOTING
                 │                         │ (confirm elimination)
                 │                         ▼
                 └──(no winner)─── ELIMINATION_REVEAL
                                           │ (checkWinCondition() !== null)
                                           ▼
                                       GAME_OVER ──► PASS_TO_REVEAL (Same Players)
                                                 └──► HOME (Change Players)
```

* **Single Source of Truth**: `useGameController` owns the active `GameState`. Every transition runs through pure functions in `/src/engine/gameLogic.ts` and immediately persists an `ActiveMatchSnapshot` when `phase` is one of `PASS_TO_REVEAL`, `ROLE_REVEAL`, `DESCRIBE_TURN`, `VOTING`, or `ELIMINATION_REVEAL`.
* **Hydration on Boot**:
  1. Load `lastRoster` and `selectedCategories`.
  2. Check `activeMatchSnapshot`:
     * Missing or `> 12h` old → discard & open `HOME`.
     * `15m – 12h` old → open `HOME` with `ResumeMatchModal`.
     * `< 15m` old → auto-hydrate; if `snapshot.phase === 'ROLE_REVEAL'`, override `phase` to `'PASS_TO_REVEAL'`.

---

## 5. Core TypeScript Data Models (`src/types/game.ts`)

```ts
export type Role = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE';

export type WinnerFaction = 'CIVILIANS' | 'UNDERCOVERS' | 'MR_WHITE' | 'INFILTRATORS';

export type GamePhase =
  | 'HOME'
  | 'SETUP'
  | 'PASS_TO_REVEAL'
  | 'ROLE_REVEAL'
  | 'DESCRIBE_TURN'
  | 'VOTING'
  | 'ELIMINATION_REVEAL'
  | 'GAME_OVER';

export type CategoryId =
  | 'indian_culture'
  | 'food_dining'
  | 'everyday_home'
  | 'tech_media'
  | 'nature_wildlife'
  | 'sports_games'
  | 'work_campus'
  | 'cinema_pop'
  | 'all'
  | 'ai_live';

export interface Player {
  id: string;
  name: string; // Trimmed, case-insensitive unique
  role: Role;
  word: string; // Empty string "" for MR_WHITE
  isEliminated: boolean;
  eliminatedRound?: number;
  codetag: string; // e.g., "AGENT-04"
}

export interface WordPair {
  id: string; // Normalized alphabetical key e.g. "coffee|tea"
  category: string;
  civilianWord: string; // Direction randomly assigned at match start
  undercoverWord: string;
  source: 'curated' | 'ai';
}

export interface ActiveMatchSnapshot {
  phase: GamePhase;
  players: Player[];
  currentWordPair: WordPair;
  currentRevealIndex: number;
  roundNumber: number;
  roundTurnOrder: string[]; // Array of Player IDs
  voterRotationIndex: number;
  lastEliminatedPlayerId: string | null;
  savedAt: number; // Unix timestamp ms
}

export interface MatchRecord {
  id: string;
  playedAt: number;
  winner: WinnerFaction;
  wordPair: WordPair;
  totalRounds: number;
  players: Array<{
    name: string;
    role: Role;
    isEliminated: boolean;
    eliminatedRound?: number;
    pointsEarned: number;
  }>;
}
```

---

## 6. `localStorage` Schema
| Key | Contents | Cleared On |
| :--- | :--- | :--- |
| `word_spy_last_roster_v1` | `string[]` (3–15 trimmed player names) | Manual "Reset Roster" |
| `word_spy_selected_cats_v1` | `CategoryId[]` | Never (overwritten on toggle) |
| `word_spy_active_match_v1` | `ActiveMatchSnapshot` | `GAME_OVER`, `Quit Game`, or `> 12h` expiry |
| `word_spy_used_words_v2` | `string[]` (normalized `wordA|wordB` keys) | Auto-recycled per active category when exhausted |
| `word_spy_session_scores_v2` | `Record<string, number>` (player name → pts) | Manual "Reset Scores" |
| `word_spy_match_history_v2` | `MatchRecord[]` (capped at 100 latest) | Manual "Clear History" |
| `word_spy_sound` | `'on' \| 'off'` | Toggled by user |

---

## 7. Vercel Serverless API Contract

### `GET /api/health`
Returns `{ ok: true, aiConfigured: boolean, model: string }` so the client knows whether AI Live Mode is available without exposing any secrets.

### `POST /api/words/generate-batch`
* **Request Body**:
  ```json
  {
    "categories": ["food_dining", "indian_culture"],
    "excludeKeys": ["coffee|tea", "biryani|pulao"],
    "count": 15
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "pairs": [
      { "category": "food_dining", "wordA": "Samosa", "wordB": "Kachori" }
    ]
  }
  ```
* **Error Handling**: Returns clean `503` / `429` JSON on missing key, quota exhaustion, or upstream failure; client silently falls back to `curatedWords.ts`.

---

## 8. Vercel Deployment Configuration

### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables (Vercel Project Settings)
* `GEMINI_API_KEY`: Free-tier key from Google AI Studio (server-side only).
* `GEMINI_MODEL`: Optional string, defaults to `gemini-3.8-flash` (can be swapped to `gemini-3.5-flash-lite` anytime without redeploying).