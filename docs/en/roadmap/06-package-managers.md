# 06 · Package Managers

> **Phase:** 2 · **Estimate:** 1 week · **Prerequisites:** [04 JavaScript](04-javascript.md)

## Why it matters

`node_modules` is the largest chunk of code you ship to production, and also your largest attack
surface (the supply chain). Understanding how package managers resolve dependencies explains "works on
my machine" bugs and duplicate packages in your bundle.

## Concept map

### Basics
- [ ] npm, pnpm, yarn: basic commands and how they differ
- [ ] `package.json`: `dependencies`, `devDependencies`, `peerDependencies`, `scripts`
- [ ] Semantic versioning, `^` vs `~`
- [ ] Lockfiles and why they must be committed

### Intermediate
- [ ] Hoisting and phantom dependencies
- [ ] pnpm's `node_modules` layout (symlinks + a content-addressable store)
- [ ] Workspaces and monorepos
- [ ] The `exports`, `main`, `module`, `types`, and `sideEffects` fields
- [ ] `npx`/`pnpm dlx`, `corepack`

### Deep dive
- [ ] Node's resolution algorithm (`require.resolve`, conditional exports)
- [ ] The dual package hazard (ESM + CJS)
- [ ] Supply chain security: lifecycle scripts, provenance, `npm audit`, lockfile-lint
- [ ] Publishing: `files`, `prepublishOnly`, npm provenance, changesets

## How to learn

1. Install the same package with npm and pnpm, then compare the `node_modules` structure with `tree -L 2`.
2. Create a phantom dependency on purpose (use a package that isn't in `package.json`) and see how pnpm rejects it.
3. Read the `package.json` of 3 popular libraries (React, Vue, date-fns) and explain every `exports` field.
4. Publish a test package to a local registry ([Verdaccio](https://verdaccio.org/)).

## Check your understanding

1. How can two versions of React end up in the same bundle, and what happens when they do?
2. When should a dependency be a `peerDependency`?
3. What is the dual package hazard, and how do you avoid it?
4. Why does `pnpm` use less disk space than npm?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | Set up a pnpm monorepo with two packages that depend on each other | Workspaces |
| Intermediate | Publish an ESM+CJS library with correct types, checked with [arethetypeswrong](https://arethetypeswrong.github.io/) | `exports`, publishing |
| Deep | Write a simple resolver that mimics Node's resolution algorithm for `exports` | Module resolution |

## Primary sources

- [Node.js: Modules: Packages](https://nodejs.org/api/packages.html)
- [pnpm: Motivation](https://pnpm.io/motivation) and [Symlinked node_modules structure](https://pnpm.io/symlinked-node-modules-structure)
- [npm docs: package.json](https://docs.npmjs.com/cli/configuring-npm/package-json)

## Related toolkit

- This repo is an example pnpm monorepo. See [`packages/utils/package.json`](https://github.com/chalidade/fet/blob/main/packages/utils/package.json)
