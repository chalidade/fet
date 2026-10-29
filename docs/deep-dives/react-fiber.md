# Deep Dive: React Fiber dari Source Code

> Terkait: [07 Framework](../roadmap/07-framework.md). Deep dive lain:
> [Efisiensi di React](react-efficiency.md), [Event Loop](event-loop.md)

## Pertanyaan pembuka

Kenapa hooks tidak boleh dipanggil di dalam `if`? Bagaimana React bisa "menunda" render besar
tanpa membuat input terasa macet, padahal JavaScript berjalan di satu thread? Kenapa render phase
harus murni, tapi `useEffect` boleh berisi efek samping? Dan apa sebenarnya yang dilakukan `key`?

Semua jawabannya ada di satu struktur data: **fiber**.

## Model mental

Fiber adalah object JavaScript biasa yang mewakili **satu unit kerja** untuk satu komponen atau
elemen host (`<div>`, `<button>`). React menyimpan pohon komponen sebagai *linked list* fiber, bukan
sebagai rekursi di call stack. Karena pekerjaannya ada di heap, React bisa berhenti di tengah,
memberi browser kesempatan, lalu lanjut dari fiber terakhir.

```
            update (setState, render)
                     │
                     ▼
   ┌──────────── RENDER PHASE (bisa disela, harus murni) ─────────────┐
   │  workLoop: for each fiber → beginWork(fiber) … completeWork(fiber) │
   │  hasilnya: pohon workInProgress + flags (Placement, Update, …)     │
   └───────────────────────────────┬──────────────────────────────────┘
                                   ▼
   ┌──────────── COMMIT PHASE (sinkron, tidak bisa disela) ───────────┐
   │  mutation: ubah DOM → root.current = workInProgress               │
   │  layout: useLayoutEffect, ref                                     │
   └───────────────────────────────┬──────────────────────────────────┘
                                   ▼
                     passive effects (useEffect), dijadwalkan setelah paint
```

Selalu ada **dua pohon**: `current` (yang sedang tampil di layar) dan `workInProgress` (yang
sedang dibangun). Keduanya terhubung lewat `fiber.alternate`. Setelah commit, React cukup menukar
pointer `root.current`. Teknik ini disebut **double buffering**, sama seperti di grafis game.

## Mekanisme detail

Semua kutipan di bawah diambil dari React 19 (`react-dom@19.3.1`). Di repo React, kodenya ada di
`packages/react-reconciler/src/`.

### 1. Bentuk sebuah fiber (`ReactFiber.js`)

```js
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;            // jenis: 0 FunctionComponent, 3 HostRoot, 5 HostComponent, …
  this.key = key;
  this.type = null;          // fungsi komponen, atau string "button"
  this.stateNode = null;     // node DOM untuk host component

  this.return = null;        // parent
  this.child = null;         // anak pertama
  this.sibling = null;       // saudara berikutnya
  this.index = 0;

  this.pendingProps = pendingProps;  // props untuk render ini
  this.memoizedProps = null;         // props dari render terakhir
  this.memoizedState = null;         // untuk function component: linked list hooks
  this.updateQueue = null;

  this.flags = 0;            // efek untuk fiber ini (Placement, Update, ChildDeletion, …)
  this.subtreeFlags = 0;     // gabungan flags seluruh keturunannya
  this.lanes = 0;            // prioritas update yang menunggu di fiber ini
  this.childLanes = 0;       // … dan di keturunannya
  this.alternate = null;     // pasangan di pohon satunya
}
```

Pohonnya bukan array `children`, melainkan tiga pointer: `child`, `sibling`, `return`. Dengan tiga
pointer itu React bisa menelusuri seluruh pohon dengan loop biasa dan bisa berhenti di fiber
mana pun.

### 2. Work loop (`ReactFiberWorkLoop.js`)

Inti React hanya beberapa baris:

```js
function workLoopSync() {
  while (workInProgress !== null) performUnitOfWork(workInProgress);
}

function workLoopConcurrentByScheduler() {
  while (workInProgress !== null && !shouldYield()) performUnitOfWork(workInProgress);
}
```

Bedanya hanya `shouldYield()`. Scheduler memberi React jatah waktu sekitar **5 ms**
(`frameInterval = 5` di package `scheduler`). Kalau jatahnya habis, loop berhenti, `workInProgress`
tetap menunjuk fiber berikutnya, dan Scheduler menjadwalkan lanjutan lewat `MessageChannel` (sebuah
macrotask, lihat [Event Loop](event-loop.md)). Di antara dua potongan itu browser bisa menangani klik
dan melakukan paint.

`performUnitOfWork` menelusuri pohon secara depth-first:

```js
function performUnitOfWork(unitOfWork) {
  const next = beginWork(unitOfWork.alternate, unitOfWork, renderLanes); // turun
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) completeUnitOfWork(unitOfWork); // tidak ada anak: naik
  else workInProgress = next;
}
```

`completeUnitOfWork` menjalankan `completeWork`, lalu pindah ke `sibling`. Kalau tidak ada sibling,
ia naik ke `return` dan menyelesaikan parent. Urutannya untuk `<main><h1/><Counter/></main>`:

