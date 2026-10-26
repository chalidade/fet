/** Daftar tahap roadmap, dipakai oleh config (sidebar) dan Ruang Belajar. */
export const stages = [
  { slug: "01-internet", title: "Internet" },
  { slug: "02-html", title: "HTML" },
  { slug: "03-css", title: "CSS" },
  { slug: "04-javascript", title: "JavaScript" },
  { slug: "05-git-vcs", title: "Git & VCS" },
  { slug: "06-package-managers", title: "Package Managers" },
  { slug: "07-framework", title: "Framework" },
  { slug: "08-css-architecture", title: "CSS Architecture" },
  { slug: "09-build-tools", title: "Build Tools" },
  { slug: "10-linters-formatters", title: "Linters & Formatters" },
  { slug: "11-testing", title: "Testing" },
  { slug: "12-typescript", title: "TypeScript" },
  { slug: "13-web-security", title: "Web Security" },
  { slug: "14-authentication", title: "Authentication" },
  { slug: "15-web-components", title: "Web Components" },
  { slug: "16-performance", title: "Performance" },
  { slug: "17-browser-apis", title: "Browser APIs & PWA" },
  { slug: "18-rendering-strategies", title: "Rendering Strategies" },
  { slug: "19-graphql-data-fetching", title: "GraphQL & Data Fetching" },
  { slug: "20-mobile-desktop", title: "Mobile & Desktop" },
] as const;

export type Stage = (typeof stages)[number];
export type StageSlug = Stage["slug"];

export function findStage(slug: string | null | undefined): Stage | undefined {
  return stages.find((s) => s.slug === slug);
}

/** Pengelompokan tahap ke dalam fase; `range` adalah indeks [awal, akhir) di `stages`. */
export const phases: Array<{ id: string; en: string; range: [number, number] }> = [
  { id: "Fase 1 · Fondasi Web", en: "Phase 1 · Web Foundations", range: [0, 4] },
  { id: "Fase 2 · Workflow", en: "Phase 2 · Workflow", range: [4, 6] },
  { id: "Fase 3 · Framework & Styling", en: "Phase 3 · Framework & Styling", range: [6, 8] },
  { id: "Fase 4 · Tooling & Kualitas", en: "Phase 4 · Tooling & Quality", range: [8, 12] },
  { id: "Fase 5 · Platform & Keamanan", en: "Phase 5 · Platform & Security", range: [12, 15] },
  { id: "Fase 6 · Performance & Browser APIs", en: "Phase 6 · Performance & Browser APIs", range: [15, 17] },
  { id: "Fase 7 · Rendering & Data", en: "Phase 7 · Rendering & Data", range: [17, 19] },
  { id: "Fase 8 · Di Luar Browser", en: "Phase 8 · Beyond the Browser", range: [19, 20] },
];
