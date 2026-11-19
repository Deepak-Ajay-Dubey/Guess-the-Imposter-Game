import {
  ALL_CURATED_CATEGORY_IDS,
  CURATED_WORD_POOL,
  getCategoryLabel,
  type CuratedWordEntry,
} from '../data/curatedWords';
import type { CuratedCategoryId, WordPair } from '../types/game';
import type { RandomFn } from './gameLogic';
import { safeStorage, type SafeStorage } from './storage';

export const USED_WORDS_STORAGE_KEY = 'word_spy_used_words_v3';
export const AI_BATCH_SIZE = 15;
export const AI_LOW_WATER_MARK = 4;
export const AI_FETCH_TIMEOUT_MS = 15_000;
export const AI_FAILURE_COOLDOWN_MS = 60_000;

const VALID_CURATED_SET = new Set<string>(ALL_CURATED_CATEGORY_IDS);

export interface AiHealthStatus {
  ok: boolean;
  aiConfigured: boolean;
  model: string;
}

interface AiQueueState {
  queue: CuratedWordEntry[];
  inFlight: Promise<number> | null;
  cooldownUntil: number;
  aiAvailable: boolean | null;
}

const aiState: AiQueueState = {
  queue: [],
  inFlight: null,
  cooldownUntil: 0,
  aiAvailable: null,
};

export function normalizeWordPairKey(wordA: string, wordB: string): string {
  return [wordA.trim().toLowerCase(), wordB.trim().toLowerCase()]
    .sort()
    .join('|');
}

export function loadUsedWordKeys(
  storage: SafeStorage = safeStorage
): string[] {
  const stored = storage.getJSON<unknown>(USED_WORDS_STORAGE_KEY, []);
  if (!Array.isArray(stored)) {
    return [];
  }
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of stored) {
    if (typeof item === 'string' && item.includes('|')) {
      const normalized = item.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(normalized);
      }
    }
  }
  return cleaned;
}

export function saveUsedWordKeys(
  keys: readonly string[],
  storage: SafeStorage = safeStorage
): void {
  storage.setJSON(USED_WORDS_STORAGE_KEY, [...keys]);
}

export function clearUsedWordKeys(storage: SafeStorage = safeStorage): void {
  storage.remove(USED_WORDS_STORAGE_KEY);
}

export function createRandomizedWordPair(
  entry: CuratedWordEntry,
  source: 'curated' | 'ai' = 'curated',
  rng: RandomFn = Math.random
): WordPair {
  const wordA = entry.wordA.trim();
  const wordB = entry.wordB.trim();
  const flip = rng() < 0.5;

  return {
    id: normalizeWordPairKey(wordA, wordB),
    category: entry.category,
    categoryLabel: getCategoryLabel(entry.category),
    civilianWord: flip ? wordB : wordA,
    undercoverWord: flip ? wordA : wordB,
    source,
  };
}

export function getAiQueueCount(): number {
  return aiState.queue.length;
}

export function resetAiQueueState(): void {
  aiState.queue = [];
  aiState.inFlight = null;
  aiState.cooldownUntil = 0;
  aiState.aiAvailable = null;
}

function isValidApiPair(value: unknown): value is CuratedWordEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.wordA !== 'string' || typeof obj.wordB !== 'string') {
    return false;
  }
  const a = obj.wordA.trim();
  const b = obj.wordB.trim();
  if (a.length < 2 || b.length < 2 || a.toLowerCase() === b.toLowerCase()) {
    return false;
  }
  return true;
}

function coerceCategory(
  raw: unknown,
  fallback: CuratedCategoryId
): CuratedCategoryId {
  if (typeof raw === 'string' && VALID_CURATED_SET.has(raw)) {
    return raw as CuratedCategoryId;
  }
  return fallback;
}

