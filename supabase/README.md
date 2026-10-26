# Setup platform komunitas (Supabase + Google Drive)

Situs fet tetap statis (GitHub Pages). Fitur komunitas memakai:

- **Supabase**: login (GitHub/Google), profil, progres, catatan & kode, postingan, komentar, reaksi.
  Semua akses dibatasi oleh Row Level Security di [`migrations/`](migrations).
- **Google Drive milik user**: video penjelasan dan ekspor catatan/kode. Situs hanya meminta izin
  `drive.file`, jadi hanya bisa mengakses file yang dibuatnya sendiri.

Konfigurasi publik ada di [`docs/.env`](../docs/.env). URL dan publishable key Supabase memang
dirancang untuk dipakai di browser. **Jangan pernah menaruh `service_role` / secret key di repo.**

## 1. Database

1. Buka Supabase → **SQL Editor** → **New query**.
2. Tempel isi [`migrations/20261026000000_init.sql`](migrations/20261026000000_init.sql), lalu klik **Run**.
3. Cek di **Table Editor**: tabel `profiles`, `stage_progress`, `stage_work`, `posts`, `comments`,
   `reactions`, dan view `posts_feed`, `stage_stats` sudah ada.

Alternatif dengan CLI: `supabase link --project-ref bqyvtheczekghopzzgyo && supabase db push`.

## 2. URL situs dan redirect login

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://chalidade.github.io/fet/`
- **Redirect URLs** (tambahkan keduanya):
  - `https://chalidade.github.io/fet/**`
  - `http://localhost:5173/**` (untuk `pnpm docs:dev`)

## 3. Login dengan GitHub

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: `https://chalidade.github.io/fet/`
   - Authorization callback URL: `https://bqyvtheczekghopzzgyo.supabase.co/auth/v1/callback`
2. Salin **Client ID**, buat **Client secret**.
3. Supabase → **Authentication → Sign In / Providers → GitHub** → aktifkan, tempel Client ID dan secret.

## 4. Login dengan Google (opsional)

1. [Google Cloud Console](https://console.cloud.google.com/) → buat project (misalnya `fet`).
2. **APIs & Services → OAuth consent screen**: tipe *External*, isi nama aplikasi dan email.
3. **Credentials → Create credentials → OAuth client ID** → tipe *Web application*:
   - Authorized redirect URI: `https://bqyvtheczekghopzzgyo.supabase.co/auth/v1/callback`
4. Supabase → **Authentication → Sign In / Providers → Google** → tempel Client ID dan secret.

## 5. Simpan video ke Google Drive

Ini OAuth client terpisah, dipakai langsung dari browser (tanpa secret).

1. Di project Google Cloud yang sama: **APIs & Services → Library → Google Drive API → Enable**.
2. **OAuth consent screen → Data access / Scopes**: tambahkan
   `https://www.googleapis.com/auth/drive.file` (scope non-sensitif).
3. **Credentials → Create credentials → OAuth client ID** → *Web application*:
   - Authorized JavaScript origins: `https://chalidade.github.io` dan `http://localhost:5173`
4. Salin Client ID ke `VITE_GOOGLE_CLIENT_ID` di [`docs/.env`](../docs/.env), commit, dan push.
5. Selama consent screen masih berstatus *Testing*, hanya akun yang ditambahkan sebagai
   *Test users* yang bisa memakai fitur ini. Klik **Publish app** saat siap dipakai umum.

Tanpa langkah 5, Ruang Belajar tetap bisa merekam video. User mengunduh video lalu menempel link
Drive/YouTube secara manual saat berbagi.

## Menguji di lokal

```bash
pnpm install
pnpm docs:dev   # http://localhost:5173/fet/
```
