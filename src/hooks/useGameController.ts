import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALL_CURATED_CATEGORY_IDS } from '../data/curatedWords';
import {
  DEFAULT_GAME_CONFIG,
  MAX_PLAYERS,
  MAX_TIMER_MINUTES,
  MIN_MIXED_PLAYERS,
  MIN_PLAYERS,
  MIN_TIMER_MINUTES,
  assignRolesToPlayers,
  getActiveRoleCounts,
  getMaxTotalOddOnes,
  normalizeGameConfig,
  pickStartingPlayerIndex,
} from '../engine/gameLogic';
import { safeStorage } from '../engine/storage';
import { getNextWordPair, prefetchAiWordBatch } from '../engine/wordService';
import type {
  CuratedCategoryId,
  GameConfig,
  GameMode,
  GamePhase,
  Player,
  WordPair,
} from '../types/game';

const CONFIG_STORAGE_KEY = 'word_spy_config_v3';

interface ControllerState {
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  wordPair: WordPair | null;
  currentCardIndex: number;
  startingPlayerIndex: number;
  roundId: number;
}

function loadSavedConfig(): GameConfig {
  const saved = safeStorage.getJSON<Partial<GameConfig> | null>(
    CONFIG_STORAGE_KEY,
    null
  );
  if (!saved || typeof saved !== 'object') {
    return DEFAULT_GAME_CONFIG;
  }
  return normalizeGameConfig({
    ...DEFAULT_GAME_CONFIG,
    ...saved,
  });
}

function persistConfig(config: GameConfig): void {
  safeStorage.setJSON(CONFIG_STORAGE_KEY, config);
}

