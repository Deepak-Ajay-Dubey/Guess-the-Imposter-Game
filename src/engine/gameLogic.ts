import { ALL_CURATED_CATEGORY_IDS } from '../data/curatedWords';
import type {
  GameConfig,
  GameMode,
  Player,
  Role,
  WordPair,
} from '../types/game';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 15;
export const MIN_MIXED_PLAYERS = 4;
export const MIN_TIMER_MINUTES = 1;
export const MAX_TIMER_MINUTES = 10;

export type RandomFn = () => number;

export const DEFAULT_GAME_CONFIG: GameConfig = {
  mode: 'classic',
  playerCount: 4,
  customNames: [],
  mrWhiteCount: 1,
  undercoverCount: 1,
  hintForOddOne: true,
  selectedCategories: [...ALL_CURATED_CATEGORY_IDS],
  useAiWords: false,
  timerEnabled: true,
  timerMinutes: 3,
};

/**
 * Unbiased Fisher-Yates shuffle returning a new array.
 */
export function shuffleArray<T>(
  items: readonly T[],
  rng: RandomFn = Math.random
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Maximum combined impostors allowed for a given player count and mode.
 * Always preserves at least 2 Civilians so deduction stays meaningful.
 */
export function getMaxTotalOddOnes(
  playerCount: number,
  mode: GameMode
): number {
  const clampedPlayers = Math.max(
    MIN_PLAYERS,
    Math.min(MAX_PLAYERS, Math.floor(playerCount))
  );
  if (mode === 'mixed') {
    // Mixed needs at least 1 Mr. White + 1 Undercover and >= 2 Civilians
    return Math.max(2, Math.floor(clampedPlayers / 2));
  }
  return Math.max(1, Math.floor((clampedPlayers - 1) / 2));
}

/**
 * Returns the active Mr. White and Undercover counts for the current config.
 */
export function getActiveRoleCounts(config: GameConfig): {
  civilians: number;
  undercovers: number;
  mrWhites: number;
} {
  const normalized = normalizeGameConfig(config);
  const mrWhites =
    normalized.mode === 'classic' || normalized.mode === 'mixed'
      ? normalized.mrWhiteCount
      : 0;
  const undercovers =
    normalized.mode === 'twisted' || normalized.mode === 'mixed'
      ? normalized.undercoverCount
      : 0;
  const civilians = Math.max(0, normalized.playerCount - mrWhites - undercovers);
  return { civilians, undercovers, mrWhites };
}

/**
 * Clamps and reconciles all configuration fields into a valid, playable state.
 */
export function normalizeGameConfig(config: GameConfig): GameConfig {
  const mode: GameMode =
    config.mode === 'classic' ||
    config.mode === 'twisted' ||
    config.mode === 'mixed'
      ? config.mode
      : 'classic';

  const minPlayersForMode = mode === 'mixed' ? MIN_MIXED_PLAYERS : MIN_PLAYERS;
  const playerCount = Math.max(
    minPlayersForMode,
    Math.min(MAX_PLAYERS, Math.floor(config.playerCount || 4))
  );

  const maxOdd = getMaxTotalOddOnes(playerCount, mode);

  let mrWhiteCount = Math.max(1, Math.floor(config.mrWhiteCount || 1));
  let undercoverCount = Math.max(1, Math.floor(config.undercoverCount || 1));

  if (mode === 'classic') {
    mrWhiteCount = Math.min(mrWhiteCount, maxOdd);
    undercoverCount = Math.min(undercoverCount, Math.max(1, maxOdd));
  } else if (mode === 'twisted') {
    undercoverCount = Math.min(undercoverCount, maxOdd);
    mrWhiteCount = Math.min(mrWhiteCount, Math.max(1, maxOdd));
  } else {
    // Mixed mode: both >= 1 and combined <= maxOdd
    if (mrWhiteCount + undercoverCount > maxOdd) {
      mrWhiteCount = Math.min(mrWhiteCount, Math.max(1, maxOdd - 1));
      undercoverCount = Math.min(
        undercoverCount,
        Math.max(1, maxOdd - mrWhiteCount)
      );
    }
  }

  const validCategorySet = new Set<string>(ALL_CURATED_CATEGORY_IDS);
  const selectedCategories = Array.from(
    new Set(
      (config.selectedCategories ?? []).filter((id) => validCategorySet.has(id))
    )
  );

  const timerMinutes = Math.max(
    MIN_TIMER_MINUTES,
    Math.min(MAX_TIMER_MINUTES, Math.floor(config.timerMinutes || 3))
  );

  const customNames = Array.isArray(config.customNames)
    ? config.customNames.slice(0, MAX_PLAYERS).map((n) => (typeof n === 'string' ? n : ''))
    : [];

  return {
    mode,
    playerCount,
    customNames,
    mrWhiteCount,
    undercoverCount,
    hintForOddOne: Boolean(config.hintForOddOne),
    selectedCategories:
      selectedCategories.length > 0
        ? selectedCategories
        : [...ALL_CURATED_CATEGORY_IDS],
    useAiWords: Boolean(config.useAiWords),
    timerEnabled: Boolean(config.timerEnabled),
    timerMinutes,
  };
}

/**
 * Resolves display names for all players. Any blank custom entry falls back
 * cleanly to "Player N" so setup never blocks play.
 */
export function resolvePlayerNames(
  playerCount: number,
  customNames: readonly string[]
): string[] {
  const names: string[] = [];
  for (let i = 0; i < playerCount; i += 1) {
    const raw = (customNames[i] ?? '').trim();
    names.push(raw.length > 0 ? raw : `Player ${i + 1}`);
  }
  return names;
}

/**
 * Randomly assigns Civilian, Undercover, and/or Mr. White roles and secret words.
 */
export function assignRolesToPlayers(
  config: GameConfig,
  wordPair: WordPair,
  rng: RandomFn = Math.random
): Player[] {
  const normalized = normalizeGameConfig(config);
  const names = resolvePlayerNames(normalized.playerCount, normalized.customNames);
  const counts = getActiveRoleCounts(normalized);

  const roleBag: Role[] = [
    ...Array<Role>(counts.civilians).fill('CIVILIAN'),
    ...Array<Role>(counts.undercovers).fill('UNDERCOVER'),
    ...Array<Role>(counts.mrWhites).fill('MR_WHITE'),
  ];

  const shuffledRoles = shuffleArray(roleBag, rng);

  return names.map((name, index) => {
    const role = shuffledRoles[index] ?? 'CIVILIAN';
    const word =
      role === 'CIVILIAN'
        ? wordPair.civilianWord
        : role === 'UNDERCOVER'
          ? wordPair.undercoverWord
          : '';

    return {
      id: `player-${index + 1}`,
      index,
      name,
      role,
      word,
    };
  });
}

/**
 * Picks a random first speaker, avoiding Mr. White whenever possible so
 * a blind player isn't forced to invent a clue out of thin air on turn 1.
 */
export function pickStartingPlayerIndex(
  players: readonly Player[],
  rng: RandomFn = Math.random
): number {
  if (players.length === 0) {
    return 0;
  }
  const nonMrWhiteIndices = players
    .map((p, i) => (p.role !== 'MR_WHITE' ? i : -1))
    .filter((i) => i >= 0);

  const pool =
    nonMrWhiteIndices.length > 0
      ? nonMrWhiteIndices
      : players.map((_, i) => i);

  return pool[Math.floor(rng() * pool.length)] ?? 0;
}
