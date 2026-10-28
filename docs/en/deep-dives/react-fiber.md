# Deep Dive: React Fiber from the Source Code

> Related: [07 Framework](../roadmap/07-framework.md). Other deep dives:
> [Efficiency in React](react-efficiency.md), [Event Loop](event-loop.md)

## Opening questions

Why can't hooks be called inside an `if`? How can React "postpone" a big render without making
input feel stuck, when JavaScript runs on a single thread? Why must the render phase be pure while
`useEffect` may contain side effects? And what does `key` actually do?

All the answers live in one data structure: the **fiber**.

## Mental model

A fiber is a plain JavaScript object that represents **one unit of work** for one component or
host element (`<div>`, `<button>`). React stores the component tree as a *linked list* of fibers,
not as recursion on the call stack. Because the work lives on the heap, React can stop in the
middle, give the browser a turn, and resume from the last fiber.

```
            update (setState, render)
                     │
                     ▼
   ┌──────────── RENDER PHASE (interruptible, must be pure) ──────────┐
   │  workLoop: for each fiber → beginWork(fiber) … completeWork(fiber) │
   │  result: a workInProgress tree + flags (Placement, Update, …)      │
   └───────────────────────────────┬──────────────────────────────────┘
                                   ▼
   ┌──────────── COMMIT PHASE (synchronous, not interruptible) ───────┐
   │  mutation: change the DOM → root.current = workInProgress         │
   │  layout: useLayoutEffect, refs                                    │
   └───────────────────────────────┬──────────────────────────────────┘
                                   ▼
                     passive effects (useEffect), scheduled after paint
```

There are always **two trees**: `current` (what's on screen) and `workInProgress` (what's being
built). They're linked through `fiber.alternate`. After a commit, React just swaps the
`root.current` pointer. This is called **double buffering**, the same idea used in game graphics.

## Detailed mechanism

All excerpts below come from React 19 (`react-dom@19.3.1`). In the React repo the code lives in
`packages/react-reconciler/src/`.

### 1. The shape of a fiber (`ReactFiber.js`)

```js
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;            // kind: 0 FunctionComponent, 3 HostRoot, 5 HostComponent, …
  this.key = key;
  this.type = null;          // the component function, or a string like "button"
  this.stateNode = null;     // the DOM node for host components

  this.return = null;        // parent
  this.child = null;         // first child
  this.sibling = null;       // next sibling
  this.index = 0;

  this.pendingProps = pendingProps;  // props for this render
  this.memoizedProps = null;         // props from the last render
  this.memoizedState = null;         // for function components: the hooks linked list
  this.updateQueue = null;

  this.flags = 0;            // effects for this fiber (Placement, Update, ChildDeletion, …)
  this.subtreeFlags = 0;     // union of the flags of all descendants
  this.lanes = 0;            // priority of updates pending on this fiber
  this.childLanes = 0;       // … and on its descendants
  this.alternate = null;     // its twin in the other tree
}
```

The tree isn't a `children` array but three pointers: `child`, `sibling`, and `return`. With those
three, React can walk the whole tree with an ordinary loop and stop at any fiber.

### 2. The work loop (`ReactFiberWorkLoop.js`)

The core of React is only a few lines:

```js
function workLoopSync() {
  while (workInProgress !== null) performUnitOfWork(workInProgress);
}

function workLoopConcurrentByScheduler() {
  while (workInProgress !== null && !shouldYield()) performUnitOfWork(workInProgress);
}
```

The only difference is `shouldYield()`. The Scheduler gives React a budget of about **5 ms**
(`frameInterval = 5` in the `scheduler` package). When the budget runs out, the loop stops,
`workInProgress` keeps pointing at the next fiber, and the Scheduler schedules the continuation
through a `MessageChannel` (a macrotask, see [Event Loop](event-loop.md)). Between two slices the
browser can handle clicks and paint.

`performUnitOfWork` walks the tree depth-first:

```js
function performUnitOfWork(unitOfWork) {
  const next = beginWork(unitOfWork.alternate, unitOfWork, renderLanes); // go down
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) completeUnitOfWork(unitOfWork); // no child: go up
  else workInProgress = next;
}
```

