<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vitepress";
import { findStage } from "../../stages";
import { isConfigured, session } from "../lib/supabase";
import { getStatuses, stageStats } from "../lib/api";
import { loadDraft, type Status } from "../lib/storage";
import { href, paths } from "../lib/routes";
import { useLang } from "../lib/useLang";
import Icon from "./Icon.vue";

const route = useRoute();
const { lang, s } = useLang();

const stage = computed(() => {
  const m = route.path.match(/\/roadmap\/(\d{2}-[a-z0-9-]+?)(?:\.html)?$/);
  return findStage(m?.[1]);
});

const stats = ref<{ learning: number; done: number } | null>(null);
const status = ref<Status>("not-started");

watch(
  [stage, () => session.user?.id],
  async ([st, userId]) => {
    stats.value = null;
    if (!st) return;
    status.value = loadDraft(st.slug)?.status ?? "not-started";
    if (!isConfigured) return;
    try {
      stats.value = await stageStats(st.slug);
      if (userId) status.value = (await getStatuses(userId))[st.slug] ?? status.value;
    } catch {
      // Statistik hanya pelengkap; abaikan kalau gagal.
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="stage" class="fet-stage-banner">
    <div class="fet-stage-banner__text">
      <strong>{{ s.banner.pitch }}</strong>
      <span class="fet-muted">{{ s.banner.pitchSub }}</span>
      <span class="fet-row fet-small" style="margin-top: 4px">
        <span v-if="status !== 'not-started'" class="fet-badge" :data-status="status">{{ s.status[status] }}</span>
        <span v-if="stats" class="fet-muted fet-meta-item">
          <Icon name="users" :size="14" /> {{ s.banner.learning(stats.learning) }} · {{ s.banner.done(stats.done) }}
        </span>
      </span>
    </div>
    <div class="fet-stage-banner__actions">
      <a v-if="isConfigured" class="fet-link fet-small" :href="href(paths(lang).community(stage.slug))">{{ s.banner.community }}</a>
      <a class="fet-btn" :href="href(paths(lang).room(stage.slug))">
        {{ status === "not-started" ? s.banner.start : s.banner.continue }} <Icon name="arrow-right" />
      </a>
    </div>
  </div>
</template>
