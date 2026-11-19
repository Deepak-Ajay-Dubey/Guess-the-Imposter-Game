# Word Spy v2.1 — Visual & UI Design System

## 1. Visual Direction & Theme
* **Aesthetic**: **Tactical Spy Dossier (Dark Mode Primary)** — crisp, modern, high-contrast espionage UI inspired by classified field briefings, security radar screens, and physical dossier stamps.
* **Why Dark Mode Primary**: Pass-and-play games are frequently played in dim living rooms, cafes, or late-night hangouts; dark surfaces reduce screen glare and make it harder for nearby players to read a secret word from the side.
* **Mobile-First Layout**: Centered single-column container (`max-w-md mx-auto min-h-dvh`) with generous thumb-zone actions at the bottom of the screen and zero horizontal scrolling.

---

## 2. Color Palette & Semantic Tokens

### Base Surfaces
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#090D16` | Deep obsidian-navy app background with subtle tactical dot/grid overlay |
| `--bg-surface` | `#111827` | Primary cards, modals, player rows, and dossier panels |
| `--bg-elevated` | `#1E293B` | Interactive pills, hover states, input backgrounds, and secondary buttons |
| `--border-subtle` | `#273449` | Hairline 1px borders separating cards and panels |

### Typography Colors
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--text-primary` | `#F8FAFC` | Headings, secret words, player names (high contrast `> 14:1`) |
| `--text-secondary` | `#94A3B8` | Supporting labels, round metadata, helper text |
| `--text-muted` | `#64748B` | Codetags, timestamps, subtle captions |

### Faction & Action Accents
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--accent-primary` | `#38BDF8` | Primary CTAs, active category chips, radar highlights (Cyan) |
| `--faction-civilian` | `#10B981` | Civilian role stamp, Civilian victory banner, "+2/+1" badges (Emerald) |
| `--faction-undercover` | `#F43F5E` | Undercover role stamp, elimination CTA, threat alerts (Crimson Rose) |
| `--faction-mrwhite` | `#A855F7` | Mr. White role stamp, blind card accent, "+4" badges (Violet) |
| `--faction-infiltrators` | `#F59E0B` | `INFILTRATORS` dual-victory banner & radar warning accents (Amber Gold) |

> **Anti-Spoiler Color Rule**: On `ROLE_REVEAL` and `PrivatePeekModal`, Civilians and Undercovers MUST both use the neutral `--accent-primary` (Cyan) card styling—never Emerald or Crimson—so Undercover players cannot tell their faction from the card color.

---

## 3. Typography
Load via Google Fonts in `index.html`:
* **Display / Headings**: **`Space Grotesk`** (`600`, `700`) — bold, geometric, modern spy-thriller feel for screen titles, victory banners, and secret words.
* **Body / UI**: **`Inter`** (`400`, `500`, `600`) — ultra-legible on small mobile screens for rules, player lists, and modals.
* **Monospace / Tactical Metadata**: **`JetBrains Mono`** (`500`, `700`) — used for agent codetags (`AGENT-04`), round counters (`R-02`), role stamps (`CLASSIFIED`, `MR. WHITE`), and scoreboard points (`+3 PTS`).

### Type Scale
| Element | Font | Size / Weight | Tracking |
| :--- | :--- | :--- | :--- |
| **Secret Word (Reveal Card)** | Space Grotesk | `2rem` (32px) / `700` | `-0.02em` |
| **Screen Title** | Space Grotesk | `1.5rem` (24px) / `700` | `-0.01em` |
| **Section Heading** | Space Grotesk | `1.125rem` (18px) / `600` | `0` |
| **Body / Player Name** | Inter | `1rem` (16px) / `500` | `0` |
| **Tactical Label / Badge** | JetBrains Mono | `0.75rem` (12px) / `700` | `+0.08em` (uppercase) |

---

## 4. Layout, Spacing & Touch Ergonomics
* **Minimum Touch Target**: All buttons, category chips, and suspect cards must be at least **`48px` tall** (`min-h-12`) for comfortable one-handed thumb tapping.
* **Safe Area Padding**: Apply `pb-[env(safe-area-inset-bottom)]` on bottom sticky action bars so iOS home indicators never overlap primary CTAs.
* **Spacing Rhythm**: Consistent `4px` base grid (`p-4` card padding, `gap-3` between list items, `gap-5` between major sections).
* **Border Radius**: `rounded-2xl` (16px) for main dossier cards and modals; `rounded-xl` (12px) for buttons and inputs; `rounded-full` for status pills.

---

## 5. Signature Components & Micro-Interactions

### 5.1 Classified Flip Card (`RoleRevealScreen`)
* Centered vertical card (`aspect-[3/4]`, max-width `320px`) with subtle CSS 3D Y-axis flip (`transform-style: preserve-3d`, `450ms cubic-bezier(0.22, 1, 0.36, 1)`).
* **Front (Locked)**: Fingerprint/shield icon, player's codetag, and *"Tap to Decrypt Word"*.
* **Back (Unlocked)**:
  * Civilian/Undercover: Crisp uppercase secret word + 5-second shrinking memorize progress bar + `Hide / Show` eye toggle.
  * Mr. White: Subtle violet border, `AGENT ROLE: MR. WHITE` badge, large `NO SECRET WORD` monospace readout, and 1-line survival reminder.

### 5.2 Elimination Role Stamp (`EliminationScreen`)
* Heavy bordered rubber-stamp badge (`CIVILIAN`, `UNDERCOVER`, or `MR. WHITE`) rotated `-4deg` that slams into place (`scale(1.6) → scale(1)` with `280ms` ease-out + subtle screen shake) synced with `audioEngine.playStampSlam()`.

### 5.3 Remaining Threats Radar
* Compact 3-column tactical HUD below the elimination stamp showing live counts:
  * **Civilians Alive** (Emerald pill)
  * **Undercovers Left** (Rose pill)
  * **Mr. White** (`AT LARGE` pulsing Violet dot / `NEUTRALIZED` muted Slate)

### 5.4 Press-and-Hold Safe Peek Button
* Uses `touch-none select-none` to prevent mobile text selection or context menus while holding.
* Displays a radial or horizontal hold-state glow while pressed; immediately snaps back to hidden on release.

### 5.5 Modals & Overlays
* Backdrop: `bg-slate-950/80 backdrop-blur-sm`.
* Sheet/Dialog: `bg-[#111827] border border-[#273449] rounded-2xl shadow-2xl`, max-height `85dvh` with internal scroll for `ScoreboardModal` and `HistoryVaultModal`.

---

## 6. Accessibility & Readability
* Maintain WCAG AA contrast (`>= 4.5:1`) for all readable text and badges.
* Respect `prefers-reduced-motion: reduce` by disabling card-flip 3D rotation and stamp screen-shake in favor of clean opacity fades.
* Never rely on color alone for faction identity—always pair faction colors with explicit text labels and distinct icons (`Shield` for Civilian, `UserSearch` for Undercover, `Ghost` for Mr. White, `Swords` for Infiltrators).