import { useCallback, useMemo, useSyncExternalStore } from "react";

export interface LocalStorageOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

// Event "storage" hanya terkirim ke tab lain; tab yang sama diberi tahu lewat event ini.
const LOCAL_EVENT = "fet:local-storage";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage diblokir (mode privat, iframe sandbox, dll.)
  }
}

/**
 * State yang tersimpan di `localStorage` dan tersinkron antar komponen dan antar tab.
 * Mengembalikan `[value, setValue, remove]`. Di server nilainya selalu `initialValue`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions<T> = {},
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? (JSON.parse as (raw: string) => T);

  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (e: Event) => {
        const changed = e instanceof StorageEvent ? e.key : (e as CustomEvent<string>).detail;
        if (changed === null || changed === key) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(LOCAL_EVENT, onStorage);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(LOCAL_EVENT, onStorage);
      };
    },
    [key],
  );

  // Snapshot berupa string mentah supaya stabil antar render (perbandingan Object.is).
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

  const value = useMemo(() => {
    if (raw === null) return initialValue;
    try {
      return deserialize(raw);
    } catch {
      return initialValue;
    }
    // initialValue dan deserialize sengaja tidak jadi dependency: hanya raw yang menentukan nilai.
  }, [raw]);

  const write = useCallback(
    (nextRaw: string | null) => {
      try {
        if (nextRaw === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, nextRaw);
      } catch {
        // Storage penuh atau diblokir: nilai tidak tersimpan.
      }
      window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: key }));
    },
    [key],
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = read(key);
      let prev = initialValue;
      if (current !== null) {
        try {
          prev = deserialize(current);
        } catch {
          // pakai initialValue
        }
      }
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      write(serialize(resolved));
    },
    [key, write],
  );

  const remove = useCallback(() => write(null), [write]);

  return [value, setValue, remove];
}
