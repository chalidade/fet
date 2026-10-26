export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Batalkan panggilan yang sedang menunggu. */
  cancel(): void;
  /** Jalankan panggilan yang sedang menunggu sekarang juga. */
  flush(): void;
}

/**
 * Tunda eksekusi `fn` sampai `wait` ms berlalu tanpa panggilan baru.
 * Cocok untuk input pencarian, resize, dan autosave.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: A | undefined;

  const run = () => {
    timer = undefined;
    if (pendingArgs) {
      const args = pendingArgs;
      pendingArgs = undefined;
      fn(...args);
    }
  };

  const debounced = ((...args: A) => {
    pendingArgs = args;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(run, wait);
  }) as Debounced<A>;

  debounced.cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    pendingArgs = undefined;
  };

  debounced.flush = () => {
    if (timer !== undefined) clearTimeout(timer);
    run();
  };

  return debounced;
}
