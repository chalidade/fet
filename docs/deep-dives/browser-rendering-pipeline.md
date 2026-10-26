# Deep Dive: Browser Rendering Pipeline

> Terkait: [03 CSS](../roadmap/03-css.md), [16 Performance](../roadmap/16-performance.md)

## Pertanyaan pembuka

Kenapa mengubah `transform` mulus di 60 fps, sedangkan mengubah `width` tersendat? Apa yang
sebenarnya terjadi antara "DOM berubah" dan "pixel di layar berubah"?

## Model mental

```
HTML ──parse──▶ DOM ─┐
                     ├─▶ Style (computed styles) ─▶ Layout (geometri) ─▶ Paint (display list)
CSS  ──parse──▶ CSSOM┘                                                        │
                                                                              ▼
                                         Composite (layer → GPU, di compositor thread) ─▶ Layar
```

Mengubah sebuah properti memicu pipeline **dari tahap tertentu ke belakang**:

| Yang berubah | Contoh properti | Tahap yang dijalankan ulang |
| --- | --- | --- |
| Geometri | `width`, `top`, `font-size`, menambah elemen | Style → Layout → Paint → Composite |
| Tampilan saja | `color`, `background`, `box-shadow` | Style → Paint → Composite |
| Compositor saja | `transform`, `opacity` (pada layer sendiri) | Composite |

Karena composite berjalan di **compositor thread**, animasi `transform`/`opacity` tetap mulus
meskipun main thread sedang sibuk menjalankan JavaScript.

## Mekanisme detail

- **Parsing:** HTML diparse secara inkremental. `<script>` biasa menghentikan parser, sementara
  *preload scanner* tetap mencari resource lain untuk diunduh lebih awal.
- **Style:** browser mencocokkan selector ke elemen (dicocokkan dari kanan ke kiri), lalu menghitung
  computed value. Selector yang kompleks plus DOM besar = recalculate style mahal.
- **Layout:** menghitung posisi dan ukuran berdasarkan formatting context (block, inline, flex, grid).
  Layout bisa bersifat lokal atau global, tergantung batas perubahan (`contain: layout` membantu).
- **Paint:** menghasilkan daftar perintah gambar per layer, lalu di-rasterize (sering di GPU).
- **Layer:** elemen dipromosikan ke layer sendiri karena `will-change`, `transform` 3D, video,
  canvas, dll. Layer terlalu banyak = memori GPU membengkak.
- **Forced synchronous layout:** membaca properti geometri (`offsetWidth`, `getBoundingClientRect`)
  setelah menulis style memaksa browser menjalankan layout **saat itu juga**. Kalau dilakukan dalam
  loop, terjadi *layout thrashing*.

## Eksperimen

1. **Biaya per properti.** Animasikan sebuah kotak dengan `left` lalu dengan `transform: translateX`.
   Rekam di Performance panel, aktifkan *Paint flashing* dan *Layer borders* di tab Rendering.
2. **Layout thrashing.**
   ```js
   const items = [...document.querySelectorAll(".item")];
   // Buruk: baca-tulis bergantian → layout tiap iterasi
   items.forEach(el => { el.style.width = el.offsetWidth + 10 + "px"; });
   // Baik: baca semua dulu, tulis semua kemudian
   const widths = items.map(el => el.offsetWidth);
   items.forEach((el, i) => { el.style.width = widths[i] + 10 + "px"; });
   ```
   Bandingkan durasinya dengan 1.000 elemen.
3. **Main thread sibuk vs compositor.** Jalankan loop berat 2 detik sambil ada animasi `transform`
   dan animasi `left`. Mana yang tetap jalan?
4. **`content-visibility: auto`.** Terapkan pada halaman panjang dan ukur waktu render awal.

## Implikasi praktis

- Animasikan hanya `transform` dan `opacity` sebisa mungkin.
- Kelompokkan baca layout dan tulis style terpisah (atau pakai rAF untuk tulis).
- Gunakan `will-change` seperlunya, bukan di semua elemen.
- Gunakan `contain` dan `content-visibility` untuk membatasi area kerja layout/paint.

## Sumber primer

- [Chrome: Inside look at modern web browser (bagian 1–4)](https://developer.chrome.com/blog/inside-browser-part1)
- [Chromium: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- [What forces layout / reflow (Paul Irish)](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [CSS Containment](https://www.w3.org/TR/css-contain-2/)
