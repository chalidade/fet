# 12 · TypeScript

> **Phase:** 4 · **Estimate:** 3–4 weeks · **Prerequisites:** [04 JavaScript](04-javascript.md)

## Why it matters

TypeScript is the de facto standard for professional front-end work. The basics (type annotations) are
easy. The real value is in **designing types** so invalid states can't be represented, and so a
library's API feels "magical" to its users.

## Concept map

### Basics
- [ ] Primitive types, unions, intersections, literal types
- [ ] Interfaces vs type aliases
- [ ] Basic generics
- [ ] `tsconfig`: `strict`, `target`, `module`, `moduleResolution`

### Intermediate
- [ ] Narrowing: `typeof`, `in`, discriminated unions, type predicates, `asserts`
- [ ] Utility types: `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`
- [ ] `unknown` vs `any` vs `never`
- [ ] `satisfies`, `as const`, const type parameters
- [ ] Typing React components (generic props, polymorphic `as`)

### Deep dive
- [ ] Conditional types, `infer`, distributive conditional types
- [ ] Mapped types and key remapping
- [ ] Template literal types
- [ ] Variance, structural typing, and soundness holes
- [ ] Type checker performance, project references, `isolatedDeclarations`

## How to learn

1. Finish the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).
2. Work through [type-challenges](https://github.com/type-challenges/type-challenges) from easy → medium → hard.
3. Rewrite one module with `strict` + `noUncheckedIndexedAccess` and note the bugs you find.
4. Read the `.d.ts` files of a library whose API you like (Zod, TanStack Query).

## Check your understanding

1. Why can `string[]` be assigned to `readonly string[]` but not the other way around?
2. What is a distributive conditional type, and when do you need `[T] extends [U]`?
3. How do discriminated unions remove the need for `undefined` checks?
4. Why is TypeScript unsound, and where are the holes?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | Migrate a JS project to strict TS | Basics |
| Intermediate | A typed API client generated from an OpenAPI schema | Generics, inference |
| Deep | A mini Zod-style validator with type inference (`z.infer`) | Conditional & mapped types |

## Primary sources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [type-challenges](https://github.com/type-challenges/type-challenges)
- [Matt Pocock: Total TypeScript](https://www.totaltypescript.com/)

## Related toolkit

- Every package in this repo is written in strict TS. See [`tsconfig.base.json`](https://github.com/chalidade/front-end-training/blob/main/tsconfig.base.json)
