import { computed } from "vue";
import { useData } from "vitepress";
import { langOf } from "./routes";
import { t } from "./i18n";

export function useLang() {
  const { lang: vpLang } = useData();
  const lang = computed(() => langOf(vpLang.value));
  const s = computed(() => t(lang.value));
  return { lang, s };
}
