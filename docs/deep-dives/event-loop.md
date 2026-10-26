# Deep Dive: Event Loop

> Terkait: [04 JavaScript](../roadmap/04-javascript.md), [16 Performance](../roadmap/16-performance.md)

## Pertanyaan pembuka

Kenapa `await` di dalam handler klik bisa membuat UI terasa lambat? Kenapa animasi tersendat
padahal "JavaScript-nya async"? Kenapa `setTimeout(fn, 0)` tidak pernah benar-benar 0 ms?

## Model mental

JavaScript di browser berjalan di **satu thread utama** yang juga dipakai untuk style, layout, dan
paint. Event loop adalah algoritma yang memutuskan **pekerjaan apa yang jalan berikutnya** di thread
itu. Satu putaran (secara sederhana):

```
1. Ambil SATU task dari salah satu task queue (dipilih browser) → jalankan sampai selesai
2. Jalankan SEMUA microtask sampai queue kosong (termasuk microtask yang ditambahkan selama proses)
3. Jika saatnya render (biasanya ~16,7 ms di layar 60 Hz):
     a. jalankan callback requestAnimationFrame
     b. style → layout → paint (dan composite di thread lain)
4. Jika masih ada waktu luang: requestIdleCallback
5. Ulangi
```

Konsekuensi penting:
- **Task** (`setTimeout`, event user, `postMessage`, I/O) berjalan satu per satu, dan render bisa terjadi di antaranya.
- **Microtask** (`Promise.then`, `await` lanjutan, `queueMicrotask`, `MutationObserver`) dikuras habis sebelum browser boleh render. Microtask yang menjadwalkan microtask tanpa henti akan **membekukan halaman**, sedangkan task yang menjadwalkan task tidak.
- **rAF** berjalan tepat sebelum render, sehingga tempat terbaik untuk menulis ke DOM/style untuk animasi.

## Mekanisme detail

- Ada **beberapa task queue** (misalnya input user, timer, networking). Spesifikasi memberi browser
  kebebasan memilih queue mana yang diprioritaskan. Chrome memprioritaskan input agar responsif.
- `setTimeout` punya clamping minimal 4 ms setelah 5 level nesting, dan di tab background bisa
  di-throttle sampai 1 detik atau lebih.
- `await x` sama dengan `Promise.resolve(x).then(lanjutan)`, jadi kode setelah `await` adalah microtask.
- Render step bisa dilewati kalau tidak ada perubahan visual atau kalau browser memutuskan frame
  tidak perlu (tab tersembunyi).
- **Long task** = task di atas 50 ms. Selama long task berjalan, input user menunggu → INP buruk.

## Eksperimen

1. **Urutan eksekusi.** Jalankan di console dan jelaskan hasilnya:
   ```js
   setTimeout(() => console.log("timeout"));
   requestAnimationFrame(() => console.log("rAF"));
   Promise.resolve().then(() => console.log("microtask"));
   console.log("sync");
   ```
   Ulangi 10 kali. Kenapa posisi `rAF` vs `timeout` berubah-ubah?
2. **Microtask membekukan render.** Bandingkan:
   ```js
   function loopTask() { setTimeout(loopTask); }          // halaman tetap responsif
   function loopMicro() { queueMicrotask(loopMicro); }    // halaman beku (simpan kerja dulu!)
   ```
3. **Memecah long task.** Proses 1 juta item dalam satu loop, lalu pecah per 5 ms dengan
   `await scheduler.yield()` (atau `setTimeout` sebagai fallback). Rekam keduanya di Performance
   panel dan bandingkan long task-nya.

## Implikasi praktis

- Pekerjaan berat setelah klik: tampilkan feedback dulu, lalu *yield* sebelum lanjut, supaya browser sempat paint.
- Jangan baca layout (`getBoundingClientRect`) di tengah tulis style di loop, karena memaksa layout sinkron.
- Untuk animasi berbasis JS, gunakan `requestAnimationFrame`, bukan `setInterval`.
- Untuk komputasi di atas ~50 ms, pindahkan ke Web Worker.

## Sumber primer

- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- Jake Archibald, *In The Loop* (JSConf.Asia 2018)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
