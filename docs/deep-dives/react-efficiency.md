# Deep Dive: Efisiensi di React

> Terkait: [04 JavaScript](../roadmap/04-javascript.md), [07 Framework](../roadmap/07-framework.md),
> [16 Performance](../roadmap/16-performance.md). Toolkit:
> [`@chalidade/utils`](../toolkit/utils.md), [`@chalidade/react-hooks`](../toolkit/react-hooks.md)

## Pertanyaan pembuka

Kenapa `debounce(search, 300)` di dalam komponen tetap memanggil API di setiap ketikan? Kenapa
`useCallback` di mana-mana tidak membuat aplikasi lebih cepat? Kapan cukup memakai debounce, dan
kapan lebih tepat memakai `useDeferredValue` atau `useTransition`? List 10.000 baris terasa
patah-patah: masalahnya di React, di DOM, atau di datanya?

## Model mental

Setiap interaksi di React melewati tiga biaya yang bisa dipisahkan:

```
event ──► (1) kerja JS kamu ──► (2) render: panggil komponen, bandingkan hasil
                                       │
                                       ▼
                              (3) commit ke DOM ──► style, layout, paint (browser)
```

Teknik efisiensi selalu mengurangi salah satunya:

| Teknik | Mengurangi | Caranya |
| --- | --- | --- |
| Debounce / throttle | Seberapa **sering** (1)–(3) terjadi | Menggabungkan banyak event jadi sedikit kerja |
| `memo`, `useMemo`, `useCallback` | Biaya **(2)** | Melewati render komponen atau perhitungan yang hasilnya sama |
| `useTransition`, `useDeferredValue` | **Kapan** (2) terjadi | Render mahal ditunda dan bisa diinterupsi, input tetap responsif |
| Virtualisasi | Ukuran **(3)** | Hanya baris yang terlihat yang ada di DOM |
| Pindah state ke bawah / `children` | Jangkauan **(2)** | Lebih sedikit komponen yang ikut render ulang |

Kalau tidak tahu biaya mana yang besar, semua teknik di atas hanya tebakan. Ukur dulu.

## Mekanisme detail

### 1. Kenapa debounce biasa rusak di dalam komponen

```tsx
function Search() {
  const [q, setQ] = useState("");
  const run = debounce((value: string) => fetchResults(value), 300); // ❌
  return <input value={q} onChange={(e) => { setQ(e.target.value); run(e.target.value); }} />;
}
```

`debounce` menyimpan timer di closure. Setiap ketikan memanggil `setQ`, komponen render ulang,
dan **`debounce` baru dibuat** dengan timer baru yang kosong. Timer lama tidak pernah dibatalkan,
jadi setiap ketikan tetap memicu satu request, hanya terlambat 300 ms.

Memperbaikinya butuh tiga hal sekaligus:

1. **Identitas stabil**: fungsi debounce dibuat sekali (`useMemo`/`useRef`), bukan per render.
2. **Callback terbaru**: karena dibuat sekali, ia harus membaca callback lewat ref. Kalau tidak,
   ia memakai props/state dari render pertama (**stale closure**).
3. **Cleanup**: timer yang masih menunggu dibatalkan saat unmount, supaya tidak ada `setState`
   pada komponen yang sudah hilang.

