# Metode Belajar

Untuk programmer berpengalaman, masalahnya biasanya bukan "tidak tahu", tapi **tahu cara
pakai tanpa tahu cara kerja**. Metode di bawah dirancang untuk menutup celah itu.

## 1. Empat tingkat pemahaman

Setiap konsep di roadmap bisa dinilai dengan skala ini. Targetnya tingkat 3 untuk topik inti
dan tingkat 4 untuk topik yang ingin kamu kuasai betul.

| Tingkat | Ciri | Cara membuktikan |
| --- | --- | --- |
| 1. Pakai | Bisa memakai API/alatnya mengikuti dokumentasi | Membuat fitur yang jalan |
| 2. Jelaskan | Bisa menjelaskan *kenapa* desainnya begitu dan trade-off-nya | Menulis penjelasan tanpa membuka referensi |
| 3. Debug | Bisa memprediksi perilaku di kasus tepi dan memperbaiki bug yang aneh | Menjawab *Uji pemahaman* dan membuktikannya dengan eksperimen |
| 4. Bangun | Bisa membuat ulang versi kecilnya dari nol | Proyek "bangun dari nol" di tiap tahap |

## 2. Siklus belajar per topik

1. **Baca peta konsep** di halaman tahap. Centang yang sudah kamu kuasai sampai tingkat 2.
2. **Jawab Uji pemahaman dulu, sebelum belajar.** Tulis jawabanmu di `docs/notes/`. Jawaban
   yang ragu menandai bagian yang perlu dipelajari.
3. **Pelajari dari sumber primer.** Spesifikasi (WHATWG, ECMA-262, CSSWG), MDN, dan source code
   alatnya. Artikel dan video hanya sebagai pengantar.
4. **Buktikan dengan eksperimen.** Setiap klaim yang penting diuji dengan kode kecil, DevTools,
   atau pengukuran. Simpan eksperimennya.
5. **Bangun dari nol.** Kerjakan proyek latihan tingkat "deep" di halaman tahap.
6. **Ajarkan.** Rekam video penjelasan 3–5 menit di [Ruang Belajar](/ruang-belajar), bagikan ke
   [Komunitas](/komunitas/), atau jadikan toolkit di `packages/`.

## 3. Kenapa catatan pribadi penting

AI dan artikel bisa menjelaskan *rata-rata* pengetahuan yang sudah ditulis orang. Yang tidak
dimiliki keduanya adalah **hasil eksperimen dan pengukuranmu sendiri**: berapa ms layout thrash di
aplikasi kantormu, bug browser yang kamu temukan, keputusan arsitektur dan akibatnya enam bulan
kemudian. Itu yang membuat pemahamanmu melampaui rata-rata. Simpan di `docs/notes/` dengan
format:

```
docs/notes/YYYY-MM-DD-judul-singkat.md
- Pertanyaan: ...
- Hipotesis: ...
- Eksperimen: (kode / langkah / link)
- Hasil: (angka, screenshot)
- Kesimpulan & hal yang mengejutkan: ...
```

## 4. Ritme yang disarankan

- **Harian (30–60 menit):** satu konsep dari peta, satu eksperimen kecil.
- **Mingguan:** satu pertanyaan *Uji pemahaman* dijawab tuntas, satu catatan di `docs/notes/`.
- **Per tahap (2–6 minggu):** satu proyek latihan selesai, satu util/komponen masuk `packages/`.

## 5. Aturan main

- Jangan melompati Fase 1 meskipun sudah lama bekerja. Baca cepat, tapi jawab *Uji pemahaman*-nya.
- Satu framework dikuasai dalam, sisanya cukup paham perbedaannya.
- Kalau tidak bisa menjelaskannya tanpa membuka referensi, berarti belum paham.
