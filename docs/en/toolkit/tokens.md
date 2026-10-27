# @chalidade/tokens

Design tokens: a single source of values for color, spacing, radius, typography, shadow, motion,
breakpoints, and z-index. Use them as **TypeScript objects** or as **CSS variables** (with dark
mode included).

```bash
pnpm add @chalidade/tokens
```

::: warning Not published yet
This package isn't on npm yet. For now, copy the source from
[GitHub](https://github.com/chalidade/front-end-training/tree/main/packages/tokens/src).
:::

## Why design tokens?

Without tokens, values like `#4f46e5` or `12px` end up scattered across hundreds of places.
Rebranding or adding dark mode means finding and replacing them one by one. Tokens split this
into two layers:

| Layer | Example | Used by |
| --- | --- | --- |
| **Primitive** | `color.indigo[600]`, `space[4]` | Only semantic tokens |
| **Semantic** | `theme.light.primary`, `theme.dark.bg` | Components |

Components only know "primary color" or "background", never the hex value. Dark mode just
swaps the semantic values.

## Using CSS variables

```ts
import "@chalidade/tokens/tokens.css";
```

```css
.button {
  background: var(--fet-theme-primary);
  color: var(--fet-theme-on-primary);
  border-radius: var(--fet-radius-md);
  padding: var(--fet-space-2) var(--fet-space-4);
  transition: background var(--fet-motion-duration-fast) var(--fet-motion-easing-standard);
}
.button:hover { background: var(--fet-theme-primary-hover); }
```

Dark mode follows `prefers-color-scheme` automatically. To force it, set `data-theme="dark"` or
`data-theme="light"` on `<html>` or any element.

## Using them in TypeScript / CSS-in-JS

```ts
import { breakpoint, space, themeVar } from "@chalidade/tokens";

const styles = {
  padding: space[4],                 // "1rem"
  color: themeVar("fgMuted"),        // "var(--fet-theme-fg-muted)"
};
const isWide = window.matchMedia(`(min-width: ${breakpoint.md}px)`).matches;
```

## Generating CSS with your own prefix

```ts
import { toCss } from "@chalidade/tokens";

fs.writeFileSync("tokens.css", toCss({ prefix: "app" })); // --app-theme-primary, ...
```

## Token reference

| Group | Keys | CSS variable |
| --- | --- | --- |
| `color` | `slate`, `indigo`, `cyan`, `green`, `amber`, `red` (50–950) | `--fet-color-indigo-600` |
| `space` | `0`, `px`, `0.5` … `24` (multiples of 4px) | `--fet-space-4`, `--fet-space-0_5` |
| `radius` | `none`, `sm`, `md`, `lg`, `xl`, `full` | `--fet-radius-md` |
| `font` | `family`, `size` (`xs`–`4xl`), `lineHeight`, `weight` | `--fet-font-size-lg` |
| `shadow` | `sm`, `md`, `lg` | `--fet-shadow-md` |
| `motion` | `duration` (`fast`/`normal`/`slow`), `easing` | `--fet-motion-easing-standard` |
| `breakpoint` | `sm` 640, `md` 768, `lg` 1024, `xl` 1280 | `--fet-breakpoint-md` |
| `zIndex` | `dropdown`, `sticky`, `overlay`, `modal`, `toast` | `--fet-z-index-modal` |
| `theme` | `bg`, `bgSubtle`, `surface`, `fg`, `fgMuted`, `border`, `primary`, `primaryHover`, `onPrimary`, `accent`, `success`, `warning`, `danger`, `focusRing` | `--fet-theme-fg-muted` |

::: tip CSS variables don't work in media queries
`@media (min-width: var(--fet-breakpoint-md))` is invalid. Use the numbers from the `breakpoint`
object in JS, or write the value directly in CSS.
:::

Related concepts: [03 CSS](/en/roadmap/03-css), [08 CSS Architecture](/en/roadmap/08-css-architecture).
