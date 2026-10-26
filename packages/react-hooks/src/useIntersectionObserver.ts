import { useCallback, useEffect, useState } from "react";

export interface IntersectionOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  /** Berhenti mengamati setelah elemen pertama kali terlihat (lazy load, animasi masuk). */
  once?: boolean;
}

/**
 * Amati apakah elemen terlihat di viewport. Pasang `ref` yang dikembalikan ke elemen:
 * `const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: "200px" })`.
 */
export function useIntersectionObserver(options: IntersectionOptions = {}) {
  const { root = null, rootMargin, threshold, once = false } = options;
  const [node, setNode] = useState<Element | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : threshold;

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;
    const init: IntersectionObserverInit = { root };
    if (rootMargin !== undefined) init.rootMargin = rootMargin;
    if (threshold !== undefined) init.threshold = threshold;
    const observer = new IntersectionObserver(([next]) => {
      if (!next) return;
      setEntry(next);
      if (once && next.isIntersecting) observer.disconnect();
    }, init);
    observer.observe(node);
    return () => observer.disconnect();
    // threshold dibandingkan lewat thresholdKey supaya array literal tidak memicu ulang.
  }, [node, root, rootMargin, thresholdKey, once]);

  const ref = useCallback((el: Element | null) => setNode(el), []);
  return { ref, entry, isIntersecting: entry?.isIntersecting ?? false };
}
