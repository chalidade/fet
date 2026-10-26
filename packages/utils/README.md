# @fet/utils

Utilitas front-end kecil tanpa dependensi.

| Fungsi | Untuk apa | Topik roadmap terkait |
| --- | --- | --- |
| `debounce(fn, wait)` | Tunda eksekusi sampai input berhenti (search, autosave) | [JavaScript](../../docs/roadmap/04-javascript.md), [Performance](../../docs/roadmap/16-performance.md) |
| `throttle(fn, wait)` | Batasi frekuensi eksekusi (scroll, pointermove) | [Performance](../../docs/roadmap/16-performance.md) |
| `cx(...values)` | Gabungkan className secara kondisional | [CSS Architecture](../../docs/roadmap/08-css-architecture.md) |
| `clamp(v, min, max)` | Batasi angka ke rentang | — |

```ts
import { debounce, cx } from "@fet/utils";

const onSearch = debounce((q: string) => fetchResults(q), 300);
const className = cx("btn", { "btn--active": active });
```

## Belajar dari source-nya

Setiap fungsi sengaja ditulis pendek supaya bisa dibaca. Latihan yang disarankan:
tulis ulang `debounce` tanpa melihat source, lalu jalankan `pnpm test` untuk mengecek
implementasimu. Setelah itu bandingkan dengan `lodash.debounce` (opsi `leading`,
`maxWait`) dan catat bedanya di `docs/notes/`.
