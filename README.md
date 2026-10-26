# fet: Front-End Toolkits

Tempat untuk **deep dive front-end**: roadmap yang lengkap, cara belajar tiap tahapnya,
dan toolkit yang bisa langsung di-install di project.

Repo ini tidak berhenti di "apa yang perlu dipelajari". Tiap topik menjawab empat hal:

1. **Kenapa** topik ini penting dan masalah apa yang diselesaikannya.
2. **Bagaimana** cara mempelajarinya, berurutan, dengan latihan yang terukur.
3. **Seberapa paham**: pertanyaan uji yang tidak bisa dijawab hanya dengan hafalan.
4. **Bangun dari nol**: membuat ulang alatnya (mini React, mini bundler, dll.) sampai paham isinya.

## Peta repo

```
fet/
├── docs/
│   ├── roadmap/        # 20 tahap dalam 8 fase, mulai dari sini
│   ├── deep-dives/     # topik yang lebih dalam dari roadmap (browser internals, dll.)
│   ├── notes/          # catatan eksperimen & pengukuran pribadi
│   ├── templates/      # template untuk menulis topik baru
│   └── how-to-learn.md # metode belajar yang dipakai di seluruh repo
├── packages/           # toolkit yang bisa di-install (npm)
│   └── utils/          # @chalidade/utils: debounce, throttle, cx, clamp
└── apps/               # (rencana) situs dokumentasi & playground komponen
```

## Mulai dari mana?

- **Baru mulai / ingin mengisi celah:** baca [metode belajar](docs/how-to-learn.md), lalu [peta roadmap](docs/roadmap/README.md).
- **Sudah berpengalaman:** loncat ke bagian *Uji pemahaman* di setiap tahap. Topik yang
  pertanyaannya tidak bisa kamu jawab dengan yakin adalah tempat untuk deep dive.
- **Butuh toolkit:** lihat [`packages/`](packages).

## Toolkit (packages)

| Package | Isi | Status |
| --- | --- | --- |
| [`@chalidade/utils`](packages/utils) | `debounce`, `throttle`, `cx`, `clamp` | ✅ siap, belum dipublish |
| `@chalidade/tokens` | Design tokens (warna, spacing, tipografi) sebagai CSS variables + TS | 🗓️ rencana |
| `@chalidade/react-hooks` | `useDebounce`, `useMediaQuery`, `useIntersectionObserver`, … | 🗓️ rencana |
| `@chalidade/ui` | Komponen aksesibel (Button, Dialog, Tabs, Combobox, …) | 🗓️ rencana |

> Semua package dipublish di bawah scope npm `@chalidade/*`. Belum ada yang dipublish ke npm.

## Pengembangan

```bash
pnpm install
pnpm test        # vitest di semua package
pnpm typecheck
pnpm build       # tsup → ESM + CJS + .d.ts
pnpm changeset   # catat perubahan sebelum rilis
```

Referensi awal roadmap: [roadmap.sh/frontend](https://roadmap.sh/frontend). Struktur dan isinya
diperluas dengan lapisan deep dive, latihan, dan sumber primer (spesifikasi WHATWG, ECMA-262, CSSWG).

## Lisensi

MIT © Chalid Ade Rahman
