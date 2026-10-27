# Deep Dive: Accessibility Tree & Cara Screen Reader Bekerja

> Terkait: [02 HTML](../roadmap/02-html.md), [07 Framework](../roadmap/07-framework.md),
> [15 Web Components](../roadmap/15-web-components.md)

## Pertanyaan pembuka

Screen reader tidak "melihat" layar. Lalu dari mana ia tahu bahwa sesuatu adalah tombol, apa
namanya, dan apakah sedang ditekan? Kenapa `<div onclick>` terlihat dan berfungsi seperti tombol
bagi pengguna mouse, tapi tidak ada bagi pengguna screen reader? Dan kenapa menambahkan ARIA
kadang justru membuat situs *lebih* sulit diakses?

## Model mental

Browser membangun beberapa pohon dari halamanmu. Yang paling dikenal adalah **DOM** dan **render
tree**. Ada satu lagi yang jarang dilihat developer: **accessibility tree**.

```
HTML ──► DOM ──► render tree ──► pixel di layar         (untuk mata)
           │
           └──► accessibility tree ──► API aksesibilitas OS ──► screen reader,
                                       (UIA, AX API, AT-SPI…)    voice control,
                                                                 switch device
```

Setiap node di accessibility tree punya empat hal yang penting:

| Properti | Contoh | Dari mana |
| --- | --- | --- |
| **Role** | `button`, `link`, `heading`, `textbox` | Elemen HTML (implicit role) atau atribut `role` |
| **Name** | "Simpan", "Email" | Isi teks, `<label>`, `alt`, `aria-label`, `aria-labelledby` |
| **State/properti** | `pressed`, `expanded`, `checked`, `level=1` | Atribut native (`disabled`, `checked`) atau `aria-*` |
| **Value / deskripsi** | isi textbox, `aria-describedby` | Elemen form, atribut deskripsi |

Screen reader hanya mengenal pohon ini. Ia tidak membaca CSS, tidak menjalankan event listener-mu,
dan tidak tahu bahwa `div` berwarna biru itu "terlihat seperti tombol". Kalau suatu informasi tidak
ada di accessibility tree, bagi pengguna screen reader informasi itu tidak ada.

## Mekanisme detail

### 1. Dari DOM ke accessibility tree

Browser memetakan setiap elemen ke role-nya mengikuti spesifikasi **HTML-AAM** (HTML Accessibility
API Mappings). Contoh hasil nyata dari Chromium untuk potongan HTML ini:

```html
<h1>Toko</h1>
<button>Simpan</button>
<div class="btn" onclick="save()">Simpan</div>
<img src="x.png">
<img src="y.png" alt="">
<label>Email <input type="email"></label>
<button aria-label="Tutup"><svg aria-hidden="true"></svg>×</button>
<div role="button" tabindex="0" aria-pressed="true">Bold</div>
```

```
- heading "Toko" [level=1]
- button "Simpan"
- text: Simpan                ← div onclick: hanya teks, bukan tombol
- img                         ← tanpa alt: gambar tanpa nama
                              ← alt="": dianggap dekoratif, hilang dari pohon
- textbox "Email"             ← nama diambil dari <label>
- button "Tutup"              ← aria-label menimpa isi "×"
- button "Bold" [pressed]     ← role dan state dari ARIA
```

Banyak node DOM yang tidak muncul sama sekali: wrapper `div`/`span` tanpa makna menjadi `generic`
dan biasanya diabaikan, elemen `display: none` atau `aria-hidden="true"` dibuang dari pohon.

### 2. Accessible name computation

Nama sebuah node dihitung dengan algoritma **accname** yang berurutan. Yang pertama ditemukan menang:

1. `aria-labelledby` (bisa menunjuk beberapa elemen, bahkan yang tersembunyi)
2. `aria-label`
3. Atribut native: `<label>` untuk input, `alt` untuk gambar, `<caption>` untuk tabel, `title` (terakhir)
4. Isi teks elemen itu sendiri, untuk role yang boleh diberi nama dari isinya (button, link, heading, …)

Akibatnya: `aria-label` di tombol yang isinya teks akan **mengganti** teks itu. Kalau label visual
"Kirim pesanan" tapi `aria-label="Submit"`, pengguna voice control yang mengucapkan "klik Kirim
pesanan" tidak akan menemukan tombolnya.

### 3. ARIA hanya mengubah pohon, bukan perilaku

`role="button"` mengubah role di accessibility tree. Itu saja. Browser **tidak** menambahkan:

- fokus keyboard (perlu `tabindex="0"`),
- aktivasi dengan Enter dan Spasi (perlu `keydown` handler sendiri),
- state `disabled` yang benar-benar mencegah klik.

`<button>` mendapatkan semua itu secara gratis. Inilah **aturan pertama ARIA**: kalau ada elemen
HTML native dengan semantik dan perilaku yang kamu butuhkan, pakai elemen itu.

ARIA yang salah lebih buruk daripada tidak ada ARIA: `role="button"` pada link navigasi membuat
screen reader mengumumkan "tombol", sehingga pengguna mengharapkan aksi di halaman ini, bukan
pindah halaman.

### 4. Bagaimana screen reader membacanya

