# @chalidade/learn-theme

Tema VitePress untuk situs belajar bergaya [fet](https://chalidade.github.io/fet/): Ruang Belajar
(editor kode + preview, catatan, rekam video ke Google Drive), komunitas, profil, halaman Bukti
Belajar, dan checklist konsep di setiap halaman tahap roadmap. Datanya disimpan di Supabase, jadi
beberapa situs (misalnya roadmap front-end dan back-end) bisa memakai akun dan komunitas yang sama.

> Belum dipublish ke npm. Di monorepo ini dipakai lewat `workspace:*`.

## Pemakaian

```ts
// docs/.vitepress/theme/index.ts
import { createLearnTheme } from "@chalidade/learn-theme";
import { phases, stages } from "../stages";
import { data as concepts } from "../concepts.data";

export default createLearnTheme({
  siteName: "bet",
  subject: { id: "back-end", en: "back-end" },
  stages,   // [{ slug: "be-01-http", title: "HTTP" }, …]
  phases,   // [{ id: "Fase 1 · …", en: "Phase 1 · …", range: [0, 4] }, …]
  concepts,
});
```

```ts
// docs/.vitepress/concepts.data.ts
import { fileURLToPath } from "node:url";
import { readConcepts, type ConceptData } from "@chalidade/learn-theme/node";
import { stages } from "./stages";

declare const data: ConceptData;
export { data };

export default {
  watch: ["../roadmap/*.md", "../en/roadmap/*.md"],
  load: () =>
    readConcepts(
      { id: fileURLToPath(new URL("../roadmap/", import.meta.url)), en: fileURLToPath(new URL("../en/roadmap/", import.meta.url)) },
      stages.map((s) => s.slug),
    ),
};
```

```ts
// docs/.vitepress/config.mts
import { taskList } from "@chalidade/learn-theme/markdown";

export default defineConfig({
  markdown: { config: (md) => md.use(taskList) },
  // Paket ini dikirim sebagai source (.ts/.vue), jadi jangan di-externalize saat SSR.
  vite: { ssr: { noExternal: ["@chalidade/learn-theme"] } },
});
```

Halaman yang dibutuhkan (dengan `layout: page`): `ruang-belajar.md`, `komunitas/index.md`,
`komunitas/post.md`, `profil.md`, `bukti-belajar.md`, dan padanannya di `en/`. Lihat folder `docs/`
di repo fet sebagai contoh.

## Konfigurasi

| Variabel | Isi |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Project Supabase (publishable key saja) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID untuk simpan ke Google Drive (opsional) |

Kalau beberapa situs memakai project Supabase yang sama, beri prefix pada slug tahap situs lain
(`be-01-http`) supaya progresnya tidak bentrok, dan jalankan migrasi
`20261029000000_stage_slug_prefix.sql`. Tambahkan URL situs baru ke **Redirect URLs** Supabase dan
**Authorized JavaScript origins** Google.
