# 04 · JavaScript

> **Phase:** 1 · **Estimate:** 4–6 weeks · **Prerequisites:** [02 HTML](02-html.md)

## Why it matters

Frameworks change every few years, but they're all built on the same mechanisms: closures, the event
loop, prototypes, and the DOM. The hardest bugs in front-end apps almost always come down to one of these.

## Concept map

### Basics
- [ ] Data types, coercion, `==` vs `===`
- [ ] Scope, hoisting, `let`/`const`/`var`, TDZ
- [ ] Functions, arrow functions, `this`
- [ ] Array & object methods, destructuring, spread
- [ ] DOM manipulation: queries, events, event delegation
- [ ] Fetch API / Ajax (XHR), JSON
- [ ] Modules (ESM): `import`/`export`

### Intermediate
- [ ] Closures and their uses (memoization, the module pattern, private state)
- [ ] The prototype chain, `class` as syntactic sugar
- [ ] Promises, `async`/`await`, error handling, `AbortController`
- [ ] The event loop: call stack, task queue, microtask queue, rendering step
- [ ] Event propagation: capture, target, bubble; `passive` listeners
- [ ] Iterators, generators, `Symbol`
- [ ] `Map`/`Set`/`WeakMap`/`WeakRef`

### Deep dive
- [ ] Execution contexts, environment records, realms (ECMA-262 spec language)
- [ ] Garbage collection and memory leaks in SPAs
- [ ] Hidden classes and inline caching in V8 (why object shape matters for performance)
- [ ] Proxy & Reflect (the basis of Vue/MobX reactivity)
- [ ] `queueMicrotask`, `requestAnimationFrame`, `requestIdleCallback`, `scheduler.postTask`

## How to learn

1. Work through parts 1 and 2 of [JavaScript.info](https://javascript.info/) quickly, stopping only
   where you hesitate.
2. For the event loop: watch *In The Loop* (Jake Archibald), then write 10 snippets mixing
   `setTimeout`/`Promise`/`queueMicrotask`/`rAF`. **Guess the output order first**, then run them.
3. Open DevTools → **Memory**, create a memory leak on purpose (a listener that's never removed, a
   closure holding onto DOM), then find it with a heap snapshot.
4. Re-implement: `Promise` (per Promises/A+), `debounce`, `EventEmitter`, `bind`.
5. Read one section of the ECMA-262 spec per week, starting with *Jobs and Host Operations*.

## Check your understanding

1. Guess the output order:
   ```js
   console.log(1);
   setTimeout(() => console.log(2));
   Promise.resolve().then(() => console.log(3));
   queueMicrotask(() => console.log(4));
   requestAnimationFrame(() => console.log(5));
   console.log(6);
   ```
   Why isn't the position of `5` relative to `2` deterministic?
2. Why does a `for (var i…)` loop with `setTimeout` print the same number, and why does `let` fix it?
   Explain it in terms of environment records.
3. What happens if a microtask keeps scheduling new microtasks? Compare that with tasks.
4. Name the three most common sources of memory leaks in SPAs and how to detect them.
5. Why doesn't `await` inside `forEach` wait?
6. What's the difference between `Object.create(null)` and `{}`?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | A vanilla JS todo app with event delegation and `localStorage` | DOM, events |
| Intermediate | Infinite scroll + search with debounce, `AbortController`, and error states | Async, fetch |
| Deep | Implement a `Promise` that passes the [Promises/A+ test suite](https://github.com/promises-aplus/promises-tests) | Microtasks, spec |
| Deep | A mini reactive library with `Proxy` (like Vue's `reactive()`) | Proxy, dependency tracking |

## Primary sources

- [ECMAScript Language Specification (ECMA-262)](https://tc39.es/ecma262/)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [JavaScript.info](https://javascript.info/)
- [V8 blog](https://v8.dev/blog)
- *You Don't Know JS Yet* (Kyle Simpson), free on GitHub

## Related toolkit

- [`@chalidade/utils`](../toolkit/utils.md): `debounce`, `throttle` (read the source as an exercise)
- Deep dive: [Efficiency in React](../deep-dives/react-efficiency.md) (debouncing inside components)
- Deep dive: [Event Loop](../deep-dives/event-loop.md)