export function useGameController() {
  const [state, setState] = useState<ControllerState>(() => ({
    phase: 'SETUP',
    config: loadSavedConfig(),
    players: [],
    wordPair: null,
    currentCardIndex: 0,
    startingPlayerIndex: 0,
    roundId: 0,
  }));

  // Warm up optional AI word queue silently whenever AI mode is toggled on
  useEffect(() => {
    if (!state.config.useAiWords) {
      return;
    }
    void prefetchAiWordBatch({
      categories: state.config.selectedCategories,
    });
  }, [state.config.useAiWords, state.config.selectedCategories]);

  const updateConfig = useCallback(
    (updater: (prev: GameConfig) => GameConfig) => {
      setState((prev) => {
        const nextConfig = normalizeGameConfig(updater(prev.config));
        persistConfig(nextConfig);
        return {
          ...prev,
          config: nextConfig,
        };
      });
    },
    []
  );

  const setMode = useCallback(
    (mode: GameMode) => {
      updateConfig((prev) => ({
        ...prev,
        mode,
        playerCount:
          mode === 'mixed'
            ? Math.max(MIN_MIXED_PLAYERS, prev.playerCount)
            : prev.playerCount,
      }));
    },
    [updateConfig]
  );

  const adjustPlayerCount = useCallback(
    (delta: number) => {
      updateConfig((prev) => {
        const min = prev.mode === 'mixed' ? MIN_MIXED_PLAYERS : MIN_PLAYERS;
        const nextCount = Math.max(
          min,
          Math.min(MAX_PLAYERS, prev.playerCount + delta)
        );
        return { ...prev, playerCount: nextCount };
      });
    },
    [updateConfig]
  );

  const adjustMrWhiteCount = useCallback(
    (delta: number) => {
      updateConfig((prev) => {
        const maxOdd = getMaxTotalOddOnes(prev.playerCount, prev.mode);
        const maxForMrWhite =
          prev.mode === 'mixed'
            ? Math.max(1, maxOdd - prev.undercoverCount)
            : maxOdd;
        const next = Math.max(
          1,
          Math.min(maxForMrWhite, prev.mrWhiteCount + delta)
        );
        return { ...prev, mrWhiteCount: next };
      });
    },
    [updateConfig]
  );

  const adjustUndercoverCount = useCallback(
    (delta: number) => {
      updateConfig((prev) => {
        const maxOdd = getMaxTotalOddOnes(prev.playerCount, prev.mode);
        const maxForUndercover =
          prev.mode === 'mixed'
            ? Math.max(1, maxOdd - prev.mrWhiteCount)
            : maxOdd;
        const next = Math.max(
          1,
          Math.min(maxForUndercover, prev.undercoverCount + delta)
        );
        return { ...prev, undercoverCount: next };
      });
    },
    [updateConfig]
  );

  const setCustomName = useCallback(
    (index: number, value: string) => {
      updateConfig((prev) => {
        const nextNames = [...prev.customNames];
        while (nextNames.length <= index) {
          nextNames.push('');
        }
        nextNames[index] = value.slice(0, 24);
        return { ...prev, customNames: nextNames };
      });
    },
    [updateConfig]
  );

  const clearCustomNames = useCallback(() => {
    updateConfig((prev) => ({ ...prev, customNames: [] }));
  }, [updateConfig]);

  const toggleHintForOddOne = useCallback(() => {
    updateConfig((prev) => ({
      ...prev,
      hintForOddOne: !prev.hintForOddOne,
    }));
  }, [updateConfig]);

  const toggleCategory = useCallback(
    (categoryId: CuratedCategoryId) => {
      updateConfig((prev) => {
        const exists = prev.selectedCategories.includes(categoryId);
        if (exists) {
          // Always keep at least one category active
          if (prev.selectedCategories.length <= 1) {
            return prev;
          }
          return {
            ...prev,
            selectedCategories: prev.selectedCategories.filter(
              (id) => id !== categoryId
            ),
          };
        }
        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, categoryId],
        };
      });
    },
    [updateConfig]
  );

  const selectAllCategories = useCallback(() => {
    updateConfig((prev) => ({
      ...prev,
      selectedCategories: [...ALL_CURATED_CATEGORY_IDS],
    }));
  }, [updateConfig]);

  const toggleAiWords = useCallback(() => {
    updateConfig((prev) => ({
      ...prev,
      useAiWords: !prev.useAiWords,
    }));
  }, [updateConfig]);

  const toggleTimerEnabled = useCallback(() => {
    updateConfig((prev) => ({
      ...prev,
      timerEnabled: !prev.timerEnabled,
    }));
  }, [updateConfig]);

  const adjustTimerMinutes = useCallback(
    (delta: number) => {
      updateConfig((prev) => ({
        ...prev,
        timerMinutes: Math.max(
          MIN_TIMER_MINUTES,
          Math.min(MAX_TIMER_MINUTES, prev.timerMinutes + delta)
        ),
      }));
    },
    [updateConfig]
  );

  const startRound = useCallback(() => {
    setState((prev) => {
      const normalized = normalizeGameConfig(prev.config);
      const wordPair = getNextWordPair(normalized.selectedCategories, {
        useAiWords: normalized.useAiWords,
      });
      const players = assignRolesToPlayers(normalized, wordPair);
      const startingPlayerIndex = pickStartingPlayerIndex(players);

      return {
        ...prev,
        phase: 'REVEAL',
        config: normalized,
        players,
        wordPair,
        currentCardIndex: 0,
        startingPlayerIndex,
        roundId: prev.roundId + 1,
      };
    });
  }, []);

  const advanceCard = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'REVEAL') {
        return prev;
      }
      const nextIndex = prev.currentCardIndex + 1;
      if (nextIndex < prev.players.length) {
        return {
          ...prev,
          currentCardIndex: nextIndex,
        };
      }
      return {
        ...prev,
        phase: 'DISCUSS',
      };
    });
  }, []);

  const revealOddOnes = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'DISCUSS') {
        return prev;
      }
      return {
        ...prev,
        phase: 'RESULT',
      };
    });
  }, []);

  const backToSetup = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'SETUP',
      players: [],
      wordPair: null,
      currentCardIndex: 0,
    }));
  }, []);

  const roleCounts = useMemo(
    () => getActiveRoleCounts(state.config),
    [state.config]
  );

  const maxTotalOddOnes = useMemo(
    () => getMaxTotalOddOnes(state.config.playerCount, state.config.mode),
    [state.config.playerCount, state.config.mode]
  );

  const currentCardPlayer = state.players[state.currentCardIndex] ?? null;
  const nextCardPlayer = state.players[state.currentCardIndex + 1] ?? null;
  const startingPlayer = state.players[state.startingPlayerIndex] ?? null;

  return {
    state,
    roleCounts,
    maxTotalOddOnes,
    currentCardPlayer,
    nextCardPlayer,
    startingPlayer,
    setMode,
    adjustPlayerCount,
    adjustMrWhiteCount,
    adjustUndercoverCount,
    setCustomName,
    clearCustomNames,
    toggleHintForOddOne,
    toggleCategory,
    selectAllCategories,
    toggleAiWords,
    toggleTimerEnabled,
    adjustTimerMinutes,
    startRound,
    advanceCard,
    revealOddOnes,
    backToSetup,
  };
}