Screen reader (NVDA, JAWS, VoiceOver, TalkBack, Orca) mengambil pohon itu lewat API aksesibilitas
sistem operasi, lalu menyediakan dua cara utama untuk menjelajah:

- **Mode baca (browse/virtual cursor):** pengguna bergerak per elemen dengan panah, atau melompat
  per jenis: `H` ke heading berikutnya, `K`/`Tab` ke link, `D` ke landmark (NVDA). Banyak pengguna
  memulai dengan membuka **daftar heading** atau **landmark** untuk memahami struktur halaman,
  mirip cara kita memindai halaman secara visual.
- **Mode fokus/form:** tombol keyboard diteruskan ke halaman, misalnya saat mengetik di textbox.

Karena itu heading yang berurutan (`h1` → `h2` → `h3`) dan landmark (`<main>`, `<nav>`,
`<header>`, `<footer>`) bukan hiasan, melainkan daftar isi bagi pengguna screen reader.

### 5. Perubahan dinamis

Saat konten berubah tanpa pindah halaman (toast "Tersimpan", hasil pencarian, error validasi),
screen reader tidak otomatis membacanya. Ada dua alat:

- **Live region:** elemen dengan `role="status"` (sopan, menunggu pengguna selesai) atau
  `role="alert"` (langsung menyela). Region-nya harus sudah ada di DOM **sebelum** isinya diubah,
  karena yang diumumkan adalah *perubahan*.
- **Memindahkan fokus:** misalnya ke judul dialog saat dialog dibuka, lalu kembali ke tombol
  pemicunya saat ditutup. Di SPA, pindah route sebaiknya memindahkan fokus ke heading halaman baru.

## Eksperimen

1. **Lihat pohonnya.** Buka DevTools Chrome → panel Elements → tab **Accessibility**, lalu aktifkan
   *Enable full-page accessibility tree*. Bandingkan pohon DOM dan accessibility tree untuk satu
   halaman yang pernah kamu buat.
2. **Snapshot otomatis.** Dengan Playwright:
   ```js
   await page.setContent(`<button>Simpan</button><div onclick="x()">Simpan</div>`);
   console.log(await page.locator("body").ariaSnapshot());
   ```
   Jelaskan kenapa hanya satu yang tercatat sebagai `button`.
3. **Pakai screen reader sungguhan selama 15 menit.** VoiceOver (macOS: Cmd+F5), NVDA (Windows,
   gratis), atau TalkBack (Android). Tutup mata atau matikan layar, lalu coba: temukan menu
   navigasi, isi satu form, dan kirim. Catat apa yang membingungkan.
4. **Nama yang bertabrakan.** Beri tombol "Kirim pesanan" atribut `aria-label="Submit"`. Lihat nama
   yang muncul di panel Accessibility, lalu coba dengan Voice Control (macOS) atau Voice Access
   (Android).
5. **Tombol palsu.** Buat `<div role="button">` lengkap dengan `tabindex` dan handler keyboard
   sampai perilakunya sama dengan `<button>` (fokus, Enter, Spasi, disabled). Hitung baris kodenya.
6. **Live region.** Buat tombol "Simpan" yang menampilkan teks "Tersimpan" setelah 1 detik. Uji
   dengan screen reader tanpa live region, lalu dengan `role="status"` yang sudah ada sejak awal,
   lalu dengan `role="status"` yang baru ditambahkan bersamaan dengan teksnya.

Catat hasil dan kejutannya di [catatan eksperimen](/notes/). Pengalaman eksperimen 3 biasanya yang
paling mengubah cara kita menulis HTML.

## Implikasi praktis

- **HTML semantik dulu**, ARIA belakangan. `<button>`, `<a href>`, `<label>`, `<nav>`, `<main>`,
  `<dialog>` sudah membawa role, nama, state, dan perilaku keyboard.
- Setiap kontrol interaktif harus punya **nama yang bisa dihitung**. Tombol ikon butuh
  `aria-label` atau teks tersembunyi secara visual. Gambar butuh `alt` yang bermakna, atau `alt=""`
  kalau dekoratif.
- Nama yang dibacakan sebaiknya **mengandung teks yang terlihat** di label, supaya pengguna voice
  control bisa menyebutnya.
- Jaga struktur heading dan landmark. Satu `h1` per halaman, level tidak melompat tanpa alasan.
- Untuk widget kompleks (combobox, tabs, menu), ikuti pola **ARIA Authoring Practices Guide**,
  termasuk interaksi keyboard-nya, bukan hanya atributnya.
- Konten dinamis butuh live region atau manajemen fokus.
- Uji dengan accessibility tree (DevTools, `ariaSnapshot`) di CI dan dengan screen reader sungguhan
  secara berkala. Linter otomatis hanya menangkap sebagian kecil masalah.

## Sumber primer

- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [HTML Accessibility API Mappings (HTML-AAM)](https://www.w3.org/TR/html-aam-1.0/)
- [Accessible Name and Description Computation (accname)](https://www.w3.org/TR/accname-1.2/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/), terutama
  [Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Chrome DevTools: Accessibility features reference](https://developer.chrome.com/docs/devtools/accessibility/reference)
- [Playwright: Aria snapshots](https://playwright.dev/docs/aria-snapshots)
