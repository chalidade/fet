# Deep Dive: Efficiency in React

> Related: [04 JavaScript](../roadmap/04-javascript.md), [07 Framework](../roadmap/07-framework.md),
> [16 Performance](../roadmap/16-performance.md). Toolkit:
> [`@chalidade/utils`](../toolkit/utils.md), [`@chalidade/react-hooks`](../toolkit/react-hooks.md)

## Opening questions

Why does `debounce(search, 300)` inside a component still call the API on every keystroke? Why
doesn't `useCallback` everywhere make the app faster? When is debounce enough, and when is
`useDeferredValue` or `useTransition` the better fit? A 10,000-row list stutters: is the problem
React, the DOM, or the data?

## Mental model

Every interaction in React goes through three costs you can separate:

```
event ──► (1) your JS work ──► (2) render: call components, diff the result
                                       │
                                       ▼
                              (3) commit to the DOM ──► style, layout, paint (browser)
```

Every efficiency technique reduces one of them:

| Technique | Reduces | How |
| --- | --- | --- |
| Debounce / throttle | How **often** (1)–(3) happen | Merges many events into little work |
| `memo`, `useMemo`, `useCallback` | Cost of **(2)** | Skips rendering a component or a calculation whose result is the same |
| `useTransition`, `useDeferredValue` | **When** (2) happens | Expensive renders are deferred and interruptible, input stays responsive |
| Virtualization | Size of **(3)** | Only visible rows exist in the DOM |
| Moving state down / `children` | Reach of **(2)** | Fewer components re-render |

If you don't know which cost is large, every technique above is a guess. Measure first.

## Detailed mechanism

### 1. Why a plain debounce breaks inside a component

```tsx
function Search() {
  const [q, setQ] = useState("");
  const run = debounce((value: string) => fetchResults(value), 300); // ❌
  return <input value={q} onChange={(e) => { setQ(e.target.value); run(e.target.value); }} />;
}
```

`debounce` keeps its timer in a closure. Each keystroke calls `setQ`, the component re-renders,
and **a new `debounce` is created** with a fresh, empty timer. The old timer is never cancelled,
so every keystroke still fires one request, just 300 ms late.

Fixing it takes three things at once:

1. **Stable identity**: the debounced function is created once (`useMemo`/`useRef`), not per
   render.
2. **Latest callback**: because it is created once, it must read the callback through a ref.
   Otherwise it uses the props/state from the first render (**stale closure**).
3. **Cleanup**: a pending timer is cancelled on unmount, so there is no `setState` on a component
   that is gone.

