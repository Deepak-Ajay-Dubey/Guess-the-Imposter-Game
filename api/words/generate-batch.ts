import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  DEFAULT_GEMINI_MODEL,
  type ApiRequest,
  type ApiResponse,
} from '../health.ts';

export const VALID_CURATED_CATEGORIES = [
  'food_snacks',
  'indian_culture',
  'home_life',
  'apps_tech',
  'places_travel',
  'sports_games',
  'movies_music',
  'school_office',
  'nature_animals',
  'clothes_shopping',
] as const;

export type ValidCuratedCategory = (typeof VALID_CURATED_CATEGORIES)[number];

const VALID_CATEGORY_SET = new Set<string>(VALID_CURATED_CATEGORIES);

const CATEGORY_LABELS: Record<ValidCuratedCategory, string> = {
  food_snacks: 'Food & Snacks (everyday Indian snacks, drinks, sweets, fruits, dishes)',
  indian_culture: 'Culture & Festivals (festivals, weddings, landmarks, desi traditions)',
  home_life: 'Home & Daily Life (household items, kitchen tools, rooms, routines)',
  apps_tech: 'Apps & Tech (smartphones, UPI, everyday apps, gadgets, internet)',
  places_travel: 'Places & Travel (Indian cities, transport, trips, stations, spots)',
  sports_games: 'Sports & Games (cricket, board games, indoor games, outdoor sports)',
  movies_music: 'Movies, Music & TV (Bollywood, streaming, songs, shows, entertainment)',
  school_office: 'School, College & Office (hostel life, exams, jobs, meetings, stationery)',
  nature_animals: 'Nature & Animals (animals, birds, flowers, seasons, weather)',
  clothes_shopping: 'Clothes & Shopping (Indian and western wear, accessories, shopping)',
};

export const DEFAULT_BATCH_COUNT = 15;
export const MAX_BATCH_COUNT = 20;
const MAX_EXCLUDE_KEYS = 200;

export interface RawGeneratedPair {
  category: ValidCuratedCategory;
  wordA: string;
  wordB: string;
}

export interface ParsedBatchRequest {
  categories: ValidCuratedCategory[];
  excludeKeys: string[];
  count: number;
}

export type BatchGeneratorFn = (
  request: ParsedBatchRequest,
  config: { apiKey: string; model: string }
) => Promise<unknown>;

export function normalizePairKey(wordA: string, wordB: string): string {
  return [wordA.trim().toLowerCase(), wordB.trim().toLowerCase()]
    .sort()
    .join('|');
}

export function parseAndValidateRequestBody(
  rawBody: unknown
): { ok: true; data: ParsedBatchRequest } | { ok: false; error: string } {
  let body: unknown = rawBody;

  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim();
    if (trimmed.length === 0) {
      body = {};
    } else {
      try {
        body = JSON.parse(trimmed);
      } catch {
        return { ok: false, error: 'Request body must be valid JSON.' };
      }
    }
  } else if (rawBody === undefined || rawBody === null) {
    body = {};
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;

  let categories: ValidCuratedCategory[] = [...VALID_CURATED_CATEGORIES];
  if (record.categories !== undefined) {
    if (!Array.isArray(record.categories)) {
      return { ok: false, error: 'categories must be an array of strings.' };
    }
    const rawCats = record.categories.filter(
      (item): item is string => typeof item === 'string'
    );
    const valid = Array.from(
      new Set(
        rawCats.filter((c): c is ValidCuratedCategory =>
          VALID_CATEGORY_SET.has(c)
        )
      )
    );
    if (valid.length > 0) {
      categories = valid;
    }
  }

  let excludeKeys: string[] = [];
  if (record.excludeKeys !== undefined) {
    if (!Array.isArray(record.excludeKeys)) {
      return { ok: false, error: 'excludeKeys must be an array of strings.' };
    }
    const seen = new Set<string>();
    for (const item of record.excludeKeys) {
      if (typeof item === 'string' && item.includes('|')) {
        const normalized = item.trim().toLowerCase();
        if (normalized.length > 0 && !seen.has(normalized)) {
          seen.add(normalized);
          excludeKeys.push(normalized);
          if (excludeKeys.length >= MAX_EXCLUDE_KEYS) {
            break;
          }
        }
      }
    }
  }

  let count = DEFAULT_BATCH_COUNT;
  if (record.count !== undefined) {
    if (
      typeof record.count !== 'number' ||
      !Number.isInteger(record.count) ||
      record.count < 1 ||
      record.count > MAX_BATCH_COUNT
    ) {
      return {
        ok: false,
        error: `count must be an integer between 1 and ${MAX_BATCH_COUNT}.`,
      };
    }
    count = record.count;
  }

  return {
    ok: true,
    data: { categories, excludeKeys, count },
  };
}

