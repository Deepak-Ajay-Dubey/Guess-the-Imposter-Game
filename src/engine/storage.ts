export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SafeStorage {
  getRaw(key: string): string | null;
  setRaw(key: string, value: string): void;
  remove(key: string): void;
  getJSON<T>(key: string, fallback: T): T;
  setJSON<T>(key: string, value: T): void;
  isUsingFallback(): boolean;
  clearMemoryFallback(): void;
}

function resolveBrowserLocalStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const probeKey = '__word_spy_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Creates a try/catch-hardened storage wrapper that degrades gracefully to an
 * in-memory Map if localStorage is unavailable, blocked, full, or throws.
 */
export function createSafeStorage(
  backend?: KeyValueStorage | null
): SafeStorage {
  const memoryFallback = new Map<string, string>();
  let fallbackActive = backend === null;

  const getBackend = (): KeyValueStorage | null => {
    if (backend !== undefined) {
      return backend;
    }
    return resolveBrowserLocalStorage();
  };

  const getRaw = (key: string): string | null => {
    const store = getBackend();
    if (store) {
      try {
        const value = store.getItem(key);
        if (value !== null) {
          return value;
        }
      } catch {
        fallbackActive = true;
      }
    } else {
      fallbackActive = true;
    }

    return memoryFallback.has(key) ? (memoryFallback.get(key) ?? null) : null;
  };

  const setRaw = (key: string, value: string): void => {
    const store = getBackend();
    if (store) {
      try {
        store.setItem(key, value);
        memoryFallback.delete(key);
        return;
      } catch {
        fallbackActive = true;
      }
    } else {
      fallbackActive = true;
    }

    memoryFallback.set(key, value);
  };

  const remove = (key: string): void => {
    memoryFallback.delete(key);
    const store = getBackend();
    if (store) {
      try {
        store.removeItem(key);
      } catch {
        fallbackActive = true;
      }
    }
  };

  const getJSON = <T>(key: string, fallback: T): T => {
    const raw = getRaw(key);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const setJSON = <T>(key: string, value: T): void => {
    try {
      setRaw(key, JSON.stringify(value));
    } catch {
      fallbackActive = true;
    }
  };

  return {
    getRaw,
    setRaw,
    remove,
    getJSON,
    setJSON,
    isUsingFallback: () => fallbackActive,
    clearMemoryFallback: () => {
      memoryFallback.clear();
    },
  };
}

export const safeStorage: SafeStorage = createSafeStorage();
