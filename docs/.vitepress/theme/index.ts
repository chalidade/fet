import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import LearningRoom from "./components/LearningRoom.vue";
import CommunityFeed from "./components/CommunityFeed.vue";
import PostDetail from "./components/PostDetail.vue";
import ProfilePage from "./components/ProfilePage.vue";
import HomePage from "./components/HomePage.vue";
import EvidencePage from "./components/EvidencePage.vue";
import { initSession } from "./lib/supabase";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LearningRoom", LearningRoom);
    app.component("CommunityFeed", CommunityFeed);
    app.component("PostDetail", PostDetail);
    app.component("ProfilePage", ProfilePage);
    app.component("HomePage", HomePage);
    app.component("EvidencePage", EvidencePage);
    if (typeof window !== "undefined") initSession();
  },
} satisfies Theme;
