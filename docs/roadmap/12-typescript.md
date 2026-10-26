# 12 · TypeScript

> **Fase:** 4 · **Estimasi:** 3–4 minggu · **Prasyarat:** [04 JavaScript](04-javascript.md)

## Kenapa ini penting

TypeScript adalah standar de facto untuk front-end profesional. Level dasarnya (anotasi tipe)
mudah. Nilai sebenarnya ada di **mendesain tipe** sehingga state yang tidak valid tidak bisa
direpresentasikan, dan API library terasa "ajaib" bagi pemakainya.

## Peta konsep

### Dasar
- [ ] Tipe primitif, union, intersection, literal types
- [ ] Interface vs type alias
- [ ] Generics dasar
- [ ] `tsconfig`: `strict`, `target`, `module`, `moduleResolution`

### Menengah
- [ ] Narrowing: `typeof`, `in`, discriminated union, type predicate, `asserts`
- [ ] Utility types: `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`
- [ ] `unknown` vs `any` vs `never`
- [ ] `satisfies`, `as const`, const type parameters
- [ ] Mengetik komponen React (props generik, polymorphic `as`)

### Deep dive
- [ ] Conditional types, `infer`, distributive conditional types
- [ ] Mapped types dan key remapping
- [ ] Template literal types
- [ ] Variance, structural typing, dan soundness holes
- [ ] Performa type checker, project references, `isolatedDeclarations`

## Cara belajar

1. Selesaikan [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).
2. Kerjakan [type-challenges](https://github.com/type-challenges/type-challenges) tingkat easy → medium → hard.
3. Tulis ulang satu modul dengan `strict` + `noUncheckedIndexedAccess`, dan catat bug yang ditemukan.
4. Baca file `.d.ts` dari library yang API-nya kamu sukai (Zod, TanStack Query).

## Uji pemahaman

1. Kenapa `string[]` bisa di-assign ke `readonly string[]` tapi tidak sebaliknya?
2. Apa itu distributive conditional type, dan kapan `[T] extends [U]` diperlukan?
3. Bagaimana discriminated union menghilangkan kebutuhan cek `undefined`?
4. Kenapa TypeScript tidak sound, dan di mana saja lubangnya?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Migrasi project JS ke TS strict | Dasar |
| Menengah | Typed API client dari skema OpenAPI | Generics, inference |
| Deep | Mini validator ala Zod dengan inference tipe (`z.infer`) | Conditional & mapped types |

## Sumber primer

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [type-challenges](https://github.com/type-challenges/type-challenges)
- [Matt Pocock: Total TypeScript](https://www.totaltypescript.com/)

## Toolkit terkait

- Semua package di repo ini ditulis dengan TS strict, lihat [`tsconfig.base.json`](https://github.com/chalidade/fet/blob/main/tsconfig.base.json)
