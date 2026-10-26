import { createLearnTheme } from "@chalidade/learn-theme";
import HomePage from "./components/HomePage.vue";
import { phases, stages } from "../stages";
import { data as concepts } from "../concepts.data";

export default createLearnTheme(
  {
    siteName: "fet",
    subject: { id: "front-end", en: "front-end" },
    stages,
    phases,
    concepts,
  },
  ({ app }) => {
    app.component("HomePage", HomePage);
  },
);
