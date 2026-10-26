import { theme, tokens, type ThemeToken } from "./tokens";

export interface CssOptions {
  /** Awalan nama variabel. Default `fet`, jadi hasilnya `--fet-color-indigo-500`. */
  prefix?: string;
}

type Tree = { readonly [key: string]: string | number | Tree };

/** `fontSize` → `font-size`, `0.5` → `0_5` (titik tidak valid di nama variabel tanpa escape). */
function segment(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/\./g, "_").toLowerCase();
}

/** Ratakan objek bertingkat menjadi pasangan `--prefix-a-b-c: value`. */
export function flatten(tree: Tree, prefix = "fet"): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: Tree, path: string) => {
    for (const [key, value] of Object.entries(node)) {
      const name = `${path}-${segment(key)}`;
      if (typeof value === "object") walk(value, name);
      else out[name] = typeof value === "number" ? `${value}px` : value;
    }
  };
  walk(tree, `--${prefix}`);
  return out;
}

function block(selector: string, vars: Record<string, string>, indent = ""): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `${indent}  ${name}: ${value};`)
    .join("\n");
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

/**
 * Hasilkan stylesheet berisi semua token sebagai CSS variables.
 * Mode gelap aktif lewat `prefers-color-scheme: dark`, atau dipaksa dengan
 * atribut `data-theme="dark"` / `data-theme="light"` di elemen mana pun.
 */
export function toCss(options: CssOptions = {}): string {
  const prefix = options.prefix ?? "fet";
  const themeVars = (name: keyof typeof theme) => flatten({ theme: theme[name] }, prefix);
  return [
    block(":root", { ...flatten(tokens as unknown as Tree, prefix), ...themeVars("light") }),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', themeVars("dark"), "  ")}\n}`,
    block('[data-theme="dark"]', themeVars("dark")),
    block('[data-theme="light"]', themeVars("light")),
  ].join("\n\n") + "\n";
}

/** Referensi aman-tipe ke token semantik: `themeVar("primary")` → `var(--fet-theme-primary)`. */
export function themeVar(name: ThemeToken, prefix = "fet"): string {
  return `var(--${prefix}-theme-${segment(name)})`;
}