`completeUnitOfWork` runs `completeWork`, then moves to the `sibling`. If there's no sibling, it
climbs to `return` and completes the parent. The order for `<main><h1/><Counter/></main>` is:

```
begin main → begin h1 → complete h1 → begin Counter → begin button → complete button
→ complete Counter → complete main
```

### 3. `beginWork`: rendering and bailouts (`ReactFiberBeginWork.js`)

`beginWork` calls your component (for function components through `renderWithHooks`) and then
matches the result against the old children (*reconciliation*). Before that it checks whether the
work can be skipped:

- the props are the same (`oldProps === newProps`, an identity check), context hasn't changed, and
- `fiber.lanes` contains no update for this render.

If all of that holds, React goes into `bailoutOnAlreadyFinishedWork`. If `childLanes` is also
empty, the **entire subtree** is skipped. This is why "move state down" and "`children` as a prop"
from [Efficiency in React](react-efficiency.md) work: the `children` elements keep the same
identity, so `oldProps === newProps`.

### 4. Child reconciliation and `key` (`ReactChildFiber.js`)

For an array of children, `reconcileChildrenArray` first walks in order as long as the `key`s
match. As soon as one doesn't, the rest go into a `Map`:

```js
function mapRemainingChildren(currentFirstChild) {
  const existingChildren = new Map();
  for (let child = currentFirstChild; child !== null; child = child.sibling)
    existingChildren.set(child.key !== null ? child.key : child.index, child);
  return existingChildren;
}
```

