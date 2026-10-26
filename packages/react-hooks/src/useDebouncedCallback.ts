import { useEffect, useMemo, useRef } from "react";
import { useLatest } from "./useLatest";

export interface DebouncedCallback<A extends unknown[]> {
  (...args: A): void;
  /** Batalkan panggilan yang sedang menunggu. */
  cancel(): void;
  /** Jalankan panggilan yang sedang menunggu sekarang juga. */
  flush(): void;
}

/**
 * Versi debounce yang stabil antar render: identitas fungsinya tetap, tapi selalu
 * memanggil `fn` terbaru. Panggilan yang menunggu dibatalkan saat komponen unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedCallback<A> {
  const latest = useLatest(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<A | undefined>(undefined);

  const debounced = useMemo(() => {
    const run = () => {
      timer.current = undefined;
      const args = pending.current;
      pending.current = undefined;
      if (args) latest.current(...args);
    };
    const call = ((...args: A) => {
      pending.current = args;
      clearTimeout(timer.current);
      timer.current = setTimeout(run, delay);
    }) as DebouncedCallback<A>;
    call.cancel = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      pending.current = undefined;
    };
    call.flush = () => {
      clearTimeout(timer.current);
      run();
    };
    return call;
  }, [delay, latest]);

  useEffect(() => debounced.cancel, [debounced]);
  return debounced;
}