Itulah isi [`useDebouncedCallback`](../toolkit/react-hooks.md#usedebouncedcallback):
`useLatest(fn)` untuk poin 2, `useMemo` untuk poin 1, dan `useEffect(() => debounced.cancel)`
untuk poin 3.

Kalau yang ditunda adalah **nilai** (query untuk efek), `useDebouncedValue` lebih sederhana:

```tsx
const [input, setInput] = useState("");
const query = useDebouncedValue(input, 300);
useEffect(() => {
  if (!query) return;
  const ctrl = new AbortController();
  fetchResults(query, { signal: ctrl.signal }).then(setResults).catch(() => {});
  return () => ctrl.abort(); // respons lama tidak boleh menimpa yang baru
}, [query]);
```

Debounce mengurangi **jumlah** request, tapi tidak menjamin **urutan** jawabannya. Request untuk
"rea" bisa selesai setelah "react". `AbortController` (atau cek "apakah ini query terakhir?")
tetap wajib.

### 2. Debounce vs throttle

| | Debounce | Throttle |
| --- | --- | --- |
| Jalan kapan | Setelah event **berhenti** selama N ms | Paling banyak **sekali per** N ms selama event berlangsung |
| Cocok untuk | Search, autosave, validasi form | Scroll, resize, drag, posisi pointer |
| Risiko | Tidak pernah jalan kalau event tidak berhenti | Hasil terakhir bisa terlewat (makanya perlu panggilan *trailing*) |

Untuk animasi yang mengikuti scroll, `requestAnimationFrame` sering lebih tepat daripada throttle
berbasis waktu, karena selaras dengan frame browser.

### 3. Kapan komponen render ulang

Komponen render ulang kalau **state-nya berubah**, **parent-nya render**, atau **context yang
dibacanya berubah**. Props yang "sama" tidak menghentikan render: kalau parent render, semua
anaknya ikut dipanggil, kecuali dibungkus `memo`.

`memo(Component)` melewati render kalau semua props sama menurut `Object.is`. Masalahnya, objek,
array, dan fungsi yang dibuat di dalam render **selalu baru**:

```tsx
<Chart options={{ smooth: true }} onSelect={(p) => setPoint(p)} /> // memo tidak pernah menolong
```

Di sinilah `useMemo` dan `useCallback` berguna: **bukan untuk mempercepat fungsi itu sendiri**,
tapi untuk menjaga identitas props supaya `memo` di anak bisa bekerja, atau supaya dependency
`useEffect` tidak berubah setiap render.

Aturan praktisnya:

- `useMemo` untuk perhitungan yang **terukur** mahal (filter/sort ribuan item), atau untuk nilai
  yang dikirim ke komponen ber-`memo` atau dipakai sebagai dependency efek.
- `useCallback` hanya kalau fungsinya dikirim ke komponen ber-`memo` atau dipakai sebagai
  dependency. Di tempat lain ia hanya menambah kerja (membandingkan dependency) dan kode.
- `memo` di semua komponen membuat setiap render membayar biaya perbandingan props, padahal
  sering props-nya memang berubah. Pakai di komponen yang mahal **dan** sering menerima props
  yang sama.

> React Compiler (React 19+) bisa menambahkan memoisasi ini secara otomatis saat build. Konsepnya
> tetap sama, dan tetap perlu dipahami saat membaca hasil Profiler.

### 4. Sebelum memoisasi: ubah struktur

Dua pola ini sering lebih efektif daripada `memo`:

```tsx
// Pindahkan state ke bawah: hanya <ColorPicker> yang render saat warna berubah
function Page() {
  return (<><ColorPicker /><ExpensiveTree /></>);
}

// Atau terima children: <ExpensiveTree> dibuat oleh parent, jadi tidak ikut render ulang
function ScrollTracker({ children }: { children: React.ReactNode }) {
  const [y, setY] = useState(0);
  // ...pasang listener scroll yang memanggil setY
  return <div data-y={y}>{children}</div>;
}
```

Elemen JSX yang diterima lewat `children` sudah dibuat di render parent. Saat `ScrollTracker`
render ulang, elemen itu identitasnya sama, jadi React melewatinya.

### 5. `useTransition` dan `useDeferredValue`

Debounce membuat UI **menunggu** sebelum bekerja. Concurrent rendering memilih cara lain: kerjakan
segera, tapi dengan **prioritas rendah** dan bisa diinterupsi oleh input berikutnya.

```tsx
const [input, setInput] = useState("");
const deferred = useDeferredValue(input);        // tertinggal saat sibuk
const isStale = input !== deferred;

return (
  <>
    <input value={input} onChange={(e) => setInput(e.target.value)} />
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <SlowList query={deferred} />  {/* harus dibungkus memo agar penundaan berguna */}
    </div>
  </>
);
```

| Situasi | Pilih |
| --- | --- |
| Kerja mahal ada **di render** (filter list besar, chart) | `useDeferredValue` / `useTransition` |
| Kerja mahal ada **di luar React** (request ke server, autosave) | Debounce |
| Keduanya | Debounce request, lalu `useDeferredValue` untuk render hasilnya |

`useTransition` dipakai saat kamu yang memanggil `setState` (`startTransition(() => setTab(t))`),
`useDeferredValue` saat kamu hanya menerima nilainya. Keduanya tidak mengurangi jumlah request ke
server, karena itu bukan pengganti debounce untuk fetch.

### 6. Virtualisasi

Kalau setiap baris murah tapi jumlahnya puluhan ribu, masalahnya ada di DOM: ribuan node berarti
style, layout, dan memori yang besar, dan `memo` tidak bisa membantu. Virtualisasi hanya merender
baris yang terlihat ditambah sedikit cadangan (*overscan*), dan memakai padding atau elemen kosong
setinggi total list supaya scrollbar tetap benar.

```
tinggi total = jumlah × tinggi baris
mulai = floor(scrollTop / tinggi baris) - overscan
akhir = ceil((scrollTop + tinggi viewport) / tinggi baris) + overscan
```

Tinggi baris yang dinamis membuat rumus ini butuh pengukuran dan cache posisi. Di situ library
seperti TanStack Virtual berguna. Untuk list sedang, CSS `content-visibility: auto` sudah
melewati render bagian yang tidak terlihat tanpa JavaScript.

## Eksperimen

1. **Lihat bug debounce sendiri.** Tulis komponen search dengan `debounce` biasa di dalam body
   komponen. Buka Network panel, ketik "react" dengan cepat. Hitung request-nya. Ganti dengan
   `useDebouncedCallback`, lalu hitung lagi.
2. **Race condition.** Buat API palsu yang menunda jawaban secara acak 100–1500 ms. Tanpa
   `AbortController`, ketik cepat dan lihat hasil lama menimpa yang baru. Perbaiki.
3. **Profiler.** Pasang React DevTools, aktifkan *"Highlight updates when components render"* dan
   *"Record why each component rendered"*. Ketik di input pada sebuah halaman dan catat komponen
   mana yang ikut render dan alasannya.
4. **`memo` yang tidak menolong.** Bungkus komponen anak dengan `memo`, kirim `options={{}}`.
   Lihat di Profiler bahwa ia tetap render. Perbaiki dengan `useMemo`, lalu dengan memindahkan
   konstanta ke luar komponen. Mana yang lebih sederhana?
5. **Deferred vs debounce.** Render 5.000 item yang difilter oleh input. Bandingkan tiga versi:
   tanpa apa-apa, dengan `useDebouncedValue(input, 300)`, dan dengan `useDeferredValue`. Pakai
   CPU throttling 6x di DevTools. Versi mana yang input-nya terasa paling responsif, dan mana yang
   hasilnya paling cepat muncul?
6. **Virtualisasi dari nol.** Render 50.000 baris setinggi 32 px. Ukur waktu render awal dan
   jumlah node DOM. Implementasikan rumus di atas dan ukur ulang.

Catat angka sebelum dan sesudah di [catatan eksperimen](/notes/) beserta screenshot Profiler.
Angka itu yang membuktikan teknik mana yang benar-benar membantu.

## Implikasi praktis

- **Ukur dulu.** React Profiler untuk biaya render, Performance panel untuk biaya browser, metrik
  INP untuk responsivitas. Optimasi tanpa angka sering menambah kode tanpa hasil.
- Debounce untuk kerja **di luar** React (request, autosave), concurrent features untuk kerja
  **di dalam** render. Selalu batalkan request lama.
- Jangan membuat `debounce`/`throttle` di body komponen. Pakai hook yang stabil dan membersihkan
  diri saat unmount.
- Perbaiki struktur sebelum memoisasi: state di dekat pemakainya, `children` untuk bagian yang
  mahal, konstanta di luar komponen.
- `useCallback`/`useMemo` adalah alat untuk **identitas**, bukan sihir kecepatan.
- List besar: virtualisasi atau `content-visibility`, bukan `memo` di setiap baris.

## Sumber primer

- [react.dev: `memo`](https://react.dev/reference/react/memo),
  [`useMemo`](https://react.dev/reference/react/useMemo),
  [`useCallback`](https://react.dev/reference/react/useCallback)
- [react.dev: `useDeferredValue`](https://react.dev/reference/react/useDeferredValue) dan
  [`useTransition`](https://react.dev/reference/react/useTransition)
- [react.dev: React Compiler](https://react.dev/learn/react-compiler)
- [react.dev: Profiler](https://react.dev/reference/react/Profiler)
- Dan Abramov, [*Before You memo()*](https://overreacted.io/before-you-memo/)
- [web.dev: Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [web.dev: `content-visibility`](https://web.dev/articles/content-visibility)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
