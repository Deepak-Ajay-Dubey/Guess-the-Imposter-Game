# Word Spy v2.1 — Product Requirements Document (PRD)

## 1. Executive Summary
**Word Spy** is a zero-login, single-device pass-and-play social deduction party game for **3 to 15 players**, built as a mobile-first web application hosted on **Vercel**. Players pass one shared phone around to privately view a secret word, give spoken clues in shuffled order, debate suspects aloud, and vote players out until all impostors are eliminated or impostors survive to the Final 2.

v2.1 focuses on eliminating real-world pass-and-play friction: accidental browser refreshes never wipe rosters or live matches, obscure words are replaced with everyday pan-Indian vocabulary, Mr. White is cleanly balanced as a 100% blind survival wildcard, and a dedicated `INFILTRATORS` victory state ensures fair Final-2 scoring.

---

## 2. Target Audience & Usage Context
* **Primary Users**: Friends, college students, families, and office teams in India playing together in person (living rooms, cafes, road trips, game nights).
* **Device Context**: Almost always played on a **single smartphone** passed hand-to-hand in portrait mode, often in areas with spotty mobile internet.
* **Key User Needs**:
  * Start playing in under 20 seconds (no signup, no room codes, no app install).
  * Every word must be instantly understood without anyone secretly Googling its meaning.
  * Accidental pull-to-refresh or Android/iOS edge-swipe back gestures must never kill a match or expose another player's secret word.

---

## 3. Core Game Rules & Factions

### 3.1 The Three Factions
| Faction | Secret Information | Objective |
| :--- | :--- | :--- |
| **Civilians** *(Majority)* | All receive the **same secret word** (e.g., *Tea*). | Identify and eliminate every Undercover and Mr. White. |
| **Undercover** *(Minority Impostor)* | Receive a **closely related, non-synonym word** (e.g., *Coffee*). Never told they are Undercover on their card. | Blend in with Civilians and survive to the Final 2. |
| **Mr. White** *(Blind Survival Wildcard)* | Receives **no secret word and no hints** (`NO SECRET WORD`). Explicitly told they are Mr. White. | Strictly survival-only (no last-guess comeback). Listen to others' clues and bluff into the Final 2. |

### 3.2 Automatic Role Scaling (3–15 Players)
| Total Players | Civilians | Undercover | Mr. White | Notes |
| :---: | :---: | :---: | :---: | :--- |
| **3–4** | 2–3 | 1 | 0 | 3-player mode is sudden-death on the first elimination. |
| **5–6** | 3–4 | 1 | 1 | Standard small-group balance. |
| **7–11** | 4–8 | 2 | 1 | Balanced mid-size group. |
| **12–15** | 8–11 | 3 | 1 | Prevents 11+ round drag in large groups. |

---

## 4. Functional Requirements

### FR-1: Home & Category Selection
* Users can select one or more of **8 curated categories** (`Indian Culture`, `Food & Dining`, `Everyday Home & Life`, `Technology & Media`, `Nature & Wildlife`, `Sports & Games`, `Work & Campus`, `Cinema & Pop Culture`), `All Categories`, or `Surprise Me (AI Live)`.
* Selected categories persist across refreshes (`word_spy_selected_cats_v1`).
* Global header provides quick access to **How To Play**, **Session Scoreboard**, **Match History & Analytics Vault**, and **Audio Mute Toggle**.

### FR-2: Player Setup & Refresh-Proof Roster
* Supports adding/removing **3 to 15 players**.
* Auto-saves player names on every edit (`word_spy_last_roster_v1`).
* Brand-new devices seed clean placeholders (`Player 1`–`Player 4`).
* **Validation**:
  * Trims leading/trailing whitespace automatically.
  * Blocks empty names and enforces case-insensitive uniqueness so scoreboard totals never split or collide.
* Includes a **"Reset Roster"** action to quickly clear saved names for a new group.

### FR-3: Refresh-Proof Active Match Recovery & Mobile Guards
* Every state mutation during active gameplay snapshots the live match to `word_spy_active_match_v1`.
* **Privacy Guard**: If the browser refreshes while `phase === 'ROLE_REVEAL'`, the app must resume at `PASS_TO_REVEAL` for the exact same player index so no secret word is exposed on screen.
* **Staleness Policy**:
  * `< 15 minutes` old → Auto-resume seamlessly.
  * `15 minutes – 12 hours` old → Display a **"Resume ongoing match? / Start Fresh"** modal.
  * `> 12 hours` old → Silently discard and boot to `HOME`.
* **Clean Teardown**: Snapshot is deleted automatically on `GAME_OVER` or confirmed `Quit Game` (roster, scores, and match history remain intact).
* **Mobile Protection**: Register `beforeunload` and History API `popstate` guards during active matches to prevent accidental edge-swipe exits.

