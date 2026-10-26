# 20 · Mobile & Desktop Apps

> **Fase:** 8 · **Estimasi:** 2 minggu (eksplorasi) · **Prasyarat:** [07 Framework](07-framework.md)

## Kenapa ini penting

Skill front-end bisa dipakai di luar browser. Tiap pendekatan punya trade-off antara performa,
ukuran aplikasi, akses ke API native, dan berapa banyak kode yang bisa dipakai ulang.

## Peta konsep

### Mobile
- [ ] React Native (Expo): bridge vs New Architecture (JSI, Fabric)
- [ ] Flutter: Dart, rendering sendiri (Impeller)
- [ ] Ionic / Capacitor: web di dalam WebView
- [ ] PWA sebagai alternatif

### Desktop
- [ ] Electron: Chromium + Node, main vs renderer process, IPC
- [ ] Tauri: WebView sistem + Rust, ukuran kecil
- [ ] Flutter desktop

### Deep dive
- [ ] Keamanan Electron: `contextIsolation`, `sandbox`, preload script
- [ ] Bagaimana React Native memetakan komponen ke native view
- [ ] Code sharing web ↔ mobile (monorepo, React Native Web)

## Cara belajar

1. Bangun aplikasi todo yang sama dengan Expo, Capacitor, dan Tauri. Bandingkan ukuran build, waktu start, dan rasa pakainya.
2. Baca dokumentasi keamanan Electron dan audit satu aplikasi Electron open source.

## Uji pemahaman

1. Kenapa aplikasi Electron besar dan boros memori, dan bagaimana Tauri menghindarinya?
2. Apa yang diselesaikan New Architecture React Native dibanding bridge lama?
3. Kapan PWA cukup dan kapan butuh aplikasi native?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Aplikasi Expo yang memakai kamera dan notifikasi | React Native |
| Menengah | Aplikasi desktop Tauri yang membaca file lokal | Tauri, IPC |
| Deep | Monorepo yang berbagi logika dan design tokens antara web dan React Native | Code sharing |

## Sumber primer

- [React Native: Architecture](https://reactnative.dev/architecture/overview)
- [Electron: Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Tauri docs](https://tauri.app/)

## Toolkit terkait

- (rencana) `@chalidade/tokens` dirancang agar bisa dipakai di web dan React Native
