# 04 · JavaScript

> **Fase:** 1 · **Estimasi:** 4–6 minggu · **Prasyarat:** [02 HTML](02-html.md)

## Kenapa ini penting

Framework berganti tiap beberapa tahun, tapi semuanya dibangun di atas mekanisme yang sama:
closure, event loop, prototype, dan DOM. Bug paling sulit di aplikasi front-end hampir selalu
bermuara ke salah satu dari ini.

## Peta konsep

### Dasar
- [ ] Tipe data, coercion, `==` vs `===`
- [ ] Scope, hoisting, `let`/`const`/`var`, TDZ
- [ ] Function, arrow function, `this`
- [ ] Array & object methods, destructuring, spread
- [ ] DOM manipulation: query, event, event delegation
- [ ] Fetch API / Ajax (XHR), JSON
- [ ] Modules (ESM): `import`/`export`

### Menengah
- [ ] Closure dan penerapannya (memoization, module pattern, private state)
- [ ] Prototype chain, `class` sebagai syntactic sugar
- [ ] Promise, `async`/`await`, error handling, `AbortController`
- [ ] Event loop: call stack, task queue, microtask queue, rendering step
- [ ] Event propagation: capture, target, bubble; `passive` listener
- [ ] Iterator, generator, `Symbol`
- [ ] `Map`/`Set`/`WeakMap`/`WeakRef`

### Deep dive
- [ ] Execution context, environment record, realm (bahasa spesifikasi ECMA-262)
- [ ] Garbage collection dan memory leak di aplikasi SPA
- [ ] Hidden classes dan inline caching di V8 (kenapa bentuk object penting untuk performa)
- [ ] Proxy & Reflect (dasar reactivity Vue/MobX)
- [ ] `queueMicrotask`, `requestAnimationFrame`, `requestIdleCallback`, `scheduler.postTask`

## Cara belajar

1. Kerjakan [JavaScript.info](https://javascript.info/) bagian 1 dan 2 dengan cepat, berhenti hanya
   di bagian yang membuatmu ragu.
2. Untuk event loop: tonton *In The Loop* (Jake Archibald), lalu tulis 10 snippet campuran
   `setTimeout`/`Promise`/`queueMicrotask`/`rAF`. **Tebak urutan output dulu**, baru jalankan.
3. Buka DevTools → **Memory**, buat memory leak dengan sengaja (listener yang tidak dilepas,
   closure yang menahan DOM), lalu temukan lewat heap snapshot.
4. Implementasikan ulang: `Promise` (sesuai Promises/A+), `debounce`, `EventEmitter`, `bind`.
5. Baca satu bagian spesifikasi ECMA-262 per minggu, mulai dari *Jobs and Host Operations*.

## Uji pemahaman

1. Tebak urutan output:
   ```js
   console.log(1);
   setTimeout(() => console.log(2));
   Promise.resolve().then(() => console.log(3));
   queueMicrotask(() => console.log(4));
   requestAnimationFrame(() => console.log(5));
   console.log(6);
   ```
   Kenapa posisi `5` tidak deterministik relatif terhadap `2`?
2. Kenapa loop `for (var i…)` dengan `setTimeout` mencetak angka yang sama, dan kenapa `let` memperbaikinya?
   Jelaskan dengan istilah environment record.
3. Apa yang terjadi kalau microtask terus menjadwalkan microtask baru? Bandingkan dengan task.
4. Sebutkan tiga sumber memory leak paling umum di SPA dan cara mendeteksinya.
5. Kenapa `await` di dalam `forEach` tidak menunggu?
6. Apa beda `Object.create(null)` dengan `{}`?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Todo app vanilla JS dengan event delegation dan `localStorage` | DOM, events |
| Menengah | Infinite scroll + search dengan debounce, `AbortController`, dan error state | Async, fetch |
| Deep | Implementasikan `Promise` yang lolos [Promises/A+ test suite](https://github.com/promises-aplus/promises-tests) | Microtask, spec |
| Deep | Mini reactive library dengan `Proxy` (mirip `reactive()` Vue) | Proxy, dependency tracking |

## Sumber primer

- [ECMAScript Language Specification (ECMA-262)](https://tc39.es/ecma262/)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [JavaScript.info](https://javascript.info/)
- [V8 blog](https://v8.dev/blog)
- *You Don't Know JS Yet* (Kyle Simpson), gratis di GitHub

## Toolkit terkait

- [`@chalidade/utils`](../toolkit/utils.md): `debounce`, `throttle` (baca source-nya sebagai latihan)
- Deep dive: [Event Loop](../deep-dives/event-loop.md)
