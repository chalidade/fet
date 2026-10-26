# @chalidade/utils

Small, dependency-free front-end utilities.

```bash
pnpm add @chalidade/utils
# or
npm install @chalidade/utils
```

::: warning Not published yet
This package isn't on npm yet. For now, copy the source from
[GitHub](https://github.com/chalidade/fet/tree/main/packages/utils/src).
:::

## API

### `debounce(fn, wait)`

Delays running `fn` until `wait` ms have passed without a new call. Good for search inputs, resize,
and autosave. The result has `cancel()` and `flush()`.

```ts
import { debounce } from "@chalidade/utils";

const search = debounce((q: string) => fetchResults(q), 300);
input.addEventListener("input", (e) => search(e.currentTarget.value));

search.cancel(); // cancel the pending call
search.flush();  // run it right now
```

Related concepts: [04 JavaScript](/en/roadmap/04-javascript), [Event Loop](/en/deep-dives/event-loop).

### `throttle(fn, wait)`

Runs `fn` at most once every `wait` ms (leading + trailing). Good for scroll and `pointermove`.

```ts
import { throttle } from "@chalidade/utils";

window.addEventListener("scroll", throttle(updateProgressBar, 100), { passive: true });
```

Related concepts: [16 Performance](/en/roadmap/16-performance).

### `cx(...values)`

Joins classNames conditionally. Accepts strings, numbers, arrays, and objects.

```ts
import { cx } from "@chalidade/utils";

cx("btn", { "btn--active": isActive }, size && `btn--${size}`);
// → "btn btn--active btn--lg"
```

Related concepts: [08 CSS Architecture](/en/roadmap/08-css-architecture).

### `clamp(value, min, max)`

Restricts a number to the range `[min, max]`. Throws a `RangeError` if `min > max`.

```ts
clamp(120, 0, 100); // 100
```

## Learn from the source

Suggested exercise:

1. Rewrite `debounce` without looking at [its source](https://github.com/chalidade/fet/blob/main/packages/utils/src/debounce.ts).
2. Run `pnpm test` to check your implementation.
3. Compare it with `lodash.debounce` (the `leading` and `maxWait` options) and record the differences in your [experiment notes](/en/notes/).
