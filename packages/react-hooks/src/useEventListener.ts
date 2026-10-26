import { useEffect, type RefObject } from "react";
import { useLatest } from "./useLatest";

type Target = Window | Document | HTMLElement | null | undefined | RefObject<HTMLElement | null>;

/**
 * Pasang event listener yang otomatis dilepas saat unmount. Handler boleh berubah
 * tiap render tanpa memasang ulang listener.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | null | undefined,
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof DocumentEventMap>(
  target: Document | null | undefined,
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement | RefObject<HTMLElement | null> | null | undefined,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void;
export function useEventListener(
  target: Target,
  type: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions,
): void {
  const latest = useLatest(handler);
  const capture = options?.capture;
  const passive = options?.passive;
  const once = options?.once;

  useEffect(() => {
    const el = target && "current" in target ? target.current : target;
    if (!el) return;
    const listener = (event: Event) => latest.current(event);
    const opts: AddEventListenerOptions = {};
    if (capture !== undefined) opts.capture = capture;
    if (passive !== undefined) opts.passive = passive;
    if (once !== undefined) opts.once = once;
    el.addEventListener(type, listener, opts);
    return () => el.removeEventListener(type, listener, opts);
  }, [target, type, capture, passive, once, latest]);
}
