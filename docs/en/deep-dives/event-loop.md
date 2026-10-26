# Deep Dive: The Event Loop

> Related: [04 JavaScript](../roadmap/04-javascript.md), [16 Performance](../roadmap/16-performance.md)

## Opening question

Why can an `await` inside a click handler make the UI feel slow? Why does an animation stutter even
though "the JavaScript is async"? Why is `setTimeout(fn, 0)` never really 0 ms?

## Mental model

In the browser, JavaScript runs on **a single main thread** that is also used for style, layout, and
paint. The event loop is the algorithm that decides **what work runs next** on that thread. One turn,
simplified:

```
1. Take ONE task from one of the task queues (the browser picks) → run it to completion
2. Run ALL microtasks until the queue is empty (including microtasks added along the way)
3. If it's time to render (usually ~16.7 ms on a 60 Hz screen):
     a. run requestAnimationFrame callbacks
     b. style → layout → paint (composite happens on another thread)
4. If there's idle time left: requestIdleCallback
5. Repeat
```

Key consequences:
- **Tasks** (`setTimeout`, user events, `postMessage`, I/O) run one at a time, and rendering can happen between them.
- **Microtasks** (`Promise.then`, code after `await`, `queueMicrotask`, `MutationObserver`) are drained completely before the browser may render. A microtask that keeps scheduling microtasks will **freeze the page**. A task that schedules tasks won't.
- **rAF** runs right before rendering, so it's the best place to write to the DOM/styles for animation.

## Detailed mechanism

- There are **multiple task queues** (for example user input, timers, networking). The spec lets the
  browser choose which queue to prioritize. Chrome prioritizes input to stay responsive.
- `setTimeout` is clamped to at least 4 ms after 5 levels of nesting, and in background tabs it can be
  throttled to 1 second or more.
- `await x` is equivalent to `Promise.resolve(x).then(continuation)`, so code after `await` is a microtask.
- The render step can be skipped if there are no visual changes or if the browser decides the frame
  isn't needed (a hidden tab).
- A **long task** is a task over 50 ms. While a long task runs, user input waits → poor INP.

## Experiments

1. **Execution order.** Run this in the console and explain the result:
   ```js
   setTimeout(() => console.log("timeout"));
   requestAnimationFrame(() => console.log("rAF"));
   Promise.resolve().then(() => console.log("microtask"));
   console.log("sync");
   ```
   Repeat it 10 times. Why does the position of `rAF` relative to `timeout` change?
2. **Microtasks block rendering.** Compare:
   ```js
   function loopTask() { setTimeout(loopTask); }          // the page stays responsive
   function loopMicro() { queueMicrotask(loopMicro); }    // the page freezes (save your work first!)
   ```
3. **Breaking up a long task.** Process 1 million items in one loop, then split it into 5 ms chunks with
   `await scheduler.yield()` (or `setTimeout` as a fallback). Record both in the Performance panel and
   compare the long tasks.

## Practical implications

- For heavy work after a click: show feedback first, then *yield* before continuing, so the browser gets a chance to paint.
- Don't read layout (`getBoundingClientRect`) in between style writes in a loop. It forces synchronous layout.
- For JS-driven animation, use `requestAnimationFrame`, not `setInterval`.
- For computation over ~50 ms, move it to a Web Worker.

## Primary sources

- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- Jake Archibald, *In The Loop* (JSConf.Asia 2018)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
