# @chalidade/tokens

Design tokens: satu sumber nilai untuk warna, spacing, radius, tipografi, shadow, motion,
breakpoint, dan z-index. Bisa dipakai sebagai **objek TypeScript** atau **CSS variables**
(lengkap dengan mode gelap).

```bash
pnpm add @chalidade/tokens
```

::: warning Belum dipublish
Package ini belum dipublish ke npm. Sementara ini, salin source-nya dari
[GitHub](https://github.com/chalidade/front-end-training/tree/main/packages/tokens/src).
:::

## Kenapa design tokens?

Tanpa token, nilai seperti `#4f46e5` atau `12px` tersebar di ratusan tempat. Rebranding atau
menambah mode gelap berarti mencari dan mengganti satu per satu. Token memisahkan dua lapis:

| Lapis | Contoh | Dipakai oleh |
| --- | --- | --- |
| **Primitive** | `color.indigo[600]`, `space[4]` | Hanya oleh token semantik |
| **Semantik** | `theme.light.primary`, `theme.dark.bg` | Komponen |

Komponen hanya tahu "warna utama" atau "latar", bukan hex-nya. Mode gelap cukup mengganti
nilai token semantik.

## Memakai CSS variables

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

Mode gelap aktif otomatis lewat `prefers-color-scheme`. Untuk memaksa, pasang
`data-theme="dark"` atau `data-theme="light"` di `<html>` atau elemen mana pun.

## Memakai di TypeScript / CSS-in-JS

```ts
import { breakpoint, space, themeVar } from "@chalidade/tokens";

const styles = {
  padding: space[4],                 // "1rem"
  color: themeVar("fgMuted"),        // "var(--fet-theme-fg-muted)"
};
const isWide = window.matchMedia(`(min-width: ${breakpoint.md}px)`).matches;
```

## Membuat CSS dengan prefix sendiri

```ts
import { toCss } from "@chalidade/tokens";

fs.writeFileSync("tokens.css", toCss({ prefix: "app" })); // --app-theme-primary, ...
```

## Daftar token

| Grup | Kunci | Variabel CSS |
| --- | --- | --- |
| `color` | `slate`, `indigo`, `cyan`, `green`, `amber`, `red` (50–950) | `--fet-color-indigo-600` |
| `space` | `0`, `px`, `0.5` … `24` (kelipatan 4px) | `--fet-space-4`, `--fet-space-0_5` |
| `radius` | `none`, `sm`, `md`, `lg`, `xl`, `full` | `--fet-radius-md` |
| `font` | `family`, `size` (`xs`–`4xl`), `lineHeight`, `weight` | `--fet-font-size-lg` |
| `shadow` | `sm`, `md`, `lg` | `--fet-shadow-md` |
| `motion` | `duration` (`fast`/`normal`/`slow`), `easing` | `--fet-motion-easing-standard` |
| `breakpoint` | `sm` 640, `md` 768, `lg` 1024, `xl` 1280 | `--fet-breakpoint-md` |
| `zIndex` | `dropdown`, `sticky`, `overlay`, `modal`, `toast` | `--fet-z-index-modal` |
| `theme` | `bg`, `bgSubtle`, `surface`, `fg`, `fgMuted`, `border`, `primary`, `primaryHover`, `onPrimary`, `accent`, `success`, `warning`, `danger`, `focusRing` | `--fet-theme-fg-muted` |

::: tip CSS variables tidak bisa dipakai di media query
`@media (min-width: var(--fet-breakpoint-md))` tidak valid. Pakai angka dari objek `breakpoint`
di JS, atau tulis nilainya langsung di CSS.
:::

Konsep terkait: [03 CSS](/roadmap/03-css), [08 CSS Architecture](/roadmap/08-css-architecture).