```
begin main → begin h1 → complete h1 → begin Counter → begin button → complete button
→ complete Counter → complete main
```

### 3. `beginWork`: render dan bailout (`ReactFiberBeginWork.js`)

`beginWork` memanggil komponenmu (untuk function component lewat `renderWithHooks`) lalu
mencocokkan hasilnya dengan anak-anak lama (*reconciliation*). Sebelum itu ia mengecek apakah
pekerjaan bisa dilewati:

- props sama (`oldProps === newProps`, perbandingan identitas), context tidak berubah, dan
- `fiber.lanes` tidak berisi update untuk render ini.

Kalau semua terpenuhi, React masuk `bailoutOnAlreadyFinishedWork`. Kalau `childLanes` juga kosong,
**seluruh subtree** dilewati. Inilah alasan teknik "pindahkan state ke bawah" dan "`children` sebagai
prop" di [Efisiensi di React](react-efficiency.md) berhasil: elemen `children` punya identitas yang
sama, jadi `oldProps === newProps`.

### 4. Reconciliation anak dan `key` (`ReactChildFiber.js`)

Untuk array anak, `reconcileChildrenArray` pertama-tama berjalan berurutan selama `key` cocok.
Begitu ada yang tidak cocok, sisanya dimasukkan ke `Map`:

```js
function mapRemainingChildren(currentFirstChild) {
  const existingChildren = new Map();
  for (let child = currentFirstChild; child !== null; child = child.sibling)
    existingChildren.set(child.key !== null ? child.key : child.index, child);
  return existingChildren;
}
```

Elemen baru dicari di `Map` itu dengan `key` (atau index kalau tidak ada `key`). Kalau ketemu dan
`type`-nya sama, fiber lama **dipakai ulang** beserta state dan node DOM-nya. Lalu `placeChild`
memutuskan apakah node itu perlu dipindah: fiber yang index lamanya lebih kecil dari
`lastPlacedIndex` diberi flag `Placement`.

Akibatnya `key={index}` di list yang bisa diurutkan ulang membuat React memasangkan state ke item
yang salah: index 0 tetap index 0 walaupun isinya sudah berganti.

### 5. Hooks adalah linked list di fiber (`ReactFiberHooks.js`)

```js
function mountWorkInProgressHook() {
  const hook = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  if (workInProgressHook === null) currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  else workInProgressHook = workInProgressHook.next = hook;
  return workInProgressHook;
}
```

Setiap panggilan `useState`, `useRef`, `useMemo`, dan seterusnya menambah satu node ke list di
`fiber.memoizedState`. Saat re-render, `updateWorkInProgressHook` berjalan di list yang sama
**berdasarkan urutan panggilan**. Hooks tidak punya nama atau id. Kalau satu hook dilewati karena
`if`, semua hook setelahnya membaca state milik hook lain. Itulah *Rules of Hooks*.

### 6. Lanes: prioritas sebagai bitmask (`ReactFiberLane.js`)

Setiap update mendapat **lane**, yaitu satu bit dalam bilangan 31-bit. Bit yang lebih kecil berarti
prioritas lebih tinggi. Nilai di React 19:

| Lane | Nilai | Dipakai untuk |
| --- | --- | --- |
| `SyncLane` | `2` | Event diskret: `click`, `keydown`, `input` |
| `InputContinuousLane` | `8` | Event kontinu: `mousemove`, `scroll`, `pointermove` |
| `DefaultLane` | `32` | Update di luar event (misalnya dari `setTimeout` atau fetch) |
| `TransitionLanes` | `256` … | Update di dalam `startTransition` / `useDeferredValue` |
| `IdleLane` | `268435456` | Pekerjaan idle |
| `OffscreenLane` | `536870912` | Konten tersembunyi (`<Activity>`) |

`requestUpdateLane` memilih lane: kalau sedang di dalam transition, ia mengambil transition lane.
Kalau tidak, lane ditentukan dari jenis `window.event` lewat `getEventPriority`. Karena lane adalah
bit, operasi seperti "gabungkan" (`a | b`), "ambil prioritas tertinggi" (`lanes & -lanes`), dan
"apakah subset" (`(set & subset) === subset`) cukup satu instruksi.

Saat render transition sedang berjalan dan masuk update `SyncLane`, render transition dibuang dan
React mulai lagi dari update mendesak. Render yang dibuang tidak masalah karena render phase murni:
tidak ada yang sudah ditulis ke DOM.

### 7. Commit (`ReactFiberCommitWork.js`)

Setelah seluruh pohon `workInProgress` selesai, `commitRoot` berjalan **sinkron**:

1. **Before mutation:** misalnya `getSnapshotBeforeUpdate`.
2. **Mutation:** menerapkan flags ke DOM (sisip, ubah atribut, hapus), menjalankan cleanup
   `useLayoutEffect`, melepas ref lama. Lalu `root.current = finishedWork`.
