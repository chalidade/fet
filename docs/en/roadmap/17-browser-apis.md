# 17 · Browser APIs & PWA

> **Phase:** 6 · **Estimate:** 2–3 weeks · **Prerequisites:** [04 JavaScript](04-javascript.md)

## Why it matters

The modern browser is a complete application platform: offline, realtime, notifications, payments,
sensors. Many features usually built with heavy libraries are already available natively.

## Concept map

### Basics
- [ ] Storage: `localStorage`, `sessionStorage`, cookies, IndexedDB, the Cache API
- [ ] Observers: `IntersectionObserver`, `ResizeObserver`, `MutationObserver`
- [ ] Location (Geolocation), Notifications, Device Orientation
- [ ] Clipboard, the History API, URL & URLSearchParams

### Intermediate
- [ ] Realtime: WebSockets vs Server-Sent Events vs long polling
- [ ] Service Workers: lifecycle (install, activate, fetch), caching strategies
- [ ] PWAs: the web app manifest, installability, offline-first
- [ ] Web Workers for heavy computation
- [ ] Payments (Payment Request API), Credentials (Credential Management API)

### Deep dive
- [ ] Storage quotas, eviction, and `navigator.storage.persist()`
- [ ] Background Sync, the Push API
- [ ] Origin Private File System (OPFS) and SQLite in the browser
- [ ] `BroadcastChannel`, `SharedWorker`
- [ ] The View Transitions API, the Navigation API

## How to learn

1. Turn an app into a PWA that works offline. Test it in DevTools → **Application**.
2. Build a simple chat with WebSockets, then one-way notifications with SSE, and compare them.
3. Move heavy computation (for example parsing a 50 MB CSV) to a Web Worker and measure the effect on INP.

## Check your understanding

1. Why doesn't a new service worker activate immediately, and what's the risk of using `skipWaiting()`?
2. When is SSE a better fit than WebSockets?
3. Why can `localStorage` slow a page down?
4. What's the difference between the *cache-first*, *network-first*, and *stale-while-revalidate* strategies?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | Lazy-loaded images and infinite scroll with IntersectionObserver | Observers |
| Intermediate | An offline-first notes app (IndexedDB + service worker + sync when online) | PWA, storage |
| Deep | A Promise-based IndexedDB wrapper with schema migrations | IndexedDB |

## Primary sources

- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Service Workers spec](https://w3c.github.io/ServiceWorker/)
- [web.dev: Learn PWA](https://web.dev/learn/pwa)

## Related toolkit

- (planned) `@chalidade/react-hooks`: `useMediaQuery`, `useLocalStorage`, `useOnline`, `useIntersectionObserver`
