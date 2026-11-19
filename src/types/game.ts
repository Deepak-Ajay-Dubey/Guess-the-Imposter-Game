export type Role = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE';

export type GameMode = 'classic' | 'twisted' | 'mixed';

export type GamePhase = 'SETUP' | 'REVEAL' | 'DISCUSS' | 'RESULT';

export type CuratedCategoryId =
  | 'food_snacks'
  | 'indian_culture'
  | 'home_life'
  | 'apps_tech'
  | 'places_travel'
  | 'sports_games'
  | 'movies_music'
  | 'school_office'
  | 'nature_animals'
  | 'clothes_shopping';

export interface GameConfig {
  mode: GameMode;
  playerCount: number;
  customNames: string[];
  mrWhiteCount: number;
  undercoverCount: number;
  hintForOddOne: boolean;
  selectedCategories: CuratedCategoryId[];
  useAiWords: boolean;
  timerEnabled: boolean;
  timerMinutes: number;
}

export interface Player {
  id: string;
  index: number;
  name: string;
  role: Role;
  word: string; // Empty string "" for MR_WHITE
}

export interface WordPair {
  id: string; // Normalized alphabetical key e.g. "coffee|tea"
  category: CuratedCategoryId;
  categoryLabel: string;
  civilianWord: string;
  undercoverWord: string;
  source: 'curated' | 'ai';
}
