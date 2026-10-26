import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` selama media query cocok, misalnya `useMediaQuery("(max-width: 640px)")`.
 * Di server (dan saat hydration) hook mengembalikan `serverValue`, default `false`.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
