# 06 · Package Managers

> **Fase:** 2 · **Estimasi:** 1 minggu · **Prasyarat:** [04 JavaScript](04-javascript.md)

## Kenapa ini penting

`node_modules` adalah bagian terbesar dari kode yang kamu kirim ke production, dan juga permukaan
serangan terbesar (supply chain). Memahami cara package manager me-resolve dependensi menjelaskan
bug "di mesin saya jalan" dan duplikasi package di bundle.

## Peta konsep

### Dasar
- [ ] npm, pnpm, yarn: perintah dasar dan perbedaannya
- [ ] `package.json`: `dependencies`, `devDependencies`, `peerDependencies`, `scripts`
- [ ] Semantic versioning, `^` vs `~`
- [ ] Lockfile dan kenapa harus di-commit

### Menengah
- [ ] Hoisting dan phantom dependencies
- [ ] Struktur `node_modules` pnpm (symlink + content-addressable store)
- [ ] Workspaces dan monorepo
- [ ] Field `exports`, `main`, `module`, `types`, `sideEffects`
- [ ] `npx`/`pnpm dlx`, `corepack`

### Deep dive
- [ ] Algoritma resolusi Node (`require.resolve`, conditional exports)
- [ ] Dual package hazard (ESM + CJS)
- [ ] Supply chain security: lifecycle scripts, provenance, `npm audit`, lockfile-lint
- [ ] Publishing: `files`, `prepublishOnly`, npm provenance, changesets

## Cara belajar

1. Install package yang sama dengan npm dan pnpm, lalu bandingkan struktur `node_modules` dengan `tree -L 2`.
2. Buat phantom dependency dengan sengaja (pakai package yang tidak ada di `package.json`), dan lihat
   bagaimana pnpm menolaknya.
3. Baca `package.json` dari 3 library populer (React, Vue, date-fns) dan jelaskan setiap field `exports`-nya.
4. Publish package percobaan ke registry lokal ([Verdaccio](https://verdaccio.org/)).

## Uji pemahaman

1. Kenapa dua versi React bisa masuk ke bundle yang sama, dan apa akibatnya?
2. Kapan sebuah dependency harus jadi `peerDependency`?
3. Apa itu dual package hazard dan bagaimana menghindarinya?
4. Kenapa `pnpm` lebih hemat disk dibanding npm?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Setup monorepo pnpm dengan dua package yang saling bergantung | Workspaces |
| Menengah | Publish library ESM+CJS dengan types yang benar, cek dengan [arethetypeswrong](https://arethetypeswrong.github.io/) | `exports`, publishing |
| Deep | Tulis resolver sederhana yang meniru algoritma resolusi Node untuk `exports` | Resolusi modul |

## Sumber primer

- [Node.js: Modules: Packages](https://nodejs.org/api/packages.html)
- [pnpm: Motivation](https://pnpm.io/motivation) dan [Symlinked node_modules structure](https://pnpm.io/symlinked-node-modules-structure)
- [npm docs: package.json](https://docs.npmjs.com/cli/configuring-npm/package-json)

## Toolkit terkait

- Repo ini adalah contoh monorepo pnpm. Lihat [`packages/utils/package.json`](https://github.com/chalidade/front-end-training/blob/main/packages/utils/package.json)
