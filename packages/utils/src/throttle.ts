/**
 * Jalankan `fn` paling banyak sekali setiap `wait` ms (leading + trailing).
 * Cocok untuk scroll, pointermove, dan event berfrekuensi tinggi lainnya.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let last = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let trailingArgs: A | undefined;

  return (...args: A) => {
    const now = Date.now();
    const remaining = wait - (now - last);

    if (remaining <= 0) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      last = now;
      fn(...args);
      return;
    }

    trailingArgs = args;
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        last = Date.now();
        if (trailingArgs) {
          const a = trailingArgs;
          trailingArgs = undefined;
          fn(...a);
        }
      }, remaining);
    }
  };
}
