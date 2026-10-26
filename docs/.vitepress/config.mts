import { defineConfig, type DefaultTheme } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { stages } from "./stages";

const REPO = "https://github.com/chalidade/fet";


const phases: Array<{ id: string; en: string; range: [number, number] }> = [
  { id: "Fase 1 · Fondasi Web", en: "Phase 1 · Web Foundations", range: [0, 4] },
  { id: "Fase 2 · Workflow", en: "Phase 2 · Workflow", range: [4, 6] },
  { id: "Fase 3 · Framework & Styling", en: "Phase 3 · Framework & Styling", range: [6, 8] },
  { id: "Fase 4 · Tooling & Kualitas", en: "Phase 4 · Tooling & Quality", range: [8, 12] },
  { id: "Fase 5 · Platform & Keamanan", en: "Phase 5 · Platform & Security", range: [12, 15] },
  { id: "Fase 6 · Performance & Browser APIs", en: "Phase 6 · Performance & Browser APIs", range: [15, 17] },
  { id: "Fase 7 · Rendering & Data", en: "Phase 7 · Rendering & Data", range: [17, 19] },
  { id: "Fase 8 · Di Luar Browser", en: "Phase 8 · Beyond the Browser", range: [19, 20] },
];

function sidebar(lang: "id" | "en"): DefaultTheme.Sidebar {
  const p = lang === "id" ? "" : "/en";
  const t = (id: string, en: string) => (lang === "id" ? id : en);

  const roadmapGroups: DefaultTheme.SidebarItem[] = phases.map((phase) => ({
    text: phase[lang],
    collapsed: false,
    items: stages.slice(...phase.range).map(({ slug, title }) => ({
      text: `${slug.slice(0, 2)} · ${title}`,
      link: `${p}/roadmap/${slug}`,
    })),
  }));

  const intro: DefaultTheme.SidebarItem = {
    text: t("Mulai", "Start here"),
    items: [
      { text: t("Apa itu fet?", "What is fet?"), link: `${p}/guide/` },
      { text: t("Metode belajar", "How to learn"), link: `${p}/how-to-learn` },
      { text: t("Catatan eksperimen", "Experiment notes"), link: `${p}/notes/` },
    ],
  };

  return {
    [`${p}/roadmap/`]: [
      intro,
      { text: t("Peta roadmap", "Roadmap overview"), link: `${p}/roadmap/` },
      ...roadmapGroups,
    ],
    [`${p}/deep-dives/`]: [
      {
        text: "Deep dives",
        items: [
          { text: t("Daftar topik", "All topics"), link: `${p}/deep-dives/` },
          { text: "Event Loop", link: `${p}/deep-dives/event-loop` },
          { text: "Browser Rendering Pipeline", link: `${p}/deep-dives/browser-rendering-pipeline` },
        ],
      },
    ],
    [`${p}/toolkit/`]: [
      {
        text: "Toolkit",
        items: [
          { text: t("Ringkasan", "Overview"), link: `${p}/toolkit/` },
          { text: "@chalidade/utils", link: `${p}/toolkit/utils` },
        ],
      },
    ],
    [`${p}/`]: [intro, { text: "Roadmap", link: `${p}/roadmap/` }],
  };
}

function nav(lang: "id" | "en"): DefaultTheme.NavItem[] {
  const p = lang === "id" ? "" : "/en";
  const t = (id: string, en: string) => (lang === "id" ? id : en);
  return [
    { text: t("Panduan", "Guide"), link: `${p}/guide/`, activeMatch: `^${p}/(guide|how-to-learn|notes)` },
    { text: "Roadmap", link: `${p}/roadmap/`, activeMatch: `^${p}/roadmap/` },
    { text: "Deep dives", link: `${p}/deep-dives/`, activeMatch: `^${p}/deep-dives/` },
    { text: "Toolkit", link: `${p}/toolkit/`, activeMatch: `^${p}/toolkit/` },
    {
      text: t("Ruang Belajar", "Learning Room"),
      link: lang === "id" ? "/ruang-belajar" : "/en/learning-room",
      activeMatch: lang === "id" ? "^/ruang-belajar" : "^/en/learning-room",
    },
    {
      text: t("Komunitas", "Community"),
      link: lang === "id" ? "/komunitas/" : "/en/community/",
      activeMatch: lang === "id" ? "^/(komunitas|profil)" : "^/en/(community|profile)",
    },
  ];
}

export default withMermaid(
  defineConfig({
    title: "fet",
    description: "Front-End Toolkits: roadmap, deep dives, and installable toolkits for front-end developers.",
    base: "/fet/",
    cleanUrls: true,
    lastUpdated: true,
    srcExclude: ["templates/**"],
    head: [
      ["link", { rel: "icon", type: "image/svg+xml", href: "/fet/logo.svg" }],
      ["meta", { name: "theme-color", content: "#5b6cff" }],
    ],

    locales: {
      root: {
        label: "Bahasa Indonesia",
        lang: "id-ID",
        description: "Roadmap, panduan deep dive, dan toolkit front-end yang bisa di-install.",
        themeConfig: {
          nav: nav("id"),
          sidebar: sidebar("id"),
          outline: { label: "Di halaman ini", level: [2, 3] },
          docFooter: { prev: "Sebelumnya", next: "Berikutnya" },
          lastUpdated: { text: "Terakhir diperbarui" },
          editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: "Perbaiki halaman ini di GitHub" },
          returnToTopLabel: "Kembali ke atas",
          sidebarMenuLabel: "Menu",
          darkModeSwitchLabel: "Tema",
          langMenuLabel: "Ganti bahasa",
        },
      },
      en: {
        label: "English",
        lang: "en-US",
        link: "/en/",
        themeConfig: {
          nav: nav("en"),
          sidebar: sidebar("en"),
          outline: { level: [2, 3] },
          editLink: { pattern: `${REPO}/edit/main/docs/:path`, text: "Edit this page on GitHub" },
        },
      },
    },

    themeConfig: {
      logo: "/logo.svg",
      socialLinks: [{ icon: "github", link: REPO }],
      search: {
        provider: "local",
        options: {
          locales: {
            root: {
              translations: {
                button: { buttonText: "Cari", buttonAriaLabel: "Cari" },
                modal: {
                  noResultsText: "Tidak ada hasil untuk",
                  resetButtonTitle: "Hapus pencarian",
                  footer: { selectText: "pilih", navigateText: "navigasi", closeText: "tutup" },
                },
              },
            },
          },
        },
      },
      footer: {
        message: "MIT License",
        copyright: "© 2026 Chalid Ade Rahman",
      },
    },
  }),
);
