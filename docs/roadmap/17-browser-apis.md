# 17 · Browser APIs & PWA

> **Fase:** 6 · **Estimasi:** 2–3 minggu · **Prasyarat:** [04 JavaScript](04-javascript.md)

## Kenapa ini penting

Browser modern adalah platform aplikasi lengkap: offline, realtime, notifikasi, pembayaran,
sensor. Banyak fitur yang biasanya dibuat dengan library berat sebenarnya sudah tersedia secara native.

## Peta konsep

### Dasar
- [ ] Storage: `localStorage`, `sessionStorage`, cookies, IndexedDB, Cache API
- [ ] Observers: `IntersectionObserver`, `ResizeObserver`, `MutationObserver`
- [ ] Location (Geolocation), Notifications, Device Orientation
- [ ] Clipboard, History API, URL & URLSearchParams

### Menengah
- [ ] Realtime: WebSockets vs Server-Sent Events vs long polling
- [ ] Service Workers: lifecycle (install, activate, fetch), strategi cache
- [ ] PWA: web app manifest, installability, offline-first
- [ ] Web Workers untuk komputasi berat
- [ ] Payments (Payment Request API), Credentials (Credential Management API)

### Deep dive
- [ ] Storage quota, eviction, dan `navigator.storage.persist()`
- [ ] Background Sync, Push API
- [ ] Origin Private File System (OPFS) dan SQLite di browser
- [ ] `BroadcastChannel`, `SharedWorker`
- [ ] View Transitions API, Navigation API

## Cara belajar

1. Ubah satu aplikasi menjadi PWA yang bisa dibuka offline. Uji di DevTools → **Application**.
2. Implementasikan chat sederhana dengan WebSocket, lalu notifikasi satu arah dengan SSE, dan bandingkan.
3. Pindahkan komputasi berat (misalnya parsing CSV 50 MB) ke Web Worker dan ukur dampaknya ke INP.

## Uji pemahaman

1. Kenapa service worker baru tidak langsung aktif, dan apa risikonya memakai `skipWaiting()`?
2. Kapan SSE lebih tepat daripada WebSocket?
3. Kenapa `localStorage` bisa memperlambat halaman?
4. Apa beda strategi cache *cache-first*, *network-first*, dan *stale-while-revalidate*?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Lazy-load gambar dan infinite scroll dengan IntersectionObserver | Observers |
| Menengah | Aplikasi catatan offline-first (IndexedDB + service worker + sync saat online) | PWA, storage |
| Deep | Wrapper IndexedDB berbasis Promise dengan migrasi skema | IndexedDB |

## Sumber primer

- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Service Workers spec](https://w3c.github.io/ServiceWorker/)
- [web.dev: Learn PWA](https://web.dev/learn/pwa)

## Toolkit terkait

- (rencana) `@chalidade/react-hooks`: `useMediaQuery`, `useLocalStorage`, `useOnline`, `useIntersectionObserver`
