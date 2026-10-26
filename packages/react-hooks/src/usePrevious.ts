import { useEffect, useRef } from "react";

/** Nilai `value` pada render sebelumnya (`undefined` di render pertama). */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
