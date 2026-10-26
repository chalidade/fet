# @chalidade/tokens

Design tokens untuk front-end: warna, spacing, radius, tipografi, shadow, motion, breakpoint, dan
z-index. Tersedia sebagai objek TypeScript dan sebagai CSS variables (lengkap dengan mode gelap).

```ts
import "@chalidade/tokens/tokens.css";
import { space, themeVar } from "@chalidade/tokens";

const card = { padding: space[4], background: themeVar("surface") };
```

```css
.button {
  background: var(--fet-theme-primary);
  color: var(--fet-theme-on-primary);
  border-radius: var(--fet-radius-md);
  padding: var(--fet-space-2) var(--fet-space-4);
}
```

Dokumentasi lengkap: https://chalidade.github.io/fet/toolkit/tokens