That is exactly what [`useDebouncedCallback`](../toolkit/react-hooks.md#usedebouncedcallback)
does: `useLatest(fn)` for point 2, `useMemo` for point 1, and `useEffect(() => debounced.cancel)`
for point 3.

When what you delay is a **value** (a query for an effect), `useDebouncedValue` is simpler:

```tsx
const [input, setInput] = useState("");
const query = useDebouncedValue(input, 300);
useEffect(() => {
  if (!query) return;
  const ctrl = new AbortController();
  fetchResults(query, { signal: ctrl.signal }).then(setResults).catch(() => {});
  return () => ctrl.abort(); // an old response must not overwrite a newer one
}, [query]);
```

Debounce reduces the **number** of requests but does not guarantee the **order** of responses.
The request for "rea" can finish after "react". `AbortController` (or a "is this still the latest
query?" check) is still required.

### 2. Debounce vs throttle

| | Debounce | Throttle |
| --- | --- | --- |
| Runs when | After events **stop** for N ms | At most **once per** N ms while events continue |
| Good for | Search, autosave, form validation | Scroll, resize, drag, pointer position |
| Risk | Never runs if events never stop | The final value can be missed (hence the *trailing* call) |

For animations that follow scroll, `requestAnimationFrame` is often a better fit than time-based
throttle, because it lines up with the browser's frames.

### 3. When a component re-renders

A component re-renders when **its state changes**, **its parent renders**, or **a context it reads
changes**. "Same" props do not stop a render: when a parent renders, all its children are called
too, unless wrapped in `memo`.

`memo(Component)` skips a render when every prop is equal by `Object.is`. The catch: objects,
arrays, and functions created during render are **always new**:

```tsx
<Chart options={{ smooth: true }} onSelect={(p) => setPoint(p)} /> // memo never helps
```

This is where `useMemo` and `useCallback` matter: **not to make the function itself faster**, but
to keep prop identity stable so `memo` on the child can work, or so a `useEffect` dependency
doesn't change every render.

Practical rules:

- `useMemo` for calculations that are **measurably** expensive (filtering/sorting thousands of
  items), or for values passed to a `memo` component or used as an effect dependency.
- `useCallback` only when the function goes to a `memo` component or is used as a dependency.
  Elsewhere it only adds work (comparing dependencies) and code.
- `memo` on every component makes every render pay for prop comparison, even though props often
  do change. Use it on components that are expensive **and** often receive the same props.

> React Compiler (React 19+) can add this memoization automatically at build time. The concepts
> are the same, and you still need them to read Profiler results.

### 4. Before memoizing: change the structure

These two patterns are often more effective than `memo`:

```tsx
// Move state down: only <ColorPicker> renders when the color changes
function Page() {
  return (<><ColorPicker /><ExpensiveTree /></>);
}

// Or accept children: <ExpensiveTree> is created by the parent, so it doesn't re-render
function ScrollTracker({ children }: { children: React.ReactNode }) {
  const [y, setY] = useState(0);
  // ...attach a scroll listener that calls setY
  return <div data-y={y}>{children}</div>;
}
```

JSX elements received through `children` were already created in the parent's render. When
`ScrollTracker` re-renders, those elements have the same identity, so React skips them.

### 5. `useTransition` and `useDeferredValue`

Debounce makes the UI **wait** before working. Concurrent rendering takes another approach: do the
work right away, but at **low priority** and interruptible by the next input.

```tsx
const [input, setInput] = useState("");
const deferred = useDeferredValue(input);        // lags behind while busy
const isStale = input !== deferred;

return (
  <>
    <input value={input} onChange={(e) => setInput(e.target.value)} />
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <SlowList query={deferred} />  {/* must be wrapped in memo for deferral to help */}
    </div>
  </>
);
```

| Situation | Pick |
| --- | --- |
| Expensive work is **in render** (filtering a big list, a chart) | `useDeferredValue` / `useTransition` |
| Expensive work is **outside React** (server requests, autosave) | Debounce |
| Both | Debounce the request, then `useDeferredValue` to render the results |

Use `useTransition` when you call `setState` yourself (`startTransition(() => setTab(t))`), and
`useDeferredValue` when you only receive the value. Neither reduces the number of server
requests, so neither replaces debounce for fetching.

### 6. Virtualization

When each row is cheap but there are tens of thousands, the problem is the DOM: thousands of nodes
mean heavy style, layout, and memory, and `memo` can't help. Virtualization renders only the
visible rows plus a small buffer (*overscan*), and uses padding or a spacer as tall as the whole
list so the scrollbar stays correct.

```
total height = count × row height
start = floor(scrollTop / row height) - overscan
end   = ceil((scrollTop + viewport height) / row height) + overscan
```

Dynamic row heights turn this formula into measurement plus a position cache. That is where a
library like TanStack Virtual helps. For medium lists, CSS `content-visibility: auto` already skips
rendering off-screen parts without any JavaScript.

## Experiments

1. **See the debounce bug yourself.** Write a search component with a plain `debounce` in the
   component body. Open the Network panel, type "react" quickly, and count requests. Switch to
   `useDebouncedCallback` and count again.
2. **Race condition.** Make a fake API that delays responses randomly by 100–1500 ms. Without
   `AbortController`, type quickly and watch old results overwrite new ones. Fix it.
3. **Profiler.** Install React DevTools, enable *"Highlight updates when components render"* and
   *"Record why each component rendered"*. Type into an input on a page and note which components
   re-render and why.
4. **`memo` that doesn't help.** Wrap a child in `memo` and pass `options={{}}`. See in the
   Profiler that it still renders. Fix it with `useMemo`, then by moving the constant outside the
   component. Which is simpler?
5. **Deferred vs debounce.** Render 5,000 items filtered by an input. Compare three versions: plain,
   with `useDebouncedValue(input, 300)`, and with `useDeferredValue`. Use 6x CPU throttling in
   DevTools. Which version keeps the input most responsive, and which shows results fastest?
6. **Virtualization from scratch.** Render 50,000 rows 32 px tall. Measure initial render time and
   DOM node count. Implement the formula above and measure again.

Record the before/after numbers in your [experiment notes](/en/notes/) with Profiler screenshots.
Those numbers prove which technique actually helped.

## Practical implications

- **Measure first.** React Profiler for render cost, the Performance panel for browser cost, INP
  for responsiveness. Optimizing without numbers often adds code without results.
- Debounce for work **outside** React (requests, autosave), concurrent features for work **inside**
  render. Always cancel stale requests.
- Don't create `debounce`/`throttle` in a component body. Use a stable hook that cleans up on
  unmount.
- Fix the structure before memoizing: state close to where it's used, `children` for expensive
  parts, constants outside components.
- `useCallback`/`useMemo` are tools for **identity**, not speed magic.
- Big lists: virtualization or `content-visibility`, not `memo` on every row.

## Primary sources

- [react.dev: `memo`](https://react.dev/reference/react/memo),
  [`useMemo`](https://react.dev/reference/react/useMemo),
  [`useCallback`](https://react.dev/reference/react/useCallback)
- [react.dev: `useDeferredValue`](https://react.dev/reference/react/useDeferredValue) and
  [`useTransition`](https://react.dev/reference/react/useTransition)
- [react.dev: React Compiler](https://react.dev/learn/react-compiler)
- [react.dev: Profiler](https://react.dev/reference/react/Profiler)
- Dan Abramov, [*Before You memo()*](https://overreacted.io/before-you-memo/)
- [web.dev: Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [web.dev: `content-visibility`](https://web.dev/articles/content-visibility)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
