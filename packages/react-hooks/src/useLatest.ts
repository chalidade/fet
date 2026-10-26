import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/**
 * Ref yang selalu berisi nilai terbaru. Dipakai supaya callback di dalam effect
 * atau listener tidak "basi" (stale closure) tanpa harus mendaftar ulang.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
