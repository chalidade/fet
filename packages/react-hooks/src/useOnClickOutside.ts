import { useEffect, type RefObject } from "react";
import { useLatest } from "./useLatest";

/**
 * Panggil `handler` saat pointer ditekan di luar elemen `ref`, misalnya untuk
 * menutup dropdown. Memakai `pointerdown` supaya juga jalan di layar sentuh.
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: PointerEvent) => void,
): void {
  const latest = useLatest(handler);
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(event.target as Node)) latest.current(event);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [ref, latest]);
}
