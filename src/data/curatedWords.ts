import type { CuratedCategoryId } from '../types/game';
import { WORD_PAIRS_PART_1, type CuratedWordEntry } from './wordPairsPart1';
import { WORD_PAIRS_PART_2 } from './wordPairsPart2';

export type { CuratedWordEntry };

export interface CategoryMeta {
  id: CuratedCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export const CURATED_CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'food_snacks',
    label: 'Food & Snacks',
    shortLabel: 'Food',
    description: 'Chai, street food, sweets, fruits & comfort dishes',
  },
  {
    id: 'indian_culture',
    label: 'Culture & Festivals',
    shortLabel: 'Culture',
    description: 'Festivals, weddings, landmarks & desi traditions',
  },
  {
    id: 'home_life',
    label: 'Home & Daily Life',
    shortLabel: 'Home',
    description: 'Kitchen tools, rooms, routines & household items',
  },
  {
    id: 'apps_tech',
    label: 'Apps & Tech',
    shortLabel: 'Tech',
    description: 'Smartphones, UPI, everyday apps & gadgets',
  },
  {
    id: 'places_travel',
    label: 'Places & Travel',
    shortLabel: 'Travel',
    description: 'Indian cities, transport, trips & landmarks',
  },
  {
    id: 'sports_games',
    label: 'Sports & Games',
    shortLabel: 'Sports',
    description: 'Cricket, board games, indoor fun & athletics',
  },
  {
    id: 'movies_music',
    label: 'Movies, Music & TV',
    shortLabel: 'Movies',
    description: 'Cinema, streaming, songs, shows & entertainment',
  },
  {
    id: 'school_office',
    label: 'School, College & Office',
    shortLabel: 'Campus',
    description: 'Hostel life, exams, meetings, jobs & stationery',
  },
  {
    id: 'nature_animals',
    label: 'Nature & Animals',
    shortLabel: 'Nature',
    description: 'Animals, birds, flowers, seasons & weather',
  },
  {
    id: 'clothes_shopping',
    label: 'Clothes & Shopping',
    shortLabel: 'Fashion',
    description: 'Indian & western wear, accessories & shopping',
  },
] as const;

export const ALL_CURATED_CATEGORY_IDS: readonly CuratedCategoryId[] =
  CURATED_CATEGORIES.map((category) => category.id);

export const CATEGORY_META_BY_ID: Readonly<Record<CuratedCategoryId, CategoryMeta>> =
  CURATED_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.id] = category;
      return acc;
    },
    {} as Record<CuratedCategoryId, CategoryMeta>
  );

/**
 * 1,000 everyday pan-Indian word pairs (100 per category across 10 categories).
 * Every pair passes the "No-Google Test": medium-level vocabulary max,
 * universally familiar across India, closely related, and non-synonymous.
 */
export const CURATED_WORD_POOL: readonly CuratedWordEntry[] = [
  ...WORD_PAIRS_PART_1,
  ...WORD_PAIRS_PART_2,
];

export function getCategoryLabel(categoryId: CuratedCategoryId): string {
  return CATEGORY_META_BY_ID[categoryId]?.label ?? 'Everyday';
}

export function getCategoryShortLabel(categoryId: CuratedCategoryId): string {
  return CATEGORY_META_BY_ID[categoryId]?.shortLabel ?? 'All';
}