export async function checkAiHealth(options?: {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<AiHealthStatus | null> {
  const fetchFn =
    options?.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchFn) {
    return null;
  }

  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId =
    controller !== null
      ? setTimeout(() => controller.abort(), options?.timeoutMs ?? 4000)
      : null;

  try {
    const res = await fetchFn('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const data = (await res.json()) as Partial<AiHealthStatus>;
    if (
      typeof data.ok !== 'boolean' ||
      typeof data.aiConfigured !== 'boolean' ||
      typeof data.model !== 'string'
    ) {
      return null;
    }
    return {
      ok: data.ok,
      aiConfigured: data.aiConfigured,
      model: data.model,
    };
  } catch {
    return null;
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

export function prefetchAiWordBatch(options?: {
  categories?: readonly CuratedCategoryId[];
  count?: number;
  force?: boolean;
  storage?: SafeStorage;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}): Promise<number> {
  const nowFn = options?.now ?? Date.now;
  const storage = options?.storage ?? safeStorage;
  const fetchFn =
    options?.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : null);

  if (!fetchFn) {
    return Promise.resolve(0);
  }

  if (aiState.inFlight) {
    return aiState.inFlight;
  }

  if (!options?.force && nowFn() < aiState.cooldownUntil) {
    return Promise.resolve(0);
  }

  if (!options?.force && aiState.queue.length >= AI_BATCH_SIZE) {
    return Promise.resolve(0);
  }

  const targetCategories =
    options?.categories && options.categories.length > 0
      ? [...options.categories]
      : [...ALL_CURATED_CATEGORY_IDS];

  const fallbackCat: CuratedCategoryId = targetCategories[0] ?? 'food_snacks';

  const usedKeys = loadUsedWordKeys(storage);
  const queuedKeys = aiState.queue.map((entry) =>
    normalizeWordPairKey(entry.wordA, entry.wordB)
  );
  const excludeKeys = Array.from(new Set([...usedKeys, ...queuedKeys])).slice(
    -150
  );

  const count = Math.min(20, Math.max(1, options?.count ?? AI_BATCH_SIZE));

  const runFetch = async (): Promise<number> => {
    if (aiState.aiAvailable !== true) {
      const health = await checkAiHealth({
        fetchImpl: fetchFn,
        timeoutMs: Math.min(4000, options?.timeoutMs ?? AI_FETCH_TIMEOUT_MS),
      });
      if (!health || !health.ok || !health.aiConfigured) {
        aiState.aiAvailable = false;
        aiState.cooldownUntil = nowFn() + AI_FAILURE_COOLDOWN_MS;
        aiState.inFlight = null;
        return 0;
      }
      aiState.aiAvailable = true;
    }

    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId =
      controller !== null
        ? setTimeout(
            () => controller.abort(),
            options?.timeoutMs ?? AI_FETCH_TIMEOUT_MS
          )
        : null;

    try {
      const response = await fetchFn('/api/words/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          categories: targetCategories,
          excludeKeys,
          count,
        }),
        signal: controller?.signal,
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 503) {
          aiState.aiAvailable = false;
        }
        aiState.cooldownUntil = nowFn() + AI_FAILURE_COOLDOWN_MS;
        return 0;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        aiState.cooldownUntil = nowFn() + AI_FAILURE_COOLDOWN_MS;
        return 0;
      }

      const payload = (await response.json()) as { pairs?: unknown };
      if (!payload || !Array.isArray(payload.pairs)) {
        aiState.cooldownUntil = nowFn() + AI_FAILURE_COOLDOWN_MS;
        return 0;
      }

      const existingKeys = new Set<string>([
        ...loadUsedWordKeys(storage),
        ...aiState.queue.map((e) => normalizeWordPairKey(e.wordA, e.wordB)),
      ]);

      let added = 0;
      for (const rawItem of payload.pairs) {
        if (!isValidApiPair(rawItem)) {
          continue;
        }
        const wordA = rawItem.wordA.trim();
        const wordB = rawItem.wordB.trim();
        const key = normalizeWordPairKey(wordA, wordB);
        if (existingKeys.has(key)) {
          continue;
        }
        existingKeys.add(key);
        aiState.queue.push({
          category: coerceCategory(
            (rawItem as { category?: unknown }).category,
            fallbackCat
          ),
          wordA,
          wordB,
        });
        added += 1;
      }

      aiState.cooldownUntil =
        added === 0 ? nowFn() + AI_FAILURE_COOLDOWN_MS : 0;

      return added;
    } catch {
      aiState.cooldownUntil = nowFn() + AI_FAILURE_COOLDOWN_MS;
      return 0;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      aiState.inFlight = null;
    }
  };

  aiState.inFlight = runFetch();
  return aiState.inFlight;
}

