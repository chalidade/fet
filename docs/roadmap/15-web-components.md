# 15 · Web Components

> **Fase:** 5 · **Estimasi:** 1 minggu · **Prasyarat:** [04 JavaScript](04-javascript.md)

## Kenapa ini penting

Web Components adalah model komponen bawaan browser yang bekerja di framework apa pun. Cocok untuk
design system lintas tim dan widget yang di-embed. Mempelajarinya juga menjelaskan masalah yang
diselesaikan framework.

## Peta konsep

### Dasar
- [ ] Custom Elements: `customElements.define`, lifecycle callback
- [ ] Shadow DOM: encapsulation, `slot`
- [ ] HTML Templates: `<template>`

### Menengah
- [ ] Styling: `:host`, `::slotted`, `::part`, CSS custom properties menembus shadow boundary
- [ ] Form-associated custom elements (`ElementInternals`)
- [ ] Declarative Shadow DOM untuk SSR
- [ ] Lit sebagai library ringan

### Deep dive
- [ ] Event retargeting dan `composed`
- [ ] Aksesibilitas lintas shadow root (masalah `aria-labelledby` dan ID)
- [ ] Interop dengan React 19

## Cara belajar

1. Buat `<fet-counter>` tanpa library apa pun, lalu buat ulang dengan Lit.
2. Pakai komponen itu di React, Vue, dan HTML biasa.
3. Coba buat input kustom yang ikut ter-submit di `<form>` native.

## Uji pemahaman

1. Kenapa event dari dalam shadow DOM terlihat berasal dari host element?
2. Apa yang bisa dan tidak bisa menembus shadow boundary dalam hal styling?
3. Kapan Web Components lebih tepat daripada komponen framework?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | `<fet-tabs>` vanilla dengan keyboard navigation | Custom elements |
| Menengah | Form-associated `<fet-rating>` | ElementInternals |
| Deep | Mini library ala Lit: reactive properties + template rendering | Reactivity, templating |

## Sumber primer

- [HTML spec: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [DOM spec: Shadow tree](https://dom.spec.whatwg.org/#shadow-trees)
- [Lit docs](https://lit.dev/docs/)

## Toolkit terkait

- (rencana) `@chalidade/elements`: versi Web Components dari komponen `@chalidade/ui`
- Deep dive: [Accessibility tree](../deep-dives/accessibility-tree.md) (role dan nama untuk custom element)