3. **Layout:** menjalankan `useLayoutEffect` dan memasang ref. DOM sudah berubah tapi belum di-paint.
4. **Passive:** `useEffect` dijadwalkan lewat Scheduler dan biasanya berjalan setelah browser
   paint (`flushPassiveEffects`).

`subtreeFlags` membuat commit cepat: subtree dengan `subtreeFlags === 0` tidak perlu ditelusuri.

## Eksperimen

Siapkan proyek kecil dengan `react`, `react-dom`, dan `jsdom` (atau jalankan di browser lewat Vite).
Semua hasil di bawah diverifikasi dengan React 19.3.1.

1. **Telusuri pohon fiber dari node DOM.** React menaruh fiber di properti `__reactFiber$<acak>`
   pada setiap node DOM:
   ```js
   const btn = document.querySelector("button");
   let f = btn[Object.keys(btn).find((k) => k.startsWith("__reactFiber$"))];
   while (f) { console.log(f.tag, typeof f.type === "function" ? f.type.name : f.type); f = f.return; }
   ```
   Untuk `<App><main><h1/><Counter/></main></App>` hasilnya
   `5 button → 0 Counter → 5 main → 0 App → 3 (HostRoot)`. Ini properti internal, hanya untuk belajar.
2. **Lihat linked list hooks.** Di fiber `Counter` yang memakai `useState(0)`, `useRef("r")`,
   dan `useTransition()`, jalani `fiber.memoizedState` lewat `.next`. Kamu akan melihat `0`,
   `{ current: "r" }`, `false`, lalu node milik `startTransition`. Coba bungkus `useRef` dengan `if`
   dan lihat error-nya.
3. **Double buffering.** Simpan `fiberRoot.current`, picu satu update, lalu cek
   `fiberRoot.current !== lama` dan `fiberRoot.current.alternate === lama`. Keduanya `true`.
4. **Lanes.** Baca `fiberRoot.pendingLanes` tepat setelah `setState` biasa (di luar event: `32`,
   `DefaultLane`), lalu setelah `startTransition(() => setState(...))`. Hasilnya `258`
   (`0b100000010`): `256` adalah transition lane, dan `2` adalah update optimistik `isPending = true`
   yang dikirim di `SyncLane`. Jelaskan kenapa `isPending` harus mendesak.
5. **Render yang disela.** Buat 3.000 item yang masing-masing lambat 1 ms, difilter oleh input. Rekam
   di panel Performance DevTools dengan dan tanpa `useDeferredValue`. Cari potongan task sekitar 5 ms
   pada versi transition.
6. **`key` yang salah.** Render list `<input>` tak terkontrol dengan `key={index}`, ketik di item
   pertama, lalu balik urutan list. Ganti ke `key={item.id}` dan bandingkan. Hubungkan hasilnya
   dengan `mapRemainingChildren`.

Catat hasil dan kejutannya di [catatan eksperimen](/notes/). Untuk langkah berikutnya, bangun mini
React di proyek latihan tahap 07, lalu bandingkan dengan potongan source di atas.

## Implikasi praktis

- **Render phase harus murni.** Render bisa dijalankan lebih dari sekali, disela, atau dibuang.
  Efek samping di body komponen bisa terjadi dua kali atau untuk UI yang tidak pernah tampil. Strict
  Mode sengaja menjalankan render dua kali supaya masalah ini terlihat.
- **Panggil hooks di urutan yang sama setiap render.** Hooks dicocokkan berdasarkan posisi di linked
  list, bukan nama.
- **Gunakan `key` yang stabil dan unik**, bukan index, untuk list yang bisa berubah urutan. Ganti
  `key` dengan sengaja kalau ingin me-reset state komponen.
- **Bailout bergantung pada identitas props.** Struktur komponen (state dekat pemakainya,
  `children`) sering lebih efektif daripada `memo`.
- **Transition tidak membuat kode lebih cepat.** Transition membuat pekerjaan bisa disela. Kalau satu
  komponen butuh 200 ms untuk render, satu unit kerja itu tetap 200 ms karena React hanya bisa
  berhenti **di antara** fiber.
- **`useLayoutEffect` memblokir paint**, `useEffect` tidak. Pakai layout effect hanya untuk mengukur
  DOM atau mencegah kedipan.

## Sumber primer

- [Source React: `packages/react-reconciler/src`](https://github.com/facebook/react/tree/main/packages/react-reconciler/src),
  terutama `ReactFiber.js`, `ReactFiberWorkLoop.js`, `ReactFiberBeginWork.js`,
  `ReactChildFiber.js`, `ReactFiberHooks.js`, `ReactFiberLane.js`, `ReactFiberCommitWork.js`
- [Source Scheduler](https://github.com/facebook/react/tree/main/packages/scheduler/src)
- Andrew Clark, [*React Fiber Architecture*](https://github.com/acdlite/react-fiber-architecture)
- [React PR #18796: Lanes](https://github.com/facebook/react/pull/18796)
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [react.dev: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) dan
  [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [react.dev: `useTransition`](https://react.dev/reference/react/useTransition)
- Rodrigo Pombo, [*Build your own React*](https://pomb.us/build-your-own-react/)
