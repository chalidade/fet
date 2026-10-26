# @chalidade/utils

Utilitas front-end kecil tanpa dependensi.

```bash
pnpm add @chalidade/utils
# atau
npm install @chalidade/utils
```

::: warning Belum dipublish
Package ini belum dipublish ke npm. Sementara ini, salin source-nya dari
[GitHub](https://github.com/chalidade/fet/tree/main/packages/utils/src).
:::

## API

### `debounce(fn, wait)`

Menunda eksekusi `fn` sampai `wait` ms berlalu tanpa panggilan baru. Cocok untuk input pencarian,
resize, dan autosave. Hasilnya punya `cancel()` dan `flush()`.

```ts
import { debounce } from "@chalidade/utils";

const search = debounce((q: string) => fetchResults(q), 300);
input.addEventListener("input", (e) => search(e.currentTarget.value));

search.cancel(); // batalkan panggilan yang menunggu
search.flush();  // jalankan sekarang juga
```

Konsep terkait: [04 JavaScript](/roadmap/04-javascript), [Event Loop](/deep-dives/event-loop).

### `throttle(fn, wait)`

Menjalankan `fn` paling banyak sekali setiap `wait` ms (leading + trailing). Cocok untuk scroll
dan `pointermove`.

```ts
import { throttle } from "@chalidade/utils";

window.addEventListener("scroll", throttle(updateProgressBar, 100), { passive: true });
```

Konsep terkait: [16 Performance](/roadmap/16-performance).

### `cx(...values)`

Menggabungkan className secara kondisional. Menerima string, angka, array, dan object.

```ts
import { cx } from "@chalidade/utils";

cx("btn", { "btn--active": isActive }, size && `btn--${size}`);
// → "btn btn--active btn--lg"
```

Konsep terkait: [08 CSS Architecture](/roadmap/08-css-architecture).

### `clamp(value, min, max)`

Membatasi angka ke rentang `[min, max]`. Melempar `RangeError` kalau `min > max`.

```ts
clamp(120, 0, 100); // 100
```

## Belajar dari source-nya

Latihan yang disarankan:

1. Tulis ulang `debounce` tanpa melihat [source-nya](https://github.com/chalidade/fet/blob/main/packages/utils/src/debounce.ts).
2. Jalankan `pnpm test` untuk mengecek implementasimu.
3. Bandingkan dengan `lodash.debounce` (opsi `leading`, `maxWait`) dan catat bedanya di [catatan eksperimen](/notes/).
