import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import LearningRoom from "./components/LearningRoom.vue";
import CommunityFeed from "./components/CommunityFeed.vue";
import PostDetail from "./components/PostDetail.vue";
import ProfilePage from "./components/ProfilePage.vue";
import EvidencePage from "./components/EvidencePage.vue";
import { configure, type LearnConfig } from "./lib/config";
import { initSession } from "./lib/supabase";
import "./style.css";

export type { ConceptData, LearnConfig, PhaseInfo, StageInfo } from "./lib/config";
export { config, findStage, stageNumber } from "./lib/config";
export { href, paths, query, type Lang } from "./lib/routes";
export { useLang } from "./lib/useLang";
export type { IconName } from "./lib/icons";
export { default as Icon } from "./components/Icon.vue";

/**
 * Tema VitePress untuk situs belajar: Ruang Belajar, komunitas, profil, Bukti Belajar,
 * dan banner progres di halaman tahap roadmap. Supabase dan Google Drive dibaca dari
 * VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, dan VITE_GOOGLE_CLIENT_ID.
 */
export function createLearnTheme(options: Partial<LearnConfig>, extend?: Theme["enhanceApp"]): Theme {
  configure(options);
  return {
    extends: DefaultTheme,
    Layout,
    async enhanceApp(ctx) {
      ctx.app.component("LearningRoom", LearningRoom);
      ctx.app.component("CommunityFeed", CommunityFeed);
      ctx.app.component("PostDetail", PostDetail);
      ctx.app.component("ProfilePage", ProfilePage);
      ctx.app.component("EvidencePage", EvidencePage);
      if (typeof window !== "undefined") initSession();
      await extend?.(ctx);
    },
  };
}
