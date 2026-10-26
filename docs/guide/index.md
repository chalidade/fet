# Apa itu fet?

**fet (Front-End Toolkits)** adalah tempat belajar front-end **sampai ke dalam**. Isinya tiga hal:

1. **Roadmap**: urutan topik front-end dari dasar sampai lanjut, dalam [20 tahap dan 8 fase](/roadmap/).
2. **Panduan belajar per tahap**: bukan hanya *apa* yang dipelajari, tapi *bagaimana*
   mempelajarinya dan *bagaimana tahu kamu sudah paham*.
3. **Toolkit**: package npm kecil yang bisa langsung dipakai di project, sekaligus jadi contoh
   kode untuk dipelajari.

## Untuk siapa?

| Kamu adalah… | Mulai dari |
| --- | --- |
| **Baru belajar front-end** | [Metode belajar](/how-to-learn), lalu [Fase 1](/roadmap/01-internet) secara berurutan |
| **Developer berpengalaman** yang merasa belum benar-benar paham cara kerjanya | Bagian **Uji pemahaman** di tiap tahap. Pertanyaan yang tidak bisa kamu jawab dengan yakin adalah tempat untuk deep dive |
| **Butuh util/komponen siap pakai** | [Toolkit](/toolkit/) |
| **Mentor atau tech lead** | Pakai roadmap dan uji pemahaman sebagai kurikulum onboarding tim |

## Apa bedanya dengan roadmap lain?

Roadmap populer seperti [roadmap.sh](https://roadmap.sh/frontend) memberi tahu **apa** yang perlu
dipelajari. fet memakai roadmap itu sebagai titik awal, lalu menambahkan:

- **Peta konsep bertingkat** (Dasar → Menengah → Deep dive) supaya jelas kapan sebuah topik
  "cukup" dan kapan perlu digali lagi.
- **Langkah belajar yang konkret**, biasanya dengan DevTools atau eksperimen kecil, bukan sekadar daftar link.
- **Uji pemahaman**: pertanyaan yang menguji pemahaman mekanisme, bukan hafalan API.
- **Proyek "bangun dari nol"**: membuat ulang alat yang biasa dipakai (mini React, mini bundler,
  Promise) sampai paham isinya.
- **Sumber primer**: spesifikasi (WHATWG, ECMA-262, CSSWG), dokumentasi resmi, dan source code.

## Struktur setiap tahap

Semua halaman roadmap memakai format yang sama, jadi kamu selalu tahu harus mencari di mana:

| Bagian | Isi |
| --- | --- |
| **Kenapa ini penting** | Masalah yang diselesaikan dan akibatnya kalau tidak dipahami |
| **Peta konsep** | Checklist Dasar / Menengah / Deep dive |
| **Cara belajar** | Langkah berurutan dengan latihan kecil |
| **Uji pemahaman** | Pertanyaan untuk mengukur seberapa dalam kamu paham |
| **Proyek latihan** | Proyek tingkat Dasar, Menengah, dan Deep (bangun dari nol) |
| **Sumber primer** | Spesifikasi, dokumentasi resmi, buku, source code |
| **Toolkit terkait** | Package di repo ini yang berhubungan dengan topik tersebut |

## Cara memakai situs ini

1. Baca [Metode belajar](/how-to-learn) (5 menit). Di sana dijelaskan 4 tingkat pemahaman yang dipakai di seluruh situs.
2. **Masuk** (tombol di kanan atas) dengan GitHub atau Google supaya progresmu tersimpan.
3. Buka [Peta roadmap](/roadmap/) dan pilih tahap yang sesuai, lalu klik **Mulai belajar**.
4. Di **Ruang Belajar**, untuk setiap tahap:

| Langkah | Di mana | Hasilnya |
| --- | --- | --- |
| 1. Baca materi dan jawab *Uji pemahaman* | Halaman tahap | Tahu bagian mana yang belum paham |
| 2. Kerjakan latihan dan eksperimen | Tab **Kode** (editor + preview langsung) | Kode latihan tersimpan di akunmu |
| 3. Tulis catatan | Tab **Catatan** | Catatan pertanyaan → eksperimen → kesimpulan |
| 4. Rekam video penjelasan 3–5 menit | Tab **Video penjelasan** | Video di Google Drive-mu, bukti belajar yang bisa diputar ulang |
| 5. Bagikan ke komunitas | Tab **Bagikan** | Postingan di [Komunitas](/komunitas/) yang bisa dikomentari orang lain |
| 6. Tandai **Selesai** | Pilihan *Status* | Progres terlihat di [profilmu](/profil) |

::: tip Kenapa harus merekam video?
Menjelaskan dengan kata-kata sendiri adalah tes pemahaman yang paling jujur (teknik Feynman).
Kalau macet saat menjelaskan, berarti ada bagian yang perlu dipelajari lagi. Videonya juga jadi
arsip pribadi: saat lupa, kamu tinggal memutar penjelasanmu sendiri.
:::

## Data kamu milik kamu

- **Video** dan ekspor catatan disimpan di **Google Drive milikmu** (folder `fet-belajar/`). fet
  hanya bisa mengakses file yang dibuatnya sendiri.
- **Progres, catatan, dan kode** disimpan di akunmu. Catatan dan kode bersifat privat, kecuali kamu
  membagikannya lewat postingan.
- Kapan saja kamu bisa mengunduh semuanya sebagai `.zip` dari Ruang Belajar.

## Isi repository

```
fet/
├── docs/              # situs ini (VitePress), Bahasa Indonesia + English (docs/en)
│   ├── roadmap/       # 20 tahap dalam 8 fase
│   ├── deep-dives/    # topik yang lebih dalam dari roadmap
│   ├── toolkit/       # dokumentasi package
│   └── notes/         # catatan eksperimen pribadi
└── packages/          # toolkit yang bisa di-install dari npm
    └── utils/         # @chalidade/utils
```

## Kontribusi

Menemukan kesalahan atau ingin menambah materi? Klik **"Perbaiki halaman ini di GitHub"** di bawah
setiap halaman, atau buka issue di [github.com/chalidade/fet](https://github.com/chalidade/fet).
