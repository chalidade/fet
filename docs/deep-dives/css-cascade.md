# Deep Dive: CSS Cascade & Specificity

> Terkait: [03 CSS](../roadmap/03-css.md), [08 CSS Architecture](../roadmap/08-css-architecture.md),
> [15 Web Components](../roadmap/15-web-components.md)

## Pertanyaan pembuka

Kenapa `.btn` dari library tetap menang padahal CSS-mu dimuat belakangan? Kenapa `!important` di
dalam `@layer` justru kalah dari `!important` di layer lain? Kenapa style di Shadow DOM bisa
ditimpa dari luar, tapi `!important` di dalamnya tidak?

Kebanyakan developer menghafal "ID > class > tag". Itu hanya **satu langkah** dari tujuh langkah
cascade.

## Model mental

Untuk setiap properti di setiap elemen, browser mengumpulkan semua deklarasi yang cocok, lalu
mengurutkannya dengan kriteria berikut. Kriteria berikutnya **hanya dipakai kalau kriteria
sebelumnya seri**:

```
1. Origin & importance   (user-agent / user / author, normal vs !important, animasi, transisi)
2. Context               (Shadow DOM: luar vs dalam)
3. Element-attached      (atribut style="")
4. Cascade layers        (@layer)
5. Specificity           (ID, class, tag)
6. Scope proximity       (@scope: root terdekat menang)
7. Order of appearance   (yang ditulis belakangan menang)
```

Kalau tidak ada deklarasi sama sekali, barulah **inheritance** (untuk properti yang diwariskan
seperti `color`) atau **initial value** yang dipakai. Nilai warisan selalu kalah dari deklarasi
apa pun yang langsung mengenai elemen, sekecil apa pun specificity-nya.

## Mekanisme detail

### 1. Origin & importance

Urutan dari paling lemah ke paling kuat:

| # | Origin |
| --- | --- |
| 1 | User-agent normal (style bawaan browser) |
| 2 | User normal (setelan pengguna) |
| 3 | Author normal (CSS kita) |
| 4 | Animasi CSS (`@keyframes`) |
| 5 | Author `!important` |
| 6 | User `!important` |
| 7 | User-agent `!important` |
| 8 | Transisi CSS |

Perhatikan bahwa urutan origin **terbalik** untuk `!important`. Tujuannya supaya pengguna
(misalnya dengan stylesheet aksesibilitas) selalu punya kata terakhir. `!important` bukan
"tombol menang", tapi cara **memindahkan deklarasi ke origin lain**.

### 2. Context (Shadow DOM)

Untuk deklarasi normal, style dari **luar** (light DOM, misalnya `my-el::part(x)` atau selector
ke host) mengalahkan style di dalam shadow root. Untuk `!important`, urutannya terbalik: yang
**di dalam** menang. Jadi komponen bisa memberi default yang bisa ditimpa, dan masih bisa
mengunci sesuatu yang memang tidak boleh diubah.

### 3. Element-attached styles

Atribut `style=""` menang dari selector mana pun pada origin dan importance yang sama. Ini
**bukan** "specificity 1-0-0-0" seperti yang sering diajarkan. Ia adalah langkah tersendiri
sebelum layer dan specificity.

### 4. Cascade layers

```css
@layer reset, base, components, utilities;
```

- Deklarasi normal: layer yang **dideklarasikan belakangan** menang (`utilities` > `components`).
- Style **tanpa layer** mengalahkan semua layer untuk deklarasi normal.
- Untuk `!important`, urutannya **terbalik**: layer paling awal menang, dan `!important` di
  layer mana pun mengalahkan `!important` tanpa layer.

Layer dievaluasi **sebelum** specificity. Selector `#app .card .title` di layer `base` kalah
dari `.title` di layer `components`.

### 5. Specificity

Dihitung sebagai tiga angka **(A, B, C)** yang dibandingkan dari kiri:

| Kolom | Dihitung dari |
| --- | --- |
| A | Selector ID (`#id`) |
| B | Class (`.x`), atribut (`[type=text]`), pseudo-class (`:hover`) |
| C | Tipe (`div`), pseudo-element (`::before`) |

Aturan yang sering terlupa:

- `*` dan combinator (`>`, `+`, `~`, spasi) bernilai 0.
- `:is()`, `:not()`, `:has()` bernilai **argumen yang paling spesifik**.
  `:is(#a, .b)` bernilai (1,0,0) walaupun yang cocok `.b`.
- `:where()` selalu **(0,0,0)**. Cocok untuk library supaya mudah ditimpa.
- `:nth-child(2n of .x)` = pseudo-class (0,1,0) + specificity argumen `of`.
- Tidak ada "overflow": 11 class tidak pernah mengalahkan 1 ID.

### 6. Scope proximity

```css
@scope (.light) { a { color: black; } }
@scope (.dark)  { a { color: white; } }
```

Untuk `<div class="dark"><div class="light"><a>`, link berwarna hitam karena root `.light`
lebih dekat, walaupun aturan `.dark` ditulis belakangan. Proximity hanya dipakai kalau
specificity-nya sama.

### 7. Order of appearance

Kalau semua seri, deklarasi yang muncul belakangan menang. Urutannya dihitung dari urutan
stylesheet di dokumen (`<link>`, `<style>`, `@import`), bukan urutan file selesai diunduh.

## Eksperimen

1. **Layer vs specificity.** Tebak warnanya, lalu cek di DevTools (panel Styles mencoret
   deklarasi yang kalah, dan bagian *Cascade layers* menunjukkan urutannya):
   ```html
   <style>
     @layer base, components;
     @layer base { #app p.title { color: red; } }
     @layer components { .title { color: green; } }
     p { color: blue; }
   </style>
   <div id="app"><p class="title">Warna apa?</p></div>
   ```
   Lalu tambahkan `!important` ke deklarasi di `base` dan `components`. Siapa yang menang
   sekarang, dan kenapa?
2. **`:where()` untuk library.** Tulis `.card :where(h2) { margin: 0 }` dan coba timpa dengan
   `h2 { margin: 1rem }`. Bandingkan dengan `.card h2`.
3. **Inheritance kalah dari deklarasi apa pun.** `#hero { color: red }` lalu
   `* { color: blue }`. Teks di `<p>` di dalam `#hero` berwarna apa?
4. **Shadow DOM.** Buat custom element dengan `::part(label)` dan style default di dalamnya.
   Timpa dari luar, lalu tambahkan `!important` di dalam. Amati perbedaannya.

## Implikasi praktis

- Bangun arsitektur dengan `@layer reset, base, components, utilities;` di awal stylesheet.
  Specificity berhenti jadi perang, karena urutan layer yang menentukan.
- Masukkan CSS pihak ketiga ke layer sendiri: `@import url(lib.css) layer(vendor);`.
- Di library atau design system, pakai `:where()` supaya pemakai bisa menimpa dengan selector
  apa pun.
- Hindari ID di CSS, dan perlakukan `!important` sebagai alat untuk utility atau aksesibilitas,
  bukan untuk menyelesaikan konflik.
- Saat debugging, baca cascade dari atas: origin, lalu layer, baru specificity.

## Sumber primer

- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/) dan
  [Level 6](https://www.w3.org/TR/css-cascade-6/) (`@scope`)
- [Selectors Level 4: Calculating specificity](https://www.w3.org/TR/selectors-4/#specificity-rules)
- Miriam Suzanne, [*A Complete Guide to CSS Cascade Layers*](https://css-tricks.com/css-cascade-layers/)
- [MDN: Cascade, specificity, and inheritance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts)
