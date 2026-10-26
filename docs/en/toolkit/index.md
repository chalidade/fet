# Toolkit

The toolkits are small npm packages that grow out of the roadmap material. Each package has two goals:

1. **To be used** in real projects: small, dependency-free, and fully typed.
2. **To be studied**: the source is deliberately short and readable, and every function links to
   the roadmap stage that explains the concept behind it.

## Packages

| Package | Contents | Status |
| --- | --- | --- |
| [`@chalidade/utils`](/en/toolkit/utils) | `debounce`, `throttle`, `cx`, `clamp` | ✅ ready, not yet published to npm |
| `@chalidade/tokens` | Design tokens (color, spacing, typography) as CSS variables + TS | 🗓️ planned |
| `@chalidade/react-hooks` | `useDebounce`, `useMediaQuery`, `useIntersectionObserver`, … | 🗓️ planned |
| `@chalidade/ui` | Accessible components (Button, Dialog, Tabs, Combobox, …) | 🗓️ planned |

## Principles

- **No runtime dependencies** wherever possible.
- **Tree-shakeable**: ESM + `sideEffects: false`.
- **Tested**: every function has tests (Vitest).
- **Accessible**: UI components follow the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).

## Developing locally

```bash
git clone https://github.com/chalidade/fet
cd fet
pnpm install
pnpm test        # run all tests
pnpm build       # build ESM + CJS + .d.ts
pnpm docs:dev    # run this documentation site locally
```
