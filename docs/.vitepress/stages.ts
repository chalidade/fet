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
