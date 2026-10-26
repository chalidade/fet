import { useEffect, useMemo, useRef } from "react";
import { useLatest } from "./useLatest";

export interface ThrottledCallback<A extends unknown[]> {
  (...args: A): void;
  /** Batalkan panggilan susulan (trailing) yang sedang menunggu. */
  cancel(): void;
}

/**
 * Jalankan `fn` paling banyak sekali per `interval` ms: panggilan pertama langsung jalan,
 * panggilan berikutnya di jendela yang sama digabung menjadi satu panggilan di akhir jendela
 * dengan argumen terbaru. Identitas fungsi stabil dan timer dibersihkan saat unmount.
 */
export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  interval: number,
): ThrottledCallback<A> {
  const latest = useLatest(fn);
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<A | undefined>(undefined);

  const throttled = useMemo(() => {
    const fire = (args: A) => {
      last.current = Date.now();
      latest.current(...args);
    };
    const call = ((...args: A) => {
      const wait = interval - (Date.now() - last.current);
      if (wait <= 0 && timer.current === undefined) {
        fire(args);
        return;
      }
      pending.current = args;
      if (timer.current === undefined) {
        timer.current = setTimeout(() => {
          timer.current = undefined;
          const next = pending.current;
          pending.current = undefined;
          if (next) fire(next);
        }, Math.max(wait, 0));
      }
    }) as ThrottledCallback<A>;
    call.cancel = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      pending.current = undefined;
    };
    return call;
  }, [interval, latest]);

  useEffect(() => throttled.cancel, [throttled]);
  return throttled;
}
