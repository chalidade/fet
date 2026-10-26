import { describe, expect, it } from "vitest";
import { flatten, theme, themeVar, toCss } from "./index";

describe("flatten", () => {
  it("meratakan objek bertingkat menjadi nama CSS variable", () => {
    expect(flatten({ color: { indigo: { 500: "#6366f1" } }, font: { lineHeight: { tight: "1.2" } } })).toEqual({
      "--fet-color-indigo-500": "#6366f1",
      "--fet-font-line-height-tight": "1.2",
    });
  });

  it("menambahkan px ke angka dan mengganti titik", () => {
    expect(flatten({ space: { 0.5: "0.125rem" }, breakpoint: { sm: 640 } }, "x")).toEqual({
      "--x-space-0_5": "0.125rem",
      "--x-breakpoint-sm": "640px",
    });
  });
});

describe("toCss", () => {
  const css = toCss();

  it("memuat token dasar dan semantik di :root", () => {
    expect(css).toContain("--fet-color-indigo-600: #4f46e5;");
    expect(css).toContain("--fet-space-4: 1rem;");
    expect(css).toContain("--fet-theme-primary: #4f46e5;");
  });

  it("menyediakan mode gelap lewat media query dan data-theme", () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toMatch(/\[data-theme="dark"\] \{[^}]*--fet-theme-bg: #020617;/);
  });

  it("memakai prefix kustom", () => {
    expect(toCss({ prefix: "app" })).toContain("--app-theme-fg:");
  });
});

describe("theme", () => {
  it("mode terang dan gelap punya kunci yang sama", () => {
    expect(Object.keys(theme.dark).sort()).toEqual(Object.keys(theme.light).sort());
  });

  it("themeVar menghasilkan referensi var()", () => {
    expect(themeVar("primaryHover")).toBe("var(--fet-theme-primary-hover)");
  });
});