### FR-4: Everyday Pan-Indian Word Library & Optional AI Live Mode
* **The "No-Google Test"**: All curated and AI-generated words must be medium-level, everyday words instantly recognizable across India (e.g., *Biryani / Pulao*, *Auto Rickshaw / Taxi*, *WhatsApp / Telegram*, *Diwali / Holi*). Obscure regional items, rare instruments, and niche jargon are strictly excluded.
* **Randomized Word Direction**: Every match randomly flips which word in the pair is assigned to Civilians vs. Undercover.
* **No-Repeat Tracking**: Used pairs are tracked by stable normalized alphabetical keys (e.g., `coffee|tea`) in `word_spy_used_words_v2`. When all pairs in the active categories are exhausted, only those active categories recycle.
* **AI Live Mode (`Surprise Me (AI Live)`)**:
  * Prefetches 15 pairs in the background via Vercel Serverless (`/api/words/generate-batch`) using free-tier Gemini (`gemini-3.8-flash` by default).
  * **Zero-Wait Fallback**: Starting a game never blocks on AI. If prefetch isn't ready, offline, or rate-limited (`429`), it silently pulls from the curated offline pool.

### FR-5: Pass-and-Play Secret Reveal & Describe Round
* **Two-Step Handoff**: `PASS_TO_REVEAL` ("Hand phone to [Name]") → `ROLE_REVEAL` (interactive flip card).
* Includes **"Back to Previous Player"** recovery (`index > 0`), a 5-second memorize progress bar, and a `Hide / Show` toggle.
* **Zero Audio Tells**: Card-flip sound must be 100% identical across Civilian, Undercover, and Mr. White.
* **Blind Mr. White Card**: Displays `AGENT ROLE: MR. WHITE`, `NO SECRET WORD`, and *"Listen carefully to everyone's clues and blend in to survive."* Zero hints or theme channels.
* **Describe Turn (`DESCRIBE_TURN`)**:
  * Displays shuffled turn order for all alive players.
  * **Round 1 Mr. White Protection**: Mr. White can never be Speaker #1 in Round 1 (and when 5+ players are alive, must be placed at index `2` or later). Pure random shuffle from Round 2 onward.
* **Safe Private Peek**:
  * Allows a player who forgot their word to select their name, pass through an explicit *"Hand phone to [Name] — Press & Hold to Peek"* gate, and view their card privately.

### FR-6: Voting, Elimination Debrief, Win Conditions & Scoring
* **Designated Voter**: Rotates each round (`alivePlayers[voterRotationIndex % alivePlayers.length]`) to enter the group's verbally agreed suspect.
* **Confirmation Copy**: Explicitly states *"Their role will be revealed, while secret words stay classified until game over."*
* **Tied Vote / Skip Round**: Skips elimination, increments `roundNumber`, rotates Designated Voter, reshuffles speakers, and starts the next clue round.
* **Elimination Debrief (`ELIMINATION_REVEAL`)**:
  * Shows animated role stamp (`CIVILIAN`, `UNDERCOVER`, `MR. WHITE`), role-specific audio cue, and a live **Remaining Threats Radar** (alive Civilians, remaining Undercovers, Mr. White status). Secret words remain hidden until `GAME_OVER`.
* **Win Conditions**:
  * `CIVILIANS`: `aliveUndercovers === 0 && aliveMrWhites === 0`
  * `UNDERCOVERS`: `alivePlayers.length <= 2` and only Undercover alive
  * `MR_WHITE`: `alivePlayers.length <= 2` and only Mr. White alive
  * `INFILTRATORS`: `alivePlayers.length <= 2` and 1 Undercover + 1 Mr. White alive
* **Scoring Formula**:
  * `CIVILIANS` win → Surviving Civilian **+2 pts**, Eliminated Civilian **+1 pt**
  * `UNDERCOVERS` win → Undercover (any status) **+3 pts**
  * `MR_WHITE` win → Mr. White (any status) **+4 pts**
  * `INFILTRATORS` win → Surviving Undercover **+3 pts**, Surviving Mr. White **+4 pts**
  * All others → **0 pts**

### FR-7: Scoreboard, Match History Vault & Web Audio
* **Session Scoreboard (`word_spy_session_scores_v2`)**: Cumulative points per player across replays (sorted by points desc, then name), independently resettable.
* **Match History & Analytics Vault (`word_spy_match_history_v2`)**: Auto-logs every completed match with KPI stats, faction win-rate breakdown (including `INFILTRATORS`), Hall of Fame, and expandable match cards showing words, roles, elimination rounds, and points earned.
* **Procedural Audio (`word_spy_sound`)**: 9 synthesized Web Audio API sound effects (click, card flip, tick, stamp slam, glitch, civilian warning, spy caught, civilian win fanfare, spy win chords) with persisted mute toggle.

---

## 5. Non-Functional Requirements
* **Offline-First Reliability**: 100% of core gameplay, curated words, scoring, history, and audio must work offline after initial load.
* **Zero Cold-Start Latency**: Game start and phase transitions must feel instant (`< 100ms`).
* **Privacy & Security**: `GEMINI_API_KEY` must remain strictly server-side in Vercel Environment Variables; never bundled into client JS.
* **Storage Safety**: All `localStorage` operations must be wrapped in `try/catch` so private browsing or corrupted JSON never crashes the app.

---

## 6. Out of Scope (v2.1 Non-Goals)
* Online multiplayer / WebSockets / multi-device room sync.
* User accounts, cloud sync, or external databases.
* Mr. White "Last Guess" comeback mechanic.
* Mr. White "Smoke Screen" decoy theme hints.
* Custom user-typed word decks (may be considered in v3).