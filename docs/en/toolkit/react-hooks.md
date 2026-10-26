# @chalidade/react-hooks

Small, tested, SSR-safe React hooks. Each one solves a problem that's easy to get wrong by hand:
stale closures, listeners that are never removed, or hydration mismatches.

```bash
pnpm add @chalidade/react-hooks
```

::: warning Not published yet
This package isn't on npm yet. For now, copy the source from
[GitHub](https://github.com/chalidade/fet/tree/main/packages/react-hooks/src).
:::

Requires React 18 or newer (`useSyncExternalStore`).

## Overview

| Hook | Use it for |
| --- | --- |
| [`useDebouncedValue`](#usedebouncedvalue) | A value that waits until input stops (search) |
| [`useDebouncedCallback`](#usedebouncedcallback) | A debounced function that's stable across renders (autosave) |
| [`useMediaQuery`](#usemediaquery) | Responsive logic in JS without hydration mismatches |
| [`useLocalStorage`](#uselocalstorage) | State that persists and syncs across tabs |
| [`useEventListener`](#useeventlistener) | Listeners that clean up after themselves |
| [`useOnClickOutside`](#useonclickoutside) | Closing a dropdown/popover on outside click |
| [`useIntersectionObserver`](#useintersectionobserver) | Lazy loading, infinite scroll, enter animations |
| [`usePrevious`](#useprevious) | The value from the previous render |
| [`useLatest`](#uselatest) | A ref holding the latest value (no stale closures) |
| `useIsomorphicLayoutEffect` | `useLayoutEffect` without server warnings |

## `useDebouncedValue`

```tsx
const [input, setInput] = useState("");
const query = useDebouncedValue(input, 300);

useEffect(() => {
  if (query) void search(query);
}, [query]);
```

## `useDebouncedCallback`

The function identity stays the same across renders but always calls the latest callback. A
pending call is cancelled on unmount, so there's no `setState` after unmount.

```tsx
const save = useDebouncedCallback((draft: string) => api.save(draft), 1000);

<textarea onChange={(e) => save(e.target.value)} onBlur={() => save.flush()} />
```

## `useMediaQuery`

```tsx
const isMobile = useMediaQuery("(max-width: 640px)");
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
```

On the server it returns `false` (or the second argument). Because it uses
`useSyncExternalStore`, React uses the server value during hydration and then updates, so there's
no hydration mismatch.

## `useLocalStorage`

```tsx
const [theme, setTheme, resetTheme] = useLocalStorage<"light" | "dark">("theme", "light");
```

- Other components using the same key update too.
- Other tabs update via the `storage` event.
- Corrupt data or blocked storage (private mode) won't crash the app: the value falls back to
  `initialValue`.

## `useEventListener`

```tsx
useEventListener(window, "keydown", (e) => {
  if (e.key === "Escape") close();
});

const ref = useRef<HTMLDivElement>(null);
useEventListener(ref, "scroll", onScroll, { passive: true });
```

The event type follows the target (`KeyboardEvent` for `keydown`, and so on).

## `useOnClickOutside`

```tsx
const ref = useRef<HTMLDivElement>(null);
useOnClickOutside(ref, () => setOpen(false));
return <div ref={ref}>{open && <Menu />}</div>;
```

Uses `pointerdown` so it also works on touch screens.

## `useIntersectionObserver`

```tsx
const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: "200px", once: true });
return <img ref={ref} src={isIntersecting ? src : undefined} alt={alt} />;
```

## `usePrevious`

```tsx
const prevCount = usePrevious(count);
const direction = prevCount === undefined ? null : count > prevCount ? "up" : "down";
```

## `useLatest`

```tsx
const onTickRef = useLatest(onTick);
useEffect(() => {
  const id = setInterval(() => onTickRef.current(), 1000);
  return () => clearInterval(id);
}, []); // the interval doesn't need re-registering when onTick changes
```

## Learn from the source

Try writing your own `useLocalStorage` with `useState` + `useEffect`, then run the tests in
`packages/react-hooks`. Which cases fail? (Hint: two components sharing a key, and the first
render on the server.)

Related concepts: [07 Framework](/en/roadmap/07-framework), [17 Browser APIs](/en/roadmap/17-browser-apis),
[18 Rendering Strategies](/en/roadmap/18-rendering-strategies).