Each new element is looked up in that `Map` by `key` (or by index when there's no `key`). If it's
found and the `type` matches, the old fiber is **reused** along with its state and DOM node. Then
`placeChild` decides whether the node has to move: a fiber whose old index is lower than
`lastPlacedIndex` gets the `Placement` flag.

As a result, `key={index}` in a reorderable list makes React attach state to the wrong item: index
0 stays index 0 even though its content has changed.

### 5. Hooks are a linked list on the fiber (`ReactFiberHooks.js`)

```js
function mountWorkInProgressHook() {
  const hook = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  if (workInProgressHook === null) currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  else workInProgressHook = workInProgressHook.next = hook;
  return workInProgressHook;
}
```

Every call to `useState`, `useRef`, `useMemo`, and so on appends one node to the list on
`fiber.memoizedState`. On re-render, `updateWorkInProgressHook` walks the same list **by call
order**. Hooks have no name or id. If one hook is skipped because of an `if`, every hook after it
reads another hook's state. That's the *Rules of Hooks*.

### 6. Lanes: priority as a bitmask (`ReactFiberLane.js`)

Every update gets a **lane**, a single bit in a 31-bit number. A lower bit means higher priority.
The values in React 19:

| Lane | Value | Used for |
| --- | --- | --- |
| `SyncLane` | `2` | Discrete events: `click`, `keydown`, `input` |
| `InputContinuousLane` | `8` | Continuous events: `mousemove`, `scroll`, `pointermove` |
| `DefaultLane` | `32` | Updates outside events (for example from `setTimeout` or a fetch) |
| `TransitionLanes` | `256` … | Updates inside `startTransition` / `useDeferredValue` |
| `IdleLane` | `268435456` | Idle work |
| `OffscreenLane` | `536870912` | Hidden content (`<Activity>`) |

`requestUpdateLane` picks the lane: inside a transition it takes a transition lane. Otherwise the
lane comes from the type of `window.event` through `getEventPriority`. Because lanes are bits,
operations like "merge" (`a | b`), "take the highest priority" (`lanes & -lanes`), and "is subset"
(`(set & subset) === subset`) are a single instruction.

When a transition render is in progress and a `SyncLane` update arrives, the transition render is
thrown away and React starts again with the urgent update. Throwing a render away is safe because
the render phase is pure: nothing has been written to the DOM yet.

### 7. Commit (`ReactFiberCommitWork.js`)

Once the whole `workInProgress` tree is finished, `commitRoot` runs **synchronously**:

1. **Before mutation:** for example `getSnapshotBeforeUpdate`.
2. **Mutation:** apply flags to the DOM (insert, update attributes, delete), run `useLayoutEffect`
   cleanups, detach old refs. Then `root.current = finishedWork`.
3. **Layout:** run `useLayoutEffect` and attach refs. The DOM has changed but hasn't been painted.
4. **Passive:** `useEffect` is scheduled through the Scheduler and usually runs after the browser
   paints (`flushPassiveEffects`).

`subtreeFlags` keeps commits fast: a subtree with `subtreeFlags === 0` doesn't need to be walked.

## Experiments

Set up a small project with `react`, `react-dom`, and `jsdom` (or run it in the browser with Vite).
All results below were verified with React 19.3.1.

1. **Walk the fiber tree from a DOM node.** React stores the fiber in a `__reactFiber$<random>`
   property on every DOM node:
   ```js
   const btn = document.querySelector("button");
   let f = btn[Object.keys(btn).find((k) => k.startsWith("__reactFiber$"))];
   while (f) { console.log(f.tag, typeof f.type === "function" ? f.type.name : f.type); f = f.return; }
   ```
   For `<App><main><h1/><Counter/></main></App>` the result is
   `5 button → 0 Counter → 5 main → 0 App → 3 (HostRoot)`. These are internal properties, for
   learning only.
2. **Look at the hooks linked list.** On a `Counter` fiber that uses `useState(0)`, `useRef("r")`,
   and `useTransition()`, follow `fiber.memoizedState` through `.next`. You'll see `0`,
   `{ current: "r" }`, `false`, and then the node holding `startTransition`. Try wrapping `useRef`
   in an `if` and look at the error.
3. **Double buffering.** Save `fiberRoot.current`, trigger one update, then check
   `fiberRoot.current !== old` and `fiberRoot.current.alternate === old`. Both are `true`.
4. **Lanes.** Read `fiberRoot.pendingLanes` right after a plain `setState` (outside an event: `32`,
   `DefaultLane`), then after `startTransition(() => setState(...))`. The result is `258`
   (`0b100000010`): `256` is the transition lane, and `2` is the optimistic `isPending = true` update
   sent on `SyncLane`. Explain why `isPending` has to be urgent.
5. **Interrupted rendering.** Render 3,000 items that each take 1 ms, filtered by an input. Record in
   the DevTools Performance panel with and without `useDeferredValue`. Look for task slices of about
   5 ms in the transition version.
6. **The wrong `key`.** Render a list of uncontrolled `<input>`s with `key={index}`, type into the
   first one, then reverse the list. Switch to `key={item.id}` and compare. Connect the result to
   `mapRemainingChildren`.

Record your results and surprises in your [experiment notes](/en/notes/). As a next step, build the
mini React from the stage 07 practice projects, then compare it with the source excerpts above.

## Practical implications

- **The render phase must be pure.** A render can run more than once, be interrupted, or be thrown
  away. Side effects in a component body can happen twice, or for UI that never appears. Strict Mode
  deliberately renders twice to surface these problems.
- **Call hooks in the same order every render.** Hooks are matched by their position in the linked
  list, not by name.
- **Use stable, unique `key`s**, not indexes, for lists that can change order. Change the `key`
  deliberately when you want to reset a component's state.
- **Bailouts depend on prop identity.** Component structure (state close to where it's used,
  `children`) is often more effective than `memo`.
- **Transitions don't make code faster.** They make work interruptible. If one component takes
  200 ms to render, that single unit of work still takes 200 ms, because React can only stop
  **between** fibers.
- **`useLayoutEffect` blocks paint**, `useEffect` doesn't. Use layout effects only to measure the DOM
  or prevent flicker.

## Primary sources

- [React source: `packages/react-reconciler/src`](https://github.com/facebook/react/tree/main/packages/react-reconciler/src),
  especially `ReactFiber.js`, `ReactFiberWorkLoop.js`, `ReactFiberBeginWork.js`,
  `ReactChildFiber.js`, `ReactFiberHooks.js`, `ReactFiberLane.js`, `ReactFiberCommitWork.js`
- [Scheduler source](https://github.com/facebook/react/tree/main/packages/scheduler/src)
- Andrew Clark, [*React Fiber Architecture*](https://github.com/acdlite/react-fiber-architecture)
- [React PR #18796: Lanes](https://github.com/facebook/react/pull/18796)
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [react.dev: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) and
  [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [react.dev: `useTransition`](https://react.dev/reference/react/useTransition)
- Rodrigo Pombo, [*Build your own React*](https://pomb.us/build-your-own-react/)