/**
 * Picks the next unused word pair synchronously (zero wait).
 * Consumes a prefetched AI pair when useAiWords is enabled and queued,
 * otherwise serves from the 1,000-pair curated pan-Indian library.
 */
export function getNextWordPair(
  selectedCategories: readonly CuratedCategoryId[],
  options?: {
    useAiWords?: boolean;
    rng?: RandomFn;
    storage?: SafeStorage;
    pool?: readonly CuratedWordEntry[];
    skipBackgroundPrefetch?: boolean;
  }
): WordPair {
  const rng = options?.rng ?? Math.random;
  const storage = options?.storage ?? safeStorage;
  const pool = options?.pool ?? CURATED_WORD_POOL;

  const activeCategoryList: CuratedCategoryId[] =
    selectedCategories.length > 0
      ? selectedCategories.filter((c) => VALID_CURATED_SET.has(c))
      : [...ALL_CURATED_CATEGORY_IDS];

  const activeCategories = new Set<CuratedCategoryId>(
    activeCategoryList.length > 0
      ? activeCategoryList
      : ALL_CURATED_CATEGORY_IDS
  );

  let usedKeys = loadUsedWordKeys(storage);
  let usedSet = new Set(usedKeys);

  // Fast path: consume matching prefetched AI pair when AI generator is enabled
  if (options?.useAiWords) {
    let aiEntry: CuratedWordEntry | null = null;
    const remainingQueue: CuratedWordEntry[] = [];

    for (const candidate of aiState.queue) {
      if (aiEntry) {
        remainingQueue.push(candidate);
        continue;
      }
      const key = normalizeWordPairKey(candidate.wordA, candidate.wordB);
      if (usedSet.has(key)) {
        continue;
      }
      if (activeCategories.has(candidate.category)) {
        aiEntry = candidate;
      } else {
        remainingQueue.push(candidate);
      }
    }
    aiState.queue = remainingQueue;

    if (
      !options?.skipBackgroundPrefetch &&
      aiState.queue.length <= AI_LOW_WATER_MARK
    ) {
      void prefetchAiWordBatch({
        categories: Array.from(activeCategories),
        storage,
      });
    }

    if (aiEntry) {
      const wordPair = createRandomizedWordPair(aiEntry, 'ai', rng);
      if (!usedSet.has(wordPair.id)) {
        usedKeys = [...usedKeys, wordPair.id];
      }
      saveUsedWordKeys(usedKeys, storage);
      return wordPair;
    }
  }

  // Curated 1,000-pair offline pool
  const activeEntries = pool.filter((entry) =>
    activeCategories.has(entry.category)
  );

  let candidates = activeEntries.filter(
    (entry) => !usedSet.has(normalizeWordPairKey(entry.wordA, entry.wordB))
  );

  // Recycle ONLY the active categories when exhausted
  if (candidates.length === 0) {
    const activeKeySet = new Set(
      activeEntries.map((entry) =>
        normalizeWordPairKey(entry.wordA, entry.wordB)
      )
    );
    usedKeys = usedKeys.filter((key) => !activeKeySet.has(key));
    usedSet = new Set(usedKeys);
    candidates = activeEntries;
  }

  const pickIndex = Math.floor(rng() * candidates.length);
  const chosenEntry = candidates[pickIndex];
  const wordPair = createRandomizedWordPair(chosenEntry, 'curated', rng);

  if (!usedSet.has(wordPair.id)) {
    usedKeys = [...usedKeys, wordPair.id];
  }
  saveUsedWordKeys(usedKeys, storage);

  return wordPair;
}
