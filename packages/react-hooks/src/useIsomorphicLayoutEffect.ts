import { useEffect, useLayoutEffect } from "react";

/** `useLayoutEffect` di browser, `useEffect` di server (menghindari peringatan SSR). */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
