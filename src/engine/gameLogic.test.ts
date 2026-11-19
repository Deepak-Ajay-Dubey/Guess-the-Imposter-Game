import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ALL_CURATED_CATEGORY_IDS,
  CURATED_CATEGORIES,
  CURATED_WORD_POOL,
} from '../data/curatedWords';
import {
  DEFAULT_GAME_CONFIG,
  assignRolesToPlayers,
  getActiveRoleCounts,
  normalizeGameConfig,
  pickStartingPlayerIndex,
  resolvePlayerNames,
} from './gameLogic';
import { createSafeStorage } from './storage';
import { getNextWordPair, normalizeWordPairKey } from './wordService';

describe('1,000 Curated Pan-Indian Word Pair Library', () => {
  it('contains exactly 1,000 word pairs across 10 categories (100 each)', () => {
    assert.equal(CURATED_CATEGORIES.length, 10);
    assert.equal(CURATED_WORD_POOL.length, 1000);

    for (const categoryId of ALL_CURATED_CATEGORY_IDS) {
      const count = CURATED_WORD_POOL.filter(
        (entry) => entry.category === categoryId
      ).length;
      assert.equal(
        count,
        100,
        `Expected 100 pairs in category ${categoryId}, got ${count}`
      );
    }
  });

  it('has zero duplicate pairs and zero identical wordA/wordB entries', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const entry of CURATED_WORD_POOL) {
      assert.notEqual(
        entry.wordA.trim().toLowerCase(),
        entry.wordB.trim().toLowerCase(),
        `Identical words in pair: ${entry.wordA} / ${entry.wordB}`
      );
      const key = normalizeWordPairKey(entry.wordA, entry.wordB);
      if (seen.has(key)) {
        duplicates.push(`${key} (${seen.get(key)} & ${entry.category})`);
      } else {
        seen.set(key, entry.category);
      }
    }

    assert.deepEqual(duplicates, [], `Found duplicate pairs: ${duplicates.join(', ')}`);
  });
});

describe('Streamlined Game Logic (Classic, Twisted, Mixed)', () => {
  it('normalizes Mixed mode to at least 4 players with both Mr. White and Undercover', () => {
    const normalized = normalizeGameConfig({
      ...DEFAULT_GAME_CONFIG,
      mode: 'mixed',
      playerCount: 3,
      mrWhiteCount: 1,
      undercoverCount: 1,
    });
    assert.equal(normalized.playerCount, 4);
    const counts = getActiveRoleCounts(normalized);
    assert.deepEqual(counts, { civilians: 2, undercovers: 1, mrWhites: 1 });
  });

  it('assigns roles accurately for Classic, Twisted, and Mixed modes', () => {
    const storage = createSafeStorage(null);
    const pair = getNextWordPair(['food_snacks'], { storage });

    const classicPlayers = assignRolesToPlayers(
      { ...DEFAULT_GAME_CONFIG, mode: 'classic', playerCount: 5, mrWhiteCount: 1 },
      pair
    );
    assert.equal(classicPlayers.filter((p) => p.role === 'MR_WHITE').length, 1);
    assert.equal(classicPlayers.filter((p) => p.role === 'UNDERCOVER').length, 0);
    assert.equal(classicPlayers.filter((p) => p.role === 'CIVILIAN').length, 4);

    const twistedPlayers = assignRolesToPlayers(
      { ...DEFAULT_GAME_CONFIG, mode: 'twisted', playerCount: 5, undercoverCount: 2 },
      pair
    );
    assert.equal(twistedPlayers.filter((p) => p.role === 'UNDERCOVER').length, 2);
    assert.equal(twistedPlayers.filter((p) => p.role === 'MR_WHITE').length, 0);

    const mixedPlayers = assignRolesToPlayers(
      {
        ...DEFAULT_GAME_CONFIG,
        mode: 'mixed',
        playerCount: 6,
        undercoverCount: 1,
        mrWhiteCount: 1,
      },
      pair
    );
    assert.equal(mixedPlayers.filter((p) => p.role === 'UNDERCOVER').length, 1);
    assert.equal(mixedPlayers.filter((p) => p.role === 'MR_WHITE').length, 1);
    assert.equal(mixedPlayers.filter((p) => p.role === 'CIVILIAN').length, 4);
  });

  it('supports optional custom player names with automatic Player N fallback', () => {
    const resolved = resolvePlayerNames(4, ['Aarav', '  ', 'Diya']);
    assert.deepEqual(resolved, ['Aarav', 'Player 2', 'Diya', 'Player 4']);
  });

  it('avoids picking Mr. White as the first speaker when non-Mr. White players exist', () => {
    const storage = createSafeStorage(null);
    const pair = getNextWordPair(['food_snacks'], { storage });
    const players = assignRolesToPlayers(
      { ...DEFAULT_GAME_CONFIG, mode: 'classic', playerCount: 4, mrWhiteCount: 1 },
      pair
    );
    for (let i = 0; i < 25; i += 1) {
      const idx = pickStartingPlayerIndex(players);
      assert.notEqual(players[idx].role, 'MR_WHITE');
    }
  });
});