export function sanitizeGeneratedPairs(
  rawInput: unknown,
  allowedCategories: readonly ValidCuratedCategory[],
  excludeKeys: readonly string[],
  limit: number
): RawGeneratedPair[] {
  const candidates = Array.isArray(rawInput)
    ? rawInput
    : rawInput &&
        typeof rawInput === 'object' &&
        Array.isArray((rawInput as Record<string, unknown>).pairs)
      ? ((rawInput as Record<string, unknown>).pairs as unknown[])
      : [];

  const allowedSet = new Set<string>(allowedCategories);
  const fallbackCategory: ValidCuratedCategory =
    allowedCategories[0] ?? 'food_snacks';
  const excludedSet = new Set(excludeKeys.map((k) => k.trim().toLowerCase()));
  const seenKeys = new Set<string>();
  const cleaned: RawGeneratedPair[] = [];

  for (const item of candidates) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const obj = item as Record<string, unknown>;
    if (typeof obj.wordA !== 'string' || typeof obj.wordB !== 'string') {
      continue;
    }

    const wordA = obj.wordA.trim().replace(/\s+/g, ' ');
    const wordB = obj.wordB.trim().replace(/\s+/g, ' ');

    if (
      wordA.length < 2 ||
      wordB.length < 2 ||
      wordA.length > 40 ||
      wordB.length > 40
    ) {
      continue;
    }

    if (wordA.toLowerCase() === wordB.toLowerCase()) {
      continue;
    }

    const key = normalizePairKey(wordA, wordB);
    if (excludedSet.has(key) || seenKeys.has(key)) {
      continue;
    }

    const rawCat = typeof obj.category === 'string' ? obj.category.trim() : '';
    const category: ValidCuratedCategory = allowedSet.has(rawCat)
      ? (rawCat as ValidCuratedCategory)
      : VALID_CATEGORY_SET.has(rawCat)
        ? (rawCat as ValidCuratedCategory)
        : fallbackCategory;

    seenKeys.add(key);
    cleaned.push({ category, wordA, wordB });

    if (cleaned.length >= limit) {
      break;
    }
  }

  return cleaned;
}

const SYSTEM_INSTRUCTION = `You generate secret word pairs for Word Spy, a pass-and-play party word game played in person by friends, college students, families, and office teams across India.

STRICT "NO-GOOGLE TEST" VOCABULARY RULES:
1. Every word MUST be simple to medium-level everyday English or widely known pan-Indian vocabulary that anyone across India immediately understands without searching on Google.
2. Good examples: Biryani / Pulao, Auto Rickshaw / Taxi, WhatsApp / Telegram, Diwali / Holi, Cricket / Badminton, Samosa / Kachori, Chai / Filter Coffee, Hostel / PG, Kurta / Sherwani.
3. FORBIDDEN: obscure regional foods or rituals, rare academic/medical/legal jargon, rare animals or plants, exact synonyms (e.g., Sofa / Couch), direct opposites (e.g., Hot / Cold), or phrases longer than 3 words.
4. Both words in a pair must share clear everyday traits so players can give clever spoken clues without immediately revealing the difference.
5. Spread pairs across the requested categories and NEVER include any pair listed in the exclusion list.`;

