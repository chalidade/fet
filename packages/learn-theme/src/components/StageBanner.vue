<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vitepress";
import { findStage } from "../lib/config";
import { isConfigured, session } from "../lib/supabase";
import { getChecklist, getStatuses, saveChecklist as saveChecklistCloud, setStatus, stageStats } from "../lib/api";
import { loadChecklist, loadDraft, saveChecklist, saveDraft, starter, type Status } from "../lib/storage";
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

// ---------------------------------------------------------------- checklist peta konsep

const checked = ref(new Set<number>());
const total = ref(0);
let boxes: HTMLInputElement[] = [];
let cloudTimer: ReturnType<typeof setTimeout> | undefined;

function paint() {
  for (const box of boxes) box.checked = checked.value.has(Number(box.dataset.task));
}

async function loadChecked(slug: string) {
  checked.value = new Set(loadChecklist(slug));
  if (!isConfigured || !session.user) return;
  try {
    const cloud = await getChecklist(slug);
    if (cloud?.length) {
      checked.value = new Set(cloud);
      saveChecklist(slug, cloud);
    } else if (checked.value.size) {
      // Centang yang dibuat sebelum login ikut disimpan ke akun.
      await saveChecklistCloud(slug, [...checked.value]);
    }
  } catch {
    // Kolom belum ada atau offline: tetap pakai simpanan lokal.
  }
}

function toggle(slug: string, index: number, on: boolean) {
  const next = new Set(checked.value);
  if (on) next.add(index);
  else next.delete(index);
  checked.value = next;
  const list = [...next].sort((a, b) => a - b);
  saveChecklist(slug, list);
  if (on && status.value === "not-started") markInProgress(slug);
  if (isConfigured && session.user) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => void saveChecklistCloud(slug, list).catch(() => undefined), 800);
  }
}

// Mencentang konsep pertama berarti tahap ini mulai dipelajari.
function markInProgress(slug: string) {
  status.value = "in-progress";
  const st = stage.value;
  if (!st) return;
  const draft = loadDraft(slug) ?? starter(slug, st.title, lang.value);
  saveDraft(slug, { ...draft, status: "in-progress" });
  if (isConfigured && session.user) void setStatus(slug, "in-progress").catch(() => undefined);
}

watch(
  [stage, () => session.ready, () => session.user?.id],
  async ([st, ready]) => {
    boxes = [];
    total.value = 0;
    if (!st || !ready) return;
    await nextTick();
    boxes = [...document.querySelectorAll<HTMLInputElement>(".vp-doc input.fet-task")];
    total.value = boxes.length;
    for (const box of boxes) {
      box.disabled = false;
      box.onchange = () => toggle(st.slug, Number(box.dataset.task), box.checked);
    }
    await loadChecked(st.slug);
    paint();
  },
  { immediate: true, flush: "post" },
);

onBeforeUnmount(() => clearTimeout(cloudTimer));
</script>

<template>
  <div v-if="stage" class="fet-stage-banner">
    <div class="fet-stage-banner__text">
      <strong>{{ s.banner.pitch }}</strong>
      <span class="fet-muted">{{ s.banner.pitchSub }}</span>
      <span v-if="total" class="fet-concepts">
        <span class="fet-progress-bar"><span :style="{ width: `${(checked.size / total) * 100}%` }" /></span>
        <span class="fet-small fet-muted">{{ s.banner.concepts(checked.size, total) }}</span>
      </span>
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