async function callGeminiBatchGenerator(
  request: ParsedBatchRequest,
  config: { apiKey: string; model: string }
): Promise<unknown> {
  const ai = new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const categoryDescriptions = request.categories
    .map((id) => `- "${id}": ${CATEGORY_LABELS[id]}`)
    .join('\n');

  const excludeSection =
    request.excludeKeys.length > 0
      ? `\nDo NOT generate any of these already-used pairs (either order):\n${request.excludeKeys.slice(0, 120).join(', ')}`
      : '';

  const prompt = `Generate ${request.count} fresh, distinct everyday pan-Indian word pairs for Word Spy.
Use ONLY these category IDs:
${categoryDescriptions}
${excludeSection}

Return JSON with a "pairs" array of ${request.count} objects, each containing "category", "wordA", and "wordB".`;

  const supportsThinkingLevel =
    config.model.startsWith('gemini-4-') || config.model.startsWith('gemini-3');

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      ...(supportsThinkingLevel
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : {}),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description:
                    'One of the requested category IDs (e.g., food_snacks, indian_culture).',
                },
                wordA: {
                  type: Type.STRING,
                  description:
                    'First everyday pan-Indian word (1-3 words, Title Case).',
                },
                wordB: {
                  type: Type.STRING,
                  description:
                    'Closely related everyday pan-Indian word (1-3 words, Title Case).',
                },
              },
              required: ['category', 'wordA', 'wordB'],
            },
          },
        },
        required: ['pairs'],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    return { pairs: [] };
  }

  const cleanedJson = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleanedJson) as unknown;
}

function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const e = err as Record<string, unknown>;
  if (e.status === 429 || e.code === 429) {
    return true;
  }
  const msg = typeof e.message === 'string' ? e.message.toUpperCase() : '';
  return msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
}

export function createGenerateBatchHandler(deps?: {
  env?: Readonly<Record<string, string | undefined>>;
  generator?: BatchGeneratorFn;
}) {
  return async function generateBatchHandler(
    req: ApiRequest,
    res: ApiResponse
  ): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    const parsed = parseAndValidateRequestBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const env = deps?.env ?? process.env;
    const apiKey = env.GEMINI_API_KEY?.trim() ?? '';
    if (!apiKey) {
      res.status(503).json({
        error: 'AI word generator is not configured on this server.',
      });
      return;
    }

    const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    const generator = deps?.generator ?? callGeminiBatchGenerator;

    try {
      const rawOutput = await generator(parsed.data, { apiKey, model });
      const pairs = sanitizeGeneratedPairs(
        rawOutput,
        parsed.data.categories,
        parsed.data.excludeKeys,
        parsed.data.count
      );

      if (pairs.length === 0) {
        res.status(503).json({
          error: 'AI word generator returned no usable pairs.',
        });
        return;
      }

      res.status(200).json({ pairs });
    } catch (err) {
      const errObj =
        err && typeof err === 'object'
          ? (err as { status?: unknown; code?: unknown; message?: unknown })
          : {};
      const numericStatus =
        typeof errObj.status === 'number'
          ? errObj.status
          : typeof errObj.code === 'number'
            ? errObj.code
            : undefined;
      const safeMsg =
        typeof errObj.message === 'string'
          ? errObj.message.replace(apiKey, '[REDACTED]').slice(0, 300)
          : String(err);
      console.error(
        `[api/words/generate-batch] upstream error (model=${model}, status=${String(numericStatus ?? 'unknown')}): ${safeMsg}`
      );

      if (isRateLimitError(err)) {
        res.status(429).json({
          error: 'AI quota temporarily exhausted. Using curated deck instead.',
          code: 'RESOURCE_EXHAUSTED',
        });
        return;
      }

      const upperMsg = safeMsg.toUpperCase();
      const errorCode =
        numericStatus === 404 || upperMsg.includes('NOT_FOUND')
          ? 'MODEL_NOT_FOUND'
          : numericStatus === 403 ||
              upperMsg.includes('PERMISSION_DENIED') ||
              upperMsg.includes('API_KEY_INVALID')
            ? 'AUTH_ERROR'
            : numericStatus === 400 || upperMsg.includes('INVALID_ARGUMENT')
              ? 'INVALID_REQUEST'
              : err instanceof SyntaxError
                ? 'PARSE_ERROR'
                : 'UPSTREAM_ERROR';

      res.status(503).json({
        error: 'AI word generator temporarily unavailable.',
        code: errorCode,
      });
    }
  };
}

export default createGenerateBatchHandler();
